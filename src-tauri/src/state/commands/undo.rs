use super::types::CommandResult;
use crate::state::{EventBus, ProjectEvent, ProjectState};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Maximum number of undo/redo actions to keep in history
const MAX_HISTORY_SIZE: usize = 100;

/// Undo/Redo action data
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UndoAction {
  pub id: String,
  pub action_type: String,
  pub description: String,
  pub timestamp: chrono::DateTime<Utc>,
  pub undo_data: serde_json::Value,
  pub redo_data: serde_json::Value,
}

/// Undo/Redo state
#[derive(Debug, Default)]
pub struct UndoRedoState {
  undo_stack: VecDeque<UndoAction>,
  redo_stack: VecDeque<UndoAction>,
}

impl UndoRedoState {
  pub fn new() -> Self {
    Self {
      undo_stack: VecDeque::new(),
      redo_stack: VecDeque::new(),
    }
  }

  pub fn push_action(&mut self, action: UndoAction) {
    // Clear redo stack when new action is added
    self.redo_stack.clear();

    // Add to undo stack
    self.undo_stack.push_back(action);

    // Trim if exceeds max size
    if self.undo_stack.len() > MAX_HISTORY_SIZE {
      self.undo_stack.pop_front();
    }
  }

  pub fn undo(&mut self) -> Option<UndoAction> {
    if let Some(action) = self.undo_stack.pop_back() {
      self.redo_stack.push_back(action.clone());
      Some(action)
    } else {
      None
    }
  }

  pub fn redo(&mut self) -> Option<UndoAction> {
    if let Some(action) = self.redo_stack.pop_back() {
      self.undo_stack.push_back(action.clone());
      Some(action)
    } else {
      None
    }
  }

  pub fn clear(&mut self) {
    self.undo_stack.clear();
    self.redo_stack.clear();
  }

  pub fn get_undo_history(&self) -> Vec<UndoAction> {
    self.undo_stack.iter().cloned().collect()
  }

  pub fn get_redo_history(&self) -> Vec<UndoAction> {
    self.redo_stack.iter().cloned().collect()
  }

  pub fn can_undo(&self) -> bool {
    !self.undo_stack.is_empty()
  }

  pub fn can_redo(&self) -> bool {
    !self.redo_stack.is_empty()
  }
}

/// Undo/Redo commands implementation
pub struct UndoCommands {
  state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
  undo_state: Arc<RwLock<UndoRedoState>>,
}

impl UndoCommands {
  pub fn new(state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self {
      state,
      event_bus,
      undo_state: Arc::new(RwLock::new(UndoRedoState::new())),
    }
  }

  /// Register a new action in the undo history
  pub async fn register_action(&self, action: UndoAction) -> CommandResult {
    log::debug!(
      "Registering undo action: {} ({})",
      action.description,
      action.id
    );

    let mut undo_state = self.undo_state.write().await;
    undo_state.push_action(action.clone());

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::ActionRegistered {
          action_id: action.id.clone(),
          action_type: action.action_type.clone(),
          description: action.description.clone(),
          timestamp: action.timestamp,
        },
        "undo_commands".to_string(),
        self.state.read().await.version,
      )
      .await
      .ok();

    CommandResult::success(Some(serde_json::json!({
      "action_id": action.id,
      "can_undo": undo_state.can_undo(),
      "can_redo": undo_state.can_redo(),
    })))
  }

  /// Perform undo operation
  pub async fn undo(&self) -> CommandResult {
    let mut undo_state = self.undo_state.write().await;

    match undo_state.undo() {
      Some(action) => {
        log::info!("Performing undo: {} ({})", action.description, action.id);

        // Publish event
        self
          .event_bus
          .publish(
            ProjectEvent::UndoPerformed {
              action_id: action.id.clone(),
              action_type: action.action_type.clone(),
              description: action.description.clone(),
            },
            "undo_commands".to_string(),
            self.state.read().await.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({
          "action": action,
          "can_undo": undo_state.can_undo(),
          "can_redo": undo_state.can_redo(),
        })))
      }
      None => CommandResult::error("Nothing to undo".to_string()),
    }
  }

  /// Perform redo operation
  pub async fn redo(&self) -> CommandResult {
    let mut undo_state = self.undo_state.write().await;

    match undo_state.redo() {
      Some(action) => {
        log::info!("Performing redo: {} ({})", action.description, action.id);

        // Publish event
        self
          .event_bus
          .publish(
            ProjectEvent::RedoPerformed {
              action_id: action.id.clone(),
              action_type: action.action_type.clone(),
              description: action.description.clone(),
            },
            "undo_commands".to_string(),
            self.state.read().await.version,
          )
          .await
          .ok();

        CommandResult::success(Some(serde_json::json!({
          "action": action,
          "can_undo": undo_state.can_undo(),
          "can_redo": undo_state.can_redo(),
        })))
      }
      None => CommandResult::error("Nothing to redo".to_string()),
    }
  }

  /// Get undo history
  pub async fn get_undo_history(&self) -> CommandResult {
    let undo_state = self.undo_state.read().await;

    CommandResult::success(Some(serde_json::json!({
      "undo_history": undo_state.get_undo_history(),
      "redo_history": undo_state.get_redo_history(),
      "can_undo": undo_state.can_undo(),
      "can_redo": undo_state.can_redo(),
    })))
  }

  /// Clear undo/redo history
  pub async fn clear_history(&self) -> CommandResult {
    let mut undo_state = self.undo_state.write().await;
    undo_state.clear();

    // Publish event
    self
      .event_bus
      .publish(
        ProjectEvent::UndoHistoryCleared,
        "undo_commands".to_string(),
        self.state.read().await.version,
      )
      .await
      .ok();

    CommandResult::success(None)
  }

  /// Check if undo is available
  pub async fn can_undo(&self) -> CommandResult {
    let undo_state = self.undo_state.read().await;
    CommandResult::success(Some(serde_json::json!({
      "can_undo": undo_state.can_undo()
    })))
  }

  /// Check if redo is available
  pub async fn can_redo(&self) -> CommandResult {
    let undo_state = self.undo_state.read().await;
    CommandResult::success(Some(serde_json::json!({
      "can_redo": undo_state.can_redo()
    })))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_undo_redo_state() {
    let mut state = UndoRedoState::new();

    assert!(!state.can_undo());
    assert!(!state.can_redo());

    // Add action
    let action1 = UndoAction {
      id: "action1".to_string(),
      action_type: "ADD_CLIP".to_string(),
      description: "Add clip".to_string(),
      timestamp: Utc::now(),
      undo_data: serde_json::json!({}),
      redo_data: serde_json::json!({}),
    };

    state.push_action(action1.clone());
    assert!(state.can_undo());
    assert!(!state.can_redo());

    // Undo
    let undone = state.undo();
    assert!(undone.is_some());
    assert!(!state.can_undo());
    assert!(state.can_redo());

    // Redo
    let redone = state.redo();
    assert!(redone.is_some());
    assert!(state.can_undo());
    assert!(!state.can_redo());
  }

  #[test]
  fn test_max_history_size() {
    let mut state = UndoRedoState::new();

    // Add more than MAX_HISTORY_SIZE actions
    for i in 0..MAX_HISTORY_SIZE + 10 {
      let action = UndoAction {
        id: format!("action{}", i),
        action_type: "TEST".to_string(),
        description: format!("Test action {}", i),
        timestamp: Utc::now(),
        undo_data: serde_json::json!({}),
        redo_data: serde_json::json!({}),
      };
      state.push_action(action);
    }

    // Should not exceed MAX_HISTORY_SIZE
    assert_eq!(state.undo_stack.len(), MAX_HISTORY_SIZE);
  }

  #[test]
  fn test_redo_cleared_on_new_action() {
    let mut state = UndoRedoState::new();

    let action1 = UndoAction {
      id: "action1".to_string(),
      action_type: "TEST".to_string(),
      description: "Action 1".to_string(),
      timestamp: Utc::now(),
      undo_data: serde_json::json!({}),
      redo_data: serde_json::json!({}),
    };

    let action2 = UndoAction {
      id: "action2".to_string(),
      action_type: "TEST".to_string(),
      description: "Action 2".to_string(),
      timestamp: Utc::now(),
      undo_data: serde_json::json!({}),
      redo_data: serde_json::json!({}),
    };

    state.push_action(action1);
    state.undo();
    assert!(state.can_redo());

    // Adding new action should clear redo stack
    state.push_action(action2);
    assert!(!state.can_redo());
  }
}

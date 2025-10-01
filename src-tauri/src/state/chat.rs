use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

/// Chat session structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ChatSession {
  pub id: String,
  pub name: String,
  pub messages: Vec<ChatMessage>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub metadata: Option<serde_json::Value>,
}

/// Chat message structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ChatMessage {
  pub id: String,
  pub content: String,
  pub role: MessageRole,
  pub timestamp: DateTime<Utc>,
  pub metadata: Option<serde_json::Value>,
}

/// Message role in chat
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
  User,
  Assistant,
  System,
}

/// Chat-related commands
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "params")]
pub enum ChatCommand {
  /// Create a new chat session
  CreateChatSession { name: Option<String> },
  /// Delete a chat session
  DeleteChatSession { session_id: String },
  /// Add message to chat session
  SendChatMessage {
    session_id: String,
    content: String,
    role: MessageRole,
  },
  /// Clear messages in a session
  ClearChatSession { session_id: String },
  /// Update chat session metadata
  UpdateChatSession {
    session_id: String,
    name: Option<String>,
    metadata: Option<serde_json::Value>,
  },
}

/// Chat-related events
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "data")]
pub enum ChatEvent {
  /// New chat session created
  ChatSessionCreated { session: ChatSession },
  /// Chat session deleted
  ChatSessionDeleted { session_id: String },
  /// New message added to chat
  ChatMessageAdded {
    session_id: String,
    message: ChatMessage,
  },
  /// Chat session cleared
  ChatSessionCleared { session_id: String },
  /// Chat session updated
  ChatSessionUpdated {
    session_id: String,
    name: Option<String>,
    metadata: Option<serde_json::Value>,
  },
}

impl ChatSession {
  /// Create a new chat session
  pub fn new(name: Option<String>) -> Self {
    let now = Utc::now();
    Self {
      id: Uuid::new_v4().to_string(),
      name: name.unwrap_or_else(|| format!("Chat {}", now.format("%Y-%m-%d %H:%M"))),
      messages: Vec::new(),
      created_at: now,
      updated_at: now,
      metadata: None,
    }
  }

  /// Add a message to the session
  pub fn add_message(&mut self, content: String, role: MessageRole) -> ChatMessage {
    let message = ChatMessage {
      id: Uuid::new_v4().to_string(),
      content,
      role,
      timestamp: Utc::now(),
      metadata: None,
    };
    self.messages.push(message.clone());
    self.updated_at = Utc::now();
    message
  }

  /// Clear all messages
  pub fn clear_messages(&mut self) {
    self.messages.clear();
    self.updated_at = Utc::now();
  }

  /// Update session metadata
  pub fn update(&mut self, name: Option<String>, metadata: Option<serde_json::Value>) {
    if let Some(new_name) = name {
      self.name = new_name;
    }
    if metadata.is_some() {
      self.metadata = metadata;
    }
    self.updated_at = Utc::now();
  }
}

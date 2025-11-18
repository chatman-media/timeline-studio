//! Tauri команды для MCP интеграции

use super::server::MCPServer;
use super::types::{MCPConfig, MCPToolRequest, MCPToolResult};
use crate::state::StateManager;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// State для MCP сервера
pub struct MCPServerState(pub Arc<RwLock<Option<MCPServer>>>);

/// Сообщение в чате
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ChatMessage {
  pub role: String,
  pub content: String,
}

/// Результат чата
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ChatResponse {
  pub success: bool,
  pub message: Option<String>,
  pub error: Option<String>,
}

/// Инициализировать MCP сервер
#[tauri::command]
#[specta::specta]
pub async fn mcp_initialize(
  config: MCPConfig,
  mcp_state: State<'_, MCPServerState>,
  state_manager: State<'_, StateManager>,
) -> Result<bool, String> {
  log::info!("Initializing MCP server with StateManager");

  // Получаем project_state и event_bus из StateManager
  let project_state = state_manager.project_state().clone();
  let event_bus = state_manager.event_bus().clone();

  // Создаем MCP сервер с доступом к state
  let server = MCPServer::with_state(config, project_state, event_bus);

  let mut state_guard = mcp_state.0.write().await;
  *state_guard = Some(server);

  log::info!("MCP server initialized with full project state access");
  Ok(true)
}

/// Обновить конфигурацию MCP
#[tauri::command]
#[specta::specta]
pub async fn mcp_update_config(
  config: MCPConfig,
  state: State<'_, MCPServerState>,
) -> Result<bool, String> {
  log::info!("Updating MCP config");

  let state_guard = state.0.read().await;
  if let Some(server) = state_guard.as_ref() {
    server.update_config(config).await;
    Ok(true)
  } else {
    Err("MCP server not initialized".to_string())
  }
}

/// Получить список доступных инструментов
#[tauri::command]
#[specta::specta]
pub async fn mcp_get_tools(state: State<'_, MCPServerState>) -> Result<Vec<String>, String> {
  log::info!("Getting available MCP tools");

  let state_guard = state.0.read().await;
  if let Some(server) = state_guard.as_ref() {
    Ok(server.get_available_tools())
  } else {
    Err("MCP server not initialized".to_string())
  }
}

/// Отправить сообщение Claude
#[tauri::command]
#[specta::specta]
pub async fn mcp_chat(
  message: String,
  history: Vec<ChatMessage>,
  state: State<'_, MCPServerState>,
) -> Result<ChatResponse, String> {
  log::info!("MCP chat message: {}", message);

  let state_guard = state.0.read().await;
  if let Some(server) = state_guard.as_ref() {
    // Конвертировать историю в формат Claude
    let claude_history: Vec<super::server::ClaudeMessage> = history
      .iter()
      .map(|msg| super::server::ClaudeMessage {
        role: msg.role.clone(),
        content: msg.content.clone(),
      })
      .collect();

    match server.chat(message, claude_history).await {
      Ok(response) => Ok(ChatResponse {
        success: true,
        message: Some(response),
        error: None,
      }),
      Err(e) => Ok(ChatResponse {
        success: false,
        message: None,
        error: Some(e.to_string()),
      }),
    }
  } else {
    Err("MCP server not initialized".to_string())
  }
}

/// Выполнить инструмент напрямую
#[tauri::command]
#[specta::specta]
pub async fn mcp_execute_tool(
  request: MCPToolRequest,
  state: State<'_, MCPServerState>,
) -> Result<MCPToolResult, String> {
  log::info!("Executing MCP tool: {}", request.tool_name);

  let state_guard = state.0.read().await;
  if let Some(server) = state_guard.as_ref() {
    Ok(server.execute_tool(request).await)
  } else {
    Err("MCP server not initialized".to_string())
  }
}

/// Проверить подключение к Claude API
#[tauri::command]
#[specta::specta]
pub async fn mcp_check_api(state: State<'_, MCPServerState>) -> Result<bool, String> {
  log::info!("Checking Claude API connectivity");

  let state_guard = state.0.read().await;
  if let Some(server) = state_guard.as_ref() {
    match server.check_api_connectivity().await {
      Ok(status) => Ok(status),
      Err(e) => Err(e.to_string()),
    }
  } else {
    Err("MCP server not initialized".to_string())
  }
}

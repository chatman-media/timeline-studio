//! Типы для MCP интеграции

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// MCP Tool - инструмент доступный для Claude
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPTool {
  pub name: String,
  pub description: String,
  pub input_schema: Value,
}

/// Результат выполнения MCP tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolResult {
  pub success: bool,
  pub data: Option<Value>,
  pub error: Option<String>,
}

/// Запрос на выполнение tool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolRequest {
  pub tool_name: String,
  pub arguments: Value,
}

/// Контекст для выполнения tools
#[derive(Debug, Clone, Default)]
pub struct MCPContext {
  pub project_id: Option<String>,
  pub timeline_id: Option<String>,
  pub user_id: Option<String>,
}

/// Конфигурация MCP сервера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPConfig {
  pub enabled: bool,
  pub claude_api_key: Option<String>,
  pub model: String,
  pub max_tokens: u32,
  pub temperature: f32,
}

impl Default for MCPConfig {
  fn default() -> Self {
    Self {
      enabled: false,
      claude_api_key: None,
      model: "claude-3-5-sonnet-20241022".to_string(),
      max_tokens: 4096,
      temperature: 0.7,
    }
  }
}

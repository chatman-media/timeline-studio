//! Типы MCP — Tool, ToolResult, Context, Config.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// MCP-инструмент, доступный агенту.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPTool {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

/// Результат выполнения MCP-инструмента.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolResult {
    pub success: bool,
    pub data: Option<Value>,
    pub error: Option<String>,
}

impl MCPToolResult {
    pub fn ok(data: Value) -> Self {
        Self { success: true, data: Some(data), error: None }
    }

    pub fn err(message: impl Into<String>) -> Self {
        Self { success: false, data: None, error: Some(message.into()) }
    }

    pub fn not_implemented(tool_name: &str) -> Self {
        Self::ok(serde_json::json!({
            "status": "not_implemented",
            "message": format!("{tool_name} will be implemented in a future release")
        }))
    }
}

/// Запрос на выполнение инструмента.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolRequest {
    pub tool_name: String,
    pub arguments: Value,
}

/// Контекст выполнения инструмента.
#[derive(Debug, Clone, Default)]
pub struct MCPContext {
    pub project_id: Option<String>,
    pub timeline_id: Option<String>,
    pub user_id: Option<String>,
}

/// Конфигурация MCP-сервера.
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
            model: "claude-opus-4-5".to_string(),
            max_tokens: 4096,
            temperature: 0.7,
        }
    }
}

//! MCP Server с интеграцией Claude API

use super::tools::VideoTools;
use super::types::{MCPConfig, MCPToolRequest, MCPToolResult};
use ts_state_tauri::{EventBus, ProjectState};
use anyhow::Result;
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::RwLock;

/// MCP Server для Timeline Studio
pub struct MCPServer {
  config: Arc<RwLock<MCPConfig>>,
  tools: Arc<VideoTools>,
  client: reqwest::Client,
}

/// Claude API request
#[derive(Debug, Serialize)]
struct ClaudeRequest {
  model: String,
  max_tokens: u32,
  temperature: f32,
  messages: Vec<ClaudeMessage>,
  #[serde(skip_serializing_if = "Option::is_none")]
  tools: Option<Vec<ClaudeTool>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeMessage {
  pub role: String,
  pub content: String,
}

#[derive(Debug, Serialize)]
struct ClaudeTool {
  name: String,
  description: String,
  input_schema: Value,
}

/// Claude API response
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ClaudeResponse {
  id: String,
  #[serde(rename = "type")]
  response_type: String,
  role: String,
  content: Vec<ClaudeContent>,
  model: String,
  stop_reason: Option<String>,
  usage: ClaudeUsage,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum ClaudeContent {
  Text {
    #[serde(rename = "type")]
    #[allow(dead_code)]
    content_type: String,
    text: String,
  },
  ToolUse {
    #[serde(rename = "type")]
    #[allow(dead_code)]
    content_type: String,
    id: String,
    name: String,
    input: Value,
  },
}

#[derive(Debug, Deserialize)]
struct ClaudeUsage {
  input_tokens: u32,
  output_tokens: u32,
}

impl MCPServer {
  /// Создать новый MCP сервер
  pub fn new(config: MCPConfig) -> Self {
    Self {
      config: Arc::new(RwLock::new(config)),
      tools: Arc::new(VideoTools::new()),
      client: reqwest::Client::new(),
    }
  }

  /// Создать MCP сервер с доступом к project state
  pub fn with_state(
    config: MCPConfig,
    project_state: Arc<RwLock<ProjectState>>,
    event_bus: Arc<EventBus>,
  ) -> Self {
    Self {
      config: Arc::new(RwLock::new(config)),
      tools: Arc::new(VideoTools::with_state(project_state, event_bus)),
      client: reqwest::Client::new(),
    }
  }

  /// Обновить конфигурацию
  pub async fn update_config(&self, config: MCPConfig) {
    let mut cfg = self.config.write().await;
    *cfg = config;
  }

  /// Получить список доступных инструментов
  pub fn get_available_tools(&self) -> Vec<String> {
    self
      .tools
      .get_available_tools()
      .iter()
      .map(|t| t.name.clone())
      .collect()
  }

  /// Отправить сообщение Claude с поддержкой инструментов
  pub async fn chat(
    &self,
    message: String,
    conversation_history: Vec<ClaudeMessage>,
  ) -> Result<String> {
    let config = self.config.read().await;

    if !config.enabled {
      return Err(anyhow::anyhow!("MCP Server is disabled"));
    }

    let api_key = config
      .claude_api_key
      .as_ref()
      .ok_or_else(|| anyhow::anyhow!("Claude API key not configured"))?;

    info!("Sending message to Claude with MCP tools");

    // Подготовить инструменты для Claude
    let mcp_tools: Vec<ClaudeTool> = self
      .tools
      .get_available_tools()
      .iter()
      .map(|t| ClaudeTool {
        name: t.name.clone(),
        description: t.description.clone(),
        input_schema: t.input_schema.clone(),
      })
      .collect();

    debug!("Available tools: {}", mcp_tools.len());

    // Построить историю сообщений
    let mut messages = conversation_history;
    messages.push(ClaudeMessage {
      role: "user".to_string(),
      content: message,
    });

    // Отправить запрос к Claude API
    let request = ClaudeRequest {
      model: config.model.clone(),
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages,
      tools: Some(mcp_tools),
    };

    let response = self
      .client
      .post("https://api.anthropic.com/v1/messages")
      .header("x-api-key", api_key)
      .header("anthropic-version", "2023-06-01")
      .header("content-type", "application/json")
      .json(&request)
      .send()
      .await?;

    if !response.status().is_success() {
      let status = response.status();
      let error_text = response.text().await?;
      error!("Claude API error: {} - {}", status, error_text);
      return Err(anyhow::anyhow!(
        "Claude API error: {} - {}",
        status,
        error_text
      ));
    }

    let claude_response: ClaudeResponse = response.json().await?;

    info!(
      "Claude response: {} tokens (in: {}, out: {})",
      claude_response.usage.input_tokens + claude_response.usage.output_tokens,
      claude_response.usage.input_tokens,
      claude_response.usage.output_tokens
    );

    // Обработать ответ и tool calls
    self.process_claude_response(claude_response).await
  }

  /// Обработать ответ от Claude и выполнить tool calls
  async fn process_claude_response(&self, response: ClaudeResponse) -> Result<String> {
    let mut result_text = String::new();
    let mut tool_results = Vec::new();

    for content in response.content {
      match content {
        ClaudeContent::Text { text, .. } => {
          result_text.push_str(&text);
          result_text.push('\n');
        }
        ClaudeContent::ToolUse {
          name, input, id, ..
        } => {
          info!("Claude requested tool: {} (id: {})", name, id);
          debug!("Tool input: {:?}", input);

          // Выполнить инструмент
          let tool_result = self.tools.execute_tool(&name, input).await;

          if tool_result.success {
            info!("Tool {} executed successfully", name);
            if let Some(data) = &tool_result.data {
              result_text.push_str(&format!("\n[Tool: {}] Result: {}\n", name, data));
              tool_results.push(data.clone());
            }
          } else {
            error!("Tool {} failed: {:?}", name, tool_result.error);
            if let Some(error) = &tool_result.error {
              result_text.push_str(&format!("\n[Tool: {}] Error: {}\n", name, error));
            }
          }
        }
      }
    }

    Ok(result_text.trim().to_string())
  }

  /// Выполнить инструмент напрямую (без Claude)
  pub async fn execute_tool(&self, request: MCPToolRequest) -> MCPToolResult {
    info!("Executing tool directly: {}", request.tool_name);
    self
      .tools
      .execute_tool(&request.tool_name, request.arguments)
      .await
  }

  /// Проверить доступность Claude API
  pub async fn check_api_connectivity(&self) -> Result<bool> {
    let config = self.config.read().await;

    let api_key = config
      .claude_api_key
      .as_ref()
      .ok_or_else(|| anyhow::anyhow!("Claude API key not configured"))?;

    // Простой тестовый запрос
    let test_request = ClaudeRequest {
      model: config.model.clone(),
      max_tokens: 10,
      temperature: 0.0,
      messages: vec![ClaudeMessage {
        role: "user".to_string(),
        content: "test".to_string(),
      }],
      tools: None,
    };

    let response = self
      .client
      .post("https://api.anthropic.com/v1/messages")
      .header("x-api-key", api_key)
      .header("anthropic-version", "2023-06-01")
      .header("content-type", "application/json")
      .json(&test_request)
      .send()
      .await?;

    Ok(response.status().is_success())
  }
}

//! AI Provider Manager
//!
//! Унифицированный менеджер для работы с множественными AI провайдерами.
//! Поддерживает Claude, OpenAI, DeepSeek, Ollama с автоматическим fallback.

use super::types::*;
use crate::video_compiler::core::error::{Result, VideoCompilerError};
use reqwest::Client;
use serde_json::Value;
use std::time::Duration;

/// AI Provider Manager
///
/// Управляет множественными AI провайдерами с поддержкой:
/// - Автоматического fallback между провайдерами
/// - Унифицированного интерфейса для всех провайдеров
/// - Retry логики при ошибках
pub struct AIProviderManager {
  client: Client,
  timeout: Duration,
}

impl AIProviderManager {
  /// Create new AI Provider Manager
  pub fn new() -> Self {
    Self {
      client: Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .unwrap(),
      timeout: Duration::from_secs(120),
    }
  }

  /// Send unified request to any provider
  pub async fn send_request(
    &self,
    api_key: &str,
    request: UnifiedAIRequest,
  ) -> Result<UnifiedAIResponse> {
    match request.provider {
      AIProvider::Claude => self.send_claude_request(api_key, request).await,
      AIProvider::OpenAI => self.send_openai_request(api_key, request).await,
      AIProvider::DeepSeek => self.send_deepseek_request(api_key, request).await,
      AIProvider::Ollama => self.send_ollama_request(request).await,
    }
  }

  /// Send request with automatic fallback
  ///
  /// Пытается отправить запрос к основному провайдеру,
  /// при ошибке автоматически пытается fallback провайдеры
  pub async fn send_request_with_fallback(
    &self,
    providers: Vec<(AIProvider, String)>, // (provider, api_key)
    mut request: UnifiedAIRequest,
  ) -> Result<UnifiedAIResponse> {
    let mut last_error = None;

    for (provider, api_key) in providers {
      request.provider = provider.clone();

      // Try to use compatible model for the provider
      if request.model.is_empty() || !self.is_model_compatible(&provider, &request.model) {
        request.model = provider.default_models().first().unwrap().clone();
      }

      match self.send_request(&api_key, request.clone()).await {
        Ok(response) => return Ok(response),
        Err(e) => {
          log::warn!("Provider {:?} failed: {}, trying next...", provider, e);
          last_error = Some(e);
        }
      }
    }

    Err(
      last_error
        .unwrap_or_else(|| VideoCompilerError::ValidationError("All providers failed".to_string())),
    )
  }

  /// Validate provider API key
  pub async fn validate_provider(
    &self,
    provider: AIProvider,
    api_key: &str,
  ) -> Result<Vec<String>> {
    match provider {
      AIProvider::Claude => self.validate_claude(api_key).await,
      AIProvider::OpenAI => self.validate_openai(api_key).await,
      AIProvider::DeepSeek => self.validate_deepseek(api_key).await,
      AIProvider::Ollama => self.validate_ollama().await,
    }
  }

  // ============================================================================
  // CLAUDE IMPLEMENTATION
  // ============================================================================

  async fn send_claude_request(
    &self,
    api_key: &str,
    request: UnifiedAIRequest,
  ) -> Result<UnifiedAIResponse> {
    let messages: Vec<ClaudeMessage> = request.messages.into_iter().map(|m| m.into()).collect();

    let mut body = serde_json::json!({
      "model": request.model,
      "messages": messages,
      "max_tokens": request.max_tokens.unwrap_or(4096),
    });

    if let Some(temp) = request.temperature {
      body["temperature"] = serde_json::json!(temp);
    }

    if let Some(system) = request.system {
      body["system"] = serde_json::json!(system);
    }

    // 🆕 Add tools if provided (Claude Tool Use)
    if let Some(tools) = &request.tools {
      let claude_tools: Vec<Value> = tools
        .iter()
        .map(|tool| {
          serde_json::json!({
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.input_schema,
          })
        })
        .collect();
      body["tools"] = serde_json::json!(claude_tools);
    }

    // 🆕 Add tool_choice if provided
    if let Some(tool_choice) = &request.tool_choice {
      match tool_choice {
        ToolChoice::Auto => {
          body["tool_choice"] = serde_json::json!({"type": "auto"});
        }
        ToolChoice::Required => {
          body["tool_choice"] = serde_json::json!({"type": "any"});
        }
        ToolChoice::Tool { name } => {
          body["tool_choice"] = serde_json::json!({"type": "tool", "name": name});
        }
        ToolChoice::None => {
          // Don't include tools in this case
          body.as_object_mut().unwrap().remove("tools");
        }
      }
    }

    let response = self
      .client
      .post("https://api.anthropic.com/v1/messages")
      .header("x-api-key", api_key)
      .header("content-type", "application/json")
      .header("anthropic-version", "2023-06-01")
      .json(&body)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Claude API error: {}", e)))?;

    let status = response.status();
    let response_text = response
      .text()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Error reading response: {}", e)))?;

    if !status.is_success() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Claude API error {}: {}",
        status, response_text
      )));
    }

    let json: Value = serde_json::from_str(&response_text)
      .map_err(|e| VideoCompilerError::SerializationError(format!("JSON parse error: {}", e)))?;

    // 🆕 Parse content array for both text and tool_use blocks
    let mut text_content = String::new();
    let mut tool_calls = Vec::new();

    if let Some(content_array) = json["content"].as_array() {
      for block in content_array {
        match block["type"].as_str() {
          Some("text") => {
            if let Some(text) = block["text"].as_str() {
              text_content.push_str(text);
            }
          }
          Some("tool_use") => {
            if let (Some(id), Some(name), Some(input)) = (
              block["id"].as_str(),
              block["name"].as_str(),
              block.get("input"),
            ) {
              tool_calls.push(AIToolCall {
                id: id.to_string(),
                name: name.to_string(),
                input: input.clone(),
              });
            }
          }
          _ => {}
        }
      }
    }

    let usage = json["usage"].as_object().map(|u| TokenUsage {
      input_tokens: u["input_tokens"].as_u64().unwrap_or(0) as u32,
      output_tokens: u["output_tokens"].as_u64().unwrap_or(0) as u32,
      total_tokens: (u["input_tokens"].as_u64().unwrap_or(0)
        + u["output_tokens"].as_u64().unwrap_or(0)) as u32,
    });

    Ok(UnifiedAIResponse {
      id: json["id"].as_str().unwrap_or("").to_string(),
      provider: AIProvider::Claude,
      model: json["model"].as_str().unwrap_or("").to_string(),
      content: text_content,
      usage,
      finish_reason: json["stop_reason"].as_str().map(|s| s.to_string()),
      tool_calls: if tool_calls.is_empty() {
        None
      } else {
        Some(tool_calls)
      },
    })
  }

  async fn validate_claude(&self, api_key: &str) -> Result<Vec<String>> {
    let request = serde_json::json!({
      "model": "claude-3-haiku-20240307",
      "messages": [{"role": "user", "content": "Hi"}],
      "max_tokens": 1,
    });

    let response = self
      .client
      .post("https://api.anthropic.com/v1/messages")
      .header("x-api-key", api_key)
      .header("content-type", "application/json")
      .header("anthropic-version", "2023-06-01")
      .json(&request)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Validation error: {}", e)))?;

    if response.status().is_success() {
      Ok(AIProvider::Claude.default_models())
    } else {
      Err(VideoCompilerError::ValidationError(
        "Invalid Claude API key".to_string(),
      ))
    }
  }

  // ============================================================================
  // OPENAI IMPLEMENTATION
  // ============================================================================

  async fn send_openai_request(
    &self,
    api_key: &str,
    request: UnifiedAIRequest,
  ) -> Result<UnifiedAIResponse> {
    let messages: Vec<OpenAIMessage> = request.messages.into_iter().map(|m| m.into()).collect();

    let mut body = serde_json::json!({
      "model": request.model,
      "messages": messages,
    });

    if let Some(max_tokens) = request.max_tokens {
      body["max_tokens"] = serde_json::json!(max_tokens);
    }

    if let Some(temp) = request.temperature {
      body["temperature"] = serde_json::json!(temp);
    }

    // 🆕 Add tools if provided (OpenAI Function Calling)
    if let Some(tools) = &request.tools {
      let openai_tools: Vec<Value> = tools
        .iter()
        .map(|tool| {
          serde_json::json!({
            "type": "function",
            "function": {
              "name": tool.name,
              "description": tool.description,
              "parameters": tool.input_schema,
            }
          })
        })
        .collect();
      body["tools"] = serde_json::json!(openai_tools);
    }

    // 🆕 Add tool_choice if provided
    if let Some(tool_choice) = &request.tool_choice {
      match tool_choice {
        ToolChoice::Auto => {
          body["tool_choice"] = serde_json::json!("auto");
        }
        ToolChoice::Required => {
          body["tool_choice"] = serde_json::json!("required");
        }
        ToolChoice::Tool { name } => {
          body["tool_choice"] = serde_json::json!({
            "type": "function",
            "function": {"name": name}
          });
        }
        ToolChoice::None => {
          body["tool_choice"] = serde_json::json!("none");
        }
      }
    }

    let response = self
      .client
      .post("https://api.openai.com/v1/chat/completions")
      .header("Authorization", format!("Bearer {}", api_key))
      .header("Content-Type", "application/json")
      .json(&body)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("OpenAI API error: {}", e)))?;

    let status = response.status();
    let response_text = response
      .text()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Error reading response: {}", e)))?;

    if !status.is_success() {
      return Err(VideoCompilerError::ValidationError(format!(
        "OpenAI API error {}: {}",
        status, response_text
      )));
    }

    let json: Value = serde_json::from_str(&response_text)
      .map_err(|e| VideoCompilerError::SerializationError(format!("JSON parse error: {}", e)))?;

    let choice = json["choices"]
      .as_array()
      .and_then(|arr| arr.first())
      .ok_or_else(|| {
        VideoCompilerError::SerializationError("No choices in response".to_string())
      })?;

    let content = choice["message"]["content"]
      .as_str()
      .unwrap_or("")
      .to_string();

    // 🆕 Parse tool_calls if present
    let tool_calls = if let Some(tool_calls_array) = choice["message"]["tool_calls"].as_array() {
      let mut calls = Vec::new();
      for call in tool_calls_array {
        if let (Some(id), Some(function)) = (call["id"].as_str(), call["function"].as_object()) {
          if let (Some(name), Some(arguments_str)) = (
            function.get("name").and_then(|n| n.as_str()),
            function.get("arguments"),
          ) {
            // Parse arguments string as JSON
            let arguments = if let Some(args_str) = arguments_str.as_str() {
              serde_json::from_str(args_str).unwrap_or(serde_json::json!({}))
            } else {
              arguments_str.clone()
            };

            calls.push(AIToolCall {
              id: id.to_string(),
              name: name.to_string(),
              input: arguments,
            });
          }
        }
      }
      if calls.is_empty() {
        None
      } else {
        Some(calls)
      }
    } else {
      None
    };

    let usage = json["usage"].as_object().map(|u| TokenUsage {
      input_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
      output_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
      total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
    });

    Ok(UnifiedAIResponse {
      id: json["id"].as_str().unwrap_or("").to_string(),
      provider: AIProvider::OpenAI,
      model: json["model"].as_str().unwrap_or("").to_string(),
      content,
      usage,
      finish_reason: choice["finish_reason"].as_str().map(|s| s.to_string()),
      tool_calls,
    })
  }

  async fn validate_openai(&self, api_key: &str) -> Result<Vec<String>> {
    let request = serde_json::json!({
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": "Hi"}],
      "max_tokens": 1,
    });

    let response = self
      .client
      .post("https://api.openai.com/v1/chat/completions")
      .header("Authorization", format!("Bearer {}", api_key))
      .header("Content-Type", "application/json")
      .json(&request)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Validation error: {}", e)))?;

    if response.status().is_success() {
      Ok(AIProvider::OpenAI.default_models())
    } else {
      Err(VideoCompilerError::ValidationError(
        "Invalid OpenAI API key".to_string(),
      ))
    }
  }

  // ============================================================================
  // DEEPSEEK IMPLEMENTATION
  // ============================================================================

  async fn send_deepseek_request(
    &self,
    api_key: &str,
    request: UnifiedAIRequest,
  ) -> Result<UnifiedAIResponse> {
    // DeepSeek uses OpenAI-compatible API
    let messages: Vec<OpenAIMessage> = request.messages.into_iter().map(|m| m.into()).collect();

    let mut body = serde_json::json!({
      "model": request.model,
      "messages": messages,
    });

    if let Some(max_tokens) = request.max_tokens {
      body["max_tokens"] = serde_json::json!(max_tokens);
    }

    if let Some(temp) = request.temperature {
      body["temperature"] = serde_json::json!(temp);
    }

    // 🆕 Add tools if provided (OpenAI-compatible)
    if let Some(tools) = &request.tools {
      let openai_tools: Vec<Value> = tools
        .iter()
        .map(|tool| {
          serde_json::json!({
            "type": "function",
            "function": {
              "name": tool.name,
              "description": tool.description,
              "parameters": tool.input_schema,
            }
          })
        })
        .collect();
      body["tools"] = serde_json::json!(openai_tools);
    }

    // 🆕 Add tool_choice if provided
    if let Some(tool_choice) = &request.tool_choice {
      match tool_choice {
        ToolChoice::Auto => {
          body["tool_choice"] = serde_json::json!("auto");
        }
        ToolChoice::Required => {
          body["tool_choice"] = serde_json::json!("required");
        }
        ToolChoice::Tool { name } => {
          body["tool_choice"] = serde_json::json!({
            "type": "function",
            "function": {"name": name}
          });
        }
        ToolChoice::None => {
          body["tool_choice"] = serde_json::json!("none");
        }
      }
    }

    let response = self
      .client
      .post("https://api.deepseek.com/v1/chat/completions")
      .header("Authorization", format!("Bearer {}", api_key))
      .header("Content-Type", "application/json")
      .json(&body)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("DeepSeek API error: {}", e)))?;

    let status = response.status();
    let response_text = response
      .text()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Error reading response: {}", e)))?;

    if !status.is_success() {
      return Err(VideoCompilerError::ValidationError(format!(
        "DeepSeek API error {}: {}",
        status, response_text
      )));
    }

    let json: Value = serde_json::from_str(&response_text)
      .map_err(|e| VideoCompilerError::SerializationError(format!("JSON parse error: {}", e)))?;

    let choice = json["choices"]
      .as_array()
      .and_then(|arr| arr.first())
      .ok_or_else(|| {
        VideoCompilerError::SerializationError("No choices in response".to_string())
      })?;

    let content = choice["message"]["content"]
      .as_str()
      .unwrap_or("")
      .to_string();

    // 🆕 Parse tool_calls if present (same as OpenAI)
    let tool_calls = if let Some(tool_calls_array) = choice["message"]["tool_calls"].as_array() {
      let mut calls = Vec::new();
      for call in tool_calls_array {
        if let (Some(id), Some(function)) = (call["id"].as_str(), call["function"].as_object()) {
          if let (Some(name), Some(arguments_str)) = (
            function.get("name").and_then(|n| n.as_str()),
            function.get("arguments"),
          ) {
            // Parse arguments string as JSON
            let arguments = if let Some(args_str) = arguments_str.as_str() {
              serde_json::from_str(args_str).unwrap_or(serde_json::json!({}))
            } else {
              arguments_str.clone()
            };

            calls.push(AIToolCall {
              id: id.to_string(),
              name: name.to_string(),
              input: arguments,
            });
          }
        }
      }
      if calls.is_empty() {
        None
      } else {
        Some(calls)
      }
    } else {
      None
    };

    let usage = json["usage"].as_object().map(|u| TokenUsage {
      input_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
      output_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
      total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
    });

    Ok(UnifiedAIResponse {
      id: json["id"].as_str().unwrap_or("").to_string(),
      provider: AIProvider::DeepSeek,
      model: json["model"].as_str().unwrap_or("").to_string(),
      content,
      usage,
      finish_reason: choice["finish_reason"].as_str().map(|s| s.to_string()),
      tool_calls,
    })
  }

  async fn validate_deepseek(&self, api_key: &str) -> Result<Vec<String>> {
    let request = serde_json::json!({
      "model": "deepseek-chat",
      "messages": [{"role": "user", "content": "Hi"}],
      "max_tokens": 1,
    });

    let response = self
      .client
      .post("https://api.deepseek.com/v1/chat/completions")
      .header("Authorization", format!("Bearer {}", api_key))
      .header("Content-Type", "application/json")
      .json(&request)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Validation error: {}", e)))?;

    if response.status().is_success() {
      Ok(AIProvider::DeepSeek.default_models())
    } else {
      Err(VideoCompilerError::ValidationError(
        "Invalid DeepSeek API key".to_string(),
      ))
    }
  }

  // ============================================================================
  // OLLAMA IMPLEMENTATION
  // ============================================================================

  async fn send_ollama_request(&self, request: UnifiedAIRequest) -> Result<UnifiedAIResponse> {
    let messages: Vec<OllamaMessage> = request.messages.into_iter().map(|m| m.into()).collect();

    let mut body = serde_json::json!({
      "model": request.model,
      "messages": messages,
      "stream": false,
    });

    if request.temperature.is_some() || request.max_tokens.is_some() {
      let mut options = serde_json::json!({});
      if let Some(temp) = request.temperature {
        options["temperature"] = serde_json::json!(temp);
      }
      if let Some(max_tokens) = request.max_tokens {
        options["num_predict"] = serde_json::json!(max_tokens);
      }
      body["options"] = options;
    }

    let response = self
      .client
      .post("http://localhost:11434/api/chat")
      .header("Content-Type", "application/json")
      .json(&body)
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Ollama API error: {}", e)))?;

    let status = response.status();
    let response_text = response
      .text()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Error reading response: {}", e)))?;

    if !status.is_success() {
      return Err(VideoCompilerError::ValidationError(format!(
        "Ollama API error {}: {}",
        status, response_text
      )));
    }

    let json: Value = serde_json::from_str(&response_text)
      .map_err(|e| VideoCompilerError::SerializationError(format!("JSON parse error: {}", e)))?;

    let content = json["message"]["content"]
      .as_str()
      .unwrap_or("")
      .to_string();

    Ok(UnifiedAIResponse {
      id: uuid::Uuid::new_v4().to_string(),
      provider: AIProvider::Ollama,
      model: json["model"].as_str().unwrap_or("").to_string(),
      content,
      usage: None, // Ollama doesn't provide token usage
      finish_reason: Some("stop".to_string()),
      tool_calls: None, // Ollama doesn't support tools yet
    })
  }

  async fn validate_ollama(&self) -> Result<Vec<String>> {
    // Check if Ollama is running
    let response = self
      .client
      .get("http://localhost:11434/api/tags")
      .send()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Ollama not running: {}", e)))?;

    if response.status().is_success() {
      let json: Value = response
        .json()
        .await
        .map_err(|e| VideoCompilerError::SerializationError(format!("JSON parse error: {}", e)))?;

      let models = json["models"]
        .as_array()
        .map(|arr| {
          arr
            .iter()
            .filter_map(|m| m["name"].as_str().map(|s| s.to_string()))
            .collect()
        })
        .unwrap_or_else(|| AIProvider::Ollama.default_models());

      Ok(models)
    } else {
      Err(VideoCompilerError::ValidationError(
        "Ollama is not running".to_string(),
      ))
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  fn is_model_compatible(&self, provider: &AIProvider, model: &str) -> bool {
    provider
      .default_models()
      .iter()
      .any(|m| m.contains(model) || model.contains(m))
  }
}

impl Default for AIProviderManager {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_provider_manager_creation() {
    let manager = AIProviderManager::new();
    assert_eq!(manager.timeout, Duration::from_secs(120));
  }

  #[test]
  fn test_model_compatibility() {
    let manager = AIProviderManager::new();
    assert!(manager.is_model_compatible(&AIProvider::Claude, "claude-3-5-sonnet"));
    assert!(!manager.is_model_compatible(&AIProvider::Claude, "gpt-4"));
  }

  #[test]
  fn test_default_endpoints() {
    assert_eq!(
      AIProvider::Claude.default_endpoint(),
      "https://api.anthropic.com/v1/messages"
    );
    assert_eq!(
      AIProvider::OpenAI.default_endpoint(),
      "https://api.openai.com/v1/chat/completions"
    );
    assert_eq!(
      AIProvider::Ollama.default_endpoint(),
      "http://localhost:11434/api/chat"
    );
  }
}

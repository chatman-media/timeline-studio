use serde::{Deserialize, Serialize};

/// Запрос к Claude API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeApiRequest {
  pub model: String,
  pub messages: Vec<ClaudeMessage>,
  pub max_tokens: Option<u32>,
  pub temperature: Option<f64>,
  pub stream: Option<bool>,
  pub system: Option<String>,
}

/// Сообщение для Claude API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeMessage {
  pub role: String,
  pub content: String,
}

/// Ответ от Claude API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeApiResponse {
  pub id: String,
  pub model: String,
  pub content: Vec<ClaudeContent>,
  pub usage: Option<ClaudeUsage>,
}

/// Контент от Claude
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeContent {
  pub r#type: String,
  pub text: Option<String>,
}

/// Использование токенов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeUsage {
  pub input_tokens: u32,
  pub output_tokens: u32,
}

/// Потоковый ответ от Claude
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeStreamChunk {
  pub r#type: String,
  pub delta: Option<ClaudeDelta>,
  pub message: Option<ClaudeMessage>,
}

/// Дельта изменения в потоке
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeDelta {
  pub r#type: String,
  pub text: Option<String>,
}

/// Запрос на валидацию API ключа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateApiKeyRequest {
  pub api_key: String,
  pub provider: String, // "claude", "openai", etc.
}

/// Результат валидации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateApiKeyResponse {
  pub valid: bool,
  pub message: String,
  pub models: Option<Vec<String>>,
}

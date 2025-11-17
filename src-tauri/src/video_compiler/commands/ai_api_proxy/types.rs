use serde::{Deserialize, Serialize};
use specta::Type;

// ============================================================================
// UNIFIED AI PROVIDER TYPES
// ============================================================================

/// AI Provider Type
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AIProvider {
  Claude,
  OpenAI,
  DeepSeek,
  Ollama,
}

/// AI Tool Definition (Claude Tool Use / OpenAI Function Calling)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AITool {
  /// Tool name
  pub name: String,

  /// Tool description
  pub description: String,

  /// Input schema (JSON Schema)
  pub input_schema: serde_json::Value,
}

/// AI Tool Call (when AI decides to use a tool)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AIToolCall {
  /// Tool call ID
  pub id: String,

  /// Tool name
  pub name: String,

  /// Tool input (JSON)
  pub input: serde_json::Value,
}

/// Tool Choice Strategy
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum ToolChoice {
  /// AI decides whether to use tools
  Auto,

  /// Force AI to use a specific tool
  Required,

  /// Specific tool to use
  Tool { name: String },

  /// Don't use tools
  None,
}

/// Unified AI Request (works with all providers)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedAIRequest {
  pub provider: AIProvider,
  pub model: String,
  pub messages: Vec<AIMessage>,
  pub max_tokens: Option<u32>,
  pub temperature: Option<f64>,
  pub stream: Option<bool>,
  pub system: Option<String>,
  /// 🆕 Tools для Function Calling / Claude Tool Use
  pub tools: Option<Vec<AITool>>,
  /// 🆕 Tool choice strategy
  pub tool_choice: Option<ToolChoice>,
}

/// AI Message Content (supports text and images)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(untagged)]
pub enum AIMessageContent {
  /// Simple text message
  Text(String),

  /// Multimodal message with text and/or images
  Multimodal(Vec<AIContentPart>),
}

/// Content part (text or image)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AIContentPart {
  /// Text content
  Text { text: String },

  /// Image content (base64 or URL)
  Image {
    #[serde(flatten)]
    source: AIImageSource,
  },
}

/// Image source (base64 or URL)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AIImageSource {
  /// Base64 encoded image
  Base64 {
    #[serde(rename = "media_type")]
    media_type: String, // e.g., "image/jpeg", "image/png"
    data: String, // base64 encoded
  },

  /// Image URL
  Url { url: String },
}

/// Unified AI Message (supports text and vision)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AIMessage {
  pub role: String,
  pub content: AIMessageContent,
}

impl AIMessage {
  /// Create a simple text message
  pub fn text(role: impl Into<String>, text: impl Into<String>) -> Self {
    Self {
      role: role.into(),
      content: AIMessageContent::Text(text.into()),
    }
  }

  /// Create a message with image (base64)
  pub fn with_image_base64(
    role: impl Into<String>,
    text: impl Into<String>,
    image_data: String,
    media_type: impl Into<String>,
  ) -> Self {
    Self {
      role: role.into(),
      content: AIMessageContent::Multimodal(vec![
        AIContentPart::Text { text: text.into() },
        AIContentPart::Image {
          source: AIImageSource::Base64 {
            media_type: media_type.into(),
            data: image_data,
          },
        },
      ]),
    }
  }

  /// Create a message with image URL
  pub fn with_image_url(
    role: impl Into<String>,
    text: impl Into<String>,
    image_url: impl Into<String>,
  ) -> Self {
    Self {
      role: role.into(),
      content: AIMessageContent::Multimodal(vec![
        AIContentPart::Text { text: text.into() },
        AIContentPart::Image {
          source: AIImageSource::Url {
            url: image_url.into(),
          },
        },
      ]),
    }
  }

  /// Get text content from message
  pub fn get_text(&self) -> String {
    match &self.content {
      AIMessageContent::Text(text) => text.clone(),
      AIMessageContent::Multimodal(parts) => parts
        .iter()
        .filter_map(|part| {
          if let AIContentPart::Text { text } = part {
            Some(text.as_str())
          } else {
            None
          }
        })
        .collect::<Vec<_>>()
        .join("\n"),
    }
  }
}

/// Unified AI Response
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedAIResponse {
  pub id: String,
  pub provider: AIProvider,
  pub model: String,
  pub content: String,
  pub usage: Option<TokenUsage>,
  pub finish_reason: Option<String>,
  /// 🆕 Tool calls если AI вызвал инструменты
  pub tool_calls: Option<Vec<AIToolCall>>,
}

/// Token Usage (unified across providers)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsage {
  pub input_tokens: u32,
  pub output_tokens: u32,
  pub total_tokens: u32,
}

// ============================================================================
// CLAUDE-SPECIFIC TYPES (legacy compatibility)
// ============================================================================

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

// ============================================================================
// OPENAI-SPECIFIC TYPES
// ============================================================================

/// OpenAI API Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIRequest {
  pub model: String,
  pub messages: Vec<OpenAIMessage>,
  pub max_tokens: Option<u32>,
  pub temperature: Option<f64>,
  pub stream: Option<bool>,
}

/// OpenAI Message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIMessage {
  pub role: String,
  pub content: String,
}

/// OpenAI Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIResponse {
  pub id: String,
  pub object: String,
  pub created: u64,
  pub model: String,
  pub choices: Vec<OpenAIChoice>,
  pub usage: Option<OpenAIUsage>,
}

/// OpenAI Choice
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIChoice {
  pub index: u32,
  pub message: OpenAIMessage,
  pub finish_reason: Option<String>,
}

/// OpenAI Usage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIUsage {
  pub prompt_tokens: u32,
  pub completion_tokens: u32,
  pub total_tokens: u32,
}

// ============================================================================
// DEEPSEEK-SPECIFIC TYPES
// ============================================================================

/// DeepSeek uses OpenAI-compatible API
pub type DeepSeekRequest = OpenAIRequest;
pub type DeepSeekResponse = OpenAIResponse;
pub type DeepSeekMessage = OpenAIMessage;

// ============================================================================
// OLLAMA-SPECIFIC TYPES
// ============================================================================

/// Ollama API Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaRequest {
  pub model: String,
  pub messages: Vec<OllamaMessage>,
  pub stream: Option<bool>,
  pub options: Option<OllamaOptions>,
}

/// Ollama Message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaMessage {
  pub role: String,
  pub content: String,
  /// Base64 encoded images for vision models (llama3.2-vision, moondream2, llava)
  #[serde(skip_serializing_if = "Option::is_none")]
  pub images: Option<Vec<String>>,
}

/// Ollama Options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaOptions {
  pub temperature: Option<f64>,
  pub num_predict: Option<u32>, // equivalent to max_tokens
}

/// Ollama Response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaResponse {
  pub model: String,
  pub created_at: String,
  pub message: OllamaMessage,
  pub done: bool,
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/// Запрос на валидацию API ключа
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ValidateApiKeyRequest {
  pub api_key: String,
  pub provider: AIProvider,
}

/// Результат валидации
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ValidateApiKeyResponse {
  pub valid: bool,
  pub message: String,
  pub models: Option<Vec<String>>,
}

// ============================================================================
// PROVIDER CONFIG
// ============================================================================

/// AI Provider Configuration
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
  pub provider: AIProvider,
  pub api_key: Option<String>,
  pub base_url: Option<String>,
  pub default_model: Option<String>,
  pub timeout: Option<u64>, // seconds
}

/// Provider Status
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderStatus {
  pub provider: AIProvider,
  pub available: bool,
  pub models: Vec<String>,
  pub error: Option<String>,
}

// ============================================================================
// CONVERSION IMPLEMENTATIONS
// ============================================================================

impl From<ClaudeMessage> for AIMessage {
  fn from(msg: ClaudeMessage) -> Self {
    AIMessage {
      role: msg.role,
      content: AIMessageContent::Text(msg.content),
    }
  }
}

impl From<AIMessage> for ClaudeMessage {
  fn from(msg: AIMessage) -> Self {
    let text = msg.get_text();
    ClaudeMessage {
      role: msg.role,
      content: text,
    }
  }
}

impl From<OpenAIMessage> for AIMessage {
  fn from(msg: OpenAIMessage) -> Self {
    AIMessage::text(msg.role, msg.content)
  }
}

impl From<AIMessage> for OpenAIMessage {
  fn from(msg: AIMessage) -> Self {
    let text = msg.get_text();
    OpenAIMessage {
      role: msg.role,
      content: text,
    }
  }
}

impl From<OllamaMessage> for AIMessage {
  fn from(msg: OllamaMessage) -> Self {
    AIMessage::text(msg.role, msg.content)
  }
}

impl From<AIMessage> for OllamaMessage {
  fn from(msg: AIMessage) -> Self {
    match msg.content {
      AIMessageContent::Text(text) => OllamaMessage {
        role: msg.role,
        content: text,
        images: None,
      },
      AIMessageContent::Multimodal(parts) => {
        let mut text_parts = Vec::new();
        let mut image_data = Vec::new();

        for part in parts {
          match part {
            AIContentPart::Text { text } => text_parts.push(text),
            AIContentPart::Image { source } => {
              // Extract base64 image data
              if let AIImageSource::Base64 { data, .. } = source {
                image_data.push(data);
              }
            }
          }
        }

        OllamaMessage {
          role: msg.role,
          content: text_parts.join("\n"),
          images: if image_data.is_empty() {
            None
          } else {
            Some(image_data)
          },
        }
      }
    }
  }
}

impl AIProvider {
  /// Get default models for provider
  pub fn default_models(&self) -> Vec<String> {
    match self {
      AIProvider::Claude => vec![
        "claude-3-5-sonnet-20241022".to_string(),
        "claude-3-opus-20240229".to_string(),
        "claude-3-sonnet-20240229".to_string(),
        "claude-3-haiku-20240307".to_string(),
      ],
      AIProvider::OpenAI => vec![
        "gpt-4-turbo-preview".to_string(),
        "gpt-4".to_string(),
        "gpt-3.5-turbo".to_string(),
      ],
      AIProvider::DeepSeek => vec!["deepseek-chat".to_string(), "deepseek-coder".to_string()],
      AIProvider::Ollama => vec![
        "llama3".to_string(),
        "codellama".to_string(),
        "mistral".to_string(),
      ],
    }
  }

  /// Get default API endpoint
  pub fn default_endpoint(&self) -> String {
    match self {
      AIProvider::Claude => "https://api.anthropic.com/v1/messages".to_string(),
      AIProvider::OpenAI => "https://api.openai.com/v1/chat/completions".to_string(),
      AIProvider::DeepSeek => "https://api.deepseek.com/v1/chat/completions".to_string(),
      AIProvider::Ollama => "http://localhost:11434/api/chat".to_string(),
    }
  }
}

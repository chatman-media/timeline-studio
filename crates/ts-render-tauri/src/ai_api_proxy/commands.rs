use super::business_logic::*;
use super::types::*;
use ts_render::video_compiler::core::error::Result;

/// Отправляет запрос к Claude API через backend proxy
#[tauri::command]
pub async fn claude_send_message(
  api_key: String,
  model: String,
  messages: Vec<ClaudeMessage>,
  max_tokens: Option<u32>,
  temperature: Option<f64>,
  system: Option<String>,
) -> Result<ClaudeApiResponse> {
  let request = ClaudeApiRequest {
    model,
    messages,
    max_tokens,
    temperature,
    stream: Some(false),
    system,
  };

  send_claude_request(&api_key, request).await
}

/// Отправляет потоковый запрос к Claude API через backend proxy
#[tauri::command]
pub async fn claude_send_streaming_message(
  api_key: String,
  model: String,
  messages: Vec<ClaudeMessage>,
  max_tokens: Option<u32>,
  temperature: Option<f64>,
  system: Option<String>,
) -> Result<String> {
  let request = ClaudeApiRequest {
    model,
    messages,
    max_tokens,
    temperature,
    stream: Some(true),
    system,
  };

  send_claude_stream_request(&api_key, request).await
}

/// Валидирует API ключ Claude
#[tauri::command]
pub async fn claude_validate_api_key(api_key: String) -> Result<ValidateApiKeyResponse> {
  let (valid, models) = validate_claude_api_key(&api_key).await?;

  let message = if valid {
    "API ключ валиден".to_string()
  } else {
    "API ключ невалиден".to_string()
  };

  Ok(ValidateApiKeyResponse {
    valid,
    message,
    models: Some(models),
  })
}

/// Получает список доступных моделей Claude
#[tauri::command]
pub async fn claude_get_available_models() -> Result<Vec<String>> {
  Ok(vec![
    "claude-3-5-sonnet-20241022".to_string(),
    "claude-3-opus-20240229".to_string(),
    "claude-3-sonnet-20240229".to_string(),
    "claude-3-haiku-20240307".to_string(),
  ])
}

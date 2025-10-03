use super::types::*;
use crate::video_compiler::core::error::{Result, VideoCompilerError};
use reqwest::Client;
use serde_json::Value;

/// Отправляет запрос к Claude API
pub async fn send_claude_request(
  api_key: &str,
  request: ClaudeApiRequest,
) -> Result<ClaudeApiResponse> {
  let client = Client::new();

  // Подготавливаем тело запроса
  let mut request_body = serde_json::json!({
    "model": request.model,
    "messages": request.messages,
    "max_tokens": request.max_tokens.unwrap_or(4096),
  });

  if let Some(temp) = request.temperature {
    request_body["temperature"] = serde_json::json!(temp);
  }

  if let Some(system) = request.system {
    request_body["system"] = serde_json::json!(system);
  }

  // Отправляем запрос
  let response = client
    .post("https://api.anthropic.com/v1/messages")
    .header("x-api-key", api_key)
    .header("content-type", "application/json")
    .header("anthropic-version", "2023-06-01")
    .json(&request_body)
    .send()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка запроса к Claude API: {e}")))?;

  let status = response.status();
  let response_text = response
    .text()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка чтения ответа: {e}")))?;

  if !status.is_success() {
    return Err(VideoCompilerError::ValidationError(format!(
      "Claude API error {status}: {response_text}"
    )));
  }

  // Парсим ответ
  let api_response: Value = serde_json::from_str(&response_text)
    .map_err(|e| VideoCompilerError::SerializationError(format!("Ошибка парсинга JSON: {e}")))?;

  // Конвертируем в наш тип
  let claude_response = ClaudeApiResponse {
    id: api_response["id"]
      .as_str()
      .ok_or_else(|| VideoCompilerError::SerializationError("Отсутствует id в ответе".to_string()))?
      .to_string(),
    model: api_response["model"]
      .as_str()
      .ok_or_else(|| {
        VideoCompilerError::SerializationError("Отсутствует model в ответе".to_string())
      })?
      .to_string(),
    content: extract_claude_content(&api_response)?,
    usage: extract_claude_usage(&api_response),
  };

  Ok(claude_response)
}

/// Отправляет потоковый запрос к Claude API
pub async fn send_claude_stream_request(
  api_key: &str,
  request: ClaudeApiRequest,
) -> Result<String> {
  let client = Client::new();

  // Подготавливаем тело запроса для стриминга
  let mut request_body = serde_json::json!({
    "model": request.model,
    "messages": request.messages,
    "max_tokens": request.max_tokens.unwrap_or(4096),
    "stream": true,
  });

  if let Some(temp) = request.temperature {
    request_body["temperature"] = serde_json::json!(temp);
  }

  if let Some(system) = request.system {
    request_body["system"] = serde_json::json!(system);
  }

  // Отправляем запрос
  let response = client
    .post("https://api.anthropic.com/v1/messages")
    .header("x-api-key", api_key)
    .header("content-type", "application/json")
    .header("anthropic-version", "2023-06-01")
    .json(&request_body)
    .send()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка запроса к Claude API: {e}")))?;

  let status = response.status();
  if !status.is_success() {
    let error_text = response
      .text()
      .await
      .unwrap_or_else(|_| "Unknown error".to_string());
    return Err(VideoCompilerError::ValidationError(format!(
      "Claude API error {status}: {error_text}"
    )));
  }

  // Возвращаем поток как строку для последующей обработки
  let stream_data = response
    .text()
    .await
    .map_err(|e| VideoCompilerError::Io(format!("Ошибка чтения потока: {e}")))?;

  Ok(stream_data)
}

/// Валидирует API ключ для Claude
pub async fn validate_claude_api_key(api_key: &str) -> Result<(bool, Vec<String>)> {
  let client = Client::new();

  // Делаем простой запрос для проверки ключа
  let request = serde_json::json!({
    "model": "claude-3-haiku-20240307",
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 1,
  });

  let response = client
    .post("https://api.anthropic.com/v1/messages")
    .header("x-api-key", api_key)
    .header("content-type", "application/json")
    .header("anthropic-version", "2023-06-01")
    .json(&request)
    .send()
    .await;

  match response {
    Ok(resp) => {
      let status = resp.status();
      if status.is_success() {
        Ok((true, get_available_claude_models()))
      } else {
        Ok((false, vec![]))
      }
    }
    Err(_) => Ok((false, vec![])),
  }
}

/// Возвращает список доступных моделей Claude
fn get_available_claude_models() -> Vec<String> {
  vec![
    "claude-3-5-sonnet-20241022".to_string(),
    "claude-3-opus-20240229".to_string(),
    "claude-3-sonnet-20240229".to_string(),
    "claude-3-haiku-20240307".to_string(),
  ]
}

/// Извлекает контент из ответа Claude
fn extract_claude_content(api_response: &Value) -> Result<Vec<ClaudeContent>> {
  let content_array = api_response["content"].as_array().ok_or_else(|| {
    VideoCompilerError::SerializationError("Отсутствует content в ответе".to_string())
  })?;

  let mut contents = Vec::new();
  for item in content_array {
    let content = ClaudeContent {
      r#type: item["type"].as_str().unwrap_or("text").to_string(),
      text: item["text"].as_str().map(|s| s.to_string()),
    };
    contents.push(content);
  }

  Ok(contents)
}

/// Извлекает информацию об использовании токенов
fn extract_claude_usage(api_response: &Value) -> Option<ClaudeUsage> {
  if let Some(usage) = api_response["usage"].as_object() {
    Some(ClaudeUsage {
      input_tokens: usage["input_tokens"].as_u64()? as u32,
      output_tokens: usage["output_tokens"].as_u64()? as u32,
    })
  } else {
    None
  }
}

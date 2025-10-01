use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::commands::VideoCompilerState;
use reqwest::Client;
use serde_json::json;
use std::time::Duration;
use super::types::*;

/// Отправить сообщение в Ollama
pub async fn send_ollama_message(
    state: &VideoCompilerState,
    request: OllamaChatRequest,
    base_url: Option<String>,
) -> Result<OllamaChatResponse> {
    let client = Client::new();
    let url = format!("{}/api/chat", base_url.unwrap_or_else(|| "http://localhost:11434".to_string()));
    
    let response = client
        .post(&url)
        .timeout(Duration::from_secs(300)) // 5 минут для локальных моделей
        .json(&request)
        .send()
        .await
        .map_err(|e| VideoCompilerError::NetworkError(format!("Failed to connect to Ollama: {}", e)))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(VideoCompilerError::ApiError(format!("Ollama API error: {}", error_text)));
    }

    let ollama_response = response
        .json::<OllamaChatResponse>()
        .await
        .map_err(|e| VideoCompilerError::ParseError(format!("Failed to parse Ollama response: {}", e)))?;

    Ok(ollama_response)
}

/// Отправить потоковое сообщение в Ollama
pub async fn send_ollama_streaming_message(
    state: &VideoCompilerState,
    request: OllamaChatRequest,
    base_url: Option<String>,
    on_chunk: impl Fn(String) -> Result<()>,
) -> Result<OllamaChatResponse> {
    let client = Client::new();
    let url = format!("{}/api/chat", base_url.unwrap_or_else(|| "http://localhost:11434".to_string()));
    
    let mut request_with_stream = request;
    request_with_stream.stream = true;
    
    let response = client
        .post(&url)
        .timeout(Duration::from_secs(300))
        .json(&request_with_stream)
        .send()
        .await
        .map_err(|e| VideoCompilerError::NetworkError(format!("Failed to connect to Ollama: {}", e)))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(VideoCompilerError::ApiError(format!("Ollama API error: {}", error_text)));
    }

    let mut full_content = String::new();
    let mut final_response: Option<OllamaChatResponse> = None;
    
    // Читаем потоковый ответ
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| VideoCompilerError::NetworkError(format!("Stream error: {}", e)))?;
        
        if let Ok(chunk_str) = String::from_utf8(chunk.to_vec()) {
            for line in chunk_str.lines() {
                if line.starts_with("data: ") {
                    let json_data = &line[6..];
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(json_data) {
                        if let Some(content) = parsed.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                            full_content.push_str(content);
                            on_chunk(content.to_string())?;
                        }
                        
                        if parsed.get("done").and_then(|d| d.as_bool()).unwrap_or(false) {
                            // Создаем финальный ответ
                            final_response = Some(OllamaChatResponse {
                                model: parsed.get("model").and_then(|m| m.as_str()).unwrap_or_default().to_string(),
                                created_at: parsed.get("created_at").and_then(|c| c.as_str()).unwrap_or_default().to_string(),
                                message: OllamaMessage {
                                    role: "assistant".to_string(),
                                    content: full_content.clone(),
                                },
                                done: true,
                                total_duration: parsed.get("total_duration").and_then(|d| d.as_i64()),
                                load_duration: parsed.get("load_duration").and_then(|d| d.as_i64()),
                                prompt_eval_count: parsed.get("prompt_eval_count").and_then(|c| c.as_i64()).map(|c| c as i32),
                                prompt_eval_duration: parsed.get("prompt_eval_duration").and_then(|d| d.as_i64()),
                                eval_count: parsed.get("eval_count").and_then(|c| c.as_i64()).map(|c| c as i32),
                                eval_duration: parsed.get("eval_duration").and_then(|d| d.as_i64()),
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    final_response.ok_or_else(|| VideoCompilerError::ApiError("No response from Ollama stream".to_string()))
}

/// Получить список доступных моделей Ollama
pub async fn get_ollama_models(base_url: Option<String>) -> Result<OllamaModelsResponse> {
    let client = Client::new();
    let url = format!("{}/api/tags", base_url.unwrap_or_else(|| "http://localhost:11434".to_string()));
    
    let response = client
        .get(&url)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| VideoCompilerError::NetworkError(format!("Failed to connect to Ollama: {}", e)))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(VideoCompilerError::ApiError(format!("Ollama API error: {}", error_text)));
    }

    let models_response = response
        .json::<OllamaModelsResponse>()
        .await
        .map_err(|e| VideoCompilerError::ParseError(format!("Failed to parse Ollama models response: {}", e)))?;

    Ok(models_response)
}

/// Проверить доступность Ollama сервера
pub async fn check_ollama_health(base_url: Option<String>) -> Result<bool> {
    let client = Client::new();
    let url = format!("{}/api/tags", base_url.unwrap_or_else(|| "http://localhost:11434".to_string()));
    
    let response = client
        .get(&url)
        .timeout(Duration::from_secs(10))
        .send()
        .await;

    match response {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}
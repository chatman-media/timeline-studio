//! Unified AI Commands
//!
//! Tauri команды для работы с множественными AI провайдерами
//! через единый унифицированный интерфейс.

use super::cache::{AICacheManager, CacheStats};
use super::provider_manager::AIProviderManager;
use super::types::*;
use crate::security::{ApiKeyType, SecureStorage};
use std::sync::Arc;
use tauri::{AppHandle, State};
use tokio::sync::Mutex;
use uuid::Uuid;

/// State для AI Streaming - хранит AppHandle для emit событий
pub struct AIStreamingState {
  pub app_handle: AppHandle,
}

impl AIStreamingState {
  pub fn new(app_handle: AppHandle) -> Self {
    Self { app_handle }
  }
}

/// State для AI Cache
pub struct AICacheState {
  pub cache: Arc<Mutex<AICacheManager>>,
}

/// Send unified AI request (works with any provider)
#[tauri::command]
#[specta::specta]
pub async fn ai_send_unified_request(
  api_key: String,
  request: UnifiedAIRequest,
  cache_state: State<'_, AICacheState>,
) -> Result<UnifiedAIResponse, String> {
  // Проверяем кэш если это не streaming запрос
  if !request.stream.unwrap_or(false) {
    let cache = cache_state.cache.lock().await;
    let hash = AICacheManager::generate_hash(&request.provider, &request.model, &request.messages);

    // Пытаемся получить из кэша
    if let Ok(Some(cached_response)) = cache.get(&hash) {
      log::info!(
        "Returning cached response for provider {:?}",
        request.provider
      );
      return Ok(cached_response);
    }
  }

  // Отправляем запрос к провайдеру
  let manager = AIProviderManager::new();
  let response = manager
    .send_request(&api_key, request.clone())
    .await
    .map_err(|e| e.to_string())?;

  // Сохраняем в кэш если не streaming
  if !request.stream.unwrap_or(false) {
    let cache = cache_state.cache.lock().await;
    if let Err(e) = cache.set(&request, &response) {
      log::warn!("Failed to cache response: {}", e);
    }
  }

  Ok(response)
}

/// Send AI request with automatic fallback
///
/// Пытается отправить запрос к нескольким провайдерам по порядку
/// # Arguments
/// * `providers_with_keys` - Массив кортежей (provider, api_key)
/// * `request` - Унифицированный запрос
#[tauri::command]
#[specta::specta]
pub async fn ai_send_request_with_fallback(
  providers_with_keys: Vec<(AIProvider, String)>,
  request: UnifiedAIRequest,
) -> Result<UnifiedAIResponse, String> {
  let manager = AIProviderManager::new();
  manager
    .send_request_with_fallback(providers_with_keys, request)
    .await
    .map_err(|e| e.to_string())
}

/// Validate API key for specific provider
#[tauri::command]
#[specta::specta]
pub async fn ai_validate_provider(
  provider: AIProvider,
  api_key: String,
) -> Result<ProviderStatus, String> {
  let manager = AIProviderManager::new();

  match manager.validate_provider(provider.clone(), &api_key).await {
    Ok(models) => Ok(ProviderStatus {
      provider,
      available: true,
      models,
      error: None,
    }),
    Err(e) => Ok(ProviderStatus {
      provider,
      available: false,
      models: vec![],
      error: Some(e.to_string()),
    }),
  }
}

/// Get available models for provider
#[tauri::command]
#[specta::specta]
pub async fn ai_get_provider_models(provider: AIProvider) -> Result<Vec<String>, String> {
  Ok(provider.default_models())
}

/// Get all supported providers
#[tauri::command]
#[specta::specta]
pub async fn ai_get_supported_providers() -> Result<Vec<AIProvider>, String> {
  Ok(vec![
    AIProvider::Claude,
    AIProvider::OpenAI,
    AIProvider::DeepSeek,
    AIProvider::Ollama,
  ])
}

/// Check health of all providers
#[tauri::command]
#[specta::specta]
pub async fn ai_check_providers_health(
  providers_with_keys: Vec<(AIProvider, Option<String>)>,
) -> Result<Vec<ProviderStatus>, String> {
  let manager = AIProviderManager::new();
  let mut statuses = vec![];

  for (provider, api_key_opt) in providers_with_keys {
    let status = if let Some(api_key) = api_key_opt {
      match manager.validate_provider(provider.clone(), &api_key).await {
        Ok(models) => ProviderStatus {
          provider,
          available: true,
          models,
          error: None,
        },
        Err(e) => ProviderStatus {
          provider,
          available: false,
          models: vec![],
          error: Some(e.to_string()),
        },
      }
    } else {
      // No API key provided
      ProviderStatus {
        provider: provider.clone(),
        available: false,
        models: provider.default_models(),
        error: Some("No API key provided".to_string()),
      }
    };

    statuses.push(status);
  }

  Ok(statuses)
}

/// Send AI request with tools (Function Calling)
///
/// Упрощенная команда для отправки запросов с инструментами.
/// # Arguments
/// * `api_key` - API ключ провайдера
/// * `provider` - AI провайдер
/// * `model` - Модель для использования
/// * `messages` - Сообщения для AI
/// * `tools` - Список доступных инструментов
/// * `tool_choice` - Стратегия выбора инструментов
/// * `system` - Системный промпт (опционально)
/// * `max_tokens` - Максимум токенов (опционально)
/// * `temperature` - Температура генерации (опционально)
#[allow(clippy::too_many_arguments)]
#[tauri::command]
#[specta::specta]
pub async fn ai_send_request_with_tools(
  api_key: String,
  provider: AIProvider,
  model: String,
  messages: Vec<AIMessage>,
  tools: Vec<AITool>,
  tool_choice: Option<ToolChoice>,
  system: Option<String>,
  max_tokens: Option<u32>,
  temperature: Option<f64>,
) -> Result<UnifiedAIResponse, String> {
  let manager = AIProviderManager::new();

  let request = UnifiedAIRequest {
    provider,
    model,
    messages,
    max_tokens,
    temperature,
    stream: Some(false),
    system,
    tools: Some(tools),
    tool_choice,
  };

  manager
    .send_request(&api_key, request)
    .await
    .map_err(|e| e.to_string())
}

/// Send AI request using stored API key (secure) with caching
///
/// Эта команда не требует передачи API ключа с frontend.
/// Ключ автоматически загружается из secure storage.
/// Поддерживает автоматическое кэширование ответов.
#[tauri::command]
#[specta::specta]
pub async fn ai_send_secure_request(
  storage: State<'_, Mutex<SecureStorage>>,
  request: UnifiedAIRequest,
  cache_state: State<'_, AICacheState>,
) -> Result<UnifiedAIResponse, String> {
  // Проверяем кэш если это не streaming запрос
  if !request.stream.unwrap_or(false) {
    let cache = cache_state.cache.lock().await;
    let hash = AICacheManager::generate_hash(&request.provider, &request.model, &request.messages);

    // Пытаемся получить из кэша
    if let Ok(Some(cached_response)) = cache.get(&hash) {
      log::info!(
        "Returning cached response for provider {:?}",
        request.provider
      );
      return Ok(cached_response);
    }
  }

  // Определяем тип ключа по провайдеру
  let key_type = match request.provider {
    AIProvider::Claude => ApiKeyType::Claude,
    AIProvider::OpenAI => ApiKeyType::OpenAI,
    AIProvider::DeepSeek => ApiKeyType::DeepSeek,
    AIProvider::Ollama => {
      // Ollama не требует API ключ
      let manager = AIProviderManager::new();
      let response = manager
        .send_request("", request.clone())
        .await
        .map_err(|e| e.to_string())?;

      // Сохраняем в кэш если не streaming
      if !request.stream.unwrap_or(false) {
        let cache = cache_state.cache.lock().await;
        if let Err(e) = cache.set(&request, &response) {
          log::warn!("Failed to cache Ollama response: {}", e);
        }
      }

      return Ok(response);
    }
  };

  // Получаем API ключ из secure storage
  let mut storage_guard = storage.lock().await;
  let api_key_value = storage_guard
    .get_api_key_value(key_type)
    .await
    .map_err(|e| format!("Failed to get API key: {e}"))?
    .ok_or_else(|| format!("API key not found for provider: {:?}", request.provider))?;

  drop(storage_guard); // Освобождаем lock

  // Отправляем запрос
  let manager = AIProviderManager::new();
  let response = manager
    .send_request(&api_key_value, request.clone())
    .await
    .map_err(|e| e.to_string())?;

  // Сохраняем в кэш если не streaming
  if !request.stream.unwrap_or(false) {
    let cache = cache_state.cache.lock().await;
    if let Err(e) = cache.set(&request, &response) {
      log::warn!("Failed to cache response: {}", e);
    }
  }

  Ok(response)
}

/// Send AI request with tools using stored API key (secure) with caching
#[allow(clippy::too_many_arguments)]
#[tauri::command]
#[specta::specta]
pub async fn ai_send_secure_request_with_tools(
  storage: State<'_, Mutex<SecureStorage>>,
  provider: AIProvider,
  model: String,
  messages: Vec<AIMessage>,
  tools: Vec<AITool>,
  tool_choice: Option<ToolChoice>,
  system: Option<String>,
  max_tokens: Option<u32>,
  temperature: Option<f64>,
  cache_state: State<'_, AICacheState>,
) -> Result<UnifiedAIResponse, String> {
  let request = UnifiedAIRequest {
    provider: provider.clone(),
    model,
    messages,
    max_tokens,
    temperature,
    stream: Some(false),
    system,
    tools: Some(tools),
    tool_choice,
  };

  ai_send_secure_request(storage, request, cache_state).await
}

/// Send AI streaming request with real-time events
///
/// Отправляет streaming запрос и emit события через Tauri Event System.
/// События: ai-stream-started, ai-stream-chunk, ai-stream-completed, ai-stream-error
///
/// # Arguments
/// * `streaming_state` - AI Streaming State с AppHandle
/// * `api_key` - API ключ провайдера
/// * `request` - Унифицированный запрос
///
/// # Returns
/// * `request_id` - Уникальный ID запроса для отслеживания событий
#[tauri::command]
#[specta::specta]
pub async fn ai_send_streaming_request(
  streaming_state: State<'_, AIStreamingState>,
  api_key: String,
  request: UnifiedAIRequest,
) -> Result<String, String> {
  let manager = AIProviderManager::new();
  let request_id = Uuid::new_v4().to_string();
  let app_handle = streaming_state.app_handle.clone();

  // Spawn async task to handle streaming
  let request_id_clone = request_id.clone();
  tokio::spawn(async move {
    if let Err(e) = manager
      .send_request_stream(&api_key, request, app_handle, request_id_clone)
      .await
    {
      log::error!("Streaming request failed: {}", e);
    }
  });

  Ok(request_id)
}

/// Send AI streaming request using stored API key (secure)
///
/// Эта команда не требует передачи API ключа с frontend.
/// Ключ автоматически загружается из secure storage.
#[tauri::command]
#[specta::specta]
pub async fn ai_send_secure_streaming_request(
  streaming_state: State<'_, AIStreamingState>,
  storage: State<'_, Mutex<SecureStorage>>,
  request: UnifiedAIRequest,
) -> Result<String, String> {
  let app_handle = streaming_state.app_handle.clone();

  // Определяем тип ключа по провайдеру
  let key_type = match request.provider {
    AIProvider::Claude => ApiKeyType::Claude,
    AIProvider::OpenAI => ApiKeyType::OpenAI,
    AIProvider::DeepSeek => ApiKeyType::DeepSeek,
    AIProvider::Ollama => {
      // Ollama не требует API ключ
      let manager = AIProviderManager::new();
      let request_id = Uuid::new_v4().to_string();

      let request_id_clone = request_id.clone();
      tokio::spawn(async move {
        if let Err(e) = manager
          .send_request_stream("", request, app_handle, request_id_clone)
          .await
        {
          log::error!("Streaming request failed: {}", e);
        }
      });

      return Ok(request_id);
    }
  };

  // Получаем API ключ из secure storage
  let mut storage_guard = storage.lock().await;
  let api_key_value = storage_guard
    .get_api_key_value(key_type)
    .await
    .map_err(|e| format!("Failed to get API key: {e}"))?
    .ok_or_else(|| format!("API key not found for provider: {:?}", request.provider))?;

  drop(storage_guard); // Освобождаем lock

  // Отправляем streaming запрос
  let manager = AIProviderManager::new();
  let request_id = Uuid::new_v4().to_string();
  let app_handle = streaming_state.app_handle.clone();

  let request_id_clone = request_id.clone();
  tokio::spawn(async move {
    if let Err(e) = manager
      .send_request_stream(&api_key_value, request, app_handle, request_id_clone)
      .await
    {
      log::error!("Streaming request failed: {}", e);
    }
  });

  Ok(request_id)
}

/// Get AI cache statistics
#[tauri::command]
#[specta::specta]
pub async fn ai_get_cache_stats(
  cache_state: State<'_, AICacheState>,
) -> Result<CacheStats, String> {
  let cache = cache_state.cache.lock().await;
  cache.get_stats().map_err(|e| e.to_string())
}

/// Clear all AI cache
#[tauri::command]
#[specta::specta]
pub async fn ai_clear_cache(cache_state: State<'_, AICacheState>) -> Result<u32, String> {
  let cache = cache_state.cache.lock().await;
  cache
    .clear_all()
    .map(|count| count as u32)
    .map_err(|e| e.to_string())
}

/// Cleanup expired AI cache entries
#[tauri::command]
#[specta::specta]
pub async fn ai_cleanup_expired_cache(cache_state: State<'_, AICacheState>) -> Result<u32, String> {
  let cache = cache_state.cache.lock().await;
  cache
    .cleanup_expired()
    .map(|count| count as u32)
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_get_supported_providers() {
    let providers = ai_get_supported_providers().await.unwrap();
    assert_eq!(providers.len(), 4);
    assert!(providers.contains(&AIProvider::Claude));
    assert!(providers.contains(&AIProvider::OpenAI));
  }

  #[tokio::test]
  async fn test_get_provider_models() {
    let models = ai_get_provider_models(AIProvider::Claude).await.unwrap();
    assert!(!models.is_empty());
    assert!(models.iter().any(|m| m.contains("claude")));
  }
}

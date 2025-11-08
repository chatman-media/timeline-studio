//! Unified AI Commands
//!
//! Tauri команды для работы с множественными AI провайдерами
//! через единый унифицированный интерфейс.

use super::provider_manager::AIProviderManager;
use super::types::*;
use crate::security::{SecureStorage, ApiKeyType};
use tauri::State;
use tokio::sync::Mutex;

/// Send unified AI request (works with any provider)
#[tauri::command]
#[specta::specta]
pub async fn ai_send_unified_request(
  api_key: String,
  request: UnifiedAIRequest,
) -> Result<UnifiedAIResponse, String> {
  let manager = AIProviderManager::new();
  manager
    .send_request(&api_key, request)
    .await
    .map_err(|e| e.to_string())
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

/// Send AI request using stored API key (secure)
///
/// Эта команда не требует передачи API ключа с frontend.
/// Ключ автоматически загружается из secure storage.
#[tauri::command]
#[specta::specta]
pub async fn ai_send_secure_request(
  storage: State<'_, Mutex<SecureStorage>>,
  request: UnifiedAIRequest,
) -> Result<UnifiedAIResponse, String> {
  // Определяем тип ключа по провайдеру
  let key_type = match request.provider {
    AIProvider::Claude => ApiKeyType::Claude,
    AIProvider::OpenAI => ApiKeyType::OpenAI,
    AIProvider::DeepSeek => ApiKeyType::DeepSeek,
    AIProvider::Ollama => {
      // Ollama не требует API ключ
      let manager = AIProviderManager::new();
      return manager
        .send_request("", request)
        .await
        .map_err(|e| e.to_string());
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
  manager
    .send_request(&api_key_value, request)
    .await
    .map_err(|e| e.to_string())
}

/// Send AI request with tools using stored API key (secure)
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

  ai_send_secure_request(storage, request).await
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

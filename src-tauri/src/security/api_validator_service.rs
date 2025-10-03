//! API Validator Service - пример интеграции с DI Container
//!
//! Этот модуль демонстрирует как использовать DI Container для сервисов

use crate::core::{AppEvent, EventBus, Service};
use crate::security::api_validator::ApiValidator;
use crate::security::ApiKeyType;
use crate::video_compiler::error::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Сервис валидации API ключей с поддержкой DI
pub struct ApiValidatorService {
  validator: Arc<RwLock<ApiValidator>>,
  event_bus: Option<Arc<EventBus>>,
  initialized: bool,
}

impl ApiValidatorService {
  /// Создать новый экземпляр сервиса
  pub fn new() -> Self {
    Self {
      validator: Arc::new(RwLock::new(ApiValidator::new())),
      event_bus: None,
      initialized: false,
    }
  }

  /// Установить EventBus для публикации событий
  #[allow(dead_code)]
  pub fn with_event_bus(mut self, event_bus: Arc<EventBus>) -> Self {
    self.event_bus = Some(event_bus);
    self
  }

  /// Валидировать API ключ
  #[allow(dead_code)]
  pub async fn validate_key(&self, key_type: ApiKeyType, api_key: &str) -> Result<bool> {
    let validator = self.validator.read().await;
    let result = validator.validate_api_key(key_type.clone(), api_key).await;

    // Публикуем событие о валидации
    if let Some(event_bus) = &self.event_bus {
      let event = match &result {
        Ok(validation_result) if validation_result.is_valid => AppEvent::ConfigChanged {
          key: format!("api_key_valid_{key_type:?}"),
          value: serde_json::json!(true),
        },
        Ok(validation_result) if !validation_result.is_valid => AppEvent::ConfigChanged {
          key: format!("api_key_invalid_{key_type:?}"),
          value: serde_json::json!(validation_result.error_message),
        },
        Err(e) => AppEvent::ConfigChanged {
          key: format!("api_key_error_{key_type:?}"),
          value: serde_json::json!(e.to_string()),
        },
        _ => AppEvent::ConfigChanged {
          key: format!("api_key_unknown_{key_type:?}"),
          value: serde_json::json!("unknown"),
        },
      };

      let _ = event_bus.publish_app_event(event).await;
    }

    // Конвертируем ValidationResult в bool
    match result {
      Ok(validation_result) => Ok(validation_result.is_valid),
      Err(e) => Err(crate::video_compiler::error::VideoCompilerError::InternalError(e.to_string())),
    }
  }

  /// Проверить доступность сервиса
  #[allow(dead_code)]
  pub async fn check_service_availability(&self, key_type: ApiKeyType) -> Result<bool> {
    // Простая проверка - пытаемся валидировать пустой ключ
    // Если сервис доступен, он вернет ошибку валидации, а не сетевую ошибку
    let validator = self.validator.read().await;
    match validator.validate_api_key(key_type, "").await {
      Ok(_) => Ok(true),   // Сервис доступен (даже если ключ неверный)
      Err(_) => Ok(false), // Сервис недоступен
    }
  }
}

#[async_trait::async_trait]
impl Service for ApiValidatorService {
  async fn initialize(&mut self) -> Result<()> {
    if self.initialized {
      return Ok(());
    }

    log::info!("Initializing API Validator Service");

    // Здесь можно выполнить дополнительную инициализацию
    // Например, загрузить конфигурацию или проверить доступность сервисов

    self.initialized = true;

    // Публикуем событие об инициализации
    if let Some(event_bus) = &self.event_bus {
      let _ = event_bus.publish_app_event(AppEvent::SystemStartup).await;
    }

    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    log::info!("Shutting down API Validator Service");

    // Очистка ресурсов если необходимо

    self.initialized = false;
    Ok(())
  }

  fn name(&self) -> &'static str {
    "ApiValidatorService"
  }
}

impl Default for ApiValidatorService {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_service_lifecycle() {
    let mut service = ApiValidatorService::new();

    // Тест инициализации
    assert!(service.initialize().await.is_ok());
    assert!(service.initialized);

    // Повторная инициализация не должна вызывать ошибку
    assert!(service.initialize().await.is_ok());

    // Тест остановки
    assert!(service.shutdown().await.is_ok());
    assert!(!service.initialized);
  }

  #[tokio::test]
  async fn test_with_event_bus() {
    let event_bus = Arc::new(EventBus::new());
    let service = ApiValidatorService::new().with_event_bus(event_bus.clone());

    assert!(service.event_bus.is_some());
  }
}

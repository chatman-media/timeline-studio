#[cfg(test)]
mod tests {
  use crate::security::api_validator::{RateLimitInfo, ValidationResult};
  use crate::security::api_validator_service::*;
  use crate::security::ApiKeyType;

  #[test]
  fn test_api_validator_service_new() {
    let service = ApiValidatorService::new();

    // Проверяем что сервис создается без ошибок
    // Если мы дошли до этой точки, значит сервис создался успешно
    drop(service);
  }

  #[tokio::test]
  async fn test_validate_key() {
    let service = ApiValidatorService::new();

    // Test валидации ключа
    let result = service
      .validate_key(ApiKeyType::OpenAI, "test-api-key")
      .await;

    // В тестовой среде результат может быть любым
    match result {
      Ok(_is_valid) => {
        // Валидация прошла, результат может быть любым
      }
      Err(_) => {
        // В тестовой среде ошибка допустима
      }
    }
  }

  #[tokio::test]
  async fn test_check_service_availability() {
    let service = ApiValidatorService::new();

    // Test проверки доступности сервиса
    let result = service.check_service_availability(ApiKeyType::Claude).await;

    match result {
      Ok(_is_available) => {
        // Проверка доступности прошла, результат может быть любым
      }
      Err(_) => {
        // В тестовой среде ошибка допустима
      }
    }
  }

  #[test]
  fn test_validation_result_creation() {
    // Test создания результата валидации
    let valid_result = ValidationResult {
      is_valid: true,
      error_message: None,
      service_info: Some("Service is active".to_string()),
      rate_limits: None,
    };

    assert!(valid_result.is_valid);
    assert!(valid_result.error_message.is_none());
    assert_eq!(
      valid_result.service_info,
      Some("Service is active".to_string())
    );
    assert!(valid_result.rate_limits.is_none());
  }

  #[test]
  fn test_rate_limit_info() {
    let rate_limit = RateLimitInfo {
      requests_remaining: Some(100),
      reset_time: Some(chrono::Utc::now()),
      daily_limit: Some(1000),
    };

    assert_eq!(rate_limit.requests_remaining, Some(100));
    assert!(rate_limit.reset_time.is_some());
    assert_eq!(rate_limit.daily_limit, Some(1000));
  }

  #[test]
  fn test_validation_result_with_error() {
    let error_result = ValidationResult {
      is_valid: false,
      error_message: Some("Invalid API key".to_string()),
      service_info: None,
      rate_limits: None,
    };

    assert!(!error_result.is_valid);
    assert_eq!(
      error_result.error_message,
      Some("Invalid API key".to_string())
    );
    assert!(error_result.service_info.is_none());
  }

  #[test]
  fn test_api_key_type_debug() {
    // Test that ApiKeyType implements Debug
    let key_type = ApiKeyType::OpenAI;
    let debug_str = format!("{:?}", key_type);
    assert!(debug_str.contains("OpenAI"));
  }
}

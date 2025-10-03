//! Интеграционные тесты для модуля безопасности

mod common;
mod security;

use common::init_tests;

// Макрос test_module! можно использовать для инициализации тестов
// test_module!();

#[cfg(test)]
mod integration {
  use super::*;

  #[test]
  fn test_security_module_initialization() {
    init_tests();

    // Проверяем, что все модули безопасности доступны
    use timeline_studio_lib::security::{
      additional_commands, api_validator_service::ApiValidatorService, commands, ApiKeyType,
    };

    // Проверяем основные типы
    let _ = ApiKeyType::OpenAI;
    let _ = commands::ApiKeyOperationResult {
      success: true,
      message: "test".to_string(),
      data: None,
    };
    let _ = additional_commands::SecureStorageResult {
      success: true,
      storage_id: "test".to_string(),
      encryption_enabled: true,
      error: None,
    };

    // Проверяем, что сервис можно создать
    let _ = ApiValidatorService::new();
  }
}

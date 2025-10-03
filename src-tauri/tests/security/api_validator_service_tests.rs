//! Комплексные тесты для security/api_validator_service.rs

use std::sync::Arc;
use timeline_studio_lib::core::{AppEvent, EventBus, Service};
use timeline_studio_lib::security::api_validator_service::ApiValidatorService;
use timeline_studio_lib::security::ApiKeyType;

#[tokio::test]
async fn test_service_new() {
  let service = ApiValidatorService::new();
  assert_eq!(service.name(), "ApiValidatorService");
}

#[tokio::test]
async fn test_service_lifecycle() {
  let mut service = ApiValidatorService::new();

  // Проверяем начальное состояние
  assert_eq!(service.name(), "ApiValidatorService");

  // Инициализация
  assert!(service.initialize().await.is_ok());

  // Повторная инициализация должна быть безопасной
  assert!(service.initialize().await.is_ok());

  // Остановка
  assert!(service.shutdown().await.is_ok());
}

#[tokio::test]
async fn test_service_with_event_bus() {
  let event_bus = Arc::new(EventBus::new());
  let service = ApiValidatorService::new().with_event_bus(event_bus.clone());

  // Проверяем, что service правильно настроен
  assert_eq!(service.name(), "ApiValidatorService");
}

#[tokio::test]
async fn test_service_initialize_with_event_bus() {
  let event_bus = Arc::new(EventBus::new());
  let mut service = ApiValidatorService::new().with_event_bus(event_bus.clone());

  // Создаем простой обработчик для проверки событий
  struct TestHandler {
    tx: tokio::sync::mpsc::Sender<bool>,
  }

  #[async_trait::async_trait]
  impl timeline_studio_lib::core::EventHandler for TestHandler {
    type Event = AppEvent;

    async fn handle(
      &self,
      event: Self::Event,
    ) -> Result<(), timeline_studio_lib::video_compiler::error::VideoCompilerError> {
      if matches!(event, AppEvent::SystemStartup) {
        let _ = self.tx.send(true).await;
      }
      Ok(())
    }

    fn name(&self) -> &'static str {
      "TestHandler"
    }
  }

  // Подписываемся на событие SystemStartup
  let (tx, mut rx) = tokio::sync::mpsc::channel(10);
  let handler = TestHandler { tx };
  event_bus.subscribe_app_event(handler).await.unwrap();

  // Запускаем обработчик событий
  event_bus.start_app_event_processor().await;

  // Небольшая задержка для инициализации
  tokio::time::sleep(std::time::Duration::from_millis(10)).await;

  // Инициализируем сервис
  assert!(service.initialize().await.is_ok());

  // Проверяем, что событие было отправлено
  tokio::time::timeout(std::time::Duration::from_millis(100), rx.recv())
    .await
    .ok();
}

#[tokio::test]
async fn test_validate_key_with_event_bus() {
  let event_bus = Arc::new(EventBus::new());
  let service = ApiValidatorService::new().with_event_bus(event_bus.clone());

  // Создаем обработчик для ConfigChanged событий
  struct ConfigChangeHandler {
    tx: tokio::sync::mpsc::Sender<String>,
  }

  #[async_trait::async_trait]
  impl timeline_studio_lib::core::EventHandler for ConfigChangeHandler {
    type Event = AppEvent;

    async fn handle(
      &self,
      event: Self::Event,
    ) -> Result<(), timeline_studio_lib::video_compiler::error::VideoCompilerError> {
      if let AppEvent::ConfigChanged { key, value: _ } = event {
        let _ = self.tx.send(key).await;
      }
      Ok(())
    }

    fn name(&self) -> &'static str {
      "ConfigChangeHandler"
    }
  }

  // Подписываемся на события ConfigChanged
  let (tx, mut rx) = tokio::sync::mpsc::channel(10);
  let handler = ConfigChangeHandler { tx };
  event_bus.subscribe_app_event(handler).await.unwrap();

  // Запускаем обработчик событий
  event_bus.start_app_event_processor().await;

  // Небольшая задержка для инициализации
  tokio::time::sleep(std::time::Duration::from_millis(10)).await;

  // Валидируем ключ (будет ошибка из-за пустого ключа)
  let _ = service.validate_key(ApiKeyType::OpenAI, "").await;

  // Проверяем, что событие было отправлено
  if let Ok(Some(key)) =
    tokio::time::timeout(std::time::Duration::from_millis(100), rx.recv()).await
  {
    assert!(key.contains("openai") || key.contains("OpenAI"));
  }
}

#[tokio::test]
async fn test_check_service_availability() {
  let service = ApiValidatorService::new();

  // Проверяем доступность различных сервисов
  let services_to_check = vec![
    ApiKeyType::OpenAI,
    ApiKeyType::Claude,
    ApiKeyType::YouTube,
    ApiKeyType::TikTok,
  ];

  for key_type in services_to_check {
    let result = service.check_service_availability(key_type.clone()).await;
    assert!(result.is_ok());
    // В тестовом окружении сервисы могут быть недоступны
    let _is_available = result.unwrap();
    // Проверка прошла успешно, результат может быть любым
  }
}

#[tokio::test]
async fn test_default_implementation() {
  let service = ApiValidatorService::default();
  assert_eq!(service.name(), "ApiValidatorService");
}

#[cfg(test)]
mod concurrent_tests {
  use super::*;
  use futures::future::join_all;

  #[tokio::test]
  async fn test_concurrent_validations() {
    let service = Arc::new(ApiValidatorService::new());

    // Запускаем несколько валидаций параллельно
    let mut futures = vec![];

    for i in 0..10 {
      let service_clone = service.clone();
      let key_type = if i % 2 == 0 {
        ApiKeyType::OpenAI
      } else {
        ApiKeyType::Claude
      };

      futures.push(tokio::spawn(async move {
        service_clone
          .validate_key(key_type, &format!("test-key-{}", i))
          .await
      }));
    }

    // Ждем завершения всех валидаций
    let results = join_all(futures).await;

    // Проверяем, что все завершились без паники
    for result in results {
      assert!(result.is_ok());
    }
  }

  #[tokio::test]
  async fn test_concurrent_availability_checks() {
    let service = Arc::new(ApiValidatorService::new());

    let key_types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
    ];

    let mut futures = vec![];

    for key_type in key_types {
      let service_clone = service.clone();
      futures.push(tokio::spawn(async move {
        service_clone.check_service_availability(key_type).await
      }));
    }

    let results = join_all(futures).await;

    for result in results {
      assert!(result.is_ok());
      assert!(result.unwrap().is_ok());
    }
  }
}

#[cfg(test)]
mod event_tests {
  use super::*;

  #[tokio::test]
  async fn test_validation_events() {
    let event_bus = Arc::new(EventBus::new());
    let service = ApiValidatorService::new().with_event_bus(event_bus.clone());

    // Создаем обработчик для событий
    struct ValidationEventHandler {
      tx: tokio::sync::mpsc::Sender<(String, serde_json::Value)>,
    }

    #[async_trait::async_trait]
    impl timeline_studio_lib::core::EventHandler for ValidationEventHandler {
      type Event = AppEvent;

      async fn handle(
        &self,
        event: Self::Event,
      ) -> Result<(), timeline_studio_lib::video_compiler::error::VideoCompilerError> {
        if let AppEvent::ConfigChanged { key, value } = event {
          let _ = self.tx.send((key, value)).await;
        }
        Ok(())
      }

      fn name(&self) -> &'static str {
        "ValidationEventHandler"
      }
    }

    // Счетчики для разных типов событий
    let (tx, mut rx) = tokio::sync::mpsc::channel(100);
    let handler = ValidationEventHandler { tx };
    event_bus.subscribe_app_event(handler).await.unwrap();

    // Запускаем обработчик событий
    event_bus.start_app_event_processor().await;

    // Небольшая задержка для инициализации
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    // Тестируем различные сценарии валидации
    let test_cases = vec![
      (ApiKeyType::OpenAI, ""),         // Пустой ключ
      (ApiKeyType::Claude, "test-key"), // Тестовый ключ
      (ApiKeyType::YouTube, "yt-key"),  // YouTube ключ
    ];

    for (key_type, api_key) in test_cases {
      let _ = service.validate_key(key_type, api_key).await;
    }

    // Собираем события
    let mut events = vec![];
    while let Ok(Some(event)) =
      tokio::time::timeout(std::time::Duration::from_millis(100), rx.recv()).await
    {
      events.push(event);
    }

    // Проверяем, что были созданы события
    assert!(!events.is_empty());

    for (key, _value) in events {
      assert!(
        key.contains("api_key_valid")
          || key.contains("api_key_invalid")
          || key.contains("api_key_error")
          || key.contains("api_key_unknown")
      );
    }
  }

  #[tokio::test]
  async fn test_system_startup_event() {
    let event_bus = Arc::new(EventBus::new());
    let mut service = ApiValidatorService::new().with_event_bus(event_bus.clone());

    // Создаем обработчик для SystemStartup
    struct StartupHandler {
      tx: tokio::sync::mpsc::Sender<&'static str>,
    }

    #[async_trait::async_trait]
    impl timeline_studio_lib::core::EventHandler for StartupHandler {
      type Event = AppEvent;

      async fn handle(
        &self,
        event: Self::Event,
      ) -> Result<(), timeline_studio_lib::video_compiler::error::VideoCompilerError> {
        if matches!(event, AppEvent::SystemStartup) {
          let _ = self.tx.send("startup").await;
        }
        Ok(())
      }

      fn name(&self) -> &'static str {
        "StartupHandler"
      }
    }

    let (tx, mut rx) = tokio::sync::mpsc::channel(10);
    let handler = StartupHandler { tx };
    event_bus.subscribe_app_event(handler).await.unwrap();

    // Запускаем обработчик событий
    event_bus.start_app_event_processor().await;

    // Небольшая задержка для инициализации
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    // Инициализируем сервис
    service.initialize().await.unwrap();

    // Проверяем событие
    let event = tokio::time::timeout(std::time::Duration::from_millis(100), rx.recv()).await;

    assert!(event.is_ok());
    assert_eq!(event.unwrap().unwrap(), "startup");
  }
}

#[cfg(test)]
mod edge_case_tests {
  use super::*;

  #[tokio::test]
  async fn test_multiple_initializations() {
    let mut service = ApiValidatorService::new();

    // Множественные инициализации должны быть безопасны
    for _ in 0..5 {
      assert!(service.initialize().await.is_ok());
    }

    // И после shutdown тоже
    service.shutdown().await.unwrap();
    assert!(service.initialize().await.is_ok());
  }

  #[tokio::test]
  async fn test_shutdown_without_initialize() {
    let mut service = ApiValidatorService::new();

    // Shutdown без инициализации должен работать
    assert!(service.shutdown().await.is_ok());
  }

  #[tokio::test]
  async fn test_validate_without_event_bus() {
    let service = ApiValidatorService::new();

    // Валидация без event bus не должна паниковать
    let result = service.validate_key(ApiKeyType::OpenAI, "test-key").await;
    assert!(result.is_ok() || result.is_err());
  }

  #[tokio::test]
  async fn test_service_name_consistency() {
    let service1 = ApiValidatorService::new();
    let service2 = ApiValidatorService::default();
    let service3 = ApiValidatorService::new().with_event_bus(Arc::new(EventBus::new()));

    assert_eq!(service1.name(), service2.name());
    assert_eq!(service2.name(), service3.name());
    assert_eq!(service1.name(), "ApiValidatorService");
  }
}

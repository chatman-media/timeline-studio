//! OpenTelemetry интеграция для мониторинга и трассировки

pub mod alerts;
pub mod config;
pub mod examples;
pub mod health;
pub mod metrics;
pub mod middleware;
pub mod tracer;

pub use alerts::{Alert, AlertManager, AlertRule, AlertSeverity};
pub use config::{
  HealthConfig, LogLevel, MetricsExporter, TelemetryConfig, TelemetryConfigBuilder,
  TracingExporter,
};
pub use health::HealthCheckManager;
pub use metrics::MetricsCollector;
pub use tracer::Tracer;

use crate::video_compiler::error::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Менеджер телеметрии
pub struct TelemetryManager {
  tracer: Arc<Tracer>,
  metrics: Arc<MetricsCollector>,
  health: Arc<HealthCheckManager>,
  alerts: Arc<AlertManager>,
  config: Arc<RwLock<TelemetryConfig>>,
}

impl TelemetryManager {
  /// Создать новый менеджер телеметрии
  pub async fn new(config: TelemetryConfig) -> Result<Self> {
    let tracer = Arc::new(Tracer::new(&config).await?);
    let metrics = Arc::new(MetricsCollector::new(&config).await?);
    let health = Arc::new(HealthCheckManager::new());
    let alerts = Arc::new(AlertManager::new());

    // Добавляем базовые health checks
    health
      .add_check(Box::new(health::DatabaseHealthCheck::new()))
      .await;
    health
      .add_check(Box::new(health::MemoryHealthCheck::new()))
      .await;

    Ok(Self {
      tracer,
      metrics,
      health,
      alerts,
      config: Arc::new(RwLock::new(config)),
    })
  }

  /// Получить tracer
  pub fn tracer(&self) -> Arc<Tracer> {
    self.tracer.clone()
  }

  /// Получить metrics collector
  pub fn metrics(&self) -> Arc<MetricsCollector> {
    self.metrics.clone()
  }

  /// Получить health check manager
  pub fn health(&self) -> Arc<HealthCheckManager> {
    self.health.clone()
  }

  /// Получить alert manager
  pub fn alerts(&self) -> Arc<AlertManager> {
    self.alerts.clone()
  }

  /// Инициализировать телеметрию (для совместимости с существующим кодом)
  pub async fn initialize(&self) -> Result<()> {
    // Телеметрия уже инициализирована в конструкторе
    // Этот метод оставлен для совместимости
    Ok(())
  }

  /// Обновить конфигурацию
  pub async fn update_config(&self, config: TelemetryConfig) -> Result<()> {
    let mut current = self.config.write().await;
    *current = config;

    // Примечание: Реконфигурация tracer и metrics требует перезапуска
    // OpenTelemetry SDK не поддерживает горячую реконфигурацию
    // Для применения изменений требуется вызвать shutdown() и создать новый TelemetryManager

    Ok(())
  }

  /// Добавить health checks для компонентов системы
  pub async fn setup_system_health_checks(
    &self,
    event_bus: Option<Arc<crate::core::EventBus>>,
    plugin_manager: Option<Arc<crate::core::PluginManager>>,
  ) -> Result<()> {
    if let Some(event_bus) = event_bus {
      self
        .health
        .add_check(Box::new(health::EventBusHealthCheck::new(event_bus)))
        .await;
    }

    if let Some(plugin_manager) = plugin_manager {
      self
        .health
        .add_check(Box::new(health::PluginHealthCheck::new(plugin_manager)))
        .await;
    }

    Ok(())
  }

  /// Завершить работу телеметрии
  pub async fn shutdown(&self) -> Result<()> {
    self.tracer.shutdown().await?;
    self.metrics.shutdown().await?;
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_telemetry_manager_creation() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await;

    assert!(manager.is_ok());
    let manager = manager.unwrap();

    // Проверяем что все компоненты созданы
    // Arc всегда валидны, просто проверяем что они существуют
    let _ = manager.tracer();
    let _ = manager.metrics();
    let _ = manager.health();
  }

  #[tokio::test]
  async fn test_telemetry_manager_disabled() {
    let config = TelemetryConfig {
      enabled: false,
      ..Default::default()
    };

    let manager = TelemetryManager::new(config).await;
    assert!(manager.is_ok());

    // Даже с отключенной телеметрией менеджер должен работать
    let manager = manager.unwrap();
    let tracer = manager.tracer();
    let metrics = manager.metrics();
    let health = manager.health();

    // Компоненты должны быть созданы (Arc всегда валидны)
    // Просто проверяем что можем получить ссылки
    assert!(Arc::strong_count(&tracer) >= 1);
    assert!(Arc::strong_count(&metrics) >= 1);
    assert!(Arc::strong_count(&health) >= 1);
  }

  #[tokio::test]
  async fn test_telemetry_manager_health_checks() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Проверяем что базовые health checks добавлены
    let checks = manager.health.list_checks().await;
    assert!(checks.contains(&"database".to_string()));
    assert!(checks.contains(&"memory".to_string()));
  }

  #[tokio::test]
  async fn test_telemetry_manager_config_update() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Обновляем конфигурацию
    let new_config = TelemetryConfig {
      service_name: "updated-service".to_string(),
      ..Default::default()
    };

    let result = manager.update_config(new_config.clone()).await;
    assert!(result.is_ok());

    // Проверяем что конфигурация обновлена
    let current_config = manager.config.read().await;
    assert_eq!(current_config.service_name, "updated-service");
  }

  #[tokio::test]
  async fn test_telemetry_manager_shutdown() {
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Shutdown должен работать без ошибок
    let result = manager.shutdown().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_telemetry_manager_system_health_checks() {
    use crate::core::plugins::plugin::Version;
    use crate::core::{EventBus, PluginManager, ServiceContainer};

    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Создаем моковые компоненты
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version {
      major: 1,
      minor: 0,
      patch: 0,
      pre_release: None,
    };
    let plugin_manager = Arc::new(PluginManager::new(
      app_version,
      event_bus.clone(),
      service_container,
    ));

    // Добавляем системные health checks
    let result = manager
      .setup_system_health_checks(Some(event_bus), Some(plugin_manager))
      .await;

    assert!(result.is_ok());

    // Проверяем что health checks добавлены
    let checks = manager.health.list_checks().await;
    assert!(checks.len() >= 2); // Как минимум database и memory
  }

  #[tokio::test]
  async fn test_telemetry_sampling_logic() {
    // Тест логики семплирования трейсов
    let mut config = TelemetryConfig::default();
    config.tracing.sample_rate = 0.5; // 50% семплирование

    let manager = TelemetryManager::new(config).await.unwrap();
    let tracer = manager.tracer();

    // Генерируем множество трейсов для проверки семплирования
    let mut completed_traces = 0;
    let total_traces = 100;

    for i in 0..total_traces {
      let result = tracer
        .trace(&format!("sample_operation_{i}"), async {
          tokio::time::sleep(std::time::Duration::from_millis(1)).await;
          Ok::<i32, crate::video_compiler::error::VideoCompilerError>(i)
        })
        .await;

      if result.is_ok() {
        completed_traces += 1;
      }
    }

    // Все трейсы должны выполниться (семплирование влияет на экспорт, а не на выполнение)
    assert_eq!(completed_traces, total_traces);

    // Тестируем различные sample rate
    let configs_to_test = vec![0.0, 0.25, 0.75, 1.0];

    for sample_rate in configs_to_test {
      let mut test_config = TelemetryConfig::default();
      test_config.tracing.sample_rate = sample_rate;

      let test_manager = TelemetryManager::new(test_config).await.unwrap();
      let test_tracer = test_manager.tracer();

      // Проверяем что tracer создается корректно с любым sample rate
      let result = test_tracer
        .trace("sample_rate_test", async {
          Ok::<String, crate::video_compiler::error::VideoCompilerError>(format!(
            "rate_{sample_rate}"
          ))
        })
        .await;

      assert!(result.is_ok());
      assert_eq!(result.unwrap(), format!("rate_{sample_rate}"));
    }
  }

  #[tokio::test]
  async fn test_telemetry_integration_pipeline() {
    // Тест полной интеграции telemetry pipeline
    use crate::core::plugins::plugin::Version;
    use crate::core::{EventBus, PluginManager, ServiceContainer};

    let mut config = TelemetryConfig::default();
    config.metrics.system_metrics = true;
    config.tracing.sample_rate = 1.0; // Включаем все трейсы для тестирования

    let manager = TelemetryManager::new(config).await.unwrap();

    // Настраиваем системные компоненты
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);
    let plugin_manager = Arc::new(PluginManager::new(
      app_version,
      event_bus.clone(),
      service_container,
    ));

    // Добавляем системные health checks
    manager
      .setup_system_health_checks(Some(event_bus), Some(plugin_manager))
      .await
      .unwrap();

    // Получаем компоненты
    let tracer = manager.tracer();
    let metrics = manager.metrics();
    let health = manager.health();

    // Тестируем полный pipeline:
    // 1. Создаем метрики
    let request_counter = metrics
      .counter("integration_requests_total", "Integration test requests")
      .unwrap();

    let response_time = metrics
      .histogram("integration_response_time", "Integration response time")
      .unwrap();

    // 2. Генерируем трейсы с метриками
    for i in 0..5 {
      let operation_name = format!("integration_operation_{i}");

      let result = tracer
        .span(&operation_name)
        .with_attribute("operation.id", i.to_string())
        .with_attribute("test.type", "integration")
        .run(async {
          let start = std::time::Instant::now();

          // Симулируем работу
          tokio::time::sleep(std::time::Duration::from_millis(10 + i * 2)).await;

          // Обновляем метрики
          request_counter.inc();
          response_time.observe(start.elapsed().as_secs_f64());

          Ok::<String, crate::video_compiler::error::VideoCompilerError>(format!("completed_{i}"))
        })
        .await;

      assert!(result.is_ok());
    }

    // 3. Проверяем health checks
    let health_summary = health.check_all().await;
    assert!(!health_summary.checks.is_empty());

    // 4. Собираем системные метрики
    metrics.collect_system_metrics().await.unwrap();

    // 5. Проверяем что все компоненты работают корректно
    // Попробуем создать метрики еще раз - если они уже зарегистрированы, получим ошибку
    let duplicate_counter = metrics.counter("integration_requests_total", "Should be registered");
    assert!(
      duplicate_counter.is_err(),
      "Counter should already be registered"
    );

    let duplicate_histogram =
      metrics.histogram("integration_response_time", "Should be registered");
    assert!(
      duplicate_histogram.is_err(),
      "Histogram should already be registered"
    );

    // 6. Завершаем корректно
    manager.shutdown().await.unwrap();
  }

  #[tokio::test]
  async fn test_telemetry_manager_partial_system_health_setup() {
    // Тест setup с частичными компонентами
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Тест только с event_bus
    let event_bus = Arc::new(crate::core::EventBus::new());
    let result = manager
      .setup_system_health_checks(Some(event_bus), None)
      .await;
    assert!(result.is_ok());

    // Тест только с plugin_manager
    let service_container = Arc::new(crate::core::ServiceContainer::new());
    let app_version = crate::core::plugins::plugin::Version::new(1, 0, 0);
    let event_bus2 = Arc::new(crate::core::EventBus::new());
    let plugin_manager = Arc::new(crate::core::PluginManager::new(
      app_version,
      event_bus2,
      service_container,
    ));

    let result2 = manager
      .setup_system_health_checks(None, Some(plugin_manager))
      .await;
    assert!(result2.is_ok());

    // Тест без компонентов
    let result3 = manager.setup_system_health_checks(None, None).await;
    assert!(result3.is_ok());
  }

  #[tokio::test]
  async fn test_telemetry_manager_arc_cloning() {
    // Тест клонирования Arc компонентов
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    let tracer1 = manager.tracer();
    let tracer2 = manager.tracer();
    let metrics1 = manager.metrics();
    let metrics2 = manager.metrics();
    let health1 = manager.health();
    let health2 = manager.health();

    // Проверяем что Arc ссылаются на одни и те же объекты
    assert!(Arc::ptr_eq(&tracer1, &tracer2));
    assert!(Arc::ptr_eq(&metrics1, &metrics2));
    assert!(Arc::ptr_eq(&health1, &health2));
  }

  #[tokio::test]
  async fn test_telemetry_manager_config_variations() {
    // Тест различных конфигураций
    let configs = vec![
      TelemetryConfig {
        enabled: true,
        service_name: "test-service-1".to_string(),
        ..Default::default()
      },
      TelemetryConfig {
        enabled: false,
        service_name: "test-service-2".to_string(),
        ..Default::default()
      },
      TelemetryConfig {
        enabled: true,
        service_name: "test-service-3".to_string(),
        environment: "test".to_string(),
        ..Default::default()
      },
    ];

    for config in configs {
      let service_name = config.service_name.clone();
      let result = TelemetryManager::new(config).await;
      assert!(
        result.is_ok(),
        "Failed to create manager for {}",
        service_name
      );

      let manager = result.unwrap();
      // Просто проверяем что tracer существует и можно выполнить операцию
      let tracer = manager.tracer();
      let _ = tracer.current_context(); // Проверяем что tracer работает
    }
  }

  #[tokio::test]
  async fn test_telemetry_manager_concurrent_access() {
    // Тест конкурентного доступа к компонентам
    let config = TelemetryConfig::default();
    let manager = Arc::new(TelemetryManager::new(config).await.unwrap());

    let mut handles = vec![];

    // Запускаем несколько задач параллельно
    for i in 0..10 {
      let manager_clone = Arc::clone(&manager);
      let handle = tokio::spawn(async move {
        let tracer = manager_clone.tracer();
        let _metrics = manager_clone.metrics();
        let health = manager_clone.health();

        // Выполняем операции трассировки
        let result = tracer
          .trace(&format!("concurrent_operation_{i}"), async {
            tokio::time::sleep(std::time::Duration::from_millis(1)).await;
            Ok::<i32, crate::video_compiler::error::VideoCompilerError>(i)
          })
          .await;

        assert!(result.is_ok());

        // Проверяем health checks
        let checks = health.list_checks().await;
        assert!(!checks.is_empty());

        i
      });
      handles.push(handle);
    }

    // Ждем завершения всех задач
    let mut results = Vec::new();
    for handle in handles {
      let result = handle.await.unwrap();
      results.push(result);
    }

    // Проверяем что все операции завершились корректно
    results.sort();
    assert_eq!(results, (0..10).collect::<Vec<_>>());
  }

  #[tokio::test]
  async fn test_telemetry_manager_error_handling() {
    // Тест обработки ошибок
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Тест обновления конфигурации с невалидными данными
    let invalid_config = TelemetryConfig {
      service_name: "".to_string(), // Пустое имя может быть проблематично
      ..Default::default()
    };

    let result = manager.update_config(invalid_config).await;
    assert!(result.is_ok()); // Update_config принимает любые данные

    // Тест множественных shutdown вызовов
    let result1 = manager.shutdown().await;
    assert!(result1.is_ok());

    let result2 = manager.shutdown().await;
    assert!(result2.is_ok()); // Повторный shutdown должен быть безопасен
  }

  #[tokio::test]
  async fn test_telemetry_manager_memory_usage() {
    // Тест управления памятью
    let config = TelemetryConfig::default();
    let manager = TelemetryManager::new(config).await.unwrap();

    // Получаем начальные счетчики Arc
    let initial_tracer_count = Arc::strong_count(&manager.tracer);
    let initial_metrics_count = Arc::strong_count(&manager.metrics);
    let initial_health_count = Arc::strong_count(&manager.health);

    {
      // Создаем локальные копии Arc
      let _tracer = manager.tracer();
      let _metrics = manager.metrics();
      let _health = manager.health();

      // Счетчики должны увеличиться
      assert!(Arc::strong_count(&manager.tracer) > initial_tracer_count);
      assert!(Arc::strong_count(&manager.metrics) > initial_metrics_count);
      assert!(Arc::strong_count(&manager.health) > initial_health_count);
    }

    // После выхода из области видимости счетчики должны вернуться
    assert_eq!(Arc::strong_count(&manager.tracer), initial_tracer_count);
    assert_eq!(Arc::strong_count(&manager.metrics), initial_metrics_count);
    assert_eq!(Arc::strong_count(&manager.health), initial_health_count);
  }

  #[tokio::test]
  async fn test_telemetry_manager_configuration_persistence() {
    // Тест сохранения конфигурации
    let original_config = TelemetryConfig {
      service_name: "original-service".to_string(),
      environment: "development".to_string(),
      ..Default::default()
    };

    let manager = TelemetryManager::new(original_config.clone())
      .await
      .unwrap();

    // Проверяем исходную конфигурацию
    {
      let current_config = manager.config.read().await;
      assert_eq!(current_config.service_name, "original-service");
      assert_eq!(current_config.environment, "development");
    }

    // Обновляем конфигурацию
    let updated_config = TelemetryConfig {
      service_name: "updated-service".to_string(),
      environment: "production".to_string(),
      ..Default::default()
    };

    manager.update_config(updated_config).await.unwrap();

    // Проверяем обновленную конфигурацию
    {
      let current_config = manager.config.read().await;
      assert_eq!(current_config.service_name, "updated-service");
      assert_eq!(current_config.environment, "production");
    }

    // Проверяем что конфигурация персистентна
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    {
      let current_config = manager.config.read().await;
      assert_eq!(current_config.service_name, "updated-service");
      assert_eq!(current_config.environment, "production");
    }
  }
}

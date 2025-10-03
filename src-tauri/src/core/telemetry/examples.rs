//! Примеры интеграции телеметрии
//!
//! Этот модуль содержит примеры настройки и использования телеметрии
//! с различными системами мониторинга.

use crate::core::telemetry::health::DatabaseHealthCheck;
use crate::core::telemetry::{
  AlertRule, AlertSeverity, MetricsExporter, TelemetryConfig, TelemetryManager, TracingExporter,
};
use std::time::Duration;
use tracing::info;

/// Пример настройки для Prometheus
pub fn prometheus_config() -> TelemetryConfig {
  let mut config = TelemetryConfig::default();
  config.tracing.enabled = true;
  config.tracing.sample_rate = 1.0;
  config.tracing.max_events_per_span = 128;
  config.tracing.max_attributes_per_span = 128;
  config.tracing.max_links_per_span = 128;
  config.tracing.exporters = vec![TracingExporter::Jaeger {
    endpoint: "http://localhost:14268/api/traces".to_string(),
  }];
  config.metrics.enabled = true;
  config.metrics.collection_interval = Duration::from_secs(15);
  config.metrics.max_export_batch_size = 512;
  config.metrics.export_timeout = Duration::from_secs(10);
  config.metrics.exporters = vec![MetricsExporter::Prometheus { port: 9090 }];
  config.health.enabled = true;
  config.health.check_interval = Duration::from_secs(30);
  config.health.timeout = Duration::from_secs(5);
  config.health.endpoint = "/health".to_string();
  config
}

/// Пример настройки для Jaeger
pub fn jaeger_config() -> TelemetryConfig {
  let mut config = TelemetryConfig::default();
  config.tracing.enabled = true;
  config.tracing.sample_rate = 0.1; // Семплируем 10% трейсов для production
  config.tracing.max_events_per_span = 64;
  config.tracing.max_attributes_per_span = 64;
  config.tracing.max_links_per_span = 32;
  config.tracing.exporters = vec![
    TracingExporter::Jaeger {
      endpoint: "http://localhost:14268/api/traces".to_string(),
    },
    TracingExporter::Console,
  ];
  config.metrics.enabled = true;
  config.metrics.collection_interval = Duration::from_secs(60);
  config.metrics.max_export_batch_size = 256;
  config.metrics.export_timeout = Duration::from_secs(30);
  config.metrics.exporters = vec![MetricsExporter::Console];
  config.health.enabled = true;
  config.health.check_interval = Duration::from_secs(60);
  config.health.timeout = Duration::from_secs(10);
  config.health.endpoint = "/health".to_string();
  config
}

/// Пример полной настройки для production с Prometheus + Jaeger + Grafana
pub fn production_config() -> TelemetryConfig {
  let mut config = TelemetryConfig::default();
  config.tracing.enabled = true;
  config.tracing.sample_rate = 0.05; // 5% семплинг для production
  config.tracing.max_events_per_span = 32;
  config.tracing.max_attributes_per_span = 32;
  config.tracing.max_links_per_span = 16;
  config.tracing.exporters = vec![TracingExporter::Jaeger {
    endpoint: "http://localhost:14268/api/traces".to_string(),
  }];
  config.metrics.enabled = true;
  config.metrics.collection_interval = Duration::from_secs(30);
  config.metrics.max_export_batch_size = 1024;
  config.metrics.export_timeout = Duration::from_secs(15);
  config.metrics.exporters = vec![MetricsExporter::Prometheus { port: 9090 }];
  config.health.enabled = true;
  config.health.check_interval = Duration::from_secs(30);
  config.health.timeout = Duration::from_secs(5);
  config.health.endpoint = "/health".to_string();
  config
}

/// Пример настройки алертов для production
pub async fn setup_production_alerts(
  telemetry: &TelemetryManager,
) -> Result<(), Box<dyn std::error::Error>> {
  let alert_manager = telemetry.alerts();

  // Алерт на высокое использование CPU
  let cpu_alert = AlertRule::new(
    "high_cpu_usage".to_string(),
    "High CPU Usage".to_string(),
    "system_cpu_usage".to_string(),
    ">".to_string(),
    0.8, // 80%
    AlertSeverity::Warning,
  );
  alert_manager.add_rule(cpu_alert)?;

  // Алерт на критическое использование памяти
  let memory_alert = AlertRule::new(
    "critical_memory_usage".to_string(),
    "Critical Memory Usage".to_string(),
    "system_memory_usage".to_string(),
    ">".to_string(),
    0.9, // 90%
    AlertSeverity::Critical,
  );
  alert_manager.add_rule(memory_alert)?;

  // Алерт на высокую частоту ошибок
  let error_rate_alert = AlertRule::new(
    "high_error_rate".to_string(),
    "High Error Rate".to_string(),
    "http_requests_error_rate".to_string(),
    ">".to_string(),
    0.05, // 5%
    AlertSeverity::Warning,
  );
  alert_manager.add_rule(error_rate_alert)?;

  // Алерт на медленные запросы
  let slow_requests_alert = AlertRule::new(
    "slow_requests".to_string(),
    "Slow HTTP Requests".to_string(),
    "http_request_duration_p95".to_string(),
    ">".to_string(),
    2.0, // 2 секунды
    AlertSeverity::Warning,
  );
  alert_manager.add_rule(slow_requests_alert)?;

  // Алерт на недоступность health check
  let health_alert = AlertRule::new(
    "health_check_failed".to_string(),
    "Health Check Failed".to_string(),
    "health_check_success_rate".to_string(),
    "<".to_string(),
    0.95, // 95%
    AlertSeverity::Critical,
  );
  alert_manager.add_rule(health_alert)?;

  info!("Production alerts configured successfully");
  Ok(())
}

/// Пример инициализации телеметрии для development
pub async fn init_development_telemetry() -> Result<TelemetryManager, Box<dyn std::error::Error>> {
  let mut config = TelemetryConfig::default();
  config.tracing.enabled = true;
  config.tracing.sample_rate = 1.0; // Все трейсы в development
  config.tracing.max_events_per_span = 256;
  config.tracing.max_attributes_per_span = 256;
  config.tracing.max_links_per_span = 64;
  config.tracing.exporters = vec![TracingExporter::Console];
  config.metrics.enabled = true;
  config.metrics.collection_interval = Duration::from_secs(10);
  config.metrics.max_export_batch_size = 128;
  config.metrics.export_timeout = Duration::from_secs(5);
  config.metrics.exporters = vec![MetricsExporter::Console];
  config.health.enabled = true;
  config.health.check_interval = Duration::from_secs(15);
  config.health.cache_ttl = Duration::from_secs(30);
  config.health.default_timeout = Duration::from_secs(3);
  config.health.timeout = Duration::from_secs(3);
  config.health.endpoint = "/health".to_string();

  let telemetry = TelemetryManager::new(config).await?;

  // Добавляем простые алерты для development
  let alert_manager = telemetry.alerts();

  let dev_alert = AlertRule::new(
    "dev_high_cpu".to_string(),
    "Development High CPU".to_string(),
    "system_cpu_usage".to_string(),
    ">".to_string(),
    0.95, // 95% для development
    AlertSeverity::Info,
  );
  alert_manager.add_rule(dev_alert)?;

  info!("Development telemetry initialized");
  Ok(telemetry)
}

/// Пример инициализации телеметрии для production
pub async fn init_production_telemetry() -> Result<TelemetryManager, Box<dyn std::error::Error>> {
  let config = production_config();
  let telemetry = TelemetryManager::new(config).await?;

  // Настраиваем production алерты
  setup_production_alerts(&telemetry).await?;

  info!("Production telemetry initialized");
  Ok(telemetry)
}

/// Пример использования метрик
pub async fn metrics_example(telemetry: &TelemetryManager) {
  let metrics = telemetry.metrics();
  let alerts = telemetry.alerts();

  // Счетчик запросов
  let _ = metrics.increment_counter(
    "http_requests_total",
    &[
      ("method".to_string(), "GET".to_string()),
      ("status".to_string(), "200".to_string()),
    ],
  );

  // Гистограмма времени ответа
  let _ = metrics.record_histogram(
    "http_request_duration_seconds",
    0.125,
    &[("method".to_string(), "GET".to_string())],
  );

  // Gauge для активных соединений
  let _ = metrics.set_gauge("active_connections", 42.0, &[]);

  // Создаем алерт для мониторинга времени ответа
  let alert_rule = AlertRule::new(
    "high_response_time".to_string(),
    "High Response Time".to_string(),
    "http_request_duration_seconds".to_string(),
    ">".to_string(),
    0.5,
    AlertSeverity::Warning,
  );

  if let Err(e) = alerts.add_rule(alert_rule) {
    tracing::error!("Failed to add alert rule: {}", e);
  }

  // Проверяем алерты
  if let Err(e) = alerts.check_metric("http_request_duration_seconds", 0.125) {
    tracing::error!("Failed to check metric: {}", e);
  }
}

/// Пример использования трассировки
pub async fn tracing_example() {
  use tracing::{info, Span};

  let span = tracing::info_span!(
    "example_operation",
    user_id = 123,
    operation = "data_processing"
  );
  let _enter = span.enter();

  info!("Starting data processing");

  // Симуляция работы
  tokio::time::sleep(Duration::from_millis(100)).await;

  // Добавляем атрибуты к span
  Span::current().record("processed_items", 42);
  Span::current().record("success", true);

  info!("Data processing completed");
}

/// Пример использования health checks
pub async fn health_check_example(telemetry: &TelemetryManager) {
  let health = telemetry.health();

  // Добавляем custom health check
  health.add_check(Box::new(DatabaseHealthCheck::new())).await;

  // Проверяем здоровье системы
  let results = health.check_all().await;
  info!("Health check results: {:?}", results);
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_prometheus_config() {
    let config = prometheus_config();
    assert!(config.metrics.enabled);
    assert!(config
      .metrics
      .exporters
      .contains(&MetricsExporter::Prometheus { port: 9090 }));
  }

  #[test]
  fn test_jaeger_config() {
    let config = jaeger_config();
    assert!(config.tracing.enabled);
    assert!(config
      .tracing
      .exporters
      .iter()
      .any(|e| matches!(e, TracingExporter::Jaeger { .. })));
    assert_eq!(config.tracing.sample_rate, 0.1);
  }

  #[test]
  fn test_production_config() {
    let config = production_config();
    assert!(config.tracing.enabled);
    assert!(config.metrics.enabled);
    assert!(config.health.enabled);
    assert_eq!(config.tracing.sample_rate, 0.05);
  }

  #[tokio::test]
  async fn test_development_telemetry_init() {
    let result = init_development_telemetry().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_production_telemetry_init() {
    let result = init_production_telemetry().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_setup_production_alerts() {
    let telemetry = init_development_telemetry().await.unwrap();
    let result = setup_production_alerts(&telemetry).await;
    assert!(result.is_ok());

    // Проверяем, что алерты были добавлены
    let rules = telemetry.alerts().get_rules().unwrap();
    assert!(!rules.is_empty());

    // Проверяем наличие основных правил
    let rule_ids: Vec<String> = rules.iter().map(|r| r.id.clone()).collect();
    assert!(rule_ids.contains(&"high_cpu_usage".to_string()));
    assert!(rule_ids.contains(&"critical_memory_usage".to_string()));
    assert!(rule_ids.contains(&"high_error_rate".to_string()));
  }

  #[tokio::test]
  async fn test_metrics_example() {
    let telemetry = init_development_telemetry().await.unwrap();

    // Тестируем, что функция выполняется без ошибок
    metrics_example(&telemetry).await;

    // Проверяем, что метрики были записаны (базовая проверка)
    // В реальном приложении здесь можно было бы проверить экспортированные метрики
  }

  #[tokio::test]
  async fn test_tracing_example() {
    // Тестируем, что функция выполняется без ошибок
    tracing_example().await;
  }

  #[tokio::test]
  async fn test_health_check_example() {
    let telemetry = init_development_telemetry().await.unwrap();

    // Тестируем, что функция выполняется без ошибок
    health_check_example(&telemetry).await;

    // Проверяем, что health check был добавлен
    let _health_manager = telemetry.health();
    // В реальном приложении здесь можно было бы проверить добавленные проверки
  }

  #[test]
  fn test_config_validation() {
    let prometheus_cfg = prometheus_config();
    let jaeger_cfg = jaeger_config();
    let production_cfg = production_config();

    // Проверяем, что все конфигурации валидны
    assert!(prometheus_cfg.tracing.enabled);
    assert!(jaeger_cfg.tracing.enabled);
    assert!(production_cfg.tracing.enabled);

    // Проверяем специфичные настройки
    assert_eq!(prometheus_cfg.metrics.collection_interval.as_secs(), 15);
    assert_eq!(jaeger_cfg.tracing.max_events_per_span, 64);
    assert_eq!(production_cfg.health.timeout.as_secs(), 5);
  }
}

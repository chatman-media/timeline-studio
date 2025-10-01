//! Конфигурация телеметрии

use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Health check configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthConfig {
  pub enabled: bool,
  pub check_interval: Duration,
  pub cache_ttl: Duration,
  pub default_timeout: Duration,
  pub timeout: Duration,
  pub endpoint: String,
}

impl Default for HealthConfig {
  fn default() -> Self {
    Self {
      enabled: true,
      check_interval: Duration::from_secs(30),
      cache_ttl: Duration::from_secs(60),
      default_timeout: Duration::from_secs(5),
      timeout: Duration::from_secs(5),
      endpoint: "/health".to_string(),
    }
  }
}

/// Tracing exporters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TracingExporter {
  Console,
  Jaeger { endpoint: String },
  Otlp { endpoint: String },
}

/// Metrics exporters
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MetricsExporter {
  Console,
  Prometheus { port: u16 },
  Otlp { endpoint: String },
}

/// Конфигурация телеметрии
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
  /// Включена ли телеметрия
  pub enabled: bool,

  /// Название сервиса
  pub service_name: String,

  /// Версия сервиса
  pub service_version: String,

  /// Окружение (development, staging, production)
  pub environment: String,

  /// Конфигурация экспортера
  pub exporter: ExporterConfig,

  /// Конфигурация трассировки
  pub tracing: TracingConfig,

  /// Конфигурация метрик
  pub metrics: MetricsConfig,

  /// Конфигурация health check
  pub health: HealthConfig,

  /// Уровень логирования
  pub log_level: LogLevel,
}

impl Default for TelemetryConfig {
  fn default() -> Self {
    Self {
      enabled: true,
      service_name: "timeline-studio".to_string(),
      service_version: env!("CARGO_PKG_VERSION").to_string(),
      environment: "development".to_string(),
      exporter: ExporterConfig::default(),
      tracing: TracingConfig::default(),
      metrics: MetricsConfig::default(),
      health: HealthConfig::default(),
      log_level: LogLevel::Info,
    }
  }
}

/// Конфигурация экспортера
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExporterConfig {
  /// Тип экспортера
  pub exporter_type: ExporterType,

  /// Endpoint для OTLP
  pub otlp_endpoint: Option<String>,

  /// Заголовки для аутентификации
  pub headers: Vec<(String, String)>,

  /// Таймаут экспорта
  pub timeout: Duration,

  /// Размер батча
  pub batch_size: usize,

  /// Prometheus endpoint (например "0.0.0.0:9090")
  pub prometheus_endpoint: Option<String>,
}

impl Default for ExporterConfig {
  fn default() -> Self {
    Self {
      exporter_type: ExporterType::Console,
      otlp_endpoint: None,
      headers: vec![],
      timeout: Duration::from_secs(10),
      batch_size: 512,
      prometheus_endpoint: None,
    }
  }
}

/// Тип экспортера
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ExporterType {
  /// Вывод в консоль (для разработки)
  Console,
  /// OTLP (OpenTelemetry Protocol)
  Otlp,
  /// Jaeger
  Jaeger,
  /// Prometheus (только для метрик)
  Prometheus,
  /// Не экспортировать
  None,
}

/// Конфигурация трассировки
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracingConfig {
  /// Включена ли трассировка
  pub enabled: bool,

  /// Процент семплирования (0.0 - 1.0)
  pub sample_rate: f64,

  /// Максимальное количество атрибутов в span
  pub max_attributes_per_span: u32,

  /// Максимальное количество событий в span
  pub max_events_per_span: u32,

  /// Максимальное количество ссылок в span
  pub max_links_per_span: u32,

  /// Игнорируемые пути (не трассировать)
  pub ignored_paths: Vec<String>,

  /// Экспортеры трассировки
  pub exporters: Vec<TracingExporter>,
}

impl Default for TracingConfig {
  fn default() -> Self {
    Self {
      enabled: true,
      sample_rate: 1.0,
      max_attributes_per_span: 128,
      max_events_per_span: 128,
      max_links_per_span: 128,
      ignored_paths: vec![
        "/health".to_string(),
        "/metrics".to_string(),
        "/ready".to_string(),
      ],
      exporters: vec![TracingExporter::Console],
    }
  }
}

/// Конфигурация метрик
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsConfig {
  /// Включены ли метрики
  pub enabled: bool,

  /// Интервал сбора метрик
  pub collection_interval: Duration,

  /// Интервал экспорта метрик
  pub export_interval: Duration,

  /// Максимальный размер пакета для экспорта
  pub max_export_batch_size: usize,

  /// Таймаут экспорта
  pub export_timeout: Duration,

  /// Включить метрики runtime
  pub runtime_metrics: bool,

  /// Включить метрики системы
  pub system_metrics: bool,

  /// Включить метрики процесса
  pub process_metrics: bool,

  /// Экспортеры метрик
  pub exporters: Vec<MetricsExporter>,
}

impl Default for MetricsConfig {
  fn default() -> Self {
    Self {
      enabled: true,
      collection_interval: Duration::from_secs(10),
      export_interval: Duration::from_secs(60),
      max_export_batch_size: 512,
      export_timeout: Duration::from_secs(30),
      runtime_metrics: true,
      system_metrics: true,
      process_metrics: true,
      exporters: vec![MetricsExporter::Console],
    }
  }
}

/// Уровень логирования
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LogLevel {
  Trace,
  Debug,
  Info,
  Warn,
  Error,
}

impl From<LogLevel> for tracing::Level {
  fn from(level: LogLevel) -> Self {
    match level {
      LogLevel::Trace => tracing::Level::TRACE,
      LogLevel::Debug => tracing::Level::DEBUG,
      LogLevel::Info => tracing::Level::INFO,
      LogLevel::Warn => tracing::Level::WARN,
      LogLevel::Error => tracing::Level::ERROR,
    }
  }
}

/// Builder для TelemetryConfig
pub struct TelemetryConfigBuilder {
  config: TelemetryConfig,
}

impl Default for TelemetryConfigBuilder {
  fn default() -> Self {
    Self::new()
  }
}

impl TelemetryConfigBuilder {
  pub fn new() -> Self {
    Self {
      config: TelemetryConfig::default(),
    }
  }

  pub fn service_name(mut self, name: impl Into<String>) -> Self {
    self.config.service_name = name.into();
    self
  }

  pub fn environment(mut self, env: impl Into<String>) -> Self {
    self.config.environment = env.into();
    self
  }

  pub fn otlp_endpoint(mut self, endpoint: impl Into<String>) -> Self {
    self.config.exporter.exporter_type = ExporterType::Otlp;
    self.config.exporter.otlp_endpoint = Some(endpoint.into());
    self
  }

  pub fn sample_rate(mut self, rate: f64) -> Self {
    self.config.tracing.sample_rate = rate.clamp(0.0, 1.0);
    self
  }

  pub fn log_level(mut self, level: LogLevel) -> Self {
    self.config.log_level = level;
    self
  }

  pub fn build(self) -> TelemetryConfig {
    self.config
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_telemetry_config_default() {
    let config = TelemetryConfig::default();

    assert!(config.enabled);
    assert_eq!(config.service_name, "timeline-studio");
    assert_eq!(config.environment, "development");
    assert_eq!(config.log_level, LogLevel::Info);
  }

  #[test]
  fn test_exporter_config_default() {
    let config = ExporterConfig::default();

    assert_eq!(config.exporter_type, ExporterType::Console);
    assert!(config.otlp_endpoint.is_none());
    assert!(config.headers.is_empty());
    assert_eq!(config.timeout, Duration::from_secs(10));
    assert_eq!(config.batch_size, 512);
    assert!(config.prometheus_endpoint.is_none());
  }

  #[test]
  fn test_tracing_config_default() {
    let config = TracingConfig::default();

    assert_eq!(config.sample_rate, 1.0);
    assert_eq!(config.max_attributes_per_span, 128);
    assert_eq!(config.max_events_per_span, 128);
    assert_eq!(config.max_links_per_span, 128);
    assert_eq!(config.ignored_paths.len(), 3);
    assert!(config.ignored_paths.contains(&"/health".to_string()));
  }

  #[test]
  fn test_metrics_config_default() {
    let config = MetricsConfig::default();

    assert_eq!(config.collection_interval, Duration::from_secs(10));
    assert_eq!(config.export_interval, Duration::from_secs(60));
    assert!(config.runtime_metrics);
    assert!(config.system_metrics);
    assert!(config.process_metrics);
  }

  #[test]
  fn test_log_level_conversion() {
    assert_eq!(tracing::Level::from(LogLevel::Trace), tracing::Level::TRACE);
    assert_eq!(tracing::Level::from(LogLevel::Debug), tracing::Level::DEBUG);
    assert_eq!(tracing::Level::from(LogLevel::Info), tracing::Level::INFO);
    assert_eq!(tracing::Level::from(LogLevel::Warn), tracing::Level::WARN);
    assert_eq!(tracing::Level::from(LogLevel::Error), tracing::Level::ERROR);
  }

  #[test]
  fn test_telemetry_config_builder() {
    let config = TelemetryConfigBuilder::new()
      .service_name("test-service")
      .environment("production")
      .log_level(LogLevel::Debug)
      .sample_rate(0.5)
      .build();

    assert_eq!(config.service_name, "test-service");
    assert_eq!(config.environment, "production");
    assert_eq!(config.log_level, LogLevel::Debug);
    assert_eq!(config.tracing.sample_rate, 0.5);
  }

  #[test]
  fn test_telemetry_config_builder_otlp() {
    let config = TelemetryConfigBuilder::new()
      .otlp_endpoint("http://localhost:4317")
      .build();

    assert_eq!(config.exporter.exporter_type, ExporterType::Otlp);
    assert_eq!(
      config.exporter.otlp_endpoint,
      Some("http://localhost:4317".to_string())
    );
  }

  #[test]
  fn test_sample_rate_clamping() {
    // Тестируем что sample_rate ограничен диапазоном 0.0 - 1.0
    let config1 = TelemetryConfigBuilder::new().sample_rate(2.0).build();
    assert_eq!(config1.tracing.sample_rate, 1.0);

    let config2 = TelemetryConfigBuilder::new().sample_rate(-0.5).build();
    assert_eq!(config2.tracing.sample_rate, 0.0);

    let config3 = TelemetryConfigBuilder::new().sample_rate(0.75).build();
    assert_eq!(config3.tracing.sample_rate, 0.75);
  }

  #[test]
  fn test_exporter_type_equality() {
    assert_eq!(ExporterType::Console, ExporterType::Console);
    assert_ne!(ExporterType::Console, ExporterType::Otlp);
    assert_ne!(ExporterType::Prometheus, ExporterType::Jaeger);
  }

  #[test]
  fn test_config_serialization() {
    let config = TelemetryConfig::default();

    // Проверяем что можем сериализовать и десериализовать
    let json = serde_json::to_string(&config).unwrap();
    let deserialized: TelemetryConfig = serde_json::from_str(&json).unwrap();

    assert_eq!(config.service_name, deserialized.service_name);
    assert_eq!(config.enabled, deserialized.enabled);
    assert_eq!(config.environment, deserialized.environment);
  }
}

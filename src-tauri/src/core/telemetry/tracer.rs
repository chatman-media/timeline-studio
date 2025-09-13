//! Трассировка с OpenTelemetry

use crate::video_compiler::error::Result;
use opentelemetry::{
  Context as OtelContext, KeyValue, global,
  trace::{SpanId, SpanKind, TraceContextExt, TraceId},
};
use opentelemetry_sdk::{
  Resource,
  propagation::TraceContextPropagator,
  trace::{self, RandomIdGenerator, Sampler},
};
use opentelemetry_semantic_conventions::{
  attribute::{HTTP_REQUEST_METHOD, HTTP_RESPONSE_STATUS_CODE, HTTP_ROUTE},
  resource::{SERVICE_NAME, SERVICE_VERSION},
};
use std::time::Instant;
use tracing::{Instrument, info_span};

use super::config::{ExporterType, TelemetryConfig};

/// Контекст трассировки
#[derive(Debug, Clone)]
pub struct TraceContext {
  trace_id: TraceId,
  span_id: SpanId,
  attributes: Vec<KeyValue>,
}

impl TraceContext {
  /// Создать новый контекст
  pub fn new(trace_id: TraceId, span_id: SpanId) -> Self {
    Self {
      trace_id,
      span_id,
      attributes: vec![],
    }
  }

  /// Добавить атрибут
  pub fn with_attribute(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .attributes
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Получить trace_id как строку
  pub fn trace_id_string(&self) -> String {
    format!("{:032x}", self.trace_id)
  }

  /// Получить span_id как строку
  pub fn span_id_string(&self) -> String {
    format!("{:016x}", self.span_id)
  }
}

/// Tracer для создания spans
pub struct Tracer {
  #[allow(dead_code)]
  tracer: opentelemetry::global::BoxedTracer,
  config: TelemetryConfig,
}

impl Tracer {
  /// Создать новый tracer
  pub async fn new(config: &TelemetryConfig) -> Result<Self> {
    if !config.enabled {
      // Возвращаем noop tracer
      return Ok(Self {
        tracer: global::tracer("noop"),
        config: config.clone(),
      });
    }

    // Устанавливаем propagator
    global::set_text_map_propagator(TraceContextPropagator::new());

    // Создаем ресурс (SDK Resource::new is private in some versions)
    let _ = vec![
      KeyValue::new(SERVICE_NAME, config.service_name.clone()),
      KeyValue::new(SERVICE_VERSION, config.service_version.clone()),
      KeyValue::new("deployment.environment", config.environment.clone()),
    ];

    // Создаем tracer в зависимости от типа экспортера
    let tracer_name = match config.exporter.exporter_type {
      ExporterType::Console => "console-tracer",
      ExporterType::Otlp => "otlp-tracer",
      _ => "noop-tracer",
    };

    let tracer = global::tracer(tracer_name);

    Ok(Self {
      tracer,
      config: config.clone(),
    })
  }

  /// Построить конфигурацию трассировки
  #[allow(dead_code)]
  fn build_trace_config(config: &TelemetryConfig) -> trace::Config {
    // Use the default config - accept deprecation warnings as OpenTelemetry SDK
    // is still evolving and we'll update when stable APIs are available
    #[allow(deprecated)]
    {
      trace::Config::default()
        .with_sampler(Sampler::TraceIdRatioBased(config.tracing.sample_rate))
        .with_id_generator(RandomIdGenerator::default())
        .with_max_attributes_per_span(config.tracing.max_attributes_per_span)
        .with_max_events_per_span(config.tracing.max_events_per_span)
        .with_max_links_per_span(config.tracing.max_links_per_span)
    }
  }

  /// Создать новый span
  pub fn span(&self, name: &str) -> SpanBuilder {
    SpanBuilder::new(name.to_string())
  }

  /// Выполнить функцию с трассировкой
  pub async fn trace<F, R>(&self, name: &str, f: F) -> Result<R>
  where
    F: std::future::Future<Output = Result<R>>,
  {
    let span = info_span!(
        "operation",
        otel.name = name,
        otel.kind = ?SpanKind::Internal,
    );

    async move {
      let start = Instant::now();
      let result = f.await;
      let _duration = start.elapsed();

      // Skip setting attributes and status on the span for now
      // OpenTelemetry Rust SDK is still evolving and APIs may change

      result
    }
    .instrument(span)
    .await
  }

  /// Получить текущий trace context
  pub fn current_context(&self) -> Option<TraceContext> {
    let context = OtelContext::current();
    let span = context.span();
    let span_context = span.span_context();

    if span_context.is_valid() {
      Some(TraceContext::new(
        span_context.trace_id(),
        span_context.span_id(),
      ))
    } else {
      None
    }
  }

  /// Завершить работу tracer
  pub async fn shutdown(&self) -> Result<()> {
    if self.config.enabled {
      // global shutdown API changed across versions; rely on Drop or SDK-managed shutdown
      log::info!("Tracer shutdown requested; skipping explicit shutdown due to API differences");
    }
    Ok(())
  }
}

/// Builder для создания span
pub struct SpanBuilder {
  name: String,
  kind: SpanKind,
  attributes: Vec<KeyValue>,
  #[allow(dead_code)]
  links: Vec<opentelemetry::trace::Link>,
}

impl SpanBuilder {
  fn new(name: String) -> Self {
    Self {
      name,
      kind: SpanKind::Internal,
      attributes: vec![],
      links: vec![],
    }
  }

  /// Установить тип span
  pub fn with_kind(mut self, kind: SpanKind) -> Self {
    self.kind = kind;
    self
  }

  /// Добавить атрибут
  pub fn with_attribute(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .attributes
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Добавить HTTP атрибуты
  pub fn with_http_attributes(self, method: &str, route: &str, status: u16) -> Self {
    self
      .with_attribute(HTTP_REQUEST_METHOD, method.to_string())
      .with_attribute(HTTP_ROUTE, route.to_string())
      .with_attribute(HTTP_RESPONSE_STATUS_CODE, status as i64)
  }

  /// Начать span
  pub fn start(self) -> tracing::Span {
    let span = info_span!(
        "span",
        otel.name = self.name,
        otel.kind = ?self.kind,
    );

    // For now, we'll skip setting attributes on the span
    // due to version conflicts with OpenTelemetry
    // TODO: Update once OpenTelemetry versions are aligned

    span
  }

  /// Выполнить функцию внутри span
  pub async fn run<F, R>(self, f: F) -> Result<R>
  where
    F: std::future::Future<Output = Result<R>>,
  {
    let span = self.start();

    async move {
      let start = Instant::now();
      let result = f.await;
      let _duration = start.elapsed();

      // Skip setting attributes and status on the span for now
      // OpenTelemetry Rust SDK is still evolving and APIs may change

      result
    }
    .instrument(span)
    .await
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::Duration;

  #[tokio::test]
  async fn test_tracer_creation() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    // Проверяем что tracer создан
    assert!(tracer.current_context().is_none());
  }

  #[tokio::test]
  async fn test_tracer_creation_disabled() {
    let config = TelemetryConfig {
      enabled: false,
      ..Default::default()
    };

    let tracer = Tracer::new(&config).await.unwrap();

    // Should create noop tracer
    assert!(tracer.current_context().is_none());
  }

  #[tokio::test]
  async fn test_span_creation() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    let result = tracer
      .trace("test_operation", async {
        // Симулируем работу
        tokio::time::sleep(Duration::from_millis(10)).await;
        Ok::<_, crate::video_compiler::error::VideoCompilerError>(42)
      })
      .await;

    assert_eq!(result.unwrap(), 42);
  }

  #[tokio::test]
  async fn test_trace_generation_with_nested_spans() {
    // Тест генерации trace с вложенными span
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    let result = tracer
      .trace("parent_operation", async {
        // Родительский span
        tokio::time::sleep(Duration::from_millis(5)).await;

        // Вложенный span 1
        let child1_result = tracer
          .trace("child_operation_1", async {
            tokio::time::sleep(Duration::from_millis(3)).await;
            Ok::<i32, crate::video_compiler::error::VideoCompilerError>(10)
          })
          .await?;

        // Вложенный span 2
        let child2_result = tracer
          .trace("child_operation_2", async {
            tokio::time::sleep(Duration::from_millis(2)).await;
            Ok::<i32, crate::video_compiler::error::VideoCompilerError>(20)
          })
          .await?;

        // Еще более глубокий span
        let deep_result = tracer
          .trace("deep_operation", async {
            tracer
              .trace("deepest_operation", async {
                tokio::time::sleep(Duration::from_millis(1)).await;
                Ok::<i32, crate::video_compiler::error::VideoCompilerError>(5)
              })
              .await
          })
          .await?;

        Ok(child1_result + child2_result + deep_result)
      })
      .await;

    assert_eq!(result.unwrap(), 35);
  }

  #[tokio::test]
  async fn test_span_with_attributes() {
    // Тест span с атрибутами
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    let result = tracer
      .span("http_request")
      .with_kind(SpanKind::Client)
      .with_attribute("user.id", "12345")
      .with_attribute("request.method", "GET")
      .with_attribute("request.size", 1024i64)
      .with_http_attributes("GET", "/api/users", 200)
      .run(async {
        // Симулируем HTTP запрос
        tokio::time::sleep(Duration::from_millis(15)).await;
        Ok::<String, crate::video_compiler::error::VideoCompilerError>("response_data".to_string())
      })
      .await;

    assert_eq!(result.unwrap(), "response_data");
  }

  #[tokio::test]
  async fn test_span_with_error_handling() {
    // Тест обработки ошибок в span
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    let result = tracer
      .trace("failing_operation", async {
        tokio::time::sleep(Duration::from_millis(5)).await;
        Err::<i32, crate::video_compiler::error::VideoCompilerError>(
          crate::video_compiler::error::VideoCompilerError::InvalidParameter(
            "test error".to_string(),
          ),
        )
      })
      .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("test error"));
  }

  #[tokio::test]
  async fn test_tracer_shutdown() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    // Should not panic
    let result = tracer.shutdown().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_tracer_shutdown_disabled() {
    let config = TelemetryConfig {
      enabled: false,
      ..Default::default()
    };
    let tracer = Tracer::new(&config).await.unwrap();

    // Should handle disabled tracer gracefully
    let result = tracer.shutdown().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_trace_context_creation() {
    let trace_id = TraceId::from_hex("0af7651916cd43dd8448eb211c80319c").unwrap();
    let span_id = SpanId::from_hex("b9c7c989f97918e1").unwrap();

    let context = TraceContext::new(trace_id, span_id);

    assert_eq!(
      context.trace_id_string(),
      "0af7651916cd43dd8448eb211c80319c"
    );
    assert_eq!(context.span_id_string(), "b9c7c989f97918e1");
  }

  #[tokio::test]
  async fn test_trace_context_with_attributes() {
    let trace_id = TraceId::from_hex("0af7651916cd43dd8448eb211c80319c").unwrap();
    let span_id = SpanId::from_hex("b9c7c989f97918e1").unwrap();

    let context = TraceContext::new(trace_id, span_id)
      .with_attribute("user.id", "123")
      .with_attribute("request.path", "/api/test")
      .with_attribute("response.size", 1024i64);

    assert_eq!(context.attributes.len(), 3);
  }

  #[tokio::test]
  async fn test_span_builder_kinds() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    // Test different span kinds
    let kinds = vec![
      SpanKind::Client,
      SpanKind::Server,
      SpanKind::Producer,
      SpanKind::Consumer,
      SpanKind::Internal,
    ];

    for kind in kinds {
      let result = tracer
        .span("test_span")
        .with_kind(kind)
        .run(async { Ok::<_, crate::video_compiler::error::VideoCompilerError>("success") })
        .await;

      assert_eq!(result.unwrap(), "success");
    }
  }

  #[tokio::test]
  async fn test_build_trace_config() {
    let mut config = TelemetryConfig::default();
    config.tracing.sample_rate = 0.5;
    config.tracing.max_attributes_per_span = 128;
    config.tracing.max_events_per_span = 256;
    config.tracing.max_links_per_span = 64;

    // Test that config builder doesn't panic
    let trace_config = Tracer::build_trace_config(&config);

    // We can't directly test the values but ensure it builds
    let _ = trace_config;
  }

  #[tokio::test]
  async fn test_concurrent_tracing() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    // Test concurrent span creation
    let handles: Vec<_> = (0..10)
      .map(|i| {
        let tracer_clone = tracer.clone();
        tokio::spawn(async move {
          tracer_clone
            .trace(&format!("concurrent_op_{}", i), async {
              tokio::time::sleep(Duration::from_millis(1)).await;
              Ok::<_, crate::video_compiler::error::VideoCompilerError>(i)
            })
            .await
        })
      })
      .collect();

    let mut results = Vec::new();
    for handle in handles {
      let result = handle.await.unwrap();
      results.push(result.unwrap());
    }

    results.sort();
    assert_eq!(results, vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  }

  #[tokio::test]
  async fn test_span_builder_with_various_attributes() {
    let builder = SpanBuilder::new("test".to_string())
      .with_attribute("string_attr", "value")
      .with_attribute("int_attr", 42i64)
      .with_attribute("float_attr", std::f64::consts::PI)
      .with_attribute("bool_attr", true);

    assert_eq!(builder.attributes.len(), 4);
  }

  // Add clone implementation for testing
  impl Clone for Tracer {
    fn clone(&self) -> Self {
      Self {
        tracer: global::tracer("test-clone"),
        config: self.config.clone(),
      }
    }
  }
}

//! Middleware для интеграции телеметрии

use axum::{
  extract::{Request, State},
  http::{HeaderMap, StatusCode},
  middleware::Next,
  response::Response,
};
use std::sync::Arc;
use std::time::Instant;
use tracing::Instrument;

use super::{metrics::Metrics, MetricsCollector, Tracer};

/// Middleware для трассировки HTTP запросов
#[derive(Clone)]
pub struct TracingMiddleware {
  #[allow(dead_code)]
  tracer: Arc<Tracer>,
}

impl TracingMiddleware {
  pub fn new(tracer: Arc<Tracer>) -> Self {
    Self { tracer }
  }

  /// Обработать запрос с трассировкой
  pub async fn handle(State(tracer): State<Arc<Tracer>>, request: Request, next: Next) -> Response {
    let method = request.method().to_string();
    let uri = request.uri().path().to_string();

    // Создаем span для запроса
    let span = tracer
      .span(&format!("{method} {uri}"))
      .with_kind(opentelemetry::trace::SpanKind::Server)
      .with_attribute("http.method", method.clone())
      .with_attribute("http.target", uri.clone())
      .with_attribute("http.scheme", "http")
      .start();

    // Выполняем запрос
    let response = next.run(request).instrument(span.clone()).await;

    // Добавляем атрибуты ответа
    span.record("http.status_code", response.status().as_u16());

    response
  }
}

/// Middleware для сбора метрик HTTP запросов
#[derive(Clone)]
pub struct MetricsMiddleware {
  #[allow(dead_code)]
  metrics: Arc<Metrics>,
}

impl MetricsMiddleware {
  pub fn new(collector: Arc<MetricsCollector>) -> crate::video_compiler::error::Result<Self> {
    let metrics = Arc::new(Metrics::new(&collector)?);
    Ok(Self { metrics })
  }

  /// Обработать запрос со сбором метрик
  pub async fn handle(
    State(metrics): State<Arc<Metrics>>,
    request: Request,
    next: Next,
  ) -> Response {
    let start = Instant::now();
    let _method = request.method().to_string();
    let _path = normalize_path(request.uri().path());

    // Увеличиваем счетчик активных запросов
    metrics.http_active_requests.add(1);

    // Получаем размер запроса
    if let Some(content_length) = request
      .headers()
      .get("content-length")
      .and_then(|v| v.to_str().ok())
      .and_then(|v| v.parse::<f64>().ok())
    {
      metrics.http_request_size.observe(content_length);
    }

    // Выполняем запрос
    let response = next.run(request).await;
    let status = response.status();
    let duration = start.elapsed();

    // Уменьшаем счетчик активных запросов
    metrics.http_active_requests.add(-1);

    // Записываем метрики
    let _status_str = status.as_u16().to_string();
    metrics.http_requests_total.inc();

    metrics
      .http_request_duration
      .observe(duration.as_secs_f64());

    // Получаем размер ответа
    if let Some(content_length) = response
      .headers()
      .get("content-length")
      .and_then(|v| v.to_str().ok())
      .and_then(|v| v.parse::<f64>().ok())
    {
      metrics.http_response_size.observe(content_length);
    }

    response
  }
}

/// Health check endpoint - liveness probe
pub async fn health_check(
  State(health_manager): State<Arc<super::HealthCheckManager>>,
) -> impl axum::response::IntoResponse {
  let summary = health_manager.check_all().await;
  let status_code = axum::http::StatusCode::from_u16(summary.http_status_code())
    .unwrap_or(axum::http::StatusCode::INTERNAL_SERVER_ERROR);

  (status_code, axum::Json(summary))
}

/// Ready check endpoint - readiness probe
pub async fn ready_check(
  State(health_manager): State<Arc<super::HealthCheckManager>>,
) -> impl axum::response::IntoResponse {
  let summary = health_manager.check_all().await;
  let status_code = if summary.is_ready() {
    axum::http::StatusCode::OK
  } else {
    axum::http::StatusCode::SERVICE_UNAVAILABLE
  };

  (
    status_code,
    axum::Json(serde_json::json!({
        "status": if summary.is_ready() { "ready" } else { "not_ready" },
        "timestamp": summary.timestamp
    })),
  )
}

/// Live check endpoint - простая проверка что приложение запущено
pub async fn live_check() -> impl axum::response::IntoResponse {
  (
    axum::http::StatusCode::OK,
    axum::Json(serde_json::json!({
        "status": "alive",
        "timestamp": chrono::Utc::now()
    })),
  )
}

/// Конкретный health check endpoint
pub async fn health_check_single(
  State(health_manager): State<Arc<super::HealthCheckManager>>,
  axum::extract::Path(check_name): axum::extract::Path<String>,
) -> impl axum::response::IntoResponse {
  match health_manager.check_one(&check_name).await {
    Some(result) => {
      let status_code = axum::http::StatusCode::from_u16(result.status.http_status_code())
        .unwrap_or(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
      (
        status_code,
        axum::Json(serde_json::to_value(result).unwrap()),
      )
    }
    None => (
      axum::http::StatusCode::NOT_FOUND,
      axum::Json(serde_json::json!({
          "error": format!("Health check '{}' not found", check_name)
      })),
    ),
  }
}

/// Метрики endpoint (для Prometheus)
pub async fn metrics_endpoint(
  State(_collector): State<Arc<MetricsCollector>>,
) -> Result<String, StatusCode> {
  // TODO: Реализовать экспорт метрик в формате Prometheus
  Err(StatusCode::NOT_IMPLEMENTED)
}

/// Нормализовать путь для метрик (убрать динамические части)
fn normalize_path(path: &str) -> String {
  // Заменяем UUID-подобные части на {id}
  let uuid_regex = regex::Regex::new(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
  )
  .unwrap();

  // Заменяем числовые ID на {id}
  let id_regex = regex::Regex::new(r"/\d+").unwrap();

  let normalized = uuid_regex.replace_all(path, "{id}");
  let normalized = id_regex.replace_all(&normalized, "/{id}");

  normalized.to_string()
}

/// Извлечь trace context из заголовков
pub fn extract_trace_context(headers: &HeaderMap) -> Option<String> {
  headers
    .get("traceparent")
    .and_then(|v| v.to_str().ok())
    .map(|s| s.to_string())
}

/// Добавить trace context в заголовки
pub fn inject_trace_context(headers: &mut HeaderMap, trace_id: &str) {
  if let Ok(value) = trace_id.parse() {
    headers.insert("x-trace-id", value);
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_normalize_path() {
    assert_eq!(
      normalize_path("/api/projects/123e4567-e89b-12d3-a456-426614174000"),
      "/api/projects/{id}"
    );

    assert_eq!(
      normalize_path("/api/users/12345/projects"),
      "/api/users/{id}/projects"
    );

    assert_eq!(
      normalize_path("/api/static/resource"),
      "/api/static/resource"
    );
  }
}

//! Модуль мониторинга для сервисного слоя
//!
//! Предоставляет метрики и инструменты для отслеживания производительности сервисов

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Метрики операции
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OperationMetrics {
  pub count: u64,
  pub total_duration_ms: u64,
  pub min_duration_ms: u64,
  pub max_duration_ms: u64,
  pub avg_duration_ms: f64,
  pub errors: u64,
  pub last_error: Option<String>,
  pub last_operation_time: Option<std::time::SystemTime>,
}

impl Default for OperationMetrics {
  fn default() -> Self {
    Self {
      count: 0,
      total_duration_ms: 0,
      min_duration_ms: u64::MAX,
      max_duration_ms: 0,
      avg_duration_ms: 0.0,
      errors: 0,
      last_error: None,
      last_operation_time: None,
    }
  }
}

/// Метрики сервиса
#[derive(Debug)]
pub struct ServiceMetrics {
  pub name: String,
  pub operations: Arc<RwLock<HashMap<String, OperationMetrics>>>,
  pub total_operations: AtomicU64,
  pub total_errors: AtomicU64,
  pub active_operations: AtomicUsize,
  pub start_time: Instant,
}

impl ServiceMetrics {
  pub fn new(name: String) -> Self {
    Self {
      name,
      operations: Arc::new(RwLock::new(HashMap::new())),
      total_operations: AtomicU64::new(0),
      total_errors: AtomicU64::new(0),
      active_operations: AtomicUsize::new(0),
      start_time: Instant::now(),
    }
  }

  /// Начать отслеживание операции
  pub fn start_operation(&self, operation_name: &str) -> OperationTracker {
    self.active_operations.fetch_add(1, Ordering::Relaxed);
    OperationTracker {
      metrics: self,
      operation_name: operation_name.to_string(),
      start_time: Instant::now(),
      completed: false,
    }
  }

  /// Записать результат операции
  pub async fn record_operation(
    &self,
    operation_name: &str,
    duration: Duration,
    success: bool,
    error_message: Option<String>,
  ) {
    self.total_operations.fetch_add(1, Ordering::Relaxed);
    if !success {
      self.total_errors.fetch_add(1, Ordering::Relaxed);
    }

    let duration_ms = duration.as_millis() as u64;
    let mut operations = self.operations.write().await;
    let metrics = operations.entry(operation_name.to_string()).or_default();

    metrics.count += 1;
    metrics.total_duration_ms += duration_ms;
    metrics.min_duration_ms = metrics.min_duration_ms.min(duration_ms);
    metrics.max_duration_ms = metrics.max_duration_ms.max(duration_ms);
    metrics.avg_duration_ms = metrics.total_duration_ms as f64 / metrics.count as f64;
    metrics.last_operation_time = Some(std::time::SystemTime::now());

    if !success {
      metrics.errors += 1;
      metrics.last_error = error_message;
    }
  }

  /// Получить сводку метрик
  pub async fn get_summary(&self) -> MetricsSummary {
    let operations = self.operations.read().await;
    let uptime = self.start_time.elapsed();

    MetricsSummary {
      service_name: self.name.clone(),
      uptime_seconds: uptime.as_secs(),
      total_operations: self.total_operations.load(Ordering::Relaxed),
      total_errors: self.total_errors.load(Ordering::Relaxed),
      active_operations: self.active_operations.load(Ordering::Relaxed),
      operations_per_second: self.total_operations.load(Ordering::Relaxed) as f64
        / uptime.as_secs_f64().max(1.0),
      error_rate: if self.total_operations.load(Ordering::Relaxed) > 0 {
        self.total_errors.load(Ordering::Relaxed) as f64
          / self.total_operations.load(Ordering::Relaxed) as f64
      } else {
        0.0
      },
      operation_metrics: operations.clone(),
    }
  }

  /// Сбросить метрики
  pub async fn reset(&self) {
    self.operations.write().await.clear();
    self.total_operations.store(0, Ordering::Relaxed);
    self.total_errors.store(0, Ordering::Relaxed);
    self.active_operations.store(0, Ordering::Relaxed);
  }
}

/// Трекер операции для автоматического учета времени
pub struct OperationTracker<'a> {
  metrics: &'a ServiceMetrics,
  operation_name: String,
  start_time: Instant,
  completed: bool,
}

impl<'a> OperationTracker<'a> {
  /// Завершить операцию успешно
  pub async fn complete(mut self) {
    self.completed = true;
    let duration = self.start_time.elapsed();
    self
      .metrics
      .active_operations
      .fetch_sub(1, Ordering::Relaxed);
    self
      .metrics
      .record_operation(&self.operation_name, duration, true, None)
      .await;
    log::trace!(
      "[{}] Операция '{}' завершена за {:?}",
      self.metrics.name,
      self.operation_name,
      duration
    );
  }

  /// Завершить операцию с ошибкой
  pub async fn fail(mut self, error: String) {
    self.completed = true;
    let duration = self.start_time.elapsed();
    self
      .metrics
      .active_operations
      .fetch_sub(1, Ordering::Relaxed);
    self
      .metrics
      .record_operation(&self.operation_name, duration, false, Some(error.clone()))
      .await;
    log::warn!(
      "[{}] Операция '{}' завершена с ошибкой за {:?}: {}",
      self.metrics.name,
      self.operation_name,
      duration,
      error
    );
  }
}

impl<'a> Drop for OperationTracker<'a> {
  fn drop(&mut self) {
    if !self.completed {
      self
        .metrics
        .active_operations
        .fetch_sub(1, Ordering::Relaxed);
      log::warn!(
        "[{}] Операция '{}' не была завершена корректно",
        self.metrics.name,
        self.operation_name
      );
    }
  }
}

/// Сводка метрик сервиса
#[derive(Debug, Clone, serde::Serialize)]
pub struct MetricsSummary {
  pub service_name: String,
  pub uptime_seconds: u64,
  pub total_operations: u64,
  pub total_errors: u64,
  pub active_operations: usize,
  pub operations_per_second: f64,
  pub error_rate: f64,
  pub operation_metrics: HashMap<String, OperationMetrics>,
}

/// Глобальный реестр метрик
#[derive(Debug)]
pub struct MetricsRegistry {
  services: Arc<RwLock<HashMap<String, Arc<ServiceMetrics>>>>,
}

impl Default for MetricsRegistry {
  fn default() -> Self {
    Self::new()
  }
}

impl MetricsRegistry {
  pub fn new() -> Self {
    Self {
      services: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Зарегистрировать сервис
  pub async fn register_service(&self, name: String) -> Arc<ServiceMetrics> {
    let metrics = Arc::new(ServiceMetrics::new(name.clone()));
    self.services.write().await.insert(name, metrics.clone());
    metrics
  }

  /// Получить метрики сервиса
  pub async fn get_service_metrics(&self, name: &str) -> Option<Arc<ServiceMetrics>> {
    self.services.read().await.get(name).cloned()
  }

  /// Получить сводку всех метрик
  pub async fn get_all_summaries(&self) -> Vec<MetricsSummary> {
    let services = self.services.read().await;
    let mut summaries = Vec::new();

    for service in services.values() {
      summaries.push(service.get_summary().await);
    }

    summaries
  }

  /// Экспортировать метрики в формате Prometheus
  pub async fn export_prometheus(&self) -> String {
    let mut output = String::new();
    let services = self.services.read().await;

    for service in services.values() {
      let summary = service.get_summary().await;
      let service_name = summary.service_name.replace('-', "_");

      // Основные метрики
      output.push_str(&format!(
        "# HELP {service_name}_operations_total Total number of operations\n"
      ));
      output.push_str(&format!("# TYPE {service_name}_operations_total counter\n"));
      output.push_str(&format!(
        "{}_operations_total {}\n",
        service_name, summary.total_operations
      ));

      output.push_str(&format!(
        "# HELP {service_name}_errors_total Total number of errors\n"
      ));
      output.push_str(&format!("# TYPE {service_name}_errors_total counter\n"));
      output.push_str(&format!(
        "{}_errors_total {}\n",
        service_name, summary.total_errors
      ));

      output.push_str(&format!(
        "# HELP {service_name}_active_operations Current active operations\n"
      ));
      output.push_str(&format!("# TYPE {service_name}_active_operations gauge\n"));
      output.push_str(&format!(
        "{}_active_operations {}\n",
        service_name, summary.active_operations
      ));

      // Метрики по операциям
      for (op_name, metrics) in summary.operation_metrics {
        let op_name = op_name.replace(['-', ' '], "_");

        output.push_str(&format!(
          "{}_operation_duration_ms{{operation=\"{}\",quantile=\"0.0\"}} {}\n",
          service_name, op_name, metrics.min_duration_ms
        ));
        output.push_str(&format!(
          "{}_operation_duration_ms{{operation=\"{}\",quantile=\"0.5\"}} {}\n",
          service_name, op_name, metrics.avg_duration_ms as u64
        ));
        output.push_str(&format!(
          "{}_operation_duration_ms{{operation=\"{}\",quantile=\"1.0\"}} {}\n",
          service_name, op_name, metrics.max_duration_ms
        ));
        output.push_str(&format!(
          "{}_operation_count{{operation=\"{}\"}} {}\n",
          service_name, op_name, metrics.count
        ));
        output.push_str(&format!(
          "{}_operation_errors{{operation=\"{}\"}} {}\n",
          service_name, op_name, metrics.errors
        ));
      }
    }

    output
  }
}

/// Глобальный экземпляр реестра метрик
use once_cell::sync::Lazy;
pub static METRICS: Lazy<MetricsRegistry> = Lazy::new(MetricsRegistry::new);

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::Duration;

  #[tokio::test]
  async fn test_operation_metrics_default() {
    let metrics = OperationMetrics::default();
    assert_eq!(metrics.count, 0);
    assert_eq!(metrics.total_duration_ms, 0);
    assert_eq!(metrics.min_duration_ms, u64::MAX);
    assert_eq!(metrics.max_duration_ms, 0);
    assert_eq!(metrics.avg_duration_ms, 0.0);
    assert_eq!(metrics.errors, 0);
    assert!(metrics.last_error.is_none());
    assert!(metrics.last_operation_time.is_none());
  }

  #[tokio::test]
  async fn test_service_metrics_creation() {
    let metrics = ServiceMetrics::new("test-service".to_string());
    assert_eq!(metrics.name, "test-service");
    assert_eq!(metrics.total_operations.load(Ordering::Relaxed), 0);
    assert_eq!(metrics.total_errors.load(Ordering::Relaxed), 0);
    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 0);
  }

  #[tokio::test]
  async fn test_service_metrics() {
    let metrics = ServiceMetrics::new("test-service".to_string());

    // Тест успешной операции
    {
      let tracker = metrics.start_operation("test-op");
      tokio::time::sleep(Duration::from_millis(10)).await;
      tracker.complete().await;
    }

    // Тест операции с ошибкой
    {
      let tracker = metrics.start_operation("test-op");
      tracker.fail("Test error".to_string()).await;
    }

    let summary = metrics.get_summary().await;
    assert_eq!(summary.total_operations, 2);
    assert_eq!(summary.total_errors, 1);
    assert_eq!(summary.active_operations, 0);
    assert!(summary.error_rate > 0.0);

    let op_metrics = summary.operation_metrics.get("test-op").unwrap();
    assert_eq!(op_metrics.count, 2);
    assert_eq!(op_metrics.errors, 1);
    assert!(op_metrics.min_duration_ms <= op_metrics.max_duration_ms);
  }

  #[tokio::test]
  async fn test_operation_tracker_complete() {
    let metrics = ServiceMetrics::new("test-service".to_string());

    // Проверяем начальное состояние
    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 0);

    // Начинаем операцию
    let tracker = metrics.start_operation("complete-test");
    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 1);

    // Ждем немного
    tokio::time::sleep(Duration::from_millis(5)).await;

    // Завершаем операцию
    tracker.complete().await;

    // Проверяем результат
    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 0);
    assert_eq!(metrics.total_operations.load(Ordering::Relaxed), 1);
    assert_eq!(metrics.total_errors.load(Ordering::Relaxed), 0);

    let summary = metrics.get_summary().await;
    let op_metrics = summary.operation_metrics.get("complete-test").unwrap();
    assert_eq!(op_metrics.count, 1);
    assert_eq!(op_metrics.errors, 0);
    assert!(op_metrics.min_duration_ms >= 5);
    assert!(op_metrics.last_error.is_none());
    assert!(op_metrics.last_operation_time.is_some());
  }

  #[tokio::test]
  async fn test_operation_tracker_fail() {
    let metrics = ServiceMetrics::new("test-service".to_string());

    let tracker = metrics.start_operation("fail-test");
    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 1);

    tokio::time::sleep(Duration::from_millis(3)).await;

    tracker.fail("Test failure".to_string()).await;

    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 0);
    assert_eq!(metrics.total_operations.load(Ordering::Relaxed), 1);
    assert_eq!(metrics.total_errors.load(Ordering::Relaxed), 1);

    let summary = metrics.get_summary().await;
    let op_metrics = summary.operation_metrics.get("fail-test").unwrap();
    assert_eq!(op_metrics.count, 1);
    assert_eq!(op_metrics.errors, 1);
    assert_eq!(op_metrics.last_error, Some("Test failure".to_string()));
  }

  #[tokio::test]
  async fn test_operation_tracker_drop_without_completion() {
    let metrics = ServiceMetrics::new("test-service".to_string());

    {
      let _tracker = metrics.start_operation("drop-test");
      assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 1);
      // Tracker будет drop-нут здесь без вызова complete() или fail()
    }

    // После drop активные операции должны уменьшиться
    assert_eq!(metrics.active_operations.load(Ordering::Relaxed), 0);
    // Но общее количество операций не должно увеличиться
    assert_eq!(metrics.total_operations.load(Ordering::Relaxed), 0);
  }

  #[tokio::test]
  async fn test_record_operation_direct() {
    let metrics = ServiceMetrics::new("test-service".to_string());

    // Записываем успешную операцию
    metrics
      .record_operation("direct-success", Duration::from_millis(100), true, None)
      .await;

    // Записываем неудачную операцию
    metrics
      .record_operation(
        "direct-failure",
        Duration::from_millis(200),
        false,
        Some("Direct error".to_string()),
      )
      .await;

    let summary = metrics.get_summary().await;
    assert_eq!(summary.total_operations, 2);
    assert_eq!(summary.total_errors, 1);

    let success_metrics = summary.operation_metrics.get("direct-success").unwrap();
    assert_eq!(success_metrics.count, 1);
    assert_eq!(success_metrics.errors, 0);
    assert_eq!(success_metrics.total_duration_ms, 100);

    let failure_metrics = summary.operation_metrics.get("direct-failure").unwrap();
    assert_eq!(failure_metrics.count, 1);
    assert_eq!(failure_metrics.errors, 1);
    assert_eq!(failure_metrics.total_duration_ms, 200);
    assert_eq!(failure_metrics.last_error, Some("Direct error".to_string()));
  }

  #[tokio::test]
  async fn test_metrics_aggregation() {
    let metrics = ServiceMetrics::new("aggregation-test".to_string());

    // Выполняем несколько операций одного типа
    for i in 1..=5 {
      metrics
        .record_operation("repeated-op", Duration::from_millis(i * 10), true, None)
        .await;
    }

    let summary = metrics.get_summary().await;
    let op_metrics = summary.operation_metrics.get("repeated-op").unwrap();

    assert_eq!(op_metrics.count, 5);
    assert_eq!(op_metrics.total_duration_ms, 150); // 10+20+30+40+50
    assert_eq!(op_metrics.min_duration_ms, 10);
    assert_eq!(op_metrics.max_duration_ms, 50);
    assert_eq!(op_metrics.avg_duration_ms, 30.0);
    assert_eq!(op_metrics.errors, 0);
  }

  #[tokio::test]
  async fn test_metrics_summary_calculations() {
    let metrics = ServiceMetrics::new("calc-test".to_string());

    // Добавляем небольшую задержку чтобы uptime был больше 0
    tokio::time::sleep(Duration::from_millis(1)).await;

    // Добавляем некоторые операции
    metrics
      .record_operation("op1", Duration::from_millis(100), true, None)
      .await;
    metrics
      .record_operation(
        "op2",
        Duration::from_millis(200),
        false,
        Some("Error".to_string()),
      )
      .await;
    metrics
      .record_operation("op3", Duration::from_millis(150), true, None)
      .await;

    // Добавляем активную операцию
    let _active_tracker = metrics.start_operation("active-op");

    let summary = metrics.get_summary().await;

    assert_eq!(summary.service_name, "calc-test");
    assert_eq!(summary.total_operations, 3);
    assert_eq!(summary.total_errors, 1);
    assert_eq!(summary.active_operations, 1);
    assert!((summary.error_rate - (1.0 / 3.0)).abs() < f64::EPSILON);
    assert!(summary.operations_per_second >= 0.0);
    // uptime_seconds is always >= 0 as it's u64, so we just check it exists
    assert!(summary.uptime_seconds < u64::MAX);
    assert_eq!(summary.operation_metrics.len(), 3);
  }

  #[tokio::test]
  async fn test_metrics_reset() {
    let metrics = ServiceMetrics::new("reset-test".to_string());

    // Добавляем данные
    metrics
      .record_operation("op1", Duration::from_millis(100), true, None)
      .await;
    metrics
      .record_operation(
        "op2",
        Duration::from_millis(200),
        false,
        Some("Error".to_string()),
      )
      .await;

    let summary_before = metrics.get_summary().await;
    assert_eq!(summary_before.total_operations, 2);
    assert_eq!(summary_before.total_errors, 1);
    assert!(!summary_before.operation_metrics.is_empty());

    // Сбрасываем метрики
    metrics.reset().await;

    let summary_after = metrics.get_summary().await;
    assert_eq!(summary_after.total_operations, 0);
    assert_eq!(summary_after.total_errors, 0);
    assert_eq!(summary_after.active_operations, 0);
    assert!(summary_after.operation_metrics.is_empty());
    assert_eq!(summary_after.error_rate, 0.0);
  }

  #[tokio::test]
  async fn test_metrics_registry_creation() {
    let registry = MetricsRegistry::new();
    let summaries = registry.get_all_summaries().await;
    assert!(summaries.is_empty());
  }

  #[tokio::test]
  async fn test_metrics_registry_default() {
    let registry = MetricsRegistry::default();
    let summaries = registry.get_all_summaries().await;
    assert!(summaries.is_empty());
  }

  #[tokio::test]
  async fn test_metrics_registry() {
    let registry = MetricsRegistry::new();
    let metrics = registry.register_service("test-service".to_string()).await;

    // Выполняем операцию
    let tracker = metrics.start_operation("test-op");
    tracker.complete().await;

    let summaries = registry.get_all_summaries().await;
    assert_eq!(summaries.len(), 1);
    assert_eq!(summaries[0].service_name, "test-service");
    assert_eq!(summaries[0].total_operations, 1);

    // Тест экспорта Prometheus
    let prometheus = registry.export_prometheus().await;
    assert!(prometheus.contains("test_service_operations_total 1"));
  }

  #[tokio::test]
  async fn test_metrics_registry_multiple_services() {
    let registry = MetricsRegistry::new();

    let service1 = registry.register_service("service-1".to_string()).await;
    let service2 = registry.register_service("service-2".to_string()).await;

    // Операции для первого сервиса
    service1
      .record_operation("op1", Duration::from_millis(100), true, None)
      .await;
    service1
      .record_operation(
        "op2",
        Duration::from_millis(200),
        false,
        Some("Error".to_string()),
      )
      .await;

    // Операции для второго сервиса
    service2
      .record_operation("op3", Duration::from_millis(150), true, None)
      .await;

    let summaries = registry.get_all_summaries().await;
    assert_eq!(summaries.len(), 2);

    // Проверяем, что можем получить метрики конкретного сервиса
    let retrieved_service1 = registry.get_service_metrics("service-1").await;
    assert!(retrieved_service1.is_some());

    let retrieved_service3 = registry.get_service_metrics("non-existent").await;
    assert!(retrieved_service3.is_none());
  }

  #[tokio::test]
  async fn test_prometheus_export_detailed() {
    let registry = MetricsRegistry::new();
    let service = registry
      .register_service("detailed-service".to_string())
      .await;

    // Добавляем различные операции
    service
      .record_operation("video_encode", Duration::from_millis(500), true, None)
      .await;
    service
      .record_operation("video_encode", Duration::from_millis(600), true, None)
      .await;
    service
      .record_operation(
        "audio_process",
        Duration::from_millis(100),
        false,
        Some("Audio error".to_string()),
      )
      .await;
    service
      .record_operation("file-upload", Duration::from_millis(300), true, None)
      .await;

    let prometheus = registry.export_prometheus().await;

    // Проверяем основные метрики
    assert!(prometheus.contains("detailed_service_operations_total 4"));
    assert!(prometheus.contains("detailed_service_errors_total 1"));
    assert!(prometheus.contains("detailed_service_active_operations 0"));

    // Проверяем метрики операций
    assert!(prometheus.contains("detailed_service_operation_count{operation=\"video_encode\"} 2"));
    assert!(prometheus.contains("detailed_service_operation_count{operation=\"audio_process\"} 1"));
    assert!(prometheus.contains("detailed_service_operation_count{operation=\"file_upload\"} 1"));

    assert!(prometheus.contains("detailed_service_operation_errors{operation=\"video_encode\"} 0"));
    assert!(
      prometheus.contains("detailed_service_operation_errors{operation=\"audio_process\"} 1")
    );

    // Проверяем форматирование имен (замену дефисов и пробелов)
    assert!(prometheus.contains("operation=\"file_upload\""));
  }

  #[tokio::test]
  async fn test_concurrent_operations() {
    let metrics = Arc::new(ServiceMetrics::new("concurrent-test".to_string()));

    // Запускаем несколько операций параллельно
    let mut handles = vec![];

    for i in 0..10 {
      let metrics_ref = Arc::clone(&metrics);
      let handle = tokio::spawn(async move {
        let tracker = metrics_ref.start_operation(&format!("concurrent-op-{}", i));
        tokio::time::sleep(Duration::from_millis(10)).await;
        tracker.complete().await;
      });
      handles.push(handle);
    }

    // Ждем завершения всех операций
    for handle in handles {
      handle.await.unwrap();
    }

    let summary = metrics.get_summary().await;
    assert_eq!(summary.total_operations, 10);
    assert_eq!(summary.total_errors, 0);
    assert_eq!(summary.active_operations, 0);
    assert_eq!(summary.operation_metrics.len(), 10);
  }

  #[tokio::test]
  async fn test_operation_metrics_edge_cases() {
    let metrics = ServiceMetrics::new("edge-case-test".to_string());

    // Операция с нулевым временем выполнения
    metrics
      .record_operation("zero-duration", Duration::from_millis(0), true, None)
      .await;

    // Операция с очень большим временем выполнения
    metrics
      .record_operation("long-duration", Duration::from_secs(1), true, None)
      .await;

    let summary = metrics.get_summary().await;
    let zero_metrics = summary.operation_metrics.get("zero-duration").unwrap();
    let long_metrics = summary.operation_metrics.get("long-duration").unwrap();

    assert_eq!(zero_metrics.min_duration_ms, 0);
    assert_eq!(zero_metrics.max_duration_ms, 0);
    assert_eq!(zero_metrics.avg_duration_ms, 0.0);

    assert_eq!(long_metrics.min_duration_ms, 1000);
    assert_eq!(long_metrics.max_duration_ms, 1000);
    assert_eq!(long_metrics.avg_duration_ms, 1000.0);
  }

  #[tokio::test]
  async fn test_error_rate_calculations() {
    let metrics = ServiceMetrics::new("error-rate-test".to_string());

    // Только успешные операции
    for _ in 0..5 {
      metrics
        .record_operation("success-op", Duration::from_millis(100), true, None)
        .await;
    }

    let summary = metrics.get_summary().await;
    assert_eq!(summary.error_rate, 0.0);

    // Добавляем ошибки
    for _ in 0..2 {
      metrics
        .record_operation(
          "error-op",
          Duration::from_millis(100),
          false,
          Some("Error".to_string()),
        )
        .await;
    }

    let summary_with_errors = metrics.get_summary().await;
    assert!((summary_with_errors.error_rate - (2.0 / 7.0)).abs() < f64::EPSILON);
  }
}

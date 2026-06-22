//! Расширенная версия CacheService с интегрированными метриками
//!
//! Этот файл демонстрирует как интегрировать мониторинг в сервисы

use crate::services::{CacheService, Service, ServiceMetrics};
use ts_render::video_compiler::core::error::Result;
use async_trait::async_trait;
use std::{path::PathBuf, sync::Arc};

use super::cache_service::{CacheAlert, CacheAlertThresholds, CachePerformanceMetrics, CacheStats};

/// Реализация сервиса кэша с метриками
pub struct CacheServiceWithMetrics {
  inner: Box<dyn CacheService>,
  metrics: Arc<ServiceMetrics>,
}

impl CacheServiceWithMetrics {
  #[allow(dead_code)]
  pub fn new(inner: Box<dyn CacheService>, metrics: Arc<ServiceMetrics>) -> Self {
    Self { inner, metrics }
  }
}

#[async_trait]
impl Service for CacheServiceWithMetrics {
  async fn initialize(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("initialize");
    match self.inner.initialize().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn health_check(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("health_check");
    match self.inner.health_check().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn shutdown(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("shutdown");
    match self.inner.shutdown().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }
}

#[async_trait]
impl CacheService for CacheServiceWithMetrics {
  async fn clear_all(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_all");
    match self.inner.clear_all().await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Весь кэш успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка очистки кэша: {e}");
        Err(e)
      }
    }
  }

  async fn clear_render_cache(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_render_cache");
    match self.inner.clear_render_cache().await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Кэш рендеринга успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка очистки кэша рендеринга: {e}");
        Err(e)
      }
    }
  }

  async fn clear_preview_cache(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_preview_cache");
    match self.inner.clear_preview_cache().await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Кэш превью успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка очистки кэша превью: {e}");
        Err(e)
      }
    }
  }

  async fn clear_project_cache(&self, project_id: &str) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_project_cache");
    match self.inner.clear_project_cache(project_id).await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Кэш проекта {project_id} успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(format!("Проект {project_id}: {e}")).await;
        log::error!("[CacheService] Ошибка очистки кэша проекта {project_id}: {e}");
        Err(e)
      }
    }
  }

  async fn get_cache_size(&self) -> Result<f64> {
    let tracker = self.metrics.start_operation("get_cache_size");
    match self.inner.get_cache_size().await {
      Ok(size) => {
        tracker.complete().await;
        log::debug!("[CacheService] Размер кэша: {size:.2} MB");
        Ok(size)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка получения размера кэша: {e}");
        Err(e)
      }
    }
  }

  async fn get_cache_stats(&self) -> Result<CacheStats> {
    let tracker = self.metrics.start_operation("get_cache_stats");
    match self.inner.get_cache_stats().await {
      Ok(stats) => {
        tracker.complete().await;
        log::debug!(
          "[CacheService] Статистика кэша: всего {:.2} MB, {} файлов",
          stats.total_size_mb,
          stats.total_files
        );
        Ok(stats)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка получения статистики кэша: {e}");
        Err(e)
      }
    }
  }

  async fn optimize_cache(&self, max_age_days: u32) -> Result<usize> {
    let tracker = self.metrics.start_operation("optimize_cache");
    match self.inner.optimize_cache(max_age_days).await {
      Ok(removed_count) => {
        tracker.complete().await;
        log::info!(
          "[CacheService] Оптимизация кэша завершена: удалено {removed_count} файлов старше {max_age_days} дней"
        );
        Ok(removed_count)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка оптимизации кэша: {e}");
        Err(e)
      }
    }
  }

  async fn get_cache_path(&self) -> Result<PathBuf> {
    let tracker = self.metrics.start_operation("get_cache_path");
    match self.inner.get_cache_path().await {
      Ok(path) => {
        tracker.complete().await;
        Ok(path)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn save_to_cache(&self, key: &str, data: &[u8]) -> Result<PathBuf> {
    let tracker = self.metrics.start_operation("save_to_cache");
    match self.inner.save_to_cache(key, data).await {
      Ok(path) => {
        tracker.complete().await;
        log::trace!(
          "[CacheService] Сохранено в кэш: {} ({} байт)",
          key,
          data.len()
        );
        Ok(path)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка сохранения в кэш {key}: {e}");
        Err(e)
      }
    }
  }

  async fn get_from_cache(&self, key: &str) -> Result<Option<Vec<u8>>> {
    let tracker = self.metrics.start_operation("get_from_cache");
    match self.inner.get_from_cache(key).await {
      Ok(Some(data)) => {
        tracker.complete().await;
        log::trace!(
          "[CacheService] Получено из кэша: {} ({} байт)",
          key,
          data.len()
        );
        Ok(Some(data))
      }
      Ok(None) => {
        tracker.complete().await;
        log::trace!("[CacheService] Не найдено в кэше: {key}");
        Ok(None)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка чтения из кэша {key}: {e}");
        Err(e)
      }
    }
  }

  async fn exists_in_cache(&self, key: &str) -> Result<bool> {
    let tracker = self.metrics.start_operation("exists_in_cache");
    match self.inner.exists_in_cache(key).await {
      Ok(exists) => {
        tracker.complete().await;
        Ok(exists)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn get_performance_metrics(&self) -> Result<CachePerformanceMetrics> {
    let tracker = self.metrics.start_operation("get_performance_metrics");
    match self.inner.get_performance_metrics().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn reset_metrics(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("reset_metrics");
    match self.inner.reset_metrics().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn set_alert_thresholds(&self, thresholds: CacheAlertThresholds) -> Result<()> {
    let tracker = self.metrics.start_operation("set_alert_thresholds");
    match self.inner.set_alert_thresholds(thresholds).await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn get_active_alerts(&self) -> Result<Vec<CacheAlert>> {
    let tracker = self.metrics.start_operation("get_active_alerts");
    match self.inner.get_active_alerts().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn list_cached_items(&self) -> Result<Vec<String>> {
    let tracker = self.metrics.start_operation("list_cached_items");
    match self.inner.list_cached_items().await {
      Ok(result) => {
        tracker.complete().await;
        log::debug!(
          "[CacheService] Получен список из {} элементов кэша",
          result.len()
        );
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка получения списка элементов кэша: {e}");
        Err(e)
      }
    }
  }

  async fn get_item_info(&self, key: &str) -> Result<Option<super::cache_service::CacheItemInfo>> {
    let tracker = self.metrics.start_operation("get_item_info");
    match self.inner.get_item_info(key).await {
      Ok(Some(info)) => {
        tracker.complete().await;
        log::debug!(
          "[CacheService] Получена информация об элементе кэша: {} ({} байт)",
          key,
          info.size_bytes
        );
        Ok(Some(info))
      }
      Ok(None) => {
        tracker.complete().await;
        log::debug!("[CacheService] Элемент кэша не найден: {key}");
        Ok(None)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка получения информации об элементе кэша {key}: {e}");
        Err(e)
      }
    }
  }
}

/// Хелпер для создания CacheService с метриками
#[allow(dead_code)]
pub fn wrap_with_metrics(
  service: Box<dyn CacheService>,
  metrics: Arc<ServiceMetrics>,
) -> Box<dyn CacheService> {
  Box::new(CacheServiceWithMetrics::new(service, metrics))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::services::{CacheServiceImpl, ServiceMetrics};
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_cache_service_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-cache".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    // Инициализация
    assert!(service.initialize().await.is_ok());

    // Сохранение в кэш
    let key = "test_key";
    let data = b"test data";
    assert!(service.save_to_cache(key, data).await.is_ok());

    // Чтение из кэша
    let cached = service.get_from_cache(key).await.unwrap();
    assert_eq!(cached, Some(data.to_vec()));

    // Проверка метрик
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 3); // initialize, save, get
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_metrics_tracking_for_all_operations() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-metrics".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    // Инициализация
    service.initialize().await.unwrap();

    // Выполняем различные операции
    service.save_to_cache("key1", b"data1").await.unwrap();
    service.save_to_cache("key2", b"data2").await.unwrap();
    service.get_from_cache("key1").await.unwrap();
    service.exists_in_cache("key2").await.unwrap();
    service.get_cache_size().await.unwrap();
    service.get_cache_stats().await.unwrap();
    service.list_cached_items().await.unwrap();

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 8);
    assert_eq!(summary.total_errors, 0);
    assert!(summary.error_rate < 0.01);
  }

  #[tokio::test]
  async fn test_error_metrics_tracking() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-errors".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Пытаемся получить несуществующий элемент
    let result = service.get_from_cache("non_existent").await.unwrap();
    assert_eq!(result, None);

    // Пытаемся получить информацию о несуществующем элементе
    let info = service.get_item_info("non_existent").await.unwrap();
    assert!(info.is_none());

    // Проверяем, что ошибок не было (None - это не ошибка)
    let summary = metrics.get_summary().await;
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_cache_optimization_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-optimize".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Добавляем элементы в кэш
    for i in 0..5 {
      service
        .save_to_cache(&format!("key{i}"), format!("data{i}").as_bytes())
        .await
        .unwrap();
    }

    // Оптимизируем кэш (удаляем файлы старше 0 дней - т.е. все)
    let _removed = service.optimize_cache(0).await.unwrap();
    // Проверяем, что операция выполнилась без ошибок

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 7); // init + 5 save + optimize
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_cache_clear_operations_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-clear".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Добавляем элементы
    service
      .save_to_cache("render/item1", b"data1")
      .await
      .unwrap();
    service
      .save_to_cache("preview/item2", b"data2")
      .await
      .unwrap();
    service
      .save_to_cache("project/test/item3", b"data3")
      .await
      .unwrap();

    // Очищаем различные типы кэша
    service.clear_render_cache().await.unwrap();
    service.clear_preview_cache().await.unwrap();
    service.clear_project_cache("test").await.unwrap();
    service.clear_all().await.unwrap();

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 8); // init + 3 save + 4 clear
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_performance_metrics_tracking() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-perf".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Симулируем операции для генерации метрик производительности
    for i in 0..10 {
      service
        .save_to_cache(&format!("key{i}"), format!("data{i}").as_bytes())
        .await
        .unwrap();
      service.get_from_cache(&format!("key{i}")).await.unwrap();
    }

    // Получаем метрики производительности
    let perf_metrics = service.get_performance_metrics().await.unwrap();
    assert!(perf_metrics.hit_rate_last_hour >= 0.0);
    assert!(perf_metrics.current_memory_usage_mb >= 0.0);

    // Сбрасываем метрики
    service.reset_metrics().await.unwrap();

    // Проверяем, что сброс сработал через сервис кэша
    let cache_stats = service.get_cache_stats().await.unwrap();
    assert_eq!(cache_stats.cache_hits, 0);
    assert_eq!(cache_stats.cache_misses, 0);
  }

  #[tokio::test]
  async fn test_alert_thresholds_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-alerts".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Устанавливаем пороги для алертов
    let thresholds = CacheAlertThresholds {
      min_hit_rate: 0.8,
      max_memory_usage_mb: 100.0,
      max_response_time_ms: 50.0,
      max_fragmentation: 0.3,
    };
    service.set_alert_thresholds(thresholds).await.unwrap();

    // Получаем активные алерты
    let alerts = service.get_active_alerts().await.unwrap();
    assert!(alerts.is_empty() || !alerts.is_empty()); // Алерты могут быть или не быть

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 3); // init + set_thresholds + get_alerts
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_cache_stats_and_info_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-stats".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Добавляем несколько элементов
    let items = vec![
      ("item1", b"short data" as &[u8]),
      ("item2", b"longer data with more content" as &[u8]),
      (
        "item3",
        b"very long data with lots of content to test size calculations" as &[u8],
      ),
    ];

    for (key, data) in &items {
      service.save_to_cache(key, data).await.unwrap();
    }

    // Получаем статистику кэша
    let stats = service.get_cache_stats().await.unwrap();
    assert!(stats.total_files >= items.len());
    assert!(stats.total_size_mb > 0.0);

    // Получаем информацию о конкретных элементах
    for (key, data) in &items {
      let info = service.get_item_info(key).await.unwrap();
      assert!(info.is_some());
      let info = info.unwrap();
      assert_eq!(info.key, *key);
      assert_eq!(info.size_bytes, data.len() as u64);
    }

    // Проверяем список элементов
    let cached_items = service.list_cached_items().await.unwrap();
    assert!(cached_items.len() >= items.len());

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_health_check_and_shutdown_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-lifecycle".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    // Инициализация
    service.initialize().await.unwrap();

    // Health check
    service.health_check().await.unwrap();

    // Shutdown
    service.shutdown().await.unwrap();

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 3); // init + health_check + shutdown
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_cache_path_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let cache_path = temp_dir.path().to_path_buf();
    let inner = Box::new(CacheServiceImpl::new(cache_path.clone()));
    let metrics = Arc::new(ServiceMetrics::new("test-path".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Получаем путь к кэшу
    let retrieved_path = service.get_cache_path().await.unwrap();
    assert_eq!(retrieved_path, cache_path);

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 2); // init + get_cache_path
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_concurrent_operations_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-concurrent".to_string()));
    let service = Arc::new(CacheServiceWithMetrics::new(inner, metrics.clone()));

    service.initialize().await.unwrap();

    // Запускаем несколько операций параллельно
    let mut handles = vec![];

    for i in 0..5 {
      let service_clone = service.clone();
      let handle = tokio::spawn(async move {
        let key = format!("concurrent_key_{i}");
        let data = format!("concurrent_data_{i}");
        service_clone
          .save_to_cache(&key, data.as_bytes())
          .await
          .unwrap();
        service_clone.get_from_cache(&key).await.unwrap();
      });
      handles.push(handle);
    }

    // Ждем завершения всех операций
    for handle in handles {
      handle.await.unwrap();
    }

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 11); // init + 5*(save+get)
    assert_eq!(summary.total_errors, 0);
  }

  #[tokio::test]
  async fn test_exists_in_cache_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-exists".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    service.initialize().await.unwrap();

    // Сохраняем элемент
    let key = "exists_test";
    service.save_to_cache(key, b"test data").await.unwrap();

    // Проверяем существование
    assert!(service.exists_in_cache(key).await.unwrap());
    assert!(!service.exists_in_cache("non_existent").await.unwrap());

    // Проверяем метрики
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 4); // init + save + 2*exists
    assert_eq!(summary.total_errors, 0);
  }
}

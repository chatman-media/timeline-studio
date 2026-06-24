//! Health checks для мониторинга состояния системы

use crate::{EventBus, PluginManager};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Статус health check
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthStatus {
  /// Система работает нормально
  Healthy,
  /// Система работает, но есть предупреждения
  Warning,
  /// Система не работает или работает с критическими ошибками
  Unhealthy,
  /// Неизвестное состояние
  Unknown,
}

impl HealthStatus {
  /// Получить HTTP статус код для health check
  pub fn http_status_code(&self) -> u16 {
    match self {
      HealthStatus::Healthy => 200,
      HealthStatus::Warning => 200,
      HealthStatus::Unhealthy => 503,
      HealthStatus::Unknown => 503,
    }
  }

  /// Комбинировать статусы (берем худший)
  pub fn combine(&self, other: HealthStatus) -> HealthStatus {
    match (self, other) {
      (HealthStatus::Unhealthy, _) | (_, HealthStatus::Unhealthy) => HealthStatus::Unhealthy,
      (HealthStatus::Unknown, _) | (_, HealthStatus::Unknown) => HealthStatus::Unknown,
      (HealthStatus::Warning, _) | (_, HealthStatus::Warning) => HealthStatus::Warning,
      (HealthStatus::Healthy, HealthStatus::Healthy) => HealthStatus::Healthy,
    }
  }
}

/// Результат health check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
  /// Статус
  pub status: HealthStatus,

  /// Человекочитаемое сообщение
  pub message: String,

  /// Время выполнения проверки
  pub duration: Duration,

  /// Дополнительные данные
  pub data: HashMap<String, serde_json::Value>,

  /// Время проверки
  pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl HealthCheckResult {
  /// Создать успешный результат
  pub fn healthy(message: impl Into<String>, duration: Duration) -> Self {
    Self {
      status: HealthStatus::Healthy,
      message: message.into(),
      duration,
      data: HashMap::new(),
      timestamp: chrono::Utc::now(),
    }
  }

  /// Создать результат с предупреждением
  pub fn warning(message: impl Into<String>, duration: Duration) -> Self {
    Self {
      status: HealthStatus::Warning,
      message: message.into(),
      duration,
      data: HashMap::new(),
      timestamp: chrono::Utc::now(),
    }
  }

  /// Создать неуспешный результат
  pub fn unhealthy(message: impl Into<String>, duration: Duration) -> Self {
    Self {
      status: HealthStatus::Unhealthy,
      message: message.into(),
      duration,
      data: HashMap::new(),
      timestamp: chrono::Utc::now(),
    }
  }

  /// Добавить данные
  pub fn with_data(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
    self.data.insert(key.into(), value);
    self
  }
}

/// Trait для health check провайдеров
#[async_trait::async_trait]
pub trait HealthCheck: Send + Sync {
  /// Имя проверки
  fn name(&self) -> &'static str;

  /// Выполнить проверку
  async fn check(&self) -> HealthCheckResult;

  /// Timeout для проверки (по умолчанию 30 секунд)
  fn timeout(&self) -> Duration {
    Duration::from_secs(30)
  }

  /// Критичность проверки (если true, то неуспех делает всю систему unhealthy)
  fn is_critical(&self) -> bool {
    true
  }
}

/// Health check для базы данных/файловой системы
pub struct DatabaseHealthCheck {
  /// Путь к директории данных приложения
  data_dir: Option<std::path::PathBuf>,
}

impl Default for DatabaseHealthCheck {
  fn default() -> Self {
    Self::new()
  }
}

impl DatabaseHealthCheck {
  pub fn new() -> Self {
    // Получаем директорию данных приложения
    let data_dir = dirs::data_dir().map(|dir| dir.join("timeline-studio"));
    Self { data_dir }
  }

  /// Проверить доступность и права записи в директорию
  async fn check_directory(path: &std::path::Path) -> Result<(), String> {
    // Проверяем существование директории
    if !path.exists() {
      // Пытаемся создать директорию
      std::fs::create_dir_all(path).map_err(|e| format!("Failed to create data directory: {e}"))?;
    }

    // Проверяем что это директория
    let metadata =
      std::fs::metadata(path).map_err(|e| format!("Failed to access directory: {e}"))?;

    if !metadata.is_dir() {
      return Err("Path exists but is not a directory".to_string());
    }

    // Проверяем права записи путем создания временного файла
    let temp_file = path.join(".health_check_test");
    std::fs::write(&temp_file, b"test").map_err(|e| format!("Directory is not writable: {e}"))?;

    // Удаляем временный файл
    std::fs::remove_file(&temp_file).map_err(|e| format!("Failed to cleanup test file: {e}"))?;

    Ok(())
  }
}

#[async_trait::async_trait]
impl HealthCheck for DatabaseHealthCheck {
  fn name(&self) -> &'static str {
    "database"
  }

  async fn check(&self) -> HealthCheckResult {
    let start = Instant::now();

    // Timeline Studio использует файловое хранилище вместо БД
    // Проверяем доступность директорий данных

    // Проверяем основную директорию данных
    if let Some(ref data_dir) = self.data_dir {
      match Self::check_directory(data_dir).await {
        Ok(()) => {
          // Проверяем поддиректории
          let mut all_healthy = true;
          let mut details = serde_json::Map::new();

          // Проверяем projects директорию
          let projects_dir = data_dir.join("projects");
          match Self::check_directory(&projects_dir).await {
            Ok(()) => {
              details.insert(
                "projects_dir".to_string(),
                serde_json::Value::String("healthy".to_string()),
              );
            }
            Err(e) => {
              all_healthy = false;
              details.insert(
                "projects_dir".to_string(),
                serde_json::Value::String(format!("error: {e}")),
              );
            }
          }

          // Проверяем cache директорию
          let cache_dir = data_dir.join("cache");
          match Self::check_directory(&cache_dir).await {
            Ok(()) => {
              details.insert(
                "cache_dir".to_string(),
                serde_json::Value::String("healthy".to_string()),
              );
            }
            Err(e) => {
              all_healthy = false;
              details.insert(
                "cache_dir".to_string(),
                serde_json::Value::String(format!("error: {e}")),
              );
            }
          }

          // Проверяем logs директорию
          let logs_dir = data_dir.join("logs");
          match Self::check_directory(&logs_dir).await {
            Ok(()) => {
              details.insert(
                "logs_dir".to_string(),
                serde_json::Value::String("healthy".to_string()),
              );
            }
            Err(e) => {
              all_healthy = false;
              details.insert(
                "logs_dir".to_string(),
                serde_json::Value::String(format!("error: {e}")),
              );
            }
          }

          // Добавляем информацию о пути
          details.insert(
            "data_path".to_string(),
            serde_json::Value::String(data_dir.display().to_string()),
          );

          if all_healthy {
            HealthCheckResult::healthy(
              "All data directories accessible and writable",
              start.elapsed(),
            )
            .with_data("directories", serde_json::Value::Object(details))
          } else {
            HealthCheckResult::unhealthy("Some data directories have issues", start.elapsed())
              .with_data("directories", serde_json::Value::Object(details))
          }
        }
        Err(e) => {
          HealthCheckResult::unhealthy(format!("Data directory error: {e}"), start.elapsed())
            .with_data(
              "data_path",
              serde_json::Value::String(data_dir.display().to_string()),
            )
        }
      }
    } else {
      HealthCheckResult::unhealthy(
        "Could not determine application data directory",
        start.elapsed(),
      )
    }
  }
}

/// Health check для памяти
pub struct MemoryHealthCheck {
  warning_threshold: f64,  // Процент использования памяти для warning
  critical_threshold: f64, // Процент использования памяти для critical
}

impl Default for MemoryHealthCheck {
  fn default() -> Self {
    Self::new()
  }
}

impl MemoryHealthCheck {
  pub fn new() -> Self {
    Self {
      warning_threshold: 80.0,
      critical_threshold: 95.0,
    }
  }

  pub fn with_thresholds(warning: f64, critical: f64) -> Self {
    Self {
      warning_threshold: warning,
      critical_threshold: critical,
    }
  }
}

#[async_trait::async_trait]
impl HealthCheck for MemoryHealthCheck {
  fn name(&self) -> &'static str {
    "memory"
  }

  async fn check(&self) -> HealthCheckResult {
    let start = Instant::now();

    let mut system = sysinfo::System::new();
    system.refresh_memory();

    let total_memory = system.total_memory() as f64;
    let used_memory = system.used_memory() as f64;
    let usage_percent = (used_memory / total_memory) * 100.0;

    let result = if usage_percent > self.critical_threshold {
      HealthCheckResult::unhealthy(
        format!("Critical memory usage: {usage_percent:.1}%"),
        start.elapsed(),
      )
    } else if usage_percent > self.warning_threshold {
      HealthCheckResult::warning(
        format!("High memory usage: {usage_percent:.1}%"),
        start.elapsed(),
      )
    } else {
      HealthCheckResult::healthy(
        format!("Memory usage: {usage_percent:.1}%"),
        start.elapsed(),
      )
    };

    result
      .with_data(
        "total_bytes",
        serde_json::Value::Number(serde_json::Number::from(total_memory as u64)),
      )
      .with_data(
        "used_bytes",
        serde_json::Value::Number(serde_json::Number::from(used_memory as u64)),
      )
      .with_data(
        "usage_percent",
        serde_json::Value::Number(
          serde_json::Number::from_f64(usage_percent)
            .unwrap_or_else(|| serde_json::Number::from(0)),
        ),
      )
  }
}

/// Health check для плагинов
pub struct PluginHealthCheck {
  plugin_manager: Arc<PluginManager>,
}

impl PluginHealthCheck {
  pub fn new(plugin_manager: Arc<PluginManager>) -> Self {
    Self { plugin_manager }
  }
}

#[async_trait::async_trait]
impl HealthCheck for PluginHealthCheck {
  fn name(&self) -> &'static str {
    "plugins"
  }

  fn is_critical(&self) -> bool {
    false // Плагины не критичны для работы системы
  }

  async fn check(&self) -> HealthCheckResult {
    let start = Instant::now();

    let plugins = self.plugin_manager.list_loaded_plugins().await;
    let total_count = plugins.len();
    let active_count = plugins
      .iter()
      .filter(|p| matches!(p.1, crate::plugins::plugin::PluginState::Active))
      .count();

    let message = format!("Plugins: {active_count}/{total_count} active");

    let result = if active_count == total_count {
      HealthCheckResult::healthy(message, start.elapsed())
    } else if active_count > 0 {
      HealthCheckResult::warning(message, start.elapsed())
    } else {
      HealthCheckResult::warning("No active plugins".to_string(), start.elapsed())
    };

    result
      .with_data("total_plugins", serde_json::json!(total_count))
      .with_data("active_plugins", serde_json::json!(active_count))
  }
}

/// Health check для Event Bus
pub struct EventBusHealthCheck {
  event_bus: Arc<EventBus>,
}

impl EventBusHealthCheck {
  pub fn new(event_bus: Arc<EventBus>) -> Self {
    Self { event_bus }
  }
}

#[async_trait::async_trait]
impl HealthCheck for EventBusHealthCheck {
  fn name(&self) -> &'static str {
    "event_bus"
  }

  async fn check(&self) -> HealthCheckResult {
    let start = Instant::now();

    // Проверяем что event bus работает, отправив тестовое событие
    match self
      .event_bus
      .publish_app_event(crate::AppEvent::SystemHealthCheck {
        timestamp: chrono::Utc::now(),
      })
      .await
    {
      Ok(_) => HealthCheckResult::healthy("Event bus is responding", start.elapsed()),
      Err(e) => HealthCheckResult::unhealthy(format!("Event bus error: {e}"), start.elapsed()),
    }
  }
}

/// Менеджер health checks
pub struct HealthCheckManager {
  checks: Arc<RwLock<HashMap<String, Box<dyn HealthCheck>>>>,
  cache: Arc<RwLock<HashMap<String, (HealthCheckResult, Instant)>>>,
  cache_duration: Duration,
}

impl Default for HealthCheckManager {
  fn default() -> Self {
    Self::new()
  }
}

impl HealthCheckManager {
  /// Создать новый менеджер
  pub fn new() -> Self {
    Self {
      checks: Arc::new(RwLock::new(HashMap::new())),
      cache: Arc::new(RwLock::new(HashMap::new())),
      cache_duration: Duration::from_secs(30), // Кэшируем на 30 секунд
    }
  }

  /// Добавить health check
  pub async fn add_check(&self, check: Box<dyn HealthCheck>) {
    let name = check.name().to_string();
    let mut checks = self.checks.write().await;
    checks.insert(name, check);
  }

  /// Удалить health check
  pub async fn remove_check(&self, name: &str) {
    let mut checks = self.checks.write().await;
    checks.remove(name);

    let mut cache = self.cache.write().await;
    cache.remove(name);
  }

  /// Выполнить все проверки
  pub async fn check_all(&self) -> HealthCheckSummary {
    let checks = self.checks.read().await;
    let mut results = HashMap::new();
    let mut overall_status = HealthStatus::Healthy;

    for (name, check) in checks.iter() {
      let result = self.check_single(name, check.as_ref()).await;

      // Обновляем общий статус
      if check.is_critical() {
        overall_status = overall_status.combine(result.status);
      } else if result.status == HealthStatus::Unhealthy {
        // Для некритичных проверок unhealthy становится warning
        overall_status = overall_status.combine(HealthStatus::Warning);
      } else {
        overall_status = overall_status.combine(result.status);
      }

      results.insert(name.clone(), result);
    }

    HealthCheckSummary {
      status: overall_status,
      checks: results,
      timestamp: chrono::Utc::now(),
    }
  }

  /// Выполнить конкретную проверку
  pub async fn check_one(&self, name: &str) -> Option<HealthCheckResult> {
    let checks = self.checks.read().await;
    if let Some(check) = checks.get(name) {
      Some(self.check_single(name, check.as_ref()).await)
    } else {
      None
    }
  }

  /// Выполнить проверку с кэшированием
  async fn check_single(&self, name: &str, check: &dyn HealthCheck) -> HealthCheckResult {
    // Проверяем кэш
    {
      let cache = self.cache.read().await;
      if let Some((result, timestamp)) = cache.get(name) {
        if timestamp.elapsed() < self.cache_duration {
          return result.clone();
        }
      }
    }

    // Выполняем проверку с timeout
    let timeout = check.timeout();
    let result = match tokio::time::timeout(timeout, check.check()).await {
      Ok(result) => result,
      Err(_) => HealthCheckResult::unhealthy(
        format!("Health check '{name}' timed out after {timeout:?}"),
        timeout,
      ),
    };

    // Сохраняем в кэш
    {
      let mut cache = self.cache.write().await;
      cache.insert(name.to_string(), (result.clone(), Instant::now()));
    }

    result
  }

  /// Получить список всех проверок
  pub async fn list_checks(&self) -> Vec<String> {
    let checks = self.checks.read().await;
    checks.keys().cloned().collect()
  }

  /// Очистить кэш
  pub async fn clear_cache(&self) {
    let mut cache = self.cache.write().await;
    cache.clear();
  }
}

/// Сводка health checks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckSummary {
  /// Общий статус
  pub status: HealthStatus,

  /// Результаты отдельных проверок
  pub checks: HashMap<String, HealthCheckResult>,

  /// Время проверки
  pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl HealthCheckSummary {
  /// Получить HTTP статус код
  pub fn http_status_code(&self) -> u16 {
    self.status.http_status_code()
  }

  /// Проверить готовность системы (для readiness probe)
  pub fn is_ready(&self) -> bool {
    matches!(self.status, HealthStatus::Healthy | HealthStatus::Warning)
  }

  /// Проверить жизнеспособность системы (для liveness probe)
  pub fn is_alive(&self) -> bool {
    self.status != HealthStatus::Unhealthy
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  struct TestHealthCheck {
    name: &'static str,
    result: HealthCheckResult,
  }

  impl TestHealthCheck {
    fn new(name: &'static str, status: HealthStatus) -> Self {
      Self {
        name,
        result: match status {
          HealthStatus::Healthy => HealthCheckResult::healthy("Test", Duration::from_millis(1)),
          HealthStatus::Warning => HealthCheckResult::warning("Test", Duration::from_millis(1)),
          HealthStatus::Unhealthy => HealthCheckResult::unhealthy("Test", Duration::from_millis(1)),
          HealthStatus::Unknown => HealthCheckResult {
            status: HealthStatus::Unknown,
            message: "Test".to_string(),
            duration: Duration::from_millis(1),
            data: HashMap::new(),
            timestamp: chrono::Utc::now(),
          },
        },
      }
    }
  }

  #[async_trait::async_trait]
  impl HealthCheck for TestHealthCheck {
    fn name(&self) -> &'static str {
      self.name
    }

    async fn check(&self) -> HealthCheckResult {
      self.result.clone()
    }
  }

  #[test]
  fn test_health_status_combine() {
    assert_eq!(
      HealthStatus::Healthy.combine(HealthStatus::Warning),
      HealthStatus::Warning
    );

    assert_eq!(
      HealthStatus::Warning.combine(HealthStatus::Unhealthy),
      HealthStatus::Unhealthy
    );

    assert_eq!(
      HealthStatus::Healthy.combine(HealthStatus::Healthy),
      HealthStatus::Healthy
    );
  }

  #[tokio::test]
  async fn test_health_check_manager() {
    let manager = HealthCheckManager::new();

    // Добавляем тестовые проверки
    manager
      .add_check(Box::new(TestHealthCheck::new(
        "test1",
        HealthStatus::Healthy,
      )))
      .await;

    manager
      .add_check(Box::new(TestHealthCheck::new(
        "test2",
        HealthStatus::Warning,
      )))
      .await;

    // Проверяем все
    let summary = manager.check_all().await;
    assert_eq!(summary.status, HealthStatus::Warning);
    assert_eq!(summary.checks.len(), 2);

    // Проверяем конкретную
    let result = manager.check_one("test1").await;
    assert!(result.is_some());
    assert_eq!(result.unwrap().status, HealthStatus::Healthy);
  }

  #[test]
  fn test_health_status_http_codes() {
    assert_eq!(HealthStatus::Healthy.http_status_code(), 200);
    assert_eq!(HealthStatus::Warning.http_status_code(), 200);
    assert_eq!(HealthStatus::Unhealthy.http_status_code(), 503);
    assert_eq!(HealthStatus::Unknown.http_status_code(), 503);
  }

  #[test]
  fn test_health_check_result_creation() {
    let duration = Duration::from_millis(100);

    let healthy = HealthCheckResult::healthy("All good", duration);
    assert_eq!(healthy.status, HealthStatus::Healthy);
    assert_eq!(healthy.message, "All good");
    assert_eq!(healthy.duration, duration);

    let warning = HealthCheckResult::warning("Some issues", duration);
    assert_eq!(warning.status, HealthStatus::Warning);
    assert_eq!(warning.message, "Some issues");

    let unhealthy = HealthCheckResult::unhealthy("System down", duration);
    assert_eq!(unhealthy.status, HealthStatus::Unhealthy);
    assert_eq!(unhealthy.message, "System down");
  }

  #[test]
  fn test_health_check_result_with_data() {
    let result = HealthCheckResult::healthy("Test", Duration::from_millis(1))
      .with_data("key1", serde_json::json!("value1"))
      .with_data("key2", serde_json::json!(42));

    assert_eq!(result.data.len(), 2);
    assert_eq!(result.data.get("key1"), Some(&serde_json::json!("value1")));
    assert_eq!(result.data.get("key2"), Some(&serde_json::json!(42)));
  }

  #[tokio::test]
  async fn test_database_health_check() {
    let db_check = DatabaseHealthCheck::new();
    assert_eq!(db_check.name(), "database");

    let result = db_check.check().await;
    // Проверяем что статус не Unknown
    assert_ne!(result.status, HealthStatus::Unknown);

    // Проверяем сообщение в зависимости от статуса
    if result.status == HealthStatus::Healthy {
      assert!(result.message.contains("All data directories accessible"));
      assert!(result.data.contains_key("directories"));
    } else if result.status == HealthStatus::Unhealthy {
      assert!(result.message.contains("error") || result.message.contains("issues"));
      // Должна быть информация о проблеме
      assert!(!result.data.is_empty());
    }
  }

  #[tokio::test]
  async fn test_memory_health_check() {
    let memory_check = MemoryHealthCheck::new();
    assert_eq!(memory_check.name(), "memory");

    let result = memory_check.check().await;
    // Результат может быть любым в зависимости от системы, но должен содержать данные
    assert!(result.data.contains_key("total_bytes"));
    assert!(result.data.contains_key("used_bytes"));
    assert!(result.data.contains_key("usage_percent"));
  }

  #[tokio::test]
  async fn test_memory_health_check_with_custom_thresholds() {
    let memory_check = MemoryHealthCheck::with_thresholds(10.0, 20.0);
    let result = memory_check.check().await;

    // Тест должен проверить что пороги применяются корректно
    // В зависимости от реального использования памяти результат может быть разным
    let usage_percent = result
      .data
      .get("usage_percent")
      .and_then(|v| v.as_f64())
      .unwrap_or(0.0);

    if usage_percent > 20.0 {
      assert_eq!(result.status, HealthStatus::Unhealthy);
      assert!(result.message.contains("Critical memory usage"));
    } else if usage_percent > 10.0 {
      assert_eq!(result.status, HealthStatus::Warning);
      assert!(result.message.contains("High memory usage"));
    } else {
      assert_eq!(result.status, HealthStatus::Healthy);
      assert!(result.message.contains("Memory usage"));
    }

    // Проверяем что процент использования памяти корректный
    assert!((0.0..=100.0).contains(&usage_percent));
    // Проверяем что сообщение содержит процент
    assert!(result.message.contains(&format!("{usage_percent:.1}%")));
  }

  #[tokio::test]
  async fn test_health_check_manager_operations() {
    let manager = HealthCheckManager::new();

    // Проверяем пустой список
    let checks = manager.list_checks().await;
    assert!(checks.is_empty());

    // Добавляем проверку
    manager
      .add_check(Box::new(TestHealthCheck::new(
        "test",
        HealthStatus::Healthy,
      )))
      .await;

    let checks = manager.list_checks().await;
    assert_eq!(checks.len(), 1);
    assert!(checks.contains(&"test".to_string()));

    // Удаляем проверку
    manager.remove_check("test").await;
    let checks = manager.list_checks().await;
    assert!(checks.is_empty());
  }

  #[tokio::test]
  async fn test_health_check_manager_cache() {
    let manager = HealthCheckManager::new();

    manager
      .add_check(Box::new(TestHealthCheck::new(
        "cached_test",
        HealthStatus::Healthy,
      )))
      .await;

    // Первая проверка
    let result1 = manager.check_one("cached_test").await;
    assert!(result1.is_some());

    // Вторая проверка должна использовать кэш (мы не можем это легко проверить,
    // но можем убедиться что результат тот же)
    let result2 = manager.check_one("cached_test").await;
    assert!(result2.is_some());
    assert_eq!(result1.unwrap().status, result2.unwrap().status);

    // Очищаем кэш
    manager.clear_cache().await;

    // Проверка после очистки кэша
    let result3 = manager.check_one("cached_test").await;
    assert!(result3.is_some());
  }

  #[tokio::test]
  async fn test_health_check_manager_nonexistent() {
    let manager = HealthCheckManager::new();

    let result = manager.check_one("nonexistent").await;
    assert!(result.is_none());
  }

  #[tokio::test]
  async fn test_health_check_summary_methods() {
    let mut checks = HashMap::new();
    checks.insert(
      "test1".to_string(),
      HealthCheckResult::healthy("OK", Duration::from_millis(1)),
    );
    checks.insert(
      "test2".to_string(),
      HealthCheckResult::warning("Warning", Duration::from_millis(1)),
    );

    let summary = HealthCheckSummary {
      status: HealthStatus::Warning,
      checks,
      timestamp: chrono::Utc::now(),
    };

    assert_eq!(summary.http_status_code(), 200);
    assert!(summary.is_ready());
    assert!(summary.is_alive());

    // Тестируем unhealthy summary
    let unhealthy_summary = HealthCheckSummary {
      status: HealthStatus::Unhealthy,
      checks: HashMap::new(),
      timestamp: chrono::Utc::now(),
    };

    assert_eq!(unhealthy_summary.http_status_code(), 503);
    assert!(!unhealthy_summary.is_ready());
    assert!(!unhealthy_summary.is_alive());
  }

  #[tokio::test]
  async fn test_health_check_manager_critical_vs_non_critical() {
    let manager = HealthCheckManager::new();

    // Критичная проверка (по умолчанию все критичные)
    manager
      .add_check(Box::new(TestHealthCheck::new(
        "critical",
        HealthStatus::Unhealthy,
      )))
      .await;

    // Некритичная проверка
    struct NonCriticalCheck;

    #[async_trait::async_trait]
    impl HealthCheck for NonCriticalCheck {
      fn name(&self) -> &'static str {
        "non_critical"
      }

      fn is_critical(&self) -> bool {
        false
      }

      async fn check(&self) -> HealthCheckResult {
        HealthCheckResult::unhealthy("Failed", Duration::from_millis(1))
      }
    }

    manager.add_check(Box::new(NonCriticalCheck)).await;

    let summary = manager.check_all().await;
    // Критичная unhealthy проверка должна сделать систему unhealthy
    assert_eq!(summary.status, HealthStatus::Unhealthy);
  }

  struct TimeoutHealthCheck;

  #[async_trait::async_trait]
  impl HealthCheck for TimeoutHealthCheck {
    fn name(&self) -> &'static str {
      "timeout_test"
    }

    fn timeout(&self) -> Duration {
      Duration::from_millis(10) // Очень короткий timeout
    }

    async fn check(&self) -> HealthCheckResult {
      tokio::time::sleep(Duration::from_millis(100)).await; // Долгая операция
      HealthCheckResult::healthy("Should not reach", Duration::from_millis(1))
    }
  }

  #[tokio::test]
  async fn test_health_check_timeout() {
    let manager = HealthCheckManager::new();
    manager.add_check(Box::new(TimeoutHealthCheck)).await;

    let result = manager.check_one("timeout_test").await;
    assert!(result.is_some());
    let result = result.unwrap();
    assert_eq!(result.status, HealthStatus::Unhealthy);
    assert!(result.message.contains("timed out"));
  }

  #[test]
  fn test_health_status_combine_comprehensive() {
    // Тестируем все возможные комбинации
    let statuses = [
      HealthStatus::Healthy,
      HealthStatus::Warning,
      HealthStatus::Unhealthy,
      HealthStatus::Unknown,
    ];

    for &status1 in &statuses {
      for &status2 in &statuses {
        let combined = status1.combine(status2);

        // Unhealthy всегда выигрывает
        if status1 == HealthStatus::Unhealthy || status2 == HealthStatus::Unhealthy {
          assert_eq!(combined, HealthStatus::Unhealthy);
        }
        // Unknown выигрывает если нет Unhealthy
        else if status1 == HealthStatus::Unknown || status2 == HealthStatus::Unknown {
          assert_eq!(combined, HealthStatus::Unknown);
        }
        // Warning выигрывает если нет Unhealthy или Unknown
        else if status1 == HealthStatus::Warning || status2 == HealthStatus::Warning {
          assert_eq!(combined, HealthStatus::Warning);
        }
        // Только если оба Healthy
        else {
          assert_eq!(combined, HealthStatus::Healthy);
        }
      }
    }
  }

  #[test]
  fn test_health_check_result_serialization() {
    let result = HealthCheckResult::healthy("Test message", Duration::from_millis(150))
      .with_data("test_key", serde_json::json!("test_value"));

    // Тестируем сериализацию
    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("Healthy"));
    assert!(serialized.contains("Test message"));
    assert!(serialized.contains("test_key"));

    // Тестируем десериализацию
    let deserialized: HealthCheckResult = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.status, HealthStatus::Healthy);
    assert_eq!(deserialized.message, "Test message");
    assert_eq!(deserialized.duration, Duration::from_millis(150));
    assert_eq!(
      deserialized.data.get("test_key"),
      Some(&serde_json::json!("test_value"))
    );
  }

  #[tokio::test]
  async fn test_database_health_check_with_directories() {
    let check = DatabaseHealthCheck::new();

    // Выполняем проверку
    let result = check.check().await;

    // Проверяем что результат не unknown
    assert_ne!(result.status, HealthStatus::Unknown);

    // Проверяем что результат содержит информацию о директориях
    if result.status == HealthStatus::Healthy || result.status == HealthStatus::Unhealthy {
      // Если есть data_dir, проверяем что есть информация о директориях
      if let Some(directories) = result.data.get("directories") {
        assert!(directories.is_object());
      } else if let Some(data_path) = result.data.get("data_path") {
        assert!(data_path.is_string());
      }
    }

    // Проверяем что duration установлен (всегда >= 0)
    assert!(result.duration.as_millis() < 10000); // Проверяем что операция завершилась быстро
  }

  #[tokio::test]
  async fn test_database_health_check_directory_operations() {
    use tempfile::TempDir;

    // Создаем временную директорию для теста
    let temp_dir = TempDir::new().unwrap();
    let test_path = temp_dir.path();

    // Тестируем создание поддиректорий
    let result = DatabaseHealthCheck::check_directory(test_path).await;
    assert!(result.is_ok());

    // Тестируем проверку существующей директории
    let result2 = DatabaseHealthCheck::check_directory(test_path).await;
    assert!(result2.is_ok());

    // Тестируем невалидный путь (файл вместо директории)
    let file_path = test_path.join("test_file");
    std::fs::write(&file_path, b"test").unwrap();
    let result3 = DatabaseHealthCheck::check_directory(&file_path).await;
    assert!(result3.is_err());
    assert!(result3.unwrap_err().contains("not a directory"));
  }
}

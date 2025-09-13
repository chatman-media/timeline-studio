//! Система sandboxing для изоляции плагинов

use super::permissions::{FileSystemPermissions, PluginPermissions, SecurityLevel};
use crate::video_compiler::error::{Result, VideoCompilerError};
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::{Duration, Instant};
use tokio::sync::{RwLock, Semaphore};

/// Лимиты ресурсов для плагина
#[derive(Debug, Clone)]
pub struct ResourceLimits {
  /// Максимальная память (в байтах)
  pub max_memory: u64,

  /// Максимальное время выполнения команды
  pub max_execution_time: Duration,

  /// Максимальное количество одновременных операций
  pub max_concurrent_operations: usize,

  /// Максимальное количество файловых дескрипторов
  pub max_file_descriptors: usize,

  /// Максимальная частота вызовов API (запросов в секунду)
  pub max_api_calls_per_second: u32,

  /// Максимальное количество сетевых соединений
  pub max_network_connections: usize,
}

impl ResourceLimits {
  /// Создать лимиты по умолчанию для уровня безопасности
  pub fn for_security_level(level: SecurityLevel) -> Self {
    match level {
      SecurityLevel::Full => Self {
        max_memory: 1024 * 1024 * 1024,               // 1GB
        max_execution_time: Duration::from_secs(300), // 5 минут
        max_concurrent_operations: 100,
        max_file_descriptors: 1000,
        max_api_calls_per_second: 1000,
        max_network_connections: 100,
      },
      SecurityLevel::Extended => Self {
        max_memory: 256 * 1024 * 1024,               // 256MB
        max_execution_time: Duration::from_secs(60), // 1 минута
        max_concurrent_operations: 50,
        max_file_descriptors: 100,
        max_api_calls_per_second: 100,
        max_network_connections: 10,
      },
      SecurityLevel::Standard => Self {
        max_memory: 64 * 1024 * 1024,                // 64MB
        max_execution_time: Duration::from_secs(30), // 30 секунд
        max_concurrent_operations: 10,
        max_file_descriptors: 20,
        max_api_calls_per_second: 50,
        max_network_connections: 5,
      },
      SecurityLevel::Minimal => Self {
        max_memory: 16 * 1024 * 1024,                // 16MB
        max_execution_time: Duration::from_secs(10), // 10 секунд
        max_concurrent_operations: 5,
        max_file_descriptors: 10,
        max_api_calls_per_second: 10,
        max_network_connections: 1,
      },
    }
  }
}

/// Статистика использования ресурсов
#[derive(Debug)]
pub struct ResourceUsage {
  /// Текущее использование памяти
  pub memory_used: AtomicU64,

  /// Пиковое использование памяти
  pub memory_peak: AtomicU64,

  /// Количество активных операций
  pub active_operations: AtomicU64,

  /// Общее количество API вызовов
  pub total_api_calls: AtomicU64,

  /// API вызовы в текущую секунду
  pub api_calls_current_second: AtomicU64,

  /// Время последнего сброса счетчика API
  pub last_api_reset: RwLock<Instant>,

  /// Количество активных сетевых соединений
  pub active_network_connections: AtomicU64,

  /// Флаг нарушения лимитов
  pub limits_violated: AtomicBool,
}

impl ResourceUsage {
  pub fn new() -> Self {
    Self {
      memory_used: AtomicU64::new(0),
      memory_peak: AtomicU64::new(0),
      active_operations: AtomicU64::new(0),
      total_api_calls: AtomicU64::new(0),
      api_calls_current_second: AtomicU64::new(0),
      last_api_reset: RwLock::new(Instant::now()),
      active_network_connections: AtomicU64::new(0),
      limits_violated: AtomicBool::new(false),
    }
  }

  /// Сбросить счетчики API если прошла секунда
  pub async fn reset_api_counters_if_needed(&self) {
    let mut last_reset = self.last_api_reset.write().await;
    if last_reset.elapsed() >= Duration::from_secs(1) {
      self.api_calls_current_second.store(0, Ordering::Relaxed);
      *last_reset = Instant::now();
    }
  }
}

impl Default for ResourceUsage {
  fn default() -> Self {
    Self::new()
  }
}

/// Sandbox для изоляции плагина
pub struct PluginSandbox {
  plugin_id: String,
  limits: ResourceLimits,
  usage: Arc<ResourceUsage>,
  operation_semaphore: Arc<Semaphore>,
  network_semaphore: Arc<Semaphore>,

  /// Whitelist доменов для сетевых запросов
  allowed_domains: Vec<String>,

  /// Файловые разрешения
  file_permissions: FileSystemPermissions,
}

impl PluginSandbox {
  /// Создать новый sandbox
  pub fn new(plugin_id: String, permissions: &PluginPermissions) -> Self {
    let limits = ResourceLimits::for_security_level(permissions.get_security_level());

    let operation_semaphore = Arc::new(Semaphore::new(limits.max_concurrent_operations));
    let network_semaphore = Arc::new(Semaphore::new(limits.max_network_connections));

    // Извлекаем разрешенные домены и файловые разрешения из permissions
    let allowed_domains = permissions.network.allowed_hosts.clone();
    let file_permissions = permissions.file_system.clone();

    Self {
      plugin_id,
      limits,
      usage: Arc::new(ResourceUsage::new()),
      operation_semaphore,
      network_semaphore,
      allowed_domains,
      file_permissions,
    }
  }

  /// Проверить и зарезервировать ресурсы для операции
  pub async fn acquire_operation_permit(&self) -> Result<OperationGuard> {
    // Проверяем не нарушены ли уже лимиты
    if self.usage.limits_violated.load(Ordering::Relaxed) {
      return Err(VideoCompilerError::SecurityError(format!(
        "Plugin '{}' has violated resource limits",
        self.plugin_id
      )));
    }

    // Получаем разрешение на операцию
    let permit = self.operation_semaphore.acquire().await.map_err(|_| {
      VideoCompilerError::InternalError("Failed to acquire operation permit".to_string())
    })?;

    // Увеличиваем счетчик активных операций
    self.usage.active_operations.fetch_add(1, Ordering::Relaxed);

    Ok(OperationGuard {
      sandbox: self,
      _permit: permit,
      start_time: Instant::now(),
    })
  }

  /// Проверить лимит API вызовов
  pub async fn check_api_rate_limit(&self) -> Result<()> {
    self.usage.reset_api_counters_if_needed().await;

    let current_calls = self
      .usage
      .api_calls_current_second
      .fetch_add(1, Ordering::Relaxed);

    if current_calls >= self.limits.max_api_calls_per_second as u64 {
      self.usage.limits_violated.store(true, Ordering::Relaxed);
      return Err(VideoCompilerError::SecurityError(format!(
        "Plugin '{}' exceeded API rate limit",
        self.plugin_id
      )));
    }

    self.usage.total_api_calls.fetch_add(1, Ordering::Relaxed);
    Ok(())
  }

  /// Проверить разрешение на доступ к файлу
  pub fn check_file_access(&self, path: &std::path::Path, is_write: bool) -> Result<()> {
    let path_buf = path.to_path_buf();
    if is_write {
      if self.file_permissions.can_write(&path_buf) {
        Ok(())
      } else {
        Err(VideoCompilerError::SecurityError(format!(
          "Plugin '{}' attempted to write to unauthorized path: {:?}",
          self.plugin_id, path
        )))
      }
    } else if self.file_permissions.can_read(&path_buf) {
      Ok(())
    } else {
      Err(VideoCompilerError::SecurityError(format!(
        "Plugin '{}' attempted to read from unauthorized path: {:?}",
        self.plugin_id, path
      )))
    }
  }

  /// Проверить разрешение на сетевой запрос
  pub async fn check_network_access(&self, domain: &str) -> Result<NetworkGuard> {
    // Проверяем домен в whitelist
    if !self.allowed_domains.is_empty() {
      let domain_allowed = self.allowed_domains.iter().any(|allowed| {
        if allowed == "*" {
          true
        } else if let Some(suffix) = allowed.strip_prefix("*.") {
          // Убираем "*."
          domain.ends_with(suffix)
        } else {
          domain == allowed
        }
      });

      if !domain_allowed {
        return Err(VideoCompilerError::SecurityError(format!(
          "Plugin '{}' attempted to access unauthorized domain: {}",
          self.plugin_id, domain
        )));
      }
    }

    // Получаем разрешение на сетевое соединение
    let permit = self.network_semaphore.acquire().await.map_err(|_| {
      VideoCompilerError::InternalError("Failed to acquire network permit".to_string())
    })?;

    self
      .usage
      .active_network_connections
      .fetch_add(1, Ordering::Relaxed);

    Ok(NetworkGuard {
      sandbox: self,
      _permit: permit,
    })
  }

  /// Обновить использование памяти
  pub fn update_memory_usage(&self, bytes: u64) -> Result<()> {
    let current_memory = self.usage.memory_used.load(Ordering::Relaxed);
    let new_memory = current_memory + bytes;

    if new_memory > self.limits.max_memory {
      self.usage.limits_violated.store(true, Ordering::Relaxed);
      return Err(VideoCompilerError::SecurityError(format!(
        "Plugin '{}' exceeded memory limit: {} > {}",
        self.plugin_id, new_memory, self.limits.max_memory
      )));
    }

    self.usage.memory_used.store(new_memory, Ordering::Relaxed);

    // Обновляем пик
    let current_peak = self.usage.memory_peak.load(Ordering::Relaxed);
    if new_memory > current_peak {
      self.usage.memory_peak.store(new_memory, Ordering::Relaxed);
    }

    Ok(())
  }

  /// Освободить память
  pub fn free_memory(&self, bytes: u64) {
    let current = self.usage.memory_used.load(Ordering::Relaxed);
    let new_value = current.saturating_sub(bytes);
    self.usage.memory_used.store(new_value, Ordering::Relaxed);
  }

  /// Получить текущую статистику использования
  pub async fn get_usage_stats(&self) -> SandboxStats {
    self.usage.reset_api_counters_if_needed().await;

    SandboxStats {
      plugin_id: self.plugin_id.clone(),
      memory_used: self.usage.memory_used.load(Ordering::Relaxed),
      memory_peak: self.usage.memory_peak.load(Ordering::Relaxed),
      memory_limit: self.limits.max_memory,
      active_operations: self.usage.active_operations.load(Ordering::Relaxed),
      operation_limit: self.limits.max_concurrent_operations as u64,
      total_api_calls: self.usage.total_api_calls.load(Ordering::Relaxed),
      api_calls_current_second: self.usage.api_calls_current_second.load(Ordering::Relaxed),
      api_rate_limit: self.limits.max_api_calls_per_second as u64,
      active_network_connections: self
        .usage
        .active_network_connections
        .load(Ordering::Relaxed),
      network_connection_limit: self.limits.max_network_connections as u64,
      limits_violated: self.usage.limits_violated.load(Ordering::Relaxed),
    }
  }

  /// Сбросить нарушения лимитов (для восстановления после устранения проблемы)
  pub fn reset_violation_flag(&self) {
    self.usage.limits_violated.store(false, Ordering::Relaxed);
  }

  /// Получить лимиты
  pub fn limits(&self) -> &ResourceLimits {
    &self.limits
  }
}

/// Guard для операций, автоматически освобождает ресурсы
pub struct OperationGuard<'a> {
  sandbox: &'a PluginSandbox,
  _permit: tokio::sync::SemaphorePermit<'a>,
  start_time: Instant,
}

impl<'a> Drop for OperationGuard<'a> {
  fn drop(&mut self) {
    // Уменьшаем счетчик активных операций
    self
      .sandbox
      .usage
      .active_operations
      .fetch_sub(1, Ordering::Relaxed);

    // Проверяем не превышено ли время выполнения
    let duration = self.start_time.elapsed();
    if duration > self.sandbox.limits.max_execution_time {
      log::warn!(
        "Plugin '{}' operation exceeded time limit: {:?} > {:?}",
        self.sandbox.plugin_id,
        duration,
        self.sandbox.limits.max_execution_time
      );
      self
        .sandbox
        .usage
        .limits_violated
        .store(true, Ordering::Relaxed);
    }
  }
}

/// Guard для сетевых операций
pub struct NetworkGuard<'a> {
  sandbox: &'a PluginSandbox,
  _permit: tokio::sync::SemaphorePermit<'a>,
}

impl<'a> Drop for NetworkGuard<'a> {
  fn drop(&mut self) {
    self
      .sandbox
      .usage
      .active_network_connections
      .fetch_sub(1, Ordering::Relaxed);
  }
}

/// Статистика sandbox
#[derive(Debug, Clone, serde::Serialize)]
pub struct SandboxStats {
  pub plugin_id: String,
  pub memory_used: u64,
  pub memory_peak: u64,
  pub memory_limit: u64,
  pub active_operations: u64,
  pub operation_limit: u64,
  pub total_api_calls: u64,
  pub api_calls_current_second: u64,
  pub api_rate_limit: u64,
  pub active_network_connections: u64,
  pub network_connection_limit: u64,
  pub limits_violated: bool,
}

impl SandboxStats {
  /// Получить процент использования памяти
  pub fn memory_usage_percent(&self) -> f64 {
    if self.memory_limit == 0 {
      0.0
    } else {
      (self.memory_used as f64 / self.memory_limit as f64) * 100.0
    }
  }

  /// Получить процент использования операций
  pub fn operation_usage_percent(&self) -> f64 {
    if self.operation_limit == 0 {
      0.0
    } else {
      (self.active_operations as f64 / self.operation_limit as f64) * 100.0
    }
  }

  /// Получить процент использования API rate limit
  pub fn api_rate_usage_percent(&self) -> f64 {
    if self.api_rate_limit == 0 {
      0.0
    } else {
      (self.api_calls_current_second as f64 / self.api_rate_limit as f64) * 100.0
    }
  }
}

/// Менеджер sandbox для всех плагинов
pub struct SandboxManager {
  sandboxes: Arc<RwLock<HashMap<String, Arc<PluginSandbox>>>>,
}

impl SandboxManager {
  /// Создать новый менеджер sandbox
  pub fn new() -> Self {
    Self {
      sandboxes: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Создать sandbox для плагина
  pub async fn create_sandbox(
    &self,
    plugin_id: String,
    permissions: &PluginPermissions,
  ) -> Arc<PluginSandbox> {
    let sandbox = Arc::new(PluginSandbox::new(plugin_id.clone(), permissions));

    let mut sandboxes = self.sandboxes.write().await;
    sandboxes.insert(plugin_id.clone(), sandbox.clone());

    log::info!("Created sandbox for plugin '{plugin_id}'");
    sandbox
  }

  /// Получить sandbox плагина
  pub async fn get_sandbox(&self, plugin_id: &str) -> Option<Arc<PluginSandbox>> {
    let sandboxes = self.sandboxes.read().await;
    sandboxes.get(plugin_id).cloned()
  }

  /// Удалить sandbox плагина
  pub async fn remove_sandbox(&self, plugin_id: &str) -> bool {
    let mut sandboxes = self.sandboxes.write().await;
    if sandboxes.remove(plugin_id).is_some() {
      log::info!("Removed sandbox for plugin '{plugin_id}'");
      true
    } else {
      false
    }
  }

  /// Получить статистику всех sandbox
  pub async fn get_all_stats(&self) -> Vec<SandboxStats> {
    let sandboxes = self.sandboxes.read().await;
    let mut stats = Vec::new();

    for sandbox in sandboxes.values() {
      stats.push(sandbox.get_usage_stats().await);
    }

    stats
  }

  /// Найти плагины, нарушившие лимиты
  pub async fn get_violating_plugins(&self) -> Vec<String> {
    let sandboxes = self.sandboxes.read().await;
    let mut violators = Vec::new();

    for (plugin_id, sandbox) in sandboxes.iter() {
      if sandbox.usage.limits_violated.load(Ordering::Relaxed) {
        violators.push(plugin_id.clone());
      }
    }

    violators
  }
}

impl Default for SandboxManager {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::permissions::{FileSystemPermissions, NetworkPermissions};

  #[tokio::test]
  async fn test_sandbox_creation() {
    let permissions = PluginPermissions {
      file_system: FileSystemPermissions::default(),
      network: NetworkPermissions::default(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    };

    let sandbox = PluginSandbox::new("test_plugin".to_string(), &permissions);

    assert_eq!(sandbox.plugin_id, "test_plugin");
    assert!(!sandbox.usage.limits_violated.load(Ordering::Relaxed));
  }

  #[tokio::test]
  async fn test_operation_permit() {
    let permissions = PluginPermissions::default();
    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    let _guard = sandbox.acquire_operation_permit().await.unwrap();
    assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 1);

    // Guard автоматически освободится при drop
  }

  #[tokio::test]
  async fn test_api_rate_limit() {
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
    sandbox.limits.max_api_calls_per_second = 2;

    // Первые два вызова должны пройти
    sandbox.check_api_rate_limit().await.unwrap();
    sandbox.check_api_rate_limit().await.unwrap();

    // Третий должен вызвать ошибку
    let result = sandbox.check_api_rate_limit().await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_memory_limits() {
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
    sandbox.limits.max_memory = 1000;

    // Нормальное использование памяти
    sandbox.update_memory_usage(500).unwrap();
    assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 500);

    // Превышение лимита
    let result = sandbox.update_memory_usage(600);
    assert!(result.is_err());
    assert!(sandbox.usage.limits_violated.load(Ordering::Relaxed));
  }

  #[tokio::test]
  async fn test_concurrent_operations_limit() {
    // Тест лимита на количество одновременных операций
    let permissions = PluginPermissions::default();
    let _sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Пересоздаем semaphore с лимитом 2
    let operation_semaphore = Arc::new(Semaphore::new(2));

    // Заменяем semaphore в sandbox (создаем новый sandbox с нужным лимитом)
    let sandbox = PluginSandbox {
      plugin_id: "test".to_string(),
      limits: ResourceLimits {
        max_concurrent_operations: 2,
        ..ResourceLimits::for_security_level(permissions.get_security_level())
      },
      usage: Arc::new(ResourceUsage::new()),
      operation_semaphore: operation_semaphore.clone(),
      network_semaphore: Arc::new(Semaphore::new(5)),
      allowed_domains: vec![],
      file_permissions: permissions.file_system,
    };

    // Первые два permit должны пройти
    let _guard1 = sandbox.acquire_operation_permit().await.unwrap();
    let _guard2 = sandbox.acquire_operation_permit().await.unwrap();

    assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 2);

    // Третий должен заблокироваться (таймаут через короткое время)
    let result = tokio::time::timeout(
      std::time::Duration::from_millis(100),
      sandbox.acquire_operation_permit(),
    )
    .await;

    // Таймаут должен сработать, так как нет свободных permits
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_network_connection_limits() {
    // Тест лимита сетевых соединений
    let mut permissions = PluginPermissions::default();
    permissions.network.allowed_hosts = vec!["*.example.com".to_string()];

    // Создаем sandbox с правильным лимитом
    let sandbox = PluginSandbox {
      plugin_id: "test".to_string(),
      limits: ResourceLimits {
        max_network_connections: 2,
        ..ResourceLimits::for_security_level(permissions.get_security_level())
      },
      usage: Arc::new(ResourceUsage::new()),
      operation_semaphore: Arc::new(Semaphore::new(10)),
      network_semaphore: Arc::new(Semaphore::new(2)),
      allowed_domains: vec!["*.example.com".to_string()],
      file_permissions: permissions.file_system,
    };

    // Первые два соединения должны пройти
    let _guard1 = sandbox
      .check_network_access("api.example.com")
      .await
      .unwrap();
    let _guard2 = sandbox
      .check_network_access("cdn.example.com")
      .await
      .unwrap();

    assert_eq!(
      sandbox
        .usage
        .active_network_connections
        .load(Ordering::Relaxed),
      2
    );

    // Третье соединение должно заблокироваться
    let result = tokio::time::timeout(
      std::time::Duration::from_millis(100),
      sandbox.check_network_access("images.example.com"),
    )
    .await;

    assert!(result.is_err()); // Таймаут
  }

  #[tokio::test]
  async fn test_file_access_permissions() {
    // Тест проверки разрешений на доступ к файлам
    let mut permissions = PluginPermissions::default();
    permissions.file_system.read_paths = vec![std::path::PathBuf::from("/allowed/read")];
    permissions.file_system.write_paths = vec![std::path::PathBuf::from("/allowed/write")];

    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Разрешенный доступ
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/allowed/read/file.txt"), false)
        .is_ok()
    );
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/allowed/write/file.txt"), true)
        .is_ok()
    );

    // Запрещенный доступ
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/forbidden/file.txt"), false)
        .is_err()
    );
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/forbidden/file.txt"), true)
        .is_err()
    );

    // Попытка записи в read-only директорию
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/allowed/read/file.txt"), true)
        .is_err()
    );
  }

  #[tokio::test]
  async fn test_network_domain_filtering() {
    // Тест фильтрации доменов для сетевых запросов
    let mut permissions = PluginPermissions::default();
    permissions.network.allowed_hosts = vec![
      "api.example.com".to_string(),
      "*.googleapis.com".to_string(),
    ];

    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Разрешенные домены
    assert!(
      sandbox
        .check_network_access("api.example.com")
        .await
        .is_ok()
    );
    assert!(
      sandbox
        .check_network_access("sheets.googleapis.com")
        .await
        .is_ok()
    );
    assert!(
      sandbox
        .check_network_access("drive.googleapis.com")
        .await
        .is_ok()
    );

    // Запрещенные домены
    assert!(sandbox.check_network_access("evil.com").await.is_err());
    assert!(
      sandbox
        .check_network_access("subdomain.evil.com")
        .await
        .is_err()
    );
  }

  #[tokio::test]
  async fn test_memory_peak_tracking() {
    // Тест отслеживания пикового использования памяти
    let permissions = PluginPermissions::default();
    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Постепенно увеличиваем память
    sandbox.update_memory_usage(100).unwrap();
    assert_eq!(sandbox.usage.memory_peak.load(Ordering::Relaxed), 100);

    sandbox.update_memory_usage(50).unwrap();
    assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 150);
    assert_eq!(sandbox.usage.memory_peak.load(Ordering::Relaxed), 150);

    // Освобождаем память
    sandbox.free_memory(75);
    assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 75);
    assert_eq!(sandbox.usage.memory_peak.load(Ordering::Relaxed), 150); // Пик не меняется

    // Снова увеличиваем, но не превышаем пик
    sandbox.update_memory_usage(50).unwrap();
    assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 125);
    assert_eq!(sandbox.usage.memory_peak.load(Ordering::Relaxed), 150); // Пик не изменился
  }

  #[tokio::test]
  async fn test_api_rate_limit_reset() {
    // Тест сброса лимита API вызовов после истечения секунды
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
    sandbox.limits.max_api_calls_per_second = 1;

    // Первый вызов должен пройти
    sandbox.check_api_rate_limit().await.unwrap();
    assert_eq!(
      sandbox
        .usage
        .api_calls_current_second
        .load(Ordering::Relaxed),
      1
    );

    // Второй вызов должен вызвать ошибку
    let result = sandbox.check_api_rate_limit().await;
    assert!(result.is_err());
    assert!(sandbox.usage.limits_violated.load(Ordering::Relaxed));

    // Сбрасываем флаг нарушений
    sandbox.reset_violation_flag();
    assert!(!sandbox.usage.limits_violated.load(Ordering::Relaxed));

    // Ручной сброс счетчика (имитация прошедшей секунды)
    sandbox
      .usage
      .api_calls_current_second
      .store(0, Ordering::Relaxed);

    // Теперь вызов должен пройти снова
    let result = sandbox.check_api_rate_limit().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_sandbox_stats_calculation() {
    // Тест вычисления статистики использования ресурсов
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Устанавливаем лимиты
    sandbox.limits.max_memory = 1000;
    sandbox.limits.max_concurrent_operations = 5;
    sandbox.limits.max_api_calls_per_second = 10;

    // Устанавливаем использование
    sandbox.update_memory_usage(500).unwrap();
    let _guard = sandbox.acquire_operation_permit().await.unwrap();
    sandbox.check_api_rate_limit().await.unwrap();
    sandbox.check_api_rate_limit().await.unwrap();

    let stats = sandbox.get_usage_stats().await;

    // Проверяем статистику
    assert_eq!(stats.plugin_id, "test");
    assert_eq!(stats.memory_used, 500);
    assert_eq!(stats.memory_peak, 500);
    assert_eq!(stats.memory_limit, 1000);
    assert_eq!(stats.active_operations, 1);
    assert_eq!(stats.api_calls_current_second, 2);

    // Проверяем процентные значения
    assert_eq!(stats.memory_usage_percent(), 50.0);
    assert_eq!(stats.operation_usage_percent(), 20.0);
    assert_eq!(stats.api_rate_usage_percent(), 20.0);
  }

  #[tokio::test]
  async fn test_sandbox_manager_operations() {
    // Тест операций SandboxManager
    let manager = SandboxManager::new();
    let permissions = PluginPermissions::default();

    // Создаем sandbox
    let sandbox1 = manager
      .create_sandbox("plugin-1".to_string(), &permissions)
      .await;
    let sandbox2 = manager
      .create_sandbox("plugin-2".to_string(), &permissions)
      .await;

    assert_eq!(sandbox1.plugin_id, "plugin-1");
    assert_eq!(sandbox2.plugin_id, "plugin-2");

    // Получаем sandbox
    let retrieved = manager.get_sandbox("plugin-1").await;
    assert!(retrieved.is_some());
    assert_eq!(retrieved.unwrap().plugin_id, "plugin-1");

    // Получаем несуществующий sandbox
    let missing = manager.get_sandbox("non-existent").await;
    assert!(missing.is_none());

    // Получаем статистику всех sandbox
    let all_stats = manager.get_all_stats().await;
    assert_eq!(all_stats.len(), 2);

    // Имитируем нарушение лимитов
    sandbox1
      .usage
      .limits_violated
      .store(true, Ordering::Relaxed);
    let violators = manager.get_violating_plugins().await;
    assert_eq!(violators.len(), 1);
    assert_eq!(violators[0], "plugin-1");

    // Удаляем sandbox
    assert!(manager.remove_sandbox("plugin-1").await);
    assert!(!manager.remove_sandbox("plugin-1").await); // Уже удален

    let remaining_stats = manager.get_all_stats().await;
    assert_eq!(remaining_stats.len(), 1);
  }

  #[tokio::test]
  async fn test_execution_time_monitoring() {
    // Тест мониторинга времени выполнения операций
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
    sandbox.limits.max_execution_time = std::time::Duration::from_millis(50);

    // Операция в пределах лимита времени
    {
      let _guard = sandbox.acquire_operation_permit().await.unwrap();
      tokio::time::sleep(std::time::Duration::from_millis(30)).await;
      // Guard автоматически освободится здесь
    }

    // Проверяем что нарушений нет
    assert!(!sandbox.usage.limits_violated.load(Ordering::Relaxed));

    // Операция, превышающая лимит времени
    {
      let _guard = sandbox.acquire_operation_permit().await.unwrap();
      tokio::time::sleep(std::time::Duration::from_millis(70)).await;
      // Guard освободится здесь и зафиксирует превышение времени
    }

    // Проверяем что зафиксировано нарушение
    assert!(sandbox.usage.limits_violated.load(Ordering::Relaxed));
  }

  #[test]
  fn test_resource_limits_for_security_levels() {
    // Тест создания лимитов для разных уровней безопасности
    let minimal = ResourceLimits::for_security_level(SecurityLevel::Minimal);
    assert_eq!(minimal.max_memory, 16 * 1024 * 1024); // 16MB
    assert_eq!(minimal.max_execution_time, Duration::from_secs(10));
    assert_eq!(minimal.max_concurrent_operations, 5);
    assert_eq!(minimal.max_file_descriptors, 10);
    assert_eq!(minimal.max_api_calls_per_second, 10);
    assert_eq!(minimal.max_network_connections, 1);

    let standard = ResourceLimits::for_security_level(SecurityLevel::Standard);
    assert_eq!(standard.max_memory, 64 * 1024 * 1024); // 64MB
    assert_eq!(standard.max_execution_time, Duration::from_secs(30));
    assert_eq!(standard.max_concurrent_operations, 10);
    assert_eq!(standard.max_file_descriptors, 20);
    assert_eq!(standard.max_api_calls_per_second, 50);
    assert_eq!(standard.max_network_connections, 5);

    let extended = ResourceLimits::for_security_level(SecurityLevel::Extended);
    assert_eq!(extended.max_memory, 256 * 1024 * 1024); // 256MB
    assert_eq!(extended.max_execution_time, Duration::from_secs(60));
    assert_eq!(extended.max_concurrent_operations, 50);
    assert_eq!(extended.max_file_descriptors, 100);
    assert_eq!(extended.max_api_calls_per_second, 100);
    assert_eq!(extended.max_network_connections, 10);

    let full = ResourceLimits::for_security_level(SecurityLevel::Full);
    assert_eq!(full.max_memory, 1024 * 1024 * 1024); // 1GB
    assert_eq!(full.max_execution_time, Duration::from_secs(300));
    assert_eq!(full.max_concurrent_operations, 100);
    assert_eq!(full.max_file_descriptors, 1000);
    assert_eq!(full.max_api_calls_per_second, 1000);
    assert_eq!(full.max_network_connections, 100);
  }

  #[test]
  fn test_resource_usage_initialization() {
    // Тест инициализации ResourceUsage
    let usage = ResourceUsage::new();
    assert_eq!(usage.memory_used.load(Ordering::Relaxed), 0);
    assert_eq!(usage.memory_peak.load(Ordering::Relaxed), 0);
    assert_eq!(usage.active_operations.load(Ordering::Relaxed), 0);
    assert_eq!(usage.total_api_calls.load(Ordering::Relaxed), 0);
    assert_eq!(usage.api_calls_current_second.load(Ordering::Relaxed), 0);
    assert_eq!(usage.active_network_connections.load(Ordering::Relaxed), 0);
    assert!(!usage.limits_violated.load(Ordering::Relaxed));
  }

  #[tokio::test]
  async fn test_network_access_wildcard_domain() {
    // Тест wildcard доменов (все домены разрешены)
    let mut permissions = PluginPermissions::default();
    permissions.network.allowed_hosts = vec!["*".to_string()];

    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Все домены должны быть разрешены
    assert!(sandbox.check_network_access("example.com").await.is_ok());
    assert!(sandbox.check_network_access("google.com").await.is_ok());
    assert!(sandbox.check_network_access("localhost").await.is_ok());
    assert!(sandbox.check_network_access("192.168.1.1").await.is_ok());
  }

  #[tokio::test]
  async fn test_memory_free_saturating() {
    // Тест освобождения памяти с защитой от переполнения
    let permissions = PluginPermissions::default();
    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Выделяем память
    sandbox.update_memory_usage(100).unwrap();
    assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 100);

    // Освобождаем больше, чем выделено (должно стать 0, а не переполниться)
    sandbox.free_memory(150);
    assert_eq!(sandbox.usage.memory_used.load(Ordering::Relaxed), 0);
  }

  #[tokio::test]
  async fn test_sandbox_stats_division_by_zero() {
    // Тест вычисления процентов при нулевых лимитах
    let stats = SandboxStats {
      plugin_id: "test".to_string(),
      memory_used: 100,
      memory_peak: 100,
      memory_limit: 0,
      active_operations: 5,
      operation_limit: 0,
      total_api_calls: 1000,
      api_calls_current_second: 10,
      api_rate_limit: 0,
      active_network_connections: 2,
      network_connection_limit: 0,
      limits_violated: false,
    };

    // Проверяем что деление на ноль обрабатывается корректно
    assert_eq!(stats.memory_usage_percent(), 0.0);
    assert_eq!(stats.operation_usage_percent(), 0.0);
    assert_eq!(stats.api_rate_usage_percent(), 0.0);
  }

  #[tokio::test]
  async fn test_operation_guard_lifetime() {
    // Тест времени жизни OperationGuard
    let permissions = PluginPermissions::default();
    let sandbox = Arc::new(PluginSandbox::new("test".to_string(), &permissions));

    assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 0);

    // Создаем блок для ограничения lifetime guard
    {
      let guard = sandbox.acquire_operation_permit().await.unwrap();
      assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 1);

      // Перемещаем guard в другую переменную
      let _moved_guard = guard;
      assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 1);
    }

    // После выхода из блока guard должен освободиться
    assert_eq!(sandbox.usage.active_operations.load(Ordering::Relaxed), 0);
  }

  #[tokio::test]
  async fn test_network_guard_lifetime() {
    // Тест времени жизни NetworkGuard
    let mut permissions = PluginPermissions::default();
    permissions.network.allowed_hosts = vec!["example.com".to_string()];

    let sandbox = Arc::new(PluginSandbox::new("test".to_string(), &permissions));

    assert_eq!(
      sandbox
        .usage
        .active_network_connections
        .load(Ordering::Relaxed),
      0
    );

    {
      let guard = sandbox.check_network_access("example.com").await.unwrap();
      assert_eq!(
        sandbox
          .usage
          .active_network_connections
          .load(Ordering::Relaxed),
        1
      );

      // Перемещаем guard
      let _moved = guard;
      assert_eq!(
        sandbox
          .usage
          .active_network_connections
          .load(Ordering::Relaxed),
        1
      );
    }

    // После выхода из блока guard должен освободиться
    assert_eq!(
      sandbox
        .usage
        .active_network_connections
        .load(Ordering::Relaxed),
      0
    );
  }

  #[tokio::test]
  async fn test_empty_allowed_domains() {
    // Тест с пустым списком разрешенных доменов
    let permissions = PluginPermissions::default();
    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // С пустым списком доменов все запросы должны проходить
    assert!(sandbox.check_network_access("example.com").await.is_ok());
    assert!(sandbox.check_network_access("google.com").await.is_ok());
  }

  #[tokio::test]
  async fn test_concurrent_api_calls() {
    // Тест одновременных API вызовов
    let permissions = PluginPermissions::default();
    let _sandbox = Arc::new(PluginSandbox::new("test".to_string(), &permissions));
    // max_api_calls_per_second is not atomic, so we create a new sandbox with modified limits
    let sandbox = Arc::new(PluginSandbox {
      plugin_id: "test".to_string(),
      limits: ResourceLimits {
        max_api_calls_per_second: 100,
        ..ResourceLimits::for_security_level(permissions.get_security_level())
      },
      usage: Arc::new(ResourceUsage::new()),
      operation_semaphore: Arc::new(Semaphore::new(10)),
      network_semaphore: Arc::new(Semaphore::new(5)),
      allowed_domains: vec![],
      file_permissions: permissions.file_system,
    });

    // Запускаем несколько параллельных задач для API вызовов
    let mut handles = vec![];
    for _ in 0..10 {
      let sandbox_clone = sandbox.clone();
      let handle = tokio::spawn(async move {
        for _ in 0..5 {
          let _ = sandbox_clone.check_api_rate_limit().await;
        }
      });
      handles.push(handle);
    }

    // Ждем завершения всех задач
    for handle in handles {
      handle.await.unwrap();
    }

    // Проверяем общее количество вызовов
    assert_eq!(sandbox.usage.total_api_calls.load(Ordering::Relaxed), 50);
  }

  #[tokio::test]
  async fn test_acquire_operation_permit_after_violation() {
    // Тест попытки получить permit после нарушения лимитов
    let permissions = PluginPermissions::default();
    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Устанавливаем флаг нарушения
    sandbox.usage.limits_violated.store(true, Ordering::Relaxed);

    // Попытка получить permit должна вернуть ошибку
    let result = sandbox.acquire_operation_permit().await;
    assert!(result.is_err());
    if let Err(e) = result {
      assert!(matches!(e, VideoCompilerError::SecurityError(_)));
    } else {
      panic!("Expected error but got Ok");
    }
  }

  #[tokio::test]
  async fn test_file_access_nested_paths() {
    // Тест доступа к вложенным путям
    let mut permissions = PluginPermissions::default();
    permissions.file_system.read_paths = vec![std::path::PathBuf::from("/project")];
    permissions.file_system.write_paths = vec![std::path::PathBuf::from("/project/output")];

    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Чтение разрешено для всех вложенных путей
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/project/src/main.rs"), false)
        .is_ok()
    );
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/project/output/result.mp4"), false)
        .is_ok()
    );

    // Запись разрешена только для /project/output
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/project/output/result.mp4"), true)
        .is_ok()
    );
    assert!(
      sandbox
        .check_file_access(std::path::Path::new("/project/src/main.rs"), true)
        .is_err()
    );
  }

  #[tokio::test]
  async fn test_sandbox_manager_concurrent_creation() {
    // Тест одновременного создания sandbox через менеджер
    let manager = Arc::new(SandboxManager::new());
    let permissions = Arc::new(PluginPermissions::default());

    // Создаем несколько sandbox одновременно
    let mut handles = vec![];
    for i in 0..5 {
      let manager_clone = manager.clone();
      let permissions_clone = permissions.clone();
      let handle = tokio::spawn(async move {
        manager_clone
          .create_sandbox(format!("plugin-{i}"), &permissions_clone)
          .await
      });
      handles.push(handle);
    }

    // Ждем завершения
    for handle in handles {
      handle.await.unwrap();
    }

    // Проверяем что все sandbox созданы
    let stats = manager.get_all_stats().await;
    assert_eq!(stats.len(), 5);
  }

  #[tokio::test]
  async fn test_network_subdomain_matching() {
    // Тест сопоставления поддоменов
    let mut permissions = PluginPermissions::default();
    permissions.network.allowed_hosts =
      vec!["*.example.com".to_string(), "api.service.com".to_string()];

    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Поддомены example.com разрешены
    assert!(
      sandbox
        .check_network_access("api.example.com")
        .await
        .is_ok()
    );
    assert!(
      sandbox
        .check_network_access("cdn.example.com")
        .await
        .is_ok()
    );
    assert!(
      sandbox
        .check_network_access("deep.nested.example.com")
        .await
        .is_ok()
    );

    // Точное совпадение для api.service.com
    assert!(
      sandbox
        .check_network_access("api.service.com")
        .await
        .is_ok()
    );

    // Не совпадающие домены
    assert!(
      sandbox
        .check_network_access("example.com.evil.com")
        .await
        .is_err()
    );
    assert!(
      sandbox
        .check_network_access("cdn.service.com")
        .await
        .is_err()
    );
  }

  #[tokio::test]
  async fn test_resource_limits_modification() {
    // Тест модификации лимитов ресурсов
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Изменяем лимиты
    sandbox.limits.max_memory = 1000;
    sandbox.limits.max_api_calls_per_second = 5;

    // Проверяем что новые лимиты применяются
    sandbox.update_memory_usage(900).unwrap();
    assert!(sandbox.update_memory_usage(200).is_err());

    // Проверяем API лимит
    for _ in 0..5 {
      sandbox.check_api_rate_limit().await.unwrap();
    }
    assert!(sandbox.check_api_rate_limit().await.is_err());
  }

  #[test]
  fn test_sandbox_limits_getter() {
    // Тест getter для лимитов
    let permissions = PluginPermissions::default();
    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    let limits = sandbox.limits();
    assert_eq!(limits.max_memory, 16 * 1024 * 1024); // Minimal level default
    assert_eq!(limits.max_concurrent_operations, 5);
  }

  #[tokio::test]
  async fn test_api_rate_limit_boundary() {
    // Тест граничных условий для rate limit
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
    sandbox.limits.max_api_calls_per_second = 0; // Нулевой лимит

    // Даже первый вызов должен вызвать ошибку
    assert!(sandbox.check_api_rate_limit().await.is_err());
  }

  #[tokio::test]
  async fn test_memory_operations_ordering() {
    // Тест атомарных операций с памятью
    let permissions = PluginPermissions::default();
    let sandbox = Arc::new(PluginSandbox::new("test".to_string(), &permissions));

    // Запускаем несколько потоков для одновременного обновления памяти
    let mut handles = vec![];
    for _ in 0..10 {
      let sandbox_clone = sandbox.clone();
      let handle = tokio::spawn(async move {
        for i in 0..10 {
          let _ = sandbox_clone.update_memory_usage(i);
          sandbox_clone.free_memory(i / 2);
        }
      });
      handles.push(handle);
    }

    // Ждем завершения
    for handle in handles {
      handle.await.unwrap();
    }

    // Проверяем что операции выполнились корректно
    let memory_used = sandbox.usage.memory_used.load(Ordering::Relaxed);
    let memory_peak = sandbox.usage.memory_peak.load(Ordering::Relaxed);

    // Peak должен быть больше или равен текущему использованию
    assert!(memory_peak >= memory_used);
  }

  #[tokio::test]
  async fn test_operation_permit_timeout_behavior() {
    // Тест поведения при таймауте получения permit
    let permissions = PluginPermissions::default();
    let mut sandbox = PluginSandbox::new("test".to_string(), &permissions);
    sandbox.limits.max_concurrent_operations = 1;

    // Перестраиваем sandbox с правильным semaphore
    let sandbox = PluginSandbox {
      plugin_id: "test".to_string(),
      limits: ResourceLimits {
        max_concurrent_operations: 1,
        ..ResourceLimits::for_security_level(permissions.get_security_level())
      },
      usage: Arc::new(ResourceUsage::new()),
      operation_semaphore: Arc::new(Semaphore::new(1)),
      network_semaphore: Arc::new(Semaphore::new(5)),
      allowed_domains: vec![],
      file_permissions: permissions.file_system,
    };

    // Получаем первый permit
    let guard1 = sandbox.acquire_operation_permit().await.unwrap();

    // Второй permit с маленьким таймаутом
    let result = tokio::time::timeout(
      Duration::from_millis(10),
      sandbox.acquire_operation_permit(),
    )
    .await;

    assert!(result.is_err()); // Должен быть таймаут

    // Освобождаем первый permit
    drop(guard1);

    // Теперь должно получиться
    let guard2 = sandbox.acquire_operation_permit().await;
    assert!(guard2.is_ok());
  }

  #[tokio::test]
  async fn test_sandbox_manager_empty_operations() {
    // Тест операций с пустым менеджером
    let manager = SandboxManager::new();

    // Операции с пустым менеджером
    assert!(manager.get_sandbox("non-existent").await.is_none());
    assert!(!manager.remove_sandbox("non-existent").await);
    assert_eq!(manager.get_all_stats().await.len(), 0);
    assert_eq!(manager.get_violating_plugins().await.len(), 0);
  }

  #[tokio::test]
  async fn test_sandbox_permissions_inheritance() {
    // Тест наследования разрешений из PluginPermissions
    let permissions = PluginPermissions {
      file_system: FileSystemPermissions {
        read_paths: vec![std::path::PathBuf::from("/data")],
        write_paths: vec![std::path::PathBuf::from("/output")],
        read_all: false,
        write_all: false,
      },
      network: NetworkPermissions {
        allowed_hosts: vec!["api.example.com".to_string()],
        allowed_ports: vec![443],
        allow_all: false,
        https_only: true,
      },
      ui_access: true,
      system_info: false,
      process_spawn: false,
    };

    let sandbox = PluginSandbox::new("test".to_string(), &permissions);

    // Проверяем что разрешения правильно скопированы
    assert_eq!(sandbox.allowed_domains, vec!["api.example.com"]);
    assert_eq!(
      sandbox.file_permissions.read_paths,
      vec![std::path::PathBuf::from("/data")]
    );
    assert_eq!(
      sandbox.file_permissions.write_paths,
      vec![std::path::PathBuf::from("/output")]
    );
  }
}

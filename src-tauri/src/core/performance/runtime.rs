//! Управление async runtime и worker pool для оптимизации производительности

use crate::video_compiler::error::{Result, VideoCompilerError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{RwLock, Semaphore};

/// Конфигурация runtime
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeConfig {
  /// Количество worker потоков
  pub worker_threads: Option<usize>,

  /// Максимальное количество blocking потоков
  pub max_blocking_threads: Option<usize>,

  /// Интервал проверки состояния потоков
  pub thread_keep_alive: Duration,

  /// Размер стека для потоков
  pub thread_stack_size: Option<usize>,

  /// Имя prefix для потоков
  pub thread_name_prefix: String,

  /// Конфигурация task pools
  pub task_pools: HashMap<String, TaskPoolConfig>,
}

impl Default for RuntimeConfig {
  fn default() -> Self {
    let cpu_count = num_cpus::get();
    let mut task_pools = HashMap::new();

    // CPU-intensive tasks (для видео обработки)
    task_pools.insert(
      "cpu_intensive".to_string(),
      TaskPoolConfig {
        max_concurrent_tasks: cpu_count,
        queue_size: Some(cpu_count * 4),
        priority: TaskPriority::High,
        timeout: Some(Duration::from_secs(300)), // 5 минут
      },
    );

    // IO-bound tasks (для файловых операций)
    task_pools.insert(
      "io_bound".to_string(),
      TaskPoolConfig {
        max_concurrent_tasks: cpu_count * 4,
        queue_size: Some(1000),
        priority: TaskPriority::Medium,
        timeout: Some(Duration::from_secs(60)),
      },
    );

    // Background tasks (для фоновых операций)
    task_pools.insert(
      "background".to_string(),
      TaskPoolConfig {
        max_concurrent_tasks: 2,
        queue_size: Some(100),
        priority: TaskPriority::Low,
        timeout: Some(Duration::from_secs(600)), // 10 минут
      },
    );

    Self {
      worker_threads: Some(cpu_count),
      max_blocking_threads: Some(512),
      thread_keep_alive: Duration::from_secs(60),
      thread_stack_size: Some(2 * 1024 * 1024), // 2MB
      thread_name_prefix: "timeline-studio".to_string(),
      task_pools,
    }
  }
}

/// Конфигурация task pool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskPoolConfig {
  /// Максимальное количество одновременных задач
  pub max_concurrent_tasks: usize,

  /// Размер очереди (None = неограниченная)
  pub queue_size: Option<usize>,

  /// Приоритет задач
  pub priority: TaskPriority,

  /// Timeout для задач
  pub timeout: Option<Duration>,
}

/// Приоритет задач
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

/// Результат выполнения задачи
#[derive(Debug)]
pub struct TaskResult<T> {
  pub result: Result<T>,
  pub duration: Duration,
  pub pool_name: String,
}

/// Worker pool для управления задачами
pub struct WorkerPool {
  name: String,
  semaphore: Arc<Semaphore>,
  config: TaskPoolConfig,
  stats: Arc<RwLock<PoolStats>>,
}

/// Статистика pool
#[derive(Debug, Default)]
pub struct PoolStats {
  pub total_tasks: u64,
  pub completed_tasks: u64,
  pub failed_tasks: u64,
  pub active_tasks: u64,
  pub queue_length: u64,
  pub avg_execution_time: Duration,
  pub last_activity: Option<Instant>,
}

impl WorkerPool {
  /// Создать новый worker pool
  pub fn new(name: String, config: TaskPoolConfig) -> Self {
    let semaphore = Arc::new(Semaphore::new(config.max_concurrent_tasks));

    Self {
      name,
      semaphore,
      config,
      stats: Arc::new(RwLock::new(PoolStats::default())),
    }
  }

  /// Выполнить задачу в pool
  pub async fn execute<F, R>(&self, task: F) -> TaskResult<R>
  where
    F: std::future::Future<Output = Result<R>> + Send + 'static,
    R: Send + 'static,
  {
    let start = Instant::now();

    // Обновляем статистику - добавляем задачу
    {
      let mut stats = self.stats.write().await;
      stats.total_tasks += 1;
      stats.active_tasks += 1;
      stats.last_activity = Some(start);
    }

    // Получаем permit
    let _permit = match self.semaphore.acquire().await {
      Ok(permit) => permit,
      Err(_) => {
        // Обновляем статистику перед возвратом ошибки
        {
          let mut stats = self.stats.write().await;
          stats.active_tasks -= 1;
          stats.failed_tasks += 1;
        }
        return TaskResult {
          result: Err(VideoCompilerError::InternalError(
            "Failed to acquire semaphore permit".to_string(),
          )),
          duration: start.elapsed(),
          pool_name: self.name.clone(),
        };
      }
    };

    // Выполняем задачу с timeout если настроен
    let result = if let Some(timeout) = self.config.timeout {
      match tokio::time::timeout(timeout, task).await {
        Ok(result) => result,
        Err(_) => Err(VideoCompilerError::TimeoutError(format!(
          "Task in pool '{}' timed out after {:?}",
          self.name, timeout
        ))),
      }
    } else {
      task.await
    };

    let duration = start.elapsed();

    // Обновляем статистику - завершаем задачу
    {
      let mut stats = self.stats.write().await;
      stats.active_tasks -= 1;

      match &result {
        Ok(_) => stats.completed_tasks += 1,
        Err(_) => stats.failed_tasks += 1,
      }

      // Обновляем среднее время выполнения
      let total_completed = stats.completed_tasks + stats.failed_tasks;
      if total_completed > 0 {
        let total_time =
          stats.avg_execution_time.as_nanos() * (total_completed - 1) as u128 + duration.as_nanos();
        stats.avg_execution_time =
          Duration::from_nanos((total_time / total_completed as u128) as u64);
      }
    }

    TaskResult {
      result,
      duration,
      pool_name: self.name.clone(),
    }
  }

  /// Получить статистику pool
  pub async fn get_stats(&self) -> PoolStats {
    let stats = self.stats.read().await;
    PoolStats {
      total_tasks: stats.total_tasks,
      completed_tasks: stats.completed_tasks,
      failed_tasks: stats.failed_tasks,
      active_tasks: stats.active_tasks,
      queue_length: self.semaphore.available_permits() as u64,
      avg_execution_time: stats.avg_execution_time,
      last_activity: stats.last_activity,
    }
  }

  /// Получить имя pool
  pub fn name(&self) -> &str {
    &self.name
  }

  /// Получить конфигурацию
  pub fn config(&self) -> &TaskPoolConfig {
    &self.config
  }
}

/// Менеджер runtime и worker pools
pub struct RuntimeManager {
  pools: Arc<RwLock<HashMap<String, Arc<WorkerPool>>>>,
  config: RuntimeConfig,
}

impl RuntimeManager {
  /// Создать новый runtime manager
  pub fn new(config: RuntimeConfig) -> Self {
    let pools = Arc::new(RwLock::new(HashMap::new()));

    Self { pools, config }
  }

  /// Инициализировать pools из конфигурации
  pub async fn initialize(&self) -> Result<()> {
    let mut pools = self.pools.write().await;

    for (name, pool_config) in &self.config.task_pools {
      let pool = Arc::new(WorkerPool::new(name.clone(), pool_config.clone()));
      pools.insert(name.clone(), pool);
      log::info!(
        "Initialized worker pool '{}' with {} max concurrent tasks",
        name,
        pool_config.max_concurrent_tasks
      );
    }

    Ok(())
  }

  /// Получить pool по имени
  pub async fn get_pool(&self, name: &str) -> Option<Arc<WorkerPool>> {
    let pools = self.pools.read().await;
    pools.get(name).cloned()
  }

  /// Выполнить CPU-intensive задачу
  pub async fn execute_cpu_intensive<F, R>(&self, task: F) -> Result<TaskResult<R>>
  where
    F: std::future::Future<Output = Result<R>> + Send + 'static,
    R: Send + 'static,
  {
    let pool = self.get_pool("cpu_intensive").await.ok_or_else(|| {
      VideoCompilerError::InternalError("CPU intensive pool not found".to_string())
    })?;

    Ok(pool.execute(task).await)
  }

  /// Выполнить IO-bound задачу
  pub async fn execute_io_bound<F, R>(&self, task: F) -> Result<TaskResult<R>>
  where
    F: std::future::Future<Output = Result<R>> + Send + 'static,
    R: Send + 'static,
  {
    let pool = self
      .get_pool("io_bound")
      .await
      .ok_or_else(|| VideoCompilerError::InternalError("IO bound pool not found".to_string()))?;

    Ok(pool.execute(task).await)
  }

  /// Выполнить background задачу
  pub async fn execute_background<F, R>(&self, task: F) -> Result<TaskResult<R>>
  where
    F: std::future::Future<Output = Result<R>> + Send + 'static,
    R: Send + 'static,
  {
    let pool = self
      .get_pool("background")
      .await
      .ok_or_else(|| VideoCompilerError::InternalError("Background pool not found".to_string()))?;

    Ok(pool.execute(task).await)
  }

  /// Добавить новый pool
  pub async fn add_pool(&self, name: String, config: TaskPoolConfig) -> Result<()> {
    let mut pools = self.pools.write().await;

    if pools.contains_key(&name) {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Pool '{name}' already exists"
      )));
    }

    let pool = Arc::new(WorkerPool::new(name.clone(), config));
    pools.insert(name.clone(), pool);

    log::info!("Added worker pool '{name}'");
    Ok(())
  }

  /// Удалить pool
  pub async fn remove_pool(&self, name: &str) -> Result<()> {
    let mut pools = self.pools.write().await;

    if pools.remove(name).is_some() {
      log::info!("Removed worker pool '{name}'");
      Ok(())
    } else {
      Err(VideoCompilerError::InvalidParameter(format!(
        "Pool '{name}' not found"
      )))
    }
  }

  /// Получить список всех pools
  pub async fn list_pools(&self) -> Vec<String> {
    let pools = self.pools.read().await;
    pools.keys().cloned().collect()
  }

  /// Получить сводную статистику всех pools
  pub async fn get_runtime_stats(&self) -> RuntimeStats {
    let pools = self.pools.read().await;
    let mut pool_stats = HashMap::new();

    for (name, pool) in pools.iter() {
      pool_stats.insert(name.clone(), pool.get_stats().await);
    }

    RuntimeStats {
      pool_stats,
      system_stats: get_system_stats(),
    }
  }

  /// Получить конфигурацию
  pub fn config(&self) -> &RuntimeConfig {
    &self.config
  }
}

/// Сводная статистика runtime
#[derive(Debug)]
pub struct RuntimeStats {
  pub pool_stats: HashMap<String, PoolStats>,
  pub system_stats: SystemStats,
}

/// Системная статистика
#[derive(Debug)]
pub struct SystemStats {
  pub cpu_count: usize,
  pub memory_usage: u64,
  pub total_memory: u64,
  pub load_average: f64,
  pub thread_count: usize,
}

/// Получить системную статистику
fn get_system_stats() -> SystemStats {
  let mut system = sysinfo::System::new();
  system.refresh_all();

  SystemStats {
    cpu_count: num_cpus::get(),
    memory_usage: system.used_memory(),
    total_memory: system.total_memory(),
    load_average: sysinfo::System::load_average().one,
    thread_count: std::thread::available_parallelism()
      .map(|p| p.get())
      .unwrap_or(1),
  }
}

/// Utilities для runtime оптимизации
pub mod utils {
  use super::*;

  /// Автоматически подобрать оптимальные настройки runtime
  pub fn auto_tune_runtime() -> RuntimeConfig {
    let cpu_count = num_cpus::get();
    let memory = get_system_stats().total_memory;

    // Базовая конфигурация
    let mut config = RuntimeConfig::default();

    // Настройка на основе количества CPU
    if cpu_count >= 16 {
      // Мощная система
      config.worker_threads = Some(cpu_count);
      config.max_blocking_threads = Some(1024);

      // Увеличиваем пулы для мощных систем
      if let Some(cpu_pool) = config.task_pools.get_mut("cpu_intensive") {
        cpu_pool.max_concurrent_tasks = cpu_count;
        cpu_pool.queue_size = Some(cpu_count * 8);
      }

      if let Some(io_pool) = config.task_pools.get_mut("io_bound") {
        io_pool.max_concurrent_tasks = cpu_count * 6;
        io_pool.queue_size = Some(2000);
      }
    } else if cpu_count >= 8 {
      // Средняя система
      config.worker_threads = Some(cpu_count);
      config.max_blocking_threads = Some(512);
    } else {
      // Слабая система - ограничиваем
      config.worker_threads = Some((cpu_count * 2).max(4));
      config.max_blocking_threads = Some(256);

      if let Some(cpu_pool) = config.task_pools.get_mut("cpu_intensive") {
        cpu_pool.max_concurrent_tasks = (cpu_count / 2).max(1);
      }
    }

    // Настройка на основе памяти
    let memory_gb = memory / (1024 * 1024 * 1024);
    if memory_gb >= 16 {
      // Много памяти - увеличиваем размеры очередей
      for pool in config.task_pools.values_mut() {
        if let Some(queue_size) = &mut pool.queue_size {
          *queue_size *= 2;
        }
      }
    } else if memory_gb < 8 {
      // Мало памяти - уменьшаем
      for pool in config.task_pools.values_mut() {
        if let Some(queue_size) = &mut pool.queue_size {
          *queue_size /= 2;
        }
      }
    }

    config
  }

  /// Создать оптимизированный runtime
  pub fn create_optimized_runtime() -> std::io::Result<tokio::runtime::Runtime> {
    let config = auto_tune_runtime();

    let mut builder = tokio::runtime::Builder::new_multi_thread();

    if let Some(worker_threads) = config.worker_threads {
      builder.worker_threads(worker_threads);
    }

    if let Some(max_blocking_threads) = config.max_blocking_threads {
      builder.max_blocking_threads(max_blocking_threads);
    }

    if let Some(stack_size) = config.thread_stack_size {
      builder.thread_stack_size(stack_size);
    }

    builder
      .thread_name(&config.thread_name_prefix)
      .thread_keep_alive(config.thread_keep_alive)
      .enable_all()
      .build()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::time::Duration;

  #[tokio::test]
  async fn test_worker_pool() {
    let config = TaskPoolConfig {
      max_concurrent_tasks: 2,
      queue_size: Some(10),
      priority: TaskPriority::Medium,
      timeout: Some(Duration::from_secs(1)),
    };

    let pool = WorkerPool::new("test".to_string(), config);

    // Выполняем простую задачу
    let result = pool
      .execute(async {
        tokio::time::sleep(Duration::from_millis(100)).await;
        Ok::<i32, VideoCompilerError>(42)
      })
      .await;

    assert!(result.result.is_ok());
    assert_eq!(result.result.unwrap(), 42);
    assert_eq!(result.pool_name, "test");

    // Проверяем статистику
    let stats = pool.get_stats().await;
    assert_eq!(stats.total_tasks, 1);
    assert_eq!(stats.completed_tasks, 1);
    assert_eq!(stats.failed_tasks, 0);
  }

  #[tokio::test]
  async fn test_runtime_manager() {
    let config = RuntimeConfig::default();
    let manager = RuntimeManager::new(config);

    manager.initialize().await.unwrap();

    // Проверяем что pools созданы
    let pools = manager.list_pools().await;
    assert!(pools.contains(&"cpu_intensive".to_string()));
    assert!(pools.contains(&"io_bound".to_string()));
    assert!(pools.contains(&"background".to_string()));

    // Выполняем задачу
    let result = manager
      .execute_cpu_intensive(async { Ok::<String, VideoCompilerError>("test".to_string()) })
      .await
      .unwrap();

    assert!(result.result.is_ok());
    assert_eq!(result.result.unwrap(), "test");
  }

  #[test]
  fn test_auto_tune_runtime() {
    let config = utils::auto_tune_runtime();

    // Проверяем что настройки разумные
    assert!(config.worker_threads.unwrap() > 0);
    assert!(config.max_blocking_threads.unwrap() > 0);
    assert!(!config.task_pools.is_empty());
  }

  #[tokio::test]
  async fn test_worker_pool_timeout() {
    let config = TaskPoolConfig {
      max_concurrent_tasks: 1,
      queue_size: Some(1),
      priority: TaskPriority::High,
      timeout: Some(Duration::from_millis(50)), // Короткий timeout
    };

    let pool = WorkerPool::new("timeout_test".to_string(), config);

    // Задача которая превышает timeout
    let result = pool
      .execute(async {
        tokio::time::sleep(Duration::from_millis(100)).await; // Дольше чем timeout
        Ok::<i32, VideoCompilerError>(42)
      })
      .await;

    assert!(result.result.is_err());
    if let Err(VideoCompilerError::TimeoutError(msg)) = result.result {
      assert!(msg.contains("timed out"));
    } else {
      panic!("Expected timeout error");
    }

    // Проверяем статистику
    let stats = pool.get_stats().await;
    assert_eq!(stats.total_tasks, 1);
    assert_eq!(stats.completed_tasks, 0);
    assert_eq!(stats.failed_tasks, 1);
  }

  #[tokio::test]
  async fn test_worker_pool_concurrent_access() {
    let config = TaskPoolConfig {
      max_concurrent_tasks: 2,
      queue_size: Some(10),
      priority: TaskPriority::Medium,
      timeout: None,
    };

    let pool = Arc::new(WorkerPool::new("concurrent_test".to_string(), config));
    let mut handles = vec![];

    // Запускаем множество задач одновременно
    for i in 0..10 {
      let pool_clone = pool.clone();
      let handle = tokio::spawn(async move {
        pool_clone
          .execute(async move {
            tokio::time::sleep(Duration::from_millis(10)).await;
            Ok::<i32, VideoCompilerError>(i)
          })
          .await
      });
      handles.push(handle);
    }

    // Ждем завершения всех задач
    let results: Vec<_> = futures::future::join_all(handles).await;

    // Проверяем что все задачи завершились успешно
    for result in results {
      let task_result = result.unwrap();
      assert!(task_result.result.is_ok());
    }

    // Проверяем статистику
    let stats = pool.get_stats().await;
    assert_eq!(stats.total_tasks, 10);
    assert_eq!(stats.completed_tasks, 10);
    assert_eq!(stats.failed_tasks, 0);
  }

  #[tokio::test]
  async fn test_runtime_manager_pool_management() {
    let config = RuntimeConfig::default();
    let manager = RuntimeManager::new(config);

    manager.initialize().await.unwrap();

    // Добавляем новый pool
    let custom_config = TaskPoolConfig {
      max_concurrent_tasks: 5,
      queue_size: Some(50),
      priority: TaskPriority::Critical,
      timeout: Some(Duration::from_secs(10)),
    };

    assert!(manager
      .add_pool("custom".to_string(), custom_config)
      .await
      .is_ok());

    // Проверяем что pool добавлен
    let pools = manager.list_pools().await;
    assert!(pools.contains(&"custom".to_string()));

    // Проверяем что нельзя добавить pool с таким же именем
    let duplicate_config = TaskPoolConfig {
      max_concurrent_tasks: 1,
      queue_size: Some(1),
      priority: TaskPriority::Low,
      timeout: None,
    };
    assert!(manager
      .add_pool("custom".to_string(), duplicate_config)
      .await
      .is_err());

    // Удаляем pool
    assert!(manager.remove_pool("custom").await.is_ok());

    // Проверяем что pool удален
    let pools = manager.list_pools().await;
    assert!(!pools.contains(&"custom".to_string()));

    // Проверяем что нельзя удалить несуществующий pool
    assert!(manager.remove_pool("nonexistent").await.is_err());
  }

  #[tokio::test]
  async fn test_task_pool_error_handling() {
    let config = TaskPoolConfig {
      max_concurrent_tasks: 1,
      queue_size: Some(1),
      priority: TaskPriority::Low,
      timeout: None,
    };

    let pool = WorkerPool::new("error_test".to_string(), config);

    // Задача которая возвращает ошибку
    let result = pool
      .execute(async {
        Err::<i32, VideoCompilerError>(VideoCompilerError::InternalError("Test error".to_string()))
      })
      .await;

    assert!(result.result.is_err());
    assert_eq!(result.pool_name, "error_test");

    // Проверяем статистику
    let stats = pool.get_stats().await;
    assert_eq!(stats.total_tasks, 1);
    assert_eq!(stats.completed_tasks, 0);
    assert_eq!(stats.failed_tasks, 1);
  }

  #[tokio::test]
  async fn test_runtime_stats_collection() {
    let config = RuntimeConfig::default();
    let manager = RuntimeManager::new(config);

    manager.initialize().await.unwrap();

    // Выполняем несколько задач в разных pools
    let _result1 = manager
      .execute_cpu_intensive(async { Ok::<String, VideoCompilerError>("cpu".to_string()) })
      .await
      .unwrap();

    let _result2 = manager
      .execute_io_bound(async { Ok::<String, VideoCompilerError>("io".to_string()) })
      .await
      .unwrap();

    let _result3 = manager
      .execute_background(async { Ok::<String, VideoCompilerError>("bg".to_string()) })
      .await
      .unwrap();

    // Получаем сводную статистику
    let stats = manager.get_runtime_stats().await;

    // Проверяем что статистика содержит данные по всем pools
    assert!(stats.pool_stats.contains_key("cpu_intensive"));
    assert!(stats.pool_stats.contains_key("io_bound"));
    assert!(stats.pool_stats.contains_key("background"));

    // Проверяем системную статистику
    assert!(stats.system_stats.cpu_count > 0);
    assert!(stats.system_stats.memory_usage > 0);
    assert!(stats.system_stats.total_memory > 0);
    assert!(stats.system_stats.thread_count > 0);

    // Проверяем что задачи выполнились
    for (_, pool_stats) in stats.pool_stats {
      assert!(pool_stats.total_tasks > 0);
    }
  }

  #[test]
  fn test_task_priority_ordering() {
    assert!(TaskPriority::Critical > TaskPriority::High);
    assert!(TaskPriority::High > TaskPriority::Medium);
    assert!(TaskPriority::Medium > TaskPriority::Low);

    // Проверяем численные значения
    assert_eq!(TaskPriority::Low as u8, 0);
    assert_eq!(TaskPriority::Medium as u8, 1);
    assert_eq!(TaskPriority::High as u8, 2);
    assert_eq!(TaskPriority::Critical as u8, 3);
  }

  #[test]
  fn test_runtime_config_default_pools() {
    let config = RuntimeConfig::default();

    // Проверяем что созданы все обязательные pools
    assert!(config.task_pools.contains_key("cpu_intensive"));
    assert!(config.task_pools.contains_key("io_bound"));
    assert!(config.task_pools.contains_key("background"));

    // Проверяем конфигурацию CPU pool
    let cpu_pool = &config.task_pools["cpu_intensive"];
    assert_eq!(cpu_pool.priority, TaskPriority::High);
    assert!(cpu_pool.timeout.is_some());

    // Проверяем конфигурацию IO pool
    let io_pool = &config.task_pools["io_bound"];
    assert_eq!(io_pool.priority, TaskPriority::Medium);
    assert!(io_pool.max_concurrent_tasks > cpu_pool.max_concurrent_tasks);

    // Проверяем конфигурацию Background pool
    let bg_pool = &config.task_pools["background"];
    assert_eq!(bg_pool.priority, TaskPriority::Low);
    assert_eq!(bg_pool.max_concurrent_tasks, 2);
  }

  #[test]
  fn test_system_stats_collection() {
    let stats = get_system_stats();

    // Проверяем что системная статистика корректна
    assert!(stats.cpu_count > 0);
    assert!(stats.total_memory > 0);
    assert!(stats.thread_count > 0);
    assert!(stats.load_average >= 0.0);

    // Memory usage может быть любым, но должен быть меньше total
    assert!(stats.memory_usage <= stats.total_memory);
  }

  #[test]
  fn test_auto_tune_different_system_configs() {
    // Этот тест может вести себя по-разному на разных системах,
    // но проверяем основные инварианты

    let config = utils::auto_tune_runtime();

    // Worker threads должны быть разумными
    let worker_threads = config.worker_threads.unwrap();
    assert!(worker_threads >= 1);
    assert!(worker_threads <= 64); // Разумный верхний предел

    // Blocking threads должны быть больше worker threads
    let blocking_threads = config.max_blocking_threads.unwrap();
    assert!(blocking_threads >= worker_threads);

    // Все pools должны существовать
    assert!(config.task_pools.contains_key("cpu_intensive"));
    assert!(config.task_pools.contains_key("io_bound"));
    assert!(config.task_pools.contains_key("background"));

    // CPU pool должен быть связан с количеством CPU
    let cpu_pool = &config.task_pools["cpu_intensive"];
    assert!(cpu_pool.max_concurrent_tasks <= worker_threads);

    // IO pool должен поддерживать больше задач
    let io_pool = &config.task_pools["io_bound"];
    assert!(io_pool.max_concurrent_tasks >= cpu_pool.max_concurrent_tasks);
  }

  #[tokio::test]
  async fn test_pool_stats_calculation() {
    let config = TaskPoolConfig {
      max_concurrent_tasks: 2,
      queue_size: Some(10),
      priority: TaskPriority::Medium,
      timeout: None,
    };

    let pool = WorkerPool::new("stats_test".to_string(), config);

    // Выполняем несколько задач с разной длительностью
    let _result1 = pool
      .execute(async {
        tokio::time::sleep(Duration::from_millis(10)).await;
        Ok::<i32, VideoCompilerError>(1)
      })
      .await;

    let _result2 = pool
      .execute(async {
        tokio::time::sleep(Duration::from_millis(20)).await;
        Ok::<i32, VideoCompilerError>(2)
      })
      .await;

    let _result3 = pool
      .execute(async {
        Err::<i32, VideoCompilerError>(VideoCompilerError::InternalError("test".to_string()))
      })
      .await;

    // Проверяем статистику
    let stats = pool.get_stats().await;
    assert_eq!(stats.total_tasks, 3);
    assert_eq!(stats.completed_tasks, 2);
    assert_eq!(stats.failed_tasks, 1);
    assert_eq!(stats.active_tasks, 0);

    // Среднее время выполнения должно быть разумным
    assert!(stats.avg_execution_time > Duration::from_millis(5));
    assert!(stats.avg_execution_time < Duration::from_millis(50));

    // Last activity должно быть недавно
    assert!(stats.last_activity.is_some());
    let elapsed = stats.last_activity.unwrap().elapsed();
    assert!(elapsed < Duration::from_secs(1));
  }

  #[tokio::test]
  async fn test_pool_semaphore_limits() {
    let config = TaskPoolConfig {
      max_concurrent_tasks: 1, // Только одна задача одновременно
      queue_size: Some(2),
      priority: TaskPriority::Medium,
      timeout: Some(Duration::from_millis(100)),
    };

    let pool = Arc::new(WorkerPool::new("semaphore_test".to_string(), config));

    // Запускаем длительную задачу
    let pool1 = pool.clone();
    let long_task = tokio::spawn(async move {
      pool1
        .execute(async {
          tokio::time::sleep(Duration::from_millis(50)).await;
          Ok::<i32, VideoCompilerError>(1)
        })
        .await
    });

    // Сразу запускаем вторую задачу - должна ждать
    let pool2 = pool.clone();
    let quick_task = tokio::spawn(async move {
      pool2
        .execute(async { Ok::<i32, VideoCompilerError>(2) })
        .await
    });

    // Ждем завершения обеих задач
    let (result1, result2) = tokio::join!(long_task, quick_task);

    // Обе задачи должны выполниться успешно
    assert!(result1.unwrap().result.is_ok());
    assert!(result2.unwrap().result.is_ok());

    // Проверяем финальную статистику
    let stats = pool.get_stats().await;
    assert_eq!(stats.total_tasks, 2);
    assert_eq!(stats.completed_tasks, 2);
    assert_eq!(stats.failed_tasks, 0);
  }
}

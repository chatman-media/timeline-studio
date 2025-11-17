//! Performance Manager - Управление производительностью и памятью
//!
//! Этот модуль обеспечивает:
//! - Автоматическую очистку временных файлов
//! - Мониторинг использования памяти
//! - Graceful degradation при нехватке ресурсов

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::error::Result;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;

/// Пороги использования памяти
#[derive(Debug, Clone)]
pub struct MemoryThresholds {
  /// Предупреждение (80%)
  pub warning: f64,
  /// Критический уровень (90%)
  pub critical: f64,
  /// Экстремальный уровень (95%)
  pub extreme: f64,
}

impl Default for MemoryThresholds {
  fn default() -> Self {
    Self {
      warning: 0.8,
      critical: 0.9,
      extreme: 0.95,
    }
  }
}

/// Уровень памяти
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemoryPressure {
  /// Нормальный
  Normal,
  /// Предупреждение
  Warning,
  /// Критический
  Critical,
  /// Экстремальный
  Extreme,
}

/// Настройки менеджера производительности
#[derive(Debug, Clone)]
pub struct PerformanceSettings {
  /// Включить автоматическую очистку
  pub auto_cleanup_enabled: bool,
  /// Интервал автоочистки
  pub cleanup_interval: Duration,
  /// Максимальный возраст временных файлов
  pub temp_file_max_age: Duration,
  /// Пороги использования памяти
  pub memory_thresholds: MemoryThresholds,
  /// Включить graceful degradation
  pub graceful_degradation_enabled: bool,
}

impl Default for PerformanceSettings {
  fn default() -> Self {
    Self {
      auto_cleanup_enabled: true,
      cleanup_interval: Duration::from_secs(300), // 5 минут
      temp_file_max_age: Duration::from_secs(3600), // 1 час
      memory_thresholds: MemoryThresholds::default(),
      graceful_degradation_enabled: true,
    }
  }
}

/// Менеджер производительности
pub struct PerformanceManager {
  settings: PerformanceSettings,
  temp_dir: PathBuf,
  last_cleanup: Arc<RwLock<SystemTime>>,
}

impl PerformanceManager {
  /// Создать новый менеджер
  pub fn new(temp_dir: PathBuf) -> Self {
    Self::with_settings(temp_dir, PerformanceSettings::default())
  }

  /// Создать менеджер с настройками
  pub fn with_settings(temp_dir: PathBuf, settings: PerformanceSettings) -> Self {
    Self {
      settings,
      temp_dir,
      last_cleanup: Arc::new(RwLock::new(SystemTime::now())),
    }
  }

  /// Проверить, нужна ли автоочистка
  pub async fn should_run_cleanup(&self) -> bool {
    if !self.settings.auto_cleanup_enabled {
      return false;
    }

    let last_cleanup = self.last_cleanup.read().await;
    let elapsed = SystemTime::now()
      .duration_since(*last_cleanup)
      .unwrap_or(Duration::from_secs(0));

    elapsed >= self.settings.cleanup_interval
  }

  /// Выполнить автоочистку
  pub async fn run_auto_cleanup(&self, cache: &mut RenderCache) -> Result<()> {
    if !self.should_run_cleanup().await {
      return Ok(());
    }

    log::info!("Запуск автоочистки Performance Manager");

    // Очистить старые записи в кэше
    cache.cleanup_old_entries().await?;

    // Очистить временные файлы
    self.cleanup_temp_files().await?;

    // Обновить время последней очистки
    let mut last_cleanup = self.last_cleanup.write().await;
    *last_cleanup = SystemTime::now();

    log::info!("Автоочистка завершена");
    Ok(())
  }

  /// Очистить временные файлы
  pub async fn cleanup_temp_files(&self) -> Result<()> {
    let temp_dir = &self.temp_dir;
    if !temp_dir.exists() {
      return Ok(());
    }

    let max_age = self.settings.temp_file_max_age;
    let now = SystemTime::now();
    let mut removed_count = 0;

    // Рекурсивно обходим временную директорию
    if let Ok(entries) = std::fs::read_dir(temp_dir) {
      for entry in entries.flatten() {
        if let Ok(metadata) = entry.metadata() {
          if let Ok(modified) = metadata.modified() {
            if let Ok(age) = now.duration_since(modified) {
              if age > max_age {
                // Файл старше максимального возраста
                if let Err(e) = std::fs::remove_file(entry.path()) {
                  log::warn!("Не удалось удалить временный файл: {:?}", e);
                } else {
                  removed_count += 1;
                }
              }
            }
          }
        }
      }
    }

    if removed_count > 0 {
      log::info!("Удалено {} старых временных файлов", removed_count);
    }

    Ok(())
  }

  /// Определить уровень давления на память
  pub fn detect_memory_pressure(&self, cache: &RenderCache) -> MemoryPressure {
    let memory_usage = cache.get_memory_usage();
    let max_memory = cache.get_settings().max_memory_mb * 1024 * 1024;
    let usage_ratio = memory_usage.total_bytes as f64 / max_memory as f64;

    if usage_ratio >= self.settings.memory_thresholds.extreme {
      MemoryPressure::Extreme
    } else if usage_ratio >= self.settings.memory_thresholds.critical {
      MemoryPressure::Critical
    } else if usage_ratio >= self.settings.memory_thresholds.warning {
      MemoryPressure::Warning
    } else {
      MemoryPressure::Normal
    }
  }

  /// Применить graceful degradation
  pub async fn apply_graceful_degradation(
    &self,
    pressure: MemoryPressure,
    cache: &mut RenderCache,
  ) -> Result<()> {
    if !self.settings.graceful_degradation_enabled {
      return Ok(());
    }

    match pressure {
      MemoryPressure::Normal => {
        // Всё в порядке
        Ok(())
      }
      MemoryPressure::Warning => {
        log::warn!("Предупреждение: использование памяти высокое");
        // Очистить старые записи
        cache.cleanup_old_entries().await
      }
      MemoryPressure::Critical => {
        log::error!("Критическое использование памяти");
        // Агрессивная очистка - удаляем превью
        cache.clear_previews().await;
        cache.cleanup_old_entries().await
      }
      MemoryPressure::Extreme => {
        log::error!("Экстремальное использование памяти - полная очистка кэша");
        // Полная очистка
        cache.clear_all().await;
        Ok(())
      }
    }
  }

  /// Получить статистику менеджера
  pub async fn get_stats(&self) -> PerformanceStats {
    let last_cleanup = self.last_cleanup.read().await;
    let time_since_cleanup = SystemTime::now()
      .duration_since(*last_cleanup)
      .unwrap_or(Duration::from_secs(0));

    PerformanceStats {
      auto_cleanup_enabled: self.settings.auto_cleanup_enabled,
      time_since_last_cleanup: time_since_cleanup,
      cleanup_interval: self.settings.cleanup_interval,
    }
  }
}

/// Статистика менеджера
#[derive(Debug, Clone)]
pub struct PerformanceStats {
  pub auto_cleanup_enabled: bool,
  pub time_since_last_cleanup: Duration,
  pub cleanup_interval: Duration,
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs::File;
  use std::io::Write;
  use tempfile::TempDir;

  #[test]
  fn test_performance_manager_creation() {
    let temp_dir = TempDir::new().unwrap();
    let manager = PerformanceManager::new(temp_dir.path().to_path_buf());

    assert!(manager.settings.auto_cleanup_enabled);
    assert_eq!(manager.settings.cleanup_interval, Duration::from_secs(300));
  }

  #[test]
  fn test_memory_thresholds_default() {
    let thresholds = MemoryThresholds::default();

    assert_eq!(thresholds.warning, 0.8);
    assert_eq!(thresholds.critical, 0.9);
    assert_eq!(thresholds.extreme, 0.95);
  }

  #[tokio::test]
  async fn test_cleanup_temp_files() {
    let temp_dir = TempDir::new().unwrap();
    let manager = PerformanceManager::new(temp_dir.path().to_path_buf());

    // Создать несколько временных файлов
    for i in 0..5 {
      let file_path = temp_dir.path().join(format!("temp_{}.dat", i));
      let mut file = File::create(&file_path).unwrap();
      writeln!(file, "test data").unwrap();
    }

    // Проверить что файлы созданы
    let count_before = std::fs::read_dir(temp_dir.path()).unwrap().count();
    assert_eq!(count_before, 5);

    // Запустить cleanup (не удалит свежие файлы)
    manager.cleanup_temp_files().await.unwrap();

    // Файлы должны остаться (они свежие)
    let count_after = std::fs::read_dir(temp_dir.path()).unwrap().count();
    assert_eq!(count_after, 5);
  }

  #[tokio::test]
  async fn test_should_run_cleanup() {
    let temp_dir = TempDir::new().unwrap();
    let mut settings = PerformanceSettings::default();
    settings.cleanup_interval = Duration::from_millis(100);

    let manager = PerformanceManager::with_settings(temp_dir.path().to_path_buf(), settings);

    // Сразу после создания не нужна очистка
    assert!(!manager.should_run_cleanup().await);

    // Подождать
    tokio::time::sleep(Duration::from_millis(150)).await;

    // Теперь нужна очистка
    assert!(manager.should_run_cleanup().await);
  }

  #[test]
  fn test_memory_pressure_detection() {
    let temp_dir = TempDir::new().unwrap();
    let manager = PerformanceManager::new(temp_dir.path().to_path_buf());
    let cache = RenderCache::new();

    let pressure = manager.detect_memory_pressure(&cache);
    assert_eq!(pressure, MemoryPressure::Normal);
  }

  #[tokio::test]
  async fn test_auto_cleanup_disabled() {
    let temp_dir = TempDir::new().unwrap();
    let mut settings = PerformanceSettings::default();
    settings.auto_cleanup_enabled = false;

    let manager = PerformanceManager::with_settings(temp_dir.path().to_path_buf(), settings);

    // Очистка не должна запускаться
    assert!(!manager.should_run_cleanup().await);
  }

  #[tokio::test]
  async fn test_graceful_degradation_normal() {
    let temp_dir = TempDir::new().unwrap();
    let manager = PerformanceManager::new(temp_dir.path().to_path_buf());
    let mut cache = RenderCache::new();

    // При нормальном давлении не должно быть изменений
    manager
      .apply_graceful_degradation(MemoryPressure::Normal, &mut cache)
      .await
      .unwrap();

    let stats = cache.get_stats();
    assert_eq!(stats.preview_hits, 0);
  }

  #[tokio::test]
  async fn test_graceful_degradation_extreme() {
    let temp_dir = TempDir::new().unwrap();
    let manager = PerformanceManager::new(temp_dir.path().to_path_buf());
    let mut cache = RenderCache::new();

    // При экстремальном давлении должна происходить полная очистка
    manager
      .apply_graceful_degradation(MemoryPressure::Extreme, &mut cache)
      .await
      .unwrap();

    // Кэш должен быть очищен
    let stats = cache.get_stats();
    assert_eq!(stats.preview_hits, 0);
    assert_eq!(stats.preview_misses, 0);
  }

  #[tokio::test]
  async fn test_get_stats() {
    let temp_dir = TempDir::new().unwrap();
    let manager = PerformanceManager::new(temp_dir.path().to_path_buf());

    let stats = manager.get_stats().await;

    assert!(stats.auto_cleanup_enabled);
    assert_eq!(stats.cleanup_interval, Duration::from_secs(300));
    assert!(stats.time_since_last_cleanup < Duration::from_secs(1));
  }

  #[test]
  fn test_performance_settings_default() {
    let settings = PerformanceSettings::default();

    assert!(settings.auto_cleanup_enabled);
    assert!(settings.graceful_degradation_enabled);
    assert_eq!(settings.cleanup_interval, Duration::from_secs(300));
    assert_eq!(settings.temp_file_max_age, Duration::from_secs(3600));
  }
}

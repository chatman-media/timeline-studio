//! Сервис управления кэшем

use crate::services::Service;
use ts_render::video_compiler::core::{
  cache::RenderCache,
  error::{Result, VideoCompilerError},
};
use async_trait::async_trait;
use std::{
  path::{Path, PathBuf},
  sync::Arc,
};
use tokio::sync::RwLock;

/// Статистика кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheStats {
  pub total_size_mb: f64,
  pub preview_cache_size_mb: f64,
  pub render_cache_size_mb: f64,
  pub temp_files_size_mb: f64,
  pub total_files: usize,
  // Метрики эффективности кэша
  pub cache_hits: u64,
  pub cache_misses: u64,
  pub hit_rate: f64,
  pub hit_ratio: f64, // Дублируем для совместимости с фронтендом
  pub preview_hits: u64,
  pub preview_misses: u64,
  pub preview_hit_ratio: f64,
  pub metadata_hits: u64,
  pub metadata_misses: u64,
  pub memory_pressure: f64,
  pub eviction_count: u64,
}

/// Расширенные метрики производительности кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CachePerformanceMetrics {
  pub hit_rate_last_hour: f64,
  pub hit_rate_last_day: f64,
  pub average_response_time_ms: f64,
  pub peak_memory_usage_mb: f64,
  pub current_memory_usage_mb: f64,
  pub fragmentation_ratio: f64,
  pub top_accessed_keys: Vec<String>,
  pub slow_operations: Vec<SlowCacheOperation>,
}

/// Информация о медленной операции кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SlowCacheOperation {
  pub operation: String,
  pub key: String,
  pub duration_ms: f64,
  pub timestamp: String,
}

/// Пороги для алертов кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheAlertThresholds {
  pub min_hit_rate: f64,         // Минимальный hit rate (например, 0.8)
  pub max_memory_usage_mb: f64,  // Максимальное использование памяти
  pub max_response_time_ms: f64, // Максимальное время отклика
  pub max_fragmentation: f64,    // Максимальная фрагментация
}

/// Алерт кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheAlert {
  pub alert_type: CacheAlertType,
  pub message: String,
  pub severity: AlertSeverity,
  pub timestamp: String,
  pub current_value: f64,
  pub threshold_value: f64,
}

/// Информация об элементе кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheItemInfo {
  pub key: String,
  pub size_bytes: u64,
  pub created_at: String,
  pub last_accessed: String,
  pub access_count: u64,
}

/// Типы алертов кэша
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum CacheAlertType {
  LowHitRate,
  HighMemoryUsage,
  SlowResponse,
  HighFragmentation,
  DiskSpaceLow,
}

/// Уровень важности алерта
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum AlertSeverity {
  Info,
  Warning,
  Critical,
}

/// Трейт для сервиса кэша
#[async_trait]
pub trait CacheService: Service + Send + Sync {
  /// Очистить весь кэш
  async fn clear_all(&self) -> Result<()>;

  /// Очистить кэш рендеринга
  async fn clear_render_cache(&self) -> Result<()>;

  /// Очистить кэш превью
  async fn clear_preview_cache(&self) -> Result<()>;

  /// Очистить кэш проекта
  async fn clear_project_cache(&self, project_id: &str) -> Result<()>;

  /// Получить размер кэша в мегабайтах
  async fn get_cache_size(&self) -> Result<f64>;

  /// Получить статистику кэша
  async fn get_cache_stats(&self) -> Result<CacheStats>;

  /// Оптимизировать кэш (удалить старые файлы)
  async fn optimize_cache(&self, max_age_days: u32) -> Result<usize>;

  /// Получить путь к кэшу
  async fn get_cache_path(&self) -> Result<PathBuf>;

  /// Сохранить данные в кэш
  async fn save_to_cache(&self, key: &str, data: &[u8]) -> Result<PathBuf>;

  /// Получить данные из кэша
  async fn get_from_cache(&self, key: &str) -> Result<Option<Vec<u8>>>;

  /// Проверить наличие в кэше
  async fn exists_in_cache(&self, key: &str) -> Result<bool>;

  /// Получить список всех элементов в кэше
  async fn list_cached_items(&self) -> Result<Vec<String>>;

  /// Получить информацию об элементе кэша
  async fn get_item_info(&self, key: &str) -> Result<Option<CacheItemInfo>>;

  /// Получить расширенную статистику с метриками производительности
  async fn get_performance_metrics(&self) -> Result<CachePerformanceMetrics>;

  /// Сбросить счетчики метрик
  async fn reset_metrics(&self) -> Result<()>;

  /// Установить пороги для алертов
  async fn set_alert_thresholds(&self, thresholds: CacheAlertThresholds) -> Result<()>;

  /// Получить текущие алерты
  async fn get_active_alerts(&self) -> Result<Vec<CacheAlert>>;
}

/// Реализация сервиса кэша
pub struct CacheServiceImpl {
  cache_dir: PathBuf,
  render_cache: Arc<RwLock<RenderCache>>,
}

impl CacheServiceImpl {
  pub fn new(cache_dir: PathBuf) -> Self {
    let render_cache = Arc::new(RwLock::new(RenderCache::new()));

    Self {
      cache_dir,
      render_cache,
    }
  }

  /// Рассчитать размер директории
  async fn calculate_dir_size(&self, path: &Path) -> Result<f64> {
    let mut total_size = 0u64;

    let mut entries = tokio::fs::read_dir(path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    while let Some(entry) = entries
      .next_entry()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?
    {
      let metadata = entry
        .metadata()
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

      if metadata.is_file() {
        total_size += metadata.len();
      } else if metadata.is_dir() {
        let sub_size = Box::pin(self.calculate_dir_size(&entry.path())).await?;
        total_size += (sub_size * 1024.0 * 1024.0) as u64;
      }
    }

    Ok(total_size as f64 / 1024.0 / 1024.0) // Конвертируем в МБ
  }

  /// Удалить старые файлы
  async fn remove_old_files(&self, path: &Path, max_age_days: u32) -> Result<usize> {
    let mut removed_count = 0;
    let max_age_secs = max_age_days as u64 * 24 * 3600;

    let mut entries = tokio::fs::read_dir(path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    while let Some(entry) = entries
      .next_entry()
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?
    {
      let metadata = entry
        .metadata()
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

      if metadata.is_file() {
        if let Ok(modified) = metadata.modified() {
          if let Ok(elapsed) = std::time::SystemTime::now().duration_since(modified) {
            if elapsed.as_secs() > max_age_secs {
              tokio::fs::remove_file(entry.path())
                .await
                .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
              removed_count += 1;
            }
          }
        }
      } else if metadata.is_dir() {
        let sub_count = Box::pin(self.remove_old_files(&entry.path(), max_age_days)).await?;
        removed_count += sub_count;
      }
    }

    Ok(removed_count)
  }
}

#[async_trait]
impl Service for CacheServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса кэша");

    // Создаем директории кэша
    let dirs = vec![
      self.cache_dir.clone(),
      self.cache_dir.join("render"),
      self.cache_dir.join("preview"),
      self.cache_dir.join("temp"),
      self.cache_dir.join("projects"),
    ];

    for dir in dirs {
      tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    // Проверяем доступность директории кэша
    if !self.cache_dir.exists() {
      return Err(VideoCompilerError::CacheError(
        "Директория кэша не существует".to_string(),
      ));
    }

    // Проверяем права на запись
    let test_file = self.cache_dir.join(".health_check");
    tokio::fs::write(&test_file, b"test")
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    tokio::fs::remove_file(&test_file)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка сервиса кэша");
    Ok(())
  }
}

#[async_trait]
impl CacheService for CacheServiceImpl {
  async fn clear_all(&self) -> Result<()> {
    log::info!("Очистка всего кэша");

    let mut cache = self.render_cache.write().await;
    cache.clear().await?;

    // Очищаем дополнительные директории
    let dirs = vec!["render", "preview", "temp", "projects"];
    for dir_name in dirs {
      let dir_path = self.cache_dir.join(dir_name);
      if dir_path.exists() {
        tokio::fs::remove_dir_all(&dir_path)
          .await
          .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
        tokio::fs::create_dir_all(&dir_path)
          .await
          .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
      }
    }

    Ok(())
  }

  async fn clear_render_cache(&self) -> Result<()> {
    log::info!("Очистка кэша рендеринга");
    let mut cache = self.render_cache.write().await;
    cache.clear().await?;

    // Также очищаем физические файлы
    let render_dir = self.cache_dir.join("render");
    if render_dir.exists() {
      tokio::fs::remove_dir_all(&render_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
      tokio::fs::create_dir_all(&render_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    Ok(())
  }

  async fn clear_preview_cache(&self) -> Result<()> {
    log::info!("Очистка кэша превью");
    let preview_dir = self.cache_dir.join("preview");
    if preview_dir.exists() {
      tokio::fs::remove_dir_all(&preview_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
      tokio::fs::create_dir_all(&preview_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }
    Ok(())
  }

  async fn clear_project_cache(&self, project_id: &str) -> Result<()> {
    log::info!("Очистка кэша проекта: {}", project_id);

    let mut cache = self.render_cache.write().await;
    cache.clear_project(project_id).await?;

    // Удаляем директорию проекта
    let project_dir = self.cache_dir.join("projects").join(project_id);
    if project_dir.exists() {
      tokio::fs::remove_dir_all(&project_dir)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    Ok(())
  }

  async fn get_cache_size(&self) -> Result<f64> {
    self.calculate_dir_size(&self.cache_dir).await
  }

  async fn get_cache_stats(&self) -> Result<CacheStats> {
    let total_size = self.get_cache_size().await?;

    let preview_size = if self.cache_dir.join("preview").exists() {
      self
        .calculate_dir_size(&self.cache_dir.join("preview"))
        .await?
    } else {
      0.0
    };

    let render_size = if self.cache_dir.join("render").exists() {
      self
        .calculate_dir_size(&self.cache_dir.join("render"))
        .await?
    } else {
      0.0
    };

    let temp_size = if self.cache_dir.join("temp").exists() {
      self
        .calculate_dir_size(&self.cache_dir.join("temp"))
        .await?
    } else {
      0.0
    };

    // Подсчет файлов рекурсивно
    let mut total_files = 0;
    for subdir in &["temp", "render", "preview", "projects"] {
      let dir_path = self.cache_dir.join(subdir);
      if dir_path.exists() {
        if let Ok(mut entries) = tokio::fs::read_dir(&dir_path).await {
          while let Ok(Some(entry)) = entries.next_entry().await {
            if let Ok(metadata) = entry.metadata().await {
              if metadata.is_file() {
                total_files += 1;
              }
            }
          }
        }
      }
    }

    // Получаем реальную статистику из RenderCache
    let cache = self.render_cache.read().await;
    let cache_stats = cache.get_stats();

    // Вычисляем общий hit_ratio
    let total_requests = cache_stats.preview_requests + cache_stats.metadata_requests;
    let total_hits = cache_stats.preview_hits + cache_stats.metadata_hits;
    let hit_ratio = if total_requests == 0 {
      0.0
    } else {
      total_hits as f64 / total_requests as f64
    };

    // Вычисляем preview_hit_ratio
    let preview_hit_ratio = if cache_stats.preview_requests == 0 {
      0.0
    } else {
      cache_stats.preview_hits as f64 / cache_stats.preview_requests as f64
    };

    Ok(CacheStats {
      total_size_mb: total_size,
      preview_cache_size_mb: preview_size,
      render_cache_size_mb: render_size,
      temp_files_size_mb: temp_size,
      total_files,
      cache_hits: total_hits,
      cache_misses: cache_stats.preview_misses + cache_stats.metadata_misses,
      hit_rate: hit_ratio,
      hit_ratio,
      preview_hits: cache_stats.preview_hits,
      preview_misses: cache_stats.preview_misses,
      preview_hit_ratio,
      metadata_hits: cache_stats.metadata_hits,
      metadata_misses: cache_stats.metadata_misses,
      memory_pressure: 0.0,
      eviction_count: 0,
    })
  }

  async fn optimize_cache(&self, max_age_days: u32) -> Result<usize> {
    log::info!(
      "Оптимизация кэша (удаление файлов старше {} дней)",
      max_age_days
    );
    self.remove_old_files(&self.cache_dir, max_age_days).await
  }

  async fn get_cache_path(&self) -> Result<PathBuf> {
    Ok(self.cache_dir.clone())
  }

  async fn save_to_cache(&self, key: &str, data: &[u8]) -> Result<PathBuf> {
    let cache_path = self.cache_dir.join("temp").join(key);

    if let Some(parent) = cache_path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    tokio::fs::write(&cache_path, data)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    Ok(cache_path)
  }

  async fn get_from_cache(&self, key: &str) -> Result<Option<Vec<u8>>> {
    let cache_path = self.cache_dir.join("temp").join(key);

    if cache_path.exists() {
      let data = tokio::fs::read(&cache_path)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
      Ok(Some(data))
    } else {
      Ok(None)
    }
  }

  async fn exists_in_cache(&self, key: &str) -> Result<bool> {
    let cache_path = self.cache_dir.join("temp").join(key);
    Ok(cache_path.exists())
  }

  async fn list_cached_items(&self) -> Result<Vec<String>> {
    let mut items = Vec::new();

    // Проверяем все поддиректории кэша
    for subdir in &["temp", "preview", "render"] {
      let dir_path = self.cache_dir.join(subdir);
      if dir_path.exists() {
        let mut entries = tokio::fs::read_dir(&dir_path)
          .await
          .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

        while let Some(entry) = entries
          .next_entry()
          .await
          .map_err(|e| VideoCompilerError::Io(e.to_string()))?
        {
          if entry.metadata().await.unwrap().is_file() {
            if let Some(name) = entry.file_name().to_str() {
              items.push(format!("{subdir}/{name}"));
            }
          }
        }
      }
    }

    Ok(items)
  }

  async fn get_item_info(&self, key: &str) -> Result<Option<CacheItemInfo>> {
    // Попробуем найти файл в разных поддиректориях
    for subdir in &["temp", "preview", "render"] {
      let cache_path = self.cache_dir.join(subdir).join(key);

      if cache_path.exists() {
        let metadata = tokio::fs::metadata(&cache_path)
          .await
          .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

        let created_at = metadata
          .created()
          .ok()
          .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
          .map(|d| chrono::Utc::now() - chrono::Duration::seconds(d.as_secs() as i64))
          .unwrap_or_else(chrono::Utc::now)
          .to_rfc3339();

        let last_accessed = metadata
          .accessed()
          .ok()
          .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
          .map(|d| chrono::Utc::now() - chrono::Duration::seconds(d.as_secs() as i64))
          .unwrap_or_else(chrono::Utc::now)
          .to_rfc3339();

        return Ok(Some(CacheItemInfo {
          key: key.to_string(),
          size_bytes: metadata.len(),
          created_at,
          last_accessed,
          access_count: 0, // В простой реализации не отслеживаем
        }));
      }
    }

    Ok(None)
  }

  async fn get_performance_metrics(&self) -> Result<CachePerformanceMetrics> {
    // Заглушка для демонстрации
    Ok(CachePerformanceMetrics {
      hit_rate_last_hour: 0.85,
      hit_rate_last_day: 0.82,
      average_response_time_ms: 12.5,
      peak_memory_usage_mb: 256.0,
      current_memory_usage_mb: 128.0,
      fragmentation_ratio: 0.15,
      top_accessed_keys: vec!["preview_key".to_string()],
      slow_operations: vec![],
    })
  }

  async fn reset_metrics(&self) -> Result<()> {
    log::info!("Сброс метрик кэша");
    // В реальной реализации сбросили бы счетчики
    Ok(())
  }

  async fn set_alert_thresholds(&self, _thresholds: CacheAlertThresholds) -> Result<()> {
    log::info!("Установка порогов алертов кэша");
    // В реальной реализации сохранили бы настройки
    Ok(())
  }

  async fn get_active_alerts(&self) -> Result<Vec<CacheAlert>> {
    log::debug!("Получение активных алертов кэша");
    // Заглушка - в реальности проверили бы пороги
    Ok(vec![])
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_cache_service_initialization() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());

    assert!(service.initialize().await.is_ok());
    assert!(temp_dir.path().join("render").exists());
    assert!(temp_dir.path().join("preview").exists());
    assert!(temp_dir.path().join("temp").exists());
  }

  #[tokio::test]
  async fn test_cache_operations() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Тест сохранения и получения
    let key = "test_key";
    let data = b"test data";

    let path = service.save_to_cache(key, data).await.unwrap();
    assert!(path.exists());

    let retrieved = service.get_from_cache(key).await.unwrap();
    assert_eq!(retrieved, Some(data.to_vec()));

    assert!(service.exists_in_cache(key).await.unwrap());
  }

  #[tokio::test]
  async fn test_cache_clear_operations() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Добавляем данные в разные категории кэша
    service
      .save_to_cache("temp_file", b"temp data")
      .await
      .unwrap();

    // Создаем файлы в разных директориях
    tokio::fs::write(temp_dir.path().join("render/render_file"), b"render data")
      .await
      .unwrap();
    tokio::fs::write(
      temp_dir.path().join("preview/preview_file"),
      b"preview data",
    )
    .await
    .unwrap();

    // Проверяем очистку preview кэша
    assert!(service.clear_preview_cache().await.is_ok());
    assert!(!temp_dir.path().join("preview/preview_file").exists());
    assert!(temp_dir.path().join("render/render_file").exists());

    // Проверяем очистку всего кэша
    assert!(service.clear_all().await.is_ok());
    assert!(!temp_dir.path().join("render/render_file").exists());
  }

  #[tokio::test]
  async fn test_cache_stats() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Добавляем тестовые данные
    service.save_to_cache("file1", b"data1").await.unwrap();
    service
      .save_to_cache("file2", b"data2 with more content")
      .await
      .unwrap();

    let stats = service.get_cache_stats().await.unwrap();
    assert!(stats.total_size_mb > 0.0);
    assert!(stats.total_files > 0);
    assert_eq!(stats.hit_rate, 0.0); // Начальное значение
  }

  #[tokio::test]
  async fn test_cache_optimization() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Создаем старый файл
    let old_file_path = temp_dir.path().join("temp/old_file");
    tokio::fs::write(&old_file_path, b"old data").await.unwrap();

    // Изменяем время модификации на 10 дней назад
    let ten_days_ago =
      std::time::SystemTime::now() - std::time::Duration::from_secs(10 * 24 * 3600);
    filetime::set_file_mtime(
      &old_file_path,
      filetime::FileTime::from_system_time(ten_days_ago),
    )
    .unwrap();

    // Создаем новый файл
    service
      .save_to_cache("new_file", b"new data")
      .await
      .unwrap();

    // Оптимизируем кэш (удаляем файлы старше 5 дней)
    let removed = service.optimize_cache(5).await.unwrap();
    assert_eq!(removed, 1);
    assert!(!old_file_path.exists());
    assert!(service.exists_in_cache("new_file").await.unwrap());
  }

  #[tokio::test]
  async fn test_list_cached_items() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Добавляем файлы в разные категории
    service.save_to_cache("temp_item", b"data").await.unwrap();
    tokio::fs::write(temp_dir.path().join("render/render_item"), b"data")
      .await
      .unwrap();
    tokio::fs::write(temp_dir.path().join("preview/preview_item"), b"data")
      .await
      .unwrap();

    let items = service.list_cached_items().await.unwrap();
    assert!(items.len() >= 3);
    assert!(items.iter().any(|i| i.contains("temp_item")));
    assert!(items.iter().any(|i| i.contains("render_item")));
    assert!(items.iter().any(|i| i.contains("preview_item")));
  }

  #[tokio::test]
  async fn test_get_item_info() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    let key = "test_info";
    let data = b"test data for info";
    service.save_to_cache(key, data).await.unwrap();

    let info = service.get_item_info(key).await.unwrap();
    assert!(info.is_some());

    let item_info = info.unwrap();
    assert_eq!(item_info.key, key);
    assert_eq!(item_info.size_bytes, data.len() as u64);
    assert!(!item_info.created_at.is_empty());
    assert!(!item_info.last_accessed.is_empty());
  }

  #[tokio::test]
  async fn test_cache_project_operations() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    let project_id = "test_project";
    let project_dir = temp_dir.path().join("projects").join(project_id);
    tokio::fs::create_dir_all(&project_dir).await.unwrap();
    tokio::fs::write(project_dir.join("project_data"), b"project specific data")
      .await
      .unwrap();

    assert!(project_dir.exists());
    assert!(service.clear_project_cache(project_id).await.is_ok());
    assert!(!project_dir.exists());
  }

  #[tokio::test]
  async fn test_performance_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    let metrics = service.get_performance_metrics().await.unwrap();
    assert!(metrics.hit_rate_last_hour >= 0.0 && metrics.hit_rate_last_hour <= 1.0);
    assert!(metrics.hit_rate_last_day >= 0.0 && metrics.hit_rate_last_day <= 1.0);
    assert!(metrics.average_response_time_ms >= 0.0);
    assert!(metrics.current_memory_usage_mb >= 0.0);
    assert!(metrics.fragmentation_ratio >= 0.0 && metrics.fragmentation_ratio <= 1.0);
  }

  #[tokio::test]
  async fn test_alert_thresholds() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    let thresholds = CacheAlertThresholds {
      min_hit_rate: 0.8,
      max_memory_usage_mb: 1024.0,
      max_response_time_ms: 100.0,
      max_fragmentation: 0.3,
    };

    assert!(service.set_alert_thresholds(thresholds).await.is_ok());

    let alerts = service.get_active_alerts().await.unwrap();
    assert_eq!(alerts.len(), 0); // Изначально нет алертов
  }

  #[tokio::test]
  async fn test_health_check() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Проверка здоровья должна пройти успешно
    assert!(service.health_check().await.is_ok());

    // Удаляем директорию кэша
    std::fs::remove_dir_all(temp_dir.path()).unwrap();

    // Теперь проверка здоровья должна провалиться
    assert!(service.health_check().await.is_err());
  }

  #[tokio::test]
  async fn test_cache_path() {
    let temp_dir = TempDir::new().unwrap();
    let expected_path = temp_dir.path().to_path_buf();
    let service = CacheServiceImpl::new(expected_path.clone());

    let cache_path = service.get_cache_path().await.unwrap();
    assert_eq!(cache_path, expected_path);
  }

  #[tokio::test]
  async fn test_reset_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let service = CacheServiceImpl::new(temp_dir.path().to_path_buf());
    service.initialize().await.unwrap();

    // Сбрасываем метрики
    assert!(service.reset_metrics().await.is_ok());

    // Проверяем, что метрики сброшены (в нашей заглушке просто проверяем успешность)
    let metrics = service.get_performance_metrics().await.unwrap();
    assert!(metrics.slow_operations.is_empty());
  }
}

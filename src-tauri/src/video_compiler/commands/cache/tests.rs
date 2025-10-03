//! Тесты для модуля cache

#[cfg(test)]
mod cache_tests {
  use super::super::*;
  use crate::video_compiler::cache::RenderCache;
  use crate::video_compiler::core::cache::{PreviewKey, RenderCacheData};
  use crate::video_compiler::services::{CacheService, CacheServiceImpl, ServiceContainer};
  use std::path::PathBuf;
  use std::sync::Arc;
  use std::time::SystemTime;
  use tempfile::TempDir;
  use tokio::sync::RwLock;

  #[test]
  fn test_project_id_validation() {
    // Valid project ID
    assert!(business_logic::validate_project_id("test-project").is_ok());
    assert!(business_logic::validate_project_id("123").is_ok());

    // Invalid: empty project ID
    assert!(business_logic::validate_project_id("").is_err());
  }

  #[test]
  fn test_max_age_days_validation() {
    // Valid age
    assert!(business_logic::validate_max_age_days(1).is_ok());
    assert!(business_logic::validate_max_age_days(30).is_ok());
    assert!(business_logic::validate_max_age_days(365).is_ok());

    // Invalid: zero days
    assert!(business_logic::validate_max_age_days(0).is_err());
  }

  #[test]
  fn test_cache_limits_calculation() {
    // Test standard calculation
    let (preview, metadata, render) = business_logic::calculate_cache_limits(100);
    assert_eq!(preview, 333);
    assert_eq!(metadata, 333);
    assert_eq!(render, 333);

    // Test small size
    let (p, m, r) = business_logic::calculate_cache_limits(10);
    assert_eq!(p, 33);
    assert_eq!(m, 33);
    assert_eq!(r, 33);
  }

  #[test]
  fn test_cache_limits_to_mb() {
    let mb = business_logic::cache_limits_to_mb(333, 333, 334);
    assert_eq!(mb, 100);

    let mb_small = business_logic::cache_limits_to_mb(10, 10, 10);
    assert_eq!(mb_small, 3);
  }

  #[test]
  fn test_mb_to_bytes_conversion() {
    assert_eq!(business_logic::mb_to_bytes(1.0), 1048576);
    assert_eq!(business_logic::mb_to_bytes(100.0), 104857600);
    assert_eq!(business_logic::mb_to_bytes(0.5), 524288);
  }

  #[test]
  fn test_cache_message_formatting() {
    let msg = business_logic::format_cache_cleared_message("рендеринга", None);
    assert_eq!(msg, "Кэш рендеринга успешно очищен");

    let msg_with_project = business_logic::format_cache_cleared_message("", Some("project-123"));
    assert_eq!(msg_with_project, "Кэш  проекта project-123 успешно очищен");

    let error_msg = business_logic::format_cache_error_message("очистить", None, "ошибка доступа");
    assert_eq!(error_msg, "Не удалось очистить кэш: ошибка доступа");

    let error_msg_project =
      business_logic::format_cache_error_message("очистить", Some("test"), "нет прав");
    assert_eq!(
      error_msg_project,
      "Не удалось очистить кэш проекта test: нет прав"
    );
  }

  #[tokio::test]
  async fn test_cache_service_operations() {
    let temp_dir = TempDir::new().unwrap();
    let cache_service = CacheServiceImpl::new(temp_dir.path().to_path_buf());

    // Test clear render cache
    let result = cache_service.clear_render_cache().await;
    assert!(result.is_ok());

    // Test clear project cache
    let result = cache_service.clear_project_cache("test-project").await;
    assert!(result.is_ok());

    // Test get cache stats
    let result = cache_service.get_cache_stats().await;
    assert!(result.is_ok());
    let stats = result.unwrap();
    assert_eq!(stats.total_size_mb, 0.0);
    assert_eq!(stats.total_files, 0);

    // Test optimize cache
    let result = cache_service.optimize_cache(7).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);

    // Test clear all
    let result = cache_service.clear_all().await;
    assert!(result.is_ok());

    // Test clear preview cache
    let result = cache_service.clear_preview_cache().await;
    assert!(result.is_ok());

    // Test get cache path
    let result = cache_service.get_cache_path().await;
    assert!(result.is_ok());
    let path = result.unwrap();
    assert_eq!(path, temp_dir.path());
  }

  #[tokio::test]
  async fn test_render_cache_operations() {
    let mut cache = RenderCache::new();

    // Test store and retrieve preview frame
    let preview_key = PreviewKey::new("media-1".to_string(), 0.0, (1920, 1080), 80);
    cache
      .store_preview(preview_key.clone(), vec![1, 2, 3, 4])
      .await
      .unwrap();
    let frame = cache.get_preview(&preview_key).await;
    assert!(frame.is_some());
    assert_eq!(frame.unwrap().image_data, vec![1, 2, 3, 4]);

    // Test store render data for project
    let render_data = RenderCacheData {
      cache_key: "project-1/chunk-1".to_string(),
      output_path: PathBuf::from("/tmp/output.mp4"),
      render_hash: "hash123".to_string(),
      created_at: SystemTime::now(),
      file_size: 1024,
    };
    cache
      .store_render_data("project-1/chunk-1".to_string(), render_data)
      .await
      .unwrap();

    // Test has project cache
    assert!(cache.has_project_cache("project-1"));
    assert!(!cache.has_project_cache("project-2"));

    // Test get cached projects
    let projects = cache.get_cached_projects();
    assert_eq!(projects.len(), 1);
    assert!(projects.contains(&"project-1".to_string()));

    // Test cache limits
    cache.set_cache_limits(100, 100, 100);
    let (preview, metadata, render) = cache.get_cache_limits();
    assert_eq!(preview, 100);
    assert_eq!(metadata, 100);
    assert_eq!(render, 100);

    // Test clear all
    cache.clear_all().await;
    let projects_after = cache.get_cached_projects();
    assert!(projects_after.is_empty());
  }

  #[tokio::test]
  async fn test_detailed_cache_stats_creation() {
    let cache = RenderCache::new();
    let detailed = business_logic::create_detailed_cache_stats(&cache);

    assert_eq!(detailed.preview_hits, 0);
    assert_eq!(detailed.preview_misses, 0);
    assert_eq!(detailed.render_hits, 0);
    assert_eq!(detailed.render_misses, 0);
    assert_eq!(detailed.preview_hit_ratio, 0.0);

    // Memory should be non-negative
    assert!(detailed.memory_usage_mb >= 0.0);
    // total_bytes is unsigned, so it's always >= 0
  }

  #[test]
  fn test_exported_cache_stats_creation() {
    let stats = CacheStats {
      total_size_mb: 150.5,
      preview_cache_size_mb: 50.0,
      render_cache_size_mb: 80.5,
      temp_files_size_mb: 20.0,
      total_files: 250,
      cache_hits: 100,
      cache_misses: 20,
      eviction_count: 5,
      hit_rate: 83.33,      // 100 hits / (100 hits + 20 misses) = 83.33%
      memory_pressure: 0.0, // Нет давления памяти
    };

    let exported = business_logic::create_exported_cache_stats(&stats);

    assert_eq!(exported.total_size_mb, 150.5);
    assert_eq!(exported.preview_cache_size_mb, 50.0);
    assert_eq!(exported.render_cache_size_mb, 80.5);
    assert_eq!(exported.temp_files_size_mb, 20.0);
    assert_eq!(exported.total_files, 250);
  }

  #[tokio::test]
  async fn test_concurrent_cache_access() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let mut handles = vec![];

    // Spawn multiple tasks accessing cache
    for i in 0..5 {
      let cache_clone = cache.clone();
      let handle = tokio::spawn(async move {
        let mut cache = cache_clone.write().await;
        let key = PreviewKey::new(format!("media-{i}"), 0.0, (1920, 1080), 80);
        cache.store_preview(key, vec![i as u8]).await.unwrap();
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      handle.await.unwrap();
    }

    // Verify all data was stored
    let mut cache_read = cache.write().await;
    for i in 0..5 {
      let key = PreviewKey::new(format!("media-{i}"), 0.0, (1920, 1080), 80);
      let frame = cache_read.get_preview(&key).await;
      assert!(frame.is_some());
      assert_eq!(frame.unwrap().image_data, vec![i as u8]);
    }
  }

  #[test]
  fn test_stats_json_serialization() {
    let stats = DetailedCacheStats {
      preview_hit_ratio: 0.75,
      memory_usage_mb: 50.0,
      preview_hits: 100,
      preview_misses: 33,
      render_hits: 50,
      render_misses: 10,
      total_bytes: 52428800,
      preview_bytes: 20971520,
      render_bytes: 31457280,
      metadata_bytes: 0,
    };

    let json = serde_json::to_string(&stats).unwrap();
    assert!(json.contains("preview_hit_ratio"));
    assert!(json.contains("0.75"));

    let deserialized: DetailedCacheStats = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.preview_hit_ratio, 0.75);
    assert_eq!(deserialized.memory_usage_mb, 50.0);
  }

  #[test]
  fn test_error_messages() {
    let error = crate::video_compiler::error::VideoCompilerError::InvalidParameter(
      "ID проекта не может быть пустым".to_string(),
    );
    assert!(error
      .to_string()
      .contains("ID проекта не может быть пустым"));

    let error = crate::video_compiler::error::VideoCompilerError::CacheError(
      "Не удалось очистить кэш".to_string(),
    );
    assert!(error.to_string().contains("Не удалось очистить кэш"));
  }

  #[tokio::test]
  async fn test_service_container_integration() {
    let temp_dir = TempDir::new().unwrap();
    let container = ServiceContainer::new("ffmpeg".to_string(), temp_dir.path().to_path_buf(), 2)
      .await
      .unwrap();

    // Test getting cache service
    let cache_service = container.get_cache_service();
    assert!(cache_service.is_some());

    // Test cache operations through service
    let service = cache_service.unwrap();
    let stats = service.get_cache_stats().await.unwrap();
    assert_eq!(stats.total_files, 0);
  }
}

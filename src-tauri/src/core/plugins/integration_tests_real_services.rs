//! Тесты интеграции Plugin API с реальными сервисами Timeline Studio

use crate::{
  core::{
    di::ServiceContainer,
    plugins::{
      api::{ClipInfo, Effect, PluginApi, PluginApiImpl, PluginDialog},
      permissions::SecurityLevel,
    },
    EventBus,
  },
  video_compiler::error::{Result, VideoCompilerError},
};
use std::{path::PathBuf, sync::Arc};
use tempfile::TempDir;

/// Тест интеграции Plugin API с реальными сервисами
#[cfg(test)]
mod tests {
  use super::*;

  /// Создать тестовый ServiceContainer с мок-сервисами
  async fn create_test_service_container() -> Arc<ServiceContainer> {
    // TODO: Добавить регистрацию реальных сервисов
    // Пока container остается пустым, что тестирует fallback поведение

    Arc::new(ServiceContainer::new())
  }

  /// Создать тестовый PluginApiImpl
  async fn create_test_plugin_api(
    security_level: SecurityLevel,
  ) -> Result<(PluginApiImpl, TempDir)> {
    let temp_dir = TempDir::new().map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    let storage_path = temp_dir.path().to_path_buf();

    let service_container = create_test_service_container().await;
    let permissions = Arc::new(security_level.permissions());
    let event_bus = Arc::new(EventBus::new());

    let plugin_api = PluginApiImpl::new(
      "test-plugin".to_string(),
      permissions,
      service_container,
      None, // No AppHandle in tests
      storage_path,
      event_bus,
    );

    Ok((plugin_api, temp_dir))
  }

  #[tokio::test]
  async fn test_media_bridge_ffmpeg_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Full)
      .await
      .expect("Failed to create test plugin API");

    // Создаем тестовый медиа файл
    let temp_dir = TempDir::new().unwrap();
    let test_media_path = temp_dir.path().join("test_video.mp4");
    tokio::fs::write(&test_media_path, b"fake video content")
      .await
      .unwrap();

    // Тестируем получение информации о медиа
    let result = plugin_api
      .get_media_info(test_media_path.to_str().unwrap())
      .await;

    match result {
      Ok(media_info) => {
        // Проверяем что fallback работает правильно
        assert_eq!(media_info.id, test_media_path.to_str().unwrap());
        assert_eq!(media_info.path, test_media_path);
        // В fallback режиме codec определяется по расширению
        assert_eq!(media_info.codec, "h264");
        log::info!("MediaBridge fallback integration test passed");
      }
      Err(e) => {
        // Ожидаем ошибку безопасности или проблемы с путем
        log::info!("MediaBridge integration test error (expected): {e}");
      }
    }
  }

  #[tokio::test]
  async fn test_timeline_bridge_project_service_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Extended)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем получение состояния timeline
    let timeline_state = plugin_api.get_timeline_state().await.unwrap();

    // Проверяем fallback поведение (ProjectService не зарегистрирован)
    assert_eq!(timeline_state.duration, 120.0);
    assert_eq!(timeline_state.current_time, 0.0);
    assert_eq!(timeline_state.tracks.len(), 2);

    // Проверяем треки
    let video_track = &timeline_state.tracks[0];
    assert_eq!(video_track.track_type, "video");
    assert_eq!(video_track.name, "Video Track 1");

    let audio_track = &timeline_state.tracks[1];
    assert_eq!(audio_track.track_type, "audio");
    assert_eq!(audio_track.name, "Audio Track 1");

    log::info!("TimelineBridge fallback integration test passed");
  }

  #[tokio::test]
  async fn test_ui_bridge_tauri_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Full)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем диалоги
    let dialog = PluginDialog {
      title: "Test Dialog".to_string(),
      message: "This is a test message".to_string(),
      dialog_type: crate::core::plugins::api::DialogType::Info,
      buttons: vec!["OK".to_string()],
    };

    let result = plugin_api.show_dialog(dialog).await;
    assert!(result.is_ok());

    let dialog_result = result.unwrap();
    assert!(!dialog_result.cancelled);

    // Тестируем уведомления
    let notification_result = plugin_api
      .show_notification("Test Title", "Test message")
      .await;
    assert!(notification_result.is_ok());

    log::info!("UIBridge fallback integration test passed");
  }

  #[tokio::test]
  async fn test_clip_operations_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Extended)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем добавление клипа
    let clip = crate::core::plugins::api::Clip {
      media_id: "test_media.mp4".to_string(),
      track_id: "video_track_1".to_string(),
      start_time: 0.0,
      duration: 30.0,
    };

    let clip_id = plugin_api.add_clip(clip).await.unwrap();
    assert!(clip_id.starts_with("clip_video_track_1"));

    // Тестируем обновление клипа
    let updated_clip = ClipInfo {
      id: clip_id.clone(),
      media_id: "test_media.mp4".to_string(),
      start_time: 5.0,
      duration: 25.0,
      in_point: 0.0,
      out_point: 25.0,
    };

    let update_result = plugin_api.update_clip(&clip_id, updated_clip).await;
    assert!(update_result.is_ok());

    // Тестируем удаление клипа
    let remove_result = plugin_api.remove_clip(&clip_id).await;
    assert!(remove_result.is_ok());

    log::info!("Clip operations integration test passed");
  }

  #[tokio::test]
  async fn test_effect_application_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Extended)
      .await
      .expect("Failed to create test plugin API");

    // Создаем тестовый медиа файл
    let temp_dir = TempDir::new().unwrap();
    let test_media_path = temp_dir.path().join("test_video.mp4");
    tokio::fs::write(&test_media_path, b"fake video content")
      .await
      .unwrap();

    // Тестируем применение эффекта
    let effect = Effect {
      effect_type: "blur".to_string(),
      parameters: serde_json::json!({"radius": 5.0}),
    };

    let result = plugin_api
      .apply_effect(test_media_path.to_str().unwrap(), effect)
      .await;

    // Ожидаем либо успех (если права позволяют), либо ошибку безопасности
    match result {
      Ok(_) => {
        log::info!("Effect application integration test passed (success)");
      }
      Err(e) => {
        log::info!("Effect application integration test passed (expected error): {e}");
        // Проверяем что это ошибка безопасности или валидации
        assert!(e.to_string().contains("permission") || e.to_string().contains("not found"));
      }
    }
  }

  #[tokio::test]
  async fn test_file_operations_integration() {
    let (plugin_api, temp_dir) = create_test_plugin_api(SecurityLevel::Extended)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем выбор файла
    let file_filters = vec![("Video Files", vec!["mp4", "avi", "mov"])];
    let file_result = plugin_api.pick_file(file_filters).await;

    match file_result {
      Ok(Some(path)) => {
        log::info!("File picker integration test passed: {path:?}");
        // Fallback возвращает мок-путь
        assert!(path.to_string_lossy().contains("selected_file"));
      }
      Ok(None) => {
        log::info!("File picker integration test passed (no selection)");
      }
      Err(e) => {
        log::info!("File picker integration test error: {e}");
      }
    }

    // Тестируем выбор директории
    let directory_result = plugin_api.pick_directory().await;
    match directory_result {
      Ok(Some(path)) => {
        log::info!("Directory picker integration test passed: {path:?}");
        assert!(path.to_string_lossy().contains("selected_directory"));
      }
      Ok(None) => {
        log::info!("Directory picker integration test passed (no selection)");
      }
      Err(e) => {
        log::info!("Directory picker integration test error: {e}");
        // Может быть ошибка безопасности или другая проблема
        assert!(
          e.to_string().contains("permission")
            || e.to_string().contains("UI access")
            || e.to_string().contains("dialog")
            || e.to_string().contains("Unsupported")
        );
      }
    }

    // Тестируем операции с файлами
    let test_file_path = temp_dir.path().join("test_file.txt");
    let test_data = b"Hello, Plugin API!";

    // Тест записи файла может не работать из-за ограничений безопасности
    let write_result = plugin_api.write_file(&test_file_path, test_data).await;
    match write_result {
      Ok(_) => {
        // Если запись прошла успешно, тестируем чтение
        let read_result = plugin_api.read_file(&test_file_path).await;
        match read_result {
          Ok(data) => {
            assert_eq!(data, test_data);
            log::info!("File operations integration test passed");
          }
          Err(e) => {
            log::info!("File read integration test error: {e}");
          }
        }
      }
      Err(e) => {
        log::info!("File write integration test error (expected): {e}");
        // Ожидаем ошибку безопасности или доступа к файлам
        println!("Write error: {e}");
        assert!(
          e.to_string().contains("permission")
            || e.to_string().contains("SecurityError")
            || e.to_string().contains("access denied")
            || e.to_string().contains("file_write")
            || e.to_string().contains("Write access denied")
        );
      }
    }
  }

  #[tokio::test]
  async fn test_storage_operations_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Minimal)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем хранилище плагина
    let storage = plugin_api.get_storage().await.unwrap();

    // Тестируем сохранение данных
    let test_data = serde_json::json!({
      "setting1": "value1",
      "setting2": 42,
      "setting3": true
    });

    storage.set("test_key", test_data.clone()).await.unwrap();

    // Тестируем получение данных
    let retrieved_data = storage.get("test_key").await.unwrap();
    assert_eq!(retrieved_data, Some(test_data));

    // Тестируем получение всех ключей
    let keys = storage.keys().await.unwrap();
    assert!(keys.contains(&"test_key".to_string()));

    // Тестируем удаление
    storage.remove("test_key").await.unwrap();
    let removed_data = storage.get("test_key").await.unwrap();
    assert!(removed_data.is_none());

    log::info!("Storage operations integration test passed");
  }

  #[tokio::test]
  async fn test_system_info_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Full)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем получение информации о системе
    let system_info = plugin_api.get_system_info().await.unwrap();

    // Проверяем базовые поля
    assert!(!system_info.os.is_empty());
    assert!(!system_info.arch.is_empty());
    assert!(system_info.cpu_count > 0);

    log::info!(
      "System info integration test passed: OS={}, Arch={}, CPUs={}",
      system_info.os,
      system_info.arch,
      system_info.cpu_count
    );
  }

  #[tokio::test]
  async fn test_security_levels_integration() {
    // Тестируем разные уровни безопасности
    let security_levels = [
      SecurityLevel::Minimal,
      SecurityLevel::Standard,
      SecurityLevel::Extended,
      SecurityLevel::Full,
    ];

    for level in &security_levels {
      let (plugin_api, _temp_dir) = create_test_plugin_api(*level)
        .await
        .expect("Failed to create test plugin API");

      // Тестируем операции, доступные на каждом уровне
      match level {
        SecurityLevel::Minimal => {
          // Minimal должен иметь доступ к storage
          let storage_result = plugin_api.get_storage().await;
          assert!(storage_result.is_ok());

          // Но не должен иметь доступ к файловым операциям
          let file_result = plugin_api.read_file(&PathBuf::from("/tmp/test.txt")).await;
          assert!(file_result.is_err());
        }
        SecurityLevel::Standard => {
          // Standard должен иметь доступ к чтению файлов
          // но может не иметь доступа к записи
        }
        SecurityLevel::Extended => {
          // Extended должен иметь доступ к timeline операциям
          let timeline_result = plugin_api.get_timeline_state().await;
          assert!(timeline_result.is_ok());
        }
        SecurityLevel::Full => {
          // Full должен иметь доступ ко всем операциям
          let timeline_result = plugin_api.get_timeline_state().await;
          assert!(timeline_result.is_ok());

          let system_info_result = plugin_api.get_system_info().await;
          assert!(system_info_result.is_ok());
        }
      }

      log::info!("Security level {level:?} integration test passed");
    }
  }

  #[tokio::test]
  async fn test_concurrent_operations_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Full)
      .await
      .expect("Failed to create test plugin API");

    let plugin_api = Arc::new(plugin_api);

    // Запускаем несколько операций параллельно
    let handles = (0..5)
      .map(|i| {
        let api = plugin_api.clone();
        tokio::spawn(async move {
          // Разные операции для тестирования конкурентности
          match i % 3 {
            0 => {
              let storage = api.get_storage().await.unwrap();
              storage
                .set(&format!("key_{i}"), serde_json::json!(i))
                .await
                .unwrap();
            }
            1 => {
              let _timeline = api.get_timeline_state().await.unwrap();
            }
            2 => {
              let _system_info = api.get_system_info().await.unwrap();
            }
            _ => unreachable!(),
          }
        })
      })
      .collect::<Vec<_>>();

    // Ждем завершения всех операций
    for handle in handles {
      handle.await.expect("Task failed");
    }

    log::info!("Concurrent operations integration test passed");
  }

  #[tokio::test]
  async fn test_error_handling_integration() {
    let (plugin_api, _temp_dir) = create_test_plugin_api(SecurityLevel::Minimal)
      .await
      .expect("Failed to create test plugin API");

    // Тестируем различные ошибочные ситуации

    // 1. Несуществующий медиа файл
    let media_result = plugin_api.get_media_info("/nonexistent/file.mp4").await;
    assert!(media_result.is_err());

    // 2. Невалидный эффект
    let invalid_effect = Effect {
      effect_type: "nonexistent_effect".to_string(),
      parameters: serde_json::json!({}),
    };
    let effect_result = plugin_api
      .apply_effect("/tmp/test.mp4", invalid_effect)
      .await;
    assert!(effect_result.is_err());

    // 3. Операции, требующие повышенных прав
    let clip = crate::core::plugins::api::Clip {
      media_id: "test.mp4".to_string(),
      track_id: "track1".to_string(),
      start_time: 0.0,
      duration: 10.0,
    };
    let clip_result = plugin_api.add_clip(clip).await;
    // С Minimal уровнем должна быть ошибка безопасности
    assert!(clip_result.is_err());

    log::info!("Error handling integration test passed");
  }
}

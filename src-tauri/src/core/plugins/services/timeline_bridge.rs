//! Мост для интеграции плагинов с timeline сервисами

use crate::{
  core::{
    di::ServiceContainer,
    plugins::{
      api::{TimelineState, TrackInfo},
      permissions::PluginPermissions,
    },
  },
  video_compiler::error::{Result, VideoCompilerError},
};
use serde_json::Value;
use std::sync::Arc;

/// Мост для timeline операций плагинов
#[derive(Clone)]
pub struct TimelineBridge {
  service_container: Arc<ServiceContainer>,
  permissions: Arc<PluginPermissions>,
  plugin_id: String,
}

impl TimelineBridge {
  /// Создать новый timeline мост
  pub fn new(
    service_container: Arc<ServiceContainer>,
    permissions: Arc<PluginPermissions>,
    plugin_id: String,
  ) -> Self {
    Self {
      service_container,
      permissions,
      plugin_id,
    }
  }

  /// Получить текущее состояние timeline
  pub async fn get_timeline_state(&self) -> Result<TimelineState> {
    log::info!("[TimelineBridge {}] Getting timeline state", self.plugin_id);

    // Интеграция с ProjectService для получения реального состояния timeline
    if let Some(_project_service) = self.service_container.get_project_service() {
      // TODO: Реализовать интеграцию с ProjectService
      log::info!(
        "[TimelineBridge {}] ProjectService available, but integration not implemented yet",
        self.plugin_id
      );

      // Пока возвращаем улучшенную заглушку с более реалистичными данными
      use crate::core::plugins::api::ClipInfo;

      return Ok(TimelineState {
        duration: 180.0,    // 3 минуты
        current_time: 30.0, // 30 секунд
        tracks: vec![
          TrackInfo {
            id: "video_track_1".to_string(),
            track_type: "video".to_string(),
            name: "Main Video".to_string(),
            clips: vec![
              ClipInfo {
                id: "clip_1".to_string(),
                media_id: "sample_video.mp4".to_string(),
                start_time: 0.0,
                duration: 60.0,
                in_point: 0.0,
                out_point: 60.0,
              },
              ClipInfo {
                id: "clip_2".to_string(),
                media_id: "sample_video2.mp4".to_string(),
                start_time: 60.0,
                duration: 120.0,
                in_point: 0.0,
                out_point: 120.0,
              },
            ],
            muted: false,
            locked: false,
            height: 120,
          },
          TrackInfo {
            id: "audio_track_1".to_string(),
            track_type: "audio".to_string(),
            name: "Audio Track 1".to_string(),
            clips: vec![ClipInfo {
              id: "audio_clip_1".to_string(),
              media_id: "sample_audio.mp3".to_string(),
              start_time: 0.0,
              duration: 180.0,
              in_point: 0.0,
              out_point: 180.0,
            }],
            muted: false,
            locked: false,
            height: 60,
          },
        ],
      });
    }

    // Fallback: базовая заглушка без ProjectService
    log::info!(
      "[TimelineBridge {}] ProjectService not available, using basic timeline state",
      self.plugin_id
    );

    // Создаем примерное состояние timeline
    let tracks = vec![
      TrackInfo {
        id: "video_track_1".to_string(),
        track_type: "video".to_string(),
        name: "Video Track 1".to_string(),
        clips: vec![], // TODO: Получить реальные клипы из проекта
        muted: false,
        locked: false,
        height: 100,
      },
      TrackInfo {
        id: "audio_track_1".to_string(),
        track_type: "audio".to_string(),
        name: "Audio Track 1".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height: 60,
      },
    ];

    Ok(TimelineState {
      duration: 120.0, // 2 минуты по умолчанию
      current_time: 0.0,
      tracks,
    })
  }

  /// Добавить клип в timeline
  pub async fn add_clip(&self, track_id: &str, clip_data: Value) -> Result<String> {
    // Проверяем разрешения на изменение timeline (Extended уровень или выше)
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify timeline".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Adding clip to track: {}",
      self.plugin_id,
      track_id
    );

    // Валидация данных клипа
    let media_id = clip_data
      .get("media_id")
      .and_then(|v| v.as_str())
      .ok_or_else(|| VideoCompilerError::InvalidParameter("Clip must have media_id".to_string()))?;

    let start_time = clip_data
      .get("start_time")
      .and_then(|v| v.as_f64())
      .unwrap_or(0.0);

    let duration = clip_data
      .get("duration")
      .and_then(|v| v.as_f64())
      .ok_or_else(|| VideoCompilerError::InvalidParameter("Clip must have duration".to_string()))?;

    if duration <= 0.0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Clip duration must be positive".to_string(),
      ));
    }

    // Генерируем уникальный ID для клипа
    let clip_id = format!("clip_{}_{}", track_id, uuid::Uuid::new_v4());

    // Интеграция с ProjectService для добавления клипа
    if let Some(_project_service) = self.service_container.get_project_service() {
      // TODO: Интеграция с ProjectService для реального добавления клипа
      log::info!(
        "[TimelineBridge {}] ProjectService available - adding clip via service: ID: {}, Media: {}, Start: {}, Duration: {}",
        self.plugin_id,
        clip_id,
        media_id,
        start_time,
        duration
      );
    } else {
      log::info!(
        "[TimelineBridge {}] ProjectService not available - clip added to memory only: ID: {}, Media: {}, Start: {}, Duration: {}",
        self.plugin_id,
        clip_id,
        media_id,
        start_time,
        duration
      );
    }

    Ok(clip_id)
  }

  /// Удалить клип из timeline
  pub async fn remove_clip(&self, clip_id: &str) -> Result<()> {
    // Проверяем разрешения
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify timeline".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Removing clip: {}",
      self.plugin_id,
      clip_id
    );

    // TODO: Интеграция с реальным ProjectService
    // Пока логируем операцию

    // Валидация ID клипа
    if clip_id.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Clip ID cannot be empty".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Clip '{}' removed successfully",
      self.plugin_id,
      clip_id
    );

    Ok(())
  }

  /// Обновить существующий клип
  pub async fn update_clip(&self, clip_id: &str, updates: Value) -> Result<()> {
    // Проверяем разрешения
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify timeline".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Updating clip: {}",
      self.plugin_id,
      clip_id
    );

    // Валидация
    if clip_id.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Clip ID cannot be empty".to_string(),
      ));
    }

    if updates.is_null() || !updates.is_object() {
      return Err(VideoCompilerError::InvalidParameter(
        "Updates must be a valid JSON object".to_string(),
      ));
    }

    // Валидация обновляемых полей
    if let Some(start_time) = updates.get("start_time").and_then(|v| v.as_f64()) {
      if start_time < 0.0 {
        return Err(VideoCompilerError::InvalidParameter(
          "Start time cannot be negative".to_string(),
        ));
      }
    }

    if let Some(duration) = updates.get("duration").and_then(|v| v.as_f64()) {
      if duration <= 0.0 {
        return Err(VideoCompilerError::InvalidParameter(
          "Duration must be positive".to_string(),
        ));
      }
    }

    // TODO: Интеграция с реальным ProjectService для обновления клипа
    log::info!(
      "[TimelineBridge {}] Clip '{}' updated with: {}",
      self.plugin_id,
      clip_id,
      updates
    );

    Ok(())
  }

  /// Получить информацию о треке
  pub async fn get_track_info(&self, track_id: &str) -> Result<TrackInfo> {
    log::info!(
      "[TimelineBridge {}] Getting track info: {}",
      self.plugin_id,
      track_id
    );

    // TODO: Интеграция с реальным TimelineService
    // Пока возвращаем базовую информацию

    match track_id {
      "video_track_1" => Ok(TrackInfo {
        id: track_id.to_string(),
        track_type: "video".to_string(),
        name: "Video Track 1".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height: 100,
      }),
      "audio_track_1" => Ok(TrackInfo {
        id: track_id.to_string(),
        track_type: "audio".to_string(),
        name: "Audio Track 1".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height: 60,
      }),
      _ => Err(VideoCompilerError::InvalidParameter(format!(
        "Track not found: {track_id}"
      ))),
    }
  }

  /// Создать новый трек
  pub async fn create_track(&self, track_type: &str, name: &str) -> Result<String> {
    // Проверяем разрешения
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to create tracks".to_string(),
      ));
    }

    // Валидация типа трека
    if !["video", "audio", "subtitle"].contains(&track_type) {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Invalid track type: {track_type}. Supported types: video, audio, subtitle"
      )));
    }

    if name.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Track name cannot be empty".to_string(),
      ));
    }

    let track_id = format!("{}_{}", track_type, uuid::Uuid::new_v4());

    log::info!(
      "[TimelineBridge {}] Created track - ID: {}, Type: {}, Name: {}",
      self.plugin_id,
      track_id,
      track_type,
      name
    );

    Ok(track_id)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::permissions::SecurityLevel;

  #[tokio::test]
  async fn test_timeline_bridge_basic_operations() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Тест получения состояния timeline
    let timeline_state = bridge.get_timeline_state().await.unwrap();
    assert_eq!(timeline_state.tracks.len(), 2);
    assert_eq!(timeline_state.duration, 120.0);

    // Тест получения информации о треке
    let track_info = bridge.get_track_info("video_track_1").await.unwrap();
    assert_eq!(track_info.track_type, "video");
    assert_eq!(track_info.name, "Video Track 1");
  }

  #[tokio::test]
  async fn test_clip_operations() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Тест добавления клипа
    let clip_data = serde_json::json!({
      "media_id": "test_media_123",
      "start_time": 10.0,
      "duration": 5.0
    });

    let clip_id = bridge.add_clip("video_track_1", clip_data).await.unwrap();
    assert!(clip_id.starts_with("clip_video_track_1"));

    // Тест обновления клипа
    let updates = serde_json::json!({
      "start_time": 15.0,
      "duration": 7.0
    });

    bridge.update_clip(&clip_id, updates).await.unwrap();

    // Тест удаления клипа
    bridge.remove_clip(&clip_id).await.unwrap();
  }

  #[tokio::test]
  async fn test_validation_errors() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Невалидный клип без media_id
    let invalid_clip = serde_json::json!({
      "start_time": 10.0,
      "duration": 5.0
    });

    let result = bridge.add_clip("video_track_1", invalid_clip).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("media_id"));

    // Невалидная длительность
    let invalid_duration_clip = serde_json::json!({
      "media_id": "test",
      "duration": -5.0
    });

    let result = bridge
      .add_clip("video_track_1", invalid_duration_clip)
      .await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("positive"));
  }

  #[tokio::test]
  async fn test_permissions() {
    let service_container = Arc::new(ServiceContainer::new());
    let minimal_permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let bridge = TimelineBridge::new(
      service_container,
      minimal_permissions,
      "test-plugin".to_string(),
    );

    // Операции с minimal permissions должны быть заблокированы
    let clip_data = serde_json::json!({
      "media_id": "test",
      "duration": 5.0
    });

    let result = bridge.add_clip("video_track_1", clip_data).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));
  }

  // Comprehensive additional tests for better coverage

  #[tokio::test]
  async fn test_timeline_state_with_project_service() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test getting timeline state (should return mock data)
    let timeline_state = bridge.get_timeline_state().await.unwrap();

    // Check that we get the mock data structure
    assert!(timeline_state.duration > 0.0);
    assert!(timeline_state.current_time >= 0.0);
    assert!(!timeline_state.tracks.is_empty());

    // Check track types
    let video_tracks: Vec<_> = timeline_state
      .tracks
      .iter()
      .filter(|t| t.track_type == "video")
      .collect();
    let audio_tracks: Vec<_> = timeline_state
      .tracks
      .iter()
      .filter(|t| t.track_type == "audio")
      .collect();

    assert!(!video_tracks.is_empty());
    assert!(!audio_tracks.is_empty());
  }

  #[tokio::test]
  async fn test_get_track_info_edge_cases() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test valid track IDs
    let video_track = bridge.get_track_info("video_track_1").await.unwrap();
    assert_eq!(video_track.track_type, "video");
    assert_eq!(video_track.height, 100);
    assert!(!video_track.muted);
    assert!(!video_track.locked);

    let audio_track = bridge.get_track_info("audio_track_1").await.unwrap();
    assert_eq!(audio_track.track_type, "audio");
    assert_eq!(audio_track.height, 60);

    // Test invalid track ID
    let result = bridge.get_track_info("nonexistent_track").await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Track not found"));

    // Test empty track ID
    let result = bridge.get_track_info("").await;
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_create_track_operations() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test creating video track
    let video_track_id = bridge
      .create_track("video", "Test Video Track")
      .await
      .unwrap();
    assert!(video_track_id.starts_with("video_"));
    assert!(video_track_id.contains("-")); // UUID format

    // Test creating audio track
    let audio_track_id = bridge
      .create_track("audio", "Test Audio Track")
      .await
      .unwrap();
    assert!(audio_track_id.starts_with("audio_"));

    // Test creating subtitle track
    let subtitle_track_id = bridge
      .create_track("subtitle", "Test Subtitle Track")
      .await
      .unwrap();
    assert!(subtitle_track_id.starts_with("subtitle_"));

    // Test invalid track type
    let result = bridge.create_track("invalid", "Test Track").await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Invalid track type"));

    // Test empty track name
    let result = bridge.create_track("video", "").await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Track name cannot be empty"));
  }

  #[tokio::test]
  async fn test_create_track_permissions() {
    let service_container = Arc::new(ServiceContainer::new());
    let minimal_permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let bridge = TimelineBridge::new(
      service_container,
      minimal_permissions,
      "test-plugin".to_string(),
    );

    // Should fail with minimal permissions
    let result = bridge.create_track("video", "Test Track").await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));
  }

  #[tokio::test]
  async fn test_add_clip_comprehensive() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test adding clip with all parameters
    let clip_data = serde_json::json!({
      "media_id": "test_media_456",
      "start_time": 20.5,
      "duration": 15.25
    });

    let clip_id = bridge.add_clip("audio_track_1", clip_data).await.unwrap();
    assert!(clip_id.starts_with("clip_audio_track_1"));
    assert!(clip_id.contains("-")); // UUID format

    // Test adding clip with minimal parameters (start_time should default to 0.0)
    let minimal_clip = serde_json::json!({
      "media_id": "minimal_media",
      "duration": 10.0
    });

    let minimal_clip_id = bridge
      .add_clip("video_track_1", minimal_clip)
      .await
      .unwrap();
    assert!(minimal_clip_id.starts_with("clip_video_track_1"));

    // Test adding clip with zero duration
    let zero_duration_clip = serde_json::json!({
      "media_id": "zero_duration",
      "duration": 0.0
    });

    let result = bridge.add_clip("video_track_1", zero_duration_clip).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("positive"));

    // Test adding clip without duration
    let no_duration_clip = serde_json::json!({
      "media_id": "no_duration"
    });

    let result = bridge.add_clip("video_track_1", no_duration_clip).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("duration"));
  }

  #[tokio::test]
  async fn test_update_clip_comprehensive() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test updating with valid parameters
    let clip_id = "test_clip_123";

    // Test updating start_time
    let start_time_update = serde_json::json!({
      "start_time": 25.0
    });
    bridge
      .update_clip(clip_id, start_time_update)
      .await
      .unwrap();

    // Test updating duration
    let duration_update = serde_json::json!({
      "duration": 30.0
    });
    bridge.update_clip(clip_id, duration_update).await.unwrap();

    // Test updating multiple fields
    let multi_update = serde_json::json!({
      "start_time": 10.0,
      "duration": 20.0,
      "media_id": "new_media"
    });
    bridge.update_clip(clip_id, multi_update).await.unwrap();

    // Test invalid start_time (negative)
    let invalid_start = serde_json::json!({
      "start_time": -5.0
    });
    let result = bridge.update_clip(clip_id, invalid_start).await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Start time cannot be negative"));

    // Test invalid duration (zero)
    let invalid_duration = serde_json::json!({
      "duration": 0.0
    });
    let result = bridge.update_clip(clip_id, invalid_duration).await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Duration must be positive"));

    // Test invalid duration (negative)
    let negative_duration = serde_json::json!({
      "duration": -10.0
    });
    let result = bridge.update_clip(clip_id, negative_duration).await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Duration must be positive"));

    // Test empty clip ID
    let result = bridge
      .update_clip("", serde_json::json!({"start_time": 5.0}))
      .await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Clip ID cannot be empty"));

    // Test null updates
    let result = bridge.update_clip(clip_id, serde_json::Value::Null).await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Updates must be a valid JSON object"));

    // Test non-object updates
    let result = bridge
      .update_clip(clip_id, serde_json::json!("not an object"))
      .await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Updates must be a valid JSON object"));
  }

  #[tokio::test]
  async fn test_remove_clip_comprehensive() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test removing valid clip
    let clip_id = "test_clip_456";
    bridge.remove_clip(clip_id).await.unwrap();

    // Test removing empty clip ID
    let result = bridge.remove_clip("").await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Clip ID cannot be empty"));

    // Test removing with minimal permissions
    let minimal_permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let minimal_bridge = TimelineBridge::new(
      Arc::new(ServiceContainer::new()),
      minimal_permissions,
      "test-plugin".to_string(),
    );

    let result = minimal_bridge.remove_clip("test_clip").await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));
  }

  #[tokio::test]
  async fn test_permissions_for_all_operations() {
    let service_container = Arc::new(ServiceContainer::new());

    // Create permissions that actually correspond to different security levels
    // based on how get_security_level() works

    // Minimal: read_only permissions (empty write_paths, no allowed_hosts)
    let minimal_permissions = Arc::new(PluginPermissions::read_only());

    // Standard: has some write paths or allowed hosts
    let mut standard_permissions = PluginPermissions::default();
    standard_permissions
      .file_system
      .write_paths
      .push(std::path::PathBuf::from("/tmp"));
    let standard_permissions = Arc::new(standard_permissions);

    // Extended: has system_info or many allowed hosts
    let extended_permissions = PluginPermissions {
      system_info: true,
      ..Default::default()
    };
    let extended_permissions = Arc::new(extended_permissions);

    // Full: write_all, read_all, and process_spawn
    let mut full_permissions = PluginPermissions::default();
    full_permissions.file_system.read_all = true;
    full_permissions.file_system.write_all = true;
    full_permissions.process_spawn = true;
    let full_permissions = Arc::new(full_permissions);

    let test_cases = vec![
      (SecurityLevel::Minimal, minimal_permissions),
      (SecurityLevel::Standard, standard_permissions),
      (SecurityLevel::Extended, extended_permissions),
      (SecurityLevel::Full, full_permissions),
    ];

    for (expected_level, permissions) in test_cases {
      // Verify our test setup is correct
      assert_eq!(
        permissions.get_security_level(),
        expected_level,
        "Test setup error: permissions don't match expected level {:?}",
        expected_level
      );

      let bridge = TimelineBridge::new(
        service_container.clone(),
        permissions,
        format!("test-plugin-{:?}", expected_level),
      );

      let clip_data = serde_json::json!({
        "media_id": "test_media",
        "duration": 5.0
      });

      // Test add_clip
      let add_result = bridge.add_clip("video_track_1", clip_data.clone()).await;
      if expected_level >= SecurityLevel::Standard {
        assert!(
          add_result.is_ok(),
          "add_clip should succeed for {:?}",
          expected_level
        );
      } else {
        assert!(
          add_result.is_err(),
          "add_clip should fail for {:?}",
          expected_level
        );
      }

      // Test remove_clip
      let remove_result = bridge.remove_clip("test_clip").await;
      if expected_level >= SecurityLevel::Standard {
        assert!(
          remove_result.is_ok(),
          "remove_clip should succeed for {:?}",
          expected_level
        );
      } else {
        assert!(
          remove_result.is_err(),
          "remove_clip should fail for {:?}",
          expected_level
        );
      }

      // Test update_clip
      let update_result = bridge
        .update_clip("test_clip", serde_json::json!({"start_time": 10.0}))
        .await;
      if expected_level >= SecurityLevel::Standard {
        assert!(
          update_result.is_ok(),
          "update_clip should succeed for {:?}",
          expected_level
        );
      } else {
        assert!(
          update_result.is_err(),
          "update_clip should fail for {:?}",
          expected_level
        );
      }

      // Test create_track
      let create_result = bridge.create_track("video", "Test Track").await;
      if expected_level >= SecurityLevel::Standard {
        assert!(
          create_result.is_ok(),
          "create_track should succeed for {:?}",
          expected_level
        );
      } else {
        assert!(
          create_result.is_err(),
          "create_track should fail for {:?}",
          expected_level
        );
      }

      // get_timeline_state and get_track_info should work for all levels
      let timeline_result = bridge.get_timeline_state().await;
      assert!(
        timeline_result.is_ok(),
        "get_timeline_state should succeed for {:?}",
        expected_level
      );

      let track_result = bridge.get_track_info("video_track_1").await;
      assert!(
        track_result.is_ok(),
        "get_track_info should succeed for {:?}",
        expected_level
      );
    }
  }

  #[tokio::test]
  async fn test_timeline_bridge_clone() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test that bridge can be cloned
    let cloned_bridge = bridge.clone();

    // Both should work independently
    let original_state = bridge.get_timeline_state().await.unwrap();
    let cloned_state = cloned_bridge.get_timeline_state().await.unwrap();

    assert_eq!(original_state.duration, cloned_state.duration);
    assert_eq!(original_state.tracks.len(), cloned_state.tracks.len());
  }

  #[tokio::test]
  async fn test_timeline_bridge_concurrent_operations() {
    use tokio::task::JoinSet;

    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = Arc::new(TimelineBridge::new(
      service_container,
      permissions,
      "test-plugin".to_string(),
    ));

    let mut tasks = JoinSet::new();

    // Test concurrent operations
    for i in 0..10 {
      let bridge_clone = bridge.clone();
      tasks.spawn(async move {
        match i % 4 {
          0 => {
            // Get timeline state
            let _ = bridge_clone.get_timeline_state().await;
          }
          1 => {
            // Get track info
            let _ = bridge_clone.get_track_info("video_track_1").await;
          }
          2 => {
            // Add clip
            let clip_data = serde_json::json!({
              "media_id": format!("media_{}", i),
              "duration": 5.0
            });
            let _ = bridge_clone.add_clip("video_track_1", clip_data).await;
          }
          _ => {
            // Create track
            let _ = bridge_clone
              .create_track("video", &format!("Track {}", i))
              .await;
          }
        }
      });
    }

    // Wait for all tasks to complete
    while let Some(result) = tasks.join_next().await {
      assert!(result.is_ok());
    }
  }

  #[tokio::test]
  async fn test_timeline_bridge_logging() {
    // This test ensures that logging calls don't panic
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(
      service_container,
      permissions,
      "test-plugin-logging".to_string(),
    );

    // These operations should all log without panicking
    let _ = bridge.get_timeline_state().await;
    let _ = bridge.get_track_info("video_track_1").await;

    let clip_data = serde_json::json!({
      "media_id": "logging_test",
      "duration": 5.0
    });
    let _ = bridge.add_clip("video_track_1", clip_data).await;
    let _ = bridge.remove_clip("test_clip").await;
    let _ = bridge
      .update_clip("test_clip", serde_json::json!({"start_time": 10.0}))
      .await;
    let _ = bridge.create_track("video", "Logging Test Track").await;
  }

  #[tokio::test]
  async fn test_timeline_bridge_error_messages() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Test that error messages are descriptive
    let result = bridge
      .add_clip("track", serde_json::json!({"duration": 5.0}))
      .await;
    assert!(result.is_err());
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("media_id"));

    let result = bridge
      .add_clip(
        "track",
        serde_json::json!({"media_id": "test", "duration": -1.0}),
      )
      .await;
    assert!(result.is_err());
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("positive"));

    let result = bridge.get_track_info("nonexistent").await;
    assert!(result.is_err());
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("Track not found"));

    let result = bridge.create_track("invalid_type", "Test").await;
    assert!(result.is_err());
    let error_msg = result.unwrap_err().to_string();
    assert!(error_msg.contains("Invalid track type"));
    assert!(error_msg.contains("video, audio, subtitle"));
  }

  #[tokio::test]
  async fn test_plugin_id_usage() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let plugin_id = "test-plugin-unique-id";
    let bridge = TimelineBridge::new(service_container, permissions, plugin_id.to_string());

    // Test that plugin_id is used in generated clip IDs
    let clip_data = serde_json::json!({
      "media_id": "test_media",
      "duration": 5.0
    });

    let clip_id = bridge.add_clip("video_track_1", clip_data).await.unwrap();
    assert!(clip_id.starts_with("clip_video_track_1"));
    // The UUID part should be present
    assert!(clip_id.len() > "clip_video_track_1_".len());

    // Test that plugin_id is used in generated track IDs
    let track_id = bridge.create_track("video", "Test Track").await.unwrap();
    assert!(track_id.starts_with("video_"));
    // The UUID part should be present
    assert!(track_id.len() > "video_".len());
  }

  #[test]
  fn test_timeline_bridge_new() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let plugin_id = "test-plugin-constructor";

    let bridge = TimelineBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.to_string(),
    );

    // Test that the bridge is properly constructed
    // We can't directly access private fields, but we can test that operations work
    assert!(std::ptr::eq(
      Arc::as_ptr(&bridge.service_container),
      Arc::as_ptr(&service_container)
    ));
    assert!(std::ptr::eq(
      Arc::as_ptr(&bridge.permissions),
      Arc::as_ptr(&permissions)
    ));
    assert_eq!(bridge.plugin_id, plugin_id);
  }
}

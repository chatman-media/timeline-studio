//! Простой пример плагина для загрузки видео на YouTube

use crate::core::plugins::{
  context::PluginContext,
  plugin::{
    AppEventType, Plugin, PluginCommand, PluginMetadata, PluginResponse, PluginType, Version,
  },
};
use crate::core::AppEvent;
use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Настройки загрузки на YouTube
#[derive(Debug, Clone, Serialize, Deserialize)]
struct YouTubeUploadSettings {
  /// Заголовок видео
  title: String,
  /// Описание
  description: String,
  /// Теги
  tags: Vec<String>,
  /// Категория
  category: YouTubeCategory,
  /// Приватность
  privacy: PrivacyStatus,
}

/// Категории YouTube
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum YouTubeCategory {
  Education,
  Entertainment,
  Gaming,
  Music,
  Other,
}

/// Статус приватности
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum PrivacyStatus {
  Private,
  Unlisted,
  Public,
}

/// Статус загрузки
#[derive(Debug, Clone, Serialize, Deserialize)]
struct UploadStatus {
  /// ID загрузки
  upload_id: String,
  /// Прогресс (0-100)
  progress: f32,
  /// Статус
  status: UploadState,
  /// URL видео (если загружено)
  video_url: Option<String>,
}

/// Состояние загрузки
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum UploadState {
  Preparing,
  Uploading,
  Processing,
  Completed,
  Failed,
}

/// Простой плагин для загрузки на YouTube
pub struct YouTubeUploaderPlugin {
  context: Option<PluginContext>,
  /// Активные загрузки
  active_uploads: Arc<RwLock<HashMap<String, UploadStatus>>>,
}

impl Default for YouTubeUploaderPlugin {
  fn default() -> Self {
    Self {
      context: None,
      active_uploads: Arc::new(RwLock::new(HashMap::new())),
    }
  }
}

#[async_trait]
impl Plugin for YouTubeUploaderPlugin {
  fn metadata(&self) -> &PluginMetadata {
    static METADATA: std::sync::OnceLock<PluginMetadata> = std::sync::OnceLock::new();
    METADATA.get_or_init(|| PluginMetadata {
      id: "youtube-uploader".to_string(),
      name: "YouTube Uploader".to_string(),
      version: Version::new(1, 0, 0),
      author: "Timeline Studio Team".to_string(),
      description: "Upload rendered videos directly to YouTube".to_string(),
      plugin_type: PluginType::Exporter,
      homepage: Some("https://timeline.studio/plugins/youtube-uploader".to_string()),
      license: Some("MIT".to_string()),
      dependencies: vec![],
      min_app_version: Some(Version::new(1, 0, 0)),
    })
  }

  async fn initialize(&mut self, context: PluginContext) -> Result<()> {
    log::info!("Initializing YouTube Uploader Plugin");
    self.context = Some(context);
    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    log::info!("Shutting down YouTube Uploader Plugin");
    self.context = None;
    Ok(())
  }

  async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
    match command.command.as_str() {
      "authorize" => Ok(PluginResponse {
        command_id: command.id,
        success: true,
        data: Some(json!({
            "authorized": true,
            "message": "Authorization would open in browser"
        })),
        error: None,
      }),
      "upload" => {
        let video_path = command
          .params
          .get("video_path")
          .and_then(|v| v.as_str())
          .ok_or_else(|| VideoCompilerError::InvalidParameter("Missing video_path".to_string()))?;

        let settings = command
          .params
          .get("settings")
          .ok_or_else(|| VideoCompilerError::InvalidParameter("Missing settings".to_string()))
          .and_then(|v| {
            serde_json::from_value::<YouTubeUploadSettings>(v.clone())
              .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))
          })?;

        // Генерируем ID загрузки
        let upload_id = uuid::Uuid::new_v4().to_string();

        // Создаем статус загрузки
        let status = UploadStatus {
          upload_id: upload_id.clone(),
          progress: 0.0,
          status: UploadState::Preparing,
          video_url: None,
        };

        // Сохраняем статус
        {
          let mut uploads = self.active_uploads.write().await;
          uploads.insert(upload_id.clone(), status);
        }

        // Запускаем симуляцию загрузки
        let uploads_clone = self.active_uploads.clone();
        let upload_id_clone = upload_id.clone();
        tokio::spawn(async move {
          // Симулируем загрузку
          for i in 0..=10 {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

            let mut uploads = uploads_clone.write().await;
            if let Some(status) = uploads.get_mut(&upload_id_clone) {
              status.progress = i as f32 * 10.0;
              if i == 10 {
                status.status = UploadState::Completed;
                status.video_url = Some(format!(
                  "https://youtube.com/watch?v={}",
                  uuid::Uuid::new_v4()
                ));
              }
            }
          }
        });

        log::info!(
          "Started upload {} for video: {} with title: {}",
          upload_id,
          video_path,
          settings.title
        );

        Ok(PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(json!({ "upload_id": upload_id })),
          error: None,
        })
      }
      "get_status" => {
        let upload_id = command
          .params
          .get("upload_id")
          .and_then(|v| v.as_str())
          .ok_or_else(|| VideoCompilerError::InvalidParameter("Missing upload_id".to_string()))?;

        let uploads = self.active_uploads.read().await;
        let status = uploads
          .get(upload_id)
          .cloned()
          .ok_or_else(|| VideoCompilerError::InvalidParameter("Upload not found".to_string()))?;

        Ok(PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(serde_json::to_value(&status)?),
          error: None,
        })
      }
      "list_uploads" => {
        let uploads = self.active_uploads.read().await;
        let uploads_list: Vec<_> = uploads.values().cloned().collect();

        Ok(PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(json!({ "uploads": uploads_list })),
          error: None,
        })
      }
      _ => Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown command: {}",
        command.command
      ))),
    }
  }

  fn subscribed_events(&self) -> Vec<AppEventType> {
    vec![AppEventType::RenderCompleted]
  }

  async fn handle_event(&self, event: &AppEvent) -> Result<()> {
    if let AppEvent::RenderCompleted { output_path, .. } = event {
      log::info!("YouTube Uploader: Render completed at {output_path}");
    }
    Ok(())
  }

  async fn suspend(&mut self) -> Result<()> {
    log::info!("Suspending YouTube Uploader Plugin");
    Ok(())
  }

  async fn resume(&mut self) -> Result<()> {
    log::info!("Resuming YouTube Uploader Plugin");
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_upload_settings_serialization() {
    let settings = YouTubeUploadSettings {
      title: "Test Video".to_string(),
      description: "Test Description".to_string(),
      tags: vec!["test".to_string(), "video".to_string()],
      category: YouTubeCategory::Education,
      privacy: PrivacyStatus::Private,
    };

    let json = serde_json::to_string(&settings).unwrap();
    let deserialized: YouTubeUploadSettings = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.title, settings.title);
    assert_eq!(deserialized.tags.len(), 2);
  }

  #[test]
  fn test_youtube_category_serialization() {
    assert_eq!(
      serde_json::to_string(&YouTubeCategory::Education).unwrap(),
      "\"education\""
    );
    assert_eq!(
      serde_json::to_string(&YouTubeCategory::Entertainment).unwrap(),
      "\"entertainment\""
    );
    assert_eq!(
      serde_json::to_string(&YouTubeCategory::Gaming).unwrap(),
      "\"gaming\""
    );
    assert_eq!(
      serde_json::to_string(&YouTubeCategory::Music).unwrap(),
      "\"music\""
    );
    assert_eq!(
      serde_json::to_string(&YouTubeCategory::Other).unwrap(),
      "\"other\""
    );
  }

  #[test]
  fn test_privacy_status_serialization() {
    assert_eq!(
      serde_json::to_string(&PrivacyStatus::Private).unwrap(),
      "\"private\""
    );
    assert_eq!(
      serde_json::to_string(&PrivacyStatus::Unlisted).unwrap(),
      "\"unlisted\""
    );
    assert_eq!(
      serde_json::to_string(&PrivacyStatus::Public).unwrap(),
      "\"public\""
    );
  }

  #[test]
  fn test_upload_state_serialization() {
    assert_eq!(
      serde_json::to_string(&UploadState::Preparing).unwrap(),
      "\"preparing\""
    );
    assert_eq!(
      serde_json::to_string(&UploadState::Uploading).unwrap(),
      "\"uploading\""
    );
    assert_eq!(
      serde_json::to_string(&UploadState::Processing).unwrap(),
      "\"processing\""
    );
    assert_eq!(
      serde_json::to_string(&UploadState::Completed).unwrap(),
      "\"completed\""
    );
    assert_eq!(
      serde_json::to_string(&UploadState::Failed).unwrap(),
      "\"failed\""
    );
  }

  #[test]
  fn test_plugin_metadata() {
    let plugin = YouTubeUploaderPlugin::default();
    let metadata = plugin.metadata();

    assert_eq!(metadata.id, "youtube-uploader");
    assert_eq!(metadata.name, "YouTube Uploader");
    assert_eq!(metadata.version, Version::new(1, 0, 0));
    assert_eq!(metadata.plugin_type, PluginType::Exporter);
    assert!(metadata.dependencies.is_empty());
  }

  #[tokio::test]
  async fn test_plugin_shutdown() {
    let mut plugin = YouTubeUploaderPlugin::default();

    // Add a fake upload
    plugin.active_uploads.write().await.insert(
      "test-upload".to_string(),
      UploadStatus {
        upload_id: "test-upload".to_string(),
        progress: 50.0,
        status: UploadState::Uploading,
        video_url: None,
      },
    );

    let result = plugin.shutdown().await;
    assert!(result.is_ok());
    assert!(plugin.context.is_none());
    // Note: shutdown doesn't clear active uploads, it just cleans up the context
  }

  #[test]
  fn test_subscribed_events() {
    let plugin = YouTubeUploaderPlugin::default();
    let events = plugin.subscribed_events();

    assert_eq!(events.len(), 1);
    assert!(events.contains(&AppEventType::RenderCompleted));
  }

  #[tokio::test]
  async fn test_handle_event() {
    let plugin = YouTubeUploaderPlugin::default();

    let event = AppEvent::RenderCompleted {
      output_path: "/test/output.mp4".to_string(),
      job_id: "test-job-123".to_string(),
    };

    let result = plugin.handle_event(&event).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_suspend_resume() {
    let mut plugin = YouTubeUploaderPlugin::default();

    let result = plugin.suspend().await;
    assert!(result.is_ok());

    let result = plugin.resume().await;
    assert!(result.is_ok());
  }

  #[test]
  fn test_upload_status_serialization() {
    let status = UploadStatus {
      upload_id: "test-123".to_string(),
      progress: 50.5,
      status: UploadState::Uploading,
      video_url: None,
    };

    let json = serde_json::to_string(&status).unwrap();
    let deserialized: UploadStatus = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.upload_id, status.upload_id);
    assert_eq!(deserialized.progress, status.progress);
    assert!(deserialized.video_url.is_none());
  }

  #[test]
  fn test_upload_settings_validation() {
    // Test empty title
    let settings = YouTubeUploadSettings {
      title: "".to_string(),
      description: "Description".to_string(),
      tags: vec![],
      category: YouTubeCategory::Other,
      privacy: PrivacyStatus::Private,
    };
    assert!(settings.title.is_empty());

    // Test max tags
    let mut many_tags = vec![];
    for i in 0..100 {
      many_tags.push(format!("tag{i}"));
    }
    let settings_many_tags = YouTubeUploadSettings {
      title: "Test".to_string(),
      description: "Description".to_string(),
      tags: many_tags,
      category: YouTubeCategory::Other,
      privacy: PrivacyStatus::Private,
    };
    assert_eq!(settings_many_tags.tags.len(), 100);
  }
}

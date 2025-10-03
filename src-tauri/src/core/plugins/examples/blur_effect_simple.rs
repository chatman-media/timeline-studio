//! Простой пример плагина для применения эффекта размытия

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

/// Параметры эффекта размытия
#[derive(Debug, Clone, Serialize, Deserialize)]
struct BlurParameters {
  /// Интенсивность размытия (0-100)
  intensity: f32,
  /// Тип размытия
  blur_type: BlurType,
  /// Применить к краям
  edge_blur: bool,
}

/// Тип размытия
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum BlurType {
  Gaussian,
  Motion,
  Box,
  Median,
}

/// Простой плагин эффекта размытия
#[derive(Default)]
pub struct BlurEffectPlugin {
  context: Option<PluginContext>,
}

#[async_trait]
impl Plugin for BlurEffectPlugin {
  fn metadata(&self) -> &PluginMetadata {
    static METADATA: std::sync::OnceLock<PluginMetadata> = std::sync::OnceLock::new();
    METADATA.get_or_init(|| PluginMetadata {
      id: "blur-effect".to_string(),
      name: "Blur Effect Plugin".to_string(),
      version: Version::new(1, 0, 0),
      author: "Timeline Studio Team".to_string(),
      description: "Apply various blur effects to video clips".to_string(),
      plugin_type: PluginType::Effect,
      homepage: Some("https://timeline.studio/plugins/blur-effect".to_string()),
      license: Some("MIT".to_string()),
      dependencies: vec![],
      min_app_version: Some(Version::new(1, 0, 0)),
    })
  }

  async fn initialize(&mut self, context: PluginContext) -> Result<()> {
    log::info!("Initializing Blur Effect Plugin");
    self.context = Some(context);
    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    log::info!("Shutting down Blur Effect Plugin");

    // Очищаем временные файлы
    if let Some(context) = &self.context {
      context.cleanup_temp_files().await.ok();
    }

    self.context = None;
    Ok(())
  }

  async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
    match command.command.as_str() {
      "apply_blur" => {
        // Парсим параметры
        let clip_id = command
          .params
          .get("clip_id")
          .and_then(|v| v.as_str())
          .ok_or_else(|| VideoCompilerError::InvalidParameter("Missing clip_id".to_string()))?;

        let params = if let Some(params_value) = command.params.get("parameters") {
          serde_json::from_value::<BlurParameters>(params_value.clone())
            .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?
        } else {
          // Используем параметры по умолчанию
          BlurParameters {
            intensity: 50.0,
            blur_type: BlurType::Gaussian,
            edge_blur: false,
          }
        };

        // В реальном плагине здесь бы применялся эффект через API
        log::info!(
          "Applying blur effect to clip {} with intensity {}",
          clip_id,
          params.intensity
        );

        Ok(PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(json!({
              "message": "Blur effect applied successfully",
              "clip_id": clip_id,
              "parameters": params
          })),
          error: None,
        })
      }
      "get_presets" => {
        // Возвращаем доступные пресеты
        let presets = vec![
          json!({
              "name": "Subtle Blur",
              "params": {
                  "intensity": 20.0,
                  "blur_type": "gaussian",
                  "edge_blur": false
              }
          }),
          json!({
              "name": "Heavy Blur",
              "params": {
                  "intensity": 80.0,
                  "blur_type": "gaussian",
                  "edge_blur": true
              }
          }),
          json!({
              "name": "Motion Blur",
              "params": {
                  "intensity": 50.0,
                  "blur_type": "motion",
                  "edge_blur": false
              }
          }),
        ];

        Ok(PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(json!({ "presets": presets })),
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
    vec![AppEventType::ProjectOpened, AppEventType::MediaImported]
  }

  async fn handle_event(&self, event: &AppEvent) -> Result<()> {
    match event {
      AppEvent::ProjectOpened { .. } => {
        log::info!("Blur Effect Plugin: Project opened");
      }
      AppEvent::MediaImported { .. } => {
        log::info!("Blur Effect Plugin: Media imported");
      }
      _ => {}
    }
    Ok(())
  }

  async fn suspend(&mut self) -> Result<()> {
    log::info!("Suspending Blur Effect Plugin");
    Ok(())
  }

  async fn resume(&mut self) -> Result<()> {
    log::info!("Resuming Blur Effect Plugin");
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_blur_parameters_serialization() {
    let params = BlurParameters {
      intensity: 50.0,
      blur_type: BlurType::Gaussian,
      edge_blur: true,
    };

    let json = serde_json::to_string(&params).unwrap();
    let deserialized: BlurParameters = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.intensity, params.intensity);
    assert!(deserialized.edge_blur);
  }

  #[test]
  fn test_blur_type_serialization() {
    // Test all blur types serialize correctly
    let gaussian = serde_json::to_string(&BlurType::Gaussian).unwrap();
    assert_eq!(gaussian, "\"gaussian\"");

    let motion = serde_json::to_string(&BlurType::Motion).unwrap();
    assert_eq!(motion, "\"motion\"");

    let box_blur = serde_json::to_string(&BlurType::Box).unwrap();
    assert_eq!(box_blur, "\"box\"");

    let median = serde_json::to_string(&BlurType::Median).unwrap();
    assert_eq!(median, "\"median\"");
  }

  #[test]
  fn test_plugin_metadata() {
    let plugin = BlurEffectPlugin::default();
    let metadata = plugin.metadata();

    assert_eq!(metadata.id, "blur-effect");
    assert_eq!(metadata.name, "Blur Effect Plugin");
    assert_eq!(metadata.version, Version::new(1, 0, 0));
    assert_eq!(metadata.plugin_type, PluginType::Effect);
    assert_eq!(metadata.author, "Timeline Studio Team");
    assert!(metadata.homepage.is_some());
    assert!(metadata.license.is_some());
    assert!(metadata.min_app_version.is_some());
  }

  #[test]
  fn test_subscribed_events() {
    let plugin = BlurEffectPlugin::default();
    let events = plugin.subscribed_events();

    assert_eq!(events.len(), 2);
    assert!(events.contains(&AppEventType::ProjectOpened));
    assert!(events.contains(&AppEventType::MediaImported));
  }

  #[tokio::test]
  async fn test_handle_event() {
    let plugin = BlurEffectPlugin::default();

    // Test ProjectOpened event
    let event = AppEvent::ProjectOpened {
      project_id: "test-project-123".to_string(),
      path: "/test/project.proj".to_string(),
    };
    let result = plugin.handle_event(&event).await;
    assert!(result.is_ok());

    // Test MediaImported event
    let event = AppEvent::MediaImported {
      media_id: "test-media-456".to_string(),
      path: "/test/media.mp4".to_string(),
    };
    let result = plugin.handle_event(&event).await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_suspend_resume() {
    let mut plugin = BlurEffectPlugin::default();

    // Test suspend
    let result = plugin.suspend().await;
    assert!(result.is_ok());

    // Test resume
    let result = plugin.resume().await;
    assert!(result.is_ok());
  }

  #[test]
  fn test_blur_parameters_validation() {
    // Test valid intensity range
    let valid_params = BlurParameters {
      intensity: 50.0,
      blur_type: BlurType::Gaussian,
      edge_blur: false,
    };
    assert!(valid_params.intensity >= 0.0 && valid_params.intensity <= 100.0);

    // Test edge cases
    let min_params = BlurParameters {
      intensity: 0.0,
      blur_type: BlurType::Box,
      edge_blur: false,
    };
    assert_eq!(min_params.intensity, 0.0);

    let max_params = BlurParameters {
      intensity: 100.0,
      blur_type: BlurType::Median,
      edge_blur: true,
    };
    assert_eq!(max_params.intensity, 100.0);
  }
}

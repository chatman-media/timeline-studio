//! Пример плагина - эффект размытия

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use timeline_studio_lib::core::plugins::{
  AppEventType, Plugin, PluginCommand, PluginContext, PluginMetadata, PluginResponse, PluginType,
  Version,
};
use timeline_studio_lib::core::AppEvent;
use timeline_studio_lib::video_compiler::error::Result;

/// Параметры эффекта размытия
#[derive(Debug, Clone, Serialize, Deserialize)]
struct BlurConfig {
  pub radius: f32,
  pub quality: BlurQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
enum BlurQuality {
  Low,
  Medium,
  High,
}

impl Default for BlurConfig {
  fn default() -> Self {
    Self {
      radius: 5.0,
      quality: BlurQuality::Medium,
    }
  }
}

/// Плагин эффекта размытия
pub struct BlurEffectPlugin {
  metadata: PluginMetadata,
  config: BlurConfig,
  initialized: bool,
  context: Option<PluginContext>,
}

impl BlurEffectPlugin {
  pub fn new() -> Self {
    let metadata = PluginMetadata {
      id: "blur-effect".to_string(),
      name: "Blur Effect".to_string(),
      version: Version::new(1, 0, 0),
      author: "Timeline Studio Team".to_string(),
      description: "Adds gaussian blur effect to video clips".to_string(),
      plugin_type: PluginType::Effect,
      homepage: Some("https://timeline.studio/plugins/blur".to_string()),
      license: Some("MIT".to_string()),
      dependencies: vec![],
      min_app_version: Some(Version::new(1, 0, 0)),
    };

    Self {
      metadata,
      config: BlurConfig::default(),
      initialized: false,
      context: None,
    }
  }

  /// Генерировать FFmpeg фильтр для размытия
  fn _generate_ffmpeg_filter(&self) -> String {
    let radius = self.config.radius;
    let sigma = match self.config.quality {
      BlurQuality::Low => radius * 0.5,
      BlurQuality::Medium => radius * 0.7,
      BlurQuality::High => radius * 1.0,
    };

    format!("gblur=sigma={sigma}:steps=3")
  }
}

impl Default for BlurEffectPlugin {
  fn default() -> Self {
    Self::new()
  }
}

#[async_trait]
impl Plugin for BlurEffectPlugin {
  fn metadata(&self) -> &PluginMetadata {
    &self.metadata
  }

  async fn initialize(&mut self, context: PluginContext) -> Result<()> {
    log::info!("Initializing Blur Effect Plugin");

    // Загружаем конфигурацию если есть
    let config_path = context.config_dir.join("blur-config.json");
    if config_path.exists() {
      match tokio::fs::read_to_string(&config_path).await {
        Ok(content) => {
          if let Ok(config) = serde_json::from_str::<BlurConfig>(&content) {
            self.config = config;
            log::info!("Loaded blur config: radius={}", self.config.radius);
          }
        }
        Err(e) => {
          log::warn!("Failed to load config: {e}");
        }
      }
    }

    self.context = Some(context);
    self.initialized = true;

    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    log::info!("Shutting down Blur Effect Plugin");

    // Сохраняем конфигурацию
    if let Some(context) = &self.context {
      let config_path = context.config_dir.join("blur-config.json");
      let config_json = serde_json::to_string_pretty(&self.config).map_err(|e| {
        timeline_studio_lib::video_compiler::error::VideoCompilerError::SerializationError(
          e.to_string(),
        )
      })?;

      tokio::fs::write(&config_path, config_json)
        .await
        .map_err(|e| {
          timeline_studio_lib::video_compiler::error::VideoCompilerError::Io(e.to_string())
        })?;
    }

    self.initialized = false;
    Ok(())
  }

  async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
    log::debug!("Blur Effect received command: {}", command.command);

    let response = match command.command.as_str() {
      "apply_blur" => {
        // Применить эффект размытия
        let media_id = command
          .params
          .get("media_id")
          .and_then(|v| v.as_str())
          .unwrap_or("");

        let radius = command
          .params
          .get("radius")
          .and_then(|v| v.as_f64())
          .unwrap_or(self.config.radius as f64) as f32;

        let filter = format!("gblur=sigma={}", radius * 0.7);

        PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(serde_json::json!({
              "filter": filter,
              "media_id": media_id,
              "effect_id": uuid::Uuid::new_v4().to_string(),
          })),
          error: None,
        }
      }

      "get_config" => {
        // Получить текущую конфигурацию
        PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(serde_json::to_value(&self.config).unwrap()),
          error: None,
        }
      }

      "set_config" => {
        // Обновить конфигурацию
        // В реальном плагине здесь бы обновлялась конфигурация
        PluginResponse {
          command_id: command.id,
          success: true,
          data: None,
          error: None,
        }
      }

      "get_presets" => {
        // Получить предустановки
        let presets = vec![
          serde_json::json!({
              "name": "Subtle",
              "radius": 2.0,
              "quality": "Medium"
          }),
          serde_json::json!({
              "name": "Strong",
              "radius": 10.0,
              "quality": "High"
          }),
          serde_json::json!({
              "name": "Dreamy",
              "radius": 15.0,
              "quality": "High"
          }),
        ];

        PluginResponse {
          command_id: command.id,
          success: true,
          data: Some(serde_json::json!({ "presets": presets })),
          error: None,
        }
      }

      _ => PluginResponse {
        command_id: command.id,
        success: false,
        data: None,
        error: Some(format!("Unknown command: {}", command.command)),
      },
    };

    Ok(response)
  }

  fn subscribed_events(&self) -> Vec<AppEventType> {
    // Подписываемся на события медиа для автоматического применения эффекта
    vec![AppEventType::MediaImported, AppEventType::MediaProcessed]
  }

  async fn handle_event(&self, event: &AppEvent) -> Result<()> {
    match event {
      AppEvent::MediaImported { media_id, .. } => {
        log::info!("Blur Effect: New media imported: {media_id}");
        // Здесь можно автоматически применить эффект к новым медиа
      }
      AppEvent::MediaProcessed { media_id } => {
        log::info!("Blur Effect: Media processed: {media_id}");
      }
      _ => {}
    }

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use uuid::Uuid;

  #[tokio::test]
  async fn test_blur_effect_plugin() {
    let plugin = BlurEffectPlugin::new();

    // Тест метаданных
    assert_eq!(plugin.metadata().id, "blur-effect");
    assert_eq!(plugin.metadata().plugin_type, PluginType::Effect);

    // Тест команды apply_blur
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "apply_blur".to_string(),
      params: serde_json::json!({
          "media_id": "test-media-123",
          "radius": 8.0
      }),
    };

    let response = plugin.handle_command(command).await.unwrap();
    assert!(response.success);
    assert!(response.data.is_some());

    let data = response.data.unwrap();
    assert!(data.get("filter").is_some());
    assert!(data.get("effect_id").is_some());
  }

  #[test]
  fn test_ffmpeg_filter_generation() {
    let plugin = BlurEffectPlugin::new();
    let filter = plugin.generate_ffmpeg_filter();
    assert!(filter.contains("gblur"));
    assert!(filter.contains("sigma="));
  }
}

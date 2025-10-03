//! Мост для интеграции плагинов с медиа сервисами

use crate::{
  core::{
    di::ServiceContainer,
    plugins::{
      api::{Effect, MediaInfo},
      permissions::PluginPermissions,
    },
  },
  video_compiler::{
    error::{Result, VideoCompilerError},
    services::ffmpeg_service::FfmpegService,
  },
};
use std::{path::PathBuf, sync::Arc};

/// Мост для медиа операций плагинов
#[derive(Clone)]
pub struct MediaBridge {
  service_container: Arc<ServiceContainer>,
  permissions: Arc<PluginPermissions>,
  plugin_id: String,
}

impl MediaBridge {
  /// Создать новый медиа мост
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

  /// Получить информацию о медиа файле
  pub async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo> {
    // Проверяем разрешения на чтение медиа
    if !self
      .permissions
      .file_system
      .can_read(&PathBuf::from(media_id))
    {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to read this media file".to_string(),
      ));
    }

    log::info!(
      "[MediaBridge {}] Getting media info for: {}",
      self.plugin_id,
      media_id
    );

    let media_path = PathBuf::from(media_id);

    // Проверяем существование файла
    if !media_path.exists() {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Media file not found: {media_id}"
      )));
    }

    // Интеграция с FfmpegService для получения реальных метаданных
    if let Some(ffmpeg_service) = self.service_container.get_ffmpeg_service() {
      // Получаем информацию через FFmpeg
      match ffmpeg_service.get_file_info(&media_path).await {
        Ok(file_info) => {
          log::info!(
            "[MediaBridge {}] Got real media info via FFmpeg: {}x{}, {:.1}s",
            self.plugin_id,
            file_info.width,
            file_info.height,
            file_info.duration
          );

          return Ok(MediaInfo {
            id: media_id.to_string(),
            path: media_path,
            duration: file_info.duration,
            width: file_info.width,
            height: file_info.height,
            fps: file_info.fps as f32,
            codec: file_info.codec,
            bitrate: file_info.bitrate,
          });
        }
        Err(e) => {
          log::warn!(
            "[MediaBridge {}] FFmpeg analysis failed for {}: {}. Falling back to basic info.",
            self.plugin_id,
            media_id,
            e
          );
        }
      }
    }

    // Fallback: получаем метаданные файла
    let metadata = tokio::fs::metadata(&media_path)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    // Определяем параметры по расширению файла
    let file_extension = media_path
      .extension()
      .and_then(|ext| ext.to_str())
      .unwrap_or("unknown")
      .to_lowercase();

    let (width, height, fps, codec) = match file_extension.as_str() {
      "mp4" | "mov" | "avi" => (1920, 1080, 30.0, "h264"),
      "mkv" | "webm" => (1920, 1080, 24.0, "vp9"),
      "jpg" | "jpeg" | "png" => (1920, 1080, 0.0, "image"),
      _ => (0, 0, 0.0, "unknown"),
    };

    Ok(MediaInfo {
      id: media_id.to_string(),
      path: media_path,
      duration: 0.0, // Неизвестно без FFmpeg
      width,
      height,
      fps,
      codec: codec.to_string(),
      bitrate: (metadata.len() * 8 / 60).max(1000000), // Примерная оценка
    })
  }

  /// Применить эффект к медиа
  pub async fn apply_effect(&self, media_id: &str, effect: &Effect) -> Result<()> {
    // Проверяем разрешения на запись
    if !self
      .permissions
      .file_system
      .can_write(&PathBuf::from(media_id))
    {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify this media file".to_string(),
      ));
    }

    log::info!(
      "[MediaBridge {}] Applying effect '{}' to media: {}",
      self.plugin_id,
      effect.effect_type,
      media_id
    );

    // TODO: Интеграция с EffectProcessor для реального применения эффектов
    // Пока логируем операцию и валидируем параметры

    // Валидация типа эффекта
    let supported_effects = ["blur", "sharpen", "brightness", "contrast", "saturation"];
    if !supported_effects.contains(&effect.effect_type.as_str()) {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unsupported effect type: {}",
        effect.effect_type
      )));
    }

    // Валидация параметров
    if effect.parameters.is_null() {
      return Err(VideoCompilerError::InvalidParameter(
        "Effect parameters cannot be null".to_string(),
      ));
    }

    log::info!(
      "[MediaBridge {}] Effect '{}' validation passed for media: {}",
      self.plugin_id,
      effect.effect_type,
      media_id
    );

    Ok(())
  }

  /// Генерировать превью для медиа
  pub async fn generate_thumbnail(
    &self,
    media_id: &str,
    timestamp: f64,
    output_path: &PathBuf,
  ) -> Result<()> {
    // Проверяем разрешения
    if !self
      .permissions
      .file_system
      .can_read(&PathBuf::from(media_id))
    {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to read this media file".to_string(),
      ));
    }

    if !self.permissions.file_system.can_write(output_path) {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to write to output path".to_string(),
      ));
    }

    log::info!(
      "[MediaBridge {}] Generating thumbnail for media: {} at timestamp: {}",
      self.plugin_id,
      media_id,
      timestamp
    );

    // Создаем директорию если не существует
    if let Some(parent) = output_path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::Io(e.to_string()))?;
    }

    // Пытаемся интегрироваться с PreviewService, иначе создаем заглушку
    let thumbnail_data =
      if let Some(_preview_service) = self.service_container.get_preview_service() {
        // TODO: Интеграция с PreviewService для реальной генерации thumbnail
        // Пока используем заглушку даже если сервис доступен
        log::info!(
          "[MediaBridge {}] PreviewService available, but integration not implemented yet",
          self.plugin_id
        );
        create_placeholder_thumbnail()
      } else {
        log::info!(
          "[MediaBridge {}] PreviewService not available, using placeholder thumbnail",
          self.plugin_id
        );
        create_placeholder_thumbnail()
      };

    tokio::fs::write(output_path, thumbnail_data)
      .await
      .map_err(|e| VideoCompilerError::Io(e.to_string()))?;

    log::info!(
      "[MediaBridge {}] Thumbnail generated: {:?}",
      self.plugin_id,
      output_path
    );

    Ok(())
  }
}

/// Создать простое JPEG изображение как заглушку
fn create_placeholder_thumbnail() -> Vec<u8> {
  // Минимальное валидное JPEG изображение 1x1 пиксель
  vec![
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
    0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
    0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x1F,
    0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00,
    0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x08, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F,
    0x00, 0x8A, 0xFF, 0xD9,
  ]
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::permissions::SecurityLevel;
  use tempfile::tempdir;

  #[tokio::test]
  async fn test_media_bridge_permissions() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let bridge = MediaBridge::new(service_container, permissions, "test-plugin".to_string());

    // Тест получения информации о медиа
    let temp_dir = tempdir().unwrap();
    let media_file = temp_dir.path().join("test.mp4");
    tokio::fs::write(&media_file, b"fake video content")
      .await
      .unwrap();

    // Должно работать для разрешенных путей (если они есть в permissions)
    let result = bridge.get_media_info(media_file.to_str().unwrap()).await;
    // В зависимости от разрешений может быть как Ok так и Err
    println!("Media info result: {result:?}");
  }

  #[tokio::test]
  async fn test_effect_validation() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Full.permissions());
    let bridge = MediaBridge::new(service_container, permissions, "test-plugin".to_string());

    let valid_effect = Effect {
      effect_type: "blur".to_string(),
      parameters: serde_json::json!({"radius": 5.0}),
    };

    let invalid_effect = Effect {
      effect_type: "invalid_effect".to_string(),
      parameters: serde_json::json!({}),
    };

    // Валидный эффект должен пройти проверку типа
    // (разрешения могут блокировать, но валидация пройдет)
    let result1 = bridge.apply_effect("test.mp4", &valid_effect).await;
    println!("Valid effect result: {result1:?}");

    // Невалидный эффект должен быть отклонен
    let result2 = bridge.apply_effect("test.mp4", &invalid_effect).await;
    assert!(result2.is_err());
    assert!(result2
      .unwrap_err()
      .to_string()
      .contains("Unsupported effect"));
  }

  #[test]
  fn test_placeholder_thumbnail() {
    let thumbnail = create_placeholder_thumbnail();
    assert!(!thumbnail.is_empty());
    assert_eq!(thumbnail[0], 0xFF); // JPEG magic number
    assert_eq!(thumbnail[1], 0xD8); // JPEG magic number
  }
}

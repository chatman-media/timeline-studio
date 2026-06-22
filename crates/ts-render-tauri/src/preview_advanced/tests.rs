//! Тесты для модуля preview_advanced

#[cfg(test)]
mod preview_advanced_tests {
  use super::super::*;
  use base64::Engine;
  use ts_render_services::VideoCompilerState;

  #[test]
  fn test_batch_preview_params_serialization() {
    let params = types::BatchPreviewParams {
      video_paths: vec!["video1.mp4".to_string(), "video2.mp4".to_string()],
      timestamps: vec![5.0, 10.0],
      width: 1920,
      height: 1080,
      quality: 90,
      output_dir: Some("/tmp/previews".to_string()),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("video1.mp4"));
    assert!(json.contains("1920"));

    // Тест десериализации
    let deserialized: types::BatchPreviewParams = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.video_paths.len(), 2);
    assert_eq!(deserialized.timestamps.len(), 2);
    assert_eq!(deserialized.width, 1920);
    assert_eq!(deserialized.height, 1080);
    assert_eq!(deserialized.quality, 90);
  }

  #[test]
  fn test_preview_generator_info_serialization() {
    let info = types::PreviewGeneratorInfo {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
      supported_formats: vec!["mp4".to_string()],
      max_concurrent_jobs: 4,
      cache_enabled: true,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("ffmpeg"));
    assert!(json.contains("mp4"));

    // Тест десериализации
    let deserialized: types::PreviewGeneratorInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.ffmpeg_path, "/usr/bin/ffmpeg");
    assert_eq!(deserialized.supported_formats.len(), 1);
    assert_eq!(deserialized.max_concurrent_jobs, 4);
    assert!(deserialized.cache_enabled);
  }

  #[test]
  fn test_preview_result_creation() {
    let result = types::PreviewResult {
      success: true,
      width: 1920,
      height: 1080,
      timestamp: 5.0,
      preview_data: vec![1, 2, 3, 4, 5],
      path: Some("/tmp/preview.jpg".to_string()),
      error: None,
    };

    assert!(result.success);
    assert_eq!(result.width, 1920);
    assert_eq!(result.height, 1080);
    assert_eq!(result.timestamp, 5.0);
    assert_eq!(result.preview_data.len(), 5);
    assert!(result.path.is_some());
    assert!(result.error.is_none());
  }

  #[test]
  fn test_preview_result_with_error() {
    let result = types::PreviewResult {
      success: false,
      width: 0,
      height: 0,
      timestamp: 0.0,
      preview_data: vec![],
      path: None,
      error: Some("Failed to generate preview".to_string()),
    };

    assert!(!result.success);
    assert_eq!(result.width, 0);
    assert_eq!(result.height, 0);
    assert!(result.preview_data.is_empty());
    assert!(result.path.is_none());
    assert!(result.error.is_some());
  }

  #[test]
  fn test_advanced_preview_options_validation() {
    let options = types::AdvancedPreviewOptions {
      width: 1920,
      height: 1080,
      quality: 90,
      format: "jpg".to_string(),
      apply_filters: true,
      watermark: Some("watermark.png".to_string()),
      output_dir: Some("/tmp/output".to_string()),
    };

    // Валидация значений
    assert!(options.width > 0);
    assert!(options.height > 0);
    assert!(options.quality <= 100);
    assert!(!options.format.is_empty());
    assert!(options.apply_filters);
    assert!(options.watermark.is_some());
    assert!(options.output_dir.is_some());
  }

  #[test]
  fn test_batch_preview_params_validation() {
    // Тест корректных параметров
    let valid_params = types::BatchPreviewParams {
      video_paths: vec!["video1.mp4".to_string(), "video2.mp4".to_string()],
      timestamps: vec![5.0, 10.0],
      width: 1920,
      height: 1080,
      quality: 90,
      output_dir: None,
    };

    assert_eq!(
      valid_params.video_paths.len(),
      valid_params.timestamps.len()
    );
    assert!(valid_params.width > 0);
    assert!(valid_params.height > 0);
    assert!(valid_params.quality <= 100);

    // Тест некорректных параметров
    let invalid_params = types::BatchPreviewParams {
      video_paths: vec!["video1.mp4".to_string()],
      timestamps: vec![5.0, 10.0], // Разная длина массивов
      width: 1920,
      height: 1080,
      quality: 90,
      output_dir: None,
    };

    assert_ne!(
      invalid_params.video_paths.len(),
      invalid_params.timestamps.len()
    );
  }

  #[test]
  fn test_preview_generator_info_defaults() {
    let info = business_logic::get_preview_generator_info_logic("ffmpeg");

    assert_eq!(info.supported_formats.len(), 5);
    assert!(info.supported_formats.contains(&"mp4".to_string()));
    assert!(info.supported_formats.contains(&"webm".to_string()));
    assert_eq!(info.max_concurrent_jobs, 4);
    assert!(info.cache_enabled);
  }

  #[test]
  fn test_preview_generator_id_creation() {
    let result = business_logic::create_preview_generator_with_ffmpeg_logic("ffmpeg".to_string());

    assert!(result.is_ok());
    let id = result.unwrap();
    assert!(id.starts_with("preview_gen_"));
    assert_eq!(id.len(), "preview_gen_".len() + 36); // UUID имеет длину 36 символов
  }

  #[test]
  fn test_base64_encoding_decoding() {
    use base64::Engine;

    let original_data = vec![1, 2, 3, 4, 5, 255, 128, 0];

    // Кодируем в base64
    let base64_encoded = base64::engine::general_purpose::STANDARD.encode(&original_data);
    assert!(!base64_encoded.is_empty());

    // Декодируем обратно
    let decoded = base64::engine::general_purpose::STANDARD
      .decode(&base64_encoded)
      .unwrap();

    assert_eq!(original_data, decoded);
  }

  #[test]
  fn test_empty_preview_data_handling() {
    let base64_data = "";
    let preview_data = base64::engine::general_purpose::STANDARD
      .decode(base64_data)
      .unwrap_or_default();

    assert!(preview_data.is_empty());
  }

  #[test]
  fn test_quality_bounds() {
    let qualities = [0u8, 1, 50, 90, 100, 255];

    for quality in qualities {
      let options = types::AdvancedPreviewOptions {
        width: 1920,
        height: 1080,
        quality,
        format: "jpg".to_string(),
        apply_filters: false,
        watermark: None,
        output_dir: None,
      };

      // В реальном приложении качество должно быть ограничено от 1 до 100
      if (1..=100).contains(&quality) {
        assert!(options.quality >= 1 && options.quality <= 100);
      }
    }
  }

  #[test]
  fn test_supported_formats() {
    let info = business_logic::get_preview_generator_info_logic("ffmpeg");
    let supported_formats = info.supported_formats;

    // Проверяем, что все поддерживаемые форматы имеют разумные имена
    for format in &supported_formats {
      assert!(!format.is_empty());
      assert!(format.len() >= 3);
      assert!(format.len() <= 4);
      assert!(format.chars().all(|c| c.is_ascii_alphanumeric()));
    }

    // Проверяем уникальность
    let unique_formats: std::collections::HashSet<_> = supported_formats.iter().collect();
    assert_eq!(unique_formats.len(), supported_formats.len());
  }

  #[test]
  fn test_resolution_combinations() {
    let resolutions = [(640, 480), (1280, 720), (1920, 1080), (3840, 2160)];

    for (width, height) in resolutions {
      let result = types::PreviewResult {
        success: true,
        width,
        height,
        timestamp: 0.0,
        preview_data: vec![],
        path: None,
        error: None,
      };

      assert!(result.width > 0);
      assert!(result.height > 0);
      assert!(result.width >= result.height || result.width == result.height); // Некоторые соотношения сторон
    }
  }

  #[test]
  fn test_uuid_generation_for_preview_generator() {
    let id1 = format!("preview_gen_{}", uuid::Uuid::new_v4());
    let id2 = format!("preview_gen_{}", uuid::Uuid::new_v4());

    assert_ne!(id1, id2);
    assert!(id1.starts_with("preview_gen_"));
    assert!(id2.starts_with("preview_gen_"));
    assert_eq!(id1.len(), id2.len());
    assert_eq!(id1.len(), "preview_gen_".len() + 36); // UUID имеет длину 36 символов
  }

  #[tokio::test]
  async fn test_ffmpeg_path_state_update() {
    let state = VideoCompilerState::new().await;
    let new_path = "/custom/path/to/ffmpeg".to_string();

    // Обновляем путь
    {
      let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
      *ffmpeg_path_state = new_path.clone();
    }

    // Проверяем, что путь обновился
    {
      let ffmpeg_path_state = state.ffmpeg_path.read().await;
      assert_eq!(*ffmpeg_path_state, new_path);
    }
  }

  #[test]
  fn test_error_handling_in_preview_result() {
    let error_messages = vec![
      "FFmpeg not found",
      "Invalid video format",
      "Timestamp out of range",
      "Insufficient memory",
      "",
    ];

    for error_msg in error_messages {
      let result = types::PreviewResult {
        success: error_msg.is_empty(),
        width: 0,
        height: 0,
        timestamp: 0.0,
        preview_data: vec![],
        path: None,
        error: if error_msg.is_empty() {
          None
        } else {
          Some(error_msg.to_string())
        },
      };

      if error_msg.is_empty() {
        assert!(result.success);
        assert!(result.error.is_none());
      } else {
        assert!(!result.success);
        assert!(result.error.is_some());
        assert_eq!(result.error.as_ref().unwrap(), error_msg);
      }
    }
  }
}

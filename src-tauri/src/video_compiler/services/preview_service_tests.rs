use super::*;
use crate::video_compiler::{
  schema::{timeline::ClipSource, Track},
  services::FfmpegServiceImpl,
};
use std::path::PathBuf;
use tempfile::TempDir;

/// Создать мок FFmpeg сервис для тестов
fn create_mock_ffmpeg_service() -> Arc<dyn FfmpegService> {
  Arc::new(FfmpegServiceImpl::new("echo".to_string()))
}

/// Создать тестовый проект с клипами
fn create_test_project_with_clips() -> ProjectSchema {
  let mut project = ProjectSchema::new("test_project".to_string());

  // Добавляем трек с клипами
  let mut track = Track {
    id: "track1".to_string(),
    name: "Video Track".to_string(),
    track_type: crate::video_compiler::schema::timeline::TrackType::Video,
    enabled: true,
    locked: false,
    clips: vec![],
    effects: vec![],
    volume: 1.0,
    filters: vec![],
  };

  // Добавляем клипы
  track.clips.push(Clip {
    id: "clip1".to_string(),
    source: ClipSource::File("/test/video1.mp4".to_string()),
    start_time: 0.0,
    end_time: 10.0,
    source_start: 0.0,
    source_end: 10.0,
    speed: 1.0,
    opacity: 1.0,
    effects: vec![],
    filters: vec![],
    template_id: None,
    template_position: None,
    color_correction: None,
    crop: None,
    transform: None,
    audio_track_index: None,
    properties: Default::default(),
  });

  track.clips.push(Clip {
    id: "clip2".to_string(),
    source: ClipSource::File("/test/video2.mp4".to_string()),
    start_time: 10.0,
    end_time: 20.0,
    source_start: 5.0,
    source_end: 15.0,
    speed: 1.0,
    opacity: 1.0,
    effects: vec![],
    filters: vec![],
    template_id: None,
    template_position: None,
    color_correction: None,
    crop: None,
    transform: None,
    audio_track_index: None,
    properties: Default::default(),
  });

  project.tracks.push(track);
  project
}

#[cfg(test)]
mod initialization_tests {
  use super::*;

  #[tokio::test]
  async fn test_service_creation() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    assert!(service.initialize().await.is_ok());
  }

  #[tokio::test]
  async fn test_temp_directory_creation() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    service.initialize().await.unwrap();
    assert!(service.temp_dir.exists());
  }

  #[tokio::test]
  async fn test_health_check() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    service.initialize().await.unwrap();
    assert!(service.health_check().await.is_ok());
  }
}

#[cfg(test)]
mod cache_tests {
  use super::*;

  #[tokio::test]
  async fn test_cache_key_generation() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let key1 = service.generate_cache_key(
      PreviewType::Frame,
      Path::new("/video.mp4"),
      Some(10.0),
      Some((1920, 1080)),
    );

    let key2 = service.generate_cache_key(
      PreviewType::Frame,
      Path::new("/video.mp4"),
      Some(10.0),
      Some((1920, 1080)),
    );

    let key3 = service.generate_cache_key(
      PreviewType::Frame,
      Path::new("/video.mp4"),
      Some(20.0),
      Some((1920, 1080)),
    );

    // Одинаковые параметры дают одинаковый ключ
    assert_eq!(key1, key2);
    // Разные параметры дают разный ключ
    assert_ne!(key1, key3);
  }

  #[tokio::test]
  async fn test_cache_storage_and_retrieval() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let test_result = PreviewResult {
      preview_type: PreviewType::Frame,
      data: vec![1, 2, 3, 4, 5],
      format: "jpeg".to_string(),
      resolution: (100, 100),
      timestamp: Some(10.0),
    };

    let key = "test_key";

    // Сохраняем в кэш
    service.cache_preview(key, &test_result).await.unwrap();

    // Получаем из кэша
    let cached = service.get_cached_preview(key).await.unwrap();
    assert!(cached.is_some());

    let cached_result = cached.unwrap();
    assert_eq!(cached_result.data, test_result.data);
    assert_eq!(cached_result.format, test_result.format);
    assert_eq!(cached_result.resolution, test_result.resolution);
  }

  #[tokio::test]
  async fn test_cache_size_limit() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    // Добавляем много элементов в кэш
    for i in 0..1100 {
      let result = PreviewResult {
        preview_type: PreviewType::Frame,
        data: vec![i as u8; 100],
        format: "jpeg".to_string(),
        resolution: (100, 100),
        timestamp: Some(i as f64),
      };

      service
        .cache_preview(&format!("key_{i}"), &result)
        .await
        .unwrap();
    }

    // Проверяем что размер кэша ограничен
    let cache = service.preview_cache.read().await;
    assert!(cache.len() <= 1000);
  }
}

#[cfg(test)]
mod frame_generation_tests {
  use super::*;

  #[tokio::test]
  async fn test_generate_frame_from_project() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let project = create_test_project_with_clips();
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("frame.jpg");

    // Генерируем кадр в момент времени когда активен первый клип
    let result = service
      .generate_frame(&project, 5.0, output_path.to_str().unwrap(), None)
      .await;

    // Должна быть ошибка так как файл не существует
    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::MediaFileError { path, .. } => {
        assert_eq!(path, "/test/video1.mp4");
      }
      _ => panic!("Expected MediaFileError"),
    }
  }

  #[tokio::test]
  async fn test_generate_frame_no_active_clip() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let project = create_test_project_with_clips();
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("frame.jpg");

    // Генерируем кадр в момент времени когда нет активных клипов
    let result = service
      .generate_frame(
        &project,
        25.0, // После всех клипов
        output_path.to_str().unwrap(),
        None,
      )
      .await;

    // Должен быть создан черный кадр
    assert!(result.is_ok());
    assert!(output_path.exists());

    // Проверяем что файл не пустой
    let data = tokio::fs::read(&output_path).await.unwrap();
    assert!(!data.is_empty());
  }

  #[tokio::test]
  async fn test_generate_frame_with_custom_options() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let project = ProjectSchema::new("empty".to_string());
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("frame.jpg");

    let options = crate::video_compiler::core::preview::PreviewOptions {
      width: Some(640),
      height: Some(360),
      format: "png".to_string(),
      quality: 95,
    };

    let result = service
      .generate_frame(&project, 0.0, output_path.to_str().unwrap(), Some(options))
      .await;

    assert!(result.is_ok());
    assert!(output_path.exists());
  }
}

#[cfg(test)]
mod waveform_tests {
  use super::*;

  #[tokio::test]
  async fn test_waveform_generation_mock() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    // Создаем временный аудио файл
    let temp_dir = TempDir::new().unwrap();
    let audio_path = temp_dir.path().join("audio.mp3");
    tokio::fs::write(&audio_path, b"mock audio data")
      .await
      .unwrap();

    // Пытаемся сгенерировать waveform
    // С echo вместо ffmpeg это не сработает, но проверим обработку ошибок
    let result = service
      .generate_waveform(&audio_path, 1920, 200, "#00FF00")
      .await;

    // Ожидаем ошибку так как echo не может обработать аудио
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_waveform_caching() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let test_waveform = PreviewResult {
      preview_type: PreviewType::Waveform,
      data: vec![0xFF; 1000], // Мок данные
      format: "png".to_string(),
      resolution: (1920, 200),
      timestamp: None,
    };

    let cache_key = format!("waveform:{}:{}x{}:{}", "test.mp3", 1920, 200, "#00FF00");

    // Кэшируем результат
    service
      .cache_preview(&cache_key, &test_waveform)
      .await
      .unwrap();

    // Проверяем что можем получить из кэша
    let cached = service.get_cached_preview(&cache_key).await.unwrap();
    assert!(cached.is_some());
    assert_eq!(cached.unwrap().data.len(), 1000);
  }
}

#[cfg(test)]
mod batch_operations_tests {
  use super::*;

  #[tokio::test]
  async fn test_batch_preview_generation() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("video.mp4");
    tokio::fs::write(&video_path, b"mock video").await.unwrap();

    let requests = vec![
      PreviewRequest {
        preview_type: PreviewType::Frame,
        source_path: video_path.clone(),
        timestamp: Some(1.0),
        resolution: Some((320, 180)),
        quality: Some(85),
      },
      PreviewRequest {
        preview_type: PreviewType::Waveform,
        source_path: video_path.clone(),
        timestamp: None,
        resolution: Some((1000, 100)),
        quality: None,
      },
    ];

    // Пытаемся выполнить batch операцию
    let result = service.batch_generate_previews(requests).await;

    // С mock ffmpeg это не сработает, но проверим структуру
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_batch_preview_unsupported_type() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let request = PreviewRequest {
      preview_type: PreviewType::Storyboard, // Не поддерживается в batch
      source_path: PathBuf::from("test.mp4"),
      timestamp: None,
      resolution: None,
      quality: None,
    };

    let result = service.batch_generate_previews(vec![request]).await;
    assert!(result.is_err());

    match result.unwrap_err() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Неподдерживаемый тип превью"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }
}

#[cfg(test)]
mod storyboard_tests {
  use super::*;

  #[tokio::test]
  async fn test_storyboard_generation() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let project = create_test_project_with_clips();

    let result = service.generate_storyboard(&project, 3, 2, (160, 90)).await;

    // С файлами которые не существуют будет ошибка
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_storyboard_empty_project() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let project = ProjectSchema::new("empty".to_string());

    let result = service
      .generate_storyboard(&project, 2, 2, (100, 100))
      .await;

    // Для пустого проекта должен вернуться пустой результат
    assert!(result.is_ok());
    assert!(result.unwrap().is_empty());
  }
}

#[cfg(test)]
mod error_handling_tests {
  use super::*;

  #[tokio::test]
  async fn test_invalid_timestamp_error() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let result = service
      .generate_frame_preview(
        Path::new("test.mp4"),
        -5.0, // Негативный timestamp
        None,
      )
      .await;

    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Некорректное время кадра"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[tokio::test]
  async fn test_missing_file_error() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);

    let result = service
      .generate_frame_preview(Path::new("/non/existent/video.mp4"), 5.0, None)
      .await;

    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::MediaFileError { path, reason } => {
        assert!(path.contains("video.mp4"));
        assert!(reason.contains("не найден"));
      }
      _ => panic!("Expected MediaFileError"),
    }
  }
}

#[cfg(test)]
mod ffmpeg_integration_tests {
  use super::*;

  #[tokio::test]
  async fn test_thumbnails_with_ffmpeg_builder() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("video.mp4");
    tokio::fs::write(&video_path, b"mock video").await.unwrap();

    // Тестируем что метод использует FFmpegBuilder
    let result = service
      .generate_video_thumbnails(&video_path, 5, Some((320, 180)))
      .await;

    // С echo вместо ffmpeg будет ошибка
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_preview_batch_for_file() {
    let ffmpeg_service = create_mock_ffmpeg_service();
    let service = PreviewServiceImpl::new(ffmpeg_service);
    service.initialize().await.unwrap();

    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("video.mp4");
    tokio::fs::write(&video_path, b"mock video").await.unwrap();

    let timestamps = vec![1.0, 5.0, 10.0];

    let result = service
      .generate_preview_batch_for_file(&video_path, timestamps, Some((640, 360)), Some(90))
      .await;

    // С mock ffmpeg будет ошибка
    assert!(result.is_err());
  }
}

/// Вспомогательная функция для создания тестового PreviewService
#[cfg(test)]
#[allow(dead_code)]
pub fn create_test_preview_service() -> PreviewServiceImpl {
  let ffmpeg_service = create_mock_ffmpeg_service();
  PreviewServiceImpl::new(ffmpeg_service)
}

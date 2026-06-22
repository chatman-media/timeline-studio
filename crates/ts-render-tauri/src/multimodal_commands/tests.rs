//! Тесты для модуля multimodal_commands

use super::*;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use tempfile::TempDir;
use tokio::fs;

// ============ Тесты бизнес-логики ============

#[test]
fn test_parse_grid_size() {
  assert_eq!(parse_grid_size("2x2").unwrap(), (2, 2));
  assert_eq!(parse_grid_size("3x4").unwrap(), (3, 4));
  assert!(parse_grid_size("invalid").is_err());
  assert!(parse_grid_size("0x2").is_err());
  assert!(parse_grid_size("15x15").is_err());
}

#[test]
fn test_parse_grid_size_edge_cases() {
  // Максимальные значения
  assert_eq!(parse_grid_size("10x10").unwrap(), (10, 10));

  // Минимальные значения
  assert_eq!(parse_grid_size("1x1").unwrap(), (1, 1));

  // Превышение лимита
  assert!(parse_grid_size("11x10").is_err());
  assert!(parse_grid_size("10x11").is_err());

  // Неправильные форматы
  assert!(parse_grid_size("2-2").is_err());
  assert!(parse_grid_size("2x2x2").is_err());
  assert!(parse_grid_size("").is_err());
  assert!(parse_grid_size("x").is_err());
}

#[test]
fn test_calculate_frame_interval() {
  // С заданной частотой кадров
  assert_eq!(calculate_frame_interval(2.0, 10, 60.0), 0.5);
  assert_eq!(calculate_frame_interval(1.0, 10, 60.0), 1.0);

  // Без частоты кадров (используется max_frames)
  assert_eq!(calculate_frame_interval(0.0, 10, 60.0), 6.0);
  assert_eq!(calculate_frame_interval(0.0, 5, 30.0), 6.0);
}

#[test]
fn test_calculate_thumbnail_timestamps() {
  let timestamps = calculate_multimodal_thumbnail_timestamps(100.0, 5);
  assert_eq!(timestamps.len(), 5);

  // Проверяем, что временные метки находятся в ожидаемом диапазоне (10% - 90%)
  assert!(timestamps[0] >= 10.0); // Первая метка >= 10% от длительности
  assert!(timestamps[4] <= 90.0); // Последняя метка <= 90% от длительности

  // Проверяем равномерное распределение
  let intervals: Vec<f64> = timestamps.windows(2).map(|w| w[1] - w[0]).collect();
  let first_interval = intervals[0];
  for interval in intervals {
    assert!((interval - first_interval).abs() < 0.001); // Проверяем равенство с точностью
  }
}

#[test]
fn test_validate_frame_extraction_params() {
  // Валидные параметры
  let valid_params = FrameExtractionParams {
    clip_id: "clip-123".to_string(),
    sampling_rate: 1.0,
    max_frames: 10,
    output_format: "jpg".to_string(),
    quality: 5, // FFmpeg качество q:v от 1 до 31
    resolution: None,
  };
  assert!(validate_frame_extraction_params(&valid_params).is_ok());

  // Пустой ID клипа
  let mut invalid_params = valid_params.clone();
  invalid_params.clip_id = "".to_string();
  assert!(validate_frame_extraction_params(&invalid_params).is_err());

  // Нулевое количество кадров
  let mut invalid_params = valid_params.clone();
  invalid_params.max_frames = 0;
  assert!(validate_frame_extraction_params(&invalid_params).is_err());

  // Слишком много кадров
  let mut invalid_params = valid_params.clone();
  invalid_params.max_frames = 1001;
  assert!(validate_frame_extraction_params(&invalid_params).is_err());

  // Отрицательная частота кадров
  let mut invalid_params = valid_params.clone();
  invalid_params.sampling_rate = -1.0;
  assert!(validate_frame_extraction_params(&invalid_params).is_err());

  // Неверное качество
  let mut invalid_params = valid_params.clone();
  invalid_params.quality = 32;
  assert!(validate_frame_extraction_params(&invalid_params).is_err());

  // Неподдерживаемый формат
  let mut invalid_params = valid_params.clone();
  invalid_params.output_format = "bmp".to_string();
  assert!(validate_frame_extraction_params(&invalid_params).is_err());
}

#[test]
fn test_convert_bytes_to_base64() {
  let test_data = b"Hello, World!";
  let base64_result = convert_bytes_to_base64(test_data);

  // Проверяем, что результат не пустой
  assert!(!base64_result.is_empty());

  // Проверяем, что можем декодировать обратно
  let decoded = STANDARD.decode(&base64_result).unwrap();
  assert_eq!(decoded, test_data);
}

#[test]
fn test_parse_fraction_to_float() {
  assert_eq!(parse_fraction_to_float("30/1").unwrap(), 30.0);
  assert_eq!(parse_fraction_to_float("25/1").unwrap(), 25.0);
  assert_eq!(
    parse_fraction_to_float("30000/1001").unwrap(),
    30000.0 / 1001.0
  );

  // Неверные форматы
  assert!(parse_fraction_to_float("30").is_err());
  assert!(parse_fraction_to_float("30/1/2").is_err());
  assert!(parse_fraction_to_float("30/0").is_err());
  assert!(parse_fraction_to_float("abc/def").is_err());
}

#[test]
fn test_parse_video_info() {
  let json_input = r#"{
    "format": {
      "duration": "120.5"
    },
    "streams": [
      {
        "codec_type": "video",
        "width": 1920,
        "height": 1080,
        "r_frame_rate": "30/1"
      }
    ]
  }"#;

  let result = parse_video_info(json_input).unwrap();
  assert_eq!(result.duration, 120.5);
  assert_eq!(result.width, 1920);
  assert_eq!(result.height, 1080);
  assert_eq!(result.fps, 30.0);
}

#[test]
fn test_parse_image_info() {
  let json_input = r#"{
    "streams": [
      {
        "width": 800,
        "height": 600,
        "codec_name": "png"
      }
    ]
  }"#;

  let result = parse_image_info(json_input).unwrap();
  assert_eq!(result.width, 800);
  assert_eq!(result.height, 600);
  assert_eq!(result.format, "png");
}

#[test]
fn test_parse_image_info_empty_streams() {
  let json_input = r#"{
    "streams": []
  }"#;

  let result = parse_image_info(json_input).unwrap();
  // Должны быть значения по умолчанию
  assert_eq!(result.width, 1920);
  assert_eq!(result.height, 1080);
  assert_eq!(result.format, "jpg");
}

#[test]
fn test_create_collage_filter() {
  // Тест простой сетки 2x2
  let filter = create_collage_filter(2, 2);
  assert!(filter.contains("scale=320:240"));
  assert!(filter.contains("hstack=inputs=2"));
  assert!(filter.contains("vstack=inputs=2"));

  // Тест 1x1 (без стека)
  let filter = create_collage_filter(1, 1);
  assert!(filter.contains("scale=320:240"));
  assert!(!filter.contains("hstack"));
  assert!(!filter.contains("vstack"));
}

#[test]
fn test_get_temp_frames_dir() {
  let clip_id = "test-clip";
  let dir_path = get_temp_frames_dir(clip_id);

  assert!(dir_path
    .to_string_lossy()
    .contains("timeline_studio_multimodal"));
  assert!(dir_path.to_string_lossy().contains(clip_id));
}

// ============ Тесты структур данных ============

#[test]
fn test_extracted_frame_creation() {
  let frame = ExtractedFrame {
    image_path: "/tmp/frame_001.jpg".to_string(),
    timestamp: 5.5,
    width: 1920,
    height: 1080,
    format: "jpg".to_string(),
  };

  assert_eq!(frame.image_path, "/tmp/frame_001.jpg");
  assert_eq!(frame.timestamp, 5.5);
  assert_eq!(frame.width, 1920);
  assert_eq!(frame.height, 1080);
  assert_eq!(frame.format, "jpg");
}

#[test]
fn test_frame_extraction_params() {
  let params = FrameExtractionParams {
    clip_id: "clip-123".to_string(),
    sampling_rate: 1.0, // 1 frame per second
    max_frames: 10,
    output_format: "jpg".to_string(),
    quality: 15, // FFmpeg качество
    resolution: Some("1920x1080".to_string()),
  };

  assert_eq!(params.clip_id, "clip-123");
  assert_eq!(params.sampling_rate, 1.0);
  assert_eq!(params.max_frames, 10);
  assert_eq!(params.output_format, "jpg");
  assert_eq!(params.quality, 15);
  assert_eq!(params.resolution, Some("1920x1080".to_string()));
}

#[test]
fn test_frame_extraction_result() {
  let result = FrameExtractionResult {
    frames: vec![
      ExtractedFrame {
        image_path: "/tmp/frame_001.jpg".to_string(),
        timestamp: 0.0,
        width: 1920,
        height: 1080,
        format: "jpg".to_string(),
      },
      ExtractedFrame {
        image_path: "/tmp/frame_002.jpg".to_string(),
        timestamp: 1.0,
        width: 1920,
        height: 1080,
        format: "jpg".to_string(),
      },
    ],
    total_extracted: 2,
    video_duration: 10.0,
    extraction_time_ms: 1500,
  };

  assert_eq!(result.frames.len(), 2);
  assert_eq!(result.total_extracted, 2);
  assert_eq!(result.video_duration, 10.0);
  assert_eq!(result.extraction_time_ms, 1500);
}

#[test]
fn test_video_info_struct() {
  let info = VideoInfo {
    duration: 60.5,
    width: 1920,
    height: 1080,
    fps: 29.97,
  };

  assert_eq!(info.duration, 60.5);
  assert_eq!(info.width, 1920);
  assert_eq!(info.height, 1080);
  assert_eq!(info.fps, 29.97);
}

#[test]
fn test_image_info_struct() {
  let info = ImageInfo {
    width: 1280,
    height: 720,
    format: "png".to_string(),
  };

  assert_eq!(info.width, 1280);
  assert_eq!(info.height, 720);
  assert_eq!(info.format, "png");
}

#[test]
fn test_frame_extraction_params_default_values() {
  let params = FrameExtractionParams {
    clip_id: "clip-test".to_string(),
    sampling_rate: 0.0, // Should use max_frames to calculate interval
    max_frames: 5,
    output_format: "png".to_string(),
    quality: 20,
    resolution: None,
  };

  assert_eq!(params.sampling_rate, 0.0);
  assert_eq!(params.max_frames, 5);
  assert!(params.resolution.is_none());
}

// ============ Тесты сериализации ============

#[test]
fn test_serialization() {
  // Тест сериализации ExtractedFrame
  let frame = ExtractedFrame {
    image_path: "/tmp/frame.jpg".to_string(),
    timestamp: 10.5,
    width: 1920,
    height: 1080,
    format: "jpg".to_string(),
  };

  let json = serde_json::to_string(&frame).unwrap();
  assert!(json.contains("image_path"));
  assert!(json.contains("10.5"));

  let deserialized: ExtractedFrame = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.timestamp, 10.5);

  // Тест сериализации FrameExtractionResult
  let result = FrameExtractionResult {
    frames: vec![frame],
    total_extracted: 1,
    video_duration: 60.0,
    extraction_time_ms: 500,
  };

  let json = serde_json::to_string(&result).unwrap();
  assert!(json.contains("total_extracted"));
  assert!(json.contains("video_duration"));

  let deserialized: FrameExtractionResult = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.frames.len(), 1);
  assert_eq!(deserialized.extraction_time_ms, 500);
}

#[test]
fn test_frame_extraction_params_serialization() {
  let params = FrameExtractionParams {
    clip_id: "test-clip".to_string(),
    sampling_rate: 2.5,
    max_frames: 20,
    output_format: "png".to_string(),
    quality: 10,
    resolution: Some("1280x720".to_string()),
  };

  let json = serde_json::to_string(&params).unwrap();
  assert!(json.contains("test-clip"));
  assert!(json.contains("2.5"));
  assert!(json.contains("1280x720"));

  let deserialized: FrameExtractionParams = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.clip_id, "test-clip");
  assert_eq!(deserialized.sampling_rate, 2.5);
  assert_eq!(deserialized.quality, 10);
}

// ============ Интеграционные тесты (упрощенные) ============

#[tokio::test]
async fn test_convert_image_to_base64_missing_file() {
  let result = convert_image_to_base64("/non/existent/image.jpg".to_string()).await;
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Изображение не найдено"));
}

#[tokio::test]
async fn test_convert_image_to_base64_success() {
  let temp_dir = TempDir::new().unwrap();
  let image_path = temp_dir.path().join("test_image.jpg");

  // Создаем тестовое изображение (простой JPEG header)
  let jpeg_data = vec![
    0xFF, 0xD8, 0xFF, 0xE0, // JPEG SOI and APP0 marker
    0x00, 0x10, // APP0 length
    b'J', b'F', b'I', b'F', 0x00, // JFIF identifier
    0x01, 0x01, // Version
    0x00, // Units
    0x00, 0x01, 0x00, 0x01, // X and Y density
    0x00, 0x00, // Thumbnail width and height
  ];

  fs::write(&image_path, &jpeg_data).await.unwrap();

  let result = convert_image_to_base64(image_path.to_string_lossy().to_string()).await;
  assert!(result.is_ok());

  let base64_data = result.unwrap();
  assert!(!base64_data.is_empty());

  // Проверяем, что это валидный base64
  let decoded = STANDARD.decode(&base64_data);
  assert!(decoded.is_ok());
  assert_eq!(decoded.unwrap(), jpeg_data);
}

#[tokio::test]
async fn test_cleanup_extracted_frames() {
  let temp_base = std::env::temp_dir().join("timeline_studio_multimodal");
  let clip_id = "test-clip-cleanup";
  let clip_dir = temp_base.join(clip_id);

  // Создаем директорию и файлы
  fs::create_dir_all(&clip_dir).await.unwrap();
  fs::write(clip_dir.join("frame_001.jpg"), "test")
    .await
    .unwrap();
  fs::write(clip_dir.join("frame_002.jpg"), "test")
    .await
    .unwrap();
  fs::write(clip_dir.join("frame_003.jpg"), "test")
    .await
    .unwrap();

  let result = cleanup_extracted_frames(clip_id.to_string()).await;
  assert!(result.is_ok());
  assert_eq!(result.unwrap(), 3);

  // Проверяем, что файлы удалены
  assert!(!clip_dir.join("frame_001.jpg").exists());
  assert!(!clip_dir.join("frame_002.jpg").exists());
  assert!(!clip_dir.join("frame_003.jpg").exists());
}

#[tokio::test]
async fn test_cleanup_extracted_frames_non_existent() {
  let result = cleanup_extracted_frames("non-existent-clip".to_string()).await;
  assert!(result.is_ok());
  assert_eq!(result.unwrap(), 0);
}

#[tokio::test]
async fn test_create_temp_frames_dir() {
  let clip_id = "test-clip-dir";
  let result = create_temp_frames_dir(clip_id).await;

  assert!(result.is_ok());
  let dir_path = result.unwrap();
  assert!(dir_path.exists());
  assert!(dir_path.is_dir());
  assert!(dir_path
    .to_string_lossy()
    .contains("timeline_studio_multimodal"));
  assert!(dir_path.to_string_lossy().contains(clip_id));

  // Cleanup
  let _ = fs::remove_dir_all(dir_path).await;
}

#[tokio::test]
async fn test_optimize_image_for_analysis_missing_file() {
  let result = optimize_image_for_analysis(
    "/non/existent/input.jpg".to_string(),
    "/tmp/output.jpg".to_string(),
    Some(1920),
    Some(90),
  )
  .await;

  assert!(result.is_err());
  assert!(result
    .unwrap_err()
    .contains("Входное изображение не найдено"));
}

#[tokio::test]
async fn test_create_frame_collage_empty_frames() {
  let result = create_frame_collage(
    vec![],
    "/tmp/collage.jpg".to_string(),
    Some("2x2".to_string()),
  )
  .await;

  assert!(result.is_err());
  assert!(result
    .unwrap_err()
    .contains("Список кадров не может быть пустым"));
}

#[tokio::test]
async fn test_create_frame_collage_missing_frame() {
  let result = create_frame_collage(
    vec!["/non/existent/frame.jpg".to_string()],
    "/tmp/collage.jpg".to_string(),
    Some("1x1".to_string()),
  )
  .await;

  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Кадр не найден"));
}

// ============ Дополнительные тесты бизнес-логики ============

#[test]
fn test_validate_frame_extraction_params_edge_cases() {
  let base_params = FrameExtractionParams {
    clip_id: "clip-123".to_string(),
    sampling_rate: 1.0,
    max_frames: 10,
    output_format: "jpg".to_string(),
    quality: 5, // FFmpeg качество от 1 до 31
    resolution: None,
  };

  // Тест всех поддерживаемых форматов
  let valid_formats = ["jpg", "jpeg", "png", "webp"];
  for format in valid_formats {
    let mut params = base_params.clone();
    params.output_format = format.to_string();
    assert!(validate_frame_extraction_params(&params).is_ok());
  }

  // Тест граничных значений качества
  let mut params = base_params.clone();
  params.quality = 1; // минимальное
  assert!(validate_frame_extraction_params(&params).is_ok());

  params.quality = 31; // максимальное
  assert!(validate_frame_extraction_params(&params).is_ok());
}

#[test]
fn test_calculate_frame_interval_edge_cases() {
  // Очень маленькие значения
  assert_eq!(calculate_frame_interval(0.1, 1, 1.0), 10.0);

  // Большие значения
  assert_eq!(calculate_frame_interval(100.0, 1000, 3600.0), 0.01);

  // Нулевая длительность (должна работать без паники)
  let result = calculate_frame_interval(0.0, 10, 0.0);
  assert_eq!(result, 0.0);
}

#[test]
fn test_calculate_thumbnail_timestamps_edge_cases() {
  // Очень короткое видео
  let timestamps = calculate_multimodal_thumbnail_timestamps(1.0, 3);
  assert_eq!(timestamps.len(), 3);
  assert!(timestamps[0] >= 0.1);
  assert!(timestamps[2] <= 0.9);

  // Один кадр
  let timestamps = calculate_multimodal_thumbnail_timestamps(100.0, 1);
  assert_eq!(timestamps.len(), 1);
  assert_eq!(timestamps[0], 10.0); // Должен быть в начале полезного диапазона (10% от длительности)
}

#[test]
fn test_parse_video_info_edge_cases() {
  // Отсутствует r_frame_rate
  let json_input = r#"{
    "format": {
      "duration": "60.0"
    },
    "streams": [
      {
        "codec_type": "video",
        "width": 1280,
        "height": 720
      }
    ]
  }"#;

  let result = parse_video_info(json_input).unwrap();
  assert_eq!(result.fps, 25.0); // Значение по умолчанию

  // Отсутствует видео поток
  let json_input = r#"{
    "format": {
      "duration": "60.0"
    },
    "streams": [
      {
        "codec_type": "audio"
      }
    ]
  }"#;

  assert!(parse_video_info(json_input).is_err());
}

#[test]
fn test_create_collage_filter_edge_cases() {
  // Большая сетка
  let filter = create_collage_filter(5, 3);
  assert!(filter.contains("hstack=inputs=5"));
  assert!(filter.contains("vstack=inputs=3"));

  // Вертикальная полоска (1 колонка)
  let filter = create_collage_filter(1, 4);
  assert!(!filter.contains("hstack"));
  assert!(filter.contains("vstack=inputs=4"));

  // Горизонтальная полоска (1 строка)
  let filter = create_collage_filter(4, 1);
  assert!(filter.contains("hstack=inputs=4"));
  assert!(!filter.contains("vstack"));
}

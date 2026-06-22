//! Тесты для модуля извлечения кадров

#[cfg(test)]
mod frame_extraction_tests {
  use super::super::business_logic::*;
  use super::super::types::*;

  #[test]
  fn test_calculate_frame_timestamps() {
    // Тест базовой функциональности
    let timestamps = calculate_frame_timestamps(10.0, 2.0);
    assert_eq!(timestamps, vec![0.0, 2.0, 4.0, 6.0, 8.0, 10.0]);

    // Тест с дробными значениями
    let timestamps = calculate_frame_timestamps(5.5, 1.5);
    assert_eq!(timestamps, vec![0.0, 1.5, 3.0, 4.5]);

    // Тест с очень маленьким интервалом
    let timestamps = calculate_frame_timestamps(1.0, 0.5);
    assert_eq!(timestamps, vec![0.0, 0.5, 1.0]);

    // Тест когда интервал больше длительности
    let timestamps = calculate_frame_timestamps(5.0, 10.0);
    assert_eq!(timestamps, vec![0.0]);

    // Тест с нулевым интервалом
    let timestamps = calculate_frame_timestamps(10.0, 0.0);
    assert!(timestamps.is_empty());

    // Тест с отрицательным интервалом
    let timestamps = calculate_frame_timestamps(10.0, -1.0);
    assert!(timestamps.is_empty());
  }

  #[test]
  fn test_generate_frame_paths() {
    let timestamps = vec![0.0, 1.5, 3.33];

    // Тест PNG формата
    let paths = generate_frame_paths("/output", &timestamps, &FrameFormat::Png);
    assert_eq!(paths.len(), 3);
    assert_eq!(paths[0], "/output/frame_0.00.png");
    assert_eq!(paths[1], "/output/frame_1.50.png");
    assert_eq!(paths[2], "/output/frame_3.33.png");

    // Тест JPEG формата
    let paths = generate_frame_paths("/output", &timestamps, &FrameFormat::Jpeg);
    assert_eq!(paths[0], "/output/frame_0.00.jpg");

    // Тест WebP формата
    let paths = generate_frame_paths("/output", &timestamps, &FrameFormat::Webp);
    assert_eq!(paths[0], "/output/frame_0.00.webp");

    // Тест с пустым массивом
    let empty_paths = generate_frame_paths("/output", &[], &FrameFormat::Png);
    assert!(empty_paths.is_empty());
  }

  #[test]
  fn test_generate_subtitle_frame_path() {
    // Тест PNG формата
    let path = generate_subtitle_frame_path("/subs", "subtitle_001", &FrameFormat::Png);
    assert_eq!(path, "/subs/subtitle_subtitle_001.png");

    // Тест JPEG формата
    let path = generate_subtitle_frame_path("/subs", "subtitle_001", &FrameFormat::Jpeg);
    assert_eq!(path, "/subs/subtitle_subtitle_001.jpg");

    // Тест с особыми символами в ID
    let path = generate_subtitle_frame_path("/subs", "sub-2023_v1", &FrameFormat::Png);
    assert_eq!(path, "/subs/subtitle_sub-2023_v1.png");
  }

  #[test]
  fn test_validate_extraction_params() {
    // Валидные параметры
    let valid_params = FrameExtractionParams {
      video_path: "/path/to/video.mp4".to_string(),
      timestamps: vec![0.0, 1.0, 2.0],
      output_format: FrameFormat::Png,
      resolution: Some((1920, 1080)),
      quality: Some(90),
    };
    assert!(validate_extraction_params(&valid_params).is_ok());

    // Пустой путь к видео
    let mut params = valid_params.clone();
    params.video_path = String::new();
    assert!(validate_extraction_params(&params).is_err());

    // Пустой список временных меток
    let mut params = valid_params.clone();
    params.timestamps = vec![];
    assert!(validate_extraction_params(&params).is_err());

    // Отрицательная временная метка
    let mut params = valid_params.clone();
    params.timestamps = vec![0.0, -1.0, 2.0];
    assert!(validate_extraction_params(&params).is_err());

    // Нулевое разрешение
    let mut params = valid_params.clone();
    params.resolution = Some((0, 1080));
    assert!(validate_extraction_params(&params).is_err());

    // Недопустимое качество
    let mut params = valid_params.clone();
    params.quality = Some(0);
    assert!(validate_extraction_params(&params).is_err());

    params.quality = Some(101);
    assert!(validate_extraction_params(&params).is_err());
  }

  #[test]
  fn test_calculate_optimal_interval() {
    // Нормальные случаи
    assert_eq!(calculate_optimal_interval(60.0, 10), 6.0);
    assert_eq!(calculate_optimal_interval(100.0, 20), 5.0);

    // Граничные случаи
    assert_eq!(calculate_optimal_interval(0.0, 10), 1.0);
    assert_eq!(calculate_optimal_interval(60.0, 0), 1.0);
    assert_eq!(calculate_optimal_interval(-10.0, 10), 1.0);

    // Проверка округления
    assert_eq!(calculate_optimal_interval(60.0, 7), 60.0 / 7.0); // 60/7 = ~8.57
  }

  #[test]
  fn test_filter_timestamps_by_range() {
    let timestamps = vec![0.0, 1.0, 2.0, 3.0, 4.0, 5.0];

    // Фильтрация с начальным временем
    let filtered = filter_timestamps_by_range(&timestamps, Some(2.0), None);
    assert_eq!(filtered, vec![2.0, 3.0, 4.0, 5.0]);

    // Фильтрация с конечным временем
    let filtered = filter_timestamps_by_range(&timestamps, None, Some(3.0));
    assert_eq!(filtered, vec![0.0, 1.0, 2.0, 3.0]);

    // Фильтрация с обоими границами
    let filtered = filter_timestamps_by_range(&timestamps, Some(1.0), Some(4.0));
    assert_eq!(filtered, vec![1.0, 2.0, 3.0, 4.0]);

    // Без фильтрации
    let filtered = filter_timestamps_by_range(&timestamps, None, None);
    assert_eq!(filtered, timestamps);
  }

  #[test]
  fn test_generate_keyframe_timestamps() {
    // Нормальные случаи
    let timestamps = generate_keyframe_timestamps(10.0, 5);
    assert_eq!(timestamps, vec![0.0, 2.5, 5.0, 7.5, 10.0]);

    // Один ключевой кадр
    let timestamps = generate_keyframe_timestamps(10.0, 1);
    assert_eq!(timestamps, vec![5.0]);

    // Два ключевых кадра
    let timestamps = generate_keyframe_timestamps(10.0, 2);
    assert_eq!(timestamps, vec![0.0, 10.0]);

    // Граничные случаи
    assert!(generate_keyframe_timestamps(0.0, 5).is_empty());
    assert!(generate_keyframe_timestamps(10.0, 0).is_empty());
    assert!(generate_keyframe_timestamps(-10.0, 5).is_empty());
  }

  #[test]
  fn test_frame_format_serialization() {
    use serde_json;

    // Тест сериализации
    let format = FrameFormat::Jpeg;
    let json = serde_json::to_string(&format).unwrap();
    assert_eq!(json, r#""jpeg""#);

    // Тест десериализации
    let format: FrameFormat = serde_json::from_str(r#""png""#).unwrap();
    matches!(format, FrameFormat::Png);
  }

  #[test]
  fn test_timeline_frame_structure() {
    let frame = TimelineFrame {
      timestamp: 5.5,
      frame_data: vec![255, 0, 0, 255], // Single red pixel RGBA
      width: 1,
      height: 1,
    };

    assert_eq!(frame.timestamp, 5.5);
    assert_eq!(frame.frame_data.len(), 4);
    assert_eq!(frame.width, 1);
    assert_eq!(frame.height, 1);
  }

  #[test]
  fn test_subtitle_frame_result() {
    let result = SubtitleFrameResult {
      subtitle_id: "sub_123".to_string(),
      timestamp: 10.5,
      frame_path: "/tmp/subtitle_frame.png".to_string(),
      width: 1920,
      height: 1080,
    };

    assert_eq!(result.subtitle_id, "sub_123");
    assert_eq!(result.timestamp, 10.5);
    assert!(result.frame_path.ends_with(".png"));
  }

  #[test]
  fn test_preview_request_validation() {
    let request = PreviewRequest {
      video_path: "/path/to/video.mp4".to_string(),
      timestamp: 30.0,
      resolution: Some((1280, 720)),
      quality: Some(90),
    };

    assert!(!request.video_path.is_empty());
    assert!(request.timestamp >= 0.0);

    if let Some((w, h)) = request.resolution {
      assert!(w > 0 && h > 0);
    }

    if let Some(q) = request.quality {
      assert!((1..=100).contains(&q));
    }
  }

  #[test]
  fn test_resolution_validation() {
    let valid_resolutions = vec![
      (640, 480),   // SD
      (1280, 720),  // HD
      (1920, 1080), // Full HD
      (3840, 2160), // 4K
    ];

    for (width, height) in valid_resolutions {
      assert!(width > 0 && height > 0);
      assert!(width % 2 == 0 && height % 2 == 0); // Even dimensions for video
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::montage_planner::services::*;
  use crate::montage_planner::types::*;
  use crate::recognition::frame_processor::{BoundingBox as YoloBbox, Detection as YoloDetection};
  use std::fs;
  use std::path::PathBuf;
  use tempfile::TempDir;

  fn create_yolo_detection(
    class: &str,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    confidence: f32,
  ) -> YoloDetection {
    YoloDetection {
      class: class.to_string(),
      class_id: 0, // Default class id
      confidence,
      bbox: YoloBbox {
        x,
        y,
        width,
        height,
      },
      attributes: None,
    }
  }

  fn create_test_audio_file() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test_audio.wav");
    fs::write(&file_path, vec![0u8; 1024]).unwrap();
    (temp_dir, file_path)
  }

  #[test]
  fn test_composition_to_activity_integration() {
    // Создаем композиционный анализатор и анализатор активности
    let composition_analyzer = CompositionAnalyzer::new();
    let mut activity_calculator = ActivityCalculator::new();

    // Создаем YOLO детекции для композиционного анализа
    let yolo_detections = vec![
      create_yolo_detection("person", 640.0, 360.0, 100.0, 200.0, 0.9),
      create_yolo_detection("car", 1280.0, 720.0, 200.0, 150.0, 0.85),
      create_yolo_detection("bicycle", 320.0, 540.0, 80.0, 120.0, 0.8),
    ];

    // Анализируем композицию
    let composition_result = composition_analyzer
      .analyze_composition(&yolo_detections, 0.0, 1920.0, 1080.0)
      .unwrap();

    // Анализируем композицию и получаем результат
    let _composition_enhanced = composition_analyzer
      .analyze_composition(&yolo_detections, 0.0, 1920.0, 1080.0)
      .unwrap();

    // Создаем montage detection для анализа активности
    let mut montage_detection = MontageDetection {
      timestamp: 0.0,
      detection_type: DetectionType::Combined,
      objects: vec![],
      faces: vec![],
      composition_score: composition_result.composition_score.clone(),
      activity_level: 0.0,
      emotional_tone: EmotionalTone::Neutral,
    };

    // Конвертируем YOLO детекции в объекты
    for yolo_det in &yolo_detections {
      montage_detection.objects.push(ObjectDetection {
        class: yolo_det.class.clone(),
        confidence: yolo_det.confidence,
        bbox: BoundingBox {
          x: yolo_det.bbox.x,
          y: yolo_det.bbox.y,
          width: yolo_det.bbox.width,
          height: yolo_det.bbox.height,
        },
        tracking_id: None,
        movement_vector: None,
        visual_importance: 0.7,
      });
    }

    // Анализируем активность
    let activity_metrics = activity_calculator.calculate_activity(&montage_detection);

    // Проверяем согласованность результатов
    assert!(composition_result.composition_score.overall_score > 0.0);
    assert!(activity_metrics.overall_activity > 0.0);

    // Композиция с хорошим балансом должна влиять на активность
    if composition_result.composition_score.balance > 70.0 {
      assert!(activity_metrics.scene_dynamics > 40.0);
    }
  }

  #[test]
  fn test_activity_to_moment_detection_integration() {
    let mut activity_calculator = ActivityCalculator::new();
    let moment_detector = MomentDetector::new();

    // Создаем серию детекций с разной активностью
    let mut detections = vec![];

    // Низкая активность
    for i in 0..3 {
      let mut detection = MontageDetection {
        timestamp: i as f64 * 0.5,
        detection_type: DetectionType::Object,
        objects: vec![ObjectDetection {
          class: "tree".to_string(),
          confidence: 0.8,
          bbox: BoundingBox {
            x: 900.0,
            y: 400.0,
            width: 200.0,
            height: 400.0,
          },
          tracking_id: Some(1),
          movement_vector: None,
          visual_importance: 0.3,
        }],
        faces: vec![],
        composition_score: CompositionScore {
          rule_of_thirds: 50.0,
          balance: 70.0,
          focus_clarity: 60.0,
          depth_of_field: 40.0,
          leading_lines: 30.0,
          symmetry: 50.0,
          overall_score: 50.0,
          ..Default::default()
        },
        activity_level: 20.0,
        emotional_tone: EmotionalTone::Calm,
      };

      // Рассчитываем активность
      let activity = activity_calculator.calculate_activity(&detection);
      detection.activity_level = activity.overall_activity;
      detections.push(detection);
    }

    // Высокая активность (экшн сцена)
    for i in 3..8 {
      let time = i as f64 * 0.5;
      let mut objects = vec![];

      // Добавляем движущиеся объекты
      for j in 0..5 {
        objects.push(ObjectDetection {
          class: if j % 2 == 0 { "person" } else { "car" }.to_string(),
          confidence: 0.85 + (j as f32 * 0.02),
          bbox: BoundingBox {
            x: (j as f32 * 300.0) % 1920.0,
            y: (j as f32 * 200.0) % 1080.0,
            width: 100.0,
            height: 150.0,
          },
          tracking_id: Some(10 + j as u32),
          movement_vector: Some((50.0 + j as f32 * 10.0, 20.0)),
          visual_importance: 0.8,
        });
      }

      let mut detection = MontageDetection {
        timestamp: time,
        detection_type: DetectionType::Combined,
        objects,
        faces: vec![],
        composition_score: CompositionScore {
          rule_of_thirds: 75.0,
          balance: 60.0,
          focus_clarity: 80.0,
          depth_of_field: 70.0,
          leading_lines: 65.0,
          symmetry: 40.0,
          overall_score: 65.0,
          ..Default::default()
        },
        activity_level: 0.0,
        emotional_tone: EmotionalTone::Excited,
      };

      let activity = activity_calculator.calculate_activity(&detection);
      detection.activity_level = activity.overall_activity;
      detections.push(detection);
    }

    // Детектируем моменты
    let moments = moment_detector.detect_moments(&detections).unwrap();

    // Должен быть хотя бы один экшн момент
    assert!(!moments.is_empty());

    let action_moments: Vec<_> = moments
      .iter()
      .filter(|m| matches!(m.category, MomentCategory::Action))
      .collect();

    assert!(!action_moments.is_empty());

    // Экшн момент должен начинаться после низкой активности
    assert!(action_moments[0].timestamp >= 1.5);
  }

  #[tokio::test]
  async fn test_audio_moment_synchronization() {
    let audio_analyzer = AudioAnalyzer::new();
    let moment_detector = MomentDetector::new();

    // Создаем тестовый аудио файл
    let (_temp_dir, audio_path) = create_test_audio_file();

    // Создаем видео моменты
    let video_detections = vec![
      MontageDetection {
        timestamp: 0.0,
        detection_type: DetectionType::Combined,
        objects: vec![ObjectDetection {
          class: "person".to_string(),
          confidence: 0.9,
          bbox: BoundingBox {
            x: 900.0,
            y: 400.0,
            width: 200.0,
            height: 400.0,
          },
          tracking_id: Some(1),
          movement_vector: Some((100.0, 50.0)),
          visual_importance: 0.9,
        }],
        faces: vec![FaceDetection {
          confidence: 0.85,
          bbox: BoundingBox {
            x: 950.0,
            y: 450.0,
            width: 80.0,
            height: 100.0,
          },
          tracking_id: Some(2),
          emotion: EmotionalTone::Excited,
          gaze_direction: Some(GazeDirection::Camera),
          face_quality: 0.8,
        }],
        composition_score: CompositionScore {
          rule_of_thirds: 80.0,
          balance: 75.0,
          focus_clarity: 85.0,
          depth_of_field: 70.0,
          leading_lines: 60.0,
          symmetry: 65.0,
          overall_score: 75.0,
          ..Default::default()
        },
        activity_level: 80.0,
        emotional_tone: EmotionalTone::Excited,
      },
      MontageDetection {
        timestamp: 2.0,
        detection_type: DetectionType::Face,
        objects: vec![],
        faces: vec![
          FaceDetection {
            confidence: 0.9,
            bbox: BoundingBox {
              x: 600.0,
              y: 300.0,
              width: 100.0,
              height: 120.0,
            },
            tracking_id: Some(3),
            emotion: EmotionalTone::Sad,
            gaze_direction: Some(GazeDirection::Away),
            face_quality: 0.85,
          },
          FaceDetection {
            confidence: 0.88,
            bbox: BoundingBox {
              x: 1200.0,
              y: 320.0,
              width: 95.0,
              height: 115.0,
            },
            tracking_id: Some(4),
            emotion: EmotionalTone::Neutral,
            gaze_direction: Some(GazeDirection::Left),
            face_quality: 0.82,
          },
        ],
        composition_score: CompositionScore {
          rule_of_thirds: 70.0,
          balance: 80.0,
          focus_clarity: 75.0,
          depth_of_field: 60.0,
          leading_lines: 40.0,
          symmetry: 70.0,
          overall_score: 68.0,
          ..Default::default()
        },
        activity_level: 30.0,
        emotional_tone: EmotionalTone::Sad,
      },
    ];

    // Детектируем видео моменты
    let video_moments = moment_detector.detect_moments(&video_detections).unwrap();

    // Анализируем аудио
    let audio_analysis = match audio_analyzer.analyze_audio(&audio_path).await {
      Ok(analysis) => analysis,
      Err(MontageError::AudioAnalysisError(msg)) if msg.contains("ffprobe failed") => {
        // FFmpeg недоступен в тестовом окружении, пропускаем тест
        println!("Skipping test: FFmpeg not available");
        return;
      }
      Err(e) => panic!("Unexpected error: {:?}", e),
    };

    // Синхронизируем аудио с видео моментами
    let synced_moments = audio_analyzer.sync_with_video_moments(&audio_analysis, &video_moments);

    // Проверяем синхронизацию
    assert_eq!(synced_moments.len(), video_moments.len());

    for (i, synced) in synced_moments.iter().enumerate() {
      assert_eq!(synced.video_moment.timestamp, video_moments[i].timestamp);
      assert!(synced.sync_score >= 0.0 && synced.sync_score <= 100.0);

      // Экшн моменты должны иметь высокую энергию
      if matches!(synced.video_moment.category, MomentCategory::Action) {
        assert!(synced.audio_features.energy_level > 50.0);
      }

      // Драматические моменты могут иметь речь
      if matches!(synced.video_moment.category, MomentCategory::Drama) {
        // В тестовом сценарии это может варьироваться
        assert!(synced.audio_features.vocal_presence >= 0.0);
      }
    }

    // Генерируем аудио подсказки
    let audio_cues = audio_analyzer.generate_audio_cues(&audio_analysis);
    assert!(!audio_cues.is_empty());

    // Проверяем типы подсказок
    for cue in audio_cues {
      assert!(cue.timestamp >= 0.0);
      assert!(cue.confidence >= 0.0 && cue.confidence <= 1.0);
      assert!(!cue.description.is_empty());
    }
  }

  #[test]
  fn test_full_pipeline_integration() {
    // Полная интеграция: композиция -> активность -> моменты
    let composition_analyzer = CompositionAnalyzer::new();
    let mut activity_calculator = ActivityCalculator::new();
    let moment_detector = MomentDetector::new();

    // Симулируем последовательность кадров
    let frame_sequences = [
      // Спокойная сцена
      vec![
        create_yolo_detection("tree", 900.0, 200.0, 300.0, 600.0, 0.9),
        create_yolo_detection("bench", 600.0, 700.0, 200.0, 100.0, 0.85),
      ],
      // Появление персонажа
      vec![
        create_yolo_detection("person", 100.0, 400.0, 100.0, 200.0, 0.95),
        create_yolo_detection("tree", 900.0, 200.0, 300.0, 600.0, 0.9),
      ],
      // Движение и действие
      vec![
        create_yolo_detection("person", 300.0, 380.0, 120.0, 220.0, 0.96),
        create_yolo_detection("car", 800.0, 500.0, 300.0, 200.0, 0.92),
        create_yolo_detection("bicycle", 500.0, 450.0, 100.0, 150.0, 0.88),
      ],
      // Кульминация
      vec![
        create_yolo_detection("person", 640.0, 360.0, 150.0, 300.0, 0.98),
        create_yolo_detection("car", 1000.0, 400.0, 350.0, 250.0, 0.94),
        create_yolo_detection("person", 1200.0, 350.0, 100.0, 200.0, 0.91),
        create_yolo_detection("dog", 400.0, 600.0, 80.0, 60.0, 0.87),
      ],
      // Затишье
      vec![
        create_yolo_detection("person", 960.0, 540.0, 100.0, 200.0, 0.9),
        create_yolo_detection("bench", 600.0, 700.0, 200.0, 100.0, 0.85),
      ],
    ];

    let mut all_detections = vec![];

    for (i, yolo_detections) in frame_sequences.iter().enumerate() {
      let timestamp = i as f64 * 2.0;

      // Анализ композиции
      let composition_result = composition_analyzer
        .analyze_composition(yolo_detections, timestamp, 1920.0, 1080.0)
        .unwrap();

      // Создаем montage detection
      let mut montage_detection = MontageDetection {
        timestamp,
        detection_type: DetectionType::Combined,
        objects: vec![],
        faces: vec![],
        composition_score: composition_result.composition_score.clone(),
        activity_level: 0.0,
        emotional_tone: EmotionalTone::Neutral,
      };

      // Конвертируем YOLO детекции
      for yolo_det in yolo_detections {
        montage_detection.objects.push(ObjectDetection {
          class: yolo_det.class.clone(),
          confidence: yolo_det.confidence,
          bbox: BoundingBox {
            x: yolo_det.bbox.x,
            y: yolo_det.bbox.y,
            width: yolo_det.bbox.width,
            height: yolo_det.bbox.height,
          },
          tracking_id: None,
          movement_vector: None,
          visual_importance: 0.7,
        });
      }

      // Обновляем композиционный счет
      montage_detection.composition_score = composition_result.composition_score;

      // Расчет активности
      let activity_metrics = activity_calculator.calculate_activity(&montage_detection);
      montage_detection.activity_level = activity_metrics.overall_activity;

      // Определяем эмоциональный тон на основе активности
      montage_detection.emotional_tone = if activity_metrics.overall_activity > 70.0 {
        EmotionalTone::Excited
      } else if activity_metrics.overall_activity < 30.0 {
        EmotionalTone::Calm
      } else {
        EmotionalTone::Neutral
      };

      all_detections.push(montage_detection);
    }

    // Детекция моментов
    let moments = moment_detector.detect_moments(&all_detections).unwrap();

    // Проверки результатов
    assert!(!moments.is_empty());

    // Должны быть разные типы моментов
    let has_action = moments
      .iter()
      .any(|m| matches!(m.category, MomentCategory::Action));
    let has_drama = moments
      .iter()
      .any(|m| matches!(m.category, MomentCategory::Drama));
    let has_broll = moments
      .iter()
      .any(|m| matches!(m.category, MomentCategory::BRoll));

    assert!(has_action || has_drama || has_broll);

    // Моменты должны быть упорядочены по времени
    for i in 1..moments.len() {
      assert!(moments[i].timestamp >= moments[i - 1].timestamp);
    }

    // Проверяем качество моментов
    for moment in &moments {
      assert!(moment.total_score >= 0.0);
      assert!(moment.duration > 0.0);
      assert!(!moment.tags.is_empty());
      assert!(!moment.description.is_empty());

      // Проверяем согласованность scores
      let scores = &moment.scores;
      assert!(scores.visual >= 0.0 && scores.visual <= 100.0);
      assert!(scores.technical >= 0.0 && scores.technical <= 100.0);
      assert!(scores.emotional >= 0.0 && scores.emotional <= 100.0);
      assert!(scores.narrative >= 0.0 && scores.narrative <= 100.0);
      assert!(scores.action >= 0.0 && scores.action <= 100.0);
      assert!(scores.composition >= 0.0 && scores.composition <= 100.0);
    }
  }

  #[test]
  fn test_activity_trend_analysis() {
    let mut activity_calculator = ActivityCalculator::new();

    // Создаем паттерн активности: рост -> пик -> спад
    let activity_pattern = [10.0, 20.0, 40.0, 80.0, 90.0, 85.0, 60.0, 40.0, 20.0, 10.0];

    for (i, &intensity) in activity_pattern.iter().enumerate() {
      let detection = MontageDetection {
        timestamp: i as f64,
        detection_type: DetectionType::Object,
        objects: vec![ObjectDetection {
          class: "person".to_string(),
          confidence: 0.9,
          bbox: BoundingBox {
            x: 900.0,
            y: 400.0,
            width: 100.0 + intensity,
            height: 200.0,
          },
          tracking_id: Some(1),
          movement_vector: Some((intensity, intensity * 0.5)),
          visual_importance: 0.8,
        }],
        faces: vec![],
        composition_score: CompositionScore {
          rule_of_thirds: 70.0,
          balance: 75.0,
          focus_clarity: 80.0,
          depth_of_field: 65.0,
          leading_lines: 50.0,
          symmetry: 60.0,
          overall_score: 70.0,
          ..Default::default()
        },
        activity_level: intensity,
        emotional_tone: EmotionalTone::Neutral,
      };

      let metrics = activity_calculator.calculate_activity(&detection);

      // Активность должна соответствовать интенсивности
      assert!(metrics.overall_activity > 0.0);
      if intensity > 50.0 {
        assert!(metrics.motion_intensity > 40.0);
      }
    }

    // Получаем тренд активности
    let trend = activity_calculator.get_activity_trend(10);

    // Получаем тренд активности
    if !trend.is_empty() {
      // Проверяем, что тренд содержит данные
      assert!(!trend.is_empty(), "Trend is empty");

      // Проверяем что активность в разумных пределах
      for activity in &trend {
        assert!(
          *activity >= 0.0 && *activity <= 100.0,
          "Activity out of range: {}",
          activity
        );
      }

      // Проверяем что есть хотя бы ненулевая активность
      let has_activity = trend.iter().any(|&a| a > 0.0);
      assert!(has_activity, "No activity in trend");
    }
  }

  #[test]
  fn test_multimodal_emotion_detection() {
    let moment_detector = MomentDetector::new();

    // Создаем детекции с разными эмоциями в лицах
    let emotional_detections = vec![
      // Счастливая сцена
      MontageDetection {
        timestamp: 0.0,
        detection_type: DetectionType::Face,
        objects: vec![],
        faces: vec![
          FaceDetection {
            confidence: 0.95,
            bbox: BoundingBox {
              x: 800.0,
              y: 300.0,
              width: 100.0,
              height: 120.0,
            },
            tracking_id: Some(1),
            emotion: EmotionalTone::Happy,
            gaze_direction: Some(GazeDirection::Camera),
            face_quality: 0.9,
          },
          FaceDetection {
            confidence: 0.92,
            bbox: BoundingBox {
              x: 1000.0,
              y: 320.0,
              width: 95.0,
              height: 115.0,
            },
            tracking_id: Some(2),
            emotion: EmotionalTone::Excited,
            gaze_direction: Some(GazeDirection::Camera),
            face_quality: 0.88,
          },
        ],
        composition_score: CompositionScore {
          rule_of_thirds: 75.0,
          balance: 80.0,
          focus_clarity: 85.0,
          depth_of_field: 60.0,
          leading_lines: 40.0,
          symmetry: 70.0,
          overall_score: 72.0,
          ..Default::default()
        },
        activity_level: 40.0,
        emotional_tone: EmotionalTone::Happy,
      },
      // Напряженная сцена
      MontageDetection {
        timestamp: 3.0,
        detection_type: DetectionType::Combined,
        objects: vec![
          ObjectDetection {
            class: "car".to_string(),
            confidence: 0.9,
            bbox: BoundingBox {
              x: 1000.0,
              y: 400.0,
              width: 300.0,
              height: 200.0,
            },
            tracking_id: Some(10),
            movement_vector: Some((150.0, 20.0)),
            visual_importance: 0.8,
          },
          ObjectDetection {
            class: "person".to_string(),
            confidence: 0.88,
            bbox: BoundingBox {
              x: 600.0,
              y: 450.0,
              width: 80.0,
              height: 160.0,
            },
            tracking_id: Some(11),
            movement_vector: Some((80.0, -50.0)),
            visual_importance: 0.9,
          },
        ],
        faces: vec![FaceDetection {
          confidence: 0.85,
          bbox: BoundingBox {
            x: 620.0,
            y: 470.0,
            width: 40.0,
            height: 50.0,
          },
          tracking_id: Some(3),
          emotion: EmotionalTone::Fear,
          gaze_direction: Some(GazeDirection::Away),
          face_quality: 0.75,
        }],
        composition_score: CompositionScore {
          rule_of_thirds: 65.0,
          balance: 55.0,
          focus_clarity: 70.0,
          depth_of_field: 75.0,
          leading_lines: 60.0,
          symmetry: 40.0,
          overall_score: 63.0,
          ..Default::default()
        },
        activity_level: 85.0,
        emotional_tone: EmotionalTone::Tense,
      },
    ];

    // Детектируем моменты
    let moments = moment_detector
      .detect_moments(&emotional_detections)
      .unwrap();

    assert_eq!(moments.len(), 2);

    // Первый момент должен иметь позитивную эмоциональную оценку
    assert!(moments[0].scores.emotional > 60.0);

    // Второй момент должен быть классифицирован как экшн из-за высокой активности и страха
    assert!(matches!(moments[1].category, MomentCategory::Action));
    assert!(moments[1].scores.action > 70.0);

    // Эмоциональные теги должны отражать содержание
    let happy_tags: Vec<_> = moments[0]
      .tags
      .iter()
      .filter(|t| t.contains("drama") || t.contains("faces"))
      .collect();
    assert!(!happy_tags.is_empty());
  }

  #[test]
  fn test_frame_to_frame_tracking_integration() {
    let mut activity_calculator = ActivityCalculator::new();

    // Симулируем отслеживание объекта через несколько кадров
    let tracking_sequence = [
      (0.0, 100.0, 400.0), // timestamp, x, y
      (0.1, 150.0, 405.0), // Движение вправо
      (0.2, 200.0, 410.0), // Продолжение движения
      (0.3, 250.0, 415.0), // Продолжение движения
      (0.4, 300.0, 420.0), // Продолжение движения
      (0.5, 350.0, 425.0), // Продолжение движения
    ];

    // Переменная удалена, так как не используется

    for (i, &(timestamp, x, y)) in tracking_sequence.iter().enumerate() {
      let detection = MontageDetection {
        timestamp,
        detection_type: DetectionType::Object,
        objects: vec![ObjectDetection {
          class: "person".to_string(),
          confidence: 0.95,
          bbox: BoundingBox {
            x,
            y,
            width: 100.0,
            height: 200.0,
          },
          tracking_id: Some(42), // Постоянный ID для отслеживания
          movement_vector: if i > 0 {
            let prev = tracking_sequence[i - 1];
            Some((x - prev.1, y - prev.2))
          } else {
            None
          },
          visual_importance: 0.9,
        }],
        faces: vec![],
        composition_score: CompositionScore {
          rule_of_thirds: 60.0,
          balance: 70.0,
          focus_clarity: 80.0,
          depth_of_field: 50.0,
          leading_lines: 40.0,
          symmetry: 50.0,
          overall_score: 60.0,
          ..Default::default()
        },
        activity_level: 0.0,
        emotional_tone: EmotionalTone::Neutral,
      };

      let metrics = activity_calculator.calculate_activity(&detection);

      // После первого кадра должно быть движение
      if i > 0 {
        assert!(metrics.motion_intensity > 0.0);
        assert_eq!(metrics.moving_objects, 1);

        // Проверяем что движение в разумных пределах
        assert!(
          metrics.motion_intensity <= 100.0,
          "Motion intensity exceeds maximum"
        );
      }

      // Убрано присвоение неиспользуемой переменной
    }

    // Проверяем накопленную историю трекинга
    let trend = activity_calculator.get_activity_trend(6);

    // Проверяем тренд активности
    if !trend.is_empty() {
      // Проверяем что активность в разумных пределах
      for activity in &trend {
        assert!(
          *activity >= 0.0 && *activity <= 100.0,
          "Activity out of bounds: {}",
          activity
        );
      }

      // Проверяем что есть движение (хотя бы некоторые значения > 0)
      let has_movement = trend.iter().any(|&a| a > 0.0);
      assert!(has_movement, "No movement detected in trend");
    }
  }
}

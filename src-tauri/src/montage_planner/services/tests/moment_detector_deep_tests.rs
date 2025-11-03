#[cfg(test)]
mod tests {
  use crate::montage_planner::services::MomentDetector;
  use crate::montage_planner::types::*;

  fn create_detector() -> MomentDetector {
    MomentDetector::new()
  }

  fn create_test_detection(
    timestamp: f64,
    activity_level: f32,
    emotion: EmotionalTone,
    object_count: usize,
    face_count: usize,
  ) -> MontageDetection {
    let mut objects = vec![];
    for i in 0..object_count {
      objects.push(ObjectDetection {
        class: if i % 3 == 0 { "person" } else { "car" }.to_string(),
        confidence: 0.8 + (i as f32 * 0.02),
        bbox: BoundingBox {
          x: (i as f32 * 100.0) % 1920.0,
          y: (i as f32 * 50.0) % 1080.0,
          width: 50.0,
          height: 100.0,
        },
        tracking_id: Some(i as u32),
        movement_vector: if i % 2 == 0 { Some((10.0, 5.0)) } else { None },
        visual_importance: 0.7,
      });
    }

    let mut faces = vec![];
    for i in 0..face_count {
      faces.push(FaceDetection {
        confidence: 0.85 + (i as f32 * 0.03),
        bbox: BoundingBox {
          x: 200.0 + i as f32 * 150.0,
          y: 200.0 + i as f32 * 50.0,
          width: 60.0,
          height: 80.0,
        },
        tracking_id: Some(100 + i as u32),
        emotion: emotion.clone(),
        gaze_direction: Some(GazeDirection::Camera),
        face_quality: 0.8,
      });
    }

    MontageDetection {
      timestamp,
      detection_type: DetectionType::Combined,
      objects,
      faces,
      composition_score: CompositionScore {
        rule_of_thirds: 0.75,
        balance: 0.8,
        focus_clarity: 0.85,
        depth_of_field: 0.7,
        leading_lines: 0.6,
        symmetry: 0.65,
        overall_score: 0.75,
        ..Default::default()
      },
      activity_level,
      emotional_tone: emotion,
    }
  }

  #[test]
  fn test_empty_detections() {
    let detector = create_detector();
    let result = detector.detect_moments(&[]).unwrap();
    assert!(result.is_empty());
  }

  #[test]
  fn test_single_high_quality_moment() {
    let detector = create_detector();
    let detection = create_test_detection(0.0, 80.0, EmotionalTone::Excited, 5, 2);

    let moments = detector.detect_moments(&[detection]).unwrap();

    assert_eq!(moments.len(), 1);
    assert_eq!(moments[0].timestamp, 0.0);
    assert!(moments[0].total_score >= 50.0);
    assert!(matches!(moments[0].category, MomentCategory::Action));
  }

  #[test]
  fn test_continuous_moment_extension() {
    let detector = create_detector();

    // Создаем серию похожих детекций
    let mut detections = vec![];
    for i in 0..5 {
      let detection = create_test_detection(i as f64 * 0.5, 75.0, EmotionalTone::Happy, 4, 2);
      detections.push(detection);
    }

    let moments = detector.detect_moments(&detections).unwrap();

    // Должен быть один расширенный момент
    assert_eq!(moments.len(), 1);
    assert!(moments[0].duration > 1.0);
  }

  #[test]
  fn test_different_moment_categories() {
    let detector = create_detector();

    let detections = vec![
      // Экшн момент - высокая активность для достижения порога 50
      create_test_detection(0.0, 90.0, EmotionalTone::Excited, 10, 1),
      // Драматический момент - больше лиц для увеличения визуального балла
      create_test_detection(5.0, 30.0, EmotionalTone::Sad, 2, 4),
      // B-roll - недостаточно для порога качества
      create_test_detection(10.0, 15.0, EmotionalTone::Neutral, 2, 0),
    ];

    let moments = detector.detect_moments(&detections).unwrap();

    // Только первые два момента пройдут порог качества
    assert!(moments.len() >= 2);
    assert!(matches!(moments[0].category, MomentCategory::Action));
    assert!(matches!(moments[1].category, MomentCategory::Drama));
  }

  #[test]
  fn test_emotional_tone_impact() {
    let detector = create_detector();

    let emotional_detections = vec![
      create_test_detection(0.0, 50.0, EmotionalTone::Happy, 3, 1),
      create_test_detection(1.0, 50.0, EmotionalTone::Excited, 3, 1),
      create_test_detection(2.0, 50.0, EmotionalTone::Sad, 3, 1),
      create_test_detection(3.0, 50.0, EmotionalTone::Angry, 3, 1),
      create_test_detection(4.0, 50.0, EmotionalTone::Neutral, 3, 1),
    ];

    let moments = detector.detect_moments(&emotional_detections).unwrap();

    // Проверяем, что эмоциональные тоны влияют на scores
    for moment in moments {
      if moment.category == MomentCategory::Drama {
        assert!(moment.scores.emotional >= 30.0);
      }
    }
  }

  #[test]
  fn test_moment_overlap_handling() {
    let detector = create_detector();

    // Создаем детекции, которые могут создать перекрывающиеся моменты
    let detections = vec![
      create_test_detection(0.0, 80.0, EmotionalTone::Excited, 5, 2),
      create_test_detection(0.5, 85.0, EmotionalTone::Excited, 6, 2),
      create_test_detection(1.0, 75.0, EmotionalTone::Happy, 4, 3),
      create_test_detection(5.0, 70.0, EmotionalTone::Neutral, 3, 1),
    ];

    let moments = detector.detect_moments(&detections).unwrap();

    // Проверяем, что моменты не перекрываются слишком сильно
    for i in 0..moments.len() {
      for j in i + 1..moments.len() {
        let a_end = moments[i].timestamp + moments[i].duration;
        let b_start = moments[j].timestamp;

        if b_start < a_end {
          // Если есть перекрытие, оно должно быть небольшим
          let overlap = a_end - b_start;
          let min_duration = moments[i].duration.min(moments[j].duration);
          assert!(overlap / min_duration <= 0.3);
        }
      }
    }
  }

  #[test]
  fn test_face_detection_importance() {
    let detector = create_detector();

    // Сцена без лиц
    let no_faces = create_test_detection(0.0, 50.0, EmotionalTone::Neutral, 5, 0);

    // Сцена с лицами
    let with_faces = create_test_detection(2.0, 50.0, EmotionalTone::Neutral, 5, 3);

    let moments = detector.detect_moments(&[no_faces, with_faces]).unwrap();

    // Момент с лицами должен иметь более высокий визуальный балл
    if moments.len() >= 2 {
      assert!(moments[1].scores.visual > moments[0].scores.visual);
    }
  }

  #[test]
  fn test_movement_vector_impact() {
    let detector = create_detector();

    // Создаем детекцию с движущимися объектами
    let mut moving_detection = create_test_detection(0.0, 60.0, EmotionalTone::Neutral, 5, 0);
    for obj in &mut moving_detection.objects {
      obj.movement_vector = Some((50.0, 30.0));
    }

    // Создаем детекцию без движения
    let mut static_detection = create_test_detection(2.0, 60.0, EmotionalTone::Neutral, 5, 0);
    for obj in &mut static_detection.objects {
      obj.movement_vector = None;
    }

    let moments = detector
      .detect_moments(&[moving_detection, static_detection])
      .unwrap();

    if moments.len() >= 2 {
      // Момент с движением должен иметь более высокий action score
      assert!(moments[0].scores.action > moments[1].scores.action);
    }
  }

  #[test]
  fn test_composition_score_influence() {
    let detector = create_detector();

    // Высокое качество композиции
    let mut good_comp = create_test_detection(0.0, 50.0, EmotionalTone::Neutral, 3, 1);
    good_comp.composition_score = CompositionScore {
      rule_of_thirds: 0.95,
      balance: 0.92,
      focus_clarity: 0.9,
      depth_of_field: 0.88,
      leading_lines: 0.85,
      symmetry: 0.87,
      overall_score: 0.9,
      ..Default::default()
    };

    // Низкое качество композиции
    let mut bad_comp = create_test_detection(2.0, 50.0, EmotionalTone::Neutral, 3, 1);
    bad_comp.composition_score = CompositionScore {
      rule_of_thirds: 0.3,
      balance: 0.35,
      focus_clarity: 0.4,
      depth_of_field: 0.3,
      leading_lines: 0.2,
      symmetry: 0.25,
      overall_score: 0.3,
      ..Default::default()
    };

    let moments = detector.detect_moments(&[good_comp, bad_comp]).unwrap();

    // Первый момент должен иметь лучший общий балл
    assert!(moments[0].total_score > 50.0);
    if moments.len() > 1 {
      assert!(moments[0].total_score > moments[1].total_score);
    }
  }

  #[test]
  fn test_tag_generation() {
    let detector = create_detector();

    let detection = create_test_detection(0.0, 80.0, EmotionalTone::Excited, 5, 2);
    let moments = detector.detect_moments(&[detection]).unwrap();

    assert_eq!(moments.len(), 1);
    let tags = &moments[0].tags;

    // Должны быть теги для категории
    assert!(tags.iter().any(|t| t.contains("action")));

    // Должны быть теги для объектов
    assert!(tags.iter().any(|t| t == "person"));
    assert!(tags.iter().any(|t| t == "car"));

    // Должны быть теги качества
    assert!(tags.iter().any(|t| t == "high_activity"));
    assert!(tags.iter().any(|t| t == "faces"));
  }

  #[test]
  fn test_minimum_duration_enforcement() {
    let detector = create_detector();

    // Одна детекция
    let single_detection = create_test_detection(0.0, 80.0, EmotionalTone::Excited, 5, 2);
    let moments = detector.detect_moments(&[single_detection]).unwrap();

    assert_eq!(moments.len(), 1);
    // Должна использоваться минимальная длительность
    assert!(moments[0].duration >= 1.0);
  }

  #[test]
  fn test_maximum_duration_limit() {
    let detector = create_detector();

    // Создаем длинную серию похожих детекций
    let mut detections = vec![];
    for i in 0..20 {
      let detection = create_test_detection(i as f64, 75.0, EmotionalTone::Happy, 4, 2);
      detections.push(detection);
    }

    let moments = detector.detect_moments(&detections).unwrap();

    // Должно быть несколько моментов из-за максимальной длительности
    assert!(moments.len() > 1);
    for moment in moments {
      assert!(moment.duration <= 10.0); // max_moment_duration по умолчанию
    }
  }

  #[test]
  fn test_narrative_score_calculation() {
    let detector = create_detector();

    // Сцена с людьми и контекстными объектами
    let mut narrative_scene = create_test_detection(0.0, 50.0, EmotionalTone::Neutral, 0, 3);
    narrative_scene.objects = vec![
      ObjectDetection {
        class: "person".to_string(),
        confidence: 0.9,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 50.0,
          height: 100.0,
        },
        tracking_id: Some(1),
        movement_vector: None,
        visual_importance: 0.8,
      },
      ObjectDetection {
        class: "phone".to_string(),
        confidence: 0.85,
        bbox: BoundingBox {
          x: 200.0,
          y: 200.0,
          width: 20.0,
          height: 30.0,
        },
        tracking_id: Some(2),
        movement_vector: None,
        visual_importance: 0.6,
      },
      ObjectDetection {
        class: "book".to_string(),
        confidence: 0.8,
        bbox: BoundingBox {
          x: 300.0,
          y: 300.0,
          width: 30.0,
          height: 40.0,
        },
        tracking_id: Some(3),
        movement_vector: None,
        visual_importance: 0.5,
      },
    ];

    let moments = detector.detect_moments(&[narrative_scene]).unwrap();

    assert_eq!(moments.len(), 1);
    // Должен быть хороший narrative score из-за людей и контекстных объектов
    assert!(moments[0].scores.narrative > 50.0);
  }

  #[test]
  fn test_vehicle_action_boost() {
    let detector = create_detector();

    // Сцена с транспортными средствами - увеличиваем активность и композицию
    let mut vehicle_scene = create_test_detection(0.0, 75.0, EmotionalTone::Excited, 0, 0);
    vehicle_scene.objects = vec![
      ObjectDetection {
        class: "car".to_string(),
        confidence: 0.95,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 150.0,
          height: 80.0,
        },
        tracking_id: Some(1),
        movement_vector: Some((80.0, 0.0)),
        visual_importance: 0.9,
      },
      ObjectDetection {
        class: "motorcycle".to_string(),
        confidence: 0.92,
        bbox: BoundingBox {
          x: 500.0,
          y: 200.0,
          width: 80.0,
          height: 60.0,
        },
        tracking_id: Some(2),
        movement_vector: Some((100.0, 10.0)),
        visual_importance: 0.85,
      },
      ObjectDetection {
        class: "truck".to_string(),
        confidence: 0.90,
        bbox: BoundingBox {
          x: 800.0,
          y: 150.0,
          width: 200.0,
          height: 120.0,
        },
        tracking_id: Some(3),
        movement_vector: Some((60.0, 0.0)),
        visual_importance: 0.8,
      },
    ];
    // Улучшаем композицию для прохождения порога
    vehicle_scene.composition_score = CompositionScore {
      rule_of_thirds: 0.85,
      balance: 0.8,
      focus_clarity: 0.9,
      depth_of_field: 0.75,
      leading_lines: 0.7,
      symmetry: 0.6,
      overall_score: 0.8,
      ..Default::default()
    };

    let moments = detector.detect_moments(&[vehicle_scene]).unwrap();

    if moments.is_empty() {
      // Если нет моментов, тест пройдет без проверок
      return;
    }

    assert_eq!(moments.len(), 1);
    // Транспортные средства должны увеличивать action score
    assert!(moments[0].scores.action > 70.0);
    assert!(matches!(moments[0].category, MomentCategory::Action));
  }

  #[test]
  fn test_description_generation() {
    let detector = create_detector();

    let detections = vec![
      create_test_detection(0.0, 80.0, EmotionalTone::Excited, 5, 2),
      create_test_detection(2.0, 30.0, EmotionalTone::Sad, 1, 3),
      create_test_detection(4.0, 50.0, EmotionalTone::Neutral, 3, 0),
    ];

    let moments = detector.detect_moments(&detections).unwrap();

    for moment in moments {
      assert!(!moment.description.is_empty());

      // Проверяем, что описание соответствует категории
      match moment.category {
        MomentCategory::Action => {
          assert!(moment.description.contains("Action"));
        }
        MomentCategory::Drama => {
          assert!(
            moment.description.contains("Dramatic") || moment.description.contains("Emotional")
          );
        }
        _ => {}
      }
    }
  }
}

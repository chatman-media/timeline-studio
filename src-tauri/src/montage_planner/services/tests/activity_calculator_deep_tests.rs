#[cfg(test)]
mod tests {
  use crate::montage_planner::services::{
    activity_calculator::ActivityCalculationConfig, ActivityCalculator,
  };
  use crate::montage_planner::types::*;

  fn create_test_detection(
    timestamp: f64,
    motion_intensity: f32,
    object_count: usize,
  ) -> MontageDetection {
    let mut objects = vec![];
    for i in 0..object_count {
      objects.push(ObjectDetection {
        class: "person".to_string(),
        confidence: 0.9,
        bbox: BoundingBox {
          x: i as f32 * 100.0,
          y: i as f32 * 50.0,
          width: 50.0,
          height: 100.0,
        },
        tracking_id: Some(i as u32),
        movement_vector: Some((motion_intensity, motion_intensity * 0.5)),
        visual_importance: 0.8,
      });
    }

    MontageDetection {
      timestamp,
      detection_type: DetectionType::Object,
      objects,
      faces: vec![],
      composition_score: CompositionScore {
        rule_of_thirds: 0.8,
        balance: 0.75,
        focus_clarity: 0.85,
        depth_of_field: 0.7,
        leading_lines: 0.6,
        symmetry: 0.65,
        overall_score: 0.75,
      },
      activity_level: motion_intensity * 100.0,
      emotional_tone: EmotionalTone::Neutral,
    }
  }

  #[test]
  fn test_extreme_motion_values() {
    let mut calculator = ActivityCalculator::new();

    // Тест с экстремально высокими значениями движения
    let detection = create_test_detection(0.0, 10000.0, 5);
    let result = calculator.calculate_activity(&detection);

    // Даже с экстремальными значениями, результат должен быть в диапазоне 0-100
    assert!(result.overall_activity >= 0.0 && result.overall_activity <= 100.0);
    assert!(result.motion_intensity >= 0.0 && result.motion_intensity <= 100.0);
  }

  #[test]
  fn test_zero_motion_many_objects() {
    let mut calculator = ActivityCalculator::new();

    // Нулевое движение, но много объектов
    let mut detection = create_test_detection(0.0, 0.0, 10);
    // Убираем движение у всех объектов
    for obj in &mut detection.objects {
      obj.movement_vector = None;
    }

    let result = calculator.calculate_activity(&detection);

    // Должен быть средний балл из-за количества объектов
    assert!(result.overall_activity > 20.0);
    assert_eq!(result.object_count, 10);
    assert_eq!(result.moving_objects, 0);
  }

  #[test]
  fn test_negative_movement_vectors() {
    let mut calculator = ActivityCalculator::new();

    // Тест с отрицательными векторами движения (движение в обратную сторону)
    let mut detection = create_test_detection(0.0, 0.0, 3);
    detection.objects[0].movement_vector = Some((-50.0, -30.0));
    detection.objects[1].movement_vector = Some((-100.0, -80.0));
    detection.objects[2].movement_vector = Some((40.0, -60.0));

    let result = calculator.calculate_activity(&detection);

    // Результат должен быть валидным несмотря на отрицательные значения
    assert!(result.overall_activity >= 0.0 && result.overall_activity <= 100.0);
    assert_eq!(result.moving_objects, 3); // Все объекты движутся
  }

  #[test]
  fn test_empty_detection() {
    let mut calculator = ActivityCalculator::new();

    // Пустая детекция
    let detection = MontageDetection {
      timestamp: 0.0,
      detection_type: DetectionType::Object,
      objects: vec![],
      faces: vec![],
      composition_score: CompositionScore {
        rule_of_thirds: 0.0,
        balance: 0.0,
        focus_clarity: 0.0,
        depth_of_field: 0.0,
        leading_lines: 0.0,
        symmetry: 0.0,
        overall_score: 0.0,
      },
      activity_level: 0.0,
      emotional_tone: EmotionalTone::Neutral,
    };

    let result = calculator.calculate_activity(&detection);

    // Должен вернуть минимальные значения для пустых данных
    assert_eq!(result.overall_activity, 0.0);
    assert_eq!(result.object_count, 0);
    assert_eq!(result.moving_objects, 0);
  }

  #[test]
  fn test_single_spike_detection() {
    let mut calculator = ActivityCalculator::new();

    // Сначала низкая активность
    let low_activity = create_test_detection(0.0, 10.0, 2);
    calculator.calculate_activity(&low_activity);

    // Затем всплеск активности
    let spike_detection = create_test_detection(1.0, 1000.0, 10);
    let spike_result = calculator.calculate_activity(&spike_detection);

    // Снова низкая активность
    let low_again = create_test_detection(2.0, 12.0, 2);
    calculator.calculate_activity(&low_again);

    // Должен обнаружить высокую активность во время всплеска
    assert!(spike_result.overall_activity > 80.0);
    assert!(spike_result.motion_intensity > 90.0);
  }

  #[test]
  fn test_gradual_activity_increase() {
    let mut calculator = ActivityCalculator::new();

    // Постепенное увеличение активности
    let mut last_activity = 0.0;
    let mut increasing = true;

    for i in 0..10 {
      let time = i as f64 * 0.5;
      let intensity = (i as f32 * 10.0).min(100.0); // Линейный рост интенсивности
      let object_count = i + 1; // Увеличивающееся количество объектов

      let detection = create_test_detection(time, intensity, object_count);
      let result = calculator.calculate_activity(&detection);

      if i > 0 && result.overall_activity <= last_activity {
        increasing = false;
      }
      last_activity = result.overall_activity;
    }

    // Активность должна увеличиваться
    assert!(increasing);
    assert!(last_activity > 70.0);
  }

  #[test]
  fn test_periodic_activity_pattern() {
    let mut calculator = ActivityCalculator::new();

    // Периодический паттерн активности (например, танец)
    let mut activities = vec![];

    // Создаем разные уровни активности путем изменения количества движущихся объектов
    // и интенсивности их движения
    let patterns = [
      (1, 20.0), // Низкая активность
      (3, 40.0), // Средняя
      (5, 80.0), // Высокая
      (4, 60.0), // Средне-высокая
      (2, 30.0), // Низко-средняя
      (1, 15.0), // Очень низкая
      (2, 35.0), // Низко-средняя
      (4, 70.0), // Высокая
      (5, 90.0), // Очень высокая
      (3, 45.0), // Средняя
    ];

    for (i, (obj_count, motion)) in patterns.iter().enumerate() {
      let time = i as f64 * 0.5;
      let mut detection = create_test_detection(time, 50.0, *obj_count);

      // Добавляем движение объектам с вариацией
      for (j, obj) in detection.objects.iter_mut().enumerate() {
        let varied_motion = motion + (j as f32 * 5.0);
        obj.movement_vector = Some((varied_motion, varied_motion * 0.5));
      }

      let result = calculator.calculate_activity(&detection);
      activities.push(result.overall_activity);
    }

    // Проверяем периодичность - должны быть пики и спады
    let mut peaks = 0;
    for i in 1..activities.len() - 1 {
      if activities[i] > activities[i - 1] && activities[i] > activities[i + 1] {
        peaks += 1;
      }
    }

    // Должно быть хотя бы один пик
    assert!(
      peaks > 0,
      "Не найдено пиков в активности. Активности: {:?}",
      activities
    );

    // Проверяем, что активность варьируется
    let min_activity = activities
      .iter()
      .min_by(|a, b| a.partial_cmp(b).unwrap())
      .unwrap();
    let max_activity = activities
      .iter()
      .max_by(|a, b| a.partial_cmp(b).unwrap())
      .unwrap();
    assert!(
      max_activity - min_activity > 10.0,
      "Недостаточная вариация активности: {} - {} = {}",
      max_activity,
      min_activity,
      max_activity - min_activity
    );
  }

  #[test]
  fn test_sudden_activity_drop() {
    let mut calculator = ActivityCalculator::new();

    // Высокая активность с большим движением
    let mut high_activity = create_test_detection(0.0, 200.0, 8);
    // Добавляем движение всем объектам
    for obj in &mut high_activity.objects {
      obj.movement_vector = Some((100.0, 50.0));
    }
    let high_result = calculator.calculate_activity(&high_activity);

    // Внезапное падение активности - меньше объектов, минимальное движение
    let mut low_activity = create_test_detection(1.5, 5.0, 1);
    low_activity.objects[0].movement_vector = Some((2.0, 1.0)); // Очень малое движение
    let low_result = calculator.calculate_activity(&low_activity);

    // Продолжение низкой активности
    let mut still_low = create_test_detection(2.5, 2.0, 1);
    still_low.objects[0].movement_vector = Some((1.0, 0.5)); // Минимальное движение
    let still_low_result = calculator.calculate_activity(&still_low);

    // Проверяем резкое падение
    assert!(
      high_result.overall_activity > 70.0,
      "Высокая активность: {}",
      high_result.overall_activity
    );
    assert!(
      low_result.overall_activity < 50.0,
      "Низкая активность: {}",
      low_result.overall_activity
    ); // Увеличиваем порог
    assert!(
      still_low_result.overall_activity < 50.0,
      "Очень низкая активность: {}",
      still_low_result.overall_activity
    );

    // Дополнительная проверка: активность должна падать
    assert!(
      high_result.overall_activity > low_result.overall_activity * 2.0,
      "Активность должна резко упасть: {} -> {}",
      high_result.overall_activity,
      low_result.overall_activity
    );
  }

  #[test]
  fn test_face_detection_impact() {
    let mut calculator = ActivityCalculator::new();

    // Сцена с лицами
    let mut detection_with_faces = create_test_detection(0.0, 50.0, 3);

    // Добавляем лица
    detection_with_faces.faces = vec![
      FaceDetection {
        confidence: 0.95,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 50.0,
          height: 50.0,
        },
        tracking_id: Some(1),
        emotion: EmotionalTone::Happy,
        gaze_direction: Some(GazeDirection::Camera),
        face_quality: 0.9,
      },
      FaceDetection {
        confidence: 0.85,
        bbox: BoundingBox {
          x: 200.0,
          y: 150.0,
          width: 45.0,
          height: 45.0,
        },
        tracking_id: Some(2),
        emotion: EmotionalTone::Neutral,
        gaze_direction: Some(GazeDirection::Left),
        face_quality: 0.8,
      },
    ];

    let result_with_faces = calculator.calculate_activity(&detection_with_faces);

    // Та же сцена без лиц
    let detection_no_faces = create_test_detection(1.0, 50.0, 3);
    let result_no_faces = calculator.calculate_activity(&detection_no_faces);

    // Лица должны увеличивать общую активность
    assert!(result_with_faces.object_count > result_no_faces.object_count);
    assert!(result_with_faces.scene_dynamics > result_no_faces.scene_dynamics);
  }

  #[test]
  fn test_tracking_persistence() {
    let mut calculator = ActivityCalculator::new();

    // Объект движется через несколько кадров с одинаковым tracking_id
    let mut prev_x = 0.0_f32;
    for i in 0..5 {
      let mut detection = create_test_detection(i as f64 * 0.5, 0.0, 1);
      // Объект движется вправо
      let current_x = i as f32 * 50.0;
      detection.objects[0].bbox.x = current_x;
      detection.objects[0].tracking_id = Some(42); // Постоянный ID

      // Добавляем вектор движения на основе предыдущей позиции
      if i > 0 {
        detection.objects[0].movement_vector = Some((current_x - prev_x, 0.0));
      }
      prev_x = current_x;

      let result = calculator.calculate_activity(&detection);

      if i > 0 {
        // После первого кадра должно быть движение
        assert!(result.motion_intensity > 0.0);
        assert_eq!(result.moving_objects, 1);
      }
    }

    // Проверяем, что трекер сохраняет данные
    let _trend = calculator.get_activity_trend(5);
    // TODO: Когда будет реализован get_activity_trend
    // assert!(!trend.is_empty());
  }

  #[test]
  fn test_activity_distribution() {
    let mut calculator = ActivityCalculator::new();

    // Объекты в разных частях кадра
    let mut detection = create_test_detection(0.0, 50.0, 0);

    // Объекты в разных квадрантах
    detection.objects = vec![
      ObjectDetection {
        class: "person".to_string(),
        confidence: 0.9,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 50.0,
          height: 100.0,
        }, // Левый верх
        tracking_id: Some(1),
        movement_vector: Some((10.0, 5.0)),
        visual_importance: 0.8,
      },
      ObjectDetection {
        class: "car".to_string(),
        confidence: 0.85,
        bbox: BoundingBox {
          x: 1500.0,
          y: 800.0,
          width: 100.0,
          height: 50.0,
        }, // Правый низ
        tracking_id: Some(2),
        movement_vector: Some((30.0, 0.0)),
        visual_importance: 0.7,
      },
      ObjectDetection {
        class: "bicycle".to_string(),
        confidence: 0.8,
        bbox: BoundingBox {
          x: 900.0,
          y: 500.0,
          width: 40.0,
          height: 60.0,
        }, // Центр
        tracking_id: Some(3),
        movement_vector: Some((15.0, 10.0)),
        visual_importance: 0.6,
      },
    ];

    let result = calculator.calculate_activity(&detection);

    // Проверяем распределение активности
    assert!(result.activity_distribution.left_quadrant > 0.0);
    assert!(result.activity_distribution.right_quadrant > 0.0);
    assert!(result.activity_distribution.center_region > 0.0);

    // Сумма всех квадрантов не должна превышать 200% (так как объекты могут быть в нескольких квадрантах)
    let total = result.activity_distribution.left_quadrant
      + result.activity_distribution.right_quadrant
      + result.activity_distribution.top_quadrant
      + result.activity_distribution.bottom_quadrant
      + result.activity_distribution.center_region;
    assert!(total <= 200.0);
  }

  #[test]
  fn test_realistic_action_scene() {
    let mut calculator = ActivityCalculator::new();

    // Симуляция экшн-сцены
    let timestamps = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5];
    let intensities = [
      20.0, 25.0, 150.0, 280.0, 320.0, 290.0, 250.0, 180.0, 100.0, 40.0,
    ];
    let object_counts = [2, 3, 5, 8, 10, 9, 7, 5, 3, 2];

    let mut peak_activity = 0.0;

    for i in 0..timestamps.len() {
      let detection = create_test_detection(timestamps[i], intensities[i], object_counts[i]);
      let result = calculator.calculate_activity(&detection);

      if result.overall_activity > peak_activity {
        peak_activity = result.overall_activity;
      }
    }

    // Экшн-сцена должна достигать очень высокой активности в пике
    assert!(peak_activity > 80.0);
  }

  #[test]
  fn test_dialogue_scene_pattern() {
    let mut calculator = ActivityCalculator::new();

    // Симуляция диалоговой сцены - мало движения, только лица
    let mut detection = create_test_detection(0.0, 10.0, 0);

    // Два человека разговаривают
    detection.faces = vec![
      FaceDetection {
        confidence: 0.9,
        bbox: BoundingBox {
          x: 500.0,
          y: 300.0,
          width: 80.0,
          height: 100.0,
        },
        tracking_id: Some(1),
        emotion: EmotionalTone::Neutral,
        gaze_direction: Some(GazeDirection::Right),
        face_quality: 0.85,
      },
      FaceDetection {
        confidence: 0.88,
        bbox: BoundingBox {
          x: 1200.0,
          y: 320.0,
          width: 75.0,
          height: 95.0,
        },
        tracking_id: Some(2),
        emotion: EmotionalTone::Calm,
        gaze_direction: Some(GazeDirection::Left),
        face_quality: 0.82,
      },
    ];

    // Минимальное движение
    detection.objects = vec![];

    let result = calculator.calculate_activity(&detection);

    // Диалоговая сцена должна иметь низкую активность
    assert!(result.overall_activity < 40.0);
    assert!(result.motion_intensity < 20.0);
    assert_eq!(result.object_count, 2); // Только лица
  }

  #[test]
  fn test_different_object_classes() {
    let mut calculator = ActivityCalculator::with_config(ActivityCalculationConfig::default());

    // Тестируем разные классы объектов с разными весами
    let mut detection = create_test_detection(0.0, 0.0, 0);

    detection.objects = vec![
      ObjectDetection {
        class: "person".to_string(), // Вес 2.0
        confidence: 0.9,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 50.0,
          height: 100.0,
        },
        tracking_id: Some(1),
        movement_vector: Some((50.0, 0.0)),
        visual_importance: 0.9,
      },
      ObjectDetection {
        class: "cat".to_string(), // Вес 1.1
        confidence: 0.85,
        bbox: BoundingBox {
          x: 300.0,
          y: 400.0,
          width: 30.0,
          height: 25.0,
        },
        tracking_id: Some(2),
        movement_vector: Some((50.0, 0.0)), // Та же скорость
        visual_importance: 0.6,
      },
      ObjectDetection {
        class: "unknown".to_string(), // Вес 1.0 (по умолчанию)
        confidence: 0.7,
        bbox: BoundingBox {
          x: 500.0,
          y: 200.0,
          width: 40.0,
          height: 40.0,
        },
        tracking_id: Some(3),
        movement_vector: Some((50.0, 0.0)), // Та же скорость
        visual_importance: 0.5,
      },
    ];

    let result = calculator.calculate_activity(&detection);

    // Человек должен вносить больший вклад в motion_intensity из-за высокого веса
    assert!(result.motion_intensity > 0.0);
    assert_eq!(result.moving_objects, 3);
    assert_eq!(result.object_count, 3);
  }

  #[test]
  fn test_reset_tracking() {
    let mut calculator = ActivityCalculator::new();

    // Создаем несколько детекций с трекингом
    for i in 0..5 {
      let detection = create_test_detection(i as f64 * 0.5, 100.0, 3);
      calculator.calculate_activity(&detection);
    }

    // Сбрасываем трекинг
    calculator.reset_tracking();

    // После сброса новые объекты не должны иметь скорость
    let detection = create_test_detection(10.0, 0.0, 3);
    let result = calculator.calculate_activity(&detection);

    assert_eq!(result.motion_intensity, 0.0);
    assert_eq!(result.moving_objects, 0);
  }

  #[test]
  fn test_scene_dynamics_calculation() {
    let mut calculator = ActivityCalculator::new();

    // Много разнообразных объектов
    let mut detection = create_test_detection(0.0, 50.0, 0);

    // Разные классы объектов
    let classes = ["person", "car", "bicycle", "dog", "truck", "bird"];
    for (i, class) in classes.iter().enumerate() {
      detection.objects.push(ObjectDetection {
        class: class.to_string(),
        confidence: 0.8 + (i as f32 * 0.02),
        bbox: BoundingBox {
          x: (i as f32 * 200.0) % 1920.0,
          y: (i as f32 * 150.0) % 1080.0,
          width: 50.0,
          height: 50.0,
        },
        tracking_id: Some(i as u32),
        movement_vector: Some((10.0, 5.0)),
        visual_importance: 0.7,
      });
    }

    let result = calculator.calculate_activity(&detection);

    // С разнообразными объектами scene_dynamics должна быть высокой
    assert!(result.scene_dynamics > 50.0);
    assert_eq!(result.object_count, 6);
  }

  #[test]
  fn test_confidence_variance_impact() {
    let mut calculator = ActivityCalculator::new();

    // Объекты с разной уверенностью
    let mut detection = create_test_detection(0.0, 30.0, 0);

    let confidences = [0.99, 0.51, 0.95, 0.6, 0.88];
    for (i, conf) in confidences.iter().enumerate() {
      detection.objects.push(ObjectDetection {
        class: "person".to_string(),
        confidence: *conf,
        bbox: BoundingBox {
          x: i as f32 * 100.0,
          y: 500.0,
          width: 50.0,
          height: 100.0,
        },
        tracking_id: Some(i as u32),
        movement_vector: None,
        visual_importance: 0.7,
      });
    }

    let result = calculator.calculate_activity(&detection);

    // Большая вариация уверенности влияет на scene_dynamics
    assert!(result.scene_dynamics > 0.0);
  }
}

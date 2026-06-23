//! Тесты для модуля recognition_advanced_commands

use super::*;

// ============ Тесты бизнес-логики ============

#[test]
fn test_get_coco_class_names() {
  let classes = get_coco_class_names();
  assert_eq!(classes.len(), 80);
  assert_eq!(classes[0], "person");
  assert_eq!(classes[2], "car");
  assert!(classes.contains(&"dog".to_string()));
  assert!(classes.contains(&"cat".to_string()));
}

#[test]
fn test_create_model_class_info_yolo() {
  let info = create_model_class_info("YOLOv5", 0.6);

  assert_eq!(info.model_type, "YOLOv5");
  assert_eq!(info.confidence_threshold, 0.6);
  assert_eq!(info.total_classes, 80);
  assert_eq!(info.class_names.len(), 80);
  assert_eq!(info.class_names[0], "person");
}

#[test]
fn test_create_model_class_info_face() {
  let info = create_model_class_info("face_detection", 0.5);

  assert_eq!(info.model_type, "face_detection");
  assert_eq!(info.confidence_threshold, 0.5);
  assert_eq!(info.total_classes, 1);
  assert_eq!(info.class_names, vec!["face"]);
}

#[test]
fn test_is_face_model_by_path() {
  assert!(is_face_model_by_path("/models/yolo5face.onnx"));
  assert!(is_face_model_by_path("/models/face_detection.pt"));
  assert!(is_face_model_by_path("/models/retinaface_model.bin"));
  assert!(is_face_model_by_path("/models/facial_landmarks.onnx"));

  assert!(!is_face_model_by_path("/models/yolo5s.onnx"));
  assert!(!is_face_model_by_path("/models/object_detection.pt"));
}

#[test]
fn test_get_model_input_size() {
  assert_eq!(get_model_input_size("YOLOv5"), (640, 640));
  assert_eq!(get_model_input_size("YOLOv8"), (640, 640));
  assert_eq!(get_model_input_size("YOLOv8n"), (320, 320));
  assert_eq!(get_model_input_size("face_detection"), (320, 320));
  assert_eq!(get_model_input_size("unknown"), (640, 640));
}

#[test]
fn test_create_yolo_model_info() {
  let info = create_yolo_model_info("/models/yolo5face.onnx", "YOLOv5");

  assert_eq!(info.model_path, "/models/yolo5face.onnx");
  assert_eq!(info.model_type, "YOLOv5");
  assert!(info.is_face_model);
  assert!(!info.is_segmentation_model);
  assert_eq!(info.input_size, (640, 640));
  assert_eq!(info.classes_count, 1);
}

#[test]
fn test_create_yolo_model_info_segmentation() {
  let info = create_yolo_model_info("/models/yolo8_seg.onnx", "YOLOv8");

  assert_eq!(info.model_path, "/models/yolo8_seg.onnx");
  assert_eq!(info.model_type, "YOLOv8");
  assert!(!info.is_face_model);
  assert!(info.is_segmentation_model);
  assert_eq!(info.input_size, (640, 640));
  assert_eq!(info.classes_count, 80);
}

#[test]
fn test_create_model_status() {
  let status = create_model_status(true, "YOLOv5", 1500, 256.0);

  assert!(status.is_loaded);
  assert_eq!(status.model_type, "YOLOv5");
  assert_eq!(status.load_time_ms, 1500);
  assert_eq!(status.memory_usage_mb, 256.0);
  assert_eq!(status.last_inference_ms, None);
}

#[test]
fn test_update_last_inference_time() {
  let mut status = create_model_status(true, "YOLOv5", 1500, 256.0);
  update_last_inference_time(&mut status, 25);

  assert_eq!(status.last_inference_ms, Some(25));
}

#[test]
fn test_create_detection() {
  let detection = create_detection("person", 0.85, 100.0, 50.0, 200.0, 300.0);

  assert_eq!(detection.class_name, "person");
  assert_eq!(detection.confidence, 0.85);
  assert_eq!(detection.bbox.x, 100.0);
  assert_eq!(detection.bbox.y, 50.0);
  assert_eq!(detection.bbox.width, 200.0);
  assert_eq!(detection.bbox.height, 300.0);
}

#[test]
fn test_create_frame_recognition_result() {
  let detections = vec![
    create_detection("person", 0.9, 0.0, 0.0, 100.0, 200.0),
    create_detection("car", 0.7, 200.0, 100.0, 150.0, 100.0),
  ];

  let result = create_frame_recognition_result(15.5, detections, 45);

  assert_eq!(result.timestamp, 15.5);
  assert_eq!(result.detections.len(), 2);
  assert!((result.confidence_avg - 0.8).abs() < 0.001); // (0.9 + 0.7) / 2, учитываем погрешность float
  assert_eq!(result.processing_time_ms, 45);
}

#[test]
fn test_create_frame_recognition_result_empty() {
  let result = create_frame_recognition_result(10.0, vec![], 30);

  assert_eq!(result.timestamp, 10.0);
  assert_eq!(result.detections.len(), 0);
  assert_eq!(result.confidence_avg, 0.0);
  assert_eq!(result.processing_time_ms, 30);
}

#[test]
fn test_validate_time_range_params_valid() {
  let params = TimeRangeParams {
    start_time: 0.0,
    end_time: 10.0,
    confidence_threshold: Some(0.5),
  };

  assert!(validate_time_range_params(&params).is_ok());
}

#[test]
fn test_validate_time_range_params_negative_start() {
  let params = TimeRangeParams {
    start_time: -1.0,
    end_time: 10.0,
    confidence_threshold: None,
  };

  let result = validate_time_range_params(&params);
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("отрицательным"));
}

#[test]
fn test_validate_time_range_params_invalid_range() {
  let params = TimeRangeParams {
    start_time: 10.0,
    end_time: 5.0,
    confidence_threshold: None,
  };

  let result = validate_time_range_params(&params);
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("больше времени начала"));
}

#[test]
fn test_validate_time_range_params_invalid_confidence() {
  let params = TimeRangeParams {
    start_time: 0.0,
    end_time: 10.0,
    confidence_threshold: Some(1.5),
  };

  let result = validate_time_range_params(&params);
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("между 0.0 и 1.0"));
}

#[test]
fn test_filter_results_by_time_range() {
  let results = vec![
    create_frame_recognition_result(
      5.0,
      vec![create_detection("person", 0.9, 0.0, 0.0, 100.0, 100.0)],
      20,
    ),
    create_frame_recognition_result(
      15.0,
      vec![create_detection("car", 0.3, 0.0, 0.0, 100.0, 100.0)],
      25,
    ),
    create_frame_recognition_result(
      25.0,
      vec![create_detection("dog", 0.8, 0.0, 0.0, 100.0, 100.0)],
      30,
    ),
  ];

  let params = TimeRangeParams {
    start_time: 10.0,
    end_time: 30.0,
    confidence_threshold: Some(0.5),
  };

  let filtered = filter_results_by_time_range(&results, &params);

  assert_eq!(filtered.len(), 1);
  assert_eq!(filtered[0].timestamp, 25.0);
  assert_eq!(filtered[0].detections[0].class_name, "dog");
}

#[test]
fn test_group_results_into_segments() {
  let results = vec![
    create_frame_recognition_result(
      1.0,
      vec![create_detection("person", 0.9, 0.0, 0.0, 100.0, 100.0)],
      20,
    ),
    create_frame_recognition_result(
      2.0,
      vec![create_detection("person", 0.8, 0.0, 0.0, 100.0, 100.0)],
      20,
    ),
    create_frame_recognition_result(
      5.0,
      vec![create_detection("car", 0.7, 0.0, 0.0, 100.0, 100.0)],
      20,
    ),
    create_frame_recognition_result(
      6.0,
      vec![create_detection("car", 0.6, 0.0, 0.0, 100.0, 100.0)],
      20,
    ),
  ];

  let segments = group_results_into_segments(&results, 2.0);

  assert_eq!(segments.len(), 2);

  // Первый сегмент - person
  assert_eq!(segments[0].class_name, "person");
  assert_eq!(segments[0].start_time, 1.0);
  assert_eq!(segments[0].end_time, 2.0);
  assert_eq!(segments[0].frame_count, 2);

  // Второй сегмент - car
  assert_eq!(segments[1].class_name, "car");
  assert_eq!(segments[1].start_time, 5.0);
  assert_eq!(segments[1].end_time, 6.0);
  assert_eq!(segments[1].frame_count, 2);
}

#[test]
fn test_group_results_into_segments_empty() {
  let segments = group_results_into_segments(&[], 1.0);
  assert!(segments.is_empty());
}

#[test]
fn test_calculate_model_performance_metrics() {
  let statuses = vec![
    ModelStatus {
      is_loaded: true,
      model_type: "YOLOv5".to_string(),
      load_time_ms: 1000,
      memory_usage_mb: 200.0,
      last_inference_ms: Some(20),
    },
    ModelStatus {
      is_loaded: true,
      model_type: "YOLOv8".to_string(),
      load_time_ms: 1500,
      memory_usage_mb: 300.0,
      last_inference_ms: Some(30),
    },
  ];

  let (avg_load, avg_memory, avg_inference) = calculate_model_performance_metrics(&statuses);

  assert_eq!(avg_load, 1250.0); // (1000 + 1500) / 2
  assert_eq!(avg_memory, 250.0); // (200 + 300) / 2
  assert_eq!(avg_inference, 25.0); // (20 + 30) / 2
}

#[test]
fn test_calculate_model_performance_metrics_empty() {
  let (avg_load, avg_memory, avg_inference) = calculate_model_performance_metrics(&[]);

  assert_eq!(avg_load, 0.0);
  assert_eq!(avg_memory, 0.0);
  assert_eq!(avg_inference, 0.0);
}

#[test]
fn test_generate_mock_detections() {
  let results = generate_mock_detections(3, 10.0);

  assert_eq!(results.len(), 3);

  // Проверяем первый результат
  assert_eq!(results[0].timestamp, 10.0);
  assert_eq!(results[0].detections.len(), 1);
  assert_eq!(results[0].detections[0].class_name, "person");

  // Проверяем второй результат
  assert_eq!(results[1].timestamp, 11.0);
  assert_eq!(results[1].detections[0].class_name, "car");

  // Проверяем третий результат
  assert_eq!(results[2].timestamp, 12.0);
  assert_eq!(results[2].detections[0].class_name, "bicycle");
}

// ============ Тесты сериализации ============

#[test]
fn test_model_class_info_serialization() {
  let info = ModelClassInfo {
    class_names: vec!["person".to_string(), "car".to_string()],
    total_classes: 2,
    model_type: "YOLOv5".to_string(),
    confidence_threshold: 0.5,
  };

  let serialized = serde_json::to_string(&info).unwrap();
  let deserialized: ModelClassInfo = serde_json::from_str(&serialized).unwrap();

  assert_eq!(info.class_names, deserialized.class_names);
  assert_eq!(info.total_classes, deserialized.total_classes);
  assert_eq!(info.model_type, deserialized.model_type);
  assert_eq!(info.confidence_threshold, deserialized.confidence_threshold);
}

#[test]
fn test_detection_serialization() {
  let detection = Detection {
    class_name: "person".to_string(),
    confidence: 0.85,
    bbox: BoundingBox {
      x: 100.0,
      y: 50.0,
      width: 200.0,
      height: 300.0,
    },
  };

  let serialized = serde_json::to_string(&detection).unwrap();
  let deserialized: Detection = serde_json::from_str(&serialized).unwrap();

  assert_eq!(detection.class_name, deserialized.class_name);
  assert_eq!(detection.confidence, deserialized.confidence);
  assert_eq!(detection.bbox.x, deserialized.bbox.x);
  assert_eq!(detection.bbox.width, deserialized.bbox.width);
}

#[test]
fn test_yolo_model_info_serialization() {
  let info = YoloModelInfo {
    model_path: "/path/to/model.onnx".to_string(),
    model_type: "YOLOv8".to_string(),
    is_face_model: false,
    is_segmentation_model: true,
    input_size: (640, 640),
    classes_count: 80,
  };

  let serialized = serde_json::to_string(&info).unwrap();
  let deserialized: YoloModelInfo = serde_json::from_str(&serialized).unwrap();

  assert_eq!(info.model_path, deserialized.model_path);
  assert_eq!(info.model_type, deserialized.model_type);
  assert_eq!(info.is_face_model, deserialized.is_face_model);
  assert_eq!(
    info.is_segmentation_model,
    deserialized.is_segmentation_model
  );
  assert_eq!(info.input_size, deserialized.input_size);
  assert_eq!(info.classes_count, deserialized.classes_count);
}

#[test]
fn test_model_status_serialization() {
  let status = ModelStatus {
    is_loaded: true,
    model_type: "YOLOv5".to_string(),
    load_time_ms: 1500,
    memory_usage_mb: 256.5,
    last_inference_ms: Some(25),
  };

  let serialized = serde_json::to_string(&status).unwrap();
  let deserialized: ModelStatus = serde_json::from_str(&serialized).unwrap();

  assert_eq!(status.is_loaded, deserialized.is_loaded);
  assert_eq!(status.model_type, deserialized.model_type);
  assert_eq!(status.load_time_ms, deserialized.load_time_ms);
  assert_eq!(status.memory_usage_mb, deserialized.memory_usage_mb);
  assert_eq!(status.last_inference_ms, deserialized.last_inference_ms);
}

// ============ Интеграционные тесты (упрощенные) ============

#[test]
fn test_integration_create_model_class_info_consistency() {
  // Тест логической консистентности создания ModelClassInfo
  let info = create_model_class_info("YOLOv5", 0.5);

  assert_eq!(info.model_type, "YOLOv5");
  assert_eq!(info.total_classes, 80);
  assert_eq!(info.confidence_threshold, 0.5);
  assert!(!info.class_names.is_empty());
  assert_eq!(info.class_names.len(), info.total_classes);
}

#[test]
fn test_integration_yolo_model_info_consistency() {
  // Тест создания YoloModelInfo с face detection
  let face_info = create_yolo_model_info("/models/yolo5face.onnx", "YOLOv5");

  assert_eq!(face_info.model_path, "/models/yolo5face.onnx");
  assert_eq!(face_info.model_type, "YOLOv5");
  assert!(face_info.is_face_model);
  assert!(!face_info.is_segmentation_model);
  assert_eq!(face_info.input_size, (640, 640));
  assert_eq!(face_info.classes_count, 1);

  // Тест создания YoloModelInfo с segmentation
  let seg_info = create_yolo_model_info("/models/yolo8_seg.onnx", "YOLOv8");

  assert_eq!(seg_info.model_path, "/models/yolo8_seg.onnx");
  assert_eq!(seg_info.model_type, "YOLOv8");
  assert!(!seg_info.is_face_model);
  assert!(seg_info.is_segmentation_model);
  assert_eq!(seg_info.input_size, (640, 640));
  assert_eq!(seg_info.classes_count, 80);
}

#[test]
fn test_integration_workflow_completeness() {
  // Тест полного рабочего процесса анализа
  let params = TimeRangeParams {
    start_time: 0.0,
    end_time: 10.0,
    confidence_threshold: Some(0.5),
  };

  // 1. Валидация параметров
  assert!(validate_time_range_params(&params).is_ok());

  // 2. Генерация данных
  let results = generate_mock_detections(5, 0.0);
  assert_eq!(results.len(), 5);

  // 3. Фильтрация по параметрам
  let filtered = filter_results_by_time_range(&results, &params);
  assert!(filtered.len() <= results.len());

  // 4. Группировка в сегменты
  let segments = group_results_into_segments(&filtered, 1.0);
  assert!(!segments.is_empty());

  // 5. Вычисление метрик
  let statuses = vec![
    create_model_status(true, "YOLOv5", 1000, 200.0),
    create_model_status(true, "YOLOv8", 1500, 300.0),
  ];
  let (avg_load, avg_memory, avg_inference) = calculate_model_performance_metrics(&statuses);
  assert!(avg_load > 0.0);
  assert!(avg_memory > 0.0);
  assert_eq!(avg_inference, 0.0); // Нет данных о времени inference
}

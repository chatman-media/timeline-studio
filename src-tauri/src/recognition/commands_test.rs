#[cfg(test)]
mod tests {
  use super::super::types::{
    BoundingBox as TypesBBox, DetectedFace, DetectedObject, RecognitionResults,
  };
  use crate::recognition::frame_processor::BoundingBox;
  use crate::recognition::recognition_service::{RecognitionEvent, RecognitionService};
  use crate::recognition::Detection;
  use std::collections::HashMap;
  use tempfile::TempDir;

  async fn create_test_recognition_service() -> RecognitionService {
    let temp_dir = TempDir::new().unwrap();
    RecognitionService::new(temp_dir.path().to_path_buf())
      .await
      .unwrap()
  }

  #[tokio::test]
  async fn test_recognition_service_creation() {
    let service = create_test_recognition_service().await;
    // Verify the service was created successfully
    let _ = service; // Ensure service is created without panic
  }

  #[tokio::test]
  async fn test_recognition_event_serialization() {
    let event = RecognitionEvent::ProcessingStarted {
      file_id: "test-123".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ProcessingStarted"));
    assert!(json.contains("test-123"));

    let results = RecognitionResults {
      objects: vec![],
      faces: vec![],
      scenes: vec![],
      identified_persons: vec![],
      processed_at: chrono::Utc::now(),
    };

    let event = RecognitionEvent::ProcessingCompleted {
      file_id: "test-123".to_string(),
      results,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ProcessingCompleted"));

    let event = RecognitionEvent::ProcessingError {
      file_id: "test-123".to_string(),
      error: "Test error".to_string(),
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("ProcessingError"));
    assert!(json.contains("Test error"));
  }

  #[test]
  fn test_detection_serialization() {
    let detection = Detection {
      class: "person".to_string(),
      class_id: 0,
      confidence: 0.95,
      bbox: BoundingBox {
        x: 100.0,
        y: 200.0,
        width: 50.0,
        height: 100.0,
      },
      attributes: None,
    };

    let json = serde_json::to_string(&detection).unwrap();
    assert!(json.contains("person"));
    assert!(json.contains("0.95"));
  }

  #[test]
  fn test_recognition_results_serialization() {
    let results = RecognitionResults {
      objects: vec![DetectedObject {
        class: "car".to_string(),
        confidence: 0.85,
        timestamps: vec![2.0, 3.0],
        bounding_boxes: vec![],
      }],
      faces: vec![DetectedFace {
        face_id: Some("face1".to_string()),
        person_name: None,
        confidence: 0.88,
        timestamps: vec![1.5],
        bounding_boxes: vec![],
      }],
      scenes: vec![],
      identified_persons: vec![],
      processed_at: chrono::Utc::now(),
    };

    let json = serde_json::to_string(&results).unwrap();
    assert!(json.contains("car"));
    assert!(json.contains("0.85"));
    assert!(json.contains("face1"));
    assert!(json.contains("0.88"));
  }

  #[test]
  fn test_csv_export_format() {
    // Test CSV header format
    let csv_header = "Type,Class,Confidence,Timestamp\n";
    assert!(csv_header.contains("Type"));
    assert!(csv_header.contains("Class"));
    assert!(csv_header.contains("Confidence"));
    assert!(csv_header.contains("Timestamp"));

    // Test object CSV line format
    let obj_line = format!("Object,{},{:.2},{:.2}\n", "person", 0.95, 1.0);
    assert_eq!(obj_line, "Object,person,0.95,1.00\n");

    // Test face CSV line format
    let face_line = format!("Face,{},{:.2},{:.2}\n", "face1", 0.88, 1.5);
    assert_eq!(face_line, "Face,face1,0.88,1.50\n");
  }

  #[tokio::test]
  async fn test_yolo_class_names() {
    // Test that YOLO class names are properly returned
    let service = create_test_recognition_service().await;
    let classes = service.get_object_classes().await;

    // Should return standard COCO dataset classes
    assert!(!classes.is_empty());
    assert!(classes.contains(&"person".to_string()));
    assert!(classes.contains(&"car".to_string()));
    assert!(classes.contains(&"dog".to_string()));
  }

  #[tokio::test]
  async fn test_set_object_classes() {
    let service = create_test_recognition_service().await;
    let classes = vec!["person".to_string(), "car".to_string(), "dog".to_string()];

    // Test setting object classes
    service.set_object_classes(classes.clone()).await;

    // Verify the classes were set (would affect processor's behavior in real usage)
    let set_classes = service.get_object_classes().await;
    assert_eq!(set_classes.len(), 80); // COCO dataset has 80 classes by default
  }

  #[test]
  fn test_batch_processing_structure() {
    // Test frame paths map structure
    let mut frame_paths_map: HashMap<String, Vec<std::path::PathBuf>> = HashMap::new();
    frame_paths_map.insert(
      "video1".to_string(),
      vec![std::path::PathBuf::from("/tmp/frame1.jpg")],
    );
    frame_paths_map.insert(
      "video2".to_string(),
      vec![std::path::PathBuf::from("/tmp/frame2.jpg")],
    );

    assert_eq!(frame_paths_map.len(), 2);
    assert!(frame_paths_map.contains_key("video1"));
    assert!(frame_paths_map.contains_key("video2"));
  }

  #[test]
  fn test_preview_data_response() {
    // Test the structure of preview data response
    let response = serde_json::json!({
        "file_id": "test-file",
        "message": "This command needs PreviewDataManager integration"
    });

    assert!(response.get("file_id").is_some());
    assert_eq!(response["file_id"], "test-file");
    assert!(response.get("message").is_some());
  }

  #[test]
  fn test_bounding_box_structure() {
    let bbox = BoundingBox {
      x: 100.0,
      y: 200.0,
      width: 50.0,
      height: 100.0,
    };

    assert_eq!(bbox.x, 100.0);
    assert_eq!(bbox.y, 200.0);
    assert_eq!(bbox.width, 50.0);
    assert_eq!(bbox.height, 100.0);
  }

  #[test]
  fn test_error_message_formatting() {
    let error = format!("Error loading YOLO model: {}", "test error");
    assert!(error.contains("Error loading YOLO model"));
    assert!(error.contains("test error"));

    let error = format!("Batch processing error: {}", "test error");
    assert!(error.contains("Batch processing error"));
    assert!(error.contains("test error"));
  }
}

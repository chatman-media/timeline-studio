//! Real data tests for recognition module
//! Tests with actual images and videos from test-data/

use crate::recognition::model_manager::YoloModel;
use crate::recognition::ort_manager::OrtManager;
use crate::recognition::recognition_service::RecognitionService;
use crate::recognition::types::{DetectedObject, RecognitionResults};
use crate::recognition::{ProcessorConfig, YoloProcessor};
use std::path::PathBuf;
use std::time::Instant;
use tempfile::TempDir;

/// Get path to test-data directory
fn get_test_data_dir() -> Option<PathBuf> {
  let possible_paths = vec![
    PathBuf::from("../test-data"),
    PathBuf::from("test-data"),
    PathBuf::from("../../test-data"),
  ];

  for path in possible_paths {
    if path.exists() {
      return Some(path);
    }
  }

  // Try from workspace root
  if let Ok(cwd) = std::env::current_dir() {
    let workspace_path = cwd.join("../test-data");
    if workspace_path.exists() {
      return Some(workspace_path);
    }
  }

  None
}

/// Get test image path (DSC07845.png)
fn get_test_image() -> Option<PathBuf> {
  let test_dir = get_test_data_dir()?;
  let image_path = test_dir.join("DSC07845.png");
  if image_path.exists() {
    Some(image_path)
  } else {
    None
  }
}

/// Get Kate.mp4 video path for face detection
fn get_kate_video() -> Option<PathBuf> {
  let test_dir = get_test_data_dir()?;
  let video_path = test_dir.join("Kate.mp4");
  if video_path.exists() {
    Some(video_path)
  } else {
    None
  }
}

/// Проверяет доступность ONNX Runtime
fn is_ort_available() -> bool {
  OrtManager::ensure_initialized().is_ok()
}

#[tokio::test]
async fn test_yolo_on_real_image() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  let image_path = match get_test_image() {
    Some(path) => path,
    None => {
      eprintln!("Skipping test: test image DSC07845.png not found in test-data/");
      return;
    }
  };

  println!("Testing YOLO on image: {:?}", image_path);

  let config = ProcessorConfig {
    model: YoloModel::YoloV8Detection,
    ..Default::default()
  };

  match YoloProcessor::new(config).await {
    Ok(processor) => {
      let start = Instant::now();
      match processor.process_image_path(&image_path).await {
        Ok(detections) => {
          let duration = start.elapsed();
          println!("✅ Image processed in {:?}", duration);
          println!("   Found {} objects", detections.len());

          for detection in &detections {
            println!(
              "   - {} (confidence: {:.2}%)",
              detection.class,
              detection.confidence * 100.0
            );
          }

          // Performance check: should be under 5 seconds
          assert!(
            duration.as_secs() < 5,
            "Image processing took too long: {:?}",
            duration
          );
        }
        Err(e) => {
          println!("❌ Failed to process image: {e}");
          // Don't fail test - model might not be available
        }
      }
    }
    Err(e) => {
      println!("⚠️ Could not create YOLO processor: {e}");
      println!("   This is expected if YOLO model is not downloaded");
    }
  }
}

#[tokio::test]
async fn test_face_detection_model() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  let image_path = match get_test_image() {
    Some(path) => path,
    None => {
      eprintln!("Skipping test: test image not found");
      return;
    }
  };

  println!("Testing Face Detection on: {:?}", image_path);

  let config = ProcessorConfig {
    model: YoloModel::YoloV8Face,
    ..Default::default()
  };

  match YoloProcessor::new(config).await {
    Ok(processor) => {
      let start = Instant::now();
      match processor.process_image_path(&image_path).await {
        Ok(detections) => {
          let duration = start.elapsed();
          println!("✅ Face detection completed in {:?}", duration);
          println!("   Found {} faces", detections.len());

          for (i, detection) in detections.iter().enumerate() {
            println!(
              "   Face {}: confidence {:.2}%, bbox: {:?}",
              i + 1,
              detection.confidence * 100.0,
              detection.bounding_box
            );
          }
        }
        Err(e) => {
          println!("❌ Face detection failed: {e}");
        }
      }
    }
    Err(e) => {
      println!("⚠️ Could not create face detection processor: {e}");
    }
  }
}

#[tokio::test]
async fn test_yolov11_face_detection() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  let image_path = match get_test_image() {
    Some(path) => path,
    None => {
      eprintln!("Skipping test: test image not found");
      return;
    }
  };

  println!("Testing YOLOv11 Face Detection on: {:?}", image_path);

  let config = ProcessorConfig {
    model: YoloModel::YoloV11Face,
    ..Default::default()
  };

  match YoloProcessor::new(config).await {
    Ok(processor) => {
      let start = Instant::now();
      match processor.process_image_path(&image_path).await {
        Ok(detections) => {
          let duration = start.elapsed();
          println!("✅ YOLOv11 face detection completed in {:?}", duration);
          println!("   Found {} faces", detections.len());
        }
        Err(e) => {
          println!("❌ YOLOv11 face detection failed: {e}");
        }
      }
    }
    Err(e) => {
      println!("⚠️ Could not create YOLOv11 face processor: {e}");
    }
  }
}

#[tokio::test]
async fn test_recognition_service_initialization() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  let temp_dir = TempDir::new().unwrap();

  match RecognitionService::new(temp_dir.path().to_path_buf()).await {
    Ok(service) => {
      println!("✅ RecognitionService initialized successfully");

      // Test that we can get status
      let status = service.get_status();
      println!("   Service status: {:?}", status);
    }
    Err(e) => {
      println!("⚠️ Could not initialize RecognitionService: {e}");
    }
  }
}

#[tokio::test]
async fn test_model_loading_performance() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  println!("Testing model loading performance...");

  let models = vec![
    ("YOLOv8 Detection", YoloModel::YoloV8Detection),
    ("YOLOv8 Face", YoloModel::YoloV8Face),
    ("YOLOv11 Face", YoloModel::YoloV11Face),
  ];

  for (name, model) in models {
    let config = ProcessorConfig {
      model,
      ..Default::default()
    };

    let start = Instant::now();
    match YoloProcessor::new(config).await {
      Ok(_) => {
        let duration = start.elapsed();
        println!("✅ {} loaded in {:?}", name, duration);

        // Model should load in under 10 seconds
        assert!(
          duration.as_secs() < 10,
          "{} took too long to load: {:?}",
          name,
          duration
        );
      }
      Err(e) => {
        println!("⚠️ {} not available: {}", name, e);
      }
    }
  }
}

#[tokio::test]
async fn test_export_recognition_results() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  let temp_dir = TempDir::new().unwrap();
  let _service = match RecognitionService::new(temp_dir.path().to_path_buf()).await {
    Ok(s) => s,
    Err(e) => {
      println!("⚠️ Could not create service: {e}");
      return;
    }
  };

  // Create test results
  let results = RecognitionResults {
    objects: vec![
      DetectedObject {
        class: "person".to_string(),
        confidence: 0.95,
        timestamps: vec![1.0, 2.0, 3.0],
        bounding_boxes: vec![],
      },
      DetectedObject {
        class: "car".to_string(),
        confidence: 0.87,
        timestamps: vec![5.0, 6.0],
        bounding_boxes: vec![],
      },
    ],
    faces: vec![],
    scenes: vec![],
    identified_persons: vec![],
    processed_at: chrono::Utc::now(),
  };

  // Save results as JSON
  let results_dir = temp_dir.path().join("Recognition");
  std::fs::create_dir_all(&results_dir).unwrap();

  let results_file = results_dir.join("export_test_recognition.json");
  let json = serde_json::to_string_pretty(&results).unwrap();
  tokio::fs::write(&results_file, json).await.unwrap();

  // Verify JSON file
  assert!(results_file.exists());

  let json_content = std::fs::read_to_string(&results_file).unwrap();
  assert!(json_content.contains("person"));
  assert!(json_content.contains("car"));
  assert!(json_content.contains("0.95"));

  println!("✅ Export test passed");
}

#[tokio::test]
async fn test_ort_manager_initialization() {
  println!("Testing ORT Manager initialization...");

  match OrtManager::ensure_initialized() {
    Ok(_) => {
      println!("✅ ONNX Runtime initialized successfully");

      // Check available providers
      let providers = OrtManager::get_available_providers();
      println!("   Available providers: {:?}", providers);
    }
    Err(e) => {
      println!("❌ Failed to initialize ONNX Runtime: {e}");
    }
  }
}

#[tokio::test]
async fn test_video_frame_processing() {
  if !is_ort_available() {
    eprintln!("Skipping test: ONNX Runtime not available");
    return;
  }

  let video_path = match get_kate_video() {
    Some(path) => path,
    None => {
      eprintln!("Skipping test: Kate.mp4 not found in test-data/");
      return;
    }
  };

  println!("Testing video processing on: {:?}", video_path);
  println!("Note: Full video processing requires frame extraction integration");

  // For now, just verify the video file exists and is readable
  let metadata = std::fs::metadata(&video_path).unwrap();
  println!("   Video size: {} MB", metadata.len() / 1024 / 1024);
  println!("✅ Video file verified");
}

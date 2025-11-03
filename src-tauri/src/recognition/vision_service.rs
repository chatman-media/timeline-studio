//! Vision Service
//!
//! Unified vision analysis service, который объединяет:
//! - Object detection (YOLO)
//! - Face detection (RetinaFace / YOLO Face)
//! - Face embeddings (FaceNet)
//! - Color analysis
//!
//! Предоставляет простой API для Scene Engine и других компонентов.

use super::facenet_processor::{FaceNetModel, FaceNetProcessor};
use super::retinaface_processor::{RetinaFaceModel, RetinaFaceProcessor};
use super::yolo_processor::{YoloModel, YoloProcessor};
use crate::analysis::types::{
  BoundingBox, BrightnessLevel, Color, ColorAnalysis, ColorTemperature, FaceDetection,
  ObjectDetection, SaturationLevel, TextDetection,
};
use anyhow::{Context, Result};
use image::GenericImageView;
use log::{debug, info, warn};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Vision Service Configuration
#[derive(Debug, Clone)]
pub struct VisionServiceConfig {
  /// Use YOLO for object detection
  pub enable_object_detection: bool,

  /// Use face detection
  pub enable_face_detection: bool,

  /// Use FaceNet for embeddings
  pub enable_face_embeddings: bool,

  /// Use color analysis
  pub enable_color_analysis: bool,

  /// YOLO model to use
  pub yolo_model: YoloModel,

  /// Object detection confidence threshold
  pub object_confidence: f32,

  /// RetinaFace model to use
  pub retinaface_model: RetinaFaceModel,

  /// FaceNet model to use
  pub facenet_model: FaceNetModel,
}

impl Default for VisionServiceConfig {
  fn default() -> Self {
    Self {
      enable_object_detection: true,
      enable_face_detection: true,
      enable_face_embeddings: true,
      enable_color_analysis: true,
      yolo_model: YoloModel::YoloV8Nano, // Fast default
      object_confidence: 0.5,
      retinaface_model: RetinaFaceModel::MobileNet, // Fast default
      facenet_model: FaceNetModel::FaceNet128D,     // Fast default
    }
  }
}

/// Vision Service
///
/// Главный сервис для всех видов visual analysis.
/// Переиспользует существующие ONNX процессоры.
pub struct VisionService {
  /// Configuration
  config: VisionServiceConfig,

  /// YOLO processor for object detection
  yolo_processor: Arc<RwLock<Option<YoloProcessor>>>,

  /// RetinaFace processor for face detection
  retinaface_processor: Arc<RwLock<Option<RetinaFaceProcessor>>>,

  /// FaceNet processor for embeddings
  facenet_processor: Arc<RwLock<Option<FaceNetProcessor>>>,
}

impl VisionService {
  /// Create new Vision Service with default configuration
  pub fn new() -> Self {
    Self {
      config: VisionServiceConfig::default(),
      yolo_processor: Arc::new(RwLock::new(None)),
      retinaface_processor: Arc::new(RwLock::new(None)),
      facenet_processor: Arc::new(RwLock::new(None)),
    }
  }

  /// Create with custom configuration
  pub fn with_config(config: VisionServiceConfig) -> Self {
    Self {
      config,
      yolo_processor: Arc::new(RwLock::new(None)),
      retinaface_processor: Arc::new(RwLock::new(None)),
      facenet_processor: Arc::new(RwLock::new(None)),
    }
  }

  /// Initialize the service (load models)
  pub async fn initialize(&self) -> Result<()> {
    info!("Initializing Vision Service");

    // Initialize YOLO processor if enabled
    if self.config.enable_object_detection {
      let mut yolo_lock = self.yolo_processor.write().await;
      match YoloProcessor::new(
        self.config.yolo_model.clone(),
        self.config.object_confidence,
      ) {
        Ok(processor) => {
          info!("YOLO processor initialized successfully");
          *yolo_lock = Some(processor);
        }
        Err(e) => {
          warn!(
            "Failed to initialize YOLO processor: {}. Object detection will be unavailable.",
            e
          );
        }
      }
    }

    // Initialize RetinaFace processor if enabled
    if self.config.enable_face_detection {
      let mut retinaface_lock = self.retinaface_processor.write().await;
      match RetinaFaceProcessor::new(self.config.retinaface_model.clone()) {
        Ok(mut processor) => {
          // Load model async
          if let Err(e) = processor.load_model().await {
            warn!(
              "Failed to load RetinaFace model: {}. Face detection will be unavailable.",
              e
            );
          } else {
            info!("RetinaFace processor initialized successfully");
            *retinaface_lock = Some(processor);
          }
        }
        Err(e) => {
          warn!(
            "Failed to initialize RetinaFace processor: {}. Face detection will be unavailable.",
            e
          );
        }
      }
    }

    // Initialize FaceNet processor if enabled
    if self.config.enable_face_embeddings {
      let mut facenet_lock = self.facenet_processor.write().await;
      match FaceNetProcessor::new(self.config.facenet_model.clone()) {
        Ok(mut processor) => {
          // Load model async
          if let Err(e) = processor.load_model().await {
            warn!(
              "Failed to load FaceNet model: {}. Face embeddings will be unavailable.",
              e
            );
          } else {
            info!("FaceNet processor initialized successfully");
            *facenet_lock = Some(processor);
          }
        }
        Err(e) => {
          warn!(
            "Failed to initialize FaceNet processor: {}. Face embeddings will be unavailable.",
            e
          );
        }
      }
    }

    info!("Vision Service initialized");
    Ok(())
  }

  // ========================================================================
  // OBJECT DETECTION
  // ========================================================================

  /// Detect objects in an image
  pub async fn detect_objects(&self, image_path: &str) -> Result<Vec<ObjectDetection>> {
    debug!("Detecting objects in: {}", image_path);

    let mut yolo_lock = self.yolo_processor.write().await;
    let processor = yolo_lock
      .as_mut()
      .context("YOLO processor not initialized")?;

    // Process image using YOLO
    let detections = processor
      .process_image(Path::new(image_path))
      .await
      .context("Failed to detect objects")?;

    // Convert to unified ObjectDetection type
    let unified_detections: Vec<ObjectDetection> = detections
      .into_iter()
      .enumerate()
      .map(|(idx, det)| ObjectDetection {
        id: format!("obj_{}", idx),
        label: det.class,
        confidence: det.confidence as f64,
        bounding_box: BoundingBox {
          x: det.bbox.x as f64,
          y: det.bbox.y as f64,
          width: det.bbox.width as f64,
          height: det.bbox.height as f64,
        },
        frame_number: 0,
        timestamp: 0.0,
        attributes: None,
      })
      .collect();

    info!("Detected {} objects", unified_detections.len());
    Ok(unified_detections)
  }

  /// Detect objects in multiple frames (video analysis)
  pub async fn detect_objects_batch(
    &self,
    image_paths: &[String],
  ) -> Result<Vec<Vec<ObjectDetection>>> {
    info!("Batch object detection for {} images", image_paths.len());

    let mut results = Vec::new();
    for (frame_num, path) in image_paths.iter().enumerate() {
      match self.detect_objects(path).await {
        Ok(mut detections) => {
          // Update frame numbers
          for det in &mut detections {
            det.frame_number = frame_num as u32;
          }
          results.push(detections);
        }
        Err(e) => {
          warn!("Failed to detect objects in frame {}: {}", frame_num, e);
          results.push(vec![]);
        }
      }
    }

    Ok(results)
  }

  // ========================================================================
  // FACE DETECTION
  // ========================================================================

  /// Detect faces in an image
  pub async fn detect_faces(&self, image_path: &str) -> Result<Vec<FaceDetection>> {
    debug!("Detecting faces in: {}", image_path);

    let retinaface_lock = self.retinaface_processor.read().await;
    let processor = retinaface_lock
      .as_ref()
      .context("RetinaFace processor not initialized")?;

    // Load image
    let img = image::open(image_path).context("Failed to load image")?;

    let detections = processor
      .detect_faces_sync(&img)
      .context("Failed to detect faces")?;

    // Convert to unified FaceDetection type
    let unified_detections: Vec<FaceDetection> = detections
      .into_iter()
      .enumerate()
      .map(|(idx, det)| {
        // Convert bbox from (x1, y1, x2, y2) to (x, y, width, height)
        let width = det.bbox.x2 - det.bbox.x1;
        let height = det.bbox.y2 - det.bbox.y1;

        FaceDetection {
          id: format!("face_{}", idx),
          confidence: det.confidence as f64,
          bounding_box: BoundingBox {
            x: det.bbox.x1 as f64,
            y: det.bbox.y1 as f64,
            width: width as f64,
            height: height as f64,
          },
          embedding: None, // Will be filled by extract_face_embedding
          emotions: None,  // TODO: Add emotion detection
          age: None,       // RetinaFace doesn't provide age
          gender: None,    // RetinaFace doesn't provide gender
          timestamp: 0.0,
        }
      })
      .collect();

    info!("Detected {} faces", unified_detections.len());
    Ok(unified_detections)
  }

  /// Extract face embedding from image
  pub async fn extract_face_embedding(
    &self,
    image_path: &str,
    bbox: &BoundingBox,
  ) -> Result<Vec<f32>> {
    debug!("Extracting face embedding for bbox: {:?}", bbox);

    let facenet_lock = self.facenet_processor.read().await;
    let processor = facenet_lock
      .as_ref()
      .context("FaceNet processor not initialized")?;

    // Load image
    let img = image::open(image_path).context("Failed to load image")?;

    // Crop face region
    let face_img = img.crop_imm(
      bbox.x as u32,
      bbox.y as u32,
      bbox.width as u32,
      bbox.height as u32,
    );

    // Generate embedding
    let embedding = processor
      .generate_embedding_sync(&face_img)
      .context("Failed to generate face embedding")?;

    debug!("Extracted embedding of size {}", embedding.vector.len());
    Ok(embedding.vector)
  }

  /// Detect faces with embeddings
  pub async fn detect_faces_with_embeddings(&self, image_path: &str) -> Result<Vec<FaceDetection>> {
    let mut faces = self.detect_faces(image_path).await?;

    // Extract embeddings for each face
    for face in &mut faces {
      match self
        .extract_face_embedding(image_path, &face.bounding_box)
        .await
      {
        Ok(embedding) => {
          face.embedding = Some(embedding);
        }
        Err(e) => {
          warn!("Failed to extract embedding for face {}: {}", face.id, e);
        }
      }
    }

    Ok(faces)
  }

  // ========================================================================
  // TEXT DETECTION (OCR)
  // ========================================================================

  /// Detect text in image (placeholder for future OCR integration)
  pub async fn detect_text(&self, _image_path: &str) -> Result<Vec<TextDetection>> {
    // TODO: Integrate OCR model (Tesseract or ONNX-based OCR)
    warn!("Text detection not yet implemented");
    Ok(vec![])
  }

  // ========================================================================
  // COLOR ANALYSIS
  // ========================================================================

  /// Analyze colors in image
  pub async fn analyze_colors(&self, image_path: &str) -> Result<ColorAnalysis> {
    debug!("Analyzing colors in: {}", image_path);

    let img = image::open(image_path).context("Failed to load image")?;

    // Sample pixels to analyze colors
    let (width, height) = img.dimensions();
    let sample_rate = 10; // Sample every 10th pixel

    let mut color_counts: HashMap<(u8, u8, u8), usize> = HashMap::new();
    let mut total_r = 0u64;
    let mut total_g = 0u64;
    let mut total_b = 0u64;
    let mut pixel_count = 0usize;

    for y in (0..height).step_by(sample_rate) {
      for x in (0..width).step_by(sample_rate) {
        let pixel = img.get_pixel(x, y);
        let rgb = (pixel[0], pixel[1], pixel[2]);

        *color_counts.entry(rgb).or_insert(0) += 1;
        total_r += rgb.0 as u64;
        total_g += rgb.1 as u64;
        total_b += rgb.2 as u64;
        pixel_count += 1;
      }
    }

    // Find dominant colors (top 5)
    let mut color_vec: Vec<_> = color_counts.iter().collect();
    color_vec.sort_by(|a, b| b.1.cmp(a.1));

    let dominant_colors: Vec<Color> = color_vec
      .iter()
      .take(5)
      .map(|((r, g, b), count)| Color {
        r: *r,
        g: *g,
        b: *b,
        hex: format!("#{:02x}{:02x}{:02x}", r, g, b),
        percentage: (**count as f64 / pixel_count as f64) * 100.0,
      })
      .collect();

    // Calculate average color for temperature
    let avg_r = (total_r / pixel_count as u64) as u8;
    let avg_g = (total_g / pixel_count as u64) as u8;
    let avg_b = (total_b / pixel_count as u64) as u8;

    // Determine color temperature
    let temperature = if avg_r > avg_b + 20 {
      ColorTemperature::Warm
    } else if avg_b > avg_r + 20 {
      ColorTemperature::Cool
    } else {
      ColorTemperature::Neutral
    };

    // Calculate saturation (simplified)
    let max_channel = avg_r.max(avg_g).max(avg_b);
    let min_channel = avg_r.min(avg_g).min(avg_b);
    let saturation_value = if max_channel > 0 {
      ((max_channel - min_channel) as f32 / max_channel as f32) * 100.0
    } else {
      0.0
    };

    let saturation = if saturation_value > 60.0 {
      SaturationLevel::High
    } else if saturation_value > 30.0 {
      SaturationLevel::Medium
    } else {
      SaturationLevel::Low
    };

    // Calculate brightness
    let brightness_value = ((avg_r as f32 + avg_g as f32 + avg_b as f32) / 3.0) / 255.0;
    let brightness = if brightness_value > 0.7 {
      BrightnessLevel::Bright
    } else if brightness_value > 0.3 {
      BrightnessLevel::Medium
    } else {
      BrightnessLevel::Dark
    };

    Ok(ColorAnalysis {
      dominant_colors: dominant_colors.clone(),
      palette: dominant_colors,
      temperature,
      saturation,
      brightness,
    })
  }

  // ========================================================================
  // COMBINED ANALYSIS
  // ========================================================================

  /// Comprehensive image analysis
  pub async fn analyze_image(&self, image_path: &str) -> Result<ImageAnalysisResult> {
    info!("Performing comprehensive image analysis: {}", image_path);

    let objects = if self.config.enable_object_detection {
      self.detect_objects(image_path).await.ok()
    } else {
      None
    };

    let faces = if self.config.enable_face_detection {
      if self.config.enable_face_embeddings {
        self.detect_faces_with_embeddings(image_path).await.ok()
      } else {
        self.detect_faces(image_path).await.ok()
      }
    } else {
      None
    };

    let colors = if self.config.enable_color_analysis {
      self.analyze_colors(image_path).await.ok()
    } else {
      None
    };

    Ok(ImageAnalysisResult {
      image_path: image_path.to_string(),
      objects,
      faces,
      text: None, // OCR not implemented yet
      colors,
    })
  }
}

impl Default for VisionService {
  fn default() -> Self {
    Self::new()
  }
}

/// Comprehensive image analysis result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ImageAnalysisResult {
  pub image_path: String,
  pub objects: Option<Vec<ObjectDetection>>,
  pub faces: Option<Vec<FaceDetection>>,
  pub text: Option<Vec<TextDetection>>,
  pub colors: Option<ColorAnalysis>,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_vision_service_creation() {
    let service = VisionService::new();
    assert!(service.config.enable_object_detection);
    assert!(service.config.enable_face_detection);
  }

  #[test]
  fn test_vision_service_with_config() {
    let config = VisionServiceConfig {
      enable_object_detection: false,
      enable_face_detection: true,
      ..Default::default()
    };

    let service = VisionService::with_config(config);
    assert!(!service.config.enable_object_detection);
    assert!(service.config.enable_face_detection);
  }

  #[tokio::test]
  async fn test_vision_service_initialize() {
    let service = VisionService::new();
    // This will try to load models - will likely fail in test environment
    // Just test that it doesn't panic
    let _ = service.initialize().await;
  }
}

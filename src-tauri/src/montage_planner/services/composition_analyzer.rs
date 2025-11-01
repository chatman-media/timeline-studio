//! Composition Analyzer Service
//!
//! Extends YOLO detection results with composition analysis for montage planning.
//! Analyzes frame composition using object positions and provides scoring.

use crate::montage_planner::types::*;
use crate::recognition::frame_processor::Detection as YoloDetection;
use serde::{Deserialize, Serialize};

/// Analyzes frame composition based on YOLO detection results
pub struct CompositionAnalyzer {
  /// Grid for rule of thirds analysis (3x3)
  thirds_grid: RuleOfThirdsGrid,
  /// Weight factors for different composition rules
  weights: CompositionWeights,
}

/// Grid line coordinates type for better readability
type GridLines = ([(f32, f32); 2], [(f32, f32); 2]);

/// Rule of thirds grid for composition analysis
#[derive(Debug, Clone)]
pub struct RuleOfThirdsGrid {
  /// Intersection points of rule of thirds lines
  intersection_points: [(f32, f32); 4],
  /// Grid lines (vertical and horizontal)
  #[allow(dead_code)] // Used for future grid visualization
  grid_lines: GridLines,
}

/// Weight factors for different composition elements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositionWeights {
  pub rule_of_thirds: f32,
  pub balance: f32,
  pub focus_clarity: f32,
  pub depth_of_field: f32,
  pub leading_lines: f32,
  pub symmetry: f32,
}

/// Enhanced detection with composition analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositionEnhancedDetection {
  pub original_detections: Vec<YoloDetection>,
  pub timestamp: f64,
  pub composition_score: CompositionScore,
  pub visual_importance: f32,
  pub frame_dominance: f32,
}

impl Default for CompositionWeights {
  fn default() -> Self {
    Self {
      rule_of_thirds: 0.25,
      balance: 0.20,
      focus_clarity: 0.20,
      depth_of_field: 0.15,
      leading_lines: 0.10,
      symmetry: 0.10,
    }
  }
}

impl CompositionAnalyzer {
  /// Create new composition analyzer with default settings
  pub fn new() -> Self {
    Self {
      thirds_grid: RuleOfThirdsGrid::new(),
      weights: CompositionWeights::default(),
    }
  }

  /// Create analyzer with custom weights
  pub fn with_weights(weights: CompositionWeights) -> Self {
    Self {
      thirds_grid: RuleOfThirdsGrid::new(),
      weights,
    }
  }

  /// Analyze composition based on YOLO detection results
  pub fn analyze_composition(
    &self,
    detections: &[YoloDetection],
    timestamp: f64,
    frame_width: f32,
    frame_height: f32,
  ) -> Result<CompositionEnhancedDetection, MontageError> {
    // Convert YOLO detections to montage detections
    let montage_detection =
      self.convert_yolo_to_montage(detections, timestamp, frame_width, frame_height)?;

    // Calculate composition score
    let composition_score = self.calculate_composition_score(
      &montage_detection.objects,
      &montage_detection.faces,
      frame_width,
      frame_height,
    );

    // Calculate visual importance and frame dominance
    let visual_importance = self.calculate_visual_importance(&montage_detection.objects);
    let frame_dominance = self.calculate_frame_dominance(
      &montage_detection.objects,
      &montage_detection.faces,
      frame_width,
      frame_height,
    );

    Ok(CompositionEnhancedDetection {
      original_detections: detections.to_vec(),
      timestamp,
      composition_score,
      visual_importance,
      frame_dominance,
    })
  }

  /// Convert YOLO detection to montage detection format
  fn convert_yolo_to_montage(
    &self,
    yolo_detections: &[YoloDetection],
    timestamp: f64,
    _frame_width: f32,
    _frame_height: f32,
  ) -> Result<MontageDetection, MontageError> {
    let mut objects = Vec::new();
    let mut faces = Vec::new();

    // Process all detections
    for detection in yolo_detections {
      // Determine if this is a face or object based on class name
      if detection.class.to_lowercase().contains("face")
        || detection.class.to_lowercase().contains("person")
      {
        faces.push(FaceDetection {
          confidence: detection.confidence,
          bbox: BoundingBox {
            x: detection.bbox.x,
            y: detection.bbox.y,
            width: detection.bbox.width,
            height: detection.bbox.height,
          },
          tracking_id: None,
          emotion: EmotionalTone::Neutral, // TODO: Implement emotion detection
          gaze_direction: None,
          face_quality: detection.confidence,
        });
      } else {
        objects.push(ObjectDetection {
          class: detection.class.clone(),
          confidence: detection.confidence,
          bbox: BoundingBox {
            x: detection.bbox.x,
            y: detection.bbox.y,
            width: detection.bbox.width,
            height: detection.bbox.height,
          },
          tracking_id: None,
          movement_vector: None,
          visual_importance: self
            .calculate_object_importance(&detection.class, detection.confidence),
        });
      }
    }

    // Calculate activity level based on object count and distribution
    let activity_level = self.calculate_activity_level(&objects, &faces);
    
    // Store face count before moving faces vector
    let face_count = faces.len() as u32;

    Ok(MontageDetection {
      timestamp,
      detection_type: if !objects.is_empty() && !faces.is_empty() {
        DetectionType::Combined
      } else if !faces.is_empty() {
        DetectionType::Face
      } else if !objects.is_empty() {
        DetectionType::Object
      } else {
        DetectionType::Scene
      },
      objects,
      faces,
      composition_score: CompositionScore {
        rule_of_thirds: 0.0,
        balance: 0.0,
        focus_clarity: 0.0,
        depth_of_field: 0.0,
        leading_lines: 0.0,
        symmetry: 0.0,
        overall_score: 0.0,
        activity_score: 0.0,
        face_count,
        face_prominence: 0.0,
        scene_depth: 0.0,
      }, // Will be calculated separately
      activity_level,
      emotional_tone: EmotionalTone::Neutral, // Will be enhanced by emotion detector
    })
  }

  /// Calculate composition score based on objects and faces
  fn calculate_composition_score(
    &self,
    objects: &[ObjectDetection],
    faces: &[FaceDetection],
    frame_width: f32,
    frame_height: f32,
  ) -> CompositionScore {
    let rule_of_thirds =
      self.calculate_rule_of_thirds_score(objects, faces, frame_width, frame_height);
    let balance = self.calculate_balance_score(objects, faces, frame_width, frame_height);
    let focus_clarity = self.calculate_focus_clarity_score(objects, faces);
    let depth_of_field = self.calculate_depth_score(objects, faces);
    let leading_lines = self.calculate_leading_lines_score(objects);
    let symmetry = self.calculate_symmetry_score(objects, faces, frame_width, frame_height);

    let overall_score = rule_of_thirds * self.weights.rule_of_thirds
      + balance * self.weights.balance
      + focus_clarity * self.weights.focus_clarity
      + depth_of_field * self.weights.depth_of_field
      + leading_lines * self.weights.leading_lines
      + symmetry * self.weights.symmetry;

    CompositionScore {
      rule_of_thirds,
      balance,
      focus_clarity,
      depth_of_field,
      leading_lines,
      symmetry,
      overall_score,
      activity_score: 50.0, // Default activity level
      face_count: 0, // No face count in this context
      face_prominence: 0.0, // No face analysis in this context
      scene_depth: 50.0, // Default scene depth
    }
  }

  /// Calculate rule of thirds adherence score
  fn calculate_rule_of_thirds_score(
    &self,
    objects: &[ObjectDetection],
    faces: &[FaceDetection],
    frame_width: f32,
    frame_height: f32,
  ) -> f32 {
    let mut total_score = 0.0;
    let mut element_count = 0;

    // Check faces first (higher priority)
    for face in faces {
      let center_x = face.bbox.x + face.bbox.width / 2.0;
      let center_y = face.bbox.y + face.bbox.height / 2.0;

      let score = self
        .thirds_grid
        .score_position(center_x / frame_width, center_y / frame_height);
      total_score += score * face.confidence;
      element_count += 1;
    }

    // Check important objects
    for object in objects {
      if object.visual_importance > 0.5 {
        let center_x = object.bbox.x + object.bbox.width / 2.0;
        let center_y = object.bbox.y + object.bbox.height / 2.0;

        let score = self
          .thirds_grid
          .score_position(center_x / frame_width, center_y / frame_height);
        total_score += score * object.confidence * object.visual_importance;
        element_count += 1;
      }
    }

    if element_count > 0 {
      (total_score / element_count as f32).min(100.0)
    } else {
      50.0 // Neutral score when no elements
    }
  }

  /// Calculate visual balance score
  fn calculate_balance_score(
    &self,
    objects: &[ObjectDetection],
    faces: &[FaceDetection],
    frame_width: f32,
    _frame_height: f32,
  ) -> f32 {
    let mut left_weight = 0.0;
    let mut right_weight = 0.0;
    let center_x = frame_width / 2.0;

    // Weight faces
    for face in faces {
      let face_center_x = face.bbox.x + face.bbox.width / 2.0;
      let face_area = face.bbox.width * face.bbox.height;
      let weight = face_area * face.confidence;

      if face_center_x < center_x {
        left_weight += weight;
      } else {
        right_weight += weight;
      }
    }

    // Weight objects
    for object in objects {
      let obj_center_x = object.bbox.x + object.bbox.width / 2.0;
      let obj_area = object.bbox.width * object.bbox.height;
      let weight = obj_area * object.confidence * object.visual_importance;

      if obj_center_x < center_x {
        left_weight += weight;
      } else {
        right_weight += weight;
      }
    }

    // Calculate balance ratio
    let total_weight = left_weight + right_weight;
    if total_weight > 0.0 {
      let balance_ratio = (left_weight / total_weight - 0.5).abs();
      ((1.0 - balance_ratio * 2.0) * 100.0).max(0.0)
    } else {
      100.0 // Perfect balance when no elements
    }
  }

  /// Calculate focus clarity score
  fn calculate_focus_clarity_score(
    &self,
    objects: &[ObjectDetection],
    faces: &[FaceDetection],
  ) -> f32 {
    let mut max_confidence = 0.0_f32;
    let mut total_confidence = 0.0_f32;
    let mut element_count = 0;

    // Check faces
    for face in faces {
      max_confidence = max_confidence.max(face.confidence);
      total_confidence += face.confidence;
      element_count += 1;
    }

    // Check objects
    for object in objects {
      if object.visual_importance > 0.3 {
        max_confidence = max_confidence.max(object.confidence);
        total_confidence += object.confidence;
        element_count += 1;
      }
    }

    if element_count > 0 {
      let avg_confidence = total_confidence / element_count as f32;
      // Focus clarity is better when there's a clear dominant element
      let focus_ratio = max_confidence / avg_confidence.max(0.1);
      (focus_ratio * 50.0).min(100.0)
    } else {
      0.0
    }
  }

  /// Calculate depth of field score
  fn calculate_depth_score(&self, objects: &[ObjectDetection], faces: &[FaceDetection]) -> f32 {
    // Simplified depth calculation based on object sizes and confidence
    let mut size_variance = 0.0;
    let mut avg_size = 0.0;
    let mut element_count = 0;

    // Calculate average size
    for face in faces {
      let size = face.bbox.width * face.bbox.height;
      avg_size += size;
      element_count += 1;
    }

    for object in objects {
      let size = object.bbox.width * object.bbox.height;
      avg_size += size;
      element_count += 1;
    }

    if element_count > 1 {
      avg_size /= element_count as f32;

      // Calculate variance
      for face in faces {
        let size = face.bbox.width * face.bbox.height;
        size_variance += (size - avg_size).powi(2);
      }

      for object in objects {
        let size = object.bbox.width * object.bbox.height;
        size_variance += (size - avg_size).powi(2);
      }

      size_variance /= element_count as f32;

      // Higher variance indicates better depth
      (size_variance.sqrt() * 1000.0).min(100.0)
    } else {
      50.0 // Neutral when insufficient elements
    }
  }

  /// Calculate leading lines score (simplified)
  fn calculate_leading_lines_score(&self, objects: &[ObjectDetection]) -> f32 {
    // Simplified: look for linear arrangements of objects
    if objects.len() < 3 {
      return 0.0;
    }

    let mut max_alignment = 0.0_f32;

    // Check for horizontal alignment
    for i in 0..objects.len() - 2 {
      for j in i + 1..objects.len() - 1 {
        for k in j + 1..objects.len() {
          let y1 = objects[i].bbox.y + objects[i].bbox.height / 2.0;
          let y2 = objects[j].bbox.y + objects[j].bbox.height / 2.0;
          let y3 = objects[k].bbox.y + objects[k].bbox.height / 2.0;

          let alignment = 1.0_f32 - ((y1 - y2).abs() + (y2 - y3).abs()) / 200.0_f32;
          max_alignment = max_alignment.max(alignment.max(0.0_f32));
        }
      }
    }

    (max_alignment * 100.0_f32).min(100.0_f32)
  }

  /// Calculate symmetry score
  fn calculate_symmetry_score(
    &self,
    _objects: &[ObjectDetection],
    faces: &[FaceDetection],
    frame_width: f32,
    _frame_height: f32,
  ) -> f32 {
    let center_x = frame_width / 2.0;
    let mut symmetry_score = 0.0;
    let mut comparisons = 0;

    // Check face symmetry
    for face in faces {
      let face_center_x = face.bbox.x + face.bbox.width / 2.0;
      let distance_from_center = (face_center_x - center_x).abs() / center_x;

      // Look for corresponding face on the other side
      for other_face in faces {
        if std::ptr::eq(face, other_face) {
          continue;
        }

        let other_center_x = other_face.bbox.x + other_face.bbox.width / 2.0;
        let other_distance = (other_center_x - center_x).abs() / center_x;

        if (distance_from_center - other_distance).abs() < 0.1
          && (face_center_x - center_x).signum() != (other_center_x - center_x).signum()
        {
          symmetry_score += 1.0;
          comparisons += 1;
          break;
        }
      }
    }

    if comparisons > 0 {
      (symmetry_score / comparisons as f32 * 100.0).min(100.0)
    } else {
      50.0 // Neutral when no symmetry can be evaluated
    }
  }

  /// Calculate visual importance of an object based on class and confidence
  fn calculate_object_importance(&self, class: &str, confidence: f32) -> f32 {
    let base_importance = match class.to_lowercase().as_str() {
      "person" => 0.9,
      "face" => 1.0,
      "car" | "truck" | "bus" => 0.7,
      "dog" | "cat" | "animal" => 0.8,
      "bottle" | "cup" | "phone" => 0.4,
      "book" | "laptop" | "tv" => 0.5,
      _ => 0.3,
    };

    base_importance * confidence
  }

  /// Calculate activity level based on number and type of detections
  fn calculate_activity_level(&self, objects: &[ObjectDetection], faces: &[FaceDetection]) -> f32 {
    let object_count = objects.len() as f32;
    let face_count = faces.len() as f32;

    // Weight faces more heavily
    let weighted_count = face_count * 2.0 + object_count;

    // Normalize to 0-100 scale
    (weighted_count * 10.0).min(100.0)
  }

  /// Calculate visual importance across all objects
  fn calculate_visual_importance(&self, objects: &[ObjectDetection]) -> f32 {
    if objects.is_empty() {
      return 0.0;
    }

    let total_importance: f32 = objects.iter().map(|obj| obj.visual_importance).sum();

    total_importance / objects.len() as f32
  }

  /// Calculate frame dominance based on object coverage
  fn calculate_frame_dominance(
    &self,
    objects: &[ObjectDetection],
    faces: &[FaceDetection],
    frame_width: f32,
    frame_height: f32,
  ) -> f32 {
    let frame_area = frame_width * frame_height;
    let mut total_coverage = 0.0;

    // Calculate object coverage
    for object in objects {
      let area = object.bbox.width * object.bbox.height;
      total_coverage += area * object.visual_importance;
    }

    // Calculate face coverage (weighted more heavily)
    for face in faces {
      let area = face.bbox.width * face.bbox.height;
      total_coverage += area * 2.0; // Faces are more dominant
    }

    ((total_coverage / frame_area) * 100.0).min(100.0)
  }
}

impl Default for RuleOfThirdsGrid {
  fn default() -> Self {
    Self::new()
  }
}

impl RuleOfThirdsGrid {
  pub fn new() -> Self {
    Self {
      intersection_points: [
        (1.0 / 3.0, 1.0 / 3.0),
        (2.0 / 3.0, 1.0 / 3.0),
        (1.0 / 3.0, 2.0 / 3.0),
        (2.0 / 3.0, 2.0 / 3.0),
      ],
      grid_lines: (
        [(1.0 / 3.0, 0.0), (2.0 / 3.0, 0.0)], // Vertical lines
        [(0.0, 1.0 / 3.0), (0.0, 2.0 / 3.0)], // Horizontal lines
      ),
    }
  }

  /// Score position based on proximity to rule of thirds points
  pub fn score_position(&self, x: f32, y: f32) -> f32 {
    let mut min_distance = f32::INFINITY;

    // Check distance to intersection points
    for &(ix, iy) in &self.intersection_points {
      let distance = ((x - ix).powi(2) + (y - iy).powi(2)).sqrt();
      min_distance = min_distance.min(distance);
    }

    // Convert distance to score (closer = higher score)
    let max_distance = 0.5; // Half the frame diagonal
    let normalized_distance = (min_distance / max_distance).min(1.0);
    ((1.0 - normalized_distance) * 100.0).max(0.0)
  }
}

impl Default for CompositionAnalyzer {
  fn default() -> Self {
    Self::new()
  }
}

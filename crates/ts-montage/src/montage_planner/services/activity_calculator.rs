//! Activity Calculator Service
//!
//! Calculates activity levels based on object movement and scene dynamics.

use crate::montage_planner::types::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Service for calculating activity levels in video content
pub struct ActivityCalculator {
  /// Configuration for activity calculation
  config: ActivityCalculationConfig,
  /// Tracking data for objects across frames
  object_tracker: HashMap<String, ObjectTrackingData>,
  /// Recent activity history for trend analysis
  activity_history: Vec<(f64, f32)>, // (timestamp, activity_level)
}

/// Configuration for activity calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityCalculationConfig {
  pub motion_threshold: f32,
  pub tracking_window: usize,
  pub activity_smoothing: f32,
  pub object_importance_weights: HashMap<String, f32>,
}

/// Tracking data for an object across frames
#[derive(Debug, Clone)]
struct ObjectTrackingData {
  positions: Vec<(f64, f32, f32)>, // (timestamp, x, y)
  velocities: Vec<f32>,
  last_seen: f64,
  #[allow(dead_code)] // Used for debugging and future filtering
  object_class: String,
}

/// Activity metrics for a frame or time period
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityMetrics {
  pub timestamp: f64,
  pub overall_activity: f32, // 0-100
  pub motion_intensity: f32, // 0-100
  pub object_count: u32,
  pub moving_objects: u32,
  pub scene_dynamics: f32, // 0-100
  pub activity_distribution: ActivityDistribution,
}

/// Distribution of activity across the frame
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityDistribution {
  pub left_quadrant: f32,
  pub right_quadrant: f32,
  pub top_quadrant: f32,
  pub bottom_quadrant: f32,
  pub center_region: f32,
}

impl Default for ActivityCalculationConfig {
  fn default() -> Self {
    let mut weights = HashMap::new();
    weights.insert("person".to_string(), 2.0);
    weights.insert("car".to_string(), 1.5);
    weights.insert("truck".to_string(), 1.5);
    weights.insert("bus".to_string(), 1.5);
    weights.insert("motorcycle".to_string(), 1.8);
    weights.insert("bicycle".to_string(), 1.3);
    weights.insert("dog".to_string(), 1.2);
    weights.insert("cat".to_string(), 1.1);
    weights.insert("bird".to_string(), 1.4);

    Self {
      motion_threshold: 5.0,
      tracking_window: 30,
      activity_smoothing: 0.3,
      object_importance_weights: weights,
    }
  }
}

impl ActivityCalculator {
  /// Create new activity calculator
  pub fn new() -> Self {
    Self {
      config: ActivityCalculationConfig::default(),
      object_tracker: HashMap::new(),
      activity_history: Vec::new(),
    }
  }

  /// Create calculator with custom configuration
  pub fn with_config(config: ActivityCalculationConfig) -> Self {
    Self {
      config,
      object_tracker: HashMap::new(),
      activity_history: Vec::new(),
    }
  }

  /// Calculate activity metrics for a montage detection
  pub fn calculate_activity(&mut self, detection: &MontageDetection) -> ActivityMetrics {
    // Update object tracking
    self.update_object_tracking(detection);

    // Calculate motion intensity
    let motion_intensity = self.calculate_motion_intensity(detection);

    // Count objects and moving objects
    let object_count = (detection.objects.len() + detection.faces.len()) as u32;
    let moving_objects = self.count_moving_objects(detection);

    // Calculate scene dynamics
    let scene_dynamics = self.calculate_scene_dynamics(detection);

    // Calculate activity distribution
    let activity_distribution = self.calculate_activity_distribution(detection);

    // Calculate overall activity
    let overall_activity = self.calculate_overall_activity(
      motion_intensity,
      object_count,
      moving_objects,
      scene_dynamics,
    );

    // Store in activity history
    self
      .activity_history
      .push((detection.timestamp, overall_activity));

    // Keep only recent history (last 100 entries)
    if self.activity_history.len() > 100 {
      self.activity_history.remove(0);
    }

    ActivityMetrics {
      timestamp: detection.timestamp,
      overall_activity,
      motion_intensity,
      object_count,
      moving_objects,
      scene_dynamics,
      activity_distribution,
    }
  }

  /// Update object tracking with new detection
  fn update_object_tracking(&mut self, detection: &MontageDetection) {
    // Track objects
    for (i, object) in detection.objects.iter().enumerate() {
      let object_id = object
        .tracking_id
        .map(|id| format!("obj_{id}"))
        .unwrap_or_else(|| format!("obj_{}_{}", detection.timestamp as u64, i));

      let center_x = object.bbox.x + object.bbox.width / 2.0;
      let center_y = object.bbox.y + object.bbox.height / 2.0;

      self.update_object_position(
        &object_id,
        detection.timestamp,
        center_x,
        center_y,
        &object.class,
      );
    }

    // Track faces
    for (i, face) in detection.faces.iter().enumerate() {
      let face_id = face
        .tracking_id
        .map(|id| format!("face_{id}"))
        .unwrap_or_else(|| format!("face_{}_{}", detection.timestamp as u64, i));

      let center_x = face.bbox.x + face.bbox.width / 2.0;
      let center_y = face.bbox.y + face.bbox.height / 2.0;

      self.update_object_position(&face_id, detection.timestamp, center_x, center_y, "person");
    }

    // Clean up old tracking data
    self.cleanup_old_tracking_data(detection.timestamp);
  }

  /// Update position for a tracked object
  fn update_object_position(
    &mut self,
    object_id: &str,
    timestamp: f64,
    x: f32,
    y: f32,
    object_class: &str,
  ) {
    let tracking_data = self
      .object_tracker
      .entry(object_id.to_string())
      .or_insert_with(|| ObjectTrackingData {
        positions: Vec::new(),
        velocities: Vec::new(),
        last_seen: timestamp,
        object_class: object_class.to_string(),
      });

    // Add new position
    tracking_data.positions.push((timestamp, x, y));
    tracking_data.last_seen = timestamp;

    // Calculate velocity if we have previous position
    if tracking_data.positions.len() >= 2 {
      let prev_pos = &tracking_data.positions[tracking_data.positions.len() - 2];
      let curr_pos = &tracking_data.positions[tracking_data.positions.len() - 1];

      let dt = curr_pos.0 - prev_pos.0;
      if dt > 0.0 {
        let dx = curr_pos.1 - prev_pos.1;
        let dy = curr_pos.2 - prev_pos.2;
        let velocity = ((dx * dx + dy * dy).sqrt() / dt as f32).min(1000.0);
        tracking_data.velocities.push(velocity);
      }
    }

    // Limit tracking history
    if tracking_data.positions.len() > self.config.tracking_window {
      tracking_data.positions.remove(0);
    }
    if tracking_data.velocities.len() > self.config.tracking_window {
      tracking_data.velocities.remove(0);
    }
  }

  /// Clean up old tracking data
  fn cleanup_old_tracking_data(&mut self, current_time: f64) {
    let cleanup_threshold = 10.0; // 10 seconds

    self
      .object_tracker
      .retain(|_, data| current_time - data.last_seen < cleanup_threshold);
  }

  /// Calculate motion intensity based on object movements
  fn calculate_motion_intensity(&self, detection: &MontageDetection) -> f32 {
    let mut total_motion = 0.0;
    let mut motion_count = 0;

    // Calculate motion from tracking data
    for object in &detection.objects {
      if let Some(tracking_id) = object.tracking_id {
        let object_id = format!("obj_{tracking_id}");
        if let Some(tracking_data) = self.object_tracker.get(&object_id) {
          if let Some(&velocity) = tracking_data.velocities.last() {
            let weight = self
              .config
              .object_importance_weights
              .get(&object.class)
              .copied()
              .unwrap_or(1.0);

            total_motion += velocity * weight;
            motion_count += 1;
          }
        }
      }
    }

    // Add motion from movement vectors if available
    for object in &detection.objects {
      if let Some((dx, dy)) = object.movement_vector {
        let velocity = (dx * dx + dy * dy).sqrt();
        let weight = self
          .config
          .object_importance_weights
          .get(&object.class)
          .copied()
          .unwrap_or(1.0);

        total_motion += velocity * weight * 10.0; // Scale movement vectors
        motion_count += 1;
      }
    }

    if motion_count > 0 {
      let avg_motion = total_motion / motion_count as f32;
      (avg_motion * 2.0).min(100.0) // Scale and cap at 100
    } else {
      0.0
    }
  }

  /// Count objects that are currently moving
  fn count_moving_objects(&self, detection: &MontageDetection) -> u32 {
    let mut moving_count = 0;

    // Check objects with movement vectors
    for object in &detection.objects {
      if let Some((dx, dy)) = object.movement_vector {
        let velocity = (dx * dx + dy * dy).sqrt();
        if velocity > self.config.motion_threshold {
          moving_count += 1;
        }
      } else if let Some(tracking_id) = object.tracking_id {
        // Check tracked velocity
        let object_id = format!("obj_{tracking_id}");
        if let Some(tracking_data) = self.object_tracker.get(&object_id) {
          if let Some(&velocity) = tracking_data.velocities.last() {
            if velocity > self.config.motion_threshold {
              moving_count += 1;
            }
          }
        }
      }
    }

    moving_count
  }

  /// Calculate scene dynamics based on object interactions
  fn calculate_scene_dynamics(&self, detection: &MontageDetection) -> f32 {
    let object_count = detection.objects.len() + detection.faces.len();

    if object_count == 0 {
      return 0.0;
    }

    // Base dynamics from object count
    let mut dynamics = (object_count as f32 * 10.0).min(50.0);

    // Add dynamics from object diversity
    let unique_classes: std::collections::HashSet<_> =
      detection.objects.iter().map(|obj| &obj.class).collect();
    dynamics += (unique_classes.len() as f32 * 5.0).min(25.0);

    // Add dynamics from spatial distribution
    let distribution_score = self.calculate_spatial_distribution_score(detection);
    dynamics += distribution_score * 0.25;

    // Add dynamics from confidence variance (more variance = more dynamic)
    let confidence_variance = self.calculate_confidence_variance(detection);
    dynamics += confidence_variance * 0.1;

    dynamics.min(100.0)
  }

  /// Calculate spatial distribution score
  fn calculate_spatial_distribution_score(&self, detection: &MontageDetection) -> f32 {
    if detection.objects.is_empty() && detection.faces.is_empty() {
      return 0.0;
    }

    let mut positions = Vec::new();

    // Collect object positions
    for object in &detection.objects {
      positions.push((
        object.bbox.x + object.bbox.width / 2.0,
        object.bbox.y + object.bbox.height / 2.0,
      ));
    }

    for face in &detection.faces {
      positions.push((
        face.bbox.x + face.bbox.width / 2.0,
        face.bbox.y + face.bbox.height / 2.0,
      ));
    }

    if positions.len() < 2 {
      return 0.0;
    }

    // Calculate average distance between objects
    let mut total_distance = 0.0;
    let mut distance_count = 0;

    for i in 0..positions.len() {
      for j in i + 1..positions.len() {
        let dx = positions[i].0 - positions[j].0;
        let dy = positions[i].1 - positions[j].1;
        let distance = (dx * dx + dy * dy).sqrt();
        total_distance += distance;
        distance_count += 1;
      }
    }

    let avg_distance = total_distance / distance_count as f32;

    // Normalize to 0-100 scale (assuming frame width ~1000 units)
    (avg_distance / 10.0).min(100.0)
  }

  /// Calculate confidence variance
  fn calculate_confidence_variance(&self, detection: &MontageDetection) -> f32 {
    let mut confidences = Vec::new();

    for object in &detection.objects {
      confidences.push(object.confidence);
    }

    for face in &detection.faces {
      confidences.push(face.confidence);
    }

    if confidences.len() < 2 {
      return 0.0;
    }

    let mean: f32 = confidences.iter().sum::<f32>() / confidences.len() as f32;
    let variance: f32 =
      confidences.iter().map(|c| (c - mean).powi(2)).sum::<f32>() / confidences.len() as f32;

    variance.sqrt() * 100.0
  }

  /// Calculate activity distribution across frame regions
  fn calculate_activity_distribution(&self, detection: &MontageDetection) -> ActivityDistribution {
    let mut left = 0.0;
    let mut right = 0.0;
    let mut top = 0.0;
    let mut bottom = 0.0;
    let mut center = 0.0;

    let frame_width = 1920.0; // Assume standard frame dimensions
    let frame_height = 1080.0;

    // Process objects
    for object in &detection.objects {
      let center_x = object.bbox.x + object.bbox.width / 2.0;
      let center_y = object.bbox.y + object.bbox.height / 2.0;
      let activity_weight = object.visual_importance * 100.0;

      // Quadrant classification
      if center_x < frame_width / 2.0 {
        left += activity_weight;
      } else {
        right += activity_weight;
      }

      if center_y < frame_height / 2.0 {
        top += activity_weight;
      } else {
        bottom += activity_weight;
      }

      // Center region (middle third)
      if center_x > frame_width / 3.0
        && center_x < 2.0 * frame_width / 3.0
        && center_y > frame_height / 3.0
        && center_y < 2.0 * frame_height / 3.0
      {
        center += activity_weight;
      }
    }

    // Process faces (higher weight)
    for face in &detection.faces {
      let center_x = face.bbox.x + face.bbox.width / 2.0;
      let center_y = face.bbox.y + face.bbox.height / 2.0;
      let activity_weight = face.face_quality * 150.0; // Faces get higher weight

      if center_x < frame_width / 2.0 {
        left += activity_weight;
      } else {
        right += activity_weight;
      }

      if center_y < frame_height / 2.0 {
        top += activity_weight;
      } else {
        bottom += activity_weight;
      }

      if center_x > frame_width / 3.0
        && center_x < 2.0 * frame_width / 3.0
        && center_y > frame_height / 3.0
        && center_y < 2.0 * frame_height / 3.0
      {
        center += activity_weight;
      }
    }

    // Normalize to 0-100 scale
    let total = left + right + top + bottom + center;
    if total > 0.0 {
      ActivityDistribution {
        left_quadrant: (left / total * 100.0).min(100.0),
        right_quadrant: (right / total * 100.0).min(100.0),
        top_quadrant: (top / total * 100.0).min(100.0),
        bottom_quadrant: (bottom / total * 100.0).min(100.0),
        center_region: (center / total * 100.0).min(100.0),
      }
    } else {
      ActivityDistribution {
        left_quadrant: 0.0,
        right_quadrant: 0.0,
        top_quadrant: 0.0,
        bottom_quadrant: 0.0,
        center_region: 0.0,
      }
    }
  }

  /// Calculate overall activity score
  fn calculate_overall_activity(
    &self,
    motion_intensity: f32,
    object_count: u32,
    moving_objects: u32,
    scene_dynamics: f32,
  ) -> f32 {
    let mut activity = 0.0;

    // Motion contributes 40%
    activity += motion_intensity * 0.4;

    // Object presence contributes 25%
    activity += (object_count as f32 * 5.0).min(25.0);

    // Moving objects contribute 20%
    activity += (moving_objects as f32 * 10.0).min(20.0);

    // Scene dynamics contribute 15%
    activity += scene_dynamics * 0.15;

    activity.min(100.0)
  }

  /// Get activity trend over time
  pub fn get_activity_trend(&self, window_size: usize) -> Vec<f32> {
    // Return the last window_size activity levels
    let start_idx = self.activity_history.len().saturating_sub(window_size);

    self.activity_history[start_idx..]
      .iter()
      .map(|(_, activity)| *activity)
      .collect()
  }

  /// Reset tracking data
  pub fn reset_tracking(&mut self) {
    self.object_tracker.clear();
    self.activity_history.clear();
  }
}

impl Default for ActivityCalculator {
  fn default() -> Self {
    Self::new()
  }
}

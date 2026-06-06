//! Moment Detector Service
//!
//! Detects key moments and events in video content for montage planning.

use crate::montage_planner::types::*;
use serde::{Deserialize, Serialize};

/// Service for detecting key moments in video content
pub struct MomentDetector {
  /// Configuration for moment detection
  config: MomentDetectionConfig,
  /// Threshold settings for different moment types
  thresholds: MomentThresholds,
}

/// Configuration for moment detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MomentDetectionConfig {
  pub min_moment_duration: f64,
  pub max_moment_duration: f64,
  pub overlap_threshold: f64,
  pub quality_threshold: f32,
}

/// Thresholds for different types of moments
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MomentThresholds {
  pub action_threshold: f32,
  pub drama_threshold: f32,
  pub comedy_threshold: f32,
  pub transition_threshold: f32,
  pub highlight_threshold: f32,
}

impl Default for MomentDetectionConfig {
  fn default() -> Self {
    Self {
      min_moment_duration: 1.0,
      max_moment_duration: 10.0,
      overlap_threshold: 0.3,
      quality_threshold: 50.0,
    }
  }
}

impl Default for MomentThresholds {
  fn default() -> Self {
    Self {
      action_threshold: 70.0,
      drama_threshold: 60.0,
      comedy_threshold: 55.0,
      transition_threshold: 40.0,
      highlight_threshold: 80.0,
    }
  }
}

impl MomentDetector {
  /// Create new moment detector with default settings
  pub fn new() -> Self {
    Self {
      config: MomentDetectionConfig::default(),
      thresholds: MomentThresholds::default(),
    }
  }

  /// Create detector with custom configuration
  pub fn with_config(config: MomentDetectionConfig, thresholds: MomentThresholds) -> Self {
    Self { config, thresholds }
  }

  /// Detect moments from montage detections
  pub fn detect_moments(
    &self,
    detections: &[MontageDetection],
  ) -> Result<Vec<DetectedMoment>, MontageError> {
    if detections.is_empty() {
      return Ok(Vec::new());
    }

    let mut moments = Vec::new();
    let mut current_moment: Option<DetectedMoment> = None;

    for detection in detections {
      // Calculate moment scores for this detection
      let scores = self.calculate_moment_scores(detection);
      let total_score = self.calculate_total_score(&scores);

      // Determine moment category
      let category = self.classify_moment(&scores, detection);

      // Check if this detection qualifies as a moment
      if total_score >= self.config.quality_threshold {
        if let Some(ref mut moment) = current_moment {
          // Check if this detection extends the current moment
          if self.should_extend_moment(moment, detection, &scores) {
            self.extend_moment(moment, detection, &scores);
            continue;
          } else {
            // Finalize current moment and start new one
            moments.push(moment.clone());
          }
        }

        // Start new moment
        current_moment = Some(DetectedMoment {
          timestamp: detection.timestamp,
          duration: self.config.min_moment_duration,
          category: category.clone(),
          scores,
          total_score,
          description: self.generate_description(detection, &category),
          tags: self.generate_tags(detection, &category),
        });
      } else if let Some(ref mut moment) = current_moment {
        // Check if we should end the current moment
        if detection.timestamp - moment.timestamp > self.config.max_moment_duration {
          moments.push(moment.clone());
          current_moment = None;
        }
      }
    }

    // Add final moment if exists
    if let Some(moment) = current_moment {
      moments.push(moment);
    }

    // Post-process moments
    self.post_process_moments(moments)
  }

  /// Calculate moment scores for a detection
  fn calculate_moment_scores(&self, detection: &MontageDetection) -> MomentScores {
    MomentScores {
      visual: self.calculate_visual_score(detection),
      technical: self.calculate_technical_score(detection),
      emotional: self.calculate_emotional_score(detection),
      narrative: self.calculate_narrative_score(detection),
      action: self.calculate_action_score(detection),
      composition: detection.composition_score.overall_score,
    }
  }

  /// Calculate visual appeal score
  fn calculate_visual_score(&self, detection: &MontageDetection) -> f32 {
    let mut score = 0.0;

    // Face presence increases visual appeal
    if !detection.faces.is_empty() {
      let avg_face_quality: f32 =
        detection.faces.iter().map(|f| f.face_quality).sum::<f32>() / detection.faces.len() as f32;
      score += avg_face_quality * 30.0;
    }

    // Object diversity
    let unique_classes: std::collections::HashSet<_> =
      detection.objects.iter().map(|obj| &obj.class).collect();
    score += (unique_classes.len() as f32 * 5.0).min(25.0);

    // Composition quality
    score += detection.composition_score.overall_score * 0.4;

    // Activity level
    score += detection.activity_level * 0.1;

    score.min(100.0)
  }

  /// Calculate technical quality score
  fn calculate_technical_score(&self, detection: &MontageDetection) -> f32 {
    let mut score = 50.0; // Base technical score

    // Detection confidence
    let avg_confidence = if !detection.objects.is_empty() {
      detection
        .objects
        .iter()
        .map(|obj| obj.confidence)
        .sum::<f32>()
        / detection.objects.len() as f32
    } else if !detection.faces.is_empty() {
      detection
        .faces
        .iter()
        .map(|face| face.confidence)
        .sum::<f32>()
        / detection.faces.len() as f32
    } else {
      0.5
    };

    score += avg_confidence * 50.0;

    score.min(100.0)
  }

  /// Calculate emotional impact score
  fn calculate_emotional_score(&self, detection: &MontageDetection) -> f32 {
    match detection.emotional_tone {
      EmotionalTone::Happy | EmotionalTone::Excited => 80.0,
      EmotionalTone::Sad | EmotionalTone::Angry => 70.0,
      EmotionalTone::Surprised | EmotionalTone::Fear => 75.0,
      EmotionalTone::Tense => 65.0,
      EmotionalTone::Calm => 40.0,
      _ => 30.0,
    }
  }

  /// Calculate narrative value score
  fn calculate_narrative_score(&self, detection: &MontageDetection) -> f32 {
    let mut score = 0.0;

    // People in frame increase narrative value
    let person_count = detection
      .objects
      .iter()
      .filter(|obj| obj.class.to_lowercase().contains("person"))
      .count()
      + detection.faces.len();

    score += (person_count as f32 * 20.0).min(60.0);

    // Interaction indicators
    if person_count > 1 {
      score += 20.0; // Multiple people suggest interaction
    }

    // Object context
    let contextual_objects = detection
      .objects
      .iter()
      .filter(|obj| {
        matches!(
          obj.class.to_lowercase().as_str(),
          "car" | "phone" | "book" | "laptop" | "tv" | "bottle" | "cup"
        )
      })
      .count();

    score += (contextual_objects as f32 * 5.0).min(20.0);

    score.min(100.0)
  }

  /// Calculate action level score
  fn calculate_action_score(&self, detection: &MontageDetection) -> f32 {
    let mut score = detection.activity_level;

    // Movement vectors increase action score
    let moving_objects = detection
      .objects
      .iter()
      .filter(|obj| obj.movement_vector.is_some())
      .count();

    score += (moving_objects as f32 * 10.0).min(30.0);

    // Vehicle presence suggests action
    let vehicles = detection
      .objects
      .iter()
      .filter(|obj| {
        matches!(
          obj.class.to_lowercase().as_str(),
          "car" | "truck" | "bus" | "motorcycle" | "bicycle"
        )
      })
      .count();

    score += (vehicles as f32 * 15.0).min(30.0);

    score.min(100.0)
  }

  /// Calculate total weighted score
  fn calculate_total_score(&self, scores: &MomentScores) -> f32 {
    scores.visual * 0.25
      + scores.technical * 0.20
      + scores.emotional * 0.20
      + scores.narrative * 0.15
      + scores.action * 0.10
      + scores.composition * 0.10
  }

  /// Classify moment category based on scores
  fn classify_moment(&self, scores: &MomentScores, detection: &MontageDetection) -> MomentCategory {
    if scores.action >= self.thresholds.action_threshold {
      MomentCategory::Action
    } else if scores.emotional >= self.thresholds.drama_threshold {
      MomentCategory::Drama
    } else if (scores.visual
      + scores.technical
      + scores.emotional
      + scores.narrative
      + scores.action
      + scores.composition)
      / 6.0
      >= self.thresholds.highlight_threshold
    {
      MomentCategory::Highlight
    } else if detection.faces.len() > 1 {
      MomentCategory::Drama // Multiple faces suggest dialogue
    } else {
      MomentCategory::BRoll
    }
  }

  /// Check if detection should extend current moment
  fn should_extend_moment(
    &self,
    moment: &DetectedMoment,
    detection: &MontageDetection,
    scores: &MomentScores,
  ) -> bool {
    let time_diff = detection.timestamp - moment.timestamp;

    // Don't extend beyond max duration
    if time_diff > self.config.max_moment_duration {
      return false;
    }

    // Extend if categories match and scores are similar
    let category_match = self.classify_moment(scores, detection) == moment.category;
    let scores_total = (scores.visual
      + scores.technical
      + scores.emotional
      + scores.narrative
      + scores.action
      + scores.composition)
      / 6.0;
    let score_diff = (scores_total - moment.total_score).abs();

    category_match && score_diff < 20.0 && time_diff < 5.0
  }

  /// Extend current moment with new detection
  fn extend_moment(
    &self,
    moment: &mut DetectedMoment,
    detection: &MontageDetection,
    scores: &MomentScores,
  ) {
    // Update duration
    moment.duration = detection.timestamp - moment.timestamp;

    // Update scores (weighted average)
    let weight = 0.3; // Weight for new detection
    moment.scores.visual = moment.scores.visual * (1.0 - weight) + scores.visual * weight;
    moment.scores.technical = moment.scores.technical * (1.0 - weight) + scores.technical * weight;
    moment.scores.emotional = moment.scores.emotional * (1.0 - weight) + scores.emotional * weight;
    moment.scores.narrative = moment.scores.narrative * (1.0 - weight) + scores.narrative * weight;
    moment.scores.action = moment.scores.action * (1.0 - weight) + scores.action * weight;
    moment.scores.composition =
      moment.scores.composition * (1.0 - weight) + scores.composition * weight;

    // Recalculate total score
    moment.total_score = self.calculate_total_score(&moment.scores);
  }

  /// Generate human-readable description
  fn generate_description(
    &self,
    detection: &MontageDetection,
    category: &MomentCategory,
  ) -> String {
    let object_count = detection.objects.len();
    let face_count = detection.faces.len();

    match category {
      MomentCategory::Action => {
        format!("Action scene with {object_count} objects and {face_count} faces")
      }
      MomentCategory::Drama => {
        if face_count > 1 {
          format!("Dramatic scene with {face_count} people")
        } else {
          format!(
            "Emotional moment with {elements} elements",
            elements = object_count + face_count
          )
        }
      }
      MomentCategory::Highlight => {
        format!(
          "Key highlight with {score:.1}% composition score",
          score = detection.composition_score.overall_score
        )
      }
      _ => {
        format!("Scene with {object_count} objects detected")
      }
    }
  }

  /// Generate tags for moment
  fn generate_tags(&self, detection: &MontageDetection, category: &MomentCategory) -> Vec<String> {
    let mut tags = vec![format!("{category:?}").to_lowercase()];

    // Add object-based tags
    let unique_classes: std::collections::HashSet<_> = detection
      .objects
      .iter()
      .map(|obj| obj.class.clone())
      .collect();

    for class in unique_classes {
      tags.push(class.to_lowercase());
    }

    // Add quality tags
    if detection.composition_score.overall_score > 80.0 {
      tags.push("high_quality".to_string());
    }

    if detection.activity_level > 70.0 {
      tags.push("high_activity".to_string());
    }

    if !detection.faces.is_empty() {
      tags.push("faces".to_string());
    }

    tags
  }

  /// Post-process moments to remove overlaps and merge similar ones
  fn post_process_moments(
    &self,
    mut moments: Vec<DetectedMoment>,
  ) -> Result<Vec<DetectedMoment>, MontageError> {
    // Sort by timestamp
    moments.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());

    // Remove overlaps
    let mut processed = Vec::new();

    for moment in moments {
      let mut should_add = true;

      // Check for overlap with existing moments
      for existing in &mut processed {
        if self.moments_overlap(&moment, existing) {
          // Merge if similar, otherwise keep the better one
          if self.should_merge_moments(&moment, existing) {
            self.merge_moments(existing, &moment);
            should_add = false;
            break;
          } else if moment.total_score > existing.total_score {
            // Replace with better moment
            *existing = moment.clone();
            should_add = false;
            break;
          } else {
            // Keep existing, skip this one
            should_add = false;
            break;
          }
        }
      }

      if should_add {
        processed.push(moment);
      }
    }

    Ok(processed)
  }

  /// Check if two moments overlap
  fn moments_overlap(&self, a: &DetectedMoment, b: &DetectedMoment) -> bool {
    let a_end = a.timestamp + a.duration;
    let b_end = b.timestamp + b.duration;

    let overlap_start = a.timestamp.max(b.timestamp);
    let overlap_end = a_end.min(b_end);

    if overlap_start < overlap_end {
      let overlap_duration = overlap_end - overlap_start;
      let min_duration = a.duration.min(b.duration);
      overlap_duration / min_duration > self.config.overlap_threshold
    } else {
      false
    }
  }

  /// Check if moments should be merged
  fn should_merge_moments(&self, a: &DetectedMoment, b: &DetectedMoment) -> bool {
    a.category == b.category && (a.total_score - b.total_score).abs() < 15.0
  }

  /// Merge two moments
  fn merge_moments(&self, target: &mut DetectedMoment, source: &DetectedMoment) {
    // Extend timespan
    let end_time = (target.timestamp + target.duration).max(source.timestamp + source.duration);
    target.timestamp = target.timestamp.min(source.timestamp);
    target.duration = end_time - target.timestamp;

    // Average scores
    target.scores.visual = (target.scores.visual + source.scores.visual) / 2.0;
    target.scores.technical = (target.scores.technical + source.scores.technical) / 2.0;
    target.scores.emotional = (target.scores.emotional + source.scores.emotional) / 2.0;
    target.scores.narrative = (target.scores.narrative + source.scores.narrative) / 2.0;
    target.scores.action = (target.scores.action + source.scores.action) / 2.0;
    target.scores.composition = (target.scores.composition + source.scores.composition) / 2.0;

    target.total_score = self.calculate_total_score(&target.scores);

    // Merge tags
    for tag in &source.tags {
      if !target.tags.contains(tag) {
        target.tags.push(tag.clone());
      }
    }
  }
}

impl Default for MomentDetector {
  fn default() -> Self {
    Self::new()
  }
}

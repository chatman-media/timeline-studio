//! Emotion Detector Service
//!
//! Detects emotions from YOLO Face results for montage planning.

use crate::montage_planner::types::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Service for detecting emotions from face analysis
pub struct EmotionDetector {
  /// Configuration for emotion detection
  config: EmotionDetectionConfig,
  /// Emotion history for temporal smoothing
  emotion_history: HashMap<u32, EmotionHistory>,
}

/// Configuration for emotion detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionDetectionConfig {
  pub confidence_threshold: f32,
  pub temporal_smoothing: f32,
  pub emotion_transition_threshold: f32,
  pub history_window_size: usize,
}

/// Emotion history for a tracked face
#[derive(Debug, Clone)]
struct EmotionHistory {
  emotions: Vec<(f64, EmotionalTone, f32)>, // (timestamp, emotion, confidence)
  last_seen: f64,
}

/// Emotion analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionAnalysisResult {
  pub timestamp: f64,
  pub detected_emotions: Vec<FaceEmotion>,
  pub dominant_emotion: EmotionalTone,
  pub emotion_confidence: f32,
  pub emotional_intensity: f32,
  pub emotion_stability: f32,
}

/// Emotion detected for a specific face
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceEmotion {
  pub face_id: Option<u32>,
  pub emotion: EmotionalTone,
  pub confidence: f32,
  pub intensity: f32,
  pub bbox: BoundingBox,
}

impl Default for EmotionDetectionConfig {
  fn default() -> Self {
    Self {
      confidence_threshold: 0.6,
      temporal_smoothing: 0.3,
      emotion_transition_threshold: 0.4,
      history_window_size: 30,
    }
  }
}

impl EmotionDetector {
  /// Create new emotion detector
  pub fn new() -> Self {
    Self {
      config: EmotionDetectionConfig::default(),
      emotion_history: HashMap::new(),
    }
  }

  /// Create detector with custom configuration
  pub fn with_config(config: EmotionDetectionConfig) -> Self {
    Self {
      config,
      emotion_history: HashMap::new(),
    }
  }

  /// Detect emotions from YOLO face results
  pub fn detect_emotions(
    &mut self,
    detection: &MontageDetection,
  ) -> Result<EmotionAnalysisResult, MontageError> {
    let mut face_emotions = Vec::new();
    let mut total_intensity = 0.0;
    let mut emotion_counts: HashMap<EmotionalTone, f32> = HashMap::new();

    // Process each detected face
    for face in &detection.faces {
      // For now, use the emotion from the face detection
      // In a real implementation, this would analyze face landmarks or use ML models
      let emotion = self.analyze_face_emotion(face, detection.timestamp);

      face_emotions.push(FaceEmotion {
        face_id: face.tracking_id,
        emotion: emotion.emotion.clone(),
        confidence: emotion.confidence,
        intensity: emotion.intensity,
        bbox: face.bbox.clone(),
      });

      // Clone emotion before use
      let emotion_type = emotion.emotion.clone();

      // Accumulate for overall analysis
      total_intensity += emotion.intensity * emotion.confidence;
      *emotion_counts.entry(emotion_type.clone()).or_insert(0.0) += emotion.confidence;

      // Update emotion history
      if let Some(face_id) = face.tracking_id {
        self.update_emotion_history(
          face_id,
          detection.timestamp,
          emotion_type,
          emotion.confidence,
        );
      }
    }

    // Determine dominant emotion
    let dominant_emotion = emotion_counts
      .iter()
      .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
      .map(|(emotion, _)| emotion.clone())
      .unwrap_or(EmotionalTone::Neutral);

    let emotion_confidence = emotion_counts
      .get(&dominant_emotion)
      .copied()
      .unwrap_or(0.0);
    let emotional_intensity = if !face_emotions.is_empty() {
      total_intensity / face_emotions.len() as f32
    } else {
      0.0
    };

    // Calculate emotion stability
    let emotion_stability = self.calculate_emotion_stability(detection.timestamp);

    // Clean up old history
    self.cleanup_old_history(detection.timestamp);

    Ok(EmotionAnalysisResult {
      timestamp: detection.timestamp,
      detected_emotions: face_emotions,
      dominant_emotion,
      emotion_confidence,
      emotional_intensity,
      emotion_stability,
    })
  }

  /// Analyze emotion for a single face
  fn analyze_face_emotion(&self, face: &FaceDetection, _timestamp: f64) -> FaceEmotionResult {
    // For now, use the emotion already in the face detection
    let base_emotion = face.emotion.clone();

    // Apply temporal smoothing if we have history for this face
    let smoothed_emotion = if let Some(face_id) = face.tracking_id {
      self
        .apply_temporal_smoothing(face_id, &base_emotion, face.confidence)
        .unwrap_or(base_emotion)
    } else {
      base_emotion
    };

    // Calculate emotion intensity based on confidence and emotion type
    let intensity = self.calculate_emotion_intensity(&smoothed_emotion, face.confidence);

    FaceEmotionResult {
      emotion: smoothed_emotion,
      confidence: face.confidence,
      intensity,
    }
  }

  /// Apply temporal smoothing to emotion detection
  fn apply_temporal_smoothing(
    &self,
    face_id: u32,
    current_emotion: &EmotionalTone,
    confidence: f32,
  ) -> Option<EmotionalTone> {
    let history = self.emotion_history.get(&face_id)?;

    if history.emotions.is_empty() {
      return Some(current_emotion.clone());
    }

    // Get recent emotions
    let recent_emotions: Vec<_> = history.emotions.iter().rev().take(5).collect();

    if recent_emotions.is_empty() {
      return Some(current_emotion.clone());
    }

    // Check if there's a consistent emotion in recent history
    let mut emotion_weights: HashMap<EmotionalTone, f32> = HashMap::new();

    for (_, emotion, conf) in recent_emotions {
      *emotion_weights.entry(emotion.clone()).or_insert(0.0) += conf;
    }

    // Add current emotion with higher weight
    *emotion_weights
      .entry(current_emotion.clone())
      .or_insert(0.0) += confidence * 2.0;

    // Return the emotion with highest weight
    emotion_weights
      .iter()
      .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
      .map(|(emotion, _)| emotion.clone())
  }

  /// Calculate emotion intensity
  fn calculate_emotion_intensity(&self, emotion: &EmotionalTone, confidence: f32) -> f32 {
    let base_intensity = match emotion {
      EmotionalTone::Happy => 0.8,
      EmotionalTone::Excited => 0.95,
      EmotionalTone::Sad => 0.7,
      EmotionalTone::Angry => 0.9,
      EmotionalTone::Fear => 0.85,
      EmotionalTone::Surprised => 0.8,
      EmotionalTone::Disgust => 0.75,
      EmotionalTone::Tense => 0.6,
      EmotionalTone::Calm => 0.3,
      EmotionalTone::Neutral => 0.1,
    };

    base_intensity * confidence
  }

  /// Update emotion history for a face
  fn update_emotion_history(
    &mut self,
    face_id: u32,
    timestamp: f64,
    emotion: EmotionalTone,
    confidence: f32,
  ) {
    let history = self
      .emotion_history
      .entry(face_id)
      .or_insert_with(|| EmotionHistory {
        emotions: Vec::new(),
        last_seen: timestamp,
      });

    history.emotions.push((timestamp, emotion, confidence));
    history.last_seen = timestamp;

    // Limit history size
    if history.emotions.len() > self.config.history_window_size {
      history.emotions.remove(0);
    }
  }

  /// Calculate emotion stability across recent detections
  fn calculate_emotion_stability(&self, current_time: f64) -> f32 {
    let mut total_stability = 0.0;
    let mut stability_count = 0;

    for history in self.emotion_history.values() {
      if current_time - history.last_seen < 5.0 {
        // Within last 5 seconds
        let stability = self.calculate_individual_stability(history);
        total_stability += stability;
        stability_count += 1;
      }
    }

    if stability_count > 0 {
      total_stability / stability_count as f32
    } else {
      1.0 // Assume stable if no history
    }
  }

  /// Calculate stability for an individual face
  fn calculate_individual_stability(&self, history: &EmotionHistory) -> f32 {
    if history.emotions.len() < 3 {
      return 1.0;
    }

    let recent_emotions: Vec<_> = history
      .emotions
      .iter()
      .rev()
      .take(10)
      .map(|(_, emotion, _)| emotion)
      .collect();

    // Count emotion transitions
    let mut transitions = 0;
    for i in 1..recent_emotions.len() {
      if recent_emotions[i] != recent_emotions[i - 1] {
        transitions += 1;
      }
    }

    // Stability is inverse of transition rate
    let transition_rate = transitions as f32 / (recent_emotions.len() - 1) as f32;
    (1.0 - transition_rate).max(0.0)
  }

  /// Clean up old emotion history
  fn cleanup_old_history(&mut self, current_time: f64) {
    let cleanup_threshold = 30.0; // 30 seconds

    self
      .emotion_history
      .retain(|_, history| current_time - history.last_seen < cleanup_threshold);
  }

  /// Get emotion trend for a specific face
  pub fn get_emotion_trend(&self, face_id: u32) -> Option<Vec<(f64, EmotionalTone, f32)>> {
    self
      .emotion_history
      .get(&face_id)
      .map(|history| history.emotions.clone())
  }

  /// Get dominant emotion over a time period
  pub fn get_dominant_emotion_in_period(&self, start_time: f64, end_time: f64) -> EmotionalTone {
    let mut emotion_weights: HashMap<EmotionalTone, f32> = HashMap::new();

    for history in self.emotion_history.values() {
      for (timestamp, emotion, confidence) in &history.emotions {
        if *timestamp >= start_time && *timestamp <= end_time {
          *emotion_weights.entry(emotion.clone()).or_insert(0.0) += confidence;
        }
      }
    }

    emotion_weights
      .iter()
      .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
      .map(|(emotion, _)| emotion.clone())
      .unwrap_or(EmotionalTone::Neutral)
  }

  /// Calculate emotional arc over time
  pub fn calculate_emotional_arc(&self, time_points: &[f64]) -> Vec<(f64, f32)> {
    let mut arc_points = Vec::new();

    for &timestamp in time_points {
      let intensity = self.get_emotional_intensity_at_time(timestamp);
      arc_points.push((timestamp, intensity));
    }

    arc_points
  }

  /// Get emotional intensity at a specific time
  fn get_emotional_intensity_at_time(&self, timestamp: f64) -> f32 {
    let time_window = 2.0; // 2 second window
    let mut total_intensity = 0.0;
    let mut intensity_count = 0;

    for history in self.emotion_history.values() {
      for (hist_time, emotion, confidence) in &history.emotions {
        if (hist_time - timestamp).abs() <= time_window {
          let intensity = self.calculate_emotion_intensity(emotion, *confidence);
          total_intensity += intensity;
          intensity_count += 1;
        }
      }
    }

    if intensity_count > 0 {
      total_intensity / intensity_count as f32
    } else {
      0.0
    }
  }

  /// Reset all emotion history
  pub fn reset_history(&mut self) {
    self.emotion_history.clear();
  }
}

/// Result of emotion analysis for a single face
#[derive(Debug, Clone)]
struct FaceEmotionResult {
  emotion: EmotionalTone,
  confidence: f32,
  intensity: f32,
}

impl Default for EmotionDetector {
  fn default() -> Self {
    Self::new()
  }
}

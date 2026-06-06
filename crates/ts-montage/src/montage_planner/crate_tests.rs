//! Юнит-тесты крейта ts-montage: serde-контракты доменных типов + базовая
//! логика сервисов (без внешних зависимостей — чистая, детерминированная).

use crate::montage_planner::services::ActivityCalculator;
use crate::montage_planner::types::*;

fn sample_detection(timestamp: f64, activity_level: f32) -> MontageDetection {
  MontageDetection {
    timestamp,
    detection_type: DetectionType::Combined,
    objects: Vec::new(),
    faces: Vec::new(),
    composition_score: CompositionScore::default(),
    activity_level,
    emotional_tone: EmotionalTone::default(),
  }
}

#[test]
fn montage_style_serde_roundtrip() {
  for style in [
    MontageStyle::DynamicAction,
    MontageStyle::CinematicDrama,
    MontageStyle::MusicVideo,
    MontageStyle::Documentary,
    MontageStyle::SocialMedia,
    MontageStyle::Corporate,
    MontageStyle::Travel,
    MontageStyle::Wedding,
  ] {
    let json = serde_json::to_string(&style).expect("serialize");
    let back: MontageStyle = serde_json::from_str(&json).expect("deserialize");
    assert_eq!(style, back, "MontageStyle round-trip failed for {style:?}");
  }
}

#[test]
fn emotional_tone_default_serde_roundtrip() {
  let tone = EmotionalTone::default();
  let json = serde_json::to_string(&tone).expect("serialize");
  let back: EmotionalTone = serde_json::from_str(&json).expect("deserialize");
  assert_eq!(tone, back);
}

#[test]
fn montage_config_serde_roundtrip() {
  let cfg = MontageConfig {
    style: MontageStyle::Documentary,
    target_duration: 60.0,
    quality_threshold: 0.7,
    diversity_weight: 0.5,
    rhythm_sync: true,
    max_cuts_per_minute: Some(20),
  };
  let json = serde_json::to_string(&cfg).expect("serialize");
  let back: MontageConfig = serde_json::from_str(&json).expect("deserialize");
  assert_eq!(back.style, MontageStyle::Documentary);
  assert_eq!(back.target_duration, 60.0);
  assert!(back.rhythm_sync);
  assert_eq!(back.max_cuts_per_minute, Some(20));
}

#[test]
fn composition_score_default_is_zeroed() {
  let cs = CompositionScore::default();
  assert_eq!(cs.overall_score, 0.0);
  assert_eq!(cs.face_count, 0);
}

#[test]
fn activity_calculator_preserves_timestamp_and_is_finite() {
  let mut calc = ActivityCalculator::new();
  let metrics = calc.calculate_activity(&sample_detection(2.5, 50.0));

  assert_eq!(metrics.timestamp, 2.5, "timestamp must be preserved");
  assert!(
    metrics.overall_activity.is_finite() && metrics.overall_activity >= 0.0,
    "overall_activity must be finite & non-negative, got {}",
    metrics.overall_activity
  );
  assert!(metrics.motion_intensity.is_finite() && metrics.motion_intensity >= 0.0);
}

#[test]
fn activity_calculator_handles_repeated_calls() {
  // Калькулятор накапливает состояние (&mut self) — несколько вызовов не должны паниковать.
  let mut calc = ActivityCalculator::new();
  for i in 0..5 {
    let m = calc.calculate_activity(&sample_detection(i as f64, (i * 10) as f32));
    assert_eq!(m.timestamp, i as f64);
  }
}

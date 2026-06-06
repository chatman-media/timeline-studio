//! Тесты для схемы данных video_compiler

#[cfg(test)]
mod schema_tests {

  use crate::video_compiler::schema::{
    common::AspectRatio,
    effects::EffectParameter,
    project::ProjectSchema,
    timeline::{Track, TrackType},
  };
  use chrono::Utc;

  #[test]
  fn test_project_schema_serialization() {
    let project = create_test_project();

    // Сериализация в JSON
    let json = serde_json::to_string(&project);
    assert!(json.is_ok(), "Project should serialize to JSON");

    // Десериализация из JSON
    let json_str = json.unwrap();
    let deserialized: Result<ProjectSchema, _> = serde_json::from_str(&json_str);
    assert!(deserialized.is_ok(), "Project should deserialize from JSON");

    // Проверка идентичности
    let restored = deserialized.unwrap();
    assert_eq!(project.version, restored.version);
    assert_eq!(project.metadata.name, restored.metadata.name);
  }

  #[test]
  fn test_effect_parameter_serialization() {
    let mut params = std::collections::HashMap::new();
    params.insert("intensity".to_string(), EffectParameter::Float(0.8));
    params.insert("enabled".to_string(), EffectParameter::Bool(true));

    let json = serde_json::to_string(&params);
    assert!(json.is_ok(), "Effect parameters should serialize");

    let deserialized: Result<std::collections::HashMap<String, EffectParameter>, _> =
      serde_json::from_str(&json.unwrap());
    assert!(deserialized.is_ok(), "Effect parameters should deserialize");
  }

  #[test]
  fn test_aspect_ratio_conversion() {
    let aspect_ratios = vec![
      AspectRatio::Custom(16.0 / 9.0),
      AspectRatio::Ratio4x3,
      AspectRatio::Ratio16x9,
      AspectRatio::Ratio21x9,
      AspectRatio::Ratio1x1,
    ];

    for aspect_ratio in aspect_ratios {
      let value = match aspect_ratio {
        AspectRatio::Custom(v) => v,
        AspectRatio::Ratio16x9 => 16.0 / 9.0,
        AspectRatio::Ratio4x3 => 4.0 / 3.0,
        AspectRatio::Ratio21x9 => 21.0 / 9.0,
        AspectRatio::Ratio1x1 => 1.0,
        AspectRatio::Ratio9x16 => 9.0 / 16.0,
      };
      assert!(value > 0.0, "Aspect ratio should be positive");
    }
  }

  #[test]
  fn test_track_creation() {
    let track = Track::new(TrackType::Video, "Video Track 1".to_string());

    assert_eq!(track.track_type, TrackType::Video);
    assert_eq!(track.name, "Video Track 1");
    assert!(track.enabled);
    assert!(!track.locked);
    assert_eq!(track.volume, 1.0);
  }

  // Создать тестовый проект
  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: crate::video_compiler::schema::project::ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test description".to_string()),
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: Some("Test Author".to_string()),
      },
      timeline: crate::video_compiler::schema::timeline::Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: Default::default(),
    }
  }
}

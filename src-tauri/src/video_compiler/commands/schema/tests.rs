//! Тесты для модуля schema

#[cfg(test)]
mod schema_tests {
  use super::super::*;
  use crate::video_compiler::schema::{
    common::AspectRatio,
    effects::{EffectType, FilterType},
    subtitles::{SubtitleAnimationType, SubtitleEasing},
    templates::{StyleTemplateCategory, StyleTemplateStyle, TemplateType},
    timeline::ClipSource,
    ProjectSchema, Timeline, Track, TrackType,
  };
  use std::collections::HashMap;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: crate::video_compiler::schema::ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test Description".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        author: Some("Test Author".to_string()),
      },
      timeline: Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![Track {
        id: "track1".to_string(),
        track_type: TrackType::Video,
        name: "Video Track".to_string(),
        enabled: true,
        volume: 1.0,
        locked: false,
        clips: vec![],
        effects: vec![],
        filters: vec![],
      }],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: crate::video_compiler::schema::export::ProjectSettings::default(),
    }
  }

  #[test]
  fn test_create_clip_with_params() {
    let params = types::ClipCreationParams {
      source_path: "/tmp/test_video.mp4".to_string(),
      start_time: 5.0,
      end_time: 15.0,
      speed: Some(1.5),
      opacity: Some(0.8),
    };

    let clip = business_logic::create_clip_with_params(&params);

    assert!(!clip.id.is_empty());
    assert_eq!(clip.start_time, 5.0);
    assert_eq!(clip.end_time, 15.0);
    assert_eq!(clip.source_start, 0.0);
    assert_eq!(clip.source_end, 10.0);
    assert_eq!(clip.speed, 1.5);
    assert_eq!(clip.opacity, 0.8);
    assert!(clip.effects.is_empty());
    assert!(clip.filters.is_empty());

    match clip.source {
      ClipSource::File(path) => assert_eq!(path, "/tmp/test_video.mp4"),
      _ => panic!("Expected File source"),
    }
  }

  #[test]
  fn test_create_effect_with_params() {
    let params = types::EffectCreationParams {
      effect_type: "brightness".to_string(),
      name: Some("Custom Brightness".to_string()),
      parameters: HashMap::new(),
      enabled: Some(false),
    };

    let effect = business_logic::create_effect_with_params(&params);

    assert!(!effect.id.is_empty());
    assert_eq!(effect.name, "Custom Brightness");
    assert_eq!(effect.effect_type, EffectType::Brightness);
    assert!(!effect.enabled);
    assert!(effect.parameters.is_empty());
  }

  #[test]
  fn test_create_effect_unknown_type() {
    let params = types::EffectCreationParams {
      effect_type: "unknown_effect".to_string(),
      name: None,
      parameters: HashMap::new(),
      enabled: None,
    };

    let effect = business_logic::create_effect_with_params(&params);

    assert_eq!(effect.effect_type, EffectType::Blur); // Default fallback
    assert_eq!(effect.name, "unknown_effect");
    assert!(effect.enabled); // Default
  }

  #[test]
  fn test_create_filter_with_params() {
    let params = types::FilterCreationParams {
      filter_type: "saturation".to_string(),
      name: Some("Custom Saturation".to_string()),
      parameters: HashMap::new(),
      intensity: Some(1.5),
      enabled: Some(false),
    };

    let filter = business_logic::create_filter_with_params(&params);

    assert!(!filter.id.is_empty());
    assert_eq!(filter.name, "Custom Saturation");
    assert_eq!(filter.filter_type, FilterType::Saturation);
    assert!(!filter.enabled);
    assert_eq!(filter.intensity, 1.5);
    assert!(filter.parameters.is_empty());
  }

  #[test]
  fn test_create_style_template_with_params() {
    let params = types::StyleTemplateCreationParams {
      name: "Custom Intro".to_string(),
      category: "intro".to_string(),
      style: Some("cinematic".to_string()),
      duration: Some(8.0),
      background_color: Some("#FF0000".to_string()),
    };

    let template = business_logic::create_style_template_with_params(&params);

    assert!(!template.id.is_empty());
    assert_eq!(template.name, "Custom Intro");
    assert_eq!(template.category, StyleTemplateCategory::Intro);
    assert_eq!(template.style, StyleTemplateStyle::Cinematic);
    assert_eq!(template.duration, 8.0);
    assert_eq!(template.background_color, "#FF0000");
    assert!(template.elements.is_empty());
    assert!(template.transitions.is_empty());
  }

  #[test]
  fn test_create_subtitle_with_params() {
    let params = types::SubtitleCreationParams {
      text: "Test subtitle".to_string(),
      start_time: 0.0,
      end_time: 5.0,
      font_family: Some("Helvetica".to_string()),
      font_size: Some(28.0),
      color: Some("#FF0000".to_string()),
      style: None,
    };

    let subtitle = business_logic::create_subtitle_with_params(&params);

    assert!(!subtitle.id.is_empty());
    assert_eq!(subtitle.text, "Test subtitle");
    assert_eq!(subtitle.start_time, 0.0);
    assert_eq!(subtitle.end_time, 5.0);
    assert_eq!(subtitle.duration, 5.0);
    assert_eq!(subtitle.font_family, "Helvetica");
    assert_eq!(subtitle.font_size, 28.0);
    assert_eq!(subtitle.color, "#FF0000");
    assert!(subtitle.enabled);
    assert!(subtitle.animations.is_empty());
  }

  #[test]
  fn test_create_subtitle_animation_with_params() {
    let mut properties = HashMap::new();
    properties.insert("speed".to_string(), serde_json::json!(2.0));

    let params = types::SubtitleAnimationParams {
      animation_type: "fade_in".to_string(),
      duration: 2.0,
      delay: Some(0.5),
      easing: Some("ease_out".to_string()),
      direction: Some("up".to_string()),
      properties: Some(properties.clone()),
    };

    let animation = business_logic::create_subtitle_animation_with_params(&params);

    assert!(!animation.id.is_empty());
    assert_eq!(animation.animation_type, SubtitleAnimationType::FadeIn);
    assert_eq!(animation.duration, 2.0);
    assert_eq!(animation.delay, 0.5);
    assert_eq!(animation.easing, SubtitleEasing::EaseOut);
    assert_eq!(animation.properties, properties);
  }

  #[test]
  fn test_create_track_with_params() {
    let params = types::TrackCreationParams {
      track_type: "audio".to_string(),
      name: "Audio Track".to_string(),
      enabled: Some(false),
      volume: Some(0.5),
      muted: Some(true),
    };

    let track = business_logic::create_track_with_params(&params);

    assert!(!track.id.is_empty());
    assert_eq!(track.name, "Audio Track");
    assert_eq!(track.track_type, TrackType::Audio);
    assert!(!track.enabled);
    assert_eq!(track.volume, 0.5);
    assert!(!track.locked);
    assert!(track.clips.is_empty());
    assert!(track.effects.is_empty());
    assert!(track.filters.is_empty());
  }

  #[test]
  fn test_create_template_with_params() {
    let params = types::TemplateCreationParams {
      template_type: "grid".to_string(),
      name: "Grid Template".to_string(),
      screens: 4,
      width: Some(1920),
      height: Some(1080),
    };

    let template = business_logic::create_template_with_params(&params);

    assert!(!template.id.is_empty());
    assert_eq!(template.name, "Grid Template");
    assert_eq!(template.template_type, TemplateType::Grid);
    assert_eq!(template.screens, 4);
    assert!(template.cells.is_empty());
    assert!(template.regions.is_empty());
  }

  #[test]
  fn test_add_clip_to_track_by_id() {
    let mut project = create_test_project();
    let track_id = project.tracks[0].id.clone();

    let params = types::ClipCreationParams {
      source_path: "/tmp/video.mp4".to_string(),
      start_time: 0.0,
      end_time: 10.0,
      speed: None,
      opacity: None,
    };
    let clip = business_logic::create_clip_with_params(&params);

    let result = business_logic::add_clip_to_track_by_id(&mut project, &track_id, clip);
    assert!(result.is_ok());
    assert_eq!(project.tracks[0].clips.len(), 1);
  }

  #[test]
  fn test_add_clip_to_nonexistent_track() {
    let mut project = create_test_project();

    let params = types::ClipCreationParams {
      source_path: "/tmp/video.mp4".to_string(),
      start_time: 0.0,
      end_time: 10.0,
      speed: None,
      opacity: None,
    };
    let clip = business_logic::create_clip_with_params(&params);

    let result = business_logic::add_clip_to_track_by_id(&mut project, "nonexistent", clip);
    assert!(result.is_err());
  }

  #[test]
  fn test_get_schema_element_stats() {
    let mut project = create_test_project();

    // Добавляем клип
    let params = types::ClipCreationParams {
      source_path: "/tmp/video.mp4".to_string(),
      start_time: 0.0,
      end_time: 10.0,
      speed: None,
      opacity: None,
    };
    let clip = business_logic::create_clip_with_params(&params);
    project.tracks[0].clips.push(clip);

    // Добавляем эффект
    let effect_params = types::EffectCreationParams {
      effect_type: "blur".to_string(),
      name: None,
      parameters: HashMap::new(),
      enabled: None,
    };
    let effect = business_logic::create_effect_with_params(&effect_params);
    project.effects.push(effect);

    let stats = business_logic::get_schema_element_stats(&project);

    assert_eq!(stats.clips, 1);
    assert_eq!(stats.effects, 1);
    assert_eq!(stats.filters, 0);
    assert_eq!(stats.subtitles, 0);
    assert_eq!(stats.tracks, 1);
    assert_eq!(stats.templates, 0);
    assert_eq!(stats.style_templates, 0);
  }

  #[test]
  fn test_validate_project_schema() {
    let project = create_test_project();
    let validation = business_logic::validate_project_schema(&project);

    assert!(validation.is_valid);
    assert!(validation.errors.is_empty());
    assert_eq!(validation.warnings.len(), 1); // No tracks warning
    assert_eq!(validation.element_count, 1); // Only one track
  }

  #[test]
  fn test_validate_project_schema_with_errors() {
    let mut project = create_test_project();
    project.timeline.duration = -1.0; // Invalid duration

    // Add invalid subtitle
    let subtitle_params = types::SubtitleCreationParams {
      text: "Invalid subtitle".to_string(),
      start_time: 10.0,
      end_time: 5.0, // Invalid: end before start
      font_family: None,
      font_size: None,
      color: None,
      style: None,
    };
    let subtitle = business_logic::create_subtitle_with_params(&subtitle_params);
    project.subtitles.push(subtitle);

    let validation = business_logic::validate_project_schema(&project);

    assert!(!validation.is_valid);
    assert!(!validation.errors.is_empty());
    assert!(validation.errors.iter().any(|e| e.contains("duration")));
    assert!(validation
      .errors
      .iter()
      .any(|e| e.contains("Invalid subtitle timing")));
  }

  #[test]
  fn test_create_resolution_for_format() {
    use crate::video_compiler::schema::common::Resolution;

    let hd = business_logic::create_resolution_for_format("hd");
    assert_eq!(hd, Resolution::hd());

    let fullhd = business_logic::create_resolution_for_format("1080p");
    assert_eq!(fullhd, Resolution::full_hd());

    let uhd = business_logic::create_resolution_for_format("4k");
    assert_eq!(uhd, Resolution::uhd_4k());

    let square = business_logic::create_resolution_for_format("square");
    assert_eq!(square, Resolution::new(1080, 1080));

    let unknown = business_logic::create_resolution_for_format("unknown");
    assert_eq!(unknown, Resolution::new(1920, 1080)); // Default
  }

  #[test]
  fn test_get_preset_resolutions() {
    let resolutions = business_logic::get_preset_resolutions();

    assert_eq!(resolutions.len(), 5);

    // Check that all entries have required fields
    for resolution in &resolutions {
      assert!(resolution.get("name").is_some());
      assert!(resolution.get("resolution").is_some());
    }
  }

  #[test]
  fn test_schema_element_type_conversion() {
    // Test from_string
    assert!(matches!(
      types::SchemaElementType::from_string("clip"),
      Some(types::SchemaElementType::Clip)
    ));
    assert!(matches!(
      types::SchemaElementType::from_string("effect"),
      Some(types::SchemaElementType::Effect)
    ));
    assert!(types::SchemaElementType::from_string("invalid").is_none());

    // Test to_string
    assert_eq!(types::SchemaElementType::Clip.to_string(), "clip");
    assert_eq!(types::SchemaElementType::Effect.to_string(), "effect");
    assert_eq!(types::SchemaElementType::Filter.to_string(), "filter");
  }
}

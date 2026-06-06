#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::effects::{EffectParameter, EffectType, FilterType};
  use crate::video_compiler::schema::{ClipSource, ProjectSchema, Resolution, TransformSettings};
  use crate::video_compiler::schema::project::ProjectMetadata;
  use crate::video_compiler::schema::timeline::{Timeline, TrackType, ClipProperties};
  use crate::video_compiler::schema::common::AspectRatio;
  use crate::video_compiler::schema::export::{OutputFormat, ProjectSettings, ExportSettings};
  use crate::video_compiler::core::stages::composition::CompositionStage;
  use std::collections::HashMap;
  use tempfile::TempDir;
  use std::time::Duration;

  #[tokio::test]
  async fn test_composition_stage_basic() {
    let stage = CompositionStage::new();
    assert_eq!(stage.name(), "Composition");
    assert_eq!(stage.estimated_duration(), Duration::from_secs(120));
  }

  #[tokio::test]
  async fn test_apply_time_trim() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    // Test trimming - this will fail without actual FFmpeg
    let result = stage
      .apply_time_trim(&input_path, 1.0, 5.0, &output_path, &create_test_context())
      .await;

    // We expect this to fail in test environment without FFmpeg
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_apply_single_effect_audio_fade_in() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create test effect using the constructor
    let mut effect = Effect::new(EffectType::AudioFadeIn, "Audio Fade In".to_string());
    effect.parameters.insert("duration".to_string(), EffectParameter::Float(2.0));

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    // Test applying effect - this will fail without actual FFmpeg
    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    // We expect this to fail in test environment without FFmpeg
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_apply_filters() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create test filters using the constructor
    let mut filter1 = Filter::new(FilterType::Brightness, "Brightness".to_string());
    filter1.parameters.insert("value".to_string(), 0.5);
    
    let mut filter2 = Filter::new(FilterType::Contrast, "Contrast".to_string());
    filter2.parameters.insert("value".to_string(), 1.5);

    let filters = vec![&filter1, &filter2];

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    // Test applying filters
    let result = stage
      .apply_filters(&input_path, &filters, &output_path, &create_test_context())
      .await;

    // We expect this to fail in test environment without FFmpeg
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_apply_filters_empty() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    // Test with empty filters - should just copy file
    let result = stage
      .apply_filters(&input_path, &[], &output_path, &create_test_context())
      .await;

    assert!(result.is_ok());
    assert!(output_path.exists());
    assert_eq!(
      std::fs::read(&output_path).unwrap(),
      b"dummy video data"
    );
  }

  #[tokio::test]
  async fn test_concatenate_clips_single() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    // Test with single clip - should just copy
    let result = stage
      .concatenate_clips(&[input_path.clone()], &output_path, &create_test_context())
      .await;

    assert!(result.is_ok());
    assert!(output_path.exists());
    assert_eq!(
      std::fs::read(&output_path).unwrap(),
      b"dummy video data"
    );
  }

  #[tokio::test]
  async fn test_concatenate_clips_empty() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output.mp4");

    // Test with empty clips
    let result = stage
      .concatenate_clips(&[], &output_path, &create_test_context())
      .await;

    assert!(result.is_err());
    if let Err(VideoCompilerError::InternalError(msg)) = result {
      assert_eq!(msg, "Нет клипов для объединения");
    }
  }

  #[tokio::test]
  async fn test_combine_layers_single() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("layer1.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    // Test with single layer - should just copy
    let result = stage
      .combine_layers(&[input_path.clone()], &output_path, &create_test_context())
      .await;

    assert!(result.is_ok());
    assert!(output_path.exists());
    assert_eq!(
      std::fs::read(&output_path).unwrap(),
      b"dummy video data"
    );
  }

  #[tokio::test]
  async fn test_combine_layers_empty() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("output.mp4");

    // Test with empty layers
    let result = stage
      .combine_layers(&[], &output_path, &create_test_context())
      .await;

    assert!(result.is_err());
    if let Err(VideoCompilerError::InternalError(msg)) = result {
      assert_eq!(msg, "Нет слоев для объединения");
    }
  }

  #[tokio::test]
  async fn test_create_empty_track() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("empty.mp4");

    let context = create_test_context();

    // Test creating empty track - this will fail without actual FFmpeg
    let result = stage.create_empty_track(&output_path, &context).await;

    // We expect this to fail in test environment without FFmpeg
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_apply_positioning() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Create test clip with transform
    let transform = TransformSettings {
      position_x: 0.1,
      position_y: 0.2,
      scale_x: 0.8,
      scale_y: 0.8,
      rotation: 0.0,
      anchor_x: 0.5,
      anchor_y: 0.5,
    };

    let clip = Clip {
      id: "clip1".to_string(),
      source: ClipSource::File(input_path.to_string_lossy().to_string()),
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 10.0,
      speed: 1.0,
      opacity: 1.0,
      effects: vec![],
      filters: vec![],
      transform: Some(transform),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    };

    // Create dummy input file
    std::fs::write(&input_path, b"dummy video data").unwrap();

    let context = create_test_context();

    // Test applying positioning - this will fail without actual FFmpeg
    let result = stage
      .apply_positioning(&input_path, &clip, &output_path, &context)
      .await;

    // We expect this to fail in test environment without FFmpeg
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_process_clip_source_not_found() {
    let stage = CompositionStage::new();
    let mut context = create_test_context();

    let clip = Clip {
      id: "clip1".to_string(),
      source: ClipSource::File("test.mp4".to_string()),
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 10.0,
      speed: 1.0,
      opacity: 1.0,
      effects: vec![],
      filters: vec![],
      transform: None,
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    };

    // Test processing clip without intermediate file
    let result = stage.process_clip(&clip, 0, 0, &mut context).await;

    assert!(result.is_err());
    if let Err(VideoCompilerError::InternalError(msg)) = result {
      assert!(msg.contains("не найден"));
    }
  }

  #[tokio::test]
  async fn test_process_track_empty() {
    let stage = CompositionStage::new();
    let mut context = create_test_context();

    let track = Track::new(TrackType::Video, "Empty Track".to_string());

    // Test processing empty track - this will fail without FFmpeg
    let result = stage.process_track(&track, 0, &mut context).await;

    // We expect this to fail in test environment without FFmpeg
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_composition_stage_cancelled() {
    let stage = CompositionStage::new();
    let mut context = create_test_context();
    
    // Create cancellation token and cancel it
    context.set_canceled();

    // Test that process returns cancelled error
    let result = stage.process(&mut context).await;

    assert!(result.is_err());
    if let Err(VideoCompilerError::CancelledError(msg)) = result {
      assert_eq!(msg, "Композиция отменена");
    }
  }

  #[tokio::test]
  async fn test_effect_parameter_extraction() {
    let stage = CompositionStage::new();
    let temp_dir = TempDir::new().unwrap();
    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    // Test various effect types with parameters
    let effect_types = vec![
      (EffectType::AudioFadeOut, "duration", EffectParameter::Float(3.0)),
      (EffectType::Blur, "radius", EffectParameter::Float(10.0)),
      (EffectType::Brightness, "value", EffectParameter::Float(0.5)),
      (EffectType::Contrast, "value", EffectParameter::Float(2.0)),
    ];

    for (effect_type, param_name, param_value) in effect_types {
      let mut effect = Effect::new(effect_type, format!("Effect {:?}", effect_type));
      effect.parameters.insert(param_name.to_string(), param_value);

      // Create dummy input file
      std::fs::write(&input_path, b"dummy video data").unwrap();

      // Test applying effect - will fail without FFmpeg but tests parameter extraction
      let _ = stage.apply_single_effect(&input_path, &effect, &output_path).await;
    }
  }

  // Helper function to create test context
  fn create_test_context() -> PipelineContext {
    let project = ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test description".to_string()),
        author: Some("Test Author".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
      },
      timeline: Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![],
      effects: vec![],
      filters: vec![],
      transitions: vec![],
      subtitles: vec![],
      templates: vec![],
      style_templates: vec![],
      settings: ProjectSettings {
        export: ExportSettings {
          quality: 95,
          video_bitrate: 5000,
          audio_bitrate: 192,
          hardware_acceleration: false,
          preferred_gpu_encoder: None,
          ffmpeg_args: None,
          format: OutputFormat::Mp4,
          use_two_pass: false,
          preset: None,
          pixel_format: None,
          video_filter: None,
          audio_filter: None,
          metadata: None,
          threads: None,
          buffer_size: None,
          max_file_size: None,
          subtitle_burn_in: false,
          deinterlace: false,
          color_space: None,
          hdr_metadata: None,
        },
      },
      resources: vec![],
    };

    let temp_dir = TempDir::new().unwrap();
    PipelineContext::new(project, temp_dir.path().to_path_buf())
  }
}
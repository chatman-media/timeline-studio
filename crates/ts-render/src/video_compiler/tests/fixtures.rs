//! Тестовые фикстуры для video_compiler
//!
//! Предоставляет готовые объекты и данные для использования в тестах.

use crate::video_compiler::schema::{
  common::AspectRatio,
  effects::{Effect, EffectParameter, EffectType},
  project::{ProjectMetadata, ProjectSchema},
  timeline::{Clip, Timeline, Track, TrackType},
};
use chrono::Utc;
use std::collections::HashMap;
use std::path::PathBuf;

/// Создает минимальный валидный проект для тестирования
pub fn create_minimal_project() -> ProjectSchema {
  ProjectSchema {
    version: "1.0.0".to_string(),
    metadata: ProjectMetadata {
      name: "Test Project".to_string(),
      description: Some("Test Description".to_string()),
      created_at: Utc::now(),
      modified_at: Utc::now(),
      author: Some("Test Author".to_string()),
    },
    timeline: Timeline {
      duration: 10.0,
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

/// Создает проект с клипами для тестирования
pub fn create_project_with_clips() -> ProjectSchema {
  let mut project = create_minimal_project();

  // Создаем тестовый клип с правильными полями
  let test_clip = Clip::new(PathBuf::from("/tmp/test-video.mp4"), 0.0, 5.0);

  // Добавляем видео трек с клипом
  let mut video_track = Track::new(TrackType::Video, "Video Track 1".to_string());
  video_track.clips.push(test_clip);

  project.tracks.push(video_track);
  project.timeline.duration = 5.0;

  project
}

/// Создает сложный проект для тестирования
pub fn create_complex_project() -> ProjectSchema {
  let mut project = create_project_with_clips();

  // Добавляем эффекты
  project
    .effects
    .push(create_test_effect(EffectType::Brightness));
  project
    .effects
    .push(create_test_effect(EffectType::Contrast));

  project
}

/// Создает тестовый эффект
pub fn create_test_effect(effect_type: EffectType) -> Effect {
  let mut parameters = HashMap::new();

  match effect_type {
    EffectType::Brightness => {
      parameters.insert("value".to_string(), EffectParameter::Float(1.2));
    }
    EffectType::Contrast => {
      parameters.insert("value".to_string(), EffectParameter::Float(1.1));
    }
    _ => {
      parameters.insert("enabled".to_string(), EffectParameter::Bool(true));
    }
  }

  Effect {
    id: format!("effect-{}", uuid::Uuid::new_v4()),
    name: format!("{effect_type:?} Effect"),
    effect_type,
    category: None,
    complexity: None,
    tags: vec![],
    description: None,
    labels: None,
    parameters,
    enabled: true,
    start_time: Some(0.0),
    end_time: Some(10.0),
    ffmpeg_command: None,
    css_filter: None,
    preview_path: None,
    presets: None,
  }
}

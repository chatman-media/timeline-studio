//! Project - Основная схема проекта и метаданные

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::effects::{Effect, Filter, Transition};
use super::export::ProjectSettings;
use super::subtitles::Subtitle;
use super::templates::{StyleTemplate, Template};
use super::timeline::{Timeline, Track};

/// Основная схема проекта Timeline Studio
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSchema {
  /// Версия схемы проекта для совместимости
  pub version: String,
  /// Метаданные проекта
  pub metadata: ProjectMetadata,
  /// Настройки timeline (fps, разрешение, длительность)
  pub timeline: Timeline,
  /// Список треков (видео, аудио, субтитры)
  pub tracks: Vec<Track>,
  /// Глобальные эффекты проекта
  pub effects: Vec<Effect>,
  /// Переходы между клипами
  pub transitions: Vec<Transition>,
  /// Фильтры для визуальных эффектов
  pub filters: Vec<Filter>,
  /// Шаблоны многокамерных раскладок
  pub templates: Vec<Template>,
  /// Стилестические шаблоны (интро, аутро, титры)
  pub style_templates: Vec<StyleTemplate>,
  /// Субтитры проекта
  pub subtitles: Vec<Subtitle>,
  /// Настройки проекта и экспорта
  pub settings: ProjectSettings,
}

impl ProjectSchema {
  /// Создать новый пустой проект
  pub fn new(name: String) -> Self {
    Self {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name,
        description: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: None,
      },
      timeline: Timeline::default(),
      tracks: Vec::new(),
      effects: Vec::new(),
      transitions: Vec::new(),
      filters: Vec::new(),
      templates: Vec::new(),
      style_templates: Vec::new(),
      subtitles: Vec::new(),
      settings: ProjectSettings::default(),
    }
  }

  /// Валидация схемы проекта
  pub fn validate(&self) -> Result<(), String> {
    // Проверка версии
    if self.version.is_empty() {
      return Err("Версия проекта не может быть пустой".to_string());
    }

    // Проверка timeline
    if self.timeline.fps == 0 {
      return Err("FPS должен быть больше 0".to_string());
    }

    if self.timeline.resolution.0 == 0 || self.timeline.resolution.1 == 0 {
      return Err("Разрешение должно быть больше 0x0".to_string());
    }

    // Проверка треков
    for track in &self.tracks {
      track.validate()?;
    }

    // Проверка клипов на пересечения по времени в одном треке
    for track in &self.tracks {
      let mut clips = track.clips.clone();
      clips.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

      for i in 0..clips.len().saturating_sub(1) {
        if clips[i].end_time > clips[i + 1].start_time {
          return Err(format!(
            "Клипы пересекаются по времени в треке '{}': {} и {}",
            track.name,
            clips[i].id,
            clips[i + 1].id
          ));
        }
      }
    }

    Ok(())
  }

  /// Получить общую длительность проекта
  pub fn get_duration(&self) -> f64 {
    self
      .tracks
      .iter()
      .flat_map(|track| &track.clips)
      .map(|clip| clip.end_time)
      .fold(0.0, f64::max)
  }

  /// Обновить время модификации
  pub fn touch(&mut self) {
    self.metadata.modified_at = Utc::now();
  }

  /// Найти клип по ID во всех треках
  pub fn find_clip_by_id(&self, clip_id: &str) -> Option<&super::timeline::Clip> {
    for track in &self.tracks {
      for clip in &track.clips {
        if clip.id == clip_id {
          return Some(clip);
        }
      }
    }
    None
  }

  /// Получить путь к файлу по ID клипа
  pub fn get_clip_file_path(&self, clip_id: &str) -> Option<String> {
    if let Some(clip) = self.find_clip_by_id(clip_id) {
      match &clip.source {
        super::timeline::ClipSource::File(path) => Some(path.clone()),
        _ => None,
      }
    } else {
      None
    }
  }
}

/// Метаданные проекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectMetadata {
  /// Название проекта
  pub name: String,
  /// Описание проекта
  pub description: Option<String>,
  /// Время создания
  pub created_at: DateTime<Utc>,
  /// Время последней модификации
  pub modified_at: DateTime<Utc>,
  /// Автор проекта
  pub author: Option<String>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::timeline::{
    Clip, ClipProperties, ClipSource, Track, TrackType,
  };

  fn create_test_project() -> ProjectSchema {
    ProjectSchema::new("Test Project".to_string())
  }

  fn create_test_clip(id: &str, start: f64, end: f64) -> Clip {
    Clip {
      id: id.to_string(),
      source: ClipSource::File(format!("/path/to/{}.mp4", id)),
      start_time: start,
      end_time: end,
      source_start: 0.0,
      source_end: end - start,
      speed: 1.0,
      opacity: 1.0,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    }
  }

  fn create_test_track(name: &str, track_type: TrackType) -> Track {
    Track {
      id: format!("{}_track", name),
      track_type,
      name: name.to_string(),
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: Vec::new(),
      effects: Vec::new(),
      filters: Vec::new(),
    }
  }

  #[test]
  fn test_project_schema_new() {
    let project = ProjectSchema::new("My Project".to_string());

    assert_eq!(project.version, "1.0.0");
    assert_eq!(project.metadata.name, "My Project");
    assert!(project.metadata.description.is_none());
    assert!(project.metadata.author.is_none());
    assert!(project.tracks.is_empty());
    assert!(project.effects.is_empty());
    assert!(project.transitions.is_empty());
    assert!(project.filters.is_empty());
    assert!(project.templates.is_empty());
    assert!(project.style_templates.is_empty());
    assert!(project.subtitles.is_empty());
  }

  #[test]
  fn test_project_metadata() {
    let mut project = create_test_project();

    project.metadata.description = Some("Test description".to_string());
    project.metadata.author = Some("Test Author".to_string());

    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(
      project.metadata.description,
      Some("Test description".to_string())
    );
    assert_eq!(project.metadata.author, Some("Test Author".to_string()));
    assert!(project.metadata.created_at <= project.metadata.modified_at);
  }

  #[test]
  fn test_validate_empty_version() {
    let mut project = create_test_project();
    project.version = String::new();

    let result = project.validate();
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .contains("Версия проекта не может быть пустой"));
  }

  #[test]
  fn test_validate_invalid_fps() {
    let mut project = create_test_project();
    project.timeline.fps = 0;

    let result = project.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("FPS должен быть больше 0"));
  }

  #[test]
  fn test_validate_invalid_resolution() {
    let mut project = create_test_project();

    // Test zero width
    project.timeline.resolution = (0, 1080);
    let result = project.validate();
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .contains("Разрешение должно быть больше 0x0"));

    // Test zero height
    project.timeline.resolution = (1920, 0);
    let result = project.validate();
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .contains("Разрешение должно быть больше 0x0"));

    // Test both zero
    project.timeline.resolution = (0, 0);
    let result = project.validate();
    assert!(result.is_err());
  }

  #[test]
  fn test_validate_overlapping_clips() {
    let mut project = create_test_project();

    let mut track = create_test_track("video", TrackType::Video);

    // Add overlapping clips
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));
    track.clips.push(create_test_clip("clip2", 3.0, 8.0)); // Overlaps with clip1

    project.tracks.push(track);

    let result = project.validate();
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.contains("Клипы пересекаются по времени"));
    assert!(error.contains("clip1"));
    assert!(error.contains("clip2"));
  }

  #[test]
  fn test_validate_non_overlapping_clips() {
    let mut project = create_test_project();

    let mut track = create_test_track("video", TrackType::Video);

    // Add non-overlapping clips
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));
    track.clips.push(create_test_clip("clip2", 5.0, 10.0)); // Exactly adjacent
    track.clips.push(create_test_clip("clip3", 12.0, 15.0)); // Gap between clips

    project.tracks.push(track);

    let result = project.validate();
    assert!(result.is_ok());
  }

  #[test]
  fn test_validate_multiple_tracks() {
    let mut project = create_test_project();

    let mut video_track = create_test_track("video", TrackType::Video);
    video_track.clips.push(create_test_clip("v1", 0.0, 5.0));
    video_track.clips.push(create_test_clip("v2", 6.0, 10.0));

    let mut audio_track = create_test_track("audio", TrackType::Audio);
    // Clips in different tracks can overlap in time
    audio_track.clips.push(create_test_clip("a1", 0.0, 7.0));
    audio_track.clips.push(create_test_clip("a2", 8.0, 12.0));

    project.tracks.push(video_track);
    project.tracks.push(audio_track);

    let result = project.validate();
    assert!(result.is_ok());
  }

  #[test]
  fn test_get_duration_empty_project() {
    let project = create_test_project();
    assert_eq!(project.get_duration(), 0.0);
  }

  #[test]
  fn test_get_duration_single_track() {
    let mut project = create_test_project();

    let mut track = create_test_track("video", TrackType::Video);
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));
    track.clips.push(create_test_clip("clip2", 6.0, 10.0));

    project.tracks.push(track);

    assert_eq!(project.get_duration(), 10.0);
  }

  #[test]
  fn test_get_duration_multiple_tracks() {
    let mut project = create_test_project();

    let mut video_track = create_test_track("video", TrackType::Video);
    video_track.clips.push(create_test_clip("v1", 0.0, 8.0));

    let mut audio_track = create_test_track("audio", TrackType::Audio);
    audio_track.clips.push(create_test_clip("a1", 0.0, 12.0)); // Longer than video

    project.tracks.push(video_track);
    project.tracks.push(audio_track);

    assert_eq!(project.get_duration(), 12.0);
  }

  #[test]
  fn test_touch() {
    let mut project = create_test_project();
    let original_modified = project.metadata.modified_at;

    // Sleep to ensure time difference
    std::thread::sleep(std::time::Duration::from_millis(10));

    project.touch();

    assert!(project.metadata.modified_at > original_modified);
    assert_eq!(project.metadata.created_at, project.metadata.created_at); // Created time should not change
  }

  #[test]
  fn test_find_clip_by_id() {
    let mut project = create_test_project();

    let mut track1 = create_test_track("video1", TrackType::Video);
    track1.clips.push(create_test_clip("clip1", 0.0, 5.0));
    track1.clips.push(create_test_clip("clip2", 6.0, 10.0));

    let mut track2 = create_test_track("video2", TrackType::Video);
    track2.clips.push(create_test_clip("clip3", 0.0, 5.0));

    project.tracks.push(track1);
    project.tracks.push(track2);

    // Test finding existing clips
    assert!(project.find_clip_by_id("clip1").is_some());
    assert!(project.find_clip_by_id("clip2").is_some());
    assert!(project.find_clip_by_id("clip3").is_some());

    // Test finding non-existent clip
    assert!(project.find_clip_by_id("clip4").is_none());

    // Verify correct clip is returned
    let clip = project.find_clip_by_id("clip2").unwrap();
    assert_eq!(clip.id, "clip2");
    assert_eq!(clip.start_time, 6.0);
    assert_eq!(clip.end_time, 10.0);
  }

  #[test]
  fn test_get_clip_file_path() {
    let mut project = create_test_project();

    let mut track = create_test_track("video", TrackType::Video);
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));

    // Add a clip with non-file source
    let mut clip2 = create_test_clip("clip2", 6.0, 10.0);
    clip2.source = ClipSource::Generated;
    track.clips.push(clip2);

    project.tracks.push(track);

    // Test file source
    assert_eq!(
      project.get_clip_file_path("clip1"),
      Some("/path/to/clip1.mp4".to_string())
    );

    // Test non-file source
    assert_eq!(project.get_clip_file_path("clip2"), None);

    // Test non-existent clip
    assert_eq!(project.get_clip_file_path("clip3"), None);
  }

  #[test]
  fn test_project_serialization() {
    let mut project = create_test_project();

    // Add some data
    let mut track = create_test_track("video", TrackType::Video);
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));
    project.tracks.push(track);

    project.metadata.description = Some("Test description".to_string());
    project.metadata.author = Some("Test Author".to_string());

    // Serialize
    let serialized = serde_json::to_string(&project).unwrap();
    assert!(serialized.contains("Test Project"));
    assert!(serialized.contains("Test description"));
    assert!(serialized.contains("Test Author"));
    assert!(serialized.contains("clip1"));

    // Deserialize
    let deserialized: ProjectSchema = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.metadata.name, project.metadata.name);
    assert_eq!(
      deserialized.metadata.description,
      project.metadata.description
    );
    assert_eq!(deserialized.metadata.author, project.metadata.author);
    assert_eq!(deserialized.tracks.len(), 1);
    assert_eq!(deserialized.tracks[0].clips.len(), 1);
    assert_eq!(deserialized.tracks[0].clips[0].id, "clip1");
  }

  #[test]
  fn test_overlapping_clips_unsorted() {
    let mut project = create_test_project();

    let mut track = create_test_track("video", TrackType::Video);

    // Add clips in unsorted order
    track.clips.push(create_test_clip("clip2", 6.0, 10.0));
    track.clips.push(create_test_clip("clip1", 2.0, 7.0)); // Overlaps when sorted
    track.clips.push(create_test_clip("clip3", 12.0, 15.0));

    project.tracks.push(track);

    let result = project.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Клипы пересекаются"));
  }

  #[test]
  fn test_edge_case_exact_clip_boundaries() {
    let mut project = create_test_project();

    let mut track = create_test_track("video", TrackType::Video);

    // Clips with exact boundaries (end_time of one equals start_time of next)
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));
    track.clips.push(create_test_clip("clip2", 5.0, 10.0));
    track.clips.push(create_test_clip("clip3", 10.0, 15.0));

    project.tracks.push(track);

    let result = project.validate();
    assert!(result.is_ok()); // Should be valid as clips don't overlap
  }

  #[test]
  fn test_project_with_all_components() {
    let mut project = create_test_project();

    // Add tracks
    let mut video_track = create_test_track("video", TrackType::Video);
    video_track.clips.push(create_test_clip("v1", 0.0, 5.0));
    project.tracks.push(video_track);

    // Add effects
    project.effects.push(Effect {
      id: "effect1".to_string(),
      effect_type: crate::video_compiler::schema::effects::EffectType::Blur,
      name: "Test Blur".to_string(),
      category: None,
      complexity: None,
      tags: Vec::new(),
      description: None,
      labels: None,
      enabled: true,
      parameters: std::collections::HashMap::new(),
      start_time: None,
      end_time: None,
      ffmpeg_command: None,
      css_filter: None,
      preview_path: None,
      presets: None,
    });

    // Add transitions
    use crate::video_compiler::schema::effects::TransitionDuration;
    project.transitions.push(Transition {
      id: "trans1".to_string(),
      transition_type: "fade".to_string(),
      name: "Fade Transition".to_string(),
      duration: TransitionDuration {
        value: 1.0,
        min: None,
        max: None,
      },
      category: None,
      tags: Vec::new(),
      complexity: None,
      enabled: true,
      parameters: std::collections::HashMap::new(),
      ffmpeg_command: None,
      easing: None,
      direction: None,
    });

    // Add filters
    project.filters.push(Filter {
      id: "filter1".to_string(),
      filter_type: crate::video_compiler::schema::effects::FilterType::Brightness,
      name: "Brightness Filter".to_string(),
      enabled: true,
      parameters: std::collections::HashMap::new(),
      ffmpeg_command: None,
      intensity: 1.0,
      custom_filter: None,
    });

    // Add subtitle
    project
      .subtitles
      .push(Subtitle::new("Test subtitle".to_string(), 0.0, 2.0));

    // Validate
    let result = project.validate();
    assert!(result.is_ok());

    // Check duration includes all components
    assert_eq!(project.get_duration(), 5.0);
  }

  #[test]
  fn test_empty_track_validation() {
    let mut project = create_test_project();

    // Add empty track
    let track = create_test_track("empty", TrackType::Video);
    project.tracks.push(track);

    let result = project.validate();
    assert!(result.is_ok()); // Empty tracks should be valid
  }

  #[test]
  fn test_project_clone() {
    let mut project = create_test_project();

    // Add some data
    project.metadata.description = Some("Original".to_string());
    let mut track = create_test_track("video", TrackType::Video);
    track.clips.push(create_test_clip("clip1", 0.0, 5.0));
    project.tracks.push(track);

    // Clone
    let cloned = project.clone();

    // Verify clone is independent
    assert_eq!(cloned.metadata.name, project.metadata.name);
    assert_eq!(cloned.metadata.description, project.metadata.description);
    assert_eq!(cloned.tracks.len(), project.tracks.len());
    assert_eq!(cloned.tracks[0].clips.len(), project.tracks[0].clips.len());

    // Modify original
    project.metadata.description = Some("Modified".to_string());

    // Verify clone is unchanged
    assert_eq!(cloned.metadata.description, Some("Original".to_string()));
  }
}

//! FFmpeg Builder - Модуль обработки входных источников

use std::path::PathBuf;
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{ClipSource, ProjectSchema, TrackType};

/// Информация о входном источнике
#[derive(Debug, Clone)]
pub struct InputSource {
  /// Путь к файлу
  pub path: PathBuf,
  /// Время начала в источнике
  pub start_time: f64,
  /// Длительность
  pub duration: f64,
  /// Тип трека
  pub track_type: TrackType,
}

/// Построитель входных источников
pub struct InputBuilder<'a> {
  project: &'a ProjectSchema,
}

impl<'a> InputBuilder<'a> {
  /// Создать новый построитель входных источников
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self { project }
  }

  /// Добавить входные источники
  pub async fn add_input_sources(&self, cmd: &mut Command) -> Result<()> {
    let sources = self.collect_input_sources().await?;

    for source in sources {
      self.add_input_source(cmd, &source)?;
    }

    Ok(())
  }

  /// Добавить входные источники для сегмента
  pub async fn add_segment_inputs(
    &self,
    cmd: &mut Command,
    start_time: f64,
    end_time: f64,
  ) -> Result<()> {
    let sources = self.collect_segment_sources(start_time, end_time).await?;

    for source in sources {
      self.add_input_source(cmd, &source)?;
    }

    Ok(())
  }

  /// Добавить один входной источник
  fn add_input_source(&self, cmd: &mut Command, source: &InputSource) -> Result<()> {
    // Время начала
    if source.start_time > 0.0 {
      cmd.args(["-ss", &source.start_time.to_string()]);
    }

    // Входной файл
    cmd.args(["-i", &source.path.to_string_lossy()]);

    // Специфичные настройки для типа трека
    match source.track_type {
      TrackType::Video => {
        // Для видео можем добавить дополнительные параметры декодирования
        if self.should_use_hardware_decoding() {
          cmd.args(["-hwaccel", "auto"]);
        }
      }
      TrackType::Audio => {
        // Для аудио можем настроить параметры декодирования
      }
      TrackType::Subtitle => {
        // Для субтитров используем специальные декодеры
      }
    }

    // Используем duration для ограничения длительности чтения
    if source.duration > 0.0 {
      cmd.args(["-t", &source.duration.to_string()]);
    }

    Ok(())
  }

  /// Собрать список входных источников
  pub async fn collect_input_sources(&self) -> Result<Vec<InputSource>> {
    let mut sources = Vec::new();

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        if let ClipSource::File(path) = &clip.source {
          sources.push(InputSource {
            path: PathBuf::from(path),
            start_time: clip.source_start,
            duration: clip.get_source_duration(),
            track_type: track.track_type.clone(),
          });
        }
      }
    }

    Ok(sources)
  }

  /// Собрать источники для сегмента
  async fn collect_segment_sources(
    &self,
    start_time: f64,
    end_time: f64,
  ) -> Result<Vec<InputSource>> {
    let mut sources = Vec::new();

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        let clip_duration = clip.end_time - clip.start_time;
        let clip_end = clip.start_time + clip_duration;

        // Проверяем пересечение с сегментом
        if clip.start_time < end_time && clip_end > start_time {
          // Вычисляем время начала в источнике с учетом сегмента
          let segment_start_in_clip = (start_time - clip.start_time).max(0.0);
          let source_start = clip.source_start + segment_start_in_clip;

          // Вычисляем длительность с учетом границ сегмента
          let segment_end_in_clip = (end_time - clip.start_time).min(clip_duration);
          let duration = segment_end_in_clip - segment_start_in_clip;

          if let ClipSource::File(path) = &clip.source {
            sources.push(InputSource {
              path: PathBuf::from(path),
              start_time: source_start,
              duration,
              track_type: track.track_type.clone(),
            });
          }
        }
      }
    }

    Ok(sources)
  }

  /// Получить индекс входа для клипа
  pub fn get_clip_input_index(&self, clip_id: &str) -> Option<usize> {
    let mut input_index = 0;

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        if clip.id == clip_id {
          return Some(input_index);
        }
        input_index += 1;
      }
    }

    None
  }

  /// Проверить, нужно ли использовать аппаратное декодирование
  fn should_use_hardware_decoding(&self) -> bool {
    // Здесь можно добавить логику определения необходимости HW декодирования
    false
  }
}

#[cfg(test)]
mod inputs_tests;

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::timeline::{Clip, Track, TrackType};
  use crate::video_compiler::tests::fixtures::*;
  use std::path::PathBuf;
  use tokio::process::Command;

  #[test]
  fn test_input_source_creation() {
    let source = InputSource {
      path: PathBuf::from("/test/video.mp4"),
      start_time: 10.0,
      duration: 5.0,
      track_type: TrackType::Video,
    };

    assert_eq!(source.path, PathBuf::from("/test/video.mp4"));
    assert_eq!(source.start_time, 10.0);
    assert_eq!(source.duration, 5.0);
    assert_eq!(source.track_type, TrackType::Video);
  }

  #[test]
  fn test_input_builder_new() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);

    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_collect_input_sources_empty_project() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);

    let result = builder.collect_input_sources().await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    assert!(sources.is_empty(), "Empty project should have no sources");
  }

  #[tokio::test]
  async fn test_collect_input_sources_with_clips() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);

    let result = builder.collect_input_sources().await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    assert!(
      !sources.is_empty(),
      "Project with clips should have sources"
    );
    assert_eq!(sources.len(), 1);

    let source = &sources[0];
    assert_eq!(source.track_type, TrackType::Video);
  }

  #[tokio::test]
  async fn test_collect_input_sources_disabled_tracks() {
    let mut project = create_project_with_clips();
    project.tracks[0].enabled = false; // Отключаем первый трек

    let builder = InputBuilder::new(&project);
    let result = builder.collect_input_sources().await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    assert!(
      sources.is_empty(),
      "Disabled tracks should not contribute sources"
    );
  }

  #[tokio::test]
  async fn test_add_input_sources_empty() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_input_sources(&mut cmd).await;
    assert!(result.is_ok());

    // Команда не должна содержать входных файлов для пустого проекта
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();
    assert!(!args.contains(&"-i".to_string()));
  }

  #[tokio::test]
  async fn test_add_input_sources_with_clips() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_input_sources(&mut cmd).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Должен содержать входной файл
    assert!(args.contains(&"-i".to_string()));
  }

  #[test]
  fn test_add_input_source_basic() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let source = InputSource {
      path: PathBuf::from("/test/video.mp4"),
      start_time: 0.0,
      duration: 10.0,
      track_type: TrackType::Video,
    };

    let result = builder.add_input_source(&mut cmd, &source);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-i".to_string()));
    assert!(args.contains(&"/test/video.mp4".to_string()));
    assert!(args.contains(&"-t".to_string()));
    assert!(args.contains(&"10".to_string()));
  }

  #[test]
  fn test_add_input_source_with_start_time() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let source = InputSource {
      path: PathBuf::from("/test/video.mp4"),
      start_time: 5.0,
      duration: 10.0,
      track_type: TrackType::Video,
    };

    let result = builder.add_input_source(&mut cmd, &source);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Проверяем seek
    assert!(args.contains(&"-ss".to_string()));
    assert!(args.contains(&"5".to_string()));

    // Проверяем длительность
    assert!(args.contains(&"-t".to_string()));
    assert!(args.contains(&"10".to_string()));
  }

  #[test]
  fn test_add_input_source_audio_track() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let source = InputSource {
      path: PathBuf::from("/test/audio.mp3"),
      start_time: 0.0,
      duration: 5.0,
      track_type: TrackType::Audio,
    };

    let result = builder.add_input_source(&mut cmd, &source);
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    assert!(args.contains(&"-i".to_string()));
    assert!(args.contains(&"/test/audio.mp3".to_string()));
  }

  #[tokio::test]
  async fn test_collect_segment_sources() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);

    // Тестируем сегмент который пересекается с клипом
    let start_time = 2.0;
    let end_time = 4.0;

    let result = builder.collect_segment_sources(start_time, end_time).await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    // Должен найти источники для пересекающегося сегмента
    assert_eq!(sources.len(), 1);
  }

  #[tokio::test]
  async fn test_collect_segment_sources_no_intersection() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);

    // Тестируем сегмент который не пересекается с клипами
    let start_time = 20.0;
    let end_time = 25.0;

    let result = builder.collect_segment_sources(start_time, end_time).await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    // Не должен найти источники для непересекающегося сегмента
    assert!(sources.is_empty());
  }

  #[tokio::test]
  async fn test_add_segment_inputs() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let start_time = 1.0;
    let end_time = 3.0;

    let result = builder
      .add_segment_inputs(&mut cmd, start_time, end_time)
      .await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Если сегмент пересекается с клипами, должны быть входы
    if !args.is_empty() {
      assert!(args.contains(&"-i".to_string()));
    }
  }

  #[test]
  fn test_get_clip_input_index() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);

    // Получаем ID первого клипа
    let clip_id = &project.tracks[0].clips[0].id;

    let index = builder.get_clip_input_index(clip_id);
    assert!(index.is_some());
    assert_eq!(index.unwrap(), 0);
  }

  #[test]
  fn test_get_clip_input_index_not_found() {
    let project = create_project_with_clips();
    let builder = InputBuilder::new(&project);

    let index = builder.get_clip_input_index("non_existent_clip");
    assert!(index.is_none());
  }

  #[test]
  fn test_should_use_hardware_decoding() {
    let project = create_minimal_project();
    let builder = InputBuilder::new(&project);

    // По умолчанию должно возвращать false
    assert!(!builder.should_use_hardware_decoding());
  }

  #[tokio::test]
  async fn test_multiple_tracks_input_sources() {
    let mut project = create_project_with_clips();

    // Добавляем аудио трек
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(PathBuf::from("/test/audio.mp3"), 0.0, 5.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = InputBuilder::new(&project);
    let result = builder.collect_input_sources().await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    assert_eq!(sources.len(), 2); // Видео + аудио

    // Проверяем типы треков
    let video_sources = sources
      .iter()
      .filter(|s| s.track_type == TrackType::Video)
      .count();
    let audio_sources = sources
      .iter()
      .filter(|s| s.track_type == TrackType::Audio)
      .count();

    assert_eq!(video_sources, 1);
    assert_eq!(audio_sources, 1);
  }

  #[tokio::test]
  async fn test_segment_time_calculation() {
    let mut project = create_minimal_project();

    // Создаем клип с определенными временными границами
    let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 5.0, 15.0); // Клип с 5 до 15 секунд
    video_track.clips.push(clip);
    project.tracks.push(video_track);

    let builder = InputBuilder::new(&project);

    // Тестируем сегмент с 8 до 12 секунд (пересекается с клипом)
    let start_time = 8.0;
    let end_time = 12.0;

    let result = builder.collect_segment_sources(start_time, end_time).await;
    assert!(result.is_ok());

    let sources = result.unwrap();
    assert_eq!(sources.len(), 1);

    let source = &sources[0];
    // Проверяем корректность расчета времени
    assert!(source.duration > 0.0);
    assert!(source.duration <= 4.0); // Не больше длительности сегмента
  }
}

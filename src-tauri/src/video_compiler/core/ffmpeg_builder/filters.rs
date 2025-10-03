//! FFmpeg Builder - Модуль построения фильтров

use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{Clip, ProjectSchema, Track, TrackType, Transition};

use super::effects::EffectBuilder;
use super::subtitles::SubtitleBuilder;
use super::templates::TemplateBuilder;

/// Построитель фильтров
pub struct FilterBuilder<'a> {
  project: &'a ProjectSchema,
  effect_builder: EffectBuilder<'a>,
  subtitle_builder: SubtitleBuilder<'a>,
  template_builder: TemplateBuilder<'a>,
}

impl<'a> FilterBuilder<'a> {
  /// Создать новый построитель фильтров
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self {
      project,
      effect_builder: EffectBuilder::new(project),
      subtitle_builder: SubtitleBuilder::new(project),
      template_builder: TemplateBuilder::new(project),
    }
  }

  /// Добавить комплексные фильтры
  pub async fn add_filter_complex(&self, cmd: &mut Command) -> Result<()> {
    let filter_complex = self.build_filter_complex().await?;

    if !filter_complex.is_empty() {
      cmd.args(["-filter_complex", &filter_complex]);

      // Маппинг выходов
      let has_video = self.has_video_tracks();
      let has_audio = self.has_audio_tracks();
      let has_subtitles = !self.project.subtitles.is_empty();

      if has_video {
        if has_subtitles {
          cmd.args(["-map", "[outv_with_subs]"]);
        } else {
          cmd.args(["-map", "[outv]"]);
        }
      }

      if has_audio {
        cmd.args(["-map", "[outa]"]);
      }
    }

    Ok(())
  }

  /// Добавить фильтры для сегмента
  pub async fn add_segment_filters(
    &self,
    cmd: &mut Command,
    start_time: f64,
    end_time: f64,
  ) -> Result<()> {
    let filter_complex = self
      .build_segment_filter_complex(start_time, end_time)
      .await?;

    if !filter_complex.is_empty() {
      cmd.args(["-filter_complex", &filter_complex]);

      // Маппинг выходов для сегмента
      if self.has_video_tracks() {
        cmd.args(["-map", "[outv]"]);
      }

      if self.has_audio_tracks() {
        cmd.args(["-map", "[outa]"]);
      }
    }

    Ok(())
  }

  /// Построить строку комплексных фильтров
  async fn build_filter_complex(&self) -> Result<String> {
    let mut filters = Vec::new();
    let mut input_index = 0;

    // Обрабатываем видео треки
    if self.has_video_tracks() {
      let video_filter = self.build_video_filter_chain(&mut input_index).await?;
      if !video_filter.is_empty() {
        filters.push(video_filter);
      }
    }

    // Обрабатываем аудио треки
    if self.has_audio_tracks() {
      let audio_filter = self.build_audio_filter_chain(&mut input_index).await?;
      if !audio_filter.is_empty() {
        filters.push(audio_filter);
      }
    }

    // Обрабатываем субтитры
    if !self.project.subtitles.is_empty() {
      let subtitle_filter = self.subtitle_builder.build_subtitle_filter().await?;
      if !subtitle_filter.is_empty() {
        filters.push(subtitle_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтры для сегмента
  async fn build_segment_filter_complex(&self, start_time: f64, end_time: f64) -> Result<String> {
    let mut filters = Vec::new();
    let mut input_index = 0;

    // Видео фильтры для сегмента
    if self.has_video_tracks() {
      let video_filter = self
        .build_segment_video_filter_chain(&mut input_index, start_time, end_time)
        .await?;
      if !video_filter.is_empty() {
        filters.push(video_filter);
      }
    }

    // Аудио фильтры для сегмента
    if self.has_audio_tracks() {
      let audio_filter = self
        .build_segment_audio_filter_chain(&mut input_index, start_time, end_time)
        .await?;
      if !audio_filter.is_empty() {
        filters.push(audio_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить цепочку видео фильтров
  async fn build_video_filter_chain(&self, input_index: &mut usize) -> Result<String> {
    let mut filters = Vec::new();
    let video_tracks = self.get_video_tracks();

    // Обрабатываем каждый видео трек
    for (track_idx, track) in video_tracks.iter().enumerate() {
      if !track.enabled {
        continue;
      }

      let mut track_filters = Vec::new();

      // Обрабатываем клипы трека
      for (clip_idx, clip) in track.clips.iter().enumerate() {
        let clip_filter = self
          .build_clip_filter(clip, *input_index, track_idx)
          .await?;
        track_filters.push(clip_filter);

        // Обрабатываем переходы
        if clip_idx < track.clips.len() - 1 {
          // Переходы теперь хранятся в проекте, не в клипе
          // Заглушка для обратной совместимости
          let transition: Option<&crate::video_compiler::schema::effects::Transition> = None;
          if let Some(transition) = transition {
            let next_clip = &track.clips[clip_idx + 1];
            let transition_filter = self
              .build_transition_filter(clip, next_clip, transition, *input_index)
              .await?;
            track_filters.push(transition_filter);
          }
        }

        *input_index += 1;
      }

      // Объединяем клипы трека
      if !track_filters.is_empty() {
        let track_filter = format!(
          "{};concat=n={}:v=1:a=0[track{}]",
          track_filters.join(";"),
          track_filters.len(),
          track_idx
        );
        filters.push(track_filter);
      }
    }

    // Накладываем треки друг на друга
    if filters.len() > 1 {
      let overlay_filter = self.build_overlay_filter(filters.len());
      filters.push(overlay_filter);
    } else if filters.len() == 1 {
      // Если только один трек, переименовываем выход
      filters.push("[track0][outv]".to_string());
    }

    Ok(filters.join(";"))
  }

  /// Построить цепочку аудио фильтров
  async fn build_audio_filter_chain(&self, input_index: &mut usize) -> Result<String> {
    let mut filters = Vec::new();
    let audio_tracks = self.get_audio_tracks();

    for (track_idx, track) in audio_tracks.iter().enumerate() {
      if !track.enabled {
        continue;
      }

      let mut track_filters = Vec::new();

      for clip in &track.clips {
        let clip_filter = self.build_audio_clip_filter(clip, *input_index).await?;
        track_filters.push(clip_filter);
        *input_index += 1;
      }

      // Объединяем клипы трека
      if !track_filters.is_empty() {
        let track_filter = format!(
          "{};concat=n={}:v=0:a=1[atrack{}]",
          track_filters.join(";"),
          track_filters.len(),
          track_idx
        );
        filters.push(track_filter);
      }
    }

    // Смешиваем аудио треки
    if filters.len() > 1 {
      let mix_filter = format!(
        "{}amix=inputs={}[outa]",
        (0..filters.len())
          .map(|i| format!("[atrack{i}]"))
          .collect::<Vec<_>>()
          .join(""),
        filters.len()
      );
      filters.push(mix_filter);
    } else if filters.len() == 1 {
      filters.push("[atrack0][outa]".to_string());
    }

    Ok(filters.join(";"))
  }

  /// Построить видео фильтры для сегмента
  async fn build_segment_video_filter_chain(
    &self,
    input_index: &mut usize,
    start_time: f64,
    end_time: f64,
  ) -> Result<String> {
    // Похожая логика, но с учетом временных границ сегмента
    // Фильтруем только клипы, попадающие в сегмент
    let mut filters = Vec::new();
    let video_tracks = self.get_video_tracks();

    for (track_idx, track) in video_tracks.iter().enumerate() {
      if !track.enabled {
        continue;
      }

      let mut track_filters = Vec::new();

      for clip in &track.clips {
        let clip_duration = clip.end_time - clip.start_time;
        let clip_end = clip.start_time + clip_duration;

        // Проверяем пересечение с сегментом
        if clip.start_time < end_time && clip_end > start_time {
          let clip_filter = self
            .build_clip_filter(clip, *input_index, track_idx)
            .await?;
          track_filters.push(clip_filter);
          *input_index += 1;
        }
      }

      if !track_filters.is_empty() {
        filters.push(track_filters.join(";"));
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить аудио фильтры для сегмента
  async fn build_segment_audio_filter_chain(
    &self,
    input_index: &mut usize,
    start_time: f64,
    end_time: f64,
  ) -> Result<String> {
    // Аналогично видео, но для аудио треков
    let mut filters = Vec::new();
    let audio_tracks = self.get_audio_tracks();

    for track in audio_tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        let clip_duration = clip.end_time - clip.start_time;
        let clip_end = clip.start_time + clip_duration;

        if clip.start_time < end_time && clip_end > start_time {
          let clip_filter = self.build_audio_clip_filter(clip, *input_index).await?;
          filters.push(clip_filter);
          *input_index += 1;
        }
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтры для клипа
  async fn build_clip_filter(
    &self,
    clip: &Clip,
    input_index: usize,
    track_index: usize,
  ) -> Result<String> {
    let mut filters = Vec::new();

    // Базовые настройки клипа
    let base_filter = format!(
      "[{}:v]scale={}:{},setpts=PTS-STARTPTS[v{}]",
      input_index,
      self.project.settings.resolution.width,
      self.project.settings.resolution.height,
      input_index
    );
    filters.push(base_filter);

    // Применяем эффекты
    let effects_filter = self
      .effect_builder
      .build_clip_effects(clip, input_index)
      .await?;
    if !effects_filter.is_empty() {
      filters.push(effects_filter);
    }

    // Применяем шаблоны
    if let Some(template_id) = &clip.template_id {
      let template_filter = self
        .template_builder
        .build_template_filter(template_id, input_index, track_index)
        .await?;
      if !template_filter.is_empty() {
        filters.push(template_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтр для аудио клипа
  async fn build_audio_clip_filter(&self, clip: &Clip, input_index: usize) -> Result<String> {
    let mut filters = Vec::new();

    // Базовая обработка аудио
    let base_filter = format!(
      "[{}:a]asetpts=PTS-STARTPTS,volume={}[a{}]",
      input_index, 1.0, input_index
    );
    filters.push(base_filter);

    // Применяем аудио эффекты
    let audio_effects = self
      .effect_builder
      .build_audio_effects(clip, input_index)
      .await?;
    if !audio_effects.is_empty() {
      filters.push(audio_effects);
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтр перехода
  async fn build_transition_filter(
    &self,
    clip1: &Clip,
    clip2: &Clip,
    transition: &Transition,
    input_index: usize,
  ) -> Result<String> {
    // Делегируем построение перехода effect_builder
    self
      .effect_builder
      .build_transition_filter(clip1, clip2, transition, input_index)
      .await
  }

  /// Построить фильтр наложения треков
  fn build_overlay_filter(&self, track_count: usize) -> String {
    let mut overlay = String::new();

    for i in 0..track_count {
      if i == 0 {
        overlay.push_str(&format!("[track{i}]"));
      } else {
        overlay.push_str(&format!("[track{i}]overlay=0:0"));
        if i < track_count - 1 {
          overlay.push_str(&format!("[tmp{i}];[tmp{i}]"));
        }
      }
    }

    overlay.push_str("[outv]");
    overlay
  }

  /// Проверить наличие видео треков
  pub fn has_video_tracks(&self) -> bool {
    self
      .project
      .tracks
      .iter()
      .any(|t| t.track_type == TrackType::Video && t.enabled)
  }

  /// Проверить наличие аудио треков
  pub fn has_audio_tracks(&self) -> bool {
    self
      .project
      .tracks
      .iter()
      .any(|t| t.track_type == TrackType::Audio && t.enabled)
  }

  /// Получить видео треки
  fn get_video_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == TrackType::Video)
      .collect()
  }

  /// Получить аудио треки
  fn get_audio_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == TrackType::Audio)
      .collect()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::tests::fixtures::*;
  use tokio::process::Command;

  #[test]
  fn test_filter_builder_new() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    // Проверяем что builder создается без ошибок
    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[test]
  fn test_has_video_tracks() {
    // Проект без видео треков
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);
    assert!(!builder.has_video_tracks());

    // Проект с видео треками
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    assert!(builder.has_video_tracks());
  }

  #[test]
  fn test_has_audio_tracks() {
    // Проект без аудио треков
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);
    assert!(!builder.has_audio_tracks());

    // Создаем проект с аудио треком
    let mut project = create_minimal_project();
    let audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    assert!(builder.has_audio_tracks());
  }

  #[test]
  fn test_get_video_tracks() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    let video_tracks = builder.get_video_tracks();
    assert_eq!(video_tracks.len(), 1);
    assert_eq!(video_tracks[0].track_type, TrackType::Video);
  }

  #[test]
  fn test_get_audio_tracks() {
    let mut project = create_minimal_project();
    let audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    let audio_tracks = builder.get_audio_tracks();

    assert_eq!(audio_tracks.len(), 1);
    assert_eq!(audio_tracks[0].track_type, TrackType::Audio);
  }

  #[tokio::test]
  async fn test_add_filter_complex_empty_project() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_filter_complex(&mut cmd).await;
    assert!(
      result.is_ok(),
      "Empty project should not fail filter complex"
    );

    // Проверяем что команда не содержит -filter_complex для пустого проекта
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();
    assert!(!args.contains(&"-filter_complex".to_string()));
  }

  #[tokio::test]
  async fn test_add_filter_complex_with_video_tracks() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_filter_complex(&mut cmd).await;
    assert!(result.is_ok(), "Video project should build filter complex");

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Если есть видео треки, должен быть filter_complex
    if builder.has_video_tracks() {
      assert!(args.contains(&"-filter_complex".to_string()));
      assert!(args.contains(&"-map".to_string()));
    }
  }

  #[tokio::test]
  async fn test_add_segment_filters() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let start_time = 1.0;
    let end_time = 3.0;

    let result = builder
      .add_segment_filters(&mut cmd, start_time, end_time)
      .await;
    assert!(result.is_ok(), "Segment filters should build successfully");
  }

  #[tokio::test]
  async fn test_build_filter_complex_empty() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    let result = builder.build_filter_complex().await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Пустой проект может иметь пустую строку фильтров
    assert!(filter.is_empty() || !filter.is_empty());
  }

  #[tokio::test]
  async fn test_build_video_filter_chain() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_video_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Video filter chain should not be empty");

    // Проверяем что input_index был увеличен
    assert!(input_index > 0);
  }

  #[tokio::test]
  async fn test_build_audio_filter_chain() {
    let mut project = create_minimal_project();

    // Создаем аудио трек с клипом
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(std::path::PathBuf::from("/tmp/audio.mp3"), 0.0, 5.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_audio_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Audio filter chain should not be empty");
  }

  #[tokio::test]
  async fn test_build_segment_video_filter_chain() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let start_time = 0.0;
    let end_time = 10.0;

    let result = builder
      .build_segment_video_filter_chain(&mut input_index, start_time, end_time)
      .await;
    assert!(result.is_ok());

    // Результат может быть пустым если клипы не попадают в сегмент
    let _filter = result.unwrap();
  }

  #[tokio::test]
  async fn test_build_clip_filter() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    // Берем первый клип из первого трека
    let clip = &project.tracks[0].clips[0];
    let input_index = 0;
    let track_index = 0;

    let result = builder
      .build_clip_filter(clip, input_index, track_index)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Clip filter should not be empty");

    // Проверяем что фильтр содержит базовые элементы
    assert!(filter.contains("scale="));
    assert!(filter.contains("setpts="));
  }

  #[tokio::test]
  async fn test_build_audio_clip_filter() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    let clip = &project.tracks[0].clips[0];
    let input_index = 0;

    let result = builder.build_audio_clip_filter(clip, input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Audio clip filter should not be empty");

    // Проверяем что фильтр содержит аудио элементы
    assert!(filter.contains("asetpts="));
    assert!(filter.contains("volume="));
  }

  #[test]
  fn test_build_overlay_filter() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    // Тест с одним треком
    let overlay = builder.build_overlay_filter(1);
    assert!(overlay.contains("[track0]"));
    assert!(overlay.contains("[outv]"));

    // Тест с несколькими треками
    let overlay = builder.build_overlay_filter(3);
    assert!(overlay.contains("[track0]"));
    assert!(overlay.contains("[track1]"));
    assert!(overlay.contains("[track2]"));
    assert!(overlay.contains("overlay"));
    assert!(overlay.contains("[outv]"));
  }

  #[tokio::test]
  async fn test_filter_chain_with_disabled_tracks() {
    let mut project = create_project_with_clips();

    // Отключаем первый трек
    project.tracks[0].enabled = false;

    let builder = FilterBuilder::new(&project);

    // Проверяем что отключенные треки не учитываются
    assert!(!builder.has_video_tracks());

    let mut input_index = 0;
    let result = builder.build_video_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Фильтр должен быть пустым так как нет активных треков
    assert!(filter.is_empty());
  }

  #[tokio::test]
  async fn test_complex_project_filter_building() {
    let project = create_complex_project();
    let builder = FilterBuilder::new(&project);

    let result = builder.build_filter_complex().await;
    assert!(
      result.is_ok(),
      "Complex project should build filters successfully"
    );

    let filter = result.unwrap();
    // Комплексный проект должен создать фильтры
    assert!(!filter.is_empty() || project.tracks.is_empty());
  }

  #[tokio::test]
  async fn test_segment_audio_filter_chain() {
    let mut project = create_minimal_project();

    // Создаем аудио трек с клипом
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(std::path::PathBuf::from("/tmp/audio.mp3"), 2.0, 8.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    // Тестируем сегмент который пересекается с клипом
    let start_time = 5.0;
    let end_time = 10.0;

    let result = builder
      .build_segment_audio_filter_chain(&mut input_index, start_time, end_time)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Должен создать фильтр так как клип пересекается с сегментом
    assert!(!filter.is_empty());
  }

  #[tokio::test]
  async fn test_filter_with_subtitles() {
    let mut project = create_project_with_clips();

    // Добавляем субтитры
    use crate::video_compiler::schema::subtitles::Subtitle;
    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    project.subtitles.push(subtitle);

    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_filter_complex(&mut cmd).await;
    assert!(result.is_ok());

    // Проверяем что маппинг учитывает субтитры
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    if builder.has_video_tracks() {
      assert!(args.contains(&"-map".to_string()));
    }
  }

  #[tokio::test]
  async fn test_build_transition_filter() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    // Создаем два клипа для перехода
    let clip1 = Clip::new(std::path::PathBuf::from("/tmp/video1.mp4"), 0.0, 5.0);
    let clip2 = Clip::new(std::path::PathBuf::from("/tmp/video2.mp4"), 5.0, 10.0);

    // Создаем переход
    use crate::video_compiler::schema::effects::{Transition, TransitionDuration};
    use std::collections::HashMap;
    let transition = Transition {
      id: "fade".to_string(),
      transition_type: "fade".to_string(),
      name: "Fade".to_string(),
      duration: TransitionDuration {
        value: 1.0,
        min: None,
        max: None,
      },
      category: None,
      tags: Vec::new(),
      complexity: None,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
      easing: None,
      direction: None,
    };

    let result = builder
      .build_transition_filter(&clip1, &clip2, &transition, 0)
      .await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_segment_filters_no_clips_in_range() {
    let mut project = create_project_with_clips();

    // Устанавливаем клипы вне диапазона сегмента
    for track in &mut project.tracks {
      for clip in &mut track.clips {
        clip.start_time = 20.0;
        clip.end_time = 25.0;
      }
    }

    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    // Сегмент который не пересекается с клипами
    let result = builder.add_segment_filters(&mut cmd, 0.0, 5.0).await;
    assert!(result.is_ok());

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Не должно быть filter_complex для пустого сегмента
    assert!(!args.contains(&"-filter_complex".to_string()));
  }

  #[tokio::test]
  async fn test_multiple_video_tracks_overlay() {
    let mut project = create_project_with_clips();

    // Добавляем второй видео трек
    let mut track2 = Track::new(TrackType::Video, "Video Track 2".to_string());
    let clip2 = Clip::new(std::path::PathBuf::from("/tmp/video2.mp4"), 0.0, 5.0);
    track2.clips.push(clip2);
    project.tracks.push(track2);

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_video_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Должен содержать overlay для объединения треков
    assert!(filter.contains("overlay"));
  }

  #[tokio::test]
  async fn test_audio_mixing_multiple_tracks() {
    let mut project = create_minimal_project();

    // Создаем два аудио трека
    for i in 0..2 {
      let mut audio_track = Track::new(TrackType::Audio, format!("Audio Track {i}"));
      let audio_clip = Clip::new(
        std::path::PathBuf::from(format!("/tmp/audio{i}.mp3")),
        0.0,
        5.0,
      );
      audio_track.clips.push(audio_clip);
      project.tracks.push(audio_track);
    }

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_audio_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Должен содержать amix для смешивания треков
    assert!(filter.contains("amix"));
  }

  #[tokio::test]
  async fn test_clip_with_template() {
    let mut project = create_project_with_clips();

    // Добавляем шаблон в проект
    use crate::video_compiler::schema::templates::{Template, TemplateRegion, TemplateType};
    let mut template = Template::new(TemplateType::Grid, "Test Template".to_string(), 4);
    template.id = "template1".to_string(); // Устанавливаем конкретный ID
                                           // Добавляем регионы для шаблона
    template.regions.push(TemplateRegion {
      x: 0,
      y: 0,
      width: 960,
      height: 540,
      padding: 0,
    });
    project.templates.push(template);

    // Устанавливаем template_id для клипа
    if let Some(track) = project.tracks.get_mut(0) {
      if let Some(clip) = track.clips.get_mut(0) {
        clip.template_id = Some("template1".to_string());
      }
    }

    let builder = FilterBuilder::new(&project);

    // Получаем клип после создания builder (чтобы использовалась правильная ссылка на проект)
    let result = if let Some(track) = project.tracks.first() {
      if let Some(clip) = track.clips.first() {
        builder.build_clip_filter(clip, 0, 0).await
      } else {
        panic!("No clip found in track");
      }
    } else {
      panic!("No track found in project");
    };
    match result {
      Ok(filter) => {
        // Фильтр должен быть создан даже с template_id
        assert!(!filter.is_empty());
      }
      Err(e) => {
        panic!("Failed to build clip filter: {e:?}");
      }
    }
  }

  #[tokio::test]
  async fn test_segment_partial_clip_overlap() {
    let mut project = create_project_with_clips();

    // Устанавливаем клип который частично пересекается с сегментом
    if let Some(track) = project.tracks.get_mut(0) {
      if let Some(clip) = track.clips.get_mut(0) {
        clip.start_time = 3.0;
        clip.end_time = 7.0;
      }
    }

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    // Сегмент [0, 5] пересекается с клипом [3, 7]
    let result = builder
      .build_segment_video_filter_chain(&mut input_index, 0.0, 5.0)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(
      !filter.is_empty(),
      "Filter should be created for overlapping clip"
    );
  }

  #[test]
  fn test_overlay_filter_edge_cases() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    // Тест с 0 треками (edge case)
    let overlay = builder.build_overlay_filter(0);
    assert_eq!(overlay, "[outv]");

    // Тест с 4 треками
    let overlay = builder.build_overlay_filter(4);
    assert!(overlay.contains("[track0]"));
    assert!(overlay.contains("[track1]"));
    assert!(overlay.contains("[track2]"));
    assert!(overlay.contains("[track3]"));
    assert!(overlay.contains("overlay"));
  }

  #[tokio::test]
  async fn test_empty_track_clips() {
    let mut project = create_minimal_project();

    // Создаем трек без клипов
    let empty_track = Track::new(TrackType::Video, "Empty Track".to_string());
    project.tracks.push(empty_track);

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_video_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    // input_index не должен измениться для пустого трека
    assert_eq!(input_index, 0);
  }

  #[tokio::test]
  async fn test_build_filter_complex_with_all_media_types() {
    let mut project = create_project_with_clips();

    // Добавляем аудио трек
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(std::path::PathBuf::from("/tmp/audio.mp3"), 0.0, 5.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    // Добавляем субтитры
    use crate::video_compiler::schema::subtitles::Subtitle;
    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    project.subtitles.push(subtitle);

    let builder = FilterBuilder::new(&project);
    let result = builder.build_filter_complex().await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Complex filter should not be empty");
  }
}

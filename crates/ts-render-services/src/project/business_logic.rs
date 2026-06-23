//! Бизнес-логика для команд управления проектами

use super::types::*;
use std::collections::{HashMap, HashSet};
use ts_render::video_compiler::core::{
  error::{Result, VideoCompilerError},
  schema::{Clip, ClipSource, ProjectSchema, Subtitle, Track},
};

/// Создать результат валидации проекта
pub fn create_validation_result(is_valid: bool, error: Option<String>) -> ProjectValidationResult {
  if is_valid {
    ProjectValidationResult {
      is_valid: true,
      errors: vec![],
      warnings: vec![],
      info: vec!["Project schema is valid".to_string()],
    }
  } else {
    ProjectValidationResult {
      is_valid: false,
      errors: vec![error.unwrap_or_else(|| "Unknown validation error".to_string())],
      warnings: vec![],
      info: vec![],
    }
  }
}

/// Оптимизировать проект - удалить пустые треки и отсортировать клипы
pub fn optimize_project_tracks(project: &mut ProjectSchema) {
  // Удаляем пустые треки
  project.tracks.retain(|track| !track.clips.is_empty());

  // Сортируем клипы по времени начала
  for track in &mut project.tracks {
    track
      .clips
      .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
  }
}

/// Оптимизировать настройки экспорта
pub fn optimize_export_settings(project: &mut ProjectSchema) {
  if project.settings.export.video_bitrate == 0 {
    project.settings.export.video_bitrate = 8000; // По умолчанию 8 Mbps
  }
}

/// Получить статистику анализа проекта
pub fn analyze_project_statistics(project: &ProjectSchema) -> ProjectAnalysisStats {
  let total_duration = project.timeline.duration;
  let track_count = project.tracks.len();
  let total_clips = project.tracks.iter().map(|t| t.clips.len()).sum::<usize>();

  let unique_media_files: HashSet<_> = project
    .tracks
    .iter()
    .flat_map(|t| &t.clips)
    .filter_map(|c| match &c.source {
      ClipSource::File(path) => Some(path.clone()),
      _ => None,
    })
    .collect();

  let effects_count = project
    .tracks
    .iter()
    .flat_map(|t| &t.clips)
    .map(|c| c.effects.len())
    .sum::<usize>();

  let transitions_count = project.transitions.len();

  ProjectAnalysisStats {
    duration: total_duration,
    tracks: track_count,
    clips: total_clips,
    unique_media_files: unique_media_files.len(),
    effects: effects_count,
    transitions: transitions_count,
    subtitles: project.subtitles.len(),
    resolution: ProjectResolution {
      width: project.settings.resolution.width,
      height: project.settings.resolution.height,
    },
    frame_rate: project.settings.frame_rate as u32,
    export_format: format!("{:?}", project.settings.export.format),
  }
}

/// Извлечь пути медиафайлов из проекта
pub fn extract_media_files(project: &ProjectSchema) -> Vec<String> {
  let media_files: HashSet<_> = project
    .tracks
    .iter()
    .flat_map(|t| &t.clips)
    .filter_map(|c| match &c.source {
      ClipSource::File(path) => Some(path.clone()),
      _ => None,
    })
    .collect();

  media_files.into_iter().collect()
}

/// Проверить доступность медиафайлов
pub fn check_media_availability(media_files: Vec<String>) -> MediaAvailabilityMap {
  let mut availability = HashMap::new();

  for file_path in media_files {
    let exists = std::path::Path::new(&file_path).exists();
    availability.insert(file_path, exists);
  }

  availability
}

/// Обновить пути медиафайлов в проекте
pub fn update_media_paths(project: &mut ProjectSchema, path_mapping: &MediaPathMapping) {
  for track in &mut project.tracks {
    for clip in &mut track.clips {
      if let ClipSource::File(path) = &mut clip.source {
        if let Some(new_path) = path_mapping.get(path) {
          *path = new_path.clone();
        }
      }
    }
  }
}

/// Добавить и отсортировать субтитры в проекте
pub fn add_and_sort_subtitles(project: &mut ProjectSchema, subtitles: Vec<Subtitle>) {
  project.subtitles.extend(subtitles);
  project
    .subtitles
    .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
}

/// Форматировать время для SRT
pub fn format_time_srt(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = seconds % 60.0;
  format!("{hours:02}:{minutes:02}:{secs:06.3}").replace('.', ",")
}

/// Форматировать время для VTT
pub fn format_time_vtt(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = seconds % 60.0;
  format!("{hours:02}:{minutes:02}:{secs:06.3}")
}

/// Экспортировать субтитры в указанном формате
pub fn export_subtitles(subtitles: &[Subtitle], format: SubtitleFormat) -> String {
  match format {
    SubtitleFormat::Srt => {
      let mut srt_content = String::new();
      for (i, subtitle) in subtitles.iter().enumerate() {
        srt_content.push_str(&format!(
          "{}\n{} --> {}\n{}\n\n",
          i + 1,
          format_time_srt(subtitle.start_time),
          format_time_srt(subtitle.end_time),
          subtitle.text
        ));
      }
      srt_content
    }
    SubtitleFormat::Vtt => {
      let mut vtt_content = String::from("WEBVTT\n\n");
      for subtitle in subtitles {
        vtt_content.push_str(&format!(
          "{} --> {}\n{}\n\n",
          format_time_vtt(subtitle.start_time),
          format_time_vtt(subtitle.end_time),
          subtitle.text
        ));
      }
      vtt_content
    }
  }
}

/// Создать резервную копию проекта в JSON формате
pub fn create_project_backup(project: &ProjectSchema) -> Result<String> {
  serde_json::to_string_pretty(project)
    .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))
}

/// Объединить два проекта с временным смещением
pub fn merge_projects_with_offset(
  base_project: &mut ProjectSchema,
  append_project: ProjectSchema,
  time_offset: f64,
) {
  // Добавляем треки из второго проекта
  for mut track in append_project.tracks {
    // Смещаем все клипы на time_offset
    for clip in &mut track.clips {
      clip.start_time += time_offset;
    }
    base_project.tracks.push(track);
  }

  // Добавляем субтитры
  for mut subtitle in append_project.subtitles {
    subtitle.start_time += time_offset;
    subtitle.end_time += time_offset;
    base_project.subtitles.push(subtitle);
  }

  // Обновляем общую длительность
  base_project.timeline.duration = base_project
    .timeline
    .duration
    .max(append_project.timeline.duration + time_offset);
}

/// Разделить проект на части по точкам разделения
pub fn split_project_at_points(
  project: &ProjectSchema,
  split_points: &[f64],
) -> Vec<ProjectSchema> {
  let mut projects = Vec::new();
  let mut current_start = 0.0;

  for split_point in split_points.iter().chain(&[project.timeline.duration]) {
    let mut new_project = project.clone();
    new_project.tracks.clear();
    new_project.subtitles.clear();

    // Копируем только клипы в диапазоне
    for track in &project.tracks {
      let mut new_track = track.clone();
      new_track.clips.clear();

      for clip in &track.clips {
        let clip_end = clip.end_time;
        if clip.start_time < *split_point && clip_end > current_start {
          let mut new_clip = clip.clone();

          // Обрезаем клип если нужно
          if clip.start_time < current_start {
            let offset = current_start - clip.start_time;
            new_clip.source_start = clip.source_start + offset;
            new_clip.start_time = 0.0;
            new_clip.end_time = clip.end_time - clip.start_time - offset;
          } else {
            new_clip.start_time -= current_start;
            new_clip.end_time -= current_start;
          }

          if clip_end > *split_point {
            new_clip.end_time = *split_point - current_start;
          }

          new_track.clips.push(new_clip);
        }
      }

      if !new_track.clips.is_empty() {
        new_project.tracks.push(new_track);
      }
    }

    // Копируем субтитры в диапазоне
    for subtitle in &project.subtitles {
      if subtitle.start_time < *split_point && subtitle.end_time > current_start {
        let mut new_subtitle = subtitle.clone();
        new_subtitle.start_time = (subtitle.start_time - current_start).max(0.0);
        new_subtitle.end_time =
          (subtitle.end_time - current_start).min(*split_point - current_start);
        new_project.subtitles.push(new_subtitle);
      }
    }

    new_project.timeline.duration = *split_point - current_start;
    projects.push(new_project);
    current_start = *split_point;
  }

  projects
}

/// Выполнить операцию добавления клипа к треку
pub fn add_clip_to_track(track: &mut Track, clip: Clip) {
  track.add_clip(clip);
}

/// Выполнить операцию удаления клипа из трека
pub fn remove_clip_from_track(track: &mut Track, clip_id: &str) {
  track.remove_clip(clip_id);
}

/// Получить информацию о длительности клипа на таймлайне
pub fn get_clip_timeline_duration(clip: &Clip) -> f64 {
  clip.get_timeline_duration()
}

/// Проверить содержит ли клип указанное время
pub fn check_clip_contains_time(clip: &Clip, time: f64) -> bool {
  clip.contains_time(time)
}

/// Валидировать субтитры и получить результат
pub fn validate_subtitle_and_get_result(subtitle: &Subtitle) -> SubtitleValidationResult {
  match subtitle.validate() {
    Ok(_) => SubtitleValidationResult {
      valid: true,
      duration: subtitle.get_duration(),
      error: None,
    },
    Err(e) => SubtitleValidationResult {
      valid: false,
      duration: subtitle.get_duration(),
      error: Some(e.to_string()),
    },
  }
}

/// Обновить время последнего доступа к проекту
pub fn touch_project(project: &mut ProjectSchema) {
  project.touch();
}

/// Создать информацию о резервной копии
pub fn create_backup_info(
  backup_path: String,
  project_name: String,
  file_size: u64,
) -> ProjectBackupInfo {
  ProjectBackupInfo {
    backup_path,
    created_at: chrono::Utc::now(),
    project_name,
    file_size,
  }
}

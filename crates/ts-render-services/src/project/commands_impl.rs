//! Реализация команд для управления проектами (без Tauri)

use super::types::*;
use crate::VideoCompilerState;
use std::collections::HashMap;
use ts_render::video_compiler::core::{
  error::{Result, VideoCompilerError},
  schema::{Clip, ProjectSchema, Subtitle, Track},
};

use super::business_logic;

/// Валидировать схему проекта
pub async fn validate_project_schema(
  project_schema: ProjectSchema,
  _state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  // Базовая валидация схемы
  match project_schema.validate() {
    Ok(_) => {
      let result = business_logic::create_validation_result(true, None);
      Ok(serde_json::to_value(result)?)
    }
    Err(e) => {
      let result = business_logic::create_validation_result(false, Some(e.to_string()));
      Ok(serde_json::to_value(result)?)
    }
  }
}

/// Оптимизировать схему проекта
pub async fn optimize_project_schema(
  mut project_schema: ProjectSchema,
  _state: &VideoCompilerState,
) -> Result<ProjectSchema> {
  business_logic::optimize_project_tracks(&mut project_schema);
  business_logic::optimize_export_settings(&mut project_schema);
  Ok(project_schema)
}

/// Анализировать проект и получить статистику
pub async fn analyze_project(
  project_schema: ProjectSchema,
  _state: &VideoCompilerState,
) -> Result<serde_json::Value> {
  let stats = business_logic::analyze_project_statistics(&project_schema);
  Ok(serde_json::to_value(stats)?)
}

/// Получить список медиафайлов в проекте
pub async fn get_project_media_files(project_schema: ProjectSchema) -> Result<Vec<String>> {
  let media_files = business_logic::extract_media_files(&project_schema);
  Ok(media_files)
}

/// Проверить доступность медиафайлов проекта
pub async fn check_project_media_availability(
  project_schema: ProjectSchema,
) -> Result<HashMap<String, bool>> {
  let media_files = business_logic::extract_media_files(&project_schema);
  let availability = business_logic::check_media_availability(media_files);
  Ok(availability)
}

/// Обновить пути медиафайлов в проекте
pub async fn update_project_media_paths(
  mut project_schema: ProjectSchema,
  path_mapping: HashMap<String, String>,
) -> Result<ProjectSchema> {
  business_logic::update_media_paths(&mut project_schema, &path_mapping);
  Ok(project_schema)
}

/// Добавить субтитры в проект
pub async fn add_subtitles_to_project(
  mut project_schema: ProjectSchema,
  subtitles: Vec<Subtitle>,
) -> Result<ProjectSchema> {
  business_logic::add_and_sort_subtitles(&mut project_schema, subtitles);
  Ok(project_schema)
}

/// Извлечь субтитры из проекта
pub async fn extract_project_subtitles(
  project_schema: ProjectSchema,
  format: String,
) -> Result<String> {
  let subtitle_format = SubtitleFormat::from_string(&format).ok_or_else(|| {
    VideoCompilerError::InvalidParameter(format!("Unsupported subtitle format: {format}"))
  })?;

  let subtitles_content =
    business_logic::export_subtitles(&project_schema.subtitles, subtitle_format);
  Ok(subtitles_content)
}

/// Создать резервную копию проекта
pub async fn backup_project(project_schema: ProjectSchema, backup_path: String) -> Result<String> {
  let json = business_logic::create_project_backup(&project_schema)?;

  std::fs::write(&backup_path, json).map_err(|e| VideoCompilerError::Io(e.to_string()))?;

  Ok(backup_path)
}

/// Объединить два проекта
pub async fn merge_projects(
  mut base_project: ProjectSchema,
  append_project: ProjectSchema,
  time_offset: f64,
) -> Result<ProjectSchema> {
  business_logic::merge_projects_with_offset(&mut base_project, append_project, time_offset);
  Ok(base_project)
}

/// Разделить проект на части
pub async fn split_project(
  project_schema: ProjectSchema,
  split_points: Vec<f64>,
) -> Result<Vec<ProjectSchema>> {
  let projects = business_logic::split_project_at_points(&project_schema, &split_points);
  Ok(projects)
}

/// Операции с треками
pub async fn track_operations(
  mut track: Track,
  operation: String,
  params: serde_json::Value,
) -> Result<Track> {
  match operation.as_str() {
    "add_clip" => {
      if let Ok(clip) = serde_json::from_value::<Clip>(params) {
        business_logic::add_clip_to_track(&mut track, clip);
      }
    }
    "remove_clip" => {
      if let Some(clip_id) = params.get("clip_id").and_then(|v| v.as_str()) {
        business_logic::remove_clip_from_track(&mut track, clip_id);
      }
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown operation: {operation}"
      )));
    }
  }

  Ok(track)
}

/// Информация о клипе
pub async fn get_clip_info(clip: Clip, info_type: String) -> Result<serde_json::Value> {
  let clip_info_type = ClipInfoType::from_string(&info_type).ok_or_else(|| {
    VideoCompilerError::InvalidParameter(format!("Unknown info type: {info_type}"))
  })?;

  match clip_info_type {
    ClipInfoType::TimelineDuration => {
      let duration = business_logic::get_clip_timeline_duration(&clip);
      Ok(serde_json::json!({
          "duration": duration
      }))
    }
    ClipInfoType::ContainsTime => {
      // Получаем время из параметров (нужно было бы передать как отдельный параметр)
      let time = 0.0; // Временное значение
      let contains = business_logic::check_clip_contains_time(&clip, time);
      Ok(serde_json::json!({
          "contains": contains
      }))
    }
  }
}

/// Валидация субтитров
pub async fn validate_subtitle(subtitle: Subtitle) -> Result<serde_json::Value> {
  let result = business_logic::validate_subtitle_and_get_result(&subtitle);
  Ok(serde_json::to_value(result)?)
}

/// Обновить время доступа к проекту в схеме
pub async fn touch_project_schema(mut project: ProjectSchema) -> Result<ProjectSchema> {
  business_logic::touch_project(&mut project);
  Ok(project)
}

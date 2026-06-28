//! Tauri команды для управления проектами

use std::collections::HashMap;
use tauri::State;
use ts_render::video_compiler::core::{
  error::Result,
  schema::{Clip, ProjectSchema, Subtitle, Track},
};
use ts_render_services::VideoCompilerState;
use ts_render_services::project::commands_impl as impl_;

/// Валидировать схему проекта
#[tauri::command]
pub async fn validate_project_schema(
  project_schema: ProjectSchema,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::validate_project_schema(project_schema, &state).await
}

/// Оптимизировать схему проекта
#[tauri::command]
pub async fn optimize_project_schema(
  project_schema: ProjectSchema,
  state: State<'_, VideoCompilerState>,
) -> Result<ProjectSchema> {
  impl_::optimize_project_schema(project_schema, &state).await
}

/// Анализировать проект и получить статистику
#[tauri::command]
pub async fn analyze_project(
  project_schema: ProjectSchema,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::analyze_project(project_schema, &state).await
}

/// Получить список медиафайлов в проекте
#[tauri::command]
pub async fn get_project_media_files(project_schema: ProjectSchema) -> Result<Vec<String>> {
  impl_::get_project_media_files(project_schema).await
}

/// Проверить доступность медиафайлов проекта
#[tauri::command]
pub async fn check_project_media_availability(
  project_schema: ProjectSchema,
) -> Result<HashMap<String, bool>> {
  impl_::check_project_media_availability(project_schema).await
}

/// Обновить пути медиафайлов в проекте
#[tauri::command]
pub async fn update_project_media_paths(
  project_schema: ProjectSchema,
  path_mapping: HashMap<String, String>,
) -> Result<ProjectSchema> {
  impl_::update_project_media_paths(project_schema, path_mapping).await
}

/// Добавить субтитры в проект
#[tauri::command]
pub async fn add_subtitles_to_project(
  project_schema: ProjectSchema,
  subtitles: Vec<Subtitle>,
) -> Result<ProjectSchema> {
  impl_::add_subtitles_to_project(project_schema, subtitles).await
}

/// Извлечь субтитры из проекта
#[tauri::command]
pub async fn extract_project_subtitles(
  project_schema: ProjectSchema,
  format: String,
) -> Result<String> {
  impl_::extract_project_subtitles(project_schema, format).await
}

/// Создать резервную копию проекта
#[tauri::command]
pub async fn backup_project(project_schema: ProjectSchema, backup_path: String) -> Result<String> {
  impl_::backup_project(project_schema, backup_path).await
}

/// Объединить два проекта
#[tauri::command]
pub async fn merge_projects(
  base_project: ProjectSchema,
  append_project: ProjectSchema,
  time_offset: f64,
) -> Result<ProjectSchema> {
  impl_::merge_projects(base_project, append_project, time_offset).await
}

/// Разделить проект на части
#[tauri::command]
pub async fn split_project(
  project_schema: ProjectSchema,
  split_points: Vec<f64>,
) -> Result<Vec<ProjectSchema>> {
  impl_::split_project(project_schema, split_points).await
}

/// Операции с треками
#[tauri::command]
pub async fn track_operations(
  track: Track,
  operation: String,
  params: serde_json::Value,
) -> Result<Track> {
  impl_::track_operations(track, operation, params).await
}

/// Информация о клипе
#[tauri::command]
pub async fn get_clip_info(clip: Clip, info_type: String) -> Result<serde_json::Value> {
  impl_::get_clip_info(clip, info_type).await
}

/// Валидация субтитров
#[tauri::command]
pub async fn validate_subtitle(subtitle: Subtitle) -> Result<serde_json::Value> {
  impl_::validate_subtitle(subtitle).await
}

/// Обновить время доступа к проекту в схеме
#[tauri::command]
pub async fn touch_project_schema(project: ProjectSchema) -> Result<ProjectSchema> {
  impl_::touch_project_schema(project).await
}

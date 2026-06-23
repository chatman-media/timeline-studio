//! Tauri команды для работы со схемой

use ts_render::video_compiler::{
  error::Result,
  schema::{timeline::Clip, Effect, Filter, StyleTemplate, Subtitle, Template},
};
use ts_render_services::schema::commands_impl as impl_;
use ts_render_services::schema::types::*;
use std::collections::HashMap;

/// Добавить клип в трек
#[tauri::command]
pub async fn add_clip_to_track(
  track_id: String,
  clip: Clip,
  project_schema: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::add_clip_to_track(track_id, clip, project_schema).await
}

/// Создать клип
#[tauri::command]
pub async fn create_clip(source_path: String, start_time: f64, end_time: f64) -> Result<Clip> {
  impl_::create_clip(source_path, start_time, end_time).await
}

/// Создать клип с параметрами
#[tauri::command]
pub async fn create_clip_with_params(params: ClipCreationParams) -> Result<Clip> {
  impl_::create_clip_with_params(params).await
}

/// Создать эффект
#[tauri::command]
pub async fn create_effect(
  effect_type: String,
  parameters: HashMap<String, serde_json::Value>,
) -> Result<Effect> {
  impl_::create_effect(effect_type, parameters).await
}

/// Создать эффект с параметрами
#[tauri::command]
pub async fn create_effect_with_params(params: EffectCreationParams) -> Result<Effect> {
  impl_::create_effect_with_params(params).await
}

/// Создать фильтр
#[tauri::command]
pub async fn create_filter(
  filter_type: String,
  parameters: HashMap<String, serde_json::Value>,
) -> Result<Filter> {
  impl_::create_filter(filter_type, parameters).await
}

/// Создать фильтр с параметрами
#[tauri::command]
pub async fn create_filter_with_params(params: FilterCreationParams) -> Result<Filter> {
  impl_::create_filter_with_params(params).await
}

/// Создать стилевой шаблон
#[tauri::command]
pub async fn create_style_template(
  name: String,
  category: String,
  properties: HashMap<String, serde_json::Value>,
) -> Result<StyleTemplate> {
  impl_::create_style_template(name, category, properties).await
}

/// Создать стилевой шаблон с параметрами
#[tauri::command]
pub async fn create_style_template_with_params(
  params: StyleTemplateCreationParams,
) -> Result<StyleTemplate> {
  impl_::create_style_template_with_params(params).await
}

/// Создать субтитр
#[tauri::command]
pub async fn create_subtitle(
  text: String,
  start_time: f64,
  end_time: f64,
  style: Option<HashMap<String, serde_json::Value>>,
) -> Result<Subtitle> {
  impl_::create_subtitle(text, start_time, end_time, style).await
}

/// Создать субтитр с параметрами
#[tauri::command]
pub async fn create_subtitle_with_params(params: SubtitleCreationParams) -> Result<Subtitle> {
  impl_::create_subtitle_with_params(params).await
}

/// Создать анимацию субтитров
#[tauri::command]
pub async fn create_subtitle_animation(
  subtitle_id: String,
  animation_type: String,
  duration: f64,
  project: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::create_subtitle_animation(subtitle_id, animation_type, duration, project).await
}

/// Создать анимацию субтитров с параметрами
#[tauri::command]
pub async fn create_subtitle_animation_with_params(
  params: SubtitleAnimationParams,
) -> Result<ts_render::video_compiler::schema::subtitles::SubtitleAnimation> {
  impl_::create_subtitle_animation_with_params(params).await
}

/// Создать новую анимацию субтитров (использование SubtitleAnimation::new)
#[tauri::command]
pub async fn create_subtitle_animation_new(
  animation_type: String,
  duration: f64,
  delay: Option<f64>,
  easing: Option<String>,
) -> Result<ts_render::video_compiler::schema::subtitles::SubtitleAnimation> {
  impl_::create_subtitle_animation_new(animation_type, duration, delay, easing).await
}

/// Создать новый стилевой шаблон (использование StyleTemplate::new)
#[tauri::command]
pub async fn create_style_template_new(
  name: String,
  category: String,
  style: Option<String>,
  duration: Option<f64>,
) -> Result<ts_render::video_compiler::schema::templates::StyleTemplate> {
  impl_::create_style_template_new(name, category, style, duration).await
}

/// Создать шаблон
#[tauri::command]
pub async fn create_template(
  name: String,
  layout_type: String,
  properties: HashMap<String, serde_json::Value>,
) -> Result<Template> {
  impl_::create_template(name, layout_type, properties).await
}

/// Создать шаблон с параметрами
#[tauri::command]
pub async fn create_template_with_params(params: TemplateCreationParams) -> Result<Template> {
  impl_::create_template_with_params(params).await
}

/// Создать трек
#[tauri::command]
pub async fn create_track(
  name: String,
  track_type: String,
  project: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::create_track(name, track_type, project).await
}

/// Создать трек с параметрами
#[tauri::command]
pub async fn create_track_with_params(
  params: TrackCreationParams,
  project: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::create_track_with_params(params, project).await
}

/// Создать объекты схемы (множественное создание)
#[tauri::command]
pub async fn create_schema_objects(
  object_type: String,
  count: usize,
  base_properties: HashMap<String, serde_json::Value>,
) -> Result<Vec<serde_json::Value>> {
  impl_::create_schema_objects(object_type, count, base_properties).await
}

/// Создать разрешение с заданными параметрами (использование Resolution::new)
#[tauri::command]
pub async fn create_resolution(
  width: u32,
  height: u32,
) -> Result<ts_render::video_compiler::schema::common::Resolution> {
  impl_::create_resolution(width, height).await
}

/// Получить стандартное HD разрешение (использование Resolution::hd)
#[tauri::command]
pub async fn get_hd_resolution() -> Result<ts_render::video_compiler::schema::common::Resolution> {
  impl_::get_hd_resolution().await
}

/// Получить стандартное 4K разрешение (использование Resolution::uhd_4k)
#[tauri::command]
pub async fn get_uhd_4k_resolution() -> Result<ts_render::video_compiler::schema::common::Resolution> {
  impl_::get_uhd_4k_resolution().await
}

/// Получить список предустановленных разрешений
#[tauri::command]
pub async fn get_preset_resolutions() -> Result<Vec<serde_json::Value>> {
  impl_::get_preset_resolutions().await
}

/// Создать разрешение для определенного формата
#[tauri::command]
pub async fn create_resolution_for_format(
  format: String,
) -> Result<ts_render::video_compiler::schema::common::Resolution> {
  impl_::create_resolution_for_format(format).await
}

/// Получить статистику элементов схемы
#[tauri::command]
pub async fn get_schema_element_stats(
  project: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<SchemaElementStats> {
  impl_::get_schema_element_stats(project).await
}

/// Валидировать схему проекта (структуру элементов)
#[tauri::command]
pub async fn validate_schema_structure(
  project: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<SchemaValidationInfo> {
  impl_::validate_schema_structure(project).await
}

/// Добавить эффект к клипу
#[tauri::command]
pub async fn add_effect_to_clip(
  clip_id: String,
  effect_id: String,
  project_schema: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::add_effect_to_clip(clip_id, effect_id, project_schema).await
}

/// Добавить фильтр к клипу
#[tauri::command]
pub async fn add_filter_to_clip(
  clip_id: String,
  filter_id: String,
  project_schema: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::add_filter_to_clip(clip_id, filter_id, project_schema).await
}

/// Удалить эффект из клипа
#[tauri::command]
pub async fn remove_effect_from_clip(
  clip_id: String,
  effect_id: String,
  project_schema: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::remove_effect_from_clip(clip_id, effect_id, project_schema).await
}

/// Удалить фильтр из клипа
#[tauri::command]
pub async fn remove_filter_from_clip(
  clip_id: String,
  filter_id: String,
  project_schema: ts_render::video_compiler::schema::ProjectSchema,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::remove_filter_from_clip(clip_id, filter_id, project_schema).await
}

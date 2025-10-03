//! Thin команды для настроек компилятора

use super::business_logic;
use super::types::*;
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use tauri::State;

/// Получить настройки компилятора
#[tauri::command]
pub async fn get_compiler_settings_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  Ok(business_logic::create_default_settings())
}

/// Обновить настройки компилятора
#[tauri::command]
pub async fn update_compiler_settings_advanced(
  settings: CompilerSettings,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::validate_compiler_settings(&settings)?;
  log::info!("Updating compiler settings: {settings:?}");
  Ok(true)
}

/// Установить путь к FFmpeg
#[tauri::command]
pub async fn set_ffmpeg_path_advanced(
  path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::validate_ffmpeg_path(&path)?;
  log::info!("Setting FFmpeg path to: {path}");
  Ok(true)
}

/// Установить количество параллельных задач
#[tauri::command]
pub async fn set_parallel_jobs_advanced(
  jobs: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::validate_parallel_jobs(jobs)?;
  log::info!("Setting parallel jobs to: {jobs}");
  Ok(true)
}

/// Установить лимит памяти
#[tauri::command]
pub async fn set_memory_limit_advanced(
  limit_mb: usize,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::validate_memory_limit(limit_mb)?;
  log::info!("Setting memory limit to: {limit_mb} MB");
  Ok(true)
}

/// Установить временную директорию
#[tauri::command]
pub async fn set_temp_directory_advanced(
  directory: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::validate_temp_directory(&directory)?;
  log::info!("Setting temp directory to: {directory}");
  Ok(true)
}

/// Установить уровень логирования
#[tauri::command]
pub async fn set_log_level_advanced(
  level: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::validate_log_level(&level)?;
  log::info!("Setting log level to: {level}");
  Ok(true)
}

/// Сбросить настройки компилятора к значениям по умолчанию
#[tauri::command]
pub async fn reset_compiler_settings_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  log::info!("Resetting compiler settings to defaults");
  Ok(business_logic::create_default_settings())
}

/// Получить рекомендуемые настройки
#[tauri::command]
pub async fn get_recommended_settings_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<RecommendedSettings> {
  Ok(business_logic::create_recommended_settings())
}

/// Экспортировать настройки
#[tauri::command]
pub async fn export_settings_advanced(_state: State<'_, VideoCompilerState>) -> Result<String> {
  let settings = business_logic::create_default_settings();
  business_logic::export_settings_to_json(&settings)
}

/// Импортировать настройки
#[tauri::command]
pub async fn import_settings_advanced(
  settings_json: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  business_logic::import_settings_from_json(&settings_json)
}

/// Получить пресеты качества
#[tauri::command]
pub async fn get_quality_presets_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<QualityPreset>> {
  Ok(business_logic::create_quality_presets())
}

//! Tauri команды для дополнительных операций

#![allow(clippy::explicit_auto_deref)]

use ts_render_services::VideoCompilerState;
use ts_render::video_compiler::error::Result;
use tauri::State;
use ts_render_services::misc::commands_impl as impl_;

/// Кэшировать метаданные медиафайла
#[tauri::command]
pub async fn cache_media_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::cache_media_metadata(file_path, &state).await
}

/// Проверить возможности FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::check_ffmpeg_capabilities(&state).await
}

/// Проверить доступность GPU кодировщика
#[tauri::command]
pub async fn check_gpu_encoder_availability(
  encoder: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  impl_::check_gpu_encoder_availability(encoder, &state).await
}

/// Проверить поддержку аппаратного ускорения (альтернативная версия)
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  impl_::check_hardware_acceleration(&state).await
}

/// Очистить кэш (общая функция)
#[tauri::command]
pub async fn cleanup_cache(
  _max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  impl_::cleanup_cache(_max_age_days, &state).await
}

/// Очистить кэш (упрощенная версия)
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  impl_::clear_cache(&state).await
}

/// Очистить кэш превью файлов
#[tauri::command]
pub async fn clear_file_preview_cache(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::clear_file_preview_cache(_file_path, &state).await
}

/// Настроить кэш
#[tauri::command]
pub async fn configure_cache(
  config: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  impl_::configure_cache(config, &state).await
}

/// Создать новый проект
#[tauri::command]
pub async fn create_new_project(
  name: String,
  resolution: (u32, u32),
  fps: u32,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::create_new_project(name, resolution, fps).await
}

/// Получить использование памяти кэшем
#[tauri::command]
pub async fn get_cache_memory_usage(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_cache_memory_usage(&state).await
}

/// Получить кэшированные метаданные
#[tauri::command]
pub async fn get_cached_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  impl_::get_cached_metadata(file_path, &state).await
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<ts_render::video_compiler::gpu::GpuInfo>> {
  impl_::get_current_gpu_info(&state).await
}

/// Получить информацию о GPU (альтернативная версия)
#[tauri::command]
pub async fn get_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ts_render::video_compiler::gpu::GpuInfo>> {
  crate::gpu::detect_gpus(state).await
}

/// Получить рекомендуемый GPU кодировщик
#[tauri::command]
pub async fn get_recommended_gpu_encoder(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<String>> {
  impl_::get_recommended_gpu_encoder(&state).await
}

/// Получить информацию о кэше рендеринга
#[tauri::command]
pub async fn get_render_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_render_cache_info(&state).await
}

/// Получить информацию о видео
#[tauri::command]
pub async fn get_video_info(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_video_info(file_path, &state).await
}

/// Инициализировать безопасное хранилище
#[tauri::command]
pub async fn init_secure_storage_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::SecureStorageInitResult> {
  impl_::init_secure_storage_advanced(&_state).await
}

/// Создать новый экземпляр безопасного хранилища
#[tauri::command]
pub async fn create_secure_storage_instance(
  params: ts_render_services::misc::business_logic::CreateSecureStorageParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::CreateSecureStorageResult> {
  impl_::create_secure_storage_instance(params, &_state).await
}

/// Получить информацию о текущем безопасном хранилище
#[tauri::command]
pub async fn get_secure_storage_info_advanced(
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::SecureStorageInfo> {
  impl_::get_secure_storage_info_advanced(&_state).await
}

/// Проверить состояние безопасного хранилища
#[tauri::command]
pub async fn verify_secure_storage_integrity(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::verify_secure_storage_integrity(&_state).await
}

/// Экспортировать конфигурацию безопасного хранилища
#[tauri::command]
pub async fn export_secure_storage_config(
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::export_secure_storage_config(&_state).await
}

/// Очистить безопасное хранилище
#[tauri::command]
pub async fn clear_secure_storage(
  confirm: bool,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::clear_secure_storage(confirm, &_state).await
}

/// Выполнить простую FFmpeg команду
#[tauri::command]
pub async fn execute_ffmpeg_simple_command(
  params: ts_render_services::misc::business_logic::FFmpegExecuteParams,
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::FFmpegExecuteResult> {
  impl_::execute_ffmpeg_simple_command(params, &state).await
}

/// Выполнить FFmpeg команду с отслеживанием прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_advanced(
  params: ts_render_services::misc::business_logic::FFmpegProgressParams,
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::FFmpegProgressResult> {
  impl_::execute_ffmpeg_with_progress_advanced(params, &state).await
}

/// Получить список доступных кодеков FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_available_codecs(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::get_ffmpeg_available_codecs(&state).await
}

/// Получить список доступных форматов FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_available_formats(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  impl_::get_ffmpeg_available_formats(&state).await
}

/// Сгенерировать превью субтитров
#[tauri::command]
pub async fn generate_subtitle_preview_advanced(
  params: ts_render_services::misc::business_logic::SubtitlePreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::SubtitlePreviewResult> {
  impl_::generate_subtitle_preview_advanced(params, &state).await
}

/// Получить информацию об исполнении FFmpeg
#[tauri::command]
pub async fn get_ffmpeg_execution_information(
  state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::FFmpegExecutionInfo> {
  impl_::get_ffmpeg_execution_information(&state).await
}

/// Сгенерировать превью субтитров FFmpeg
#[tauri::command]
pub async fn generate_subtitle_preview_ffmpeg(
  params: ts_render_services::misc::business_logic::SubtitlePreviewAdvancedParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::generate_subtitle_preview_ffmpeg(params, &state).await
}

/// Выполнить FFmpeg с обработчиком прогресса
#[tauri::command]
pub async fn execute_ffmpeg_with_progress_handler(
  params: ts_render_services::misc::business_logic::FFmpegWithProgressParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  impl_::execute_ffmpeg_with_progress_handler(params, &state).await
}

/// Протестировать аппаратное ускорение
#[tauri::command]
pub async fn test_hardware_acceleration_available(
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::HardwareAccelerationTestResult> {
  impl_::test_hardware_acceleration_available(&_state).await
}

/// Выполнить операции с треком
#[tauri::command]
pub async fn perform_track_operations(
  params: ts_render_services::misc::business_logic::TrackOperationsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::TrackOperationsResult> {
  impl_::perform_track_operations(params, &_state).await
}

/// Получить информацию о клипе
#[tauri::command]
pub async fn get_detailed_clip_info(
  params: ts_render_services::misc::business_logic::ClipInfoParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::get_detailed_clip_info(params, &_state).await
}

/// Валидировать субтитр (версия из project.rs)
#[tauri::command]
pub async fn validate_subtitle_project(
  subtitle: ts_render::video_compiler::schema::Subtitle,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  impl_::validate_subtitle_project(subtitle, &_state).await
}

/// Обновить timestamp проекта
#[tauri::command]
pub async fn touch_project_timestamp(
  project: ts_render::video_compiler::schema::ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render::video_compiler::schema::ProjectSchema> {
  impl_::touch_project_timestamp(project, &_state).await
}

/// Получить метаданные из кэша
#[tauri::command]
pub async fn get_cache_metadata(
  params: ts_render_services::misc::business_logic::CacheMetadataParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::CacheMetadataResult> {
  impl_::get_cache_metadata(params, &_state).await
}

/// Получить статистику кэша
#[tauri::command]
pub async fn get_cache_hit_ratio_stats(
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::CacheStatsResult> {
  impl_::get_cache_hit_ratio_stats(&_state).await
}

/// Очистить кэш (расширенная версия)
#[tauri::command]
pub async fn clear_cache_advanced(
  params: ts_render_services::misc::business_logic::CacheClearParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<ts_render_services::misc::business_logic::CacheClearResult> {
  impl_::clear_cache_advanced(params, &_state).await
}

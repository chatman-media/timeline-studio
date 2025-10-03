//! Rendering - Тонкие команды для рендеринга видео
//!
//! Tauri команды, которые делегируют бизнес-логику соответствующим функциям.

use tauri::{Emitter, State};

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::VideoCompilerEvent;

use super::super::state::{RenderJob, VideoCompilerState};
use super::business_logic;
use super::types::*;

/// Запуск компиляции видео
#[tauri::command]
pub async fn compile_video<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  project_schema: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем путь вывода
  business_logic::validate_output_path(&output_path)?;

  // Используем RenderService из контейнера сервисов
  let render_service = state.services.get_render_service().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::validation("RenderService не найден")
  })?;

  // Запускаем рендеринг через сервис
  let job_id = render_service
    .start_render(project_schema, std::path::PathBuf::from(output_path))
    .await?;

  // Отправляем событие о начале рендеринга
  let _ = app.emit(
    "video-compiler",
    &VideoCompilerEvent::RenderStarted {
      job_id: job_id.clone(),
    },
  );

  Ok(job_id)
}

/// Отмена задачи рендеринга
#[tauri::command]
pub async fn cancel_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<bool> {
  business_logic::validate_job_id(&job_id)?;

  let render_service = state.services.get_render_service().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::validation("RenderService не найден")
  })?;

  render_service.cancel_render(&job_id).await
}

/// Получить статус активных задач рендеринга
#[tauri::command]
pub async fn get_active_render_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let render_service = state.services.get_render_service().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::validation("RenderService не найден")
  })?;

  let job_ids = render_service.get_active_jobs().await?;
  Ok(job_ids)
}

/// Получить информацию о конкретной задаче рендеринга
#[tauri::command]
pub async fn get_render_job(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<RenderJob>> {
  business_logic::validate_job_id(&job_id)?;

  let jobs = state.active_jobs.read().await;

  if let Some(active_job) = jobs.get(&job_id) {
    let progress = active_job.renderer.get_progress().await;
    let status = if progress.is_some() {
      crate::video_compiler::progress::RenderStatus::Processing
    } else {
      crate::video_compiler::progress::RenderStatus::Queued
    };

    Ok(Some(RenderJob {
      id: job_id,
      project_name: active_job.metadata.project_name.clone(),
      output_path: active_job.metadata.output_path.clone(),
      status,
      created_at: active_job.metadata.created_at.clone(),
      progress,
      error_message: None,
    }))
  } else {
    Ok(None)
  }
}

/// Приостановить рендеринг
#[tauri::command]
pub async fn pause_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  business_logic::validate_job_id(&job_id)?;

  let jobs = state.active_jobs.read().await;

  if let Some(_active_job) = jobs.get(&job_id) {
    // VideoRenderer не поддерживает паузу, используем заглушку
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Render job '{job_id}' not found"
      )),
    )
  }
}

/// Возобновить рендеринг
#[tauri::command]
pub async fn resume_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  business_logic::validate_job_id(&job_id)?;

  let jobs = state.active_jobs.read().await;

  if let Some(_active_job) = jobs.get(&job_id) {
    // VideoRenderer не поддерживает возобновление, используем заглушку
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InternalError(format!(
        "Render job '{job_id}' not found"
      )),
    )
  }
}

/// Экспортировать проект с предустановленными настройками
#[tauri::command]
pub async fn export_with_preset<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  project_schema: ProjectSchema,
  output_path: String,
  preset: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let schema = business_logic::apply_export_preset(project_schema, &preset)?;
  compile_video(app, schema, output_path, state).await
}

/// Получить список доступных предустановок экспорта
#[tauri::command]
pub async fn get_available_export_presets() -> Result<Vec<String>> {
  Ok(business_logic::get_available_presets())
}

/// Получить информацию о предустановке экспорта
#[tauri::command]
pub async fn get_export_preset(preset_name: String) -> Result<Option<ExportPreset>> {
  Ok(business_logic::get_export_preset(&preset_name))
}

/// Получить статистику рендеринга для активной задачи
#[tauri::command]
pub async fn get_render_pipeline_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<RenderStatistics> {
  business_logic::validate_job_id(&job_id)?;

  let active_jobs = state.active_jobs.read().await;
  let job = active_jobs.get(&job_id).ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
      "Render job {job_id} not found"
    ))
  })?;

  let stats = job.renderer.get_render_statistics().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InternalError(
      "No pipeline statistics available".to_string(),
    )
  })?;

  Ok(business_logic::create_render_statistics(
    super::types::RenderStatisticsParams {
      job_id,
      frames_processed: stats.frames_processed,
      memory_used: stats.memory_used,
      error_count: stats.error_count,
      warning_count: stats.warning_count,
      validation_time_secs: stats
        .validation_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      preprocessing_time_secs: stats
        .preprocessing_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      composition_time_secs: stats
        .composition_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      encoding_time_secs: stats
        .encoding_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      finalization_time_secs: stats
        .finalization_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
    },
  ))
}

/// Построить команду рендеринга с кастомными настройками FFmpeg
#[tauri::command]
pub async fn build_render_command_with_settings(
  project_schema: ProjectSchema,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  business_logic::validate_output_path(&output_path)?;

  let custom_settings = business_logic::parse_custom_render_settings(&settings);
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  let builder_settings = crate::video_compiler::ffmpeg_builder::builder::FFmpegBuilderSettings {
    ffmpeg_path: ffmpeg_path.clone(),
    use_hardware_acceleration: custom_settings.use_hardware_acceleration,
    hardware_acceleration_type: custom_settings.hardware_acceleration_type,
    global_options: custom_settings.global_options,
  };

  let builder = crate::video_compiler::ffmpeg_builder::FFmpegBuilder::with_settings(
    project_schema,
    builder_settings,
  );

  let command = builder
    .build_render_command(std::path::Path::new(&output_path))
    .await?;

  Ok(business_logic::command_to_string_array(&command))
}

/// Извлечь кадры для клипа
#[tauri::command]
pub async fn extract_frames_for_clip(
  _clip_id: String,
  _timestamps: Vec<f64>,
  state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  use crate::video_compiler::core::frame_extraction::FrameExtractionManager;
  use crate::video_compiler::schema::Clip;
  use std::path::PathBuf;

  // Создаем тестовый клип
  let clip = Clip::new(PathBuf::from("/tmp/test_video.mp4"), 0.0, 10.0);

  // Получаем менеджер извлечения кадров
  let extraction_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Извлекаем кадры
  let frames = extraction_manager
    .extract_frames_for_clip(&clip, None)
    .await?;

  Ok(business_logic::create_frame_extraction_cache_info(
    !frames.is_empty(),
  ))
}

/// Извлечь кадры для субтитров
#[tauri::command]
pub async fn extract_frames_for_subtitles(
  subtitle_timestamps: Vec<f64>,
  video_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  use crate::video_compiler::core::frame_extraction::FrameExtractionManager;
  use crate::video_compiler::schema::Subtitle;

  // Создаем тестовые субтитры
  let subtitles: Vec<Subtitle> = subtitle_timestamps
    .iter()
    .enumerate()
    .map(|(i, &timestamp)| Subtitle::new(format!("Subtitle {i}"), timestamp, timestamp + 2.0))
    .collect();

  // Получаем менеджер извлечения кадров
  let extraction_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Извлекаем кадры
  let frames = extraction_manager
    .extract_frames_for_subtitles(std::path::Path::new(&video_path), &subtitles, None)
    .await?;

  Ok(business_logic::create_frame_extraction_cache_info(
    !frames.is_empty(),
  ))
}

/// Построить команду превью с использованием FFmpeg Builder
#[tauri::command]
pub async fn build_preview_command(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  business_logic::validate_output_path(&output_path)?;

  let builder = crate::video_compiler::ffmpeg_builder::FFmpegBuilder::new(project_schema.clone());
  let input_path = business_logic::get_first_input_path(&project_schema);

  let command = builder
    .build_preview_command(
      &input_path,
      timestamp,
      std::path::Path::new(&output_path),
      (1920, 1080),
    )
    .await?;

  Ok(business_logic::command_to_string_array(&command))
}

/// Получить настройки FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_settings(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderInfo> {
  let builder = crate::video_compiler::ffmpeg_builder::FFmpegBuilder::new(project_schema);
  let settings = builder.settings();

  Ok(business_logic::create_ffmpeg_builder_info(
    settings.ffmpeg_path.clone(),
    settings.use_hardware_acceleration,
    settings.hardware_acceleration_type.clone(),
    settings.global_options.clone(),
  ))
}

/// Получить информацию о проекте из FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_project_info(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegProjectInfo> {
  let builder = crate::video_compiler::ffmpeg_builder::FFmpegBuilder::new(project_schema.clone());
  Ok(business_logic::create_project_info(builder.project()))
}

/// Построить команду рендеринга для сегмента видео
#[tauri::command]
pub async fn build_segment_render_command(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  business_logic::validate_output_path(&output_path)?;

  let validation = business_logic::validate_segment_timestamps(
    start_time,
    end_time,
    project_schema.timeline.duration,
  );

  if !validation.is_valid {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        validation
          .warnings
          .unwrap_or_else(|| "Invalid segment timestamps".to_string()),
      ),
    );
  }

  use crate::video_compiler::ffmpeg_builder::{
    filters::FilterBuilder, inputs::InputBuilder, outputs::OutputBuilder, FFmpegBuilder,
  };
  use tokio::process::Command;

  let settings = crate::video_compiler::ffmpeg_builder::builder::FFmpegBuilderSettings {
    ffmpeg_path: state.ffmpeg_path.read().await.clone(),
    use_hardware_acceleration: state.settings.read().await.hardware_acceleration,
    hardware_acceleration_type: None,
    global_options: vec![],
  };

  let builder = FFmpegBuilder::with_settings(project_schema.clone(), settings);
  let mut command = Command::new(state.ffmpeg_path.read().await.clone());

  // Добавляем входные файлы
  let input_builder = InputBuilder::new(&project_schema);
  input_builder.add_input_sources(&mut command).await?;

  // Добавляем фильтры для сегмента
  let filter_builder = FilterBuilder::new(&project_schema);
  filter_builder
    .add_segment_filters(&mut command, start_time, end_time)
    .await?;

  // Добавляем выходные настройки
  let output_builder = OutputBuilder::new(&project_schema, builder.settings());
  output_builder
    .add_output_settings(&mut command, std::path::Path::new(&output_path))
    .await?;

  Ok(business_logic::command_to_string_array(&command))
}

/// Получить информацию о фильтрах для сегмента
#[tauri::command]
pub async fn get_segment_filters_info(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  _state: State<'_, VideoCompilerState>,
) -> Result<SegmentFiltersInfo> {
  let filter_builder =
    crate::video_compiler::ffmpeg_builder::filters::FilterBuilder::new(&project_schema);

  Ok(business_logic::create_segment_filters_info(
    start_time,
    end_time,
    filter_builder.has_video_tracks(),
    filter_builder.has_audio_tracks(),
  ))
}

/// Проверить корректность временных меток сегмента
#[tauri::command]
pub async fn validate_segment_timestamps(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  _state: State<'_, VideoCompilerState>,
) -> Result<SegmentValidation> {
  Ok(business_logic::validate_segment_timestamps(
    start_time,
    end_time,
    project_schema.timeline.duration,
  ))
}

/// Получить кэш менеджера извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache(
  state: State<'_, VideoCompilerState>,
) -> Result<FrameExtractionCacheInfo> {
  use crate::video_compiler::core::frame_extraction::FrameExtractionManager;

  // Создаем менеджер извлечения кадров
  let extraction_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Используем метод get_cache
  let _cache = extraction_manager.get_cache();

  Ok(business_logic::create_frame_extraction_cache_info(true))
}

/// Получить индекс входа для клипа
#[tauri::command]
pub async fn get_clip_input_index(
  project_schema: ProjectSchema,
  clip_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<ClipInputIndexInfo> {
  let input_builder =
    crate::video_compiler::ffmpeg_builder::inputs::InputBuilder::new(&project_schema);
  let input_index = input_builder.get_clip_input_index(&clip_id);

  Ok(business_logic::create_clip_input_index_info(
    clip_id,
    input_index,
  ))
}

/// Получить статистику использования памяти при рендеринге
#[tauri::command]
pub async fn get_render_memory_usage(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  business_logic::validate_job_id(&job_id)?;

  let active_jobs = state.active_jobs.read().await;
  let job = active_jobs.get(&job_id).ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
      "Render job {job_id} not found"
    ))
  })?;

  let stats = job.renderer.get_render_statistics().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InternalError(
      "No statistics available".to_string(),
    )
  })?;

  Ok(business_logic::format_memory_size(stats.memory_used))
}

/// Получить общее время обработки для задачи рендеринга
#[tauri::command]
pub async fn get_render_total_processing_time(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  business_logic::validate_job_id(&job_id)?;

  let active_jobs = state.active_jobs.read().await;
  let job = active_jobs.get(&job_id).ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
      "Render job {job_id} not found"
    ))
  })?;

  let stats = job.renderer.get_render_statistics().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::InternalError(
      "No statistics available".to_string(),
    )
  })?;

  let render_stats =
    business_logic::create_render_statistics(super::types::RenderStatisticsParams {
      job_id,
      frames_processed: stats.frames_processed,
      memory_used: stats.memory_used,
      error_count: stats.error_count,
      warning_count: stats.warning_count,
      validation_time_secs: stats
        .validation_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      preprocessing_time_secs: stats
        .preprocessing_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      composition_time_secs: stats
        .composition_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      encoding_time_secs: stats
        .encoding_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      finalization_time_secs: stats
        .finalization_time
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
    });

  Ok(business_logic::calculate_total_processing_time(
    &render_stats,
  ))
}

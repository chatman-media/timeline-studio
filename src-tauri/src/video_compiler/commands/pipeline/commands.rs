//! Tauri команды для работы с конвейером рендеринга

use super::business_logic;
use super::types::*;
use crate::video_compiler::core::pipeline_refactored::{PipelineBuilder, RenderPipeline};
use crate::video_compiler::error::Result;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::VideoCompilerState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Создать и выполнить конвейер рендеринга
#[tauri::command]
pub async fn create_and_execute_pipeline(
  project: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем путь вывода
  business_logic::validate_output_path(&output_path)?;

  let output = PathBuf::from(&output_path);

  // Создаем трекер прогресса
  let (sender, _receiver) = tokio::sync::mpsc::unbounded_channel();
  let progress_tracker = Arc::new(crate::video_compiler::progress::ProgressTracker::new(
    sender,
  ));

  // Создаем конвейер
  let pipeline = RenderPipeline::new(
    project,
    progress_tracker,
    state.settings.clone(),
    output.clone(),
  )
  .await?;

  // Генерируем ID задачи
  let job_id = business_logic::generate_job_id();

  // Сохраняем конвейер в состоянии
  {
    let mut pipelines = state.active_pipelines.write().await;
    pipelines.insert(job_id.clone(), Arc::new(RwLock::new(pipeline)));
  }

  // Запускаем выполнение в отдельной задаче
  let pipelines = state.active_pipelines.clone();
  let job_id_clone = job_id.clone();

  tokio::spawn(async move {
    if let Some(pipeline_arc) = pipelines.read().await.get(&job_id_clone) {
      let mut pipeline = pipeline_arc.write().await;
      let _ = pipeline.execute(&job_id_clone).await;
    }
  });

  Ok(job_id)
}

/// Получить информацию о конвейере
#[tauri::command]
pub async fn get_pipeline_info(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<PipelineInfo> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;

    let stages = pipeline.get_stage_names();
    let is_running = pipeline.is_running();
    let progress = pipeline.get_progress().await;
    let statistics = serde_json::to_value(pipeline.get_statistics())?;

    Ok(PipelineInfo {
      stages,
      is_running,
      progress,
      statistics,
    })
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Отменить выполнение конвейера
#[tauri::command]
pub async fn cancel_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;
    pipeline.cancel().await?;
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить статистику конвейера
#[tauri::command]
pub async fn get_pipeline_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    let stats = pipeline.get_statistics();
    Ok(serde_json::to_value(stats)?)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить контекст конвейера
#[tauri::command]
pub async fn get_pipeline_context(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    let context = pipeline.get_context();

    // Создаем упрощенную версию контекста для сериализации
    let context_data = serde_json::json!({
        "project_name": context.project.metadata.name,
        "output_path": context.output_path,
        "temp_dir": context.temp_dir,
        "intermediate_files": context.intermediate_files,
        "user_data": context.user_data,
        "is_cancelled": context.is_cancelled()
    });

    Ok(context_data)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Обновить настройки конвейера
#[tauri::command]
pub async fn update_pipeline_settings(
  job_id: String,
  new_settings: crate::video_compiler::CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;
    pipeline.update_settings(new_settings).await?;
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Валидировать конфигурацию конвейера
#[tauri::command]
pub async fn validate_pipeline_configuration(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    pipeline.validate_configuration().await?;
    Ok(true)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить активные конвейеры
#[tauri::command]
pub async fn get_active_pipelines(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let pipelines = state.active_pipelines.read().await;
  Ok(pipelines.keys().cloned().collect())
}

// TODO: Реализовать методы pause/resume в RenderPipeline
// /// Приостановить выполнение конвейера
// #[tauri::command]
// pub async fn pause_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
//   let pipelines = state.active_pipelines.read().await;

//   if let Some(pipeline_arc) = pipelines.get(&job_id) {
//     let mut pipeline = pipeline_arc.write().await;
//     pipeline.pause().await?;
//     Ok(())
//   } else {
//     Err(
//       crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
//         "Pipeline not found: {}",
//         job_id
//       )),
//     )
//   }
// }

// /// Возобновить выполнение конвейера
// #[tauri::command]
// pub async fn resume_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
//   let pipelines = state.active_pipelines.read().await;

//   if let Some(pipeline_arc) = pipelines.get(&job_id) {
//     let mut pipeline = pipeline_arc.write().await;
//     pipeline.resume().await?;
//     Ok(())
//   } else {
//     Err(
//       crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
//         "Pipeline not found: {}",
//         job_id
//       )),
//     )
//   }
// }

/// Очистить завершенные конвейеры
#[tauri::command]
pub async fn cleanup_finished_pipelines(state: State<'_, VideoCompilerState>) -> Result<usize> {
  let mut pipelines = state.active_pipelines.write().await;
  let initial_count = pipelines.len();

  // Собираем ID завершенных конвейеров
  let finished_ids: Vec<String> = {
    let mut ids = Vec::new();
    for (id, pipeline_arc) in pipelines.iter() {
      let pipeline = pipeline_arc.read().await;
      if !pipeline.is_running() {
        ids.push(id.clone());
      }
    }
    ids
  };

  // Удаляем завершенные конвейеры
  for id in &finished_ids {
    pipelines.remove(id);
  }

  let removed_count = initial_count - pipelines.len();
  log::info!("Cleaned up {} finished pipelines", removed_count);

  Ok(removed_count)
}

/// Добавить кастомный этап в конвейер
#[tauri::command]
pub async fn insert_pipeline_stage(
  job_id: String,
  stage_name: String,
  index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;

    // Создаем кастомный этап на основе имени
    match stage_name.as_str() {
      "validation" => {
        pipeline.insert_stage(
          index,
          Box::new(crate::video_compiler::core::stages::ValidationStage::new()),
        );
      }
      "preprocessing" => {
        pipeline.insert_stage(
          index,
          Box::new(crate::video_compiler::core::stages::PreprocessingStage::new()),
        );
      }
      _ => {
        return Err(
          crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
            "Unknown stage type: {}",
            stage_name
          )),
        );
      }
    }

    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Удалить этап из конвейера
#[tauri::command]
pub async fn remove_pipeline_stage(
  job_id: String,
  stage_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;
    Ok(pipeline.remove_stage(&stage_name))
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Создать конвейер с помощью Builder
#[tauri::command]
pub async fn build_custom_pipeline(
  project: ProjectSchema,
  output_path: String,
  skip_defaults: bool,
  custom_stages: Vec<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Валидируем путь вывода
  business_logic::validate_output_path(&output_path)?;

  let output = PathBuf::from(&output_path);

  // Создаем трекер прогресса
  let (sender, _receiver) = tokio::sync::mpsc::unbounded_channel();
  let progress_tracker = Arc::new(crate::video_compiler::progress::ProgressTracker::new(
    sender,
  ));

  // Используем PipelineBuilder
  let mut builder = PipelineBuilder::new()
    .with_project(project)
    .with_output_path(output);

  if skip_defaults {
    builder = builder.skip_default_stages();
  }

  // Добавляем кастомные этапы
  for stage_name in custom_stages {
    match stage_name.as_str() {
      "validation" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::ValidationStage::new(),
        ));
      }
      "preprocessing" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::PreprocessingStage::new(),
        ));
      }
      "composition" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::CompositionStage::new(),
        ));
      }
      "encoding" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::EncodingStage::new(),
        ));
      }
      "finalization" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::FinalizationStage::new(),
        ));
      }
      _ => {
        log::warn!("Unknown stage type: {}", stage_name);
      }
    }
  }

  // Строим конвейер
  let pipeline = builder
    .build(progress_tracker, state.settings.clone())
    .await?;

  // Генерируем ID задачи
  let job_id = business_logic::generate_job_id();

  // Сохраняем конвейер
  {
    let mut pipelines = state.active_pipelines.write().await;
    pipelines.insert(job_id.clone(), Arc::new(RwLock::new(pipeline)));
  }

  Ok(job_id)
}

/// Получить сводку выполнения конвейера
#[tauri::command]
pub async fn get_pipeline_execution_summary(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    let summary = pipeline.create_execution_summary();
    Ok(serde_json::to_value(summary)?)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить прогресс конвейера
#[tauri::command]
pub async fn get_pipeline_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    Ok(pipeline.get_progress().await)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Очистить завершенные конвейеры (старое имя для совместимости)
#[tauri::command]
pub async fn cleanup_completed_pipelines(state: State<'_, VideoCompilerState>) -> Result<usize> {
  cleanup_finished_pipelines(state).await
}

// Additional Pipeline Commands

/// Получить изменяемый контекст пайплайна
#[tauri::command]
pub async fn get_pipeline_context_mutable(
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::PipelineContextInfo> {
  business_logic::get_pipeline_context_mutable(state).await
}

/// Установить пользовательские данные в контекст пайплайна
#[tauri::command]
pub async fn set_pipeline_user_data(
  params: business_logic::SetUserDataParams,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::set_pipeline_user_data(params, state).await
}

/// Получить пользовательские данные из контекста пайплайна
#[tauri::command]
pub async fn get_pipeline_user_data(
  key: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  business_logic::get_pipeline_user_data(key, state).await
}

/// Проверить, следует ли использовать аппаратное ускорение для кодека
#[tauri::command]
pub async fn should_use_hardware_acceleration_for_codec(
  codec: String,
  state: State<'_, VideoCompilerState>,
) -> Result<business_logic::HardwareAccelerationInfo> {
  business_logic::should_use_hardware_acceleration_for_codec(codec, state).await
}

/// Проверить, нужно ли использовать аппаратное ускорение для кодека (альтернативное имя)
#[tauri::command]
pub async fn check_should_use_hardware_acceleration_for_codec(
  codec: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::check_should_use_hardware_acceleration_for_codec(codec, state).await
}

/// Установить пользовательские данные в контекст пайплайна (прямое использование)
#[tauri::command]
pub async fn set_pipeline_user_data_direct(
  key: String,
  value: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  business_logic::set_pipeline_user_data_direct(key, value, state).await
}

/// Получить пользовательские данные из контекста пайплайна (прямое использование)
#[tauri::command]
pub async fn get_pipeline_user_data_direct(
  key: String,
  default_value: Option<serde_json::Value>,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  business_logic::get_pipeline_user_data_direct(key, default_value, state).await
}

/// Сгенерировать шумовой клип (расширенная версия)
#[tauri::command]
pub async fn generate_noise_clip_advanced(
  duration: f64,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::generate_noise_clip_advanced(duration, width, height, state).await
}

/// Сгенерировать градиентный клип (расширенная версия)
#[tauri::command]
pub async fn generate_gradient_clip_advanced(
  duration: f64,
  width: u32,
  height: u32,
  start_color: String,
  end_color: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::generate_gradient_clip_advanced(
    duration,
    width,
    height,
    start_color,
    end_color,
    state,
  )
  .await
}

/// Сгенерировать шумовой клип напрямую
#[tauri::command]
pub async fn generate_noise_clip_direct(
  duration: f64,
  output_filename: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::generate_noise_clip_direct(duration, output_filename, state).await
}

/// Сгенерировать градиентный клип напрямую
#[tauri::command]
pub async fn generate_gradient_clip_direct(
  start_color: Option<String>,
  duration: f64,
  output_filename: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  business_logic::generate_gradient_clip_direct(start_color, duration, output_filename, state).await
}

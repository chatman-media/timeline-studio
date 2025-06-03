// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};

// Модуль для работы с языком
mod language;
use language::{get_app_language, set_app_language};

// Модуль для работы с медиафайлами
mod media;
use media::{get_media_files, get_media_metadata};

// Модуль для работы с файловой системой
mod filesystem;

// Модуль Video Compiler
mod video_compiler;
use video_compiler::{
  initialize, PreviewGenerator, ProjectSchema, RenderJob, RenderProgress, VideoCompilerState,
};

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {}", epoch_ms)
}

// Video Compiler Commands

#[tauri::command]
async fn compile_video(project_schema: ProjectSchema) -> Result<String, String> {
  log::info!("Начало компиляции видео: {}", project_schema.metadata.name);

  // Валидация схемы проекта
  if let Err(e) = project_schema.validate() {
    log::error!("Ошибка валидации проекта: {}", e);
    return Err(format!("Ошибка валидации: {}", e));
  }

  // Пока возвращаем заглушку - в следующих шагах реализуем полную функциональность
  let job_id = uuid::Uuid::new_v4().to_string();
  log::info!("Создана задача компиляции: {}", job_id);

  Ok(job_id)
}

#[tauri::command]
async fn get_render_progress(
  job_id: String,
  state: tauri::State<'_, VideoCompilerState>,
) -> Result<Option<RenderProgress>, String> {
  if let Some(job) = state.active_jobs.get(&job_id) {
    Ok(Some(job.get_progress()))
  } else {
    Ok(None)
  }
}

#[tauri::command]
async fn generate_preview(
  file_path: String,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: tauri::State<'_, VideoCompilerState>,
) -> Result<Vec<u8>, String> {
  use std::path::Path;

  let path = Path::new(&file_path);
  if !path.exists() {
    return Err("Файл не найден".to_string());
  }

  // Создаем генератор превью
  let preview_generator = PreviewGenerator::new(state.cache.clone());

  match preview_generator
    .generate_preview(path, timestamp, resolution, quality)
    .await
  {
    Ok(image_data) => {
      log::debug!("Превью сгенерировано для {} at {}s", file_path, timestamp);
      Ok(image_data)
    }
    Err(e) => {
      log::error!("Ошибка генерации превью: {}", e);
      Err(e.to_string())
    }
  }
}

#[tauri::command]
async fn cancel_render(
  job_id: String,
  state: tauri::State<'_, VideoCompilerState>,
) -> Result<bool, String> {
  if state.active_jobs.remove(&job_id).is_some() {
    log::info!("Задача {} отменена", job_id);
    Ok(true)
  } else {
    log::warn!("Задача {} не найдена для отмены", job_id);
    Ok(false)
  }
}

#[tauri::command]
async fn get_active_jobs(
  state: tauri::State<'_, VideoCompilerState>,
) -> Result<Vec<RenderJob>, String> {
  Ok(
    state
      .active_jobs
      .iter()
      .map(|entry| entry.value().clone())
      .collect(),
  )
}

#[tauri::command]
async fn get_video_info(
  file_path: String,
  state: tauri::State<'_, VideoCompilerState>,
) -> Result<video_compiler::preview::VideoInfo, String> {
  use std::path::Path;

  let path = Path::new(&file_path);
  let preview_generator = PreviewGenerator::new(state.cache.clone());

  match preview_generator.get_video_info(path).await {
    Ok(info) => Ok(info),
    Err(e) => {
      log::error!("Ошибка получения информации о видео: {}", e);
      Err(e.to_string())
    }
  }
}

#[tauri::command]
async fn clear_preview_cache(state: tauri::State<'_, VideoCompilerState>) -> Result<(), String> {
  let mut cache = state.cache.write().await;
  cache.clear_previews().await;
  log::info!("Кэш превью очищен");
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Инициализация Video Compiler state
  let runtime = tokio::runtime::Runtime::new().unwrap();
  let video_compiler_state = runtime.block_on(async {
    match initialize().await {
      Ok(state) => {
        log::info!("Video Compiler успешно инициализирован");
        state
      }
      Err(e) => {
        log::error!("Ошибка инициализации Video Compiler: {}", e);
        // Возвращаем состояние по умолчанию, если FFmpeg недоступен
        VideoCompilerState::default()
      }
    }
  });

  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_websocket::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .manage(video_compiler_state)
    .invoke_handler(tauri::generate_handler![
      greet,
      get_app_language,
      set_app_language,
      get_media_metadata,
      get_media_files,
      filesystem::file_exists,
      filesystem::get_file_stats,
      filesystem::get_platform,
      filesystem::search_files_by_name,
      filesystem::get_absolute_path,
      // Video Compiler commands
      compile_video,
      get_render_progress,
      generate_preview,
      cancel_render,
      get_active_jobs,
      get_video_info,
      clear_preview_cache
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

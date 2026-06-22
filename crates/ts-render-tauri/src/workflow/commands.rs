//! Tauri команды для автоматизированных рабочих процессов видеомонтажа

use super::business_logic;

/// Создать временную директорию для workflow
#[tauri::command]
pub async fn create_directory(path: String) -> Result<bool, String> {
  business_logic::create_directory_logic(&path)
}

/// Создать проект timeline из данных workflow
#[tauri::command]
pub async fn create_timeline_project(
  project_data: String,
  output_path: String,
) -> Result<String, String> {
  business_logic::create_timeline_project_logic(&project_data, &output_path)
}

/// Компилировать видео из проекта timeline для workflow
#[tauri::command]
pub async fn compile_workflow_video(
  project_file: String,
  output_path: String,
  settings: String, // JSON с настройками рендеринга
) -> Result<serde_json::Value, String> {
  business_logic::compile_workflow_video_logic(&project_file, &output_path, &settings)
}

/// Анализ качества видео для workflow
#[tauri::command]
pub async fn analyze_workflow_video_quality(
  video_path: String,
  analysis_type: String,
) -> Result<serde_json::Value, String> {
  business_logic::analyze_workflow_video_quality_logic(&video_path, &analysis_type)
}

/// Создать превью для workflow результата
#[tauri::command]
pub async fn create_workflow_preview(
  video_path: String,
  output_path: String,
  timestamp: Option<f64>,
) -> Result<serde_json::Value, String> {
  business_logic::create_workflow_preview_logic(&video_path, &output_path, timestamp)
}

/// Очистить временные файлы workflow
#[tauri::command]
pub async fn cleanup_workflow_temp_files(temp_directory: String) -> Result<bool, String> {
  business_logic::cleanup_workflow_temp_files_logic(&temp_directory)
}

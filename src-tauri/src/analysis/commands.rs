// Tauri commands для системы анализа

use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

use crate::analysis::database::AnalysisDatabase;
use crate::analysis::models::*;
use crate::analysis::services::{AnalysisEngine, ProjectManager};
use crate::recognition::commands::yolo_commands::YoloProcessorState;
use crate::recognition::person_database::PersonDatabase;

/// Состояние приложения для анализа
pub struct AnalysisState {
  pub analysis_db: Arc<AnalysisDatabase>,
  pub project_manager: Arc<ProjectManager>,
  pub analysis_engine: Arc<AnalysisEngine>,
}

impl AnalysisState {
  pub async fn new(
    db_path: &str,
    person_db: Arc<PersonDatabase>,
    yolo_state: Arc<tokio::sync::RwLock<YoloProcessorState>>,
  ) -> Result<Self, String> {
    let analysis_db = Arc::new(
      AnalysisDatabase::new(db_path, person_db.clone())
        .await
        .map_err(|e| format!("Failed to create analysis database: {}", e))?,
    );

    let project_manager = Arc::new(ProjectManager::new(analysis_db.clone()));

    let analysis_engine = Arc::new(AnalysisEngine::new(
      analysis_db.clone(),
      person_db,
      project_manager.clone(),
      yolo_state,
    ));

    Ok(Self {
      analysis_db,
      project_manager,
      analysis_engine,
    })
  }
}

/// Создание нового проекта анализа
#[tauri::command]
pub async fn create_analysis_project(
  name: String,
  description: Option<String>,
  config: AnalysisConfig,
  files: Vec<String>,
  state: State<'_, AnalysisState>,
) -> Result<String, String> {
  log::info!(
    "Creating analysis project '{}' with {} files",
    name,
    files.len()
  );

  let project = state
    .project_manager
    .create_project(name, description, config, files)
    .await
    .map_err(|e| format!("Failed to create project: {}", e))?;

  Ok(project.id.to_string())
}

/// Получение информации о проекте
#[tauri::command]
pub async fn get_analysis_project(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<Option<AnalysisProject>, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .get_project(&uuid)
    .await
    .map_err(|e| format!("Failed to get project: {}", e))
}

/// Получение прогресса анализа проекта
#[tauri::command]
pub async fn get_analysis_project_progress(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<Option<AnalysisProgress>, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .get_progress(&uuid)
    .await
    .map_err(|e| format!("Failed to get progress: {}", e))
}

/// Обновление прогресса анализа
#[tauri::command]
pub async fn update_analysis_progress(
  project_id: String,
  stage: AnalysisStage,
  progress: f32,
  current_file: Option<String>,
  state: State<'_, AnalysisState>,
) -> Result<(), String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .update_progress(&uuid, stage, progress, current_file)
    .await
    .map_err(|e| format!("Failed to update progress: {}", e))
}

/// Получение файлов проекта анализа
#[tauri::command]
pub async fn get_analysis_project_media_files(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<Vec<AnalysisMediaFile>, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .get_project_files(&uuid)
    .await
    .map_err(|e| format!("Failed to get project files: {}", e))
}

/// Получение сцен проекта
#[tauri::command]
pub async fn get_project_scenes(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<Vec<AnalysisScene>, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .get_project_scenes(&uuid)
    .await
    .map_err(|e| format!("Failed to get project scenes: {}", e))
}

/// Получение ключевых моментов проекта
#[tauri::command]
pub async fn get_project_key_moments(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<Vec<KeyMoment>, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .get_project_key_moments(&uuid)
    .await
    .map_err(|e| format!("Failed to get key moments: {}", e))
}

/// Получение статистики проекта
#[tauri::command]
pub async fn get_project_statistics(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<ProjectStatistics, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .get_project_statistics(&uuid)
    .await
    .map_err(|e| format!("Failed to get project statistics: {}", e))
}

/// Поиск в данных проекта
#[tauri::command]
pub async fn search_project_data(
  project_id: String,
  query: String,
  result_types: Option<Vec<SearchResultType>>,
  state: State<'_, AnalysisState>,
) -> Result<Vec<AnalysisSearchResult>, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .search_project_data(&uuid, &query, result_types)
    .await
    .map_err(|e| format!("Failed to search project data: {}", e))
}

/// Создание сцены в проекте
#[tauri::command]
pub async fn create_analysis_scene(
  scene: AnalysisScene,
  state: State<'_, AnalysisState>,
) -> Result<AnalysisScene, String> {
  state
    .analysis_db
    .create_scene(scene)
    .await
    .map_err(|e| format!("Failed to create scene: {}", e))
}

/// Создание ключевого момента
#[tauri::command]
pub async fn create_key_moment(
  moment: KeyMoment,
  state: State<'_, AnalysisState>,
) -> Result<KeyMoment, String> {
  state
    .analysis_db
    .create_key_moment(moment)
    .await
    .map_err(|e| format!("Failed to create key moment: {}", e))
}

/// Создание связи персоны с проектом
#[tauri::command]
pub async fn create_project_person_association(
  association: ProjectPersonAssociation,
  state: State<'_, AnalysisState>,
) -> Result<(), String> {
  state
    .analysis_db
    .create_project_person_association(association)
    .await
    .map_err(|e| format!("Failed to create person association: {}", e))
}

/// Получение персон проекта с статистикой
#[tauri::command]
pub async fn get_project_persons_with_stats(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<
  Vec<(
    crate::recognition::types_professional::PersonProfile,
    ProjectPersonAssociation,
  )>,
  String,
> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .analysis_db
    .get_project_persons_with_stats(&uuid)
    .await
    .map_err(|e| format!("Failed to get project persons: {}", e))
}

/// Создание плана монтажа
#[tauri::command]
pub async fn create_montage_plan(
  plan: MontagePlan,
  state: State<'_, AnalysisState>,
) -> Result<MontagePlan, String> {
  state
    .analysis_db
    .create_montage_plan(plan)
    .await
    .map_err(|e| format!("Failed to create montage plan: {}", e))
}

/// Завершение анализа проекта
#[tauri::command]
pub async fn complete_analysis_project(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<(), String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .complete_project(&uuid)
    .await
    .map_err(|e| format!("Failed to complete project: {}", e))
}

/// Отмена анализа проекта
#[tauri::command]
pub async fn cancel_analysis_project(
  project_id: String,
  error_message: Option<String>,
  state: State<'_, AnalysisState>,
) -> Result<(), String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  state
    .project_manager
    .cancel_project(&uuid, error_message)
    .await
    .map_err(|e| format!("Failed to cancel project: {}", e))
}

/// Получение всех активных проектов
#[tauri::command]
pub async fn get_active_analysis_projects(
  state: State<'_, AnalysisState>,
) -> Result<Vec<AnalysisProgress>, String> {
  state
    .project_manager
    .get_active_projects()
    .await
    .map_err(|e| format!("Failed to get active projects: {}", e))
}

/// Запуск анализа проекта
#[tauri::command]
pub async fn start_project_analysis(
  project_id: String,
  state: State<'_, AnalysisState>,
) -> Result<String, String> {
  let uuid = Uuid::parse_str(&project_id).map_err(|e| format!("Invalid project ID: {}", e))?;

  log::info!("Starting analysis for project: {}", project_id);

  // Запускаем анализ в фоновом режиме
  let analysis_engine = state.analysis_engine.clone();
  tokio::spawn(async move {
    match analysis_engine.analyze_project(&uuid).await {
      Ok(results) => {
        log::info!(
          "Analysis completed successfully: {} scenes, {} moments",
          results.total_scenes,
          results.total_moments
        );
      }
      Err(e) => {
        log::error!("Analysis failed: {}", e);
      }
    }
  });

  Ok("Analysis started successfully".to_string())
}

/// Получение конфигурации анализа по умолчанию
#[tauri::command]
pub async fn get_default_analysis_config() -> Result<AnalysisConfig, String> {
  Ok(AnalysisConfig {
    enable_scene_detection: true,
    enable_person_recognition: true,
    enable_object_detection: true,
    enable_emotion_analysis: true,
    enable_audio_analysis: true,
    enable_quality_analysis: true,
    enable_text_recognition: false,
    quality_mode: QualityMode::Balanced,
    frame_skip: 30,        // Каждый 30-й кадр для скорости
    resolution_scale: 0.5, // Уменьшаем разрешение для анализа
    scene_change_threshold: 0.3,
    face_confidence_threshold: 0.7,
    object_confidence_threshold: 0.5,
    motion_detection_threshold: 0.1,
    max_processing_time: Some(3600),                // 1 час максимум
    max_memory_usage: Some(2 * 1024 * 1024 * 1024), // 2GB
    use_gpu: true,
    generate_thumbnails: true,
    generate_previews: true,
    save_keyframes: true,
    include_raw_data: false,
  })
}

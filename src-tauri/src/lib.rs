// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#![allow(clippy::uninlined_format_args)]

use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;
use tokio::sync::RwLock;

// Core infrastructure modules
pub mod core;
use core::telemetry::{TelemetryConfig, TelemetryManager};

// Command registry module
mod command_registry;
pub use command_registry::CommandRegistry;

// Specta TypeScript bindings
pub mod specta_export;

// App builder module
mod app_builder;

// Модуль для работы с языком
mod language_tauri;
use language_tauri::LanguageState;

// Модуль для работы с медиафайлами
mod media;
use media::preview_manager::PreviewDataManager;
use media::{MediaProcessor, ThumbnailOptions};

// Модуль для работы с файловой системой и управления директориями
mod filesystem;

// Модуль для работы с голосовыми записями
mod voice_recording;

// Модуль Video Compiler
pub mod video_compiler;
use video_compiler::VideoCompilerState;

// Модуль генерации прокси
mod proxy_generator;

// Модуль нативного меню приложения
mod menu;

// Модуль распознавания (YOLO)
pub mod recognition;
use recognition::commands::yolo_commands::YoloProcessorState;

// MCP (Model Context Protocol) интеграция
pub mod mcp;
use mcp::commands::MCPServerState;
use recognition::person_database::PersonDatabase;
use recognition::recognition_service::RecognitionState;
use recognition::RecognitionService;

// Модуль Smart Montage Planner
pub mod montage_planner;
use montage_planner::commands::MontageState;

// Модуль Analysis System
pub mod analysis;
use analysis::commands::ai_director_commands::AIDirectorState; // AI Director State
use analysis::commands::ai_director_v2_commands::AIDirectorV2State; // 🆕 AI Director v2 State with events
use analysis::commands::content_commands::ContentEngineState; // 🆕 Content Engine State
use analysis::commands::scene_commands::SceneEngineState; // 🆕 Scene Engine State
use analysis::commands::vision_commands::VisionServiceState; // 🆕 Vision Service State
                                                             // use analysis::commands::AnalysisState; // Temporarily disabled due to missing implementation

// Модуль безопасности и API ключей
pub mod security;
use security::secure_storage::SecureStorage;

// Модуль управления состоянием
pub mod state;
use state::StateManager;

// Application state for analysis system
#[derive(Clone)]
pub struct AppState {
  pub analysis_db: std::sync::Arc<tokio::sync::RwLock<Option<String>>>,
  pub person_db: Option<std::sync::Arc<crate::recognition::person_database::PersonDatabase>>,
  pub project_manager: std::sync::Arc<tokio::sync::RwLock<Option<String>>>,
}

impl Default for AppState {
  fn default() -> Self {
    Self {
      analysis_db: std::sync::Arc::new(tokio::sync::RwLock::new(None)),
      person_db: None,
      project_manager: std::sync::Arc::new(tokio::sync::RwLock::new(None)),
    }
  }
}

// Модуль экспорта типов
pub mod types_export;

// Модуль плагинов теперь в core/plugins

// Модуль субтитров
mod subtitles;

// Модуль конфигурации ML моделей
mod models_config;

// Модуль обновлений приложения
pub mod updates;

// Модуль команд
pub mod commands {
  pub mod audio_analysis;
  pub mod audio_correlation;
  pub mod init_yolo;
  pub mod transcription; // Legacy init_yolo_processor command
}

// Модуль команд для эффектов
pub mod effects_commands;

// Simple commands that don't belong to specific modules yet

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {epoch_ms}")
}

#[tauri::command]
async fn scan_media_folder<R: tauri::Runtime>(
  folder_path: String,
  app_handle: tauri::AppHandle<R>,
) -> Result<Vec<media::types::MediaFile>, String> {
  use std::path::Path;

  // Получаем директорию для кеша превью
  let app_dirs = filesystem::get_app_directories().await?;
  let thumbnail_dir = app_dirs.caches_dir.join("thumbnails");

  // Создаем процессор
  let processor = MediaProcessor::new(app_handle, thumbnail_dir);

  // Запускаем сканирование и обработку
  let folder = Path::new(&folder_path);
  processor.scan_and_process(folder, None).await
}

#[tauri::command]
async fn scan_media_folder_with_thumbnails<R: tauri::Runtime>(
  folder_path: String,
  width: u32,
  height: u32,
  app_handle: tauri::AppHandle<R>,
) -> Result<Vec<media::types::MediaFile>, String> {
  use std::path::Path;

  // Получаем директорию для кеша превью
  let app_dirs = filesystem::get_app_directories().await?;
  let thumbnail_dir = app_dirs.caches_dir.join("thumbnails");

  // Создаем процессор
  let processor = MediaProcessor::new(app_handle, thumbnail_dir);

  // Настройки для превью
  let thumbnail_options = Some(ThumbnailOptions {
    width,
    height,
    ..Default::default()
  });

  // Запускаем сканирование и обработку
  let folder = Path::new(&folder_path);
  processor.scan_and_process(folder, thumbnail_options).await
}

/// Тестовая команда для проверки системы плагинов
#[tauri::command]
async fn test_plugin_system(
  plugin_manager: tauri::State<'_, core::plugins::PluginManager>,
) -> Result<String, String> {
  // Получаем список доступных плагинов
  let registry = plugin_manager.loader().registry();
  let available_plugins = registry.list_plugins().await;

  let mut results = Vec::new();
  results.push("Plugin System Test Results:".to_string());
  results.push(format!("Available plugins: {}", available_plugins.len()));

  for plugin in &available_plugins {
    results.push(format!(
      "- {} v{} ({})",
      plugin.name, plugin.version, plugin.author
    ));
  }

  // Получаем список загруженных плагинов
  let loaded_plugins = plugin_manager.list_loaded_plugins().await;
  results.push(format!("Loaded plugins: {}", loaded_plugins.len()));

  for (id, state) in &loaded_plugins {
    results.push(format!("- {id} (state: {state:?})"));
  }

  Ok(results.join("\n"))
}

// This is where you export your tauri app
pub fn run() {
  // Note: Logging is initialized by Tauri plugin, don't initialize here
  // to avoid "attempted to set a logger after the logging system was already initialized" error
  println!("Starting Timeline Studio backend...");

  // Export TypeScript bindings in debug mode
  #[cfg(debug_assertions)]
  specta_export::export_typescript_bindings();

  // Ensure app directories exist on startup
  tauri::async_runtime::block_on(async {
    if let Err(e) = filesystem::create_app_directories().await {
      eprintln!("Failed to create app directories: {e}");
    }
  });

  // Build the app with all registered commands
  app_builder::build_app()
    .manage(LanguageState::default())
    .manage(media::commands::PreviewManagerState {
      manager: PreviewDataManager::new(
        dirs::cache_dir()
          .unwrap_or_default()
          .join("timeline-studio"),
      ),
    })
    .setup(|app: &mut tauri::App<tauri::Wry>| {
      // Initialize Video Compiler
      let video_compiler_state = tauri::async_runtime::block_on(video_compiler::initialize());
      match video_compiler_state {
        Ok(state) => {
          app.manage(state);
        }
        Err(e) => {
          log::error!("Failed to initialize Video Compiler: {e}");
          // Продолжаем работу даже если Video Compiler не инициализирован
          // Создаем дефолтное состояние
          app.manage(tauri::async_runtime::block_on(VideoCompilerState::new()));
        }
      }

      // Initialize State Manager
      let state_manager = tauri::async_runtime::block_on(StateManager::new(app.handle().clone()));
      match state_manager {
        Ok(manager) => {
          app.manage(manager);
          log::info!("State Manager initialized successfully");
        }
        Err(e) => {
          log::error!("Failed to initialize State Manager: {e}");
          // State Manager is critical, so we should probably exit
          // but for now, continue without it
        }
      }

      // Initialize Recognition Service - after PersonDatabase is initialized
      {
        let app_handle = app.handle();
        let app_handle_clone = app_handle.clone();

        tauri::async_runtime::spawn(async move {
          match app_handle_clone.path().app_data_dir() {
            Ok(app_dir) => {
              // Create app data directory if it doesn't exist
              if let Err(e) = std::fs::create_dir_all(&app_dir) {
                log::error!("Failed to create app data dir: {e}");
              } else {
                // Create RecognitionService instance
                match RecognitionService::new(&app_dir).await {
                  Ok(service) => {
                    let recognition_state = RecognitionState::new(Arc::new(service));
                    app_handle_clone.manage(recognition_state);
                    log::info!("Recognition service initialized successfully");
                  }
                  Err(e) => {
                    log::error!("Failed to create recognition service: {e}");
                  }
                }
              }
            }
            Err(e) => {
              log::error!("Failed to get app data dir: {e}");
            }
          }
        });
      }

      // Create YOLO Processor State
      let yolo_processor_state = YoloProcessorState::default();
      app.manage(yolo_processor_state);

      // Create simple YOLO processor state for new commands
      use std::sync::Mutex;
      app.manage(Mutex::new(None::<recognition::YoloProcessor>));

      // Create FaceNet processor state
      use recognition::commands::facenet_commands::FaceNetProcessorState;
      app.manage(FaceNetProcessorState::default());

      // Create RetinaFace processor state
      use recognition::commands::retinaface_commands::RetinaFaceProcessorState;
      app.manage(RetinaFaceProcessorState::default());

      // Create MediaPipe processor state
      use recognition::commands::mediapipe_commands::MediaPipeProcessorState;
      app.manage(MediaPipeProcessorState::default());

      // Create Privacy processor state
      use recognition::commands::privacy_commands::PrivacyProcessorState;
      app.manage(PrivacyProcessorState::default());

      // Create Clustering engine state
      use recognition::commands::clustering_commands::ClusteringEngineState;
      app.manage(ClusteringEngineState::default());

      // Create Montage Planner State with its own YoloProcessorState instance
      let montage_yolo_state = Arc::new(RwLock::new(YoloProcessorState::default()));
      let montage_state = MontageState::new(montage_yolo_state);
      app.manage(montage_state);

      // Create Scene Engine State 🆕
      let scene_engine_state = SceneEngineState::new();
      app.manage(scene_engine_state);

      // Create Vision Service State 🆕
      let vision_service_state = VisionServiceState::new();
      app.manage(vision_service_state);

      // Create Content Engine State 🆕
      let content_engine_state = ContentEngineState::new();
      app.manage(content_engine_state);

      // Create AI Streaming State for real-time AI events
      use video_compiler::commands::ai_api_proxy::AIStreamingState;
      let ai_streaming_state = AIStreamingState::new(app.handle().clone());
      app.manage(ai_streaming_state);

      // Create AI Cache State
      use video_compiler::commands::ai_api_proxy::{AICacheManager, AICacheState, CacheConfig};
      let cache_db_path = app
        .path()
        .app_cache_dir()
        .unwrap_or_default()
        .join("ai_cache.db");

      // Создаем директорию для кэша если не существует
      if let Some(parent) = cache_db_path.parent() {
        let _ = std::fs::create_dir_all(parent);
      }

      match AICacheManager::new(&cache_db_path, CacheConfig::default()) {
        Ok(cache_manager) => {
          let ai_cache_state = AICacheState {
            cache: Arc::new(tokio::sync::Mutex::new(cache_manager)),
          };
          app.manage(ai_cache_state);
          log::info!("AI Cache initialized at: {:?}", cache_db_path);
        }
        Err(e) => {
          log::error!("Failed to initialize AI Cache: {}", e);
          // Создаем пустой State чтобы приложение запустилось
          let cache_manager = AICacheManager::new(
            &cache_db_path,
            CacheConfig {
              enabled: false,
              ..Default::default()
            },
          )
          .unwrap();
          let ai_cache_state = AICacheState {
            cache: Arc::new(tokio::sync::Mutex::new(cache_manager)),
          };
          app.manage(ai_cache_state);
        }
      }

      // Create AI Director State
      let ai_director_state = AIDirectorState::new();
      app.manage(ai_director_state);

      // Initialize MCP Server State
      let mcp_server_state = MCPServerState(Arc::new(RwLock::new(None)));
      app.manage(mcp_server_state);

      // Initialize Person Identification Database
      let person_db = {
        use crate::recognition::person_database::PersonDatabase;

        let app_handle = app.handle();
        match app_handle.path().app_data_dir() {
          Ok(app_dir) => {
            // Create app data directory if it doesn't exist
            if let Err(e) = std::fs::create_dir_all(&app_dir) {
              log::error!("Failed to create app data dir: {e}");
              None
            } else {
              let db_path = app_dir.join("persons.db");

              // Initialize database asynchronously
              match tauri::async_runtime::block_on(PersonDatabase::new(db_path)) {
                Ok(db) => {
                  let db_arc = Arc::new(db);
                  app.manage(db_arc.clone());
                  log::info!("Person recognition database initialized successfully");
                  Some(db_arc)
                }
                Err(e) => {
                  log::error!("Failed to initialize person database: {e}");
                  None
                }
              }
            }
          }
          Err(e) => {
            log::error!("Failed to get app data dir: {e}");
            None
          }
        }
      };

      // Initialize Analysis System (temporarily disabled - needs AnalysisState implementation)
      if let Some(_person_db_ref) = &person_db {
        log::info!("Analysis system components ready but AnalysisState not yet implemented");
        // TODO: Implement AnalysisState and uncomment initialization
      } else {
        log::warn!("Analysis system not initialized - PersonDatabase required");
      }

      // 🆕 Initialize AI Director v2 State with events
      if let Some(person_db_ref) = &person_db {
        match app.handle().path().app_data_dir() {
          Ok(app_dir) => {
            let analysis_db_path = app_dir.join("analysis.db");

            match tauri::async_runtime::block_on(analysis::database::AnalysisDatabase::new(
              analysis_db_path.to_str().unwrap_or("analysis.db"),
              person_db_ref.clone(),
            )) {
              Ok(analysis_db) => {
                let analysis_db_arc = Arc::new(analysis_db);
                let yolo_state_arc = Arc::new(RwLock::new(YoloProcessorState::default()));
                let ai_director_v2_state = AIDirectorV2State::new(
                  analysis_db_arc,
                  person_db_ref.clone(),
                  yolo_state_arc,
                  app.handle().clone(),
                );
                app.manage(ai_director_v2_state);
                log::info!("AI Director v2 State initialized successfully with event support");
              }
              Err(e) => {
                log::error!("Failed to initialize Analysis Database for AI Director v2: {e}");
              }
            }
          }
          Err(e) => {
            log::error!("Failed to get app data dir for AI Director v2: {e}");
          }
        }
      } else {
        log::warn!("AI Director v2 not initialized - PersonDatabase required");
      }

      // Create Secure Storage for API keys
      match SecureStorage::new(app.handle().clone()) {
        Ok(storage) => {
          // Wrap SecureStorage in Mutex for thread-safe access
          app.manage(tokio::sync::Mutex::new(storage));
        }
        Err(e) => {
          log::error!("Failed to initialize SecureStorage: {e}");
          // Continue running without secure storage
        }
      }

      // Initialize Models Configuration
      match app.handle().path().app_data_dir() {
        Ok(app_data_dir) => {
          if let Err(e) = models_config::initialize_models_config(app_data_dir) {
            log::error!("Failed to initialize models config: {e}");
          } else {
            log::info!("Models configuration initialized successfully");
          }
        }
        Err(e) => {
          log::error!("Failed to get app data dir for models config: {e}");
        }
      }

      // Initialize Telemetry System
      let telemetry_config = TelemetryConfig::default();
      match tauri::async_runtime::block_on(TelemetryManager::new(telemetry_config)) {
        Ok(telemetry_manager) => {
          if let Err(e) = tauri::async_runtime::block_on(telemetry_manager.initialize()) {
            log::error!("Failed to initialize telemetry: {e}");
          } else {
            log::info!("Telemetry system initialized successfully");
          }
          app.manage(telemetry_manager);
        }
        Err(e) => {
          log::error!("Failed to create telemetry manager: {e}");
        }
      }

      // Initialize Plugin Manager
      let app_version = core::plugins::plugin::Version::new(0, 23, 0); // Current app version
      let event_bus = std::sync::Arc::new(core::EventBus::new());
      let service_container = std::sync::Arc::new(core::di::ServiceContainer::new());

      let plugin_manager = core::plugins::PluginManager::new(
        app_version,
        event_bus.clone(),
        service_container.clone(),
      );

      // Регистрируем примеры плагинов
      let registry = plugin_manager.loader().registry();
      if let Err(e) =
        tauri::async_runtime::block_on(core::plugins::register_example_plugins(&registry))
      {
        log::warn!("Failed to register example plugins: {e}");
      } else {
        log::info!("Example plugins registered successfully");
      }

      app.manage(plugin_manager);
      app.manage(event_bus);
      app.manage(service_container);

      // Получаем окно и добавляем обработчик закрытия
      if let Some(window) = app.get_webview_window("main") {
        let app_handle = app.handle().clone();

        window.on_window_event(move |event| {
          if let tauri::WindowEvent::CloseRequested { .. } = event {
            log::info!("Window close requested, performing graceful shutdown...");

            // Выполняем graceful shutdown для всех состояний
            if let Some(video_state) = app_handle.try_state::<VideoCompilerState>() {
              log::info!("Shutdown: VideoCompilerState");
              tauri::async_runtime::block_on(async {
                // Отменяем активные задачи
                if let Ok(mut jobs) = video_state.active_jobs.try_write() {
                  let job_count = jobs.len();
                  if job_count > 0 {
                    log::warn!("Shutdown: отмена {job_count} активных задач рендеринга");
                  }
                  jobs.clear();
                }

                if let Ok(mut pipelines) = video_state.active_pipelines.try_write() {
                  let pipeline_count = pipelines.len();
                  if pipeline_count > 0 {
                    log::warn!("Shutdown: отмена {pipeline_count} активных конвейеров");
                  }
                  pipelines.clear();
                }

                // Shutdown сервисов с увеличенным таймаутом
                log::info!("Shutdown: начинаем остановку сервисов video_compiler");
                match tokio::time::timeout(
                  std::time::Duration::from_secs(5),
                  video_state.services.shutdown_all(),
                )
                .await
                {
                  Ok(Ok(())) => log::info!("Shutdown: сервисы video_compiler успешно остановлены"),
                  Ok(Err(e)) => log::error!("Shutdown: ошибка остановки сервисов: {e}"),
                  Err(_) => log::warn!("Shutdown: таймаут остановки сервисов (5 сек)"),
                }
              });
            }

            // Очищаем RecognitionState с его ONNX sessions
            if let Some(recognition_state) = app_handle.try_state::<RecognitionState>() {
              log::info!("Shutdown: RecognitionState");
              tauri::async_runtime::block_on(async {
                // RecognitionService содержит ONNX sessions для различных моделей
                // Явно drop'аем их перед завершением приложения
                std::mem::drop(recognition_state);
              });
            }

            // Очищаем глобальный YoloProcessor (Mutex<Option<YoloProcessor>>)
            if let Some(yolo_processor) =
              app_handle.try_state::<Mutex<Option<recognition::YoloProcessor>>>()
            {
              log::info!("Shutdown: глобальный YoloProcessor");
              if let Ok(mut processor) = yolo_processor.try_lock() {
                if processor.is_some() {
                  log::debug!("Shutdown: dropping глобальный YoloProcessor с ONNX session");
                  *processor = None;
                }
              }
            }

            // Очищаем YoloProcessorState
            if let Some(yolo_state) = app_handle.try_state::<YoloProcessorState>() {
              log::info!("Shutdown: YoloProcessorState");
              tauri::async_runtime::block_on(async {
                if let Ok(mut processors) = yolo_state.processors.try_write() {
                  let processor_count = processors.len();
                  if processor_count > 0 {
                    log::warn!(
                      "Shutdown: остановка {processor_count} YOLO процессоров с ONNX sessions"
                    );
                  }
                  // Явно drop каждый процессор перед очисткой вектора
                  for (id, processor) in processors.drain() {
                    log::debug!("Shutdown: dropping YOLO processor {id} с ONNX session");
                    // Явно drop процессор и его ONNX session
                    std::mem::drop(processor);
                  }
                }
              });
            }

            // Очищаем FaceNet processor (tuple struct с Mutex)
            if let Some(facenet_state) =
              app_handle
                .try_state::<recognition::commands::facenet_commands::FaceNetProcessorState>()
            {
              log::info!("Shutdown: FaceNetProcessorState");
              if let Ok(mut processor) = facenet_state.0.try_lock() {
                if processor.is_some() {
                  log::debug!("Shutdown: dropping FaceNet processor с ONNX session");
                  *processor = None;
                }
              }
            }

            // Очищаем RetinaFace processor (tuple struct с Mutex)
            if let Some(retinaface_state) =
              app_handle
                .try_state::<recognition::commands::retinaface_commands::RetinaFaceProcessorState>()
            {
              log::info!("Shutdown: RetinaFaceProcessorState");
              if let Ok(mut processor) = retinaface_state.0.try_lock() {
                if processor.is_some() {
                  log::debug!("Shutdown: dropping RetinaFace processor с ONNX session");
                  *processor = None;
                }
              }
            }

            // Очищаем MediaPipe processor (tuple struct с Mutex)
            if let Some(mediapipe_state) =
              app_handle
                .try_state::<recognition::commands::mediapipe_commands::MediaPipeProcessorState>()
            {
              log::info!("Shutdown: MediaPipeProcessorState");
              if let Ok(mut processor) = mediapipe_state.0.try_lock() {
                if processor.is_some() {
                  log::debug!("Shutdown: dropping MediaPipe processor с ONNX session");
                  *processor = None;
                }
              }
            }

            // MontageState cleanup
            // MontageState не хранит yolo_state напрямую, но содержит VideoProcessor
            // который будет очищен автоматически через Drop trait
            if let Some(_montage_state) = app_handle.try_state::<MontageState>() {
              log::info!("Shutdown: MontageState");
              // MontageState компоненты будут очищены автоматически
            }

            // PersonDatabase shutdown
            if let Some(_person_db) = app_handle.try_state::<Arc<PersonDatabase>>() {
              log::info!("Shutdown: PersonDatabase");
              // PersonDatabase будет закрыт автоматически через Drop trait
              // когда последняя Arc ссылка будет удалена
            }

            // Даем время на завершение всех операций перед финальным drop
            // Увеличено время для корректного освобождения ONNX sessions
            std::thread::sleep(std::time::Duration::from_millis(300));

            log::info!("Application graceful shutdown completed - all ONNX sessions released");

            // ВАЖНО: Короткая пауза для окончательного освобождения ресурсов
            // ONNX Runtime environment leaked, поэтому LoggingManager деструктор не вызовется
            std::thread::sleep(std::time::Duration::from_millis(100));

            // Окно закроется автоматически после возврата из обработчика
          }
        });
      }

      // Создаем нативное меню приложения
      match menu::create_app_menu(app) {
        Ok(menu) => {
          if let Some(window) = app.get_webview_window("main") {
            if let Err(e) = window.set_menu(menu) {
              log::error!("Failed to set menu: {e}");
            } else {
              log::info!("Application menu created successfully");
            }
          }
        }
        Err(e) => {
          log::error!("Failed to create menu: {e}");
        }
      }

      // Регистрируем обработчик событий меню
      app.on_menu_event(move |app, event| {
        menu::handle_menu_event(app, event.id().as_ref());
      });

      log::info!("Application setup completed");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::sync::Arc;
  use tempfile::TempDir;

  #[test]
  fn test_greet() {
    let result = greet();
    assert!(result.contains("Hello world from Rust!"));
    assert!(result.contains("Current epoch:"));

    // Проверяем, что epoch - это число
    let parts: Vec<&str> = result.split("Current epoch: ").collect();
    assert_eq!(parts.len(), 2);
    let epoch_str = parts[1];
    assert!(epoch_str.parse::<u128>().is_ok());
  }

  #[test]
  fn test_epoch_calculation() {
    let now = SystemTime::now();
    let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();

    // Проверяем, что epoch в разумных пределах (после 2020 года)
    assert!(epoch_ms > 1577836800000); // 1 января 2020
    assert!(epoch_ms < 2000000000000); // где-то в 2033 году
  }

  #[test]
  fn test_imports() {
    // Проверяем, что все импорты работают
    // Это в основном проверка компиляции
    // Просто проверяем, что типы существуют
    let _ = std::any::type_name::<VideoCompilerState>();
  }

  #[tokio::test]
  async fn test_video_compiler_state_creation() {
    // Тестируем создание VideoCompilerState через команды
    use video_compiler::commands::VideoCompilerState;

    let state = VideoCompilerState::new().await;

    // Проверяем, что состояние создано корректно
    assert!(Arc::strong_count(&state.active_jobs) > 0);
    assert!(Arc::strong_count(&state.cache_manager) > 0);
    assert!(!state.ffmpeg_path.read().await.is_empty());
    assert!(Arc::strong_count(&state.settings) > 0);
  }

  #[tokio::test]
  async fn test_clear_cache_functionality() {
    use tokio::sync::RwLock;

    // Создаем RenderCache
    let cache = Arc::new(RwLock::new(video_compiler::cache::RenderCache::new()));

    // Добавляем некоторые данные в кэш
    {
      let mut cache_guard = cache.write().await;
      let _ = cache_guard
        .store_metadata(
          "test_path".to_string(),
          video_compiler::cache::MediaMetadata {
            file_path: "test_path".to_string(),
            file_size: 1000000,
            modified_time: std::time::SystemTime::now(),
            duration: 10.0,
            resolution: Some((1920, 1080)),
            fps: Some(30.0),
            bitrate: Some(5000),
            video_codec: Some("h264".to_string()),
            audio_codec: Some("aac".to_string()),
            cached_at: std::time::SystemTime::now(),
          },
        )
        .await;
    }

    // Проверяем, что данные есть в кэше
    {
      let mut cache_guard = cache.write().await;
      assert!(cache_guard.get_metadata("test_path").await.is_some());
    }

    // Очищаем кэш
    {
      let mut cache_guard = cache.write().await;
      cache_guard.clear().await.unwrap();
    }

    // Проверяем, что кэш пуст
    {
      let mut cache_guard = cache.write().await;
      assert!(cache_guard.get_metadata("test_path").await.is_none());
    }
  }

  #[tokio::test]
  async fn test_preview_manager_functionality() {
    // Создаем временную директорию для тестов
    let temp_dir = TempDir::new().unwrap();
    let temp_path = temp_dir.path().to_path_buf();

    // Создаем PreviewDataManager с путем к кешу
    let manager = PreviewDataManager::new(temp_path.clone());

    // Тестируем получение данных для несуществующего файла
    let result = manager.get_preview_data("non_existent_file.mp4").await;
    assert!(result.is_none());

    // Тестируем получение всех файлов (изначально пустой список)
    let all_files = manager.get_all_files_with_previews().await;
    assert_eq!(all_files.len(), 0);

    // Тестируем очистку данных для несуществующего файла
    let clear_result = manager.clear_file_data("non_existent_file.mp4").await;
    assert!(clear_result.is_ok());
  }

  #[tokio::test]
  async fn test_panic_recovery() {
    // Тестируем, что приложение корректно обрабатывает ошибки
    // и не падает при неправильных входных данных

    // Создаем временный PreviewDataManager с временной директорией
    let temp_dir = TempDir::new().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());

    // Пытаемся получить данные для несуществующего файла
    let result = manager.get_preview_data("non_existent_file.mp4").await;
    assert!(result.is_none());

    // Пытаемся удалить данные для несуществующего файла (не должно вызвать panic)
    let _ = manager.clear_file_data("non_existent_file.mp4").await;

    // Создаем VideoCompilerState
    let _state = VideoCompilerState::new().await;

    // Тестируем обработку невалидных путей через команды media модуля
    use crate::media::commands::get_media_metadata;

    // Тестируем с пустым путем
    let result = get_media_metadata("".to_string());
    assert!(result.is_err());

    // Тестируем с невалидным путем
    let result = get_media_metadata("/invalid/path/to/video.mp4".to_string());
    assert!(result.is_err());

    // Все операции завершились без panic - тест прошел
    log::info!("Panic recovery test completed successfully");
  }
}

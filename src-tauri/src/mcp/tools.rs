//! MCP инструменты для работы с видео

use super::types::{MCPContext, MCPTool, MCPToolResult};
use crate::analysis::services::ai_director::{AIDirector, AIDirectorConfig};
use crate::analysis::services::scene_detector::SceneDetector;
use crate::state::commands::timeline::TimelineCommands;
use crate::state::{EventBus, ProjectState};
use serde_json::{json, Value};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Набор инструментов для работы с видео через MCP
pub struct VideoTools {
  context: Arc<RwLock<MCPContext>>,
  project_state: Option<Arc<RwLock<ProjectState>>>,
  event_bus: Option<Arc<EventBus>>,
}

impl VideoTools {
  pub fn new() -> Self {
    Self {
      context: Arc::new(RwLock::new(MCPContext::default())),
      project_state: None,
      event_bus: None,
    }
  }

  /// Создать с доступом к project state
  pub fn with_state(project_state: Arc<RwLock<ProjectState>>, event_bus: Arc<EventBus>) -> Self {
    Self {
      context: Arc::new(RwLock::new(MCPContext::default())),
      project_state: Some(project_state),
      event_bus: Some(event_bus),
    }
  }

  /// Получить список всех доступных инструментов
  pub fn get_available_tools(&self) -> Vec<MCPTool> {
    vec![
      // Анализ видео
      self.tool_analyze_video(),
      self.tool_detect_scenes(),
      self.tool_detect_moments(),
      self.tool_analyze_audio(),
      // Timeline операции
      self.tool_create_timeline(),
      self.tool_add_clip(),
      self.tool_remove_clip(),
      self.tool_move_clip(),
      self.tool_split_clip(),
      // Эффекты
      self.tool_apply_filter(),
      self.tool_add_transition(),
      self.tool_apply_color_grading(),
      self.tool_add_text_overlay(),
      // Экспорт
      self.tool_export_video(),
      self.tool_create_preview(),
      // Проект
      self.tool_get_project_info(),
      self.tool_save_project(),
      self.tool_list_media_files(),
    ]
  }

  /// Выполнить инструмент по имени
  pub async fn execute_tool(&self, tool_name: &str, arguments: Value) -> MCPToolResult {
    match tool_name {
      "analyze_video" => self.execute_analyze_video(arguments).await,
      "detect_scenes" => self.execute_detect_scenes(arguments).await,
      "detect_moments" => self.execute_detect_moments(arguments).await,
      "analyze_audio" => self.execute_analyze_audio(arguments).await,
      "create_timeline" => self.execute_create_timeline(arguments).await,
      "add_clip" => self.execute_add_clip(arguments).await,
      "remove_clip" => self.execute_remove_clip(arguments).await,
      "move_clip" => self.execute_move_clip(arguments).await,
      "split_clip" => self.execute_split_clip(arguments).await,
      "apply_filter" => self.execute_apply_filter(arguments).await,
      "add_transition" => self.execute_add_transition(arguments).await,
      "apply_color_grading" => self.execute_apply_color_grading(arguments).await,
      "add_text_overlay" => self.execute_add_text_overlay(arguments).await,
      "export_video" => self.execute_export_video(arguments).await,
      "create_preview" => self.execute_create_preview(arguments).await,
      "get_project_info" => self.execute_get_project_info(arguments).await,
      "save_project" => self.execute_save_project(arguments).await,
      "list_media_files" => self.execute_list_media_files(arguments).await,
      _ => MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Unknown tool: {}", tool_name)),
      },
    }
  }

  // === Tool Definitions ===

  fn tool_analyze_video(&self) -> MCPTool {
    MCPTool {
      name: "analyze_video".to_string(),
      description: "Проанализировать видео файл: качество, метаданные, контент".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "video_path": {
            "type": "string",
            "description": "Путь к видео файлу"
          },
          "analysis_type": {
            "type": "string",
            "enum": ["quick", "balanced", "quality"],
            "description": "Тип анализа: quick (быстрый), balanced (сбалансированный), quality (детальный)"
          }
        },
        "required": ["video_path"]
      }),
    }
  }

  fn tool_detect_scenes(&self) -> MCPTool {
    MCPTool {
      name: "detect_scenes".to_string(),
      description: "Обнаружить сцены в видео с анализом качества каждой сцены".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "video_path": {
            "type": "string",
            "description": "Путь к видео файлу"
          },
          "min_scene_duration": {
            "type": "number",
            "description": "Минимальная длительность сцены в секундах"
          }
        },
        "required": ["video_path"]
      }),
    }
  }

  fn tool_detect_moments(&self) -> MCPTool {
    MCPTool {
      name: "detect_moments".to_string(),
      description: "Найти ключевые моменты в видео (динамичные сцены, эмоции, интересные кадры)"
        .to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "video_path": {
            "type": "string",
            "description": "Путь к видео файлу"
          },
          "max_moments": {
            "type": "number",
            "description": "Максимальное количество моментов"
          }
        },
        "required": ["video_path"]
      }),
    }
  }

  fn tool_analyze_audio(&self) -> MCPTool {
    MCPTool {
      name: "analyze_audio".to_string(),
      description: "Проанализировать аудио: уровень громкости, тишина, речь, музыка".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "video_path": {
            "type": "string",
            "description": "Путь к видео файлу"
          }
        },
        "required": ["video_path"]
      }),
    }
  }

  fn tool_create_timeline(&self) -> MCPTool {
    MCPTool {
      name: "create_timeline".to_string(),
      description: "Создать новый timeline проект с настройками".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Название проекта"
          },
          "resolution": {
            "type": "object",
            "properties": {
              "width": { "type": "number" },
              "height": { "type": "number" }
            },
            "description": "Разрешение видео (например, 1920x1080)"
          },
          "fps": {
            "type": "number",
            "description": "Частота кадров (например, 30)"
          }
        },
        "required": ["name"]
      }),
    }
  }

  fn tool_add_clip(&self) -> MCPTool {
    MCPTool {
      name: "add_clip".to_string(),
      description: "Добавить видео клип на timeline".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "video_path": {
            "type": "string",
            "description": "Путь к видео файлу"
          },
          "start_time": {
            "type": "number",
            "description": "Время начала на timeline (секунды)"
          },
          "duration": {
            "type": "number",
            "description": "Длительность клипа (секунды)"
          },
          "track_index": {
            "type": "number",
            "description": "Номер трека (0, 1, 2...)"
          }
        },
        "required": ["video_path", "start_time"]
      }),
    }
  }

  fn tool_remove_clip(&self) -> MCPTool {
    MCPTool {
      name: "remove_clip".to_string(),
      description: "Удалить клип с timeline".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id": {
            "type": "string",
            "description": "ID клипа для удаления"
          }
        },
        "required": ["clip_id"]
      }),
    }
  }

  fn tool_move_clip(&self) -> MCPTool {
    MCPTool {
      name: "move_clip".to_string(),
      description: "Переместить клип на timeline".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id": {
            "type": "string",
            "description": "ID клипа"
          },
          "new_start_time": {
            "type": "number",
            "description": "Новое время начала (секунды)"
          },
          "new_track_index": {
            "type": "number",
            "description": "Новый номер трека"
          }
        },
        "required": ["clip_id", "new_start_time"]
      }),
    }
  }

  fn tool_split_clip(&self) -> MCPTool {
    MCPTool {
      name: "split_clip".to_string(),
      description: "Разделить клип на две части в указанной точке".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id": {
            "type": "string",
            "description": "ID клипа"
          },
          "split_time": {
            "type": "number",
            "description": "Время разделения внутри клипа (секунды)"
          }
        },
        "required": ["clip_id", "split_time"]
      }),
    }
  }

  fn tool_apply_filter(&self) -> MCPTool {
    MCPTool {
      name: "apply_filter".to_string(),
      description: "Применить фильтр к клипу (blur, grayscale, sharpen, etc.)".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id": {
            "type": "string",
            "description": "ID клипа"
          },
          "filter_type": {
            "type": "string",
            "enum": ["blur", "grayscale", "sharpen", "vignette", "sepia"],
            "description": "Тип фильтра"
          },
          "intensity": {
            "type": "number",
            "description": "Интенсивность эффекта (0.0 - 1.0)"
          }
        },
        "required": ["clip_id", "filter_type"]
      }),
    }
  }

  fn tool_add_transition(&self) -> MCPTool {
    MCPTool {
      name: "add_transition".to_string(),
      description: "Добавить переход между клипами".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id_from": {
            "type": "string",
            "description": "ID первого клипа"
          },
          "clip_id_to": {
            "type": "string",
            "description": "ID второго клипа"
          },
          "transition_type": {
            "type": "string",
            "enum": ["fade", "dissolve", "wipe", "slide"],
            "description": "Тип перехода"
          },
          "duration": {
            "type": "number",
            "description": "Длительность перехода (секунды)"
          }
        },
        "required": ["clip_id_from", "clip_id_to", "transition_type"]
      }),
    }
  }

  fn tool_apply_color_grading(&self) -> MCPTool {
    MCPTool {
      name: "apply_color_grading".to_string(),
      description: "Применить цветокоррекцию к клипу".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id": {
            "type": "string",
            "description": "ID клипа"
          },
          "brightness": {
            "type": "number",
            "description": "Яркость (-1.0 to 1.0)"
          },
          "contrast": {
            "type": "number",
            "description": "Контраст (-1.0 to 1.0)"
          },
          "saturation": {
            "type": "number",
            "description": "Насыщенность (-1.0 to 1.0)"
          },
          "temperature": {
            "type": "number",
            "description": "Температура цвета (-1.0 to 1.0)"
          }
        },
        "required": ["clip_id"]
      }),
    }
  }

  fn tool_add_text_overlay(&self) -> MCPTool {
    MCPTool {
      name: "add_text_overlay".to_string(),
      description: "Добавить текстовый оверлей на клип".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "clip_id": {
            "type": "string",
            "description": "ID клипа"
          },
          "text": {
            "type": "string",
            "description": "Текст для отображения"
          },
          "position": {
            "type": "string",
            "enum": ["top", "center", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"],
            "description": "Позиция текста"
          },
          "font_size": {
            "type": "number",
            "description": "Размер шрифта"
          },
          "color": {
            "type": "string",
            "description": "Цвет текста (hex, например #FFFFFF)"
          }
        },
        "required": ["clip_id", "text"]
      }),
    }
  }

  fn tool_export_video(&self) -> MCPTool {
    MCPTool {
      name: "export_video".to_string(),
      description: "Экспортировать timeline в видео файл".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "output_path": {
            "type": "string",
            "description": "Путь для сохранения видео"
          },
          "quality": {
            "type": "string",
            "enum": ["draft", "medium", "high", "maximum"],
            "description": "Качество экспорта"
          },
          "format": {
            "type": "string",
            "enum": ["mp4", "mov", "webm"],
            "description": "Формат видео"
          }
        },
        "required": ["output_path"]
      }),
    }
  }

  fn tool_create_preview(&self) -> MCPTool {
    MCPTool {
      name: "create_preview".to_string(),
      description: "Создать превью изображение из видео".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "video_path": {
            "type": "string",
            "description": "Путь к видео файлу"
          },
          "timestamp": {
            "type": "number",
            "description": "Время кадра (секунды)"
          },
          "output_path": {
            "type": "string",
            "description": "Путь для сохранения превью"
          }
        },
        "required": ["video_path", "timestamp"]
      }),
    }
  }

  fn tool_get_project_info(&self) -> MCPTool {
    MCPTool {
      name: "get_project_info".to_string(),
      description: "Получить информацию о текущем проекте: клипы, треки, длительность".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {}
      }),
    }
  }

  fn tool_save_project(&self) -> MCPTool {
    MCPTool {
      name: "save_project".to_string(),
      description: "Сохранить текущий проект".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "project_path": {
            "type": "string",
            "description": "Путь для сохранения проекта (.tsp)"
          }
        }
      }),
    }
  }

  fn tool_list_media_files(&self) -> MCPTool {
    MCPTool {
      name: "list_media_files".to_string(),
      description: "Получить список всех медиа файлов в проекте".to_string(),
      input_schema: json!({
        "type": "object",
        "properties": {
          "filter_type": {
            "type": "string",
            "enum": ["all", "video", "audio", "image"],
            "description": "Фильтр по типу файлов"
          }
        }
      }),
    }
  }

  // === Tool Implementations ===

  async fn execute_analyze_video(&self, arguments: Value) -> MCPToolResult {
    // Парсим аргументы
    let video_path = match arguments.get("video_path").and_then(|v| v.as_str()) {
      Some(path) => path,
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: video_path".to_string()),
        }
      }
    };

    let path = Path::new(video_path);
    if !path.exists() {
      return MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Video file not found: {}", video_path)),
      };
    }

    // Определяем тип анализа
    let analysis_type = arguments
      .get("analysis_type")
      .and_then(|v| v.as_str())
      .unwrap_or("balanced");

    // Создаем конфигурацию для AI Director
    let config = match analysis_type {
      "quick" => AIDirectorConfig {
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_vision_analysis: false, // Отключаем для быстрого анализа
        enable_moment_detection: true,
        enable_content_classification: false,
        ..Default::default()
      },
      "quality" => AIDirectorConfig {
        enable_audio_analysis: true,
        enable_scene_detection: true,
        enable_vision_analysis: true, // Включаем всё для детального анализа
        enable_moment_detection: true,
        enable_content_classification: true,
        ..Default::default()
      },
      _ => AIDirectorConfig::default(), // balanced
    };

    // Запускаем анализ через AI Director
    let director = AIDirector::new();
    match director
      .analyze_media_comprehensive(path, Some(config))
      .await
    {
      Ok(result) => MCPToolResult {
        success: true,
        data: Some(serde_json::to_value(&result).unwrap_or(json!({}))),
        error: None,
      },
      Err(e) => MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Analysis failed: {}", e)),
      },
    }
  }

  async fn execute_detect_scenes(&self, arguments: Value) -> MCPToolResult {
    // Парсим аргументы
    let video_path = match arguments.get("video_path").and_then(|v| v.as_str()) {
      Some(path) => path,
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: video_path".to_string()),
        }
      }
    };

    // Проверяем существование файла
    if !Path::new(video_path).exists() {
      return MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Video file not found: {}", video_path)),
      };
    }

    // Создаем детектор сцен
    let mut detector = SceneDetector::new();

    // Применяем дополнительные параметры если указаны
    if let Some(min_duration) = arguments.get("min_scene_duration").and_then(|v| v.as_f64()) {
      detector.min_scene_duration = min_duration as f32;
    }

    // Запускаем детекцию сцен
    match detector.detect_scenes(video_path).await {
      Ok(scenes) => MCPToolResult {
        success: true,
        data: Some(json!({
          "scenes_count": scenes.len(),
          "scenes": serde_json::to_value(&scenes).unwrap_or(json!([])),
        })),
        error: None,
      },
      Err(e) => MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Scene detection failed: {}", e)),
      },
    }
  }

  async fn execute_detect_moments(&self, arguments: Value) -> MCPToolResult {
    // Парсим аргументы
    let video_path = match arguments.get("video_path").and_then(|v| v.as_str()) {
      Some(path) => path,
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: video_path".to_string()),
        }
      }
    };

    let path = Path::new(video_path);
    if !path.exists() {
      return MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Video file not found: {}", video_path)),
      };
    }

    let max_moments = arguments
      .get("max_moments")
      .and_then(|v| v.as_u64())
      .unwrap_or(10) as usize;

    // Используем AI Director с включенной детекцией моментов
    let config = AIDirectorConfig {
      enable_audio_analysis: false,
      enable_scene_detection: true, // Нужно для анализа моментов
      enable_vision_analysis: false,
      enable_moment_detection: true, // Главное!
      enable_content_classification: false,
      ..Default::default()
    };

    let director = AIDirector::new();
    match director
      .analyze_media_comprehensive(path, Some(config))
      .await
    {
      Ok(result) => {
        let moments = result.moment_analysis.map(|analysis| {
          let mut moments_vec = analysis.key_moments;
          // Ограничиваем количество моментов
          if moments_vec.len() > max_moments {
            moments_vec.truncate(max_moments);
          }
          moments_vec
        });

        MCPToolResult {
          success: true,
          data: Some(json!({
            "moments_count": moments.as_ref().map(|m| m.len()).unwrap_or(0),
            "moments": serde_json::to_value(&moments).unwrap_or(json!([])),
          })),
          error: None,
        }
      }
      Err(e) => MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Moment detection failed: {}", e)),
      },
    }
  }

  async fn execute_analyze_audio(&self, arguments: Value) -> MCPToolResult {
    // Парсим аргументы
    let video_path = match arguments.get("video_path").and_then(|v| v.as_str()) {
      Some(path) => path,
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: video_path".to_string()),
        }
      }
    };

    let path = Path::new(video_path);
    if !path.exists() {
      return MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Video file not found: {}", video_path)),
      };
    }

    // Используем AI Director только с аудио анализом
    let config = AIDirectorConfig {
      enable_audio_analysis: true, // Главное!
      enable_scene_detection: false,
      enable_vision_analysis: false,
      enable_moment_detection: false,
      enable_content_classification: false,
      ..Default::default()
    };

    let director = AIDirector::new();
    match director
      .analyze_media_comprehensive(path, Some(config))
      .await
    {
      Ok(result) => MCPToolResult {
        success: true,
        data: Some(json!({
          "audio_analysis": serde_json::to_value(&result.audio_analysis).unwrap_or(json!({})),
        })),
        error: None,
      },
      Err(e) => MCPToolResult {
        success: false,
        data: None,
        error: Some(format!("Audio analysis failed: {}", e)),
      },
    }
  }

  async fn execute_create_timeline(&self, _arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let project_state = match &self.project_state {
      Some(state) => state.clone(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Timeline operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    // Получаем информацию о текущем timeline
    let state = project_state.read().await;
    match &state.project {
      Some(project) => MCPToolResult {
        success: true,
        data: Some(json!({
          "message": "Timeline already exists in the current project",
          "timeline_info": {
            "tracks_count": project.timeline.tracks.len(),
            "total_clips": project.timeline.tracks.iter().map(|t| t.clips.len()).sum::<usize>(),
          }
        })),
        error: None,
      },
      None => MCPToolResult {
        success: false,
        data: None,
        error: Some("No project is currently open. Please create or open a project first.".to_string()),
      },
    }
  }

  async fn execute_add_clip(&self, arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let (project_state, event_bus) = match (&self.project_state, &self.event_bus) {
      (Some(state), Some(bus)) => (state.clone(), bus.clone()),
      _ => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Timeline operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    // Парсим аргументы
    let track_id = match arguments.get("track_id").and_then(|v| v.as_str()) {
      Some(id) => id.to_string(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: track_id".to_string()),
        }
      }
    };

    let media_id = match arguments.get("media_id").and_then(|v| v.as_str()) {
      Some(id) => id.to_string(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: media_id".to_string()),
        }
      }
    };

    let time = arguments
      .get("time")
      .and_then(|v| v.as_f64())
      .unwrap_or(0.0);

    // Используем TimelineCommands для добавления клипа
    let timeline_commands = TimelineCommands::new(project_state, event_bus);
    match timeline_commands.add_clip(track_id, media_id, time).await {
      result if result.success => MCPToolResult {
        success: true,
        data: result.data,
        error: None,
      },
      result => MCPToolResult {
        success: false,
        data: None,
        error: result.error,
      },
    }
  }

  async fn execute_remove_clip(&self, arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let (project_state, event_bus) = match (&self.project_state, &self.event_bus) {
      (Some(state), Some(bus)) => (state.clone(), bus.clone()),
      _ => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Timeline operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    // Парсим аргументы
    let clip_id = match arguments.get("clip_id").and_then(|v| v.as_str()) {
      Some(id) => id.to_string(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: clip_id".to_string()),
        }
      }
    };

    // Используем TimelineCommands для удаления клипа
    let timeline_commands = TimelineCommands::new(project_state, event_bus);
    match timeline_commands.delete_clip(clip_id).await {
      result if result.success => MCPToolResult {
        success: true,
        data: result.data,
        error: None,
      },
      result => MCPToolResult {
        success: false,
        data: None,
        error: result.error,
      },
    }
  }

  async fn execute_move_clip(&self, arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let (project_state, event_bus) = match (&self.project_state, &self.event_bus) {
      (Some(state), Some(bus)) => (state.clone(), bus.clone()),
      _ => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Timeline operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    // Парсим аргументы
    let clip_id = match arguments.get("clip_id").and_then(|v| v.as_str()) {
      Some(id) => id.to_string(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: clip_id".to_string()),
        }
      }
    };

    let new_track_id = match arguments.get("new_track_id").and_then(|v| v.as_str()) {
      Some(id) => id.to_string(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: new_track_id".to_string()),
        }
      }
    };

    let new_time = match arguments.get("new_time").and_then(|v| v.as_f64()) {
      Some(time) => time,
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: new_time".to_string()),
        }
      }
    };

    // Используем TimelineCommands для перемещения клипа
    let timeline_commands = TimelineCommands::new(project_state, event_bus);
    match timeline_commands
      .move_clip(clip_id, new_track_id, new_time)
      .await
    {
      result if result.success => MCPToolResult {
        success: true,
        data: result.data,
        error: None,
      },
      result => MCPToolResult {
        success: false,
        data: None,
        error: result.error,
      },
    }
  }

  async fn execute_split_clip(&self, arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let (project_state, event_bus) = match (&self.project_state, &self.event_bus) {
      (Some(state), Some(bus)) => (state.clone(), bus.clone()),
      _ => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Timeline operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    // Парсим аргументы
    let clip_id = match arguments.get("clip_id").and_then(|v| v.as_str()) {
      Some(id) => id.to_string(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: clip_id".to_string()),
        }
      }
    };

    let time = match arguments.get("time").and_then(|v| v.as_f64()) {
      Some(time) => time,
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some("Missing required parameter: time".to_string()),
        }
      }
    };

    // Используем TimelineCommands для разделения клипа
    let timeline_commands = TimelineCommands::new(project_state, event_bus);
    match timeline_commands.split_clip(clip_id, time).await {
      result if result.success => MCPToolResult {
        success: true,
        data: result.data,
        error: None,
      },
      result => MCPToolResult {
        success: false,
        data: None,
        error: result.error,
      },
    }
  }

  async fn execute_apply_filter(&self, _arguments: Value) -> MCPToolResult {
    MCPToolResult {
      success: true,
      data: Some(json!({
        "status": "not_implemented",
        "message": "apply_filter will be implemented"
      })),
      error: None,
    }
  }

  async fn execute_add_transition(&self, _arguments: Value) -> MCPToolResult {
    MCPToolResult {
      success: true,
      data: Some(json!({
        "status": "not_implemented",
        "message": "add_transition will be implemented"
      })),
      error: None,
    }
  }

  async fn execute_apply_color_grading(&self, _arguments: Value) -> MCPToolResult {
    MCPToolResult {
      success: true,
      data: Some(json!({
        "status": "not_implemented",
        "message": "apply_color_grading will be implemented"
      })),
      error: None,
    }
  }

  async fn execute_add_text_overlay(&self, _arguments: Value) -> MCPToolResult {
    MCPToolResult {
      success: true,
      data: Some(json!({
        "status": "not_implemented",
        "message": "add_text_overlay will be implemented"
      })),
      error: None,
    }
  }

  async fn execute_export_video(&self, _arguments: Value) -> MCPToolResult {
    MCPToolResult {
      success: true,
      data: Some(json!({
        "status": "not_implemented",
        "message": "export_video will be implemented"
      })),
      error: None,
    }
  }

  async fn execute_create_preview(&self, _arguments: Value) -> MCPToolResult {
    MCPToolResult {
      success: true,
      data: Some(json!({
        "status": "not_implemented",
        "message": "create_preview will be implemented"
      })),
      error: None,
    }
  }

  async fn execute_get_project_info(&self, _arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let project_state = match &self.project_state {
      Some(state) => state.clone(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Project operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    let state = project_state.read().await;
    match &state.project {
      Some(project) => {
        let total_clips: usize = project.timeline.tracks.iter().map(|t| t.clips.len()).sum();

        MCPToolResult {
          success: true,
          data: Some(json!({
            "project_name": project.metadata.name,
            "created_at": project.metadata.created_at,
            "modified_at": project.metadata.modified_at,
            "settings": {
              "resolution": {
                "width": project.settings.resolution.width,
                "height": project.settings.resolution.height,
              },
              "frame_rate": project.settings.frame_rate,
              "audio_sample_rate": project.settings.audio_sample_rate,
              "audio_channels": project.settings.audio_channels,
            },
            "timeline": {
              "tracks_count": project.timeline.tracks.len(),
              "total_clips": total_clips,
            },
            "media_pool": {
              "items_count": project.media_pool.items.len(),
            },
          })),
          error: None,
        }
      }
      None => MCPToolResult {
        success: false,
        data: None,
        error: Some("No project is currently open.".to_string()),
      },
    }
  }

  async fn execute_save_project(&self, arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let project_state = match &self.project_state {
      Some(state) => state.clone(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Project operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    // Получаем путь для сохранения (опционально)
    let project_path = arguments.get("project_path").and_then(|v| v.as_str());

    MCPToolResult {
      success: true,
      data: Some(json!({
        "message": "Project save request received",
        "path": project_path,
        "note": "Actual saving is handled by PersistenceService through StateManager"
      })),
      error: None,
    }
  }

  async fn execute_list_media_files(&self, arguments: Value) -> MCPToolResult {
    // Проверяем наличие project state
    let project_state = match &self.project_state {
      Some(state) => state.clone(),
      None => {
        return MCPToolResult {
          success: false,
          data: None,
          error: Some(
            "Project operations require initialized project state. Please open a project first."
              .to_string(),
          ),
        }
      }
    };

    let state = project_state.read().await;
    match &state.project {
      Some(project) => {
        let filter_type = arguments
          .get("filter_type")
          .and_then(|v| v.as_str())
          .unwrap_or("all");

        let media_files: Vec<_> = project
          .media_pool
          .items
          .values()
          .filter(|item| match filter_type {
            "video" => matches!(item.media_type, crate::state::project_state::MediaType::Video),
            "audio" => matches!(item.media_type, crate::state::project_state::MediaType::Audio),
            "image" => matches!(item.media_type, crate::state::project_state::MediaType::Image),
            _ => true, // "all"
          })
          .map(|item| {
            json!({
              "id": item.id,
              "name": item.name,
              "type": format!("{:?}", item.media_type),
              "path": item.file_path,
              "duration": item.duration,
              "created_at": item.created_at,
            })
          })
          .collect();

        MCPToolResult {
          success: true,
          data: Some(json!({
            "media_files": media_files,
            "total_count": media_files.len(),
            "filter_applied": filter_type,
          })),
          error: None,
        }
      }
      None => MCPToolResult {
        success: false,
        data: None,
        error: Some("No project is currently open.".to_string()),
      },
    }
  }
}

impl Default for VideoTools {
  fn default() -> Self {
    Self::new()
  }
}

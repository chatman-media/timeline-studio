pub mod advanced_tracking_commands;
pub mod clustering_commands;
pub mod facenet_commands;
pub mod mediapipe_commands;
pub mod person_commands;
pub mod privacy_commands;
pub mod realtime_face_detection_commands;
pub mod retinaface_commands;
pub mod yolo_commands;

use anyhow::Result;
use serde_json::Value;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, State};

use crate::recognition::recognition_service::{RecognitionEvent, RecognitionService};
use crate::recognition::types::RecognitionResults;

/// State для сервиса распознавания
pub struct RecognitionState {
  pub service: RecognitionService,
}

impl Default for RecognitionState {
  fn default() -> Self {
    // This is a blocking call for Default, which is not ideal
    // but we'll use a temporary directory as fallback
    let base_dir = std::env::temp_dir().join("timeline-studio");

    // Use a simple sync initialization for Default
    let service = match tauri::async_runtime::block_on(RecognitionService::new(base_dir)) {
      Ok(s) => s,
      Err(e) => {
        log::warn!("Failed to create RecognitionService in Default: {}", e);
        panic!("Cannot create RecognitionService");
      }
    };

    Self { service }
  }
}

impl RecognitionState {
  /// Создать новое состояние распознавания
  pub async fn new(base_dir: PathBuf) -> Self {
    let service = match RecognitionService::new(base_dir).await {
      Ok(s) => s,
      Err(e) => {
        log::warn!("Failed to create RecognitionService: {}", e);
        log::warn!("Using fallback temporary directory");
        RecognitionService::new(std::env::temp_dir().join("timeline-studio"))
          .await
          .expect("Failed to create fallback RecognitionService")
      }
    };

    Self { service }
  }
}

/// Обработать видео и распознать объекты/лица
#[tauri::command]
pub async fn process_video_recognition<R: tauri::Runtime>(
  app: AppHandle<R>,
  state: State<'_, RecognitionState>,
  file_id: String,
  frame_paths: Vec<String>,
) -> Result<RecognitionResults, String> {
  // Отправляем событие о начале
  app
    .emit(
      "recognition",
      RecognitionEvent::ProcessingStarted {
        file_id: file_id.clone(),
      },
    )
    .map_err(|e| e.to_string())?;

  // Преобразуем пути из String в PathBuf
  let paths: Vec<std::path::PathBuf> = frame_paths
    .into_iter()
    .map(std::path::PathBuf::from)
    .collect();

  // Обрабатываем видео
  match state.service.process_video(&file_id, paths).await {
    Ok(results) => {
      // Отправляем событие о завершении
      app
        .emit(
          "recognition",
          RecognitionEvent::ProcessingCompleted {
            file_id: file_id.clone(),
            results: results.clone(),
          },
        )
        .map_err(|e| e.to_string())?;

      Ok(results)
    }
    Err(e) => {
      // Отправляем событие об ошибке
      app
        .emit(
          "recognition",
          RecognitionEvent::ProcessingError {
            file_id,
            error: e.to_string(),
          },
        )
        .map_err(|e| e.to_string())?;

      Err(e.to_string())
    }
  }
}

// Временно отключено - требует frame_paths для каждого файла
/*
/// Обработать несколько видео пакетом
#[tauri::command]
pub async fn process_batch_recognition(
    app: AppHandle,
    state: State<'_, RecognitionState>,
    file_ids: Vec<String>,
) -> Result<Vec<(String, RecognitionResults)>, String> {
    let total = file_ids.len();
    let mut results = Vec::new();

    for (idx, file_id) in file_ids.iter().enumerate() {
        // Отправляем прогресс
        app.emit("recognition", RecognitionEvent::ProcessingProgress {
            file_id: file_id.clone(),
            current: idx + 1,
            total,
        }).map_err(|e| e.to_string())?;

        match state.service.process_video(file_id).await {
            Ok(recognition_results) => {
                results.push((file_id.clone(), recognition_results));
            },
            Err(e) => {
                eprintln!("Failed to process {}: {}", file_id, e);
            }
        }
    }

    Ok(results)
}
*/

/// Обработать пакет видео (множественная обработка)
#[tauri::command]
pub async fn process_video_batch(
  file_ids: Vec<String>,
  frame_paths_map: std::collections::HashMap<String, Vec<std::path::PathBuf>>,
  state: State<'_, RecognitionState>,
) -> Result<Vec<(String, RecognitionResults)>, String> {
  let service = &state.service;

  log::info!(
    "Начато пакетное распознавание для {} файлов",
    file_ids.len()
  );

  match service.process_batch(file_ids, frame_paths_map).await {
    Ok(results) => {
      log::info!(
        "Пакетное распознавание завершено. Обработано {} файлов",
        results.len()
      );
      Ok(results)
    }
    Err(e) => {
      log::error!("Ошибка пакетного распознавания: {e}");
      Err(format!("Ошибка пакетного распознавания: {e}"))
    }
  }
}

/// Получить результаты распознавания для файла
#[tauri::command]
pub async fn get_recognition_results(
  state: State<'_, RecognitionState>,
  file_id: String,
) -> Result<Option<RecognitionResults>, String> {
  state
    .service
    .load_results(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить данные превью с результатами распознавания
#[tauri::command]
pub async fn get_preview_data_with_recognition(
  _state: State<'_, RecognitionState>,
  file_id: String,
) -> Result<Value, String> {
  // Эта команда возвращает полные данные превью включая результаты распознавания
  // В реальной реализации нужно добавить доступ к PreviewDataManager

  Ok(serde_json::json!({
      "file_id": file_id,
      "message": "This command needs PreviewDataManager integration"
  }))
}

/// Загрузить модель YOLO для объектов (для администрирования)
#[tauri::command]
pub async fn load_yolo_model(state: State<'_, RecognitionState>) -> Result<(), String> {
  state
    .service
    .load_object_model()
    .await
    .map_err(|e| format!("Ошибка загрузки модели YOLO: {e}"))?;

  log::info!("Модель YOLO для объектов загружена успешно");
  Ok(())
}

/// Установить целевые классы для распознавания объектов
#[tauri::command]
pub async fn set_yolo_target_classes(
  classes: Vec<String>,
  state: State<'_, RecognitionState>,
) -> Result<(), String> {
  state.service.set_object_classes(classes.clone()).await;

  log::info!("Установлены целевые классы для объектов: {classes:?}");
  Ok(())
}

/// Получить список доступных классов YOLO для объектов
#[tauri::command]
pub async fn get_yolo_class_names(
  state: State<'_, RecognitionState>,
) -> Result<Vec<String>, String> {
  let class_names = state.service.get_object_classes().await;

  log::debug!("Возвращено {} классов YOLO для объектов", class_names.len());
  Ok(class_names)
}

/// Пакетная обработка изображений YOLO для объектов
#[tauri::command]
pub async fn process_yolo_batch(
  image_paths: Vec<String>,
  state: State<'_, RecognitionState>,
) -> Result<Vec<Vec<crate::recognition::Detection>>, String> {
  let paths: Vec<std::path::PathBuf> = image_paths.iter().map(std::path::PathBuf::from).collect();

  state
    .service
    .process_objects_batch(paths)
    .await
    .map_err(|e| format!("Ошибка пакетной обработки YOLO для объектов: {e}"))
}

/// Очистить результаты распознавания
#[tauri::command]
pub async fn clear_recognition_results(
  _state: State<'_, RecognitionState>,
  _file_id: String,
) -> Result<(), String> {
  // В реальной реализации здесь бы очищались результаты
  Ok(())
}

/// Экспортировать результаты распознавания
#[tauri::command]
pub async fn export_recognition_results(
  state: State<'_, RecognitionState>,
  file_id: String,
  format: String,
) -> Result<String, String> {
  let results = state
    .service
    .load_results(&file_id)
    .await
    .map_err(|e| e.to_string())?;

  if let Some(results) = results {
    match format.as_str() {
      "json" => serde_json::to_string_pretty(&results).map_err(|e| e.to_string()),
      "csv" => {
        // Простой CSV экспорт
        let mut csv = String::from("Type,Class,Confidence,Timestamp\n");

        for obj in &results.objects {
          for timestamp in &obj.timestamps {
            csv.push_str(&format!(
              "Object,{},{:.2},{:.2}\n",
              obj.class, obj.confidence, timestamp
            ));
          }
        }

        for face in &results.faces {
          for timestamp in &face.timestamps {
            csv.push_str(&format!(
              "Face,{},{:.2},{:.2}\n",
              face.face_id.as_ref().unwrap_or(&"unknown".to_string()),
              face.confidence,
              timestamp
            ));
          }
        }

        Ok(csv)
      }
      _ => Err("Unsupported format".to_string()),
    }
  } else {
    Err("No results found".to_string())
  }
}

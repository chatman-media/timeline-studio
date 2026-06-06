//! Model Manager - Управление YOLO моделями

use anyhow::{anyhow, Result};
use ort::session::{builder::GraphOptimizationLevel, Session};
use serde::{Deserialize, Serialize};
use std::mem::ManuallyDrop;
use std::path::PathBuf;

use super::ort_manager::OrtManager;

/// Поддерживаемые модели YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum YoloModel {
  // YOLOv11 модели
  /// YOLOv11 для обнаружения объектов
  YoloV11Detection,
  /// YOLOv11 для сегментации
  YoloV11Segmentation,
  /// YOLOv11 для обнаружения лиц
  YoloV11Face,

  // YOLOv8 базовые модели (legacy)
  /// YOLOv8 для обнаружения объектов (legacy)
  YoloV8Detection,
  /// YOLOv8 для сегментации (legacy)
  YoloV8Segmentation,
  /// YOLOv8 для обнаружения лиц (legacy)
  YoloV8Face,

  // YOLOv8 размерные варианты (для совместимости)
  /// YOLOv8n - Nano (самая быстрая)
  YoloV8Nano,
  /// YOLOv8s - Small
  YoloV8Small,
  /// YOLOv8m - Medium
  YoloV8Medium,
  /// YOLOv8l - Large
  YoloV8Large,
  /// YOLOv8x - Extra Large (самая точная)
  YoloV8Extra,

  /// Пользовательская модель
  Custom(PathBuf),
}

impl YoloModel {
  /// Получить путь к файлу модели
  pub fn get_model_path(&self) -> Result<PathBuf> {
    match self {
      YoloModel::YoloV11Detection => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolo11n.onnx");
        Ok(path)
      }
      YoloModel::YoloV11Segmentation => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolo11n-seg.onnx");
        Ok(path)
      }
      YoloModel::YoloV11Face => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolo11n-face.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Detection => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8n.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Segmentation => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8n-seg.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Face => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8n-face.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Nano => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8n.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Small => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8s.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Medium => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8m.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Large => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8l.onnx");
        Ok(path)
      }
      YoloModel::YoloV8Extra => {
        let path = dirs::data_local_dir()
          .ok_or_else(|| anyhow!("Failed to get local data directory"))?
          .join("timeline-studio")
          .join("models")
          .join("yolov8x.onnx");
        Ok(path)
      }
      YoloModel::Custom(path) => Ok(path.clone()),
    }
  }

  /// Проверить, является ли модель моделью для лиц
  pub fn is_face_model(&self) -> bool {
    matches!(self, YoloModel::YoloV11Face | YoloModel::YoloV8Face)
  }

  /// Проверить, является ли модель моделью для сегментации
  pub fn is_segmentation_model(&self) -> bool {
    matches!(
      self,
      YoloModel::YoloV11Segmentation | YoloModel::YoloV8Segmentation
    )
  }
}

/// Менеджер моделей
///
/// ВАЖНО: Session обернута в ManuallyDrop чтобы предотвратить вызов деструктора
/// при завершении приложения. Это необходимо для избежания ошибок mutex
/// в ONNX Runtime при глобальной деструкции C++ объектов.
pub struct ModelManager {
  session: Option<ManuallyDrop<Session>>,
  model_type: YoloModel,
}

impl Drop for ModelManager {
  fn drop(&mut self) {
    // Явно leak сессию, чтобы её деструктор НИКОГДА не вызывался.
    // Это критически важно для избежания SIGABRT при завершении приложения,
    // когда ONNX Runtime пытается очистить уже очищенные ресурсы.
    // ManuallyDrop::drop не вызывается автоматически, но мы должны убедиться,
    // что даже при явном drop'е сессия не будет уничтожена.
    if let Some(_session) = self.session.take() {
      // Ничего не делаем - ManuallyDrop предотвращает вызов деструктора автоматически
      // Сессия leak'нется вместе с ONNX Environment
    }
  }
}

impl ModelManager {
  /// Создать новый менеджер моделей
  pub fn new(model_type: YoloModel) -> Result<Self> {
    OrtManager::ensure_initialized()?;
    Ok(Self {
      session: None,
      model_type,
    })
  }

  /// Загрузить модель
  pub async fn load_model(&mut self) -> Result<()> {
    let model_path = self.model_type.get_model_path()?;

    if !model_path.exists() {
      return Err(anyhow!(
        "Model file not found at {:?}. Please download the model first.",
        model_path
      ));
    }

    // Создаем сессию ONNX Runtime
    let session = Session::builder()?
      .with_optimization_level(GraphOptimizationLevel::Level3)?
      .with_intra_threads(4)?
      .commit_from_file(&model_path)?;

    // Оборачиваем в ManuallyDrop чтобы предотвратить вызов деструктора
    // при завершении приложения и избежать ошибок mutex в ONNX Runtime
    self.session = Some(ManuallyDrop::new(session));
    Ok(())
  }

  /// Получить сессию
  pub fn get_session(&self) -> Result<&Session> {
    self
      .session
      .as_deref() // Deref ManuallyDrop to get &Session
      .ok_or_else(|| anyhow!("Model not loaded. Call load_model() first."))
  }

  /// Получить изменяемую сессию
  pub fn get_session_mut(&mut self) -> Result<&mut Session> {
    self
      .session
      .as_deref_mut() // Deref ManuallyDrop to get &mut Session
      .ok_or_else(|| anyhow!("Model not loaded. Call load_model() first."))
  }

  /// Получить тип модели
  pub fn get_model_type(&self) -> &YoloModel {
    &self.model_type
  }

  /// Проверить, загружена ли модель
  pub fn is_loaded(&self) -> bool {
    self.session.is_some()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_model_type_face_detection() {
    assert!(YoloModel::YoloV11Face.is_face_model());
    assert!(YoloModel::YoloV8Face.is_face_model());
    assert!(!YoloModel::YoloV11Detection.is_face_model());
  }

  #[test]
  fn test_model_type_segmentation() {
    assert!(YoloModel::YoloV11Segmentation.is_segmentation_model());
    assert!(YoloModel::YoloV8Segmentation.is_segmentation_model());
    assert!(!YoloModel::YoloV11Detection.is_segmentation_model());
  }
}

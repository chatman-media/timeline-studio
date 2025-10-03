//! Model Manager - Управление YOLO моделями

use anyhow::{anyhow, Result};
use ort::session::{builder::GraphOptimizationLevel, Session};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use super::ort_manager::OrtManager;

/// Поддерживаемые модели YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum YoloModel {
  /// YOLOv11 для обнаружения объектов
  YoloV11Detection,
  /// YOLOv11 для сегментации
  YoloV11Segmentation,
  /// YOLOv11 для обнаружения лиц
  YoloV11Face,
  /// YOLOv8 для обнаружения объектов (legacy)
  YoloV8Detection,
  /// YOLOv8 для сегментации (legacy)
  YoloV8Segmentation,
  /// YOLOv8 для обнаружения лиц (legacy)
  YoloV8Face,
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
pub struct ModelManager {
  session: Option<Session>,
  model_type: YoloModel,
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

    self.session = Some(session);
    Ok(())
  }

  /// Получить сессию
  pub fn get_session(&self) -> Result<&Session> {
    self
      .session
      .as_ref()
      .ok_or_else(|| anyhow!("Model not loaded. Call load_model() first."))
  }

  /// Получить изменяемую сессию
  pub fn get_session_mut(&mut self) -> Result<&mut Session> {
    self
      .session
      .as_mut()
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

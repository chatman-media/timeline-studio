/**
 * Configuration for ML models paths and settings
 */
use std::path::PathBuf;

/// Конфигурация путей к ML моделям
pub struct ModelsConfig {
  pub models_dir: PathBuf,
  pub yolo_models: YoloModelsConfig,
  pub facenet_models: FaceNetModelsConfig,
  pub retinaface_models: RetinaFaceModelsConfig,
  pub mediapipe_models: MediaPipeModelsConfig,
}

/// Конфигурация YOLO моделей
pub struct YoloModelsConfig {
  // YOLOv8 модели для объектов
  pub yolo_v8_nano: PathBuf,
  pub yolo_v8_small: PathBuf,
  pub yolo_v8_medium: PathBuf,
  pub yolo_v8_large: PathBuf,
  pub yolo_v8_extra: PathBuf,

  // YOLOv8 модели для лиц
  pub yolo_v8_face_nano: PathBuf,
  pub yolo_v8_face_small: PathBuf,
  pub yolo_v8_face_medium: PathBuf,
  pub yolo_v8_face_large: PathBuf,
  pub yolo_v8_face_extra: PathBuf,

  // YOLOv11 модели для объектов
  pub yolo_v11_nano: PathBuf,
  pub yolo_v11_small: PathBuf,
  pub yolo_v11_medium: PathBuf,
  pub yolo_v11_large: PathBuf,
  pub yolo_v11_extra: PathBuf,

  // YOLOv11 модели для лиц
  pub yolo_v11_face_nano: PathBuf,
  pub yolo_v11_face_small: PathBuf,
  pub yolo_v11_face_medium: PathBuf,
  pub yolo_v11_face_large: PathBuf,
  pub yolo_v11_face_extra: PathBuf,
}

/// Конфигурация FaceNet моделей
pub struct FaceNetModelsConfig {
  pub facenet_512d: PathBuf,
  pub facenet_128d: PathBuf,
  pub arcface_512d: PathBuf,
}

/// Конфигурация RetinaFace моделей
pub struct RetinaFaceModelsConfig {
  pub retinaface_r50: PathBuf,
  pub retinaface_mobile: PathBuf,
  pub retinaface_r50_enhanced: PathBuf,
}

/// Конфигурация MediaPipe моделей
pub struct MediaPipeModelsConfig {
  pub blazeface_short: PathBuf,
  pub blazeface_full: PathBuf,
  pub face_mesh: PathBuf,
  pub face_mesh_attention: PathBuf,
  pub selfie_segmentation: PathBuf,
  pub selfie_segmentation_landscape: PathBuf,
}

impl Default for ModelsConfig {
  fn default() -> Self {
    let models_dir = PathBuf::from("models");

    Self {
      yolo_models: YoloModelsConfig {
        // YOLOv8 модели для объектов
        yolo_v8_nano: models_dir.join("yolo/yolov8n.onnx"),
        yolo_v8_small: models_dir.join("yolo/yolov8s.onnx"),
        yolo_v8_medium: models_dir.join("yolo/yolov8m.onnx"),
        yolo_v8_large: models_dir.join("yolo/yolov8l.onnx"),
        yolo_v8_extra: models_dir.join("yolo/yolov8x.onnx"),

        // YOLOv8 модели для лиц
        yolo_v8_face_nano: models_dir.join("yolo/yolov8n-face.onnx"),
        yolo_v8_face_small: models_dir.join("yolo/yolov8s-face.onnx"),
        yolo_v8_face_medium: models_dir.join("yolo/yolov8m-face.onnx"),
        yolo_v8_face_large: models_dir.join("yolo/yolov8l-face.onnx"),
        yolo_v8_face_extra: models_dir.join("yolo/yolov8x-face.onnx"),

        // YOLOv11 модели для объектов
        yolo_v11_nano: models_dir.join("yolo/yolov11n.onnx"),
        yolo_v11_small: models_dir.join("yolo/yolov11s.onnx"),
        yolo_v11_medium: models_dir.join("yolo/yolov11m.onnx"),
        yolo_v11_large: models_dir.join("yolo/yolov11l.onnx"),
        yolo_v11_extra: models_dir.join("yolo/yolov11x.onnx"),

        // YOLOv11 модели для лиц
        yolo_v11_face_nano: models_dir.join("yolo/yolov11n-face.onnx"),
        yolo_v11_face_small: models_dir.join("yolo/yolov11s-face.onnx"),
        yolo_v11_face_medium: models_dir.join("yolo/yolov11m-face.onnx"),
        yolo_v11_face_large: models_dir.join("yolo/yolov11l-face.onnx"),
        yolo_v11_face_extra: models_dir.join("yolo/yolov11x-face.onnx"),
      },
      facenet_models: FaceNetModelsConfig {
        facenet_512d: models_dir.join("facenet/facenet-512d.onnx"),
        facenet_128d: models_dir.join("facenet/facenet-128d.onnx"),
        arcface_512d: models_dir.join("facenet/arcface-512d.onnx"),
      },
      retinaface_models: RetinaFaceModelsConfig {
        retinaface_r50: models_dir.join("retinaface/retinaface-r50.onnx"),
        retinaface_mobile: models_dir.join("retinaface/retinaface-mobile.onnx"),
        retinaface_r50_enhanced: models_dir.join("retinaface/retinaface-r50-enhanced.onnx"),
      },
      mediapipe_models: MediaPipeModelsConfig {
        blazeface_short: models_dir.join("mediapipe/blazeface-short.onnx"),
        blazeface_full: models_dir.join("mediapipe/blazeface-full.onnx"),
        face_mesh: models_dir.join("mediapipe/face-mesh.onnx"),
        face_mesh_attention: models_dir.join("mediapipe/face-mesh-attention.onnx"),
        selfie_segmentation: models_dir.join("mediapipe/selfie-segmentation.onnx"),
        selfie_segmentation_landscape: models_dir
          .join("mediapipe/selfie-segmentation-landscape.onnx"),
      },
      models_dir,
    }
  }
}

impl ModelsConfig {
  /// Создать конфигурацию с базовой директорией
  pub fn new(base_dir: PathBuf) -> Self {
    let models_dir = base_dir.join("models");

    Self {
      yolo_models: YoloModelsConfig {
        // YOLOv8 модели для объектов
        yolo_v8_nano: models_dir.join("yolo/yolov8n.onnx"),
        yolo_v8_small: models_dir.join("yolo/yolov8s.onnx"),
        yolo_v8_medium: models_dir.join("yolo/yolov8m.onnx"),
        yolo_v8_large: models_dir.join("yolo/yolov8l.onnx"),
        yolo_v8_extra: models_dir.join("yolo/yolov8x.onnx"),

        // YOLOv8 модели для лиц
        yolo_v8_face_nano: models_dir.join("yolo/yolov8n-face.onnx"),
        yolo_v8_face_small: models_dir.join("yolo/yolov8s-face.onnx"),
        yolo_v8_face_medium: models_dir.join("yolo/yolov8m-face.onnx"),
        yolo_v8_face_large: models_dir.join("yolo/yolov8l-face.onnx"),
        yolo_v8_face_extra: models_dir.join("yolo/yolov8x-face.onnx"),

        // YOLOv11 модели для объектов
        yolo_v11_nano: models_dir.join("yolo/yolov11n.onnx"),
        yolo_v11_small: models_dir.join("yolo/yolov11s.onnx"),
        yolo_v11_medium: models_dir.join("yolo/yolov11m.onnx"),
        yolo_v11_large: models_dir.join("yolo/yolov11l.onnx"),
        yolo_v11_extra: models_dir.join("yolo/yolov11x.onnx"),

        // YOLOv11 модели для лиц
        yolo_v11_face_nano: models_dir.join("yolo/yolov11n-face.onnx"),
        yolo_v11_face_small: models_dir.join("yolo/yolov11s-face.onnx"),
        yolo_v11_face_medium: models_dir.join("yolo/yolov11m-face.onnx"),
        yolo_v11_face_large: models_dir.join("yolo/yolov11l-face.onnx"),
        yolo_v11_face_extra: models_dir.join("yolo/yolov11x-face.onnx"),
      },
      facenet_models: FaceNetModelsConfig {
        facenet_512d: models_dir.join("facenet/facenet-512d.onnx"),
        facenet_128d: models_dir.join("facenet/facenet-128d.onnx"),
        arcface_512d: models_dir.join("facenet/arcface-512d.onnx"),
      },
      retinaface_models: RetinaFaceModelsConfig {
        retinaface_r50: models_dir.join("retinaface/retinaface-r50.onnx"),
        retinaface_mobile: models_dir.join("retinaface/retinaface-mobile.onnx"),
        retinaface_r50_enhanced: models_dir.join("retinaface/retinaface-r50-enhanced.onnx"),
      },
      mediapipe_models: MediaPipeModelsConfig {
        blazeface_short: models_dir.join("mediapipe/blazeface-short.onnx"),
        blazeface_full: models_dir.join("mediapipe/blazeface-full.onnx"),
        face_mesh: models_dir.join("mediapipe/face-mesh.onnx"),
        face_mesh_attention: models_dir.join("mediapipe/face-mesh-attention.onnx"),
        selfie_segmentation: models_dir.join("mediapipe/selfie-segmentation.onnx"),
        selfie_segmentation_landscape: models_dir
          .join("mediapipe/selfie-segmentation-landscape.onnx"),
      },
      models_dir,
    }
  }

  /// Проверить существование всех моделей
  #[allow(dead_code)]
  pub fn validate_models(&self) -> Result<(), String> {
    let models_to_check = [
      // YOLOv8 объекты
      ("YOLOv8n", &self.yolo_models.yolo_v8_nano),
      ("YOLOv8s", &self.yolo_models.yolo_v8_small),
      ("YOLOv8m", &self.yolo_models.yolo_v8_medium),
      ("YOLOv8l", &self.yolo_models.yolo_v8_large),
      ("YOLOv8x", &self.yolo_models.yolo_v8_extra),
      // YOLOv8 лица
      ("YOLOv8n-Face", &self.yolo_models.yolo_v8_face_nano),
      ("YOLOv8s-Face", &self.yolo_models.yolo_v8_face_small),
      ("YOLOv8m-Face", &self.yolo_models.yolo_v8_face_medium),
      ("YOLOv8l-Face", &self.yolo_models.yolo_v8_face_large),
      ("YOLOv8x-Face", &self.yolo_models.yolo_v8_face_extra),
      // YOLOv11 объекты
      ("YOLOv11n", &self.yolo_models.yolo_v11_nano),
      ("YOLOv11s", &self.yolo_models.yolo_v11_small),
      ("YOLOv11m", &self.yolo_models.yolo_v11_medium),
      ("YOLOv11l", &self.yolo_models.yolo_v11_large),
      ("YOLOv11x", &self.yolo_models.yolo_v11_extra),
      // YOLOv11 лица
      ("YOLOv11n-Face", &self.yolo_models.yolo_v11_face_nano),
      ("YOLOv11s-Face", &self.yolo_models.yolo_v11_face_small),
      ("YOLOv11m-Face", &self.yolo_models.yolo_v11_face_medium),
      ("YOLOv11l-Face", &self.yolo_models.yolo_v11_face_large),
      ("YOLOv11x-Face", &self.yolo_models.yolo_v11_face_extra),
      // FaceNet модели
      ("FaceNet 512D", &self.facenet_models.facenet_512d),
      ("FaceNet 128D", &self.facenet_models.facenet_128d),
      ("ArcFace 512D", &self.facenet_models.arcface_512d),
      // RetinaFace модели
      ("RetinaFace R50", &self.retinaface_models.retinaface_r50),
      (
        "RetinaFace Mobile",
        &self.retinaface_models.retinaface_mobile,
      ),
      (
        "RetinaFace R50 Enhanced",
        &self.retinaface_models.retinaface_r50_enhanced,
      ),
      // MediaPipe модели
      ("BlazeFace Short", &self.mediapipe_models.blazeface_short),
      ("BlazeFace Full", &self.mediapipe_models.blazeface_full),
      ("Face Mesh", &self.mediapipe_models.face_mesh),
      (
        "Face Mesh Attention",
        &self.mediapipe_models.face_mesh_attention,
      ),
      (
        "Selfie Segmentation",
        &self.mediapipe_models.selfie_segmentation,
      ),
      (
        "Selfie Segmentation Landscape",
        &self.mediapipe_models.selfie_segmentation_landscape,
      ),
    ];

    let mut missing_models = Vec::new();

    for (name, path) in models_to_check {
      if !path.exists() {
        missing_models.push(format!("{}: {}", name, path.display()));
      }
    }

    if !missing_models.is_empty() {
      return Err(format!(
        "Missing model files:\n{}",
        missing_models.join("\n")
      ));
    }

    Ok(())
  }

  /// Получить путь к YOLO модели по типу
  pub fn get_yolo_model_path(&self, model_type: &str) -> Option<&PathBuf> {
    match model_type {
      // YOLOv8 объекты
      "yolov8n" | "yolo-v8-nano" => Some(&self.yolo_models.yolo_v8_nano),
      "yolov8s" | "yolo-v8-small" => Some(&self.yolo_models.yolo_v8_small),
      "yolov8m" | "yolo-v8-medium" => Some(&self.yolo_models.yolo_v8_medium),
      "yolov8l" | "yolo-v8-large" => Some(&self.yolo_models.yolo_v8_large),
      "yolov8x" | "yolo-v8-extra" => Some(&self.yolo_models.yolo_v8_extra),

      // YOLOv8 лица
      "yolov8n-face" | "yolo-v8-face-nano" => Some(&self.yolo_models.yolo_v8_face_nano),
      "yolov8s-face" | "yolo-v8-face-small" => Some(&self.yolo_models.yolo_v8_face_small),
      "yolov8m-face" | "yolo-v8-face-medium" => Some(&self.yolo_models.yolo_v8_face_medium),
      "yolov8l-face" | "yolo-v8-face-large" => Some(&self.yolo_models.yolo_v8_face_large),
      "yolov8x-face" | "yolo-v8-face-extra" => Some(&self.yolo_models.yolo_v8_face_extra),

      // YOLOv11 объекты
      "yolov11n" | "yolo-v11-nano" => Some(&self.yolo_models.yolo_v11_nano),
      "yolov11s" | "yolo-v11-small" => Some(&self.yolo_models.yolo_v11_small),
      "yolov11m" | "yolo-v11-medium" => Some(&self.yolo_models.yolo_v11_medium),
      "yolov11l" | "yolo-v11-large" => Some(&self.yolo_models.yolo_v11_large),
      "yolov11x" | "yolo-v11-extra" => Some(&self.yolo_models.yolo_v11_extra),

      // YOLOv11 лица
      "yolov11n-face" | "yolo-v11-face-nano" => Some(&self.yolo_models.yolo_v11_face_nano),
      "yolov11s-face" | "yolo-v11-face-small" => Some(&self.yolo_models.yolo_v11_face_small),
      "yolov11m-face" | "yolo-v11-face-medium" => Some(&self.yolo_models.yolo_v11_face_medium),
      "yolov11l-face" | "yolo-v11-face-large" => Some(&self.yolo_models.yolo_v11_face_large),
      "yolov11x-face" | "yolo-v11-face-extra" => Some(&self.yolo_models.yolo_v11_face_extra),

      // Обратная совместимость
      "yolo-face-v8" => Some(&self.yolo_models.yolo_v8_face_nano),
      "yolo-face-v11" => Some(&self.yolo_models.yolo_v11_face_nano),
      "yolo-object" => Some(&self.yolo_models.yolo_v8_nano),

      _ => None,
    }
  }

  /// Получить путь к FaceNet модели по типу
  pub fn get_facenet_model_path(&self, model_type: &str) -> Option<&PathBuf> {
    match model_type {
      "facenet-512d" => Some(&self.facenet_models.facenet_512d),
      "facenet-128d" => Some(&self.facenet_models.facenet_128d),
      "arcface-512d" => Some(&self.facenet_models.arcface_512d),
      _ => None,
    }
  }

  /// Получить путь к RetinaFace модели по типу
  pub fn get_retinaface_model_path(&self, model_type: &str) -> Option<&PathBuf> {
    match model_type {
      "retinaface-r50" | "retinaface-resnet50" => Some(&self.retinaface_models.retinaface_r50),
      "retinaface-mobile" | "retinaface-mobilenet" => {
        Some(&self.retinaface_models.retinaface_mobile)
      }
      "retinaface-r50-enhanced" | "retinaface-enhanced" => {
        Some(&self.retinaface_models.retinaface_r50_enhanced)
      }
      _ => None,
    }
  }

  /// Получить путь к MediaPipe модели по типу
  pub fn get_mediapipe_model_path(&self, model_type: &str) -> Option<&PathBuf> {
    match model_type {
      "blazeface-short" | "blazeface_short" => Some(&self.mediapipe_models.blazeface_short),
      "blazeface-full" | "blazeface_full" => Some(&self.mediapipe_models.blazeface_full),
      "face-mesh" | "face_mesh" => Some(&self.mediapipe_models.face_mesh),
      "face-mesh-attention" | "face_mesh_attention" => {
        Some(&self.mediapipe_models.face_mesh_attention)
      }
      "selfie-segmentation" | "selfie_segmentation" => {
        Some(&self.mediapipe_models.selfie_segmentation)
      }
      "selfie-segmentation-landscape" | "selfie_segmentation_landscape" => {
        Some(&self.mediapipe_models.selfie_segmentation_landscape)
      }
      _ => None,
    }
  }

  /// Создать директории для моделей если они не существуют
  pub fn ensure_model_directories(&self) -> Result<(), std::io::Error> {
    std::fs::create_dir_all(self.models_dir.join("yolo"))?;
    std::fs::create_dir_all(self.models_dir.join("facenet"))?;
    std::fs::create_dir_all(self.models_dir.join("retinaface"))?;
    std::fs::create_dir_all(self.models_dir.join("mediapipe"))?;
    Ok(())
  }
}

/// Глобальная конфигурация моделей
static mut GLOBAL_MODELS_CONFIG: Option<ModelsConfig> = None;

/// Инициализировать глобальную конфигурацию моделей
pub fn initialize_models_config(app_dir: PathBuf) -> Result<(), String> {
  unsafe {
    let config = ModelsConfig::new(app_dir);
    config
      .ensure_model_directories()
      .map_err(|e| format!("Failed to create model directories: {}", e))?;
    GLOBAL_MODELS_CONFIG = Some(config);
  }
  Ok(())
}

/// Получить глобальную конфигурацию моделей
#[allow(static_mut_refs)]
pub fn get_models_config() -> Result<&'static ModelsConfig, String> {
  unsafe {
    GLOBAL_MODELS_CONFIG
      .as_ref()
      .ok_or_else(|| "Models config not initialized".to_string())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_models_config_creation() {
    let temp_dir = std::env::temp_dir().join("test_models");
    let config = ModelsConfig::new(temp_dir.clone());

    assert_eq!(config.models_dir, temp_dir.join("models"));
    assert!(config
      .yolo_models
      .yolo_v8_face_nano
      .to_string_lossy()
      .contains("yolov8n-face.onnx"));
    assert!(config
      .facenet_models
      .facenet_512d
      .to_string_lossy()
      .contains("facenet-512d.onnx"));
  }

  #[test]
  fn test_model_path_resolution() {
    let config = ModelsConfig::default();

    assert!(config.get_yolo_model_path("yolo-face-v8").is_some());
    assert!(config.get_yolo_model_path("invalid").is_none());

    assert!(config.get_facenet_model_path("facenet-512d").is_some());
    assert!(config.get_facenet_model_path("invalid").is_none());

    assert!(config.get_retinaface_model_path("retinaface-r50").is_some());
    assert!(config.get_retinaface_model_path("invalid").is_none());

    assert!(config.get_mediapipe_model_path("blazeface-short").is_some());
    assert!(config.get_mediapipe_model_path("face-mesh").is_some());
    assert!(config.get_mediapipe_model_path("invalid").is_none());
  }
}

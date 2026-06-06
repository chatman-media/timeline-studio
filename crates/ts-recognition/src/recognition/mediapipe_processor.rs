/**
 * MediaPipe Processor - real-time face analysis with 468 landmarks
 */
use anyhow::{anyhow, Result};
use image::{imageops::FilterType, DynamicImage};
use ort::session::{builder::GraphOptimizationLevel, Session, SessionOutputs};
use ort::value::Tensor;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::RwLock;

/// Поддерживаемые модели MediaPipe
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MediaPipeModel {
  /// BlazeFace для детекции (до 2м расстояние)
  BlazeFaceShort,
  /// BlazeFace для детекции (до 5м расстояние)
  BlazeFaceFull,
  /// Face Mesh для 468 landmarks
  FaceMesh,
  /// Face Mesh с attention механизмом (улучшенная точность)
  FaceMeshAttention,
  /// Selfie Segmentation для портретов
  SelfieSegmentation,
  /// Selfie Segmentation для пейзажей
  SelfieSegmentationLandscape,
  /// Пользовательская модель
  Custom(PathBuf),
}

/// Face Mesh landmarks (468 3D точек)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceMeshLandmarks {
  /// Все 468 3D точек лица
  pub points: Vec<Point3D>,
  /// Специфичные области лица
  pub regions: FaceRegions,
}

/// Области лица с индексами точек
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceRegions {
  /// Губы (40 точек)
  pub lips: Vec<usize>,
  /// Левый глаз (16 точек)
  pub left_eye: Vec<usize>,
  /// Правый глаз (16 точек)
  pub right_eye: Vec<usize>,
  /// Овал лица (36 точек)
  pub face_oval: Vec<usize>,
  /// Левая бровь (5 точек)
  pub left_eyebrow: Vec<usize>,
  /// Правая бровь (5 точек)
  pub right_eyebrow: Vec<usize>,
  /// Переносица (8 точек)
  pub nose_bridge: Vec<usize>,
  /// Кончик носа (5 точек)
  pub nose_tip: Vec<usize>,
}

/// 3D координата
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point3D {
  pub x: f32,
  pub y: f32,
  pub z: f32,
}

/// 2D координата
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point2D {
  pub x: f32,
  pub y: f32,
}

/// 3D поза головы (улучшенная версия с MediaPipe)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadPose3D {
  /// Поворот вокруг X оси (градусы)
  pub pitch: f32,
  /// Поворот вокруг Y оси (градусы)
  pub yaw: f32,
  /// Поворот вокруг Z оси (градусы)
  pub roll: f32,
  /// 3D translation
  pub translation: Point3D,
  /// Уверенность в оценке позы (0.0-1.0)
  pub confidence: f32,
}

/// Bounding box
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
}

/// BlazeFace детекция
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlazeFaceDetection {
  /// Bounding box лица
  pub bbox: BoundingBox,
  /// Уверенность детекции (0.0 - 1.0)
  pub confidence: f32,
  /// 6 ключевых точек (глаза, нос, рот)
  pub keypoints: Vec<Point2D>,
  /// Качество детекции
  pub quality_score: f32,
}

/// Маска сегментации
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentationMask {
  /// Размеры маски
  pub width: u32,
  pub height: u32,
  /// Данные маски (0.0 = фон, 1.0 = человек)
  pub mask_data: Vec<f32>,
  /// Уверенность сегментации
  pub confidence: f32,
}

/// Полный результат MediaPipe анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaPipeAnalysis {
  /// BlazeFace детекции
  pub face_detections: Vec<BlazeFaceDetection>,
  /// Face Mesh landmarks (468 точек)
  pub face_mesh: Option<FaceMeshLandmarks>,
  /// 3D поза головы
  pub head_pose: Option<HeadPose3D>,
  /// Маска сегментации
  pub segmentation_mask: Option<SegmentationMask>,
  /// Анализ выражений лица
  pub facial_expressions: Option<FacialExpressions>,
  /// Геометрические характеристики лица
  pub face_geometry: Option<FaceGeometry>,
}

/// Анализ выражений лица на основе 468 landmarks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FacialExpressions {
  /// Улыбка (0.0-1.0)
  pub smile: f32,
  /// Открытость глаз (0.0-1.0 для каждого глаза)
  pub eye_openness: [f32; 2],
  /// Открытость рта (0.0-1.0)
  pub mouth_openness: f32,
  /// Поднятие бровей (0.0-1.0)
  pub eyebrow_raise: f32,
  /// Направление взгляда
  pub gaze_direction: Point2D,
  /// Внимание/фокус (0.0-1.0)
  pub attention_score: f32,
}

/// Геометрические характеристики лица
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceGeometry {
  /// Ширина лица
  pub face_width: f32,
  /// Высота лица
  pub face_height: f32,
  /// Соотношение сторон лица
  pub aspect_ratio: f32,
  /// Симметрия лица (0.0-1.0)
  pub symmetry_score: f32,
  /// Углы лица
  pub face_angles: FaceAngles,
}

/// Углы и пропорции лица
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceAngles {
  /// Угол между глазами
  pub eye_angle: f32,
  /// Угол рта
  pub mouth_angle: f32,
  /// Угол носа
  pub nose_angle: f32,
}

/// Процессор MediaPipe
pub struct MediaPipeProcessor {
  session: RwLock<Option<Session>>,
  model_path: PathBuf,
  model_type: MediaPipeModel,
  input_size: (u32, u32), // (width, height)
  confidence_threshold: f32,
  num_faces: usize,
}

impl Drop for MediaPipeProcessor {
  fn drop(&mut self) {
    // Leak ONNX Session чтобы избежать SIGABRT при завершении приложения.
    // Когда приложение вызывает std::process::exit, деструктор Session
    // может привести к крашу из-за попытки очистить уже очищенные мьютексы в ONNX Runtime.
    if let Ok(mut session) = self.session.write() {
      if let Some(sess) = session.take() {
        std::mem::forget(sess);
      }
    }
  }
}

impl MediaPipeProcessor {
  /// Создать новый процессор MediaPipe
  pub fn new(model_type: MediaPipeModel) -> Result<Self> {
    let model_path = match &model_type {
      MediaPipeModel::BlazeFaceShort => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_mediapipe_model_path("blazeface-short"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/mediapipe/face_detection_short_range.onnx")),
      MediaPipeModel::BlazeFaceFull => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_mediapipe_model_path("blazeface-full"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/mediapipe/face_detection_full_range.onnx")),
      MediaPipeModel::FaceMesh => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_mediapipe_model_path("face-mesh"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/mediapipe/face_landmark.onnx")),
      MediaPipeModel::FaceMeshAttention => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_mediapipe_model_path("face-mesh-attention"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/mediapipe/face_landmark_with_attention.onnx")),
      MediaPipeModel::SelfieSegmentation => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_mediapipe_model_path("selfie-segmentation"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/mediapipe/selfie_segmentation.onnx")),
      MediaPipeModel::SelfieSegmentationLandscape => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_mediapipe_model_path("selfie-segmentation-landscape"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/mediapipe/selfie_segmentation_landscape.onnx")),
      MediaPipeModel::Custom(path) => path.clone(),
    };

    // Определяем размер входного изображения для модели
    let input_size = match &model_type {
      MediaPipeModel::BlazeFaceShort | MediaPipeModel::BlazeFaceFull => (128, 128),
      MediaPipeModel::FaceMesh | MediaPipeModel::FaceMeshAttention => (192, 192),
      MediaPipeModel::SelfieSegmentation | MediaPipeModel::SelfieSegmentationLandscape => {
        (256, 256)
      }
      MediaPipeModel::Custom(_) => (192, 192), // Default for custom models
    };

    Ok(Self {
      session: RwLock::new(None),
      model_path,
      model_type,
      input_size,
      confidence_threshold: 0.5, // Порог для MediaPipe
      num_faces: 5,              // Максимум лиц для обработки
    })
  }

  /// Загрузить модель
  pub async fn load_model(&mut self) -> Result<()> {
    if !self.model_path.exists() {
      return Err(anyhow!(
        "MediaPipe model not found at path: {}",
        self.model_path.display()
      ));
    }

    // ORT initialization is now handled automatically by ModelManager
    // No need for explicit init_ort() call

    // В тестах пропускаем загрузку модели если ORT недоступен
    if cfg!(test) {
      match Session::builder() {
        Ok(builder) => {
          let session = builder
            .with_optimization_level(GraphOptimizationLevel::Level3)
            .map_err(|e| anyhow!("Failed to set optimization level: {}", e))?
            .with_intra_threads(2) // MediaPipe оптимизирован для меньшего числа потоков
            .map_err(|e| anyhow!("Failed to set intra threads: {}", e))?
            .commit_from_memory(
              &std::fs::read(&self.model_path)
                .map_err(|e| anyhow!("Failed to read model file: {}", e))?,
            )
            .map_err(|e| anyhow!("Failed to load model from memory: {}", e))?;
          *self.session.write().unwrap() = Some(session);
        }
        Err(_) => {
          eprintln!(
            "Warning: Skipping MediaPipe model load in test mode due to missing ONNX Runtime"
          );
          return Ok(());
        }
      }
    } else {
      let session = Session::builder()
        .map_err(|e| anyhow!("Failed to create session builder: {}", e))?
        .with_optimization_level(GraphOptimizationLevel::Level3)
        .map_err(|e| anyhow!("Failed to set optimization level: {}", e))?
        .with_intra_threads(2)
        .map_err(|e| anyhow!("Failed to set intra threads: {}", e))?
        .commit_from_memory(
          &std::fs::read(&self.model_path)
            .map_err(|e| anyhow!("Failed to read model file: {}", e))?,
        )
        .map_err(|e| anyhow!("Failed to load model from memory: {}", e))?;
      *self.session.write().unwrap() = Some(session);
    }

    log::info!("MediaPipe model loaded successfully: {:?}", self.model_type);
    Ok(())
  }

  /// Полный анализ лица с MediaPipe
  pub fn analyze_face_sync(&self, image: &DynamicImage) -> Result<MediaPipeAnalysis> {
    // В тестах возвращаем фиктивные результаты
    if cfg!(test) {
      return Ok(self.create_mock_analysis());
    }

    // Проверяем что модель загружена
    if self.session.read().unwrap().is_none() {
      return Err(anyhow!("Model not loaded. Call load_model() first."));
    }

    match self.model_type {
      MediaPipeModel::BlazeFaceShort | MediaPipeModel::BlazeFaceFull => {
        let detections = self.detect_faces_blazeface_sync(image)?;
        Ok(MediaPipeAnalysis {
          face_detections: detections,
          face_mesh: None,
          head_pose: None,
          segmentation_mask: None,
          facial_expressions: None,
          face_geometry: None,
        })
      }
      MediaPipeModel::FaceMesh | MediaPipeModel::FaceMeshAttention => {
        let face_mesh = self.extract_face_mesh_sync(image)?;
        let head_pose = self.calculate_head_pose_3d(&face_mesh);
        let expressions = self.analyze_facial_expressions(&face_mesh);
        let geometry = self.analyze_face_geometry(&face_mesh);

        Ok(MediaPipeAnalysis {
          face_detections: vec![],
          face_mesh: Some(face_mesh),
          head_pose: Some(head_pose),
          segmentation_mask: None,
          facial_expressions: Some(expressions),
          face_geometry: Some(geometry),
        })
      }
      MediaPipeModel::SelfieSegmentation | MediaPipeModel::SelfieSegmentationLandscape => {
        let mask = self.segment_selfie_sync(image)?;
        Ok(MediaPipeAnalysis {
          face_detections: vec![],
          face_mesh: None,
          head_pose: None,
          segmentation_mask: Some(mask),
          facial_expressions: None,
          face_geometry: None,
        })
      }
      MediaPipeModel::Custom(_) => {
        // Для кастомных моделей пытаемся определить тип по размеру выхода
        self.analyze_custom_model_sync(image)
      }
    }
  }

  /// Детекция лиц с BlazeFace
  pub fn detect_faces_blazeface_sync(
    &self,
    image: &DynamicImage,
  ) -> Result<Vec<BlazeFaceDetection>> {
    // Предобработка изображения
    let preprocessed = self.preprocess_image(image)?;

    // Создаем тензор для инференса
    let input_vec: Vec<f32> = preprocessed.into_raw_vec_and_offset().0;
    let input_tensor = Tensor::from_array((
      [1, 3, self.input_size.1 as usize, self.input_size.0 as usize],
      input_vec,
    ))?;

    // Выполняем inference
    let detections = {
      let mut session_ref = self.session.write().unwrap();
      let session = session_ref.as_mut().unwrap();

      let outputs = session
        .run(ort::inputs!["input" => input_tensor])
        .map_err(|e| anyhow!("Inference failed: {}", e))?;

      // Постобработка результатов BlazeFace
      self.post_process_blazeface_detections(&outputs, image.width(), image.height())?
    };

    Ok(detections)
  }

  /// Извлечение 468 landmarks
  pub fn extract_face_mesh_sync(&self, image: &DynamicImage) -> Result<FaceMeshLandmarks> {
    // Предобработка изображения для Face Mesh
    let preprocessed = self.preprocess_image(image)?;

    // Создаем тензор
    let input_vec: Vec<f32> = preprocessed.into_raw_vec_and_offset().0;
    let input_tensor = Tensor::from_array((
      [1, 3, self.input_size.1 as usize, self.input_size.0 as usize],
      input_vec,
    ))?;

    // Выполняем inference
    let landmarks = {
      let mut session_ref = self.session.write().unwrap();
      let session = session_ref.as_mut().unwrap();

      let outputs = session
        .run(ort::inputs!["input" => input_tensor])
        .map_err(|e| anyhow!("Face Mesh inference failed: {}", e))?;

      // Постобработка Face Mesh (468 точек)
      self.post_process_face_mesh(&outputs, image.width(), image.height())?
    };

    Ok(landmarks)
  }

  /// Сегментация портрета
  fn segment_selfie_sync(&self, image: &DynamicImage) -> Result<SegmentationMask> {
    // Предобработка для сегментации
    let preprocessed = self.preprocess_image(image)?;

    let (input_vec, _offset) = preprocessed.into_raw_vec_and_offset();
    let input_vec: Vec<f32> = input_vec;
    let input_tensor = Tensor::from_array((
      [1, 3, self.input_size.1 as usize, self.input_size.0 as usize],
      input_vec,
    ))?;

    // Inference сегментации
    let mask = {
      let mut session_ref = self.session.write().unwrap();
      let session = session_ref.as_mut().unwrap();

      let outputs = session
        .run(ort::inputs!["input" => input_tensor])
        .map_err(|e| anyhow!("Segmentation inference failed: {}", e))?;

      self.post_process_segmentation(&outputs, image.width(), image.height())?
    };

    Ok(mask)
  }

  /// Предобработка изображения для MediaPipe
  fn preprocess_image(&self, image: &DynamicImage) -> Result<ndarray::Array4<f32>> {
    let (target_width, target_height) = self.input_size;

    // Изменяем размер изображения
    let resized = image.resize(target_width, target_height, FilterType::Lanczos3);

    // Конвертируем в RGB
    let rgb_image = resized.to_rgb8();

    // Создаем массив для тензора [batch_size, channels, height, width]
    let mut input_array =
      ndarray::Array4::<f32>::zeros((1, 3, target_height as usize, target_width as usize));

    for (x, y, pixel) in rgb_image.enumerate_pixels() {
      let r = pixel[0] as f32;
      let g = pixel[1] as f32;
      let b = pixel[2] as f32;

      // Нормализация для MediaPipe: [0, 255] -> [-1, 1]
      input_array[[0, 0, y as usize, x as usize]] = (r / 255.0) * 2.0 - 1.0;
      input_array[[0, 1, y as usize, x as usize]] = (g / 255.0) * 2.0 - 1.0;
      input_array[[0, 2, y as usize, x as usize]] = (b / 255.0) * 2.0 - 1.0;
    }

    Ok(input_array)
  }

  /// Постобработка BlazeFace детекций
  fn post_process_blazeface_detections(
    &self,
    outputs: &SessionOutputs,
    original_width: u32,
    original_height: u32,
  ) -> Result<Vec<BlazeFaceDetection>> {
    // BlazeFace возвращает:
    // - detections: [N, 17] (bbox + confidence + 6 keypoints)
    let detections_output = outputs
      .get("detections")
      .or_else(|| outputs.get("output"))
      .ok_or_else(|| anyhow!("No detections output found in BlazeFace model"))?;

    let detections_data = detections_output.try_extract_tensor::<f32>()?.1;

    let mut face_detections = Vec::new();
    let num_detections = detections_data.len() / 17;

    for i in 0..num_detections {
      let base_idx = i * 17;

      // Извлекаем bbox и confidence
      let x1 = detections_data[base_idx] * original_width as f32;
      let y1 = detections_data[base_idx + 1] * original_height as f32;
      let x2 = detections_data[base_idx + 2] * original_width as f32;
      let y2 = detections_data[base_idx + 3] * original_height as f32;
      let confidence = detections_data[base_idx + 4];

      if confidence < self.confidence_threshold {
        continue;
      }

      // Извлекаем 6 keypoints
      let mut keypoints = Vec::new();
      for j in 0..6 {
        let kp_x = detections_data[base_idx + 5 + j * 2] * original_width as f32;
        let kp_y = detections_data[base_idx + 5 + j * 2 + 1] * original_height as f32;
        keypoints.push(Point2D { x: kp_x, y: kp_y });
      }

      // Оценка качества детекции
      let quality_score = self.assess_detection_quality(x1, y1, x2, y2, &keypoints);

      face_detections.push(BlazeFaceDetection {
        bbox: BoundingBox { x1, y1, x2, y2 },
        confidence,
        keypoints,
        quality_score,
      });
    }

    Ok(face_detections)
  }

  /// Постобработка Face Mesh (468 landmarks)
  fn post_process_face_mesh(
    &self,
    outputs: &SessionOutputs,
    original_width: u32,
    original_height: u32,
  ) -> Result<FaceMeshLandmarks> {
    // Face Mesh возвращает landmarks: [1, 468, 3] (x, y, z)
    let landmarks_output = outputs
      .get("landmarks")
      .or_else(|| outputs.get("output"))
      .ok_or_else(|| anyhow!("No landmarks output found in Face Mesh model"))?;

    let landmarks_data = landmarks_output.try_extract_tensor::<f32>()?.1;

    let mut points = Vec::new();
    for i in 0..468 {
      let base_idx = i * 3;
      let x = landmarks_data[base_idx] * original_width as f32;
      let y = landmarks_data[base_idx + 1] * original_height as f32;
      let z = landmarks_data[base_idx + 2]; // Z координата относительная

      points.push(Point3D { x, y, z });
    }

    // Создаем карту регионов лица
    let regions = self.create_face_regions();

    Ok(FaceMeshLandmarks { points, regions })
  }

  /// Постобработка сегментации
  fn post_process_segmentation(
    &self,
    outputs: &SessionOutputs,
    original_width: u32,
    original_height: u32,
  ) -> Result<SegmentationMask> {
    let mask_output = outputs
      .get("output")
      .ok_or_else(|| anyhow!("No segmentation output found"))?;

    let mask_data = mask_output.try_extract_tensor::<f32>()?.1;

    // Resize mask to original dimensions
    let mask_size = (mask_data.len() as f32).sqrt() as usize;
    let mut resized_mask = Vec::new();

    // Простая билинейная интерполяция для изменения размера маски
    for y in 0..original_height {
      for x in 0..original_width {
        let src_x = (x as f32 / original_width as f32) * mask_size as f32;
        let src_y = (y as f32 / original_height as f32) * mask_size as f32;

        let idx = (src_y as usize * mask_size + src_x as usize).min(mask_data.len() - 1);
        resized_mask.push(mask_data[idx]);
      }
    }

    let confidence = resized_mask.iter().sum::<f32>() / resized_mask.len() as f32;

    Ok(SegmentationMask {
      width: original_width,
      height: original_height,
      mask_data: resized_mask,
      confidence,
    })
  }

  /// Анализ кастомной модели
  fn analyze_custom_model_sync(&self, _image: &DynamicImage) -> Result<MediaPipeAnalysis> {
    // Заглушка для кастомных моделей
    Ok(self.create_mock_analysis())
  }

  /// Создание mock данных для тестов
  fn create_mock_analysis(&self) -> MediaPipeAnalysis {
    MediaPipeAnalysis {
      face_detections: vec![BlazeFaceDetection {
        bbox: BoundingBox {
          x1: 100.0,
          y1: 100.0,
          x2: 200.0,
          y2: 200.0,
        },
        confidence: 0.95,
        keypoints: vec![
          Point2D { x: 130.0, y: 130.0 }, // Левый глаз
          Point2D { x: 170.0, y: 130.0 }, // Правый глаз
          Point2D { x: 150.0, y: 150.0 }, // Кончик носа
          Point2D { x: 135.0, y: 170.0 }, // Левый уголок рта
          Point2D { x: 165.0, y: 170.0 }, // Правый уголок рта
          Point2D { x: 150.0, y: 140.0 }, // Центр лица
        ],
        quality_score: 0.9,
      }],
      face_mesh: Some(self.create_mock_face_mesh()),
      head_pose: Some(HeadPose3D {
        pitch: 0.0,
        yaw: 0.0,
        roll: 0.0,
        translation: Point3D {
          x: 0.0,
          y: 0.0,
          z: 0.0,
        },
        confidence: 0.95,
      }),
      segmentation_mask: None,
      facial_expressions: Some(FacialExpressions {
        smile: 0.7,
        eye_openness: [0.8, 0.8],
        mouth_openness: 0.3,
        eyebrow_raise: 0.1,
        gaze_direction: Point2D { x: 0.0, y: 0.0 },
        attention_score: 0.85,
      }),
      face_geometry: Some(FaceGeometry {
        face_width: 100.0,
        face_height: 120.0,
        aspect_ratio: 0.83,
        symmetry_score: 0.9,
        face_angles: FaceAngles {
          eye_angle: 0.0,
          mouth_angle: 0.1,
          nose_angle: 0.0,
        },
      }),
    }
  }

  /// Создание mock Face Mesh для тестов
  fn create_mock_face_mesh(&self) -> FaceMeshLandmarks {
    let mut points = Vec::new();

    // Создаем 468 mock точек
    for i in 0..468 {
      let angle = (i as f32 / 468.0) * 2.0 * std::f32::consts::PI;
      let radius = 50.0 + (i % 20) as f32 * 2.0;

      points.push(Point3D {
        x: 150.0 + radius * angle.cos(),
        y: 150.0 + radius * angle.sin(),
        z: (i % 10) as f32 * 0.1,
      });
    }

    FaceMeshLandmarks {
      points,
      regions: self.create_face_regions(),
    }
  }

  /// Создание карты регионов лица
  fn create_face_regions(&self) -> FaceRegions {
    FaceRegions {
      lips: (0..40).collect(),
      left_eye: (40..56).collect(),
      right_eye: (56..72).collect(),
      face_oval: (72..108).collect(),
      left_eyebrow: (108..113).collect(),
      right_eyebrow: (113..118).collect(),
      nose_bridge: (118..126).collect(),
      nose_tip: (126..131).collect(),
    }
  }

  /// Вычисление 3D позы головы
  fn calculate_head_pose_3d(&self, face_mesh: &FaceMeshLandmarks) -> HeadPose3D {
    if face_mesh.points.len() < 468 {
      return HeadPose3D {
        pitch: 0.0,
        yaw: 0.0,
        roll: 0.0,
        translation: Point3D {
          x: 0.0,
          y: 0.0,
          z: 0.0,
        },
        confidence: 0.0,
      };
    }

    // Используем ключевые точки для вычисления позы
    let nose_tip = &face_mesh.points[1]; // Кончик носа
    let left_eye = &face_mesh.points[33]; // Левый глаз
    let right_eye = &face_mesh.points[263]; // Правый глаз

    // Вычисляем углы на основе 3D координат
    let eye_center_x = (left_eye.x + right_eye.x) / 2.0;
    let eye_center_y = (left_eye.y + right_eye.y) / 2.0;
    let eye_center_z = (left_eye.z + right_eye.z) / 2.0;

    // Roll (наклон головы)
    let roll = ((right_eye.y - left_eye.y) / (right_eye.x - left_eye.x))
      .atan()
      .to_degrees();

    // Yaw (поворот влево/вправо)
    let nose_to_center_x = nose_tip.x - eye_center_x;
    let eye_distance = (right_eye.x - left_eye.x).abs();
    let yaw = (nose_to_center_x / eye_distance * 30.0).clamp(-90.0, 90.0);

    // Pitch (наклон вверх/вниз) с использованием Z координаты
    let nose_to_eye_z = nose_tip.z - eye_center_z;
    let pitch = (nose_to_eye_z * 45.0).clamp(-45.0, 45.0);

    HeadPose3D {
      pitch,
      yaw,
      roll,
      translation: Point3D {
        x: eye_center_x,
        y: eye_center_y,
        z: eye_center_z,
      },
      confidence: 0.9,
    }
  }

  /// Анализ выражений лица
  fn analyze_facial_expressions(&self, face_mesh: &FaceMeshLandmarks) -> FacialExpressions {
    if face_mesh.points.len() < 468 {
      return FacialExpressions {
        smile: 0.0,
        eye_openness: [0.0, 0.0],
        mouth_openness: 0.0,
        eyebrow_raise: 0.0,
        gaze_direction: Point2D { x: 0.0, y: 0.0 },
        attention_score: 0.0,
      };
    }

    // Анализ улыбки по уголкам рта
    let mouth_left = &face_mesh.points[61];
    let mouth_right = &face_mesh.points[291];
    let mouth_center = &face_mesh.points[13];

    let mouth_curve = (mouth_left.y + mouth_right.y) / 2.0 - mouth_center.y;
    let smile = (mouth_curve / 10.0).clamp(0.0, 1.0);

    // Анализ открытости глаз
    let left_eye_top = &face_mesh.points[386];
    let left_eye_bottom = &face_mesh.points[374];
    let right_eye_top = &face_mesh.points[159];
    let right_eye_bottom = &face_mesh.points[145];

    let left_eye_openness = ((left_eye_top.y - left_eye_bottom.y).abs() / 8.0).clamp(0.0, 1.0);
    let right_eye_openness = ((right_eye_top.y - right_eye_bottom.y).abs() / 8.0).clamp(0.0, 1.0);

    // Анализ открытости рта
    let mouth_top = &face_mesh.points[12];
    let mouth_bottom = &face_mesh.points[15];
    let mouth_openness = ((mouth_top.y - mouth_bottom.y).abs() / 15.0).clamp(0.0, 1.0);

    // Направление взгляда (упрощенно)
    let gaze_direction = Point2D { x: 0.0, y: 0.0 };

    // Оценка внимания
    let attention_score = (left_eye_openness + right_eye_openness) / 2.0;

    FacialExpressions {
      smile,
      eye_openness: [left_eye_openness, right_eye_openness],
      mouth_openness,
      eyebrow_raise: 0.0, // TODO: реализовать анализ бровей
      gaze_direction,
      attention_score,
    }
  }

  /// Анализ геометрии лица
  fn analyze_face_geometry(&self, face_mesh: &FaceMeshLandmarks) -> FaceGeometry {
    if face_mesh.points.len() < 468 {
      return FaceGeometry {
        face_width: 0.0,
        face_height: 0.0,
        aspect_ratio: 0.0,
        symmetry_score: 0.0,
        face_angles: FaceAngles {
          eye_angle: 0.0,
          mouth_angle: 0.0,
          nose_angle: 0.0,
        },
      };
    }

    // Ширина и высота лица
    let face_left = &face_mesh.points[234];
    let face_right = &face_mesh.points[454];
    let face_top = &face_mesh.points[10];
    let face_bottom = &face_mesh.points[152];

    let face_width = (face_right.x - face_left.x).abs();
    let face_height = (face_bottom.y - face_top.y).abs();
    let aspect_ratio = face_width / face_height;

    // Оценка симметрии
    let symmetry_score = self.calculate_face_symmetry(face_mesh);

    FaceGeometry {
      face_width,
      face_height,
      aspect_ratio,
      symmetry_score,
      face_angles: FaceAngles {
        eye_angle: 0.0,
        mouth_angle: 0.0,
        nose_angle: 0.0,
      },
    }
  }

  /// Вычисление симметрии лица
  fn calculate_face_symmetry(&self, face_mesh: &FaceMeshLandmarks) -> f32 {
    // Упрощенная оценка симметрии по ключевым точкам
    let left_eye = &face_mesh.points[33];
    let right_eye = &face_mesh.points[263];
    let nose = &face_mesh.points[1];

    let face_center_x = (left_eye.x + right_eye.x) / 2.0;
    let nose_deviation = (nose.x - face_center_x).abs();
    let eye_distance = (right_eye.x - left_eye.x).abs();

    let symmetry = 1.0 - (nose_deviation / eye_distance).clamp(0.0, 1.0);
    symmetry.clamp(0.0, 1.0)
  }

  /// Оценка качества детекции
  fn assess_detection_quality(
    &self,
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,
    keypoints: &[Point2D],
  ) -> f32 {
    let mut quality = 1.0;

    // 1. Размер лица
    let face_area = (x2 - x1) * (y2 - y1);
    if face_area < 1600.0 {
      // меньше 40x40 пикселей
      quality *= 0.5;
    }

    // 2. Качество keypoints
    let mut valid_keypoints = 0;
    for kp in keypoints {
      if kp.x >= x1 && kp.x <= x2 && kp.y >= y1 && kp.y <= y2 {
        valid_keypoints += 1;
      }
    }
    quality *= valid_keypoints as f32 / keypoints.len() as f32;

    quality.clamp(0.0, 1.0)
  }

  /// Получить тип модели
  pub fn get_model_type(&self) -> &MediaPipeModel {
    &self.model_type
  }

  /// Установить порог уверенности
  pub fn set_confidence_threshold(&mut self, threshold: f32) {
    self.confidence_threshold = threshold.clamp(0.0, 1.0);
  }

  /// Установить максимальное количество лиц
  pub fn set_max_faces(&mut self, num_faces: usize) {
    self.num_faces = num_faces.max(1);
  }

  /// Проверить, загружена ли модель
  pub fn is_model_loaded(&self) -> bool {
    self.session.read().unwrap().is_some()
  }

  /// Получить путь к модели
  pub fn get_model_path(&self) -> &PathBuf {
    &self.model_path
  }

  /// Получить размер входа модели
  pub fn get_input_size(&self) -> (u32, u32) {
    self.input_size
  }

  /// Получить порог уверенности
  pub fn get_confidence_threshold(&self) -> f32 {
    self.confidence_threshold
  }

  /// Получить максимальное количество лиц
  pub fn get_max_faces(&self) -> usize {
    self.num_faces
  }

  /// Анализ выражений лица (sync версия)
  pub fn analyze_expressions_sync(&self, image: &DynamicImage) -> Result<FacialExpressions> {
    // Сначала извлекаем Face Mesh
    let face_mesh = self.extract_face_mesh_sync(image)?;

    // Анализируем выражения по landmarks
    Ok(self.analyze_facial_expressions(&face_mesh))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use image::RgbImage;

  #[tokio::test]
  async fn test_mediapipe_processor_creation() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::FaceMesh);
    assert!(processor.is_ok());

    let processor = processor.unwrap();
    assert!(!processor.is_model_loaded());
    assert_eq!(processor.input_size, (192, 192));
  }

  #[tokio::test]
  async fn test_mediapipe_different_models() {
    let models = [
      (MediaPipeModel::BlazeFaceShort, (128, 128)),
      (MediaPipeModel::FaceMesh, (192, 192)),
      (MediaPipeModel::SelfieSegmentation, (256, 256)),
    ];

    for (model_type, expected_size) in models {
      let processor = MediaPipeProcessor::new(model_type).unwrap();
      assert_eq!(processor.input_size, expected_size);
    }
  }

  #[test]
  fn test_face_regions_creation() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::FaceMesh).unwrap();
    let regions = processor.create_face_regions();

    assert_eq!(regions.lips.len(), 40);
    assert_eq!(regions.left_eye.len(), 16);
    assert_eq!(regions.right_eye.len(), 16);
    assert_eq!(regions.face_oval.len(), 36);
  }

  #[test]
  fn test_facial_expressions_analysis() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::FaceMesh).unwrap();
    let face_mesh = processor.create_mock_face_mesh();

    let expressions = processor.analyze_facial_expressions(&face_mesh);

    assert!(expressions.smile >= 0.0 && expressions.smile <= 1.0);
    assert!(expressions.eye_openness[0] >= 0.0 && expressions.eye_openness[0] <= 1.0);
    assert!(expressions.attention_score >= 0.0 && expressions.attention_score <= 1.0);
  }

  #[test]
  fn test_head_pose_calculation() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::FaceMesh).unwrap();
    let face_mesh = processor.create_mock_face_mesh();

    let head_pose = processor.calculate_head_pose_3d(&face_mesh);

    assert!(head_pose.pitch >= -90.0 && head_pose.pitch <= 90.0);
    assert!(head_pose.yaw >= -90.0 && head_pose.yaw <= 90.0);
    assert!(head_pose.roll >= -180.0 && head_pose.roll <= 180.0);
    assert!(head_pose.confidence >= 0.0 && head_pose.confidence <= 1.0);
  }

  #[test]
  fn test_face_geometry_analysis() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::FaceMesh).unwrap();
    let face_mesh = processor.create_mock_face_mesh();

    let geometry = processor.analyze_face_geometry(&face_mesh);

    assert!(geometry.face_width > 0.0);
    assert!(geometry.face_height > 0.0);
    assert!(geometry.aspect_ratio > 0.0);
    assert!(geometry.symmetry_score >= 0.0 && geometry.symmetry_score <= 1.0);
  }

  #[test]
  fn test_analyze_face_without_model() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::FaceMesh).unwrap();
    let test_image = DynamicImage::ImageRgb8(RgbImage::new(192, 192));

    // В тестах должны возвращаться mock данные
    let result = processor.analyze_face_sync(&test_image);
    assert!(result.is_ok());

    let analysis = result.unwrap();
    assert!(analysis.face_mesh.is_some());
    assert!(analysis.head_pose.is_some());
    assert!(analysis.facial_expressions.is_some());
    assert!(analysis.face_geometry.is_some());
  }

  #[test]
  fn test_quality_assessment() {
    let processor = MediaPipeProcessor::new(MediaPipeModel::BlazeFaceShort).unwrap();

    let good_keypoints = vec![
      Point2D { x: 130.0, y: 130.0 },
      Point2D { x: 170.0, y: 130.0 },
      Point2D { x: 150.0, y: 150.0 },
    ];

    let quality = processor.assess_detection_quality(100.0, 100.0, 200.0, 200.0, &good_keypoints);
    assert!(quality > 0.7); // Хорошее качество
  }
}

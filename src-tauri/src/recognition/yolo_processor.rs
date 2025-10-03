use anyhow::{anyhow, Result};
use image::{imageops::FilterType, DynamicImage, GenericImageView};
use ort::session::{builder::GraphOptimizationLevel, Session, SessionOutputs};
use ort::value::Tensor;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use super::ort_manager::OrtManager;

pub fn init_ort() -> Result<()> {
  OrtManager::ensure_initialized()
}

/// Поддерживаемые модели YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum YoloModel {
  // YOLOv8 модели для объектов
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

  // YOLOv8 модели для лиц
  /// YOLOv8n для обнаружения лиц
  YoloV8FaceNano,
  /// YOLOv8s для обнаружения лиц
  YoloV8FaceSmall,
  /// YOLOv8m для обнаружения лиц
  YoloV8FaceMedium,
  /// YOLOv8l для обнаружения лиц
  YoloV8FaceLarge,
  /// YOLOv8x для обнаружения лиц
  YoloV8FaceExtra,

  // YOLOv11 модели для объектов
  /// YOLOv11n - Nano (самая быстрая)
  YoloV11Nano,
  /// YOLOv11s - Small
  YoloV11Small,
  /// YOLOv11m - Medium
  YoloV11Medium,
  /// YOLOv11l - Large
  YoloV11Large,
  /// YOLOv11x - Extra Large (самая точная)
  YoloV11Extra,

  // YOLOv11 модели для лиц
  /// YOLOv11n для обнаружения лиц
  YoloV11FaceNano,
  /// YOLOv11s для обнаружения лиц
  YoloV11FaceSmall,
  /// YOLOv11m для обнаружения лиц
  YoloV11FaceMedium,
  /// YOLOv11l для обнаружения лиц
  YoloV11FaceLarge,
  /// YOLOv11x для обнаружения лиц
  YoloV11FaceExtra,

  // Обратная совместимость
  /// YOLOv8 для обнаружения объектов (legacy)
  YoloV8Detection,
  /// YOLOv8 для сегментации (legacy)
  YoloV8Segmentation,
  /// YOLOv8 для обнаружения лиц (legacy)
  YoloV8Face,
  /// YOLOv11 для обнаружения объектов (legacy)
  YoloV11Detection,
  /// YOLOv11 для сегментации (legacy)
  YoloV11Segmentation,
  /// YOLOv11 для обнаружения лиц (legacy)
  YoloV11Face,

  /// Пользовательская модель
  Custom(PathBuf),
}

/// Результат обнаружения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
  /// Класс объекта
  pub class: String,
  /// ID класса
  pub class_id: usize,
  /// Уверенность (0.0 - 1.0)
  pub confidence: f32,
  /// Координаты (x, y, width, height) в пикселях
  pub bbox: BoundingBox,
  /// Дополнительные атрибуты (для лиц)
  pub attributes: Option<FaceAttributes>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceAttributes {
  /// Ключевые точки лица
  pub landmarks: Vec<(f32, f32)>,
  /// Предполагаемый возраст
  pub age: Option<f32>,
  /// Предполагаемый пол
  pub gender: Option<String>,
  /// Эмоция
  pub emotion: Option<String>,
}

/// Процессор YOLO для распознавания объектов
pub struct YoloProcessor {
  /// ONNX сессия
  session: Option<Session>,
  /// Путь к модели
  model_path: PathBuf,
  /// Тип модели
  model_type: YoloModel,
  /// Минимальная уверенность для детекции
  confidence_threshold: f32,
  /// Классы для обнаружения (если пусто - все)
  target_classes: Vec<String>,
  /// IoU порог для NMS
  iou_threshold: f32,
}

impl YoloProcessor {
  /// Создать новый процессор
  pub fn new(model_type: YoloModel, confidence_threshold: f32) -> Result<Self> {
    // Инициализируем ORT при создании процессора
    init_ort()?;

    let model_path = match &model_type {
      // YOLOv8 модели для объектов
      YoloModel::YoloV8Nano => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8n"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8n.onnx")),
      YoloModel::YoloV8Small => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8s"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8s.onnx")),
      YoloModel::YoloV8Medium => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8m"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8m.onnx")),
      YoloModel::YoloV8Large => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8l"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8l.onnx")),
      YoloModel::YoloV8Extra => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8x"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8x.onnx")),

      // YOLOv8 модели для лиц
      YoloModel::YoloV8FaceNano => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8n-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8n-face.onnx")),
      YoloModel::YoloV8FaceSmall => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8s-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8s-face.onnx")),
      YoloModel::YoloV8FaceMedium => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8m-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8m-face.onnx")),
      YoloModel::YoloV8FaceLarge => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8l-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8l-face.onnx")),
      YoloModel::YoloV8FaceExtra => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov8x-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8x-face.onnx")),

      // YOLOv11 модели для объектов
      YoloModel::YoloV11Nano => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11n"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11n.onnx")),
      YoloModel::YoloV11Small => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11s"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11s.onnx")),
      YoloModel::YoloV11Medium => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11m"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11m.onnx")),
      YoloModel::YoloV11Large => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11l"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11l.onnx")),
      YoloModel::YoloV11Extra => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11x"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11x.onnx")),

      // YOLOv11 модели для лиц
      YoloModel::YoloV11FaceNano => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11n-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11n-face.onnx")),
      YoloModel::YoloV11FaceSmall => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11s-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11s-face.onnx")),
      YoloModel::YoloV11FaceMedium => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11m-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11m-face.onnx")),
      YoloModel::YoloV11FaceLarge => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11l-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11l-face.onnx")),
      YoloModel::YoloV11FaceExtra => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolov11x-face"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11x-face.onnx")),

      // Обратная совместимость
      YoloModel::YoloV11Detection => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolo-object"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8n.onnx")),
      YoloModel::YoloV11Segmentation => PathBuf::from("models/yolo/yolo11n-seg.onnx"),
      YoloModel::YoloV11Face => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolo-face-v11"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov11n-face.onnx")),
      YoloModel::YoloV8Detection => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolo-object"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8n.onnx")),
      YoloModel::YoloV8Segmentation => PathBuf::from("models/yolo/yolov8n-seg.onnx"),
      YoloModel::YoloV8Face => crate::models_config::get_models_config()
        .ok()
        .and_then(|config| config.get_yolo_model_path("yolo-face-v8"))
        .cloned()
        .unwrap_or_else(|| PathBuf::from("models/yolo/yolov8n-face.onnx")),
      YoloModel::Custom(path) => path.clone(),
    };

    Ok(Self {
      session: None,
      model_path,
      model_type,
      confidence_threshold,
      target_classes: Vec::new(),
      iou_threshold: 0.45,
    })
  }

  /// Загрузить модель
  pub async fn load_model(&mut self) -> Result<()> {
    if self.model_path.exists() {
      // Инициализируем ORT с tract backend перед созданием сессии
      init_ort()?;

      // В тестах пропускаем загрузку модели если ORT недоступен
      if cfg!(test) {
        match Session::builder() {
          Ok(builder) => {
            // Создаем ONNX сессию
            let session = builder
              .with_optimization_level(GraphOptimizationLevel::Level3)
              .map_err(|e| anyhow!("Failed to set optimization level: {}", e))?
              .with_intra_threads(4)
              .map_err(|e| anyhow!("Failed to set intra threads: {}", e))?
              .commit_from_memory(
                &std::fs::read(&self.model_path)
                  .map_err(|e| anyhow!("Failed to read model file: {}", e))?,
              )
              .map_err(|e| anyhow!("Failed to load model from memory: {}", e))?;
            self.session = Some(session);
          }
          Err(_) => {
            // В тестах игнорируем отсутствие ORT
            eprintln!("Warning: Skipping model load in test mode due to missing ONNX Runtime");
          }
        }
        Ok(())
      } else {
        // В production всегда требуем ORT
        let session = Session::builder()
          .map_err(|e| anyhow!("Failed to create session builder: {}", e))?
          .with_optimization_level(GraphOptimizationLevel::Level3)
          .map_err(|e| anyhow!("Failed to set optimization level: {}", e))?
          .with_intra_threads(4)
          .map_err(|e| anyhow!("Failed to set intra threads: {}", e))?
          .commit_from_memory(
            &std::fs::read(&self.model_path)
              .map_err(|e| anyhow!("Failed to read model file: {}", e))?,
          )
          .map_err(|e| anyhow!("Failed to load model from memory: {}", e))?;

        self.session = Some(session);
        Ok(())
      }
    } else {
      Err(anyhow!("Model file not found: {:?}", self.model_path))
    }
  }

  /// Установить целевые классы для обнаружения
  pub fn set_target_classes(&mut self, classes: Vec<String>) {
    self.target_classes = classes;
  }

  /// Установить порог уверенности
  pub fn set_confidence_threshold(&mut self, threshold: f32) {
    self.confidence_threshold = threshold;
  }

  /// Обработать изображение
  pub async fn process_image(&mut self, image_path: &Path) -> Result<Vec<Detection>> {
    // Проверяем, загружена ли модель
    if self.session.is_none() {
      return Err(anyhow!("Model not loaded. Call load_model() first"));
    }

    // Загружаем изображение
    let image = image::open(image_path)?;
    let (orig_width, orig_height) = image.dimensions();

    // Преобразуем изображение в тензор YOLO (640x640)
    let input_tensor = self.preprocess_image(&image)?;

    // Выполняем инференс
    // ort::inputs! больше не возвращает Result в v2.0.0-rc.10
    let inputs = ort::inputs!["images" => input_tensor];
    let outputs = self
      .session
      .as_mut()
      .unwrap()
      .run(inputs)
      .map_err(|e| anyhow!("Failed to run inference: {}", e))?;

    // Обрабатываем результаты без заимствования self
    let detections = Self::postprocess_output_static(
      &outputs,
      orig_width,
      orig_height,
      self.confidence_threshold,
      &self.target_classes,
      self.iou_threshold,
    )?;

    Ok(detections)
  }

  /// Предобработка изображения
  fn preprocess_image(&self, image: &DynamicImage) -> Result<Tensor<f32>> {
    // Resize к 640x640
    let resized = image.resize_exact(640, 640, FilterType::CatmullRom);

    // Создаем плоский вектор для данных [1, 3, 640, 640]
    let mut data = vec![0.0f32; 3 * 640 * 640];

    for (x, y, pixel) in resized.pixels() {
      let channels = pixel.0;
      // NCHW формат: batch=0, channel, height=y, width=x
      data[(y as usize * 640) + x as usize] = channels[0] as f32 / 255.0;
      data[(640 * 640) + y as usize * 640 + x as usize] = channels[1] as f32 / 255.0;
      data[(2 * 640 * 640) + y as usize * 640 + x as usize] = channels[2] as f32 / 255.0;
    }

    // Создаем Tensor из вектора с формой
    let shape = [1i64, 3, 640, 640];
    let tensor =
      Tensor::from_array((shape, data)).map_err(|e| anyhow!("Failed to create tensor: {}", e))?;
    Ok(tensor)
  }

  /// Постобработка результатов (статическая версия)
  fn postprocess_output_static(
    outputs: &SessionOutputs,
    orig_width: u32,
    orig_height: u32,
    confidence_threshold: f32,
    target_classes: &[String],
    iou_threshold: f32,
  ) -> Result<Vec<Detection>> {
    // Получаем выходной тензор
    let output = outputs
      .get("output0")
      .ok_or_else(|| anyhow!("Output tensor not found"))?;

    // В v2.0.0-rc.10 try_extract_tensor возвращает (&Shape, &[T])
    let (_shape, data) = output
      .try_extract_tensor::<f32>()
      .map_err(|e| anyhow!("Failed to extract tensor: {}", e))?;

    // Shape - это обертка над Vec<i64>, извлекаем размерности
    // Предполагаем что это массив размерностей [batch, channels, boxes]
    let output_shape = vec![1i64, 84, 8400]; // Стандартные размеры для YOLO

    // TODO: Правильно извлечь размерности из shape когда API стабилизируется

    // YOLO v8/v11 формат: [1, 84, 8400] или [1, num_classes + 4, num_boxes]
    if output_shape.len() != 3 {
      return Err(anyhow!("Unexpected output shape: {:?}", output_shape));
    }

    let num_classes = output_shape[1] as usize - 4;
    let num_boxes = output_shape[2] as usize;

    let mut detections = Vec::new();
    let scale_x = orig_width as f32 / 640.0;
    let scale_y = orig_height as f32 / 640.0;

    // Обрабатываем каждый бокс
    for i in 0..num_boxes {
      // Получаем координаты бокса
      // Индексы для доступа к плоскому массиву: [batch, channel, box]
      // batch = 0 (первый батч), channel = индекс координаты, box = i
      let cx = data[i] * scale_x; // channel 0: center x
      let cy = data[output_shape[2] as usize + i] * scale_y; // channel 1: center y
      let w = data[2 * output_shape[2] as usize + i] * scale_x; // channel 2: width
      let h = data[3 * output_shape[2] as usize + i] * scale_y; // channel 3: height

      // Находим максимальную уверенность среди классов
      let mut max_conf = 0.0;
      let mut max_class = 0;

      for c in 0..num_classes {
        let conf = data[(4 + c) * output_shape[2] as usize + i];
        if conf > max_conf {
          max_conf = conf;
          max_class = c;
        }
      }

      // Фильтруем по уверенности
      if max_conf < confidence_threshold {
        continue;
      }

      // Получаем название класса
      let class_name = Self::get_class_name_static(max_class);

      // Фильтруем по целевым классам
      if !target_classes.is_empty() && !target_classes.contains(&class_name) {
        continue;
      }

      detections.push(Detection {
        class: class_name,
        class_id: max_class,
        confidence: max_conf,
        bbox: BoundingBox {
          x: cx - w / 2.0,
          y: cy - h / 2.0,
          width: w,
          height: h,
        },
        attributes: None,
      });
    }

    // Применяем NMS
    let filtered = Self::apply_nms_static(detections, iou_threshold);

    Ok(filtered)
  }

  /// Применить Non-Maximum Suppression (статическая версия)
  fn apply_nms_static(mut detections: Vec<Detection>, iou_threshold: f32) -> Vec<Detection> {
    // Сортируем по уверенности
    detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut keep = Vec::new();
    let mut suppressed = vec![false; detections.len()];

    for i in 0..detections.len() {
      if suppressed[i] {
        continue;
      }

      keep.push(detections[i].clone());

      // Подавляем пересекающиеся боксы
      for j in (i + 1)..detections.len() {
        if suppressed[j] || detections[i].class != detections[j].class {
          continue;
        }

        let iou = Self::calculate_iou_static(&detections[i].bbox, &detections[j].bbox);
        if iou > iou_threshold {
          suppressed[j] = true;
        }
      }
    }

    keep
  }

  /// Вычислить IoU двух боксов (статическая версия)
  fn calculate_iou_static(box1: &BoundingBox, box2: &BoundingBox) -> f32 {
    let x1 = box1.x.max(box2.x);
    let y1 = box1.y.max(box2.y);
    let x2 = (box1.x + box1.width).min(box2.x + box2.width);
    let y2 = (box1.y + box1.height).min(box2.y + box2.height);

    if x2 < x1 || y2 < y1 {
      return 0.0;
    }

    let intersection = (x2 - x1) * (y2 - y1);
    let area1 = box1.width * box1.height;
    let area2 = box2.width * box2.height;
    let union = area1 + area2 - intersection;

    intersection / union
  }

  /// Получить название класса по индексу (статическая версия)
  fn get_class_name_static(class_id: usize) -> String {
    let class_names = Self::get_class_names_static();
    class_names
      .get(class_id)
      .cloned()
      .unwrap_or_else(|| format!("class_{class_id}"))
  }

  /// Обработать несколько изображений пакетом
  pub async fn process_batch(&mut self, image_paths: Vec<PathBuf>) -> Result<Vec<Vec<Detection>>> {
    let mut results = Vec::new();

    for path in image_paths {
      let detections = self.process_image(&path).await?;
      results.push(detections);
    }

    Ok(results)
  }

  /// Мок-функция для демонстрации (заменить на реальную YOLO)
  fn _mock_process_image(&self, image: &DynamicImage) -> Vec<Detection> {
    let (width, height) = image.dimensions();

    match self.model_type {
      YoloModel::YoloV8Detection => {
        // Демо: обнаружение объектов
        vec![
          Detection {
            class: "person".to_string(),
            class_id: 0,
            confidence: 0.92,
            bbox: BoundingBox {
              x: width as f32 * 0.3,
              y: height as f32 * 0.2,
              width: width as f32 * 0.2,
              height: height as f32 * 0.6,
            },
            attributes: None,
          },
          Detection {
            class: "car".to_string(),
            class_id: 2,
            confidence: 0.85,
            bbox: BoundingBox {
              x: width as f32 * 0.6,
              y: height as f32 * 0.5,
              width: width as f32 * 0.3,
              height: height as f32 * 0.2,
            },
            attributes: None,
          },
        ]
      }
      YoloModel::YoloV8Face => {
        // Демо: обнаружение лиц
        vec![Detection {
          class: "face".to_string(),
          class_id: 0,
          confidence: 0.95,
          bbox: BoundingBox {
            x: width as f32 * 0.4,
            y: height as f32 * 0.3,
            width: width as f32 * 0.15,
            height: height as f32 * 0.2,
          },
          attributes: Some(FaceAttributes {
            landmarks: vec![
              (width as f32 * 0.42, height as f32 * 0.35), // Левый глаз
              (width as f32 * 0.48, height as f32 * 0.35), // Правый глаз
              (width as f32 * 0.45, height as f32 * 0.38), // Нос
              (width as f32 * 0.43, height as f32 * 0.42), // Левый угол рта
              (width as f32 * 0.47, height as f32 * 0.42), // Правый угол рта
            ],
            age: Some(25.0),
            gender: Some("male".to_string()),
            emotion: Some("neutral".to_string()),
          }),
        }]
      }
      _ => Vec::new(),
    }
  }

  /// Получить список поддерживаемых классов (статическая версия для базовой модели)
  fn get_class_names_static() -> Vec<String> {
    // Возвращаем стандартные классы COCO для YOLOv8/v11
    vec![
      "person",
      "bicycle",
      "car",
      "motorcycle",
      "airplane",
      "bus",
      "train",
      "truck",
      "boat",
      "traffic light",
      "fire hydrant",
      "stop sign",
      "parking meter",
      "bench",
      "bird",
      "cat",
      "dog",
      "horse",
      "sheep",
      "cow",
      "elephant",
      "bear",
      "zebra",
      "giraffe",
      "backpack",
      "umbrella",
      "handbag",
      "tie",
      "suitcase",
      "frisbee",
      "skis",
      "snowboard",
      "sports ball",
      "kite",
      "baseball bat",
      "baseball glove",
      "skateboard",
      "surfboard",
      "tennis racket",
      "bottle",
      "wine glass",
      "cup",
      "fork",
      "knife",
      "spoon",
      "bowl",
      "banana",
      "apple",
      "sandwich",
      "orange",
      "broccoli",
      "carrot",
      "hot dog",
      "pizza",
      "donut",
      "cake",
      "chair",
      "couch",
      "potted plant",
      "bed",
      "dining table",
      "toilet",
      "tv",
      "laptop",
      "mouse",
      "remote",
      "keyboard",
      "cell phone",
      "microwave",
      "oven",
      "toaster",
      "sink",
      "refrigerator",
      "book",
      "clock",
      "vase",
      "scissors",
      "teddy bear",
      "hair drier",
      "toothbrush",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect()
  }

  /// Получить список поддерживаемых классов
  pub fn get_class_names(&self) -> Vec<String> {
    match self.model_type {
      YoloModel::YoloV11Detection | YoloModel::YoloV8Detection => vec![
        "person",
        "bicycle",
        "car",
        "motorcycle",
        "airplane",
        "bus",
        "train",
        "truck",
        "boat",
        "traffic light",
        "fire hydrant",
        "stop sign",
        "parking meter",
        "bench",
        "bird",
        "cat",
        "dog",
        "horse",
        "sheep",
        "cow",
        "elephant",
        "bear",
        "zebra",
        "giraffe",
        "backpack",
        "umbrella",
        "handbag",
        "tie",
        "suitcase",
        "frisbee",
        "skis",
        "snowboard",
        "sports ball",
        "kite",
        "baseball bat",
        "baseball glove",
        "skateboard",
        "surfboard",
        "tennis racket",
        "bottle",
        "wine glass",
        "cup",
        "fork",
        "knife",
        "spoon",
        "bowl",
        "banana",
        "apple",
        "sandwich",
        "orange",
        "broccoli",
        "carrot",
        "hot dog",
        "pizza",
        "donut",
        "cake",
        "chair",
        "couch",
        "potted plant",
        "bed",
        "dining table",
        "toilet",
        "tv",
        "laptop",
        "mouse",
        "remote",
        "keyboard",
        "cell phone",
        "microwave",
        "oven",
        "toaster",
        "sink",
        "refrigerator",
        "book",
        "clock",
        "vase",
        "scissors",
        "teddy bear",
        "hair drier",
        "toothbrush",
      ]
      .iter()
      .map(|s| s.to_string())
      .collect(),
      YoloModel::YoloV11Face | YoloModel::YoloV8Face => vec!["face".to_string()],
      _ => Vec::new(),
    }
  }
}

/// Конфигурация для процессора
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoloConfig {
  /// Тип модели
  pub model_type: YoloModel,
  /// Порог уверенности
  pub confidence_threshold: f32,
  /// Порог NMS (Non-Maximum Suppression)
  pub nms_threshold: f32,
  /// Максимальное количество детекций
  pub max_detections: usize,
  /// Размер входного изображения
  pub input_size: (u32, u32),
}

impl Default for YoloConfig {
  fn default() -> Self {
    Self {
      model_type: YoloModel::YoloV11Detection,
      confidence_threshold: 0.5,
      nms_threshold: 0.45,
      max_detections: 100,
      input_size: (640, 640),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use image::{DynamicImage, ImageBuffer, Rgb};
  use tempfile::TempDir;

  #[test]
  fn test_yolo_model_serialization() {
    let models = vec![
      YoloModel::YoloV11Detection,
      YoloModel::YoloV11Segmentation,
      YoloModel::YoloV11Face,
      YoloModel::YoloV8Detection,
      YoloModel::Custom(PathBuf::from("custom.onnx")),
    ];

    for model in models {
      let serialized = serde_json::to_string(&model).unwrap();
      let deserialized: YoloModel = serde_json::from_str(&serialized).unwrap();
      match (model, deserialized) {
        (YoloModel::Custom(p1), YoloModel::Custom(p2)) => assert_eq!(p1, p2),
        (m1, m2) => assert_eq!(format!("{m1:?}"), format!("{:?}", m2)),
      }
    }
  }

  #[test]
  fn test_detection_serialization() {
    let detection = Detection {
      class: "person".to_string(),
      class_id: 0,
      confidence: 0.95,
      bbox: BoundingBox {
        x: 100.0,
        y: 200.0,
        width: 50.0,
        height: 100.0,
      },
      attributes: Some(FaceAttributes {
        landmarks: vec![(120.0, 220.0), (130.0, 220.0)],
        age: Some(25.0),
        gender: Some("male".to_string()),
        emotion: Some("happy".to_string()),
      }),
    };

    let serialized = serde_json::to_string(&detection).unwrap();
    let deserialized: Detection = serde_json::from_str(&serialized).unwrap();

    assert_eq!(detection.class, deserialized.class);
    assert_eq!(detection.class_id, deserialized.class_id);
    assert_eq!(detection.confidence, deserialized.confidence);
    assert_eq!(detection.bbox.x, deserialized.bbox.x);
    assert_eq!(detection.bbox.y, deserialized.bbox.y);
  }

  #[test]
  fn test_yolo_processor_creation() {
    let processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5);
    assert!(processor.is_ok());

    let processor = processor.unwrap();
    assert_eq!(processor.confidence_threshold, 0.5);
    assert_eq!(processor.iou_threshold, 0.45);
    assert!(processor.target_classes.is_empty());
  }

  #[test]
  fn test_set_target_classes() {
    let mut processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5).unwrap();
    let classes = vec!["person".to_string(), "car".to_string()];
    processor.set_target_classes(classes.clone());
    assert_eq!(processor.target_classes, classes);
  }

  #[test]
  fn test_calculate_iou() {
    let box1 = BoundingBox {
      x: 0.0,
      y: 0.0,
      width: 100.0,
      height: 100.0,
    };

    let box2 = BoundingBox {
      x: 50.0,
      y: 50.0,
      width: 100.0,
      height: 100.0,
    };

    let iou = YoloProcessor::calculate_iou_static(&box1, &box2);
    assert!(iou > 0.0 && iou < 1.0);

    // Test no overlap
    let box3 = BoundingBox {
      x: 200.0,
      y: 200.0,
      width: 100.0,
      height: 100.0,
    };
    let iou_no_overlap = YoloProcessor::calculate_iou_static(&box1, &box3);
    assert_eq!(iou_no_overlap, 0.0);

    // Test complete overlap
    let iou_complete = YoloProcessor::calculate_iou_static(&box1, &box1);
    assert_eq!(iou_complete, 1.0);
  }

  #[test]
  fn test_apply_nms() {
    let detections = vec![
      Detection {
        class: "person".to_string(),
        class_id: 0,
        confidence: 0.9,
        bbox: BoundingBox {
          x: 100.0,
          y: 100.0,
          width: 50.0,
          height: 100.0,
        },
        attributes: None,
      },
      Detection {
        class: "person".to_string(),
        class_id: 0,
        confidence: 0.8,
        bbox: BoundingBox {
          x: 105.0,
          y: 105.0,
          width: 50.0,
          height: 100.0,
        },
        attributes: None,
      },
      Detection {
        class: "car".to_string(),
        class_id: 2,
        confidence: 0.85,
        bbox: BoundingBox {
          x: 300.0,
          y: 300.0,
          width: 100.0,
          height: 50.0,
        },
        attributes: None,
      },
    ];

    let filtered = YoloProcessor::apply_nms_static(detections, 0.5);
    assert_eq!(filtered.len(), 2); // Should keep high confidence person and car
    assert_eq!(filtered[0].confidence, 0.9);
    assert_eq!(filtered[1].class, "car");
  }

  #[test]
  fn test_get_class_names() {
    let processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5).unwrap();
    let classes = processor.get_class_names();
    assert!(!classes.is_empty());
    assert!(classes.contains(&"person".to_string()));
    assert!(classes.contains(&"car".to_string()));

    let face_processor = YoloProcessor::new(YoloModel::YoloV11Face, 0.5).unwrap();
    let face_classes = face_processor.get_class_names();
    assert_eq!(face_classes, vec!["face".to_string()]);
  }

  #[test]
  fn test_get_class_name_static() {
    let name = YoloProcessor::get_class_name_static(0);
    assert_eq!(name, "person");

    let name = YoloProcessor::get_class_name_static(2);
    assert_eq!(name, "car");

    // Test out of bounds
    let name = YoloProcessor::get_class_name_static(999);
    assert_eq!(name, "class_999");
  }

  #[test]
  fn test_yolo_config_default() {
    let config = YoloConfig::default();
    assert_eq!(config.confidence_threshold, 0.5);
    assert_eq!(config.nms_threshold, 0.45);
    assert_eq!(config.max_detections, 100);
    assert_eq!(config.input_size, (640, 640));
  }

  #[test]
  fn test_yolo_config_serialization() {
    let config = YoloConfig {
      model_type: YoloModel::YoloV8Face,
      confidence_threshold: 0.7,
      nms_threshold: 0.5,
      max_detections: 50,
      input_size: (416, 416),
    };

    let serialized = serde_json::to_string(&config).unwrap();
    let deserialized: YoloConfig = serde_json::from_str(&serialized).unwrap();

    assert_eq!(
      config.confidence_threshold,
      deserialized.confidence_threshold
    );
    assert_eq!(config.nms_threshold, deserialized.nms_threshold);
    assert_eq!(config.max_detections, deserialized.max_detections);
    assert_eq!(config.input_size, deserialized.input_size);
  }

  #[test]
  fn test_preprocess_image() {
    let processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5).unwrap();

    // Create a test image
    let img = ImageBuffer::from_fn(800, 600, |x, y| Rgb([x as u8, y as u8, 0]));
    let dynamic_img = DynamicImage::ImageRgb8(img);

    let result = processor.preprocess_image(&dynamic_img);
    assert!(result.is_ok());

    let _tensor = result.unwrap();
    // Check tensor shape through the data
    let shape = [1i64, 3, 640, 640];
    let _expected_size = shape.iter().product::<i64>() as usize;
    // We can't directly access tensor internals in tests, but we know it was created successfully
  }

  #[tokio::test]
  async fn test_process_image_without_model() {
    let mut processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5).unwrap();

    // Create temp image
    let temp_dir = TempDir::new().unwrap();
    let image_path = temp_dir.path().join("test.jpg");

    let img = ImageBuffer::from_fn(640, 480, |_, _| Rgb([255u8, 255u8, 255u8]));
    img.save(&image_path).unwrap();

    // Should fail without loaded model
    let result = processor.process_image(&image_path).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Model not loaded"));
  }

  #[tokio::test]
  async fn test_load_model_nonexistent() {
    let mut processor = YoloProcessor::new(
      YoloModel::Custom(PathBuf::from("/nonexistent/model.onnx")),
      0.5,
    )
    .unwrap();
    let result = processor.load_model().await;
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Model file not found"));
  }

  #[tokio::test]
  async fn test_process_batch() {
    let mut processor = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5).unwrap();

    // Create temp images
    let temp_dir = TempDir::new().unwrap();
    let mut paths = Vec::new();

    for i in 0..3 {
      let image_path = temp_dir.path().join(format!("test{i}.jpg"));
      let img = ImageBuffer::from_fn(640, 480, |_, _| Rgb([255u8, 255u8, 255u8]));
      img.save(&image_path).unwrap();
      paths.push(image_path);
    }

    // Should fail without loaded model
    let result = processor.process_batch(paths).await;
    assert!(result.is_err());
  }

  #[test]
  fn test_mock_process_image() {
    let processor = YoloProcessor::new(YoloModel::YoloV8Detection, 0.5).unwrap();

    let img = ImageBuffer::from_fn(800, 600, |_, _| Rgb([255u8, 255u8, 255u8]));
    let dynamic_img = DynamicImage::ImageRgb8(img);

    let detections = processor._mock_process_image(&dynamic_img);
    assert_eq!(detections.len(), 2);
    assert_eq!(detections[0].class, "person");
    assert_eq!(detections[1].class, "car");

    let face_processor = YoloProcessor::new(YoloModel::YoloV8Face, 0.5).unwrap();
    let face_detections = face_processor._mock_process_image(&dynamic_img);
    assert_eq!(face_detections.len(), 1);
    assert_eq!(face_detections[0].class, "face");
    assert!(face_detections[0].attributes.is_some());
  }

  #[test]
  fn test_init_ort_multiple_calls() {
    // Test that init_ort can be called multiple times safely
    let result1 = init_ort();
    let result2 = init_ort();

    // In test mode, both should succeed or both should fail
    assert_eq!(result1.is_ok(), result2.is_ok());
  }

  #[test]
  fn test_face_attributes_serialization() {
    let attrs = FaceAttributes {
      landmarks: vec![(10.0, 20.0), (30.0, 40.0)],
      age: Some(30.0),
      gender: Some("female".to_string()),
      emotion: Some("surprised".to_string()),
    };

    let serialized = serde_json::to_string(&attrs).unwrap();
    let deserialized: FaceAttributes = serde_json::from_str(&serialized).unwrap();

    assert_eq!(attrs.landmarks.len(), deserialized.landmarks.len());
    assert_eq!(attrs.age, deserialized.age);
    assert_eq!(attrs.gender, deserialized.gender);
    assert_eq!(attrs.emotion, deserialized.emotion);
  }
}

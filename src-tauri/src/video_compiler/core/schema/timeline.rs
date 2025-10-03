//! Timeline - Timeline, треки и клипы

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use super::common::AspectRatio;

/// Источник клипа
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ClipSource {
  /// Файл на диске
  File(String),
  /// Сгенерированный контент (цветовая заливка, тестовые сигналы и т.д.)
  Generated,
  /// Поток (URL, RTMP и т.д.)
  Stream(String),
  /// Устройство (камера, микрофон)
  Device(String),
}

/// Настройки timeline
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Timeline {
  /// Общая продолжительность в секундах
  pub duration: f64,
  /// Кадры в секунду
  pub fps: u32,
  /// Разрешение видео (ширина, высота)
  pub resolution: (u32, u32),
  /// Частота дискретизации аудио
  pub sample_rate: u32,
  /// Соотношение сторон
  pub aspect_ratio: AspectRatio,
}

impl Default for Timeline {
  fn default() -> Self {
    Self {
      duration: 0.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: AspectRatio::Ratio16x9,
    }
  }
}

/// Дорожка timeline (видео, аудио, субтитры)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Track {
  /// Уникальный идентификатор трека
  pub id: String,
  /// Тип трека
  pub track_type: TrackType,
  /// Название трека
  pub name: String,
  /// Включен ли трек
  pub enabled: bool,
  /// Громкость трека (0.0 - 1.0)
  pub volume: f32,
  /// Заблокирован ли трек для редактирования
  pub locked: bool,
  /// Список клипов в треке
  pub clips: Vec<Clip>,
  /// ID эффектов, применяемых ко всему треку
  pub effects: Vec<String>,
  /// ID фильтров, применяемых ко всему треку
  pub filters: Vec<String>,
}

impl Track {
  /// Создать новый трек
  pub fn new(track_type: TrackType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      track_type,
      name,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: Vec::new(),
      effects: Vec::new(),
      filters: Vec::new(),
    }
  }

  /// Валидация трека
  pub fn validate(&self) -> Result<(), String> {
    if self.name.is_empty() {
      return Err("Название трека не может быть пустым".to_string());
    }

    if self.volume < 0.0 || self.volume > 2.0 {
      return Err("Громкость трека должна быть в диапазоне 0.0-2.0".to_string());
    }

    // Валидация клипов
    for clip in &self.clips {
      clip.validate()?;
    }

    Ok(())
  }

  /// Добавить клип в трек
  pub fn add_clip(&mut self, clip: Clip) {
    self.clips.push(clip);
    self
      .clips
      .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
  }

  /// Удалить клип из трека
  pub fn remove_clip(&mut self, clip_id: &str) {
    self.clips.retain(|c| c.id != clip_id);
  }
}

/// Тип трека
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TrackType {
  /// Видео трек
  Video,
  /// Аудио трек
  Audio,
  /// Трек субтитров
  Subtitle,
}

/// Медиаклип на треке
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Clip {
  /// Уникальный идентификатор клипа
  pub id: String,
  /// Источник клипа
  pub source: ClipSource,
  /// Время начала клипа на timeline
  pub start_time: f64,
  /// Время окончания клипа на timeline
  pub end_time: f64,
  /// Время начала в исходном файле
  pub source_start: f64,
  /// Время окончания в исходном файле
  pub source_end: f64,
  /// Скорость воспроизведения (1.0 = нормальная)
  pub speed: f64,
  /// Прозрачность (0.0 - 1.0)
  pub opacity: f32,
  /// ID эффектов, применяемых к клипу
  pub effects: Vec<String>,
  /// ID фильтров, применяемых к клипу
  pub filters: Vec<String>,
  /// ID шаблона раскладки (для многокамерных эффектов)
  pub template_id: Option<String>,
  /// Позиция клипа в шаблоне
  pub template_position: Option<usize>,
  /// Настройки цветокоррекции
  pub color_correction: Option<ColorCorrection>,
  /// Настройки обрезки (кроп)
  pub crop: Option<CropSettings>,
  /// Настройки трансформации
  pub transform: Option<TransformSettings>,
  /// Альтернативный аудио трек
  pub audio_track_index: Option<u32>,
  /// Дополнительные свойства клипа
  pub properties: ClipProperties,
}

impl Clip {
  /// Создать новый клип
  pub fn new(source_path: PathBuf, start_time: f64, duration: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      source: ClipSource::File(source_path.to_string_lossy().to_string()),
      start_time,
      end_time: start_time + duration,
      source_start: 0.0,
      source_end: duration,
      speed: 1.0,
      opacity: 1.0,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    }
  }

  /// Валидация клипа
  pub fn validate(&self) -> Result<(), String> {
    if let ClipSource::File(path) = &self.source {
      if path.is_empty() {
        return Err("Путь к исходному файлу не может быть пустым".to_string());
      }
    }

    if self.start_time < 0.0 {
      return Err("Время начала клипа не может быть отрицательным".to_string());
    }

    if self.end_time <= self.start_time {
      return Err("Время окончания должно быть больше времени начала".to_string());
    }

    if self.speed <= 0.0 {
      return Err("Скорость воспроизведения должна быть больше 0".to_string());
    }

    if self.opacity < 0.0 || self.opacity > 1.0 {
      return Err("Прозрачность должна быть в диапазоне 0.0-1.0".to_string());
    }

    Ok(())
  }

  /// Получить длительность клипа на timeline
  pub fn get_timeline_duration(&self) -> f64 {
    self.end_time - self.start_time
  }

  /// Получить длительность из исходного файла
  pub fn get_source_duration(&self) -> f64 {
    (self.source_end - self.source_start) / self.speed
  }

  /// Проверить, содержит ли клип заданную точку времени
  pub fn contains_time(&self, time: f64) -> bool {
    time >= self.start_time && time < self.end_time
  }
}

/// Настройки цветокоррекции
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColorCorrection {
  pub brightness: f32,
  pub contrast: f32,
  pub saturation: f32,
  pub hue: f32,
  pub gamma: f32,
  pub highlights: f32,
  pub shadows: f32,
  pub whites: f32,
  pub blacks: f32,
}

impl Default for ColorCorrection {
  fn default() -> Self {
    Self {
      brightness: 0.0,
      contrast: 1.0,
      saturation: 1.0,
      hue: 0.0,
      gamma: 1.0,
      highlights: 0.0,
      shadows: 0.0,
      whites: 0.0,
      blacks: 0.0,
    }
  }
}

/// Настройки обрезки (кроп)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CropSettings {
  pub left: u32,
  pub top: u32,
  pub right: u32,
  pub bottom: u32,
}

/// Настройки трансформации
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransformSettings {
  pub scale_x: f32,
  pub scale_y: f32,
  pub position_x: f32,
  pub position_y: f32,
  pub rotation: f32,
  pub anchor_x: f32,
  pub anchor_y: f32,
}

impl Default for TransformSettings {
  fn default() -> Self {
    Self {
      scale_x: 1.0,
      scale_y: 1.0,
      position_x: 0.0,
      position_y: 0.0,
      rotation: 0.0,
      anchor_x: 0.5,
      anchor_y: 0.5,
    }
  }
}

/// Дополнительные свойства клипа
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ClipProperties {
  /// Заметки о клипе
  pub notes: Option<String>,
  /// Теги для поиска и организации
  pub tags: Vec<String>,
  /// Пользовательские метаданные
  pub custom_metadata: std::collections::HashMap<String, serde_json::Value>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::PathBuf;

  #[test]
  fn test_clip_source_variants() {
    let file_source = ClipSource::File("video.mp4".to_string());
    let generated_source = ClipSource::Generated;
    let stream_source = ClipSource::Stream("rtmp://example.com/stream".to_string());
    let device_source = ClipSource::Device("camera_0".to_string());

    // Проверяем сериализацию/десериализацию
    let json = serde_json::to_string(&file_source).unwrap();
    let deserialized: ClipSource = serde_json::from_str(&json).unwrap();
    match deserialized {
      ClipSource::File(path) => assert_eq!(path, "video.mp4"),
      _ => panic!("Wrong variant"),
    }

    // Проверяем остальные варианты
    assert!(matches!(generated_source, ClipSource::Generated));
    assert!(matches!(stream_source, ClipSource::Stream(_)));
    assert!(matches!(device_source, ClipSource::Device(_)));
  }

  #[test]
  fn test_timeline_default() {
    let timeline = Timeline::default();
    assert_eq!(timeline.duration, 0.0);
    assert_eq!(timeline.fps, 30);
    assert_eq!(timeline.resolution, (1920, 1080));
    assert_eq!(timeline.sample_rate, 48000);
    assert!(matches!(timeline.aspect_ratio, AspectRatio::Ratio16x9));
  }

  #[test]
  fn test_timeline_custom() {
    let timeline = Timeline {
      duration: 120.5,
      fps: 60,
      resolution: (3840, 2160),
      sample_rate: 96000,
      aspect_ratio: AspectRatio::Ratio16x9,
    };

    assert_eq!(timeline.duration, 120.5);
    assert_eq!(timeline.fps, 60);
    assert_eq!(timeline.resolution, (3840, 2160));
    assert_eq!(timeline.sample_rate, 96000);
  }

  #[test]
  fn test_timeline_serialization() {
    let timeline = Timeline {
      duration: 60.0,
      fps: 24,
      resolution: (1280, 720),
      sample_rate: 44100,
      aspect_ratio: AspectRatio::Ratio16x9,
    };

    let json = serde_json::to_string(&timeline).unwrap();
    let deserialized: Timeline = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.duration, timeline.duration);
    assert_eq!(deserialized.fps, timeline.fps);
    assert_eq!(deserialized.resolution, timeline.resolution);
    assert_eq!(deserialized.sample_rate, timeline.sample_rate);
  }

  #[test]
  fn test_track_creation() {
    let track = Track::new(TrackType::Video, "Main Video".to_string());

    assert!(!track.id.is_empty());
    assert_eq!(track.track_type, TrackType::Video);
    assert_eq!(track.name, "Main Video");
    assert!(track.enabled);
    assert_eq!(track.volume, 1.0);
    assert!(!track.locked);
    assert!(track.clips.is_empty());
    assert!(track.effects.is_empty());
    assert!(track.filters.is_empty());
  }

  #[test]
  fn test_track_validation() {
    // Валидный трек
    let valid_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    assert!(valid_track.validate().is_ok());

    // Трек с пустым именем
    let mut invalid_track = Track::new(TrackType::Video, "".to_string());
    assert!(invalid_track.validate().is_err());
    assert!(invalid_track.validate().unwrap_err().contains("пустым"));

    // Трек с невалидной громкостью (слишком низкая)
    invalid_track.name = "Valid Name".to_string();
    invalid_track.volume = -0.5;
    assert!(invalid_track.validate().is_err());
    assert!(invalid_track.validate().unwrap_err().contains("0.0-2.0"));

    // Трек с невалидной громкостью (слишком высокая)
    invalid_track.volume = 2.5;
    assert!(invalid_track.validate().is_err());
  }

  #[test]
  fn test_track_add_remove_clips() {
    let mut track = Track::new(TrackType::Video, "Video Track".to_string());

    // Добавляем клипы
    let clip1 = Clip::new(PathBuf::from("video1.mp4"), 5.0, 10.0);
    let clip1_id = clip1.id.clone();
    let clip2 = Clip::new(PathBuf::from("video2.mp4"), 0.0, 5.0);
    let clip2_id = clip2.id.clone();
    let clip3 = Clip::new(PathBuf::from("video3.mp4"), 15.0, 10.0);

    track.add_clip(clip1);
    track.add_clip(clip2);
    track.add_clip(clip3);

    // Проверяем, что клипы отсортированы по времени начала
    assert_eq!(track.clips.len(), 3);
    assert_eq!(track.clips[0].start_time, 0.0);
    assert_eq!(track.clips[1].start_time, 5.0);
    assert_eq!(track.clips[2].start_time, 15.0);

    // Удаляем клип
    track.remove_clip(&clip2_id);
    assert_eq!(track.clips.len(), 2);
    assert_eq!(track.clips[0].id, clip1_id);
  }

  #[test]
  fn test_track_type_equality() {
    assert_eq!(TrackType::Video, TrackType::Video);
    assert_ne!(TrackType::Video, TrackType::Audio);
    assert_ne!(TrackType::Audio, TrackType::Subtitle);
  }

  #[test]
  fn test_clip_creation() {
    let clip = Clip::new(PathBuf::from("test.mp4"), 10.0, 5.0);

    assert!(!clip.id.is_empty());
    assert!(matches!(clip.source, ClipSource::File(_)));
    assert_eq!(clip.start_time, 10.0);
    assert_eq!(clip.end_time, 15.0);
    assert_eq!(clip.source_start, 0.0);
    assert_eq!(clip.source_end, 5.0);
    assert_eq!(clip.speed, 1.0);
    assert_eq!(clip.opacity, 1.0);
    assert!(clip.effects.is_empty());
    assert!(clip.filters.is_empty());
    assert!(clip.template_id.is_none());
    assert!(clip.template_position.is_none());
    assert!(clip.color_correction.is_none());
    assert!(clip.crop.is_none());
    assert!(clip.transform.is_none());
    assert!(clip.audio_track_index.is_none());
  }

  #[test]
  fn test_clip_validation() {
    // Валидный клип
    let valid_clip = Clip::new(PathBuf::from("video.mp4"), 0.0, 10.0);
    assert!(valid_clip.validate().is_ok());

    // Клип с пустым путём файла
    let mut invalid_clip = valid_clip.clone();
    invalid_clip.source = ClipSource::File("".to_string());
    assert!(invalid_clip.validate().is_err());
    assert!(invalid_clip.validate().unwrap_err().contains("пустым"));

    // Клип с отрицательным временем начала
    invalid_clip.source = ClipSource::File("video.mp4".to_string());
    invalid_clip.start_time = -1.0;
    assert!(invalid_clip.validate().is_err());
    assert!(invalid_clip
      .validate()
      .unwrap_err()
      .contains("отрицательным"));

    // Клип с end_time <= start_time
    invalid_clip.start_time = 10.0;
    invalid_clip.end_time = 10.0;
    assert!(invalid_clip.validate().is_err());
    assert!(invalid_clip
      .validate()
      .unwrap_err()
      .contains("больше времени начала"));

    // Клип с невалидной скоростью
    invalid_clip.end_time = 20.0;
    invalid_clip.speed = 0.0;
    assert!(invalid_clip.validate().is_err());
    assert!(invalid_clip.validate().unwrap_err().contains("больше 0"));

    // Клип с невалидной прозрачностью
    invalid_clip.speed = 1.0;
    invalid_clip.opacity = 1.5;
    assert!(invalid_clip.validate().is_err());
    assert!(invalid_clip.validate().unwrap_err().contains("0.0-1.0"));
  }

  #[test]
  fn test_clip_durations() {
    let clip = Clip::new(PathBuf::from("video.mp4"), 5.0, 10.0);

    // Timeline duration
    assert_eq!(clip.get_timeline_duration(), 10.0);

    // Source duration с нормальной скоростью
    assert_eq!(clip.get_source_duration(), 10.0);

    // Source duration с измененной скоростью
    let mut fast_clip = clip.clone();
    fast_clip.speed = 2.0;
    assert_eq!(fast_clip.get_source_duration(), 5.0);

    let mut slow_clip = clip.clone();
    slow_clip.speed = 0.5;
    assert_eq!(slow_clip.get_source_duration(), 20.0);
  }

  #[test]
  fn test_clip_contains_time() {
    let clip = Clip::new(PathBuf::from("video.mp4"), 10.0, 5.0);

    assert!(!clip.contains_time(9.9));
    assert!(clip.contains_time(10.0));
    assert!(clip.contains_time(12.5));
    assert!(clip.contains_time(14.9));
    assert!(!clip.contains_time(15.0));
    assert!(!clip.contains_time(15.1));
  }

  #[test]
  fn test_clip_with_advanced_properties() {
    let mut clip = Clip::new(PathBuf::from("video.mp4"), 0.0, 10.0);

    // Добавляем эффекты и фильтры
    clip.effects = vec!["effect1".to_string(), "effect2".to_string()];
    clip.filters = vec!["filter1".to_string()];

    // Добавляем template info
    clip.template_id = Some("template_123".to_string());
    clip.template_position = Some(2);

    // Добавляем цветокоррекцию
    clip.color_correction = Some(ColorCorrection {
      brightness: 0.1,
      contrast: 1.2,
      ..Default::default()
    });

    // Добавляем crop
    clip.crop = Some(CropSettings {
      left: 10,
      top: 20,
      right: 30,
      bottom: 40,
    });

    // Добавляем transform
    clip.transform = Some(TransformSettings {
      scale_x: 1.5,
      scale_y: 1.5,
      rotation: 45.0,
      ..Default::default()
    });

    // Добавляем audio track
    clip.audio_track_index = Some(2);

    // Валидация должна пройти
    assert!(clip.validate().is_ok());
  }

  #[test]
  fn test_color_correction_default() {
    let cc = ColorCorrection::default();
    assert_eq!(cc.brightness, 0.0);
    assert_eq!(cc.contrast, 1.0);
    assert_eq!(cc.saturation, 1.0);
    assert_eq!(cc.hue, 0.0);
    assert_eq!(cc.gamma, 1.0);
    assert_eq!(cc.highlights, 0.0);
    assert_eq!(cc.shadows, 0.0);
    assert_eq!(cc.whites, 0.0);
    assert_eq!(cc.blacks, 0.0);
  }

  #[test]
  fn test_transform_settings_default() {
    let transform = TransformSettings::default();
    assert_eq!(transform.scale_x, 1.0);
    assert_eq!(transform.scale_y, 1.0);
    assert_eq!(transform.position_x, 0.0);
    assert_eq!(transform.position_y, 0.0);
    assert_eq!(transform.rotation, 0.0);
    assert_eq!(transform.anchor_x, 0.5);
    assert_eq!(transform.anchor_y, 0.5);
  }

  #[test]
  fn test_clip_properties() {
    let mut props = ClipProperties {
      notes: Some("This is a test clip".to_string()),
      tags: vec!["intro".to_string(), "logo".to_string()],
      ..Default::default()
    };

    // Добавляем кастомные метаданные
    props
      .custom_metadata
      .insert("author".to_string(), serde_json::json!("John Doe"));
    props
      .custom_metadata
      .insert("rating".to_string(), serde_json::json!(5));

    assert_eq!(props.notes, Some("This is a test clip".to_string()));
    assert_eq!(props.tags.len(), 2);
    assert_eq!(props.custom_metadata.len(), 2);
  }

  #[test]
  fn test_complete_timeline_serialization() {
    // Создаем полный timeline с треками и клипами
    let mut track = Track::new(TrackType::Video, "Main Video".to_string());

    let mut clip = Clip::new(PathBuf::from("video.mp4"), 0.0, 10.0);
    clip.effects = vec!["fade_in".to_string()];
    clip.color_correction = Some(ColorCorrection {
      brightness: 0.2,
      contrast: 1.1,
      ..Default::default()
    });

    track.add_clip(clip);

    // Сериализуем трек
    let json = serde_json::to_string_pretty(&track).unwrap();

    // Десериализуем обратно
    let deserialized: Track = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.name, track.name);
    assert_eq!(deserialized.clips.len(), 1);
    assert_eq!(deserialized.clips[0].effects, vec!["fade_in"]);
    assert!(deserialized.clips[0].color_correction.is_some());
  }

  #[test]
  fn test_track_with_invalid_clips() {
    let mut track = Track::new(TrackType::Video, "Video Track".to_string());

    // Добавляем невалидный клип
    let mut invalid_clip = Clip::new(PathBuf::from("video.mp4"), 0.0, 10.0);
    invalid_clip.opacity = 2.0; // Невалидная прозрачность

    track.add_clip(invalid_clip);

    // Валидация трека должна провалиться из-за невалидного клипа
    assert!(track.validate().is_err());
  }

  #[test]
  fn test_clip_source_validation() {
    // File source с путём - валидно
    let file_clip = Clip {
      source: ClipSource::File("video.mp4".to_string()),
      ..Clip::new(PathBuf::from("dummy"), 0.0, 10.0)
    };
    assert!(file_clip.validate().is_ok());

    // Generated source - всегда валидно
    let generated_clip = Clip {
      source: ClipSource::Generated,
      ..Clip::new(PathBuf::from("dummy"), 0.0, 10.0)
    };
    assert!(generated_clip.validate().is_ok());

    // Stream source - всегда валидно (даже с пустой строкой)
    let stream_clip = Clip {
      source: ClipSource::Stream("".to_string()),
      ..Clip::new(PathBuf::from("dummy"), 0.0, 10.0)
    };
    assert!(stream_clip.validate().is_ok());

    // Device source - всегда валидно
    let device_clip = Clip {
      source: ClipSource::Device("camera".to_string()),
      ..Clip::new(PathBuf::from("dummy"), 0.0, 10.0)
    };
    assert!(device_clip.validate().is_ok());
  }

  #[test]
  fn test_edge_cases() {
    // Clip с очень маленькой продолжительностью
    let tiny_clip = Clip::new(PathBuf::from("tiny.mp4"), 0.0, 0.001);
    assert!(tiny_clip.validate().is_ok());
    assert_eq!(tiny_clip.get_timeline_duration(), 0.001);

    // Track с максимальной громкостью
    let mut loud_track = Track::new(TrackType::Audio, "Loud".to_string());
    loud_track.volume = 2.0;
    assert!(loud_track.validate().is_ok());

    // Clip с очень высокой скоростью
    let mut fast_clip = Clip::new(PathBuf::from("fast.mp4"), 0.0, 10.0);
    fast_clip.speed = 100.0;
    assert!(fast_clip.validate().is_ok());
    assert_eq!(fast_clip.get_source_duration(), 0.1);
  }
}

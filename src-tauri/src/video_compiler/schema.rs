//! Schema - Схема данных проекта Timeline Studio
//!
//! Этот модуль определяет структуры данных для описания проектов видеомонтажа,
//! включая timeline, треки, клипы, эффекты и настройки.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Основная схема проекта Timeline Studio
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSchema {
  /// Версия схемы проекта для совместимости
  pub version: String,
  /// Метаданные проекта
  pub metadata: ProjectMetadata,
  /// Настройки timeline (fps, разрешение, длительность)
  pub timeline: Timeline,
  /// Список треков (видео, аудио, субтитры)
  pub tracks: Vec<Track>,
  /// Глобальные эффекты проекта
  pub effects: Vec<Effect>,
  /// Переходы между клипами
  pub transitions: Vec<Transition>,
  /// Настройки проекта и экспорта
  pub settings: ProjectSettings,
}

impl ProjectSchema {
  /// Создать новый пустой проект
  pub fn new(name: String) -> Self {
    Self {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name,
        description: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: None,
      },
      timeline: Timeline::default(),
      tracks: Vec::new(),
      effects: Vec::new(),
      transitions: Vec::new(),
      settings: ProjectSettings::default(),
    }
  }

  /// Валидация схемы проекта
  pub fn validate(&self) -> Result<(), String> {
    // Проверка версии
    if self.version.is_empty() {
      return Err("Версия проекта не может быть пустой".to_string());
    }

    // Проверка timeline
    if self.timeline.fps == 0 {
      return Err("FPS должен быть больше 0".to_string());
    }

    if self.timeline.resolution.0 == 0 || self.timeline.resolution.1 == 0 {
      return Err("Разрешение должно быть больше 0x0".to_string());
    }

    // Проверка треков
    for track in &self.tracks {
      track.validate()?;
    }

    // Проверка клипов на пересечения по времени в одном треке
    for track in &self.tracks {
      let mut clips = track.clips.clone();
      clips.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

      for i in 0..clips.len().saturating_sub(1) {
        if clips[i].end_time > clips[i + 1].start_time {
          return Err(format!(
            "Клипы пересекаются по времени в треке '{}': {} и {}",
            track.name,
            clips[i].id,
            clips[i + 1].id
          ));
        }
      }
    }

    Ok(())
  }

  /// Получить общую длительность проекта
  pub fn get_duration(&self) -> f64 {
    self
      .tracks
      .iter()
      .flat_map(|track| &track.clips)
      .map(|clip| clip.end_time)
      .fold(0.0, f64::max)
  }

  /// Обновить время модификации
  pub fn touch(&mut self) {
    self.metadata.modified_at = Utc::now();
  }
}

/// Метаданные проекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectMetadata {
  /// Название проекта
  pub name: String,
  /// Описание проекта
  pub description: Option<String>,
  /// Время создания
  pub created_at: DateTime<Utc>,
  /// Время последней модификации
  pub modified_at: DateTime<Utc>,
  /// Автор проекта
  pub author: Option<String>,
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

/// Соотношение сторон видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AspectRatio {
  Ratio16x9,   // 16:9 (широкоформатное)
  Ratio4x3,    // 4:3 (стандартное)
  Ratio21x9,   // 21:9 (ультраширокое)
  Ratio1x1,    // 1:1 (квадратное)
  Ratio9x16,   // 9:16 (вертикальное для мобильных)
  Custom(f32), // Произвольное соотношение
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
    }
  }

  /// Валидация трека
  pub fn validate(&self) -> Result<(), String> {
    if self.name.is_empty() {
      return Err("Название трека не может быть пустым".to_string());
    }

    if !(0.0..=1.0).contains(&self.volume) {
      return Err("Громкость должна быть в диапазоне 0.0-1.0".to_string());
    }

    for clip in &self.clips {
      clip.validate()?;
    }

    Ok(())
  }

  /// Добавить клип в трек
  pub fn add_clip(&mut self, clip: Clip) -> Result<(), String> {
    // Проверяем, что клип не пересекается с существующими
    for existing_clip in &self.clips {
      if !(clip.end_time <= existing_clip.start_time || clip.start_time >= existing_clip.end_time) {
        return Err(format!(
          "Клип пересекается с существующим клипом {}",
          existing_clip.id
        ));
      }
    }

    self.clips.push(clip);
    Ok(())
  }
}

/// Тип дорожки
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TrackType {
  /// Видео дорожка
  Video,
  /// Аудио дорожка
  Audio,
  /// Дорожка субтитров
  Subtitle,
}

/// Клип медиа на дорожке
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Clip {
  /// Уникальный идентификатор клипа
  pub id: String,
  /// Путь к исходному медиа файлу
  pub source_path: PathBuf,
  /// Время начала клипа на timeline (секунды)
  pub start_time: f64,
  /// Время окончания клипа на timeline (секунды)
  pub end_time: f64,
  /// Время начала в исходном файле (секунды)
  pub source_start: f64,
  /// Время окончания в исходном файле (секунды)
  pub source_end: f64,
  /// Скорость воспроизведения (1.0 = нормальная)
  pub speed: f32,
  /// Громкость клипа (0.0 - 1.0)
  pub volume: f32,
  /// Заблокирован ли клип
  pub locked: bool,
  /// ID эффектов, применяемых к клипу
  pub effects: Vec<String>,
  /// Дополнительные свойства клипа
  pub properties: HashMap<String, serde_json::Value>,
}

impl Clip {
  /// Создать новый клип
  pub fn new(source_path: PathBuf, start_time: f64, duration: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      source_path,
      start_time,
      end_time: start_time + duration,
      source_start: 0.0,
      source_end: duration,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: Vec::new(),
      properties: HashMap::new(),
    }
  }

  /// Валидация клипа
  pub fn validate(&self) -> Result<(), String> {
    if self.start_time < 0.0 {
      return Err("Время начала не может быть отрицательным".to_string());
    }

    if self.end_time <= self.start_time {
      return Err("Время окончания должно быть больше времени начала".to_string());
    }

    if self.source_start < 0.0 {
      return Err("Время начала в источнике не может быть отрицательным".to_string());
    }

    if self.source_end <= self.source_start {
      return Err("Время окончания в источнике должно быть больше времени начала".to_string());
    }

    if self.speed <= 0.0 {
      return Err("Скорость должна быть больше 0".to_string());
    }

    if !(0.0..=1.0).contains(&self.volume) {
      return Err("Громкость должна быть в диапазоне 0.0-1.0".to_string());
    }

    if !self.source_path.exists() {
      return Err(format!("Исходный файл не найден: {:?}", self.source_path));
    }

    Ok(())
  }

  /// Получить длительность клипа на timeline
  pub fn get_timeline_duration(&self) -> f64 {
    self.end_time - self.start_time
  }

  /// Получить длительность исходного материала
  pub fn get_source_duration(&self) -> f64 {
    self.source_end - self.source_start
  }
}

/// Эффект, применяемый к клипу или треку
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Effect {
  /// Уникальный идентификатор эффекта
  pub id: String,
  /// Тип эффекта (строка для расширяемости)
  pub effect_type: EffectType,
  /// Название эффекта
  pub name: String,
  /// Категория эффекта
  pub category: Option<EffectCategory>,
  /// Сложность эффекта
  pub complexity: Option<EffectComplexity>,
  /// Теги эффекта
  pub tags: Vec<EffectTag>,
  /// Описание эффекта (локализованное)
  pub description: Option<HashMap<String, String>>,
  /// Метки эффекта (локализованные)
  pub labels: Option<HashMap<String, String>>,
  /// Включен ли эффект
  pub enabled: bool,
  /// Параметры эффекта
  pub parameters: HashMap<String, EffectParameter>,
  /// Время начала эффекта (для анимации)
  pub start_time: Option<f64>,
  /// Время окончания эффекта (для анимации)
  pub end_time: Option<f64>,
  /// FFmpeg команда (в виде шаблона)
  pub ffmpeg_command: Option<String>,
  /// CSS фильтр (в виде шаблона)
  pub css_filter: Option<String>,
  /// Путь к превью
  pub preview_path: Option<String>,
  /// Пресеты эффекта
  pub presets: Option<HashMap<String, EffectPreset>>,
}

/// Пресет эффекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EffectPreset {
  /// Название пресета (локализованное)
  pub name: HashMap<String, String>,
  /// Параметры пресета
  pub params: HashMap<String, EffectParameter>,
  /// Описание пресета (локализованное)
  pub description: HashMap<String, String>,
}

impl Effect {
  /// Создать новый эффект
  pub fn new(effect_type: EffectType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      effect_type,
      name,
      category: None,
      complexity: None,
      tags: Vec::new(),
      description: None,
      labels: None,
      enabled: true,
      parameters: HashMap::new(),
      start_time: None,
      end_time: None,
      ffmpeg_command: None,
      css_filter: None,
      preview_path: None,
      presets: None,
    }
  }
}

/// Тип эффекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectType {
  /// Размытие
  Blur,
  /// Яркость
  Brightness,
  /// Контрастность
  Contrast,
  /// Скорость
  Speed,
  /// Реверс
  Reverse,
  /// Черно-белый
  Grayscale,
  /// Сепия
  Sepia,
  /// Насыщенность
  Saturation,
  /// Поворот оттенка
  HueRotate,
  /// Винтаж
  Vintage,
  /// Дуотон
  Duotone,
  /// Нуар
  Noir,
  /// Киберпанк
  Cyberpunk,
  /// Мечтательный
  Dreamy,
  /// Инфракрасный
  Infrared,
  /// Матрица
  Matrix,
  /// Арктический
  Arctic,
  /// Закат
  Sunset,
  /// Ломо
  Lomo,
  /// Сумерки
  Twilight,
  /// Неон
  Neon,
  /// Инверсия
  Invert,
  /// Виньетка
  Vignette,
  /// Зерно пленки
  FilmGrain,
  /// Хроматическая аберрация
  ChromaticAberration,
  /// Блик объектива
  LensFlare,
  /// Свечение
  Glow,
  /// Резкость
  Sharpen,
  /// Шумоподавление
  NoiseReduction,
  /// Стабилизация
  Stabilization,
}

/// Категория эффекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectCategory {
  /// Цветокоррекция
  ColorCorrection,
  /// Художественные
  Artistic,
  /// Винтажные
  Vintage,
  /// Кинематографические
  Cinematic,
  /// Креативные
  Creative,
  /// Технические
  Technical,
  /// Движение и скорость
  Motion,
  /// Искажения
  Distortion,
}

/// Сложность эффекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectComplexity {
  /// Базовый
  Basic,
  /// Средний
  Intermediate,
  /// Продвинутый
  Advanced,
}

/// Теги эффектов
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectTag {
  /// Популярный
  Popular,
  /// Профессиональный
  Professional,
  /// Для начинающих
  BeginnerFriendly,
  /// Экспериментальный
  Experimental,
  /// Ретро
  Retro,
  /// Современный
  Modern,
  /// Драматический
  Dramatic,
  /// Тонкий
  Subtle,
  /// Интенсивный
  Intense,
}

/// Параметр эффекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum EffectParameter {
  /// Число с плавающей точкой
  Float(f32),
  /// Целое число
  Int(i32),
  /// Строка
  String(String),
  /// Булево значение
  Bool(bool),
  /// Цвет в формате RGBA
  Color(u32),
  /// Массив чисел
  FloatArray(Vec<f32>),
  /// Путь к файлу
  FilePath(PathBuf),
}

/// Переход между клипами
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transition {
  /// Уникальный идентификатор перехода
  pub id: String,
  /// Тип перехода (строка для расширяемости)
  pub transition_type: TransitionType,
  /// Название перехода
  pub name: String,
  /// Метки перехода (локализованные)
  pub labels: Option<HashMap<String, String>>,
  /// Описание перехода (локализованное)
  pub description: Option<HashMap<String, String>>,
  /// Категория перехода
  pub category: Option<TransitionCategory>,
  /// Сложность перехода
  pub complexity: Option<TransitionComplexity>,
  /// Теги перехода
  pub tags: Vec<TransitionTag>,
  /// Настройки длительности
  pub duration: TransitionDuration,
  /// Время начала перехода на timeline
  pub start_time: f64,
  /// ID клипа "от"
  pub from_clip_id: String,
  /// ID клипа "к"
  pub to_clip_id: String,
  /// Параметры перехода
  pub parameters: HashMap<String, EffectParameter>,
  /// FFmpeg команда (в виде шаблона)
  pub ffmpeg_command: Option<String>,
  /// Путь к превью
  pub preview_path: Option<String>,
}

/// Настройки длительности перехода
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransitionDuration {
  /// Минимальная длительность в секундах
  pub min: f64,
  /// Максимальная длительность в секундах
  pub max: f64,
  /// Длительность по умолчанию
  pub default: f64,
  /// Текущая длительность
  pub current: f64,
}

/// Фильтр видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoFilter {
  /// Уникальный идентификатор фильтра
  pub id: String,
  /// Название фильтра
  pub name: String,
  /// Категория фильтра
  pub category: FilterCategory,
  /// Сложность фильтра
  pub complexity: FilterComplexity,
  /// Теги фильтра
  pub tags: Vec<FilterTag>,
  /// Описание фильтра (локализованное)
  pub description: HashMap<String, String>,
  /// Метки фильтра (локализованные)
  pub labels: HashMap<String, String>,
  /// Параметры фильтра
  pub params: HashMap<String, f32>,
}

/// Категория фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterCategory {
  /// Цветокоррекция
  ColorCorrection,
  /// Технические
  Technical,
  /// Кинематографические
  Cinematic,
  /// Художественные
  Artistic,
  /// Креативные
  Creative,
  /// Винтажные
  Vintage,
}

/// Сложность фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterComplexity {
  /// Базовый
  Basic,
  /// Средний
  Intermediate,
  /// Продвинутый
  Advanced,
}

/// Тег фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterTag {
  /// Логарифмический
  Log,
  /// Профессиональный
  Professional,
  /// Стандартный
  Standard,
  /// Нейтральный
  Neutral,
  /// Кинематографический
  Cinematic,
  /// Портрет
  Portrait,
  /// Пейзаж
  Landscape,
  /// Винтажный
  Vintage,
  /// Теплый
  Warm,
  /// Холодный
  Cold,
  /// Драматический
  Dramatic,
  /// Мягкий
  Soft,
  /// Яркий
  Vibrant,
  /// Резервный
  Fallback,
}

/// Тип перехода (расширяемый через строки)
pub type TransitionType = String;

/// Категория перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionCategory {
  /// Базовые
  Basic,
  /// Продвинутые
  Advanced,
  /// Креативные
  Creative,
  /// 3D
  ThreeD,
  /// Художественные
  Artistic,
  /// Кинематографические
  Cinematic,
}

/// Сложность перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionComplexity {
  /// Базовый
  Basic,
  /// Средний
  Intermediate,
  /// Продвинутый
  Advanced,
}

/// Тег перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionTag {
  /// Приближение
  Zoom,
  /// Масштаб
  Scale,
  /// Плавный
  Smooth,
  /// Затухание
  Fade,
  /// Прозрачность
  Opacity,
  /// Классический
  Classic,
  /// Слайд
  Slide,
  /// Движение
  Movement,
  /// Направление
  Direction,
  /// Размер
  Size,
  /// Трансформация
  Transform,
  /// Поворот
  Rotate,
  /// Вращение
  Spin,
  /// Переворот
  Flip,
  /// Зеркало
  Mirror,
  /// Выталкивание
  Push,
  /// Смещение
  Displacement,
  /// Сжатие
  Squeeze,
  /// Компрессия
  Compress,
  /// Эластичный
  Elastic,
  /// Диагональный
  Diagonal,
  /// Угол
  Angle,
  /// Спираль
  Spiral,
  /// Вращение
  Rotation,
  /// 3D
  ThreeD,
  /// Сложный
  Complex,
  /// Резервный
  Fallback,
}

/// Настройки проекта
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ProjectSettings {
  /// Настройки экспорта
  pub export: ExportSettings,
  /// Настройки превью
  pub preview: PreviewSettings,
  /// Пользовательские настройки
  pub custom: HashMap<String, serde_json::Value>,
}

/// Настройки экспорта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportSettings {
  /// Формат вывода
  pub format: OutputFormat,
  /// Качество (от 1 до 100)
  pub quality: u8,
  /// Битрейт видео (kbps)
  pub video_bitrate: u32,
  /// Битрейт аудио (kbps)
  pub audio_bitrate: u32,
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
  /// Дополнительные параметры FFmpeg
  pub ffmpeg_args: Vec<String>,
}

impl Default for ExportSettings {
  fn default() -> Self {
    Self {
      format: OutputFormat::Mp4,
      quality: 85,
      video_bitrate: 8000,
      audio_bitrate: 192,
      hardware_acceleration: true,
      ffmpeg_args: Vec::new(),
    }
  }
}

/// Формат вывода видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum OutputFormat {
  Mp4,
  Avi,
  Mov,
  Mkv,
  WebM,
  Gif,
  Custom(String),
}

/// Настройки превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PreviewSettings {
  /// Разрешение превью
  pub resolution: (u32, u32),
  /// Качество превью (от 1 до 100)
  pub quality: u8,
  /// FPS превью
  pub fps: u32,
  /// Формат превью
  pub format: PreviewFormat,
}

impl Default for PreviewSettings {
  fn default() -> Self {
    Self {
      resolution: (640, 360),
      quality: 75,
      fps: 15,
      format: PreviewFormat::Jpeg,
    }
  }
}

/// Формат превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PreviewFormat {
  Jpeg,
  Png,
  WebP,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_project_schema_creation() {
    let project = ProjectSchema::new("Test Project".to_string());
    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.version, "1.0.0");
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
  }

  #[test]
  fn test_track_creation() {
    let track = Track::new(TrackType::Video, "Video Track 1".to_string());
    assert_eq!(track.track_type, TrackType::Video);
    assert_eq!(track.name, "Video Track 1");
    assert!(track.enabled);
    assert_eq!(track.volume, 1.0);
    assert!(!track.id.is_empty());
  }

  #[test]
  fn test_clip_creation() {
    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 10.0, 5.0);
    assert_eq!(clip.start_time, 10.0);
    assert_eq!(clip.end_time, 15.0);
    assert_eq!(clip.get_timeline_duration(), 5.0);
    assert_eq!(clip.speed, 1.0);
    assert!(!clip.id.is_empty());
  }

  #[test]
  fn test_effect_creation() {
    let effect = Effect::new(EffectType::Blur, "Blur".to_string());
    assert_eq!(effect.effect_type, EffectType::Blur);
    assert_eq!(effect.name, "Blur");
    assert!(effect.enabled);
    assert!(!effect.id.is_empty());
  }

  #[test]
  fn test_project_validation() {
    let mut project = ProjectSchema::new("Test".to_string());

    // Пустой проект должен быть валидным
    assert!(project.validate().is_ok());

    // Невалидный FPS
    project.timeline.fps = 0;
    assert!(project.validate().is_err());

    // Восстанавливаем валидный FPS
    project.timeline.fps = 30;
    assert!(project.validate().is_ok());

    // Невалидное разрешение
    project.timeline.resolution = (0, 1080);
    assert!(project.validate().is_err());
  }

  #[test]
  fn test_timeline_duration_calculation() {
    let mut project = ProjectSchema::new("Test".to_string());

    // Добавляем трек с клипом
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());
    let clip = Clip::new(PathBuf::from("/test.mp4"), 5.0, 10.0);
    track.clips.push(clip);
    project.tracks.push(track);

    // Длительность должна быть 15.0 (start_time 5.0 + duration 10.0)
    assert_eq!(project.get_duration(), 15.0);
  }

  #[test]
  fn test_effect_parameter_types() {
    let mut params = HashMap::new();
    params.insert("intensity".to_string(), EffectParameter::Float(0.5));
    params.insert("enabled".to_string(), EffectParameter::Bool(true));
    params.insert(
      "name".to_string(),
      EffectParameter::String("test".to_string()),
    );
    params.insert("color".to_string(), EffectParameter::Color(0xFF0000FF));

    assert_eq!(params.len(), 4);
  }

  #[test]
  fn test_serialization() {
    let project = ProjectSchema::new("Serialization Test".to_string());

    // Сериализация в JSON
    let json = serde_json::to_string(&project).unwrap();
    assert!(json.contains("Serialization Test"));

    // Десериализация из JSON
    let deserialized: ProjectSchema = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.metadata.name, "Serialization Test");
  }
}

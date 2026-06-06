//! Effects - Эффекты, фильтры и переходы

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

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
  #[allow(dead_code)]
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
  // Аудио эффекты
  /// Плавное появление звука
  AudioFadeIn,
  /// Плавное затухание звука
  AudioFadeOut,
  /// Кроссфейд между аудио
  AudioCrossfade,
  /// Эквалайзер
  AudioEqualizer,
  /// Компрессор
  AudioCompressor,
  /// Реверберация
  AudioReverb,
  /// Задержка (эхо)
  AudioDelay,
  /// Хорус
  AudioChorus,
  /// Искажение
  AudioDistortion,
  /// Нормализация
  AudioNormalize,
  /// Шумоподавление
  AudioDenoise,
  /// Изменение высоты тона
  AudioPitch,
  /// Изменение темпа
  AudioTempo,
  /// Приглушение (дакинг)
  AudioDucking,
  /// Гейт
  AudioGate,
  /// Лимитер
  AudioLimiter,
  /// Экспандер
  AudioExpander,
  /// Панорамирование
  AudioPan,
  /// Ширина стерео
  AudioStereoWidth,
  /// Фильтр высоких частот
  AudioHighpass,
  /// Фильтр низких частот
  AudioLowpass,
  /// Полосовой фильтр
  AudioBandpass,
  // Добавляем отсутствующие типы для обратной совместимости
  /// Цветокоррекция
  ColorCorrection,
  /// Хромакей
  ChromaKey,
  /// Пользовательский эффект
  Custom,
  /// Общий аудио фейд
  AudioFade,
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

/// Фильтр для визуальных эффектов
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Filter {
  /// Уникальный идентификатор фильтра
  pub id: String,
  /// Тип фильтра
  pub filter_type: FilterType,
  /// Название фильтра
  pub name: String,
  /// Включен ли фильтр
  pub enabled: bool,
  /// Параметры фильтра (числовые значения)
  pub parameters: HashMap<String, f64>,
  /// FFmpeg команда для применения фильтра
  pub ffmpeg_command: Option<String>,
  /// Интенсивность фильтра (для обратной совместимости)
  pub intensity: f32,
  /// Пользовательский фильтр (для обратной совместимости)
  pub custom_filter: Option<String>,
}

impl Filter {
  /// Создать новый фильтр
  #[allow(dead_code)]
  pub fn new(filter_type: FilterType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      filter_type,
      name,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
      intensity: 1.0,
      custom_filter: None,
    }
  }
}

/// Тип фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterType {
  /// Яркость
  Brightness,
  /// Контрастность
  Contrast,
  /// Насыщенность
  Saturation,
  /// Оттенок
  Hue,
  /// Размытие
  Blur,
  /// Резкость
  Sharpen,
  /// Виньетка
  Vignette,
  /// Зерно
  Grain,
  /// Свечение
  Glow,
  /// Тени/Света
  ShadowsHighlights,
  /// Баланс белого
  WhiteBalance,
  /// Экспозиция
  Exposure,
  /// Кривые
  Curves,
  /// Уровни
  Levels,
  /// Цветовой баланс
  ColorBalance,
  /// Пользовательский
  Custom,
}

/// Переход между клипами
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transition {
  /// Уникальный идентификатор перехода
  pub id: String,
  /// Тип перехода
  pub transition_type: String,
  /// Название перехода
  pub name: String,
  /// Длительность перехода
  pub duration: TransitionDuration,
  /// Категория перехода
  pub category: Option<TransitionCategory>,
  /// Теги перехода
  pub tags: Vec<TransitionTag>,
  /// Сложность перехода
  pub complexity: Option<TransitionComplexity>,
  /// Включен ли переход
  pub enabled: bool,
  /// Параметры перехода
  pub parameters: HashMap<String, serde_json::Value>,
  /// FFmpeg команда для перехода
  pub ffmpeg_command: Option<String>,
  /// Кривая плавности перехода
  pub easing: Option<String>,
  /// Направление перехода
  pub direction: Option<String>,
}

/// Длительность перехода
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransitionDuration {
  /// Основная длительность в секундах
  pub value: f64,
  /// Минимальная длительность
  pub min: Option<f64>,
  /// Максимальная длительность
  pub max: Option<f64>,
}

impl std::fmt::Display for TransitionDuration {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.value)
  }
}

/// Категория перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionCategory {
  /// Базовые переходы
  Basic,
  /// Растворение
  Dissolve,
  /// Слайды
  Slide,
  /// Вытеснение
  Wipe,
  /// 3D переходы
  ThreeD,
  /// Морфинг
  Morph,
  /// Искажения
  Distortion,
  /// Геометрические
  Geometric,
  /// Световые
  Light,
  /// Частицы
  Particle,
  /// Специальные
  Special,
}

/// Сложность перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionComplexity {
  /// Простой
  Simple,
  /// Средний
  Medium,
  /// Сложный
  Complex,
}

/// Теги переходов
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionTag {
  /// Плавный
  Smooth,
  /// Резкий
  Sharp,
  /// Элегантный
  Elegant,
  /// Динамичный
  Dynamic,
  /// Минималистичный
  Minimal,
  /// Драматичный
  Dramatic,
  /// Современный
  Modern,
  /// Классический
  Classic,
  /// Креативный
  Creative,
  /// Быстрый
  Fast,
  /// Медленный
  Slow,
}

/// Видео фильтр
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoFilter {
  /// ID фильтра
  pub id: String,
  /// Тип фильтра
  pub filter_type: String,
  /// Название
  pub name: String,
  /// Категория
  pub category: FilterCategory,
  /// Теги
  pub tags: Vec<FilterTag>,
  /// Сложность
  pub complexity: FilterComplexity,
  /// Параметры
  pub parameters: HashMap<String, serde_json::Value>,
  /// FFmpeg команда
  pub ffmpeg_command: String,
  /// CSS фильтр
  pub css_filter: Option<String>,
}

/// Категория фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterCategory {
  /// Цветокоррекция
  ColorCorrection,
  /// Стилизация
  Stylization,
  /// Размытие и резкость
  BlurSharpness,
  /// Искажения
  Distortion,
  /// Световые эффекты
  LightEffects,
  /// Художественные
  Artistic,
  /// Утилиты
  Utility,
}

/// Сложность фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterComplexity {
  /// Простой
  Simple,
  /// Средний
  Medium,
  /// Сложный
  Complex,
}

/// Теги фильтров
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterTag {
  /// Цвет
  Color,
  /// Свет
  Light,
  /// Тень
  Shadow,
  /// Размытие
  Blur,
  /// Резкость
  Sharpen,
  /// Искажение
  Distort,
  /// Стиль
  Style,
  /// Винтаж
  Vintage,
  /// Современный
  Modern,
  /// Художественный
  Artistic,
  /// Технический
  Technical,
  /// Быстрый
  Fast,
  /// Качественный
  Quality,
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::PathBuf;

  #[test]
  fn test_effect_creation() {
    let effect = Effect::new(EffectType::Blur, "Test Blur".to_string());

    assert!(!effect.id.is_empty());
    assert_eq!(effect.effect_type, EffectType::Blur);
    assert_eq!(effect.name, "Test Blur");
    assert!(effect.enabled);
    assert!(effect.parameters.is_empty());
    assert!(effect.start_time.is_none());
    assert!(effect.end_time.is_none());
  }

  #[test]
  fn test_effect_with_parameters() {
    let mut effect = Effect::new(EffectType::Brightness, "Brightness Effect".to_string());

    // Добавляем параметры
    effect
      .parameters
      .insert("intensity".to_string(), EffectParameter::Float(0.5));
    effect
      .parameters
      .insert("auto_adjust".to_string(), EffectParameter::Bool(true));
    effect.parameters.insert(
      "mode".to_string(),
      EffectParameter::String("adaptive".to_string()),
    );

    assert_eq!(effect.parameters.len(), 3);

    // Проверяем параметры
    match effect.parameters.get("intensity") {
      Some(EffectParameter::Float(v)) => assert_eq!(*v, 0.5),
      _ => panic!("Wrong parameter type"),
    }
  }

  #[test]
  fn test_effect_with_metadata() {
    let mut effect = Effect::new(EffectType::Vintage, "Vintage Look".to_string());

    effect.category = Some(EffectCategory::Artistic);
    effect.complexity = Some(EffectComplexity::Intermediate);
    effect.tags = vec![EffectTag::Popular, EffectTag::Retro];

    // Локализованное описание
    let mut description = HashMap::new();
    description.insert("en".to_string(), "Vintage film effect".to_string());
    description.insert("ru".to_string(), "Эффект винтажной пленки".to_string());
    effect.description = Some(description);

    assert_eq!(effect.category, Some(EffectCategory::Artistic));
    assert_eq!(effect.tags.len(), 2);
    assert!(effect.description.is_some());
  }

  #[test]
  fn test_effect_type_variants() {
    // Видео эффекты
    assert_ne!(EffectType::Blur, EffectType::Sharpen);
    assert_eq!(EffectType::Grayscale, EffectType::Grayscale);

    // Аудио эффекты
    assert_ne!(EffectType::AudioFadeIn, EffectType::AudioFadeOut);
    assert_eq!(EffectType::AudioReverb, EffectType::AudioReverb);
  }

  #[test]
  fn test_effect_parameter_types() {
    let float_param = EffectParameter::Float(1.5);
    let _int_param = EffectParameter::Int(100);
    let _string_param = EffectParameter::String("test".to_string());
    let _bool_param = EffectParameter::Bool(true);
    let color_param = EffectParameter::Color(0xFF0000FF); // Red in RGBA
    let _array_param = EffectParameter::FloatArray(vec![0.0, 0.5, 1.0]);
    let _path_param = EffectParameter::FilePath(PathBuf::from("/path/to/file"));

    // Проверяем, что все варианты создаются корректно
    match float_param {
      EffectParameter::Float(v) => assert_eq!(v, 1.5),
      _ => panic!("Wrong type"),
    }

    match color_param {
      EffectParameter::Color(c) => assert_eq!(c, 0xFF0000FF),
      _ => panic!("Wrong type"),
    }
  }

  #[test]
  fn test_effect_serialization() {
    let mut effect = Effect::new(EffectType::ChromaticAberration, "Chromatic".to_string());
    effect
      .parameters
      .insert("strength".to_string(), EffectParameter::Float(0.8));
    effect.start_time = Some(5.0);
    effect.end_time = Some(10.0);
    effect.ffmpeg_command = Some("-vf chromaber=strength=0.8".to_string());

    // Сериализация
    let json = serde_json::to_string(&effect).unwrap();

    // Десериализация
    let deserialized: Effect = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.name, effect.name);
    assert_eq!(deserialized.effect_type, effect.effect_type);
    assert_eq!(deserialized.start_time, effect.start_time);
    assert_eq!(deserialized.parameters.len(), effect.parameters.len());
  }

  #[test]
  fn test_filter_creation() {
    let filter = Filter::new(FilterType::Brightness, "Brightness Filter".to_string());

    assert!(!filter.id.is_empty());
    assert_eq!(filter.filter_type, FilterType::Brightness);
    assert_eq!(filter.name, "Brightness Filter");
    assert!(filter.enabled);
    assert_eq!(filter.intensity, 1.0);
    assert!(filter.parameters.is_empty());
  }

  #[test]
  fn test_filter_with_parameters() {
    let mut filter = Filter::new(FilterType::Blur, "Gaussian Blur".to_string());

    filter.parameters.insert("radius".to_string(), 5.0);
    filter.parameters.insert("sigma".to_string(), 1.5);
    filter.intensity = 0.8;
    filter.ffmpeg_command = Some("-vf gblur=sigma=1.5:steps=5".to_string());

    assert_eq!(filter.parameters.len(), 2);
    assert_eq!(filter.intensity, 0.8);
    assert!(filter.ffmpeg_command.is_some());
  }

  #[test]
  fn test_filter_types() {
    assert_ne!(FilterType::Brightness, FilterType::Contrast);
    assert_eq!(FilterType::Custom, FilterType::Custom);

    // Проверяем все типы фильтров
    let types = [
      FilterType::Brightness,
      FilterType::Contrast,
      FilterType::Saturation,
      FilterType::Hue,
      FilterType::Blur,
      FilterType::Sharpen,
      FilterType::Vignette,
      FilterType::Grain,
      FilterType::Glow,
      FilterType::ShadowsHighlights,
      FilterType::WhiteBalance,
      FilterType::Exposure,
      FilterType::Curves,
      FilterType::Levels,
      FilterType::ColorBalance,
      FilterType::Custom,
    ];

    assert_eq!(types.len(), 16);
  }

  #[test]
  fn test_transition_creation() {
    let transition = Transition {
      id: uuid::Uuid::new_v4().to_string(),
      transition_type: "dissolve".to_string(),
      name: "Cross Dissolve".to_string(),
      duration: TransitionDuration {
        value: 1.0,
        min: Some(0.1),
        max: Some(5.0),
      },
      category: Some(TransitionCategory::Dissolve),
      tags: vec![TransitionTag::Smooth, TransitionTag::Elegant],
      complexity: Some(TransitionComplexity::Simple),
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: Some("-filter_complex xfade=transition=fade:duration=1".to_string()),
      easing: Some("ease-in-out".to_string()),
      direction: Some("left-to-right".to_string()),
    };

    assert!(!transition.id.is_empty());
    assert_eq!(transition.transition_type, "dissolve");
    assert_eq!(transition.duration.value, 1.0);
    assert_eq!(transition.duration.min, Some(0.1));
    assert_eq!(transition.duration.max, Some(5.0));
    assert_eq!(transition.tags.len(), 2);
  }

  #[test]
  fn test_transition_duration_display() {
    let duration = TransitionDuration {
      value: 2.5,
      min: Some(0.5),
      max: Some(10.0),
    };

    assert_eq!(format!("{duration}"), "2.5");
  }

  #[test]
  fn test_transition_with_parameters() {
    let mut transition = Transition {
      id: uuid::Uuid::new_v4().to_string(),
      transition_type: "wipe".to_string(),
      name: "Wipe Transition".to_string(),
      duration: TransitionDuration {
        value: 0.5,
        min: None,
        max: None,
      },
      category: Some(TransitionCategory::Wipe),
      tags: vec![TransitionTag::Fast, TransitionTag::Sharp],
      complexity: Some(TransitionComplexity::Medium),
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
      easing: None,
      direction: Some("top-to-bottom".to_string()),
    };

    // Добавляем параметры
    transition
      .parameters
      .insert("angle".to_string(), serde_json::json!(45));
    transition
      .parameters
      .insert("softness".to_string(), serde_json::json!(0.1));
    transition
      .parameters
      .insert("reverse".to_string(), serde_json::json!(false));

    assert_eq!(transition.parameters.len(), 3);
    assert_eq!(transition.parameters["angle"], serde_json::json!(45));
  }

  #[test]
  fn test_video_filter() {
    let filter = VideoFilter {
      id: uuid::Uuid::new_v4().to_string(),
      filter_type: "color_grading".to_string(),
      name: "Cinematic Color Grade".to_string(),
      category: FilterCategory::ColorCorrection,
      tags: vec![FilterTag::Color, FilterTag::Quality, FilterTag::Modern],
      complexity: FilterComplexity::Complex,
      parameters: HashMap::new(),
      ffmpeg_command: "-vf colorlevels=rimax=0.902:gimax=0.902:bimax=0.902".to_string(),
      css_filter: Some("contrast(1.1) saturate(1.2)".to_string()),
    };

    assert!(!filter.id.is_empty());
    assert_eq!(filter.category, FilterCategory::ColorCorrection);
    assert_eq!(filter.tags.len(), 3);
    assert_eq!(filter.complexity, FilterComplexity::Complex);
    assert!(filter.css_filter.is_some());
  }

  #[test]
  fn test_effect_categories() {
    let categories = [
      EffectCategory::ColorCorrection,
      EffectCategory::Artistic,
      EffectCategory::Vintage,
      EffectCategory::Cinematic,
      EffectCategory::Creative,
      EffectCategory::Technical,
      EffectCategory::Motion,
      EffectCategory::Distortion,
    ];

    assert_eq!(categories.len(), 8);
    assert_ne!(EffectCategory::Artistic, EffectCategory::Technical);
  }

  #[test]
  fn test_effect_tags() {
    let tags = [
      EffectTag::Popular,
      EffectTag::Professional,
      EffectTag::BeginnerFriendly,
      EffectTag::Experimental,
      EffectTag::Retro,
      EffectTag::Modern,
      EffectTag::Dramatic,
      EffectTag::Subtle,
      EffectTag::Intense,
    ];

    assert_eq!(tags.len(), 9);
  }

  #[test]
  fn test_transition_categories() {
    assert_ne!(TransitionCategory::Basic, TransitionCategory::ThreeD);
    assert_eq!(TransitionCategory::Dissolve, TransitionCategory::Dissolve);

    // Проверяем некоторые категории
    let _basic = TransitionCategory::Basic;
    let _particle = TransitionCategory::Particle;
    let _geometric = TransitionCategory::Geometric;
  }

  #[test]
  fn test_filter_categories() {
    assert_ne!(FilterCategory::ColorCorrection, FilterCategory::Distortion);
    assert_eq!(FilterCategory::Artistic, FilterCategory::Artistic);
  }

  #[test]
  fn test_effect_preset() {
    let mut name = HashMap::new();
    name.insert("en".to_string(), "Warm Sunset".to_string());
    name.insert("ru".to_string(), "Теплый закат".to_string());

    let mut description = HashMap::new();
    description.insert(
      "en".to_string(),
      "Warm color grading for sunset scenes".to_string(),
    );
    description.insert(
      "ru".to_string(),
      "Теплая цветокоррекция для сцен заката".to_string(),
    );

    let mut params = HashMap::new();
    params.insert("temperature".to_string(), EffectParameter::Float(0.8));
    params.insert("tint".to_string(), EffectParameter::Float(0.2));
    params.insert("saturation".to_string(), EffectParameter::Float(1.2));

    let preset = EffectPreset {
      name,
      params,
      description,
    };

    assert_eq!(preset.name.len(), 2);
    assert_eq!(preset.params.len(), 3);
    assert!(preset.description.contains_key("en"));
  }

  #[test]
  fn test_complex_effect_serialization() {
    let mut effect = Effect::new(EffectType::Cyberpunk, "Cyberpunk 2077".to_string());

    // Настраиваем сложный эффект
    effect.category = Some(EffectCategory::Artistic);
    effect.complexity = Some(EffectComplexity::Advanced);
    effect.tags = vec![
      EffectTag::Modern,
      EffectTag::Intense,
      EffectTag::Professional,
    ];

    // Параметры
    effect
      .parameters
      .insert("neon_intensity".to_string(), EffectParameter::Float(0.9));
    effect
      .parameters
      .insert("glitch_amount".to_string(), EffectParameter::Int(5));
    effect.parameters.insert(
      "color_palette".to_string(),
      EffectParameter::String("cyan-magenta".to_string()),
    );
    effect.parameters.insert(
      "chromatic_shift".to_string(),
      EffectParameter::FloatArray(vec![0.01, -0.01, 0.0]),
    );

    // Временные метки
    effect.start_time = Some(0.0);
    effect.end_time = Some(10.0);

    // FFmpeg команда
    effect.ffmpeg_command = Some("-vf curves=preset=vintage,chromashift=rx=5:bx=-5".to_string());

    // Сериализуем и десериализуем
    let json = serde_json::to_string_pretty(&effect).unwrap();
    let deserialized: Effect = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.effect_type, EffectType::Cyberpunk);
    assert_eq!(deserialized.parameters.len(), 4);
    assert_eq!(deserialized.tags.len(), 3);
  }

  #[test]
  fn test_audio_effects() {
    let audio_effects = [
      EffectType::AudioFadeIn,
      EffectType::AudioFadeOut,
      EffectType::AudioCrossfade,
      EffectType::AudioEqualizer,
      EffectType::AudioCompressor,
      EffectType::AudioReverb,
      EffectType::AudioDelay,
      EffectType::AudioChorus,
      EffectType::AudioDistortion,
      EffectType::AudioNormalize,
      EffectType::AudioDenoise,
      EffectType::AudioPitch,
      EffectType::AudioTempo,
      EffectType::AudioDucking,
      EffectType::AudioGate,
      EffectType::AudioLimiter,
      EffectType::AudioExpander,
      EffectType::AudioPan,
      EffectType::AudioStereoWidth,
      EffectType::AudioHighpass,
      EffectType::AudioLowpass,
      EffectType::AudioBandpass,
    ];

    assert_eq!(audio_effects.len(), 22);

    // Создаем аудио эффект
    let mut reverb = Effect::new(EffectType::AudioReverb, "Cathedral Reverb".to_string());
    reverb
      .parameters
      .insert("room_size".to_string(), EffectParameter::Float(0.8));
    reverb
      .parameters
      .insert("damping".to_string(), EffectParameter::Float(0.5));
    reverb
      .parameters
      .insert("wet_level".to_string(), EffectParameter::Float(0.3));

    assert_eq!(reverb.parameters.len(), 3);
  }
}

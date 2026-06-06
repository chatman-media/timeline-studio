//! Templates - Шаблоны и стилевые шаблоны

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::common::{AlignX, AlignY, FitMode, Position2D, Size2D};

/// Шаблон многокамерной раскладки
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Template {
  /// Уникальный идентификатор шаблона
  pub id: String,
  /// Тип шаблона
  pub template_type: TemplateType,
  /// Название шаблона
  pub name: String,
  /// Количество видео в шаблоне
  pub screens: usize,
  /// Ячейки шаблона с позициями
  pub cells: Vec<TemplateCell>,
  /// Регионы шаблона (для обратной совместимости)
  pub regions: Vec<TemplateRegion>,
}

impl Template {
  /// Создать новый шаблон
  #[allow(dead_code)]
  pub fn new(template_type: TemplateType, name: String, screens: usize) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      template_type,
      name,
      screens,
      cells: Vec::new(),
      regions: Vec::new(),
    }
  }
}

/// Тип шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TemplateType {
  /// Вертикальное разделение
  Vertical,
  /// Горизонтальное разделение
  Horizontal,
  /// Диагональное разделение
  Diagonal,
  /// Сетка
  Grid,
  /// Пользовательский
  Custom,
}

/// Ячейка шаблона
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemplateCell {
  /// Индекс ячейки (0-based)
  pub index: usize,
  /// Позиция X в процентах (0-100)
  pub x: f32,
  /// Позиция Y в процентах (0-100)
  pub y: f32,
  /// Ширина в процентах (0-100)
  pub width: f32,
  /// Высота в процентах (0-100)
  pub height: f32,
  /// Режим масштабирования видео
  pub fit_mode: FitMode,
  /// Горизонтальное выравнивание
  pub align_x: AlignX,
  /// Вертикальное выравнивание
  pub align_y: AlignY,
  /// Дополнительное масштабирование (1.0 = 100%)
  pub scale: Option<f32>,
}

/// Регион шаблона (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemplateRegion {
  pub x: u32,
  pub y: u32,
  pub width: u32,
  pub height: u32,
  pub padding: u32,
}

/// Стильный шаблон (интро, аутро, титры)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleTemplate {
  /// Уникальный идентификатор шаблона
  pub id: String,
  /// Название шаблона
  pub name: String,
  /// Категория шаблона
  pub category: StyleTemplateCategory,
  /// Стиль шаблона
  pub style: StyleTemplateStyle,
  /// Длительность в секундах
  pub duration: f64,
  /// Элементы шаблона
  pub elements: Vec<StyleTemplateElement>,
  /// Цвет фона (для обратной совместимости)
  pub background_color: String,
  /// Переходы (для обратной совместимости)
  pub transitions: Vec<serde_json::Value>,
}

impl StyleTemplate {
  /// Создать новый стильный шаблон
  pub fn new(
    name: String,
    category: StyleTemplateCategory,
    style: StyleTemplateStyle,
    duration: f64,
  ) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      name,
      category,
      style,
      duration,
      elements: Vec::new(),
      background_color: "#000000".to_string(),
      transitions: Vec::new(),
    }
  }
}

/// Категория стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleTemplateCategory {
  /// Интро
  Intro,
  /// Аутро
  Outro,
  /// Нижняя треть
  LowerThird,
  /// Титры
  Title,
  /// Переход
  Transition,
  /// Наложение
  Overlay,
}

/// Стиль шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleTemplateStyle {
  /// Современный
  Modern,
  /// Винтажный
  Vintage,
  /// Минимальный
  Minimal,
  /// Корпоративный
  Corporate,
  /// Креативный
  Creative,
  /// Кинематографический
  Cinematic,
}

/// Элемент стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleTemplateElement {
  /// Уникальный идентификатор элемента
  pub id: String,
  /// Тип элемента
  pub element_type: StyleElementType,
  /// Название элемента
  pub name: String,
  /// Позиция элемента
  pub position: Position2D,
  /// Размер элемента
  pub size: Size2D,
  /// Временные параметры
  pub timing: ElementTiming,
  /// Свойства элемента
  pub properties: StyleElementProperties,
  /// Анимации элемента
  pub animations: Vec<ElementAnimation>,
  /// Контент элемента (для обратной совместимости)
  pub content: String,
  /// Стиль элемента (для обратной совместимости)
  pub style: Option<ElementStyle>,
}

/// Элемент стиля (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleElement {
  pub id: String,
  pub element_type: StyleElementType,
  pub position: Position2D,
  pub size: Size2D,
  pub content: String,
  pub style: Option<ElementStyle>,
  pub animations: Vec<ElementAnimation>,
}

/// Стиль элемента (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementStyle {
  pub font_family: Option<String>,
  pub font_size: Option<u32>,
  pub color: Option<String>,
  pub background_color: Option<String>,
}

/// Тип элемента стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleElementType {
  /// Текст
  Text,
  /// Изображение
  Image,
  /// Видео
  Video,
  /// Форма (прямоугольник, круг и т.д.)
  Shape,
  /// Линия
  Line,
  /// Иконка
  Icon,
  /// Частицы
  Particles,
}

/// Временные параметры элемента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementTiming {
  /// Время появления в секундах
  pub in_time: f64,
  /// Время исчезновения в секундах
  pub out_time: f64,
  /// Длительность в секундах
  pub duration: f64,
}

/// Свойства элемента стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct StyleElementProperties {
  /// Текстовое содержимое (для текстовых элементов)
  pub text: Option<String>,
  /// Семейство шрифта
  pub font_family: Option<String>,
  /// Размер шрифта
  pub font_size: Option<f32>,
  /// Толщина шрифта
  pub font_weight: Option<FontWeight>,
  /// Стиль шрифта
  pub font_style: Option<FontStyle>,
  /// Цвет текста
  pub text_color: Option<String>,
  /// Выравнивание текста
  pub text_align: Option<TextAlign>,
  /// Цвет заливки
  pub fill_color: Option<String>,
  /// Цвет обводки
  pub stroke_color: Option<String>,
  /// Толщина обводки
  pub stroke_width: Option<f32>,
  /// Прозрачность
  pub opacity: Option<f32>,
  /// Поворот в градусах
  pub rotation: Option<f32>,
  /// Масштаб
  pub scale: Option<f32>,
  /// Тень
  pub shadow: Option<ShadowProperties>,
  /// Размытие
  pub blur: Option<f32>,
  /// Путь к изображению (для изображений)
  pub image_path: Option<String>,
  /// Режим масштабирования изображения
  pub object_fit: Option<ObjectFit>,
  /// Тип формы (для форм)
  pub shape_type: Option<ShapeType>,
  /// Радиус скругления углов
  pub border_radius: Option<f32>,
  /// Дополнительные свойства
  pub custom: HashMap<String, serde_json::Value>,
}

/// Выравнивание текста
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TextAlign {
  /// По левому краю
  Left,
  /// По центру
  Center,
  /// По правому краю
  Right,
  /// По ширине
  Justify,
}

/// Толщина шрифта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FontWeight {
  /// Тонкий (100)
  Thin,
  /// Очень легкий (200)
  ExtraLight,
  /// Легкий (300)
  Light,
  /// Обычный (400)
  Normal,
  /// Средний (500)
  Medium,
  /// Полужирный (600)
  SemiBold,
  /// Жирный (700)
  Bold,
  /// Очень жирный (800)
  ExtraBold,
  /// Черный (900)
  Black,
}

/// Стиль шрифта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FontStyle {
  /// Обычный
  Normal,
  /// Курсив
  Italic,
  /// Наклонный
  Oblique,
}

/// Режим масштабирования изображения
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ObjectFit {
  /// Заполнить контейнер с обрезкой
  Cover,
  /// Вписать полностью
  Contain,
  /// Заполнить контейнер с искажением
  Fill,
  /// Оригинальный размер
  None,
  /// Уменьшить если больше контейнера
  ScaleDown,
}

/// Тип формы
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ShapeType {
  /// Прямоугольник
  Rectangle,
  /// Круг
  Circle,
  /// Эллипс
  Ellipse,
  /// Треугольник
  Triangle,
  /// Звезда
  Star,
  /// Многоугольник
  Polygon,
  /// Линия
  Line,
  /// Стрелка
  Arrow,
}

/// Свойства тени
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ShadowProperties {
  /// Смещение по X
  pub offset_x: f32,
  /// Смещение по Y
  pub offset_y: f32,
  /// Размытие
  pub blur: f32,
  /// Распространение
  pub spread: f32,
  /// Цвет
  pub color: String,
}

/// Анимация элемента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementAnimation {
  /// Уникальный идентификатор анимации
  pub id: String,
  /// Тип анимации
  pub animation_type: AnimationType,
  /// Длительность в секундах
  pub duration: f64,
  /// Задержка в секундах
  pub delay: f64,
  /// Функция сглаживания
  pub easing: AnimationEasing,
  /// Количество повторений (0 = бесконечно)
  pub repeat: u32,
  /// Направление анимации
  pub direction: AnimationDirection,
  /// Дополнительные свойства анимации
  pub properties: HashMap<String, serde_json::Value>,
}

/// Тип анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationType {
  /// Появление
  FadeIn,
  /// Исчезновение
  FadeOut,
  /// Слайд
  Slide,
  /// Масштабирование
  Scale,
  /// Поворот
  Rotate,
  /// Подпрыгивание
  Bounce,
  /// Покачивание
  Shake,
  /// Пульсация
  Pulse,
  /// Мерцание
  Flicker,
  /// Печатная машинка
  Typewriter,
  /// Путь движения
  MotionPath,
  /// Морфинг
  Morph,
  /// Параллакс
  Parallax,
  /// Растворение
  Dissolve,
}

/// Функция сглаживания анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationEasing {
  /// Линейная
  Linear,
  /// Плавная
  Ease,
  /// Плавный вход
  EaseIn,
  /// Плавный выход
  EaseOut,
  /// Плавный вход и выход
  EaseInOut,
  /// Квадратичная
  Quad,
  /// Кубическая
  Cubic,
  /// Квартичная
  Quart,
  /// Квинтичная
  Quint,
  /// Синусоидальная
  Sine,
  /// Экспоненциальная
  Expo,
  /// Круговая
  Circ,
  /// Эластичная
  Elastic,
  /// Возвратная
  Back,
  /// Прыжок
  Bounce,
}

/// Направление анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationDirection {
  /// Обычное
  Normal,
  /// Обратное
  Reverse,
  /// Чередование
  Alternate,
  /// Чередование с обратным началом
  AlternateReverse,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_template_creation() {
    let template = Template::new(TemplateType::Grid, "2x2 Grid".to_string(), 4);

    assert!(!template.id.is_empty());
    assert_eq!(template.template_type, TemplateType::Grid);
    assert_eq!(template.name, "2x2 Grid");
    assert_eq!(template.screens, 4);
    assert!(template.cells.is_empty());
    assert!(template.regions.is_empty());
  }

  #[test]
  fn test_template_with_cells() {
    let mut template = Template::new(TemplateType::Vertical, "Split Screen".to_string(), 2);

    // Добавляем ячейки
    template.cells.push(TemplateCell {
      index: 0,
      x: 0.0,
      y: 0.0,
      width: 50.0,
      height: 100.0,
      fit_mode: FitMode::Fill,
      align_x: AlignX::Center,
      align_y: AlignY::Center,
      scale: None,
    });

    template.cells.push(TemplateCell {
      index: 1,
      x: 50.0,
      y: 0.0,
      width: 50.0,
      height: 100.0,
      fit_mode: FitMode::Fill,
      align_x: AlignX::Center,
      align_y: AlignY::Center,
      scale: Some(1.1),
    });

    assert_eq!(template.cells.len(), 2);
    assert_eq!(template.cells[0].x, 0.0);
    assert_eq!(template.cells[1].x, 50.0);
    assert_eq!(template.cells[1].scale, Some(1.1));
  }

  #[test]
  fn test_template_types() {
    let vertical = TemplateType::Vertical;
    let horizontal = TemplateType::Horizontal;
    let diagonal = TemplateType::Diagonal;
    let grid = TemplateType::Grid;
    let custom = TemplateType::Custom;

    assert_ne!(vertical, horizontal);
    assert_eq!(grid, TemplateType::Grid);
    assert_ne!(custom, diagonal);
  }

  #[test]
  fn test_template_cell_properties() {
    let cell = TemplateCell {
      index: 2,
      x: 25.0,
      y: 25.0,
      width: 50.0,
      height: 50.0,
      fit_mode: FitMode::Fit,
      align_x: AlignX::Left,
      align_y: AlignY::Top,
      scale: Some(0.9),
    };

    assert_eq!(cell.index, 2);
    assert_eq!(cell.x + cell.width, 75.0);
    assert_eq!(cell.y + cell.height, 75.0);
    assert_eq!(cell.scale, Some(0.9));
  }

  #[test]
  fn test_template_serialization() {
    let mut template = Template::new(TemplateType::Grid, "3x3 Grid".to_string(), 9);

    // Добавляем несколько ячеек
    for i in 0..9 {
      let row = i / 3;
      let col = i % 3;
      template.cells.push(TemplateCell {
        index: i,
        x: (col as f32) * 33.33,
        y: (row as f32) * 33.33,
        width: 33.33,
        height: 33.33,
        fit_mode: FitMode::Fill,
        align_x: AlignX::Center,
        align_y: AlignY::Center,
        scale: None,
      });
    }

    // Сериализация
    let json = serde_json::to_string(&template).unwrap();

    // Десериализация
    let deserialized: Template = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.name, template.name);
    assert_eq!(deserialized.screens, 9);
    assert_eq!(deserialized.cells.len(), 9);
  }

  #[test]
  fn test_style_template_creation() {
    let style_template = StyleTemplate::new(
      "Epic Intro".to_string(),
      StyleTemplateCategory::Intro,
      StyleTemplateStyle::Cinematic,
      5.0,
    );

    assert!(!style_template.id.is_empty());
    assert_eq!(style_template.name, "Epic Intro");
    assert_eq!(style_template.category, StyleTemplateCategory::Intro);
    assert_eq!(style_template.style, StyleTemplateStyle::Cinematic);
    assert_eq!(style_template.duration, 5.0);
    assert!(style_template.elements.is_empty());
    assert_eq!(style_template.background_color, "#000000");
  }

  #[test]
  fn test_style_template_categories() {
    let categories = [
      StyleTemplateCategory::Intro,
      StyleTemplateCategory::Outro,
      StyleTemplateCategory::LowerThird,
      StyleTemplateCategory::Title,
      StyleTemplateCategory::Transition,
      StyleTemplateCategory::Overlay,
    ];

    assert_eq!(categories.len(), 6);
    assert_ne!(StyleTemplateCategory::Intro, StyleTemplateCategory::Outro);
  }

  #[test]
  fn test_style_template_styles() {
    let styles = [
      StyleTemplateStyle::Modern,
      StyleTemplateStyle::Vintage,
      StyleTemplateStyle::Minimal,
      StyleTemplateStyle::Corporate,
      StyleTemplateStyle::Creative,
      StyleTemplateStyle::Cinematic,
    ];

    assert_eq!(styles.len(), 6);
    assert_ne!(StyleTemplateStyle::Modern, StyleTemplateStyle::Vintage);
  }

  #[test]
  fn test_style_template_element() {
    let element = StyleTemplateElement {
      id: uuid::Uuid::new_v4().to_string(),
      element_type: StyleElementType::Text,
      name: "Main Title".to_string(),
      position: Position2D { x: 50.0, y: 50.0 },
      size: Size2D {
        width: 80.0,
        height: 20.0,
      },
      timing: ElementTiming {
        in_time: 0.5,
        out_time: 4.5,
        duration: 4.0,
      },
      properties: StyleElementProperties {
        text: Some("Welcome".to_string()),
        font_family: Some("Arial".to_string()),
        font_size: Some(48.0),
        font_weight: Some(FontWeight::Bold),
        font_style: Some(FontStyle::Normal),
        text_color: Some("#FFFFFF".to_string()),
        text_align: Some(TextAlign::Center),
        fill_color: None,
        stroke_color: None,
        stroke_width: None,
        opacity: Some(1.0),
        rotation: None,
        scale: None,
        shadow: None,
        blur: None,
        image_path: None,
        object_fit: None,
        shape_type: None,
        border_radius: None,
        custom: HashMap::new(),
      },
      animations: vec![],
      content: "Welcome".to_string(),
      style: None,
    };

    assert!(!element.id.is_empty());
    assert_eq!(element.element_type, StyleElementType::Text);
    assert_eq!(element.timing.duration, 4.0);
    assert_eq!(element.properties.text, Some("Welcome".to_string()));
    assert_eq!(element.properties.font_size, Some(48.0));
  }

  #[test]
  fn test_element_timing() {
    let timing = ElementTiming {
      in_time: 1.0,
      out_time: 5.0,
      duration: 4.0,
    };

    assert_eq!(timing.out_time - timing.in_time, timing.duration);
  }

  #[test]
  fn test_element_types() {
    let types = [
      StyleElementType::Text,
      StyleElementType::Image,
      StyleElementType::Video,
      StyleElementType::Shape,
      StyleElementType::Line,
      StyleElementType::Icon,
      StyleElementType::Particles,
    ];

    assert_eq!(types.len(), 7);
    assert_ne!(StyleElementType::Text, StyleElementType::Image);
  }

  #[test]
  fn test_font_weights() {
    assert_ne!(FontWeight::Thin, FontWeight::Black);
    assert_eq!(FontWeight::Normal, FontWeight::Normal);

    let weights = [
      FontWeight::Thin,
      FontWeight::ExtraLight,
      FontWeight::Light,
      FontWeight::Normal,
      FontWeight::Medium,
      FontWeight::SemiBold,
      FontWeight::Bold,
      FontWeight::ExtraBold,
      FontWeight::Black,
    ];

    assert_eq!(weights.len(), 9);
  }

  #[test]
  fn test_text_alignment() {
    let alignments = [
      TextAlign::Left,
      TextAlign::Center,
      TextAlign::Right,
      TextAlign::Justify,
    ];

    assert_eq!(alignments.len(), 4);
    assert_ne!(TextAlign::Left, TextAlign::Right);
  }

  #[test]
  fn test_shape_types() {
    let shapes = [
      ShapeType::Rectangle,
      ShapeType::Circle,
      ShapeType::Ellipse,
      ShapeType::Triangle,
      ShapeType::Star,
      ShapeType::Polygon,
      ShapeType::Line,
      ShapeType::Arrow,
    ];

    assert_eq!(shapes.len(), 8);
    assert_ne!(ShapeType::Rectangle, ShapeType::Circle);
  }

  #[test]
  fn test_shadow_properties() {
    let shadow = ShadowProperties {
      offset_x: 5.0,
      offset_y: 5.0,
      blur: 10.0,
      spread: 2.0,
      color: "#000000".to_string(),
    };

    assert_eq!(shadow.offset_x, 5.0);
    assert_eq!(shadow.blur, 10.0);
    assert_eq!(shadow.color, "#000000");
  }

  #[test]
  fn test_element_animation() {
    let animation = ElementAnimation {
      id: uuid::Uuid::new_v4().to_string(),
      animation_type: AnimationType::FadeIn,
      duration: 1.0,
      delay: 0.5,
      easing: AnimationEasing::EaseInOut,
      repeat: 0,
      direction: AnimationDirection::Normal,
      properties: HashMap::new(),
    };

    assert!(!animation.id.is_empty());
    assert_eq!(animation.animation_type, AnimationType::FadeIn);
    assert_eq!(animation.duration, 1.0);
    assert_eq!(animation.delay, 0.5);
    assert_eq!(animation.repeat, 0); // бесконечно
  }

  #[test]
  fn test_animation_types() {
    let types = [
      AnimationType::FadeIn,
      AnimationType::FadeOut,
      AnimationType::Slide,
      AnimationType::Scale,
      AnimationType::Rotate,
      AnimationType::Bounce,
      AnimationType::Shake,
      AnimationType::Pulse,
      AnimationType::Flicker,
      AnimationType::Typewriter,
      AnimationType::MotionPath,
      AnimationType::Morph,
      AnimationType::Parallax,
      AnimationType::Dissolve,
    ];

    assert_eq!(types.len(), 14);
    assert_ne!(AnimationType::FadeIn, AnimationType::FadeOut);
  }

  #[test]
  fn test_animation_easing() {
    let easings = [
      AnimationEasing::Linear,
      AnimationEasing::Ease,
      AnimationEasing::EaseIn,
      AnimationEasing::EaseOut,
      AnimationEasing::EaseInOut,
      AnimationEasing::Quad,
      AnimationEasing::Cubic,
      AnimationEasing::Quart,
      AnimationEasing::Quint,
      AnimationEasing::Sine,
      AnimationEasing::Expo,
      AnimationEasing::Circ,
      AnimationEasing::Elastic,
      AnimationEasing::Back,
      AnimationEasing::Bounce,
    ];

    assert_eq!(easings.len(), 15);
    assert_ne!(AnimationEasing::Linear, AnimationEasing::Bounce);
  }

  #[test]
  fn test_animation_direction() {
    let directions = [
      AnimationDirection::Normal,
      AnimationDirection::Reverse,
      AnimationDirection::Alternate,
      AnimationDirection::AlternateReverse,
    ];

    assert_eq!(directions.len(), 4);
    assert_ne!(AnimationDirection::Normal, AnimationDirection::Reverse);
  }

  #[test]
  fn test_complex_style_template() {
    let mut template = StyleTemplate::new(
      "Professional Intro".to_string(),
      StyleTemplateCategory::Intro,
      StyleTemplateStyle::Corporate,
      8.0,
    );

    // Добавляем фоновый элемент
    let background = StyleTemplateElement {
      id: uuid::Uuid::new_v4().to_string(),
      element_type: StyleElementType::Shape,
      name: "Background".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 100.0,
        height: 100.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 8.0,
        duration: 8.0,
      },
      properties: StyleElementProperties {
        shape_type: Some(ShapeType::Rectangle),
        fill_color: Some("#1a1a1a".to_string()),
        opacity: Some(1.0),
        ..Default::default()
      },
      animations: vec![],
      content: String::new(),
      style: None,
    };

    // Добавляем текстовый элемент с анимацией
    let mut title = StyleTemplateElement {
      id: uuid::Uuid::new_v4().to_string(),
      element_type: StyleElementType::Text,
      name: "Company Name".to_string(),
      position: Position2D { x: 50.0, y: 40.0 },
      size: Size2D {
        width: 60.0,
        height: 20.0,
      },
      timing: ElementTiming {
        in_time: 1.0,
        out_time: 7.0,
        duration: 6.0,
      },
      properties: StyleElementProperties {
        text: Some("ACME Corp".to_string()),
        font_family: Some("Helvetica".to_string()),
        font_size: Some(72.0),
        font_weight: Some(FontWeight::Bold),
        text_color: Some("#ffffff".to_string()),
        text_align: Some(TextAlign::Center),
        opacity: Some(0.0), // Начинаем с невидимого
        ..Default::default()
      },
      animations: vec![],
      content: "ACME Corp".to_string(),
      style: None,
    };

    // Добавляем анимации
    title.animations.push(ElementAnimation {
      id: uuid::Uuid::new_v4().to_string(),
      animation_type: AnimationType::FadeIn,
      duration: 1.5,
      delay: 0.0,
      easing: AnimationEasing::EaseOut,
      repeat: 1,
      direction: AnimationDirection::Normal,
      properties: HashMap::new(),
    });

    title.animations.push(ElementAnimation {
      id: uuid::Uuid::new_v4().to_string(),
      animation_type: AnimationType::Scale,
      duration: 1.5,
      delay: 0.0,
      easing: AnimationEasing::Back,
      repeat: 1,
      direction: AnimationDirection::Normal,
      properties: {
        let mut props = HashMap::new();
        props.insert("from".to_string(), serde_json::json!(0.8));
        props.insert("to".to_string(), serde_json::json!(1.0));
        props
      },
    });

    template.elements.push(background);
    template.elements.push(title);

    assert_eq!(template.elements.len(), 2);
    assert_eq!(template.elements[1].animations.len(), 2);

    // Проверяем сериализацию
    let json = serde_json::to_string_pretty(&template).unwrap();
    let deserialized: StyleTemplate = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.elements.len(), 2);
    assert_eq!(deserialized.duration, 8.0);
  }

  #[test]
  fn test_object_fit_modes() {
    let modes = [
      ObjectFit::Cover,
      ObjectFit::Contain,
      ObjectFit::Fill,
      ObjectFit::None,
      ObjectFit::ScaleDown,
    ];

    assert_eq!(modes.len(), 5);
    assert_ne!(ObjectFit::Cover, ObjectFit::Contain);
  }

  #[test]
  fn test_style_element_properties_default() {
    let props: StyleElementProperties = Default::default();

    assert!(props.text.is_none());
    assert!(props.font_family.is_none());
    assert!(props.font_size.is_none());
    assert!(props.custom.is_empty());
  }

  #[test]
  fn test_backward_compatibility_structs() {
    // Тестируем структуры для обратной совместимости

    // TemplateRegion
    let region = TemplateRegion {
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      padding: 10,
    };

    assert_eq!(region.x, 100);
    assert_eq!(region.padding, 10);

    // StyleElement
    let style_element = StyleElement {
      id: uuid::Uuid::new_v4().to_string(),
      element_type: StyleElementType::Text,
      position: Position2D { x: 50.0, y: 50.0 },
      size: Size2D {
        width: 100.0,
        height: 50.0,
      },
      content: "Legacy Text".to_string(),
      style: Some(ElementStyle {
        font_family: Some("Arial".to_string()),
        font_size: Some(24),
        color: Some("#000000".to_string()),
        background_color: Some("#ffffff".to_string()),
      }),
      animations: vec![],
    };

    assert!(!style_element.id.is_empty());
    assert_eq!(style_element.content, "Legacy Text");
    assert!(style_element.style.is_some());
  }
}

//! Subtitles - Субтитры и их настройки

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Субтитр
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Subtitle {
  /// Уникальный идентификатор субтитра
  pub id: String,
  /// Текст субтитра
  pub text: String,
  /// Время начала в секундах
  pub start_time: f64,
  /// Время окончания в секундах
  pub end_time: f64,
  /// Позиция субтитра на экране
  pub position: SubtitlePosition,
  /// Стиль субтитра
  pub style: SubtitleStyle,
  /// Включен ли субтитр
  pub enabled: bool,
  /// Анимации субтитра
  pub animations: Vec<SubtitleAnimation>,

  // Поля для обратной совместимости
  /// Семейство шрифта
  pub font_family: String,
  /// Размер шрифта
  pub font_size: f32,
  /// Цвет текста
  pub color: String,
  /// Прозрачность
  pub opacity: f32,
  /// Жирность шрифта
  pub font_weight: SubtitleFontWeight,
  /// Тень
  pub shadow: bool,
  /// Обводка
  pub outline: bool,
  /// Длительность (вычисляется)
  pub duration: f64,
}

impl Subtitle {
  /// Создать новый субтитр
  pub fn new(text: String, start_time: f64, end_time: f64) -> Self {
    let duration = end_time - start_time;
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      text,
      start_time,
      end_time,
      position: SubtitlePosition::default(),
      style: SubtitleStyle::default(),
      enabled: true,
      animations: Vec::new(),
      // Поля для обратной совместимости
      font_family: "Arial".to_string(),
      font_size: 24.0,
      color: "#FFFFFF".to_string(),
      opacity: 1.0,
      font_weight: SubtitleFontWeight::Normal,
      shadow: true,
      outline: true,
      duration,
    }
  }

  /// Проверить валидность субтитра
  pub fn validate(&self) -> Result<(), String> {
    if self.text.is_empty() {
      return Err("Текст субтитра не может быть пустым".to_string());
    }

    if self.start_time < 0.0 {
      return Err("Время начала не может быть отрицательным".to_string());
    }

    if self.end_time <= self.start_time {
      return Err("Время окончания должно быть больше времени начала".to_string());
    }

    Ok(())
  }

  /// Получить длительность субтитра
  pub fn get_duration(&self) -> f64 {
    self.end_time - self.start_time
  }
}

/// Позиция субтитра на экране
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum SubtitlePosition {
  /// Абсолютная позиция
  Absolute { x: f32, y: f32 },
  /// Относительная позиция с выравниванием
  Relative {
    align_x: SubtitleAlignX,
    align_y: SubtitleAlignY,
  },
}

impl Default for SubtitlePosition {
  fn default() -> Self {
    Self::Relative {
      align_x: SubtitleAlignX::Center,
      align_y: SubtitleAlignY::Bottom,
    }
  }
}

/// Горизонтальное выравнивание субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleAlignX {
  /// По левому краю
  Left,
  /// По центру
  Center,
  /// По правому краю
  Right,
}

/// Вертикальное выравнивание субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleAlignY {
  /// По верхнему краю
  Top,
  /// По центру
  Center,
  /// По центру (альтернативное название)
  Middle,
  /// По нижнему краю
  Bottom,
}

/// Отступы субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitleMargin {
  /// Отступ сверху в пикселях
  pub top: f32,
  /// Отступ справа в пикселях
  pub right: f32,
  /// Отступ снизу в пикселях
  pub bottom: f32,
  /// Отступ слева в пикселях
  pub left: f32,
}

impl Default for SubtitleMargin {
  fn default() -> Self {
    Self {
      top: 20.0,
      right: 20.0,
      bottom: 20.0,
      left: 20.0,
    }
  }
}

/// Стиль субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitleStyle {
  /// Название шрифта
  pub font_family: String,
  /// Размер шрифта в пикселях
  pub font_size: f32,
  /// Толщина шрифта
  pub font_weight: SubtitleFontWeight,
  /// Цвет текста (в формате #RRGGBB или #RRGGBBAA)
  pub color: String,
  /// Цвет обводки (опционально)
  pub stroke_color: Option<String>,
  /// Толщина обводки в пикселях
  pub stroke_width: f32,
  /// Цвет тени (опционально)
  pub shadow_color: Option<String>,
  /// Смещение тени по X
  pub shadow_x: f32,
  /// Смещение тени по Y
  pub shadow_y: f32,
  /// Размытие тени
  pub shadow_blur: f32,
  /// Цвет фона (опционально)
  pub background_color: Option<String>,
  /// Прозрачность фона (0-1)
  pub background_opacity: f32,
  /// Отступы текста внутри фона
  pub padding: SubtitlePadding,
  /// Радиус скругления фона
  pub border_radius: f32,
  /// Межстрочный интервал
  pub line_height: f32,
  /// Межбуквенный интервал
  pub letter_spacing: f32,
  /// Максимальная ширина в процентах
  pub max_width: f32,
}

impl Default for SubtitleStyle {
  fn default() -> Self {
    Self {
      font_family: "Arial".to_string(),
      font_size: 24.0,
      font_weight: SubtitleFontWeight::Normal,
      color: "#FFFFFF".to_string(),
      stroke_color: Some("#000000".to_string()),
      stroke_width: 2.0,
      shadow_color: Some("#000000".to_string()),
      shadow_x: 2.0,
      shadow_y: 2.0,
      shadow_blur: 4.0,
      background_color: None,
      background_opacity: 0.8,
      padding: SubtitlePadding::default(),
      border_radius: 4.0,
      line_height: 1.2,
      letter_spacing: 0.0,
      max_width: 80.0,
    }
  }
}

/// Толщина шрифта субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleFontWeight {
  /// Тонкий
  Thin,
  /// Светлый
  Light,
  /// Обычный
  Normal,
  /// Средний
  Medium,
  /// Жирный
  Bold,
  /// Очень жирный
  Black,
}

/// Отступы текста внутри фона субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitlePadding {
  /// Отступ сверху
  pub top: f32,
  /// Отступ справа
  pub right: f32,
  /// Отступ снизу
  pub bottom: f32,
  /// Отступ слева
  pub left: f32,
}

impl Default for SubtitlePadding {
  fn default() -> Self {
    Self {
      top: 8.0,
      right: 12.0,
      bottom: 8.0,
      left: 12.0,
    }
  }
}

/// Анимация субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitleAnimation {
  /// Уникальный идентификатор анимации
  pub id: String,
  /// Тип анимации
  pub animation_type: SubtitleAnimationType,
  /// Длительность анимации в секундах
  pub duration: f64,
  /// Задержка перед началом анимации
  pub delay: f64,
  /// Функция сглаживания
  pub easing: SubtitleEasing,
  /// Направление анимации (для движения)
  pub direction: Option<SubtitleDirection>,
  /// Дополнительные параметры
  pub properties: HashMap<String, serde_json::Value>,
  /// Время начала анимации (для обратной совместимости)
  pub start_time: f64,
}

impl SubtitleAnimation {
  /// Создать новую анимацию субтитра
  pub fn new(animation_type: SubtitleAnimationType, duration: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      animation_type,
      duration,
      delay: 0.0,
      easing: SubtitleEasing::EaseInOut,
      direction: None,
      properties: HashMap::new(),
      start_time: 0.0,
    }
  }
}

/// Тип анимации субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleAnimationType {
  /// Появление с изменением прозрачности
  FadeIn,
  /// Исчезновение с изменением прозрачности
  FadeOut,
  /// Въезд с указанного направления
  SlideIn,
  /// Выезд в указанном направлении
  SlideOut,
  /// Увеличение от 0 до полного размера
  ScaleIn,
  /// Уменьшение до 0
  ScaleOut,
  /// Печатающаяся машинка (по буквам)
  Typewriter,
  /// Волна (буквы появляются по очереди)
  Wave,
  /// Подпрыгивание
  Bounce,
  /// Покачивание
  Shake,
  /// Мигание
  Blink,
  /// Растворение (буквы исчезают случайно)
  Dissolve,
  /// Масштабирование (для обратной совместимости)
  Scale,
}

/// Функция сглаживания анимации субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleEasing {
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
  /// Эластичная
  Elastic,
  /// Прыжок
  Bounce,
}

/// Направление анимации субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleDirection {
  /// Сверху
  Top,
  /// Снизу
  Bottom,
  /// Слева
  Left,
  /// Справа
  Right,
  /// Из центра
  Center,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_subtitle_new() {
    let subtitle = Subtitle::new("Test subtitle".to_string(), 10.0, 15.0);

    assert_eq!(subtitle.text, "Test subtitle");
    assert_eq!(subtitle.start_time, 10.0);
    assert_eq!(subtitle.end_time, 15.0);
    assert_eq!(subtitle.duration, 5.0);
    assert!(subtitle.enabled);
    assert!(!subtitle.id.is_empty());
    assert_eq!(subtitle.font_family, "Arial");
    assert_eq!(subtitle.font_size, 24.0);
    assert_eq!(subtitle.color, "#FFFFFF");
    assert_eq!(subtitle.opacity, 1.0);
    assert!(subtitle.shadow);
    assert!(subtitle.outline);
  }

  #[test]
  fn test_subtitle_validation() {
    // Valid subtitle
    let valid_subtitle = Subtitle::new("Valid text".to_string(), 0.0, 5.0);
    assert!(valid_subtitle.validate().is_ok());

    // Empty text
    let mut invalid_subtitle = Subtitle::new("".to_string(), 0.0, 5.0);
    assert!(invalid_subtitle.validate().is_err());
    assert!(invalid_subtitle.validate().unwrap_err().contains("пустым"));

    // Negative start time
    invalid_subtitle = Subtitle::new("Text".to_string(), -1.0, 5.0);
    assert!(invalid_subtitle.validate().is_err());
    assert!(invalid_subtitle
      .validate()
      .unwrap_err()
      .contains("отрицательным"));

    // End time <= start time
    invalid_subtitle = Subtitle::new("Text".to_string(), 5.0, 5.0);
    assert!(invalid_subtitle.validate().is_err());
    assert!(invalid_subtitle
      .validate()
      .unwrap_err()
      .contains("больше времени начала"));

    invalid_subtitle = Subtitle::new("Text".to_string(), 5.0, 3.0);
    assert!(invalid_subtitle.validate().is_err());
  }

  #[test]
  fn test_subtitle_get_duration() {
    let subtitle = Subtitle::new("Test".to_string(), 10.5, 25.7);
    assert_eq!(subtitle.get_duration(), 15.2);
    assert_eq!(subtitle.duration, subtitle.get_duration());
  }

  #[test]
  fn test_subtitle_position_default() {
    let pos = SubtitlePosition::default();
    match pos {
      SubtitlePosition::Relative { align_x, align_y } => {
        assert_eq!(align_x, SubtitleAlignX::Center);
        assert_eq!(align_y, SubtitleAlignY::Bottom);
      }
      _ => panic!("Expected Relative position"),
    }
  }

  #[test]
  fn test_subtitle_position_variants() {
    // Absolute position
    let abs_pos = SubtitlePosition::Absolute { x: 100.0, y: 200.0 };
    match abs_pos {
      SubtitlePosition::Absolute { x, y } => {
        assert_eq!(x, 100.0);
        assert_eq!(y, 200.0);
      }
      _ => panic!("Expected Absolute position"),
    }

    // Relative positions
    let relative_positions = vec![
      (SubtitleAlignX::Left, SubtitleAlignY::Top),
      (SubtitleAlignX::Center, SubtitleAlignY::Center),
      (SubtitleAlignX::Right, SubtitleAlignY::Bottom),
      (SubtitleAlignX::Left, SubtitleAlignY::Middle),
    ];

    for (align_x, align_y) in relative_positions {
      let pos = SubtitlePosition::Relative {
        align_x: align_x.clone(),
        align_y: align_y.clone(),
      };
      match pos {
        SubtitlePosition::Relative {
          align_x: ax,
          align_y: ay,
        } => {
          assert_eq!(ax, align_x);
          assert_eq!(ay, align_y);
        }
        _ => panic!("Expected Relative position"),
      }
    }
  }

  #[test]
  fn test_subtitle_margin_default() {
    let margin = SubtitleMargin::default();
    assert_eq!(margin.top, 20.0);
    assert_eq!(margin.right, 20.0);
    assert_eq!(margin.bottom, 20.0);
    assert_eq!(margin.left, 20.0);
  }

  #[test]
  fn test_subtitle_style_default() {
    let style = SubtitleStyle::default();
    assert_eq!(style.font_family, "Arial");
    assert_eq!(style.font_size, 24.0);
    assert_eq!(style.font_weight, SubtitleFontWeight::Normal);
    assert_eq!(style.color, "#FFFFFF");
    assert_eq!(style.stroke_color, Some("#000000".to_string()));
    assert_eq!(style.stroke_width, 2.0);
    assert_eq!(style.shadow_color, Some("#000000".to_string()));
    assert_eq!(style.shadow_x, 2.0);
    assert_eq!(style.shadow_y, 2.0);
    assert_eq!(style.shadow_blur, 4.0);
    assert_eq!(style.background_color, None);
    assert_eq!(style.background_opacity, 0.8);
    assert_eq!(style.border_radius, 4.0);
    assert_eq!(style.line_height, 1.2);
    assert_eq!(style.letter_spacing, 0.0);
    assert_eq!(style.max_width, 80.0);
  }

  #[test]
  fn test_subtitle_font_weight_variants() {
    let weights = vec![
      SubtitleFontWeight::Thin,
      SubtitleFontWeight::Light,
      SubtitleFontWeight::Normal,
      SubtitleFontWeight::Medium,
      SubtitleFontWeight::Bold,
      SubtitleFontWeight::Black,
    ];

    for weight in weights {
      // Test that each variant can be created and compared
      let cloned = weight.clone();
      assert_eq!(weight, cloned);
    }
  }

  #[test]
  fn test_subtitle_padding_default() {
    let padding = SubtitlePadding::default();
    assert_eq!(padding.top, 8.0);
    assert_eq!(padding.right, 12.0);
    assert_eq!(padding.bottom, 8.0);
    assert_eq!(padding.left, 12.0);
  }

  #[test]
  fn test_subtitle_animation_new() {
    let anim = SubtitleAnimation::new(SubtitleAnimationType::FadeIn, 1.5);

    assert!(!anim.id.is_empty());
    assert_eq!(anim.animation_type, SubtitleAnimationType::FadeIn);
    assert_eq!(anim.duration, 1.5);
    assert_eq!(anim.delay, 0.0);
    assert_eq!(anim.easing, SubtitleEasing::EaseInOut);
    assert_eq!(anim.direction, None);
    assert!(anim.properties.is_empty());
    assert_eq!(anim.start_time, 0.0);
  }

  #[test]
  fn test_subtitle_animation_types() {
    let animation_types = vec![
      SubtitleAnimationType::FadeIn,
      SubtitleAnimationType::FadeOut,
      SubtitleAnimationType::SlideIn,
      SubtitleAnimationType::SlideOut,
      SubtitleAnimationType::ScaleIn,
      SubtitleAnimationType::ScaleOut,
      SubtitleAnimationType::Typewriter,
      SubtitleAnimationType::Wave,
      SubtitleAnimationType::Bounce,
      SubtitleAnimationType::Shake,
      SubtitleAnimationType::Blink,
      SubtitleAnimationType::Dissolve,
      SubtitleAnimationType::Scale,
    ];

    for anim_type in animation_types {
      let anim = SubtitleAnimation::new(anim_type.clone(), 1.0);
      assert_eq!(anim.animation_type, anim_type);
    }
  }

  #[test]
  fn test_subtitle_easing_types() {
    let easing_types = vec![
      SubtitleEasing::Linear,
      SubtitleEasing::Ease,
      SubtitleEasing::EaseIn,
      SubtitleEasing::EaseOut,
      SubtitleEasing::EaseInOut,
      SubtitleEasing::Elastic,
      SubtitleEasing::Bounce,
    ];

    for easing in easing_types {
      let mut anim = SubtitleAnimation::new(SubtitleAnimationType::FadeIn, 1.0);
      anim.easing = easing.clone();
      assert_eq!(anim.easing, easing);
    }
  }

  #[test]
  fn test_subtitle_direction_types() {
    let directions = vec![
      SubtitleDirection::Top,
      SubtitleDirection::Bottom,
      SubtitleDirection::Left,
      SubtitleDirection::Right,
      SubtitleDirection::Center,
    ];

    for direction in directions {
      let mut anim = SubtitleAnimation::new(SubtitleAnimationType::SlideIn, 1.0);
      anim.direction = Some(direction.clone());
      assert_eq!(anim.direction, Some(direction));
    }
  }

  #[test]
  fn test_subtitle_with_animations() {
    let mut subtitle = Subtitle::new("Animated text".to_string(), 0.0, 5.0);

    // Add fade in animation
    let fade_in = SubtitleAnimation::new(SubtitleAnimationType::FadeIn, 0.5);
    subtitle.animations.push(fade_in);

    // Add slide out animation
    let mut slide_out = SubtitleAnimation::new(SubtitleAnimationType::SlideOut, 0.5);
    slide_out.direction = Some(SubtitleDirection::Right);
    slide_out.delay = 4.5;
    subtitle.animations.push(slide_out);

    assert_eq!(subtitle.animations.len(), 2);
    assert_eq!(
      subtitle.animations[0].animation_type,
      SubtitleAnimationType::FadeIn
    );
    assert_eq!(
      subtitle.animations[1].animation_type,
      SubtitleAnimationType::SlideOut
    );
    assert_eq!(
      subtitle.animations[1].direction,
      Some(SubtitleDirection::Right)
    );
  }

  #[test]
  fn test_subtitle_serialization() {
    let subtitle = Subtitle::new("Test subtitle".to_string(), 10.0, 15.0);

    // Serialize
    let serialized = serde_json::to_string(&subtitle).unwrap();
    assert!(serialized.contains("\"text\":\"Test subtitle\""));
    assert!(serialized.contains("\"start_time\":10.0"));
    assert!(serialized.contains("\"end_time\":15.0"));

    // Deserialize
    let deserialized: Subtitle = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.text, subtitle.text);
    assert_eq!(deserialized.start_time, subtitle.start_time);
    assert_eq!(deserialized.end_time, subtitle.end_time);
    assert_eq!(deserialized.id, subtitle.id);
  }

  #[test]
  fn test_subtitle_animation_with_properties() {
    let mut anim = SubtitleAnimation::new(SubtitleAnimationType::Shake, 0.5);

    // Add custom properties
    anim
      .properties
      .insert("intensity".to_string(), serde_json::json!(5));
    anim
      .properties
      .insert("frequency".to_string(), serde_json::json!(10.0));

    assert_eq!(anim.properties.len(), 2);
    assert_eq!(
      anim.properties.get("intensity"),
      Some(&serde_json::json!(5))
    );
    assert_eq!(
      anim.properties.get("frequency"),
      Some(&serde_json::json!(10.0))
    );
  }

  #[test]
  #[allow(clippy::field_reassign_with_default)]
  fn test_subtitle_complex_style() {
    let mut style = SubtitleStyle::default();

    // Modify style
    style.font_family = "Roboto".to_string();
    style.font_size = 32.0;
    style.font_weight = SubtitleFontWeight::Bold;
    style.color = "#FF5733".to_string();
    style.background_color = Some("#000000".to_string());
    style.background_opacity = 0.5;
    style.padding = SubtitlePadding {
      top: 10.0,
      right: 15.0,
      bottom: 10.0,
      left: 15.0,
    };
    style.max_width = 90.0;

    assert_eq!(style.font_family, "Roboto");
    assert_eq!(style.font_size, 32.0);
    assert_eq!(style.font_weight, SubtitleFontWeight::Bold);
    assert_eq!(style.color, "#FF5733");
    assert_eq!(style.background_color, Some("#000000".to_string()));
    assert_eq!(style.background_opacity, 0.5);
    assert_eq!(style.padding.left, 15.0);
    assert_eq!(style.max_width, 90.0);
  }

  #[test]
  fn test_subtitle_edge_cases() {
    // Very long duration
    let long_subtitle = Subtitle::new("Long subtitle".to_string(), 0.0, 3600.0);
    assert_eq!(long_subtitle.get_duration(), 3600.0);

    // Very short duration
    let short_subtitle = Subtitle::new("Short".to_string(), 0.0, 0.1);
    assert_eq!(short_subtitle.get_duration(), 0.1);

    // Unicode text
    let unicode_subtitle = Subtitle::new("Привет мир! 🌍".to_string(), 0.0, 5.0);
    assert_eq!(unicode_subtitle.text, "Привет мир! 🌍");

    // Multiple validation errors
    let invalid = Subtitle::new("".to_string(), -5.0, -10.0);
    let validation_result = invalid.validate();
    assert!(validation_result.is_err());
  }

  #[test]
  fn test_subtitle_alignment_combinations() {
    let x_aligns = vec![
      SubtitleAlignX::Left,
      SubtitleAlignX::Center,
      SubtitleAlignX::Right,
    ];
    let y_aligns = vec![
      SubtitleAlignY::Top,
      SubtitleAlignY::Center,
      SubtitleAlignY::Middle,
      SubtitleAlignY::Bottom,
    ];

    for x in &x_aligns {
      for y in &y_aligns {
        let pos = SubtitlePosition::Relative {
          align_x: x.clone(),
          align_y: y.clone(),
        };

        match pos {
          SubtitlePosition::Relative { align_x, align_y } => {
            assert_eq!(align_x, *x);
            assert_eq!(align_y, *y);
          }
          _ => panic!("Expected Relative position"),
        }
      }
    }
  }

  #[test]
  fn test_subtitle_animation_combinations() {
    // Test animation with all optional fields set
    let mut anim = SubtitleAnimation::new(SubtitleAnimationType::SlideIn, 2.0);
    anim.delay = 1.0;
    anim.easing = SubtitleEasing::Elastic;
    anim.direction = Some(SubtitleDirection::Left);
    anim.start_time = 5.0;
    anim
      .properties
      .insert("custom_prop".to_string(), serde_json::json!("value"));

    assert_eq!(anim.duration, 2.0);
    assert_eq!(anim.delay, 1.0);
    assert_eq!(anim.easing, SubtitleEasing::Elastic);
    assert_eq!(anim.direction, Some(SubtitleDirection::Left));
    assert_eq!(anim.start_time, 5.0);
    assert!(!anim.properties.is_empty());
  }
}

//! FFmpeg Builder - Модуль обработки субтитров

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{
  ProjectSchema, Subtitle, SubtitleAlignX, SubtitleAlignY, SubtitleAnimation,
  SubtitleAnimationType, SubtitleDirection, SubtitleFontWeight, SubtitlePosition,
};

/// Построитель субтитров
pub struct SubtitleBuilder<'a> {
  project: &'a ProjectSchema,
}

impl<'a> SubtitleBuilder<'a> {
  /// Создать новый построитель субтитров
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self { project }
  }

  /// Построить фильтр субтитров
  pub async fn build_subtitle_filter(&self) -> Result<String> {
    if self.project.subtitles.is_empty() {
      return Ok(String::new());
    }

    let mut subtitle_filters = Vec::new();
    let base_resolution = &self.project.settings.resolution;

    for (idx, subtitle) in self.project.subtitles.iter().enumerate() {
      let filter = self
        .build_single_subtitle_filter(subtitle, idx, base_resolution)
        .await?;
      subtitle_filters.push(filter);
    }

    // Объединяем все субтитры
    if subtitle_filters.len() == 1 {
      Ok(format!("[outv]{}[outv_with_subs]", subtitle_filters[0]))
    } else {
      // Накладываем субтитры последовательно
      let mut filter_chain = String::new();
      let mut current_input = "[outv]".to_string();

      for (idx, filter) in subtitle_filters.iter().enumerate() {
        let output = if idx == subtitle_filters.len() - 1 {
          "[outv_with_subs]".to_string()
        } else {
          format!("[sub_tmp{idx}]")
        };

        filter_chain.push_str(&format!("{current_input}{filter}{output};"));

        if idx < subtitle_filters.len() - 1 {
          current_input = format!("[sub_tmp{idx}]");
        }
      }

      Ok(filter_chain)
    }
  }

  /// Построить фильтр для одного субтитра
  async fn build_single_subtitle_filter(
    &self,
    subtitle: &Subtitle,
    _index: usize,
    resolution: &crate::video_compiler::schema::Resolution,
  ) -> Result<String> {
    let mut filter = String::new();

    // Экранируем текст
    let escaped_text = self.escape_text(&subtitle.text);

    // Получаем путь к шрифту
    let font_path = self.get_font_path(&subtitle.font_family);

    // Вычисляем позицию
    let (x, y) = self.calculate_position(subtitle, resolution);

    // Базовые параметры drawtext
    filter.push_str(&format!(
      "drawtext=text='{}':fontfile='{}':fontsize={}:fontcolor={}@{}",
      escaped_text,
      font_path,
      subtitle.font_size,
      &subtitle.color[1..], // Убираем # из цвета
      subtitle.opacity
    ));

    // Добавляем жирность шрифта
    if subtitle.font_weight != SubtitleFontWeight::Normal {
      filter.push_str(&format!(
        ":font_weight={}",
        self.get_font_weight_value(&subtitle.font_weight)
      ));
    }

    // Добавляем позицию
    filter.push_str(&format!(":x={x}:y={y}"));

    // Добавляем тень если включена
    if subtitle.shadow {
      filter.push_str(":shadowx=2:shadowy=2:shadowcolor=black@0.5");
    }

    // Добавляем обводку если включена
    if subtitle.outline {
      filter.push_str(":borderw=2:bordercolor=black@0.8");
    }

    // Временные границы
    filter.push_str(&format!(
      ":enable='between(t,{},{})'",
      subtitle.start_time,
      subtitle.start_time + subtitle.duration
    ));

    // Применяем анимации
    if !subtitle.animations.is_empty() {
      filter = self.apply_animations_to_subtitle(filter, subtitle, resolution)?;
    }

    Ok(filter)
  }

  /// Применить анимации к субтитру
  fn apply_animations_to_subtitle(
    &self,
    mut filter: String,
    subtitle: &Subtitle,
    resolution: &crate::video_compiler::schema::Resolution,
  ) -> Result<String> {
    for animation in &subtitle.animations {
      filter = self.apply_single_animation(filter, animation, subtitle, resolution)?;
    }
    Ok(filter)
  }

  /// Применить одну анимацию к субтитру
  fn apply_single_animation(
    &self,
    filter: String,
    animation: &SubtitleAnimation,
    subtitle: &Subtitle,
    resolution: &crate::video_compiler::schema::Resolution,
  ) -> Result<String> {
    let start_time = subtitle.start_time + animation.start_time;
    let end_time = start_time + animation.duration;

    match animation.animation_type {
      SubtitleAnimationType::FadeIn => {
        // Заменяем статическую прозрачность на анимированную для fade in
        Ok(filter.replace(
          &format!("@{}", subtitle.opacity),
          &format!(
            "@{{if(lt(t,{}),0,if(gt(t,{}),{},({}-{})*(t-{})/{}+0))}}",
            start_time,
            end_time,
            subtitle.opacity,
            subtitle.opacity,
            0.0,
            start_time,
            animation.duration
          ),
        ))
      }
      SubtitleAnimationType::FadeOut => {
        // Анимация исчезновения
        Ok(filter.replace(
          &format!("@{}", subtitle.opacity),
          &format!(
            "@{{if(lt(t,{}),{},if(gt(t,{}),0,{}*(1-(t-{})/{})))}}",
            start_time,
            subtitle.opacity,
            end_time,
            subtitle.opacity,
            start_time,
            animation.duration
          ),
        ))
      }
      SubtitleAnimationType::SlideIn => {
        // Анимация появления слайдом
        let direction = animation
          .direction
          .as_ref()
          .unwrap_or(&SubtitleDirection::Top);
        let (start_x, start_y, end_x, end_y) =
          self.calculate_slide_positions(subtitle, resolution, direction, true);

        let x_expr = format!(
          "{{if(lt(t,{}),{},if(gt(t,{}),{},{}+({}-({}))*(t-{})/{}))}}",
          start_time,
          start_x,
          end_time,
          end_x,
          start_x,
          end_x,
          start_x,
          start_time,
          animation.duration
        );

        let y_expr = format!(
          "{{if(lt(t,{}),{},if(gt(t,{}),{},{}+({}-({}))*(t-{})/{}))}}",
          start_time,
          start_y,
          end_time,
          end_y,
          start_y,
          end_y,
          start_y,
          start_time,
          animation.duration
        );

        Ok(
          filter
            .replace(
              &format!(":x={}", self.calculate_position(subtitle, resolution).0),
              &format!(":x={x_expr}"),
            )
            .replace(
              &format!(":y={}", self.calculate_position(subtitle, resolution).1),
              &format!(":y={y_expr}"),
            ),
        )
      }
      SubtitleAnimationType::SlideOut => {
        // Анимация исчезновения слайдом
        let direction = animation
          .direction
          .as_ref()
          .unwrap_or(&SubtitleDirection::Bottom);
        let (start_x, start_y, end_x, end_y) =
          self.calculate_slide_positions(subtitle, resolution, direction, false);

        let x_expr = format!(
          "{{if(lt(t,{}),{},if(gt(t,{}),{},{}+({}-({}))*(t-{})/{}))}}",
          start_time,
          start_x,
          end_time,
          end_x,
          start_x,
          end_x,
          start_x,
          start_time,
          animation.duration
        );

        let y_expr = format!(
          "{{if(lt(t,{}),{},if(gt(t,{}),{},{}+({}-({}))*(t-{})/{}))}}",
          start_time,
          start_y,
          end_time,
          end_y,
          start_y,
          end_y,
          start_y,
          start_time,
          animation.duration
        );

        Ok(
          filter
            .replace(
              &format!(":x={}", self.calculate_position(subtitle, resolution).0),
              &format!(":x={x_expr}"),
            )
            .replace(
              &format!(":y={}", self.calculate_position(subtitle, resolution).1),
              &format!(":y={y_expr}"),
            ),
        )
      }
      SubtitleAnimationType::Scale => {
        // Анимация масштабирования
        let scale_expr = format!(
          "{{if(lt(t,{}),0,if(gt(t,{}),1,(t-{})/{}))}}",
          start_time, end_time, start_time, animation.duration
        );

        // Модифицируем размер шрифта
        Ok(filter.replace(
          &format!(":fontsize={}", subtitle.font_size),
          &format!(":fontsize={}{}", subtitle.font_size, scale_expr),
        ))
      }
      SubtitleAnimationType::ScaleIn => {
        // Анимация появления с увеличением
        let scale_expr = format!(
          "{{if(lt(t,{}),0,if(gt(t,{}),1,(t-{})/{}))}}",
          start_time, end_time, start_time, animation.duration
        );
        Ok(filter.replace(
          &format!(":fontsize={}", subtitle.font_size),
          &format!(":fontsize={}{}", subtitle.font_size, scale_expr),
        ))
      }
      SubtitleAnimationType::ScaleOut => {
        // Анимация исчезновения с уменьшением
        let scale_expr = format!(
          "{{if(lt(t,{}),1,if(gt(t,{}),0,1-(t-{})/{}))}}",
          start_time, end_time, start_time, animation.duration
        );
        Ok(filter.replace(
          &format!(":fontsize={}", subtitle.font_size),
          &format!(":fontsize={}{}", subtitle.font_size, scale_expr),
        ))
      }
      SubtitleAnimationType::Typewriter => {
        // Эффект печатной машинки - постепенное появление букв
        // Используем простую fade in анимацию как приближение
        Ok(filter.replace(
          &format!("@{}", subtitle.opacity),
          &format!(
            "@{{if(lt(t,{}),0,if(gt(t,{}),{},({}-{})*(t-{})/{}+0))}}",
            start_time,
            end_time,
            subtitle.opacity,
            subtitle.opacity,
            0.0,
            start_time,
            animation.duration
          ),
        ))
      }
      SubtitleAnimationType::Bounce => {
        // Анимация подпрыгивания
        // Простая вертикальная анимация
        let bounce_expr = format!(
          "{{if(lt(t,{}),0,if(gt(t,{}),0,sin((t-{})*3.14/{})*20))}}",
          start_time, end_time, start_time, animation.duration
        );
        Ok(filter.replace(
          &format!(":y={}", self.calculate_position(subtitle, resolution).1),
          &format!(
            ":y={}-{}",
            self.calculate_position(subtitle, resolution).1,
            bounce_expr
          ),
        ))
      }
      SubtitleAnimationType::Shake => {
        // Анимация тряски
        let shake_expr = format!("{{if(lt(t,{start_time}),0,if(gt(t,{end_time}),0,sin(t*50)*5))}}");
        Ok(filter.replace(
          &format!(":x={}", self.calculate_position(subtitle, resolution).0),
          &format!(
            ":x={}+{}",
            self.calculate_position(subtitle, resolution).0,
            shake_expr
          ),
        ))
      }
      SubtitleAnimationType::Blink => {
        // Анимация мигания - используем fade in/out
        Ok(filter.replace(
          &format!("@{}", subtitle.opacity),
          &format!(
            "@{{if(lt(t,{}),0,if(gt(t,{}),{},{}*abs(sin((t-{})*3.14/{}))))}}",
            start_time,
            end_time,
            subtitle.opacity,
            subtitle.opacity,
            start_time,
            animation.duration
          ),
        ))
      }
      SubtitleAnimationType::Dissolve => {
        // Анимация растворения
        Ok(filter.replace(
          &format!("@{}", subtitle.opacity),
          &format!(
            "@{{if(lt(t,{}),{},if(gt(t,{}),0,{}*(1-(t-{})/{})))}}",
            start_time,
            subtitle.opacity,
            end_time,
            subtitle.opacity,
            start_time,
            animation.duration
          ),
        ))
      }
      SubtitleAnimationType::Wave => {
        // Анимация волны - используем bounce как замену
        let wave_expr = format!(
          "{{if(lt(t,{}),0,if(gt(t,{}),0,sin((t-{})*3.14/{})*10))}}",
          start_time, end_time, start_time, animation.duration
        );
        Ok(filter.replace(
          &format!(":y={}", self.calculate_position(subtitle, resolution).1),
          &format!(
            ":y={}-{}",
            self.calculate_position(subtitle, resolution).1,
            wave_expr
          ),
        ))
      }
    }
  }

  /// Экранировать текст субтитра для FFmpeg
  fn escape_text(&self, text: &str) -> String {
    text
      .replace("\\", "\\\\")
      .replace("'", "\\'")
      .replace(":", "\\:")
      .replace("\n", "\\n")
  }

  /// Получить путь к шрифту
  fn get_font_path(&self, font_family: &str) -> String {
    // Здесь можно добавить логику поиска системных шрифтов
    // Пока используем дефолтный путь
    match font_family {
      "Arial" => "/System/Library/Fonts/Helvetica.ttc".to_string(),
      "Times New Roman" => "/System/Library/Fonts/Times.ttc".to_string(),
      "Courier New" => "/System/Library/Fonts/Courier.ttc".to_string(),
      _ => "/System/Library/Fonts/Helvetica.ttc".to_string(), // Default
    }
  }

  /// Вычислить позицию субтитра
  fn calculate_position(
    &self,
    subtitle: &Subtitle,
    resolution: &crate::video_compiler::schema::Resolution,
  ) -> (String, String) {
    let (x, y) = match &subtitle.position {
      SubtitlePosition::Absolute { x, y } => (*x as i32, *y as i32),
      SubtitlePosition::Relative { align_x, align_y } => {
        let x = match align_x {
          SubtitleAlignX::Left => 20,
          SubtitleAlignX::Center => resolution.width as i32 / 2,
          SubtitleAlignX::Right => resolution.width as i32 - 20,
        };

        let y = match align_y {
          SubtitleAlignY::Top => 20,
          SubtitleAlignY::Center => resolution.height as i32 / 2,
          SubtitleAlignY::Middle => resolution.height as i32 / 2,
          SubtitleAlignY::Bottom => resolution.height as i32 - 50,
        };

        (x, y)
      }
    };

    // Для центрирования текста по X
    let x_expr = if matches!(
      subtitle.position,
      SubtitlePosition::Relative {
        align_x: SubtitleAlignX::Center,
        ..
      }
    ) {
      "(w-text_w)/2".to_string()
    } else if matches!(
      subtitle.position,
      SubtitlePosition::Relative {
        align_x: SubtitleAlignX::Right,
        ..
      }
    ) {
      format!("{x}-text_w")
    } else {
      x.to_string()
    };

    // Для центрирования текста по Y
    let y_expr = if matches!(
      subtitle.position,
      SubtitlePosition::Relative {
        align_y: SubtitleAlignY::Middle,
        ..
      }
    ) {
      "(h-text_h)/2".to_string()
    } else if matches!(
      subtitle.position,
      SubtitlePosition::Relative {
        align_y: SubtitleAlignY::Bottom,
        ..
      }
    ) {
      format!("{y}-text_h")
    } else {
      y.to_string()
    };

    (x_expr, y_expr)
  }

  /// Вычислить позиции для анимации слайда
  fn calculate_slide_positions(
    &self,
    subtitle: &Subtitle,
    resolution: &crate::video_compiler::schema::Resolution,
    direction: &SubtitleDirection,
    is_slide_in: bool,
  ) -> (i32, i32, i32, i32) {
    let (x, y) = self.calculate_position(subtitle, resolution);
    let (end_x, end_y) = (
      x.parse::<i32>().unwrap_or(resolution.width as i32 / 2),
      y.parse::<i32>().unwrap_or(resolution.height as i32 / 2),
    );

    let (start_x, start_y) = if is_slide_in {
      match direction {
        SubtitleDirection::Left => (-200, end_y),
        SubtitleDirection::Right => (resolution.width as i32 + 200, end_y),
        SubtitleDirection::Top => (end_x, -50),
        SubtitleDirection::Bottom => (end_x, resolution.height as i32 + 50),
        SubtitleDirection::Center => (end_x, end_y), // Без движения
      }
    } else {
      (end_x, end_y)
    };

    let (end_x, end_y) = if !is_slide_in {
      match direction {
        SubtitleDirection::Left => (-200, end_y),
        SubtitleDirection::Right => (resolution.width as i32 + 200, end_y),
        SubtitleDirection::Top => (end_x, -50),
        SubtitleDirection::Bottom => (end_x, resolution.height as i32 + 50),
        SubtitleDirection::Center => (end_x, end_y), // Без движения
      }
    } else {
      (end_x, end_y)
    };

    (start_x, start_y, end_x, end_y)
  }

  /// Получить значение жирности шрифта
  fn get_font_weight_value(&self, weight: &SubtitleFontWeight) -> &str {
    match weight {
      SubtitleFontWeight::Thin => "100",
      SubtitleFontWeight::Light => "300",
      SubtitleFontWeight::Normal => "400",
      SubtitleFontWeight::Medium => "500",
      SubtitleFontWeight::Bold => "700",
      SubtitleFontWeight::Black => "900",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::subtitles::Subtitle;
  use crate::video_compiler::schema::SubtitleEasing;
  use crate::video_compiler::tests::fixtures::*;
  use std::collections::HashMap;

  #[test]
  fn test_subtitle_builder_new() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_build_subtitle_filter_empty() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let result = builder.build_subtitle_filter().await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(
      filter.is_empty(),
      "Empty project should have no subtitle filters"
    );
  }

  #[tokio::test]
  async fn test_build_subtitle_filter_with_subtitles() {
    let mut project = create_minimal_project();

    // Добавляем субтитр
    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    project.subtitles.push(subtitle);

    let builder = SubtitleBuilder::new(&project);
    let result = builder.build_subtitle_filter().await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(
      !filter.is_empty(),
      "Project with subtitles should have filter"
    );
    assert!(filter.contains("[outv_with_subs]"));
  }

  #[tokio::test]
  async fn test_build_single_subtitle_filter() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    let resolution = &project.settings.resolution;

    let result = builder
      .build_single_subtitle_filter(&subtitle, 0, resolution)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty());
    assert!(filter.contains("drawtext"));
  }

  #[test]
  fn test_calculate_position() {
    use crate::video_compiler::schema::Resolution;

    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    let resolution = Resolution {
      width: 1920,
      height: 1080,
    };

    let (x, y) = builder.calculate_position(&subtitle, &resolution);

    // Координаты должны быть рассчитаны
    assert!(!x.is_empty());
    assert!(!y.is_empty());
  }

  #[test]
  fn test_get_font_weight_value() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    use crate::video_compiler::schema::subtitles::SubtitleFontWeight;

    assert_eq!(
      builder.get_font_weight_value(&SubtitleFontWeight::Thin),
      "100"
    );
    assert_eq!(
      builder.get_font_weight_value(&SubtitleFontWeight::Light),
      "300"
    );
    assert_eq!(
      builder.get_font_weight_value(&SubtitleFontWeight::Normal),
      "400"
    );
    assert_eq!(
      builder.get_font_weight_value(&SubtitleFontWeight::Medium),
      "500"
    );
    assert_eq!(
      builder.get_font_weight_value(&SubtitleFontWeight::Bold),
      "700"
    );
    assert_eq!(
      builder.get_font_weight_value(&SubtitleFontWeight::Black),
      "900"
    );
  }

  #[test]
  fn test_subtitle_timing() {
    let _project = create_minimal_project();

    let subtitle = Subtitle::new("Test subtitle".to_string(), 2.5, 5.8);

    // Проверяем что время правильно установлено
    assert_eq!(subtitle.start_time, 2.5);
    assert_eq!(subtitle.end_time, 5.8);
    assert!((subtitle.duration - 3.3).abs() < 0.01); // Проверяем длительность
  }

  #[tokio::test]
  async fn test_multiple_subtitles() {
    let mut project = create_minimal_project();

    // Добавляем несколько субтитров
    project
      .subtitles
      .push(Subtitle::new("First subtitle".to_string(), 1.0, 3.0));
    project
      .subtitles
      .push(Subtitle::new("Second subtitle".to_string(), 3.5, 6.0));
    project
      .subtitles
      .push(Subtitle::new("Third subtitle".to_string(), 6.5, 9.0));

    let builder = SubtitleBuilder::new(&project);
    let result = builder.build_subtitle_filter().await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty());

    // Должны быть промежуточные выходы для нескольких субтитров
    assert!(filter.contains("[sub_tmp") || filter.contains("[outv_with_subs]"));
  }

  #[test]
  fn test_escape_subtitle_text() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    // Тестируем экранирование специальных символов
    let text_with_quotes = "Text with \"quotes\" and 'apostrophes'";
    let escaped = builder.escape_text(text_with_quotes);

    // Проверяем что кавычки экранированы
    assert!(escaped.contains("\\'") || escaped.contains("\\\\"));
  }

  #[test]
  fn test_slide_positions() {
    use crate::video_compiler::schema::subtitles::SubtitleDirection;
    use crate::video_compiler::schema::Resolution;

    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    let resolution = Resolution {
      width: 1920,
      height: 1080,
    };

    // Тест анимации слайда слева
    let (start_x, start_y, _end_x, end_y) = builder.calculate_slide_positions(
      &subtitle,
      &resolution,
      &SubtitleDirection::Left,
      true, // is_slide_in
    );

    // При SlideIn слева, начинаем за левым краем экрана
    assert!(start_x < 0);
    assert_eq!(start_y, end_y); // Y координата не должна изменяться для горизонтального слайда
  }

  #[test]
  fn test_escape_text() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    assert_eq!(builder.escape_text("Simple text"), "Simple text");
    assert_eq!(
      builder.escape_text("Text with 'quotes'"),
      "Text with \\'quotes\\'"
    );
    assert_eq!(
      builder.escape_text("Text with : colon"),
      "Text with \\: colon"
    );
    assert_eq!(
      builder.escape_text("Text with \\ backslash"),
      "Text with \\\\ backslash"
    );
    assert_eq!(
      builder.escape_text("Text with\nnewline"),
      "Text with\\nnewline"
    );
    assert_eq!(
      builder.escape_text("Complex 'text' with: all\\chars\n"),
      "Complex \\'text\\' with\\: all\\\\chars\\n"
    );
  }

  #[test]
  fn test_get_font_path() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let arial_path = builder.get_font_path("Arial");
    assert!(arial_path.contains("Helvetica"));

    let times_path = builder.get_font_path("Times New Roman");
    assert!(times_path.contains("Times"));

    let courier_path = builder.get_font_path("Courier New");
    assert!(courier_path.contains("Courier"));

    let unknown_path = builder.get_font_path("Unknown Font");
    assert!(unknown_path.contains("Helvetica")); // Should fallback to default
  }

  #[test]
  fn test_calculate_position_absolute() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let mut subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    subtitle.position = SubtitlePosition::Absolute { x: 100.0, y: 200.0 };

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let (x, y) = builder.calculate_position(&subtitle, &resolution);
    assert_eq!(x, "100");
    assert_eq!(y, "200");
  }

  #[test]
  fn test_calculate_position_relative() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let mut subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    // Test center alignment
    subtitle.position = SubtitlePosition::Relative {
      align_x: SubtitleAlignX::Center,
      align_y: SubtitleAlignY::Middle,
    };
    let (x, y) = builder.calculate_position(&subtitle, &resolution);
    assert_eq!(x, "(w-text_w)/2");
    assert_eq!(y, "(h-text_h)/2");

    // Test right-bottom alignment
    subtitle.position = SubtitlePosition::Relative {
      align_x: SubtitleAlignX::Right,
      align_y: SubtitleAlignY::Bottom,
    };
    let (x, y) = builder.calculate_position(&subtitle, &resolution);
    assert!(x.contains("text_w"));
    assert!(y.contains("text_h"));
  }

  #[test]
  fn test_apply_animations_to_subtitle() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let mut subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    subtitle.animations.push(SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::FadeIn,
      start_time: 0.0,
      duration: 1.0,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    });

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let filter = "drawtext=text='Test':fontsize=24@1.0".to_string();
    let result = builder.apply_animations_to_subtitle(filter, &subtitle, &resolution);

    assert!(result.is_ok());
    let animated_filter = result.unwrap();
    assert!(animated_filter.contains("if("));
  }

  #[test]
  fn test_apply_single_animation_fade_in() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let animation = SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::FadeIn,
      start_time: 0.0,
      duration: 1.0,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    };

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let filter = format!("drawtext=text='Test':fontsize=24@{}", subtitle.opacity);
    let result = builder.apply_single_animation(filter, &animation, &subtitle, &resolution);

    assert!(result.is_ok());
    let animated = result.unwrap();
    assert!(animated.contains("if(lt(t,"));
  }

  #[test]
  fn test_apply_single_animation_slide_in() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let animation = SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::SlideIn,
      start_time: 0.0,
      duration: 1.0,
      delay: 0.0,
      direction: Some(SubtitleDirection::Left),
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    };

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let (x, y) = builder.calculate_position(&subtitle, &resolution);
    let filter = format!("drawtext=text='Test':x={x}:y={y}");
    let result = builder.apply_single_animation(filter, &animation, &subtitle, &resolution);

    assert!(result.is_ok());
    let animated = result.unwrap();
    assert!(animated.contains("if(lt(t,"));
  }

  #[test]
  fn test_apply_single_animation_scale() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let animation = SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::Scale,
      start_time: 0.0,
      duration: 1.0,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    };

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let filter = format!("drawtext=text='Test':fontsize={}", subtitle.font_size);
    let result = builder.apply_single_animation(filter, &animation, &subtitle, &resolution);

    assert!(result.is_ok());
    let animated = result.unwrap();
    assert!(animated.contains("fontsize="));
    assert!(animated.contains("if(lt(t,"));
  }

  #[test]
  fn test_apply_single_animation_bounce() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let animation = SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::Bounce,
      start_time: 0.0,
      duration: 1.0,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    };

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let (_x, y) = builder.calculate_position(&subtitle, &resolution);
    let filter = format!("drawtext=text='Test':y={y}");
    let result = builder.apply_single_animation(filter, &animation, &subtitle, &resolution);

    assert!(result.is_ok());
    let animated = result.unwrap();
    assert!(animated.contains("sin("));
  }

  #[test]
  fn test_apply_single_animation_shake() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let animation = SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::Shake,
      start_time: 0.0,
      duration: 1.0,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    };

    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let (x, _y) = builder.calculate_position(&subtitle, &resolution);
    let filter = format!("drawtext=text='Test':x={x}");
    let result = builder.apply_single_animation(filter, &animation, &subtitle, &resolution);

    assert!(result.is_ok());
    let animated = result.unwrap();
    assert!(animated.contains("sin(t*50)"));
  }

  #[test]
  fn test_calculate_slide_positions_all_directions() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    // Test all directions for slide in
    let directions = vec![
      SubtitleDirection::Left,
      SubtitleDirection::Right,
      SubtitleDirection::Top,
      SubtitleDirection::Bottom,
      SubtitleDirection::Center,
    ];

    for direction in directions {
      let (start_x, start_y, end_x, end_y) = builder.calculate_slide_positions(
        &subtitle,
        &resolution,
        &direction,
        true, // is_slide_in
      );

      match direction {
        SubtitleDirection::Left => assert!(start_x < 0),
        SubtitleDirection::Right => assert!(start_x > resolution.width as i32),
        SubtitleDirection::Top => assert!(start_y < 0),
        SubtitleDirection::Bottom => assert!(start_y > resolution.height as i32),
        SubtitleDirection::Center => {
          assert_eq!(start_x, end_x);
          assert_eq!(start_y, end_y);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_build_single_subtitle_with_shadow_and_outline() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let mut subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    subtitle.shadow = true;
    subtitle.outline = true;

    let resolution = &project.settings.resolution;

    let result = builder
      .build_single_subtitle_filter(&subtitle, 0, resolution)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("shadowx=2"));
    assert!(filter.contains("shadowy=2"));
    assert!(filter.contains("borderw=2"));
    assert!(filter.contains("bordercolor=black"));
  }

  #[tokio::test]
  async fn test_build_single_subtitle_with_bold_font() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let mut subtitle = Subtitle::new("Bold text".to_string(), 1.0, 3.0);
    subtitle.font_weight = SubtitleFontWeight::Bold;

    let resolution = &project.settings.resolution;

    let result = builder
      .build_single_subtitle_filter(&subtitle, 0, resolution)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains(":font_weight=700"));
  }

  #[test]
  fn test_apply_all_animation_types() {
    let project = create_minimal_project();
    let builder = SubtitleBuilder::new(&project);

    let subtitle = Subtitle::new("Test".to_string(), 1.0, 3.0);
    let resolution = crate::video_compiler::schema::Resolution {
      width: 1920,
      height: 1080,
    };

    let animation_types = vec![
      SubtitleAnimationType::FadeIn,
      SubtitleAnimationType::FadeOut,
      SubtitleAnimationType::SlideIn,
      SubtitleAnimationType::SlideOut,
      SubtitleAnimationType::Scale,
      SubtitleAnimationType::ScaleIn,
      SubtitleAnimationType::ScaleOut,
      SubtitleAnimationType::Typewriter,
      SubtitleAnimationType::Bounce,
      SubtitleAnimationType::Shake,
      SubtitleAnimationType::Blink,
      SubtitleAnimationType::Dissolve,
      SubtitleAnimationType::Wave,
    ];

    for anim_type in animation_types {
      let animation = SubtitleAnimation {
        id: "anim1".to_string(),
        animation_type: anim_type.clone(),
        start_time: 0.0,
        duration: 1.0,
        delay: 0.0,
        direction: Some(SubtitleDirection::Left),
        easing: SubtitleEasing::Linear,
        properties: HashMap::new(),
      };

      let filter = format!(
        "drawtext=text='Test':x=100:y=100:fontsize=24@{}",
        subtitle.opacity
      );
      let result = builder.apply_single_animation(filter, &animation, &subtitle, &resolution);

      assert!(result.is_ok(), "Failed for animation type: {anim_type:?}");
    }
  }

  #[tokio::test]
  async fn test_build_subtitle_filter_with_animations() {
    let mut project = create_minimal_project();

    let mut subtitle = Subtitle::new("Animated text".to_string(), 1.0, 3.0);
    subtitle.animations.push(SubtitleAnimation {
      id: "anim1".to_string(),
      animation_type: SubtitleAnimationType::FadeIn,
      start_time: 0.0,
      duration: 0.5,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    });
    subtitle.animations.push(SubtitleAnimation {
      id: "anim2".to_string(),
      animation_type: SubtitleAnimationType::FadeOut,
      start_time: 2.5,
      duration: 0.5,
      delay: 0.0,
      direction: None,
      easing: SubtitleEasing::Linear,
      properties: HashMap::new(),
    });

    project.subtitles.push(subtitle);

    let builder = SubtitleBuilder::new(&project);
    let result = builder.build_subtitle_filter().await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(!filter.is_empty());
    assert!(filter.contains("if("));
  }
}

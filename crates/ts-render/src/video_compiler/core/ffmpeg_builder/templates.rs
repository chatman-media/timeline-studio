//! FFmpeg Builder - Модуль обработки шаблонов

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::{
  AnimationType, ProjectSchema, StyleElementType, StyleTemplate, StyleTemplateElement, Template,
};

/// Построитель шаблонов
pub struct TemplateBuilder<'a> {
  project: &'a ProjectSchema,
}

impl<'a> TemplateBuilder<'a> {
  /// Создать новый построитель шаблонов
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self { project }
  }

  /// Построить фильтр для шаблона
  pub async fn build_template_filter(
    &self,
    template_id: &str,
    input_index: usize,
    track_index: usize,
  ) -> Result<String> {
    if let Some(template) = self.find_template(template_id) {
      self
        .build_multi_camera_template_filter(template, input_index)
        .await
    } else if let Some(style_template) = self.find_style_template(template_id) {
      self
        .build_style_template_filter(style_template, input_index, track_index)
        .await
    } else {
      Err(VideoCompilerError::TemplateNotFound(
        template_id.to_string(),
      ))
    }
  }

  /// Построить фильтр для шаблона многокамерной раскладки
  async fn build_multi_camera_template_filter(
    &self,
    template: &Template,
    input_index: usize,
  ) -> Result<String> {
    let mut filters = Vec::new();
    let base_resolution = &self.project.settings.resolution;

    // Обрабатываем каждый регион шаблона
    for (idx, region) in template.regions.iter().enumerate() {
      // Масштабируем и позиционируем видео для региона
      let scale_filter = format!(
        "[{}:v]scale={}:{},setpts=PTS-STARTPTS[region{}]",
        input_index + idx,
        region.width,
        region.height,
        idx
      );
      filters.push(scale_filter);

      // Добавляем паддинг если нужно
      if region.padding > 0 {
        let pad_filter = format!(
          "[region{}]pad={}:{}:{}:{}:black[padded{}]",
          idx,
          region.width + region.padding * 2,
          region.height + region.padding * 2,
          region.padding,
          region.padding,
          idx
        );
        filters.push(pad_filter);
      }
    }

    // Накладываем регионы на базовое разрешение
    let mut overlay_chain = String::new();
    overlay_chain.push_str(&format!(
      "color=c=black:s={}x{}:d=1[base]",
      base_resolution.width, base_resolution.height
    ));

    for (idx, region) in template.regions.iter().enumerate() {
      let input_label = if region.padding > 0 {
        format!("[padded{idx}]")
      } else {
        format!("[region{idx}]")
      };

      if idx == 0 {
        overlay_chain.push_str(&format!(
          ";[base]{}overlay={}:{}[tmp0]",
          input_label, region.x, region.y
        ));
      } else if idx == template.regions.len() - 1 {
        overlay_chain.push_str(&format!(
          ";[tmp{}]{}overlay={}:{}[out_template]",
          idx - 1,
          input_label,
          region.x,
          region.y
        ));
      } else {
        overlay_chain.push_str(&format!(
          ";[tmp{}]{}overlay={}:{}[tmp{}]",
          idx - 1,
          input_label,
          region.x,
          region.y,
          idx
        ));
      }
    }

    filters.push(overlay_chain);
    Ok(filters.join(""))
  }

  /// Построить фильтр для стильного шаблона
  async fn build_style_template_filter(
    &self,
    template: &StyleTemplate,
    input_index: usize,
    _track_index: usize,
  ) -> Result<String> {
    let mut filters = Vec::new();
    let base_resolution = &self.project.settings.resolution;

    // Создаем базовый слой
    let base_filter = format!(
      "color=c={}:s={}x{}:d={}[style_base]",
      template.background_color, base_resolution.width, base_resolution.height, template.duration
    );
    filters.push(base_filter);

    // Обрабатываем элементы шаблона
    let mut overlay_chain = String::new();
    let mut current_layer = "[style_base]".to_string();
    let mut layer_names = Vec::new();

    for (idx, element) in template.elements.iter().enumerate() {
      match &element.element_type {
        StyleElementType::Text => {
          // Создаем текстовый элемент
          let text_filter = self.build_text_element_filter(element, idx)?;
          filters.push(text_filter);

          // Применяем анимацию
          if !element.animations.is_empty() {
            let animated_filter = self.apply_element_animation(
              &format!("[text{idx}]"),
              element,
              idx,
              template.duration,
            )?;
            filters.push(animated_filter);
          }

          // Накладываем на текущий слой
          let output = if idx == template.elements.len() - 1 {
            "[style_output]"
          } else {
            &format!("[layer{idx}]")
          };

          overlay_chain.push_str(&format!(
            ";{}[animated{}]overlay={}:{}{}",
            current_layer, idx, element.position.x, element.position.y, output
          ));

          if idx < template.elements.len() - 1 {
            let layer_name = format!("[layer{idx}]");
            layer_names.push(layer_name.clone());
            current_layer = layer_name;
          }
        }
        StyleElementType::Image => {
          // Загружаем изображение
          let image_filter = format!(
            "movie={}:loop=0,scale={}:{}[img{}]",
            element.content, element.size.width, element.size.height, idx
          );
          filters.push(image_filter);

          // Применяем анимацию
          if !element.animations.is_empty() {
            let animated_filter = self.apply_element_animation(
              &format!("[img{idx}]"),
              element,
              idx,
              template.duration,
            )?;
            filters.push(animated_filter);
          }

          // Накладываем на текущий слой
          let output = if idx == template.elements.len() - 1 {
            "[style_output]"
          } else {
            &format!("[layer{idx}]")
          };

          overlay_chain.push_str(&format!(
            ";{}[animated{}]overlay={}:{}{}",
            current_layer, idx, element.position.x, element.position.y, output
          ));

          if idx < template.elements.len() - 1 {
            let layer_name = format!("[layer{idx}]");
            layer_names.push(layer_name.clone());
            current_layer = layer_name;
          }
        }
        StyleElementType::Shape => {
          // Создаем форму
          let shape_filter = self.build_shape_element_filter(element, idx)?;
          filters.push(shape_filter);

          // Применяем анимацию
          if !element.animations.is_empty() {
            let animated_filter = self.apply_element_animation(
              &format!("[shape{idx}]"),
              element,
              idx,
              template.duration,
            )?;
            filters.push(animated_filter);
          }

          // Накладываем на текущий слой
          let output = if idx == template.elements.len() - 1 {
            "[style_output]"
          } else {
            &format!("[layer{idx}]")
          };

          overlay_chain.push_str(&format!(
            ";{}[animated{}]overlay={}:{}{}",
            current_layer, idx, element.position.x, element.position.y, output
          ));

          if idx < template.elements.len() - 1 {
            let layer_name = format!("[layer{idx}]");
            layer_names.push(layer_name.clone());
            current_layer = layer_name;
          }
        }
        StyleElementType::Video => {
          // Используем входное видео
          let video_filter = format!(
            "[{}:v]scale={}:{},crop={}:{}[vid{}]",
            input_index,
            element.size.width,
            element.size.height,
            element.size.width,
            element.size.height,
            idx
          );
          filters.push(video_filter);

          // Применяем анимацию
          if !element.animations.is_empty() {
            let animated_filter = self.apply_element_animation(
              &format!("[vid{idx}]"),
              element,
              idx,
              template.duration,
            )?;
            filters.push(animated_filter);
          }

          // Накладываем на текущий слой
          let output = if idx == template.elements.len() - 1 {
            "[style_output]"
          } else {
            &format!("[layer{idx}]")
          };

          overlay_chain.push_str(&format!(
            ";{}[animated{}]overlay={}:{}{}",
            current_layer, idx, element.position.x, element.position.y, output
          ));

          if idx < template.elements.len() - 1 {
            let layer_name = format!("[layer{idx}]");
            layer_names.push(layer_name.clone());
            current_layer = layer_name;
          }
        }
        StyleElementType::Line => {
          // Создаем линию как прямоугольник
          let line_filter = format!(
            "color=c={}:s={}x{}[line{}]",
            element
              .style
              .as_ref()
              .and_then(|s| s.color.as_deref())
              .unwrap_or("#FFFFFF")
              .trim_start_matches('#'),
            element.size.width,
            element.size.height,
            idx
          );
          filters.push(line_filter);
        }
        StyleElementType::Icon => {
          // Создаем иконку как изображение или текст
          let icon_filter = format!(
            "drawtext=text='{}':fontsize={}:fontcolor={}:x=0:y=0[icon{}]",
            element.content,
            element
              .style
              .as_ref()
              .and_then(|s| s.font_size)
              .unwrap_or(24),
            element
              .style
              .as_ref()
              .and_then(|s| s.color.as_deref())
              .unwrap_or("#FFFFFF")
              .trim_start_matches('#'),
            idx
          );
          filters.push(icon_filter);
        }
        StyleElementType::Particles => {
          // Создаем эффект частиц как анимированные точки
          let particles_filter = format!(
            "color=c={}:s={}x{}[particles{}]",
            element
              .style
              .as_ref()
              .and_then(|s| s.background_color.as_deref())
              .unwrap_or("#000000")
              .trim_start_matches('#'),
            element.size.width,
            element.size.height,
            idx
          );
          filters.push(particles_filter);
        }
      }
    }

    if !overlay_chain.is_empty() {
      filters.push(overlay_chain);
    }

    // Применяем переходы шаблона
    if !template.transitions.is_empty() {
      let transition_filter = self.apply_template_transitions(template)?;
      filters.push(transition_filter);
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтр для текстового элемента
  fn build_text_element_filter(
    &self,
    element: &StyleTemplateElement,
    index: usize,
  ) -> Result<String> {
    let style = element
      .style
      .as_ref()
      .ok_or_else(|| VideoCompilerError::InvalidParameter("Missing element style".to_string()))?;

    Ok(format!(
      "drawtext=text='{}':fontfile='{}':fontsize={}:fontcolor={}:x=0:y=0[text{}]",
      element.content.replace("'", "\\'"),
      self.get_system_font(style.font_family.as_deref().unwrap_or("Arial")),
      style.font_size.unwrap_or(24),
      style
        .color
        .as_deref()
        .unwrap_or("#FFFFFF")
        .trim_start_matches('#'),
      index
    ))
  }

  /// Построить фильтр для элемента формы
  fn build_shape_element_filter(
    &self,
    element: &StyleTemplateElement,
    index: usize,
  ) -> Result<String> {
    let style = element
      .style
      .as_ref()
      .ok_or_else(|| VideoCompilerError::InvalidParameter("Missing element style".to_string()))?;

    let color = style
      .background_color
      .as_deref()
      .unwrap_or("#000000")
      .trim_start_matches('#');

    Ok(format!(
      "color=c={}:s={}x{}[shape{}]",
      color, element.size.width, element.size.height, index
    ))
  }

  /// Применить анимацию к элементу
  fn apply_element_animation(
    &self,
    input: &str,
    element: &StyleTemplateElement,
    index: usize,
    _template_duration: f64,
  ) -> Result<String> {
    let mut filter = String::new();

    for animation in &element.animations {
      match animation.animation_type {
        AnimationType::FadeIn => {
          filter.push_str(&format!(
            "{}fade=in:st={}:d={}[animated{}]",
            input, animation.delay, animation.duration, index
          ));
        }
        AnimationType::FadeOut => {
          filter.push_str(&format!(
            "{}fade=out:st={}:d={}[animated{}]",
            input, animation.delay, animation.duration, index
          ));
        }
        AnimationType::Slide => {
          let direction = animation
            .properties
            .get("direction")
            .and_then(|v| v.as_str())
            .unwrap_or("left");

          filter.push_str(&self.build_slide_animation(
            input,
            index,
            animation.delay,
            animation.duration,
            direction,
            true,
          )?);
        }
        AnimationType::Scale => {
          let from_scale = animation
            .properties
            .get("from")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
          let to_scale = animation
            .properties
            .get("to")
            .and_then(|v| v.as_f64())
            .unwrap_or(1.0);

          filter.push_str(&format!(
            "{}scale=w=iw*({} + ({} - {}) * (t - {}) / {}):h=ih*({} + ({} - {}) * (t - {}) / {})[animated{}]",
            input,
            from_scale, to_scale, from_scale, animation.delay, animation.duration,
            from_scale, to_scale, from_scale, animation.delay, animation.duration,
            index
          ));
        }
        AnimationType::Rotate => {
          // FFmpeg rotation animation
          let angle = animation
            .properties
            .get("angle")
            .and_then(|v| v.as_f64())
            .unwrap_or(360.0);
          filter.push_str(&format!(
            "{}rotate=a={}*t/{}:ow=iw:oh=ih[animated{}]",
            input, angle, animation.duration, index
          ));
        }
        AnimationType::Bounce => {
          // Bounce effect using sine wave
          filter.push_str(&format!(
            "{input}overlay=x=0:y=sin(t*10)*20[animated{index}]"
          ));
        }
        AnimationType::Shake => {
          // Shake effect
          filter.push_str(&format!("{input}crop=iw:ih:sin(t*50)*5:0[animated{index}]"));
        }
        AnimationType::Pulse => {
          // Pulse effect
          filter.push_str(&format!(
            "{}scale=w=iw*(1+0.1*sin(2*PI*t/{})):h=ih*(1+0.1*sin(2*PI*t/{}))[animated{}]",
            input, animation.duration, animation.duration, index
          ));
        }
        AnimationType::Flicker => {
          // Flicker effect
          filter.push_str(&format!(
            "{}fade=t=in:st={}:d=0.1:alpha=1,fade=t=out:st={}:d=0.1:alpha=1[animated{}]",
            input,
            animation.delay,
            animation.delay + 0.1,
            index
          ));
        }
        AnimationType::Typewriter => {
          // Typewriter effect - gradual reveal
          filter.push_str(&format!(
            "{}crop=iw*(t-{})/{}:ih:0:0[animated{}]",
            input, animation.delay, animation.duration, index
          ));
        }
        AnimationType::MotionPath => {
          // Motion path - simple linear motion for now
          let end_x = animation
            .properties
            .get("end_x")
            .and_then(|v| v.as_f64())
            .unwrap_or(100.0);
          let end_y = animation
            .properties
            .get("end_y")
            .and_then(|v| v.as_f64())
            .unwrap_or(100.0);
          filter.push_str(&format!(
            "{}overlay=x='{}*t/{}':y='{}*t/{}'[animated{}]",
            input, end_x, animation.duration, end_y, animation.duration, index
          ));
        }
        AnimationType::Morph => {
          // Morph effect - simple cross-fade for now
          filter.push_str(&format!(
            "{}fade=t=in:st={}:d={}[animated{}]",
            input, animation.delay, animation.duration, index
          ));
        }
        AnimationType::Parallax => {
          // Parallax effect
          let speed = animation
            .properties
            .get("speed")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.5);
          filter.push_str(&format!(
            "{}overlay=x='{}*t':y=0[animated{}]",
            input,
            speed * 10.0,
            index
          ));
        }
        AnimationType::Dissolve => {
          // Dissolve effect
          filter.push_str(&format!(
            "{}fade=t=out:st={}:d={}:alpha=1[animated{}]",
            input, animation.delay, animation.duration, index
          ));
        }
      }
    }

    if filter.is_empty() {
      // Если нет анимаций, просто переименовываем выход
      Ok(format!("{input}null[animated{index}]"))
    } else {
      Ok(filter)
    }
  }

  /// Построить анимацию слайда
  fn build_slide_animation(
    &self,
    input: &str,
    index: usize,
    start_time: f64,
    duration: f64,
    direction: &str,
    is_in: bool,
  ) -> Result<String> {
    let (x_expr, y_expr) = match (direction, is_in) {
      ("left", true) => (
        format!("-w + w * (t - {start_time}) / {duration}"),
        "0".to_string(),
      ),
      ("left", false) => (
        format!("0 - w * (t - {start_time}) / {duration}"),
        "0".to_string(),
      ),
      ("right", true) => (
        format!("W - W * (1 - (t - {start_time}) / {duration})"),
        "0".to_string(),
      ),
      ("right", false) => (
        format!("0 + W * (t - {start_time}) / {duration}"),
        "0".to_string(),
      ),
      ("top", true) => (
        "0".to_string(),
        format!("-h + h * (t - {start_time}) / {duration}"),
      ),
      ("top", false) => (
        "0".to_string(),
        format!("0 - h * (t - {start_time}) / {duration}"),
      ),
      ("bottom", true) => (
        "0".to_string(),
        format!("H - H * (1 - (t - {start_time}) / {duration})"),
      ),
      ("bottom", false) => (
        "0".to_string(),
        format!("0 + H * (t - {start_time}) / {duration}"),
      ),
      _ => ("0".to_string(), "0".to_string()),
    };

    Ok(format!(
      "{input}overlay=x='{x_expr}':y='{y_expr}'[animated{index}]"
    ))
  }

  /// Применить переходы шаблона
  fn apply_template_transitions(&self, _template: &StyleTemplate) -> Result<String> {
    // Здесь можно добавить логику для применения переходов между элементами
    // Пока возвращаем пустую строку
    Ok(String::new())
  }

  /// Получить системный шрифт
  fn get_system_font(&self, font_name: &str) -> String {
    // Здесь должна быть логика поиска системных шрифтов
    // Пока используем захардкоженные пути для macOS
    match font_name {
      "Arial" => "/System/Library/Fonts/Helvetica.ttc".to_string(),
      "Times New Roman" => "/System/Library/Fonts/Times.ttc".to_string(),
      "Courier New" => "/System/Library/Fonts/Courier.ttc".to_string(),
      _ => "/System/Library/Fonts/Helvetica.ttc".to_string(),
    }
  }

  /// Найти шаблон по ID
  fn find_template(&self, template_id: &str) -> Option<&Template> {
    self.project.templates.iter().find(|t| t.id == template_id)
  }

  /// Найти стильный шаблон по ID
  fn find_style_template(&self, template_id: &str) -> Option<&StyleTemplate> {
    self
      .project
      .style_templates
      .iter()
      .find(|t| t.id == template_id)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::tests::fixtures::*;

  #[test]
  fn test_template_builder_new() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_build_template_filter_not_found() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    let result = builder
      .build_template_filter("non_existent_template", 0, 0)
      .await;
    assert!(result.is_err());

    if let Err(VideoCompilerError::TemplateNotFound(id)) = result {
      assert_eq!(id, "non_existent_template");
    } else {
      panic!("Expected TemplateNotFound error");
    }
  }

  #[test]
  fn test_find_template() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Поиск несуществующего шаблона
    let found_template = builder.find_template("non_existent");
    assert!(found_template.is_none());
  }

  #[test]
  fn test_find_style_template() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Поиск несуществующего стильного шаблона
    let found_template = builder.find_style_template("non_existent");
    assert!(found_template.is_none());
  }

  #[test]
  fn test_get_system_font() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Тестируем получение системных шрифтов
    let arial_path = builder.get_system_font("Arial");
    assert!(arial_path.contains("Helvetica") || arial_path.contains("Arial"));

    let times_path = builder.get_system_font("Times New Roman");
    assert!(times_path.contains("Times") || times_path.contains("Helvetica"));

    let courier_path = builder.get_system_font("Courier New");
    assert!(courier_path.contains("Courier") || courier_path.contains("Helvetica"));

    // Неизвестный шрифт должен вернуть дефолтный
    let unknown_path = builder.get_system_font("Unknown Font");
    assert!(unknown_path.contains("Helvetica"));
  }

  #[tokio::test]
  async fn test_build_multi_camera_template_filter() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Создаем простой шаблон
    use crate::video_compiler::schema::templates::{Template, TemplateRegion, TemplateType};

    let template = Template {
      id: "test_template".to_string(),
      name: "Test Template".to_string(),
      template_type: TemplateType::Grid,
      screens: 1,
      cells: vec![],
      regions: vec![TemplateRegion {
        x: 0,
        y: 0,
        width: 960,
        height: 1080,
        padding: 0,
      }],
    };

    let result = builder
      .build_multi_camera_template_filter(&template, 0)
      .await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_build_style_template_filter() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Создаем простой стильный шаблон
    use crate::video_compiler::schema::templates::{
      StyleTemplate, StyleTemplateCategory, StyleTemplateStyle,
    };

    let style_template = StyleTemplate {
      id: "style_test".to_string(),
      name: "Style Test".to_string(),
      category: StyleTemplateCategory::Intro,
      style: StyleTemplateStyle::Modern,
      duration: 3.0,
      elements: vec![],
      background_color: "#000000".to_string(),
      transitions: vec![],
    };

    let result = builder
      .build_style_template_filter(&style_template, 0, 0)
      .await;
    assert!(result.is_ok());
  }

  #[test]
  fn test_template_builder_with_populated_project() {
    let mut project = create_minimal_project();

    // Добавляем шаблон в проект
    use crate::video_compiler::schema::templates::{Template, TemplateType};

    let template = Template {
      id: "existing_template".to_string(),
      name: "Existing Template".to_string(),
      template_type: TemplateType::Grid,
      screens: 1,
      cells: vec![],
      regions: vec![],
    };

    project.templates.push(template);

    let builder = TemplateBuilder::new(&project);
    let found = builder.find_template("existing_template");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Existing Template");
  }

  #[test]
  fn test_font_path_validation() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Проверяем что все возвращаемые пути к шрифтам валидны
    let fonts = vec!["Arial", "Times New Roman", "Courier New", "Unknown"];

    for font in fonts {
      let path = builder.get_system_font(font);
      assert!(!path.is_empty());
      assert!(path.starts_with("/") || path.contains("\\"));
      assert!(path.ends_with(".ttc") || path.ends_with(".ttf") || path.ends_with(".otf"));
    }
  }

  #[tokio::test]
  async fn test_template_filter_with_complex_project() {
    let project = create_complex_project();
    let builder = TemplateBuilder::new(&project);

    // Тестируем что builder работает с комплексным проектом
    let result = builder.build_template_filter("non_existent", 0, 0).await;
    assert!(result.is_err()); // Должен вернуть ошибку о ненайденном шаблоне
  }

  #[tokio::test]
  async fn test_build_multi_camera_template_with_padding() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::templates::{Template, TemplateRegion, TemplateType};

    let template = Template {
      id: "padded_template".to_string(),
      name: "Padded Template".to_string(),
      template_type: TemplateType::Grid,
      screens: 2,
      cells: vec![],
      regions: vec![
        TemplateRegion {
          x: 0,
          y: 0,
          width: 960,
          height: 540,
          padding: 10,
        },
        TemplateRegion {
          x: 960,
          y: 0,
          width: 960,
          height: 540,
          padding: 10,
        },
      ],
    };

    let result = builder
      .build_multi_camera_template_filter(&template, 0)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("pad="));
    assert!(filter.contains("overlay="));
  }

  #[tokio::test]
  async fn test_build_style_template_with_text_element() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementStyle, ElementTiming, StyleElementType, StyleTemplate, StyleTemplateCategory,
      StyleTemplateElement, StyleTemplateStyle,
    };

    let mut style_template = StyleTemplate {
      id: "text_template".to_string(),
      name: "Text Template".to_string(),
      category: StyleTemplateCategory::Title,
      style: StyleTemplateStyle::Modern,
      duration: 5.0,
      elements: vec![],
      background_color: "#FF0000".to_string(),
      transitions: vec![],
    };

    let text_element = StyleTemplateElement {
      id: "text1".to_string(),
      element_type: StyleElementType::Text,
      name: "Title".to_string(),
      position: Position2D { x: 100.0, y: 100.0 },
      size: Size2D {
        width: 200.0,
        height: 50.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 5.0,
        duration: 5.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: "Hello World".to_string(),
      style: Some(ElementStyle {
        font_family: Some("Arial".to_string()),
        font_size: Some(32),
        color: Some("#FFFFFF".to_string()),
        background_color: None,
      }),
    };

    style_template.elements.push(text_element);

    let result = builder
      .build_style_template_filter(&style_template, 0, 0)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("drawtext"));
    assert!(filter.contains("Hello World"));
  }

  #[test]
  fn test_build_text_element_filter() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementStyle, ElementTiming, StyleElementType, StyleTemplateElement,
    };

    let element = StyleTemplateElement {
      id: "text1".to_string(),
      element_type: StyleElementType::Text,
      name: "Test Text".to_string(),
      position: Position2D { x: 50.0, y: 50.0 },
      size: Size2D {
        width: 100.0,
        height: 30.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 3.0,
        duration: 3.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: "Test Content".to_string(),
      style: Some(ElementStyle {
        font_family: Some("Arial".to_string()),
        font_size: Some(24),
        color: Some("#FF0000".to_string()),
        background_color: None,
      }),
    };

    let result = builder.build_text_element_filter(&element, 0);
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("drawtext"));
    assert!(filter.contains("Test Content"));
    assert!(filter.contains("fontsize=24"));
    assert!(filter.contains("fontcolor=FF0000"));
  }

  #[test]
  fn test_build_shape_element_filter() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementStyle, ElementTiming, StyleElementType, StyleTemplateElement,
    };

    let element = StyleTemplateElement {
      id: "shape1".to_string(),
      element_type: StyleElementType::Shape,
      name: "Test Shape".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 200.0,
        height: 100.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 3.0,
        duration: 3.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: Some(ElementStyle {
        font_family: None,
        font_size: None,
        color: None,
        background_color: Some("#00FF00".to_string()),
      }),
    };

    let result = builder.build_shape_element_filter(&element, 0);
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("color=c=00FF00"));
    assert!(filter.contains("s=200x100"));
  }

  #[test]
  fn test_apply_element_animation_fade_in() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      AnimationDirection, AnimationEasing, AnimationType, ElementAnimation, ElementTiming,
      StyleElementType, StyleTemplateElement,
    };
    use std::collections::HashMap;

    let element = StyleTemplateElement {
      id: "elem1".to_string(),
      element_type: StyleElementType::Text,
      name: "Animated Element".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 100.0,
        height: 50.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 5.0,
        duration: 5.0,
      },
      properties: Default::default(),
      animations: vec![ElementAnimation {
        id: "anim1".to_string(),
        animation_type: AnimationType::FadeIn,
        duration: 1.0,
        delay: 0.5,
        easing: AnimationEasing::Linear,
        repeat: 1,
        direction: AnimationDirection::Normal,
        properties: HashMap::new(),
      }],
      content: String::new(),
      style: None,
    };

    let result = builder.apply_element_animation("[input]", &element, 0, 5.0);
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("fade=in"));
    assert!(filter.contains("st=0.5"));
    assert!(filter.contains("d=1"));
  }

  #[test]
  fn test_apply_element_animation_scale() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      AnimationDirection, AnimationEasing, AnimationType, ElementAnimation, ElementTiming,
      StyleElementType, StyleTemplateElement,
    };
    use std::collections::HashMap;

    let mut properties = HashMap::new();
    properties.insert("from".to_string(), serde_json::json!(0.5));
    properties.insert("to".to_string(), serde_json::json!(1.5));

    let element = StyleTemplateElement {
      id: "elem1".to_string(),
      element_type: StyleElementType::Shape,
      name: "Scaled Element".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 100.0,
        height: 100.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 5.0,
        duration: 5.0,
      },
      properties: Default::default(),
      animations: vec![ElementAnimation {
        id: "anim1".to_string(),
        animation_type: AnimationType::Scale,
        duration: 2.0,
        delay: 0.0,
        easing: AnimationEasing::EaseInOut,
        repeat: 1,
        direction: AnimationDirection::Normal,
        properties,
      }],
      content: String::new(),
      style: None,
    };

    let result = builder.apply_element_animation("[shape0]", &element, 0, 5.0);
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("scale="));
    assert!(filter.contains("0.5"));
    assert!(filter.contains("1.5"));
  }

  #[test]
  fn test_build_slide_animation() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    // Test slide from left
    let result = builder.build_slide_animation("[input]", 0, 0.0, 1.0, "left", true);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("overlay="));
    assert!(filter.contains("-w"));

    // Test slide to right
    let result = builder.build_slide_animation("[input]", 1, 0.0, 1.0, "right", false);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("overlay="));

    // Test slide from top
    let result = builder.build_slide_animation("[input]", 2, 0.0, 1.0, "top", true);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("overlay="));
    assert!(filter.contains("-h"));

    // Test slide to bottom
    let result = builder.build_slide_animation("[input]", 3, 0.0, 1.0, "bottom", false);
    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("overlay="));
  }

  #[tokio::test]
  async fn test_style_template_with_multiple_elements() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementStyle, ElementTiming, StyleElementType, StyleTemplate, StyleTemplateCategory,
      StyleTemplateElement, StyleTemplateStyle,
    };

    let mut style_template = StyleTemplate {
      id: "multi_element".to_string(),
      name: "Multi Element Template".to_string(),
      category: StyleTemplateCategory::Intro,
      style: StyleTemplateStyle::Corporate,
      duration: 5.0,
      elements: vec![],
      background_color: "#000000".to_string(),
      transitions: vec![],
    };

    // Add text element
    style_template.elements.push(StyleTemplateElement {
      id: "text1".to_string(),
      element_type: StyleElementType::Text,
      name: "Title".to_string(),
      position: Position2D { x: 50.0, y: 50.0 },
      size: Size2D {
        width: 300.0,
        height: 50.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 5.0,
        duration: 5.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: "Company Name".to_string(),
      style: Some(ElementStyle {
        font_family: Some("Arial".to_string()),
        font_size: Some(48),
        color: Some("#FFFFFF".to_string()),
        background_color: None,
      }),
    });

    // Add shape element
    style_template.elements.push(StyleTemplateElement {
      id: "shape1".to_string(),
      element_type: StyleElementType::Shape,
      name: "Background Box".to_string(),
      position: Position2D { x: 40.0, y: 40.0 },
      size: Size2D {
        width: 320.0,
        height: 70.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 5.0,
        duration: 5.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: Some(ElementStyle {
        font_family: None,
        font_size: None,
        color: None,
        background_color: Some("#FF0000".to_string()),
      }),
    });

    let result = builder
      .build_style_template_filter(&style_template, 0, 0)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("drawtext"));
    assert!(filter.contains("color=c=FF0000"));
    assert!(filter.contains("overlay"));
  }

  #[tokio::test]
  async fn test_style_template_with_all_element_types() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementStyle, ElementTiming, StyleElementType, StyleTemplate, StyleTemplateCategory,
      StyleTemplateElement, StyleTemplateStyle,
    };

    let mut style_template = StyleTemplate {
      id: "all_elements".to_string(),
      name: "All Elements Template".to_string(),
      category: StyleTemplateCategory::Overlay,
      style: StyleTemplateStyle::Creative,
      duration: 10.0,
      elements: vec![],
      background_color: "#FFFFFF".to_string(),
      transitions: vec![],
    };

    // Add Video element
    style_template.elements.push(StyleTemplateElement {
      id: "video1".to_string(),
      element_type: StyleElementType::Video,
      name: "Video Element".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 640.0,
        height: 360.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 10.0,
        duration: 10.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: None,
    });

    // Add Line element
    style_template.elements.push(StyleTemplateElement {
      id: "line1".to_string(),
      element_type: StyleElementType::Line,
      name: "Line Element".to_string(),
      position: Position2D { x: 100.0, y: 200.0 },
      size: Size2D {
        width: 200.0,
        height: 2.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 10.0,
        duration: 10.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: Some(ElementStyle {
        font_family: None,
        font_size: None,
        color: Some("#FF0000".to_string()),
        background_color: None,
      }),
    });

    // Add Icon element
    style_template.elements.push(StyleTemplateElement {
      id: "icon1".to_string(),
      element_type: StyleElementType::Icon,
      name: "Icon Element".to_string(),
      position: Position2D { x: 300.0, y: 300.0 },
      size: Size2D {
        width: 50.0,
        height: 50.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 10.0,
        duration: 10.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: "✓".to_string(),
      style: Some(ElementStyle {
        font_family: None,
        font_size: Some(32),
        color: Some("#00FF00".to_string()),
        background_color: None,
      }),
    });

    // Add Particles element
    style_template.elements.push(StyleTemplateElement {
      id: "particles1".to_string(),
      element_type: StyleElementType::Particles,
      name: "Particles Element".to_string(),
      position: Position2D { x: 400.0, y: 400.0 },
      size: Size2D {
        width: 100.0,
        height: 100.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 10.0,
        duration: 10.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: Some(ElementStyle {
        font_family: None,
        font_size: None,
        color: None,
        background_color: Some("#0000FF".to_string()),
      }),
    });

    let result = builder
      .build_style_template_filter(&style_template, 0, 0)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Check for various element types
    assert!(filter.contains("scale=")); // Video element
    assert!(filter.contains("color=c=FF0000")); // Line element
    assert!(filter.contains("drawtext")); // Icon element
  }

  #[test]
  fn test_apply_element_animation_all_types() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      AnimationDirection, AnimationEasing, AnimationType, ElementAnimation, ElementTiming,
      StyleElementType, StyleTemplateElement,
    };
    use std::collections::HashMap;

    let animation_types = vec![
      AnimationType::FadeOut,
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

    for anim_type in animation_types {
      let mut properties = HashMap::new();
      if anim_type == AnimationType::Rotate {
        properties.insert("angle".to_string(), serde_json::json!(180.0));
      }
      if anim_type == AnimationType::MotionPath {
        properties.insert("end_x".to_string(), serde_json::json!(200.0));
        properties.insert("end_y".to_string(), serde_json::json!(200.0));
      }
      if anim_type == AnimationType::Parallax {
        properties.insert("speed".to_string(), serde_json::json!(2.0));
      }

      let element = StyleTemplateElement {
        id: "elem1".to_string(),
        element_type: StyleElementType::Shape,
        name: "Animated Element".to_string(),
        position: Position2D { x: 0.0, y: 0.0 },
        size: Size2D {
          width: 100.0,
          height: 100.0,
        },
        timing: ElementTiming {
          in_time: 0.0,
          out_time: 5.0,
          duration: 5.0,
        },
        properties: Default::default(),
        animations: vec![ElementAnimation {
          id: "anim1".to_string(),
          animation_type: anim_type.clone(),
          duration: 1.0,
          delay: 0.0,
          easing: AnimationEasing::Linear,
          repeat: 1,
          direction: AnimationDirection::Normal,
          properties,
        }],
        content: String::new(),
        style: None,
      };

      let result = builder.apply_element_animation("[input]", &element, 0, 5.0);
      assert!(result.is_ok(), "Failed for animation type: {anim_type:?}");
    }
  }

  #[tokio::test]
  async fn test_template_with_cells() {
    let mut project = create_minimal_project();

    use crate::video_compiler::schema::common::{AlignX, AlignY, FitMode};
    use crate::video_compiler::schema::templates::{Template, TemplateCell, TemplateType};

    let mut template = Template {
      id: "cells_template".to_string(),
      name: "Cells Template".to_string(),
      template_type: TemplateType::Grid,
      screens: 4,
      cells: vec![],
      regions: vec![],
    };

    // Add cells for 2x2 grid
    for i in 0..4 {
      let row = i / 2;
      let col = i % 2;
      template.cells.push(TemplateCell {
        index: i,
        x: (col as f32) * 50.0,
        y: (row as f32) * 50.0,
        width: 50.0,
        height: 50.0,
        fit_mode: FitMode::Fill,
        align_x: AlignX::Center,
        align_y: AlignY::Center,
        scale: None,
      });
    }

    project.templates.push(template);

    let builder = TemplateBuilder::new(&project);
    let found = builder.find_template("cells_template");
    assert!(found.is_some());
    assert_eq!(found.unwrap().cells.len(), 4);
  }

  #[test]
  fn test_apply_element_animation_no_animations() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementTiming, StyleElementType, StyleTemplateElement,
    };

    let element = StyleTemplateElement {
      id: "elem1".to_string(),
      element_type: StyleElementType::Text,
      name: "Static Element".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 100.0,
        height: 50.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 5.0,
        duration: 5.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: None,
    };

    let result = builder.apply_element_animation("[text0]", &element, 0, 5.0);
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("null[animated0]"));
  }

  #[test]
  fn test_escape_text_in_content() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementStyle, ElementTiming, StyleElementType, StyleTemplateElement,
    };

    let element = StyleTemplateElement {
      id: "text1".to_string(),
      element_type: StyleElementType::Text,
      name: "Test Text".to_string(),
      position: Position2D { x: 50.0, y: 50.0 },
      size: Size2D {
        width: 100.0,
        height: 30.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 3.0,
        duration: 3.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: "Text with 'quotes' and special chars".to_string(),
      style: Some(ElementStyle {
        font_family: Some("Arial".to_string()),
        font_size: Some(24),
        color: Some("#FFFFFF".to_string()),
        background_color: None,
      }),
    };

    let result = builder.build_text_element_filter(&element, 0);
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(filter.contains("Text with \\'quotes\\' and special chars"));
  }

  #[test]
  fn test_build_text_element_filter_missing_style() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementTiming, StyleElementType, StyleTemplateElement,
    };

    let element = StyleTemplateElement {
      id: "text1".to_string(),
      element_type: StyleElementType::Text,
      name: "Test Text".to_string(),
      position: Position2D { x: 50.0, y: 50.0 },
      size: Size2D {
        width: 100.0,
        height: 30.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 3.0,
        duration: 3.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: "Test Content".to_string(),
      style: None, // Missing style
    };

    let result = builder.build_text_element_filter(&element, 0);
    assert!(result.is_err());
  }

  #[test]
  fn test_build_shape_element_filter_missing_style() {
    let project = create_minimal_project();
    let builder = TemplateBuilder::new(&project);

    use crate::video_compiler::schema::common::{Position2D, Size2D};
    use crate::video_compiler::schema::templates::{
      ElementTiming, StyleElementType, StyleTemplateElement,
    };

    let element = StyleTemplateElement {
      id: "shape1".to_string(),
      element_type: StyleElementType::Shape,
      name: "Test Shape".to_string(),
      position: Position2D { x: 0.0, y: 0.0 },
      size: Size2D {
        width: 200.0,
        height: 100.0,
      },
      timing: ElementTiming {
        in_time: 0.0,
        out_time: 3.0,
        duration: 3.0,
      },
      properties: Default::default(),
      animations: vec![],
      content: String::new(),
      style: None, // Missing style
    };

    let result = builder.build_shape_element_filter(&element, 0);
    assert!(result.is_err());
  }
}

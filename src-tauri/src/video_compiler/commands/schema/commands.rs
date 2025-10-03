//! Tauri команды для работы со схемой

use super::{business_logic, types::*};
use crate::video_compiler::{
  error::Result,
  schema::{timeline::Clip, Effect, Filter, StyleTemplate, Subtitle, Template},
};
use std::collections::HashMap;

/// Добавить клип в трек
#[tauri::command]
pub async fn add_clip_to_track(
  track_id: String,
  clip: Clip,
  mut project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  business_logic::add_clip_to_track_by_id(&mut project_schema, &track_id, clip)?;
  Ok(project_schema)
}

/// Создать клип
#[tauri::command]
pub async fn create_clip(source_path: String, start_time: f64, end_time: f64) -> Result<Clip> {
  let params = ClipCreationParams {
    source_path,
    start_time,
    end_time,
    speed: None,
    opacity: None,
  };

  Ok(business_logic::create_clip_with_params(&params))
}

/// Создать клип с параметрами
#[tauri::command]
pub async fn create_clip_with_params(params: ClipCreationParams) -> Result<Clip> {
  Ok(business_logic::create_clip_with_params(&params))
}

/// Создать эффект
#[tauri::command]
pub async fn create_effect(
  effect_type: String,
  parameters: HashMap<String, serde_json::Value>,
) -> Result<Effect> {
  let params = EffectCreationParams {
    effect_type,
    name: None,
    parameters,
    enabled: None,
  };

  Ok(business_logic::create_effect_with_params(&params))
}

/// Создать эффект с параметрами
#[tauri::command]
pub async fn create_effect_with_params(params: EffectCreationParams) -> Result<Effect> {
  Ok(business_logic::create_effect_with_params(&params))
}

/// Создать фильтр
#[tauri::command]
pub async fn create_filter(
  filter_type: String,
  parameters: HashMap<String, serde_json::Value>,
) -> Result<Filter> {
  let params = FilterCreationParams {
    filter_type,
    name: None,
    parameters,
    intensity: None,
    enabled: None,
  };

  Ok(business_logic::create_filter_with_params(&params))
}

/// Создать фильтр с параметрами
#[tauri::command]
pub async fn create_filter_with_params(params: FilterCreationParams) -> Result<Filter> {
  Ok(business_logic::create_filter_with_params(&params))
}

/// Создать стилевой шаблон
#[tauri::command]
pub async fn create_style_template(
  name: String,
  category: String,
  properties: HashMap<String, serde_json::Value>,
) -> Result<StyleTemplate> {
  let params = StyleTemplateCreationParams {
    name,
    category,
    style: properties
      .get("style")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string()),
    duration: properties.get("duration").and_then(|v| v.as_f64()),
    background_color: properties
      .get("background_color")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string()),
  };

  Ok(business_logic::create_style_template_with_params(&params))
}

/// Создать стилевой шаблон с параметрами
#[tauri::command]
pub async fn create_style_template_with_params(
  params: StyleTemplateCreationParams,
) -> Result<StyleTemplate> {
  Ok(business_logic::create_style_template_with_params(&params))
}

/// Создать субтитр
#[tauri::command]
pub async fn create_subtitle(
  text: String,
  start_time: f64,
  end_time: f64,
  style: Option<HashMap<String, serde_json::Value>>,
) -> Result<Subtitle> {
  let params = SubtitleCreationParams {
    text,
    start_time,
    end_time,
    font_family: style
      .as_ref()
      .and_then(|s| s.get("font_family"))
      .and_then(|v| v.as_str())
      .map(|s| s.to_string()),
    font_size: style
      .as_ref()
      .and_then(|s| s.get("font_size"))
      .and_then(|v| v.as_f64()),
    color: style
      .as_ref()
      .and_then(|s| s.get("color"))
      .and_then(|v| v.as_str())
      .map(|s| s.to_string()),
    style,
  };

  Ok(business_logic::create_subtitle_with_params(&params))
}

/// Создать субтитр с параметрами
#[tauri::command]
pub async fn create_subtitle_with_params(params: SubtitleCreationParams) -> Result<Subtitle> {
  Ok(business_logic::create_subtitle_with_params(&params))
}

/// Создать анимацию субтитров
#[tauri::command]
pub async fn create_subtitle_animation(
  subtitle_id: String,
  animation_type: String,
  duration: f64,
  mut project: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  let params = SubtitleAnimationParams {
    animation_type,
    duration,
    delay: None,
    easing: None,
    direction: None,
    properties: None,
  };

  let animation = business_logic::create_subtitle_animation_with_params(&params);
  business_logic::add_animation_to_subtitle(&mut project, &subtitle_id, animation)?;

  Ok(project)
}

/// Создать анимацию субтитров с параметрами
#[tauri::command]
pub async fn create_subtitle_animation_with_params(
  params: SubtitleAnimationParams,
) -> Result<crate::video_compiler::schema::subtitles::SubtitleAnimation> {
  Ok(business_logic::create_subtitle_animation_with_params(
    &params,
  ))
}

/// Создать новую анимацию субтитров (использование SubtitleAnimation::new)
#[tauri::command]
pub async fn create_subtitle_animation_new(
  animation_type: String,
  duration: f64,
  delay: Option<f64>,
  easing: Option<String>,
) -> Result<crate::video_compiler::schema::subtitles::SubtitleAnimation> {
  let params = SubtitleAnimationParams {
    animation_type,
    duration,
    delay,
    easing,
    direction: None,
    properties: None,
  };

  Ok(business_logic::create_subtitle_animation_with_params(
    &params,
  ))
}

/// Создать новый стилевой шаблон (использование StyleTemplate::new)  
#[tauri::command]
pub async fn create_style_template_new(
  name: String,
  category: String,
  style: Option<String>,
  duration: Option<f64>,
) -> Result<crate::video_compiler::schema::templates::StyleTemplate> {
  let params = StyleTemplateCreationParams {
    name,
    category,
    style,
    duration,
    background_color: None,
  };

  Ok(business_logic::create_style_template_with_params(&params))
}

/// Создать шаблон
#[tauri::command]
pub async fn create_template(
  name: String,
  layout_type: String,
  properties: HashMap<String, serde_json::Value>,
) -> Result<Template> {
  let params = TemplateCreationParams {
    name,
    template_type: layout_type,
    screens: properties
      .get("screens")
      .and_then(|v| v.as_u64())
      .unwrap_or(2) as usize,
    width: properties
      .get("width")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32),
    height: properties
      .get("height")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32),
  };

  Ok(business_logic::create_template_with_params(&params))
}

/// Создать шаблон с параметрами
#[tauri::command]
pub async fn create_template_with_params(params: TemplateCreationParams) -> Result<Template> {
  Ok(business_logic::create_template_with_params(&params))
}

/// Создать трек
#[tauri::command]
pub async fn create_track(
  name: String,
  track_type: String,
  mut project: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  let params = TrackCreationParams {
    name,
    track_type,
    enabled: None,
    volume: None,
    muted: None,
  };

  let track = business_logic::create_track_with_params(&params);
  project.tracks.push(track);

  Ok(project)
}

/// Создать трек с параметрами
#[tauri::command]
pub async fn create_track_with_params(
  params: TrackCreationParams,
  mut project: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  let track = business_logic::create_track_with_params(&params);
  project.tracks.push(track);

  Ok(project)
}

/// Создать объекты схемы (множественное создание)
#[tauri::command]
pub async fn create_schema_objects(
  object_type: String,
  count: usize,
  base_properties: HashMap<String, serde_json::Value>,
) -> Result<Vec<serde_json::Value>> {
  let mut objects = Vec::new();

  for i in 0..count {
    let mut props = base_properties.clone();
    props.insert("index".to_string(), serde_json::json!(i));

    let obj = match object_type.as_str() {
      "clip" => {
        let params = ClipCreationParams {
          source_path: props
            .get("source_path")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
          start_time: props
            .get("start_time")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
          end_time: props
            .get("end_time")
            .and_then(|v| v.as_f64())
            .unwrap_or(10.0),
          speed: None,
          opacity: None,
        };
        let clip = business_logic::create_clip_with_params(&params);
        serde_json::to_value(clip).unwrap()
      }
      "effect" => {
        let params = EffectCreationParams {
          effect_type: props
            .get("effect_type")
            .and_then(|v| v.as_str())
            .unwrap_or("blur")
            .to_string(),
          name: None,
          parameters: HashMap::new(),
          enabled: None,
        };
        let effect = business_logic::create_effect_with_params(&params);
        serde_json::to_value(effect).unwrap()
      }
      "filter" => {
        let params = FilterCreationParams {
          filter_type: props
            .get("filter_type")
            .and_then(|v| v.as_str())
            .unwrap_or("brightness")
            .to_string(),
          name: None,
          parameters: HashMap::new(),
          intensity: None,
          enabled: None,
        };
        let filter = business_logic::create_filter_with_params(&params);
        serde_json::to_value(filter).unwrap()
      }
      "resolution" => {
        serde_json::json!({
            "width": props.get("width").and_then(|v| v.as_u64()).unwrap_or(1920),
            "height": props.get("height").and_then(|v| v.as_u64()).unwrap_or(1080),
            "index": i
        })
      }
      _ => serde_json::json!({}),
    };

    objects.push(obj);
  }

  Ok(objects)
}

/// Создать разрешение с заданными параметрами (использование Resolution::new)
#[tauri::command]
pub async fn create_resolution(
  width: u32,
  height: u32,
) -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;
  Ok(Resolution::new(width, height))
}

/// Получить стандартное HD разрешение (использование Resolution::hd)
#[tauri::command]
pub async fn get_hd_resolution() -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;
  Ok(Resolution::hd())
}

/// Получить стандартное 4K разрешение (использование Resolution::uhd_4k)
#[tauri::command]
pub async fn get_uhd_4k_resolution() -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;
  Ok(Resolution::uhd_4k())
}

/// Получить список предустановленных разрешений
#[tauri::command]
pub async fn get_preset_resolutions() -> Result<Vec<serde_json::Value>> {
  Ok(business_logic::get_preset_resolutions())
}

/// Создать разрешение для определенного формата
#[tauri::command]
pub async fn create_resolution_for_format(
  format: String,
) -> Result<crate::video_compiler::schema::common::Resolution> {
  Ok(business_logic::create_resolution_for_format(&format))
}

/// Получить статистику элементов схемы
#[tauri::command]
pub async fn get_schema_element_stats(
  project: crate::video_compiler::schema::ProjectSchema,
) -> Result<SchemaElementStats> {
  Ok(business_logic::get_schema_element_stats(&project))
}

/// Валидировать схему проекта (структуру элементов)
#[tauri::command]
pub async fn validate_schema_structure(
  project: crate::video_compiler::schema::ProjectSchema,
) -> Result<SchemaValidationInfo> {
  Ok(business_logic::validate_project_schema(&project))
}

/// Добавить эффект к клипу
#[tauri::command]
pub async fn add_effect_to_clip(
  clip_id: String,
  effect_id: String,
  mut project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  business_logic::add_effect_to_clip(&mut project_schema, &clip_id, &effect_id)?;
  Ok(project_schema)
}

/// Добавить фильтр к клипу
#[tauri::command]
pub async fn add_filter_to_clip(
  clip_id: String,
  filter_id: String,
  mut project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  business_logic::add_filter_to_clip(&mut project_schema, &clip_id, &filter_id)?;
  Ok(project_schema)
}

/// Удалить эффект из клипа
#[tauri::command]
pub async fn remove_effect_from_clip(
  clip_id: String,
  effect_id: String,
  mut project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  business_logic::remove_effect_from_clip(&mut project_schema, &clip_id, &effect_id)?;
  Ok(project_schema)
}

/// Удалить фильтр из клипа
#[tauri::command]
pub async fn remove_filter_from_clip(
  clip_id: String,
  filter_id: String,
  mut project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  business_logic::remove_filter_from_clip(&mut project_schema, &clip_id, &filter_id)?;
  Ok(project_schema)
}

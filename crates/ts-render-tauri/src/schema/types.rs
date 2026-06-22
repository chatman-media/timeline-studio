//! Типы для команд работы со схемой

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Параметры для создания клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipCreationParams {
  pub source_path: String,
  pub start_time: f64,
  pub end_time: f64,
  pub speed: Option<f64>,
  pub opacity: Option<f64>,
}

/// Параметры для создания эффекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EffectCreationParams {
  pub effect_type: String,
  pub name: Option<String>,
  pub parameters: HashMap<String, serde_json::Value>,
  pub enabled: Option<bool>,
}

/// Параметры для создания фильтра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterCreationParams {
  pub filter_type: String,
  pub name: Option<String>,
  pub parameters: HashMap<String, serde_json::Value>,
  pub intensity: Option<f64>,
  pub enabled: Option<bool>,
}

/// Параметры для создания стилевого шаблона
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleTemplateCreationParams {
  pub name: String,
  pub category: String,
  pub style: Option<String>,
  pub duration: Option<f64>,
  pub background_color: Option<String>,
}

/// Параметры для создания субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleCreationParams {
  pub text: String,
  pub start_time: f64,
  pub end_time: f64,
  pub font_family: Option<String>,
  pub font_size: Option<f64>,
  pub color: Option<String>,
  pub style: Option<HashMap<String, serde_json::Value>>,
}

/// Параметры для создания анимации субтитров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleAnimationParams {
  pub animation_type: String,
  pub duration: f64,
  pub delay: Option<f64>,
  pub easing: Option<String>,
  pub direction: Option<String>,
  pub properties: Option<HashMap<String, serde_json::Value>>,
}

/// Параметры для создания трека
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackCreationParams {
  pub track_type: String,
  pub name: String,
  pub enabled: Option<bool>,
  pub volume: Option<f64>,
  pub muted: Option<bool>,
}

/// Параметры для создания шаблона
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateCreationParams {
  pub template_type: String,
  pub name: String,
  pub screens: usize,
  pub width: Option<u32>,
  pub height: Option<u32>,
}

/// Результат создания элемента схемы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaElementResult {
  pub id: String,
  pub element_type: String,
  pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Параметры для обновления элемента схемы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaElementUpdate {
  pub element_id: String,
  pub updates: HashMap<String, serde_json::Value>,
}

/// Параметры для поиска элементов схемы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaSearchParams {
  pub element_type: Option<String>,
  pub name_pattern: Option<String>,
  pub tags: Option<Vec<String>>,
  pub enabled_only: Option<bool>,
}

/// Информация о валидации схемы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaValidationInfo {
  pub is_valid: bool,
  pub errors: Vec<String>,
  pub warnings: Vec<String>,
  pub element_count: usize,
}

/// Статистика элементов схемы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaElementStats {
  pub clips: usize,
  pub effects: usize,
  pub filters: usize,
  pub subtitles: usize,
  pub tracks: usize,
  pub templates: usize,
  pub style_templates: usize,
}

/// Типы элементов схемы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SchemaElementType {
  Clip,
  Effect,
  Filter,
  Subtitle,
  Track,
  Template,
  StyleTemplate,
  Transition,
}

impl SchemaElementType {
  pub fn from_string(s: &str) -> Option<Self> {
    match s.to_lowercase().as_str() {
      "clip" => Some(Self::Clip),
      "effect" => Some(Self::Effect),
      "filter" => Some(Self::Filter),
      "subtitle" => Some(Self::Subtitle),
      "track" => Some(Self::Track),
      "template" => Some(Self::Template),
      "style_template" => Some(Self::StyleTemplate),
      "transition" => Some(Self::Transition),
      _ => None,
    }
  }

  pub fn to_string(&self) -> &'static str {
    match self {
      Self::Clip => "clip",
      Self::Effect => "effect",
      Self::Filter => "filter",
      Self::Subtitle => "subtitle",
      Self::Track => "track",
      Self::Template => "template",
      Self::StyleTemplate => "style_template",
      Self::Transition => "transition",
    }
  }
}

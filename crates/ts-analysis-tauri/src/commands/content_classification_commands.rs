//! Tauri commands для Content Classification

use tauri::command;
use uuid::Uuid;

use crate::services::content_classification_engine::ContentClassificationEngine;
use crate::services::real_analysis_engine::MediaFile;
use crate::types::content_classification::{
  ContentClassificationOptions, ExtendedContentClassification,
};

/// Классифицировать контент видео
#[command]
#[specta::specta]
pub async fn classify_video_content(
  project_id: String,
  file: MediaFile,
  options: Option<ContentClassificationOptions>,
) -> Result<ExtendedContentClassification, String> {
  let project_uuid = Uuid::parse_str(&project_id).map_err(|e| e.to_string())?;

  // Создаем engine для классификации
  let engine = ContentClassificationEngine::new(None); // TODO: передать AI API key

  // Выполняем классификацию
  let options = options.unwrap_or_default();
  let result = engine
    .classify_content(&project_uuid, &file, options)
    .await
    .map_err(|e| format!("Classification failed: {}", e))?;

  Ok(result)
}

/// Получить опции классификации по умолчанию
#[command]
#[specta::specta]
pub async fn get_default_classification_options() -> Result<ContentClassificationOptions, String> {
  Ok(ContentClassificationOptions::default())
}

/// Быстрая классификация (только базовые характеристики)
#[command]
#[specta::specta]
pub async fn quick_classify_content(
  project_id: String,
  file: MediaFile,
) -> Result<ExtendedContentClassification, String> {
  let options = ContentClassificationOptions {
    include_subcategories: false,
    analyze_mood: false,
    include_targeting: false,
    analyze_platforms: false,
    include_marketing: false,
    analyze_accessibility: false,
  };

  classify_video_content(project_id, file, Some(options)).await
}

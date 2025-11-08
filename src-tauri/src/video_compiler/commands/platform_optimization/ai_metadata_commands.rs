//! AI Metadata Generation Commands
//!
//! Tauri команды для генерации AI-powered метаданных для платформ

use crate::analysis::types::unified_types::UnifiedAnalysisResult;
use crate::video_compiler::commands::ai_api_proxy::AIProvider;

use super::ai_metadata_generator::AIMetadataGenerator;
use super::ai_metadata_types::*;
use super::types::PlatformType;

/// Generate metadata for a single platform
#[tauri::command]
#[specta::specta]
pub async fn generate_platform_metadata(
  api_key: String,
  provider: AIProvider,
  model: String,
  analysis: UnifiedAnalysisResult,
  config: MetadataGenerationConfig,
) -> Result<PlatformMetadata, String> {
  let generator = AIMetadataGenerator::new();

  generator
    .generate_metadata(&api_key, provider, &model, &analysis, config)
    .await
    .map_err(|e| e.to_string())
}

/// Generate metadata for multiple platforms
#[tauri::command]
#[specta::specta]
pub async fn generate_multi_platform_metadata(
  api_key: String,
  provider: AIProvider,
  model: String,
  analysis: UnifiedAnalysisResult,
  platforms: Vec<PlatformType>,
  config: MetadataGenerationConfig,
) -> Result<MultiPlatformMetadata, String> {
  let generator = AIMetadataGenerator::new();

  generator
    .generate_multi_platform_metadata(&api_key, provider, &model, &analysis, platforms, config)
    .await
    .map_err(|e| e.to_string())
}

/// Validate metadata against platform constraints
#[tauri::command]
#[specta::specta]
pub fn validate_platform_metadata(
  metadata: PlatformMetadata,
) -> Result<MetadataValidationResult, String> {
  let generator = AIMetadataGenerator::new();
  Ok(generator.validate_metadata(&metadata))
}

/// Get platform constraints
#[tauri::command]
#[specta::specta]
pub fn get_platform_constraints(platform: PlatformType) -> Result<PlatformConstraints, String> {
  Ok(PlatformConstraints::for_platform(&platform))
}

/// Get default metadata generation config
#[tauri::command]
#[specta::specta]
pub fn get_default_metadata_config() -> Result<MetadataGenerationConfig, String> {
  Ok(MetadataGenerationConfig::default())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_default_config() {
    let config = get_default_metadata_config().unwrap();
    assert_eq!(config.language, "en");
  }

  #[test]
  fn test_get_platform_constraints() {
    let youtube = get_platform_constraints(PlatformType::YouTube).unwrap();
    assert_eq!(youtube.max_title_length, 100);

    let instagram = get_platform_constraints(PlatformType::Instagram).unwrap();
    assert_eq!(instagram.max_hashtags, 30);
  }
}

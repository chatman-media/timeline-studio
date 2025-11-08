//! Script Generation Commands
//!
//! Tauri команды для генерации скриптов с использованием AI

use crate::analysis::services::{
  Dialogue, GeneratedScript, ScriptGenerationConfig, ScriptGenerator, Voiceover, VoiceoverStyle,
};
use crate::analysis::types::unified_types::UnifiedAnalysisResult;

/// Generate script from video analysis
#[tauri::command]
#[specta::specta]
pub async fn generate_video_script(
  api_key: String,
  analysis: UnifiedAnalysisResult,
  config: ScriptGenerationConfig,
) -> Result<GeneratedScript, String> {
  let generator = ScriptGenerator::new();

  generator
    .generate_script(&api_key, &analysis, config)
    .await
    .map_err(|e| e.to_string())
}

/// Generate dialogue for existing script
#[tauri::command]
#[specta::specta]
pub async fn generate_script_dialogue(
  api_key: String,
  script: GeneratedScript,
  config: ScriptGenerationConfig,
) -> Result<Vec<Dialogue>, String> {
  let generator = ScriptGenerator::new();

  generator
    .generate_dialogue(&api_key, &script, &config)
    .await
    .map_err(|e| e.to_string())
}

/// Generate voiceover for script
#[tauri::command]
#[specta::specta]
pub async fn generate_script_voiceover(
  api_key: String,
  script: GeneratedScript,
  style: VoiceoverStyle,
  config: ScriptGenerationConfig,
) -> Result<Vec<Voiceover>, String> {
  let generator = ScriptGenerator::new();

  generator
    .generate_voiceover(&api_key, &script, style, &config)
    .await
    .map_err(|e| e.to_string())
}

/// Get default script generation config
#[tauri::command]
#[specta::specta]
pub fn get_default_script_config() -> Result<ScriptGenerationConfig, String> {
  Ok(ScriptGenerationConfig::default())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_default_config() {
    let config = get_default_script_config().unwrap();
    assert!(config.include_dialogue);
  }
}

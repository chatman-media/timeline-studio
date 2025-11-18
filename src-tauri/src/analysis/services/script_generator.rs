//! Script Generator Service
//!
//! Генерирует сценарии для видео контента используя AI провайдеры.
//! Интегрируется с AI Director и analysis engines для создания
//! качественных скриптов на основе анализа видео.

use crate::analysis::types::unified_types::UnifiedAnalysisResult;
use crate::video_compiler::commands::ai_api_proxy::{
  AIMessage, AIProvider, AIProviderManager, UnifiedAIRequest, UnifiedAIResponse,
};
use anyhow::Result;
use log::info;
use serde::{Deserialize, Serialize};
use specta::Type;

// ============================================================================
// TYPES
// ============================================================================

/// Generated Script
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedScript {
  /// Script ID
  pub id: String,

  /// Media file ID
  pub file_id: String,

  /// Script title
  pub title: String,

  /// Script genre
  pub genre: ScriptGenre,

  /// Script scenes
  pub scenes: Vec<ScriptScene>,

  /// Dialogue entries
  pub dialogue: Vec<Dialogue>,

  /// Voiceover entries
  pub voiceover: Vec<Voiceover>,

  /// Script metadata
  pub metadata: ScriptMetadata,

  /// Generation timestamp
  pub generated_at: chrono::DateTime<chrono::Utc>,
}

/// Script Genre
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ScriptGenre {
  Vlog,
  Tutorial,
  Documentary,
  Review,
  Interview,
  Promotional,
  Educational,
  Entertainment,
  News,
  Sports,
  Music,
  Gaming,
  Other,
}

/// Script Scene
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScriptScene {
  pub scene_number: u32,
  pub title: String,
  pub start_time: f64,
  pub end_time: f64,
  pub description: String,
  pub scene_type: String,
  pub visual_notes: Vec<String>,
  pub audio_notes: Vec<String>,
  pub actions: Vec<String>,
}

/// Dialogue Entry
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Dialogue {
  pub id: String,
  pub scene_number: u32,
  pub timestamp: f64,
  pub speaker: String,
  pub text: String,
  pub emotion: Option<String>,
  pub notes: Option<String>,
}

/// Voiceover Entry
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Voiceover {
  pub id: String,
  pub scene_number: u32,
  pub start_time: f64,
  pub end_time: f64,
  pub text: String,
  pub style: VoiceoverStyle,
  pub notes: Option<String>,
}

/// Voiceover Style
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VoiceoverStyle {
  Narrative,
  Descriptive,
  Promotional,
  Instructional,
  Emotional,
  Neutral,
}

/// Script Metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScriptMetadata {
  pub duration: f64,
  pub word_count: u32,
  pub reading_time: f64,
  pub ai_provider: String,
  pub model: String,
  pub processing_time: f64,
  pub quality_score: f64,
}

/// Script Generation Config
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScriptGenerationConfig {
  /// AI Provider to use
  pub provider: AIProvider,

  /// Model name
  pub model: String,

  /// Script genre
  pub genre: ScriptGenre,

  /// Target duration (seconds)
  pub target_duration: Option<f64>,

  /// Include dialogue
  pub include_dialogue: bool,

  /// Include voiceover
  pub include_voiceover: bool,

  /// Voiceover style
  pub voiceover_style: VoiceoverStyle,

  /// Temperature for AI generation
  pub temperature: f64,

  /// Max tokens
  pub max_tokens: u32,
}

impl Default for ScriptGenerationConfig {
  fn default() -> Self {
    Self {
      provider: AIProvider::Claude,
      model: "claude-3-5-sonnet-20241022".to_string(),
      genre: ScriptGenre::Documentary,
      target_duration: None,
      include_dialogue: true,
      include_voiceover: true,
      voiceover_style: VoiceoverStyle::Narrative,
      temperature: 0.7,
      max_tokens: 4096,
    }
  }
}

// ============================================================================
// SCRIPT GENERATOR SERVICE
// ============================================================================

/// Script Generator Service
pub struct ScriptGenerator {
  ai_manager: AIProviderManager,
}

impl ScriptGenerator {
  /// Create new Script Generator
  pub fn new() -> Self {
    Self {
      ai_manager: AIProviderManager::new(),
    }
  }

  /// Generate script from video analysis
  pub async fn generate_script(
    &self,
    api_key: &str,
    analysis: &UnifiedAnalysisResult,
    config: ScriptGenerationConfig,
  ) -> Result<GeneratedScript> {
    info!(
      "Generating {:?} script for file: {}",
      config.genre, analysis.media_file.filename
    );

    let start_time = std::time::Instant::now();

    // Build AI prompt from analysis
    let prompt = self.build_script_prompt(analysis, &config);

    // Send request to AI provider
    let request = UnifiedAIRequest {
      provider: config.provider.clone(),
      model: config.model.clone(),
      messages: vec![AIMessage::text("user", prompt)],
      max_tokens: Some(config.max_tokens),
      temperature: Some(config.temperature),
      stream: Some(false),
      system: Some(self.get_system_prompt(&config.genre)),
      tools: None,
      tool_choice: None,
    };

    let response = self
      .ai_manager
      .send_request(api_key, request)
      .await
      .map_err(|e| anyhow::anyhow!("AI request failed: {}", e))?;

    // Parse AI response into script
    let script = self.parse_script_response(
      &response,
      analysis,
      &config,
      start_time.elapsed().as_secs_f64(),
    )?;

    info!("Script generated successfully: {}", script.id);
    Ok(script)
  }

  /// Generate dialogue for existing script
  pub async fn generate_dialogue(
    &self,
    api_key: &str,
    script: &GeneratedScript,
    config: &ScriptGenerationConfig,
  ) -> Result<Vec<Dialogue>> {
    info!("Generating dialogue for script: {}", script.id);

    let prompt = self.build_dialogue_prompt(script);

    let request = UnifiedAIRequest {
      provider: config.provider.clone(),
      model: config.model.clone(),
      messages: vec![AIMessage::text("user", prompt)],
      max_tokens: Some(2048),
      temperature: Some(0.8),
      stream: Some(false),
      system: Some("You are a professional dialogue writer.".to_string()),
      tools: None,
      tool_choice: None,
    };

    let response = self
      .ai_manager
      .send_request(api_key, request)
      .await
      .map_err(|e| anyhow::anyhow!("AI request failed: {}", e))?;

    self.parse_dialogue_response(&response, script)
  }

  /// Generate voiceover for script
  pub async fn generate_voiceover(
    &self,
    api_key: &str,
    script: &GeneratedScript,
    style: VoiceoverStyle,
    config: &ScriptGenerationConfig,
  ) -> Result<Vec<Voiceover>> {
    info!("Generating {:?} voiceover for script: {}", style, script.id);

    let prompt = self.build_voiceover_prompt(script, &style);

    let request = UnifiedAIRequest {
      provider: config.provider.clone(),
      model: config.model.clone(),
      messages: vec![AIMessage::text("user", prompt)],
      max_tokens: Some(2048),
      temperature: Some(0.7),
      stream: Some(false),
      system: Some("You are a professional voiceover writer.".to_string()),
      tools: None,
      tool_choice: None,
    };

    let response = self
      .ai_manager
      .send_request(api_key, request)
      .await
      .map_err(|e| anyhow::anyhow!("AI request failed: {}", e))?;

    self.parse_voiceover_response(&response, script, style)
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /// Build script generation prompt from analysis
  fn build_script_prompt(
    &self,
    analysis: &UnifiedAnalysisResult,
    config: &ScriptGenerationConfig,
  ) -> String {
    let mut prompt = format!(
      "Generate a {} script for a video titled '{}'.\n\n",
      format!("{:?}", config.genre).to_lowercase(),
      analysis.media_file.filename
    );

    // Add video metadata
    if let Some(duration) = analysis.media_file.duration {
      prompt.push_str(&format!("Video Duration: {:.2} seconds\n", duration));
    }

    // Add scene analysis
    if !analysis.scenes.is_empty() {
      prompt.push_str(&format!("\nDetected {} scenes:\n", analysis.scenes.len()));
      for (i, scene) in analysis.scenes.iter().enumerate().take(5) {
        prompt.push_str(&format!(
          "{}. {:.2}s-{:.2}s: {:?}",
          i + 1,
          scene.start_time,
          scene.end_time,
          scene.scene_type
        ));
        if let Some(desc) = &scene.description {
          prompt.push_str(&format!(" - {}", desc));
        }
        prompt.push('\n');
      }
    }

    // Add key moments
    if !analysis.moments.is_empty() {
      prompt.push_str(&format!("\nKey moments ({}):\n", analysis.moments.len()));
      for (i, moment) in analysis.moments.iter().enumerate().take(5) {
        prompt.push_str(&format!(
          "{}. {:.2}s: {} (importance: {:.2})\n",
          i + 1,
          moment.timestamp,
          moment.description,
          moment.importance_score
        ));
      }
    }

    // Add generation instructions
    prompt.push_str("\nGenerate a structured script with:\n");
    prompt.push_str("1. Scene-by-scene breakdown\n");
    prompt.push_str("2. Visual and audio notes for each scene\n");
    prompt.push_str("3. Suggested actions and transitions\n");

    if config.include_dialogue {
      prompt.push_str("4. Natural dialogue that fits the content\n");
    }

    if config.include_voiceover {
      prompt.push_str(&format!(
        "5. {} voiceover narration\n",
        format!("{:?}", config.voiceover_style).to_lowercase()
      ));
    }

    if let Some(target_duration) = config.target_duration {
      prompt.push_str(&format!(
        "\nTarget duration: {:.0} seconds\n",
        target_duration
      ));
    }

    prompt
  }

  /// Get system prompt for genre
  fn get_system_prompt(&self, genre: &ScriptGenre) -> String {
    match genre {
      ScriptGenre::Vlog => {
        "You are a creative vlog scriptwriter. Write engaging, personal scripts with natural flow."
          .to_string()
      }
      ScriptGenre::Tutorial => {
        "You are an educational tutorial scriptwriter. Write clear, step-by-step instructional scripts."
          .to_string()
      }
      ScriptGenre::Documentary => {
        "You are a documentary scriptwriter. Write informative, narrative-driven scripts with depth."
          .to_string()
      }
      ScriptGenre::Review => {
        "You are a product review scriptwriter. Write analytical, balanced review scripts."
          .to_string()
      }
      _ => "You are a professional scriptwriter.".to_string(),
    }
  }

  /// Parse AI response into script structure
  fn parse_script_response(
    &self,
    response: &UnifiedAIResponse,
    analysis: &UnifiedAnalysisResult,
    config: &ScriptGenerationConfig,
    processing_time: f64,
  ) -> Result<GeneratedScript> {
    // Extract scenes from analysis
    let scenes = self.create_scenes_from_analysis(analysis);

    // Calculate metadata
    let word_count = response.content.split_whitespace().count() as u32;
    let reading_time = word_count as f64 / 150.0; // ~150 words per minute

    Ok(GeneratedScript {
      id: uuid::Uuid::new_v4().to_string(),
      file_id: analysis.media_file.id.clone(),
      title: analysis.media_file.filename.clone(),
      genre: config.genre.clone(),
      scenes,
      dialogue: vec![],  // Will be filled by separate generation
      voiceover: vec![], // Will be filled by separate generation
      metadata: ScriptMetadata {
        duration: analysis.media_file.duration.unwrap_or(0.0),
        word_count,
        reading_time,
        ai_provider: format!("{:?}", response.provider),
        model: response.model.clone(),
        processing_time,
        quality_score: 85.0, // TODO: Implement quality scoring
      },
      generated_at: chrono::Utc::now(),
    })
  }

  /// Create script scenes from analysis
  fn create_scenes_from_analysis(&self, analysis: &UnifiedAnalysisResult) -> Vec<ScriptScene> {
    let mut scenes = vec![];

    for (i, scene) in analysis.scenes.iter().enumerate() {
      scenes.push(ScriptScene {
        scene_number: (i + 1) as u32,
        title: format!("Scene {}", i + 1),
        start_time: scene.start_time,
        end_time: scene.end_time,
        description: scene
          .description
          .clone()
          .unwrap_or_else(|| format!("{:?} scene", scene.scene_type)),
        scene_type: format!("{:?}", scene.scene_type),
        visual_notes: vec![],
        audio_notes: vec![],
        actions: vec![],
      });
    }

    scenes
  }

  /// Build dialogue generation prompt
  fn build_dialogue_prompt(&self, script: &GeneratedScript) -> String {
    format!(
      "Generate natural dialogue for a {} script with {} scenes. Make it engaging and authentic.",
      format!("{:?}", script.genre).to_lowercase(),
      script.scenes.len()
    )
  }

  /// Build voiceover generation prompt
  fn build_voiceover_prompt(&self, script: &GeneratedScript, style: &VoiceoverStyle) -> String {
    format!(
      "Generate {} voiceover narration for a {} script. Write compelling narration that enhances the visual content.",
      format!("{:?}", style).to_lowercase(),
      format!("{:?}", script.genre).to_lowercase()
    )
  }

  /// Parse dialogue response
  fn parse_dialogue_response(
    &self,
    _response: &UnifiedAIResponse,
    _script: &GeneratedScript,
  ) -> Result<Vec<Dialogue>> {
    // TODO: Parse structured dialogue from AI response
    // For now, return empty vec
    Ok(vec![])
  }

  /// Parse voiceover response
  fn parse_voiceover_response(
    &self,
    _response: &UnifiedAIResponse,
    _script: &GeneratedScript,
    _style: VoiceoverStyle,
  ) -> Result<Vec<Voiceover>> {
    // TODO: Parse structured voiceover from AI response
    // For now, return empty vec
    Ok(vec![])
  }
}

impl Default for ScriptGenerator {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_script_generator_creation() {
    let _generator = ScriptGenerator::new();
    // Just verify it can be created
  }

  #[test]
  fn test_default_config() {
    let config = ScriptGenerationConfig::default();
    assert_eq!(config.provider, AIProvider::Claude);
    assert_eq!(config.genre, ScriptGenre::Documentary);
    assert!(config.include_dialogue);
    assert!(config.include_voiceover);
  }

  #[test]
  fn test_script_genre_serialization() {
    let genre = ScriptGenre::Vlog;
    let json = serde_json::to_string(&genre).unwrap();
    assert_eq!(json, "\"vlog\"");
  }
}

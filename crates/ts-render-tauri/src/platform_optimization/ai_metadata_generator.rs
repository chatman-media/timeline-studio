//! AI Metadata Generator Service
//!
//! Генерирует метаданные для видео контента используя AI провайдеры.
//! Оптимизирует метаданные под требования различных платформ.

use anyhow::Result;
use log::info;

use super::ai_metadata_types::*;
use super::types::PlatformType;
use ts_analysis::analysis::types::unified_types::UnifiedAnalysisResult;
use crate::ai_api_proxy::{
  AIMessage, AIProvider, AIProviderManager, UnifiedAIRequest, UnifiedAIResponse,
};

// ============================================================================
// AI METADATA GENERATOR SERVICE
// ============================================================================

/// AI Metadata Generator
pub struct AIMetadataGenerator {
  ai_manager: AIProviderManager,
}

impl AIMetadataGenerator {
  /// Create new AI Metadata Generator
  pub fn new() -> Self {
    Self {
      ai_manager: AIProviderManager::new(),
    }
  }

  /// Generate metadata for a single platform
  pub async fn generate_metadata(
    &self,
    api_key: &str,
    provider: AIProvider,
    model: &str,
    analysis: &UnifiedAnalysisResult,
    config: MetadataGenerationConfig,
  ) -> Result<PlatformMetadata> {
    info!(
      "Generating {:?} metadata for platform: {:?}",
      config.tone, config.platform
    );

    let start_time = std::time::Instant::now();

    // Get platform constraints
    let constraints = PlatformConstraints::for_platform(&config.platform);

    // Build AI prompt
    let prompt = self.build_metadata_prompt(analysis, &config, &constraints);

    // Send request to AI provider
    let request = UnifiedAIRequest {
      provider,
      model: model.to_string(),
      messages: vec![AIMessage::text("user", prompt)],
      max_tokens: Some(2048),
      temperature: Some(0.7),
      stream: Some(false),
      system: Some(self.get_system_prompt(&config)),
      tools: None,
      tool_choice: None,
    };

    let response = self
      .ai_manager
      .send_request(api_key, request)
      .await
      .map_err(|e| anyhow::anyhow!("AI request failed: {}", e))?;

    // Parse response into metadata
    let metadata = self.parse_metadata_response(&response, &config, &constraints)?;

    let processing_time = start_time.elapsed().as_secs_f64();
    info!("Metadata generated in {:.2}s", processing_time);

    Ok(metadata)
  }

  /// Generate metadata for multiple platforms
  pub async fn generate_multi_platform_metadata(
    &self,
    api_key: &str,
    provider: AIProvider,
    model: &str,
    analysis: &UnifiedAnalysisResult,
    platforms: Vec<PlatformType>,
    base_config: MetadataGenerationConfig,
  ) -> Result<MultiPlatformMetadata> {
    info!("Generating metadata for {} platforms", platforms.len());

    let start_time = std::time::Instant::now();
    let mut platform_metadata = Vec::new();

    for platform in platforms {
      let mut config = base_config.clone();
      config.platform = platform.clone();

      match self
        .generate_metadata(api_key, provider.clone(), model, analysis, config)
        .await
      {
        Ok(metadata) => platform_metadata.push(metadata),
        Err(e) => {
          log::warn!("Failed to generate metadata for {:?}: {}", platform, e);
        }
      }
    }

    let processing_time = start_time.elapsed().as_secs_f64();

    Ok(MultiPlatformMetadata {
      source_id: analysis.media_file.id.clone(),
      platforms: platform_metadata,
      ai_provider: format!("{:?}", provider),
      ai_model: model.to_string(),
      processing_time,
      generated_at: chrono::Utc::now(),
    })
  }

  /// Validate metadata against platform constraints
  pub fn validate_metadata(&self, metadata: &PlatformMetadata) -> MetadataValidationResult {
    let constraints = PlatformConstraints::for_platform(&metadata.platform);
    let mut warnings = Vec::new();
    let mut errors = Vec::new();
    let mut suggestions = Vec::new();

    // Validate title length
    if metadata.title.len() > constraints.max_title_length as usize {
      errors.push(format!(
        "Title exceeds max length: {} > {}",
        metadata.title.len(),
        constraints.max_title_length
      ));
      suggestions.push(format!(
        "Shorten title to {} characters",
        constraints.max_title_length
      ));
    } else if metadata.title.len() > (constraints.max_title_length - 10) as usize {
      warnings.push("Title is close to maximum length".to_string());
    }

    // Validate description length
    if metadata.description.len() > constraints.max_description_length as usize {
      errors.push(format!(
        "Description exceeds max length: {} > {}",
        metadata.description.len(),
        constraints.max_description_length
      ));
      suggestions.push(format!(
        "Shorten description to {} characters",
        constraints.max_description_length
      ));
    }

    // Validate hashtags
    if !constraints.supports_hashtags && !metadata.hashtags.is_empty() {
      warnings.push(format!(
        "{:?} doesn't officially support hashtags",
        metadata.platform
      ));
    }

    if metadata.hashtags.len() > constraints.max_hashtags as usize {
      errors.push(format!(
        "Too many hashtags: {} > {}",
        metadata.hashtags.len(),
        constraints.max_hashtags
      ));
      suggestions.push(format!("Reduce to {} hashtags", constraints.max_hashtags));
    }

    // Platform-specific validation
    match metadata.platform {
      PlatformType::YouTube => {
        if metadata.seo_keywords.is_empty() {
          warnings.push("No SEO keywords provided for YouTube".to_string());
          suggestions.push("Add SEO keywords to improve discoverability".to_string());
        }
      }
      PlatformType::Instagram | PlatformType::TikTok => {
        if metadata.hashtags.len() < 3 {
          warnings.push("Consider adding more hashtags for better reach".to_string());
        }
      }
      PlatformType::Twitter => {
        let total_length =
          metadata.description.len() + metadata.hashtags.iter().map(|h| h.len() + 2).sum::<usize>();
        if total_length > 280 {
          errors.push(format!(
            "Total tweet length exceeds 280 characters: {}",
            total_length
          ));
        }
      }
      _ => {}
    }

    MetadataValidationResult {
      valid: errors.is_empty(),
      warnings,
      errors,
      suggestions,
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /// Build metadata generation prompt
  fn build_metadata_prompt(
    &self,
    analysis: &UnifiedAnalysisResult,
    config: &MetadataGenerationConfig,
    constraints: &PlatformConstraints,
  ) -> String {
    let mut prompt = format!(
      "Generate optimized metadata for a {:?} video on {:?}.\n\n",
      config.tone, config.platform
    );

    // Add video information
    prompt.push_str(&format!("Video: {}\n", analysis.media_file.filename));

    if let Some(duration) = analysis.media_file.duration {
      prompt.push_str(&format!("Duration: {:.1}s\n", duration));
    }

    // Add analysis insights
    if !analysis.scenes.is_empty() {
      prompt.push_str(&format!("\nScenes detected: {}\n", analysis.scenes.len()));

      // Add scene summaries
      for (i, scene) in analysis.scenes.iter().enumerate().take(3) {
        if let Some(desc) = &scene.description {
          prompt.push_str(&format!("- Scene {}: {}\n", i + 1, desc));
        }
      }
    }

    if !analysis.moments.is_empty() {
      prompt.push_str(&format!("\nKey moments: {}\n", analysis.moments.len()));

      for (_i, moment) in analysis.moments.iter().enumerate().take(3) {
        prompt.push_str(&format!(
          "- {:.1}s: {} (score: {:.2})\n",
          moment.timestamp, moment.description, moment.importance_score
        ));
      }
    }

    // Add topics if provided
    if !config.topics.is_empty() {
      prompt.push_str(&format!("\nTopics: {}\n", config.topics.join(", ")));
    }

    // Add target audience
    if let Some(audience) = &config.target_audience {
      prompt.push_str(&format!("\nTarget audience: {}\n", audience));
    }

    // Add custom instructions
    if let Some(custom) = &config.custom_instructions {
      prompt.push_str(&format!("\nAdditional instructions: {}\n", custom));
    }

    // Add platform constraints
    prompt.push_str("\n## Platform Requirements:\n");

    if constraints.max_title_length > 0 {
      prompt.push_str(&format!(
        "- Title: max {} characters\n",
        constraints.max_title_length
      ));
    }

    prompt.push_str(&format!(
      "- Description: max {} characters\n",
      constraints.max_description_length
    ));

    if constraints.supports_hashtags {
      prompt.push_str(&format!(
        "- Hashtags: {} (style: {})\n",
        constraints.max_hashtags,
        constraints.hashtag_style.as_deref().unwrap_or("moderate")
      ));
    }

    if constraints.supports_seo {
      prompt.push_str("- Include SEO keywords\n");
    }

    // Add output format instructions
    prompt.push_str("\n## Output Format (JSON):\n");
    prompt.push_str("{\n");

    if constraints.max_title_length > 0 {
      prompt.push_str("  \"title\": \"engaging title here\",\n");
    }

    prompt.push_str("  \"description\": \"compelling description here\",\n");

    if constraints.max_tags > 0 {
      prompt.push_str("  \"tags\": [\"tag1\", \"tag2\", ...],\n");
    }

    if constraints.supports_hashtags {
      prompt.push_str("  \"hashtags\": [\"hashtag1\", \"hashtag2\", ...],\n");
    }

    if constraints.supports_seo {
      prompt.push_str("  \"seo_keywords\": [\"keyword1\", \"keyword2\", ...],\n");
    }

    prompt.push_str("  \"category\": \"category name\"\n");
    prompt.push_str("}\n");

    if config.include_cta {
      prompt.push_str("\nInclude a compelling call-to-action in the description.\n");
    }

    prompt
  }

  /// Get system prompt for metadata generation
  fn get_system_prompt(&self, config: &MetadataGenerationConfig) -> String {
    let tone_desc = match config.tone {
      ContentTone::Casual => "casual and friendly",
      ContentTone::Professional => "professional and polished",
      ContentTone::Educational => "educational and informative",
      ContentTone::Entertaining => "entertaining and engaging",
      ContentTone::Inspirational => "inspirational and motivating",
      ContentTone::Promotional => "promotional and persuasive",
    };

    format!(
      "You are an expert social media content strategist specializing in {:?}. \
       Generate {} metadata that maximizes engagement and discoverability. \
       Focus on SEO optimization, trending keywords, and platform-specific best practices. \
       Return ONLY valid JSON with no additional text or explanations.",
      config.platform, tone_desc
    )
  }

  /// Parse AI response into metadata structure
  fn parse_metadata_response(
    &self,
    response: &UnifiedAIResponse,
    config: &MetadataGenerationConfig,
    constraints: &PlatformConstraints,
  ) -> Result<PlatformMetadata> {
    // Try to extract JSON from response
    let json_str = self.extract_json(&response.content)?;

    // Parse JSON
    let parsed: serde_json::Value = serde_json::from_str(&json_str)
      .map_err(|e| anyhow::anyhow!("Failed to parse JSON: {}", e))?;

    // Extract fields with fallbacks
    let title = if constraints.max_title_length > 0 {
      parsed
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled Video")
        .to_string()
    } else {
      String::new()
    };

    let description = parsed
      .get("description")
      .and_then(|v| v.as_str())
      .unwrap_or("")
      .to_string();

    let tags = parsed
      .get("tags")
      .and_then(|v| v.as_array())
      .map(|arr| {
        arr
          .iter()
          .filter_map(|v| v.as_str().map(String::from))
          .collect()
      })
      .unwrap_or_default();

    let hashtags = parsed
      .get("hashtags")
      .and_then(|v| v.as_array())
      .map(|arr| {
        arr
          .iter()
          .filter_map(|v| v.as_str().map(String::from))
          .collect()
      })
      .unwrap_or_default();

    let seo_keywords = parsed
      .get("seo_keywords")
      .and_then(|v| v.as_array())
      .map(|arr| {
        arr
          .iter()
          .filter_map(|v| v.as_str().map(String::from))
          .collect()
      })
      .unwrap_or_default();

    let category = parsed
      .get("category")
      .and_then(|v| v.as_str())
      .map(String::from);

    let call_to_action = parsed
      .get("call_to_action")
      .and_then(|v| v.as_str())
      .map(String::from);

    Ok(PlatformMetadata {
      platform: config.platform.clone(),
      title,
      description,
      tags,
      hashtags,
      seo_keywords,
      category,
      target_audience: config.target_audience.clone(),
      call_to_action,
      generated_at: chrono::Utc::now(),
    })
  }

  /// Extract JSON from AI response (handles markdown code blocks)
  fn extract_json(&self, content: &str) -> Result<String> {
    let trimmed = content.trim();

    // Check if wrapped in markdown code block
    if trimmed.starts_with("```json") {
      let without_start = trimmed.strip_prefix("```json").unwrap().trim();
      let json = without_start
        .strip_suffix("```")
        .unwrap_or(without_start)
        .trim();
      return Ok(json.to_string());
    }

    if trimmed.starts_with("```") {
      let without_start = trimmed.strip_prefix("```").unwrap().trim();
      let json = without_start
        .strip_suffix("```")
        .unwrap_or(without_start)
        .trim();
      return Ok(json.to_string());
    }

    // Try to find JSON object in text
    if let Some(start) = trimmed.find('{') {
      if let Some(end) = trimmed.rfind('}') {
        return Ok(trimmed[start..=end].to_string());
      }
    }

    Ok(trimmed.to_string())
  }
}

impl Default for AIMetadataGenerator {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_metadata_generator_creation() {
    let _generator = AIMetadataGenerator::new();
    // Verify it can be created
  }

  #[test]
  fn test_extract_json() {
    let generator = AIMetadataGenerator::new();

    // Test plain JSON
    let plain = r#"{"title": "test"}"#;
    let extracted = generator.extract_json(plain).unwrap();
    assert_eq!(extracted, plain);

    // Test markdown wrapped
    let wrapped = r#"```json
{"title": "test"}
```"#;
    let extracted = generator.extract_json(wrapped).unwrap();
    assert!(extracted.contains("title"));
  }

  #[test]
  fn test_validation() {
    let generator = AIMetadataGenerator::new();

    let metadata = PlatformMetadata {
      platform: PlatformType::YouTube,
      title: "Test Video".to_string(),
      description: "A test description".to_string(),
      tags: vec!["test".to_string()],
      hashtags: vec!["#test".to_string()],
      seo_keywords: vec!["test".to_string()],
      category: Some("Education".to_string()),
      target_audience: None,
      call_to_action: None,
      generated_at: chrono::Utc::now(),
    };

    let result = generator.validate_metadata(&metadata);
    assert!(result.valid);
  }
}

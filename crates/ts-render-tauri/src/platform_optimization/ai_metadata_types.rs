//! AI Metadata Types
//!
//! Типы для AI-генерируемых метаданных для различных платформ

use serde::{Deserialize, Serialize};
use specta::Type;

use super::types::PlatformType;

// ============================================================================
// CORE TYPES
// ============================================================================

/// AI-Generated Platform Metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PlatformMetadata {
  /// Platform type
  pub platform: PlatformType,

  /// Video title
  pub title: String,

  /// Video description
  pub description: String,

  /// Tags for the platform
  pub tags: Vec<String>,

  /// Hashtags (for platforms that support them)
  pub hashtags: Vec<String>,

  /// SEO keywords
  pub seo_keywords: Vec<String>,

  /// Category/Genre
  pub category: Option<String>,

  /// Target audience
  pub target_audience: Option<String>,

  /// Call-to-action text
  pub call_to_action: Option<String>,

  /// Generation timestamp
  pub generated_at: chrono::DateTime<chrono::Utc>,
}

/// Platform Metadata Configuration
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MetadataGenerationConfig {
  /// Platform to generate metadata for
  pub platform: PlatformType,

  /// Target language (ISO 639-1 code)
  pub language: String,

  /// Content tone (casual, professional, educational, etc.)
  pub tone: ContentTone,

  /// Target audience description
  pub target_audience: Option<String>,

  /// Key topics/themes
  pub topics: Vec<String>,

  /// Include call-to-action
  pub include_cta: bool,

  /// Custom instructions for AI
  pub custom_instructions: Option<String>,
}

impl Default for MetadataGenerationConfig {
  fn default() -> Self {
    Self {
      platform: PlatformType::YouTube,
      language: "en".to_string(),
      tone: ContentTone::Professional,
      target_audience: None,
      topics: vec![],
      include_cta: true,
      custom_instructions: None,
    }
  }
}

/// Content Tone
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ContentTone {
  Casual,
  Professional,
  Educational,
  Entertaining,
  Inspirational,
  Promotional,
}

/// Platform-Specific Constraints
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PlatformConstraints {
  pub platform: PlatformType,

  /// Maximum title length
  pub max_title_length: u32,

  /// Maximum description length
  pub max_description_length: u32,

  /// Maximum number of tags
  pub max_tags: u32,

  /// Maximum number of hashtags
  pub max_hashtags: u32,

  /// Supports hashtags
  pub supports_hashtags: bool,

  /// Supports SEO keywords
  pub supports_seo: bool,

  /// Recommended hashtag style
  pub hashtag_style: Option<String>,
}

impl PlatformConstraints {
  /// Get constraints for YouTube
  pub fn youtube() -> Self {
    Self {
      platform: PlatformType::YouTube,
      max_title_length: 100,
      max_description_length: 5000,
      max_tags: 500, // character limit total
      max_hashtags: 15,
      supports_hashtags: true,
      supports_seo: true,
      hashtag_style: Some("moderate".to_string()),
    }
  }

  /// Get constraints for Instagram
  pub fn instagram() -> Self {
    Self {
      platform: PlatformType::Instagram,
      max_title_length: 0, // No separate title
      max_description_length: 2200,
      max_tags: 0,
      max_hashtags: 30,
      supports_hashtags: true,
      supports_seo: false,
      hashtag_style: Some("heavy".to_string()),
    }
  }

  /// Get constraints for TikTok
  pub fn tiktok() -> Self {
    Self {
      platform: PlatformType::TikTok,
      max_title_length: 0, // No separate title
      max_description_length: 2200,
      max_tags: 0,
      max_hashtags: 20,
      supports_hashtags: true,
      supports_seo: false,
      hashtag_style: Some("trending".to_string()),
    }
  }

  /// Get constraints for Facebook
  pub fn facebook() -> Self {
    Self {
      platform: PlatformType::Facebook,
      max_title_length: 0, // No separate title
      max_description_length: 63206,
      max_tags: 0,
      max_hashtags: 10,
      supports_hashtags: true,
      supports_seo: false,
      hashtag_style: Some("light".to_string()),
    }
  }

  /// Get constraints for Twitter
  pub fn twitter() -> Self {
    Self {
      platform: PlatformType::Twitter,
      max_title_length: 0, // No separate title
      max_description_length: 280,
      max_tags: 0,
      max_hashtags: 5,
      supports_hashtags: true,
      supports_seo: false,
      hashtag_style: Some("light".to_string()),
    }
  }

  /// Get constraints for a platform
  pub fn for_platform(platform: &PlatformType) -> Self {
    match platform {
      PlatformType::YouTube => Self::youtube(),
      PlatformType::Instagram => Self::instagram(),
      PlatformType::TikTok => Self::tiktok(),
      PlatformType::Facebook => Self::facebook(),
      PlatformType::Twitter => Self::twitter(),
      PlatformType::Custom => Self::youtube(), // Default to YouTube
    }
  }
}

/// Metadata Validation Result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MetadataValidationResult {
  pub valid: bool,
  pub warnings: Vec<String>,
  pub errors: Vec<String>,
  pub suggestions: Vec<String>,
}

/// Multi-Platform Metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MultiPlatformMetadata {
  /// Source video ID or path
  pub source_id: String,

  /// Metadata for each platform
  pub platforms: Vec<PlatformMetadata>,

  /// AI provider used
  pub ai_provider: String,

  /// AI model used
  pub ai_model: String,

  /// Generation time
  pub processing_time: f64,

  /// Generated at
  pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_platform_constraints() {
    let youtube = PlatformConstraints::youtube();
    assert_eq!(youtube.max_title_length, 100);
    assert!(youtube.supports_seo);

    let instagram = PlatformConstraints::instagram();
    assert_eq!(instagram.max_hashtags, 30);
    assert!(!instagram.supports_seo);

    let tiktok = PlatformConstraints::tiktok();
    assert_eq!(tiktok.max_description_length, 2200);
    assert!(tiktok.supports_hashtags);
  }

  #[test]
  fn test_default_config() {
    let config = MetadataGenerationConfig::default();
    assert_eq!(config.language, "en");
    assert_eq!(config.tone, ContentTone::Professional);
    assert!(config.include_cta);
  }
}

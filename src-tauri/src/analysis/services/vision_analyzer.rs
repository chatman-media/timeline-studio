use crate::video_compiler::commands::ai_api_proxy::provider_manager::AIProviderManager;
use crate::video_compiler::commands::ai_api_proxy::types::{
  AIMessage, AIProvider, UnifiedAIRequest,
};
use crate::video_compiler::error::{Result, VideoCompilerError};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use log::{debug, info};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

/// Progress event for VLM analysis
#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct VLMProgressEvent {
  /// Current step (0-based index)
  pub current: u32,

  /// Total number of steps
  pub total: u32,

  /// Progress percentage (0-100)
  pub percentage: u32,

  /// Current status message
  pub status: String,

  /// Current frame timestamp (if applicable)
  pub timestamp: Option<f64>,
}

impl VLMProgressEvent {
  /// Create a new progress event
  pub fn new(current: u32, total: u32, status: String, timestamp: Option<f64>) -> Self {
    let percentage = if total > 0 {
      ((current as f64 / total as f64) * 100.0) as u32
    } else {
      0
    };

    Self {
      current,
      total,
      percentage,
      status,
      timestamp,
    }
  }
}

/// Vision Analysis Configuration
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct VisionAnalysisConfig {
  /// AI provider to use for vision analysis
  pub provider: AIProvider,

  /// Model name (e.g., "moondream2", "llava", "llama3.2-vision")
  pub model: String,

  /// Number of frames to extract and analyze
  pub num_frames: u32,

  /// Temperature for AI generation (0.0-1.0)
  pub temperature: f64,

  /// Max tokens for response
  pub max_tokens: u32,

  /// Maximum number of frames to process simultaneously (default: 1 for streaming)
  /// Higher values use more memory but may be faster with parallel processing
  pub max_batch_size: u32,
}

impl Default for VisionAnalysisConfig {
  fn default() -> Self {
    Self {
      provider: AIProvider::Ollama,
      model: "moondream2".to_string(),
      num_frames: 5,
      temperature: 0.7,
      max_tokens: 1024,
      max_batch_size: 1, // Stream by default (process one frame at a time)
    }
  }
}

/// Result of analyzing a single frame
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct FrameAnalysis {
  /// Frame timestamp in seconds
  pub timestamp: f64,

  /// AI-generated description of the frame
  pub description: String,

  /// Detected objects/entities
  pub detected_objects: Vec<String>,

  /// Scene type (e.g., "indoor", "outdoor", "close-up")
  pub scene_type: Option<String>,

  /// Estimated mood/emotion
  pub mood: Option<String>,
}

/// Complete video vision language model analysis result
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct VLMAnalysisResult {
  /// Analysis of individual frames
  pub frames: Vec<FrameAnalysis>,

  /// Overall video summary
  pub overall_summary: String,

  /// Detected themes/topics
  pub themes: Vec<String>,

  /// Processing time in milliseconds
  pub processing_time_ms: u32,
}

/// Service for analyzing video frames using vision language models
pub struct VisionAnalyzer {
  ai_manager: Arc<AIProviderManager>,
}

impl VisionAnalyzer {
  /// Create new VisionAnalyzer
  pub fn new(ai_manager: Arc<AIProviderManager>) -> Self {
    Self { ai_manager }
  }

  /// Analyze video using vision language model
  ///
  /// Extracts key frames, sends them to vision model, and returns analysis results
  /// Uses streaming approach to minimize memory usage
  ///
  /// # Arguments
  /// * `video_path` - Path to the video file
  /// * `api_key` - API key for the AI provider
  /// * `config` - Vision analysis configuration
  /// * `app_handle` - Optional Tauri app handle for progress events (None for testing)
  pub async fn analyze_video(
    &self,
    video_path: &PathBuf,
    api_key: &str,
    config: VisionAnalysisConfig,
    app_handle: Option<&AppHandle>,
  ) -> Result<VLMAnalysisResult> {
    let start_time = std::time::Instant::now();

    info!(
      "Starting vision analysis of {:?} with {} frames (batch size: {})",
      video_path, config.num_frames, config.max_batch_size
    );

    // Emit initial progress event
    if let Some(handle) = app_handle {
      let _ = handle.emit(
        "vlm-progress",
        VLMProgressEvent::new(0, config.num_frames + 1, "Initializing analysis...".to_string(), None),
      );
    }

    // Get video duration first
    let duration = self.get_video_duration(video_path)?;
    info!("Video duration: {:.2}s", duration);

    // Calculate timestamps for even distribution
    let timestamps = self.calculate_frame_timestamps(duration, config.num_frames);

    // Process frames in batches to limit memory usage
    let mut frame_analyses = Vec::with_capacity(config.num_frames as usize);
    let batch_size = config.max_batch_size.max(1) as usize;

    for chunk in timestamps.chunks(batch_size) {
      let chunk_start = std::time::Instant::now();

      // Extract and analyze frames in this batch
      for &timestamp in chunk {
        let current_frame = frame_analyses.len() as u32 + 1;

        // Emit progress event for frame extraction
        if let Some(handle) = app_handle {
          let _ = handle.emit(
            "vlm-progress",
            VLMProgressEvent::new(
              current_frame,
              config.num_frames + 1,
              format!("Extracting frame at {:.1}s...", timestamp),
              Some(timestamp),
            ),
          );
        }

        // Extract single frame
        let base64_image = self.extract_single_frame(video_path, timestamp)?;

        debug!(
          "Frame at {:.2}s: base64 size = {} bytes",
          timestamp,
          base64_image.len()
        );

        // Emit progress event for frame analysis
        if let Some(handle) = app_handle {
          let _ = handle.emit(
            "vlm-progress",
            VLMProgressEvent::new(
              current_frame,
              config.num_frames + 1,
              format!("Analyzing frame at {:.1}s...", timestamp),
              Some(timestamp),
            ),
          );
        }

        // Analyze frame
        let analysis = self
          .analyze_frame(timestamp, base64_image, api_key, &config)
          .await?;

        frame_analyses.push(analysis);

        // base64_image is dropped here, freeing memory
      }

      debug!(
        "Processed batch of {} frames in {}ms",
        chunk.len(),
        chunk_start.elapsed().as_millis()
      );
    }

    // Emit progress event for summary generation
    if let Some(handle) = app_handle {
      let _ = handle.emit(
        "vlm-progress",
        VLMProgressEvent::new(
          config.num_frames,
          config.num_frames + 1,
          "Generating overall summary...".to_string(),
          None,
        ),
      );
    }

    // Generate overall summary
    let overall_summary = self
      .generate_overall_summary(&frame_analyses, api_key, &config)
      .await?;

    // Extract common themes
    let themes = self.extract_themes(&frame_analyses);

    let processing_time = start_time.elapsed().as_millis() as u32;

    // Emit final progress event
    if let Some(handle) = app_handle {
      let _ = handle.emit(
        "vlm-progress",
        VLMProgressEvent::new(
          config.num_frames + 1,
          config.num_frames + 1,
          "Analysis complete!".to_string(),
          None,
        ),
      );
    }

    info!(
      "Vision analysis completed in {}ms, analyzed {} frames",
      processing_time,
      frame_analyses.len()
    );

    Ok(VLMAnalysisResult {
      frames: frame_analyses,
      overall_summary,
      themes,
      processing_time_ms: processing_time,
    })
  }

  /// Calculate evenly distributed timestamps for frame extraction
  ///
  /// Avoids first and last second to skip potential black frames
  fn calculate_frame_timestamps(&self, duration: f64, num_frames: u32) -> Vec<f64> {
    let mut timestamps = Vec::with_capacity(num_frames as usize);

    // Avoid first and last second to skip black frames
    let safe_duration = (duration - 2.0).max(1.0);
    let interval = safe_duration / (num_frames as f64 + 1.0);

    for i in 1..=num_frames {
      let timestamp = 1.0 + (i as f64 * interval);
      timestamps.push(timestamp);
    }

    timestamps
  }

  /// Extract a single frame at the specified timestamp
  ///
  /// Returns base64-encoded JPEG image
  fn extract_single_frame(&self, video_path: &PathBuf, timestamp: f64) -> Result<String> {
    debug!("Extracting frame at {:.2}s", timestamp);

    // Use process ID and timestamp to create unique filename
    let temp_dir = std::env::temp_dir();
    let frame_path = temp_dir.join(format!(
      "vlm_frame_{}_{}.jpg",
      std::process::id(),
      timestamp.to_string().replace('.', "_")
    ));

    let output = Command::new("ffmpeg")
      .args([
        "-ss",
        &format!("{:.2}", timestamp),
        "-i",
        video_path.to_str().unwrap(),
        "-vframes",
        "1",
        "-q:v",
        "2", // High quality JPEG
        "-y",
        frame_path.to_str().unwrap(),
      ])
      .output()
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run ffmpeg: {}", e)))?;

    if !output.status.success() {
      return Err(VideoCompilerError::Io(format!(
        "ffmpeg failed to extract frame at {}s",
        timestamp
      )));
    }

    // Read frame and encode to base64
    let image_bytes = std::fs::read(&frame_path)
      .map_err(|e| VideoCompilerError::Io(format!("Failed to read frame: {}", e)))?;

    let base64_image = BASE64.encode(&image_bytes);

    // Cleanup temporary file immediately
    let _ = std::fs::remove_file(&frame_path);

    Ok(base64_image)
  }

  /// Get video duration using ffprobe
  fn get_video_duration(&self, video_path: &PathBuf) -> Result<f64> {
    let output = Command::new("ffprobe")
      .args([
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        video_path.to_str().unwrap(),
      ])
      .output()
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run ffprobe: {}", e)))?;

    if !output.status.success() {
      return Err(VideoCompilerError::Io(
        "ffprobe failed to get video duration".to_string(),
      ));
    }

    let duration_str = String::from_utf8_lossy(&output.stdout);
    duration_str
      .trim()
      .parse::<f64>()
      .map_err(|e| VideoCompilerError::Io(format!("Failed to parse duration: {}", e)))
  }

  /// Analyze a single frame using vision model
  async fn analyze_frame(
    &self,
    timestamp: f64,
    base64_image: String,
    api_key: &str,
    config: &VisionAnalysisConfig,
  ) -> Result<FrameAnalysis> {
    debug!("Analyzing frame at {:.2}s", timestamp);

    let prompt = "Describe this video frame in detail. Include:\n\
                  1. What you see (objects, people, actions)\n\
                  2. The scene type (indoor/outdoor, setting)\n\
                  3. The mood or atmosphere\n\
                  4. Any notable details\n\
                  \n\
                  Respond in JSON format with:\n\
                  - description: detailed description\n\
                  - objects: array of detected objects\n\
                  - scene_type: indoor/outdoor/etc\n\
                  - mood: emotional tone";

    let message = AIMessage::with_image_base64("user", prompt, base64_image, "image/jpeg");

    let request = UnifiedAIRequest {
      provider: config.provider.clone(),
      model: config.model.clone(),
      messages: vec![message],
      max_tokens: Some(config.max_tokens),
      temperature: Some(config.temperature),
      stream: Some(false),
      system: Some("You are an expert at analyzing visual content in videos.".to_string()),
      tools: None,
      tool_choice: None,
    };

    let response = self.ai_manager.send_request(api_key, request).await?;

    // Parse JSON response
    let parsed: serde_json::Value = serde_json::from_str(&response.content).unwrap_or_else(|_| {
      // Fallback if response is not JSON
      serde_json::json!({
        "description": response.content,
        "objects": [],
        "scene_type": null,
        "mood": null
      })
    });

    Ok(FrameAnalysis {
      timestamp,
      description: parsed["description"]
        .as_str()
        .unwrap_or(&response.content)
        .to_string(),
      detected_objects: parsed["objects"]
        .as_array()
        .map(|arr| {
          arr
            .iter()
            .filter_map(|v| v.as_str().map(String::from))
            .collect()
        })
        .unwrap_or_default(),
      scene_type: parsed["scene_type"].as_str().map(String::from),
      mood: parsed["mood"].as_str().map(String::from),
    })
  }

  /// Generate overall video summary from frame analyses
  async fn generate_overall_summary(
    &self,
    frames: &[FrameAnalysis],
    api_key: &str,
    config: &VisionAnalysisConfig,
  ) -> Result<String> {
    debug!("Generating overall video summary");

    let frames_summary = frames
      .iter()
      .map(|f| format!("At {:.1}s: {}", f.timestamp, f.description))
      .collect::<Vec<_>>()
      .join("\n");

    let prompt = format!(
      "Based on these frame analyses from a video, provide a cohesive 2-3 sentence summary:\n\n{}",
      frames_summary
    );

    let request = UnifiedAIRequest {
      provider: config.provider.clone(),
      model: config.model.clone(),
      messages: vec![AIMessage::text("user", prompt)],
      max_tokens: Some(300),
      temperature: Some(0.5),
      stream: Some(false),
      system: Some("You are an expert at summarizing video content.".to_string()),
      tools: None,
      tool_choice: None,
    };

    let response = self.ai_manager.send_request(api_key, request).await?;
    Ok(response.content)
  }

  /// Extract common themes from frame analyses
  fn extract_themes(&self, frames: &[FrameAnalysis]) -> Vec<String> {
    let mut theme_counts: std::collections::HashMap<String, usize> =
      std::collections::HashMap::new();

    for frame in frames {
      // Count scene types
      if let Some(scene_type) = &frame.scene_type {
        *theme_counts.entry(scene_type.clone()).or_insert(0) += 1;
      }

      // Count moods
      if let Some(mood) = &frame.mood {
        *theme_counts.entry(mood.clone()).or_insert(0) += 1;
      }

      // Count common objects (objects appearing in multiple frames)
      for object in &frame.detected_objects {
        *theme_counts.entry(object.clone()).or_insert(0) += 1;
      }
    }

    // Return themes that appear in at least 30% of frames
    let threshold = (frames.len() as f64 * 0.3).ceil() as usize;
    theme_counts
      .into_iter()
      .filter(|(_, count)| *count >= threshold)
      .map(|(theme, _)| theme)
      .collect()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_vision_config_default() {
    let config = VisionAnalysisConfig::default();
    assert_eq!(config.provider, AIProvider::Ollama);
    assert_eq!(config.model, "moondream2");
    assert_eq!(config.num_frames, 5);
  }

  #[test]
  fn test_extract_themes() {
    let ai_manager = Arc::new(AIProviderManager::new());
    let analyzer = VisionAnalyzer::new(ai_manager);

    let frames = vec![
      FrameAnalysis {
        timestamp: 1.0,
        description: "Test".to_string(),
        detected_objects: vec!["person".to_string(), "car".to_string()],
        scene_type: Some("outdoor".to_string()),
        mood: Some("happy".to_string()),
      },
      FrameAnalysis {
        timestamp: 2.0,
        description: "Test".to_string(),
        detected_objects: vec!["person".to_string()],
        scene_type: Some("outdoor".to_string()),
        mood: Some("happy".to_string()),
      },
      FrameAnalysis {
        timestamp: 3.0,
        description: "Test".to_string(),
        detected_objects: vec!["person".to_string()],
        scene_type: Some("indoor".to_string()),
        mood: Some("happy".to_string()),
      },
    ];

    let themes = analyzer.extract_themes(&frames);

    // "person" and "happy" appear in all 3 frames (100%)
    // "outdoor" appears in 2 frames (66%)
    // All should be above 30% threshold
    assert!(themes.contains(&"person".to_string()));
    assert!(themes.contains(&"happy".to_string()));
  }
}

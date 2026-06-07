//! Agent contract types — typed request/result structs shared between
//! the render engine, analysis engine, and external agents (Lead Engine,
//! TypeScript SDK, CLI tools).
//!
//! These are the **stable API surface** between agents and the Timeline
//! Studio backend. Versioned via `schema_version` fields (semver string).
//!
//! All types implement `serde` + `schemars::JsonSchema` so they can be
//! emitted as JSON Schema for TS codegen (`timeline emit-schema --contracts`).
//!
//! # Contract hierarchy
//! ```text
//! Agent
//!  ├─ AnalysisRequest  →  AnalysisResult
//!  ├─ OptimizeRequest  →  OptimizeResult
//!  └─ PublishRequest   →  PublishResult
//! ```

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::common::Resolution;

// ── Schema version ────────────────────────────────────────────────────────────

/// Current contract schema version (semver).
pub const CONTRACT_SCHEMA_VERSION: &str = "1.0.0";

// ── Shared primitives ─────────────────────────────────────────────────────────

/// Severity level for diagnostics and analysis findings.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, schemars::JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
  Info,
  Warning,
  Error,
}

/// A single timestamped diagnostic message.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct Diagnostic {
  /// Severity level.
  pub severity: Severity,
  /// Human-readable message.
  pub message: String,
  /// Source component that emitted this diagnostic (e.g. `"scene_detector"`).
  pub source: Option<String>,
  /// Timeline position in seconds, if applicable.
  pub timestamp_sec: Option<f64>,
}

// ── AnalysisRequest / AnalysisResult ─────────────────────────────────────────

/// Request an AI analysis pass on a project or media asset.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct AnalysisRequest {
  /// Contract schema version — must be `"1.0.0"`.
  pub schema_version: String,
  /// What to analyse (`"project"`, `"clip"`, `"audio"`, `"full"`).
  pub mode: AnalysisMode,
  /// Path to the project JSON file, or asset path for clip/audio mode.
  pub target: String,
  /// Optional clip ID within the project to restrict analysis scope.
  pub clip_id: Option<String>,
  /// Arbitrary key-value hints passed to the analysis engine.
  pub hints: HashMap<String, serde_json::Value>,
}

/// Analysis mode selector.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, schemars::JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum AnalysisMode {
  /// Full project analysis (scenes + audio + quality).
  Project,
  /// Single clip video analysis.
  Clip,
  /// Audio-only analysis (levels, noise, speech segments).
  Audio,
  /// All passes: project + audio + quality.
  Full,
}

/// Result of an analysis pass.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct AnalysisResult {
  /// Contract schema version.
  pub schema_version: String,
  /// Whether the analysis completed successfully.
  pub success: bool,
  /// Detected scenes (non-empty when mode includes video analysis).
  pub scenes: Vec<SceneInfo>,
  /// Audio analysis summary (present when mode includes audio).
  pub audio: Option<AudioAnalysis>,
  /// Quality metrics for the output (present when mode is Full).
  pub quality: Option<QualityMetrics>,
  /// Actionable suggestions produced by AI director.
  pub suggestions: Vec<AiSuggestion>,
  /// Diagnostics / warnings from the analysis pass.
  pub diagnostics: Vec<Diagnostic>,
}

/// A single detected scene.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct SceneInfo {
  /// Scene index (0-based).
  pub index: usize,
  /// Start time in seconds.
  pub start_sec: f64,
  /// End time in seconds.
  pub end_sec: f64,
  /// Confidence score [0, 1].
  pub confidence: f64,
  /// Dominant mood/tone detected (e.g. `"energetic"`, `"calm"`).
  pub mood: Option<String>,
  /// Key frame timestamp within the scene (for thumbnail selection).
  pub keyframe_sec: Option<f64>,
}

/// Audio analysis summary.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct AudioAnalysis {
  /// Integrated loudness (LUFS).
  pub loudness_lufs: f64,
  /// Peak level (dBFS).
  pub peak_dbfs: f64,
  /// Dynamic range (dB).
  pub dynamic_range_db: f64,
  /// Detected noise floor (dBFS).
  pub noise_floor_dbfs: Option<f64>,
  /// Detected speech segments `(start_sec, end_sec)`.
  pub speech_segments: Vec<(f64, f64)>,
  /// Background music segments `(start_sec, end_sec)`.
  pub music_segments: Vec<(f64, f64)>,
}

/// Quality metrics for the rendered/analysed output.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct QualityMetrics {
  /// Overall quality score [0, 100].
  pub overall_score: f64,
  /// Video sharpness score [0, 100].
  pub sharpness: f64,
  /// Noise level score [0, 100] (100 = no noise).
  pub noise_score: f64,
  /// Colour grading consistency [0, 100].
  pub color_consistency: f64,
  /// Audio quality score [0, 100].
  pub audio_score: f64,
}

/// A single AI-generated suggestion for improving the timeline.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct AiSuggestion {
  /// Suggestion category (`"pacing"`, `"audio"`, `"color"`, `"structure"`, `"trim"`).
  pub category: String,
  /// Human-readable description.
  pub description: String,
  /// Confidence [0, 1].
  pub confidence: f64,
  /// Affected clip IDs, if known.
  pub affected_clips: Vec<String>,
  /// Machine-readable action hint for automated application.
  pub action: Option<serde_json::Value>,
}

// ── OptimizeRequest / OptimizeResult ─────────────────────────────────────────

/// Request an automated optimisation pass on a project.
///
/// The engine applies non-destructive transformations (trim silence,
/// normalise audio, remove duplicate frames, suggest cut points) and
/// returns a modified `ProjectSchema` JSON plus a change log.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct OptimizeRequest {
  /// Contract schema version.
  pub schema_version: String,
  /// Path to the input `ProjectSchema` JSON file.
  pub project_path: String,
  /// Optional path to write the optimised project JSON.
  /// If absent, the result is returned inline in `OptimizeResult.project_json`.
  pub output_path: Option<String>,
  /// Which optimisation passes to run.
  pub passes: Vec<OptimizePass>,
  /// Maximum trim silence threshold in seconds (default 0.3).
  pub silence_threshold_sec: Option<f64>,
  /// Target integrated loudness in LUFS for audio normalisation (default -14).
  pub target_loudness_lufs: Option<f64>,
}

/// An optimisation pass selector.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, schemars::JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum OptimizePass {
  /// Trim leading/trailing silence from audio clips.
  TrimSilence,
  /// Normalise integrated loudness to target.
  NormaliseAudio,
  /// Auto-colour-grade clips to a consistent look.
  ColourGrade,
  /// Suggest cut points based on scene detection.
  SuggestCuts,
  /// Remove visually duplicate frames (time-lapse cleanup).
  DeduplicateFrames,
}

/// Result of an optimisation pass.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct OptimizeResult {
  /// Contract schema version.
  pub schema_version: String,
  /// Whether all requested passes completed without errors.
  pub success: bool,
  /// Optimised `ProjectSchema` JSON — present when `output_path` was not set.
  pub project_json: Option<String>,
  /// Path to the written output file — present when `output_path` was set.
  pub output_path: Option<String>,
  /// Log of changes applied by each pass.
  pub changes: Vec<OptimizeChange>,
  /// Diagnostics from the optimisation run.
  pub diagnostics: Vec<Diagnostic>,
}

/// A single change applied by an optimisation pass.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct OptimizeChange {
  /// Which pass produced this change.
  pub pass: OptimizePass,
  /// Affected clip ID.
  pub clip_id: String,
  /// Human-readable description of the change.
  pub description: String,
  /// Previous value (serialised JSON), for undo.
  pub before: Option<serde_json::Value>,
  /// New value (serialised JSON).
  pub after: Option<serde_json::Value>,
}

// ── PublishRequest / PublishResult ────────────────────────────────────────────

/// Request a render-and-publish pipeline run.
///
/// The engine renders the project to a video file, optionally applies
/// post-processing (watermark, thumbnail extraction), and reports the
/// output artefacts back to the caller.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct PublishRequest {
  /// Contract schema version.
  pub schema_version: String,
  /// Path to the `ProjectSchema` JSON file to render.
  pub project_path: String,
  /// Output directory for rendered artefacts.
  pub output_dir: String,
  /// Output filename without extension (defaults to project name).
  pub output_name: Option<String>,
  /// Render quality preset.
  pub quality: RenderQuality,
  /// Optional watermark to overlay on the output video.
  pub watermark: Option<WatermarkConfig>,
  /// Whether to extract a thumbnail at the given timestamp.
  pub thumbnail_sec: Option<f64>,
  /// Whether to also emit a `.json` sidecar with `PublishResult`.
  pub emit_sidecar: bool,
  /// Extra metadata to embed in the output file (title, artist, comment).
  pub metadata: HashMap<String, String>,
}

/// Render quality preset.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, schemars::JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum RenderQuality {
  /// Fast preview quality (CRF 28, speed preset `veryfast`).
  Preview,
  /// Standard web quality (CRF 23, preset `medium`).
  Web,
  /// High quality for distribution (CRF 18, preset `slow`).
  High,
  /// Lossless / archival (CRF 0, preset `veryslow`).
  Lossless,
}

/// Watermark overlay configuration.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct WatermarkConfig {
  /// Path to the watermark image (PNG with alpha recommended).
  pub image_path: String,
  /// Horizontal position (`"left"`, `"center"`, `"right"`, or pixel offset).
  pub x: String,
  /// Vertical position (`"top"`, `"center"`, `"bottom"`, or pixel offset).
  pub y: String,
  /// Opacity [0.0, 1.0].
  pub opacity: f64,
  /// Scale relative to output width [0.0, 1.0].
  pub scale: f64,
}

/// Result of a publish pipeline run.
#[derive(Serialize, Deserialize, Debug, Clone, schemars::JsonSchema)]
pub struct PublishResult {
  /// Contract schema version.
  pub schema_version: String,
  /// Whether the publish pipeline completed successfully.
  pub success: bool,
  /// Path to the rendered video file.
  pub video_path: Option<String>,
  /// Path to the extracted thumbnail, if requested.
  pub thumbnail_path: Option<String>,
  /// Path to the JSON sidecar, if `emit_sidecar` was true.
  pub sidecar_path: Option<String>,
  /// Render duration in seconds (wall-clock).
  pub render_duration_sec: f64,
  /// Output file size in bytes.
  pub file_size_bytes: Option<u64>,
  /// Detected output resolution.
  pub resolution: Option<Resolution>,
  /// Detected output duration in seconds.
  pub video_duration_sec: Option<f64>,
  /// Diagnostics from the pipeline run.
  pub diagnostics: Vec<Diagnostic>,
}

// ── Default constructors ──────────────────────────────────────────────────────

impl AnalysisRequest {
  pub fn new(mode: AnalysisMode, target: impl Into<String>) -> Self {
    Self {
      schema_version: CONTRACT_SCHEMA_VERSION.to_string(),
      mode,
      target: target.into(),
      clip_id: None,
      hints: HashMap::new(),
    }
  }
}

impl AnalysisResult {
  pub fn ok(scenes: Vec<SceneInfo>, suggestions: Vec<AiSuggestion>) -> Self {
    Self {
      schema_version: CONTRACT_SCHEMA_VERSION.to_string(),
      success: true,
      scenes,
      audio: None,
      quality: None,
      suggestions,
      diagnostics: Vec::new(),
    }
  }

  pub fn err(message: impl Into<String>) -> Self {
    Self {
      schema_version: CONTRACT_SCHEMA_VERSION.to_string(),
      success: false,
      scenes: Vec::new(),
      audio: None,
      quality: None,
      suggestions: Vec::new(),
      diagnostics: vec![Diagnostic {
        severity: Severity::Error,
        message: message.into(),
        source: None,
        timestamp_sec: None,
      }],
    }
  }
}

impl OptimizeRequest {
  pub fn new(project_path: impl Into<String>, passes: Vec<OptimizePass>) -> Self {
    Self {
      schema_version: CONTRACT_SCHEMA_VERSION.to_string(),
      project_path: project_path.into(),
      output_path: None,
      passes,
      silence_threshold_sec: None,
      target_loudness_lufs: None,
    }
  }
}

impl PublishRequest {
  pub fn new(
    project_path: impl Into<String>,
    output_dir: impl Into<String>,
    quality: RenderQuality,
  ) -> Self {
    Self {
      schema_version: CONTRACT_SCHEMA_VERSION.to_string(),
      project_path: project_path.into(),
      output_dir: output_dir.into(),
      output_name: None,
      quality,
      watermark: None,
      thumbnail_sec: None,
      emit_sidecar: false,
      metadata: HashMap::new(),
    }
  }
}

impl PublishResult {
  pub fn err(message: impl Into<String>) -> Self {
    Self {
      schema_version: CONTRACT_SCHEMA_VERSION.to_string(),
      success: false,
      video_path: None,
      thumbnail_path: None,
      sidecar_path: None,
      render_duration_sec: 0.0,
      file_size_bytes: None,
      resolution: None,
      video_duration_sec: None,
      diagnostics: vec![Diagnostic {
        severity: Severity::Error,
        message: message.into(),
        source: None,
        timestamp_sec: None,
      }],
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn analysis_request_roundtrip() {
    let req = AnalysisRequest::new(AnalysisMode::Full, "/projects/demo.json");
    let json = serde_json::to_string(&req).unwrap();
    let back: AnalysisRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(back.schema_version, CONTRACT_SCHEMA_VERSION);
    assert_eq!(back.mode, AnalysisMode::Full);
    assert_eq!(back.target, "/projects/demo.json");
  }

  #[test]
  fn analysis_result_ok_err() {
    let ok = AnalysisResult::ok(vec![], vec![]);
    assert!(ok.success);
    let err = AnalysisResult::err("boom");
    assert!(!err.success);
    assert_eq!(err.diagnostics[0].severity, Severity::Error);
  }

  #[test]
  fn optimize_request_roundtrip() {
    let req = OptimizeRequest::new("/proj.json", vec![OptimizePass::TrimSilence, OptimizePass::NormaliseAudio]);
    let json = serde_json::to_string(&req).unwrap();
    let back: OptimizeRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(back.passes.len(), 2);
  }

  #[test]
  fn publish_request_roundtrip() {
    let req = PublishRequest::new("/proj.json", "/out", RenderQuality::Web);
    let json = serde_json::to_string(&req).unwrap();
    let back: PublishRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(back.quality, RenderQuality::Web);
    assert!(!back.emit_sidecar);
  }

  #[test]
  fn publish_result_err() {
    let r = PublishResult::err("render failed");
    assert!(!r.success);
    assert_eq!(r.diagnostics[0].message, "render failed");
  }

  #[test]
  fn scene_info_serialises() {
    let s = SceneInfo {
      index: 0,
      start_sec: 0.0,
      end_sec: 5.5,
      confidence: 0.95,
      mood: Some("energetic".to_string()),
      keyframe_sec: Some(2.0),
    };
    let json = serde_json::to_string(&s).unwrap();
    assert!(json.contains("energetic"));
    assert!(json.contains("0.95"));
  }

  #[test]
  fn watermark_config_roundtrip() {
    let wm = WatermarkConfig {
      image_path: "/logo.png".to_string(),
      x: "right".to_string(),
      y: "bottom".to_string(),
      opacity: 0.8,
      scale: 0.1,
    };
    let json = serde_json::to_string(&wm).unwrap();
    let back: WatermarkConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(back.opacity, 0.8);
  }

  #[test]
  fn all_optimize_passes_roundtrip() {
    let passes = vec![
      OptimizePass::TrimSilence,
      OptimizePass::NormaliseAudio,
      OptimizePass::ColourGrade,
      OptimizePass::SuggestCuts,
      OptimizePass::DeduplicateFrames,
    ];
    for p in &passes {
      let json = serde_json::to_string(p).unwrap();
      let back: OptimizePass = serde_json::from_str(&json).unwrap();
      assert_eq!(&back, p);
    }
  }
}

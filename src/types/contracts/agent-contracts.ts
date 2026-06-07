/**
 * Agent contract types — TypeScript mirror of `crates/ts-schema/src/contracts.rs`.
 *
 * These are the stable API surface between external agents (Lead Engine,
 * CLI tools) and the Timeline Studio backend.
 *
 * Source of truth: `docs/engineering/AGENT_CONTRACT_REFERENCE.md`
 * Schema version: "1.0.0"
 */

export const CONTRACT_SCHEMA_VERSION = "1.0.0" as const

// ── Shared primitives ────────────────────────────────────────────────────────

export type Severity = "info" | "warning" | "error"

export interface Diagnostic {
  severity: Severity
  message: string
  source?: string
  timestamp_sec?: number
}

// ── AnalysisRequest / AnalysisResult ─────────────────────────────────────────

export type AnalysisMode = "project" | "clip" | "audio" | "full"

export interface AnalysisRequest {
  schema_version: string
  mode: AnalysisMode
  target: string
  clip_id?: string | null
  hints: Record<string, unknown>
}

export interface SceneInfo {
  index: number
  start_sec: number
  end_sec: number
  confidence: number
  mood?: string | null
  keyframe_sec?: number | null
}

export interface AudioAnalysis {
  loudness_lufs: number
  peak_dbfs: number
  dynamic_range_db: number
  noise_floor_dbfs?: number | null
  speech_segments: [number, number][]
  music_segments: [number, number][]
}

export interface QualityMetrics {
  overall_score: number
  sharpness: number
  noise_score: number
  color_consistency: number
  audio_score: number
}

export interface AiSuggestion {
  category: string
  description: string
  confidence: number
  affected_clips: string[]
  action?: unknown
}

export interface AnalysisResult {
  schema_version: string
  success: boolean
  scenes: SceneInfo[]
  audio?: AudioAnalysis | null
  quality?: QualityMetrics | null
  suggestions: AiSuggestion[]
  diagnostics: Diagnostic[]
}

// ── OptimizeRequest / OptimizeResult ─────────────────────────────────────────

export type OptimizePass =
  | "trim_silence"
  | "normalise_audio"
  | "colour_grade"
  | "suggest_cuts"
  | "deduplicate_frames"

export interface OptimizeRequest {
  schema_version: string
  project_path: string
  output_path?: string | null
  passes: OptimizePass[]
  silence_threshold_sec?: number | null
  target_loudness_lufs?: number | null
}

export interface OptimizeChange {
  pass: OptimizePass
  clip_id: string
  description: string
  before?: unknown
  after?: unknown
}

export interface OptimizeResult {
  schema_version: string
  success: boolean
  project_json?: string | null
  output_path?: string | null
  changes: OptimizeChange[]
  diagnostics: Diagnostic[]
}

// ── PublishRequest / PublishResult ───────────────────────────────────────────

export type RenderQuality = "preview" | "web" | "high" | "lossless"

export interface WatermarkConfig {
  image_path: string
  x: string
  y: string
  opacity: number
  scale: number
}

export interface PublishRequest {
  schema_version: string
  project_path: string
  output_dir: string
  output_name?: string | null
  quality: RenderQuality
  watermark?: WatermarkConfig | null
  thumbnail_sec?: number | null
  emit_sidecar: boolean
  metadata: Record<string, string>
}

export interface Resolution {
  width: number
  height: number
}

export interface PublishResult {
  schema_version: string
  success: boolean
  video_path?: string | null
  thumbnail_path?: string | null
  sidecar_path?: string | null
  render_duration_sec: number
  file_size_bytes?: number | null
  resolution?: Resolution | null
  video_duration_sec?: number | null
  diagnostics: Diagnostic[]
}

// ── Convenience constructors ──────────────────────────────────────────────────

export function makeAnalysisRequest(
  mode: AnalysisMode,
  target: string,
  hints: Record<string, unknown> = {},
): AnalysisRequest {
  return { schema_version: CONTRACT_SCHEMA_VERSION, mode, target, hints }
}

export function makeOptimizeRequest(
  projectPath: string,
  passes: OptimizePass[],
): OptimizeRequest {
  return { schema_version: CONTRACT_SCHEMA_VERSION, project_path: projectPath, passes }
}

export function makePublishRequest(
  projectPath: string,
  outputDir: string,
  quality: RenderQuality = "web",
): PublishRequest {
  return {
    schema_version: CONTRACT_SCHEMA_VERSION,
    project_path: projectPath,
    output_dir: outputDir,
    quality,
    emit_sidecar: false,
    metadata: {},
  }
}

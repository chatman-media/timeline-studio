/**
 * Core-facing video compiler types.
 * Keep this file independent from domain packages so `@timeline-studio/core`
 * can be extracted before the video-editing domain is moved.
 */

// The Rust-generated ProjectSchema and legacy video-compiler schema are not
// structurally identical yet. Keep this loose bridge shape until Phase F can
// converge callers on @timeline/shared-types end to end.
export interface ProjectSchema {
  version: string
  metadata: any
  timeline: any
  tracks: Array<{
    id: string
    track_type: any
    name: string
    enabled: boolean
    locked: boolean
    volume: number
    clips: any[]
    effects: string[]
    filters: string[]
    [key: string]: any
  }>
  effects: any[]
  transitions: any[]
  filters: any[]
  templates: any[]
  style_templates: any[]
  subtitles: any[]
  settings: any
  [key: string]: any
}

export const AspectRatio = {
  Ratio16x9: "Ratio16x9",
  Ratio4x3: "Ratio4x3",
  Ratio21x9: "Ratio21x9",
  Ratio1x1: "Ratio1x1",
  Ratio9x16: "Ratio9x16",
  Custom: "Custom",
} as const

export type AspectRatio = (typeof AspectRatio)[keyof typeof AspectRatio]

export const OutputFormat = {
  Mp4: "Mp4",
  Avi: "Avi",
  Mov: "Mov",
  Mkv: "Mkv",
  WebM: "WebM",
  Gif: "Gif",
} as const

export type OutputFormat = "Mp4" | "Avi" | "Mov" | "Mkv" | "WebM" | "Gif"

export const RenderStatus = {
  Pending: "Pending",
  Processing: "Processing",
  Completed: "Completed",
  Failed: "Failed",
  Cancelled: "Cancelled",
} as const

export type RenderStatus = "Pending" | "Processing" | "Completed" | "Failed" | "Cancelled"

export interface RenderProgress {
  job_id: string
  stage: string
  percentage: number
  current_frame: number
  total_frames: number
  elapsed_time: number
  estimated_remaining?: number
  status: RenderStatus
  message?: string
  progress?: number
}

export interface RenderJob {
  id: string
  project_name: string
  output_path: string
  status: RenderStatus
  created_at: string
  progress: RenderProgress
  error_message?: string
}

export type VideoRenderJob = RenderJob

export interface RenderSettings {
  format: OutputFormat
  quality: number
  video_bitrate: number
  audio_bitrate: number
  hardware_acceleration: boolean
  ffmpeg_args: string[]
}

export interface RenderStatistics {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  average_render_time: number
  total_render_time: number
}

export interface VideoCompilerCacheStats {
  total_entries: number
  preview_hits: number
  preview_misses: number
  metadata_hits: number
  metadata_misses: number
  cache_hits: number
  cache_misses: number
  memory_usage: CacheMemoryUsage
  cache_size_mb: number
  total_size_mb: number
  preview_cache: {
    entries: number
    size_mb: number
  }
  cache_efficiency: number
}

export interface CacheMemoryUsage {
  preview_bytes: number
  metadata_bytes: number
  render_bytes: number
  total_bytes: number
  totalSize: number
  fileCount: number
  oldestEntry: string
  newestEntry: string
}

export interface PreviewCacheEntry {
  file_path: string
  timestamp: number
  quality: number
  image_data: Uint8Array
  created_at: string
  last_accessed: string
  access_count: number
}

export interface MetadataCacheEntry {
  file_path: string
  metadata: any
  created_at: string
  last_accessed: string
}

export interface CacheSettings {
  max_memory_mb: number
  max_entries: number
  auto_cleanup: boolean
  cleanup_threshold_percent: number
}

export const GpuEncoder = {
  None: "None",
  Nvenc: "Nvenc",
  QuickSync: "QuickSync",
  Vaapi: "Vaapi",
  VideoToolbox: "VideoToolbox",
  AMF: "AMF",
} as const

export type GpuEncoder = (typeof GpuEncoder)[keyof typeof GpuEncoder]

export interface GpuInfo {
  name: string
  driver_version?: string
  memory_total?: number
  memory_used?: number
  utilization?: number
  encoder_type: GpuEncoder
  supported_codecs: string[]
}

export interface GpuCapabilities {
  available_encoders: GpuEncoder[]
  recommended_encoder?: GpuEncoder
  current_gpu?: GpuInfo
  hardware_acceleration_supported: boolean
}

export interface CompilerSettings {
  hardware_acceleration: boolean
  max_concurrent_jobs: number
  temp_directory: string
  cache_size_mb: number
}

export interface SystemInfo {
  os: {
    type: string
    version: string
    architecture: string
  }
  cpu: {
    cores: number
    arch: string
  }
  memory: {
    total_bytes: number
    total_mb: number
    total_gb: number
  }
  runtime: {
    rust_version: string
    tauri_version: string
  }
}

export interface FfmpegCapabilities {
  version: string
  available_codecs: string[]
  hardware_encoders: string[]
  path: string
}

export const CompilerSubtitleAlignX = {
  Left: "Left",
  Center: "Center",
  Right: "Right",
} as const

export type CompilerSubtitleAlignX = (typeof CompilerSubtitleAlignX)[keyof typeof CompilerSubtitleAlignX]

export const CompilerSubtitleAlignY = {
  Top: "Top",
  Center: "Center",
  Bottom: "Bottom",
} as const

export type CompilerSubtitleAlignY = (typeof CompilerSubtitleAlignY)[keyof typeof CompilerSubtitleAlignY]

export const CompilerSubtitleFontWeight = {
  Normal: "Normal",
  Bold: "Bold",
  Light: "Light",
} as const

export type CompilerSubtitleFontWeight = (typeof CompilerSubtitleFontWeight)[keyof typeof CompilerSubtitleFontWeight]

export const CompilerSubtitleAnimationType = {
  FadeIn: "FadeIn",
  FadeOut: "FadeOut",
  SlideIn: "SlideIn",
  SlideOut: "SlideOut",
  TypeWriter: "TypeWriter",
  Bounce: "Bounce",
} as const

export type CompilerSubtitleAnimationType =
  (typeof CompilerSubtitleAnimationType)[keyof typeof CompilerSubtitleAnimationType]

export const CompilerSubtitleEasing = {
  Linear: "Linear",
  Ease: "Ease",
  EaseIn: "EaseIn",
  EaseOut: "EaseOut",
  EaseInOut: "EaseInOut",
} as const

export type CompilerSubtitleEasing = (typeof CompilerSubtitleEasing)[keyof typeof CompilerSubtitleEasing]

export const CompilerSubtitleDirection = {
  Left: "Left",
  Right: "Right",
  Up: "Up",
  Down: "Down",
} as const

export type CompilerSubtitleDirection = (typeof CompilerSubtitleDirection)[keyof typeof CompilerSubtitleDirection]

export interface CompilerSubtitle {
  id: string
  text: string
  start_time: number
  end_time: number
  position: CompilerSubtitlePosition
  style: CompilerSubtitleStyle
  enabled: boolean
  animations?: CompilerSubtitleAnimation[]
}

export interface CompilerSubtitlePosition {
  x: number
  y: number
  align_x: CompilerSubtitleAlignX
  align_y: CompilerSubtitleAlignY
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface CompilerSubtitleStyle {
  font_family: string
  font_size: number
  font_weight: CompilerSubtitleFontWeight
  color: string
  stroke_color?: string
  stroke_width?: number
  shadow_color?: string
  shadow_x?: number
  shadow_y?: number
  shadow_blur?: number
  background_color?: string
  background_opacity?: number
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  border_radius?: number
  line_height?: number
  letter_spacing?: number
  max_width?: number
}

export interface CompilerSubtitleAnimation {
  id: string
  animation_type: CompilerSubtitleAnimationType
  duration: number
  delay?: number
  easing?: CompilerSubtitleEasing
  direction?: CompilerSubtitleDirection
  properties?: Record<string, any>
}

/**
 * Типы для основного компилятора видео
 */

import { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import type { RenderSettings } from "./render"

export interface VideoCompilerConfig {
  ffmpeg_path?: string
  temp_directory?: string
  max_concurrent_jobs: number
  enable_hardware_acceleration: boolean
  cache_settings: CompilerCacheSettings
}

export interface CompilerCacheSettings {
  max_memory_mb: number
  max_entries: number
  auto_cleanup: boolean
}

export interface CompilerState {
  active_jobs: string[]
  completed_jobs: string[]
  failed_jobs: string[]
  cache_stats: {
    total_entries: number
    memory_usage_mb: number
  }
}

export interface PreviewRequest {
  project: ProjectSchema
  timestamp: number
  quality?: number
  width?: number
  height?: number
}

export interface PreviewResult {
  image_data: Uint8Array
  timestamp: number
  width: number
  height: number
  format: "jpeg" | "png"
}

export interface RenderRequest {
  project: ProjectSchema
  output_path: string
  settings?: Partial<RenderSettings>
}

export interface VideoCompilerEvents {
  render_started: { job_id: string }
  render_progress: { job_id: string; progress: number }
  render_completed: { job_id: string; output_path: string }
  render_failed: { job_id: string; error: string }
  preview_generated: { timestamp: number; image_data: Uint8Array }
  cache_updated: { cache_size_mb: number }
}

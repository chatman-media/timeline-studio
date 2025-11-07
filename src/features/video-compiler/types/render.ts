/**
 * Типы для системы рендеринга видео
 */

export interface VideoRenderJob {
  id: string
  project_name: string
  output_path: string
  status: RenderStatus
  created_at: string
  progress: RenderProgress
  error_message?: string
}

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
  // Backward compatibility alias
  progress?: number
}

export enum RenderStatus {
  Pending = "Pending",
  Processing = "Processing",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export interface RenderSettings {
  format: OutputFormat
  quality: number
  video_bitrate: number
  audio_bitrate: number
  hardware_acceleration: boolean
  ffmpeg_args: string[]
}

export enum OutputFormat {
  Mp4 = "Mp4",
  Avi = "Avi",
  Mov = "Mov",
  Mkv = "Mkv",
  WebM = "WebM",
  Gif = "Gif",
}

export interface RenderStatistics {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  average_render_time: number
  total_render_time: number
}

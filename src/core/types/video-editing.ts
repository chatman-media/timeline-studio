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

export type OutputFormat = (typeof OutputFormat)[keyof typeof OutputFormat]

export const RenderStatus = {
  Pending: "Pending",
  Processing: "Processing",
  Completed: "Completed",
  Failed: "Failed",
  Cancelled: "Cancelled",
} as const

export type RenderStatus = (typeof RenderStatus)[keyof typeof RenderStatus]

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

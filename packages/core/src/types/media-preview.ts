/**
 * Media preview data shared through the core media port.
 *
 * The shape keeps legacy lightweight preview fields and the richer Rust preview
 * cache payload used by recognition overlays.
 */

export interface ThumbnailData {
  path: string
  base64_data?: string
  timestamp: number
  width: number
  height: number
}

export interface TimelinePreview {
  timestamp: number
  path: string
  base64_data?: string
}

export interface RecognitionFrame {
  timestamp: number
  path: string
  processed: boolean
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DetectedObject {
  class: string
  confidence: number
  timestamps: number[]
  bounding_boxes: BoundingBox[]
}

export interface DetectedFace {
  face_id?: string
  person_name?: string
  confidence: number
  timestamps: number[]
  bounding_boxes: BoundingBox[]
}

export interface DetectedScene {
  scene_type: string
  start_time: number
  end_time: number
  key_objects: string[]
}

export interface RecognitionResults {
  objects: DetectedObject[]
  faces?: DetectedFace[]
  scenes?: DetectedScene[]
  processed_at: string
}

export interface TimelineFrame {
  timestamp: number
  base64_data: string
  is_keyframe: boolean
}

export interface BasicVideoMetadata {
  duration?: number
  width?: number
  height?: number
  aspect_ratio?: string
  fps?: number
  video_codec?: string
  audio_codec?: string
  bitrate?: number
  has_video: boolean
  has_audio: boolean
}

export interface PreviewWaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
}

export interface MediaPreviewData {
  // Lightweight legacy preview fields.
  thumbnailPath?: string
  waveformData?: PreviewWaveformData
  timelineFrames?: string[]

  // Rich Rust preview cache payload.
  file_id?: string
  file_path?: string
  browser_thumbnail?: ThumbnailData
  timeline_previews?: TimelinePreview[]
  timeline_frames?: TimelineFrame[]
  recognition_frames?: RecognitionFrame[]
  recognition_results?: RecognitionResults
  last_updated?: string
  basic_metadata?: BasicVideoMetadata
}

/**
 * Core-facing media types used by UI slices.
 * Keep this file independent from domain packages so type-only UI props can
 * move off domain re-exports before media-management is extracted.
 */

export enum MediaType {
  Video = "Video",
  VideoWithAudio = "video_with_audio",
  StillImage = "Image",
  ImageSequence = "image_sequence",
  Audio = "Audio",
  Music = "music",
  Voiceover = "voiceover",
  SFX = "sfx",
  Ambient = "ambient",
  Subtitle = "subtitle",
  Title = "title",
  Graphics = "graphics",
  LUT = "lut",
  Project = "project",
  Unknown = "unknown",
}

export interface MediaFile {
  id: string
  name: string
  path: string
  type: string
  duration?: number
  size?: number
  createdAt?: Date
  updatedAt?: Date
  width?: number
  height?: number
  fps?: number
  bitrate?: number
  thumbnailPath?: string
  metadata?: {
    type?: string
    bitrate?: number
    codec?: string
    width?: number
    height?: number
    fps?: number
    duration?: number
    channels?: number
    sample_rate?: number
    [key: string]: unknown
  }
  isVideo?: boolean
  isImage?: boolean
  isAudio?: boolean
  isAddedToTimeline?: boolean
  isIncluded?: boolean
  isUnavailable?: boolean
  lastCheckedAt?: number
  isLoadingMetadata?: boolean
  source?: string
  startTime?: number
  endTime?: number
}

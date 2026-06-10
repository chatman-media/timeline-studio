import type { TimeRange } from "./time-range"

export type { MediaFile } from "@timeline-studio/domains/shared/types/media/media-file"
export {
  isAudioFile,
  isImageFile,
  isVideoFile,
  MediaCodec,
  MediaColorSpace,
} from "@timeline-studio/domains/shared/types/media/media-file"
// Re-export from canonical source in shared
export { MediaType } from "@timeline-studio/domains/shared/types/media/types"

// Domain-specific types and utilities

export interface MediaTrack {
  id: string
  name?: string
  type: "video" | "audio" | "subtitle"
  codec?: string
  bitrate?: number
  duration?: number

  // Video track specific
  width?: number
  height?: number
  fps?: number
  pixelFormat?: string

  // Audio track specific
  sampleRate?: number
  channels?: number
  channelLayout?: string

  // Subtitle track specific
  language?: string

  // Track management fields (used in timeline/media tracks)
  index?: number
  isActive?: boolean
  videos?: import("@timeline-studio/domains/shared/types/media/media-file").MediaFile[]
  startTime?: number
  endTime?: number
  combinedDuration?: number
  timeRanges?: TimeRange[]
  volume?: number
  isMuted?: boolean
  isLocked?: boolean
  isVisible?: boolean
  cameraId?: string
  cameraName?: string
}

export interface VideoSegment {
  id: string
  path: string
  startTime: number
  endTime: number
  duration: number
  sourceFileId?: string
}

export interface FileGroup {
  id: string
  name: string
  files: string[] // file IDs
  createdAt: Date
  updatedAt: Date
}

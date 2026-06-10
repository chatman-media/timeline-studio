/**
 * Media File - Canonical source
 *
 * Unified MediaFile interface combining features from both domains
 */

import type { FfprobeData } from "@timeline-studio/domains/media-management/types/ffprobe"
import { MediaType } from "./types"

// Media codecs (from video-editing)
export enum MediaCodec {
  // Video codecs
  H264 = "h264",
  H265 = "h265",
  ProRes422 = "prores_422",
  ProRes4444 = "prores_4444",
  DNxHD = "dnxhd",
  DNxHR = "dnxhr",
  AV1 = "av1",
  VP9 = "vp9",
  // Audio codecs
  AAC = "aac",
  PCM = "pcm",
  FLAC = "flac",
  MP3 = "mp3",
  Opus = "opus",
  Vorbis = "vorbis",
}

export enum MediaColorSpace {
  Rec709 = "rec709",
  Rec2020 = "rec2020",
  sRGB = "srgb",
  DCI_P3 = "dci-p3",
  Adobe_RGB = "adobe-rgb",
}

/**
 * Unified MediaFile interface
 * Combines features from media-management and video-editing domains
 */
export interface MediaFile {
  // Core identification
  id: string
  name: string
  path: string
  type: MediaType

  // Basic metadata
  duration?: number
  size?: number
  createdAt?: Date
  updatedAt?: Date

  // Video properties
  width?: number
  height?: number
  aspectRatio?: string // e.g., "16:9", "2.39:1"
  fps?: number
  pixelAspectRatio?: number
  videoCodec?: MediaCodec | string
  videoBitrate?: number

  // Audio properties
  audioCodec?: MediaCodec | string
  audioBitrate?: number
  bitrate?: number // General bitrate (for both video and audio)
  sampleRate?: number // e.g., 48000, 96000
  audioChannels?: number // 1=mono, 2=stereo, 6=5.1, 8=7.1

  // Professional color properties
  colorSpace?: MediaColorSpace | string
  colorPrimaries?: string
  transferCharacteristics?: string
  chromaSubsampling?: string // e.g., "4:2:0", "4:2:2", "4:4:4"
  bitDepth?: number // 8, 10, 12, 16 bit

  // Technical metadata
  probeData?: FfprobeData
  checksum?: string

  // Preview and thumbnails
  thumbnailPath?: string
  metadata?: {
    type: "Video" | "Audio" | "Image"
    bitrate?: number
    codec?: string
    [key: string]: any
  }

  // Timeline integration
  startTime?: number
  endTime?: number
  isAddedToTimeline?: boolean
  isIncluded?: boolean
  isUnavailable?: boolean
  lastCheckedAt?: number
  isLoadingMetadata?: boolean
  source?: "browser" | "timeline"

  // Media type flags (for convenience)
  isVideo?: boolean
  isImage?: boolean
  isAudio?: boolean

  // Proxy and optimization
  proxy?: {
    path: string
    width: number
    height: number
    bitrate: number
  }
  proxies?: Array<{
    path: string
    width: number
    height: number
    bitrate: number
    streamKey: string
  }>

  // Low-res preview (from media-management)
  lrv?: {
    path: string
    width: number
    height: number
    duration: number
    probeData?: FfprobeData
  }

  // Insta360 specific
  insv?: {
    path: string
    gyroPath?: string
  }

  // Spatial properties (360/VR)
  is360?: boolean
  stereoMode?: "mono" | "side-by-side" | "top-bottom"
  projectionType?: "equirectangular" | "cubemap" | "fisheye"

  // Timecode
  timecode?: {
    start: string
    format: "SMPTE" | "DF" | "NDF"
  }
}

/**
 * Utility to check if MediaFile is video
 */
export function isVideoFile(file: MediaFile): boolean {
  return file.isVideo === true || file.type === MediaType.Video || file.type === MediaType.VideoWithAudio
}

/**
 * Utility to check if MediaFile is audio
 */
export function isAudioFile(file: MediaFile): boolean {
  return (
    file.isAudio === true ||
    file.type === MediaType.Audio ||
    file.type === MediaType.Music ||
    file.type === MediaType.Voiceover ||
    file.type === MediaType.SFX ||
    file.type === MediaType.Ambient
  )
}

/**
 * Utility to check if MediaFile is image
 */
export function isImageFile(file: MediaFile): boolean {
  return file.isImage === true || file.type === MediaType.StillImage || file.type === MediaType.ImageSequence
}

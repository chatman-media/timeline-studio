import type { OutputFormat } from "@/domains/video-editing/types"

export interface ExportSettings {
  fileName: string
  savePath: string
  format: keyof typeof OutputFormat
  quality: "normal" | "good" | "best"
  resolution: "720" | "1080" | "1440" | "4k" | "timeline"
  frameRate: string
  enableGPU: boolean
  advancedCompression?: boolean
  cloudBackup?: boolean

  // Новые поля для расширенных настроек
  exportVideo?: boolean
  exportAudio?: boolean
  renderMode?: "single" | "individual"
  bitrateMode?: "auto" | "limit" | "cbr" | "vbr" | "crf"
  bitrate?: number
  maxBitrate?: number
  minBitrate?: number
  crf?: number
  encodingProfile?: "main" | "main10" | "high"
  encodingPreset?:
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow"
    | "slower"
    | "veryslow"
  entropyMode?: "cabac" | "cavlc"
  keyframeMode?: "auto" | "every"
  keyframeInterval?: number
  bFrames?: number
  refFrames?: number
  optimizeForSpeed?: boolean
  optimizeForNetwork?: boolean
  multipassEncoding?: boolean
  frameReordering?: boolean
  useProxyMedia?: boolean
  renderWithoutTimecode?: boolean
  interlacedRendering?: boolean
  useVerticalResolution?: boolean
  normalizeAudio?: boolean
  audioTarget?: number // LKFS
  audioPeak?: number // dBTP
  audioCodec?: string
  audioChannels?: string
  embedInfoAsProject?: boolean
  chaptersByMarkers?: boolean
  constantBitrate?: boolean
  chapters?: boolean
  watermark?: boolean
}

export interface DeviceExportSettings extends ExportSettings {
  device: "iphone" | "ipad" | "android"
  codec: "h264" | "h265"
}

export interface SocialExportSettings extends ExportSettings {
  socialNetwork: string
  isLoggedIn: boolean
  accountName?: string
  privacy?: "public" | "private" | "unlisted"
  title?: string
  description?: string
  tags?: string[]
  thumbnail?: string
  fileSizeBytes?: number
  durationSeconds?: number
  // TikTok specific
  useVerticalResolution?: boolean
  uploadDirectlyToTikTok?: boolean
  // YouTube specific
  category?: string
  language?: string
  // Telegram specific
  channelId?: string
  // Common
  useProxyMedia?: boolean
}

export type ExportMode = "local" | "device" | "social"

export interface ExportProgress {
  percentage: number
  message?: string
  jobId?: string
}

export interface SocialNetworkConfig {
  id: string
  name: string
  icon: string
  maxResolution: string
  maxFps: number
  recommendedFormats: readonly string[]
  aspectRatios: readonly string[]
}

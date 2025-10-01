/**
 * Professional Media Types for Video Editing
 *
 * Профессиональные типы медиафайлов по аналогии с DaVinci Resolve
 */

export enum MediaType {
  // Video formats
  Video = "video",
  VideoWithAudio = "video_with_audio",

  // Image formats
  StillImage = "still_image",
  ImageSequence = "image_sequence",

  // Audio formats
  Audio = "audio",
  Music = "music",
  Voiceover = "voiceover",
  SFX = "sfx",
  Ambient = "ambient",

  // Text and graphics
  Subtitle = "subtitle",
  Title = "title",
  Graphics = "graphics",

  // Special types
  LUT = "lut", // Color lookup table
  Project = "project",
  Unknown = "unknown",
}

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
  WAV = "wav",

  // Image codecs
  JPEG = "jpeg",
  PNG = "png",
  TIFF = "tiff",
  DPX = "dpx",
  EXR = "exr",

  Unknown = "unknown",
}

export enum MediaColorSpace {
  Rec709 = "rec709",
  Rec2020 = "rec2020",
  P3 = "p3",
  sRGB = "srgb",
  LogC = "logc",
  SLog3 = "slog3",
  VLog = "vlog",
  Unknown = "unknown",
}

export interface MediaFile {
  id: string
  name: string
  path: string

  // Core properties
  type: MediaType
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
  videoCodec?: MediaCodec
  videoBitrate?: number

  // Audio properties
  audioCodec?: MediaCodec
  audioBitrate?: number
  sampleRate?: number // e.g., 48000, 96000
  audioChannels?: number // 1=mono, 2=stereo, 6=5.1, 8=7.1

  // Color properties (professional features)
  colorSpace?: MediaColorSpace
  colorPrimaries?: string
  transferCharacteristics?: string
  chromaSubsampling?: string // e.g., "4:2:0", "4:2:2", "4:4:4"
  bitDepth?: number // 8, 10, 12, 16 bit

  // Technical metadata
  probeData?: any // FFprobe data
  checksum?: string // For integrity verification

  // Timeline integration
  isAddedToTimeline?: boolean
  isIncluded?: boolean
  isUnavailable?: boolean
  lastCheckedAt?: number
  isLoadingMetadata?: boolean
  source?: "browser" | "timeline" | "import"

  // Proxy and optimization
  proxy?: {
    path: string
    width: number
    height: number
    bitrate: number
    codec: MediaCodec
  }

  // Low-resolution version (like DaVinci's optimized media)
  optimizedMedia?: {
    path: string
    width: number
    height: number
    codec: MediaCodec
    bitrate: number
  }

  // Thumbnail
  thumbnailPath?: string

  // Professional features
  reel?: string // Film reel identifier
  scene?: string // Scene identifier
  take?: string // Take number
  timecode?: {
    start: string // e.g., "01:00:00:00"
    drop_frame: boolean
  }

  // Camera metadata (for professional workflows)
  camera?: {
    make?: string // Canon, Sony, RED, etc.
    model?: string
    serialNumber?: string
    lensModel?: string
    iso?: number
    shutterSpeed?: string
    aperture?: string
    whiteBalance?: number
  }

  // Audio levels (for broadcast compliance)
  audioLevels?: {
    peak: number // dBFS
    rms: number // dBFS
    lufs: number // LUFS for broadcast
    truePeak: number // dBTP
  }
}

// Utility functions for MediaFile
export const MediaFileUtils = {
  /**
   * Проверка типа медиафайла
   */
  isVideo: (file: MediaFile): boolean => file.type === MediaType.Video || file.type === MediaType.VideoWithAudio,

  isAudio: (file: MediaFile): boolean =>
    [MediaType.Audio, MediaType.Music, MediaType.Voiceover, MediaType.SFX, MediaType.Ambient].includes(file.type),

  isImage: (file: MediaFile): boolean => file.type === MediaType.StillImage || file.type === MediaType.ImageSequence,

  hasAudio: (file: MediaFile): boolean => file.type === MediaType.VideoWithAudio || MediaFileUtils.isAudio(file),

  hasVideo: (file: MediaFile): boolean => MediaFileUtils.isVideo(file) || file.type === MediaType.ImageSequence,

  /**
   * Получение информации о разрешении
   */
  getResolutionString: (file: MediaFile): string => {
    if (!file.width || !file.height) return "Unknown"

    // Standard resolutions
    const standardResolutions: Record<string, string> = {
      "3840x2160": "4K UHD",
      "4096x2160": "4K DCI",
      "1920x1080": "Full HD",
      "1280x720": "HD",
      "720x480": "SD NTSC",
      "720x576": "SD PAL",
    }

    const key = `${file.width}x${file.height}`
    return standardResolutions[key] || key
  },

  /**
   * Получение качества видео
   */
  getVideoQuality: (file: MediaFile): "SD" | "HD" | "Full HD" | "4K" | "8K" | "Unknown" => {
    if (!file.width || !file.height) return "Unknown"

    const pixels = file.width * file.height

    if (pixels >= 7680 * 4320) return "8K" // 8K
    if (pixels >= 3840 * 2160) return "4K" // 4K
    if (pixels >= 1920 * 1080) return "Full HD" // 1080p
    if (pixels >= 1280 * 720) return "HD" // 720p
    return "SD"
  },

  /**
   * Проверка broadcast compliance
   */
  isBroadcastCompliant: (file: MediaFile): boolean => {
    if (!file.audioLevels) return false

    // EBU R128 recommendations
    const lufs = file.audioLevels.lufs
    const truePeak = file.audioLevels.truePeak

    return lufs >= -23 - 1 && lufs <= -23 + 1 && truePeak <= -1
  },

  /**
   * Получение цветового формата для UI
   */
  getColorSpaceDisplayName: (colorSpace?: MediaColorSpace): string => {
    const names: Record<MediaColorSpace, string> = {
      [MediaColorSpace.Rec709]: "Rec. 709",
      [MediaColorSpace.Rec2020]: "Rec. 2020",
      [MediaColorSpace.P3]: "DCI-P3",
      [MediaColorSpace.sRGB]: "sRGB",
      [MediaColorSpace.LogC]: "Arri LogC",
      [MediaColorSpace.SLog3]: "Sony S-Log3",
      [MediaColorSpace.VLog]: "Panasonic V-Log",
      [MediaColorSpace.Unknown]: "Unknown",
    }

    return names[colorSpace || MediaColorSpace.Unknown]
  },

  /**
   * Получение битрейта в удобном формате
   */
  getBitrateString: (bitrate?: number): string => {
    if (!bitrate) return "Unknown"

    if (bitrate >= 1_000_000) {
      return `${(bitrate / 1_000_000).toFixed(1)} Mbps`
    }
    if (bitrate >= 1_000) {
      return `${(bitrate / 1_000).toFixed(0)} kbps`
    }
    return `${bitrate} bps`
  },

  /**
   * Получение информации о кодеке для UI
   */
  getCodecDisplayName: (codec?: MediaCodec): string => {
    const names: Record<MediaCodec, string> = {
      [MediaCodec.H264]: "H.264",
      [MediaCodec.H265]: "H.265/HEVC",
      [MediaCodec.ProRes422]: "ProRes 422",
      [MediaCodec.ProRes4444]: "ProRes 4444",
      [MediaCodec.DNxHD]: "DNxHD",
      [MediaCodec.DNxHR]: "DNxHR",
      [MediaCodec.AV1]: "AV1",
      [MediaCodec.VP9]: "VP9",
      [MediaCodec.AAC]: "AAC",
      [MediaCodec.PCM]: "PCM",
      [MediaCodec.FLAC]: "FLAC",
      [MediaCodec.MP3]: "MP3",
      [MediaCodec.WAV]: "WAV",
      [MediaCodec.JPEG]: "JPEG",
      [MediaCodec.PNG]: "PNG",
      [MediaCodec.TIFF]: "TIFF",
      [MediaCodec.DPX]: "DPX",
      [MediaCodec.EXR]: "OpenEXR",
      [MediaCodec.Unknown]: "Unknown",
    }

    return names[codec || MediaCodec.Unknown]
  },

  /**
   * Создание пустого MediaFile
   */
  createEmpty: (name: string, path: string, type: MediaType = MediaType.Unknown): MediaFile => ({
    id: crypto.randomUUID?.() || `media_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    path,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}

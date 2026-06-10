export interface ResolutionOption {
  value: string
  label: string
  width: number
  height: number
}

export type Resolution = string
export type FrameRate = "23.97" | "24" | "25" | "29.97" | "30" | "50" | "59.94" | "60"
export type ColorSpace = "sdr" | "rec709" | "dci-p3" | "p3-d65" | "hdr-hlg" | "hdr-pq" | "rec2020" | "srgb"

export interface AspectRatioValue {
  width: number
  height: number
  name: string
}

export interface AspectRatio {
  label: string
  textLabel: string
  value: AspectRatioValue
  description: string
}

export interface ProjectSettings {
  aspectRatio: AspectRatio
  resolution: Resolution
  frameRate: FrameRate
  colorSpace: ColorSpace
}

export interface ProjectFile {
  settings: ProjectSettings
  [key: string]: unknown
}

export const FRAME_RATES: { value: FrameRate; label: string }[] = [
  { value: "23.97", label: "23.97 fps" },
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps" },
  { value: "29.97", label: "29.97 fps" },
  { value: "30", label: "30 fps" },
  { value: "50", label: "50 fps" },
  { value: "59.94", label: "59.94 fps" },
  { value: "60", label: "60 fps" },
]

export const COLOR_SPACES: { value: ColorSpace; label: string }[] = [
  { value: "sdr", label: "SDR - Rec.709" },
  { value: "dci-p3", label: "DCI-P3" },
  { value: "p3-d65", label: "P3-D65" },
  { value: "hdr-hlg", label: "HDR - Rec.2100HLG" },
  { value: "hdr-pq", label: "HDR - Rec.2100PQ" },
]

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    label: "16:9",
    textLabel: "Широкоэкнранный",
    description: "YouTube",
    value: { width: 16, height: 9, name: "16:9" },
  },
  {
    label: "9:16",
    textLabel: "Портрет",
    description: "TikTok, YouTube Shorts",
    value: { width: 9, height: 16, name: "9:16" },
  },
  {
    label: "1:1",
    textLabel: "Социальные сети",
    description: "Instagram, Social media posts",
    value: { width: 1, height: 1, name: "1:1" },
  },
  {
    label: "4:3",
    textLabel: "Стандарт",
    description: "TV",
    value: { width: 4, height: 3, name: "4:3" },
  },
  {
    label: "4:5",
    textLabel: "Вертикальный",
    description: "Vertical post",
    value: { width: 4, height: 5, name: "4:5" },
  },
  {
    label: "21:9",
    textLabel: "Кинотеатр",
    description: "Movie",
    value: { width: 64, height: 27, name: "21:9" },
  },
  {
    label: "custom",
    textLabel: "",
    description: "User",
    value: { width: 16, height: 9, name: "custom" },
  },
]

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  aspectRatio: ASPECT_RATIOS[0],
  resolution: "1920x1080",
  frameRate: "30",
  colorSpace: "sdr",
}

export const RESOLUTIONS_16_9: ResolutionOption[] = [
  { value: "1280x720", label: "1280x720 (HD)", width: 1280, height: 720 },
  { value: "1920x1080", label: "1920x1080 (Full HD)", width: 1920, height: 1080 },
  { value: "2560x1440", label: "2560x1440 (2K QHD)", width: 2560, height: 1440 },
  { value: "3840x2160", label: "3840x2160 (4K UHD)", width: 3840, height: 2160 },
]

export const RESOLUTIONS_9_16: ResolutionOption[] = [
  { value: "720x1280", label: "720x1280 (HD)", width: 720, height: 1280 },
  { value: "1080x1920", label: "1080x1920 (Full HD)", width: 1080, height: 1920 },
  { value: "1440x2560", label: "1440x2560 (2K QHD)", width: 1440, height: 2560 },
  { value: "2160x3840", label: "2160x3840 (4K UHD)", width: 2160, height: 3840 },
]

export const RESOLUTIONS_1_1: ResolutionOption[] = [
  { value: "720x720", label: "720x720", width: 720, height: 720 },
  { value: "1080x1080", label: "1080x1080", width: 1080, height: 1080 },
  { value: "1440x1440", label: "1440x1440", width: 1440, height: 1440 },
  { value: "2160x2160", label: "2160x2160", width: 2160, height: 2160 },
]

export const RESOLUTIONS_4_3: ResolutionOption[] = [
  { value: "960x720", label: "960x720", width: 960, height: 720 },
  { value: "1440x1080", label: "1440x1080", width: 1440, height: 1080 },
  { value: "1920x1440", label: "1920x1440", width: 1920, height: 1440 },
  { value: "2880x2160", label: "2880x2160", width: 2880, height: 2160 },
]

export const RESOLUTIONS_4_5: ResolutionOption[] = [
  { value: "864x1080", label: "864x1080", width: 864, height: 1080 },
  { value: "1024x1280", label: "1024x1280", width: 1024, height: 1280 },
  { value: "1536x1920", label: "1536x1920", width: 1536, height: 1920 },
  { value: "2048x2560", label: "2048x2560", width: 2048, height: 2560 },
]

export const RESOLUTIONS_21_9: ResolutionOption[] = [
  { value: "2560x1080", label: "2560x1080 (UltraWide)", width: 2560, height: 1080 },
  { value: "3440x1440", label: "3440x1440 (UltraWide QHD)", width: 3440, height: 1440 },
  { value: "5120x2160", label: "5120x2160 (UltraWide 5K)", width: 5120, height: 2160 },
]

export const COMMON_FRAMERATES = FRAME_RATES.map((fr) => Number.parseInt(fr.value, 10)).filter(
  (fr) => !Number.isNaN(fr),
)

export const COMMON_RESOLUTIONS: ResolutionOption[] = [
  ...RESOLUTIONS_16_9,
  ...RESOLUTIONS_9_16,
]

export function getResolutionsForAspectRatio(aspectRatioLabel: string): ResolutionOption[] {
  switch (aspectRatioLabel) {
    case "16:9":
      return RESOLUTIONS_16_9
    case "9:16":
      return RESOLUTIONS_9_16
    case "1:1":
      return RESOLUTIONS_1_1
    case "4:3":
      return RESOLUTIONS_4_3
    case "4:5":
      return RESOLUTIONS_4_5
    case "21:9":
      return RESOLUTIONS_21_9
    default:
      return RESOLUTIONS_16_9
  }
}

export function getDefaultResolutionForAspectRatio(aspectRatioLabel: string): ResolutionOption {
  const resolutions = getResolutionsForAspectRatio(aspectRatioLabel)
  return resolutions.length > 1 ? resolutions[1] : resolutions[0]
}

export interface TimelineStudioSequenceLike {
  id: string
}

export interface TimelineStudioProjectSettings extends ProjectSettings {
  audio: {
    sampleRate: number
    bitDepth: number
    channels: number
    masterVolume?: number
    panLaw?: "-3dB" | "-4.5dB" | "-6dB"
  }
  [key: string]: unknown
}

export interface TimelineStudioProjectMetadata {
  id: string
  name?: string
  [key: string]: unknown
}

export interface TimelineStudioProject {
  metadata: TimelineStudioProjectMetadata
  settings: TimelineStudioProjectSettings
  sequences: Map<string, TimelineStudioSequenceLike>
  activeSequenceId: string
  [key: string]: unknown
}

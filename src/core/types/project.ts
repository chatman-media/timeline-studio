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

export const COMMON_FRAMERATES = FRAME_RATES.map((fr) => Number.parseInt(fr.value, 10)).filter(
  (fr) => !Number.isNaN(fr),
)

export const COMMON_RESOLUTIONS: ResolutionOption[] = [
  { value: "1280x720", label: "1280x720 (HD)", width: 1280, height: 720 },
  { value: "1920x1080", label: "1920x1080 (Full HD)", width: 1920, height: 1080 },
  { value: "2560x1440", label: "2560x1440 (2K QHD)", width: 2560, height: 1440 },
  { value: "3840x2160", label: "3840x2160 (4K UHD)", width: 3840, height: 2160 },
  { value: "720x1280", label: "720x1280 (HD)", width: 720, height: 1280 },
  { value: "1080x1920", label: "1080x1920 (Full HD)", width: 1080, height: 1920 },
  { value: "1440x2560", label: "1440x2560 (2K QHD)", width: 1440, height: 2560 },
  { value: "2160x3840", label: "2160x3840 (4K UHD)", width: 2160, height: 3840 },
]

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

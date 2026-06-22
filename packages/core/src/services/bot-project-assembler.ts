import type { AspectRatio, Clip, ProjectSchema, Track } from "@/types/contracts/project-schema"

import type {
  BotProjectAssemblyOptions,
  BotProjectAssemblyResolution,
  BotRenderJobMediaInput,
  BotRenderJobOutput,
  BotRenderJobRequest,
} from "../types"

const DEFAULT_CLIP_DURATION_SECONDS = 5
const DEFAULT_FPS = 30
const DEFAULT_SAMPLE_RATE = 48000
const MAX_TRACK_VOLUME = 2
const FULL_MUSIC_VOLUME = 1
const DUCKED_MUSIC_VOLUME = 0.3

type MediaKind = "video" | "image" | "audio"

const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "aac", "m4a", "flac", "ogg"])
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "bmp", "webp"])

export function withBotProjectSchema(
  request: BotRenderJobRequest,
  options: BotProjectAssemblyOptions = {},
): BotRenderJobRequest {
  if (request.project) return request

  const schema = createBotProjectSchemaFromRenderJob(request, options)
  if (!schema) return request

  return {
    ...request,
    project: {
      type: "inline",
      schema,
    },
  }
}

export function createBotProjectSchemaFromRenderJob(
  request: BotRenderJobRequest,
  options: BotProjectAssemblyOptions = {},
): ProjectSchema | null {
  const media = request.media ?? []
  if (media.length === 0) return null

  const now = options.now?.() ?? new Date().toISOString()
  const clipDuration = resolveClipDuration(request, options)
  const resolution = resolveResolution(request.output.resolution, options.resolution)
  const aspectRatio = resolveAspectRatio(resolution)
  const fps = options.fps ?? DEFAULT_FPS
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE

  // Audio/music media must live on a dedicated Audio track, otherwise the Rust
  // renderer treats it as a video input on the no-AI fallback path. Visual media
  // (video + image) stays on the Video track and lays out sequentially.
  const visualClips: Clip[] = []
  const audioClips: Clip[] = []
  let hasVideo = false
  media.forEach((item, index) => {
    const kind = detectMediaKind(item)
    if (kind === "audio") {
      audioClips.push(createClip(item, index, audioClips.length, kind, request, clipDuration))
    } else {
      if (kind === "video") hasVideo = true
      visualClips.push(createClip(item, index, visualClips.length, kind, request, clipDuration))
    }
  })

  const duration = Math.max(...[...visualClips, ...audioClips].map((clip) => clip.end_time), clipDuration)
  const tracks: Track[] = [
    {
      id: "bot-video-track",
      track_type: "Video",
      name: "Bot Video",
      enabled: true,
      volume: 1,
      locked: false,
      clips: visualClips,
      effects: [],
      filters: [],
    },
  ]
  if (audioClips.length > 0) {
    tracks.push({
      id: "bot-audio-track",
      track_type: "Audio",
      name: "Bot Audio",
      enabled: true,
      volume: resolveMusicVolume(request, options, hasVideo),
      locked: false,
      clips: audioClips,
      effects: [],
      filters: [],
    })
  }

  return {
    version: "1.0.0",
    metadata: {
      name: options.projectName ?? stringParam(request.params?.title) ?? defaultProjectName(request),
      description: stringParam(request.params?.description) ?? stringParam(request.params?.caption) ?? null,
      created_at: now,
      modified_at: now,
      author: options.author ?? "bot",
    },
    timeline: {
      duration,
      fps,
      resolution,
      sample_rate: sampleRate,
      aspect_ratio: aspectRatio,
    },
    tracks,
    effects: [],
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [],
    settings: {
      export: {
        format: "Mp4",
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      },
      preview: {
        resolution: previewResolution(resolution),
        quality: 75,
        fps,
        format: "Jpeg",
      },
      custom: {
        bot: {
          ...(request.templateId ? { templateId: request.templateId } : {}),
          ...(request.projectId ? { projectId: request.projectId } : {}),
          ...(request.params ? { params: request.params } : {}),
          destination: request.output.destination ?? "file",
        },
      },
      output: {
        format: "Mp4",
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        duration,
      },
      resolution: {
        width: resolution[0],
        height: resolution[1],
      },
      frame_rate: fps,
      aspect_ratio: aspectRatio,
    },
  }
}

function createClip(
  media: BotRenderJobMediaInput,
  index: number,
  position: number,
  kind: MediaKind,
  request: BotRenderJobRequest,
  clipDuration: number,
): Clip {
  const isAudio = kind === "audio"
  // Audio clips span the whole track from 0 for the music length; visual clips
  // lay out sequentially by their position on the Video track.
  const duration = isAudio ? resolveMediaDuration(media, clipDuration) : clipDuration
  const start = isAudio ? 0 : position * clipDuration
  const customMetadata: Record<string, unknown> = {
    source: "bot",
    mediaType: kind,
  }

  if (media.name) customMetadata.name = media.name
  if (media.mimeType) customMetadata.mimeType = media.mimeType
  if (media.metadata) customMetadata.media = media.metadata

  return {
    id: createClipId(media, index),
    source: createClipSource(media),
    start_time: start,
    end_time: start + duration,
    source_start: 0,
    source_end: duration,
    speed: 1,
    opacity: 1,
    effects: [],
    filters: [],
    template_id: isAudio ? null : (request.templateId ?? null),
    template_position: !isAudio && request.templateId ? position : null,
    color_correction: null,
    crop: null,
    transform: null,
    audio_track_index: null,
    properties: {
      notes: media.name ?? null,
      tags: ["bot"],
      custom_metadata: customMetadata,
    },
  }
}

function detectMediaKind(media: BotRenderJobMediaInput): MediaKind {
  const mimeType = media.mimeType?.toLowerCase().trim()
  if (mimeType) {
    if (mimeType.startsWith("audio/")) return "audio"
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
  }

  const extension = fileExtension(media.name ?? media.value)
  if (AUDIO_EXTENSIONS.has(extension)) return "audio"
  if (IMAGE_EXTENSIONS.has(extension)) return "image"

  return "video"
}

function fileExtension(pathOrName: string): string {
  const withoutQuery = pathOrName.split(/[?#]/, 1)[0]
  const base = withoutQuery.slice(Math.max(withoutQuery.lastIndexOf("/"), withoutQuery.lastIndexOf("\\")) + 1)
  const dot = base.lastIndexOf(".")
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : ""
}

function resolveMediaDuration(media: BotRenderJobMediaInput, fallback: number): number {
  return positiveNumber(media.metadata?.duration) ?? fallback
}

function resolveMusicVolume(
  request: BotRenderJobRequest,
  options: BotProjectAssemblyOptions,
  hasVideo: boolean,
): number {
  // Explicit overrides win; otherwise duck the music under video (which may carry
  // speech) and keep full volume for an image-only slideshow.
  return (
    clampVolume(options.musicVolume) ??
    clampVolume(request.params?.musicVolume) ??
    (hasVideo ? DUCKED_MUSIC_VOLUME : FULL_MUSIC_VOLUME)
  )
}

function clampVolume(value: unknown): number | undefined {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number.parseFloat(value)
        : Number.NaN
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return Math.min(parsed, MAX_TRACK_VOLUME)
}

function createClipSource(media: BotRenderJobMediaInput): Clip["source"] {
  return media.type === "url" || isUrl(media.value) ? { Stream: media.value } : { File: media.value }
}

function createClipId(media: BotRenderJobMediaInput, index: number): string {
  const source = media.name ?? media.value
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  return `bot-clip-${index + 1}${slug ? `-${slug}` : ""}`
}

function resolveClipDuration(request: BotRenderJobRequest, options: BotProjectAssemblyOptions): number {
  return (
    positiveNumber(request.params?.clipDurationSeconds) ??
    positiveNumber(request.params?.clipDuration) ??
    positiveNumber(options.defaultClipDurationSeconds) ??
    DEFAULT_CLIP_DURATION_SECONDS
  )
}

function resolveResolution(
  outputResolution: BotRenderJobOutput["resolution"],
  optionResolution?: BotProjectAssemblyResolution,
): [number, number] {
  if (Array.isArray(optionResolution)) {
    return [optionResolution[0], optionResolution[1]]
  }

  switch (optionResolution ?? outputResolution) {
    case "720p":
      return [1280, 720]
    case "4k":
      return [3840, 2160]
    default:
      return [1920, 1080]
  }
}

function resolveAspectRatio([width, height]: [number, number]): AspectRatio {
  const ratio = width / height

  if (isClose(ratio, 16 / 9)) return "Ratio16x9"
  if (isClose(ratio, 4 / 3)) return "Ratio4x3"
  if (isClose(ratio, 21 / 9)) return "Ratio21x9"
  if (isClose(ratio, 1)) return "Ratio1x1"
  if (isClose(ratio, 9 / 16)) return "Ratio9x16"

  return { Custom: ratio }
}

function previewResolution([width, height]: [number, number]): [number, number] {
  if (width <= 1280 && height <= 720) return [width, height]

  const scale = Math.min(1280 / width, 720 / height)
  return [Math.round(width * scale), Math.round(height * scale)]
}

function defaultProjectName(request: BotRenderJobRequest): string {
  return request.templateId ? `Bot ${request.templateId}` : "Bot Render Job"
}

function stringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function positiveNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }

  return undefined
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://")
}

function isClose(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) < 0.01
}

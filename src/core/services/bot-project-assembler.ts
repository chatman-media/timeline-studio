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
  const clips = media.map((item, index) => createClip(item, index, request, clipDuration))
  const duration = Math.max(...clips.map((clip) => clip.end_time), clipDuration)
  const track: Track = {
    id: "bot-video-track",
    track_type: "Video",
    name: "Bot Video",
    enabled: true,
    volume: 1,
    locked: false,
    clips,
    effects: [],
    filters: [],
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
    tracks: [track],
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
  request: BotRenderJobRequest,
  duration: number,
): Clip {
  const start = index * duration
  const customMetadata: Record<string, unknown> = {
    source: "bot",
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
    template_id: request.templateId ?? null,
    template_position: request.templateId ? index : null,
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

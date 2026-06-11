/**
 * AI tool for selecting and inserting existing music/audio media on the timeline.
 */

import type { TimelineTrack } from "@timeline-studio/domains/video-editing/types"
import {
  type AIToolExecutionOptions,
  type AIToolLogger,
  type AIToolMetadata,
  type AIToolResult,
  BaseAITool,
} from "../../../base"
import { getTimelineStateAccess } from "./types"

export type MusicWorkflowOperation = "list_audio_media" | "select_audio_media" | "insert_music"

export interface MusicWorkflowInput {
  operation: MusicWorkflowOperation
  mediaId?: string
  mood?: string
  bpm?: number
  minDuration?: number
  maxDuration?: number
  trackId?: string
  trackName?: string
  startTime?: number
  createTrackIfMissing?: boolean
}

export interface MusicMediaCandidate {
  id: string
  name: string
  duration?: number
  mood?: string
  bpm?: number
  path?: string
  source: "resources.music" | "resources.media" | "media_pool"
  file?: any
}

export interface MusicWorkflowResult {
  operation: MusicWorkflowOperation
  candidates?: MusicMediaCandidate[]
  selected?: MusicMediaCandidate
  trackId?: string
  clipId?: string
  createdTrack?: boolean
  warnings?: string[]
}

export class MusicWorkflowTool extends BaseAITool {
  public readonly metadata: AIToolMetadata = {
    name: "music-workflow",
    displayName: "Music Workflow Tool",
    description: "Select and insert existing music/audio media on the timeline",
    domain: "core",
    category: "timeline",
    version: "1.0.0",
  }

  constructor(logger?: AIToolLogger) {
    super(undefined, logger)
  }

  validate(input: any): boolean {
    return input && typeof input === "object" && typeof input.operation === "string"
  }

  getSchema() {
    return {
      input: {
        operation: ["list_audio_media", "select_audio_media", "insert_music"],
        mediaId: "string",
        trackId: "string",
        startTime: "number",
      },
      output: {},
    }
  }

  async execute(input: any, options?: AIToolExecutionOptions): Promise<AIToolResult<MusicWorkflowResult>> {
    return this.runMusicWorkflow(input as MusicWorkflowInput, options)
  }

  public async runMusicWorkflow(
    input: MusicWorkflowInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<MusicWorkflowResult>> {
    return this.executeWithErrorHandling(
      async () => {
        const timelineAccess = getTimelineStateAccess()
        if (!timelineAccess) {
          throw new Error("Timeline state access is not configured")
        }

        const project = timelineAccess.getCurrentProject() as any
        if (!project?.id) {
          throw new Error("No active timeline project for music workflow")
        }

        const candidates = filterCandidates(findAudioMediaCandidates(project), input)

        switch (input.operation) {
          case "list_audio_media":
            return {
              operation: input.operation,
              candidates,
              warnings: candidates.length === 0 ? ["No audio/music media candidates found"] : undefined,
            }
          case "select_audio_media": {
            const selected = selectMusicCandidate(candidates, input)
            return {
              operation: input.operation,
              candidates,
              selected,
            }
          }
          case "insert_music":
            return insertMusicCandidate(project, timelineAccess, candidates, input)
          default:
            throw new Error(`Unsupported music workflow operation: ${input.operation}`)
        }
      },
      input,
      {
        timeout: options.timeout || 45000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation: input.operation,
          ...options.metadata,
        },
      },
    )
  }
}

async function insertMusicCandidate(
  project: any,
  timelineAccess: NonNullable<ReturnType<typeof getTimelineStateAccess>>,
  candidates: MusicMediaCandidate[],
  input: MusicWorkflowInput,
): Promise<MusicWorkflowResult> {
  const selected = selectMusicCandidate(candidates, input)
  const warnings: string[] = []
  const { trackId, createdTrack } = await resolveMusicTrack(project, timelineAccess, input)
  const startTime = finiteOptionalNumber(input.startTime, "startTime") ?? 0

  const clipResult = await timelineAccess.addClip({
    trackId,
    mediaId: selected.id,
    resourceId: selected.id,
    mediaFile: selected.file ?? selected.id,
    startTime,
    time: startTime,
    duration: selected.duration,
    contentType: "audio",
  })
  const clipId = extractId(clipResult, ["id", "clipId", "clip_id"])

  if (!clipId) {
    warnings.push("Music clip insertion completed without a returned clip id")
  }

  return {
    operation: input.operation,
    selected,
    trackId,
    clipId,
    createdTrack,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

async function resolveMusicTrack(
  project: any,
  timelineAccess: NonNullable<ReturnType<typeof getTimelineStateAccess>>,
  input: MusicWorkflowInput,
): Promise<{ trackId: string; createdTrack: boolean }> {
  if (input.trackId?.trim()) {
    return { trackId: input.trackId.trim(), createdTrack: false }
  }

  const existingMusicTrack = getAllTracks(project).find((track) => String(track.type).toLowerCase() === "music")
  if (existingMusicTrack?.id) {
    return { trackId: existingMusicTrack.id, createdTrack: false }
  }

  if (input.createTrackIfMissing === false) {
    throw new Error("No Music track exists and createTrackIfMissing is false")
  }

  const trackResult = await timelineAccess.createTrack({
    type: "music",
    name: input.trackName || "Music",
  })
  const trackId = extractId(trackResult, ["id", "trackId", "track_id"])
  if (!trackId) {
    throw new Error("Music track creation did not return a track id")
  }

  return { trackId, createdTrack: true }
}

function findAudioMediaCandidates(project: any): MusicMediaCandidate[] {
  const candidates = new Map<string, MusicMediaCandidate>()

  addCandidates(candidates, project.resources?.music, "resources.music")
  addCandidates(candidates, project.resources?.media, "resources.media")

  const mediaPoolItems = project.media_pool?.items ?? project.mediaPool?.items
  if (mediaPoolItems && typeof mediaPoolItems === "object") {
    for (const item of Object.values(mediaPoolItems)) {
      const candidate = candidateFromMediaPoolItem(item)
      if (candidate) {
        candidates.set(candidate.id, candidate)
      }
    }
  }

  return Array.from(candidates.values())
}

function addCandidates(
  candidates: Map<string, MusicMediaCandidate>,
  resources: unknown,
  source: MusicMediaCandidate["source"],
): void {
  if (!Array.isArray(resources)) return

  for (const resource of resources) {
    const candidate = candidateFromResource(resource, source)
    if (candidate) {
      candidates.set(candidate.id, candidate)
    }
  }
}

function candidateFromResource(
  resource: any,
  source: MusicMediaCandidate["source"],
): MusicMediaCandidate | null {
  if (!resource || typeof resource !== "object") return null

  const file = resource.file && typeof resource.file === "object" ? resource.file : resource
  const id = String(resource.resourceId ?? resource.id ?? file.id ?? "").trim()
  if (!id || !isAudioLikeResource(resource, file)) return null

  return {
    id,
    name: String(resource.name ?? file.name ?? id),
    duration: finiteOptionalNumber(file.duration ?? resource.duration, "duration"),
    mood: readOptionalString(resource.params?.mood ?? resource.metadata?.mood ?? file.mood ?? file.metadata?.mood),
    bpm: finiteOptionalNumber(resource.params?.bpm ?? resource.metadata?.bpm ?? file.bpm ?? file.metadata?.bpm, "bpm"),
    path: typeof file.path === "string" ? file.path : typeof resource.path === "string" ? resource.path : undefined,
    source,
    file,
  }
}

function candidateFromMediaPoolItem(item: any): MusicMediaCandidate | null {
  if (!item || typeof item !== "object") return null

  const mediaType = String(item.media_type ?? item.mediaType ?? item.type ?? "").toLowerCase()
  if (!["audio", "music"].some((type) => mediaType.includes(type))) return null

  const id = String(item.id ?? "").trim()
  if (!id) return null

  const file = {
    id,
    name: item.name ?? id,
    path: item.path,
    type: "audio",
    isAudio: true,
    isVideo: false,
    isImage: false,
    duration: item.duration ?? 0,
  }

  return {
    id,
    name: String(item.name ?? id),
    duration: finiteOptionalNumber(item.duration, "duration"),
    mood: readOptionalString(item.metadata?.mood),
    bpm: finiteOptionalNumber(item.metadata?.bpm, "bpm"),
    path: typeof item.path === "string" ? item.path : undefined,
    source: "media_pool",
    file,
  }
}

function isAudioLikeResource(resource: any, file: any): boolean {
  if (resource.type === "music" || file.type === "music" || file.type === "audio") return true
  if (file.isAudio === true || resource.isAudio === true) return true

  const path = String(file.path ?? resource.path ?? "").toLowerCase()
  return [".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"].some((extension) => path.endsWith(extension))
}

function filterCandidates(candidates: MusicMediaCandidate[], input: MusicWorkflowInput): MusicMediaCandidate[] {
  const minDuration = finiteOptionalNumber(input.minDuration, "minDuration")
  const maxDuration = finiteOptionalNumber(input.maxDuration, "maxDuration")
  const targetBpm = finiteOptionalNumber(input.bpm, "bpm")
  const targetMood = input.mood?.trim().toLowerCase()

  return candidates.filter((candidate) => {
    if (minDuration !== undefined && (candidate.duration ?? 0) < minDuration) return false
    if (maxDuration !== undefined && candidate.duration !== undefined && candidate.duration > maxDuration) return false
    if (targetBpm !== undefined && (candidate.bpm === undefined || Math.abs(candidate.bpm - targetBpm) > 5)) {
      return false
    }
    if (targetMood && !candidate.mood?.toLowerCase().includes(targetMood)) return false
    return true
  })
}

function selectMusicCandidate(candidates: MusicMediaCandidate[], input: MusicWorkflowInput): MusicMediaCandidate {
  if (input.mediaId?.trim()) {
    const mediaId = input.mediaId.trim()
    const selected = candidates.find((candidate) => candidate.id === mediaId)
    if (!selected) {
      throw new Error(`Audio/music media candidate not found: ${mediaId}`)
    }
    return selected
  }

  const selected = candidates[0]
  if (!selected) {
    throw new Error("No audio/music media candidates found")
  }
  return selected
}

function getAllTracks(project: any): TimelineTrack[] {
  return [
    ...(Array.isArray(project.globalTracks) ? project.globalTracks : []),
    ...(Array.isArray(project.sections) ? project.sections.flatMap((section: any) => section.tracks || []) : []),
  ]
}

function finiteOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`)
  }
  return value
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function extractId(value: any, keys: string[]): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (!value || typeof value !== "object") return undefined

  for (const key of keys) {
    const id = value[key]
    if (typeof id === "string" && id.trim()) return id.trim()
  }

  return undefined
}

export const musicWorkflowTool = new MusicWorkflowTool()

export async function runMusicWorkflow(params: MusicWorkflowInput): Promise<AIToolResult<MusicWorkflowResult>> {
  return musicWorkflowTool.runMusicWorkflow(params)
}

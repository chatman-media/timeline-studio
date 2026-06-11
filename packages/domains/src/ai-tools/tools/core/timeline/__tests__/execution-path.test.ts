import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { setTimelineStateAccess } from "../types"
import { trackCreationTool } from "../create-tracks"
import { clipManagementTool } from "../manage-clips"
import { musicWorkflowTool } from "../music-workflow"
import { clipPlacementTool } from "../place-clips"
import { musicSyncTool } from "../sync-music"

describe("timeline AI tool execution path", () => {
  let project: any
  let nextTrackId: number
  let nextClipId: number

  beforeEach(() => {
    nextTrackId = 1
    nextClipId = 1
    project = {
      id: "project-1",
      name: "AI Timeline Test",
      globalTracks: [],
      sections: [],
      resources: {
        music: [],
        media: [],
      },
    }

    setTimelineStateAccess({
      getCurrentProject: () => project,
      createProject: async (nextProject: any) => {
        project = nextProject
      },
      updateProject: async (updates: any) => {
        project = { ...project, ...updates }
      },
      createSection: async (section: any) => section,
      createTrack: async (track: any) => {
        const createdTrack = {
          id: track.id ?? `music-track-${nextTrackId++}`,
          name: track.name ?? "Music",
          type: track.type,
          order: project.globalTracks.length,
          clips: [],
        }
        project.globalTracks.push(createdTrack)
        return createdTrack
      },
      addClip: async (clip: any) => {
        const targetTrack = project.globalTracks.find((track: any) => track.id === clip.trackId)
        if (!targetTrack) {
          throw new Error(`Track not found: ${clip.trackId}`)
        }
        const createdClip = {
          id: clip.id ?? `music-clip-${nextClipId++}`,
          trackId: clip.trackId,
          mediaId: clip.mediaId ?? clip.resourceId,
          startTime: clip.startTime ?? clip.time ?? 0,
          duration: clip.duration ?? clip.mediaFile?.duration ?? 5,
          mediaFile: clip.mediaFile,
        }
        targetTrack.clips.push(createdClip)
        return createdClip
      },
      getProjectStats: () => ({
        totalDuration: 0,
        totalClips: 0,
        totalTracks: project.globalTracks.length,
        totalSections: project.sections.length,
      }),
      sendTimelineCommand: async () => undefined,
    })
  })

  afterEach(() => {
    setTimelineStateAccess(null)
  })

  it("creates tracks when execute() is called from AI Chat", async () => {
    const result = await trackCreationTool.execute({
      tracks: [{ type: "video", name: "AI Video" }],
    })

    expect(result.success).toBe(true)
    expect(project.globalTracks).toHaveLength(1)
    expect(project.globalTracks[0]).toMatchObject({
      name: "AI Video",
      type: "video",
      clips: [],
    })
  })

  it("places clips into a real timeline track when execute() is called from AI Chat", async () => {
    project.globalTracks.push({
      id: "track-video-1",
      name: "Video 1",
      type: "video",
      order: 0,
      clips: [],
    })

    const result = await clipPlacementTool.execute({
      clips: [{ resourceId: "media-1", name: "Clip 1", duration: 3, startTime: 1 }],
      strategy: "manual",
      trackAssignment: "smart",
    })

    expect(result.success).toBe(true)
    expect(project.globalTracks[0].clips).toHaveLength(1)
    expect(project.globalTracks[0].clips[0]).toMatchObject({
      name: "Clip 1",
      trackId: "track-video-1",
      mediaId: "media-1",
      startTime: 1,
      duration: 3,
    })
  })

  it("fails clearly when execute() cannot place clips", async () => {
    const result = await clipPlacementTool.execute({
      clips: [{ resourceId: "media-1", name: "Clip 1", duration: 3, startTime: 1 }],
      strategy: "manual",
      trackAssignment: "smart",
    })

    expect(result.success).toBe(false)
    expect(result.errors?.[0]).toContain("Нет доступных треков")
  })

  it("analyzes real timeline clips when manage-clips execute() is called from AI Chat", async () => {
    project.globalTracks.push({
      id: "track-video-1",
      name: "Video 1",
      type: "video",
      order: 0,
      clips: [
        {
          id: "clip-1",
          name: "Clip 1",
          trackId: "track-video-1",
          mediaId: "media-1",
          startTime: 0,
          duration: 3,
          effects: [],
          filters: [],
          transitions: [],
        },
      ],
    })

    const result = await clipManagementTool.execute({
      operation: "analyze",
      scope: "all",
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      operation: "analyze",
      processedClips: 1,
      clipAnalysis: {
        totalClips: 1,
      },
    })
  })

  it("returns a clear failure for unsupported timeline operations", async () => {
    const result = await clipManagementTool.execute({
      operation: "unsupported",
    })

    expect(result.success).toBe(false)
    expect(result.errors).toContain("Неподдерживаемая операция: unsupported")
  })

  it("inserts an existing audio resource into a real Music track", async () => {
    project.resources.music.push({
      id: "audio-1",
      name: "Launch theme",
      path: "/media/launch-theme.mp3",
      type: "audio",
      isAudio: true,
      duration: 18,
    })

    const result = await musicWorkflowTool.execute({
      operation: "insert_music",
      mediaId: "audio-1",
      trackName: "AI Music",
      startTime: 2,
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      selected: { id: "audio-1" },
      trackId: "music-track-1",
      clipId: "music-clip-1",
      createdTrack: true,
    })
    expect(project.globalTracks[0]).toMatchObject({
      id: "music-track-1",
      name: "AI Music",
      type: "music",
    })
    expect(project.globalTracks[0].clips[0]).toMatchObject({
      id: "music-clip-1",
      mediaId: "audio-1",
      startTime: 2,
      duration: 18,
    })
  })

  it("fails music sync auto beat detection instead of generating heuristic beats", async () => {
    project.globalTracks.push({
      id: "music-track-1",
      name: "Music",
      type: "music",
      order: 0,
      clips: [
        {
          id: "music-clip-1",
          trackId: "music-track-1",
          mediaId: "audio-1",
          startTime: 0,
          duration: 18,
          mediaFile: {
            id: "audio-1",
            isAudio: true,
            type: "audio",
          },
        },
      ],
    })

    const result = await musicSyncTool.execute({
      musicTrackId: "music-track-1",
      syncOptions: { beatDetection: "auto" },
    })

    expect(result.success).toBe(false)
    expect(result.errors?.join(" ")).toContain("Real beat detection is not configured")
  })
})

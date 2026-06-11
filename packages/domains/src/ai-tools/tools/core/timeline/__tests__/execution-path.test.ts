import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { setTimelineStateAccess } from "../types"
import { trackCreationTool } from "../create-tracks"
import { clipManagementTool } from "../manage-clips"
import { clipPlacementTool } from "../place-clips"

describe("timeline AI tool execution path", () => {
  let project: any

  beforeEach(() => {
    project = {
      id: "project-1",
      name: "AI Timeline Test",
      globalTracks: [],
      sections: [],
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
      createTrack: async (track: any) => track,
      addClip: async (clip: any) => clip,
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
})

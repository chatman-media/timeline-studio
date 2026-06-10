/**
 * Video Editing Orchestrator Tests
 *
 * Тесты для координатора работы машин видеоредактирования
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { VideoEditingOrchestrator } from "../../services/video-editing-orchestrator"

// Mock dependencies
vi.mock("@timeline-studio/domains/project-management/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onStateChange: vi.fn((_callback) => {
      // Return unsubscribe function
      return () => {}
    }),
    executeCommand: vi.fn().mockResolvedValue(undefined),
    getState: vi.fn().mockReturnValue({
      project: null,
      playback_state: null,
      ui_state: null,
    }),
  })),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("VideoEditingOrchestrator", () => {
  let orchestrator: VideoEditingOrchestrator

  beforeEach(() => {
    // Reset singleton
    ;(VideoEditingOrchestrator as any).instance = null
    orchestrator = VideoEditingOrchestrator.getInstance()
  })

  afterEach(() => {
    if (orchestrator) {
      orchestrator.stop()
    }
  })

  describe("Singleton Pattern", () => {
    it("should return same instance on multiple calls", () => {
      const instance1 = VideoEditingOrchestrator.getInstance()
      const instance2 = VideoEditingOrchestrator.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should create new instance after stop", () => {
      const instance1 = VideoEditingOrchestrator.getInstance()
      instance1.stop()

      const instance2 = VideoEditingOrchestrator.getInstance()
      expect(instance2).not.toBe(instance1)
    })
  })

  describe("Initialization", () => {
    it("should initialize all actors", () => {
      const actors = orchestrator.getActors()

      expect(actors.timeline).toBeDefined()
      expect(actors.player).toBeDefined()
    })
  })

  describe("Project Management", () => {
    it("should create project", async () => {
      await orchestrator.createProject("Test Project", {
        resolution: { width: 1920, height: 1080 },
      })

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should load project", async () => {
      await orchestrator.loadProject("/test/project.tlsp")

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should save project", async () => {
      await orchestrator.saveProject()

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("Playback Control", () => {
    it("should send play event to actors", () => {
      orchestrator.play()

      // Verify orchestrator doesn't throw
      expect(orchestrator.getPlayerState()).toBeDefined()
      expect(orchestrator.getTimelineState()).toBeDefined()
    })

    it("should send pause event to actors", () => {
      orchestrator.play()
      orchestrator.pause()

      // Verify orchestrator doesn't throw
      expect(orchestrator.getPlayerState()).toBeDefined()
    })

    it("should send stop event to actors", () => {
      orchestrator.play()
      orchestrator.stopPlayback()

      // Verify orchestrator doesn't throw
      expect(orchestrator.getPlayerState()).toBeDefined()
    })

    it("should send seek event to actors", () => {
      const seekTime = 10.5
      orchestrator.seek(seekTime)

      // Verify orchestrator doesn't throw
      expect(orchestrator.getPlayerState()).toBeDefined()
    })
  })

  describe("Track Management", () => {
    it("should add track", async () => {
      await orchestrator.addTrack("video", "Video Track 1")

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should add track to section", async () => {
      await orchestrator.addTrack("audio", "Audio Track", "section-1")

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("Clip Management", () => {
    const mockMediaFile = {
      id: "media-1",
      name: "test-video.mp4",
      path: "/test/video.mp4",
      type: "video",
      duration: 60,
      size: 1024 * 1024,
    }

    it("should add clip to track", async () => {
      await orchestrator.addClip("track-1", mockMediaFile, 0)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should move clip", async () => {
      await orchestrator.moveClip("clip-1", "track-2", 5)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should delete clip", async () => {
      await orchestrator.deleteClip("clip-1")

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should trim clip", async () => {
      await orchestrator.trimClip("clip-1", 5, 10)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should split clip", async () => {
      await orchestrator.splitClip("clip-1", 7.5)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should update clip", async () => {
      await orchestrator.updateClip("clip-1", {
        volume: 0.8,
        opacity: 0.9,
      })

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("Clipboard Operations", () => {
    it("should copy clips", async () => {
      await orchestrator.copyClips(["clip-1", "clip-2"])

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should cut clips", async () => {
      await orchestrator.cutClips(["clip-1"])

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should paste clips", async () => {
      await orchestrator.pasteClips("track-1", 10)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("Batch Operations", () => {
    it("should batch update clips", async () => {
      const updates = [
        { clip_id: "clip-1", updates: { volume: 0.5 } },
        { clip_id: "clip-2", updates: { volume: 0.7 } },
      ]

      await orchestrator.batchUpdateClips(updates)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("Selection Management", () => {
    it("should select clips", async () => {
      await orchestrator.selectClips(["clip-1", "clip-2"], false)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should add to selection", async () => {
      await orchestrator.selectClips(["clip-1"], false)
      await orchestrator.selectClips(["clip-2"], true)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should clear selection", async () => {
      await orchestrator.selectClips(["clip-1"], false)
      await orchestrator.clearSelection()

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should select sections", async () => {
      await orchestrator.selectSections(["section-1"], false)

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("State Access", () => {
    it("should get timeline state", () => {
      const state = orchestrator.getTimelineState()

      expect(state).toBeDefined()
      expect(state.context).toBeDefined()
    })

    it("should get player state", () => {
      const state = orchestrator.getPlayerState()

      expect(state).toBeDefined()
      expect(state.context).toBeDefined()
      expect(state.context.isPlaying).toBe(false)
    })

    it("should get all actors", () => {
      const actors = orchestrator.getActors()

      expect(actors.timeline).toBeDefined()
      expect(actors.player).toBeDefined()
    })
  })

  describe("Subscriptions", () => {
    it("should subscribe to timeline changes", () => {
      const callback = vi.fn()
      const unsubscribe = orchestrator.subscribeToTimeline(callback)

      // Subscription returns valid unsubscribe function
      expect(unsubscribe).toBeDefined()
      expect(typeof unsubscribe.unsubscribe).toBe("function")

      unsubscribe.unsubscribe()
    })

    it("should subscribe to player changes", () => {
      const callback = vi.fn()
      const unsubscribe = orchestrator.subscribeToPlayer(callback)

      expect(unsubscribe).toBeDefined()
      unsubscribe.unsubscribe()
    })
  })

  describe("Command Execution", () => {
    it("should execute backend command", async () => {
      const command = {
        type: "AddClip" as const,
        params: {
          track_id: "track-1",
          media_id: "media-1",
          time: 0,
        },
      }

      // Command execution should not throw and should return data
      const result = await orchestrator.executeCommand(command)
      // result is now the data from backend, not the full response
      expect(result).toBeNull() // mock backend returns { success: true, data: null }
    })
  })

  describe("Actor Synchronization", () => {
    it("should have synchronized actors", () => {
      const playerState = orchestrator.getPlayerState()
      const timelineState = orchestrator.getTimelineState()

      // Actors should be initialized and accessible
      expect(playerState.context).toBeDefined()
      expect(timelineState.context).toBeDefined()
    })

    it("should sync timeline selection with player", async () => {
      const timelineActor = orchestrator.getActors().timeline

      timelineActor.send({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1"],
        addToSelection: false,
      })

      // Дожидаемся следующего тика для синхронизации
      await new Promise((resolve) => setTimeout(resolve, 50))

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })
  })

  describe("Cleanup", () => {
    it("should reset singleton instance on stop", () => {
      const instance1 = VideoEditingOrchestrator.getInstance()
      instance1.stop()

      const instance2 = VideoEditingOrchestrator.getInstance()
      expect(instance2).not.toBe(instance1)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty clip list in batch update", async () => {
      await orchestrator.batchUpdateClips([])

      const timelineState = orchestrator.getTimelineState()
      expect(timelineState).toBeDefined()
    })

    it("should handle pause when not playing", () => {
      orchestrator.pause()

      const playerState = orchestrator.getPlayerState()
      expect(playerState).toBeDefined()
    })
  })
})

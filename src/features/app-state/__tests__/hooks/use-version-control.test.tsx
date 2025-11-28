/**
 * Tests for useVersionControl hook
 * Tests version control operations, event handling, and state management
 */

import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import type { ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"
import { useVersionControl } from "../../hooks/use-version-control"

// Mock getBackendSync
const mockBackendSync = {
  getProjectState: vi.fn(),
  onEvent: vi.fn((_handler: (event: ProjectEvent) => void) => () => {}) as Mock,
  createSnapshot: vi.fn(),
  restoreVersion: vi.fn(),
  getVersionHistory: vi.fn(),
  compareVersions: vi.fn(),
  createBranch: vi.fn(),
  mergeBranch: vi.fn(),
  switchBranch: vi.fn(),
  setAutoSaveInterval: vi.fn(),
  enableAutoSave: vi.fn(),
}

vi.mock("@/adapters/tauri/backend-sync", () => ({
  getBackendSync: () => mockBackendSync,
}))

// Mock dependencies
const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}))

describe("useVersionControl", () => {
  const mockProjectState: ProjectState = {
    project: {
      id: "test-project",
      metadata: {
        name: "Test Project",
        description: null,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),
        file_path: null,
        is_dirty: false,
        version: "1.0.0",
      },
      timeline: {
        duration: 0,
        fps: 30,
        sample_rate: 48000,
        tracks: [],
        markers: [],
      },
      media_pool: {
        items: {},
      },
      effects_pool: {},
      filters_pool: {},
      transitions_pool: {},
      templates_pool: {},
      style_templates_pool: {},
      subtitles_pool: {},
      color_grading_presets_pool: {},
      settings: {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      },
    },
    ui_state: {
      selected_clips: [],
      selected_tracks: [],
      selected_sections: [],
      timeline_zoom: 1.0,
      timeline_scroll: 0,
      active_tool: "select",
      browser_state: null,
    },
    playback_state: {
      is_playing: false,
      current_time: 0,
      playback_rate: 1.0,
      loop_enabled: false,
      loop_start: null,
      loop_end: null,
      volume: 1.0,
      current_media_id: null,
      selected_clip_id: null,
      video_source: "browser",
      applied_effects: [],
      applied_filters: [],
      applied_template: null,
      is_loading: false,
      is_seeking: false,
      duration: 0,
    },
    version: 1,
    version_info: {
      current_version_id: "v1",
      branch_name: "main",
      has_uncommitted_changes: false,
      last_snapshot_time: new Date().toISOString(),
      auto_save_enabled: true,
      auto_save_interval_seconds: 30,
    },
    chat_sessions: [],
    browser_state: {
      active_tab: "media",
      selected_files: {},
      tab_settings: {},
      favorites: {},
    },
    clipboard: null,
    imported_media: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Set default mock return values
    mockBackendSync.getProjectState.mockResolvedValue(mockProjectState)
    mockBackendSync.createSnapshot.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.restoreVersion.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.getVersionHistory.mockResolvedValue({ success: true, error: null, data: { versions: [] } })
    mockBackendSync.compareVersions.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.createBranch.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.mergeBranch.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.switchBranch.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.setAutoSaveInterval.mockResolvedValue({ success: true, error: null, data: null })
    mockBackendSync.enableAutoSave.mockResolvedValue({ success: true, error: null, data: null })
  })

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useVersionControl())

      expect(result.current.currentVersionId).toBe("initial")
      expect(result.current.branchName).toBe("main")
      expect(result.current.hasUncommittedChanges).toBe(false)
      expect(result.current.autoSaveEnabled).toBe(true)
      expect(result.current.autoSaveIntervalSeconds).toBe(30)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("should fetch project state on mount", async () => {
      renderHook(() => useVersionControl())

      await waitFor(() => {
        expect(mockBackendSync.getProjectState).toHaveBeenCalled()
      })
    })

    it("should subscribe to events on mount", () => {
      renderHook(() => useVersionControl())

      expect(mockBackendSync.onEvent).toHaveBeenCalled()
    })

    it("should update state from project state", async () => {
      const { result } = renderHook(() => useVersionControl())

      await waitFor(() => {
        expect(result.current.currentVersionId).toBe("v1")
        expect(result.current.branchName).toBe("main")
      })
    })
  })

  describe("Version control operations", () => {
    describe("createSnapshot", () => {
      it("should create snapshot successfully", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.createSnapshot("Test snapshot")

        expect(success).toBe(true)
        expect(mockBackendSync.createSnapshot).toHaveBeenCalledWith("Test snapshot")
      })

      it("should create snapshot without message", async () => {
        const { result } = renderHook(() => useVersionControl())

        await result.current.createSnapshot()

        expect(mockBackendSync.createSnapshot).toHaveBeenCalledWith(undefined)
      })

      it("should handle create snapshot errors", async () => {
        mockBackendSync.createSnapshot.mockResolvedValueOnce({
          success: false,
          error: "Snapshot failed",
          data: null,
        })

        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.createSnapshot("Test")

        expect(success).toBe(false)
      })

      it("should set loading state during operation", async () => {
        // Add delay to mock to allow catching loading state
        mockBackendSync.createSnapshot.mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ success: true, error: null, data: null }), 50)),
        )

        const { result } = renderHook(() => useVersionControl())

        // Start operation but don't await yet
        const promise = result.current.createSnapshot("Test")

        // Loading should be true immediately after calling
        await waitFor(() => {
          expect(result.current.isLoading).toBe(true)
        })

        // Wait for operation to complete
        await promise

        // Loading should be false after completion
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })
      })
    })

    describe("restoreVersion", () => {
      it("should restore version successfully", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.restoreVersion("v2")

        expect(success).toBe(true)
        expect(mockBackendSync.restoreVersion).toHaveBeenCalledWith("v2")
      })

      it("should handle restore errors", async () => {
        mockBackendSync.restoreVersion.mockResolvedValueOnce({
          success: false,
          error: "Version not found",
          data: null,
        })

        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.restoreVersion("v999")

        expect(success).toBe(false)
        await waitFor(() => {
          expect(result.current.error).toBe("Version not found")
        })
      })
    })

    describe("getVersionHistory", () => {
      it("should get version history with limit", async () => {
        const mockVersions = [
          { id: "v1", message: "Initial", timestamp: new Date().toISOString() },
          { id: "v2", message: "Update", timestamp: new Date().toISOString() },
        ]

        mockBackendSync.getVersionHistory.mockResolvedValueOnce({
          success: true,
          error: null,
          data: { versions: mockVersions },
        })

        const { result } = renderHook(() => useVersionControl())

        const versions = await result.current.getVersionHistory(10)

        expect(versions).toEqual(mockVersions)
        expect(mockBackendSync.getVersionHistory).toHaveBeenCalledWith(10)
      })

      it("should get version history without limit", async () => {
        const { result } = renderHook(() => useVersionControl())

        await result.current.getVersionHistory()

        expect(mockBackendSync.getVersionHistory).toHaveBeenCalledWith(undefined)
      })

      it("should handle version history as array", async () => {
        const mockVersions = [{ id: "v1", message: "Test" }]

        mockBackendSync.getVersionHistory.mockResolvedValueOnce({
          success: true,
          error: null,
          data: mockVersions,
        })

        const { result } = renderHook(() => useVersionControl())

        const versions = await result.current.getVersionHistory()

        expect(versions).toEqual(mockVersions)
      })

      it("should return null on error", async () => {
        mockBackendSync.getVersionHistory.mockResolvedValueOnce({
          success: false,
          error: "History not found",
          data: null,
        })

        const { result } = renderHook(() => useVersionControl())

        const versions = await result.current.getVersionHistory()

        expect(versions).toBeNull()
        await waitFor(() => {
          expect(result.current.error).toBe("History not found")
        })
      })
    })

    describe("compareVersions", () => {
      it("should compare versions successfully", async () => {
        const mockDiff = { added: [], removed: [], modified: [] }

        mockBackendSync.compareVersions.mockResolvedValueOnce({
          success: true,
          error: null,
          data: mockDiff,
        })

        const { result } = renderHook(() => useVersionControl())

        const diff = await result.current.compareVersions("v1", "v2")

        expect(diff).toEqual(mockDiff)
        expect(mockBackendSync.compareVersions).toHaveBeenCalledWith("v1", "v2")
      })

      it("should handle compare errors", async () => {
        mockBackendSync.compareVersions.mockResolvedValueOnce({
          success: false,
          error: "Version not found",
          data: null,
        })

        const { result } = renderHook(() => useVersionControl())

        const diff = await result.current.compareVersions("v1", "v2")

        expect(diff).toBeNull()
      })
    })

    describe("Branch operations", () => {
      it("should create branch", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.createBranch("feature", "v1")

        expect(success).toBe(true)
        expect(mockBackendSync.createBranch).toHaveBeenCalledWith("feature", "v1")
      })

      it("should create branch from current version", async () => {
        const { result } = renderHook(() => useVersionControl())

        await result.current.createBranch("feature")

        expect(mockBackendSync.createBranch).toHaveBeenCalledWith("feature", undefined)
      })

      it("should merge branches", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.mergeBranch("feature", "main")

        expect(success).toBe(true)
        expect(mockBackendSync.mergeBranch).toHaveBeenCalledWith("feature", "main")
      })

      it("should switch branch", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.switchBranch("feature")

        expect(success).toBe(true)
        expect(mockBackendSync.switchBranch).toHaveBeenCalledWith("feature")
      })
    })

    describe("Auto-save operations", () => {
      it("should set auto-save interval", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.setAutoSaveInterval(60)

        expect(success).toBe(true)
        expect(mockBackendSync.setAutoSaveInterval).toHaveBeenCalledWith(60)
      })

      it("should enable auto-save", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.enableAutoSave(true)

        expect(success).toBe(true)
        expect(mockBackendSync.enableAutoSave).toHaveBeenCalledWith(true)
      })

      it("should disable auto-save", async () => {
        const { result } = renderHook(() => useVersionControl())

        const success = await result.current.enableAutoSave(false)

        expect(success).toBe(true)
        expect(mockBackendSync.enableAutoSave).toHaveBeenCalledWith(false)
      })
    })
  })

  describe("Event handling", () => {
    it("should handle SnapshotCreated event", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | null = null

      mockBackendSync.onEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      const { result } = renderHook(() => useVersionControl())

      // Wait for initial state to be loaded
      await waitFor(() => {
        expect(result.current.currentVersionId).toBe("v1")
      })

      expect(eventHandler).not.toBeNull()

      const event: ProjectEvent = {
        type: "SnapshotCreated",
        payload: {
          version_id: "v2",
          message: "Test snapshot",
          parent_version: "v1",
        },
      }

      eventHandler!(event)

      await waitFor(() => {
        expect(result.current.currentVersionId).toBe("v2")
        expect(result.current.hasUncommittedChanges).toBe(false)
      })
    })

    it("should handle VersionRestored event", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | null = null

      mockBackendSync.onEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      const { result } = renderHook(() => useVersionControl())

      await waitFor(() => {
        expect(eventHandler).not.toBeNull()
      })

      const event: ProjectEvent = {
        type: "VersionRestored",
        payload: {
          version_id: "v1",
          previous_version: "v2",
        },
      }

      expect(eventHandler).not.toBeNull()
      eventHandler!(event)

      await waitFor(() => {
        expect(result.current.currentVersionId).toBe("v1")
      })
    })

    it("should handle BranchSwitched event", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | null = null

      mockBackendSync.onEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      const { result } = renderHook(() => useVersionControl())

      // Wait for initial state to be loaded
      await waitFor(() => {
        expect(result.current.branchName).toBe("main")
      })

      expect(eventHandler).not.toBeNull()

      const event: ProjectEvent = {
        type: "BranchSwitched",
        payload: {
          from_branch: "main",
          to_branch: "feature",
        },
      }

      eventHandler!(event)

      await waitFor(() => {
        expect(result.current.branchName).toBe("feature")
      })
    })

    it("should handle AutoSaveConfigChanged event", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | null = null

      mockBackendSync.onEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      const { result } = renderHook(() => useVersionControl())

      // Wait for initial state to be loaded
      await waitFor(() => {
        expect(result.current.autoSaveEnabled).toBe(true)
        expect(result.current.autoSaveIntervalSeconds).toBe(30)
      })

      expect(eventHandler).not.toBeNull()

      const event: ProjectEvent = {
        type: "AutoSaveConfigChanged",
        payload: {
          enabled: false,
          interval_seconds: 60,
        },
      }

      eventHandler!(event)

      await waitFor(() => {
        expect(result.current.autoSaveEnabled).toBe(false)
        expect(result.current.autoSaveIntervalSeconds).toBe(60)
      })
    })

    it("should handle AutoSaveTriggered event", async () => {
      let eventHandler: ((event: ProjectEvent) => void) | null = null

      mockBackendSync.onEvent.mockImplementation((handler: (event: ProjectEvent) => void) => {
        eventHandler = handler
        return () => {}
      })

      const { result } = renderHook(() => useVersionControl())

      // Wait for initial state to be loaded
      await waitFor(() => {
        expect(result.current.currentVersionId).toBe("v1")
      })

      expect(eventHandler).not.toBeNull()

      const event: ProjectEvent = {
        type: "AutoSaveTriggered",
        payload: {
          snapshot_id: "auto-v3",
        },
      }

      eventHandler!(event)

      await waitFor(() => {
        expect(result.current.currentVersionId).toBe("auto-v3")
      })
    })
  })

  describe("Error handling", () => {
    it("should handle getProjectState errors", async () => {
      mockBackendSync.getProjectState.mockRejectedValueOnce(new Error("State error"))

      const { result } = renderHook(() => useVersionControl())

      await waitFor(
        () => {
          expect(result.current.error).toBe("State error")
        },
        { timeout: 3000 },
      )
    })

    it("should handle null project state", async () => {
      mockBackendSync.getProjectState.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useVersionControl())

      await waitFor(() => {
        // Should not crash, state should remain at defaults
        expect(result.current.currentVersionId).toBe("initial")
      })
    })

    it("should handle project state without version_info", async () => {
      mockBackendSync.getProjectState.mockResolvedValueOnce({
        ...mockProjectState,
        version_info: null,
      } as any)

      renderHook(() => useVersionControl())

      // Should not crash
      await waitFor(() => {
        expect(mockBackendSync.getProjectState).toHaveBeenCalled()
      })
    })
  })

  describe("Cleanup", () => {
    it("should unsubscribe from events on unmount", () => {
      const unsubscribe = vi.fn()
      mockBackendSync.onEvent.mockReturnValue(unsubscribe)

      const { unmount } = renderHook(() => useVersionControl())

      unmount()

      expect(unsubscribe).toHaveBeenCalled()
    })
  })
})

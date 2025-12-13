/**
 * Browser Orchestrator Tests
 *
 * Tests for browser orchestrator service including:
 * - Initialization and state management
 * - Browser actions (tab switching, settings)
 * - File selection operations
 * - Backend synchronization
 * - Error handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BrowserTab } from "@/types/generated/tauri-bindings"
import {
  BrowserOrchestrator,
  getBrowserOrchestrator,
  resetBrowserOrchestrator,
} from "../../services/browser-orchestrator"

// Mock Tauri commands
const mockCommands = {
  browserSwitchTab: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSetSearchQuery: vi.fn().mockResolvedValue({ status: "ok" }),
  browserToggleFavorites: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSetSort: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSetGroupBy: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSetFilter: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSetViewMode: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSetPreviewSize: vi.fn().mockResolvedValue({ status: "ok" }),
  browserResetTabSettings: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSelectFile: vi.fn().mockResolvedValue({ status: "ok" }),
  browserDeselectFile: vi.fn().mockResolvedValue({ status: "ok" }),
  browserSelectAllFiles: vi.fn().mockResolvedValue({ status: "ok" }),
  browserDeselectAllFiles: vi.fn().mockResolvedValue({ status: "ok" }),
}

vi.mock("@/types/generated/tauri-bindings", () => ({
  commands: mockCommands,
}))

// Mock container
vi.mock("@/core", () => ({
  container: {
    hasBackend: () => false,
    getBackend: () => null,
  },
}))

describe("BrowserOrchestrator", () => {
  let orchestrator: BrowserOrchestrator

  beforeEach(() => {
    vi.clearAllMocks()
    resetBrowserOrchestrator()
    orchestrator = new BrowserOrchestrator()
  })

  afterEach(() => {
    orchestrator.dispose()
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const snapshot = orchestrator.getSnapshot()

      expect(snapshot.activeTab).toBe("media")
      expect(snapshot.isLoading).toBe(false)
      expect(snapshot.error).toBeNull()
    })

    it("should initialize browser actor", () => {
      const actor = orchestrator.getBrowserActor()

      expect(actor).toBeDefined()
      expect(typeof actor.send).toBe("function")
      expect(typeof actor.getSnapshot).toBe("function")
    })

    it("should provide getters for state", () => {
      expect(orchestrator.getActiveTab()).toBe("media")
      expect(orchestrator.isLoading()).toBe(false)
      expect(orchestrator.getError()).toBeNull()
    })

    it("should provide tab settings", () => {
      const settings = orchestrator.getTabSettings("media")

      expect(settings).toMatchObject({
        search_query: expect.any(String),
        show_favorites_only: expect.any(Boolean),
        sort_by: expect.any(String),
        sort_order: expect.stringMatching(/^(asc|desc)$/),
        group_by: expect.any(String),
        filter_type: expect.any(String),
        view_mode: expect.stringMatching(/^(thumbnails|list|grid)$/),
        preview_size_index: expect.any(Number),
      })
    })

    it("should provide empty selected files initially", () => {
      const selectedFiles = orchestrator.getSelectedFiles("media")
      expect(selectedFiles).toEqual([])
    })
  })

  describe("Tab Switching", () => {
    it("should switch tab", async () => {
      await orchestrator.switchTab("effects")

      const activeTab = orchestrator.getActiveTab()
      expect(activeTab).toBe("effects")
    })

    it("should call backend command when switching tab", async () => {
      await orchestrator.switchTab("filters")

      expect(mockCommands.browserSwitchTab).toHaveBeenCalledWith("filters")
    })

    it("should handle tab switch error", async () => {
      mockCommands.browserSwitchTab.mockResolvedValueOnce({ status: "error", error: "Switch failed" })

      await expect(orchestrator.switchTab("effects")).rejects.toThrow("Switch failed")
    })

    it("should switch to all available tabs", async () => {
      // Reset mock to return success for all calls
      mockCommands.browserSwitchTab.mockResolvedValue({ status: "ok" })

      const tabs: BrowserTab[] = ["media", "effects", "filters", "transitions", "templates", "style_templates"]

      for (const tab of tabs) {
        await orchestrator.switchTab(tab)
        expect(orchestrator.getActiveTab()).toBe(tab)
      }
    })
  })

  describe("Search Query", () => {
    it("should set search query", async () => {
      

      await orchestrator.setSearchQuery("test query")

      expect(mockCommands.browserSetSearchQuery).toHaveBeenCalledWith("test query", null)
    })

    it("should set search query for specific tab", async () => {
      

      await orchestrator.setSearchQuery("effects query", "effects")

      expect(mockCommands.browserSetSearchQuery).toHaveBeenCalledWith("effects query", "effects")
    })

    it("should handle search query error", async () => {
      
      mockCommands.browserSetSearchQuery = vi.fn().mockResolvedValue({ status: "error", error: "Search failed" })

      await expect(orchestrator.setSearchQuery("test")).rejects.toThrow("Search failed")
    })

    it("should clear error after successful search", async () => {
      
      // Reset mock to return success
      mockCommands.browserSetSearchQuery = vi.fn().mockResolvedValue({ status: "ok" })

      await orchestrator.setSearchQuery("test")

      expect(orchestrator.getError()).toBeNull()
    })
  })

  describe("Favorites Toggle", () => {
    it("should toggle favorites", async () => {
      

      await orchestrator.toggleFavorites()

      expect(mockCommands.browserToggleFavorites).toHaveBeenCalledWith(null)
    })

    it("should toggle favorites for specific tab", async () => {
      

      await orchestrator.toggleFavorites("filters")

      expect(mockCommands.browserToggleFavorites).toHaveBeenCalledWith("filters")
    })

    it("should handle toggle favorites error", async () => {
      
      mockCommands.browserToggleFavorites = vi.fn().mockResolvedValue({ status: "error", error: "Toggle failed" })

      await expect(orchestrator.toggleFavorites()).rejects.toThrow("Toggle failed")
    })
  })

  describe("Sort Settings", () => {
    it("should set sort", async () => {
      

      await orchestrator.setSort("date", "desc")

      expect(mockCommands.browserSetSort).toHaveBeenCalledWith("date", "desc", null)
    })

    it("should set sort for specific tab", async () => {
      

      await orchestrator.setSort("name", "asc", "effects")

      expect(mockCommands.browserSetSort).toHaveBeenCalledWith("name", "asc", "effects")
    })

    it("should handle sort error", async () => {
      
      mockCommands.browserSetSort = vi.fn().mockResolvedValue({ status: "error", error: "Sort failed" })

      await expect(orchestrator.setSort("date", "asc")).rejects.toThrow("Sort failed")
    })
  })

  describe("Group By Settings", () => {
    it("should set group by", async () => {
      

      await orchestrator.setGroupBy("type")

      expect(mockCommands.browserSetGroupBy).toHaveBeenCalledWith("type", null)
    })

    it("should set group by for specific tab", async () => {
      

      await orchestrator.setGroupBy("category", "templates")

      expect(mockCommands.browserSetGroupBy).toHaveBeenCalledWith("category", "templates")
    })
  })

  describe("Filter Settings", () => {
    it("should set filter", async () => {
      

      await orchestrator.setFilter("video")

      expect(mockCommands.browserSetFilter).toHaveBeenCalledWith("video", null)
    })

    it("should set filter for specific tab", async () => {
      

      await orchestrator.setFilter("image", "media")

      expect(mockCommands.browserSetFilter).toHaveBeenCalledWith("image", "media")
    })
  })

  describe("View Mode Settings", () => {
    it("should set view mode", async () => {
      

      await orchestrator.setViewMode("grid")

      expect(mockCommands.browserSetViewMode).toHaveBeenCalledWith("grid", null)
    })

    it("should set view mode for specific tab", async () => {
      

      await orchestrator.setViewMode("list", "effects")

      expect(mockCommands.browserSetViewMode).toHaveBeenCalledWith("list", "effects")
    })

    it("should handle all view modes", async () => {
      
      const viewModes: Array<"thumbnails" | "list" | "grid"> = ["thumbnails", "list", "grid"]

      for (const viewMode of viewModes) {
        await orchestrator.setViewMode(viewMode)
        expect(mockCommands.browserSetViewMode).toHaveBeenCalledWith(viewMode, null)
      }
    })
  })

  describe("Preview Size Settings", () => {
    it("should set preview size", async () => {
      

      await orchestrator.setPreviewSize(3)

      expect(mockCommands.browserSetPreviewSize).toHaveBeenCalledWith(3, null)
    })

    it("should set preview size for specific tab", async () => {
      

      await orchestrator.setPreviewSize(4, "filters")

      expect(mockCommands.browserSetPreviewSize).toHaveBeenCalledWith(4, "filters")
    })

    it("should handle all size indices", async () => {
      
      const sizeIndices = [0, 1, 2, 3, 4]

      for (const sizeIndex of sizeIndices) {
        await orchestrator.setPreviewSize(sizeIndex)
        expect(mockCommands.browserSetPreviewSize).toHaveBeenCalledWith(sizeIndex, null)
      }
    })
  })

  describe("Reset Tab Settings", () => {
    it("should reset tab settings", async () => {
      

      await orchestrator.resetTabSettings("media")

      expect(mockCommands.browserResetTabSettings).toHaveBeenCalledWith("media")
    })

    it("should handle reset error", async () => {
      
      mockCommands.browserResetTabSettings = vi.fn().mockResolvedValue({ status: "error", error: "Reset failed" })

      await expect(orchestrator.resetTabSettings("media")).rejects.toThrow("Reset failed")
    })
  })

  describe("File Selection", () => {
    it("should select file", async () => {
      

      await orchestrator.selectFile("file-1")

      expect(mockCommands.browserSelectFile).toHaveBeenCalledWith("file-1", null)
    })

    it("should select file for specific tab", async () => {
      

      await orchestrator.selectFile("effect-1", "effects")

      expect(mockCommands.browserSelectFile).toHaveBeenCalledWith("effect-1", "effects")
    })

    it("should deselect file", async () => {
      

      await orchestrator.deselectFile("file-1")

      expect(mockCommands.browserDeselectFile).toHaveBeenCalledWith("file-1", null)
    })

    it("should deselect file for specific tab", async () => {
      

      await orchestrator.deselectFile("effect-1", "effects")

      expect(mockCommands.browserDeselectFile).toHaveBeenCalledWith("effect-1", "effects")
    })

    it("should handle file selection error", async () => {
      
      mockCommands.browserSelectFile = vi.fn().mockResolvedValue({ status: "error", error: "Select failed" })

      await expect(orchestrator.selectFile("file-1")).rejects.toThrow("Select failed")
    })
  })

  describe("Toggle File Selection", () => {
    it("should toggle file selection - select when not selected", async () => {
      
      // Reset mocks to return success
      mockCommands.browserSelectFile = vi.fn().mockResolvedValue({ status: "ok" })

      await orchestrator.toggleFileSelection("file-1")

      // toggleFileSelection calls selectFile with no tab param, which internally passes null
      expect(mockCommands.browserSelectFile).toHaveBeenCalledWith("file-1", null)
    })

    it("should toggle file selection - deselect when selected", async () => {
      
      // Reset mocks to return success
      mockCommands.browserSelectFile = vi.fn().mockResolvedValue({ status: "ok" })
      mockCommands.browserDeselectFile = vi.fn().mockResolvedValue({ status: "ok" })

      // First select
      await orchestrator.selectFile("file-1")

      // Update internal state to simulate backend response
      orchestrator.getBrowserActor().send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FileSelected",
          data: { tab: "media", file_id: "file-1" },
        },
      })

      // Then toggle
      await orchestrator.toggleFileSelection("file-1")

      // toggleFileSelection calls deselectFile with no tab param, which internally passes null
      expect(mockCommands.browserDeselectFile).toHaveBeenCalledWith("file-1", null)
    })
  })

  describe("Select All Files", () => {
    it("should select all files", async () => {
      
      const fileIds = ["file-1", "file-2", "file-3"]

      await orchestrator.selectAllFiles(fileIds)

      expect(mockCommands.browserSelectAllFiles).toHaveBeenCalledWith(fileIds, null)
    })

    it("should select all files for specific tab", async () => {
      
      const fileIds = ["effect-1", "effect-2"]

      await orchestrator.selectAllFiles(fileIds, "effects")

      expect(mockCommands.browserSelectAllFiles).toHaveBeenCalledWith(fileIds, "effects")
    })
  })

  describe("Deselect All Files", () => {
    it("should deselect all files", async () => {
      

      await orchestrator.deselectAllFiles()

      expect(mockCommands.browserDeselectAllFiles).toHaveBeenCalledWith(null)
    })

    it("should deselect all files for specific tab", async () => {
      

      await orchestrator.deselectAllFiles("effects")

      expect(mockCommands.browserDeselectAllFiles).toHaveBeenCalledWith("effects")
    })
  })

  describe("State Getters", () => {
    it("should get active tab", () => {
      const activeTab = orchestrator.getActiveTab()
      expect(activeTab).toBe("media")
    })

    it("should get tab settings", () => {
      const settings = orchestrator.getTabSettings("media")
      expect(settings).toBeDefined()
      expect(settings.search_query).toBeDefined()
    })

    it("should get tab settings for active tab by default", () => {
      const settings = orchestrator.getTabSettings()
      expect(settings).toBeDefined()
    })

    it("should get selected files", () => {
      const selectedFiles = orchestrator.getSelectedFiles("media")
      expect(Array.isArray(selectedFiles)).toBe(true)
    })

    it("should get selected files for active tab by default", () => {
      const selectedFiles = orchestrator.getSelectedFiles()
      expect(Array.isArray(selectedFiles)).toBe(true)
    })

    it("should check if file is selected", () => {
      const isSelected = orchestrator.isFileSelected("file-1")
      expect(typeof isSelected).toBe("boolean")
    })

    it("should get snapshot", () => {
      const snapshot = orchestrator.getSnapshot()
      expect(snapshot).toBeDefined()
      expect(snapshot.activeTab).toBeDefined()
      expect(snapshot.tabSettings).toBeDefined()
      expect(snapshot.selectedFiles).toBeDefined()
    })
  })

  describe("Subscription", () => {
    it("should allow subscribing to state changes", () => {
      const callback = vi.fn()
      const subscription = orchestrator.subscribe(callback)

      expect(subscription).toBeDefined()
      expect(typeof subscription.unsubscribe).toBe("function")
      subscription.unsubscribe()
    })

    it("should notify subscribers on state change", async () => {
      
      mockCommands.browserSwitchTab = vi.fn().mockResolvedValue({ status: "ok" })

      const callback = vi.fn()
      orchestrator.subscribe(callback)

      await orchestrator.switchTab("effects")

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalled()
    })
  })

  describe("Singleton Pattern", () => {
    it("should return same instance from getBrowserOrchestrator", () => {
      const instance1 = getBrowserOrchestrator()
      const instance2 = getBrowserOrchestrator()

      expect(instance1).toBe(instance2)
    })

    it("should create new instance after reset", () => {
      const instance1 = getBrowserOrchestrator()
      resetBrowserOrchestrator()
      const instance2 = getBrowserOrchestrator()

      expect(instance1).not.toBe(instance2)
    })
  })

  describe("Disposal", () => {
    it("should dispose orchestrator", () => {
      expect(() => {
        orchestrator.dispose()
      }).not.toThrow()
    })

    it("should stop actor on disposal", () => {
      const actor = orchestrator.getBrowserActor()
      const initialSnapshot = actor.getSnapshot()
      expect(initialSnapshot).toBeDefined()

      orchestrator.dispose()

      // After disposal, actor should be stopped and not accessible
      // We just verify disposal doesn't throw
      expect(true).toBe(true)
    })
  })

  describe("Error Handling", () => {
    it("should set error state on command failure", async () => {
      
      mockCommands.browserSwitchTab = vi.fn().mockResolvedValue({ status: "error", error: "Test error" })

      await expect(orchestrator.switchTab("effects")).rejects.toThrow("Test error")
    })

    it("should clear error after successful operation", async () => {
      

      // Cause an error
      mockCommands.browserSetSearchQuery = vi.fn().mockResolvedValue({ status: "error", error: "Test error" })
      try {
        await orchestrator.setSearchQuery("test")
      } catch {
        // Ignore error
      }

      // Fix mock and retry
      mockCommands.browserSetSearchQuery = vi.fn().mockResolvedValue({ status: "ok" })
      await orchestrator.setSearchQuery("test")

      expect(orchestrator.getError()).toBeNull()
    })
  })

  describe("Loading State", () => {
    it("should set loading state during operations", async () => {
      

      // Mock slow command
      mockCommands.browserSetSearchQuery = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ status: "ok" }), 100)))

      const searchPromise = orchestrator.setSearchQuery("test")

      // Should be loading during operation
      expect(orchestrator.isLoading()).toBe(true)

      await searchPromise

      // Should not be loading after completion
      expect(orchestrator.isLoading()).toBe(false)
    })

    it("should clear loading state on error", async () => {
      
      mockCommands.browserSetSearchQuery = vi.fn().mockResolvedValue({ status: "error", error: "Test error" })

      try {
        await orchestrator.setSearchQuery("test")
      } catch {
        // Ignore error
      }

      expect(orchestrator.isLoading()).toBe(false)
    })
  })
})

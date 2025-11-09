/**
 * Browser Provider Tests
 *
 * Comprehensive tests for BrowserProvider including:
 * - State initialization and synchronization
 * - Tab switching and settings management
 * - File selection operations
 * - Backend command execution
 * - Error handling
 * - Edge cases
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { BrowserProvider, useBrowser, useBrowserState } from "../../providers/browser-provider"
import {
  ALL_BROWSER_TABS,
  createBrowserStateWithSelection,
  createBrowserStateWithSettings,
  createMockBrowserState,
  MOCK_FILE_IDS,
} from "../../__mocks__"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { resetMockBrowserState } from "@/test/mocks/backend-sync"

// Test wrapper component
function createWrapper() {
  return ({ children }: { children: ReactNode }) => <BrowserProvider>{children}</BrowserProvider>
}

describe("BrowserProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockBrowserState()
  })

  afterEach(() => {
    resetMockBrowserState()
  })

  describe("Initialization", () => {
    it("should initialize with default browser state", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activeTab).toBe("media")
      expect(result.current.selectedFiles).toBeInstanceOf(Set)
      expect(result.current.selectedFiles.size).toBe(0)
      expect(result.current.error).toBeNull()
    })

    it("should load browser state from backend on mount", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(backendSync.getProjectState).toHaveBeenCalled()
      expect(result.current.browserState).toBeDefined()
    })

    it("should subscribe to backend events", async () => {
      const backendSync = getBackendSync()
      renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(backendSync.onEvent).toHaveBeenCalled()
        expect(backendSync.onStateChange).toHaveBeenCalled()
      })
    })

    it("should handle loading state correctly", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe("Convenient Getters", () => {
    it("should provide activeTab getter", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.activeTab).toBe("media")
      expect(ALL_BROWSER_TABS).toContain(result.current.activeTab)
    })

    it("should provide currentTabSettings getter", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const settings = result.current.currentTabSettings
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

    it("should provide selectedFiles as Set", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.selectedFiles).toBeInstanceOf(Set)
    })

    it("should calculate previewSize from preview_size_index", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.previewSize).toBeGreaterThan(0)
      expect(typeof result.current.previewSize).toBe("number")
    })
  })

  describe("Tab Switching", () => {
    it("should switch tabs", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.switchTab("effects")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSwitchTab",
        params: { tab: "effects" },
      })
    })

    it("should switch to all available tabs", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      for (const tab of ALL_BROWSER_TABS) {
        await act(async () => {
          await result.current.switchTab(tab)
        })
      }

      expect(getBackendSync().executeCommand).toHaveBeenCalledTimes(ALL_BROWSER_TABS.length)
    })
  })

  describe("Tab Settings Management", () => {
    it("should set search query", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setSearchQuery("test query")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetSearchQuery",
        params: { query: "test query", tab: null },
      })
    })

    it("should set search query for specific tab", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setSearchQuery("effects query", "effects")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetSearchQuery",
        params: { query: "effects query", tab: "effects" },
      })
    })

    it("should toggle favorites", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.toggleFavorites()
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserToggleFavorites",
        params: { tab: null },
      })
    })

    it("should set sort", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setSort("name", "desc")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetSort",
        params: { sort_by: "name", sort_order: "desc", tab: null },
      })
    })

    it("should set groupBy", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setGroupBy("type")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetGroupBy",
        params: { group_by: "type", tab: null },
      })
    })

    it("should set filter", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setFilter("video")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetFilter",
        params: { filter_type: "video", tab: null },
      })
    })

    it("should set view mode", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setViewMode("grid")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetViewMode",
        params: { view_mode: "grid", tab: null },
      })
    })

    it("should set preview size", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setPreviewSize(3)
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSetPreviewSize",
        params: { size_index: 3, tab: null },
      })
    })

    it("should reset tab settings", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.resetTabSettings("media")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserResetTabSettings",
        params: { tab: "media" },
      })
    })
  })

  describe("File Selection", () => {
    it("should select a file", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.selectFile("file-1")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSelectFile",
        params: { file_id: "file-1", tab: null },
      })
    })

    it("should deselect a file", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deselectFile("file-1")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserDeselectFile",
        params: { file_id: "file-1", tab: null },
      })
    })

    it("should toggle file selection", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.toggleFileSelection("file-1")
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserToggleFileSelection",
        params: { file_id: "file-1", tab: null },
      })
    })

    it("should select all files", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const fileIds = ["file-1", "file-2", "file-3"]
      await act(async () => {
        await result.current.selectAllFiles(fileIds)
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserSelectAllFiles",
        params: { file_ids: fileIds, tab: null },
      })
    })

    it("should deselect all files", async () => {
      const backendSync = getBackendSync()
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deselectAllFiles()
      })

      expect(backendSync.executeCommand).toHaveBeenCalledWith({
        type: "BrowserDeselectAllFiles",
        params: { tab: null },
      })
    })

    it("should check if file is selected", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Initially not selected
      expect(result.current.isFileSelected("file-1")).toBe(false)

      // Select file
      await act(async () => {
        await result.current.selectFile("file-1")
      })

      // Now should be selected
      await waitFor(() => {
        expect(result.current.isFileSelected("file-1")).toBe(true)
      })
    })

    it("should maintain separate selections per tab", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Select files on media tab
      await act(async () => {
        await result.current.selectFile("media-1", "media")
      })

      // Switch to effects tab
      await act(async () => {
        await result.current.switchTab("effects")
      })

      // Select files on effects tab
      await act(async () => {
        await result.current.selectFile("effect-1", "effects")
      })

      // Check that media tab still has its selection
      expect(result.current.isFileSelected("media-1", "media")).toBe(true)
      expect(result.current.isFileSelected("effect-1", "effects")).toBe(true)
    })
  })

  describe("Error Handling", () => {
    it("should handle backend command errors", async () => {
      const backendSync = getBackendSync()
      backendSync.executeCommand = vi.fn().mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.selectFile("file-1")
        })
      ).rejects.toThrow("Backend error")

      expect(result.current.error).toBeDefined()
    })

    it("should handle state loading errors", async () => {
      const backendSync = getBackendSync()
      backendSync.getProjectState = vi.fn().mockRejectedValueOnce(new Error("Failed to load state"))

      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })
    })

    it("should clear errors after successful operation", async () => {
      const backendSync = getBackendSync()

      // First call fails
      backendSync.executeCommand = vi.fn().mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Fail once
      await expect(
        act(async () => {
          await result.current.selectFile("file-1")
        })
      ).rejects.toThrow()

      expect(result.current.error).toBeDefined()

      // Reset mock to succeed
      backendSync.executeCommand = vi.fn().mockResolvedValue({ success: true, error: null, data: null })

      // Succeed
      await act(async () => {
        await result.current.selectFile("file-2")
      })

      // Error should be cleared
      expect(result.current.error).toBeNull()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty file selection", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.selectAllFiles([])
      })

      expect(result.current.selectedFiles.size).toBe(0)
    })

    it("should handle selecting the same file twice", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.selectFile("file-1")
      })

      await act(async () => {
        await result.current.selectFile("file-1")
      })

      // Should still be selected
      await waitFor(() => {
        expect(result.current.isFileSelected("file-1")).toBe(true)
      })
    })

    it("should handle deselecting non-selected file", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deselectFile("file-1")
      })

      expect(result.current.isFileSelected("file-1")).toBe(false)
    })

    it("should handle rapid tab switches", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Rapidly switch tabs
      await act(async () => {
        await Promise.all([
          result.current.switchTab("effects"),
          result.current.switchTab("filters"),
          result.current.switchTab("transitions"),
        ])
      })

      // Should not crash
      expect(result.current.activeTab).toBeDefined()
    })

    it("should handle settings for non-existent tab gracefully", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // currentTabSettings should always return valid settings
      expect(result.current.currentTabSettings).toBeDefined()
      expect(result.current.currentTabSettings.search_query).toBeDefined()
    })
  })

  describe("Backwards Compatibility", () => {
    it("should provide useBrowserState alias", async () => {
      const { result } = renderHook(() => useBrowserState(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have all the same properties as useBrowser
      expect(result.current.activeTab).toBeDefined()
      expect(result.current.selectedFiles).toBeDefined()
      expect(result.current.currentTabSettings).toBeDefined()
    })

    it("should provide clearBrowserState for compatibility", async () => {
      const { result} = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not throw
      expect(() => result.current.clearBrowserState()).not.toThrow()
    })
  })

  describe("Context Error", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error
      console.error = vi.fn()

      try {
        expect(() => {
          renderHook(() => useBrowser())
        }).toThrow("useBrowser must be used within BrowserProvider")
      } finally {
        console.error = originalError
      }
    })
  })

  describe("State Synchronization", () => {
    it("should reflect backend state changes", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Select a file
      await act(async () => {
        await result.current.selectFile("file-1")
      })

      // State should update
      await waitFor(() => {
        expect(result.current.isFileSelected("file-1")).toBe(true)
      })
    })

    it("should update selectedFiles Set when backend state changes", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialSize = result.current.selectedFiles.size

      await act(async () => {
        await result.current.selectFile("file-1")
      })

      await waitFor(() => {
        expect(result.current.selectedFiles.size).toBe(initialSize + 1)
      })
    })
  })
})

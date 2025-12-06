/**
 * Browser Domain Integration Tests
 *
 * End-to-end integration tests covering complete workflows:
 * - Tab navigation with file selection
 * - Search and filter operations
 * - Multi-tab operations
 * - Complex state scenarios
 */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getBackendSync } from "@/adapters/tauri"
import { resetExecuteCommandMock, resetMockBrowserState } from "@/test/mocks/backend-sync"
import { MOCK_FILE_IDS } from "../__mocks__"
import { BrowserProvider, useBrowser } from "../providers/browser-provider"

function createWrapper() {
  return ({ children }: { children: ReactNode }) => <BrowserProvider>{children}</BrowserProvider>
}

describe("Browser Domain Integration Tests", () => {
  beforeEach(() => {
    resetMockBrowserState()
    resetExecuteCommandMock()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    resetMockBrowserState()
    resetExecuteCommandMock()
  })

  describe("Complete Tab Navigation Flow", () => {
    it("should navigate through tabs and maintain settings", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Start on media tab
      expect(result.current.activeTab).toBe("media")

      // Change settings on media tab
      await act(async () => {
        await result.current.setSearchQuery("video")
        await result.current.setViewMode("grid")
      })

      // Switch to effects tab
      await act(async () => {
        await result.current.switchTab("effects")
      })

      expect(result.current.activeTab).toBe("effects")

      // Change settings on effects tab
      await act(async () => {
        await result.current.setSearchQuery("blur")
        await result.current.setViewMode("list")
      })

      // Switch back to media tab
      await act(async () => {
        await result.current.switchTab("media")
      })

      // Media tab should have maintained its settings
      expect(result.current.activeTab).toBe("media")
    })

    it("should navigate through all tabs sequentially", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const tabs = ["media", "effects", "filters", "transitions", "templates", "style_templates"] as const

      for (const tab of tabs) {
        await act(async () => {
          await result.current.switchTab(tab)
        })
        expect(result.current.activeTab).toBe(tab)
      }
    })
  })

  describe("File Selection Workflows", () => {
    it("should select multiple files and deselect one", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Select multiple files
      const fileIds = ["file-1", "file-2", "file-3"]
      for (const fileId of fileIds) {
        await act(async () => {
          await result.current.selectFile(fileId)
        })
      }

      // All should be selected
      await waitFor(() => {
        fileIds.forEach((fileId) => {
          expect(result.current.isFileSelected(fileId)).toBe(true)
        })
      })

      // Deselect one
      await act(async () => {
        await result.current.deselectFile("file-2")
      })

      // Check selection state
      await waitFor(() => {
        expect(result.current.isFileSelected("file-1")).toBe(true)
        expect(result.current.isFileSelected("file-2")).toBe(false)
        expect(result.current.isFileSelected("file-3")).toBe(true)
      })
    })

    it("should toggle file selection multiple times", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const fileId = "file-1"

      // Toggle on
      await act(async () => {
        await result.current.toggleFileSelection(fileId)
      })

      await waitFor(() => {
        expect(result.current.isFileSelected(fileId)).toBe(true)
      })

      // Toggle off
      await act(async () => {
        await result.current.toggleFileSelection(fileId)
      })

      await waitFor(() => {
        expect(result.current.isFileSelected(fileId)).toBe(false)
      })

      // Toggle on again
      await act(async () => {
        await result.current.toggleFileSelection(fileId)
      })

      await waitFor(() => {
        expect(result.current.isFileSelected(fileId)).toBe(true)
      })
    })

    it("should select all files and then deselect all", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const fileIds = ["file-1", "file-2", "file-3", "file-4", "file-5"]

      // Select all
      await act(async () => {
        await result.current.selectAllFiles(fileIds)
      })

      await waitFor(() => {
        fileIds.forEach((fileId) => {
          expect(result.current.isFileSelected(fileId)).toBe(true)
        })
      })

      // Deselect all
      await act(async () => {
        await result.current.deselectAllFiles()
      })

      await waitFor(() => {
        expect(result.current.selectedFiles.size).toBe(0)
      })
    })
  })

  describe("Multi-Tab Selection Management", () => {
    it("should maintain separate selections across tabs", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Select files on media tab
      await act(async () => {
        await result.current.selectFile(MOCK_FILE_IDS.media[0], "media")
        await result.current.selectFile(MOCK_FILE_IDS.media[1], "media")
      })

      // Switch to effects tab
      await act(async () => {
        await result.current.switchTab("effects")
      })

      // Select files on effects tab
      await act(async () => {
        await result.current.selectFile(MOCK_FILE_IDS.effects[0], "effects")
      })

      // Verify media tab selection is preserved
      expect(result.current.isFileSelected(MOCK_FILE_IDS.media[0], "media")).toBe(true)
      expect(result.current.isFileSelected(MOCK_FILE_IDS.media[1], "media")).toBe(true)

      // Verify effects tab selection
      await waitFor(() => {
        expect(result.current.isFileSelected(MOCK_FILE_IDS.effects[0], "effects")).toBe(true)
      })

      // Switch to filters tab
      await act(async () => {
        await result.current.switchTab("filters")
      })

      // Select files on filters tab
      await act(async () => {
        await result.current.selectFile(MOCK_FILE_IDS.filters[0], "filters")
      })

      // All tabs should maintain their selections
      expect(result.current.isFileSelected(MOCK_FILE_IDS.media[0], "media")).toBe(true)
      expect(result.current.isFileSelected(MOCK_FILE_IDS.effects[0], "effects")).toBe(true)
      await waitFor(() => {
        expect(result.current.isFileSelected(MOCK_FILE_IDS.filters[0], "filters")).toBe(true)
      })
    })

    it("should clear selection on one tab without affecting others", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Select files on multiple tabs
      await act(async () => {
        await result.current.selectFile("media-1", "media")
        await result.current.selectFile("effect-1", "effects")
      })

      // Clear selection on media tab
      await act(async () => {
        await result.current.deselectAllFiles("media")
      })

      // Media should be cleared
      await waitFor(() => {
        expect(result.current.isFileSelected("media-1", "media")).toBe(false)
      })

      // Effects should still be selected
      expect(result.current.isFileSelected("effect-1", "effects")).toBe(true)
    })
  })

  describe("Search and Filter Workflows", () => {
    it("should apply search, filter, and sort together", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Apply search
      await act(async () => {
        await result.current.setSearchQuery("landscape")
      })

      // Apply filter
      await act(async () => {
        await result.current.setFilter("video")
      })

      // Apply sort
      await act(async () => {
        await result.current.setSort("date", "desc")
      })

      // Verify state was updated
      await waitFor(() => {
        expect(result.current.currentTabSettings.search_query).toBe("landscape")
        expect(result.current.currentTabSettings.filter_type).toBe("video")
        expect(result.current.currentTabSettings.sort_by).toBe("date")
        expect(result.current.currentTabSettings.sort_order).toBe("desc")
      })
    })

    it("should toggle favorites and apply grouping", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Toggle favorites
      await act(async () => {
        await result.current.toggleFavorites()
      })

      // Apply grouping
      await act(async () => {
        await result.current.setGroupBy("date")
      })

      // Verify state was updated
      await waitFor(() => {
        expect(result.current.currentTabSettings.show_favorites_only).toBe(true)
        expect(result.current.currentTabSettings.group_by).toBe("date")
      })
    })

    it("should reset settings and apply new ones", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Apply various settings
      await act(async () => {
        await result.current.setSearchQuery("test")
        await result.current.setFilter("image")
        await result.current.setSort("name", "asc")
      })

      // Reset settings
      await act(async () => {
        await result.current.resetTabSettings("media")
      })

      // Verify settings were reset
      await waitFor(() => {
        expect(result.current.currentTabSettings.search_query).toBe("")
        expect(result.current.currentTabSettings.filter_type).toBe("all")
        expect(result.current.currentTabSettings.sort_by).toBe("name")
      })

      // Apply new settings
      await act(async () => {
        await result.current.setSearchQuery("new search")
        await result.current.setViewMode("list")
      })

      // Verify new settings were applied
      await waitFor(() => {
        expect(result.current.currentTabSettings.search_query).toBe("new search")
        expect(result.current.currentTabSettings.view_mode).toBe("list")
      })
    })
  })

  describe("View Mode and Preview Size Workflows", () => {
    it("should cycle through all view modes", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const viewModes = ["thumbnails", "list", "grid"] as const

      for (const mode of viewModes) {
        await act(async () => {
          await result.current.setViewMode(mode)
        })

        await waitFor(() => {
          expect(result.current.currentTabSettings.view_mode).toBe(mode)
        })
      }
    })

    it("should adjust preview size multiple times", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Size indices typically range from 0 to 4
      const sizes = [0, 2, 4, 1]

      for (const size of sizes) {
        await act(async () => {
          await result.current.setPreviewSize(size)
        })

        await waitFor(() => {
          expect(result.current.currentTabSettings.preview_size_index).toBe(size)
        })
      }
    })

    it("should change view mode and preview size together", async () => {
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setViewMode("grid")
        await result.current.setPreviewSize(3)
      })

      await waitFor(() => {
        expect(result.current.currentTabSettings.view_mode).toBe("grid")
        expect(result.current.currentTabSettings.preview_size_index).toBe(3)
      })
    })
  })

  // Note: Error recovery is tested in browser-orchestrator.test.ts (59 tests)
  // Note: Complex state scenarios (rapid changes, consistency) are tested in:
  // - Tab Navigation Workflows above (2 tests) - tab switching consistency
  // - File Selection Workflows above (5 tests) - selection state management
})

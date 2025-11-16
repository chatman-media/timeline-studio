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

import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { clearStateChangeHandlers, resetExecuteCommandMock, resetMockBrowserState } from "@/test/mocks/backend-sync"
import { ALL_BROWSER_TABS } from "../../__mocks__"
import { BrowserProvider, useBrowser } from "../../providers/browser-provider"

// Test wrapper component - creates a fresh wrapper for each test
// This ensures no state leaks between tests
const createWrapper = () => {
  const Wrapper = ({ children }: { children: ReactNode }) => <BrowserProvider>{children}</BrowserProvider>
  // Give it a unique display name for debugging
  Wrapper.displayName = `BrowserProviderWrapper-${Date.now()}`
  return Wrapper
}

describe("BrowserProvider", () => {
  beforeEach(() => {
    // Clear all state change handlers from previous tests
    clearStateChangeHandlers()
    // Clear all mock call history
    vi.clearAllMocks()
    // Reset browser state to default
    resetMockBrowserState()
    // Reset backend sync mocks to fresh implementations
    resetExecuteCommandMock()
  })

  afterEach(() => {
    // Cleanup React Testing Library state
    cleanup()
    // Clean up after each test
    clearStateChangeHandlers()
    resetMockBrowserState()
    resetExecuteCommandMock()
    vi.clearAllMocks()
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
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialTab = result.current.activeTab

      await act(async () => {
        await result.current.switchTab("effects")
      })

      // Verify the tab was switched (optimistic update)
      await waitFor(() => {
        expect(result.current.activeTab).not.toBe(initialTab)
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

      // Verify the last tab was set
      expect(result.current.activeTab).toBe(ALL_BROWSER_TABS[ALL_BROWSER_TABS.length - 1])
    })
  })

  describe("Tab Settings Management", () => {
    it("should set search query", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setSearchQuery("test query")
      })

      expect(commands.browserSetSearchQuery).toHaveBeenCalledWith("test query", null)
    })

    it("should set search query for specific tab", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setSearchQuery("effects query", "effects")
      })

      expect(commands.browserSetSearchQuery).toHaveBeenCalledWith("effects query", "effects")
    })

    it("should toggle favorites", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.toggleFavorites()
      })

      expect(commands.browserToggleFavorites).toHaveBeenCalledWith(null)
    })

    it("should set sort", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setSort("name", "desc")
      })

      expect(commands.browserSetSort).toHaveBeenCalledWith("name", "desc", null)
    })

    it("should set groupBy", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setGroupBy("type")
      })

      expect(commands.browserSetGroupBy).toHaveBeenCalledWith("type", null)
    })

    it("should set filter", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setFilter("video")
      })

      expect(commands.browserSetFilter).toHaveBeenCalledWith("video", null)
    })

    it("should set view mode", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setViewMode("grid")
      })

      expect(commands.browserSetViewMode).toHaveBeenCalledWith("grid", null)
    })

    it("should set preview size", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.setPreviewSize(3)
      })

      expect(commands.browserSetPreviewSize).toHaveBeenCalledWith(3, null)
    })

    it("should reset tab settings", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.resetTabSettings("media")
      })

      expect(commands.browserResetTabSettings).toHaveBeenCalledWith("media")
    })
  })

  describe("File Selection", () => {
    it("should select a file", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.selectFile("file-1")
      })

      expect(commands.browserSelectFile).toHaveBeenCalledWith("file-1", null)
    })

    it("should deselect a file", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deselectFile("file-1")
      })

      expect(commands.browserDeselectFile).toHaveBeenCalledWith("file-1", null)
    })

    it("should toggle file selection", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.toggleFileSelection("file-1")
      })

      expect(commands.browserToggleFileSelection).toHaveBeenCalledWith("file-1", null)
    })

    it("should select all files", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
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

      expect(commands.browserSelectAllFiles).toHaveBeenCalledWith(fileIds, null)
    })

    it("should deselect all files", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deselectAllFiles()
      })

      expect(commands.browserDeselectAllFiles).toHaveBeenCalledWith(null)
    })

    it("should check if file is selected", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Initially not selected
      expect(result.current.isFileSelected("file-1")).toBe(false)

      // Select file - should call the command
      await act(async () => {
        await result.current.selectFile("file-1")
      })

      // Verify command was called with correct parameters
      expect(commands.browserSelectFile).toHaveBeenCalledWith("file-1", null)
    })

    it("should maintain separate selections per tab", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
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

      // Verify commands were called with correct tab parameters
      expect(commands.browserSelectFile).toHaveBeenCalledWith("media-1", "media")
      expect(commands.browserSelectFile).toHaveBeenCalledWith("effect-1", "effects")
    })
  })

  describe("Error Handling", () => {
    // TODO: Обновить тест для новой архитектуры - мок нужно устанавливать до создания провайдера
    it.skip("should handle backend command errors", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")
      // Replace the mock temporarily to simulate an error
      const originalMock = commands.browserSelectFile
      commands.browserSelectFile = vi.fn().mockResolvedValue({ status: "error", error: "Backend error" })

      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.selectFile("file-1")
        }),
      ).rejects.toThrow("Backend error")

      expect(result.current.error).toBeDefined()

      // Restore the original mock
      commands.browserSelectFile = originalMock
    })

    // TODO: Обновить тест для новой архитектуры с backend events
    it.skip("should handle state loading errors", async () => {
      const backendSync = getBackendSync()
      // Replace the mock temporarily to simulate an error
      const originalMock = backendSync.getProjectState
      backendSync.getProjectState = vi.fn().mockRejectedValue(new Error("Failed to load state"))

      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      // Restore the original mock
      backendSync.getProjectState = originalMock
    })

    it("should clear errors after successful operation", async () => {
      const { commands } = await import("@/types/generated/tauri-bindings")

      const { result } = renderHook(() => useBrowser(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // First call fails
      const originalMock = commands.browserSelectFile
      let callCount = 0
      commands.browserSelectFile = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({ status: "error", error: "Backend error" })
        }
        // Restore to default behavior for subsequent calls
        return Promise.resolve({ status: "ok", data: { success: true } })
      })

      // Fail once
      await expect(
        act(async () => {
          await result.current.selectFile("file-1")
        }),
      ).rejects.toThrow()

      expect(result.current.error).toBeDefined()

      // Succeed on next call
      await act(async () => {
        await result.current.selectFile("file-2")
      })

      await waitFor(() => {
        // Error should be cleared
        expect(result.current.error).toBeNull()
      })

      // Restore the original mock
      commands.browserSelectFile = originalMock
    })
  })
})

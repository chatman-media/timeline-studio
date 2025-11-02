/**
 * Unit tests for BrowserProviderV2
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"
import type { ProjectEvent, ProjectState } from "@/types/generated/tauri-bindings"
import { BrowserProviderV2, useBrowserV2 } from "../browser-provider-v2"

// Mock BackendSync
vi.mock("@/features/app-state/services/backend-sync", () => ({
  BackendSync: vi.fn().mockImplementation(() => ({
    onEvent: vi.fn(),
    executeCommand: vi.fn(),
    getProjectState: vi.fn(),
  })),
}))

describe("BrowserProviderV2", () => {
  let mockBackendSync: vi.MockedFunction<any>
  let mockOnEvent: vi.MockedFunction<any>
  let mockUnsubscribe: vi.MockedFunction<any>
  let mockExecuteCommand: vi.MockedFunction<any>
  let mockGetProjectState: vi.MockedFunction<any>

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnEvent = vi.fn()
    mockUnsubscribe = vi.fn()
    mockExecuteCommand = vi.fn()
    mockGetProjectState = vi.fn()

    mockBackendSync = {
      onEvent: mockOnEvent.mockReturnValue(mockUnsubscribe),
      executeCommand: mockExecuteCommand,
      getProjectState: mockGetProjectState,
    } as unknown as vi.MockedFunction<any>

    // Default successful command execution
    mockExecuteCommand.mockResolvedValue({ success: true, data: null })

    // Provide a minimal valid ProjectState for tests that need it
    mockGetProjectState.mockResolvedValue({
      project: { id: "test-project", name: "Test Project" },
      ui_state: { theme: "light" },
      playback_state: { is_playing: false, current_time: 0 },
      version: { version: "1.0.0" },
      chat_state: { messages: [] },
      timeline_state: { tracks: [] },
      browser_state: null,
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserProviderV2 backendSync={mockBackendSync}>{children}</BrowserProviderV2>
  )

  describe("initialization", () => {
    it("should initialize with loading state", async () => {
      mockGetProjectState.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.browserState).toBe(null)
      expect(result.current.error).toBe(null)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should load initial browser state", async () => {
      const mockBrowserState = {
        active_tab: "media" as const,
        tabs: {
          media: {
            view_mode: "grid" as const,
            sort_by: "name",
            sort_order: "name" as const,
            group_by: null,
            filter_type: null,
            preview_size: 1,
            show_favorites_only: false,
            search_query: "",
          },
        },
      }

      mockGetProjectState.mockResolvedValueOnce({
        browser_state: mockBrowserState,
      } as ProjectState)

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await waitFor(() => {
        expect(result.current.browserState).toEqual(mockBrowserState)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle initialization errors", async () => {
      mockGetProjectState.mockRejectedValueOnce(new Error("Failed to load"))

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.error).toBe("Failed to load")
      })
    })
  })

  describe("event handling", () => {
    it("should refresh state on browser events", async () => {
      const initialState = {
        browser_state: {
          active_tab: "media" as const,
          tabs: {},
        },
      }
      const updatedState = {
        browser_state: {
          active_tab: "effects" as const,
          tabs: {},
        },
      }

      mockGetProjectState.mockResolvedValueOnce(initialState).mockResolvedValueOnce(updatedState)

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await waitFor(() => {
        expect(result.current.browserState?.active_tab).toBe("media")
      })

      // Simulate browser event
      const eventHandler = mockOnEvent.mock.calls[0][0]
      act(() => {
        eventHandler({ type: "BrowserTabSwitched", data: { tab: "effects" } } as any)
      })

      await waitFor(() => {
        expect(result.current.browserState?.active_tab).toBe("effects")
      })
    })

    it("should handle multiple browser event types", () => {
      renderHook(() => useBrowserV2(), { wrapper })

      const eventHandler = mockOnEvent.mock.calls[0][0]

      // Test various browser events
      const browserEvents: ProjectEvent[] = [
        { type: "BrowserTabSwitched", data: { tab: "media" } },
        { type: "BrowserSearchQueryChanged", data: { tab: "media", query: "test" } },
        { type: "BrowserFavoritesToggled", data: { tab: "media", show_favorites_only: true } },
        { type: "BrowserSortChanged", data: { tab: "media", sort_by: "name", sort_order: "name" } },
        { type: "BrowserGroupByChanged", data: { tab: "media", group_by: "type" } },
        { type: "BrowserFilterChanged", data: { tab: "media", filter_type: "video" } },
        { type: "BrowserViewModeChanged", data: { tab: "media", view_mode: "list" } },
        { type: "BrowserPreviewSizeChanged", data: { tab: "media", size_index: 2 } },
        { type: "BrowserTabSettingsReset", data: { tab: "media" } },
        { type: "BrowserFileSelected", data: { tab: "media", file_id: "file1" } },
        { type: "BrowserFileDeselected", data: { tab: "media", file_id: "file1" } },
        { type: "BrowserFileSelectionToggled", data: { tab: "media", file_id: "file1" } },
        { type: "BrowserAllFilesSelected", data: { tab: "media", file_ids: ["file1", "file2"] } },
        { type: "BrowserAllFilesDeselected", data: { tab: "media" } },
      ]

      browserEvents.forEach((event) => {
        act(() => {
          eventHandler(event)
        })
      })

      // Each event should trigger a state refresh
      expect(mockGetProjectState).toHaveBeenCalledTimes(browserEvents.length + 1) // +1 for initial load
    })

    it("handles errors gracefully", async () => {
      mockExecuteCommand.mockRejectedValue(new Error("Command failed"))
      mockGetProjectState.mockRejectedValue(new Error("Failed to fetch"))

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch")
      })

      expect(result.current.browserState).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("browser actions", () => {
    beforeEach(() => {
      mockGetProjectState.mockResolvedValue({ browser_state: null })
    })

    it("should switch tab", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.switchTab("effects")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSwitchTab",
        params: { tab: "effects" },
      })
    })

    it("should set search query", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.setSearchQuery("test query")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSetSearchQuery",
        params: { query: "test query", tab: null },
      })
    })

    it("should set search query with specific tab", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.setSearchQuery("test query", "media")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSetSearchQuery",
        params: { query: "test query", tab: "media" },
      })
    })

    it("should toggle favorites", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.toggleFavorites()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserToggleFavorites",
        params: { tab: null },
      })
    })

    it("should set sort options", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.setSort("date", "date")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSetSort",
        params: { sort_by: "date", sort_order: "date", tab: null },
      })
    })

    it("should set view mode", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.setViewMode("list")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSetViewMode",
        params: { view_mode: "list", tab: null },
      })
    })

    it("should select file", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.selectFile("file123")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSelectFile",
        params: { file_id: "file123", tab: null },
      })
    })

    it("should toggle file selection", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.toggleFileSelection("file123")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserToggleFileSelection",
        params: { file_id: "file123", tab: null },
      })
    })

    it("should select all files", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.selectAllFiles(["file1", "file2", "file3"])
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserSelectAllFiles",
        params: { file_ids: ["file1", "file2", "file3"], tab: null },
      })
    })

    it("should deselect all files", async () => {
      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        await result.current.deselectAllFiles()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserDeselectAllFiles",
        params: { tab: null },
      })
    })
  })

  describe("error handling", () => {
    it("should handle command execution errors", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Command failed"))

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        try {
          await result.current.switchTab("effects")
        } catch (error) {
          expect(error).toEqual(new Error("Command failed"))
        }
      })

      expect(result.current.error).toBe("Command failed")
    })

    it("should handle command result errors", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: false,
        error: "Invalid tab",
      })

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      await act(async () => {
        try {
          await result.current.switchTab("invalid" as any)
        } catch (error) {
          expect(error).toEqual(new Error("Invalid tab"))
        }
      })

      expect(result.current.error).toBe("Invalid tab")
    })
  })

  describe("useBrowserV2 hook", () => {
    it("should throw error when used outside provider", () => {
      const { result } = renderHook(() => useBrowserV2())

      expect(result.error).toEqual(new Error("useBrowserV2 must be used within BrowserProviderV2"))
    })

    it("should return context when used within provider", () => {
      mockGetProjectState.mockResolvedValue({ browser_state: null })

      const { result } = renderHook(() => useBrowserV2(), { wrapper })

      expect(result.current).toHaveProperty("browserState")
      expect(result.current).toHaveProperty("isLoading")
      expect(result.current).toHaveProperty("error")
      expect(result.current).toHaveProperty("switchTab")
      expect(result.current).toHaveProperty("setSearchQuery")
      expect(result.current).toHaveProperty("toggleFavorites")
      expect(typeof result.current.switchTab).toBe("function")
      expect(typeof result.current.setSearchQuery).toBe("function")
    })
  })
})

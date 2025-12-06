import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { usePreviewPreloader } from "@/domains/media-management/hooks/use-preview-preloader"

// Mock useMediaPreview hook
const mockGetPreviewData = vi.fn()

vi.mock("../use-media-preview", () => ({
  useMediaPreview: () => ({
    getPreviewData: mockGetPreviewData,
    generateThumbnail: vi.fn(),
    clearPreviewData: vi.fn(),
    getFilesWithPreviews: vi.fn(),
    savePreviewData: vi.fn(),
    loadPreviewData: vi.fn(),
    isGenerating: false,
    error: null,
  }),
}))

describe("usePreviewPreloader", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPreviewData.mockResolvedValue({ file_id: "test", browser_thumbnail: { base64_data: "data" } })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it("should initialize with default options", () => {
    const { result } = renderHook(() => usePreviewPreloader())

    expect(result.current.isPreloading).toBe(false)
    expect(typeof result.current.handleVisibleRangeChange).toBe("function")
    expect(typeof result.current.preloadPreviews).toBe("function")
    expect(typeof result.current.cancelAllPreloads).toBe("function")
  })

  it("should initialize with custom options", () => {
    const { result } = renderHook(() =>
      usePreviewPreloader({
        preloadAhead: 10,
        preloadBehind: 5,
        debounceDelay: 200,
        maxConcurrent: 5,
      }),
    )

    expect(result.current.isPreloading).toBe(false)
    expect(typeof result.current.handleVisibleRangeChange).toBe("function")
    expect(typeof result.current.preloadPreviews).toBe("function")
    expect(typeof result.current.cancelAllPreloads).toBe("function")
  })

  it("should preload previews for specified items", async () => {
    const { result } = renderHook(() => usePreviewPreloader())

    const items = [
      { fileId: "file1", index: 0 },
      { fileId: "file2", index: 1 },
    ]

    await act(async () => {
      await result.current.preloadPreviews(items)
    })

    expect(mockGetPreviewData).toHaveBeenCalledWith("file1")
    expect(mockGetPreviewData).toHaveBeenCalledWith("file2")
  })

  it("should respect preloadAhead and preloadBehind settings", async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() =>
      usePreviewPreloader({
        preloadAhead: 2,
        preloadBehind: 1,
        debounceDelay: 100,
      }),
    )

    const allItems = [
      { fileId: "file1" },
      { fileId: "file2" },
      { fileId: "file3" },
      { fileId: "file4" },
      { fileId: "file5" },
      { fileId: "file6" },
    ]

    // Visible range is index 2 (file3), should preload indices 1,3,4
    const visibleRange: [number, number] = [2, 2]

    act(() => {
      result.current.handleVisibleRangeChange(visibleRange, allItems)
    })

    // Fast-forward debounce timer and run all pending promises
    await act(async () => {
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()
    })

    // Use real timers for waitFor
    vi.useRealTimers()

    await waitFor(() => {
      expect(mockGetPreviewData).toHaveBeenCalled()
    })

    // Should preload behind and ahead (but not the visible file itself)
    expect(mockGetPreviewData).toHaveBeenCalledWith("file2") // behind
    expect(mockGetPreviewData).toHaveBeenCalledWith("file4") // ahead
    expect(mockGetPreviewData).toHaveBeenCalledWith("file5") // ahead
    expect(mockGetPreviewData).not.toHaveBeenCalledWith("file3") // visible - should be skipped
  })

  it("should respect maxConcurrent limit", async () => {
    const { result } = renderHook(() =>
      usePreviewPreloader({
        maxConcurrent: 2,
      }),
    )

    const items = [
      { fileId: "file1", index: 0 },
      { fileId: "file2", index: 1 },
      { fileId: "file3", index: 2 },
    ]

    await act(async () => {
      await result.current.preloadPreviews(items)
    })

    // All items should be processed, but in chunks based on maxConcurrent
    expect(mockGetPreviewData).toHaveBeenCalledWith("file1")
    expect(mockGetPreviewData).toHaveBeenCalledWith("file2")
    expect(mockGetPreviewData).toHaveBeenCalledWith("file3")
    expect(mockGetPreviewData).toHaveBeenCalledTimes(3)
  })

  it("should handle errors gracefully", async () => {
    mockGetPreviewData.mockRejectedValue(new Error("Failed to load preview"))

    const { result } = renderHook(() => usePreviewPreloader())

    const items = [{ fileId: "file1", index: 0 }]

    // Should not throw error even when preview loading fails
    await act(async () => {
      await expect(result.current.preloadPreviews(items)).resolves.not.toThrow()
    })

    // Should have attempted to load the preview
    expect(mockGetPreviewData).toHaveBeenCalledWith("file1")
    // Should complete loading state properly despite error
    expect(result.current.isPreloading).toBe(false)
  })

  it("should handle empty items list", async () => {
    const { result } = renderHook(() => usePreviewPreloader())

    await act(async () => {
      await result.current.preloadPreviews([])
    })

    expect(mockGetPreviewData).not.toHaveBeenCalled()
    expect(result.current.isPreloading).toBe(false)
  })

  it("should debounce handleVisibleRangeChange calls", async () => {
    vi.useFakeTimers()

    const { result } = renderHook(() => usePreviewPreloader({ debounceDelay: 100 }))

    const allItems = [{ fileId: "file1" }, { fileId: "file2" }, { fileId: "file3" }]

    // Make multiple rapid calls
    act(() => {
      result.current.handleVisibleRangeChange([0, 0], allItems)
      result.current.handleVisibleRangeChange([1, 1], allItems)
      result.current.handleVisibleRangeChange([2, 2], allItems)
    })

    // Should not have called getPreviewData yet
    expect(mockGetPreviewData).not.toHaveBeenCalled()

    // Fast-forward time and wait for async operations
    await act(async () => {
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()
    })

    // Should process the last call (index 2)
    expect(mockGetPreviewData).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("should cancel preloads on unmount", () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => usePreviewPreloader({ debounceDelay: 100 }))

    act(() => {
      result.current.handleVisibleRangeChange([0, 0], [{ fileId: "file1" }])
    })

    unmount()

    // Fast-forward time - should not cause any errors
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(mockGetPreviewData).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

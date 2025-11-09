/**
 * useMediaMetadata Hook Tests
 *
 * Тесты для хука useMediaMetadata
 */

import { invoke } from "@tauri-apps/api/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockVideoMetadata } from "../../__mocks__"
import { MediaManagementProvider } from "../../providers/media-management-provider"
import { useMediaMetadata } from "../use-media-metadata"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))
vi.mock("@/lib/tauri-logger")
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onStateChange: vi.fn(() => () => {}),
    executeCommand: vi.fn().mockResolvedValue({ id: "media-1", path: "/test/video.mp4" }),
    getProjectState: vi.fn().mockResolvedValue({
      project: {
        media_pool: {
          items: {},
        },
      },
    }),
  })),
}))
vi.mock("@/features/media/services/media-api", () => ({
  selectMediaFile: vi.fn().mockResolvedValue(["/test/video.mp4"]),
  selectAudioFile: vi.fn().mockResolvedValue(["/test/audio.mp3"]),
}))

describe("useMediaMetadata", () => {
  const wrapper = ({ children }: { children: ReactNode}) => (
    <MediaManagementProvider>{children}</MediaManagementProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return metadata functions and state", () => {
    const { result } = renderHook(() => useMediaMetadata(), { wrapper })

    expect(result.current).toHaveProperty("loading")
    expect(result.current).toHaveProperty("error")
    expect(result.current).toHaveProperty("getMetadata")
    expect(result.current).toHaveProperty("getInfo")
  })

  it("should have default state", () => {
    const { result } = renderHook(() => useMediaMetadata(), { wrapper })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  describe("getMetadata", () => {
    it("should extract metadata successfully", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockClear()
      mockInvoke.mockResolvedValue(mockVideoMetadata)

      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      let metadata: any = null

      await act(async () => {
        metadata = await result.current.getMetadata("/test/video.mp4")
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(metadata).toEqual(mockVideoMetadata)
      expect(result.current.error).toBe(null)
    })

    it("should set loading state during extraction", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockClear()
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockVideoMetadata), 100)),
      )

      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      act(() => {
        result.current.getMetadata("/test/video.mp4")
      })

      // Should be loading
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it("should handle extraction errors", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockClear()
      mockInvoke.mockRejectedValue(new Error("Metadata extraction failed"))

      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      let metadata: any = null

      await act(async () => {
        metadata = await result.current.getMetadata("/test/invalid.mp4")
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(metadata).toBe(null)
      expect(result.current.error).toContain("Failed to extract metadata")
    })

    it("should handle non-Error exceptions", async () => {
      const mockInvoke = vi.mocked(invoke)
      mockInvoke.mockClear()
      mockInvoke.mockRejectedValue("String error")

      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      let metadata: any = null

      await act(async () => {
        metadata = await result.current.getMetadata("/test/video.mp4")
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(metadata).toBe(null)
      expect(result.current.error).toContain("Failed to extract metadata")
    })
  })

  describe("getInfo", () => {
    it("should get media info successfully", async () => {
      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      let info: any = null

      await act(async () => {
        info = await result.current.getInfo("/test/video.mp4")
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(info).toBeDefined()
      expect(info.path).toBe("/test/video.mp4")
      expect(result.current.error).toBe(null)
    })

    it("should set loading state during info retrieval", async () => {
      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      act(() => {
        result.current.getInfo("/test/video.mp4")
      })

      // Should be loading
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it("should handle info retrieval errors gracefully", async () => {
      // Этот тест будет использовать fallback логику в getMediaInfo
      // когда backend не содержит файл в media_pool
      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      let info: any = null

      await act(async () => {
        info = await result.current.getInfo("/test/unknown.mp4")
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should still return basic info even if file not in backend
      expect(info).toBeDefined()
      expect(info.path).toBe("/test/unknown.mp4")
      expect(info.name).toBe("unknown.mp4")
    })
  })

  describe("state management", () => {
    it("should reset error on successful call", async () => {
      const mockInvoke = vi.mocked(invoke)

      // Reset mock before test
      mockInvoke.mockClear()

      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      // First call fails
      mockInvoke.mockRejectedValueOnce(new Error("First error"))

      await act(async () => {
        await result.current.getMetadata("/test/invalid.mp4")
      })

      await waitFor(() => {
        expect(result.current.error).toBe("First error")
      })

      // Second call succeeds
      mockInvoke.mockResolvedValueOnce(mockVideoMetadata)

      await act(async () => {
        await result.current.getMetadata("/test/video.mp4")
      })

      await waitFor(() => {
        expect(result.current.error).toBe(null)
      })
    })

    it("should handle concurrent calls", async () => {
      const mockInvoke = vi.mocked(invoke)

      // Reset mock before test
      mockInvoke.mockClear()
      mockInvoke.mockResolvedValue(mockVideoMetadata)

      const { result } = renderHook(() => useMediaMetadata(), { wrapper })

      await act(async () => {
        // Make multiple concurrent calls
        await Promise.all([
          result.current.getMetadata("/test/video1.mp4"),
          result.current.getMetadata("/test/video2.mp4"),
          result.current.getMetadata("/test/video3.mp4"),
        ])
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(null)
    })
  })
})

/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { prerenderSegment, type PrerenderResult } from "@/core/services/video-compiler"
import { usePrerender, usePrerenderCache } from "../../hooks/use-prerender"

// Ensure console.error is mocked to see errors
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock dependencies
const mockProject = {
  id: "test-project",
  name: "Test Project",
  sections: [],
  duration: 60,
}

vi.mock("@/features/timeline/hooks/state/use-timeline", () => ({
  useTimeline: () => ({
    project: mockProject,
  }),
}))

vi.mock("@/features/export/utils/project-schema-builder", () => ({
  ProjectSchemaBuilder: {
    createForPreview: vi.fn((project, options) => ({
      ...project,
      quality: options.quality,
    })),
  },
}))

// Mock video compiler service
vi.mock("@/core/services/video-compiler", () => ({
  prerenderSegment: vi.fn(),
  getPrerenderCacheInfo: vi.fn(),
  clearPrerenderCache: vi.fn(),
}))

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("usePrerender", () => {
  const mockResult: PrerenderResult = {
    filePath: "/path/to/render.mp4",
    duration: 10,
    fileSize: 1024 * 1024,
    renderTimeMs: 5000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prerenderSegment).mockResolvedValue(mockResult)
  })

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => usePrerender())

      expect(result.current.isRendering).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.currentResult).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })

  describe("prerender", () => {
    it("should prerender segment successfully", async () => {
      const { result } = renderHook(() => usePrerender())

      let renderResult: PrerenderResult | null = null
      await act(async () => {
        renderResult = await result.current.prerender(0, 10)
      })

      expect(vi.mocked(prerenderSegment)).toHaveBeenCalledWith({
        projectSchema: expect.objectContaining({
          quality: 75,
        }),
        startTime: 0,
        endTime: 10,
        outputPath: expect.stringMatching(/\/tmp\/prerender_\d+_0_10\.mp4/),
        applyEffects: true,
        quality: 75,
      })

      expect(renderResult).toEqual(mockResult)
      expect(result.current.isRendering).toBe(false)
      expect(result.current.progress).toBe(100)
      expect(result.current.currentResult).toEqual(mockResult)
      expect(result.current.error).toBeUndefined()
    })

    it("should prerender with custom quality", async () => {
      const { result } = renderHook(() => usePrerender())

      await act(async () => {
        await result.current.prerender(0, 10, true, 50)
      })

      expect(vi.mocked(prerenderSegment)).toHaveBeenCalledWith({
        projectSchema: expect.objectContaining({
          quality: 50,
        }),
        startTime: 0,
        endTime: 10,
        outputPath: expect.stringMatching(/\/tmp\/prerender_\d+_0_10\.mp4/),
        applyEffects: true,
        quality: 50,
      })
    })

    it("should prerender without effects", async () => {
      const { result } = renderHook(() => usePrerender())

      await act(async () => {
        await result.current.prerender(0, 10, false)
      })

      expect(vi.mocked(prerenderSegment)).toHaveBeenCalledWith({
        projectSchema: expect.any(Object),
        startTime: 0,
        endTime: 10,
        outputPath: expect.stringMatching(/\/tmp\/prerender_\d+_0_10\.mp4/),
        applyEffects: false,
        quality: 75,
      })
    })

    it("should reject invalid time range (start >= end)", async () => {
      const { result } = renderHook(() => usePrerender())

      const renderResult = await act(async () => {
        return await result.current.prerender(10, 10)
      })

      expect(renderResult).toBeNull()
      expect(vi.mocked(prerenderSegment)).not.toHaveBeenCalled()
      expect(result.current.error).toBeUndefined()
    })

    it("should reject duration longer than 60 seconds", async () => {
      const { result } = renderHook(() => usePrerender())

      const renderResult = await act(async () => {
        return await result.current.prerender(0, 61)
      })

      expect(renderResult).toBeNull()
      expect(vi.mocked(prerenderSegment)).not.toHaveBeenCalled()
    })

    it("should handle render error gracefully", async () => {
      const error = new Error("Render failed")
      vi.mocked(prerenderSegment).mockRejectedValueOnce(error)

      const { result } = renderHook(() => usePrerender())

      const renderResult = await act(async () => {
        return await result.current.prerender(0, 10)
      })

      expect(renderResult).toBeNull()
      expect(result.current.isRendering).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.error).toBe("Render failed")
      expect(result.current.currentResult).toBeUndefined()
    })
  })

  describe("clearResult", () => {
    it("should clear current result and error", async () => {
      const { result } = renderHook(() => usePrerender())

      // First, create a result
      await act(async () => {
        await result.current.prerender(0, 10)
      })

      expect(result.current.currentResult).toBeDefined()

      // Clear result
      act(() => {
        result.current.clearResult()
      })

      expect(result.current.currentResult).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })
})

describe("usePrerenderCache", () => {
  const mockCacheFiles = [
    {
      path: "/cache/segment1.mp4",
      startTime: 0,
      endTime: 10,
      size: 1024 * 1024,
      createdAt: Date.now(),
    },
    {
      path: "/cache/segment2.mp4",
      startTime: 10,
      endTime: 20,
      size: 2 * 1024 * 1024,
      createdAt: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("basic functionality", () => {
    it("should expose cache functions", () => {
      const { result } = renderHook(() => usePrerenderCache())

      expect(result.current.hasInCache).toBeDefined()
      expect(result.current.getFromCache).toBeDefined()
      expect(result.current.addToCache).toBeDefined()
      expect(result.current.clearCache).toBeDefined()
    })
  })
})

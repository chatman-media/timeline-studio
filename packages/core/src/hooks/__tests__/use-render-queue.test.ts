/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { container } from "../../container"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useRenderQueue } from "../use-render-queue"

function getVideoMocks() {
  const video = container.getVideo()
  return {
    renderProject: vi.mocked(video.renderProject),
    cancelRender: vi.mocked(video.cancelRender),
    getActiveJobs: vi.mocked(video.getActiveJobs),
  }
}

describe("useRenderQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("renderProject", () => {
    it("should call renderProject from domain and return job ID", async () => {
      const mockJobId = "job-123"
      const { renderProject } = getVideoMocks()
      renderProject.mockResolvedValue(mockJobId)

      const { result } = renderHook(() => useRenderQueue())

      const schema = { timeline: { tracks: [] } }
      const outputPath = "/output/video.mp4"
      const jobId = await result.current.renderProject(schema, outputPath)

      expect(renderProject).toHaveBeenCalledWith(schema, outputPath)
      expect(jobId).toBe(mockJobId)
    })

    it("should propagate errors from renderProject", async () => {
      const error = new Error("Render failed")
      const { renderProject } = getVideoMocks()
      renderProject.mockRejectedValue(error)

      const { result } = renderHook(() => useRenderQueue())

      await expect(result.current.renderProject({}, "/output/video.mp4")).rejects.toThrow("Render failed")
    })

    it("should be memoized and return same reference", () => {
      const { result, rerender } = renderHook(() => useRenderQueue())

      const firstRender = result.current.renderProject
      rerender()
      const secondRender = result.current.renderProject

      expect(firstRender).toBe(secondRender)
    })
  })

  describe("cancelRender", () => {
    it("should call cancelRender from domain and return success status", async () => {
      const { cancelRender } = getVideoMocks()
      cancelRender.mockResolvedValue(true)

      const { result } = renderHook(() => useRenderQueue())

      const jobId = "job-123"
      const success = await result.current.cancelRender(jobId)

      expect(cancelRender).toHaveBeenCalledWith(jobId)
      expect(success).toBe(true)
    })

    it("should return false when cancel fails", async () => {
      const { cancelRender } = getVideoMocks()
      cancelRender.mockResolvedValue(false)

      const { result } = renderHook(() => useRenderQueue())

      const success = await result.current.cancelRender("invalid-job")

      expect(success).toBe(false)
    })

    it("should be memoized and return same reference", () => {
      const { result, rerender } = renderHook(() => useRenderQueue())

      const firstRender = result.current.cancelRender
      rerender()
      const secondRender = result.current.cancelRender

      expect(firstRender).toBe(secondRender)
    })
  })

  describe("getActiveJobs", () => {
    it("should call getActiveJobs from domain and return jobs list", async () => {
      const mockJobs = [
        { id: "job-1", status: "rendering", progress: 50 },
        { id: "job-2", status: "queued", progress: 0 },
      ]
      const { getActiveJobs } = getVideoMocks()
      getActiveJobs.mockResolvedValue(mockJobs as any)

      const { result } = renderHook(() => useRenderQueue())

      const jobs = await result.current.getActiveJobs()

      expect(getActiveJobs).toHaveBeenCalled()
      expect(jobs).toEqual([
        expect.objectContaining({
          id: "job-1",
          status: "rendering",
          progress: expect.objectContaining({ percentage: 50 }),
        }),
        expect.objectContaining({
          id: "job-2",
          status: "queued",
          progress: expect.objectContaining({ percentage: 0 }),
        }),
      ])
    })

    it("should return empty array when no active jobs", async () => {
      const { getActiveJobs } = getVideoMocks()
      getActiveJobs.mockResolvedValue([])

      const { result } = renderHook(() => useRenderQueue())

      const jobs = await result.current.getActiveJobs()

      expect(jobs).toEqual([])
    })

    it("should be memoized and return same reference", () => {
      const { result, rerender } = renderHook(() => useRenderQueue())

      const firstRender = result.current.getActiveJobs
      rerender()
      const secondRender = result.current.getActiveJobs

      expect(firstRender).toBe(secondRender)
    })
  })

  describe("hook return value", () => {
    it("should return object with all methods", () => {
      const { result } = renderHook(() => useRenderQueue())

      expect(result.current).toHaveProperty("renderProject")
      expect(result.current).toHaveProperty("cancelRender")
      expect(result.current).toHaveProperty("getActiveJobs")
      expect(typeof result.current.renderProject).toBe("function")
      expect(typeof result.current.cancelRender).toBe("function")
      expect(typeof result.current.getActiveJobs).toBe("function")
    })

    it("should return memoized object that stays the same on re-renders", () => {
      const { result, rerender } = renderHook(() => useRenderQueue())

      const firstRender = result.current
      rerender()
      const secondRender = result.current

      expect(firstRender).toBe(secondRender)
    })
  })
})

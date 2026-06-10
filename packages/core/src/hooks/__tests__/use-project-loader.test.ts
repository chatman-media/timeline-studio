/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useProjectLoader } from "../use-project-loader"

// Mock project-management service
vi.mock("@/domains/project-management/services/project-file-service", () => ({
  loadProject: vi.fn(),
  saveProject: vi.fn(),
}))

const { loadProject: mockLoadProject, saveProject: mockSaveProject } = await import(
  "@/domains/project-management/services/project-file-service"
)

describe("useProjectLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loadProject", () => {
    it("should call loadProject from service and return project data", async () => {
      const mockProjectData = {
        settings: { fps: 30, resolution: { width: 1920, height: 1080 } },
      }
      vi.mocked(mockLoadProject).mockResolvedValue(mockProjectData as any)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"
      const project = await result.current.loadProject(path)

      expect(mockLoadProject).toHaveBeenCalledWith(path)
      expect(project).toEqual(mockProjectData)
    })

    it("should propagate errors from loadProject", async () => {
      const error = new Error("File not found")
      vi.mocked(mockLoadProject).mockRejectedValue(error)

      const { result } = renderHook(() => useProjectLoader())

      await expect(result.current.loadProject("/invalid/path.tlsp")).rejects.toThrow("File not found")
    })

    it("should handle loading different project paths", async () => {
      vi.mocked(mockLoadProject).mockResolvedValue({ settings: { fps: 30 } } as any)

      const { result } = renderHook(() => useProjectLoader())

      await result.current.loadProject("/path/project1.tlsp")
      await result.current.loadProject("/path/project2.tlsp")

      expect(mockLoadProject).toHaveBeenCalledTimes(2)
      expect(mockLoadProject).toHaveBeenNthCalledWith(1, "/path/project1.tlsp")
      expect(mockLoadProject).toHaveBeenNthCalledWith(2, "/path/project2.tlsp")
    })

    it("should be memoized and return same reference", () => {
      const { result, rerender } = renderHook(() => useProjectLoader())

      const firstRender = result.current.loadProject
      rerender()
      const secondRender = result.current.loadProject

      expect(firstRender).toBe(secondRender)
    })
  })

  describe("saveProject", () => {
    it("should call saveProject from service with path and data", async () => {
      vi.mocked(mockSaveProject).mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"
      const data = {
        name: "Test Project",
        timeline: { tracks: [] },
      }

      await result.current.saveProject(path, data)

      expect(mockSaveProject).toHaveBeenCalledWith(path, data)
    })

    it("should propagate errors from saveProject", async () => {
      const error = new Error("Permission denied")
      vi.mocked(mockSaveProject).mockRejectedValue(error)

      const { result } = renderHook(() => useProjectLoader())

      await expect(result.current.saveProject("/invalid/path.tlsp", {})).rejects.toThrow("Permission denied")
    })

    it("should handle saving different project data", async () => {
      vi.mocked(mockSaveProject).mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"
      const data1 = { settings: { fps: 30 } }
      const data2 = { settings: { fps: 60 } }

      await result.current.saveProject(path, data1)
      await result.current.saveProject(path, data2)

      expect(mockSaveProject).toHaveBeenCalledTimes(2)
      expect(mockSaveProject).toHaveBeenNthCalledWith(1, path, data1)
      expect(mockSaveProject).toHaveBeenNthCalledWith(2, path, data2)
    })

    it("should be memoized and return same reference", () => {
      const { result, rerender } = renderHook(() => useProjectLoader())

      const firstRender = result.current.saveProject
      rerender()
      const secondRender = result.current.saveProject

      expect(firstRender).toBe(secondRender)
    })
  })

  describe("hook return value", () => {
    it("should return object with loadProject and saveProject methods", () => {
      const { result } = renderHook(() => useProjectLoader())

      expect(result.current).toHaveProperty("loadProject")
      expect(result.current).toHaveProperty("saveProject")
      expect(typeof result.current.loadProject).toBe("function")
      expect(typeof result.current.saveProject).toBe("function")
    })

    it("should return memoized object that stays the same on re-renders", () => {
      const { result, rerender } = renderHook(() => useProjectLoader())

      const firstRender = result.current
      rerender()
      const secondRender = result.current

      expect(firstRender).toBe(secondRender)
    })
  })

  describe("integration scenarios", () => {
    it("should support load-modify-save workflow", async () => {
      const initialData = { settings: { fps: 30 } }
      const modifiedData = { settings: { fps: 60 } }

      vi.mocked(mockLoadProject).mockResolvedValue(initialData as any)
      vi.mocked(mockSaveProject).mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"

      // Load project
      const loaded = await result.current.loadProject(path)
      expect(loaded).toEqual(initialData)

      // Save modified version
      await result.current.saveProject(path, modifiedData)

      expect(mockLoadProject).toHaveBeenCalledWith(path)
      expect(mockSaveProject).toHaveBeenCalledWith(path, modifiedData)
    })

    it("should handle concurrent load and save operations", async () => {
      vi.mocked(mockLoadProject).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ settings: { fps: 30 } } as any), 10)),
      )
      vi.mocked(mockSaveProject).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(), 10)))

      const { result } = renderHook(() => useProjectLoader())

      const loadPromise = result.current.loadProject("/path/project.tlsp")
      const savePromise = result.current.saveProject("/path/project.tlsp", { settings: { fps: 60 } })

      await Promise.all([loadPromise, savePromise])

      expect(mockLoadProject).toHaveBeenCalled()
      expect(mockSaveProject).toHaveBeenCalled()
    })
  })
})

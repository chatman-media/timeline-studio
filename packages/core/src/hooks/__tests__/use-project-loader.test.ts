/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { container } from "../../container"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useProjectLoader } from "../use-project-loader"

function getPlatformMocks() {
  const platform = container.getPlatform()
  return {
    readTextFile: vi.mocked(platform.readTextFile),
    writeTextFile: vi.mocked(platform.writeTextFile),
  }
}

function getWrittenProject(callIndex = 0) {
  const { writeTextFile } = getPlatformMocks()
  return JSON.parse(writeTextFile.mock.calls[callIndex][1] as string)
}

describe("useProjectLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("loadProject", () => {
    it("should call loadProject from service and return project data", async () => {
      const mockProjectData = {
        settings: { fps: 30, resolution: { width: 1920, height: 1080 } },
      }
      const { readTextFile } = getPlatformMocks()
      readTextFile.mockResolvedValue(JSON.stringify(mockProjectData))

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"
      const project = await result.current.loadProject(path)

      expect(readTextFile).toHaveBeenCalledWith(path)
      expect(project).toEqual(mockProjectData)
    })

    it("should propagate errors from loadProject", async () => {
      const error = new Error("File not found")
      const { readTextFile } = getPlatformMocks()
      readTextFile.mockRejectedValue(error)

      const { result } = renderHook(() => useProjectLoader())

      await expect(result.current.loadProject("/invalid/path.tlsp")).rejects.toThrow("File not found")
    })

    it("should handle loading different project paths", async () => {
      const { readTextFile } = getPlatformMocks()
      readTextFile.mockResolvedValue(JSON.stringify({ settings: { fps: 30 } }))

      const { result } = renderHook(() => useProjectLoader())

      await result.current.loadProject("/path/project1.tlsp")
      await result.current.loadProject("/path/project2.tlsp")

      expect(readTextFile).toHaveBeenCalledTimes(2)
      expect(readTextFile).toHaveBeenNthCalledWith(1, "/path/project1.tlsp")
      expect(readTextFile).toHaveBeenNthCalledWith(2, "/path/project2.tlsp")
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
      const { writeTextFile } = getPlatformMocks()
      writeTextFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"
      const data = {
        name: "Test Project",
        timeline: { tracks: [] },
      }

      await result.current.saveProject(path, data)

      expect(writeTextFile).toHaveBeenCalledWith(path, expect.any(String))
      expect(getWrittenProject()).toMatchObject(data)
      expect(getWrittenProject().meta.lastModified).toEqual(expect.any(Number))
    })

    it("should propagate errors from saveProject", async () => {
      const error = new Error("Permission denied")
      const { writeTextFile } = getPlatformMocks()
      writeTextFile.mockRejectedValue(error)

      const { result } = renderHook(() => useProjectLoader())

      await expect(result.current.saveProject("/invalid/path.tlsp", {})).rejects.toThrow("Permission denied")
    })

    it("should handle saving different project data", async () => {
      const { writeTextFile } = getPlatformMocks()
      writeTextFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"
      const data1 = { settings: { fps: 30 } }
      const data2 = { settings: { fps: 60 } }

      await result.current.saveProject(path, data1)
      await result.current.saveProject(path, data2)

      expect(writeTextFile).toHaveBeenCalledTimes(2)
      expect(writeTextFile).toHaveBeenNthCalledWith(1, path, expect.any(String))
      expect(writeTextFile).toHaveBeenNthCalledWith(2, path, expect.any(String))
      expect(getWrittenProject(0)).toMatchObject(data1)
      expect(getWrittenProject(1)).toMatchObject(data2)
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

      const { readTextFile, writeTextFile } = getPlatformMocks()
      readTextFile.mockResolvedValue(JSON.stringify(initialData))
      writeTextFile.mockResolvedValue(undefined)

      const { result } = renderHook(() => useProjectLoader())

      const path = "/projects/test.tlsp"

      // Load project
      const loaded = await result.current.loadProject(path)
      expect(loaded).toEqual(initialData)

      // Save modified version
      await result.current.saveProject(path, modifiedData)

      expect(readTextFile).toHaveBeenCalledWith(path)
      expect(writeTextFile).toHaveBeenCalledWith(path, expect.any(String))
      expect(getWrittenProject()).toMatchObject(modifiedData)
    })

    it("should handle concurrent load and save operations", async () => {
      const { readTextFile, writeTextFile } = getPlatformMocks()
      readTextFile.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(JSON.stringify({ settings: { fps: 30 } })), 10)),
      )
      writeTextFile.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(), 10)))

      const { result } = renderHook(() => useProjectLoader())

      const loadPromise = result.current.loadProject("/path/project.tlsp")
      const savePromise = result.current.saveProject("/path/project.tlsp", { settings: { fps: 60 } })

      await Promise.all([loadPromise, savePromise])

      expect(readTextFile).toHaveBeenCalled()
      expect(writeTextFile).toHaveBeenCalled()
    })
  })
})

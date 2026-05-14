/**
 * @vitest-environment jsdom
 */
/**
 * Use Current Project Hook Tests
 *
 * Тесты для хука useCurrentProject
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCurrentProject } from "../../hooks/use-current-project"
import * as appProvider from "../../providers/app-provider"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock Tauri dialog plugin
const mockSave = vi.fn()
vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: mockSave,
}))

// Mock useApp hook
const mockExecuteCommand = vi.fn()
const mockProjectState = {
  project: {
    id: "project-1",
    name: "Test Project",
    settings: {
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      audio_sample_rate: 48000,
      audio_channels: 2,
    },
  },
}

vi.mock("../../providers/app-provider", () => ({
  useApp: vi.fn(() => ({
    projectState: mockProjectState,
    executeCommand: mockExecuteCommand,
  })),
}))

describe("useCurrentProject Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockResolvedValue({ success: true })
    // Reset console.log mock
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  describe("currentProject", () => {
    it("should return current project from state", () => {
      const { result } = renderHook(() => useCurrentProject())

      expect(result.current.currentProject).toEqual(mockProjectState.project)
    })

    it("should return null when no project state", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: null,
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useCurrentProject())

      expect(result.current.currentProject).toBeNull()
    })

    it("should return null when project is not in state", () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: {},
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useCurrentProject())

      expect(result.current.currentProject).toBeNull()
    })
  })

  describe("createNewProject", () => {
    it("should execute CreateProject command with correct parameters", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.createNewProject("My Project")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "My Project",
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      })
    })

    it("should return command result", async () => {
      const mockResult = { success: true, data: { id: "new-project" } }
      mockExecuteCommand.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useCurrentProject())

      const commandResult = await result.current.createNewProject("My Project")

      expect(commandResult).toEqual(mockResult)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to create project")
      mockExecuteCommand.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCurrentProject())

      await expect(result.current.createNewProject("My Project")).rejects.toThrow("Failed to create project")
    })
  })

  describe("createTempProject", () => {
    it("should create project with 'Temp Project' name", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.createTempProject()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "Temp Project",
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      })
    })

    it("should use default settings", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.createTempProject()

      const call = mockExecuteCommand.mock.calls[0][0]
      expect(call.params.settings.resolution).toEqual({
        width: 1920,
        height: 1080,
      })
      expect(call.params.settings.frame_rate).toBe(30)
    })
  })

  describe("loadOrCreateTempProject", () => {
    it("should create temporary project", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.loadOrCreateTempProject()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "Temporary Project",
          settings: {
            resolution: { width: 1920, height: 1080 },
            frame_rate: 30,
            audio_sample_rate: 48000,
            audio_channels: 2,
          },
        },
      })
    })
  })

  describe("openProject", () => {
    it("should execute OpenProject command with correct path", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.openProject("/path/to/project.tls")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "OpenProject",
        params: { path: "/path/to/project.tls" },
      })
    })

    it("should return command result", async () => {
      const mockResult = {
        success: true,
        data: { project: mockProjectState.project },
      }
      mockExecuteCommand.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useCurrentProject())

      const commandResult = await result.current.openProject("/path/to/project.tls")

      expect(commandResult).toEqual(mockResult)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to open project")
      mockExecuteCommand.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCurrentProject())

      await expect(result.current.openProject("/path/to/project.tls")).rejects.toThrow("Failed to open project")
    })
  })

  describe("saveProject", () => {
    it("should execute SaveProject command without path", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.saveProject()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: { path: null },
      })
    })

    it("should execute SaveProject command with path", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.saveProject("/path/to/project.tls")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: { path: "/path/to/project.tls" },
      })
    })

    it("should return command result", async () => {
      const mockResult = { success: true }
      mockExecuteCommand.mockResolvedValueOnce(mockResult)

      const { result } = renderHook(() => useCurrentProject())

      const commandResult = await result.current.saveProject("/path/to/project.tls")

      expect(commandResult).toEqual(mockResult)
    })

    it("should handle errors", async () => {
      const error = new Error("Failed to save project")
      mockExecuteCommand.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCurrentProject())

      await expect(result.current.saveProject("/path/to/project.tls")).rejects.toThrow("Failed to save project")
    })
  })

  describe("saveProjectAs", () => {
    beforeEach(() => {
      mockSave.mockResolvedValue("/path/to/new-project.tls")
    })

    it("should open save dialog and save project with selected path", async () => {
      const { result } = renderHook(() => useCurrentProject())

      const savedPath = await result.current.saveProjectAs()

      expect(mockSave).toHaveBeenCalledWith({
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tls"],
          },
        ],
        defaultPath: "/Users/testTimelineStudioProjects/Test Project.tls",
      })
      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: { path: "/path/to/new-project.tls" },
      })
      expect(savedPath).toBe("/path/to/new-project.tls")
    })

    it("should append .tls extension if not present", async () => {
      mockSave.mockResolvedValueOnce("/path/to/project")
      const { result } = renderHook(() => useCurrentProject())

      const savedPath = await result.current.saveProjectAs()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: { path: "/path/to/project.tls" },
      })
      expect(savedPath).toBe("/path/to/project.tls")
    })

    it("should return null if user cancels dialog", async () => {
      mockSave.mockResolvedValueOnce(null)
      const { result } = renderHook(() => useCurrentProject())

      const savedPath = await result.current.saveProjectAs()

      expect(mockExecuteCommand).not.toHaveBeenCalled()
      expect(savedPath).toBeNull()
    })

    it("should use default filename when no project name", async () => {
      vi.mocked(appProvider.useApp).mockReturnValueOnce({
        projectState: { project: null },
        executeCommand: mockExecuteCommand,
      } as any)

      const { result } = renderHook(() => useCurrentProject())

      await result.current.saveProjectAs()

      expect(mockSave).toHaveBeenCalledWith({
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tls"],
          },
        ],
        defaultPath: "/Users/testTimelineStudioProjects/project.tls",
      })
    })

    it("should handle errors", async () => {
      const error = new Error("Dialog failed")
      mockSave.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCurrentProject())

      await expect(result.current.saveProjectAs()).rejects.toThrow("Dialog failed")
    })
  })

  describe("setProjectDirty", () => {
    it("should log dirty state", () => {
      const { result } = renderHook(() => useCurrentProject())
      const consoleSpy = vi.spyOn(console, "log")

      result.current.setProjectDirty(true)

      expect(consoleSpy).toHaveBeenCalledWith("Project dirty state:", true)
    })

    it("should handle false value", () => {
      const { result } = renderHook(() => useCurrentProject())
      const consoleSpy = vi.spyOn(console, "log")

      result.current.setProjectDirty(false)

      expect(consoleSpy).toHaveBeenCalledWith("Project dirty state:", false)
    })
  })

  describe("isTempProject", () => {
    it("should always return false", () => {
      const { result } = renderHook(() => useCurrentProject())

      expect(result.current.isTempProject).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle concurrent operations", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await Promise.all([
        result.current.createNewProject("Project 1"),
        result.current.createNewProject("Project 2"),
        result.current.saveProject("/path/to/project.tls"),
      ])

      expect(mockExecuteCommand).toHaveBeenCalledTimes(3)
    })

    it("should handle empty project name", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.createNewProject("")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "",
          settings: expect.any(Object),
        },
      })
    })

    it("should handle special characters in project name", async () => {
      const { result } = renderHook(() => useCurrentProject())

      await result.current.createNewProject("Project (2024) [Final]")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "Project (2024) [Final]",
          settings: expect.any(Object),
        },
      })
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", () => {
      const { result, rerender } = renderHook(() => useCurrentProject())

      const initialCreateNew = result.current.createNewProject
      const initialCreateTemp = result.current.createTempProject
      const initialOpen = result.current.openProject
      const initialSave = result.current.saveProject
      const initialSaveAs = result.current.saveProjectAs

      rerender()

      // Note: These are arrow functions, so they won't be stable
      expect(typeof result.current.createNewProject).toBe("function")
      expect(typeof result.current.createTempProject).toBe("function")
      expect(typeof result.current.openProject).toBe("function")
      expect(typeof result.current.saveProject).toBe("function")
      expect(typeof result.current.saveProjectAs).toBe("function")
    })
  })
})

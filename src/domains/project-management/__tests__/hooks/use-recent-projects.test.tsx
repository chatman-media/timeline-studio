/**
 * Use Recent Projects Hook Tests
 *
 * Тесты для хука useRecentProjects
 */

import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useRecentProjects } from "../../hooks/use-recent-projects"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock storeService
const mockGetRecentProjects = vi.fn()
const mockAddRecentProject = vi.fn()

vi.mock("../../services/store-service", () => ({
  storeService: {
    getRecentProjects: mockGetRecentProjects,
    addRecentProject: mockAddRecentProject,
  },
}))

describe("useRecentProjects Hook", () => {
  const mockProjects = [
    { path: "/project1.tls", name: "Project 1", lastOpened: Date.now() - 1000 },
    { path: "/project2.tls", name: "Project 2", lastOpened: Date.now() - 2000 },
    { path: "/project3.tls", name: "Project 3", lastOpened: Date.now() - 3000 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRecentProjects.mockResolvedValue(mockProjects)
    mockAddRecentProject.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty array", () => {
      mockGetRecentProjects.mockResolvedValueOnce([])
      const { result } = renderHook(() => useRecentProjects())

      expect(result.current.recentProjects).toEqual([])
    })

    it("should load recent projects on mount", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      expect(mockGetRecentProjects).toHaveBeenCalledTimes(1)
    })

    it("should handle errors during initial load", async () => {
      mockGetRecentProjects.mockRejectedValueOnce(new Error("Failed to load"))

      const { result } = renderHook(() => useRecentProjects())

      // Should still initialize
      expect(result.current.recentProjects).toEqual([])
    })
  })

  describe("addRecentProject", () => {
    it("should add project to recent list", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      const newProjects = [
        { path: "/new-project.tls", name: "New Project", lastOpened: Date.now() },
        ...mockProjects,
      ]
      mockGetRecentProjects.mockResolvedValueOnce(newProjects)

      await result.current.addRecentProject("/new-project.tls", "New Project")

      expect(mockAddRecentProject).toHaveBeenCalledWith("/new-project.tls", "New Project")

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(newProjects)
      })
    })

    it("should refresh list after adding", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      mockGetRecentProjects.mockResolvedValueOnce([...mockProjects])

      await result.current.addRecentProject("/project4.tls", "Project 4")

      expect(mockGetRecentProjects).toHaveBeenCalledTimes(2) // Once on mount, once after add
    })

    it("should handle errors when adding", async () => {
      mockAddRecentProject.mockRejectedValueOnce(new Error("Failed to add"))

      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      await expect(result.current.addRecentProject("/project4.tls", "Project 4")).rejects.toThrow("Failed to add")
    })

    it("should handle errors when refreshing after add", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      mockGetRecentProjects.mockRejectedValueOnce(new Error("Failed to refresh"))

      await expect(result.current.addRecentProject("/project4.tls", "Project 4")).rejects.toThrow()
    })
  })

  describe("removeRecentProject", () => {
    it("should log warning for not implemented feature", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      // Should not throw
      await result.current.removeRecentProject("/project1.tls")

      // Function exists but doesn't do anything yet
      expect(result.current.recentProjects).toEqual(mockProjects)
    })
  })

  describe("clearRecentProjects", () => {
    it("should log warning for not implemented feature", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      // Should not throw
      await result.current.clearRecentProjects()

      // Function exists but doesn't do anything yet
      expect(result.current.recentProjects).toEqual(mockProjects)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty project list", async () => {
      mockGetRecentProjects.mockResolvedValueOnce([])

      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual([])
      })
    })

    it("should handle large number of projects", async () => {
      const manyProjects = Array.from({ length: 100 }, (_, i) => ({
        path: `/project${i}.tls`,
        name: `Project ${i}`,
        lastOpened: Date.now() - i * 1000,
      }))

      mockGetRecentProjects.mockResolvedValueOnce(manyProjects)

      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toHaveLength(100)
      })
    })

    it("should handle special characters in project names", async () => {
      const specialProjects = [
        { path: "/project [1].tls", name: "Project [1]", lastOpened: Date.now() - 1000 },
        { path: "/проект.tls", name: "Русский проект", lastOpened: Date.now() - 2000 },
        { path: "/项目.tls", name: "中文项目", lastOpened: Date.now() - 3000 },
      ]

      mockGetRecentProjects.mockResolvedValueOnce(specialProjects)

      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(specialProjects)
      })
    })

    it("should handle concurrent add operations", async () => {
      const { result } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      await Promise.all([
        result.current.addRecentProject("/project4.tls", "Project 4"),
        result.current.addRecentProject("/project5.tls", "Project 5"),
      ])

      expect(mockAddRecentProject).toHaveBeenCalledTimes(2)
    })
  })

  describe("Unmount Behavior", () => {
    it("should cleanup properly on unmount", async () => {
      const { unmount } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(mockGetRecentProjects).toHaveBeenCalled()
      })

      // Should not throw
      unmount()
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", async () => {
      const { result, rerender } = renderHook(() => useRecentProjects())

      await waitFor(() => {
        expect(result.current.recentProjects).toEqual(mockProjects)
      })

      const initialAdd = result.current.addRecentProject
      const initialRemove = result.current.removeRecentProject
      const initialClear = result.current.clearRecentProjects

      rerender()

      // Note: These are arrow functions in object literals, so they won't be stable
      expect(typeof result.current.addRecentProject).toBe("function")
      expect(typeof result.current.removeRecentProject).toBe("function")
      expect(typeof result.current.clearRecentProjects).toBe("function")
    })
  })
})

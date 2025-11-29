/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AgentType, WorkflowTemplate } from "../../types/dashboard"
import { useAIDirectorDashboard } from "../use-ai-director-dashboard"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    infoSync: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

describe("useAIDirectorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty agents and default stats", () => {
      const { result } = renderHook(() => useAIDirectorDashboard())

      expect(result.current.agents).toEqual([])
      expect(result.current.stats).toEqual({
        totalAnalysis: 0,
        totalMontages: 0,
        totalRecognitions: 0,
        totalExports: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        todayAnalysis: 0,
        todayMontages: 0,
      })
    })

    it("should use provided stats", () => {
      const customStats = {
        totalAnalysis: 10,
        totalMontages: 5,
        totalRecognitions: 3,
        totalExports: 2,
        totalProcessingTime: 1000,
        averageProcessingTime: 100,
        todayAnalysis: 2,
        todayMontages: 1,
      }

      const { result } = renderHook(() => useAIDirectorDashboard())

      expect(result.current.stats.totalAnalysis).toEqual(0)
    })
  })

  describe("Agent Management", () => {
    it("should add agent", () => {
      const { result } = renderHook(() => useAIDirectorDashboard())

      const agent = {
        id: "agent-1",
        type: "analysis" as AgentType,
        name: "Video Analysis",
        description: "Analyzing video",
        status: "running" as const,
        progress: 50,
      }

      act(() => {
        result.current.addAgent(agent)
      })

      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0]).toEqual(agent)
    })

    it("should update agent", () => {
      const { result } = renderHook(() => useAIDirectorDashboard())

      const agent = {
        id: "agent-1",
        type: "analysis" as AgentType,
        name: "Video Analysis",
        description: "Analyzing video",
        status: "running" as const,
        progress: 50,
      }

      act(() => {
        result.current.addAgent(agent)
      })

      act(() => {
        result.current.updateAgent("agent-1", { progress: 75, description: "Almost done" })
      })

      expect(result.current.agents[0].progress).toBe(75)
      expect(result.current.agents[0].description).toBe("Almost done")
    })

    it("should remove agent", () => {
      const { result } = renderHook(() => useAIDirectorDashboard())

      const agent = {
        id: "agent-1",
        type: "analysis" as AgentType,
        name: "Video Analysis",
        description: "Analyzing video",
        status: "running" as const,
      }

      act(() => {
        result.current.addAgent(agent)
      })

      expect(result.current.agents).toHaveLength(1)

      act(() => {
        result.current.removeAgent("agent-1")
      })

      expect(result.current.agents).toHaveLength(0)
    })

    it("should clear completed agents", () => {
      const { result } = renderHook(() => useAIDirectorDashboard())

      const runningAgent = {
        id: "agent-1",
        type: "analysis" as AgentType,
        name: "Video Analysis",
        description: "Analyzing",
        status: "running" as const,
      }

      const completedAgent = {
        id: "agent-2",
        type: "montage" as AgentType,
        name: "Smart Montage",
        description: "Completed",
        status: "completed" as const,
      }

      act(() => {
        result.current.addAgent(runningAgent)
        result.current.addAgent(completedAgent)
      })

      expect(result.current.agents).toHaveLength(2)

      act(() => {
        result.current.clearCompleted()
      })

      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].id).toBe("agent-1")
    })
  })

  describe("File Progress Integration", () => {
    it("should create agents from active files", () => {
      const filesProgress = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "analyzing" as const,
          progress: 50,
          startTime: new Date().toISOString(),
          analyzers: [],
        },
      ]

      const { result } = renderHook(() => useAIDirectorDashboard(filesProgress))

      expect(result.current.agents).toHaveLength(1)
      expect(result.current.agents[0].type).toBe("analysis")
      expect(result.current.agents[0].progress).toBe(50)
    })

    it("should update agents when file progress changes", () => {
      const { result, rerender } = renderHook(({ files }) => useAIDirectorDashboard(files), {
        initialProps: {
          files: [
            {
              fileId: "file-1",
              fileName: "video1.mp4",
              filePath: "/path/to/video1.mp4",
              status: "analyzing" as const,
              progress: 50,
              startTime: new Date().toISOString(),
              analyzers: [],
            },
          ],
        },
      })

      expect(result.current.agents[0].progress).toBe(50)

      rerender({
        files: [
          {
            fileId: "file-1",
            fileName: "video1.mp4",
            filePath: "/path/to/video1.mp4",
            status: "analyzing" as const,
            progress: 75,
            startTime: new Date().toISOString(),
            analyzers: [],
          },
        ],
      })

      expect(result.current.agents[0].progress).toBe(75)
    })

    it("should update stats based on completed files", () => {
      const filesProgress = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed" as const,
          progress: 100,
          startTime: new Date().toISOString(),
          analyzers: [],
        },
        {
          fileId: "file-2",
          fileName: "video2.mp4",
          filePath: "/path/to/video2.mp4",
          status: "completed" as const,
          progress: 100,
          startTime: new Date().toISOString(),
          analyzers: [],
        },
      ]

      const { result } = renderHook(() => useAIDirectorDashboard(filesProgress))

      expect(result.current.stats.totalAnalysis).toBe(2)
    })

    it("should track today's analysis", () => {
      const today = new Date()
      const filesProgress = [
        {
          fileId: "file-1",
          fileName: "video1.mp4",
          filePath: "/path/to/video1.mp4",
          status: "completed" as const,
          progress: 100,
          startTime: today.toISOString(),
          analyzers: [],
        },
      ]

      const { result } = renderHook(() => useAIDirectorDashboard(filesProgress))

      expect(result.current.stats.todayAnalysis).toBe(1)
    })
  })

  describe("Workflow Management", () => {
    it("should start workflow and create agents", async () => {
      const { result } = renderHook(() => useAIDirectorDashboard())

      const workflow: WorkflowTemplate = {
        id: "test-workflow",
        name: "Test Workflow",
        description: "Test",
        category: "social",
        icon: "🎬",
        agents: ["analysis", "montage"],
        parameters: {
          format: "horizontal",
          platform: "universal",
        },
        tags: ["test"],
        isBuiltIn: false,
      }

      await act(async () => {
        await result.current.startWorkflow(workflow)
      })

      // Should create agents for each step in workflow
      expect(result.current.agents.length).toBeGreaterThan(0)
    })
  })
})

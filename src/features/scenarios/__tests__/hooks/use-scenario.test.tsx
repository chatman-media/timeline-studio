/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineStudioProject } from "@/domains/project-management/types"

import { useScenario } from "../../hooks/use-scenario"
import { scenarioExecutor } from "../../services/scenario-executor"
import type { Scenario } from "../../types/scenario"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock scenarios library
vi.mock("../../lib/scenarios", () => ({
  allScenarios: [
    {
      id: "quick-vlog",
      name: { en: "Quick Vlog", ru: "Быстрый влог" },
      description: { en: "Quick vlog editing", ru: "Быстрый монтаж влога" },
      category: "automation",
      difficulty: "beginner",
      estimatedTime: 5,
      requirements: { aiAssisted: false },
      steps: [
        {
          id: "step-1",
          type: "select-clips",
          name: { en: "Select Clips", ru: "Выбор клипов" },
          config: {},
        },
      ],
      settings: {
        allowSkipSteps: true,
        showPreview: true,
        saveProgress: true,
        undoSupport: true,
      },
    },
    {
      id: "pro-montage",
      name: { en: "Pro Montage", ru: "Профессиональный монтаж" },
      description: { en: "Professional montage", ru: "Профессиональный монтаж" },
      category: "effects",
      difficulty: "advanced",
      estimatedTime: 30,
      requirements: { aiAssisted: true },
      steps: [
        {
          id: "step-1",
          type: "analyze-video",
          name: { en: "Analyze", ru: "Анализ" },
          config: {},
        },
        {
          id: "step-2",
          type: "apply-effects",
          name: { en: "Effects", ru: "Эффекты" },
          config: {},
        },
      ],
      settings: {
        allowSkipSteps: false,
        showPreview: true,
        saveProgress: true,
        undoSupport: true,
      },
    },
    {
      id: "intermediate-edit",
      name: { en: "Intermediate Edit", ru: "Средний уровень" },
      category: "structure",
      difficulty: "intermediate",
      estimatedTime: 15,
      requirements: {},
      steps: [
        {
          id: "step-1",
          type: "add-intro",
          name: { en: "Add Intro", ru: "Добавить интро" },
          config: {},
        },
      ],
      settings: {
        allowSkipSteps: true,
        showPreview: true,
        saveProgress: true,
        undoSupport: true,
      },
    },
  ] as unknown as Scenario[],
  getScenariosByCategory: vi.fn((category: string) => {
    const all = [
      {
        id: "quick-vlog",
        category: "automation",
        difficulty: "beginner",
        estimatedTime: 5,
        requirements: {},
        steps: [],
        settings: {},
      },
    ] as unknown as Scenario[]
    return all.filter((s) => s.category === category)
  }),
  getScenariosByDifficulty: vi.fn((difficulty: string) => {
    const all = [
      {
        id: "quick-vlog",
        category: "automation",
        difficulty: "beginner",
        estimatedTime: 5,
        requirements: {},
        steps: [],
        settings: {},
      },
      {
        id: "pro-montage",
        category: "effects",
        difficulty: "advanced",
        estimatedTime: 30,
        requirements: {},
        steps: [],
        settings: {},
      },
    ] as unknown as Scenario[]
    return all.filter((s) => s.difficulty === difficulty)
  }),
}))

describe("useScenario", () => {
  let mockProject: TimelineStudioProject

  beforeEach(() => {
    vi.clearAllMocks()

    mockProject = {
      metadata: {
        id: "test-project",
        name: "Test Project",
        version: "1.0.0",
        created: new Date(),
        modified: new Date(),
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        aspectRatio: "16:9",
        audio: {
          sampleRate: 48000,
          bitDepth: 16,
          channels: 2,
          masterVolume: 1,
          panLaw: "-3dB",
        },
        preview: {
          resolution: "full",
          quality: "best",
          renderDuringPlayback: true,
          useGPU: true,
        },
      },
      sequences: [],
      mediaLibrary: {
        items: [],
        folders: [],
      },
      preferences: {
        autoSave: true,
        autoSaveInterval: 300,
        showTimecode: true,
      },
    } as unknown as TimelineStudioProject
  })

  describe("initial state", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useScenario())

      expect(result.current.scenarios).toHaveLength(3)
      expect(result.current.selectedScenario).toBeNull()
      expect(result.current.currentStep).toBe(0)
      expect(result.current.totalSteps).toBe(0)
      expect(result.current.progress).toBe(0)
      expect(result.current.result).toBeNull()
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.isPaused).toBe(false)
      expect(result.current.isCompleted).toBe(false)
      expect(result.current.isFailed).toBe(false)
    })
  })

  describe("scenario selection", () => {
    it("should select scenario by id", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.selectScenario("quick-vlog")
      })

      expect(result.current.selectedScenario).toBeDefined()
      expect(result.current.selectedScenario?.id).toBe("quick-vlog")
      expect(result.current.totalSteps).toBe(1)
    })

    it("should clear selection", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.selectScenario("quick-vlog")
      })

      expect(result.current.selectedScenario).toBeDefined()

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selectedScenario).toBeNull()
    })

    it("should get scenario by id", () => {
      const { result } = renderHook(() => useScenario())

      const scenario = result.current.getScenarioById("pro-montage")

      expect(scenario).toBeDefined()
      expect(scenario?.id).toBe("pro-montage")
    })
  })

  describe("filtering", () => {
    it("should filter scenarios by category", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.filterScenarios({ category: "automation" })
      })

      expect(result.current.scenarios.length).toBeGreaterThan(0)
      result.current.scenarios.forEach((scenario) => {
        expect(scenario.category).toBe("automation")
      })
    })

    it("should filter scenarios by difficulty", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.filterScenarios({ difficulty: "beginner" })
      })

      expect(result.current.scenarios.length).toBeGreaterThan(0)
      result.current.scenarios.forEach((scenario) => {
        expect(scenario.difficulty).toBe("beginner")
      })
    })

    it("should filter scenarios by ai-assisted", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.filterScenarios({ aiAssisted: true })
      })

      const filtered = result.current.scenarios
      expect(filtered.every((s) => s.requirements.aiAssisted === true)).toBe(true)
    })

    it("should filter scenarios by estimated time", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.filterScenarios({
          estimatedTime: { min: 10, max: 20 },
        })
      })

      const filtered = result.current.scenarios
      filtered.forEach((scenario) => {
        expect(scenario.estimatedTime).toBeGreaterThanOrEqual(10)
        expect(scenario.estimatedTime).toBeLessThanOrEqual(20)
      })
    })

    it("should reset filters", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.filterScenarios({ category: "automation" })
      })

      expect(result.current.scenarios.length).toBeLessThan(3)

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.scenarios).toHaveLength(3)
    })
  })

  describe("search", () => {
    it("should search scenarios by query", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.searchScenarios("vlog")
      })

      const results = result.current.scenarios
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((s) => s.id === "quick-vlog")).toBe(true)
    })

    it("should search in both languages", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.searchScenarios("влог")
      })

      const results = result.current.scenarios
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((s) => s.id === "quick-vlog")).toBe(true)
    })

    it("should return empty array for non-matching query", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.searchScenarios("non-existent-xyz-123")
      })

      expect(result.current.scenarios).toHaveLength(0)
    })
  })

  describe("sorting", () => {
    it("should sort scenarios by name ascending", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.sortScenarios("name", "asc")
      })

      const sorted = result.current.scenarios
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].name.en.localeCompare(sorted[i].name.en)).toBeLessThanOrEqual(0)
      }
    })

    it("should sort scenarios by name descending", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.sortScenarios("name", "desc")
      })

      const sorted = result.current.scenarios
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].name.en.localeCompare(sorted[i].name.en)).toBeGreaterThanOrEqual(0)
      }
    })

    it("should sort scenarios by difficulty", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.sortScenarios("difficulty", "asc")
      })

      const sorted = result.current.scenarios
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 }

      for (let i = 1; i < sorted.length; i++) {
        expect(difficultyOrder[sorted[i - 1].difficulty]).toBeLessThanOrEqual(difficultyOrder[sorted[i].difficulty])
      }
    })

    it("should sort scenarios by time", () => {
      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.sortScenarios("time", "asc")
      })

      const sorted = result.current.scenarios
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].estimatedTime).toBeLessThanOrEqual(sorted[i].estimatedTime)
      }
    })
  })

  describe("execution state checks", () => {
    it("should check if can execute", () => {
      const { result } = renderHook(() => useScenario())

      expect(result.current.canExecute()).toBe(false)

      act(() => {
        result.current.selectScenario("quick-vlog")
      })

      expect(result.current.canExecute()).toBe(true)
    })

    it("should check if can pause", () => {
      const { result } = renderHook(() => useScenario())

      expect(result.current.canPause()).toBe(false)
    })

    it("should check if can resume", () => {
      const { result } = renderHook(() => useScenario())

      expect(result.current.canResume()).toBe(false)
    })

    it("should check if can cancel", () => {
      const { result } = renderHook(() => useScenario())

      expect(result.current.canCancel()).toBe(false)
    })
  })

  describe("scenario execution", () => {
    it("should throw error if no scenario selected", async () => {
      const { result } = renderHook(() => useScenario())

      await expect(result.current.startExecution(mockProject)).rejects.toThrow("No scenario selected")
    })

    it("should execute scenario successfully", async () => {
      // Mock executor
      vi.spyOn(scenarioExecutor, "executeScenario").mockResolvedValue({
        scenarioId: "quick-vlog",
        status: "success",
        completedSteps: ["step-1"],
        executionTime: 1.5,
        output: {
          projectData: mockProject,
          metadata: {},
        },
      })

      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.selectScenario("quick-vlog")
      })

      await act(async () => {
        await result.current.startExecution(mockProject)
      })

      await waitFor(() => {
        expect(scenarioExecutor.executeScenario).toHaveBeenCalledWith(
          expect.objectContaining({ id: "quick-vlog" }),
          mockProject,
          expect.any(Object),
        )
      })
    })

    it("should handle execution errors", async () => {
      vi.spyOn(scenarioExecutor, "executeScenario").mockRejectedValue(new Error("Execution failed"))

      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.selectScenario("quick-vlog")
      })

      await expect(
        act(async () => {
          await result.current.startExecution(mockProject)
        }),
      ).rejects.toThrow("Execution failed")
    })

    it("should call onProgress callback during execution", async () => {
      const onProgress = vi.fn()

      vi.spyOn(scenarioExecutor, "executeScenario").mockImplementation(async (_scenario, _project, options) => {
        // Simulate progress
        options?.onProgress?.("step-1", 50)
        options?.onProgress?.("step-1", 100)

        return {
          scenarioId: "quick-vlog",
          status: "success",
          completedSteps: ["step-1"],
          executionTime: 1.5,
          output: {
            projectData: mockProject,
            metadata: {},
          },
        }
      })

      const { result } = renderHook(() => useScenario())

      act(() => {
        result.current.selectScenario("quick-vlog")
      })

      await act(async () => {
        await result.current.startExecution(mockProject, { onProgress })
      })

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalledWith("step-1", 50)
        expect(onProgress).toHaveBeenCalledWith("step-1", 100)
      })
    })
  })
})

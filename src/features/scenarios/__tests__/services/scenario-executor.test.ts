import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"

import { ScenarioExecutor, scenarioExecutor } from "../../services/scenario-executor"
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

describe("ScenarioExecutor", () => {
  let executor: ScenarioExecutor
  let mockProject: TimelineStudioProject
  let mockScenario: Scenario

  beforeEach(() => {
    executor = new ScenarioExecutor()

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

    mockScenario = {
      id: "test-scenario",
      name: { en: "Test Scenario", ru: "Тестовый сценарий" },
      description: { en: "Test description", ru: "Тестовое описание" },
      category: "automation",
      difficulty: "beginner",
      estimatedTime: 5,
      requirements: {},
      steps: [
        {
          id: "step-1",
          type: "select-clips",
          name: { en: "Select Clips", ru: "Выбор клипов" },
          config: { minClips: 1 },
        },
        {
          id: "step-2",
          type: "add-template",
          name: { en: "Add Template", ru: "Добавить шаблон" },
          config: { templateType: "graphics" },
        },
      ],
      settings: {
        allowSkipSteps: true,
        showPreview: true,
        saveProgress: true,
        undoSupport: true,
      },
    }
  })

  describe("registerStepHandler", () => {
    it("should register a step handler", () => {
      const handler = vi.fn().mockResolvedValue({ success: true })

      executor.registerStepHandler("custom-step", handler)

      // Check that handler was registered by trying to execute a scenario with that step
      const scenario: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "custom-step-1",
            type: "custom-step" as any,
            name: { en: "Custom", ru: "Кастом" },
            config: {},
          },
        ],
      }

      expect((executor as any).stepHandlers.has("custom-step")).toBe(true)
    })
  })

  describe("executeScenario", () => {
    it("should execute a simple scenario successfully", async () => {
      const result = await executor.executeScenario(mockScenario, mockProject)

      expect(result).toBeDefined()
      expect(result.scenarioId).toBe(mockScenario.id)
      expect(result.status).toBe("success")
      expect(result.completedSteps).toHaveLength(mockScenario.steps.length)
      expect(result.executionTime).toBeGreaterThanOrEqual(0)
    })

    it("should track progress during execution", async () => {
      const onProgress = vi.fn()

      await executor.executeScenario(mockScenario, mockProject, {
        onProgress,
      })

      expect(onProgress).toHaveBeenCalled()
      expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(mockScenario.steps.length)
    })

    it("should call onStepComplete for each step", async () => {
      const onStepComplete = vi.fn()

      await executor.executeScenario(mockScenario, mockProject, {
        onStepComplete,
      })

      expect(onStepComplete).toHaveBeenCalledTimes(mockScenario.steps.length)
    })

    it("should handle optional steps", async () => {
      const scenarioWithOptional: Scenario = {
        ...mockScenario,
        steps: [
          ...mockScenario.steps,
          {
            id: "optional-step",
            type: "add-music",
            name: { en: "Add Music", ru: "Добавить музыку" },
            config: {},
            optional: true,
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithOptional, mockProject, {
        allowSkip: true,
      })

      expect(result.status).toBe("success")
    })

    it("should stop on error when stopOnError is true", async () => {
      // Register a handler that fails
      executor.registerStepHandler("failing-step", async () => ({
        success: false,
        error: "Test error",
      }))

      const scenarioWithError: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "failing",
            type: "failing-step" as any,
            name: { en: "Failing", ru: "Ошибка" },
            config: {},
          },
          {
            id: "never-reached",
            type: "select-clips",
            name: { en: "Never Reached", ru: "Не выполнится" },
            config: {},
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithError, mockProject, {
        stopOnError: true,
      })

      expect(result.status).toBe("failed")
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
      expect(result.completedSteps).toHaveLength(0)
    })

    it("should continue on error when stopOnError is false", async () => {
      // Register a handler that fails
      executor.registerStepHandler("failing-step", async () => ({
        success: false,
        error: "Test error",
      }))

      const scenarioWithError: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "step-1",
            type: "select-clips",
            name: { en: "Step 1", ru: "Шаг 1" },
            config: {},
          },
          {
            id: "failing",
            type: "failing-step" as any,
            name: { en: "Failing", ru: "Ошибка" },
            config: {},
          },
          {
            id: "step-3",
            type: "select-clips",
            name: { en: "Step 3", ru: "Шаг 3" },
            config: {},
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithError, mockProject, {
        stopOnError: false,
      })

      // Status should be "partial" because more than half succeeded
      expect(result.status).toBe("partial")
      expect(result.errors).toBeDefined()
      expect(result.completedSteps).toHaveLength(2) // 2 out of 3 succeeded
    })
  })

  describe("default handlers", () => {
    it("should have default handlers registered", () => {
      const defaultStepTypes = [
        "select-clips",
        "add-template",
        "add-intro",
        "add-outro",
        "add-cuts",
        "add-music",
        "analyze-audio",
        "analyze-video",
        "apply-transitions",
        "apply-effects",
        "sync-beats",
        "auto-montage",
        "add-chapters",
        "preview",
      ]

      defaultStepTypes.forEach((type) => {
        expect((executor as any).stepHandlers.has(type)).toBe(true)
      })
    })
  })

  describe("singleton instance", () => {
    it("should export a singleton instance", () => {
      expect(scenarioExecutor).toBeInstanceOf(ScenarioExecutor)
      expect(scenarioExecutor).toBe(scenarioExecutor)
    })
  })
})

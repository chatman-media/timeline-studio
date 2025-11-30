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

  describe("step validation", () => {
    it("should fail when step has no handler registered", async () => {
      const scenarioWithUnknownStep: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "unknown",
            type: "non-existent-step" as any,
            name: { en: "Unknown", ru: "Неизвестный" },
            config: {},
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithUnknownStep, mockProject)

      expect(result.status).toBe("failed")
      expect(result.errors).toBeDefined()
      expect(result.errors![0].message).toContain("No handler registered")
    })

    it("should validate step with custom validator", async () => {
      const scenarioWithValidation: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "validated-step",
            type: "select-clips",
            name: { en: "Validated", ru: "С валидацией" },
            config: {},
            validation: {
              required: true,
              validator: () => false,
              errorMessage: { en: "Validation failed", ru: "Валидация не прошла" },
            },
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithValidation, mockProject)

      expect(result.status).toBe("failed")
      expect(result.errors).toBeDefined()
    })

    it("should pass validation with custom validator returning true", async () => {
      const scenarioWithValidation: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "validated-step",
            type: "select-clips",
            name: { en: "Validated", ru: "С валидацией" },
            config: {},
            validation: {
              required: true,
              validator: () => true,
            },
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithValidation, mockProject)

      expect(result.status).toBe("success")
    })

    it("should handle validator returning error string", async () => {
      const scenarioWithValidation: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "validated-step",
            type: "select-clips",
            name: { en: "Validated", ru: "С валидацией" },
            config: {},
            validation: {
              validator: () => "Custom error message",
            },
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithValidation, mockProject)

      expect(result.status).toBe("failed")
      expect(result.errors).toBeDefined()
      expect(result.errors![0].message).toBe("Custom error message")
    })
  })

  describe("step execution results", () => {
    it("should collect step data in context", async () => {
      const onStepComplete = vi.fn()

      const result = await executor.executeScenario(mockScenario, mockProject, {
        onStepComplete,
      })

      expect(result.output).toBeDefined()
      expect(result.output.projectData).toBe(mockProject)
      expect(result.output.metadata).toBeDefined()
    })

    it("should handle step that throws an exception", async () => {
      executor.registerStepHandler("throwing-step", async () => {
        throw new Error("Step execution error")
      })

      const scenarioWithError: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "throwing",
            type: "throwing-step" as any,
            name: { en: "Throwing", ru: "С ошибкой" },
            config: {},
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithError, mockProject)

      expect(result.status).toBe("failed")
      expect(result.errors).toBeDefined()
      expect(result.errors![0].message).toBe("Step execution error")
    })

    it("should mark step as skipped when skipped is true in result", async () => {
      executor.registerStepHandler("skippable-step", async () => ({
        success: true,
        skipped: true,
      }))

      const scenarioWithSkip: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "skipped",
            type: "skippable-step" as any,
            name: { en: "Skipped", ru: "Пропущен" },
            config: {},
            optional: true,
          },
        ],
      }

      const result = await executor.executeScenario(scenarioWithSkip, mockProject)

      expect(result.status).toBe("partial")
      expect(result.skippedSteps).toBeDefined()
      expect(result.skippedSteps).toContain("skipped")
    })
  })

  describe("status determination", () => {
    it("should return 'success' when all steps complete successfully", async () => {
      const result = await executor.executeScenario(mockScenario, mockProject)
      expect(result.status).toBe("success")
    })

    it("should return 'failed' when less than half steps succeed", async () => {
      executor.registerStepHandler("failing-step", async () => ({
        success: false,
        error: "Failed",
      }))

      const scenario: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "fail-1",
            type: "failing-step" as any,
            name: { en: "Fail 1", ru: "Ошибка 1" },
            config: {},
          },
          {
            id: "fail-2",
            type: "failing-step" as any,
            name: { en: "Fail 2", ru: "Ошибка 2" },
            config: {},
          },
          {
            id: "success",
            type: "select-clips",
            name: { en: "Success", ru: "Успех" },
            config: {},
          },
        ],
      }

      const result = await executor.executeScenario(scenario, mockProject, {
        stopOnError: false,
      })

      expect(result.status).toBe("failed")
    })

    it("should return 'partial' when some steps are skipped", async () => {
      executor.registerStepHandler("skip-step", async () => ({
        success: true,
        skipped: true,
      }))

      const scenario: Scenario = {
        ...mockScenario,
        steps: [
          {
            id: "normal",
            type: "select-clips",
            name: { en: "Normal", ru: "Обычный" },
            config: {},
          },
          {
            id: "skipped",
            type: "skip-step" as any,
            name: { en: "Skipped", ru: "Пропущен" },
            config: {},
          },
        ],
      }

      const result = await executor.executeScenario(scenario, mockProject)

      expect(result.status).toBe("partial")
      expect(result.skippedSteps).toContain("skipped")
    })
  })

  describe("execution control methods", () => {
    it("should call cancelExecution without errors", async () => {
      await expect(executor.cancelExecution()).resolves.toBeUndefined()
    })

    it("should call pauseExecution without errors", async () => {
      await expect(executor.pauseExecution()).resolves.toBeUndefined()
    })

    it("should call resumeExecution without errors", async () => {
      await expect(executor.resumeExecution()).resolves.toBeUndefined()
    })
  })

  describe("all default step handlers", () => {
    const defaultHandlers = [
      { type: "select-clips", expectedData: { selectedClips: [] } },
      { type: "add-intro", expectedData: { introAdded: true } },
      { type: "add-outro", expectedData: { outroAdded: true } },
      { type: "add-cuts", expectedData: { cutsCount: 0 } },
      { type: "add-music", expectedData: { musicAdded: false } },
      { type: "analyze-audio", expectedData: { beats: [], bpm: 0 } },
      { type: "analyze-video", expectedData: { scenes: [], moments: [] } },
      { type: "apply-transitions", expectedData: { transitionsApplied: 0 } },
      { type: "apply-effects", expectedData: { effectsApplied: 0 } },
      { type: "sync-beats", expectedData: { syncedClips: 0 } },
      { type: "auto-montage", expectedData: { montageCreated: false } },
      { type: "add-chapters", expectedData: { chaptersAdded: 0 } },
      { type: "preview", expectedData: { previewReady: true } },
    ]

    defaultHandlers.forEach(({ type, expectedData }) => {
      it(`should execute ${type} handler successfully`, async () => {
        const scenario: Scenario = {
          ...mockScenario,
          steps: [
            {
              id: `test-${type}`,
              type: type as any,
              name: { en: type, ru: type },
              config: { templateType: "graphics" },
            },
          ],
        }

        const result = await executor.executeScenario(scenario, mockProject)

        expect(result.status).toBe("success")
        expect(result.output.metadata[`test-${type}`]).toEqual(expectedData)
      })
    })
  })
})

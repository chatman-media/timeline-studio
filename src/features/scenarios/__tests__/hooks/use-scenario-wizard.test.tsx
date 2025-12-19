/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineStudioProject } from "@/domains/project-management/types"

import { useScenarioWizard } from "../../hooks/use-scenario-wizard"
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

describe("useScenarioWizard", () => {
  let mockProject: TimelineStudioProject
  let mockScenario: Scenario

  beforeEach(() => {
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
      description: { en: "Test", ru: "Тест" },
      category: "automation",
      difficulty: "beginner",
      estimatedTime: 5,
      requirements: {},
      steps: [
        {
          id: "step-1",
          type: "select-clips",
          name: { en: "Step 1", ru: "Шаг 1" },
          config: {},
        },
        {
          id: "step-2",
          type: "add-template",
          name: { en: "Step 2", ru: "Шаг 2" },
          config: {},
        },
        {
          id: "step-3",
          type: "preview",
          name: { en: "Step 3", ru: "Шаг 3" },
          config: {},
          optional: true,
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

  describe("initialization", () => {
    it("should initialize with first step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      expect(result.current.currentStepIndex).toBe(0)
      expect(result.current.currentStep?.step.id).toBe("step-1")
      expect(result.current.allSteps).toHaveLength(3)
      expect(result.current.isFirstStep).toBe(true)
      expect(result.current.isLastStep).toBe(false)
      expect(result.current.totalCount).toBe(3)
      expect(result.current.completedCount).toBe(0)
      expect(result.current.progress).toBe(0)
    })

    it("should initialize all steps with correct state", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      const allSteps = result.current.allSteps

      expect(allSteps[0].completed).toBe(false)
      expect(allSteps[0].skipped).toBe(false)
      expect(allSteps[0].isValid).toBe(true) // No validation required

      expect(allSteps[1].completed).toBe(false)
      expect(allSteps[1].isValid).toBe(true) // No validation required

      expect(allSteps[2].completed).toBe(false)
      expect(allSteps[2].isValid).toBe(true) // No validation required
    })
  })

  describe("navigation", () => {
    it("should navigate to next step", () => {
      const onStepChange = vi.fn()
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          onStepChange,
        }),
      )

      act(() => {
        result.current.goNext()
      })

      expect(result.current.currentStepIndex).toBe(1)
      expect(result.current.currentStep?.step.id).toBe("step-2")
      expect(onStepChange).toHaveBeenCalledWith(1)
    })

    it("should not navigate to next step on last step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      // Navigate to last step
      act(() => {
        result.current.goNext()
      })
      act(() => {
        result.current.goNext()
      })

      expect(result.current.currentStepIndex).toBe(2)
      expect(result.current.isLastStep).toBe(true)

      // Try to go next from last step
      act(() => {
        result.current.goNext()
      })

      // Should stay at last step
      expect(result.current.currentStepIndex).toBe(2)
    })

    it("should navigate to previous step", () => {
      const onStepChange = vi.fn()
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          onStepChange,
        }),
      )

      // Go to step 2
      act(() => {
        result.current.goNext()
      })

      expect(result.current.currentStepIndex).toBe(1)

      // Go back
      act(() => {
        result.current.goBack()
      })

      expect(result.current.currentStepIndex).toBe(0)
      expect(onStepChange).toHaveBeenCalledWith(0)
    })

    it("should not navigate back if on first step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      expect(result.current.canGoBack).toBe(false)

      act(() => {
        result.current.goBack()
      })

      expect(result.current.currentStepIndex).toBe(0)
    })

    it("should not allow back navigation if disabled", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          allowBackNavigation: false,
        }),
      )

      // Go to step 2
      act(() => {
        result.current.goNext()
      })

      expect(result.current.currentStepIndex).toBe(1)
      expect(result.current.canGoBack).toBe(false)

      act(() => {
        result.current.goBack()
      })

      // Should stay at step 2
      expect(result.current.currentStepIndex).toBe(1)
    })

    it("should navigate to specific step", () => {
      const onStepChange = vi.fn()
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          onStepChange,
        }),
      )

      act(() => {
        result.current.goToStep(2)
      })

      expect(result.current.currentStepIndex).toBe(2)
      expect(result.current.currentStep?.step.id).toBe("step-3")
      expect(onStepChange).toHaveBeenCalledWith(2)
    })

    it("should not navigate to invalid step index", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      act(() => {
        result.current.goToStep(-1)
      })

      expect(result.current.currentStepIndex).toBe(0)

      act(() => {
        result.current.goToStep(10)
      })

      expect(result.current.currentStepIndex).toBe(0)
    })
  })

  describe("skip step", () => {
    it("should skip optional step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          allowSkipOptional: true,
        }),
      )

      // Navigate to optional step (step-3)
      act(() => {
        result.current.goNext() // Go to step-2
      })
      act(() => {
        result.current.goNext() // Go to step-3
      })

      expect(result.current.currentStepIndex).toBe(2)
      expect(result.current.canSkip).toBe(true)

      act(() => {
        result.current.skipStep()
      })

      const skippedStep = result.current.allSteps[2]
      expect(skippedStep.skipped).toBe(true)
      expect(skippedStep.completed).toBe(true)
    })

    it("should not skip non-optional step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          allowSkipOptional: true,
        }),
      )

      // Step 1 is not optional
      expect(result.current.canSkip).toBe(false)

      act(() => {
        result.current.skipStep()
      })

      const firstStep = result.current.allSteps[0]
      expect(firstStep.skipped).toBe(false)
    })

    it("should not skip if allowSkipOptional is false", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          allowSkipOptional: false,
        }),
      )

      // Navigate to optional step
      act(() => {
        result.current.goNext()
      })
      act(() => {
        result.current.setStepData("step-2", { data: "test" })
      })
      act(() => {
        result.current.goNext()
      })

      expect(result.current.canSkip).toBe(false)
    })
  })

  describe("data management", () => {
    it("should set step data", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      const testData = { clips: ["clip1", "clip2"] }

      act(() => {
        result.current.setStepData("step-1", testData)
      })

      expect(result.current.getStepData("step-1")).toEqual(testData)
    })

    it("should get step data", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      const testData = { template: "intro-template" }

      act(() => {
        result.current.setStepData("step-2", testData)
      })

      const data = result.current.getStepData("step-2")
      expect(data).toEqual(testData)
    })

    it("should clear step data", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      act(() => {
        result.current.setStepData("step-1", { data: "test" })
      })

      expect(result.current.getStepData("step-1")).toBeDefined()

      act(() => {
        result.current.clearStepData("step-1")
      })

      expect(result.current.getStepData("step-1")).toBeNull()
      expect(result.current.allSteps[0].completed).toBe(false)
    })
  })

  describe("validation", () => {
    it("should validate current step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      // All steps have no required validation
      expect(result.current.validateCurrentStep()).toBe(true)

      // Navigate to step 2
      act(() => {
        result.current.goNext()
      })

      expect(result.current.validateCurrentStep()).toBe(true)
    })

    it("should validate specific step", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      expect(result.current.validateStep("step-1")).toBe(true)
      expect(result.current.validateStep("step-2")).toBe(true)
      expect(result.current.validateStep("step-3")).toBe(true)
    })

    it("should allow navigation when steps are valid", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      // All steps are valid by default
      expect(result.current.canGoNext).toBe(true)

      // Navigate to step 2
      act(() => {
        result.current.goNext()
      })

      expect(result.current.canGoNext).toBe(true)
    })
  })

  describe("completion", () => {
    it("should complete wizard", () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          onComplete,
        }),
      )

      // Navigate through steps to mark them as completed
      act(() => {
        result.current.goNext() // Complete step-1
        result.current.goNext() // Complete step-2
      })

      act(() => {
        result.current.complete()
      })

      expect(onComplete).toHaveBeenCalled()
      const wizardData = onComplete.mock.calls[0][0]
      expect(wizardData.completedSteps.length).toBeGreaterThan(0)
    })

    it("should cancel wizard", () => {
      const onCancel = vi.fn()
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          onCancel,
        }),
      )

      act(() => {
        result.current.cancel()
      })

      expect(onCancel).toHaveBeenCalled()
    })

    it("should reset wizard", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      // Make some progress
      act(() => {
        result.current.setStepData("step-1", { data: "test" })
        result.current.goNext()
      })

      expect(result.current.currentStepIndex).toBe(1)
      expect(result.current.completedCount).toBeGreaterThan(0)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.currentStepIndex).toBe(0)
      expect(result.current.completedCount).toBe(0)
      expect(result.current.getStepData("step-1")).toBeNull()
    })
  })

  describe("progress tracking", () => {
    it("should track completion progress", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          allowSkipOptional: true,
        }),
      )

      expect(result.current.progress).toBe(0)
      expect(result.current.completedCount).toBe(0)

      // Complete step 1
      act(() => {
        result.current.goNext()
      })

      expect(result.current.completedCount).toBe(1)
      expect(result.current.progress).toBeCloseTo(33.33, 1)

      // Complete step 2
      act(() => {
        result.current.goNext()
      })

      expect(result.current.completedCount).toBe(2)
      expect(result.current.progress).toBeCloseTo(66.67, 1)

      // Skip step 3 (optional)
      act(() => {
        result.current.skipStep()
      })

      expect(result.current.completedCount).toBe(3)
      expect(result.current.progress).toBe(100)
      expect(result.current.isCompleted).toBe(true)
    })
  })

  describe("wizard data", () => {
    it("should collect wizard data from all steps", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
        }),
      )

      act(() => {
        result.current.setStepData("step-1", { clips: ["clip1"] })
        result.current.setStepData("step-2", { template: "intro" })
      })

      const wizardData = result.current.wizardData

      expect(wizardData.steps["step-1"]).toEqual({ clips: ["clip1"] })
      expect(wizardData.steps["step-2"]).toEqual({ template: "intro" })
    })

    it("should track completed and skipped steps", () => {
      const { result } = renderHook(() =>
        useScenarioWizard({
          scenario: mockScenario,
          project: mockProject,
          allowSkipOptional: true,
        }),
      )

      // Complete step 1
      act(() => {
        result.current.goNext()
      })

      // Complete step 2
      act(() => {
        result.current.goNext()
      })

      // Skip step 3
      act(() => {
        result.current.skipStep()
      })

      const wizardData = result.current.wizardData

      expect(wizardData.completedSteps).toContain("step-1")
      expect(wizardData.completedSteps).toContain("step-2")
      expect(wizardData.completedSteps).toContain("step-3")
      expect(wizardData.skippedSteps).toContain("step-3")
    })
  })
})

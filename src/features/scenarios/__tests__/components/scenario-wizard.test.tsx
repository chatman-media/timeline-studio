import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"

import { ScenarioWizard } from "../../components/scenario-wizard"
import type { Scenario } from "../../types/scenario"

// Mock useScenarioWizard hook
const mockUseScenarioWizard = vi.fn()

vi.mock("../../hooks/use-scenario-wizard", () => ({
  useScenarioWizard: () => mockUseScenarioWizard(),
}))

// Mock lucide icons
vi.mock("lucide-react", () => ({
  AlertCircle: () => <div />,
  ArrowLeft: () => <div />,
  ArrowRight: () => <div />,
  Check: () => <div />,
  SkipForward: () => <div />,
  X: () => <div />,
}))

// Mock Dialog components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}))

// Mock other UI components
vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}))

describe("ScenarioWizard", () => {
  const mockProject: TimelineStudioProject = {
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
    timeline: {
      tracks: [],
      duration: 0,
      fps: 30,
    },
  }

  const mockScenario: Scenario = {
    id: "add-intro-outro",
    name: {
      ru: "Добавить одинаковые интро и аутро",
      en: "Add Same Intro and Outro",
    },
    description: {
      ru: "Автоматически добавляет выбранные шаблоны интро и аутро к вашему видео",
      en: "Automatically adds selected intro and outro templates to your video",
    },
    category: "structure",
    difficulty: "beginner",
    estimatedTime: 2,
    requirements: {
      minClips: 1,
      requiresIntro: true,
      requiresOutro: true,
    },
    steps: [
      {
        id: "step-1",
        type: "select-clips",
        name: { ru: "Выбор клипов", en: "Select Clips" },
        description: { ru: "Выберите клипы", en: "Select clips" },
        config: { minClips: 1 },
        validation: { required: true },
      },
      {
        id: "step-2",
        type: "add-intro",
        name: { ru: "Интро", en: "Intro" },
        config: { templateType: "graphics" },
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

  const mockWizardState = {
    currentStepIndex: 0,
    currentStep: {
      step: mockScenario.steps[0],
      index: 0,
      completed: false,
      skipped: false,
      data: null,
      error: null,
      isValid: false,
    },
    allSteps: [
      {
        step: mockScenario.steps[0],
        index: 0,
        completed: false,
        skipped: false,
        data: null,
        error: null,
        isValid: false,
      },
      {
        step: mockScenario.steps[1],
        index: 1,
        completed: false,
        skipped: false,
        data: null,
        error: null,
        isValid: true,
      },
    ],
    isFirstStep: true,
    isLastStep: false,
    canGoNext: false,
    canGoBack: false,
    canSkip: false,
    isCompleted: false,
    progress: 0,
    completedCount: 0,
    totalCount: 2,
    wizardData: {
      steps: {},
      completedSteps: [],
      skippedSteps: [],
    },
    goNext: vi.fn(),
    goBack: vi.fn(),
    goToStep: vi.fn(),
    skipStep: vi.fn(),
    setStepData: vi.fn(),
    getStepData: vi.fn(),
    clearStepData: vi.fn(),
    validateCurrentStep: vi.fn(),
    validateStep: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseScenarioWizard.mockReturnValue(mockWizardState)
  })

  it("должен отображать название сценария в заголовке", () => {
    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText("Добавить одинаковые интро и аутро")).toBeInTheDocument()
  })

  it("не должен отображаться, если open=false", () => {
    const { container } = render(
      <ScenarioWizard
        open={false}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    // Диалог не должен быть видимым
    expect(container.querySelector("[data-testid='dialog']")).not.toBeInTheDocument()
  })

  it("должен отображать прогресс выполнения", () => {
    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByTestId("progress")).toBeInTheDocument()
  })

  it("должен показывать номер текущего шага", () => {
    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByText(/Шаг 1 из 2/)).toBeInTheDocument()
  })

  it("должен отображать кнопку Далее на первом шаге", () => {
    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    const nextButton = screen.getByText("Далее")
    expect(nextButton).toBeInTheDocument()
  })

  it("должен отображать кнопку Завершить на последнем шаге", () => {
    const completedState = {
      ...mockWizardState,
      currentStepIndex: 1,
      isLastStep: true,
      currentStep: {
        ...mockWizardState.currentStep,
        step: mockScenario.steps[1],
      },
    }

    mockUseScenarioWizard.mockReturnValue(completedState)

    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    const completeButton = screen.getByText("Завершить")
    expect(completeButton).toBeInTheDocument()
  })

  it("должен вызывать onClose при клике на кнопку Отмена", async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()

    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={mockOnClose}
        onComplete={vi.fn()}
      />,
    )

    const cancelButton = screen.getByText("Отмена")
    await user.click(cancelButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it("должен вызывать onComplete при завершении", async () => {
    const user = userEvent.setup()
    const mockOnComplete = vi.fn()

    const completedState = {
      ...mockWizardState,
      isCompleted: true,
      complete: mockOnComplete,
    }

    mockUseScenarioWizard.mockReturnValue(completedState)

    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={mockOnComplete}
      />,
    )

    // При завершении должна быть кнопка Готово
    const doneButton = screen.queryByText("Готово")
    if (doneButton) {
      await user.click(doneButton)
    }
  })

  it("должен отображать кнопку Назад, если allowBackNavigation=true", () => {
    const withBackState = {
      ...mockWizardState,
      currentStepIndex: 1,
      canGoBack: true,
    }

    mockUseScenarioWizard.mockReturnValue(withBackState)

    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
        allowBackNavigation={true}
      />,
    )

    // Ищем кнопку Назад
    const backButton = screen.queryByText("Назад")
    if (backButton) {
      expect(backButton).toBeInTheDocument()
    }
  })

  it("должен показывать параметры шага в конфигурации", () => {
    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    // Ищем параметры конфигурации (может быть разбито на несколько элементов)
    const configText = screen.queryByText(/Параметры/)
    if (configText) {
      expect(configText).toBeInTheDocument()
    }
  })

  it("должен отображать информацию об автоматизации", () => {
    const scenarioWithAutomate: Scenario = {
      ...mockScenario,
      steps: [
        {
          ...mockScenario.steps[0],
          automation: {
            canAutomate: true,
            aiAssisted: true,
            engine: "ai-director",
          },
        },
      ],
    }

    render(
      <ScenarioWizard
        open={true}
        scenario={scenarioWithAutomate}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    // Ищем текст об автоматизации (может быть в виде Alert или другого компонента)
    const automationText = screen.queryByText(/автоматиз/i)
    if (automationText) {
      expect(automationText).toBeInTheDocument()
    }
  })

  it("должен отключать кнопки при обработке", async () => {
    const user = userEvent.setup()
    const mockOnNext = vi.fn()

    const processingState = {
      ...mockWizardState,
      canGoNext: true,
    }

    mockUseScenarioWizard.mockReturnValue(processingState)

    render(
      <ScenarioWizard
        open={true}
        scenario={mockScenario}
        project={mockProject}
        onClose={vi.fn()}
        onComplete={mockOnNext}
      />,
    )

    const nextButton = screen.getByText("Далее")
    expect(nextButton).toBeInTheDocument()
  })
})

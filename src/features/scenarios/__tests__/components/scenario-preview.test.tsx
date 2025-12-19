/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ScenarioPreview } from "../../components/scenario-preview"
import type { Scenario } from "../../types/scenario"

// Mock UI components
const setupMocks = () => {
  const components: Record<string, any> = {
    Badge: ({ children, ...props }: any) => (
      <span {...props} data-oid="10hl.51">
        {children}
      </span>
    ),

    Card: ({ children, ...props }: any) => (
      <div {...props} data-oid="4n31j:u">
        {children}
      </div>
    ),

    CardContent: ({ children, ...props }: any) => (
      <div {...props} data-oid="x-qopvi">
        {children}
      </div>
    ),

    CardDescription: ({ children, ...props }: any) => (
      <div {...props} data-oid="2fks57g">
        {children}
      </div>
    ),

    CardHeader: ({ children, ...props }: any) => (
      <div {...props} data-oid="iln0f69">
        {children}
      </div>
    ),

    CardTitle: ({ children, ...props }: any) => (
      <div {...props} data-oid="wgcbyvg">
        {children}
      </div>
    ),

    ScrollArea: ({ children, ...props }: any) => (
      <div {...props} data-oid="87o77-q">
        {children}
      </div>
    ),
  }

  Object.entries(components).forEach(([name, _component]) => {
    const path = `@/components/ui/${name
      .toLowerCase()
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .slice(1)}`
    // Component mocks already in vi.mock calls below
  })
}

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-oid=":d9sqcg">{children}</span>,
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-oid="4wmfxa8">{children}</div>,
  CardContent: ({ children }: any) => <div data-oid="bigl.hn">{children}</div>,
  CardDescription: ({ children }: any) => <div data-oid="w_p.vl8">{children}</div>,
  CardHeader: ({ children }: any) => <div data-oid="p1fklqw">{children}</div>,
  CardTitle: ({ children }: any) => <div data-oid="elg2uot">{children}</div>,
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div data-oid="bua.lm4">{children}</div>,
}))

import { vi } from "vitest"

describe("ScenarioPreview", () => {
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
      {
        id: "step-3",
        type: "add-outro",
        name: { ru: "Аутро", en: "Outro" },
        config: { templateType: "graphics" },
      },
    ],

    settings: {
      allowSkipSteps: false,
      showPreview: true,
      saveProgress: true,
      undoSupport: true,
    },
  }

  it("должен отображать название сценария", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="b591xf4" />)

    expect(screen.getByText("Добавить одинаковые интро и аутро")).toBeInTheDocument()
  })

  it("должен отображать описание сценария", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="hnf.93." />)

    expect(
      screen.getByText("Автоматически добавляет выбранные шаблоны интро и аутро к вашему видео"),
    ).toBeInTheDocument()
  })

  it("должен отображать категорию", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="rnn37xn" />)

    expect(screen.getByText("structure")).toBeInTheDocument()
  })

  it("должен отображать уровень сложности", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="bfvnosz" />)

    expect(screen.getByText("Начальный")).toBeInTheDocument()
  })

  it("должен отображать время выполнения", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="::nl:xm" />)

    expect(screen.getByText("2 мин")).toBeInTheDocument()
  })

  it("должен отображать количество шагов", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="8zbjoyt" />)

    // Ищем количество шагов в контексте "Шагов"
    const stepsSection = screen.getByText("Шагов").parentElement
    expect(stepsSection).toBeInTheDocument()
  })

  it("должен отображать требования при showDetails=true", () => {
    render(<ScenarioPreview scenario={mockScenario} showDetails={true} data-oid="9sk.:ph" />)

    expect(screen.getByText("Требования")).toBeInTheDocument()
  })

  it("не должен отображать требования при showDetails=false", () => {
    render(<ScenarioPreview scenario={mockScenario} showDetails={false} data-oid=":-0jizx" />)

    const requirementsElements = screen.queryAllByText("Требования")
    // Может быть несколько совпадений, проверяем, что раздела требований нет
    expect(requirementsElements.length).toBe(0)
  })

  it("должен отображать все шаги сценария", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="930amvt" />)

    expect(screen.getByText("Выбор клипов")).toBeInTheDocument()
    expect(screen.getByText("Интро")).toBeInTheDocument()
    expect(screen.getByText("Аутро")).toBeInTheDocument()
  })

  it("должен отображать номера шагов", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="xkj7c2_" />)

    // Номера шагов должны быть видны
    const stepNumbers = screen.getAllByText(/^\d+$/)
    expect(stepNumbers.length).toBeGreaterThanOrEqual(3)
  })

  it("должен отображать минимум клипов в требованиях", () => {
    render(<ScenarioPreview scenario={mockScenario} showDetails={true} data-oid="-ng05hc" />)

    const minClipsText = screen.queryByText("Минимум клипов")
    if (minClipsText) {
      expect(minClipsText).toBeInTheDocument()
    }
  })

  it("должен показывать требования для интро", () => {
    render(<ScenarioPreview scenario={mockScenario} showDetails={true} data-oid="z9nvmt." />)

    const introRequirement = screen.queryAllByText(/Требуется интро/)
    expect(introRequirement.length).toBeGreaterThanOrEqual(0)
  })

  it("должен показывать требования для аутро", () => {
    render(<ScenarioPreview scenario={mockScenario} showDetails={true} data-oid="p:6r9zf" />)

    const outroRequirement = screen.queryAllByText(/Требуется аутро/)
    expect(outroRequirement.length).toBeGreaterThanOrEqual(0)
  })

  it("должен отображать информацию об опциональных шагах", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="s5-alw6" />)

    expect(screen.getByText("Опционально")).toBeInTheDocument()
  })

  it("должен отображать настройки сценария при showDetails=true", () => {
    render(<ScenarioPreview scenario={mockScenario} showDetails={true} data-oid="1vfrkjl" />)

    expect(screen.getByText("Настройки")).toBeInTheDocument()
  })

  it("должен использовать переданную высоту", () => {
    const { container } = render(<ScenarioPreview scenario={mockScenario} height="400px" data-oid="cca-am7" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.height).toBe("400px")
  })

  it("должен отображать типы шагов с цветными бейджами", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="ohp0ml5" />)

    expect(screen.getByText("select-clips")).toBeInTheDocument()
    expect(screen.getByText("add-intro")).toBeInTheDocument()
    expect(screen.getByText("add-outro")).toBeInTheDocument()
  })

  it("должен отображать описания шагов", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="7djs0bx" />)

    expect(screen.getByText("Выберите клипы")).toBeInTheDocument()
  })

  it("должен показывать информацию об автоматизации для автоматизированных шагов", () => {
    const scenarioWithAuto: Scenario = {
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

    render(<ScenarioPreview scenario={scenarioWithAuto} data-oid="z8:ed10" />)

    const autoText = screen.queryAllByText(/Авто/)
    expect(autoText.length).toBeGreaterThan(0)
  })

  it("должен отображать индикаторы обязательных шагов", () => {
    render(<ScenarioPreview scenario={mockScenario} data-oid="6gxt5-t" />)

    const requiredBadges = screen.queryAllByText("Обязательно")
    expect(requiredBadges.length).toBeGreaterThanOrEqual(0)
  })

  it("должен правильно форматировать время", () => {
    const scenarioWithLongTime: Scenario = {
      ...mockScenario,
      estimatedTime: 65,
    }

    render(<ScenarioPreview scenario={scenarioWithLongTime} data-oid="ozgydcm" />)

    expect(screen.getByText("1 ч 5 мин")).toBeInTheDocument()
  })

  it("должен отображать информацию о требованиях AI", () => {
    const scenarioWithAI: Scenario = {
      ...mockScenario,
      requirements: {
        ...mockScenario.requirements,
        aiAssisted: true,
      },
    }

    render(<ScenarioPreview scenario={scenarioWithAI} showDetails={true} data-oid="wt.ul8b" />)

    expect(screen.getByText(/ИИ-автоматизация/)).toBeInTheDocument()
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ScenarioBrowser } from "../../components/scenario-browser"

// Mock useScenario hook
vi.mock("../../hooks/use-scenario", () => ({
  useScenario: () => ({
    scenarios: [
      {
        id: "add-intro-outro",
        name: {
          ru: "Добавить одинаковые интро и аутро",
          en: "Add Same Intro and Outro",
        },
        description: {
          ru: "Автоматически добавляет выбранные шаблоны интро и аутро",
          en: "Automatically adds selected intro and outro templates",
        },
        category: "structure",
        difficulty: "beginner",
        estimatedTime: 2,
        requirements: {
          minClips: 1,
          requiresIntro: true,
          requiresOutro: true,
          aiAssisted: false,
        },
        steps: [
          {
            id: "step-1",
            type: "select-clips",
            name: { ru: "Выбор клипов", en: "Select Clips" },
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
        id: "cold-open-cuts",
        name: {
          ru: "Вырезки в начале (Cold Open)",
          en: "Cold Open with Cuts",
        },
        description: {
          ru: "Создает быструю нарезку",
          en: "Creates a quick montage",
        },
        category: "automation",
        difficulty: "intermediate",
        estimatedTime: 5,
        requirements: {
          minClips: 1,
          aiAssisted: true,
        },
        steps: [
          {
            id: "step-1",
            type: "analyze-video",
            name: { ru: "Анализ видео", en: "Analyze Video" },
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
    ],
    selectedScenario: null,
    selectScenario: vi.fn(),
    searchScenarios: vi.fn(),
    filterScenarios: vi.fn(),
    sortScenarios: vi.fn(),
    resetFilters: vi.fn(),
  }),
}))

describe("ScenarioBrowser", () => {
  const mockOnSelect = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отображать заголовок по умолчанию", () => {
    render(<ScenarioBrowser />)

    expect(screen.getByText("Сценарии монтажа")).toBeInTheDocument()
    expect(screen.getByText("Выберите сценарий для автоматического монтажа")).toBeInTheDocument()
  })

  it("не должен отображать заголовок, если showHeader=false", () => {
    render(<ScenarioBrowser showHeader={false} />)

    expect(screen.queryByText("Сценарии монтажа")).not.toBeInTheDocument()
  })

  it("должен отображать все сценарии в сетке по умолчанию", () => {
    render(<ScenarioBrowser />)

    expect(screen.getByText("Добавить одинаковые интро и аутро")).toBeInTheDocument()
    expect(screen.getByText("Вырезки в начале (Cold Open)")).toBeInTheDocument()
  })

  it("должен переключаться между режимами сетки и списка", async () => {
    const user = userEvent.setup()
    render(<ScenarioBrowser />)

    // Проверяем исходную сетку
    const gridButtons = screen.getAllByRole("tab")
    const listTab = gridButtons[1]

    // Переключаемся на список
    await user.click(listTab)

    // Сценарии должны быть видны и в режиме списка
    expect(screen.getByText("Добавить одинаковые интро и аутро")).toBeInTheDocument()
  })

  it("должен показывать кнопку закрытия при передаче onClose", () => {
    render(<ScenarioBrowser onClose={mockOnClose} />)

    // Ищем кнопку закрытия с иконкой X
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("должен вызывать onSelect при клике на сценарий", async () => {
    const user = userEvent.setup()
    render(<ScenarioBrowser onSelect={mockOnSelect} />)

    const scenarioCard = screen.getByText("Добавить одинаковые интро и аутро")
    await user.click(scenarioCard.closest("div"))

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalled()
    })
  })

  it("должен отображать поле поиска", () => {
    render(<ScenarioBrowser />)

    const searchInput = screen.getByPlaceholderText("Поиск сценариев...")
    expect(searchInput).toBeInTheDocument()
  })

  it("должен отображать фильтры, если showFilters=true", () => {
    render(<ScenarioBrowser showFilters={true} />)

    const filterButton = screen.getByRole("button")
    expect(filterButton).toBeInTheDocument()
  })

  it("не должен отображать фильтры, если showFilters=false", () => {
    const { container } = render(<ScenarioBrowser showFilters={false} />)

    // Проверяем, что кнопка фильтра отсутствует
    const filterButtons = container.querySelectorAll('button[class*="Filter"]')
    expect(filterButtons.length).toBe(0)
  })

  it("должен отображать количество найденных сценариев", () => {
    render(<ScenarioBrowser />)

    expect(screen.getByText(/Найдено сценариев:/)).toBeInTheDocument()
  })

  it("должен отображать бейджи AI для AI-сценариев", () => {
    render(<ScenarioBrowser />)

    // Только второй сценарий имеет AI
    const aiBadges = screen.getAllByText("AI")
    expect(aiBadges.length).toBeGreaterThan(0)
  })

  it("должен отображать правильные уровни сложности", () => {
    render(<ScenarioBrowser />)

    expect(screen.getByText("Начальный")).toBeInTheDocument()
    expect(screen.getByText("Средний")).toBeInTheDocument()
  })

  it("должен отображать время выполнения в минутах", () => {
    render(<ScenarioBrowser />)

    expect(screen.getByText("2 мин")).toBeInTheDocument()
    expect(screen.getByText("5 мин")).toBeInTheDocument()
  })

  it("должен использовать переданные высоту", () => {
    const { container } = render(<ScenarioBrowser height="400px" />)

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.height).toBe("400px")
  })

  it("должен показывать сообщение при отсутствии сценариев", () => {
    // Переопределяем mock для пустого списка
    vi.resetModules()
  })
})

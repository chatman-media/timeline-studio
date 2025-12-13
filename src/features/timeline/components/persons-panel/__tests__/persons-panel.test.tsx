/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для PersonsPanel компонента
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Mock для хука useTimelinePersons
vi.mock("@/features/timeline/hooks/state/use-timeline-persons", () => ({
  useTimelinePersons: vi.fn(),
}))

import type { PersonProfile } from "@/features/person-identification/types/person"
import type { TimelinePersonAppearance } from "@/features/timeline/hooks/state/use-timeline-persons"
import { useTimelinePersons } from "@/features/timeline/hooks/state/use-timeline-persons"

import { PersonsPanel } from "../persons-panel"

// Mock для UI компонентов
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, onClick, className, variant }: any) => (
    <span onClick={onClick} className={className} data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
}))

vi.mock("@/components/ui/input", () => ({
  Input: ({ placeholder, value, onChange, className }: any) => (
    <input placeholder={placeholder} value={value} onChange={onChange} className={className} data-testid="input" />
  ),
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={className} data-testid="scroll-area">
      {children}
    </div>
  ),
}))

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, min, max, step, className }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([Number.parseFloat(e.target.value)])}
      min={min}
      max={max}
      step={step}
      className={className}
      data-testid="slider"
    />
  ),
}))

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} data-testid="switch" />
  ),
}))

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}))

vi.mock("lucide-react", () => ({
  Eye: ({ className }: any) => (
    <span className={className} data-testid="eye-icon">
      Eye
    </span>
  ),
  EyeOff: ({ className }: any) => (
    <span className={className} data-testid="eye-off-icon">
      EyeOff
    </span>
  ),
  Filter: ({ className }: any) => (
    <span className={className} data-testid="filter-icon">
      Filter
    </span>
  ),
  Search: ({ className }: any) => (
    <span className={className} data-testid="search-icon">
      Search
    </span>
  ),
  Settings: ({ className }: any) => (
    <span className={className} data-testid="settings-icon">
      Settings
    </span>
  ),
  Users: ({ className }: any) => (
    <span className={className} data-testid="users-icon">
      Users
    </span>
  ),
}))

// Получаем замоканную версию хука

describe("PersonsPanel", () => {
  const mockPersons: PersonProfile[] = [
    {
      id: "person-1",
      name: "Иван Петров",
      isVerified: true,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 120,
      firstSeen: { seconds: 0 },
      lastSeen: { seconds: 120 },
      tags: ["актер", "главный"],
      thumbnails: [
        {
          id: "thumb-1",
          imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAg",
          width: 64,
          height: 64,
          sourceClipId: "clip-1",
          sourceTimestamp: { seconds: 10 },
          quality: 0.9,
          isPrimary: true,
          isGenerated: false,
        },
      ],
      privacy: {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
        blurIntensity: 5,
        blurTracking: true,
      },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "person-2",
      name: "Анна Сидорова",
      isVerified: false,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 60,
      firstSeen: { seconds: 30 },
      lastSeen: { seconds: 90 },
      tags: ["актриса", "второстепенный"],
      thumbnails: [],
      privacy: {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
        blurIntensity: 5,
        blurTracking: true,
      },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "person-3",
      name: "",
      isVerified: false,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 30,
      firstSeen: { seconds: 60 },
      lastSeen: { seconds: 90 },
      tags: [],
      thumbnails: [],
      privacy: {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
        blurIntensity: 5,
        blurTracking: true,
      },
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ]

  const mockAppearances: TimelinePersonAppearance[] = [
    {
      id: "app-1",
      personId: "person-1",
      clipId: "clip-1",
      startTime: 10,
      endTime: 20,
      confidence: 0.95,
      detectedAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "app-2",
      personId: "person-2",
      clipId: "clip-1",
      startTime: 15,
      endTime: 25,
      confidence: 0.75,
      detectedAt: new Date("2024-01-01T00:00:00Z"),
    },
    {
      id: "app-3",
      personId: "person-1",
      clipId: "clip-2",
      startTime: 5,
      endTime: 15,
      confidence: 0.85,
      detectedAt: new Date("2024-01-01T00:00:00Z"),
    },
  ]

  const mockHookReturn = {
    persons: mockPersons,
    state: {
      isAnalyzing: false,
      analysisProgress: 0,
      appearances: mockAppearances,
      error: null as string | null,
    },
    getPersonsForClip: vi.fn(() => []),
    getAppearancesForClip: vi.fn(() => []),
    analyzeClipForPersons: vi.fn(),
    analyzeTimelineForPersons: vi.fn(),
    clearPersonsAnalysis: vi.fn(),
    showPersonDetail: vi.fn(),
    enablePersonDetection: true,
    setEnablePersonDetection: vi.fn(),
    confidenceThreshold: 0.7,
    setConfidenceThreshold: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTimelinePersons).mockReturnValue(mockHookReturn)
  })

  describe("Базовое отображение", () => {
    it("отображает компонент", () => {
      render(<PersonsPanel />)

      expect(screen.getByTestId("card")).toBeInTheDocument()
      expect(screen.getByTestId("card-header")).toBeInTheDocument()
      expect(screen.getByTestId("card-content")).toBeInTheDocument()
    })

    it("отображает заголовок с количеством персон", () => {
      render(<PersonsPanel />)

      expect(screen.getByTestId("card-title")).toHaveTextContent("Персоны (3)")
      // Один в заголовке + 2 для персон без аватара
      expect(screen.getAllByTestId("users-icon")).toHaveLength(3)
    })

    it("отображает кнопки управления", () => {
      render(<PersonsPanel />)

      const buttons = screen.getAllByTestId("button")
      expect(buttons).toHaveLength(3) // Settings, Analyze, Clear

      expect(screen.getByTestId("settings-icon")).toBeInTheDocument()
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument()
      expect(screen.getByTestId("eye-off-icon")).toBeInTheDocument()
    })

    it("отображает поле поиска", () => {
      render(<PersonsPanel />)

      const searchInput = screen.getByTestId("input")
      expect(searchInput).toHaveAttribute("placeholder", "Поиск персон...")
      expect(screen.getByTestId("search-icon")).toBeInTheDocument()
    })

    it("отображает список персон", () => {
      render(<PersonsPanel />)

      expect(screen.getByText("Иван Петров")).toBeInTheDocument()
      expect(screen.getByText("Анна Сидорова")).toBeInTheDocument()
      expect(screen.getByText("Безымянная персона")).toBeInTheDocument()
    })

    it("отображает статистику появлений", () => {
      render(<PersonsPanel />)

      expect(screen.getByText("Появлений: 3")).toBeInTheDocument()
      expect(screen.getByText("Средняя уверенность: 85%")).toBeInTheDocument()
    })
  })

  describe("Действия кнопок", () => {
    it("вызывает анализ Timeline при клике на кнопку анализа", () => {
      render(<PersonsPanel />)

      const analyzeButton = screen.getAllByTestId("button")[1]
      fireEvent.click(analyzeButton)

      expect(mockHookReturn.analyzeTimelineForPersons).toHaveBeenCalled()
    })

    it("очищает анализ при клике на кнопку очистки", () => {
      render(<PersonsPanel />)

      const clearButton = screen.getAllByTestId("button")[2]
      fireEvent.click(clearButton)

      expect(mockHookReturn.clearPersonsAnalysis).toHaveBeenCalled()
    })

    it("показывает детали персоны при клике на персону", () => {
      render(<PersonsPanel />)

      const personElement = screen.getByText("Иван Петров").closest("div")
      fireEvent.click(personElement!)

      expect(mockHookReturn.showPersonDetail).toHaveBeenCalledWith("person-1")
    })
  })

  describe("Настройки", () => {
    it("показывает настройки при клике на кнопку настроек", () => {
      render(<PersonsPanel />)

      const settingsButton = screen.getAllByTestId("button")[0]
      fireEvent.click(settingsButton)

      expect(screen.getByTestId("switch")).toBeInTheDocument()
      expect(screen.getByTestId("slider")).toBeInTheDocument()
      expect(screen.getByText("Автообнаружение")).toBeInTheDocument()
      expect(screen.getByText("Уверенность")).toBeInTheDocument()
    })

    it("переключает автообнаружение", () => {
      render(<PersonsPanel />)

      const settingsButton = screen.getAllByTestId("button")[0]
      fireEvent.click(settingsButton)

      const switchElement = screen.getByTestId("switch")
      expect(switchElement).toBeChecked() // Проверяем, что переключатель включен по умолчанию

      // Просто проверяем, что переключатель реагирует на изменения
      fireEvent.change(switchElement, { target: { checked: false } })
      expect(switchElement).not.toBeChecked()
    })

    it("изменяет порог уверенности", () => {
      render(<PersonsPanel />)

      const settingsButton = screen.getAllByTestId("button")[0]
      fireEvent.click(settingsButton)

      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "0.8" } })

      expect(mockHookReturn.setConfidenceThreshold).toHaveBeenCalledWith(0.8)
    })
  })

  describe("Поиск персон", () => {
    it("фильтрует персон по имени", () => {
      render(<PersonsPanel />)

      const searchInput = screen.getByTestId("input")
      fireEvent.change(searchInput, { target: { value: "Иван" } })

      expect(screen.getByText("Иван Петров")).toBeInTheDocument()
      expect(screen.queryByText("Анна Сидорова")).not.toBeInTheDocument()
    })

    it("показывает сообщение когда персоны не найдены", () => {
      render(<PersonsPanel />)

      const searchInput = screen.getByTestId("input")
      fireEvent.change(searchInput, {
        target: { value: "Несуществующая персона" },
      })

      expect(screen.getByText("Персоны не найдены по заданным критериям.")).toBeInTheDocument()
    })
  })

  describe("Фильтр по тегам", () => {
    it("отображает доступные теги", () => {
      render(<PersonsPanel />)

      expect(screen.getAllByText("актер")).toHaveLength(2) // В фильтре и в персоне
      expect(screen.getAllByText("главный")).toHaveLength(2) // В фильтре и в персоне
      expect(screen.getAllByText("актриса")).toHaveLength(2) // В фильтре и в персоне
      expect(screen.getAllByText("второстепенный")).toHaveLength(2) // В фильтре и в персоне
    })

    it("фильтрует персон по выбранным тегам", () => {
      render(<PersonsPanel />)

      const actorTags = screen.getAllByText("актер")
      const filterTag = actorTags[0] // Первый тег - в фильтре
      fireEvent.click(filterTag)

      expect(screen.getByText("Иван Петров")).toBeInTheDocument()
      expect(screen.queryByText("Анна Сидорова")).not.toBeInTheDocument()
    })
  })

  describe("Отображение персон", () => {
    it("отображает аватар персоны если есть thumbnail", () => {
      render(<PersonsPanel />)

      const avatar = screen.getByAltText("Иван Петров")
      expect(avatar).toHaveAttribute("src", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAg")
    })

    it("отображает статистику появлений для каждой персоны", () => {
      render(<PersonsPanel />)

      expect(screen.getByText("2 появлений")).toBeInTheDocument() // person-1
      expect(screen.getByText("1 появлений")).toBeInTheDocument() // person-2
      expect(screen.getByText("0 появлений")).toBeInTheDocument() // person-3
    })

    it("отображает теги персон", () => {
      render(<PersonsPanel />)

      const tagBadges = screen.getAllByTestId("badge")
      // Теги отображаются как в фильтре по тегам, так и в каждой персоне
      expect(tagBadges.length).toBeGreaterThan(0)

      // Проверим, что есть нужные теги
      expect(screen.getAllByText("актер")).toHaveLength(2)
      expect(screen.getAllByText("главный")).toHaveLength(2)
      expect(screen.getAllByText("актриса")).toHaveLength(2)
      expect(screen.getAllByText("второстепенный")).toHaveLength(2)
    })
  })

  describe("Состояния", () => {
    it("отображает прогресс анализа", () => {
      mockHookReturn.state.isAnalyzing = true
      mockHookReturn.state.analysisProgress = 45
      vi.mocked(useTimelinePersons).mockReturnValue(mockHookReturn)

      render(<PersonsPanel />)

      expect(screen.getByText("Анализ...")).toBeInTheDocument()
      expect(screen.getByText("45%")).toBeInTheDocument()
    })

    it("отображает ошибку если есть", () => {
      mockHookReturn.state.error = "Ошибка анализа"
      vi.mocked(useTimelinePersons).mockReturnValue(mockHookReturn)

      render(<PersonsPanel />)

      expect(screen.getByText("Ошибка анализа")).toBeInTheDocument()
    })

    it("показывает сообщение когда нет персон", () => {
      mockHookReturn.persons = []
      mockHookReturn.state.appearances = []
      vi.mocked(useTimelinePersons).mockReturnValue(mockHookReturn)

      render(<PersonsPanel />)

      expect(screen.getByText("Персоны не обнаружены. Запустите анализ Timeline.")).toBeInTheDocument()
    })
  })

  describe("Пропсы компонента", () => {
    it("применяет переданный className", () => {
      render(<PersonsPanel className="custom-class" />)

      expect(screen.getByTestId("card")).toHaveClass("custom-class")
    })
  })
})

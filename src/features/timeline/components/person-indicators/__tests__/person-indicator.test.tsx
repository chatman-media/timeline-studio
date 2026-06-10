/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для PersonIndicator компонента
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { vi } from "vitest"

import type { PersonProfile } from "@/features/person-identification/types/person"
import type { TimelinePersonAppearance } from "@/features/timeline/hooks/state/use-timeline-persons"

import { PersonIndicator } from "../person-indicator"

// Mock для tooltip компонентов
vi.mock("@timeline-studio/ui/components/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-oid="1cfjeb9">{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-oid="kdn9cxx">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content" data-oid="2yp7_-3">
      {children}
    </div>
  ),
}))

// Mock для badge компонента
vi.mock("@timeline-studio/ui/components/badge", () => ({
  Badge: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <span onClick={onClick} className={className} data-testid="badge" data-oid="g-atg84">
      {children}
    </span>
  ),
}))

// Mock для Lucide иконок
vi.mock("lucide-react", () => ({
  User: ({ className }: { className?: string }) => (
    <span className={className} data-testid="user-icon" data-oid="-6fx.vo">
      User
    </span>
  ),

  Users: ({ className }: { className?: string }) => (
    <span className={className} data-testid="users-icon" data-oid="bzck29j">
      Users
    </span>
  ),
}))

describe("PersonIndicator", () => {
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
      tags: ["актриса"],
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
      personId: "person-3",
      clipId: "clip-2",
      startTime: 5,
      endTime: 15,
      confidence: 0.6,
      detectedAt: new Date("2024-01-01T00:00:00Z"),
    },
  ]

  const defaultProps = {
    persons: mockPersons,
    appearances: mockAppearances,
    clipId: "clip-1",
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Базовое отображение", () => {
    it("отображает персон, связанных с клипом", () => {
      render(<PersonIndicator {...defaultProps} data-oid="g4a9m0z" />)

      // Должно отобразить аватары для двух персон (person-1 и person-2)
      expect(screen.getByAltText("Иван Петров")).toBeInTheDocument()
      expect(screen.getByTestId("user-icon")).toBeInTheDocument() // Для person-2 без thumbnails
    })

    it("не отображает ничего, если нет персон в клипе", () => {
      render(<PersonIndicator {...defaultProps} clipId="clip-empty" data-oid="e7ndjgr" />)

      expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument()
      expect(screen.queryByTestId("badge")).not.toBeInTheDocument()
    })

    it("отображает правильные имена в tooltip", () => {
      render(<PersonIndicator {...defaultProps} data-oid="emptawn" />)

      expect(screen.getByText("Иван Петров")).toBeInTheDocument()
      expect(screen.getByText("Анна Сидорова")).toBeInTheDocument()
    })

    it('отображает "Безымянная персона" для персон без имени', () => {
      render(<PersonIndicator {...defaultProps} clipId="clip-2" data-oid="vgg71uo" />)

      expect(screen.getByText("Безымянная персона")).toBeInTheDocument()
    })
  })

  describe("Компактный режим", () => {
    it("отображает одну иконку для одной персоны", () => {
      render(<PersonIndicator {...defaultProps} clipId="clip-2" compact data-oid="k145:93" />)

      expect(screen.getByTestId("user-icon")).toBeInTheDocument()
      expect(screen.getByText("Безымянная персона")).toBeInTheDocument()
    })

    it("отображает иконку группы и счетчик для нескольких персон", () => {
      render(<PersonIndicator {...defaultProps} compact data-oid="b.07y:k" />)

      expect(screen.getByTestId("users-icon")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument() // Количество персон
    })

    it("показывает все персоны в tooltip в компактном режиме", () => {
      render(<PersonIndicator {...defaultProps} compact data-oid="8oszuxw" />)

      expect(screen.getByText("Иван Петров")).toBeInTheDocument()
      expect(screen.getByText("Анна Сидорова")).toBeInTheDocument()
    })
  })

  describe("Ограничение видимых персон", () => {
    it("ограничивает количество видимых персон", () => {
      render(<PersonIndicator {...defaultProps} maxVisible={1} data-oid="m-09dh0" />)

      // Должен отобразить только одну персону
      expect(screen.getByAltText("Иван Петров")).toBeInTheDocument()
      expect(screen.queryByTestId("user-icon")).not.toBeInTheDocument()
    })

    it("показывает счетчик скрытых персон", () => {
      render(<PersonIndicator {...defaultProps} maxVisible={1} data-oid="nd3mkw_" />)

      expect(screen.getByText("+1")).toBeInTheDocument()
    })

    it("показывает скрытые персоны в tooltip", () => {
      render(<PersonIndicator {...defaultProps} maxVisible={1} data-oid="_w013-_" />)

      expect(screen.getByText("Анна Сидорова")).toBeInTheDocument()
    })
  })

  describe("Индикаторы уверенности", () => {
    it("отображает зеленый индикатор для высокой уверенности", () => {
      render(<PersonIndicator {...defaultProps} data-oid="mn33205" />)

      // Проверяем, что есть зеленый индикатор (confidence 0.95 = 95% >= 80%)
      const greenIndicator = document.querySelector(".bg-green-500")
      expect(greenIndicator).toBeInTheDocument()
    })

    it("отображает желтый индикатор для средней уверенности", () => {
      render(<PersonIndicator {...defaultProps} data-oid="v9t.zkf" />)

      // Проверяем, что есть желтый индикатор (confidence 0.75 = 75% >= 60% но < 80%)
      const yellowIndicator = document.querySelector(".bg-yellow-500")
      expect(yellowIndicator).toBeInTheDocument()
    })

    it("показывает процент уверенности в tooltip", () => {
      render(<PersonIndicator {...defaultProps} data-oid="_7940q_" />)

      expect(screen.getByText("Уверенность: 95%")).toBeInTheDocument()
      expect(screen.getByText("Уверенность: 75%")).toBeInTheDocument()
    })

    it("показывает временные метки в tooltip", () => {
      render(<PersonIndicator {...defaultProps} data-oid="8ngvsjc" />)

      expect(screen.getByText("10с - 20с")).toBeInTheDocument()
      expect(screen.getByText("15с - 25с")).toBeInTheDocument()
    })
  })

  describe("Обработка кликов", () => {
    it("вызывает onClick при клике на персону", () => {
      const onClickMock = vi.fn()
      render(<PersonIndicator {...defaultProps} onClick={onClickMock} data-oid=":d3x9xa" />)

      // Клик на первую персону (аватар)
      fireEvent.click(screen.getByAltText("Иван Петров").closest("div")!)
      expect(onClickMock).toHaveBeenCalledWith("person-1")
    })

    it("вызывает onClick при клике на badge в компактном режиме с одной персоной", () => {
      const onClickMock = vi.fn()
      render(<PersonIndicator {...defaultProps} clipId="clip-2" compact onClick={onClickMock} data-oid="j02nygc" />)

      fireEvent.click(screen.getByTestId("badge"))
      expect(onClickMock).toHaveBeenCalledWith("person-3")
    })

    it("не вызывает onClick при клике на badge в компактном режиме с несколькими персонами", () => {
      const onClickMock = vi.fn()
      render(<PersonIndicator {...defaultProps} compact onClick={onClickMock} data-oid="c2o5_gy" />)

      fireEvent.click(screen.getByTestId("badge"))
      expect(onClickMock).not.toHaveBeenCalled()
    })

    it("предотвращает всплытие событий", () => {
      const onClickMock = vi.fn()
      const containerClickMock = vi.fn()

      render(
        <div onClick={containerClickMock} data-oid="z0yuj0q">
          <PersonIndicator {...defaultProps} onClick={onClickMock} data-oid="0i-ir_z" />
        </div>,
      )

      fireEvent.click(screen.getByAltText("Иван Петров").closest("div")!)
      expect(onClickMock).toHaveBeenCalledWith("person-1")
      expect(containerClickMock).not.toHaveBeenCalled()
    })
  })

  describe("Обработка изображений", () => {
    it("отображает изображение персоны, если есть thumbnail", () => {
      render(<PersonIndicator {...defaultProps} data-oid="gz4vm0j" />)

      const image = screen.getByAltText("Иван Петров")
      expect(image).toHaveAttribute("src", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAg")
    })

    it("отображает иконку пользователя, если нет thumbnail", () => {
      render(<PersonIndicator {...defaultProps} data-oid=".x2uk.:" />)

      expect(screen.getByTestId("user-icon")).toBeInTheDocument()
    })
  })

  describe("Z-index для наложения", () => {
    it("устанавливает правильный z-index для наложения аватаров", () => {
      render(<PersonIndicator {...defaultProps} data-oid="-x8f:ot" />)

      // Получаем родительские div для аватаров
      const firstPersonDiv = screen.getByAltText("Иван Петров").closest("div")?.parentElement
      const secondPersonDiv = screen.getByTestId("user-icon").closest("div")?.parentElement

      // Проверяем, что z-index установлен правильно (первый элемент имеет больший z-index)
      expect(firstPersonDiv).toHaveStyle({ zIndex: "2" })
      expect(secondPersonDiv).toHaveStyle({ zIndex: "1" })
    })
  })

  describe("Краевые случаи", () => {
    it("обрабатывает пустой массив персон", () => {
      render(<PersonIndicator {...defaultProps} persons={[]} data-oid="w9qlzbw" />)

      expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument()
    })

    it("обрабатывает пустой массив appearances", () => {
      render(<PersonIndicator {...defaultProps} appearances={[]} data-oid="ovlinmm" />)

      expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument()
    })

    it("обрабатывает отсутствие onClick обработчика", () => {
      render(<PersonIndicator {...defaultProps} onClick={undefined} data-oid="olddsto" />)

      expect(() => {
        fireEvent.click(screen.getByAltText("Иван Петров").closest("div")!)
      }).not.toThrow()
    })

    it("обрабатывает нулевую confidence", () => {
      const appearancesWithZeroConfidence = [
        {
          ...mockAppearances[0],
          confidence: 0,
        },
      ]

      render(<PersonIndicator {...defaultProps} appearances={appearancesWithZeroConfidence} data-oid="lt8vy7k" />)

      // При нулевой confidence индикатор не должен отображаться
      expect(document.querySelector(".bg-green-500")).not.toBeInTheDocument()
      expect(document.querySelector(".bg-yellow-500")).not.toBeInTheDocument()
      expect(document.querySelector(".bg-red-500")).not.toBeInTheDocument()
    })
  })
})

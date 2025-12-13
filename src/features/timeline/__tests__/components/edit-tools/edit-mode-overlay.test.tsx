import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline, screen } from "@/test/test-utils"

import { EditCursorOverlay, EditModeOverlay } from "../../../components/edit-tools/edit-mode-overlay"
import { EDIT_MODES } from "../../../types/edit-modes"

// Мокаем useEditModeContext
const mockEditModeContext = {
  editMode: EDIT_MODES.SELECT as any,
  setEditMode: vi.fn(),
  isEditMode: vi.fn(),
  cursor: "default",
}

vi.mock("../../../hooks/editing/use-edit-mode", () => ({
  useEditModeContext: () => mockEditModeContext,
}))

// Мокаем cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

describe("EditModeOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем состояние мока к дефолтному
    mockEditModeContext.editMode = EDIT_MODES.SELECT
  })

  describe("Базовый рендеринг", () => {
    it("должен не отображаться в SELECT режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SELECT

      const { container } = renderWithTimeline(<EditModeOverlay />)

      // В SELECT режиме компонент не должен рендерить никакой контент
      expect(container.querySelector('[class*="fixed"]')).not.toBeInTheDocument()
    })

    it("должен отображаться в TRIM режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Trim Mode")).toBeInTheDocument()
      expect(screen.getByText("Trim clip edges")).toBeInTheDocument()
      expect(screen.getByText("T")).toBeInTheDocument() // hotkey
      expect(screen.getByText("ESC")).toBeInTheDocument()
    })

    it("должен отображаться в RIPPLE режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.RIPPLE

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Ripple Mode")).toBeInTheDocument()
      expect(screen.getByText("Ripple edit - trim and move subsequent clips")).toBeInTheDocument()
      expect(screen.getByText("Q")).toBeInTheDocument() // hotkey
    })

    it("должен отображаться в ROLL режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.ROLL

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Roll Mode")).toBeInTheDocument()
      expect(screen.getByText("Roll edit - adjust edit point between clips")).toBeInTheDocument()
      expect(screen.getByText("W")).toBeInTheDocument() // hotkey
    })

    it("должен отображаться в SLIP режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Slip Mode")).toBeInTheDocument()
      expect(screen.getByText("Slip edit - change clip content without moving")).toBeInTheDocument()
      expect(screen.getByText("Y")).toBeInTheDocument() // hotkey
    })

    it("должен отображаться в SLIDE режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIDE

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Slide Mode")).toBeInTheDocument()
      expect(screen.getByText("Slide edit - move clip and adjust neighbors")).toBeInTheDocument()
      expect(screen.getByText("U")).toBeInTheDocument() // hotkey
    })

    it("должен отображаться в SPLIT режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SPLIT

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Split Mode")).toBeInTheDocument()
      expect(screen.getByText("Split clips at cursor position")).toBeInTheDocument()
      expect(screen.getByText("S")).toBeInTheDocument() // hotkey
    })

    it("должен отображаться в RATE режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.RATE

      renderWithTimeline(<EditModeOverlay />)

      expect(screen.getByText("Rate Mode")).toBeInTheDocument()
      expect(screen.getByText("Change clip playback speed")).toBeInTheDocument()
      expect(screen.getByText("R")).toBeInTheDocument() // hotkey
    })
  })

  describe("Стили и классы", () => {
    it("должен применять базовые стили", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditModeOverlay />)

      // Находим overlay по классам
      const overlay = container.querySelector('[class*="fixed"][class*="top-20"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass("fixed")
      expect(overlay).toHaveClass("top-20")
      expect(overlay).toHaveClass("left-1/2")
      expect(overlay).toHaveClass("-translate-x-1/2")
      expect(overlay).toHaveClass("z-50")
      expect(overlay).toHaveClass("px-4")
      expect(overlay).toHaveClass("py-2")
      expect(overlay).toHaveClass("rounded-lg")
    })

    it("должен применять кастомный className", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditModeOverlay className="custom-class" />)

      const overlay = container.querySelector('[class*="fixed"][class*="top-20"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass("custom-class")
    })

    it("должен иметь pointer-events-none", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditModeOverlay />)

      const overlay = container.querySelector('[class*="fixed"][class*="top-20"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass("pointer-events-none")
      expect(overlay).toHaveClass("select-none")
    })

    it("должен содержать правильную структуру элементов", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditModeOverlay />)

      // Проверяем наличие всех основных элементов
      expect(container.querySelector(".flex.items-center.gap-3")).toBeInTheDocument()
      expect(container.querySelector(".w-10.h-10.rounded-md")).toBeInTheDocument()
      expect(container.querySelector(".font-semibold")).toBeInTheDocument()
      expect(container.querySelector("kbd")).toBeInTheDocument()
    })
  })

  describe("Hotkey отображение", () => {
    it("должен отображать правильный hotkey для каждого режима", () => {
      const modes = [
        { mode: EDIT_MODES.TRIM, hotkey: "T" },
        { mode: EDIT_MODES.RIPPLE, hotkey: "Q" },
        { mode: EDIT_MODES.ROLL, hotkey: "W" },
        { mode: EDIT_MODES.SLIP, hotkey: "Y" },
        { mode: EDIT_MODES.SLIDE, hotkey: "U" },
        { mode: EDIT_MODES.SPLIT, hotkey: "S" },
        { mode: EDIT_MODES.RATE, hotkey: "R" },
      ]

      modes.forEach(({ mode, hotkey }) => {
        mockEditModeContext.editMode = mode
        renderWithTimeline(<EditModeOverlay />)
        expect(screen.getByText(hotkey)).toBeInTheDocument()
        // Очищаем экран между итерациями
        screen.debug = vi.fn()
      })
    })
  })
})

describe("EditCursorOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEditModeContext.editMode = EDIT_MODES.TRIM
  })

  describe("Видимость курсора", () => {
    it("должен не отображаться когда isActive = false", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={false} />)

      expect(container.querySelector('[class*="fixed"][class*="pointer-events-none"]')).not.toBeInTheDocument()
    })

    it("должен не отображаться когда mousePosition = null", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={null} isActive={true} />)

      expect(container.querySelector('[class*="fixed"][class*="pointer-events-none"]')).not.toBeInTheDocument()
    })

    it("должен не отображаться в SELECT режиме", () => {
      mockEditModeContext.editMode = EDIT_MODES.SELECT

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      expect(container.querySelector('[class*="fixed"][class*="pointer-events-none"]')).not.toBeInTheDocument()
    })

    it("должен отображаться когда isActive = true и есть mousePosition", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe("Позиционирование курсора", () => {
    it("должен позиционироваться в правильной позиции мыши", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 150, y: 200 }} isActive={true} />)

      const overlay = container.querySelector('[class*="fixed"][class*="pointer-events-none"]')!
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveStyle({
        left: "150px",
        top: "200px",
        transform: "translate(-50%, -50%)",
      })
    })

    it("должен иметь правильные классы позиционирования", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const overlay = container.querySelector('[class*="fixed"][class*="pointer-events-none"]')!
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass("fixed")
      expect(overlay).toHaveClass("pointer-events-none")
      expect(overlay).toHaveClass("z-[100]")
    })
  })

  describe("Курсоры для разных режимов", () => {
    it("должен показывать TrimCursor для TRIM режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      // Проверяем наличие SVG элемента
      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-primary")
    })

    it("должен показывать RippleCursor для RIPPLE режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.RIPPLE

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-orange-500")
    })

    it("должен показывать RollCursor для ROLL режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.ROLL

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-purple-500")
    })

    it("должен показывать SlipCursor для SLIP режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIP

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-blue-500")
    })

    it("должен показывать SlideCursor для SLIDE режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.SLIDE

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-green-500")
    })

    it("должен показывать SplitCursor для SPLIT режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.SPLIT

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-red-500")
    })

    it("должен показывать RateCursor для RATE режима", () => {
      mockEditModeContext.editMode = EDIT_MODES.RATE

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-yellow-500")

      // Проверяем наличие текста "2x" в RateCursor
      const text = container.querySelector("text")
      expect(text).toBeInTheDocument()
      expect(text).toHaveTextContent("2x")
    })
  })

  describe("Edge cases", () => {
    it("должен корректно обрабатывать нулевые координаты", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 0, y: 0 }} isActive={true} />)

      const overlay = container.querySelector('[class*="fixed"][class*="pointer-events-none"]')!
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveStyle({
        left: "0px",
        top: "0px",
      })
    })

    it("должен корректно обрабатывать большие координаты", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 9999, y: 9999 }} isActive={true} />)

      const overlay = container.querySelector('[class*="fixed"][class*="pointer-events-none"]')!
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveStyle({
        left: "9999px",
        top: "9999px",
      })
    })

    it("должен корректно обрабатывать отрицательные координаты", () => {
      mockEditModeContext.editMode = EDIT_MODES.TRIM

      const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: -100, y: -50 }} isActive={true} />)

      const overlay = container.querySelector('[class*="fixed"][class*="pointer-events-none"]')!
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveStyle({
        left: "-100px",
        top: "-50px",
      })
    })
  })

  describe("SVG элементы курсоров", () => {
    it("все курсоры должны иметь правильные размеры SVG", () => {
      const modes = [
        EDIT_MODES.TRIM,
        EDIT_MODES.RIPPLE,
        EDIT_MODES.ROLL,
        EDIT_MODES.SLIP,
        EDIT_MODES.SLIDE,
        EDIT_MODES.SPLIT,
        EDIT_MODES.RATE,
      ]

      modes.forEach((mode) => {
        mockEditModeContext.editMode = mode
        const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

        const svg = container.querySelector("svg")
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute("width", "32")
        expect(svg).toHaveAttribute("height", "32")
        expect(svg).toHaveAttribute("viewBox", "0 0 32 32")
      })
    })

    it("все курсоры должны содержать графические элементы", () => {
      const modes = [
        EDIT_MODES.TRIM,
        EDIT_MODES.RIPPLE,
        EDIT_MODES.ROLL,
        EDIT_MODES.SLIP,
        EDIT_MODES.SLIDE,
        EDIT_MODES.SPLIT,
        EDIT_MODES.RATE,
      ]

      modes.forEach((mode) => {
        mockEditModeContext.editMode = mode
        const { container } = renderWithTimeline(<EditCursorOverlay mousePosition={{ x: 100, y: 100 }} isActive={true} />)

        const svg = container.querySelector("svg")
        expect(svg).toBeInTheDocument()

        // Каждый курсор должен содержать хотя бы один графический элемент
        const graphicsElements = svg!.querySelectorAll("path, circle, rect, text")
        expect(graphicsElements.length).toBeGreaterThan(0)
      })
    })
  })
})

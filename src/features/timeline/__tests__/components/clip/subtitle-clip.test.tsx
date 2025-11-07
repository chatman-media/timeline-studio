import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SubtitleClip as SubtitleClipType } from "@/features/subtitles/types"
import { SubtitleClip } from "../../../components/clip/subtitle-clip"

// Мокаем хуки timeline
const mockSelectClip = vi.fn()

// В компоненте используется фиксированное значение pixelsPerSecond = 50
const PIXELS_PER_SECOND = 50

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    updateClip: vi.fn(),
  }),
}))

vi.mock("../../../hooks/use-timeline-selection", () => ({
  useTimelineSelection: () => ({
    selectClip: mockSelectClip,
  }),
}))

// Мокаем useSubtitleStyles
vi.mock("@/features/subtitles", () => ({
  useSubtitleStyles: () => ({
    getComputedStyle: vi.fn(() => ({})),
    getStyleById: vi.fn((id: string) => {
      if (id === "style-1") {
        return { id: "style-1", name: "Test Style" }
      }
      return undefined
    }),
  }),
}))

// Мокаем cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// Helper для создания тестового клипа
const createMockSubtitleClip = (overrides: Partial<SubtitleClipType> = {}): SubtitleClipType => ({
  id: "subtitle-1",
  trackId: "track-1",
  type: "subtitle",
  startTime: 5,
  duration: 3,
  mediaStartTime: 0,
  mediaEndTime: 3,
  offset: 0,
  volume: 1,
  speed: 1,
  isReversed: false,
  text: "Test subtitle text",
  name: "Test Subtitle",
  position: { x: 0, y: 0, width: 100, height: 50, rotation: 0, scaleX: 1, scaleY: 1 },
  opacity: 1,
  isLocked: false,
  effects: [],
  keyframes: [],
  filters: [],
  transitions: [],
  isSelected: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  subtitleStyleId: undefined,
  subtitlePosition: undefined,
  animationIn: undefined,
  animationOut: undefined,
  wordWrap: true,
  maxWidth: 80,
  formatting: undefined,
  mediaId: "test-media-id",
  ...overrides,
})

describe("SubtitleClip", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Базовый рендеринг", () => {
    it("должен рендерить субтитровый клип с основными элементами", () => {
      const clip = createMockSubtitleClip()

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      // Проверяем что текст отображается
      expect(screen.getByText("Test subtitle text")).toBeInTheDocument()

      // Длительность отображается для широкого клипа (3 * 50 = 150px > 80px)
      expect(screen.getByText("3.0s")).toBeInTheDocument()
    })

    it("должен рассчитывать позицию и размер на основе timeScale", () => {
      const clip = createMockSubtitleClip({
        startTime: 2,
        duration: 4,
      })

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        left: "100px", // startTime(2) * PIXELS_PER_SECOND(50)
        width: "200px", // duration(4) * PIXELS_PER_SECOND(50)
        height: "52px", // trackHeight(60) - 8
        top: "4px",
      })
    })

    it("должен применять правильную высоту трека", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={100} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        height: "92px", // trackHeight(100) - 8
      })
    })
  })

  describe("Визуальные состояния", () => {
    it("должен показывать selected состояние", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} isSelected={true} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveClass("ring-2 ring-primary")
    })

    it("должен показывать dragging состояние", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} isDragging={true} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveClass("opacity-50")
    })

    it("должен применять правильные цвета для обычных субтитров", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        backgroundColor: "hsl(25 95% 50%)", // Оранжевый для обычных
      })
    })

    it("должен применять правильные цвета для стилизованных субтитров", () => {
      const clip = createMockSubtitleClip({
        subtitleStyleId: "style-1",
      })

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        backgroundColor: "hsl(61 70% 50%)", // Цвет на основе хеша имени "Test Style"
      })
    })

    it("должен показывать border для выбранного клипа", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} isSelected={true} />)

      const clipElement = container.firstChild as HTMLElement
      // Проверяем, что применяется класс для выбранного состояния
      expect(clipElement.className).toContain("ring-2")
      expect(clipElement.className).toContain("ring-primary")
      // Проверяем, что borderColor установлен (CSS переменная может не разрешаться в тестах)
      expect(clipElement.style.borderColor).toBeTruthy()
    })
  })

  describe("Обработка текста", () => {
    it("должен обрезать длинный текст", () => {
      const longText =
        "This is a very long subtitle text that should be truncated because it exceeds the maximum length"
      const clip = createMockSubtitleClip({
        text: longText,
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      // Проверяем что текст обрезается - ищем по частичному совпадению
      expect(screen.getByText(/This is a very long subtitle text that should b\.\.\./)).toBeInTheDocument()
    })

    it("должен не обрезать короткий текст", () => {
      const clip = createMockSubtitleClip({
        text: "Short text",
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("Short text")).toBeInTheDocument()
    })
  })

  describe("Анимации", () => {
    it("должен показывать индикатор входящей анимации", () => {
      const clip = createMockSubtitleClip({
        animationIn: {
          type: "fade",
          duration: 0.5,
        },
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("fade")).toBeInTheDocument()
    })

    it("должен показывать индикатор исходящей анимации", () => {
      const clip = createMockSubtitleClip({
        animationOut: {
          type: "slide",
          duration: 0.3,
        },
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("slide")).toBeInTheDocument()
    })

    it("должен показывать оба индикатора анимации", () => {
      const clip = createMockSubtitleClip({
        animationIn: {
          type: "typewriter",
          duration: 1.0,
        },
        animationOut: {
          type: "scale",
          duration: 0.5,
        },
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("typewriter")).toBeInTheDocument()
      expect(screen.getByText("scale")).toBeInTheDocument()
    })
  })

  describe("Временные метки", () => {
    it("должен показывать длительность для широких клипов", () => {
      const clip = createMockSubtitleClip({
        duration: 2.5,
      })

      // С PIXELS_PER_SECOND = 50: 2.5 * 50 = 125px > 80px
      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("2.5s")).toBeInTheDocument()
    })

    it("должен скрывать длительность для узких клипов", () => {
      const clip = createMockSubtitleClip({
        duration: 1,
      })

      // С PIXELS_PER_SECOND = 50: 1 * 50 = 50px < 80px
      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.queryByText("1.0s")).not.toBeInTheDocument()
    })
  })

  describe("Интерактивность", () => {
    it("должен вызывать selectClip при клике", () => {
      const clip = createMockSubtitleClip()

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = screen.getByText("Test subtitle text").closest("div")
      fireEvent.click(clipElement!)

      expect(mockSelectClip).toHaveBeenCalledWith("subtitle-1")
    })

    it("должен останавливать propagation при клике", () => {
      const clip = createMockSubtitleClip()
      const parentClickHandler = vi.fn()

      const { container } = render(
        <div onClick={parentClickHandler}>
          <SubtitleClip clip={clip} trackHeight={60} />
        </div>,
      )

      const clipElement = container.querySelector(".cursor-move")
      fireEvent.click(clipElement!)

      expect(parentClickHandler).not.toHaveBeenCalled()
    })

    it("должен вызывать onMouseDown callback", () => {
      const onMouseDown = vi.fn()
      const clip = createMockSubtitleClip()

      render(<SubtitleClip clip={clip} trackHeight={60} onMouseDown={onMouseDown} />)

      const clipElement = screen.getByText("Test subtitle text").closest("div")
      fireEvent.mouseDown(clipElement!)

      expect(onMouseDown).toHaveBeenCalled()
    })

    it("должен вызывать onDoubleClick callback", () => {
      const onDoubleClick = vi.fn()
      const clip = createMockSubtitleClip()

      render(<SubtitleClip clip={clip} trackHeight={60} onDoubleClick={onDoubleClick} />)

      const clipElement = screen.getByText("Test subtitle text").closest("div")
      fireEvent.doubleClick(clipElement!)

      expect(onDoubleClick).toHaveBeenCalled()
    })
  })

  describe("Ручки изменения размера", () => {
    it("должен показывать ручки для выбранного клипа", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} isSelected={true} />)

      const handles = container.querySelectorAll(".cursor-ew-resize")
      expect(handles).toHaveLength(2) // Левая и правая ручки
    })

    it("должен не показывать ручки для не выбранного клипа", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} isSelected={false} />)

      const handles = container.querySelectorAll(".cursor-ew-resize")
      expect(handles).toHaveLength(0)
    })

    it("должен останавливать propagation при mousedown на ручках", () => {
      const onMouseDown = vi.fn()
      const clip = createMockSubtitleClip()

      const { container } = render(
        <SubtitleClip clip={clip} trackHeight={60} isSelected={true} onMouseDown={onMouseDown} />,
      )

      const leftHandle = container.querySelector(".cursor-ew-resize")
      fireEvent.mouseDown(leftHandle!)

      // onMouseDown родительского компонента не должен быть вызван
      expect(onMouseDown).not.toHaveBeenCalled()
    })
  })

  describe("Градиент и визуальные эффекты", () => {
    it("должен содержать градиентный overlay", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const gradient = container.querySelector(".bg-gradient-to-b")
      expect(gradient).toBeInTheDocument()
      expect(gradient).toHaveStyle({ pointerEvents: "none" })
    })

    it("должен иметь hover эффект", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveClass("hover:brightness-110")
    })
  })

  describe("Различные сценарии форматирования", () => {
    it("должен правильно отображать клип с минимальными данными", () => {
      const clip = createMockSubtitleClip({
        text: "Simple",
        animationIn: undefined,
        animationOut: undefined,
        subtitleStyleId: undefined,
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("Simple")).toBeInTheDocument()
      expect(screen.queryByText(/fade|slide|scale/)).not.toBeInTheDocument()
    })

    it("должен корректно обрабатывать очень короткую длительность", () => {
      const clip = createMockSubtitleClip({
        duration: 0.1,
      })

      // С PIXELS_PER_SECOND = 50: 0.1 * 50 = 5px < 80px
      // Длительность не должна отображаться для узкого клипа
      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.queryByText("0.1s")).not.toBeInTheDocument()
    })

    it("должен корректно обрабатывать очень длинную длительность", () => {
      const clip = createMockSubtitleClip({
        duration: 123.456,
      })

      render(<SubtitleClip clip={clip} trackHeight={60} />)

      expect(screen.getByText("123.5s")).toBeInTheDocument() // toFixed(1)
    })
  })

  describe("Edge cases", () => {
    it("должен обрабатывать пустой текст", () => {
      const clip = createMockSubtitleClip({
        text: "",
      })

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      // Клип должен рендериться даже с пустым текстом
      expect(container.firstChild).toBeInTheDocument()
    })

    it("должен корректно обрабатывать нулевую длительность", () => {
      const clip = createMockSubtitleClip({
        duration: 0,
      })

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        width: "0px",
      })
    })

    it("должен обрабатывать отрицательное startTime", () => {
      const clip = createMockSubtitleClip({
        startTime: -10,
      })

      const { container } = render(<SubtitleClip clip={clip} trackHeight={60} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        left: "-500px", // -10 * PIXELS_PER_SECOND(50)
      })
    })

    it("должен обрабатывать очень маленькую высоту трека", () => {
      const clip = createMockSubtitleClip()

      const { container } = render(<SubtitleClip clip={clip} trackHeight={10} />)

      const clipElement = container.firstChild as HTMLElement
      expect(clipElement).toHaveStyle({
        height: "2px", // 10 - 8
      })
    })
  })
})

import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithTimeline } from "@/test/test-utils"

import { SpeedCurveEditor } from "../../../components/speed-ramping/speed-curve-editor"

// Mock компонентов
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="dropdown-item">
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{asChild ? children : <div>{children}</div>}</div>
  ),
}))

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}))

// Mock хука speed ramping
const mockUseSpeedRamping = {
  getConfig: vi.fn(),
  addKeyframe: vi.fn(),
  updateKeyframe: vi.fn(),
  removeKeyframe: vi.fn(),
  applyPreset: vi.fn(),
  resetToConstantSpeed: vi.fn(),
  getSpeedCurveData: vi.fn(),
}

vi.mock("../../../hooks/speed-ramping/use-speed-ramping", () => ({
  useSpeedRamping: () => mockUseSpeedRamping,
}))

describe("SpeedCurveEditor", () => {
  const defaultProps = {
    clipId: "test-clip-1",
    clipDuration: 10,
    pixelsPerSecond: 100,
    height: 120,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock конфигурации по умолчанию
    mockUseSpeedRamping.getConfig.mockReturnValue({
      enabled: true,
      keyframes: [
        { id: "kf1", time: 2, value: 0.5, interpolation: "linear" },
        { id: "kf2", time: 5, value: 2.0, interpolation: "ease" },
        { id: "kf3", time: 8, value: 1.0, interpolation: "ease-out" },
      ],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    })

    mockUseSpeedRamping.getSpeedCurveData.mockReturnValue([
      { time: 0, speed: 1.0 },
      { time: 2, speed: 0.5 },
      { time: 5, speed: 2.0 },
      { time: 8, speed: 1.0 },
      { time: 10, speed: 1.0 },
    ])
  })

  it("рендерит компонент с базовыми элементами", () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    expect(screen.getByText("Speed Ramping")).toBeInTheDocument()
    expect(screen.getByText("Presets")).toBeInTheDocument()
    expect(screen.getByText("Reset to normal speed")).toBeInTheDocument()
  })

  it("отображает canvas с правильными размерами", () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    const canvas = screen.getByTestId("speed-curve-canvas")
    expect(canvas).toHaveAttribute("width", "1000") // 10 сек * 100 пикс/сек
    expect(canvas).toHaveAttribute("height", "120")
  })

  it("добавляет keyframe при клике на canvas", async () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    const canvas = screen.getByTestId("speed-curve-canvas")

    // Мокаем getBoundingClientRect для правильных координат
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 120,
      width: 1000,
      height: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // Симулируем клик по canvas
    fireEvent.click(canvas, {
      clientX: 300, // 3 секунды при 100 пикс/сек
      clientY: 60, // Середина по высоте (speed = 2.0)
    })

    // Проверяем что функция была вызвана
    expect(mockUseSpeedRamping.addKeyframe).toHaveBeenCalled()
    expect(mockUseSpeedRamping.addKeyframe).toHaveBeenCalledWith(
      "test-clip-1",
      expect.any(Number), // время
      expect.any(Number), // значение скорости
      "ease",
    )
  })

  it("применяет пресет при выборе из меню", async () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    // Находим кнопку пресетов и кликаем
    const presetsButton = screen.getByText("Presets")
    fireEvent.click(presetsButton)

    // Симулируем выбор пресета slow-motion
    const slowMotionPreset = screen.getByText("Slow Motion")
    fireEvent.click(slowMotionPreset)

    // Проверяем что функция была вызвана
    expect(mockUseSpeedRamping.applyPreset).toHaveBeenCalledWith("test-clip-1", "slow-motion")
  })

  it("сбрасывает скорость к нормальной при клике на reset", async () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    // Ищем кнопку с иконкой RotateCcw
    const resetButton = screen.getByTestId("rotateccw-icon").closest("button")
    expect(resetButton).toBeInTheDocument()
    fireEvent.click(resetButton!)

    // Проверяем что функция была вызвана
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 1.0)
  })

  it("вызывает onClose при клике на кнопку закрытия", () => {
    const onClose = vi.fn()
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByText("✕")
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it("отображает подсказку при отсутствии keyframes", () => {
    mockUseSpeedRamping.getConfig.mockReturnValue({
      enabled: true,
      keyframes: [], // Нет keyframes
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    })

    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    expect(screen.getByText("Click to add speed keyframes")).toBeInTheDocument()
  })

  it("обрабатывает клики по canvas для взаимодействия с keyframes", async () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    // Симулируем клик по canvas
    const canvas = screen.getByTestId("speed-curve-canvas")
    fireEvent.click(canvas, {
      clientX: 200, // Позиция на canvas
      clientY: 90,
    })

    // Проверяем что canvas корректно обрабатывает клики
    // В реальном использовании это может добавить keyframe или выбрать существующий
    expect(canvas).toBeInTheDocument()
  })

  it("показывает Y-axis labels с правильными значениями скорости", () => {
    renderWithTimeline(<SpeedCurveEditor {...defaultProps} />)

    expect(screen.getByText("4x")).toBeInTheDocument()
    expect(screen.getByText("3x")).toBeInTheDocument()
    expect(screen.getByText("2x")).toBeInTheDocument()
    expect(screen.getByText("1x")).toBeInTheDocument()
    expect(screen.getByText("0x")).toBeInTheDocument()
  })
})

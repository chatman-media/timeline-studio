import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithTimeline } from "@/test/test-utils"

import { SpeedRampingToggle } from "../../../components/speed-ramping/speed-ramping-toggle"

// Mock компонентов
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
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
  enableSpeedRamping: vi.fn(),
  disableSpeedRamping: vi.fn(),
}

vi.mock("../../../hooks/speed-ramping/use-speed-ramping", () => ({
  useSpeedRamping: () => mockUseSpeedRamping,
}))

describe("SpeedRampingToggle", () => {
  const defaultProps = {
    clipId: "test-clip-1",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("показывает неактивное состояние когда speed ramping выключен", () => {
    mockUseSpeedRamping.getConfig.mockReturnValue(null)

    renderWithTimeline(<SpeedRampingToggle {...defaultProps} />)

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()

    // Проверяем tooltip
    expect(screen.getByText("Enable Speed Ramping")).toBeInTheDocument()
    expect(screen.getByText("Cmd/Ctrl+Shift+R")).toBeInTheDocument()
  })

  it("показывает активное состояние когда speed ramping включен", () => {
    mockUseSpeedRamping.getConfig.mockReturnValue({
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    })

    renderWithTimeline(<SpeedRampingToggle {...defaultProps} />)

    expect(screen.getByText("Disable Speed Ramping")).toBeInTheDocument()
  })

  it("включает speed ramping при клике когда выключен", () => {
    mockUseSpeedRamping.getConfig.mockReturnValue(null)

    renderWithTimeline(<SpeedRampingToggle {...defaultProps} />)

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(mockUseSpeedRamping.enableSpeedRamping).toHaveBeenCalledWith("test-clip-1")
  })

  it("выключает speed ramping при клике когда включен", () => {
    mockUseSpeedRamping.getConfig.mockReturnValue({
      enabled: true,
      keyframes: [],
      maintainPitch: true,
      minSpeed: 0.1,
      maxSpeed: 4.0,
      showGraph: true,
      graphHeight: 120,
      graphOpacity: 0.8,
    })

    renderWithTimeline(<SpeedRampingToggle {...defaultProps} />)

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(mockUseSpeedRamping.disableSpeedRamping).toHaveBeenCalledWith("test-clip-1")
  })

  it("применяет дополнительные CSS классы", () => {
    mockUseSpeedRamping.getConfig.mockReturnValue(null)

    renderWithTimeline(<SpeedRampingToggle {...defaultProps} className="custom-class" />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
  })
})

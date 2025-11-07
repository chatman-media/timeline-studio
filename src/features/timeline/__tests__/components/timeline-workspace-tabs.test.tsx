import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useTranslation } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { TimelineWorkspaceTabs, type WorkspaceView } from "../../components/timeline-workspace-tabs"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        "timeline.workspace.timeline": "Timeline",
        "timeline.workspace.audioMixer": "Audio Mixer",
      }
      return translations[key] || key
    }),
  })),
}))

vi.mock("@/components/ui/button", () => ({
  Button: vi.fn(({ children, variant, size, onClick, className, ...props }) => (
    <button data-variant={variant} data-size={size} onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )),
}))

vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
}))

vi.mock("lucide-react", () => ({
  Layers: vi.fn(() => <div data-testid="layers-icon" />),
  Sliders: vi.fn(() => <div data-testid="sliders-icon" />),
}))

describe("TimelineWorkspaceTabs", () => {
  const mockOnViewChange = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  const defaultProps = {
    activeView: "timeline" as WorkspaceView,
    onViewChange: mockOnViewChange,
  }

  describe("rendering", () => {
    it("должен рендерить контейнер с правильными классами", () => {
      const { container } = render(<TimelineWorkspaceTabs {...defaultProps} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("flex")
      expect(wrapper.className).toContain("h-10")
      expect(wrapper.className).toContain("items-center")
    })

    it("должен рендерить обе кнопки табов", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const timelineButton = screen.getByText("Timeline")
      const audioMixerButton = screen.getByText("Audio Mixer")

      expect(timelineButton).toBeInTheDocument()
      expect(audioMixerButton).toBeInTheDocument()
    })

    it("должен рендерить иконки для каждого таба", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(screen.getByTestId("layers-icon")).toBeInTheDocument()
      expect(screen.getByTestId("sliders-icon")).toBeInTheDocument()
    })

    it("должен вызывать useTranslation для переводов", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(useTranslation).toHaveBeenCalled()
    })

    it("должен использовать правильные переводы", () => {
      const mockT = vi.fn((key: string) => key)
      // @ts-expect-error - Mock doesn't need full TFunction interface
      vi.mocked(useTranslation).mockReturnValue({ t: mockT })

      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(mockT).toHaveBeenCalledWith("timeline.workspace.timeline")
      expect(mockT).toHaveBeenCalledWith("timeline.workspace.audioMixer")
    })
  })

  describe("active state - timeline", () => {
    it("должен показать timeline как активный по умолчанию", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const timelineButton = screen.getByText("Timeline").closest("button")
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")

      expect(timelineButton).toHaveAttribute("data-variant", "secondary")
      expect(audioMixerButton).toHaveAttribute("data-variant", "ghost")
    })

    it("должен применить правильные CSS классы для активного timeline", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(cn).toHaveBeenCalledWith("h-8 gap-2", "bg-secondary")
      expect(cn).toHaveBeenCalledWith("h-8 gap-2", false)
    })
  })

  describe("active state - audio-mixer", () => {
    it("должен показать audio-mixer как активный", () => {
      render(<TimelineWorkspaceTabs activeView="audio-mixer" onViewChange={mockOnViewChange} />)

      const timelineButton = screen.getByText("Timeline").closest("button")
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")

      expect(timelineButton).toHaveAttribute("data-variant", "ghost")
      expect(audioMixerButton).toHaveAttribute("data-variant", "secondary")
    })

    it("должен применить правильные CSS классы для активного audio-mixer", () => {
      render(<TimelineWorkspaceTabs activeView="audio-mixer" onViewChange={mockOnViewChange} />)

      expect(cn).toHaveBeenCalledWith("h-8 gap-2", false)
      expect(cn).toHaveBeenCalledWith("h-8 gap-2", "bg-secondary")
    })
  })

  describe("user interactions", () => {
    it("должен вызвать onViewChange при клике на timeline", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs activeView="audio-mixer" onViewChange={mockOnViewChange} />)

      const timelineButton = screen.getByText("Timeline").closest("button")!
      await user.click(timelineButton)

      expect(mockOnViewChange).toHaveBeenCalledWith("timeline")
      expect(mockOnViewChange).toHaveBeenCalledTimes(1)
    })

    it("должен вызвать onViewChange при клике на audio-mixer", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")!
      await user.click(audioMixerButton)

      expect(mockOnViewChange).toHaveBeenCalledWith("audio-mixer")
      expect(mockOnViewChange).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onViewChange при повторном клике на активный таб", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const timelineButton = screen.getByText("Timeline").closest("button")!
      await user.click(timelineButton)

      expect(mockOnViewChange).toHaveBeenCalledWith("timeline")
    })

    it("должен обрабатывать множественные клики", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const timelineButton = screen.getByText("Timeline").closest("button")!
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")!

      await user.click(audioMixerButton)
      await user.click(timelineButton)
      await user.click(audioMixerButton)

      expect(mockOnViewChange).toHaveBeenCalledTimes(3)
      expect(mockOnViewChange).toHaveBeenNthCalledWith(1, "audio-mixer")
      expect(mockOnViewChange).toHaveBeenNthCalledWith(2, "timeline")
      expect(mockOnViewChange).toHaveBeenNthCalledWith(3, "audio-mixer")
    })
  })

  describe("button configuration", () => {
    it("должен передать правильные props для timeline кнопки", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(Button).toHaveBeenCalledWith(
        {
          variant: "secondary",
          size: "sm",
          onClick: expect.any(Function),
          className: expect.any(String),
          children: expect.any(Array),
        },
        undefined,
      )
    })

    it("должен передать правильные props для audio-mixer кнопки", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(Button).toHaveBeenCalledWith(
        {
          variant: "ghost",
          size: "sm",
          onClick: expect.any(Function),
          className: expect.any(String),
          children: expect.any(Array),
        },
        undefined,
      )
    })

    it("должен использовать размер sm для обеих кнопок", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("data-size", "sm")
      })
    })
  })

  describe("accessibility", () => {
    it("должен иметь доступные кнопки", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(2)

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })

    it("должен иметь читаемый текст для screen readers", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(screen.getByText("Timeline")).toBeInTheDocument()
      expect(screen.getByText("Audio Mixer")).toBeInTheDocument()
    })

    it("должен поддерживать keyboard navigation", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button.tagName).toBe("BUTTON")
      })
    })
  })

  describe("layout structure", () => {
    it("должен иметь правильную структуру DOM", () => {
      const { container } = render(<TimelineWorkspaceTabs {...defaultProps} />)

      const wrapper = container.querySelector(".flex.h-10.items-center")
      const innerContainer = wrapper?.querySelector(".flex.gap-1")
      const buttons = innerContainer?.querySelectorAll("button")

      expect(wrapper).toBeInTheDocument()
      expect(innerContainer).toBeInTheDocument()
      expect(buttons).toHaveLength(2)
    })

    it("должен правильно организовать иконки и текст", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} />)

      const timelineButton = screen.getByText("Timeline").closest("button")
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")

      // Проверяем что иконки находятся внутри кнопок
      expect(timelineButton?.querySelector('[data-testid="layers-icon"]')).toBeInTheDocument()
      expect(audioMixerButton?.querySelector('[data-testid="sliders-icon"]')).toBeInTheDocument()
    })
  })

  describe("performance", () => {
    it("не должен вызывать лишние перерендеры", () => {
      const { rerender } = render(<TimelineWorkspaceTabs {...defaultProps} />)

      const initialCallCount = vi.mocked(Button).mock.calls.length

      rerender(<TimelineWorkspaceTabs {...defaultProps} />)

      const afterRerenderCallCount = vi.mocked(Button).mock.calls.length

      expect(afterRerenderCallCount).toBe(initialCallCount + 2) // 2 кнопки
    })

    it("должен мемоизировать переводы", () => {
      const mockT = vi.fn((key: string) => key)
      // @ts-expect-error - Mock doesn't need full TFunction interface
      vi.mocked(useTranslation).mockReturnValue({ t: mockT })

      const { rerender } = render(<TimelineWorkspaceTabs {...defaultProps} />)

      const initialTCallCount = mockT.mock.calls.length

      rerender(<TimelineWorkspaceTabs {...defaultProps} />)

      expect(mockT.mock.calls.length).toBe(initialTCallCount + 2) // Переводы вызываются заново
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать undefined onViewChange", () => {
      expect(() => {
        render(<TimelineWorkspaceTabs activeView="timeline" onViewChange={undefined as any} />)
      }).not.toThrow()
    })

    it("должен обрабатывать неизвестные activeView значения", () => {
      expect(() => {
        render(<TimelineWorkspaceTabs activeView={"unknown" as WorkspaceView} onViewChange={mockOnViewChange} />)
      }).not.toThrow()
    })

    it("должен корректно работать без переводов", () => {
      vi.mocked(useTranslation).mockReturnValue({
        t: Object.assign(
          vi.fn(() => ""),
          { $TFunctionBrand: Symbol("TFunction") as any },
        ),
      } as any)

      expect(() => {
        render(<TimelineWorkspaceTabs {...defaultProps} />)
      }).not.toThrow()
    })
  })
})

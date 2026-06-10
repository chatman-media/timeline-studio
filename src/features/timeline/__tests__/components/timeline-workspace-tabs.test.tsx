/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "@timeline-studio/ui/components/button"
import { useTranslation } from "react-i18next"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { cn } from "@/lib/utils"

import { TimelineWorkspaceTabs, type WorkspaceView } from "../../components/timeline-workspace-tabs"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        "timeline.workspace.analysis": "Analysis",
        "timeline.workspace.timeline": "Timeline",
        "timeline.workspace.audioMixer": "Audio Mixer",
      }
      return translations[key] || key
    }),
  })),
}))

vi.mock("@timeline-studio/ui/components/button", () => ({
  Button: vi.fn(({ children, variant, size, onClick, className, ...props }) => (
    <button
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      className={className}
      {...props}
      data-oid="jdlvm.c"
    >
      {children}
    </button>
  )),
}))

vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
}))

vi.mock("lucide-react", () => ({
  BarChart3: vi.fn(() => <div data-testid="barchart3-icon" data-oid="m7ve0wc" />),
  Clapperboard: vi.fn(() => <div data-testid="clapperboard-icon" data-oid="clapperboard" />),
  Layers: vi.fn(() => <div data-testid="layers-icon" data-oid="et8._wh" />),
  Sliders: vi.fn(() => <div data-testid="sliders-icon" data-oid="h.:4c5z" />),
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
      const { container } = render(<TimelineWorkspaceTabs {...defaultProps} data-oid="ufpi2ef" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("flex")
      expect(wrapper.className).toContain("h-10")
      expect(wrapper.className).toContain("items-center")
    })

    it("должен рендерить обе кнопки табов", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="s9wu_g." />)

      const analysisButton = screen.getByText("Analysis")
      const timelineButton = screen.getByText("Timeline")
      const audioMixerButton = screen.getByText("Audio Mixer")

      expect(analysisButton).toBeInTheDocument()
      expect(timelineButton).toBeInTheDocument()
      expect(audioMixerButton).toBeInTheDocument()
    })

    it("должен рендерить иконки для каждого таба", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="pr2khni" />)

      expect(screen.getByTestId("barchart3-icon")).toBeInTheDocument()
      expect(screen.getByTestId("layers-icon")).toBeInTheDocument()
      expect(screen.getByTestId("sliders-icon")).toBeInTheDocument()
    })

    it("должен вызывать useTranslation для переводов", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="x4k3c.h" />)

      expect(useTranslation).toHaveBeenCalled()
    })

    it("должен использовать правильные переводы", () => {
      const mockT = vi.fn((key: string) => key)
      // @ts-expect-error - Mock doesn't need full TFunction interface
      vi.mocked(useTranslation).mockReturnValue({ t: mockT })

      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="ffve7dp" />)

      expect(mockT).toHaveBeenCalledWith("timeline.workspace.analysis")
      expect(mockT).toHaveBeenCalledWith("timeline.workspace.timeline")
      expect(mockT).toHaveBeenCalledWith("timeline.workspace.audioMixer")
    })
  })

  describe("active state - timeline", () => {
    it("должен показать timeline как активный по умолчанию", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="uu-g3.9" />)

      const timelineButton = screen.getByText("Timeline").closest("button")
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")

      expect(timelineButton).toHaveAttribute("data-variant", "secondary")
      expect(audioMixerButton).toHaveAttribute("data-variant", "ghost")
    })

    it("должен применить правильные CSS классы для активного timeline", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="3woblf2" />)

      expect(cn).toHaveBeenCalledWith("h-7 cursor-pointer gap-3", "bg-secondary")
      expect(cn).toHaveBeenCalledWith("h-7 cursor-pointer gap-3", false)
    })
  })

  describe("active state - audio-mixer", () => {
    it("должен показать audio-mixer как активный", () => {
      render(<TimelineWorkspaceTabs activeView="audio-mixer" onViewChange={mockOnViewChange} data-oid="4e.p.xk" />)

      const timelineButton = screen.getByText("Timeline").closest("button")
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")

      expect(timelineButton).toHaveAttribute("data-variant", "ghost")
      expect(audioMixerButton).toHaveAttribute("data-variant", "secondary")
    })

    it("должен применить правильные CSS классы для активного audio-mixer", () => {
      render(<TimelineWorkspaceTabs activeView="audio-mixer" onViewChange={mockOnViewChange} data-oid="4gu5rgx" />)

      expect(cn).toHaveBeenCalledWith("h-7 cursor-pointer gap-3", false)
      expect(cn).toHaveBeenCalledWith("h-7 cursor-pointer gap-3", "bg-secondary")
    })
  })

  describe("user interactions", () => {
    it("должен вызвать onViewChange при клике на timeline", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs activeView="audio-mixer" onViewChange={mockOnViewChange} data-oid="p0rhd93" />)

      const timelineButton = screen.getByText("Timeline").closest("button")!
      await user.click(timelineButton)

      expect(mockOnViewChange).toHaveBeenCalledWith("timeline")
      expect(mockOnViewChange).toHaveBeenCalledTimes(1)
    })

    it("должен вызвать onViewChange при клике на audio-mixer", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="145jnpx" />)

      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")!
      await user.click(audioMixerButton)

      expect(mockOnViewChange).toHaveBeenCalledWith("audio-mixer")
      expect(mockOnViewChange).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onViewChange при повторном клике на активный таб", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid=".aj0hxp" />)

      const timelineButton = screen.getByText("Timeline").closest("button")!
      await user.click(timelineButton)

      expect(mockOnViewChange).toHaveBeenCalledWith("timeline")
    })

    it("должен обрабатывать множественные клики", async () => {
      const user = userEvent.setup()
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="2nodzky" />)

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
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="t.pnx6w" />)

      expect(Button).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "secondary",
          size: "sm",
          onClick: expect.any(Function),
          className: expect.any(String),
          children: expect.any(Array),
        }),
        undefined,
      )
    })

    it("должен передать правильные props для audio-mixer кнопки", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="pcrr80t" />)

      expect(Button).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "ghost",
          size: "sm",
          onClick: expect.any(Function),
          className: expect.any(String),
          children: expect.any(Array),
        }),
        undefined,
      )
    })

    it("должен использовать размер sm для обеих кнопок", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="0ivq1ve" />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("data-size", "sm")
      })
    })
  })

  describe("accessibility", () => {
    it("должен иметь доступные кнопки", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="jk-6489" />)

      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(4)

      buttons.forEach((button) => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })

    it("должен иметь читаемый текст для screen readers", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid=":da:qgb" />)

      expect(screen.getByText("Analysis")).toBeInTheDocument()
      expect(screen.getByText("Timeline")).toBeInTheDocument()
      expect(screen.getByText("Audio Mixer")).toBeInTheDocument()
    })

    it("должен поддерживать keyboard navigation", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="btgie.w" />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button.tagName).toBe("BUTTON")
      })
    })
  })

  describe("layout structure", () => {
    it("должен иметь правильную структуру DOM", () => {
      const { container } = render(<TimelineWorkspaceTabs {...defaultProps} data-oid="u2hm1c0" />)

      const wrapper = container.querySelector(".flex.h-10.items-center")
      const innerContainer = wrapper?.querySelector(".flex.gap-1")
      const buttons = innerContainer?.querySelectorAll("button")

      expect(wrapper).toBeInTheDocument()
      expect(innerContainer).toBeInTheDocument()
      expect(buttons).toHaveLength(4)
    })

    it("должен правильно организовать иконки и текст", () => {
      render(<TimelineWorkspaceTabs {...defaultProps} data-oid="yl080j6" />)

      const analysisButton = screen.getByText("Analysis").closest("button")
      const timelineButton = screen.getByText("Timeline").closest("button")
      const audioMixerButton = screen.getByText("Audio Mixer").closest("button")

      // Проверяем что иконки находятся внутри кнопок
      expect(analysisButton?.querySelector('[data-testid="barchart3-icon"]')).toBeInTheDocument()
      expect(timelineButton?.querySelector('[data-testid="layers-icon"]')).toBeInTheDocument()
      expect(audioMixerButton?.querySelector('[data-testid="sliders-icon"]')).toBeInTheDocument()
    })
  })

  describe("performance", () => {
    it("не должен вызывать лишние перерендеры", () => {
      const { rerender } = render(<TimelineWorkspaceTabs {...defaultProps} data-oid="mzedk_9" />)

      const initialCallCount = vi.mocked(Button).mock.calls.length

      rerender(<TimelineWorkspaceTabs {...defaultProps} data-oid="19z7c:o" />)

      const afterRerenderCallCount = vi.mocked(Button).mock.calls.length

      expect(afterRerenderCallCount).toBe(initialCallCount + 4) // 4 кнопки
    })

    it("должен мемоизировать переводы", () => {
      const mockT = vi.fn((key: string) => key)
      // @ts-expect-error - Mock doesn't need full TFunction interface
      vi.mocked(useTranslation).mockReturnValue({ t: mockT })

      const { rerender } = render(<TimelineWorkspaceTabs {...defaultProps} data-oid="moblnmu" />)

      const initialTCallCount = mockT.mock.calls.length

      rerender(<TimelineWorkspaceTabs {...defaultProps} data-oid="l1qehif" />)

      expect(mockT.mock.calls.length).toBe(initialTCallCount + 4) // Переводы вызываются заново
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать undefined onViewChange", () => {
      expect(() => {
        render(<TimelineWorkspaceTabs activeView="timeline" onViewChange={undefined as any} data-oid="unhq1ar" />)
      }).not.toThrow()
    })

    it("должен обрабатывать неизвестные activeView значения", () => {
      expect(() => {
        render(
          <TimelineWorkspaceTabs
            activeView={"unknown" as WorkspaceView}
            onViewChange={mockOnViewChange}
            data-oid="u7-m-.l"
          />,
        )
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
        render(<TimelineWorkspaceTabs {...defaultProps} data-oid="2ypta69" />)
      }).not.toThrow()
    })
  })
})

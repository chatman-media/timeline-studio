import { describe, expect, it, vi, beforeEach } from "vitest"
import { fireEvent, waitFor } from "@testing-library/react"

import type { MediaFile } from "@/features/media/types/media"
import { setTranslations } from "@/test/mocks/libraries/i18n"
import { renderWithBase, screen } from "@/test/test-utils"

import { Options } from "../../components/options"

// Mock media file for tests
const mockMediaFile: MediaFile = {
  id: "test-video-1",
  path: "/test/sample.mp4",
  name: "sample.mp4",
  type: "video" as any,
  size: 1000000,
  isVideo: true,
  isAudio: false,
  isImage: false,
  duration: 60,
  createdAt: new Date("2025-01-15T10:30:00Z"),
  isLoadingMetadata: false,
  probeData: {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
        width: 1920,
        height: 1080,
        r_frame_rate: "30/1",
        duration: "60.0",
        bit_rate: "5000000",
      },
    ],
    format: {
      filename: "/test/sample.mp4",
      nb_streams: 1,
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
      duration: 60,
      size: 1000000,
      bit_rate: 5000000,
    },
  },
}

// Mock UI components
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="options-tabs" data-value={value} {...props}>
      <div onClick={() => onValueChange && onValueChange("color")} data-testid="tabs-trigger">
        {children}
      </div>
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="options-tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button
      data-testid={`options-tab-${value}`}
      onClick={() => props.onValueChange && props.onValueChange(value)}
      value={value}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`options-content-${value}`} {...props}>
      {children}
    </div>
  ),
}))

// Mock child components to isolate testing
vi.mock("../../components/audio-settings", () => ({
  AudioSettings: () => <div data-testid="mock-audio-settings">AudioSettings</div>,
}))

vi.mock("../../components/speed-settings", () => ({
  SpeedSettings: () => <div data-testid="mock-speed-settings">SpeedSettings</div>,
}))

vi.mock("../../components/info-settings", () => ({
  InfoSettings: ({ selectedMediaFile }: any) => (
    <div data-testid="mock-info-settings">
      InfoSettings {selectedMediaFile?.name && `- ${selectedMediaFile.name}`}
    </div>
  ),
}))

vi.mock("@/features/color-grading", () => ({
  ColorSettings: () => <div data-testid="mock-color-settings">ColorSettings</div>,
}))

// Set translations
setTranslations({
  "options.tabs.color": "Color",
  "options.tabs.audio": "Audio",
  "options.tabs.speed": "Speed",
  "options.tabs.info": "Info",
})

describe("Options", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render options component", () => {
      renderWithBase(<Options />)
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })

    it("should render all tab triggers", () => {
      renderWithBase(<Options />)

      expect(screen.getByTestId("options-tab-color")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-speed")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-audio")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-info")).toBeInTheDocument()
    })

    it("should render tabs list", () => {
      renderWithBase(<Options />)
      expect(screen.getByTestId("options-tabs-list")).toBeInTheDocument()
    })

    it("should render tab contents", () => {
      renderWithBase(<Options />)

      expect(screen.getByTestId("options-content-color")).toBeInTheDocument()
      expect(screen.getByTestId("options-content-speed")).toBeInTheDocument()
      expect(screen.getByTestId("options-content-audio")).toBeInTheDocument()
      expect(screen.getByTestId("options-content-info")).toBeInTheDocument()
    })

    it("should accept props without errors", () => {
      expect(() => {
        renderWithBase(<Options />)
      }).not.toThrow()

      expect(() => {
        renderWithBase(<Options selectedMediaFile={mockMediaFile} />)
      }).not.toThrow()
    })

    it("should render with selectedMediaFile prop", () => {
      renderWithBase(<Options selectedMediaFile={mockMediaFile} />)
      expect(screen.getByTestId("options")).toBeInTheDocument()
    })
  })

  describe("Default State", () => {
    it("should default to color tab", () => {
      renderWithBase(<Options />)
      const tabs = screen.getByTestId("options-tabs")
      expect(tabs).toHaveAttribute("data-value", "color")
    })

    it("should render color settings by default", () => {
      renderWithBase(<Options />)
      expect(screen.getByTestId("mock-color-settings")).toBeInTheDocument()
    })
  })

  describe("Auto-switching to Info Tab", () => {
    it("should switch to info tab when selectedMediaFile is provided", async () => {
      const { rerender } = renderWithBase(<Options />)

      // Initially on color tab
      expect(screen.getByTestId("options-tabs")).toHaveAttribute("data-value", "color")

      // Rerender with selectedMediaFile
      rerender(<Options selectedMediaFile={mockMediaFile} />)

      // Should auto-switch to info tab
      await waitFor(() => {
        expect(screen.getByTestId("options-tabs")).toHaveAttribute("data-value", "info")
      })
    })

    it("should switch to info tab when selectedMediaFile changes", async () => {
      const { rerender } = renderWithBase(<Options selectedMediaFile={mockMediaFile} />)

      await waitFor(() => {
        expect(screen.getByTestId("options-tabs")).toHaveAttribute("data-value", "info")
      })

      const newMediaFile = { ...mockMediaFile, id: "test-video-2", name: "new-video.mp4" }
      rerender(<Options selectedMediaFile={newMediaFile} />)

      // Should remain on info tab
      await waitFor(() => {
        expect(screen.getByTestId("options-tabs")).toHaveAttribute("data-value", "info")
      })
    })
  })

  describe("Tab Content Rendering", () => {
    it("should render ColorSettings when color tab is active", () => {
      renderWithBase(<Options />)
      expect(screen.getByTestId("mock-color-settings")).toBeInTheDocument()
    })

    it("should render InfoSettings with selectedMediaFile", async () => {
      renderWithBase(<Options selectedMediaFile={mockMediaFile} />)

      await waitFor(() => {
        const infoSettings = screen.getByTestId("mock-info-settings")
        expect(infoSettings).toBeInTheDocument()
        expect(infoSettings).toHaveTextContent(mockMediaFile.name)
      })
    })

    it("should pass selectedMediaFile to InfoSettings", async () => {
      renderWithBase(<Options selectedMediaFile={mockMediaFile} />)

      await waitFor(() => {
        expect(screen.getByText(/sample\.mp4/)).toBeInTheDocument()
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper test IDs for all elements", () => {
      renderWithBase(<Options />)

      expect(screen.getByTestId("options")).toBeInTheDocument()
      expect(screen.getByTestId("options-tabs")).toBeInTheDocument()
      expect(screen.getByTestId("options-tabs-list")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-color")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-speed")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-audio")).toBeInTheDocument()
      expect(screen.getByTestId("options-tab-info")).toBeInTheDocument()
    })

    it("should render tab labels with translations", () => {
      renderWithBase(<Options />)

      expect(screen.getByText("Color")).toBeInTheDocument()
      expect(screen.getByText("Speed")).toBeInTheDocument()
      expect(screen.getByText("Audio")).toBeInTheDocument()
      expect(screen.getByText("Info")).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle null selectedMediaFile", () => {
      expect(() => {
        renderWithBase(<Options selectedMediaFile={null} />)
      }).not.toThrow()
    })

    it("should handle undefined selectedMediaFile", () => {
      expect(() => {
        renderWithBase(<Options selectedMediaFile={undefined} />)
      }).not.toThrow()
    })

    it("should render properly without any props", () => {
      const { container } = renderWithBase(<Options />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe("Component Structure", () => {
    it("should have correct DOM structure", () => {
      const { container } = renderWithBase(<Options />)
      const optionsDiv = container.querySelector('[data-testid="options"]')

      expect(optionsDiv).toHaveClass("flex", "h-full", "flex-col", "bg-background")
    })

    it("should render tabs with correct structure", () => {
      renderWithBase(<Options />)
      const tabs = screen.getByTestId("options-tabs")
      expect(tabs).toHaveClass("flex", "flex-col", "h-full")
    })
  })
})

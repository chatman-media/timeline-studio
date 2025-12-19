/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EXPORT_PRESETS, ExportPresets } from "../../components/export-presets"

describe("ExportPresets", () => {
  const mockOnSelectPreset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Basic rendering", () => {
    it("should render all export presets", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="vtg-na6" />)

      // Check that all presets are rendered
      expect(screen.getByText("Custom Export")).toBeInTheDocument()
      expect(screen.getByText("H.264 Master")).toBeInTheDocument()
      expect(screen.getByText("H.265 Master")).toBeInTheDocument()
      expect(screen.getByText("ProRes 422 HQ")).toBeInTheDocument()
      expect(screen.getByText("HyperDeck")).toBeInTheDocument()
      expect(screen.getByText("YouTube 1080p")).toBeInTheDocument()
      expect(screen.getByText("Vimeo 1080p")).toBeInTheDocument()
      expect(screen.getByText("TikTok 1080p")).toBeInTheDocument()
    })

    it("should render correct number of preset buttons", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="m1-.fuk" />)

      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(EXPORT_PRESETS.length)
    })

    it("should render without crashing", () => {
      expect(() =>
        render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="boyspex" />),
      ).not.toThrow()
    })
  })

  describe("Preset selection", () => {
    it("should highlight selected preset", () => {
      render(<ExportPresets selectedPresetId="h264-master" onSelectPreset={mockOnSelectPreset} data-oid="qn43ugr" />)

      const h264Button = screen.getByText("H.264 Master").closest("button")
      const customButton = screen.getByText("Custom Export").closest("button")

      // Selected preset should have primary background
      expect(h264Button).toHaveClass("bg-primary")
      expect(customButton).not.toHaveClass("bg-primary")
    })

    it("should call onSelectPreset when clicking a preset", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="bytw.m5" />)

      const h264Button = screen.getByText("H.264 Master")
      fireEvent.click(h264Button)

      expect(mockOnSelectPreset).toHaveBeenCalledTimes(1)
      const calledWith = mockOnSelectPreset.mock.calls[0][0]
      expect(calledWith.id).toBe("h264-master")
      expect(calledWith.name).toBe("H.264 Master")
    })

    it("should handle multiple preset selections", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="g1.b6-w" />)

      // Click multiple presets
      fireEvent.click(screen.getByText("YouTube 1080p"))
      fireEvent.click(screen.getByText("TikTok 1080p"))
      fireEvent.click(screen.getByText("ProRes 422 HQ"))

      expect(mockOnSelectPreset).toHaveBeenCalledTimes(3)
      expect(mockOnSelectPreset.mock.calls[0][0].id).toBe("youtube")
      expect(mockOnSelectPreset.mock.calls[1][0].id).toBe("tiktok")
      expect(mockOnSelectPreset.mock.calls[2][0].id).toBe("prores")
    })
  })

  describe("Preset configurations", () => {
    it("should have correct settings for Custom Export", () => {
      const customPreset = EXPORT_PRESETS.find((p) => p.id === "custom")
      expect(customPreset).toBeDefined()
      expect(customPreset?.settings.format).toBe("mp4")
      expect(customPreset?.settings.codec).toBe("h264")
      expect(customPreset?.settings.resolution).toBe("timeline")
      expect(customPreset?.settings.fps).toBe("timeline")
    })

    it("should have correct settings for H.264 Master", () => {
      const h264Preset = EXPORT_PRESETS.find((p) => p.id === "h264-master")
      expect(h264Preset).toBeDefined()
      expect(h264Preset?.settings.format).toBe("mp4")
      expect(h264Preset?.settings.codec).toBe("h264")
      expect(h264Preset?.settings.codecProfile).toBe("high")
      expect(h264Preset?.settings.bitrate).toBe(80000)
      expect(h264Preset?.settings.bitrateMode).toBe("cbr")
      expect(h264Preset?.settings.useHardwareAcceleration).toBe(true)
    })

    it("should have correct settings for H.265 Master", () => {
      const h265Preset = EXPORT_PRESETS.find((p) => p.id === "h265-master")
      expect(h265Preset).toBeDefined()
      expect(h265Preset?.settings.format).toBe("mp4")
      expect(h265Preset?.settings.codec).toBe("h265")
      expect(h265Preset?.settings.codecProfile).toBe("main10")
      expect(h265Preset?.settings.bitrate).toBe(60000)
      expect(h265Preset?.settings.bitrateMode).toBe("vbr")
      expect(h265Preset?.settings.optimizeForSpeed).toBe(true)
    })

    it("should have correct settings for ProRes", () => {
      const proresPreset = EXPORT_PRESETS.find((p) => p.id === "prores")
      expect(proresPreset).toBeDefined()
      expect(proresPreset?.settings.format).toBe("quicktime")
      expect(proresPreset?.settings.codec).toBe("prores")
      expect(proresPreset?.settings.resolution).toBe("timeline")
      expect(proresPreset?.settings.fps).toBe("timeline")
    })

    it("should have correct settings for YouTube preset", () => {
      const youtubePreset = EXPORT_PRESETS.find((p) => p.id === "youtube")
      expect(youtubePreset).toBeDefined()
      expect(youtubePreset?.settings.format).toBe("mp4")
      expect(youtubePreset?.settings.codec).toBe("h264")
      expect(youtubePreset?.settings.resolution).toBe("1080")
      expect(youtubePreset?.settings.bitrate).toBe(12000)
      expect(youtubePreset?.settings.normalizeAudio).toBe(true)
      expect(youtubePreset?.settings.audioTarget).toBe(-14)
      expect(youtubePreset?.settings.uploadDirectly).toBe(true)
    })

    it("should have correct settings for TikTok preset", () => {
      const tiktokPreset = EXPORT_PRESETS.find((p) => p.id === "tiktok")
      expect(tiktokPreset).toBeDefined()
      expect(tiktokPreset?.settings.format).toBe("mp4")
      expect(tiktokPreset?.settings.codec).toBe("h264")
      expect(tiktokPreset?.settings.resolution).toBe("1080")
      expect(tiktokPreset?.settings.fps).toBe("30")
      expect(tiktokPreset?.settings.useVerticalResolution).toBe(true)
      expect(tiktokPreset?.settings.uploadDirectly).toBe(true)
    })

    it("should have correct settings for HyperDeck preset", () => {
      const hyperdeckPreset = EXPORT_PRESETS.find((p) => p.id === "hyperdeck")
      expect(hyperdeckPreset).toBeDefined()
      expect(hyperdeckPreset?.settings.format).toBe("mov")
      expect(hyperdeckPreset?.settings.codec).toBe("h264")
      expect(hyperdeckPreset?.settings.codecProfile).toBe("main")
      expect(hyperdeckPreset?.settings.bitrate).toBe(50000)
      expect(hyperdeckPreset?.settings.bitrateMode).toBe("cbr")
    })
  })

  describe("Visual presentation", () => {
    it("should render preset icons", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="q0z5z1c" />)

      // Check that buttons contain icon containers
      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        const iconContainer = button.querySelector(".flex.items-center.justify-center")
        expect(iconContainer).toBeInTheDocument()
      })
    })

    it("should show hover styles on buttons", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="_pq4:.s" />)

      const button = screen.getByText("H.264 Master").closest("button")
      expect(button).toHaveClass("hover:bg-accent")
    })

    it("should have proper accessible focus styles", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="tlfz7ba" />)

      const button = screen.getByText("Custom Export").closest("button")
      expect(button).toHaveClass("focus:outline-none")
      expect(button).toHaveClass("focus:ring-2")
      expect(button).toHaveClass("focus:ring-primary")
    })

    it("should render with custom className", () => {
      const { container } = render(
        <ExportPresets
          selectedPresetId="custom"
          onSelectPreset={mockOnSelectPreset}
          className="custom-class"
          data-oid="rvwzrr9"
        />,
      )

      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass("custom-class")
    })
  })

  describe("Accessibility", () => {
    it("should have proper button roles", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="jlpc-ry" />)

      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(EXPORT_PRESETS.length)
    })

    it("should be keyboard navigable", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid=".4.qkdz" />)

      const firstButton = screen.getByText("Custom Export").closest("button")
      firstButton?.focus()
      expect(document.activeElement).toBe(firstButton)
    })

    it("should have readable text content", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="chhg8-." />)

      // All preset names should be visible
      EXPORT_PRESETS.forEach((preset) => {
        expect(screen.getByText(preset.name)).toBeInTheDocument()
      })
    })
  })

  describe("Component structure", () => {
    it("should have scrollable container", () => {
      const { container } = render(
        <ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="3udf1dm" />,
      )

      const scrollContainer = container.querySelector(".overflow-x-auto")
      expect(scrollContainer).toBeInTheDocument()
    })

    it("should have proper spacing and layout classes", () => {
      const { container } = render(
        <ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="-223tzg" />,
      )

      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass("flex")
    })

    it("should render buttons with minimum width", () => {
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={mockOnSelectPreset} data-oid="xnllpkq" />)

      const buttons = screen.getAllByRole("button")
      buttons.forEach((button) => {
        expect(button).toHaveClass("min-w-[100px]")
      })
    })
  })

  describe("Edge cases", () => {
    it("should handle invalid selectedPresetId gracefully", () => {
      expect(() =>
        render(
          <ExportPresets
            selectedPresetId="non-existent-preset"
            onSelectPreset={mockOnSelectPreset}
            data-oid="y-h:s__"
          />,
        ),
      ).not.toThrow()
    })

    it("should handle empty onSelectPreset function", () => {
      const emptyFunction = vi.fn()
      render(<ExportPresets selectedPresetId="custom" onSelectPreset={emptyFunction} data-oid="ot6sgcw" />)

      const button = screen.getByText("Custom Export")
      fireEvent.click(button)

      expect(emptyFunction).toHaveBeenCalled()
    })

    it("should verify all presets have required properties", () => {
      EXPORT_PRESETS.forEach((preset) => {
        expect(preset).toHaveProperty("id")
        expect(preset).toHaveProperty("name")
        expect(preset).toHaveProperty("icon")
        expect(preset).toHaveProperty("description")
        expect(preset).toHaveProperty("settings")
        expect(preset.settings).toHaveProperty("format")
        expect(preset.settings).toHaveProperty("codec")
        expect(preset.settings).toHaveProperty("resolution")
        expect(preset.settings).toHaveProperty("fps")
      })
    })
  })
})

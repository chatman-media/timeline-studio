import { fireEvent } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { mockUseTranslation } from "@/test/mocks/libraries/i18n"
import { renderWithProviders } from "@/test/test-utils"

import { SurroundPanner } from "../../mixer/surround-panner"

describe("SurroundPanner", () => {
  const mockOnPositionChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up translations for the tests
    const translations: Record<string, string> = {
      "fairlightAudio.surround.panner.stereo": "STEREO Surround Panner",
      "fairlightAudio.surround.panner.5.1": "5.1 Surround Panner",
      "fairlightAudio.surround.panner.7.1": "7.1 Surround Panner",
      "fairlightAudio.surround.panner.position": "Position: X:{{x}}% Y:{{y}}%",
      "fairlightAudio.surround.panner.source": "Source",
      "fairlightAudio.surround.speakers.left": "Left",
      "fairlightAudio.surround.speakers.right": "Right",
      "fairlightAudio.surround.speakers.center": "Center",
      "fairlightAudio.surround.speakers.lfe": "LFE",
      "fairlightAudio.surround.speakers.leftSurround": "Left Surround",
      "fairlightAudio.surround.speakers.rightSurround": "Right Surround",
      "fairlightAudio.surround.speakers.leftRear": "Left Rear",
      "fairlightAudio.surround.speakers.rightRear": "Right Rear",
      "fairlightAudio.surround.channels.L": "L",
      "fairlightAudio.surround.channels.R": "R",
      "fairlightAudio.surround.channels.C": "C",
      "fairlightAudio.surround.channels.LFE": "LFE",
      "fairlightAudio.surround.channels.LS": "LS",
      "fairlightAudio.surround.channels.RS": "RS",
      "fairlightAudio.surround.channels.LR": "LR",
      "fairlightAudio.surround.channels.RR": "RR",
    }

    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: any) => {
        let translation = translations[key] || key
        if (options && typeof options === "object") {
          // Simple interpolation for tests
          Object.keys(options).forEach((optionKey) => {
            translation = translation.replace(`{{${optionKey}}}`, options[optionKey])
          })
        }
        return translation
      },
      i18n: { language: "en" } as any,
      ready: true,
    })
  })

  describe("rendering", () => {
    it("renders stereo format correctly", () => {
      const { getByText } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="t3o4jz:"
        />,
      )

      expect(getByText("STEREO Surround Panner")).toBeInTheDocument()
      expect(getByText("Left")).toBeInTheDocument()
      expect(getByText("Right")).toBeInTheDocument()
      expect(getByText("Position: X:50% Y:50%")).toBeInTheDocument()
    })

    it("renders 5.1 format with all speakers", () => {
      const { getByText } = renderWithProviders(
        <SurroundPanner
          format="5.1"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="o0hywh5"
        />,
      )

      expect(getByText("5.1 Surround Panner")).toBeInTheDocument()
      expect(getByText("Left")).toBeInTheDocument()
      expect(getByText("Right")).toBeInTheDocument()
      expect(getByText("Center")).toBeInTheDocument()
      expect(getByText("LFE")).toBeInTheDocument()
      expect(getByText("Left Surround")).toBeInTheDocument()
      expect(getByText("Right Surround")).toBeInTheDocument()
    })

    it("renders 7.1 format with all speakers", () => {
      const { getByText } = renderWithProviders(
        <SurroundPanner
          format="7.1"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="lbsu4zd"
        />,
      )

      expect(getByText("7.1 Surround Panner")).toBeInTheDocument()
      expect(getByText("Left")).toBeInTheDocument()
      expect(getByText("Right")).toBeInTheDocument()
      expect(getByText("Center")).toBeInTheDocument()
      expect(getByText("LFE")).toBeInTheDocument()
      expect(getByText("Left Surround")).toBeInTheDocument()
      expect(getByText("Right Surround")).toBeInTheDocument()
      expect(getByText("Left Rear")).toBeInTheDocument()
      expect(getByText("Right Rear")).toBeInTheDocument()
    })

    it("displays position values correctly", () => {
      const { getByText } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 25.5, y: 75.3 }}
          onPositionChange={mockOnPositionChange}
          data-oid="1qwr2_5"
        />,
      )

      // The component rounds values, so we expect X:26% Y:75%
      expect(getByText("Position: X:26% Y:75%")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          className="custom-class"
          data-oid="kamu-kp"
        />,
      )

      // Find the root div with the custom class
      const rootDiv = container.querySelector(".custom-class")
      expect(rootDiv).toBeInTheDocument()
      expect(rootDiv).toHaveClass("bg-muted")
    })
  })

  describe("interaction", () => {
    it("calls onPositionChange when clicking on panning field", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="pyw5o36"
        />,
      )

      const panningField = container.querySelector(".cursor-crosshair")!
      const rect = { left: 0, top: 0, width: 100, height: 100 }

      // Mock getBoundingClientRect
      vi.spyOn(panningField, "getBoundingClientRect").mockReturnValue({
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => {},
      } as DOMRect)

      fireEvent.mouseDown(panningField)
      fireEvent.mouseMove(panningField, { clientX: 25, clientY: 75 })

      expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 25, y: 75 })
    })

    it("handles drag interaction correctly", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="aq6vo4b"
        />,
      )

      const panningField = container.querySelector(".cursor-crosshair")!
      const rect = { left: 0, top: 0, width: 100, height: 100 }

      vi.spyOn(panningField, "getBoundingClientRect").mockReturnValue({
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => {},
      } as DOMRect)

      // Start drag
      fireEvent.mouseDown(panningField)

      // Move multiple times
      fireEvent.mouseMove(panningField, { clientX: 25, clientY: 75 })
      fireEvent.mouseMove(panningField, { clientX: 50, clientY: 50 })
      fireEvent.mouseMove(panningField, { clientX: 75, clientY: 25 })

      // End drag
      fireEvent.mouseUp(panningField)

      // Should have been called 3 times during drag
      expect(mockOnPositionChange).toHaveBeenCalledTimes(3)
      expect(mockOnPositionChange).toHaveBeenNthCalledWith(1, { x: 25, y: 75 })
      expect(mockOnPositionChange).toHaveBeenNthCalledWith(2, { x: 50, y: 50 })
      expect(mockOnPositionChange).toHaveBeenNthCalledWith(3, { x: 75, y: 25 })

      // Moving after mouseUp should not trigger callback
      fireEvent.mouseMove(panningField, { clientX: 90, clientY: 90 })
      expect(mockOnPositionChange).toHaveBeenCalledTimes(3)
    })

    it("clamps position values to valid range", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="iax8rdc"
        />,
      )

      const panningField = container.querySelector(".cursor-crosshair")!
      const rect = { left: 0, top: 0, width: 100, height: 100 }

      vi.spyOn(panningField, "getBoundingClientRect").mockReturnValue({
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => {},
      } as DOMRect)

      fireEvent.mouseDown(panningField)

      // Try to move outside bounds
      fireEvent.mouseMove(panningField, { clientX: -50, clientY: -50 })
      expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: 0 })

      fireEvent.mouseMove(panningField, { clientX: 150, clientY: 150 })
      expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 100, y: 100 })
    })

    it("stops drag on mouse leave", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="potl48i"
        />,
      )

      const panningField = container.querySelector(".cursor-crosshair")!
      const rect = { left: 0, top: 0, width: 100, height: 100 }

      vi.spyOn(panningField, "getBoundingClientRect").mockReturnValue({
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        x: rect.left,
        y: rect.top,
        toJSON: () => {},
      } as DOMRect)

      fireEvent.mouseDown(panningField)
      fireEvent.mouseMove(panningField, { clientX: 25, clientY: 25 })
      expect(mockOnPositionChange).toHaveBeenCalledTimes(1)

      // Mouse leave should stop drag
      fireEvent.mouseLeave(panningField)

      // Further moves should not trigger callback
      fireEvent.mouseMove(panningField, { clientX: 75, clientY: 75 })
      expect(mockOnPositionChange).toHaveBeenCalledTimes(1)
    })
  })

  describe("speaker visualization", () => {
    it("highlights speakers based on proximity to source", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 10, y: 50 }} // Much closer to left speaker
          onPositionChange={mockOnPositionChange}
          data-oid="z0_d2b."
        />,
      )

      const speakers = container.querySelectorAll(".rounded-full")
      // Find the speaker indicators (not the source position or center reference)
      const speakerIndicators = Array.from(speakers).filter((el) => {
        const parent = el.parentElement
        const hasTextChild = parent?.querySelector(".text-xs")
        const textContent = hasTextChild?.textContent
        return textContent && textContent !== "Source" && el.classList.contains("border-2")
      })

      // Left speaker should be highlighted (closer to x:10)
      const leftSpeaker = speakerIndicators[0]
      expect(leftSpeaker).toHaveClass("bg-primary")
      expect(leftSpeaker).toHaveClass("border-primary")

      // Right speaker should be much less highlighted (farther from x:10)
      const rightSpeaker = speakerIndicators[1]
      expect(rightSpeaker).toHaveClass("bg-primary/50")
      expect(rightSpeaker).toHaveClass("border-primary")
    })

    it("shows source position indicator", () => {
      const { getByText } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="qpqmfxj"
        />,
      )

      expect(getByText("Source")).toBeInTheDocument()
    })

    it("scales source indicator when dragging", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid=":v4-prk"
        />,
      )

      const panningField = container.querySelector(".cursor-crosshair")!

      // Find the source indicator by looking for the parent div that contains "Source" text
      const sourceContainer = Array.from(container.querySelectorAll(".absolute")).find(
        (el) => el.querySelector(".text-xs")?.textContent === "Source",
      )
      const sourceIndicator = sourceContainer?.querySelector(".rounded-full")

      // Before drag
      expect(sourceIndicator).toBeDefined()
      expect(sourceIndicator).not.toHaveClass("scale-125")

      // Start drag
      fireEvent.mouseDown(panningField)

      // During drag - source should scale up
      const updatedSourceContainer = Array.from(container.querySelectorAll(".absolute")).find(
        (el) => el.querySelector(".text-xs")?.textContent === "Source",
      )
      const updatedSourceIndicator = updatedSourceContainer?.querySelector(".rounded-full")

      expect(updatedSourceIndicator).toHaveClass("scale-125")
    })
  })

  describe("channel levels", () => {
    it("displays correct dB levels for each channel", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 30, y: 50 }} // Closer to left speaker
          onPositionChange={mockOnPositionChange}
          data-oid=".p4u5z9"
        />,
      )

      const channelLevels = container.querySelectorAll(".grid.grid-cols-2 > div")

      // Left channel should have higher level (closer)
      const leftLevel = channelLevels[0]
      expect(leftLevel.textContent).toContain("L:")
      expect(leftLevel.textContent).not.toContain("-∞")

      // Right channel should have lower level (farther)
      const rightLevel = channelLevels[1]
      expect(rightLevel.textContent).toContain("R:")
    })

    it("shows -∞ for channels with zero level", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="5.1"
          position={{ x: 0, y: 0 }} // Far corner, some channels should be silent
          onPositionChange={mockOnPositionChange}
          data-oid="1jnc-sj"
        />,
      )

      const channelLevels = container.querySelectorAll(".grid.grid-cols-2 > div")

      // At least some channels should show -∞
      const infinityLevels = Array.from(channelLevels).filter((el) => el.textContent?.includes("-∞"))
      expect(infinityLevels.length).toBeGreaterThan(0)
    })

    it("shows level bars for each channel", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="1n4_t:o"
        />,
      )

      const levelBars = container.querySelectorAll(".h-1 .bg-primary.transition-all")
      expect(levelBars.length).toBe(2) // One for each channel in stereo
    })
  })

  describe("reference elements", () => {
    it("shows center reference dot", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="w:e07vy"
        />,
      )

      const centerDot = container.querySelector(".w-1.h-1.bg-muted-foreground.rounded-full")
      expect(centerDot).toBeInTheDocument()
    })

    it("shows distance rings", () => {
      const { container } = renderWithProviders(
        <SurroundPanner
          format="stereo"
          position={{ x: 50, y: 50 }}
          onPositionChange={mockOnPositionChange}
          data-oid="tfbz.0r"
        />,
      )

      const rings = container.querySelectorAll(".border.rounded-full")
      const distanceRings = Array.from(rings).filter(
        (el) =>
          el.classList.contains("border-muted-foreground/20") || el.classList.contains("border-muted-foreground/10"),
      )
      expect(distanceRings.length).toBe(2)
    })
  })
})

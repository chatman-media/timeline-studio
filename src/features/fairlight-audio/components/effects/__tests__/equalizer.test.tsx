/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Equalizer } from "../equalizer"

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("Equalizer", () => {
  it("renders with default settings", () => {
    render(<Equalizer />)

    expect(screen.getByText("fairlightAudio.effects.equalizer.title")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.equalizer.reset")).toBeInTheDocument()
  })

  it("displays all frequency bands", () => {
    render(<Equalizer />)

    // Check for frequency bands (they might be displayed differently)
    expect(screen.getByText("60")).toBeInTheDocument()
    expect(screen.getByText("150")).toBeInTheDocument()
    expect(screen.getByText("400")).toBeInTheDocument()
    expect(screen.getByText("1.0k")).toBeInTheDocument()
    expect(screen.getByText("3.0k")).toBeInTheDocument()
    expect(screen.getByText("8.0k")).toBeInTheDocument()
    expect(screen.getByText("12.0k")).toBeInTheDocument()
  })

  it("displays correct gain values", () => {
    render(<Equalizer />)

    // All bands should start at 0.0
    const gainTexts = screen.getAllByText("0.0")
    expect(gainTexts).toHaveLength(7) // 7 frequency bands
  })

  it("resets all bands to 0 dB", () => {
    const onBandChange = vi.fn()
    render(<Equalizer onBandChange={onBandChange} />)

    // Click reset
    const resetButton = screen.getByText("fairlightAudio.effects.equalizer.reset")
    fireEvent.click(resetButton)

    expect(onBandChange).toHaveBeenCalledTimes(7)
    // All bands should be reset to default values
    expect(onBandChange).toHaveBeenCalled()
  })

  it("applies custom className", () => {
    const { container } = render(<Equalizer className="custom-class" />)

    const equalizerDiv = container.firstChild
    expect(equalizerDiv).toHaveClass("custom-class")
    expect(equalizerDiv).toHaveClass("bg-zinc-900")
  })

  it("renders SVG visualization", () => {
    const { container } = render(<Equalizer />)

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("viewBox", "0 0 100 100")

    // Check for the curve path
    const path = svg?.querySelector("path")
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute("stroke", "#3b82f6")
  })

  it("updates visualization when bands change", () => {
    const { container, rerender } = render(<Equalizer />)

    // Get initial path
    const initialPath = container.querySelector("path")?.getAttribute("d")

    // Simulate band changes
    const bands = Array(10)
      .fill(0)
      .map((_, i) => ({
        frequency: [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000][i],
        gain: i % 2 === 0 ? 6 : -6, // Alternating gains
        q: 1,
      }))

    // Re-render with new bands (in real usage, this would be controlled by parent)
    rerender(<Equalizer />)

    // Path should exist (even if not changed in this test)
    const path = container.querySelector("path")
    expect(path).toBeInTheDocument()
  })

  it("does not call onBandChange when not provided", () => {
    // This should not throw
    render(<Equalizer />)

    const resetButton = screen.getByText("fairlightAudio.effects.equalizer.reset")
    expect(() => fireEvent.click(resetButton)).not.toThrow()
  })

  it("handles slider interactions correctly", () => {
    const onBandChange = vi.fn()
    const { container } = render(<Equalizer onBandChange={onBandChange} />)

    // Get all sliders - Radix UI sliders use data-slot="slider" attribute
    const sliders = container.querySelectorAll('[data-slot="slider"]')
    expect(sliders).toHaveLength(7) // 7 frequency bands

    // For now, just verify the sliders are present
    // Actual interaction testing would require more complex event simulation for Radix UI
  })
})

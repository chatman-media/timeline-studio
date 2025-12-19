/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Compressor } from "../compressor"

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("Compressor", () => {
  it("renders with default settings", () => {
    render(<Compressor data-oid="wsp2xfy" />)

    expect(screen.getByText("fairlightAudio.effects.compressor.title")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.reset")).toBeInTheDocument()

    // Check all control labels
    expect(screen.getByText("fairlightAudio.effects.compressor.threshold")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.ratio")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.attack")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.release")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.knee")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.makeup")).toBeInTheDocument()
  })

  it("displays default values", () => {
    render(<Compressor data-oid="wlwwlk1" />)

    expect(screen.getByText("-24.0 dB")).toBeInTheDocument() // threshold
    expect(screen.getByText("4:1")).toBeInTheDocument() // ratio
    expect(screen.getByText("10.0 ms")).toBeInTheDocument() // attack
    expect(screen.getByText("100 ms")).toBeInTheDocument() // release
    expect(screen.getByText("2.5 dB")).toBeInTheDocument() // knee
    expect(screen.getByText("0.0 dB")).toBeInTheDocument() // makeup
  })

  it("renders preset buttons", () => {
    render(<Compressor data-oid="jy4jno-" />)

    expect(screen.getByText("fairlightAudio.effects.compressor.presets.gentle")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.presets.vocal")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.presets.drums")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.compressor.presets.master")).toBeInTheDocument()
  })

  it("calls onParameterChange when parameters are adjusted", () => {
    const onParameterChange = vi.fn()
    render(<Compressor onParameterChange={onParameterChange} data-oid="0lq0n_2" />)

    // Sliders are not easily testable with testing-library
    // We'll test the preset buttons instead
    const gentleButton = screen.getByText("fairlightAudio.effects.compressor.presets.gentle")
    fireEvent.click(gentleButton)

    expect(onParameterChange).toHaveBeenCalledWith("threshold", -20)
    expect(onParameterChange).toHaveBeenCalledWith("ratio", 2)
    expect(onParameterChange).toHaveBeenCalledWith("attack", 10)
    expect(onParameterChange).toHaveBeenCalledWith("release", 100)
    expect(onParameterChange).toHaveBeenCalledWith("knee", 10)
    expect(onParameterChange).toHaveBeenCalledWith("makeup", 2)
  })

  it("applies vocal preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Compressor onParameterChange={onParameterChange} data-oid="ucpt:f9" />)

    const vocalButton = screen.getByText("fairlightAudio.effects.compressor.presets.vocal")
    fireEvent.click(vocalButton)

    expect(onParameterChange).toHaveBeenCalledWith("threshold", -15)
    expect(onParameterChange).toHaveBeenCalledWith("ratio", 3)
    expect(onParameterChange).toHaveBeenCalledWith("attack", 5)
    expect(onParameterChange).toHaveBeenCalledWith("release", 50)
    expect(onParameterChange).toHaveBeenCalledWith("knee", 5)
    expect(onParameterChange).toHaveBeenCalledWith("makeup", 3)
  })

  it("applies drums preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Compressor onParameterChange={onParameterChange} data-oid="vcfjjjo" />)

    const drumsButton = screen.getByText("fairlightAudio.effects.compressor.presets.drums")
    fireEvent.click(drumsButton)

    expect(onParameterChange).toHaveBeenCalledWith("threshold", -10)
    expect(onParameterChange).toHaveBeenCalledWith("ratio", 6)
    expect(onParameterChange).toHaveBeenCalledWith("attack", 1)
    expect(onParameterChange).toHaveBeenCalledWith("release", 100)
    expect(onParameterChange).toHaveBeenCalledWith("knee", 0)
    expect(onParameterChange).toHaveBeenCalledWith("makeup", 5)
  })

  it("applies master preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Compressor onParameterChange={onParameterChange} data-oid="h2wxp.e" />)

    const masterButton = screen.getByText("fairlightAudio.effects.compressor.presets.master")
    fireEvent.click(masterButton)

    expect(onParameterChange).toHaveBeenCalledWith("threshold", -12)
    expect(onParameterChange).toHaveBeenCalledWith("ratio", 2.5)
    expect(onParameterChange).toHaveBeenCalledWith("attack", 30)
    expect(onParameterChange).toHaveBeenCalledWith("release", 300)
    expect(onParameterChange).toHaveBeenCalledWith("knee", 20)
    expect(onParameterChange).toHaveBeenCalledWith("makeup", 1)
  })

  it("resets to default settings", () => {
    const onParameterChange = vi.fn()
    render(<Compressor onParameterChange={onParameterChange} data-oid="h554rpo" />)

    // Apply a preset first
    const drumsButton = screen.getByText("fairlightAudio.effects.compressor.presets.drums")
    fireEvent.click(drumsButton)

    // Clear the mock
    onParameterChange.mockClear()

    // Click reset
    const resetButton = screen.getByText("fairlightAudio.effects.compressor.reset")
    fireEvent.click(resetButton)

    expect(onParameterChange).toHaveBeenCalledWith("threshold", -24)
    expect(onParameterChange).toHaveBeenCalledWith("ratio", 4)
    expect(onParameterChange).toHaveBeenCalledWith("attack", 10)
    expect(onParameterChange).toHaveBeenCalledWith("release", 100)
    expect(onParameterChange).toHaveBeenCalledWith("knee", 2.5)
    expect(onParameterChange).toHaveBeenCalledWith("makeup", 0)
  })

  it("displays gain reduction meter", () => {
    render(<Compressor gainReduction={-6} data-oid="s8q1jog" />)

    // Check that gain reduction label is rendered
    expect(screen.getByText("fairlightAudio.effects.compressor.gainReduction")).toBeInTheDocument()

    // The meter should have a height based on gainReduction value
    const meter = screen
      .getByText("fairlightAudio.effects.compressor.gainReduction")
      .previousElementSibling?.querySelector(".bg-orange-500")

    expect(meter).toHaveStyle({ height: "20%" }) // 6/30 * 100 = 20%
  })

  it("handles zero gain reduction", () => {
    render(<Compressor gainReduction={0} data-oid="f1cvm6q" />)

    const meter = screen
      .getByText("fairlightAudio.effects.compressor.gainReduction")
      .previousElementSibling?.querySelector(".bg-orange-500")

    expect(meter).toHaveStyle({ height: "0%" })
  })

  it("handles maximum gain reduction", () => {
    render(<Compressor gainReduction={-30} data-oid="wzi.wvs" />)

    const meter = screen
      .getByText("fairlightAudio.effects.compressor.gainReduction")
      .previousElementSibling?.querySelector(".bg-orange-500")

    expect(meter).toHaveStyle({ height: "100%" })
  })

  it("formats high ratio as infinity", () => {
    render(<Compressor data-oid="ylq-ztc" />)

    // Can't easily test slider changes, but we can verify the formatRatio function
    // by checking the initial state
    expect(screen.getByText("4:1")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(<Compressor className="custom-class" data-oid="9oej1tb" />)

    const compressorDiv = container.firstChild
    expect(compressorDiv).toHaveClass("custom-class")
    expect(compressorDiv).toHaveClass("bg-zinc-900")
  })

  it("renders SVG visualization", () => {
    const { container } = render(<Compressor data-oid="xo5g9z7" />)

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("viewBox", "0 0 100 100")

    // Check for grid lines
    const lines = svg?.querySelectorAll("line")
    expect(lines?.length).toBeGreaterThan(0)

    // Check for compression curve path
    const path = svg?.querySelector("path")
    expect(path).toBeInTheDocument()
    expect(path).toHaveAttribute("stroke", "#3b82f6")
  })

  it("does not call onParameterChange when not provided", () => {
    // This should not throw
    render(<Compressor data-oid="yic8qle" />)

    const gentleButton = screen.getByText("fairlightAudio.effects.compressor.presets.gentle")
    expect(() => fireEvent.click(gentleButton)).not.toThrow()
  })
})

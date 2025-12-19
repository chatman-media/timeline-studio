/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Reverb } from "../reverb"

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("Reverb", () => {
  it("renders with default settings", () => {
    render(<Reverb data-oid="i9zcy:c" />)

    expect(screen.getByText("fairlightAudio.effects.reverb.title")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.reset")).toBeInTheDocument()

    // Check all control labels
    expect(screen.getByText("fairlightAudio.effects.reverb.roomSize")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.decay")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.damping")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.wet")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.dry")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.preDelay")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.early")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.late")).toBeInTheDocument()
  })

  it("displays default values", () => {
    render(<Reverb data-oid="0yy1mnb" />)

    // Room size and damping both have default value of 50%
    const fiftyPercents = screen.getAllByText("50%")
    expect(fiftyPercents).toHaveLength(2)

    expect(screen.getByText("2.0s")).toBeInTheDocument() // decay
    expect(screen.getByText("30%")).toBeInTheDocument() // wet
    expect(screen.getByText("70%")).toBeInTheDocument() // dry

    // Pre-delay appears twice (in SVG and in the control)
    const preDelays = screen.getAllByText("20ms")
    expect(preDelays).toHaveLength(2)

    // Early and late reflections both have default value of 80%
    const eightyPercents = screen.getAllByText("80%")
    expect(eightyPercents).toHaveLength(2)
  })

  it("renders preset buttons", () => {
    render(<Reverb data-oid="j.po.zd" />)

    expect(screen.getByText("fairlightAudio.effects.reverb.presets.room")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.presets.hall")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.presets.plate")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.presets.spring")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effects.reverb.presets.cathedral")).toBeInTheDocument()
  })

  it("calls onParameterChange when parameters are adjusted", () => {
    const onParameterChange = vi.fn()
    render(<Reverb onParameterChange={onParameterChange} data-oid="eskv2y8" />)

    // Click room preset
    const roomButton = screen.getByText("fairlightAudio.effects.reverb.presets.room")
    fireEvent.click(roomButton)

    expect(onParameterChange).toHaveBeenCalledWith("roomSize", 30)
    expect(onParameterChange).toHaveBeenCalledWith("decay", 0.8)
    expect(onParameterChange).toHaveBeenCalledWith("damping", 70)
    expect(onParameterChange).toHaveBeenCalledWith("wetLevel", 20)
    expect(onParameterChange).toHaveBeenCalledWith("dryLevel", 80)
    expect(onParameterChange).toHaveBeenCalledWith("predelay", 10)
    expect(onParameterChange).toHaveBeenCalledWith("earlyLevel", 90)
    expect(onParameterChange).toHaveBeenCalledWith("lateLevel", 60)
  })

  it("applies hall preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Reverb onParameterChange={onParameterChange} data-oid="iph7mrf" />)

    const hallButton = screen.getByText("fairlightAudio.effects.reverb.presets.hall")
    fireEvent.click(hallButton)

    expect(onParameterChange).toHaveBeenCalledWith("roomSize", 70)
    expect(onParameterChange).toHaveBeenCalledWith("decay", 2.5)
    expect(onParameterChange).toHaveBeenCalledWith("damping", 50)
    expect(onParameterChange).toHaveBeenCalledWith("wetLevel", 35)
    expect(onParameterChange).toHaveBeenCalledWith("dryLevel", 65)
    expect(onParameterChange).toHaveBeenCalledWith("predelay", 25)
    expect(onParameterChange).toHaveBeenCalledWith("earlyLevel", 70)
    expect(onParameterChange).toHaveBeenCalledWith("lateLevel", 90)
  })

  it("applies cathedral preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Reverb onParameterChange={onParameterChange} data-oid="36ufono" />)

    const cathedralButton = screen.getByText("fairlightAudio.effects.reverb.presets.cathedral")
    fireEvent.click(cathedralButton)

    expect(onParameterChange).toHaveBeenCalledWith("roomSize", 100)
    expect(onParameterChange).toHaveBeenCalledWith("decay", 6)
    expect(onParameterChange).toHaveBeenCalledWith("damping", 40)
    expect(onParameterChange).toHaveBeenCalledWith("wetLevel", 45)
    expect(onParameterChange).toHaveBeenCalledWith("dryLevel", 55)
    expect(onParameterChange).toHaveBeenCalledWith("predelay", 50)
    expect(onParameterChange).toHaveBeenCalledWith("earlyLevel", 60)
    expect(onParameterChange).toHaveBeenCalledWith("lateLevel", 100)
  })

  it("applies plate preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Reverb onParameterChange={onParameterChange} data-oid="lqecwq:" />)

    const plateButton = screen.getByText("fairlightAudio.effects.reverb.presets.plate")
    fireEvent.click(plateButton)

    expect(onParameterChange).toHaveBeenCalledWith("roomSize", 50)
    expect(onParameterChange).toHaveBeenCalledWith("decay", 1.5)
    expect(onParameterChange).toHaveBeenCalledWith("damping", 80)
    expect(onParameterChange).toHaveBeenCalledWith("wetLevel", 40)
    expect(onParameterChange).toHaveBeenCalledWith("dryLevel", 60)
    expect(onParameterChange).toHaveBeenCalledWith("predelay", 0)
    expect(onParameterChange).toHaveBeenCalledWith("earlyLevel", 50)
    expect(onParameterChange).toHaveBeenCalledWith("lateLevel", 100)
  })

  it("applies spring preset correctly", () => {
    const onParameterChange = vi.fn()
    render(<Reverb onParameterChange={onParameterChange} data-oid="e4o_vhy" />)

    const springButton = screen.getByText("fairlightAudio.effects.reverb.presets.spring")
    fireEvent.click(springButton)

    expect(onParameterChange).toHaveBeenCalledWith("roomSize", 20)
    expect(onParameterChange).toHaveBeenCalledWith("decay", 2)
    expect(onParameterChange).toHaveBeenCalledWith("damping", 30)
    expect(onParameterChange).toHaveBeenCalledWith("wetLevel", 30)
    expect(onParameterChange).toHaveBeenCalledWith("dryLevel", 70)
    expect(onParameterChange).toHaveBeenCalledWith("predelay", 0)
    expect(onParameterChange).toHaveBeenCalledWith("earlyLevel", 100)
    expect(onParameterChange).toHaveBeenCalledWith("lateLevel", 80)
  })

  it("resets to default settings", () => {
    const onParameterChange = vi.fn()
    render(<Reverb onParameterChange={onParameterChange} data-oid="c8swdck" />)

    // Apply a preset first
    const hallButton = screen.getByText("fairlightAudio.effects.reverb.presets.hall")
    fireEvent.click(hallButton)

    // Clear the mock
    onParameterChange.mockClear()

    // Click reset
    const resetButton = screen.getByText("fairlightAudio.effects.reverb.reset")
    fireEvent.click(resetButton)

    expect(onParameterChange).toHaveBeenCalledWith("roomSize", 50)
    expect(onParameterChange).toHaveBeenCalledWith("decay", 2)
    expect(onParameterChange).toHaveBeenCalledWith("damping", 50)
    expect(onParameterChange).toHaveBeenCalledWith("wetLevel", 30)
    expect(onParameterChange).toHaveBeenCalledWith("dryLevel", 70)
    expect(onParameterChange).toHaveBeenCalledWith("predelay", 20)
    expect(onParameterChange).toHaveBeenCalledWith("earlyLevel", 80)
    expect(onParameterChange).toHaveBeenCalledWith("lateLevel", 80)
  })

  it("applies custom className", () => {
    const { container } = render(<Reverb className="custom-class" data-oid="h6wa.4f" />)

    const reverbDiv = container.firstChild
    expect(reverbDiv).toHaveClass("custom-class")
    expect(reverbDiv).toHaveClass("bg-zinc-900")
  })

  it("does not call onParameterChange when not provided", () => {
    // This should not throw
    render(<Reverb data-oid="ze-0eq3" />)

    const roomButton = screen.getByText("fairlightAudio.effects.reverb.presets.room")
    expect(() => fireEvent.click(roomButton)).not.toThrow()
  })

  it("formats decay time with decimal", () => {
    render(<Reverb data-oid="1a4zp81" />)

    // Default decay is 2s, should show with decimal
    expect(screen.getByText("2.0s")).toBeInTheDocument()
  })

  it("formats pre-delay time correctly", () => {
    render(<Reverb data-oid="l-8pg4w" />)

    // Default pre-delay is 20ms (appears twice - in SVG and in control)
    const preDelays = screen.getAllByText("20ms")
    expect(preDelays).toHaveLength(2)
  })

  it("shows all slider controls", () => {
    const { container } = render(<Reverb data-oid="o_f:j0v" />)

    // Should have 8 sliders: roomSize, decay, damping, predelay, dryLevel, wetLevel, earlyLevel, lateLevel
    // Radix UI sliders use data-slot="slider" attribute
    const sliders = container.querySelectorAll('[data-slot="slider"]')
    expect(sliders).toHaveLength(8)
  })
})

/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EffectsRack } from "../effects-rack"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("../compressor", () => ({
  Compressor: ({ onParameterChange, gainReduction }: any) => (
    <div data-testid="compressor">
      Compressor (gain: {gainReduction || 0})
      <button onClick={() => onParameterChange?.("threshold", -20)}>Change Threshold</button>
    </div>
  ),
}))

vi.mock("../equalizer", () => ({
  Equalizer: ({ onBandChange }: any) => (
    <div data-testid="equalizer">
      Equalizer
      <button onClick={() => onBandChange?.(0, { gain: 5 })}>Change Band</button>
    </div>
  ),
}))

vi.mock("../reverb", () => ({
  Reverb: ({ onParameterChange }: any) => (
    <div data-testid="reverb">
      Reverb
      <button onClick={() => onParameterChange?.("roomSize", 80)}>Change Room Size</button>
    </div>
  ),
}))

describe("EffectsRack", () => {
  it("renders with title and add button", () => {
    render(<EffectsRack channelId="ch1" />)

    expect(screen.getByText("fairlightAudio.effectsRack.title")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effectsRack.addEffect")).toBeInTheDocument()
  })

  it("shows effect menu when add button is clicked", () => {
    render(<EffectsRack channelId="ch1" />)

    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)

    expect(screen.getByText("fairlightAudio.effectsRack.effects.eq")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effectsRack.effects.compressor")).toBeInTheDocument()
    expect(screen.getByText("fairlightAudio.effectsRack.effects.reverb")).toBeInTheDocument()
  })

  it("hides menu when clicking outside", () => {
    render(<EffectsRack channelId="ch1" />)

    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)

    expect(screen.getByText("fairlightAudio.effectsRack.effects.eq")).toBeInTheDocument()

    // Click on the backdrop
    const backdrop = document.querySelector(".fixed.inset-0")
    fireEvent.click(backdrop!)

    expect(screen.queryByText("fairlightAudio.effectsRack.effects.eq")).not.toBeInTheDocument()
  })

  it("adds equalizer effect", () => {
    const onEffectAdd = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectAdd={onEffectAdd} />)

    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)

    const eqButton = screen.getByText("fairlightAudio.effectsRack.effects.eq")
    fireEvent.click(eqButton)

    expect(onEffectAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "equalizer",
        enabled: true,
        expanded: true,
      }),
    )

    expect(screen.getByTestId("equalizer")).toBeInTheDocument()
  })

  it("adds compressor effect", () => {
    const onEffectAdd = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectAdd={onEffectAdd} />)

    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)

    const compressorButton = screen.getByText("fairlightAudio.effectsRack.effects.compressor")
    fireEvent.click(compressorButton)

    expect(onEffectAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "compressor",
        enabled: true,
        expanded: true,
      }),
    )

    expect(screen.getByTestId("compressor")).toBeInTheDocument()
  })

  it("adds reverb effect", () => {
    const onEffectAdd = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectAdd={onEffectAdd} />)

    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)

    const reverbButton = screen.getByText("fairlightAudio.effectsRack.effects.reverb")
    fireEvent.click(reverbButton)

    expect(onEffectAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "reverb",
        enabled: true,
        expanded: true,
      }),
    )

    expect(screen.getByTestId("reverb")).toBeInTheDocument()
  })

  it("toggles effect enabled state", () => {
    const onEffectToggle = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectToggle={onEffectToggle} />)

    // Add an effect first
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    // Find and click power button using data-testid
    const powerIcon = screen.getByTestId("power-icon")
    const powerButton = powerIcon.parentElement
    fireEvent.click(powerButton!)

    expect(onEffectToggle).toHaveBeenCalledWith(expect.any(String), false)
  })

  it("removes effect", () => {
    const onEffectRemove = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectRemove={onEffectRemove} />)

    // Add an effect first
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    // Find and click remove button using data-testid
    const xIcon = screen.getByTestId("x-icon")
    const removeButton = xIcon.parentElement
    fireEvent.click(removeButton!)

    expect(onEffectRemove).toHaveBeenCalledWith(expect.any(String))
    expect(screen.queryByTestId("compressor")).not.toBeInTheDocument()
  })

  it("toggles effect expanded state", () => {
    render(<EffectsRack channelId="ch1" />)

    // Add an effect
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    expect(screen.getByTestId("compressor")).toBeInTheDocument()

    // Find and click chevron button using data-testid
    const chevronDownIcon = screen.getByTestId("chevrondown-icon")
    const chevronButton = chevronDownIcon.parentElement
    fireEvent.click(chevronButton!)

    // Content should be hidden
    expect(screen.queryByTestId("compressor")).not.toBeInTheDocument()

    // Click again to expand
    const chevronRightIcon = screen.getByTestId("chevronright-icon")
    const chevronRightButton = chevronRightIcon.parentElement
    fireEvent.click(chevronRightButton!)

    expect(screen.getByTestId("compressor")).toBeInTheDocument()
  })

  it("calls onEffectParameterChange for equalizer", () => {
    const onEffectParameterChange = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectParameterChange={onEffectParameterChange} />)

    // Add equalizer
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.eq"))

    // Change band
    const changeBandButton = screen.getByText("Change Band")
    fireEvent.click(changeBandButton)

    expect(onEffectParameterChange).toHaveBeenCalledWith(expect.any(String), "band-0", 5)
  })

  it("calls onEffectParameterChange for compressor", () => {
    const onEffectParameterChange = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectParameterChange={onEffectParameterChange} />)

    // Add compressor
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    // Change threshold
    const changeThresholdButton = screen.getByText("Change Threshold")
    fireEvent.click(changeThresholdButton)

    expect(onEffectParameterChange).toHaveBeenCalledWith(expect.any(String), "threshold", -20)
  })

  it("calls onEffectParameterChange for reverb", () => {
    const onEffectParameterChange = vi.fn()
    render(<EffectsRack channelId="ch1" onEffectParameterChange={onEffectParameterChange} />)

    // Add reverb
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.reverb"))

    // Change room size
    const changeRoomSizeButton = screen.getByText("Change Room Size")
    fireEvent.click(changeRoomSizeButton)

    expect(onEffectParameterChange).toHaveBeenCalledWith(expect.any(String), "roomSize", 80)
  })

  it("displays gain reduction for compressor", () => {
    const getCompressorGainReduction = vi.fn().mockReturnValue(-6)
    render(<EffectsRack channelId="ch1" getCompressorGainReduction={getCompressorGainReduction} />)

    // Add compressor
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    // Should display gain reduction value
    expect(screen.getByText("Compressor (gain: -6)")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(<EffectsRack channelId="ch1" className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
    expect(container.firstChild).toHaveClass("space-y-2")
  })

  it("displays multiple effects", () => {
    render(<EffectsRack channelId="ch1" />)

    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")

    // Add multiple effects
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.eq"))

    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.reverb"))

    expect(screen.getByTestId("equalizer")).toBeInTheDocument()
    expect(screen.getByTestId("compressor")).toBeInTheDocument()
    expect(screen.getByTestId("reverb")).toBeInTheDocument()
  })

  it("applies opacity when effect is disabled", () => {
    render(<EffectsRack channelId="ch1" />)

    // Add an effect
    const addButton = screen.getByText("fairlightAudio.effectsRack.addEffect")
    fireEvent.click(addButton)
    fireEvent.click(screen.getByText("fairlightAudio.effectsRack.effects.compressor"))

    // Find the effect container
    const effectContainer = screen.getByTestId("compressor").closest(".bg-zinc-800")
    expect(effectContainer).not.toHaveClass("opacity-50")

    // Toggle power using data-testid
    const powerIcon = screen.getByTestId("power-icon")
    const powerButton = powerIcon.parentElement
    fireEvent.click(powerButton!)

    expect(effectContainer).toHaveClass("opacity-50")
  })
})

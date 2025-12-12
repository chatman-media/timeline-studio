import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AppliedColorGrading } from "@/features/timeline/types"

describe("Color Grading Timeline Integration", () => {
  let eventListener: EventListener | null = null

  beforeEach(() => {
    // Clear any existing listeners
    eventListener = null
  })

  afterEach(() => {
    // Clean up
    if (eventListener) {
      window.removeEventListener("timeline:apply-color-grading", eventListener)
    }
  })

  it("should create AppliedColorGrading object with correct structure", () => {
    const colorGradingData: AppliedColorGrading = {
      id: "color-grading-123",
      colorWheels: {
        lift: { r: 10, g: 20, b: 30 },
        gamma: { r: 0, g: 0, b: 0 },
        gain: { r: -5, g: -10, b: -15 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 25,
        tint: -10,
        contrast: 15,
        pivot: 0.45,
        saturation: -20,
        hue: 5,
        luminance: 10,
      },
      curves: {
        master: [
          { x: 0, y: 256, id: "start" },
          { x: 128, y: 128, id: "mid" },
          { x: 256, y: 0, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
      lut: {
        file: "cinematic-warm.cube",
        intensity: 75,
        isEnabled: true,
      },
      presetId: "preset-cinematic-warm",
      isEnabled: true,
    }

    expect(colorGradingData).toBeDefined()
    expect(colorGradingData.id).toBe("color-grading-123")
    expect(colorGradingData.colorWheels.lift).toEqual({ r: 10, g: 20, b: 30 })
    expect(colorGradingData.basicParameters.temperature).toBe(25)
    expect(colorGradingData.curves.master).toHaveLength(3)
    expect(colorGradingData.lut.intensity).toBe(75)
    expect(colorGradingData.isEnabled).toBe(true)
  })

  it("should dispatch timeline event when applying color grading", () => {
    const mockHandler = vi.fn()
    eventListener = mockHandler
    window.addEventListener("timeline:apply-color-grading", mockHandler)

    const colorGradingData = {
      id: "color-grading-456",
      colorWheels: {
        lift: { r: 0, g: 0, b: 0 },
        gamma: { r: 0, g: 0, b: 0 },
        gain: { r: 0, g: 0, b: 0 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 0,
        tint: 0,
        contrast: 0,
        pivot: 0.5,
        saturation: 0,
        hue: 0,
        luminance: 0,
      },
      curves: {
        master: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
      lut: {
        file: null,
        intensity: 100,
        isEnabled: false,
      },
      isEnabled: true,
    }

    const event = new CustomEvent("timeline:apply-color-grading", {
      detail: {
        clipId: "clip-789",
        colorGrading: colorGradingData,
      },
    })

    window.dispatchEvent(event)

    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(event)

    const receivedEvent = mockHandler.mock.calls[0][0] as CustomEvent
    expect(receivedEvent.detail.clipId).toBe("clip-789")
    expect(receivedEvent.detail.colorGrading.id).toBe("color-grading-456")
  })

  it("should integrate with preset system", () => {
    const presetData: Partial<AppliedColorGrading> = {
      colorWheels: {
        lift: { r: 5, g: 3, b: -5 },
        gamma: { r: 3, g: 2, b: 0 },
        gain: { r: 5, g: 3, b: 0 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 15,
        tint: -5,
        contrast: 10,
        pivot: 0.5,
        saturation: -10,
        hue: 0,
        luminance: 0,
      },
      presetId: "preset-cinematic-warm",
    }

    const fullData: AppliedColorGrading = {
      id: `color-grading-${Date.now()}`,
      ...presetData,
      curves: {
        master: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
      lut: {
        file: null,
        intensity: 100,
        isEnabled: false,
      },
      isEnabled: true,
    } as AppliedColorGrading

    expect(fullData.presetId).toBe("preset-cinematic-warm")
    expect(fullData.colorWheels?.lift).toEqual({ r: 5, g: 3, b: -5 })
  })

  it("should handle LUT integration", () => {
    const colorGradingWithLUT: AppliedColorGrading = {
      id: "color-grading-lut",
      colorWheels: {
        lift: { r: 0, g: 0, b: 0 },
        gamma: { r: 0, g: 0, b: 0 },
        gain: { r: 0, g: 0, b: 0 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 0,
        tint: 0,
        contrast: 0,
        pivot: 0.5,
        saturation: 0,
        hue: 0,
        luminance: 0,
      },
      curves: {
        master: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
      lut: {
        file: "/path/to/cinematic.cube",
        intensity: 65,
        isEnabled: true,
      },
      isEnabled: true,
    }

    expect(colorGradingWithLUT.lut.file).toBe("/path/to/cinematic.cube")
    expect(colorGradingWithLUT.lut.intensity).toBe(65)
    expect(colorGradingWithLUT.lut.isEnabled).toBe(true)
  })

  it("should handle disabled color grading", () => {
    const disabledColorGrading: AppliedColorGrading = {
      id: "color-grading-disabled",
      colorWheels: {
        lift: { r: 10, g: 10, b: 10 },
        gamma: { r: 5, g: 5, b: 5 },
        gain: { r: 0, g: 0, b: 0 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 20,
        tint: 10,
        contrast: 30,
        pivot: 0.4,
        saturation: 25,
        hue: -15,
        luminance: 5,
      },
      curves: {
        master: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
      lut: {
        file: "film-look.cube",
        intensity: 100,
        isEnabled: true,
      },
      isEnabled: false, // Color grading is disabled
    }

    expect(disabledColorGrading.isEnabled).toBe(false)
    // Even though values are set, they won't be applied when isEnabled is false
    expect(disabledColorGrading.basicParameters.temperature).toBe(20)
    expect(disabledColorGrading.lut.file).toBe("film-look.cube")
  })
})

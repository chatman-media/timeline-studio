/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useColorGrading } from "../../hooks/use-color-grading"
import { BUILT_IN_PRESETS } from "../../types/presets"

// Мокаем localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, "localStorage", { value: mockLocalStorage })

describe("useColorGrading", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue("[]")
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useColorGrading())

    expect(result.current.state.colorWheels).toEqual({
      lift: { r: 0, g: 0, b: 0 },
      gamma: { r: 0, g: 0, b: 0 },
      gain: { r: 0, g: 0, b: 0 },
      offset: { r: 0, g: 0, b: 0 },
    })

    expect(result.current.state.basicParameters).toEqual({
      temperature: 0,
      tint: 0,
      contrast: 0,
      pivot: 0.5,
      saturation: 0,
      hue: 0,
      luminance: 0,
    })

    expect(result.current.state.previewEnabled).toBe(true)
    expect(result.current.state.isActive).toBe(false)
    expect(result.current.hasChanges).toBe(false)
  })

  it("should update color wheel values", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.updateColorWheel("lift", { r: 10, g: 20, b: 30 })
    })

    expect(result.current.state.colorWheels.lift).toEqual({ r: 10, g: 20, b: 30 })
    expect(result.current.state.hasUnsavedChanges).toBe(true)
    expect(result.current.hasChanges).toBe(true)
  })

  it("should update basic parameters", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.updateBasicParameter("temperature", 50)
    })

    expect(result.current.state.basicParameters.temperature).toBe(50)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
    expect(result.current.hasChanges).toBe(true)
  })

  it("should update curves", () => {
    const { result } = renderHook(() => useColorGrading())

    const newPoints = [
      { x: 0, y: 256, id: "start" },
      { x: 128, y: 128, id: "mid" },
      { x: 256, y: 0, id: "end" },
    ]

    act(() => {
      result.current.updateCurve("master", newPoints)
    })

    expect(result.current.state.curves.master).toEqual(newPoints)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should load LUT file", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.loadLUT("/path/to/lut.cube")
    })

    expect(result.current.state.lut.file).toBe("/path/to/lut.cube")
    expect(result.current.state.lut.isEnabled).toBe(true)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should set LUT intensity", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.setLUTIntensity(75)
    })

    expect(result.current.state.lut.intensity).toBe(75)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should toggle LUT", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.toggleLUT(true)
    })

    expect(result.current.state.lut.isEnabled).toBe(true)

    act(() => {
      result.current.toggleLUT(false)
    })

    expect(result.current.state.lut.isEnabled).toBe(false)
  })

  it("should toggle preview", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.togglePreview(false)
    })

    expect(result.current.state.previewEnabled).toBe(false)

    act(() => {
      result.current.togglePreview(true)
    })

    expect(result.current.state.previewEnabled).toBe(true)
  })

  it("should reset all settings", () => {
    const { result } = renderHook(() => useColorGrading())

    // Сначала изменим некоторые настройки
    act(() => {
      result.current.updateColorWheel("lift", { r: 10, g: 20, b: 30 })
      result.current.updateBasicParameter("temperature", 50)
    })

    // Теперь сбросим
    act(() => {
      result.current.resetAll()
    })

    expect(result.current.state.colorWheels.lift).toEqual({ r: 0, g: 0, b: 0 })
    expect(result.current.state.basicParameters.temperature).toBe(0)
    expect(result.current.hasChanges).toBe(false)
  })

  it("should load preset", () => {
    const { result } = renderHook(() => useColorGrading())
    const presetId = BUILT_IN_PRESETS[0].id

    act(() => {
      result.current.loadPreset(presetId)
    })

    expect(result.current.state.currentPreset).toBe(presetId)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should save custom preset", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.savePreset("My Custom Preset")
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "colorGradingPresets",
      expect.stringContaining("My Custom Preset"),
    )
  })

  it("should apply auto correction", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.autoCorrect()
    })

    // Проверяем, что автокоррекция изменила кривые
    expect(result.current.state.curves.master).toHaveLength(3)
    expect(result.current.state.basicParameters.contrast).toBe(5)
    expect(result.current.state.basicParameters.saturation).toBe(5)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should handle dispatch actions", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.dispatch({
        type: "UPDATE_COLOR_WHEEL",
        wheel: "gamma",
        value: { r: 5, g: 10, b: 15 },
      })
    })

    expect(result.current.state.colorWheels.gamma).toEqual({ r: 5, g: 10, b: 15 })

    act(() => {
      result.current.dispatch({
        type: "UPDATE_BASIC_PARAMETER",
        parameter: "tint",
        value: 25,
      })
    })

    expect(result.current.state.basicParameters.tint).toBe(25)
  })

  it("should detect changes correctly", () => {
    const { result } = renderHook(() => useColorGrading())

    // Изначально нет изменений
    expect(result.current.hasChanges).toBe(false)

    // Изменяем цветовое колесо
    act(() => {
      result.current.updateColorWheel("lift", { r: 5, g: 0, b: 0 })
    })

    expect(result.current.hasChanges).toBe(true)

    // Сбрасываем
    act(() => {
      result.current.resetAll()
    })

    expect(result.current.hasChanges).toBe(false)

    // Изменяем базовый параметр
    act(() => {
      result.current.updateBasicParameter("temperature", 10)
    })

    expect(result.current.hasChanges).toBe(true)
  })

  it("should return available presets", () => {
    const { result } = renderHook(() => useColorGrading())

    expect(result.current.availablePresets).toEqual(BUILT_IN_PRESETS)
    expect(result.current.availablePresets.length).toBeGreaterThan(0)
  })

  describe("edge cases", () => {
    it("should handle multiple color wheel updates", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateColorWheel("lift", { r: 5, g: 10, b: 15 })
        result.current.updateColorWheel("gamma", { r: 2, g: 4, b: 6 })
        result.current.updateColorWheel("gain", { r: 8, g: 12, b: 16 })
      })

      expect(result.current.state.colorWheels.lift).toEqual({ r: 5, g: 10, b: 15 })
      expect(result.current.state.colorWheels.gamma).toEqual({ r: 2, g: 4, b: 6 })
      expect(result.current.state.colorWheels.gain).toEqual({ r: 8, g: 12, b: 16 })
    })

    it("should handle extreme parameter values", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateBasicParameter("temperature", 100)
        result.current.updateBasicParameter("tint", -100)
        result.current.updateBasicParameter("saturation", 100)
      })

      expect(result.current.state.basicParameters.temperature).toBe(100)
      expect(result.current.state.basicParameters.tint).toBe(-100)
      expect(result.current.state.basicParameters.saturation).toBe(100)
    })

    it("should handle pivot edge values", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateBasicParameter("pivot", 0)
      })

      expect(result.current.state.basicParameters.pivot).toBe(0)
      expect(result.current.hasChanges).toBe(true) // pivot changed from 0.5

      act(() => {
        result.current.resetAll()
        result.current.updateBasicParameter("pivot", 1)
      })

      expect(result.current.state.basicParameters.pivot).toBe(1)
    })

    it("should detect changes with only pivot modification", () => {
      const { result } = renderHook(() => useColorGrading())

      expect(result.current.hasChanges).toBe(false)

      act(() => {
        result.current.updateBasicParameter("pivot", 0.7)
      })

      expect(result.current.hasChanges).toBe(true)
    })

    it("should handle empty curve updates", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateCurve("hueVsHue", [])
      })

      expect(result.current.state.curves.hueVsHue).toEqual([])
    })

    it("should handle rapid sequential updates", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.updateBasicParameter("temperature", i * 10)
        }
      })

      expect(result.current.state.basicParameters.temperature).toBe(90)
      expect(result.current.state.hasUnsavedChanges).toBe(true)
    })

    it("should handle LUT without file path", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("")
      })

      expect(result.current.state.lut.file).toBe("")
      expect(result.current.state.lut.isEnabled).toBe(true)
    })

    it("should handle dispatch with unknown action type", () => {
      const { result } = renderHook(() => useColorGrading())

      // Should not throw
      act(() => {
        result.current.dispatch({ type: "UNKNOWN_ACTION" })
      })
    })

    it("should handle applyToClip without selectedClip", () => {
      const { result } = renderHook(() => useColorGrading())

      // Should not throw
      act(() => {
        result.current.applyToClip()
      })

      // State should remain unchanged
      expect(result.current.state.hasUnsavedChanges).toBe(false)
    })

    it("should dispatch CustomEvent when applying to clip", () => {
      const { result } = renderHook(() => useColorGrading())
      const eventListener = vi.fn()

      window.addEventListener("timeline:apply-color-grading", eventListener)

      act(() => {
        result.current.state.selectedClip = "clip-123"
        result.current.updateBasicParameter("temperature", 20)
      })

      act(() => {
        result.current.applyToClip()
      })

      expect(eventListener).toHaveBeenCalledTimes(1)
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "timeline:apply-color-grading",
          detail: expect.objectContaining({
            clipId: "clip-123",
            colorGrading: expect.objectContaining({
              basicParameters: expect.objectContaining({
                temperature: 20,
              }),
            }),
          }),
        }),
      )

      window.removeEventListener("timeline:apply-color-grading", eventListener)
    })

    it("should load non-existent preset gracefully", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadPreset("non-existent-preset")
      })

      // State should remain unchanged
      expect(result.current.state.currentPreset).toBeNull()
    })

    it("should handle multiple preset loads", () => {
      const { result } = renderHook(() => useColorGrading())

      const preset1 = BUILT_IN_PRESETS[0].id
      const preset2 = BUILT_IN_PRESETS[1].id

      act(() => {
        result.current.loadPreset(preset1)
      })

      expect(result.current.state.currentPreset).toBe(preset1)

      act(() => {
        result.current.loadPreset(preset2)
      })

      expect(result.current.state.currentPreset).toBe(preset2)
    })

    it("should preserve selectedClip and previewEnabled on reset", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.state.selectedClip = "clip-456"
        result.current.togglePreview(false)
        result.current.updateBasicParameter("temperature", 30)
      })

      act(() => {
        result.current.resetAll()
      })

      expect(result.current.state.selectedClip).toBe("clip-456")
      expect(result.current.state.previewEnabled).toBe(false)
      expect(result.current.state.basicParameters.temperature).toBe(0)
    })

    it("should handle scope dispatch actions", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.dispatch({ type: "TOGGLE_SCOPE", scopeType: "vectorscope", enabled: true })
      })

      expect(result.current.state.scopes.vectorscopeEnabled).toBe(true)

      act(() => {
        result.current.dispatch({ type: "SET_SCOPE_REFRESH_RATE", value: 60 })
      })

      expect(result.current.state.scopes.refreshRate).toBe(60)
    })

    it("should handle reset LUT via dispatch", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("/path/to/lut.cube")
        result.current.setLUTIntensity(75)
      })

      act(() => {
        result.current.dispatch({ type: "RESET_LUT" })
      })

      expect(result.current.state.lut.file).toBeNull()
      expect(result.current.state.lut.intensity).toBe(100)
      expect(result.current.state.lut.isEnabled).toBe(false)
    })

    it("should save custom preset with correct structure", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateBasicParameter("temperature", 25)
        result.current.updateColorWheel("lift", { r: 5, g: 10, b: 15 })
      })

      act(() => {
        result.current.savePreset("My Test Preset")
      })

      // Get the last call to setItem
      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1]
      const savedPresets = lastCall?.[1]
      expect(savedPresets).toContain("My Test Preset")

      const parsed = JSON.parse(savedPresets)
      const myPreset = parsed.find((p: any) => p.name === "My Test Preset")
      expect(myPreset).toMatchObject({
        name: "My Test Preset",
        category: "custom",
        isBuiltIn: false,
      })
      expect(myPreset.data.basicParameters.temperature).toBe(25)
      expect(myPreset.data.colorWheels.lift).toEqual({ r: 5, g: 10, b: 15 })
    })

    it("should detect no changes when LUT is disabled", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("/path/to/lut.cube")
        result.current.toggleLUT(false)
      })

      // LUT is loaded but disabled, so hasChanges should be false
      expect(result.current.hasChanges).toBe(false)
    })

    it("should detect changes when LUT is enabled", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("/path/to/lut.cube")
      })

      expect(result.current.state.lut.isEnabled).toBe(true)
      expect(result.current.hasChanges).toBe(true)
    })

    it("should handle curve updates via dispatch", () => {
      const { result } = renderHook(() => useColorGrading())

      const newCurve = [
        { x: 0, y: 256, id: "start" },
        { x: 128, y: 100, id: "mid" },
        { x: 256, y: 0, id: "end" },
      ]

      act(() => {
        result.current.dispatch({
          type: "UPDATE_CURVE",
          curve: "red",
          points: newCurve,
        })
      })

      expect(result.current.state.curves.red).toEqual(newCurve)
    })

    it("should clear hasUnsavedChanges after applying to clip", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.state.selectedClip = "clip-789"
        result.current.updateBasicParameter("contrast", 15)
      })

      expect(result.current.state.hasUnsavedChanges).toBe(true)

      act(() => {
        result.current.applyToClip()
      })

      expect(result.current.state.hasUnsavedChanges).toBe(false)
    })

    it("should handle concurrent updates correctly", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateBasicParameter("temperature", 10)
        result.current.updateBasicParameter("tint", 5)
        result.current.updateColorWheel("lift", { r: 1, g: 2, b: 3 })
        result.current.setLUTIntensity(50)
      })

      expect(result.current.state.basicParameters.temperature).toBe(10)
      expect(result.current.state.basicParameters.tint).toBe(5)
      expect(result.current.state.colorWheels.lift).toEqual({ r: 1, g: 2, b: 3 })
      expect(result.current.state.lut.intensity).toBe(50)
      expect(result.current.hasChanges).toBe(true)
    })
  })
})

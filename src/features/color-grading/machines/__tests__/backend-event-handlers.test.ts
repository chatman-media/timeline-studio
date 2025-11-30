import { beforeEach, describe, expect, it } from "vitest"
import type { ColorGradingContext } from "../backend-event-handlers"
import { handleBackendEvent } from "../backend-event-handlers"

describe("backend-event-handlers", () => {
  let mockContext: ColorGradingContext

  beforeEach(() => {
    mockContext = {
      availablePresets: [
        {
          id: "preset-1",
          name: "Cinematic",
          category: "cinematic",
          isBuiltIn: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          data: { exposure: 0.5 },
        },
        {
          id: "preset-2",
          name: "Warm",
          category: "creative",
          isBuiltIn: false,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
          data: { temperature: 10 },
        },
      ],
      appliedColorGrading: new Map([
        ["clip-1", { presetId: "preset-1", parameters: { exposure: 0.5 } }],
        ["clip-2", { parameters: { contrast: 1.2 } }],
      ]),
      isLoading: false,
      error: null,
    }
  })

  describe("handleBackendEvent", () => {
    it("should return empty object for unknown event type", () => {
      const event = { type: "UnknownEvent", payload: {} }
      const result = handleBackendEvent(mockContext, event)

      expect(result).toEqual({})
    })

    it("should handle ColorGradingApplied event", () => {
      const event = {
        type: "ColorGradingApplied",
        payload: {
          clip_id: "clip-3",
          preset_id: "preset-1",
          parameters: { exposure: 0.8 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading).toBeDefined()
      expect(result.appliedColorGrading!.get("clip-3")).toEqual({
        presetId: "preset-1",
        parameters: { exposure: 0.8 },
      })
    })

    it("should handle ColorGradingApplied with null preset_id", () => {
      const event = {
        type: "ColorGradingApplied",
        payload: {
          clip_id: "clip-3",
          preset_id: null,
          parameters: { exposure: 0.8 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading).toBeDefined()
      expect(result.appliedColorGrading!.get("clip-3")).toEqual({
        presetId: undefined,
        parameters: { exposure: 0.8 },
      })
    })

    it("should preserve existing applied color grading when adding new", () => {
      const event = {
        type: "ColorGradingApplied",
        payload: {
          clip_id: "clip-3",
          preset_id: "preset-2",
          parameters: { temperature: 15 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading!.get("clip-1")).toEqual({
        presetId: "preset-1",
        parameters: { exposure: 0.5 },
      })
      expect(result.appliedColorGrading!.get("clip-2")).toEqual({
        parameters: { contrast: 1.2 },
      })
      expect(result.appliedColorGrading!.get("clip-3")).toEqual({
        presetId: "preset-2",
        parameters: { temperature: 15 },
      })
    })

    it("should handle ColorGradingPresetSaved event for new preset", () => {
      const event = {
        type: "ColorGradingPresetSaved",
        payload: {
          preset_id: "preset-3",
          name: "My Custom",
          parameters: { saturation: 1.5 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.availablePresets).toBeDefined()
      expect(result.availablePresets!.length).toBe(3)

      const newPreset = result.availablePresets!.find((p) => p.id === "preset-3")
      expect(newPreset).toEqual({
        id: "preset-3",
        name: "My Custom",
        category: "custom",
        isBuiltIn: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        data: { saturation: 1.5 },
      })
    })

    it("should handle ColorGradingPresetSaved event for existing preset", () => {
      const event = {
        type: "ColorGradingPresetSaved",
        payload: {
          preset_id: "preset-1",
          name: "Cinematic Updated",
          parameters: { exposure: 0.7 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.availablePresets).toBeDefined()
      expect(result.availablePresets!.length).toBe(2)

      const updatedPreset = result.availablePresets!.find((p) => p.id === "preset-1")
      expect(updatedPreset).toEqual({
        id: "preset-1",
        name: "Cinematic Updated",
        category: "cinematic",
        isBuiltIn: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        data: { exposure: 0.7 },
      })
    })

    it("should preserve other presets when updating one", () => {
      const event = {
        type: "ColorGradingPresetSaved",
        payload: {
          preset_id: "preset-1",
          name: "Cinematic Updated",
          parameters: { exposure: 0.7 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      const warmPreset = result.availablePresets!.find((p) => p.id === "preset-2")
      expect(warmPreset).toEqual({
        id: "preset-2",
        name: "Warm",
        category: "creative",
        isBuiltIn: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        data: { temperature: 10 },
      })
    })

    it("should handle ColorGradingPresetDeleted event", () => {
      const event = {
        type: "ColorGradingPresetDeleted",
        payload: {
          preset_id: "preset-1",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.availablePresets).toBeDefined()
      expect(result.availablePresets!.length).toBe(1)
      expect(result.availablePresets!.find((p) => p.id === "preset-1")).toBeUndefined()
      expect(result.availablePresets!.find((p) => p.id === "preset-2")).toBeDefined()
    })

    it("should not affect other presets when deleting one", () => {
      const event = {
        type: "ColorGradingPresetDeleted",
        payload: {
          preset_id: "preset-1",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.availablePresets!.find((p) => p.id === "preset-2")).toEqual({
        id: "preset-2",
        name: "Warm",
        category: "creative",
        isBuiltIn: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        data: { temperature: 10 },
      })
    })

    it("should handle deleting non-existent preset gracefully", () => {
      const event = {
        type: "ColorGradingPresetDeleted",
        payload: {
          preset_id: "non-existent",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.availablePresets!.length).toBe(2)
    })

    it("should handle ColorGradingReset event", () => {
      const event = {
        type: "ColorGradingReset",
        payload: {
          clip_id: "clip-1",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading).toBeDefined()
      expect(result.appliedColorGrading!.has("clip-1")).toBe(false)
      expect(result.appliedColorGrading!.has("clip-2")).toBe(true)
    })

    it("should preserve other clips when resetting one", () => {
      const event = {
        type: "ColorGradingReset",
        payload: {
          clip_id: "clip-1",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading!.get("clip-2")).toEqual({
        parameters: { contrast: 1.2 },
      })
    })

    it("should handle resetting non-existent clip gracefully", () => {
      const event = {
        type: "ColorGradingReset",
        payload: {
          clip_id: "non-existent",
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading!.size).toBe(2)
    })
  })

  describe("Event type validation", () => {
    it("should return empty object for ColorGradingApplied with wrong type check", () => {
      const event = {
        type: "ColorGradingPresetSaved",
        payload: {
          clip_id: "clip-3",
          preset_id: "preset-1",
          parameters: { exposure: 0.8 },
        },
      }

      // Event type doesn't match the payload, should not be handled by ColorGradingApplied handler
      const result = handleBackendEvent(mockContext, event)

      // Should be handled by ColorGradingPresetSaved instead
      expect(result.availablePresets).toBeDefined()
    })
  })

  describe("Context immutability", () => {
    it("should not mutate original context when handling ColorGradingApplied", () => {
      const originalSize = mockContext.appliedColorGrading.size

      const event = {
        type: "ColorGradingApplied",
        payload: {
          clip_id: "clip-3",
          preset_id: "preset-1",
          parameters: { exposure: 0.8 },
        },
      }

      handleBackendEvent(mockContext, event)

      expect(mockContext.appliedColorGrading.size).toBe(originalSize)
    })

    it("should not mutate original context when handling ColorGradingPresetSaved", () => {
      const originalLength = mockContext.availablePresets.length

      const event = {
        type: "ColorGradingPresetSaved",
        payload: {
          preset_id: "preset-3",
          name: "New Preset",
          parameters: { exposure: 0.5 },
        },
      }

      handleBackendEvent(mockContext, event)

      expect(mockContext.availablePresets.length).toBe(originalLength)
    })

    it("should not mutate original context when handling ColorGradingPresetDeleted", () => {
      const originalLength = mockContext.availablePresets.length

      const event = {
        type: "ColorGradingPresetDeleted",
        payload: {
          preset_id: "preset-1",
        },
      }

      handleBackendEvent(mockContext, event)

      expect(mockContext.availablePresets.length).toBe(originalLength)
    })

    it("should not mutate original context when handling ColorGradingReset", () => {
      const originalSize = mockContext.appliedColorGrading.size

      const event = {
        type: "ColorGradingReset",
        payload: {
          clip_id: "clip-1",
        },
      }

      handleBackendEvent(mockContext, event)

      expect(mockContext.appliedColorGrading.size).toBe(originalSize)
    })
  })

  describe("Edge cases", () => {
    it("should handle empty preset list", () => {
      const emptyContext: ColorGradingContext = {
        ...mockContext,
        availablePresets: [],
      }

      const event = {
        type: "ColorGradingPresetSaved",
        payload: {
          preset_id: "preset-1",
          name: "First Preset",
          parameters: { exposure: 0.5 },
        },
      }

      const result = handleBackendEvent(emptyContext, event)

      expect(result.availablePresets!.length).toBe(1)
    })

    it("should handle empty applied color grading map", () => {
      const emptyContext: ColorGradingContext = {
        ...mockContext,
        appliedColorGrading: new Map(),
      }

      const event = {
        type: "ColorGradingApplied",
        payload: {
          clip_id: "clip-1",
          preset_id: "preset-1",
          parameters: { exposure: 0.5 },
        },
      }

      const result = handleBackendEvent(emptyContext, event)

      expect(result.appliedColorGrading!.size).toBe(1)
    })

    it("should handle updating clip with existing color grading", () => {
      const event = {
        type: "ColorGradingApplied",
        payload: {
          clip_id: "clip-1",
          preset_id: "preset-2",
          parameters: { temperature: 20 },
        },
      }

      const result = handleBackendEvent(mockContext, event)

      expect(result.appliedColorGrading!.get("clip-1")).toEqual({
        presetId: "preset-2",
        parameters: { temperature: 20 },
      })
    })
  })
})

import { describe, expect, it, vi } from "vitest"
import { createAnimationLayer } from "../../services/animation-layers"
import { createKeyframe } from "../../services/keyframe-manager"
import {
  applyPreset,
  combinePresets,
  createPresetFromLayer,
  exportPresets,
  getAllPresets,
  getCollectionPresets,
  getPresetById,
  getPresetCategories,
  getPresetsByCategory,
  getPresetThumbnail,
  importPresets,
  presetCollections,
  searchPresets,
  validatePreset,
} from "../../services/preset-manager"
import type { MotionPreset } from "../../types/keyframe"

// Mock the motion presets data
vi.mock("../../data/motion-presets.json", () => ({
  default: {
    categories: [
      { id: "transitions", name: "Transitions", icon: "arrow-right" },
      { id: "text", name: "Text", icon: "type" },
    ],
    presets: [
      {
        id: "fade-in",
        name: "Fade In",
        description: "Smooth fade in animation",
        category: "transitions",
        tags: ["fade", "transition", "opacity"],
        duration: 1,
        scalable: true,
        customizable: true,
        properties: [
          {
            id: "opacity-prop",
            name: "Opacity",
            path: "opacity",
            type: "number",
            enabled: true,
            keyframes: [
              { id: "kf1", time: 0, value: 0, interpolation: "ease-out" },
              { id: "kf2", time: 1, value: 1, interpolation: "linear" },
            ],
          },
        ],
      },
      {
        id: "typewriter",
        name: "Typewriter",
        description: "Typewriter text effect",
        category: "text",
        tags: ["text", "typewriter", "reveal"],
        duration: 2,
        scalable: true,
        customizable: true,
        properties: [
          {
            id: "text-prop",
            name: "Characters",
            path: "text.characters",
            type: "number",
            enabled: true,
            keyframes: [
              { id: "kf1", time: 0, value: 0, interpolation: "linear" },
              { id: "kf2", time: 2, value: 10, interpolation: "linear" },
            ],
          },
        ],
      },
    ],
  },
}))

describe("PresetManager", () => {
  describe("getPresetCategories", () => {
    it("returns all categories", () => {
      const categories = getPresetCategories()

      expect(categories).toHaveLength(2)
      expect(categories[0].id).toBe("transitions")
      expect(categories[1].id).toBe("text")
    })

    it("categories have required properties", () => {
      const categories = getPresetCategories()

      categories.forEach((cat) => {
        expect(cat.id).toBeDefined()
        expect(cat.name).toBeDefined()
        expect(cat.icon).toBeDefined()
      })
    })
  })

  describe("getAllPresets", () => {
    it("returns all presets", () => {
      const presets = getAllPresets()

      expect(presets).toHaveLength(2)
    })

    it("presets have correct structure", () => {
      const presets = getAllPresets()

      presets.forEach((preset) => {
        expect(preset.id).toBeDefined()
        expect(preset.name).toBeDefined()
        expect(preset.description).toBeDefined()
        expect(preset.category).toBeDefined()
        expect(Array.isArray(preset.tags)).toBe(true)
        expect(preset.duration).toBeGreaterThan(0)
        expect(Array.isArray(preset.properties)).toBe(true)
      })
    })

    it("normalizes property types", () => {
      const presets = getAllPresets()
      const preset = presets[0]

      expect(preset.properties[0].type).toBeDefined()
      expect(preset.properties[0].keyframes).toBeDefined()
    })
  })

  describe("getPresetsByCategory", () => {
    it("returns presets for specific category", () => {
      const presets = getPresetsByCategory("transitions")

      expect(presets).toHaveLength(1)
      expect(presets[0].id).toBe("fade-in")
    })

    it("returns empty array for non-existent category", () => {
      const presets = getPresetsByCategory("non-existent")

      expect(presets).toEqual([])
    })
  })

  describe("getPresetById", () => {
    it("returns preset by id", () => {
      const preset = getPresetById("fade-in")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("Fade In")
    })

    it("returns null for non-existent id", () => {
      const preset = getPresetById("non-existent")

      expect(preset).toBeNull()
    })
  })

  describe("searchPresets", () => {
    it("searches by name", () => {
      const results = searchPresets("fade")

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe("fade-in")
    })

    it("searches by description", () => {
      const results = searchPresets("typewriter")

      expect(results.some((p) => p.id === "typewriter")).toBe(true)
    })

    it("searches by tags", () => {
      const results = searchPresets("opacity")

      expect(results.some((p) => p.tags.includes("opacity"))).toBe(true)
    })

    it("is case insensitive", () => {
      const results = searchPresets("FADE")

      expect(results).toHaveLength(1)
    })

    it("returns empty array when no matches", () => {
      const results = searchPresets("xyz123")

      expect(results).toEqual([])
    })
  })

  describe("applyPreset", () => {
    it("creates animation layer from preset", () => {
      const preset = getPresetById("fade-in")!
      const layer = applyPreset(preset)

      expect(layer.name).toBe("Fade In")
      expect(layer.properties).toHaveLength(1)
    })

    it("applies custom start time", () => {
      const preset = getPresetById("fade-in")!
      const layer = applyPreset(preset, { startTime: 5 })

      expect(layer.properties[0].keyframes[0].time).toBe(5)
    })

    it("applies custom duration when scalable", () => {
      const preset = getPresetById("fade-in")!
      const layer = applyPreset(preset, { duration: 2 })

      const lastKeyframe = layer.properties[0].keyframes[layer.properties[0].keyframes.length - 1]
      expect(lastKeyframe.time).toBe(2)
    })

    it("applies customizations", () => {
      const preset = getPresetById("fade-in")!
      const layer = applyPreset(preset, {
        customizations: {
          opacity: { enabled: false },
        },
      })

      expect(layer.properties[0].enabled).toBe(false)
    })

    it("generates new keyframe ids", () => {
      const preset = getPresetById("fade-in")!
      const layer = applyPreset(preset)

      expect(layer.properties[0].keyframes[0].id).not.toBe("kf1")
    })
  })

  describe("createPresetFromLayer", () => {
    it("creates preset from layer", () => {
      const layer = createAnimationLayer("Custom", [
        {
          id: "prop-1",
          name: "Opacity",
          path: "opacity",
          type: "number",
          keyframes: [createKeyframe(0, 0), createKeyframe(2, 100)],
          enabled: true,
        },
      ])

      const preset = createPresetFromLayer(layer, {
        name: "Custom Preset",
        description: "My custom animation",
        category: "custom",
        tags: ["custom", "test"],
      })

      expect(preset.id).toBeDefined()
      expect(preset.name).toBe("Custom Preset")
      expect(preset.description).toBe("My custom animation")
      expect(preset.category).toBe("custom")
      expect(preset.tags).toEqual(["custom", "test"])
      expect(preset.duration).toBe(2)
      expect(preset.properties).toHaveLength(1)
      expect(preset.scalable).toBe(true)
      expect(preset.customizable).toBe(true)
    })

    it("calculates duration from keyframes", () => {
      const layer = createAnimationLayer("Custom", [
        {
          id: "prop-1",
          name: "Position",
          path: "position",
          type: "vec2",
          keyframes: [createKeyframe(0, [0, 0]), createKeyframe(1.5, [50, 50]), createKeyframe(3, [100, 100])],
          enabled: true,
        },
      ])

      const preset = createPresetFromLayer(layer, {
        name: "Movement",
        description: "Position animation",
        category: "motion",
        tags: ["move"],
      })

      expect(preset.duration).toBe(3)
    })
  })

  describe("combinePresets", () => {
    it("combines presets sequentially", () => {
      const preset1 = getPresetById("fade-in")!
      const preset2 = getPresetById("typewriter")!

      const layer = combinePresets([preset1, preset2], { sequence: true, gap: 0.5 })

      expect(layer.name).toBe("Combined Preset")
      // Should have keyframes from both presets
      expect(layer.properties.length).toBeGreaterThan(0)
    })

    it("combines presets as overlay", () => {
      const preset1 = getPresetById("fade-in")!
      const preset2 = getPresetById("typewriter")!

      const layer = combinePresets([preset1, preset2], { sequence: false })

      expect(layer.properties.length).toBeGreaterThan(0)
    })

    it("applies gap between sequential presets", () => {
      const preset1 = getPresetById("fade-in")!
      const preset2 = getPresetById("fade-in")!

      const layer = combinePresets([preset1, preset2], { sequence: true, gap: 1 })

      // Second preset should start at (duration of first + gap)
      expect(layer.properties).toBeDefined()
    })
  })

  describe("getPresetThumbnail", () => {
    it("returns curve type for animated preset", () => {
      const preset = getPresetById("fade-in")!
      const thumbnail = getPresetThumbnail(preset)

      expect(thumbnail.type).toBe("curve")
      expect(thumbnail.data).toBeDefined()
    })

    it("returns value type for empty preset", () => {
      const preset: MotionPreset = {
        id: "empty",
        name: "Empty",
        description: "No properties",
        category: "test",
        tags: [],
        duration: 1,
        scalable: true,
        customizable: true,
        properties: [],
      }

      const thumbnail = getPresetThumbnail(preset)

      expect(thumbnail.type).toBe("value")
      expect(thumbnail.data).toBeNull()
    })
  })

  describe("exportPresets", () => {
    it("exports presets as JSON", () => {
      const presets = [getPresetById("fade-in")!]
      const json = exportPresets(presets)

      expect(typeof json).toBe("string")
      expect(() => JSON.parse(json)).not.toThrow()
    })

    it("exported JSON has correct structure", () => {
      const presets = [getPresetById("fade-in")!]
      const json = exportPresets(presets)
      const data = JSON.parse(json)

      expect(data.version).toBe("1.0.0")
      expect(Array.isArray(data.presets)).toBe(true)
      expect(data.presets).toHaveLength(1)
    })
  })

  describe("importPresets", () => {
    it("imports valid presets", () => {
      const original = [getPresetById("fade-in")!]
      const json = exportPresets(original)

      const imported = importPresets(json)

      expect(imported).toHaveLength(1)
      expect(imported[0].name).toBe("Fade In")
    })

    it("generates new IDs for imported presets", () => {
      const original = [getPresetById("fade-in")!]
      const json = exportPresets(original)

      const imported = importPresets(json)

      expect(imported[0].id).not.toBe(original[0].id)
    })

    it("returns empty array for invalid JSON", () => {
      const imported = importPresets("invalid json")

      expect(imported).toEqual([])
    })

    it("returns empty array for JSON without presets array", () => {
      const imported = importPresets(JSON.stringify({ version: "1.0.0" }))

      expect(imported).toEqual([])
    })
  })

  describe("presetCollections", () => {
    it("has essentials collection", () => {
      expect(presetCollections.essentials).toBeDefined()
      expect(Array.isArray(presetCollections.essentials)).toBe(true)
    })

    it("has advanced collection", () => {
      expect(presetCollections.advanced).toBeDefined()
      expect(Array.isArray(presetCollections.advanced)).toBe(true)
    })

    it("has text collection", () => {
      expect(presetCollections.text).toBeDefined()
      expect(Array.isArray(presetCollections.text)).toBe(true)
    })

    it("has transitions collection", () => {
      expect(presetCollections.transitions).toBeDefined()
      expect(Array.isArray(presetCollections.transitions)).toBe(true)
    })
  })

  describe("getCollectionPresets", () => {
    it("returns presets from essentials collection", () => {
      const presets = getCollectionPresets("essentials")

      expect(Array.isArray(presets)).toBe(true)
    })

    it("filters out null presets", () => {
      const presets = getCollectionPresets("essentials")

      expect(presets.every((p) => p !== null)).toBe(true)
    })
  })

  describe("validatePreset", () => {
    it("validates correct preset", () => {
      const preset = getPresetById("fade-in")!
      const isValid = validatePreset(preset)

      expect(isValid).toBe(true)
    })

    it("rejects preset without id", () => {
      const preset = { name: "Test", duration: 1, properties: [] }
      const isValid = validatePreset(preset)

      expect(isValid).toBe(false)
    })

    it("rejects preset without name", () => {
      const preset = { id: "test", duration: 1, properties: [] }
      const isValid = validatePreset(preset)

      expect(isValid).toBe(false)
    })

    it("rejects preset without duration", () => {
      const preset = { id: "test", name: "Test", properties: [] }
      const isValid = validatePreset(preset)

      expect(isValid).toBe(false)
    })

    it("rejects preset without properties array", () => {
      const preset = { id: "test", name: "Test", duration: 1 }
      const isValid = validatePreset(preset)

      expect(isValid).toBe(false)
    })

    it("rejects preset with invalid property", () => {
      const preset = {
        id: "test",
        name: "Test",
        duration: 1,
        properties: [{ name: "Invalid" }], // Missing required fields
      }
      const isValid = validatePreset(preset)

      expect(isValid).toBe(false)
    })
  })
})

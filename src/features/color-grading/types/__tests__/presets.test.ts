import { describe, expect, it } from "vitest"

import {
  BUILT_IN_PRESETS,
  type ColorGradingPreset,
  getAllPresetCategories,
  getPresetsByCategory,
  type PresetCategory,
} from "../presets"

describe("BUILT_IN_PRESETS", () => {
  it("should contain presets", () => {
    expect(BUILT_IN_PRESETS).toBeDefined()
    expect(BUILT_IN_PRESETS.length).toBeGreaterThan(0)
  })

  it("should have all required preset properties", () => {
    for (const preset of BUILT_IN_PRESETS) {
      expect(preset).toHaveProperty("id")
      expect(preset).toHaveProperty("name")
      expect(preset).toHaveProperty("category")
      expect(preset).toHaveProperty("isBuiltIn")
      expect(preset).toHaveProperty("createdAt")
      expect(preset).toHaveProperty("updatedAt")
      expect(preset).toHaveProperty("data")

      expect(typeof preset.id).toBe("string")
      expect(typeof preset.name).toBe("string")
      expect(typeof preset.category).toBe("string")
      expect(preset.isBuiltIn).toBe(true)
      expect(preset.createdAt).toBeInstanceOf(Date)
      expect(preset.updatedAt).toBeInstanceOf(Date)
      expect(typeof preset.data).toBe("object")
    }
  })

  it("should have unique IDs", () => {
    const ids = BUILT_IN_PRESETS.map((p) => p.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it("should have unique names", () => {
    const names = BUILT_IN_PRESETS.map((p) => p.name)
    const uniqueNames = new Set(names)

    expect(uniqueNames.size).toBe(names.length)
  })

  it("should have valid categories", () => {
    const validCategories: PresetCategory[] = [
      "cinematic",
      "vintage",
      "modern",
      "blackwhite",
      "creative",
      "correction",
      "custom",
    ]

    for (const preset of BUILT_IN_PRESETS) {
      expect(validCategories).toContain(preset.category)
    }
  })

  it("should have valid data structure", () => {
    for (const preset of BUILT_IN_PRESETS) {
      expect(preset.data).toBeDefined()

      // Check if data contains at least one of the expected properties
      const hasValidData =
        preset.data.colorWheels !== undefined ||
        preset.data.basicParameters !== undefined ||
        preset.data.curves !== undefined ||
        preset.data.lut !== undefined

      expect(hasValidData).toBe(true)
    }
  })

  describe("specific presets", () => {
    it("should have Cinematic Warm preset", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-cinematic-warm")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("Cinematic Warm")
      expect(preset?.category).toBe("cinematic")
      expect(preset?.data.colorWheels).toBeDefined()
      expect(preset?.data.basicParameters).toBeDefined()
    })

    it("should have Cinematic Cool preset", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-cinematic-cool")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("Cinematic Cool")
      expect(preset?.category).toBe("cinematic")
    })

    it("should have Vintage Fade preset", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-vintage-fade")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("Vintage Fade")
      expect(preset?.category).toBe("vintage")
    })

    it("should have High Contrast B&W preset", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-blackwhite-contrast")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("High Contrast B&W")
      expect(preset?.category).toBe("blackwhite")
      expect(preset?.data.curves).toBeDefined()
    })

    it("should have Cyberpunk preset", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-creative-cyberpunk")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("Cyberpunk")
      expect(preset?.category).toBe("creative")
    })

    it("should have Neutral Correction preset", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-correction-neutral")

      expect(preset).toBeDefined()
      expect(preset?.name).toBe("Neutral Correction")
      expect(preset?.category).toBe("correction")
    })
  })

  describe("preset data validation", () => {
    it("Cinematic Warm should have warm color shifts", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-cinematic-warm")

      expect(preset?.data.colorWheels?.lift.r).toBeGreaterThan(0) // Red lift
      expect(preset?.data.basicParameters?.temperature).toBeGreaterThan(0) // Warm temperature
    })

    it("Cinematic Cool should have cool color shifts", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-cinematic-cool")

      expect(preset?.data.colorWheels?.lift.b).toBeGreaterThan(0) // Blue lift
      expect(preset?.data.basicParameters?.temperature).toBeLessThan(0) // Cool temperature
    })

    it("Vintage Fade should lift shadows", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-vintage-fade")

      expect(preset?.data.colorWheels?.lift.r).toBeGreaterThan(0)
      expect(preset?.data.colorWheels?.lift.g).toBeGreaterThan(0)
      expect(preset?.data.colorWheels?.lift.b).toBeGreaterThan(0)
      expect(preset?.data.basicParameters?.contrast).toBeLessThan(0) // Reduced contrast
    })

    it("High Contrast B&W should desaturate", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-blackwhite-contrast")

      expect(preset?.data.basicParameters?.saturation).toBe(-100) // Full desaturation
      expect(preset?.data.basicParameters?.contrast).toBeGreaterThan(0) // High contrast
    })

    it("Cyberpunk should have vibrant colors", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-creative-cyberpunk")

      expect(preset?.data.basicParameters?.saturation).toBeGreaterThan(0) // Increased saturation
      expect(preset?.data.basicParameters?.contrast).toBeGreaterThan(0) // High contrast
    })

    it("Neutral Correction should have subtle adjustments", () => {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === "preset-correction-neutral")

      expect(preset?.data.basicParameters?.temperature).toBe(0)
      expect(preset?.data.basicParameters?.tint).toBe(0)
      expect(preset?.data.basicParameters?.contrast).toBeLessThan(10) // Subtle contrast
    })
  })

  describe("color wheels validation", () => {
    it("should have valid RGB values in color wheels", () => {
      for (const preset of BUILT_IN_PRESETS) {
        if (preset.data.colorWheels) {
          const wheels = ["lift", "gamma", "gain", "offset"] as const

          for (const wheel of wheels) {
            if (preset.data.colorWheels[wheel]) {
              const { r, g, b } = preset.data.colorWheels[wheel]

              expect(r).toBeGreaterThanOrEqual(-1)
              expect(r).toBeLessThanOrEqual(1)
              expect(g).toBeGreaterThanOrEqual(-1)
              expect(g).toBeLessThanOrEqual(1)
              expect(b).toBeGreaterThanOrEqual(-1)
              expect(b).toBeLessThanOrEqual(1)
            }
          }
        }
      }
    })
  })

  describe("basic parameters validation", () => {
    it("should have valid parameter ranges", () => {
      for (const preset of BUILT_IN_PRESETS) {
        if (preset.data.basicParameters) {
          const params = preset.data.basicParameters

          if (params.temperature !== undefined) {
            expect(params.temperature).toBeGreaterThanOrEqual(-100)
            expect(params.temperature).toBeLessThanOrEqual(100)
          }

          if (params.tint !== undefined) {
            expect(params.tint).toBeGreaterThanOrEqual(-100)
            expect(params.tint).toBeLessThanOrEqual(100)
          }

          if (params.contrast !== undefined) {
            expect(params.contrast).toBeGreaterThanOrEqual(-100)
            expect(params.contrast).toBeLessThanOrEqual(100)
          }

          if (params.saturation !== undefined) {
            expect(params.saturation).toBeGreaterThanOrEqual(-100)
            expect(params.saturation).toBeLessThanOrEqual(100)
          }

          if (params.hue !== undefined) {
            expect(params.hue).toBeGreaterThanOrEqual(-180)
            expect(params.hue).toBeLessThanOrEqual(180)
          }

          if (params.luminance !== undefined) {
            expect(params.luminance).toBeGreaterThanOrEqual(-100)
            expect(params.luminance).toBeLessThanOrEqual(100)
          }

          if (params.pivot !== undefined) {
            expect(params.pivot).toBeGreaterThanOrEqual(0)
            expect(params.pivot).toBeLessThanOrEqual(1)
          }
        }
      }
    })
  })

  describe("curves validation", () => {
    it("should have valid curve points", () => {
      for (const preset of BUILT_IN_PRESETS) {
        if (preset.data.curves) {
          const curves = Object.values(preset.data.curves).filter((curve) => curve !== undefined)

          for (const curve of curves) {
            expect(Array.isArray(curve)).toBe(true)

            for (const point of curve) {
              expect(point).toHaveProperty("x")
              expect(point).toHaveProperty("y")
              expect(point).toHaveProperty("id")

              expect(point.x).toBeGreaterThanOrEqual(0)
              expect(point.x).toBeLessThanOrEqual(256)
              expect(point.y).toBeGreaterThanOrEqual(0)
              expect(point.y).toBeLessThanOrEqual(280) // Some presets might exceed 256
              expect(typeof point.id).toBe("string")
            }
          }
        }
      }
    })

    it("should have sorted curve points", () => {
      for (const preset of BUILT_IN_PRESETS) {
        if (preset.data.curves) {
          const curves = Object.values(preset.data.curves).filter((curve) => curve !== undefined)

          for (const curve of curves) {
            if (curve.length > 1) {
              for (let i = 1; i < curve.length; i++) {
                expect(curve[i].x).toBeGreaterThanOrEqual(curve[i - 1].x)
              }
            }
          }
        }
      }
    })
  })
})

describe("getPresetsByCategory", () => {
  it("should return presets for cinematic category", () => {
    const presets = getPresetsByCategory("cinematic")

    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.category === "cinematic")).toBe(true)
  })

  it("should return presets for vintage category", () => {
    const presets = getPresetsByCategory("vintage")

    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.category === "vintage")).toBe(true)
  })

  it("should return presets for blackwhite category", () => {
    const presets = getPresetsByCategory("blackwhite")

    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.category === "blackwhite")).toBe(true)
  })

  it("should return presets for creative category", () => {
    const presets = getPresetsByCategory("creative")

    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.category === "creative")).toBe(true)
  })

  it("should return presets for correction category", () => {
    const presets = getPresetsByCategory("correction")

    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.category === "correction")).toBe(true)
  })

  it("should return empty array for custom category (no built-in custom presets)", () => {
    const presets = getPresetsByCategory("custom")

    expect(presets).toEqual([])
  })

  it("should return empty array for modern category (no modern presets yet)", () => {
    const presets = getPresetsByCategory("modern")

    expect(presets).toEqual([])
  })

  it("should return all presets from BUILT_IN_PRESETS when combined", () => {
    const categories = getAllPresetCategories()
    const allPresets: ColorGradingPreset[] = []

    for (const category of categories) {
      allPresets.push(...getPresetsByCategory(category))
    }

    // All built-in presets should be categorized
    expect(allPresets.length).toBe(BUILT_IN_PRESETS.length)
  })

  it("should not modify original BUILT_IN_PRESETS array", () => {
    const originalLength = BUILT_IN_PRESETS.length
    const firstPresetId = BUILT_IN_PRESETS[0].id

    getPresetsByCategory("cinematic")

    expect(BUILT_IN_PRESETS.length).toBe(originalLength)
    expect(BUILT_IN_PRESETS[0].id).toBe(firstPresetId)
  })
})

describe("getAllPresetCategories", () => {
  it("should return array of all categories", () => {
    const categories = getAllPresetCategories()

    expect(Array.isArray(categories)).toBe(true)
    expect(categories.length).toBeGreaterThan(0)
  })

  it("should include all defined categories", () => {
    const categories = getAllPresetCategories()

    expect(categories).toContain("cinematic")
    expect(categories).toContain("vintage")
    expect(categories).toContain("modern")
    expect(categories).toContain("blackwhite")
    expect(categories).toContain("creative")
    expect(categories).toContain("correction")
    expect(categories).toContain("custom")
  })

  it("should return exactly 7 categories", () => {
    const categories = getAllPresetCategories()

    expect(categories.length).toBe(7)
  })

  it("should have unique categories", () => {
    const categories = getAllPresetCategories()
    const uniqueCategories = new Set(categories)

    expect(uniqueCategories.size).toBe(categories.length)
  })

  it("should return valid PresetCategory types", () => {
    const categories = getAllPresetCategories()
    const validCategories: PresetCategory[] = [
      "cinematic",
      "vintage",
      "modern",
      "blackwhite",
      "creative",
      "correction",
      "custom",
    ]

    for (const category of categories) {
      expect(validCategories).toContain(category)
    }
  })
})

describe("ColorGradingPreset type", () => {
  it("should be compatible with built-in presets", () => {
    const preset: ColorGradingPreset = BUILT_IN_PRESETS[0]

    expect(preset).toBeDefined()
    expect(preset.id).toBeDefined()
    expect(preset.name).toBeDefined()
    expect(preset.category).toBeDefined()
  })

  it("should support optional description", () => {
    const presetWithDescription = BUILT_IN_PRESETS.find((p) => p.description !== undefined)
    const presetWithoutDescription = BUILT_IN_PRESETS.find((p) => p.description === undefined)

    // Some presets should have descriptions
    expect(presetWithDescription).toBeDefined()

    // It's optional, so both should be valid
    if (presetWithoutDescription) {
      expect(presetWithoutDescription.description).toBeUndefined()
    }
  })

  it("should support optional thumbnail", () => {
    // Currently no presets have thumbnails, but type should support it
    const preset: ColorGradingPreset = {
      ...BUILT_IN_PRESETS[0],
      thumbnail: "/path/to/thumbnail.jpg",
    }

    expect(preset.thumbnail).toBe("/path/to/thumbnail.jpg")
  })
})

describe("PresetCategory type", () => {
  it("should accept all valid categories", () => {
    const categories: PresetCategory[] = [
      "cinematic",
      "vintage",
      "modern",
      "blackwhite",
      "creative",
      "correction",
      "custom",
    ]

    for (const category of categories) {
      const preset: ColorGradingPreset = {
        id: "test",
        name: "Test",
        category,
        isBuiltIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {},
      }

      expect(preset.category).toBe(category)
    }
  })
})

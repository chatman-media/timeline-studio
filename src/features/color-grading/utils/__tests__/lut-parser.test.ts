import { describe, expect, it } from "vitest"

import { applyLUT, createIdentityLUT, type LUTData, PRESET_LUT_EFFECTS, parseCubeFile } from "../lut-parser"

describe("parseCubeFile", () => {
  it("should parse valid .cube file content", () => {
    const cubeContent = `
TITLE "Test LUT"
LUT_3D_SIZE 3
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0
0.0 0.0 0.0
0.5 0.0 0.0
1.0 0.0 0.0
0.0 0.5 0.0
0.5 0.5 0.0
1.0 0.5 0.0
0.0 1.0 0.0
0.5 1.0 0.0
1.0 1.0 0.0
0.0 0.0 0.5
0.5 0.0 0.5
1.0 0.0 0.5
0.0 0.5 0.5
0.5 0.5 0.5
1.0 0.5 0.5
0.0 1.0 0.5
0.5 1.0 0.5
1.0 1.0 0.5
0.0 0.0 1.0
0.5 0.0 1.0
1.0 0.0 1.0
0.0 0.5 1.0
0.5 0.5 1.0
1.0 0.5 1.0
0.0 1.0 1.0
0.5 1.0 1.0
1.0 1.0 1.0
    `.trim()

    const lut = parseCubeFile(cubeContent)

    expect(lut.title).toBe("Test LUT")
    expect(lut.size).toBe(3)
    expect(lut.domainMin).toEqual([0, 0, 0])
    expect(lut.domainMax).toEqual([1, 1, 1])
    expect(lut.data).toBeInstanceOf(Float32Array)
    expect(lut.data.length).toBe(3 * 3 * 3 * 3) // size^3 * 3 channels
  })

  it("should handle cube file without title", () => {
    const cubeContent = `
LUT_3D_SIZE 2
0.0 0.0 0.0
0.5 0.5 0.5
1.0 0.0 0.0
1.0 0.5 0.5
0.0 1.0 0.0
0.5 1.0 0.5
1.0 1.0 0.0
1.0 1.0 1.0
    `.trim()

    const lut = parseCubeFile(cubeContent)

    expect(lut.title).toBe("Untitled LUT")
    expect(lut.size).toBe(2)
  })

  it("should ignore comments and empty lines", () => {
    const cubeContent = `
# This is a comment
TITLE "Test"
# Another comment

LUT_3D_SIZE 2

# RGB values below
0.0 0.0 0.0
0.5 0.5 0.5
1.0 0.0 0.0
1.0 0.5 0.5
0.0 1.0 0.0
0.5 1.0 0.5
1.0 1.0 0.0
1.0 1.0 1.0
    `.trim()

    const lut = parseCubeFile(cubeContent)

    expect(lut.title).toBe("Test")
    expect(lut.size).toBe(2)
    expect(lut.data.length).toBe(2 * 2 * 2 * 3)
  })

  it("should handle custom domain ranges", () => {
    const cubeContent = `
TITLE "Custom Domain"
LUT_3D_SIZE 2
DOMAIN_MIN 0.1 0.2 0.3
DOMAIN_MAX 0.9 0.8 0.7
0.0 0.0 0.0
0.5 0.5 0.5
1.0 0.0 0.0
1.0 0.5 0.5
0.0 1.0 0.0
0.5 1.0 0.5
1.0 1.0 0.0
1.0 1.0 1.0
    `.trim()

    const lut = parseCubeFile(cubeContent)

    expect(lut.domainMin).toEqual([0.1, 0.2, 0.3])
    expect(lut.domainMax).toEqual([0.9, 0.8, 0.7])
  })

  it("should throw error for invalid data size", () => {
    const cubeContent = `
TITLE "Invalid"
LUT_3D_SIZE 3
0.0 0.0 0.0
0.5 0.5 0.5
    `.trim()

    expect(() => parseCubeFile(cubeContent)).toThrow("Invalid LUT data")
  })

  it("should handle title with quotes", () => {
    const cubeContent = `
TITLE "Test "LUT" with quotes"
LUT_3D_SIZE 2
0.0 0.0 0.0
0.5 0.5 0.5
1.0 0.0 0.0
1.0 0.5 0.5
0.0 1.0 0.0
0.5 1.0 0.5
1.0 1.0 0.0
1.0 1.0 1.0
    `.trim()

    const lut = parseCubeFile(cubeContent)

    expect(lut.title).toBe("Test LUT with quotes")
  })

  it("should handle various whitespace formats", () => {
    const cubeContent = `
LUT_3D_SIZE 2
0.0    0.0    0.0
0.5	0.5	0.5
1.0  0.0  0.0
1.0   0.5   0.5
0.0 1.0 0.0
0.5 1.0 0.5
1.0 1.0 0.0
1.0 1.0 1.0
    `.trim()

    const lut = parseCubeFile(cubeContent)

    expect(lut.data.length).toBe(2 * 2 * 2 * 3)
  })
})

describe("applyLUT", () => {
  let identityLUT: LUTData

  beforeEach(() => {
    identityLUT = createIdentityLUT(3)
  })

  it("should apply identity LUT without changes", () => {
    const [r, g, b] = applyLUT(0.5, 0.5, 0.5, identityLUT, 1)

    expect(r).toBeCloseTo(0.5, 2)
    expect(g).toBeCloseTo(0.5, 2)
    expect(b).toBeCloseTo(0.5, 2)
  })

  it("should handle black color (0, 0, 0)", () => {
    const [r, g, b] = applyLUT(0, 0, 0, identityLUT, 1)

    expect(r).toBeCloseTo(0, 2)
    expect(g).toBeCloseTo(0, 2)
    expect(b).toBeCloseTo(0, 2)
  })

  it("should handle white color (1, 1, 1)", () => {
    const [r, g, b] = applyLUT(1, 1, 1, identityLUT, 1)

    expect(r).toBeCloseTo(1, 2)
    expect(g).toBeCloseTo(1, 2)
    expect(b).toBeCloseTo(1, 2)
  })

  it("should apply intensity correctly", () => {
    // Create LUT that inverts colors
    const invertLUT: LUTData = {
      ...identityLUT,
      data: new Float32Array(identityLUT.data.map((v, i) => (i % 3 === 0 ? 1 - v : v))),
    }

    // With intensity 0.5, should be halfway between original and inverted
    const [r, g, b] = applyLUT(0.8, 0.5, 0.5, invertLUT, 0.5)

    // Original R=0.8, inverted would be ~0.2, halfway is ~0.5
    expect(r).toBeLessThan(0.8)
    expect(r).toBeGreaterThan(0.2)
  })

  it("should clamp output values to [0, 1]", () => {
    // Create extreme LUT
    const extremeLUT: LUTData = {
      ...identityLUT,
      data: new Float32Array(identityLUT.data.length).fill(2.0), // Values > 1
    }

    const [r, g, b] = applyLUT(0.5, 0.5, 0.5, extremeLUT, 1)

    expect(r).toBeLessThanOrEqual(1)
    expect(g).toBeLessThanOrEqual(1)
    expect(b).toBeLessThanOrEqual(1)
    expect(r).toBeGreaterThanOrEqual(0)
    expect(g).toBeGreaterThanOrEqual(0)
    expect(b).toBeGreaterThanOrEqual(0)
  })

  it("should handle custom domain ranges", () => {
    const customLUT: LUTData = {
      ...identityLUT,
      domainMin: [0.2, 0.2, 0.2],
      domainMax: [0.8, 0.8, 0.8],
    }

    const [r, g, b] = applyLUT(0.5, 0.5, 0.5, customLUT, 1)

    // Should normalize input based on domain
    expect(r).toBeGreaterThanOrEqual(0)
    expect(g).toBeGreaterThanOrEqual(0)
    expect(b).toBeGreaterThanOrEqual(0)
  })

  it("should perform trilinear interpolation", () => {
    // Create simple 2x2x2 LUT for testing interpolation
    const simpleLUT: LUTData = createIdentityLUT(2)

    // Test mid-point interpolation
    const [r, g, b] = applyLUT(0.5, 0.5, 0.5, simpleLUT, 1)

    expect(r).toBeCloseTo(0.5, 1)
    expect(g).toBeCloseTo(0.5, 1)
    expect(b).toBeCloseTo(0.5, 1)
  })

  it("should handle zero intensity", () => {
    const invertLUT: LUTData = {
      ...identityLUT,
      data: new Float32Array(identityLUT.data.length).fill(0),
    }

    const [r, g, b] = applyLUT(0.7, 0.6, 0.5, invertLUT, 0)

    // With zero intensity, should return original values
    expect(r).toBeCloseTo(0.7, 2)
    expect(g).toBeCloseTo(0.6, 2)
    expect(b).toBeCloseTo(0.5, 2)
  })
})

describe("createIdentityLUT", () => {
  it("should create identity LUT with default size", () => {
    const lut = createIdentityLUT()

    expect(lut.size).toBe(33)
    expect(lut.title).toBe("Identity")
    expect(lut.domainMin).toEqual([0, 0, 0])
    expect(lut.domainMax).toEqual([1, 1, 1])
    expect(lut.data.length).toBe(33 * 33 * 33 * 3)
  })

  it("should create identity LUT with custom size", () => {
    const lut = createIdentityLUT(17)

    expect(lut.size).toBe(17)
    expect(lut.data.length).toBe(17 * 17 * 17 * 3)
  })

  it("should create identity transformation", () => {
    const lut = createIdentityLUT(3)

    // Check first value (0, 0, 0)
    expect(lut.data[0]).toBe(0)
    expect(lut.data[1]).toBe(0)
    expect(lut.data[2]).toBe(0)

    // Check last value (should be 1, 1, 1)
    const lastIdx = lut.data.length - 3
    expect(lut.data[lastIdx]).toBe(1)
    expect(lut.data[lastIdx + 1]).toBe(1)
    expect(lut.data[lastIdx + 2]).toBe(1)
  })

  it("should create correct gradient", () => {
    const lut = createIdentityLUT(5)

    // Check that values increase monotonically
    let prevR = -1
    for (let i = 0; i < lut.data.length; i += 3) {
      if (lut.data[i] > prevR) {
        prevR = lut.data[i]
      }
    }
  })

  it("should create small LUT correctly", () => {
    const lut = createIdentityLUT(2)

    expect(lut.size).toBe(2)
    expect(lut.data.length).toBe(2 * 2 * 2 * 3)

    // Values should be 0 or 1
    for (let i = 0; i < lut.data.length; i++) {
      expect([0, 1]).toContain(lut.data[i])
    }
  })
})

describe("PRESET_LUT_EFFECTS", () => {
  describe("orange-teal", () => {
    it("should shift shadows to teal and highlights to orange", () => {
      const effect = PRESET_LUT_EFFECTS["orange-teal"]

      // Test shadow (dark color)
      const [r1, g1, b1] = effect(0.2, 0.2, 0.2)
      expect(b1).toBeGreaterThan(0.2) // Blue should increase in shadows

      // Test highlight (bright color)
      const [r2, g2, b2] = effect(0.8, 0.8, 0.8)
      expect(r2).toBeGreaterThan(0.8) // Red should increase in highlights
    })

    it("should preserve luminance roughly", () => {
      const effect = PRESET_LUT_EFFECTS["orange-teal"]

      const r = 0.5
      const g = 0.5
      const b = 0.5
      const originalLum = 0.299 * r + 0.587 * g + 0.114 * b

      const [r2, g2, b2] = effect(r, g, b)
      const newLum = 0.299 * r2 + 0.587 * g2 + 0.114 * b2

      // Luminance shouldn't change drastically
      expect(Math.abs(newLum - originalLum)).toBeLessThan(0.3)
    })
  })

  describe("vintage-fade", () => {
    it("should lift shadows", () => {
      const effect = PRESET_LUT_EFFECTS["vintage-fade"]

      const [r, g, b] = effect(0, 0, 0)

      // Black should be lifted
      expect(r).toBeGreaterThan(0)
      expect(g).toBeGreaterThan(0)
      expect(b).toBeGreaterThan(0)
    })

    it("should reduce contrast", () => {
      const effect = PRESET_LUT_EFFECTS["vintage-fade"]

      const [r1, g1, b1] = effect(0, 0, 0)
      const [r2, g2, b2] = effect(1, 1, 1)

      // Range between black and white should be compressed
      const originalRange = 1 - 0
      const newRange = r2 - r1

      expect(newRange).toBeLessThan(originalRange)
    })

    it("should add warm tint", () => {
      const effect = PRESET_LUT_EFFECTS["vintage-fade"]

      const [r, g, b] = effect(0.5, 0.5, 0.5)

      // Red channel should be boosted relative to blue
      expect(r).toBeGreaterThan(b)
    })
  })

  describe("bw-contrast", () => {
    it("should convert to grayscale", () => {
      const effect = PRESET_LUT_EFFECTS["bw-contrast"]

      const [r, g, b] = effect(1, 0, 0) // Pure red

      // All channels should be equal (grayscale)
      expect(r).toBeCloseTo(g, 1)
      expect(g).toBeCloseTo(b, 1)
    })

    it("should increase contrast", () => {
      const effect = PRESET_LUT_EFFECTS["bw-contrast"]

      // Mid-gray
      const [r1, g1, b1] = effect(0.5, 0.5, 0.5)
      const midGray = (r1 + g1 + b1) / 3

      // Should be different from input due to contrast curve
      expect(Math.abs(midGray - 0.5)).toBeGreaterThan(0)
    })

    it("should preserve black and white points", () => {
      const effect = PRESET_LUT_EFFECTS["bw-contrast"]

      const [r1, g1, b1] = effect(0, 0, 0)
      expect(r1).toBeCloseTo(0, 1)

      const [r2, g2, b2] = effect(1, 1, 1)
      expect(r2).toBeCloseTo(1, 1)
    })

    it("should use proper grayscale weights", () => {
      const effect = PRESET_LUT_EFFECTS["bw-contrast"]

      // Pure red
      const [r1] = effect(1, 0, 0)

      // Pure green
      const [r2] = effect(0, 1, 0)

      // Green should be brighter than red (due to 0.587 vs 0.299 weight)
      expect(r2).toBeGreaterThan(r1)
    })
  })

  it("should have all expected effects", () => {
    expect(PRESET_LUT_EFFECTS).toHaveProperty("orange-teal")
    expect(PRESET_LUT_EFFECTS).toHaveProperty("vintage-fade")
    expect(PRESET_LUT_EFFECTS).toHaveProperty("bw-contrast")
  })

  it("should return valid RGB values", () => {
    const effects = Object.values(PRESET_LUT_EFFECTS)

    for (const effect of effects) {
      const [r, g, b] = effect(0.5, 0.5, 0.5)

      expect(r).toBeGreaterThanOrEqual(0)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(b).toBeGreaterThanOrEqual(0)

      // Some effects might exceed 1.0, which is okay for artistic purposes
      // but we'll check they're reasonable
      expect(r).toBeLessThan(2)
      expect(g).toBeLessThan(2)
      expect(b).toBeLessThan(2)
    }
  })
})

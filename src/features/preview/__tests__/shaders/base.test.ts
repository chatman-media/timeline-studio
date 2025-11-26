/**
 * Tests for Base Shaders
 * Тесты для базовых шейдеров preview
 */

import { describe, expect, it } from "vitest"

// Note: Since shaders are GLSL strings, we'll test their structure and validity
describe("Base Shaders", () => {
  describe("shader exports", () => {
    it("should export vertex shader", async () => {
      const shaders = await import("../../shaders/base")

      expect(shaders).toHaveProperty("vertexShaderSource")
      expect(typeof shaders.vertexShaderSource).toBe("string")
    })

    it("should export fragment shader", async () => {
      const shaders = await import("../../shaders/base")

      expect(shaders).toHaveProperty("fragmentShaderSource")
      expect(typeof shaders.fragmentShaderSource).toBe("string")
    })
  })

  describe("vertex shader", () => {
    it("should contain position attribute", async () => {
      const { vertexShaderSource } = await import("../../shaders/base")

      expect(vertexShaderSource).toContain("attribute")
      expect(vertexShaderSource).toContain("position")
    })

    it("should contain texture coordinate varying", async () => {
      const { vertexShaderSource } = await import("../../shaders/base")

      expect(vertexShaderSource).toContain("varying")
      expect(vertexShaderSource).toContain("vTexCoord")
    })

    it("should have main function", async () => {
      const { vertexShaderSource } = await import("../../shaders/base")

      expect(vertexShaderSource).toContain("void main()")
    })

    it("should set gl_Position", async () => {
      const { vertexShaderSource } = await import("../../shaders/base")

      expect(vertexShaderSource).toContain("gl_Position")
    })
  })

  describe("fragment shader", () => {
    it("should contain precision qualifier", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      expect(fragmentShaderSource).toContain("precision")
    })

    it("should contain texture uniform", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      expect(fragmentShaderSource).toContain("uniform")
      expect(fragmentShaderSource).toContain("sampler2D")
    })

    it("should contain texture coordinate varying", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      expect(fragmentShaderSource).toContain("varying")
      expect(fragmentShaderSource).toContain("vTexCoord")
    })

    it("should have main function", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      expect(fragmentShaderSource).toContain("void main()")
    })

    it("should set gl_FragColor", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      expect(fragmentShaderSource).toContain("gl_FragColor")
    })

    it("should use texture2D function", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      expect(fragmentShaderSource).toContain("texture2D")
    })
  })

  describe("shader structure", () => {
    it("should have valid GLSL syntax structure", async () => {
      const { vertexShaderSource, fragmentShaderSource } = await import("../../shaders/base")

      // Check for basic GLSL structure
      expect(vertexShaderSource).toMatch(/void\s+main\s*\(\s*\)/)
      expect(fragmentShaderSource).toMatch(/void\s+main\s*\(\s*\)/)
    })

    it("should properly close all braces", async () => {
      const { vertexShaderSource, fragmentShaderSource } = await import("../../shaders/base")

      const countBraces = (str: string) => {
        const open = (str.match(/{/g) || []).length
        const close = (str.match(/}/g) || []).length
        return { open, close }
      }

      const vertexBraces = countBraces(vertexShaderSource)
      const fragmentBraces = countBraces(fragmentShaderSource)

      expect(vertexBraces.open).toBe(vertexBraces.close)
      expect(fragmentBraces.open).toBe(fragmentBraces.close)
    })

    it("should use consistent semicolons", async () => {
      const { vertexShaderSource, fragmentShaderSource } = await import("../../shaders/base")

      // GLSL statements should end with semicolons
      expect(vertexShaderSource).toContain(";")
      expect(fragmentShaderSource).toContain(";")
    })
  })

  describe("shader compilation hints", () => {
    it("should not contain syntax errors", async () => {
      const { vertexShaderSource, fragmentShaderSource } = await import("../../shaders/base")

      // Check for common GLSL syntax errors
      expect(vertexShaderSource).not.toContain(";;") // Double semicolons
      expect(fragmentShaderSource).not.toContain(";;")

      expect(vertexShaderSource).not.toContain("{{") // Double braces
      expect(fragmentShaderSource).not.toContain("{{")
    })

    it("should have matching attribute/varying declarations", async () => {
      const { vertexShaderSource, fragmentShaderSource } = await import("../../shaders/base")

      // Find all varying declarations
      const varyingRegex = /varying\s+\w+\s+(\w+);/g
      const vertexVaryings = Array.from(vertexShaderSource.matchAll(varyingRegex), (m) => m[1])
      const fragmentVaryings = Array.from(fragmentShaderSource.matchAll(varyingRegex), (m) => m[1])

      // All varyings in fragment shader should be declared in vertex shader
      fragmentVaryings.forEach((varying) => {
        expect(vertexVaryings).toContain(varying)
      })
    })
  })

  describe("shader completeness", () => {
    it("should provide complete vertex shader", async () => {
      const { vertexShaderSource } = await import("../../shaders/base")

      // A complete vertex shader should have:
      // 1. At least one attribute
      // 2. Main function
      // 3. gl_Position assignment

      expect(vertexShaderSource).toMatch(/attribute/)
      expect(vertexShaderSource).toMatch(/void\s+main/)
      expect(vertexShaderSource).toMatch(/gl_Position/)
    })

    it("should provide complete fragment shader", async () => {
      const { fragmentShaderSource } = await import("../../shaders/base")

      // A complete fragment shader should have:
      // 1. Precision qualifier
      // 2. Main function
      // 3. gl_FragColor assignment

      expect(fragmentShaderSource).toMatch(/precision/)
      expect(fragmentShaderSource).toMatch(/void\s+main/)
      expect(fragmentShaderSource).toMatch(/gl_FragColor/)
    })
  })

  describe("shader length", () => {
    it("should have reasonable length", async () => {
      const { vertexShaderSource, fragmentShaderSource } = await import("../../shaders/base")

      // Basic shaders should not be empty and not be too large
      expect(vertexShaderSource.length).toBeGreaterThan(50)
      expect(vertexShaderSource.length).toBeLessThan(10000)

      expect(fragmentShaderSource.length).toBeGreaterThan(50)
      expect(fragmentShaderSource.length).toBeLessThan(10000)
    })
  })
})

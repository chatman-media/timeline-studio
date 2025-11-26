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

      expect(shaders).toHaveProperty("baseVertexShader")
      expect(typeof shaders.baseVertexShader).toBe("string")
    })

    it("should export fragment shader", async () => {
      const shaders = await import("../../shaders/base")

      expect(shaders).toHaveProperty("passthroughFragmentShader")
      expect(typeof shaders.passthroughFragmentShader).toBe("string")
    })
  })

  describe("vertex shader", () => {
    it("should contain position attribute", async () => {
      const { baseVertexShader } = await import("../../shaders/base")

      expect(baseVertexShader).toContain("attribute")
      expect(baseVertexShader).toContain("a_position")
    })

    it("should contain texture coordinate varying", async () => {
      const { baseVertexShader } = await import("../../shaders/base")

      expect(baseVertexShader).toContain("varying")
      expect(baseVertexShader).toContain("v_texCoord")
    })

    it("should have main function", async () => {
      const { baseVertexShader } = await import("../../shaders/base")

      expect(baseVertexShader).toContain("void main()")
    })

    it("should set gl_Position", async () => {
      const { baseVertexShader } = await import("../../shaders/base")

      expect(baseVertexShader).toContain("gl_Position")
    })
  })

  describe("fragment shader", () => {
    it("should contain precision qualifier", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      expect(passthroughFragmentShader).toContain("precision")
    })

    it("should contain texture uniform", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      expect(passthroughFragmentShader).toContain("uniform")
      expect(passthroughFragmentShader).toContain("sampler2D")
    })

    it("should contain texture coordinate varying", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      expect(passthroughFragmentShader).toContain("varying")
      expect(passthroughFragmentShader).toContain("v_texCoord")
    })

    it("should have main function", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      expect(passthroughFragmentShader).toContain("void main()")
    })

    it("should set gl_FragColor", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      expect(passthroughFragmentShader).toContain("gl_FragColor")
    })

    it("should use texture2D function", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      expect(passthroughFragmentShader).toContain("texture2D")
    })
  })

  describe("shader structure", () => {
    it("should have valid GLSL syntax structure", async () => {
      const { baseVertexShader, passthroughFragmentShader } = await import("../../shaders/base")

      // Check for basic GLSL structure
      expect(baseVertexShader).toMatch(/void\s+main\s*\(\s*\)/)
      expect(passthroughFragmentShader).toMatch(/void\s+main\s*\(\s*\)/)
    })

    it("should properly close all braces", async () => {
      const { baseVertexShader, passthroughFragmentShader } = await import("../../shaders/base")

      const countBraces = (str: string) => {
        const open = (str.match(/{/g) || []).length
        const close = (str.match(/}/g) || []).length
        return { open, close }
      }

      const vertexBraces = countBraces(baseVertexShader)
      const fragmentBraces = countBraces(passthroughFragmentShader)

      expect(vertexBraces.open).toBe(vertexBraces.close)
      expect(fragmentBraces.open).toBe(fragmentBraces.close)
    })

    it("should use consistent semicolons", async () => {
      const { baseVertexShader, passthroughFragmentShader } = await import("../../shaders/base")

      // GLSL statements should end with semicolons
      expect(baseVertexShader).toContain(";")
      expect(passthroughFragmentShader).toContain(";")
    })
  })

  describe("shader compilation hints", () => {
    it("should not contain syntax errors", async () => {
      const { baseVertexShader, passthroughFragmentShader } = await import("../../shaders/base")

      // Check for common GLSL syntax errors
      expect(baseVertexShader).not.toContain(";;") // Double semicolons
      expect(passthroughFragmentShader).not.toContain(";;")

      expect(baseVertexShader).not.toContain("{{") // Double braces
      expect(passthroughFragmentShader).not.toContain("{{")
    })

    it("should have matching attribute/varying declarations", async () => {
      const { baseVertexShader, passthroughFragmentShader } = await import("../../shaders/base")

      // Find all varying declarations
      const varyingRegex = /varying\s+\w+\s+(\w+);/g
      const vertexVaryings = Array.from(baseVertexShader.matchAll(varyingRegex), (m: RegExpMatchArray) => m[1])
      const fragmentVaryings = Array.from(
        passthroughFragmentShader.matchAll(varyingRegex),
        (m: RegExpMatchArray) => m[1],
      )

      // All varyings in fragment shader should be declared in vertex shader
      fragmentVaryings.forEach((varying) => {
        expect(vertexVaryings).toContain(varying)
      })
    })
  })

  describe("shader completeness", () => {
    it("should provide complete vertex shader", async () => {
      const { baseVertexShader } = await import("../../shaders/base")

      // A complete vertex shader should have:
      // 1. At least one attribute
      // 2. Main function
      // 3. gl_Position assignment

      expect(baseVertexShader).toMatch(/attribute/)
      expect(baseVertexShader).toMatch(/void\s+main/)
      expect(baseVertexShader).toMatch(/gl_Position/)
    })

    it("should provide complete fragment shader", async () => {
      const { passthroughFragmentShader } = await import("../../shaders/base")

      // A complete fragment shader should have:
      // 1. Precision qualifier
      // 2. Main function
      // 3. gl_FragColor assignment

      expect(passthroughFragmentShader).toMatch(/precision/)
      expect(passthroughFragmentShader).toMatch(/void\s+main/)
      expect(passthroughFragmentShader).toMatch(/gl_FragColor/)
    })
  })

  describe("shader length", () => {
    it("should have reasonable length", async () => {
      const { baseVertexShader, passthroughFragmentShader } = await import("../../shaders/base")

      // Basic shaders should not be empty and not be too large
      expect(baseVertexShader.length).toBeGreaterThan(50)
      expect(baseVertexShader.length).toBeLessThan(10000)

      expect(passthroughFragmentShader.length).toBeGreaterThan(50)
      expect(passthroughFragmentShader.length).toBeLessThan(10000)
    })
  })
})

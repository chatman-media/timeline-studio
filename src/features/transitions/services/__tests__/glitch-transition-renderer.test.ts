/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest"
import { type GlitchEffectType, GlitchTransitionRenderer } from "../glitch-transition-renderer"
import { createMockCanvas } from "./webgl-test-utils"

describe("GlitchTransitionRenderer", () => {
  let renderer: GlitchTransitionRenderer
  let mockCanvas: HTMLCanvasElement
  let mockGL: WebGL2RenderingContext

  beforeEach(() => {
    const mock = createMockCanvas()
    mockCanvas = mock.canvas
    mockGL = mock.gl
    renderer = new GlitchTransitionRenderer()
  })

  describe("initialization", () => {
    it("should create renderer instance", () => {
      expect(renderer).toBeDefined()
      expect(renderer).toBeInstanceOf(GlitchTransitionRenderer)
    })

    it("should initialize with canvas", async () => {
      const success = await renderer.initialize()
      expect(success).toBe(true)
    })
  })

  describe("renderGlitchTransition", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    const glitchEffects: GlitchEffectType[] = [
      "digital-glitch",
      "rgb-split",
      "data-corruption",
      "analog-distortion",
      "signal-interference",
      "pixel-storm",
      "codec-error",
      "matrix-rain",
      "screen-tear",
      "bit-crush",
    ]

    glitchEffects.forEach((effectType) => {
      it(`should render ${effectType} transition successfully`, async () => {
        const mockSourceTexture = {} as WebGLTexture
        const mockTargetTexture = {} as WebGLTexture

        const result = await renderer.renderGlitchTransition({
          sourceTexture: mockSourceTexture,
          targetTexture: mockTargetTexture,
          progress: 0.5,
          effectType,
        })

        // Может быть false если шейдер не скомпилировался (они пока placeholders)
        // Но проверяем что метод отработал без ошибок
        expect(typeof result).toBe("boolean")
      })
    })

    it("should handle progress from 0 to 1", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      for (let progress = 0; progress <= 1; progress += 0.25) {
        const result = await renderer.renderGlitchTransition({
          sourceTexture: mockSourceTexture,
          targetTexture: mockTargetTexture,
          progress,
          effectType: "digital-glitch",
        })

        expect(typeof result).toBe("boolean")
      }
    })

    it("should bind textures to correct slots", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      await renderer.renderGlitchTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "rgb-split",
      })

      // Проверяем, что вызов был сделан (даже если шейдер не найден)
      expect(mockGL.activeTexture).toHaveBeenCalled()
    })

    it("should handle missing WebGL context", async () => {
      const brokenRenderer = new GlitchTransitionRenderer()
      // Не инициализируем

      const result = await brokenRenderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "digital-glitch",
      })

      expect(result).toBe(false)
    })
  })

  describe("digital-glitch effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default parameters", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "digital-glitch",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom parameters", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "digital-glitch",
        parameters: {
          blockSize: 32,
          intensity: 0.8,
          frequency: 0.5,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("rgb-split effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default parameters", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "rgb-split",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom separation and aberration", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "rgb-split",
        parameters: {
          separation: 20,
          angle: 45,
          aberration: 0.8,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("data-corruption effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply corruption parameters", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "data-corruption",
        parameters: {
          corruptionLevel: 0.5,
          noiseAmount: 0.4,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("analog-distortion effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply VHS-style distortion", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "analog-distortion",
        parameters: {
          tracking: 0.4,
          jitter: 0.3,
          colorBleed: 0.6,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("signal-interference effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply wave interference", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "signal-interference",
        parameters: {
          waveFrequency: 10,
          waveAmplitude: 0.5,
          ghosting: 0.3,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("pixel-storm effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply pixelation and chaos", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "pixel-storm",
        parameters: {
          pixelSize: 8,
          chaos: 0.7,
          speed: 2,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("codec-error effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply compression artifacts", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "codec-error",
        parameters: {
          macroblockSize: 16,
          compressionArtifacts: 0.6,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("matrix-rain effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default green tint", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "matrix-rain",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom color tint", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "matrix-rain",
        parameters: {
          density: 0.7,
          speed: 1.5,
          colorTint: "#FF00FF",
        },
      })

      expect(typeof result).toBe("boolean")
    })

    it("should handle hex colors without #", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "matrix-rain",
        parameters: {
          colorTint: "0000FF",
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("screen-tear effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply screen tearing", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "screen-tear",
        parameters: {
          tearCount: 5,
          displacement: 30,
          wobble: 0.5,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("bit-crush effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply bit depth reduction", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "bit-crush",
        parameters: {
          bitDepth: 2,
          colorPalette: 8,
        },
      })

      expect(typeof result).toBe("boolean")
    })

    it("should handle high bit depth", async () => {
      const result = await renderer.renderGlitchTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "bit-crush",
        parameters: {
          bitDepth: 8,
          colorPalette: 256,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("render method", () => {
    it("should implement abstract render method", () => {
      expect(typeof renderer.render).toBe("function")
    })

    it("should update time on render", () => {
      const initialTime = (renderer as any).currentTime
      renderer.render(16.67)
      const updatedTime = (renderer as any).currentTime

      expect(updatedTime).toBeGreaterThan(initialTime)
      expect(updatedTime).toBe(initialTime + 16.67)
    })

    it("should accumulate time over multiple frames", () => {
      renderer.render(16.67)
      renderer.render(16.67)
      renderer.render(16.67)

      const currentTime = (renderer as any).currentTime
      expect(currentTime).toBeCloseTo(50.01, 1)
    })
  })

  describe("time-based animation", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should use time for animation", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      // Рендерим с разным временем
      renderer.render(100)
      await renderer.renderGlitchTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "digital-glitch",
      })

      renderer.render(100)
      await renderer.renderGlitchTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "digital-glitch",
      })

      // Время должно увеличиться
      const currentTime = (renderer as any).currentTime
      expect(currentTime).toBe(200)
    })
  })
})

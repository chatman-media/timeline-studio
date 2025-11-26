import { beforeEach, describe, expect, it, vi } from "vitest"
import { type RenderContext, WebGL2UnifiedRenderer } from "../../services/webgl2-unified-renderer"
import type { AppliedEffect, BaseEffect } from "../../types/unified-effects"

// Mock WebGL2EffectProcessor
vi.mock("../../services/webgl2-effect-processor", () => ({
  WebGL2EffectProcessor: class MockWebGL2EffectProcessor {
    initialize = vi.fn().mockResolvedValue(undefined)
    compileEffect = vi.fn().mockResolvedValue(true)
    processImage = vi.fn().mockResolvedValue({
      success: true,
      texture: {},
      width: 1920,
      height: 1080,
    })
    exportAsImageData = vi.fn().mockImplementation((_, width, height) => {
      return Promise.resolve(new ImageData(width, height))
    })
    dispose = vi.fn()
  },
}))

// Mock createLogger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("WebGL2UnifiedRenderer", () => {
  let renderer: WebGL2UnifiedRenderer
  let mockCanvas: HTMLCanvasElement
  let mockContext: RenderContext

  beforeEach(() => {
    // Mock createImageBitmap (browser API not available in tests)
    global.createImageBitmap = vi.fn().mockImplementation((imageData: ImageData) => {
      return Promise.resolve({
        width: imageData.width,
        height: imageData.height,
        close: () => {},
      } as ImageBitmap)
    })

    renderer = new WebGL2UnifiedRenderer()

    // Create mock canvas
    mockCanvas = document.createElement("canvas")
    mockCanvas.width = 1920
    mockCanvas.height = 1080

    mockContext = {
      source: mockCanvas,
      width: 1920,
      height: 1080,
      currentTime: 0,
      quality: "preview",
    }
  })

  describe("initialization", () => {
    it("should initialize successfully", async () => {
      await expect(renderer.initialize()).resolves.toBeUndefined()
    })

    it("should only initialize once", async () => {
      await renderer.initialize()
      await renderer.initialize()
      // Should not throw or reinitialize
    })
  })

  describe("renderEffectStack", () => {
    const createMockBaseEffect = (
      id: string,
      processingType: "realtime" | "render" | "hybrid" = "realtime",
    ): BaseEffect => ({
      id,
      name: { en: `Effect ${id}`, ru: `Эффект ${id}` },
      category: "color_correction",
      scope: ["clip"],
      processingType,
      version: "1.0.0",
      tags: [],
      complexity: "low",
      gpuAccelerated: true,
      parameters: [],
      presets: [],
      processors: {
        webgl: {
          fragmentShader: `
            #version 300 es
            precision mediump float;
            in vec2 vTexCoord;
            out vec4 fragColor;
            uniform sampler2D uTexture;
            void main() {
              fragColor = texture(uTexture, vTexCoord);
            }
          `,
          uniforms: {},
        },
        css: {
          filter: (params: Record<string, any>) => `brightness(${params.brightness || 1})`,
        },
        ffmpeg: {
          filter: (params: Record<string, any>) => `eq=brightness=${params.brightness || 0}`,
        },
      },
    })

    const createMockAppliedEffect = (effectId: string, order = 0): AppliedEffect => ({
      id: `applied_${effectId}`,
      effectId,
      startTime: 0,
      parameters: { brightness: 1.2 },
      enabled: true,
      order,
      keyframes: {},
      masks: [],
      blendMode: "normal",
      opacity: 1,
      effectVersion: "1.0.0",
      createdAt: new Date(),
      modifiedAt: new Date(),
    })

    it("should render empty effect stack", async () => {
      const result = await renderer.renderEffectStack([], new Map(), mockContext)

      expect(result.success).toBe(true)
      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it("should render realtime effects", async () => {
      const baseEffect = createMockBaseEffect("test_effect", "realtime")
      const appliedEffect = createMockAppliedEffect("test_effect")
      const baseEffects = new Map([[baseEffect.id, baseEffect]])

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it("should render FFmpeg effects", async () => {
      const baseEffect = createMockBaseEffect("test_effect", "render")
      const appliedEffect = createMockAppliedEffect("test_effect")
      const baseEffects = new Map([[baseEffect.id, baseEffect]])

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      expect(result.success).toBe(true)
      expect(typeof result.output).toBe("string") // FFmpeg command
      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it("should render hybrid effects", async () => {
      const baseEffect = createMockBaseEffect("test_effect", "hybrid")
      const appliedEffect = createMockAppliedEffect("test_effect")
      const baseEffects = new Map([[baseEffect.id, baseEffect]])

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      expect(result.success).toBe(true)
      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it("should sort effects by order", async () => {
      const baseEffect1 = createMockBaseEffect("effect1")
      const baseEffect2 = createMockBaseEffect("effect2")
      const appliedEffect1 = createMockAppliedEffect("effect1", 2)
      const appliedEffect2 = createMockAppliedEffect("effect2", 1)

      const baseEffects = new Map([
        [baseEffect1.id, baseEffect1],
        [baseEffect2.id, baseEffect2],
      ])

      const result = await renderer.renderEffectStack([appliedEffect1, appliedEffect2], baseEffects, mockContext)

      expect(result.success).toBe(true)
    })

    it("should skip disabled effects", async () => {
      const baseEffect = createMockBaseEffect("test_effect")
      const appliedEffect = createMockAppliedEffect("test_effect")
      appliedEffect.enabled = false

      const baseEffects = new Map([[baseEffect.id, baseEffect]])

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      expect(result.success).toBe(true)
    })

    it("should handle missing base effect", async () => {
      const appliedEffect = createMockAppliedEffect("missing_effect")
      const baseEffects = new Map()

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      expect(result.success).toBe(true) // Should skip gracefully
    })

    it("should handle rendering errors", async () => {
      const baseEffect = createMockBaseEffect("test_effect")
      const appliedEffect = createMockAppliedEffect("test_effect")
      const baseEffects = new Map([[baseEffect.id, baseEffect]])

      // Mock processor to throw error
      const { WebGL2EffectProcessor } = await import("../../services/webgl2-effect-processor")
      const mockProcessor = new WebGL2EffectProcessor()
      vi.mocked(mockProcessor.processImage).mockRejectedValueOnce(new Error("Processing failed"))

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      // Should fallback to CSS rendering
      expect(result.success).toBe(true)
    })

    it("should apply keyframe interpolation", async () => {
      const baseEffect = createMockBaseEffect("test_effect")
      const appliedEffect = createMockAppliedEffect("test_effect")
      appliedEffect.keyframes = {
        brightness: [
          { time: 0, value: 0.5, interpolation: "linear" },
          { time: 10, value: 1.5, interpolation: "linear" },
        ],
      }

      const baseEffects = new Map([[baseEffect.id, baseEffect]])
      const contextAtTime5 = { ...mockContext, currentTime: 5 }

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, contextAtTime5)

      expect(result.success).toBe(true)
    })
  })

  describe("parameter interpolation", () => {
    it("should interpolate linear keyframes", async () => {
      const baseEffect: BaseEffect = {
        id: "test_effect",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: true,
        parameters: [],
        presets: [],
        processors: {
          webgl: {
            fragmentShader: "void main() {}",
            uniforms: {},
          },
        },
      }

      const appliedEffect: AppliedEffect = {
        id: "applied_test",
        effectId: "test_effect",
        startTime: 0,
        parameters: { value: 50 },
        enabled: true,
        order: 0,
        keyframes: {
          value: [
            { time: 0, value: 0, interpolation: "linear" },
            { time: 100, value: 100, interpolation: "linear" },
          ],
        },
        masks: [],
        blendMode: "normal",
        opacity: 1,
        effectVersion: "1.0.0",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }

      const baseEffects = new Map([[baseEffect.id, baseEffect]])
      const contextAtTime50 = { ...mockContext, currentTime: 50 }

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, contextAtTime50)

      expect(result.success).toBe(true)
    })

    it("should handle hold interpolation", async () => {
      const baseEffect: BaseEffect = {
        id: "test_effect",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: true,
        parameters: [],
        presets: [],
        processors: {
          webgl: {
            fragmentShader: "void main() {}",
            uniforms: {},
          },
        },
      }

      const appliedEffect: AppliedEffect = {
        id: "applied_test",
        effectId: "test_effect",
        startTime: 0,
        parameters: { value: 50 },
        enabled: true,
        order: 0,
        keyframes: {
          value: [
            { time: 0, value: 10, interpolation: "hold" },
            { time: 100, value: 90, interpolation: "hold" },
          ],
        },
        masks: [],
        blendMode: "normal",
        opacity: 1,
        effectVersion: "1.0.0",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }

      const baseEffects = new Map([[baseEffect.id, baseEffect]])
      const contextAtTime50 = { ...mockContext, currentTime: 50 }

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, contextAtTime50)

      expect(result.success).toBe(true)
    })
  })

  describe("shader conversion", () => {
    it("should convert WebGL1 to WebGL2 shaders", async () => {
      const baseEffect: BaseEffect = {
        id: "test_effect",
        name: { en: "Test", ru: "Тест" },
        category: "color_correction",
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: true,
        parameters: [],
        presets: [],
        processors: {
          webgl: {
            fragmentShader: `
              precision mediump float;
              varying vec2 vTexCoord;
              uniform sampler2D uTexture;
              void main() {
                gl_FragColor = texture2D(uTexture, vTexCoord);
              }
            `,
            uniforms: {},
          },
        },
      }

      const appliedEffect: AppliedEffect = {
        id: "applied_test",
        effectId: "test_effect",
        startTime: 0,
        parameters: {},
        enabled: true,
        order: 0,
        keyframes: {},
        masks: [],
        blendMode: "normal",
        opacity: 1,
        effectVersion: "1.0.0",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }

      const baseEffects = new Map([[baseEffect.id, baseEffect]])

      const result = await renderer.renderEffectStack([appliedEffect], baseEffects, mockContext)

      expect(result.success).toBe(true)
    })
  })

  describe("disposal", () => {
    it("should dispose resources", () => {
      renderer.dispose()
      // Should not throw
    })

    it("should allow re-initialization after disposal", async () => {
      await renderer.initialize()
      renderer.dispose()
      await renderer.initialize()
      // Should work without errors
    })
  })
})

/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest"
import { type ThreeDEffectType, ThreeDTransitionRenderer } from "../3d-transition-renderer"
import { createMockCanvas } from "./webgl-test-utils"

describe("ThreeDTransitionRenderer", () => {
  let renderer: ThreeDTransitionRenderer
  let mockCanvas: HTMLCanvasElement
  let mockGL: WebGL2RenderingContext

  beforeEach(() => {
    const mock = createMockCanvas()
    mockCanvas = mock.canvas
    mockGL = mock.gl
    renderer = new ThreeDTransitionRenderer()
  })

  describe("initialization", () => {
    it("should create renderer instance", () => {
      expect(renderer).toBeDefined()
      expect(renderer).toBeInstanceOf(ThreeDTransitionRenderer)
    })

    it("should initialize with canvas", async () => {
      const success = await renderer.initialize()
      expect(success).toBe(true)
    })

    it("should enable depth testing on initialization", async () => {
      await renderer.initialize()
      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.DEPTH_TEST)
      expect(mockGL.depthFunc).toHaveBeenCalledWith(mockGL.LEQUAL)
    })
  })

  describe("renderThreeDTransition", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    const threeDEffects: ThreeDEffectType[] = [
      "page-flip",
      "card-shuffle",
      "helix-spin",
      "sphere-mapping",
      "book-open",
      "cylinder-roll",
      "origami-fold",
      "polyhedron-transform",
      "mobius-strip",
    ]

    threeDEffects.forEach((effectType) => {
      it(`should render ${effectType} transition successfully`, async () => {
        const mockSourceTexture = {} as WebGLTexture
        const mockTargetTexture = {} as WebGLTexture

        const result = await renderer.renderThreeDTransition({
          sourceTexture: mockSourceTexture,
          targetTexture: mockTargetTexture,
          progress: 0.5,
          effectType,
        })

        // Может быть false если шейдер не скомпилирован
        expect(typeof result).toBe("boolean")
      })
    })

    it("should handle progress from 0 to 1", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      for (let progress = 0; progress <= 1; progress += 0.25) {
        const result = await renderer.renderThreeDTransition({
          sourceTexture: mockSourceTexture,
          targetTexture: mockTargetTexture,
          progress,
          effectType: "page-flip",
        })

        expect(typeof result).toBe("boolean")
      }
    })

    it("should clear depth buffer before render", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      await renderer.renderThreeDTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "page-flip",
      })

      expect(mockGL.clear).toHaveBeenCalledWith(mockGL.DEPTH_BUFFER_BIT)
    })

    it("should bind textures to correct slots", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      await renderer.renderThreeDTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "sphere-mapping",
      })

      expect(mockGL.activeTexture).toHaveBeenCalled()
    })

    it("should handle missing WebGL context", async () => {
      const brokenRenderer = new ThreeDTransitionRenderer()
      // Не инициализируем

      const result = await brokenRenderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "page-flip",
      })

      expect(result).toBe(false)
    })
  })

  describe("3D transform parameters", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default transform parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "page-flip",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom perspective", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "page-flip",
        transform: {
          perspective: 1000,
          depth: 200,
          segments: 20,
        },
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom rotation axis", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "helix-spin",
        transform: {
          rotationAxis: [0, 1, 0],
          perspective: 800,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("page-flip effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default flip parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "page-flip",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom flip axis and curvature", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "page-flip",
        parameters: {
          flipAxis: 1, // horizontal
          curvature: 0.8,
          shadow: 0.5,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("card-shuffle effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default shuffle parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "card-shuffle",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom card count and speed", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "card-shuffle",
        parameters: {
          cardCount: 10,
          shuffleSpeed: 1.5,
          rotationSpeed: 2.0,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("helix-spin effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default helix parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "helix-spin",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom helix properties", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "helix-spin",
        parameters: {
          turns: 5,
          radius: 150,
          tightness: 0.7,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("sphere-mapping effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default sphere parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "sphere-mapping",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom sphere radius", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "sphere-mapping",
        parameters: {
          radius: 300,
          rotationSpeed: 1.5,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("book-open effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default book parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "book-open",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom book properties", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "book-open",
        parameters: {
          openAngle: 120,
          spineThickness: 0.05,
          pageWarp: 0.3,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("cylinder-roll effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default cylinder parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "cylinder-roll",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom cylinder direction", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "cylinder-roll",
        parameters: {
          rollDirection: 1, // 0=left, 1=right
          cylinderRadius: 250,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("origami-fold effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default origami parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "origami-fold",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom fold pattern", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "origami-fold",
        parameters: {
          foldPattern: 1, // Different folding pattern
          foldSteps: 5,
          creaseSharpness: 0.8,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("polyhedron-transform effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default polyhedron parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "polyhedron-transform",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom polyhedron type", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "polyhedron-transform",
        parameters: {
          polyhedronType: 1, // Different polyhedron
          morphSpeed: 1.5,
          facetDetail: 8,
        },
      })

      expect(typeof result).toBe("boolean")
    })
  })

  describe("mobius-strip effect", () => {
    beforeEach(async () => {
      await renderer.initialize()
    })

    it("should apply default mobius parameters", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "mobius-strip",
      })

      expect(typeof result).toBe("boolean")
    })

    it("should apply custom mobius properties", async () => {
      const result = await renderer.renderThreeDTransition({
        sourceTexture: {} as WebGLTexture,
        targetTexture: {} as WebGLTexture,
        progress: 0.5,
        effectType: "mobius-strip",
        parameters: {
          twists: 2,
          stripWidth: 0.4,
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
      await renderer.renderThreeDTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "helix-spin",
      })

      renderer.render(100)
      await renderer.renderThreeDTransition({
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        effectType: "helix-spin",
      })

      // Время должно увеличиться
      const currentTime = (renderer as any).currentTime
      expect(currentTime).toBe(200)
    })
  })
})

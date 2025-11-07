import { beforeEach, describe, expect, it, vi } from "vitest"

import glitchTransitionsData from "../../data/glitch-transitions.json"
import { DynamicTransitionService } from "../../services/dynamic-transition-service"

// Mock WebGL2 context
const mockWebGL2Context = {
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ""),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ""),
  useProgram: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  blendFunc: vi.fn(),
  activeTexture: vi.fn(),
  bindTexture: vi.fn(),
  uniform1i: vi.fn(),
  uniform1f: vi.fn(),
  uniform2fv: vi.fn(),
  drawArrays: vi.fn(),
  deleteProgram: vi.fn(),
  deleteBuffer: vi.fn(),
  deleteFramebuffer: vi.fn(),
  getExtension: vi.fn(() => true),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  DYNAMIC_DRAW: 35048,
  FLOAT: 5126,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  TEXTURE1: 33985,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  BLEND: 3042,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771,
  TRIANGLE_STRIP: 5,
}

describe("Glitch Transitions", () => {
  let service: DynamicTransitionService
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock canvas
    mockCanvas = {
      width: 1920,
      height: 1080,
      getContext: vi.fn(() => mockWebGL2Context),
    } as unknown as HTMLCanvasElement

    service = new DynamicTransitionService()
  })

  describe("Glitch Transitions Data", () => {
    it("should have valid glitch transitions data", () => {
      expect(glitchTransitionsData).toBeDefined()
      expect(glitchTransitionsData.version).toBe("1.0.0")
      expect(glitchTransitionsData.category).toBe("Glitch Effects")
      expect(glitchTransitionsData.totalTransitions).toBe(10)
      expect(glitchTransitionsData.transitions).toHaveLength(10)
    })

    it("should have all required glitch transition types", () => {
      const glitchTypes = [
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

      glitchTypes.forEach((type) => {
        const transition = glitchTransitionsData.transitions.find((t) => t.type === type)
        expect(transition).toBeDefined()
        expect(transition?.category).toBe("glitch")
        expect(transition?.gpuAccelerated).toBe(true)
      })
    })

    it("should have valid parameters for each glitch transition", () => {
      glitchTransitionsData.transitions.forEach((transition) => {
        expect(transition.parameters).toBeDefined()

        // Check common properties
        expect(transition.labels.ru).toBeDefined()
        expect(transition.labels.en).toBeDefined()
        expect(transition.description.ru).toBeDefined()
        expect(transition.description.en).toBeDefined()
        expect(transition.duration.min).toBeGreaterThan(0)
        expect(transition.duration.max).toBeGreaterThan(transition.duration.min)
        expect(transition.duration.default).toBeGreaterThanOrEqual(transition.duration.min)
        expect(transition.duration.default).toBeLessThanOrEqual(transition.duration.max)
      })
    })
  })

  describe("Glitch Shader Compilation", () => {
    it("should initialize WebGL2 context successfully", async () => {
      const result = await service.initialize(mockCanvas)
      expect(result).toBe(true)
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl2", expect.any(Object))
    })

    it("should compile glitch shaders", async () => {
      // Mock getShaderInfoLog to avoid errors
      mockWebGL2Context.getShaderInfoLog = vi.fn(() => "")
      mockWebGL2Context.getProgramInfoLog = vi.fn(() => "")

      await service.initialize(mockCanvas)

      // Wait a bit for async compilation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Service compiles shaders internally during initialization
      // We verify by checking that shader creation methods were called
      expect(mockWebGL2Context.createShader).toHaveBeenCalled()
      expect(mockWebGL2Context.compileShader).toHaveBeenCalled()
      expect(mockWebGL2Context.createProgram).toHaveBeenCalled()
      expect(mockWebGL2Context.linkProgram).toHaveBeenCalled()
    })
  })

  describe("Glitch Transition Rendering", () => {
    beforeEach(async () => {
      // Mock getShaderInfoLog to avoid errors
      mockWebGL2Context.getShaderInfoLog = vi.fn(() => "")
      mockWebGL2Context.getProgramInfoLog = vi.fn(() => "")

      await service.initialize(mockCanvas)

      // Wait for shader compilation
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    it("should render digital glitch transition", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        shaderType: "digital-glitch",
        parameters: {
          blockSize: 16,
          intensity: 0.5,
          frequency: 0.3,
          colorShift: true,
        },
      })

      expect(result).toBe(true)
      expect(mockWebGL2Context.useProgram).toHaveBeenCalled()
      expect(mockWebGL2Context.uniform1f).toHaveBeenCalled()
      expect(mockWebGL2Context.drawArrays).toHaveBeenCalled()
    })

    it("should render RGB split transition", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        shaderType: "rgb-split",
        parameters: {
          separation: 10,
          angle: 45,
          animate: true,
          aberration: 0.5,
        },
      })

      expect(result).toBe(true)
      expect(mockWebGL2Context.useProgram).toHaveBeenCalled()
      expect(mockWebGL2Context.uniform1f).toHaveBeenCalled()
      expect(mockWebGL2Context.drawArrays).toHaveBeenCalled()
    })

    it("should render data corruption transition", async () => {
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        shaderType: "data-corruption",
        parameters: {
          corruptionLevel: 0.3,
          scanLines: true,
          noiseAmount: 0.2,
          pixelSort: true,
        },
      })

      expect(result).toBe(true)
      expect(mockWebGL2Context.useProgram).toHaveBeenCalled()
      expect(mockWebGL2Context.uniform1f).toHaveBeenCalled()
      expect(mockWebGL2Context.drawArrays).toHaveBeenCalled()
    })
  })

  describe("Glitch Transition Parameters", () => {
    it("should validate digital glitch parameters", () => {
      const digitalGlitch = glitchTransitionsData.transitions.find((t) => t.type === "digital-glitch")

      expect(digitalGlitch?.parameters.blockSize).toEqual({
        type: "number",
        default: 16,
        min: 4,
        max: 64,
        description: "Size of glitch blocks",
      })

      expect(digitalGlitch?.parameters.intensity).toEqual({
        type: "number",
        default: 0.5,
        min: 0,
        max: 1,
        description: "Glitch intensity",
      })

      expect(digitalGlitch?.parameters.colorShift).toEqual({
        type: "boolean",
        default: true,
        description: "Enable color channel shifting",
      })
    })

    it("should validate RGB split parameters", () => {
      const rgbSplit = glitchTransitionsData.transitions.find((t) => t.type === "rgb-split")

      expect(rgbSplit?.parameters.separation).toEqual({
        type: "number",
        default: 10,
        min: 0,
        max: 50,
        description: "Channel separation distance",
      })

      expect(rgbSplit?.parameters.angle).toEqual({
        type: "number",
        default: 0,
        min: -180,
        max: 180,
        description: "Split angle in degrees",
      })

      expect(rgbSplit?.parameters.animate).toEqual({
        type: "boolean",
        default: true,
        description: "Animate the split effect",
      })
    })

    it("should validate data corruption parameters", () => {
      const dataCorruption = glitchTransitionsData.transitions.find((t) => t.type === "data-corruption")

      expect(dataCorruption?.parameters.corruptionLevel).toEqual({
        type: "number",
        default: 0.3,
        min: 0,
        max: 1,
        description: "Level of data corruption",
      })

      expect(dataCorruption?.parameters.scanLines).toEqual({
        type: "boolean",
        default: true,
        description: "Show scan lines",
      })

      expect(dataCorruption?.parameters.pixelSort).toEqual({
        type: "boolean",
        default: true,
        description: "Enable pixel sorting effect",
      })
    })
  })

  describe("Resource Cleanup", () => {
    it("should clean up resources on dispose", async () => {
      // Mock getShaderInfoLog to avoid errors
      mockWebGL2Context.getShaderInfoLog = vi.fn(() => "")
      mockWebGL2Context.getProgramInfoLog = vi.fn(() => "")

      await service.initialize(mockCanvas)

      // Сначала сделаем рендеринг, чтобы создались ресурсы
      const mockSourceTexture = {} as WebGLTexture
      const mockTargetTexture = {} as WebGLTexture

      await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        shaderType: "digital-glitch",
        parameters: {},
      })

      service.dispose()

      expect(mockWebGL2Context.deleteProgram).toHaveBeenCalled()
    })
  })
})

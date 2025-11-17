/**
 * WebGL Transition Service Tests
 *
 * Tests for WebGL-based transition rendering
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { WebGLTransitionService } from "../webgl-transition-service"

// Mock WebGL context
const createMockWebGLContext = (): Partial<WebGLRenderingContext> => {
  const textures: WebGLTexture[] = []
  const programs: WebGLProgram[] = []
  const shaders: WebGLShader[] = []
  const buffers: WebGLBuffer[] = []

  return {
    // Constants
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    TEXTURE_2D: 0x0de1,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    CLAMP_TO_EDGE: 0x812f,
    LINEAR: 0x2601,
    COLOR_BUFFER_BIT: 0x4000,
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    FLOAT: 0x1406,
    TRIANGLE_STRIP: 0x0005,

    // Texture methods
    createTexture: vi.fn(() => {
      const texture = { __webglTexture: true } as unknown as WebGLTexture
      textures.push(texture)
      return texture
    }),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    deleteTexture: vi.fn((texture: WebGLTexture) => {
      const index = textures.indexOf(texture)
      if (index > -1) textures.splice(index, 1)
    }),

    // Program methods
    createProgram: vi.fn(() => {
      const program = { __webglProgram: true } as unknown as WebGLProgram
      programs.push(program)
      return program
    }),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    deleteProgram: vi.fn((program: WebGLProgram) => {
      const index = programs.indexOf(program)
      if (index > -1) programs.splice(index, 1)
    }),

    // Shader methods
    createShader: vi.fn((type: number) => {
      const shader = { __webglShader: true, type } as unknown as WebGLShader
      shaders.push(shader)
      return shader
    }),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    deleteShader: vi.fn((shader: WebGLShader) => {
      const index = shaders.indexOf(shader)
      if (index > -1) shaders.splice(index, 1)
    }),

    // Buffer methods
    createBuffer: vi.fn(() => {
      const buffer = { __webglBuffer: true } as unknown as WebGLBuffer
      buffers.push(buffer)
      return buffer
    }),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn((buffer: WebGLBuffer) => {
      const index = buffers.indexOf(buffer)
      if (index > -1) buffers.splice(index, 1)
    }),

    // Uniform/Attribute methods
    getUniformLocation: vi.fn(() => ({ __webglUniformLocation: true })),
    getAttribLocation: vi.fn(() => 0),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),

    // Rendering methods
    clearColor: vi.fn(),
    clear: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    activeTexture: vi.fn(),

    // Error methods
    getError: vi.fn(() => 0), // NO_ERROR
  }
}

describe("WebGLTransitionService", () => {
  let service: WebGLTransitionService
  let mockCanvas: HTMLCanvasElement
  let mockGl: Partial<WebGLRenderingContext>

  beforeEach(() => {
    service = new WebGLTransitionService()
    mockCanvas = document.createElement("canvas")
    mockCanvas.width = 1920
    mockCanvas.height = 1080
    mockGl = createMockWebGLContext()

    // Mock getContext to return our mock WebGL context
    vi.spyOn(mockCanvas, "getContext").mockImplementation((contextId: string) => {
      if (contextId === "webgl" || contextId === "experimental-webgl") {
        return mockGl as WebGLRenderingContext
      }
      return null
    })
  })

  afterEach(() => {
    service.dispose()
    vi.restoreAllMocks()
  })

  describe("Initialization", () => {
    it("should initialize with valid canvas", () => {
      const result = service.initialize(mockCanvas)
      expect(result).toBe(true)
    })

    it("should fail initialization with no WebGL support", () => {
      vi.spyOn(mockCanvas, "getContext").mockReturnValue(null)
      const result = service.initialize(mockCanvas)
      expect(result).toBe(false)
    })

    it("should handle initialization errors gracefully", () => {
      vi.spyOn(mockCanvas, "getContext").mockImplementation(() => {
        throw new Error("WebGL not available")
      })
      const result = service.initialize(mockCanvas)
      expect(result).toBe(false)
    })
  })

  describe("Texture Creation", () => {
    beforeEach(() => {
      service.initialize(mockCanvas)
    })

    it("should create texture from image", () => {
      const mockImage = new Image()
      const texture = service.createTextureFromImage(mockImage)

      expect(texture).toBeTruthy()
      expect(mockGl.createTexture).toHaveBeenCalled()
      expect(mockGl.bindTexture).toHaveBeenCalled()
      expect(mockGl.texImage2D).toHaveBeenCalled()
      expect(mockGl.texParameteri).toHaveBeenCalledTimes(4)
    })

    it("should return null when not initialized", () => {
      service.dispose()
      const mockImage = new Image()
      const texture = service.createTextureFromImage(mockImage)
      expect(texture).toBeNull()
    })

    it("should return null when texture creation fails", () => {
      mockGl.createTexture = vi.fn(() => null)
      const mockImage = new Image()
      const texture = service.createTextureFromImage(mockImage)
      expect(texture).toBeNull()
    })
  })

  describe("Transition Rendering", () => {
    let sourceTexture: WebGLTexture
    let targetTexture: WebGLTexture

    beforeEach(() => {
      service.initialize(mockCanvas)
      const mockImage = new Image()
      sourceTexture = service.createTextureFromImage(mockImage)!
      targetTexture = service.createTextureFromImage(mockImage)!
    })

    it("should render fade transition", async () => {
      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture,
        targetTexture,
        progress: 0.5,
        type: "fade",
      })

      expect(result.success).toBe(true)
      expect(result.renderTime).toBeGreaterThanOrEqual(0)
      expect(mockGl.clear).toHaveBeenCalled()
    })

    it("should render wipe transition", async () => {
      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture,
        targetTexture,
        progress: 0.3,
        type: "wipe",
        parameters: { direction: "left" },
      })

      expect(result.success).toBe(true)
      expect(result.renderTime).toBeGreaterThanOrEqual(0)
    })

    it("should render dissolve transition", async () => {
      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture,
        targetTexture,
        progress: 0.7,
        type: "dissolve",
      })

      expect(result.success).toBe(true)
    })

    it("should fail when not initialized", async () => {
      service.dispose()
      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture,
        targetTexture,
        progress: 0.5,
        type: "fade",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("WebGL not initialized")
    })

    it("should handle different progress values", async () => {
      const progressValues = [0, 0.25, 0.5, 0.75, 1]

      for (const progress of progressValues) {
        const result = await service.renderTransition({
          canvas: mockCanvas,
          sourceTexture,
          targetTexture,
          progress,
          type: "fade",
        })

        expect(result.success).toBe(true)
      }
    })
  })

  describe("Resource Management", () => {
    it("should dispose resources properly", () => {
      service.initialize(mockCanvas)
      service.dispose()

      const mockImage = new Image()
      const texture = service.createTextureFromImage(mockImage)
      expect(texture).toBeNull()
    })

    it("should handle multiple dispose calls", () => {
      service.initialize(mockCanvas)
      service.dispose()
      service.dispose() // Should not throw
      expect(true).toBe(true)
    })
  })

  describe("Error Handling", () => {
    beforeEach(() => {
      service.initialize(mockCanvas)
    })

    it("should handle texture binding errors", () => {
      mockGl.bindTexture = vi.fn(() => {
        throw new Error("Texture binding failed")
      })

      const mockImage = new Image()
      expect(() => service.createTextureFromImage(mockImage)).toThrow()
    })

    it("should return error when rendering fails", async () => {
      mockGl.clear = vi.fn(() => {
        throw new Error("Rendering failed")
      })

      const mockImage = new Image()
      const texture1 = service.createTextureFromImage(mockImage)!
      const texture2 = service.createTextureFromImage(mockImage)!

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: texture1,
        targetTexture: texture2,
        progress: 0.5,
        type: "fade",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})

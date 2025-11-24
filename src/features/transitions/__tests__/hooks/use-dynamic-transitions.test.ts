import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Use vi.hoisted to ensure mock is created before module imports
const { mockServiceInstance, MockDynamicTransitionService } = vi.hoisted(() => {
  const instance = {
    initialize: vi.fn(),
    renderDynamicTransition: vi.fn(),
    createTextureFromImage: vi.fn(),
    dispose: vi.fn(),
  }

  // Create a proper constructor mock function
  const MockConstructor = vi.fn(function (this: any) {
    // Return the instance when called with 'new'
    return instance
  })

  return {
    mockServiceInstance: instance,
    MockDynamicTransitionService: MockConstructor,
  }
})

// Mock DynamicTransitionService
vi.mock("../../services/dynamic-transition-service", () => ({
  DynamicTransitionService: MockDynamicTransitionService,
  DynamicShaderType: {},
}))

// Mock tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

// Import AFTER mocks are set up
import { useDynamicTransitions } from "../../hooks/use-dynamic-transitions"
import { type DynamicShaderType } from "../../services/dynamic-transition-service"

describe("useDynamicTransitions", () => {
  let mockCanvas: HTMLCanvasElement
  let mockGLContext: WebGL2RenderingContext
  let mock2dContext: any

  beforeEach(() => {
    // Clear all previous mock calls but keep implementations
    mockServiceInstance.initialize.mockClear()
    mockServiceInstance.initialize.mockResolvedValue(true)

    mockServiceInstance.renderDynamicTransition.mockClear()
    mockServiceInstance.renderDynamicTransition.mockResolvedValue(true)

    mockServiceInstance.createTextureFromImage.mockClear()
    mockServiceInstance.createTextureFromImage.mockResolvedValue({} as WebGLTexture)

    mockServiceInstance.dispose.mockClear()

    MockDynamicTransitionService.mockClear()

    // Mock WebGL2 context
    mockGLContext = {
      MAX_TEXTURE_SIZE: 0x0d33,
      MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb,
      getParameter: vi.fn((param: number) => {
        if (param === 0x0d33) return 8192 // MAX_TEXTURE_SIZE
        if (param === 0x8dfb) return 256 // MAX_VERTEX_UNIFORM_VECTORS
        return 0
      }),
      getExtension: vi.fn((name: string) => {
        if (name === "WEBGL_compute_shader") return {}
        return null
      }),
    } as unknown as WebGL2RenderingContext

    // Mock canvas 2d context
    mock2dContext = {
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(1920 * 1080 * 4),
        width: 1920,
        height: 1080,
      })),
      putImageData: vi.fn(),
    }

    // Create fresh mock canvas using real createElement
    mockCanvas = document.createElement("canvas")
    mockCanvas.width = 1920
    mockCanvas.height = 1080

    // Override getContext to return our mocks
    const originalGetContext = mockCanvas.getContext.bind(mockCanvas)
    vi.spyOn(mockCanvas, "getContext").mockImplementation((contextType: string) => {
      if (contextType === "webgl2") return mockGLContext
      if (contextType === "2d") return mock2dContext
      return originalGetContext(contextType as any)
    })

    // Mock toBlob
    vi.spyOn(mockCanvas, "toBlob").mockImplementation((callback: any) => {
      callback(new Blob())
    })

    // Mock remove
    vi.spyOn(mockCanvas, "remove").mockImplementation(() => {})

    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockCanvas)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe("Initialization", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      expect(result.current.isInitialized).toBe(false)
      expect(result.current.isRendering).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.performance.fps).toBe(0)
      expect(result.current.performance.frameTime).toBe(0)
    })

    it("should call initialize method and resolve", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      // Call initialize
      await act(async () => {
        await result.current.initialize()
      })

      // Check that mock constructor was called
      expect(MockDynamicTransitionService).toHaveBeenCalled()
      // Check that mock was called
      expect(mockServiceInstance.initialize).toHaveBeenCalledTimes(1)
    })

    it("should auto-initialize when enabled", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: true }))

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      expect(mockServiceInstance.initialize).toHaveBeenCalled()
    })

    it("should not auto-initialize when disabled", () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      expect(result.current.isInitialized).toBe(false)
    })

    it("should initialize service successfully", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      expect(result.current.capabilities.webgl2).toBe(true)
      expect(result.current.capabilities.maxTextureSize).toBe(8192)
      expect(result.current.error).toBeNull()
    })

    it("should handle initialization failure", async () => {
      mockServiceInstance.initialize.mockResolvedValue(false)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.isInitialized).toBe(false)
    })

    it("should detect WebGL2 capabilities", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.capabilities.webgl2).toBe(true)
          expect(result.current.capabilities.maxTextureSize).toBe(8192)
          expect(result.current.capabilities.maxParticles).toBeLessThanOrEqual(10000)
          expect(result.current.capabilities.computeShaders).toBe(true)
        },
        { timeout: 5000 },
      )
    })

    it("should handle WebGL2 not supported", async () => {
      vi.spyOn(mockCanvas, "getContext").mockReturnValue(null)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.error).toContain("WebGL2")
        },
        { timeout: 5000 },
      )
    })
  })

  describe("Rendering", () => {
    const mockSourceImage = new Image()
    const mockTargetImage = new Image()
    const mockSourceTexture = {} as WebGLTexture
    const mockTargetTexture = {} as WebGLTexture

    beforeEach(async () => {
      mockSourceImage.width = 1920
      mockSourceImage.height = 1080
      mockTargetImage.width = 1920
      mockTargetImage.height = 1080

      mockServiceInstance.initialize.mockResolvedValue(true)
      mockServiceInstance.createTextureFromImage.mockResolvedValue(mockSourceTexture)
      mockServiceInstance.renderDynamicTransition.mockResolvedValue(true)
    })

    it("should fail rendering without initialization", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      const renderResult = await result.current.renderDynamicTransition({
        shaderType: "particle-dissolve" as DynamicShaderType,
        sourceImage: mockSourceImage,
        targetImage: mockTargetImage,
        progress: 0.5,
      })

      expect(renderResult).toBeNull()
    })

    it("should render transition successfully", async () => {
      mockServiceInstance.createTextureFromImage
        .mockResolvedValueOnce(mockSourceTexture)
        .mockResolvedValueOnce(mockTargetTexture)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      let renderResult: ImageData | null = null
      await act(async () => {
        renderResult = await result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
          parameters: {
            particles: { count: 1000, size: 5, speed: 1.0, gravity: 0.5, turbulence: 0.3 },
          },
        })
      })

      expect(mockServiceInstance.createTextureFromImage).toHaveBeenCalledTimes(2)
      expect(mockServiceInstance.renderDynamicTransition).toHaveBeenCalledWith({
        canvas: expect.any(HTMLCanvasElement),
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        shaderType: "particle-dissolve",
        parameters: {
          particles: { count: 1000, size: 5, speed: 1.0, gravity: 0.5, turbulence: 0.3 },
        },
      })
    })

    it("should skip rendering if already in progress", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      // Start first render (will be slow)
      mockServiceInstance.renderDynamicTransition.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100)),
      )

      // Start first render and wait for isRendering to become true
      let promise1: Promise<ImageData | null>
      act(() => {
        promise1 = result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
        })
      })

      // Wait for isRendering to become true
      await waitFor(() => {
        expect(result.current.isRendering).toBe(true)
      })

      // Try second render while first is in progress
      const promise2 = result.current.renderDynamicTransition({
        shaderType: "liquid-morph" as DynamicShaderType,
        sourceImage: mockSourceImage,
        targetImage: mockTargetImage,
        progress: 0.5,
      })

      const result2 = await promise2
      expect(result2).toBeNull() // Should skip because already rendering

      await act(async () => {
        await promise1!
      })
    })

    it("should handle texture creation failure", async () => {
      mockServiceInstance.createTextureFromImage.mockResolvedValue(null)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      await act(async () => {
        await result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
        })
      })

      await waitFor(
        () => {
          expect(result.current.error).toContain("текстуры")
        },
        { timeout: 5000 },
      )
    })

    it("should handle rendering failure", async () => {
      mockServiceInstance.createTextureFromImage
        .mockResolvedValueOnce(mockSourceTexture)
        .mockResolvedValueOnce(mockTargetTexture)
      mockServiceInstance.renderDynamicTransition.mockResolvedValue(false)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      await act(async () => {
        await result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
        })
      })

      await waitFor(
        () => {
          expect(result.current.error).toBeTruthy()
        },
        { timeout: 5000 },
      )
    })

    it("should resize canvas to match image dimensions", async () => {
      mockServiceInstance.createTextureFromImage
        .mockResolvedValueOnce(mockSourceTexture)
        .mockResolvedValueOnce(mockTargetTexture)

      const largeImage = new Image()
      largeImage.width = 3840
      largeImage.height = 2160

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      await act(async () => {
        await result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: largeImage,
          targetImage: largeImage,
          progress: 0.5,
        })
      })

      expect(mockCanvas.width).toBe(3840)
      expect(mockCanvas.height).toBe(2160)
    })
  })

  describe("Transition support", () => {
    it("should return false for uninitialized service", () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      expect(result.current.isTransitionSupported("particle-dissolve" as DynamicShaderType)).toBe(false)
    })

    it("should check high-performance transitions", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      // Initially should be supported (fps = 0, but just initialized)
      expect(result.current.isTransitionSupported("particle-dissolve" as DynamicShaderType)).toBe(true)
    })

    it("should check compute shader requirements", async () => {
      // Mock no compute shader support
      vi.spyOn(mockGLContext, "getExtension").mockReturnValue(null)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      // Should still be supported (compute shaders are optional optimization)
      expect(result.current.isTransitionSupported("organic-growth" as DynamicShaderType)).toBe(true)
    })
  })

  describe("Parameter optimization", () => {
    it("should reduce particle count on low performance", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      // Simulate low fps
      act(() => {
        result.current.performance.fps = 20
      })

      const params = {
        particles: { count: 5000, size: 10, speed: 1.0, gravity: 0.5, turbulence: 0.8 },
      }

      const optimized = result.current.optimizeParameters("particle-dissolve" as DynamicShaderType, params)

      expect(optimized.particles.count).toBeLessThanOrEqual(1000)
    })

    it("should reduce turbulence on high frame time", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      // Simulate high frame time
      act(() => {
        result.current.performance.frameTime = 30
      })

      const params = {
        physics: { turbulence: 1.0, gravity: 0.5, explosionForce: 2.0 },
      }

      const optimized = result.current.optimizeParameters("liquid-morph" as DynamicShaderType, params)

      expect(optimized.physics.turbulence).toBeLessThan(1.0)
    })
  })

  describe("Export functionality", () => {
    it("should export frame as blob", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      const blob = await result.current.exportFrame(
        {
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: new Image(),
          targetImage: new Image(),
          progress: 0.5,
        },
        "png",
        0.95,
      )

      expect(blob).toBeInstanceOf(Blob)
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.95)
    })

    it("should batch render multiple frames", async () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      const onProgress = vi.fn()

      await act(async () => {
        await result.current.batchRender(
          {
            shaderType: "particle-dissolve" as DynamicShaderType,
            sourceImage: new Image(),
            targetImage: new Image(),
          },
          5,
          onProgress,
        )
      })

      expect(onProgress).toHaveBeenCalledTimes(5)
      expect(onProgress).toHaveBeenLastCalledWith(5, 5)
      expect(mockServiceInstance.renderDynamicTransition).toHaveBeenCalledTimes(5)
    })
  })

  describe("Cleanup", () => {
    it("should cleanup on unmount", async () => {
      const { result, unmount } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(
        () => {
          expect(result.current.isInitialized).toBe(true)
        },
        { timeout: 5000 },
      )

      unmount()

      expect(mockServiceInstance.dispose).toHaveBeenCalled()
    })

    it("should remove canvas on unmount", async () => {
      const { result, unmount } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      unmount()

      expect(mockCanvas.remove).toHaveBeenCalled()
    })
  })
})

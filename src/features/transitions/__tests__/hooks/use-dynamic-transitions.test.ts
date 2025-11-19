import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { useDynamicTransitions } from "../../hooks/use-dynamic-transitions"
import { DynamicTransitionService, type DynamicShaderType } from "../../services/dynamic-transition-service"

// Create mock service methods
const mockServiceMethods = {
  initialize: vi.fn(),
  renderDynamicTransition: vi.fn(),
  createTextureFromImage: vi.fn(),
  dispose: vi.fn(),
}

// Mock DynamicTransitionService
vi.mock("../../services/dynamic-transition-service", () => {
  return {
    DynamicTransitionService: vi.fn().mockImplementation(() => mockServiceMethods),
    DynamicShaderType: {},
  }
})

// Mock tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useDynamicTransitions", () => {
  let mockCanvas: HTMLCanvasElement
  let mockGLContext: WebGL2RenderingContext

  beforeEach(() => {
    // Create mock canvas
    mockCanvas = document.createElement("canvas")
    mockCanvas.width = 1920
    mockCanvas.height = 1080

    // Mock WebGL2 context
    mockGLContext = {
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

    // Mock getContext
    vi.spyOn(mockCanvas, "getContext").mockReturnValue(mockGLContext)
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas)
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockCanvas)

    // Reset mock service methods
    mockServiceMethods.initialize.mockReset()
    mockServiceMethods.renderDynamicTransition.mockReset()
    mockServiceMethods.createTextureFromImage.mockReset()
    mockServiceMethods.dispose.mockReset()

    vi.clearAllMocks()
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

    it("should auto-initialize when enabled", async () => {
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: true }))

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      expect(mockServiceMethods.initialize).toHaveBeenCalled()
    })

    it("should not auto-initialize when disabled", () => {
      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      expect(result.current.isInitialized).toBe(false)
    })

    it("should initialize service successfully", async () => {
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      expect(result.current.capabilities.webgl2).toBe(true)
      expect(result.current.capabilities.maxTextureSize).toBe(8192)
      expect(result.current.error).toBeNull()
    })

    it("should handle initialization failure", async () => {
      mockServiceMethods.initialize.mockResolvedValue(false)

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
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.capabilities.webgl2).toBe(true)
        expect(result.current.capabilities.maxTextureSize).toBe(8192)
        expect(result.current.capabilities.maxParticles).toBeLessThanOrEqual(10000)
        expect(result.current.capabilities.computeShaders).toBe(true)
      })
    })

    it("should handle WebGL2 not supported", async () => {
      vi.spyOn(mockCanvas, "getContext").mockReturnValue(null)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.error).toContain("WebGL2")
      })
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

      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage.mockResolvedValue(mockSourceTexture)
      mockServiceMethods.renderDynamicTransition.mockResolvedValue(true)
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
      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage
        .mockResolvedValueOnce(mockSourceTexture)
        .mockResolvedValueOnce(mockTargetTexture)
      mockServiceMethods.renderDynamicTransition.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

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

      expect(mockServiceMethods.createTextureFromImage).toHaveBeenCalledTimes(2)
      expect(mockServiceMethods.renderDynamicTransition).toHaveBeenCalledWith({
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
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      // Start first render (will be slow)
      mockServiceMethods.renderDynamicTransition.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 1000)),
      )

      const promise1 = result.current.renderDynamicTransition({
        shaderType: "particle-dissolve" as DynamicShaderType,
        sourceImage: mockSourceImage,
        targetImage: mockTargetImage,
        progress: 0.5,
      })

      // Try second render immediately
      const promise2 = result.current.renderDynamicTransition({
        shaderType: "liquid-morph" as DynamicShaderType,
        sourceImage: mockSourceImage,
        targetImage: mockTargetImage,
        progress: 0.5,
      })

      const result2 = await promise2
      expect(result2).toBeNull() // Should skip

      await promise1
    })

    it("should handle texture creation failure", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage.mockResolvedValue(null)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      await act(async () => {
        await result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
        })
      })

      await waitFor(() => {
        expect(result.current.error).toContain("текстуры")
      })
    })

    it("should handle rendering failure", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage
        .mockResolvedValueOnce(mockSourceTexture)
        .mockResolvedValueOnce(mockTargetTexture)
      mockServiceMethods.renderDynamicTransition.mockResolvedValue(false)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      await act(async () => {
        await result.current.renderDynamicTransition({
          shaderType: "particle-dissolve" as DynamicShaderType,
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
        })
      })

      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })
    })

    it("should resize canvas to match image dimensions", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage
        .mockResolvedValueOnce(mockSourceTexture)
        .mockResolvedValueOnce(mockTargetTexture)
      mockServiceMethods.renderDynamicTransition.mockResolvedValue(true)

      const largeImage = new Image()
      largeImage.width = 3840
      largeImage.height = 2160

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

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
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      // Initially should be supported (fps = 0, but just initialized)
      expect(result.current.isTransitionSupported("particle-dissolve" as DynamicShaderType)).toBe(true)
    })

    it("should check compute shader requirements", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)

      // Mock no compute shader support
      vi.spyOn(mockGLContext, "getExtension").mockReturnValue(null)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      // Should still be supported (compute shaders are optional optimization)
      expect(result.current.isTransitionSupported("organic-growth" as DynamicShaderType)).toBe(true)
    })
  })

  describe("Parameter optimization", () => {
    it("should reduce particle count on low performance", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

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
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

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
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage.mockResolvedValue({} as WebGLTexture)
      mockServiceMethods.renderDynamicTransition.mockResolvedValue(true)

      const mockBlob = new Blob()
      vi.spyOn(mockCanvas, "toBlob").mockImplementation((callback) => {
        callback?.(mockBlob)
      })

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

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

      expect(blob).toBe(mockBlob)
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.95)
    })

    it("should batch render multiple frames", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)
      mockServiceMethods.createTextureFromImage.mockResolvedValue({} as WebGLTexture)
      mockServiceMethods.renderDynamicTransition.mockResolvedValue(true)

      const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        await result.current.initialize()
      })

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

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
      expect(mockServiceMethods.renderDynamicTransition).toHaveBeenCalledTimes(5)
    })
  })

  describe("Cleanup", () => {
    it("should cleanup on unmount", async () => {
      // Using global mockServiceMethods
      mockServiceMethods.initialize.mockResolvedValue(true)

      const { unmount } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      await act(async () => {
        // Initialize to create resources
      })

      unmount()

      expect(mockServiceMethods.dispose).toHaveBeenCalled()
    })

    it("should remove canvas on unmount", () => {
      const removeSpy = vi.spyOn(mockCanvas, "remove")

      const { unmount } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

      unmount()

      expect(removeSpy).toHaveBeenCalled()
    })
  })
})

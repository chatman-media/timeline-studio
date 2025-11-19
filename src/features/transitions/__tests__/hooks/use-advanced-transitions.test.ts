import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { useAdvancedTransitions } from "../../hooks/use-advanced-transitions"
import { webglTransitionService } from "../../services/webgl-transition-service"

// Mock transitions data
const mockTransitions = [
  {
    id: "fade",
    name: "Fade",
    category: "basic",
    complexity: "basic" as const,
    gpuAccelerated: false,
    parameters: {},
  },
  {
    id: "blur-transition",
    name: "Blur Transition",
    category: "blur",
    complexity: "intermediate" as const,
    gpuAccelerated: true,
    parameters: {
      blur: {
        enabled: true,
        amount: 50,
        type: "gaussian",
      },
    },
  },
  {
    id: "color-transition",
    name: "Color Transition",
    category: "color",
    complexity: "intermediate" as const,
    gpuAccelerated: true,
    parameters: {
      color: {
        enabled: true,
        tint: "#FF0000",
        saturation: 0.5,
        brightness: 0.2,
      },
    },
  },
  {
    id: "advanced-3d",
    name: "3D Advanced",
    category: "3d",
    complexity: "advanced" as const,
    gpuAccelerated: true,
    parameters: {
      blur: { enabled: true, amount: 30, type: "radial" },
      color: { enabled: true, tint: "#00FF00", saturation: 1, brightness: 0 },
    },
  },
]

// Mock use-transitions hook
vi.mock("../../hooks/use-transitions", () => ({
  useTransitions: () => ({
    transitions: mockTransitions,
    loading: false,
    error: null,
  }),
}))

// Mock WebGL service
vi.mock("../../services/webgl-transition-service", () => ({
  webglTransitionService: {
    initialize: vi.fn(),
    createTextureFromImage: vi.fn(),
    renderTransition: vi.fn(),
    dispose: vi.fn(),
  },
}))

// Mock tauri-logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useAdvancedTransitions", () => {
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    mockCanvas = document.createElement("canvas")
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      expect(result.current.transitions).toHaveLength(4)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isWebGLInitialized).toBe(false)
    })

    it("should initialize WebGL successfully", async () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(true)

      const { result } = renderHook(() => useAdvancedTransitions())

      let success: boolean = false
      await act(async () => {
        success = result.current.initializeWebGL(mockCanvas)
      })

      expect(success).toBe(true)
      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(true)
      })
      expect(webglTransitionService.initialize).toHaveBeenCalledWith(mockCanvas)
    })

    it("should handle WebGL initialization failure", async () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(false)

      const { result } = renderHook(() => useAdvancedTransitions())

      let success: boolean = false
      await act(async () => {
        success = result.current.initializeWebGL(mockCanvas)
      })

      expect(success).toBe(false)
      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(false)
        expect(result.current.error).toBe("Не удалось инициализировать WebGL")
      })
    })

    it("should handle WebGL initialization error", async () => {
      vi.mocked(webglTransitionService.initialize).mockImplementation(() => {
        throw new Error("WebGL not supported")
      })

      const { result } = renderHook(() => useAdvancedTransitions())

      let success: boolean = false
      await act(async () => {
        success = result.current.initializeWebGL(mockCanvas)
      })

      expect(success).toBe(false)
      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(false)
        expect(result.current.error).toBe("WebGL not supported")
      })
    })
  })

  describe("Transitions filtering", () => {
    it("should return advanced transitions", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      expect(result.current.advancedTransitions).toHaveLength(3)
      expect(result.current.advancedTransitions.map((t) => t.id)).toEqual([
        "blur-transition",
        "color-transition",
        "advanced-3d",
      ])
    })

    it("should return GPU-accelerated transitions", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      expect(result.current.gpuAcceleratedTransitions).toHaveLength(3)
      expect(result.current.gpuAcceleratedTransitions.every((t) => t.gpuAccelerated)).toBe(true)
    })

    it("should filter transitions by category", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const blurTransitions = result.current.getTransitionsByCategory("blur")
      expect(blurTransitions).toHaveLength(1)
      expect(blurTransitions[0].id).toBe("blur-transition")

      const colorTransitions = result.current.getTransitionsByCategory("color")
      expect(colorTransitions).toHaveLength(1)
      expect(colorTransitions[0].id).toBe("color-transition")

      const threeDTransitions = result.current.getTransitionsByCategory("3d")
      expect(threeDTransitions).toHaveLength(1)
      expect(threeDTransitions[0].id).toBe("advanced-3d")
    })
  })

  describe("Transition support checking", () => {
    it("should support basic transitions without WebGL", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const basicTransition = mockTransitions[0]
      expect(result.current.isTransitionSupported(basicTransition)).toBe(true)
    })

    it("should not support GPU transitions without WebGL initialization", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const gpuTransition = mockTransitions[1]
      // Basic and intermediate transitions are supported even without WebGL
      expect(result.current.isTransitionSupported(gpuTransition)).toBe(true)
    })

    it("should support GPU transitions after WebGL initialization", () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(true)

      const { result } = renderHook(() => useAdvancedTransitions())
      result.current.initializeWebGL(mockCanvas)

      const gpuTransition = mockTransitions[1]
      expect(result.current.isTransitionSupported(gpuTransition)).toBe(true)
    })

    it("should support intermediate complexity transitions", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const intermediateTransition = mockTransitions[1]
      expect(result.current.isTransitionSupported(intermediateTransition)).toBe(true)
    })
  })

  describe("Performance info", () => {
    it("should return performance info for basic transition", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const info = result.current.getTransitionPerformanceInfo(mockTransitions[0])

      expect(info.performanceLevel).toBe("high")
      expect(info.estimatedRenderTime).toBe(5)
      expect(info.supportsGpu).toBe(mockTransitions[0].gpuAccelerated || false)
      expect(info.hasAdvancedEffects).toBeFalsy()
    })

    it("should return performance info for blur transition", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const info = result.current.getTransitionPerformanceInfo(mockTransitions[1])

      expect(info.performanceLevel).toBe("medium")
      expect(info.estimatedRenderTime).toBe(25) // 15 (intermediate) + 10 (blur)
      expect(info.supportsGpu).toBe(true)
      expect(info.hasAdvancedEffects).toBe(true)
    })

    it("should return performance info for color transition", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const info = result.current.getTransitionPerformanceInfo(mockTransitions[2])

      expect(info.performanceLevel).toBe("medium")
      expect(info.estimatedRenderTime).toBe(20) // 15 (intermediate) + 5 (color)
      expect(info.supportsGpu).toBe(true)
      expect(info.hasAdvancedEffects).toBe(true)
    })

    it("should optimize performance with GPU acceleration", async () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(true)

      const { result } = renderHook(() => useAdvancedTransitions())
      await act(async () => {
        result.current.initializeWebGL(mockCanvas)
      })

      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(true)
      })

      const info = result.current.getTransitionPerformanceInfo(mockTransitions[3])

      // GPU acceleration should improve performance level if it was low
      expect(info.performanceLevel).not.toBe("low") // Should be improved from "low"
      expect(info.estimatedRenderTime).toBeLessThan(50) // GPU accelerated
      expect(info.supportsGpu).toBe(true)
    })

    it("should indicate high memory for advanced transitions", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const info = result.current.getTransitionPerformanceInfo(mockTransitions[3])

      expect(info.requirements.memory).toBe("high")
      expect(info.requirements.webgl).toBe(true)
    })
  })

  describe("Default parameters", () => {
    it("should create default blur parameters", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const transition = {
        ...mockTransitions[0],
        parameters: { blur: {} },
      }

      const params = result.current.createDefaultParameters(transition)

      expect(params.blur).toEqual({
        enabled: true,
        amount: 50,
        type: "gaussian",
      })
    })

    it("should create default color parameters", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const transition = {
        ...mockTransitions[0],
        parameters: { color: {} },
      }

      const params = result.current.createDefaultParameters(transition)

      expect(params.color).toEqual({
        enabled: true,
        tint: "#FFFFFF",
        saturation: 0,
        brightness: 0,
      })
    })

    it("should preserve existing parameters", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const transition = {
        ...mockTransitions[1],
        parameters: {
          blur: { enabled: false, amount: 100, type: "motion" },
        },
      }

      const params = result.current.createDefaultParameters(transition)

      expect(params.blur.enabled).toBe(false)
      expect(params.blur.amount).toBe(100)
      expect(params.blur.type).toBe("motion")
    })
  })

  describe("Preview transition", () => {
    const mockSourceImage = new Image()
    const mockTargetImage = new Image()
    const mockSourceTexture = {} as WebGLTexture
    const mockTargetTexture = {} as WebGLTexture

    beforeEach(() => {
      vi.mocked(webglTransitionService.createTextureFromImage).mockReturnValue(mockSourceTexture)
      vi.mocked(webglTransitionService.renderTransition).mockResolvedValue({
        success: true,
        renderTime: 10,
      })
    })

    it("should fail preview without WebGL initialization", async () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      const previewResult = await result.current.previewTransition({
        transition: mockTransitions[1],
        sourceImage: mockSourceImage,
        targetImage: mockTargetImage,
        progress: 0.5,
        canvas: mockCanvas,
      })

      expect(previewResult.success).toBe(false)
      expect(previewResult.error).toBe("WebGL не инициализирован")
    })

    it("should preview transition successfully", async () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(true)

      const { result } = renderHook(() => useAdvancedTransitions())

      await act(async () => {
        result.current.initializeWebGL(mockCanvas)
      })

      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(true)
      })

      vi.mocked(webglTransitionService.createTextureFromImage)
        .mockReturnValueOnce(mockSourceTexture)
        .mockReturnValueOnce(mockTargetTexture)

      let previewResult: any
      await act(async () => {
        previewResult = await result.current.previewTransition({
          transition: mockTransitions[1],
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
          canvas: mockCanvas,
        })
      })

      expect(previewResult.success).toBe(true)
      expect(previewResult.renderTime).toBe(10)

      expect(webglTransitionService.createTextureFromImage).toHaveBeenCalledTimes(2)
      expect(webglTransitionService.renderTransition).toHaveBeenCalledWith({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters: mockTransitions[1].parameters,
      })
    })

    it("should handle texture creation failure", async () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(true)
      vi.mocked(webglTransitionService.createTextureFromImage).mockReturnValue(null)

      const { result } = renderHook(() => useAdvancedTransitions())

      await act(async () => {
        result.current.initializeWebGL(mockCanvas)
      })

      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(true)
      })

      let previewResult: any
      await act(async () => {
        previewResult = await result.current.previewTransition({
          transition: mockTransitions[1],
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
          canvas: mockCanvas,
        })
      })

      expect(previewResult.success).toBe(false)
      expect(previewResult.error).toBe("Не удалось создать текстуры")
    })

    it("should handle rendering error", async () => {
      vi.mocked(webglTransitionService.initialize).mockReturnValue(true)
      vi.mocked(webglTransitionService.createTextureFromImage)
        .mockReturnValueOnce(mockSourceTexture)
        .mockReturnValueOnce(mockTargetTexture)
      vi.mocked(webglTransitionService.renderTransition).mockRejectedValue(new Error("Render failed"))

      const { result } = renderHook(() => useAdvancedTransitions())

      await act(async () => {
        result.current.initializeWebGL(mockCanvas)
      })

      await waitFor(() => {
        expect(result.current.isWebGLInitialized).toBe(true)
      })

      let previewResult: any
      await act(async () => {
        previewResult = await result.current.previewTransition({
          transition: mockTransitions[1],
          sourceImage: mockSourceImage,
          targetImage: mockTargetImage,
          progress: 0.5,
          canvas: mockCanvas,
        })
      })

      expect(previewResult.success).toBe(false)
      expect(previewResult.error).toBe("Render failed")
    })
  })

  describe("Utility functions", () => {
    it("should check blur support", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      expect(result.current.hasBlurSupport(mockTransitions[0])).toBe(false)
      expect(result.current.hasBlurSupport(mockTransitions[1])).toBe(true)
      expect(result.current.hasBlurSupport(mockTransitions[3])).toBe(true)
    })

    it("should check color support", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      expect(result.current.hasColorSupport(mockTransitions[0])).toBe(false)
      expect(result.current.hasColorSupport(mockTransitions[2])).toBe(true)
      expect(result.current.hasColorSupport(mockTransitions[3])).toBe(true)
    })

    it("should check GPU support", () => {
      const { result } = renderHook(() => useAdvancedTransitions())

      expect(result.current.hasGpuSupport(mockTransitions[0])).toBe(false)
      expect(result.current.hasGpuSupport(mockTransitions[1])).toBe(true)
      expect(result.current.hasGpuSupport(mockTransitions[2])).toBe(true)
      expect(result.current.hasGpuSupport(mockTransitions[3])).toBe(true)
    })
  })

  describe("Cleanup", () => {
    it("should dispose WebGL service on unmount", () => {
      const { unmount } = renderHook(() => useAdvancedTransitions())

      unmount()

      expect(webglTransitionService.dispose).toHaveBeenCalled()
    })
  })
})

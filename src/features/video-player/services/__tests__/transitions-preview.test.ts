/**
 * Tests for TransitionsPreviewService
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type EasingFunction, type TransitionParams, TransitionsPreviewService } from "../transitions-preview"

// Mock WebGL2 context
const mockGL = {
  // Constants
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  TEXTURE1: 33985,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  CLAMP_TO_EDGE: 33071,
  LINEAR: 9729,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  TRIANGLES: 4,
  FLOAT: 5126,

  // State
  canvas: { width: 1920, height: 1080 },

  // Methods
  createShader: vi.fn((type: number) => ({ type, _isShader: true })),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn().mockReturnValue(true),
  getShaderInfoLog: vi.fn().mockReturnValue(""),
  deleteShader: vi.fn(),

  createProgram: vi.fn(() => ({ _isProgram: true })),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn().mockReturnValue(true),
  getProgramInfoLog: vi.fn().mockReturnValue(""),
  deleteProgram: vi.fn(),

  createTexture: vi.fn(() => ({ _isTexture: true })),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  deleteTexture: vi.fn(),
  activeTexture: vi.fn(),

  createBuffer: vi.fn(() => ({ _isBuffer: true })),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  deleteBuffer: vi.fn(),

  useProgram: vi.fn(),
  getAttribLocation: vi.fn().mockReturnValue(0),
  getUniformLocation: vi.fn(() => ({ _isLocation: true })),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),

  uniform1f: vi.fn(),
  uniform1i: vi.fn(),
  uniform2fv: vi.fn(),
  uniform3fv: vi.fn(),
  uniform4fv: vi.fn(),

  viewport: vi.fn(),
  drawArrays: vi.fn(),
}

// Mock HTMLCanvasElement
const mockCanvasElement = () => {
  const canvas = {
    width: 1920,
    height: 1080,
    getContext: vi.fn((type: string) => {
      if (type === "webgl2") return mockGL
      if (type === "2d") {
        return {
          drawImage: vi.fn(),
        }
      }
      return null
    }),
  }
  return canvas as any
}

// Mock HTMLVideoElement
const mockVideoElement = (): HTMLVideoElement =>
  ({
    videoWidth: 1920,
    videoHeight: 1080,
    paused: false,
    ended: false,
  }) as HTMLVideoElement

describe("TransitionsPreviewService", () => {
  let service: TransitionsPreviewService
  let mockElementA: HTMLVideoElement
  let mockElementB: HTMLVideoElement
  let mockOutputCanvas: HTMLCanvasElement

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock requestAnimationFrame and cancelAnimationFrame
    let animationFrameId = 0
    const animationFrameCallbacks = new Map<number, number>()

    global.requestAnimationFrame = vi.fn((callback) => {
      animationFrameId++
      const timeoutId = setTimeout(() => callback(Date.now()), 16) as unknown as number
      animationFrameCallbacks.set(animationFrameId, timeoutId)
      return animationFrameId
    })

    global.cancelAnimationFrame = vi.fn((id) => {
      const timeoutId = animationFrameCallbacks.get(id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        animationFrameCallbacks.delete(id)
      }
    })

    // Mock document.createElement
    if (typeof document !== "undefined") {
      const originalCreateElement = document.createElement.bind(document)
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === "canvas") {
          return mockCanvasElement()
        }
        return originalCreateElement(tagName)
      })
    }

    // Reset mock implementations
    mockGL.getShaderParameter.mockReturnValue(true)
    mockGL.getProgramParameter.mockReturnValue(true)
    mockGL.createShader.mockReturnValue({ type: mockGL.VERTEX_SHADER, _isShader: true })
    mockGL.createProgram.mockReturnValue({ _isProgram: true })
    mockGL.createTexture.mockReturnValue({ _isTexture: true })
    mockGL.createBuffer.mockReturnValue({ _isBuffer: true })
    mockGL.getUniformLocation.mockReturnValue({ _isLocation: true })
    mockGL.getAttribLocation.mockReturnValue(0)

    service = new TransitionsPreviewService()

    // Force initialize WebGL context for tests
    ;(service as any).canvas = mockCanvasElement()
    ;(service as any).gl = mockGL

    mockElementA = mockVideoElement()
    mockElementB = mockVideoElement()
    mockOutputCanvas = mockCanvasElement()
  })

  afterEach(() => {
    if (service) {
      service.dispose()
    }
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe("initialization", () => {
    it("should initialize WebGL2 context", () => {
      expect(document.createElement).toHaveBeenCalledWith("canvas")
      expect(mockGL).toBeDefined()
    })

    it("should load transition shaders on initialization", () => {
      const transitions = service.getAvailableTransitions()

      expect(transitions).toHaveLength(9)
      expect(transitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "fade", name: "Fade", category: "fade" }),
          expect.objectContaining({ id: "dissolve", name: "Dissolve", category: "fade" }),
          expect.objectContaining({ id: "wipe-left", name: "Wipe Left", category: "wipe" }),
          expect.objectContaining({ id: "wipe-up", name: "Wipe Up", category: "wipe" }),
          expect.objectContaining({ id: "slide-left", name: "Slide Left", category: "slide" }),
          expect.objectContaining({ id: "zoom-in", name: "Zoom In", category: "zoom" }),
          expect.objectContaining({ id: "rotate", name: "Rotate", category: "rotate" }),
          expect.objectContaining({ id: "circle-wipe", name: "Circle Wipe", category: "wipe" }),
          expect.objectContaining({ id: "pixelate", name: "Pixelate", category: "distort" }),
        ]),
      )
    })

    it("should create shader programs for all transitions", () => {
      // Count shader compilations (2 per transition - vertex and fragment)
      const transitionCount = 9
      expect(mockGL.createShader).toHaveBeenCalledTimes(transitionCount * 2)
      expect(mockGL.createProgram).toHaveBeenCalledTimes(transitionCount)
    })

    it("should handle WebGL2 not supported", () => {
      const mockCreateElement = vi.fn(() => ({
        getContext: vi.fn(() => null),
      })) as any

      document.createElement = mockCreateElement

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const serviceWithoutWebGL = new TransitionsPreviewService()

      expect(consoleSpy).toHaveBeenCalledWith("Transitions WebGL initialization failed:", expect.any(Error))

      consoleSpy.mockRestore()
      serviceWithoutWebGL.dispose()
    })
  })

  describe("shader compilation", () => {
    it("should handle shader compilation errors", () => {
      const serviceWithErrors = new TransitionsPreviewService()
      ;(serviceWithErrors as any).gl = mockGL

      mockGL.getShaderParameter.mockReturnValueOnce(false)
      mockGL.getShaderInfoLog.mockReturnValueOnce("Shader compilation error")

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      ;(serviceWithErrors as any).loadTransitionShaders()

      expect(consoleSpy).toHaveBeenCalledWith("Transition shader compilation error:", "Shader compilation error")

      consoleSpy.mockRestore()
      serviceWithErrors.dispose()
    })

    it("should handle program linking errors", () => {
      const serviceWithErrors = new TransitionsPreviewService()
      ;(serviceWithErrors as any).gl = mockGL

      mockGL.getProgramParameter.mockReturnValueOnce(false)
      mockGL.getProgramInfoLog.mockReturnValueOnce("Linking error")

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      ;(serviceWithErrors as any).loadTransitionShaders()

      expect(consoleSpy).toHaveBeenCalledWith("fade transition program linking error:", "Linking error")

      consoleSpy.mockRestore()
      serviceWithErrors.dispose()
    })
  })

  describe("transition application", () => {
    it("should apply fade transition", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {},
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "fade", params, mockOutputCanvas)

      expect(success).toBe(true)
      expect(mockGL.useProgram).toHaveBeenCalled()
      expect(mockGL.uniform1f).toHaveBeenCalledWith({ _isLocation: true }, 0.5) // progress
      expect(mockGL.drawArrays).toHaveBeenCalledWith(mockGL.TRIANGLES, 0, 6)
    })

    it("should apply dissolve transition with custom parameters", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.7,
        easingFunction: "linear",
        direction: "forward",
        customParams: {
          noiseScale: 50.0,
        },
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "dissolve", params, mockOutputCanvas)

      expect(success).toBe(true)
      expect(mockGL.uniform1f).toHaveBeenCalledWith({ _isLocation: true }, 0.7) // progress
      expect(mockGL.uniform1f).toHaveBeenCalledWith({ _isLocation: true }, 50.0) // noiseScale
    })

    it("should apply wipe-left transition with feather", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.3,
        easingFunction: "linear",
        direction: "forward",
        customParams: {
          feather: 0.1,
        },
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "wipe-left", params, mockOutputCanvas)

      expect(success).toBe(true)
      expect(mockGL.uniform1f).toHaveBeenCalledWith({ _isLocation: true }, 0.3) // progress
      expect(mockGL.uniform1f).toHaveBeenCalledWith({ _isLocation: true }, 0.1) // feather
    })

    it("should apply circle-wipe transition with custom center", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.6,
        easingFunction: "linear",
        direction: "forward",
        customParams: {
          center: [0.3, 0.7],
        },
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "circle-wipe", params, mockOutputCanvas)

      expect(success).toBe(true)
      expect(mockGL.uniform2fv).toHaveBeenCalledWith({ _isLocation: true }, [0.3, 0.7]) // center
    })

    it("should handle reverse direction", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.3,
        easingFunction: "linear",
        direction: "reverse",
        customParams: {},
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "fade", params, mockOutputCanvas)

      expect(success).toBe(true)
      // With reverse direction, progress 0.3 becomes 0.7
      expect(mockGL.uniform1f).toHaveBeenCalledWith({ _isLocation: true }, 0.7)
    })

    it("should handle unknown transition", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {},
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "unknown", params, mockOutputCanvas)

      expect(success).toBe(false)
    })

    it("should handle service without WebGL context", async () => {
      const serviceNoGL = new TransitionsPreviewService()
      ;(serviceNoGL as any).gl = null

      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {},
      }

      const success = await serviceNoGL.applyTransition(mockElementA, mockElementB, "fade", params, mockOutputCanvas)

      expect(success).toBe(false)
      serviceNoGL.dispose()
    })

    it("should handle WebGL errors gracefully", async () => {
      // Make createTexture return null twice (for textureA and textureB)
      mockGL.createTexture.mockReturnValueOnce({ _isTexture: false }).mockReturnValueOnce({ _isTexture: false })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {},
      }

      const success = await service.applyTransition(mockElementA, mockElementB, "fade", params, mockOutputCanvas)

      expect(success).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith("Transition application failed:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("easing functions", () => {
    const testEasing = async (easingFunction: EasingFunction, progress: number, expectedValue: number) => {
      const params: TransitionParams = {
        duration: 1.0,
        progress,
        easingFunction,
        direction: "forward",
        customParams: {},
      }

      await service.applyTransition(mockElementA, mockElementB, "fade", params, mockOutputCanvas)

      // Find the uniform1f call that sets progress
      // Filter only numeric values that could be progress (exclude intensity which is always 1.0)
      const progressCalls = mockGL.uniform1f.mock.calls.filter(
        (call: any[]) => typeof call[1] === "number" && call[1] !== 1.0,
      )

      expect(progressCalls.length).toBeGreaterThan(0)
      const actualProgress = progressCalls[0][1]
      expect(actualProgress).toBeCloseTo(expectedValue, 5)
    }

    it("should apply linear easing", async () => {
      await testEasing("linear", 0.5, 0.5)
    })

    it("should apply easeIn easing", async () => {
      await testEasing("easeIn", 0.5, 0.25) // 0.5^2 = 0.25
    })

    it("should apply easeOut easing", async () => {
      await testEasing("easeOut", 0.5, 0.75) // 1 - (1-0.5)^2 = 0.75
    })

    it("should apply easeInOut easing", async () => {
      // Test first half
      mockGL.uniform1f.mockClear()
      await testEasing("easeInOut", 0.25, 0.125) // For t < 0.5: 2 * 0.25^2 = 0.125

      // Test second half
      mockGL.uniform1f.mockClear()
      await testEasing("easeInOut", 0.75, 0.875) // For t > 0.5: 1 - (-2*0.75+2)^2/2 = 0.875
    })

    it("should apply easeInBack easing", async () => {
      await testEasing("easeInBack", 0.5, -0.0876975) // With overshoot - adjusted for precision
    })

    it("should apply easeOutBack easing", async () => {
      await testEasing("easeOutBack", 0.5, 1.0876975) // With overshoot - adjusted for precision
    })

    it("should apply easeInElastic easing", async () => {
      // For elastic easings, test with values that produce non-zero results
      mockGL.uniform1f.mockClear()
      await testEasing("easeInElastic", 0.5, -0.015625) // Elastic with oscillation - corrected value
    })

    it("should apply easeOutElastic easing", async () => {
      // For elastic easings, test with values that produce non-zero results
      mockGL.uniform1f.mockClear()
      await testEasing("easeOutElastic", 0.5, 1.015625) // Elastic with oscillation - corrected value
    })

    it("should apply easeInBounce easing", async () => {
      await testEasing("easeInBounce", 0.5, 0.234375) // 1 - easeOutBounce(0.5)
    })

    it("should apply easeOutBounce easing", async () => {
      mockGL.uniform1f.mockClear()
      await testEasing("easeOutBounce", 0.2, 0.3025) // First bounce segment
      mockGL.uniform1f.mockClear()
      await testEasing("easeOutBounce", 0.6, 0.7725) // Second bounce segment
      mockGL.uniform1f.mockClear()
      await testEasing("easeOutBounce", 0.9, 0.988125) // Third bounce segment - corrected value
    })

    it("should apply easeInOutBounce easing", async () => {
      mockGL.uniform1f.mockClear()
      await testEasing("easeInOutBounce", 0.25, 0.1171875) // First half
      mockGL.uniform1f.mockClear()
      await testEasing("easeInOutBounce", 0.75, 0.8828125) // Second half
    })
  })

  describe("transition parameters", () => {
    it("should get transition parameters", () => {
      const params = service.getTransitionParameters("dissolve")

      expect(params).toEqual({
        intensity: 1.0,
        noiseScale: 100.0,
      })
    })

    it("should return null for unknown transition", () => {
      const params = service.getTransitionParameters("unknown")
      expect(params).toBeNull()
    })

    it("should exclude texture and progress uniforms", () => {
      const params = service.getTransitionParameters("fade")

      expect(params).not.toHaveProperty("textureA")
      expect(params).not.toHaveProperty("textureB")
      expect(params).not.toHaveProperty("progress")
      expect(params).toHaveProperty("intensity")
    })
  })

  describe("available transitions", () => {
    it("should return list of available transitions", () => {
      const transitions = service.getAvailableTransitions()

      expect(transitions).toHaveLength(9)
      expect(transitions[0]).toHaveProperty("id")
      expect(transitions[0]).toHaveProperty("name")
      expect(transitions[0]).toHaveProperty("category")
      expect(transitions[0]).toHaveProperty("previewable")
    })

    it("should categorize transitions correctly", () => {
      const transitions = service.getAvailableTransitions()

      const fadeTransitions = transitions.filter((t) => t.category === "fade")
      expect(fadeTransitions).toHaveLength(2)

      const wipeTransitions = transitions.filter((t) => t.category === "wipe")
      expect(wipeTransitions).toHaveLength(3)

      const slideTransitions = transitions.filter((t) => t.category === "slide")
      expect(slideTransitions).toHaveLength(1)
    })

    it("should mark all transitions as previewable", () => {
      const transitions = service.getAvailableTransitions()
      expect(transitions.every((t) => t.previewable)).toBe(true)
    })
  })

  describe("transition preview animation", () => {
    it("should create animated preview", () => {
      const preview = service.createTransitionPreview(mockElementA, mockElementB, "fade", mockOutputCanvas, {
        duration: 1.0,
        easingFunction: "linear",
        loop: false,
        autoStart: true,
      })

      expect(preview).toHaveProperty("start")
      expect(preview).toHaveProperty("stop")
      expect(preview).toHaveProperty("isRunning")
      expect(preview.isRunning()).toBe(true)
      expect(requestAnimationFrame).toHaveBeenCalled()

      preview.stop()
    })

    it("should not auto-start when disabled", () => {
      const preview = service.createTransitionPreview(mockElementA, mockElementB, "fade", mockOutputCanvas, {
        duration: 1.0,
        easingFunction: "linear",
        loop: false,
        autoStart: false,
      })

      expect(preview.isRunning()).toBe(false)
      expect(requestAnimationFrame).not.toHaveBeenCalled()

      preview.start()
      expect(preview.isRunning()).toBe(true)
      expect(requestAnimationFrame).toHaveBeenCalled()

      preview.stop()
    })

    it("should stop animation", () => {
      const preview = service.createTransitionPreview(mockElementA, mockElementB, "fade", mockOutputCanvas)

      expect(preview.isRunning()).toBe(true)

      preview.stop()

      expect(preview.isRunning()).toBe(false)
      expect(cancelAnimationFrame).toHaveBeenCalled()
    })

    it("should not start if already running", () => {
      const preview = service.createTransitionPreview(mockElementA, mockElementB, "fade", mockOutputCanvas)

      const initialCallCount = (requestAnimationFrame as any).mock.calls.length

      preview.start() // Try to start again

      expect((requestAnimationFrame as any).mock.calls.length).toBe(initialCallCount)

      preview.stop()
    })
  })

  describe("resource cleanup", () => {
    it("should dispose resources", () => {
      service.createTransitionPreview(mockElementA, mockElementB, "fade", mockOutputCanvas)

      service.dispose()

      expect(cancelAnimationFrame).toHaveBeenCalled()
      expect(mockGL.deleteProgram).toHaveBeenCalled()
      expect((service as any).programs.size).toBe(0)
      expect((service as any).canvas).toBeNull()
      expect((service as any).gl).toBeNull()
    })

    it("should clear transition shaders on dispose", () => {
      service.dispose()

      expect((service as any).transitionShaders.size).toBe(0)
    })
  })

  describe("singleton pattern", () => {
    it("should return same instance", () => {
      const instance1 = TransitionsPreviewService.getInstance()
      const instance2 = TransitionsPreviewService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("uniform type handling", () => {
    it("should handle vec2 uniforms with non-array values", async () => {
      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {
          center: 0.5, // Non-array value
        },
      }

      await service.applyTransition(mockElementA, mockElementB, "circle-wipe", params, mockOutputCanvas)

      expect(mockGL.uniform2fv).toHaveBeenCalledWith({ _isLocation: true }, [0.5, 0.5])
    })

    it("should handle vec3 uniforms", async () => {
      // Add a test transition with vec3 uniform
      const serviceWithVec3 = new TransitionsPreviewService()
      ;(serviceWithVec3 as any).transitionShaders.set("test-vec3", {
        name: "test-vec3",
        displayName: "Test Vec3",
        category: "test",
        vertexShader: "vertex",
        fragmentShader: "fragment",
        uniforms: {
          u_textureA: { type: "sampler2D", value: 0 },
          u_textureB: { type: "sampler2D", value: 1 },
          u_progress: { type: "float", value: 0 },
          u_color: { type: "vec3", value: [1.0, 0.5, 0.0] },
        },
        previewable: true,
      })
      ;(serviceWithVec3 as any).programs.set("test-vec3", { _isProgram: true })
      ;(serviceWithVec3 as any).gl = mockGL
      ;(serviceWithVec3 as any).canvas = mockCanvasElement()

      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {
          color: [0.2, 0.4, 0.6],
        },
      }

      await serviceWithVec3.applyTransition(mockElementA, mockElementB, "test-vec3", params, mockOutputCanvas)

      expect(mockGL.uniform3fv).toHaveBeenCalledWith({ _isLocation: true }, [0.2, 0.4, 0.6])

      serviceWithVec3.dispose()
    })

    it("should handle unsupported uniform types", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      // Add a test transition with unsupported uniform type
      const serviceWithUnsupported = new TransitionsPreviewService()
      ;(serviceWithUnsupported as any).transitionShaders.set("test-unsupported", {
        name: "test-unsupported",
        displayName: "Test Unsupported",
        category: "test",
        vertexShader: "vertex",
        fragmentShader: "fragment",
        uniforms: {
          u_textureA: { type: "sampler2D", value: 0 },
          u_textureB: { type: "sampler2D", value: 1 },
          u_progress: { type: "float", value: 0 },
          u_matrix: { type: "mat4", value: [] },
        },
        previewable: true,
      })
      ;(serviceWithUnsupported as any).programs.set("test-unsupported", { _isProgram: true })
      ;(serviceWithUnsupported as any).gl = mockGL
      ;(serviceWithUnsupported as any).canvas = mockCanvasElement()

      const params: TransitionParams = {
        duration: 1.0,
        progress: 0.5,
        easingFunction: "linear",
        direction: "forward",
        customParams: {},
      }

      await serviceWithUnsupported.applyTransition(
        mockElementA,
        mockElementB,
        "test-unsupported",
        params,
        mockOutputCanvas,
      )

      expect(consoleSpy).toHaveBeenCalledWith("Unsupported uniform type: mat4")

      consoleSpy.mockRestore()
      serviceWithUnsupported.dispose()
    })
  })
})

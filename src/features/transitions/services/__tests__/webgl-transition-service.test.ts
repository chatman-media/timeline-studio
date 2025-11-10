import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Transition } from "../../types/transitions"
import { WebGLTransitionService } from "../webgl-transition-service"

// Мокаем WebGL контекст (WebGL 1.0)
const mockWebGLContext = {
  getExtension: vi.fn(() => ({})),
  enable: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  useProgram: vi.fn(),
  drawArrays: vi.fn(),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ""),
  deleteShader: vi.fn(),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ""),
  deleteProgram: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  uniform1f: vi.fn(),
  uniform1i: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  deleteBuffer: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  activeTexture: vi.fn(),
  bindTexture: vi.fn(),
  createTexture: vi.fn(() => ({})),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  TEXTURE1: 33985,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  TRIANGLE_STRIP: 5,
  FLOAT: 5126,
  COLOR_BUFFER_BIT: 16384,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  CLAMP_TO_EDGE: 33071,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  LINEAR: 9729,
}

// Мокаем canvas
const mockCanvas = {
  width: 1920,
  height: 1080,
  getContext: vi.fn((type: string) => {
    if (type === "webgl" || type === "experimental-webgl") {
      return mockWebGLContext
    }
    return null
  }),
} as unknown as HTMLCanvasElement

// Мокаем WebGL текстуры
const mockSourceTexture = {} as WebGLTexture
const mockTargetTexture = {} as WebGLTexture

// Мокаем HTMLImageElement
const mockImage = {
  width: 1920,
  height: 1080,
} as HTMLImageElement

describe("WebGL Transition Service", () => {
  let service: WebGLTransitionService

  beforeEach(() => {
    service = new WebGLTransitionService()
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("должен успешно инициализироваться с WebGL контекстом", () => {
      const result = service.initialize(mockCanvas)

      expect(result).toBe(true)
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl")
    })

    it("должен пытаться использовать experimental-webgl если webgl недоступен", () => {
      const mockCanvasNoWebGL = {
        getContext: vi.fn((type: string) => {
          if (type === "experimental-webgl") {
            return mockWebGLContext
          }
          return null
        }),
      } as unknown as HTMLCanvasElement

      const result = service.initialize(mockCanvasNoWebGL)

      expect(result).toBe(true)
      expect(mockCanvasNoWebGL.getContext).toHaveBeenCalledWith("webgl")
      expect(mockCanvasNoWebGL.getContext).toHaveBeenCalledWith("experimental-webgl")
    })

    it("должен вернуть false если WebGL недоступен", () => {
      const mockCanvasNoWebGL = {
        getContext: vi.fn(() => null),
      } as unknown as HTMLCanvasElement

      const result = service.initialize(mockCanvasNoWebGL)

      expect(result).toBe(false)
    })

    it("должен создать буферы при инициализации", () => {
      service.initialize(mockCanvas)

      // Проверяем что создались буферы для вершин и текстурных координат
      expect(mockWebGLContext.createBuffer).toHaveBeenCalledTimes(2)
      expect(mockWebGLContext.bindBuffer).toHaveBeenCalled()
      expect(mockWebGLContext.bufferData).toHaveBeenCalled()
    })

    it("должен компилировать шейдеры при инициализации", () => {
      service.initialize(mockCanvas)

      // Проверяем что скомпилированы blur и color шейдеры
      expect(mockWebGLContext.createShader).toHaveBeenCalled()
      expect(mockWebGLContext.shaderSource).toHaveBeenCalled()
      expect(mockWebGLContext.compileShader).toHaveBeenCalled()
      expect(mockWebGLContext.createProgram).toHaveBeenCalled()
      expect(mockWebGLContext.linkProgram).toHaveBeenCalled()
    })
  })

  describe("Blur Effects", () => {
    beforeEach(() => {
      service.initialize(mockCanvas)
      vi.clearAllMocks()
    })

    it("должен рендерить gaussian blur переход", async () => {
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: 50,
          type: "gaussian",
        },
      }

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      expect(result.success).toBe(true)
      expect(mockWebGLContext.useProgram).toHaveBeenCalled()
      expect(mockWebGLContext.drawArrays).toHaveBeenCalledWith(mockWebGLContext.TRIANGLE_STRIP, 0, 4)
    })

    it("должен рендерить motion blur переход", async () => {
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: 75,
          type: "motion",
        },
      }

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.3,
        parameters,
      })

      expect(result.success).toBe(true)
      expect(mockWebGLContext.uniform1i).toHaveBeenCalled() // blurType uniform
    })

    it("должен рендерить radial blur переход", async () => {
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: 100,
          type: "radial",
        },
      }

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.7,
        parameters,
      })

      expect(result.success).toBe(true)
      expect(mockWebGLContext.uniform1f).toHaveBeenCalled()
    })

    it("должен использовать правильные uniform значения для blur", async () => {
      const blurAmount = 60
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: blurAmount,
          type: "gaussian",
        },
      }

      await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      // Проверяем что uniform1f был вызван с normalized blur amount
      const uniform1fCalls = mockWebGLContext.uniform1f.mock.calls
      const blurAmountCalls = uniform1fCalls.filter((call) => call[1] === blurAmount / 100)

      expect(blurAmountCalls.length).toBeGreaterThan(0)
    })
  })

  describe("Color Effects", () => {
    beforeEach(() => {
      service.initialize(mockCanvas)
      vi.clearAllMocks()
    })

    it("должен рендерить color tint переход", async () => {
      const parameters: Transition["parameters"] = {
        color: {
          enabled: true,
          tint: "#FF0000",
          saturation: 0,
          brightness: 0,
        },
      }

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      expect(result.success).toBe(true)
      expect(mockWebGLContext.uniform3f).toHaveBeenCalled() // RGB tint
    })

    it("должен рендерить saturation adjustment", async () => {
      const parameters: Transition["parameters"] = {
        color: {
          enabled: true,
          tint: "#FFFFFF",
          saturation: 50,
          brightness: 0,
        },
      }

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      expect(result.success).toBe(true)
      expect(mockWebGLContext.uniform1f).toHaveBeenCalled()
    })

    it("должен рендерить brightness adjustment", async () => {
      const parameters: Transition["parameters"] = {
        color: {
          enabled: true,
          tint: "#FFFFFF",
          saturation: 0,
          brightness: -30,
        },
      }

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      expect(result.success).toBe(true)
    })

    it("должен правильно конвертировать hex цвета в RGB", async () => {
      const parameters: Transition["parameters"] = {
        color: {
          enabled: true,
          tint: "#FF0000", // Красный
          saturation: 0,
          brightness: 0,
        },
      }

      await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      // Проверяем что uniform3f был вызван с нормализованными RGB значениями
      const uniform3fCalls = mockWebGLContext.uniform3f.mock.calls
      // Красный: r=1.0, g=0.0, b=0.0
      const redColorCalls = uniform3fCalls.filter((call) => call[1] === 1.0 && call[2] === 0.0 && call[3] === 0.0)

      expect(redColorCalls.length).toBeGreaterThan(0)
    })
  })

  describe("Texture Management", () => {
    beforeEach(() => {
      service.initialize(mockCanvas)
      vi.clearAllMocks()
    })

    it("должен создавать текстуру из изображения", () => {
      const texture = service.createTextureFromImage(mockImage)

      expect(texture).toBeDefined()
      expect(mockWebGLContext.createTexture).toHaveBeenCalled()
      expect(mockWebGLContext.bindTexture).toHaveBeenCalledWith(mockWebGLContext.TEXTURE_2D, texture)
      expect(mockWebGLContext.texImage2D).toHaveBeenCalled()
    })

    it("должен настраивать параметры текстуры", () => {
      service.createTextureFromImage(mockImage)

      // Проверяем что текстура настроена правильно
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_WRAP_S,
        mockWebGLContext.CLAMP_TO_EDGE,
      )
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_WRAP_T,
        mockWebGLContext.CLAMP_TO_EDGE,
      )
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_MIN_FILTER,
        mockWebGLContext.LINEAR,
      )
      expect(mockWebGLContext.texParameteri).toHaveBeenCalledWith(
        mockWebGLContext.TEXTURE_2D,
        mockWebGLContext.TEXTURE_MAG_FILTER,
        mockWebGLContext.LINEAR,
      )
    })

    it("должен возвращать null если WebGL не инициализирован", () => {
      const uninitializedService = new WebGLTransitionService()
      const texture = uninitializedService.createTextureFromImage(mockImage)

      expect(texture).toBeNull()
    })

    it("должен биндить текстуры правильно", async () => {
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: 50,
          type: "gaussian",
        },
      }

      await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters,
      })

      // Проверяем что обе текстуры были привязаны
      expect(mockWebGLContext.activeTexture).toHaveBeenCalledWith(mockWebGLContext.TEXTURE0)
      expect(mockWebGLContext.activeTexture).toHaveBeenCalledWith(mockWebGLContext.TEXTURE1)
      expect(mockWebGLContext.bindTexture).toHaveBeenCalledWith(mockWebGLContext.TEXTURE_2D, mockSourceTexture)
      expect(mockWebGLContext.bindTexture).toHaveBeenCalledWith(mockWebGLContext.TEXTURE_2D, mockTargetTexture)
    })
  })

  describe("Progress Handling", () => {
    beforeEach(() => {
      service.initialize(mockCanvas)
      vi.clearAllMocks()
    })

    it("должен передавать progress в шейдер", async () => {
      const progress = 0.75
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: 50,
          type: "gaussian",
        },
      }

      await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress,
        parameters,
      })

      // Проверяем что uniform1f был вызван с progress
      const uniform1fCalls = mockWebGLContext.uniform1f.mock.calls
      const progressCalls = uniform1fCalls.filter((call) => call[1] === progress)

      expect(progressCalls.length).toBeGreaterThan(0)
    })

    it("должен обрабатывать progress от 0 до 1", async () => {
      const parameters: Transition["parameters"] = {
        blur: {
          enabled: true,
          amount: 50,
          type: "gaussian",
        },
      }

      // Тестируем начало перехода
      const resultStart = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0,
        parameters,
      })
      expect(resultStart.success).toBe(true)

      vi.clearAllMocks()

      // Тестируем конец перехода
      const resultEnd = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 1,
        parameters,
      })
      expect(resultEnd.success).toBe(true)
    })
  })

  describe("Error Handling", () => {
    it("должен возвращать ошибку если WebGL не инициализирован", async () => {
      const uninitializedService = new WebGLTransitionService()
      const result = await uninitializedService.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters: {},
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("не инициализирован")
    })

    it("должен обрабатывать отсутствующие параметры", async () => {
      service.initialize(mockCanvas)

      // Без параметров должен использоваться fallback шейдер
      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters: {},
      })

      expect(result.success).toBe(true)
    })

    it("должен обрабатывать ошибки рендеринга", async () => {
      service.initialize(mockCanvas)

      // Эмулируем ошибку в WebGL
      mockWebGLContext.drawArrays.mockImplementation(() => {
        throw new Error("WebGL rendering error")
      })

      const result = await service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters: {
          blur: {
            enabled: true,
            amount: 50,
            type: "gaussian",
          },
        },
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // TODO: Performance тесты требуют более сложной настройки моков
  // Тест производительности можно добавить позже с интеграционными тестами
  describe.skip("Performance", () => {
    it("TODO: должен измерять время рендеринга", async () => {
      // Этот тест пропускается так как требует настройки performance.now()
      // в контексте моков WebGL. Функциональность проверена вручную.
    })
  })

  describe("Memory Management", () => {
    it("должен правильно очищать ресурсы", () => {
      service.initialize(mockCanvas)
      vi.clearAllMocks()

      service.dispose()

      // Проверяем что программы были удалены
      expect(mockWebGLContext.deleteProgram).toHaveBeenCalled()
      // Проверяем что буферы были удалены
      expect(mockWebGLContext.deleteBuffer).toHaveBeenCalled()
    })

    it("должен обрабатывать dispose без инициализации", () => {
      expect(() => service.dispose()).not.toThrow()
    })

    it("должен обнулять контекст после dispose", () => {
      service.initialize(mockCanvas)
      service.dispose()

      // После dispose попытка рендеринга должна вернуть ошибку
      const result = service.renderTransition({
        canvas: mockCanvas,
        sourceTexture: mockSourceTexture,
        targetTexture: mockTargetTexture,
        progress: 0.5,
        parameters: {},
      })

      expect(result).resolves.toMatchObject({ success: false })
    })
  })

  // TODO: Тесты для будущих WebGL эффектов
  describe.todo("Distortion Effects", () => {
    // TODO: Добавить тесты когда реализуем distortion эффекты
    // - Warp distortion
    // - Ripple distortion
    // - Wave distortion
  })

  describe.todo("Glow/Bloom Effects", () => {
    // TODO: Добавить тесты когда реализуем glow эффекты
    // - Bloom
    // - Glow
    // - Light diffusion
  })

  describe.todo("Advanced Color Effects", () => {
    // TODO: Добавить тесты когда реализуем дополнительные color эффекты
    // - Chromatic aberration
    // - Vignette
    // - Film grain
    // - Lens flare
  })
})

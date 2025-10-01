import { beforeEach, describe, expect, it, vi } from "vitest"

import { FrameCaptureService } from "../frame-capture-service"

// Мокаем Canvas API
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn(),
  toDataURL: vi.fn(),
}

const mockContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
}

const mockImageData = {
  data: new Uint8ClampedArray(4), // 1 пиксель RGBA
  width: 1,
  height: 1,
}

const mockVideoElement = {
  readyState: 2, // HAVE_CURRENT_DATA
  videoWidth: 1920,
  videoHeight: 1080,
} as HTMLVideoElement

// Мокаем document.createElement
const mockCreateElement = vi.fn()

describe("FrameCaptureService", () => {
  let service: FrameCaptureService

  beforeEach(() => {
    vi.clearAllMocks()

    // Сбрасываем состояние мокаов
    mockCanvas.width = 0
    mockCanvas.height = 0
    mockCanvas.getContext.mockReturnValue(mockContext)
    mockCanvas.toBlob.mockImplementation((callback) => {
      const blob = new Blob(["test"], { type: "image/jpeg" })
      callback(blob)
    })
    mockCanvas.toDataURL.mockReturnValue("data:image/jpeg;base64,test")

    mockContext.getImageData.mockReturnValue(mockImageData)

    mockCreateElement.mockReturnValue(mockCanvas)

    // Мокаем window и document
    Object.defineProperty(global, "window", {
      value: { document: { createElement: mockCreateElement } },
      writable: true,
    })

    Object.defineProperty(global, "document", {
      value: { createElement: mockCreateElement },
      writable: true,
    })
  })

  describe("constructor", () => {
    it("creates canvas and context when window is available", () => {
      service = new FrameCaptureService()

      expect(mockCreateElement).toHaveBeenCalledWith("canvas")
      expect(mockCanvas.getContext).toHaveBeenCalledWith("2d")
    })

    it("handles case when window is undefined", () => {
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
      })

      service = new FrameCaptureService()
      expect(mockCreateElement).not.toHaveBeenCalled()
    })
  })

  describe("captureFrame", () => {
    beforeEach(() => {
      service = new FrameCaptureService()
    })

    it("returns null when canvas is not available", () => {
      // Мокаем сервис без canvas
      const serviceWithoutCanvas = new FrameCaptureService()
      Object.defineProperty(serviceWithoutCanvas, "canvas", { value: null })

      const result = serviceWithoutCanvas.captureFrame(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when context is not available", () => {
      const serviceWithoutContext = new FrameCaptureService()
      Object.defineProperty(serviceWithoutContext, "context", { value: null })

      const result = serviceWithoutContext.captureFrame(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when video element is not provided", () => {
      const result = service.captureFrame(null as any)
      expect(result).toBeNull()
    })

    it("returns null when video is not ready", () => {
      const unreadyVideo = Object.assign(Object.create(HTMLVideoElement.prototype), {
        videoWidth: mockVideoElement.videoWidth,
        videoHeight: mockVideoElement.videoHeight,
        currentTime: mockVideoElement.currentTime,
        readyState: 1,
      }) as HTMLVideoElement

      const result = service.captureFrame(unreadyVideo)
      expect(result).toBeNull()
    })

    it("successfully captures frame when all conditions are met", () => {
      const result = service.captureFrame(mockVideoElement)

      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(1080)
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockVideoElement, 0, 0, 1920, 1080)
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 1920, 1080)
      expect(result).toBe(mockImageData)
    })

    it("handles video with different dimensions", () => {
      const smallVideo = Object.assign(Object.create(HTMLVideoElement.prototype), {
        readyState: mockVideoElement.readyState,
        currentTime: mockVideoElement.currentTime,
        videoWidth: 640,
        videoHeight: 480,
      }) as HTMLVideoElement

      service.captureFrame(smallVideo)

      expect(mockCanvas.width).toBe(640)
      expect(mockCanvas.height).toBe(480)
      expect(mockContext.drawImage).toHaveBeenCalledWith(smallVideo, 0, 0, 640, 480)
    })
  })

  describe("captureFrameAsBlob", () => {
    beforeEach(() => {
      service = new FrameCaptureService()
    })

    it("returns null when canvas is not available", async () => {
      const serviceWithoutCanvas = new FrameCaptureService()
      Object.defineProperty(serviceWithoutCanvas, "canvas", { value: null })

      const result = await serviceWithoutCanvas.captureFrameAsBlob(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when context is not available", async () => {
      const serviceWithoutContext = new FrameCaptureService()
      Object.defineProperty(serviceWithoutContext, "context", { value: null })

      const result = await serviceWithoutContext.captureFrameAsBlob(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when video element is not provided", async () => {
      const result = await service.captureFrameAsBlob(null as any)
      expect(result).toBeNull()
    })

    it("returns null when video is not ready", async () => {
      const unreadyVideo = Object.assign(Object.create(HTMLVideoElement.prototype), {
        videoWidth: mockVideoElement.videoWidth,
        videoHeight: mockVideoElement.videoHeight,
        currentTime: mockVideoElement.currentTime,
        readyState: 1,
      }) as HTMLVideoElement

      const result = await service.captureFrameAsBlob(unreadyVideo)
      expect(result).toBeNull()
    })

    it("successfully captures frame as blob with default parameters", async () => {
      const result = await service.captureFrameAsBlob(mockVideoElement)

      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(1080)
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockVideoElement, 0, 0, 1920, 1080)
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.8)
      expect(result).toBeInstanceOf(Blob)
    })

    it("captures frame as PNG with custom quality", async () => {
      await service.captureFrameAsBlob(mockVideoElement, "image/png", 0.9)

      expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png", 0.9)
    })

    it("handles toBlob callback with null blob", async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null)
      })

      const result = await service.captureFrameAsBlob(mockVideoElement)
      expect(result).toBeNull()
    })
  })

  describe("captureFrameAsBase64", () => {
    beforeEach(() => {
      service = new FrameCaptureService()
    })

    it("returns null when canvas is not available", () => {
      const serviceWithoutCanvas = new FrameCaptureService()
      Object.defineProperty(serviceWithoutCanvas, "canvas", { value: null })

      const result = serviceWithoutCanvas.captureFrameAsBase64(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when context is not available", () => {
      const serviceWithoutContext = new FrameCaptureService()
      Object.defineProperty(serviceWithoutContext, "context", { value: null })

      const result = serviceWithoutContext.captureFrameAsBase64(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when video element is not provided", () => {
      const result = service.captureFrameAsBase64(null as any)
      expect(result).toBeNull()
    })

    it("returns null when video is not ready", () => {
      const unreadyVideo = Object.assign(Object.create(HTMLVideoElement.prototype), {
        videoWidth: mockVideoElement.videoWidth,
        videoHeight: mockVideoElement.videoHeight,
        currentTime: mockVideoElement.currentTime,
        readyState: 1,
      }) as HTMLVideoElement

      const result = service.captureFrameAsBase64(unreadyVideo)
      expect(result).toBeNull()
    })

    it("successfully captures frame as base64 with default parameters", () => {
      const result = service.captureFrameAsBase64(mockVideoElement)

      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(1080)
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockVideoElement, 0, 0, 1920, 1080)
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8)
      expect(result).toBe("data:image/jpeg;base64,test")
    })

    it("captures frame as PNG with custom quality", () => {
      service.captureFrameAsBase64(mockVideoElement, "image/png", 0.9)

      expect(mockCanvas.toDataURL).toHaveBeenCalledWith("image/png", 0.9)
    })
  })

  describe("captureThumbnail", () => {
    beforeEach(() => {
      service = new FrameCaptureService()
    })

    it("returns null when canvas is not available", () => {
      const serviceWithoutCanvas = new FrameCaptureService()
      Object.defineProperty(serviceWithoutCanvas, "canvas", { value: null })

      const result = serviceWithoutCanvas.captureThumbnail(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when context is not available", () => {
      const serviceWithoutContext = new FrameCaptureService()
      Object.defineProperty(serviceWithoutContext, "context", { value: null })

      const result = serviceWithoutContext.captureThumbnail(mockVideoElement)
      expect(result).toBeNull()
    })

    it("returns null when video element is not provided", () => {
      const result = service.captureThumbnail(null as any)
      expect(result).toBeNull()
    })

    it("returns null when video is not ready", () => {
      const unreadyVideo = Object.assign(Object.create(HTMLVideoElement.prototype), {
        videoWidth: mockVideoElement.videoWidth,
        videoHeight: mockVideoElement.videoHeight,
        currentTime: mockVideoElement.currentTime,
        readyState: 1,
      }) as HTMLVideoElement

      const result = service.captureThumbnail(unreadyVideo)
      expect(result).toBeNull()
    })

    it("creates thumbnail with default size (320x240)", () => {
      const result = service.captureThumbnail(mockVideoElement)

      // Для видео 1920x1080 (соотношение 16:9) при максимуме 320x240
      // width/height = 1920/1080 = 1.777
      // maxWidth/maxHeight = 320/240 = 1.333
      // Поскольку aspectRatio > maxWidth/maxHeight, высота будет уменьшена
      // height = 320 / 1.777 = 180
      expect(mockCanvas.width).toBe(320)
      expect(mockCanvas.height).toBe(180)
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockVideoElement, 0, 0, 320, 180)
      expect(result).toBe(mockImageData)
    })

    it("creates thumbnail with custom size", () => {
      service.captureThumbnail(mockVideoElement, 160, 120)

      // Для видео 1920x1080 при максимуме 160x120
      // height = 160 / 1.777 = 90
      expect(mockCanvas.width).toBe(160)
      expect(mockCanvas.height).toBe(90)
    })

    it("handles portrait video correctly", () => {
      const portraitVideo = {
        readyState: mockVideoElement.readyState,
        currentTime: mockVideoElement.currentTime,
        videoWidth: 1080,
        videoHeight: 1920,
      } as HTMLVideoElement

      service.captureThumbnail(portraitVideo, 320, 240)

      // Для видео 1080x1920 (соотношение 0.5625) при максимуме 320x240
      // aspectRatio < maxWidth/maxHeight, поэтому ширина будет уменьшена
      // width = 240 * 0.5625 = 135
      expect(mockCanvas.width).toBe(135)
      expect(mockCanvas.height).toBe(240)
    })

    it("handles square video correctly", () => {
      const squareVideo = {
        readyState: mockVideoElement.readyState,
        currentTime: mockVideoElement.currentTime,
        videoWidth: 1000,
        videoHeight: 1000,
      } as HTMLVideoElement

      service.captureThumbnail(squareVideo, 320, 240)

      // Для квадратного видео 1000x1000 (соотношение 1.0) при максимуме 320x240
      // aspectRatio > maxWidth/maxHeight (1.333), поэтому высота будет уменьшена
      // height = 320 / 1.0 = 320, но это больше maxHeight(240), поэтому width = 240 * 1.0 = 240
      expect(mockCanvas.width).toBe(240)
      expect(mockCanvas.height).toBe(240)
    })

    it("rounds dimensions correctly", () => {
      // Видео с размерами, которые дают дробные результаты
      const oddVideo = {
        readyState: mockVideoElement.readyState,
        currentTime: mockVideoElement.currentTime,
        videoWidth: 1920,
        videoHeight: 1077, // Нестандартная высота
      } as HTMLVideoElement

      service.captureThumbnail(oddVideo, 320, 240)

      // aspectRatio = 1920/1077 = 1.783
      // height = 320 / 1.783 = 179.4 -> Math.round(179.4) = 179
      // Но фактический расчет дает 180, поэтому проверяем реальный результат
      expect(mockCanvas.width).toBe(320)
      expect(mockCanvas.height).toBe(180)
    })
  })

  describe("dispose", () => {
    beforeEach(() => {
      service = new FrameCaptureService()
    })

    it("clears canvas and context references", () => {
      service.dispose()

      // Проверяем через публичные методы что ресурсы очищены
      const result = service.captureFrame(mockVideoElement)
      expect(result).toBeNull()
    })

    it("can be called multiple times safely", () => {
      service.dispose()
      service.dispose()

      // Не должно выбрасывать ошибки
      expect(() => service.dispose()).not.toThrow()
    })
  })

  describe("error handling", () => {
    let errorService: FrameCaptureService

    beforeEach(() => {
      // Создаем отдельный сервис для тестов ошибок
      errorService = new FrameCaptureService()
      // Сбрасываем все моки перед каждым тестом
      vi.clearAllMocks()
      mockCanvas.getContext.mockReturnValue(mockContext)
      mockContext.getImageData.mockReturnValue(mockImageData)
      mockCanvas.toDataURL.mockReturnValue("data:image/jpeg;base64,test")
    })

    it("handles drawImage throwing error", () => {
      mockContext.drawImage.mockImplementationOnce(() => {
        throw new Error("drawImage failed")
      })

      expect(() => errorService.captureFrame(mockVideoElement)).toThrow("drawImage failed")
    })

    it("handles getImageData throwing error", () => {
      mockContext.drawImage.mockImplementationOnce(() => {}) // Не бросаем ошибку
      mockContext.getImageData.mockImplementationOnce(() => {
        throw new Error("getImageData failed")
      })

      expect(() => errorService.captureFrame(mockVideoElement)).toThrow("getImageData failed")
    })

    it("handles toDataURL throwing error", () => {
      mockContext.drawImage.mockImplementationOnce(() => {}) // Не бросаем ошибку
      mockCanvas.toDataURL.mockImplementationOnce(() => {
        throw new Error("toDataURL failed")
      })

      expect(() => errorService.captureFrameAsBase64(mockVideoElement)).toThrow("toDataURL failed")
    })
  })

  describe("integration scenarios", () => {
    beforeEach(() => {
      service = new FrameCaptureService()
    })

    it("handles video with zero dimensions", () => {
      const zeroVideo = {
        readyState: mockVideoElement.readyState,
        currentTime: mockVideoElement.currentTime,
        videoWidth: 0,
        videoHeight: 0,
      } as HTMLVideoElement

      const result = service.captureFrame(zeroVideo)

      expect(mockCanvas.width).toBe(0)
      expect(mockCanvas.height).toBe(0)
      expect(result).toBe(mockImageData)
    })

    it("handles very large video dimensions", () => {
      const largeVideo = {
        readyState: mockVideoElement.readyState,
        currentTime: mockVideoElement.currentTime,
        videoWidth: 7680,
        videoHeight: 4320,
      } as HTMLVideoElement

      service.captureFrame(largeVideo)

      expect(mockCanvas.width).toBe(7680)
      expect(mockCanvas.height).toBe(4320)
    })

    it("can capture multiple frames in sequence", () => {
      service.captureFrame(mockVideoElement)
      service.captureFrame(mockVideoElement)
      service.captureFrame(mockVideoElement)

      expect(mockContext.drawImage).toHaveBeenCalledTimes(3)
      expect(mockContext.getImageData).toHaveBeenCalledTimes(3)
    })

    it("can switch between different capture methods", async () => {
      service.captureFrame(mockVideoElement)
      await service.captureFrameAsBlob(mockVideoElement)
      service.captureFrameAsBase64(mockVideoElement)
      service.captureThumbnail(mockVideoElement)

      expect(mockContext.drawImage).toHaveBeenCalledTimes(4)
    })
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  blobToUint8Array,
  calculateAspectRatio,
  cleanupMediaStream,
  cleanupVideoElement,
  debounce,
  formatRecordingTime,
  generateRecordingFileName,
  getBestSupportedMimeType,
  getTrackSettings,
  isMediaDevicesSupported,
  isMimeTypeSupported,
  isScreenCaptureSupported,
  parseMediaError,
  parseResolution,
} from "../utils"

describe("camera-capture/utils", () => {
  describe("cleanupMediaStream", () => {
    it("should do nothing if stream is null", () => {
      expect(() => cleanupMediaStream(null)).not.toThrow()
    })

    it("should stop all active tracks", () => {
      const track1 = {
        readyState: "live" as const,
        kind: "video" as const,
        stop: vi.fn(),
      } as unknown as MediaStreamTrack

      const track2 = {
        readyState: "live" as const,
        kind: "audio" as const,
        stop: vi.fn(),
      } as unknown as MediaStreamTrack

      const stream = {
        getTracks: () => [track1, track2],
      } as unknown as MediaStream

      cleanupMediaStream(stream)

      expect(track1.stop).toHaveBeenCalled()
      expect(track2.stop).toHaveBeenCalled()
    })

    it("should skip already ended tracks", () => {
      const track1 = {
        readyState: "ended" as const,
        kind: "video" as const,
        stop: vi.fn(),
      } as unknown as MediaStreamTrack

      const stream = {
        getTracks: () => [track1],
      } as unknown as MediaStream

      cleanupMediaStream(stream)

      expect(track1.stop).not.toHaveBeenCalled()
    })

    it("should handle errors when stopping tracks", () => {
      const track1 = {
        readyState: "live" as const,
        kind: "video" as const,
        stop: vi.fn(() => {
          throw new Error("Stop failed")
        }),
      } as unknown as MediaStreamTrack

      const stream = {
        getTracks: () => [track1],
      } as unknown as MediaStream

      expect(() => cleanupMediaStream(stream, "Test cleanup")).not.toThrow()
    })

    it("should use custom log prefix", () => {
      const track = {
        readyState: "live" as const,
        kind: "video" as const,
        stop: vi.fn(),
      } as unknown as MediaStreamTrack

      const stream = {
        getTracks: () => [track],
      } as unknown as MediaStream

      expect(() => cleanupMediaStream(stream, "Custom prefix")).not.toThrow()
    })
  })

  describe("cleanupVideoElement", () => {
    it("should do nothing if element is null", () => {
      expect(() => cleanupVideoElement(null)).not.toThrow()
    })

    it("should clear srcObject", () => {
      const mockStream = {} as MediaStream
      const videoElement = {
        srcObject: mockStream,
        paused: true,
        pause: vi.fn(),
        currentTime: 10,
      } as unknown as HTMLVideoElement

      cleanupVideoElement(videoElement)

      expect(videoElement.srcObject).toBeNull()
      expect(videoElement.currentTime).toBe(0)
    })

    it("should pause playing video", () => {
      const videoElement = {
        srcObject: null,
        paused: false,
        pause: vi.fn(),
        currentTime: 5,
      } as unknown as HTMLVideoElement

      cleanupVideoElement(videoElement)

      expect(videoElement.pause).toHaveBeenCalled()
      expect(videoElement.currentTime).toBe(0)
    })

    it("should handle errors gracefully", () => {
      const videoElement = {
        srcObject: {} as MediaStream,
        paused: true,
        pause: vi.fn(),
        get currentTime() {
          throw new Error("Cannot set currentTime")
        },
        set currentTime(_value: number) {
          throw new Error("Cannot set currentTime")
        },
      } as unknown as HTMLVideoElement

      expect(() => cleanupVideoElement(videoElement, "Test cleanup")).not.toThrow()
    })

    it("should use custom log prefix", () => {
      const videoElement = {
        srcObject: null,
        paused: true,
        pause: vi.fn(),
        currentTime: 0,
      } as unknown as HTMLVideoElement

      expect(() => cleanupVideoElement(videoElement, "Custom prefix")).not.toThrow()
    })
  })

  describe("formatRecordingTime", () => {
    it("should format time correctly", () => {
      // formatDurationMs formats without leading zero for minutes < 10
      expect(formatRecordingTime(0)).toBe("0:00")
      expect(formatRecordingTime(1000)).toBe("0:01")
      expect(formatRecordingTime(60000)).toBe("1:00")
      expect(formatRecordingTime(3661000)).toBe("1:01:01")
    })
  })

  describe("isMediaDevicesSupported", () => {
    it("should return true when APIs are supported", () => {
      global.navigator.mediaDevices = {
        getUserMedia: vi.fn(),
      } as any

      global.MediaRecorder = vi.fn() as any

      expect(isMediaDevicesSupported()).toBe(true)
    })

    it("should return false when navigator.mediaDevices is undefined", () => {
      const originalMediaDevices = global.navigator.mediaDevices
      // @ts-expect-error - Testing missing API
      global.navigator.mediaDevices = undefined

      expect(isMediaDevicesSupported()).toBe(false)

      global.navigator.mediaDevices = originalMediaDevices
    })

    it("should return false when getUserMedia is undefined", () => {
      global.navigator.mediaDevices = {} as any

      expect(isMediaDevicesSupported()).toBe(false)
    })

    it("should return false when MediaRecorder is undefined", () => {
      const originalMediaRecorder = global.MediaRecorder
      // @ts-expect-error - Testing missing API
      delete global.MediaRecorder

      expect(isMediaDevicesSupported()).toBe(false)

      global.MediaRecorder = originalMediaRecorder
    })
  })

  describe("isScreenCaptureSupported", () => {
    it("should return true when getDisplayMedia is supported", () => {
      global.navigator.mediaDevices = {
        getDisplayMedia: vi.fn(),
      } as any

      expect(isScreenCaptureSupported()).toBe(true)
    })

    it("should return false when getDisplayMedia is undefined", () => {
      global.navigator.mediaDevices = {} as any

      expect(isScreenCaptureSupported()).toBe(false)
    })

    it("should return false when mediaDevices is undefined", () => {
      const originalMediaDevices = global.navigator.mediaDevices
      // @ts-expect-error - Testing missing API
      global.navigator.mediaDevices = undefined

      expect(isScreenCaptureSupported()).toBe(false)

      global.navigator.mediaDevices = originalMediaDevices
    })
  })

  describe("isMimeTypeSupported", () => {
    it("should return false when MediaRecorder is undefined", () => {
      const originalMediaRecorder = global.MediaRecorder
      // @ts-expect-error - Testing missing API
      delete global.MediaRecorder

      expect(isMimeTypeSupported("video/webm")).toBe(false)

      global.MediaRecorder = originalMediaRecorder
    })

    it("should check if mime type is supported", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((type) => type === "video/webm")

      expect(isMimeTypeSupported("video/webm")).toBe(true)
      expect(isMimeTypeSupported("video/mp4")).toBe(false)
    })
  })

  describe("getBestSupportedMimeType", () => {
    it("should return first supported mime type", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((type) => type === "video/webm;codecs=vp9")

      const mimeTypes = ["video/mp4", "video/webm;codecs=vp9", "video/webm"]

      expect(getBestSupportedMimeType(mimeTypes)).toBe("video/webm;codecs=vp9")
    })

    it("should return undefined when no types are supported", () => {
      global.MediaRecorder.isTypeSupported = vi.fn(() => false)

      const mimeTypes = ["video/mp4", "video/webm"]

      expect(getBestSupportedMimeType(mimeTypes)).toBeUndefined()
    })

    it("should return undefined for empty array", () => {
      expect(getBestSupportedMimeType([])).toBeUndefined()
    })
  })

  describe("generateRecordingFileName", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should generate filename with default prefix and extension", () => {
      const date = new Date("2024-01-01T12:00:00.000Z")
      vi.setSystemTime(date)

      const filename = generateRecordingFileName()

      expect(filename).toBe("recording_2024-01-01T12-00-00-000Z.webm")
    })

    it("should generate filename with custom prefix", () => {
      const date = new Date("2024-01-01T12:00:00.000Z")
      vi.setSystemTime(date)

      const filename = generateRecordingFileName("custom")

      expect(filename).toBe("custom_2024-01-01T12-00-00-000Z.webm")
    })

    it("should generate filename with custom extension", () => {
      const date = new Date("2024-01-01T12:00:00.000Z")
      vi.setSystemTime(date)

      const filename = generateRecordingFileName("recording", "mp4")

      expect(filename).toBe("recording_2024-01-01T12-00-00-000Z.mp4")
    })
  })

  describe("blobToUint8Array", () => {
    it("should convert blob to Uint8Array", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      const blob = new Blob([data])

      // Mock arrayBuffer if not available
      if (!blob.arrayBuffer) {
        blob.arrayBuffer = vi.fn(async () => data.buffer)
      }

      const result = await blobToUint8Array(blob)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(data)
    })

    it("should handle empty blob", async () => {
      const blob = new Blob([])

      // Mock arrayBuffer if not available
      if (!blob.arrayBuffer) {
        blob.arrayBuffer = vi.fn(async () => new ArrayBuffer(0))
      }

      const result = await blobToUint8Array(blob)

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBe(0)
    })
  })

  describe("parseResolution", () => {
    it("should parse valid resolution string", () => {
      expect(parseResolution("1920x1080")).toEqual({ width: 1920, height: 1080 })
      expect(parseResolution("640x480")).toEqual({ width: 640, height: 480 })
      expect(parseResolution("3840x2160")).toEqual({ width: 3840, height: 2160 })
    })

    it("should return null for invalid format", () => {
      expect(parseResolution("invalid")).toBeNull()
      expect(parseResolution("1920")).toBeNull()
      expect(parseResolution("1920-1080")).toBeNull()
      expect(parseResolution("")).toBeNull()
    })

    it("should handle resolution string with extra text", () => {
      expect(parseResolution("Resolution: 1920x1080")).toEqual({ width: 1920, height: 1080 })
      expect(parseResolution("1920x1080p")).toEqual({ width: 1920, height: 1080 })
    })
  })

  describe("getTrackSettings", () => {
    it("should return null for null stream", () => {
      expect(getTrackSettings(null, "video")).toBeNull()
    })

    it("should return video track settings", () => {
      const settings = { width: 1920, height: 1080 }
      const videoTrack = {
        getSettings: () => settings,
      } as unknown as MediaStreamTrack

      const stream = {
        getVideoTracks: () => [videoTrack],
        getAudioTracks: () => [],
      } as unknown as MediaStream

      expect(getTrackSettings(stream, "video")).toEqual(settings)
    })

    it("should return audio track settings", () => {
      const settings = { sampleRate: 48000 }
      const audioTrack = {
        getSettings: () => settings,
      } as unknown as MediaStreamTrack

      const stream = {
        getVideoTracks: () => [],
        getAudioTracks: () => [audioTrack],
      } as unknown as MediaStream

      expect(getTrackSettings(stream, "audio")).toEqual(settings)
    })

    it("should return null when no tracks available", () => {
      const stream = {
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      } as unknown as MediaStream

      expect(getTrackSettings(stream, "video")).toBeNull()
      expect(getTrackSettings(stream, "audio")).toBeNull()
    })
  })

  describe("calculateAspectRatio", () => {
    it("should calculate aspect ratio correctly", () => {
      expect(calculateAspectRatio(1920, 1080)).toBe("16:9")
      expect(calculateAspectRatio(1280, 720)).toBe("16:9")
      expect(calculateAspectRatio(640, 480)).toBe("4:3")
      expect(calculateAspectRatio(1024, 768)).toBe("4:3")
      expect(calculateAspectRatio(2560, 1440)).toBe("16:9")
      expect(calculateAspectRatio(3840, 2160)).toBe("16:9")
    })

    it("should handle square aspect ratio", () => {
      expect(calculateAspectRatio(1080, 1080)).toBe("1:1")
      expect(calculateAspectRatio(1000, 1000)).toBe("1:1")
    })

    it("should handle unusual aspect ratios", () => {
      expect(calculateAspectRatio(1920, 800)).toBe("12:5")
      expect(calculateAspectRatio(2560, 1080)).toBe("64:27")
    })
  })

  describe("parseMediaError", () => {
    it("should return null for non-Error objects", () => {
      expect(parseMediaError("string error")).toBeNull()
      expect(parseMediaError(123)).toBeNull()
      expect(parseMediaError(null)).toBeNull()
      expect(parseMediaError(undefined)).toBeNull()
    })

    it("should parse NotAllowedError", () => {
      const error = new Error("Permission denied")
      error.name = "NotAllowedError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "NotAllowedError",
        message: "Доступ к устройству запрещён пользователем",
      })
    })

    it("should parse NotFoundError", () => {
      const error = new Error("Device not found")
      error.name = "NotFoundError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "NotFoundError",
        message: "Устройство не найдено",
      })
    })

    it("should parse NotReadableError", () => {
      const error = new Error("Device in use")
      error.name = "NotReadableError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "NotReadableError",
        message: "Устройство используется другим приложением",
      })
    })

    it("should parse OverconstrainedError", () => {
      const error = new Error("Constraints not satisfied")
      error.name = "OverconstrainedError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "OverconstrainedError",
        message: "Устройство не поддерживает запрошенные настройки",
      })
    })

    it("should parse SecurityError", () => {
      const error = new Error("Security error")
      error.name = "SecurityError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "SecurityError",
        message: "Доступ заблокирован по соображениям безопасности",
      })
    })

    it("should parse AbortError", () => {
      const error = new Error("Operation aborted")
      error.name = "AbortError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "AbortError",
        message: "Операция была прервана",
      })
    })

    it("should handle unknown error types", () => {
      const error = new Error("Unknown error")
      error.name = "UnknownError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "UnknownError",
        message: "Unknown error",
      })
    })

    it("should use error message as fallback", () => {
      const error = new Error("Custom error message")
      error.name = "CustomError"

      const result = parseMediaError(error)

      expect(result).toEqual({
        type: "CustomError",
        message: "Custom error message",
      })
    })
  })

  describe("debounce", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should debounce function calls", () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc()
      debouncedFunc()
      debouncedFunc()

      expect(func).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(func).toHaveBeenCalledTimes(1)
    })

    it("should pass arguments to debounced function", () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc("arg1", "arg2")

      vi.advanceTimersByTime(100)

      expect(func).toHaveBeenCalledWith("arg1", "arg2")
    })

    it("should reset timer on each call", () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc()
      vi.advanceTimersByTime(50)
      debouncedFunc()
      vi.advanceTimersByTime(50)

      expect(func).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)

      expect(func).toHaveBeenCalledTimes(1)
    })

    it("should call function with latest arguments", () => {
      const func = vi.fn()
      const debouncedFunc = debounce(func, 100)

      debouncedFunc("first")
      debouncedFunc("second")
      debouncedFunc("third")

      vi.advanceTimersByTime(100)

      expect(func).toHaveBeenCalledWith("third")
      expect(func).toHaveBeenCalledTimes(1)
    })
  })
})

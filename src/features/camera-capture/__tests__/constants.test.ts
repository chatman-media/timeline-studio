import { describe, expect, it } from "vitest"
import {
  CAMERA_CAPTURE_DEFAULTS,
  CAMERA_ERROR_MESSAGES,
  CAMERA_RESOLUTIONS,
  COUNTDOWN_OPTIONS,
  FRAME_RATES,
  MAX_RECORDING_DURATION,
  MAX_RECORDING_FILE_SIZE,
  MEDIA_RECORDER_BUFFER_SIZE,
  MIN_RECORDING_DURATION,
  RECORDING_FILENAME_PREFIX,
  RECORDING_QUALITY_PRESETS,
  RECORDING_TIME_UPDATE_INTERVAL,
  RECORDINGS_DIRECTORY,
  SCREEN_CAPTURE_DEFAULTS,
  SUPPORTED_VIDEO_FORMATS,
} from "../constants"

describe("camera-capture/constants", () => {
  describe("SUPPORTED_VIDEO_FORMATS", () => {
    it("should be an array of RecordingFormat objects", () => {
      expect(Array.isArray(SUPPORTED_VIDEO_FORMATS)).toBe(true)
      expect(SUPPORTED_VIDEO_FORMATS.length).toBeGreaterThan(0)
    })

    it("should have correct structure for each format", () => {
      SUPPORTED_VIDEO_FORMATS.forEach((format) => {
        expect(format).toHaveProperty("mimeType")
        expect(format).toHaveProperty("extension")
        expect(format).toHaveProperty("label")
        expect(format).toHaveProperty("isSupported")

        expect(typeof format.mimeType).toBe("string")
        expect(typeof format.extension).toBe("string")
        expect(typeof format.label).toBe("string")
        expect(typeof format.isSupported).toBe("boolean")
      })
    })

    it("should include WebM formats", () => {
      const webmFormats = SUPPORTED_VIDEO_FORMATS.filter((f) => f.extension === "webm")
      expect(webmFormats.length).toBeGreaterThan(0)
    })

    it("should include MP4 formats", () => {
      const mp4Formats = SUPPORTED_VIDEO_FORMATS.filter((f) => f.extension === "mp4")
      expect(mp4Formats.length).toBeGreaterThan(0)
    })
  })

  describe("RECORDING_QUALITY_PRESETS", () => {
    it("should have all quality levels", () => {
      expect(RECORDING_QUALITY_PRESETS).toHaveProperty("low")
      expect(RECORDING_QUALITY_PRESETS).toHaveProperty("medium")
      expect(RECORDING_QUALITY_PRESETS).toHaveProperty("high")
      expect(RECORDING_QUALITY_PRESETS).toHaveProperty("ultraHigh")
    })

    it("should have correct structure for each preset", () => {
      Object.values(RECORDING_QUALITY_PRESETS).forEach((preset) => {
        expect(preset).toHaveProperty("videoBitsPerSecond")
        expect(preset).toHaveProperty("audioBitsPerSecond")

        expect(typeof preset.videoBitsPerSecond).toBe("number")
        expect(typeof preset.audioBitsPerSecond).toBe("number")

        expect(preset.videoBitsPerSecond).toBeGreaterThan(0)
        expect(preset.audioBitsPerSecond).toBeGreaterThan(0)
      })
    })

    it("should have increasing bitrates from low to ultraHigh", () => {
      const { low, medium, high, ultraHigh } = RECORDING_QUALITY_PRESETS

      expect(low.videoBitsPerSecond).toBeLessThan(medium.videoBitsPerSecond)
      expect(medium.videoBitsPerSecond).toBeLessThan(high.videoBitsPerSecond)
      expect(high.videoBitsPerSecond).toBeLessThan(ultraHigh.videoBitsPerSecond)

      expect(low.audioBitsPerSecond).toBeLessThan(medium.audioBitsPerSecond)
      expect(medium.audioBitsPerSecond).toBeLessThan(high.audioBitsPerSecond)
      expect(high.audioBitsPerSecond).toBeLessThan(ultraHigh.audioBitsPerSecond)
    })
  })

  describe("CAMERA_RESOLUTIONS", () => {
    it("should be an array of resolution objects", () => {
      expect(Array.isArray(CAMERA_RESOLUTIONS)).toBe(true)
      expect(CAMERA_RESOLUTIONS.length).toBeGreaterThan(0)
    })

    it("should have correct structure for each resolution", () => {
      CAMERA_RESOLUTIONS.forEach((resolution) => {
        expect(resolution).toHaveProperty("width")
        expect(resolution).toHaveProperty("height")
        expect(resolution).toHaveProperty("label")

        expect(typeof resolution.width).toBe("number")
        expect(typeof resolution.height).toBe("number")
        expect(typeof resolution.label).toBe("string")

        expect(resolution.width).toBeGreaterThan(0)
        expect(resolution.height).toBeGreaterThan(0)
      })
    })

    it("should include standard resolutions", () => {
      const labels = CAMERA_RESOLUTIONS.map((r) => r.label)

      expect(labels).toContain("480p (SD)")
      expect(labels).toContain("720p (HD)")
      expect(labels).toContain("1080p (Full HD)")
      expect(labels).toContain("1440p (2K)")
      expect(labels).toContain("2160p (4K)")
    })

    it("should be sorted by resolution (ascending)", () => {
      for (let i = 0; i < CAMERA_RESOLUTIONS.length - 1; i++) {
        expect(CAMERA_RESOLUTIONS[i].width).toBeLessThan(CAMERA_RESOLUTIONS[i + 1].width)
      }
    })
  })

  describe("FRAME_RATES", () => {
    it("should be an array of numbers", () => {
      expect(Array.isArray(FRAME_RATES)).toBe(true)
      expect(FRAME_RATES.length).toBeGreaterThan(0)
    })

    it("should include standard frame rates", () => {
      expect(FRAME_RATES).toContain(15)
      expect(FRAME_RATES).toContain(24)
      expect(FRAME_RATES).toContain(30)
      expect(FRAME_RATES).toContain(60)
    })

    it("should be sorted (ascending)", () => {
      for (let i = 0; i < FRAME_RATES.length - 1; i++) {
        expect(FRAME_RATES[i]).toBeLessThan(FRAME_RATES[i + 1])
      }
    })
  })

  describe("Recording duration constants", () => {
    it("should have MAX_RECORDING_DURATION as 1 hour", () => {
      expect(MAX_RECORDING_DURATION).toBe(3600000)
      expect(MAX_RECORDING_DURATION).toBe(60 * 60 * 1000)
    })

    it("should have MIN_RECORDING_DURATION as 1 second", () => {
      expect(MIN_RECORDING_DURATION).toBe(1000)
    })

    it("should have MAX greater than MIN", () => {
      expect(MAX_RECORDING_DURATION).toBeGreaterThan(MIN_RECORDING_DURATION)
    })
  })

  describe("COUNTDOWN_OPTIONS", () => {
    it("should be an array of numbers", () => {
      expect(Array.isArray(COUNTDOWN_OPTIONS)).toBe(true)
      expect(COUNTDOWN_OPTIONS.length).toBeGreaterThan(0)
    })

    it("should include 0 (no countdown)", () => {
      expect(COUNTDOWN_OPTIONS).toContain(0)
    })

    it("should include standard countdown durations", () => {
      expect(COUNTDOWN_OPTIONS).toContain(3)
      expect(COUNTDOWN_OPTIONS).toContain(5)
      expect(COUNTDOWN_OPTIONS).toContain(10)
    })

    it("should be sorted (ascending)", () => {
      for (let i = 0; i < COUNTDOWN_OPTIONS.length - 1; i++) {
        expect(COUNTDOWN_OPTIONS[i]).toBeLessThan(COUNTDOWN_OPTIONS[i + 1])
      }
    })
  })

  describe("Buffer and interval constants", () => {
    it("should have MEDIA_RECORDER_BUFFER_SIZE as 1MB", () => {
      expect(MEDIA_RECORDER_BUFFER_SIZE).toBe(1024)
    })

    it("should have RECORDING_TIME_UPDATE_INTERVAL as 100ms", () => {
      expect(RECORDING_TIME_UPDATE_INTERVAL).toBe(100)
    })

    it("should have reasonable values", () => {
      expect(MEDIA_RECORDER_BUFFER_SIZE).toBeGreaterThan(0)
      expect(RECORDING_TIME_UPDATE_INTERVAL).toBeGreaterThan(0)
      expect(RECORDING_TIME_UPDATE_INTERVAL).toBeLessThan(1000)
    })
  })

  describe("SCREEN_CAPTURE_DEFAULTS", () => {
    it("should have video defaults", () => {
      expect(SCREEN_CAPTURE_DEFAULTS.video).toEqual({
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      })
    })

    it("should have audio defaults with noise processing disabled", () => {
      expect(SCREEN_CAPTURE_DEFAULTS.audio).toEqual({
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      })
    })
  })

  describe("CAMERA_CAPTURE_DEFAULTS", () => {
    it("should have video defaults", () => {
      expect(CAMERA_CAPTURE_DEFAULTS.video).toEqual({
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      })
    })

    it("should have audio defaults with noise processing enabled", () => {
      expect(CAMERA_CAPTURE_DEFAULTS.audio).toEqual({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })
    })

    it("should differ from screen capture defaults in audio settings", () => {
      expect(CAMERA_CAPTURE_DEFAULTS.audio).not.toEqual(SCREEN_CAPTURE_DEFAULTS.audio)
    })
  })

  describe("CAMERA_ERROR_MESSAGES", () => {
    it("should have messages for all error types", () => {
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("NotAllowedError")
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("NotFoundError")
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("NotReadableError")
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("OverconstrainedError")
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("SecurityError")
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("AbortError")
      expect(CAMERA_ERROR_MESSAGES).toHaveProperty("UnknownError")
    })

    it("should have non-empty messages", () => {
      Object.values(CAMERA_ERROR_MESSAGES).forEach((message) => {
        expect(typeof message).toBe("string")
        expect(message.length).toBeGreaterThan(0)
      })
    })

    it("should have user-friendly Russian messages", () => {
      expect(CAMERA_ERROR_MESSAGES.NotAllowedError).toContain("Доступ")
      expect(CAMERA_ERROR_MESSAGES.NotFoundError).toContain("не найдена")
      expect(CAMERA_ERROR_MESSAGES.NotReadableError).toContain("используется")
      expect(CAMERA_ERROR_MESSAGES.OverconstrainedError).toContain("не поддерживает")
    })
  })

  describe("File system constants", () => {
    it("should have RECORDINGS_DIRECTORY", () => {
      expect(RECORDINGS_DIRECTORY).toBe("recordings")
      expect(typeof RECORDINGS_DIRECTORY).toBe("string")
      expect(RECORDINGS_DIRECTORY.length).toBeGreaterThan(0)
    })

    it("should have RECORDING_FILENAME_PREFIX", () => {
      expect(RECORDING_FILENAME_PREFIX).toBe("camera_recording")
      expect(typeof RECORDING_FILENAME_PREFIX).toBe("string")
      expect(RECORDING_FILENAME_PREFIX.length).toBeGreaterThan(0)
    })

    it("should have MAX_RECORDING_FILE_SIZE as 2GB", () => {
      expect(MAX_RECORDING_FILE_SIZE).toBe(2 * 1024 * 1024 * 1024)
      expect(MAX_RECORDING_FILE_SIZE).toBe(2147483648)
    })

    it("should have reasonable file size limit", () => {
      expect(MAX_RECORDING_FILE_SIZE).toBeGreaterThan(0)
      expect(MAX_RECORDING_FILE_SIZE).toBeGreaterThan(1024 * 1024 * 1024) // At least 1GB
    })
  })
})

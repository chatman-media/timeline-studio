/**
 * Tests for Tauri voice recording types and functions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockSaveVoiceRecording = vi.fn()
const mockGetSupportedAudioFormats = vi.fn()

vi.mock("@timeline-studio/core/container", () => ({
  container: {
    getAI: () => ({
      saveVoiceRecording: mockSaveVoiceRecording,
      getSupportedAudioFormats: mockGetSupportedAudioFormats,
    }),
  },
}))

import {
  blobToBase64,
  formatFileName,
  getMediaRecorderOptions,
  getMimeTypeForFormat,
  getSupportedAudioFormats,
  isFormatSupportedByMediaRecorder,
  saveVoiceRecording,
} from "../../types/tauri"

describe("Tauri Voice Recording Types", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем MediaRecorder
    global.MediaRecorder = vi.fn() as any
    global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("saveVoiceRecording", () => {
    it("должен вызывать core AI service с правильными параметрами", async () => {
      mockSaveVoiceRecording.mockResolvedValueOnce({
        filePath: "/path/to/file.webm",
        fileName: "voice_recording.webm",
        fileSize: 1024,
        format: "webm",
      })

      const params = {
        audioData: "base64data",
        fileName: "test",
        format: "webm" as const,
        useSubdirectory: true,
      }

      const result = await saveVoiceRecording(params)

      expect(mockSaveVoiceRecording).toHaveBeenCalledWith(params)
      expect(result.filePath).toBe("/path/to/file.webm")
      expect(result.fileName).toBe("voice_recording.webm")
      expect(result.fileSize).toBe(1024)
    })

    it("должен пробрасывать ошибку от core AI service", async () => {
      mockSaveVoiceRecording.mockRejectedValueOnce(new Error("Tauri error"))

      const params = {
        audioData: "base64data",
        fileName: "test",
        format: "webm" as const,
      }

      await expect(saveVoiceRecording(params)).rejects.toThrow("Tauri error")
    })
  })

  describe("getSupportedAudioFormats", () => {
    it("должен вызывать core AI service и возвращать форматы", async () => {
      const mockFormats = [
        { format: "webm", name: "WebM", description: "WebM format", supported: true },
        { format: "mp3", name: "MP3", description: "MP3 format", supported: true },
      ]
      mockGetSupportedAudioFormats.mockResolvedValueOnce(mockFormats)

      const result = await getSupportedAudioFormats()

      expect(mockGetSupportedAudioFormats).toHaveBeenCalledWith()
      expect(result).toEqual(mockFormats)
    })
  })

  describe("blobToBase64", () => {
    it("должен конвертировать Blob в base64", async () => {
      const testData = "Hello, World!"
      const encoder = new TextEncoder()
      const arrayBuffer = encoder.encode(testData).buffer

      // Создаем mock Blob с arrayBuffer методом
      const mockBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
        type: "text/plain",
      } as unknown as Blob

      const result = await blobToBase64(mockBlob)

      // Decode and verify
      const decoded = atob(result)
      expect(decoded).toBe(testData)
    })

    it("должен работать с бинарными данными", async () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 254, 253])
      const arrayBuffer = bytes.buffer

      const mockBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
        type: "application/octet-stream",
      } as unknown as Blob

      const result = await blobToBase64(mockBlob)

      // Verify it's valid base64
      expect(() => atob(result)).not.toThrow()

      // Verify round-trip
      const decoded = atob(result)
      expect(decoded.length).toBe(bytes.length)
      for (let i = 0; i < bytes.length; i++) {
        expect(decoded.charCodeAt(i)).toBe(bytes[i])
      }
    })

    it("должен работать с пустым Blob", async () => {
      const emptyBuffer = new ArrayBuffer(0)

      const mockBlob = {
        arrayBuffer: vi.fn().mockResolvedValue(emptyBuffer),
        type: "text/plain",
      } as unknown as Blob

      const result = await blobToBase64(mockBlob)

      expect(result).toBe("") // Empty base64
    })

    it("должен пробрасывать ошибку при неудаче", async () => {
      const mockBlob = {
        arrayBuffer: vi.fn().mockRejectedValue(new Error("ArrayBuffer error")),
        type: "text/plain",
      } as unknown as Blob

      await expect(blobToBase64(mockBlob)).rejects.toThrow("Failed to convert blob to base64: ArrayBuffer error")
    })
  })

  describe("formatFileName", () => {
    it("должен форматировать имя файла с временной меткой", () => {
      const result = formatFileName()

      expect(result).toMatch(/^voice_recording_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/)
    })

    it("должен использовать кастомный префикс", () => {
      const result = formatFileName("custom_prefix")

      expect(result).toMatch(/^custom_prefix_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/)
    })

    it("должен генерировать уникальные имена", () => {
      const name1 = formatFileName()

      // Небольшая задержка для гарантии разных временных меток
      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      const name2 = formatFileName()

      vi.useRealTimers()

      // Имена могут быть разными из-за разного времени
      expect(name1).toBeDefined()
      expect(name2).toBeDefined()
    })
  })

  describe("getMimeTypeForFormat", () => {
    it("должен возвращать правильный MIME тип для webm", () => {
      expect(getMimeTypeForFormat("webm")).toBe("audio/webm")
    })

    it("должен возвращать правильный MIME тип для mp3", () => {
      expect(getMimeTypeForFormat("mp3")).toBe("audio/mpeg")
    })

    it("должен возвращать правильный MIME тип для wav", () => {
      expect(getMimeTypeForFormat("wav")).toBe("audio/wav")
    })

    it("должен возвращать правильный MIME тип для ogg", () => {
      expect(getMimeTypeForFormat("ogg")).toBe("audio/ogg")
    })

    it("должен возвращать правильный MIME тип для m4a", () => {
      expect(getMimeTypeForFormat("m4a")).toBe("audio/mp4")
    })
  })

  describe("isFormatSupportedByMediaRecorder", () => {
    it("должен возвращать false если MediaRecorder не определен", () => {
      const originalMediaRecorder = global.MediaRecorder
      // @ts-expect-error - намеренно удаляем для теста
      delete global.MediaRecorder

      expect(isFormatSupportedByMediaRecorder("webm")).toBe(false)

      global.MediaRecorder = originalMediaRecorder
    })

    it("должен возвращать false если isTypeSupported не определен", () => {
      global.MediaRecorder = vi.fn() as any
      // @ts-expect-error - намеренно удаляем для теста
      global.MediaRecorder.isTypeSupported = undefined

      expect(isFormatSupportedByMediaRecorder("webm")).toBe(false)
    })

    it("должен проверять поддержку webm с кодеками", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/webm;codecs=opus"
      })

      expect(isFormatSupportedByMediaRecorder("webm")).toBe(true)
    })

    it("должен проверять vorbis кодек если opus не поддерживается", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/webm;codecs=vorbis"
      })

      expect(isFormatSupportedByMediaRecorder("webm")).toBe(true)
    })

    it("должен проверять базовый webm если кодеки не поддерживаются", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/webm"
      })

      expect(isFormatSupportedByMediaRecorder("webm")).toBe(true)
    })

    it("должен возвращать false если webm не поддерживается", () => {
      global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(false)

      expect(isFormatSupportedByMediaRecorder("webm")).toBe(false)
    })

    it("должен проверять поддержку mp3", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/mpeg"
      })

      expect(isFormatSupportedByMediaRecorder("mp3")).toBe(true)
    })

    it("должен проверять поддержку wav", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/wav"
      })

      expect(isFormatSupportedByMediaRecorder("wav")).toBe(true)
    })

    it("должен проверять поддержку ogg", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/ogg"
      })

      expect(isFormatSupportedByMediaRecorder("ogg")).toBe(true)
    })

    it("должен проверять поддержку m4a", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/mp4"
      })

      expect(isFormatSupportedByMediaRecorder("m4a")).toBe(true)
    })
  })

  describe("getMediaRecorderOptions", () => {
    it("должен возвращать opus кодек для webm если поддерживается", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        return mimeType === "audio/webm;codecs=opus"
      })

      const options = getMediaRecorderOptions("webm")

      expect(options.mimeType).toBe("audio/webm;codecs=opus")
    })

    it("должен возвращать vorbis кодек если opus не поддерживается", () => {
      global.MediaRecorder.isTypeSupported = vi.fn((mimeType: string) => {
        if (mimeType === "audio/webm;codecs=opus") return false
        return mimeType === "audio/webm;codecs=vorbis"
      })

      const options = getMediaRecorderOptions("webm")

      expect(options.mimeType).toBe("audio/webm;codecs=vorbis")
    })

    it("должен возвращать базовый mimeType если кодеки не поддерживаются", () => {
      global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(false)

      const options = getMediaRecorderOptions("webm")

      expect(options.mimeType).toBe("audio/webm")
    })

    it("должен возвращать правильный mimeType для mp3", () => {
      const options = getMediaRecorderOptions("mp3")

      expect(options.mimeType).toBe("audio/mpeg")
    })

    it("должен возвращать правильный mimeType для wav", () => {
      const options = getMediaRecorderOptions("wav")

      expect(options.mimeType).toBe("audio/wav")
    })

    it("должен возвращать правильный mimeType для ogg", () => {
      const options = getMediaRecorderOptions("ogg")

      expect(options.mimeType).toBe("audio/ogg")
    })

    it("должен возвращать правильный mimeType для m4a", () => {
      const options = getMediaRecorderOptions("m4a")

      expect(options.mimeType).toBe("audio/mp4")
    })
  })
})

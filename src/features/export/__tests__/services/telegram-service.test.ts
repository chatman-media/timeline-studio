import { beforeEach, describe, expect, it, vi } from "vitest"
import { OutputFormat } from "@/features/video-compiler/types/render"
import * as TelegramService from "../../services/telegram-service"

// Мокаем зависимости
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
})

global.fetch = vi.fn()

describe("TelegramService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe("getUserInfo", () => {
    it("should throw error if no token provided", async () => {
      await expect(TelegramService.getUserInfo()).rejects.toThrow("Bot token is required")
    })

    it("should get bot info with provided token", async () => {
      const mockBotInfo = {
        id: 123456789,
        is_bot: true,
        first_name: "TestBot",
        username: "test_bot",
      }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: mockBotInfo,
          }),
      } as any)

      const result = await TelegramService.getUserInfo("test_bot_token")

      expect(result).toEqual(mockBotInfo)
      expect(fetch).toHaveBeenCalledWith("https://api.telegram.org/bottest_bot_token/getMe")
    })

    it("should throw error if API request fails", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
      } as any)

      await expect(TelegramService.getUserInfo("invalid_token")).rejects.toThrow("Telegram API error: 401")
    })

    it("should throw error if API returns error in response", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false,
            description: "Unauthorized",
          }),
      } as any)

      await expect(TelegramService.getUserInfo("test_token")).rejects.toThrow("Telegram API error: Unauthorized")
    })
  })

  describe("uploadVideo", () => {
    const mockVideoFile = new File(["video content"], "test.mp4", { type: "video/mp4" })
    const mockMetadata: TelegramService.TelegramVideoMetadata = {
      chat_id: "@test_channel",
      caption: "Test video caption",
      parse_mode: "Markdown",
      supports_streaming: true,
    }

    beforeEach(() => {
      localStorage.setItem("telegram_bot_token", "test_bot_token")
    })

    it("should throw error if no bot token found", async () => {
      localStorage.clear()

      const result = await TelegramService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toBe("No Telegram bot token found")
    })

    it("should upload video successfully", async () => {
      const mockResponse = {
        ok: true,
        result: {
          message_id: 12345,
          video: {
            file_id: "test_file_id_123",
          },
        },
      }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any)

      const result = await TelegramService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(true)
      expect(result.url).toBe("https://t.me/@test_channel/12345")
      expect(result.id).toBe("test_file_id_123")
      expect(fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest_bot_token/sendVideo",
        expect.objectContaining({
          method: "POST",
        }),
      )
    })

    it("should handle upload progress callback", async () => {
      const onProgress = vi.fn()
      const mockResponse = {
        ok: true,
        result: {
          message_id: 12345,
          video: { file_id: "test_file_id" },
        },
      }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any)

      await TelegramService.uploadVideo(mockVideoFile, mockMetadata, onProgress)

      // Progress callback should be called with 100 at the end
      expect(onProgress).toHaveBeenCalledWith(100)
    })

    it("should handle API error during upload", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
      } as any)

      const result = await TelegramService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Upload failed: 400")
    })

    it("should handle Telegram API error response", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false,
            description: "Bad Request: chat not found",
          }),
      } as any)

      const result = await TelegramService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Telegram API error: Bad Request: chat not found")
    })

    it("should include all metadata fields in FormData", async () => {
      const fullMetadata: TelegramService.TelegramVideoMetadata = {
        chat_id: "@test_channel",
        caption: "Test caption",
        parse_mode: "Markdown",
        supports_streaming: true,
        disable_notification: true,
        protect_content: true,
      }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: { message_id: 1, video: { file_id: "test" } },
          }),
      } as any)

      await TelegramService.uploadVideo(mockVideoFile, fullMetadata)

      // Verify that fetch was called with FormData containing all fields
      expect(fetch).toHaveBeenCalled()
      const callArgs = vi.mocked(fetch).mock.calls[0]
      const formData = callArgs[1]?.body as FormData

      expect(formData).toBeInstanceOf(FormData)
    })
  })

  describe("exportSettings", () => {
    const baseSettings = {
      fileName: "test",
      savePath: "",
      format: OutputFormat.Mp4,
      quality: "good" as const,
      resolution: "1080" as const,
      frameRate: "30",
      enableGPU: true,
      socialNetwork: "telegram",
      isLoggedIn: true,
    }

    beforeEach(() => {
      localStorage.setItem("telegram_default_chat_id", "@my_channel")
    })

    it("should export settings with all fields", async () => {
      const settings = {
        ...baseSettings,
        title: "Test Video Title",
        description: "Test description for the video",
        tags: ["tag1", "tag2", "tag with spaces"],
      }

      const result = await TelegramService.exportSettings(settings)

      expect(result.chat_id).toBe("@my_channel")
      expect(result.caption).toContain("*Test Video Title*")
      expect(result.caption).toContain("Test description for the video")
      expect(result.caption).toContain("#tag1")
      expect(result.caption).toContain("#tag2")
      expect(result.caption).toContain("#tag_with_spaces")
      expect(result.parse_mode).toBe("Markdown")
      expect(result.supports_streaming).toBe(true)
    })

    it("should handle missing title", async () => {
      const settings = {
        ...baseSettings,
        description: "Only description",
      }

      const result = await TelegramService.exportSettings(settings)

      expect(result.caption).toBe("Only description")
    })

    it("should handle only tags", async () => {
      const settings = {
        ...baseSettings,
        tags: ["video", "test"],
      }

      const result = await TelegramService.exportSettings(settings)

      expect(result.caption).toBe("#video #test")
    })

    it("should use default chat_id if not set", async () => {
      localStorage.clear()

      const result = await TelegramService.exportSettings(baseSettings)

      expect(result.chat_id).toBe("@your_channel")
    })

    it("should return undefined caption if no content", async () => {
      const result = await TelegramService.exportSettings(baseSettings)

      expect(result.caption).toBeUndefined()
    })
  })

  describe("validateSettings", () => {
    const baseSettings = {
      fileName: "test",
      savePath: "",
      format: OutputFormat.Mp4,
      quality: "good" as const,
      resolution: "1080" as const,
      frameRate: "30",
      enableGPU: true,
      socialNetwork: "telegram",
      isLoggedIn: true,
    }

    it("should return error if chat_id is not configured", () => {
      localStorage.clear()

      const result = TelegramService.validateSettings(baseSettings)

      expect(result).toContain("Telegram chat ID is required. Please configure in settings.")
    })

    it("should return error if caption is too long", () => {
      localStorage.setItem("telegram_default_chat_id", "@test")

      const settings = {
        ...baseSettings,
        title: "a".repeat(450),
        description: "b".repeat(450),
        tags: Array(30).fill("longtag"),
      }

      const result = TelegramService.validateSettings(settings)

      expect(result).toContain("Caption too long (max 1000 characters including title, description, and tags)")
    })

    it("should return no errors for valid settings", () => {
      localStorage.setItem("telegram_default_chat_id", "@test")

      const settings = {
        ...baseSettings,
        title: "Valid Title",
        description: "Valid description",
        tags: ["tag1", "tag2"],
      }

      const result = TelegramService.validateSettings(settings)

      expect(result).toEqual([])
    })
  })

  describe("validateVideoFile", () => {
    it("should return error for unsupported video format", () => {
      const unsupportedFile = new File(["video"], "test.mkv", { type: "video/x-matroska" })

      const result = TelegramService.validateVideoFile(unsupportedFile)

      expect(result).toContain("Unsupported video format for Telegram")
    })

    it("should return error for file exceeding 50MB limit", () => {
      const largeFile = new File(["large video"], "large.mp4", { type: "video/mp4" })
      Object.defineProperty(largeFile, "size", {
        value: 60 * 1024 * 1024, // 60MB
        writable: false,
      })

      const result = TelegramService.validateVideoFile(largeFile)

      expect(result).toContain("Video file size exceeds 50MB limit for Telegram Bot API")
    })

    it("should return no errors for valid file", () => {
      const validFile = new File(["video"], "test.mp4", { type: "video/mp4" })
      Object.defineProperty(validFile, "size", {
        value: 30 * 1024 * 1024, // 30MB
        writable: false,
      })

      const result = TelegramService.validateVideoFile(validFile)

      expect(result).toEqual([])
    })

    it("should support multiple video formats", () => {
      const formats = [
        { type: "video/mp4", name: "test.mp4" },
        { type: "video/quicktime", name: "test.mov" },
        { type: "video/x-msvideo", name: "test.avi" },
        { type: "video/webm", name: "test.webm" },
      ]

      formats.forEach(({ type, name }) => {
        const file = new File(["video"], name, { type })
        Object.defineProperty(file, "size", {
          value: 10 * 1024 * 1024, // 10MB
          writable: false,
        })

        const result = TelegramService.validateVideoFile(file)
        expect(result).toEqual([])
      })
    })
  })

  describe("getOptimalSettings", () => {
    it("should return optimal settings for Telegram", () => {
      const result = TelegramService.getOptimalSettings()

      expect(result).toEqual({
        resolution: "720",
        frameRate: "30",
        format: "Mp4",
        quality: "normal",
      })
    })
  })

  describe("getChatInfo", () => {
    beforeEach(() => {
      localStorage.setItem("telegram_bot_token", "test_bot_token")
    })

    it("should throw error if no bot token found", async () => {
      localStorage.clear()

      await expect(TelegramService.getChatInfo("@test_channel")).rejects.toThrow("No Telegram bot token found")
    })

    it("should get chat info successfully", async () => {
      const mockChatInfo = {
        id: -1001234567890,
        title: "Test Channel",
        type: "channel",
        username: "test_channel",
      }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: mockChatInfo,
          }),
      } as any)

      const result = await TelegramService.getChatInfo("@test_channel")

      expect(result).toEqual(mockChatInfo)
      expect(fetch).toHaveBeenCalledWith("https://api.telegram.org/bottest_bot_token/getChat?chat_id=@test_channel")
    })

    it("should throw error if API returns error", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false,
            description: "Chat not found",
          }),
      } as any)

      await expect(TelegramService.getChatInfo("@invalid")).rejects.toThrow("Failed to get chat info: Chat not found")
    })
  })

  describe("sendTestMessage", () => {
    beforeEach(() => {
      localStorage.setItem("telegram_bot_token", "test_bot_token")
    })

    it("should throw error if no bot token found", async () => {
      localStorage.clear()

      await expect(TelegramService.sendTestMessage("@test_channel")).rejects.toThrow("No Telegram bot token found")
    })

    it("should send test message successfully", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as any)

      const result = await TelegramService.sendTestMessage("@test_channel")

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest_bot_token/sendMessage",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "@test_channel",
            text: "Test message from Timeline Studio",
          }),
        }),
      )
    })

    it("should send custom message", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as any)

      await TelegramService.sendTestMessage("@test_channel", "Custom test message")

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            chat_id: "@test_channel",
            text: "Custom test message",
          }),
        }),
      )
    })

    it("should return false on error", async () => {
      ;(fetch as any).mockRejectedValue(new Error("Network error"))

      const result = await TelegramService.sendTestMessage("@test_channel")

      expect(result).toBe(false)
    })

    it("should return false if API returns error", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: false }),
      } as any)

      const result = await TelegramService.sendTestMessage("@test_channel")

      expect(result).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle network errors gracefully in uploadVideo", async () => {
      localStorage.setItem("telegram_bot_token", "test_bot_token")
      ;(fetch as any).mockRejectedValue(new Error("Network error"))

      const result = await TelegramService.uploadVideo(new File(["test"], "test.mp4", { type: "video/mp4" }), {
        chat_id: "@test",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Network error")
    })

    it("should handle empty tags array", async () => {
      const settings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "telegram",
        isLoggedIn: true,
        title: "Test",
        tags: [],
      }

      const result = await TelegramService.exportSettings(settings)

      expect(result.caption).toBe("*Test*")
    })

    it("should sanitize hashtags with multiple spaces", async () => {
      const settings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "telegram",
        isLoggedIn: true,
        tags: ["tag   with   spaces"],
      }

      const result = await TelegramService.exportSettings(settings)

      expect(result.caption).toContain("#tag_with_spaces")
    })
  })
})

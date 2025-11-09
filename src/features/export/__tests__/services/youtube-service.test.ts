import { beforeEach, describe, expect, it, vi } from "vitest"
import { OutputFormat } from "@/features/video-compiler/types/render"
import { OAuthService } from "../../services/oauth-service"
import * as YouTubeService from "../../services/youtube-service"
import type { SocialExportSettings } from "../../types/export-types"

// Мокаем зависимости
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
}))

vi.mock("../../services/oauth-service", () => ({
  OAuthService: {
    getStoredToken: vi.fn(),
  },
}))

global.fetch = vi.fn()
global.XMLHttpRequest = vi.fn(() => ({
  open: vi.fn(),
  send: vi.fn(),
  setRequestHeader: vi.fn(),
  upload: {
    addEventListener: vi.fn(),
  },
  addEventListener: vi.fn(),
})) as any

describe("YouTubeService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getUserInfo", () => {
    it("should throw error if not authenticated", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue(null)

      await expect(YouTubeService.getUserInfo()).rejects.toThrow("Not authenticated")
    })

    it("should get user info with stored token", async () => {
      const mockChannel = {
        id: "UC123456",
        snippet: {
          title: "Test Channel",
          description: "Test Description",
        },
      }

      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_youtube_token",
        refreshToken: "refresh_token",
        expiresAt: Date.now() + 3600000,
      })

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [mockChannel],
          }),
      } as any)

      const result = await YouTubeService.getUserInfo()

      expect(result).toEqual(mockChannel)
      expect(fetch).toHaveBeenCalledWith("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: {
          Authorization: "Bearer test_youtube_token",
        },
      })
    })

    it("should get user info with provided token", async () => {
      const mockChannel = { id: "UC123", snippet: { title: "Channel" } }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [mockChannel] }),
      } as any)

      const result = await YouTubeService.getUserInfo("provided_token")

      expect(result).toEqual(mockChannel)
    })

    it("should throw error if API request fails", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
      } as any)

      await expect(YouTubeService.getUserInfo("test_token")).rejects.toThrow("Failed to get user info")
    })
  })

  describe("getVideoCategories", () => {
    it("should return empty array if not authenticated", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue(null)

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })

    it("should get video categories", async () => {
      const mockCategories = [
        { id: "22", snippet: { title: "People & Blogs" } },
        { id: "23", snippet: { title: "Comedy" } },
      ]

      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600000,
      })

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: mockCategories }),
      } as any)

      const result = await YouTubeService.getVideoCategories("US")

      expect(result).toEqual(mockCategories)
      expect(fetch).toHaveBeenCalledWith(
        "https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=US",
        expect.any(Object),
      )
    })

    it("should return empty array on API error", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600000,
      })

      ;(fetch as any).mockResolvedValue({
        ok: false,
      } as any)

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })

    it("should handle network errors", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600000,
      })

      ;(fetch as any).mockRejectedValue(new Error("Network error"))

      const result = await YouTubeService.getVideoCategories()

      expect(result).toEqual([])
    })
  })

  describe("validateSettings", () => {
    const baseSettings: SocialExportSettings = {
      fileName: "test",
      savePath: "",
      format: OutputFormat.Mp4,
      quality: "good" as const,
      resolution: "1080" as const,
      frameRate: "30",
      enableGPU: true,
      socialNetwork: "youtube",
      isLoggedIn: true,
    }

    it("should return error for missing title", () => {
      const settings = { ...baseSettings, title: "" }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toContain("Title is required")
    })

    it("should return error for title with only whitespace", () => {
      const settings = { ...baseSettings, title: "   " }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toContain("Title is required")
    })

    it("should return error for title too long", () => {
      const settings = { ...baseSettings, title: "a".repeat(101) }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toContain("Title must be 100 characters or less")
    })

    it("should return error for description too long", () => {
      const settings = { ...baseSettings, title: "Test", description: "a".repeat(5001) }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toContain("Description must be 5000 characters or less")
    })

    it("should return error for too many tags", () => {
      const settings = {
        ...baseSettings,
        title: "Test",
        tags: Array(501).fill("tag"),
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toContain("Too many tags (maximum 500)")
    })

    it("should return no errors for valid settings", () => {
      const settings = {
        ...baseSettings,
        title: "Valid YouTube Title",
        description: "Valid description",
        tags: ["tag1", "tag2"],
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should accept maximum length title", () => {
      const settings = {
        ...baseSettings,
        title: "a".repeat(100),
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })
  })

  describe("exportSettings", () => {
    const baseSettings: SocialExportSettings = {
      fileName: "test",
      savePath: "",
      format: OutputFormat.Mp4,
      quality: "good" as const,
      resolution: "1080" as const,
      frameRate: "30",
      enableGPU: true,
      socialNetwork: "youtube",
      isLoggedIn: true,
    }

    it("should export settings with all fields", async () => {
      const settings = {
        ...baseSettings,
        title: "Test YouTube Video",
        description: "Test description",
        tags: ["tag1", "tag2"],
        privacy: "public" as const,
        language: "en",
        thumbnail: "https://example.com/thumb.jpg",
      }

      const result = await YouTubeService.exportSettings(settings)

      expect(result.title).toBe("Test YouTube Video")
      expect(result.description).toBe("Test description")
      expect(result.tags).toEqual(["tag1", "tag2"])
      expect(result.privacy).toBe("public")
      expect(result.language).toBe("en")
      expect(result.thumbnail).toBe("https://example.com/thumb.jpg")
    })

    it("should use default values for missing fields", async () => {
      const result = await YouTubeService.exportSettings(baseSettings)

      expect(result.title).toBe("Untitled Video")
      expect(result.privacy).toBe("private")
      expect(result.language).toBe("en")
    })

    it("should handle empty tags", async () => {
      const settings = { ...baseSettings, title: "Test", tags: [] }

      const result = await YouTubeService.exportSettings(settings)

      expect(result.tags).toEqual([])
    })
  })

  describe("Edge Cases", () => {
    it("should handle maximum valid description length", () => {
      const settings: SocialExportSettings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "youtube",
        isLoggedIn: true,
        title: "Test",
        description: "a".repeat(5000),
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should handle maximum valid tags", () => {
      const settings: SocialExportSettings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "youtube",
        isLoggedIn: true,
        title: "Test",
        tags: Array(500).fill("tag"),
      }

      const result = YouTubeService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should handle null/undefined values in exportSettings", async () => {
      const settings: SocialExportSettings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "youtube",
        isLoggedIn: true,
        title: undefined,
        description: undefined,
        tags: undefined,
      }

      const result = await YouTubeService.exportSettings(settings)

      expect(result.title).toBe("Untitled Video")
      expect(result.description).toBeUndefined()
      expect(result.tags).toBeUndefined()
    })

    it("should handle all privacy levels", async () => {
      const privacyLevels: Array<"public" | "private" | "unlisted"> = ["public", "private", "unlisted"]

      for (const privacy of privacyLevels) {
        const settings: SocialExportSettings = {
          fileName: "test",
          savePath: "",
          format: OutputFormat.Mp4,
          quality: "good" as const,
          resolution: "1080" as const,
          frameRate: "30",
          enableGPU: true,
          socialNetwork: "youtube",
          isLoggedIn: true,
          title: "Test",
          privacy,
        }

        const result = await YouTubeService.exportSettings(settings)
        expect(result.privacy).toBe(privacy)
      }
    })

    it("should handle empty API response items", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600000,
      })

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as any)

      const result = await YouTubeService.getUserInfo()

      expect(result).toBeUndefined()
    })
  })
})

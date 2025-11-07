import { beforeEach, describe, expect, it, vi } from "vitest"

import * as TikTokService from "../../services/tiktok-service"
import { OutputFormat } from "@/features/video-compiler/types/render"

// Мокаем зависимости
vi.mock("../../services/oauth-service", () => ({
  OAuthService: {
    getStoredToken: vi.fn(),
  },
}))

const { OAuthService } = await import("../../services/oauth-service")

global.fetch = vi.fn()

describe("TikTokService (simplified)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      socialNetwork: "tiktok",
      isLoggedIn: true,
    }

    it("should return error for missing title", () => {
      const settings = { ...baseSettings, title: "" }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual(["Title is required"])
    })

    it("should return error for title too long", () => {
      const settings = { ...baseSettings, title: "a".repeat(151) }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual(["Title must be 150 characters or less"])
    })

    it("should return error for description too long", () => {
      const settings = { ...baseSettings, title: "Test", description: "a".repeat(2201) }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual(["Description must be 2200 characters or less"])
    })

    it("should return no errors for valid settings", () => {
      const settings = {
        ...baseSettings,
        title: "Valid TikTok Title",
        description: "Valid description for TikTok",
      }

      const result = TikTokService.validateSettings(settings)

      expect(result).toEqual([])
    })
  })

  describe("exportSettings", () => {
    const baseSettings = {
      fileName: "test",
      savePath: "",
      format: OutputFormat.Mp4,
      quality: "good" as const,
      resolution: "1080",
      frameRate: "30",
      enableGPU: true,
      socialNetwork: "tiktok",
      isLoggedIn: true,
    }

    it("should export settings with all fields", async () => {
      const settings: any = {
        ...baseSettings,
        title: "Test TikTok Video",
        description: "Test description",
        privacy: "public" as const,
      }

      const result = await TikTokService.exportSettings(settings)

      expect(result).toEqual({
        title: "Test TikTok Video",
        description: "Test description",
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      })
    })

    it("should map privacy settings correctly", async () => {
      const publicSettings: any = { ...baseSettings, title: "Test", privacy: "public" as const }
      const privateSettings: any = { ...baseSettings, title: "Test", privacy: "private" as const }
      const unlistedSettings: any = { ...baseSettings, title: "Test", privacy: "unlisted" as const }

      const publicResult = await TikTokService.exportSettings(publicSettings)
      const privateResult = await TikTokService.exportSettings(privateSettings)
      const unlistedResult = await TikTokService.exportSettings(unlistedSettings)

      expect(publicResult.privacy_level).toBe("PUBLIC_TO_EVERYONE")
      expect(privateResult.privacy_level).toBe("SELF_ONLY")
      expect(unlistedResult.privacy_level).toBe("FOLLOWER_OF_CREATOR")
    })
  })

  describe("getOptimalSettings", () => {
    it("should return optimal settings for TikTok", () => {
      const result = TikTokService.getOptimalSettings()

      expect(result).toEqual({
        resolution: "1080",
        frameRate: "30",
        format: "Mp4",
        quality: "good",
        useVerticalResolution: true,
      })
    })
  })

  describe("validateVideoFile", () => {
    it("should return error for file too large", () => {
      const largeFile = new File(["large video"], "large.mp4", { type: "video/mp4" })
      Object.defineProperty(largeFile, "size", {
        value: 300 * 1024 * 1024, // 300MB
        writable: false,
      })

      const result = TikTokService.validateVideoFile(largeFile)

      expect(result).toEqual(["Video file size must be less than 287MB"])
    })

    it("should return error for unsupported format", () => {
      const unsupportedFile = new File(["video"], "test.avi", { type: "video/avi" })

      const result = TikTokService.validateVideoFile(unsupportedFile)

      expect(result).toEqual(["Video format must be MP4, MOV, MPEG, or WebM"])
    })

    it("should return no errors for valid file", () => {
      const validFile = new File(["video"], "test.mp4", { type: "video/mp4" })
      Object.defineProperty(validFile, "size", {
        value: 100 * 1024 * 1024, // 100MB
        writable: false,
      })

      const result = TikTokService.validateVideoFile(validFile)

      expect(result).toEqual([])
    })
  })

  describe("getUserInfo", () => {
    it("should get user info with provided token", async () => {
      const mockUserInfo = {
        display_name: "Test TikTok User",
        bio_description: "Test bio",
        avatar_url: "https://example.com/avatar.jpg",
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { user: mockUserInfo },
          }),
      } as any)

      const result = await TikTokService.getUserInfo("test_token")

      expect(result).toEqual(mockUserInfo)
      expect(fetch).toHaveBeenCalledWith("https://open.tiktokapis.com/v2/user/info/", {
        method: "GET",
        headers: {
          Authorization: "Bearer test_token",
        },
      })
    })

    it("should throw error if not authenticated", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      await expect(TikTokService.getUserInfo()).rejects.toThrow("Not authenticated")
    })

    it("should throw error if API request fails", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "API Error" }),
      } as any)

      await expect(TikTokService.getUserInfo("test_token")).rejects.toThrow("Failed to get user info")
    })
  })

  describe("uploadVideo authentication", () => {
    it("should throw error if not authenticated", async () => {
      vi.mocked(OAuthService.getStoredToken).mockResolvedValue(null)

      const mockVideoFile = new File(["video content"], "test.mp4", { type: "video/mp4" })
      const mockMetadata = {
        title: "Test TikTok Video",
        description: "Test description",
        privacy_level: "PUBLIC_TO_EVERYONE" as const,
      }

      await expect(TikTokService.uploadVideo(mockVideoFile, mockMetadata)).rejects.toThrow(
        "Not authenticated with TikTok",
      )
    })
  })
})

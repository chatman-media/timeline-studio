import { beforeEach, describe, expect, it, vi } from "vitest"
import { OutputFormat } from "@/features/video-compiler/types/render"
import { OAuthService } from "../../services/oauth-service"
import * as VimeoService from "../../services/vimeo-service"

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

describe("VimeoService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getUserInfo", () => {
    it("should throw error if no token provided", async () => {
      await expect(VimeoService.getUserInfo()).rejects.toThrow("Access token is required")
    })

    it("should get user info with provided token", async () => {
      const mockUserInfo = {
        uri: "/users/123456",
        name: "Test User",
        link: "https://vimeo.com/testuser",
        account: "plus",
      }

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
      } as any)

      const result = await VimeoService.getUserInfo("test_access_token")

      expect(result).toEqual(mockUserInfo)
      expect(fetch).toHaveBeenCalledWith("https://api.vimeo.com/me", {
        headers: {
          Authorization: "Bearer test_access_token",
          "Content-Type": "application/json",
        },
      })
    })

    it("should throw error if API request fails", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
      } as any)

      await expect(VimeoService.getUserInfo("invalid_token")).rejects.toThrow("Vimeo API error: 401")
    })
  })

  describe("uploadVideo", () => {
    const mockVideoFile = new File(["video content"], "test.mp4", { type: "video/mp4" })
    const mockMetadata: VimeoService.VimeoVideoMetadata = {
      name: "Test Video",
      description: "Test description",
      privacy: {
        view: "anybody",
        embed: "public",
      },
      tags: ["test", "video"],
    }

    beforeEach(() => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_vimeo_token",
        refreshToken: "refresh_token",
        expiresAt: Date.now() + 3600000,
      })
    })

    it("should throw error if not authenticated", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue(null)

      const result = await VimeoService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Not authenticated with Vimeo")
    })

    it("should upload video successfully", async () => {
      const createResponse = {
        uri: "/videos/123456789",
        upload: {
          upload_link: "https://upload.vimeo.com/test_upload_url",
          approach: "tus",
        },
      }

      // Mock create upload
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createResponse),
        } as any)
        // Mock file upload
        .mockResolvedValueOnce({
          ok: true,
        } as any)
        // Mock metadata update (tags)
        .mockResolvedValueOnce({
          ok: true,
        } as any)

      const result = await VimeoService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(true)
      expect(result.url).toBe("https://vimeo.com/123456789")
      expect(result.id).toBe("123456789")
    })

    it("should handle progress callback", async () => {
      const onProgress = vi.fn()
      const createResponse = {
        uri: "/videos/123456789",
        upload: {
          upload_link: "https://upload.vimeo.com/test",
          approach: "tus",
        },
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
        } as any)
        .mockResolvedValueOnce({
          ok: true,
        } as any)

      await VimeoService.uploadVideo(mockVideoFile, mockMetadata, onProgress)

      // Progress should be called (simulated in service)
      expect(onProgress).toHaveBeenCalled()
    })

    it("should fail if create upload fails", async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 403,
      } as any)

      const result = await VimeoService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Failed to create upload URL")
    })

    it("should fail if file upload fails", async () => {
      const createResponse = {
        uri: "/videos/123",
        upload: {
          upload_link: "https://upload.vimeo.com/test",
        },
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as any)

      const result = await VimeoService.uploadVideo(mockVideoFile, mockMetadata)

      expect(result.success).toBe(false)
      expect(result.error).toContain("Upload failed")
    })

    it("should upload without tags", async () => {
      const metadataWithoutTags = {
        name: "Test Video",
        description: "Test",
        privacy: { view: "anybody" as const },
      }

      const createResponse = {
        uri: "/videos/123",
        upload: { upload_link: "https://upload.vimeo.com/test" },
      }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(createResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
        } as any)

      const result = await VimeoService.uploadVideo(mockVideoFile, metadataWithoutTags)

      expect(result.success).toBe(true)
      // Should not call PATCH for tags (only 2 fetch calls)
      expect(fetch).toHaveBeenCalledTimes(2)
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
      socialNetwork: "vimeo",
      isLoggedIn: true,
    }

    it("should export settings with all fields", async () => {
      const settings = {
        ...baseSettings,
        title: "Test Vimeo Video",
        description: "Test description",
        privacy: "public" as const,
        tags: ["tag1", "tag2"],
      }

      const result = await VimeoService.exportSettings(settings)

      expect(result.name).toBe("Test Vimeo Video")
      expect(result.description).toBe("Test description")
      expect(result.privacy?.view).toBe("anybody")
      expect(result.tags).toEqual(["tag1", "tag2"])
    })

    it("should map privacy settings correctly", async () => {
      const publicSettings = { ...baseSettings, title: "Test", privacy: "public" as const }
      const privateSettings = { ...baseSettings, title: "Test", privacy: "private" as const }

      const publicResult = await VimeoService.exportSettings(publicSettings)
      const privateResult = await VimeoService.exportSettings(privateSettings)

      expect(publicResult.privacy?.view).toBe("anybody")
      expect(privateResult.privacy?.view).toBe("nobody")
    })

    it("should use default title if not provided", async () => {
      const result = await VimeoService.exportSettings(baseSettings)

      expect(result.name).toBe("Untitled Video")
    })

    it("should handle empty description", async () => {
      const settings = { ...baseSettings, title: "Test" }

      const result = await VimeoService.exportSettings(settings)

      expect(result.description).toBe("")
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
      socialNetwork: "vimeo",
      isLoggedIn: true,
    }

    it("should return error for missing title", () => {
      const settings = { ...baseSettings, title: "" }

      const result = VimeoService.validateSettings(settings)

      expect(result).toContain("Title is required for Vimeo")
    })

    it("should return error for title too long", () => {
      const settings = { ...baseSettings, title: "a".repeat(129) }

      const result = VimeoService.validateSettings(settings)

      expect(result).toContain("Title must be 128 characters or less")
    })

    it("should return error for description too long", () => {
      const settings = { ...baseSettings, title: "Test", description: "a".repeat(5001) }

      const result = VimeoService.validateSettings(settings)

      expect(result).toContain("Description must be 5000 characters or less")
    })

    it("should return no errors for valid settings", () => {
      const settings = {
        ...baseSettings,
        title: "Valid Vimeo Title",
        description: "Valid description",
      }

      const result = VimeoService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should accept title with whitespace", () => {
      const settings = { ...baseSettings, title: "   " }

      const result = VimeoService.validateSettings(settings)

      expect(result).toContain("Title is required for Vimeo")
    })
  })

  describe("validateVideoFile", () => {
    it("should return error for unsupported format", () => {
      const unsupportedFile = new File(["video"], "test.mkv", { type: "video/x-matroska" })

      const result = VimeoService.validateVideoFile(unsupportedFile)

      expect(result).toContain("Unsupported video format for Vimeo")
    })

    it("should return error for file exceeding 5GB limit", () => {
      const largeFile = new File(["large video"], "large.mp4", { type: "video/mp4" })
      Object.defineProperty(largeFile, "size", {
        value: 6 * 1024 * 1024 * 1024, // 6GB
        writable: false,
      })

      const result = VimeoService.validateVideoFile(largeFile)

      expect(result).toContain("Video file size exceeds 5GB limit")
    })

    it("should return no errors for valid file", () => {
      const validFile = new File(["video"], "test.mp4", { type: "video/mp4" })
      Object.defineProperty(validFile, "size", {
        value: 1 * 1024 * 1024 * 1024, // 1GB
        writable: false,
      })

      const result = VimeoService.validateVideoFile(validFile)

      expect(result).toEqual([])
    })

    it("should support multiple video formats", () => {
      const formats = [
        { type: "video/mp4", name: "test.mp4" },
        { type: "video/quicktime", name: "test.mov" },
        { type: "video/x-msvideo", name: "test.avi" },
        { type: "video/x-ms-wmv", name: "test.wmv" },
        { type: "video/x-flv", name: "test.flv" },
        { type: "video/webm", name: "test.webm" },
        { type: "video/3gpp", name: "test.3gp" },
      ]

      formats.forEach(({ type, name }) => {
        const file = new File(["video"], name, { type })
        Object.defineProperty(file, "size", {
          value: 100 * 1024 * 1024, // 100MB
          writable: false,
        })

        const result = VimeoService.validateVideoFile(file)
        expect(result).toEqual([])
      })
    })
  })

  describe("getOptimalSettings", () => {
    it("should return optimal settings for Vimeo", () => {
      const result = VimeoService.getOptimalSettings()

      expect(result).toEqual({
        resolution: "1080",
        frameRate: "30",
        format: "Mp4",
        quality: "best",
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle network errors gracefully", async () => {
      ;(OAuthService.getStoredToken as any).mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh",
        expiresAt: Date.now() + 3600000,
      })

      ;(fetch as any).mockRejectedValue(new Error("Network error"))

      const result = await VimeoService.uploadVideo(new File(["test"], "test.mp4", { type: "video/mp4" }), {
        name: "Test",
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
        socialNetwork: "vimeo",
        isLoggedIn: true,
        title: "Test",
        tags: [],
      }

      const result = await VimeoService.exportSettings(settings)

      expect(result.tags).toEqual([])
    })

    it("should handle maximum length title", () => {
      const settings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "vimeo",
        isLoggedIn: true,
        title: "a".repeat(128),
      }

      const result = VimeoService.validateSettings(settings)

      expect(result).toEqual([])
    })

    it("should handle maximum length description", () => {
      const settings = {
        fileName: "test",
        savePath: "",
        format: OutputFormat.Mp4,
        quality: "good" as const,
        resolution: "1080" as const,
        frameRate: "30",
        enableGPU: true,
        socialNetwork: "vimeo",
        isLoggedIn: true,
        title: "Test",
        description: "a".repeat(5000),
      }

      const result = VimeoService.validateSettings(settings)

      expect(result).toEqual([])
    })
  })
})

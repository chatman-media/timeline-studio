import { describe, expect, it } from "vitest"

import * as SocialValidationService from "../../services/social-validation-service"
import type { SocialExportSettings } from "../../types/export-types"
import { OutputFormat } from "@/features/video-compiler/types/render"

describe("SocialValidationService", () => {
  describe("validateExportSettings", () => {
    it("should validate YouTube settings successfully", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "Test Video",
        description: "Test description",
        tags: ["test", "video"],
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should validate title length", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "a".repeat(101), // Exceeds YouTube's 100 char limit
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Title must be 100 characters or less (current: 101)")
    })

    it("should validate missing title", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Title is required")
    })

    it("should validate description length", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "Test Video",
        description: "a".repeat(5001), // Exceeds YouTube's 5000 char limit
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Description must be 5000 characters or less (current: 5001)")
    })

    it("should validate tags count", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "Test Video",
        tags: Array(16).fill("tag"), // Exceeds YouTube's 15 tag limit
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Maximum 15 tags allowed (current: 16)")
    })

    it("should validate tag length", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "Test Video",
        tags: ["a".repeat(31)], // Exceeds YouTube's 30 char tag limit
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Tag 1 is too long (max 30 characters)")
    })

    it("should validate video file size", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "tiktok",
        title: "Test Video",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const videoFile = {
        size: 300 * 1024 * 1024, // 300MB exceeds TikTok's 287MB limit
        duration: 60,
        format: "mp4",
      }

      const result = SocialValidationService.validateExportSettings("tiktok", settings, videoFile)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((error) => error.includes("File size") && error.includes("exceeds limit"))).toBe(true)
    })

    it("should validate video duration", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "tiktok",
        title: "Test Video",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const videoFile = {
        size: 100 * 1024 * 1024, // 100MB
        duration: 11 * 60, // 11 minutes exceeds TikTok's 10 minute limit
        format: "mp4",
      }

      const result = SocialValidationService.validateExportSettings("tiktok", settings, videoFile)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((error) => error.includes("Video duration") && error.includes("exceeds limit"))).toBe(
        true,
      )
    })

    it("should validate minimum duration for TikTok", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "tiktok",
        title: "Test Video",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const videoFile = {
        size: 10 * 1024 * 1024, // 10MB
        duration: 2, // 2 seconds is below TikTok's 3 second minimum
        format: "mp4",
      }

      const result = SocialValidationService.validateExportSettings("tiktok", settings, videoFile)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Video duration must be at least 3 seconds")
    })

    it("should validate video format", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "Test Video",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const videoFile = {
        size: 100 * 1024 * 1024, // 100MB
        duration: 60,
        format: "mkv", // Not supported by YouTube
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings, videoFile)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((error) => error.includes('Format "mkv" is not supported'))).toBe(true)
    })

    it("should provide suggestions for optimization", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "tiktok",
        title: "Test Video without hashtags",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("tiktok", settings)

      expect(result.suggestions).toContain(
        "Consider adding hashtags to your title for better discoverability on TikTok",
      )
    })

    it("should validate privacy settings", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "youtube",
        title: "Test Video",
        privacy: "friends" as any, // Not supported by YouTube
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("youtube", settings)

      expect(
        result.warnings.some((warning) => warning.includes('Privacy setting "friends" may not be supported')),
      ).toBe(true)
    })

    it("should handle unsupported networks", () => {
      const settings: SocialExportSettings = {
        socialNetwork: "unsupported",
        title: "Test Video",
        privacy: "public",
        isLoggedIn: true,
        fileName: "test",
        savePath: "/test",
        format: OutputFormat.Mp4,
        quality: "normal",
        resolution: "1080",
        frameRate: "30",
        enableGPU: true,
      }

      const result = SocialValidationService.validateExportSettings("unsupported", settings)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Unsupported social network: unsupported")
    })
  })

  describe("getNetworkLimits", () => {
    it("should return YouTube limits", () => {
      const limits = SocialValidationService.getNetworkLimits("youtube")

      expect(limits).toBeDefined()
      expect(limits?.titleMaxLength).toBe(100)
      expect(limits?.maxFileSize).toBe(128 * 1024 * 1024 * 1024) // 128GB
      expect(limits?.supportedFormats).toContain("mp4")
    })

    it("should return TikTok limits", () => {
      const limits = SocialValidationService.getNetworkLimits("tiktok")

      expect(limits).toBeDefined()
      expect(limits?.titleMaxLength).toBe(150)
      expect(limits?.maxFileSize).toBe(287 * 1024 * 1024) // 287MB
      expect(limits?.minDuration).toBe(3)
    })

    it("should return null for unsupported networks", () => {
      const limits = SocialValidationService.getNetworkLimits("unsupported")

      expect(limits).toBeNull()
    })
  })

  describe("getOptimalSettings", () => {
    it("should return YouTube optimal settings", () => {
      const settings = SocialValidationService.getOptimalSettings("youtube")

      expect(settings).toEqual({
        resolution: "1080",
        frameRate: "30",
        quality: "good",
        format: OutputFormat.Mp4,
      })
    })

    it("should return TikTok optimal settings", () => {
      const settings = SocialValidationService.getOptimalSettings("tiktok")

      expect(settings).toEqual({
        resolution: "1080",
        frameRate: "30",
        quality: "good",
        format: OutputFormat.Mp4,
      })
    })

    it("should return Vimeo optimal settings", () => {
      const settings = SocialValidationService.getOptimalSettings("vimeo")

      expect(settings).toEqual({
        resolution: "1080",
        frameRate: "30",
        quality: "best",
        format: OutputFormat.Mp4,
      })
    })

    it("should return empty object for unsupported networks", () => {
      const settings = SocialValidationService.getOptimalSettings("unsupported")

      expect(settings).toEqual({})
    })
  })
})

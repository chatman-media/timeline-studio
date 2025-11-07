import { describe, expect, it } from "vitest"

import { optimizeSettings, type ProjectAnalysis } from "../../utils/smart-export-optimizer"

describe("SmartExportOptimizer", () => {
  const basicProject: ProjectAnalysis = {
    duration: 300, // 5 minutes
    originalResolution: { width: 1920, height: 1080 },
    fps: 30,
    clipCount: 10,
    hasAudio: true,
    hasMotion: false,
    hasColorGrading: false,
    hasTextOverlays: false,
    effectsCount: 3,
    transitionsCount: 5,
  }

  describe("optimizeSettings", () => {
    it("should provide reasonable defaults for basic project", () => {
      const result = optimizeSettings(basicProject)

      expect(result.recommendedSettings.resolution).toBe("1080")
      expect((result.recommendedSettings as any).fps).toBe("30")
      expect(result.reasons.length).toBeGreaterThan(0)
      expect(result.alternativeOptions).toBeDefined()
    })

    it("should optimize for social media", () => {
      const socialProject = {
        ...basicProject,
        targetPlatform: "social" as const,
      }

      const result = optimizeSettings(socialProject)

      expect((result.recommendedSettings as any).codec).toBe("h264")
      expect(result.recommendedSettings.quality).toBe("good")
      expect(result.reasons.some((r) => r.includes("social"))).toBe(true)
    })

    it("should optimize for vertical videos", () => {
      const verticalProject = {
        ...basicProject,
        originalResolution: { width: 1080, height: 1920 }, // 9:16
        targetPlatform: "social" as const,
      }

      const result = optimizeSettings(verticalProject)

      expect(result.recommendedSettings.resolution).toBe("1080")
      expect(result.reasons.some((r) => r.includes("Vertical video"))).toBe(true)
    })

    it("should use highest quality for archive", () => {
      const archiveProject = {
        ...basicProject,
        targetPlatform: "archive" as const,
      }

      const result = optimizeSettings(archiveProject)

      expect(result.recommendedSettings.quality).toBe("best")
      expect(result.reasons.some((r) => r.includes("archive"))).toBe(true)
    })

    it("should enable GPU for large projects", () => {
      const largeProject = {
        ...basicProject,
        duration: 4000, // Over 1 hour
        clipCount: 50,
      }

      const result = optimizeSettings(largeProject)

      expect((result.recommendedSettings as any).useGPU).toBe(true)
      expect(result.reasons.some((r) => r.includes("GPU acceleration"))).toBe(true)
    })

    it("should use ProRes for broadcast", () => {
      const broadcastProject = {
        ...basicProject,
        targetPlatform: "broadcast" as const,
      }

      const result = optimizeSettings(broadcastProject)

      expect((result.recommendedSettings as any).codec).toBe("prores")
      expect(result.reasons.some((r) => r.toLowerCase().includes("broadcast"))).toBe(true)
    })

    it("should adjust bitrate for motion content", () => {
      const motionProject = {
        ...basicProject,
        hasMotion: true,
      }

      const staticResult = optimizeSettings(basicProject)
      const motionResult = optimizeSettings(motionProject)

      expect(motionResult.recommendedSettings.bitrate).toBeGreaterThan(staticResult.recommendedSettings.bitrate || 0)
      expect(motionResult.reasons.some((r) => r.includes("motion"))).toBe(true)
    })

    it("should maintain high FPS for motion content", () => {
      const highFpsMotionProject = {
        ...basicProject,
        fps: 60,
        hasMotion: true,
      }

      const result = optimizeSettings(highFpsMotionProject)

      expect((result.recommendedSettings as any).fps).toBe("60")
      expect(result.reasons.some((r) => r.includes("motion"))).toBe(true)
    })

    it("should reduce resolution for long videos", () => {
      const longProject = {
        ...basicProject,
        duration: 5000, // Over 1 hour
        originalResolution: { width: 3840, height: 2160 }, // 4K
      }

      const result = optimizeSettings(longProject)

      expect(result.recommendedSettings.resolution).toBe("1080")
      expect(result.reasons.some((r) => r.includes("Long video"))).toBe(true)
    })

    it("should provide alternative options", () => {
      const result = optimizeSettings(basicProject)

      expect(result.alternativeOptions).toBeDefined()
      expect(result.alternativeOptions!.length).toBeGreaterThan(0)

      const fastDraft = result.alternativeOptions!.find((alt) => alt.name === "Fast Draft")
      expect(fastDraft).toBeDefined()
      expect(fastDraft!.settings.quality).toBe("draft")

      const compact = result.alternativeOptions!.find((alt) => alt.name === "Compact Size")
      expect(compact).toBeDefined()
      expect((compact!.settings as any).codec).toBe("h265")
    })

    it("should handle complex projects appropriately", () => {
      const complexProject = {
        ...basicProject,
        hasColorGrading: true,
        effectsCount: 15,
        hasTextOverlays: true,
      }

      const result = optimizeSettings(complexProject)

      expect(result.recommendedSettings.quality).toBe("best")
      expect(result.reasons.some((r) => r.includes("Complex effects"))).toBe(true)
      expect(result.reasons.some((r) => r.includes("Color grading"))).toBe(true)
    })

    it("should preserve cinema frame rates", () => {
      const cinemaProject = {
        ...basicProject,
        fps: 24,
      }

      const result = optimizeSettings(cinemaProject)

      expect((result.recommendedSettings as any).fps).toBe("24")
      expect(result.reasons.some((r) => r.includes("Cinema"))).toBe(true)
    })
  })
})

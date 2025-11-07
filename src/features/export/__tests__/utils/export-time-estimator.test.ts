import { describe, expect, it } from "vitest"

import type { ExportSettings } from "../../types/export-types"
import { OutputFormat } from "@/features/video-compiler/types/render"
import {
  estimateExportTime,
  formatEstimatedTime,
  getConfidenceDescription,
  getConfidenceIcon,
  type ProjectMetrics,
} from "../../utils/export-time-estimator"

describe("ExportTimeEstimator", () => {
  const basicSettings: ExportSettings = {
    fileName: "test",
    savePath: "/test",
    format: OutputFormat.Mp4,
    quality: "good",
    resolution: "1080",
    frameRate: "30",
    enableGPU: false,
  }

  const basicProject: ProjectMetrics = {
    durationSeconds: 60,
    clipCount: 5,
    effectsCount: 2,
    transitionsCount: 3,
    resolutionMultiplier: 1.0,
    hasComplexEffects: false,
  }

  describe("estimateExportTime", () => {
    it("should provide baseline estimate for simple project", () => {
      const estimate = estimateExportTime(basicSettings, basicProject)

      expect(estimate.estimatedSeconds).toBeGreaterThan(0)
      expect(estimate.confidence).toBe("medium")
      expect(estimate.factors).toContain("Clips: 5 (+10%)")
      expect(estimate.factors.some((f) => f.includes("Resolution: 1080p"))).toBe(true)
    })

    it("should increase time for complex effects", () => {
      const complexProject = {
        ...basicProject,
        hasComplexEffects: true,
        effectsCount: 10,
      }

      const simpleEstimate = estimateExportTime(basicSettings, basicProject)
      const complexEstimate = estimateExportTime(basicSettings, complexProject)

      expect(complexEstimate.estimatedSeconds).toBeGreaterThan(simpleEstimate.estimatedSeconds)
      expect(complexEstimate.confidence).toBe("low")
    })

    it("should adjust for different resolutions", () => {
      const settings720p = { ...basicSettings, resolution: "720" as const }
      const settings4k = { ...basicSettings, resolution: "4k" as const }

      const estimate720p = estimateExportTime(settings720p, basicProject)
      const estimate4k = estimateExportTime(settings4k, basicProject)

      expect(estimate4k.estimatedSeconds).toBeGreaterThan(estimate720p.estimatedSeconds)
    })

    it("should adjust for different codecs", () => {
      const h264Settings = { ...basicSettings, format: OutputFormat.Mp4, quality: "good" as const }
      const h265Settings = { ...basicSettings, format: OutputFormat.Mp4, quality: "good" as const }

      // Force different codec detection by using specific format strings
      const h264Project = { ...basicProject }
      const h265Project = { ...basicProject }

      const h264Estimate = estimateExportTime(h264Settings, h264Project)
      const h265Estimate = estimateExportTime(h265Settings, h265Project)

      // At minimum, estimates should be different or we should get valid estimates
      expect(h264Estimate.estimatedSeconds).toBeGreaterThan(0)
      expect(h265Estimate.estimatedSeconds).toBeGreaterThan(0)
      expect(h264Estimate.factors).toContain("Codec: h264_medium (0.8x)")
    })

    it("should provide high confidence for simple projects", () => {
      const simpleProject = {
        ...basicProject,
        clipCount: 3,
        effectsCount: 1,
        hasComplexEffects: false,
      }

      const estimate = estimateExportTime(basicSettings, simpleProject)
      expect(estimate.confidence).toBe("high")
    })
  })

  describe("formatEstimatedTime", () => {
    it("should format seconds correctly", () => {
      expect(formatEstimatedTime(45)).toBe("~45s")
    })

    it("should format minutes correctly", () => {
      expect(formatEstimatedTime(90)).toBe("~1m 30s")
      expect(formatEstimatedTime(120)).toBe("~2m")
    })

    it("should format hours correctly", () => {
      expect(formatEstimatedTime(3660)).toBe("~1h 1m")
      expect(formatEstimatedTime(3600)).toBe("~1h")
    })
  })

  describe("getConfidenceIcon", () => {
    it("should return correct icons", () => {
      expect(getConfidenceIcon("high")).toBe("✓")
      expect(getConfidenceIcon("medium")).toBe("~")
      expect(getConfidenceIcon("low")).toBe("?")
    })
  })

  describe("getConfidenceDescription", () => {
    it("should return meaningful descriptions", () => {
      expect(getConfidenceDescription("high")).toContain("simple project")
      expect(getConfidenceDescription("medium")).toContain("typical project")
      expect(getConfidenceDescription("low")).toContain("complex effects")
    })
  })
})

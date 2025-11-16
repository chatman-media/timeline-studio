/**
 * Tests for FFmpeg Filter Generator
 */

import { describe, expect, it } from "vitest"

import type { VideoFilter } from "../../types/filters"
import {
  generateFFmpegFilter,
  generateFFmpegFilterChain,
  generateFilterComplex,
  hasActiveParameters,
} from "../../utils/ffmpeg-filter-generator"

describe("FFmpeg Filter Generator", () => {
  describe("generateFFmpegFilter", () => {
    it("should generate eq filter for brightness, contrast, saturation", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          brightness: 0.1,
          contrast: 1.2,
          saturation: 0.9,
        },
      }

      const result = generateFFmpegFilter(filter)

      expect(result).toContain("eq=")
      expect(result).toContain("brightness=0.1")
      expect(result).toContain("contrast=1.2")
      expect(result).toContain("saturation=0.9")
    })

    it("should generate hue filter", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          hue: 45,
        },
      }

      const result = generateFFmpegFilter(filter)

      expect(result).toContain("hue=h=45")
    })

    it("should generate vignette filter", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "artistic",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          vignette: 0.5,
        },
      }

      const result = generateFFmpegFilter(filter)

      expect(result).toContain("vignette=")
    })

    it("should generate noise filter for grain", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "artistic",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          grain: 0.3,
        },
      }

      const result = generateFFmpegFilter(filter)

      expect(result).toContain("noise=")
    })

    it("should return empty string for default parameters", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          brightness: 0,
          contrast: 1,
          saturation: 1,
        },
      }

      const result = generateFFmpegFilter(filter)

      expect(result).toBe("")
    })

    it("should chain multiple filters", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "intermediate",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          brightness: 0.1,
          hue: 30,
          vignette: 0.5,
        },
      }

      const result = generateFFmpegFilter(filter)

      expect(result).toContain("eq=brightness=0.1")
      expect(result).toContain("hue=h=30")
      expect(result).toContain("vignette=")
      expect(result).toContain(",")
    })
  })

  describe("generateFFmpegFilterChain", () => {
    it("should generate chain for multiple filters", () => {
      const filters: VideoFilter[] = [
        {
          id: "filter-1",
          name: "Filter 1",
          category: "color-correction",
          complexity: "basic",
          tags: [],
          description: { en: "Test" },
          labels: { en: "Test" },
          params: { brightness: 0.1 },
        },
        {
          id: "filter-2",
          name: "Filter 2",
          category: "color-correction",
          complexity: "basic",
          tags: [],
          description: { en: "Test" },
          labels: { en: "Test" },
          params: { contrast: 1.2 },
        },
      ]

      const result = generateFFmpegFilterChain(filters)

      expect(result).toContain("brightness=0.1")
      expect(result).toContain("contrast=1.2")
      expect(result).toContain(",")
    })

    it("should filter out empty filters", () => {
      const filters: VideoFilter[] = [
        {
          id: "filter-1",
          name: "Filter 1",
          category: "color-correction",
          complexity: "basic",
          tags: [],
          description: { en: "Test" },
          labels: { en: "Test" },
          params: { brightness: 0.1 },
        },
        {
          id: "filter-2",
          name: "Filter 2",
          category: "color-correction",
          complexity: "basic",
          tags: [],
          description: { en: "Test" },
          labels: { en: "Test" },
          params: { brightness: 0, contrast: 1 },
        },
      ]

      const result = generateFFmpegFilterChain(filters)

      expect(result).toContain("brightness=0.1")
      expect(result).not.toContain("filter-2")
    })

    it("should return empty string for no active filters", () => {
      const filters: VideoFilter[] = []

      const result = generateFFmpegFilterChain(filters)

      expect(result).toBe("")
    })
  })

  describe("generateFilterComplex", () => {
    it("should generate filter_complex for multiple clips", () => {
      const clipFilters: Record<string, VideoFilter[]> = {
        "clip-1": [
          {
            id: "filter-1",
            name: "Filter 1",
            category: "color-correction",
            complexity: "basic",
            tags: [],
            description: { en: "Test" },
            labels: { en: "Test" },
            params: { brightness: 0.1 },
          },
        ],
        "clip-2": [
          {
            id: "filter-2",
            name: "Filter 2",
            category: "color-correction",
            complexity: "basic",
            tags: [],
            description: { en: "Test" },
            labels: { en: "Test" },
            params: { contrast: 1.2 },
          },
        ],
      }

      const result = generateFilterComplex(clipFilters)

      expect(result).toContain("[0:v]")
      expect(result).toContain("[v0]")
      expect(result).toContain("brightness=0.1")
      expect(result).toContain("[1:v]")
      expect(result).toContain("[v1]")
      expect(result).toContain("contrast=1.2")
      expect(result).toContain(";")
    })
  })

  describe("hasActiveParameters", () => {
    it("should return true for non-default parameters", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          brightness: 0.1,
        },
      }

      expect(hasActiveParameters(filter)).toBe(true)
    })

    it("should return false for all default parameters", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          brightness: 0,
          contrast: 1,
          saturation: 1,
        },
      }

      expect(hasActiveParameters(filter)).toBe(false)
    })

    it("should return true for any non-default parameter", () => {
      const filter: VideoFilter = {
        id: "filter-1",
        name: "Test",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { en: "Test" },
        labels: { en: "Test" },
        params: {
          brightness: 0,
          contrast: 1,
          saturation: 1,
          hue: 10, // Non-default
        },
      }

      expect(hasActiveParameters(filter)).toBe(true)
    })
  })
})

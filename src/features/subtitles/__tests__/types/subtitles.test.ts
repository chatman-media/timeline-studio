import { describe, expect, it } from "vitest"

import type {
  Subtitle,
  SubtitleCategory,
  SubtitleCategoryInfo,
  SubtitleClip,
  SubtitleComplexity,
  SubtitleExportOptions,
  SubtitleImportResult,
  SubtitleStyleTemplate,
  SubtitleTag,
} from "../../types/subtitles"

describe("Subtitle Types", () => {
  describe("SubtitleCategory", () => {
    it("должен содержать все категории", () => {
      const categories: SubtitleCategory[] = ["basic", "cinematic", "stylized", "minimal", "animated", "modern"]

      expect(categories).toHaveLength(6)
    })
  })

  describe("SubtitleComplexity", () => {
    it("должен содержать все уровни сложности", () => {
      const complexities: SubtitleComplexity[] = ["basic", "intermediate", "advanced"]

      expect(complexities).toHaveLength(3)
    })
  })

  describe("SubtitleTag", () => {
    it("должен содержать все теги", () => {
      const tags: SubtitleTag[] = [
        "simple",
        "clean",
        "readable",
        "elegant",
        "professional",
        "movie",
        "bold",
        "dramatic",
        "neon",
        "glow",
        "futuristic",
        "retro",
        "vintage",
        "minimal",
        "modern",
        "animated",
        "typewriter",
        "fade",
        "gradient",
        "colorful",
        "fallback",
      ]

      expect(tags).toHaveLength(21)
    })
  })

  describe("SubtitleStyleTemplate", () => {
    it("должен создавать корректный объект стиля", () => {
      const style: SubtitleStyleTemplate = {
        id: "test-style",
        name: "Test Style",
        category: "basic",
        complexity: "basic",
        tags: ["simple", "clean"],
        description: {
          ru: "Тестовый стиль",
          en: "Test style",
        },
        labels: {
          ru: "Тест",
          en: "Test",
          es: "Prueba",
          fr: "Test",
          de: "Test",
        },
        style: {
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: "bold",
          color: "#FFFFFF",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          textAlign: "center",
        },
      }

      expect(style.id).toBe("test-style")
      expect(style.category).toBe("basic")
      expect(style.style.fontSize).toBe(24)
    })
  })

  describe("Subtitle", () => {
    it("должен создавать корректный объект субтитра", () => {
      const subtitle: Subtitle = {
        id: "sub-1",
        startTime: 0,
        endTime: 5,
        text: "Привет, мир!",
        speaker: "Диктор",
        confidence: 0.95,
        language: "ru",
      }

      expect(subtitle.id).toBe("sub-1")
      expect(subtitle.endTime - subtitle.startTime).toBe(5)
      expect(subtitle.confidence).toBeGreaterThan(0.9)
    })
  })

  describe("SubtitleClip", () => {
    it("должен создавать корректный клип субтитра", () => {
      const clip: SubtitleClip = {
        id: "clip-1",
        name: "Test Subtitle Clip",
        trackId: "subtitle-track-1",
        type: "subtitle",
        mediaId: "media-1",
        startTime: 10,
        duration: 3,
        mediaStartTime: 0,
        mediaEndTime: 3,
        offset: 0,
        volume: 1,
        speed: 1,
        isReversed: false,
        opacity: 1,
        effects: [],
        filters: [],
        transitions: [],
        isSelected: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        text: "Тестовый текст",
        style: {
          fontFamily: "Roboto",
          fontSize: 32,
          color: "#FFFFFF",
        },
        position: {
          x: 0.5,
          y: 0.9,
          width: 1,
          height: 0.1,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        subtitlePosition: {
          alignment: "bottom-center",
        },
      }

      expect(clip.type).toBe("subtitle")
      expect(clip.duration).toBe(3)
      expect(clip.position?.x).toBe(0.5)
      expect(clip.subtitlePosition?.alignment).toBe("bottom-center")
    })
  })

  describe("SubtitleImportResult", () => {
    it("должен создавать корректный результат импорта", () => {
      const importResult: SubtitleImportResult = {
        content: "1\n00:00:00,000 --> 00:00:03,000\nTest subtitle",
        format: "srt",
        file_name: "subtitles.srt",
      }

      expect(importResult.format).toBe("srt")
      expect(importResult.content).toContain("Test subtitle")
    })
  })

  describe("SubtitleExportOptions", () => {
    it("должен создавать корректные опции экспорта", () => {
      const exportOptions: SubtitleExportOptions = {
        format: "vtt",
        content: "WEBVTT\n\n00:00:00.000 --> 00:00:03.000\nTest subtitle",
        output_path: "/path/to/output.vtt",
      }

      expect(exportOptions.format).toBe("vtt")
      expect(exportOptions.content).toContain("WEBVTT")
      expect(exportOptions.output_path).toContain(".vtt")
    })

    it("должен поддерживать все форматы экспорта", () => {
      const formats: SubtitleExportOptions["format"][] = ["srt", "vtt", "ass"]

      expect(formats).toHaveLength(3)
      expect(formats).toContain("srt")
      expect(formats).toContain("vtt")
      expect(formats).toContain("ass")
    })
  })

  describe("SubtitleCategoryInfo", () => {
    it("должен создавать корректную информацию о категории", () => {
      const categoryInfo: SubtitleCategoryInfo = {
        id: "cinematic",
        name: "Кинематографические",
        description: "Стили для фильмов и видео высокого качества",
        styles: [
          {
            id: "movie-classic",
            name: "Movie Classic",
            category: "cinematic",
            complexity: "intermediate",
            tags: ["movie", "professional"],
            description: {
              ru: "Классический киностиль",
              en: "Classic movie style",
            },
            labels: {
              ru: "Киноклассика",
              en: "Movie Classic",
            },
            style: {
              fontFamily: "Georgia",
              fontSize: 28,
              color: "#FFFFFF",
            },
          },
        ],
      }

      expect(categoryInfo.id).toBe("cinematic")
      expect(categoryInfo.styles).toHaveLength(1)
      expect(categoryInfo.styles[0].category).toBe("cinematic")
    })
  })
})

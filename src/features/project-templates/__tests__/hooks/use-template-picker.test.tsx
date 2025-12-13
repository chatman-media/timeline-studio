/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTemplatePicker } from "../../hooks/use-template-picker"
import { projectTemplateManager } from "../../services"
import type { ProjectTemplate } from "../../types/project-template"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("useTemplatePicker", () => {
  let mockTemplates: ProjectTemplate[]

  beforeEach(() => {
    vi.clearAllMocks()

    mockTemplates = [
      {
        id: "youtube-1",
        name: { en: "YouTube Standard", ru: "YouTube стандарт" },
        category: "youtube",
        targetPlatform: "youtube",
        aspectRatio: "16:9",
        estimatedDuration: 600,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
        },
        structure: { tracks: [], sections: [] },
        placeholders: {},
      },
      {
        id: "instagram-1",
        name: { en: "Instagram Reel", ru: "Instagram Reel" },
        category: "social",
        targetPlatform: "instagram",
        aspectRatio: "9:16",
        estimatedDuration: 60,
        settings: {
          resolution: { width: 1080, height: 1920 },
          frameRate: 30,
          aspectRatio: "9:16",
        },
        structure: { tracks: [], sections: [] },
        placeholders: {},
      },
      {
        id: "tiktok-1",
        name: { en: "TikTok Video", ru: "TikTok видео" },
        category: "social",
        targetPlatform: "tiktok",
        aspectRatio: "9:16",
        estimatedDuration: 30,
        settings: {
          resolution: { width: 1080, height: 1920 },
          frameRate: 30,
          aspectRatio: "9:16",
        },
        structure: { tracks: [], sections: [] },
        placeholders: {},
      },
    ] as unknown as ProjectTemplate[]

    vi.spyOn(projectTemplateManager, "getAllTemplates").mockReturnValue(mockTemplates)
  })

  describe("initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useTemplatePicker())

      expect(result.current.templates).toHaveLength(3)
      expect(result.current.selectedTemplates).toEqual([])
      expect(result.current.currentCategory).toBeNull()
      expect(result.current.currentPlatform).toBeNull()
      expect(result.current.searchQuery).toBe("")
      expect(result.current.viewMode).toBe("grid")
    })

    it("should initialize with initial filter", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          initialFilter: { platform: "youtube" },
        }),
      )

      expect(result.current.currentPlatform).toBe("youtube")
    })

    it("should initialize with initial category", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          initialCategory: "social",
        }),
      )

      expect(result.current.currentCategory).toBe("social")
    })
  })

  describe("template selection", () => {
    it("should select single template in single mode", () => {
      const onSelect = vi.fn()
      const onSelectionChange = vi.fn()

      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "single",
          onSelect,
          onSelectionChange,
        }),
      )

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })

      expect(result.current.selectedTemplates).toHaveLength(1)
      expect(result.current.selectedTemplates[0].id).toBe("youtube-1")
      expect(onSelect).toHaveBeenCalledWith(mockTemplates[0])
      expect(onSelectionChange).toHaveBeenCalledWith([mockTemplates[0]])
    })

    it("should replace selection in single mode", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "single",
        }),
      )

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })
      expect(result.current.selectedTemplates).toHaveLength(1)

      act(() => {
        result.current.selectTemplate(mockTemplates[1])
      })
      expect(result.current.selectedTemplates).toHaveLength(1)
      expect(result.current.selectedTemplates[0].id).toBe("instagram-1")
    })

    it("should add multiple templates in multiple mode", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "multiple",
        }),
      )

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })
      expect(result.current.selectedTemplates).toHaveLength(1)

      act(() => {
        result.current.selectTemplate(mockTemplates[1])
      })
      expect(result.current.selectedTemplates).toHaveLength(2)
    })

    it("should not add duplicate in multiple mode", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "multiple",
        }),
      )

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })
      expect(result.current.selectedTemplates).toHaveLength(1)

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })
      expect(result.current.selectedTemplates).toHaveLength(1)
    })

    it("should deselect template", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "multiple",
        }),
      )

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })
      act(() => {
        result.current.selectTemplate(mockTemplates[1])
      })
      expect(result.current.selectedTemplates).toHaveLength(2)

      act(() => {
        result.current.deselectTemplate("youtube-1")
      })
      expect(result.current.selectedTemplates).toHaveLength(1)
      expect(result.current.selectedTemplates[0].id).toBe("instagram-1")
    })

    it("should toggle template selection", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "multiple",
        }),
      )

      // Toggle on
      act(() => {
        result.current.toggleTemplate(mockTemplates[0])
      })
      expect(result.current.isSelected("youtube-1")).toBe(true)

      // Toggle off
      act(() => {
        result.current.toggleTemplate(mockTemplates[0])
      })
      expect(result.current.isSelected("youtube-1")).toBe(false)
    })

    it("should clear all selections", () => {
      const { result } = renderHook(() =>
        useTemplatePicker({
          mode: "multiple",
        }),
      )

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })
      act(() => {
        result.current.selectTemplate(mockTemplates[1])
      })
      expect(result.current.selectedTemplates).toHaveLength(2)

      act(() => {
        result.current.clearSelection()
      })
      expect(result.current.selectedTemplates).toHaveLength(0)
    })

    it("should check if template is selected", () => {
      const { result } = renderHook(() => useTemplatePicker())

      expect(result.current.isSelected("youtube-1")).toBe(false)

      act(() => {
        result.current.selectTemplate(mockTemplates[0])
      })

      expect(result.current.isSelected("youtube-1")).toBe(true)
      expect(result.current.isSelected("instagram-1")).toBe(false)
    })
  })

  describe("filtering", () => {
    it("should filter by category", () => {
      const { result } = renderHook(() => useTemplatePicker())

      expect(result.current.templates).toHaveLength(3)

      act(() => {
        result.current.setCategory("social")
      })

      expect(result.current.templates).toHaveLength(2)
      expect(result.current.templates.every((t) => t.category === "social")).toBe(true)
    })

    it("should filter by platform", () => {
      const { result } = renderHook(() => useTemplatePicker())

      act(() => {
        result.current.setPlatform("instagram")
      })

      expect(result.current.templates).toHaveLength(1)
      expect(result.current.templates[0].targetPlatform).toBe("instagram")
    })

    it("should search templates", () => {
      vi.spyOn(projectTemplateManager, "searchTemplates").mockReturnValue([mockTemplates[0]])

      const { result } = renderHook(() => useTemplatePicker())

      act(() => {
        result.current.setSearchQuery("youtube")
      })

      expect(projectTemplateManager.searchTemplates).toHaveBeenCalledWith("youtube")
      expect(result.current.searchQuery).toBe("youtube")
    })

    it("should combine filters", () => {
      const { result } = renderHook(() => useTemplatePicker())

      act(() => {
        result.current.setCategory("social")
        result.current.setPlatform("instagram")
      })

      expect(result.current.templates).toHaveLength(1)
      expect(result.current.templates[0].id).toBe("instagram-1")
    })

    it("should clear all filters", () => {
      const { result } = renderHook(() => useTemplatePicker())

      act(() => {
        result.current.setCategory("social")
        result.current.setPlatform("instagram")
        result.current.setSearchQuery("test")
      })

      expect(result.current.currentCategory).toBe("social")
      expect(result.current.currentPlatform).toBe("instagram")
      expect(result.current.searchQuery).toBe("test")

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.currentCategory).toBeNull()
      expect(result.current.currentPlatform).toBeNull()
      expect(result.current.searchQuery).toBe("")
    })
  })

  describe("view mode", () => {
    it("should toggle view mode", () => {
      const { result } = renderHook(() => useTemplatePicker())

      expect(result.current.viewMode).toBe("grid")

      act(() => {
        result.current.setViewMode("list")
      })

      expect(result.current.viewMode).toBe("list")
    })
  })

  describe("utilities", () => {
    it("should get unique categories", () => {
      const { result } = renderHook(() => useTemplatePicker())

      expect(result.current.categories).toContain("youtube")
      expect(result.current.categories).toContain("social")
      expect(result.current.categories.length).toBe(2)
    })

    it("should get unique platforms", () => {
      const { result } = renderHook(() => useTemplatePicker())

      expect(result.current.platforms).toContain("youtube")
      expect(result.current.platforms).toContain("instagram")
      expect(result.current.platforms).toContain("tiktok")
      expect(result.current.platforms.length).toBe(3)
    })

    it("should get templates by category", () => {
      const { result } = renderHook(() => useTemplatePicker())

      const socialTemplates = result.current.getTemplatesByCategory("social")
      expect(socialTemplates).toHaveLength(2)
      expect(socialTemplates.every((t) => t.category === "social")).toBe(true)
    })

    it("should get templates by platform", () => {
      const { result } = renderHook(() => useTemplatePicker())

      const youtubeTemplates = result.current.getTemplatesByPlatform("youtube")
      expect(youtubeTemplates).toHaveLength(1)
      expect(youtubeTemplates[0].targetPlatform).toBe("youtube")
    })

    it("should get statistics", () => {
      const mockStats = {
        total: 3,
        byCategory: { youtube: 1, social: 2 },
        byPlatform: { youtube: 1, instagram: 1, tiktok: 1 },
        byAspectRatio: { "16:9": 1, "9:16": 2 },
      }
      vi.spyOn(projectTemplateManager, "getStatistics").mockReturnValue(mockStats)

      const { result } = renderHook(() => useTemplatePicker())

      const stats = result.current.getStatistics()
      expect(stats.total).toBe(3)
      expect(stats.byCategory).toBeDefined()
      expect(stats.byPlatform).toBeDefined()
    })
  })
})

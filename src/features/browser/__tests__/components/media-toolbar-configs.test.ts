import { describe, expect, it } from "vitest"

import {
  effectsFilterOptions,
  effectsGroupOptions,
  effectsSortOptions,
  effectsViewModes,
  filtersFilterOptions,
  getToolbarConfigForContent,
  getViewModesForContent,
  mediaFilterOptions,
  mediaGroupOptions,
  mediaSortOptions,
  mediaViewModes,
  musicViewModes,
  styleTemplatesFilterOptions,
  subtitlesFilterOptions,
  templatesFilterOptions,
  transitionsFilterOptions,
} from "../../components/media-toolbar-configs"

describe("media-toolbar-configs", () => {
  describe("View Mode Configurations", () => {
    it("should have correct media view modes", () => {
      expect(mediaViewModes).toHaveLength(3)
      expect(mediaViewModes.map((mode) => mode.value)).toEqual(["grid", "thumbnails", "list"])

      mediaViewModes.forEach((mode) => {
        expect(mode).toHaveProperty("value")
        expect(mode).toHaveProperty("icon")
        expect(mode).toHaveProperty("label")
        expect(mode).toHaveProperty("testId")
      })
    })

    it("should have correct music view modes", () => {
      expect(musicViewModes).toHaveLength(2)
      expect(musicViewModes.map((mode) => mode.value)).toEqual(["list", "thumbnails"])

      musicViewModes.forEach((mode) => {
        expect(mode).toHaveProperty("value")
        expect(mode).toHaveProperty("icon")
        expect(mode).toHaveProperty("label")
        expect(mode).toHaveProperty("testId")
      })
    })

    it("should have correct effects view modes", () => {
      expect(effectsViewModes).toHaveLength(1)
      expect(effectsViewModes[0].value).toBe("thumbnails")
      expect(effectsViewModes[0]).toHaveProperty("icon")
      expect(effectsViewModes[0]).toHaveProperty("label")
      expect(effectsViewModes[0]).toHaveProperty("testId")
    })
  })

  describe("Sort Options", () => {
    it("should have correct media sort options", () => {
      expect(mediaSortOptions).toHaveLength(4)
      const expectedValues = ["name", "date", "size", "duration"]
      expect(mediaSortOptions.map((option) => option.value)).toEqual(expectedValues)

      mediaSortOptions.forEach((option) => {
        expect(option).toHaveProperty("value")
        expect(option).toHaveProperty("label")
        expect(option.label).toMatch(/^browser\.toolbar\.sortBy\./)
      })
    })

    it("should have correct effects sort options", () => {
      expect(effectsSortOptions).toHaveLength(3)
      const expectedValues = ["name", "complexity", "category"]
      expect(effectsSortOptions.map((option) => option.value)).toEqual(expectedValues)
    })
  })

  describe("Group Options", () => {
    it("should have correct media group options", () => {
      expect(mediaGroupOptions).toHaveLength(4)
      const expectedValues = ["none", "type", "date", "duration"]
      expect(mediaGroupOptions.map((option) => option.value)).toEqual(expectedValues)

      mediaGroupOptions.forEach((option) => {
        expect(option).toHaveProperty("value")
        expect(option).toHaveProperty("label")
        expect(option.label).toMatch(/^browser\.toolbar\.groupBy\./)
      })
    })

    it("should have correct effects group options", () => {
      expect(effectsGroupOptions).toHaveLength(5)
      const expectedValues = ["none", "category", "complexity", "type", "tags"]
      expect(effectsGroupOptions.map((option) => option.value)).toEqual(expectedValues)
    })
  })

  describe("Filter Options", () => {
    it("should have correct media filter options", () => {
      expect(mediaFilterOptions).toHaveLength(3)
      const expectedValues = ["video", "audio", "image"]
      expect(mediaFilterOptions.map((option) => option.value)).toEqual(expectedValues)

      mediaFilterOptions.forEach((option) => {
        expect(option).toHaveProperty("value")
        expect(option).toHaveProperty("label")
        expect(option.label).toMatch(/^browser\.toolbar\.filterBy\./)
      })
    })

    it("should have correct effects filter options", () => {
      expect(effectsFilterOptions.length).toBeGreaterThan(0)
      const complexityOptions = effectsFilterOptions.filter((option) =>
        ["basic", "intermediate", "advanced"].includes(option.value),
      )
      expect(complexityOptions).toHaveLength(3)
    })

    it("should have correct filters filter options", () => {
      expect(filtersFilterOptions.length).toBeGreaterThan(0)
      expect(filtersFilterOptions.some((option) => option.value === "basic")).toBe(true)
      expect(filtersFilterOptions.some((option) => option.value === "color-correction")).toBe(true)
    })

    it("should have correct transitions filter options", () => {
      expect(transitionsFilterOptions.length).toBeGreaterThan(0)
      expect(transitionsFilterOptions.some((option) => option.value === "basic")).toBe(true)
      expect(transitionsFilterOptions.some((option) => option.value === "3d")).toBe(true)
    })

    it("should have correct subtitles filter options", () => {
      expect(subtitlesFilterOptions.length).toBeGreaterThan(0)
      expect(subtitlesFilterOptions.some((option) => option.value === "basic")).toBe(true)
      expect(subtitlesFilterOptions.some((option) => option.value === "animated")).toBe(true)
    })

    it("should have correct templates filter options", () => {
      expect(templatesFilterOptions.length).toBeGreaterThan(0)
      expect(templatesFilterOptions.some((option) => option.value === "2")).toBe(true)
      expect(templatesFilterOptions.some((option) => option.value === "16")).toBe(true)
    })

    it("should have correct style templates filter options", () => {
      expect(styleTemplatesFilterOptions.length).toBeGreaterThan(0)
      expect(styleTemplatesFilterOptions.some((option) => option.value === "intro")).toBe(true)
      expect(styleTemplatesFilterOptions.some((option) => option.value === "modern")).toBe(true)
    })
  })

  describe("getViewModesForContent", () => {
    it("should return correct view modes for media", () => {
      const result = getViewModesForContent("media")
      expect(result).toBe(mediaViewModes)
      expect(result).toHaveLength(3)
    })

    it("should return correct view modes for music", () => {
      const result = getViewModesForContent("music")
      expect(result).toBe(musicViewModes)
      expect(result).toHaveLength(2)
    })

    it("should return correct view modes for effects", () => {
      const result = getViewModesForContent("effects")
      expect(result).toBe(effectsViewModes)
      expect(result).toHaveLength(1)
    })

    it("should return correct view modes for subtitles", () => {
      const result = getViewModesForContent("subtitles")
      expect(result).toBe(effectsViewModes)
      expect(result).toHaveLength(1)
    })

    it("should return default view modes for unknown content type", () => {
      // @ts-expect-error - testing invalid content type
      const result = getViewModesForContent("unknown")
      expect(result).toBe(musicViewModes)
    })
  })

  describe("getToolbarConfigForContent", () => {
    it("should return correct config for media", () => {
      const config = getToolbarConfigForContent("media")

      expect(config.viewModes).toBe(mediaViewModes)
      expect(config.sortOptions).toBe(mediaSortOptions)
      expect(config.groupOptions).toBe(mediaGroupOptions)
      expect(config.filterOptions).toBe(mediaFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for music", () => {
      const config = getToolbarConfigForContent("music")

      expect(config.viewModes).toBe(musicViewModes)
      expect(config.sortOptions).toHaveLength(6)
      expect(config.groupOptions).toHaveLength(4)
      expect(config.filterOptions).toBeUndefined()
      expect(config.showZoom).toBe(false)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for effects", () => {
      const config = getToolbarConfigForContent("effects")

      expect(config.viewModes).toBe(effectsViewModes)
      expect(config.sortOptions).toBe(effectsSortOptions)
      expect(config.groupOptions).toBe(effectsGroupOptions)
      expect(config.filterOptions).toBe(effectsFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for filters", () => {
      const config = getToolbarConfigForContent("filters")

      expect(config.viewModes).toBe(effectsViewModes)
      expect(config.sortOptions).toHaveLength(3)
      expect(config.groupOptions).toHaveLength(4)
      expect(config.filterOptions).toBe(filtersFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for transitions", () => {
      const config = getToolbarConfigForContent("transitions")

      expect(config.viewModes).toBe(effectsViewModes)
      expect(config.sortOptions).toHaveLength(4)
      expect(config.groupOptions).toHaveLength(5)
      expect(config.filterOptions).toBe(transitionsFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for subtitles", () => {
      const config = getToolbarConfigForContent("subtitles")

      expect(config.viewModes).toBe(effectsViewModes)
      expect(config.sortOptions).toHaveLength(3)
      expect(config.groupOptions).toHaveLength(4)
      expect(config.filterOptions).toBe(subtitlesFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for templates", () => {
      const config = getToolbarConfigForContent("templates")

      expect(config.viewModes).toBe(effectsViewModes)
      expect(config.sortOptions).toHaveLength(3)
      expect(config.groupOptions).toHaveLength(3)
      expect(config.filterOptions).toBe(templatesFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return correct config for style_templates", () => {
      const config = getToolbarConfigForContent("style_templates")

      expect(config.viewModes).toBe(effectsViewModes)
      expect(config.sortOptions).toHaveLength(4)
      expect(config.groupOptions).toHaveLength(4)
      expect(config.filterOptions).toBe(styleTemplatesFilterOptions)
      expect(config.showZoom).toBe(true)
      expect(config.showGroupBy).toBe(true)
    })

    it("should return default media config for unknown content type", () => {
      // @ts-expect-error - testing invalid content type
      const config = getToolbarConfigForContent("unknown")
      const mediaConfig = getToolbarConfigForContent("media")

      expect(config).toEqual(mediaConfig)
    })
  })

  describe("Configuration Structure Validation", () => {
    it("should have consistent structure for all sort options", () => {
      const allSortOptions = [mediaSortOptions, effectsSortOptions]

      allSortOptions.forEach((options) => {
        options.forEach((option) => {
          expect(option).toHaveProperty("value")
          expect(option).toHaveProperty("label")
          expect(typeof option.value).toBe("string")
          expect(typeof option.label).toBe("string")
        })
      })
    })

    it("should have consistent structure for all group options", () => {
      const allGroupOptions = [mediaGroupOptions, effectsGroupOptions]

      allGroupOptions.forEach((options) => {
        options.forEach((option) => {
          expect(option).toHaveProperty("value")
          expect(option).toHaveProperty("label")
          expect(typeof option.value).toBe("string")
          expect(typeof option.label).toBe("string")
        })
      })
    })

    it("should have consistent structure for all filter options", () => {
      const allFilterOptions = [
        mediaFilterOptions,
        effectsFilterOptions,
        filtersFilterOptions,
        transitionsFilterOptions,
        subtitlesFilterOptions,
        templatesFilterOptions,
        styleTemplatesFilterOptions,
      ]

      allFilterOptions.forEach((options) => {
        options.forEach((option) => {
          expect(option).toHaveProperty("value")
          expect(option).toHaveProperty("label")
          expect(typeof option.value).toBe("string")
          expect(typeof option.label).toBe("string")
        })
      })
    })
  })
})

/**
 * Tests for filters module exports
 *
 * Ensures all public API is properly exported and accessible
 */

import { describe, expect, it } from "vitest"

describe("Filters module exports", () => {
  describe("Components", () => {
    it("should export FilterGroup component", async () => {
      const module = await import("../components/filter-group")
      expect(module.FilterGroup).toBeDefined()
      expect(typeof module.FilterGroup).toBe("function")
    })

    it("should export FilterParameterControls component", async () => {
      const module = await import("../components/filter-parameter-controls")
      expect(module.FilterParameterControls).toBeDefined()
      expect(typeof module.FilterParameterControls).toBe("function")
    })

    it("should export FilterPreview component", async () => {
      const module = await import("../components/filter-preview")
      expect(module.FilterPreview).toBeDefined()
      expect(typeof module.FilterPreview).toBe("function")
    })
  })

  describe("Hooks", () => {
    it("should export useFilters hook", async () => {
      const module = await import("../hooks/use-filters")
      expect(module.useFilters).toBeDefined()
      expect(typeof module.useFilters).toBe("function")
    })

    it("should export useFilterById hook", async () => {
      const module = await import("../hooks/use-filters")
      expect(module.useFilterById).toBeDefined()
      expect(typeof module.useFilterById).toBe("function")
    })

    it("should export useFiltersByCategory hook", async () => {
      const module = await import("../hooks/use-filters")
      expect(module.useFiltersByCategory).toBeDefined()
      expect(typeof module.useFiltersByCategory).toBe("function")
    })

    it("should export useFiltersSearch hook", async () => {
      const module = await import("../hooks/use-filters")
      expect(module.useFiltersSearch).toBeDefined()
      expect(typeof module.useFiltersSearch).toBe("function")
    })

    it("should export useFilterDragDrop hook", async () => {
      const module = await import("../hooks/use-filter-drag-drop")
      expect(module.useFilterDragDrop).toBeDefined()
      expect(typeof module.useFilterDragDrop).toBe("function")
    })

    it("should export useFilterTimelineIntegration hook", async () => {
      const module = await import("../hooks/use-filter-timeline-integration")
      expect(module.useFilterTimelineIntegration).toBeDefined()
      expect(typeof module.useFilterTimelineIntegration).toBe("function")
    })

    it("should export useFiltersImport hook", async () => {
      const module = await import("../hooks/use-filters-import")
      expect(module.useFiltersImport).toBeDefined()
      expect(typeof module.useFiltersImport).toBe("function")
    })
  })

  describe("Utilities", () => {
    it("should export CSS filter utilities", async () => {
      const module = await import("../utils/css-filters")
      expect(module.generateCSSFilter).toBeDefined()
      expect(typeof module.generateCSSFilter).toBe("function")
      expect(module.applyCSSFilter).toBeDefined()
      expect(typeof module.applyCSSFilter).toBe("function")
      expect(module.resetCSSFilter).toBeDefined()
      expect(typeof module.resetCSSFilter).toBe("function")
    })

    it("should export FFmpeg filter generator utilities", async () => {
      const module = await import("../utils/ffmpeg-filter-generator")
      expect(module.generateFFmpegFilter).toBeDefined()
      expect(typeof module.generateFFmpegFilter).toBe("function")
    })

    it("should export filter processor utilities", async () => {
      const module = await import("../utils/filter-processor")
      expect(module.processFilters).toBeDefined()
      expect(typeof module.processFilters).toBe("function")
      expect(module.validateFiltersData).toBeDefined()
      expect(typeof module.validateFiltersData).toBe("function")
      expect(module.createFallbackFilter).toBeDefined()
      expect(typeof module.createFallbackFilter).toBe("function")
    })
  })

  describe("Main index exports", () => {
    it("should export all components from main index", async () => {
      const module = await import("../index")
      expect(module.FilterGroup).toBeDefined()
      expect(module.FilterParameterControls).toBeDefined()
      expect(module.FilterPreview).toBeDefined()
    })

    it("should export all hooks from main index", async () => {
      const module = await import("../index")
      expect(module.useFilters).toBeDefined()
      expect(module.useFilterById).toBeDefined()
      expect(module.useFiltersByCategory).toBeDefined()
      expect(module.useFiltersSearch).toBeDefined()
      expect(module.useFilterDragDrop).toBeDefined()
      expect(module.useFilterTimelineIntegration).toBeDefined()
    })

    it("should export all utilities from main index", async () => {
      const module = await import("../index")
      expect(module.generateCSSFilter).toBeDefined()
      expect(module.applyCSSFilter).toBeDefined()
      expect(module.resetCSSFilter).toBeDefined()
      expect(module.generateFFmpegFilter).toBeDefined()
      expect(module.processFilters).toBeDefined()
      expect(module.validateFiltersData).toBeDefined()
      expect(module.createFallbackFilter).toBeDefined()
    })
  })

  describe("Type exports", () => {
    it("should export VideoFilter type", async () => {
      const module = await import("../types/filters")
      expect(module).toBeDefined()
      // Types are checked at compile time, so we just verify the module loads
    })

    it("should export filter types through main index", async () => {
      // Type exports should be available through the main index
      // This is verified at compile time, not runtime
      const module = await import("../index")
      expect(module).toBeDefined()
    })
  })

  describe("No unexpected exports", () => {
    it("should not have default export from main index", async () => {
      const module = await import("../index")
      expect(module.default).toBeUndefined()
    })

    it("should only export documented API", async () => {
      const module = await import("../index")
      const exports = Object.keys(module)

      // All exports should be from expected categories
      const expectedExports = [
        // Components
        "FilterGroup",
        "FilterParameterControls",
        "FilterPreview",
        // Hooks
        "useFilters",
        "useFilterById",
        "useFiltersByCategory",
        "useFiltersSearch",
        "useFilterDragDrop",
        "useFilterTimelineIntegration",
        "useFiltersImport",
        // Utils - CSS Filters
        "generateCSSFilter",
        "applyCSSFilter",
        "resetCSSFilter",
        "filterToCSSFilter",
        "presetCSSFilters",
        "getPresetCSSFilter",
        "combineCSSFilters",
        "parseCSSFilter",
        "validateCSSFilterParams",
        // Utils - FFmpeg
        "generateFFmpegFilter",
        "generateFFmpegFilterChain",
        "generateFilterComplex",
        "hasActiveParameters",
        // Utils - Filter Processor
        "processFilters",
        "validateFiltersData",
        "createFallbackFilter",
        "searchFilters",
        "groupFilters",
        "sortFilters",
      ]

      exports.forEach((exportName) => {
        expect(expectedExports).toContain(exportName)
      })
    })
  })

  describe("Export integrity", () => {
    it("should export components that are React components", async () => {
      const module = await import("../index")

      // Components should be functions (React components)
      expect(typeof module.FilterGroup).toBe("function")
      expect(typeof module.FilterParameterControls).toBe("function")
      expect(typeof module.FilterPreview).toBe("function")
    })

    it("should export hooks that are functions", async () => {
      const module = await import("../index")

      // Hooks should be functions
      expect(typeof module.useFilters).toBe("function")
      expect(typeof module.useFilterById).toBe("function")
      expect(typeof module.useFiltersByCategory).toBe("function")
      expect(typeof module.useFiltersSearch).toBe("function")
      expect(typeof module.useFilterDragDrop).toBe("function")
      expect(typeof module.useFilterTimelineIntegration).toBe("function")
    })

    it("should export utilities that are functions", async () => {
      const module = await import("../index")

      // Utilities should be functions
      expect(typeof module.generateCSSFilter).toBe("function")
      expect(typeof module.applyCSSFilter).toBe("function")
      expect(typeof module.resetCSSFilter).toBe("function")
      expect(typeof module.generateFFmpegFilter).toBe("function")
      expect(typeof module.processFilters).toBe("function")
      expect(typeof module.validateFiltersData).toBe("function")
      expect(typeof module.createFallbackFilter).toBe("function")
    })
  })
})

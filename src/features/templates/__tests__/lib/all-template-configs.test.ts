import { describe, expect, it } from "vitest"

import { ALL_TEMPLATE_CONFIG_MAP, ALL_TEMPLATE_CONFIGS, getAllTemplateConfig } from "../../lib/all-template-configs"

describe("All Template Configurations", () => {
  describe("ALL_TEMPLATE_CONFIGS", () => {
    it("should contain expected number of templates", () => {
      // Currently: 78 базовых + 26 PiP + 20 профессиональных + 30 дополнительных + 5 dup = 159
      expect(ALL_TEMPLATE_CONFIGS.length).toBeGreaterThan(150)
      expect(ALL_TEMPLATE_CONFIGS.length).toBeLessThan(200)
    })

    it("should have unique template IDs", () => {
      const ids = ALL_TEMPLATE_CONFIGS.map((config) => config.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("should include all expected template categories", () => {
      const ids = ALL_TEMPLATE_CONFIGS.map((config) => config.id)

      // Check for basic splits
      expect(ids).toContain("split-vertical-landscape")
      expect(ids).toContain("split-horizontal-portrait")
      expect(ids).toContain("split-diagonal-square")

      // Check for grid templates
      expect(ids).toContain("split-grid-2x2-landscape")
      expect(ids).toContain("split-grid-3x3-square")
      expect(ids).toContain("split-grid-5x5-landscape")

      // Check for custom layouts
      expect(ids).toContain("split-1-3-landscape")
      expect(ids).toContain("split-3-1-portrait")
      expect(ids).toContain("split-custom-5-1-landscape")
      expect(ids).toContain("split-custom-7-1-square")
    })

    it("should have valid split types", () => {
      const validSplitTypes = ["vertical", "horizontal", "diagonal", "custom", "grid"]

      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        expect(validSplitTypes).toContain(config.split)
      })
    })

    it("should have valid screen counts", () => {
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        expect(config.screens).toBeGreaterThan(0)
        expect(config.screens).toBeLessThanOrEqual(25)
        expect(Number.isInteger(config.screens)).toBe(true)
      })
    })

    it("should have cells configuration matching screen count", () => {
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        if (config.cells) {
          expect(config.cells).toHaveLength(config.screens)
        }
      })
    })

    it("should have valid grid configurations for grid templates", () => {
      const gridTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "grid")

      gridTemplates.forEach((config) => {
        expect(config.gridConfig).toBeDefined()
        expect(config.gridConfig?.columns).toBeGreaterThan(0)
        expect(config.gridConfig?.rows).toBeGreaterThan(0)
        expect(config.gridConfig!.columns * config.gridConfig!.rows).toBe(config.screens)
      })
    })

    it("should have split points for diagonal templates", () => {
      const diagonalTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "diagonal")

      diagonalTemplates.forEach((config) => {
        expect(config.splitPoints).toBeDefined()
        expect(config.splitPoints).toHaveLength(2)

        config.splitPoints?.forEach((point) => {
          expect(point.x).toBeGreaterThanOrEqual(0)
          expect(point.x).toBeLessThanOrEqual(100)
          expect(point.y).toBeGreaterThanOrEqual(0)
          expect(point.y).toBeLessThanOrEqual(100)
        })
      })
    })

    it("should have cell layouts for custom templates", () => {
      const customTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "custom")

      customTemplates.forEach((config) => {
        expect(config.cellLayouts).toBeDefined()
        expect(config.cellLayouts).toHaveLength(config.screens)

        config.cellLayouts?.forEach((layout) => {
          expect(layout.position).toBeDefined()
          expect(layout.width).toBeDefined()
          expect(layout.height).toBeDefined()
        })
      })
    })
  })

  describe("Template Categories", () => {
    it("should have vertical split templates", () => {
      const verticalTemplates = ALL_TEMPLATE_CONFIGS.filter(
        (config) => config.split === "vertical" && config.screens === 2,
      )
      expect(verticalTemplates.length).toBeGreaterThan(0)
    })

    it("should have horizontal split templates", () => {
      const horizontalTemplates = ALL_TEMPLATE_CONFIGS.filter(
        (config) => config.split === "horizontal" && config.screens === 2,
      )
      expect(horizontalTemplates.length).toBeGreaterThan(0)
    })

    it("should have diagonal split templates", () => {
      const diagonalTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "diagonal")
      expect(diagonalTemplates.length).toBeGreaterThan(0)
    })

    it("should have grid templates with various sizes", () => {
      const gridTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "grid")

      const gridSizes = new Set(gridTemplates.map((template) => template.screens))
      expect(gridSizes).toContain(4) // 2x2
      expect(gridSizes).toContain(6) // 2x3, 3x2
      expect(gridSizes).toContain(8) // 2x4, 4x2
      expect(gridSizes).toContain(9) // 3x3
      expect(gridSizes).toContain(10) // 5x2
      expect(gridSizes).toContain(12) // 3x4, 4x3
      expect(gridSizes).toContain(16) // 4x4
      expect(gridSizes).toContain(25) // 5x5
    })

    it("should have custom layouts for different screen counts", () => {
      const customTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "custom")

      const customScreenCounts = new Set(customTemplates.map((template) => template.screens))
      expect(customScreenCounts).toContain(3) // Mixed layouts
      expect(customScreenCounts).toContain(4) // 1-3, 3-1 layouts
      expect(customScreenCounts).toContain(5) // Custom 5-screen layouts
      expect(customScreenCounts).toContain(7) // Custom 7-screen layouts
    })
  })

  describe("Template Aspect Ratios", () => {
    it("should have templates for all aspect ratios", () => {
      const landscapeTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("-landscape"))
      const portraitTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("-portrait"))
      const squareTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("-square"))

      expect(landscapeTemplates.length).toBeGreaterThan(0)
      expect(portraitTemplates.length).toBeGreaterThan(0)
      expect(squareTemplates.length).toBeGreaterThan(0)
    })

    it("should have balanced distribution across aspect ratios", () => {
      const aspectRatioCounts = {
        landscape: ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("-landscape")).length,
        portrait: ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("-portrait")).length,
        square: ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("-square")).length,
      }

      // Each aspect ratio should have at least 15 templates
      expect(aspectRatioCounts.landscape).toBeGreaterThanOrEqual(15)
      expect(aspectRatioCounts.portrait).toBeGreaterThanOrEqual(15)
      expect(aspectRatioCounts.square).toBeGreaterThanOrEqual(15)
    })
  })

  describe("Template Screen Counts", () => {
    it("should have templates for various screen counts", () => {
      const screenCounts = new Set(ALL_TEMPLATE_CONFIGS.map((config) => config.screens))

      expect(screenCounts).toContain(2) // Basic splits
      expect(screenCounts).toContain(3) // Triple splits and mixed
      expect(screenCounts).toContain(4) // Quad splits and grids
      expect(screenCounts).toContain(5) // Custom 5-screen
      expect(screenCounts).toContain(6) // 2x3, 3x2 grids
      expect(screenCounts).toContain(7) // Custom 7-screen
      expect(screenCounts).toContain(8) // 2x4, 4x2 grids
      expect(screenCounts).toContain(9) // 3x3 grids
      expect(screenCounts).toContain(10) // 5x2 grids
      expect(screenCounts).toContain(12) // 3x4, 4x3 grids
      expect(screenCounts).toContain(16) // 4x4 grids
      expect(screenCounts).toContain(25) // 5x5 grids
    })

    it("should have reasonable distribution of screen counts", () => {
      const screenCountDistribution = ALL_TEMPLATE_CONFIGS.reduce<Record<number, number>>((acc, config) => {
        acc[config.screens] = (acc[config.screens] || 0) + 1
        return acc
      }, {})

      // Should have plenty of templates for common screen counts
      expect(screenCountDistribution[2]).toBeGreaterThanOrEqual(6) // Basic splits
      expect(screenCountDistribution[3]).toBeGreaterThanOrEqual(6) // Triple layouts
      expect(screenCountDistribution[4]).toBeGreaterThanOrEqual(9) // Quad layouts + grids
      expect(screenCountDistribution[5]).toBeGreaterThanOrEqual(6) // Custom 5-screen
    })
  })

  describe("Template Configuration Quality", () => {
    it("should have properly configured cells with alternating backgrounds", () => {
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        if (config.cells) {
          config.cells.forEach((cell, _index) => {
            expect(cell.background?.color).toBeDefined()
            expect(cell.border?.width).toBeDefined()

            // Title can be either shown or hidden (e.g., PiP templates hide titles on small screens)
            if (cell.title) {
              expect(typeof cell.title.show).toBe("boolean")

              // If title is shown and has text, it should be a non-empty string
              if (cell.title.show && cell.title.text) {
                expect(typeof cell.title.text).toBe("string")
                expect(cell.title.text.length).toBeGreaterThan(0)
              }
            }

            // Check that backgrounds are one of the expected colors
            const expectedColors = ["#23262b", "#2a2e36"]
            expect(expectedColors).toContain(cell.background?.color)
          })
        }
      })
    })

    it("should have consistent divider configurations", () => {
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        if (config.dividers) {
          expect(config.dividers.show).toBe(true)
          expect(config.dividers.width).toBeDefined()
          expect(config.dividers.color).toBeDefined()
          expect(config.dividers.style).toBeDefined()
        }
      })
    })

    it("should have resizable flag for appropriate templates", () => {
      const basicSplitTemplates = ALL_TEMPLATE_CONFIGS.filter(
        (config) => config.split === "vertical" || config.split === "horizontal" || config.split === "diagonal",
      )

      basicSplitTemplates.forEach((config) => {
        expect(config.resizable).toBe(true)
      })
    })

    it("should have valid absolute positioning for custom layouts", () => {
      const customTemplates = ALL_TEMPLATE_CONFIGS.filter((config) => config.split === "custom")

      customTemplates.forEach((config) => {
        config.cellLayouts?.forEach((layout) => {
          expect(layout.position).toBe("absolute")

          // Check that positioning values are valid CSS values (including "0" and calc())
          const cssValueRegex = /^(\d+(\.\d+)?%|0|calc\(.+\))$/
          if (layout.top) expect(layout.top).toMatch(cssValueRegex)
          if (layout.left) expect(layout.left).toMatch(cssValueRegex)
          if (layout.right) expect(layout.right).toMatch(cssValueRegex)
          if (layout.bottom) expect(layout.bottom).toMatch(cssValueRegex)
          if (layout.width) expect(layout.width).toMatch(cssValueRegex)
          if (layout.height) expect(layout.height).toMatch(cssValueRegex)
        })
      })
    })
  })

  describe("ALL_TEMPLATE_CONFIG_MAP", () => {
    it("should create a map with all template IDs as keys", () => {
      const expectedKeys = ALL_TEMPLATE_CONFIGS.map((config) => config.id)
      const actualKeys = Object.keys(ALL_TEMPLATE_CONFIG_MAP)

      expect(actualKeys.sort()).toEqual(expectedKeys.sort())
    })

    it("should contain the correct template configurations", () => {
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        expect(ALL_TEMPLATE_CONFIG_MAP[config.id]).toEqual(config)
      })
    })

    it("should allow fast lookup of templates", () => {
      const template = ALL_TEMPLATE_CONFIG_MAP["split-vertical-landscape"]
      expect(template).toBeDefined()
      expect(template.id).toBe("split-vertical-landscape")
      expect(template.split).toBe("vertical")
      expect(template.screens).toBe(2)
    })
  })

  describe("getAllTemplateConfig function", () => {
    it("should return correct template for valid ID", () => {
      const template = getAllTemplateConfig("split-grid-3x3-square")
      expect(template).toBeDefined()
      expect(template?.id).toBe("split-grid-3x3-square")
      expect(template?.split).toBe("grid")
      expect(template?.screens).toBe(9)
    })

    it("should return undefined for invalid ID", () => {
      const template = getAllTemplateConfig("non-existent-template")
      expect(template).toBeUndefined()
    })

    it("should handle empty string", () => {
      const template = getAllTemplateConfig("")
      expect(template).toBeUndefined()
    })

    it("should work with all template IDs", () => {
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        const found = getAllTemplateConfig(config.id)
        expect(found).toEqual(config)
      })
    })
  })

  describe("Specific Template Tests", () => {
    it("should have correct 2x2 grid configurations", () => {
      const grid2x2Templates = ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("split-grid-2x2"))

      grid2x2Templates.forEach((template) => {
        expect(template.screens).toBe(4)
        expect(template.gridConfig?.columns).toBe(2)
        expect(template.gridConfig?.rows).toBe(2)
        expect(template.cells).toHaveLength(4)
      })
    })

    it("should have correct 5x5 grid configurations", () => {
      const grid5x5Templates = ALL_TEMPLATE_CONFIGS.filter((config) => config.id.includes("split-grid-5x5"))

      grid5x5Templates.forEach((template) => {
        expect(template.screens).toBe(25)
        expect(template.gridConfig?.columns).toBe(5)
        expect(template.gridConfig?.rows).toBe(5)
        expect(template.cells).toHaveLength(25)
      })
    })

    it("should have correct diagonal template configurations", () => {
      const diagonalTemplate = getAllTemplateConfig("split-diagonal-landscape")
      expect(diagonalTemplate).toBeDefined()
      expect(diagonalTemplate?.splitPoints).toHaveLength(2)
      expect(diagonalTemplate?.splitPoints?.[0]).toEqual({ x: 66.67, y: 0 })
      expect(diagonalTemplate?.splitPoints?.[1]).toEqual({ x: 33.33, y: 100 })
    })

    it("should have correct custom 1-3 layout configurations", () => {
      const template13 = getAllTemplateConfig("split-1-3-landscape")
      expect(template13).toBeDefined()
      expect(template13?.screens).toBe(4)
      expect(template13?.cellLayouts).toHaveLength(4)

      // Check that first cell takes half width and full height
      expect(template13?.cellLayouts?.[0].width).toBe("50%")
      expect(template13?.cellLayouts?.[0].height).toBe("100%")
    })

    it("should have correct custom 7-screen layout configurations", () => {
      const template7 = getAllTemplateConfig("split-custom-7-1-square")
      expect(template7).toBeDefined()
      expect(template7?.screens).toBe(7)
      expect(template7?.cellLayouts).toHaveLength(7)
      expect(template7?.split).toBe("custom")
    })
  })

  describe("Performance Tests", () => {
    it("should be able to quickly iterate through all templates", () => {
      const start = performance.now()

      let totalScreens = 0
      ALL_TEMPLATE_CONFIGS.forEach((config) => {
        totalScreens += config.screens
      })

      const end = performance.now()

      expect(totalScreens).toBeGreaterThan(500) // Should have many screens total
      expect(end - start).toBeLessThan(10) // Should be very fast
    })

    it("should have fast map lookup performance", () => {
      const start = performance.now()

      const testIds = [
        "split-vertical-landscape",
        "split-grid-3x3-square",
        "split-custom-5-1-landscape",
        "split-diagonal-portrait",
        "split-grid-5x5-square",
      ]

      testIds.forEach((id) => {
        const template = ALL_TEMPLATE_CONFIG_MAP[id]
        expect(template).toBeDefined()
      })

      const end = performance.now()
      expect(end - start).toBeLessThan(1) // Should be extremely fast
    })
  })
})

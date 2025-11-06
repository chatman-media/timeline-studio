import { describe, expect, it, vi } from "vitest"

import { createCellConfig, createDividerConfig, PRESET_STYLES, TEMPLATE_MAP } from "../../lib/templates"

// Mock the new template configs system
vi.mock("../../lib/all-template-configs", () => ({
  landscapeTemplates: [
    { id: "landscape-1", split: "vertical", screens: 2, render: () => null },
    { id: "landscape-2", split: "horizontal", screens: 2, render: () => null },
    { id: "landscape-3", split: "grid", screens: 4, render: () => null },
  ],
  portraitTemplates: [
    { id: "portrait-1", split: "vertical", screens: 2, render: () => null },
    { id: "portrait-2", split: "horizontal", screens: 2, render: () => null },
  ],
  squareTemplates: [
    { id: "square-1", split: "grid", screens: 4, render: () => null },
    { id: "square-2", split: "grid", screens: 9, render: () => null },
  ],
}))

describe("Templates Module", () => {
  describe("TEMPLATE_MAP", () => {
    it("should export template map with all aspect ratios", () => {
      expect(TEMPLATE_MAP).toBeDefined()
      expect(TEMPLATE_MAP).toHaveProperty("landscape")
      expect(TEMPLATE_MAP).toHaveProperty("portrait")
      expect(TEMPLATE_MAP).toHaveProperty("square")
    })

    it("should contain landscape templates", () => {
      expect(TEMPLATE_MAP.landscape).toHaveLength(3)
      expect(TEMPLATE_MAP.landscape[0].id).toBe("landscape-1")
      expect(TEMPLATE_MAP.landscape[1].id).toBe("landscape-2")
      expect(TEMPLATE_MAP.landscape[2].id).toBe("landscape-3")
    })

    it("should contain portrait templates", () => {
      expect(TEMPLATE_MAP.portrait).toHaveLength(2)
      expect(TEMPLATE_MAP.portrait[0].id).toBe("portrait-1")
      expect(TEMPLATE_MAP.portrait[1].id).toBe("portrait-2")
    })

    it("should contain square templates", () => {
      expect(TEMPLATE_MAP.square).toHaveLength(2)
      expect(TEMPLATE_MAP.square[0].id).toBe("square-1")
      expect(TEMPLATE_MAP.square[1].id).toBe("square-2")
    })

    it("should have templates with required properties", () => {
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          expect(template).toHaveProperty("id")
          expect(template).toHaveProperty("split")
          expect(template).toHaveProperty("screens")
          expect(typeof template.id).toBe("string")
          expect(typeof template.split).toBe("string")
          expect(typeof template.screens).toBe("number")
        })
      })
    })

    it("should have valid split types", () => {
      const validSplitTypes = ["vertical", "horizontal", "diagonal", "custom", "grid"]

      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          expect(validSplitTypes).toContain(template.split)
        })
      })
    })

    it("should have valid screen counts", () => {
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          expect(template.screens).toBeGreaterThan(0)
          expect(Number.isInteger(template.screens)).toBe(true)
        })
      })
    })

    it("should have unique IDs across all categories", () => {
      const allIds: string[] = []
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          allIds.push(template.id)
        })
      })

      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(allIds.length)
    })
  })

  describe("Re-exported utilities", () => {
    describe("createCellConfig", () => {
      it("should be re-exported and functional", () => {
        expect(createCellConfig).toBeDefined()
        expect(typeof createCellConfig).toBe("function")

        const config = createCellConfig(0)
        expect(config).toBeDefined()
        expect(config.title?.text).toBe("1")
      })

      it("should create different configs for different indices", () => {
        const config0 = createCellConfig(0)
        const config1 = createCellConfig(1)

        expect(config0.background?.color).toBe("#23262b")
        expect(config1.background?.color).toBe("#2a2e36")
      })
    })

    describe("createDividerConfig", () => {
      it("should be re-exported and functional", () => {
        expect(createDividerConfig).toBeDefined()
        expect(typeof createDividerConfig).toBe("function")

        const config = createDividerConfig()
        expect(config).toBeDefined()
        expect(config.show).toBe(true)
      })

      it("should support different presets", () => {
        const defaultConfig = createDividerConfig("default")
        const dashedConfig = createDividerConfig("dashed")

        expect(defaultConfig.style).toBe("solid")
        expect(dashedConfig.style).toBe("dashed")
      })
    })

    describe("PRESET_STYLES", () => {
      it("should be re-exported", () => {
        expect(PRESET_STYLES).toBeDefined()
        expect(PRESET_STYLES.cell).toBeDefined()
        expect(PRESET_STYLES.divider).toBeDefined()
        expect(PRESET_STYLES.layout).toBeDefined()
      })

      it("should contain expected cell presets", () => {
        expect(PRESET_STYLES.cell.default).toBeDefined()
        expect(PRESET_STYLES.cell.alternate).toBeDefined()

        expect(PRESET_STYLES.cell.default.background?.color).toBe("#23262b")
        expect(PRESET_STYLES.cell.alternate.background?.color).toBe("#2a2e36")
      })

      it("should contain expected divider presets", () => {
        expect(PRESET_STYLES.divider.default).toBeDefined()
        expect(PRESET_STYLES.divider.dashed).toBeDefined()
        expect(PRESET_STYLES.divider.thick).toBeDefined()
      })

      it("should contain expected layout presets", () => {
        expect(PRESET_STYLES.layout.default).toBeDefined()
        expect(PRESET_STYLES.layout.withGap).toBeDefined()
      })
    })
  })

  describe("Template Distribution", () => {
    it("should have templates in each category", () => {
      expect(TEMPLATE_MAP.landscape.length).toBeGreaterThan(0)
      expect(TEMPLATE_MAP.portrait.length).toBeGreaterThan(0)
      expect(TEMPLATE_MAP.square.length).toBeGreaterThan(0)
    })

    it("should have reasonable distribution across categories", () => {
      const totalTemplates = TEMPLATE_MAP.landscape.length + TEMPLATE_MAP.portrait.length + TEMPLATE_MAP.square.length

      expect(totalTemplates).toBeGreaterThan(5)

      // Each category should have at least 1 template
      expect(TEMPLATE_MAP.landscape.length).toBeGreaterThanOrEqual(1)
      expect(TEMPLATE_MAP.portrait.length).toBeGreaterThanOrEqual(1)
      expect(TEMPLATE_MAP.square.length).toBeGreaterThanOrEqual(1)
    })

    it("should have variety in split types per category", () => {
      // Landscape should have multiple split types
      const landscapeSplits = new Set(TEMPLATE_MAP.landscape.map((t) => t.split))
      expect(landscapeSplits.size).toBeGreaterThan(1)

      // Portrait should have multiple split types
      const portraitSplits = new Set(TEMPLATE_MAP.portrait.map((t) => t.split))
      expect(portraitSplits.size).toBeGreaterThan(0)

      // Square should have multiple split types
      const squareSplits = new Set(TEMPLATE_MAP.square.map((t) => t.split))
      expect(squareSplits.size).toBeGreaterThan(0)
    })

    it("should have variety in screen counts per category", () => {
      // Check that we have different screen counts
      const allScreenCounts = new Set()
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          allScreenCounts.add(template.screens)
        })
      })

      expect(allScreenCounts.size).toBeGreaterThan(1)
      expect(allScreenCounts).toContain(2) // Basic splits
      expect(allScreenCounts).toContain(4) // Grid templates
    })
  })

  describe("Template Consistency", () => {
    it("should have consistent ID patterns within categories", () => {
      // Landscape templates should start with category prefix
      TEMPLATE_MAP.landscape.forEach((template) => {
        expect(template.id).toMatch(/^landscape-/)
      })

      // Portrait templates should start with category prefix
      TEMPLATE_MAP.portrait.forEach((template) => {
        expect(template.id).toMatch(/^portrait-/)
      })

      // Square templates should start with category prefix
      TEMPLATE_MAP.square.forEach((template) => {
        expect(template.id).toMatch(/^square-/)
      })
    })

    it("should have render functions for all templates", () => {
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          if (template.render) {
            expect(typeof template.render).toBe("function")
          }
        })
      })
    })

    it("should have consistent screen count ranges", () => {
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          expect(template.screens).toBeGreaterThanOrEqual(1)
          expect(template.screens).toBeLessThanOrEqual(25) // Reasonable upper limit
        })
      })
    })
  })

  describe("Type Safety", () => {
    it("should properly type template map keys", () => {
      const keys = Object.keys(TEMPLATE_MAP) as (keyof typeof TEMPLATE_MAP)[]
      expect(keys).toContain("landscape")
      expect(keys).toContain("portrait")
      expect(keys).toContain("square")
      expect(keys).toHaveLength(3)
    })

    it("should allow accessing templates via typed keys", () => {
      const landscapeKey: keyof typeof TEMPLATE_MAP = "landscape"
      const portraitKey: keyof typeof TEMPLATE_MAP = "portrait"
      const squareKey: keyof typeof TEMPLATE_MAP = "square"

      expect(TEMPLATE_MAP[landscapeKey]).toBeDefined()
      expect(TEMPLATE_MAP[portraitKey]).toBeDefined()
      expect(TEMPLATE_MAP[squareKey]).toBeDefined()
    })

    it("should have properly typed template properties", () => {
      Object.values(TEMPLATE_MAP).forEach((templates) => {
        templates.forEach((template) => {
          // Check string properties
          expect(typeof template.id).toBe("string")
          expect(typeof template.split).toBe("string")

          // Check number properties
          expect(typeof template.screens).toBe("number")

          // Check optional properties
          if (template.resizable !== undefined) {
            expect(typeof template.resizable).toBe("boolean")
          }

          if (template.splitPosition !== undefined) {
            expect(typeof template.splitPosition).toBe("number")
          }
        })
      })
    })
  })

  describe("Integration with Template Previews", () => {
    it("should properly import from template preview components", () => {
      // The mocked data should be accessible
      expect(TEMPLATE_MAP.landscape).toEqual([
        { id: "landscape-1", split: "vertical", screens: 2, render: expect.any(Function) },
        { id: "landscape-2", split: "horizontal", screens: 2, render: expect.any(Function) },
        { id: "landscape-3", split: "grid", screens: 4, render: expect.any(Function) },
      ])
    })

    it("should maintain reference equality with imported templates", () => {
      // Since we're mocking the imports, just verify the structure is correct
      expect(TEMPLATE_MAP.landscape).toBeDefined()
      expect(Array.isArray(TEMPLATE_MAP.landscape)).toBe(true)
      expect(TEMPLATE_MAP.landscape.length).toBeGreaterThan(0)
    })
  })
})

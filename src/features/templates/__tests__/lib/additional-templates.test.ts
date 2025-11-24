import { describe, expect, it } from "vitest"
import { additionalTemplates } from "../../lib/additional-templates"

describe("Additional Templates", () => {
  it("exports 30 additional templates", () => {
    expect(additionalTemplates).toHaveLength(30)
  })

  it("all templates have required fields", () => {
    additionalTemplates.forEach((template) => {
      expect(template.id).toBeDefined()
      expect(template.split).toBeDefined()
      expect(template.screens).toBeGreaterThan(0)
      expect(template.screens).toBeLessThanOrEqual(4) // Additional templates max 4 screens
    })
  })

  describe("3-way split templates", () => {
    const threeWayTemplates = additionalTemplates.filter((t) => t.id.includes("3way"))

    it("exports 9 3-way split templates", () => {
      expect(threeWayTemplates).toHaveLength(9)
    })

    it("all 3-way templates have 3 screens", () => {
      threeWayTemplates.forEach((template) => {
        expect(template.screens).toBe(3)
      })
    })

    it("includes horizontal equal split", () => {
      const horizontal = threeWayTemplates.find((t) => t.id === "split-3way-horizontal-equal-landscape")
      expect(horizontal).toBeDefined()
      expect(horizontal?.split).toBe("horizontal")
      expect(horizontal?.resizable).toBe(true)
    })

    it("includes vertical equal split", () => {
      const vertical = threeWayTemplates.find((t) => t.id === "split-3way-vertical-equal-landscape")
      expect(vertical).toBeDefined()
      expect(vertical?.split).toBe("vertical")
      expect(vertical?.resizable).toBe(true)
    })

    it("includes T-shape layout", () => {
      const tShape = threeWayTemplates.find((t) => t.id === "split-3way-t-shape-landscape")
      expect(tShape).toBeDefined()
      expect(tShape?.split).toBe("custom")
      expect(tShape?.cellLayouts).toHaveLength(3)
    })

    it("includes L-shape layout", () => {
      const lShape = threeWayTemplates.find((t) => t.id === "split-3way-l-shape-landscape")
      expect(lShape).toBeDefined()
      expect(lShape?.split).toBe("custom")
      expect(lShape?.cellLayouts).toHaveLength(3)
    })

    it("all templates have layout transitions", () => {
      threeWayTemplates.forEach((template) => {
        expect(template.layout?.layoutTransition).toBeDefined()
        expect(template.layout?.layoutTransition?.duration).toBe(500)
      })
    })
  })

  describe("Corner overlay templates", () => {
    const cornerTemplates = additionalTemplates.filter((t) => t.id.includes("corner-overlay"))

    it("exports 12 corner overlay templates", () => {
      expect(cornerTemplates).toHaveLength(12)
    })

    it("all corner templates have 2 screens", () => {
      cornerTemplates.forEach((template) => {
        expect(template.screens).toBe(2)
      })
    })

    it("all corner templates use custom split", () => {
      cornerTemplates.forEach((template) => {
        expect(template.split).toBe("custom")
        expect(template.cellLayouts).toHaveLength(2)
      })
    })

    it("main cell always takes full space", () => {
      cornerTemplates.forEach((template) => {
        const mainCell = template.cellLayouts![0]
        expect(mainCell.width).toBe("100%")
        expect(mainCell.height).toBe("100%")
        expect(mainCell.zIndex).toBe(1)
      })
    })

    it("overlay cell has higher z-index", () => {
      cornerTemplates.forEach((template) => {
        const overlayCell = template.cellLayouts![1]
        expect(overlayCell.zIndex).toBe(10)
      })
    })

    it("includes all 4 corner positions for small size", () => {
      const topLeft = cornerTemplates.find((t) => t.id === "corner-overlay-top-left-small-landscape")
      const topRight = cornerTemplates.find((t) => t.id === "corner-overlay-top-right-small-landscape")
      const bottomLeft = cornerTemplates.find((t) => t.id === "corner-overlay-bottom-left-small-landscape")
      const bottomRight = cornerTemplates.find((t) => t.id === "corner-overlay-bottom-right-small-landscape")

      expect(topLeft).toBeDefined()
      expect(topRight).toBeDefined()
      expect(bottomLeft).toBeDefined()
      expect(bottomRight).toBeDefined()

      // Check small size is 20%
      expect(topLeft!.cellLayouts![1].width).toBe("20%")
      expect(topLeft!.cellLayouts![1].height).toBe("20%")
    })

    it("includes medium size overlays", () => {
      const medium = cornerTemplates.find((t) => t.id === "corner-overlay-top-left-medium-landscape")
      expect(medium).toBeDefined()
      expect(medium!.cellLayouts![1].width).toBe("30%")
      expect(medium!.cellLayouts![1].height).toBe("30%")
    })

    it("includes large size overlays for portrait", () => {
      const large = cornerTemplates.find((t) => t.id === "corner-overlay-top-left-large-portrait")
      expect(large).toBeDefined()
      expect(large!.cellLayouts![1].width).toBe("40%")
      expect(large!.cellLayouts![1].height).toBe("30%")
    })

    it("all overlay cells have borders", () => {
      cornerTemplates.forEach((template) => {
        const overlayCell = template.cells![1]
        expect(overlayCell.border).toBeDefined()
        expect(overlayCell.border?.width).toBe("2px")
        expect(overlayCell.border?.radius).toBe("8px")
      })
    })
  })

  describe("Side-by-side proportional templates", () => {
    const sideBySideTemplates = additionalTemplates.filter(
      (t) => t.id.includes("side-by-side") || t.id.includes("top-bottom"),
    )

    it("exports 9 side-by-side templates", () => {
      expect(sideBySideTemplates).toHaveLength(9)
    })

    it("all side-by-side templates have 2 screens", () => {
      sideBySideTemplates.forEach((template) => {
        expect(template.screens).toBe(2)
      })
    })

    it("all templates are resizable", () => {
      sideBySideTemplates.forEach((template) => {
        expect(template.resizable).toBe(true)
      })
    })

    it("includes 60/40 proportion", () => {
      const sbs = sideBySideTemplates.find((t) => t.id === "side-by-side-60-40-landscape")
      expect(sbs).toBeDefined()
      expect(sbs?.split).toBe("vertical")
      expect(sbs?.splitPosition).toBe(60)
    })

    it("includes 70/30 proportion", () => {
      const sbs = sideBySideTemplates.find((t) => t.id === "side-by-side-70-30-landscape")
      expect(sbs).toBeDefined()
      expect(sbs?.splitPosition).toBe(70)
    })

    it("includes 75/25 proportion", () => {
      const sbs = sideBySideTemplates.find((t) => t.id === "side-by-side-75-25-landscape")
      expect(sbs).toBeDefined()
      expect(sbs?.splitPosition).toBe(75)
    })

    it("includes 80/20 proportion", () => {
      const sbs = sideBySideTemplates.find((t) => t.id === "side-by-side-80-20-landscape")
      expect(sbs).toBeDefined()
      expect(sbs?.splitPosition).toBe(80)
    })

    it("includes top-bottom variants for portrait", () => {
      const topBottom60 = sideBySideTemplates.find((t) => t.id === "top-bottom-60-40-portrait")
      const topBottom70 = sideBySideTemplates.find((t) => t.id === "top-bottom-70-30-portrait")

      expect(topBottom60).toBeDefined()
      expect(topBottom60?.split).toBe("horizontal")
      expect(topBottom70).toBeDefined()
      expect(topBottom70?.split).toBe("horizontal")
    })

    it("all templates have thick dividers", () => {
      sideBySideTemplates.forEach((template) => {
        expect(template.dividers?.width).toBe("2px")
      })
    })
  })

  describe("Template IDs", () => {
    it("all template IDs are unique", () => {
      const ids = additionalTemplates.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("all template IDs follow naming convention", () => {
      additionalTemplates.forEach((template) => {
        // IDs should contain either split-3way, corner-overlay, side-by-side, or top-bottom
        const validPrefix =
          template.id.includes("split-3way") ||
          template.id.includes("corner-overlay") ||
          template.id.includes("side-by-side") ||
          template.id.includes("top-bottom")

        expect(validPrefix).toBe(true)
      })
    })
  })
})

import { describe, expect, it } from "vitest"
import { FONT_SIZES, ICON_SIZES, THUMBNAIL_SIZES } from "../../config/preview-config"

describe("Preview Configuration", () => {
  describe("THUMBNAIL_SIZES", () => {
    it("exports correct preview size", () => {
      expect(THUMBNAIL_SIZES.PREVIEW).toBe(80)
    })

    it("exports correct card width (preview + padding)", () => {
      expect(THUMBNAIL_SIZES.CARD_WIDTH).toBe(96)
      // Validates calculation: 80px + 8px padding on each side
      expect(THUMBNAIL_SIZES.CARD_WIDTH).toBe(THUMBNAIL_SIZES.PREVIEW + 16)
    })

    it("exports correct card height (preview + name + spacing)", () => {
      expect(THUMBNAIL_SIZES.CARD_HEIGHT).toBe(120)
      // Validates calculation: 80px + 24px name + 16px spacing
      expect(THUMBNAIL_SIZES.CARD_HEIGHT).toBe(THUMBNAIL_SIZES.PREVIEW + 40)
    })

    it("is immutable (as const)", () => {
      // TypeScript should prevent mutation
      // This is a runtime check that the object is frozen
      expect(() => {
        // @ts-expect-error Testing runtime immutability
        THUMBNAIL_SIZES.PREVIEW = 100
      }).toThrow()
    })
  })

  describe("ICON_SIZES", () => {
    it("exports correct resource icon size", () => {
      expect(ICON_SIZES.RESOURCE_ICON).toBe(32)
    })

    it("exports correct remove button size", () => {
      expect(ICON_SIZES.REMOVE_BUTTON).toBe(12)
    })

    it("is immutable (as const)", () => {
      expect(() => {
        // @ts-expect-error Testing runtime immutability
        ICON_SIZES.RESOURCE_ICON = 40
      }).toThrow()
    })
  })

  describe("FONT_SIZES", () => {
    it("exports correct name font size", () => {
      expect(FONT_SIZES.NAME).toBe(11)
    })

    it("exports correct badge font size", () => {
      expect(FONT_SIZES.BADGE).toBe(10)
    })

    it("is immutable (as const)", () => {
      expect(() => {
        // @ts-expect-error Testing runtime immutability
        FONT_SIZES.NAME = 14
      }).toThrow()
    })
  })

  describe("Configuration relationships", () => {
    it("maintains consistent sizing relationships", () => {
      // Resource icon should fit within preview
      expect(ICON_SIZES.RESOURCE_ICON).toBeLessThan(THUMBNAIL_SIZES.PREVIEW)

      // Remove button should be smaller than resource icon
      expect(ICON_SIZES.REMOVE_BUTTON).toBeLessThan(ICON_SIZES.RESOURCE_ICON)

      // Badge font should be smaller than name font
      expect(FONT_SIZES.BADGE).toBeLessThan(FONT_SIZES.NAME)
    })

    it("ensures readable font sizes", () => {
      // Font sizes should be at least 10px for readability
      expect(FONT_SIZES.NAME).toBeGreaterThanOrEqual(10)
      expect(FONT_SIZES.BADGE).toBeGreaterThanOrEqual(10)
    })
  })
})

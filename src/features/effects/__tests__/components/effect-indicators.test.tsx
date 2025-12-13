/**
 * @vitest-environment jsdom
 */
// @ts-nocheck - TODO: Update to use new unified effects types
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EffectIndicators } from "../../components/effect-indicators"
import type { VideoEffect } from "../../types"

// Mock для react-i18next
const mockT = (key: string) => key

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
}))

describe("EffectIndicators", () => {
  const createMockEffect = (category: string, tags: string[] = []): VideoEffect => ({
    id: "test-effect",
    name: { en: "Test Effect", ru: "Тестовый эффект" },
    description: { en: "Test description", ru: "Тестовое описание" },
    category,
    complexity: "low",
    tags,
    parameters: [],
    version: "1.0.0",
    processingType: "css",
  })

  describe("Category Indicators", () => {
    it("should display CC abbreviation for color-correction category", () => {
      const effect = createMockEffect("color-correction")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("CC")).toBeInTheDocument()
    })

    it("should display ART abbreviation for artistic category", () => {
      const effect = createMockEffect("artistic")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("ART")).toBeInTheDocument()
    })

    it("should display VIN abbreviation for vintage category", () => {
      const effect = createMockEffect("vintage")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("VIN")).toBeInTheDocument()
    })

    it("should display CIN abbreviation for cinematic category", () => {
      const effect = createMockEffect("cinematic")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("CIN")).toBeInTheDocument()
    })

    it("should display CRE abbreviation for creative category", () => {
      const effect = createMockEffect("creative")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("CRE")).toBeInTheDocument()
    })

    it("should display TEC abbreviation for technical category", () => {
      const effect = createMockEffect("technical")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("TEC")).toBeInTheDocument()
    })

    it("should display MOT abbreviation for motion category", () => {
      const effect = createMockEffect("motion")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("MOT")).toBeInTheDocument()
    })

    it("should display DIS abbreviation for distortion category", () => {
      const effect = createMockEffect("distortion")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("DIS")).toBeInTheDocument()
    })

    it("should display EFF abbreviation for unknown category", () => {
      const effect = createMockEffect("unknown-category")
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("EFF")).toBeInTheDocument()
    })
  })

  describe("Tag Indicators", () => {
    it("should display POP tag when effect is popular", () => {
      const effect = createMockEffect("artistic", ["popular"])
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("POP")).toBeInTheDocument()
    })

    it("should display PRO tag when effect is professional", () => {
      const effect = createMockEffect("artistic", ["professional"])
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("PRO")).toBeInTheDocument()
    })

    it("should display EXP tag when effect is experimental", () => {
      const effect = createMockEffect("artistic", ["experimental"])
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("EXP")).toBeInTheDocument()
    })

    it("should display multiple tags when present", () => {
      const effect = createMockEffect("artistic", ["popular", "professional", "experimental"])
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("POP")).toBeInTheDocument()
      expect(screen.getByText("PRO")).toBeInTheDocument()
      expect(screen.getByText("EXP")).toBeInTheDocument()
    })

    it("should not display tags when effect has no special tags", () => {
      const effect = createMockEffect("artistic", [])
      render(<EffectIndicators effect={effect} />)

      expect(screen.queryByText("POP")).not.toBeInTheDocument()
      expect(screen.queryByText("PRO")).not.toBeInTheDocument()
      expect(screen.queryByText("EXP")).not.toBeInTheDocument()
    })

    it("should not display tags when effect has unrecognized tags", () => {
      const effect = createMockEffect("artistic", ["custom-tag", "another-tag"])
      render(<EffectIndicators effect={effect} />)

      expect(screen.queryByText("POP")).not.toBeInTheDocument()
      expect(screen.queryByText("PRO")).not.toBeInTheDocument()
      expect(screen.queryByText("EXP")).not.toBeInTheDocument()
    })
  })

  describe("Size Variants", () => {
    it("should render with small size by default", () => {
      const effect = createMockEffect("artistic", ["popular"])
      const { container } = render(<EffectIndicators effect={effect} />)

      const categoryTag = screen.getByText("ART")
      expect(categoryTag).toHaveClass("text-[9px]")
      expect(categoryTag).toHaveClass("px-1")
      expect(categoryTag).toHaveClass("py-0.5")
    })

    it("should render with medium size when specified", () => {
      const effect = createMockEffect("artistic", ["popular"])
      const { container } = render(<EffectIndicators effect={effect} size="md" />)

      const categoryTag = screen.getByText("ART")
      expect(categoryTag).toHaveClass("text-[10px]")
      expect(categoryTag).toHaveClass("px-1.5")
      expect(categoryTag).toHaveClass("py-0.5")
    })
  })

  describe("Accessibility", () => {
    it("should have title attribute for category with translation key", () => {
      const effect = createMockEffect("color-correction")
      render(<EffectIndicators effect={effect} />)

      const categoryTag = screen.getByText("CC")
      expect(categoryTag).toHaveAttribute("title", "effects.categories.color-correction")
    })

    it("should render with proper semantic HTML", () => {
      const effect = createMockEffect("artistic", ["popular", "professional"])
      const { container } = render(<EffectIndicators effect={effect} />)

      const wrapper = container.querySelector(".flex.items-center")
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe("Backward Compatibility", () => {
    it("should handle effects without tags property", () => {
      const effect = {
        ...createMockEffect("artistic"),
        tags: undefined,
      } as unknown as VideoEffect

      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("ART")).toBeInTheDocument()
      expect(screen.queryByText("POP")).not.toBeInTheDocument()
    })

    it("should handle effects with empty tags array", () => {
      const effect = createMockEffect("artistic", [])
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("ART")).toBeInTheDocument()
      expect(screen.queryByText("POP")).not.toBeInTheDocument()
    })
  })

  describe("Styling", () => {
    it("should render all indicators with proper structure", () => {
      const effect = createMockEffect("artistic", ["popular", "professional"])
      render(<EffectIndicators effect={effect} />)

      const indicators = screen.getAllByText(/ART|POP|PRO/)
      expect(indicators.length).toBe(3)

      // Each indicator should be a valid element
      indicators.forEach((indicator) => {
        expect(indicator).toBeInTheDocument()
      })
    })

    it("should render with different size variants", () => {
      const effect = createMockEffect("artistic", ["popular"])
      const { container: smallContainer } = render(<EffectIndicators effect={effect} size="sm" />)
      const { container: mediumContainer } = render(<EffectIndicators effect={effect} size="md" />)

      // Both should render successfully
      expect(smallContainer.querySelector(".flex.items-center")).toBeInTheDocument()
      expect(mediumContainer.querySelector(".flex.items-center")).toBeInTheDocument()
    })
  })
})

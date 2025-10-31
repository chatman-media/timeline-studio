import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EffectIndicators } from "../../components/effect-indicators"

import type { VideoEffect } from "../../types"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

describe("EffectIndicators", () => {
  const baseEffect: VideoEffect = {
    id: "test-effect",
    name: {
      en: "Test Effect",
      ru: "Тестовый эффект",
    },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    complexity: "medium",
    gpuAccelerated: false,
    parameters: [],
    presets: [],
    processors: {},
    tags: ["popular"],
    description: { ru: "Тестовый эффект", en: "Test Effect" },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Рендеринг компонента", () => {
    it("должен отображать индикатор категории", () => {
      render(<EffectIndicators effect={baseEffect} />)

      expect(screen.getByText("ART")).toBeInTheDocument()
    })

    it("должен отображать индикатор popular тега", () => {
      render(<EffectIndicators effect={baseEffect} />)

      expect(screen.getByText("POP")).toBeInTheDocument()
    })

    it("должен использовать правильные размеры для size='sm'", () => {
      render(<EffectIndicators effect={baseEffect} size="sm" />)

      const container = screen.getByText("ART").closest("div")
      expect(container).toHaveClass("text-[9px]", "px-1", "py-0.5")
    })

    it("должен использовать правильные размеры для size='md'", () => {
      render(<EffectIndicators effect={baseEffect} size="md" />)

      const container = screen.getByText("ART").closest("div")
      expect(container).toHaveClass("text-[10px]", "px-1.5", "py-0.5")
    })

    it("должен использовать size='sm' по умолчанию", () => {
      render(<EffectIndicators effect={baseEffect} />)

      const container = screen.getByText("ART").closest("div")
      expect(container).toHaveClass("text-[9px]")
    })
  })

  describe("Аббревиатуры категорий", () => {
    it("должен отображать CC для color-correction", () => {
      const effect = { ...baseEffect, category: "color-correction" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("CC")).toBeInTheDocument()
    })

    it("должен отображать ART для artistic", () => {
      const effect = { ...baseEffect, category: "artistic" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("ART")).toBeInTheDocument()
    })

    it("должен отображать VIN для vintage", () => {
      const effect = { ...baseEffect, category: "vintage" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("VIN")).toBeInTheDocument()
    })

    it("должен отображать CIN для cinematic", () => {
      const effect = { ...baseEffect, category: "cinematic" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("CIN")).toBeInTheDocument()
    })

    it("должен отображать CRE для creative", () => {
      const effect = { ...baseEffect, category: "creative" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("CRE")).toBeInTheDocument()
    })

    it("должен отображать TEC для technical", () => {
      const effect = { ...baseEffect, category: "technical" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("TEC")).toBeInTheDocument()
    })

    it("должен отображать MOT для motion", () => {
      const effect = { ...baseEffect, category: "motion" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("MOT")).toBeInTheDocument()
    })

    it("должен отображать DIS для distortion", () => {
      const effect = { ...baseEffect, category: "distortion" }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("DIS")).toBeInTheDocument()
    })

    it("должен отображать EFF для неизвестной категории", () => {
      const effect = { ...baseEffect, category: "unknown" as any }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("EFF")).toBeInTheDocument()
    })
  })

  describe("Индикаторы тегов", () => {
    it("должен отображать POP для popular тега", () => {
      const effect = { ...baseEffect, tags: ["popular"] }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("POP")).toBeInTheDocument()
    })

    it("должен отображать PRO для professional тега", () => {
      const effect = { ...baseEffect, tags: ["professional"] }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("PRO")).toBeInTheDocument()
    })

    it("должен отображать EXP для experimental тега", () => {
      const effect = { ...baseEffect, tags: ["experimental"] }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("EXP")).toBeInTheDocument()
    })

    it("должен отображать несколько тегов одновременно", () => {
      const effect = { ...baseEffect, tags: ["popular", "professional", "experimental"] }
      render(<EffectIndicators effect={effect} />)

      expect(screen.getByText("POP")).toBeInTheDocument()
      expect(screen.getByText("PRO")).toBeInTheDocument()
      expect(screen.getByText("EXP")).toBeInTheDocument()
    })

    it("не должен отображать индикаторы для неподдерживаемых тегов", () => {
      const effect = { ...baseEffect, tags: ["some-other-tag"] }
      render(<EffectIndicators effect={effect} />)

      expect(screen.queryByText("POP")).not.toBeInTheDocument()
      expect(screen.queryByText("PRO")).not.toBeInTheDocument()
      expect(screen.queryByText("EXP")).not.toBeInTheDocument()
    })

    it("должен работать с пустым массивом тегов", () => {
      const effect = { ...baseEffect, tags: [] }
      render(<EffectIndicators effect={effect} />)

      // Только категория должна отображаться
      expect(screen.getByText("ART")).toBeInTheDocument()
      expect(screen.queryByText("POP")).not.toBeInTheDocument()
    })

    it("должен работать с undefined тегами", () => {
      const effect = { ...baseEffect, tags: undefined as any }
      render(<EffectIndicators effect={effect} />)

      // Только категория должна отображаться
      expect(screen.getByText("ART")).toBeInTheDocument()
      expect(screen.queryByText("POP")).not.toBeInTheDocument()
    })
  })

  describe("CSS классы и стили", () => {
    it("должен применять правильные CSS классы для контейнера", () => {
      render(<EffectIndicators effect={baseEffect} size="sm" />)

      const container = screen.getByText("ART").closest("div")?.parentElement
      expect(container).toHaveClass("flex", "items-center", "gap-1")
    })

    it("должен использовать gap-1.5 для size='md'", () => {
      render(<EffectIndicators effect={baseEffect} size="md" />)

      const container = screen.getByText("ART").closest("div")?.parentElement
      expect(container).toHaveClass("gap-1.5")
    })

    it("должен применять правильные стили к индикаторам", () => {
      render(<EffectIndicators effect={baseEffect} />)

      const categoryIndicator = screen.getByText("ART").closest("div")
      expect(categoryIndicator).toHaveClass("bg-black/70", "text-white", "font-medium", "rounded-xs")
    })

    it("должен добавлять title атрибут к индикатору категории", () => {
      render(<EffectIndicators effect={baseEffect} />)

      const categoryIndicator = screen.getByText("ART").closest("div")
      expect(categoryIndicator).toHaveAttribute("title", "effects.categories.artistic")
    })
  })

  describe("Обратная совместимость", () => {
    it("должен работать с эффектом без тегов", () => {
      const effect = { ...baseEffect }
      ;(effect as any).tags = undefined

      expect(() => {
        render(<EffectIndicators effect={effect} />)
      }).not.toThrow()

      expect(screen.getByText("ART")).toBeInTheDocument()
    })

    it("должен обрабатывать null теги", () => {
      const effect = { ...baseEffect, tags: null as any }

      expect(() => {
        render(<EffectIndicators effect={effect} />)
      }).not.toThrow()

      expect(screen.getByText("ART")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("должен предоставлять понятные title атрибуты", () => {
      render(<EffectIndicators effect={baseEffect} />)

      const categoryIndicator = screen.getByText("ART").closest("div")
      expect(categoryIndicator).toHaveAttribute("title")
    })

    it("должен использовать семантически правильную структуру", () => {
      render(<EffectIndicators effect={baseEffect} />)

      const container = screen.getByText("ART").closest("div")?.parentElement
      expect(container?.tagName).toBe("DIV")
      expect(container).toHaveClass("flex")
    })
  })

  describe("Интеграционные тесты", () => {
    it("должен корректно работать с реальными данными эффекта", () => {
      const realEffect: VideoEffect = {
        id: "vintage-film",
        name: "Vintage Film",
        type: "vintage",
        category: "vintage",
        complexity: "intermediate",
        tags: ["popular", "professional"],
        description: { ru: "Винтажная пленка", en: "Vintage Film" },
        labels: { ru: "Винтажная пленка", en: "Vintage Film" },
        params: { intensity: 0.8 },
        ffmpegCommand: () => "vintage",
        previewPath: "/vintage.mp4",
        duration: 1000,
      }

      render(<EffectIndicators effect={realEffect} />)

      expect(screen.getByText("VIN")).toBeInTheDocument()
      expect(screen.getByText("POP")).toBeInTheDocument()
      expect(screen.getByText("PRO")).toBeInTheDocument()
    })

    it("должен работать с минимальными данными эффекта", () => {
      const minimalEffect: VideoEffect = {
        id: "minimal",
        name: "Minimal",
        type: "blur",
        category: "artistic",
        complexity: "basic",
        tags: [],
        description: { ru: "Минимальный", en: "Minimal" },
        labels: { ru: "Минимальный", en: "Minimal" },
        params: {},
        ffmpegCommand: () => "minimal",
        previewPath: "/minimal.mp4",
        duration: 0,
      }

      render(<EffectIndicators effect={minimalEffect} />)

      expect(screen.getByText("ART")).toBeInTheDocument()
      expect(screen.queryByText("POP")).not.toBeInTheDocument()
    })
  })

  describe("Производительность", () => {
    it("должен эффективно рендерить большое количество индикаторов", () => {
      const effect = {
        ...baseEffect,
        tags: ["popular", "professional", "experimental"],
      }

      const startTime = performance.now()
      render(<EffectIndicators effect={effect} />)
      const endTime = performance.now()

      // Рендер должен завершиться быстро
      expect(endTime - startTime).toBeLessThan(50)
    })

    it("должен правильно обрабатывать частые перерендеры", () => {
      const { rerender } = render(<EffectIndicators effect={baseEffect} />)

      for (let i = 0; i < 10; i++) {
        const updatedEffect = { ...baseEffect, id: `effect-${i}` }
        rerender(<EffectIndicators effect={updatedEffect} />)
      }

      expect(screen.getByText("ART")).toBeInTheDocument()
    })
  })
})

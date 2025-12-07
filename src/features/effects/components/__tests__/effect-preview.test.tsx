import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BaseEffect } from "../../types"
import { EffectPreview } from "../effect-preview"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ru" },
  }),
}))

// Мокаем все зависимости
vi.mock("@/features", () => ({
  ApplyButton: ({ children, ...props }: any) => (
    <button data-testid="apply-button" {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: (props: any) => <button data-testid="add-media-button" {...props} />,
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: (props: any) => <button data-testid="favorite-button" {...props} />,
}))

vi.mock("@/domains/video-editing/providers", () => ({
  useResources: () => ({
    isEffectAdded: vi.fn(() => false),
  }),
}))

vi.mock("@/features/video-player", () => ({
  usePlayer: () => ({
    applyEffect: vi.fn(),
  }),
  useVideoSelection: () => ({
    getCurrentVideo: vi.fn(),
  }),
}))

vi.mock("../effect-indicators", () => ({
  EffectIndicators: (props: any) => <div data-testid="effect-indicators" {...props} />,
}))

vi.mock("../../utils/css-effects", () => ({
  generateCSSFilterForEffect: vi.fn(() => "blur(2px)"),
  getPlaybackRate: vi.fn(() => 1),
}))

vi.mock("../../utils/effect-previews", () => ({
  getEffectPreview: vi.fn(() => ({
    videoPath: "/test-video.mp4",
  })),
}))

describe("EffectPreview", () => {
  const mockEffect: BaseEffect = {
    id: "test-effect",
    name: {
      en: "Test Effect",
      ru: "Тестовый эффект",
    },
    description: {
      en: "Test description",
      ru: "Тестовое описание",
    },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["test"],
    complexity: "low",
    gpuAccelerated: true,
    parameters: [
      {
        id: "intensity",
        name: { en: "Intensity", ru: "Интенсивность" },
        type: "number",
        defaultValue: 0.5,
        min: 0,
        max: 1,
      },
    ],
    presets: [],
    processors: {
      css: {
        filter: (params: Record<string, any>) => `blur(${params.intensity * 10}px)`,
      },
    },
  }

  const mockProps = {
    effect: mockEffect,
    onClick: vi.fn(),
    size: 150,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Рендеринг", () => {
    it("должен отображать превью эффекта", () => {
      render(<EffectPreview {...mockProps} />)

      // Проверяем, что компонент отрендерился (только название, placeholder не показывается когда есть videoSrc)
      expect(screen.getByText("Тестовый эффект")).toBeInTheDocument()
    })

    it("должен отображать название на правильном языке", () => {
      render(<EffectPreview {...mockProps} />)

      // Проверяем русское название в заголовке
      const title = document.querySelector(".mt-1.text-xs.text-center")
      expect(title).toHaveTextContent("Тестовый эффект")
    })

    it("должен показывать название эффекта", () => {
      render(<EffectPreview {...mockProps} />)

      // Проверяем, что название отображается (placeholder показывается только без videoSrc)
      const title = document.querySelector(".mt-1.text-xs.text-center")
      expect(title).toHaveTextContent("Тестовый эффект")
    })

    it("должен отображать индикатор сложности", () => {
      render(<EffectPreview {...mockProps} />)

      // Проверяем, что есть цветовой индикатор сложности
      const complexityIndicator = document.querySelector(".bg-green-500")
      expect(complexityIndicator).toBeInTheDocument()
    })

    it("должен отображать индикаторы эффекта", () => {
      render(<EffectPreview {...mockProps} />)

      expect(screen.getByTestId("effect-indicators")).toBeInTheDocument()
    })
  })

  describe("Взаимодействие", () => {
    it("должен вызывать onClick при клике", () => {
      const onClick = vi.fn()
      render(<EffectPreview {...mockProps} onClick={onClick} />)

      // Кликаем на превью
      const preview = document.querySelector(".cursor-pointer")
      if (preview && "click" in preview && typeof preview.click === "function") {
        preview.click()
      }

      expect(onClick).toHaveBeenCalled()
    })
  })

  describe("Кастомные параметры", () => {
    it("должен применять кастомные параметры", () => {
      const customParams = { intensity: 0.8 }
      render(<EffectPreview {...mockProps} customParams={customParams} />)

      // Компонент должен отрендериться с кастомными параметрами
      expect(screen.getByText("Тестовый эффект")).toBeInTheDocument()
    })

    it("должен использовать кастомные размеры", () => {
      render(<EffectPreview {...mockProps} width={200} height={120} />)

      // Проверяем, что контейнер имеет правильные размеры
      const container = document.querySelector('[style*="width: 200px"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe("Обработка эффектов без полных данных", () => {
    it("должен обрабатывать эффект с минимальными данными", () => {
      const minimalEffect: BaseEffect = {
        id: "minimal",
        name: { en: "Minimal", ru: "Минимальный" },
        category: "blur_sharpen",
        scope: ["clip"],
        processingType: "realtime",
        version: "1.0.0",
        tags: [],
        complexity: "low",
        gpuAccelerated: false,
        parameters: [],
        presets: [],
        processors: {},
      }

      render(<EffectPreview {...mockProps} effect={minimalEffect} />)

      expect(screen.getByText("Минимальный")).toBeInTheDocument()
    })
  })
})

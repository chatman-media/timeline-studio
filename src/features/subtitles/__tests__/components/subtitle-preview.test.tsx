/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest"

import { fireEvent, renderWithBrowser as render, screen } from "@/test/test-utils"

import { SubtitlePreview } from "../../components/subtitle-preview"
import type { SubtitleStyleTemplate } from "../../types/subtitles"

// Мокаем дополнительные зависимости
vi.mock("@/features/browser", () => ({
  ApplyButton: () => <button data-oid="nbo5ds9">Применить</button>,
}))

vi.mock("@/features/browser/components/layout/apply-button", () => ({
  ApplyButton: () => <button data-oid="wehh8-u">Применить</button>,
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: () => <button data-oid="3oby.px">Добавить</button>,
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: () => <button data-oid="h3llir6">Избранное</button>,
}))

vi.mock("@/domains/video-editing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/video-editing")>()
  return {
    ...actual,
    useResources: () => ({
      addSubtitle: vi.fn(),
      isSubtitleAdded: vi.fn(() => false),
      removeResource: vi.fn(),
      subtitleResources: [],
    }),
  }
})

const mockSubtitle: SubtitleStyleTemplate = {
  id: "basic-white",
  name: "Basic White",
  category: "basic",
  complexity: "basic",
  tags: ["simple", "clean"],
  description: {
    en: "Simple white subtitles",
    ru: "Простые белые субтитры",
  },
  labels: {
    en: "Basic White",
    ru: "Базовый белый",
  },
  style: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Arial",
    fontWeight: "normal",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: "10px",
  },
}

describe("SubtitlePreview", () => {
  const defaultProps = {
    style: mockSubtitle,
    onClick: vi.fn(),
    size: 100,
    previewWidth: 150,
    previewHeight: 80,
  }

  it("должен рендериться без ошибок", () => {
    render(<SubtitlePreview {...defaultProps} data-oid="e6nokog" />)
    expect(screen.getByText("Базовый белый")).toBeInTheDocument()
  })

  it("должен отображать превью текста со стилями", () => {
    render(<SubtitlePreview {...defaultProps} data-oid="-2jbg2w" />)

    // Ищем элемент с примером текста
    const preview = screen.getByText("Timeline Studio")
    expect(preview).toBeInTheDocument()

    // Проверяем что стили применены
    const styles = getComputedStyle(preview)
    expect(styles.color).toBe("rgb(255, 255, 255)")
    expect(styles.fontFamily).toContain("Arial")
  })

  it("должен отображать название субтитра", () => {
    render(<SubtitlePreview {...defaultProps} data-oid="rjeol:7" />)
    expect(screen.getByText("Базовый белый")).toBeInTheDocument()
  })

  it("должен отображать индикатор категории", () => {
    render(<SubtitlePreview {...defaultProps} data-oid="_muee9r" />)
    expect(screen.getByText("BAS")).toBeInTheDocument()
  })

  it("должен отображать индикатор анимации", () => {
    const animatedSubtitle: SubtitleStyleTemplate = {
      ...mockSubtitle,
      style: {
        ...mockSubtitle.style,
        animation: "fadeIn 1s ease-in-out",
      },
    }

    render(<SubtitlePreview {...defaultProps} style={animatedSubtitle} data-oid="_j_j.2g" />)
    expect(screen.getByText("ANI")).toBeInTheDocument()
  })

  it("должен вызывать onClick при клике", () => {
    const onClick = vi.fn()
    render(<SubtitlePreview {...defaultProps} onClick={onClick} data-oid="g4ai_z_" />)

    // Кликаем на контейнер превью
    const previewElement = screen.getByText("Timeline Studio").closest(".cursor-pointer")
    if (previewElement) {
      fireEvent.click(previewElement)
      expect(onClick).toHaveBeenCalled()
    }
  })

  it("должен применять градиент для текста если указан", () => {
    const gradientSubtitle: SubtitleStyleTemplate = {
      ...mockSubtitle,
      style: {
        ...mockSubtitle.style,
        background: "linear-gradient(45deg, #FF0000, #00FF00)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      },
    }

    render(<SubtitlePreview {...defaultProps} style={gradientSubtitle} data-oid="h0f6aob" />)
    const preview = screen.getByText("Timeline Studio")
    const styles = getComputedStyle(preview)
    expect(styles.backgroundImage || styles.background).toContain("linear-gradient")
  })

  it("должен применять тень текста если указана", () => {
    const shadowSubtitle: SubtitleStyleTemplate = {
      ...mockSubtitle,
      style: {
        ...mockSubtitle.style,
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      },
    }

    render(<SubtitlePreview {...defaultProps} style={shadowSubtitle} data-oid="2uop.6v" />)
    const preview = screen.getByText("Timeline Studio")
    const styles = getComputedStyle(preview)
    expect(styles.textShadow).toBe("2px 2px 4px rgba(0,0,0,0.8)")
  })

  it("должен применять анимацию если указана", () => {
    const animatedSubtitle: SubtitleStyleTemplate = {
      ...mockSubtitle,
      style: {
        ...mockSubtitle.style,
        animation: "fadeIn 1s ease-in-out",
      },
    }

    render(<SubtitlePreview {...defaultProps} style={animatedSubtitle} data-oid="flbu44l" />)
    const preview = screen.getByText("Timeline Studio")
    const styles = getComputedStyle(preview)
    expect(styles.animation || styles.animationName).toContain("fadeIn")
  })

  it("должен корректно отображать размеры превью", () => {
    render(<SubtitlePreview {...defaultProps} size={120} previewWidth={180} previewHeight={100} data-oid="_x5:nc_" />)

    const container = screen.getByText("Timeline Studio").closest(".cursor-pointer")
    expect(container).toHaveStyle({ width: "180px", height: "100px" })
  })

  it("должен отображать кнопку добавления", () => {
    render(<SubtitlePreview {...defaultProps} data-oid="xfjzamj" />)
    expect(screen.getByText(/добавить/i)).toBeInTheDocument()
  })

  it("должен отображать кнопку избранного", () => {
    render(<SubtitlePreview {...defaultProps} data-oid="uwxtcd2" />)
    expect(screen.getByText(/избранное/i)).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from "vitest"

import { fireEvent, renderWithMedia as render, screen } from "@/test/test-utils"

import { SubtitlePreview } from "../../components/subtitle-preview"
import type { SubtitleStyleTemplate } from "../../types/subtitles"

// Мокаем дополнительные зависимости
vi.mock("@/features/browser", () => ({
  ApplyButton: () => <button>Применить</button>,
}))

vi.mock("@/features/browser/components/layout/apply-button", () => ({
  ApplyButton: () => <button>Применить</button>,
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: () => <button>Добавить</button>,
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: () => <button>Избранное</button>,
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
    render(<SubtitlePreview {...defaultProps} />)
    expect(screen.getByText("Базовый белый")).toBeInTheDocument()
  })

  it("должен отображать превью текста со стилями", () => {
    render(<SubtitlePreview {...defaultProps} />)

    // Ищем элемент с примером текста
    const preview = screen.getByText("Timeline Studio")
    expect(preview).toBeInTheDocument()

    // Проверяем что стили применены
    const styles = getComputedStyle(preview)
    expect(styles.color).toBe("rgb(255, 255, 255)")
    expect(styles.fontFamily).toContain("Arial")
  })

  it("должен отображать название субтитра", () => {
    render(<SubtitlePreview {...defaultProps} />)
    expect(screen.getByText("Базовый белый")).toBeInTheDocument()
  })

  it("должен отображать индикатор категории", () => {
    render(<SubtitlePreview {...defaultProps} />)
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

    render(<SubtitlePreview {...defaultProps} style={animatedSubtitle} />)
    expect(screen.getByText("ANI")).toBeInTheDocument()
  })

  it("должен вызывать onClick при клике", () => {
    const onClick = vi.fn()
    render(<SubtitlePreview {...defaultProps} onClick={onClick} />)

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

    render(<SubtitlePreview {...defaultProps} style={gradientSubtitle} />)
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

    render(<SubtitlePreview {...defaultProps} style={shadowSubtitle} />)
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

    render(<SubtitlePreview {...defaultProps} style={animatedSubtitle} />)
    const preview = screen.getByText("Timeline Studio")
    const styles = getComputedStyle(preview)
    expect(styles.animation || styles.animationName).toContain("fadeIn")
  })

  it("должен корректно отображать размеры превью", () => {
    render(<SubtitlePreview {...defaultProps} size={120} previewWidth={180} previewHeight={100} />)

    const container = screen.getByText("Timeline Studio").closest(".cursor-pointer")
    expect(container).toHaveStyle({ width: "180px", height: "100px" })
  })

  it("должен отображать кнопку добавления", () => {
    render(<SubtitlePreview {...defaultProps} />)
    expect(screen.getByText(/добавить/i)).toBeInTheDocument()
  })

  it("должен отображать кнопку избранного", () => {
    render(<SubtitlePreview {...defaultProps} />)
    expect(screen.getByText(/избранное/i)).toBeInTheDocument()
  })
})

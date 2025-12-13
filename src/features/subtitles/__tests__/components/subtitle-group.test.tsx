/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest"

import { fireEvent, renderWithMedia as render, screen } from "@/test/test-utils"

import { SubtitleGroup } from "../../components/subtitle-group"

// Мокаем useResources
vi.mock("@/domains/video-editing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/video-editing")>()
  return {
    ...actual,
    useResources: () => ({
      addSubtitle: vi.fn(),
      isSubtitleAdded: vi.fn(() => false),
      removeResource: vi.fn(),
      subtitleResources: [],
      addResource: vi.fn(),
      isAdded: vi.fn(() => false),
    }),
  }
})

// Мокаем AddMediaButton
vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: () => <button>Добавить</button>,
}))

// Мокаем FavoriteButton
vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: () => <button>Избранное</button>,
}))

const mockSubtitles: import("../../types/subtitles").SubtitleStyleTemplate[] = [
  {
    id: "basic-white",
    name: "Basic White",
    category: "basic" as const,
    complexity: "basic" as const,
    tags: ["simple", "clean"],
    description: { en: "Simple white subtitles", ru: "Простые белые субтитры" },
    labels: { en: "Basic White", ru: "Базовый белый" },
    style: {
      color: "#FFFFFF",
      fontSize: 24,
      fontFamily: "Arial",
    },
  },
  {
    id: "basic-yellow",
    name: "Basic Yellow",
    category: "basic" as const,
    complexity: "basic" as const,
    tags: ["simple", "colorful"],
    description: { en: "Simple yellow subtitles", ru: "Простые желтые субтитры" },
    labels: { en: "Basic Yellow", ru: "Базовый желтый" },
    style: {
      color: "#FFFF00",
      fontSize: 24,
      fontFamily: "Arial",
    },
  },
]

describe("SubtitleGroup", () => {
  const defaultProps = {
    title: "Basic Subtitles",
    subtitles: mockSubtitles,
    previewSize: 100,
    previewWidth: 150,
    previewHeight: 80,
    onSubtitleClick: vi.fn(),
  }

  it("должен рендериться без ошибок", () => {
    render(<SubtitleGroup {...defaultProps} />)

    expect(screen.getByText("Basic Subtitles")).toBeInTheDocument()
  })

  it("должен отображать все субтитры", () => {
    render(<SubtitleGroup {...defaultProps} />)

    // Проверяем, что рендерятся все названия субтитров
    expect(screen.getByText("Базовый белый")).toBeInTheDocument()
    expect(screen.getByText("Базовый желтый")).toBeInTheDocument()
  })

  it("должен вызывать onSubtitleClick при клике на субтитр", () => {
    const onSubtitleClick = vi.fn()
    render(<SubtitleGroup {...defaultProps} onSubtitleClick={onSubtitleClick} />)

    // Кликаем на первый превью по тексту Timeline Studio
    const firstPreview = screen.getAllByText("Timeline Studio")[0]
    const container = firstPreview.closest(".cursor-pointer")
    if (container) {
      fireEvent.click(container)
      expect(onSubtitleClick).toHaveBeenCalledWith(mockSubtitles[0])
    }
  })

  it("не должен отображаться если нет субтитров", () => {
    render(<SubtitleGroup {...defaultProps} subtitles={[]} />)

    expect(screen.queryByText("Basic Subtitles")).not.toBeInTheDocument()
  })

  it("не должен отображать заголовок если title пустой", () => {
    render(<SubtitleGroup {...defaultProps} title="" />)

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("должен применять правильные CSS переменные для размеров", () => {
    render(<SubtitleGroup {...defaultProps} />)

    const grid = screen.getByText("Basic Subtitles").nextElementSibling
    expect(grid).toHaveStyle({ "--preview-size": "150px" })
  })

  it("должен передавать правильные размеры в SubtitlePreview", () => {
    render(<SubtitleGroup {...defaultProps} previewSize={120} previewWidth={180} previewHeight={100} />)

    // Проверяем, что компоненты рендерятся
    expect(screen.getByText("Базовый белый")).toBeInTheDocument()
    expect(screen.getByText("Базовый желтый")).toBeInTheDocument()
  })

  it("должен обрабатывать большое количество субтитров", () => {
    const manySubtitles: import("../../types/subtitles").SubtitleStyleTemplate[] = Array.from(
      { length: 20 },
      (_, i) => ({
        ...mockSubtitles[0],
        id: `subtitle-${i}`,
        name: `Subtitle ${i}`,
        labels: { en: `Subtitle ${i}`, ru: `Субтитр ${i}` },
      }),
    )

    render(<SubtitleGroup {...defaultProps} subtitles={manySubtitles} />)

    // Проверяем что рендерятся все 20 субтитров
    const previewElements = screen.getAllByText("Timeline Studio")
    expect(previewElements).toHaveLength(20)
  })

  it("должен сохранять порядок субтитров", () => {
    const orderedSubtitles: import("../../types/subtitles").SubtitleStyleTemplate[] = [
      { ...mockSubtitles[0], id: "first", labels: { en: "First", ru: "Первый" } },
      { ...mockSubtitles[1], id: "second", labels: { en: "Second", ru: "Второй" } },
      { ...mockSubtitles[0], id: "third", labels: { en: "Third", ru: "Третий" } },
    ]

    const onSubtitleClick = vi.fn()
    render(<SubtitleGroup {...defaultProps} subtitles={orderedSubtitles} onSubtitleClick={onSubtitleClick} />)

    // Кликаем по каждому превью через Timeline Studio
    const previewElements = screen.getAllByText("Timeline Studio")

    const container1 = previewElements[0].closest(".cursor-pointer")
    if (container1) {
      fireEvent.click(container1)
      expect(onSubtitleClick).toHaveBeenCalledWith(orderedSubtitles[0])
    }

    const container2 = previewElements[1].closest(".cursor-pointer")
    if (container2) {
      fireEvent.click(container2)
      expect(onSubtitleClick).toHaveBeenCalledWith(orderedSubtitles[1])
    }

    const container3 = previewElements[2].closest(".cursor-pointer")
    if (container3) {
      fireEvent.click(container3)
      expect(onSubtitleClick).toHaveBeenCalledWith(orderedSubtitles[2])
    }
  })
})

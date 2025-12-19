/**
 * @vitest-environment jsdom
 */
import { act } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { VideoFilter } from "@/features/filters/types/filters"
import { renderWithBase, screen } from "@/test/test-utils"

import { FilterGroup } from "../../components/filter-group"

// Мокаем FilterPreview компонент
vi.mock("../../components/filter-preview", () => ({
  FilterPreview: ({ filter, onClick, size, previewWidth, previewHeight }: any) => (
    <button
      data-testid={`filter-preview-${filter.id}`}
      data-size={size}
      data-width={previewWidth}
      data-height={previewHeight}
      onClick={onClick}
      type="button"
      data-oid="w7v9d_i"
    >
      {filter.name}
    </button>
  ),
}))

describe("FilterGroup", () => {
  const mockFilters: VideoFilter[] = [
    {
      id: "brightness-1",
      name: "Brightness Filter",
      category: "color-correction",
      complexity: "basic",
      tags: ["professional", "standard"],
      description: {
        ru: "Фильтр яркости",
        en: "Brightness filter",
      },
      labels: {
        ru: "Яркость",
        en: "Brightness",
      },
      params: {
        brightness: 0.2,
        contrast: 1.1,
      },
    },
    {
      id: "contrast-1",
      name: "Contrast Filter",
      category: "color-correction",
      complexity: "intermediate",
      tags: ["professional", "standard"],
      description: {
        ru: "Фильтр контрастности",
        en: "Contrast filter",
      },
      labels: {
        ru: "Контраст",
        en: "Contrast",
      },
      params: { contrast: 1.5 },
    },
  ]

  const defaultProps = {
    title: "Color Correction",
    filters: mockFilters,
    previewSize: 2,
    previewWidth: 120,
    previewHeight: 80,
    onFilterClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен корректно рендериться с фильтрами", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="s47ojag" />)

    // Проверяем заголовок группы
    expect(screen.getByText("Color Correction")).toBeInTheDocument()

    // Проверяем наличие фильтров
    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-contrast-1")).toBeInTheDocument()
  })

  it("должен отображать правильное количество фильтров", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="-qe64fn" />)

    const filterPreviews = screen.getAllByRole("button")
    expect(filterPreviews).toHaveLength(2)
  })

  it("должен передавать правильные пропсы в FilterPreview", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="otww9.r" />)

    const brightnessPreview = screen.getByTestId("filter-preview-brightness-1")
    expect(brightnessPreview).toHaveAttribute("data-size", "2")
    expect(brightnessPreview).toHaveAttribute("data-width", "120")
    expect(brightnessPreview).toHaveAttribute("data-height", "80")

    const contrastPreview = screen.getByTestId("filter-preview-contrast-1")
    expect(contrastPreview).toHaveAttribute("data-size", "2")
    expect(contrastPreview).toHaveAttribute("data-width", "120")
    expect(contrastPreview).toHaveAttribute("data-height", "80")
  })

  it("должен вызывать onFilterClick при клике на фильтр", () => {
    const mockOnFilterClick = vi.fn()
    renderWithBase(<FilterGroup {...defaultProps} onFilterClick={mockOnFilterClick} data-oid="1o-ol8x" />)

    const brightnessPreview = screen.getByTestId("filter-preview-brightness-1")
    act(() => {
      act(() => {
        brightnessPreview.click()
      })
    })

    expect(mockOnFilterClick).toHaveBeenCalledWith(mockFilters[0])
  })

  it("должен вызывать onFilterClick для разных фильтров", () => {
    const mockOnFilterClick = vi.fn()
    renderWithBase(<FilterGroup {...defaultProps} onFilterClick={mockOnFilterClick} data-oid="lq5cj41" />)

    // Кликаем на первый фильтр
    const brightnessPreview = screen.getByTestId("filter-preview-brightness-1")
    act(() => {
      act(() => {
        brightnessPreview.click()
      })
    })

    // Кликаем на второй фильтр
    const contrastPreview = screen.getByTestId("filter-preview-contrast-1")
    act(() => {
      act(() => {
        contrastPreview.click()
      })
    })

    expect(mockOnFilterClick).toHaveBeenCalledTimes(2)
    expect(mockOnFilterClick).toHaveBeenNthCalledWith(1, mockFilters[0])
    expect(mockOnFilterClick).toHaveBeenNthCalledWith(2, mockFilters[1])
  })

  it("не должен рендериться если нет фильтров", () => {
    renderWithBase(<FilterGroup {...defaultProps} filters={[]} data-oid="39su.5o" />)

    // Проверяем, что нет заголовка группы
    expect(screen.queryByText("Color Correction")).not.toBeInTheDocument()

    // Проверяем, что нет фильтров
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("должен рендериться без заголовка если title пустой", () => {
    renderWithBase(<FilterGroup {...defaultProps} title="" data-oid="uyk5.w_" />)

    // Заголовка не должно быть
    expect(screen.queryByText("Color Correction")).not.toBeInTheDocument()

    // Но фильтры должны быть
    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.getByTestId("filter-preview-contrast-1")).toBeInTheDocument()
  })

  it("должен применять правильные CSS классы для сетки", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="mcmz-9." />)

    const gridContainer = screen.getByTestId("filter-preview-brightness-1").parentElement
    expect(gridContainer).toHaveClass("grid")
    expect(gridContainer).toHaveClass("gap-2")
    expect(gridContainer).toHaveClass("grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))]")
  })

  it("должен устанавливать правильную CSS переменную для размера превью", () => {
    renderWithBase(<FilterGroup {...defaultProps} previewWidth={150} data-oid="0892zi0" />)

    const gridContainer = screen.getByTestId("filter-preview-brightness-1").parentElement
    expect(gridContainer).toHaveStyle({ "--preview-size": "150px" })
  })

  it("должен обрабатывать изменение размеров превью", () => {
    const { rerender } = renderWithBase(<FilterGroup {...defaultProps} data-oid="gqv64.o" />)

    // Проверяем начальные размеры
    let brightnessPreview = screen.getByTestId("filter-preview-brightness-1")
    expect(brightnessPreview).toHaveAttribute("data-width", "120")
    expect(brightnessPreview).toHaveAttribute("data-height", "80")

    // Изменяем размеры
    act(() => {
      rerender(
        <FilterGroup {...defaultProps} previewWidth={200} previewHeight={150} previewSize={3} data-oid="n:_dk2s" />,
      )
    })

    brightnessPreview = screen.getByTestId("filter-preview-brightness-1")
    expect(brightnessPreview).toHaveAttribute("data-width", "200")
    expect(brightnessPreview).toHaveAttribute("data-height", "150")
    expect(brightnessPreview).toHaveAttribute("data-size", "3")
  })

  it("должен отображать правильные имена фильтров", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="l2vqj-5" />)

    expect(screen.getByText("Brightness Filter")).toBeInTheDocument()
    expect(screen.getByText("Contrast Filter")).toBeInTheDocument()
  })

  it("должен обрабатывать один фильтр", () => {
    const singleFilter = [mockFilters[0]]
    renderWithBase(<FilterGroup {...defaultProps} filters={singleFilter} data-oid="o9p31ae" />)

    expect(screen.getByTestId("filter-preview-brightness-1")).toBeInTheDocument()
    expect(screen.queryByTestId("filter-preview-contrast-1")).not.toBeInTheDocument()

    const filterPreviews = screen.getAllByRole("button")
    expect(filterPreviews).toHaveLength(1)
  })

  it("должен применять правильные CSS классы к заголовку", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="bm8:44v" />)

    const title = screen.getByText("Color Correction")
    expect(title.tagName).toBe("H3")
    expect(title).toHaveClass("text-sm")
    expect(title).toHaveClass("font-medium")
  })

  it("должен применять правильные CSS классы к контейнеру", () => {
    renderWithBase(<FilterGroup {...defaultProps} data-oid="rlqvf:0" />)

    const container = screen.getByText("Color Correction").parentElement
    expect(container).toHaveClass("space-y-2")
  })
})

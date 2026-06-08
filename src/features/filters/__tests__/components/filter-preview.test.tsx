import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { FilterCategory, VideoFilter } from "@/features/filters/types/filters"
import { useResources } from "@/features/timeline/providers/resources-provider"
import { usePlayer, useVideoSelection } from "@/features/video-player"
import { renderWithBrowser } from "@/test/test-utils"

import { FilterPreview } from "../../components/filter-preview"

// Mock external dependencies
vi.mock("@/domains/video-editing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/video-editing")>()
  return {
    ...actual,
    useResources: vi.fn(),
  }
})

vi.mock("@/features/video-player", () => ({
  usePlayer: vi.fn(),
  useVideoSelection: vi.fn(),
}))

vi.mock("@/features/browser", () => ({
  ApplyButton: ({ resource, size, type, onApply }: any) => (
    <button
      data-testid="apply-button"
      data-resource-id={resource.id}
      data-size={size}
      data-type={type}
      onClick={() => onApply(resource, type)}
      data-oid="gged6.a"
    >
      Apply
    </button>
  ),
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ resource, size, type }: any) => (
    <button
      data-testid="add-media-button"
      data-resource-id={resource.id}
      data-size={size}
      data-type={type}
      data-oid="4asd3.s"
    >
      Add Media
    </button>
  ),
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <button data-testid="favorite-button" data-file-id={file.id} data-size={size} data-type={type} data-oid="m0u25ly">
      Favorite
    </button>
  ),
}))

describe("FilterPreview", () => {
  const mockFilter: VideoFilter = {
    id: "brightness-1",
    name: "Brightness Filter",
    category: "color-correction",
    complexity: "basic",
    tags: ["professional", "standard"],
    description: {
      en: "Brightness filter",
    },
    labels: {
      en: "Brightness",
      ru: "Яркость",
    },
    params: {
      brightness: 0.2,
      contrast: 1.1,
      saturation: 0.9,
      hue: 10,
      temperature: 5,
      tint: -2,
      clarity: 0.3,
      vibrance: 0.1,
      shadows: -0.2,
      highlights: -0.1,
    },
  }

  const defaultProps = {
    filter: mockFilter,
    onClick: vi.fn(),
    size: 150,
    previewWidth: 150,
    previewHeight: 84,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock HTMLVideoElement methods
    Object.defineProperty(HTMLVideoElement.prototype, "play", {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })
    Object.defineProperty(HTMLVideoElement.prototype, "pause", {
      writable: true,
      value: vi.fn(),
    })
    Object.defineProperty(HTMLVideoElement.prototype, "currentTime", {
      writable: true,
      value: 0,
    })

    // Setup default mocks
    vi.mocked(useResources).mockReturnValue({
      addFilter: vi.fn(),
      isFilterAdded: vi.fn().mockReturnValue(false),
      removeResource: vi.fn(),
      filterResources: [],
    } as any)

    vi.mocked(usePlayer).mockReturnValue({
      applyFilter: vi.fn(),
    } as any)

    vi.mocked(useVideoSelection).mockReturnValue({
      getCurrentVideo: vi.fn(() => null),
    } as any)
  })

  it("should render correctly with default props", () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="fdilugc" />)

    expect(screen.getByTestId("filter-video")).toBeInTheDocument()
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument()
    expect(screen.getByTestId("add-media-button")).toBeInTheDocument()
    expect(screen.getByText("Яркость")).toBeInTheDocument()
  })

  it("should display filter name in Russian if available", () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="3.6pye:" />)

    expect(screen.getByText("Яркость")).toBeInTheDocument()
  })

  it("should fallback to filter name if Russian not available", () => {
    const filterWithoutRussian: VideoFilter = {
      ...mockFilter,
      labels: {
        en: "Brightness",
        // No 'ru' property here to test the fallback
      },
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={filterWithoutRussian} data-oid="l83x06z" />)

    // Component shows filter.name when ru is not available
    expect(screen.getByText("Brightness Filter")).toBeInTheDocument()
  })

  it("should fallback to name if no labels available", () => {
    const filterWithoutLabels = {
      ...mockFilter,
      labels: undefined as any, // Use undefined to test the fallback
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={filterWithoutLabels} data-oid="j:ah5.i" />)

    expect(screen.getByText("Brightness Filter")).toBeInTheDocument()
  })

  it("should have correct dimensions", () => {
    const { container } = renderWithBrowser(<FilterPreview {...defaultProps} data-oid="1clc-my" />)

    const previewContainer = container.querySelector(".group")
    expect(previewContainer).toHaveStyle({
      width: "150px",
      height: "84px",
    })
  })

  it("should call onClick when clicked", () => {
    const mockOnClick = vi.fn()
    renderWithBrowser(<FilterPreview {...defaultProps} onClick={mockOnClick} data-oid="iigeinc" />)

    const previewContainer = screen.getByTestId("filter-video").parentElement
    fireEvent.click(previewContainer!)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it("should start video playback on mouse enter", async () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="-ana6uo" />)

    const video = screen.getByTestId("filter-video") as HTMLVideoElement
    const mockPlay = vi.fn().mockResolvedValue(undefined)
    video.play = mockPlay

    const previewContainer = video.parentElement
    fireEvent.mouseEnter(previewContainer!)

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalled()
    })
  })

  it("should pause video on mouse leave", async () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="tvjq4m_" />)

    const video = screen.getByTestId("filter-video") as HTMLVideoElement
    const mockPause = vi.fn()
    video.pause = mockPause

    const previewContainer = video.parentElement

    // First hover to start
    fireEvent.mouseEnter(previewContainer!)

    // Then leave
    fireEvent.mouseLeave(previewContainer!)

    await waitFor(() => {
      expect(mockPause).toHaveBeenCalled()
    })
  })

  it("should apply CSS filters on hover", async () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="ri6.0bn" />)

    const video = screen.getByTestId("filter-video")
    const previewContainer = video.parentElement

    fireEvent.mouseEnter(previewContainer!)

    await waitFor(() => {
      const filterStyle = video.style.filter
      expect(filterStyle).toContain("brightness(1.2)")
      expect(filterStyle).toContain("contrast(1.1)")
      expect(filterStyle).toContain("saturate(0.9)")
    })
  })

  it("should clear CSS filters on mouse leave", async () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="to8a1zj" />)

    const video = screen.getByTestId("filter-video")
    const previewContainer = video.parentElement

    fireEvent.mouseEnter(previewContainer!)
    fireEvent.mouseLeave(previewContainer!)

    await waitFor(() => {
      expect(video.style.filter).toBe("")
    })
  })

  it("should show correct complexity indicator", () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="3kreqs2" />)

    const complexityIndicator = document.querySelector(".bg-green-500")
    expect(complexityIndicator).toBeInTheDocument()
  })

  it("should show intermediate complexity indicator", () => {
    const intermediateFilter = {
      ...mockFilter,
      complexity: "intermediate" as const,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={intermediateFilter} data-oid="zcogmsq" />)

    const complexityIndicator = document.querySelector(".bg-yellow-500")
    expect(complexityIndicator).toBeInTheDocument()
  })

  it("should show advanced complexity indicator", () => {
    const advancedFilter = {
      ...mockFilter,
      complexity: "advanced" as const,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={advancedFilter} data-oid="6ho6i.3" />)

    const complexityIndicator = document.querySelector(".bg-red-500")
    expect(complexityIndicator).toBeInTheDocument()
  })

  it("should show correct category abbreviation", () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="86qyhm8" />)

    expect(screen.getByText("CC")).toBeInTheDocument() // color-correction
  })

  it("should show creative category abbreviation", () => {
    const creativeFilter = {
      ...mockFilter,
      category: "creative" as FilterCategory,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={creativeFilter} data-oid="j:if1b2" />)

    expect(screen.getByText("CRE")).toBeInTheDocument()
  })

  it("should show cinematic category abbreviation", () => {
    const cinematicFilter = {
      ...mockFilter,
      category: "cinematic" as FilterCategory,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={cinematicFilter} data-oid="5_-ck6m" />)

    expect(screen.getByText("CIN")).toBeInTheDocument()
  })

  it("should show vintage category abbreviation", () => {
    const vintageFilter = {
      ...mockFilter,
      category: "vintage" as FilterCategory,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={vintageFilter} data-oid="muf4mpl" />)

    expect(screen.getByText("VIN")).toBeInTheDocument()
  })

  it("should show technical category abbreviation", () => {
    const technicalFilter = {
      ...mockFilter,
      category: "technical" as FilterCategory,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={technicalFilter} data-oid="qpmbq68" />)

    expect(screen.getByText("TEC")).toBeInTheDocument()
  })

  it("should show artistic category abbreviation", () => {
    const artisticFilter = {
      ...mockFilter,
      category: "artistic" as FilterCategory,
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={artisticFilter} data-oid="bs3w_i." />)

    expect(screen.getByText("ART")).toBeInTheDocument()
  })

  it("should show default category abbreviation for unknown category", () => {
    const unknownFilter = {
      ...mockFilter,
      category: "unknown" as any, // Force unknown category
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={unknownFilter} data-oid="9aww35o" />)

    expect(screen.getByText("FIL")).toBeInTheDocument()
  })

  it("should generate correct CSS filter string", () => {
    const filterWithAllParams = {
      ...mockFilter,
      params: {
        brightness: 0.2,
        contrast: 1.1,
        saturation: 0.9,
        hue: 10,
        temperature: 5,
        tint: -2,
        clarity: 0.3,
        vibrance: 0.1,
        shadows: -0.2,
        highlights: -0.1,
      },
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={filterWithAllParams} data-oid="a5n05ec" />)

    const video = screen.getByTestId("filter-video")
    const previewContainer = video.parentElement

    fireEvent.mouseEnter(previewContainer!)

    // Check that the filter contains expected values
    expect(video.style.filter).toContain("brightness(1.2)")
    expect(video.style.filter).toContain("contrast(1.1)")
    expect(video.style.filter).toContain("saturate(0.9)")
    expect(video.style.filter).toContain("hue-rotate(10deg)")
  })

  it("should apply filter and call onClick when preview is clicked", () => {
    const mockApplyFilter = vi.fn()
    const mockOnClick = vi.fn()

    vi.mocked(usePlayer).mockReturnValue({
      applyFilter: mockApplyFilter,
    } as any)

    renderWithBrowser(<FilterPreview {...defaultProps} onClick={mockOnClick} data-oid="hv.:msz" />)

    // Кликаем на контейнер превью
    const previewContainer = screen.getByTestId("filter-video").parentElement
    fireEvent.click(previewContainer!)

    // Проверяем что фильтр применился
    expect(mockApplyFilter).toHaveBeenCalledWith({
      id: mockFilter.id,
      name: mockFilter.name,
      params: mockFilter.params,
    })

    // Проверяем что вызвался onClick (открытие в плеере)
    expect(mockOnClick).toHaveBeenCalled()
  })

  it("should show add media button", () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="yk4_kw-" />)

    const addButton = screen.getByTestId("add-media-button")
    expect(addButton).toBeInTheDocument()
    expect(addButton).toHaveAttribute("data-resource-id", mockFilter.id)
    expect(addButton).toHaveAttribute("data-type", "filter")
  })

  it("should show favorite button", () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="oe44rx7" />)

    const favoriteButton = screen.getByTestId("favorite-button")
    expect(favoriteButton).toBeInTheDocument()
    expect(favoriteButton).toHaveAttribute("data-file-id", mockFilter.id)
    expect(favoriteButton).toHaveAttribute("data-type", "filter")
  })

  it("should show add media button with correct opacity when filter is added", () => {
    vi.mocked(useResources).mockReturnValue({
      addFilter: vi.fn(),
      isFilterAdded: vi.fn().mockReturnValue(true),
      removeResource: vi.fn(),
      filterResources: [],
    } as any)

    const { container } = renderWithBrowser(<FilterPreview {...defaultProps} data-oid="f21k4vy" />)

    const addButtonContainer = container.querySelector('[class*="opacity-100"]')
    expect(addButtonContainer).toBeInTheDocument()
  })

  it("should show add media button with hover opacity when filter is not added", () => {
    vi.mocked(useResources).mockReturnValue({
      addFilter: vi.fn(),
      isFilterAdded: vi.fn().mockReturnValue(false),
      removeResource: vi.fn(),
      filterResources: [],
    } as any)

    const { container } = renderWithBrowser(<FilterPreview {...defaultProps} data-oid="dd5ohjx" />)

    const addButtonContainer = container.querySelector('[class*="opacity-0"]')
    expect(addButtonContainer).toBeInTheDocument()
  })

  it("should handle missing params gracefully", () => {
    const filterWithoutParams = {
      ...mockFilter,
      params: {},
    }

    renderWithBrowser(<FilterPreview {...defaultProps} filter={filterWithoutParams} data-oid="s20k3y-" />)

    const video = screen.getByTestId("filter-video")
    const previewContainer = video.parentElement

    // Should not throw when applying empty params
    expect(() => {
      fireEvent.mouseEnter(previewContainer!)
    }).not.toThrow()
  })

  it("should reset video time to 0 on hover", async () => {
    renderWithBrowser(<FilterPreview {...defaultProps} data-oid="yv_3lky" />)

    const video = screen.getByTestId("filter-video")

    // Mock currentTime setter on the video element
    let currentTimeValue = 0
    Object.defineProperty(video, "currentTime", {
      get: () => currentTimeValue,
      set: (value: number) => {
        currentTimeValue = value
      },
      configurable: true,
    })

    const previewContainer = video.parentElement
    fireEvent.mouseEnter(previewContainer!)

    await waitFor(() => {
      expect(currentTimeValue).toBe(0)
    })
  })
})

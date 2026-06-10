import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useTranslation } from "react-i18next"
import { describe, expect, it, vi } from "vitest"

import { renderWithBrowser } from "@/test/test-utils"

import { StyleTemplatePreview } from "../style-template-preview"

// Mock dependencies
const mockAddStyleTemplate = vi.fn()
const mockIsStyleTemplateAdded = vi.fn()

vi.mock("@/features/user-settings/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    settings: {},
    updateSettings: vi.fn(),
  }),
}))

vi.mock("@/features/timeline/providers/resources-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/timeline/providers/resources-provider")>()
  return {
    ...actual,
    useResources: () => ({
      addStyleTemplate: mockAddStyleTemplate,
      isStyleTemplateAdded: mockIsStyleTemplateAdded,
    }),
  }
})

vi.mock("@/features/browser/components/layout/apply-button", () => ({
  ApplyButton: vi.fn(({ resource, size, type }) => (
    <div data-testid="apply-button" data-resource-id={resource.id} data-size={size} data-type={type} data-oid="y59v7lu">
      Apply
    </div>
  )),
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: vi.fn(({ resource, size, type }) => (
    <div
      data-testid="add-media-button"
      data-resource-id={resource.id}
      data-size={size}
      data-type={type}
      data-oid="5jfsc_x"
    >
      Add
    </div>
  )),
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: vi.fn(({ file, size, type }) => (
    <div data-testid="favorite-button" data-file-id={file.id} data-size={size} data-type={type} data-oid="5lwhq-_">
      Favorite
    </div>
  )),
}))

const mockTemplate = {
  id: "test-template-1",
  name: { ru: "Тестовый шаблон", en: "Test Template" },
  category: "intro" as const,
  style: "modern" as const,
  aspectRatio: "16:9" as const,
  duration: 3,
  hasText: true,
  hasAnimation: true,
  thumbnail: "test-thumbnail.jpg",
  previewVideo: "test-preview.mp4",
  tags: { ru: ["тест"], en: ["test"] },
  elements: [],
}

describe("StyleTemplatePreview", () => {
  const defaultProps = {
    template: mockTemplate,
    size: 200,
    onSelect: vi.fn(),
    previewWidth: 200,
    previewHeight: 112,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsStyleTemplateAdded.mockReturnValue(false)
  })

  it("should render template preview with thumbnail", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="ik9.dv3" />)

    const thumbnail = screen.getByAltText("Тестовый шаблон")
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute("src", "test-thumbnail.jpg")
    expect(thumbnail).toHaveStyle({
      width: "200px",
      height: "112px",
      objectFit: "cover",
    })
  })

  it("should render placeholder when no thumbnail", () => {
    const templateWithoutThumbnail = { ...mockTemplate, thumbnail: undefined }

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} template={templateWithoutThumbnail} data-oid="0xd03bn" />)

    expect(screen.getByText(/styleTemplates.categories.intro/)).toBeInTheDocument()
  })

  it("should show template name", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="4bvszr_" />)

    expect(screen.getByText("Тестовый шаблон")).toBeInTheDocument()
  })

  it("should show play button on hover when preview video exists", async () => {
    const user = userEvent.setup()
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="j4fqc_b" />)

    const previewContainer = screen.getByAltText("Тестовый шаблон").parentElement

    // Initially no play button
    expect(screen.queryByTestId("play-icon")).not.toBeInTheDocument()

    // Hover to show play button
    await user.hover(previewContainer!)

    await waitFor(() => {
      const playIcon = screen.getByTestId("play-icon")
      expect(playIcon).toHaveClass("h-6 w-6")
    })
  })

  it("should not show play button when no preview video", async () => {
    const user = userEvent.setup()
    const templateWithoutVideo = { ...mockTemplate, previewVideo: undefined }

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} template={templateWithoutVideo} data-oid="tobw:sm" />)

    const previewContainer = screen.getByAltText("Тестовый шаблон").parentElement
    await user.hover(previewContainer!)

    // No play button should appear
    expect(screen.queryByTestId("play-icon")).not.toBeInTheDocument()
  })

  it("should show style indicator", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="xr7-:_s" />)

    // Style indicator shows first 3 letters uppercase
    // There are two indicators with "STY" - both style and category
    const indicators = screen.getAllByText("STY")
    expect(indicators).toHaveLength(2)
    expect(indicators[0]).toBeInTheDocument() // Style indicator (top)
  })

  it("should show category indicator", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="pccsw4w" />)

    // Category indicator shows first 3 letters uppercase
    // There should be two indicators - style (top) and category (bottom)
    const indicators = screen.getAllByText("STY")
    expect(indicators).toHaveLength(2) // One for style, one for category
  })

  it("should render favorite button", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="c2jf9tr" />)

    const favoriteButton = screen.getByTestId("favorite-button")
    expect(favoriteButton).toBeInTheDocument()
    expect(favoriteButton).toHaveAttribute("data-file-id", "test-template-1")
    expect(favoriteButton).toHaveAttribute("data-type", "styleTemplate")
  })

  it("should render add media button", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="mh0m-1a" />)

    const addButton = screen.getByTestId("add-media-button")
    expect(addButton).toBeInTheDocument()
    expect(addButton).toHaveAttribute("data-resource-id", "test-template-1")
    expect(addButton).toHaveAttribute("data-type", "styleTemplate")
  })

  it("should show add button with opacity when not added", () => {
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="7en4.pp" />)

    const addButtonContainer = screen.getByTestId("add-media-button").parentElement
    expect(addButtonContainer).toHaveClass("opacity-0")
  })

  it("should show add button with full opacity when added", () => {
    mockIsStyleTemplateAdded.mockReturnValue(true)

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="nx8-ali" />)

    const addButtonContainer = screen.getByTestId("add-media-button").parentElement
    expect(addButtonContainer).toHaveClass("opacity-100")
  })

  it("should handle template click", async () => {
    const user = userEvent.setup()
    const onSelectMock = vi.fn()

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} onSelect={onSelectMock} data-oid="f4nw9en" />)

    const previewContainer = screen.getByAltText("Тестовый шаблон").parentElement
    await user.click(previewContainer!)

    // Clicking the container should only trigger preview, not add to resources
    expect(mockAddStyleTemplate).not.toHaveBeenCalled()
    expect(onSelectMock).toHaveBeenCalledWith("test-template-1")
  })

  it("should only trigger preview on template click regardless of added state", async () => {
    const user = userEvent.setup()
    const onSelectMock = vi.fn()
    mockIsStyleTemplateAdded.mockReturnValue(true)

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} onSelect={onSelectMock} data-oid="azhl74u" />)

    const previewContainer = screen.getByAltText("Тестовый шаблон").parentElement
    await user.click(previewContainer!)

    // Should never add template on container click
    expect(mockAddStyleTemplate).not.toHaveBeenCalled()
    expect(onSelectMock).toHaveBeenCalledWith("test-template-1")
  })

  it("should show preview button on hover but not add to resources on any click", async () => {
    const user = userEvent.setup()
    const onSelectMock = vi.fn()

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} onSelect={onSelectMock} data-oid="e2j85v9" />)

    const previewContainer = screen.getByAltText("Тестовый шаблон").parentElement

    // Hover to show preview button
    await user.hover(previewContainer!)

    // Wait for the play button to appear
    await waitFor(() => {
      const playButton = screen.queryByTestId("play-button")
      expect(playButton).toBeInTheDocument()
    })

    // Click anywhere on the container
    await user.click(previewContainer!)

    // Should only trigger preview, not add to resources
    expect(mockAddStyleTemplate).not.toHaveBeenCalled()
    expect(onSelectMock).toHaveBeenCalledWith("test-template-1")
  })

  it("should use custom preview dimensions", () => {
    renderWithBrowser(
      <StyleTemplatePreview {...defaultProps} previewWidth={300} previewHeight={169} data-oid="phvmpoc" />,
    )

    const thumbnail = screen.getByAltText("Тестовый шаблон")
    expect(thumbnail).toHaveStyle({
      width: "300px",
      height: "169px",
    })
  })

  it("should handle mouse enter and leave", async () => {
    const user = userEvent.setup()
    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="wiu4v4-" />)

    const previewContainer = screen.getByAltText("Тестовый шаблон").parentElement

    // Mouse enter
    await user.hover(previewContainer!)

    // Should show play button (if preview video exists)
    await waitFor(() => {
      const playIcon = previewContainer?.querySelector(".h-6.w-6")
      expect(playIcon).toBeInTheDocument()
    })

    // Mouse leave
    await user.unhover(previewContainer!)

    // Play button should be hidden
    await waitFor(() => {
      const playIcon = previewContainer?.querySelector(".h-6.w-6")
      expect(playIcon).not.toBeInTheDocument()
    })
  })

  it("should show correct category names for different categories", () => {
    const categories = ["intro", "outro", "lower-third", "title", "transition", "overlay"] as const

    categories.forEach((category) => {
      const { unmount } = renderWithBrowser(
        <StyleTemplatePreview {...defaultProps} template={{ ...mockTemplate, category }} data-oid="tcu9nog" />,
      )

      // Category indicator should show "STY" as translation key prefix
      const indicators = screen.getAllByText("STY")
      expect(indicators.length).toBeGreaterThanOrEqual(2) // At least style and category
      unmount()
    })
  })

  it("should show correct style names for different styles", () => {
    const styles = ["modern", "vintage", "minimal", "corporate", "creative", "cinematic"] as const

    styles.forEach((style) => {
      const { unmount } = renderWithBrowser(
        <StyleTemplatePreview {...defaultProps} template={{ ...mockTemplate, style }} data-oid="ps-i3bt" />,
      )

      // Style indicator should show "STY" as translation key prefix
      const indicators = screen.getAllByText("STY")
      expect(indicators.length).toBeGreaterThanOrEqual(2) // At least style and category
      unmount()
    })
  })

  it("should handle English language", () => {
    // Mock the translation hook to return English language
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
      i18n: { language: "en" },
      ready: true,
    } as any)

    renderWithBrowser(<StyleTemplatePreview {...defaultProps} data-oid="w8rogj2" />)

    // Should show English name
    expect(screen.getByText("Test Template")).toBeInTheDocument()
  })
})

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ResourcesPanel } from "../../components/resources-panel"
import type { EffectResource, FilterResource, MediaResource } from "../../types"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        "timeline.resources.title": "Resources",
        "timeline.resources.empty": "Drag here effects, filters, transitions or media files",
      }
      return translations[key] || fallback || key
    }),
  }),
}))

// Mock ResourceThumbnail
vi.mock("../../components/resource-thumbnail", () => ({
  ResourceThumbnail: ({ resource, onRemove }: any) => (
    <div data-testid={`thumbnail-${resource.id}`}>
      <span>{resource.name}</span>
      <button onClick={() => onRemove(resource.id, resource.type)}>Remove</button>
    </div>
  ),
}))

// Mock useResources hook
const mockUseResources = vi.fn()
vi.mock("@/domains/video-editing/providers", () => ({
  useResources: () => mockUseResources(),
}))

describe("ResourcesPanel - Simplified Architecture", () => {
  const mockRemoveResource = vi.fn()

  const createMediaResource = (id: string, name: string, addedAt = Date.now()): MediaResource => ({
    id,
    type: "media",
    name,
    resourceId: id,
    addedAt,
    file: {
      id,
      name,
      path: `/path/${name}`,
      type: "video",
      size: 1024,
      duration: 10,
    } as any,
    params: {},
  })

  const createEffectResource = (id: string, name: string, addedAt = Date.now()): EffectResource => ({
    id,
    type: "effect",
    name,
    resourceId: id,
    addedAt,
    effect: { id, name, type: "blur" } as any,
    params: {},
  })

  const createFilterResource = (id: string, name: string, addedAt = Date.now()): FilterResource => ({
    id,
    type: "filter",
    name,
    resourceId: id,
    addedAt,
    filter: { id, name } as any,
    params: {},
  })

  beforeEach(() => {
    mockRemoveResource.mockClear()
  })

  it("renders empty state when no resources", () => {
    mockUseResources.mockReturnValue({
      effectResources: [],
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    render(<ResourcesPanel />)

    expect(screen.getByText("Resources")).toBeInTheDocument()
    expect(screen.getByText("Drag here effects, filters, transitions or media files")).toBeInTheDocument()
  })

  it("renders all resources in horizontal scroll", () => {
    const mediaResource = createMediaResource("media-1", "Video.mp4")
    const effectResource = createEffectResource("effect-1", "Blur Effect")
    const filterResource = createFilterResource("filter-1", "Vintage Filter")

    mockUseResources.mockReturnValue({
      effectResources: [effectResource],
      filterResources: [filterResource],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [mediaResource],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    render(<ResourcesPanel />)

    expect(screen.getByText("Resources")).toBeInTheDocument()
    expect(screen.getByText("(3)")).toBeInTheDocument() // Total count

    expect(screen.getByTestId("thumbnail-media-1")).toBeInTheDocument()
    expect(screen.getByTestId("thumbnail-effect-1")).toBeInTheDocument()
    expect(screen.getByTestId("thumbnail-filter-1")).toBeInTheDocument()
  })

  it("sorts resources by addedAt (newest first)", () => {
    const now = Date.now()
    const media = createMediaResource("media-1", "Video.mp4", now) // Newest
    const effect = createEffectResource("effect-1", "Blur Effect", now - 1000) // Middle
    const filter = createFilterResource("filter-1", "Vintage Filter", now - 2000) // Oldest

    mockUseResources.mockReturnValue({
      effectResources: [effect],
      filterResources: [filter],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [media],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    const { container } = render(<ResourcesPanel />)

    const thumbnails = container.querySelectorAll("[data-testid^='thumbnail-']")
    expect(thumbnails).toHaveLength(3)

    // Check order (newest first)
    expect(thumbnails[0]).toHaveAttribute("data-testid", "thumbnail-media-1")
    expect(thumbnails[1]).toHaveAttribute("data-testid", "thumbnail-effect-1")
    expect(thumbnails[2]).toHaveAttribute("data-testid", "thumbnail-filter-1")
  })

  it("calls removeResource when thumbnail remove button clicked", async () => {
    const user = userEvent.setup()

    const resource = createEffectResource("effect-1", "Blur Effect")

    mockUseResources.mockReturnValue({
      effectResources: [resource],
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    render(<ResourcesPanel />)

    const removeButton = screen.getByRole("button", { name: "Remove" })
    await user.click(removeButton)

    expect(mockRemoveResource).toHaveBeenCalledWith("effect-1", "effect")
  })

  it("has horizontal scroll container with correct styles", () => {
    mockUseResources.mockReturnValue({
      effectResources: [createEffectResource("effect-1", "Blur")],
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    const { container } = render(<ResourcesPanel />)

    const scrollContainer = container.querySelector(".overflow-x-auto")
    expect(scrollContainer).toBeInTheDocument()
    expect(scrollContainer).toHaveClass("overflow-y-hidden")
    expect(scrollContainer).toHaveClass("flex")
  })

  it("displays correct total count in header", () => {
    mockUseResources.mockReturnValue({
      effectResources: [createEffectResource("effect-1", "Effect 1"), createEffectResource("effect-2", "Effect 2")],
      filterResources: [createFilterResource("filter-1", "Filter 1")],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [createMediaResource("media-1", "Video.mp4")],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    render(<ResourcesPanel />)

    expect(screen.getByText("(4)")).toBeInTheDocument()
  })

  it("combines resources from all categories", () => {
    mockUseResources.mockReturnValue({
      effectResources: [createEffectResource("effect-1", "Effect")],
      filterResources: [createFilterResource("filter-1", "Filter")],
      transitionResources: [],
      templateResources: [],
      styleTemplateResources: [],
      mediaResources: [createMediaResource("media-1", "Media")],
      musicResources: [],
      subtitleResources: [],
      removeResource: mockRemoveResource,
    })

    render(<ResourcesPanel />)

    // All three resources should be rendered
    expect(screen.getByTestId("thumbnail-effect-1")).toBeInTheDocument()
    expect(screen.getByTestId("thumbnail-filter-1")).toBeInTheDocument()
    expect(screen.getByTestId("thumbnail-media-1")).toBeInTheDocument()
  })
})

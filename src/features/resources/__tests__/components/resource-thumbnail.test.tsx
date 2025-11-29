import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { EffectResource, MediaResource } from "../../types"
import { ResourceThumbnail } from "../../components/resource-thumbnail"

// Mock dependencies
vi.mock("@/features/browser/components/preview/media-preview", () => ({
  MediaPreview: ({ file }: any) => <div data-testid="media-preview">{file.name}</div>,
}))

vi.mock("@/features/drag-drop", () => ({
  useDraggable: () => ({
    draggable: true,
    onDragStart: vi.fn(),
  }),
}))

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    X: () => <div data-testid="x-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Palette: () => <div data-testid="palette-icon" />,
  }
})

describe("ResourceThumbnail", () => {
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    mockOnRemove.mockClear()
  })

  it("renders media resource with preview", () => {
    const mediaResource: MediaResource = {
      id: "media-1",
      type: "media",
      name: "Video.mp4",
      resourceId: "video-1",
      addedAt: Date.now(),
      file: {
        id: "video-1",
        name: "Video.mp4",
        path: "/path/to/video.mp4",
        type: "video",
        size: 1024,
        duration: 10,
        thumbnail: "/path/to/thumb.jpg",
      } as any,
      params: {},
    }

    render(<ResourceThumbnail resource={mediaResource} onRemove={mockOnRemove} />)

    expect(screen.getByText("Video.mp4")).toBeInTheDocument()
    expect(screen.getByText("VID")).toBeInTheDocument() // Type badge
    expect(screen.getByTestId("media-preview")).toBeInTheDocument()
  })

  it("renders effect resource with icon", () => {
    const effectResource: EffectResource = {
      id: "effect-1",
      type: "effect",
      name: "Blur Effect",
      resourceId: "blur-1",
      addedAt: Date.now(),
      effect: {
        id: "blur-1",
        name: "Blur Effect",
        type: "blur",
      } as any,
      params: {},
    }

    render(<ResourceThumbnail resource={effectResource} onRemove={mockOnRemove} />)

    expect(screen.getByText("Blur Effect")).toBeInTheDocument()
    expect(screen.getByText("EFX")).toBeInTheDocument() // Type badge
    expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument()
  })

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup()

    const resource: EffectResource = {
      id: "effect-1",
      type: "effect",
      name: "Blur Effect",
      resourceId: "blur-1",
      addedAt: Date.now(),
      effect: { id: "blur-1", name: "Blur Effect", type: "blur" } as any,
      params: {},
    }

    render(<ResourceThumbnail resource={resource} onRemove={mockOnRemove} />)

    const removeButton = screen.getByRole("button", { name: /remove resource/i })
    await user.click(removeButton)

    expect(mockOnRemove).toHaveBeenCalledWith("effect-1", "effect")
  })

  it("displays correct badge for each resource type", () => {
    const types = [
      { type: "media", badge: "VID" },
      { type: "music", badge: "MUS" },
      { type: "effect", badge: "EFX" },
      { type: "filter", badge: "FLT" },
      { type: "transition", badge: "TRN" },
      { type: "template", badge: "TPL" },
      { type: "styleTemplate", badge: "STY" },
      { type: "subtitle", badge: "SUB" },
    ] as const

    types.forEach(({ type, badge }) => {
      const resource = {
        id: `${type}-1`,
        type,
        name: `Test ${type}`,
        resourceId: `${type}-id`,
        addedAt: Date.now(),
        params: {},
      } as any

      const { unmount } = render(<ResourceThumbnail resource={resource} onRemove={mockOnRemove} />)
      expect(screen.getByText(badge)).toBeInTheDocument()
      unmount()
    })
  })

  it("truncates long resource names", () => {
    const resource: EffectResource = {
      id: "effect-1",
      type: "effect",
      name: "Very Long Effect Name That Should Be Truncated In The UI",
      resourceId: "long-1",
      addedAt: Date.now(),
      effect: { id: "long-1", name: "Long Effect", type: "blur" } as any,
      params: {},
    }

    render(<ResourceThumbnail resource={resource} onRemove={mockOnRemove} />)

    const nameElement = screen.getByTitle("Very Long Effect Name That Should Be Truncated In The UI")
    expect(nameElement).toBeInTheDocument()
    expect(nameElement).toHaveClass("text-ellipsis")
  })
})

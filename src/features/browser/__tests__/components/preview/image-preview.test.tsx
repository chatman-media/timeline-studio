/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MediaType } from "@timeline-studio/domains/media-management"
import { ImagePreview } from "../../../components/preview/image-preview"

// PlayerProvider is already mocked globally in setup.ts

// Setup common mocks
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "en" },
  }),
}))

vi.mock("@timeline-studio/domains/project-management/hooks/use-app-settings", () => ({
  useAppSettings: () => ({
    getMediaFiles: () => ({
      allFiles: [],
      videoFiles: [],
      audioFiles: [],
      imageFiles: [],
    }),
    addMediaFiles: vi.fn(),
    removeMediaFile: vi.fn(),
    clearMediaFiles: vi.fn(),
    settings: {
      theme: "dark",
      language: "en",
      previewSize: 1,
      viewMode: "list",
    },
    updateSettings: vi.fn(),
  }),
}))

vi.mock("@timeline-studio/domains/project-management/hooks", () => ({
  useFavorites: () => ({
    favorites: {
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
      media: [],
      audio: [],
    },
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    isFavorite: vi.fn(() => false),
    clearFavorites: vi.fn(),
    toggleFavorite: vi.fn(),
  }),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// usePlayer is mocked globally in @/features/video-player

// Mock components
vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ onAddMedia, isAdded }: any) => (
    <div data-testid={isAdded ? "remove-button" : "add-button"} onClick={onAddMedia} data-oid="a48p_wy">
      {isAdded ? "Remove" : "Add"}
    </div>
  ),
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file }: any) => (
    <div data-testid="favorite-button" data-oid="_-rzvne">
      Favorite {file.name}
    </div>
  ),
}))

// Apply button mock
vi.mock("@/features/browser/components/layout/apply-button", () => ({
  ApplyButton: ({ file, size }: any) => (
    <button data-testid="apply-button" data-file={file.name} data-size={size} data-oid="_-g.5o0">
      Apply
    </button>
  ),
}))

const mockFile = {
  id: "test-image-1",
  name: "test-image.jpg",
  path: "/path/to/test-image.jpg",
  size: 1024,
  type: MediaType.StillImage,
  isImage: true,
  isVideo: false,
  isAudio: false,
  lastModified: Date.now(),
}

describe("ImagePreview", () => {
  it("should render correctly with default props", () => {
    render(<ImagePreview file={mockFile} size={100} data-oid=".cegexi" />)

    expect(screen.getByRole("img")).toBeInTheDocument()
  })

  it("should show filename when showFileName is true", () => {
    render(<ImagePreview file={mockFile} size={100} showFileName data-oid="pgvbk88" />)

    expect(screen.getByText("test-image.jpg")).toBeInTheDocument()
  })

  it("should render with custom size and dimensions", () => {
    render(<ImagePreview file={mockFile} size={200} dimensions={[16, 9]} data-oid="eeqv_3p" />)

    const img = screen.getByRole("img")
    expect(img).toBeInTheDocument()
  })

  it("should render add media button when onAddMedia is provided", () => {
    render(<ImagePreview file={mockFile} size={100} data-oid="nmsqqua" />)

    expect(screen.getByTestId("add-button")).toBeInTheDocument()
  })
})

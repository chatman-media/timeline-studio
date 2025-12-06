import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaType } from "@/domains/media-management"
import { useFavorites } from "@/domains/project-management/hooks"
import { fireEvent, renderWithProviders, screen } from "@/test/test-utils"

import { MediaItem } from "../../components/media-item"

// Импортируем для мокирования

// Мокаем MediaPreview
vi.mock("@/features/browser", () => ({
  MediaPreview: ({ file, onAddMedia, isAdded, size, showFileName, ignoreRatio }: any) => (
    <div
      data-testid="media-preview"
      data-file-id={file.id}
      data-is-added={isAdded}
      data-size={size}
      data-show-filename={showFileName}
      data-ignore-ratio={ignoreRatio}
      onClick={() => onAddMedia?.(file)}
    >
      Media Preview
    </div>
  ),
}))

// Мокаем FileMetadata
vi.mock("../../components/file-metadata", () => ({
  FileMetadata: ({ file, size }: { file: any; size: number }) => (
    <div data-testid="file-metadata" data-file-id={file.id} data-size={size}>
      File Metadata
    </div>
  ),
}))

// Мокаем useFavorites
vi.mock("@/domains/project-management/hooks", async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useFavorites: vi.fn(() => ({
      favorites: {
        media: [],
        audio: [],
        transition: [],
        effect: [],
        template: [],
        filter: [],
      },
    })),
  }
})

// Мокаем useProjectSettings
vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: {
          width: 16,
          height: 9,
        },
      },
    },
  }),
}))

describe("MediaItem", () => {
  const mockFile = {
    id: "test-file",
    name: "test-file.mp4",
    path: "/path/to/test-file.mp4",
    type: MediaType.Video,
    isVideo: true,
    size: 1000,
    creationTime: "2023-01-01T00:00:00.000Z",
  }

  const mockAddedFile = {
    id: "added-file",
    name: "added-file.mp4",
    path: "/path/to/added-file.mp4",
    type: MediaType.Video,
    isVideo: true,
    size: 1000,
    creationTime: "2023-01-01T00:00:00.000Z",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render in list mode", () => {
    renderWithProviders(<MediaItem file={mockFile} index={0} viewMode="list" previewSize={100} />)

    // Проверяем, что компоненты отрендерились
    expect(screen.getByTestId("media-preview")).toBeInTheDocument()
    expect(screen.getByTestId("file-metadata")).toBeInTheDocument()

    // Проверяем, что переданы правильные пропсы
    expect(screen.getByTestId("media-preview").dataset.fileId).toBe("test-file")
    expect(screen.getByTestId("media-preview").dataset.size).toBe("100")
    expect(screen.getByTestId("media-preview").dataset.ignoreRatio).toBe("false")
    expect(screen.getByTestId("file-metadata").dataset.fileId).toBe("test-file")
    expect(screen.getByTestId("file-metadata").dataset.size).toBe("100")
  })

  it("should render in grid mode", () => {
    renderWithProviders(<MediaItem file={mockFile} index={0} viewMode="grid" previewSize={100} />)

    // Проверяем, что компонент превью отрендерился
    expect(screen.getByTestId("media-preview")).toBeInTheDocument()

    // Проверяем, что имя файла отображается
    expect(screen.getByText("test-file.mp4")).toBeInTheDocument()

    // Проверяем, что переданы правильные пропсы
    expect(screen.getByTestId("media-preview").dataset.fileId).toBe("test-file")
    expect(screen.getByTestId("media-preview").dataset.size).toBe("100")
    expect(screen.getByTestId("media-preview").dataset.ignoreRatio).toBeFalsy()
  })

  it("should render in thumbnails mode", () => {
    renderWithProviders(<MediaItem file={mockFile} index={0} viewMode="thumbnails" previewSize={100} />)

    // Проверяем, что компонент превью отрендерился
    expect(screen.getByTestId("media-preview")).toBeInTheDocument()

    // Проверяем, что переданы правильные пропсы
    expect(screen.getByTestId("media-preview").dataset.fileId).toBe("test-file")
    expect(screen.getByTestId("media-preview").dataset.size).toBe("100")
    expect(screen.getByTestId("media-preview").dataset.showFilename).toBe("true")
    expect(screen.getByTestId("media-preview").dataset.ignoreRatio).toBe("true")
  })

  it("should handle click events on preview component", () => {
    renderWithProviders(<MediaItem file={mockFile} index={0} viewMode="list" previewSize={100} />)

    // Кликаем на превью - компонент должен корректно обрабатывать клики
    expect(() => {
      fireEvent.click(screen.getByTestId("media-preview"))
    }).not.toThrow()

    // Проверяем, что компонент остается отрендеренным после клика
    expect(screen.getByTestId("media-preview")).toBeInTheDocument()
  })

  it("should apply 'pointer-events-none' class for added files", () => {
    // Настраиваем мок так, чтобы файл был в избранном
    vi.mocked(useFavorites).mockReturnValue({
      favorites: {
        media: [{ id: "added-file" }],
        audio: [],
        transition: [],
        effect: [],
        template: [],
        filter: [],
      },
      updateFavorites: vi.fn(),
      addToFavorites: vi.fn(),
      removeFromFavorites: vi.fn(),
      isItemFavorite: vi.fn(),
    } as any)

    renderWithProviders(<MediaItem file={mockAddedFile} index={0} viewMode="list" previewSize={100} />)

    // Проверяем, что компонент имеет класс pointer-events-none
    const container = screen.getByTestId("media-preview").parentElement?.parentElement
    expect(container).toHaveClass("pointer-events-none")
  })
})

import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, renderWithBase, screen } from "@/test/test-utils";

import { MediaItem } from "../../components/media-item";

// Мокаем useMedia
vi.mock("@/features/browser", () => ({
  useMedia: () => ({
    isFileAdded: vi.fn((file) => file.id === "added-file"),
    areAllFilesAdded: vi.fn(() => false),
  }),
}));

// Мокаем MediaPreview
vi.mock("@/features/browser/components/preview", () => ({
  MediaPreview: ({
    file,
    onAddMedia,
    isAdded,
    size,
    showFileName,
    ignoreRatio,
  }: any) => (
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
}));

// Мокаем FileMetadata
vi.mock("../../components/file-metadata", () => ({
  FileMetadata: ({ file, size }: { file: any; size: number }) => (
    <div data-testid="file-metadata" data-file-id={file.id} data-size={size}>
      File Metadata
    </div>
  ),
}));

describe("MediaItem", () => {
  const mockFile = {
    id: "test-file",
    name: "test-file.mp4",
    path: "/path/to/test-file.mp4",
    isVideo: true,
    size: 1000,
    creationTime: "2023-01-01T00:00:00.000Z",
  };

  const mockAddedFile = {
    id: "added-file",
    name: "added-file.mp4",
    path: "/path/to/added-file.mp4",
    isVideo: true,
    size: 1000,
    creationTime: "2023-01-01T00:00:00.000Z",
  };

  const mockOnAddMedia = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render in list mode", () => {
    renderWithBase(
      <MediaItem
        file={mockFile}
        index={0}
        viewMode="list"
        previewSize={100}
        onAddMedia={mockOnAddMedia}
      />,
    );

    // Проверяем, что компоненты отрендерились
    expect(screen.getByTestId("media-preview")).toBeInTheDocument();
    expect(screen.getByTestId("file-metadata")).toBeInTheDocument();

    // Проверяем, что переданы правильные пропсы
    expect(screen.getByTestId("media-preview").dataset.fileId).toBe(
      "test-file",
    );
    expect(screen.getByTestId("media-preview").dataset.size).toBe("100");
    expect(screen.getByTestId("media-preview").dataset.ignoreRatio).toBe(
      "true",
    );
    expect(screen.getByTestId("file-metadata").dataset.fileId).toBe(
      "test-file",
    );
    expect(screen.getByTestId("file-metadata").dataset.size).toBe("100");
  });

  it("should render in grid mode", () => {
    renderWithBase(
      <MediaItem
        file={mockFile}
        index={0}
        viewMode="grid"
        previewSize={100}
        onAddMedia={mockOnAddMedia}
      />,
    );

    // Проверяем, что компонент превью отрендерился
    expect(screen.getByTestId("media-preview")).toBeInTheDocument();

    // Проверяем, что имя файла отображается
    expect(screen.getByText("test-file.mp4")).toBeInTheDocument();

    // Проверяем, что переданы правильные пропсы
    expect(screen.getByTestId("media-preview").dataset.fileId).toBe(
      "test-file",
    );
    expect(screen.getByTestId("media-preview").dataset.size).toBe("100");
    expect(screen.getByTestId("media-preview").dataset.ignoreRatio).toBeFalsy();
  });

  it("should render in thumbnails mode", () => {
    renderWithBase(
      <MediaItem
        file={mockFile}
        index={0}
        viewMode="thumbnails"
        previewSize={100}
        onAddMedia={mockOnAddMedia}
      />,
    );

    // Проверяем, что компонент превью отрендерился
    expect(screen.getByTestId("media-preview")).toBeInTheDocument();

    // Проверяем, что переданы правильные пропсы
    expect(screen.getByTestId("media-preview").dataset.fileId).toBe(
      "test-file",
    );
    expect(screen.getByTestId("media-preview").dataset.size).toBe("100");
    expect(screen.getByTestId("media-preview").dataset.showFilename).toBe(
      "true",
    );
    expect(screen.getByTestId("media-preview").dataset.ignoreRatio).toBe(
      "true",
    );
  });

  it("should call onAddMedia when clicked", () => {
    renderWithBase(
      <MediaItem
        file={mockFile}
        index={0}
        viewMode="list"
        previewSize={100}
        onAddMedia={mockOnAddMedia}
      />,
    );

    // Кликаем на превью
    act(() => {
      act(() => {
        fireEvent.click(screen.getByTestId("media-preview"));
      });
    });

    // Проверяем, что вызвана функция onAddMedia
    expect(mockOnAddMedia).toHaveBeenCalledWith(mockFile);
  });

  it("should apply 'pointer-events-none' class for added files", () => {
    renderWithBase(
      <MediaItem
        file={mockAddedFile}
        index={0}
        viewMode="list"
        previewSize={100}
        onAddMedia={mockOnAddMedia}
      />,
    );

    // Проверяем, что компонент имеет класс pointer-events-none
    const container =
      screen.getByTestId("media-preview").parentElement?.parentElement;
    expect(container).toHaveClass("pointer-events-none");
  });
});

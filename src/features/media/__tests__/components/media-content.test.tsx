import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, renderWithBase, screen } from "@/test/test-utils";

import { MediaContent } from "../../components/media-content";

// Мокаем NoFiles
vi.mock("@/features/browser/components/layout/no-files", () => ({
  NoFiles: () => <div data-testid="no-files">No files found</div>,
}));

// Мокаем MediaGroup
vi.mock("../media-group", () => ({
  MediaGroup: ({
    title,
    files,
    viewMode,
    previewSize,
    addFilesToTimeline,
  }: {
    title: string;
    files: any[];
    viewMode: string;
    previewSize: number;
    addFilesToTimeline: (files: any[]) => void;
  }) => (
    <div
      data-testid="media-group"
      data-title={title}
      data-files-count={files.length}
      data-view-mode={viewMode}
      data-preview-size={previewSize}
      onClick={() => addFilesToTimeline(files)}
    >
      Media Group: {title ?? "Untitled"}
    </div>
  ),
}));

describe("MediaContent", () => {
  const mockFiles = [
    {
      id: "test-file-1",
      name: "test-file-1.mp4",
      path: "/path/to/test-file-1.mp4",
      isVideo: true,
      size: 1000,
      creationTime: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "test-file-2",
      name: "test-file-2.mp4",
      path: "/path/to/test-file-2.mp4",
      isVideo: true,
      size: 1000,
      creationTime: "2023-01-01T00:00:00.000Z",
    },
  ];

  const mockGroupedFiles = [
    {
      title: "Group 1",
      files: mockFiles,
    },
    {
      title: "Group 2",
      files: mockFiles,
    },
  ];

  const mockAddFilesToTimeline = vi.fn();
  const mockOnRetry = vi.fn();

  it("should render loading skeleton when isLoading is true", () => {
    renderWithBase(
      <MediaContent
        groupedFiles={mockGroupedFiles}
        viewMode="list"
        previewSize={100}
        isLoading
        error={null}
        addFilesToTimeline={mockAddFilesToTimeline}
        onRetry={mockOnRetry}
      />,
    );

    // Проверяем, что скелетон загрузки отображается
    // Skeleton компоненты имеют класс, а не роль
    const skeletons = document.querySelectorAll(".h-4, .h-12");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render error message when there is an error", () => {
    renderWithBase(
      <MediaContent
        groupedFiles={mockGroupedFiles}
        viewMode="list"
        previewSize={100}
        isLoading={false}
        error="Failed to load media files"
        addFilesToTimeline={mockAddFilesToTimeline}
        onRetry={mockOnRetry}
      />,
    );

    // Проверяем, что сообщение об ошибке отображается
    expect(screen.getByText("common.error")).toBeInTheDocument();
    expect(screen.getByText("Failed to load media files")).toBeInTheDocument();

    // Проверяем, что кнопка Retry отображается
    const retryButton = screen.getByText("common.retry");
    expect(retryButton).toBeInTheDocument();

    // Кликаем на кнопку Retry
    act(() => {
      act(() => {
        fireEvent.click(retryButton);
      });
    });

    // Проверяем, что вызвана функция onRetry
    expect(mockOnRetry).toHaveBeenCalled();
  });

  it("should render NoFiles when there are no files", () => {
    renderWithBase(
      <MediaContent
        groupedFiles={[]}
        viewMode="list"
        previewSize={100}
        isLoading={false}
        error={null}
        addFilesToTimeline={mockAddFilesToTimeline}
        onRetry={mockOnRetry}
      />,
    );

    // Проверяем, что компонент NoFiles отображается
    expect(screen.getByText("Медиафайлы не найдены")).toBeInTheDocument();
  });

  it("should render NoFiles when groupedFiles has empty files array", () => {
    renderWithBase(
      <MediaContent
        groupedFiles={[{ title: "Empty Group", files: [] }]}
        viewMode="list"
        previewSize={100}
        isLoading={false}
        error={null}
        addFilesToTimeline={mockAddFilesToTimeline}
        onRetry={mockOnRetry}
      />,
    );

    // Проверяем, что компонент NoFiles отображается
    expect(screen.getByText("Медиафайлы не найдены")).toBeInTheDocument();
  });

  it("should render MediaGroup components for each group", () => {
    renderWithBase(
      <MediaContent
        groupedFiles={mockGroupedFiles}
        viewMode="list"
        previewSize={100}
        isLoading={false}
        error={null}
        addFilesToTimeline={mockAddFilesToTimeline}
        onRetry={mockOnRetry}
      />,
    );

    // Проверяем, что компоненты MediaGroup отображаются для каждой группы
    const mediaGroups = screen.getAllByTestId("media-group");
    expect(mediaGroups).toHaveLength(2);

    // Проверяем, что заголовки групп отображаются правильно
    expect(mediaGroups[0].dataset.title).toBe("Group 1");
    expect(mediaGroups[1].dataset.title).toBe("Group 2");

    // Проверяем, что количество файлов в группах правильное
    expect(mediaGroups[0].dataset.filesCount).toBe("2");
    expect(mediaGroups[1].dataset.filesCount).toBe("2");

    // Проверяем, что режим отображения и размер превью переданы правильно
    expect(mediaGroups[0].dataset.viewMode).toBe("list");
    expect(mediaGroups[0].dataset.previewSize).toBe("100");
  });

  it("should pass addFilesToTimeline to MediaGroup", () => {
    renderWithBase(
      <MediaContent
        groupedFiles={mockGroupedFiles}
        viewMode="list"
        previewSize={100}
        isLoading={false}
        error={null}
        addFilesToTimeline={mockAddFilesToTimeline}
        onRetry={mockOnRetry}
      />,
    );

    // Кликаем на первую группу
    act(() => {
      act(() => {
        fireEvent.click(screen.getAllByTestId("media-group")[0]);
      });
    });

    // Проверяем, что вызвана функция addFilesToTimeline с правильными параметрами
    expect(mockAddFilesToTimeline).toHaveBeenCalledWith(mockFiles);
  });
});

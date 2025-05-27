import * as React from "react";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";

import { MediaContext, MediaProvider } from "./media-provider";

// Мокаем useMachine из @xstate/react
const mockSend = vi.fn();
let mockState = {
  context: {
    allMediaFiles: [],
    error: null,
    isLoading: false,
    favorites: {
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
    },
  },
};

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}));

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// Создаем тестовые медиафайлы
const testMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "test1.mp4",
    path: "/path/to/test1.mp4",
    type: "video/mp4",
    size: 1024,
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 10,
    width: 1920,
    height: 1080,
    isIncluded: true,
    lastCheckedAt: Date.now(),
  },
  {
    id: "2",
    name: "test2.mp3",
    path: "/path/to/test2.mp3",
    type: "audio/mp3",
    size: 512,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration: 5,
    isIncluded: false,
    lastCheckedAt: Date.now(),
  },
];

// Тестовый компонент для проверки контекста
const TestComponent = () => {
  const mediaContext = React.useContext(MediaContext);

  if (!mediaContext) {
    return <div>No context</div>;
  }

  return (
    <div>
      <div data-testid="all-files-count">
        {mediaContext.allMediaFiles.length}
      </div>
      <div data-testid="included-files-count">
        {mediaContext.includedFiles.length}
      </div>
      <div data-testid="is-loading">
        {mediaContext.isLoading ? "true" : "false"}
      </div>
      <div data-testid="error">{mediaContext.error ?? "no-error"}</div>
      <button
        data-testid="include-button"
        onClick={() => mediaContext.includeFiles([testMediaFiles[1]])}
      >
        Include
      </button>
      <button
        data-testid="remove-button"
        onClick={() => mediaContext.removeFile(testMediaFiles[0].path)}
      >
        Remove
      </button>
      <button
        data-testid="clear-button"
        onClick={() => mediaContext.clearFiles()}
      >
        Clear
      </button>
      <button data-testid="reload-button" onClick={() => mediaContext.reload()}>
        Reload
      </button>
      <button
        data-testid="add-favorite-button"
        onClick={() => mediaContext.addToFavorites(testMediaFiles[0], "media")}
      >
        Add to favorites
      </button>
      <button
        data-testid="remove-favorite-button"
        onClick={() =>
          mediaContext.removeFromFavorites(testMediaFiles[0], "media")
        }
      >
        Remove from favorites
      </button>
      <button
        data-testid="clear-favorites-button"
        onClick={() => mediaContext.clearFavorites()}
      >
        Clear favorites
      </button>
      <div data-testid="is-file-added">
        {mediaContext.isFileAdded(testMediaFiles[0]) ? "true" : "false"}
      </div>
      <div data-testid="are-all-files-added">
        {mediaContext.areAllFilesAdded(testMediaFiles) ? "true" : "false"}
      </div>
      <div data-testid="is-item-favorite">
        {mediaContext.isItemFavorite(testMediaFiles[0], "media")
          ? "true"
          : "false"}
      </div>
    </div>
  );
};

describe("MediaProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Сбрасываем состояние мока
    mockState = {
      context: {
        allMediaFiles: [],
        error: null,
        isLoading: false,
        favorites: {
          media: [],
          audio: [],
          transition: [],
          effect: [],
          template: [],
          filter: [],
        },
      },
    };
  });

  it("should provide media context to children", () => {
    render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Проверяем, что контекст предоставляется
    expect(screen.getByTestId("all-files-count").textContent).toBe("0");
    expect(screen.getByTestId("included-files-count").textContent).toBe("0");
    expect(screen.getByTestId("is-loading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("no-error");
  });

  it("should initialize media state on mount", () => {
    render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Проверяем, что FETCH_MEDIA было отправлено
    expect(mockSend).toHaveBeenCalledWith({ type: "FETCH_MEDIA" });
  });

  it("should update UI when state changes", () => {
    // Устанавливаем начальное состояние
    mockState = {
      context: {
        allMediaFiles: testMediaFiles,
        error: null,
        isLoading: false,
        favorites: {
          media: [],
          audio: [],
          transition: [],
          effect: [],
          template: [],
          filter: [],
        },
      },
    };

    render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Проверяем, что UI отображает правильные данные
    expect(screen.getByTestId("all-files-count").textContent).toBe("2");
    expect(screen.getByTestId("included-files-count").textContent).toBe("1");
    expect(screen.getByTestId("is-file-added").textContent).toBe("true");
    expect(screen.getByTestId("are-all-files-added").textContent).toBe("false");
  });

  it("should call send with INCLUDE_FILES when includeFiles is called", () => {
    const { getByTestId } = render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Кликаем на кнопку включения файлов
    getByTestId("include-button").click();

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "INCLUDE_FILES",
      files: [testMediaFiles[1]],
    });
  });

  it("should call send with REMOVE_FILE when removeFile is called", () => {
    const { getByTestId } = render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Кликаем на кнопку удаления файла
    getByTestId("remove-button").click();

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "REMOVE_FILE",
      path: testMediaFiles[0].path,
    });
  });

  it("should call send with CLEAR_FILES when clearFiles is called", () => {
    const { getByTestId } = render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Кликаем на кнопку очистки файлов
    getByTestId("clear-button").click();

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "CLEAR_FILES",
    });
  });

  it("should call send with RELOAD when reload is called", () => {
    const { getByTestId } = render(
      <MediaProvider>
        <TestComponent />
      </MediaProvider>,
    );

    // Кликаем на кнопку перезагрузки
    getByTestId("reload-button").click();

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "RELOAD",
    });
  });
});

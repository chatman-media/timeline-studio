import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";

import { ImagePreview } from "../../../components/preview/image-preview";

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi
    .fn()
    .mockImplementation((path: string) => `converted-${path}`),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

// Мокаем компоненты, которые используются в ImagePreview
vi.mock("../layout/add-media-button", () => ({
  AddMediaButton: ({ file, onAddMedia, isAdded, size }: any) => (
    <button
      data-testid="add-media-button"
      data-file={file.name}
      data-is-added={isAdded}
      data-size={size}
      onClick={(e) => onAddMedia(e, file)}
    >
      Add Media
    </button>
  ),
}));

vi.mock("../layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <button
      data-testid="favorite-button"
      data-file={file.name}
      data-size={size}
      data-type={type}
    >
      Favorite
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  Image: ({ path, className, size }: any) => (
    <div
      data-testid="lucide-image"
      data-path={path}
      data-class-name={className}
      data-size={size}
    >
      Image Icon
    </div>
  ),
  Star: ({ className, strokeWidth }: any) => (
    <div
      data-testid="lucide-star"
      data-class-name={className}
      data-stroke-width={strokeWidth}
    >
      Star Icon
    </div>
  ),
  Plus: ({ className, strokeWidth }: any) => (
    <div
      data-testid="lucide-plus"
      data-class-name={className}
      data-stroke-width={strokeWidth}
    >
      Plus Icon
    </div>
  ),
}));

describe("ImagePreview", () => {
  const imageFile: MediaFile = {
    id: "image1",
    name: "image.jpg",
    path: "/path/to/image.jpg",
    isVideo: false,
    isAudio: false,
    isImage: true,
  };

  it("should render correctly with default props", () => {
    render(<ImagePreview file={imageFile} />);

    // Отладка: выводим HTML
    screen.debug();

    // Проверяем, что компонент рендерится
    expect(screen.getByRole("img")).toBeInTheDocument();

    // Проверяем, что иконка изображения отображается
    const imageIcon = screen.getByTestId("lucide-image");
    expect(imageIcon).toBeInTheDocument();

    // Проверяем, что имя файла не отображается
    expect(screen.queryByText("image.jpg")).not.toBeInTheDocument();

    // Проверяем, что кнопка избранного отображается
    const favoriteButton = screen.getByTitle("browser.media.addToFavorites");
    expect(favoriteButton).toBeInTheDocument();

    // Проверяем, что кнопка добавления не отображается
    expect(screen.queryByTestId("add-media-button")).not.toBeInTheDocument();
  });

  it("should show filename when showFileName is true", () => {
    render(<ImagePreview file={imageFile} showFileName />);

    // Проверяем, что имя файла отображается
    expect(screen.getByText("image.jpg")).toBeInTheDocument();
  });

  it("should render with custom size and dimensions", () => {
    render(<ImagePreview file={imageFile} size={120} dimensions={[4, 3]} />);

    // Проверяем, что иконка имеет больший размер
    const imageIcons = screen.getAllByTestId("lucide-image");
    const smallIcon = imageIcons.find(
      (icon) => icon.getAttribute("data-size") === "16",
    );
    expect(smallIcon).toBeDefined();

    // Проверяем, что кнопка избранного отображается
    const favoriteButton = screen.getByTitle("browser.media.addToFavorites");
    expect(favoriteButton).toBeInTheDocument();
  });

  it("should render add media button when onAddMedia is provided", () => {
    const onAddMedia = vi.fn();
    render(
      <ImagePreview file={imageFile} onAddMedia={onAddMedia} isAdded={false} />,
    );

    // Проверяем, что кнопка добавления отображается
    const addButton = screen.getByTitle("browser.media.add");
    expect(addButton).toBeInTheDocument();

    // Проверяем, что при клике вызывается onAddMedia
    act(() => {
      act(() => {
        fireEvent.click(addButton);
      });
    });
    expect(onAddMedia).toHaveBeenCalledWith(expect.anything(), imageFile);
  });
});

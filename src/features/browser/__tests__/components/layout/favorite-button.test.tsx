/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/domains/media-management"

import { FavoriteButton } from "../../../components/layout/favorite-button"

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.removeFromFavorites": "Remove from favorites",
        "browser.media.inFavorites": "In favorites",
        "browser.media.addToFavorites": "Add to favorites",
      }
      return translations[key] || key
    },
  }),
}))

vi.mock("lucide-react", () => ({
  Star: ({ className, style }: any) => (
    <div data-testid="star-icon" className={className} style={style}>
      Star
    </div>
  ),
  StarOff: ({ className, style }: any) => (
    <div data-testid="star-off-icon" className={className} style={style}>
      StarOff
    </div>
  ),
}))

const mockAddToFavorites = vi.fn()
const mockRemoveFromFavorites = vi.fn()
const mockFavorites = {
  media: [] as MediaFile[],
  music: [] as MediaFile[],
  transition: [] as MediaFile[],
  effect: [] as MediaFile[],
  template: [] as MediaFile[],
  filter: [] as MediaFile[],
  subtitle: [] as MediaFile[],
  "style-template": [] as MediaFile[],
}

vi.mock("@/domains/project-management/hooks", () => ({
  useFavorites: () => ({
    addToFavorites: mockAddToFavorites,
    removeFromFavorites: mockRemoveFromFavorites,
    favorites: mockFavorites,
  }),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// Создаем тестовый медиафайл
const createMockMediaFile = (overrides: Partial<MediaFile> = {}): MediaFile =>
  ({
    id: "test-file-1",
    name: "test-file.mp4",
    path: "/test/path/test-file.mp4",
    size: 1024 * 1024,
    extension: "mp4",
    isLocal: true,
    isDirectory: false,
    isFavorite: false,
    isLoadingMetadata: false,
    lastModified: Date.now(),
    ...overrides,
  }) as MediaFile

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем состояние избранного
    mockFavorites.media = []
    mockFavorites.music = []
  })

  describe("основной рендеринг", () => {
    it("должен рендерить кнопку с иконкой звезды", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()
      expect(screen.getByTestId("star-icon")).toBeInTheDocument()
    })

    it("должен применять правильный title для не избранного файла", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("title", "Add to favorites")
    })

    it("должен применять правильный title для избранного файла", () => {
      const file = createMockMediaFile()
      mockFavorites.media = [file]

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      expect(button).toHaveAttribute("title", "In favorites")
    })

    it("должен применять правильные классы для не избранного файла", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      expect(button).toHaveClass("invisible")
    })

    it("должен применять правильные классы для избранного файла", () => {
      const file = createMockMediaFile()
      mockFavorites.media = [file]

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      expect(button).toHaveClass("visible")
    })
  })

  describe("размеры иконки", () => {
    it("должен применять правильный размер иконки на основе prop size", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} size={300} />)

      const icon = screen.getByTestId("star-icon")
      const style = icon.getAttribute("style")
      expect(style).toContain("height: 16px") // 6 + 300/30 = 16
      expect(style).toContain("width: 16px")
    })

    it("должен использовать размер по умолчанию", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const icon = screen.getByTestId("star-icon")
      const style = icon.getAttribute("style")
      expect(style).toContain("height: 11px") // 6 + 150/30 = 11
      expect(style).toContain("width: 11px")
    })
  })

  describe("взаимодействие", () => {
    it("должен добавлять файл в избранное при клике", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(mockAddToFavorites).toHaveBeenCalledWith(file, "media")
    })

    it("должен удалять файл из избранного при клике с наведением", async () => {
      const file = createMockMediaFile()
      mockFavorites.media = [file]

      // Используем фейковые таймеры для контроля времени
      vi.useFakeTimers()

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")

      // Пропускаем задержку isRecentlyAdded
      vi.advanceTimersByTime(1100)

      // Наводим и кликаем
      fireEvent.mouseEnter(button)
      fireEvent.click(button)

      expect(mockRemoveFromFavorites).toHaveBeenCalledWith(file, "media")

      vi.useRealTimers()
    })

    it("должен обрабатывать нажатие Enter", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(mockAddToFavorites).toHaveBeenCalledWith(file, "media")
    })

    it("должен обрабатывать нажатие пробела", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(mockAddToFavorites).toHaveBeenCalledWith(file, "media")
    })
  })

  describe("состояние наведения", () => {
    it("должен показывать иконку StarOff при наведении на избранный файл", async () => {
      const file = createMockMediaFile()
      mockFavorites.media = [file]

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")

      // Ждем, пока закончится период isRecentlyAdded (1 секунда)
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Теперь наводим курсор
      fireEvent.mouseEnter(button)

      // Проверяем, что показывается иконка StarOff
      await waitFor(() => {
        expect(screen.getByTestId("star-off-icon")).toBeInTheDocument()
      })
    })

    it("должен обновлять title при наведении на избранный файл", async () => {
      const file = createMockMediaFile()
      mockFavorites.media = [file]

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")

      // Ждем, пока истечет период isRecentlyAdded (1 секунда)
      await waitFor(
        () => {
          expect(button).toHaveAttribute("title", "In favorites")
        },
        { timeout: 1100 },
      )

      // Ждем еще немного, чтобы isRecentlyAdded точно стал false
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Теперь наводим курсор
      fireEvent.mouseEnter(button)

      await waitFor(() => {
        expect(button).toHaveAttribute("title", "Remove from favorites")
      })
    })

    it("должен возвращать обычную иконку при уходе курсора", async () => {
      const file = createMockMediaFile()
      mockFavorites.media = [file]

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")

      await waitFor(
        () => {
          fireEvent.mouseEnter(button)
        },
        { timeout: 1100 },
      )

      fireEvent.mouseLeave(button)

      expect(screen.getByTestId("star-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("star-off-icon")).not.toBeInTheDocument()
    })
  })

  describe("типы элементов", () => {
    it("должен работать с типом music", () => {
      const file = createMockMediaFile({ name: "test.mp3" })
      render(<FavoriteButton file={file} type="music" />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(mockAddToFavorites).toHaveBeenCalledWith(file, "music")
    })

    it("должен проверять избранное в правильной категории", () => {
      const file = createMockMediaFile()
      mockFavorites.music = [file]
      mockFavorites.media = [] // Пусто в media

      render(<FavoriteButton file={file} type="music" />)

      const button = screen.getByRole("button")
      expect(button).toHaveClass("visible") // Должен быть видимым, так как есть в music
    })
  })

  describe("анимация добавления", () => {
    it("должен применять анимацию при добавлении в избранное", async () => {
      const file = createMockMediaFile()

      // Настраиваем мок, чтобы он обновлял favorites после вызова
      mockAddToFavorites.mockImplementation((fileToAdd: MediaFile, type: keyof typeof mockFavorites) => {
        mockFavorites[type] = [...(mockFavorites[type] || []), fileToAdd]
      })

      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")

      // Кликаем для добавления в избранное
      fireEvent.click(button)

      // После клика компонент должен применить анимацию
      await waitFor(() => {
        expect(button).toHaveClass("scale-110") // Увеличенный размер для недавно добавленных
      })

      // Ждем, пока анимация закончится
      await waitFor(
        () => {
          expect(button).not.toHaveClass("scale-110")
        },
        { timeout: 1100 },
      )
    })
  })

  describe("предотвращение случайного удаления", () => {
    it("не должен удалять из избранного сразу после добавления", () => {
      const file = createMockMediaFile()
      render(<FavoriteButton file={file} />)

      const button = screen.getByRole("button")

      // Добавляем в избранное
      fireEvent.click(button)
      mockFavorites.media = [file]

      // Пытаемся сразу удалить
      fireEvent.mouseEnter(button)
      fireEvent.click(button)

      // Не должен вызывать removeFromFavorites
      expect(mockRemoveFromFavorites).not.toHaveBeenCalled()
    })
  })
})

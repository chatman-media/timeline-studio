import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/features/media"

import { StatusBar } from "../../../components/layout/status-bar"

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.addAllVideo": "Add all video files",
        "browser.media.addAllAudio": "Add all audio files",
        "browser.media.addDate": "Add files from date",
        "browser.media.addAll": "Add all",
        "browser.media.video": "video",
        "browser.media.audio": "audio",
        "common.allFilesAdded": "All files added",
      }
      return translations[key] || key
    },
  }),
}))

vi.mock("lucide-react", () => ({
  CopyPlus: ({ size }: { size: number }) => (
    <div data-testid="copy-plus-icon" data-size={size}>
      CopyPlus
    </div>
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, title, ...props }: any) => (
    <button className={className} onClick={onClick} disabled={disabled} title={title} data-testid="button" {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/features/media", () => ({
  getRemainingMediaCounts: vi.fn((media: MediaFile[], addedFilesSet: Set<string>) => {
    const remainingFiles = media.filter((file) => !addedFilesSet.has(file.path))
    const remainingVideoCount = remainingFiles.filter(
      (file) => file.path.split(".").pop() === "mp4" || file.path.split(".").pop() === "mov",
    ).length
    const remainingAudioCount = remainingFiles.filter(
      (file) => file.path.split(".").pop() === "mp3" || file.path.split(".").pop() === "wav",
    ).length
    return {
      remainingVideoCount,
      remainingAudioCount,
      allFilesAdded: remainingFiles.length === 0,
    }
  }),
  getTopDateWithRemainingFiles: vi.fn((sortedDates, addedFilesSet) => {
    for (const dateGroup of sortedDates) {
      const remainingFiles = dateGroup.files.filter((file: MediaFile) => !addedFilesSet.has(file.path))
      if (remainingFiles.length > 0) {
        return {
          date: dateGroup.date,
          files: dateGroup.files,
          remainingFiles,
        }
      }
    }
    return null
  }),
}))

// Создаем тестовые данные
const createMockMediaFile = (overrides: Partial<MediaFile> = {}): MediaFile =>
  ({
    id: `file-${Math.random()}`,
    name: "test-file.mp4",
    path: `/test/path/test-file-${Math.random()}.mp4`,
    size: 1024 * 1024,
    extension: "mp4",
    isLocal: true,
    isDirectory: false,
    isFavorite: false,
    isLoadingMetadata: false,
    lastModified: Date.now(),
    duration: 120,
    ...overrides,
  }) as MediaFile

describe("StatusBar", () => {
  const mockOnAddAllVideoFiles = vi.fn()
  const mockOnAddAllAudioFiles = vi.fn()
  const mockOnAddDateFiles = vi.fn()
  const mockOnAddAllFiles = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    media: [],
    onAddAllVideoFiles: mockOnAddAllVideoFiles,
    onAddAllAudioFiles: mockOnAddAllAudioFiles,
    onAddDateFiles: mockOnAddDateFiles,
    onAddAllFiles: mockOnAddAllFiles,
    sortedDates: [],
    addedFiles: [],
  }

  describe("основной рендеринг", () => {
    it("должен отображать сообщение когда все файлы добавлены", () => {
      const media = [createMockMediaFile({ path: "/video1.mp4" }), createMockMediaFile({ path: "/video2.mp4" })]

      render(<StatusBar {...defaultProps} media={media} addedFiles={media} />)

      expect(screen.getByText("All files added")).toBeInTheDocument()
      expect(screen.queryByText("Add all")).not.toBeInTheDocument()
    })

    it("должен отображать кнопку добавления всех файлов", () => {
      const media = [createMockMediaFile({ path: "/video1.mp4" }), createMockMediaFile({ path: "/video2.mp4" })]

      render(<StatusBar {...defaultProps} media={media} addedFiles={[]} />)

      const addAllButton = screen.getByText("Add all").closest("button")
      expect(addAllButton).toBeInTheDocument()
    })
  })

  describe("кнопки добавления по типу", () => {
    it("должен отображать кнопку добавления видео файлов", () => {
      const media = [
        createMockMediaFile({ path: "/file.mp4" }),
        createMockMediaFile({ path: "/file.mov" }),
        createMockMediaFile({ path: "/file.mp3" }),
      ]

      render(<StatusBar {...defaultProps} media={media} addedFiles={[]} />)

      expect(screen.getByText(/2 video/)).toBeInTheDocument()
    })

    it("должен отображать кнопку добавления аудио файлов", () => {
      const media = [
        createMockMediaFile({ path: "/file.mp3" }),
        createMockMediaFile({ path: "/file.wav" }),
        createMockMediaFile({ path: "/file.mp4" }),
      ]

      render(<StatusBar {...defaultProps} media={media} addedFiles={[]} />)

      expect(screen.getByText(/2 audio/)).toBeInTheDocument()
    })

    it("не должен отображать кнопки для добавленных файлов", () => {
      const videoFile = createMockMediaFile({ path: "/video1.mp4" })
      const audioFile = createMockMediaFile({ path: "/audio1.mp3" })

      render(<StatusBar {...defaultProps} media={[videoFile, audioFile]} addedFiles={[videoFile, audioFile]} />)

      expect(screen.queryByText(/video/)).not.toBeInTheDocument()
      expect(screen.queryByText(/audio/)).not.toBeInTheDocument()
    })
  })

  describe("добавление по дате", () => {
    it("должен отображать кнопку добавления файлов по дате", () => {
      const files = [createMockMediaFile({ path: "/video1.mp4" }), createMockMediaFile({ path: "/video2.mp4" })]

      const sortedDates = [
        {
          date: "2025-06-25",
          files: files,
        },
      ]

      render(<StatusBar {...defaultProps} media={files} sortedDates={sortedDates} addedFiles={[]} />)

      expect(screen.getByText(/2 video 2025-06-25/)).toBeInTheDocument()
    })

    it("не должен отображать кнопку даты если все файлы за эту дату добавлены", () => {
      const files = [createMockMediaFile({ path: "/video1.mp4" }), createMockMediaFile({ path: "/video2.mp4" })]

      const sortedDates = [
        {
          date: "2025-06-25",
          files: files,
        },
      ]

      render(<StatusBar {...defaultProps} media={files} sortedDates={sortedDates} addedFiles={files} />)

      expect(screen.queryByText(/2025-06-25/)).not.toBeInTheDocument()
    })
  })

  describe("обработчики событий", () => {
    it("должен вызывать onAddAllVideoFiles при клике", () => {
      const media = [createMockMediaFile({ path: "/file.mp4" }), createMockMediaFile({ path: "/file.mov" })]

      render(<StatusBar {...defaultProps} media={media} addedFiles={[]} />)

      const videoButton = screen.getByText(/2 video/).closest("button")
      fireEvent.click(videoButton!)

      expect(mockOnAddAllVideoFiles).toHaveBeenCalled()
    })

    it("должен вызывать onAddAllAudioFiles при клике", () => {
      const media = [createMockMediaFile({ path: "/file.mp3" }), createMockMediaFile({ path: "/file.wav" })]

      render(<StatusBar {...defaultProps} media={media} addedFiles={[]} />)

      const audioButton = screen.getByText(/2 audio/).closest("button")
      fireEvent.click(audioButton!)

      expect(mockOnAddAllAudioFiles).toHaveBeenCalled()
    })

    it("должен вызывать onAddDateFiles с правильными файлами", () => {
      const files = [createMockMediaFile({ path: "/video1.mp4" }), createMockMediaFile({ path: "/video2.mp4" })]

      const sortedDates = [
        {
          date: "2025-06-25",
          files: files,
        },
      ]

      render(<StatusBar {...defaultProps} media={files} sortedDates={sortedDates} addedFiles={[]} />)

      const dateButton = screen.getByText(/2025-06-25/).closest("button")
      fireEvent.click(dateButton!)

      expect(mockOnAddDateFiles).toHaveBeenCalledWith(files)
    })

    it("должен вызывать onAddAllFiles при клике", () => {
      const media = [createMockMediaFile({ path: "/file.mp4" }), createMockMediaFile({ path: "/file.mp3" })]

      render(<StatusBar {...defaultProps} media={media} addedFiles={[]} />)

      const addAllButton = screen.getByText("Add all").closest("button")
      fireEvent.click(addAllButton!)

      expect(mockOnAddAllFiles).toHaveBeenCalled()
    })
  })

  describe("комплексные сценарии", () => {
    it("должен корректно обрабатывать частично добавленные файлы", () => {
      const video1 = createMockMediaFile({ path: "/video1.mp4" })
      const video2 = createMockMediaFile({ path: "/video2.mp4" })
      const audio1 = createMockMediaFile({ path: "/audio1.mp3" })

      const media = [video1, video2, audio1]
      const addedFiles = [video1] // Только один видео файл добавлен

      render(<StatusBar {...defaultProps} media={media} addedFiles={addedFiles} />)

      // Должна показывать 1 оставшийся видео файл
      expect(screen.getByText(/1 video/)).toBeInTheDocument()
      // Должна показывать 1 аудио файл
      expect(screen.getByText(/1 audio/)).toBeInTheDocument()
      // Не должна показывать "All files added"
      expect(screen.queryByText("All files added")).not.toBeInTheDocument()
    })

    it("должен правильно работать с множественными датами", () => {
      const files1 = [createMockMediaFile({ path: "/video1.mp4" }), createMockMediaFile({ path: "/video2.mp4" })]

      const files2 = [createMockMediaFile({ path: "/video3.mp4" }), createMockMediaFile({ path: "/video4.mp4" })]

      const sortedDates = [
        { date: "2025-06-25", files: files1 },
        { date: "2024-01-16", files: files2 },
      ]

      render(
        <StatusBar
          {...defaultProps}
          media={[...files1, ...files2]}
          sortedDates={sortedDates}
          addedFiles={files1} // Первая дата полностью добавлена
        />,
      )

      // Должна показывать только вторую дату
      expect(screen.getByText(/2024-01-16/)).toBeInTheDocument()
      expect(screen.queryByText(/2025-06-25/)).not.toBeInTheDocument()
    })
  })
})

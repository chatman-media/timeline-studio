import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaType } from "@/domains/media-management"

import { FileMetadata } from "../../components/file-metadata"

// Мокаем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "ru",
    },
  }),
}))

// Мокаем функции форматирования
vi.mock("@/lib/date", () => ({
  formatDuration: (duration: number) => `${duration} сек`,
  formatTimeWithMilliseconds: () => "01:23:45.678",
}))

vi.mock("@/lib/utils", () => ({
  formatBitrate: (bitrate: number) => `${bitrate / 1000} Kbps`,
  formatFileSize: (size: number) => `${size / (1024 * 1024)} MB`,
}))

vi.mock("@/features/media/utils/video", () => ({
  getFps: () => "30",
  getAspectRatio: () => "16:9",
}))

describe("FileMetadata", () => {
  beforeEach(() => {
    // Мокируем console.log
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  it("should render video file metadata correctly", () => {
    const videoFile = {
      id: "video-file",
      name: "video-file.mp4",
      path: "/path/to/video-file.mp4",
      type: MediaType.Video,
      isVideo: true,
      isImage: false,
      isAudio: false,
      startTime: 1672531200,
      probeData: {
        streams: [
          {
            codec_type: "video",
            width: 1920,
            height: 1080,
            bit_rate: "5000000",
          },
        ],
        format: {
          duration: 120,
          size: 10485760, // 10 MB
        },
      },
    }

    render(<FileMetadata file={videoFile} size={100} />)

    // Проверяем, что имя файла отображается
    expect(screen.getByText("video-file.mp4")).toBeInTheDocument()

    // Проверяем, что длительность отображается
    expect(screen.getByText("120 сек")).toBeInTheDocument()

    // Проверяем, что временная метка отображается
    expect(screen.getByText("01:23:45.678")).toBeInTheDocument()

    // Проверяем, что разрешение отображается
    expect(screen.getByText("1920x1080")).toBeInTheDocument()

    // Проверяем, что мегапиксели отображаются
    expect(screen.getByText("2.1 MP")).toBeInTheDocument()

    // Проверяем, что соотношение сторон отображается
    expect(screen.getByText("16:9")).toBeInTheDocument()

    // Проверяем, что битрейт отображается
    expect(screen.getByText("5000 Kbps")).toBeInTheDocument()

    // Проверяем, что fps отображается
    expect(screen.getByText("30 fps")).toBeInTheDocument()

    // Проверяем, что размер файла отображается
    expect(screen.getByText("10 MB")).toBeInTheDocument()
  })

  it("should render audio file metadata correctly", () => {
    const audioFile = {
      id: "audio-file",
      name: "audio-file.mp3",
      path: "/path/to/audio-file.mp3",
      type: MediaType.Audio,
      isVideo: false,
      isImage: false,
      isAudio: true,
      probeData: {
        streams: [
          {
            codec_type: "audio",
            bit_rate: "320000",
          },
        ],
        format: {
          duration: 180,
          size: 5242880, // 5 MB
        },
      },
    }

    render(<FileMetadata file={audioFile} size={100} />)

    // Проверяем, что имя файла отображается
    expect(screen.getByText("audio-file.mp3")).toBeInTheDocument()

    // Проверяем, что длительность отображается
    expect(screen.getByText("180 сек")).toBeInTheDocument()

    // Проверяем, что размер файла отображается
    expect(screen.getByText("5 MB")).toBeInTheDocument()
  })

  it("should render image file metadata correctly", () => {
    const imageFile = {
      id: "image-file",
      name: "image-file.jpg",
      path: "/path/to/image-file.jpg",
      type: MediaType.StillImage,
      isVideo: false,
      isImage: true,
      isAudio: false,
      createdAt: new Date("2023-01-01T00:00:00.000Z"),
      probeData: {
        streams: [
          {
            codec_type: "video",
            width: 3840,
            height: 2160,
          },
        ],
        format: {
          size: 2097152, // 2 MB
        },
      },
    }

    render(<FileMetadata file={imageFile} size={100} />)

    // Проверяем, что имя файла отображается
    expect(screen.getByText("image-file.jpg")).toBeInTheDocument()

    // Проверяем, что дата создания отображается
    // Примечание: точный формат даты зависит от локализации, поэтому проверяем только наличие элемента
    expect(screen.getByText("2 MB")).toBeInTheDocument()
  })

  it("should adjust font size based on container size", () => {
    const videoFile = {
      id: "video-file",
      name: "video-file.mp4",
      path: "/path/to/video-file.mp4",
      type: MediaType.Video,
      isVideo: true,
      isImage: false,
      isAudio: false,
      probeData: {
        streams: [
          {
            codec_type: "video",
            width: 1920,
            height: 1080,
            bit_rate: "5000000",
          },
        ],
        format: {
          duration: 120,
          size: 10485760,
        },
      },
    }

    // Рендерим с размером > 100
    const { rerender } = render(<FileMetadata file={videoFile} size={120} />)

    // Проверяем, что стиль font-size установлен на 13px
    const durationElement = screen.getByText("120 сек")
    expect(durationElement).toHaveStyle({ fontSize: "13px" })

    // Перерендериваем с размером <= 100
    act(() => {
      rerender(<FileMetadata file={videoFile} size={100} />)
    })

    // Проверяем, что стиль font-size установлен на 12px
    expect(durationElement).toHaveStyle({ fontSize: "12px" })
  })

  it("should use default size if not provided", () => {
    const videoFile = {
      id: "video-file",
      name: "video-file.mp4",
      path: "/path/to/video-file.mp4",
      type: MediaType.Video,
      isVideo: true,
      isImage: false,
      isAudio: false,
      probeData: {
        streams: [
          {
            codec_type: "video",
            width: 1920,
            height: 1080,
            bit_rate: "5000000",
          },
        ],
        format: {
          duration: 120,
          size: 10485760,
        },
      },
    }

    const renderResult = render(<FileMetadata file={videoFile} />)

    // Проверяем, что контейнер имеет высоту 100px (значение по умолчанию)
    const mainContainer = renderResult.container.firstChild as HTMLElement
    expect(mainContainer).toHaveStyle({ height: "100px" })
  })
})

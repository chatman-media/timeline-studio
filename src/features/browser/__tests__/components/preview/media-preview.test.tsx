/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@timeline-studio/domains/media-management"
import { MediaType } from "@timeline-studio/domains/media-management"

import { MediaPreview } from "../../../components/preview/media-preview"

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: any) => (
    <div data-testid="loader" className={className} data-oid="jqpyff:">
      Loading...
    </div>
  ),
}))

// Мокаем cn функцию
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// Мокаем компоненты для разных типов медиа
vi.mock("../../../components/preview/video-preview", () => ({
  VideoPreview: ({ file, size, showFileName, dimensions, ignoreRatio }: any) => (
    <div
      data-testid="video-preview"
      data-file={file.name}
      data-size={size}
      data-show-filename={showFileName}
      data-dimensions={dimensions.join(",")}
      data-ignore-ratio={ignoreRatio}
      data-oid="yyuwdmd"
    >
      Video Preview
    </div>
  ),
}))

vi.mock("../../../components/preview/audio-preview", () => ({
  AudioPreview: ({ file, size, showFileName, dimensions }: any) => (
    <div
      data-testid="audio-preview"
      data-file={file.name}
      data-size={size}
      data-show-filename={showFileName}
      data-dimensions={dimensions.join(",")}
      data-oid="_mqo:vh"
    >
      Audio Preview
    </div>
  ),
}))

vi.mock("../../../components/preview/image-preview", () => ({
  ImagePreview: ({ file, size, showFileName, dimensions }: any) => (
    <div
      data-testid="image-preview"
      data-file={file.name}
      data-size={size}
      data-show-filename={showFileName}
      data-dimensions={dimensions.join(",")}
      data-oid=":9mn:a_"
    >
      Image Preview
    </div>
  ),
}))

describe("MediaPreview", () => {
  // Создаем моки для разных типов файлов
  const videoFile: MediaFile = {
    id: "video1",
    name: "video.mp4",
    path: "/path/to/video.mp4",
    type: MediaType.VideoWithAudio,
    isVideo: true,
    isAudio: false,
    isImage: false,
  }

  const audioFile: MediaFile = {
    id: "audio1",
    name: "audio.mp3",
    path: "/path/to/audio.mp3",
    type: MediaType.Audio,
    isVideo: false,
    isAudio: true,
    isImage: false,
  }

  const imageFile: MediaFile = {
    id: "image1",
    name: "image.jpg",
    path: "/path/to/image.jpg",
    type: MediaType.StillImage,
    isVideo: false,
    isAudio: false,
    isImage: true,
  }

  it("should render VideoPreview for video files", () => {
    render(<MediaPreview file={videoFile} data-oid="j2e3-v8" />)

    const videoPreview = screen.getByTestId("video-preview")
    expect(videoPreview).toBeInTheDocument()
    expect(videoPreview).toHaveAttribute("data-file", "video.mp4")
    expect(videoPreview).toHaveAttribute("data-size", "200") // Default size
    expect(videoPreview).toHaveAttribute("data-show-filename", "false") // Default showFileName
    expect(videoPreview).toHaveAttribute("data-dimensions", "16,9") // Default dimensions
    expect(videoPreview).toHaveAttribute("data-ignore-ratio", "false") // Default ignoreRatio
  })

  it("should render AudioPreview for audio files", () => {
    render(<MediaPreview file={audioFile} data-oid="0q1zfsh" />)

    const audioPreview = screen.getByTestId("audio-preview")
    expect(audioPreview).toBeInTheDocument()
    expect(audioPreview).toHaveAttribute("data-file", "audio.mp3")
  })

  it("should render ImagePreview for image files", () => {
    render(<MediaPreview file={imageFile} data-oid="e74c0jq" />)

    const imagePreview = screen.getByTestId("image-preview")
    expect(imagePreview).toBeInTheDocument()
    expect(imagePreview).toHaveAttribute("data-file", "image.jpg")
  })

  it("should pass custom props to child components", () => {
    render(<MediaPreview file={videoFile} size={150} showFileName dimensions={[4, 3]} ignoreRatio data-oid="t2qvlr3" />)

    const videoPreview = screen.getByTestId("video-preview")
    expect(videoPreview).toHaveAttribute("data-size", "150")
    expect(videoPreview).toHaveAttribute("data-show-filename", "true")
    expect(videoPreview).toHaveAttribute("data-dimensions", "4,3")
    expect(videoPreview).toHaveAttribute("data-ignore-ratio", "true")
  })
})

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Import mocks before components
import "../../../__mocks__/hooks"

import { SubtitleClip } from "@/features/subtitles/types/subtitles"
import { Clip } from "../../../components/clip/clip"
import type { TimelineClip, TimelineTrack } from "../../../types"

// Мокаем дочерние компоненты
vi.mock("../../../components/clip/video-clip", () => ({
  VideoClip: ({ clip, track }: any) => (
    <div data-testid="video-clip" data-clip-id={clip.id} data-track-type={track.type}>
      Video Clip
    </div>
  ),
}))

vi.mock("../../../components/clip/audio-clip", () => ({
  AudioClip: ({ clip, track }: any) => (
    <div data-testid="audio-clip" data-clip-id={clip.id} data-track-type={track.type}>
      Audio Clip
    </div>
  ),
}))

vi.mock("../../../components/clip/subtitle-clip", () => ({
  SubtitleClip: ({ clip, trackHeight, isSelected }: any) => (
    <div
      data-testid="subtitle-clip"
      data-clip-id={clip.id}
      data-track-height={trackHeight}
      data-is-selected={isSelected}
    >
      Subtitle Clip
    </div>
  ),
}))

// Мокаем компоненты редактирования
vi.mock("../../../components/clip/clip-trim-handles", () => ({
  ClipTrimHandles: () => null,
}))

vi.mock("../../../components/edit-tools/slip-slide-handles", () => ({
  SlipSlideHandles: () => null,
}))

vi.mock("../../../components/edit-tools/rate-stretch-handle", () => ({
  RateStretchHandle: () => null,
}))

describe("Clip", () => {
  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()

  const baseClip: TimelineClip = {
    id: "clip-1",
    trackId: "track-1",
    startTime: 5,
    duration: 10,
    volume: 1,
    isSelected: false,
    isLocked: false,
    name: "",
    mediaId: "",
    mediaStartTime: 0,
    mediaEndTime: 0,
    offset: 0,
    speed: 0,
    isReversed: false,
    opacity: 0,
    effects: [],
    filters: [],
    transitions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const baseTrack: TimelineTrack = {
    id: "track-1",
    sectionId: "section-1",
    type: "video",
    name: "Video Track 1",
    height: 100,
    isLocked: false,
    isMuted: false,
    clips: [],
    order: 0,
    transitions: [],
    isHidden: false,
    isSolo: false,
    volume: 0,
    pan: 0,
    trackEffects: [],
    trackFilters: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Позиционирование и размеры", () => {
    it("должен правильно вычислять позицию клипа", () => {
      render(<Clip clip={baseClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement).toHaveStyle({ left: "50px" }) // 5 секунд * 10 пикселей/сек
    })

    it("должен правильно вычислять ширину клипа", () => {
      render(<Clip clip={baseClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement).toHaveStyle({ width: "100px" }) // 10 секунд * 10 пикселей/сек
    })

    it("должен применять минимальную ширину для маленьких клипов", () => {
      const smallClip = { ...baseClip, duration: 0.5 }
      render(<Clip clip={smallClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement).toHaveStyle({ width: "20px" }) // Минимальная ширина
    })

    it("должен обновлять позицию при изменении timeScale", () => {
      const { rerender } = render(
        <Clip clip={baseClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      let clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement).toHaveStyle({ left: "50px", width: "100px" })

      rerender(
        <Clip clip={baseClip} track={baseTrack} timeScale={20} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement).toHaveStyle({ left: "100px", width: "200px" })
    })
  })

  describe("Рендеринг различных типов клипов", () => {
    it("должен рендерить VideoClip для video трека", () => {
      render(<Clip clip={baseClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      expect(screen.getByTestId("video-clip")).toBeInTheDocument()
      expect(screen.getByTestId("video-clip")).toHaveAttribute("data-clip-id", "clip-1")
      expect(screen.getByTestId("video-clip")).toHaveAttribute("data-track-type", "video")
    })

    it("должен рендерить VideoClip для image трека", () => {
      const imageTrack = { ...baseTrack, type: "image" as const }
      render(<Clip clip={baseClip} track={imageTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      expect(screen.getByTestId("video-clip")).toBeInTheDocument()
    })

    it("должен рендерить AudioClip для audio трека", () => {
      const audioTrack = { ...baseTrack, type: "audio" as const }
      render(<Clip clip={baseClip} track={audioTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      expect(screen.getByTestId("audio-clip")).toBeInTheDocument()
      expect(screen.getByTestId("audio-clip")).toHaveAttribute("data-track-type", "audio")
    })

    it("должен рендерить AudioClip для различных аудио треков", () => {
      const audioTypes = ["music", "voiceover", "sfx", "ambient"] as const

      audioTypes.forEach((type) => {
        const { unmount } = render(
          <Clip
            clip={baseClip}
            track={{ ...baseTrack, type }}
            timeScale={10}
            onUpdate={mockOnUpdate}
            onRemove={mockOnRemove}
          />,
        )

        expect(screen.getByTestId("audio-clip")).toBeInTheDocument()
        expect(screen.getByTestId("audio-clip")).toHaveAttribute("data-track-type", type)
        unmount()
      })
    })

    it("должен рендерить SubtitleClip для subtitle трека", () => {
      const subtitleTrack = { ...baseTrack, type: "subtitle" as const }
      const subtitleClip: SubtitleClip = {
        ...baseClip,
        type: "subtitle",
        text: "Test subtitle",
        style: {},
      }

      render(
        <Clip
          clip={subtitleClip}
          track={subtitleTrack}
          timeScale={10}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByTestId("subtitle-clip")).toBeInTheDocument()
      expect(screen.getByTestId("subtitle-clip")).toHaveAttribute("data-track-height", "100")
      expect(screen.getByTestId("subtitle-clip")).toHaveAttribute("data-is-selected", "false")
    })

    it("должен рендерить SubtitleClip для title трека", () => {
      const titleTrack = { ...baseTrack, type: "title" as const }
      const titleClip: SubtitleClip = {
        ...baseClip,
        type: "subtitle",
        text: "Test title",
        style: {},
      }

      render(
        <Clip clip={titleClip} track={titleTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByTestId("subtitle-clip")).toBeInTheDocument()
    })

    it("должен показывать ошибку для невалидного subtitle клипа", () => {
      const subtitleTrack = { ...baseTrack, type: "subtitle" as const }
      // baseClip не имеет поля text, поэтому не является SubtitleClip

      render(
        <Clip clip={baseClip} track={subtitleTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByText("Invalid subtitle clip")).toBeInTheDocument()
    })

    it("должен показывать placeholder для неизвестного типа трека", () => {
      const unknownTrack = { ...baseTrack, type: "unknown" as any }

      render(
        <Clip clip={baseClip} track={unknownTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      expect(screen.getByText("unknown")).toBeInTheDocument()
    })
  })

  describe("Состояния клипа", () => {
    it("должен применять стили для выделенного клипа", () => {
      const selectedClip = { ...baseClip, isSelected: true }
      render(
        <Clip clip={selectedClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement.className).toMatch(/ring-2/)
      expect(clipElement.className).toMatch(/ring-primary/)
    })

    it("должен применять стили для заблокированного клипа", () => {
      const lockedClip = { ...baseClip, isLocked: true }
      render(
        <Clip clip={lockedClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
      )

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement.className).toMatch(/opacity-60/)
      expect(clipElement.className).toMatch(/cursor-not-allowed/)
    })

    it("должен передавать isSelected в SubtitleClip", () => {
      const subtitleTrack = { ...baseTrack, type: "subtitle" as const }
      const selectedSubtitleClip: SubtitleClip = {
        ...baseClip,
        type: "subtitle",
        text: "Test",
        style: {},
        isSelected: true,
      }

      render(
        <Clip
          clip={selectedSubtitleClip}
          track={subtitleTrack}
          timeScale={10}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />,
      )

      expect(screen.getByTestId("subtitle-clip")).toHaveAttribute("data-is-selected", "true")
    })
  })

  describe("Пропсы и классы", () => {
    it("должен применять дополнительные классы", () => {
      render(
        <Clip
          clip={baseClip}
          track={baseTrack}
          timeScale={10}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
          className="custom-class"
        />,
      )

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement.className).toMatch(/custom-class/)
    })

    it("должен передавать callbacks в дочерние компоненты", () => {
      render(<Clip clip={baseClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      // Проверяем что VideoClip получил правильные пропсы
      const videoClip = screen.getByTestId("video-clip")
      expect(videoClip).toBeInTheDocument()
    })

    it("должен иметь базовые стили позиционирования", () => {
      render(<Clip clip={baseClip} track={baseTrack} timeScale={10} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />)

      const clipElement = screen.getByTestId("timeline-clip")
      expect(clipElement.className).toMatch(/absolute/)
      expect(clipElement.className).toMatch(/top-1/)
      expect(clipElement.className).toMatch(/bottom-1/)
      expect(clipElement.className).toMatch(/cursor-pointer/)
      expect(clipElement.className).toMatch(/transition-all/)
    })
  })
})

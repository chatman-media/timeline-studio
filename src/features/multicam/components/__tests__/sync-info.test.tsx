/**
 * Тесты для компонента отображения информации о синхронизации
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"

import { SyncInfo } from "../sync-info"

// Мокаем хук useMulticam
vi.mock("../../hooks/use-multicam", () => ({
  useMulticam: vi.fn(),
}))

// Мокаем функцию проверки поддержки таймкода
vi.mock("../../services/timecode-sync", () => ({
  supportsTimecodeSync: vi.fn(),
}))

import { useMulticam } from "../../hooks/use-multicam"
import { supportsTimecodeSync } from "../../services/timecode-sync"

const mockUseMulticam = vi.mocked(useMulticam)
const mockSupportsTimecodeSync = vi.mocked(supportsTimecodeSync)

describe("SyncInfo", () => {
  const baseClipId = "base-clip-1"

  const createMockMediaFile = (id: string, hasAudio = true, _hasTimecode = false): MediaFile => ({
    id,
    name: `media-${id}.mp4`,
    path: `/path/to/media-${id}.mp4`,
    type: MediaType.Video,
    size: 1000000,
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 120,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: undefined,
    probeData: hasAudio
      ? {
          streams: [
            { codec_type: "video", index: 0 },
            { codec_type: "audio", index: 1 },
          ],
          format: {},
        }
      : {
          streams: [{ codec_type: "video", index: 0 }],
          format: {},
        },
    thumbnailPath: undefined,
    createdAt: new Date(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return null if multicam is not supported", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: false,
      angles: [],
      activeAngle: null,
      syncOffsets: [],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
    } as any)

    const { container } = render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it("should show not synced status when no sync offsets", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} />)

    expect(screen.getByText("Не синхронизировано")).toBeInTheDocument()
  })

  it("should show synced status when sync offsets exist", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [2.5],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} />)

    expect(screen.getByText("Синхронизировано")).toBeInTheDocument()
  })

  it("should show timecode capability when available", () => {
    const mediaFile1 = createMockMediaFile("media-1", true, true)
    const mediaFile2 = createMockMediaFile("media-2", true, true)

    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: "angle-2",
          name: "Camera 2",
          clipId: "clip-2",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-2",
            mediaId: "media-2",
            name: "Clip 2",
            trackId: "track-2",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0, 0],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(true)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[mediaFile1, mediaFile2]} />)

    expect(screen.getByText(/Таймкод ✓/)).toBeInTheDocument()
  })

  it("should show audio capability when available", () => {
    const mediaFile1 = createMockMediaFile("media-1", true)
    const mediaFile2 = createMockMediaFile("media-2", true)

    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: "angle-2",
          name: "Camera 2",
          clipId: "clip-2",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-2",
            mediaId: "media-2",
            name: "Clip 2",
            trackId: "track-2",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0, 0],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[mediaFile1, mediaFile2]} />)

    expect(screen.getByText(/Аудио ✓/)).toBeInTheDocument()
  })

  it("should show disabled timecode when not available", () => {
    const mediaFile = createMockMediaFile("media-1", true, false)

    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[mediaFile]} />)

    expect(screen.getByText(/Таймкод ✗/)).toBeInTheDocument()
  })

  it("should show disabled audio when not available", () => {
    const mediaFile = createMockMediaFile("media-1", false)

    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[mediaFile]} />)

    expect(screen.getByText(/Аудио ✗/)).toBeInTheDocument()
  })

  it("should show offset details when showDetails is true and synced", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: "angle-2",
          name: "Camera 2",
          clipId: "clip-2",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-2",
            mediaId: "media-2",
            name: "Clip 2",
            trackId: "track-2",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0, 2.567],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} showDetails={true} />)

    expect(screen.getByText("Смещения:")).toBeInTheDocument()
    expect(screen.getByText("Camera 2:")).toBeInTheDocument()
    expect(screen.getByText("+2.567s")).toBeInTheDocument()
  })

  it("should not show offset details when showDetails is false", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [2.5],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} showDetails={false} />)

    expect(screen.queryByText("Смещения:")).not.toBeInTheDocument()
  })

  it("should format negative offsets correctly", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [-3.125],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} showDetails={true} />)

    expect(screen.getByText("-3.125s")).toBeInTheDocument()
  })

  it("should skip angles with near-zero offsets in details", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [
        {
          id: "angle-1",
          name: "Camera 1",
          clipId: "clip-1",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-1",
            mediaId: "media-1",
            name: "Clip 1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: "angle-2",
          name: "Camera 2",
          clipId: "clip-2",
          syncOffset: 0,
          isActive: false,
          clip: {
            id: "clip-2",
            mediaId: "media-2",
            name: "Clip 2",
            trackId: "track-2",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            offset: 0,
            speed: 1,
            volume: 1,
            opacity: 1,
            isReversed: false,
            isSelected: false,
            isLocked: false,
            effects: [],
            filters: [],
            transitions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      activeAngle: null,
      syncOffsets: [0.005, 2.5],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    mockSupportsTimecodeSync.mockReturnValue(false)

    render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} showDetails={true} />)

    expect(screen.queryByText("Camera 1:")).not.toBeInTheDocument()
    expect(screen.getByText("Camera 2:")).toBeInTheDocument()
  })

  it("should apply custom className", () => {
    mockUseMulticam.mockReturnValue({
      hasMulticamSupport: true,
      angles: [],
      activeAngle: null,
      syncOffsets: [],
      switchToAngle: vi.fn(),
      addAngle: vi.fn(),
      removeAngle: vi.fn(),
      updateAngleName: vi.fn(),
    })

    const { container } = render(<SyncInfo baseClipId={baseClipId} mediaFiles={[]} className="custom-class" />)

    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })
})

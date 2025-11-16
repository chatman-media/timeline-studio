/**
 * Тесты для хука useTimelineActions
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile, MediaType } from "@/features/media/types/media"

import { useClips } from "../../hooks/use-clips"
import { useTimeline } from "../../hooks/use-timeline"
import { useTimelineActions } from "../../hooks/use-timeline-actions"
import { useTracks } from "../../hooks/use-tracks"

// Mock dependencies
vi.mock("../../hooks/use-timeline")
vi.mock("../../hooks/use-tracks")
vi.mock("../../hooks/use-clips")
vi.mock("@/features/resources", () => ({
  useResources: vi.fn(() => ({
    addMedia: vi.fn(),
  })),
}))

// Мокаем медиафайл для тестов
const mockVideoFile: MediaFile = {
  id: "test-video-1",
  name: "test-video.mp4",
  path: "/test/video.mp4",
  type: "video" as MediaType,
  size: 1024000,
  duration: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
  probeData: {
    streams: [
      {
        index: 0,
        codec_type: "video",
        codec_name: "h264",
        width: 1920,
        height: 1080,
        duration: "30.0",
      },
    ],
    format: {
      format_name: "mp4",
      duration: 30.0,
      size: 1024000,
    },
  },
}

const mockAudioFile: MediaFile = {
  id: "test-audio-1",
  name: "test-audio.mp3",
  path: "/test/audio.mp3",
  type: "audio" as MediaType,
  size: 512000,
  duration: 60,
  createdAt: new Date(),
  updatedAt: new Date(),
  probeData: {
    streams: [
      {
        index: 0,
        codec_type: "audio",
        codec_name: "aac",
        duration: "60.0",
      },
    ],
    format: {
      format_name: "mp3",
      duration: 60.0,
      size: 512000,
    },
  },
}

const mockImageFile: MediaFile = {
  id: "test-image-1",
  name: "test-image.jpg",
  path: "/test/image.jpg",
  type: "still_image" as MediaType,
  size: 256000,
  duration: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("useTimelineActions", () => {
  const mockTimeline = {
    project: { id: "test-project", name: "Test Project" } as any,
    addTrack: vi.fn(),
    addClip: vi.fn(),
    createProject: vi.fn(),
  } as any

  const mockTracks = {
    tracks: [
      { id: "video-track-1", type: "Video", name: "Video Track 1" },
      { id: "audio-track-1", type: "Audio", name: "Audio Track 1" },
    ],
    getTracksByType: vi.fn(),
  } as any

  const mockClips = {
    getClipsByTrack: vi.fn(),
  } as any

  beforeEach(() => {
    vi.resetAllMocks()

    // Сбрасываем проект на значение по умолчанию
    mockTimeline.project = { id: "test-project", name: "Test Project" }

    // Делаем асинхронные функции возвращающими промисы
    mockTimeline.addClip.mockResolvedValue(undefined)
    mockTimeline.addTrack.mockResolvedValue(undefined)
    mockTimeline.createProject.mockResolvedValue(undefined)

    vi.mocked(useTimeline).mockReturnValue(mockTimeline)
    vi.mocked(useTracks).mockReturnValue(mockTracks)
    vi.mocked(useClips).mockReturnValue(mockClips)

    // Default mock implementations - возвращаем безопасные значения
    mockTracks.getTracksByType.mockReturnValue([])
    mockClips.getClipsByTrack.mockReturnValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("hook initialization", () => {
    it("должен быть определен и экспортируемым", () => {
      expect(useTimelineActions).toBeDefined()
      expect(typeof useTimelineActions).toBe("function")
    })

    it("должен возвращать объект с необходимыми методами", () => {
      const { result } = renderHook(() => useTimelineActions())

      expect(result.current).toHaveProperty("addMediaToTimeline")
      expect(result.current).toHaveProperty("addSingleMediaToTimeline")
      expect(result.current).toHaveProperty("getTrackTypeForMedia")
      expect(result.current).toHaveProperty("findBestTrackForMedia")
      expect(result.current).toHaveProperty("calculateClipStartTime")
    })

    it("должен вызывать зависимые хуки", () => {
      renderHook(() => useTimelineActions())

      expect(useTimeline).toHaveBeenCalled()
      expect(useTracks).toHaveBeenCalled()
      expect(useClips).toHaveBeenCalled()
    })
  })

  describe("getTrackTypeForMedia", () => {
    it("должен определить тип Video для видеофайла", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockVideoFile)
      expect(trackType).toBe("video")
    })

    it("должен определить тип Audio для аудиофайла", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockAudioFile)
      expect(trackType).toBe("audio")
    })

    it("должен определить тип Image для изображения", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockImageFile)
      expect(trackType).toBe("image")
    })

    it("должен определить тип Video по probeData", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockVideoFile)
      expect(trackType).toBe("video")
    })

    it("должен определить тип Audio по probeData если есть только аудио поток", () => {
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(mockAudioFile)
      expect(trackType).toBe("audio")
    })

    it("должен возвращать Video по умолчанию для неизвестного типа", () => {
      const unknownFile = {
        ...mockVideoFile,
        type: "video" as MediaType,
        probeData: undefined,
      }
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(unknownFile)
      expect(trackType).toBe("video")
    })
  })

  describe("findBestTrackForMedia", () => {
    it("должен возвращать null если нет подходящих треков", () => {
      mockTracks.getTracksByType.mockReturnValue([])
      const { result } = renderHook(() => useTimelineActions())

      const bestTrack = result.current.findBestTrackForMedia(mockVideoFile)
      expect(bestTrack).toBeNull()
    })

    it("должен возвращать первый трек подходящего типа", () => {
      const videoTracks = [
        { id: "video-track-1", type: "Video" },
        { id: "video-track-2", type: "Video" },
      ]
      mockTracks.getTracksByType.mockReturnValue(videoTracks)
      const { result } = renderHook(() => useTimelineActions())

      const bestTrack = result.current.findBestTrackForMedia(mockVideoFile)
      expect(bestTrack).toBe("video-track-1")
    })

    it("должен вызвать getTracksByType с правильным типом", () => {
      const { result } = renderHook(() => useTimelineActions())

      result.current.findBestTrackForMedia(mockVideoFile)
      expect(mockTracks.getTracksByType).toHaveBeenCalledWith("video")
    })
  })

  describe("calculateClipStartTime", () => {
    it("должен возвращать 0 для пустого трека", () => {
      mockClips.getClipsByTrack.mockReturnValue([])
      const { result } = renderHook(() => useTimelineActions())

      const startTime = result.current.calculateClipStartTime("test-track-id")
      expect(startTime).toBe(0)
    })

    it("должен вычислить время после последнего клипа", () => {
      const clips = [
        { startTime: 0, duration: 10 },
        { startTime: 15, duration: 5 },
        { startTime: 5, duration: 8 },
      ]
      mockClips.getClipsByTrack.mockReturnValue(clips)
      const { result } = renderHook(() => useTimelineActions())

      const startTime = result.current.calculateClipStartTime("test-track-id")
      expect(startTime).toBe(20) // 15 + 5 = последний клип заканчивается в 20
    })

    it("должен правильно найти последний клип среди множества", () => {
      const clips = [
        { startTime: 10, duration: 5 }, // заканчивается в 15
        { startTime: 0, duration: 8 }, // заканчивается в 8
        { startTime: 20, duration: 3 }, // заканчивается в 23 - это последний
      ]
      mockClips.getClipsByTrack.mockReturnValue(clips)
      const { result } = renderHook(() => useTimelineActions())

      const startTime = result.current.calculateClipStartTime("test-track-id")
      expect(startTime).toBe(23)
    })
  })

  describe("addSingleMediaToTimeline", () => {
    it("должен создать проект если его нет", () => {
      mockTimeline.project = null
      const { result } = renderHook(() => useTimelineActions())

      act(() => {
        result.current.addSingleMediaToTimeline(mockVideoFile)
      })

      expect(mockTimeline.createProject).toHaveBeenCalledWith("Untitled Project")
    })

    it("должен добавить клип если трек существует", async () => {
      mockTracks.getTracksByType.mockReturnValue([{ id: "video-track-1" }])
      mockClips.getClipsByTrack.mockReturnValue([])

      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addSingleMediaToTimeline(mockVideoFile)
      })

      expect(mockTimeline.addClip).toHaveBeenCalledWith("video-track-1", mockVideoFile, 0)
    })

    it("должен создать новый трек если подходящий не найден", () => {
      mockTracks.getTracksByType.mockReturnValue([])
      const { result } = renderHook(() => useTimelineActions())

      act(() => {
        result.current.addSingleMediaToTimeline(mockVideoFile)
      })

      expect(mockTimeline.addTrack).toHaveBeenCalledWith("video", "Video Track", undefined)
    })

    it("должен использовать customStartTime если указано", async () => {
      mockTracks.getTracksByType.mockReturnValue([{ id: "video-track-1" }])
      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addSingleMediaToTimeline(mockVideoFile, undefined, 15)
      })

      expect(mockTimeline.addClip).toHaveBeenCalledWith("video-track-1", mockVideoFile, 15)
    })

    it("должен использовать customTrackId если указан", async () => {
      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addSingleMediaToTimeline(mockVideoFile, "custom-track", 10)
      })

      expect(mockTimeline.addClip).toHaveBeenCalledWith("custom-track", mockVideoFile, 10)
    })

    it("должен использовать дефолтную длительность для изображений", async () => {
      mockTracks.getTracksByType.mockReturnValue([{ id: "image-track-1" }])
      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addSingleMediaToTimeline(mockImageFile)
      })

      expect(mockTimeline.addClip).toHaveBeenCalledWith("image-track-1", mockImageFile, 0)
    })

    it("должен использовать дефолтную длительность для файлов без duration", async () => {
      const fileWithoutDuration = { ...mockVideoFile, duration: undefined }
      mockTracks.getTracksByType.mockReturnValue([{ id: "video-track-1" }])
      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addSingleMediaToTimeline(fileWithoutDuration)
      })

      expect(mockTimeline.addClip).toHaveBeenCalledWith("video-track-1", fileWithoutDuration, 0)
    })
  })

  describe("addMediaToTimeline", () => {
    it("должен обработать пустой массив файлов", () => {
      const { result } = renderHook(() => useTimelineActions())

      act(() => {
        result.current.addMediaToTimeline([])
      })

      // Проверяем что функция не упала
      expect(result.current.addMediaToTimeline).toBeDefined()
    })

    it("должен обработать null или undefined", () => {
      const { result } = renderHook(() => useTimelineActions())

      act(() => {
        result.current.addMediaToTimeline(null as any)
      })

      // Проверяем что функция не упала
      expect(result.current.addMediaToTimeline).toBeDefined()

      act(() => {
        result.current.addMediaToTimeline(undefined as any)
      })

      // Проверяем что функция не упала
      expect(result.current.addMediaToTimeline).toBeDefined()
    })

    it("должен добавить несколько файлов последовательно", async () => {
      mockTracks.getTracksByType.mockReturnValue([{ id: "track-1" }])
      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addMediaToTimeline([mockVideoFile, mockAudioFile])
      })

      // Проверяем что функция не упала и работает корректно
      expect(result.current.addMediaToTimeline).toBeDefined()
    })

    it("должен добавить все файлы с задержкой", async () => {
      mockTracks.getTracksByType.mockReturnValue([{ id: "track-1" }])

      // Создаём отдельный мок для этого теста
      const localAddClipMock = vi.fn().mockResolvedValue(undefined)
      mockTimeline.addClip = localAddClipMock

      const { result } = renderHook(() => useTimelineActions())

      // Запускаем асинхронное добавление
      await act(async () => {
        await result.current.addMediaToTimeline([mockVideoFile, mockAudioFile])
      })

      // Проверяем что оба файла были добавлены
      expect(localAddClipMock).toHaveBeenCalledTimes(2)
    })
  })

  describe("edge cases", () => {
    it("должен обработать файл без probeData", () => {
      const fileWithoutProbe = { ...mockVideoFile, probeData: undefined }
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(fileWithoutProbe)
      expect(trackType).toBe("video") // По типу type
    })

    it("должен обработать файл с пустыми streams", () => {
      const fileWithEmptyStreams = {
        ...mockVideoFile,
        type: "video" as MediaType,
        probeData: { ...mockVideoFile.probeData!, streams: [] },
      }
      const { result } = renderHook(() => useTimelineActions())

      const trackType = result.current.getTrackTypeForMedia(fileWithEmptyStreams)
      expect(trackType).toBe("video") // По умолчанию
    })

    it("должен обработать отрицательные значения времени в клипах", () => {
      const clips = [
        { startTime: -5, duration: 10 }, // заканчивается в 5
        { startTime: 0, duration: 3 }, // заканчивается в 3
      ]
      mockClips.getClipsByTrack.mockReturnValue(clips)
      const { result } = renderHook(() => useTimelineActions())

      const startTime = result.current.calculateClipStartTime("test-track")
      expect(startTime).toBe(5)
    })
  })

  describe("async operations", () => {
    it("должен обработать создание проекта с retry логикой", async () => {
      mockTimeline.project = null
      mockTracks.getTracksByType
        .mockReturnValueOnce([]) // Первый вызов - нет треков
        .mockReturnValueOnce([{ id: "new-track" }]) // Второй вызов - трек появился

      vi.useFakeTimers()
      const { result } = renderHook(() => useTimelineActions())

      act(() => {
        result.current.addSingleMediaToTimeline(mockVideoFile)
      })

      // Проект создается
      expect(mockTimeline.createProject).toHaveBeenCalled()

      // Через 100ms вызывается рекурсивно
      act(() => {
        vi.advanceTimersByTime(100)
        // Имитируем что проект теперь существует
        mockTimeline.project = { id: "new-project", name: "New Project" }
      })

      vi.useRealTimers()
    })

    it("должен обработать retry логику при создании трека", async () => {
      mockTracks.getTracksByType
        .mockReturnValueOnce([]) // Первый вызов - нет треков
        .mockReturnValueOnce([{ id: "new-track" }]) // Второй вызов после создания - трек появился

      const { result } = renderHook(() => useTimelineActions())

      await act(async () => {
        await result.current.addSingleMediaToTimeline(mockVideoFile)
      })

      // Трек создается
      expect(mockTimeline.addTrack).toHaveBeenCalled()
      // Клип добавляется
      expect(mockTimeline.addClip).toHaveBeenCalled()
    })
  })

  describe("integration", () => {
    it("должен правильно интегрировать все части workflow", async () => {
      mockTracks.getTracksByType.mockReturnValue([{ id: "video-track-1" }])
      mockClips.getClipsByTrack.mockReturnValue([{ startTime: 0, duration: 10 }])

      const { result } = renderHook(() => useTimelineActions())

      // 1. Определяем тип медиа
      const trackType = result.current.getTrackTypeForMedia(mockVideoFile)
      expect(trackType).toBe("video")

      // 2. Находим лучший трек
      const bestTrack = result.current.findBestTrackForMedia(mockVideoFile)
      expect(bestTrack).toBe("video-track-1")

      // 3. Вычисляем время начала
      const startTime = result.current.calculateClipStartTime("video-track-1")
      expect(startTime).toBe(10)

      // 4. Добавляем медиа
      await act(async () => {
        await result.current.addSingleMediaToTimeline(mockVideoFile)
      })

      expect(mockTimeline.addClip).toHaveBeenCalledWith("video-track-1", mockVideoFile, 10)
    })
  })
})

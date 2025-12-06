import { beforeEach, describe, expect, it, vi } from "vitest"

import { calculateTimeRanges } from "@/features/media/utils/video"
import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import type { MediaFile, MediaTrack } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"
import { processAudioFiles } from "../audio-tracks"
import { createTracksFromFiles } from "../tracks"
import { updateSectorTimeRange } from "../tracks-utils"
import { processVideoFiles } from "../video-tracks"

// Mock dependencies
vi.mock("@/features/media/utils/video", () => ({
  calculateTimeRanges: vi.fn(() => [
    { start: 1000, end: 2000 },
    { start: 3000, end: 4000 },
  ]),
}))

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key: string, options?: any) => {
      if (key === "timeline.section.sectorName") {
        return `Section ${options?.date || "Unknown"}`
      }
      return key
    }),
    language: "en",
  },
}))

vi.mock("@/i18n/constants", () => ({
  formatDateByLanguage: vi.fn((date: Date, _lang: string, _options?: any) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }),
}))

vi.mock("../audio-tracks", () => ({
  processAudioFiles: vi.fn(),
}))

vi.mock("../tracks-utils", () => ({
  updateSectorTimeRange: vi.fn(),
}))

vi.mock("../video-tracks", () => ({
  processVideoFiles: vi.fn(),
}))

describe("tracks", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const createMockMediaFile = (startTime: number, hasVideo = true, hasAudio = false, id = "file-1"): MediaFile => ({
    id,
    path: `/path/to/${id}.mp4`,
    name: `${id}.mp4`,
    type: hasVideo ? MediaType.Video : MediaType.Audio,
    isVideo: hasVideo,
    isAudio: !hasVideo,
    size: 1024000,
    startTime,
    duration: 60,
    createdAt: new Date(),
    probeData: {
      streams: [
        ...(hasVideo ? [{ codec_type: "video" as const, codec_name: "h264", index: 0 }] : []),
        ...(hasAudio ? [{ codec_type: "audio" as const, codec_name: "aac", index: 1 }] : []),
      ],
      format: {},
    },
  })

  const createMockMediaTrack = (id = "track-1", name = "Track 1"): MediaTrack => ({
    id,
    name,
    type: "video",
    isActive: false,
    videos: [],
    startTime: 0,
    endTime: 10,
    combinedDuration: 0,
    index: 0,
    volume: 0,
    isMuted: false,
    isLocked: false,
    isVisible: false,
  })

  describe("createTracksFromFiles", () => {
    it("должен обрабатывать пустой массив файлов", () => {
      const result = createTracksFromFiles([])

      expect(result).toEqual([])
      expect(processAudioFiles).toHaveBeenCalledWith([], [], {}, "en")
    })

    it("должен создать сектор для видеофайлов", () => {
      const videoFile = createMockMediaFile(1000, true, false, "video-1")

      const result = createTracksFromFiles([videoFile])

      expect(result).toHaveLength(1)
      expect(result[0].name).toContain("Section")
      expect(result[0].id).toBe("1970-01-01")
      expect(processVideoFiles).toHaveBeenCalledWith([videoFile], result[0])
      expect(calculateTimeRanges).toHaveBeenCalledWith([videoFile])
      expect(updateSectorTimeRange).toHaveBeenCalledWith(result[0])
    })

    it("должен разделить видео и аудио файлы", () => {
      const videoFile = createMockMediaFile(1000, true, false, "video-1")
      const audioFile = createMockMediaFile(2000, false, true, "audio-1")

      createTracksFromFiles([videoFile, audioFile])

      expect(processVideoFiles).toHaveBeenCalledWith([videoFile], expect.any(Object))
      expect(processAudioFiles).toHaveBeenCalledWith([audioFile], expect.any(Array), expect.any(Object), "en")
    })

    it("должен группировать файлы по дням", () => {
      const date1 = new Date("2023-01-01").getTime() / 1000
      const date2 = new Date("2023-01-02").getTime() / 1000

      const video1 = createMockMediaFile(date1, true, false, "video-1")
      const video2 = createMockMediaFile(date1, true, false, "video-2")
      const video3 = createMockMediaFile(date2, true, false, "video-3")

      const result = createTracksFromFiles([video1, video2, video3])

      expect(result).toHaveLength(2)
      expect(processVideoFiles).toHaveBeenCalledTimes(2)
      expect(processVideoFiles).toHaveBeenCalledWith([video1, video2], expect.any(Object))
      expect(processVideoFiles).toHaveBeenCalledWith([video3], expect.any(Object))
    })

    it("должен сортировать файлы по времени начала", () => {
      const video1 = createMockMediaFile(3000, true, false, "video-1")
      const video2 = createMockMediaFile(1000, true, false, "video-2")
      const video3 = createMockMediaFile(2000, true, false, "video-3")

      createTracksFromFiles([video1, video2, video3])

      // Файлы должны быть переданы в отсортированном порядке
      expect(processVideoFiles).toHaveBeenCalledWith([video2, video3, video1], expect.any(Object))
    })

    it("должен обрабатывать файлы без startTime", () => {
      const videoFile = { ...createMockMediaFile(0, true, false), startTime: undefined }

      const result = createTracksFromFiles([videoFile])

      expect(result).toHaveLength(1)
      expect(processVideoFiles).toHaveBeenCalledWith([videoFile], expect.any(Object))
    })

    it("должен обрабатывать файлы без probeData", () => {
      const fileWithoutProbe = {
        ...createMockMediaFile(1000, true, false),
        probeData: undefined,
      }

      const result = createTracksFromFiles([fileWithoutProbe])

      // Файл без probeData не будет классифицирован как видео или аудио
      expect(result).toHaveLength(0)
      expect(processVideoFiles).not.toHaveBeenCalled()
      expect(processAudioFiles).toHaveBeenCalledWith([], [], {}, "en")
    })

    it("должен обрабатывать файлы с множественными потоками", () => {
      const videoWithAudio = createMockMediaFile(1000, true, true, "video-audio-1")

      createTracksFromFiles([videoWithAudio])

      // Файл с видео потоком должен быть классифицирован как видео
      expect(processVideoFiles).toHaveBeenCalledWith([videoWithAudio], expect.any(Object))
      expect(processAudioFiles).toHaveBeenCalledWith([], expect.any(Array), expect.any(Object), "en")
    })

    it("должен использовать правильный язык для форматирования", () => {
      const videoFile = createMockMediaFile(1000, true, false)

      // Мокаем язык
      vi.mocked(i18n).language = "ru"

      createTracksFromFiles([videoFile])

      expect(formatDateByLanguage).toHaveBeenCalledWith(expect.any(Date), "ru", { includeYear: true, longFormat: true })
      expect(processAudioFiles).toHaveBeenCalledWith([], expect.any(Array), expect.any(Object), "ru")
    })

    it("должен использовать язык по умолчанию если i18n.language не установлен", () => {
      const videoFile = createMockMediaFile(1000, true, false)

      // Убираем язык
      vi.mocked(i18n).language = undefined as any

      createTracksFromFiles([videoFile])

      expect(processAudioFiles).toHaveBeenCalledWith([], expect.any(Array), expect.any(Object), "ru")
    })

    it("должен работать с существующими треками", () => {
      const existingTrack = createMockMediaTrack("track-1", "Existing Track")
      const videoFile = createMockMediaFile(1000, true, false)

      const result = createTracksFromFiles([videoFile], [existingTrack])

      expect(result).toHaveLength(1)
      // existingTracks параметр логируется но не используется в текущей реализации
    })

    it("должен обрабатывать файлы только с аудио потоками", () => {
      const audioOnlyFile = createMockMediaFile(1000, false, true, "audio-only")

      createTracksFromFiles([audioOnlyFile])

      expect(processVideoFiles).not.toHaveBeenCalled()
      expect(processAudioFiles).toHaveBeenCalledWith([audioOnlyFile], [], {}, "ru")
    })

    it("должен создать корректную структуру сектора", () => {
      const videoFile = createMockMediaFile(1000, true, false)

      const result = createTracksFromFiles([videoFile])

      const sector = result[0]
      expect(sector).toMatchObject({
        id: "1970-01-01",
        name: expect.stringContaining("Section"),
        tracks: [],
        timeRanges: expect.any(Array),
        startTime: 0,
        endTime: 0,
        zoomLevel: 1,
        scrollPosition: 0,
      })
    })

    it("должен вызывать i18n.t для создания имени сектора", () => {
      const videoFile = createMockMediaFile(1000, true, false)

      createTracksFromFiles([videoFile])

      expect(i18n.t).toHaveBeenCalledWith("timeline.section.sectorName", {
        date: expect.any(String),
        defaultValue: expect.stringContaining("Section"),
      })
    })

    it("должен обрабатывать смешанные типы файлов", () => {
      const videoFile = createMockMediaFile(1000, true, false, "video")
      const audioFile = createMockMediaFile(2000, false, true, "audio")
      const videoWithAudio = createMockMediaFile(3000, true, true, "mixed")

      const result = createTracksFromFiles([videoFile, audioFile, videoWithAudio])

      expect(processVideoFiles).toHaveBeenCalledWith([videoFile, videoWithAudio], expect.any(Object))
      expect(processAudioFiles).toHaveBeenCalledWith([audioFile], expect.any(Array), expect.any(Object), "ru")
    })

    it("должен обрабатывать отрицательные временные значения", () => {
      const videoFile = createMockMediaFile(-1000, true, false)

      const result = createTracksFromFiles([videoFile])

      expect(result).toHaveLength(1)
      expect(processVideoFiles).toHaveBeenCalledWith([videoFile], expect.any(Object))
    })

    it("должен обрабатывать очень большие временные значения", () => {
      const largeTime = new Date("2030-01-01").getTime() / 1000
      const videoFile = createMockMediaFile(largeTime, true, false)

      const result = createTracksFromFiles([videoFile])

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("2030-01-01")
    })

    it("должен обрабатывать файлы с нулевой продолжительностью", () => {
      const videoFile = { ...createMockMediaFile(1000, true, false), duration: 0 }

      const result = createTracksFromFiles([videoFile])

      expect(result).toHaveLength(1)
      expect(processVideoFiles).toHaveBeenCalledWith([videoFile], expect.any(Object))
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать файлы с пустыми потоками", () => {
      const fileWithEmptyStreams = {
        ...createMockMediaFile(1000, true, false),
        probeData: { streams: [], format: {} },
      }

      const result = createTracksFromFiles([fileWithEmptyStreams])

      expect(result).toHaveLength(0)
    })

    it("должен обрабатывать файлы с неопределенными потоками", () => {
      const fileWithUndefinedStreams = {
        ...createMockMediaFile(1000, true, false),
        probeData: undefined,
      }

      const result = createTracksFromFiles([fileWithUndefinedStreams])

      expect(result).toHaveLength(0)
    })

    it("должен обрабатывать дублирующиеся файлы", () => {
      const videoFile1 = createMockMediaFile(1000, true, false, "video-1")
      const videoFile2 = createMockMediaFile(1000, true, false, "video-1") // Такой же ID

      const result = createTracksFromFiles([videoFile1, videoFile2])

      expect(result).toHaveLength(1)
      expect(processVideoFiles).toHaveBeenCalledWith([videoFile1, videoFile2], expect.any(Object))
    })

    it("должен обрабатывать файлы с некорректными типами потоков", () => {
      const fileWithBadStreams = {
        ...createMockMediaFile(1000, true, false),
        probeData: {
          streams: [
            { codec_type: "subtitle" as any, codec_name: "srt", index: 0 },
            { codec_type: "data" as any, codec_name: "unknown", index: 1 },
          ],
          format: {},
        },
      }

      const result = createTracksFromFiles([fileWithBadStreams])

      expect(result).toHaveLength(0)
    })
  })

  describe("integration", () => {
    it("должен правильно интегрировать все mock функции", () => {
      const videoFile = createMockMediaFile(1000, true, false)
      const audioFile = createMockMediaFile(2000, false, true)

      createTracksFromFiles([videoFile, audioFile])

      expect(processVideoFiles).toHaveBeenCalled()
      expect(processAudioFiles).toHaveBeenCalled()
      expect(calculateTimeRanges).toHaveBeenCalled()
      expect(updateSectorTimeRange).toHaveBeenCalled()
      expect(formatDateByLanguage).toHaveBeenCalled()
      expect(i18n.t).toHaveBeenCalled()
    })
  })
})

import { beforeEach, describe, expect, it, vi } from "vitest"

import { calculateTimeRanges } from "@/features/media/utils/video"
import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import type { MediaFile } from "../../types/media"
import { MediaType } from "../../types/media"
import type { Sector } from "../../types/types"
import { processAudioFiles } from "../audio-tracks"
import { doTimeRangesOverlap } from "../media-utils"
import { updateSectorTimeRange } from "../tracks-utils"

// Mock dependencies
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-id-123"),
}))

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
      if (key === "timeline.tracks.audioWithNumber") {
        return `Audio ${options?.number || 1}`
      }
      return key
    }),
  },
}))

vi.mock("@/i18n/constants", () => ({
  formatDateByLanguage: vi.fn((date: Date, _lang: string, _options?: any) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }),
}))

vi.mock("../media-utils", () => ({
  doTimeRangesOverlap: vi.fn(() => false),
}))

vi.mock("../tracks-utils", () => ({
  updateSectorTimeRange: vi.fn(),
}))

describe("audio-tracks", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const createMockAudioFile = (startTime: number, duration: number, id = "audio-1"): MediaFile => ({
    id,
    path: `/path/to/${id}.mp3`,
    name: `${id}.mp3`,
    type: MediaType.Audio,
    isAudio: true,
    size: 1024000,
    startTime,
    duration,
    createdAt: new Date(),
  })

  const createMockSector = (id: string, name: string, tracks: any[] = []): Sector => ({
    id,
    name,
    tracks,
    timeRanges: [],
    startTime: 0,
    endTime: 0,
    isLocked: false,
    combinedDuration: 0,
    zoomLevel: 1,
    scrollPosition: 0,
  })

  describe("processAudioFiles", () => {
    it("должен обрабатывать пустой массив файлов", () => {
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(0)
    })

    it("должен создать новый сектор для аудиофайла", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].name).toContain("Section")
      expect(sectors[0].tracks).toHaveLength(1)
      expect(sectors[0].tracks[0].type).toBe("audio")
      expect(sectors[0].tracks[0].videos).toContain(audioFile)
    })

    it("должен группировать файлы по дням", () => {
      const date1 = new Date("2023-01-01").getTime() / 1000
      const date2 = new Date("2023-01-02").getTime() / 1000

      const audioFile1 = createMockAudioFile(date1, 60, "audio-1")
      const audioFile2 = createMockAudioFile(date1, 30, "audio-2")
      const audioFile3 = createMockAudioFile(date2, 45, "audio-3")

      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile1, audioFile2, audioFile3], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(2)
      expect(formatDateByLanguage).toHaveBeenCalledTimes(4) // 2 раза для каждого дня
    })

    it("должен использовать существующий сектор если он найден", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const existingSector = createMockSector("existing-1", "Existing Section")
      const sectors: Sector[] = [existingSector]
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].id).toBe("existing-1")
    })

    it("должен найти существующий сектор по имени если не найден по дате", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const existingSector = createMockSector("existing-1", "Section 1970-01-01")
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "other-date": { sector: existingSector },
      }

      vi.mocked(formatDateByLanguage).mockReturnValue("1970-01-01")

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
    })

    it("должен добавить файл на существующую дорожку без пересечений", () => {
      const audioFile = createMockAudioFile(2000, 60)
      const existingTrack = {
        id: "track-1",
        type: "audio",
        index: 1,
        videos: [createMockAudioFile(1000, 30)],
        startTime: 1000,
        endTime: 1030,
        combinedDuration: 30,
      }
      const existingSector = createMockSector("existing-1", "Existing Section", [existingTrack])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      vi.mocked(doTimeRangesOverlap).mockReturnValue(false)

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors[0].tracks).toHaveLength(1)
      expect(sectors[0].tracks[0].videos).toHaveLength(2)
    })

    it("должен создать новую дорожку при пересечении времени", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const existingTrack = {
        id: "track-1",
        type: "audio",
        index: 1,
        videos: [createMockAudioFile(1030, 30)],
        startTime: 1030,
        endTime: 1060,
        combinedDuration: 30,
      }
      const existingSector = createMockSector("existing-1", "Existing Section", [existingTrack])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      vi.mocked(doTimeRangesOverlap).mockReturnValue(true)

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors[0].tracks).toHaveLength(2)
      expect(sectors[0].tracks[1].name).toContain("Audio 2")
    })

    it("должен обновить timeRanges и время сектора", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(calculateTimeRanges).toHaveBeenCalledWith([audioFile])
      expect(updateSectorTimeRange).toHaveBeenCalledWith(sectors[0])
    })

    it("должен обновить существующий сектор в списке", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const existingSector = createMockSector("existing-1", "Existing Section")
      const sectors: Sector[] = [existingSector]
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks).toHaveLength(1)
    })

    it("должен обрабатывать файлы без startTime", () => {
      const audioFile = { ...createMockAudioFile(0, 60), startTime: undefined }
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks).toHaveLength(1)
    })

    it("должен обрабатывать файлы без duration", () => {
      const audioFile = { ...createMockAudioFile(1000, 0), duration: undefined }
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks).toHaveLength(1)
    })

    it("должен правильно сортировать треки по индексу", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const track1 = { id: "track-1", type: "audio", index: 3, videos: [] }
      const track2 = { id: "track-2", type: "audio", index: 1, videos: [] }
      const track3 = { id: "track-3", type: "audio", index: 2, videos: [] }
      const existingSector = createMockSector("existing-1", "Existing Section", [track1, track2, track3])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      vi.mocked(doTimeRangesOverlap).mockReturnValue(false)

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      // Файл должен быть добавлен на одну из существующих дорожек
      const trackWithFile = sectors[0].tracks.find((track) => track.videos && track.videos.includes(audioFile))
      expect(trackWithFile).toBeDefined()
    })

    it("должен игнорировать треки не аудио типа", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const videoTrack = { id: "track-1", type: "video", index: 1, videos: [] }
      const existingSector = createMockSector("existing-1", "Existing Section", [videoTrack])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      // Должна быть создана новая аудио дорожка
      expect(sectors[0].tracks).toHaveLength(2)
      expect(sectors[0].tracks[1].type).toBe("audio")
    })

    it("должен обрабатывать треки без videos массива", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const trackWithoutVideos = { id: "track-1", type: "audio", index: 1 }
      const existingSector = createMockSector("existing-1", "Existing Section", [trackWithoutVideos])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors[0].tracks).toHaveLength(1)
      expect(sectors[0].tracks[0].videos).toContain(audioFile)
    })
  })

  describe("createNewAudioTrack (через processAudioFiles)", () => {
    it("должен создать аудиодорожку с правильными параметрами", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      const track = sectors[0].tracks[0]
      expect(track.id).toBe("test-id-123")
      expect(track.name).toContain("Audio 1")
      expect(track.type).toBe("audio")
      expect(track.isActive).toBe(false)
      expect(track.videos).toEqual([audioFile])
      expect(track.startTime).toBe(1000)
      expect(track.endTime).toBe(1060)
      expect(track.combinedDuration).toBe(60)
      expect(track.index).toBe(1)
      expect(track.volume).toBe(1)
      expect(track.isMuted).toBe(false)
      expect(track.isLocked).toBe(false)
      expect(track.isVisible).toBe(true)
      expect(track.cameraName).toContain("Audio 1")
    })

    it("должен правильно вычислить следующий номер дорожки", () => {
      const audioFile1 = createMockAudioFile(1000, 60, "audio-1")
      const audioFile2 = createMockAudioFile(2000, 60, "audio-2")

      const existingTrack = {
        id: "track-1",
        type: "audio",
        index: 5,
        videos: [createMockAudioFile(3000, 30)],
      }
      const existingSector = createMockSector("existing-1", "Existing Section", [existingTrack])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      vi.mocked(doTimeRangesOverlap).mockReturnValue(true)

      processAudioFiles([audioFile1, audioFile2], sectors, existingSectorsByDay, "en")

      // Должны быть созданы дорожки с номерами 6 и 7
      expect(sectors[0].tracks).toHaveLength(3)
      expect(sectors[0].tracks[1].index).toBe(6)
      expect(sectors[0].tracks[2].index).toBe(7)
    })

    it("должен обрабатывать треки без index", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const existingTrack = {
        id: "track-1",
        type: "audio",
        videos: [createMockAudioFile(3000, 30)],
      }
      const existingSector = createMockSector("existing-1", "Existing Section", [existingTrack])
      const sectors: Sector[] = []
      const existingSectorsByDay = {
        "1970-01-01": { sector: existingSector },
      }

      vi.mocked(doTimeRangesOverlap).mockReturnValue(true)

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors[0].tracks).toHaveLength(2)
      expect(sectors[0].tracks[1].index).toBe(1)
    })
  })

  describe("edge cases", () => {
    it("должен обрабатывать отрицательные временные значения", () => {
      const audioFile = createMockAudioFile(-1000, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks[0].startTime).toBe(-1000)
      expect(sectors[0].tracks[0].endTime).toBe(-940)
    })

    it("должен обрабатывать очень большие временные значения", () => {
      // Используем более реальное большое значение времени (год 2030)
      const largeTime = new Date("2030-01-01").getTime() / 1000
      const audioFile = createMockAudioFile(largeTime, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks[0].startTime).toBe(largeTime)
    })

    it("должен обрабатывать нулевую длительность", () => {
      const audioFile = createMockAudioFile(1000, 0)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks[0].combinedDuration).toBe(0)
      expect(sectors[0].tracks[0].endTime).toBe(1000)
    })

    it("должен обрабатывать множественные файлы с одинаковым временем", () => {
      const audioFile1 = createMockAudioFile(1000, 60, "audio-1")
      const audioFile2 = createMockAudioFile(1000, 60, "audio-2")
      const audioFile3 = createMockAudioFile(1000, 60, "audio-3")
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      vi.mocked(doTimeRangesOverlap).mockReturnValue(true)

      processAudioFiles([audioFile1, audioFile2, audioFile3], sectors, existingSectorsByDay, "en")

      expect(sectors).toHaveLength(1)
      expect(sectors[0].tracks).toHaveLength(3) // Все на разных дорожках из-за пересечения
    })
  })

  describe("i18n integration", () => {
    it("должен использовать правильные переводы", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "ru")

      expect(i18n.t).toHaveBeenCalledWith("timeline.section.sectorName", expect.any(Object))
      expect(i18n.t).toHaveBeenCalledWith("timeline.tracks.audioWithNumber", expect.any(Object))
      expect(formatDateByLanguage).toHaveBeenCalledWith(expect.any(Date), "ru", expect.any(Object))
    })

    it("должен правильно форматировать дату для разных языков", () => {
      const audioFile = createMockAudioFile(1000, 60)
      const sectors: Sector[] = []
      const existingSectorsByDay = {}

      processAudioFiles([audioFile], sectors, existingSectorsByDay, "zh")

      expect(formatDateByLanguage).toHaveBeenCalledWith(expect.any(Date), "zh", { includeYear: true, longFormat: true })
    })
  })
})

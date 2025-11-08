import { describe, expect, it } from "vitest"
import type { MediaFile } from "../../types/media"
import { MediaType } from "../../types/media"
import type { Sector } from "../../types/types"
import { updateSectorTimeRange } from "../tracks-utils"

describe("tracks-utils", () => {
  const createMockMediaFile = (startTime: number, duration: number, id = "media-1"): MediaFile => ({
    id,
    path: `/path/to/${id}.mp4`,
    name: `${id}.mp4`,
    type: MediaType.Video,
    isVideo: true,
    size: 1024000,
    startTime,
    duration,
    createdAt: new Date(),
  })

  const createMockSector = (tracks: any[] = []): Sector => ({
    id: "sector-1",
    name: "Test Sector",
    tracks,
    timeRanges: [],
    startTime: 0,
    endTime: 0,
    isLocked: false,
    combinedDuration: 0,
    zoomLevel: 1,
    scrollPosition: 0,
  })

  describe("updateSectorTimeRange", () => {
    it("должен установить startTime и endTime на основе видео в треках", () => {
      const video1 = createMockMediaFile(1000, 60, "video-1")
      const video2 = createMockMediaFile(2000, 30, "video-2")
      const video3 = createMockMediaFile(500, 90, "video-3")

      const track1 = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }
      const track2 = {
        id: "track-2",
        type: "video",
        videos: [video3],
      }

      const sector = createMockSector([track1, track2])

      updateSectorTimeRange(sector)

      // Минимальное startTime: 500 (video3)
      expect(sector.startTime).toBe(500)
      // Максимальное endTime: 2030 (video2: 2000 + 30)
      expect(sector.endTime).toBe(2030)
    })

    it("должен обрабатывать сектор с пустыми треками", () => {
      const sector = createMockSector([])
      const originalStartTime = sector.startTime
      const originalEndTime = sector.endTime

      updateSectorTimeRange(sector)

      // Время не должно измениться
      expect(sector.startTime).toBe(originalStartTime)
      expect(sector.endTime).toBe(originalEndTime)
    })

    it("должен обрабатывать треки без видео", () => {
      const track1 = {
        id: "track-1",
        type: "video",
        videos: [],
      }
      const track2 = {
        id: "track-2",
        type: "video",
        videos: undefined,
      }

      const sector = createMockSector([track1, track2])
      const originalStartTime = sector.startTime
      const originalEndTime = sector.endTime

      updateSectorTimeRange(sector)

      // Время не должно измениться
      expect(sector.startTime).toBe(originalStartTime)
      expect(sector.endTime).toBe(originalEndTime)
    })

    it("должен обрабатывать видео без startTime", () => {
      const video1 = { ...createMockMediaFile(0, 60), startTime: undefined }
      const video2 = createMockMediaFile(1000, 30)

      const track = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      // Минимальное startTime: 0 (video1 без startTime = 0)
      expect(sector.startTime).toBe(0)
      // Максимальное endTime: 1030 (video2: 1000 + 30)
      expect(sector.endTime).toBe(1030)
    })

    it("должен обрабатывать видео без duration", () => {
      const video1 = createMockMediaFile(1000, 60)
      const video2 = { ...createMockMediaFile(2000, 0), duration: undefined }

      const track = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      // Минимальное startTime: 1000
      expect(sector.startTime).toBe(1000)
      // Максимальное endTime: 2000 (video2 без duration = 0)
      expect(sector.endTime).toBe(2000)
    })

    it("должен работать с отрицательными временными значениями", () => {
      const video1 = createMockMediaFile(-500, 100)
      const video2 = createMockMediaFile(-1000, 200)

      const track = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      // Минимальное startTime: -1000
      expect(sector.startTime).toBe(-1000)
      // Максимальное endTime: -400 (video1: -500 + 100)
      expect(sector.endTime).toBe(-400)
    })

    it("должен работать с нулевыми временными значениями", () => {
      const video1 = createMockMediaFile(0, 0)
      const video2 = createMockMediaFile(0, 60)

      const track = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      expect(sector.startTime).toBe(0)
      expect(sector.endTime).toBe(60)
    })

    it("должен работать с одним видео", () => {
      const video = createMockMediaFile(1500, 45)

      const track = {
        id: "track-1",
        type: "video",
        videos: [video],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      expect(sector.startTime).toBe(1500)
      expect(sector.endTime).toBe(1545)
    })

    it("должен работать с множественными треками", () => {
      const video1 = createMockMediaFile(100, 50)
      const video2 = createMockMediaFile(200, 100)
      const video3 = createMockMediaFile(50, 25)
      const video4 = createMockMediaFile(400, 60)

      const track1 = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }
      const track2 = {
        id: "track-2",
        type: "video",
        videos: [video3],
      }
      const track3 = {
        id: "track-3",
        type: "audio",
        videos: [video4],
      }

      const sector = createMockSector([track1, track2, track3])

      updateSectorTimeRange(sector)

      // Минимальное startTime: 50 (video3)
      expect(sector.startTime).toBe(50)
      // Максимальное endTime: 460 (video4: 400 + 60)
      expect(sector.endTime).toBe(460)
    })

    it("должен обрабатывать очень большие временные значения", () => {
      const largeStartTime = 1e10 // 10 миллиардов секунд
      const largeDuration = 1e6 // 1 миллион секунд

      const video = createMockMediaFile(largeStartTime, largeDuration)

      const track = {
        id: "track-1",
        type: "video",
        videos: [video],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      expect(sector.startTime).toBe(largeStartTime)
      expect(sector.endTime).toBe(largeStartTime + largeDuration)
    })

    it("должен обрабатывать дробные временные значения", () => {
      const video1 = createMockMediaFile(10.5, 5.25)
      const video2 = createMockMediaFile(20.75, 3.1)

      const track = {
        id: "track-1",
        type: "video",
        videos: [video1, video2],
      }

      const sector = createMockSector([track])

      updateSectorTimeRange(sector)

      expect(sector.startTime).toBe(10.5)
      expect(sector.endTime).toBe(23.85) // 20.75 + 3.1
    })

    it("должен модифицировать переданный сектор напрямую", () => {
      const video = createMockMediaFile(1000, 60)
      const track = {
        id: "track-1",
        type: "video",
        videos: [video],
      }

      const sector = createMockSector([track])
      const originalSector = sector

      updateSectorTimeRange(sector)

      // Убеждаемся что это тот же объект
      expect(sector).toBe(originalSector)
      expect(sector.startTime).toBe(1000)
      expect(sector.endTime).toBe(1060)
    })

    it("должен обрабатывать смешанные типы треков", () => {
      const videoFile = createMockMediaFile(100, 60)
      const audioFile = { ...createMockMediaFile(200, 30), type: "audio" as const }

      const videoTrack = {
        id: "video-track",
        type: "video",
        videos: [videoFile],
      }
      const audioTrack = {
        id: "audio-track",
        type: "audio",
        videos: [audioFile],
      }

      const sector = createMockSector([videoTrack, audioTrack])

      updateSectorTimeRange(sector)

      expect(sector.startTime).toBe(100)
      expect(sector.endTime).toBe(230) // audioFile: 200 + 30
    })
  })
})

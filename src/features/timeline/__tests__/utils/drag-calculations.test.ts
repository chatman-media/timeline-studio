/**
 * @vitest-environment jsdom
 *
 * Тесты для утилит расчета drag-drop операций в Timeline
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// SnapMode типа нет, используем строковые литералы
import {
  calculateTimelinePosition,
  canDropOnTrack,
  findInsertionPoint,
  getTrackTypeForMediaFile,
  snapToGrid,
} from "../../utils/drag-calculations"

// Моки для отсутствующих функций
vi.mock("../../hooks/use-clips", () => ({
  useClips: () => ({ clips: [] }),
}))

describe("drag-calculations утилиты", () => {
  describe("calculateTimelinePosition", () => {
    it("правильно рассчитывает позицию времени при базовом timeScale", () => {
      const mouseX = 200
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 0
      const timeScale = 1 // 1 пиксель = 1 секунда

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(200) - rect.left(100) = 100 пикселей = 100 секунд при timeScale 1
      expect(result).toBe(100)
    })

    it("правильно рассчитывает позицию с увеличенным timeScale", () => {
      const mouseX = 300
      const rect = { left: 50, width: 500 } as DOMRect
      const scrollLeft = 0
      const timeScale = 2 // 1 пиксель = 2 секунды

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(300) - rect.left(50) = 250 пикселей / timeScale(2) = 125 секунд
      expect(result).toBe(125)
    })

    it("правильно рассчитывает позицию с уменьшенным timeScale", () => {
      const mouseX = 150
      const rect = { left: 50, width: 200 } as DOMRect
      const scrollLeft = 0
      const timeScale = 0.5 // 1 пиксель = 0.5 секунды

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(150) - rect.left(50) = 100 пикселей / timeScale(0.5) = 200 секунд
      expect(result).toBe(200)
    })

    it("учитывает горизонтальную прокрутку", () => {
      const mouseX = 200
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 50
      const timeScale = 1

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      // mouseX(200) - rect.left(100) + scrollLeft(50) = 150 секунд
      expect(result).toBe(150)
    })

    it("возвращает 0 для отрицательных позиций", () => {
      const mouseX = 50 // левее rect.left
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 0
      const timeScale = 1

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      expect(result).toBe(0)
    })

    it("обрабатывает экстремальные значения timeScale", () => {
      const mouseX = 200
      const rect = { left: 100, width: 400 } as DOMRect
      const scrollLeft = 0

      // Очень большой timeScale
      const resultBig = calculateTimelinePosition(mouseX, rect, scrollLeft, 10)
      expect(resultBig).toBe(10) // 100px / 10 = 10 секунд

      // Очень маленький timeScale
      const resultSmall = calculateTimelinePosition(mouseX, rect, scrollLeft, 0.1)
      expect(resultSmall).toBe(1000) // 100px / 0.1 = 1000 секунд
    })

    it("корректно работает с нулевой шириной контейнера", () => {
      const mouseX = 200
      const rect = { left: 100, width: 0 } as DOMRect
      const scrollLeft = 0
      const timeScale = 1

      const result = calculateTimelinePosition(mouseX, rect, scrollLeft, timeScale)

      expect(result).toBe(100) // mouseX - rect.left
    })
  })

  describe("snapToGrid", () => {
    it("возвращает исходную позицию при режиме 'none'", () => {
      const position = 123.456
      const result = snapToGrid(position, "none")

      expect(result).toBe(position)
    })

    it("возвращает исходную позицию для режима 'grid' (временная реализация)", () => {
      // TODO: В текущей реализации snapToTargets не выполняет привязку к сетке
      // Поэтому функция возвращает исходное значение
      expect(snapToGrid(1.3, "grid")).toBe(1.3)
      expect(snapToGrid(1.7, "grid")).toBe(1.7)
      expect(snapToGrid(0.4, "grid")).toBe(0.4)
      expect(snapToGrid(0.6, "grid")).toBe(0.6)
    })

    it("возвращает исходное значение без округления (временная реализация)", () => {
      expect(snapToGrid(2.49, "grid")).toBe(2.49)
      expect(snapToGrid(2.51, "grid")).toBe(2.51)
      expect(snapToGrid(0.49, "grid")).toBe(0.49)
      expect(snapToGrid(0.51, "grid")).toBe(0.51)
    })

    it("возвращает отрицательные значения без изменений (временная реализация)", () => {
      expect(snapToGrid(-0.3, "grid")).toBe(-0.3)
      expect(snapToGrid(-1.7, "grid")).toBe(-1.7)
    })

    it("возвращает исходную позицию для нереализованных режимов", () => {
      const position = 123.456

      // Эти режимы пока не реализованы (TODO в коде)
      expect(snapToGrid(position, "clips")).toBe(position)
      expect(snapToGrid(position, "markers")).toBe(position)
    })

    it("возвращает большие значения времени без изменений (временная реализация)", () => {
      expect(snapToGrid(3599.7, "grid")).toBe(3599.7)
      expect(snapToGrid(7200.2, "grid")).toBe(7200.2)
    })
  })

  describe("canDropOnTrack", () => {
    const createMockMediaFile = (overrides = {}) =>
      ({
        id: "test-file-id",
        name: "test-file",
        path: "/path/to/file",
        duration: 10,
        isVideo: false,
        isAudio: false,
        isImage: false,
        ...overrides,
      }) as any

    it("разрешает видеофайлы на Video треки", () => {
      const videoFile = createMockMediaFile({ isVideo: true })
      expect(canDropOnTrack(videoFile, "Video")).toBe(true)
    })

    it("разрешает аудиофайлы на Audio треки", () => {
      const audioFile = createMockMediaFile({ isAudio: true })
      expect(canDropOnTrack(audioFile, "Audio")).toBe(true)
    })

    it("разрешает аудиофайлы на Music треки", () => {
      const audioFile = createMockMediaFile({ isAudio: true })
      expect(canDropOnTrack(audioFile, "Music")).toBe(true)
    })

    it("разрешает изображения на Video треки", () => {
      const imageFile = createMockMediaFile({ isImage: true })
      expect(canDropOnTrack(imageFile, "Video")).toBe(true)
    })

    it("не разрешает изображения на Image треки (изображения идут на Video треки)", () => {
      const imageFile = createMockMediaFile({ isImage: true })
      expect(canDropOnTrack(imageFile, "Image")).toBe(false)
    })

    it("запрещает несовместимые комбинации", () => {
      const videoFile = createMockMediaFile({ isVideo: true })
      const audioFile = createMockMediaFile({ isAudio: true })
      const imageFile = createMockMediaFile({ isImage: true })

      // Видео не может на аудио треки
      expect(canDropOnTrack(videoFile, "Audio")).toBe(false)
      expect(canDropOnTrack(videoFile, "Music")).toBe(false)

      // Аудио не может на Video треки
      expect(canDropOnTrack(audioFile, "Video")).toBe(false)
      expect(canDropOnTrack(audioFile, "Image")).toBe(false)

      // Изображения не могут на аудио треки
      expect(canDropOnTrack(imageFile, "Audio")).toBe(false)
      expect(canDropOnTrack(imageFile, "Music")).toBe(false)
    })

    it("обрабатывает файлы без определенного типа", () => {
      const unknownFile = createMockMediaFile() // все флаги false

      // Неопределенные файлы не разрешены ни на каких треках
      expect(canDropOnTrack(unknownFile, "Video")).toBe(false)
      expect(canDropOnTrack(unknownFile, "Audio")).toBe(false)
      expect(canDropOnTrack(unknownFile, "Music")).toBe(false)
      expect(canDropOnTrack(unknownFile, "Image")).toBe(false)
    })

    it("обрабатывает файлы с множественными типами", () => {
      const multiFile = createMockMediaFile({
        isVideo: true,
        isAudio: true,
      })

      // Файл с видео и аудио может быть на Video треках
      expect(canDropOnTrack(multiFile, "Video")).toBe(true)
      // Но также может быть на аудио треках (приоритет аудио в логике)
      expect(canDropOnTrack(multiFile, "Audio")).toBe(true)
      expect(canDropOnTrack(multiFile, "Music")).toBe(true)
    })

    it("обрабатывает неизвестные типы треков", () => {
      const videoFile = createMockMediaFile({ isVideo: true })

      // @ts-expect-error тестируем неизвестный тип трека
      expect(canDropOnTrack(videoFile, "unknown")).toBe(false)
    })
  })

  describe("getTrackTypeForMediaFile", () => {
    const createMockMediaFile = (overrides = {}) =>
      ({
        id: "test-file-id",
        name: "test-file",
        path: "/path/to/file",
        duration: 10,
        isVideo: false,
        isAudio: false,
        isImage: false,
        probeData: null,
        ...overrides,
      }) as any

    it("возвращает 'Video' для видеофайлов", () => {
      const videoFile = createMockMediaFile({ isVideo: true })
      expect(getTrackTypeForMediaFile(videoFile)).toBe("Video")
    })

    it("возвращает 'Audio' для аудиофайлов", () => {
      const audioFile = createMockMediaFile({ isAudio: true })
      expect(getTrackTypeForMediaFile(audioFile)).toBe("Audio")
    })

    it("возвращает 'Video' для изображений (изображения отображаются на Video треках)", () => {
      const imageFile = createMockMediaFile({ isImage: true })
      expect(getTrackTypeForMediaFile(imageFile)).toBe("Video")
    })

    it("определяет приоритет при множественных типах", () => {
      // Видео имеет приоритет над аудио
      const videoAudioFile = createMockMediaFile({
        isVideo: true,
        isAudio: true,
      })
      expect(getTrackTypeForMediaFile(videoAudioFile)).toBe("Video")

      // Видео имеет приоритет над изображением
      const videoImageFile = createMockMediaFile({
        isVideo: true,
        isImage: true,
      })
      expect(getTrackTypeForMediaFile(videoImageFile)).toBe("Video")

      // Аудио имеет приоритет над изображением
      const audioImageFile = createMockMediaFile({
        isAudio: true,
        isImage: true,
      })
      expect(getTrackTypeForMediaFile(audioImageFile)).toBe("Audio")
    })

    it("анализирует probeData при отсутствии флагов", () => {
      const fileWithProbeData = createMockMediaFile({
        probeData: {
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        },
      })

      // Должен вернуть Video так как есть видео стрим
      expect(getTrackTypeForMediaFile(fileWithProbeData)).toBe("Video")
    })

    it("анализирует только аудио в probeData", () => {
      const fileWithAudioProbe = createMockMediaFile({
        probeData: {
          streams: [{ codec_type: "audio" }],
        },
      })

      expect(getTrackTypeForMediaFile(fileWithAudioProbe)).toBe("Audio")
    })

    it("возвращает 'Video' по умолчанию для неопределенных типов", () => {
      const unknownFile = createMockMediaFile()
      expect(getTrackTypeForMediaFile(unknownFile)).toBe("Video")

      const fileWithEmptyProbe = createMockMediaFile({
        probeData: { streams: [] },
      })
      expect(getTrackTypeForMediaFile(fileWithEmptyProbe)).toBe("Video")

      const fileWithUnknownProbe = createMockMediaFile({
        probeData: {
          streams: [{ codec_type: "subtitle" }, { codec_type: "data" }],
        },
      })
      expect(getTrackTypeForMediaFile(fileWithUnknownProbe)).toBe("Video")
    })

    it("обрабатывает поврежденные данные probeData", () => {
      const fileWithBadProbe = createMockMediaFile({
        probeData: {
          streams: null, // поврежденные данные
        },
      })

      expect(getTrackTypeForMediaFile(fileWithBadProbe)).toBe("Video")

      const fileWithMissingProbe = createMockMediaFile({
        probeData: {}, // отсутствует streams
      })

      expect(getTrackTypeForMediaFile(fileWithMissingProbe)).toBe("Video")
    })
  })

  describe("findInsertionPoint", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("возвращает targetTime при базовом использовании", () => {
      const targetTime = 42.5
      const trackId = "track-1"
      const duration = 10

      const result = findInsertionPoint(targetTime, trackId, duration)

      // Функция возвращает объект с insertionTime
      expect(result.insertionTime).toBeCloseTo(targetTime, 5)
    })

    it("обрабатывает различные значения времени", () => {
      const trackId = "track-1"
      const duration = 5

      expect(findInsertionPoint(0, trackId, duration).insertionTime).toBeCloseTo(0, 5)
      expect(findInsertionPoint(100.7, trackId, duration).insertionTime).toBeCloseTo(100.7, 5)
      expect(findInsertionPoint(-5, trackId, duration).insertionTime).toBeCloseTo(0, 5) // отрицательные значения становятся 0
    })

    it("обрабатывает различные длительности", () => {
      const targetTime = 10
      const trackId = "track-1"

      expect(findInsertionPoint(targetTime, trackId, 0).insertionTime).toBeCloseTo(targetTime, 5)
      expect(findInsertionPoint(targetTime, trackId, 1000).insertionTime).toBeCloseTo(targetTime, 5)
    })

    it("обрабатывает различные trackId", () => {
      const targetTime = 20
      const duration = 15

      expect(findInsertionPoint(targetTime, "video-track", duration).insertionTime).toBeCloseTo(targetTime, 5)
      expect(findInsertionPoint(targetTime, "audio-track", duration).insertionTime).toBeCloseTo(targetTime, 5)
      expect(findInsertionPoint(targetTime, "", duration).insertionTime).toBeCloseTo(targetTime, 5)
    })
  })
})

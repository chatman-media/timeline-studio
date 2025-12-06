import type { MediaFile, MediaTrack } from "@/domains/media-management"
import { calculateTimeRanges } from "@/features/media/utils/video"
import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import { createLogger } from "@/lib/tauri-logger"
import type { Sector } from "../types/types"
import { processAudioFiles } from "./audio-tracks"
import { updateSectorTimeRange } from "./tracks-utils"
import { processVideoFiles } from "./video-tracks"

const logger = createLogger("Tracks")

/**
 * Создает треки из медиафайлов
 * @param files - Массив медиафайлов
 * @param existingTracks - Существующие треки (опционально)
 * @returns Массив созданных секторов
 */
export const createTracksFromFiles = (files: MediaFile[], existingTracks: MediaTrack[] = []): Sector[] => {
  logger.debugSync("createTracksFromFiles called", {
    filesCount: files.length,
    files: files.map((f) => f.name),
    existingTracksCount: existingTracks.length,
    existingTracks: existingTracks.map((t) => t.name),
  })

  // Разделяем файлы на видео и аудио
  const videoFiles = files.filter((file) => file.probeData?.streams.some((stream) => stream.codec_type === "video"))
  const audioFiles = files.filter(
    (file) =>
      !file.probeData?.streams.some((stream) => stream.codec_type === "video") &&
      file.probeData?.streams.some((stream) => stream.codec_type === "audio"),
  )

  logger.debugSync("Separated files", {
    videoFilesCount: videoFiles.length,
    videoFiles: videoFiles.map((f) => f.name),
    audioFilesCount: audioFiles.length,
    audioFiles: audioFiles.map((f) => f.name),
  })

  // Сортируем файлы по времени начала
  const sortedVideoFiles = [...videoFiles].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0))
  const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0))

  const sectors: Sector[] = []

  // Получаем текущий язык из i18n
  const currentLanguage = i18n.language || "ru"

  // Группируем видео по дням
  const videoFilesByDay = sortedVideoFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    const startTime = file.startTime ?? Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  logger.debugSync("Video files grouped by day", {
    days: Object.entries(videoFilesByDay).map(([date, files]) => ({
      date,
      filesCount: files.length,
      files: files.map((f) => f.name),
    })),
  })

  // Получаем существующие секторы по дням (упрощено)
  const existingSectorsByDay: Record<string, { sector: Sector | null }> = {}

  // Обрабатываем видео файлы по дням
  for (const [date, dayFiles] of Object.entries(videoFilesByDay)) {
    logger.debugSync("Processing video files for date", { date, filesCount: dayFiles.length })

    // Получаем существующие треки для этого дня или создаем новый сектор
    // Ищем существующий сектор по дате или по имени, содержащему дату
    let existingSector = existingSectorsByDay[date]?.sector

    // Если сектор не найден по дате, ищем по имени в существующих секторах
    if (!existingSector) {
      // Форматируем дату для поиска в имени сектора
      const dateObj = new Date(date)
      const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
        includeYear: true,
        longFormat: true,
      })

      // Ищем сектор по имени в списке всех существующих секторов
      for (const sectorDate in existingSectorsByDay) {
        const sectorInfo = existingSectorsByDay[sectorDate]
        if (sectorInfo.sector?.name.includes(formattedDate)) {
          existingSector = sectorInfo.sector
          break
        }
      }
    }

    logger.debugSync("Existing sector check", { date, hasExistingSector: !!existingSector })

    // Форматируем дату для отображения с помощью универсального метода
    const dateObj = new Date(date)
    const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
      includeYear: true,
      longFormat: true,
    })

    // Создаем или используем существующий сектор для всех файлов дня
    const sector: Sector = existingSector ?? {
      // Используем дату в формате YYYY-MM-DD как ID сектора для лучшей совместимости
      id: date,
      name: i18n.t("timeline.section.sectorName", {
        date: formattedDate,
        defaultValue: `Section ${formattedDate}`,
      }),
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
      zoomLevel: 1,
      scrollPosition: 0,
      isLocked: false,
      combinedDuration: 0,
    }

    logger.debugSync("Using sector", { sectorName: sector.name, tracksCount: sector.tracks.length })

    // Обрабатываем каждый файл и добавляем его на подходящую дорожку
    processVideoFiles(dayFiles, sector)

    // Обновляем timeRanges сектора
    sector.timeRanges = calculateTimeRanges(dayFiles)

    // Обновляем время начала и конца секции
    updateSectorTimeRange(sector)

    // Добавляем сектор в список, если он новый
    if (!existingSector) {
      sectors.push(sector)
    } else {
      // Обновляем существующий сектор в списке
      const sectorIndex = sectors.findIndex((s) => s.id === existingSector.id)
      if (sectorIndex !== -1) {
        sectors[sectorIndex] = sector
      } else {
        sectors.push(sector)
      }
    }
  }

  // Обрабатываем аудио файлы по дням
  processAudioFiles(sortedAudioFiles, sectors, existingSectorsByDay, currentLanguage)

  logger.debugSync("Created sectors", {
    sectorsCount: sectors.length,
    sectors: sectors.map((s) => ({
      name: s.name,
      tracksCount: s.tracks.length,
      tracks: s.tracks.map((t) => ({
        name: t.name,
        type: t.type,
        videosCount: t.videos?.length ?? 0,
        videos: t.videos?.map((v) => v.name),
      })),
    })),
  })

  return sectors
}

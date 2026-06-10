import { nanoid } from "nanoid"
import type { MediaFile } from "@timeline-studio/core/types"
import { calculateTimeRanges } from "@/features/media/utils/video"
import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import type { Sector } from "../types/types"
import { doTimeRangesOverlap } from "./media-utils"
import { updateSectorTimeRange } from "./tracks-utils"

/**
 * Обрабатывает аудиофайлы и добавляет их на соответствующие дорожки
 * @param sortedAudioFiles - Отсортированные аудиофайлы
 * @param sectors - Массив секторов
 * @param existingSectorsByDay - Существующие секторы по дням
 * @param currentLanguage - Текущий язык
 */
export function processAudioFiles(
  sortedAudioFiles: MediaFile[],
  sectors: Sector[],
  existingSectorsByDay: Record<string, { sector: Sector | null }>,
  currentLanguage: string,
): void {
  // Группируем аудио файлы по дням
  const audioFilesByDay = sortedAudioFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    const startTime = file.startTime ?? Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  // Обрабатываем аудио файлы по дням
  for (const [date, dayFiles] of Object.entries(audioFilesByDay)) {
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

    // existingDayTracks убраны для упрощения архитектуры

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

    // Обрабатываем каждый файл и добавляем его на подходящую дорожку
    for (const file of dayFiles) {
      const fileStartTime = file.startTime ?? 0
      const fileDuration = file.duration ?? 0
      const fileEndTime = fileStartTime + fileDuration

      // Ищем подходящую дорожку среди существующих
      let trackFound = false

      // Сначала проверяем существующие дорожки в порядке их индекса (сверху вниз)
      const sortedTracks = sector.tracks
        .filter((track) => track.type === "audio")
        .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0))

      for (const track of sortedTracks) {
        // Проверяем, пересекается ли новый файл с существующими аудио на этой дорожке
        let hasOverlap = false

        if (track.videos) {
          for (const audio of track.videos) {
            const audioStartTime = audio.startTime ?? 0
            const audioDuration = audio.duration ?? 0
            const audioEndTime = audioStartTime + audioDuration

            if (doTimeRangesOverlap(fileStartTime, fileEndTime, audioStartTime, audioEndTime)) {
              hasOverlap = true
              break
            }
          }
        }

        // Если нет пересечений, добавляем файл на эту дорожку
        if (!hasOverlap) {
          // Если это дорожка из существующего сектора, добавляем ее в текущий сектор
          if (!sector.tracks.includes(track)) {
            const updatedVideos = [...(track.videos ?? []), file]
            sector.tracks.push({
              ...track,
              videos: updatedVideos,
              startTime: Math.min(track.startTime ?? Number.POSITIVE_INFINITY, fileStartTime),
              endTime: Math.max(track.endTime ?? 0, fileEndTime),
              combinedDuration: (track.combinedDuration ?? 0) + fileDuration,
              timeRanges: calculateTimeRanges(updatedVideos),
            })
          } else {
            // Обновляем существующую дорожку в текущем секторе
            const trackIndex = sector.tracks.findIndex((t) => t.id === track.id)
            if (trackIndex !== -1) {
              const updatedVideos = [...(sector.tracks[trackIndex].videos ?? []), file]
              sector.tracks[trackIndex] = {
                ...sector.tracks[trackIndex],
                videos: updatedVideos,
                startTime: Math.min(sector.tracks[trackIndex].startTime ?? Number.POSITIVE_INFINITY, fileStartTime),
                endTime: Math.max(sector.tracks[trackIndex].endTime ?? 0, fileEndTime),
                combinedDuration: (sector.tracks[trackIndex].combinedDuration ?? 0) + fileDuration,
                timeRanges: calculateTimeRanges(updatedVideos),
              }
            }
          }

          trackFound = true
          break
        }
      }

      // Если не нашли подходящую дорожку, создаем новую
      if (!trackFound) {
        createNewAudioTrack(file, sector, fileStartTime, fileEndTime, fileDuration)
      }
    }

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
}

/**
 * Создает новую аудиодорожку
 * @param file - Файл для добавления
 * @param sector - Сектор, в который добавляется дорожка
 * @param fileStartTime - Время начала файла
 * @param fileEndTime - Время окончания файла
 * @param fileDuration - Длительность файла
 */
function createNewAudioTrack(
  file: MediaFile,
  sector: Sector,
  fileStartTime: number,
  fileEndTime: number,
  fileDuration: number,
): void {
  // Определяем максимальный номер аудиодорожки для этого дня
  const maxAudioIndex = Math.max(
    0,
    ...sector.tracks.filter((track) => track.type === "audio").map((track) => Number(track.index) || 0),
  )

  // Создаем новую дорожку
  const nextAudioNumber = maxAudioIndex + 1
  const audioTrackName = i18n.t("timeline.tracks.audioWithNumber", {
    number: nextAudioNumber,
    defaultValue: `Audio ${nextAudioNumber}`,
  })

  sector.tracks.push({
    id: nanoid(),
    name: audioTrackName,
    type: "audio",
    isActive: false,
    videos: [file],
    startTime: fileStartTime,
    endTime: fileEndTime,
    combinedDuration: fileDuration,
    timeRanges: calculateTimeRanges([file]),
    index: nextAudioNumber,
    volume: 1,
    isMuted: false,
    isLocked: false,
    isVisible: true,
    cameraName: audioTrackName, // Устанавливаем cameraName для совместимости
  })
}

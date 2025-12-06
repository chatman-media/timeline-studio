import { nanoid } from "nanoid"
import type { MediaFile } from "@/domains/media-management"
import { calculateTimeRanges } from "@/features/media/utils/video"
import i18n from "@/i18n"
import { createLogger } from "@/lib/tauri-logger"
import type { Sector } from "../types/types"
import { doTimeRangesOverlap } from "./media-utils"

const logger = createLogger("VideoTracks")

/**
 * Обрабатывает видеофайлы и добавляет их на соответствующие дорожки
 * @param dayFiles - Файлы для обработки
 * @param sector - Сектор, в который добавляются дорожки
 * @param existingDayTracks - Существующие дорожки
 */
export function processVideoFiles(dayFiles: MediaFile[], sector: Sector): void {
  for (const file of dayFiles) {
    const fileStartTime = file.startTime ?? 0
    const fileDuration = file.duration ?? 0
    const fileEndTime = fileStartTime + fileDuration

    // Ищем подходящую дорожку среди существующих
    let trackFound = false

    // Создаем идентификатор камеры на основе разрешения
    let cameraId = null

    // Получаем видеопоток из probeData
    const videoStream = file.probeData?.streams.find((stream) => stream.codec_type === "video")

    // Используем разрешение как идентификатор камеры, если доступно
    if (videoStream?.width && videoStream.height) {
      // Используем только разрешение для определения камеры
      cameraId = `${videoStream.width}x${videoStream.height}`
    } else {
      // Если разрешение не определено, используем уникальный идентификатор
      cameraId = `camera-${nanoid(6)}`
      logger.debugSync("Using generated camera ID", { fileName: file.name, cameraId })
    }

    logger.debugSync("Extracted camera ID", { fileName: file.name, cameraId: cameraId || "unknown" })

    // Сначала проверяем существующие дорожки в порядке их индекса (сверху вниз)
    const sortedTracks = sector.tracks
      .filter((track) => track.type === "video")
      .sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0))

    for (const track of sortedTracks) {
      // Проверяем, пересекается ли новый файл с существующими видео на этой дорожке
      let hasOverlap = false

      if (track.videos && track.videos.length > 0) {
        // Проверяем, с какой камеры видео на этой дорожке
        let trackCameraId = null
        const trackVideo = track.videos[0]

        // Сначала проверяем имя дорожки, если оно в формате "Camera X"
        // Это имеет приоритет над другими методами определения ID камеры
        const trackNameMatch = track.name?.match(/Camera (\d+)/)
        if (trackNameMatch) {
          // Используем номер камеры из имени дорожки
          trackCameraId = trackNameMatch[1]
        }

        // Если trackCameraId не был определен по имени дорожки,
        // используем разрешение или генерируем уникальный ID
        if (!trackCameraId) {
          // Получаем видеопоток из probeData
          const trackVideoStream = trackVideo.probeData?.streams.find((stream) => stream.codec_type === "video")

          // Используем разрешение как идентификатор камеры
          if (trackVideoStream?.width && trackVideoStream.height) {
            // Используем только разрешение для определения камеры
            trackCameraId = `${trackVideoStream.width}x${trackVideoStream.height}`
          } else {
            // Если разрешение не определено, используем уникальный идентификатор
            trackCameraId = `camera-${nanoid(6)}`
            logger.debugSync("Using generated camera ID for track", { videoName: trackVideo.name, trackCameraId })
          }
        }

        // Сначала проверяем временное перекрытие для всех видео
        // Если видео не пересекаются по времени, они могут быть на одной дорожке
        let hasTimeOverlap = false

        for (const video of track.videos) {
          const videoStartTime = video.startTime ?? 0
          const videoDuration = video.duration ?? 0
          const videoEndTime = videoStartTime + videoDuration

          const overlap = doTimeRangesOverlap(fileStartTime, fileEndTime, videoStartTime, videoEndTime)

          if (overlap) {
            hasTimeOverlap = true
            break
          }
        }

        // Если нет временного перекрытия, можно использовать эту дорожку
        if (!hasTimeOverlap) {
          hasOverlap = false
          break
        }

        // Если есть временное перекрытие, но это та же камера, все равно используем эту дорожку
        // Видео с одной камеры всегда должны быть на одной дорожке
        if (cameraId && trackCameraId && cameraId === trackCameraId) {
          hasOverlap = false // Нет перекрытия, используем ту же дорожку
          break
        }

        // Если есть временное перекрытие и это разные камеры, нельзя использовать эту дорожку
        hasOverlap = true
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

    // Если не нашли подходящую дорожку, ищем самую раннюю дорожку без временного перекрытия
    if (!trackFound) {
      // Сортируем дорожки по индексу (сверху вниз)
      const tracksWithoutOverlap = []

      // Проверяем все дорожки на временное перекрытие
      for (const track of sortedTracks) {
        if (track.videos && track.videos.length > 0) {
          let hasOverlap = false

          // Проверяем временное перекрытие со всеми видео на дорожке
          for (const video of track.videos) {
            const videoStartTime = video.startTime ?? 0
            const videoDuration = video.duration ?? 0
            const videoEndTime = videoStartTime + videoDuration

            if (doTimeRangesOverlap(fileStartTime, fileEndTime, videoStartTime, videoEndTime)) {
              hasOverlap = true
              break
            }
          }

          // Если нет перекрытия, добавляем дорожку в список подходящих
          if (!hasOverlap) {
            tracksWithoutOverlap.push(track)
          }
        }
      }

      // Если нашли дорожки без перекрытия, используем самую раннюю (с наименьшим индексом)
      if (tracksWithoutOverlap.length > 0) {
        // Сортируем по индексу и берем первую дорожку
        const track = tracksWithoutOverlap.sort((a, b) => (Number(a.index) || 0) - (Number(b.index) || 0))[0]

        // Если это дорожка из существующего сектора, добавляем ее в текущий сектор
        if (!sector.tracks.includes(track)) {
          sector.tracks.push({
            ...track,
            videos: [...(track.videos ?? []), file],
            startTime: Math.min(track.startTime ?? Number.POSITIVE_INFINITY, fileStartTime),
            endTime: Math.max(track.endTime ?? 0, fileEndTime),
            combinedDuration: (track.combinedDuration ?? 0) + fileDuration,
            timeRanges: calculateTimeRanges([...(track.videos ?? []), file]),
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
      }
    }

    // Если все еще не нашли подходящую дорожку, создаем новую
    if (!trackFound) {
      createNewVideoTrack(file, sector, fileStartTime, fileEndTime, fileDuration, cameraId)
    }
  }
}

/**
 * Создает новую видеодорожку
 * @param file - Файл для добавления
 * @param sector - Сектор, в который добавляется дорожка
 * @param fileStartTime - Время начала файла
 * @param fileEndTime - Время окончания файла
 * @param fileDuration - Длительность файла
 * @param cameraId - Идентификатор камеры
 */
function createNewVideoTrack(
  file: MediaFile,
  sector: Sector,
  fileStartTime: number,
  fileEndTime: number,
  fileDuration: number,
  cameraId: string | null,
): void {
  // Определяем максимальный номер видеодорожки для этого дня
  const maxVideoIndex = Math.max(
    0,
    ...sector.tracks.filter((track) => track.type === "video").map((track) => Number(track.index) || 0),
  )

  // Находим максимальный номер камеры в текущем секторе
  let maxCameraNumber = 0

  // Ищем дорожки с названием "Camera X" и находим максимальный номер
  for (const track of sector.tracks) {
    const cameraMatch = track.name?.match(/Camera (\d+)/)
    if (cameraMatch) {
      const cameraNumber = Number.parseInt(cameraMatch[1], 10)
      if (cameraNumber > maxCameraNumber) {
        maxCameraNumber = cameraNumber
      }
    }
  }

  // Всегда используем формат "Camera X" для видео треков
  const nextCameraNumber = maxCameraNumber + 1
  const trackName = i18n.t("timeline.tracks.cameraWithNumber", {
    number: nextCameraNumber,
    defaultValue: `Camera ${nextCameraNumber}`,
  })

  // Создаем новую дорожку
  sector.tracks.push({
    id: nanoid(),
    name: trackName,
    type: "video",
    isActive: false,
    videos: [file],
    startTime: fileStartTime,
    endTime: fileEndTime,
    combinedDuration: fileDuration,
    timeRanges: calculateTimeRanges([file]),
    index: maxVideoIndex + 1,
    volume: 1,
    isMuted: false,
    isLocked: false,
    isVisible: true,
    cameraId: cameraId ?? undefined,
  })
}

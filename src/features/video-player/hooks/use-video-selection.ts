import { useCallback } from "react"
import type { MediaFile } from "@/domains/media-management"
import { usePlayer } from "@/domains/video-editing"
import { logInfo } from "@/lib/tauri-logger"

// Моковые импорты для браузера и таймлайна - нужно заменить на реальные
// import { useMedia } from "@/features/browser/hooks/use-media"
// import { useTimeline } from "@/features/timeline/hooks/use-timeline"

interface VideoSelectionHook {
  getVideosForPreview: (count?: number) => MediaFile[]
  getCurrentVideo: () => MediaFile | null
  hasEnoughVideos: (count: number) => boolean
}

/**
 * Хук для унификации выбора видео из браузера или таймлайна
 * для функции "Применить" в превью компонентах
 */
export function useVideoSelection(): VideoSelectionHook {
  logInfo("[useVideoSelection] Инициализация хука")

  const { videoSource, previewMedia } = usePlayer()

  // TODO: Раскомментировать когда будут доступны хуки
  // const { selectedFiles, groupedFiles } = useMedia()
  // const { currentTime, tracks } = useTimeline()

  const getVideosForPreview = useCallback(
    (count = 1): MediaFile[] => {
      if (videoSource === "browser") {
        // Режим браузера: используем текущее preview media + следующие файлы
        if (previewMedia) {
          // Временно возвращаем только текущее медиа
          // TODO: Добавить логику получения следующих файлов из браузера
          return [previewMedia].slice(0, count)
        }

        // TODO: Реализовать получение файлов из браузера
        // const selected = selectedFiles[0]
        // const allFiles = groupedFiles.flatMap(g => g.files)
        // const startIndex = selected ? allFiles.indexOf(selected) : 0
        // return allFiles.slice(startIndex, startIndex + count)

        return []
      }
      // Режим таймлайна: получаем видео с параллельных треков в текущий момент времени
      // TODO: Реализовать получение видео из таймлайна
      // return tracks
      //   .filter(track => track.type === 'video')
      //   .map(track => {
      //     const clip = track.clips.find(c =>
      //       c.startTime <= currentTime &&
      //       c.endTime >= currentTime
      //     )
      //     return clip?.mediaFile
      //   })
      //   .filter(Boolean)
      //   .slice(0, count)

      // Временно возвращаем preview media если оно есть
      return previewMedia ? [previewMedia].slice(0, count) : []
    },
    [videoSource, previewMedia],
  )

  const getCurrentVideo = useCallback((): MediaFile | null => {
    const videos = getVideosForPreview(1)
    return videos.length > 0 ? videos[0] : null
  }, [getVideosForPreview])

  const hasEnoughVideos = useCallback(
    (count: number): boolean => {
      const videos = getVideosForPreview(count)
      return videos.length >= count
    },
    [getVideosForPreview],
  )

  return {
    getVideosForPreview,
    getCurrentVideo,
    hasEnoughVideos,
  }
}

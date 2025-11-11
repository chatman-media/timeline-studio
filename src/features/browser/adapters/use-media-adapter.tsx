import type React from "react"
import { useMemo } from "react"

import { useAppSettings, useFavorites } from "@/features/app-state"
import { MediaPreview } from "@/features/browser/components/preview/media-preview"
import { parseDuration, parseFileSize } from "@/features/browser/utils"
import { useDraggable } from "@/features/drag-drop"
import { getFileType } from "@/features/media"
import { useMediaImport } from "@/features/media/hooks/use-media-import"
import type { MediaFile } from "@/features/media/types/media"
import i18n from "@/i18n"
import type { MediaItem } from "@/types/generated/tauri-bindings"
import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"
import { getDateGroup, getDurationGroup } from "../utils/grouping"

// Адаптер типа для MediaFile чтобы соответствовать ListItem
type MediaListItem = MediaFile & ListItem

/**
 * Компонент превью для медиафайлов - адаптер для MediaPreview
 */
const MediaPreviewWrapper: React.FC<PreviewComponentProps<MediaFile>> = ({ item: file, size, viewMode, onClick }) => {
  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "media",
    () => file,
    () => ({
      url: file.thumbnailPath || file.path,
      width: 120,
      height: 80,
    }),
  )

  return (
    <div onClick={() => onClick?.(file)} {...dragProps} className="cursor-pointer">
      <MediaPreview
        file={file}
        size={typeof size === "number" ? size : size.width}
        showFileName={viewMode === "list"}
      />
    </div>
  )
}

/**
 * Хук для создания адаптера медиафайлов с использованием React хуков
 */
export function useMediaAdapter(): ListAdapter<MediaListItem> {
  const { connectionError, projectState } = useAppSettings()
  const { isItemFavorite } = useFavorites()
  const { importFile, importFolder, isImporting } = useMediaImport()

  const allMediaFiles = useMemo(() => {
    // Получаем медиа файлы из media pool в новой архитектуре
    const mediaItems = projectState?.project?.media_pool?.items || {}

    // Отладочный лог для диагностики проблемы с персистентностью медиа
    const mediaCount = Object.keys(mediaItems).length
    if (mediaCount > 0) {
      console.log("[MediaAdapter] Media files in pool:", {
        count: mediaCount,
        projectId: projectState?.project?.id,
        projectName: projectState?.project?.metadata?.name,
        fileIds: Object.keys(mediaItems),
      })
    }

    // Преобразуем объект MediaItem в массив MediaFile
    return Object.values(mediaItems).map((item) => {
      const mediaItem = item as MediaItem
      // Конвертируем duration обратно в формат строки времени для совместимости
      let durationStr = "0"
      if (mediaItem.duration) {
        const hours = Math.floor(mediaItem.duration / 3600)
        const minutes = Math.floor((mediaItem.duration % 3600) / 60)
        const seconds = Math.floor(mediaItem.duration % 60)
        durationStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }

      return {
        ...mediaItem,
        // Мапим поля из MediaItem в MediaFile
        startTime: (mediaItem as any).startTime || Date.now() / 1000, // Используем сохраненное значение или текущее время
        size:
          (mediaItem as any).size ||
          (mediaItem.metadata?.bitrate
            ? `${Math.round((mediaItem.metadata.bitrate * (mediaItem.duration || 0)) / 8 / 1024 / 1024)}MB`
            : "0MB"),
        duration: durationStr,
        thumbnailPath: mediaItem.thumbnail,
        type: mediaItem.media_type?.toLowerCase() || "video",
        isVideo: (mediaItem.media_type as string) === "Video",
        isAudio: (mediaItem.media_type as string) === "Audio",
        isImage: (mediaItem.media_type as string) === "Image",
        isLoadingMetadata: false,
        // Добавляем probeData для совместимости с тестами
        probeData:
          (mediaItem as any).probeData ||
          (mediaItem.metadata
            ? {
                format: {
                  size: mediaItem.metadata.bitrate ? (mediaItem.metadata.bitrate * (mediaItem.duration || 0)) / 8 : 0,
                  tags: {},
                },
                streams: [],
              }
            : undefined),
      }
    })
  }, [projectState?.project?.media_pool?.items])

  // V2 не использует общий loading состояние, используем состояние импорта
  const mediaLoading = isImporting

  return {
    // Хук для получения данных
    useData: () => ({
      items: allMediaFiles as unknown as MediaListItem[],
      loading: mediaLoading,
      error: connectionError ? new Error(connectionError) : null,
    }),

    // Компонент превью
    PreviewComponent: MediaPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (file, sortBy) => {
      switch (sortBy) {
        case "name":
          return file.name.toLowerCase()

        case "size":
          // Приоритетно используем размер из метаданных
          if (file.probeData?.format.size !== undefined) {
            return file.probeData.format.size
          }
          // Иначе парсим размер
          return parseFileSize(file.size)

        case "duration":
          return parseDuration(file.duration)
        default:
          return file.startTime || 0
      }
    },

    // Функция для получения текста для поиска
    getSearchableText: (file) => {
      const texts = [
        file.name,
        String(file.probeData?.format.tags?.title || ""),
        String(file.probeData?.format.tags?.artist || ""),
        String(file.probeData?.format.tags?.album || ""),
      ]
      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (file, groupBy) => {
      const currentLanguage = i18n.language || "ru"

      switch (groupBy) {
        case "type": {
          const fileType = getFileType(file)
          return i18n.t(`browser.media.${fileType}`)
        }

        case "date": {
          // Для изображений используем дату создания файла, если она доступна
          let timestamp = file.startTime
          if (!timestamp && /\.(jpg|jpeg|png|gif|webp)$/i.exec(file.name)) {
            // Пробуем получить дату из метаданных
            timestamp = file.probeData?.format.tags?.creation_time
              ? new Date(file.probeData.format.tags.creation_time).getTime() / 1000
              : 0
          }
          return getDateGroup(timestamp, currentLanguage)
        }

        case "duration": {
          const duration = parseDuration(file.duration)
          return getDurationGroup(duration)
        }

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу
    matchesFilter: (file, filterType) => {
      if (filterType === "all") return true

      // Проверяем, загружены ли метаданные
      if (file.isLoadingMetadata === true) {
        // Если метаданные еще загружаются, используем базовые свойства файла
        if (filterType === "video" && file.isVideo) return true
        if (filterType === "audio" && file.isAudio) return true
        if (filterType === "image" && file.isImage) return true
        return false
      }

      // Если метаданные загружены, используем их для более точной фильтрации
      if (filterType === "video") {
        return file.isVideo || file.probeData?.streams.some((s) => s.codec_type === "video") || false
      }

      if (filterType === "audio") {
        return file.isAudio || file.probeData?.streams.some((s) => s.codec_type === "audio") || false
      }

      if (filterType === "image") {
        return file.isImage || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      }

      return false
    },

    // Обработчики импорта
    importHandlers: {
      importFile: async () => {
        await importFile()
      },
      importFolder: async () => {
        await importFolder()
      },
      isImporting,
    },

    // Проверка избранного
    isFavorite: (file) => isItemFavorite(file, "media"),

    // Тип для системы избранного
    favoriteType: "media",
  }
}

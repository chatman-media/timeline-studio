import { Trash2 } from "lucide-react"
import type React from "react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useFavorites } from "@/core/hooks"
import type { MediaFile } from "@/domains/media-management"
import { useMediaManagement } from "@/domains/media-management"
import { MediaPreview } from "@/features/browser/components/preview/media-preview"
import { parseFileSize } from "@/features/browser/utils"
import { useDraggable } from "@/features/drag-drop"
import { getFileType } from "@/features/media"
import i18n from "@/i18n"
import { formatDurationSeconds, parseDurationString } from "@/lib/duration-formatter"
import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"
import { getDateGroup, getDurationGroup } from "../utils/grouping"

// Адаптер типа для MediaFile чтобы соответствовать ListItem
type MediaListItem = MediaFile & ListItem

/**
 * Компонент превью для медиафайлов - адаптер для MediaPreview
 * Клик по видео обрабатывается внутри VideoStream (воспроизведение)
 * Кнопка "+" обрабатывается в AddMediaButton (добавление в ресурсы)
 * Drag & Drop используется для переноса на таймлайн
 * Контекстное меню используется для удаления файла
 */
const MediaPreviewWrapper: React.FC<PreviewComponentProps<MediaFile>> = ({ item: file, size, viewMode }) => {
  const { t } = useTranslation()
  const { removeMedia } = useMediaManagement()

  // Используем DragDropManager для перетаскивания на таймлайн
  const dragProps = useDraggable(
    "media",
    () => file,
    () => ({
      url: file.thumbnailPath || file.path,
      width: 120,
      height: 80,
    }),
  )

  const handleDelete = useCallback(async () => {
    if (file.id) {
      await removeMedia(file.id)
    }
  }, [file.id, removeMedia])

  return (
    <ContextMenu data-oid="39ri465">
      <ContextMenuTrigger asChild data-oid="kd:jd:m">
        <div {...dragProps} className="cursor-pointer" data-oid="nhf_-vm">
          <MediaPreview
            file={file}
            size={typeof size === "number" ? size : size.width}
            showFileName={viewMode === "list"}
            data-oid="1qqqjyk"
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent data-oid="8jb:dto">
        <ContextMenuItem variant="destructive" onClick={handleDelete} data-oid="-1ebg5w">
          <Trash2 className="size-4" data-oid="3_u1v-9" />
          {t("common.delete", "Удалить")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/**
 * Хук для создания адаптера медиафайлов с использованием React хуков
 */
export function useMediaAdapter(): ListAdapter<MediaListItem> {
  const { isItemFavorite } = useFavorites()
  const { mediaPool, isLoading, error, importFiles, selectMediaFiles, selectMediaDirectory } = useMediaManagement()

  const allMediaFiles = useMemo(() => {
    // ✅ НОВАЯ АРХИТЕКТУРА: Читаем из MediaManagement Provider
    // mediaPool синхронизируется через события MediaAdded/MediaRemoved/MediaUpdated
    // ✅ FIX: Используем entries() для получения и UUID (id), и MediaInfo
    const mediaItems = Array.from(mediaPool.entries())

    // Отладочный лог
    if (mediaItems.length > 0) {
      console.log("[MediaAdapter] Media pool files:", {
        count: mediaItems.length,
        files: mediaItems.map(([id, m]) => ({
          id,
          name: m.name,
          path: m.path,
        })),
      })

      // Проверка на дубли
      const nameCount = new Map<string, number>()
      mediaItems.forEach(([_, m]) => {
        nameCount.set(m.name, (nameCount.get(m.name) || 0) + 1)
      })
      const duplicates = Array.from(nameCount.entries()).filter(([_, count]) => count > 1)
      if (duplicates.length > 0) {
        console.error("[MediaAdapter] ДУБЛИ ОБНАРУЖЕНЫ:", duplicates)
      }
    }

    // Преобразуем MediaInfo в MediaFile
    // ✅ FIX: Деструктурируем [mediaId, mediaInfo] из entries
    return mediaItems.map(([mediaId, mediaInfo]) => {
      // ✅ Используем стандартный форматер для duration
      const durationStr = formatDurationSeconds(mediaInfo.duration ?? 0)

      // Получаем bitrate из метаданных если это видео
      const bitrate =
        mediaInfo.metadata?.type === "Video" || mediaInfo.metadata?.type === "Audio"
          ? mediaInfo.metadata.bitrate
          : undefined

      // Получаем codec из метаданных для video файлов
      const videoCodec =
        mediaInfo.metadata?.type === "Video" ? (mediaInfo.metadata as { codec?: string }).codec : undefined

      return {
        // ✅ FIX: Добавляем id из ключа mediaPool (UUID от backend)
        id: mediaId,
        path: mediaInfo.path,
        name: mediaInfo.name,
        // ✅ FIX: Передаём videoCodec для определения H.265/HEVC
        videoCodec,
        // Мапим поля из MediaInfo в MediaFile
        startTime: Date.now() / 1000, // Используем текущее время для сортировки
        size:
          bitrate && mediaInfo.duration ? `${Math.round((bitrate * mediaInfo.duration) / 8 / 1024 / 1024)}MB` : "0MB",
        duration: durationStr,
        thumbnailPath: mediaInfo.thumbnailPath,
        type: mediaInfo.type.toLowerCase(),
        isVideo: mediaInfo.type === "Video",
        isAudio: mediaInfo.type === "Audio",
        isImage: mediaInfo.type === "Image",
        isLoadingMetadata: false,
        // 🆕 FIX: Передаём proxy из MediaInfo для сохранения сгенерированного прокси
        proxy: mediaInfo.proxy,
        // Добавляем probeData для совместимости с тестами
        probeData: mediaInfo.metadata
          ? {
              format: {
                size: bitrate && mediaInfo.duration ? (bitrate * mediaInfo.duration) / 8 : 0,
                tags: {},
              },
              // ✅ FIX: Добавляем stream с codec_name для H.265 детекции
              streams: videoCodec
                ? [
                    {
                      codec_type: "video" as const,
                      codec_name: videoCodec,
                      index: 0,
                    },
                  ]
                : [],
            }
          : undefined,
      }
    })
  }, [mediaPool])

  // ✅ Используем состояние из MediaManagement Provider
  const mediaLoading = isLoading

  return {
    // Хук для получения данных
    useData: () => ({
      items: allMediaFiles as unknown as MediaListItem[],
      loading: mediaLoading,
      error: error ? new Error(error) : null,
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
          // duration хранится как строка "MM:SS" или "HH:MM:SS", парсим в секунды
          return parseDurationString(file.duration) ?? 0
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
          // duration хранится как строка "MM:SS" или "HH:MM:SS", парсим в секунды
          const duration = parseDurationString(file.duration) ?? 0
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
        // ✅ Используем selectMediaFiles из MediaManagement Provider
        const files = await selectMediaFiles()
        if (files && files.length > 0) {
          await importFiles(files, {})
        }
      },
      importFolder: async () => {
        // Используем selectMediaDirectory из MediaManagement Provider
        const directory = await selectMediaDirectory()
        // selectMediaDirectory автоматически импортирует файлы, поэтому не нужно вызывать importFiles
        if (!directory) {
          // Пользователь отменил выбор директории
          return
        }
      },
      isImporting: isLoading,
    },

    // Проверка избранного
    isFavorite: (file) => isItemFavorite(file, "media"),

    // Тип для системы избранного
    favoriteType: "media",
  }
}

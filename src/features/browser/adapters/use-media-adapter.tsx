import { Trash2 } from "lucide-react"
import type React from "react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useFavorites } from "@/core/hooks"
import type { MediaFile } from "@/domains/media-management"
import { useMediaManagement } from "@/domains/media-management"
import { parseFileSize } from "@/domains/shared/utils/file"
import { MediaPreview } from "@/features/browser/components/preview/media-preview"
import { FileMetadata, getFileType } from "@/features/media"
import i18n from "@/i18n"
import { cn } from "@/lib/utils"
import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"
import { getDateGroup, getDurationGroup } from "../utils/grouping"

// Адаптер типа для MediaFile чтобы соответствовать ListItem
type MediaListItem = MediaFile & ListItem

/**
 * Получает aspect ratio видео из probeData
 * @returns [width, height] или [16, 9] по умолчанию
 */
function getAspectRatio(file: MediaFile): [number, number] {
  const videoStream = file.probeData?.streams?.find((s) => s.codec_type === "video")
  if (videoStream && "width" in videoStream && "height" in videoStream) {
    const width = (videoStream as { width?: number }).width
    const height = (videoStream as { height?: number }).height
    if (width && height) {
      return [width, height]
    }
  }
  // Для изображений пробуем получить из метаданных
  if (file.isImage && file.probeData?.streams?.[0]) {
    const stream = file.probeData.streams[0] as {
      width?: number
      height?: number
    }
    if (stream.width && stream.height) {
      return [stream.width, stream.height]
    }
  }
  return [16, 9] // default aspect ratio
}

/**
 * Рассчитывает размеры превью на основе фиксированной высоты и aspect ratio
 */
function calculatePreviewDimensions(file: MediaFile, baseHeight: number): { width: number; height: number } {
  const [w, h] = getAspectRatio(file)
  const aspectRatio = w / h

  // Для grid режима: фиксированная высота, ширина по пропорциям
  // Ограничиваем ширину разумными пределами (от 0.5x до 2x высоты)
  const minWidth = baseHeight * 0.5
  const maxWidth = baseHeight * 2
  const calculatedWidth = baseHeight * aspectRatio

  return {
    width: Math.min(maxWidth, Math.max(minWidth, calculatedWidth)),
    height: baseHeight,
  }
}

/**
 * Компонент превью для медиафайлов - адаптер для MediaPreview
 * Клик по видео обрабатывается внутри VideoStream (воспроизведение)
 * Кнопка "+" обрабатывается в AddMediaButton (добавление в ресурсы)
 * Drag & Drop используется для переноса на таймлайн
 * Контекстное меню используется для удаления файла
 */
const MediaPreviewWrapper: React.FC<PreviewComponentProps<MediaFile>> = ({ item: file, size, viewMode, onClick }) => {
  const { t } = useTranslation()
  const { removeMedia } = useMediaManagement()

  // Drag & Drop обрабатывается внутри MediaPreview (VideoPreview использует @dnd-kit/core)

  const handleClick = useCallback(() => {
    onClick?.(file)
  }, [file, onClick])

  const handleDelete = useCallback(async () => {
    if (file.id) {
      await removeMedia(file.id)
    }
  }, [file.id, removeMedia])

  const previewSize = typeof size === "number" ? size : size.width

  // Режим list - горизонтальная строка с превью и метаданными
  // Высота строки масштабируется от previewSize (делим на коэффициент для более компактного вида)
  if (viewMode === "list") {
    // Масштабируем высоту строки: previewSize 125-500 -> listRowHeight 32-80
    const listRowHeight = Math.max(32, Math.min(80, Math.round(previewSize * 0.32)))
    // Ширина миниатюры пропорционально высоте (16:10 ratio)
    const thumbWidth = Math.round(listRowHeight * 1.6)

    return (
      <ContextMenu data-oid="39ri465">
        <ContextMenuTrigger asChild data-oid="kd:jd:m">
          <div
            className="flex items-center gap-3 p-1 rounded-md hover:bg-accent/50 cursor-pointer w-full"
            onClick={handleClick}
            data-oid="list-row"
          >
            {/* Миниатюра - размер зависит от previewSize */}
            <div
              className="shrink-0 rounded overflow-hidden bg-muted"
              style={{ width: thumbWidth, height: listRowHeight }}
            >
              <MediaPreview file={file} size={listRowHeight} showFileName={false} ignoreRatio data-oid="list-thumb" />
            </div>
            {/* Метаданные файла */}
            <div className="flex-1 min-w-0">
              <FileMetadata file={file} size={listRowHeight} />
            </div>
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

  // Режим grid - карточка с превью по пропорциям видео
  // Режим thumbnails - фиксированный размер 16:9
  const isGridMode = viewMode === "grid"
  const dimensions = isGridMode
    ? calculatePreviewDimensions(file, previewSize)
    : { width: previewSize * (16 / 9), height: previewSize }
  const aspectRatio = isGridMode ? getAspectRatio(file) : ([16, 9] as [number, number])

  return (
    <ContextMenu data-oid="39ri465">
      <ContextMenuTrigger asChild data-oid="kd:jd:m">
        <div
          className={cn("cursor-pointer flex flex-col overflow-hidden", isGridMode && "w-full")}
          style={isGridMode ? undefined : { width: dimensions.width }}
          onClick={handleClick}
          data-oid="nhf_-vm"
        >
          {/* Превью с учетом пропорций */}
          <MediaPreview
            file={file}
            size={dimensions.height}
            dimensions={aspectRatio}
            showFileName={false}
            data-oid="1qqqjyk"
          />
          {/* Название файла */}
          <div className="px-1.5 py-1 text-xs truncate text-center" title={file.name} data-oid="filename">
            {file.name}
          </div>
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

    // Преобразуем MediaInfo в MediaFile
    // ✅ FIX: Деструктурируем [mediaId, mediaInfo] из entries
    return mediaItems.map(([mediaId, mediaInfo]) => {
      // Получаем bitrate из метаданных если это видео
      const bitrate =
        mediaInfo.metadata?.type === "Video" || mediaInfo.metadata?.type === "Audio"
          ? mediaInfo.metadata.bitrate
          : undefined

      // Получаем codec из метаданных для video файлов
      const videoCodec =
        mediaInfo.metadata?.type === "Video" ? (mediaInfo.metadata as { codec?: string }).codec : undefined

      const file = {
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
        // ✅ FIX: duration должен быть числом для VideoOverlays (file.duration > 0)
        duration: mediaInfo.duration ?? 0,
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

      // Debug log для видео файлов
      if (file.isVideo) {
        console.log('[MediaAdapter] Video file:', {
          name: file.name,
          isVideo: file.isVideo,
          type: mediaInfo.type,
          hasMetadata: !!mediaInfo.metadata,
          hasThumbnail: !!mediaInfo.thumbnailPath,
        })
      }

      return file
    })
  }, [mediaPool, mediaPool.size])

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
          // Если size это число - возвращаем как есть
          if (typeof file.size === "number") {
            return file.size
          }
          // Если size это строка - парсим (возвращаем 0 если не удалось)
          if (typeof file.size === "string") {
            return parseFileSize(file.size) ?? 0
          }
          return 0

        case "duration":
          // duration теперь хранится как число (секунды)
          return typeof file.duration === "number" ? file.duration : 0
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
          // duration теперь хранится как число (секунды)
          const duration = typeof file.duration === "number" ? file.duration : 0
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

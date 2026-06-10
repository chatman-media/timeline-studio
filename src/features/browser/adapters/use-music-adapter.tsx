import { CirclePause, CirclePlay, Clock, HardDrive, Music } from "lucide-react"
import type React from "react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useFavorites } from "@/core/hooks"
import type { MediaFile } from "@/core/types"
import { useMusicImport } from "@/features/browser/hooks/use-music-import"
import { useMusicFiles } from "@/features/browser/services/project-music"
import { parseDuration, parseFileSize } from "@/features/browser/utils"
import { useDraggable } from "@/features/drag-drop"
import { useResources } from "@/features/timeline/providers/resources-provider"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { PreviewConfig } from "../components/preview/types"
import type { ListAdapter, ListItem, PreviewComponentProps } from "../types/list"
import { getDateGroup, getDurationGroup } from "../utils/grouping"

// Адаптер типа для MediaFile чтобы соответствовать ListItem
type MusicListItem = MediaFile & ListItem

/**
 * Компонент превью для музыкальных файлов
 */
const MusicPreviewWrapper: React.FC<PreviewComponentProps<MediaFile>> = ({
  item: file,
  size,
  viewMode,
  onClick,
  isSelected,
}) => {
  const { t } = useTranslation()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isMusicAdded } = useResources()

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!audioRef.current) {
      audioRef.current = new Audio(file.path)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      void audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const duration = file.probeData?.format.duration || 0
  const artist = String(file.probeData?.format.tags?.artist || "")
  const title = String(file.probeData?.format.tags?.title || file.name)
  const isAdded = isMusicAdded(file)

  // Используем DragDropManager для перетаскивания
  const dragProps = useDraggable(
    "music",
    () => file,
    () => ({
      url: file.thumbnailPath || file.path,
      width: 120,
      height: 80,
    }),
  )

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent",
          isAdded && "border-green-500",
        )}
        onClick={() => onClick?.(file)}
        {...dragProps}
        data-oid="88ts2p6"
      >
        {/* Play/Pause Button */}
        <button
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          onClick={handlePlayPause}
          data-oid="hean2kk"
        >
          {isPlaying ? (
            <CirclePause className="w-4 h-4" data-oid="7xj0x6p" />
          ) : (
            <CirclePlay className="w-4 h-4" data-oid="skuwrk2" />
          )}
        </button>

        {/* File Info */}
        <div className="flex-1 min-w-0" data-oid="4ql6jqt">
          <div className="font-medium text-sm truncate" data-oid="kupfzow">
            {title}
          </div>
          {artist && (
            <div className="text-xs text-muted-foreground truncate" data-oid="nbcaa3_">
              {artist}
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="shrink-0 text-xs text-muted-foreground" data-oid="qgh5kyb">
          {duration > 0 ? formatTime(duration) : ""}
        </div>

        {/* Status indicator */}
        {isAdded && <div className="shrink-0 w-2 h-2 bg-green-500 rounded-full" data-oid="9nq2do1" />}
      </div>
    )
  }

  // Thumbnails mode
  return (
    <div
      className={cn(
        "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors",
        "hover:bg-accent/50",
        isSelected && "bg-accent",
        isAdded && "border-green-500",
      )}
      style={{ width: typeof size === "number" ? size : size.width }}
      onClick={() => onClick?.(file)}
      {...dragProps}
      data-oid="2_ax0-v"
    >
      {/* Play/Pause Button */}
      <button
        className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors mb-2"
        onClick={handlePlayPause}
        data-oid=":s5iih2"
      >
        {isPlaying ? (
          <CirclePause className="w-6 h-6" data-oid=":6uumy_" />
        ) : (
          <CirclePlay className="w-6 h-6" data-oid="l4o91l8" />
        )}
      </button>

      {/* File Info */}
      <div className="text-center" data-oid="q20djk8">
        <div className="font-medium text-sm truncate max-w-full" data-oid="so-ba9s">
          {title}
        </div>
        {artist && (
          <div className="text-xs text-muted-foreground truncate" data-oid=":g2.kon">
            {artist}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1" data-oid="our9hlz">
          {duration > 0 ? formatTime(duration) : ""}
        </div>
      </div>

      {/* Status indicator */}
      {isAdded && <div className="w-2 h-2 bg-green-500 rounded-full mt-1" data-oid="37_w915" />}
    </div>
  )
}

/**
 * Хук для создания адаптера музыкальных файлов
 */
export function useMusicAdapter(): ListAdapter<MusicListItem> {
  const { musicFiles } = useMusicFiles()
  const { isItemFavorite } = useFavorites()
  const { importFile, importDirectory, isImporting } = useMusicImport()

  // MediaFile уже содержит id и name, поэтому совместим с ListItem
  const allMusicFiles = (musicFiles || []) as unknown as MusicListItem[]

  return {
    // Хук для получения данных
    useData: () => ({
      items: allMusicFiles,
      loading: false, // musicFiles не предоставляет loading состояние
      error: null,
    }),

    // Компонент превью
    PreviewComponent: MusicPreviewWrapper,

    // Функция для получения значения сортировки
    getSortValue: (file, sortBy) => {
      switch (sortBy) {
        case "name":
          return file.name.toLowerCase()

        case "title":
          return String(file.probeData?.format.tags?.title || file.name).toLowerCase()

        case "artist":
          return String(file.probeData?.format.tags?.artist || "").toLowerCase()

        case "size":
          return parseFileSize(file.size)

        case "duration":
          return parseDuration(file.probeData?.format.duration)
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
        String(file.probeData?.format.tags?.genre || ""),
      ]

      return texts.filter(Boolean)
    },

    // Функция для получения значения группировки
    getGroupValue: (file, groupBy) => {
      switch (groupBy) {
        case "artist": {
          const artist = String(file.probeData?.format.tags?.artist || "")
          return artist || "Неизвестный исполнитель"
        }

        case "genre": {
          const genre = String(file.probeData?.format.tags?.genre || "")
          return genre || "Без жанра"
        }

        case "album": {
          const album = String(file.probeData?.format.tags?.album || "")
          return album || "Без альбома"
        }

        case "date":
          return getDateGroup(file.startTime)

        case "duration": {
          const duration = parseDuration(file.probeData?.format.duration)
          return getDurationGroup(duration)
        }

        default:
          return ""
      }
    },

    // Функция для фильтрации по типу (расширения)
    matchesFilter: (file, filterType) => {
      if (filterType === "all") return true

      const fileExt = file.name.split(".").pop()?.toLowerCase() || ""
      return fileExt === filterType.toLowerCase()
    },

    // Обработчики импорта
    importHandlers: {
      importFile: async () => {
        await importFile()
      },
      importFolder: async () => {
        await importDirectory()
      },
      isImporting,
    },

    // Проверка избранного
    isFavorite: (file) => isItemFavorite(file, "music"),

    // Тип для системы избранного
    favoriteType: "music",

    // Конфигурация для UniversalPreview
    previewConfig: {
      // Аудио не имеет thumbnail - используем иконку
      thumbnailUrl: undefined,

      // Показываем длительность
      showDuration: true,
      getDuration: (file) => file.probeData?.format.duration || 0,

      // Тип - аудио
      showType: true,
      getType: () => "audio",
      getTypeIcon: () => <Music className="size-3" />,

      // Информация
      getTitle: (file) => String(file.probeData?.format.tags?.title || file.name),
      getSubtitle: (file) => String(file.probeData?.format.tags?.artist || ""),
      getTags: (file) => {
        const tags: string[] = []
        const genre = file.probeData?.format.tags?.genre
        if (genre) tags.push(String(genre))
        const album = file.probeData?.format.tags?.album
        if (album) tags.push(String(album))
        return tags
      },
      getMetadata: (file) => {
        const metadata: Array<{ icon?: React.ReactNode; label: string }> = []
        const duration = file.probeData?.format.duration
        if (duration && duration > 0) {
          metadata.push({ icon: <Clock className="size-3" />, label: formatTime(duration) })
        }
        if (file.size) {
          const sizeStr = typeof file.size === "string" ? file.size : `${Math.round(file.size / 1024 / 1024)}MB`
          metadata.push({ icon: <HardDrive className="size-3" />, label: sizeStr })
        }
        return metadata
      },

      // Кнопки
      showFavoriteButton: true,
      showAddButton: true,
    } as PreviewConfig<MusicListItem>,
  }
}

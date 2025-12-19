import { memo, useMemo } from "react"

import { useFavorites } from "@/core/hooks"
import { MediaPreview } from "@/features/browser"
import type { MediaFile } from "@/features/media"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import { cn } from "@/lib/utils"

import { FileMetadata } from "./file-metadata"

/**
 * Интерфейс свойств компонента MediaItem
 */
interface MediaItemProps {
  /** Медиа-файл для отображения */
  file: MediaFile
  /** Индекс файла в списке */
  index: number
  /** Режим отображения (list, grid, thumbnails) */
  viewMode: string
  /** Размер превью */
  previewSize: number
}

/**
 * Компонент для отображения отдельного медиа-файла в различных режимах просмотра
 *
 * @param {MediaItemProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент медиа-элемента
 */
export const MediaItem = memo<MediaItemProps>(
  ({ file, viewMode, previewSize }) => {
    const { favorites } = useFavorites() // Хук для работы с избранным
    const { settings } = useProjectSettings() // Получаем настройки проекта

    // Стабильный ключ файла
    const fileId = useMemo(() => file.id || file.path || file.name, [file.id, file.path, file.name])

    // Мемоизируем проверку избранного
    const isAdded = useMemo(() => favorites.media.some((item) => item.id === file.id), [favorites.media, file.id])

    // Получаем соотношение сторон из настроек проекта
    const projectAspectRatio = useMemo(() => {
      const { width, height } = settings.aspectRatio.value
      return width / height
    }, [settings.aspectRatio])

    // Размер превью для режима list - уменьшаем высоту
    const listPreviewSize = useMemo(() => {
      // Для режима list используем фиксированную небольшую высоту
      return previewSize
    }, [viewMode, previewSize])

    // Мемоизируем стили для grid режима
    const gridStyles = useMemo(
      () => ({
        width: `${(previewSize * projectAspectRatio + 2).toFixed(0)}px`,
      }),
      [previewSize, projectAspectRatio],
    )

    // Мемоизируем размер шрифта
    const fontSize = useMemo(() => (previewSize > 150 ? "13px" : "12px"), [previewSize])

    // Мемоизируем базовые классы
    const baseClasses = useMemo(() => (isAdded ? "pointer-events-none" : ""), [isAdded])

    if (viewMode === "list") {
      return (
        <div
          className={cn(
            "group flex items-center border border-transparent p-1",
            "bg-white hover:border-[#38daca71] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            baseClasses,
          )}
          style={{ height: `${listPreviewSize + 8}px` }} // Фиксированная высота для list режима
          data-testid="media-item"
          data-oid="958xda7"
        >
          <div className="relative mr-3 flex shrink-0 gap-1" data-oid="zpaxg8o">
            <MediaPreview
              file={file}
              size={listPreviewSize}
              ignoreRatio={false}
              dimensions={[settings.aspectRatio.value.width, settings.aspectRatio.value.height]}
              data-oid="hvgm_36"
            />
          </div>
          <FileMetadata file={file} size={listPreviewSize} data-oid="3sjmsh9" />
        </div>
      )
    }

    if (viewMode === "grid") {
      return (
        <div
          className={cn(
            "flex h-full w-full flex-col rounded-xs",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            baseClasses,
          )}
          style={gridStyles}
          data-testid="media-item"
          data-oid="5x-f3l4"
        >
          <div className="group relative w-full flex-1 grow flex-row" data-oid="v.lai2y">
            <MediaPreview
              file={file}
              size={previewSize}
              dimensions={[settings.aspectRatio.value.width, settings.aspectRatio.value.height]}
              data-oid="5fxkbm2"
            />
          </div>
          <div className="truncate p-1 text-xs" style={{ fontSize }} data-oid="9penuq4">
            {file.name}
          </div>
        </div>
      )
    }

    if (viewMode === "thumbnails") {
      return (
        <div
          key={fileId}
          className={cn(
            "flex h-full items-center p-0",
            "border border-transparent bg-white hover:border-[#38dacac3] hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]",
            isAdded && "pointer-events-none",
          )}
          data-testid="media-item"
          data-oid="7vstuia"
        >
          <div className="group relative w-full flex-1 grow flex-row" data-oid="02t06x4">
            <MediaPreview
              file={file}
              size={previewSize}
              showFileName
              ignoreRatio // В режиме thumbnails показываем оригинальные пропорции
              data-oid=".fvhul0"
            />
          </div>
        </div>
      )
    }

    return null
  },
  (prevProps, nextProps) => {
    // Кастомная функция сравнения для более точного контроля
    return (
      prevProps.file.id === nextProps.file.id &&
      prevProps.file.isLoadingMetadata === nextProps.file.isLoadingMetadata &&
      prevProps.file.probeData === nextProps.file.probeData &&
      prevProps.file.thumbnailPath === nextProps.file.thumbnailPath &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.previewSize === nextProps.previewSize
    )
  },
)

MediaItem.displayName = "MediaItem"

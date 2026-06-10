import { MediaType } from "@timeline-studio/core/types/media"
import type { FilterResource } from "@timeline-studio/core/types/resources"
import { calculateDimensionsWithAspectRatio } from "@timeline-studio/core/utils/preview-sizes"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { VideoFilter } from "@/features/filters/types/filters"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"
import { useResources } from "@/features/timeline/providers/resources-provider"
import { usePlayer, useVideoSelection } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"

import { AddMediaButton } from "../../browser/components/layout/add-media-button"
import { FavoriteButton } from "../../browser/components/layout/favorite-button"

const logger = createLogger("FilterPreview")

/**
 * Интерфейс пропсов для компонента FilterPreview
 */
interface FilterPreviewProps {
  filter: VideoFilter
  onClick: () => void
  size: number
  previewWidth?: number
  previewHeight?: number
}

/**
 * Компонент для отображения превью видеофильтра
 * Показывает видео с применённым фильтром и позволяет добавить фильтр в проект
 *
 * @param {FilterPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью фильтра
 */
export function FilterPreview({ filter, onClick, size, previewWidth, previewHeight }: FilterPreviewProps) {
  const { t } = useTranslation() // Хук для интернационализации
  const { addFilter, isFilterAdded, removeResource, filterResources } = useResources() // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false) // Состояние наведения мыши
  const videoRef = useRef<HTMLVideoElement>(null) // Ссылка на элемент видео
  const timeoutRef = useRef<NodeJS.Timeout>(null) // Ссылка на таймер для воспроизведения видео
  const { applyFilter } = usePlayer() // Получаем метод для применения фильтра
  const { getCurrentVideo } = useVideoSelection() // Получаем текущее видео для применения фильтра
  const { settings } = useProjectSettings() // Получаем настройки проекта

  // Получаем пропорции из настроек проекта
  const projectAspectRatio = settings?.aspectRatio?.value
  const aspectWidth = projectAspectRatio?.width ?? 16
  const aspectHeight = projectAspectRatio?.height ?? 9

  // Рассчитываем размеры с учетом пропорций проекта
  // size применяется к длинному краю (ширина для 16:9, высота для 9:16)
  // Минимум 100px применяется к длинному краю
  const { width: calculatedWidth, height: calculatedHeight } = calculateDimensionsWithAspectRatio(
    size,
    { width: aspectWidth, height: aspectHeight },
    true, // минимум 100px
  )

  // Используем рассчитанные размеры если не переданы явно
  const finalWidth = previewWidth ?? calculatedWidth
  const finalHeight = previewHeight ?? calculatedHeight

  // Проверяем, добавлен ли фильтр уже в хранилище ресурсов
  // Мемоизируем результат для оптимизации
  const isAdded = useMemo(() => {
    return isFilterAdded(filter)
  }, [isFilterAdded, filter])

  // Обработчик клика - применяет фильтр и открывает в плеере
  const handleClick = useCallback(() => {
    logger.info("Applying filter", {
      filterName: filter.name,
      filterId: filter.id,
    })
    // Применяем фильтр к видео в плеере
    applyFilter({
      id: filter.id,
      name: filter.name,
      params: filter.params,
    })
    // Открываем модальное окно с деталями
    onClick()
  }, [filter, applyFilter, onClick])

  /**
   * Формирует CSS-строку для применения фильтров к видео
   * Преобразует параметры фильтра в CSS-свойство filter
   *
   * @returns {string} CSS-строка с фильтрами
   */
  const getFilterStyle = () => {
    const {
      brightness,
      contrast,
      saturation,
      gamma,
      temperature,
      tint,
      hue,
      vibrance,
      shadows,
      highlights,
      blacks,
      whites,
      clarity,
      dehaze,
      vignette,
      grain,
    } = filter.params
    const filters = []

    // Основные CSS-фильтры
    if (brightness !== undefined) filters.push(`brightness(${Math.max(0, 1 + brightness)})`)
    if (contrast !== undefined) filters.push(`contrast(${Math.max(0, contrast)})`)
    if (saturation !== undefined) filters.push(`saturate(${Math.max(0, saturation)})`)

    // Цветовые корректировки
    if (hue !== undefined) filters.push(`hue-rotate(${hue}deg)`)
    if (temperature !== undefined) {
      // Температура: положительные значения = теплее (желтее), отрицательные = холоднее (синее)
      const tempValue = Math.abs(temperature) * 0.01 // Нормализуем значение
      if (temperature > 0) {
        filters.push(`sepia(${Math.min(1, tempValue)})`)
      } else {
        filters.push(`hue-rotate(${temperature * 2}deg)`)
      }
    }
    if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`)

    // Дополнительные эффекты (эмулируем через доступные CSS-фильтры)
    if (clarity !== undefined && clarity !== 0) {
      // Clarity через contrast и небольшой sharpen эффект
      const clarityValue = 1 + clarity * 0.3
      filters.push(`contrast(${Math.max(0.1, clarityValue)})`)
    }

    if (vibrance !== undefined && vibrance !== 0) {
      // Vibrance через дополнительную насыщенность
      const vibranceValue = 1 + vibrance * 0.5
      filters.push(`saturate(${Math.max(0.1, vibranceValue)})`)
    }

    // Shadows и highlights эмулируем через brightness корректировки
    if (shadows !== undefined && shadows !== 0) {
      const shadowValue = 1 + shadows * 0.2
      filters.push(`brightness(${Math.max(0.1, shadowValue)})`)
    }

    if (highlights !== undefined && highlights !== 0) {
      const highlightValue = 1 - highlights * 0.1
      filters.push(`brightness(${Math.max(0.1, highlightValue)})`)
    }

    // Объединяем все фильтры в одну строку
    return filters.join(" ")
  }

  /**
   * Эффект для управления воспроизведением видео и применением фильтров
   * Запускает видео при наведении и применяет фильтры
   */
  useEffect(() => {
    if (!videoRef.current) return
    const videoElement = videoRef.current

    /**
     * Применяет фильтр к видео и запускает его воспроизведение
     * Устанавливает таймер для повторного воспроизведения
     */
    const applyFilter = () => {
      videoElement.currentTime = 0 // Сбрасываем время видео на начало
      videoElement.style.filter = getFilterStyle() // Применяем CSS-фильтры

      // Запускаем воспроизведение с обработкой ошибок autoplay
      videoElement.play().catch((error) => {
        // Игнорируем ошибки autoplay, которые блокируются браузером
        logger.debug("Autoplay blocked", { error: error.message })
      })

      // Устанавливаем таймер для повторного воспроизведения через 2 секунды
      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyFilter()
        }
      }, 2000)
    }

    // Если курсор наведен на превью - применяем фильтр и запускаем видео
    if (isHovering) {
      applyFilter()
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем фильтры
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.style.filter = ""
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isHovering, filter])

  // Получаем цвета для индикаторов
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "basic":
        return "bg-green-500"
      case "intermediate":
        return "bg-yellow-500"
      case "advanced":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryAbbreviation = (category: string) => {
    switch (category) {
      case "color-correction":
        return "CC"
      case "creative":
        return "CRE"
      case "cinematic":
        return "CIN"
      case "vintage":
        return "VIN"
      case "technical":
        return "TEC"
      case "artistic":
        return "ART"
      default:
        return "FIL"
    }
  }

  return (
    <div className="flex flex-col items-center" data-oid=".7qyxu_">
      {/* Контейнер превью фильтра */}
      <div
        className="group relative cursor-pointer rounded-xs bg-gray-800"
        style={{ width: `${finalWidth}px`, height: `${finalHeight}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
        data-oid="wb36mo."
      >
        {/* Видео для демонстрации фильтра */}
        <video
          ref={videoRef}
          src="/t1.mp4" // Статичный файл из public/, не нужен convertVideoSrc
          className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-xs object-cover"
          muted
          playsInline
          preload="auto"
          data-testid="filter-video"
          data-oid="uo2w6k-"
        />

        {/* Индикатор сложности слева */}
        <div className="absolute bottom-1 left-1" data-oid="hz4l0lb">
          <div
            className={`h-2 w-2 rounded-full ${getComplexityColor(filter.complexity || "basic")}`}
            title={t(`filters.complexity.${filter.complexity || "basic"}`)}
            data-oid="vt0s5fn"
          />
        </div>

        {/* Индикатор категории справа */}
        <div className="absolute top-1 left-1" data-oid="tiuqxi0">
          <div
            className="bg-black/70 text-white font-medium text-[10px] px-1.5 py-0.5 rounded-xs"
            title={t(`filters.categories.${filter.category}`)}
            data-oid="dvwjo7i"
          >
            {getCategoryAbbreviation(filter.category)}
          </div>
        </div>

        {/* Кнопка добавления в избранное */}
        <FavoriteButton
          file={{
            id: filter.id,
            path: "",
            name: filter.name,
            type: MediaType.Unknown,
          }}
          size={size}
          type="filter"
          noTime={true}
          data-oid="w6c4y42"
        />

        {/* Кнопка добавления фильтра в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
          data-oid="qo-anpb"
        >
          {filter && (
            <AddMediaButton
              resource={
                {
                  id: filter.id,
                  type: "filter",
                  name: filter.name,
                  filter: filter,
                } as FilterResource
              }
              size={size}
              type="filter"
              data-oid="_8:411c"
            />
          )}
        </div>
      </div>

      {/* Название фильтра */}
      <div className="mt-1 text-xs text-center truncate" style={{ maxWidth: `${finalWidth}px` }} data-oid="y7z7we.">
        {filter.labels?.ru || filter.name}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef } from "react"

import { createLogger } from "@/lib/tauri-logger"

import { useMediaPreview } from "./use-media-preview"

const logger = createLogger("PreviewPreloader")

export interface PreviewPreloaderOptions {
  /**
   * Количество элементов для предзагрузки вперед
   * @default 5
   */
  preloadAhead?: number
  /**
   * Количество элементов для предзагрузки назад
   * @default 2
   */
  preloadBehind?: number
  /**
   * Задержка перед началом предзагрузки в мс
   * @default 100
   */
  debounceDelay?: number
  /**
   * Максимальное количество параллельных загрузок
   * @default 3
   */
  maxConcurrent?: number
}

interface PreloadItem {
  fileId: string
  index: number
}

/**
 * Хук для предзагрузки превью при скролле
 * Загружает превью для элементов, которые скоро появятся в области видимости
 */
export function usePreviewPreloader(options: PreviewPreloaderOptions = {}) {
  const { preloadAhead = 5, preloadBehind = 2, debounceDelay = 100, maxConcurrent = 3 } = options

  const { getPreviewData } = useMediaPreview({})
  const loadingQueueRef = useRef<Set<string>>(new Set())
  const debounceTimerRef = useRef<NodeJS.Timeout>(null)

  /**
   * Предзагрузить превью для списка файлов
   */
  const preloadPreviews = useCallback(
    async (items: PreloadItem[]) => {
      // Фильтруем только те, которые еще не загружаются
      const itemsToLoad = items.filter((item) => !loadingQueueRef.current.has(item.fileId))

      if (itemsToLoad.length === 0) return

      // Ограничиваем количество параллельных загрузок
      const chunks: PreloadItem[][] = []
      for (let i = 0; i < itemsToLoad.length; i += maxConcurrent) {
        chunks.push(itemsToLoad.slice(i, i + maxConcurrent))
      }

      // Загружаем по чанкам
      for (const chunk of chunks) {
        // Добавляем в очередь загрузки
        chunk.forEach((item) => loadingQueueRef.current.add(item.fileId))

        try {
          // Загружаем параллельно
          await Promise.all(
            chunk.map(async (item) => {
              try {
                await getPreviewData(item.fileId)
                logger.debugSync("Preloaded preview", { fileId: item.fileId })
              } catch (error) {
                logger.errorSync("Failed to preload preview", { fileId: item.fileId, error })
              }
            }),
          )
        } finally {
          // Удаляем из очереди загрузки
          chunk.forEach((item) => loadingQueueRef.current.delete(item.fileId))
        }
      }
    },
    [getPreviewData, maxConcurrent],
  )

  /**
   * Обработчик изменения видимых элементов
   * @param visibleRange - диапазон видимых индексов [start, end]
   * @param allItems - все элементы с их fileId
   */
  const handleVisibleRangeChange = useCallback(
    (visibleRange: [number, number], allItems: Array<{ fileId: string }>) => {
      // Отменяем предыдущий таймер
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Устанавливаем новый таймер с задержкой
      debounceTimerRef.current = setTimeout(() => {
        const [start, end] = visibleRange

        // Вычисляем диапазон для предзагрузки
        const preloadStart = Math.max(0, start - preloadBehind)
        const preloadEnd = Math.min(allItems.length - 1, end + preloadAhead)

        // Собираем элементы для предзагрузки
        const itemsToPreload: PreloadItem[] = []

        for (let i = preloadStart; i <= preloadEnd; i++) {
          // Пропускаем видимые элементы (они уже загружены)
          if (i >= start && i <= end) continue

          const item = allItems[i]
          if (item?.fileId) {
            itemsToPreload.push({ fileId: item.fileId, index: i })
          }
        }

        // Запускаем предзагрузку
        if (itemsToPreload.length > 0) {
          logger.debugSync("Preloading previews", {
            count: itemsToPreload.length,
            rangeStart: preloadStart,
            rangeEnd: preloadEnd,
          })
          void preloadPreviews(itemsToPreload)
        }
      }, debounceDelay)
    },
    [preloadAhead, preloadBehind, debounceDelay, preloadPreviews],
  )

  /**
   * Отменить все активные загрузки
   */
  const cancelAllPreloads = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    loadingQueueRef.current.clear()
  }, [])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cancelAllPreloads()
    }
  }, [cancelAllPreloads])

  return {
    handleVisibleRangeChange,
    preloadPreviews,
    cancelAllPreloads,
    isPreloading: loadingQueueRef.current.size > 0,
  }
}

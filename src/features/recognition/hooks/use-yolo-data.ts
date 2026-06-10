import { useCallback, useEffect, useState } from "react"
import { YoloDataService } from "@/core/services"
import type { YoloDetection, YoloVideoData, YoloVideoSummary } from "@/core/types/yolo"
import { logError, logInfo } from "@/lib/tauri-logger"
import { useRecognitionPreview } from "./use-recognition-preview"

/**
 * Хук для работы с данными YOLO
 * Предоставляет методы для загрузки, кэширования и получения данных распознавания объектов
 */
export function useYoloData() {
  logInfo("[useYoloData] Инициализация хука для работы с YOLO данными")

  const [yoloDataService] = useState(() => new YoloDataService())
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({})

  // Используем интегрированный хук для работы с Preview Manager
  const { processVideoRecognition, getRecognitionAtTimestamp: getRecognitionFromCache } = useRecognitionPreview({
    onRecognitionComplete: (fileId, data) => {
      logInfo("[useYoloData] Распознавание завершено", { fileId, framesCount: data.frames.length })
    },
    onError: (error) => {
      logError("[useYoloData] Ошибка распознавания", { error })
    },
  })

  // Загрузка данных YOLO для видео
  const loadYoloData = useCallback(
    async (videoId: string, videoPath?: string): Promise<YoloVideoData | null> => {
      logInfo("[useYoloData] Загрузка YOLO данных", { videoId, videoPath })
      setLoadingStates((prev) => ({ ...prev, [videoId]: true }))
      setErrorStates((prev) => ({ ...prev, [videoId]: null }))

      try {
        // Сначала пытаемся загрузить из локального сервиса
        let data = await yoloDataService.loadYoloData(videoId, videoPath)

        // Если нет данных и есть путь к видео, запускаем распознавание через Preview Manager
        if (!data && videoPath) {
          logInfo("[useYoloData] Запуск распознавания через Preview Manager", { videoId })
          data = await processVideoRecognition(videoId, videoPath)

          // Сохраняем результат в локальный кэш
          if (data) {
            await yoloDataService.saveYoloData(videoId, data)
            logInfo("[useYoloData] YOLO данные сохранены в кэш", { videoId })
          }
        }

        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
        setErrorStates((prev) => ({ ...prev, [videoId]: errorMessage }))
        logError("[useYoloData] Ошибка загрузки YOLO данных", { error })
        return null
      } finally {
        setLoadingStates((prev) => ({ ...prev, [videoId]: false }))
      }
    },
    [yoloDataService, processVideoRecognition],
  )

  // Получение данных YOLO для конкретного времени
  const getYoloDataAtTimestamp = useCallback(
    async (videoId: string, timestamp: number): Promise<YoloDetection[]> => {
      try {
        // Сначала проверяем локальный кэш
        let data = await yoloDataService.getYoloDataAtTimestamp(videoId, timestamp)

        // Если нет в локальном кэше, пробуем получить из Preview Manager
        if (data.length === 0) {
          data = await getRecognitionFromCache(videoId, timestamp)
        }

        return data
      } catch (error) {
        logError("[useYoloData] Ошибка получения данных для времени", { timestamp, error })
        return []
      }
    },
    [yoloDataService, getRecognitionFromCache],
  )

  // Получение сводки по видео
  const getVideoSummary = useCallback(
    async (videoId: string): Promise<YoloVideoSummary | null> => {
      try {
        return await yoloDataService.getVideoSummary(videoId)
      } catch (error) {
        logError("[useYoloData] Ошибка получения сводки для видео", { videoId, error })
        return null
      }
    },
    [yoloDataService],
  )

  // Получение всех данных YOLO для видео
  const getAllYoloData = useCallback(
    async (videoId: string): Promise<YoloVideoData | null> => {
      try {
        return await yoloDataService.getAllYoloData(videoId)
      } catch (error) {
        logError("[useYoloData] Ошибка получения всех данных для видео", { videoId, error })
        return null
      }
    },
    [yoloDataService],
  )

  // Проверка наличия данных YOLO для видео
  const hasYoloData = useCallback(
    (videoId: string): boolean => {
      return yoloDataService.hasYoloData(videoId)
    },
    [yoloDataService],
  )

  // Очистка кэша для конкретного видео
  const clearVideoCache = useCallback(
    (videoId: string): void => {
      yoloDataService.clearVideoCache(videoId)
      setLoadingStates((prev) => {
        const newState = { ...prev }

        delete newState[videoId]
        return newState
      })
      setErrorStates((prev) => {
        const newState = { ...prev }

        delete newState[videoId]
        return newState
      })
    },
    [yoloDataService],
  )

  // Очистка всего кэша
  const clearAllCache = useCallback((): void => {
    yoloDataService.clearAllCache()
    setLoadingStates({})
    setErrorStates({})
  }, [yoloDataService])

  // Получение статистики кэша
  const getCacheStats = useCallback(() => {
    return yoloDataService.getCacheStats()
  }, [yoloDataService])

  // Предзагрузка данных для списка видео
  const preloadYoloData = useCallback(
    async (videoIds: string[]): Promise<void> => {
      logInfo("[useYoloData] Предзагрузка YOLO данных", { videosCount: videoIds.length })
      const promises = videoIds.map((videoId) =>
        loadYoloData(videoId).catch((error: unknown) => {
          logError("[useYoloData] Не удалось предзагрузить данные для видео", { videoId, error })
        }),
      )

      await Promise.allSettled(promises)
      logInfo("[useYoloData] Предзагрузка YOLO данных завершена")
    },
    [loadYoloData],
  )

  // Получение контекста сцены для ИИ
  const getSceneContext = useCallback(
    async (videoId: string, timestamp: number): Promise<string> => {
      try {
        const detections = await getYoloDataAtTimestamp(videoId, timestamp)

        if (detections.length === 0) {
          return "В кадре не обнаружено объектов."
        }

        // Группируем объекты по классам
        const objectCounts: Record<string, number> = {}
        const objectPositions: Record<string, string[]> = {}

        detections.forEach((detection) => {
          const className = detection.class
          objectCounts[className] = (objectCounts[className] || 0) + 1

          // Определяем позицию объекта
          const centerX = detection.bbox.x + detection.bbox.width / 2
          const centerY = detection.bbox.y + detection.bbox.height / 2

          let position = ""
          if (centerY < 0.33) position += "верх"
          else if (centerY < 0.66) position += "центр"
          else position += "низ"

          if (centerX < 0.33) position += "-лево"
          else if (centerX < 0.66) position += "-центр"
          else position += "-право"

          if (!objectPositions[className]) {
            objectPositions[className] = []
          }
          objectPositions[className].push(position)
        })

        // Формируем описание сцены
        const descriptions: string[] = []

        Object.entries(objectCounts).forEach(([className, count]) => {
          const positions = objectPositions[className]
          const uniquePositions = [...new Set(positions)]

          let description = `${count} ${className}`
          if (count > 1) description += "(ов)"

          if (uniquePositions.length <= 2) {
            description += ` в ${uniquePositions.join(" и ")}`
          } else {
            description += " в разных частях кадра"
          }

          descriptions.push(description)
        })

        return `В кадре обнаружено: ${descriptions.join(", ")}.`
      } catch (error) {
        logError("[useYoloData] Ошибка создания контекста сцены", { error })
        return "Ошибка при анализе сцены."
      }
    },
    [getYoloDataAtTimestamp],
  )

  // Очистка кэша при размонтировании компонента
  useEffect(() => {
    return () => {
      // Не очищаем кэш при размонтировании, так как он может использоваться другими компонентами
    }
  }, [])

  return {
    // Основные методы
    loadYoloData,
    getYoloDataAtTimestamp,
    getVideoSummary,
    getAllYoloData,
    hasYoloData,

    // Управление кэшем
    clearVideoCache,
    clearAllCache,
    getCacheStats,

    // Дополнительные возможности
    preloadYoloData,
    getSceneContext,

    // Состояния
    loadingStates,
    errorStates,

    // Утилиты
    isLoading: (videoId: string) => loadingStates[videoId] || false,
    getError: (videoId: string) => errorStates[videoId] || null,
  }
}

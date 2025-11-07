/**
 * Hook для использования системы пререндера
 */

import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ProjectSchemaBuilder } from "@/features/export/utils/project-schema-builder"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { logError, logInfo } from "@/lib/tauri-logger"

import {
  clearPrerenderCache as clearCache,
  getPrerenderCacheInfo,
  type PrerenderCacheFile,
  type PrerenderResult,
  prerenderSegment,
} from "../services/video-compiler-service"

export interface PrerenderState {
  isRendering: boolean
  progress: number
  currentResult?: PrerenderResult
  error?: string
}

export function usePrerender() {
  const { t } = useTranslation()
  const { project } = useTimeline()
  const [state, setState] = useState<PrerenderState>({
    isRendering: false,
    progress: 0,
  })

  /**
   * Выполнить пререндер сегмента
   */
  const prerender = useCallback(
    async (startTime: number, endTime: number, applyEffects = true, quality = 75) => {
      if (!project) {
        toast.error(t("videoCompiler.prerender.projectNotLoaded"))
        return null
      }

      // Валидация временного диапазона
      if (startTime >= endTime) {
        toast.error(t("videoCompiler.prerender.invalidTimeRange"))
        return null
      }

      const duration = endTime - startTime
      if (duration > 60) {
        toast.error(t("videoCompiler.prerender.limitExceeded"))
        return null
      }

      setState((prev) => ({
        ...prev,
        isRendering: true,
        progress: 0,
        error: undefined,
      }))

      try {
        // Используем ProjectSchemaBuilder для создания схемы с настройками для preview
        const projectSchema = ProjectSchemaBuilder.createForPreview(project, {
          quality: quality || 75,
        })

        // Запускаем пререндер
        const result = await prerenderSegment({
          projectSchema,
          startTime,
          endTime,
          applyEffects,
          quality,
        })

        setState((prev) => ({
          ...prev,
          isRendering: false,
          progress: 100,
          currentResult: result,
        }))

        toast.success(t("videoCompiler.prerender.completed", { time: result.renderTimeMs }))
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t("common.unknownError")
        // logError("[usePrerender] Ошибка пререндера", error)

        setState((prev) => ({
          ...prev,
          isRendering: false,
          progress: 0,
          error: errorMessage,
        }))

        toast.error(t("videoCompiler.prerender.error", { error: errorMessage }))
        return null
      }
    },
    [project],
  )

  /**
   * Очистить результат пререндера
   */
  const clearResult = useCallback(() => {
    // logInfo("[usePrerender] Очистка результата пререндера")
    setState((prev) => ({
      ...prev,
      currentResult: undefined,
      error: undefined,
    }))
  }, [])

  return {
    ...state,
    prerender,
    clearResult,
  }
}

/**
 * Hook для кеширования пререндеров с использованием файловой системы
 */
export function usePrerenderCache() {
  // logInfo("[usePrerenderCache] Инициализация usePrerenderCache хука")

  const { t } = useTranslation()
  const [cacheFiles, setCacheFiles] = useState<PrerenderCacheFile[]>([])
  const [totalSize, setTotalSize] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Загрузить информацию о кеше
   */
  const loadCacheInfo = useCallback(async () => {
    // logInfo("[usePrerenderCache] Загрузка информации о кеше")
    setIsLoading(true)
    try {
      const info = await getPrerenderCacheInfo()
      setCacheFiles(info.files)
      setTotalSize(info.totalSize)
    } catch (error) {
      // Error loading cache info
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Загружаем информацию о кеше при монтировании
  useEffect(() => {
    void loadCacheInfo()
  }, [loadCacheInfo])

  /**
   * Проверить наличие в кеше
   */
  const hasInCache = useCallback(
    (startTime: number, endTime: number, _applyEffects: boolean) => {
      // Ищем файл с подходящими параметрами
      return cacheFiles.some(
        (file) => Math.abs(file.startTime - startTime) < 0.1 && Math.abs(file.endTime - endTime) < 0.1,
      )
    },
    [cacheFiles],
  )

  /**
   * Получить из кеша
   */
  const getFromCache = useCallback(
    (startTime: number, endTime: number, _applyEffects: boolean): PrerenderResult | undefined => {
      // Ищем файл с подходящими параметрами
      const file = cacheFiles.find(
        (f) => Math.abs(f.startTime - startTime) < 0.1 && Math.abs(f.endTime - endTime) < 0.1,
      )

      if (file) {
        return {
          filePath: file.path,
          duration: file.endTime - file.startTime,
          fileSize: file.size,
          renderTimeMs: 0, // Из кеша, время рендеринга не важно
        }
      }

      return undefined
    },
    [cacheFiles],
  )

  /**
   * Добавить в кеш (обновить информацию после рендеринга)
   */
  const addToCache = useCallback(
    async (_startTime: number, _endTime: number, _applyEffects: boolean, _result: PrerenderResult) => {
      // Перезагружаем информацию о кеше
      await loadCacheInfo()
    },
    [loadCacheInfo],
  )

  /**
   * Очистить кеш
   */
  const clearPrerenderCache = useCallback(async () => {
    // logInfo("[usePrerenderCache] Очистка кеша")

    try {
      const deletedSize = await clearCache()
      // logInfo("[usePrerenderCache] Кеш очищен успешно", { deletedSize })
      toast.success(t("videoCompiler.prerender.cacheCleared", { size: (deletedSize / 1024 / 1024).toFixed(2) }))

      // Обновляем информацию
      setCacheFiles([])
      setTotalSize(0)
    } catch (error) {
      // logError("[usePrerenderCache] Ошибка очистки кеша", error)
      toast.error(t("videoCompiler.prerender.errorClearingCache"))
    }
  }, [])

  return {
    hasInCache,
    getFromCache,
    addToCache,
    clearCache: clearPrerenderCache,
    cacheSize: cacheFiles.length,
    totalCacheSize: totalSize,
    isLoading,
    cacheFiles,
  }
}

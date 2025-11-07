import { useCallback, useEffect, useRef, useState } from "react"

import { appDirectoriesService } from "@/features/app-state/services"
import { useResources } from "@/features/resources"
import { createLogger } from "@/lib/tauri-logger"
import {
  validateEffect,
  validateFilter,
  validateStyleTemplate,
  validateSubtitleStyle,
  validateTransition,
} from "../utils/validation"

const logger = createLogger({ module: "UseAutoLoadResources" })

interface ResourceLoadStats {
  effects: number
  filters: number
  transitions: number
  subtitles: number
  styleTemplates: number
}

/**
 * Хук для автозагрузки ресурсов (эффекты, фильтры, переходы и т.д.)
 * Оптимизированная версия с lazy loading и debouncing
 */
export function useAutoLoadResources() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedStats, setLoadedStats] = useState<ResourceLoadStats>({
    effects: 0,
    filters: 0,
    transitions: 0,
    subtitles: 0,
    styleTemplates: 0,
  })

  const { addEffect, addFilter, addTransition, addSubtitle, addStyleTemplate } = useResources()

  // Debouncing и кэширование
  const loadTimeoutRef = useRef<NodeJS.Timeout>(null)
  const lastLoadTimeRef = useRef<number>(0)
  const scanCacheRef = useRef(new Map<string, string[]>())
  const CACHE_DURATION = 15 * 60 * 1000 // 15 минут

  /**
   * Проверяет, работаем ли мы в Tauri окружении
   */
  const isTauriEnvironment = useCallback(() => {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window && window.__TAURI_INTERNALS__ !== null
  }, [])

  /**
   * Быстрое сканирование директории JSON файлов
   */
  const scanDirectory = useCallback(
    async (dirPath: string): Promise<string[]> => {
      const cached = scanCacheRef.current.get(dirPath)

      if (cached && Date.now() - lastLoadTimeRef.current < CACHE_DURATION) {
        return cached
      }

      try {
        if (!isTauriEnvironment()) {
          return []
        }

        const { exists, readDir } = await import("@tauri-apps/plugin-fs")

        const dirExists = await exists(dirPath)
        if (!dirExists) {
          return []
        }

        const entries = await readDir(dirPath)
        const jsonFiles = entries
          .filter((entry: any) => entry.isFile && entry.name.toLowerCase().endsWith(".json"))
          .map((entry: any) => `${dirPath}/${entry.name}`)

        scanCacheRef.current.set(dirPath, jsonFiles)
        return jsonFiles
      } catch (error) {
        logger.error("Error scanning directory", { error, dirPath })
        return []
      }
    },
    [isTauriEnvironment],
  )

  /**
   * Загружает и валидирует JSON файл
   */
  const loadJsonFile = useCallback(
    async (filePath: string): Promise<any> => {
      try {
        const url = isTauriEnvironment() ? `file://${filePath}` : `/${filePath}`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        logger.error("Error loading JSON file", { error, filePath })
        return null
      }
    },
    [isTauriEnvironment],
  )

  /**
   * Валидаторы для каждого типа ресурса
   */
  const validators = {
    effect: validateEffect,
    filter: validateFilter,
    transition: validateTransition,
    subtitle: validateSubtitleStyle,
    styleTemplate: validateStyleTemplate,
  }

  /**
   * Обрабатывает файлы ресурсов по типу
   */
  const processResourceFiles = useCallback(
    async (
      files: string[],
      validator: (data: any) => any,
      addFunction: (resource: any) => void,
      resourceType: string,
    ): Promise<number> => {
      if (files.length === 0) return 0

      let validCount = 0
      const BATCH_SIZE = 5 // Уменьшили размер пакета

      try {
        // Обрабатываем файлы пакетами
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE)

          const batchResults = await Promise.allSettled(batch.map(loadJsonFile))

          batchResults.forEach((result) => {
            if (result.status === "fulfilled" && result.value) {
              const data = result.value

              // Обрабатываем как массив или одиночный объект
              const items = Array.isArray(data) ? data : [data]

              items.forEach((item) => {
                const validated = validator(item)
                if (validated) {
                  try {
                    addFunction(validated)
                    validCount++
                  } catch (err) {
                    logger.error("Error adding resource", {
                      error: err,
                      resourceType,
                      resourceId: validated.id,
                    })
                  }
                }
              })
            }
          })
        }

        logger.info("Resources loaded", { validCount, resourceType, context: "useAutoLoadResources" })
        return validCount
      } catch (error) {
        logger.error("Error processing resource files", { error, resourceType })
        return 0
      }
    },
    [loadJsonFile],
  )

  /**
   * Основная функция загрузки ресурсов
   */
  const loadResources = useCallback(async () => {
    // Debouncing
    if (Date.now() - lastLoadTimeRef.current < 1000) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Определяем директории
      let directories = {
        effects: "public/effects",
        transitions: "public/transitions",
        filters: "public/filters",
        subtitles: "public/subtitles",
        styleTemplates: "public/style-templates",
      }

      if (isTauriEnvironment()) {
        try {
          await appDirectoriesService.createAppDirectories()
          directories = {
            effects: appDirectoriesService.getMediaSubdirectory("effects"),
            transitions: appDirectoriesService.getMediaSubdirectory("transitions"),
            filters: appDirectoriesService.getMediaSubdirectory("filters"),
            subtitles: appDirectoriesService.getMediaSubdirectory("subtitles"),
            styleTemplates: appDirectoriesService.getMediaSubdirectory("style_templates"),
          }
        } catch (error) {
          logger.warn("Failed to get app directories", { error })
        }
      }

      // Сканируем директории параллельно
      const [effectsFiles, transitionsFiles, filtersFiles, subtitlesFiles, styleTemplatesFiles] = await Promise.all([
        scanDirectory(directories.effects),
        scanDirectory(directories.transitions),
        scanDirectory(directories.filters),
        scanDirectory(directories.subtitles),
        scanDirectory(directories.styleTemplates),
      ])

      // Обрабатываем ресурсы последовательно для лучшей производительности
      const stats = {
        effects: 0,
        filters: 0,
        transitions: 0,
        subtitles: 0,
        styleTemplates: 0,
      }

      // Загружаем с приоритизацией (эффекты и фильтры первыми)
      stats.effects = await processResourceFiles(effectsFiles, validators.effect, addEffect, "effect")
      stats.filters = await processResourceFiles(filtersFiles, validators.filter, addFilter, "filter")
      stats.transitions = await processResourceFiles(
        transitionsFiles,
        validators.transition,
        addTransition,
        "transition",
      )
      stats.subtitles = await processResourceFiles(subtitlesFiles, validators.subtitle, addSubtitle, "subtitle")
      stats.styleTemplates = await processResourceFiles(
        styleTemplatesFiles,
        validators.styleTemplate,
        addStyleTemplate,
        "styleTemplate",
      )

      setLoadedStats(stats)
      lastLoadTimeRef.current = Date.now()

      const totalLoaded = Object.values(stats).reduce((sum, count) => sum + count, 0)
      logger.info("Total resources loaded", { totalLoaded, stats, context: "useAutoLoadResources" })
    } catch (error) {
      logger.error("Error loading resources", { error })
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [
    isTauriEnvironment,
    scanDirectory,
    processResourceFiles,
    addEffect,
    addFilter,
    addTransition,
    addSubtitle,
    addStyleTemplate,
  ])

  /**
   * Debounced загрузка
   */
  const debouncedLoad = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }

    loadTimeoutRef.current = setTimeout(() => {
      void loadResources()
    }, 500) // 500мс debounce для ресурсов
  }, [loadResources])

  // Запускаем загрузку при монтировании с задержкой для лучшего UX
  useEffect(() => {
    // ВРЕМЕННО ОТКЛЮЧЕНО: Автоматическая загрузка ресурсов из директорий проекта
    // TODO: Восстановить функциональность, когда потребуется
    /*
    const initTimeout = setTimeout(() => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
      loadTimeoutRef.current = setTimeout(() => {
        void loadResources()
      }, 500) // 500мс debounce для ресурсов
    }, 1000) // Загружаем ресурсы через 1 секунду после медиа

    return () => {
      clearTimeout(initTimeout)
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
    */

    // Логируем, что автозагрузка отключена
    logger.info("Auto-loading is disabled", { context: "useAutoLoadResources" })
  }, []) // Пустой массив зависимостей - выполняется только при монтировании

  const clearCache = useCallback(() => {
    scanCacheRef.current.clear()
    lastLoadTimeRef.current = 0
  }, [])

  return {
    isLoading,
    error,
    loadedStats,
    reload: debouncedLoad,
    clearCache,
  }
}

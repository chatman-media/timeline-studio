/**
 * Auto Proxy Generation Hook
 *
 * Автоматически генерирует прокси для H.265/HEVC видео,
 * которые не поддерживаются в WebView/Safari
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { getBackend } from "@timeline-studio/core"
import { getProxyGenerator } from "@timeline-studio/domains/media-management/services/proxy-generator"
import { needsProxyGeneration } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaFile } from "../types"

const logger = createLogger("AutoProxy")

// Локальный кэш для proxy путей (filePath -> proxyPath)
// 🔧 FIX: Используем путь к файлу вместо fileId, т.к. fileId меняется
const proxyCache = new Map<string, string>()

// Файлы в процессе генерации (filePath -> Promise)
// 🔧 FIX: Храним промис, чтобы несколько вызовов ждали один и тот же результат
const generatingFiles = new Map<string, Promise<string | null>>()

// 🆕 Глобальные слушатели для обновления всех экземпляров хука
const stateListeners = new Set<() => void>()

function notifyStateChange() {
  stateListeners.forEach((listener) => listener())
}

// Очередь ожидающих генерацию файлов
const generationQueue: Array<{
  file: MediaFile
  resolve: (path: string | null) => void
  onProxyReady?: (fileId: string, proxyPath: string) => void
  onError?: (fileId: string, error: string) => void
  onComplete?: () => void // 🆕 Callback для обновления React состояния
}> = []

// Максимальное количество одновременных генераций
const MAX_CONCURRENT_GENERATIONS = 2

// Счётчик активных генераций
let activeGenerations = 0

/**
 * Обработка очереди генерации прокси
 * Запускает следующую генерацию из очереди, если есть свободные слоты
 */
async function processQueue() {
  // Если достигнут лимит или очередь пуста - выходим
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS || generationQueue.length === 0) {
    return
  }

  // Берём первый файл из очереди
  const item = generationQueue.shift()
  if (!item) return

  const { file, resolve, onProxyReady, onError, onComplete } = item
  const filePath = file.path

  logger.infoSync(
    `[AutoProxy Queue] Starting generation from queue (${activeGenerations}/${MAX_CONCURRENT_GENERATIONS})`,
    {
      filePath,
      fileName: file.name,
      queueSize: generationQueue.length,
    },
  )

  // Увеличиваем счётчик
  activeGenerations++

  // Запускаем генерацию
  try {
    const proxyGenerator = getProxyGenerator()
    const result = await proxyGenerator.generateProxy(file.path, {
      resolution: "540p", // 🔧 Используем 540p вместо 720p для ускорения генерации
      quality: "medium",
      codec: "h264",
      preserveAudio: true,
    })

    const proxyPath = result.proxyPath
    proxyCache.set(filePath, proxyPath)

    logger.infoSync("✅ Proxy generation completed", {
      fileId: file.id,
      filePath,
      fileName: file.name,
      proxyPath,
      generationTime: result.generationTime,
      queueRemaining: generationQueue.length,
    })

    // 🆕 Save proxy_path to backend MediaItem so it persists in checkpoint
    try {
      const backend = getBackend()
      await backend.executeCommand({
        type: "UpdateImportedMedia",
        params: { media_id: file.id, updates: { proxy_path: proxyPath } },
      } as any)
      logger.infoSync("✅ Proxy path saved to backend state", {
        fileId: file.id,
        proxyPath,
      })
    } catch (backendError) {
      logger.errorSync("Failed to save proxy path to backend", {
        fileId: file.id,
        error: backendError,
      })
      // Continue anyway - local cache still works
    }

    // Вызываем callback если предоставлен
    if (onProxyReady) {
      onProxyReady(file.id, proxyPath)
    }

    resolve(proxyPath)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.errorSync("❌ Proxy generation failed", {
      fileId: file.id,
      filePath,
      fileName: file.name,
      error: errorMessage,
    })

    // Вызываем error callback если предоставлен
    if (onError) {
      onError(file.id, errorMessage)
    }

    resolve(null)
  } finally {
    // Убираем из генерируемых и уменьшаем счётчик
    generatingFiles.delete(filePath)
    activeGenerations--

    // 🆕 Уведомляем ВСЕ экземпляры хука об изменении состояния
    notifyStateChange()

    // Обрабатываем следующий файл из очереди
    processQueue()
  }
}

export interface UseAutoProxyOptions {
  /** Включить автоматическую генерацию прокси */
  enabled?: boolean
  /** Callback когда прокси готов */
  onProxyReady?: (fileId: string, proxyPath: string) => void
  /** Callback при ошибке */
  onError?: (fileId: string, error: string) => void
}

export interface AutoProxyResult {
  /** Запустить генерацию прокси для файла */
  generateProxy: (file: MediaFile) => Promise<string | null>
  /** Получить прокси путь из кэша (принимает путь к файлу) */
  getProxyPath: (filePath: string) => string | null
  /** Проверить, генерируется ли прокси для файла (принимает путь к файлу) */
  isGenerating: (filePath: string) => boolean
  /** Файлы, для которых идет генерация (пути к файлам) */
  generatingFileIds: string[]
}

/**
 * Хук для автоматической генерации прокси H.265 видео
 */
export function useAutoProxy(options: UseAutoProxyOptions = {}): AutoProxyResult {
  const { enabled = true, onProxyReady, onError } = options
  const [generatingFileIds, setGeneratingFileIds] = useState<string[]>([])

  // Refs для стабильных callbacks
  const onProxyReadyRef = useRef(onProxyReady)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onProxyReadyRef.current = onProxyReady
    onErrorRef.current = onError
  }, [onProxyReady, onError])

  // 🆕 Подписываемся на глобальные изменения состояния генерации
  useEffect(() => {
    const handleStateChange = () => {
      setGeneratingFileIds(Array.from(generatingFiles.keys()))
    }

    stateListeners.add(handleStateChange)

    // Синхронизируем состояние при монтировании
    handleStateChange()

    return () => {
      stateListeners.delete(handleStateChange)
    }
  }, [])

  const generateProxy = useCallback(
    async (file: MediaFile): Promise<string | null> => {
      // Проверяем, нужна ли генерация
      if (!enabled) {
        logger.debugSync("Auto proxy disabled", { filePath: file.path })
        return null
      }

      // 🔧 FIX: Используем путь к файлу для кэширования
      const filePath = file.path

      // 🆕 Проверяем, есть ли уже прокси у файла (из backend)
      if (file.proxy?.path) {
        logger.debugSync("Proxy already exists in file", { filePath, proxyPath: file.proxy.path })
        proxyCache.set(filePath, file.proxy.path) // Добавляем в кэш
        return file.proxy.path
      }

      // Проверяем, уже есть ли прокси в кэше
      const cachedProxy = proxyCache.get(filePath)
      if (cachedProxy) {
        logger.debugSync("Proxy found in cache", { filePath, proxyPath: cachedProxy })
        return cachedProxy
      }

      // Проверяем, не генерируется ли уже - если да, ждём результат
      const existingPromise = generatingFiles.get(filePath)
      if (existingPromise) {
        logger.infoSync("🔄 Proxy already generating, waiting for result", { filePath, fileName: file.name })
        return existingPromise
      }

      // Проверяем, нужен ли прокси
      if (!needsProxyGeneration(file)) {
        logger.debugSync("Proxy not needed", { fileId: file.id, codec: file.videoCodec })
        return null
      }

      // 🔧 QUEUE: Добавляем файл в очередь генерации
      // Создаём Promise, который будет resolved когда генерация завершится
      const generationPromise = new Promise<string | null>((resolve) => {
        // Добавляем в очередь с callbacks из refs
        generationQueue.push({
          file,
          resolve,
          onProxyReady: onProxyReadyRef.current,
          onError: onErrorRef.current,
          // 🆕 Callback для обновления React состояния после завершения
          onComplete: () => {
            setGeneratingFileIds(Array.from(generatingFiles.keys()))
          },
        })

        logger.infoSync(`[AutoProxy Queue] Added to queue (queue size: ${generationQueue.length})`, {
          filePath,
          fileName: file.name,
          activeGenerations,
          maxConcurrent: MAX_CONCURRENT_GENERATIONS,
        })

        // Запускаем обработку очереди (если есть свободные слоты)
        processQueue()
      })

      // Сохраняем Promise в Map для дедупликации
      generatingFiles.set(filePath, generationPromise)
      setGeneratingFileIds(Array.from(generatingFiles.keys()))

      return generationPromise
    },
    [enabled],
  )

  // 🔧 FIX: Принимаем filePath вместо fileId
  const getProxyPath = useCallback((filePath: string): string | null => {
    return proxyCache.get(filePath) || null
  }, [])

  // 🔧 FIX: Принимаем filePath вместо fileId
  const isGenerating = useCallback((filePath: string): boolean => {
    return generatingFiles.has(filePath)
  }, [])

  return {
    generateProxy,
    getProxyPath,
    isGenerating,
    generatingFileIds,
  }
}

/**
 * Хук для автоматической генерации прокси при импорте файлов
 * Использовать в компоненте, где отображаются медиафайлы
 */
export function useAutoProxyOnImport(
  files: MediaFile[],
  options: UseAutoProxyOptions = {},
): {
  /** Файлы с обновленными proxy путями */
  filesWithProxy: MediaFile[]
  /** Файлы в процессе генерации */
  generatingFileIds: string[]
} {
  const { generateProxy, getProxyPath, generatingFileIds } = useAutoProxy(options)
  const [proxyPaths, setProxyPaths] = useState<Map<string, string>>(new Map())
  const processedFiles = useRef(new Set<string>())

  // Автоматически генерируем прокси для новых H.265 файлов
  useEffect(() => {
    const processNewFiles = async () => {
      for (const file of files) {
        // Пропускаем уже обработанные
        if (processedFiles.current.has(file.id)) continue

        // Проверяем нужен ли прокси
        if (needsProxyGeneration(file)) {
          processedFiles.current.add(file.id)

          // Запускаем генерацию
          const proxyPath = await generateProxy(file)
          if (proxyPath) {
            setProxyPaths((prev) => new Map(prev).set(file.id, proxyPath))
          }
        }
      }
    }

    void processNewFiles()
  }, [files, generateProxy])

  // Добавляем proxy к файлам
  const filesWithProxy = files.map((file) => {
    // 🔧 FIX: Используем file.path для получения прокси из кэша
    const cachedProxyPath = getProxyPath(file.path) || proxyPaths.get(file.id)
    if (cachedProxyPath && !file.proxy) {
      return {
        ...file,
        proxy: {
          path: cachedProxyPath,
          width: 960, // 540p resolution
          height: 540,
          bitrate: 2000000, // Снижен битрейт для 540p
        },
      }
    }
    return file
  })

  return {
    filesWithProxy,
    generatingFileIds,
  }
}

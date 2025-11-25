/**
 * Auto Proxy Generation Hook
 *
 * Автоматически генерирует прокси для H.265/HEVC видео,
 * которые не поддерживаются в WebView/Safari
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { getProxyGenerator } from "@/domains/media-management/services/proxy-generator"
import type { MediaFile } from "@/features/media/types/media"
import { needsProxyGeneration } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AutoProxy")

// Локальный кэш для proxy путей (fileId -> proxyPath)
const proxyCache = new Map<string, string>()

// Файлы в процессе генерации
const generatingFiles = new Set<string>()

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
  /** Получить прокси путь из кэша */
  getProxyPath: (fileId: string) => string | null
  /** Проверить, генерируется ли прокси для файла */
  isGenerating: (fileId: string) => boolean
  /** Файлы, для которых идет генерация */
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

  const generateProxy = useCallback(
    async (file: MediaFile): Promise<string | null> => {
      // Проверяем, нужна ли генерация
      if (!enabled) {
        logger.debugSync("Auto proxy disabled", { fileId: file.id })
        return null
      }

      // Проверяем, уже есть ли прокси в кэше
      const cachedProxy = proxyCache.get(file.id)
      if (cachedProxy) {
        logger.debugSync("Proxy found in cache", { fileId: file.id, proxyPath: cachedProxy })
        return cachedProxy
      }

      // Проверяем, не генерируется ли уже
      if (generatingFiles.has(file.id)) {
        logger.debugSync("Proxy already generating", { fileId: file.id })
        return null
      }

      // Проверяем, нужен ли прокси
      if (!needsProxyGeneration(file)) {
        logger.debugSync("Proxy not needed", { fileId: file.id, codec: file.videoCodec })
        return null
      }

      logger.infoSync("Starting auto proxy generation", {
        fileId: file.id,
        fileName: file.name,
        codec: file.videoCodec || file.probeData?.streams?.find((s) => s.codec_type === "video")?.codec_name,
      })

      // Отмечаем файл как генерируемый
      generatingFiles.add(file.id)
      setGeneratingFileIds(Array.from(generatingFiles))

      try {
        const proxyGenerator = getProxyGenerator()
        const result = await proxyGenerator.generateProxy(file.path, {
          resolution: "720p",
          quality: "medium",
          codec: "h264",
          preserveAudio: true,
        })

        const proxyPath = result.proxyPath

        // Сохраняем в кэш
        proxyCache.set(file.id, proxyPath)

        logger.infoSync("Proxy generation completed", {
          fileId: file.id,
          fileName: file.name,
          proxyPath,
          generationTime: result.generationTime,
        })

        // Уведомляем о готовности
        onProxyReadyRef.current?.(file.id, proxyPath)

        return proxyPath
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.errorSync("Proxy generation failed", {
          fileId: file.id,
          fileName: file.name,
          error: errorMessage,
        })

        onErrorRef.current?.(file.id, errorMessage)
        return null
      } finally {
        // Убираем из генерируемых
        generatingFiles.delete(file.id)
        setGeneratingFileIds(Array.from(generatingFiles))
      }
    },
    [enabled],
  )

  const getProxyPath = useCallback((fileId: string): string | null => {
    return proxyCache.get(fileId) || null
  }, [])

  const isGenerating = useCallback((fileId: string): boolean => {
    return generatingFiles.has(fileId)
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
    const cachedProxyPath = getProxyPath(file.id) || proxyPaths.get(file.id)
    if (cachedProxyPath && !file.proxy) {
      return {
        ...file,
        proxy: {
          path: cachedProxyPath,
          width: 1280,
          height: 720,
          bitrate: 3000000,
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

import { useCallback, useEffect, useRef } from "react"

import { createLogger } from "@/lib/tauri-logger"
import { useApiKeys } from "./use-api-keys"

const logger = createLogger({ module: "UseAutoRevalidation" })

/**
 * Интервал автоматической ревалидации API ключей (в миллисекундах)
 * По умолчанию: 24 часа
 */
const REVALIDATION_INTERVAL = 24 * 60 * 60 * 1000

/**
 * Минимальный интервал между ревалидациями для одного сервиса (в миллисекундах)
 * По умолчанию: 1 час
 */
const MIN_REVALIDATION_GAP = 60 * 60 * 1000

interface UseAutoRevalidationOptions {
  /**
   * Включить автоматическую ревалидацию
   * @default true
   */
  enabled?: boolean

  /**
   * Интервал ревалидации в миллисекундах
   * @default 24 часа
   */
  interval?: number

  /**
   * Список сервисов для автоматической ревалидации
   * Если не указано, проверяются все сервисы с установленными ключами
   */
  services?: string[]

  /**
   * Callback при успешной ревалидации
   */
  onRevalidated?: (service: string, isValid: boolean) => void

  /**
   * Callback при ошибке ревалидации
   */
  onError?: (service: string, error: string) => void
}

/**
 * Хук для автоматической ревалидации API ключей
 *
 * Автоматически проверяет валидность API ключей через заданный интервал.
 * Полезно для выявления истёкших или отозванных ключей.
 *
 * @example
 * useAutoRevalidation({
 *   enabled: true,
 *   services: ["claude", "openai"],
 *   onRevalidated: (service, isValid) => {
 *     console.log(`${service}: ${isValid ? "valid" : "invalid"}`)
 *   }
 * })
 */
export function useAutoRevalidation(options: UseAutoRevalidationOptions = {}) {
  const { enabled = true, interval = REVALIDATION_INTERVAL, services, onRevalidated, onError } = options

  const { testApiKey, getApiKeyInfo } = useApiKeys()
  const lastRevalidation = useRef<Record<string, number>>({})
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  /**
   * Проверить, нужна ли ревалидация для сервиса
   */
  const needsRevalidation = useCallback(
    (service: string): boolean => {
      const keyInfo = getApiKeyInfo(service)

      // Если ключ не установлен, ревалидация не нужна
      if (!keyInfo || !keyInfo.has_value) {
        return false
      }

      // Проверяем минимальный интервал между ревалидациями
      const lastCheck = lastRevalidation.current[service]
      if (lastCheck && Date.now() - lastCheck < MIN_REVALIDATION_GAP) {
        return false
      }

      // Если есть дата последней валидации, проверяем прошло ли достаточно времени
      if (keyInfo.last_validated) {
        try {
          const lastValidatedDate = new Date(keyInfo.last_validated).getTime()
          const timeSinceValidation = Date.now() - lastValidatedDate

          // Ревалидация нужна, если прошло больше интервала
          return timeSinceValidation >= interval
        } catch (error) {
          logger.warn("Failed to parse last_validated date", {
            service,
            lastValidated: keyInfo.last_validated,
            error: String(error),
          })
          return true // В случае ошибки парсинга, лучше перепроверить
        }
      }

      // Если даты валидации нет, но ключ установлен - нужна ревалидация
      return true
    },
    [getApiKeyInfo, interval],
  )

  /**
   * Выполнить ревалидацию для сервиса
   */
  const revalidateService = useCallback(
    async (service: string) => {
      try {
        logger.info("Auto-revalidating API key", { service })

        const isValid = await testApiKey(service)
        lastRevalidation.current[service] = Date.now()

        logger.info("Auto-revalidation completed", { service, isValid })

        onRevalidated?.(service, isValid)

        // Если ключ невалидный, логируем предупреждение
        if (!isValid) {
          logger.warn("API key is no longer valid", { service })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error("Auto-revalidation failed", { service, error: errorMessage })

        onError?.(service, errorMessage)
      }
    },
    [testApiKey, onRevalidated, onError],
  )

  /**
   * Выполнить ревалидацию для всех сервисов
   */
  const revalidateAll = useCallback(async () => {
    const servicesToCheck = services || ["claude", "openai", "deepseek", "ollama", "groq"]

    for (const service of servicesToCheck) {
      if (needsRevalidation(service)) {
        await revalidateService(service)

        // Небольшая задержка между проверками, чтобы не перегружать API
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }, [services, needsRevalidation, revalidateService])

  // Запустить автоматическую ревалидацию
  useEffect(() => {
    if (!enabled) {
      return
    }

    // Первая проверка при монтировании (с небольшой задержкой)
    const initialCheck = setTimeout(() => {
      void revalidateAll()
    }, 5000) // 5 секунд задержки после загрузки

    // Периодическая проверка
    intervalRef.current = setInterval(() => {
      void revalidateAll()
    }, interval)

    return () => {
      clearTimeout(initialCheck)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, revalidateAll])

  return {
    /**
     * Вручную запустить ревалидацию для всех сервисов
     */
    revalidateAll,

    /**
     * Вручную запустить ревалидацию для конкретного сервиса
     */
    revalidateService,

    /**
     * Проверить, нужна ли ревалидация для сервиса
     */
    needsRevalidation,
  }
}

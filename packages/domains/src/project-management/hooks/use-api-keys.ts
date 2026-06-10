import { useCallback, useEffect, useState } from "react"
import { apiKeysService } from "@timeline-studio/domains/project-management/services/api-keys-service"
import type { ApiKeyInfo, ApiKeyStatus, SupportedService } from "@timeline-studio/domains/project-management/tauri/api-keys-commands"
import { createLogger } from "@/lib/tauri-logger"
import { useUserSettings } from "./use-user-settings"

const logger = createLogger({ module: "UseApiKeys" })

/**
 * Хук для управления API ключами и OAuth подключениями
 */
export function useApiKeys() {
  const userSettings = useUserSettings()
  const [apiKeysInfo, setApiKeysInfo] = useState<Record<string, ApiKeyInfo>>({})
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [clientSideErrors, setClientSideErrors] = useState<Record<string, string>>({})

  /**
   * Загружает информацию обо всех API ключах
   */
  const loadApiKeysInfo = useCallback(async () => {
    try {
      const keysList = await apiKeysService.listApiKeys()
      const keysMap = keysList.reduce<Record<string, ApiKeyInfo>>((acc, keyInfo) => {
        acc[keyInfo.key_type] = keyInfo
        return acc
      }, {})
      setApiKeysInfo(keysMap)
    } catch (error) {
      void logger.error("Failed to load API keys info:", { error: String(error) })
    }
  }, [])

  // Загружаем информацию при монтировании
  useEffect(() => {
    void loadApiKeysInfo()
  }, [loadApiKeysInfo])

  /**
   * Получить статус API ключа для сервиса
   */
  const getApiKeyStatus = useCallback(
    (service: string): ApiKeyStatus => {
      const keyInfo = apiKeysInfo[service] || null
      const isLoading = loadingStatuses[service] || false
      return apiKeysService.getKeyStatus(keyInfo, isLoading)
    },
    [apiKeysInfo, loadingStatuses],
  )

  /**
   * Сохранить простой API ключ
   */
  const saveSimpleApiKey = useCallback(
    async (service: string, value: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.saveSimpleApiKey(service, value)

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          setValidationErrors((prev) => ({ ...prev, [service]: "" })) // Очищаем ошибки валидации
          setClientSideErrors((prev) => ({ ...prev, [service]: "" }))
          return true
        }

        // Если ошибка валидации - показываем её
        setClientSideErrors((prev) => ({ ...prev, [service]: result.message }))
        return false
      } catch (error) {
        void logger.error(`Error saving ${service} API key:`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  /**
   * Тестировать API ключ
   */
  const testApiKey = useCallback(
    async (service: string): Promise<boolean> => {
      setLoadingStatuses((prev) => ({ ...prev, [service]: true }))
      setValidationErrors((prev) => ({ ...prev, [service]: "" }))

      try {
        const result = await apiKeysService.validateApiKey(service)

        // Store the specific error message if validation failed
        if (!result.is_valid && result.error_message) {
          setValidationErrors((prev) => ({ ...prev, [service]: result.error_message || "" }))
        }

        await loadApiKeysInfo() // Обновляем информацию после валидации
        return result.is_valid
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setValidationErrors((prev) => ({ ...prev, [service]: errorMessage }))
        void logger.error(`Error testing ${service} API key:`, { error: String(error) })
        return false
      } finally {
        setLoadingStatuses((prev) => ({ ...prev, [service]: false }))
      }
    },
    [loadApiKeysInfo],
  )

  /**
   * Сохранить OAuth credentials
   */
  const saveOAuthCredentials = useCallback(
    async (
      service: string,
      clientId: string,
      clientSecret: string,
      accessToken?: string,
      refreshToken?: string,
    ): Promise<boolean> => {
      try {
        const result = await apiKeysService.saveOAuthCredentials(
          service,
          clientId,
          clientSecret,
          accessToken,
          refreshToken,
        )

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error saving ${service} OAuth credentials:`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  /**
   * Генерировать OAuth URL
   */
  const generateOAuthUrl = useCallback(
    async (service: string, clientId: string, state?: string): Promise<string | null> => {
      try {
        return await apiKeysService.generateOAuthUrl(service, clientId, state)
      } catch (error) {
        void logger.error(`Error generating OAuth URL for ${service}:`, { error: String(error) })
        return null
      }
    },
    [],
  )

  /**
   * Обменять authorization code на access token
   */
  const exchangeOAuthCode = useCallback(
    async (service: string, clientId: string, clientSecret: string, code: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.exchangeOAuthCode(service, clientId, clientSecret, code)

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error exchanging OAuth code for ${service}:`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  /**
   * Удалить API ключ
   */
  const deleteApiKey = useCallback(
    async (service: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.deleteApiKey(service)

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          setValidationErrors((prev) => ({ ...prev, [service]: "" })) // Очищаем ошибки валидации
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error deleting ${service} API key:`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  /**
   * Импорт и экспорт
   */
  const importFromEnv = useCallback(
    async (envFilePath?: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.importFromEnv(envFilePath)

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        return false
      } catch (error) {
        void logger.error("Error importing from .env:", { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const exportToEnvFormat = useCallback(async (): Promise<string | null> => {
    try {
      return await apiKeysService.exportToEnvFormat()
    } catch (error) {
      void logger.error("Error exporting to .env format:", { error: String(error) })
      return null
    }
  }, [])

  /**
   * Получить информацию о конкретном ключе
   */
  const getApiKeyInfo = useCallback(
    (service: string): ApiKeyInfo | null => {
      return apiKeysInfo[service] || null
    },
    [apiKeysInfo],
  )

  /**
   * Обновить OAuth токен используя refresh token
   */
  const refreshOAuthToken = useCallback(
    async (service: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.refreshOAuthToken(service)

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error refreshing OAuth token for ${service}:`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  /**
   * Получить информацию о пользователе через OAuth API
   */
  const getOAuthUserInfo = useCallback(async (service: string): Promise<Record<string, unknown> | null> => {
    try {
      return await apiKeysService.getOAuthUserInfo(service)
    } catch (error) {
      void logger.error(`Error getting OAuth user info for ${service}:`, { error: String(error) })
      return null
    }
  }, [])

  /**
   * Парсить OAuth callback URL
   */
  const parseOAuthCallbackUrl = useCallback(async (url: string): Promise<Record<string, unknown> | null> => {
    try {
      return await apiKeysService.parseOAuthCallbackUrl(url)
    } catch (error) {
      void logger.error("Error parsing OAuth callback URL:", { error: String(error) })
      return null
    }
  }, [])

  /**
   * Получить сообщение об ошибке валидации для сервиса
   * Приоритет: client-side ошибки -> server-side ошибки
   */
  const getValidationError = useCallback(
    (service: string): string | undefined => {
      return clientSideErrors[service] || validationErrors[service]
    },
    [clientSideErrors, validationErrors],
  )

  /**
   * Валидация формата API ключа (client-side)
   */
  const validateKeyFormat = useCallback((service: string, key: string): boolean => {
    if (!key || key.trim().length === 0) return true // Пустой ключ валиден (не установлен)
    if (!(service in { openai: 1, claude: 1, grok: 1, deepseek: 1, gemini: 1 })) return true // OAuth сервисы не валидируем

    return apiKeysService.validateKeyFormat(service as SupportedService, key)
  }, [])

  return {
    // Основные операции
    getApiKeyStatus,
    getApiKeyInfo,
    getValidationError,
    testApiKey,
    saveSimpleApiKey,
    deleteApiKey,
    loadApiKeysInfo,
    validateKeyFormat,

    // OAuth operations
    saveOAuthCredentials,
    generateOAuthUrl,
    exchangeOAuthCode,
    refreshOAuthToken,
    getOAuthUserInfo,
    parseOAuthCallbackUrl,

    // Import/Export
    importFromEnv,
    exportToEnvFormat,

    // Состояние
    apiKeysInfo,
    loadingStatuses,
  }
}

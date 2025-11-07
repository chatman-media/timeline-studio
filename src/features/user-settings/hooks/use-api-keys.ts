import { invoke } from "@tauri-apps/api/core"
import { useCallback, useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { useUserSettings } from "./use-user-settings"

const logger = createLogger({ module: "UseApiKeys" })

/**
 * API key operation result from backend
 */
interface ApiKeyOperationResult {
  success: boolean
  message: string
  data?: any
}

/**
 * API key info from backend
 */
interface ApiKeyInfo {
  key_type: string
  has_value: boolean
  is_oauth: boolean
  has_access_token: boolean
  created_at?: string
  last_validated?: string
  is_valid?: boolean
}

/**
 * Validation result from backend
 */
interface ValidationResult {
  is_valid: boolean
  error_message?: string
  service_info?: string
  rate_limits?: {
    requests_remaining?: number
    reset_time?: string
    daily_limit?: number
  }
}

/**
 * Интерфейс для OAuth credentials
 */
interface OAuthCredentials {
  clientId: string
  clientSecret: string
  accessToken?: string
}

interface TelegramCredentials {
  botToken: string
  chatId: string
}

interface VimeoCredentials extends OAuthCredentials {
  accessToken: string
}

/**
 * Хук для управления API ключами и OAuth подключениями
 */
export function useApiKeys() {
  const userSettings = useUserSettings()
  const [apiKeysInfo, setApiKeysInfo] = useState<Record<string, ApiKeyInfo>>({})
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  /**
   * Загружает информацию обо всех API ключах
   */
  const loadApiKeysInfo = useCallback(async () => {
    try {
      const keysList: ApiKeyInfo[] = await invoke("list_api_keys")
      const keysMap = keysList.reduce<Record<string, ApiKeyInfo>>((acc, keyInfo) => {
        acc[keyInfo.key_type] = keyInfo
        return acc
      }, {})
      setApiKeysInfo(keysMap)
    } catch (error) {
      logger.error("Failed to load API keys info:", error)
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
    (service: string): "not_set" | "testing" | "invalid" | "valid" => {
      if (loadingStatuses[service]) {
        return "testing"
      }

      const keyInfo = apiKeysInfo[service]
      if (!keyInfo || !keyInfo.has_value) {
        return "not_set"
      }

      // Показываем сохраненный статус валидации сразу при загрузке
      if (keyInfo.is_valid !== undefined) {
        return keyInfo.is_valid ? "valid" : "invalid"
      }

      return "not_set"
    },
    [apiKeysInfo, loadingStatuses],
  )

  /**
   * Сохранить простой API ключ
   */
  const saveSimpleApiKey = useCallback(
    async (service: string, value: string): Promise<boolean> => {
      try {
        const result: ApiKeyOperationResult = await invoke("save_simple_api_key", {
          params: {
            key_type: service,
            value: value,
          },
        })

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          setValidationErrors((prev) => ({ ...prev, [service]: "" })) // Очищаем ошибки валидации
          return true
        }
        logger.error(`Failed to save ${service} API key:`, result.message)
        return false
      } catch (error) {
        logger.error(`Error saving ${service} API key:`, error)
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
        const result: ValidationResult = await invoke("validate_api_key", {
          keyType: service,
        })

        // Store the specific error message if validation failed
        if (!result.is_valid && result.error_message) {
          setValidationErrors((prev: any) => ({ ...prev, [service]: result.error_message }))
        }

        await loadApiKeysInfo() // Обновляем информацию после валидации
        return result.is_valid
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setValidationErrors((prev) => ({ ...prev, [service]: errorMessage }))
        logger.error(`Error testing ${service} API key:`, error)
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
        const result: ApiKeyOperationResult = await invoke("save_oauth_credentials", {
          params: {
            key_type: service,
            client_id: clientId,
            client_secret: clientSecret,
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        })

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        logger.error(`Failed to save ${service} OAuth credentials:`, result.message)
        return false
      } catch (error) {
        logger.error(`Error saving ${service} OAuth credentials:`, error)
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
        const url: string = await invoke("generate_oauth_url", {
          keyType: service,
          clientId,
          state,
        })
        return url
      } catch (error) {
        logger.error(`Error generating OAuth URL for ${service}:`, error)
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
        const result: ApiKeyOperationResult = await invoke("exchange_oauth_code", {
          keyType: service,
          clientId,
          clientSecret,
          code,
        })

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        logger.error(`Failed to exchange OAuth code for ${service}:`, result.message)
        return false
      } catch (error) {
        logger.error(`Error exchanging OAuth code for ${service}:`, error)
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
        const result: ApiKeyOperationResult = await invoke("delete_api_key", {
          keyType: service,
        })

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          setValidationErrors((prev) => ({ ...prev, [service]: "" })) // Очищаем ошибки валидации
          return true
        }
        logger.error(`Failed to delete ${service} API key:`, result.message)
        return false
      } catch (error) {
        logger.error(`Error deleting ${service} API key:`, error)
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
        const result: ApiKeyOperationResult = await invoke("import_from_env", {
          envFilePath,
        })

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        logger.error("Failed to import from .env:", result.message)
        return false
      } catch (error) {
        logger.error("Error importing from .env:", error)
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const exportToEnvFormat = useCallback(async (): Promise<string | null> => {
    try {
      const envContent: string = await invoke("export_to_env_format")
      return envContent
    } catch (error) {
      logger.error("Error exporting to .env format:", error)
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
        const result: ApiKeyOperationResult = await invoke("refresh_oauth_token", {
          keyType: service,
        })

        if (result.success) {
          await loadApiKeysInfo() // Обновляем информацию
          return true
        }
        logger.error(`Failed to refresh OAuth token for ${service}:`, result.message)
        return false
      } catch (error) {
        logger.error(`Error refreshing OAuth token for ${service}:`, error)
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
      const userInfo = await invoke("get_oauth_user_info", {
        keyType: service,
      })
      return userInfo as Record<string, unknown>
    } catch (error) {
      logger.error(`Error getting OAuth user info for ${service}:`, error)
      return null
    }
  }, [])

  /**
   * Парсить OAuth callback URL
   */
  const parseOAuthCallbackUrl = useCallback(async (url: string): Promise<Record<string, unknown> | null> => {
    try {
      const result = await invoke("parse_oauth_callback_url", {
        url,
      })
      return result as Record<string, unknown>
    } catch (error) {
      logger.error("Error parsing OAuth callback URL:", error)
      return null
    }
  }, [])

  /**
   * Получить сообщение об ошибке валидации для сервиса
   */
  const getValidationError = useCallback(
    (service: string): string | undefined => {
      return validationErrors[service]
    },
    [validationErrors],
  )

  return {
    // Основные операции
    getApiKeyStatus,
    getApiKeyInfo,
    getValidationError,
    testApiKey,
    saveSimpleApiKey,
    deleteApiKey,
    loadApiKeysInfo,

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

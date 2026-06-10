import { useCallback, useEffect, useState } from "react"
import {
  apiKeysService,
  type ApiKeyInfo,
  type ApiKeyStatus,
  type SupportedService,
} from "@timeline-studio/core/services/api-keys"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "CoreUseApiKeys" })

export function useApiKeys() {
  const [apiKeysInfo, setApiKeysInfo] = useState<Record<string, ApiKeyInfo>>({})
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [clientSideErrors, setClientSideErrors] = useState<Record<string, string>>({})

  const loadApiKeysInfo = useCallback(async () => {
    try {
      const keysList = await apiKeysService.listApiKeys()
      const keysMap = keysList.reduce<Record<string, ApiKeyInfo>>((acc, keyInfo) => {
        acc[keyInfo.key_type] = keyInfo
        return acc
      }, {})
      setApiKeysInfo(keysMap)
    } catch (error) {
      void logger.error("Failed to load API keys info", { error: String(error) })
    }
  }, [])

  useEffect(() => {
    void loadApiKeysInfo()
  }, [loadApiKeysInfo])

  const getApiKeyStatus = useCallback(
    (service: string): ApiKeyStatus => {
      const keyInfo = apiKeysInfo[service] || null
      const isLoading = loadingStatuses[service] || false
      return apiKeysService.getKeyStatus(keyInfo, isLoading)
    },
    [apiKeysInfo, loadingStatuses],
  )

  const saveSimpleApiKey = useCallback(
    async (service: string, value: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.saveSimpleApiKey(service, value)

        if (result.success) {
          await loadApiKeysInfo()
          setValidationErrors((prev) => ({ ...prev, [service]: "" }))
          setClientSideErrors((prev) => ({ ...prev, [service]: "" }))
          return true
        }

        setClientSideErrors((prev) => ({ ...prev, [service]: result.message }))
        return false
      } catch (error) {
        void logger.error(`Error saving ${service} API key`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const testApiKey = useCallback(
    async (service: string): Promise<boolean> => {
      setLoadingStatuses((prev) => ({ ...prev, [service]: true }))
      setValidationErrors((prev) => ({ ...prev, [service]: "" }))

      try {
        const result = await apiKeysService.validateApiKey(service)

        if (!result.is_valid && result.error_message) {
          setValidationErrors((prev) => ({ ...prev, [service]: result.error_message || "" }))
        }

        await loadApiKeysInfo()
        return result.is_valid
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setValidationErrors((prev) => ({ ...prev, [service]: errorMessage }))
        void logger.error(`Error testing ${service} API key`, { error: String(error) })
        return false
      } finally {
        setLoadingStatuses((prev) => ({ ...prev, [service]: false }))
      }
    },
    [loadApiKeysInfo],
  )

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
          await loadApiKeysInfo()
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error saving ${service} OAuth credentials`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const generateOAuthUrl = useCallback(async (service: string, clientId: string, state?: string) => {
    try {
      return await apiKeysService.generateOAuthUrl(service, clientId, state)
    } catch (error) {
      void logger.error(`Error generating OAuth URL for ${service}`, { error: String(error) })
      return null
    }
  }, [])

  const exchangeOAuthCode = useCallback(
    async (service: string, clientId: string, clientSecret: string, code: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.exchangeOAuthCode(service, clientId, clientSecret, code)
        if (result.success) {
          await loadApiKeysInfo()
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error exchanging OAuth code for ${service}`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const deleteApiKey = useCallback(
    async (service: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.deleteApiKey(service)

        if (result.success) {
          await loadApiKeysInfo()
          setValidationErrors((prev) => ({ ...prev, [service]: "" }))
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error deleting ${service} API key`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const importFromEnv = useCallback(
    async (envFilePath?: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.importFromEnv(envFilePath)
        if (result.success) {
          await loadApiKeysInfo()
          return true
        }
        return false
      } catch (error) {
        void logger.error("Error importing from .env", { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const exportToEnvFormat = useCallback(async (): Promise<string | null> => {
    try {
      return await apiKeysService.exportToEnvFormat()
    } catch (error) {
      void logger.error("Error exporting to .env format", { error: String(error) })
      return null
    }
  }, [])

  const getApiKeyInfo = useCallback((service: string): ApiKeyInfo | null => apiKeysInfo[service] || null, [apiKeysInfo])

  const refreshOAuthToken = useCallback(
    async (service: string): Promise<boolean> => {
      try {
        const result = await apiKeysService.refreshOAuthToken(service)
        if (result.success) {
          await loadApiKeysInfo()
          return true
        }
        return false
      } catch (error) {
        void logger.error(`Error refreshing OAuth token for ${service}`, { error: String(error) })
        return false
      }
    },
    [loadApiKeysInfo],
  )

  const getOAuthUserInfo = useCallback(async (service: string): Promise<Record<string, unknown> | null> => {
    try {
      return await apiKeysService.getOAuthUserInfo(service)
    } catch (error) {
      void logger.error(`Error getting OAuth user info for ${service}`, { error: String(error) })
      return null
    }
  }, [])

  const parseOAuthCallbackUrl = useCallback(async (url: string): Promise<Record<string, unknown> | null> => {
    try {
      return await apiKeysService.parseOAuthCallbackUrl(url)
    } catch (error) {
      void logger.error("Error parsing OAuth callback URL", { error: String(error) })
      return null
    }
  }, [])

  const getValidationError = useCallback(
    (service: string): string | undefined => clientSideErrors[service] || validationErrors[service],
    [clientSideErrors, validationErrors],
  )

  const validateKeyFormat = useCallback((service: string, key: string): boolean => {
    if (!key || key.trim().length === 0) return true
    if (!(service in { openai: 1, claude: 1, grok: 1, deepseek: 1, gemini: 1 })) return true
    return apiKeysService.validateKeyFormat(service as SupportedService, key)
  }, [])

  return {
    getApiKeyStatus,
    getApiKeyInfo,
    getValidationError,
    testApiKey,
    saveSimpleApiKey,
    deleteApiKey,
    loadApiKeysInfo,
    validateKeyFormat,
    saveOAuthCredentials,
    generateOAuthUrl,
    exchangeOAuthCode,
    refreshOAuthToken,
    getOAuthUserInfo,
    parseOAuthCallbackUrl,
    importFromEnv,
    exportToEnvFormat,
    apiKeysInfo,
    loadingStatuses,
  }
}

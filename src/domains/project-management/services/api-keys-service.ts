/**
 * API Keys Service
 *
 * Сервис для работы с API ключами и OAuth credentials
 * Инкапсулирует всю бизнес-логику работы с API ключами
 */

import { createLogger } from "@/lib/tauri-logger"
import {
  type ApiKeyInfo,
  type ApiKeyOperationResult,
  type ApiKeyStatus,
  deleteApiKey as deleteApiKeyCommand,
  exchangeOAuthCode as exchangeOAuthCodeCommand,
  exportToEnvFormat as exportToEnvFormatCommand,
  generateOAuthUrl as generateOAuthUrlCommand,
  getOAuthUserInfo as getOAuthUserInfoCommand,
  importFromEnv as importFromEnvCommand,
  listApiKeys as listApiKeysCommand,
  parseOAuthCallbackUrl as parseOAuthCallbackUrlCommand,
  refreshOAuthToken as refreshOAuthTokenCommand,
  type SupportedService,
  saveOAuthCredentials as saveOAuthCredentialsCommand,
  saveSimpleApiKey as saveSimpleApiKeyCommand,
  type ValidationResult,
  validateApiKey as validateApiKeyCommand,
} from "../tauri/api-keys-commands"

const logger = createLogger({ module: "ApiKeysService" })

/**
 * Паттерны валидации и маски для API ключей различных сервисов
 */

/**
 * Regex паттерны для валидации API ключей
 * Основаны на известных форматах ключей различных сервисов
 */
export const API_KEY_PATTERNS: Record<SupportedService, RegExp> = {
  // OpenAI: sk-proj-... или sk-... (48+ символов)
  openai: /^sk-[a-zA-Z0-9]{20,}$/,

  // Claude (Anthropic): sk-ant-api03-... (длинные ключи)
  claude: /^sk-ant-api\d{2}-[a-zA-Z0-9_-]{95,}$/,

  // Grok (X.AI): xai-... формат
  grok: /^xai-[a-zA-Z0-9]{32,}$/,

  // DeepSeek: sk-... формат (похож на OpenAI)
  deepseek: /^sk-[a-zA-Z0-9]{32,}$/,

  // Google Gemini: обычно начинается с AIza
  gemini: /^AIza[a-zA-Z0-9_-]{35,}$/,

  // YouTube OAuth: не требует валидации ключа (OAuth)
  youtube: /.*/,

  // Telegram: bot токен формата 123456789:ABCdefGHI...
  telegram: /^\d{8,10}:[a-zA-Z0-9_-]{35,}$/,

  // Vimeo OAuth: не требует валидации ключа (OAuth)
  vimeo: /.*/,

  // Facebook OAuth: не требует валидации ключа (OAuth)
  facebook: /.*/,

  // Instagram OAuth: не требует валидации ключа (OAuth)
  instagram: /.*/,

  // TikTok OAuth: не требует валидации ключа (OAuth)
  tiktok: /.*/,

  // Twitter OAuth: не требует валидации ключа (OAuth)
  twitter: /.*/,
}

/**
 * Маски для отображения API ключей в UI
 * Определяют как скрывать ключ (сколько символов показывать в начале/конце)
 */
export interface ApiKeyMask {
  /** Количество символов для отображения в начале */
  prefix: number
  /** Количество символов для отображения в конце */
  suffix: number
  /** Символ для замены скрытой части */
  maskChar: string
}

/**
 * Конфигурация масок для каждого сервиса
 */
export const API_KEY_MASKS: Record<SupportedService, ApiKeyMask> = {
  openai: { prefix: 7, suffix: 4, maskChar: "•" },
  claude: { prefix: 12, suffix: 4, maskChar: "•" },
  grok: { prefix: 8, suffix: 4, maskChar: "•" },
  deepseek: { prefix: 7, suffix: 4, maskChar: "•" },
  gemini: { prefix: 8, suffix: 4, maskChar: "•" },
  youtube: { prefix: 8, suffix: 4, maskChar: "•" },
  telegram: { prefix: 10, suffix: 4, maskChar: "•" },
  vimeo: { prefix: 8, suffix: 4, maskChar: "•" },
  facebook: { prefix: 8, suffix: 4, maskChar: "•" },
  instagram: { prefix: 8, suffix: 4, maskChar: "•" },
  tiktok: { prefix: 8, suffix: 4, maskChar: "•" },
  twitter: { prefix: 8, suffix: 4, maskChar: "•" },
}

/**
 * Минимальная длина ключей для каждого сервиса
 */
export const API_KEY_MIN_LENGTH: Record<SupportedService, number> = {
  openai: 40,
  claude: 100,
  grok: 35,
  deepseek: 35,
  gemini: 39,
  youtube: 20, // OAuth credentials
  telegram: 45,
  vimeo: 20, // OAuth credentials
  facebook: 20, // OAuth credentials
  instagram: 20, // OAuth credentials
  tiktok: 20, // OAuth credentials
  twitter: 20, // OAuth credentials
}

/**
 * Сообщения об ошибках валидации для каждого сервиса
 */
export const VALIDATION_ERROR_MESSAGES: Record<SupportedService, string> = {
  openai: "OpenAI API ключ должен начинаться с 'sk-' и быть не менее 40 символов",
  claude: "Claude API ключ должен начинаться с 'sk-ant-api03-' и быть не менее 100 символов",
  grok: "Grok API ключ должен начинаться с 'xai-' и быть не менее 35 символов",
  deepseek: "DeepSeek API ключ должен начинаться с 'sk-' и быть не менее 35 символов",
  gemini: "Google Gemini API ключ должен начинаться с 'AIza' и быть не менее 39 символов",
  youtube: "YouTube OAuth credentials требуют Client ID и Client Secret",
  telegram: "Telegram Bot Token должен быть в формате: 123456789:ABCdef...",
  vimeo: "Vimeo OAuth credentials требуют Client ID, Client Secret и Access Token",
  facebook: "Facebook OAuth credentials требуют Client ID и Client Secret",
  instagram: "Instagram OAuth credentials требуют Client ID и Client Secret",
  tiktok: "TikTok OAuth credentials требуют Client ID и Client Secret",
  twitter: "Twitter OAuth credentials требуют Client ID и Client Secret",
}

/**
 * Ссылки на документацию API для сервисов
 */
export const API_DOCUMENTATION_LINKS: Record<SupportedService, string> = {
  openai: "https://platform.openai.com/api-keys",
  claude: "https://console.anthropic.com/settings/keys",
  grok: "https://console.x.ai/",
  deepseek: "https://platform.deepseek.com/api_keys",
  gemini: "https://makersuite.google.com/app/apikey",
  youtube: "https://console.cloud.google.com/apis/credentials",
  telegram: "https://core.telegram.org/bots#6-botfather",
  vimeo: "https://developer.vimeo.com/apps",
  facebook: "https://developers.facebook.com/apps",
  instagram: "https://developers.facebook.com/apps",
  tiktok: "https://developers.tiktok.com/apps",
  twitter: "https://developer.twitter.com/en/portal/dashboard",
}

/**
 * API Keys Service
 */
export class ApiKeysService {
  /**
   * Получить список всех API ключей
   */
  async listApiKeys(): Promise<ApiKeyInfo[]> {
    try {
      return await listApiKeysCommand()
    } catch (error) {
      void logger.error("Failed to list API keys:", { error: String(error) })
      throw error
    }
  }

  /**
   * Сохранить простой API ключ с валидацией формата
   */
  async saveSimpleApiKey(service: string, value: string): Promise<ApiKeyOperationResult> {
    // Client-side валидация формата ключа перед отправкой на backend
    if (value.trim().length > 0 && service in { openai: 1, claude: 1, grok: 1, deepseek: 1, gemini: 1 }) {
      const isValid = this.validateKeyFormat(service as SupportedService, value)
      if (!isValid) {
        const errorMsg = this.getValidationErrorMessage(service as SupportedService)
        void logger.warn(`Client-side validation failed for ${service}:`, { error: errorMsg })
        return {
          success: false,
          message: errorMsg,
        }
      }
    }

    try {
      const result = await saveSimpleApiKeyCommand({
        key_type: service,
        value: value,
      })

      if (result.success) {
        void logger.info(`Successfully saved API key for ${service}`)
      } else {
        void logger.error(`Failed to save ${service} API key:`, { message: result.message })
      }

      return result
    } catch (error) {
      void logger.error(`Error saving ${service} API key:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Валидировать API ключ
   */
  async validateApiKey(service: string): Promise<ValidationResult> {
    try {
      const result = await validateApiKeyCommand(service)

      if (result.is_valid) {
        void logger.info(`API key validated successfully for ${service}`)
      } else {
        void logger.warn(`API key validation failed for ${service}:`, {
          error: result.error_message,
        })
      }

      return result
    } catch (error) {
      void logger.error(`Error validating ${service} API key:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Сохранить OAuth credentials
   */
  async saveOAuthCredentials(
    service: string,
    clientId: string,
    clientSecret: string,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<ApiKeyOperationResult> {
    try {
      const result = await saveOAuthCredentialsCommand({
        key_type: service,
        client_id: clientId,
        client_secret: clientSecret,
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (result.success) {
        void logger.info(`Successfully saved OAuth credentials for ${service}`)
      } else {
        void logger.error(`Failed to save ${service} OAuth credentials:`, {
          message: result.message,
        })
      }

      return result
    } catch (error) {
      void logger.error(`Error saving ${service} OAuth credentials:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Генерировать OAuth authorization URL
   */
  async generateOAuthUrl(service: string, clientId: string, state?: string): Promise<string> {
    try {
      const url = await generateOAuthUrlCommand(service, clientId, state)
      void logger.info(`Generated OAuth URL for ${service}`)
      return url
    } catch (error) {
      void logger.error(`Error generating OAuth URL for ${service}:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Обменять authorization code на access token
   */
  async exchangeOAuthCode(
    service: string,
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<ApiKeyOperationResult> {
    try {
      const result = await exchangeOAuthCodeCommand(service, clientId, clientSecret, code)

      if (result.success) {
        void logger.info(`Successfully exchanged OAuth code for ${service}`)
      } else {
        void logger.error(`Failed to exchange OAuth code for ${service}:`, {
          message: result.message,
        })
      }

      return result
    } catch (error) {
      void logger.error(`Error exchanging OAuth code for ${service}:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Удалить API ключ
   */
  async deleteApiKey(service: string): Promise<ApiKeyOperationResult> {
    try {
      const result = await deleteApiKeyCommand(service)

      if (result.success) {
        void logger.info(`Successfully deleted API key for ${service}`)
      } else {
        void logger.error(`Failed to delete ${service} API key:`, { message: result.message })
      }

      return result
    } catch (error) {
      void logger.error(`Error deleting ${service} API key:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Импортировать API ключи из .env файла
   */
  async importFromEnv(envFilePath?: string): Promise<ApiKeyOperationResult> {
    try {
      const result = await importFromEnvCommand(envFilePath)

      if (result.success) {
        void logger.info("Successfully imported API keys from .env")
      } else {
        void logger.error("Failed to import from .env:", { message: result.message })
      }

      return result
    } catch (error) {
      void logger.error("Error importing from .env:", { error: String(error) })
      throw error
    }
  }

  /**
   * Экспортировать API ключи в формат .env
   */
  async exportToEnvFormat(): Promise<string> {
    try {
      const envContent = await exportToEnvFormatCommand()
      void logger.info("Successfully exported API keys to .env format")
      return envContent
    } catch (error) {
      void logger.error("Error exporting to .env format:", { error: String(error) })
      throw error
    }
  }

  /**
   * Обновить OAuth токен используя refresh token
   */
  async refreshOAuthToken(service: string): Promise<ApiKeyOperationResult> {
    try {
      const result = await refreshOAuthTokenCommand(service)

      if (result.success) {
        void logger.info(`Successfully refreshed OAuth token for ${service}`)
      } else {
        void logger.error(`Failed to refresh OAuth token for ${service}:`, {
          message: result.message,
        })
      }

      return result
    } catch (error) {
      void logger.error(`Error refreshing OAuth token for ${service}:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Получить информацию о пользователе через OAuth API
   */
  async getOAuthUserInfo(service: string): Promise<Record<string, unknown>> {
    try {
      const userInfo = await getOAuthUserInfoCommand(service)
      void logger.info(`Successfully retrieved OAuth user info for ${service}`)
      return userInfo
    } catch (error) {
      void logger.error(`Error getting OAuth user info for ${service}:`, { error: String(error) })
      throw error
    }
  }

  /**
   * Распарсить OAuth callback URL
   */
  async parseOAuthCallbackUrl(url: string): Promise<Record<string, unknown>> {
    try {
      const result = await parseOAuthCallbackUrlCommand(url)
      void logger.info("Successfully parsed OAuth callback URL")
      return result
    } catch (error) {
      void logger.error("Error parsing OAuth callback URL:", { error: String(error) })
      throw error
    }
  }

  /**
   * Валидация формата API ключа (client-side)
   */
  validateKeyFormat(service: SupportedService, key: string): boolean {
    if (!key || key.trim().length === 0) return false

    const pattern = API_KEY_PATTERNS[service]
    const minLength = API_KEY_MIN_LENGTH[service]

    // Проверка минимальной длины
    if (key.length < minLength) {
      return false
    }

    // Проверка по regex паттерну
    return pattern.test(key)
  }

  /**
   * Получить сообщение об ошибке валидации для сервиса
   */
  getValidationErrorMessage(service: SupportedService): string {
    return VALIDATION_ERROR_MESSAGES[service] || "Неверный формат API ключа"
  }

  /**
   * Применить маску к API ключу для безопасного отображения
   */
  maskApiKey(service: SupportedService, key: string): string {
    if (!key || key.length === 0) {
      return ""
    }

    const mask = API_KEY_MASKS[service]
    const { prefix, suffix, maskChar } = mask

    if (key.length <= prefix + suffix) {
      // Если ключ слишком короткий, показываем только префикс
      return key.substring(0, prefix) + maskChar.repeat(Math.max(0, key.length - prefix))
    }

    const maskedLength = key.length - prefix - suffix
    return key.substring(0, prefix) + maskChar.repeat(maskedLength) + key.substring(key.length - suffix)
  }

  /**
   * Определить является ли сервис OAuth-based
   */
  isOAuthService(service: SupportedService): boolean {
    return ["youtube", "vimeo", "facebook", "instagram", "tiktok", "twitter"].includes(service)
  }

  /**
   * Получить ссылку на документацию API для сервиса
   */
  getApiDocumentationLink(service: SupportedService): string {
    return API_DOCUMENTATION_LINKS[service]
  }

  /**
   * Определить статус API ключа на основе информации
   */
  getKeyStatus(keyInfo: ApiKeyInfo | null, isLoading: boolean): ApiKeyStatus {
    if (isLoading) {
      return "testing"
    }

    if (!keyInfo || !keyInfo.has_value) {
      return "not_set"
    }

    // Показываем сохраненный статус валидации
    if (keyInfo.is_valid !== undefined) {
      return keyInfo.is_valid ? "valid" : "invalid"
    }

    return "not_set"
  }
}

// Экспортируем singleton instance
export const apiKeysService = new ApiKeysService()

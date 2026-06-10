import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "CoreApiKeysService" })

export interface ApiKeyOperationResult {
  success: boolean
  message: string
  data?: unknown
}

export interface ApiKeyInfo {
  key_type: string
  has_value: boolean
  is_oauth: boolean
  has_access_token: boolean
  created_at?: string
  last_validated?: string
  is_valid?: boolean
}

export interface ValidationResult {
  is_valid: boolean
  error_message?: string
  service_info?: string
  rate_limits?: {
    requests_remaining?: number
    reset_time?: string
    daily_limit?: number
  }
}

export type ApiKeyStatus = "not_set" | "testing" | "invalid" | "valid"

export type SupportedService =
  | "openai"
  | "claude"
  | "grok"
  | "deepseek"
  | "gemini"
  | "youtube"
  | "telegram"
  | "vimeo"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "twitter"

export interface ApiKeyMask {
  prefix: number
  suffix: number
  maskChar: string
}

export const API_KEY_PATTERNS: Record<SupportedService, RegExp> = {
  openai: /^sk-[a-zA-Z0-9]{20,}$/,
  claude: /^sk-ant-api\d{2}-[a-zA-Z0-9_-]{95,}$/,
  grok: /^xai-[a-zA-Z0-9]{32,}$/,
  deepseek: /^sk-[a-zA-Z0-9]{32,}$/,
  gemini: /^AIza[a-zA-Z0-9_-]{35,}$/,
  youtube: /.*/,
  telegram: /^\d{8,10}:[a-zA-Z0-9_-]{35,}$/,
  vimeo: /.*/,
  facebook: /.*/,
  instagram: /.*/,
  tiktok: /.*/,
  twitter: /.*/,
}

export const API_KEY_MASKS: Record<SupportedService, ApiKeyMask> = {
  openai: { prefix: 7, suffix: 4, maskChar: "\u2022" },
  claude: { prefix: 12, suffix: 4, maskChar: "\u2022" },
  grok: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  deepseek: { prefix: 7, suffix: 4, maskChar: "\u2022" },
  gemini: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  youtube: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  telegram: { prefix: 10, suffix: 4, maskChar: "\u2022" },
  vimeo: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  facebook: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  instagram: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  tiktok: { prefix: 8, suffix: 4, maskChar: "\u2022" },
  twitter: { prefix: 8, suffix: 4, maskChar: "\u2022" },
}

export const API_KEY_MIN_LENGTH: Record<SupportedService, number> = {
  openai: 40,
  claude: 100,
  grok: 35,
  deepseek: 35,
  gemini: 39,
  youtube: 20,
  telegram: 45,
  vimeo: 20,
  facebook: 20,
  instagram: 20,
  tiktok: 20,
  twitter: 20,
}

export const VALIDATION_ERROR_MESSAGES: Record<SupportedService, string> = {
  openai: "OpenAI API key must start with 'sk-' and be at least 40 characters",
  claude: "Claude API key must start with 'sk-ant-api03-' and be at least 100 characters",
  grok: "Grok API key must start with 'xai-' and be at least 35 characters",
  deepseek: "DeepSeek API key must start with 'sk-' and be at least 35 characters",
  gemini: "Google Gemini API key must start with 'AIza' and be at least 39 characters",
  youtube: "YouTube OAuth credentials require Client ID and Client Secret",
  telegram: "Telegram Bot Token must be in the format 123456789:ABCdef...",
  vimeo: "Vimeo OAuth credentials require Client ID, Client Secret and Access Token",
  facebook: "Facebook OAuth credentials require Client ID and Client Secret",
  instagram: "Instagram OAuth credentials require Client ID and Client Secret",
  tiktok: "TikTok OAuth credentials require Client ID and Client Secret",
  twitter: "Twitter OAuth credentials require Client ID and Client Secret",
}

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

function isPlainApiKeyService(service: string): service is SupportedService {
  return ["openai", "claude", "grok", "deepseek", "gemini"].includes(service)
}

export class ApiKeysService {
  async listApiKeys(): Promise<ApiKeyInfo[]> {
    return await invoke<ApiKeyInfo[]>("list_api_keys")
  }

  async saveSimpleApiKey(service: string, value: string): Promise<ApiKeyOperationResult> {
    if (value.trim().length > 0 && isPlainApiKeyService(service) && !this.validateKeyFormat(service, value)) {
      return {
        success: false,
        message: this.getValidationErrorMessage(service),
      }
    }

    const result = await invoke<ApiKeyOperationResult>("save_simple_api_key", {
      params: {
        key_type: service,
        value,
      },
    })

    if (result.success) {
      void logger.info("API key saved", { service })
    } else {
      void logger.error("API key save failed", { service, message: result.message })
    }

    return result
  }

  async validateApiKey(service: string): Promise<ValidationResult> {
    return await invoke<ValidationResult>("validate_api_key", { keyType: service })
  }

  async saveOAuthCredentials(
    service: string,
    clientId: string,
    clientSecret: string,
    accessToken?: string,
    refreshToken?: string,
  ): Promise<ApiKeyOperationResult> {
    return await invoke<ApiKeyOperationResult>("save_oauth_credentials", {
      params: {
        key_type: service,
        client_id: clientId,
        client_secret: clientSecret,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    })
  }

  async generateOAuthUrl(service: string, clientId: string, state?: string): Promise<string> {
    return await invoke<string>("generate_oauth_url", { keyType: service, clientId, state })
  }

  async exchangeOAuthCode(
    service: string,
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<ApiKeyOperationResult> {
    return await invoke<ApiKeyOperationResult>("exchange_oauth_code", {
      keyType: service,
      clientId,
      clientSecret,
      code,
    })
  }

  async deleteApiKey(service: string): Promise<ApiKeyOperationResult> {
    return await invoke<ApiKeyOperationResult>("delete_api_key", { keyType: service })
  }

  async importFromEnv(envFilePath?: string): Promise<ApiKeyOperationResult> {
    return await invoke<ApiKeyOperationResult>("import_from_env", { envFilePath })
  }

  async exportToEnvFormat(): Promise<string> {
    return await invoke<string>("export_to_env_format")
  }

  async refreshOAuthToken(service: string): Promise<ApiKeyOperationResult> {
    return await invoke<ApiKeyOperationResult>("refresh_oauth_token", { keyType: service })
  }

  async getOAuthUserInfo(service: string): Promise<Record<string, unknown>> {
    return await invoke<Record<string, unknown>>("get_oauth_user_info", { keyType: service })
  }

  async parseOAuthCallbackUrl(url: string): Promise<Record<string, unknown>> {
    return await invoke<Record<string, unknown>>("parse_oauth_callback_url", { url })
  }

  validateKeyFormat(service: SupportedService, key: string): boolean {
    if (!key || key.trim().length === 0) return false
    return key.length >= API_KEY_MIN_LENGTH[service] && API_KEY_PATTERNS[service].test(key)
  }

  getValidationErrorMessage(service: SupportedService): string {
    return VALIDATION_ERROR_MESSAGES[service] || "Invalid API key format"
  }

  maskApiKey(service: SupportedService, key: string): string {
    if (!key) return ""

    const mask = API_KEY_MASKS[service]
    const { prefix, suffix, maskChar } = mask

    if (key.length <= prefix + suffix) {
      return key.substring(0, prefix) + maskChar.repeat(Math.max(0, key.length - prefix))
    }

    const maskedLength = key.length - prefix - suffix
    return key.substring(0, prefix) + maskChar.repeat(maskedLength) + key.substring(key.length - suffix)
  }

  isOAuthService(service: SupportedService): boolean {
    return ["youtube", "vimeo", "facebook", "instagram", "tiktok", "twitter"].includes(service)
  }

  getApiDocumentationLink(service: SupportedService): string {
    return API_DOCUMENTATION_LINKS[service]
  }

  getKeyStatus(keyInfo: ApiKeyInfo | null, isLoading: boolean): ApiKeyStatus {
    if (isLoading) return "testing"
    if (!keyInfo || !keyInfo.has_value) return "not_set"
    if (keyInfo.is_valid !== undefined) return keyInfo.is_valid ? "valid" : "invalid"
    return "not_set"
  }
}

export const apiKeysService = new ApiKeysService()

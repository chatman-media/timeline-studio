/**
 * Типы для операций с API ключами и OAuth
 */

/**
 * Результат операции с API ключом из backend
 */
export interface ApiKeyOperationResult {
  success: boolean
  message: string
  data?: unknown
}

/**
 * Информация об API ключе из backend
 */
export interface ApiKeyInfo {
  key_type: string
  has_value: boolean
  is_oauth: boolean
  has_access_token: boolean
  created_at?: string
  last_validated?: string
  is_valid?: boolean
}

/**
 * Результат валидации API ключа
 */
export interface ValidationResult {
  is_valid: boolean
  error_message?: string
  service_info?: string
  rate_limits?: RateLimits
}

/**
 * Информация о лимитах API
 */
export interface RateLimits {
  requests_remaining?: number
  reset_time?: string
  daily_limit?: number
}

/**
 * Базовые OAuth credentials
 */
export interface OAuthCredentials {
  clientId: string
  clientSecret: string
  accessToken?: string
}

/**
 * Telegram credentials
 */
export interface TelegramCredentials {
  botToken: string
  chatId: string
}

/**
 * Vimeo credentials (расширенные OAuth)
 */
export interface VimeoCredentials extends OAuthCredentials {
  accessToken: string
}

/**
 * Параметры для сохранения простого API ключа
 */
export interface SaveSimpleApiKeyParams {
  key_type: string
  value: string
}

/**
 * Параметры для сохранения OAuth credentials
 */
export interface SaveOAuthCredentialsParams {
  key_type: string
  client_id: string
  client_secret: string
  access_token?: string
  refresh_token?: string
}

/**
 * Параметры для генерации OAuth URL
 */
export interface GenerateOAuthUrlParams {
  keyType: string
  clientId: string
  state?: string
}

/**
 * Параметры для обмена OAuth code на token
 */
export interface ExchangeOAuthCodeParams {
  keyType: string
  clientId: string
  clientSecret: string
  code: string
}

/**
 * Параметры для валидации API ключа
 */
export interface ValidateApiKeyParams {
  keyType: string
}

/**
 * Параметры для удаления API ключа
 */
export interface DeleteApiKeyParams {
  keyType: string
}

/**
 * Параметры для обновления OAuth токена
 */
export interface RefreshOAuthTokenParams {
  keyType: string
}

/**
 * Параметры для получения информации о пользователе через OAuth
 */
export interface GetOAuthUserInfoParams {
  keyType: string
}

/**
 * Параметры для парсинга OAuth callback URL
 */
export interface ParseOAuthCallbackUrlParams {
  url: string
}

/**
 * Параметры для импорта из .env файла
 */
export interface ImportFromEnvParams {
  envFilePath?: string
}

/**
 * Статусы API ключа для UI
 */
export type ApiKeyStatus = "not_set" | "testing" | "invalid" | "valid"

/**
 * Типы поддерживаемых сервисов
 */
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

/**
 * Маппинг сервисов к типам credentials
 */
export interface ServiceCredentialsMap {
  openai: string
  claude: string
  grok: string
  deepseek: string
  gemini: string
  youtube: OAuthCredentials
  telegram: TelegramCredentials
  vimeo: VimeoCredentials
  facebook: OAuthCredentials
  instagram: OAuthCredentials
  tiktok: OAuthCredentials
  twitter: OAuthCredentials
}

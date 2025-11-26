/**
 * Tauri Commands для работы с API ключами
 *
 * Типизированные обёртки над invoke для всех операций с API ключами и OAuth
 */

import { invoke } from "@tauri-apps/api/core"

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

/**
 * Tauri Commands
 */

/**
 * Получить список всех API ключей с информацией
 */
export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  return await invoke<ApiKeyInfo[]>("list_api_keys")
}

/**
 * Сохранить простой API ключ
 */
export async function saveSimpleApiKey(params: SaveSimpleApiKeyParams): Promise<ApiKeyOperationResult> {
  return await invoke<ApiKeyOperationResult>("save_simple_api_key", { params })
}

/**
 * Валидировать API ключ
 */
export async function validateApiKey(keyType: string): Promise<ValidationResult> {
  return await invoke<ValidationResult>("validate_api_key", { keyType })
}

/**
 * Сохранить OAuth credentials
 */
export async function saveOAuthCredentials(params: SaveOAuthCredentialsParams): Promise<ApiKeyOperationResult> {
  return await invoke<ApiKeyOperationResult>("save_oauth_credentials", { params })
}

/**
 * Сгенерировать OAuth authorization URL
 */
export async function generateOAuthUrl(keyType: string, clientId: string, state?: string): Promise<string> {
  return await invoke<string>("generate_oauth_url", { keyType, clientId, state })
}

/**
 * Обменять authorization code на access token
 */
export async function exchangeOAuthCode(
  keyType: string,
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<ApiKeyOperationResult> {
  return await invoke<ApiKeyOperationResult>("exchange_oauth_code", {
    keyType,
    clientId,
    clientSecret,
    code,
  })
}

/**
 * Удалить API ключ
 */
export async function deleteApiKey(keyType: string): Promise<ApiKeyOperationResult> {
  return await invoke<ApiKeyOperationResult>("delete_api_key", { keyType })
}

/**
 * Импортировать API ключи из .env файла
 */
export async function importFromEnv(envFilePath?: string): Promise<ApiKeyOperationResult> {
  return await invoke<ApiKeyOperationResult>("import_from_env", { envFilePath })
}

/**
 * Экспортировать API ключи в формат .env
 */
export async function exportToEnvFormat(): Promise<string> {
  return await invoke<string>("export_to_env_format")
}

/**
 * Обновить OAuth токен используя refresh token
 */
export async function refreshOAuthToken(keyType: string): Promise<ApiKeyOperationResult> {
  return await invoke<ApiKeyOperationResult>("refresh_oauth_token", { keyType })
}

/**
 * Получить информацию о пользователе через OAuth API
 */
export async function getOAuthUserInfo(keyType: string): Promise<Record<string, unknown>> {
  return await invoke<Record<string, unknown>>("get_oauth_user_info", { keyType })
}

/**
 * Распарсить OAuth callback URL
 */
export async function parseOAuthCallbackUrl(url: string): Promise<Record<string, unknown>> {
  return await invoke<Record<string, unknown>>("parse_oauth_callback_url", { url })
}

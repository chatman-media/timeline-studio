/**
 * Паттерны валидации и маски для API ключей различных сервисов
 */

import type { SupportedService } from "../types/api-operations"

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
 * Валидация API ключа по regex паттерну
 */
export function validateApiKeyFormat(service: SupportedService, key: string): boolean {
  if (!key || key.trim().length === 0) {
    return false
  }

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
export function getValidationErrorMessage(service: SupportedService): string {
  return VALIDATION_ERROR_MESSAGES[service] || "Неверный формат API ключа"
}

/**
 * Применить маску к API ключу для безопасного отображения
 */
export function maskApiKey(service: SupportedService, key: string): string {
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
export function isOAuthService(service: SupportedService): boolean {
  return ["youtube", "vimeo", "facebook", "instagram", "tiktok", "twitter"].includes(service)
}

/**
 * Получить ссылку на документацию API для сервиса
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

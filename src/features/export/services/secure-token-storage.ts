/**
 * Secure Token Storage Service
 *
 * Обеспечивает безопасное хранение OAuth токенов с использованием
 * Tauri secure storage или зашифрованного localStorage как fallback.
 */

import { isDesktop } from "@/lib/environment"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "SecureTokenStorage" })

interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
  expiresAt?: number
}

interface EncryptedToken {
  data: string
  iv: string
  timestamp: number
}

const ENCRYPTION_KEY = "timeline-studio-oauth"
const MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 дней

/**
 * Сохраняет OAuth токен безопасным способом
 */
export async function storeToken(network: string, token: OAuthToken): Promise<void> {
  const tokenWithExpiry = {
    ...token,
    expiresAt: Date.now() + token.expiresIn * 1000,
  }

  const key = `${network}_oauth_token`

  try {
    if (isDesktop()) {
      // Используем Tauri secure storage для desktop
      await storeTauriSecure(key, tokenWithExpiry)
    } else {
      // Используем зашифрованный localStorage для web
      await storeEncrypted(key, tokenWithExpiry)
    }
  } catch (error) {
    logger.error(`Failed to store token for ${network}:`, error)
    // Fallback к обычному localStorage (не рекомендуется для продакшена)
    localStorage.setItem(key, JSON.stringify(tokenWithExpiry))
  }
}

/**
 * Получает сохраненный OAuth токен
 */
export async function getStoredToken(network: string): Promise<OAuthToken | null> {
  const key = `${network}_oauth_token`

  try {
    let token: OAuthToken | null = null

    if (isDesktop()) {
      // Читаем из Tauri secure storage
      token = await getTauriSecure(key)
    } else {
      // Читаем из зашифрованного localStorage
      token = await getEncrypted(key)
    }

    if (!token) {
      return null
    }

    // Проверяем, не истек ли токен
    if (token.expiresAt && Date.now() > token.expiresAt) {
      await removeToken(network)
      return null
    }

    return token
  } catch (error) {
    logger.error(`Failed to get token for ${network}:`, error)
    // Fallback к localStorage
    return getFromLocalStorage(key)
  }
}

/**
 * Удаляет сохраненный токен
 */
export async function removeToken(network: string): Promise<void> {
  const key = `${network}_oauth_token`

  try {
    if (isDesktop()) {
      await removeTauriSecure(key)
    } else {
      localStorage.removeItem(key)
    }

    // Также удаляем пользовательские данные
    const userKey = `${network}_user_info`
    if (isDesktop()) {
      await removeTauriSecure(userKey)
    } else {
      localStorage.removeItem(userKey)
    }
  } catch (error) {
    logger.error(`Failed to remove token for ${network}:`, error)
    // Fallback к localStorage
    localStorage.removeItem(key)
    localStorage.removeItem(`${network}_user_info`)
  }
}

/**
 * Очищает все OAuth токены
 */
export async function clearAllTokens(): Promise<void> {
  const networks = ["youtube", "tiktok", "telegram"]

  for (const network of networks) {
    await removeToken(network)
  }
}

/**
 * Сохраняет токен через Tauri secure storage
 */
async function storeTauriSecure(key: string, token: OAuthToken): Promise<void> {
  try {
    // Динамический импорт Tauri API
    const { Store } = await import("@tauri-apps/plugin-store")

    const store = await Store.load("oauth-tokens.dat")
    await store.set(key, token)
    await store.save()
  } catch (error) {
    logger.error("Tauri store not available, falling back to encrypted localStorage:", error)
    await storeEncrypted(key, token)
  }
}

/**
 * Получает токен из Tauri secure storage
 */
async function getTauriSecure(key: string): Promise<OAuthToken | null> {
  try {
    const { Store } = await import("@tauri-apps/plugin-store")

    const store = await Store.load("oauth-tokens.dat")
    const token = await store.get<OAuthToken>(key)
    return token || null
  } catch (error) {
    logger.error("Tauri store not available, falling back to encrypted localStorage:", error)
    return getEncrypted(key)
  }
}

/**
 * Удаляет токен из Tauri secure storage
 */
async function removeTauriSecure(key: string): Promise<void> {
  try {
    const { Store } = await import("@tauri-apps/plugin-store")

    const store = await Store.load("oauth-tokens.dat")
    await store.delete(key)
    await store.save()
  } catch (error) {
    logger.error("Tauri store not available:", error)
  }
}

/**
 * Сохраняет зашифрованный токен в localStorage
 */
async function storeEncrypted(key: string, token: OAuthToken): Promise<void> {
  try {
    const encrypted = await encrypt(JSON.stringify(token))
    localStorage.setItem(key, JSON.stringify(encrypted))
  } catch (error) {
    logger.error("Encryption failed, storing plain text:", error)
    localStorage.setItem(key, JSON.stringify(token))
  }
}

/**
 * Получает зашифрованный токен из localStorage
 */
async function getEncrypted(key: string): Promise<OAuthToken | null> {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Проверяем, зашифрован ли токен
    if (parsed.data && parsed.iv) {
      const decrypted = await decrypt(parsed)
      return JSON.parse(decrypted)
    }
    // Это незашифрованный токен, возвращаем как есть
    return parsed
  } catch (error) {
    logger.error("Failed to decrypt token:", error)
    return null
  }
}

/**
 * Fallback к обычному localStorage
 */
function getFromLocalStorage(key: string): OAuthToken | null {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const token = JSON.parse(stored)

    // Проверяем истечение
    if (token.expiresAt && Date.now() > token.expiresAt) {
      localStorage.removeItem(key)
      return null
    }

    return token
  } catch {
    return null
  }
}

/**
 * Шифрует данные используя Web Crypto API
 */
async function encrypt(data: string): Promise<EncryptedToken> {
  const encoder = new TextEncoder()
  const key = await getDerivedKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(data))

  return {
    data: Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    iv: Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    timestamp: Date.now(),
  }
}

/**
 * Расшифровывает данные
 */
async function decrypt(encrypted: EncryptedToken): Promise<string> {
  // Проверяем возраст зашифрованных данных
  if (Date.now() - encrypted.timestamp > MAX_AGE) {
    throw new Error("Encrypted token too old")
  }

  const key = await getDerivedKey()
  const iv = new Uint8Array(encrypted.iv.match(/.{2}/g)?.map((hex) => Number.parseInt(hex, 16)) || [])
  const data = new Uint8Array(encrypted.data.match(/.{2}/g)?.map((hex) => Number.parseInt(hex, 16)) || [])

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data)

  return new TextDecoder().decode(decrypted)
}

/**
 * Получает ключ шифрования
 */
async function getDerivedKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(ENCRYPTION_KEY), { name: "PBKDF2" }, false, [
    "deriveKey",
  ])

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("timeline-studio-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

// Для обратной совместимости
export const SecureTokenStorage = {
  storeToken,
  getStoredToken,
  removeToken,
  clearAllTokens,
}

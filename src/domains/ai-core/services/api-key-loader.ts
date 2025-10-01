import { invoke } from "@tauri-apps/api/core"

/**
 * Загрузчик API ключей из безопасного хранилища
 * Централизованное управление API ключами для всех AI провайдеров
 */
export class ApiKeyLoader {
  private static instance: ApiKeyLoader
  private keyCache = new Map<string, string>()
  private readonly CACHE_TTL = 300000 // 5 минут
  private cacheTimestamps = new Map<string, number>()

  private constructor() {}

  /**
   * Получить экземпляр загрузчика (Singleton)
   */
  public static getInstance(): ApiKeyLoader {
    if (!ApiKeyLoader.instance) {
      ApiKeyLoader.instance = new ApiKeyLoader()
    }
    return ApiKeyLoader.instance
  }

  /**
   * Получить API ключ из безопасного хранилища
   * @param keyType Тип ключа (openai, claude, deepseek, ollama, grok)
   * @returns Promise с расшифрованным ключом или null
   */
  public async getApiKey(keyType: "openai" | "claude" | "deepseek" | "ollama" | "grok"): Promise<string | null> {
    // Проверяем кэш и его актуальность
    const cached = this.keyCache.get(keyType)
    const cacheTime = this.cacheTimestamps.get(keyType)

    if (cached && cacheTime && Date.now() - cacheTime < this.CACHE_TTL) {
      return cached
    }

    try {
      // Запрашиваем ключ из backend
      const result = await invoke<string | null>("get_decrypted_api_key", {
        keyType,
      })

      if (result) {
        // Кэшируем результат
        this.keyCache.set(keyType, result)
        this.cacheTimestamps.set(keyType, Date.now())
        return result
      }

      return null
    } catch (error) {
      console.error(`Failed to get API key for ${keyType}:`, error)
      return null
    }
  }

  /**
   * Проверить наличие API ключа без получения его значения
   * @param keyType Тип ключа
   * @returns Promise<boolean>
   */
  public async hasApiKey(keyType: "openai" | "claude" | "deepseek" | "ollama" | "grok"): Promise<boolean> {
    try {
      const result = await invoke<boolean>("has_api_key", {
        keyType,
      })
      return result
    } catch (error) {
      console.error(`Failed to check API key for ${keyType}:`, error)
      return false
    }
  }

  /**
   * Получить статус всех API ключей
   * @returns Promise<Record<string, boolean>>
   */
  public async getAllKeyStatuses(): Promise<Record<string, boolean>> {
    const keyTypes: ("openai" | "claude" | "deepseek" | "ollama" | "grok")[] = [
      "openai",
      "claude",
      "deepseek",
      "ollama",
      "grok",
    ]
    const statuses: Record<string, boolean> = {}

    await Promise.all(
      keyTypes.map(async (keyType) => {
        statuses[keyType] = await this.hasApiKey(keyType)
      }),
    )

    return statuses
  }

  /**
   * Очистить кэш ключей
   */
  public clearCache(): void {
    this.keyCache.clear()
    this.cacheTimestamps.clear()
  }

  /**
   * Очистить кэш для конкретного ключа
   * @param keyType Тип ключа
   */
  public clearKeyCache(keyType: "openai" | "claude" | "deepseek" | "ollama" | "grok"): void {
    this.keyCache.delete(keyType)
    this.cacheTimestamps.delete(keyType)
  }

  /**
   * Обновить кэшированный ключ
   * @param keyType Тип ключа
   * @param value Новое значение (null для удаления из кэша)
   */
  public updateCache(keyType: "openai" | "claude" | "deepseek" | "ollama" | "grok", value: string | null): void {
    if (value) {
      this.keyCache.set(keyType, value)
      this.cacheTimestamps.set(keyType, Date.now())
    } else {
      this.clearKeyCache(keyType)
    }
  }

  /**
   * Валидация API ключа (базовая проверка формата)
   * @param keyType Тип ключа
   * @param key Ключ для валидации
   * @returns boolean
   */
  public validateKeyFormat(keyType: "openai" | "claude" | "deepseek" | "ollama" | "grok", key: string): boolean {
    if (!key || key.trim().length === 0) {
      return false
    }

    const patterns = {
      openai: /^sk-[A-Za-z0-9]{32,}$/,
      claude: /^sk-ant-[A-Za-z0-9_-]{95,}$/,
      deepseek: /^sk-[A-Za-z0-9]{32,}$/,
      ollama: /.+/, // Ollama может иметь любой формат или быть пустым для localhost
      grok: /^xai-[A-Za-z0-9]{32,}$/, // Grok использует префикс xai-
    }

    const pattern = patterns[keyType]
    return pattern.test(key)
  }

  /**
   * Получить информацию о кэше
   * @returns Статистика кэша
   */
  public getCacheInfo(): {
    size: number
    keys: string[]
    oldestEntry: number | null
    newestEntry: number | null
  } {
    const keys = Array.from(this.keyCache.keys())
    const timestamps = Array.from(this.cacheTimestamps.values())

    return {
      size: this.keyCache.size,
      keys,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    }
  }
}

// Экспорт типов для удобства
export type ApiKeyType = "openai" | "claude" | "deepseek" | "ollama" | "grok"

// Экспорт singleton instance для удобства
export const apiKeyLoader = ApiKeyLoader.getInstance()

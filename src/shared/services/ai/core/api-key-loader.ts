import { invoke } from "@tauri-apps/api/core"

/**
 * Loader for API keys from secure storage
 * Centralized management of API keys for all AI providers
 */
export class ApiKeyLoader {
  private static instance: ApiKeyLoader
  private keyCache = new Map<string, string>()
  private readonly CACHE_TTL = 300000 // 5 минут
  private cacheTimestamps = new Map<string, number>()

  private constructor() {}

  /**
   * Checks if the code is running inside a Tauri WebView (and not in an SSR/browser)
   */
  private static isTauriEnvironment(): boolean {
    return typeof window !== "undefined" && "__TAURI__" in window
  }

  /**
   * Get an instance of the loader (Singleton)
   */
  public static getInstance(): ApiKeyLoader {
    if (!ApiKeyLoader.instance) {
      ApiKeyLoader.instance = new ApiKeyLoader()
    }
    return ApiKeyLoader.instance
  }

  /**
   * Retrieve an API key from secure storage
   * @param keyType Type of key (openai, claude, deepseek, ollama)
   * @returns Promise with the decrypted key or null
   */

  public async getApiKey(keyType: "openai" | "claude" | "deepseek" | "ollama"): Promise<string | null> {
    // Check cache and its validity
    const cached = this.keyCache.get(keyType)
    const cacheTime = this.cacheTimestamps.get(keyType)

    if (cached && cacheTime && Date.now() - cacheTime < this.CACHE_TTL) {
      return cached
    }

    try {
      // Do not call the Tauri API outside the Tauri environment (SSR/browser)
      if (!ApiKeyLoader.isTauriEnvironment()) {
        return null
      }
      // Request the key from the backend
      const result = await invoke<string | null>("get_decrypted_api_key", {
        key_type: keyType,
      })

      if (result) {
        // Cache the result
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
   * Check if an API key exists without retrieving its value
   * @param keyType Type of key
   * @returns Promise<boolean>
   */
  public async hasApiKey(keyType: "openai" | "claude" | "deepseek" | "ollama"): Promise<boolean> {
    try {
      // Do not call the Tauri API outside the Tauri environment (SSR/browser)
      if (!ApiKeyLoader.isTauriEnvironment()) {
        return false
      }
      const result = await invoke<boolean>("has_api_key", {
        key_type: keyType,
      })
      return result
    } catch (error) {
      console.error(`Failed to check API key for ${keyType}:`, error)
      return false
    }
  }

  /**
   * Get the status of all API keys
   * @returns Promise<Record<string, boolean>>
   */
  public async getAllKeyStatuses(): Promise<Record<string, boolean>> {
    const keyTypes: ("openai" | "claude" | "deepseek" | "ollama")[] = ["openai", "claude", "deepseek", "ollama"]
    const statuses: Record<string, boolean> = {}

    await Promise.all(
      keyTypes.map(async (keyType) => {
        statuses[keyType] = await this.hasApiKey(keyType)
      }),
    )

    return statuses
  }

  /**
   * Clear the entire key cache
   */
  public clearCache(): void {
    this.keyCache.clear()
    this.cacheTimestamps.clear()
  }

  /**
   * Clear cache for a specific key
   * @param keyType Type of key
   */
  public clearKeyCache(keyType: "openai" | "claude" | "deepseek" | "ollama"): void {
    this.keyCache.delete(keyType)
    this.cacheTimestamps.delete(keyType)
  }

  /**
   * Update the cached key
   * @param keyType Type of key
   * @param value New value (null to remove from cache)
   */
  public updateCache(keyType: "openai" | "claude" | "deepseek" | "ollama", value: string | null): void {
    if (value) {
      this.keyCache.set(keyType, value)
      this.cacheTimestamps.set(keyType, Date.now())
    } else {
      this.clearKeyCache(keyType)
    }
  }

  /**
   * Validate API key format (basic format check)
   * @param keyType Type of key
   * @param key Key to validate
   * @returns boolean
   */
  public validateKeyFormat(keyType: "openai" | "claude" | "deepseek" | "ollama", key: string): boolean {
    if (!key || key.trim().length === 0) {
      return false
    }

    const patterns = {
      openai: /^sk-[A-Za-z0-9]{32,}$/,
      claude: /^sk-ant-[A-Za-z0-9_-]{95,}$/,
      deepseek: /^sk-[A-Za-z0-9]{32,}$/,
      ollama: /.+/, // Ollama может иметь любой формат или быть пустым для localhost
    }

    const pattern = patterns[keyType]
    return pattern.test(key)
  }

  /**
   * Get cache information
   * @returns Cache statistics
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

// Export types for convenience
export type ApiKeyType = "openai" | "claude" | "deepseek" | "ollama"

// Export singleton instance for convenience
export const apiKeyLoader = ApiKeyLoader.getInstance()

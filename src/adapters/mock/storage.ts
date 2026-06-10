/**
 * Mock Storage Adapter
 *
 * Реализация IStorageService для тестов и разработки в браузере.
 * Использует in-memory Map или localStorage.
 */

import type { IStorageService } from "@timeline-studio/core/ports"

export class MockStorageService implements IStorageService {
  private _data = new Map<string, unknown>()
  private _useLocalStorage: boolean

  constructor(useLocalStorage = false) {
    this._useLocalStorage = useLocalStorage && typeof localStorage !== "undefined"
  }

  async get<T>(key: string): Promise<T | null> {
    if (this._useLocalStorage) {
      const value = localStorage.getItem(key)
      return value ? (JSON.parse(value) as T) : null
    }
    return (this._data.get(key) as T) ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this._useLocalStorage) {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      this._data.set(key, value)
    }
  }

  async delete(key: string): Promise<void> {
    if (this._useLocalStorage) {
      localStorage.removeItem(key)
    } else {
      this._data.delete(key)
    }
  }

  async has(key: string): Promise<boolean> {
    if (this._useLocalStorage) {
      return localStorage.getItem(key) !== null
    }
    return this._data.has(key)
  }

  async keys(): Promise<string[]> {
    if (this._useLocalStorage) {
      return Object.keys(localStorage)
    }
    return Array.from(this._data.keys())
  }

  async clear(): Promise<void> {
    if (this._useLocalStorage) {
      localStorage.clear()
    } else {
      this._data.clear()
    }
  }

  // === Test Helpers ===

  /**
   * Get all data as object (for testing)
   */
  getAll(): Record<string, unknown> {
    if (this._useLocalStorage) {
      const result: Record<string, unknown> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          result[key] = value ? JSON.parse(value) : null
        }
      }
      return result
    }
    return Object.fromEntries(this._data)
  }

  /**
   * Set multiple values at once (for testing)
   */
  setData(data: Record<string, unknown>): void {
    if (this._useLocalStorage) {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value))
      })
    } else {
      this._data.clear()
      Object.entries(data).forEach(([key, value]) => {
        this._data.set(key, value)
      })
    }
  }

  /**
   * Reset storage (for testing)
   */
  reset(): void {
    if (this._useLocalStorage) {
      localStorage.clear()
    } else {
      this._data.clear()
    }
  }
}

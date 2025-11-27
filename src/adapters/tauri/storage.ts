/**
 * Tauri Storage Adapter
 *
 * Реализация IStorageService для Tauri.
 * Использует Tauri Store плагин для персистентного хранилища.
 */

import type { IStorageService } from "@/core/ports"

type TauriStore = {
  get<T>(key: string): Promise<T | null | undefined>
  set(key: string, value: unknown): Promise<void>
  delete(key: string): Promise<boolean>
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
  clear(): Promise<void>
  save(): Promise<void>
}

export class TauriStorageService implements IStorageService {
  private store: TauriStore | null = null
  private storeName: string
  private initPromise: Promise<void> | null = null

  constructor(storeName = "settings.json") {
    this.storeName = storeName
  }

  /**
   * Lazy initialization of the store
   */
  private async ensureStore(): Promise<TauriStore> {
    if (this.store) {
      return this.store
    }

    if (this.initPromise) {
      await this.initPromise
      return this.store!
    }

    this.initPromise = this.initStore()
    await this.initPromise
    return this.store!
  }

  private async initStore(): Promise<void> {
    const { load } = await import("@tauri-apps/plugin-store")
    this.store = await load(this.storeName)
  }

  async get<T>(key: string): Promise<T | null> {
    const store = await this.ensureStore()
    const value = await store.get<T>(key)
    return value ?? null
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = await this.ensureStore()
    await store.set(key, value)
    await store.save()
  }

  async delete(key: string): Promise<void> {
    const store = await this.ensureStore()
    await store.delete(key)
    await store.save()
  }

  async has(key: string): Promise<boolean> {
    const store = await this.ensureStore()
    return store.has(key)
  }

  async keys(): Promise<string[]> {
    const store = await this.ensureStore()
    return store.keys()
  }

  async clear(): Promise<void> {
    const store = await this.ensureStore()
    await store.clear()
    await store.save()
  }
}

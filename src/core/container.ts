/**
 * Service Container (Dependency Injection)
 *
 * Централизованное управление зависимостями.
 * Позволяет подменять реализации для разных окружений (Tauri, Mock, HTTP).
 */

import type { IBackendService, IEventService, IMediaService, IPlatformService, IStorageService } from "./ports"

class ServiceContainer {
  private static instance: ServiceContainer | null = null

  private _backend: IBackendService | null = null
  private _platform: IPlatformService | null = null
  private _storage: IStorageService | null = null
  private _event: IEventService | null = null
  private _media: IMediaService | null = null

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  /**
   * Сброс контейнера (для тестов)
   */
  static reset(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance._backend = null
      ServiceContainer.instance._platform = null
      ServiceContainer.instance._storage = null
      ServiceContainer.instance._event = null
      ServiceContainer.instance._media = null
    }
  }

  // === Backend Service ===

  registerBackend(backend: IBackendService): void {
    this._backend = backend
  }

  getBackend(): IBackendService {
    if (!this._backend) {
      throw new Error(
        "[ServiceContainer] Backend not registered. Call registerBackend() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._backend
  }

  hasBackend(): boolean {
    return this._backend !== null
  }

  // === Platform Service ===

  registerPlatform(platform: IPlatformService): void {
    this._platform = platform
  }

  getPlatform(): IPlatformService {
    if (!this._platform) {
      throw new Error(
        "[ServiceContainer] Platform not registered. Call registerPlatform() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._platform
  }

  hasPlatform(): boolean {
    return this._platform !== null
  }

  // === Storage Service ===

  registerStorage(storage: IStorageService): void {
    this._storage = storage
  }

  getStorage(): IStorageService {
    if (!this._storage) {
      throw new Error(
        "[ServiceContainer] Storage not registered. Call registerStorage() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._storage
  }

  hasStorage(): boolean {
    return this._storage !== null
  }

  // === Event Service ===

  registerEvent(event: IEventService): void {
    this._event = event
  }

  getEvent(): IEventService {
    if (!this._event) {
      throw new Error(
        "[ServiceContainer] Event not registered. Call registerEvent() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._event
  }

  hasEvent(): boolean {
    return this._event !== null
  }

  // === Media Service ===

  registerMedia(media: IMediaService): void {
    this._media = media
  }

  getMedia(): IMediaService {
    if (!this._media) {
      throw new Error(
        "[ServiceContainer] Media not registered. Call registerMedia() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._media
  }

  hasMedia(): boolean {
    return this._media !== null
  }
}

// Singleton instance
export const container = ServiceContainer.getInstance()

// Convenience helpers
export const getBackend = (): IBackendService => container.getBackend()
export const getPlatform = (): IPlatformService => container.getPlatform()
export const getStorage = (): IStorageService => container.getStorage()
export const getEvent = (): IEventService => container.getEvent()
export const getMedia = (): IMediaService => container.getMedia()

// For testing
export const resetContainer = (): void => ServiceContainer.reset()

/**
 * Service Container (Dependency Injection)
 *
 * Централизованное управление зависимостями.
 * Позволяет подменять реализации для разных окружений (Tauri, Mock, HTTP).
 */

import type {
  IAIService,
  IBackendService,
  IEnhancedSubtitleAutomationService,
  IEventService,
  ILanguageService,
  IMediaService,
  INodeBackendService,
  IPlatformService,
  IStorageService,
  ITranscriptionService,
  IVideoService,
} from "./ports"

class ServiceContainer {
  private static instance: ServiceContainer | null = null

  private _backend: IBackendService | null = null
  private _platform: IPlatformService | null = null
  private _storage: IStorageService | null = null
  private _event: IEventService | null = null
  private _media: IMediaService | null = null
  private _nodeBackend: INodeBackendService | null = null
  private _video: IVideoService | null = null
  private _ai: IAIService | null = null
  private _language: ILanguageService | null = null
  private _transcription: ITranscriptionService | null = null
  private _enhancedSubtitleAutomation: IEnhancedSubtitleAutomationService | null = null

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
      ServiceContainer.instance._nodeBackend = null
      ServiceContainer.instance._video = null
      ServiceContainer.instance._ai = null
      ServiceContainer.instance._language = null
      ServiceContainer.instance._transcription = null
      ServiceContainer.instance._enhancedSubtitleAutomation = null
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

  // === Node Backend Service ===

  registerNodeBackend(nodeBackend: INodeBackendService): void {
    this._nodeBackend = nodeBackend
  }

  getNodeBackend(): INodeBackendService {
    if (!this._nodeBackend) {
      throw new Error(
        "[ServiceContainer] Node backend not registered. Call registerNodeBackend() first or use initHttpApp()/initMockApp().",
      )
    }
    return this._nodeBackend
  }

  hasNodeBackend(): boolean {
    return this._nodeBackend !== null
  }

  // === Video Service ===

  registerVideo(video: IVideoService): void {
    this._video = video
  }

  getVideo(): IVideoService {
    if (!this._video) {
      throw new Error(
        "[ServiceContainer] Video not registered. Call registerVideo() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._video
  }

  hasVideo(): boolean {
    return this._video !== null
  }

  // === AI Service ===

  registerAI(ai: IAIService): void {
    this._ai = ai
  }

  getAI(): IAIService {
    if (!this._ai) {
      throw new Error(
        "[ServiceContainer] AI not registered. Call registerAI() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._ai
  }

  hasAI(): boolean {
    return this._ai !== null
  }

  // === Language Service ===

  registerLanguage(language: ILanguageService): void {
    this._language = language
  }

  getLanguage(): ILanguageService {
    if (!this._language) {
      throw new Error(
        "[ServiceContainer] Language service not registered. Call registerLanguage() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._language
  }

  hasLanguage(): boolean {
    return this._language !== null
  }

  // === Transcription Service ===

  registerTranscription(transcription: ITranscriptionService): void {
    this._transcription = transcription
  }

  getTranscription(): ITranscriptionService {
    if (!this._transcription) {
      throw new Error(
        "[ServiceContainer] Transcription service not registered. Call registerTranscription() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._transcription
  }

  hasTranscription(): boolean {
    return this._transcription !== null
  }

  // === Enhanced Subtitle Automation Service ===

  registerEnhancedSubtitleAutomation(enhancedSubtitleAutomation: IEnhancedSubtitleAutomationService): void {
    this._enhancedSubtitleAutomation = enhancedSubtitleAutomation
  }

  getEnhancedSubtitleAutomation(): IEnhancedSubtitleAutomationService {
    if (!this._enhancedSubtitleAutomation) {
      throw new Error(
        "[ServiceContainer] Enhanced subtitle automation service not registered. Call registerEnhancedSubtitleAutomation() first or use initTauriApp()/initMockApp().",
      )
    }
    return this._enhancedSubtitleAutomation
  }

  hasEnhancedSubtitleAutomation(): boolean {
    return this._enhancedSubtitleAutomation !== null
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
export const getNodeBackend = (): INodeBackendService => container.getNodeBackend()
export const getVideo = (): IVideoService => container.getVideo()
export const getAI = (): IAIService => container.getAI()
export const getLanguage = (): ILanguageService => container.getLanguage()
export const getTranscription = (): ITranscriptionService => container.getTranscription()
export const getEnhancedSubtitleAutomation = (): IEnhancedSubtitleAutomationService =>
  container.getEnhancedSubtitleAutomation()

// For testing
export const resetContainer = (): void => ServiceContainer.reset()

/**
 * Tauri Adapters
 *
 * Реализации сервисов для Tauri платформы.
 * Экспортирует функцию инициализации для регистрации всех адаптеров в контейнере.
 */

import { container } from "@/core/container"

import { TauriAIService } from "./ai"
import { TauriBackendService } from "./backend"
import { TauriEnhancedSubtitleAutomationService } from "./enhanced-subtitle-automation"
import { TauriEventService } from "./event"
import { TauriLanguageService } from "./language"
import { TauriMediaService } from "./media"
import { TauriNodeBackendService } from "./node-backend"
import { TauriPlatformService } from "./platform"
import { TauriStorageService } from "./storage"
import { TauriTranscriptionService } from "./transcription"
import { TauriUpdateService } from "./update-service"
import { TauriUserSettingsService } from "./user-settings"
import { TauriVideoService } from "./video"

export { TauriAIService } from "./ai"
export { TauriBackendService } from "./backend"
export { TauriEnhancedSubtitleAutomationService } from "./enhanced-subtitle-automation"
export type { EventHandler, StateChangeHandler } from "./backend-sync"
// Re-export BackendSync for backwards compatibility
export { BackendSync, getBackendSync } from "./backend-sync"
export { TauriEventService } from "./event"
export { TauriLanguageService } from "./language"
export { TauriMediaService } from "./media"
export { TauriNodeBackendService } from "./node-backend"
export { TauriPlatformService } from "./platform"
export { TauriStorageService } from "./storage"
export { TauriTranscriptionService } from "./transcription"
export { TauriUpdateService } from "./update-service"
export { TauriUserSettingsService } from "./user-settings"
export { TauriVideoService } from "./video"

/**
 * Инициализация приложения с Tauri адаптерами.
 * Регистрирует все сервисы в DI контейнере.
 *
 * @param options Опции инициализации
 * @param options.storeName Имя файла для хранилища (по умолчанию "settings.json")
 * @param options.autoConnect Автоматически подключаться к бэкенду (по умолчанию true)
 */
export async function initTauriApp(options: { storeName?: string; autoConnect?: boolean } = {}): Promise<void> {
  const { storeName = "settings.json", autoConnect = true } = options

  // Register services
  const backend = new TauriBackendService()
  const platform = new TauriPlatformService()
  const storage = new TauriStorageService(storeName)
  const event = new TauriEventService()
  const media = new TauriMediaService()
  const nodeBackend = new TauriNodeBackendService()
  const video = new TauriVideoService()
  const ai = new TauriAIService()
  const language = new TauriLanguageService()
  const transcription = new TauriTranscriptionService()
  const enhancedSubtitleAutomation = new TauriEnhancedSubtitleAutomationService()
  const update = new TauriUpdateService()
  const userSettings = new TauriUserSettingsService()

  container.registerBackend(backend)
  container.registerPlatform(platform)
  container.registerStorage(storage)
  container.registerEvent(event)
  container.registerMedia(media)
  container.registerNodeBackend(nodeBackend)
  container.registerVideo(video)
  container.registerAI(ai)
  container.registerLanguage(language)
  container.registerTranscription(transcription)
  container.registerEnhancedSubtitleAutomation(enhancedSubtitleAutomation)
  container.registerUpdate(update)
  container.registerUserSettings(userSettings)

  // Auto-connect to backend if requested
  if (autoConnect) {
    await backend.connect()
  }
}

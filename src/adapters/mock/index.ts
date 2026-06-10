/**
 * Mock Adapters
 *
 * Реализации сервисов для тестов и разработки в браузере.
 * Экспортирует функцию инициализации для регистрации всех адаптеров в контейнере.
 */

import { container } from "@/core/container"
import { MockAIService } from "./ai"
import { MockAIProjectEditor } from "./ai-project-editor"
import { MockBackendService } from "./backend"
import { MockEnhancedSubtitleAutomationAdapter } from "./enhanced-subtitle-automation"
import { MockEventService } from "./event"
import { MockLanguageService } from "./language"
import { MockMediaService } from "./media"
import { MockNodeBackendService } from "./node-backend"
import { MockPlatformService } from "./platform"
import { MockStorageService } from "./storage"
import { MockTranscriptionAdapter } from "./transcription"
import { MockUpdateService } from "./update-service"
import { MockVideoService } from "./video"

export { MockAIService } from "./ai"
export { MockAIProjectEditor, type MockAIProjectEditorOptions } from "./ai-project-editor"
export { MockBackendService } from "./backend"
export { MockEnhancedSubtitleAutomationAdapter } from "./enhanced-subtitle-automation"
export { MockEventService } from "./event"
export { MockLanguageService } from "./language"
export { MockMediaService } from "./media"
export { MockNodeBackendService } from "./node-backend"
export { MockPlatformService } from "./platform"
export { MockStorageService } from "./storage"
export { MockTranscriptionAdapter } from "./transcription"
export { MockUpdateService } from "./update-service"
export { MockVideoService } from "./video"

/**
 * Инициализация приложения с Mock адаптерами.
 * Используется для тестов и разработки в браузере.
 *
 * @param options Опции инициализации
 * @param options.useLocalStorage Использовать localStorage вместо in-memory (по умолчанию false)
 * @returns Объект с сервисами для тестовых манипуляций
 */
export function initMockApp(options: { useLocalStorage?: boolean } = {}): {
  backend: MockBackendService
  platform: MockPlatformService
  storage: MockStorageService
  event: MockEventService
  media: MockMediaService
  nodeBackend: MockNodeBackendService
  video: MockVideoService
  ai: MockAIService
  aiProjectEditor: MockAIProjectEditor
  language: MockLanguageService
  transcription: MockTranscriptionAdapter
  enhancedSubtitleAutomation: MockEnhancedSubtitleAutomationAdapter
  update: MockUpdateService
} {
  const { useLocalStorage = false } = options

  // Create mock services
  const backend = new MockBackendService()
  const platform = new MockPlatformService()
  const storage = new MockStorageService(useLocalStorage)
  const event = new MockEventService()
  const media = new MockMediaService()
  const nodeBackend = new MockNodeBackendService()
  const video = new MockVideoService()
  const ai = new MockAIService()
  const aiProjectEditor = new MockAIProjectEditor()
  const language = new MockLanguageService()
  const transcription = new MockTranscriptionAdapter()
  const enhancedSubtitleAutomation = new MockEnhancedSubtitleAutomationAdapter()
  const update = new MockUpdateService()

  // Register in container
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

  // Return services for test manipulation
  return {
    backend,
    platform,
    storage,
    event,
    media,
    nodeBackend,
    video,
    ai,
    aiProjectEditor,
    language,
    transcription,
    enhancedSubtitleAutomation,
    update,
  }
}

/**
 * Создание изолированных моков без регистрации в контейнере.
 * Полезно для unit-тестов отдельных компонентов.
 */
export function createMockServices(options: { useLocalStorage?: boolean } = {}): {
  backend: MockBackendService
  platform: MockPlatformService
  storage: MockStorageService
  event: MockEventService
  media: MockMediaService
  nodeBackend: MockNodeBackendService
  video: MockVideoService
  ai: MockAIService
  aiProjectEditor: MockAIProjectEditor
  language: MockLanguageService
  transcription: MockTranscriptionAdapter
  enhancedSubtitleAutomation: MockEnhancedSubtitleAutomationAdapter
  update: MockUpdateService
} {
  const { useLocalStorage = false } = options

  return {
    backend: new MockBackendService(),
    platform: new MockPlatformService(),
    storage: new MockStorageService(useLocalStorage),
    event: new MockEventService(),
    media: new MockMediaService(),
    nodeBackend: new MockNodeBackendService(),
    video: new MockVideoService(),
    ai: new MockAIService(),
    aiProjectEditor: new MockAIProjectEditor(),
    language: new MockLanguageService(),
    transcription: new MockTranscriptionAdapter(),
    enhancedSubtitleAutomation: new MockEnhancedSubtitleAutomationAdapter(),
    update: new MockUpdateService(),
  }
}

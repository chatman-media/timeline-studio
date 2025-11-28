/**
 * Mock Adapters
 *
 * Реализации сервисов для тестов и разработки в браузере.
 * Экспортирует функцию инициализации для регистрации всех адаптеров в контейнере.
 */

import { container } from "@/core/container"

import { MockAIService } from "./ai"
import { MockBackendService } from "./backend"
import { MockEventService } from "./event"
import { MockMediaService } from "./media"
import { MockPlatformService } from "./platform"
import { MockStorageService } from "./storage"
import { MockVideoService } from "./video"

export { MockAIService } from "./ai"
export { MockBackendService } from "./backend"
export { MockEventService } from "./event"
export { MockMediaService } from "./media"
export { MockPlatformService } from "./platform"
export { MockStorageService } from "./storage"
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
  video: MockVideoService
  ai: MockAIService
} {
  const { useLocalStorage = false } = options

  // Create mock services
  const backend = new MockBackendService()
  const platform = new MockPlatformService()
  const storage = new MockStorageService(useLocalStorage)
  const event = new MockEventService()
  const media = new MockMediaService()
  const video = new MockVideoService()
  const ai = new MockAIService()

  // Register in container
  container.registerBackend(backend)
  container.registerPlatform(platform)
  container.registerStorage(storage)
  container.registerEvent(event)
  container.registerMedia(media)
  container.registerVideo(video)
  container.registerAI(ai)

  // Return services for test manipulation
  return { backend, platform, storage, event, media, video, ai }
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
  video: MockVideoService
  ai: MockAIService
} {
  const { useLocalStorage = false } = options

  return {
    backend: new MockBackendService(),
    platform: new MockPlatformService(),
    storage: new MockStorageService(useLocalStorage),
    event: new MockEventService(),
    media: new MockMediaService(),
    video: new MockVideoService(),
    ai: new MockAIService(),
  }
}

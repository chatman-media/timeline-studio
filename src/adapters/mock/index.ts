/**
 * Mock Adapters
 *
 * Реализации сервисов для тестов и разработки в браузере.
 * Экспортирует функцию инициализации для регистрации всех адаптеров в контейнере.
 */

import { container } from "@/core/container"

import { MockBackendService } from "./backend"
import { MockPlatformService } from "./platform"
import { MockStorageService } from "./storage"

export { MockBackendService } from "./backend"
export { MockPlatformService } from "./platform"
export { MockStorageService } from "./storage"

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
} {
  const { useLocalStorage = false } = options

  // Create mock services
  const backend = new MockBackendService()
  const platform = new MockPlatformService()
  const storage = new MockStorageService(useLocalStorage)

  // Register in container
  container.registerBackend(backend)
  container.registerPlatform(platform)
  container.registerStorage(storage)

  // Return services for test manipulation
  return { backend, platform, storage }
}

/**
 * Создание изолированных моков без регистрации в контейнере.
 * Полезно для unit-тестов отдельных компонентов.
 */
export function createMockServices(options: { useLocalStorage?: boolean } = {}): {
  backend: MockBackendService
  platform: MockPlatformService
  storage: MockStorageService
} {
  const { useLocalStorage = false } = options

  return {
    backend: new MockBackendService(),
    platform: new MockPlatformService(),
    storage: new MockStorageService(useLocalStorage),
  }
}

/**
 * Adapters Module
 *
 * Реализации портов для различных платформ.
 *
 * Использование:
 *
 * ```typescript
 * // Для React приложения (автоматически выбирает адаптеры)
 * import { AppInitProvider } from "@/adapters"
 * <AppInitProvider>{children}</AppInitProvider>
 *
 * // Для Tauri приложения (ручная инициализация)
 * import { initTauriApp } from "@/adapters/tauri"
 * await initTauriApp()
 *
 * // Для тестов
 * import { initMockApp } from "@/adapters/mock"
 * const { backend, platform, storage, media } = initMockApp()
 *
 * // Для Node.js CLI
 * import { initNodeApp } from "@/adapters/node"
 * const { media } = initNodeApp()
 *
 * // Далее используйте container для доступа к сервисам
 * import { getBackend, getPlatform, getStorage, getMedia } from "@/core"
 * const state = await getBackend().getProjectState()
 * const metadata = await getMedia().getMetadata(filePath)
 * ```
 */

// Mock adapters
export {
  createMockServices,
  initMockApp,
  MockBackendService,
  MockMediaService,
  MockPlatformService,
  MockStorageService,
} from "./mock"

// Node.js adapters
export { initNodeApp, NodeMediaService } from "./node"

// React provider (main entry point for apps)
export { AppInitProvider, useAppInit, useAppReady } from "./react"

// Tauri adapters
export {
  initTauriApp,
  TauriBackendService,
  TauriMediaService,
  TauriPlatformService,
  TauriStorageService,
} from "./tauri"

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
 * const { backend, platform, storage } = initMockApp()
 *
 * // Далее используйте container для доступа к сервисам
 * import { getBackend, getPlatform, getStorage } from "@/core"
 * const state = await getBackend().getProjectState()
 * ```
 */

// Mock adapters
export { createMockServices, initMockApp, MockBackendService, MockPlatformService, MockStorageService } from "./mock"
// React provider (main entry point for apps)
export { AppInitProvider, useAppInit, useAppReady } from "./react"

// Tauri adapters
export { initTauriApp, TauriBackendService, TauriPlatformService, TauriStorageService } from "./tauri"

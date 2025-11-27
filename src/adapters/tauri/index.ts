/**
 * Tauri Adapters
 *
 * Реализации сервисов для Tauri платформы.
 * Экспортирует функцию инициализации для регистрации всех адаптеров в контейнере.
 */

import { container } from "@/core/container"

import { TauriBackendService } from "./backend"
import { TauriPlatformService } from "./platform"
import { TauriStorageService } from "./storage"

export { TauriBackendService } from "./backend"
export type { EventHandler, StateChangeHandler } from "./backend-sync"
// Re-export BackendSync for backwards compatibility
export { BackendSync, getBackendSync } from "./backend-sync"
export { TauriPlatformService } from "./platform"
export { TauriStorageService } from "./storage"

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

  container.registerBackend(backend)
  container.registerPlatform(platform)
  container.registerStorage(storage)

  // Auto-connect to backend if requested
  if (autoConnect) {
    await backend.connect()
  }
}

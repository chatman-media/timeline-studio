/**
 * HTTP Adapters
 *
 * Реализации сервисов через HTTP для подключения к src-node серверу.
 * Используется для web-версии приложения или удалённого управления.
 *
 * @example
 * ```typescript
 * import { initHttpApp } from "@/adapters/http"
 *
 * const services = await initHttpApp({
 *   serverUrl: "http://localhost:3001",
 * })
 *
 * // Использование
 * const state = await services.backend.getProjectState()
 * ```
 */

import { MockPlatformService, MockStorageService } from "@/adapters/mock"
import { container } from "@/core/container"

import { type HttpBackendOptions, HttpBackendService } from "./backend"
import { HttpClient } from "./client"
import { HttpMediaService } from "./media"

// Re-exports
export { type HttpBackendOptions, HttpBackendService } from "./backend"
export { HttpClient, type HttpClientOptions } from "./client"
export { HttpMediaService } from "./media"

export interface HttpAppOptions {
  /** URL сервера */
  serverUrl?: string
  /** Опции для Backend сервиса */
  backend?: HttpBackendOptions
  /** Автоматически подключаться к серверу */
  autoConnect?: boolean
}

export interface HttpAppServices {
  backend: HttpBackendService
  media: HttpMediaService
  client: HttpClient
}

/**
 * Инициализация приложения с HTTP адаптерами.
 * Подключается к src-node серверу через tRPC.
 */
export async function initHttpApp(options: HttpAppOptions = {}): Promise<HttpAppServices> {
  const { serverUrl = "http://localhost:3001", autoConnect = true } = options

  const client = new HttpClient({ baseUrl: serverUrl })
  const backend = new HttpBackendService({ serverUrl, ...options.backend })
  const media = new HttpMediaService()

  container.registerBackend(backend)
  container.registerMedia(media)
  // src-node doesn't provide storage/platform — use in-memory mocks so the container is complete
  if (!container.hasStorage()) container.registerStorage(new MockStorageService(true))
  if (!container.hasPlatform()) container.registerPlatform(new MockPlatformService())

  if (autoConnect) {
    // Don't throw on connection failure — src-node may not be running yet
    try {
      await backend.connect()
    } catch {
      console.warn("HttpBackendService: could not connect to src-node, continuing without it")
    }
  }

  return { backend, media, client }
}

/**
 * Создание изолированных HTTP сервисов без регистрации в контейнере.
 */
export function createHttpServices(options: HttpAppOptions = {}): HttpAppServices {
  const serverUrl = options.serverUrl || "http://localhost:3001"

  return {
    backend: new HttpBackendService({ serverUrl, ...options.backend }),
    media: new HttpMediaService(),
    client: new HttpClient({ baseUrl: serverUrl }),
  }
}

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

import { container } from "@/core/container"

import { type HttpBackendOptions, HttpBackendService } from "./backend"
import { type HttpClientOptions, HttpClient } from "./client"

// Re-exports
export { type HttpBackendOptions, HttpBackendService } from "./backend"
export { type HttpClientOptions, HttpClient } from "./client"

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
  client: HttpClient
}

/**
 * Инициализация приложения с HTTP адаптерами.
 * Подключается к src-node серверу через HTTP.
 *
 * @param options Опции инициализации
 * @returns Объект со всеми сервисами
 */
export async function initHttpApp(options: HttpAppOptions = {}): Promise<HttpAppServices> {
  const {
    serverUrl = "http://localhost:3001",
    autoConnect = true,
  } = options

  // Create HTTP client
  const client = new HttpClient({
    baseUrl: serverUrl,
  })

  // Create backend service
  const backend = new HttpBackendService({
    serverUrl,
    ...options.backend,
  })

  // Register in container
  container.registerBackend(backend)

  // Auto-connect if requested
  if (autoConnect) {
    await backend.connect()
  }

  return {
    backend,
    client,
  }
}

/**
 * Создание изолированных HTTP сервисов без регистрации в контейнере.
 */
export function createHttpServices(options: HttpAppOptions = {}): HttpAppServices {
  const serverUrl = options.serverUrl || "http://localhost:3001"

  return {
    backend: new HttpBackendService({
      serverUrl,
      ...options.backend,
    }),
    client: new HttpClient({
      baseUrl: serverUrl,
    }),
  }
}

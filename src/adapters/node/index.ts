/**
 * Node.js Adapters
 *
 * Реализации сервисов для Node.js окружения (CLI, серверы, Electron).
 * Использует нативные Node.js модули и CLI инструменты (ffmpeg, whisper).
 */

import { container } from "@/core/container"

import { type NodeAIOptions, NodeAIService } from "./ai"
import { type NodeBackendOptions, NodeBackendService } from "./backend"
import { NodeEventService } from "./event"
import { type NodeLanguageOptions, NodeLanguageService } from "./language"
import { type NodeMediaOptions, NodeMediaService } from "./media"
import { NodeBackendBridgeService } from "./node-backend-bridge"
import { type NodePlatformOptions, NodePlatformService } from "./platform"
import { NodeRenderJobService, type NodeRenderJobServiceOptions } from "./render-job"
import { type NodeStorageOptions, NodeStorageService } from "./storage"
import { type NodeVideoOptions, NodeVideoService } from "./video"

// Re-exports
export { type NodeAIOptions, NodeAIService } from "./ai"
export { type NodeBackendOptions, NodeBackendService } from "./backend"
export { NodeEventService } from "./event"
export { type NodeLanguageOptions, NodeLanguageService } from "./language"
export { type NodeMediaOptions, NodeMediaService } from "./media"
export { NodeBackendBridgeService } from "./node-backend-bridge"
export { type NodePlatformOptions, NodePlatformService } from "./platform"
export { NodeRenderJobService, type NodeRenderJobServiceOptions } from "./render-job"
export { type NodeStorageOptions, NodeStorageService } from "./storage"
export { type NodeVideoOptions, NodeVideoService } from "./video"

export interface NodeAppOptions {
  /** Опции для Storage сервиса */
  storage?: NodeStorageOptions
  /** Опции для Platform сервиса */
  platform?: NodePlatformOptions
  /** Опции для Media сервиса */
  media?: NodeMediaOptions
  /** Опции для Video сервиса */
  video?: NodeVideoOptions
  /** Опции для AI сервиса */
  ai?: NodeAIOptions
  /** Опции для Backend сервиса */
  backend?: NodeBackendOptions
  /** Опции для Language сервиса */
  language?: NodeLanguageOptions
  /** Опции для bot-first RenderJob сервиса */
  renderJob?: NodeRenderJobServiceOptions
  /** Автоматически подключаться к бэкенду */
  autoConnect?: boolean
}

export interface NodeAppServices {
  backend: NodeBackendService
  platform: NodePlatformService
  storage: NodeStorageService
  event: NodeEventService
  media: NodeMediaService
  nodeBackend: NodeBackendBridgeService
  video: NodeVideoService
  ai: NodeAIService
  language: NodeLanguageService
  renderJob: NodeRenderJobService
}

/**
 * Инициализация приложения с Node.js адаптерами.
 * Используется для CLI инструментов, серверного окружения и Electron.
 *
 * @param options Опции инициализации
 * @returns Объект со всеми сервисами для программного доступа
 *
 * @example
 * ```typescript
 * import { initNodeApp } from "@/adapters/node"
 *
 * const services = await initNodeApp({
 *   ai: { openaiApiKey: process.env.OPENAI_API_KEY },
 *   autoConnect: true,
 * })
 *
 * // Использование сервисов
 * const metadata = await services.media.getMetadata("/path/to/video.mp4")
 * ```
 */
export async function initNodeApp(options: NodeAppOptions = {}): Promise<NodeAppServices> {
  const { autoConnect = true } = options

  // Create services
  const backend = new NodeBackendService(options.backend)
  const platform = new NodePlatformService(options.platform)
  const storage = new NodeStorageService(options.storage)
  const event = new NodeEventService()
  const media = new NodeMediaService(options.media)
  const nodeBackend = new NodeBackendBridgeService()
  const video = new NodeVideoService(options.video)
  const ai = new NodeAIService(options.ai)
  const language = new NodeLanguageService(options.language)
  const renderJob = new NodeRenderJobService(video, options.renderJob)

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

  // Auto-connect if requested
  if (autoConnect) {
    await backend.connect()
  }

  return {
    backend,
    platform,
    storage,
    event,
    media,
    nodeBackend,
    video,
    ai,
    language,
    renderJob,
  }
}

/**
 * Создание изолированных Node.js сервисов без регистрации в контейнере.
 * Полезно для unit-тестов и изолированных операций.
 *
 * @param options Опции для сервисов
 * @returns Объект со всеми сервисами
 */
export function createNodeServices(options: NodeAppOptions = {}): NodeAppServices {
  const video = new NodeVideoService(options.video)

  return {
    backend: new NodeBackendService(options.backend),
    platform: new NodePlatformService(options.platform),
    storage: new NodeStorageService(options.storage),
    event: new NodeEventService(),
    media: new NodeMediaService(options.media),
    nodeBackend: new NodeBackendBridgeService(),
    video,
    ai: new NodeAIService(options.ai),
    language: new NodeLanguageService(options.language),
    renderJob: new NodeRenderJobService(video, options.renderJob),
  }
}

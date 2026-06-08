/**
 * Node.js Adapters
 *
 * Реализации сервисов для Node.js окружения (CLI, серверы, Electron).
 * Использует нативные Node.js модули и CLI инструменты (ffmpeg, whisper).
 */

import { container } from "@/core/container"

import { type NodeAIOptions, NodeAIService } from "./ai"
import { type NodeBackendOptions, NodeBackendService } from "./backend"
import { NodeBotMediaResolver, type NodeBotMediaResolverOptions } from "./bot-media-resolver"
import { NodeBotStatusNotifier, type NodeBotStatusNotifierOptions } from "./bot-status"
import { NodeBotWorkflowService, type NodeBotWorkflowServiceOptions } from "./bot-workflow"
import { NodeEventService } from "./event"
import { type NodeLanguageOptions, NodeLanguageService } from "./language"
import { type NodeMediaOptions, NodeMediaService } from "./media"
import { NodeBackendBridgeService } from "./node-backend-bridge"
import { type NodePlatformOptions, NodePlatformService } from "./platform"
import { type NodePublishOptions, NodePublishService } from "./publish"
import { NodeRenderJobService, type NodeRenderJobServiceOptions } from "./render-job"
import { type NodeRustRenderVideoOptions, NodeRustRenderVideoService } from "./rust-render-video"
import { type NodeStorageOptions, NodeStorageService } from "./storage"
import { type NodeVideoOptions, NodeVideoService } from "./video"

// Re-exports
export { type NodeAIOptions, NodeAIService } from "./ai"
export { type NodeBackendOptions, NodeBackendService } from "./backend"
export {
  NodeBotMediaResolver,
  type NodeBotMediaResolverOptions,
  type TelegramFileClient,
  type TelegramFileInfo,
} from "./bot-media-resolver"
export {
  NodeBotStatusNotifier,
  type NodeBotStatusNotifierOptions,
  type NodeStatusFetch,
  type NodeStatusFetchResponse,
  type NodeTelegramStatusClient,
  type NodeTelegramStatusPayload,
  type NodeTelegramStatusResult,
} from "./bot-status"
export { NodeBotWorkflowService, type NodeBotWorkflowServiceOptions } from "./bot-workflow"
export { NodeBotWorkflowFileDraftStore } from "./bot-workflow-drafts"
export { NodeEventService } from "./event"
export { type NodeLanguageOptions, NodeLanguageService } from "./language"
export { type NodeMediaOptions, NodeMediaService } from "./media"
export { NodeBackendBridgeService } from "./node-backend-bridge"
export { type NodePlatformOptions, NodePlatformService } from "./platform"
export {
  type NodePublishFetch,
  type NodePublishFetchResponse,
  type NodePublishOptions,
  NodePublishService,
  type NodeTelegramPublishClient,
  type NodeTelegramPublishPayload,
  type NodeTelegramPublishResult,
} from "./publish"
export { NodeRenderJobService, type NodeRenderJobServiceOptions } from "./render-job"
export { type NodeRustRenderVideoOptions, NodeRustRenderVideoService } from "./rust-render-video"
export { type NodeStorageOptions, NodeStorageService } from "./storage"
export {
  createTelegramLikePayloadFromUpdate,
  defaultTelegramBotCommandText,
  defaultTelegramBotDraftText,
  defaultTelegramBotUpdateErrorText,
  NodeTelegramBotApiClient,
  type NodeTelegramBotClient,
  type NodeTelegramBotCommand,
  type NodeTelegramBotCommandFormatter,
  type NodeTelegramBotCommandFormatterContext,
  type NodeTelegramBotDraftAction,
  type NodeTelegramBotDraftCommand,
  type NodeTelegramBotDraftFormatter,
  type NodeTelegramBotDraftFormatterContext,
  NodeTelegramBotFileOffsetStore,
  type NodeTelegramBotFileOffsetStoreState,
  NodeTelegramBotInMemoryWorkflowQueue,
  type NodeTelegramBotInMemoryWorkflowQueueOptions,
  type NodeTelegramBotOffsetStore,
  type NodeTelegramBotUpdateErrorFormatter,
  type NodeTelegramBotUpdateErrorFormatterContext,
  NodeTelegramBotWorker,
  type NodeTelegramBotWorkerHandleOptions,
  type NodeTelegramBotWorkerOptions,
  type NodeTelegramBotWorkerPollOptions,
  type NodeTelegramBotWorkerPollResult,
  type NodeTelegramBotWorkerRunOptions,
  type NodeTelegramBotWorkerRunResult,
  type NodeTelegramBotWorkerUpdateResult,
  type NodeTelegramBotWorkflowQueue,
  type NodeTelegramBotWorkflowQueueJob,
  type NodeTelegramBotWorkflowQueueStatus,
  type NodeTelegramBotWorkflowQueueSubmission,
  parseTelegramBotCommand,
  parseTelegramBotDraftCommand,
  type TelegramBotFetch,
  type TelegramBotFetchResponse,
  type TelegramBotFile,
  type TelegramBotGetUpdatesOptions,
  type TelegramBotMessage,
  type TelegramBotUpdate,
} from "./telegram-bot-worker"
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
  /** Опции для Rust headless render adapter */
  rustRender?: boolean | NodeRustRenderVideoOptions
  /** Опции для AI сервиса */
  ai?: NodeAIOptions
  /** Опции для Backend сервиса */
  backend?: NodeBackendOptions
  /** Опции для Language сервиса */
  language?: NodeLanguageOptions
  /** Опции для bot-first Publish сервиса */
  publish?: NodePublishOptions
  /** Опции для bot-first RenderJob сервиса */
  renderJob?: NodeRenderJobServiceOptions
  /** Опции для bot-first workflow runner */
  botWorkflow?: NodeBotWorkflowServiceOptions
  /** Опции для bot-first media resolver */
  botMediaResolver?: NodeBotMediaResolverOptions | false
  /** Опции для bot-first status notifier */
  botStatus?: NodeBotStatusNotifierOptions | false
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
  publish: NodePublishService
  renderJob: NodeRenderJobService
  botWorkflow: NodeBotWorkflowService
  botMediaResolver?: NodeBotMediaResolver
  botStatus?: NodeBotStatusNotifier
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
  const video = createNodeVideoService(options.video, options.rustRender)
  const ai = new NodeAIService(options.ai)
  const language = new NodeLanguageService(options.language)
  const publish = new NodePublishService(options.publish)
  const renderJob = new NodeRenderJobService(video, {
    ...options.renderJob,
    publisher: options.renderJob?.publisher ?? publish,
  })
  const botMediaResolver = createNodeBotMediaResolver(options.botMediaResolver)
  const botStatus = createNodeBotStatusNotifier(options.botStatus)
  const botWorkflow = new NodeBotWorkflowService(renderJob, {
    ...options.botWorkflow,
    mediaResolver: options.botWorkflow?.mediaResolver ?? botMediaResolver,
    status: options.botWorkflow?.status ?? (botStatus ? { sink: botStatus } : undefined),
  })

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
    publish,
    renderJob,
    botWorkflow,
    ...(botMediaResolver ? { botMediaResolver } : {}),
    ...(botStatus ? { botStatus } : {}),
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
  const video = createNodeVideoService(options.video, options.rustRender)
  const publish = new NodePublishService(options.publish)
  const renderJob = new NodeRenderJobService(video, {
    ...options.renderJob,
    publisher: options.renderJob?.publisher ?? publish,
  })
  const botMediaResolver = createNodeBotMediaResolver(options.botMediaResolver)
  const botStatus = createNodeBotStatusNotifier(options.botStatus)
  const botWorkflow = new NodeBotWorkflowService(renderJob, {
    ...options.botWorkflow,
    mediaResolver: options.botWorkflow?.mediaResolver ?? botMediaResolver,
    status: options.botWorkflow?.status ?? (botStatus ? { sink: botStatus } : undefined),
  })

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
    publish,
    renderJob,
    botWorkflow,
    ...(botMediaResolver ? { botMediaResolver } : {}),
    ...(botStatus ? { botStatus } : {}),
  }
}

function createNodeBotMediaResolver(options?: NodeBotMediaResolverOptions | false): NodeBotMediaResolver | undefined {
  if (options === undefined || options === false) return undefined
  return new NodeBotMediaResolver(options)
}

function createNodeBotStatusNotifier(
  options?: NodeBotStatusNotifierOptions | false,
): NodeBotStatusNotifier | undefined {
  if (options === undefined || options === false) return undefined
  return new NodeBotStatusNotifier(options)
}

function createNodeVideoService(
  videoOptions?: NodeVideoOptions,
  rustRenderOptions?: boolean | NodeRustRenderVideoOptions,
): NodeVideoService {
  if (!rustRenderOptions) {
    return new NodeVideoService(videoOptions)
  }

  const options = rustRenderOptions === true ? videoOptions : { ...videoOptions, ...rustRenderOptions }
  return new NodeRustRenderVideoService(options)
}

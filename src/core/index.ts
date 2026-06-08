/**
 * Core Module
 *
 * Ядро приложения - не зависит от конкретной платформы (Tauri, Browser, Node.js).
 * Содержит:
 * - Ports: интерфейсы для взаимодействия с внешними системами
 * - Types: типы данных (команды, события, состояние)
 * - Container: DI контейнер для управления зависимостями
 */

// Container (DI)
export {
  container,
  getBackend,
  getLanguage,
  getNodeBackend,
  getPlatform,
  getStorage,
  resetContainer,
} from "./container"
// Ports (Interfaces)
export type {
  IBackendService,
  ILanguageService,
  INodeBackendService,
  IPlatformService,
  IPublishService,
  IRenderJobService,
  IStorageService,
  NodeBackendHealth,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
  Unsubscribe,
} from "./ports"
export type {
  BotRenderJobRetryOptions,
  BotWorkflowRunnerOptions,
  LanguageResponse,
  ParsedBotWorkflowText,
  TelegramLikeBotWorkflowRunnerOptions,
} from "./services"
export {
  canCancelBotRenderJob,
  canRetryBotRenderJob,
  createBotRenderJobRequest,
  createBotRenderJobRetryRequest,
  createBotRenderJobSnapshot,
  createBotWorkflowRequestFromTelegramLikePayload,
  createTelegramLikeBotWorkflow,
  getAppLanguage,
  InMemoryBotRenderJobEventStream,
  parseBotWorkflowText,
  runBotWorkflow,
  runTelegramLikeBotWorkflow,
  setAppLanguage,
} from "./services"

// Types (re-exported from generated bindings for now)
export type {
  BotMediaAttachment,
  BotMediaAttachmentType,
  BotPublishMetadata,
  BotPublishRequest,
  BotPublishResult,
  BotPublishStatus,
  BotRenderJob,
  BotRenderJobArtifact,
  BotRenderJobDestination,
  BotRenderJobEvent,
  BotRenderJobEventQuery,
  BotRenderJobEventSink,
  BotRenderJobEventStreamOptions,
  BotRenderJobMediaInput,
  BotRenderJobProjectInput,
  BotRenderJobReconnectState,
  BotRenderJobRequest,
  BotRenderJobResult,
  BotRenderJobRunOptions,
  BotRenderJobSnapshot,
  BotRenderJobSource,
  BotRenderJobStatus,
  BotTemplateSelection,
  BotWorkflowIntakeOptions,
  BotWorkflowIntakeResult,
  BotWorkflowOutput,
  BotWorkflowRequest,
  BotWorkflowRunOptions,
  BotWorkflowRunResult,
  BotWorkflowSource,
  BotWorkflowValidationCode,
  BotWorkflowValidationError,
  BrowserState,
  BrowserTab,
  Clip,
  CommandResult,
  EventEnvelope,
  MediaFile,
  MediaItem,
  Project,
  ProjectCommand,
  ProjectEvent,
  ProjectSettings,
  ProjectState,
  TabSettings,
  TelegramLikeBotFile,
  TelegramLikeBotPayload,
  Timeline,
  Track,
  ViewMode,
} from "./types"

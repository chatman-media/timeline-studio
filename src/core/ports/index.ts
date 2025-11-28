/**
 * Core Ports (Interfaces)
 *
 * Контракты для взаимодействия с внешними системами.
 * Домены и фичи используют только эти интерфейсы, не зная о конкретных реализациях.
 */

export type { IBackendService, Unsubscribe } from "./backend.port"
export type { EventCallback, IEventService, UnlistenFn } from "./event.port"
export type {
  IMediaService,
  MediaImportOptions,
  MediaImportResult,
  MediaMetadata,
  MediaPreviewData,
  ProcessMediaOptions,
  ProcessMediaResult,
  ProxyGenerationOptions,
  ProxyGenerationResult,
  ScanFolderOptions,
  ScannedMediaFile,
  SceneDetectionResult,
  ThumbnailOptions,
  WaveformData,
  WaveformOptions,
} from "./media.port"
export type {
  FileStats,
  IPlatformService,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from "./platform.port"
export type { IStorageService } from "./storage.port"

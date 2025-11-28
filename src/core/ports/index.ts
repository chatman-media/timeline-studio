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
  MediaMetadata,
  MediaPreviewData,
  ProcessMediaOptions,
  ProcessMediaResult,
  ScannedMediaFile,
  ScanFolderOptions,
  ThumbnailOptions,
  WaveformData,
} from "./media.port"
export type {
  IPlatformService,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from "./platform.port"
export type { IStorageService } from "./storage.port"

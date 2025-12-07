/**
 * Media Management Orchestrator Service
 *
 * Координирует управление медиафайлами, импорт, операции с файлами
 * Использует IBackendService из DI контейнера для синхронизации
 */

console.log("🟡 [MediaManagementOrchestrator] MODULE LOADED AT TOP")

import { type ActorRefFrom, createActor } from "xstate"
import { container } from "@/core"
import type { IBackendService } from "@/core/ports"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"
import {
  handleMediaBackendEvent,
  type MediaManagementContext as MediaContext,
} from "../machines/backend-event-handlers"
import { fileOperationsMachine } from "../machines/file-operations-machine"
import { mediaImportMachine } from "../machines/media-import-machine"
import {
  type MediaFileOperation,
  type MediaImportOptions,
  type MediaInfo,
  type MediaManagementService,
  type MediaMetadata,
  MediaType,
} from "../types"
import { type CameraDevice, type CameraImportOptions, type CameraImportResult, getCameraImport } from "./camera-import"
import { ErrorTrackerService } from "./error-tracker"
import { indexedDBCacheService } from "./indexeddb-cache-service"
import { getMediaFiles, restorePreviewCache, selectAudioFile, selectMediaDirectory, selectMediaFile } from "./media-api"
import { getMediaMetadataService } from "./media-metadata-service"
import {
  getProxyGenerator,
  type ProxyGenerationOptions,
  type ProxyGenerationResult,
  type ProxyResolution,
} from "./proxy-generator"
import {
  getSmartOrganization,
  type MediaGroup,
  type OrganizeByCameraOptions,
  type OrganizeByDateOptions,
} from "./smart-organization"
import {
  getWaveformGenerator,
  type WaveformData,
  type WaveformOptions,
  type WaveformResult,
} from "./waveform-generator"

const logger = createLogger("MediaManagementOrchestrator")

export class MediaManagementOrchestrator implements MediaManagementService {
  private fileOperationsActor: ActorRefFrom<typeof fileOperationsMachine>
  private mediaImportActor: ActorRefFrom<typeof mediaImportMachine>
  private backend: IBackendService | null = null
  private backendUnsubscribe: (() => void) | null = null
  private lastLoadedStateVersion: number = -1

  // Сервисы
  private metadataService = getMediaMetadataService()
  private cameraImportService = getCameraImport()
  private proxyGeneratorService = getProxyGenerator()
  private smartOrganizationService = getSmartOrganization()
  private waveformGeneratorService = getWaveformGenerator()
  private errorTrackerService = new ErrorTrackerService()
  private cacheService = indexedDBCacheService

  // Внутреннее состояние
  private mediaPool = new Map<string, MediaInfo>()
  private isLoading = false
  private error: string | null = null

  constructor() {
    console.log("🟢 [MediaManagementOrchestrator] CONSTRUCTOR CALLED")
    logger.infoSync("[Media Management Orchestrator] Initializing...")

    // Создаем акторы для машин состояния
    this.fileOperationsActor = createActor(fileOperationsMachine)
    this.mediaImportActor = createActor(mediaImportMachine)

    // Запускаем акторы
    this.fileOperationsActor.start()
    this.mediaImportActor.start()

    // Получаем backend из контейнера (может быть null если контейнер не инициализирован)
    try {
      logger.infoSync("[MediaManagementOrchestrator] Checking if backend is available")
      if (container.hasBackend()) {
        this.backend = container.getBackend()
        logger.infoSync("[MediaManagementOrchestrator] Backend retrieved successfully")
      } else {
        logger.warnSync("[MediaManagementOrchestrator] Backend is not registered in container")
      }
    } catch (error) {
      logger.warnSync("[MediaManagementOrchestrator] Backend not available yet", { error: String(error) })
    }

    // Настраиваем синхронизацию
    this.setupSynchronization()
    this.setupBackendSync()

    // Инициализируем кэш превью
    this.initPreviewCache()

    logger.infoSync("[Media Management Orchestrator] Initialized successfully")
  }

  /**
   * Настройка синхронизации между машинами
   */
  private setupSynchronization() {
    // Подписываемся на события операций с файлами
    this.fileOperationsActor.subscribe((state) => {
      logger.debug("[Media Management] File operations state changed", {
        activeCount: state.context.activeOperations.length,
        completedCount: state.context.completedOperations.length,
        failedCount: state.context.failedOperations.length,
      })
    })

    // Подписываемся на события импорта медиа
    this.mediaImportActor.subscribe((state) => {
      if (state.matches("completed")) {
        logger.info("[Media Management] Media import completed")

        // Показываем нотификацию об успешном импорте
        const importedCount = state.context.importedFiles?.length ?? 0
        if (importedCount > 0) {
          this.showImportSuccessNotification(importedCount)
        }
      } else if (state.matches("failed")) {
        logger.error("[Media Management] Media import failed", {
          errors: state.context.errors,
        })
      }
    })
  }

  /**
   * Настройка синхронизации с backend
   */
  private setupBackendSync() {
    console.log("🟢 [MediaManagementOrchestrator] setupBackendSync called", { hasBackend: !!this.backend })
    logger.infoSync("[MediaManagementOrchestrator] Setting up backend sync", {
      hasBackend: !!this.backend,
    })

    if (!this.backend) {
      console.log("🔴 [MediaManagementOrchestrator] Backend not available!")
      logger.warnSync("[MediaManagementOrchestrator] Backend not available, skipping sync setup")
      return
    }

    // Подписываемся на backend события
    console.log("🟢 [MediaManagementOrchestrator] Subscribing to backend events")
    logger.infoSync("[MediaManagementOrchestrator] Subscribing to backend events")
    this.backendUnsubscribe = this.backend.onEvent((event: ProjectEvent) => {
      console.log("🟢 [MediaManagementOrchestrator] EVENT RECEIVED:", event.type)
      logger.infoSync("[Media Management Orchestrator] Received backend event:", { eventType: event.type })

      // Создаем контекст для event handler
      const context: MediaContext = {
        mediaPool: this.mediaPool,
        isLoading: this.isLoading,
        error: this.error,
      }

      // Обрабатываем событие
      const updates = handleMediaBackendEvent(context, event)

      // Применяем обновления
      if (updates.mediaPool !== undefined) {
        this.mediaPool = updates.mediaPool
        logger.info("[Media Management] Media pool updated via event", {
          eventType: event.type,
          poolSize: this.mediaPool.size,
        })
      }

      if (updates.isLoading !== undefined) {
        this.isLoading = updates.isLoading
      }

      if (updates.error !== undefined) {
        this.error = updates.error
      }
    })

    // Подписываемся на изменения состояния для начальной загрузки
    this.backend.onStateChange((state: any) => {
      this.loadInitialState(state)
    })
  }

  /**
   * Публичный метод для ре-синхронизации mediaPool с backend
   * 🔧 WORKAROUND: Используется для обхода проблемы с event-driven обновлением
   */
  public async refreshMediaPool(): Promise<void> {
    if (!this.backend) {
      logger.warn("[Media Management] Cannot refresh media pool - backend not available")
      return
    }

    logger.info("[Media Management] 🔧 FORCE REFRESH: Fetching current state from backend...")
    const state = await this.backend.getProjectState()
    if (state) {
      this.loadInitialState(state)
      logger.info("[Media Management] 🔧 FORCE REFRESH: Media pool updated", {
        poolSize: this.mediaPool.size,
      })
    }
  }

  /**
   * Загрузка начального состояния из backend
   */
  private loadInitialState(state: any) {
    // Проверяем версию state чтобы избежать повторной загрузки
    const stateVersion = state?.version ?? 0
    if (stateVersion > 0 && stateVersion === this.lastLoadedStateVersion) {
      logger.debug("[Media Management] Skipping loadInitialState - same version", { version: stateVersion })
      return
    }

    logger.info("[Media Management] Loading initial state from backend", { version: stateVersion })
    this.lastLoadedStateVersion = stateVersion

    const initialMediaPool = new Map<string, MediaInfo>()

    // Загружаем из project.media_pool (unified storage - all media here)
    if (state.project?.media_pool?.items) {
      const mediaPoolItems = state.project.media_pool.items
      const itemCount = Object.keys(mediaPoolItems).length
      console.warn("[MediaOrchestrator] loadInitialState: backend has", itemCount, "media items")

      // Дедупликация по path - берём только первое вхождение каждого path
      const pathToId = new Map<string, string>()

      Object.entries(mediaPoolItems).forEach(([mediaId, mediaItem]: [string, any]) => {
        const existingId = pathToId.get(mediaItem.path)

        if (existingId) {
          console.warn("[MediaOrchestrator] ДУБЛЬ обнаружен:", {
            name: mediaItem.name,
            path: mediaItem.path,
            existingId,
            duplicateId: mediaId,
          })
          // Пропускаем дубль
          return
        }

        pathToId.set(mediaItem.path, mediaId)
        initialMediaPool.set(mediaId, {
          id: mediaId,
          path: mediaItem.path,
          name: mediaItem.name,
          type: mediaItem.media_type as MediaType,
          duration: mediaItem.duration ?? undefined,
          thumbnailPath: mediaItem.thumbnail ?? undefined,
          metadata: mediaItem.metadata?.codec
            ? {
                type: mediaItem.media_type as "Video" | "Audio" | "Image",
                codec: mediaItem.metadata.codec,
              }
            : undefined,
        })
      })

      if (itemCount > initialMediaPool.size) {
        const duplicateCount = itemCount - initialMediaPool.size

        // Используем warn для небольшого количества дублей (≤ 5), error для массовых дублей
        if (duplicateCount <= 5) {
          console.warn("[MediaOrchestrator] Найдено и удалено дублей на фронтенде:", duplicateCount, {
            backend: itemCount,
            afterDedup: initialMediaPool.size,
          })
        } else {
          console.error("[MediaOrchestrator] ВНИМАНИЕ: Обнаружено много дублей:", duplicateCount, {
            backend: itemCount,
            afterDedup: initialMediaPool.size,
          })

          // Автоматически запускаем очистку дублей в backend
          console.info("[MediaOrchestrator] Запускаем автоматическую очистку дублей в backend...")
          this.deduplicateMediaPoolAsync().catch((err) => {
            console.error("[MediaOrchestrator] Ошибка при очистке дублей:", err)
          })
        }
      }
    }

    // NOTE: imported_media removed (2025-11) - all media now in media_pool

    this.mediaPool = initialMediaPool
    logger.info("[Media Management] Initial media pool loaded", {
      count: this.mediaPool.size,
    })
  }

  /**
   * Инициализация кэша превью
   */
  private async initPreviewCache() {
    try {
      const restoredCount = await restorePreviewCache()
      if (restoredCount > 0) {
        logger.info("[Media Management] Preview cache restored", {
          count: restoredCount,
        })
      }
    } catch (error) {
      logger.error("[Media Management] Failed to restore preview cache", {
        error,
      })
    }
  }

  /**
   * Lazy-получение backend из container
   * Вызывается при каждой операции, требующей backend
   */
  private ensureBackend(): IBackendService | null {
    if (!this.backend) {
      try {
        if (container.hasBackend()) {
          this.backend = container.getBackend()
          logger.info("[MediaManagementOrchestrator] Backend retrieved lazily")
          // Настраиваем подписку на события если не настроена
          if (!this.backendUnsubscribe) {
            this.setupBackendSync()
          }
        }
      } catch (error) {
        logger.warn("[MediaManagementOrchestrator] Backend still not available", { error: String(error) })
      }
    }
    return this.backend
  }

  /**
   * Вспомогательная функция для определения типа медиа по пути файла
   */
  private getMediaTypeFromPath(filePath: string): MediaType {
    const ext = filePath.split(".").pop()?.toLowerCase() || ""

    const videoExts = ["mp4", "avi", "mkv", "mov", "webm", "m4v", "3gp", "flv"]
    const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"]
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "tiff"]

    if (videoExts.includes(ext)) return MediaType.Video
    if (audioExts.includes(ext)) return MediaType.Audio
    if (imageExts.includes(ext)) return MediaType.StillImage

    return MediaType.Unknown
  }

  /**
   * Импорт медиафайлов в проект
   */
  async importFiles(files: string[], options: MediaImportOptions = {}): Promise<any[]> {
    logger.info("[Media Management Orchestrator] Importing files", {
      filesCount: files.length,
    })

    try {
      this.isLoading = true
      this.error = null

      // Добавляем файлы в машину импорта
      this.mediaImportActor.send({
        type: "ADD_FILES",
        files,
      })

      // Обновляем опции если указаны
      if (Object.keys(options).length > 0) {
        this.mediaImportActor.send({
          type: "UPDATE_OPTIONS",
          options,
        })
      }

      // Запускаем импорт
      this.mediaImportActor.send({ type: "START_IMPORT" })

      // Импортируем каждый файл через BackendSync
      const importResults: any[] = []
      const backend = this.ensureBackend()

      if (!backend) {
        logger.error("[Media Management] Backend not available for import")
        this.error = "Backend not available"
        this.isLoading = false
        return []
      }

      for (const filePath of files) {
        try {
          const mediaType = this.getMediaTypeFromPath(filePath)
          // AddMedia saves directly to media_pool (unified architecture)
          logger.info("[Media Management] Sending AddMedia command", { filePath, mediaType })
          const result = await backend.executeCommand({
            type: "AddMedia",
            params: { path: filePath, media_type: mediaType },
          } as any)

          logger.info("[Media Management] AddMedia result", { filePath, result })
          if (result) {
            importResults.push(result)
          }
        } catch (importError) {
          logger.error("[Media Management] Failed to import file", {
            filePath,
            importError,
          })
          this.errorTrackerService.trackError(
            "import_failed",
            importError instanceof Error ? importError.message : String(importError),
            { filePath, error: importError instanceof Error ? importError : undefined },
          )
        }
      }

      this.isLoading = false
      return importResults
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Import failed"
      logger.error("[Media Management Orchestrator] Import failed", {
        error: errorMessage,
      })
      this.error = errorMessage
      this.isLoading = false
      throw error
    }
  }

  /**
   * Очистка дублей в медиа-пуле
   */
  private async deduplicateMediaPoolAsync(): Promise<void> {
    const backend = this.ensureBackend()

    if (!backend) {
      logger.error("[Media Management] Backend not available for deduplication")
      return
    }

    try {
      logger.info("[Media Management] Executing DeduplicateMediaPool command")
      const result = await backend.executeCommand({
        type: "DeduplicateMediaPool",
      } as any)

      if (result?.data) {
        const { removed_count, remaining_count } = result.data as { removed_count: number; remaining_count: number }
        logger.info("[Media Management] Deduplication completed", {
          removed: removed_count,
          remaining: remaining_count,
        })

        // Обновляем состояние фронтенда после очистки
        await this.refreshMediaPool()
      }
    } catch (error) {
      logger.error("[Media Management] Deduplication failed", { error })
      throw error
    }
  }

  /**
   * Выбор медиафайлов через диалог
   */
  async selectMediaFiles(): Promise<string[] | null> {
    try {
      return await selectMediaFile()
    } catch (error) {
      logger.error("[Media Management] Failed to select media files", {
        error,
      })
      throw error
    }
  }

  /**
   * Выбор аудиофайлов через диалог
   */
  async selectAudioFiles(): Promise<string[] | null> {
    try {
      return await selectAudioFile()
    } catch (error) {
      logger.error("[Media Management] Failed to select audio files", {
        error,
      })
      throw error
    }
  }

  /**
   * Выбор директории и автоматический импорт файлов
   */
  async selectMediaDirectory(): Promise<string | null> {
    try {
      const directory = await selectMediaDirectory()
      if (!directory) {
        return null
      }

      // Получаем все медиафайлы из директории
      const files = await getMediaFiles(directory)

      // Автоматически импортируем файлы
      if (files.length > 0) {
        await this.importFiles(files, {})
      }

      return directory
    } catch (error) {
      logger.error("[Media Management] Failed to select directory", { error })
      throw error
    }
  }

  /**
   * Получение информации о медиафайле
   */
  async getMediaInfo(path: string): Promise<MediaInfo> {
    try {
      // Ищем в локальном media pool
      const mediaEntry = Array.from(this.mediaPool.entries()).find(([, media]) => media.path === path)

      if (mediaEntry) {
        const [mediaId, mediaInfo] = mediaEntry
        return mediaInfo.id ? mediaInfo : { ...mediaInfo, id: mediaId }
      }

      // Если не найдено локально, возвращаем базовую информацию
      const name = path.split("/").pop() || path
      const mediaType = this.getMediaTypeFromPath(path)

      return {
        path,
        name,
        type: mediaType,
      }
    } catch (error) {
      logger.error("[Media Management] Failed to get media info", { error })
      const name = path.split("/").pop() || path
      const mediaType = this.getMediaTypeFromPath(path)

      return {
        path,
        name,
        type: mediaType,
      }
    }
  }

  /**
   * Извлечение метаданных медиафайла
   */
  async extractMetadata(path: string): Promise<MediaMetadata> {
    try {
      this.isLoading = true
      this.error = null

      const metadata = await this.metadataService.extractMetadata(path)

      // Обновляем метаданные в backend через UpdateMedia команду
      if (metadata) {
        const mediaId = Array.from(this.mediaPool.entries()).find(([, media]) => media.path === path)?.[0]

        if (mediaId) {
          await this.backend?.executeCommand({
            type: "UpdateMedia",
            params: { media_id: mediaId, updates: {} },
          } as any)
        }
      }

      this.isLoading = false
      return metadata
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Metadata extraction failed"
      logger.error("[Media Management Orchestrator] Metadata extraction failed", { error: errorMessage })
      this.error = errorMessage
      this.isLoading = false
      throw error
    }
  }

  /**
   * Camera Import API
   */
  async detectCameras(): Promise<CameraDevice[]> {
    return this.cameraImportService.detectCameras()
  }

  async importFromCamera(device: CameraDevice, options: CameraImportOptions = {}): Promise<CameraImportResult> {
    return this.cameraImportService.importFromCamera(device, options)
  }

  /**
   * Proxy Generator API
   */
  async generateProxy(
    mediaPath: string,
    resolution: ProxyResolution = "720p",
    options: ProxyGenerationOptions = {},
  ): Promise<ProxyGenerationResult> {
    return this.proxyGeneratorService.generateProxy(mediaPath, { ...options, resolution })
  }

  async generateProxies(mediaPaths: string[], options: ProxyGenerationOptions = {}): Promise<ProxyGenerationResult[]> {
    return this.proxyGeneratorService.batchGenerate(mediaPaths, options)
  }

  /**
   * Smart Organization API
   */
  async organizeByDate(files: string[], options: OrganizeByDateOptions = {}): Promise<MediaGroup[]> {
    // Конвертируем пути в MediaInfo
    const mediaInfoFiles = files.map((path) => ({
      path,
      name: path.split("/").pop() || path,
      type: this.getMediaTypeFromPath(path),
    }))
    const result = await this.smartOrganizationService.organizeByDate(mediaInfoFiles, options)
    return result.groups
  }

  async organizeByCamera(files: string[], options: OrganizeByCameraOptions = {}): Promise<MediaGroup[]> {
    // Конвертируем пути в MediaInfo
    const mediaInfoFiles = files.map((path) => ({
      path,
      name: path.split("/").pop() || path,
      type: this.getMediaTypeFromPath(path),
    }))
    const result = await this.smartOrganizationService.organizeByCameraType(mediaInfoFiles, options)
    return result.groups
  }

  /**
   * Waveform Generator API
   */
  async generateWaveform(audioPath: string, options: WaveformOptions = {}): Promise<WaveformResult> {
    return this.waveformGeneratorService.generateWaveform(audioPath, options)
  }

  async getWaveformData(audioPath: string): Promise<WaveformData | null> {
    try {
      const result = await this.waveformGeneratorService.generateWaveform(audioPath)
      return result.data
    } catch (error) {
      logger.error("[Media Management] Failed to get waveform data", { error })
      return null
    }
  }

  /**
   * Cache Management API
   */
  async clearCache(): Promise<void> {
    await this.cacheService.clearAllCache()
  }

  async getCacheStatistics() {
    return this.cacheService.getCacheStatistics()
  }

  /**
   * File Operations API
   */
  startFileOperation(operation: MediaFileOperation): void {
    this.fileOperationsActor.send({
      type: "START_OPERATION",
      operation,
    })
  }

  updateOperationProgress(operationId: string, progress: number): void {
    this.fileOperationsActor.send({
      type: "UPDATE_PROGRESS",
      operationId,
      progress,
    })
  }

  completeOperation(operationId: string, result: any): void {
    this.fileOperationsActor.send({
      type: "COMPLETE_OPERATION",
      operationId,
      result,
    })
  }

  failOperation(operationId: string, error: string): void {
    this.fileOperationsActor.send({
      type: "FAIL_OPERATION",
      operationId,
      error,
    })
  }

  cancelOperation(operationId: string): void {
    this.fileOperationsActor.send({
      type: "CANCEL_OPERATION",
      operationId,
    })
  }

  /**
   * Получение состояния
   */
  getMediaPool(): Map<string, MediaInfo> {
    return new Map(this.mediaPool)
  }

  getFileOperationsState() {
    return this.fileOperationsActor.getSnapshot().context
  }

  getMediaImportState() {
    return this.mediaImportActor.getSnapshot().context
  }

  isMediaLoading(): boolean {
    return this.isLoading
  }

  getError(): string | null {
    return this.error
  }

  /**
   * Подписка на изменения
   */
  subscribeToFileOperations(callback: (state: any) => void) {
    return this.fileOperationsActor.subscribe(callback)
  }

  subscribeToMediaImport(callback: (state: any) => void) {
    return this.mediaImportActor.subscribe(callback)
  }

  /**
   * Error Tracker API
   */
  getErrorStatistics() {
    return this.errorTrackerService.getStats()
  }

  clearErrors() {
    this.errorTrackerService.clearAll()
  }

  /**
   * Удаление медиафайла из пула
   */
  async removeMedia(mediaId: string): Promise<void> {
    logger.info("[Media Management] Removing media", { mediaId })

    if (!this.backend) {
      logger.error("[Media Management] Backend not available for remove media")
      throw new Error("Backend not available")
    }

    try {
      await this.backend.executeCommand({
        type: "RemoveMedia",
        params: { media_id: mediaId },
      } as any)

      // Локально удаляем из пула (синхронизация через событие MediaRemoved)
      this.mediaPool.delete(mediaId)

      logger.info("[Media Management] Media removed successfully", { mediaId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove media"
      logger.error("[Media Management] Failed to remove media", { mediaId, error: errorMessage })
      throw error
    }
  }

  /**
   * Удаление нескольких медиафайлов
   */
  async removeMultipleMedia(mediaIds: string[]): Promise<void> {
    logger.info("[Media Management] Removing multiple media", { count: mediaIds.length })

    for (const mediaId of mediaIds) {
      await this.removeMedia(mediaId)
    }
  }

  /**
   * Показать нотификацию об успешном импорте
   */
  private showImportSuccessNotification(count: number) {
    try {
      // Используем динамический импорт чтобы избежать циклических зависимостей
      import("@/domains/system-integration")
        .then(({ getSystemIntegrationOrchestrator }) => {
          const systemOrchestrator = getSystemIntegrationOrchestrator()

          const title = count === 1 ? "Файл импортирован" : `Файлов импортировано: ${count}`
          const message = count === 1 ? "Медиафайл успешно добавлен в проект" : "Медиафайлы успешно добавлены в проект"

          systemOrchestrator.showNotification({
            type: "success",
            notification_type: "success",
            title,
            message,
            duration: 3000,
          })

          logger.info("[Media Management] Import success notification shown", { count })
        })
        .catch((error) => {
          logger.error("[Media Management] Failed to show import notification", { error: String(error) })
        })
    } catch (error) {
      logger.error("[Media Management] Failed to import notification module", { error: String(error) })
    }
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    logger.info("[Media Management Orchestrator] Disposing...")

    // Отписываемся от backend событий
    if (this.backendUnsubscribe) {
      this.backendUnsubscribe()
      this.backendUnsubscribe = null
    }

    // Останавливаем акторы
    this.fileOperationsActor.stop()
    this.mediaImportActor.stop()

    // Очищаем состояние
    this.mediaPool.clear()
  }
}

// Singleton экземпляр
let orchestratorInstance: MediaManagementOrchestrator | null = null
let instanceCount = 0

/**
 * Получить экземпляр Media Management Orchestrator
 */
export function getMediaManagementOrchestrator(): MediaManagementOrchestrator {
  if (!orchestratorInstance) {
    instanceCount++
    console.log(`🟡 [MediaManagementOrchestrator] Creating NEW instance #${instanceCount}`)
    orchestratorInstance = new MediaManagementOrchestrator()
  } else {
    console.log(`🟡 [MediaManagementOrchestrator] Returning EXISTING instance #${instanceCount}`)
  }
  return orchestratorInstance
}

/**
 * Сбросить экземпляр orchestrator (для тестов)
 */
export function resetMediaManagementOrchestrator() {
  if (orchestratorInstance) {
    orchestratorInstance.dispose()
    orchestratorInstance = null
  }
}

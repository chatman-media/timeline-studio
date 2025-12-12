/**
 * Video Editing Domain Orchestrator
 *
 * Координирует работу всех машин и сервисов домена видеоредактирования:
 * - Timeline управление (расширенная версия)
 * - Player управление
 * - Backend синхронизация
 * - Межdomainная коммуникация через EventBus
 */

import { type ActorRefFrom, createActor } from "xstate"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("VideoEditingOrchestrator")

// Временные типы и mock
interface ClipAddedEvent {
  type: "CLIP_ADDED"
  data: {
    trackId: string
    clip: {
      id: string
      trackId: string
      startTime: number
      endTime: number
      duration: number
      mediaId: string
    }
  }
}

interface PlaybackStateChangedEvent {
  type: "PLAYBACK_STATE_CHANGED"
  data: {
    isPlaying: boolean
    currentTime: number
    duration: number
    progress: number
  }
}

interface TimelineUpdatedEvent {
  type: "TIMELINE_UPDATED"
  data: {
    hasUnsavedChanges: boolean
    duration: number
    trackCount: number
  }
}

const DOMAIN_EVENTS = {
  CLIP_ADDED: "CLIP_ADDED",
  TIMELINE_UPDATED: "TIMELINE_UPDATED",
  PLAYBACK_STATE_CHANGED: "PLAYBACK_STATE_CHANGED",
  MEDIA: {
    FILES_IMPORTED: "FILES_IMPORTED",
  },
  AI_SERVICES: {
    MONTAGE_PLAN_GENERATED: "MONTAGE_PLAN_GENERATED",
  },
  VIDEO: {
    CLIP_ADDED: "CLIP_ADDED",
    TIMELINE_UPDATED: "TIMELINE_UPDATED",
    PLAYBACK_STATE_CHANGED: "PLAYBACK_STATE_CHANGED",
  },
}

interface EventBus {
  publish: <T = any>(type: string, source: string, data: T) => void
  subscribe: (callback: (event: any) => void, options?: any) => () => void
}

const mockEventBus: EventBus = {
  publish: (type, source, data) => logger.debug("Event:", { data: { type, source, data } }),
  subscribe: (_callback, _options) => () => {},
}

const eventBus = mockEventBus

// Import core services
import { container } from "@/core"
import type { IBackendService } from "@/core/ports"
import type { ProjectCommand } from "@/types/generated/tauri-bindings"

// Import machines
import { playerMachine } from "../machines/player-machine"
import { timelineMachine } from "../machines/timeline-machine"

export class VideoEditingOrchestrator {
  private static instance: VideoEditingOrchestrator | null = null

  // Actors
  private timelineActor: ActorRefFrom<typeof timelineMachine>
  private playerActor: ActorRefFrom<typeof playerMachine>

  // Backend sync
  private backend: IBackendService | null = null
  private backendUnsubscribe: (() => void) | null = null

  private constructor() {
    logger.info("[Video Editing Orchestrator] Initializing...")

    // Создаем акторы
    this.timelineActor = createActor(timelineMachine)
    this.playerActor = createActor(playerMachine)

    // Запускаем акторы
    this.timelineActor.start()
    this.playerActor.start()

    // Получаем backend из контейнера (может быть null если контейнер не инициализирован)
    try {
      if (container.hasBackend()) {
        this.backend = container.getBackend()
      }
    } catch {
      logger.warn("[VideoEditingOrchestrator] Backend not available yet")
    }

    // Настраиваем синхронизацию
    this.setupBackendSync()
    this.setupEventHandlers()
    this.setupActorSync()
    this.setupEventPublishing()
  }

  static getInstance(): VideoEditingOrchestrator {
    if (!VideoEditingOrchestrator.instance) {
      VideoEditingOrchestrator.instance = new VideoEditingOrchestrator()
    }
    return VideoEditingOrchestrator.instance
  }

  /**
   * Настройка синхронизации с backend
   */
  private setupBackendSync() {
    if (!this.backend) {
      logger.warn("[VideoEditingOrchestrator] Backend not available, skipping sync setup")
      return
    }

    // Подписка на изменения состояния backend
    this.backendUnsubscribe = this.backend.onStateChange((state) => {
      logger.info("[Video Editing Orchestrator] Backend state updated")

      // Обновляем timeline машину
      if (state.project) {
        this.timelineActor.send({
          type: "PROJECT_UPDATED",
          project: state.project as any,
        })
      }

      // Обновляем player машину
      if (state.playback_state) {
        this.playerActor.send({
          type: "SYNC_STATE",
          state: state.playback_state,
        })

        // Синхронизируем с timeline
        this.timelineActor.send({
          type: "SYNC_PLAYBACK_STATE",
          isPlaying: state.playback_state.is_playing,
          currentTime: state.playback_state.current_time,
        })
      }
    })
  }

  /**
   * Настройка обработчиков событий из других доменов
   */
  private setupEventHandlers() {
    // Слушаем события из media домена
    eventBus.subscribe(
      async (event) => {
        logger.info("[Video Editing Orchestrator] Received event:", { data: event.type })

        switch (event.type) {
          case DOMAIN_EVENTS.MEDIA.FILES_IMPORTED:
            // Можно автоматически добавить файлы на timeline
            logger.info("Media files imported, ready to add to timeline")
            break

          case DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED:
            // Автоматически применить план монтажа
            logger.info("Montage plan generated, ready to apply")
            break
        }
      },
      {
        filter: {
          source: ["media-management", "ai-services"],
        },
      },
    )
  }

  /**
   * Настройка синхронизации между акторами
   */
  private setupActorSync() {
    // Player и timeline синхронизируются автоматически через backend events
    // Дополнительная синхронизация не требуется
  }

  /**
   * Настройка публикации событий
   */
  private setupEventPublishing() {
    // Публикуем события из timeline
    this.timelineActor.subscribe((snapshot) => {
      const { project, hasUnsavedChanges } = snapshot.context

      // Публикуем обновление timeline
      if (project && snapshot.matches("active")) {
        eventBus.publish(DOMAIN_EVENTS.VIDEO.TIMELINE_UPDATED, "video-editing", {
          hasUnsavedChanges,
          duration: project.duration,
          trackCount: project.globalTracks?.length ?? 0,
        })
      }
    })

    // Публикуем события воспроизведения
    this.playerActor.subscribe((snapshot) => {
      const { isPlaying, currentTime, duration } = snapshot.context

      eventBus.publish(DOMAIN_EVENTS.VIDEO.PLAYBACK_STATE_CHANGED, "video-editing", {
        isPlaying,
        currentTime,
        duration,
        progress: duration > 0 ? currentTime / duration : 0,
      })
    })
  }

  /**
   * Выполнить команду backend
   */
  async executeCommand(command: ProjectCommand): Promise<void> {
    logger.info("[Video Editing Orchestrator] Executing command:", { data: command.type })

    try {
      await this.backend?.executeCommand(command as any)
    } catch (error) {
      logger.error("[Video Editing Orchestrator] Command failed:", { error })
      throw error
    }
  }

  /**
   * API для управления проектом
   */
  async createProject(name: string, settings?: any) {
    this.timelineActor.send({
      type: "CREATE_PROJECT",
      name,
      settings,
    })
  }

  async loadProject(path: string) {
    this.timelineActor.send({
      type: "LOAD_PROJECT",
      path,
    })
  }

  async saveProject() {
    this.timelineActor.send({
      type: "SAVE_PROJECT",
    })
  }

  /**
   * API для управления воспроизведением
   */
  play() {
    this.playerActor.send({ type: "PLAY" })
    this.timelineActor.send({ type: "PLAY" })
  }

  pause() {
    this.playerActor.send({ type: "PAUSE" })
    this.timelineActor.send({ type: "PAUSE" })
  }

  stopPlayback() {
    this.playerActor.send({ type: "STOP" })
    this.timelineActor.send({ type: "STOP" })
  }

  seek(time: number) {
    this.playerActor.send({ type: "SEEK", time })
    this.timelineActor.send({ type: "SEEK", time })
  }

  /**
   * API для управления треками
   */
  async addTrack(type: any, name?: string, sectionId?: string) {
    const command: ProjectCommand = {
      type: "AddTrack",
      params: {
        name: name || `${type} Track`,
        track_type: type as any, // TrackType уже в PascalCase формате
        index: null,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "ADD_TRACK",
      trackType: type,
      name,
      sectionId,
    })
  }

  /**
   * API для управления клипами
   */
  async addClip(trackId: string, mediaFile: any, time: number) {
    const command: ProjectCommand = {
      type: "AddClip",
      params: {
        track_id: trackId,
        media_id: typeof mediaFile === "string" ? mediaFile : mediaFile.id,
        time: time,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "ADD_CLIP",
      trackId,
      mediaFile,
      time,
    })

    // Публикуем событие
    const clipId = `clip-${Date.now()}` // Временный ID
    eventBus.publish(DOMAIN_EVENTS.VIDEO.CLIP_ADDED, "video-editing", {
      trackId,
      clip: {
        id: clipId,
        trackId,
        startTime: time,
        endTime: time + (mediaFile.duration || 5),
        duration: mediaFile.duration || 5,
        mediaId: typeof mediaFile === "string" ? mediaFile : mediaFile.id,
      },
    })
  }

  async moveClip(clipId: string, newTrackId: string, newTime: number) {
    logger.info("[Video Editing Orchestrator] Moving clip:", {
      data: { clipId, newTrackId, newTime },
    })

    const command: ProjectCommand = {
      type: "MoveClip",
      params: {
        clip_id: clipId,
        track_id: newTrackId,
        time: newTime,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "MOVE_CLIP",
      clipId,
      trackId: newTrackId,
      time: newTime,
    })
  }

  async deleteClip(clipId: string) {
    logger.info("[Video Editing Orchestrator] Deleting clip:", { data: { clipId } })

    const command: ProjectCommand = {
      type: "DeleteClip",
      params: {
        clip_id: clipId,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "REMOVE_CLIP",
      clipId,
    })
  }

  async trimClip(clipId: string, start: number, end: number) {
    logger.info("[Video Editing Orchestrator] Trimming clip:", {
      data: { clipId, start, end },
    })

    const command: ProjectCommand = {
      type: "TrimClip",
      params: {
        clip_id: clipId,
        start,
        end,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "TRIM_CLIP",
      clipId,
      startTime: start,
      endTime: end,
    })
  }

  async splitClip(clipId: string, time: number) {
    logger.info("[Video Editing Orchestrator] Splitting clip:", {
      data: { clipId, time },
    })

    const command: ProjectCommand = {
      type: "SplitClip",
      params: {
        clip_id: clipId,
        time,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "SPLIT_CLIP",
      clipId,
      time,
    })
  }

  async updateClip(clipId: string, updates: any) {
    logger.info("[Video Editing Orchestrator] Updating clip:", {
      data: { clipId, updates },
    })

    const command: ProjectCommand = {
      type: "UpdateClip",
      params: {
        clip_id: clipId,
        updates,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "UPDATE_CLIP",
      clipId,
      updates,
    })
  }

  async copyClips(clipIds: string[]) {
    logger.info("[Video Editing Orchestrator] Copying clips:", {
      data: { clipIds },
    })

    const command: ProjectCommand = {
      type: "CopyClips",
      params: {
        clip_ids: clipIds,
      },
    }

    await this.executeCommand(command)

    // Machine не принимает параметры для COPY_CLIPS, она копирует выбранные клипы
    this.timelineActor.send({
      type: "COPY_CLIPS",
    })
  }

  async cutClips(clipIds: string[]) {
    logger.info("[Video Editing Orchestrator] Cutting clips:", {
      data: { clipIds },
    })

    const command: ProjectCommand = {
      type: "CutClips",
      params: {
        clip_ids: clipIds,
      },
    }

    await this.executeCommand(command)

    // Machine не принимает параметры для CUT_CLIPS, она вырезает выбранные клипы
    this.timelineActor.send({
      type: "CUT_CLIPS",
    })
  }

  async pasteClips(trackId: string, time: number) {
    logger.info("[Video Editing Orchestrator] Pasting clips:", {
      data: { trackId, time },
    })

    const command: ProjectCommand = {
      type: "PasteClips",
      params: {
        track_id: trackId,
        time,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "PASTE_CLIPS",
      trackId,
      time,
    })
  }

  async batchUpdateClips(updates: Array<{ clip_id: string; updates: any }>) {
    logger.info("[Video Editing Orchestrator] Batch updating clips:", {
      data: { count: updates.length },
    })

    const command: ProjectCommand = {
      type: "BatchUpdateClips",
      params: {
        updates,
      },
    }

    await this.executeCommand(command)

    // Отправляем индивидуальные обновления в machine для синхронизации
    for (const update of updates) {
      this.timelineActor.send({
        type: "UPDATE_CLIP",
        clipId: update.clip_id,
        updates: update.updates,
      })
    }
  }

  async selectClips(clipIds: string[], addToSelection: boolean = false) {
    logger.info("[Video Editing Orchestrator] Selecting clips:", {
      data: { clipIds, addToSelection },
    })

    const command: ProjectCommand = {
      type: "SelectClips",
      params: {
        clip_ids: clipIds,
        add_to_selection: addToSelection,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "SELECT_CLIPS",
      clipIds,
      addToSelection,
    })
  }

  async clearSelection() {
    logger.info("[Video Editing Orchestrator] Clearing selection")

    const command: ProjectCommand = {
      type: "ClearSelection",
    }
    await this.executeCommand(command)

    this.timelineActor.send({
      type: "CLEAR_SELECTION",
    })
  }

  async selectSections(sectionIds: string[], addToSelection: boolean = false) {
    logger.info("[Video Editing Orchestrator] Selecting sections:", {
      data: { sectionIds, addToSelection },
    })

    const command: ProjectCommand = {
      type: "SelectSections",
      params: {
        section_ids: sectionIds,
        add_to_selection: addToSelection,
      },
    }

    await this.executeCommand(command)

    this.timelineActor.send({
      type: "SELECT_SECTIONS",
      sectionIds,
      addToSelection,
    })
  }

  /**
   * Получить состояния машин
   */
  getTimelineState() {
    return this.timelineActor.getSnapshot()
  }

  getPlayerState() {
    return this.playerActor.getSnapshot()
  }

  /**
   * Получить акторы для прямого взаимодействия
   */
  getActors() {
    return {
      timeline: this.timelineActor,
      player: this.playerActor,
    }
  }

  /**
   * Подписка на изменения
   */
  subscribeToTimeline(callback: (state: any) => void) {
    return this.timelineActor.subscribe(callback)
  }

  subscribeToPlayer(callback: (state: any) => void) {
    return this.playerActor.subscribe(callback)
  }

  /**
   * Остановить оркестратор
   */
  stop() {
    logger.info("[Video Editing Orchestrator] Stopping...")

    // Отписываемся от backend
    if (this.backendUnsubscribe) {
      this.backendUnsubscribe()
    }

    // Останавливаем акторы
    this.timelineActor.stop()
    this.playerActor.stop()

    VideoEditingOrchestrator.instance = null
  }
}

// Хелперы для удобного доступа
export function getVideoEditingOrchestrator() {
  return VideoEditingOrchestrator.getInstance()
}

export function getTimelineActor() {
  return VideoEditingOrchestrator.getInstance().getActors().timeline
}

export function getPlayerActor() {
  return VideoEditingOrchestrator.getInstance().getActors().player
}

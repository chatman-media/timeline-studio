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
import {
  type ClipAddedEvent,
  DOMAIN_EVENTS,
  eventBus,
  type PlaybackStateChangedEvent,
  type TimelineUpdatedEvent,
} from "@/domains/shared/events"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectCommand, ProjectState } from "@/types/generated/tauri-bindings"
import { playerMachine } from "../machines/player-machine"
// Import machines
import { timelineExtendedMachine } from "../machines/timeline-extended-machine"
import { timelineMachine } from "../machines/timeline-machine"

export class VideoEditingOrchestrator {
  private static instance: VideoEditingOrchestrator | null = null

  // Actors
  private timelineExtendedActor: ActorRefFrom<typeof timelineExtendedMachine>
  private playerActor: ActorRefFrom<typeof playerMachine>
  private timelineUIActor: ActorRefFrom<typeof timelineMachine> // Для UI состояния

  // Backend sync
  private backendSync = getBackendSync()
  private backendUnsubscribe: (() => void) | null = null

  private constructor() {
    console.log("[Video Editing Orchestrator] Initializing...")

    // Создаем акторы
    this.timelineExtendedActor = createActor(timelineExtendedMachine)
    this.playerActor = createActor(playerMachine)
    this.timelineUIActor = createActor(timelineMachine)

    // Запускаем акторы
    this.timelineExtendedActor.start()
    this.playerActor.start()
    this.timelineUIActor.start()

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
    // Подписка на изменения состояния backend
    this.backendUnsubscribe = this.backendSync.onStateChange((state: ProjectState) => {
      console.log("[Video Editing Orchestrator] Backend state updated")

      // Обновляем timeline машину
      if (state.project) {
        this.timelineExtendedActor.send({
          type: "PROJECT_UPDATED",
          project: state.project,
        })
      }

      // Обновляем player машину
      if (state.playback_state) {
        this.playerActor.send({
          type: "SYNC_STATE",
          state: state.playback_state,
        })

        // Синхронизируем с timeline
        this.timelineExtendedActor.send({
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
        console.log(`[Video Editing Orchestrator] Received event: ${event.type}`)

        switch (event.type) {
          case DOMAIN_EVENTS.MEDIA.FILES_IMPORTED:
            // Можно автоматически добавить файлы на timeline
            console.log("Media files imported, ready to add to timeline")
            break

          case DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED:
            // Автоматически применить план монтажа
            console.log("Montage plan generated, ready to apply")
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
    // Синхронизация player -> timeline
    this.playerActor.subscribe((snapshot) => {
      const { currentTime, isPlaying } = snapshot.context

      // Обновляем timeline UI
      this.timelineUIActor.send({
        type: "SYNC_CURRENT_TIME",
        currentTime,
      })

      this.timelineUIActor.send({
        type: "SYNC_PLAYBACK_STATE",
        isPlaying,
        currentTime,
      })
    })

    // Синхронизация timeline UI -> extended timeline
    this.timelineUIActor.subscribe((snapshot) => {
      const { selectedClipIds, selectedTrackIds } = snapshot.context

      // Синхронизируем выделение
      this.timelineExtendedActor.send({
        type: "SELECT_CLIPS",
        clipIds: selectedClipIds,
      })

      this.timelineExtendedActor.send({
        type: "SELECT_TRACKS",
        trackIds: selectedTrackIds,
      })
    })
  }

  /**
   * Настройка публикации событий
   */
  private setupEventPublishing() {
    // Публикуем события из timeline
    this.timelineExtendedActor.subscribe((snapshot) => {
      const { project, hasUnsavedChanges } = snapshot.context

      // Публикуем обновление timeline
      if (project && snapshot.matches("active")) {
        eventBus.publish<TimelineUpdatedEvent>(DOMAIN_EVENTS.VIDEO.TIMELINE_UPDATED, "video-editing", {
          projectId: project.id,
          hasUnsavedChanges,
          duration: project.duration,
          trackCount: project.globalTracks.length,
        })
      }
    })

    // Публикуем события воспроизведения
    this.playerActor.subscribe((snapshot) => {
      const { isPlaying, currentTime, duration } = snapshot.context

      eventBus.publish<PlaybackStateChangedEvent>(DOMAIN_EVENTS.VIDEO.PLAYBACK_STATE_CHANGED, "video-editing", {
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
    console.log(`[Video Editing Orchestrator] Executing command: ${command.type}`)

    try {
      await this.backendSync.executeCommand(command)
    } catch (error) {
      console.error("[Video Editing Orchestrator] Command failed:", error)
      throw error
    }
  }

  /**
   * API для управления проектом
   */
  async createProject(name: string, settings?: any) {
    this.timelineExtendedActor.send({
      type: "CREATE_PROJECT",
      name,
      settings,
    })
  }

  async loadProject(path: string) {
    this.timelineExtendedActor.send({
      type: "LOAD_PROJECT",
      path,
    })
  }

  async saveProject() {
    this.timelineExtendedActor.send({
      type: "SAVE_PROJECT",
    })
  }

  /**
   * API для управления воспроизведением
   */
  play() {
    this.playerActor.send({ type: "PLAY" })
    this.timelineExtendedActor.send({ type: "PLAY" })
  }

  pause() {
    this.playerActor.send({ type: "PAUSE" })
    this.timelineExtendedActor.send({ type: "PAUSE" })
  }

  stopPlayback() {
    this.playerActor.send({ type: "STOP" })
    this.timelineExtendedActor.send({ type: "STOP" })
  }

  seek(time: number) {
    this.playerActor.send({ type: "SEEK", time })
    this.timelineExtendedActor.send({ type: "SEEK", time })
  }

  /**
   * API для управления треками
   */
  async addTrack(type: any, name?: string, sectionId?: string) {
    const command: ProjectCommand = {
      type: "AddTrack",
      params: {
        name: name || `${type} Track`,
        track_type: type.toUpperCase() as any,
        index: null,
      },
    }

    await this.executeCommand(command)

    this.timelineExtendedActor.send({
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

    this.timelineExtendedActor.send({
      type: "ADD_CLIP",
      trackId,
      mediaFile,
      time,
    })

    // Публикуем событие
    const clipId = `clip-${Date.now()}` // Временный ID
    eventBus.publish<ClipAddedEvent>(DOMAIN_EVENTS.VIDEO.CLIP_ADDED, "video-editing", {
      timelineId: "current", // TODO: получить реальный ID timeline
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

  /**
   * Получить состояния машин
   */
  getTimelineState() {
    return this.timelineExtendedActor.getSnapshot()
  }

  getPlayerState() {
    return this.playerActor.getSnapshot()
  }

  getTimelineUIState() {
    return this.timelineUIActor.getSnapshot()
  }

  /**
   * Получить акторы для прямого взаимодействия
   */
  getActors() {
    return {
      timeline: this.timelineExtendedActor,
      player: this.playerActor,
      timelineUI: this.timelineUIActor,
    }
  }

  /**
   * Подписка на изменения
   */
  subscribeToTimeline(callback: (state: any) => void) {
    return this.timelineExtendedActor.subscribe(callback)
  }

  subscribeToPlayer(callback: (state: any) => void) {
    return this.playerActor.subscribe(callback)
  }

  subscribeToTimelineUI(callback: (state: any) => void) {
    return this.timelineUIActor.subscribe(callback)
  }

  /**
   * Остановить оркестратор
   */
  stop() {
    console.log("[Video Editing Orchestrator] Stopping...")

    // Отписываемся от backend
    if (this.backendUnsubscribe) {
      this.backendUnsubscribe()
    }

    // Останавливаем акторы
    this.timelineExtendedActor.stop()
    this.playerActor.stop()
    this.timelineUIActor.stop()

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

export function getTimelineUIActor() {
  return VideoEditingOrchestrator.getInstance().getActors().timelineUI
}

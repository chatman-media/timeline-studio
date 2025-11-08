/**
 * Timeline Player Synchronization Service
 *
 * Синхронизирует выбранный клип в timeline с video player
 */

import { createLogger } from "@/lib/tauri-logger"
import { isServiceEnabled } from "../../../shared/config/service-config"
import type { TimelineClip } from "../types"
import { interpolateSpeed } from "../utils/speed-ramping-utils"

const logger = createLogger("TimelinePlayerSync")

interface PlayerContext {
  // Backend команды для управления плеером
  playerSetMedia: (mediaId: string, startTime?: number) => Promise<void>
  playerSelectClip: (clipId: string) => Promise<void>
  playerClearSelection: () => Promise<void>
  playerSetSource: (source: "browser" | "timeline") => Promise<void>
  playerApplyEffect: (effectId: string, params: Record<string, any>) => Promise<void>
  playerApplyFilter: (filterId: string, params: Record<string, any>) => Promise<void>
  playerApplyTemplate: (templateId: string, mediaIds: string[]) => Promise<void>
  playerClearEffects: () => Promise<void>
  playerClearFilters: () => Promise<void>
  playerClearTemplate: () => Promise<void>
  seek: (time: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>

  // Локальные состояния для совместимости
  speedRampingEnabled?: boolean
  basePlaybackRate?: number
  setSpeedRampingEnabled?: (enabled: boolean) => void
  updatePlaybackRate?: (rate: number) => void
}

export class TimelinePlayerSync {
  private static instance: TimelinePlayerSync | null = null
  private playerContext: PlayerContext | null = null
  private currentSelectedClip: TimelineClip | null = null

  private isTimelinePlayerServiceEnabled: boolean

  private constructor() {
    this.isTimelinePlayerServiceEnabled = isServiceEnabled("TIMELINE_PLAYER")
  }

  static getInstance(): TimelinePlayerSync {
    if (!TimelinePlayerSync.instance) {
      TimelinePlayerSync.instance = new TimelinePlayerSync()
    }
    return TimelinePlayerSync.instance
  }

  /**
   * Устанавливает контекст плеера для синхронизации
   */
  setPlayerContext(context: PlayerContext) {
    if (!this.isTimelinePlayerServiceEnabled) {
      return
    }
    this.playerContext = context
    logger.info("[TimelinePlayerSync] Player context set")
  }

  /**
   * Синхронизирует выбранный клип с плеером через backend команды
   */
  async syncSelectedClip(clip: TimelineClip | null) {
    if (!this.isTimelinePlayerServiceEnabled) {
      return
    }

    // Если клип не выбран, очищаем выбор
    if (!clip) {
      await this.clearSelection()
      return
    }

    // Если нет контекста плеера, пропускаем
    if (!this.playerContext) {
      logger.warn("[TimelinePlayerSync] No player context")
      return
    }

    // Если это тот же клип, не обновляем
    if (this.currentSelectedClip?.id === clip.id) {
      return
    }

    try {
      this.currentSelectedClip = clip

      logger.info("[TimelinePlayerSync] Syncing clip to player:", { clipName: clip.name })

      // Устанавливаем источник как timeline через backend
      await this.playerContext.playerSetSource("timeline")

      // Выбираем клип в плеере через backend
      await this.playerContext.playerSelectClip(clip.id)

      // Устанавливаем медиа в плеер (если есть mediaId)
      if (clip.mediaId) {
        await this.playerContext.playerSetMedia(clip.mediaId, clip.mediaStartTime || 0)
      }

      // Применяем эффекты, фильтры и шаблоны клипа
      await this.applyClipResources(clip)
    } catch (error) {
      logger.error("[TimelinePlayerSync] Failed to sync clip:", { error })
    }
  }

  /**
   * Применяет ресурсы (эффекты, фильтры, шаблоны) из клипа к плееру через backend команды
   */
  private async applyClipResources(clip: TimelineClip) {
    if (!this.isTimelinePlayerServiceEnabled) {
      return
    }

    if (!this.playerContext) return

    try {
      // Очищаем предыдущие эффекты/фильтры/шаблоны через backend
      await this.playerContext.playerClearEffects()
      await this.playerContext.playerClearFilters()
      await this.playerContext.playerClearTemplate()

      // Применяем эффекты через backend
      if (clip.effects) {
        for (const effect of clip.effects) {
          await this.playerContext.playerApplyEffect(effect.effectId, effect.customParams || {})
        }
      }

      // Применяем фильтры через backend
      if (clip.filters) {
        for (const filter of clip.filters) {
          await this.playerContext.playerApplyFilter(filter.filterId, filter.customParams || {})
        }
      }

      // Применяем шаблон если есть через backend
      if ((clip as any).templateId) {
        const mediaIds = clip.mediaId ? [clip.mediaId] : []
        await this.playerContext.playerApplyTemplate((clip as any).templateId, mediaIds)
      }
    } catch (error) {
      logger.error("[TimelinePlayerSync] Failed to apply clip resources:", { error })
    }
  }

  /**
   * Обновляет время воспроизведения в плеере при изменении времени в timeline
   */
  async syncPlaybackTime(timelineTime: number) {
    if (!this.isTimelinePlayerServiceEnabled) {
      return
    }

    if (!this.playerContext || !this.currentSelectedClip) {
      return
    }

    // Вычисляем время относительно клипа
    const clipRelativeTime = timelineTime - this.currentSelectedClip.startTime

    // Проверяем, находится ли время в пределах клипа
    if (clipRelativeTime >= 0 && clipRelativeTime <= this.currentSelectedClip.duration) {
      try {
        // Конвертируем в время медиафайла
        const mediaTime = (this.currentSelectedClip.mediaStartTime || 0) + clipRelativeTime
        await this.playerContext.seek(mediaTime)

        // Обновляем скорость воспроизведения если включен speed ramping
        await this.updateSpeedRamping(clipRelativeTime)
      } catch (error) {
        logger.error("[TimelinePlayerSync] Failed to sync playback time:", { error })
      }
    }
  }

  /**
   * Вычисляет и применяет speed ramping для текущего времени
   */
  private async updateSpeedRamping(clipRelativeTime: number) {
    if (!this.isTimelinePlayerServiceEnabled) {
      return
    }

    if (!this.playerContext || !this.currentSelectedClip) {
      return
    }

    // Проверяем, включен ли speed ramping для клипа
    const speedRampingConfig = (this.currentSelectedClip as any).speedRamping
    if (!speedRampingConfig?.enabled || !speedRampingConfig?.keyframes?.length) {
      // Если speed ramping выключен, устанавливаем базовую скорость
      if (this.playerContext.speedRampingEnabled) {
        this.playerContext.setSpeedRampingEnabled?.(false)
        if (this.playerContext.basePlaybackRate) {
          await this.playerContext.setPlaybackRate(this.playerContext.basePlaybackRate)
        }
      }
      return
    }

    // Включаем speed ramping в плеере если он не включен
    if (!this.playerContext.speedRampingEnabled) {
      this.playerContext.setSpeedRampingEnabled?.(true)
    }

    // Вычисляем скорость для текущего времени
    const speed = interpolateSpeed(speedRampingConfig.keyframes, clipRelativeTime)
    const baseRate = this.playerContext.basePlaybackRate || 1.0
    const finalRate = baseRate * speed

    // Обновляем скорость воспроизведения через backend
    try {
      await this.playerContext.setPlaybackRate(finalRate)
    } catch (error) {
      logger.error("[TimelinePlayerSync] Failed to update playback rate:", { error })
    }
  }

  /**
   * Очищает текущий выбранный клип через backend команды
   */
  async clearSelection() {
    if (!this.isTimelinePlayerServiceEnabled) {
      return
    }

    this.currentSelectedClip = null

    if (this.playerContext) {
      try {
        // Возвращаем источник на browser через backend
        await this.playerContext.playerSetSource("browser")

        // Очищаем выбор клипа через backend
        await this.playerContext.playerClearSelection()

        // Очищаем эффекты/фильтры/шаблоны через backend
        await this.playerContext.playerClearEffects()
        await this.playerContext.playerClearFilters()
        await this.playerContext.playerClearTemplate()
      } catch (error) {
        logger.error("[TimelinePlayerSync] Failed to clear selection:", { error })
      }
    }

    logger.info("[TimelinePlayerSync] Selection cleared")
  }

  /**
   * Проверяет, синхронизирован ли данный клип с плеером
   */
  isClipSynced(clipId: string): boolean {
    return this.currentSelectedClip?.id === clipId
  }
}

// Экспортируем singleton instance
export const timelinePlayerSync = TimelinePlayerSync.getInstance()

/**
 * Сервис для управления Split Edit операциями
 */

import type {
  SplitEdit,
  SplitEditConfig,
  SplitEditOperation,
  SplitEditToolSettings,
  SplitEditVisual,
} from "../types/split-edit"
import {
  calculateJCutParams,
  calculateLCutParams,
  canPerformSplitEdit,
  createDefaultSplitEditConfig,
  createDefaultSplitEditSettings,
  createSplitEdit,
  getSplitEditsForClip,
  removeSplitEdit,
} from "../types/split-edit"
import type { TimelineClip } from "../types/timeline"

export interface SplitEditService {
  /** Получить текущую конфигурацию */
  getConfig(): SplitEditConfig
  /** Обновить конфигурацию */
  updateConfig(config: Partial<SplitEditConfig>): void
  /** Получить настройки инструмента */
  getToolSettings(): SplitEditToolSettings
  /** Обновить настройки инструмента */
  updateToolSettings(settings: Partial<SplitEditToolSettings>): void

  /** Выполнить split edit операцию */
  performSplitEdit(
    operation: SplitEditOperation,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  }

  /** Создать L-cut */
  createLCut(
    videoClipId: string,
    audioClipId: string,
    position: number,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  }

  /** Создать J-cut */
  createJCut(
    videoClipId: string,
    audioClipId: string,
    position: number,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  }

  /** Разделить клип в позиции playhead */
  splitAtPlayhead(
    clipId: string,
    position: number,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  }

  /** Удалить split edit */
  removeSplitEdit(splitEditId: string): boolean

  /** Получить все split edits для клипа */
  getSplitEditsForClip(clipId: string): SplitEdit[]

  /** Получить активные split edits */
  getActiveSplitEdits(): SplitEdit[]

  /** Очистить все split edits */
  clearAllSplitEdits(): void

  /** Получить визуальные настройки */
  getVisualSettings(): SplitEditVisual

  /** Обновить позицию предварительного просмотра */
  updatePreviewPosition(position: number): void

  /** Показать предварительный просмотр */
  showPreview(position: number, type: "L-cut" | "J-cut" | "split-at-playhead"): void

  /** Скрыть предварительный просмотр */
  hidePreview(): void

  /** Проверить возможность выполнения операции */
  canPerformOperation(operation: SplitEditOperation, clips: TimelineClip[]): boolean

  /** Получить связанные клипы */
  getLinkedClips(
    clipId: string,
    clips: TimelineClip[],
  ): {
    videoClip?: TimelineClip
    audioClip?: TimelineClip
  }

  /** Синхронизировать split edits */
  syncSplitEdits(clips: TimelineClip[]): void

  /** Получить snap позицию */
  getSnapPosition(position: number, clips: TimelineClip[]): number

  /** Валидировать split edit */
  validateSplitEdit(splitEdit: SplitEdit, clips: TimelineClip[]): boolean
}

export class SplitEditServiceImpl implements SplitEditService {
  private config: SplitEditConfig
  private toolSettings: SplitEditToolSettings
  private visualSettings: SplitEditVisual

  constructor(initialConfig?: Partial<SplitEditConfig>, initialToolSettings?: Partial<SplitEditToolSettings>) {
    this.config = { ...createDefaultSplitEditConfig(), ...initialConfig }
    this.toolSettings = { ...createDefaultSplitEditSettings(), ...initialToolSettings }
    this.visualSettings = {
      showPreview: false,
      previewPosition: 0,
      operationType: "split-at-playhead",
      indicatorColor: "#3b82f6",
      indicatorOpacity: 0.8,
    }
  }

  getConfig(): SplitEditConfig {
    return { ...this.config }
  }

  updateConfig(config: Partial<SplitEditConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getToolSettings(): SplitEditToolSettings {
    return { ...this.toolSettings }
  }

  updateToolSettings(settings: Partial<SplitEditToolSettings>): void {
    this.toolSettings = { ...this.toolSettings, ...settings }
  }

  performSplitEdit(
    operation: SplitEditOperation,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  } {
    if (!this.canPerformOperation(operation, clips)) {
      return {
        success: false,
        error: "Cannot perform split edit operation",
      }
    }

    switch (operation.type) {
      case "create":
        switch (operation.splitType) {
          case "L-cut":
            return this.createLCut(operation.clipId, operation.clipId, operation.position, clips)
          case "J-cut":
            return this.createJCut(operation.clipId, operation.clipId, operation.position, clips)
          case "split-at-playhead":
            return this.splitAtPlayhead(operation.clipId, operation.position, clips)
          default:
            return { success: false, error: "Unknown split type" }
        }
      case "remove": {
        const removed = this.removeSplitEdit(operation.clipId)
        return { success: removed }
      }
      case "adjust":
        // Реализация корректировки split edit
        return { success: true }
      default:
        return { success: false, error: "Unknown operation type" }
    }
  }

  createLCut(
    videoClipId: string,
    audioClipId: string,
    position: number,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  } {
    if (!canPerformSplitEdit(videoClipId, audioClipId, position, clips)) {
      return {
        success: false,
        error: "Cannot create L-cut at this position",
      }
    }

    const videoClip = clips.find((c) => c.id === videoClipId)
    const audioClip = clips.find((c) => c.id === audioClipId)

    if (!videoClip || !audioClip) {
      return {
        success: false,
        error: "Video or audio clip not found",
      }
    }

    const splitEdit = createSplitEdit(videoClipId, audioClipId, position, "L-cut")
    const params = calculateLCutParams(videoClip, audioClip, position)

    // Обновляем клипы
    const updatedClips = clips.map((clip) => {
      if (clip.id === videoClipId) {
        return {
          ...clip,
          startTime: params.newVideoStart,
          duration: clip.duration - (params.newVideoStart - clip.startTime),
        }
      }
      if (clip.id === audioClipId) {
        return {
          ...clip,
          duration: params.newAudioEnd - clip.startTime,
        }
      }
      return clip
    })

    // Добавляем split edit в конфигурацию
    this.config.activeEdits.push(splitEdit)

    return {
      success: true,
      splitEdit,
      updatedClips,
    }
  }

  createJCut(
    videoClipId: string,
    audioClipId: string,
    position: number,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  } {
    if (!canPerformSplitEdit(videoClipId, audioClipId, position, clips)) {
      return {
        success: false,
        error: "Cannot create J-cut at this position",
      }
    }

    const videoClip = clips.find((c) => c.id === videoClipId)
    const audioClip = clips.find((c) => c.id === audioClipId)

    if (!videoClip || !audioClip) {
      return {
        success: false,
        error: "Video or audio clip not found",
      }
    }

    const splitEdit = createSplitEdit(videoClipId, audioClipId, position, "J-cut")
    const params = calculateJCutParams(videoClip, audioClip, position)

    // Обновляем клипы
    const updatedClips = clips.map((clip) => {
      if (clip.id === videoClipId) {
        return {
          ...clip,
          duration: params.newVideoEnd - clip.startTime,
        }
      }
      if (clip.id === audioClipId) {
        return {
          ...clip,
          startTime: params.newAudioStart,
          duration: clip.duration - (params.newAudioStart - clip.startTime),
        }
      }
      return clip
    })

    // Добавляем split edit в конфигурацию
    this.config.activeEdits.push(splitEdit)

    return {
      success: true,
      splitEdit,
      updatedClips,
    }
  }

  splitAtPlayhead(
    clipId: string,
    position: number,
    clips: TimelineClip[],
  ): {
    success: boolean
    splitEdit?: SplitEdit
    updatedClips?: TimelineClip[]
    error?: string
  } {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip) {
      return {
        success: false,
        error: "Clip not found",
      }
    }

    if (position < clip.startTime || position > clip.startTime + clip.duration) {
      return {
        success: false,
        error: "Position outside clip bounds",
      }
    }

    const splitEdit = createSplitEdit(clipId, clipId, position, "split-at-playhead")

    // Создаем два новых клипа
    const firstClip = {
      ...clip,
      id: `${clip.id}-first`,
      duration: position - clip.startTime,
    }

    const secondClip = {
      ...clip,
      id: `${clip.id}-second`,
      startTime: position,
      duration: clip.duration - (position - clip.startTime),
    }

    // Обновляем массив клипов
    const updatedClips = clips.map((c) => {
      if (c.id === clipId) {
        return firstClip
      }
      return c
    })
    updatedClips.push(secondClip)

    // Добавляем split edit в конфигурацию
    this.config.activeEdits.push(splitEdit)

    return {
      success: true,
      splitEdit,
      updatedClips,
    }
  }

  removeSplitEdit(splitEditId: string): boolean {
    const initialLength = this.config.activeEdits.length
    this.config.activeEdits = removeSplitEdit(splitEditId, this.config.activeEdits)
    return this.config.activeEdits.length < initialLength
  }

  getSplitEditsForClip(clipId: string): SplitEdit[] {
    return getSplitEditsForClip(clipId, this.config.activeEdits)
  }

  getActiveSplitEdits(): SplitEdit[] {
    return this.config.activeEdits.filter((edit) => edit.isActive)
  }

  clearAllSplitEdits(): void {
    this.config.activeEdits = []
  }

  getVisualSettings(): SplitEditVisual {
    return { ...this.visualSettings }
  }

  updatePreviewPosition(position: number): void {
    this.visualSettings.previewPosition = position
    this.config.previewPosition = position
  }

  showPreview(position: number, type: "L-cut" | "J-cut" | "split-at-playhead"): void {
    this.visualSettings.showPreview = true
    this.visualSettings.previewPosition = position
    this.visualSettings.operationType = type
    this.config.previewPosition = position
  }

  hidePreview(): void {
    this.visualSettings.showPreview = false
    this.config.previewPosition = undefined
  }

  canPerformOperation(operation: SplitEditOperation, clips: TimelineClip[]): boolean {
    const clip = clips.find((c) => c.id === operation.clipId)
    if (!clip) return false

    return canPerformSplitEdit(operation.clipId, operation.clipId, operation.position, clips)
  }

  getLinkedClips(
    clipId: string,
    clips: TimelineClip[],
  ): {
    videoClip?: TimelineClip
    audioClip?: TimelineClip
  } {
    const clip = clips.find((c) => c.id === clipId)
    if (!clip) return {}

    // Если клип связан с другим клипом
    if (clip.linkedClipId) {
      const linkedClip = clips.find((c) => c.id === clip.linkedClipId)
      if (linkedClip) {
        // Определяем, какой клип видео, а какой аудио по типу клипа
        if (clip.type === "video") {
          return { videoClip: clip, audioClip: linkedClip }
        }
        return { videoClip: linkedClip, audioClip: clip }
      }
    }

    // Если клип не связан, он может быть самостоятельным
    return { videoClip: clip, audioClip: clip }
  }

  syncSplitEdits(clips: TimelineClip[]): void {
    // Синхронизация split edits с изменениями в клипах
    this.config.activeEdits = this.config.activeEdits.filter((edit) => {
      return this.validateSplitEdit(edit, clips)
    })
  }

  getSnapPosition(position: number, clips: TimelineClip[]): number {
    if (!this.toolSettings.magneticSnap) return position

    const snapDistance = this.toolSettings.snapDistance
    const snapTargets: number[] = []

    // Собираем все позиции для snap
    clips.forEach((clip) => {
      snapTargets.push(clip.startTime)
      snapTargets.push(clip.startTime + clip.duration)
    })

    // Добавляем позиции split edits
    this.config.activeEdits.forEach((edit) => {
      snapTargets.push(edit.position)
    })

    // Находим ближайшую позицию для snap
    const sortedTargets = snapTargets.sort((a, b) => a - b)
    for (const target of sortedTargets) {
      if (Math.abs(position - target) <= snapDistance) {
        return target
      }
    }

    return position
  }

  validateSplitEdit(splitEdit: SplitEdit, clips: TimelineClip[]): boolean {
    const videoClip = clips.find((c) => c.id === splitEdit.videoClipId)
    const audioClip = clips.find((c) => c.id === splitEdit.audioClipId)

    if (!videoClip || !audioClip) return false

    return canPerformSplitEdit(splitEdit.videoClipId, splitEdit.audioClipId, splitEdit.position, clips)
  }
}

/**
 * Hook для batch операций над множественными клипами
 */

import { useCallback } from "react"
import {
  type BatchColorOptions,
  type BatchEffectOptions,
  type BatchMoveOptions,
  type BatchOperationResult,
  BatchOperationsService,
  type BatchSpeedOptions,
  type BatchTrimOptions,
} from "../../services/batch-operations-service"
import type { AppliedEffect, TimelineClip } from "../../types"
import { useTimeline } from "../state/use-timeline"
import { useTimelineSelection } from "../state/use-timeline-selection"
import { useTracks } from "../state/use-tracks"

export interface UseBatchOperationsReturn {
  // Базовые операции
  moveSelectedClips: (options: BatchMoveOptions) => Promise<BatchOperationResult>
  trimSelectedClips: (options: BatchTrimOptions) => Promise<BatchOperationResult>
  changeSelectedClipsSpeed: (options: BatchSpeedOptions) => Promise<BatchOperationResult>

  // Эффекты и цвет
  applyEffectToSelected: (effect: AppliedEffect, options?: Partial<BatchEffectOptions>) => Promise<BatchOperationResult>
  applyColorSettingsToSelected: (options: BatchColorOptions) => Promise<BatchOperationResult>
  removeAllEffectsFromSelected: () => Promise<BatchOperationResult>

  // Выравнивание и распределение
  alignSelectedClips: (alignment: "start" | "end" | "center", referenceTime?: number) => Promise<BatchOperationResult>
  distributeSelectedClips: (spacing: number, startTime?: number) => Promise<BatchOperationResult>
  syncSelectedClipsByMarker: (
    markerTime: number,
    syncPoint?: "start" | "end" | "center",
  ) => Promise<BatchOperationResult>

  // Переходы
  createTransitionsBetween: (duration: number, type?: string) => Promise<BatchOperationResult>

  // Утилиты
  batchOperation: (
    clips: TimelineClip[],
    operation: (clips: TimelineClip[]) => BatchOperationResult,
  ) => Promise<BatchOperationResult>
}

export function useBatchOperations(): UseBatchOperationsReturn {
  const { batchUpdateClips, project } = useTimeline()
  const { selectedClips } = useTimelineSelection()
  const { tracks } = useTracks()

  // Общая функция для выполнения batch операций
  const batchOperation = useCallback(
    async (
      clips: TimelineClip[],
      operation: (clips: TimelineClip[]) => BatchOperationResult,
    ): Promise<BatchOperationResult> => {
      if (clips.length === 0) {
        return {
          success: false,
          processedClips: [],
          failedClips: [],
          totalProcessed: 0,
          totalFailed: 0,
        }
      }

      // Выполняем операцию
      const result = operation(clips)

      // Если операция успешна, обновляем состояние timeline
      if (result.success && result.processedClips.length > 0) {
        await batchUpdateClips(result.processedClips)
      }

      return result
    },
    [batchUpdateClips],
  )

  // Перемещение выбранных клипов
  const moveSelectedClips = useCallback(
    async (options: BatchMoveOptions): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) => BatchOperationsService.moveClips(clips, tracks, options))
    },
    [selectedClips, tracks, batchOperation],
  )

  // Обрезка выбранных клипов
  const trimSelectedClips = useCallback(
    async (options: BatchTrimOptions): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) => BatchOperationsService.trimClips(clips, options))
    },
    [selectedClips, batchOperation],
  )

  // Изменение скорости выбранных клипов
  const changeSelectedClipsSpeed = useCallback(
    async (options: BatchSpeedOptions): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) => BatchOperationsService.changeSpeed(clips, options))
    },
    [selectedClips, batchOperation],
  )

  // Применение эффекта к выбранным клипам
  const applyEffectToSelected = useCallback(
    async (effect: AppliedEffect, options?: Partial<BatchEffectOptions>): Promise<BatchOperationResult> => {
      const effectOptions: BatchEffectOptions = {
        effect,
        replaceExisting: options?.replaceExisting ?? false,
        position: options?.position ?? "end",
      }

      return batchOperation(selectedClips, (clips) => BatchOperationsService.applyEffect(clips, effectOptions))
    },
    [selectedClips, batchOperation],
  )

  // Применение цветовых настроек к выбранным клипам
  const applyColorSettingsToSelected = useCallback(
    async (options: BatchColorOptions): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) => BatchOperationsService.applyColorSettings(clips, options))
    },
    [selectedClips, batchOperation],
  )

  // Удаление всех эффектов с выбранных клипов
  const removeAllEffectsFromSelected = useCallback(async (): Promise<BatchOperationResult> => {
    return batchOperation(selectedClips, (clips) => BatchOperationsService.removeAllEffects(clips))
  }, [selectedClips, batchOperation])

  // Выравнивание выбранных клипов
  const alignSelectedClips = useCallback(
    async (alignment: "start" | "end" | "center", referenceTime?: number): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) =>
        BatchOperationsService.alignClips(clips, alignment, referenceTime),
      )
    },
    [selectedClips, batchOperation],
  )

  // Распределение выбранных клипов
  const distributeSelectedClips = useCallback(
    async (spacing: number, startTime?: number): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) => BatchOperationsService.distributeClips(clips, spacing, startTime))
    },
    [selectedClips, batchOperation],
  )

  // Синхронизация по маркеру
  const syncSelectedClipsByMarker = useCallback(
    async (markerTime: number, syncPoint: "start" | "end" | "center" = "start"): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) =>
        BatchOperationsService.syncClipsByMarkers(clips, markerTime, syncPoint),
      )
    },
    [selectedClips, batchOperation],
  )

  // Создание переходов между выбранными клипами
  const createTransitionsBetween = useCallback(
    async (duration: number, type: string = "crossfade"): Promise<BatchOperationResult> => {
      return batchOperation(selectedClips, (clips) =>
        BatchOperationsService.createTransitionsBetweenClips(clips, duration, type),
      )
    },
    [selectedClips, batchOperation],
  )

  return {
    // Базовые операции
    moveSelectedClips,
    trimSelectedClips,
    changeSelectedClipsSpeed,

    // Эффекты и цвет
    applyEffectToSelected,
    applyColorSettingsToSelected,
    removeAllEffectsFromSelected,

    // Выравнивание и распределение
    alignSelectedClips,
    distributeSelectedClips,
    syncSelectedClipsByMarker,

    // Переходы
    createTransitionsBetween,

    // Утилиты
    batchOperation,
  }
}

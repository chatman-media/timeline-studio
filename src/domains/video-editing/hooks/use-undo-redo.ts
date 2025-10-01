/**
 * Domain Hook для работы с расширенной Undo/Redo системой
 */

// Локальный тип для Clip
interface Clip {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  mediaId: string
}

import { useCallback, useEffect, useMemo, useRef } from "react"
import { type ActionType, type UndoRedoAction, UndoRedoService } from "../services/undo-redo-service"
import { getVideoEditingOrchestrator } from "../services/video-editing-orchestrator"

export interface UseUndoRedoReturn {
  // Основные операции
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>

  // Множественные операции
  undoMultiple: (count: number) => Promise<boolean>
  redoMultiple: (count: number) => Promise<boolean>

  // Селективная отмена
  undoToAction: (actionId: string) => Promise<boolean>
  undoByType: (actionType: ActionType, maxCount?: number) => Promise<boolean>
  undoByEntity: (entityIds: string[], entityType: "clips" | "tracks" | "keyframes") => Promise<boolean>

  // Группировка
  startGrouping: (description?: string) => string
  endGrouping: () => void
  undoGroup: (groupId: string) => Promise<boolean>

  // Состояние
  canUndo: boolean
  canRedo: boolean
  historyStats: ReturnType<UndoRedoService["getHistoryStats"]>
  undoableActions: UndoRedoAction[]
  redoableActions: UndoRedoAction[]

  // Управление
  clearHistory: () => void
  optimizeHistory: () => void
  setMaxHistorySize: (size: number) => void

  // Регистрация действий (используется провайдерами)
  registerAction: (action: Omit<UndoRedoAction, "id" | "timestamp">) => string
}

export function useUndoRedo(): UseUndoRedoReturn {
  const service = useMemo(() => UndoRedoService.getInstance(), [])
  const serviceRef = useRef(service)
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline

  // Применяет действие отмены/повтора к timeline
  const applyAction = useCallback(
    async (action: UndoRedoAction, isUndo: boolean): Promise<boolean> => {
      try {
        const actionData = isUndo ? action.undoData : action.redoData

        switch (action.type) {
          case "ADD_CLIP":
            if (isUndo) {
              await orchestrator.executeCommand({
                type: "DeleteClip",
                params: { clip_id: actionData.clipId },
              })
              timelineActor.send({ type: "REMOVE_CLIP", clipId: actionData.clipId })
            } else {
              await orchestrator.addClip(actionData.trackId, actionData.mediaFile, actionData.time)
            }
            break

          case "REMOVE_CLIP":
            if (isUndo) {
              // Восстанавливаем клип
              await orchestrator.addClip(actionData.trackId, actionData.mediaFile, actionData.time)
              // Восстанавливаем свойства клипа
              if (actionData.clipProperties) {
                await orchestrator.executeCommand({
                  type: "UpdateClip",
                  params: {
                    clip_id: actionData.clipId,
                    updates: actionData.clipProperties,
                  },
                })
              }
            } else {
              await orchestrator.executeCommand({
                type: "DeleteClip",
                params: { clip_id: actionData.clipId },
              })
              timelineActor.send({ type: "REMOVE_CLIP", clipId: actionData.clipId })
            }
            break

          case "MOVE_CLIP":
            if (isUndo) {
              await orchestrator.executeCommand({
                type: "MoveClip",
                params: {
                  clip_id: actionData.clipId,
                  track_id: actionData.oldTrackId,
                  time: actionData.oldTime,
                },
              })
            } else {
              await orchestrator.executeCommand({
                type: "MoveClip",
                params: {
                  clip_id: actionData.clipId,
                  track_id: actionData.newTrackId,
                  time: actionData.newTime,
                },
              })
            }
            break

          case "TRIM_CLIP":
            if (isUndo) {
              await orchestrator.executeCommand({
                type: "TrimClip",
                params: {
                  clip_id: actionData.clipId,
                  start: actionData.oldStartTime,
                  end: actionData.oldEndTime,
                },
              })
            } else {
              await orchestrator.executeCommand({
                type: "TrimClip",
                params: {
                  clip_id: actionData.clipId,
                  start: actionData.newStartTime,
                  end: actionData.newEndTime,
                },
              })
            }
            break

          case "UPDATE_CLIP":
            if (isUndo) {
              await orchestrator.executeCommand({
                type: "UpdateClip",
                params: {
                  clip_id: actionData.clipId,
                  updates: actionData.oldProperties,
                },
              })
            } else {
              await orchestrator.executeCommand({
                type: "UpdateClip",
                params: {
                  clip_id: actionData.clipId,
                  updates: actionData.newProperties,
                },
              })
            }
            break

          case "ADD_TRACK":
            if (isUndo) {
              await orchestrator.executeCommand({
                type: "DeleteTrack",
                params: { track_id: actionData.trackId },
              })
              timelineActor.send({ type: "REMOVE_TRACK", trackId: actionData.trackId })
            } else {
              await orchestrator.addTrack(actionData.trackType, actionData.trackName)
            }
            break

          case "REMOVE_TRACK":
            if (isUndo) {
              await orchestrator.addTrack(actionData.trackType, actionData.trackName)
              // Восстанавливаем все клипы на треке
              for (const clip of actionData.clips || []) {
                await orchestrator.addClip(actionData.trackId, clip.mediaFile, clip.startTime)
              }
            } else {
              await orchestrator.executeCommand({
                type: "DeleteTrack",
                params: { track_id: actionData.trackId },
              })
              timelineActor.send({ type: "REMOVE_TRACK", trackId: actionData.trackId })
            }
            break

          case "UPDATE_TRACK":
            if (isUndo) {
              await orchestrator.executeCommand({
                type: "UpdateTrack",
                params: {
                  track_id: actionData.trackId,
                  updates: actionData.oldProperties,
                },
              })
            } else {
              await orchestrator.executeCommand({
                type: "UpdateTrack",
                params: {
                  track_id: actionData.trackId,
                  updates: actionData.newProperties,
                },
              })
            }
            break

          case "BATCH_OPERATION":
            if (isUndo) {
              // Восстанавливаем исходное состояние клипов
              if (actionData.originalClips) {
                for (const clip of actionData.originalClips) {
                  await orchestrator.executeCommand({
                    type: "UpdateClip",
                    params: {
                      clip_id: clip.id,
                      updates: clip,
                    },
                  })
                }
              }
            } else {
              // Применяем batch операцию
              if (actionData.updatedClips) {
                for (const clip of actionData.updatedClips) {
                  await orchestrator.executeCommand({
                    type: "UpdateClip",
                    params: {
                      clip_id: clip.id,
                      updates: clip,
                    },
                  })
                }
              }
            }
            break

          // Добавляем поддержку keyframes, эффектов и других операций
          default:
            console.warn(`Неподдерживаемый тип действия: ${action.type}`)
            return false
        }

        return true
      } catch (error) {
        console.error("Ошибка применения действия:", error)
        return false
      }
    },
    [orchestrator, timelineActor],
  )

  // Основные операции
  const undo = useCallback(async (): Promise<boolean> => {
    const result = serviceRef.current.undo()
    if (result.success && result.action) {
      return await applyAction(result.action, true)
    }
    return false
  }, [applyAction])

  const redo = useCallback(async (): Promise<boolean> => {
    const result = serviceRef.current.redo()
    if (result.success && result.action) {
      return await applyAction(result.action, false)
    }
    return false
  }, [applyAction])

  // Множественные операции
  const undoMultiple = useCallback(
    async (count: number): Promise<boolean> => {
      const results = serviceRef.current.undoMultiple(count)
      let allSuccess = true

      for (const result of results.reverse()) {
        // Reverse для правильного порядка применения
        if (result.success && result.action) {
          const success = await applyAction(result.action, true)
          if (!success) allSuccess = false
        }
      }

      return allSuccess
    },
    [applyAction],
  )

  const redoMultiple = useCallback(
    async (count: number): Promise<boolean> => {
      const results = serviceRef.current.redoMultiple(count)
      let allSuccess = true

      for (const result of results) {
        if (result.success && result.action) {
          const success = await applyAction(result.action, false)
          if (!success) allSuccess = false
        }
      }

      return allSuccess
    },
    [applyAction],
  )

  // Селективная отмена
  const undoToAction = useCallback(async (actionId: string): Promise<boolean> => {
    const result = serviceRef.current.undoToAction(actionId)
    return result.success
  }, [])

  const undoByType = useCallback(async (actionType: ActionType, maxCount: number = 10): Promise<boolean> => {
    const results = serviceRef.current.undoByType(actionType, maxCount)
    return results.length > 0 && results.every((r) => r.success)
  }, [])

  const undoByEntity = useCallback(
    async (entityIds: string[], entityType: "clips" | "tracks" | "keyframes"): Promise<boolean> => {
      const results = serviceRef.current.undoByEntity(entityIds, entityType)
      return results.length > 0 && results.every((r) => r.success)
    },
    [],
  )

  // Группировка
  const startGrouping = useCallback((description?: string): string => {
    return serviceRef.current.startGrouping(description)
  }, [])

  const endGrouping = useCallback((): void => {
    serviceRef.current.endGrouping()
  }, [])

  const undoGroup = useCallback(async (groupId: string): Promise<boolean> => {
    const result = serviceRef.current.undoGroup(groupId)
    return result.success
  }, [])

  // Регистрация действий
  const registerAction = useCallback((action: Omit<UndoRedoAction, "id" | "timestamp">): string => {
    return serviceRef.current.addAction(action)
  }, [])

  // Управление
  const clearHistory = useCallback((): void => {
    serviceRef.current.clearHistory()
  }, [])

  const optimizeHistory = useCallback((): void => {
    serviceRef.current.optimizeHistory()
  }, [])

  const setMaxHistorySize = useCallback((size: number): void => {
    serviceRef.current.setMaxHistorySize(size)
  }, [])

  // Состояние (вычисляется каждый рендер для актуальности)
  const canUndo = serviceRef.current.canUndo()
  const canRedo = serviceRef.current.canRedo()
  const historyStats = serviceRef.current.getHistoryStats()
  const undoableActions = serviceRef.current.getUndoableActions(10)
  const redoableActions = serviceRef.current.getRedoableActions(10)

  // Автоматическая оптимизация истории отключена по требованию
  // useEffect(() => { ... }, [])

  return {
    // Основные операции
    undo,
    redo,

    // Множественные операции
    undoMultiple,
    redoMultiple,

    // Селективная отмена
    undoToAction,
    undoByType,
    undoByEntity,

    // Группировка
    startGrouping,
    endGrouping,
    undoGroup,

    // Состояние
    canUndo,
    canRedo,
    historyStats,
    undoableActions,
    redoableActions,

    // Управление
    clearHistory,
    optimizeHistory,
    setMaxHistorySize,

    // Регистрация действий
    registerAction,
  }
}

// Хелперы для создания action данных
export const UndoRedoHelpers = {
  createAddClipAction: (clipId: string, trackId: string, mediaFile: any, time: number) => ({
    type: "ADD_CLIP" as ActionType,
    description: `Добавить клип "${mediaFile.name || clipId}"`,
    undoData: { clipId },
    redoData: { clipId, trackId, mediaFile, time },
    affectedEntities: { clips: [clipId], tracks: [trackId] },
    priority: "medium" as const,
    mergeable: false,
  }),

  createRemoveClipAction: (clip: Clip) => ({
    type: "REMOVE_CLIP" as ActionType,
    description: "Удалить клип",
    undoData: {
      clipId: clip.id,
      trackId: clip.trackId,
      mediaFile: clip.mediaId,
      time: clip.startTime,
      clipProperties: clip,
    },
    redoData: { clipId: clip.id },
    affectedEntities: { clips: [clip.id], tracks: [clip.trackId] },
    priority: "high" as const,
    mergeable: false,
  }),

  createMoveClipAction: (clipId: string, oldTrackId: string, oldTime: number, newTrackId: string, newTime: number) => ({
    type: "MOVE_CLIP" as ActionType,
    description: "Переместить клип",
    undoData: { clipId, oldTrackId, oldTime },
    redoData: { clipId, newTrackId, newTime },
    affectedEntities: { clips: [clipId], tracks: [oldTrackId, newTrackId] },
    priority: "medium" as const,
    mergeable: true,
  }),

  createBatchOperationAction: (description: string, originalClips: Clip[], updatedClips: Clip[]) => ({
    type: "BATCH_OPERATION" as ActionType,
    description,
    undoData: { originalClips },
    redoData: { updatedClips },
    affectedEntities: {
      clips: updatedClips.map((c) => c.id),
      tracks: Array.from(new Set(updatedClips.map((c) => c.trackId))),
    },
    priority: "high" as const,
    mergeable: false,
  }),
}

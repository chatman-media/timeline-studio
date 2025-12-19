/**
 * Domain Undo/Redo Provider с интеграцией BackendSync
 *
 * Провайдер для автоматической регистрации действий Undo/Redo в домене
 * с синхронизацией через BackendSync
 */

import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

import { container } from "@/core/container"
import { UndoRedoHelpers, useUndoRedo } from "@/domains/video-editing/hooks/use-undo-redo"
import {
  createInitialUndoState,
  handleHistoryLoaded,
  handleUndoBackendEvent,
  type UndoAction,
  type UndoRedoState,
} from "@/domains/video-editing/machines/undo-backend-event-handlers"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UndoRedoProvider")

// Временные типы
interface Clip {
  id: string
  trackId: string
  startTime: number
  endTime: number
  duration: number
  mediaId: string
}

interface Track {
  id: string
  name: string
  type: string
}

interface UndoRedoContextType {
  registerAction: ReturnType<typeof useUndoRedo>["registerAction"]
  startGrouping: ReturnType<typeof useUndoRedo>["startGrouping"]
  endGrouping: ReturnType<typeof useUndoRedo>["endGrouping"]
  // Backend state
  canUndo: boolean
  canRedo: boolean
  undoHistory: UndoAction[]
  redoHistory: UndoAction[]
  // BackendSync status
  isConnected: boolean
  error: string | null
}

const UndoRedoContext = createContext<UndoRedoContextType | null>(null)

interface UndoRedoProviderProps {
  children: ReactNode
}

/**
 * Undo/Redo Provider с интеграцией BackendSync
 *
 * Синхронизирует историю действий с backend для персистентности
 * и возможности восстановления после перезапуска
 */
export function UndoRedoProvider({ children }: UndoRedoProviderProps) {
  const undoRedo = useUndoRedo()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [undoState, setUndoState] = useState<UndoRedoState>(createInitialUndoState())

  // Получаем backend
  const backend = container.getBackend()

  // Подключение к backend и подписка на события
  useEffect(() => {
    let mounted = true

    const connectAndSubscribe = async () => {
      try {
        await backend.connect()

        if (!mounted) return

        setIsConnected(true)

        // Загружаем историю из backend
        const result = await backend.executeCommand({
          type: "GetUndoHistory",
        } as any)

        if (result.success && result.data && mounted) {
          const updates = handleHistoryLoaded(undoState, result.data as any)
          setUndoState((prev) => ({ ...prev, ...updates }))
        }
      } catch (error) {
        if (mounted) {
          logger.error("Failed to connect to backend:", { error })
          setError(error instanceof Error ? error.message : String(error))
          setIsConnected(false)
        }
      }
    }

    connectAndSubscribe()

    return () => {
      mounted = false
    }
  }, [backend])

  // Подписка на события backend
  useEffect(() => {
    const unsubscribe = backend.onEvent((event: any) => {
      // Обрабатываем только Undo/Redo события
      if (
        event.type === "UndoPerformed" ||
        event.type === "RedoPerformed" ||
        event.type === "ActionRegistered" ||
        event.type === "UndoHistoryCleared"
      ) {
        const updates = handleUndoBackendEvent(undoState, event as any)
        setUndoState((prev) => ({ ...prev, ...updates }))
      }
    })

    return unsubscribe
  }, [backend, undoState])

  // Оборачиваем registerAction для синхронизации с backend
  const registerActionWithBackend: typeof undoRedo.registerAction = (action) => {
    const actionId = undoRedo.registerAction(action)

    // Синхронизируем действие с backend через событие
    backend
      .executeCommand({
        type: "RegisterUndoAction",
        action: {
          id: actionId,
          action_type: action.type,
          description: action.description,
          timestamp: new Date().toISOString(),
          undo_data: action.undoData,
          redo_data: action.redoData,
        },
      } as any)
      .then((result) => {
        if (!result.success) {
          logger.error("[UndoRedo] Failed to register action:", {
            error: result.error,
          })
          setError(result.error || "Unknown error")
        }
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error("[UndoRedo] Failed to sync action:", { error: err })
        setError(errorMessage)
      })

    return actionId
  }

  // Создаем контекст с основными функциями регистрации
  const contextValue: UndoRedoContextType = {
    registerAction: registerActionWithBackend,
    startGrouping: undoRedo.startGrouping,
    endGrouping: undoRedo.endGrouping,
    canUndo: undoState.canUndo,
    canRedo: undoState.canRedo,
    undoHistory: undoState.undoHistory,
    redoHistory: undoState.redoHistory,
    isConnected,
    error,
  }

  return (
    <UndoRedoContext.Provider value={contextValue} data-oid="zjd9092">
      {children}
    </UndoRedoContext.Provider>
  )
}

/**
 * Hook для использования UndoRedo в дочерних компонентах
 */
export function useUndoRedoContext() {
  const context = useContext(UndoRedoContext)
  if (!context) {
    throw new Error("useUndoRedoContext must be used within UndoRedoProvider")
  }
  return context
}

/**
 * Hook для автоматической регистрации действий с клипами
 */
export function useClipUndoRedo() {
  const { registerAction, startGrouping, endGrouping, isConnected } = useUndoRedoContext()

  const registerAddClip = (clipId: string, trackId: string, mediaFile: any, time: number) => {
    const actionId = registerAction(UndoRedoHelpers.createAddClipAction(clipId, trackId, mediaFile, time))

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerRemoveClip = (clip: Clip) => {
    const actionId = registerAction(UndoRedoHelpers.createRemoveClipAction(clip))

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerMoveClip = (
    clipId: string,
    oldTrackId: string,
    oldTime: number,
    newTrackId: string,
    newTime: number,
  ) => {
    const actionId = registerAction(
      UndoRedoHelpers.createMoveClipAction(clipId, oldTrackId, oldTime, newTrackId, newTime),
    )

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerBatchOperation = (description: string, originalClips: Clip[], updatedClips: Clip[]) => {
    const actionId = registerAction(
      UndoRedoHelpers.createBatchOperationAction(description, originalClips, updatedClips),
    )

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerUpdateClip = (clipId: string, oldProperties: Partial<Clip>, newProperties: Partial<Clip>) => {
    const actionId = registerAction({
      type: "UPDATE_CLIP",
      description: "Изменить свойства клипа",
      undoData: { clipId, oldProperties },
      redoData: { clipId, newProperties },
      affectedEntities: { clips: [clipId] },
      priority: "medium",
      mergeable: true,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerTrimClip = (
    clipId: string,
    oldStartTime: number,
    oldEndTime: number,
    newStartTime: number,
    newEndTime: number,
  ) => {
    const actionId = registerAction({
      type: "TRIM_CLIP",
      description: "Обрезать клип",
      undoData: { clipId, oldStartTime, oldEndTime },
      redoData: { clipId, newStartTime, newEndTime },
      affectedEntities: { clips: [clipId] },
      priority: "medium",
      mergeable: true,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerSplitClip = (originalClipId: string, newClipId: string, splitTime: number) => {
    const actionId = registerAction({
      type: "SPLIT_CLIP",
      description: "Разделить клип",
      undoData: { originalClipId, newClipId },
      redoData: { originalClipId, newClipId, splitTime },
      affectedEntities: { clips: [originalClipId, newClipId] },
      priority: "high",
      mergeable: false,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  return {
    registerAddClip,
    registerRemoveClip,
    registerMoveClip,
    registerBatchOperation,
    registerUpdateClip,
    registerTrimClip,
    registerSplitClip,
    startGrouping,
    endGrouping,
  }
}

/**
 * Hook для автоматической регистрации действий с треками
 */
export function useTrackUndoRedo() {
  const { registerAction, startGrouping, endGrouping, isConnected } = useUndoRedoContext()

  const registerAddTrack = (trackId: string, trackType: string, trackName: string) => {
    const actionId = registerAction({
      type: "ADD_TRACK",
      description: `Добавить трек "${trackName}"`,
      undoData: { trackId },
      redoData: { trackId, trackType, trackName },
      affectedEntities: { tracks: [trackId] },
      priority: "medium",
      mergeable: false,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerRemoveTrack = (track: Track, clips: Clip[] = []) => {
    const actionId = registerAction({
      type: "REMOVE_TRACK",
      description: `Удалить трек "${track.name}"`,
      undoData: {
        trackId: track.id,
        trackType: track.type,
        trackName: track.name,
        clips,
      },
      redoData: { trackId: track.id },
      affectedEntities: {
        tracks: [track.id],
        clips: clips.map((c) => c.id),
      },
      priority: "high",
      mergeable: false,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerUpdateTrack = (trackId: string, oldProperties: Partial<Track>, newProperties: Partial<Track>) => {
    const actionId = registerAction({
      type: "UPDATE_TRACK",
      description: "Изменить трек",
      undoData: { trackId, oldProperties },
      redoData: { trackId, newProperties },
      affectedEntities: { tracks: [trackId] },
      priority: "medium",
      mergeable: true,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerReorderTracks = (oldOrder: string[], newOrder: string[]) => {
    const actionId = registerAction({
      type: "REORDER_TRACKS",
      description: "Переставить треки",
      undoData: { trackOrder: oldOrder },
      redoData: { trackOrder: newOrder },
      affectedEntities: { tracks: newOrder },
      priority: "medium",
      mergeable: false,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  return {
    registerAddTrack,
    registerRemoveTrack,
    registerUpdateTrack,
    registerReorderTracks,
    startGrouping,
    endGrouping,
  }
}

/**
 * Hook для автоматической регистрации действий с keyframes
 */
export function useKeyframeUndoRedo() {
  const { registerAction, startGrouping, endGrouping, isConnected } = useUndoRedoContext()

  const registerAddKeyframe = (clipId: string, keyframeId: string, keyframe: any) => {
    const actionId = registerAction({
      type: "ADD_KEYFRAME",
      description: "Добавить keyframe",
      undoData: { clipId, keyframeId },
      redoData: { clipId, keyframeId, keyframe },
      affectedEntities: { clips: [clipId], keyframes: [keyframeId] },
      priority: "medium",
      mergeable: false,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerRemoveKeyframe = (clipId: string, keyframeId: string, keyframe: any) => {
    const actionId = registerAction({
      type: "REMOVE_KEYFRAME",
      description: "Удалить keyframe",
      undoData: { clipId, keyframeId, keyframe },
      redoData: { clipId, keyframeId },
      affectedEntities: { clips: [clipId], keyframes: [keyframeId] },
      priority: "medium",
      mergeable: false,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  const registerUpdateKeyframe = (clipId: string, keyframeId: string, oldKeyframe: any, newKeyframe: any) => {
    const actionId = registerAction({
      type: "UPDATE_KEYFRAME",
      description: "Изменить keyframe",
      undoData: { clipId, keyframeId, keyframe: oldKeyframe },
      redoData: { clipId, keyframeId, keyframe: newKeyframe },
      affectedEntities: { clips: [clipId], keyframes: [keyframeId] },
      priority: "medium",
      mergeable: true,
    })

    if (!isConnected) {
      logger.warn("Warning", {
        data: "[UndoRedo] Backend not connected, action may not be persisted",
      })
    }

    return actionId
  }

  return {
    registerAddKeyframe,
    registerRemoveKeyframe,
    registerUpdateKeyframe,
    startGrouping,
    endGrouping,
  }
}

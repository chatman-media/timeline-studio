/**
 * Domain Undo/Redo Provider с интеграцией BackendSync
 *
 * Провайдер для автоматической регистрации действий Undo/Redo в домене
 * с синхронизацией через BackendSync
 */

import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

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

interface ProjectState {
  undo_redo_state?: {
    history?: any[]
  }
}

// Mock backend sync
interface BackendSync {
  onStateChange: (callback: (state: ProjectState) => void) => () => void
  onEvent: (callback: (event: any) => void) => () => void
  executeCommand: (command: any) => Promise<any>
}

const mockBackendSync: BackendSync = {
  onStateChange: (_callback) => () => {},
  onEvent: (_callback) => () => {},
  executeCommand: (_command) => Promise.resolve({ success: true }),
}

import { UndoRedoHelpers, useUndoRedo } from "../hooks/use-undo-redo"

interface UndoRedoContextType {
  registerAction: ReturnType<typeof useUndoRedo>["registerAction"]
  startGrouping: ReturnType<typeof useUndoRedo>["startGrouping"]
  endGrouping: ReturnType<typeof useUndoRedo>["endGrouping"]
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
  const backendSync = mockBackendSync

  // Синхронизация истории с backend
  useEffect(() => {
    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setIsConnected(true)

      // Восстанавливаем историю из backend при загрузке
      if (state.undo_redo_state && state.undo_redo_state.history) {
        logger.debug("[UndoRedo] Restored history from backend:", {
          data: `${state.undo_redo_state.history.length} actions`,
        })
        // Здесь можно восстановить историю в UndoRedoService
        // Для этого потребуется добавить метод в сервис
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      if (event.type === "UNDO_PERFORMED") {
        logger.debug("[UndoRedo] Undo performed on backend:", { data: event.data.actionId })
      } else if (event.type === "REDO_PERFORMED") {
        logger.debug("[UndoRedo] Redo performed on backend:", { data: event.data.actionId })
      }
    })

    return () => {
      unsubscribe()
      unsubscribeEvents()
    }
  }, [backendSync])

  // Оборачиваем registerAction для синхронизации с backend
  const registerActionWithBackend: typeof undoRedo.registerAction = (action) => {
    const actionId = undoRedo.registerAction(action)

    // Синхронизируем действие с backend
    backendSync
      .executeCommand({
        type: "UndoRedo",
        params: {
          type: "RegisterAction",
          params: {
            actionId,
            action: {
              ...action,
              id: actionId,
              timestamp: Date.now(),
            },
          },
        },
      })
      .catch((err) => {
        logger.error("[UndoRedo] Failed to sync action:", { error: err })
        setError(err.message)
      })

    return actionId
  }

  // Оборачиваем undo/redo для синхронизации с backend
  const originalUndo = undoRedo.undo
  const originalRedo = undoRedo.redo

  // Переопределяем методы undo/redo через контекст
  useEffect(() => {
    // Подписываемся на события undo/redo в сервисе
    // и синхронизируем с backend
    const handleUndo = async () => {
      try {
        await backendSync.executeCommand({
          type: "UndoRedo",
          params: {
            type: "Undo",
            params: {},
          },
        })
      } catch (err) {
        logger.error("[UndoRedo] Failed to sync undo:", { error: err })
        setError(err.message)
      }
    }

    const handleRedo = async () => {
      try {
        await backendSync.executeCommand({
          type: "UndoRedo",
          params: {
            type: "Redo",
            params: {},
          },
        })
      } catch (err) {
        logger.error("[UndoRedo] Failed to sync redo:", { error: err })
        setError(err.message)
      }
    }

    // Здесь можно добавить подписку на события сервиса
    // если он поддерживает event emitter

    return () => {
      // Cleanup
    }
  }, [backendSync])

  // Создаем контекст с основными функциями регистрации
  const contextValue: UndoRedoContextType = {
    registerAction: registerActionWithBackend,
    startGrouping: undoRedo.startGrouping,
    endGrouping: undoRedo.endGrouping,
    isConnected,
    error,
  }

  return <UndoRedoContext.Provider value={contextValue}>{children}</UndoRedoContext.Provider>
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
    }

    return actionId
  }

  const registerRemoveClip = (clip: Clip) => {
    const actionId = registerAction(UndoRedoHelpers.createRemoveClipAction(clip))

    if (!isConnected) {
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
    }

    return actionId
  }

  const registerBatchOperation = (description: string, originalClips: Clip[], updatedClips: Clip[]) => {
    const actionId = registerAction(
      UndoRedoHelpers.createBatchOperationAction(description, originalClips, updatedClips),
    )

    if (!isConnected) {
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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
      logger.warn("Warning", { data: "[UndoRedo] Backend not connected, action may not be persisted" })
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

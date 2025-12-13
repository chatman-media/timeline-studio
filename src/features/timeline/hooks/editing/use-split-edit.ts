/**
 * Хук для работы с Split Edit операциями
 */

import { useCallback, useEffect, useState } from "react"
import type { TimelineClip as DomainTimelineClip } from "@/domains/video-editing/types"
import type { TimelineClip } from "@/features/timeline/types"
import { SplitEditServiceImpl } from "../../services/split-edit-service"
import type {
  SplitEdit,
  SplitEditConfig,
  SplitEditOperation,
  SplitEditToolSettings,
  SplitEditVisual,
} from "../../types/split-edit"
import { useTimeline } from "../state/use-timeline"

export interface UseSplitEditReturn {
  /** Текущая конфигурация split edit */
  config: SplitEditConfig
  /** Настройки инструмента */
  toolSettings: SplitEditToolSettings
  /** Визуальные настройки */
  visualSettings: SplitEditVisual
  /** Активные split edits */
  activeSplitEdits: SplitEdit[]
  /** Включен ли режим split edit */
  isEnabled: boolean

  /** Включить/выключить split edit */
  toggleSplitEdit: (enabled: boolean) => void
  /** Установить инструмент */
  setTool: (tool: "razor" | "select" | "slip" | "slide") => void
  /** Обновить настройки инструмента */
  updateToolSettings: (settings: Partial<SplitEditToolSettings>) => void

  /** Создать L-cut */
  createLCut: (videoClipId: string, audioClipId: string, position: number) => Promise<boolean>
  /** Создать J-cut */
  createJCut: (videoClipId: string, audioClipId: string, position: number) => Promise<boolean>
  /** Разделить клип в позиции playhead */
  splitAtPlayhead: (clipId: string, position: number) => Promise<boolean>

  /** Удалить split edit */
  removeSplitEdit: (splitEditId: string) => boolean
  /** Получить split edits для клипа */
  getSplitEditsForClip: (clipId: string) => SplitEdit[]
  /** Очистить все split edits */
  clearAllSplitEdits: () => void

  /** Показать предварительный просмотр */
  showPreview: (position: number, type: "L-cut" | "J-cut" | "split-at-playhead") => void
  /** Скрыть предварительный просмотр */
  hidePreview: () => void
  /** Обновить позицию предварительного просмотра */
  updatePreviewPosition: (position: number) => void

  /** Получить связанные клипы */
  getLinkedClips: (clipId: string) => { videoClip?: any; audioClip?: any }
  /** Получить snap позицию */
  getSnapPosition: (position: number) => number

  /** Выполнить операцию split edit */
  performOperation: (operation: SplitEditOperation) => Promise<boolean>
  /** Проверить возможность выполнения операции */
  canPerformOperation: (operation: SplitEditOperation) => boolean

  /** Синхронизировать split edits */
  syncSplitEdits: () => void
  /** Валидировать split edit */
  validateSplitEdit: (splitEdit: SplitEdit) => boolean
}

export function useSplitEdit(): UseSplitEditReturn {
  const { project, send } = useTimeline()
  const [service] = useState(() => new SplitEditServiceImpl())
  const [config, setConfig] = useState(() => service.getConfig())
  const [toolSettings, setToolSettings] = useState(() => service.getToolSettings())
  const [visualSettings, setVisualSettings] = useState(() => service.getVisualSettings())

  // Адаптер для преобразования domain клипа в feature клип
  const adaptDomainClipToFeatureClip = useCallback((domainClip: DomainTimelineClip): TimelineClip => {
    return {
      ...domainClip,
      mediaFile: undefined,
      mediaStartTime: domainClip.sourceIn,
      mediaEndTime: domainClip.sourceOut,
      speed: domainClip.playbackRate || 1,
      isReversed: (domainClip.playbackRate || 1) < 0,
      maintainPitch: false,
      offset: 0,
      type: undefined,
    } as unknown as TimelineClip
  }, [])

  // Получаем все клипы из проекта (преобразованные в feature типы)
  const getAllClips = useCallback((): TimelineClip[] => {
    if (!project) return []

    const clips: DomainTimelineClip[] = []

    // Клипы из глобальных треков
    for (const track of project.globalTracks || []) {
      clips.push(...track.clips)
    }

    // Клипы из секций
    for (const section of project.sections || []) {
      for (const track of section.tracks || []) {
        clips.push(...track.clips)
      }
    }

    // Преобразуем domain клипы в feature клипы
    return clips.map(adaptDomainClipToFeatureClip)
  }, [project, adaptDomainClipToFeatureClip])

  // Обновляем конфигурацию при изменении сервиса
  useEffect(() => {
    setConfig(service.getConfig())
    setToolSettings(service.getToolSettings())
    setVisualSettings(service.getVisualSettings())
  }, [service])

  // Синхронизируем split edits с изменениями в проекте
  useEffect(() => {
    if (project) {
      service.syncSplitEdits(getAllClips())
      setConfig(service.getConfig())
    }
  }, [project, service, getAllClips])

  const toggleSplitEdit = useCallback(
    (enabled: boolean) => {
      service.updateConfig({ enabled })
      setConfig(service.getConfig())
    },
    [service],
  )

  const setTool = useCallback(
    (tool: "razor" | "select" | "slip" | "slide") => {
      service.updateConfig({ tool })
      setConfig(service.getConfig())
    },
    [service],
  )

  const updateToolSettings = useCallback(
    (settings: Partial<SplitEditToolSettings>) => {
      service.updateToolSettings(settings)
      setToolSettings(service.getToolSettings())
    },
    [service],
  )

  const createLCut = useCallback(
    async (videoClipId: string, audioClipId: string, position: number): Promise<boolean> => {
      const clips = getAllClips()
      const result = service.createLCut(videoClipId, audioClipId, position, clips)

      if (result.success && result.updatedClips) {
        // Обновляем клипы в проекте через timeline machine
        for (const clip of result.updatedClips) {
          send({
            type: "UPDATE_CLIP",
            clipId: clip.id,
            updates: {
              startTime: clip.startTime,
              duration: clip.duration,
            },
          })
        }

        // Обновляем конфигурацию
        setConfig(service.getConfig())
        return true
      }

      return false
    },
    [getAllClips, service, send],
  )

  const createJCut = useCallback(
    async (videoClipId: string, audioClipId: string, position: number): Promise<boolean> => {
      const clips = getAllClips()
      const result = service.createJCut(videoClipId, audioClipId, position, clips)

      if (result.success && result.updatedClips) {
        // Обновляем клипы в проекте через timeline machine
        for (const clip of result.updatedClips) {
          send({
            type: "UPDATE_CLIP",
            clipId: clip.id,
            updates: {
              startTime: clip.startTime,
              duration: clip.duration,
            },
          })
        }

        // Обновляем конфигурацию
        setConfig(service.getConfig())
        return true
      }

      return false
    },
    [getAllClips, service, send],
  )

  const splitAtPlayhead = useCallback(
    async (clipId: string, position: number): Promise<boolean> => {
      const clips = getAllClips()
      const result = service.splitAtPlayhead(clipId, position, clips)

      if (result.success && result.updatedClips) {
        // Удаляем оригинальный клип
        send({
          type: "REMOVE_CLIP",
          clipId,
        })

        // Добавляем новые клипы
        for (const clip of result.updatedClips) {
          if (clip.id !== clipId) {
            // Добавляем только новые клипы
            send({
              type: "ADD_CLIP",
              trackId: clip.trackId,
              mediaFile: clip.mediaFile,
              startTime: clip.startTime,
              duration: clip.duration,
            })
          } else {
            // Обновляем существующий клип
            send({
              type: "UPDATE_CLIP",
              clipId: clip.id,
              updates: {
                startTime: clip.startTime,
                duration: clip.duration,
              },
            })
          }
        }

        // Обновляем конфигурацию
        setConfig(service.getConfig())
        return true
      }

      return false
    },
    [getAllClips, service, send],
  )

  const removeSplitEdit = useCallback(
    (splitEditId: string): boolean => {
      const removed = service.removeSplitEdit(splitEditId)
      if (removed) {
        setConfig(service.getConfig())
      }
      return removed
    },
    [service],
  )

  const getSplitEditsForClip = useCallback(
    (clipId: string): SplitEdit[] => {
      return service.getSplitEditsForClip(clipId)
    },
    [service],
  )

  const clearAllSplitEdits = useCallback(() => {
    service.clearAllSplitEdits()
    setConfig(service.getConfig())
  }, [service])

  const showPreview = useCallback(
    (position: number, type: "L-cut" | "J-cut" | "split-at-playhead") => {
      service.showPreview(position, type)
      setVisualSettings(service.getVisualSettings())
    },
    [service],
  )

  const hidePreview = useCallback(() => {
    service.hidePreview()
    setVisualSettings(service.getVisualSettings())
  }, [service])

  const updatePreviewPosition = useCallback(
    (position: number) => {
      service.updatePreviewPosition(position)
      setVisualSettings(service.getVisualSettings())
    },
    [service],
  )

  const getLinkedClips = useCallback(
    (clipId: string) => {
      const clips = getAllClips()
      return service.getLinkedClips(clipId, clips)
    },
    [getAllClips, service],
  )

  const getSnapPosition = useCallback(
    (position: number): number => {
      const clips = getAllClips()
      return service.getSnapPosition(position, clips)
    },
    [getAllClips, service],
  )

  const performOperation = useCallback(
    async (operation: SplitEditOperation): Promise<boolean> => {
      const clips = getAllClips()
      const result = service.performSplitEdit(operation, clips)

      if (result.success && result.updatedClips) {
        // Обновляем клипы в проекте
        for (const clip of result.updatedClips) {
          send({
            type: "UPDATE_CLIP",
            clipId: clip.id,
            updates: {
              startTime: clip.startTime,
              duration: clip.duration,
            },
          })
        }

        setConfig(service.getConfig())
        return true
      }

      return false
    },
    [getAllClips, service, send],
  )

  const canPerformOperation = useCallback(
    (operation: SplitEditOperation): boolean => {
      const clips = getAllClips()
      return service.canPerformOperation(operation, clips)
    },
    [getAllClips, service],
  )

  const syncSplitEdits = useCallback(() => {
    const clips = getAllClips()
    service.syncSplitEdits(clips)
    setConfig(service.getConfig())
  }, [getAllClips, service])

  const validateSplitEdit = useCallback(
    (splitEdit: SplitEdit): boolean => {
      const clips = getAllClips()
      return service.validateSplitEdit(splitEdit, clips)
    },
    [getAllClips, service],
  )

  return {
    config,
    toolSettings,
    visualSettings,
    activeSplitEdits: service.getActiveSplitEdits(),
    isEnabled: config.enabled,

    toggleSplitEdit,
    setTool,
    updateToolSettings,

    createLCut,
    createJCut,
    splitAtPlayhead,

    removeSplitEdit,
    getSplitEditsForClip,
    clearAllSplitEdits,

    showPreview,
    hidePreview,
    updatePreviewPosition,

    getLinkedClips,
    getSnapPosition,

    performOperation,
    canPerformOperation,

    syncSplitEdits,
    validateSplitEdit,
  }
}

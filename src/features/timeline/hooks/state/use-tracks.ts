/**
 * Hook for working with Timeline tracks
 */

import { useMemo } from "react"

import type { Timeline, Track as CoreTrack } from "@timeline-studio/core/types/timeline"
import { createLogger } from "@/lib/tauri-logger"
import type { TimelineTrack, TrackType } from "../../types"
import { useTimeline } from "../state/use-timeline"

const logger = createLogger("UseTracks")

// Адаптер для преобразования domain трека в feature трек
const adaptDomainTrackToFeatureTrack = (domainTrack: CoreTrack): TimelineTrack => {
  // Нормализуем тип трека из PascalCase (backend) в lowercase (frontend)
  const normalizedType =
    typeof domainTrack.type === "string" ? (domainTrack.type.toLowerCase() as TrackType) : domainTrack.type

  return {
    ...domainTrack,
    type: normalizedType,
    // Преобразуем domain свойства в feature с default значениями
    isLocked: domainTrack.locked ?? false,
    isMuted: domainTrack.muted ?? false,
    isSolo: domainTrack.solo ?? false,
    isHidden: (domainTrack as any).isHidden ?? false, // сохраняем если есть
    // Добавляем другие feature-specific свойства если нужно
  } as unknown as TimelineTrack
}

// Локальные утилиты для работы с domain типами
const getAllTracks = (timeline: Timeline | null | undefined) => {
  if (!timeline) return []
  const globalTracks = timeline.globalTracks || []
  const sectionTracks = timeline.sections?.flatMap((s) => s.tracks || []) || []
  return [...globalTracks, ...sectionTracks]
}

const findTrackById = (timeline: Timeline | null | undefined, trackId: string) => {
  const allTracks = getAllTracks(timeline)
  return allTracks.find((track) => track.id === trackId) || null
}

const getTracksByType = (timeline: Timeline | null | undefined, trackType: TrackType) => {
  const allTracks = getAllTracks(timeline)
  return allTracks.filter((track) => track.type === trackType)
}

const sortTracksByOrder = (tracks: CoreTrack[]) => {
  return [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0))
}

export interface UseTracksReturn {
  // Данные
  tracks: TimelineTrack[]
  globalTracks: TimelineTrack[]
  sectionTracks: TimelineTrack[]

  // Фильтрация
  getTracksByType: (type: TrackType) => TimelineTrack[]
  getTracksBySection: (sectionId: string) => TimelineTrack[]
  findTrack: (trackId: string) => TimelineTrack | null

  // Состояние
  selectedTracks: TimelineTrack[]
  visibleTracks: TimelineTrack[]

  // Действия
  addTrack: (trackType: TrackType, sectionId?: string, name?: string) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => Promise<void>

  // Управление состоянием треков
  toggleTrackMute: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void
  toggleTrackVisibility: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  setTrackHeight: (trackId: string, height: number) => void

  // Выделение
  selectTrack: (trackId: string, addToSelection?: boolean) => void
  selectMultipleTracks: (trackIds: string[]) => void
  clearTrackSelection: () => void

  // Утилиты
  canAddTrackToSection: (sectionId: string, trackType: TrackType) => boolean
  getTrackStats: (trackId: string) => {
    clipCount: number
    totalDuration: number
    isEmpty: boolean
  }
}

export function useTracks(): UseTracksReturn {
  const { project, selectedTrackIds, addTrack, removeTrack, updateTrack, selectTracks, clearSelection } = useTimeline()

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const tracks = useMemo(() => {
    if (!project) return []
    const domainTracks = getAllTracks(project)
    return domainTracks.map(adaptDomainTrackToFeatureTrack)
  }, [project])

  const globalTracks = useMemo(() => {
    if (!project) return []
    const sortedTracks = sortTracksByOrder(project.globalTracks || [])
    return sortedTracks.map(adaptDomainTrackToFeatureTrack)
  }, [project])

  const sectionTracks = useMemo(() => {
    if (!project) return []
    const allSectionTracks = project.sections?.flatMap((section) => section.tracks || []) || []
    const sortedTracks = sortTracksByOrder(allSectionTracks)
    return sortedTracks.map(adaptDomainTrackToFeatureTrack)
  }, [project])

  const selectedTracks = useMemo(() => {
    return tracks.filter((track) => selectedTrackIds?.includes(track.id))
  }, [tracks, selectedTrackIds])

  const visibleTracks = useMemo(() => {
    return tracks.filter((track) => !track.isHidden)
  }, [tracks])

  // ============================================================================
  // FILTERING FUNCTIONS
  // ============================================================================

  const getTracksByTypeFunc = useMemo(
    () => (type: TrackType) => {
      if (!project) return []
      const domainTracks = getTracksByType(project, type)
      return domainTracks.map(adaptDomainTrackToFeatureTrack)
    },
    [project],
  )

  const getTracksBySection = useMemo(
    () => (sectionId: string) => {
      if (!project) return []
      const section = project.sections?.find((s) => s.id === sectionId)
      if (!section) return []
      const sortedTracks = sortTracksByOrder(section.tracks || [])
      return sortedTracks.map(adaptDomainTrackToFeatureTrack)
    },
    [project],
  )

  const findTrack = useMemo(
    () => (trackId: string) => {
      if (!project) return null
      const domainTrack = findTrackById(project, trackId)
      return domainTrack ? adaptDomainTrackToFeatureTrack(domainTrack) : null
    },
    [project],
  )

  // ============================================================================
  // TRACK STATE MANAGEMENT
  // ============================================================================

  const toggleTrackMute = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      void updateTrack(trackId, { muted: !track.isMuted })
    }
  }

  const toggleTrackLock = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      void updateTrack(trackId, { locked: !track.isLocked })
    }
  }

  const toggleTrackVisibility = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      // isHidden не существует в domain типах, пропускаем
      logger.warn("Track visibility toggle not supported in domain layer")
    }
  }

  const toggleTrackSolo = (trackId: string) => {
    const track = findTrack(trackId)
    if (track) {
      void updateTrack(trackId, { solo: !track.isSolo })
    }
  }

  const setTrackVolume = (trackId: string, volume: number) => {
    void updateTrack(trackId, { volume: Math.max(0, Math.min(1, volume)) })
  }

  const setTrackPan = (trackId: string, pan: number) => {
    void updateTrack(trackId, { pan: Math.max(-1, Math.min(1, pan)) })
  }

  const setTrackHeight = (trackId: string, height: number) => {
    void updateTrack(trackId, { height: Math.max(40, Math.min(300, height)) })
  }

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  const selectTrack = (trackId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentSelection = selectedTrackIds
      const newSelection = currentSelection.includes(trackId)
        ? currentSelection.filter((id) => id !== trackId)
        : [...currentSelection, trackId]
      selectTracks(newSelection)
    } else {
      selectTracks([trackId])
    }
  }

  const selectMultipleTracks = (trackIds: string[]) => {
    selectTracks(trackIds)
  }

  const clearTrackSelection = () => {
    clearSelection()
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const canAddTrackToSection = (sectionId: string, trackType: TrackType): boolean => {
    // Проверяем, существует ли секция
    if (!project) return false
    const section = project.sections?.find((s) => s.id === sectionId)
    if (!section) return false

    // Проверяем ограничения по типам треков
    const existingTypes = (section.tracks || []).map((t) => t.type)

    // Например, можно ограничить количество видео треков
    if (trackType === "video" && existingTypes.filter((t) => t === "video").length >= 10) {
      return false
    }

    return true
  }

  const getTrackStats = (trackId: string) => {
    const track = findTrack(trackId)
    if (!track) {
      return { clipCount: 0, totalDuration: 0, isEmpty: true }
    }

    const clipCount = track.clips.length
    const totalDuration = track.clips.reduce((sum, clip) => sum + clip.duration, 0)
    const isEmpty = clipCount === 0

    return { clipCount, totalDuration, isEmpty }
  }

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Данные
    tracks,
    globalTracks,
    sectionTracks,

    // Фильтрация
    getTracksByType: getTracksByTypeFunc,
    getTracksBySection,
    findTrack,

    // Состояние
    selectedTracks,
    visibleTracks,

    // Действия
    addTrack: (trackType: TrackType, _sectionId?: string, name?: string) => {
      void addTrack(trackType, name)
    },
    removeTrack,
    updateTrack: async (trackId: string, updates: Partial<TimelineTrack>) => {
      // Преобразуем feature updates в domain updates
      const domainUpdates = {
        ...updates,
        muted: updates.isMuted,
        locked: updates.isLocked,
        solo: updates.isSolo,
      }
      // Убираем feature-only свойства
      delete (domainUpdates as any).isMuted
      delete (domainUpdates as any).isLocked
      delete (domainUpdates as any).isSolo
      delete (domainUpdates as any).isHidden

      await updateTrack(trackId, domainUpdates as any)
    },

    // Управление состоянием треков
    toggleTrackMute,
    toggleTrackLock,
    toggleTrackVisibility,
    toggleTrackSolo,
    setTrackVolume,
    setTrackPan,
    setTrackHeight,

    // Выделение
    selectTrack,
    selectMultipleTracks,
    clearTrackSelection,

    // Утилиты
    canAddTrackToSection,
    getTrackStats,
  }
}

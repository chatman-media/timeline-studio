/**
 * Hook for working with Timeline clips
 */

import { useMemo } from "react"
import type { MediaFile } from "@/core/types/media"
import type { Timeline, TimelineClip as CoreTimelineClip } from "@/core/types/timeline"
import type { TimelineClip, TrackType } from "../../types"
import { useTimeline } from "../state/use-timeline"

// Адаптер для преобразования domain MediaFile в feature MediaFile
const adaptDomainMediaFileToFeatureMediaFile = (domainMediaFile: MediaFile): MediaFile => {
  return domainMediaFile as unknown as MediaFile
}

// Адаптер для преобразования domain клипа в feature клип
const adaptDomainClipToFeatureClip = (domainClip: CoreTimelineClip, domainMediaFile?: MediaFile): TimelineClip => {
  const mediaFile = domainMediaFile ? adaptDomainMediaFileToFeatureMediaFile(domainMediaFile) : undefined
  return {
    ...domainClip,
    mediaFile,
    // Преобразуем domain свойства в feature
    mediaStartTime: domainClip.sourceIn,
    mediaEndTime: domainClip.sourceOut,
    speed: domainClip.playbackRate || 1,
    isReversed: (domainClip.playbackRate || 1) < 0,
    maintainPitch: false,
    offset: 0,
    // Добавляем обязательные свойства feature типов
    type: undefined, // определяется на основе track type
  } as unknown as TimelineClip
}

// Локальные утилиты для работы с domain типами
const getAllClips = (timeline: Timeline | null | undefined) => {
  if (!timeline) return []
  const clips = []
  for (const track of timeline.globalTracks || []) {
    clips.push(...(track.clips || []))
  }
  for (const section of timeline.sections || []) {
    for (const track of section.tracks || []) {
      clips.push(...(track.clips || []))
    }
  }
  return clips
}

const findClipById = (timeline: Timeline | null | undefined, clipId: string) => {
  const allClips = getAllClips(timeline)
  return allClips.find((clip) => clip.id === clipId) || null
}

const getClipsInTimeRange = (timeline: Timeline | null | undefined, startTime: number, endTime: number) => {
  const allClips = getAllClips(timeline)
  return allClips.filter((clip) => {
    const clipEnd = clip.startTime + clip.duration
    return !(clip.startTime >= endTime || clipEnd <= startTime)
  })
}

const findNearestClip = (timeline: Timeline | null | undefined, time: number, trackType?: TrackType) => {
  if (!timeline) return null
  const allClips = getAllClips(timeline)
  let nearestClip = null
  let minDistance = Number.POSITIVE_INFINITY

  for (const clip of allClips) {
    if (trackType) {
      const track = [
        ...(timeline.globalTracks || []),
        ...(timeline.sections?.flatMap((s) => s.tracks || []) || []),
      ].find((t) => t.id === clip.trackId)
      if (!track || track.type !== trackType) continue
    }

    const distance = Math.abs(clip.startTime - time)
    if (distance < minDistance) {
      minDistance = distance
      nearestClip = clip
    }
  }

  return nearestClip
}

const canPlaceClipOnTrack = (
  timeline: Timeline | null | undefined,
  trackId: string,
  startTime: number,
  duration: number,
) => {
  if (!timeline) return false
  const track = [...(timeline.globalTracks || []), ...(timeline.sections?.flatMap((s) => s.tracks || []) || [])].find(
    (t) => t.id === trackId,
  )
  if (!track) return false

  const endTime = startTime + duration
  return !(track.clips || []).some((clip) => {
    const clipEnd = clip.startTime + clip.duration
    return !(startTime >= clipEnd || endTime <= clip.startTime)
  })
}

export interface UseClipsReturn {
  // Данные
  clips: TimelineClip[]
  selectedClips: TimelineClip[]
  clipsByTrack: Record<string, TimelineClip[]>

  // Поиск и фильтрация
  findClip: (clipId: string) => TimelineClip | null
  getClipsByTrack: (trackId: string) => TimelineClip[]
  getClipsInRange: (startTime: number, endTime: number) => TimelineClip[]
  getClipsByType: (trackType: TrackType) => TimelineClip[]
  findNearestClipToTime: (time: number, trackType?: TrackType) => TimelineClip | null

  // Действия с клипами
  addClip: (trackId: string, mediaFile: MediaFile, startTime: number, duration?: number) => Promise<void>
  removeClip: (clipId: string) => Promise<void>
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => Promise<void>
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void
  splitClip: (clipId: string, splitTime: number) => void
  trimClip: (clipId: string, newStartTime: number, newDuration: number) => void
  duplicateClip: (clipId: string, targetTrackId?: string) => void

  // Выделение
  selectClip: (clipId: string, addToSelection?: boolean) => void
  selectMultipleClips: (clipIds: string[]) => void
  selectClipsInArea: (startTime: number, endTime: number, trackIds: string[]) => void
  clearClipSelection: () => void

  // Управление свойствами клипов
  setClipVolume: (clipId: string, volume: number) => void
  setClipSpeed: (clipId: string, speed: number) => void
  setClipOpacity: (clipId: string, opacity: number) => void
  toggleClipReverse: (clipId: string) => void
  setClipPosition: (clipId: string, position: { x: number; y: number; width: number; height: number }) => void

  // Валидация и проверки
  canPlaceClip: (trackId: string, startTime: number, duration: number, excludeClipId?: string) => boolean
  getClipConflicts: (trackId: string, startTime: number, duration: number, excludeClipId?: string) => TimelineClip[]
  isClipSelected: (clipId: string) => boolean

  // Утилиты
  getClipAtTime: (trackId: string, time: number) => TimelineClip | null
  getClipStats: () => {
    totalClips: number
    totalDuration: number
    selectedCount: number
    clipsByType: Record<TrackType, number>
  }
}

export function useClips(): UseClipsReturn {
  const {
    project,
    selectedClipIds,
    addClip,
    removeClip,
    updateClip,
    moveClip,
    splitClip,
    trimClip,
    selectClips,
    clearSelection,
  } = useTimeline()

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const clips = useMemo(() => {
    if (!project) return []

    // Получаем все клипы и преобразуем domain типы в feature типы
    const allClips = getAllClips(project)
    return allClips.map((clip) => {
      const mediaFile = project.resources.media.find((file) => file.id === clip.mediaId)
      return adaptDomainClipToFeatureClip(clip, mediaFile)
    })
  }, [project])

  const selectedClips = useMemo(() => {
    return clips.filter((clip) => selectedClipIds?.includes(clip.id))
  }, [clips, selectedClipIds])

  const clipsByTrack = useMemo(() => {
    return clips.reduce<Record<string, TimelineClip[]>>((acc, clip) => {
      if (!acc[clip.trackId]) {
        acc[clip.trackId] = []
      }
      acc[clip.trackId].push(clip)
      return acc
    }, {})
  }, [clips])

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  const findClip = useMemo(
    () => (clipId: string) => {
      if (!project) return null
      const clip = findClipById(project, clipId)
      if (!clip) return null

      // Преобразуем domain клип в feature клип
      const mediaFile = project.resources.media.find((file) => file.id === clip.mediaId)
      return adaptDomainClipToFeatureClip(clip, mediaFile)
    },
    [project],
  )

  const getClipsByTrack = useMemo(
    () => (trackId: string) => {
      return clips.filter((clip) => clip.trackId === trackId)
    },
    [clips],
  )

  const getClipsInRange = useMemo(
    () => (startTime: number, endTime: number) => {
      if (!project) return []
      const domainClips = getClipsInTimeRange(project, startTime, endTime)
      return domainClips.map((clip) => {
        const mediaFile = project.resources.media.find((file) => file.id === clip.mediaId)
        return adaptDomainClipToFeatureClip(clip, mediaFile)
      })
    },
    [project],
  )

  const getClipsByType = useMemo(
    () => (trackType: TrackType) => {
      if (!project) return []

      // Получаем все треки указанного типа
      const tracks = (project.sections || [])
        .flatMap((s) => s.tracks || [])
        .concat(project.globalTracks || [])
        .filter((track) => track.type === trackType)

      // Получаем все клипы с этих треков и преобразуем их
      const domainClips = tracks.flatMap((track) => track.clips || [])
      return domainClips.map((clip) => {
        const mediaFile = project.resources.media.find((file) => file.id === clip.mediaId)
        return adaptDomainClipToFeatureClip(clip, mediaFile)
      })
    },
    [project],
  )

  const findNearestClipToTime = useMemo(
    () => (time: number, trackType?: TrackType) => {
      if (!project) return null
      const domainClip = findNearestClip(project, time, trackType)
      if (!domainClip) return null

      const mediaFile = project.resources.media.find((file) => file.id === domainClip.mediaId)
      return adaptDomainClipToFeatureClip(domainClip, mediaFile)
    },
    [project],
  )

  // ============================================================================
  // CLIP ACTIONS
  // ============================================================================

  const duplicateClip = (clipId: string, targetTrackId?: string) => {
    const clip = findClip(clipId)
    if (!clip) return

    // Находим MediaFile для клипа
    const mediaFile = project?.resources.media.find((file) => file.id === clip.mediaId)
    if (!mediaFile) return

    const trackId = targetTrackId || clip.trackId
    const startTime = clip.startTime + clip.duration + 1 // Размещаем после оригинала

    void addClip(trackId, mediaFile, startTime)
  }

  // ============================================================================
  // SELECTION MANAGEMENT
  // ============================================================================

  const selectClip = (clipId: string, addToSelection = false) => {
    if (addToSelection) {
      const currentSelection = selectedClipIds || []
      const newSelection = currentSelection.includes(clipId)
        ? currentSelection.filter((id) => id !== clipId)
        : [...currentSelection, clipId]
      selectClips(newSelection)
    } else {
      selectClips([clipId])
    }
  }

  const selectMultipleClips = (clipIds: string[]) => {
    selectClips(clipIds)
  }

  const selectClipsInArea = (startTime: number, endTime: number, trackIds: string[]) => {
    const clipsInArea = clips.filter((clip) => {
      if (!trackIds.includes(clip.trackId)) return false

      const clipEndTime = clip.startTime + clip.duration
      return !(clipEndTime <= startTime || clip.startTime >= endTime)
    })

    selectClips(clipsInArea.map((clip) => clip.id))
  }

  const clearClipSelection = () => {
    clearSelection()
  }

  // ============================================================================
  // CLIP PROPERTIES
  // ============================================================================

  const setClipVolume = (clipId: string, volume: number) => {
    void updateClip(clipId, { volume: Math.max(0, Math.min(1, volume)) })
  }

  const setClipSpeed = (clipId: string, speed: number) => {
    void updateClip(clipId, { playbackRate: Math.max(0.1, Math.min(10, speed)) })
  }

  const setClipOpacity = (clipId: string, opacity: number) => {
    void updateClip(clipId, { opacity: Math.max(0, Math.min(1, opacity)) })
  }

  const toggleClipReverse = (clipId: string) => {
    const clip = findClip(clipId)
    if (clip) {
      // Инвертируем playbackRate для реверса
      void updateClip(clipId, { playbackRate: -(clip.playbackRate || 1) })
    }
  }

  const setClipPosition = (clipId: string, position: { x: number; y: number; width: number; height: number }) => {
    void updateClip(clipId, {
      position: {
        x: Math.max(0, Math.min(1, position.x)),
        y: Math.max(0, Math.min(1, position.y)),
        width: Math.max(0, Math.min(1, position.width)),
        height: Math.max(0, Math.min(1, position.height)),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
    })
  }

  // ============================================================================
  // VALIDATION AND CHECKS
  // ============================================================================

  const canPlaceClip = (trackId: string, startTime: number, duration: number, _excludeClipId?: string): boolean => {
    if (!project) return false
    return canPlaceClipOnTrack(project, trackId, startTime, duration)
  }

  const getClipConflicts = (
    trackId: string,
    startTime: number,
    duration: number,
    excludeClipId?: string,
  ): TimelineClip[] => {
    const trackClips = getClipsByTrack(trackId)
    const endTime = startTime + duration

    return trackClips.filter((clip) => {
      if (excludeClipId && clip.id === excludeClipId) return false

      const clipEndTime = clip.startTime + clip.duration
      return !(endTime <= clip.startTime || startTime >= clipEndTime)
    })
  }

  const isClipSelected = (clipId: string): boolean => {
    return selectedClipIds?.includes(clipId) ?? false
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const getClipAtTime = (trackId: string, time: number): TimelineClip | null => {
    const trackClips = getClipsByTrack(trackId)
    return trackClips.find((clip) => time >= clip.startTime && time <= clip.startTime + clip.duration) || null
  }

  const getClipStats = () => {
    const totalClips = clips.length
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0)
    const selectedCount = selectedClips.length

    const clipsByType: Record<TrackType, number> = {
      video: 0,
      audio: 0,
      image: 0,
      title: 0,
      subtitle: 0,
      music: 0,
      voiceover: 0,
      sfx: 0,
      ambient: 0,
    }

    // Подсчитываем клипы по типам треков
    if (project) {
      const allTracks = (project.sections || []).flatMap((s) => s.tracks || []).concat(project.globalTracks || [])
      clips.forEach((clip) => {
        const track = allTracks.find((t) => t.id === clip.trackId)
        if (track) {
          clipsByType[track.type]++
        }
      })
    }

    return { totalClips, totalDuration, selectedCount, clipsByType }
  }

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    // Данные
    clips,
    selectedClips,
    clipsByTrack,

    // Поиск и фильтрация
    findClip,
    getClipsByTrack,
    getClipsInRange,
    getClipsByType,
    findNearestClipToTime,

    // Действия с клипами
    addClip: async (trackId: string, mediaFile: MediaFile, startTime: number, _duration?: number) => {
      await addClip(trackId, mediaFile, startTime)
    },
    removeClip,
    updateClip: async (clipId: string, updates: Partial<TimelineClip>) => {
      // Преобразуем feature updates в domain updates
      const domainUpdates = {
        ...updates,
        sourceIn: updates.mediaStartTime,
        sourceOut: updates.mediaEndTime,
        playbackRate: updates.speed,
      }
      // Убираем feature-only свойства
      delete (domainUpdates as any).mediaStartTime
      delete (domainUpdates as any).mediaEndTime
      delete (domainUpdates as any).speed
      delete (domainUpdates as any).isReversed
      delete (domainUpdates as any).maintainPitch
      delete (domainUpdates as any).offset
      delete (domainUpdates as any).type

      await updateClip(clipId, domainUpdates as any)
    },
    moveClip,
    splitClip,
    trimClip,
    duplicateClip,

    // Выделение
    selectClip,
    selectMultipleClips,
    selectClipsInArea,
    clearClipSelection,

    // Управление свойствами клипов
    setClipVolume,
    setClipSpeed,
    setClipOpacity,
    toggleClipReverse,
    setClipPosition,

    // Валидация и проверки
    canPlaceClip,
    getClipConflicts,
    isClipSelected,

    // Утилиты
    getClipAtTime,
    getClipStats,
  }
}

/**
 * Хук для управления связанными клипами
 */

import { useCallback, useMemo } from "react"
import type { TimelineClip, TimelineSection, TimelineTrack } from "../types"
import { useTimeline } from "./use-timeline"

export interface LinkedClipsPair {
  id: string
  clip1: TimelineClip
  clip2: TimelineClip
  type: "video-audio" | "audio-video" | "multi-camera"
  isActive: boolean
  canUnlink: boolean
}

export interface UseLinkedClipsReturn {
  /** Все связанные пары клипов */
  linkedPairs: LinkedClipsPair[]
  /** Количество связанных пар */
  linkedCount: number
  /** Есть ли активные связанные клипы */
  hasActiveLinks: boolean

  /** Связать два клипа */
  linkClips: (clip1Id: string, clip2Id: string) => boolean
  /** Разорвать связь между клипами */
  unlinkClips: (clip1Id: string, clip2Id: string) => boolean
  /** Разорвать все связи для клипа */
  unlinkClip: (clipId: string) => boolean

  /** Получить связанный клип */
  getLinkedClip: (clipId: string) => TimelineClip | null
  /** Проверить, связан ли клип */
  isClipLinked: (clipId: string) => boolean
  /** Получить тип связи */
  getLinkType: (clipId: string) => "video-audio" | "audio-video" | "multi-camera" | null

  /** Автоматически связать клипы по медиа файлу */
  autoLinkClipsByMedia: (mediaFileId: string) => number
  /** Найти потенциальные связи */
  findPotentialLinks: () => Array<{
    clip1: TimelineClip
    clip2: TimelineClip
    confidence: number
    reason: string
  }>

  /** Синхронизировать связанные клипы */
  syncLinkedClips: (clipId: string, updates: Partial<TimelineClip>) => void
  /** Проверить синхронизацию */
  validateLinkSync: (clipId: string) => boolean

  /** Переместить связанные клипы */
  moveLinkedClips: (clipId: string, newStartTime: number) => void
  /** Изменить длительность связанных клипов */
  resizeLinkedClips: (clipId: string, newDuration: number) => void

  /** Создать группу связанных клипов */
  createLinkedGroup: (clipIds: string[]) => boolean
  /** Разорвать группу связанных клипов */
  breakLinkedGroup: (clipId: string) => boolean

  /** Получить статистику связей */
  getLinkStats: () => {
    totalLinks: number
    videoAudioLinks: number
    audioVideoLinks: number
    multiCameraLinks: number
    brokenLinks: number
  }

  /** Получить только мультикамерные связи */
  getMulticamPairs: () => LinkedClipsPair[]

  /** Получить все клипы из мультикамерной группы */
  getMulticamGroup: (clipId: string) => TimelineClip[]
}

export function useLinkedClips(): UseLinkedClipsReturn {
  const { project, updateClip } = useTimeline()

  // Получаем все клипы из проекта
  const getAllClips = useCallback((): TimelineClip[] => {
    if (!project) return []

    const clips: TimelineClip[] = []

    // Клипы из глобальных треков
    project.globalTracks?.forEach((track: TimelineTrack) => {
      clips.push(...track.clips)
    })

    // Клипы из секций
    project.sections?.forEach((section: TimelineSection) => {
      section.tracks?.forEach((track: TimelineTrack) => {
        clips.push(...track.clips)
      })
    })

    return clips
  }, [project])

  // Получаем трек по ID клипа
  const getTrackByClipId = useCallback(
    (clipId: string): TimelineTrack | null => {
      if (!project) return null

      // Проверяем глобальные треки
      for (const track of project.globalTracks || []) {
        if (track.clips.some((clip) => clip.id === clipId)) {
          return track
        }
      }

      // Проверяем треки в секциях
      for (const section of project.sections || []) {
        for (const track of section.tracks || []) {
          if (track.clips.some((clip) => clip.id === clipId)) {
            return track
          }
        }
      }

      return null
    },
    [project],
  )

  // Определяем тип связи на основе типов треков
  const determineLinkType = useCallback(
    (clip1Id: string, clip2Id: string): LinkedClipsPair["type"] => {
      const track1 = getTrackByClipId(clip1Id)
      const track2 = getTrackByClipId(clip2Id)

      if (!track1 || !track2) {
        return "video-audio" // Значение по умолчанию
      }

      const isVideoTrack = (type: string) => type === "video" || type === "image"
      const isAudioTrack = (type: string) =>
        type === "audio" || type === "music" || type === "voiceover" || type === "sfx" || type === "ambient"

      // Проверяем мультикамерную связь - оба трека видео
      if (isVideoTrack(track1.type) && isVideoTrack(track2.type)) {
        return "multi-camera"
      }

      // Видео-аудио связь
      if (isVideoTrack(track1.type) && isAudioTrack(track2.type)) {
        return "video-audio"
      }

      // Аудио-видео связь
      if (isAudioTrack(track1.type) && isVideoTrack(track2.type)) {
        return "audio-video"
      }

      // По умолчанию для других комбинаций
      return "video-audio"
    },
    [getTrackByClipId],
  )

  // Получаем все связанные пары
  const linkedPairs = useMemo((): LinkedClipsPair[] => {
    const clips = getAllClips()
    const pairs: LinkedClipsPair[] = []
    const processedPairs = new Set<string>()

    clips.forEach((clip1) => {
      if (clip1.linkedClipId) {
        const clip2 = clips.find((c) => c.id === clip1.linkedClipId)
        if (clip2) {
          // Избегаем дублирования пар
          const pairId1 = `${clip1.id}-${clip2.id}`
          const pairId2 = `${clip2.id}-${clip1.id}`

          if (!processedPairs.has(pairId1) && !processedPairs.has(pairId2)) {
            processedPairs.add(pairId1)

            // Определяем тип связи на основе типов треков
            const type = determineLinkType(clip1.id, clip2.id)

            pairs.push({
              id: pairId1,
              clip1,
              clip2,
              type,
              isActive: clip1.isSelected || clip2.isSelected,
              canUnlink: true,
            })
          }
        }
      }
    })

    return pairs
  }, [getAllClips])

  const linkedCount = linkedPairs.length
  const hasActiveLinks = linkedPairs.some((pair) => pair.isActive)

  const linkClips = useCallback(
    (clip1Id: string, clip2Id: string): boolean => {
      const clips = getAllClips()
      const clip1 = clips.find((c) => c.id === clip1Id)
      const clip2 = clips.find((c) => c.id === clip2Id)

      if (!clip1 || !clip2) return false

      // Проверяем, не связаны ли уже клипы
      if (clip1.linkedClipId === clip2Id || clip2.linkedClipId === clip1Id) {
        return false
      }

      // Обновляем оба клипа через updateClip
      void updateClip(clip1Id, {
        linkedClipId: clip2Id,
        isLinked: true,
      })

      void updateClip(clip2Id, {
        linkedClipId: clip1Id,
        isLinked: true,
      })

      return true
    },
    [getAllClips, updateClip],
  )

  const unlinkClips = useCallback(
    (clip1Id: string, clip2Id: string): boolean => {
      void updateClip(clip1Id, {
        linkedClipId: undefined,
        isLinked: false,
      })

      void updateClip(clip2Id, {
        linkedClipId: undefined,
        isLinked: false,
      })

      return true
    },
    [updateClip],
  )

  const unlinkClip = useCallback(
    (clipId: string): boolean => {
      const clips = getAllClips()
      const clip = clips.find((c) => c.id === clipId)

      if (!clip || !clip.linkedClipId) return false

      return unlinkClips(clipId, clip.linkedClipId)
    },
    [getAllClips, unlinkClips],
  )

  const getLinkedClip = useCallback(
    (clipId: string): TimelineClip | null => {
      const clips = getAllClips()
      const clip = clips.find((c) => c.id === clipId)

      if (!clip || !clip.linkedClipId) return null

      return clips.find((c) => c.id === clip.linkedClipId) || null
    },
    [getAllClips],
  )

  const isClipLinked = useCallback(
    (clipId: string): boolean => {
      const clips = getAllClips()
      const clip = clips.find((c) => c.id === clipId)
      return Boolean(clip?.linkedClipId)
    },
    [getAllClips],
  )

  const getLinkType = useCallback(
    (clipId: string): "video-audio" | "audio-video" | "multi-camera" | null => {
      const clips = getAllClips()
      const clip = clips.find((c) => c.id === clipId)

      if (!clip || !clip.linkedClipId) return null

      const linkedClip = clips.find((c) => c.id === clip.linkedClipId)
      if (!linkedClip) return null

      // Определяем тип связи на основе типов треков
      return determineLinkType(clipId, clip.linkedClipId)
    },
    [getAllClips, determineLinkType],
  )

  const autoLinkClipsByMedia = useCallback(
    (mediaFileId: string): number => {
      const clips = getAllClips()
      const relatedClips = clips.filter((c) => c.mediaId === mediaFileId)

      if (relatedClips.length < 2) return 0

      let linkedCount = 0

      // Группируем клипы по типу трека
      const videoClips: TimelineClip[] = []
      const audioClips: TimelineClip[] = []

      relatedClips.forEach((clip) => {
        const track = getTrackByClipId(clip.id)
        if (track) {
          const isVideoTrack = track.type === "video" || track.type === "image"
          const isAudioTrack = ["audio", "music", "voiceover", "sfx", "ambient"].includes(track.type)

          if (isVideoTrack) {
            videoClips.push(clip)
          } else if (isAudioTrack) {
            audioClips.push(clip)
          }
        }
      })

      // Связываем видео с аудио клипами
      videoClips.forEach((videoClip) => {
        audioClips.forEach((audioClip) => {
          if (!videoClip.linkedClipId && !audioClip.linkedClipId) {
            if (linkClips(videoClip.id, audioClip.id)) {
              linkedCount++
            }
          }
        })
      })

      // Связываем видео клипы между собой для мультикамеры
      for (let i = 0; i < videoClips.length; i++) {
        for (let j = i + 1; j < videoClips.length; j++) {
          if (!videoClips[i].linkedClipId && !videoClips[j].linkedClipId) {
            if (linkClips(videoClips[i].id, videoClips[j].id)) {
              linkedCount++
            }
          }
        }
      }

      return linkedCount
    },
    [getAllClips, linkClips, getTrackByClipId],
  )

  const findPotentialLinks = useCallback(() => {
    const clips = getAllClips()
    const potentialLinks: Array<{
      clip1: TimelineClip
      clip2: TimelineClip
      confidence: number
      reason: string
    }> = []

    clips.forEach((clip1) => {
      clips.forEach((clip2) => {
        if (clip1.id >= clip2.id) return // Избегаем дублирования
        if (clip1.linkedClipId || clip2.linkedClipId) return // Уже связаны

        let confidence = 0
        let reason = ""

        // Одинаковый медиа файл
        if (clip1.mediaId === clip2.mediaId) {
          confidence += 80
          reason = "Same media file"
        }

        // Похожие имена
        if (clip1.name && clip2.name) {
          const similarity = calculateStringSimilarity(clip1.name, clip2.name)
          if (similarity > 0.7) {
            confidence += 30
            reason = reason ? `${reason}, Similar names` : "Similar names"
          }
        }

        // Близкие временные позиции
        const timeDifference = Math.abs(clip1.startTime - clip2.startTime)
        if (timeDifference < 1) {
          confidence += 20
          reason = reason ? `${reason}, Same timing` : "Same timing"
        }

        // TODO: Проверка совместимых типов медиа
        // В новой архитектуре нужно использовать тип трека или другие критерии

        if (confidence > 50) {
          potentialLinks.push({
            clip1,
            clip2,
            confidence,
            reason,
          })
        }
      })
    })

    return potentialLinks.sort((a, b) => b.confidence - a.confidence)
  }, [getAllClips])

  const syncLinkedClips = useCallback(
    (clipId: string, updates: Partial<TimelineClip>) => {
      const linkedClip = getLinkedClip(clipId)
      if (!linkedClip) return

      // Синхронизируем определенные свойства
      const syncableUpdates: Partial<TimelineClip> = {}

      if (updates.startTime !== undefined) {
        syncableUpdates.startTime = updates.startTime
      }

      if (updates.duration !== undefined) {
        syncableUpdates.duration = updates.duration
      }

      if (updates.isSelected !== undefined) {
        syncableUpdates.isSelected = updates.isSelected
      }

      if (Object.keys(syncableUpdates).length > 0) {
        void updateClip(linkedClip.id, syncableUpdates)
      }
    },
    [getLinkedClip, updateClip],
  )

  const validateLinkSync = useCallback(
    (clipId: string): boolean => {
      const clips = getAllClips()
      const clip = clips.find((c) => c.id === clipId)
      const linkedClip = getLinkedClip(clipId)

      if (!clip || !linkedClip) return false

      // Проверяем синхронизацию основных свойств
      return clip.startTime === linkedClip.startTime && clip.duration === linkedClip.duration
    },
    [getAllClips, getLinkedClip],
  )

  const moveLinkedClips = useCallback(
    (clipId: string, newStartTime: number) => {
      void updateClip(clipId, { startTime: newStartTime })
      syncLinkedClips(clipId, { startTime: newStartTime })
    },
    [updateClip, syncLinkedClips],
  )

  const resizeLinkedClips = useCallback(
    (clipId: string, newDuration: number) => {
      void updateClip(clipId, { duration: newDuration })
      syncLinkedClips(clipId, { duration: newDuration })
    },
    [updateClip, syncLinkedClips],
  )

  const createLinkedGroup = useCallback(
    (clipIds: string[]): boolean => {
      if (clipIds.length < 2) return false

      // Связываем все клипы в группу (каждый с каждым)
      for (let i = 0; i < clipIds.length; i++) {
        for (let j = i + 1; j < clipIds.length; j++) {
          linkClips(clipIds[i], clipIds[j])
        }
      }

      return true
    },
    [linkClips],
  )

  const breakLinkedGroup = useCallback(
    (clipId: string): boolean => {
      const clips = getAllClips()
      const clip = clips.find((c) => c.id === clipId)

      if (!clip) return false

      // Разрываем все связи для этого клипа
      clips.forEach((otherClip) => {
        if (otherClip.linkedClipId === clipId) {
          unlinkClips(clipId, otherClip.id)
        }
      })

      return true
    },
    [getAllClips, unlinkClips],
  )

  const getLinkStats = useCallback(() => {
    const stats = {
      totalLinks: linkedPairs.length,
      videoAudioLinks: 0,
      audioVideoLinks: 0,
      multiCameraLinks: 0,
      brokenLinks: 0,
    }

    linkedPairs.forEach((pair) => {
      switch (pair.type) {
        case "video-audio":
          stats.videoAudioLinks++
          break
        case "audio-video":
          stats.audioVideoLinks++
          break
        case "multi-camera":
          stats.multiCameraLinks++
          break
        default:
          break
      }
    })

    // Проверяем на разорванные связи
    const clips = getAllClips()
    clips.forEach((clip) => {
      if (clip.linkedClipId) {
        const linkedClip = clips.find((c) => c.id === clip.linkedClipId)
        if (!linkedClip || linkedClip.linkedClipId !== clip.id) {
          stats.brokenLinks++
        }
      }
    })

    return stats
  }, [linkedPairs, getAllClips])

  // Получить только мультикамерные связи
  const getMulticamPairs = useCallback((): LinkedClipsPair[] => {
    return linkedPairs.filter((pair) => pair.type === "multi-camera")
  }, [linkedPairs])

  // Получить все клипы из мультикамерной группы
  const getMulticamGroup = useCallback(
    (clipId: string): TimelineClip[] => {
      const group: TimelineClip[] = []
      const processed = new Set<string>()

      const addToGroup = (id: string) => {
        if (processed.has(id)) return
        processed.add(id)

        const clip = getAllClips().find((c) => c.id === id)
        if (!clip) return

        group.push(clip)

        // Рекурсивно добавляем все связанные мультикамерные клипы
        linkedPairs.forEach((pair) => {
          if (pair.type === "multi-camera") {
            if (pair.clip1.id === id && !processed.has(pair.clip2.id)) {
              addToGroup(pair.clip2.id)
            } else if (pair.clip2.id === id && !processed.has(pair.clip1.id)) {
              addToGroup(pair.clip1.id)
            }
          }
        })
      }

      addToGroup(clipId)
      return group
    },
    [getAllClips, linkedPairs],
  )

  return {
    linkedPairs,
    linkedCount,
    hasActiveLinks,

    linkClips,
    unlinkClips,
    unlinkClip,

    getLinkedClip,
    isClipLinked,
    getLinkType,

    autoLinkClipsByMedia,
    findPotentialLinks,

    syncLinkedClips,
    validateLinkSync,

    moveLinkedClips,
    resizeLinkedClips,

    createLinkedGroup,
    breakLinkedGroup,

    getLinkStats,

    // Мультикамерные методы
    getMulticamPairs,
    getMulticamGroup,
  }
}

// Утилитарная функция для расчета сходства строк
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

// Алгоритм Левенштейна для расчета расстояния между строками
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}

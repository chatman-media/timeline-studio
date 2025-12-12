import { useCallback, useEffect, useMemo, useRef } from "react"

import type { TimelineClip } from "../types"

interface UseOptimizedClipsProps {
  clips: TimelineClip[]
  viewportWidth: number
  scrollOffset: number
  timeScale: number
  bufferSize?: number // Размер буфера в пикселях для предзагрузки клипов за пределами viewport
}

export function useOptimizedClips({
  clips,
  viewportWidth,
  scrollOffset,
  timeScale,
  bufferSize = 200,
}: UseOptimizedClipsProps) {
  // Кэш для быстрого доступа к клипам по ID
  const clipsCacheRef = useRef<Map<string, TimelineClip>>(new Map())

  // Обновляем кэш при изменении клипов
  useEffect(() => {
    clipsCacheRef.current.clear()
    clips.forEach((clip) => {
      clipsCacheRef.current.set(clip.id, clip)
    })
  }, [clips])

  // Вычисляем видимые клипы с учётом буфера
  const visibleClips = useMemo(() => {
    const startTime = Math.max(0, scrollOffset / timeScale - bufferSize / timeScale)
    const endTime = (scrollOffset + viewportWidth + bufferSize) / timeScale

    return clips.filter((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      return clipEndTime >= startTime && clip.startTime <= endTime
    })
  }, [clips, scrollOffset, viewportWidth, timeScale, bufferSize])

  // Оптимизированная функция поиска клипа
  const getClipById = useCallback((clipId: string) => {
    return clipsCacheRef.current.get(clipId)
  }, [])

  // Функция для определения, находится ли клип в viewport
  const isClipInViewport = useCallback(
    (clip: TimelineClip) => {
      const clipLeft = clip.startTime * timeScale
      const clipRight = (clip.startTime + clip.duration) * timeScale

      return clipRight >= scrollOffset && clipLeft <= scrollOffset + viewportWidth
    },
    [scrollOffset, viewportWidth, timeScale],
  )

  // Функция для группировки перекрывающихся клипов (для оптимизации рендеринга)
  const groupOverlappingClips = useMemo(() => {
    const groups: TimelineClip[][] = []
    const sortedClips = [...visibleClips].sort((a, b) => a.startTime - b.startTime)

    sortedClips.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration

      // Находим группу, в которую можно добавить клип
      let added = false
      for (const group of groups) {
        const groupEndTime = Math.max(...group.map((c) => c.startTime + c.duration))

        if (clip.startTime >= groupEndTime) {
          group.push(clip)
          added = true
          break
        }
      }

      if (!added) {
        groups.push([clip])
      }
    })

    return groups
  }, [visibleClips])

  // Функция для батчевого обновления клипов
  const batchUpdateClips = useCallback(
    (updates: Array<{ id: string; changes: Partial<TimelineClip> }>) => {
      const updatedClips = clips.map((clip) => {
        const update = updates.find((u) => u.id === clip.id)
        return update ? { ...clip, ...update.changes } : clip
      })

      return updatedClips
    },
    [clips],
  )

  return {
    visibleClips,
    getClipById,
    isClipInViewport,
    groupOverlappingClips,
    batchUpdateClips,
    totalClips: clips.length,
    visibleClipsCount: visibleClips.length,
  }
}

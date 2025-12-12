/**
 * Clip Operations Utilities
 *
 * Утилиты для операций с клипами: копирование, вырезание, вставка, разделение
 */

import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types"

// ============================================================================
// ТИПЫ ДЛЯ ОПЕРАЦИЙ С КЛИПАМИ
// ============================================================================

export interface ClipboardData {
  clips: TimelineClip[]
  tracks: TimelineTrack[]
  metadata: {
    copiedAt: Date
    originalTimeRange: {
      startTime: number
      endTime: number
    }
    trackIds: string[]
  }
}

export interface PasteOptions {
  targetTrackId?: string
  targetTime?: number
  mode: "insert" | "overwrite" | "mix"
  preserveRelativePositions?: boolean
  offsetTime?: number
}

export interface SplitOptions {
  atTime: number
  preserveOriginal?: boolean
  createNewIds?: boolean
}

export interface ClipCopyOptions {
  includeEffects?: boolean
  includeFilters?: boolean
  includeTransitions?: boolean
  deepCopy?: boolean
}

// ============================================================================
// COPY OPERATIONS
// ============================================================================

/**
 * Копирует выбранные клипы в буфер обмена
 */
export function copyClips(clips: TimelineClip[], options: ClipCopyOptions = {}): ClipboardData {
  const { includeEffects = true, includeFilters = true, includeTransitions = true, deepCopy = true } = options

  if (clips.length === 0) {
    throw new Error("Нет клипов для копирования")
  }

  // Сортируем клипы по времени начала
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)

  // Определяем временной диапазон
  const startTime = Math.min(...sortedClips.map((c) => c.startTime))
  const endTime = Math.max(...sortedClips.map((c) => c.startTime + c.duration))

  // Получаем уникальные ID треков
  const trackIds = [...new Set(sortedClips.map((c) => c.trackId))]

  // Копируем клипы
  const copiedClips = sortedClips.map((clip) => {
    const baseCopy = deepCopy ? deepCloneClip(clip) : { ...clip }

    // Применяем опции копирования
    if (!includeEffects) {
      baseCopy.effects = []
    }
    if (!includeFilters) {
      baseCopy.filters = []
    }
    if (!includeTransitions) {
      baseCopy.transitions = []
    }

    return baseCopy
  })

  return {
    clips: copiedClips,
    tracks: [], // TODO: Реализовать копирование треков если нужно
    metadata: {
      copiedAt: new Date(),
      originalTimeRange: { startTime, endTime },
      trackIds,
    },
  }
}

/**
 * Глубокое клонирование клипа
 */
function deepCloneClip(clip: TimelineClip): TimelineClip {
  return {
    ...clip,
    id: `${clip.id}-copy-${Date.now()}`, // Новый ID для копии
    effects: clip.effects?.map((effect) => ({ ...effect, id: `${effect.id}-copy` })) || [],
    filters: clip.filters?.map((filter) => ({ ...filter, id: `${filter.id}-copy` })) || [],
    transitions: clip.transitions?.map((transition) => ({ ...transition, id: `${transition.id}-copy` })) || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// ============================================================================
// PASTE OPERATIONS
// ============================================================================

/**
 * Вставляет клипы из буфера обмена
 */
export function pasteClips(
  project: TimelineProject,
  clipboardData: ClipboardData,
  options: PasteOptions,
): {
  updatedProject: TimelineProject
  pastedClips: TimelineClip[]
} {
  const { targetTrackId, targetTime = 0, mode = "insert", preserveRelativePositions = true, offsetTime = 0 } = options

  if (clipboardData.clips.length === 0) {
    return { updatedProject: project, pastedClips: [] }
  }

  // Вычисляем смещение по времени
  const originalStartTime = clipboardData.metadata.originalTimeRange.startTime
  const timeOffset = targetTime - originalStartTime + offsetTime

  // Подготавливаем клипы для вставки
  const clipsToInsert = clipboardData.clips.map((clip) => {
    const newClip: TimelineClip = {
      ...clip,
      id: `paste-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      startTime: clip.startTime + timeOffset,
      trackId: targetTrackId || clip.trackId,
      isSelected: false, // Сбрасываем выделение
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Обновляем ID для эффектов, фильтров и переходов
    newClip.effects =
      newClip.effects?.map((effect) => ({
        ...effect,
        id: `paste-${effect.id}-${Date.now()}`,
      })) || []

    newClip.filters =
      newClip.filters?.map((filter) => ({
        ...filter,
        id: `paste-${filter.id}-${Date.now()}`,
      })) || []

    newClip.transitions =
      newClip.transitions?.map((transition) => ({
        ...transition,
        id: `paste-${transition.id}-${Date.now()}`,
      })) || []

    return newClip
  })

  // Применяем вставку в зависимости от режима
  const updatedProject = applyPasteMode(project, clipsToInsert, mode)

  return {
    updatedProject,
    pastedClips: clipsToInsert,
  }
}

/**
 * Применяет режим вставки клипов
 */
function applyPasteMode(
  project: TimelineProject,
  clipsToInsert: TimelineClip[],
  mode: PasteOptions["mode"],
): TimelineProject {
  let updatedProject = { ...project }

  switch (mode) {
    case "insert":
      // Вставляем клипы, сдвигая существующие
      updatedProject = insertClipsWithRipple(updatedProject, clipsToInsert)
      break

    case "overwrite":
      // Перезаписываем существующие клипы
      updatedProject = overwriteClips(updatedProject, clipsToInsert)
      break

    case "mix":
      // Просто добавляем клипы без изменения существующих
      updatedProject = addClipsDirectly(updatedProject, clipsToInsert)
      break

    default:
      // По умолчанию используем режим mix
      updatedProject = addClipsDirectly(updatedProject, clipsToInsert)
      break
  }

  return updatedProject
}

/**
 * Вставляет клипы со сдвигом существующих (ripple)
 */
function insertClipsWithRipple(project: TimelineProject, clipsToInsert: TimelineClip[]): TimelineProject {
  // Группируем клипы по трекам
  const clipsByTrack = new Map<string, TimelineClip[]>()

  clipsToInsert.forEach((clip) => {
    if (!clipsByTrack.has(clip.trackId)) {
      clipsByTrack.set(clip.trackId, [])
    }
    clipsByTrack.get(clip.trackId)!.push(clip)
  })

  // Обновляем каждый трек
  const updatedSections = project.sections.map((section) => ({
    ...section,
    tracks: section.tracks.map((track) => {
      const newClips = clipsByTrack.get(track.id)
      if (!newClips || newClips.length === 0) {
        return track
      }

      // Находим точку вставки
      const insertTime = Math.min(...newClips.map((c) => c.startTime))
      const insertDuration = Math.max(...newClips.map((c) => c.startTime + c.duration)) - insertTime

      // Сдвигаем существующие клипы
      const updatedClips = track.clips.map((existingClip) => {
        if (existingClip.startTime >= insertTime) {
          return {
            ...existingClip,
            startTime: existingClip.startTime + insertDuration,
          }
        }
        return existingClip
      })

      // Добавляем новые клипы
      return {
        ...track,
        clips: [...updatedClips, ...newClips],
      }
    }),
  }))

  return {
    ...project,
    sections: updatedSections,
  }
}

/**
 * Перезаписывает существующие клипы
 */
function overwriteClips(project: TimelineProject, clipsToInsert: TimelineClip[]): TimelineProject {
  // Группируем клипы по трекам
  const clipsByTrack = new Map<string, TimelineClip[]>()

  clipsToInsert.forEach((clip) => {
    if (!clipsByTrack.has(clip.trackId)) {
      clipsByTrack.set(clip.trackId, [])
    }
    clipsByTrack.get(clip.trackId)!.push(clip)
  })

  const updatedSections = project.sections.map((section) => ({
    ...section,
    tracks: section.tracks.map((track) => {
      const newClips = clipsByTrack.get(track.id)
      if (!newClips || newClips.length === 0) {
        return track
      }

      // Определяем диапазон перезаписи
      const overwriteStart = Math.min(...newClips.map((c) => c.startTime))
      const overwriteEnd = Math.max(...newClips.map((c) => c.startTime + c.duration))

      // Удаляем или обрезаем пересекающиеся клипы
      const filteredClips = track.clips.filter((existingClip) => {
        const clipStart = existingClip.startTime
        const clipEnd = existingClip.startTime + existingClip.duration

        // Полностью вне диапазона - оставляем
        if (clipEnd <= overwriteStart || clipStart >= overwriteEnd) {
          return true
        }

        // Пересекается - удаляем (можно расширить для частичной обрезки)
        return false
      })

      // Добавляем новые клипы
      return {
        ...track,
        clips: [...filteredClips, ...newClips],
      }
    }),
  }))

  return {
    ...project,
    sections: updatedSections,
  }
}

/**
 * Просто добавляет клипы без изменения существующих
 */
function addClipsDirectly(project: TimelineProject, clipsToInsert: TimelineClip[]): TimelineProject {
  // Группируем клипы по трекам
  const clipsByTrack = new Map<string, TimelineClip[]>()

  clipsToInsert.forEach((clip) => {
    if (!clipsByTrack.has(clip.trackId)) {
      clipsByTrack.set(clip.trackId, [])
    }
    clipsByTrack.get(clip.trackId)!.push(clip)
  })

  const updatedSections = project.sections.map((section) => ({
    ...section,
    tracks: section.tracks.map((track) => {
      const newClips = clipsByTrack.get(track.id)
      if (!newClips || newClips.length === 0) {
        return track
      }

      return {
        ...track,
        clips: [...track.clips, ...newClips],
      }
    }),
  }))

  return {
    ...project,
    sections: updatedSections,
  }
}

// ============================================================================
// CUT OPERATIONS
// ============================================================================

/**
 * Вырезает выбранные клипы (копирует + удаляет)
 */
export function cutClips(
  project: TimelineProject,
  clips: TimelineClip[],
  options: ClipCopyOptions = {},
): {
  updatedProject: TimelineProject
  clipboardData: ClipboardData
} {
  // Сначала копируем
  const clipboardData = copyClips(clips, options)

  // Затем удаляем оригиналы
  const clipIds = new Set(clips.map((c) => c.id))

  const updatedSections = project.sections.map((section) => ({
    ...section,
    tracks: section.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => !clipIds.has(clip.id)),
    })),
  }))

  const updatedProject = {
    ...project,
    sections: updatedSections,
  }

  return {
    updatedProject,
    clipboardData,
  }
}

// ============================================================================
// SPLIT OPERATIONS
// ============================================================================

/**
 * Разделяет клип в указанной позиции
 */
export function splitClip(
  clip: TimelineClip,
  options: SplitOptions,
): { leftClip: TimelineClip; rightClip: TimelineClip } {
  const { atTime, createNewIds = true } = options

  // Валидация
  if (atTime <= clip.startTime || atTime >= clip.startTime + clip.duration) {
    throw new Error("Позиция разделения должна быть внутри клипа")
  }

  // Вычисляем параметры для разделения
  const splitOffset = atTime - clip.startTime
  const leftDuration = splitOffset
  const rightDuration = clip.duration - splitOffset
  const rightMediaStartTime = clip.mediaStartTime + splitOffset

  // Создаем левую часть
  const leftClip: TimelineClip = {
    ...clip,
    id: createNewIds ? `${clip.id}-left-${Date.now()}` : clip.id,
    duration: leftDuration,
    mediaEndTime: clip.mediaStartTime + leftDuration,
    updatedAt: new Date(),
  }

  // Создаем правую часть
  const rightClip: TimelineClip = {
    ...clip,
    id: createNewIds ? `${clip.id}-right-${Date.now()}` : `${clip.id}-split`,
    name: `${clip.name} (разделен)`,
    startTime: atTime,
    duration: rightDuration,
    mediaStartTime: rightMediaStartTime,
    mediaEndTime: clip.mediaEndTime,
    offset: rightMediaStartTime,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Копируем эффекты, фильтры и переходы
  if (createNewIds) {
    rightClip.effects =
      rightClip.effects?.map((effect) => ({
        ...effect,
        id: `${effect.id}-split`,
      })) || []

    rightClip.filters =
      rightClip.filters?.map((filter) => ({
        ...filter,
        id: `${filter.id}-split`,
      })) || []

    rightClip.transitions =
      rightClip.transitions?.map((transition) => ({
        ...transition,
        id: `${transition.id}-split`,
      })) || []
  }

  return { leftClip, rightClip }
}

/**
 * Разделяет клип в проекте
 */
export function splitClipInProject(project: TimelineProject, clipId: string, options: SplitOptions): TimelineProject {
  const updatedSections = project.sections.map((section) => ({
    ...section,
    tracks: section.tracks.map((track) => {
      const clipIndex = track.clips.findIndex((c) => c.id === clipId)
      if (clipIndex === -1) {
        return track
      }

      const clip = track.clips[clipIndex]
      const { leftClip, rightClip } = splitClip(clip, options)

      // Заменяем оригинальный клип на два новых
      const newClips = [...track.clips]
      newClips.splice(clipIndex, 1, leftClip, rightClip)

      return {
        ...track,
        clips: newClips,
      }
    }),
  }))

  return {
    ...project,
    sections: updatedSections,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Проверяет, можно ли вставить клипы в указанную позицию
 */
export function canPasteClips(
  _project: TimelineProject,
  clipboardData: ClipboardData,
  _options: PasteOptions,
): { canPaste: boolean; conflicts: string[] } {
  const conflicts: string[] = []

  if (!clipboardData.clips.length) {
    return { canPaste: false, conflicts: ["Буфер обмена пуст"] }
  }

  // Дополнительные проверки можно добавить здесь
  // Например, проверка на существование целевых треков

  return { canPaste: true, conflicts }
}

/**
 * Находит клипы в указанном диапазоне времени
 */
export function findClipsInRange(
  project: TimelineProject,
  trackId: string,
  startTime: number,
  endTime: number,
): TimelineClip[] {
  const clips: TimelineClip[] = []

  project.sections.forEach((section) => {
    const track = section.tracks.find((t) => t.id === trackId)
    if (track) {
      track.clips.forEach((clip) => {
        const clipStart = clip.startTime
        const clipEnd = clip.startTime + clip.duration

        // Проверяем пересечение
        if (clipStart < endTime && clipEnd > startTime) {
          clips.push(clip)
        }
      })
    }
  })

  return clips
}

/**
 * Получает статистику по буферу обмена
 */
export function getClipboardStats(clipboardData: ClipboardData): {
  totalClips: number
  totalDuration: number
  trackCount: number
  timeRange: { start: number; end: number }
} {
  const { clips, metadata } = clipboardData

  return {
    totalClips: clips.length,
    totalDuration: metadata.originalTimeRange.endTime - metadata.originalTimeRange.startTime,
    trackCount: metadata.trackIds.length,
    timeRange: {
      start: metadata.originalTimeRange.startTime,
      end: metadata.originalTimeRange.endTime,
    },
  }
}

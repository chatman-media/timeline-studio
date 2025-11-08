/**
 * Функции создания элементов для Timeline AI инструментов
 */

import type { TimelineClip, TimelineSection, TimelineTrack } from "@/features/timeline/types/timeline"

import { getTimelineStateAccess } from "../types"
import { determineContentType, getColorForContentType } from "./detectors"
import { extractDateFromClip } from "./formatters"
import { generateSectionId, generateTrackId } from "./generators"

export function createDefaultTrackStructure(templateType: string): TimelineTrack[] {
  const tracks: TimelineTrack[] = []

  switch (templateType) {
    case "basic":
      tracks.push(
        {
          id: generateTrackId(),
          name: "Video 1",
          type: "video",
          order: 0,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio 1",
          type: "audio",
          order: 1,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
      )
      break
    case "advanced":
      tracks.push(
        {
          id: generateTrackId(),
          name: "Video Main",
          type: "video",
          order: 0,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Video Overlay",
          type: "video",
          order: 1,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio Main",
          type: "audio",
          order: 2,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio Music",
          type: "music",
          order: 3,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Subtitles",
          type: "subtitle",
          order: 4,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
      )
      break
    default:
      tracks.push(
        {
          id: generateTrackId(),
          name: "Video 1",
          type: "video",
          order: 0,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio 1",
          type: "audio",
          order: 1,
          clips: [],
          transitions: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
      )
      break
  }

  return tracks
}

export function createSectionsByDate(clips: TimelineClip[], settings: any): TimelineSection[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return []
  }

  // Группируем клипы по дате создания
  const dateGroups = new Map<string, TimelineClip[]>()

  clips.forEach((clip) => {
    // Предполагаем, что у клипа есть дата создания в метаданных
    const date = extractDateFromClip(clip)
    const dateKey = date.toDateString()

    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, [])
    }
    dateGroups.get(dateKey)!.push(clip)
  })

  const sections: TimelineSection[] = []

  for (const [dateKey, dateClips] of Array.from(dateGroups.entries())) {
    const minStartTime = Math.min(...dateClips.map((c) => c.startTime))
    const maxEndTime = Math.max(...dateClips.map((c) => c.startTime + c.duration))

    const section: TimelineSection = {
      id: generateSectionId(),
      index: sections.length,
      name: `Section ${dateKey}`,
      startTime: minStartTime,
      endTime: maxEndTime,
      duration: maxEndTime - minStartTime,
      realStartTime: new Date(dateKey),
      tracks: [],
      isCollapsed: false,
      color: settings.defaultColor || "#4F46E5",
      tags: ["date-grouped"],
    }
    sections.push(section)
  }

  return sections
}

export function createSectionsByDuration(clips: TimelineClip[], settings: any): TimelineSection[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return []
  }

  const targetDuration = settings.sectionDuration || 60 // секунды
  const sections: TimelineSection[] = []

  // Сортируем клипы по времени начала
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)

  let currentSection: TimelineSection | null = null
  let currentSectionClips: TimelineClip[] = []
  let sectionStartTime = 0

  for (const clip of sortedClips) {
    // Если секция пустая или если клип выходит за пределы целевой длительности
    if (!currentSection || clip.startTime - sectionStartTime >= targetDuration) {
      // Сохраняем предыдущую секцию
      if (currentSection && currentSectionClips.length > 0) {
        // Секции не содержат клипы напрямую, только треки
        sections.push(currentSection)
      }

      // Создаем новую секцию
      sectionStartTime = clip.startTime
      currentSection = {
        id: generateSectionId(),
        index: sections.length,
        name: `Section ${sections.length + 1}`,
        startTime: sectionStartTime,
        endTime: sectionStartTime + targetDuration,
        duration: targetDuration,
        tracks: [],
        isCollapsed: false,
        color: settings.defaultColor || "#4F46E5",
        tags: ["duration-based"],
      }
      currentSectionClips = []
    }

    currentSectionClips.push(clip)
  }

  // Добавляем последнюю секцию
  if (currentSection && currentSectionClips.length > 0) {
    const maxEndTime = Math.max(...currentSectionClips.map((c) => c.startTime + c.duration))
    currentSection.endTime = maxEndTime
    currentSection.duration = maxEndTime - currentSection.startTime
    sections.push(currentSection)
  }

  return sections
}

export function createSectionsByContentType(clips: TimelineClip[], _settings: any): TimelineSection[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return []
  }

  // Группируем клипы по типу контента
  const contentGroups = new Map<string, TimelineClip[]>()

  clips.forEach((clip) => {
    const contentType = determineContentType(clip)

    if (!contentGroups.has(contentType)) {
      contentGroups.set(contentType, [])
    }
    contentGroups.get(contentType)!.push(clip)
  })

  const sections: TimelineSection[] = []

  for (const [contentType, contentClips] of Array.from(contentGroups.entries())) {
    const minStartTime = Math.min(...contentClips.map((c) => c.startTime))
    const maxEndTime = Math.max(...contentClips.map((c) => c.startTime + c.duration))

    const section: TimelineSection = {
      id: generateSectionId(),
      index: sections.length,
      name: `${contentType} Section`,
      startTime: minStartTime,
      endTime: maxEndTime,
      duration: maxEndTime - minStartTime,
      tracks: [],
      isCollapsed: false,
      color: getColorForContentType(contentType),
      tags: [`content-${contentType.toLowerCase()}`],
    }
    sections.push(section)
  }

  return sections.sort((a, b) => a.startTime - b.startTime)
}

export function createSectionsByLocation(clips: TimelineClip[], settings: any): TimelineSection[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return []
  }

  // Группируем клипы по локации (извлекаем из метаданных)
  const locationGroups = new Map<string, TimelineClip[]>()

  clips.forEach((clip) => {
    // Пытаемся извлечь локацию из метаданных
    let location = "Unknown Location"

    if (clip.mediaFile?.probeData?.format?.tags?.location) {
      location = String(clip.mediaFile.probeData.format.tags.location)
    } else if (clip.mediaFile?.probeData?.format?.tags?.["com.apple.quicktime.location.ISO6709"]) {
      // Парсим GPS координаты из метаданных Apple
      location = "GPS Location"
    }

    if (!locationGroups.has(location)) {
      locationGroups.set(location, [])
    }
    locationGroups.get(location)!.push(clip)
  })

  const sections: TimelineSection[] = []

  for (const [location, locationClips] of Array.from(locationGroups.entries())) {
    const minStartTime = Math.min(...locationClips.map((c) => c.startTime))
    const maxEndTime = Math.max(...locationClips.map((c) => c.startTime + c.duration))

    const section: TimelineSection = {
      id: generateSectionId(),
      index: sections.length,
      name: location,
      startTime: minStartTime,
      endTime: maxEndTime,
      duration: maxEndTime - minStartTime,
      tracks: [],
      isCollapsed: false,
      color: settings.defaultColor || "#4F46E5",
      tags: ["location-based", location.toLowerCase().replace(/\s+/g, "-")],
    }
    sections.push(section)
  }

  return sections.sort((a, b) => a.startTime - b.startTime)
}

export function createManualSections(settings: any): TimelineSection[] {
  const sections: TimelineSection[] = []

  settings.sections?.forEach((sectionConfig: any, index: number) => {
    const section: TimelineSection = {
      id: generateSectionId(),
      index,
      name: sectionConfig.name || `Section ${index + 1}`,
      startTime: sectionConfig.startTime || index * 60,
      endTime: sectionConfig.endTime || (index + 1) * 60,
      duration: sectionConfig.duration || 60,
      tracks: [],
      isCollapsed: false,
      color: sectionConfig.color || "#4F46E5",
      tags: sectionConfig.tags || [],
    }
    sections.push(section)
  })

  return sections
}

export function createSmartSections(clips: TimelineClip[], settings: any): TimelineSection[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return []
  }

  // Интеллектуальное создание секций на основе анализа контента
  const sections: TimelineSection[] = []

  // Анализируем временные паузы между клипами
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)
  const significantGaps: number[] = []

  for (let i = 1; i < sortedClips.length; i++) {
    const prevEnd = sortedClips[i - 1].startTime + sortedClips[i - 1].duration
    const currentStart = sortedClips[i].startTime
    const gap = currentStart - prevEnd

    // Считаем значительным промежуток больше 3 секунд
    if (gap > 3) {
      significantGaps.push(prevEnd)
    }
  }

  // Создаем секции на основе значительных промежутков
  let lastCutPoint = 0
  significantGaps.forEach((cutPoint) => {
    const sectionClips = sortedClips.filter((c) => c.startTime >= lastCutPoint && c.startTime < cutPoint)

    if (sectionClips.length > 0) {
      const minStartTime = Math.min(...sectionClips.map((c) => c.startTime))
      const maxEndTime = Math.max(...sectionClips.map((c) => c.startTime + c.duration))

      sections.push({
        id: generateSectionId(),
        index: sections.length,
        name: `Chapter ${sections.length + 1}`,
        startTime: minStartTime,
        endTime: maxEndTime,
        duration: maxEndTime - minStartTime,
        tracks: [],
        isCollapsed: false,
        color: settings.defaultColor || "#4F46E5",
        tags: ["smart-section"],
      })
    }

    lastCutPoint = cutPoint
  })

  // Добавляем последнюю секцию
  const lastSectionClips = sortedClips.filter((c) => c.startTime >= lastCutPoint)
  if (lastSectionClips.length > 0) {
    const minStartTime = Math.min(...lastSectionClips.map((c) => c.startTime))
    const maxEndTime = Math.max(...lastSectionClips.map((c) => c.startTime + c.duration))

    sections.push({
      id: generateSectionId(),
      index: sections.length,
      name: `Chapter ${sections.length + 1}`,
      startTime: minStartTime,
      endTime: maxEndTime,
      duration: maxEndTime - minStartTime,
      tracks: [],
      isCollapsed: false,
      color: settings.defaultColor || "#4F46E5",
      tags: ["smart-section"],
    })
  }

  return sections
}

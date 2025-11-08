/**
 * Вспомогательные функции для Timeline AI инструментов
 */

import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types/timeline"
import { createLogger } from "@/lib/tauri-logger"
import { getTimelineStateAccess } from "../types"
import { determineContentType } from "./detectors"

const logger = createLogger({ module: "Helpers" })

export async function getCurrentTimelineProject(): Promise<TimelineProject | null> {
  const timelineStateAccess = getTimelineStateAccess()

  if (timelineStateAccess) {
    return timelineStateAccess.getCurrentProject() as TimelineProject | null
  }

  // Fallback - пытаемся получить из window контекста
  if (typeof window !== "undefined" && (window as any).timelineContext) {
    return (window as any).timelineContext.project
  }

  return null
}

export async function saveTimelineProject(project: TimelineProject): Promise<void> {
  // Интеграция с timeline state machine для сохранения проекта
  if (typeof window !== "undefined" && (window as any).timelineContext) {
    const timelineContext = (window as any).timelineContext
    if (timelineContext.saveProject) {
      await timelineContext.saveProject()
      logger.info(`Проект сохранен: ${project.name}`)
    }
  } else {
    // Fallback - логируем попытку сохранения
    logger.info(`Попытка сохранения проекта: ${project.name} (timeline context недоступен)`)
  }
}

export function assignTrackForClip(tracks: TimelineTrack[], clipConfig: any, strategy: string): string | null {
  // Интеллектуальное назначение трека для клипа
  if (tracks.length === 0) return null

  const contentType = clipConfig.contentType || determineContentType(clipConfig)

  switch (strategy) {
    case "content_type": {
      // Поиск трека по типу контента
      const typeTrack = tracks.find((track) => track.type.toLowerCase().includes(contentType.toLowerCase()))
      if (typeTrack) return typeTrack.id
      break
    }

    case "least_used": {
      // Назначение на наименее используемый трек
      const trackUsage = tracks.map((track: TimelineTrack) => ({
        id: track.id,
        clipCount: track.clips?.length || 0,
      }))
      const leastUsed = trackUsage.reduce((min, current) => (current.clipCount < min.clipCount ? current : min))
      return leastUsed.id
    }

    case "time_based": {
      // Назначение на основе времени (избегаем перекрытий)
      const targetTime = clipConfig.startTime || 0
      const duration = clipConfig.duration || 10

      for (const track of tracks) {
        const hasOverlap =
          track.clips?.some(
            (clip) => targetTime < clip.startTime + clip.duration && targetTime + duration > clip.startTime,
          ) || false

        if (!hasOverlap) return track.id
      }
      break
    }

    case "smart": {
      // Комбинированная стратегия
      // 1. Сначала по типу контента
      const smartTypeTrack = tracks.find((track) => track.type.toLowerCase().includes(contentType.toLowerCase()))
      if (smartTypeTrack) {
        // 2. Проверяем на перекрытия
        const targetTime = clipConfig.startTime || 0
        const duration = clipConfig.duration || 10
        const hasOverlap =
          smartTypeTrack.clips?.some(
            (clip) => targetTime < clip.startTime + clip.duration && targetTime + duration > clip.startTime,
          ) || false

        if (!hasOverlap) return smartTypeTrack.id
      }

      // 3. Fallback на наименее используемый
      const smartTrackUsage = tracks.map((track: TimelineTrack) => ({
        id: track.id,
        clipCount: track.clips?.length || 0,
      }))
      const smartLeastUsed = smartTrackUsage.reduce((min, current) =>
        current.clipCount < min.clipCount ? current : min,
      )
      return smartLeastUsed.id
    }

    case "sequential": {
      // Последовательное распределение по трекам
      const clipCounts = tracks.map((t) => t.clips?.length || 0)
      const minCount = Math.min(...clipCounts)
      const trackIndex = clipCounts.indexOf(minCount)
      return tracks[trackIndex].id
    }

    default:
      // По умолчанию - первый подходящий трек
      return tracks[0].id
  }

  // Если не найден подходящий трек - возвращаем первый
  return tracks[0]?.id || null
}

export function getClipTrackDistribution(clips: TimelineClip[]): Record<string, number> {
  const distribution: Record<string, number> = {}

  clips.forEach((clip) => {
    if (!distribution[clip.trackId]) {
      distribution[clip.trackId] = 0
    }
    distribution[clip.trackId]++
  })

  return distribution
}

export function analyzeTransitionFlow(project: TimelineProject): any[] {
  const transitionAnalysis: any[] = []

  // Собираем все клипы
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  // Группируем по трекам
  const trackClips = new Map<string, TimelineClip[]>()
  allClips.forEach((clip) => {
    if (!trackClips.has(clip.trackId)) {
      trackClips.set(clip.trackId, [])
    }
    trackClips.get(clip.trackId)!.push(clip)
  })

  // Анализируем переходы на каждом треке
  for (const [trackId, clips] of Array.from(trackClips.entries())) {
    const sortedClips = clips.sort((a, b) => a.startTime - b.startTime)

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const currentClip = sortedClips[i]
      const nextClip = sortedClips[i + 1]
      const gap = nextClip.startTime - (currentClip.startTime + currentClip.duration)

      transitionAnalysis.push({
        trackId,
        fromClip: currentClip.id,
        toClip: nextClip.id,
        gap,
        hasTransition: currentClip.transitions.length > 0,
        transitionType: currentClip.transitions[0]?.type || "cut",
      })
    }
  }

  return transitionAnalysis
}

export function generateEmotionalArc(project: TimelineProject): any {
  const sections = project.sections

  if (sections.length === 0) {
    return {
      hasArc: false,
      message: "Нет секций для анализа эмоциональной дуги",
    }
  }

  const emotionProgression = sections.map((section, index) => {
    // Простая логика определения эмоций на основе позиции в проекте
    let emotion = "neutral"
    let intensity = 0.5

    // Начало - установка
    if (index < sections.length * 0.2) {
      emotion = "calm"
      intensity = 0.3
    }
    // Развитие - нарастание
    else if (index < sections.length * 0.4) {
      emotion = "building"
      intensity = 0.6
    }
    // Кульминация
    else if (index < sections.length * 0.7) {
      emotion = "intense"
      intensity = 0.9
    }
    // Развязка
    else if (index < sections.length * 0.9) {
      emotion = "resolving"
      intensity = 0.6
    }
    // Финал
    else {
      emotion = "peaceful"
      intensity = 0.4
    }

    return {
      section: section.name,
      emotion,
      intensity,
      timestamp: section.startTime,
    }
  })

  return {
    hasArc: true,
    progression: emotionProgression,
    overallPattern: detectEmotionalPattern(emotionProgression),
  }
}

function detectEmotionalPattern(progression: any[]): string {
  if (progression.length < 3) return "minimal"

  const intensities = progression.map((p) => p.intensity)
  const maxIntensity = Math.max(...intensities)
  const maxIndex = intensities.indexOf(maxIntensity)

  // Классические паттерны
  if (maxIndex < progression.length * 0.3) return "front-loaded"
  if (maxIndex > progression.length * 0.7) return "climactic"
  if (maxIndex >= progression.length * 0.4 && maxIndex <= progression.length * 0.6) return "classical"

  return "complex"
}

export function calculateOverallEmotionalArc(emotionProgression: any[]): string {
  if (emotionProgression.length < 2) return "flat"

  const firstEmotion = emotionProgression[0].emotion
  const lastEmotion = emotionProgression[emotionProgression.length - 1].emotion

  // Простые паттерны на основе начала и конца
  if (firstEmotion === "calm" && lastEmotion === "peaceful") return "circular"
  if (firstEmotion === "calm" && lastEmotion === "intense") return "ascending"
  if (firstEmotion === "intense" && lastEmotion === "peaceful") return "descending"

  // Проверяем наличие кульминации
  const hasClimax = emotionProgression.some((p) => p.intensity > 0.8)
  if (hasClimax) return "dramatic"

  return "steady"
}

/**
 * Функции анализа для Timeline AI инструментов
 */

import type { TimelineClip, TimelineProject, TimelineTrack } from "@/features/timeline/types/timeline"

import { getTimelineStateAccess } from "../types"
import { detectClipOverlaps } from "./detectors"

export function getTrackTypeDistribution(tracks: TimelineTrack[]): Record<string, number> {
  return tracks.reduce<Record<string, number>>((dist, track) => {
    dist[track.type] = (dist[track.type] || 0) + 1
    return dist
  }, {})
}

export function calculateTimelineDensity(project: TimelineProject): number {
  // Убираем зависимость от timelineStateAccess и считаем плотность
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  if (allClips.length === 0) return 0

  const totalDuration = Math.max(...allClips.map((clip: TimelineClip) => clip.startTime + clip.duration))
  if (totalDuration === 0) return 0

  // Плотность = общая длительность клипов / общая длительность таймлайна
  const totalClipDuration = allClips.reduce((sum, clip) => sum + clip.duration, 0)
  return Math.min(1, totalClipDuration / totalDuration)
}

export function generateStructureRecommendations(project: TimelineProject): string[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return ["Timeline state access не настроен"]
  }

  const recommendations: string[] = []
  const stats = timelineStateAccess.getProjectStats()

  // Анализируем структуру и предлагаем улучшения
  if (stats.totalTracks === 0) {
    recommendations.push("Добавьте треки для размещения контента")
  }

  if (stats.totalClips === 0) {
    recommendations.push("Добавьте клипы на timeline")
  }

  if (stats.totalSections === 0) {
    recommendations.push("Создайте секции для лучшей организации")
  }

  // Собираем все треки
  const allTracks: TimelineTrack[] = [...project.globalTracks]
  project.sections.forEach((section) => allTracks.push(...section.tracks))

  const trackTypeDistribution = getTrackTypeDistribution(allTracks)
  const hasVideo = trackTypeDistribution.video > 0
  const hasAudio = trackTypeDistribution.audio > 0

  if (!hasVideo) {
    recommendations.push("Добавьте видео треки для визуального контента")
  }

  if (!hasAudio) {
    recommendations.push("Добавьте аудио треки для звукового сопровождения")
  }

  return recommendations
}

export function detectStructureIssues(project: TimelineProject): any[] {
  const timelineStateAccess = getTimelineStateAccess()

  if (!timelineStateAccess) {
    return [{ type: "config", message: "Timeline state access не настроен" }]
  }

  const issues: any[] = []
  const stats = timelineStateAccess.getProjectStats()

  // Проверяем основные проблемы структуры
  if (stats.totalTracks > 10) {
    issues.push({
      type: "performance",
      severity: "warning",
      message: "Слишком много треков может замедлить производительность",
      recommendation: "Рассмотрите объединение похожих треков",
    })
  }

  if (stats.totalClips > 100) {
    issues.push({
      type: "complexity",
      severity: "warning",
      message: "Большое количество клипов усложняет навигацию",
      recommendation: "Используйте секции для группировки контента",
    })
  }

  // Проверяем пустые треки
  const allTracks: TimelineTrack[] = [...project.globalTracks]
  project.sections.forEach((section) => allTracks.push(...section.tracks))
  const emptyTracks = allTracks.filter((track) => !track.clips || track.clips.length === 0)

  if (emptyTracks.length > 0) {
    issues.push({
      type: "organization",
      severity: "info",
      message: `Найдено ${emptyTracks.length} пустых треков`,
      recommendation: "Удалите неиспользуемые треки или добавьте контент",
    })
  }

  // Проверяем перекрытия клипов
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })
  const overlappingClips = detectClipOverlaps(allClips)
  if (overlappingClips.length > 0) {
    issues.push({
      type: "timing",
      severity: "error",
      message: `Обнаружено ${overlappingClips.length} перекрывающихся клипов`,
      recommendation: "Исправьте временные конфликты",
    })
  }

  return issues
}

export function analyzeNarrativeStructure(project: TimelineProject): any {
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  if (allClips.length === 0) {
    return {
      hasNarrative: false,
      message: "Нет клипов для анализа нарратива",
    }
  }

  // Сортируем клипы по времени
  const sortedClips = [...allClips].sort((a, b) => a.startTime - b.startTime)

  return {
    hasNarrative: true,
    structure: {
      acts: detectActs(sortedClips),
      pacing: analyzePacing(project),
      emotionalArc: analyzeEmotionalFlow(project),
    },
    suggestions: generateStoryImprovements(project, {
      clips: sortedClips,
    }),
  }
}

export function analyzePacing(project: TimelineProject): any {
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  if (allClips.length === 0) {
    return {
      averageShotLength: 0,
      rhythm: "none",
      tempo: "none",
    }
  }

  const avgDuration = allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length

  return {
    averageShotLength: avgDuration,
    rhythm: avgDuration < 2 ? "fast" : avgDuration < 5 ? "medium" : "slow",
    tempo: calculateTempo(allClips),
    variations: calculatePacingVariations(allClips),
  }
}

export function analyzeEmotionalFlow(project: TimelineProject): any {
  const sections = project.sections

  if (sections.length === 0) {
    return {
      hasEmotionalArc: false,
      message: "Нет секций для анализа эмоционального потока",
    }
  }

  return {
    hasEmotionalArc: true,
    progression: sections.map((section, index) => ({
      section: section.name,
      index,
      emotion: detectSectionEmotion(section),
      intensity: calculateEmotionalIntensity(section),
    })),
    overallArc: calculateOverallEmotionalArc(sections),
  }
}

// Вспомогательные функции для анализа

function detectActs(clips: TimelineClip[]): any[] {
  // Простое деление на 3 акта
  const totalDuration = clips[clips.length - 1].startTime + clips[clips.length - 1].duration
  const actDuration = totalDuration / 3

  return [
    { act: 1, start: 0, end: actDuration, clips: clips.filter((c) => c.startTime < actDuration) },
    {
      act: 2,
      start: actDuration,
      end: actDuration * 2,
      clips: clips.filter((c) => c.startTime >= actDuration && c.startTime < actDuration * 2),
    },
    { act: 3, start: actDuration * 2, end: totalDuration, clips: clips.filter((c) => c.startTime >= actDuration * 2) },
  ]
}

function calculateTempo(clips: TimelineClip[]): string {
  const transitions = clips.length - 1
  if (transitions === 0) return "static"

  const totalDuration = clips[clips.length - 1].startTime + clips[clips.length - 1].duration
  const cutsPerMinute = (transitions / totalDuration) * 60

  if (cutsPerMinute > 40) return "very-fast"
  if (cutsPerMinute > 20) return "fast"
  if (cutsPerMinute > 10) return "medium"
  if (cutsPerMinute > 5) return "slow"
  return "very-slow"
}

function calculatePacingVariations(clips: TimelineClip[]): number {
  if (clips.length < 2) return 0

  const durations = clips.map((c) => c.duration)
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
  const variance = durations.reduce((sum, d) => sum + (d - avgDuration) ** 2, 0) / durations.length

  return Math.sqrt(variance)
}

function detectSectionEmotion(section: any): string {
  // Простая логика на основе тегов или названия секции
  const emotionKeywords = {
    happy: ["happy", "joy", "fun", "celebration"],
    sad: ["sad", "melancholy", "loss", "grief"],
    tense: ["tense", "suspense", "thriller", "action"],
    calm: ["calm", "peaceful", "relaxing", "serene"],
  }

  const sectionText = `${section.name} ${section.tags?.join(" ")}`.toLowerCase()

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some((keyword) => sectionText.includes(keyword))) {
      return emotion
    }
  }

  return "neutral"
}

function calculateEmotionalIntensity(section: any): number {
  // Простая логика на основе количества клипов и их длительности
  const clipsCount = section.tracks.reduce((sum: number, track: any) => sum + track.clips.length, 0)
  return Math.min(1, clipsCount / 10)
}

function calculateOverallEmotionalArc(sections: any[]): string {
  if (sections.length < 2) return "flat"

  // Анализируем прогрессию эмоций
  const emotions = sections.map((s) => detectSectionEmotion(s))
  const hasContrast = new Set(emotions).size > 1

  if (!hasContrast) return "flat"

  // Простые паттерны
  if (emotions[0] === "calm" && emotions[emotions.length - 1] === "happy") return "uplifting"
  if (emotions[0] === "happy" && emotions[emotions.length - 1] === "sad") return "tragic"
  if (emotions.includes("tense") && emotions[emotions.length - 1] === "calm") return "resolution"

  return "complex"
}

function generateStoryImprovements(_project: TimelineProject, analysis: any): string[] {
  const suggestions: string[] = []

  // Анализируем структуру
  if (analysis.clips.length < 5) {
    suggestions.push("Добавьте больше клипов для создания полноценной истории")
  }

  // Анализируем паузы
  const gaps = findGapsInTimeline(analysis.clips)
  if (gaps.length > 0) {
    suggestions.push(`Заполните ${gaps.length} пробелов в таймлайне для плавности повествования`)
  }

  // Анализируем разнообразие
  const trackTypes = new Set(analysis.clips.map((c: TimelineClip) => c.trackId))
  if (trackTypes.size < 2) {
    suggestions.push("Используйте разные треки для создания визуального разнообразия")
  }

  return suggestions
}

function findGapsInTimeline(clips: TimelineClip[]): Array<{ start: number; end: number }> {
  const gaps: Array<{ start: number; end: number }> = []

  for (let i = 1; i < clips.length; i++) {
    const prevEnd = clips[i - 1].startTime + clips[i - 1].duration
    const currentStart = clips[i].startTime

    if (currentStart - prevEnd > 0.5) {
      // Пробел больше 0.5 секунды
      gaps.push({ start: prevEnd, end: currentStart })
    }
  }

  return gaps
}

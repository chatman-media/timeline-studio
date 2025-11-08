/**
 * Функции вычислений для Timeline AI инструментов
 */

import type { TimelineClip, TimelineProject, TimelineSection } from "@/features/timeline/types/timeline"

export function calculateSectionsCoverage(sections: TimelineSection[]): number {
  // Расчет покрытия секций (процент времени timeline покрытого секциями)
  if (sections.length === 0) return 0

  // Находим общую длительность timeline
  const maxEndTime = Math.max(...sections.map((s) => s.startTime + s.duration))
  const minStartTime = Math.min(...sections.map((s) => s.startTime))
  const totalTimelineDuration = maxEndTime - minStartTime

  if (totalTimelineDuration === 0) return 100

  // Сортируем секции по времени начала
  const sortedSections = [...sections].sort((a, b) => a.startTime - b.startTime)

  // Объединяем перекрывающиеся секции для точного расчета покрытия
  const mergedRanges: Array<{ start: number; end: number }> = []

  for (const section of sortedSections) {
    const start = section.startTime
    const end = section.startTime + section.duration

    if (mergedRanges.length === 0) {
      mergedRanges.push({ start, end })
    } else {
      const lastRange = mergedRanges[mergedRanges.length - 1]
      if (start <= lastRange.end) {
        // Перекрытие - объединяем
        lastRange.end = Math.max(lastRange.end, end)
      } else {
        // Нет перекрытия - добавляем новый диапазон
        mergedRanges.push({ start, end })
      }
    }
  }

  // Считаем общую покрытую длительность
  const coveredDuration = mergedRanges.reduce((total, range) => total + (range.end - range.start), 0)

  // Возвращаем процент покрытия
  return Math.round((coveredDuration / totalTimelineDuration) * 100)
}

export function calculateProjectComplexity(project: TimelineProject): number {
  // Оценка сложности проекта (0-1)
  let complexity = 0

  // Факторы сложности
  const allClips: TimelineClip[] = []
  const allTracks = [...project.globalTracks]

  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    allTracks.push(...section.tracks)
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  // 1. Количество клипов
  if (allClips.length > 100) complexity += 0.2
  else if (allClips.length > 50) complexity += 0.1
  else if (allClips.length > 20) complexity += 0.05

  // 2. Количество треков
  if (allTracks.length > 10) complexity += 0.2
  else if (allTracks.length > 5) complexity += 0.1
  else if (allTracks.length > 3) complexity += 0.05

  // 3. Наличие эффектов
  const hasEffects = allClips.some((clip) => clip.effects.length > 0)
  if (hasEffects) complexity += 0.15

  // 4. Наличие переходов
  const hasTransitions = allClips.some((clip) => clip.transitions.length > 0)
  if (hasTransitions) complexity += 0.1

  // 5. Количество секций
  if (project.sections.length > 10) complexity += 0.15
  else if (project.sections.length > 5) complexity += 0.1
  else if (project.sections.length > 2) complexity += 0.05

  // 6. Длительность проекта
  if (project.duration > 3600)
    complexity += 0.1 // Больше часа
  else if (project.duration > 1800) complexity += 0.05 // Больше 30 минут

  return Math.min(1, complexity)
}

export function estimateRenderTime(project: TimelineProject): number {
  // Оценка времени рендеринга в секундах
  const baseTimePerSecond = 2 // Базовое время рендеринга на секунду видео
  const complexity = calculateProjectComplexity(project)

  // Учитываем сложность проекта
  const complexityMultiplier = 1 + complexity * 3 // От 1x до 4x

  // Учитываем разрешение
  const resolution = project.settings.resolution
  let resolutionMultiplier = 1
  if (resolution.width * resolution.height > 3840 * 2160)
    resolutionMultiplier = 3 // 4K+
  else if (resolution.width * resolution.height > 1920 * 1080)
    resolutionMultiplier = 2 // 2K-4K
  else if (resolution.width * resolution.height > 1280 * 720) resolutionMultiplier = 1.5 // HD

  return Math.round(project.duration * baseTimePerSecond * complexityMultiplier * resolutionMultiplier)
}

export function calculateQualityScore(project: TimelineProject): number {
  // Оценка качества проекта (0-100)
  let score = 100

  // Собираем все клипы
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  // Проверяем проблемы
  if (allClips.length === 0) {
    return 0 // Пустой проект
  }

  // 1. Проверка на пробелы в timeline
  const sortedClips = [...allClips].sort((a, b) => a.startTime - b.startTime)
  for (let i = 1; i < sortedClips.length; i++) {
    const prevEnd = sortedClips[i - 1].startTime + sortedClips[i - 1].duration
    const currentStart = sortedClips[i].startTime
    if (currentStart - prevEnd > 1) {
      score -= 5 // Штраф за пробелы
    }
  }

  // 2. Проверка на слишком короткие клипы
  const shortClips = allClips.filter((clip) => clip.duration < 0.5)
  score -= shortClips.length * 2

  // 3. Проверка на отсутствие аудио
  const hasAudio =
    project.globalTracks.some((track) => track.type === "audio" && track.clips.length > 0) ||
    project.sections.some((section) => section.tracks.some((track) => track.type === "audio" && track.clips.length > 0))
  if (!hasAudio) score -= 20

  // 4. Проверка на организацию
  if (project.sections.length === 0 && allClips.length > 10) {
    score -= 10 // Нет секций при большом количестве клипов
  }

  return Math.max(0, Math.min(100, score))
}

export function calculatePacingMetrics(project: TimelineProject): any {
  const allClips: TimelineClip[] = []
  project.globalTracks.forEach((track) => allClips.push(...track.clips))
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips))
  })

  if (allClips.length === 0) {
    return {
      averageShotLength: 0,
      cutsPerMinute: 0,
      pacingVariance: 0,
      rhythm: "none",
    }
  }

  // Сортируем клипы по времени
  const sortedClips = [...allClips].sort((a, b) => a.startTime - b.startTime)

  // Средняя длительность клипа
  const averageShotLength = allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length

  // Количество монтажных склеек в минуту
  const totalDuration = sortedClips[sortedClips.length - 1].startTime + sortedClips[sortedClips.length - 1].duration
  const cutsPerMinute = totalDuration > 0 ? (allClips.length / totalDuration) * 60 : 0

  // Вариативность темпа
  const durations = allClips.map((c) => c.duration)
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
  const variance = durations.reduce((sum, d) => sum + (d - avgDuration) ** 2, 0) / durations.length
  const pacingVariance = Math.sqrt(variance)

  // Определение ритма
  let rhythm = "medium"
  if (cutsPerMinute > 40) rhythm = "very-fast"
  else if (cutsPerMinute > 20) rhythm = "fast"
  else if (cutsPerMinute < 5) rhythm = "slow"
  else if (cutsPerMinute < 2) rhythm = "very-slow"

  return {
    averageShotLength: Math.round(averageShotLength * 100) / 100,
    cutsPerMinute: Math.round(cutsPerMinute * 10) / 10,
    pacingVariance: Math.round(pacingVariance * 100) / 100,
    rhythm,
    totalClips: allClips.length,
    totalDuration: Math.round(totalDuration),
  }
}

export function calculatePacingAnalysis(project: TimelineProject): any {
  const metrics = calculatePacingMetrics(project)

  return {
    metrics,
    analysis: {
      isWellPaced: metrics.cutsPerMinute > 5 && metrics.cutsPerMinute < 30,
      hasGoodVariety: metrics.pacingVariance > 1 && metrics.pacingVariance < 5,
      suggestions: generatePacingSuggestions(metrics),
    },
  }
}

function generatePacingSuggestions(metrics: any): string[] {
  const suggestions: string[] = []

  if (metrics.cutsPerMinute > 40) {
    suggestions.push("Темп слишком быстрый. Рассмотрите увеличение длительности некоторых клипов")
  } else if (metrics.cutsPerMinute < 5) {
    suggestions.push("Темп слишком медленный. Добавьте больше монтажных склеек для динамики")
  }

  if (metrics.pacingVariance < 0.5) {
    suggestions.push("Монотонный ритм. Варьируйте длительность клипов для интереса")
  } else if (metrics.pacingVariance > 10) {
    suggestions.push("Слишком хаотичный ритм. Стабилизируйте длительность клипов")
  }

  if (metrics.averageShotLength < 1) {
    suggestions.push("Клипы слишком короткие. Зритель не успевает воспринять информацию")
  } else if (metrics.averageShotLength > 10) {
    suggestions.push("Клипы слишком длинные. Может быть скучно для зрителя")
  }

  return suggestions
}

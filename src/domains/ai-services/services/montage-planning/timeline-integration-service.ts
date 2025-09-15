/**
 * Timeline Integration Service
 *
 * Сервис для применения монтажных планов к Timeline
 */

import type { MediaFile } from "@/features/media/types/media"
import {
  createTimelineClip,
  createTimelineSection,
  createTimelineTrack,
  type TimelineClip,
  type TimelineProject,
  type TimelineSection,
  type TimelineTrack,
  type TrackType,
} from "@/features/timeline/types"

import { EmotionalTone, type MontagePlan, type PlannedClip, type TransitionPlan } from "../types"

export interface TimelineIntegrationOptions {
  // Создать новую секцию для плана
  createNewSection?: boolean
  sectionName?: string

  // Использовать существующие треки
  useExistingTracks?: boolean

  // Применить переходы
  applyTransitions?: boolean

  // Смещение времени
  timeOffset?: number

  // Целевые треки (если не создаем новые)
  targetVideoTrack?: string
  targetAudioTrack?: string
}

// Экспортируем функции вместо класса со статическими методами
/**
 * Применить монтажный план к Timeline
 */
export function applyPlanToTimeline(
  plan: MontagePlan,
  project: TimelineProject,
  mediaFiles: MediaFile[],
  options: TimelineIntegrationOptions = {},
): TimelineProject {
  const {
    createNewSection = true,
    sectionName = plan.name,
    useExistingTracks = false,
    applyTransitions = true,
    timeOffset = 0,
  } = options

  // Клонируем проект для безопасности
  const updatedProject = { ...project }

  // Создаем мапу медиафайлов по пути для быстрого доступа
  const mediaMap = new Map<string, MediaFile>()
  mediaFiles.forEach((file) => {
    mediaMap.set(file.path, file)
  })

  // Определяем секцию для добавления клипов
  let targetSection: TimelineSection

  if (createNewSection) {
    // Создаем новую секцию для монтажного плана
    targetSection = createTimelineSection(
      sectionName,
      calculateSectionStartTime(updatedProject),
      plan.totalDuration,
      new Date(),
    )

    updatedProject.sections = [...updatedProject.sections, targetSection]
  } else {
    // Используем последнюю секцию или создаем, если нет
    targetSection = updatedProject.sections[updatedProject.sections.length - 1]
    if (!targetSection) {
      targetSection = createTimelineSection("Main Section", 0, plan.totalDuration)
      updatedProject.sections = [targetSection]
    }
  }

  // Определяем треки для клипов
  const { videoTrack, audioTrack } = getOrCreateTracks(targetSection, useExistingTracks, options)

  // Собираем все клипы из последовательностей
  const allClips: PlannedClip[] = []
  const allTransitions: TransitionPlan[] = []

  plan.sequences.forEach((sequence) => {
    allClips.push(...sequence.clips)
    allTransitions.push(...sequence.transitions)
  })

  // Группируем клипы по трекам
  const videoClips = allClips.filter((clip) => {
    if (!clip.fragment?.sourceFile) return false
    return clip.fragment.sourceFile.isVideo || clip.fragment.sourceFile.isImage
  })

  const audioClips = allClips.filter((clip) => {
    if (!clip.fragment?.sourceFile) return false
    return clip.fragment.sourceFile.isAudio
  })

  // Добавляем видео клипы
  if (videoTrack && videoClips.length > 0) {
    const timelineClips = createTimelineClips(videoClips, videoTrack.id, mediaMap, timeOffset)

    // Применяем переходы если нужно
    if (applyTransitions && allTransitions.length > 0) {
      applyTransitionsToClips(timelineClips, allTransitions)
    }

    videoTrack.clips = [...(videoTrack.clips || []), ...timelineClips]
  }

  // Добавляем аудио клипы
  if (audioTrack && audioClips.length > 0) {
    const timelineClips = createTimelineClips(audioClips, audioTrack.id, mediaMap, timeOffset)

    audioTrack.clips = [...(audioTrack.clips || []), ...timelineClips]
  }

  // Обновляем длительность проекта
  updatedProject.duration = Math.max(updatedProject.duration, calculateProjectDuration(updatedProject))

  return updatedProject
}

/**
 * Создать клипы для Timeline из монтажных клипов
 */
function createTimelineClips(
  montageClips: PlannedClip[],
  trackId: string,
  _mediaMap: Map<string, MediaFile>,
  timeOffset: number,
): TimelineClip[] {
  return montageClips
    .map((montageClip, index) => {
      if (!montageClip.fragment || !montageClip.fragment.sourceFile) {
        console.warn(`Fragment or source file not found for clip ${montageClip.fragmentId}`)
        return null
      }

      const mediaFile = montageClip.fragment.sourceFile

      const timelineClip = createTimelineClip(
        mediaFile.id,
        trackId,
        montageClip.fragment.startTime + timeOffset,
        montageClip.fragment.duration,
        montageClip.fragment.startTime,
      )

      // Устанавливаем дополнительные свойства
      timelineClip.id = `montage_clip_${montageClip.fragmentId}_${index}`
      timelineClip.name = `${mediaFile.name} - Moment ${index + 1}`

      // Применяем настройки из монтажного клипа
      if (montageClip.adjustments) {
        const adjustments = montageClip.adjustments

        // Скорость воспроизведения
        if (adjustments.speedMultiplier) {
          timelineClip.playbackRate = adjustments.speedMultiplier
        }

        // Note: fade_in and fade_out are not in ClipAdjustments interface
        // These would need to be added if required

        // Стабилизация
        if (adjustments.stabilization) {
          // Добавляем эффект стабилизации
          timelineClip.appliedEffects = [
            ...(timelineClip.appliedEffects || []),
            {
              effectId: "stabilization",
              enabled: true,
              customParams: {},
            },
          ]
        }

        // Кроп
        if (adjustments.crop) {
          timelineClip.cropSettings = adjustments.crop
        }
      }

      // Добавляем метаданные о моменте
      timelineClip.metadata = {
        ...timelineClip.metadata,
        montageMetadata: {
          momentCategory: montageClip.fragment?.score.category || "",
          momentScore: montageClip.fragment?.score.totalScore || 0,
          compositionScore: montageClip.fragment?.score.scores.composition || 0,
          emotionalTone: getEmotionalToneFromScore(montageClip.fragment?.score.scores.emotional || 0),
          fragmentId: montageClip.fragmentId,
          role: montageClip.role,
          importance: montageClip.importance,
        },
      }

      return timelineClip
    })
    .filter(Boolean) as TimelineClip[]
}

/**
 * Применить переходы к клипам
 */
function applyTransitionsToClips(clips: TimelineClip[], transitions: TransitionPlan[]): void {
  transitions.forEach((transition) => {
    const fromClip = clips.find((c) => c.id.endsWith(transition.fromClipId))
    const toClip = clips.find((c) => c.id.endsWith(transition.toClipId))

    if (fromClip && toClip) {
      // Применяем переход к концу первого клипа
      fromClip.appliedTransitions = [
        ...(fromClip.appliedTransitions || []),
        {
          transitionId: transition.transitionId,
          position: "out",
          duration: transition.duration,
          targetClipId: toClip.id,
          customParams: {},
        },
      ]

      // Корректируем время начала следующего клипа для перекрытия
      const overlap = transition.duration / 2
      toClip.startTime = Math.max(fromClip.startTime + fromClip.duration - overlap, toClip.startTime - overlap)
    }
  })
}

/**
 * Получить или создать треки для монтажа
 */
function getOrCreateTracks(
  section: TimelineSection,
  useExisting: boolean,
  options: TimelineIntegrationOptions,
): { videoTrack?: TimelineTrack; audioTrack?: TimelineTrack } {
  let videoTrack: TimelineTrack | undefined
  let audioTrack: TimelineTrack | undefined

  if (useExisting) {
    // Ищем существующие треки
    videoTrack = section.tracks.find((t) => t.id === options.targetVideoTrack || (t.type === "video" && !t.isLocked))

    audioTrack = section.tracks.find((t) => t.id === options.targetAudioTrack || (t.type === "audio" && !t.isLocked))
  }

  // Создаем новые треки если нужно
  if (!videoTrack) {
    videoTrack = createTimelineTrack("Montage Video", "video" as TrackType)
    videoTrack.order = section.tracks.length
    section.tracks.push(videoTrack)
  }

  if (!audioTrack) {
    audioTrack = createTimelineTrack("Montage Audio", "audio" as TrackType)
    audioTrack.order = section.tracks.length
    section.tracks.push(audioTrack)
  }

  return { videoTrack, audioTrack }
}

/**
 * Рассчитать время начала новой секции
 */
function calculateSectionStartTime(project: TimelineProject): number {
  if (project.sections.length === 0) {
    return 0
  }

  const lastSection = project.sections[project.sections.length - 1]
  return lastSection.startTime + lastSection.duration
}

/**
 * Рассчитать общую длительность проекта
 */
function calculateProjectDuration(project: TimelineProject): number {
  let maxEndTime = 0

  // Проверяем все секции
  project.sections.forEach((section) => {
    const sectionEndTime = section.startTime + section.duration
    maxEndTime = Math.max(maxEndTime, sectionEndTime)

    // Проверяем все треки в секции
    section.tracks.forEach((track) => {
      track.clips?.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration
        maxEndTime = Math.max(maxEndTime, clipEndTime)
      })
    })
  })

  // Проверяем глобальные треки
  project.globalTracks?.forEach((track) => {
    track.clips?.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      maxEndTime = Math.max(maxEndTime, clipEndTime)
    })
  })

  return maxEndTime
}

// Интерфейс для маркера Timeline (временно, пока нет в основных типах)
interface TimelineMarker {
  id: string
  name: string
  time: number
  color: string
  type: string
  description?: string
}

/**
 * Преобразовать монтажный план в маркеры Timeline
 */
export function createMarkersFromPlan(plan: MontagePlan, timeOffset = 0): TimelineMarker[] {
  const markers: TimelineMarker[] = []

  // Маркер начала плана
  markers.push({
    id: `montage_start_${plan.id}`,
    name: `${plan.name} - Start`,
    time: timeOffset,
    color: "#4CAF50",
    type: "section",
    description: `Generated montage plan (${plan.style.name})`,
  })

  // Маркеры для ключевых моментов
  let clipIndex = 0
  plan.sequences.forEach((sequence) => {
    sequence.clips.forEach((clip) => {
      if (clip.fragment && clip.fragment.score.totalScore > 80) {
        markers.push({
          id: `moment_${clip.fragmentId}_${clipIndex}`,
          name: `Key Moment ${clipIndex + 1}`,
          time: (clip.fragment.startTime || 0) + timeOffset,
          color: "#FF9800",
          type: "note",
          description: `${clip.fragment.score.category} - Score: ${clip.fragment.score.totalScore.toFixed(0)}`,
        })
      }
      clipIndex++
    })
  })

  // Маркер конца плана
  markers.push({
    id: `montage_end_${plan.id}`,
    name: `${plan.name} - End`,
    time: plan.totalDuration + timeOffset,
    color: "#F44336",
    type: "section",
  })

  return markers
}

/**
 * Helper function to determine emotional tone from score
 */
function getEmotionalToneFromScore(emotionalScore: number): EmotionalTone {
  if (emotionalScore >= 80) return EmotionalTone.Energetic
  if (emotionalScore >= 70) return EmotionalTone.Excited
  if (emotionalScore >= 60) return EmotionalTone.Happy
  if (emotionalScore >= 40) return EmotionalTone.Calm
  if (emotionalScore >= 20) return EmotionalTone.Tense
  return EmotionalTone.Sad
}

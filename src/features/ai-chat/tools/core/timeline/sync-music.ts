/**
 * AI инструмент для синхронизации с музыкой с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для синхронизации с музыкой
export interface MusicSyncInput {
  musicTrackId: string
  syncOptions?: {
    syncCuts?: boolean
    syncTransitions?: boolean
    beatDetection?: "auto" | "manual" | "bpm-based"
    targetBPM?: number
  }
}

export interface BeatMarker {
  time: number
  strength: number
  isDownbeat: boolean
}

export interface MusicAnalysis {
  bpm: number
  beats: BeatMarker[]
  duration: number
  rhythmComplexity: "low" | "medium" | "high"
  musicClip: any
  detectionMethod: "auto" | "manual" | "bpm-based"
}

export interface SyncResult {
  modifiedClips: string[]
  modifiedTransitions: string[]
  modificationsCount: number
  recommendations: string[]
}

export interface MusicSyncResult {
  musicTrackId: string
  musicClipId: string
  analysis: {
    detectedBPM: number
    beatMarkers: number
    musicDuration: number
    rhythmComplexity: "low" | "medium" | "high"
    detectionMethod: string
  }
  synchronizedElements: string[]
  syncResults: {
    cutsSync?: SyncResult
    transitionsSync?: SyncResult
  }
  totalModifications: number
  syncOptions: MusicSyncInput["syncOptions"]
  overallRecommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для синхронизации Timeline с музыкой с унифицированной обработкой ошибок
 */
export class MusicSyncTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("MusicSyncTool", logger)
  }

  /**
   * Синхронизирует Timeline с музыкальным ритмом
   */
  public async synchronizeTimelineWithMusic(
    input: MusicSyncInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<MusicSyncResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (!data.musicTrackId || data.musicTrackId.trim() === "") {
        errors.push("ID музыкального трека обязателен")
      }

      if (data.syncOptions?.beatDetection) {
        const validDetectionMethods = ["auto", "manual", "bpm-based"]
        if (!validDetectionMethods.includes(data.syncOptions.beatDetection)) {
          errors.push(`Неподдерживаемый метод детекции битов: ${data.syncOptions.beatDetection}`)
        }
      }

      if (data.syncOptions?.targetBPM !== undefined) {
        if (data.syncOptions.targetBPM <= 0 || data.syncOptions.targetBPM > 300) {
          errors.push("BPM должен быть в диапазоне от 1 до 300")
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации параметров синхронизации с музыкой",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const musicTrackId = input.musicTrackId
    const syncOptions = {
      syncCuts: input.syncOptions?.syncCuts !== false, // По умолчанию true
      syncTransitions: input.syncOptions?.syncTransitions !== false, // По умолчанию true
      beatDetection: input.syncOptions?.beatDetection || "auto",
      targetBPM: input.syncOptions?.targetBPM,
    }

    // Выполняем синхронизацию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем синхронизацию с музыкой", {
          musicTrackId,
          syncCuts: syncOptions.syncCuts,
          syncTransitions: syncOptions.syncTransitions,
          beatDetection: syncOptions.beatDetection,
          targetBPM: syncOptions.targetBPM,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для синхронизации. Откройте или создайте проект в timeline")
        }

        // Найти музыкальный трек
        const allTracks = [...currentProject.globalTracks]
        currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

        const musicTrack = allTracks.find((track) => track.id === musicTrackId)
        if (!musicTrack) {
          throw new Error(`Музыкальный трек с ID ${musicTrackId} не найден в проекте`)
        }

        // Найти музыкальный клип
        const musicClip = musicTrack.clips.find(
          (clip: any) => clip.mediaFile?.isAudio || clip.mediaFile?.type === "audio",
        )
        if (!musicClip) {
          throw new Error("Аудио клип не найден на указанном треке")
        }

        this.logger?.info("Анализируем музыку для синхронизации", {
          clipId: musicClip.id,
          duration: musicClip.duration,
          beatDetection: syncOptions.beatDetection,
        })

        // Анализ музыки и детекция битов
        const musicAnalysis = await this.analyzeMusicForSync(musicClip, syncOptions)

        const synchronizedElements: string[] = []
        const warnings: string[] = []
        let totalModifications = 0
        const syncResults: MusicSyncResult["syncResults"] = {}

        // Синхронизация монтажных склеек
        if (syncOptions.syncCuts) {
          this.logger?.info("Синхронизируем монтажные склейки с битами")

          const cutSyncResult = await this.syncCutsWithBeats(currentProject, musicAnalysis)
          syncResults.cutsSync = cutSyncResult
          synchronizedElements.push(...cutSyncResult.modifiedClips)
          totalModifications += cutSyncResult.modificationsCount
        }

        // Синхронизация переходов
        if (syncOptions.syncTransitions) {
          this.logger?.info("Синхронизируем переходы с музыкой")

          const transitionSyncResult = await this.syncTransitionsWithMusic(currentProject, musicAnalysis)
          syncResults.transitionsSync = transitionSyncResult
          synchronizedElements.push(...transitionSyncResult.modifiedTransitions)
          totalModifications += transitionSyncResult.modificationsCount
        }

        // Проверяем результаты синхронизации
        if (totalModifications === 0) {
          warnings.push("Не удалось выполнить синхронизацию - проверьте настройки и контент")
          warnings.push("Возможно, клипы уже синхронизированы или нет подходящих элементов для синхронизации")
        }

        // Генерация дополнительных рекомендаций
        const overallRecommendations = this.generateSyncRecommendations(musicAnalysis, currentProject)

        const result: MusicSyncResult = {
          musicTrackId,
          musicClipId: musicClip.id,
          analysis: {
            detectedBPM: musicAnalysis.bpm,
            beatMarkers: musicAnalysis.beats.length,
            musicDuration: musicAnalysis.duration,
            rhythmComplexity: musicAnalysis.rhythmComplexity,
            detectionMethod: musicAnalysis.detectionMethod,
          },
          synchronizedElements,
          syncResults,
          totalModifications,
          syncOptions,
          overallRecommendations,
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Синхронизация с музыкой завершена", {
          totalModifications,
          synchronizedElements: synchronizedElements.length,
          detectedBPM: musicAnalysis.bpm,
          warningsCount: warnings.length,
        })

        return result
      },
      {
        timeout: options.timeout || 120000, // 2 минуты для синхронизации
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          musicTrackId,
          syncOptionsUsed: Object.keys(syncOptions)
            .filter((key) => syncOptions[key as keyof typeof syncOptions] === true)
            .join(","),
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Анализирует музыку для синхронизации
   */
  private async analyzeMusicForSync(
    musicClip: any,
    syncOptions: MusicSyncInput["syncOptions"],
  ): Promise<MusicAnalysis> {
    const duration = musicClip.duration
    const detectionMethod = syncOptions?.beatDetection || "auto"

    // Определяем BPM
    let bpm: number
    if (syncOptions?.targetBPM) {
      bpm = syncOptions.targetBPM
    } else {
      bpm = this.estimateBPMFromClip(musicClip)
    }

    // Генерируем массив битов на основе BPM
    const beats = this.generateBeatMarkers(bpm, duration, musicClip.startTime)

    // Определяем ритмическую сложность
    const rhythmComplexity = this.calculateRhythmComplexity(bpm, duration)

    return {
      bpm,
      beats,
      duration,
      rhythmComplexity,
      musicClip,
      detectionMethod,
    }
  }

  /**
   * Синхронизирует монтажные склейки с битами
   */
  private async syncCutsWithBeats(project: TimelineProject, musicAnalysis: MusicAnalysis): Promise<SyncResult> {
    const modifiedClips: string[] = []
    const recommendations: string[] = []
    let modificationsCount = 0

    // Собираем все видео треки
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    const videoTracks = allTracks.filter((track) => track.type === "video")

    if (videoTracks.length === 0) {
      recommendations.push("Нет видео треков для синхронизации монтажных склеек")
      return { modifiedClips, modifiedTransitions: [], modificationsCount, recommendations }
    }

    // Для каждого видео трека пытаемся синхронизировать склейки с битами
    for (const track of videoTracks) {
      const trackModifications = this.syncTrackClipsWithBeats(track, musicAnalysis.beats)
      modifiedClips.push(...trackModifications.modifiedClips)
      modificationsCount += trackModifications.count

      if (trackModifications.count > 0) {
        recommendations.push(`Синхронизировано ${trackModifications.count} склеек на треке "${track.name || track.id}"`)
      }
    }

    if (modificationsCount > 0) {
      recommendations.push(`Всего синхронизировано ${modificationsCount} монтажных склеек с музыкальным ритмом`)
      recommendations.push("Проверьте, что переходы выглядят естественно")
    } else {
      recommendations.push("Монтажные склейки уже синхронизированы или нет подходящих для синхронизации")
    }

    return { modifiedClips, modifiedTransitions: [], modificationsCount, recommendations }
  }

  /**
   * Синхронизирует переходы с музыкой
   */
  private async syncTransitionsWithMusic(project: TimelineProject, musicAnalysis: MusicAnalysis): Promise<SyncResult> {
    const modifiedTransitions: string[] = []
    const recommendations: string[] = []
    let modificationsCount = 0

    // Ищем существующие переходы и синхронизируем их с битами
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    for (const track of allTracks) {
      for (const clip of track.clips) {
        if (clip.transitions && clip.transitions.length > 0) {
          for (const transition of clip.transitions) {
            // Найти ближайший бит для синхронизации перехода
            const transitionTime = transition.startTime || clip.startTime
            const nearestBeat = this.findNearestBeat(transitionTime, musicAnalysis.beats)

            if (nearestBeat && Math.abs(nearestBeat.time - transitionTime) < 0.5) {
              // Синхронизируем переход с битом
              transition.startTime = nearestBeat.time
              modifiedTransitions.push(transition.id || `transition_${clip.id}`)
              modificationsCount++
            }
          }
        }
      }
    }

    // Предлагаем создать новые переходы на сильных битах
    const strongBeats = musicAnalysis.beats.filter((beat) => beat.strength > 0.7)
    if (strongBeats.length > 0 && modificationsCount === 0) {
      recommendations.push(
        `Найдено ${strongBeats.length} сильных битов - рассмотрите добавление переходов на эти моменты`,
      )
    }

    if (modificationsCount > 0) {
      recommendations.push(`Синхронизировано ${modificationsCount} переходов с музыкальными битами`)
      recommendations.push("Проверьте плавность переходов после синхронизации")
    } else {
      recommendations.push("Переходы уже синхронизированы или не найдено подходящих для синхронизации")
    }

    return { modifiedClips: [], modifiedTransitions, modificationsCount, recommendations }
  }

  // Вспомогательные методы

  /**
   * Оценивает BPM на основе клипа
   */
  private estimateBPMFromClip(clip: any): number {
    const duration = clip.duration

    // Простая эвристика для оценки BPM
    if (duration < 60) {
      return 140 // Быстрая музыка
    }
    if (duration < 180) {
      return 120 // Умеренная
    }
    return 80 // Медленная
  }

  /**
   * Генерирует маркеры битов
   */
  private generateBeatMarkers(bpm: number, duration: number, startOffset = 0): BeatMarker[] {
    const beats: BeatMarker[] = []
    const beatInterval = 60 / bpm // Интервал между битами в секундах

    for (let time = startOffset; time < startOffset + duration; time += beatInterval) {
      beats.push({
        time,
        strength: Math.random() * 0.5 + 0.5, // Случайная сила бита от 0.5 до 1
        isDownbeat: beats.length % 4 === 0, // Каждый 4-й бит - сильная доля
      })
    }

    return beats
  }

  /**
   * Вычисляет сложность ритма
   */
  private calculateRhythmComplexity(bpm: number, _duration: number): "low" | "medium" | "high" {
    // Оценка сложности ритма на основе BPM и длительности
    if (bpm > 140) {
      return "high" // Быстрая музыка = сложная синхронизация
    }
    if (bpm > 100) {
      return "medium"
    }
    return "low"
  }

  /**
   * Синхронизирует клипы трека с битами
   */
  private syncTrackClipsWithBeats(track: any, beats: BeatMarker[]): { modifiedClips: string[]; count: number } {
    const modifiedClips: string[] = []
    let count = 0

    // Для каждого клипа на треке пытаемся найти ближайший бит
    for (let i = 1; i < track.clips.length; i++) {
      const currentClip = track.clips[i]
      const nearestBeat = this.findNearestBeat(currentClip.startTime, beats)

      if (nearestBeat && Math.abs(nearestBeat.time - currentClip.startTime) < 1.0) {
        // Синхронизируем только если различие меньше 1 секунды
        const adjustment = nearestBeat.time - currentClip.startTime
        currentClip.startTime = nearestBeat.time

        // Корректируем последующие клипы
        for (let j = i + 1; j < track.clips.length; j++) {
          track.clips[j].startTime += adjustment
        }

        modifiedClips.push(currentClip.id)
        count++
      }
    }

    return { modifiedClips, count }
  }

  /**
   * Находит ближайший бит
   */
  private findNearestBeat(time: number, beats: BeatMarker[]): BeatMarker | null {
    if (beats.length === 0) return null

    let nearestBeat = beats[0]
    let minDistance = Math.abs(beats[0].time - time)

    for (const beat of beats) {
      const distance = Math.abs(beat.time - time)
      if (distance < minDistance) {
        minDistance = distance
        nearestBeat = beat
      }
    }

    return nearestBeat
  }

  /**
   * Генерирует рекомендации по синхронизации
   */
  private generateSyncRecommendations(musicAnalysis: MusicAnalysis, project: TimelineProject): string[] {
    const recommendations: string[] = []

    // Рекомендации на основе анализа музыки
    if (musicAnalysis.bpm > 140) {
      recommendations.push("Быстрая музыка - рассмотрите короткие, динамичные кадры")
      recommendations.push("При высоком BPM избегайте слишком частых переходов")
    } else if (musicAnalysis.bpm < 80) {
      recommendations.push("Медленная музыка - используйте более длинные кадры и плавные переходы")
      recommendations.push("Размеренный ритм позволяет сложные композиционные переходы")
    } else {
      recommendations.push("Умеренный темп музыки подходит для разнообразных техник монтажа")
    }

    if (musicAnalysis.rhythmComplexity === "high") {
      recommendations.push("Сложный ритм - будьте осторожны с частыми склейками")
      recommendations.push("Рассмотрите синхронизацию только с сильными битами")
    }

    // Анализ структуры проекта
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    const totalClips = allTracks.reduce((sum, track) => sum + track.clips.length, 0)

    if (totalClips < musicAnalysis.beats.length / 4) {
      recommendations.push("Мало клипов относительно музыкальных битов - добавьте больше контента")
    } else if (totalClips > musicAnalysis.beats.length * 2) {
      recommendations.push("Много клипов для данного музыкального темпа - рассмотрите объединение некоторых")
    }

    // Общие рекомендации
    recommendations.push("Просмотрите результат синхронизации и внесите ручные корректировки при необходимости")
    recommendations.push("Сохраните проект после применения синхронизации")

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const musicSyncTool = new MusicSyncTool()

// Функция-обертка для обратной совместимости
export async function synchronizeWithMusic(params: any): Promise<AIToolResult<MusicSyncResult>> {
  const input: MusicSyncInput = {
    musicTrackId: params.musicTrackId,
    syncOptions: params.syncOptions,
  }

  return musicSyncTool.synchronizeTimelineWithMusic(input)
}

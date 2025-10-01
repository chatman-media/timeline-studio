/**
 * AI Marker Service
 * Сервис для создания и управления маркерами на основе AI анализа
 */

import type { ContentInsights, KeyMoment, SceneInfo } from "@/domains/ai-services/types"
import { KeyMomentType } from "@/domains/ai-services/types"

import type { TimelineMarker } from "../types/markers"

export interface AIMarkerConfig {
  // Типы маркеров для создания
  createSceneMarkers: boolean
  createKeyMomentMarkers: boolean
  createQualityMarkers: boolean
  createEmotionalMarkers: boolean

  // Пороги для создания маркеров
  minConfidence: number // Минимальная уверенность для создания маркера
  minSceneDuration: number // Минимальная длительность сцены в секундах
  minQualityScore: number // Минимальный score качества для маркера

  // Настройки группировки
  groupNearbyMarkers: boolean
  groupingThreshold: number // Секунды между маркерами для группировки
}

const DEFAULT_CONFIG: AIMarkerConfig = {
  createSceneMarkers: true,
  createKeyMomentMarkers: true,
  createQualityMarkers: true,
  createEmotionalMarkers: true,
  minConfidence: 0.7,
  minSceneDuration: 2,
  minQualityScore: 80,
  groupNearbyMarkers: true,
  groupingThreshold: 2,
}

export class AIMarkerService {
  private config: AIMarkerConfig

  constructor(config: Partial<AIMarkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Создание маркеров из сцен
   */
  public createMarkersFromScenes(scenes: SceneInfo[]): TimelineMarker[] {
    if (!this.config.createSceneMarkers) return []

    const markers: TimelineMarker[] = []

    scenes.forEach((scene, index) => {
      // Пропускаем короткие сцены
      if (scene.duration < this.config.minSceneDuration) return

      // Пропускаем сцены с низкой уверенностью
      if (scene.confidence < this.config.minConfidence) return

      markers.push({
        id: `ai-scene-${scene.id || index}`,
        type: "chapter" as const,
        time: scene.startTime,
        name: `Сцена ${index + 1}: ${this.getSceneTypeLabel(scene.type)}`,
        description: `Длительность: ${scene.duration.toFixed(1)}с, Уверенность: ${(scene.confidence * 100).toFixed(0)}%`,
        color: this.getSceneColor(scene.type),
        metadata: {
          source: "ai-analysis",
          sceneId: scene.id,
          sceneType: scene.type,
          confidence: scene.confidence,
        },
      })
    })

    return markers
  }

  /**
   * Создание маркеров из ключевых моментов
   */
  public createMarkersFromKeyMoments(moments: KeyMoment[]): TimelineMarker[] {
    if (!this.config.createKeyMomentMarkers) return []

    const markers: TimelineMarker[] = []

    moments.forEach((moment) => {
      // Пропускаем моменты с низким score
      if (moment.score < this.config.minConfidence) return

      markers.push({
        id: `ai-moment-${moment.id || Date.now()}`,
        type: moment.type === KeyMomentType.CLIMAX ? ("important" as const) : ("note" as const),
        time: moment.timestamp,
        name: this.getMomentTypeLabel(moment.type),
        description: moment.description,
        color: this.getMomentColor(moment.type),
        metadata: {
          source: "ai-analysis",
          momentId: moment.id,
          momentType: moment.type,
          score: moment.score,
          context: (moment as any).context,
        },
      })
    })

    return markers
  }

  /**
   * Создание маркеров из анализа качества
   */
  public createQualityMarkers(insights: ContentInsights, timestamps: number[]): TimelineMarker[] {
    if (!this.config.createQualityMarkers || !insights.qualityMetrics) return []

    const markers: TimelineMarker[] = []
    const { overall } = insights.qualityMetrics

    // Маркер для низкого общего качества
    if (overall < this.config.minQualityScore) {
      timestamps.forEach((timestamp, index) => {
        markers.push({
          id: `ai-quality-${index}`,
          type: "warning" as const,
          time: timestamp,
          name: "Низкое качество видео",
          description: `Общее качество: ${overall}/100. Рекомендуется улучшение.`,
          color: "#ef4444", // Красный
          metadata: {
            source: "ai-analysis",
            qualityScore: overall,
            metrics: {
              sharpness: insights.qualityMetrics!.sharpness,
              brightness: insights.qualityMetrics!.brightness,
              contrast: insights.qualityMetrics!.contrast,
              saturation: insights.qualityMetrics!.saturation,
            },
          },
        })
      })
    }

    return markers
  }

  /**
   * Создание эмоциональных маркеров
   */
  public createEmotionalMarkers(insights: ContentInsights, timestamp: number): TimelineMarker[] {
    if (!this.config.createEmotionalMarkers || !insights.mood) return []

    const markers: TimelineMarker[] = []

    if (insights.mood.dominantEmotion && insights.mood.intensity > this.config.minConfidence) {
      markers.push({
        id: `ai-emotion-${Date.now()}`,
        type: "note" as const,
        time: timestamp,
        name: `Эмоция: ${this.getEmotionLabel(insights.mood.dominantEmotion)}`,
        description: `Интенсивность: ${(insights.mood.intensity * 100).toFixed(0)}%`,
        color: this.getEmotionColor(insights.mood.dominantEmotion),
        metadata: {
          source: "ai-analysis",
          emotionType: insights.mood.dominantEmotion,
          intensity: insights.mood.intensity,
          valence: insights.mood.valence,
          arousal: insights.mood.arousal,
        },
      })
    }

    return markers
  }

  /**
   * Группировка близких маркеров
   */
  public groupNearbyMarkers(markers: TimelineMarker[]): TimelineMarker[] {
    if (!this.config.groupNearbyMarkers || markers.length < 2) {
      return markers
    }

    // Сортируем маркеры по времени
    const sorted = [...markers].sort((a, b) => a.time - b.time)
    const grouped: TimelineMarker[] = []
    let currentGroup: TimelineMarker[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const timeDiff = sorted[i].time - sorted[i - 1].time

      if (timeDiff <= this.config.groupingThreshold) {
        currentGroup.push(sorted[i])
      } else {
        // Завершаем текущую группу
        if (currentGroup.length > 1) {
          grouped.push(this.mergeMarkers(currentGroup))
        } else {
          grouped.push(currentGroup[0])
        }
        currentGroup = [sorted[i]]
      }
    }

    // Обрабатываем последнюю группу
    if (currentGroup.length > 1) {
      grouped.push(this.mergeMarkers(currentGroup))
    } else {
      grouped.push(currentGroup[0])
    }

    return grouped
  }

  /**
   * Объединение группы маркеров в один
   */
  private mergeMarkers(markers: TimelineMarker[]): TimelineMarker {
    const avgTime = markers.reduce((sum: number, m) => sum + Number(m.time), 0) / markers.length
    const types = Array.from(new Set(markers.map((m) => m.type)))
    const names = markers.map((m) => m.name).join(", ")

    return {
      id: `ai-group-${Date.now()}`,
      type: this.getPriorityType(types),
      time: avgTime,
      name: `Группа событий (${markers.length})`,
      description: names,
      color: markers[0].color || "#6b7280",
      metadata: {
        source: "ai-analysis",
        groupedMarkers: markers.map((m) => m.id),
        count: markers.length,
      },
    }
  }

  /**
   * Определение приоритетного типа маркера для группы
   */
  private getPriorityType(types: Array<TimelineMarker["type"]>): TimelineMarker["type"] {
    // Приоритет типов (от высшего к низшему)
    const priority: Array<TimelineMarker["type"]> = [
      "important",
      "chapter",
      "section",
      "sync",
      "export",
      "todo",
      "note",
      "cue",
    ]

    // Ищем первый тип из приоритетного списка, который есть в группе
    for (const priorityType of priority) {
      if (types.includes(priorityType)) {
        return priorityType
      }
    }

    // Если ни один приоритетный тип не найден, возвращаем первый тип или "note"
    return types[0] || "note"
  }

  /**
   * Получение метки для типа сцены
   */
  private getSceneTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      action: "Экшн",
      dialogue: "Диалог",
      landscape: "Пейзаж",
      closeup: "Крупный план",
      establishing: "Общий план",
      montage: "Монтаж",
      transition: "Переход",
    }
    return labels[type] || type
  }

  /**
   * Получение цвета для типа сцены
   */
  private getSceneColor(type: string): string {
    const colors: Record<string, string> = {
      action: "#ef4444", // Красный
      dialogue: "#3b82f6", // Синий
      landscape: "#10b981", // Зеленый
      closeup: "#f59e0b", // Оранжевый
      establishing: "#8b5cf6", // Фиолетовый
      montage: "#ec4899", // Розовый
      transition: "#6b7280", // Серый
    }
    return colors[type] || "#6b7280"
  }

  /**
   * Получение метки для типа момента
   */
  private getMomentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      climax: "Кульминация",
      emotional_peak: "Эмоциональный пик",
      action_peak: "Пик экшна",
      visual_highlight: "Визуальный акцент",
      audio_peak: "Аудио пик",
      transition_point: "Точка перехода",
    }
    return labels[type] || type
  }

  /**
   * Получение цвета для типа момента
   */
  private getMomentColor(type: string): string {
    const colors: Record<string, string> = {
      climax: "#ef4444", // Красный
      emotional_peak: "#f59e0b", // Оранжевый
      action_peak: "#eab308", // Желтый
      visual_highlight: "#3b82f6", // Синий
      audio_peak: "#8b5cf6", // Фиолетовый
      transition_point: "#06b6d4", // Голубой
    }
    return colors[type] || "#6b7280"
  }

  /**
   * Получение метки для эмоции
   */
  private getEmotionLabel(emotion: string): string {
    const labels: Record<string, string> = {
      joy: "Радость",
      sadness: "Грусть",
      anger: "Гнев",
      fear: "Страх",
      surprise: "Удивление",
      disgust: "Отвращение",
      neutral: "Нейтральная",
    }
    return labels[emotion] || emotion
  }

  /**
   * Получение цвета для эмоции
   */
  private getEmotionColor(emotion: string): string {
    const colors: Record<string, string> = {
      joy: "#fbbf24", // Желтый
      sadness: "#60a5fa", // Голубой
      anger: "#f87171", // Красный
      fear: "#c084fc", // Фиолетовый
      surprise: "#fde047", // Яркий желтый
      disgust: "#86efac", // Зеленый
      neutral: "#d1d5db", // Серый
    }
    return colors[emotion] || "#6b7280"
  }

  /**
   * Обновление конфигурации
   */
  public updateConfig(config: Partial<AIMarkerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Получение текущей конфигурации
   */
  public getConfig(): AIMarkerConfig {
    return { ...this.config }
  }
}

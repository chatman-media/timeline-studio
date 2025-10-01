/**
 * Scene Detection Service
 * Определение границ сцен и анализ переходов между ними
 */

import { TransitionType } from "@/domains/shared/types/ai-tools/content-analysis"
import type { TransitionQuality } from "../types"

// Локальный интерфейс для анализа переходов
export interface SceneTransitionAnalysis {
  fromScene: number
  toScene: number
  startTime: number
  endTime: number
  duration: number
  type: TransitionType
  confidence: number
  smoothness: number
  visualImpact: number
  metadata: {
    colorChange: number
    motionChange: number
    audioChange: number
    isNaturalCut: boolean
    requiresAttention: boolean
  }
}

export interface SceneDetectionConfig {
  // Пороги для определения смены сцены
  colorHistogramThreshold: number // Порог изменения цветовой гистограммы (0-1)
  motionVectorThreshold: number // Порог изменения векторов движения (0-1)
  audioLevelThreshold: number // Порог изменения уровня звука (дБ)
  minimumSceneDuration: number // Минимальная длительность сцены (секунды)

  // Параметры для анализа переходов
  transitionDetection: {
    enabled: boolean
    fadeThreshold: number // Порог для определения fade переходов
    dissolveThreshold: number // Порог для определения dissolve переходов
    wipeDetectionEnabled: boolean // Включить определение wipe переходов
    customTransitionsEnabled: boolean // Включить определение пользовательских переходов
  }

  // Оптимизация производительности
  keyframeAnalysisOnly: boolean // Анализировать только ключевые кадры
  parallelProcessing: boolean // Использовать параллельную обработку
  gpuAcceleration: boolean // Использовать GPU ускорение (если доступно)
}

export class SceneDetectionService {
  private config: SceneDetectionConfig

  constructor(config?: Partial<SceneDetectionConfig>) {
    this.config = {
      colorHistogramThreshold: 0.3,
      motionVectorThreshold: 0.4,
      audioLevelThreshold: 10,
      minimumSceneDuration: 1.0,
      transitionDetection: {
        enabled: true,
        fadeThreshold: 0.85,
        dissolveThreshold: 0.7,
        wipeDetectionEnabled: true,
        customTransitionsEnabled: false,
      },
      keyframeAnalysisOnly: true,
      parallelProcessing: true,
      gpuAcceleration: false,
      ...config,
    }
  }

  /**
   * Анализирует переходы между сценами
   */
  async analyzeTransitions(
    scenes: Array<{
      startTime: number
      endTime: number
      keyframes: Array<{
        time: number
        histogram: number[]
        motionVectors?: Array<[number, number]>
        audioLevel?: number
      }>
    }>,
  ): Promise<SceneTransitionAnalysis[]> {
    const transitions: SceneTransitionAnalysis[] = []

    for (let i = 0; i < scenes.length - 1; i++) {
      const currentScene = scenes[i]
      const nextScene = scenes[i + 1]

      // Анализируем область перехода между сценами
      const transitionRegion = {
        startTime: currentScene.endTime - 0.5, // 0.5 секунды до конца сцены
        endTime: nextScene.startTime + 0.5, // 0.5 секунды после начала сцены
      }

      // Определяем тип перехода
      const transitionType = await this.detectTransitionType(currentScene, nextScene, transitionRegion)

      // Вычисляем метрики качества перехода
      const quality = this.calculateTransitionQuality(currentScene, nextScene, transitionType)

      // Создаем объект перехода
      const transition: SceneTransitionAnalysis = {
        fromScene: i,
        toScene: i + 1,
        startTime: currentScene.endTime,
        endTime: nextScene.startTime,
        duration: nextScene.startTime - currentScene.endTime,
        type: transitionType,
        confidence: quality.confidence,
        smoothness: quality.smoothness,
        visualImpact: quality.visualImpact,
        metadata: {
          colorChange: this.calculateColorChange(currentScene, nextScene),
          motionChange: this.calculateMotionChange(currentScene, nextScene),
          audioChange: this.calculateAudioChange(currentScene, nextScene),
          isNaturalCut: quality.smoothness < 0.3, // Резкий переход
          requiresAttention: quality.confidence < 0.5, // Низкая уверенность
        },
      }

      transitions.push(transition)
    }

    return transitions
  }

  /**
   * Определяет тип перехода между сценами
   */
  private async detectTransitionType(
    currentScene: any,
    nextScene: any,
    transitionRegion: { startTime: number; endTime: number },
  ): Promise<TransitionType> {
    if (!this.config.transitionDetection.enabled) {
      return TransitionType.CUT // По умолчанию - резкий переход
    }

    // Получаем кадры в области перехода
    const transitionFrames = this.getFramesInRegion(
      [...currentScene.keyframes, ...nextScene.keyframes],
      transitionRegion,
    )

    if (transitionFrames.length < 2) {
      return TransitionType.CUT
    }

    // Анализируем изменение яркости для fade
    const fadeScore = this.detectFadeTransition(transitionFrames)
    if (fadeScore > this.config.transitionDetection.fadeThreshold) {
      // Определяем направление fade
      const firstBrightness = this.calculateAverageBrightness(transitionFrames[0].histogram)
      const lastBrightness = this.calculateAverageBrightness(transitionFrames[transitionFrames.length - 1].histogram)

      if (firstBrightness > lastBrightness) {
        return TransitionType.FADE_OUT
      }
      if (lastBrightness > firstBrightness) {
        return TransitionType.FADE_IN
      }
      return TransitionType.FADE_THROUGH
    }

    // Анализируем плавное смешивание для dissolve
    const dissolveScore = this.detectDissolveTransition(transitionFrames)
    if (dissolveScore > this.config.transitionDetection.dissolveThreshold) {
      return TransitionType.DISSOLVE
    }

    // Анализируем направленное движение для wipe
    if (this.config.transitionDetection.wipeDetectionEnabled) {
      const wipeDirection = this.detectWipeTransition(transitionFrames)
      if (wipeDirection) {
        switch (wipeDirection) {
          case "left":
            return TransitionType.WIPE_LEFT
          case "right":
            return TransitionType.WIPE_RIGHT
          case "up":
            return TransitionType.WIPE_UP
          case "down":
            return TransitionType.WIPE_DOWN
          default:
            return TransitionType.WIPE
        }
      }
    }

    // Проверяем на морфинг (плавное преобразование)
    const morphScore = this.detectMorphTransition(transitionFrames)
    if (morphScore > 0.8) {
      return TransitionType.MORPH
    }

    // По умолчанию - резкий переход
    return TransitionType.CUT
  }

  /**
   * Вычисляет качество перехода
   */
  private calculateTransitionQuality(
    currentScene: any,
    nextScene: any,
    transitionType: TransitionType,
  ): TransitionQuality {
    // Базовая уверенность в зависимости от типа
    let confidence = 0.5
    let smoothness = 0.5
    let visualImpact = 0.5

    switch (transitionType) {
      case TransitionType.CUT:
        confidence = 0.9 // Высокая уверенность для резких переходов
        smoothness = 0.1 // Низкая плавность
        visualImpact = 0.8 // Высокое визуальное воздействие
        break

      case TransitionType.FADE_IN:
      case TransitionType.FADE_OUT:
      case TransitionType.FADE_THROUGH:
        confidence = 0.8
        smoothness = 0.9 // Высокая плавность
        visualImpact = 0.6
        break

      case TransitionType.DISSOLVE:
        confidence = 0.7
        smoothness = 0.8
        visualImpact = 0.5
        break

      case TransitionType.WIPE:
      case TransitionType.WIPE_LEFT:
      case TransitionType.WIPE_RIGHT:
      case TransitionType.WIPE_UP:
      case TransitionType.WIPE_DOWN:
        confidence = 0.6
        smoothness = 0.6
        visualImpact = 0.7
        break

      case TransitionType.MORPH:
        confidence = 0.5
        smoothness = 0.9
        visualImpact = 0.9
        break

      default:
        // Неизвестный тип перехода, используем значения по умолчанию
        break
    }

    // Корректируем на основе метрик сцен
    const colorChange = this.calculateColorChange(currentScene, nextScene)
    const motionChange = this.calculateMotionChange(currentScene, nextScene)

    // Большие изменения снижают плавность
    smoothness *= 1 - colorChange * 0.3
    smoothness *= 1 - motionChange * 0.2

    // Но увеличивают визуальное воздействие
    visualImpact = Math.min(1, visualImpact + colorChange * 0.2 + motionChange * 0.1)

    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      smoothness: Math.max(0, Math.min(1, smoothness)),
      visualImpact: Math.max(0, Math.min(1, visualImpact)),
    }
  }

  /**
   * Определяет fade переход
   */
  private detectFadeTransition(frames: any[]): number {
    if (frames.length < 3) return 0

    const brightnesses = frames.map((f) => this.calculateAverageBrightness(f.histogram))

    // Проверяем монотонное изменение яркости
    let increasing = true
    let decreasing = true

    for (let i = 1; i < brightnesses.length; i++) {
      if (brightnesses[i] <= brightnesses[i - 1]) increasing = false
      if (brightnesses[i] >= brightnesses[i - 1]) decreasing = false
    }

    if (!increasing && !decreasing) return 0

    // Вычисляем плавность изменения
    const changes = []
    for (let i = 1; i < brightnesses.length; i++) {
      changes.push(Math.abs(brightnesses[i] - brightnesses[i - 1]))
    }

    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
    const variance = changes.reduce((sum, c) => sum + (c - avgChange) ** 2, 0) / changes.length

    // Низкая вариация означает плавное изменение
    const smoothness = 1 - Math.min(1, variance / (avgChange * avgChange + 0.01))

    return smoothness
  }

  /**
   * Определяет dissolve переход
   */
  private detectDissolveTransition(frames: any[]): number {
    if (frames.length < 4) return 0

    // Для dissolve характерно постепенное смешивание гистограмм
    const histogramDifferences = []

    for (let i = 1; i < frames.length; i++) {
      const diff = this.compareHistograms(frames[i - 1].histogram, frames[i].histogram)
      histogramDifferences.push(diff)
    }

    // Проверяем, что изменения происходят плавно
    const avgDiff = histogramDifferences.reduce((a, b) => a + b, 0) / histogramDifferences.length

    // Для dissolve все изменения должны быть примерно одинаковыми
    const variance = histogramDifferences.reduce((sum, d) => sum + (d - avgDiff) ** 2, 0) / histogramDifferences.length

    // Низкая вариация + средние изменения = dissolve
    if (avgDiff > 0.2 && avgDiff < 0.6 && variance < 0.05) {
      return 1 - variance / 0.05
    }

    return 0
  }

  /**
   * Определяет wipe переход
   */
  private detectWipeTransition(frames: any[]): string | null {
    if (!frames[0].motionVectors || frames.length < 3) return null

    // Анализируем доминирующее направление движения
    const directions = { left: 0, right: 0, up: 0, down: 0 }

    for (const frame of frames) {
      if (!frame.motionVectors) continue

      for (const [dx, dy] of frame.motionVectors) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) directions.right++
          else directions.left++
        } else {
          if (dy > 0) directions.down++
          else directions.up++
        }
      }
    }

    // Находим доминирующее направление
    const maxDirection = Object.entries(directions).reduce((a, b) => (b[1] > a[1] ? b : a))

    // Проверяем, что направление достаточно выражено
    const total = Object.values(directions).reduce((a, b) => a + b, 0)
    if (total > 0 && maxDirection[1] / total > 0.6) {
      return maxDirection[0]
    }

    return null
  }

  /**
   * Определяет morph переход
   */
  private detectMorphTransition(frames: any[]): number {
    if (frames.length < 5) return 0

    // Для морфинга характерны сложные нелинейные изменения
    const changes = []

    for (let i = 1; i < frames.length; i++) {
      const histogramDiff = this.compareHistograms(frames[i - 1].histogram, frames[i].histogram)

      changes.push(histogramDiff)
    }

    // Вычисляем "волнообразность" изменений
    let directionChanges = 0
    for (let i = 2; i < changes.length; i++) {
      const prev = changes[i - 1] - changes[i - 2]
      const curr = changes[i] - changes[i - 1]

      if (prev * curr < 0) directionChanges++
    }

    // Много изменений направления = возможный морфинг
    const morphScore = directionChanges / (changes.length - 2)

    return morphScore
  }

  // Вспомогательные методы

  private getFramesInRegion(keyframes: any[], region: { startTime: number; endTime: number }): any[] {
    return keyframes.filter((f) => f.time >= region.startTime && f.time <= region.endTime)
  }

  private calculateAverageBrightness(histogram: number[]): number {
    if (!histogram || histogram.length === 0) return 0

    let weightedSum = 0
    let totalCount = 0

    for (let i = 0; i < histogram.length; i++) {
      weightedSum += i * histogram[i]
      totalCount += histogram[i]
    }

    return totalCount > 0 ? weightedSum / (totalCount * histogram.length) : 0
  }

  private compareHistograms(hist1: number[], hist2: number[]): number {
    if (!hist1 || !hist2 || hist1.length !== hist2.length) return 1

    let diff = 0
    for (let i = 0; i < hist1.length; i++) {
      diff += Math.abs(hist1[i] - hist2[i])
    }

    return diff / hist1.length
  }

  private calculateColorChange(scene1: any, scene2: any): number {
    const lastFrame1 = scene1.keyframes[scene1.keyframes.length - 1]
    const firstFrame2 = scene2.keyframes[0]

    if (!lastFrame1 || !firstFrame2) return 1

    return this.compareHistograms(lastFrame1.histogram, firstFrame2.histogram)
  }

  private calculateMotionChange(scene1: any, scene2: any): number {
    const lastFrame1 = scene1.keyframes[scene1.keyframes.length - 1]
    const firstFrame2 = scene2.keyframes[0]

    if (!lastFrame1?.motionVectors || !firstFrame2?.motionVectors) return 0

    // Вычисляем среднюю величину движения
    const avgMotion1 = this.calculateAverageMotion(lastFrame1.motionVectors)
    const avgMotion2 = this.calculateAverageMotion(firstFrame2.motionVectors)

    return Math.abs(avgMotion2 - avgMotion1) / (Math.max(avgMotion1, avgMotion2) + 0.01)
  }

  private calculateAverageMotion(vectors: Array<[number, number]>): number {
    if (!vectors || vectors.length === 0) return 0

    const totalMagnitude = vectors.reduce((sum, [dx, dy]) => {
      return sum + Math.sqrt(dx * dx + dy * dy)
    }, 0)

    return totalMagnitude / vectors.length
  }

  private calculateAudioChange(scene1: any, scene2: any): number {
    const lastFrame1 = scene1.keyframes[scene1.keyframes.length - 1]
    const firstFrame2 = scene2.keyframes[0]

    if (lastFrame1?.audioLevel === undefined || firstFrame2?.audioLevel === undefined) {
      return 0
    }

    return Math.abs(lastFrame1.audioLevel - firstFrame2.audioLevel)
  }
}

/**
 * Вспомогательная функция для классификации переходов
 */
export function classifyTransitionComplexity(transition: SceneTransitionAnalysis): "simple" | "medium" | "complex" {
  // Простые переходы: cut и fade
  if ([TransitionType.CUT, TransitionType.FADE_IN, TransitionType.FADE_OUT].includes(transition.type)) {
    return "simple"
  }

  // Средние: dissolve и wipe
  if (
    [
      TransitionType.DISSOLVE,
      TransitionType.WIPE,
      TransitionType.WIPE_LEFT,
      TransitionType.WIPE_RIGHT,
      TransitionType.WIPE_UP,
      TransitionType.WIPE_DOWN,
    ].includes(transition.type)
  ) {
    return "medium"
  }

  // Сложные: morph и custom
  return "complex"
}

/**
 * Вспомогательная функция для определения качества монтажа
 */
export function evaluateEditingQuality(transitions: SceneTransitionAnalysis[]): {
  overallQuality: number
  rhythm: number
  consistency: number
  creativity: number
} {
  if (transitions.length === 0) {
    return {
      overallQuality: 0,
      rhythm: 0,
      consistency: 0,
      creativity: 0,
    }
  }

  // Анализируем ритм (регулярность переходов)
  const durations = transitions.map((t) => t.duration)
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const durationVariance = durations.reduce((sum, d) => sum + (d - avgDuration) ** 2, 0) / durations.length

  // Избегаем деления на ноль и устанавливаем базовый ритм
  let rhythm = 0.5 // Базовое значение
  if (avgDuration > 0.01) {
    // Защита от очень малых значений
    const normalizedVariance = Math.sqrt(durationVariance) / (avgDuration + 0.01)
    rhythm = Math.max(0.1, 1 - Math.min(1, normalizedVariance))
  } else {
    // Для instant переходов (duration ≈ 0) ритм зависит от консистентности
    rhythm = durationVariance === 0 ? 0.8 : 0.4
  }

  // Анализируем консистентность (использование похожих переходов)
  const typeCounts = new Map<TransitionType, number>()
  transitions.forEach((t) => {
    typeCounts.set(t.type, (typeCounts.get(t.type) || 0) + 1)
  })
  const consistency = Math.max(...typeCounts.values()) / transitions.length

  // Анализируем креативность (разнообразие переходов)
  const uniqueTypes = typeCounts.size
  const maxPossibleTypes = Math.min(10, transitions.length) // Максимум типов не может быть больше количества переходов
  const creativity = uniqueTypes / maxPossibleTypes

  // Общее качество на основе плавности и уверенности
  const avgSmoothness = transitions.reduce((sum, t) => sum + t.smoothness, 0) / transitions.length
  const avgConfidence = transitions.reduce((sum, t) => sum + t.confidence, 0) / transitions.length
  const overallQuality = (avgSmoothness + avgConfidence) / 2

  return {
    overallQuality,
    rhythm,
    consistency,
    creativity,
  }
}

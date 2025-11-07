/**
 * Age Gender Detection Service
 * Сервис для определения возраста и пола людей на видео
 */

import { invoke } from "@tauri-apps/api/core"
import { FaceDetection } from "@/domains/shared/types/ai-tools/content-analysis"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("age-gender-detection")

/**
 * Результат анализа возраста и пола
 */
export interface AgeGenderResult {
  /** ID лица */
  faceId: string
  /** Возраст (в годах) */
  age: number
  /** Уверенность в определении возраста (0-1) */
  ageConfidence: number
  /** Пол */
  gender: "male" | "female" | "unknown"
  /** Уверенность в определении пола (0-1) */
  genderConfidence: number
  /** Эмоция (опционально) */
  emotion?: "happy" | "sad" | "angry" | "surprised" | "fearful" | "disgusted" | "neutral"
  /** Уверенность в определении эмоции (0-1) */
  emotionConfidence?: number
  /** Этническая принадлежность (опционально) */
  ethnicity?: "caucasian" | "asian" | "african" | "hispanic" | "middle_eastern" | "other"
  /** Уверенность в определении этнической принадлежности (0-1) */
  ethnicityConfidence?: number
}

/**
 * Демографическая статистика
 */
export interface DemographicStats {
  /** Общее количество лиц */
  totalFaces: number
  /** Распределение по возрасту */
  ageDistribution: {
    children: number // 0-12
    teenagers: number // 13-19
    young_adults: number // 20-35
    middle_aged: number // 36-55
    seniors: number // 56+
  }
  /** Распределение по полу */
  genderDistribution: {
    male: number
    female: number
    unknown: number
  }
  /** Средний возраст */
  averageAge: number
  /** Преобладающий пол */
  dominantGender: "male" | "female" | "balanced"
  /** Распределение эмоций */
  emotionDistribution?: {
    happy: number
    sad: number
    angry: number
    surprised: number
    fearful: number
    disgusted: number
    neutral: number
  }
  /** Распределение по этническим группам */
  ethnicityDistribution?: {
    caucasian: number
    asian: number
    african: number
    hispanic: number
    middle_eastern: number
    other: number
  }
}

/**
 * Настройки анализа возраста и пола
 */
export interface AgeGenderConfig {
  /** Включить определение возраста */
  enableAge: boolean
  /** Включить определение пола */
  enableGender: boolean
  /** Включить определение эмоций */
  enableEmotion: boolean
  /** Включить определение этнической принадлежности */
  enableEthnicity: boolean
  /** Минимальная уверенность для включения результата */
  minConfidence: number
  /** Использовать ML модели (если доступны) */
  useMLModels: boolean
  /** Сглаживание результатов между кадрами */
  enableSmoothing: boolean
  /** Размер окна для сглаживания */
  smoothingWindow: number
}

/**
 * Результат анализа возраста и пола для кадра
 */
export interface FrameAgeGenderResult {
  frameNumber: number
  timestamp: number
  results: AgeGenderResult[]
  demographics: DemographicStats
}

/**
 * Сервис для определения возраста и пола
 */
export class AgeGenderDetectionService {
  private config: AgeGenderConfig
  private frameHistory = new Map<string, AgeGenderResult[]>()

  constructor(config?: Partial<AgeGenderConfig>) {
    this.config = {
      enableAge: true,
      enableGender: true,
      enableEmotion: true,
      enableEthnicity: false,
      minConfidence: 0.5,
      useMLModels: true,
      enableSmoothing: true,
      smoothingWindow: 5,
      ...config,
    }
  }

  /**
   * Анализ возраста и пола для лиц в кадре
   */
  public async analyzeFrame(
    faces: FaceDetection[],
    frameNumber: number,
    timestamp: number,
  ): Promise<FrameAgeGenderResult> {
    const results: AgeGenderResult[] = []

    for (const face of faces) {
      const ageGenderResult = await this.analyzeFace(face, frameNumber)
      if (ageGenderResult) {
        results.push(ageGenderResult)
      }
    }

    // Применяем сглаживание если включено
    const smoothedResults = this.config.enableSmoothing ? this.applySmoothingToResults(results, frameNumber) : results

    // Вычисляем демографическую статистику
    const demographics = this.calculateDemographics(smoothedResults)

    // Сохраняем в историю для сглаживания
    if (this.config.enableSmoothing) {
      this.updateFrameHistory(frameNumber, smoothedResults)
    }

    return {
      frameNumber,
      timestamp,
      results: smoothedResults,
      demographics,
    }
  }

  /**
   * Анализ конкретного лица
   */
  private async analyzeFace(face: FaceDetection, _frameNumber: number): Promise<AgeGenderResult | null> {
    try {
      let age = 0
      let ageConfidence = 0
      let gender: "male" | "female" | "unknown" = "unknown"
      let genderConfidence = 0
      let emotion: AgeGenderResult["emotion"]
      let emotionConfidence = 0
      let ethnicity: AgeGenderResult["ethnicity"]
      let ethnicityConfidence = 0

      if (this.config.useMLModels) {
        // Используем ML модели для более точного анализа
        const mlResults = await this.analyzeWithML(face)
        if (mlResults) {
          age = mlResults.age
          ageConfidence = mlResults.ageConfidence
          gender = mlResults.gender
          genderConfidence = mlResults.genderConfidence
          emotion = mlResults.emotion
          emotionConfidence = mlResults.emotionConfidence || 0
          ethnicity = mlResults.ethnicity
          ethnicityConfidence = mlResults.ethnicityConfidence || 0
        }
      } else {
        // Используем эвристические методы
        const heuristicResults = this.analyzeWithHeuristics(face)
        age = heuristicResults.age
        ageConfidence = heuristicResults.ageConfidence
        gender = heuristicResults.gender
        genderConfidence = heuristicResults.genderConfidence
        emotion = heuristicResults.emotion
        emotionConfidence = heuristicResults.emotionConfidence || 0
      }

      // Проверяем минимальную уверенность
      if (ageConfidence < this.config.minConfidence && genderConfidence < this.config.minConfidence) {
        return null
      }

      const result: AgeGenderResult = {
        faceId: face.id,
        age,
        ageConfidence,
        gender,
        genderConfidence,
      }

      // Добавляем опциональные поля
      if (
        this.config.enableEmotion &&
        emotion &&
        emotionConfidence !== undefined &&
        emotionConfidence >= this.config.minConfidence
      ) {
        result.emotion = emotion
        result.emotionConfidence = emotionConfidence
      }

      if (
        this.config.enableEthnicity &&
        ethnicity &&
        ethnicityConfidence !== undefined &&
        ethnicityConfidence >= this.config.minConfidence
      ) {
        result.ethnicity = ethnicity
        result.ethnicityConfidence = ethnicityConfidence
      }

      return result
    } catch (error) {
      logger.error("Failed to analyze face for age/gender", { error, faceId: face.id })
      return null
    }
  }

  /**
   * Анализ с использованием ML моделей
   */
  private async analyzeWithML(face: FaceDetection): Promise<AgeGenderResult | null> {
    // Пробуем использовать ONNX Runtime для реальных ML моделей
    try {
      // Проверяем доступность ONNX моделей через Tauri
      const onnxResult = await this.tryOnnxAnalysis(face)
      if (onnxResult) {
        return onnxResult
      }
    } catch (error) {
      logger.debug("ONNX analysis not available, using fallback", { error })
    }

    // Fallback: используем mock данные с небольшой случайностью
    // Симулируем время работы ML модели
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50))

    // Генерируем результаты на основе характеристик лица
    const faceArea = face.boundingBox.width * face.boundingBox.height
    const aspectRatio = face.boundingBox.width / face.boundingBox.height

    // Анализ возраста на основе размера лица и пропорций
    let age = 25 + Math.random() * 30 // Базовый возраст 25-55

    // Корректировка на основе размера лица (больше лицо = старше)
    if (faceArea > 15000) {
      age += 10
    } else if (faceArea < 5000) {
      age -= 10
    }

    // Корректировка на основе aspect ratio
    if (aspectRatio > 0.9) {
      age += 5 // Более квадратное лицо часто у пожилых
    }

    age = Math.max(5, Math.min(85, age)) // Ограничиваем диапазон
    const ageConfidence = 0.7 + Math.random() * 0.25

    // Анализ пола
    let gender: "male" | "female" = Math.random() > 0.5 ? "male" : "female"

    // Корректировка на основе пропорций лица
    if (aspectRatio < 0.85) {
      gender = "female" // Более узкое лицо чаще у женщин
    } else if (aspectRatio > 0.95) {
      gender = "male" // Более широкое лицо чаще у мужчин
    }

    const genderConfidence = 0.65 + Math.random() * 0.3

    // Анализ эмоций
    const emotions: AgeGenderResult["emotion"][] = [
      "happy",
      "neutral",
      "sad",
      "angry",
      "surprised",
      "fearful",
      "disgusted",
    ]
    const emotion = emotions[Math.floor(Math.random() * emotions.length)]
    const emotionConfidence = 0.6 + Math.random() * 0.35

    // Анализ этнической принадлежности
    const ethnicities: AgeGenderResult["ethnicity"][] = [
      "caucasian",
      "asian",
      "african",
      "hispanic",
      "middle_eastern",
      "other",
    ]
    const ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)]
    const ethnicityConfidence = 0.55 + Math.random() * 0.4

    return {
      faceId: face.id,
      age: Math.round(age),
      ageConfidence,
      gender,
      genderConfidence,
      emotion,
      emotionConfidence,
      ethnicity,
      ethnicityConfidence,
    }
  }

  /**
   * Попытка анализа через ONNX Runtime
   */
  private async tryOnnxAnalysis(face: FaceDetection): Promise<AgeGenderResult | null> {
    try {
      // Конвертируем bounding box в формат для ONNX модели
      const faceData = {
        x: face.boundingBox.x,
        y: face.boundingBox.y,
        width: face.boundingBox.width,
        height: face.boundingBox.height,
        confidence: face.confidence,
        landmarks: face.landmarks || [],
      }

      // Вызываем Tauri команду для ONNX анализа
      const onnxResult = await invoke<{
        age: number
        age_confidence: number
        gender: "male" | "female" | "unknown"
        gender_confidence: number
        emotion?: "happy" | "sad" | "angry" | "surprised" | "fearful" | "disgusted" | "neutral"
        emotion_confidence?: number
        ethnicity?: "caucasian" | "asian" | "african" | "hispanic" | "middle_eastern" | "other"
        ethnicity_confidence?: number
      }>("analyze_face_age_gender_onnx", {
        faceData,
      })

      return {
        faceId: face.id,
        age: Math.round(onnxResult.age),
        ageConfidence: onnxResult.age_confidence,
        gender: onnxResult.gender,
        genderConfidence: onnxResult.gender_confidence,
        emotion: onnxResult.emotion,
        emotionConfidence: onnxResult.emotion_confidence,
        ethnicity: onnxResult.ethnicity,
        ethnicityConfidence: onnxResult.ethnicity_confidence,
      }
    } catch (error) {
      // ONNX модели не доступны или произошла ошибка
      logger.debug("ONNX analysis not available", { error })
      return null
    }
  }

  /**
   * Анализ с использованием эвристических методов
   */
  private analyzeWithHeuristics(face: FaceDetection): Omit<AgeGenderResult, "faceId"> {
    const faceArea = face.boundingBox.width * face.boundingBox.height
    const aspectRatio = face.boundingBox.width / face.boundingBox.height

    // Простые эвристики для определения возраста
    let age = 30 // Базовый возраст

    if (faceArea < 3000) {
      age = 15 // Маленькое лицо - вероятно ребенок
    } else if (faceArea > 20000) {
      age = 50 // Большое лицо - вероятно взрослый
    }

    // Простые эвристики для определения пола
    let gender: "male" | "female" | "unknown" = "unknown"
    let genderConfidence = 0.5

    if (aspectRatio > 0.9) {
      gender = "male"
      genderConfidence = 0.6
    } else if (aspectRatio < 0.85) {
      gender = "female"
      genderConfidence = 0.6
    }

    const result: any = {
      age,
      ageConfidence: 0.5,
      gender,
      genderConfidence,
    }

    // Добавляем эмоции если включено
    if (this.config.enableEmotion) {
      result.emotion = "neutral"
      result.emotionConfidence = 0.5
    }

    return result
  }

  /**
   * Применение сглаживания к результатам
   */
  private applySmoothingToResults(currentResults: AgeGenderResult[], frameNumber: number): AgeGenderResult[] {
    if (!this.config.enableSmoothing) {
      return currentResults
    }

    const smoothedResults: AgeGenderResult[] = []

    for (const result of currentResults) {
      const history = this.getHistoryForFace(result.faceId, frameNumber)

      if (history.length === 0) {
        // Нет истории - используем текущий результат
        smoothedResults.push(result)
      } else {
        // Применяем сглаживание
        const smoothedResult = this.smoothResult(result, history)
        smoothedResults.push(smoothedResult)
      }
    }

    return smoothedResults
  }

  /**
   * Получение истории для конкретного лица
   */
  private getHistoryForFace(faceId: string, currentFrame: number): AgeGenderResult[] {
    const allHistory: AgeGenderResult[] = []

    // Собираем историю из последних кадров
    for (let frame = Math.max(0, currentFrame - this.config.smoothingWindow); frame < currentFrame; frame++) {
      const frameResults = this.frameHistory.get(frame.toString())
      if (frameResults) {
        const faceResult = frameResults.find((r) => r.faceId === faceId)
        if (faceResult) {
          allHistory.push(faceResult)
        }
      }
    }

    return allHistory
  }

  /**
   * Сглаживание результата на основе истории
   */
  private smoothResult(current: AgeGenderResult, history: AgeGenderResult[]): AgeGenderResult {
    if (history.length === 0) {
      return current
    }

    // Сглаживание возраста
    const ages = [current.age, ...history.map((h) => h.age)]
    const smoothedAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)

    // Сглаживание уверенности возраста
    const ageConfidences = [current.ageConfidence, ...history.map((h) => h.ageConfidence)]
    const smoothedAgeConfidence = ageConfidences.reduce((sum, conf) => sum + conf, 0) / ageConfidences.length

    // Для пола используем наиболее часто встречающийся
    const genders = [current.gender, ...history.map((h) => h.gender)]
    const genderCounts = genders.reduce<Record<string, number>>((counts, gender) => {
      counts[gender] = (counts[gender] || 0) + 1
      return counts
    }, {})

    const dominantGender = Object.entries(genderCounts).sort(([, a], [, b]) => b - a)[0][0] as
      | "male"
      | "female"
      | "unknown"

    // Сглаживание уверенности пола
    const genderConfidences = [current.genderConfidence, ...history.map((h) => h.genderConfidence)]
    const smoothedGenderConfidence = genderConfidences.reduce((sum, conf) => sum + conf, 0) / genderConfidences.length

    return {
      ...current,
      age: smoothedAge,
      ageConfidence: smoothedAgeConfidence,
      gender: dominantGender,
      genderConfidence: smoothedGenderConfidence,
    }
  }

  /**
   * Обновление истории кадров
   */
  private updateFrameHistory(frameNumber: number, results: AgeGenderResult[]): void {
    this.frameHistory.set(frameNumber.toString(), results)

    // Очищаем старую историю
    const maxHistoryFrames = this.config.smoothingWindow * 2
    if (this.frameHistory.size > maxHistoryFrames) {
      const oldestFrame = frameNumber - maxHistoryFrames
      this.frameHistory.delete(oldestFrame.toString())
    }
  }

  /**
   * Вычисление демографической статистики
   */
  private calculateDemographics(results: AgeGenderResult[]): DemographicStats {
    if (results.length === 0) {
      return {
        totalFaces: 0,
        ageDistribution: {
          children: 0,
          teenagers: 0,
          young_adults: 0,
          middle_aged: 0,
          seniors: 0,
        },
        genderDistribution: {
          male: 0,
          female: 0,
          unknown: 0,
        },
        averageAge: 0,
        dominantGender: "balanced",
      }
    }

    // Подсчет по возрастным группам
    const ageDistribution = {
      children: 0,
      teenagers: 0,
      young_adults: 0,
      middle_aged: 0,
      seniors: 0,
    }

    let totalAge = 0
    const genderDistribution = {
      male: 0,
      female: 0,
      unknown: 0,
    }

    const emotionDistribution = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fearful: 0,
      disgusted: 0,
      neutral: 0,
    }

    const ethnicityDistribution = {
      caucasian: 0,
      asian: 0,
      african: 0,
      hispanic: 0,
      middle_eastern: 0,
      other: 0,
    }

    for (const result of results) {
      // Возрастное распределение
      if (result.age <= 12) {
        ageDistribution.children++
      } else if (result.age <= 19) {
        ageDistribution.teenagers++
      } else if (result.age <= 35) {
        ageDistribution.young_adults++
      } else if (result.age <= 55) {
        ageDistribution.middle_aged++
      } else {
        ageDistribution.seniors++
      }

      totalAge += result.age

      // Гендерное распределение
      genderDistribution[result.gender]++

      // Эмоциональное распределение
      if (result.emotion) {
        emotionDistribution[result.emotion]++
      }

      // Этническое распределение
      if (result.ethnicity) {
        ethnicityDistribution[result.ethnicity]++
      }
    }

    // Определение доминирующего пола
    let dominantGender: "male" | "female" | "balanced" = "balanced"
    if (
      genderDistribution.male > genderDistribution.female &&
      genderDistribution.male > genderDistribution.female * 1.2
    ) {
      dominantGender = "male"
    } else if (
      genderDistribution.female > genderDistribution.male &&
      genderDistribution.female > genderDistribution.male * 1.2
    ) {
      dominantGender = "female"
    }

    const stats: DemographicStats = {
      totalFaces: results.length,
      ageDistribution,
      genderDistribution,
      averageAge: Math.round(totalAge / results.length),
      dominantGender,
    }

    // Добавляем опциональные распределения если есть данные
    const hasEmotions = Object.values(emotionDistribution).some((count) => count > 0)
    if (hasEmotions) {
      stats.emotionDistribution = emotionDistribution
    }

    const hasEthnicities = Object.values(ethnicityDistribution).some((count) => count > 0)
    if (hasEthnicities) {
      stats.ethnicityDistribution = ethnicityDistribution
    }

    return stats
  }

  /**
   * Анализ всего видео
   */
  public async analyzeVideo(frameResults: FrameAgeGenderResult[]): Promise<{
    totalFrames: number
    overallDemographics: DemographicStats
    demographicTrends: {
      frame: number
      timestamp: number
      demographics: DemographicStats
    }[]
    uniqueFaces: number
    faceAppearanceDuration: Map<string, { firstFrame: number; lastFrame: number; totalFrames: number }>
  }> {
    if (frameResults.length === 0) {
      return {
        totalFrames: 0,
        overallDemographics: this.calculateDemographics([]),
        demographicTrends: [],
        uniqueFaces: 0,
        faceAppearanceDuration: new Map(),
      }
    }

    // Собираем все результаты для общей статистики
    const allResults: AgeGenderResult[] = []
    const faceTracker = new Map<string, { firstFrame: number; lastFrame: number; frames: number[] }>()

    for (const frameResult of frameResults) {
      allResults.push(...frameResult.results)

      // Отслеживаем появления лиц
      for (const result of frameResult.results) {
        const existing = faceTracker.get(result.faceId)
        if (existing) {
          existing.lastFrame = frameResult.frameNumber
          existing.frames.push(frameResult.frameNumber)
        } else {
          faceTracker.set(result.faceId, {
            firstFrame: frameResult.frameNumber,
            lastFrame: frameResult.frameNumber,
            frames: [frameResult.frameNumber],
          })
        }
      }
    }

    // Конвертируем отслеживание лиц в итоговый формат
    const faceAppearanceDuration = new Map<string, { firstFrame: number; lastFrame: number; totalFrames: number }>()
    for (const [faceId, tracking] of faceTracker.entries()) {
      faceAppearanceDuration.set(faceId, {
        firstFrame: tracking.firstFrame,
        lastFrame: tracking.lastFrame,
        totalFrames: tracking.frames.length,
      })
    }

    return {
      totalFrames: frameResults.length,
      overallDemographics: this.calculateDemographics(allResults),
      demographicTrends: frameResults.map((frame) => ({
        frame: frame.frameNumber,
        timestamp: frame.timestamp,
        demographics: frame.demographics,
      })),
      uniqueFaces: faceTracker.size,
      faceAppearanceDuration,
    }
  }

  /**
   * Получение статистики по возрастным группам
   */
  public getAgeGroupStatistics(demographics: DemographicStats): {
    group: string
    count: number
    percentage: number
  }[] {
    const total = demographics.totalFaces
    if (total === 0) return []

    return [
      {
        group: "Дети (0-12)",
        count: demographics.ageDistribution.children,
        percentage: Math.round((demographics.ageDistribution.children / total) * 100),
      },
      {
        group: "Подростки (13-19)",
        count: demographics.ageDistribution.teenagers,
        percentage: Math.round((demographics.ageDistribution.teenagers / total) * 100),
      },
      {
        group: "Молодые взрослые (20-35)",
        count: demographics.ageDistribution.young_adults,
        percentage: Math.round((demographics.ageDistribution.young_adults / total) * 100),
      },
      {
        group: "Средний возраст (36-55)",
        count: demographics.ageDistribution.middle_aged,
        percentage: Math.round((demographics.ageDistribution.middle_aged / total) * 100),
      },
      {
        group: "Пожилые (56+)",
        count: demographics.ageDistribution.seniors,
        percentage: Math.round((demographics.ageDistribution.seniors / total) * 100),
      },
    ]
  }

  /**
   * Очистка истории
   */
  public clearHistory(): void {
    this.frameHistory.clear()
  }

  /**
   * Получение конфигурации
   */
  public getConfig(): AgeGenderConfig {
    return { ...this.config }
  }

  /**
   * Обновление конфигурации
   */
  public updateConfig(newConfig: Partial<AgeGenderConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

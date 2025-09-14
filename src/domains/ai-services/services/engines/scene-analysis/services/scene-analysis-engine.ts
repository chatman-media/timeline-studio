/**
 * Scene Analysis Engine
 * Расширяет FFmpegAnalysisService для продвинутого анализа сцен
 */

import { UnifiedAIService } from "@/domains/ai-core"
import { FFmpegAnalysisService } from "@/domains/ai-services"
import {
  ContentType,
  Emotion,
  Genre,
  KeyMoment,
  KeyMomentType,
  QualityMetrics,
  SceneAnalysis,
  SceneType,
} from "@/domains/shared/types/ai-tools/content-analysis"
import type { Person } from "@/features/montage-planner/types"
import type { DetectedFace, PersonProfile } from "@/features/person-identification/types/person"
import { BaseAIEngine, type EngineCapabilities } from "../../types"
import type {
  AudioProfile,
  KeyframeData,
  SceneAnalysisConfig,
  SceneAnalysisResult,
  TimelineSegment,
  VisualFeatures,
} from "../types"
import { CameraMovementType, LightingType, MotionDirection } from "../types"
import { AgeGenderDetectionService, type DemographicStats } from "./age-gender-detection"
import { type CharacterAnalysisResult, CharacterAnalysisService } from "./character-analysis"
import { MusicDetectionService } from "./music-detection"
import { ObjectTrackingService } from "./object-tracking"
import { SceneDetectionService } from "./scene-detection"
import { VisionService } from "./vision-service"

// Расширенный тип для content с дополнительными полями
interface ExtendedContentElements {
  objects: any[]
  faces: any[]
  text: any[]
  activities: any[]
  dominantColors: any[]
  composition: any
  mood: any
  identifiedPersons?: Person[]
  montagePlannerFragment?: any
  trackedObjects?: import("./object-tracking").TrackedObject[]
  musicSegments?: import("./music-detection").MusicSegment[]
  ageGenderResults?: import("./age-gender-detection").AgeGenderResult[]
  demographics?: DemographicStats
}

// Интеграция с montage-planner для работы с персонажами

export class SceneAnalysisEngine extends BaseAIEngine {
  name = "Scene Analysis Engine"
  version = "1.0.0"
  description = "Advanced scene analysis with AI-powered content understanding"

  private ffmpegService: FFmpegAnalysisService
  private aiService: UnifiedAIService
  private visionService?: VisionService
  private sceneDetectionService: SceneDetectionService
  private objectTrackingService: ObjectTrackingService
  private musicDetectionService: MusicDetectionService
  private ageGenderDetectionService: AgeGenderDetectionService
  private characterAnalysisService: CharacterAnalysisService
  private config: SceneAnalysisConfig = this.getDefaultConfig()

  // Кэш для персонажей из montage-planner
  private personProfilesCache = new Map<string, PersonProfile>()
  private detectedPersonsCache = new Map<string, Person[]>()

  constructor() {
    super()
    this.ffmpegService = FFmpegAnalysisService.getInstance()
    this.aiService = UnifiedAIService.getInstance()
    this.sceneDetectionService = new SceneDetectionService()
    this.objectTrackingService = new ObjectTrackingService()
    this.musicDetectionService = new MusicDetectionService()
    this.ageGenderDetectionService = new AgeGenderDetectionService({
      enableAge: true,
      enableGender: true,
      enableEmotion: true,
      enableEthnicity: false,
      minConfidence: 0.6,
      useMLModels: true,
      enableSmoothing: true,
      smoothingWindow: 5,
    })
    this.characterAnalysisService = CharacterAnalysisService.getInstance()
  }

  async initialize(): Promise<void> {
    try {
      console.log("Initializing Scene Analysis Engine with YOLO/ONNX support...")

      // Инициализация VisionService с YOLO/ONNX
      if (this.config.vision.enableObjectDetection || this.config.vision.enableFaceDetection) {
        this.visionService = VisionService.getInstance({
          enableObjectDetection: this.config.vision.enableObjectDetection,
          enableFaceDetection: this.config.vision.enableFaceDetection,
          enableTextRecognition: this.config.vision.enableTextRecognition,
          enableActivityDetection: this.config.vision.enableActivityDetection,
          objectConfidenceThreshold: this.config.vision.confidenceThreshold,
          faceConfidenceThreshold: this.config.vision.confidenceThreshold,
          textConfidenceThreshold: this.config.vision.confidenceThreshold,
          maxDetectionsPerFrame: 100,
        })

        await this.visionService.initialize()
        console.log("VisionService initialized with YOLO/ONNX models")
      }

      // Загружаем существующие профили персонажей
      await this.loadPersonProfiles()

      this._isReady = true
      console.log("Scene Analysis Engine ready")
    } catch (error) {
      console.error("Failed to initialize Scene Analysis Engine:", error)
      throw error
    }
  }

  async process(data: { mediaFile: MediaFile }, config?: Partial<SceneAnalysisConfig>): Promise<SceneAnalysisResult> {
    if (!this._isReady) {
      throw new Error("Scene Analysis Engine not initialized")
    }

    // Объединяем конфигурацию
    const finalConfig = { ...this.config, ...config }

    try {
      // 1. Базовый анализ через FFmpeg
      const ffmpegAnalysis = await this.performFFmpegAnalysis(data.mediaFile, finalConfig)

      // 2. Продвинутый анализ сцен
      const scenes = await this.analyzeScenes(ffmpegAnalysis, data.mediaFile, finalConfig)

      // 3. Определение ключевых моментов
      const keyMoments = await this.detectKeyMoments(scenes, ffmpegAnalysis)

      // 4. Классификация контента с помощью AI
      const classification = await this.classifyContent(scenes, ffmpegAnalysis, finalConfig)

      // 5. Создание timeline данных
      const timeline = this.createTimelineData(scenes, keyMoments, ffmpegAnalysis)

      // 6. Агрегируем информацию о персонажах из всех сцен
      const allDetectedPersons = this.getDetectedPersonsForVideo(data.mediaFile.path)
      const fragmentsWithPersons = scenes
        .map((scene) => (scene.content as ExtendedContentElements)?.montagePlannerFragment)
        .filter((fragment) => fragment && fragment.people.length > 0)

      // 7. Коллектим демографическую статистику со всех сцен
      const overallDemographics = this.calculateOverallDemographics(scenes)

      // 8. Анализ персонажей и их отношений (если включен)
      let characterAnalysis: CharacterAnalysisResult | undefined
      if (finalConfig.enableCharacterAnalysis && allDetectedPersons.length > 1) {
        try {
          console.log("Performing character relationship analysis...")
          characterAnalysis = await this.characterAnalysisService.analyzeCharacters(
            scenes,
            allDetectedPersons,
            data.mediaFile,
          )
          console.log(
            `Found ${characterAnalysis.relationships.length} relationships between ${characterAnalysis.characters.length} characters`,
          )
        } catch (error) {
          console.warn("Character analysis failed:", error)
        }
      }

      // 9. Сборка финального результата
      const result: SceneAnalysisResult = {
        scenes,
        keyMoments,
        classification,
        summary: {
          totalScenes: scenes.length,
          averageSceneDuration: this.calculateAverageSceneDuration(scenes),
          dominantColors: await this.extractDominantColors(scenes),
          visualComplexity: this.calculateVisualComplexity(scenes),
          audioProfile: this.createAudioProfile(ffmpegAnalysis),
          demographics: overallDemographics,
        },
        timeline,
        // Интеграция с montage-planner
        persons: allDetectedPersons,
        fragments: fragmentsWithPersons,
        personStats: this.calculatePersonStats(allDetectedPersons, scenes),
        // Анализ персонажей и отношений
        characterAnalysis,
      }

      return result
    } catch (error) {
      console.error("Scene analysis failed:", error)
      throw error
    }
  }

  getCapabilities(): EngineCapabilities {
    return {
      supportsStreaming: false,
      supportsBatch: true,
      maxBatchSize: 10,
      supportedFormats: ["mp4", "avi", "mov", "mkv", "webm"],
      requiredResources: {
        minRAM: 2048, // 2GB
        recommendedRAM: 8192, // 8GB
        requiresGPU: this.config.vision.enableObjectDetection,
        gpuMemory: 2048, // 2GB VRAM для YOLO
        diskSpace: 1024, // 1GB для временных файлов
      },
      estimatedProcessingTime: (data) => {
        // Примерная оценка: 1 секунда на 10 секунд видео
        const duration = data.mediaFile?.duration || 60
        return duration / 10
      },
    }
  }

  configure(config: Partial<SceneAnalysisConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
    return Promise.resolve()
  }

  // Приватные методы

  private async performFFmpegAnalysis(mediaFile: MediaFile, config: SceneAnalysisConfig) {
    const [metadata, scenes, quality, silence, motion, keyFrames] = await Promise.all([
      this.ffmpegService.getVideoMetadata(mediaFile.path),
      this.ffmpegService.detectScenes(mediaFile.path, {
        threshold: config.ffmpeg.sceneThreshold,
        minSceneLength: config.ffmpeg.minSceneLength,
      }),
      this.ffmpegService.analyzeQuality(mediaFile.path, {
        sampleRate: config.ffmpeg.qualitySampleRate,
      }),
      this.ffmpegService.detectSilence(mediaFile.path),
      this.ffmpegService.analyzeMotion(mediaFile.path),
      this.ffmpegService.extractKeyFrames(mediaFile.path, {
        count: Math.floor(mediaFile.duration / config.ffmpeg.keyframeInterval),
      }),
    ])

    return { metadata, scenes, quality, silence, motion, keyFrames }
  }

  private async analyzeScenes(
    ffmpegAnalysis: any,
    mediaFile: MediaFile,
    config: SceneAnalysisConfig,
  ): Promise<SceneAnalysis[]> {
    const scenes: SceneAnalysis[] = []

    for (const ffmpegScene of ffmpegAnalysis.scenes.scenes) {
      const scene: SceneAnalysis = {
        id: `scene-${scenes.length + 1}`,
        startTime: ffmpegScene.startTime,
        endTime: ffmpegScene.endTime,
        duration: ffmpegScene.endTime - ffmpegScene.startTime,
        type: await this.detectSceneType(ffmpegScene, ffmpegAnalysis),
        keyFrames: await this.extractSceneKeyFrames(ffmpegScene, ffmpegAnalysis.keyFrames),
        quality: this.extractSceneQuality(ffmpegScene, ffmpegAnalysis.quality),
        content: await this.analyzeSceneContent(ffmpegScene, mediaFile, config),
        transitions: [], // Заполняется после анализа всех сцен
      }

      scenes.push(scene)
    }

    // Анализируем переходы между сценами
    if (scenes.length > 1) {
      await this.analyzeSceneTransitions(scenes, ffmpegAnalysis)
    }

    return scenes
  }

  private async analyzeSceneContent(
    scene: any,
    mediaFile: MediaFile,
    config: SceneAnalysisConfig,
  ): Promise<ExtendedContentElements> {
    const content: ExtendedContentElements = {
      objects: [],
      faces: [],
      text: [],
      activities: [],
      dominantColors: [],
      composition: null,
      mood: null,
    }

    // Если компьютерное зрение отключено, возвращаем базовую информацию
    if (
      !config.vision.enableObjectDetection &&
      !config.vision.enableFaceDetection &&
      !config.vision.enableTextRecognition
    ) {
      return content
    }

    // VisionService уже инициализирован в initialize()
    if (!this.visionService) {
      console.warn("VisionService not initialized, skipping computer vision analysis")
      return content
    }

    try {
      // Вычисляем продолжительность сцены
      const sceneDuration = scene.endTime - scene.startTime

      // Извлекаем кадры из сцены для анализа
      const frameCount = Math.min(5, Math.ceil(sceneDuration)) // Анализируем до 5 кадров на сцену
      const frameInterval = sceneDuration / frameCount

      // Анализируем только если есть кадры для анализа
      const actualFrameCount = frameCount > 0 && sceneDuration > 0 ? frameCount : 0

      // Инициализируем object tracking для этой сцены
      if (actualFrameCount > 0 && config.vision.enableObjectDetection) {
        // Получаем разрешение видео из метаданных
        const metadata = await this.ffmpegService.getVideoMetadata(mediaFile.path)
        const frameWidth = metadata.width || 1920
        const frameHeight = metadata.height || 1080
        this.objectTrackingService.initialize(frameWidth, frameHeight)
      }

      for (let i = 0; i < actualFrameCount; i++) {
        const timestamp = Number(scene.startTime) + i * frameInterval
        const frameNumber = Math.floor(timestamp * 30) // Предполагаем 30 fps

        // Извлекаем кадр через FFmpeg
        const frameData = await this.ffmpegService.extractFrame(mediaFile.path, timestamp)

        if (frameData) {
          // Анализируем кадр
          const frameAnalysis = await this.visionService.analyzeFrame(frameData, frameNumber)

          // Обрабатываем детекции объектов через object tracking
          if (config.vision.enableObjectDetection && frameAnalysis.objects.length > 0) {
            const trackedObjects = this.objectTrackingService.processFrame(
              frameNumber,
              timestamp * 1000, // timestamp в миллисекундах
              frameAnalysis.objects,
            )

            // Сохраняем треки в контенте сцены
            if (!content.trackedObjects) {
              content.trackedObjects = []
            }
            content.trackedObjects.push(...trackedObjects)
          }

          // Анализируем возраст и пол для обнаруженных лиц
          if (config.vision.enableFaceDetection && frameAnalysis.faces.length > 0) {
            const ageGenderFrameResult = await this.ageGenderDetectionService.analyzeFrame(
              frameAnalysis.faces,
              frameNumber,
              timestamp * 1000,
            )

            // Сохраняем результаты анализа возраста и пола
            if (!content.ageGenderResults) {
              content.ageGenderResults = []
            }
            content.ageGenderResults.push(...ageGenderFrameResult.results)

            // Обновляем демографическую статистику (последний кадр переписывает)
            content.demographics = ageGenderFrameResult.demographics
          }

          // Объединяем результаты
          content.objects.push(...frameAnalysis.objects)
          content.faces.push(...frameAnalysis.faces)
          content.text.push(...frameAnalysis.text)
          content.activities.push(...frameAnalysis.activities)

          // Сохраняем композицию последнего кадра
          content.composition = frameAnalysis.composition
        }
      }

      // Получаем завершенные треки после обработки всех кадров сцены
      if (config.vision.enableObjectDetection) {
        const completedTracks = this.objectTrackingService.getCompletedTracks()
        if (completedTracks.length > 0) {
          if (!content.trackedObjects) {
            content.trackedObjects = []
          }
          content.trackedObjects.push(...completedTracks)
        }
      }

      // Извлекаем доминирующие цвета
      if (frameCount > 0) {
        const middleFrameTimestamp = Number(scene.startTime) + sceneDuration / 2
        const middleFrame = await this.ffmpegService.extractFrame(mediaFile.path, middleFrameTimestamp)
        if (middleFrame) {
          content.dominantColors = this.visionService.extractDominantColors(middleFrame)
        }
      }

      // Идентифицируем персонажей на основе детекций лиц
      if (content.faces.length > 0) {
        const identifiedPersons = await this.identifyPersons(content.faces, scene.id)
        content.identifiedPersons = identifiedPersons

        console.log(
          `Scene ${scene.id}: Found ${identifiedPersons.length} persons`,
          identifiedPersons.map((p) => `${p.name}(${Math.round(p.confidence * 100)}%)`),
        )
      }

      // Определяем настроение сцены с помощью AI
      if (config.ai.enableMoodDetection) {
        content.mood = await this.detectSceneMood(content, scene)
      }

      // Создаем Fragment в формате montage-planner
      if (content.identifiedPersons && content.identifiedPersons.length > 0) {
        const fragment = this.createFragmentFromScene(
          { ...scene, content } as SceneAnalysis,
          mediaFile,
          content.identifiedPersons,
        )
        content.montagePlannerFragment = fragment
      }

      // Анализируем музыкальный контент сцены
      if (config.ai.enableContentClassification && sceneDuration > 1.0) {
        try {
          const musicAnalysis = await this.musicDetectionService.detectMusic(mediaFile.path)

          // Фильтруем сегменты, которые попадают в эту сцену
          const sceneSegments = musicAnalysis.segments.filter(
            (segment) =>
              (segment.startTime >= scene.startTime && segment.startTime <= scene.endTime) ||
              (segment.endTime >= scene.startTime && segment.endTime <= scene.endTime) ||
              (segment.startTime <= scene.startTime && segment.endTime >= scene.endTime),
          )

          if (sceneSegments.length > 0) {
            content.musicSegments = sceneSegments
            console.log(`Scene ${scene.id}: Found ${sceneSegments.length} music segments`)
          }
        } catch (error) {
          console.warn("Failed to analyze music for scene:", error)
        }
      }
    } catch (error) {
      console.error("Failed to analyze scene content:", error)
    }

    return content
  }

  private async detectSceneMood(content: any, scene: any): Promise<string> {
    try {
      // Продвинутый анализ настроения с интеграцией AI, музыки и визуальных факторов

      // 1. Анализ эмоций лиц
      const emotionFactors = this.analyzeEmotionalFactors(content.faces)

      // 2. Анализ визуальных факторов (цвета, композиция, освещение)
      const visualFactors = this.analyzeVisualMoodFactors(content.dominantColors, content.composition)

      // 3. Анализ музыкальных факторов
      const audioFactors = this.analyzeMusicMoodFactors(content.musicSegments)

      // 4. Анализ временных факторов
      const temporalFactors = this.analyzeTemporalFactors(scene)

      // 5. Комбинированный анализ с AI-поддержкой
      const moodScores = {
        positive: 0,
        negative: 0,
        neutral: 0,
        energetic: 0,
        calm: 0,
        dramatic: 0,
        romantic: 0,
        suspenseful: 0,
      }

      // Вклад эмоций лиц (30% веса)
      this.addEmotionContribution(moodScores, emotionFactors, 0.3)

      // Вклад визуальных факторов (25% веса)
      this.addVisualContribution(moodScores, visualFactors, 0.25)

      // Вклад музыки (35% веса)
      this.addAudioContribution(moodScores, audioFactors, 0.35)

      // Вклад временных факторов (10% веса)
      this.addTemporalContribution(moodScores, temporalFactors, 0.1)

      // Определяем доминирующее настроение
      const dominantMood = this.getDominantMood(moodScores)

      console.log(`Scene mood analysis: ${dominantMood} (scores:`, moodScores, ")")
      return dominantMood
    } catch (error) {
      console.error("Failed to detect scene mood:", error)
      // Fallback к простой эвристике
      return this.fallbackMoodDetection(content, scene)
    }
  }

  /**
   * Анализирует эмоциональные факторы из лиц
   */
  private analyzeEmotionalFactors(faces: any[]): any {
    const emotions = {
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fearful: 0,
      neutral: 0,
    }

    if (!faces || faces.length === 0) {
      return { emotions, dominantEmotion: "neutral", confidence: 0 }
    }

    // Подсчитываем эмоции и их уверенность
    faces.forEach((face) => {
      if (face.emotion && face.emotion in emotions) {
        const confidence = face.emotionConfidence || 0.5
        emotions[face.emotion as keyof typeof emotions] += confidence
      }
    })

    // Нормализуем на количество лиц
    Object.keys(emotions).forEach((emotion) => {
      emotions[emotion as keyof typeof emotions] /= faces.length
    })

    // Определяем доминирующую эмоцию
    const dominantEmotion = Object.entries(emotions).sort(([, a], [, b]) => b - a)[0][0]
    const confidence = emotions[dominantEmotion as keyof typeof emotions]

    return { emotions, dominantEmotion, confidence }
  }

  /**
   * Анализирует визуальные факторы настроения
   */
  private analyzeVisualMoodFactors(dominantColors: string[], composition: any): any {
    const factors = {
      warmth: 0, // Теплота цветов
      brightness: 0, // Яркость
      contrast: 0, // Контрастность
      balance: 0, // Композиционный баланс
      complexity: 0, // Визуальная сложность
    }

    // Анализ цветовой палитры
    if (dominantColors && dominantColors.length > 0) {
      dominantColors.forEach((color) => {
        const rgb = this.hexToRgb(color)
        if (rgb) {
          // Теплота: больше красного и желтого = теплее
          factors.warmth += (rgb.r + rgb.g - rgb.b) / (255 * 3)

          // Яркость: среднее значение RGB
          factors.brightness += (rgb.r + rgb.g + rgb.b) / (255 * 3)
        }
      })

      factors.warmth /= dominantColors.length
      factors.brightness /= dominantColors.length
    }

    // Анализ композиции
    if (composition) {
      factors.balance = composition.balance || 0.5
      factors.contrast = 1 - (composition.ruleOfThirds || 0.5) // Плохое правило третей = больше контраста
      factors.complexity = composition.leadingLines ? 0.8 : 0.3
    }

    return factors
  }

  /**
   * Анализирует музыкальные факторы настроения
   */
  private analyzeMusicMoodFactors(musicSegments: any[]): any {
    const factors = {
      energy: 0,
      tempo: 0,
      mood: "neutral",
      confidence: 0,
    }

    if (!musicSegments || musicSegments.length === 0) {
      return factors
    }

    let totalDuration = 0
    let energySum = 0
    let tempoSum = 0
    const moods = new Map<string, number>()

    musicSegments.forEach((segment) => {
      const duration = segment.endTime - segment.startTime
      totalDuration += duration

      // Взвешиваем по длительности сегмента
      energySum += (segment.energy || 0.5) * duration
      tempoSum += (segment.tempo || 120) * duration

      // Собираем настроения
      if (segment.mood) {
        const currentWeight = moods.get(segment.mood) || 0
        moods.set(segment.mood, currentWeight + duration)
      }
    })

    if (totalDuration > 0) {
      factors.energy = energySum / totalDuration
      factors.tempo = tempoSum / totalDuration

      // Определяем доминирующее музыкальное настроение
      if (moods.size > 0) {
        const dominantMood = Array.from(moods.entries()).sort(([, a], [, b]) => b - a)[0]
        factors.mood = dominantMood[0]
        factors.confidence = dominantMood[1] / totalDuration
      }
    }

    return factors
  }

  /**
   * Анализирует временные факторы
   */
  private analyzeTemporalFactors(scene: any): any {
    return {
      duration: scene.duration || scene.endTime - scene.startTime,
      pace: scene.duration < 2 ? "fast" : scene.duration > 10 ? "slow" : "normal",
    }
  }

  /**
   * Добавляет вклад эмоций в общие оценки настроения
   */
  private addEmotionContribution(moodScores: any, emotionFactors: any, weight: number): void {
    const emotions = emotionFactors.emotions

    moodScores.positive += (emotions.happy + emotions.surprised * 0.5) * weight
    moodScores.negative += (emotions.sad + emotions.angry + emotions.fearful) * weight
    moodScores.neutral += emotions.neutral * weight
    moodScores.energetic += (emotions.surprised + emotions.angry * 0.7) * weight
    moodScores.dramatic += (emotions.angry + emotions.fearful) * weight
  }

  /**
   * Добавляет вклад визуальных факторов
   */
  private addVisualContribution(moodScores: any, visualFactors: any, weight: number): void {
    // Яркие теплые цвета = позитив
    moodScores.positive += visualFactors.warmth * visualFactors.brightness * weight

    // Темные холодные цвета = негатив
    moodScores.negative += (1 - visualFactors.warmth) * (1 - visualFactors.brightness) * weight

    // Высокий контраст = драматичность
    moodScores.dramatic += visualFactors.contrast * weight

    // Сбалансированная композиция = спокойствие
    moodScores.calm += visualFactors.balance * weight

    // Сложность = энергичность
    moodScores.energetic += visualFactors.complexity * weight
  }

  /**
   * Добавляет вклад аудио факторов
   */
  private addAudioContribution(moodScores: any, audioFactors: any, weight: number): void {
    // Высокая энергия и темп = энергичность
    moodScores.energetic += (audioFactors.energy + audioFactors.tempo / 200) * weight

    // Низкая энергия = спокойствие
    moodScores.calm += (1 - audioFactors.energy) * weight

    // Маппинг музыкальных настроений
    switch (audioFactors.mood) {
      case "happy":
      case "upbeat":
        moodScores.positive += audioFactors.confidence * weight
        break
      case "sad":
      case "melancholic":
        moodScores.negative += audioFactors.confidence * weight
        break
      case "dramatic":
      case "intense":
        moodScores.dramatic += audioFactors.confidence * weight
        break
      case "romantic":
        moodScores.romantic += audioFactors.confidence * weight
        break
      case "suspense":
        moodScores.suspenseful += audioFactors.confidence * weight
        break
      default:
        // Неизвестные настроения не обрабатываем
        break
    }
  }

  /**
   * Добавляет вклад временных факторов
   */
  private addTemporalContribution(moodScores: any, temporalFactors: any, weight: number): void {
    switch (temporalFactors.pace) {
      case "fast":
        moodScores.energetic += weight
        break
      case "slow":
        moodScores.calm += weight
        break
      default:
        // Средний темп не влияет на настроение
        break
    }
  }

  /**
   * Определяет доминирующее настроение
   */
  private getDominantMood(moodScores: any): string {
    const sortedMoods = Object.entries(moodScores).sort(([, a], [, b]) => (b as number) - (a as number))

    const [dominantMood, score] = sortedMoods[0] as [string, number]

    // Если оценка слишком низкая, возвращаем нейтральное
    if (score < 0.2) {
      return "neutral"
    }

    return dominantMood
  }

  /**
   * Простая эвристика как fallback
   */
  private fallbackMoodDetection(content: any, scene: any): string {
    const hasHappyFaces = content.faces?.some((face: any) => face.emotion === "happy")
    const isDarkScene = content.dominantColors?.some((color: any) => {
      const rgb = this.hexToRgb(color)
      if (!rgb) return false
      const brightness = (rgb.r + rgb.g + rgb.b) / 3
      return brightness < 50
    })

    if (hasHappyFaces) return "positive"
    if (isDarkScene) return "negative"
    if (scene.duration < 2) return "energetic"

    return "neutral"
  }

  /**
   * Конвертирует hex цвет в RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  private async detectSceneType(scene: any, analysis: any): Promise<SceneType> {
    // Простая эвристика для определения типа сцены
    const motion = analysis.motion?.motionIntensity || 0
    const duration = scene.endTime - scene.startTime

    if (motion > 0.7) return SceneType.ACTION
    if (duration < 2) return SceneType.TRANSITION
    if (duration > 10 && motion < 0.2) return SceneType.ESTABLISHING

    // TODO: Использовать AI для более точного определения
    return SceneType.DIALOGUE
  }

  private async extractSceneKeyFrames(scene: any, keyFrames: any): Promise<any[]> {
    // Фильтруем ключевые кадры для данной сцены
    return (
      keyFrames?.keyFrames
        ?.filter((kf: any) => kf.timestamp >= scene.startTime && kf.timestamp <= scene.endTime)
        .map((kf: any) => ({
          timestamp: kf.timestamp,
          thumbnailPath: kf.imagePath,
          composition: {
            ruleOfThirds: 0.5, // TODO: Implement real analysis
            balance: 0.5,
            leadingLines: false,
            depth: 0.5,
            colorHarmony: 0.5,
          },
          isKeyMoment: false,
          score: kf.confidence || 0.5,
        })) || []
    )
  }

  private extractSceneQuality(_scene: any, qualityAnalysis: any): QualityMetrics {
    // Возвращаем качество для сцены (нормализованное от 0 до 1)
    return {
      overall: qualityAnalysis?.average || 0.75,
      sharpness: (qualityAnalysis?.sharpness || 80) / 100,
      brightness: (qualityAnalysis?.brightness || 70) / 100,
      contrast: (qualityAnalysis?.contrast || 75) / 100,
      saturation: (qualityAnalysis?.saturation || 70) / 100,
      stability: (qualityAnalysis?.stability || 85) / 100,
      noise: (qualityAnalysis?.noise || 20) / 100,
    }
  }

  private async detectKeyMoments(scenes: SceneAnalysis[], _ffmpegAnalysis: any): Promise<KeyMoment[]> {
    const keyMoments: KeyMoment[] = []

    // Определяем ключевые моменты на основе различных критериев
    for (const scene of scenes) {
      // Высокая активность
      if (scene.type === SceneType.ACTION) {
        keyMoments.push({
          id: `moment-${keyMoments.length + 1}`,
          timestamp: scene.startTime + scene.duration / 2,
          duration: Math.min(scene.duration, 5),
          type: KeyMomentType.ACTION_PEAK,
          score: 0.8,
          description: "High action sequence",
          sceneId: scene.id,
        })
      }

      // Начало и конец видео
      if (scenes.indexOf(scene) === 0) {
        keyMoments.push({
          id: `moment-${keyMoments.length + 1}`,
          timestamp: scene.startTime,
          duration: Math.min(scene.duration, 3),
          type: KeyMomentType.VISUAL_HIGHLIGHT,
          score: 0.7,
          description: "Opening scene",
          sceneId: scene.id,
        })
      }

      if (scenes.indexOf(scene) === scenes.length - 1) {
        keyMoments.push({
          id: `moment-${keyMoments.length + 1}`,
          timestamp: scene.endTime - Math.min(scene.duration, 3),
          duration: Math.min(scene.duration, 3),
          type: KeyMomentType.VISUAL_HIGHLIGHT,
          score: 0.7,
          description: "Closing scene",
          sceneId: scene.id,
        })
      }
    }

    return keyMoments
  }

  private async classifyContent(
    scenes: SceneAnalysis[],
    ffmpegAnalysis: any,
    config: SceneAnalysisConfig,
  ): Promise<any> {
    if (!config.ai.enableContentClassification) {
      // Базовая классификация без AI
      return {
        contentType: ContentType.NARRATIVE,
        genres: [Genre.DOCUMENTARY],
        confidence: 0.5,
      }
    }

    // Используем AI для классификации
    const prompt = this.buildClassificationPrompt(scenes, ffmpegAnalysis)
    const response = await this.aiService.sendRequest(config.ai.model || "gpt-4", [{ role: "user", content: prompt }], {
      temperature: 0.3,
      maxTokens: 1000,
    })

    return this.parseClassificationResponse(response.content || "{}")
  }

  private buildClassificationPrompt(scenes: SceneAnalysis[], analysis: any): string {
    return `Classify this video content based on the following analysis:

Video Info:
- Duration: ${analysis.metadata.duration}s
- Number of scenes: ${scenes.length}
- Average scene duration: ${this.calculateAverageSceneDuration(scenes)}s
- Scene types: ${scenes.map((s) => s.type).join(", ")}

Quality Metrics:
- Overall quality: ${analysis.qualityMetrics?.overall}/100
- Motion intensity: ${analysis.motion?.motionIntensity || "N/A"}

Please provide:
1. Content type (documentary, vlog, tutorial, music video, etc.)
2. Genres (can be multiple)
3. Confidence level (0-1)

Format as JSON: { contentType: string, genres: string[], confidence: number }`
  }

  private parseClassificationResponse(response: string): any {
    try {
      const jsonMatch = /```json\n([\s\S]*?)\n```/.exec(response)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      return JSON.parse(response)
    } catch {
      return {
        contentType: ContentType.NARRATIVE,
        genres: [Genre.DOCUMENTARY],
        confidence: 0.5,
      }
    }
  }

  private createTimelineData(scenes: SceneAnalysis[], _keyMoments: KeyMoment[], ffmpegAnalysis: any): any {
    const segments: TimelineSegment[] = scenes.map((scene) => ({
      start: scene.startTime,
      end: scene.endTime,
      type: this.mapSceneTypeToSegmentType(scene.type),
      confidence: 0.8,
      metadata: {
        sceneId: scene.id,
        quality: scene.quality.overall,
      },
    }))

    const keyframes: KeyframeData[] =
      ffmpegAnalysis.keyFrames?.keyFrames?.map((kf: any) => ({
        timestamp: kf.timestamp,
        thumbnailPath: kf.imagePath,
        features: this.extractVisualFeatures(kf),
        importance: kf.confidence || 0.5,
      })) || []

    return {
      duration: ffmpegAnalysis.metadata.duration,
      segments,
      keyframes,
    }
  }

  private mapSceneTypeToSegmentType(sceneType: SceneType): any {
    // Простое сопоставление типов
    switch (sceneType) {
      case SceneType.ESTABLISHING:
        return "intro"
      case SceneType.TRANSITION:
        return "transition"
      default:
        return "main_content"
    }
  }

  private extractVisualFeatures(_keyframe: any): VisualFeatures {
    // TODO: Implement real visual feature extraction
    return {
      dominantColors: [],
      composition: {
        ruleOfThirds: 0.5,
        symmetry: 0.5,
        balance: 0.5,
        leadingLines: false,
        goldenRatio: 0.5,
      },
      lighting: {
        brightness: 0.5,
        contrast: 0.5,
        type: LightingType.NATURAL,
        quality: 0.5,
      },
      motion: {
        intensity: 0.5,
        direction: MotionDirection.STATIC,
        speed: 0,
        cameraMovement: {
          type: CameraMovementType.STATIC,
          intensity: 0,
          smooth: true,
        },
      },
    }
  }

  private calculateAverageSceneDuration(scenes: SceneAnalysis[]): number {
    if (scenes.length === 0) return 0
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)
    return totalDuration / scenes.length
  }

  private async extractDominantColors(scenes: SceneAnalysis[]): Promise<string[]> {
    try {
      if (!this.visionService || scenes.length === 0) {
        return ["#000000", "#FFFFFF", "#808080"] // Fallback цвета
      }

      const allColors = new Map<string, number>()
      let totalKeyFrames = 0

      // Извлекаем цвета из ключевых кадров всех сцен
      for (const scene of scenes) {
        for (const keyFrame of scene.keyFrames) {
          if (keyFrame.thumbnailPath) {
            try {
              // Загружаем кадр как ImageData
              const frameImageData = await this.loadFrameAsImageData(keyFrame.thumbnailPath)

              // Извлекаем доминирующие цвета через VisionService
              const frameColors = this.visionService.extractDominantColors(frameImageData, 3)

              // Добавляем цвета в общую карту с весами
              frameColors.forEach((color) => {
                const currentCount = allColors.get(color) || 0
                allColors.set(color, currentCount + 1)
              })

              totalKeyFrames++
            } catch (error) {
              console.warn(`Failed to extract colors from keyframe ${keyFrame.thumbnailPath}:`, error)
            }
          }
        }
      }

      if (allColors.size === 0) {
        return ["#000000", "#FFFFFF", "#808080"] // Fallback если не удалось извлечь цвета
      }

      // Сортируем цвета по частоте встречаемости
      const sortedColors = Array.from(allColors.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color, _]) => color)

      // Возвращаем топ-5 доминирующих цветов
      const dominantColors = sortedColors.slice(0, 5)

      console.log(
        `Extracted ${dominantColors.length} dominant colors from ${totalKeyFrames} keyframes across ${scenes.length} scenes`,
      )
      return dominantColors.length > 0 ? dominantColors : ["#000000", "#FFFFFF", "#808080"]
    } catch (error) {
      console.error("Failed to extract dominant colors:", error)
      return ["#000000", "#FFFFFF", "#808080"] // Fallback в случае ошибки
    }
  }

  /**
   * Загружает кадр как ImageData для анализа цветов
   */
  private async loadFrameAsImageData(thumbnailPath: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Failed to get canvas context"))
            return
          }

          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          resolve(imageData)
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${thumbnailPath}`))
      }

      // Загружаем изображение
      img.src = thumbnailPath
    })
  }

  private calculateVisualComplexity(_scenes: SceneAnalysis[]): number {
    // Простая метрика сложности на основе количества сцен и их типов
    // Простая метрика сложности - заглушка
    return 0.5
  }

  /**
   * Анализирует переходы между сценами
   */
  private async analyzeSceneTransitions(scenes: SceneAnalysis[], ffmpegAnalysis: any): Promise<void> {
    try {
      // Подготавливаем данные для SceneDetectionService
      const scenesData = scenes.map((scene) => ({
        startTime: scene.startTime,
        endTime: scene.endTime,
        keyframes: scene.keyFrames.map((kf) => ({
          time: kf.time,
          histogram: kf.features?.colorHistogram || this.generateDummyHistogram(),
          motionVectors: kf.features?.motionVectors,
          audioLevel: this.extractAudioLevelAtTime(ffmpegAnalysis, kf.time),
        })),
      }))

      // Анализируем переходы
      const transitions = await this.sceneDetectionService.analyzeTransitions(scenesData)

      // Применяем результаты к сценам
      transitions.forEach((transition) => {
        const fromScene = scenes[transition.fromScene]
        const toScene = scenes[transition.toScene]

        if (fromScene && toScene) {
          // Добавляем переход к исходящей сцене
          fromScene.transitions.push({
            type: transition.type,
            direction: "outgoing",
            targetSceneId: toScene.id,
            startTime: transition.startTime,
            endTime: transition.endTime,
            duration: transition.duration,
            confidence: transition.confidence,
            metadata: {
              smoothness: transition.smoothness,
              visualImpact: transition.visualImpact,
              ...transition.metadata,
            },
          })

          // Добавляем переход к входящей сцене
          toScene.transitions.push({
            type: transition.type,
            direction: "incoming",
            targetSceneId: fromScene.id,
            startTime: transition.startTime,
            endTime: transition.endTime,
            duration: transition.duration,
            confidence: transition.confidence,
            metadata: {
              smoothness: transition.smoothness,
              visualImpact: transition.visualImpact,
              ...transition.metadata,
            },
          })
        }
      })

      console.log(`Analyzed ${transitions.length} scene transitions`)
    } catch (error) {
      console.error("Failed to analyze scene transitions:", error)
      // Продолжаем без анализа переходов
    }
  }

  /**
   * Генерирует заглушку для цветовой гистограммы
   */
  private generateDummyHistogram(): number[] {
    // Генерируем простую RGB гистограмму (256 значений для каждого канала)
    return Array(768)
      .fill(0)
      .map(() => Math.random() * 100)
  }

  /**
   * Извлекает уровень аудио в указанное время
   */
  private extractAudioLevelAtTime(ffmpegAnalysis: any, time: number): number | undefined {
    const audioData = ffmpegAnalysis.audio
    if (!audioData?.volume?.timeline) return undefined

    // Находим ближайшую точку на временной шкале
    const timeline = audioData.volume.timeline
    let closestEntry = timeline[0]
    let minDistance = Math.abs(timeline[0]?.time - time)

    for (const entry of timeline) {
      const distance = Math.abs(entry.time - time)
      if (distance < minDistance) {
        minDistance = distance
        closestEntry = entry
      }
    }

    return closestEntry?.level
  }

  private createAudioProfile(ffmpegAnalysis: any): AudioProfile {
    const silenceData = ffmpegAnalysis.silence
    const audioData = ffmpegAnalysis.audio

    return {
      hasSpeech: silenceData?.speechPercentage > 10,
      hasMusic: true, // TODO: Implement music detection
      hasSilence: silenceData?.totalSilenceDuration > 0,
      speechPercentage: silenceData?.speechPercentage || 0,
      musicPercentage: 0, // TODO: Calculate from audio analysis
      averageVolume: audioData?.volume?.average || 0.5,
      dynamicRange: audioData?.dynamics?.dynamicRange || 0.5,
    }
  }

  private getDefaultConfig(): SceneAnalysisConfig {
    return {
      ffmpeg: {
        sceneThreshold: 0.3,
        minSceneLength: 1.0,
        keyframeInterval: 5.0,
        qualitySampleRate: 1.0,
      },
      vision: {
        enableObjectDetection: true, // Включаем YOLO по умолчанию
        enableFaceDetection: true, // Включаем детекцию лиц
        enableTextRecognition: false,
        enableActivityDetection: false,
        confidenceThreshold: 0.5,
      },
      ai: {
        enableContentClassification: true,
        enableMoodDetection: true,
        enableGenreDetection: true,
        model: "gpt-4",
      },
      enableCharacterAnalysis: true, // Включаем анализ персонажей по умолчанию
      performance: {
        parallel: true,
        maxThreads: 4,
        cacheResults: true,
      },
    }
  }

  /**
   * Загрузить профили персонажей из person-identification
   */
  private async loadPersonProfiles(): Promise<void> {
    try {
      // TODO: Интеграция с person-identification service
      // const personService = PersonIdentificationService.getInstance()
      // const profiles = await personService.getAllProfiles()

      // Mock данные для тестирования
      const mockProfiles: PersonProfile[] = [
        {
          id: "person-1",
          name: "John Doe",
          isVerified: true,
          faceEmbeddings: [],
          appearances: [],
          totalScreenTime: 0,
          firstSeen: { seconds: 0 },
          lastSeen: { seconds: 120 },
          tags: ["main_character"],
          thumbnails: [],
          privacy: {
            blurFace: false,
            hideFromSearch: false,
            anonymize: false,
            blurIntensity: 5,
            blurTracking: false,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "person-2",
          name: "Jane Smith",
          isVerified: true,
          faceEmbeddings: [],
          appearances: [],
          totalScreenTime: 0,
          firstSeen: { seconds: 0 },
          lastSeen: { seconds: 120 },
          tags: ["secondary_character"],
          thumbnails: [],
          privacy: {
            blurFace: false,
            hideFromSearch: false,
            anonymize: false,
            blurIntensity: 5,
            blurTracking: false,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      for (const profile of mockProfiles) {
        this.personProfilesCache.set(profile.id, profile)
      }

      console.log(`Loaded ${mockProfiles.length} person profiles`)
    } catch (error) {
      console.warn("Failed to load person profiles:", error)
    }
  }

  /**
   * Идентифицировать персонажей на основе детекций лиц
   */
  private async identifyPersons(faceDetections: any[], sceneId: string): Promise<Person[]> {
    const cacheKey = `${sceneId}-persons`

    // Проверяем кэш
    if (this.detectedPersonsCache.has(cacheKey)) {
      return this.detectedPersonsCache.get(cacheKey)!
    }

    const identifiedPersons: Person[] = []

    for (const face of faceDetections) {
      // В реальной реализации здесь будет сравнение face embeddings
      // с существующими PersonProfile.faceEmbeddings

      // Mock идентификация на основе confidence
      let identifiedPerson: Person | null = null

      if (face.confidence > 0.8) {
        // Высокая уверенность - ищем по профилям
        const profiles = Array.from(this.personProfilesCache.values())
        const matchedProfile = profiles.find((p) => p.isVerified)

        if (matchedProfile) {
          identifiedPerson = {
            id: matchedProfile.id,
            name: matchedProfile.name || "Unknown",
            confidence: face.confidence * 0.9, // Снижаем уверенность при сопоставлении
          }
        }
      }

      // Если не найден в профилях, создаем временного персонажа
      if (!identifiedPerson) {
        identifiedPerson = {
          id: `temp-person-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: `Unknown Person ${identifiedPersons.length + 1}`,
          confidence: face.confidence,
        }
      }

      identifiedPersons.push(identifiedPerson)
    }

    // Удаляем дубликаты по ID
    const uniquePersons = identifiedPersons.filter(
      (person, index, arr) => arr.findIndex((p) => p.id === person.id) === index,
    )

    // Кэшируем результат
    this.detectedPersonsCache.set(cacheKey, uniquePersons)

    return uniquePersons
  }

  /**
   * Создать Fragment на основе сцены с интеграцией montage-planner
   */
  private createFragmentFromScene(scene: SceneAnalysis, mediaFile: MediaFile, persons: Person[]): any {
    // Создаем Fragment в формате montage-planner
    return {
      id: `fragment-${scene.id}`,
      videoId: mediaFile.path,
      sourceFile: {
        path: mediaFile.path,
        name: mediaFile.name,
        duration: mediaFile.duration,
        size: 0, // TODO: Get real file size
        format: "mp4", // TODO: Detect format
        mimeType: "video/mp4",
      },
      startTime: scene.startTime,
      endTime: scene.endTime,
      duration: scene.duration,
      screenshotPath: scene.keyFrames[0]?.thumbnailPath,
      objects: scene.content?.objects?.map((obj: any) => obj.label) || [],
      people: persons,
      score: {
        overall: scene.quality.overall,
        visual: scene.quality.overall,
        audio: scene.quality.overall,
        composition: scene.keyFrames[0]?.composition?.ruleOfThirds * 100 || 50,
        timing: scene.duration > 2 ? 80 : 60, // Предпочитаем более длинные сцены
        relevance: this.calculateSceneRelevance(scene),
      },
      tags: [scene.type, `quality-${Math.round(scene.quality.overall / 20) * 20}`],
      description: `${scene.type} scene with ${persons.length} person(s)`,
    }
  }

  /**
   * Вычислить релевантность сцены для монтажа
   */
  private calculateSceneRelevance(scene: SceneAnalysis): number {
    let relevance = 50 // Базовая релевантность

    // Бонусы за тип сцены
    switch (scene.type) {
      case SceneType.ACTION:
        relevance += 30
        break
      case SceneType.DIALOGUE:
        relevance += 20
        break
      case SceneType.ESTABLISHING:
        relevance += 15
        break
      case SceneType.CLOSEUP:
        relevance += 25
        break
      default:
        // Неизвестный тип сцены остается с базовой релевантностью
        break
    }

    // Бонус за качество
    relevance += (scene.quality.overall - 50) * 0.3

    // Бонус за количество лиц
    const faceCount = scene.content?.faces?.length || 0
    relevance += Math.min(faceCount * 10, 30)

    return Math.max(0, Math.min(100, relevance))
  }

  /**
   * Получить всех детектированных персонажей для видео
   */
  private getDetectedPersonsForVideo(_videoPath: string): Person[] {
    const allPersons: Person[] = []

    // Собираем всех персонажей из кэша
    for (const [key, persons] of this.detectedPersonsCache.entries()) {
      // Проверяем, что ключ относится к этому видео
      allPersons.push(...persons)
    }

    // Убираем дубликаты и объединяем по ID
    const uniquePersons = new Map<string, Person>()

    for (const person of allPersons) {
      if (uniquePersons.has(person.id)) {
        // Обновляем уверенность максимальной
        const existing = uniquePersons.get(person.id)!
        if (person.confidence > existing.confidence) {
          uniquePersons.set(person.id, person)
        }
      } else {
        uniquePersons.set(person.id, person)
      }
    }

    return Array.from(uniquePersons.values())
  }

  /**
   * Рассчитать статистику по персонажам
   */
  private calculatePersonStats(persons: Person[], scenes: SceneAnalysis[]): any {
    const stats: any = {
      totalPersons: persons.length,
      averageConfidence: 0,
      personAppearances: {},
      personScreenTime: {},
    }

    if (persons.length === 0) return stats

    // Рассчитываем среднюю уверенность
    stats.averageConfidence = persons.reduce((sum, p) => sum + p.confidence, 0) / persons.length

    // Подсчитываем появления и время экрана для каждого персонажа
    for (const person of persons) {
      stats.personAppearances[person.id] = 0
      stats.personScreenTime[person.id] = 0

      for (const scene of scenes) {
        const scenePersons = (scene.content as ExtendedContentElements)?.identifiedPersons || []
        if (scenePersons.some((p: Person) => p.id === person.id)) {
          stats.personAppearances[person.id]++
          stats.personScreenTime[person.id] += scene.duration
        }
      }
    }

    return stats
  }

  /**
   * Очистить кэш персонажей
   */
  public clearPersonCache(): void {
    this.detectedPersonsCache.clear()
    console.log("Person detection cache cleared")
  }

  /**
   * Обнаружить персонажей в видео или изображении
   */
  public async detectPersons(mediaPath: string, timerange?: { start: number; end: number }): Promise<DetectedFace[]> {
    if (!this._isReady) {
      throw new Error("Scene Analysis Engine not initialized")
    }

    const detectedFaces: DetectedFace[] = []

    try {
      // Если указан временной диапазон, анализируем только его
      const startTime = timerange?.start || 0
      const endTime = timerange?.end || 60 // По умолчанию первые 60 секунд

      // Анализируем кадры с интервалом
      const frameInterval = 1.0 // Каждую секунду
      const frameCount = Math.ceil((endTime - startTime) / frameInterval)

      for (let i = 0; i < frameCount; i++) {
        const timestamp = startTime + i * frameInterval

        // Извлекаем кадр через FFmpeg
        const frameData = await this.ffmpegService.extractFrame(mediaPath, timestamp)

        if (frameData && this.visionService) {
          // Анализируем кадр
          const frameAnalysis = await this.visionService.analyzeFrame(frameData, i)

          // Преобразуем детекции лиц в DetectedFace
          for (const face of frameAnalysis.faces) {
            const detectedFace: DetectedFace = {
              id: `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              bbox: face.boundingBox,
              confidence: face.confidence,
              landmarks: undefined, // TODO: Преобразовать landmarks
              age: undefined, // TODO: Определять возраст
              gender: undefined, // TODO: Определять пол
              emotion:
                face.emotion?.emotion === Emotion.HAPPY
                  ? "happy"
                  : face.emotion?.emotion === Emotion.SAD
                    ? "sad"
                    : face.emotion?.emotion === Emotion.EXCITED
                      ? "surprised"
                      : face.emotion?.emotion === Emotion.TENSE
                        ? "angry"
                        : face.emotion?.emotion === Emotion.CALM
                          ? "neutral"
                          : face.emotion?.emotion === Emotion.MYSTERIOUS
                            ? "fear"
                            : face.emotion?.emotion === Emotion.DRAMATIC
                              ? "disgust"
                              : "neutral",
              blur: 0.1, // TODO: Вычислять реальное размытие
              occlusion: 0.1, // TODO: Вычислять перекрытие
              pose: {
                yaw: 0,
                pitch: 0,
                roll: 0,
              },
              frameNumber: i,
              timestamp: {
                seconds: timestamp,
                frames: Math.floor(timestamp * 30), // Предполагаем 30 fps
              },
              clipId: mediaPath,
            }

            detectedFaces.push(detectedFace)
          }
        }
      }

      return detectedFaces
    } catch (error) {
      console.error("Failed to detect persons:", error)
      return detectedFaces
    }
  }

  /**
   * Рассчитать общую демографическую статистику по всем сценам
   */
  private calculateOverallDemographics(scenes: SceneAnalysis[]): DemographicStats | null {
    // Собираем все результаты age-gender со всех сцен
    const allAgeGenderResults = scenes.flatMap(
      (scene) => (scene.content as ExtendedContentElements)?.ageGenderResults || [],
    )

    if (allAgeGenderResults.length === 0) {
      return null
    }

    // Используем метод calculateDemographics из AgeGenderDetectionService
    // через частный метод
    return (this.ageGenderDetectionService as any).calculateDemographics(allAgeGenderResults)
  }
}

// Типы
interface MediaFile {
  path: string
  name: string
  duration: number
}

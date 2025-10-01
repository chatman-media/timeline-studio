/**
 * Advanced Face Detection Service
 * Расширенный сервис для продвинутой детекции и анализа лиц
 */

import { invoke } from "@tauri-apps/api/core"

import type { DetectedFace, FaceAttributes } from "../types/person"

// Конфигурация продвинутой детекции
export interface AdvancedDetectionConfig {
  // Модели
  faceDetectionModel: "yolo-face" | "retinaface" | "mtcnn" | "mediapipe"
  recognitionModel: "facenet" | "arcface" | "cosface" | "sphereface"

  // Параметры производительности
  useGPU: boolean
  batchSize: number
  maxFPS: number

  // Качество
  minFaceSize: number
  maxFaces: number
  qualityThreshold: number

  // Дополнительный анализ
  detectEmotions: boolean
  detectAgeGender: boolean
  detectLandmarks: boolean
  detectGaze: boolean
}

// Результат продвинутой детекции
export interface AdvancedFaceDetection extends DetectedFace {
  // Расширенные атрибуты
  advancedAttributes?: AdvancedFaceAttributes
  // 3D информация
  pose3D?: Face3DPose
  // Качество изображения лица
  imageQuality?: FaceImageQuality
  // Трекинг информация
  trackingId?: string
  trackingConfidence?: number
}

export interface AdvancedFaceAttributes extends FaceAttributes {
  // Детальные эмоции
  detailedEmotions?: {
    neutral: number
    happy: number
    sad: number
    angry: number
    fearful: number
    disgusted: number
    surprised: number
  }

  // Детальная информация о возрасте и поле
  ageRange?: { min: number; max: number }
  genderConfidence?: number

  // Направление взгляда
  gazeDirection?: {
    yaw: number
    pitch: number
    confidence: number
  }

  // Дополнительные атрибуты
  facialHair?: {
    mustache: number
    beard: number
    sideburns: number
  }

  accessories?: {
    glasses: number
    sunglasses: number
    headwear: number
  }

  makeup?: {
    eyeMakeup: number
    lipMakeup: number
  }
}

export interface Face3DPose {
  // Углы поворота головы
  yaw: number // Поворот влево/вправо
  pitch: number // Наклон вверх/вниз
  roll: number // Наклон влево/вправо

  // 3D позиция
  translationX: number
  translationY: number
  translationZ: number

  // Уверенность
  confidence: number
}

export interface FaceImageQuality {
  // Общее качество (0-1)
  overall: number

  // Детали качества
  sharpness: number
  brightness: number
  contrast: number

  // Проблемы
  isBlurry: boolean
  isTooDark: boolean
  isTooBright: boolean
  isOccluded: boolean

  // Рекомендации
  suitableForRecognition: boolean
  suitableForEnrollment: boolean
}

// Статус real-time обработки
export interface RealtimeProcessingStatus {
  isProcessing: boolean
  fps: number
  processedFrames: number
  detectedFaces: number
  averageLatency: number
  gpuUsage?: number
  cpuUsage?: number
}

/**
 * Advanced Face Detection Service
 */
export class AdvancedFaceDetectionService {
  private static instance: AdvancedFaceDetectionService
  private config: AdvancedDetectionConfig
  private isInitialized = false
  private realtimeStatus: RealtimeProcessingStatus = {
    isProcessing: false,
    fps: 0,
    processedFrames: 0,
    detectedFaces: 0,
    averageLatency: 0,
  }

  private defaultConfig: AdvancedDetectionConfig = {
    faceDetectionModel: "yolo-face",
    recognitionModel: "facenet",
    useGPU: false,
    batchSize: 1,
    maxFPS: 30,
    minFaceSize: 30,
    maxFaces: 20,
    qualityThreshold: 0.7,
    detectEmotions: true,
    detectAgeGender: true,
    detectLandmarks: true,
    detectGaze: false,
  }

  private constructor(config: Partial<AdvancedDetectionConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(config: Partial<AdvancedDetectionConfig> = {}): AdvancedFaceDetectionService {
    if (!AdvancedFaceDetectionService.instance) {
      AdvancedFaceDetectionService.instance = new AdvancedFaceDetectionService(config)
    }
    return AdvancedFaceDetectionService.instance
  }

  /**
   * Инициализация сервиса
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Инициализируем YOLO модель для детекции лиц
      await invoke("init_yolo_processor", {
        modelType: "yolo-face-v8",
        confidenceThreshold: this.config.qualityThreshold,
      })

      // Инициализируем FaceNet модель для embeddings
      const facenetModel = this.config.recognitionModel === "arcface" ? "arcface-512d" : "facenet-512d"
      await invoke("init_facenet_processor", {
        modelType: facenetModel,
      })

      // Проверяем доступность GPU
      if (this.config.useGPU) {
        const gpuAvailable = await invoke<boolean>("check_gpu_availability")
        if (!gpuAvailable) {
          console.warn("GPU недоступен, переключаемся на CPU")
          this.config.useGPU = false
        }
      }

      this.isInitialized = true
      console.log("Advanced Face Detection Service инициализирован")
    } catch (error) {
      console.error("Ошибка инициализации Advanced Face Detection Service:", error)
      throw error
    }
  }

  /**
   * Детекция лиц в изображении с продвинутым анализом
   */
  async detectFacesAdvanced(
    imageData: string | ArrayBuffer,
    options?: {
      returnEmbeddings?: boolean
      returnCroppedFaces?: boolean
      minConfidence?: number
    },
  ): Promise<AdvancedFaceDetection[]> {
    await this.ensureInitialized()

    try {
      // Конвертируем данные в base64 если нужно
      let base64Data: string
      if (imageData instanceof ArrayBuffer) {
        base64Data = btoa(String.fromCharCode(...new Uint8Array(imageData)))
      } else {
        base64Data = imageData
      }

      const results = await invoke<AdvancedFaceDetection[]>("detect_faces_advanced", {
        imageData: base64Data,
        returnEmbeddings: options?.returnEmbeddings || false,
        returnCroppedFaces: options?.returnCroppedFaces || false,
        minConfidence: options?.minConfidence || this.config.qualityThreshold,
      })

      return results
    } catch (error) {
      console.error("Ошибка продвинутой детекции лиц:", error)
      return []
    }
  }

  /**
   * Пакетная обработка изображений
   */
  async detectFacesBatch(
    images: Array<{ id: string; data: string | ArrayBuffer }>,
    options?: {
      returnEmbeddings?: boolean
      progressCallback?: (progress: number) => void
    },
  ): Promise<Map<string, AdvancedFaceDetection[]>> {
    await this.ensureInitialized()

    const results = new Map<string, AdvancedFaceDetection[]>()
    const batchSize = this.config.batchSize

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize)

      // Обрабатываем батч
      const batchResults = await Promise.all(
        batch.map(async (image) => {
          const faces = await this.detectFacesAdvanced(image.data, {
            returnEmbeddings: options?.returnEmbeddings,
          })
          return { id: image.id, faces }
        }),
      )

      // Сохраняем результаты
      batchResults.forEach(({ id, faces }) => {
        results.set(id, faces)
      })

      // Обновляем прогресс
      if (options?.progressCallback) {
        const progress = Math.min(100, ((i + batch.length) / images.length) * 100)
        options.progressCallback(progress)
      }
    }

    return results
  }

  /**
   * Генерация embedding для лица
   */
  async generateFaceEmbedding(
    faceImage: string | ArrayBuffer,
    _options?: {
      normalize?: boolean
      augment?: boolean
    },
  ): Promise<Float32Array | null> {
    await this.ensureInitialized()

    try {
      // Конвертируем данные в base64
      let base64Data: string
      if (faceImage instanceof ArrayBuffer) {
        base64Data = btoa(String.fromCharCode(...new Uint8Array(faceImage)))
      } else {
        base64Data = faceImage
      }

      const result = await invoke<{
        vector: number[]
        quality: number
        dimension: number
      }>("generate_face_embedding_from_base64", {
        imageData: `data:image/jpeg;base64,${base64Data}`,
      })

      return new Float32Array(result.vector)
    } catch (error) {
      console.error("Ошибка генерации embedding:", error)
      return null
    }
  }

  /**
   * Анализ качества изображения лица
   */
  async analyzeFaceQuality(faceImage: string | ArrayBuffer): Promise<FaceImageQuality> {
    await this.ensureInitialized()

    try {
      // Конвертируем данные в base64
      let base64Data: string
      if (faceImage instanceof ArrayBuffer) {
        base64Data = btoa(String.fromCharCode(...new Uint8Array(faceImage)))
      } else {
        base64Data = faceImage
      }

      const quality = await invoke<FaceImageQuality>("analyze_face_quality", {
        faceImage: base64Data,
      })

      return quality
    } catch (error) {
      console.error("Ошибка анализа качества:", error)
      // Возвращаем значения по умолчанию
      return {
        overall: 0,
        sharpness: 0,
        brightness: 0.5,
        contrast: 0.5,
        isBlurry: true,
        isTooDark: false,
        isTooBright: false,
        isOccluded: true,
        suitableForRecognition: false,
        suitableForEnrollment: false,
      }
    }
  }

  /**
   * Начать real-time обработку видеопотока
   */
  async startRealtimeProcessing(
    streamId: string,
    callbacks: {
      onFaceDetected?: (faces: AdvancedFaceDetection[]) => void
      onStatusUpdate?: (status: RealtimeProcessingStatus) => void
      onError?: (error: Error) => void
    },
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      // Запускаем real-time обработку в Tauri
      await invoke("start_realtime_face_detection", {
        streamId,
        config: this.config,
      })

      this.realtimeStatus.isProcessing = true

      // Слушаем события от backend
      const unlisten = await this.setupRealtimeListeners(callbacks)

      // Сохраняем функцию отписки
      ;(this as any)._realtimeUnlisten = unlisten
    } catch (error) {
      console.error("Ошибка запуска real-time обработки:", error)
      callbacks.onError?.(error as Error)
    }
  }

  /**
   * Остановить real-time обработку
   */
  async stopRealtimeProcessing(): Promise<void> {
    if (!this.realtimeStatus.isProcessing) return

    try {
      await invoke("stop_realtime_face_detection")

      this.realtimeStatus.isProcessing = false

      // Отписываемся от событий
      if ((this as any)._realtimeUnlisten) {
        ;(this as any)._realtimeUnlisten()
        delete (this as any)._realtimeUnlisten
      }
    } catch (error) {
      console.error("Ошибка остановки real-time обработки:", error)
    }
  }

  /**
   * Получить текущий статус real-time обработки
   */
  getRealtimeStatus(): RealtimeProcessingStatus {
    return { ...this.realtimeStatus }
  }

  /**
   * Обновить конфигурацию
   */
  async updateConfig(config: Partial<AdvancedDetectionConfig>): Promise<void> {
    this.config = { ...this.config, ...config }

    if (this.isInitialized) {
      await invoke("update_face_detection_config", {
        config: this.config,
      })
    }
  }

  /**
   * Вспомогательные методы
   */

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private async setupRealtimeListeners(_callbacks: {
    onFaceDetected?: (faces: AdvancedFaceDetection[]) => void
    onStatusUpdate?: (status: RealtimeProcessingStatus) => void
    onError?: (error: Error) => void
  }): Promise<() => void> {
    // В реальной реализации здесь будут Tauri event listeners
    // Пока возвращаем заглушку
    return () => {
      console.log("Realtime listeners cleanup")
    }
  }

  /**
   * Применить размытие к лицам на изображении
   */
  async blurFaces(
    imageData: string | ArrayBuffer,
    options?: {
      blurIntensity?: number
      blurType?: "gaussian" | "pixelate" | "solid"
      faceIds?: string[] // Размыть только определенные лица
    },
  ): Promise<string> {
    await this.ensureInitialized()

    try {
      // Конвертируем данные в base64
      let base64Data: string
      if (imageData instanceof ArrayBuffer) {
        base64Data = btoa(String.fromCharCode(...new Uint8Array(imageData)))
      } else {
        base64Data = imageData
      }

      const blurredImage = await invoke<string>("blur_faces_in_image", {
        imageData: base64Data,
        blurIntensity: options?.blurIntensity || 15,
        blurType: options?.blurType || "gaussian",
        faceIds: options?.faceIds,
      })

      return blurredImage
    } catch (error) {
      console.error("Ошибка размытия лиц:", error)
      return imageData as string
    }
  }

  /**
   * Очистка ресурсов
   */
  async cleanup(): Promise<void> {
    if (this.realtimeStatus.isProcessing) {
      await this.stopRealtimeProcessing()
    }

    if (this.isInitialized) {
      await invoke("cleanup_face_detection")
      this.isInitialized = false
    }
  }
}

export default AdvancedFaceDetectionService

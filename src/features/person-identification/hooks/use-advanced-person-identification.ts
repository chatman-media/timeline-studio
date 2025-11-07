/**
 * Advanced Person Identification Hook
 * Хук для работы с продвинутыми возможностями распознавания лиц
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { useToast } from "@/hooks/use-toast"
import { createLogger } from "@/lib/tauri-logger"
import { type AdvancedFaceDetection, AdvancedFaceDetectionService } from "../services/advanced-face-detection-service"
import { AdvancedTrackingService, type TrackedPerson } from "../services/advanced-tracking-service"
import { PersonDatabaseService } from "../services/person-database-service"
import type { DetectedFace, PersonProfile, PersonSearchResult } from "../types/person"

const logger = createLogger({ module: "UseAdvancedPersonIdentification" })

export interface UseAdvancedPersonIdentificationOptions {
  // Конфигурация детекции
  useGPU?: boolean
  detectionModel?: "yolo-face" | "retinaface" | "mtcnn" | "mediapipe"

  // Конфигурация трекинга
  enableTracking?: boolean
  trackingAlgorithm?: "deepsort" | "sort" | "iou" | "kalman"

  // Автоматизация
  autoIdentify?: boolean
  autoCluster?: boolean
  clusterThreshold?: number

  // Приватность
  enablePrivacyMode?: boolean
  blurUnidentified?: boolean
}

export interface AdvancedIdentificationState {
  // Состояние обработки
  isProcessing: boolean
  isAnalyzing: boolean
  progress: number

  // Результаты
  detectedFaces: AdvancedFaceDetection[]
  trackedPersons: TrackedPerson[]
  identifiedPersons: Map<string, PersonProfile>

  // Статистика
  statistics: {
    totalFaces: number
    identifiedFaces: number
    unidentifiedFaces: number
    averageConfidence: number
    processingTime: number
  }

  // Ошибки
  error: Error | null
}

export function useAdvancedPersonIdentification(options: UseAdvancedPersonIdentificationOptions = {}) {
  const { toast } = useToast()

  // Состояние
  const [state, setState] = useState<AdvancedIdentificationState>({
    isProcessing: false,
    isAnalyzing: false,
    progress: 0,
    detectedFaces: [],
    trackedPersons: [],
    identifiedPersons: new Map(),
    statistics: {
      totalFaces: 0,
      identifiedFaces: 0,
      unidentifiedFaces: 0,
      averageConfidence: 0,
      processingTime: 0,
    },
    error: null,
  })

  // Сервисы
  const personService = useRef<PersonDatabaseService>(null)
  const detectionService = useRef<AdvancedFaceDetectionService>(null)
  const trackingService = useRef<AdvancedTrackingService>(null)

  // Инициализация сервисов
  useEffect(() => {
    const initServices = async () => {
      try {
        // Инициализация сервисов с конфигурацией
        personService.current = PersonDatabaseService.getInstance()
        await personService.current.initialize()

        detectionService.current = AdvancedFaceDetectionService.getInstance({
          useGPU: options.useGPU,
          faceDetectionModel: options.detectionModel || "yolo-face",
        })
        await detectionService.current.initialize()

        if (options.enableTracking) {
          trackingService.current = AdvancedTrackingService.getInstance({
            algorithm: options.trackingAlgorithm || "deepsort",
          })
          await trackingService.current.initialize()
        }
      } catch (error) {
        logger.error("Error initializing services:", error)
        setState((prev) => ({ ...prev, error: error as Error }))
      }
    }

    void initServices()
  }, [options.useGPU, options.detectionModel, options.enableTracking, options.trackingAlgorithm])

  /**
   * Анализ видео с продвинутыми возможностями
   */
  const analyzeVideo = useCallback(
    async (
      videoPath: string,
      analyzeOptions?: {
        startTime?: number
        endTime?: number
        skipFrames?: number
        onProgress?: (progress: number) => void
      },
    ) => {
      if (!detectionService.current || !personService.current) {
        throw new Error("Services not initialized")
      }

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        progress: 0,
        error: null,
      }))

      const startProcessingTime = performance.now()
      const detectedFaces: AdvancedFaceDetection[] = []
      const identifiedPersons = new Map<string, PersonProfile>()

      try {
        // Здесь должна быть логика извлечения кадров из видео
        // Пока используем заглушку
        const frames = await extractVideoFrames(videoPath, {
          startTime: analyzeOptions?.startTime,
          endTime: analyzeOptions?.endTime,
          skipFrames: analyzeOptions?.skipFrames || 5,
        })

        // Начинаем трекинг если включен
        if (trackingService.current && options?.enableTracking) {
          await trackingService.current.startTracking(videoPath)
        }

        // Обрабатываем кадры
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i]

          // Детекция лиц
          const faces = await detectionService.current.detectFacesAdvanced(frame.data, {
            returnEmbeddings: true,
            minConfidence: 0.5,
          })

          // Трекинг
          if (trackingService.current && options?.enableTracking) {
            const trackingResult = await trackingService.current.processFrame(
              faces as DetectedFace[],
              frame.frameNumber,
              frame.timestamp,
              frame.data,
            )

            setState((prev) => ({
              ...prev,
              trackedPersons: trackingResult.tracks,
            }))
          }

          // Идентификация персон
          if (options?.autoIdentify) {
            for (const face of faces) {
              if (face.embedding) {
                const searchResults = await personService.current.searchPersonsByEmbedding(face.embedding, 0.7, 1)

                if (searchResults.length > 0) {
                  const person = searchResults[0].person
                  face.personId = person.id
                  face.name = person.name
                  identifiedPersons.set(person.id, person)

                  // Связываем с треком
                  if (face.trackingId && trackingService.current) {
                    await trackingService.current.assignPersonToTrack(face.trackingId, person.id)
                  }
                }
              }
            }
          }

          detectedFaces.push(...faces)

          // Обновляем прогресс
          const progress = ((i + 1) / frames.length) * 100
          setState((prev) => ({ ...prev, progress }))
          analyzeOptions?.onProgress?.(progress)
        }

        // Кластеризация неопознанных лиц
        if (options?.autoCluster) {
          const unidentifiedFaces = detectedFaces.filter((f) => !f.personId && f.embedding)
          if (unidentifiedFaces.length > 0) {
            const newPersons = await personService.current.clusterUnidentifiedFaces(
              unidentifiedFaces as any,
              options?.clusterThreshold || 0.8,
            )

            for (const person of newPersons) {
              identifiedPersons.set(person.id, person)
            }

            toast({
              title: "Кластеризация завершена",
              description: `Создано ${newPersons.length} новых персон из ${unidentifiedFaces.length} лиц`,
            })
          }
        }

        // Финализация трекинга
        if (trackingService.current && options?.enableTracking) {
          await trackingService.current.stopTracking()

          // Экспортируем треки как появления
          const appearances = await trackingService.current.exportTracksAsAppearances()

          // Добавляем появления к персонам
          for (const appearance of appearances) {
            if (appearance.personId) {
              await personService.current.addAppearance(appearance.personId, appearance)
            }
          }
        }

        // Вычисляем статистику
        const processingTime = performance.now() - startProcessingTime
        const identifiedCount = detectedFaces.filter((f) => f.personId).length
        const totalConfidence = detectedFaces.reduce((sum, f) => sum + f.confidence, 0)

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          detectedFaces,
          identifiedPersons,
          statistics: {
            totalFaces: detectedFaces.length,
            identifiedFaces: identifiedCount,
            unidentifiedFaces: detectedFaces.length - identifiedCount,
            averageConfidence: detectedFaces.length > 0 ? totalConfidence / detectedFaces.length : 0,
            processingTime,
          },
        }))

        return {
          detectedFaces,
          identifiedPersons: Array.from(identifiedPersons.values()),
          statistics: state.statistics,
        }
      } catch (error) {
        logger.error("Error analyzing video:", error)
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: error as Error,
        }))
        throw error
      }
    },
    [options.enableTracking, options.autoIdentify, options.autoCluster, options.clusterThreshold, toast],
  )

  /**
   * Применить размытие к неопознанным лицам
   */
  const applyPrivacyBlur = useCallback(
    async (
      imageData: string | ArrayBuffer,
      blurOptions?: {
        blurIntensity?: number
        blurType?: "gaussian" | "pixelate" | "solid"
        excludePersonIds?: string[]
      },
    ): Promise<string> => {
      if (!detectionService.current) {
        throw new Error("Detection service not initialized")
      }

      try {
        // Детектируем лица
        const faces = await detectionService.current.detectFacesAdvanced(imageData, {
          returnEmbeddings: false,
          minConfidence: 0.5,
        })

        // Определяем какие лица размывать
        const facesToBlur = faces.filter((face) => {
          // Размываем неопознанные
          if (!face.personId) return true
          // Или если персона в списке исключений
          if (blurOptions?.excludePersonIds?.includes(face.personId)) return false
          return false
        })

        if (facesToBlur.length === 0) {
          return imageData as string
        }

        // Применяем размытие
        const blurredImage = await detectionService.current.blurFaces(imageData, {
          blurIntensity: blurOptions?.blurIntensity,
          blurType: blurOptions?.blurType,
          faceIds: facesToBlur.map((f) => f.id),
        })

        return blurredImage
      } catch (error) {
        logger.error("Error applying privacy blur:", error)
        throw error
      }
    },
    [],
  )

  /**
   * Поиск похожих персон по изображению
   */
  const findSimilarPersonsByImage = useCallback(
    async (
      imageData: string | ArrayBuffer,
      searchOptions?: {
        limit?: number
        minConfidence?: number
      },
    ): Promise<PersonSearchResult[]> => {
      if (!detectionService.current || !personService.current) {
        throw new Error("Services not initialized")
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true }))

        // Детектируем лица
        const faces = await detectionService.current.detectFacesAdvanced(imageData, {
          returnEmbeddings: true,
          minConfidence: 0.5,
        })

        if (faces.length === 0) {
          toast({
            title: "Лица не найдены",
            description: "На изображении не обнаружено лиц",
            variant: "destructive",
          })
          return []
        }

        // Берем лицо с наибольшей уверенностью
        const bestFace = faces.reduce((best, face) => (face.confidence > best.confidence ? face : best))

        if (!bestFace.embedding) {
          throw new Error("Failed to generate face embedding")
        }

        // Ищем похожие персоны
        const results = await personService.current.searchPersonsByEmbedding(
          bestFace.embedding,
          searchOptions?.minConfidence || 0.6,
          searchOptions?.limit || 10,
        )

        setState((prev) => ({ ...prev, isProcessing: false }))
        return results
      } catch (error) {
        logger.error("Error finding similar persons:", error)
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error as Error,
        }))
        throw error
      }
    },
    [toast],
  )

  /**
   * Создать персону из детектированного лица
   */
  const createPersonFromFace = useCallback(
    async (
      face: AdvancedFaceDetection,
      personData: {
        name: string
        tags?: string[]
        description?: string
      },
    ): Promise<PersonProfile> => {
      if (!personService.current) {
        throw new Error("Person service not initialized")
      }

      try {
        // Создаем персону
        const person = await personService.current.createPerson({
          name: personData.name,
          isVerified: true,
          faceEmbeddings: face.embedding
            ? [
                {
                  faceId: face.id,
                  personId: "", // Будет установлен после создания
                  vector: face.embedding,
                  quality: face.confidence,
                  clipId: face.clipId || "",
                  frameNumber: face.frameNumber || 0,
                  timestamp: face.timestamp,
                  landmarks: face.landmarks,
                  createdAt: new Date().toISOString(),
                },
              ]
            : [],
          averageEmbedding: face.embedding,
          appearances: [],
          totalScreenTime: 0,
          firstSeen: face.timestamp,
          lastSeen: face.timestamp,
          tags: personData.tags || [],
          notes: personData.description,
          thumbnails: face.thumbnailUrl
            ? [
                {
                  id: `thumb_${Date.now()}`,
                  imageUrl: face.thumbnailUrl,
                  width: face.bbox.width,
                  height: face.bbox.height,
                  sourceClipId: face.clipId || "",
                  sourceTimestamp: face.timestamp,
                  quality: face.confidence,
                  isPrimary: true,
                  isGenerated: false,
                },
              ]
            : [],
          privacy: {
            blurFace: false,
            hideFromSearch: false,
            anonymize: false,
            blurIntensity: 5,
            blurTracking: true,
          },
        })

        // Обновляем состояние
        setState((prev) => ({
          ...prev,
          identifiedPersons: new Map(prev.identifiedPersons).set(person.id, person),
        }))

        toast({
          title: "Персона создана",
          description: `${person.name} успешно добавлен(а) в базу данных`,
        })

        return person
      } catch (error) {
        logger.error("Error creating person from face:", error)
        throw error
      }
    },
    [toast],
  )

  /**
   * Очистка состояния
   */
  const clearAnalysis = useCallback(() => {
    setState({
      isProcessing: false,
      isAnalyzing: false,
      progress: 0,
      detectedFaces: [],
      trackedPersons: [],
      identifiedPersons: new Map(),
      statistics: {
        totalFaces: 0,
        identifiedFaces: 0,
        unidentifiedFaces: 0,
        averageConfidence: 0,
        processingTime: 0,
      },
      error: null,
    })
  }, [])

  return {
    // Состояние
    ...state,

    // Методы
    analyzeVideo,
    applyPrivacyBlur,
    findSimilarPersonsByImage,
    createPersonFromFace,
    clearAnalysis,

    // Сервисы (для прямого доступа если нужно)
    services: {
      person: personService.current,
      detection: detectionService.current,
      tracking: trackingService.current,
    },
  }
}

// Вспомогательная функция для извлечения кадров (заглушка)
async function extractVideoFrames(
  videoPath: string,
  options: {
    startTime?: number
    endTime?: number
    skipFrames?: number
  },
): Promise<
  Array<{
    frameNumber: number
    timestamp: number
    data: ArrayBuffer
  }>
> {
  // В реальной реализации здесь будет вызов Tauri команды
  // для извлечения кадров из видео
  logger.info("Extracting frames from video:", videoPath, options)
  return []
}

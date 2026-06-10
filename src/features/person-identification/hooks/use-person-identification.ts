/**
 * Hook для работы с системой идентификации персон
 * Предоставляет API для управления персонами и их обнаружения
 */

import { useCallback, useEffect, useState } from "react"
import { PersonDatabaseService } from "@timeline-studio/core/services"
import { createLogger } from "@/lib/tauri-logger"
import type { DetectedFace, PersonAppearance, PersonProfile } from "../types/person"

const logger = createLogger("UsePersonIdentification")

interface UsePersonIdentificationOptions {
  autoSave?: boolean
  confidenceThreshold?: number
}

// Расширенный тип для лица с embedding
interface DetectedFaceWithEmbedding extends DetectedFace {
  embedding?: Float32Array
  thumbnailUrl?: string
  croppedImage?: string
}

export function usePersonIdentification(options: UsePersonIdentificationOptions = {}) {
  const { autoSave = true, confidenceThreshold = 0.7 } = options

  const [persons, setPersons] = useState<PersonProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const personDatabase = PersonDatabaseService.getInstance()
  // TODO: Migrate scene analysis to use Tauri backend commands

  // Загрузка всех персон
  const loadPersons = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allPersons = await personDatabase.getAllPersons()
      setPersons(allPersons)
    } catch (err) {
      setError("Ошибка загрузки персон")
      logger.errorSync("Failed to load persons:", { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [personDatabase])

  // Автозагрузка при монтировании
  useEffect(() => {
    void loadPersons()
  }, [loadPersons])

  // Добавление новой персоны
  const addPerson = useCallback(
    async (personData: {
      name: string
      description?: string
      tags?: string[]
      thumbnailPath?: string
      detectedFaces?: DetectedFace[]
    }): Promise<PersonProfile> => {
      try {
        setError(null)
        const newPerson = await personDatabase.addPerson(personData)

        if (autoSave) {
          await loadPersons()
        }

        return newPerson
      } catch (err) {
        setError("Ошибка добавления персоны")
        logger.errorSync("Failed to add person:", { error: err })
        throw err
      }
    },
    [personDatabase, autoSave, loadPersons],
  )

  // Обновление персоны
  const updatePerson = useCallback(
    async (personId: string, updates: Partial<PersonProfile>): Promise<void> => {
      try {
        setError(null)
        await personDatabase.updatePerson(personId, updates)

        if (autoSave) {
          await loadPersons()
        }
      } catch (err) {
        setError("Ошибка обновления персоны")
        logger.errorSync("Failed to update person:", { error: err })
        throw err
      }
    },
    [personDatabase, autoSave, loadPersons],
  )

  // Удаление персоны
  const deletePerson = useCallback(
    async (personId: string): Promise<void> => {
      try {
        setError(null)
        await personDatabase.deletePerson(personId)

        if (autoSave) {
          await loadPersons()
        }
      } catch (err) {
        setError("Ошибка удаления персоны")
        logger.errorSync("Failed to delete person:", { error: err })
        throw err
      }
    },
    [personDatabase, autoSave, loadPersons],
  )

  // Поиск персон
  const searchPersons = useCallback(
    async (query: string, options?: { tags?: string[]; limit?: number }): Promise<PersonProfile[]> => {
      try {
        setError(null)
        return await personDatabase.searchPersons(query, options)
      } catch (err) {
        setError("Ошибка поиска персон")
        logger.errorSync("Failed to search persons:", { error: err })
        throw err
      }
    },
    [personDatabase],
  )

  // Обнаружение лиц на изображении/видео
  const detectFaces = useCallback(
    async (_mediaPath: string, _timerange?: { start: number; end: number }): Promise<DetectedFace[]> => {
      try {
        setError(null)
        // TODO: Implement face detection via SceneAnalysisEngine
        // Need to call analyzeScenes with enablePersonTracking option
        logger.warnSync("Face detection not yet implemented in SceneAnalysisEngine")
        return []
      } catch (err) {
        setError("Ошибка обнаружения лиц")
        logger.errorSync("Failed to detect faces", { error: err })
        throw err
      }
    },
    [],
  )

  // Идентификация персоны по лицу
  const identifyPerson = useCallback(
    async (detectedFace: DetectedFaceWithEmbedding): Promise<{ person: PersonProfile; confidence: number } | null> => {
      try {
        setError(null)

        // Проверяем наличие embedding
        if (!detectedFace.embedding || detectedFace.embedding.length === 0) {
          logger.warnSync("Нет embedding для лица, идентификация невозможна")
          return null
        }

        // Используем embedding напрямую
        const embedding = detectedFace.embedding

        // Находим наиболее похожую персону
        const results = await personDatabase.findSimilarPersons(embedding, {
          limit: 1,
          minConfidence: confidenceThreshold,
        })

        if (results.length > 0) {
          const result = results[0]
          return {
            person: result.person,
            confidence: result.similarity,
          }
        }

        return null
      } catch (err) {
        setError("Ошибка идентификации персоны")
        logger.errorSync("Failed to identify person:", { error: err })
        throw err
      }
    },
    [personDatabase, confidenceThreshold],
  )

  // Создание персоны из обнаруженного лица
  const createPersonFromFace = useCallback(
    async (
      detectedFace: DetectedFaceWithEmbedding,
      personData: {
        name: string
        description?: string
        tags?: string[]
      },
    ): Promise<PersonProfile> => {
      try {
        setError(null)

        // Создаем персону
        const newPerson = await addPerson({
          ...personData,
          detectedFaces: [detectedFace],
        })

        // Если есть embedding, добавляем его
        if (detectedFace.embedding && detectedFace.embedding.length > 0) {
          await personDatabase.addEmbedding(newPerson.id, {
            faceId: detectedFace.id,
            vector: detectedFace.embedding,
            quality: detectedFace.confidence,
            clipId: detectedFace.clipId,
            frameNumber: detectedFace.frameNumber ?? 0,
            timestamp: detectedFace.timestamp,
            createdAt: new Date().toISOString(),
          })
        }

        // Если есть thumbnail в detectedFace, добавляем его
        if (detectedFace.thumbnailUrl || detectedFace.croppedImage) {
          await personDatabase.addPersonThumbnail(newPerson.id, {
            imageUrl: detectedFace.thumbnailUrl,
            imageData: detectedFace.croppedImage,
            width: detectedFace.bbox.width,
            height: detectedFace.bbox.height,
            isPrimary: true,
            quality: detectedFace.confidence,
          })
        }

        return newPerson
      } catch (err) {
        setError("Ошибка создания персоны")
        logger.errorSync("Failed to create person from face:", { error: err })
        throw err
      }
    },
    [addPerson],
  )

  // Добавление лица к существующей персоне
  const addFaceToPerson = useCallback(
    async (personId: string, detectedFace: DetectedFaceWithEmbedding): Promise<void> => {
      try {
        setError(null)

        const person = persons.find((p) => p.id === personId)
        if (!person) {
          throw new Error("Персона не найдена")
        }

        // Добавляем embedding если есть
        if (detectedFace.embedding && detectedFace.embedding.length > 0) {
          await personDatabase.addEmbedding(personId, {
            faceId: detectedFace.id,
            vector: detectedFace.embedding,
            quality: detectedFace.confidence,
            clipId: detectedFace.clipId,
            frameNumber: detectedFace.frameNumber ?? 0,
            timestamp: detectedFace.timestamp,
            createdAt: new Date().toISOString(),
          })
        }

        // Добавляем появление
        await personDatabase.addAppearance(personId, {
          id: `appearance_${Date.now()}`,
          personId,
          clipId: detectedFace.clipId || "",
          startTime: detectedFace.timestamp,
          endTime: detectedFace.timestamp,
          duration: 0,
          confidence: detectedFace.confidence,
          minConfidence: detectedFace.confidence,
          maxConfidence: detectedFace.confidence,
          detections: [detectedFace],
          createdAt: new Date().toISOString(),
        })

        if (autoSave) {
          await loadPersons()
        }
      } catch (err) {
        setError("Ошибка добавления лица к персоне")
        logger.errorSync("Failed to add face to person:", { error: err })
        throw err
      }
    },
    [persons, personDatabase, autoSave, loadPersons],
  )

  // Анализ видео на наличие персон
  const analyzeVideoForPersons = useCallback(
    async (
      _videoPath: string,
      options?: {
        interval?: number // интервал анализа в секундах
        confidenceThreshold?: number
        onProgress?: (progress: number) => void
      },
    ): Promise<PersonAppearance[]> => {
      try {
        setError(null)
        const appearances: PersonAppearance[] = []

        // Здесь была бы логика анализа видео по кадрам
        // Пока возвращаем заглушку
        options?.onProgress?.(100)

        return appearances
      } catch (err) {
        setError("Ошибка анализа видео")
        logger.errorSync("Failed to analyze video:", { error: err })
        throw err
      }
    },
    [],
  )

  // Кластеризация неизвестных лиц
  const clusterUnknownFaces = useCallback(
    async (faces: DetectedFace[], similarityThreshold = 0.8): Promise<PersonProfile[]> => {
      try {
        setError(null)

        // Используем метод из базы данных для кластеризации
        const newPersons = await personDatabase.clusterUnidentifiedFaces(faces, similarityThreshold)

        // Перезагружаем список персон
        if (autoSave && newPersons.length > 0) {
          await loadPersons()
        }

        return newPersons
      } catch (err) {
        setError("Ошибка кластеризации лиц")
        logger.errorSync("Failed to cluster faces:", { error: err })
        throw err
      }
    },
    [personDatabase, autoSave, loadPersons],
  )

  // Получение статистики
  const getStatistics = useCallback(() => {
    return {
      totalPersons: persons.length,
      totalFaces: persons.reduce((sum, p) => sum + Number(p.faceEmbeddings?.length || 0), 0),
      totalAppearances: persons.reduce((sum, p) => sum + Number(p.appearances?.length || 0), 0),
      averageFacesPerPerson:
        persons.length > 0
          ? persons.reduce((sum, p) => sum + Number(p.faceEmbeddings?.length || 0), 0) / persons.length
          : 0,
    }
  }, [persons])

  return {
    // Состояние
    persons,
    isLoading,
    error,

    // Методы управления персонами
    addPerson,
    updatePerson,
    deletePerson,
    searchPersons,
    loadPersons,

    // Методы работы с лицами
    detectFaces,
    identifyPerson,
    createPersonFromFace,
    addFaceToPerson,

    // Анализ
    analyzeVideoForPersons,
    clusterUnknownFaces,

    // Статистика
    getStatistics,

    // Утилиты
    clearError: () => setError(null),
  }
}

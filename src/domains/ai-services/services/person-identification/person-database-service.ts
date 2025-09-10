/**
 * Person Database Service - Сервис для хранения и управления данными о персонах
 *
 * Обеспечивает CRUD операции, поиск по эмбеддингам, кластеризацию и синхронизацию.
 */

import { invoke } from "@tauri-apps/api/core"

import type {
  DetectedFace,
  FaceEmbedding,
  FaceMatch,
  PersonAppearance,
  PersonEvent,
  PersonProfile,
  PersonSearchResult,
  PersonStats,
  PersonThumbnail,
} from "../types/person"

// Расширенный тип для лица с embedding
interface DetectedFaceWithEmbedding extends DetectedFace {
  embedding?: Float32Array
  thumbnailUrl?: string
  croppedImage?: string
}

// База данных конфигурация
export interface DatabaseConfig {
  // Хранение
  storage: "indexeddb" | "memory" | "tauri"
  dbName: string
  version: number

  // Эмбеддинги
  embeddingDimension: number
  similarityThreshold: number

  // Кэширование
  enableCache: boolean
  cacheSize: number
  cacheTTL: number

  // Синхронизация
  enableSync: boolean
  syncInterval: number
}

// Результат поиска по сходству
export interface SimilaritySearchResult {
  personId: string
  similarity: number
  embedding: FaceEmbedding
  confidence: number
}

// Статистика базы данных
export interface DatabaseStats {
  totalPersons: number
  totalEmbeddings: number
  totalAppearances: number
  averageEmbeddingsPerPerson: number
  storageSize: number
  lastUpdated: string
}

/**
 * Person Database Service
 */
export class PersonDatabaseService {
  private static instance: PersonDatabaseService
  private config: DatabaseConfig
  private db: IDBDatabase | null = null
  private cache = new Map<string, PersonProfile>()
  private eventListeners: ((event: PersonEvent) => void)[] = []
  private isInitialized = false

  private defaultConfig: DatabaseConfig = {
    storage: "indexeddb",
    dbName: "timeline_studio_persons",
    version: 1,
    embeddingDimension: 512,
    similarityThreshold: 0.7,
    enableCache: true,
    cacheSize: 1000,
    cacheTTL: 30 * 60 * 1000, // 30 минут
    enableSync: false,
    syncInterval: 5 * 60 * 1000, // 5 минут
  }

  private constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(config: Partial<DatabaseConfig> = {}): PersonDatabaseService {
    if (!PersonDatabaseService.instance) {
      PersonDatabaseService.instance = new PersonDatabaseService(config)
    }
    return PersonDatabaseService.instance
  }

  /**
   * Инициализация базы данных
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      if (this.config.storage === "indexeddb") {
        await this.initializeIndexedDB()
      } else if (this.config.storage === "tauri") {
        await this.initializeTauriDB()
      }

      this.isInitialized = true
      console.log("Person Database Service инициализирован")
    } catch (error) {
      console.error("Ошибка инициализации Person Database Service:", error)
      throw error
    }
  }

  /**
   * Автоматическая инициализация базы данных при необходимости
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Инициализация IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version)

      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Таблица персон
        if (!db.objectStoreNames.contains("persons")) {
          const personStore = db.createObjectStore("persons", {
            keyPath: "id",
          })
          personStore.createIndex("name", "name", { unique: false })
          personStore.createIndex("isVerified", "isVerified", {
            unique: false,
          })
          personStore.createIndex("createdAt", "createdAt", { unique: false })
        }

        // Таблица эмбеддингов
        if (!db.objectStoreNames.contains("embeddings")) {
          const embeddingStore = db.createObjectStore("embeddings", {
            keyPath: "faceId",
          })
          embeddingStore.createIndex("personId", "personId", { unique: false })
          embeddingStore.createIndex("quality", "quality", { unique: false })
          embeddingStore.createIndex("timestamp", "timestamp", {
            unique: false,
          })
        }

        // Таблица появлений
        if (!db.objectStoreNames.contains("appearances")) {
          const appearanceStore = db.createObjectStore("appearances", {
            keyPath: "id",
          })
          appearanceStore.createIndex("personId", "personId", {
            unique: false,
          })
          appearanceStore.createIndex("clipId", "clipId", { unique: false })
          appearanceStore.createIndex("confidence", "confidence", {
            unique: false,
          })
        }

        // Таблица детекций
        if (!db.objectStoreNames.contains("detections")) {
          const detectionStore = db.createObjectStore("detections", {
            keyPath: "id",
          })
          detectionStore.createIndex("personId", "personId", { unique: false })
          detectionStore.createIndex("clipId", "clipId", { unique: false })
          detectionStore.createIndex("frameNumber", "frameNumber", {
            unique: false,
          })
        }
      }
    })
  }

  /**
   * Инициализация Tauri базы данных
   */
  private async initializeTauriDB(): Promise<void> {
    try {
      await invoke("init_person_database")
      console.log("Tauri база данных инициализирована")
    } catch (error) {
      console.error("Ошибка инициализации Tauri базы данных:", error)
      throw error
    }
  }

  /**
   * Создание нового профиля персоны
   */
  async createPerson(personData: Omit<PersonProfile, "id" | "createdAt" | "updatedAt">): Promise<PersonProfile> {
    await this.ensureInitialized()

    if (this.config.storage === "tauri") {
      const person = await invoke<PersonProfile>("create_person", {
        name: personData.name,
        tags: personData.tags,
        notes: (personData as any).description, // Используем notes вместо description
      })

      // Кэшируем
      if (this.config.enableCache) {
        this.cache.set(person.id, person)
      }

      this.emitEvent({ type: "person_created", data: { person } })
      return person
    }
    // Fallback to IndexedDB
    const person: PersonProfile = {
      ...personData,
      id: `person_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await this.storePerson(person)

    // Кэшируем
    if (this.config.enableCache) {
      this.cache.set(person.id, person)
    }

    this.emitEvent({ type: "person_created", data: { person } })
    return person
  }

  /**
   * Получение персоны по ID
   */
  async getPerson(personId: string): Promise<PersonProfile | null> {
    await this.ensureInitialized()

    // Проверяем кэш
    if (this.config.enableCache && this.cache.has(personId)) {
      return this.cache.get(personId)!
    }

    try {
      let person: PersonProfile | null = null

      if (this.config.storage === "tauri") {
        person = await invoke<PersonProfile | null>("get_person", { personId })
      } else {
        person = await this.loadPerson(personId)
      }

      // Кэшируем результат
      if (person && this.config.enableCache) {
        this.cache.set(personId, person)
      }

      return person
    } catch (error) {
      console.error(`Ошибка получения персоны ${personId}:`, error)
      return null
    }
  }

  /**
   * Обновление персоны
   */
  async updatePerson(personId: string, updates: Partial<PersonProfile>): Promise<PersonProfile | null> {
    await this.ensureInitialized()

    const existingPerson = await this.getPerson(personId)
    if (!existingPerson) return null

    const updatedPerson: PersonProfile = {
      ...existingPerson,
      ...updates,
      id: personId, // Нельзя изменить ID
      updatedAt: new Date().toISOString(),
    }

    await this.storePerson(updatedPerson)

    // Обновляем кэш
    if (this.config.enableCache) {
      this.cache.set(personId, updatedPerson)
    }

    this.emitEvent({
      type: "person_updated",
      data: { personId, changes: updates },
    })

    return updatedPerson
  }

  /**
   * Удаление персоны
   */
  async deletePerson(personId: string): Promise<boolean> {
    await this.ensureInitialized()

    try {
      if (this.config.storage === "tauri") {
        await invoke("delete_person", { personId })
      } else {
        // Удаляем связанные данные
        // Обрабатываем ошибки для каждой операции отдельно
        const deleteOperations = [
          this.deletePersonEmbeddings(personId).catch((err: unknown) =>
            console.warn(`Не удалось удалить эмбеддинги для ${personId}:`, err),
          ),
          this.deletePersonAppearances(personId).catch((err: unknown) =>
            console.warn(`Не удалось удалить появления для ${personId}:`, err),
          ),
          this.deletePersonDetections(personId).catch((err: unknown) =>
            console.warn(`Не удалось удалить детекции для ${personId}:`, err),
          ),
        ]

        await Promise.all(deleteOperations)

        // Удаляем саму персону
        await this.removePersonFromStore(personId)
      }

      // Удаляем из кэша
      this.cache.delete(personId)

      this.emitEvent({ type: "person_deleted", data: { personId } })
      return true
    } catch (error) {
      console.error(`Ошибка удаления персоны ${personId}:`, error)
      return false
    }
  }

  /**
   * Поиск персон по имени
   */
  async searchPersonsByName(query: string, limit = 10): Promise<PersonProfile[]> {
    await this.ensureInitialized()

    if (!query.trim()) return []

    try {
      return await this.searchPersonsInStore("name", query.toLowerCase(), limit)
    } catch (error) {
      console.error("Ошибка поиска персон по имени:", error)
      return []
    }
  }

  /**
   * Поиск персон по эмбеддингу лица
   */
  async searchPersonsByEmbedding(
    embedding: Float32Array,
    threshold = this.config.similarityThreshold,
    limit = 5,
  ): Promise<PersonSearchResult[]> {
    await this.ensureInitialized()

    try {
      if (this.config.storage === "tauri") {
        // Используем Tauri базу данных
        const searchResults = await invoke<SimilaritySearchResult[]>("search_similar_persons", {
          embedding: Array.from(embedding),
          topK: limit,
          useCosine: true,
        })

        // Получаем персон для каждого результата
        const results: PersonSearchResult[] = []
        for (const result of searchResults) {
          const person = await this.getPerson(result.personId)
          if (person) {
            // Создаем FaceMatch из данных результата поиска
            // Ищем подходящий thumbnail из профиля персоны
            const thumbnail =
              person.thumbnails.find(
                (t) =>
                  t.sourceClipId === result.embedding.clipId &&
                  Math.abs(t.sourceTimestamp.seconds - result.embedding.timestamp.seconds) < 1,
              )?.imageUrl || person.thumbnails.find((t) => t.isPrimary)?.imageUrl

            const match: FaceMatch = {
              faceId: result.embedding.faceId,
              personId: result.personId,
              similarity: result.similarity,
              confidence: result.confidence,
              clipId: result.embedding.clipId || "",
              timestamp: result.embedding.timestamp,
              thumbnail,
            }

            results.push({
              person,
              similarity: result.similarity,
              matches: [match],
            })
          }
        }
        return results
      }
      // Fallback to IndexedDB
      // Получаем все эмбеддинги
      const allEmbeddings = await this.getAllEmbeddings()

      // Вычисляем сходство
      const similarities: SimilaritySearchResult[] = []

      for (const storedEmbedding of allEmbeddings) {
        const similarity = this.calculateCosineSimilarity(embedding, storedEmbedding.vector)

        if (similarity >= threshold) {
          similarities.push({
            personId: storedEmbedding.faceId, // Будет заменено на personId
            similarity,
            embedding: storedEmbedding,
            confidence: storedEmbedding.quality * similarity,
          })
        }
      }

      // Сортируем по сходству
      similarities.sort((a, b) => b.similarity - a.similarity)

      // Получаем персон и создаем результаты
      const results: PersonSearchResult[] = []

      for (const sim of similarities.slice(0, limit)) {
        // Найдем персону по эмбеддингу
        const person = await this.findPersonByEmbedding(sim.embedding.faceId)
        if (person) {
          // Ищем подходящий thumbnail из профиля персоны
          const thumbnail =
            person.thumbnails.find(
              (t) =>
                t.sourceClipId === sim.embedding.clipId &&
                Math.abs(t.sourceTimestamp.seconds - sim.embedding.timestamp.seconds) < 1,
            )?.imageUrl || person.thumbnails.find((t) => t.isPrimary)?.imageUrl

          results.push({
            person,
            similarity: sim.similarity,
            matches: [
              {
                faceId: sim.embedding.faceId,
                personId: person.id,
                similarity: sim.similarity,
                confidence: sim.confidence,
                clipId: sim.embedding.clipId || "",
                timestamp: sim.embedding.timestamp,
                thumbnail,
              },
            ],
          })
        }
      }

      return results
    } catch (error) {
      console.error("Ошибка поиска по эмбеддингу:", error)
      return []
    }
  }

  /**
   * Добавление эмбеддинга к персоне
   */
  async addEmbedding(personId: string, embedding: FaceEmbedding): Promise<boolean> {
    await this.ensureInitialized()

    try {
      if (this.config.storage === "tauri") {
        await invoke("add_face_embedding", {
          personId,
          embedding: Array.from(embedding.vector),
          quality: embedding.quality,
          sourceClipId: embedding.clipId || "",
          frameNumber: embedding.frameNumber || 0,
          timestamp: embedding.timestamp,
        })
        return true
      }
      const person = await this.getPerson(personId)
      if (!person) return false

      // Сохраняем эмбеддинг
      await this.storeEmbedding(embedding)

      // Обновляем персону
      const updatedEmbeddings = [...person.faceEmbeddings, embedding]
      const averageEmbedding = this.calculateAverageEmbedding(updatedEmbeddings)

      await this.updatePerson(personId, {
        faceEmbeddings: updatedEmbeddings,
        averageEmbedding,
        updatedAt: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error("Ошибка добавления эмбеддинга:", error)
      return false
    }
  }

  /**
   * Добавление появления персоны
   */
  async addAppearance(personId: string, appearance: PersonAppearance): Promise<boolean> {
    await this.ensureInitialized()

    try {
      if (this.config.storage === "tauri") {
        await invoke("add_person_appearance", {
          personId,
          clipId: appearance.clipId,
          startTime: appearance.startTime,
          endTime: appearance.endTime,
          confidence: appearance.confidence,
          detectionCount: appearance.detections.length,
        })

        this.emitEvent({
          type: "person_detected",
          data: { personId, appearance },
        })

        return true
      }
      const person = await this.getPerson(personId)
      if (!person) return false

      // Сохраняем появление
      await this.storeAppearance(appearance)

      // Обновляем персону
      const updatedAppearances = [...person.appearances, appearance]
      const totalScreenTime = updatedAppearances.reduce((sum, app) => sum + app.duration, 0)

      await this.updatePerson(personId, {
        appearances: updatedAppearances,
        totalScreenTime,
        lastSeen: appearance.endTime,
        updatedAt: new Date().toISOString(),
      })

      this.emitEvent({
        type: "person_detected",
        data: { personId, appearance },
      })

      return true
    } catch (error) {
      console.error("Ошибка добавления появления:", error)
      return false
    }
  }

  /**
   * Получение статистики персоны
   */
  async getPersonStats(personId: string): Promise<PersonStats | null> {
    await this.ensureInitialized()

    try {
      const person = await this.getPerson(personId)
      if (!person) return null

      const appearances = person.appearances
      const confidences = appearances.map((a) => a.confidence)

      const stats: PersonStats = {
        personId,
        totalAppearances: appearances.length,
        totalScreenTime: person.totalScreenTime,
        averageAppearanceLength: appearances.length > 0 ? person.totalScreenTime / appearances.length : 0,
        clipsCount: new Set(appearances.map((a) => a.clipId)).size,
        clipIds: Array.from(new Set(appearances.map((a) => a.clipId))),
        averageConfidence: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
        bestConfidence: Math.max(...confidences),
        worstConfidence: Math.min(...confidences),
        firstAppearance: person.firstSeen,
        lastAppearance: person.lastSeen,
        emotionDistribution: this.calculateEmotionDistribution(appearances),
        screenTimePercentage: 0, // Будет вычислено относительно общего времени проекта
        appearanceFrequency: 0, // Будет вычислено относительно общего времени проекта
      }

      return stats
    } catch (error) {
      console.error("Ошибка получения статистики персоны:", error)
      return null
    }
  }

  /**
   * Получение всех персон
   */
  async getAllPersons(): Promise<PersonProfile[]> {
    await this.ensureInitialized()

    try {
      return await this.loadAllPersons()
    } catch (error) {
      console.error("Ошибка получения всех персон:", error)
      return []
    }
  }

  /**
   * Объединение персон
   */
  async mergePersons(targetPersonId: string, sourcePersonIds: string[]): Promise<boolean> {
    await this.ensureInitialized()

    try {
      const targetPerson = await this.getPerson(targetPersonId)
      if (!targetPerson) return false

      const sourcePersons = await Promise.all(sourcePersonIds.map((id) => this.getPerson(id)))

      // Объединяем данные
      const mergedEmbeddings: FaceEmbedding[] = [...targetPerson.faceEmbeddings]
      const mergedAppearances: PersonAppearance[] = [...targetPerson.appearances]
      const mergedThumbnails: PersonThumbnail[] = [...targetPerson.thumbnails]

      for (const sourcePerson of sourcePersons) {
        if (sourcePerson) {
          mergedEmbeddings.push(...sourcePerson.faceEmbeddings)
          mergedAppearances.push(...sourcePerson.appearances)
          mergedThumbnails.push(...sourcePerson.thumbnails)
        }
      }

      // Обновляем целевую персону
      await this.updatePerson(targetPersonId, {
        faceEmbeddings: mergedEmbeddings,
        appearances: mergedAppearances,
        thumbnails: mergedThumbnails,
        averageEmbedding: this.calculateAverageEmbedding(mergedEmbeddings),
        totalScreenTime: mergedAppearances.reduce((sum, app) => sum + app.duration, 0),
      })

      // Удаляем исходные персоны
      await Promise.all(sourcePersonIds.map((id) => this.deletePerson(id)))

      this.emitEvent({
        type: "person_merged",
        data: { targetPersonId, mergedPersonIds: sourcePersonIds },
      })

      return true
    } catch (error) {
      console.error("Ошибка объединения персон:", error)
      return false
    }
  }

  /**
   * Автоматическая кластеризация неопознанных лиц
   */
  async clusterUnidentifiedFaces(detections: DetectedFaceWithEmbedding[], threshold = 0.8): Promise<PersonProfile[]> {
    await this.ensureInitialized()

    try {
      // Группируем детекции по сходству эмбеддингов
      const clusters: DetectedFaceWithEmbedding[][] = []

      for (const detection of detections) {
        let addedToCluster = false

        for (const cluster of clusters) {
          const representative = cluster[0]
          // Здесь должен быть расчет сходства между detection и representative
          // Пока используем заглушку
          // Используем реальный расчет сходства
          const similarity =
            detection.embedding && representative.embedding
              ? this.calculateCosineSimilarity(
                  new Float32Array(detection.embedding),
                  new Float32Array(representative.embedding),
                )
              : 0

          if (similarity >= threshold) {
            cluster.push(detection)
            addedToCluster = true
            break
          }
        }

        if (!addedToCluster) {
          clusters.push([detection])
        }
      }

      // Создаем персон для кластеров
      const newPersons: PersonProfile[] = []

      for (const cluster of clusters) {
        if (cluster.length < 2) continue // Игнорируем одиночные детекции

        // Конвертируем DetectedFace в FaceEmbedding
        const faceEmbeddings: FaceEmbedding[] = cluster
          .filter(
            (face): face is DetectedFaceWithEmbedding => face.embedding !== undefined && face.embedding.length > 0,
          )
          .map((face) => ({
            faceId: face.id,
            personId: "", // Будет установлен после создания персоны
            vector: new Float32Array(face.embedding!),
            quality: face.confidence,
            clipId: face.clipId || "",
            frameNumber: face.frameNumber || 0,
            timestamp: face.timestamp,
            landmarks: face.landmarks,
            createdAt: new Date().toISOString(),
          }))

        // Вычисляем средний эмбеддинг если есть
        let averageEmbedding: Float32Array | undefined
        if (faceEmbeddings.length > 0) {
          averageEmbedding = this.calculateAverageEmbedding(faceEmbeddings)
        }

        const person = await this.createPerson({
          name: undefined,
          isVerified: false,
          faceEmbeddings,
          averageEmbedding,
          appearances: [],
          totalScreenTime: 0,
          firstSeen: cluster[0].timestamp,
          lastSeen: cluster[cluster.length - 1].timestamp,
          tags: ["auto_generated", "clustered"],
          thumbnails: [],
          privacy: {
            blurFace: false,
            hideFromSearch: false,
            anonymize: false,
            blurIntensity: 5,
            blurTracking: true,
          },
        })

        // Добавляем эмбеддинги и миниатюры после создания персоны
        if (this.config.storage === "tauri") {
          // Добавляем эмбеддинги в базу
          for (const face of cluster) {
            if (face.embedding && face.embedding.length > 0) {
              await this.addEmbedding(person.id, {
                faceId: face.id,
                personId: person.id,
                vector: new Float32Array(face.embedding),
                quality: face.confidence,
                clipId: face.clipId || "",
                frameNumber: face.frameNumber || 0,
                timestamp: face.timestamp,
                landmarks: face.landmarks,
                createdAt: new Date().toISOString(),
              })
            }

            // Добавляем первую миниатюру как основную
            if (newPersons.length === 0 && (face.thumbnailUrl || face.croppedImage)) {
              await this.addPersonThumbnail(person.id, {
                imageUrl: face.thumbnailUrl,
                imageData: face.croppedImage,
                width: face.bbox.width,
                height: face.bbox.height,
                isPrimary: true,
                quality: face.confidence,
              })
            }
          }
        }

        newPersons.push(person)
      }

      return newPersons
    } catch (error) {
      console.error("Ошибка кластеризации лиц:", error)
      return []
    }
  }

  /**
   * Получение статистики базы данных
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    await this.ensureInitialized()

    try {
      if (this.config.storage === "tauri") {
        return await invoke<DatabaseStats>("get_person_database_stats")
      }
      const persons = await this.getAllPersons()
      const totalEmbeddings = persons.reduce((sum, p) => sum + p.faceEmbeddings.length, 0)
      const totalAppearances = persons.reduce((sum, p) => sum + p.appearances.length, 0)

      return {
        totalPersons: persons.length,
        totalEmbeddings,
        totalAppearances,
        averageEmbeddingsPerPerson: persons.length > 0 ? totalEmbeddings / persons.length : 0,
        storageSize: 0,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Ошибка получения статистики базы данных:", error)
      return {
        totalPersons: 0,
        totalEmbeddings: 0,
        totalAppearances: 0,
        averageEmbeddingsPerPerson: 0,
        storageSize: 0,
        lastUpdated: new Date().toISOString(),
      }
    }
  }

  /**
   * События
   */
  addEventListener(listener: (event: PersonEvent) => void): void {
    this.eventListeners.push(listener)
  }

  removeEventListener(listener: (event: PersonEvent) => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  private emitEvent(event: PersonEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error("Ошибка в обработчике события персоны:", error)
      }
    })
  }

  /**
   * Вспомогательные методы для работы с IndexedDB
   */

  private async storePerson(person: PersonProfile): Promise<void> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["persons"], "readwrite")
      const store = transaction.objectStore("persons")
      const request = store.put(person)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async loadPerson(personId: string): Promise<PersonProfile | null> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["persons"], "readonly")
      const store = transaction.objectStore("persons")
      const request = store.get(personId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async loadAllPersons(): Promise<PersonProfile[]> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["persons"], "readonly")
      const store = transaction.objectStore("persons")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async removePersonFromStore(personId: string): Promise<void> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["persons"], "readwrite")
      const store = transaction.objectStore("persons")
      const request = store.delete(personId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async searchPersonsInStore(indexName: string, query: string, limit: number): Promise<PersonProfile[]> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["persons"], "readonly")
      const store = transaction.objectStore("persons")
      const index = store.index(indexName)
      const request = index.getAll()

      request.onsuccess = () => {
        const results = request.result
          .filter((person: PersonProfile) => person.name?.toLowerCase().includes(query))
          .slice(0, limit)
        resolve(results)
      }
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async storeEmbedding(embedding: FaceEmbedding): Promise<void> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["embeddings"], "readwrite")
      const store = transaction.objectStore("embeddings")
      const request = store.put(embedding)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async getAllEmbeddings(): Promise<FaceEmbedding[]> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["embeddings"], "readonly")
      const store = transaction.objectStore("embeddings")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async storeAppearance(appearance: PersonAppearance): Promise<void> {
    if (!this.db) throw new Error("База данных не инициализирована")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["appearances"], "readwrite")
      const store = transaction.objectStore("appearances")
      const request = store.put(appearance)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(request.error?.message || "Database error"))
    })
  }

  private async deletePersonEmbeddings(personId: string): Promise<void> {
    if (!this.db) {
      // База данных не инициализирована, просто возвращаемся
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(["embeddings"], "readwrite")
        const store = transaction.objectStore("embeddings")
        const index = store.index("personId")
        const request = index.openCursor(IDBKeyRange.only(personId))

        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(new Error(request.error?.message || "Database error"))
      } catch (error) {
        // Если таблица или индекс не существует, просто разрешаем промис
        console.warn(`Не удалось удалить эмбеддинги: ${String(error)}`)
        resolve()
      }
    })
  }

  private async deletePersonAppearances(personId: string): Promise<void> {
    if (!this.db) {
      // База данных не инициализирована, просто возвращаемся
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(["appearances"], "readwrite")
        const store = transaction.objectStore("appearances")
        const index = store.index("personId")
        const request = index.openCursor(IDBKeyRange.only(personId))

        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(new Error(request.error?.message || "Database error"))
      } catch (error) {
        // Если таблица или индекс не существует, просто разрешаем промис
        console.warn(`Не удалось удалить появления: ${String(error)}`)
        resolve()
      }
    })
  }

  private async deletePersonDetections(personId: string): Promise<void> {
    if (!this.db) {
      // База данных не инициализирована, просто возвращаемся
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(["detections"], "readwrite")
        const store = transaction.objectStore("detections")
        const index = store.index("personId")
        const request = index.openCursor(IDBKeyRange.only(personId))

        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(new Error(request.error?.message || "Database error"))
      } catch (error) {
        // Если таблица или индекс не существует, просто разрешаем промис
        console.warn(`Не удалось удалить детекции: ${String(error)}`)
        resolve()
      }
    })
  }

  private async findPersonByEmbedding(faceId: string): Promise<PersonProfile | null> {
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["embeddings", "persons"], "readonly")
      const embeddingStore = transaction.objectStore("embeddings")
      const personStore = transaction.objectStore("persons")

      const embeddingRequest = embeddingStore.get(faceId)

      embeddingRequest.onsuccess = () => {
        const embedding = embeddingRequest.result
        if (!embedding) {
          resolve(null)
          return
        }

        const personRequest = personStore.get(embedding.personId)
        personRequest.onsuccess = () => resolve(personRequest.result || null)
        personRequest.onerror = () => reject(new Error(personRequest.error?.message || "Database error"))
      }

      embeddingRequest.onerror = () => reject(new Error(embeddingRequest.error?.message || "Database error"))
    })
  }

  /**
   * Установка порога сходства
   */
  async setSimilarityThreshold(threshold: number): Promise<void> {
    if (this.config.storage === "tauri") {
      await invoke("set_similarity_threshold", { threshold })
    }
    this.config.similarityThreshold = threshold
  }

  /**
   * Добавление миниатюры персоны
   */
  async addPersonThumbnail(
    personId: string,
    thumbnailData: {
      imageUrl?: string
      imageData?: string // base64
      width: number
      height: number
      isPrimary?: boolean
      quality?: number
    },
  ): Promise<boolean> {
    await this.ensureInitialized()

    try {
      if (this.config.storage === "tauri") {
        if (!thumbnailData.imageData) {
          // Конвертируем URL в base64 если нужно
          if (thumbnailData.imageUrl) {
            const response = await fetch(thumbnailData.imageUrl)
            const blob = await response.blob()
            const reader = new FileReader()
            const base64 = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            thumbnailData.imageData = base64.split(",")[1]
          } else {
            return false
          }
        }

        await invoke("add_person_thumbnail", {
          personId,
          imageDataBase64: thumbnailData.imageData,
          width: thumbnailData.width,
          height: thumbnailData.height,
          isPrimary: thumbnailData.isPrimary || false,
          quality: thumbnailData.quality || 1.0,
        })

        return true
      }
      // Fallback to IndexedDB implementation
      const person = await this.getPerson(personId)
      if (!person) return false

      const thumbnail: PersonThumbnail = {
        id: `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        imageUrl: thumbnailData.imageUrl || "",
        width: thumbnailData.width,
        height: thumbnailData.height,
        sourceClipId: "",
        sourceTimestamp: { seconds: 0 },
        quality: thumbnailData.quality || 1,
        isPrimary: thumbnailData.isPrimary || false,
        isGenerated: false,
      }

      const updatedThumbnails = [...person.thumbnails, thumbnail]
      await this.updatePerson(personId, {
        thumbnails: updatedThumbnails,
        updatedAt: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error("Ошибка добавления миниатюры:", error)
      return false
    }
  }

  /**
   * Добавление персоны (алиас для createPerson)
   */
  async addPerson(personData: {
    name: string
    description?: string
    tags?: string[]
    thumbnailPath?: string
    detectedFaces?: DetectedFace[]
  }): Promise<PersonProfile> {
    const thumbnails: PersonThumbnail[] = personData.thumbnailPath
      ? [
          {
            id: `thumb_${Date.now()}`,
            imageUrl: personData.thumbnailPath,
            width: 200,
            height: 200,
            sourceClipId: "",
            sourceTimestamp: { seconds: 0 },
            quality: 1,
            isPrimary: true,
            isGenerated: false,
          },
        ]
      : []

    const appearances: PersonAppearance[] = personData.detectedFaces
      ? personData.detectedFaces.map((face) => ({
          id: `appearance_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          personId: "", // Будет установлен после создания персоны
          clipId: face.clipId || "",
          startTime: face.timestamp,
          endTime: face.timestamp,
          duration: 0,
          confidence: face.confidence,
          minConfidence: face.confidence,
          maxConfidence: face.confidence,
          detections: [face],
          createdAt: new Date().toISOString(),
        }))
      : []

    const profile = await this.createPerson({
      name: personData.name,
      isVerified: false,
      faceEmbeddings: [],
      appearances,
      totalScreenTime: 0,
      firstSeen: { seconds: 0 },
      lastSeen: { seconds: 0 },
      tags: personData.tags || [],
      notes: personData.description,
      thumbnails,
      privacy: {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
        blurIntensity: 5,
        blurTracking: true,
      },
    })

    // Обновляем personId в appearances
    if (appearances.length > 0) {
      const updatedAppearances = appearances.map((app) => ({
        ...app,
        personId: profile.id,
      }))
      await this.updatePerson(profile.id, { appearances: updatedAppearances })
    }

    return profile
  }

  /**
   * Поиск персон по имени и тегам
   */
  async searchPersons(query: string, options?: { tags?: string[]; limit?: number }): Promise<PersonProfile[]> {
    await this.ensureInitialized()

    try {
      const allPersons = await this.getAllPersons()
      let results = allPersons

      // Фильтр по имени
      if (query) {
        const lowerQuery = query.toLowerCase()
        results = results.filter(
          (person) =>
            person.name?.toLowerCase().includes(lowerQuery) || person.notes?.toLowerCase().includes(lowerQuery),
        )
      }

      // Фильтр по тегам
      if (options?.tags && options.tags.length > 0) {
        results = results.filter((person) => options.tags!.some((tag) => person.tags.includes(tag)))
      }

      // Лимит результатов
      if (options?.limit) {
        results = results.slice(0, options.limit)
      }

      return results
    } catch (error) {
      console.error("Ошибка поиска персон:", error)
      return []
    }
  }

  /**
   * Поиск похожих персон по эмбеддингу
   */
  async findSimilarPersons(
    embedding: Float32Array | undefined,
    options?: { limit?: number; minConfidence?: number },
  ): Promise<PersonSearchResult[]> {
    if (!embedding) return []

    await this.ensureInitialized()

    try {
      const allPersons = await this.getAllPersons()
      const results: PersonSearchResult[] = []

      for (const person of allPersons) {
        if (!person.averageEmbedding && (!person.faceEmbeddings || person.faceEmbeddings.length === 0)) {
          continue
        }

        // Проверяем сходство со средним эмбеддингом
        let maxSimilarity = 0
        const matches: FaceMatch[] = []

        // Если есть средний эмбеддинг, проверяем его
        if (person.averageEmbedding) {
          maxSimilarity = this.calculateCosineSimilarity(embedding, person.averageEmbedding)
        }

        // Проверяем каждый эмбеддинг лица для более точных совпадений
        if (person.faceEmbeddings && person.faceEmbeddings.length > 0) {
          for (const faceEmbedding of person.faceEmbeddings) {
            const faceSimilarity = this.calculateCosineSimilarity(embedding, faceEmbedding.vector)

            if (faceSimilarity >= (options?.minConfidence || this.config.similarityThreshold)) {
              // Ищем подходящий thumbnail для этого совпадения
              const thumbnail =
                person.thumbnails.find(
                  (t) =>
                    t.sourceClipId === faceEmbedding.clipId &&
                    Math.abs(t.sourceTimestamp.seconds - faceEmbedding.timestamp.seconds) < 1,
                )?.imageUrl || person.thumbnails.find((t) => t.isPrimary)?.imageUrl

              matches.push({
                faceId: faceEmbedding.faceId,
                personId: person.id,
                similarity: faceSimilarity,
                confidence: faceSimilarity * faceEmbedding.quality,
                clipId: faceEmbedding.clipId ?? "",
                timestamp: faceEmbedding.timestamp,
                thumbnail,
              })

              // Обновляем максимальное сходство
              if (faceSimilarity > maxSimilarity) {
                maxSimilarity = faceSimilarity
              }
            }
          }
        }

        // Добавляем в результаты если есть хотя бы одно совпадение или высокое среднее сходство
        if (maxSimilarity >= (options?.minConfidence || this.config.similarityThreshold) || matches.length > 0) {
          // Сортируем совпадения по убыванию сходства
          matches.sort((a, b) => b.similarity - a.similarity)

          results.push({
            person,
            similarity: maxSimilarity,
            matches: matches.slice(0, 5), // Ограничиваем количество совпадений
          })
        }
      }

      // Сортируем по убыванию сходства
      results.sort((a, b) => b.similarity - a.similarity)

      // Ограничиваем количество результатов
      if (options?.limit) {
        return results.slice(0, options.limit)
      }

      return results
    } catch (error) {
      console.error("Ошибка поиска похожих персон:", error)
      return []
    }
  }

  /**
   * Математические вспомогательные функции
   */

  private calculateCosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
    return magnitude > 0 ? dotProduct / magnitude : 0
  }

  private calculateAverageEmbedding(embeddings: FaceEmbedding[]): Float32Array | undefined {
    if (embeddings.length === 0) return undefined

    const dimension = embeddings[0].vector.length
    const average = new Float32Array(dimension)

    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        average[i] += embedding.vector[i]
      }
    }

    for (let i = 0; i < dimension; i++) {
      average[i] /= embeddings.length
    }

    return average
  }

  private calculateEmotionDistribution(appearances: PersonAppearance[]): Record<string, number> {
    const distribution: Record<string, number> = {}

    for (const appearance of appearances) {
      for (const detection of appearance.detections) {
        if (detection.emotion) {
          distribution[detection.emotion] = (distribution[detection.emotion] || 0) + 1
        }
      }
    }

    return distribution
  }

  /**
   * Очистка ресурсов
   */
  async cleanup(): Promise<void> {
    this.cache.clear()
    this.eventListeners.length = 0

    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.isInitialized = false
  }
}

export default PersonDatabaseService

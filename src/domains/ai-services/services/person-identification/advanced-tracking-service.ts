/**
 * Advanced Tracking Service
 * Сервис для продвинутого трекинга персон с использованием DeepSORT и Kalman фильтров
 */

import { invoke } from "@tauri-apps/api/core"

import type { DetectedFace, PersonAppearance } from "../types/person"

// Трекинг конфигурация
export interface TrackingConfig {
  // Алгоритм трекинга
  algorithm: "deepsort" | "sort" | "iou" | "kalman"

  // Параметры трекинга
  maxAge: number // Максимальное количество кадров без детекции
  minHits: number // Минимальное количество детекций для подтверждения трека
  iouThreshold: number // IoU порог для сопоставления

  // DeepSORT параметры
  useAppearanceFeatures: boolean
  appearanceThreshold: number

  // Kalman фильтр параметры
  useKalmanFilter: boolean
  processNoise: number
  measurementNoise: number

  // Производительность
  maxTracks: number
  skipFrames: number
}

// Состояние трека
export interface TrackState {
  id: string
  personId?: string
  state: "tentative" | "confirmed" | "deleted"
  age: number // Количество кадров с момента создания
  hits: number // Количество успешных детекций
  timeSinceUpdate: number // Кадров с последнего обновления
  startFrame: number
  endFrame: number
  confidence: number
}

// Трекируемая персона
export interface TrackedPerson {
  trackId: string
  personId?: string
  currentBox: BoundingBox
  predictedBox?: BoundingBox // Предсказанная позиция
  state: TrackState
  features?: Float32Array // Appearance features для DeepSORT
  trajectory: TrajectoryPoint[]
  velocity?: { x: number; y: number }
  acceleration?: { x: number; y: number }
}

// Точка траектории
export interface TrajectoryPoint {
  frameNumber: number
  timestamp: number
  box: BoundingBox
  confidence: number
  isInterpolated?: boolean
}

// Bounding box
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// Результат трекинга для кадра
export interface FrameTrackingResult {
  frameNumber: number
  timestamp: number
  tracks: TrackedPerson[]
  newTracks: string[] // ID новых треков
  deletedTracks: string[] // ID удаленных треков
  statistics: TrackingStatistics
}

// Статистика трекинга
export interface TrackingStatistics {
  totalTracks: number
  activeTracks: number
  confirmedTracks: number
  tentativeTracks: number
  deletedTracks: number
  averageTrackAge: number
  averageConfidence: number
  processingTime: number
}

// События трекинга
export type TrackingEvent =
  | { type: "track_created"; trackId: string; box: BoundingBox }
  | { type: "track_updated"; trackId: string; box: BoundingBox }
  | { type: "track_confirmed"; trackId: string }
  | { type: "track_deleted"; trackId: string; lastBox: BoundingBox }
  | { type: "person_identified"; trackId: string; personId: string }
  | { type: "track_merged"; sourceTrackId: string; targetTrackId: string }

/**
 * Advanced Tracking Service
 */
export class AdvancedTrackingService {
  private static instance: AdvancedTrackingService
  private config: TrackingConfig
  private isInitialized = false
  private isTracking = false
  private tracks = new Map<string, TrackedPerson>()
  private frameNumber = 0
  private eventListeners: ((event: TrackingEvent) => void)[] = []

  private defaultConfig: TrackingConfig = {
    algorithm: "deepsort",
    maxAge: 30,
    minHits: 3,
    iouThreshold: 0.3,
    useAppearanceFeatures: true,
    appearanceThreshold: 0.6,
    useKalmanFilter: true,
    processNoise: 0.03,
    measurementNoise: 0.1,
    maxTracks: 50,
    skipFrames: 0,
  }

  private constructor(config: Partial<TrackingConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(config: Partial<TrackingConfig> = {}): AdvancedTrackingService {
    if (!AdvancedTrackingService.instance) {
      AdvancedTrackingService.instance = new AdvancedTrackingService(config)
    }
    return AdvancedTrackingService.instance
  }

  /**
   * Инициализация сервиса
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await invoke("init_advanced_tracking", {
        config: this.config,
      })

      this.isInitialized = true
      console.log("Advanced Tracking Service инициализирован")
    } catch (error) {
      console.error("Ошибка инициализации Advanced Tracking Service:", error)
      throw error
    }
  }

  /**
   * Начать трекинг для видео
   */
  async startTracking(videoId: string): Promise<void> {
    await this.ensureInitialized()

    if (this.isTracking) {
      throw new Error("Трекинг уже запущен")
    }

    try {
      await invoke("start_person_tracking", {
        videoId,
        config: this.config,
      })

      this.isTracking = true
      this.frameNumber = 0
      this.tracks.clear()

      console.log(`Трекинг запущен для видео ${videoId}`)
    } catch (error) {
      console.error("Ошибка запуска трекинга:", error)
      throw error
    }
  }

  /**
   * Обработать кадр с детекциями
   */
  async processFrame(
    detections: DetectedFace[],
    frameNumber: number,
    timestamp: number,
    frameImage?: string | ArrayBuffer,
  ): Promise<FrameTrackingResult> {
    await this.ensureInitialized()

    if (!this.isTracking) {
      throw new Error("Трекинг не запущен")
    }

    this.frameNumber = frameNumber

    try {
      // Подготавливаем данные для backend
      const detectionData = detections.map((face) => ({
        id: face.id,
        bbox: face.bbox,
        confidence: face.confidence,
        embedding: face.embedding ? Array.from(face.embedding) : undefined,
      }))

      // Отправляем на обработку
      const result = await invoke<{
        tracks: any[]
        newTracks: string[]
        deletedTracks: string[]
        statistics: TrackingStatistics
      }>("process_tracking_frame", {
        detections: detectionData,
        frameNumber,
        timestamp,
        frameImage: frameImage ? this.imageToBase64(frameImage) : undefined,
      })

      // Обновляем локальное состояние треков
      const trackedPersons: TrackedPerson[] = []

      for (const trackData of result.tracks) {
        const track = this.updateOrCreateTrack(trackData, frameNumber, timestamp)
        trackedPersons.push(track)
      }

      // Обрабатываем удаленные треки
      for (const trackId of result.deletedTracks) {
        const track = this.tracks.get(trackId)
        if (track) {
          this.emitEvent({
            type: "track_deleted",
            trackId,
            lastBox: track.currentBox,
          })
          this.tracks.delete(trackId)
        }
      }

      // Обрабатываем новые треки
      for (const trackId of result.newTracks) {
        this.emitEvent({
          type: "track_created",
          trackId,
          box: this.tracks.get(trackId)!.currentBox,
        })
      }

      return {
        frameNumber,
        timestamp,
        tracks: trackedPersons,
        newTracks: result.newTracks,
        deletedTracks: result.deletedTracks,
        statistics: result.statistics,
      }
    } catch (error) {
      console.error("Ошибка обработки кадра:", error)
      throw error
    }
  }

  /**
   * Предсказать позиции треков на следующий кадр
   */
  async predictNextPositions(): Promise<Map<string, BoundingBox>> {
    await this.ensureInitialized()

    const predictions = new Map<string, BoundingBox>()

    try {
      const trackIds = Array.from(this.tracks.keys())
      const predictedBoxes = await invoke<Array<{ trackId: string; box: BoundingBox }>>("predict_track_positions", {
        trackIds,
      })

      for (const { trackId, box } of predictedBoxes) {
        predictions.set(trackId, box)

        // Обновляем предсказанную позицию в треке
        const track = this.tracks.get(trackId)
        if (track) {
          track.predictedBox = box
        }
      }
    } catch (error) {
      console.error("Ошибка предсказания позиций:", error)

      // Fallback: простая линейная экстраполяция
      for (const [trackId, track] of this.tracks) {
        if (track.velocity) {
          predictions.set(trackId, {
            x: track.currentBox.x + track.velocity.x,
            y: track.currentBox.y + track.velocity.y,
            width: track.currentBox.width,
            height: track.currentBox.height,
          })
        }
      }
    }

    return predictions
  }

  /**
   * Связать трек с персоной
   */
  async assignPersonToTrack(trackId: string, personId: string): Promise<void> {
    await this.ensureInitialized()

    const track = this.tracks.get(trackId)
    if (!track) {
      throw new Error(`Трек ${trackId} не найден`)
    }

    try {
      await invoke("assign_person_to_track", { trackId, personId })

      track.personId = personId
      this.emitEvent({
        type: "person_identified",
        trackId,
        personId,
      })
    } catch (error) {
      console.error("Ошибка назначения персоны треку:", error)
      throw error
    }
  }

  /**
   * Объединить два трека
   */
  async mergeTracks(sourceTrackId: string, targetTrackId: string): Promise<void> {
    await this.ensureInitialized()

    const sourceTrack = this.tracks.get(sourceTrackId)
    const targetTrack = this.tracks.get(targetTrackId)

    if (!sourceTrack || !targetTrack) {
      throw new Error("Один из треков не найден")
    }

    try {
      await invoke("merge_tracks", { sourceTrackId, targetTrackId })

      // Объединяем траектории
      targetTrack.trajectory.push(...sourceTrack.trajectory)
      targetTrack.trajectory.sort((a, b) => a.frameNumber - b.frameNumber)

      // Обновляем статистику
      targetTrack.state.hits += sourceTrack.state.hits
      targetTrack.state.age = Math.max(targetTrack.state.age, sourceTrack.state.age)

      // Удаляем исходный трек
      this.tracks.delete(sourceTrackId)

      this.emitEvent({
        type: "track_merged",
        sourceTrackId,
        targetTrackId,
      })
    } catch (error) {
      console.error("Ошибка объединения треков:", error)
      throw error
    }
  }

  /**
   * Получить трек по ID
   */
  getTrack(trackId: string): TrackedPerson | undefined {
    return this.tracks.get(trackId)
  }

  /**
   * Получить все активные треки
   */
  getActiveTracks(): TrackedPerson[] {
    return Array.from(this.tracks.values()).filter((track) => track.state.state !== "deleted")
  }

  /**
   * Получить треки для персоны
   */
  getTracksForPerson(personId: string): TrackedPerson[] {
    return Array.from(this.tracks.values()).filter((track) => track.personId === personId)
  }

  /**
   * Интерполировать пропущенные позиции
   */
  async interpolateMissingPositions(trackId: string, startFrame: number, endFrame: number): Promise<TrajectoryPoint[]> {
    await this.ensureInitialized()

    const track = this.tracks.get(trackId)
    if (!track) {
      throw new Error(`Трек ${trackId} не найден`)
    }

    try {
      const interpolated = await invoke<TrajectoryPoint[]>("interpolate_track_positions", {
        trackId,
        startFrame,
        endFrame,
      })

      // Добавляем интерполированные точки в траекторию
      for (const point of interpolated) {
        point.isInterpolated = true

        // Вставляем в правильное место в траектории
        const insertIndex = track.trajectory.findIndex((p) => p.frameNumber > point.frameNumber)

        if (insertIndex === -1) {
          track.trajectory.push(point)
        } else {
          track.trajectory.splice(insertIndex, 0, point)
        }
      }

      return interpolated
    } catch (error) {
      console.error("Ошибка интерполяции позиций:", error)
      return []
    }
  }

  /**
   * Экспортировать треки в формате для Timeline
   */
  async exportTracksAsAppearances(): Promise<PersonAppearance[]> {
    const appearances: PersonAppearance[] = []

    for (const track of this.tracks.values()) {
      if (!track.personId || track.trajectory.length === 0) continue

      const firstPoint = track.trajectory[0]
      const lastPoint = track.trajectory[track.trajectory.length - 1]

      const appearance: PersonAppearance = {
        id: `appearance_${track.trackId}`,
        personId: track.personId,
        clipId: "", // Должен быть установлен вызывающим кодом
        startTime: { seconds: firstPoint.timestamp },
        endTime: { seconds: lastPoint.timestamp },
        duration: lastPoint.timestamp - firstPoint.timestamp,
        confidence: track.state.confidence,
        minConfidence: Math.min(...track.trajectory.map((p) => p.confidence)),
        maxConfidence: Math.max(...track.trajectory.map((p) => p.confidence)),
        detections: track.trajectory.map(
          (point) =>
            ({
              id: `det_${track.trackId}_${point.frameNumber}`,
              personId: track.personId,
              confidence: point.confidence,
              bbox: point.box,
              timestamp: { seconds: point.timestamp },
              frameNumber: point.frameNumber,
            }) as DetectedFace,
        ),
        createdAt: new Date().toISOString(),
      }

      appearances.push(appearance)
    }

    return appearances
  }

  /**
   * Остановить трекинг
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) return

    try {
      await invoke("stop_person_tracking")

      this.isTracking = false

      // Сохраняем финальное состояние треков
      const finalTracks = this.getActiveTracks()
      console.log(`Трекинг остановлен. Финальных треков: ${finalTracks.length}`)

      // Очищаем треки только после сохранения
      // this.tracks.clear() // Не очищаем сразу, чтобы можно было экспортировать
    } catch (error) {
      console.error("Ошибка остановки трекинга:", error)
      throw error
    }
  }

  /**
   * Обновить конфигурацию
   */
  async updateConfig(config: Partial<TrackingConfig>): Promise<void> {
    this.config = { ...this.config, ...config }

    if (this.isInitialized) {
      await invoke("update_tracking_config", {
        config: this.config,
      })
    }
  }

  /**
   * События
   */
  addEventListener(listener: (event: TrackingEvent) => void): void {
    this.eventListeners.push(listener)
  }

  removeEventListener(listener: (event: TrackingEvent) => void): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  private emitEvent(event: TrackingEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error("Ошибка в обработчике события трекинга:", error)
      }
    })
  }

  /**
   * Вспомогательные методы
   */

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private updateOrCreateTrack(trackData: any, frameNumber: number, timestamp: number): TrackedPerson {
    let track = this.tracks.get(trackData.id)

    if (!track) {
      // Создаем новый трек
      track = {
        trackId: trackData.id,
        personId: trackData.personId,
        currentBox: trackData.box,
        state: {
          id: trackData.id,
          personId: trackData.personId,
          state: trackData.state || "tentative",
          age: 0,
          hits: 1,
          timeSinceUpdate: 0,
          startFrame: frameNumber,
          endFrame: frameNumber,
          confidence: trackData.confidence || 0,
        },
        trajectory: [],
        features: trackData.features ? new Float32Array(trackData.features) : undefined,
      }
      this.tracks.set(trackData.id, track)
    } else {
      // Обновляем существующий трек
      track.currentBox = trackData.box
      track.state.age++
      track.state.hits++
      track.state.timeSinceUpdate = 0
      track.state.endFrame = frameNumber
      track.state.confidence = trackData.confidence || track.state.confidence

      if (trackData.features) {
        track.features = new Float32Array(trackData.features)
      }

      // Обновляем состояние
      if (trackData.state) {
        track.state.state = trackData.state
      } else if (track.state.hits >= this.config.minHits && track.state.state === "tentative") {
        track.state.state = "confirmed"
        this.emitEvent({
          type: "track_confirmed",
          trackId: track.trackId,
        })
      }
    }

    // Добавляем точку в траекторию
    track.trajectory.push({
      frameNumber,
      timestamp,
      box: track.currentBox,
      confidence: track.state.confidence,
    })

    // Вычисляем скорость и ускорение
    if (track.trajectory.length >= 2) {
      const prev = track.trajectory[track.trajectory.length - 2]
      const curr = track.trajectory[track.trajectory.length - 1]
      const dt = curr.timestamp - prev.timestamp

      if (dt > 0) {
        const vx = (curr.box.x - prev.box.x) / dt
        const vy = (curr.box.y - prev.box.y) / dt

        if (track.velocity) {
          const ax = (vx - track.velocity.x) / dt
          const ay = (vy - track.velocity.y) / dt
          track.acceleration = { x: ax, y: ay }
        }

        track.velocity = { x: vx, y: vy }
      }
    }

    // Обновляем событие
    this.emitEvent({
      type: "track_updated",
      trackId: track.trackId,
      box: track.currentBox,
    })

    return track
  }

  private imageToBase64(image: string | ArrayBuffer): string {
    if (typeof image === "string") {
      return image
    }
    return btoa(String.fromCharCode(...new Uint8Array(image)))
  }

  /**
   * Очистка ресурсов
   */
  async cleanup(): Promise<void> {
    if (this.isTracking) {
      await this.stopTracking()
    }

    this.tracks.clear()
    this.eventListeners.length = 0

    if (this.isInitialized) {
      await invoke("cleanup_tracking")
      this.isInitialized = false
    }
  }
}

export default AdvancedTrackingService

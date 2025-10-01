/**
 * Object Tracking Service
 * Трекинг объектов между кадрами для анализа движения и поведения
 */

import type { BoundingBox, ObjectDetection } from "../../types/interfaces"

// Типы для трекинга объектов
export interface TrackedObject {
  id: string // Уникальный ID трека
  objectId: string // ID объекта из детекции
  label: string
  confidence: number
  trajectory: TrajectoryPoint[]
  startFrame: number
  endFrame: number
  isActive: boolean
  metadata: ObjectTrackingMetadata
}

export interface TrajectoryPoint {
  frameNumber: number
  timestamp: number
  boundingBox: BoundingBox
  confidence: number
  velocity?: Vector2D
  acceleration?: Vector2D
}

export interface Vector2D {
  x: number
  y: number
  magnitude: number
  angle: number // в радианах
}

export interface ObjectTrackingMetadata {
  totalFrames: number
  averageConfidence: number
  maxConfidence: number
  minConfidence: number
  averageSize: number // средний размер объекта
  sizeVariation: number // вариация размера (0-1)
  movementType: MovementType
  movementPattern: MovementPattern
  interactions: ObjectInteraction[]
}

export enum MovementType {
  STATIC = "static", // объект не движется
  LINEAR = "linear", // прямолинейное движение
  CURVED = "curved", // криволинейное движение
  OSCILLATING = "oscillating", // колебательное движение
  CHAOTIC = "chaotic", // хаотичное движение
  APPEARING = "appearing", // объект появляется
  DISAPPEARING = "disappearing", // объект исчезает
}

export enum MovementPattern {
  STATIONARY = "stationary",
  LEFT_TO_RIGHT = "left_to_right",
  RIGHT_TO_LEFT = "right_to_left",
  TOP_TO_BOTTOM = "top_to_bottom",
  BOTTOM_TO_TOP = "bottom_to_top",
  CIRCULAR = "circular",
  ZIGZAG = "zigzag",
  RANDOM = "random",
}

export interface ObjectInteraction {
  otherObjectId: string
  interactionType: InteractionType
  startFrame: number
  endFrame: number
  confidence: number
  description?: string
}

export enum InteractionType {
  COLLISION = "collision", // столкновение
  APPROACH = "approach", // приближение
  FOLLOW = "follow", // следование
  OVERTAKE = "overtake", // обгон
  MERGE = "merge", // слияние
  SPLIT = "split", // разделение
  OCCLUSION = "occlusion", // перекрытие
}

export interface ObjectTrackingConfig {
  // Параметры сопоставления объектов
  matching: {
    maxDistanceThreshold: number // Максимальное расстояние для сопоставления (пиксели)
    minOverlapThreshold: number // Минимальное перекрытие bounding box (0-1)
    confidenceWeight: number // Вес уверенности при сопоставлении (0-1)
    sizeWeight: number // Вес размера при сопоставлении (0-1)
    positionWeight: number // Вес позиции при сопоставлении (0-1)
  }

  // Параметры трекинга
  tracking: {
    maxMissedFrames: number // Максимальное количество пропущенных кадров
    minTrackLength: number // Минимальная длина трека (кадры)
    velocitySmoothing: number // Сглаживание скорости (0-1)
    positionPrediction: boolean // Предсказание позиции
  }

  // Параметры анализа движения
  movement: {
    enableVelocityCalculation: boolean
    enableAccelerationCalculation: boolean
    movementThreshold: number // Минимальное движение для детекции (пиксели)
    stabilizationFrames: number // Кадры для стабилизации движения
  }

  // Параметры взаимодействий
  interactions: {
    enableInteractionDetection: boolean
    collisionDistanceThreshold: number // Расстояние для детекции столкновений
    approachDistanceThreshold: number // Расстояние для детекции приближения
    followDistanceThreshold: number // Расстояние для детекции следования
  }

  // Фильтрация объектов
  filtering: {
    minConfidence: number // Минимальная уверенность (0-1)
    excludeLabels: string[] // Исключаемые категории объектов
    includeLabels?: string[] // Включать только эти категории (если указано)
    minObjectSize: number // Минимальный размер объекта (пиксели)
    maxObjectSize: number // Максимальный размер объекта (пиксели)
  }
}

export class ObjectTrackingService {
  private config: ObjectTrackingConfig
  private activeTracks = new Map<string, TrackedObject>()
  private completedTracks: TrackedObject[] = []
  private currentFrame = 0
  private frameWidth = 0
  private frameHeight = 0

  constructor(config?: Partial<ObjectTrackingConfig>) {
    this.config = {
      matching: {
        maxDistanceThreshold: 100,
        minOverlapThreshold: 0.3,
        confidenceWeight: 0.3,
        sizeWeight: 0.2,
        positionWeight: 0.5,
      },
      tracking: {
        maxMissedFrames: 5,
        minTrackLength: 3,
        velocitySmoothing: 0.7,
        positionPrediction: true,
      },
      movement: {
        enableVelocityCalculation: true,
        enableAccelerationCalculation: true,
        movementThreshold: 5,
        stabilizationFrames: 3,
      },
      interactions: {
        enableInteractionDetection: true,
        collisionDistanceThreshold: 30,
        approachDistanceThreshold: 100,
        followDistanceThreshold: 150,
      },
      filtering: {
        minConfidence: 0.3,
        excludeLabels: ["person"], // Персоны обрабатываются отдельно в Person Identification
        minObjectSize: 20,
        maxObjectSize: 100000, // 100k пикселей - достаточно для больших объектов
      },
      ...config,
    }
  }

  /**
   * Инициализация трекера с параметрами видео
   */
  initialize(width: number, height: number): void {
    this.frameWidth = width
    this.frameHeight = height
    this.currentFrame = 0
    this.activeTracks.clear()
    this.completedTracks = []
  }

  /**
   * Обработка кадра с детекциями объектов
   */
  processFrame(frameNumber: number, timestamp: number, detections: ObjectDetection[]): TrackedObject[] {
    this.currentFrame = frameNumber

    // Фильтруем детекции
    const filteredDetections = this.filterDetections(detections)

    if (filteredDetections.length === 0) {
      // Нет детекций - обрабатываем пропущенные кадры для всех активных треков
      for (const [trackId, track] of this.activeTracks.entries()) {
        this.handleMissedFrame(track, frameNumber, timestamp)
      }
      this.cleanupInactiveTracks()
      return Array.from(this.activeTracks.values())
    }

    // Собираем использованные детекции
    const usedDetections = new Set<string>()

    // Обновляем существующие треки
    for (const [trackId, track] of this.activeTracks.entries()) {
      const bestMatch = this.findBestMatch(track, filteredDetections, usedDetections)

      if (bestMatch) {
        // Обновляем трек с новой детекцией
        this.updateTrack(track, frameNumber, timestamp, bestMatch.detection)
        usedDetections.add(bestMatch.detection.id)
      } else {
        // Трек пропустил кадр
        this.handleMissedFrame(track, frameNumber, timestamp)
      }
    }

    // Создаем новые треки для неиспользованных детекций
    for (const detection of filteredDetections) {
      if (!usedDetections.has(detection.id)) {
        this.createNewTrack(frameNumber, timestamp, detection)
      }
    }

    // Удаляем неактивные треки
    this.cleanupInactiveTracks()

    // Анализируем взаимодействия
    if (this.config.interactions.enableInteractionDetection) {
      this.detectInteractions(frameNumber)
    }

    return Array.from(this.activeTracks.values())
  }

  /**
   * Получить все завершенные треки
   */
  getCompletedTracks(): TrackedObject[] {
    return this.completedTracks.slice()
  }

  /**
   * Получить активные треки
   */
  getActiveTracks(): TrackedObject[] {
    return Array.from(this.activeTracks.values())
  }

  /**
   * Получить статистику трекинга
   */
  getTrackingStatistics(): {
    totalTracks: number
    activeTracks: number
    completedTracks: number
    averageTrackLength: number
    longestTrack: number
    objectCategories: Map<string, number>
  } {
    const allTracks = [...this.completedTracks, ...this.activeTracks.values()]
    const trackLengths = allTracks.map((track) => track.trajectory.length)
    const categories = new Map<string, number>()

    allTracks.forEach((track) => {
      const count = categories.get(track.label) || 0
      categories.set(track.label, count + 1)
    })

    return {
      totalTracks: allTracks.length,
      activeTracks: this.activeTracks.size,
      completedTracks: this.completedTracks.length,
      averageTrackLength: trackLengths.reduce((a, b) => a + b, 0) / trackLengths.length || 0,
      longestTrack: Math.max(...trackLengths, 0),
      objectCategories: categories,
    }
  }

  /**
   * Фильтрация детекций согласно конфигурации
   */
  private filterDetections(detections: ObjectDetection[]): ObjectDetection[] {
    return detections.filter((detection) => {
      // Проверяем уверенность
      if (detection.confidence < this.config.filtering.minConfidence) {
        return false
      }

      // Проверяем исключаемые категории
      if (this.config.filtering.excludeLabels.includes(detection.label)) {
        return false
      }

      // Проверяем включаемые категории (если указаны)
      if (this.config.filtering.includeLabels && !this.config.filtering.includeLabels.includes(detection.label)) {
        return false
      }

      // Проверяем размер объекта
      const objectSize = this.calculateBoundingBoxArea(detection.boundingBox)
      if (objectSize < this.config.filtering.minObjectSize || objectSize > this.config.filtering.maxObjectSize) {
        return false
      }

      return true
    })
  }

  /**
   * Поиск лучшего соответствия для трека
   */
  private findBestMatch(
    track: TrackedObject,
    detections: ObjectDetection[],
    usedDetections: Set<string>,
  ): { detection: ObjectDetection; score: number } | null {
    const lastPoint = track.trajectory[track.trajectory.length - 1]
    let bestMatch: { detection: ObjectDetection; score: number } | null = null

    for (const detection of detections) {
      if (usedDetections.has(detection.id)) continue

      // Проверяем соответствие категории
      if (detection.label !== track.label) continue

      const score = this.calculateMatchingScore(lastPoint, detection)

      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { detection, score }
      }
    }

    return bestMatch
  }

  /**
   * Вычисление оценки соответствия между точкой трека и детекцией
   */
  private calculateMatchingScore(trackPoint: TrajectoryPoint, detection: ObjectDetection): number {
    const config = this.config.matching

    // Расстояние между центрами
    const distance = this.calculateDistance(
      this.getBoundingBoxCenter(trackPoint.boundingBox),
      this.getBoundingBoxCenter(detection.boundingBox),
    )

    if (distance > config.maxDistanceThreshold) {
      return 0 // Слишком далеко
    }

    // Нормализованное расстояние (0-1, где 0 = близко, 1 = далеко)
    const distanceScore = 1 - distance / config.maxDistanceThreshold

    // Перекрытие bounding box
    const overlap = this.calculateBoundingBoxOverlap(trackPoint.boundingBox, detection.boundingBox)

    if (overlap < config.minOverlapThreshold) {
      return 0 // Недостаточное перекрытие
    }

    // Разница в уверенности
    const confidenceDiff = Math.abs(trackPoint.confidence - detection.confidence)
    const confidenceScore = 1 - confidenceDiff

    // Разница в размере
    const trackSize = this.calculateBoundingBoxArea(trackPoint.boundingBox)
    const detectionSize = this.calculateBoundingBoxArea(detection.boundingBox)
    const sizeRatio = Math.min(trackSize, detectionSize) / Math.max(trackSize, detectionSize)

    // Комбинированная оценка
    const finalScore =
      distanceScore * config.positionWeight +
      overlap * 0.3 + // Вес перекрытия
      confidenceScore * config.confidenceWeight +
      sizeRatio * config.sizeWeight

    return Math.max(0, Math.min(1, finalScore))
  }

  /**
   * Обновление трека с новой детекцией
   */
  private updateTrack(track: TrackedObject, frameNumber: number, timestamp: number, detection: ObjectDetection): void {
    const newPoint: TrajectoryPoint = {
      frameNumber,
      timestamp,
      boundingBox: detection.boundingBox,
      confidence: detection.confidence,
    }

    // Вычисляем скорость и ускорение
    if (this.config.movement.enableVelocityCalculation && track.trajectory.length > 0) {
      const prevPoint = track.trajectory[track.trajectory.length - 1]
      newPoint.velocity = this.calculateVelocity(prevPoint, newPoint)

      // Для вычисления ускорения нужна предыдущая скорость
      if (this.config.movement.enableAccelerationCalculation && track.trajectory.length >= 1) {
        const prevVelocity = prevPoint.velocity
        if (prevVelocity && newPoint.velocity) {
          newPoint.acceleration = this.calculateAcceleration(prevVelocity, newPoint.velocity)
        }
      }
    }

    track.trajectory.push(newPoint)
    track.endFrame = frameNumber
    track.confidence = detection.confidence

    // Обновляем метаданные
    this.updateTrackMetadata(track)
  }

  /**
   * Создание нового трека
   */
  private createNewTrack(frameNumber: number, timestamp: number, detection: ObjectDetection): void {
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const newTrack: TrackedObject = {
      id: trackId,
      objectId: detection.id,
      label: detection.label,
      confidence: detection.confidence,
      trajectory: [
        {
          frameNumber,
          timestamp,
          boundingBox: detection.boundingBox,
          confidence: detection.confidence,
        },
      ],
      startFrame: frameNumber,
      endFrame: frameNumber,
      isActive: true,
      metadata: {
        totalFrames: 1,
        averageConfidence: detection.confidence,
        maxConfidence: detection.confidence,
        minConfidence: detection.confidence,
        averageSize: this.calculateBoundingBoxArea(detection.boundingBox),
        sizeVariation: 0,
        movementType: MovementType.STATIC,
        movementPattern: MovementPattern.STATIONARY,
        interactions: [],
      },
    }

    this.activeTracks.set(trackId, newTrack)
  }

  /**
   * Обработка пропущенного кадра
   */
  private handleMissedFrame(track: TrackedObject, frameNumber: number, timestamp: number): void {
    const framesSinceLastDetection = frameNumber - track.endFrame

    if (framesSinceLastDetection > this.config.tracking.maxMissedFrames) {
      // Трек неактивен слишком долго - завершаем его
      this.finishTrack(track)
    } else if (this.config.tracking.positionPrediction && track.trajectory.length >= 2) {
      // Предсказываем позицию на основе предыдущего движения
      this.addPredictedPoint(track, frameNumber, timestamp)
    }
  }

  /**
   * Добавление предсказанной точки
   */
  private addPredictedPoint(track: TrackedObject, frameNumber: number, timestamp: number): void {
    const lastPoint = track.trajectory[track.trajectory.length - 1]
    const prevPoint = track.trajectory[track.trajectory.length - 2]

    if (!lastPoint.velocity) return

    // Предсказываем позицию на основе скорости
    const deltaTime = timestamp - lastPoint.timestamp
    const predictedCenter = {
      x: this.getBoundingBoxCenter(lastPoint.boundingBox).x + lastPoint.velocity.x * deltaTime,
      y: this.getBoundingBoxCenter(lastPoint.boundingBox).y + lastPoint.velocity.y * deltaTime,
    }

    // Создаем предсказанный bounding box
    const width = lastPoint.boundingBox.width
    const height = lastPoint.boundingBox.height
    const predictedBoundingBox: BoundingBox = {
      x: predictedCenter.x - width / 2,
      y: predictedCenter.y - height / 2,
      width,
      height,
    }

    const predictedPoint: TrajectoryPoint = {
      frameNumber,
      timestamp,
      boundingBox: predictedBoundingBox,
      confidence: lastPoint.confidence * 0.8, // Снижаем уверенность для предсказанных точек
      velocity: lastPoint.velocity,
    }

    track.trajectory.push(predictedPoint)
    track.endFrame = frameNumber

    this.updateTrackMetadata(track)
  }

  /**
   * Завершение трека
   */
  private finishTrack(track: TrackedObject): void {
    track.isActive = false

    // Добавляем в завершенные треки только если он достаточно длинный
    if (track.trajectory.length >= this.config.tracking.minTrackLength) {
      this.completedTracks.push(track)
    }

    this.activeTracks.delete(track.id)
  }

  /**
   * Очистка неактивных треков
   */
  private cleanupInactiveTracks(): void {
    const tracksToRemove: string[] = []

    for (const [trackId, track] of this.activeTracks.entries()) {
      const framesSinceLastUpdate = this.currentFrame - track.endFrame

      if (framesSinceLastUpdate > this.config.tracking.maxMissedFrames) {
        this.finishTrack(track)
        // finishTrack уже удалил трек из activeTracks
      }
    }
  }

  /**
   * Обновление метаданных трека
   */
  private updateTrackMetadata(track: TrackedObject): void {
    const trajectory = track.trajectory
    const confidences = trajectory.map((p) => p.confidence)
    const sizes = trajectory.map((p) => this.calculateBoundingBoxArea(p.boundingBox))

    track.metadata = {
      totalFrames: trajectory.length,
      averageConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
      maxConfidence: Math.max(...confidences),
      minConfidence: Math.min(...confidences),
      averageSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      sizeVariation: this.calculateVariation(sizes),
      movementType: this.analyzeMovementType(trajectory),
      movementPattern: this.analyzeMovementPattern(trajectory),
      interactions: track.metadata.interactions,
    }
  }

  /**
   * Анализ типа движения
   */
  private analyzeMovementType(trajectory: TrajectoryPoint[]): MovementType {
    if (trajectory.length < 2) return MovementType.STATIC

    const movements = []
    for (let i = 1; i < trajectory.length; i++) {
      const distance = this.calculateDistance(
        this.getBoundingBoxCenter(trajectory[i - 1].boundingBox),
        this.getBoundingBoxCenter(trajectory[i].boundingBox),
      )
      movements.push(distance)
    }

    const totalMovement = movements.reduce((a, b) => a + b, 0)
    const avgMovement = totalMovement / movements.length

    if (avgMovement < this.config.movement.movementThreshold) {
      return MovementType.STATIC
    }

    // Анализируем изменения направления
    const directions = []
    for (let i = 2; i < trajectory.length; i++) {
      const prev = this.getBoundingBoxCenter(trajectory[i - 1].boundingBox)
      const curr = this.getBoundingBoxCenter(trajectory[i].boundingBox)
      const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x)
      directions.push(angle)
    }

    if (directions.length < 2) return MovementType.LINEAR

    const angleChanges = []
    for (let i = 1; i < directions.length; i++) {
      let angleDiff = Math.abs(directions[i] - directions[i - 1])
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff
      angleChanges.push(angleDiff)
    }

    const avgAngleChange = angleChanges.reduce((a, b) => a + b, 0) / angleChanges.length

    if (avgAngleChange < Math.PI / 8) return MovementType.LINEAR
    if (avgAngleChange < Math.PI / 4) return MovementType.CURVED
    if (this.detectOscillation(trajectory)) return MovementType.OSCILLATING

    return MovementType.CHAOTIC
  }

  /**
   * Анализ паттерна движения
   */
  private analyzeMovementPattern(trajectory: TrajectoryPoint[]): MovementPattern {
    if (trajectory.length < 2) return MovementPattern.STATIONARY

    const start = this.getBoundingBoxCenter(trajectory[0].boundingBox)
    const end = this.getBoundingBoxCenter(trajectory[trajectory.length - 1].boundingBox)

    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < this.config.movement.movementThreshold) {
      return MovementPattern.STATIONARY
    }

    // Определяем основное направление
    const angle = Math.atan2(deltaY, deltaX)
    const absAngle = Math.abs(angle)

    if (absAngle < Math.PI / 8 || absAngle > (7 * Math.PI) / 8) {
      return deltaX > 0 ? MovementPattern.LEFT_TO_RIGHT : MovementPattern.RIGHT_TO_LEFT
    }
    if (absAngle > (3 * Math.PI) / 8 && absAngle < (5 * Math.PI) / 8) {
      return deltaY > 0 ? MovementPattern.TOP_TO_BOTTOM : MovementPattern.BOTTOM_TO_TOP
    }

    // Проверяем на круговое движение
    if (this.detectCircularMovement(trajectory)) {
      return MovementPattern.CIRCULAR
    }

    // Проверяем на зигзагообразное движение
    if (this.detectZigzagMovement(trajectory)) {
      return MovementPattern.ZIGZAG
    }

    return MovementPattern.RANDOM
  }

  /**
   * Детекция взаимодействий между объектами
   */
  private detectInteractions(frameNumber: number): void {
    const activeTracks = Array.from(this.activeTracks.values())

    for (let i = 0; i < activeTracks.length; i++) {
      for (let j = i + 1; j < activeTracks.length; j++) {
        const track1 = activeTracks[i]
        const track2 = activeTracks[j]

        this.analyzeInteractionBetweenTracks(track1, track2, frameNumber)
      }
    }
  }

  /**
   * Анализ взаимодействия между двумя треками
   */
  private analyzeInteractionBetweenTracks(track1: TrackedObject, track2: TrackedObject, frameNumber: number): void {
    const point1 = track1.trajectory[track1.trajectory.length - 1]
    const point2 = track2.trajectory[track2.trajectory.length - 1]

    if (!point1 || !point2) return

    const distance = this.calculateDistance(
      this.getBoundingBoxCenter(point1.boundingBox),
      this.getBoundingBoxCenter(point2.boundingBox),
    )

    const config = this.config.interactions

    // Детекция столкновения
    if (distance < config.collisionDistanceThreshold) {
      this.addInteraction(track1, track2, InteractionType.COLLISION, frameNumber)
    }
    // Детекция приближения
    else if (distance < config.approachDistanceThreshold) {
      this.addInteraction(track1, track2, InteractionType.APPROACH, frameNumber)
    }
    // Детекция следования
    else if (distance < config.followDistanceThreshold && this.isFollowing(track1, track2)) {
      this.addInteraction(track1, track2, InteractionType.FOLLOW, frameNumber)
    }

    // Детекция перекрытия
    const overlap = this.calculateBoundingBoxOverlap(point1.boundingBox, point2.boundingBox)
    if (overlap > 0.1) {
      this.addInteraction(track1, track2, InteractionType.OCCLUSION, frameNumber)
    }
  }

  /**
   * Добавление взаимодействия
   */
  private addInteraction(
    track1: TrackedObject,
    track2: TrackedObject,
    type: InteractionType,
    frameNumber: number,
  ): void {
    // Проверяем, не существует ли уже такое взаимодействие
    const existingInteraction = track1.metadata.interactions.find(
      (interaction) =>
        interaction.otherObjectId === track2.id &&
        interaction.interactionType === type &&
        Math.abs(interaction.endFrame - frameNumber) < 5,
    )

    if (existingInteraction) {
      // Обновляем существующее взаимодействие
      existingInteraction.endFrame = frameNumber
    } else {
      // Создаем новое взаимодействие
      const interaction: ObjectInteraction = {
        otherObjectId: track2.id,
        interactionType: type,
        startFrame: frameNumber,
        endFrame: frameNumber,
        confidence: 0.8,
      }

      track1.metadata.interactions.push(interaction)

      // Добавляем симметричное взаимодействие для второго объекта
      const symmetricInteraction: ObjectInteraction = {
        otherObjectId: track1.id,
        interactionType: type,
        startFrame: frameNumber,
        endFrame: frameNumber,
        confidence: 0.8,
      }

      track2.metadata.interactions.push(symmetricInteraction)
    }
  }

  // Вспомогательные методы

  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getBoundingBoxCenter(bbox: BoundingBox): { x: number; y: number } {
    return {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    }
  }

  private calculateBoundingBoxArea(bbox: BoundingBox): number {
    return bbox.width * bbox.height
  }

  private calculateBoundingBoxOverlap(bbox1: BoundingBox, bbox2: BoundingBox): number {
    const x1 = Math.max(bbox1.x, bbox2.x)
    const y1 = Math.max(bbox1.y, bbox2.y)
    const x2 = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width)
    const y2 = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height)

    if (x1 >= x2 || y1 >= y2) return 0

    const intersectionArea = (x2 - x1) * (y2 - y1)
    const unionArea = this.calculateBoundingBoxArea(bbox1) + this.calculateBoundingBoxArea(bbox2) - intersectionArea

    return intersectionArea / unionArea
  }

  private calculateVelocity(point1: TrajectoryPoint, point2: TrajectoryPoint): Vector2D {
    const deltaTime = (point2.timestamp - point1.timestamp) / 1000 // в секундах
    if (deltaTime === 0) return { x: 0, y: 0, magnitude: 0, angle: 0 }

    const center1 = this.getBoundingBoxCenter(point1.boundingBox)
    const center2 = this.getBoundingBoxCenter(point2.boundingBox)

    const vx = (center2.x - center1.x) / deltaTime
    const vy = (center2.y - center1.y) / deltaTime
    const magnitude = Math.sqrt(vx * vx + vy * vy)
    const angle = Math.atan2(vy, vx)

    return { x: vx, y: vy, magnitude, angle }
  }

  private calculateAcceleration(velocity1: Vector2D, velocity2: Vector2D): Vector2D {
    const ax = velocity2.x - velocity1.x
    const ay = velocity2.y - velocity1.y
    const magnitude = Math.sqrt(ax * ax + ay * ay)
    const angle = Math.atan2(ay, ax)

    return { x: ax, y: ay, magnitude, angle }
  }

  private calculateVariation(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length
    const stdDev = Math.sqrt(variance)

    return mean > 0 ? stdDev / mean : 0
  }

  private detectOscillation(trajectory: TrajectoryPoint[]): boolean {
    if (trajectory.length < 6) return false

    const centers = trajectory.map((p) => this.getBoundingBoxCenter(p.boundingBox))
    let directionChanges = 0

    for (let i = 2; i < centers.length; i++) {
      const prev = centers[i - 2]
      const curr = centers[i - 1]
      const next = centers[i]

      const dir1 = { x: curr.x - prev.x, y: curr.y - prev.y }
      const dir2 = { x: next.x - curr.x, y: next.y - curr.y }

      // Проверяем изменение направления
      const dotProduct = dir1.x * dir2.x + dir1.y * dir2.y
      if (dotProduct < 0) directionChanges++
    }

    return directionChanges >= trajectory.length * 0.3
  }

  private detectCircularMovement(trajectory: TrajectoryPoint[]): boolean {
    if (trajectory.length < 8) return false

    const centers = trajectory.map((p) => this.getBoundingBoxCenter(p.boundingBox))

    // Вычисляем центр масс траектории
    const centroid = {
      x: centers.reduce((sum, p) => sum + p.x, 0) / centers.length,
      y: centers.reduce((sum, p) => sum + p.y, 0) / centers.length,
    }

    // Проверяем, насколько постоянны расстояния от центроида
    const distances = centers.map((p) => this.calculateDistance(p, centroid))
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
    const distanceVariation = this.calculateVariation(distances)

    // Для кругового движения расстояния должны быть относительно постоянными
    return distanceVariation < 0.3 && avgDistance > 20
  }

  private detectZigzagMovement(trajectory: TrajectoryPoint[]): boolean {
    if (trajectory.length < 4) return false

    const centers = trajectory.map((p) => this.getBoundingBoxCenter(p.boundingBox))
    let directionChanges = 0

    for (let i = 2; i < centers.length; i++) {
      const prev = centers[i - 2]
      const curr = centers[i - 1]
      const next = centers[i]

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x)
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x)

      let angleDiff = Math.abs(angle2 - angle1)
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff

      if (angleDiff > Math.PI / 4) directionChanges++
    }

    return directionChanges >= (centers.length - 2) * 0.5
  }

  private isFollowing(track1: TrackedObject, track2: TrackedObject): boolean {
    if (track1.trajectory.length < 3 || track2.trajectory.length < 3) return false

    // Проверяем, движутся ли объекты в похожем направлении
    const last1 = track1.trajectory[track1.trajectory.length - 1]
    const last2 = track2.trajectory[track2.trajectory.length - 1]

    if (!last1.velocity || !last2.velocity) return false

    // Вычисляем разность углов скоростей
    let angleDiff = Math.abs(last1.velocity.angle - last2.velocity.angle)
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff

    // Объекты следуют друг за другом, если движутся в похожем направлении
    return angleDiff < Math.PI / 6 // 30 градусов
  }
}

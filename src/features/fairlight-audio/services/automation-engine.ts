/**
 * Automation Engine
 * Система автоматизации параметров для Fairlight Audio
 */

export interface AutomationPoint {
  time: number // время в секундах
  value: number // значение параметра (0-1)
  curve?: "linear" | "hold" | "bezier"
}

export interface AutomationLane {
  id: string
  parameterId: string // например "volume", "pan", "eq.band1.gain"
  channelId: string
  points: AutomationPoint[]
  isEnabled: boolean
  isVisible: boolean
}

export type AutomationMode = "off" | "read" | "write" | "touch" | "latch" | "trim"

export interface AutomationState {
  mode: AutomationMode
  isRecording: boolean
  currentTime: number
  lanes: Map<string, AutomationLane>
}

export class AutomationEngine {
  private state: AutomationState
  private recordingLanes = new Set<string>()
  private callbacks = new Map<string, (value: number) => void>()
  private latchedLanes = new Set<string>()
  private recordingStartTime?: number
  private lastTouchTime?: number

  constructor() {
    this.state = {
      mode: "read",
      isRecording: false,
      currentTime: 0,
      lanes: new Map(),
    }
  }

  /**
   * Создание новой линии автоматизации
   */
  createLane(channelId: string, parameterId: string, initialValue = 0.5): AutomationLane {
    const laneId = `${channelId}.${parameterId}`

    const lane: AutomationLane = {
      id: laneId,
      parameterId,
      channelId,
      points: [{ time: 0, value: initialValue, curve: "linear" }],
      isEnabled: true,
      isVisible: false,
    }

    this.state.lanes.set(laneId, lane)
    return lane
  }

  /**
   * Установка режима автоматизации
   */
  setMode(mode: AutomationMode) {
    this.state.mode = mode

    if (mode === "off") {
      this.stopRecording()
    }
  }

  /**
   * Регистрация callback для параметра
   */
  registerParameterCallback(laneId: string, callback: (value: number) => void) {
    this.callbacks.set(laneId, callback)
  }

  /**
   * Обновление времени воспроизведения
   */
  updateTime(time: number) {
    this.state.currentTime = time

    // Чтение автоматизации для всех активных линий
    if (this.state.mode === "read" || this.state.mode === "touch" || this.state.mode === "latch") {
      this.readAutomation(time)
    }
  }

  /**
   * Начало записи автоматизации
   */
  startRecording() {
    if (this.state.mode === "off") return

    this.state.isRecording = true
    this.recordingStartTime = this.state.currentTime
    this.recordingLanes.clear()
    this.latchedLanes.clear()
  }

  /**
   * Остановка записи автоматизации
   */
  stopRecording() {
    this.state.isRecording = false
    this.recordingLanes.clear()
    this.latchedLanes.clear()
  }

  /**
   * Запись значения параметра
   */
  writeParameter(laneId: string, value: number, forceWrite = false) {
    const lane = this.state.lanes.get(laneId)
    if (!lane || !lane.isEnabled) return

    const time = this.state.currentTime

    // Определяем, нужно ли записывать
    let shouldWrite = forceWrite

    switch (this.state.mode) {
      case "write":
        shouldWrite = this.state.isRecording
        break

      case "touch":
        // Записываем только при активном взаимодействии
        shouldWrite = this.recordingLanes.has(laneId)
        break

      case "latch":
        // Продолжаем запись после отпускания
        shouldWrite = this.latchedLanes.has(laneId) || this.recordingLanes.has(laneId)
        break

      case "trim": {
        // Относительные изменения
        const currentValue = this.readValueAtTime(laneId, time)
        value = Math.max(0, Math.min(1, currentValue + (value - 0.5) * 0.1))
        shouldWrite = this.state.isRecording
        break
      }

      default:
        // Default case for "off" and "read" modes
        shouldWrite = false
        break
    }

    if (shouldWrite) {
      this.addAutomationPoint(laneId, time, value)
    }

    // Применяем значение немедленно
    const callback = this.callbacks.get(laneId)
    if (callback) {
      callback(value)
    }
  }

  /**
   * Начало касания параметра (для touch/latch режимов)
   */
  touchParameter(laneId: string) {
    if (this.state.mode === "touch" || this.state.mode === "latch") {
      this.recordingLanes.add(laneId)
      this.lastTouchTime = Date.now()

      if (this.state.mode === "latch") {
        this.latchedLanes.add(laneId)
      }
    }
  }

  /**
   * Окончание касания параметра
   */
  releaseParameter(laneId: string) {
    if (this.state.mode === "touch") {
      this.recordingLanes.delete(laneId)
    }
    // В latch режиме продолжаем запись
  }

  /**
   * Добавление точки автоматизации
   */
  private addAutomationPoint(laneId: string, time: number, value: number) {
    const lane = this.state.lanes.get(laneId)
    if (!lane) return

    // Находим позицию для вставки
    const insertIndex = lane.points.findIndex((point) => point.time > time)
    const index = insertIndex === -1 ? lane.points.length : insertIndex

    // Удаляем существующие точки в том же времени
    const existingIndex = lane.points.findIndex((point) => Math.abs(point.time - time) < 0.001)
    if (existingIndex !== -1) {
      lane.points[existingIndex].value = value
      return
    }

    // Добавляем новую точку
    const newPoint: AutomationPoint = {
      time,
      value,
      curve: "linear",
    }

    lane.points.splice(index, 0, newPoint)
  }

  /**
   * Чтение автоматизации для всех линий
   */
  private readAutomation(time: number) {
    for (const [laneId, lane] of Array.from(this.state.lanes.entries())) {
      if (!lane.isEnabled) continue

      // Пропускаем линии, которые сейчас записываются
      if (this.recordingLanes.has(laneId) || this.latchedLanes.has(laneId)) {
        continue
      }

      const value = this.readValueAtTime(laneId, time)
      const callback = this.callbacks.get(laneId)
      if (callback) {
        callback(value)
      }
    }
  }

  /**
   * Чтение значения в определенное время
   */
  readValueAtTime(laneId: string, time: number): number {
    const lane = this.state.lanes.get(laneId)
    if (!lane || lane.points.length === 0) return 0.5

    // Если время до первой точки
    if (time <= lane.points[0].time) {
      return lane.points[0].value
    }

    // Если время после последней точки
    if (time >= lane.points[lane.points.length - 1].time) {
      return lane.points[lane.points.length - 1].value
    }

    // Поиск соседних точек
    for (let i = 0; i < lane.points.length - 1; i++) {
      const currentPoint = lane.points[i]
      const nextPoint = lane.points[i + 1]

      if (time >= currentPoint.time && time <= nextPoint.time) {
        return this.interpolateValue(currentPoint, nextPoint, time)
      }
    }

    return lane.points[0].value
  }

  /**
   * Интерполяция между точками
   */
  private interpolateValue(pointA: AutomationPoint, pointB: AutomationPoint, time: number): number {
    const duration = pointB.time - pointA.time
    if (duration === 0) return pointA.value

    const progress = (time - pointA.time) / duration

    switch (pointA.curve) {
      case "hold":
        return pointA.value

      case "linear":
        return pointA.value + (pointB.value - pointA.value) * progress

      case "bezier": {
        // Простая S-кривая
        const smoothProgress = progress * progress * (3 - 2 * progress)
        return pointA.value + (pointB.value - pointA.value) * smoothProgress
      }

      default:
        return pointA.value + (pointB.value - pointA.value) * progress
    }
  }

  /**
   * Удаление точек автоматизации в диапазоне
   */
  deletePointsInRange(laneId: string, startTime: number, endTime: number) {
    const lane = this.state.lanes.get(laneId)
    if (!lane) return

    lane.points = lane.points.filter((point) => point.time < startTime || point.time > endTime)
  }

  /**
   * Получение всех линий для канала
   */
  getChannelLanes(channelId: string): AutomationLane[] {
    return Array.from(this.state.lanes.values()).filter((lane) => lane.channelId === channelId)
  }

  /**
   * Переключение видимости линии
   */
  toggleLaneVisibility(laneId: string) {
    const lane = this.state.lanes.get(laneId)
    if (lane) {
      lane.isVisible = !lane.isVisible
    }
  }

  /**
   * Получение состояния
   */
  getState(): AutomationState {
    return { ...this.state }
  }

  /**
   * Экспорт автоматизации
   */
  exportAutomation(): Record<string, AutomationLane> {
    const result: Record<string, AutomationLane> = {}
    for (const [id, lane] of Array.from(this.state.lanes.entries())) {
      result[id] = { ...lane, points: [...lane.points] }
    }
    return result
  }

  /**
   * Импорт автоматизации
   */
  importAutomation(data: Record<string, AutomationLane>) {
    this.state.lanes.clear()
    for (const [id, lane] of Object.entries(data)) {
      this.state.lanes.set(id, lane)
    }
  }
}

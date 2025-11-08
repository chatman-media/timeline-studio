/**
 * Типы для системы Speed Ramping с keyframes
 */

// Типы интерполяции между keyframes
export type SpeedInterpolationType =
  | "linear" // Линейная интерполяция
  | "ease" // Плавная интерполяция
  | "ease-in" // Ускорение в начале
  | "ease-out" // Замедление в конце
  | "ease-in-out" // Ускорение и замедление
  | "bezier" // Кривая Безье
  | "hold" // Ступенчатое изменение

// Keyframe скорости
export interface SpeedKeyframe {
  id: string
  time: number // Время в секундах относительно начала клипа
  value: number // Значение скорости (1.0 = нормальная)
  interpolation: SpeedInterpolationType

  // Для bezier интерполяции
  bezierHandles?: {
    in: { x: number; y: number }
    out: { x: number; y: number }
  }

  // Метаданные
  isLocked?: boolean
  label?: string
}

// Конфигурация speed ramping для клипа
export interface SpeedRampingConfig {
  enabled: boolean
  keyframes: SpeedKeyframe[]
  maintainPitch: boolean

  // Ограничения
  minSpeed?: number // Минимальная скорость (по умолчанию 0.1)
  maxSpeed?: number // Максимальная скорость (по умолчанию 10.0)

  // Визуализация
  showGraph?: boolean
  graphHeight?: number // Высота графика в пикселях
  graphOpacity?: number // Прозрачность графика
}

// Пресеты speed ramping
export interface SpeedRampingPreset {
  id: string
  name: string
  description?: string
  keyframes: Omit<SpeedKeyframe, "id">[]
  category: "basic" | "creative" | "sport" | "cinematic" | "custom"
  icon?: string
}

// Встроенные пресеты
export const SPEED_RAMPING_PRESETS: SpeedRampingPreset[] = [
  {
    id: "slow-motion",
    name: "Slow Motion",
    description: "Simple slow motion effect",
    category: "basic",
    keyframes: [{ time: 0, value: 0.5, interpolation: "linear" }],
  },
  {
    id: "fast-forward",
    name: "Fast Forward",
    description: "Speed up footage",
    category: "basic",
    keyframes: [{ time: 0, value: 2.0, interpolation: "linear" }],
  },
  {
    id: "freeze-frame",
    name: "Freeze Frame",
    description: "Pause at specific moment",
    category: "basic",
    keyframes: [{ time: 0.5, value: 0, interpolation: "hold" }],
  },
  {
    id: "ramp-to-slow",
    name: "Ramp to Slow",
    description: "Gradually slow down",
    category: "creative",
    keyframes: [
      { time: 0, value: 1.0, interpolation: "ease-out" },
      { time: 1, value: 0.2, interpolation: "linear" },
    ],
  },
  {
    id: "speed-burst",
    name: "Speed Burst",
    description: "Quick speed up and return",
    category: "creative",
    keyframes: [
      { time: 0, value: 1.0, interpolation: "ease-in" },
      { time: 0.3, value: 3.0, interpolation: "ease-out" },
      { time: 0.6, value: 1.0, interpolation: "linear" },
    ],
  },
  {
    id: "action-replay",
    name: "Action Replay",
    description: "Sport-style slow motion replay",
    category: "sport",
    keyframes: [
      { time: 0, value: 1.0, interpolation: "ease-out" },
      { time: 0.2, value: 0.3, interpolation: "linear" },
      { time: 0.8, value: 0.3, interpolation: "ease-in" },
      { time: 1, value: 1.0, interpolation: "linear" },
    ],
  },
  {
    id: "bullet-time",
    name: "Bullet Time",
    description: "Matrix-style effect",
    category: "cinematic",
    keyframes: [
      { time: 0, value: 1.0, interpolation: "ease-out" },
      { time: 0.3, value: 0.05, interpolation: "linear" },
      { time: 0.7, value: 0.05, interpolation: "ease-in" },
      { time: 1, value: 1.0, interpolation: "linear" },
    ],
  },
]

// Результат применения speed ramping
export interface SpeedRampingResult {
  // Новая длительность клипа после применения speed ramping
  newDuration: number

  // Массив сегментов с разными скоростями
  segments: Array<{
    startTime: number // Начало сегмента в новом времени
    endTime: number // Конец сегмента в новом времени
    originalStart: number // Начало в оригинальном времени
    originalEnd: number // Конец в оригинальном времени
    speed: number // Скорость в этом сегменте
  }>

  // Функция для конвертации времени
  timeMapping: (newTime: number) => number // Новое время -> оригинальное
  reverseMapping: (originalTime: number) => number // Оригинальное -> новое
}

// Утилиты для работы со speed ramping

/**
 * Создает новый keyframe
 */
export function createSpeedKeyframe(
  time: number,
  value: number,
  interpolation: SpeedInterpolationType = "linear",
): SpeedKeyframe {
  return {
    id: `keyframe-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    time,
    value,
    interpolation,
  }
}

/**
 * Интерполирует значение скорости между двумя keyframes
 */
export function interpolateSpeed(
  keyframe1: SpeedKeyframe,
  keyframe2: SpeedKeyframe,
  t: number, // 0-1 между keyframes
): number {
  switch (keyframe1.interpolation) {
    case "linear":
      return keyframe1.value + (keyframe2.value - keyframe1.value) * t

    case "ease": {
      // Cubic ease in-out
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
      return keyframe1.value + (keyframe2.value - keyframe1.value) * easeT
    }

    case "ease-in": {
      // Cubic ease in
      const easeInT = t * t * t
      return keyframe1.value + (keyframe2.value - keyframe1.value) * easeInT
    }

    case "ease-out": {
      // Cubic ease out
      const easeOutT = 1 - (1 - t) ** 3
      return keyframe1.value + (keyframe2.value - keyframe1.value) * easeOutT
    }

    case "ease-in-out": {
      // Cubic ease in-out
      const easeInOutT = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
      return keyframe1.value + (keyframe2.value - keyframe1.value) * easeInOutT
    }

    case "bezier":
      // Simplified bezier (would need proper implementation)
      if (keyframe1.bezierHandles) {
        // TODO: Implement proper bezier interpolation
        return keyframe1.value + (keyframe2.value - keyframe1.value) * t
      }
      return keyframe1.value + (keyframe2.value - keyframe1.value) * t

    case "hold":
      // Step function - hold value until next keyframe
      return keyframe1.value

    default:
      return keyframe1.value
  }
}

/**
 * Получает скорость в конкретный момент времени
 */
export function getSpeedAtTime(keyframes: SpeedKeyframe[], time: number, _clipDuration: number): number {
  if (keyframes.length === 0) return 1.0
  if (keyframes.length === 1) return keyframes[0].value

  // Сортируем keyframes по времени
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time)

  // Если время до первого keyframe
  if (time <= sortedKeyframes[0].time) {
    return sortedKeyframes[0].value
  }

  // Если время после последнего keyframe
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    return sortedKeyframes[sortedKeyframes.length - 1].value
  }

  // Находим два keyframes между которыми находится время
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const kf1 = sortedKeyframes[i]
    const kf2 = sortedKeyframes[i + 1]

    if (time >= kf1.time && time <= kf2.time) {
      const t = (time - kf1.time) / (kf2.time - kf1.time)
      return interpolateSpeed(kf1, kf2, t)
    }
  }

  return 1.0
}

/**
 * Вычисляет новую длительность клипа с учетом speed ramping
 */
export function calculateNewDuration(
  originalDuration: number,
  keyframes: SpeedKeyframe[],
  sampleRate = 100, // Частота дискретизации для расчета
): number {
  if (keyframes.length === 0) return originalDuration

  let newDuration = 0
  const step = originalDuration / sampleRate

  for (let i = 0; i < sampleRate; i++) {
    const time = i * step
    const speed = getSpeedAtTime(keyframes, time, originalDuration)

    if (speed > 0) {
      newDuration += step / speed
    }
  }

  return newDuration
}

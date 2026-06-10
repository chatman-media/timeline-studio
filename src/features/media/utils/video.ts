import type { FfprobeStream, MediaFile, MediaTimeRange } from "@timeline-studio/core/types"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "Video" })

/**
 * Константы для работы с временными промежутками
 *
 * @property MILLISECONDS_IN_SECOND - Количество миллисекунд в одной секунде
 * @property MAX_GAP_SECONDS - Максимальный промежуток между видео в секундах (1 час)
 */
const TIME_CONSTANTS = {
  MILLISECONDS_IN_SECOND: 1000,
  MAX_GAP_SECONDS: 3600, // Максимальный промежуток между видео в секундах
} as const

/**
 * Вычисляет временные диапазоны для массива видео
 * @param videos - Массив медиафайлов
 * @returns Массив временных диапазонов
 * @example
 * const videos = [
 *   { startTime: 0, duration: 10 },
 *   { startTime: 15, duration: 5 }
 * ];
 * const ranges = calculateTimeRanges(videos);
 */
export const calculateTimeRanges = (videos: MediaFile[]): MediaTimeRange[] => {
  // Отключаем логирование для уменьшения количества сообщений
  // logger.info(
  //   "calculateTimeRanges called with videos:",
  //   videos.map((v) => v.name),
  // )

  const times = videos.flatMap((v: MediaFile) => {
    const startTime = (v.startTime ?? 0) * TIME_CONSTANTS.MILLISECONDS_IN_SECOND
    const duration = v.duration ?? 0
    const endTime = startTime + duration * TIME_CONSTANTS.MILLISECONDS_IN_SECOND
    // Отключаем логирование для уменьшения количества сообщений
    // logger.info(
    //   `Video ${v.name}: startTime=${startTime / 1000}s, duration=${duration}s, endTime=${endTime / 1000}s`,
    // )
    return [startTime, endTime]
  })

  if (times.length === 0) return []

  const sortedTimes = times.sort((a: number, b: number) => a - b)
  const ranges: MediaTimeRange[] = []
  let currentRange = {
    start: Math.floor(sortedTimes[0] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND),
    end: Math.floor(sortedTimes[0] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND),
    duration:
      Math.floor(sortedTimes[1] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND) -
      Math.floor(sortedTimes[0] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND),
  }

  for (let i = 1; i < sortedTimes.length; i++) {
    const currentTime = Math.floor(sortedTimes[i] / TIME_CONSTANTS.MILLISECONDS_IN_SECOND)
    const gap = currentTime - currentRange.end

    if (gap > TIME_CONSTANTS.MAX_GAP_SECONDS) {
      ranges.push(currentRange)
      currentRange = {
        start: currentTime,
        end: currentTime,
        duration: 0,
      }
    } else {
      currentRange.end = currentTime
    }
  }
  ranges.push(currentRange)

  // Отключаем логирование для уменьшения количества сообщений
  // logger.info("Calculated time ranges:", ranges)

  return ranges
}

/**
 * Вычисляет соотношение сторон видео
 * @param stream - Объект с параметрами видеопотока
 * @returns Строка с соотношением сторон (например, "16:9") или null
 * @example
 * const ratio = getAspectRatio({ width: 1920, height: 1080 }); // "16:9"
 */
export const getAspectRatio = (stream?: FfprobeStream): string | null => {
  if (!stream) return null

  // Проверяем наличие специальных соотношений
  if (stream.display_aspect_ratio === "960:409") {
    return "2.35:1"
  }

  // Если есть display_aspect_ratio и он не "N/A"
  if (stream.display_aspect_ratio && stream.display_aspect_ratio !== "N/A") {
    return stream.display_aspect_ratio
  }

  // Если есть sample_aspect_ratio, можно использовать его вместе с width и height
  if (stream.sample_aspect_ratio && stream.width && stream.height) {
    const [sar_num, sar_den] = stream.sample_aspect_ratio.split(":").map(Number)
    if (!Number.isNaN(sar_num) && !Number.isNaN(sar_den) && sar_den !== 0) {
      const dar_width = stream.width * sar_num
      const dar_height = stream.height * sar_den

      const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
      const divisor = gcd(dar_width, dar_height)

      return `${dar_width / divisor}:${dar_height / divisor}`
    }
  }

  // Если есть width и height, вычисляем соотношение
  if (stream.width && stream.height) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
    const divisor = gcd(stream.width, stream.height)
    return `${stream.width / divisor}:${stream.height / divisor}`
  }

  // Если ничего не подошло, возвращаем стандартное соотношение 16:9
  return "16:9"
}

/**
 * Получает частоту кадров из строки r_frame_rate
 * @param stream - Объект с параметром r_frame_rate
 * @returns Число кадров в секунду или null
 * @example
 * const fps = getFps({ r_frame_rate: "30/1" }); // 30
 */
export const getFps = (stream?: { r_frame_rate?: string }): number | null => {
  if (!stream?.r_frame_rate) return null

  try {
    // Безопасный парсинг строки формата "num/den"
    const fpsStr = stream.r_frame_rate
    const fpsMatch = /(\d+)\/(\d+)/.exec(fpsStr)

    if (fpsMatch) {
      // Если строка в формате "num/den", вычисляем деление
      const numerator = Number.parseInt(fpsMatch[1], 10)
      const denominator = Number.parseInt(fpsMatch[2], 10)

      if (denominator === 0) return null

      return numerator / denominator
    }

    const fps = Number.parseFloat(fpsStr)
    return Number.isNaN(fps) ? null : fps
  } catch {
    return null
  }
}

/**
 * Получает время кадра (в секундах) из объекта потока или MediaFile
 * @param videoOrStream - Объект MediaFile или FfprobeStream с параметром r_frame_rate
 * @param defaultFps - Значение FPS по умолчанию, если не удалось получить из метаданных
 * @returns Время одного кадра в секундах
 * @example
 * const frameTime = getFrameTime(video); // 0.033333... (для 30 fps)
 */
export const getFrameTime = (videoOrStream?: MediaFile | { r_frame_rate?: string }, defaultFps = 25): number => {
  if (!videoOrStream) return 1 / defaultFps

  // Если передан MediaFile, извлекаем поток
  const stream = ("probeData" in videoOrStream ? videoOrStream.probeData?.streams[0] : videoOrStream) as FfprobeStream

  // Получаем FPS
  const fps = getFps(stream)

  // Если не удалось получить FPS, используем значение по умолчанию
  if (!fps || fps <= 0) return 1 / defaultFps

  return 1 / fps
}

/**
 * Состояния громкости звука
 *
 * @enum {number}
 * @property {number} FULL - Полная громкость (1.0)
 * @property {number} HALF - Половина громкости (0.5)
 * @property {number} MUTED - Без звука (0)
 *
 * @example
 * ```ts
 * // Установка полной громкости
 * player.volume = VolumeState.FULL;
 *
 * // Проверка, отключен ли звук
 * if (volume === VolumeState.MUTED) {
 *   logger.info("Звук отключен");
 * }
 * ```
 */
export enum VolumeState {
  FULL = 1, // Полная громкость
  HALF = 0.5, // Половина громкости
  MUTED = 0, // Без звука
}

/**
 * Получает следующее состояние громкости в цикле FULL -> HALF -> MUTED -> FULL
 * @param currentVolume - Текущее значение громкости
 * @returns Следующее состояние громкости
 * @example
 * const nextVolume = getNextVolumeState(VolumeState.FULL); // VolumeState.HALF
 */
export const getNextVolumeState = (currentVolume: VolumeState): VolumeState => {
  if (currentVolume === VolumeState.FULL) return VolumeState.HALF
  if (currentVolume === VolumeState.HALF) return VolumeState.MUTED
  return VolumeState.FULL
}

/**
 * Вычисляет ширину контейнера с учетом ограничений соотношения сторон и поворота видео
 *
 * @param width - Ширина видео в пикселях
 * @param height - Высота видео в пикселях
 * @param containerHeight - Высота контейнера в пикселях
 * @param rotation - Поворот видео в градусах (90, 180, 270)
 * @returns Ширина контейнера в пикселях
 *
 * @example
 * ```ts
 * // Для видео 1920x1080 в контейнере высотой 600px
 * calculateWidth(1920, 1080, 600) // 1067
 *
 * // Для повернутого на 90 градусов видео 1920x1080
 * calculateWidth(1920, 1080, 600, 90) // 338
 * ```
 */
export function calculateWidth(width: number, height: number, containerHeight: number, rotation?: number): number {
  // Если нет размеров, используем соотношение 16:9 по умолчанию
  if (!width || !height) {
    return containerHeight * (16 / 9)
  }

  // Для повернутого видео меняем местами ширину и высоту
  let aspectRatio = width / height
  if (rotation === 90 || rotation === 270) {
    aspectRatio = height / width
  }

  // Базовая ширина на основе соотношения сторон
  const baseWidth = containerHeight * aspectRatio

  return baseWidth
}

/**
 * Парсит значение поворота видео из различных форматов
 *
 * @param rotation - Значение поворота в виде строки или числа
 * @returns Поворот в градусах (число) или undefined, если значение не удалось распарсить
 *
 * @example
 * ```ts
 * parseRotation("90") // 90
 * parseRotation(180) // 180
 * parseRotation("invalid") // undefined
 * parseRotation(undefined) // undefined
 * ```
 */
export const parseRotation = (rotation?: string | number): number | undefined => {
  if (rotation === undefined) return undefined
  if (typeof rotation === "number") return rotation
  const parsed = Number.parseInt(rotation, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * Рассчитывает адаптивную ширину для видео с учетом соотношения сторон и режима отображения
 *
 * @param width - Базовая ширина в пикселях
 * @param isMultipleStreams - Флаг, указывающий на наличие нескольких потоков
 * @param displayAspectRatio - Соотношение сторон видео в формате "w:h" (например, "16:9")
 * @returns Строка с шириной в пикселях (например, "1280px")
 *
 * @description
 * Функция адаптирует ширину видео в зависимости от соотношения сторон:
 * - Для широкоформатного видео (соотношение > 2) уменьшает ширину
 * - Для вертикального видео (ширина < высота) уменьшает ширину
 * - Для нескольких потоков уменьшает ширину до 8/9 от исходной
 *
 * @example
 * ```ts
 * calculateAdaptiveWidth(1280, false, "16:9") // "1280px"
 * calculateAdaptiveWidth(1280, true) // "1137.7777777777778px"
 * calculateAdaptiveWidth(1280, false, "21:9") // "853.3333333333334px"
 * ```
 */
export function calculateAdaptiveWidth(width: number, isMultipleStreams: boolean, displayAspectRatio?: string): string {
  if (isMultipleStreams) {
    return `${(width / 9) * 8}px`
  }

  // Если нет соотношения сторон, используем 16:9 по умолчанию
  const aspectRatio = displayAspectRatio || "16:9"
  const [w, h] = aspectRatio.split(":").map(Number)

  // Проверяем, что парсинг прошел успешно
  if (Number.isNaN(w) || Number.isNaN(h) || h === 0) {
    return `${width}px`
  }

  const ratio = w / h

  // Для широкоформатного видео (2.35:1 или близко к этому)
  if (ratio > 2) {
    return `${(width * (16 / 9)) / ratio}px`
  }

  // Для вертикального видео (например, 9:16)
  if (w < h) {
    return `${(width * 16 * 16) / 9 / 9}px`
  }

  return `${width}px`
}

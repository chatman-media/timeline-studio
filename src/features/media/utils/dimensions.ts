import type { Dimensions, VideoStream } from "../types/types"

/**
 * Вычисляет реальные размеры видео с учетом поворота
 * @param stream - Видеопоток с информацией о размерах и повороте
 * @returns Объект с реальными размерами и стилями
 * @example
 * const dimensions = calculateRealDimensions({
 *   width: 1920,
 *   height: 1080,
 *   rotation: "90"
 * });
 */
export const calculateRealDimensions = (stream: VideoStream & { width: number; height: number }): Dimensions => {
  const rotation = stream.rotation ? Number.parseInt(stream.rotation, 10) : 0
  const { width, height } = stream

  if (Math.abs(rotation) === 90 || Math.abs(rotation) === 270) {
    return {
      width: height,
      height: width,
      style: "",
    }
  }

  return { width, height, style: "" }
}

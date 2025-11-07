/**
 * Утилиты для работы с WebGL
 */

import { createLogger } from "../tauri-logger"

const logger = createLogger("WebGLUtils")

/**
 * Проверка, является ли число степенью двойки
 */
export function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0
}

/**
 * Получить ближайшую степень двойки
 */
export function nearestPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(value))
}

/**
 * Создать матрицу ортографической проекции
 */
export function createOrthographicMatrix(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Float32Array {
  const lr = 1 / (left - right)
  const bt = 1 / (bottom - top)
  const nf = 1 / (near - far)

  return new Float32Array([
    -2 * lr,
    0,
    0,
    0,
    0,
    -2 * bt,
    0,
    0,
    0,
    0,
    2 * nf,
    0,
    (left + right) * lr,
    (top + bottom) * bt,
    (far + near) * nf,
    1,
  ])
}

/**
 * Создать единичную матрицу
 */
export function createIdentityMatrix(): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}

/**
 * Создать матрицу масштабирования
 */
export function createScaleMatrix(sx: number, sy: number, sz: number = 1): Float32Array {
  return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])
}

/**
 * Создать матрицу переноса
 */
export function createTranslationMatrix(tx: number, ty: number, tz: number = 0): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1])
}

/**
 * Создать матрицу поворота вокруг оси Z
 */
export function createRotationMatrix(angleInRadians: number): Float32Array {
  const c = Math.cos(angleInRadians)
  const s = Math.sin(angleInRadians)

  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}

/**
 * Умножить две матрицы 4x4
 */
export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16)

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0
      for (let k = 0; k < 4; k++) {
        sum += a[i * 4 + k] * b[k * 4 + j]
      }
      result[i * 4 + j] = sum
    }
  }

  return result
}

/**
 * Конвертировать цвет из HEX в RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [0, 0, 0]

  return [
    Number.parseInt(result[1], 16) / 255,
    Number.parseInt(result[2], 16) / 255,
    Number.parseInt(result[3], 16) / 255,
  ]
}

/**
 * Конвертировать цвет из RGB в HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16)
    return hex.length === 1 ? `0${hex}` : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Линейная интерполяция
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Ограничить значение диапазоном
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Нормализовать значение в диапазон 0-1
 */
export function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min)
}

/**
 * Денормализовать значение из диапазона 0-1
 */
export function denormalize(value: number, min: number, max: number): number {
  return value * (max - min) + min
}

/**
 * Загрузить изображение
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

/**
 * Создать текстуру из видео элемента
 */
export function createVideoTexture(gl: WebGL2RenderingContext, video: HTMLVideoElement): WebGLTexture | null {
  const texture = gl.createTexture()
  if (!texture) return null

  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Загружаем текущий кадр видео
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)

  // Настраиваем параметры для не-степени двойки
  if (!isPowerOfTwo(video.videoWidth) || !isPowerOfTwo(video.videoHeight)) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  } else {
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  return texture
}

/**
 * Обновить текстуру видео
 */
export function updateVideoTexture(gl: WebGL2RenderingContext, texture: WebGLTexture, video: HTMLVideoElement): void {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
}

/**
 * Получить строку ошибки WebGL
 */
export function getWebGLErrorString(gl: WebGL2RenderingContext, error: number): string {
  switch (error) {
    case gl.NO_ERROR:
      return "NO_ERROR"
    case gl.INVALID_ENUM:
      return "INVALID_ENUM"
    case gl.INVALID_VALUE:
      return "INVALID_VALUE"
    case gl.INVALID_OPERATION:
      return "INVALID_OPERATION"
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      return "INVALID_FRAMEBUFFER_OPERATION"
    case gl.OUT_OF_MEMORY:
      return "OUT_OF_MEMORY"
    case gl.CONTEXT_LOST_WEBGL:
      return "CONTEXT_LOST_WEBGL"
    default:
      return `Unknown error: ${error}`
  }
}

/**
 * Проверить ошибки WebGL
 */
export function checkWebGLError(gl: WebGL2RenderingContext, operation: string): void {
  const error = gl.getError()
  if (error !== gl.NO_ERROR) {
    logger.errorSync("WebGL error", {
      operation,
      error: getWebGLErrorString(gl, error),
    })
  }
}

/**
 * Измерить производительность операции
 */
export async function measurePerformance<T>(operation: () => T | Promise<T>, label: string): Promise<T> {
  const start = performance.now()

  try {
    const result = await operation()
    const duration = performance.now() - start
    logger.debugSync("Operation completed", { label, durationMs: duration.toFixed(2) })
    return result
  } catch (error) {
    const duration = performance.now() - start
    logger.errorSync("Operation failed", { label, durationMs: duration.toFixed(2), error })
    throw error
  }
}

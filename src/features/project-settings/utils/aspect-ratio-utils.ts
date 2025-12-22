/**
 * Утилиты для работы с соотношениями сторон
 */

import { AspectRatio } from "@/domains/video-editing/types"

/**
 * Функция для преобразования ширины и высоты в строку формата X:Y
 * Определяет стандартные соотношения сторон или вычисляет соотношение
 *
 * @param {number} width - Ширина в пикселях
 * @param {number} height - Высота в пикселях
 * @returns {string} Строка соотношения сторон в формате "X:Y"
 */
export function getAspectRatioString(width: number, height: number): string {
  // Проверяем на соответствие стандартным соотношениям сторон
  // Используем погрешность 0.05 для учета округлений и вариаций разрешений
  // Например, 21:9 (UltraWide) на практике реализуется как 64:27 = 2.370
  const ratio = width / height

  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9"
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16"
  if (Math.abs(ratio - 1) < 0.05) return "1:1"
  if (Math.abs(ratio - 4 / 3) < 0.05) return "4:3"
  if (Math.abs(ratio - 3 / 4) < 0.05) return "3:4"
  if (Math.abs(ratio - 4 / 5) < 0.05) return "4:5"
  if (Math.abs(ratio - 5 / 4) < 0.05) return "5:4"
  // 21:9 (UltraWide) фактически реализуется как 64:27 = 2.370
  if (Math.abs(ratio - 64 / 27) < 0.05) return "21:9"

  // Вычисляем наибольший общий делитель и сокращаем дробь
  const divisor = gcd(width, height)
  const x = width / divisor
  const y = height / divisor

  // Если соотношение получается слишком сложным (большие числа),
  // возвращаем десятичную дробь с 2 знаками после запятой
  if (x > 30 || y > 30) {
    return (width / height).toFixed(2).replace(".", ":")
  }

  // Возвращаем соотношение в формате "X:Y"
  return `${Math.round(x)}:${Math.round(y)}`
}

/**
 * Вспомогательная функция для нахождения наибольшего общего делителя
 * Используется алгоритм Евклида
 *
 * @param {number} a - Первое число
 * @param {number} b - Второе число
 * @returns {number} Наибольший общий делитель
 */
export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/**
 * Вычисляет новую высоту на основе ширины и соотношения сторон
 *
 * @param {number} width - Ширина в пикселях
 * @param {number} aspectRatio - Соотношение сторон (ширина/высота)
 * @returns {number} Высота в пикселях
 */
export function calculateHeightFromWidth(width: number, aspectRatio: number): number {
  return Math.round(width / aspectRatio)
}

/**
 * Вычисляет новую ширину на основе высоты и соотношения сторон
 *
 * @param {number} height - Высота в пикселях
 * @param {number} aspectRatio - Соотношение сторон (ширина/высота)
 * @returns {number} Ширина в пикселях
 */
export function calculateWidthFromHeight(height: number, aspectRatio: number): number {
  return Math.round(height * aspectRatio)
}

/**
 * Проверяет, является ли соотношение сторон стандартным
 *
 * @param {number} width - Ширина в пикселях
 * @param {number} height - Высота в пикселях
 * @returns {boolean} true, если соотношение стандартное
 */
export function isStandardAspectRatio(width: number, height: number): boolean {
  const ratio = width / height
  // 21:9 (UltraWide) фактически реализуется как 64:27 = 2.370
  const standardRatios = [16 / 9, 9 / 16, 1, 4 / 3, 3 / 4, 4 / 5, 5 / 4, 64 / 27]

  return standardRatios.some((standardRatio) => Math.abs(ratio - standardRatio) < 0.05)
}

/**
 * Преобразует ширину и высоту в enum AspectRatio
 *
 * @param {number} width - Ширина в пикселях
 * @param {number} height - Высота в пикселях
 * @returns {AspectRatio} Enum соотношения сторон
 */
export function calculateAspectRatio(width: number, height: number): AspectRatio {
  const ratioString = getAspectRatioString(width, height)

  // Преобразуем строку в enum
  switch (ratioString) {
    case "16:9":
      return AspectRatio.Ratio16x9
    case "4:3":
      return AspectRatio.Ratio4x3
    case "1:1":
      return AspectRatio.Ratio1x1
    case "9:16":
      return AspectRatio.Ratio9x16
    default:
      return AspectRatio.Ratio16x9
  }
}

/**
 * Color Scheme Feature - Built-in schemes & helpers
 */

import type { ColorScheme, ColorSchemeVars } from "./types"

/** Идентификатор схемы по умолчанию (совпадает со значениями в globals.css) */
export const DEFAULT_COLOR_SCHEME_ID = "teal"

/** Сколько схем по умолчанию показываем в быстром доступе */
export const DEFAULT_QUICK_ACCESS_IDS = ["teal", "blue", "purple", "green"]

/**
 * Строит набор акцентных переменных из тона (hue) и насыщенности (saturation).
 * Светлота подобрана так же, как у teal в globals.css.
 */
function vars(hue: number, saturation: number, baseLightness: number): ColorSchemeVars {
  return {
    teal: `${hue} ${saturation}% ${baseLightness}%`,
    "teal-light": `${hue} ${saturation}% ${baseLightness + 10}%`,
    "teal-dark": `${hue} ${saturation}% ${baseLightness - 10}%`,
  }
}

/**
 * Создаёт встроенную схему по тону. Светлая/тёмная подобраны под текущую палитру:
 * light — saturation 75% / lightness 42%, dark — saturation 65% / lightness 58%.
 */
function builtin(id: string, name: string, hue: number): ColorScheme {
  return {
    id,
    name,
    isBuiltin: true,
    light: vars(hue, 75, 42),
    dark: vars(hue, 65, 58),
  }
}

/**
 * Встроенные цветовые схемы.
 * `name` — ключ перевода вида `colorScheme.builtin.<id>`.
 */
export const BUILTIN_COLOR_SCHEMES: ColorScheme[] = [
  builtin(DEFAULT_COLOR_SCHEME_ID, "colorScheme.builtin.teal", 175),
  builtin("blue", "colorScheme.builtin.blue", 210),
  builtin("purple", "colorScheme.builtin.purple", 265),
  builtin("green", "colorScheme.builtin.green", 150),
  builtin("orange", "colorScheme.builtin.orange", 28),
  builtin("rose", "colorScheme.builtin.rose", 345),
]

/** Карта встроенных схем по id для быстрого доступа */
export const BUILTIN_SCHEMES_BY_ID = new Map(BUILTIN_COLOR_SCHEMES.map((s) => [s.id, s]))

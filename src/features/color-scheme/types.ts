/**
 * Color Scheme Feature - Types
 *
 * Цветовая схема переопределяет акцентные CSS-переменные приложения
 * (семейство --teal) отдельно для светлой и тёмной темы.
 * Значения хранятся в формате HSL-триплета "H S% L%" — как в globals.css.
 */

/**
 * CSS-переменные акцента, которые может переопределять схема.
 * Имена даны без префикса `--`.
 */
export type ColorSchemeVars = {
  teal: string
  "teal-light": string
  "teal-dark": string
}

/**
 * Цветовая схема: набор акцентных переменных для светлой и тёмной темы.
 */
export interface ColorScheme {
  /** Уникальный идентификатор схемы */
  id: string
  /** Отображаемое имя. Для встроенных схем — ключ перевода (nameKey), для пользовательских — литерал */
  name: string
  /** Встроенная схема (нельзя удалить/редактировать) */
  isBuiltin?: boolean
  /** Переменные для светлой темы */
  light: ColorSchemeVars
  /** Переменные для тёмной темы */
  dark: ColorSchemeVars
}

/** Режим темы приложения */
export type ThemeMode = "light" | "dark" | "system"

/**
 * Color Scheme Feature - color math & CSS application
 */

import type { ColorScheme, ColorSchemeVars } from "./types"

/** ID style-элемента, в который инжектятся переменные активной схемы */
export const COLOR_SCHEME_STYLE_ID = "color-scheme-vars"

/** Парсит "#rrggbb" / "#rgb" в [r,g,b] (0-255). Возвращает null при некорректном вводе. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const num = Number.parseInt(h, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

/** Конвертирует HEX в HSL-триплет "H S% L%" (формат CSS-переменных). */
export function hexToHslTriplet(hex: string): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Возвращает HSL-триплет с заменённой светлотой (для генерации light/dark вариантов). */
function withLightness(triplet: string, lightness: number): string {
  const parts = triplet.split(/\s+/)
  if (parts.length < 3) return triplet
  return `${parts[0]} ${parts[1]} ${Math.max(0, Math.min(100, lightness))}%`
}

/** CSS-значение акцента в виде "hsl(H S% L%)" для превью. */
export function tripletToCss(triplet: string): string {
  return `hsl(${triplet})`
}

/**
 * Строит пользовательскую цветовую схему из одного акцентного цвета (HEX).
 * Светлая/тёмная варианты получаются сдвигом светлоты.
 */
export function buildCustomScheme(id: string, name: string, accentHex: string): ColorScheme | null {
  const base = hexToHslTriplet(accentHex)
  if (!base) return null
  const [hue, sat] = base.split(/\s+/)
  const lightVars: ColorSchemeVars = {
    teal: `${hue} ${sat} 42%`,
    "teal-light": `${hue} ${sat} 52%`,
    "teal-dark": `${hue} ${sat} 32%`,
  }
  const darkVars: ColorSchemeVars = {
    teal: `${hue} ${sat} 58%`,
    "teal-light": `${hue} ${sat} 68%`,
    "teal-dark": `${hue} ${sat} 48%`,
  }
  return { id, name, isBuiltin: false, light: lightVars, dark: darkVars }
}

/** Превью-цвет (HEX-неважен, отдаём CSS hsl) акцента схемы для текущего режима. */
export function schemePreviewColor(scheme: ColorScheme, isDark: boolean): string {
  return tripletToCss((isDark ? scheme.dark : scheme.light).teal)
}

function varsBlock(selector: string, v: ColorSchemeVars): string {
  return `${selector}{--teal:${v.teal};--teal-light:${v["teal-light"]};--teal-dark:${v["teal-dark"]};}`
}

/** Генерирует CSS-текст переопределения переменных для светлой (:root) и тёмной (.dark) тем. */
export function buildSchemeCss(scheme: ColorScheme): string {
  return `${varsBlock(":root", scheme.light)}${varsBlock(".dark", scheme.dark)}`
}

/** Инжектит/обновляет style-элемент с переменными активной схемы в <head>. */
export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return
  let el = document.getElementById(COLOR_SCHEME_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement("style")
    el.id = COLOR_SCHEME_STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = buildSchemeCss(scheme)
}

/** Базовая проверка, что объект похож на ColorScheme (для импорта из файла). */
export function isValidColorScheme(value: unknown): value is ColorScheme {
  if (!value || typeof value !== "object") return false
  const s = value as Record<string, unknown>
  const validVars = (v: unknown) =>
    !!v &&
    typeof v === "object" &&
    typeof (v as Record<string, unknown>).teal === "string" &&
    typeof (v as Record<string, unknown>)["teal-light"] === "string" &&
    typeof (v as Record<string, unknown>)["teal-dark"] === "string"
  return typeof s.id === "string" && typeof s.name === "string" && validVars(s.light) && validVars(s.dark)
}

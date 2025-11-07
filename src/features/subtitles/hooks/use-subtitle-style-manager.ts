import { useCallback } from "react"
import type { SubtitleInlineStyle, SubtitleStyleTemplate } from "../types/subtitles"
import { useSubtitles } from "./use-subtitle-styles"

interface UseSubtitleStyleManagerReturn {
  // Данные
  subtitleStyles: SubtitleStyleTemplate[]

  // Методы
  getStyleById: (styleId: string) => SubtitleStyleTemplate | undefined
  getStyleByName: (name: string) => SubtitleStyleTemplate | undefined

  // Утилиты
  getDefaultStyle: () => SubtitleStyleTemplate | undefined
  getBuiltInStyles: () => SubtitleStyleTemplate[]
  getCustomStyles: () => SubtitleStyleTemplate[]

  // Применение стилей
  getComputedStyle: (styleId?: string, overrides?: SubtitleInlineStyle) => ComputedSubtitleStyle
}

/**
 * Вычисленный стиль субтитров с применением всех переопределений
 */
export interface ComputedSubtitleStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string | number
  fontStyle: string
  textAlign: string
  color: string
  backgroundColor?: string
  strokeColor?: string
  strokeWidth: number
  textShadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  borderRadius: number
  maxWidth: number
  wordWrap: boolean
  letterSpacing: number
  lineHeight: number
  position: {
    alignment: string
    marginX: number
    marginY: number
  }
}

/**
 * Хук для управления стилями субтитров
 * Обеспечивает совместимость с timeline модулем
 */
export function useSubtitleStyleManager(): UseSubtitleStyleManagerReturn {
  const { subtitles: subtitleStyles, isReady } = useSubtitles()

  const getStyleById = useCallback(
    (styleId: string): SubtitleStyleTemplate | undefined => {
      if (!isReady) return undefined
      return subtitleStyles.find((style) => style.id === styleId)
    },
    [subtitleStyles, isReady],
  )

  const getStyleByName = useCallback(
    (name: string): SubtitleStyleTemplate | undefined => {
      if (!isReady) return undefined
      return subtitleStyles.find((style) => style.name === name)
    },
    [subtitleStyles, isReady],
  )

  const getDefaultStyle = useCallback((): SubtitleStyleTemplate | undefined => {
    if (!isReady) return undefined
    // Ищем стиль "basic-white" или первый базовый
    return (
      subtitleStyles.find((style) => style.id === "basic-white") ||
      subtitleStyles.find((style) => style.category === "basic") ||
      subtitleStyles[0]
    )
  }, [subtitleStyles, isReady])

  const getBuiltInStyles = useCallback((): SubtitleStyleTemplate[] => {
    if (!isReady) return []
    // Все стили из JSON считаются встроенными
    return subtitleStyles
  }, [subtitleStyles, isReady])

  const getCustomStyles = useCallback((): SubtitleStyleTemplate[] => {
    // В текущей реализации пользовательских стилей нет
    return []
  }, [])

  const getComputedStyle = useCallback(
    (styleId?: string, overrides?: SubtitleInlineStyle): ComputedSubtitleStyle => {
      // Получаем базовый стиль
      const baseStyle = styleId ? getStyleById(styleId) : getDefaultStyle()

      // Стиль по умолчанию если ничего не найдено
      const defaultStyle: ComputedSubtitleStyle = {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 24,
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        strokeWidth: 0,
        padding: {
          top: 8,
          right: 12,
          bottom: 8,
          left: 12,
        },
        borderRadius: 4,
        maxWidth: 80,
        wordWrap: true,
        letterSpacing: 0,
        lineHeight: 1.2,
        position: {
          alignment: "bottom-center",
          marginX: 0,
          marginY: 50,
        },
      }

      if (!baseStyle) {
        return { ...defaultStyle, ...overrides }
      }

      // Парсим padding из строки в объект
      const parsePadding = (paddingStr?: string) => {
        if (!paddingStr) return defaultStyle.padding
        const values = paddingStr.split(" ").map((v) => Number.parseInt(v, 10) || 0)
        if (values.length === 1) {
          return { top: values[0], right: values[0], bottom: values[0], left: values[0] }
        }
        if (values.length === 2) {
          return { top: values[0], right: values[1], bottom: values[0], left: values[1] }
        }
        if (values.length === 4) {
          return { top: values[0], right: values[1], bottom: values[2], left: values[3] }
        }
        return defaultStyle.padding
      }

      // Парсим textShadow из строки
      const parseTextShadow = (shadowStr?: string) => {
        if (!shadowStr) return undefined
        const match = shadowStr.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(.+)/)
        if (match) {
          return {
            offsetX: Number.parseInt(match[1], 10) || 0,
            offsetY: Number.parseInt(match[2], 10) || 0,
            blur: Number.parseInt(match[3], 10) || 0,
            color: match[4] || "#000000",
          }
        }
        return undefined
      }

      // Применяем стиль и переопределения
      const computedStyle: ComputedSubtitleStyle = {
        fontFamily: overrides?.fontFamily || baseStyle.style?.fontFamily || defaultStyle.fontFamily,
        fontSize: overrides?.fontSize || baseStyle.style?.fontSize || defaultStyle.fontSize,
        fontWeight: overrides?.fontWeight || baseStyle.style?.fontWeight || defaultStyle.fontWeight,
        fontStyle: overrides?.fontStyle || baseStyle.style?.fontStyle || defaultStyle.fontStyle,
        textAlign: (overrides?.textAlign || baseStyle.style?.textAlign || defaultStyle.textAlign) as string,
        color: overrides?.color || baseStyle.style?.color || defaultStyle.color,
        backgroundColor: overrides?.backgroundColor || baseStyle.style?.backgroundColor || defaultStyle.backgroundColor,
        strokeColor: overrides?.strokeColor,
        strokeWidth: overrides?.strokeWidth || defaultStyle.strokeWidth,
        textShadow: parseTextShadow(overrides?.textShadow || baseStyle.style?.textShadow),
        padding: parsePadding(overrides?.padding || (baseStyle.style?.padding ? String(baseStyle.style.padding) : undefined)),
        borderRadius:
          Number.parseInt(String(overrides?.borderRadius || baseStyle.style?.borderRadius || "4"), 10) ||
          defaultStyle.borderRadius,
        maxWidth: overrides?.maxWidth || defaultStyle.maxWidth,
        wordWrap: defaultStyle.wordWrap,
        letterSpacing: overrides?.letterSpacing || baseStyle.style?.letterSpacing || defaultStyle.letterSpacing,
        lineHeight: overrides?.lineHeight || baseStyle.style?.lineHeight || defaultStyle.lineHeight,
        position: defaultStyle.position,
      }

      return computedStyle
    },
    [getStyleById, getDefaultStyle],
  )

  return {
    subtitleStyles,
    getStyleById,
    getStyleByName,
    getDefaultStyle,
    getBuiltInStyles,
    getCustomStyles,
    getComputedStyle,
  }
}

// Экспортируем под старым именем для совместимости
export const useSubtitleStyles = useSubtitleStyleManager

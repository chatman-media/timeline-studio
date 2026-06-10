/**
 * Конфигурационные интерфейсы для системы шаблонов
 */

// Re-export types from canonical source
export type {
  AnimationConfig,
  AnimationType,
  CellConfiguration,
  CellLayout,
  DividerConfig,
  LayoutConfig,
  MediaTemplate,
  MediaTemplateConfig,
  SplitPoint,
  TemplateAspectRatio,
} from "@timeline-studio/core/types/templates"

// Предустановленные стили для быстрого создания шаблонов
export const PRESET_STYLES = {
  cell: {
    default: {
      background: { color: "#23262b" },
      border: { width: "1px", color: "rgba(156, 163, 175, 0.3)", style: "solid" as const },
      title: {
        show: true,
        position: "center" as const,
        style: {
          fontSize: "18px",
          color: "rgba(156, 163, 175, 0.4)",
          fontWeight: "normal",
        },
      },
      animation: {
        enter: { type: "fade" as const, duration: 300, easing: "ease-in-out" as const },
        exit: { type: "fade" as const, duration: 200, easing: "ease-in" as const },
        transition: { type: "fade" as const, duration: 250, easing: "ease-in-out" as const },
      },
    },
    alternate: {
      background: { color: "#2a2e36" },
      border: { width: "1px", color: "rgba(156, 163, 175, 0.3)", style: "solid" as const },
      title: {
        show: true,
        position: "center" as const,
        style: {
          fontSize: "18px",
          color: "rgba(156, 163, 175, 0.4)",
          fontWeight: "normal",
        },
      },
      animation: {
        enter: { type: "fade" as const, duration: 300, easing: "ease-in-out" as const },
        exit: { type: "fade" as const, duration: 200, easing: "ease-in" as const },
        transition: { type: "fade" as const, duration: 250, easing: "ease-in-out" as const },
      },
    },
  },
  animation: {
    fade: {
      enter: { type: "fade" as const, duration: 300, easing: "ease-in-out" as const },
      exit: { type: "fade" as const, duration: 200, easing: "ease-in" as const },
      transition: { type: "fade" as const, duration: 250, easing: "ease-in-out" as const },
    },
    slide: {
      enter: { type: "slide-up" as const, duration: 400, easing: "ease-out" as const },
      exit: { type: "slide-down" as const, duration: 300, easing: "ease-in" as const },
      transition: { type: "slide-left" as const, duration: 350, easing: "ease-in-out" as const },
    },
    zoom: {
      enter: { type: "zoom-in" as const, duration: 350, easing: "ease-out" as const },
      exit: { type: "zoom-out" as const, duration: 250, easing: "ease-in" as const },
      transition: { type: "zoom-in" as const, duration: 300, easing: "ease-in-out" as const },
    },
    none: {
      enter: { type: "none" as const, duration: 0, easing: "linear" as const },
      exit: { type: "none" as const, duration: 0, easing: "linear" as const },
      transition: { type: "none" as const, duration: 0, easing: "linear" as const },
    },
  },
  divider: {
    default: {
      show: true,
      width: "1px",
      color: "#4b5563", // gray-600
      style: "solid" as const,
    },
    dashed: {
      show: true,
      width: "1px",
      color: "#4b5563",
      style: "dashed" as const,
      dashArray: "5,5",
    },
    thick: {
      show: true,
      width: "2px",
      color: "#374151", // gray-700
      style: "solid" as const,
    },
  },
  layout: {
    default: {
      backgroundColor: "transparent",
    },
    withGap: {
      gap: "2px",
      backgroundColor: "#1f2937", // gray-800
    },
  },
}

// Import type for use in function signature
import type { CellConfiguration, DividerConfig } from "@timeline-studio/core/types/templates"

// Утилиты для работы с конфигурациями
export function createCellConfig(index: number, customConfig?: Partial<CellConfiguration>): CellConfiguration {
  const isAlternate = index % 2 === 1
  const preset = isAlternate ? PRESET_STYLES.cell.alternate : PRESET_STYLES.cell.default

  return {
    ...preset,
    ...customConfig,
    title: {
      ...preset.title,
      ...customConfig?.title,
      text: customConfig?.title?.text || String(index + 1),
      style: {
        ...preset.title?.style,
        ...customConfig?.title?.style,
      },
    },
  }
}

export function createDividerConfig(
  preset: keyof typeof PRESET_STYLES.divider = "default",
  customConfig?: Partial<DividerConfig>,
): DividerConfig {
  return {
    ...PRESET_STYLES.divider[preset],
    ...customConfig,
  }
}

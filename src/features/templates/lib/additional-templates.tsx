/**
 * Дополнительные многокамерные шаблоны
 * Этот файл содержит популярные layouts: 3-way split, corner overlay, side-by-side с разными пропорциями
 */

import { createCellConfig, createDividerConfig, type MediaTemplateConfig, PRESET_STYLES } from "./template-config"

// ===== 3-WAY SPLIT TEMPLATES (9 шаблонов) =====
// Три равные части в разных ориентациях

const threeWayTemplates: MediaTemplateConfig[] = [
  // 3-way горизонтальный (верх-центр-низ)
  {
    id: "split-3way-horizontal-equal-landscape",
    split: "horizontal",
    resizable: true,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "split-3way-horizontal-equal-portrait",
    split: "horizontal",
    resizable: true,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 3-way вертикальный (лево-центр-право)
  {
    id: "split-3way-vertical-equal-landscape",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "split-3way-vertical-equal-portrait",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 3-way T-образный (верхний широкий + 2 нижних)
  {
    id: "split-3way-t-shape-landscape",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "split-3way-t-shape-portrait",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 3-way L-образный (левый широкий + 2 правых)
  {
    id: "split-3way-l-shape-landscape",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "split-3way-l-shape-portrait",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
      { position: "absolute", top: "0", right: "0", width: "50%", height: "50%" },
      { position: "absolute", bottom: "0", right: "0", width: "50%", height: "50%" },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 3-way диагональный
  {
    id: "split-3way-diagonal-landscape",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "center", text: `${i + 1}` },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "66.67%", height: "50%" },
      { position: "absolute", bottom: "0", left: "0", width: "50%", height: "50%" },
      { position: "absolute", top: "0", right: "0", width: "33.33%", height: "100%" },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
]

// ===== CORNER OVERLAY TEMPLATES (12 шаблонов) =====
// Маленькое окно в углу большого

const cornerOverlayTemplates: MediaTemplateConfig[] = [
  // Угловые оверлеи с разными размерами (маленький, средний, большой)
  {
    id: "corner-overlay-top-left-small-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, {
        title: { show: false },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.3)",
          style: "solid",
          radius: "8px",
        },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", top: "3%", left: "3%", width: "20%", height: "20%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-top-right-small-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", top: "3%", right: "3%", width: "20%", height: "20%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-bottom-left-small-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", bottom: "3%", left: "3%", width: "20%", height: "20%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-bottom-right-small-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", bottom: "3%", right: "3%", width: "20%", height: "20%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // Средний размер оверлеев
  {
    id: "corner-overlay-top-left-medium-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", top: "3%", left: "3%", width: "30%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-top-right-medium-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", top: "3%", right: "3%", width: "30%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-bottom-left-medium-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", bottom: "3%", left: "3%", width: "30%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-bottom-right-medium-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", bottom: "3%", right: "3%", width: "30%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // Большой размер оверлеев (для portrait)
  {
    id: "corner-overlay-top-left-large-portrait",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", top: "3%", left: "3%", width: "40%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-top-right-large-portrait",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", top: "3%", right: "3%", width: "40%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-bottom-left-large-portrait",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", bottom: "3%", left: "3%", width: "40%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "corner-overlay-bottom-right-large-portrait",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: { width: "2px", color: "rgba(255, 255, 255, 0.3)", style: "solid", radius: "8px" },
      }),
    ],
    cellLayouts: [
      { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: 1 },
      { position: "absolute", bottom: "3%", right: "3%", width: "40%", height: "30%", zIndex: 10 },
    ],
    dividers: createDividerConfig("default"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
]

// ===== SIDE-BY-SIDE PROPORTIONAL TEMPLATES (9 шаблонов) =====
// Side-by-side с разными пропорциями

const sideBySideTemplates: MediaTemplateConfig[] = [
  // 60/40
  {
    id: "side-by-side-60-40-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 60,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "side-by-side-60-40-portrait",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 60,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 70/30
  {
    id: "side-by-side-70-30-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 70,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "side-by-side-70-30-portrait",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 70,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 75/25
  {
    id: "side-by-side-75-25-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 75,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "side-by-side-75-25-portrait",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 75,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // 80/20 (для экстремальных случаев)
  {
    id: "side-by-side-80-20-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 80,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },

  // Top-bottom варианты для portrait
  {
    id: "top-bottom-60-40-portrait",
    split: "horizontal",
    resizable: true,
    screens: 2,
    splitPosition: 60,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
  {
    id: "top-bottom-70-30-portrait",
    split: "horizontal",
    resizable: true,
    screens: 2,
    splitPosition: 70,
    cells: [
      createCellConfig(0, { title: { show: false }, fitMode: "cover" }),
      createCellConfig(1, { title: { show: false }, fitMode: "cover" }),
    ],
    dividers: createDividerConfig("thick"),
    layout: {
      ...PRESET_STYLES.layout.default,
      layoutTransition: { duration: 500, easing: "ease-in-out" },
    },
  },
]

// ===== ЭКСПОРТ =====

export const additionalTemplates: MediaTemplateConfig[] = [
  ...threeWayTemplates, // 9 шаблонов
  ...cornerOverlayTemplates, // 12 шаблонов
  ...sideBySideTemplates, // 9 шаблонов
]

// Итого: 30 дополнительных шаблонов

export default additionalTemplates

/**
 * Профессиональные многокамерные layouts для интервью, панелей и событий
 * Этот файл содержит 20 профессиональных шаблонов
 */

import { createCellConfig, createDividerConfig, type MediaTemplateConfig, PRESET_STYLES } from "./template-config"

// ===== L-SHAPE LAYOUTS (6 шаблонов) =====
// Г-образное расположение: большой экран + полоска маленьких
// Идеально для панельных дискуссий и вебинаров

const lShapeTemplates: MediaTemplateConfig[] = [
  // 3 камеры - L-Shape справа и снизу
  {
    id: "professional-l-shape-3-right-bottom-landscape",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "center", text: "Main" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
      }),
      createCellConfig(2, {
        title: { show: false },
        fitMode: "cover",
      }),
    ],

    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "75%",
        height: "75%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "25%",
        height: "75%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "100%",
        height: "25%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 4 камеры - L-Shape справа и снизу
  {
    id: "professional-l-shape-4-right-bottom-landscape",
    split: "custom",
    resizable: false,
    screens: 4,
    cells: Array.from({ length: 4 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "70%",
        height: "70%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "30%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "35%",
        right: "0",
        width: "30%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "70%",
        height: "30%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 3 камеры - L-Shape слева и снизу
  {
    id: "professional-l-shape-3-left-bottom-landscape",
    split: "custom",
    resizable: false,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "75%",
        height: "75%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "25%",
        height: "75%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "100%",
        height: "25%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 4 камеры - L-Shape полоска снизу (горизонтальный)
  {
    id: "professional-l-shape-4-bottom-strip-landscape",
    split: "custom",
    resizable: false,
    screens: 4,
    cells: Array.from({ length: 4 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "75%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "33.33%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "33.33%",
        width: "33.33%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "33.34%",
        height: "25%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 5 камер - L-Shape с полосой справа и снизу
  {
    id: "professional-l-shape-5-right-bottom-landscape",
    split: "custom",
    resizable: false,
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "70%",
        height: "70%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "30%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "35%",
        right: "0",
        width: "30%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "35%",
        height: "30%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "35%",
        width: "35%",
        height: "30%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 6 камер - L-Shape с 2x2 справа и полоса снизу
  {
    id: "professional-l-shape-6-grid-right-strip-bottom-landscape",
    split: "custom",
    resizable: false,
    screens: 6,
    cells: Array.from({ length: 6 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "65%",
        height: "70%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "17.5%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "17.5%",
        width: "17.5%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "35%",
        right: "0",
        width: "17.5%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "35%",
        right: "17.5%",
        width: "17.5%",
        height: "35%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "100%",
        height: "30%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },
]

// ===== INTERVIEW LAYOUTS (8 шаблонов) =====
// Шаблоны для интервью с различными пропорциями

const interviewTemplates: MediaTemplateConfig[] = [
  // 2 камеры - 50/50 равномерное интервью
  {
    id: "professional-interview-50-50-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 50,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "bottom-left", text: "Guest" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: true, position: "bottom-right", text: "Host" },
        fitMode: "cover",
      }),
    ],

    dividers: createDividerConfig("thick"),
  },

  // 2 камеры - 60/40 с акцентом на гостя
  {
    id: "professional-interview-60-40-guest-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 60,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "bottom-left", text: "Guest" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: true, position: "bottom-right", text: "Host" },
        fitMode: "cover",
      }),
    ],

    dividers: createDividerConfig("thick"),
  },

  // 2 камеры - 40/60 с акцентом на интервьюера
  {
    id: "professional-interview-40-60-host-landscape",
    split: "vertical",
    resizable: true,
    screens: 2,
    splitPosition: 40,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "bottom-left", text: "Host" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: true, position: "bottom-right", text: "Guest" },
        fitMode: "cover",
      }),
    ],

    dividers: createDividerConfig("thick"),
  },

  // 3 камеры - Модератор в центре + 2 гостя
  {
    id: "professional-interview-3-moderator-center-landscape",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "bottom-left", text: "Guest 1" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: true, position: "bottom-left", text: "Moderator" },
        fitMode: "cover",
        background: { color: "#2a2e36" },
      }),
      createCellConfig(2, {
        title: { show: true, position: "bottom-right", text: "Guest 2" },
        fitMode: "cover",
      }),
    ],

    dividers: createDividerConfig("thick"),
  },

  // 4 камеры - Панельная дискуссия 2x2
  {
    id: "professional-interview-panel-2x2-landscape",
    split: "grid",
    resizable: false,
    screens: 4,
    gridConfig: { columns: 2, rows: 2 },
    cells: Array.from({ length: 4 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: true,
          position: "bottom-left",
          text: `Speaker ${i + 1}`,
        },
        fitMode: "cover",
      }),
    ),
    layout: PRESET_STYLES.layout.withGap,
    dividers: createDividerConfig("thick"),
  },

  // 3 камеры - Вертикальное разделение для портретных видео
  {
    id: "professional-interview-3-portrait-vertical",
    split: "vertical",
    resizable: true,
    screens: 3,
    cells: Array.from({ length: 3 }, (_, i) =>
      createCellConfig(i, {
        title: { show: true, position: "bottom-left", text: `Person ${i + 1}` },
        fitMode: "cover",
      }),
    ),
    dividers: createDividerConfig("thick"),
  },

  // 2 камеры - С центральной разделительной полосой (для intro/outro)
  {
    id: "professional-interview-split-center-bar-landscape",
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "bottom-left", text: "Left" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: true, position: "bottom-right", text: "Right" },
        fitMode: "cover",
      }),
    ],

    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "47.5%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "47.5%",
        height: "100%",
        zIndex: 1,
      },
    ],

    layout: {
      backgroundColor: "#1f2937",
      gap: "5%", // Центральная полоса 5%
    },
    dividers: createDividerConfig("thick"),
  },

  // 5 камер - Главный гость + 4 участника внизу
  {
    id: "professional-interview-5-main-guest-landscape",
    split: "custom",
    resizable: false,
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: true,
          position: "bottom-left",
          text: i === 0 ? "Main Guest" : `Participant ${i}`,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "70%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "25%",
        height: "30%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "25%",
        width: "25%",
        height: "30%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "50%",
        width: "25%",
        height: "30%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "25%",
        height: "30%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },
]

// ===== SPORTS/EVENT LAYOUTS (6 шаблонов) =====
// Главный экран + миниатюры камер сбоку

const sportsEventTemplates: MediaTemplateConfig[] = [
  // 4 камеры - Главный 75% + 3 миниатюры справа
  {
    id: "professional-sports-4-main-right-landscape",
    split: "custom",
    resizable: false,
    screens: 4,
    cells: Array.from({ length: 4 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "75%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "25%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "33.33%",
        right: "0",
        width: "25%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "25%",
        height: "33.34%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 5 камер - Главный 70% + 4 миниатюры справа
  {
    id: "professional-sports-5-main-right-landscape",
    split: "custom",
    resizable: false,
    screens: 5,
    cells: Array.from({ length: 5 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "70%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "30%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "25%",
        right: "0",
        width: "30%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "50%",
        right: "0",
        width: "30%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "30%",
        height: "25%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 6 камер - Главный 65% + 5 миниатюр справа
  {
    id: "professional-sports-6-main-right-landscape",
    split: "custom",
    resizable: false,
    screens: 6,
    cells: Array.from({ length: 6 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "65%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "35%",
        height: "20%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "20%",
        right: "0",
        width: "35%",
        height: "20%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "40%",
        right: "0",
        width: "35%",
        height: "20%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "60%",
        right: "0",
        width: "35%",
        height: "20%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "35%",
        height: "20%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 4 камеры - Главный 75% + 3 миниатюры слева
  {
    id: "professional-sports-4-main-left-landscape",
    split: "custom",
    resizable: false,
    screens: 4,
    cells: Array.from({ length: 4 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "75%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "25%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "33.33%",
        left: "0",
        width: "25%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "25%",
        height: "33.34%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 4 камеры - Главный 75% + 3 миниатюры внизу
  {
    id: "professional-sports-4-main-bottom-landscape",
    split: "custom",
    resizable: false,
    screens: 4,
    cells: Array.from({ length: 4 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "75%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "33.33%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "33.33%",
        width: "33.33%",
        height: "25%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "33.34%",
        height: "25%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },

  // 7 камер - Главный 60% + 6 миниатюр справа в 2 колонки
  {
    id: "professional-sports-7-main-right-grid-landscape",
    split: "custom",
    resizable: false,
    screens: 7,
    cells: Array.from({ length: 7 }, (_, i) =>
      createCellConfig(i, {
        title: {
          show: i === 0,
          position: "center",
          text: i === 0 ? "Main" : undefined,
        },
        fitMode: "cover",
      }),
    ),
    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "60%",
        height: "100%",
        zIndex: 1,
      },
      // Правая колонка 1
      {
        position: "absolute",
        top: "0",
        left: "60%",
        width: "20%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "33.33%",
        left: "60%",
        width: "20%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        left: "60%",
        width: "20%",
        height: "33.34%",
        zIndex: 1,
      },
      // Правая колонка 2
      {
        position: "absolute",
        top: "0",
        right: "0",
        width: "20%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "33.33%",
        right: "0",
        width: "20%",
        height: "33.33%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: "20%",
        height: "33.34%",
        zIndex: 1,
      },
    ],

    dividers: createDividerConfig("default"),
  },
]

// ===== ЭКСПОРТ ВСЕХ ПРОФЕССИОНАЛЬНЫХ LAYOUTS =====

export const professionalLayouts: MediaTemplateConfig[] = [
  ...lShapeTemplates, // 6 шаблонов
  ...interviewTemplates, // 8 шаблонов
  ...sportsEventTemplates, // 6 шаблонов
]

// Итого: 20 профессиональных шаблонов

export default professionalLayouts

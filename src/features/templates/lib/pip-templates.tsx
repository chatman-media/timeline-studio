/**
 * Picture-in-Picture (PiP) шаблоны для многокамерного монтажа
 * Этот файл содержит 26 PiP шаблонов для различных конфигураций
 */

import { createCellConfig, createDividerConfig, type MediaTemplateConfig } from "./template-config"

// ===== BASIC PiP (12 шаблонов: 4 позиции × 3 размера) =====

const PIP_SIZES = {
  small: { width: "15%", height: "15%" },
  medium: { width: "20%", height: "20%" },
  large: { width: "25%", height: "25%" },
}

const PIP_POSITIONS = {
  topLeft: { top: "2%", left: "2%" },
  topRight: { top: "2%", right: "2%" },
  bottomLeft: { bottom: "2%", left: "2%" },
  bottomRight: { bottom: "2%", right: "2%" },
}

// Helper для создания Basic PiP конфигурации
function createBasicPip(
  position: keyof typeof PIP_POSITIONS,
  size: keyof typeof PIP_SIZES,
  orientation: "landscape" | "portrait" | "square",
): MediaTemplateConfig {
  const pos = PIP_POSITIONS[position]
  const sizeConfig = PIP_SIZES[size]
  const sizePercent = Number.parseInt(sizeConfig.width, 10)

  return {
    id: `pip-basic-${position}-${sizePercent}-${orientation}`,
    split: "custom",
    resizable: false,
    screens: 2,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "center", text: "Main" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.2)",
          style: "solid",
          radius: "4px",
        },
      }),
    ],

    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        ...pos,
        ...sizeConfig,
        zIndex: 10,
      },
    ],

    dividers: createDividerConfig("default"),
  }
}

// Basic PiP templates (12 шаблонов)
const basicPipTemplates: MediaTemplateConfig[] = []

// Для каждой позиции и размера создаем landscape вариант
;(Object.keys(PIP_POSITIONS) as Array<keyof typeof PIP_POSITIONS>).forEach((position) => {
  ;(Object.keys(PIP_SIZES) as Array<keyof typeof PIP_SIZES>).forEach((size) => {
    basicPipTemplates.push(createBasicPip(position, size, "landscape"))
  })
})

// ===== DUAL PiP (8 шаблонов: разные комбинации позиций) =====

// Helper для создания Dual PiP
function createDualPip(
  config: {
    pos1: keyof typeof PIP_POSITIONS
    pos2: keyof typeof PIP_POSITIONS
    size: keyof typeof PIP_SIZES
  },
  orientation: "landscape" | "portrait" | "square",
): MediaTemplateConfig {
  const pos1 = PIP_POSITIONS[config.pos1]
  const pos2 = PIP_POSITIONS[config.pos2]
  const sizeConfig = PIP_SIZES[config.size]
  const sizePercent = Number.parseInt(sizeConfig.width, 10)

  return {
    id: `pip-dual-${config.pos1}-${config.pos2}-${sizePercent}-${orientation}`,
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
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.2)",
          style: "solid",
          radius: "4px",
        },
      }),
      createCellConfig(2, {
        title: { show: false },
        fitMode: "cover",
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.2)",
          style: "solid",
          radius: "4px",
        },
      }),
    ],

    cellLayouts: [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        ...pos1,
        ...sizeConfig,
        zIndex: 10,
      },
      {
        position: "absolute",
        ...pos2,
        ...sizeConfig,
        zIndex: 10,
      },
    ],

    dividers: createDividerConfig("default"),
  }
}

// Dual PiP templates (8 configurations)
const dualPipTemplates: MediaTemplateConfig[] = [
  // Opposite corners
  createDualPip({ pos1: "topLeft", pos2: "bottomRight", size: "small" }, "landscape"),
  createDualPip({ pos1: "topRight", pos2: "bottomLeft", size: "small" }, "landscape"),

  // Same side (top)
  createDualPip({ pos1: "topLeft", pos2: "topRight", size: "small" }, "landscape"),
  createDualPip({ pos1: "topLeft", pos2: "topRight", size: "medium" }, "landscape"),

  // Same side (bottom)
  createDualPip({ pos1: "bottomLeft", pos2: "bottomRight", size: "small" }, "landscape"),
  createDualPip({ pos1: "bottomLeft", pos2: "bottomRight", size: "medium" }, "landscape"),

  // Same side (vertical)
  createDualPip({ pos1: "topLeft", pos2: "bottomLeft", size: "small" }, "landscape"),
  createDualPip({ pos1: "topRight", pos2: "bottomRight", size: "small" }, "landscape"),
]

// ===== TRIPLE PiP (6 шаблонов: 3 маленьких экрана) =====

// Helper для создания Triple PiP
function createTriplePip(
  arrangement: "three-corners" | "bottom-strip" | "side-strip",
  orientation: "landscape" | "portrait" | "square",
): MediaTemplateConfig {
  let cellLayouts: Array<{
    position: "absolute"
    top?: string
    left?: string
    right?: string
    bottom?: string
    width: string
    height: string
    zIndex: number
  }>

  const id = `pip-triple-${arrangement}-${orientation}`

  if (arrangement === "three-corners") {
    // Top-left, Top-right, Bottom-left
    cellLayouts = [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "2%",
        left: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
      {
        position: "absolute",
        top: "2%",
        right: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
      {
        position: "absolute",
        bottom: "2%",
        left: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
    ]
  } else if (arrangement === "bottom-strip") {
    // 3 маленьких экрана внизу
    cellLayouts = [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        bottom: "2%",
        left: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
      {
        position: "absolute",
        bottom: "2%",
        left: "calc(2% + 15% + 2%)",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
      {
        position: "absolute",
        bottom: "2%",
        left: "calc(2% + 15% + 2% + 15% + 2%)",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
    ]
  } else {
    // side-strip: 3 маленьких экрана справа
    cellLayouts = [
      {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: 1,
      },
      {
        position: "absolute",
        top: "2%",
        right: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
      {
        position: "absolute",
        top: "calc(2% + 15% + 2%)",
        right: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
      {
        position: "absolute",
        top: "calc(2% + 15% + 2% + 15% + 2%)",
        right: "2%",
        width: "15%",
        height: "15%",
        zIndex: 10,
      },
    ]
  }

  return {
    id,
    split: "custom",
    resizable: false,
    screens: 4,
    cells: [
      createCellConfig(0, {
        title: { show: true, position: "center", text: "Main" },
        fitMode: "cover",
      }),
      createCellConfig(1, {
        title: { show: false },
        fitMode: "cover",
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.2)",
          style: "solid",
          radius: "4px",
        },
      }),
      createCellConfig(2, {
        title: { show: false },
        fitMode: "cover",
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.2)",
          style: "solid",
          radius: "4px",
        },
      }),
      createCellConfig(3, {
        title: { show: false },
        fitMode: "cover",
        border: {
          width: "2px",
          color: "rgba(255, 255, 255, 0.2)",
          style: "solid",
          radius: "4px",
        },
      }),
    ],

    cellLayouts,
    dividers: createDividerConfig("default"),
  }
}

// Triple PiP templates (6 configurations)
const triplePipTemplates: MediaTemplateConfig[] = [
  createTriplePip("three-corners", "landscape"),
  createTriplePip("three-corners", "portrait"),
  createTriplePip("bottom-strip", "landscape"),
  createTriplePip("bottom-strip", "portrait"),
  createTriplePip("side-strip", "landscape"),
  createTriplePip("side-strip", "portrait"),
]

// ===== ЭКСПОРТ ВСЕХ PiP ШАБЛОНОВ =====

export const pipTemplates: MediaTemplateConfig[] = [
  ...basicPipTemplates, // 12 шаблонов
  ...dualPipTemplates, // 8 шаблонов
  ...triplePipTemplates, // 6 шаблонов
]

// Итого: 26 PiP шаблонов

export default pipTemplates

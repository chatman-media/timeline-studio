import type { MediaFile } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"

import type { CellConfig, MediaTemplate } from "../lib/templates"

const logger = createLogger("TemplateService")

// Интерфейс для хранения информации о применяемом шаблоне
export interface AppliedTemplate {
  template: MediaTemplate | null
  videos: MediaFile[] // Видео, к которым применен шаблон
}

// Интерфейс для хранения стилей видео в шаблоне
export interface VideoTemplateStyle {
  position: "absolute" | "relative" | "fixed" | "sticky"
  top?: string
  left?: string
  right?: string
  bottom?: string
  width?: string
  height?: string
  clipPath?: string
  zIndex?: number
  transform?: string
  display?: "block" | "none"
  cellConfig?: CellConfig // Настройки ячейки для видео
}

/**
 * Получает стили для видео в зависимости от шаблона и индекса видео
 * @param template Шаблон
 * @param videoIndexOrCellConfig Индекс видео в массиве или конфигурация ячейки
 * @param totalVideos Общее количество видео (необязательно)
 * @returns Объект со стилями для видео
 */
export function getVideoStyleForTemplate(
  template: MediaTemplate,
  videoIndexOrCellConfig: number | CellConfig,
  _totalVideos?: number, // Параметр не используется, но оставлен для совместимости
): VideoTemplateStyle {
  // Определяем, что передано - индекс или конфигурация
  const videoIndex = typeof videoIndexOrCellConfig === "number" ? videoIndexOrCellConfig : 0
  const cellConfigParam = typeof videoIndexOrCellConfig === "object" ? videoIndexOrCellConfig : undefined
  // Базовый стиль для всех видео
  const baseStyle: VideoTemplateStyle = {
    position: "absolute",
  }

  // Если шаблон не указан, возвращаем базовый стиль
  if (!template) {
    return {
      ...baseStyle,
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    }
  }

  // Если индекс видео больше, чем количество экранов в шаблоне,
  // скрываем видео
  if (videoIndex >= template.screens) {
    return {
      ...baseStyle,
      width: "0",
      height: "0",
      top: "0",
      left: "0",
      display: "none",
    }
  }

  // Получаем настройки ячейки из шаблона или используем переданную конфигурацию
  let cellConfig: CellConfig | undefined = cellConfigParam

  if (!cellConfig && template.cellConfig) {
    if (Array.isArray(template.cellConfig)) {
      // Если настройки заданы для каждой ячейки отдельно
      cellConfig = template.cellConfig[videoIndex]
    } else {
      // Если настройки общие для всех ячеек
      cellConfig = template.cellConfig
    }
  }

  // В зависимости от типа разделения шаблона, возвращаем соответствующие стили
  if (template.split === "vertical") {
    // Вертикальное разделение (колонки)
    const widthPercent = 100 / template.screens
    const result = {
      ...baseStyle,
      top: "0",
      left: `${videoIndex * widthPercent}%`,
      width: `${widthPercent}%`,
      height: "100%",
      cellConfig, // Добавляем настройки ячейки
    }

    // Логируем стили для отладки
    logger.info(`[TemplateService] Стили для вертикального разделения (индекс ${videoIndex}):`, result)

    return result
  }
  if (template.split === "horizontal") {
    // Горизонтальное разделение (строки)
    const heightPercent = 100 / template.screens
    const result = {
      ...baseStyle,
      top: `${videoIndex * heightPercent}%`,
      left: "0",
      width: "100%",
      height: `${heightPercent}%`,
      cellConfig, // Добавляем настройки ячейки
    }

    // Логируем стили для отладки
    logger.info(`[TemplateService] Стили для горизонтального разделения (индекс ${videoIndex}):`, result)

    return result
  }

  if (template.split === "diagonal") {
    // Диагональное разделение
    if (template.screens === 2) {
      // Для 2 экранов
      if (videoIndex === 0) {
        // Первое видео (левая часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: template.splitPoints
            ? `polygon(0 0, ${template.splitPoints[0].x}% 0, ${template.splitPoints[1].x}% 100%, 0 100%)`
            : "polygon(0 0, 66.67% 0, 33.33% 100%, 0 100%)",
          zIndex: 1,
          cellConfig, // Добавляем настройки ячейки
        }
      }

      // Второе видео (правая часть)
      return {
        ...baseStyle,
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        clipPath: template.splitPoints
          ? `polygon(${template.splitPoints[0].x}% 0, 100% 0, 100% 100%, ${template.splitPoints[1].x}% 100%)`
          : "polygon(66.67% 0, 100% 0, 100% 100%, 33.33% 100%)",
        zIndex: 2,
        cellConfig, // Добавляем настройки ячейки
      }
    }

    if (template.screens === 3) {
      // Для 3 экранов (треугольное разделение)
      if (videoIndex === 0) {
        // Первое видео (верхняя часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 100% 0, 50% 50%)",
          zIndex: 1,
        }
      }

      if (videoIndex === 1) {
        // Второе видео (нижняя левая часть)
        return {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 50% 50%, 0 100%)",
          zIndex: 2,
        }
      }

      // Третье видео (нижняя правая часть)
      return {
        ...baseStyle,
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        clipPath: "polygon(50% 50%, 100% 0, 100% 100%)",
        zIndex: 3,
      }
    }
  }

  if (template.split === "custom") {
    // Для шаблона "1 left + 3 right" (1 большое слева, 3 маленьких справа)
    if (
      template.screens === 4 &&
      template.id &&
      template.id.includes("split-1-3-landscape") &&
      !template.id.includes("bottom")
    ) {
      if (videoIndex === 0) {
        // Большое видео слева
        const result = {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "50%",
          height: "100%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "1 left + 3 right" (большое видео слева, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Маленькие видео справа (3 видео в столбец)
      const adjustedIndex = videoIndex - 1 // Смещаем индекс, так как первое видео занимает всю левую часть
      const row = Math.floor(adjustedIndex / 1) // Каждое видео в своей строке

      const result = {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: "50%",
        width: "50%",
        height: "33.33%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "1 left + 3 right" (маленькое видео справа, индекс ${videoIndex}):`,
        result,
      )

      return result
    }

    // Для шаблона "3 left + 1 right" (3 маленьких слева, 1 большое справа)
    if (template.screens === 4 && template.id && template.id.includes("split-3-1-right-landscape")) {
      if (videoIndex === 3) {
        // Большое видео справа
        const result = {
          ...baseStyle,
          top: "0",
          left: "50%",
          width: "50%",
          height: "100%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "3 left + 1 right" (большое видео справа, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Маленькие видео слева (3 видео в столбец)
      const row = Math.floor(videoIndex / 1) // Каждое видео в своей строке

      const result = {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: "0",
        width: "50%",
        height: "33.33%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "3 left + 1 right" (маленькое видео слева, индекс ${videoIndex}):`,
        result,
      )

      return result
    }
    // Для шаблона "Mixed Split (2+1)" (1 сверху, 2 снизу)
    if (template.screens === 3 && template.id && template.id.includes("split-mixed-1-landscape")) {
      if (videoIndex === 0) {
        // Верхнее видео (на всю ширину)
        const result = {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "50%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "Mixed Split (2+1)" (верхнее видео, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Нижние видео (2 видео в ряд)
      const adjustedIndex = videoIndex - 1 // Смещаем индекс, так как первое видео занимает всю верхнюю часть
      const col = adjustedIndex % 2 // Каждое видео в своем столбце

      const result = {
        ...baseStyle,
        top: "50%",
        left: `${col * 50}%`,
        width: "50%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "Mixed Split (2+1)" (нижнее видео, индекс ${videoIndex}):`,
        result,
      )

      return result
    }
    // Для шаблона "Mixed Split (1+2)" (1 слева, 2 справа)
    if (template.screens === 3 && template.id && template.id.includes("split-mixed-2-landscape")) {
      if (videoIndex === 0) {
        // Левое видео (на всю высоту)
        const result = {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "50%",
          height: "100%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "Mixed Split (1+2)" (левое видео, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Правые видео (2 видео в столбец)
      const adjustedIndex = videoIndex - 1 // Смещаем индекс, так как первое видео занимает всю левую часть
      const row = adjustedIndex % 2 // Каждое видео в своей строке

      const result = {
        ...baseStyle,
        top: `${row * 50}%`,
        left: "50%",
        width: "50%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "Mixed Split (1+2)" (правое видео, индекс ${videoIndex}):`,
        result,
      )

      return result
    }
    // Для шаблона "5 screens: 1 left + 4 right" (сложное разделение справа, 1 большое слева)
    if (template.screens === 5 && template.id && template.id.includes("split-custom-5-1-landscape")) {
      if (videoIndex === 0) {
        // Большое видео слева
        const result = {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "50%",
          height: "100%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 left + 4 right" (большое видео слева, индекс ${videoIndex}):`,
          result,
        )

        return result
      }
      if (videoIndex === 1) {
        // Большое видео в верхней правой части
        const result = {
          ...baseStyle,
          top: "0",
          left: "50%",
          width: "50%",
          height: "50%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 left + 4 right" (большое видео в верхней правой части, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      if (videoIndex === 2 || videoIndex === 3) {
        // Маленькие видео в верхней части нижней правой половины
        const col = (videoIndex - 2) % 2

        const result = {
          ...baseStyle,
          top: "50%",
          left: `${50 + col * 25}%`,
          width: "25%",
          height: "25%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 left + 4 right" (маленькое видео в верхней части нижней правой половины, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      if (videoIndex === 4) {
        // Видео в нижней части нижней правой половины
        const result = {
          ...baseStyle,
          top: "75%",
          left: "50%",
          width: "50%",
          height: "25%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 left + 4 right" (видео в нижней части нижней правой половины, индекс ${videoIndex}):`,
          result,
        )

        return result
      }
    }
    // Для шаблона "5 screens: 1 right + 4 left" (сложное разделение слева, 1 большое справа)
    if (template.screens === 5 && template.id && template.id.includes("split-custom-5-2-landscape")) {
      if (videoIndex === 4) {
        // Большое видео справа
        const result = {
          ...baseStyle,
          top: "0",
          left: "50%",
          width: "50%",
          height: "100%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 right + 4 left" (большое видео справа, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      if (videoIndex === 0) {
        // Большое видео в верхней левой части
        const result = {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "50%",
          height: "50%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 right + 4 left" (большое видео в верхней левой части, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      if (videoIndex === 1 || videoIndex === 2) {
        // Маленькие видео в верхней части нижней левой половины
        const col = (videoIndex - 1) % 2

        const result = {
          ...baseStyle,
          top: "50%",
          left: `${col * 25}%`,
          width: "25%",
          height: "25%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 right + 4 left" (маленькое видео в верхней части нижней левой половины, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      if (videoIndex === 3) {
        // Видео в нижней части нижней левой половины
        const result = {
          ...baseStyle,
          top: "75%",
          left: "0",
          width: "50%",
          height: "25%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 right + 4 left" (видео в нижней части нижней левой половины, индекс ${videoIndex}):`,
          result,
        )

        return result
      }
    }
    // Для шаблона "5 screens: 1 top + 4 bottom" (2 сверху, 1 посередине, 2 снизу)
    else if (template.screens === 5 && template.id && template.id.includes("split-custom-5-3-landscape")) {
      if (videoIndex === 0 || videoIndex === 1) {
        // Верхние видео (2 в ряд)
        const col = videoIndex % 2

        const result = {
          ...baseStyle,
          top: "0",
          left: `${col * 50}%`,
          width: "50%",
          height: "33.33%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 top + 4 bottom" (верхнее видео, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      if (videoIndex === 2) {
        // Среднее видео на всю ширину
        const result = {
          ...baseStyle,
          top: "33.33%",
          left: "0",
          width: "100%",
          height: "33.33%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "5 screens: 1 top + 4 bottom" (среднее видео, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Нижние видео (2 в ряд)
      const col = (videoIndex - 3) % 2

      const result = {
        ...baseStyle,
        top: "66.66%",
        left: `${col * 50}%`,
        width: "50%",
        height: "33.33%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "5 screens: 1 top + 4 bottom" (нижнее видео, индекс ${videoIndex}):`,
        result,
      )

      return result
    }
    // Для шаблона "3 top + 1 bottom" (3 маленьких сверху, 1 большое снизу)
    if (template.screens === 4 && template.id && template.id.includes("split-3-1-bottom-landscape")) {
      if (videoIndex === 3) {
        // Большое видео снизу
        const result = {
          ...baseStyle,
          top: "50%",
          left: "0",
          width: "100%",
          height: "50%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "3 top + 1 bottom" (большое видео снизу, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Маленькие видео сверху (3 видео в ряд)
      const col = videoIndex % 3 // Каждое видео в своем столбце

      const result = {
        ...baseStyle,
        top: "0",
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "3 top + 1 bottom" (маленькое видео сверху, индекс ${videoIndex}):`,
        result,
      )

      return result
    }
    // Для шаблона "1 top + 3 bottom" (1 большое сверху, 3 маленьких снизу)
    if (template.screens === 4 && template.id && template.id.includes("split-1-3-bottom-landscape")) {
      if (videoIndex === 0) {
        // Большое видео сверху
        const result = {
          ...baseStyle,
          top: "0",
          left: "0",
          width: "100%",
          height: "50%",
          cellConfig, // Добавляем настройки ячейки
        }

        // Логируем стили для отладки
        logger.info(
          `[TemplateService] Стили для шаблона "1 top + 3 bottom" (большое видео сверху, индекс ${videoIndex}):`,
          result,
        )

        return result
      }

      // Маленькие видео снизу (3 видео в ряд)
      const adjustedIndex = videoIndex - 1 // Смещаем индекс, так как первое видео занимает всю верхнюю часть
      const col = adjustedIndex % 3 // Каждое видео в своем столбце

      const result = {
        ...baseStyle,
        top: "50%",
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(
        `[TemplateService] Стили для шаблона "1 top + 3 bottom" (маленькое видео снизу, индекс ${videoIndex}):`,
        result,
      )

      return result
    }
    // Для сетки 2x2 (4 экрана)
    if (template.screens === 4) {
      const row = Math.floor(videoIndex / 2)
      const col = videoIndex % 2
      return {
        ...baseStyle,
        top: `${row * 50}%`,
        left: `${col * 50}%`,
        width: "50%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }
    }
    // Для сетки с 8 экранами (общий случай)
    if (template.screens === 8 && (!template.id || (!template.id.includes("4x2") && !template.id.includes("2x4")))) {
      const row = Math.floor(videoIndex / 4)
      const col = videoIndex % 4
      const result = {
        ...baseStyle,
        top: `${row * 50}%`,
        left: `${col * 25}%`,
        width: "25%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(`[TemplateService] Стили для сетки с 8 экранами (общий случай, индекс ${videoIndex}):`, result)

      return result
    }
    // Для сетки 4x2 (8 экранов)
    if (template.screens === 8 && template.id && template.id.includes("4x2")) {
      const row = Math.floor(videoIndex / 4)
      const col = videoIndex % 4
      const result = {
        ...baseStyle,
        top: `${row * 50}%`,
        left: `${col * 25}%`,
        width: "25%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(`[TemplateService] Стили для сетки 4x2 (индекс ${videoIndex}):`, result)

      return result
    }
    // Для сетки 2x4 (8 экранов)
    if (template.screens === 8 && template.id && template.id.includes("2x4")) {
      const row = Math.floor(videoIndex / 2)
      const col = videoIndex % 2
      const result = {
        ...baseStyle,
        top: `${row * 25}%`,
        left: `${col * 50}%`,
        width: "50%",
        height: "25%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(`[TemplateService] Стили для сетки 2x4 (индекс ${videoIndex}):`, result)

      return result
    }
    // Для сетки 3x2 (6 экранов) - ландшафтный формат
    if (template.screens === 6 && template.id && template.id.includes("3x2") && template.id.includes("landscape")) {
      const row = Math.floor(videoIndex / 3)
      const col = videoIndex % 3
      const result = {
        ...baseStyle,
        top: `${row * 50}%`,
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "50%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(`[TemplateService] Стили для сетки 3x2 (индекс ${videoIndex}):`, result)

      return result
    }
    // Для сетки 2x3 (6 экранов) - портретный формат
    if (template.screens === 6 && template.id && template.id.includes("2x3") && template.id.includes("portrait")) {
      const row = Math.floor(videoIndex / 2)
      const col = videoIndex % 2
      const result = {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: `${col * 50}%`,
        width: "50%",
        height: "33.33%",
        cellConfig, // Добавляем настройки ячейки
      }

      // Логируем стили для отладки
      logger.info(`[TemplateService] Стили для сетки 2x3 (индекс ${videoIndex}):`, result)

      return result
    }
    // Для сетки 3x3 (9 экранов)
    if (template.screens === 9) {
      // Для портретного режима
      if (template.id.includes("portrait")) {
        const row = Math.floor(videoIndex / 3)
        const col = videoIndex % 3
        return {
          ...baseStyle,
          top: `${row * 33.33}%`,
          left: `${col * 33.33}%`,
          width: "33.33%",
          height: "33.33%",
          cellConfig, // Добавляем настройки ячейки
        }
      }
      // Для ландшафтного режима
      const row = Math.floor(videoIndex / 3)
      const col = videoIndex % 3
      return {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "33.33%",
        cellConfig, // Добавляем настройки ячейки
      }
    }
    // Для сетки 5x2 (10 экранов, ландшафтный формат)
    if (template.screens === 10 && template.id && template.id.includes("landscape")) {
      const row = Math.floor(videoIndex / 5)
      const col = videoIndex % 5
      return {
        ...baseStyle,
        top: `${row * 50}%`,
        left: `${col * 20}%`,
        width: "20%",
        height: "50%",
      }
    }
    // Для сетки 4x3 (12 экранов, ландшафтный формат)
    if (template.screens === 12 && template.id && template.id.includes("landscape")) {
      const row = Math.floor(videoIndex / 4)
      const col = videoIndex % 4
      return {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: `${col * 25}%`,
        width: "25%",
        height: "33.33%",
      }
    }
    // Для сетки 2x5 (10 экранов, вертикальный формат)
    if (template.screens === 10 && template.id && template.id.includes("portrait")) {
      const row = Math.floor(videoIndex / 2)
      const col = videoIndex % 2
      return {
        ...baseStyle,
        top: `${row * 20}%`,
        left: `${col * 50}%`,
        width: "50%",
        height: "20%",
      }
    }
    // Для сетки 3x4 (12 экранов, вертикальный формат)
    if (template.screens === 12 && template.id && template.id.includes("portrait")) {
      const row = Math.floor(videoIndex / 3)
      const col = videoIndex % 3
      return {
        ...baseStyle,
        top: `${row * 25}%`,
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "25%",
      }
    }
    // Для сетки 5x2 (10 экранов, квадратный формат)
    if (template.screens === 10 && template.id && template.id.includes("5x2-square")) {
      const row = Math.floor(videoIndex / 5)
      const col = videoIndex % 5
      return {
        ...baseStyle,
        top: `${row * 50}%`,
        left: `${col * 20}%`,
        width: "20%",
        height: "50%",
      }
    }
    // Для сетки 2x5 (10 экранов, квадратный формат)
    if (template.screens === 10 && template.id && template.id.includes("2x5-square")) {
      const row = Math.floor(videoIndex / 2)
      const col = videoIndex % 2
      return {
        ...baseStyle,
        top: `${row * 20}%`,
        left: `${col * 50}%`,
        width: "50%",
        height: "20%",
      }
    }
    // Для сетки 4x3 (12 экранов, квадратный формат)
    if (template.screens === 12 && template.id && template.id.includes("4x3-square")) {
      const row = Math.floor(videoIndex / 4)
      const col = videoIndex % 4
      return {
        ...baseStyle,
        top: `${row * 33.33}%`,
        left: `${col * 25}%`,
        width: "25%",
        height: "33.33%",
      }
    }
    // Для сетки 3x4 (12 экранов, квадратный формат)
    if (template.screens === 12 && template.id && template.id.includes("3x4-square")) {
      const row = Math.floor(videoIndex / 3)
      const col = videoIndex % 3
      return {
        ...baseStyle,
        top: `${row * 25}%`,
        left: `${col * 33.33}%`,
        width: "33.33%",
        height: "25%",
      }
    }
    // Для сетки 4x4 (16 экранов)
    if (template.screens === 16) {
      // Для портретного режима
      if (template.id.includes("portrait")) {
        const row = Math.floor(videoIndex / 4)
        const col = videoIndex % 4
        return {
          ...baseStyle,
          top: `${row * 25}%`,
          left: `${col * 25}%`,
          width: "25%",
          height: "25%",
          cellConfig, // Добавляем настройки ячейки
        }
      }
      // Для ландшафтного режима
      const row = Math.floor(videoIndex / 4)
      const col = videoIndex % 4
      return {
        ...baseStyle,
        top: `${row * 25}%`,
        left: `${col * 25}%`,
        width: "25%",
        height: "25%",
        cellConfig, // Добавляем настройки ячейки
      }
    }
    // Для сетки 5x5 (25 экранов)
    if (template.screens === 25) {
      // Для портретного режима
      if (template.id.includes("portrait")) {
        const row = Math.floor(videoIndex / 5)
        const col = videoIndex % 5
        return {
          ...baseStyle,
          top: `${row * 20}%`,
          left: `${col * 20}%`,
          width: "20%",
          height: "20%",
          cellConfig, // Добавляем настройки ячейки
        }
      }
      // Для ландшафтного режима

      const row = Math.floor(videoIndex / 5)
      const col = videoIndex % 5
      return {
        ...baseStyle,
        top: `${row * 20}%`,
        left: `${col * 20}%`,
        width: "20%",
        height: "20%",
        cellConfig, // Добавляем настройки ячейки
      }
    }
  }

  // Для настраиваемых шаблонов с возможностью изменения размеров
  // Здесь мы не задаем стили, так как они будут определены компонентом ResizableTemplate
  return {
    ...baseStyle,
    position: "relative", // Для ResizableTemplate используем relative
    width: "100%",
    height: "100%",
    cellConfig, // Добавляем настройки ячейки
  }
}

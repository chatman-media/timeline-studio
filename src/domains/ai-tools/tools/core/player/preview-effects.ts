/**
 * AI инструменты для применения эффектов и фильтров в превью с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

import type { EffectApplicationParams, PlayerToolResult } from "./types"
import { getCurrentMedia, hasLoadedMedia } from "./utils/helpers"

// Типы для операций с эффектами превью
export interface PreviewEffectsInput {
  operation: "apply_preview_effects" | "apply_preview_filters"
  effects?: EffectApplicationParams[]
  filters?: EffectApplicationParams[]
  replace?: boolean
  reason: string
}

export interface PreviewEffectsResult {
  operation: string
  success: boolean
  appliedItems: string[]
  totalActiveItems: number
  activeItems: string[]
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для применения эффектов и фильтров в превью с унифицированной обработкой ошибок
 */
export class PreviewEffectsTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("PreviewEffectsTool", logger)
  }

  /**
   * Выполняет операции с эффектами превью
   */
  public async processPreviewEffects(
    input: PreviewEffectsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<PreviewEffectsResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        const validOperations = ["apply_preview_effects", "apply_preview_filters"]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        if (data.operation === "apply_preview_effects" && (!data.effects || data.effects.length === 0)) {
          errors.push("Требуется указать effects для применения эффектов")
        }

        if (data.operation === "apply_preview_filters" && (!data.filters || data.filters.length === 0)) {
          errors.push("Требуется указать filters для применения фильтров")
        }

        if (!data.reason) {
          errors.push("Требуется указать причину применения эффектов/фильтров")
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      // Проверка загруженного медиа
      if (!hasLoadedMedia()) {
        throw new Error("Нет загруженного медиа для применения эффектов/фильтров")
      }

      const currentMedia = getCurrentMedia()
      if (!currentMedia) {
        throw new Error("Не удалось получить текущее медиа")
      }

      let result: PreviewEffectsResult

      switch (input.operation) {
        case "apply_preview_effects":
          result = await this.applyEffectsInternal(input, currentMedia)
          break
        case "apply_preview_filters":
          result = await this.applyFiltersInternal(input, currentMedia)
          break
        default:
          throw new Error(`Неподдерживаемая операция: ${input.operation}`)
      }

      return result
    }, options)
  }

  private async applyEffectsInternal(params: PreviewEffectsInput, currentMedia: any): Promise<PreviewEffectsResult> {
    const { effects = [], replace = false } = params

    // Получаем текущие эффекты
    const currentEffects = currentMedia.activeEffects || []
    const newEffects = replace ? [] : [...currentEffects]

    // Применяем новые эффекты
    const appliedEffects: string[] = []
    for (const effect of effects) {
      try {
        // Проверяем, что эффект существует
        if (!effect.effectId) {
          continue
        }

        // Добавляем эффект к списку активных
        if (!newEffects.includes(effect.effectId)) {
          newEffects.push(effect.effectId)
          appliedEffects.push(effect.effectId)
        }

        // Здесь бы был код применения эффекта к preview
        // Пока что просто логируем
        console.log(`Применение эффекта ${effect.effectId} с параметрами:`, effect.parameters)
      } catch (error) {
        console.warn(`Ошибка применения эффекта ${effect.effectId}:`, error)
      }
    }

    // Обновляем активные эффекты у медиа
    currentMedia.activeEffects = newEffects

    return {
      operation: "apply_preview_effects",
      success: true,
      appliedItems: appliedEffects,
      totalActiveItems: newEffects.length,
      activeItems: newEffects,
      message: `Применено эффектов: ${appliedEffects.length}`,
      recommendations: [
        "Проверьте результат в плеере",
        "Настройте параметры эффектов при необходимости",
        "Добавьте эффекты в timeline для постоянного использования",
      ],
    }
  }

  private async applyFiltersInternal(params: PreviewEffectsInput, currentMedia: any): Promise<PreviewEffectsResult> {
    const { filters = [], replace = false } = params

    // Получаем текущие фильтры
    const currentFilters = currentMedia.activeFilters || []
    const newFilters = replace ? [] : [...currentFilters]

    // Применяем новые фильтры
    const appliedFilters: string[] = []
    for (const filter of filters) {
      try {
        // Проверяем, что фильтр существует
        if (!filter.effectId) {
          // используем effectId для совместимости
          continue
        }

        // Добавляем фильтр к списку активных
        if (!newFilters.includes(filter.effectId)) {
          newFilters.push(filter.effectId)
          appliedFilters.push(filter.effectId)
        }

        // Здесь бы был код применения фильтра к preview
        console.log(`Применение фильтра ${filter.effectId} с параметрами:`, filter.parameters)
      } catch (error) {
        console.warn(`Ошибка применения фильтра ${filter.effectId}:`, error)
      }
    }

    // Обновляем активные фильтры у медиа
    currentMedia.activeFilters = newFilters

    return {
      operation: "apply_preview_filters",
      success: true,
      appliedItems: appliedFilters,
      totalActiveItems: newFilters.length,
      activeItems: newFilters,
      message: `Применено фильтров: ${appliedFilters.length}`,
      recommendations: [
        "Проверьте результат в плеере",
        "Настройте интенсивность фильтров при необходимости",
        "Добавьте фильтры в timeline для постоянного использования",
      ],
    }
  }
}

// Создаем singleton экземпляр
const previewEffectsTool = new PreviewEffectsTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executePreviewEffectsTool(
  operation: PreviewEffectsInput["operation"],
  params: Omit<PreviewEffectsInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<PreviewEffectsResult>> {
  return previewEffectsTool.processPreviewEffects({ operation, ...params }, options)
}

/**
 * Функции для обратной совместимости
 */
export async function applyPreviewEffects(params: {
  effects: EffectApplicationParams[]
  replace?: boolean
}): Promise<PlayerToolResult> {
  const result = await previewEffectsTool.processPreviewEffects({
    operation: "apply_preview_effects",
    effects: params.effects,
    replace: params.replace,
    reason: "Применение эффектов для превью",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        appliedEffects: result.data.appliedItems,
        totalActiveEffects: result.data.totalActiveItems,
        activeEffects: result.data.activeItems,
      },
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка применения эффектов",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

export async function applyPreviewFilters(params: {
  filters: EffectApplicationParams[]
  replace?: boolean
}): Promise<PlayerToolResult> {
  const result = await previewEffectsTool.processPreviewEffects({
    operation: "apply_preview_filters",
    filters: params.filters,
    replace: params.replace,
    reason: "Применение фильтров для превью",
  })

  if (result.success) {
    return {
      success: true,
      message: result.data.message,
      data: {
        appliedFilters: result.data.appliedItems,
        totalActiveFilters: result.data.totalActiveItems,
        activeFilters: result.data.activeItems,
      },
    }
  }
  return {
    success: false,
    message: result.error?.message || "Ошибка применения фильтров",
    errors: [result.error?.message || "Неизвестная ошибка"],
  }
}

// Экспорт для обратной совместимости
export const applyPreviewEffectsTool: any = {
  name: "apply_preview_effects",
  description: "Применяет эффекты к медиа в плеере для превью",
  input_schema: {
    type: "object",
    properties: {
      effects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            effectId: {
              type: "string",
              description: "ID эффекта",
            },
            parameters: {
              type: "object",
              description: "Параметры эффекта",
            },
            intensity: {
              type: "number",
              description: "Интенсивность эффекта (0-1)",
              default: 1,
            },
          },
          required: ["effectId"],
        },
      },
      replace: {
        type: "boolean",
        description: "Заменить все существующие эффекты",
        default: false,
      },
    },
    required: ["effects"],
  },
}

export const applyPreviewFiltersTool: any = {
  name: "apply_preview_filters",
  description: "Применяет фильтры к медиа в плеере для превью",
  input_schema: {
    type: "object",
    properties: {
      filters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            filterId: {
              type: "string",
              description: "ID фильтра",
            },
            parameters: {
              type: "object",
              description: "Параметры фильтра",
            },
            intensity: {
              type: "number",
              description: "Интенсивность фильтра (0-1)",
              default: 1,
            },
          },
          required: ["filterId"],
        },
      },
      replace: {
        type: "boolean",
        description: "Заменить все существующие фильтры",
        default: false,
      },
    },
    required: ["filters"],
  },
}

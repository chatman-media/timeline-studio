/**
 * Утилиты для экспорта и импорта планов монтажа
 */

import { container } from "@/core"
import { createLogger } from "@/lib/tauri-logger"

import type { MontagePlan } from "../types/montage-plan"
import type { MontageTemplate } from "../types/montage-templates"
import { validateMontagePlan } from "./montage-plan-parser"

const logger = createLogger("MontagePlanIO")

interface ExportTemplateOptions {
  category?: MontageTemplate["category"]
  tags?: string[]
  icon?: string
}

/**
 * Экспортировать план монтажа в JSON файл
 */
export async function exportMontagePlan(plan: MontagePlan): Promise<string | null> {
  const platform = container.hasPlatform() ? container.getPlatform() : null
  if (!platform) {
    throw new Error("Platform service not available")
  }

  try {
    logger.infoSync("[MontagePlanIO] Exporting montage plan", { planId: plan.id })

    // Генерируем имя файла по умолчанию
    const defaultFileName = `${plan.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`

    // Открываем диалог сохранения файла
    const filePath = await platform.showSaveDialog({
      filters: [
        {
          name: "Montage Plan",
          extensions: ["json"],
        },
      ],
      defaultPath: defaultFileName,
    })

    if (!filePath) {
      logger.infoSync("[MontagePlanIO] Export cancelled by user")
      return null
    }

    // Сериализуем план
    const planJSON = JSON.stringify(plan, null, 2)

    // Сохраняем файл
    await platform.writeTextFile(filePath, planJSON)

    logger.infoSync("[MontagePlanIO] Plan exported successfully", { filePath })
    return filePath
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to export plan", error as Record<string, unknown>)
    throw error
  }
}

/**
 * Импортировать план монтажа из JSON файла
 */
export async function importMontagePlan(): Promise<MontagePlan | null> {
  const platform = container.hasPlatform() ? container.getPlatform() : null
  if (!platform) {
    throw new Error("Platform service not available")
  }

  try {
    logger.infoSync("[MontagePlanIO] Importing montage plan")

    // Открываем диалог выбора файла
    const selectedPaths = await platform.showOpenDialog({
      filters: [
        {
          name: "Montage Plan",
          extensions: ["json"],
        },
      ],
      multiple: false,
    })

    if (!selectedPaths || selectedPaths.length === 0) {
      logger.infoSync("[MontagePlanIO] Import cancelled by user")
      return null
    }

    const filePath = selectedPaths[0]

    // Читаем файл
    const fileContent = await platform.readTextFile(filePath)

    // Парсим JSON
    const planData = JSON.parse(fileContent)

    // Восстанавливаем даты из строк
    const plan: MontagePlan = {
      ...planData,
      createdAt: new Date(planData.createdAt),
      updatedAt: planData.updatedAt ? new Date(planData.updatedAt) : undefined,
    }

    // Валидируем план
    const validation = validateMontagePlan(plan)
    if (!validation.isValid) {
      logger.errorSync("[MontagePlanIO] Imported plan is invalid", {
        errors: validation.errors,
      })
      throw new Error(`Invalid montage plan: ${validation.errors.join(", ")}`)
    }

    logger.infoSync("[MontagePlanIO] Plan imported successfully", {
      planId: plan.id,
      clipsCount: plan.clips.length,
    })

    return plan
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to import plan", error as Record<string, unknown>)
    throw error
  }
}

/**
 * Экспортировать несколько планов в один файл
 */
export async function exportMultiplePlans(plans: MontagePlan[]): Promise<string | null> {
  const platform = container.hasPlatform() ? container.getPlatform() : null
  if (!platform) {
    throw new Error("Platform service not available")
  }

  try {
    logger.infoSync("[MontagePlanIO] Exporting multiple plans", { count: plans.length })

    const filePath = await platform.showSaveDialog({
      filters: [
        {
          name: "Montage Plans",
          extensions: ["json"],
        },
      ],
      defaultPath: "montage-plans.json",
    })

    if (!filePath) {
      return null
    }

    // Экспортируем как простой массив (по требованию тестов)
    const plansJSON = JSON.stringify(plans, null, 2)

    await platform.writeTextFile(filePath, plansJSON)

    logger.infoSync("[MontagePlanIO] Multiple plans exported successfully")
    return filePath
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to export multiple plans", error as Record<string, unknown>)
    throw error
  }
}

/**
 * Импортировать несколько планов из файла
 */
export async function importMultiplePlans(): Promise<MontagePlan[] | null> {
  const platform = container.hasPlatform() ? container.getPlatform() : null
  if (!platform) {
    throw new Error("Platform service not available")
  }

  try {
    logger.infoSync("[MontagePlanIO] Importing multiple plans")

    const selectedPaths = await platform.showOpenDialog({
      filters: [
        {
          name: "Montage Plans",
          extensions: ["json"],
        },
      ],
      multiple: false,
    })

    if (!selectedPaths || selectedPaths.length === 0) {
      return null
    }

    const filePath = selectedPaths[0]
    const fileContent = await platform.readTextFile(filePath)
    const data = JSON.parse(fileContent)

    // Поддерживаем как массив, так и одиночный план
    let plansData: any[]
    if (Array.isArray(data)) {
      plansData = data
    } else {
      // Если это одиночный план, оборачиваем в массив
      plansData = [data]
    }

    // Восстанавливаем даты для каждого плана
    const plans: MontagePlan[] = plansData.map((planData: any) => ({
      ...planData,
      createdAt: new Date(planData.createdAt),
      updatedAt: planData.updatedAt ? new Date(planData.updatedAt) : undefined,
    }))

    logger.infoSync("[MontagePlanIO] Multiple plans imported successfully", {
      count: plans.length,
    })

    return plans
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to import multiple plans", error as Record<string, unknown>)
    throw error
  }
}

/**
 * Экспортировать план как шаблон (без привязки к конкретным файлам)
 */
export async function exportPlanAsTemplate(plan: MontagePlan, options?: ExportTemplateOptions): Promise<string | null> {
  const platform = container.hasPlatform() ? container.getPlatform() : null
  if (!platform) {
    throw new Error("Platform service not available")
  }

  try {
    const avgClipDuration =
      plan.clips.length > 0 ? plan.clips.reduce((sum, c) => sum + c.duration, 0) / plan.clips.length : 5

    // Создаем шаблон из плана
    const template: MontageTemplate = {
      id: `template-${Date.now()}`,
      name: plan.name,
      description: plan.description || `Template based on ${plan.name}`,
      style: plan.style,
      icon: options?.icon || "📋",
      category: options?.category || "custom",
      tags: options?.tags || ["custom"],
      isBuiltIn: false,
      createdAt: new Date(),

      parameters: {
        targetDuration: plan.targetDuration,
        clipDuration: {
          min: Math.max(1, avgClipDuration * 0.5),
          max: avgClipDuration * 2,
          preferred: avgClipDuration,
        },
        clipCount: {
          min: Math.max(1, plan.clips.length - 2),
          max: plan.clips.length + 5,
          preferred: plan.clips.length,
        },
      },

      clipRules: {
        qualityThreshold: 0.7,
        contentRequirements: {},
        scenePriority: {
          action: 0.5,
          static: 0.5,
          closeup: 0.5,
          wide: 0.5,
        },
        diversity: {
          avoidRepetition: true,
          mixSceneTypes: true,
        },
      },

      transitionRules: {
        defaultType: plan.transitions[0]?.type || "cross_dissolve",
        duration: plan.transitions[0]?.duration || 0.5,
        variety: {
          enabled: plan.transitions.length > 1,
          types: plan.transitions.map((t) => t.type),
        },
        frequency: plan.clips.length > 1 ? plan.transitions.length / (plan.clips.length - 1) : 0,
      },

      musicSettings: plan.music
        ? {
            style: plan.music.style || "upbeat",
            volume: plan.music.volume || 0.5,
            fadeIn: plan.music.fadeIn || 2,
            fadeOut: plan.music.fadeOut || 2,
          }
        : undefined,
    }

    const filePath = await platform.showSaveDialog({
      filters: [
        {
          name: "Montage Template",
          extensions: ["json"],
        },
      ],
      defaultPath: `${plan.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-template.json`,
    })

    if (!filePath) {
      return null
    }

    await platform.writeTextFile(filePath, JSON.stringify(template, null, 2))

    logger.infoSync("[MontagePlanIO] Plan exported as template")
    return filePath
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to export plan as template", error as Record<string, unknown>)
    throw error
  }
}

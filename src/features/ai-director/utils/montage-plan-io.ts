/**
 * Утилиты для экспорта и импорта планов монтажа
 */

import { open, save } from "@tauri-apps/plugin-dialog"
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"

import { createLogger } from "@/lib/tauri-logger"

import type { MontagePlan } from "../types/montage-plan"
import { validateMontagePlan } from "./montage-plan-parser"

const logger = createLogger("MontagePlanIO")

/**
 * Экспортировать план монтажа в JSON файл
 */
export async function exportMontagePlan(plan: MontagePlan): Promise<boolean> {
  try {
    logger.infoSync("[MontagePlanIO] Exporting montage plan", { planId: plan.id })

    // Открываем диалог сохранения файла
    const filePath = await save({
      filters: [
        {
          name: "Montage Plan",
          extensions: ["json"],
        },
      ],
      defaultPath: `${plan.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`,
    })

    if (!filePath) {
      logger.infoSync("[MontagePlanIO] Export cancelled by user")
      return false
    }

    // Сериализуем план
    const planJSON = JSON.stringify(plan, null, 2)

    // Сохраняем файл
    await writeTextFile(filePath, planJSON)

    logger.infoSync("[MontagePlanIO] Plan exported successfully", { filePath })
    return true
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to export plan", error as Record<string, unknown>)
    return false
  }
}

/**
 * Импортировать план монтажа из JSON файла
 */
export async function importMontagePlan(): Promise<MontagePlan | null> {
  try {
    logger.infoSync("[MontagePlanIO] Importing montage plan")

    // Открываем диалог выбора файла
    const filePath = await open({
      filters: [
        {
          name: "Montage Plan",
          extensions: ["json"],
        },
      ],
      multiple: false,
    })

    if (!filePath) {
      logger.infoSync("[MontagePlanIO] Import cancelled by user")
      return null
    }

    // Читаем файл
    const fileContent = await readTextFile(filePath as string)

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
    return null
  }
}

/**
 * Экспортировать несколько планов в один файл
 */
export async function exportMultiplePlans(plans: MontagePlan[]): Promise<boolean> {
  try {
    logger.infoSync("[MontagePlanIO] Exporting multiple plans", { count: plans.length })

    const filePath = await save({
      filters: [
        {
          name: "Montage Plans Collection",
          extensions: ["json"],
        },
      ],
      defaultPath: "montage_plans_collection.json",
    })

    if (!filePath) {
      return false
    }

    const collection = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      plans,
    }

    await writeTextFile(filePath, JSON.stringify(collection, null, 2))

    logger.infoSync("[MontagePlanIO] Multiple plans exported successfully")
    return true
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to export multiple plans", error as Record<string, unknown>)
    return false
  }
}

/**
 * Импортировать несколько планов из файла
 */
export async function importMultiplePlans(): Promise<MontagePlan[]> {
  try {
    logger.infoSync("[MontagePlanIO] Importing multiple plans")

    const filePath = await open({
      filters: [
        {
          name: "Montage Plans Collection",
          extensions: ["json"],
        },
      ],
      multiple: false,
    })

    if (!filePath) {
      return []
    }

    const fileContent = await readTextFile(filePath as string)
    const collection = JSON.parse(fileContent)

    // Проверяем формат
    if (!collection.plans || !Array.isArray(collection.plans)) {
      throw new Error("Invalid collection format")
    }

    // Восстанавливаем даты для каждого плана
    const plans: MontagePlan[] = collection.plans.map((planData: any) => ({
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
    return []
  }
}

/**
 * Экспортировать план как шаблон (без привязки к конкретным файлам)
 */
export async function exportPlanAsTemplate(plan: MontagePlan): Promise<boolean> {
  try {
    // Создаем шаблонную версию плана без конкретных путей к файлам
    const template = {
      name: plan.name,
      description: plan.description,
      style: plan.style,
      targetDuration: plan.targetDuration,
      clipCount: plan.clips.length,
      averageClipDuration: plan.clips.reduce((sum, c) => sum + c.duration, 0) / plan.clips.length,
      transitions: plan.transitions.map((t) => ({
        type: t.type,
        duration: t.duration,
      })),
      music: plan.music,
      texts: plan.texts,
    }

    const filePath = await save({
      filters: [
        {
          name: "Montage Template",
          extensions: ["json"],
        },
      ],
      defaultPath: `${plan.name}_template.json`,
    })

    if (!filePath) {
      return false
    }

    await writeTextFile(filePath, JSON.stringify(template, null, 2))

    logger.infoSync("[MontagePlanIO] Plan exported as template")
    return true
  } catch (error) {
    logger.errorSync("[MontagePlanIO] Failed to export plan as template", error as Record<string, unknown>)
    return false
  }
}

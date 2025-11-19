/**
 * Парсинг и валидация планов монтажа от AI
 */

import { createLogger } from "@/lib/tauri-logger"

import type { MontagePlan, MontageStyle, TransitionType } from "../types/montage-plan"

const logger = createLogger("MontagePlanParser")

interface ParseResult {
  success: boolean
  plan?: MontagePlan
  error?: string
}

/**
 * Парсит JSON ответ от AI в MontagePlan
 * Возвращает объект с результатом парсинга
 */
export function parseMontagePlanFromAI(aiResponse: string): ParseResult {
  try {
    // Проверка на пустую строку
    if (!aiResponse || aiResponse.trim().length === 0) {
      return {
        success: false,
        error: "Response is empty",
      }
    }

    // Извлекаем JSON из markdown блоков если есть
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/)

    let jsonText = jsonMatch ? jsonMatch[1] : aiResponse

    // Пробуем найти JSON объект в тексте
    const objectMatch = jsonText.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      jsonText = objectMatch[0]
    }

    let planData: any
    try {
      planData = JSON.parse(jsonText)
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      }
    }

    logger.infoSync("[MontagePlanParser] Parsing AI response", {
      hasClips: Array.isArray(planData.clips),
      clipsCount: planData.clips?.length || 0,
    })

    // Валидация обязательных полей
    if (!planData.clips || !Array.isArray(planData.clips)) {
      return {
        success: false,
        error: "Missing or invalid clips array",
      }
    }

    // Обработка музыки
    const musicData = planData.music || planData.musicSettings
    const musicSettings = musicData
      ? {
          style: musicData.style,
          volume: musicData.volume || 0.5,
          startTime: musicData.start_time || musicData.startTime || 0,
          fadeIn: musicData.fade_in || musicData.fadeIn || 2,
          fadeOut: musicData.fade_out || musicData.fadeOut || 2,
        }
      : undefined

    // Обработка текста
    const textData = planData.texts || planData.textSettings
    const textsArray: any = textData
      ? (Array.isArray(textData) ? textData : [textData]).map((text: any) => ({
          content: text.content || text.text || text.titleText || "",
          startTime: Number.parseFloat(text.start_time || text.startTime || 0),
          duration: Number.parseFloat(text.duration || text.titleDuration || 3),
          style: text.style || "subtitle",
          position: text.position || "bottom",
        }))
      : undefined

    // Создаем textSettings из данных (для обратной совместимости)
    const textSettings = textData
      ? {
          titleText: textData.titleText || textData.content || textData.text,
          titleDuration: Number.parseFloat(textData.titleDuration || textData.duration || 3),
          creditsText: textData.creditsText,
        }
      : undefined

    // Создаем валидный MontagePlan
    const plan: MontagePlan = {
      id: planData.id || `montage-${Date.now()}`,
      name: planData.name || "AI Generated Montage",
      style: validateMontageStyle(planData.style),
      targetDuration: planData.target_duration || planData.targetDuration || planData.totalDuration || 60,
      actualDuration: planData.actual_duration || planData.actualDuration,
      totalDuration: planData.totalDuration,
      clips: planData.clips.map((clip: any, index: number) => ({
        fileId: clip.file_id || clip.fileId || `file-${index}`,
        filePath: clip.file || clip.file_path || clip.filePath || clip.sourceFile || "",
        startTime: Number.parseFloat(clip.start || clip.start_time || clip.startTime || clip.inPoint || 0),
        endTime: Number.parseFloat(clip.end || clip.end_time || clip.endTime || 0),
        duration:
          Number.parseFloat(clip.duration || 0) ||
          Number.parseFloat(clip.end || clip.endTime || 0) - Number.parseFloat(clip.start || clip.startTime || 0),
        reason: clip.reason || "Selected by AI",
        qualityScore: clip.quality_score || clip.qualityScore,
        metadata: clip.metadata,
      })),
      transitions: parseTransitions(planData.transitions),
      music: musicSettings,
      musicSettings: musicSettings,
      texts: textsArray,
      textSettings: textSettings,
      description: planData.description,
      createdAt: planData.createdAt ? new Date(planData.createdAt) : new Date(),
      metadata: {
        sourceFilesCount: planData.metadata?.source_files_count || planData.metadata?.sourceFilesCount || 0,
        usedFilesCount: planData.metadata?.used_files_count || planData.metadata?.usedFilesCount || 0,
        usagePercentage: planData.metadata?.usage_percentage || planData.metadata?.usagePercentage,
      },
    }

    logger.infoSync("[MontagePlanParser] Plan parsed successfully", {
      planId: plan.id,
      clipsCount: plan.clips.length,
      transitionsCount: plan.transitions.length,
      style: plan.style,
    })

    return {
      success: true,
      plan,
    }
  } catch (error) {
    logger.errorSync("[MontagePlanParser] Failed to parse AI response", error as Record<string, unknown>)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Валидирует стиль монтажа
 */
function validateMontageStyle(style: any): MontageStyle {
  const validStyles: MontageStyle[] = ["dynamic", "calm", "balanced", "cinematic", "vlog", "highlights", "tutorial"]

  if (typeof style === "string" && validStyles.includes(style as MontageStyle)) {
    return style as MontageStyle
  }

  return "balanced"
}

/**
 * Парсит переходы
 */
function parseTransitions(transitions: any): any[] {
  if (!transitions) return []

  if (Array.isArray(transitions)) {
    // Если массив строк с типами переходов
    if (typeof transitions[0] === "string") {
      return transitions.map((type: string, index: number) => ({
        type: validateTransitionType(type),
        duration: 0.5,
        afterClipIndex: index,
      }))
    }

    // Если массив объектов переходов
    return transitions.map((t: any, index: number) => ({
      type: validateTransitionType(t.type),
      duration: Number.parseFloat(t.duration || 0.5),
      afterClipIndex: t.after_clip_index ?? t.afterClipIndex ?? index,
      atTime: t.at_time ?? t.atTime,
    }))
  }

  return []
}

/**
 * Валидирует тип перехода
 */
function validateTransitionType(type: any): TransitionType {
  const validTypes: TransitionType[] = ["cut", "cross_dissolve", "fade_to_black", "wipe", "slide"]

  if (typeof type === "string" && validTypes.includes(type as TransitionType)) {
    return type as TransitionType
  }

  return "cross_dissolve"
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Валидация плана монтажа
 */
export function validateMontagePlan(plan: MontagePlan): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Проверка обязательных полей
  if (!plan.id || !plan.name) {
    errors.push("Plan must have id and name")
  }

  if (!plan.style) {
    errors.push("Plan must have style")
  } else {
    const validStyles: MontageStyle[] = ["dynamic", "calm", "balanced", "cinematic", "vlog", "highlights", "tutorial"]
    if (!validStyles.includes(plan.style)) {
      errors.push(`Invalid style: ${plan.style}`)
    }
  }

  // Проверка клипов
  if (!plan.clips || plan.clips.length === 0) {
    warnings.push("Plan contains no clips")
  } else {
    for (const [index, clip] of plan.clips.entries()) {
      if (!clip.filePath || clip.filePath.trim().length === 0) {
        errors.push(`Clip ${index}: missing or empty source file path`)
      }

      if (clip.startTime < 0) {
        errors.push(`Clip ${index}: start time must be >= 0`)
      }

      if (clip.endTime < clip.startTime) {
        errors.push(`Clip ${index}: end time must be >= start time`)
      }

      if (clip.duration <= 0) {
        errors.push(`Clip ${index}: duration must be > 0`)
      }

      // Проверка на перекрытие клипов
      for (let j = index + 1; j < plan.clips.length; j++) {
        const other = plan.clips[j]
        if (
          (clip.startTime >= other.startTime && clip.startTime < other.startTime + other.duration) ||
          (other.startTime >= clip.startTime && other.startTime < clip.startTime + clip.duration)
        ) {
          warnings.push(`Clips ${index} and ${j} may overlap on timeline`)
        }
      }
    }
  }

  // Проверка переходов
  if (plan.transitions && plan.transitions.length > 0) {
    for (const [index, transition] of plan.transitions.entries()) {
      const totalDuration = plan.actualDuration || plan.totalDuration || plan.targetDuration

      if (transition.atTime !== undefined && transition.atTime > totalDuration) {
        errors.push(`Transition ${index} at ${transition.atTime}s is beyond total duration ${totalDuration}s`)
      }

      if (transition.duration < 0) {
        errors.push(`Transition ${index}: duration must be >= 0`)
      }
    }
  }

  // Проверка общей длительности
  if (plan.targetDuration <= 0) {
    errors.push("Target duration must be > 0")
  }

  const effectiveDuration = plan.actualDuration || plan.totalDuration
  if (effectiveDuration && plan.clips.length > 0) {
    const calculatedDuration = plan.clips.reduce((sum, clip) => sum + clip.duration, 0)
    const diff = Math.abs(calculatedDuration - effectiveDuration)

    if (diff > 1) {
      // Допуск 1 секунда
      warnings.push(
        `Actual duration (${effectiveDuration}s) doesn't match sum of clip durations (${calculatedDuration}s)`,
      )
    }
  }

  // Проверка музыки (поддерживаем оба поля: music и musicSettings)
  const musicData = plan.music || plan.musicSettings
  if (musicData) {
    if (musicData.volume !== undefined && (musicData.volume < 0 || musicData.volume > 1.0)) {
      errors.push("Music volume must be between 0 and 1.0")
    }

    if (musicData.fadeIn !== undefined && musicData.fadeIn < 0) {
      errors.push("Music fadeIn must be >= 0")
    }

    if (musicData.fadeOut !== undefined && musicData.fadeOut < 0) {
      errors.push("Music fadeOut must be >= 0")
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Создает пример плана монтажа для тестирования
 */
export function createSampleMontagePlan(): MontagePlan {
  return {
    id: "sample-plan",
    name: "Sample Montage",
    style: "dynamic",
    targetDuration: 120,
    actualDuration: 118,
    clips: [
      {
        fileId: "file-1",
        filePath: "/path/to/video1.mp4",
        startTime: 10.5,
        endTime: 25.3,
        duration: 14.8,
        reason: "High action scene with good composition",
        qualityScore: 0.92,
      },
      {
        fileId: "file-2",
        filePath: "/path/to/video2.mp4",
        startTime: 5.0,
        endTime: 18.5,
        duration: 13.5,
        reason: "Key moment with speech detected",
        qualityScore: 0.87,
      },
    ],
    transitions: [
      {
        type: "cross_dissolve",
        duration: 1.0,
        afterClipIndex: 0,
      },
    ],
    music: {
      style: "upbeat",
      volume: 0.3,
      startTime: 0,
      fadeIn: 2,
      fadeOut: 3,
    },
    description: "Dynamic 2-minute montage with action scenes",
    createdAt: new Date(),
    metadata: {
      sourceFilesCount: 5,
      usedFilesCount: 2,
      usagePercentage: 40,
    },
  }
}

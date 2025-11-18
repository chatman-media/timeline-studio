/**
 * Парсинг и валидация планов монтажа от AI
 */

import { createLogger } from "@/lib/tauri-logger"

import type { MontagePlan, MontageStyle, TransitionType } from "../types/montage-plan"

const logger = createLogger("MontagePlanParser")

/**
 * Парсит JSON ответ от AI в MontagePlan
 */
export function parseMontagePlanFromAI(aiResponse: string): MontagePlan | null {
  try {
    // Извлекаем JSON из markdown блоков если есть
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/)

    let jsonText = jsonMatch ? jsonMatch[1] : aiResponse

    // Пробуем найти JSON объект в тексте
    const objectMatch = jsonText.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      jsonText = objectMatch[0]
    }

    const planData = JSON.parse(jsonText)

    logger.infoSync("[MontagePlanParser] Parsing AI response", {
      hasClips: Array.isArray(planData.clips),
      clipsCount: planData.clips?.length || 0,
    })

    // Валидация обязательных полей
    if (!planData.clips || !Array.isArray(planData.clips)) {
      throw new Error("Missing or invalid clips array")
    }

    // Создаем валидный MontagePlan
    const plan: MontagePlan = {
      id: `montage-${Date.now()}`,
      name: planData.name || "AI Generated Montage",
      style: validateMontageStyle(planData.style),
      targetDuration: planData.target_duration || planData.targetDuration || 60,
      actualDuration: planData.actual_duration || planData.actualDuration,
      clips: planData.clips.map((clip: any, index: number) => ({
        fileId: clip.file_id || clip.fileId || `file-${index}`,
        filePath: clip.file || clip.file_path || clip.filePath || "",
        startTime: Number.parseFloat(clip.start || clip.start_time || clip.startTime || 0),
        endTime: Number.parseFloat(clip.end || clip.end_time || clip.endTime || 0),
        duration:
          Number.parseFloat(clip.duration || 0) ||
          Number.parseFloat(clip.end || clip.endTime || 0) - Number.parseFloat(clip.start || clip.startTime || 0),
        reason: clip.reason || "Selected by AI",
        qualityScore: clip.quality_score || clip.qualityScore,
        metadata: clip.metadata,
      })),
      transitions: parseTransitions(planData.transitions),
      music: planData.music
        ? {
            style: planData.music.style,
            volume: planData.music.volume || 0.5,
            startTime: planData.music.start_time || planData.music.startTime || 0,
            fadeIn: planData.music.fade_in || planData.music.fadeIn || 2,
            fadeOut: planData.music.fade_out || planData.music.fadeOut || 2,
          }
        : undefined,
      texts: planData.texts
        ? planData.texts.map((text: any) => ({
            content: text.content || text.text || "",
            startTime: Number.parseFloat(text.start_time || text.startTime || 0),
            duration: Number.parseFloat(text.duration || 3),
            style: text.style || "subtitle",
            position: text.position || "bottom",
          }))
        : undefined,
      description: planData.description,
      createdAt: new Date(),
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

    return plan
  } catch (error) {
    logger.errorSync("[MontagePlanParser] Failed to parse AI response", error as Record<string, unknown>)
    return null
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

/**
 * Валидация плана монтажа
 */
export function validateMontagePlan(plan: MontagePlan): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!plan.clips || plan.clips.length === 0) {
    errors.push("Plan must contain at least one clip")
  }

  for (const [index, clip] of plan.clips.entries()) {
    if (!clip.filePath) {
      errors.push(`Clip ${index}: missing file path`)
    }

    if (clip.startTime < 0) {
      errors.push(`Clip ${index}: start time must be >= 0`)
    }

    if (clip.endTime <= clip.startTime) {
      errors.push(`Clip ${index}: end time must be > start time`)
    }

    if (clip.duration <= 0) {
      errors.push(`Clip ${index}: duration must be > 0`)
    }
  }

  if (plan.targetDuration <= 0) {
    errors.push("Target duration must be > 0")
  }

  return {
    isValid: errors.length === 0,
    errors,
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

/**
 * Hook для применения шаблонов монтажа
 * Генерирует план монтажа на основе шаблона и результатов анализа
 */

import { useCallback } from "react"

import { createLogger } from "@/lib/tauri-logger"

import type { FileAnalysisProgress } from "../types/analysis-progress"
import type { MontageClip, MontagePlan } from "../types/montage-plan"
import type { MontageTemplate } from "../types/montage-templates"

const logger = createLogger("useMontageTemplate")

export interface UseMontageTemplateReturn {
  /** Сгенерировать план на основе шаблона */
  generatePlanFromTemplate: (template: MontageTemplate, filesProgress: FileAnalysisProgress[]) => MontagePlan | null
}

/**
 * Hook для работы с шаблонами монтажа
 */
export function useMontageTemplate(): UseMontageTemplateReturn {
  /**
   * Генерирует план монтажа на основе шаблона
   */
  const generatePlanFromTemplate = useCallback(
    (template: MontageTemplate, filesProgress: FileAnalysisProgress[]): MontagePlan | null => {
      try {
        logger.infoSync("[useMontageTemplate] Generating plan from template", {
          templateId: template.id,
          filesCount: filesProgress.length,
        })

        // Фильтруем завершенные файлы
        const completedFiles = filesProgress.filter((f) => f.status === "completed")

        if (completedFiles.length === 0) {
          logger.errorSync("[useMontageTemplate] No completed files available")
          return null
        }

        // Собираем все доступные сегменты из анализа
        const availableSegments: Array<{
          file: FileAnalysisProgress
          startTime: number
          endTime: number
          duration: number
          qualityScore: number
        }> = []

        for (const file of completedFiles) {
          // Проверяем наличие анализа сцен
          const sceneAnalysis = file.analyzers.find((a) => a.type === "scene_detection")
          if (sceneAnalysis?.result?.scenes) {
            // Добавляем каждую сцену как потенциальный сегмент
            for (const scene of sceneAnalysis.result.scenes) {
              availableSegments.push({
                file,
                startTime: scene.start_time,
                endTime: scene.end_time,
                duration: scene.end_time - scene.start_time,
                qualityScore: scene.score || 0.5,
              })
            }
          } else {
            // Если нет анализа сцен, используем весь файл
            const duration = file.duration || 10
            availableSegments.push({
              file,
              startTime: 0,
              endTime: duration,
              duration,
              qualityScore: 0.6,
            })
          }
        }

        // Фильтруем сегменты по правилам шаблона
        let filteredSegments = availableSegments.filter(
          (seg) => seg.qualityScore >= template.clipRules.qualityThreshold,
        )

        // Фильтруем по длительности клипа
        filteredSegments = filteredSegments.filter(
          (seg) =>
            seg.duration >= template.parameters.clipDuration.min &&
            seg.duration <= template.parameters.clipDuration.max,
        )

        if (filteredSegments.length === 0) {
          logger.errorSync("[useMontageTemplate] No segments match template requirements")
          return null
        }

        // Сортируем по качеству
        filteredSegments.sort((a, b) => b.qualityScore - a.qualityScore)

        // Выбираем нужное количество клипов
        const targetClipCount = Math.min(template.parameters.clipCount.preferred, filteredSegments.length)
        const selectedSegments = filteredSegments.slice(0, targetClipCount)

        // Создаем клипы
        const clips: MontageClip[] = selectedSegments.map((seg, _index) => ({
          fileId: seg.file.id,
          filePath: seg.file.path,
          startTime: seg.startTime,
          endTime: seg.endTime,
          duration: seg.duration,
          reason: `Selected by template: ${template.name}`,
          qualityScore: seg.qualityScore,
        }))

        // Создаем переходы согласно правилам шаблона
        const transitions = []
        for (let i = 0; i < clips.length - 1; i++) {
          if (Math.random() < template.transitionRules.frequency) {
            const transitionType = template.transitionRules.variety.enabled
              ? template.transitionRules.variety.types[
                  Math.floor(Math.random() * template.transitionRules.variety.types.length)
                ]
              : template.transitionRules.defaultType

            transitions.push({
              type: transitionType,
              duration: template.transitionRules.duration,
              afterClipIndex: i,
            })
          }
        }

        // Вычисляем фактическую длительность
        const actualDuration = clips.reduce((sum, clip) => sum + clip.duration, 0)

        // Создаем план монтажа
        const plan: MontagePlan = {
          id: `plan-${template.id}-${Date.now()}`,
          name: `${template.name} - Auto Generated`,
          style: template.style,
          targetDuration: template.parameters.targetDuration,
          actualDuration,
          clips,
          transitions,
          music: template.musicSettings,
          description: `Автоматически созданный план на основе шаблона "${template.name}"`,
          createdAt: new Date(),
          metadata: {
            sourceFilesCount: completedFiles.length,
            usedFilesCount: new Set(clips.map((c) => c.fileId)).size,
            usagePercentage: (new Set(clips.map((c) => c.fileId)).size / completedFiles.length) * 100,
          },
        }

        logger.infoSync("[useMontageTemplate] Plan generated successfully", {
          planId: plan.id,
          clipsCount: clips.length,
          actualDuration,
        })

        return plan
      } catch (error) {
        logger.errorSync("[useMontageTemplate] Failed to generate plan from template", error as Record<string, unknown>)
        return null
      }
    },
    [],
  )

  return {
    generatePlanFromTemplate,
  }
}

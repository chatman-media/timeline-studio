/**
 * AI инструмент для анализа структуры Timeline с использованием BaseAITool
 */

import type { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"
import { getTimelineStateAccess } from "./types"
import {
  calculateTimelineDensity,
  detectStructureIssues,
  generateStructureRecommendations,
  getTrackTypeDistribution,
} from "./utils/analyzers"

// Типы для анализа структуры
export interface StructureAnalysisInput {
  includeClips?: boolean
  includeTracks?: boolean
  includeSections?: boolean
  includeResources?: boolean
  analysisDepth?: "basic" | "detailed" | "comprehensive"
}

export interface ProjectInfo {
  id: string
  name: string
  duration: number
  fps?: number
  resolution: { width: number; height: number }
  tracks: number
  sections: number
  clips: number
}

export interface TrackInfo {
  id: string
  name: string
  type: string
  sectionId?: string
  clipsCount: number
  isHidden: boolean
  isMuted: boolean
  isLocked: boolean
  height?: number
  order?: number
}

export interface SectionInfo {
  id: string
  name: string
  index: number
  duration: number
  startTime: number
  endTime: number
  tracksCount: number
  isCollapsed: boolean
  color: string
  tags: string[]
}

export interface ClipInfo {
  id: string
  name: string
  trackId: string
  mediaId?: string
  startTime: number
  duration: number
  volume: number
  speed: number
  hasEffects: boolean
  hasFilters: boolean
  hasTransitions: boolean
  isSelected: boolean
  isLocked: boolean
}

export interface StructureStatistics {
  averageClipDuration: number
  trackTypeDistribution: Record<string, number>
  timelineDensity: number
  usedResources: {
    effects: number
    filters: number
    transitions: number
    templates: number
    media: number
  }
}

export interface StructureAnalysisResult {
  projectInfo: ProjectInfo
  tracks?: TrackInfo[]
  sections?: SectionInfo[]
  clips?: ClipInfo[]
  statistics?: StructureStatistics
  recommendations?: string[]
  issues?: Array<{
    type: string
    severity: "low" | "medium" | "high"
    description: string
    solution?: string
  }>
}

/**
 * AI инструмент для анализа структуры с унифицированной обработкой ошибок
 */
export class StructureAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("StructureAnalysisTool", logger)
  }

  /**
   * Анализирует структуру Timeline проекта
   */
  public async analyzeTimelineStructure(
    input: StructureAnalysisInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<StructureAnalysisResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validDepths = ["basic", "detailed", "comprehensive"]
      if (data.analysisDepth && !validDepths.includes(data.analysisDepth)) {
        errors.push(`Неподдерживаемая глубина анализа: ${data.analysisDepth}`)
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации параметров анализа структуры",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const includeClips = input.includeClips !== false
    const includeTracks = input.includeTracks !== false
    const includeSections = input.includeSections !== false
    const includeResources = input.includeResources || false
    const analysisDepth = input.analysisDepth || "basic"

    // Выполняем анализ с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем анализ структуры Timeline", {
          analysisDepth,
          includeClips,
          includeTracks,
          includeSections,
          includeResources,
        })

        const timelineStateAccess = getTimelineStateAccess()

        if (!timelineStateAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineStateAccess.getCurrentProject() as TimelineProject | null

        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта Timeline для анализа. Создайте проект Timeline перед анализом")
        }

        const projectStats = timelineStateAccess.getProjectStats()

        // Создаем базовую информацию о проекте
        const projectInfo: ProjectInfo = {
          id: currentProject.id,
          name: currentProject.name,
          duration: currentProject.duration,
          fps: currentProject.fps,
          resolution: currentProject.settings?.resolution || { width: 1920, height: 1080 },
          tracks: projectStats.totalTracks,
          sections: projectStats.totalSections,
          clips: projectStats.totalClips,
        }

        const result: StructureAnalysisResult = {
          projectInfo,
        }

        // Собираем информацию о треках
        if (includeTracks) {
          const tracks: TrackInfo[] = []

          // Глобальные треки
          currentProject.globalTracks.forEach((track: TimelineTrack) => {
            tracks.push({
              id: track.id,
              name: track.name,
              type: track.type,
              clipsCount: track.clips.length,
              isHidden: track.isHidden || false,
              isMuted: track.isMuted || false,
              isLocked: track.isLocked || false,
              height: track.height || 50,
              order: track.order || 0,
            })
          })

          // Треки из секций
          currentProject.sections.forEach((section) => {
            section.tracks.forEach((track) => {
              tracks.push({
                id: track.id,
                name: track.name,
                type: track.type,
                sectionId: section.id,
                clipsCount: track.clips.length,
                isHidden: track.isHidden || false,
                isMuted: track.isMuted || false,
                isLocked: track.isLocked || false,
              })
            })
          })

          result.tracks = tracks
        }

        // Собираем информацию о секциях
        if (includeSections) {
          result.sections = currentProject.sections.map(
            (section: TimelineSection): SectionInfo => ({
              id: section.id,
              name: section.name,
              index: (section as any).index || 0,
              duration: section.duration,
              startTime: section.startTime,
              endTime: (section as any).endTime || section.startTime + section.duration,
              tracksCount: section.tracks.length,
              isCollapsed: (section as any).isCollapsed || false,
              color: section.color || "#333",
              tags: (section as any).tags || [],
            }),
          )
        }

        // Собираем информацию о клипах
        if (includeClips) {
          const clips: ClipInfo[] = []

          // Клипы с глобальных треков
          currentProject.globalTracks.forEach((track) => {
            track.clips.forEach((clip: TimelineClip) => {
              clips.push({
                id: clip.id,
                name: clip.name,
                trackId: clip.trackId,
                mediaId: (clip as any).mediaId || clip.mediaFile?.id,
                startTime: clip.startTime,
                duration: clip.duration,
                volume: clip.volume || 1.0,
                speed: clip.speed || 1.0,
                hasEffects: (clip.effects || []).length > 0,
                hasFilters: (clip as any).filters?.length > 0 || false,
                hasTransitions: (clip.transitions || []).length > 0,
                isSelected: (clip as any).isSelected || false,
                isLocked: (clip as any).isLocked || false,
              })
            })
          })

          // Клипы из секций
          currentProject.sections.forEach((section) => {
            section.tracks.forEach((track) => {
              track.clips.forEach((clip: TimelineClip) => {
                clips.push({
                  id: clip.id,
                  name: clip.name,
                  trackId: clip.trackId,
                  mediaId: (clip as any).mediaId || clip.mediaFile?.id,
                  startTime: clip.startTime,
                  duration: clip.duration,
                  volume: clip.volume || 1.0,
                  speed: clip.speed || 1.0,
                  hasEffects: (clip.effects || []).length > 0,
                  hasFilters: (clip as any).filters?.length > 0 || false,
                  hasTransitions: (clip.transitions || []).length > 0,
                  isSelected: (clip as any).isSelected || false,
                  isLocked: (clip as any).isLocked || false,
                })
              })
            })
          })

          result.clips = clips
        }

        // Детальная статистика
        if (analysisDepth === "detailed" || analysisDepth === "comprehensive") {
          const allClips: TimelineClip[] = []
          currentProject.globalTracks.forEach((track) => allClips.push(...track.clips))
          currentProject.sections.forEach((section) => {
            section.tracks.forEach((track) => allClips.push(...track.clips))
          })

          const allTracks: TimelineTrack[] = [...currentProject.globalTracks]
          currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

          result.statistics = {
            averageClipDuration:
              allClips.length > 0 ? allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length : 0,
            trackTypeDistribution: getTrackTypeDistribution(allTracks),
            timelineDensity: calculateTimelineDensity(currentProject),
            usedResources: {
              effects: currentProject.resources?.effects?.length || 0,
              filters: currentProject.resources?.filters?.length || 0,
              transitions: currentProject.resources?.transitions?.length || 0,
              templates: currentProject.resources?.templates?.length || 0,
              media: currentProject.resources?.media?.length || 0,
            },
          }
        }

        // Комплексный анализ
        if (analysisDepth === "comprehensive") {
          result.recommendations = generateStructureRecommendations(currentProject)
          result.issues = detectStructureIssues(currentProject)
        }

        this.logger?.info("Анализ структуры Timeline завершен", {
          projectName: currentProject.name,
          tracksIncluded: !!result.tracks,
          sectionsIncluded: !!result.sections,
          clipsIncluded: !!result.clips,
          statisticsIncluded: !!result.statistics,
          recommendationsCount: result.recommendations?.length || 0,
          issuesCount: result.issues?.length || 0,
        })

        return result
      },
      {
        timeout: options.timeout || 45000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          analysisDepth,
          componentsIncluded: [
            includeClips && "clips",
            includeTracks && "tracks",
            includeSections && "sections",
            includeResources && "resources",
          ].filter(Boolean),
          ...options.metadata,
        },
      },
    )
  }
}

// Экспортируем готовый экземпляр для использования
export const structureAnalysisTool = new StructureAnalysisTool()

// Функция-обертка для обратной совместимости
export async function analyzeTimelineStructure(params: any): Promise<AIToolResult<StructureAnalysisResult>> {
  const input: StructureAnalysisInput = {
    includeClips: params.includeClips,
    includeTracks: params.includeTracks,
    includeSections: params.includeSections,
    includeResources: params.includeResources,
    analysisDepth: params.analysisDepth,
  }

  return structureAnalysisTool.analyzeTimelineStructure(input)
}

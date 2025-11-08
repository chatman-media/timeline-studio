/**
 * AI-специфичные типы для Timeline AI инструментов
 *
 * Основные типы Timeline (TimelineProject, TimelineSection, TimelineTrack, TimelineClip)
 * импортируются из @/features/timeline/types/timeline
 */

import type { TimelineClip, TimelineSection, TimelineTrack } from "@/features/timeline/types/timeline"

/**
 * Типы для функций обратного вызова в reduce операциях
 */
export type ReducerCallback<T, R> = (acc: T, curr: R) => T
export type SectionReducer = ReducerCallback<number, TimelineSection>
export type TrackReducer = ReducerCallback<number, TimelineTrack>
export type ClipReducer = ReducerCallback<number, TimelineClip>

/**
 * Типы событий таймлайна, которые могут генерировать инструменты
 */
export type TimelineToolEvent =
  | { type: "PROJECT_CREATED"; projectId: string; settings: any }
  | { type: "SECTIONS_CREATED"; sectionIds: string[]; strategy: string }
  | { type: "TRACKS_CREATED"; trackIds: string[]; configuration: any }
  | { type: "CLIPS_PLACED"; clipIds: string[]; strategy: any }
  | {
      type: "ENHANCEMENTS_APPLIED"
      enhancements: string[]
      targetElements: any
    }
  | { type: "SCENES_DETECTED"; clipId: string; scenes: any[] }
  | { type: "TIMELINE_ANALYZED"; analysis: any }

/**
 * Результат выполнения инструмента таймлайна
 */
export interface TimelineToolResult {
  success: boolean
  message: string
  data?: {
    projectId?: string
    createdElements?: string[]
    analysis?: any
    suggestions?: string[]
    modifications?: any[]
    exportData?: any
    statistics?: any
    fileInfo?: any
    modificationsCount?: number
    enhancementDetails?: any
    overallRecommendations?: string[]
    synchronizedElements?: string[]
    syncOptions?: any
  }
  errors?: string[]
  warnings?: string[]
  nextActions?: string[]
}

/**
 * Интерфейс для доступа к состоянию Timeline
 */
export interface TimelineStateAccess {
  getCurrentProject: () => unknown
  createProject: (project: any) => Promise<void>
  updateProject: (updates: any) => Promise<void>
  createSection: (section: any) => Promise<any>
  createTrack: (track: any) => Promise<any>
  addClip: (clip: any) => Promise<any>
  getProjectStats: () => {
    totalDuration: number
    totalClips: number
    totalTracks: number
    totalSections: number
  }
  sendTimelineCommand: (command: string, params?: any) => Promise<void>
}

// Глобальная переменная для доступа к состоянию timeline
let timelineStateAccess: TimelineStateAccess | null = null

/**
 * Устанавливает доступ к состоянию timeline
 */
export function setTimelineStateAccess(access: TimelineStateAccess | null) {
  timelineStateAccess = access
}

/**
 * Получает доступ к состоянию timeline
 */
export function getTimelineStateAccess(): TimelineStateAccess | null {
  return timelineStateAccess
}

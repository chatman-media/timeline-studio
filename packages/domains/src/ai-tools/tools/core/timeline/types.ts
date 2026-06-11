/**
 * AI-специфичные типы для Timeline AI инструментов
 *
 * Основные типы Timeline (TimelineProject, TimelineSection, TimelineTrack, TimelineClip)
 * импортируются из @/features/timeline/types
 */

import type { TimelineClip, TimelineSection, TimelineTrack } from "@timeline-studio/domains/video-editing/types"
export type { TimelineStateAccess } from "@timeline-studio/core/services/timeline-state-access"
export {
  getTimelineStateAccess,
  setTimelineStateAccess,
} from "@timeline-studio/core/services/timeline-state-access"

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

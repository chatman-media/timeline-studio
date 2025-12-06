/**
 * Drag and Drop Types for Timeline
 */

import type { MediaFile } from "@/domains/media-management"

export type DragType = "video" | "audio" | "image"

export interface DragData {
  type: DragType
  mediaFile: MediaFile
  // Для multi-select drag & drop
  isMultiSelect?: boolean
  selectedFiles?: MediaFile[]
}

export interface DropPosition {
  trackId: string
  startTime: number
  type?: "transition" | "clip" | "track"
  leftClipId?: string
  rightClipId?: string
}

export interface DragState {
  isDragging: boolean
  draggedItem: DragData | null
  dragOverTrack: string | null
  dropPosition: DropPosition | null
  // Для multi-select визуализации
  draggedCount?: number
  // Для snap feedback
  snapPoint?: any | null
  snapActive?: boolean
  // Для ресурсов (эффекты, фильтры, переходы)
  draggedResourceType?: string
  draggedResource?: any
}

export interface TimelineDropTarget {
  trackId: string
  trackType: string
  isValidTarget: boolean
}

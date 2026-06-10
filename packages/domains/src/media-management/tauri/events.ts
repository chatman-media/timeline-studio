/**
 * Tauri Events for Media Management Domain
 *
 * События для отслеживания состояния медиа операций
 */

// Import events
export const MEDIA_IMPORT_STARTED = "media:import:started"
export const MEDIA_IMPORT_PROGRESS = "media:import:progress"
export const MEDIA_IMPORT_COMPLETED = "media:import:completed"
export const MEDIA_IMPORT_FAILED = "media:import:failed"

// File operation events
export const FILE_OPERATION_STARTED = "file:operation:started"
export const FILE_OPERATION_PROGRESS = "file:operation:progress"
export const FILE_OPERATION_COMPLETED = "file:operation:completed"
export const FILE_OPERATION_FAILED = "file:operation:failed"

// Media analysis events
export const MEDIA_ANALYSIS_STARTED = "media:analysis:started"
export const MEDIA_ANALYSIS_PROGRESS = "media:analysis:progress"
export const MEDIA_ANALYSIS_COMPLETED = "media:analysis:completed"

// Thumbnail generation events
export const THUMBNAIL_GENERATION_STARTED = "thumbnail:generation:started"
export const THUMBNAIL_GENERATION_COMPLETED = "thumbnail:generation:completed"

// Export events
export const MEDIA_EXPORT_STARTED = "media:export:started"
export const MEDIA_EXPORT_PROGRESS = "media:export:progress"
export const MEDIA_EXPORT_COMPLETED = "media:export:completed"
export const MEDIA_EXPORT_FAILED = "media:export:failed"

/**
 * Event payload types
 */

export interface MediaImportProgressPayload {
  fileId: string
  filePath: string
  progress: number
  currentStep: string
}

export interface FileOperationProgressPayload {
  operationId: string
  type: string
  progress: number
  message?: string
}

export interface MediaAnalysisCompletedPayload {
  filePath: string
  metadata: any
  thumbnailPath?: string
  duration?: number
}

export interface MediaExportProgressPayload {
  exportId: string
  progress: number
  currentFrame?: number
  totalFrames?: number
  estimatedTimeRemaining?: number
}

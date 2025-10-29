/**
 * Processing-related types for AI Services
 */

// Processing states and errors
export enum ProcessingStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  ANALYZING = "analyzing",
  PROCESSING = "processing",
  GENERATING = "generating",
  ADAPTING = "adapting",
  FINALIZING = "finalizing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface ProcessingStep {
  id: string
  name: string
  status: ProcessingStatus
  progress: number
  startTime?: Date
  endTime?: Date
  error?: ProcessingError
  metadata?: Record<string, any>
}

export interface ProcessingError {
  code: string
  message: string
  details?: any
  timestamp: Date
  recoverable: boolean
  suggestion?: string
}
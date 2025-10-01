/**
 * Media Management Domain Types
 *
 * Центральное место для всех типов Media Management домена
 */

// Import base types from media-api
import type {
  AudioMetadata,
  MediaMetadata as BaseMediaMetadata,
  BrowserVideoMetadata,
  ImageMetadata,
} from "@/features/media/services/media-api"

// Re-export base types
export type { AudioMetadata, BrowserVideoMetadata, ImageMetadata }

// Extend MediaMetadata for our domain
export type MediaMetadata = BaseMediaMetadata & {
  // Additional properties that might be needed
  album?: string
  artist?: string
  artwork?: string
  title?: string
}

// Define MediaType and MediaInfo locally
export type MediaType = "Video" | "Audio" | "Image" | "Unknown"

export interface MediaInfo {
  path: string
  name: string
  type: MediaType
  metadata?: MediaMetadata
  size?: number
  duration?: number
  thumbnailPath?: string
}

// Media file operations
export interface MediaFileOperation {
  id: string
  type: "import" | "export" | "convert" | "extract" | "analyze"
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  error?: string
  result?: any
}

// Media import options
export interface MediaImportOptions {
  copyToProject: boolean
  createProxies: boolean
  analyzeContent: boolean
  generateThumbnails: boolean
  preserveMetadata: boolean
}

// Media import context
export interface MediaImportContext {
  files: string[]
  options: MediaImportOptions
  operations: MediaFileOperation[]
  currentOperation: string | null
  totalProgress: number
  errors: string[]
}

// Media import events
export type MediaImportEvent =
  | { type: "ADD_FILES"; files: string[] }
  | { type: "REMOVE_FILE"; file: string }
  | { type: "UPDATE_OPTIONS"; options: Partial<MediaImportOptions> }
  | { type: "START_IMPORT" }
  | { type: "CANCEL_IMPORT" }
  | { type: "IMPORT_PROGRESS"; operationId: string; progress: number }
  | { type: "IMPORT_COMPLETE"; operationId: string; result: any }
  | { type: "IMPORT_FAILED"; operationId: string; error: string }
  | { type: "RESET" }

// File operations context
export interface FileOperationsContext {
  operations: Map<string, MediaFileOperation>
  activeOperations: string[]
  completedOperations: string[]
  failedOperations: string[]
}

// File operations events
export type FileOperationsEvent =
  | { type: "START_OPERATION"; operation: MediaFileOperation }
  | { type: "UPDATE_PROGRESS"; operationId: string; progress: number }
  | { type: "COMPLETE_OPERATION"; operationId: string; result: any }
  | { type: "FAIL_OPERATION"; operationId: string; error: string }
  | { type: "CANCEL_OPERATION"; operationId: string }
  | { type: "CLEAR_COMPLETED" }
  | { type: "RETRY_FAILED"; operationId: string }

// Media metadata service interface
export interface MediaMetadataService {
  extractMetadata(filePath: string): Promise<MediaMetadata>
  generateThumbnail(filePath: string, time?: number): Promise<string>
  analyzeMedia(filePath: string): Promise<MediaAnalysisResult>
  getMediaDuration(filePath: string): Promise<number>
}

// Media analysis result
export interface MediaAnalysisResult {
  metadata: MediaMetadata
  thumbnailPath?: string
  waveformData?: Float32Array
  scenes?: SceneDetectionResult[]
  quality?: QualityMetrics
}

// Scene detection result
export interface SceneDetectionResult {
  startTime: number
  endTime: number
  confidence: number
  thumbnailPath?: string
}

// Quality metrics
export interface QualityMetrics {
  resolution: string
  bitrate: number
  fps: number
  codec: string
  qualityScore: number
}

// Media management service
export interface MediaManagementService {
  importFiles(files: string[], options: MediaImportOptions): Promise<any[]>
  selectMediaFiles(): Promise<string[] | null>
  selectAudioFiles(): Promise<string[] | null>
  getMediaInfo(path: string): Promise<any>
  extractMetadata(path: string): Promise<MediaMetadata>
}

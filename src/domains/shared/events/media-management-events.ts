/**
 * Media Management Domain Events
 *
 * События домена управления медиа
 */

import type { MediaFile } from "@/domains/ai-services/types/montage-planner"

// === File Operations Events ===

export interface FilesImportedEvent {
  files: MediaFile[]
  source: "drag-drop" | "file-dialog" | "camera" | "voice-recording"
  targetTab?: string
}

export interface FileDeletedEvent {
  fileId: string
  filePath: string
  permanently: boolean
}

export interface FileMovedEvent {
  fileId: string
  oldPath: string
  newPath: string
}

export interface FileRenamedEvent {
  fileId: string
  oldName: string
  newName: string
  path: string
}

// === Media Metadata Events ===

export interface MetadataExtractedEvent {
  fileId: string
  filePath: string
  metadata: {
    duration?: number
    width?: number
    height?: number
    fps?: number
    codec?: string
    bitrate?: number
  }
}

export interface ThumbnailGeneratedEvent {
  fileId: string
  filePath: string
  thumbnailPath: string
  timestamp: number
}

// === Browser Events ===

export interface BrowserTabChangedEvent {
  previousTab: string
  currentTab: string
}

export interface FilesSelectedEvent {
  tab: string
  selectedFiles: string[]
  totalSelected: number
}

export interface BrowserFilterChangedEvent {
  tab: string
  filters: {
    searchQuery?: string
    fileType?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }
}

// === Import Progress Events ===

export interface ImportStartedEvent {
  importId: string
  totalFiles: number
  totalSize: number
}

export interface ImportProgressEvent {
  importId: string
  processedFiles: number
  totalFiles: number
  currentFile?: string
  progress: number
}

export interface ImportCompletedEvent {
  importId: string
  successCount: number
  failureCount: number
  duration: number
  errors?: Array<{
    file: string
    error: string
  }>
}

// === Event Type Constants ===

export const MEDIA_MANAGEMENT_EVENTS = {
  // File Operations
  FILES_IMPORTED: "media.files.imported",
  FILE_DELETED: "media.file.deleted",
  FILE_MOVED: "media.file.moved",
  FILE_RENAMED: "media.file.renamed",

  // Metadata
  METADATA_EXTRACTED: "media.metadata.extracted",
  THUMBNAIL_GENERATED: "media.thumbnail.generated",

  // Browser
  BROWSER_TAB_CHANGED: "media.browser.tab-changed",
  FILES_SELECTED: "media.browser.files-selected",
  BROWSER_FILTER_CHANGED: "media.browser.filter-changed",

  // Import
  IMPORT_STARTED: "media.import.started",
  IMPORT_PROGRESS: "media.import.progress",
  IMPORT_COMPLETED: "media.import.completed",
} as const

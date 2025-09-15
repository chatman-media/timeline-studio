/**
 * Типы для AI инструментов работы с медиа браузером
 */

import type { BrowserTab } from "../../../../../shared/types/browser"

/**
 * Результат выполнения инструмента для браузера
 */
export interface BrowserToolResult {
  success: boolean
  message: string
  data?: {
    files?: any[]
    groups?: any[]
    analysis?: any
    suggestions?: string[]
    warnings?: string[]
    state?: any
    sources?: any[]
    missingContent?: {
      categories: string[]
      suggestions: any[]
      priority: string[]
      analysis: any
    }
    importSources?: {
      websites: any[]
      stockSites: any[]
      aiTools: any[]
      recommendations: string[]
    }
    exportData?: {
      format: string
      content: any
      metadata: any
    }
    relationships?: any[]
    message?: string
    recommendations?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}

/**
 * Параметры для анализа медиа браузера
 */
export interface AnalyzeBrowserParams {
  tab: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  filters?: {
    searchQuery?: string
    fileTypes?: Array<"video" | "audio" | "image">
    dateRange?: {
      start?: string
      end?: string
    }
    sizeRange?: {
      min?: number
      max?: number
    }
    durationRange?: {
      min?: number
      max?: number
    }
    tags?: string[]
    location?: string
  }
  includeMetadata?: boolean
  groupBy?: "type" | "date" | "size" | "location" | "tags"
  sortBy?: "name" | "date" | "size" | "duration" | "type"
  sortOrder?: "asc" | "desc"
}

/**
 * Параметры для анализа недостающего контента
 */
export interface AnalyzeMissingContentParams {
  analysisScope: "project" | "resources" | "timeline" | "all"
  includeRecent?: boolean
  checkExternal?: boolean
}

/**
 * Параметры для предложения источников импорта
 */
export interface SuggestImportParams {
  contentType: string
  style?: string
  mood?: string
  projectType?: string
  includeAI?: boolean
  includeFree?: boolean
  includePremium?: boolean
}

/**
 * Параметры для экспорта списка файлов
 */
export interface ExportFileListParams {
  format: "json" | "csv" | "text" | "xml"
  includeMetadata?: boolean
  filterCriteria?: {
    selectedOnly?: boolean
    tab?: string
    fileTypes?: string[]
    sizeRange?: {
      min?: number
      max?: number
    }
    dateRange?: {
      start?: string
      end?: string
    }
  }
}

/**
 * Параметры для получения групп файлов
 */
export interface GetFileGroupsParams {
  groupBy: "type" | "date" | "size" | "location" | "tags"
  tab: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  includeEmpty?: boolean
}

/**
 * Параметры для анализа связей файлов
 */
export interface AnalyzeRelationshipsParams {
  tab: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  analysisDepth?: "basic" | "detailed"
  includeUsage?: boolean
}

/**
 * Параметры для массового выбора файлов
 */
export interface BulkSelectParams {
  method: "all" | "pattern" | "random" | "filtered" | "smart"
  filters?: {
    fileTypes?: string[]
    dateRange?: {
      start?: string
      end?: string
    }
    sizeRange?: {
      min?: number
      max?: number
    }
    searchPattern?: string
    tags?: string[]
    location?: string
  }
  count?: number
  pattern?: string
}

/**
 * Параметры для поиска медиа файлов
 */
export interface SearchMediaParams {
  query: string
  searchIn?: Array<"filename" | "metadata" | "tags" | "location">
  tab?: "media" | "effects" | "filters" | "transitions" | "templates" | "music"
  advanced?: {
    exactMatch?: boolean
    caseSensitive?: boolean
    includeHidden?: boolean
    searchSubfolders?: boolean
  }
  maxResults?: number
}

// Удален дублированный интерфейс GetFileGroupsParams

// Псевдонимы типов для совместимости с browser-tools.ts
export type FileGroupsParams = GetFileGroupsParams

/**
 * Параметры для анализа связей между файлами
 */
export interface AnalyzeRelationshipsParams {
  analysisType: "series" | "project" | "similarity" | "dependencies"
  fileIds?: string[]
  includeMetadata?: boolean
}

export type FileRelationshipsParams = AnalyzeRelationshipsParams

/**
 * Параметры для массового выбора файлов
 */
export interface BulkSelectParams {
  selectionCriteria: {
    method: "all" | "filtered" | "pattern" | "random" | "smart"
    filters?: {
      fileTypes?: string[]
      dateRange?: { start: string; end: string }
      sizeRange?: { min: number; max: number }
      searchPattern?: string
      tags?: string[]
      location?: string
    }
    count?: number
    pattern?: string
  }
  action: "select" | "deselect" | "toggle"
  reason: string
}

/**
 * Параметры для обновления фильтров браузера
 */
export interface UpdateFiltersParams {
  filterType?: "search" | "fileType" | "dateRange" | "sizeRange" | "tags" | "location"
  filterValue?: any
  operation: "set" | "add" | "remove" | "clear"
  clearAll?: boolean
  reason: string
}

/**
 * Параметры для анализа отсутствующего контента
 */
export interface AnalyzeMissingContentParams {
  analysisScope: "project" | "resources" | "timeline" | "all"
  includeRecent?: boolean
  checkExternal?: boolean
}

export type AnalyzeMissingParams = AnalyzeMissingContentParams

/**
 * Параметры для предложения источников импорта
 */
export interface SuggestImportParams {
  contentType: "video" | "audio" | "image" | "effect" | "filter" | "transition" | "template" | "music"
  style?: string
  mood?: string
  projectType?: string
  includeAI?: boolean
  includeFree?: boolean
  includePremium?: boolean
}

/**
 * Параметры для экспорта списка файлов
 */
export interface ExportFileListParams {
  format: "json" | "csv" | "text" | "xml"
  includeMetadata?: boolean
  filterCriteria?: {
    selectedOnly?: boolean
    tab?: string
    fileTypes?: string[]
    dateRange?: { start: string; end: string }
  }
}

// Дополнительные псевдонимы типов для совместимости
export type BrowserStateParams = Record<string, any>
// SuggestImportParams и UpdateFiltersParams уже определены выше как интерфейсы

/**
 * Интерфейс для доступа к состоянию браузера
 */
export interface BrowserStateAccess {
  getCurrentTab: () => BrowserTab
  getFiles: (tab?: BrowserTab) => any[]
  getSelectedFiles: () => any[]
  getFilters: () => any
  setFilters: (filters: any) => void
  selectFiles: (fileIds: string[]) => void
  deselectFiles: (fileIds: string[]) => void
  searchFiles: (query: string, options?: any) => any[]
  getFileGroups: (groupBy: string) => any[]
  getBrowserStats: () => {
    totalFiles: number
    selectedFiles: number
    filesByType: Record<string, number>
    totalSize: number
  }
}

/**
 * Информация о файле в браузере
 */
export interface BrowserFileInfo {
  id: string
  name: string
  path: string
  type: string
  size?: number
  duration?: number
  createdAt?: Date
  modifiedAt?: Date
  tags?: string[]
  metadata?: Record<string, any>
  thumbnail?: string
  isSelected?: boolean
  location?: string
}

/**
 * Группа файлов в браузере
 */
export interface FileGroup {
  id: string
  name: string
  type: string
  files: BrowserFileInfo[]
  totalSize: number
  totalDuration?: number
  count: number
  criteria: any
}

/**
 * Статистика браузера
 */
export interface BrowserStats {
  totalFiles: number
  selectedFiles: number
  filesByType: Record<string, number>
  totalSize: number
  totalDuration: number
  filesByLocation: Record<string, number>
  recentFiles: number
}

/**
 * Источник для импорта контента
 */
export interface ImportSource {
  name: string
  url: string
  type: "free" | "premium" | "ai" | "stock"
  categories: string[]
  description?: string
  features?: string[]
}

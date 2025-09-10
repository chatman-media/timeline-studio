/**
 * AI Tools Shared Types
 * Централизованные типы для всех AI инструментов в доменной архитектуре
 */

// ============================================================================
// CORE TOOLS TYPES
// ============================================================================

// Browser Tools Types
export interface BrowserAnalysisInput {
  analysisType?: "overview" | "detailed" | "performance"
  filters?: {
    fileType?: string[]
    dateRange?: { start: Date; end: Date }
  }
  includeMetadata?: boolean
}

export interface BrowserAnalysisResult {
  totalFiles: number
  fileTypes: string[]
  statistics: {
    totalSize: number
    averageSize: number
    oldestFile: Date
    newestFile: Date
  }
  analysis: {
    recommendations: string[]
    issues: string[]
    performance: {
      loadTime: number
      indexingTime: number
    }
  }
}

export interface SearchFilesInput {
  query: string
  filters?: {
    fileType?: string[]
    sizeRange?: { min: number; max: number }
    dateRange?: { start: Date; end: Date }
  }
  sortBy?: "name" | "size" | "date" | "relevance"
  limit?: number
}

export interface SearchFilesResult {
  results: Array<{
    id: string
    name: string
    path: string
    size: number
    type: string
    lastModified: Date
    relevance: number
  }>
  totalFound: number
  searchTime: number
  suggestions: string[]
}

export interface FileOperationsInput {
  operation: "copy" | "move" | "delete" | "rename" | "organize"
  fileIds: string[]
  destination?: string
  newName?: string
  organizationStrategy?: "by_type" | "by_date" | "by_size" | "custom"
}

export interface FileOperationsResult {
  operation: string
  affectedFiles: string[]
  success: boolean
  results: Array<{
    fileId: string
    status: "success" | "failed" | "skipped"
    newPath?: string
    error?: string
  }>
  summary: {
    successful: number
    failed: number
    skipped: number
  }
}

export interface BrowserStateInput {
  action: "save" | "restore" | "clear" | "export"
  stateName?: string
  includeFilters?: boolean
  includeSelection?: boolean
}

export interface BrowserStateResult {
  action: string
  stateName?: string
  success: boolean
  savedStates?: Array<{
    name: string
    date: Date
    fileCount: number
    filters: any
  }>
  restoredState?: {
    filters: any
    selection: string[]
    viewMode: string
  }
  exportData?: string
}

// Timeline Tools Types
export interface ProjectCreationInput {
  projectSettings: {
    name: string
    resolution: { width: number; height: number }
    fps: number
    duration?: number
  }
  templateId?: string
  initialTracks?: Array<{
    type: "video" | "audio"
    name?: string
  }>
}

export interface ProjectCreationResult {
  projectId: string
  projectName: string
  createdElements: string[]
  trackStructure: {
    videoTracks: number
    audioTracks: number
  }
  timeline: {
    duration: number
    fps: number
    resolution: { width: number; height: number }
  }
}

export interface StructureAnalysisInput {
  projectId?: string
  analysisType?: "basic" | "detailed" | "comprehensive"
  includeRecommendations?: boolean
}

export interface StructureAnalysisResult {
  structure: {
    tracks: number
    clips: number
    effects: number
    transitions: number
  }
  complexity: "simple" | "medium" | "complex"
  recommendations: string[]
  issues: Array<{
    type: string
    severity: "low" | "medium" | "high"
    description: string
    suggestion: string
  }>
  metrics: {
    averageClipDuration: number
    trackUtilization: number
    effectsPerClip: number
  }
}

export interface SectionCreationInput {
  sectionType: "intro" | "main" | "outro" | "transition" | "custom"
  duration: number
  position?: number
  template?: string
  customSettings?: Record<string, any>
}

export interface SectionCreationResult {
  sections: Array<{
    id: string
    type: string
    startTime: number
    endTime: number
    duration: number
  }>
  totalSections: number
  timelineUpdated: boolean
}

export interface TrackCreationInput {
  trackType: "video" | "audio" | "subtitle"
  count?: number
  position?: number
  name?: string
  settings?: Record<string, any>
}

export interface TrackCreationResult {
  tracks: Array<{
    id: string
    type: string
    name: string
    position: number
  }>
  totalTracks: number
  timelineUpdated: boolean
}

export interface ClipPlacementInput {
  clipId: string
  trackId: string
  position: number
  duration?: number
  trimIn?: number
  trimOut?: number
}

export interface ClipPlacementResult {
  clipId: string
  trackId: string
  placement: {
    startTime: number
    endTime: number
    duration: number
  }
  conflicts: Array<{
    conflictType: string
    description: string
    resolution: string
  }>
}

export interface EnhancementApplicationInput {
  targetIds: string[]
  enhancementType: "color-correction" | "audio-enhancement" | "stabilization" | "noise-reduction"
  intensity?: number
  customSettings?: Record<string, any>
}

export interface EnhancementApplicationResult {
  appliedEnhancements: string[]
  results: Array<{
    targetId: string
    enhancement: string
    success: boolean
    settings: Record<string, any>
  }>
  preview: {
    beforeUrl?: string
    afterUrl?: string
    comparison: string
  }
}

// Player Tools Types
export interface MediaAnalysisInput {
  mediaId: string
  analysisType?: "basic" | "detailed" | "comprehensive"
  includeMetadata?: boolean
  includeQuality?: boolean
}

export interface MediaAnalysisResult {
  mediaId: string
  metadata: {
    duration: number
    resolution: { width: number; height: number }
    fps: number
    codec: string
    fileSize: number
  }
  quality: {
    score: number
    issues: string[]
    recommendations: string[]
  }
  analysis: {
    hasAudio: boolean
    hasVideo: boolean
    complexity: string
    suitability: string[]
  }
}

export interface PlaybackControlInput {
  action: "play" | "pause" | "stop" | "seek" | "speed"
  position?: number
  speed?: number
  loop?: boolean
}

export interface PlaybackControlResult {
  action: string
  currentPosition: number
  duration: number
  isPlaying: boolean
  speed: number
  status: string
}

export interface PreviewEffectsInput {
  effectType: "filter" | "transition" | "overlay" | "adjustment"
  effectId: string
  intensity?: number
  duration?: number
  customSettings?: Record<string, any>
}

export interface PreviewEffectsResult {
  effectId: string
  effectType: string
  applied: boolean
  preview: {
    url: string
    duration: number
    settings: Record<string, any>
  }
  performance: {
    renderTime: number
    quality: string
  }
}

// Resources Tools Types
export interface ResourceAnalysisInput {
  analysisType?: "overview" | "detailed" | "usage"
  filters?: {
    resourceType?: string[]
    sizeRange?: { min: number; max: number }
    usageStatus?: "used" | "unused" | "all"
  }
  includeRecommendations?: boolean
}

export interface ResourceAnalysisResult {
  totalResources: number
  resourceTypes: Record<string, number>
  usage: {
    used: number
    unused: number
    percentage: number
  }
  recommendations: string[]
  details: Array<{
    id: string
    name: string
    type: string
    size: number
    used: boolean
  }>
}

export interface ManageResourcesInput {
  action: "organize" | "cleanup" | "optimize" | "backup"
  resourceIds?: string[]
  organizationStrategy?: "by_type" | "by_usage" | "by_date" | "custom"
  cleanupOptions?: {
    removeUnused?: boolean
    optimizeSize?: boolean
    updateReferences?: boolean
  }
}

export interface ManageResourcesResult {
  action: string
  affectedResources: string[]
  success: boolean
  message: string
  newStructure?: {
    strategy: string
    folders: Array<{
      name: string
      count: number
      size: number
    }>
  }
}

export interface ResourceSuggestionInput {
  projectType?: string
  currentResources?: string[]
  style?: string
  duration?: number
  targetAudience?: string
}

export interface ResourceSuggestionResult {
  suggestions: Array<{
    type: string
    name: string
    description: string
    priority: "low" | "medium" | "high"
  }>
  categories: Record<string, any[]>
  totalSuggestions: number
}

export interface CompatibilityAnalysisInput {
  resourceIds: string[]
  targetFormat?: string
  targetResolution?: { width: number; height: number }
  targetFps?: number
}

export interface CompatibilityAnalysisResult {
  compatible: boolean
  issues: Array<{
    resourceId: string
    issue: string
    severity: "low" | "medium" | "high"
    solution: string
  }>
  recommendations: string[]
  performance: {
    estimatedImpact: "low" | "medium" | "high"
    suggestions: string[]
  }
}

export interface UsageStatsInput {
  action: "get_stats" | "cleanup_unused"
  timeRange?: { start: Date; end: Date }
  includeDetails?: boolean
}

export interface UsageStatsResult {
  usageStats: {
    totalResources: number
    usedResources: number
    unusedResources: number
    mostUsed: Array<{
      id: string
      name: string
      usageCount: number
    }>
  }
  unusedResources?: Array<{
    id: string
    name: string
    size: number
  }>
  cleanupResult?: {
    removedCount: number
    freedSpace: number
  }
}

export interface ResourceExportInput {
  format: "json" | "csv" | "xml"
  includeMetadata?: boolean
  includeUsageStats?: boolean
  filters?: Record<string, any>
}

export interface ResourceExportResult {
  exportedData: string
  format: string
  resourceCount: number
  fileSize: number
  metadata: {
    exportDate: Date
    version: string
    checksum: string
  }
}

// ============================================================================
// AUTOMATION TOOLS TYPES
// ============================================================================

// Batch Processing Types
export interface BatchProcessingInput {
  operation:
    | "start"
    | "get_progress"
    | "cancel"
    | "get_stats"
    | "get_history"
    | "analyze_videos"
    | "transcribe_videos"
    | "generate_subtitles"
    | "detect_languages"
    | "detect_scenes"
    | "create_report"
    | "clear_history"
  clipIds?: string[]
  batchOperation?:
    | "video_analysis"
    | "whisper_transcription"
    | "subtitle_generation"
    | "quality_analysis"
    | "scene_detection"
    | "motion_analysis"
    | "audio_analysis"
    | "language_detection"
    | "comprehensive_analysis"
  jobId?: string
  options?: {
    language?: string
    model?: string
    threshold?: number
    format?: string
    analysisTypes?: string[]
    detailedReport?: boolean
    generateSubtitles?: boolean
    subtitleFormat?: "srt" | "vtt" | "ass"
    maxCharactersPerLine?: number
    translateToLanguages?: string[]
    sampleDuration?: number
    minSceneLength?: number
    exportTimestamps?: boolean
    includeDetails?: boolean
    includeErrors?: boolean
    olderThan?: string
  }
}

export interface BatchProcessingResult {
  operation: string
  success: boolean
  jobId?: string
  progress?: {
    completed: number
    total: number
    percentage: number
    currentItem?: string
    estimatedTimeRemaining?: number
  }
  stats?: {
    totalJobs: number
    completedJobs: number
    failedJobs: number
    averageProcessingTime: number
    totalProcessingTime: number
  }
  history?: Array<{
    jobId: string
    operation: string
    status: "completed" | "failed" | "cancelled"
    startTime: Date
    endTime?: Date
    itemsProcessed: number
    errors?: string[]
  }>
  results?: Array<{
    clipId: string
    status: "completed" | "failed" | "skipped"
    result?: any
    error?: string
    processingTime: number
  }>
  report?: {
    summary: string
    totalItems: number
    successfulItems: number
    failedItems: number
    averageQuality?: number
    recommendations?: string[]
    exportPath?: string
  }
  message: string
  processingTime: number
  warnings?: string[]
  errors?: string[]
}

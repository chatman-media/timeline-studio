import { indexedDBCacheService } from "@timeline-studio/core/services/media-cache-service"
import {
  getMediaManagementBindings,
  type MediaManagementBindings,
} from "@timeline-studio/core/services/media-management-registry"
import type { MediaFile, MediaInfo } from "@timeline-studio/core/types"

export { indexedDBCacheService }

interface MediaManagementFacade {
  mediaPool: Map<string, MediaInfo>
  fileOperationsState?: any
  mediaImportState: {
    isImporting?: boolean
    isCompleted?: boolean
    isFailed?: boolean
    status?: string
    [key: string]: any
  }
  isReady?: boolean
  isLoading: boolean
  error: string | null
  importFiles: (files: string[], options?: any) => Promise<any>
  selectMediaFiles: () => Promise<string[]>
  selectAudioFiles?: () => Promise<string[]>
  selectMediaDirectory: () => Promise<any>
  getMediaInfo?: (path: string) => Promise<MediaInfo | null>
  extractMetadata?: (path: string) => Promise<MediaFile | null>
  removeMedia: (mediaId: string) => Promise<void>
  removeMultipleMedia?: (mediaIds: string[]) => Promise<void>
}

interface MediaImportFacade {
  isImporting: boolean
  isCompleted?: boolean
  isFailed?: boolean
  status?: string
  importFiles: (files: string[], options?: any) => Promise<any>
  selectMediaFiles: () => Promise<string[]>
  selectAudioFiles?: () => Promise<string[]>
  selectMediaDirectory: () => Promise<any>
}

interface DiscoveredFile {
  id: string
  path: string
  name: string
  extension: string
  size: number
}

interface UseMediaProcessorOptions {
  onFilesDiscovered?: (files: DiscoveredFile[]) => void
  onMetadataReady?: (fileId: string, metadata: MediaFile) => void
  onThumbnailReady?: (fileId: string, thumbnailPath: string, thumbnailData?: string) => void
  onError?: (fileId: string, error: string) => void
  onProgress?: (current: number, total: number) => void
}

interface UseMediaProcessorResult {
  scanFolder: (folderPath: string) => Promise<MediaFile[]>
  scanFolderWithThumbnails: (folderPath: string, width?: number, height?: number) => Promise<MediaFile[]>
  processFiles: (filePaths: string[]) => Promise<MediaFile[]>
  processFilesWithThumbnails: (filePaths: string[], width?: number, height?: number) => Promise<MediaFile[]>
  isProcessing: boolean
  progress: { current: number; total: number }
  errors: Map<string, string>
  clearErrors: () => void
  cancelProcessing: () => Promise<void>
}

interface ThumbnailData {
  path?: string
  base64_data?: string
  timestamp?: number
  width?: number
  height?: number
}

interface MediaPreviewData {
  file_id?: string
  file_path?: string
  browser_thumbnail?: ThumbnailData | null
  timeline_previews?: Array<{ timestamp: number; base64_data?: string; is_keyframe?: boolean }>
  recognition_frames?: any[]
  last_updated?: string
}

interface UseMediaPreviewResult {
  getPreviewData: (fileId: string) => Promise<MediaPreviewData | null>
  generateThumbnail: (
    fileId: string,
    filePath: string,
    width: number,
    height: number,
    timestamp?: number,
  ) => Promise<ThumbnailData | null>
  clearPreviewData: (fileId: string) => Promise<boolean>
  getAllFilesWithPreviews: () => Promise<string[]>
  getFilesWithPreviews: () => Promise<string[]>
  savePreviewData: (path: string) => Promise<boolean>
  loadPreviewData: (path: string) => Promise<boolean>
  saveTimelineFrames: (
    fileId: string,
    frames: Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>,
  ) => Promise<boolean>
  getTimelineFrames: (
    fileId: string,
  ) => Promise<Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>>
  restorePreviewCache: () => Promise<number>
  hasCachedThumbnail: (fileId: string, width: number, height: number) => Promise<boolean>
  getCachedThumbnailPath: (fileId: string, width: number, height: number) => Promise<string>
  isGenerating: boolean
  error: string | null
}

interface UseMediaPreviewOptions {
  onThumbnailGenerated?: (fileId: string, thumbnail: ThumbnailData) => void
  onError?: (error: string) => void
}

interface UseAutoProxyResult {
  generateProxy: (file: MediaFile) => Promise<string | null>
  getProxyPath: (filePath: string) => string | null
  isGenerating: (filePath: string) => boolean
  generatingFileIds: string[]
}

interface UseAutoProxyOptions {
  enabled?: boolean
  onProxyReady?: (fileId: string, proxyPath: string) => void
  onError?: (fileId: string, error: string) => void
}

interface TimelinePreviewFrame {
  timestamp: number
  frameData: string
  isKeyframe: boolean
}

interface UseFramePreviewOptions {
  onFramesExtracted?: (frames: TimelinePreviewFrame[]) => void
  onError?: (error: string) => void
}

interface UseFramePreviewResult {
  extractTimelineFrames: (
    fileId: string,
    videoPath: string,
    duration: number,
    interval?: number,
    maxFrames?: number,
  ) => Promise<TimelinePreviewFrame[]>
  extractRecognitionFrames: (fileId: string, videoPath: string, interval?: number, purpose?: any) => Promise<any[]>
  getFrameAtTimestamp: (
    fileId: string,
    timestamp: number,
  ) => Promise<{ timestamp: number; base64_data: string; is_keyframe: boolean } | null>
  isExtracting: boolean
  error: string | null
}

function callMediaManagementBinding(name: keyof MediaManagementBindings, args: any[]) {
  return getMediaManagementBindings()[name](...args)
}

export function getMediaFiles(...args: any[]): Promise<string[]> {
  return callMediaManagementBinding("getMediaFiles", args)
}

export function getMediaMetadata(...args: any[]): Promise<any> {
  return callMediaManagementBinding("getMediaMetadata", args)
}

export function getMediaMetadataService(...args: any[]): any {
  return callMediaManagementBinding("getMediaMetadataService", args)
}

export function selectAudioFile(...args: any[]): Promise<string[] | null> {
  return callMediaManagementBinding("selectAudioFile", args)
}

export function selectMediaDirectory(...args: any[]): Promise<string | null> {
  return callMediaManagementBinding("selectMediaDirectory", args)
}

export function useAutoProxy(options?: UseAutoProxyOptions): UseAutoProxyResult {
  const args = options === undefined ? [] : [options]
  return callMediaManagementBinding("useAutoProxy", args)
}

export function useCacheStatistics(...args: any[]): any {
  return callMediaManagementBinding("useCacheStatistics", args)
}

export function useFileOperations(...args: any[]): any {
  return callMediaManagementBinding("useFileOperations", args)
}

export function useFramePreview(options?: UseFramePreviewOptions): UseFramePreviewResult {
  const args = options === undefined ? [] : [options]
  return callMediaManagementBinding("useFramePreview", args)
}

export function useMediaImport(...args: any[]): MediaImportFacade {
  return callMediaManagementBinding("useMediaImport", args)
}

export function useMediaManagement(...args: any[]): MediaManagementFacade {
  return callMediaManagementBinding("useMediaManagement", args)
}

export function useMediaMetadata(...args: any[]): any {
  return callMediaManagementBinding("useMediaMetadata", args)
}

export function useMediaPreview(options?: UseMediaPreviewOptions): UseMediaPreviewResult {
  const args = options === undefined ? [] : [options]
  return callMediaManagementBinding("useMediaPreview", args)
}

export function useMediaProcessor(options?: UseMediaProcessorOptions): UseMediaProcessorResult {
  const args = options === undefined ? [] : [options]
  return callMediaManagementBinding("useMediaProcessor", args)
}

export function useMediaRestoration(...args: any[]): any {
  return callMediaManagementBinding("useMediaRestoration", args)
}

export function usePreviewPreloader(...args: any[]): any {
  return callMediaManagementBinding("usePreviewPreloader", args)
}

export function useSimpleMediaProcessor(...args: any[]): any {
  return callMediaManagementBinding("useSimpleMediaProcessor", args)
}

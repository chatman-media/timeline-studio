/**
 * Tauri Commands for Media Management Domain
 *
 * Команды для работы с медиа файлами через Tauri
 */

// Import media files
export const IMPORT_MEDIA_FILES = "import_media_files"

// Extract metadata
export const EXTRACT_MEDIA_METADATA = "extract_media_metadata"

// Generate thumbnails
export const GENERATE_VIDEO_THUMBNAIL = "generate_video_thumbnail"

// Get media duration
export const GET_MEDIA_DURATION = "get_media_duration"

// Detect video scenes
export const DETECT_VIDEO_SCENES = "detect_video_scenes"

// Generate audio waveform
export const GENERATE_AUDIO_WAVEFORM = "generate_audio_waveform"

// File operations
export const COPY_MEDIA_TO_PROJECT = "copy_media_to_project"
export const CREATE_PROXY_FILES = "create_proxy_files"
export const DELETE_MEDIA_FILES = "delete_media_files"
export const MOVE_MEDIA_FILES = "move_media_files"

// Media library
export const SCAN_MEDIA_DIRECTORY = "scan_media_directory"
export const INDEX_MEDIA_FILES = "index_media_files"
export const SEARCH_MEDIA_LIBRARY = "search_media_library"

// Export operations
export const EXPORT_MEDIA_FILE = "export_media_file"
export const BATCH_EXPORT_MEDIA = "batch_export_media"

// Conversion operations
export const CONVERT_MEDIA_FORMAT = "convert_media_format"
export const OPTIMIZE_MEDIA_FILE = "optimize_media_file"

/**
 * Command parameter types
 */

export interface ImportMediaFilesParams {
  paths: string[]
  options: {
    copy_to_project: boolean
    create_proxies: boolean
    analyze_content: boolean
    generate_thumbnails: boolean
    preserve_metadata: boolean
  }
}

export interface GenerateThumbnailParams {
  videoPath: string
  time: number
}

export interface ConvertMediaParams {
  inputPath: string
  outputPath: string
  format: string
  options?: {
    codec?: string
    bitrate?: number
    resolution?: string
    fps?: number
  }
}

export interface ExportMediaParams {
  sourcePath: string
  outputPath: string
  preset: string
  options?: Record<string, any>
}

/**
 * Core-facing media types used by UI slices.
 * Keep this file independent from domain packages so type-only UI props can
 * move off domain re-exports before media-management is extracted.
 */

export enum MediaType {
  Video = "Video",
  VideoWithAudio = "video_with_audio",
  StillImage = "Image",
  ImageSequence = "image_sequence",
  Audio = "Audio",
  Music = "music",
  Voiceover = "voiceover",
  SFX = "sfx",
  Ambient = "ambient",
  Subtitle = "subtitle",
  Title = "title",
  Graphics = "graphics",
  LUT = "lut",
  Project = "project",
  Unknown = "unknown",
}

export enum MediaCodec {
  H264 = "h264",
  H265 = "h265",
  ProRes422 = "prores_422",
  ProRes4444 = "prores_4444",
  DNxHD = "dnxhd",
  DNxHR = "dnxhr",
  AV1 = "av1",
  VP9 = "vp9",
  AAC = "aac",
  PCM = "pcm",
  FLAC = "flac",
  MP3 = "mp3",
  Opus = "opus",
  Vorbis = "vorbis",
}

export enum MediaColorSpace {
  Rec709 = "rec709",
  Rec2020 = "rec2020",
  sRGB = "srgb",
  DCI_P3 = "dci-p3",
  Adobe_RGB = "adobe-rgb",
}

export interface FfprobeData {
  streams: FfprobeStream[]
  format: FfprobeFormat
}

export interface FfprobeFormat {
  [key: string]: any
  filename?: string
  nb_streams?: number
  nb_programs?: number
  format_name?: string
  format_long_name?: string
  start_time?: number
  duration?: number
  size?: number
  bit_rate?: number
  probe_score?: number
  tags?: Record<string, string | number>
}

export interface FfprobeStream {
  [key: string]: any
  index?: number
  streamKey?: string
  codec_name?: string
  codec_long_name?: string
  profile?: number
  codec_type?: string
  codec_time_base?: string
  codec_tag_string?: string
  codec_tag?: string
  width?: number
  height?: number
  coded_width?: number
  coded_height?: number
  has_b_frames?: number
  sample_aspect_ratio?: string
  display_aspect_ratio?: string
  pix_fmt?: string
  level?: string
  color_range?: string
  color_space?: string
  color_transfer?: string
  color_primaries?: string
  chroma_location?: string
  field_order?: string
  timecode?: string
  refs?: number
  id?: string
  r_frame_rate?: string
  avg_frame_rate?: string
  time_base?: string
  start_pts?: number
  start_time?: number
  duration_ts?: string
  duration?: string
  bit_rate?: string
  max_bit_rate?: string
  bits_per_raw_sample?: string
  nb_frames?: string
  nb_read_frames?: string
  nb_read_packets?: string
  sample_fmt?: string
  sample_rate?: number
  channels?: number
  channel_layout?: string
  bits_per_sample?: number
  disposition?: FfprobeStreamDisposition
  rotation?: string | number
}

interface FfprobeStreamDisposition {
  [key: string]: any
  default?: number
  dub?: number
  original?: number
  comment?: number
  lyrics?: number
  karaoke?: number
  forced?: number
  hearing_impaired?: number
  visual_impaired?: number
  clean_effects?: number
  attached_pic?: number
  timed_thumbnails?: number
}

export interface MediaFile {
  id: string
  name: string
  path: string
  type: MediaType
  duration?: number
  size?: number
  createdAt?: Date
  updatedAt?: Date
  width?: number
  height?: number
  aspectRatio?: string
  fps?: number
  pixelAspectRatio?: number
  videoCodec?: MediaCodec | string
  videoBitrate?: number
  audioCodec?: MediaCodec | string
  audioBitrate?: number
  bitrate?: number
  sampleRate?: number
  audioChannels?: number
  colorSpace?: MediaColorSpace | string
  colorPrimaries?: string
  transferCharacteristics?: string
  chromaSubsampling?: string
  bitDepth?: number
  thumbnailPath?: string
  metadata?: {
    type: "Video" | "Audio" | "Image"
    bitrate?: number
    codec?: string
    [key: string]: any
  }
  probeData?: FfprobeData
  checksum?: string
  isVideo?: boolean
  isImage?: boolean
  isAudio?: boolean
  isAddedToTimeline?: boolean
  isIncluded?: boolean
  isUnavailable?: boolean
  lastCheckedAt?: number
  isLoadingMetadata?: boolean
  source?: "browser" | "timeline"
  startTime?: number
  endTime?: number
  proxy?: {
    path: string
    width: number
    height: number
    bitrate: number
  }
  proxies?: Array<{
    path: string
    width: number
    height: number
    bitrate: number
    streamKey: string
  }>
  lrv?: {
    path: string
    width: number
    height: number
    duration: number
    probeData?: FfprobeData
  }
  insv?: {
    path: string
    gyroPath?: string
  }
  is360?: boolean
  stereoMode?: "mono" | "side-by-side" | "top-bottom"
  projectionType?: "equirectangular" | "cubemap" | "fisheye"
  timecode?: {
    start: string
    format: "SMPTE" | "DF" | "NDF"
  }
}

export interface MediaTimeRange {
  start: number
  end: number
  duration?: number
}

export interface MediaTrack {
  id: string
  name?: string
  type: "video" | "audio" | "subtitle"
  codec?: string
  bitrate?: number
  duration?: number
  width?: number
  height?: number
  fps?: number
  pixelFormat?: string
  sampleRate?: number
  channels?: number
  channelLayout?: string
  language?: string
  index?: number
  isActive?: boolean
  videos?: MediaFile[]
  startTime?: number
  endTime?: number
  combinedDuration?: number
  timeRanges?: MediaTimeRange[]
  volume?: number
  isMuted?: boolean
  isLocked?: boolean
  isVisible?: boolean
  cameraId?: string
  cameraName?: string
}

export interface VideoSegment {
  id: string
  path: string
  startTime: number
  endTime: number
  duration: number
  sourceFileId?: string
}

export interface FileGroup {
  id: string
  name: string
  files: string[]
  createdAt: Date
  updatedAt: Date
}

export type FileStatus = "available" | "missing" | "moved" | "unknown"

export interface SavedMediaFile {
  id: string
  originalPath: string
  relativePath?: string
  name: string
  size: number
  lastModified: number
  isVideo: boolean
  isAudio: boolean
  isImage: boolean
  metadata: SavedFileMetadata
  status: FileStatus
  alternativePaths?: string[]
  lastChecked: number
}

export interface SavedMusicFile extends SavedMediaFile {
  musicMetadata?: MusicMetadata
}

export interface SavedFileMetadata {
  duration?: number
  startTime?: number
  createdAt?: string
  probeData?: {
    streams: any[]
    format: any
  }
}

export interface MusicMetadata {
  artist?: string
  album?: string
  genre?: string
  year?: number
  track?: number
  title?: string
  albumDuration?: number
}

export interface BrowserVideoMetadata {
  duration?: number
  width?: number
  height?: number
  fps?: number
  codec?: string
  bitrate?: number
  size?: number
  creation_time?: string
}

export interface AudioMetadata {
  duration?: number
  codec?: string
  bitrate?: number
  sample_rate?: number
  channels?: number
  size?: number
  creation_time?: string
}

export interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  size?: number
  creation_time?: string
}

export type MediaMetadata =
  | ({
      type: "Video"
    } & BrowserVideoMetadata)
  | ({
      type: "Audio"
    } & AudioMetadata)
  | ({
      type: "Image"
    } & ImageMetadata)
  | { type: "Unknown" }

export type MediaInfo = Omit<MediaFile, "type" | "id"> & {
  id?: string
  type: string
  metadata?: {
    type: string
    codec?: string
    width?: number
    height?: number
    fps?: number
    duration?: number
    bitrate?: number
    channels?: number
    sample_rate?: number
  }
  thumbnailPath?: string
}

export interface MediaFileOperation {
  id: string
  type: "import" | "export" | "convert" | "extract" | "analyze"
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  error?: string
  result?: any
}

export interface MediaImportOptions {
  copyToProject?: boolean
  createProxies?: boolean
  analyzeContent?: boolean
  generateThumbnails?: boolean
  preserveMetadata?: boolean
}

export interface MediaImportContext {
  files: string[]
  options: MediaImportOptions
  operations: MediaFileOperation[]
  currentOperation: string | null
  totalProgress: number
  errors: string[]
  importedFiles: string[]
}

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

export interface FileOperationsContext {
  operations: Map<string, MediaFileOperation>
  activeOperations: string[]
  completedOperations: string[]
  failedOperations: string[]
}

export type FileOperationsEvent =
  | { type: "START_OPERATION"; operation: MediaFileOperation }
  | { type: "UPDATE_PROGRESS"; operationId: string; progress: number }
  | { type: "COMPLETE_OPERATION"; operationId: string; result: any }
  | { type: "FAIL_OPERATION"; operationId: string; error: string }
  | { type: "CANCEL_OPERATION"; operationId: string }
  | { type: "CLEAR_COMPLETED" }
  | { type: "RETRY_FAILED"; operationId: string }

export interface MediaAnalysisResult {
  metadata: MediaMetadata
  thumbnailPath?: string
  waveformData?: Float32Array
  scenes?: SceneDetectionResult[]
  quality?: QualityMetrics
}

export interface SceneDetectionResult {
  startTime: number
  endTime: number
  confidence: number
  thumbnailPath?: string
}

export interface QualityMetrics {
  resolution: string
  bitrate: number
  fps: number
  codec: string
  qualityScore: number
}

export interface MediaMetadataService {
  extractMetadata(filePath: string): Promise<MediaMetadata>
  generateThumbnail(filePath: string, time?: number): Promise<string>
  analyzeMedia(filePath: string): Promise<MediaAnalysisResult>
  getMediaDuration(filePath: string): Promise<number>
}

export interface MediaManagementService {
  importFiles(files: string[], options: MediaImportOptions): Promise<any[]>
  selectMediaFiles(): Promise<string[] | null>
  selectAudioFiles(): Promise<string[] | null>
  selectMediaDirectory(): Promise<string | null>
  getMediaInfo(path: string): Promise<any>
  extractMetadata(path: string): Promise<MediaMetadata>
}

export type MediaItemType = "video" | "audio" | "image" | "sequence" | "compound"
export type MediaItemStatus = "online" | "offline" | "missing" | "proxy"

export interface MediaPoolItem {
  id: string
  type: MediaItemType
  name: string
  description?: string
  source: {
    path: string
    relativePath?: string
    hash?: string
  }
  status: MediaItemStatus
  binId: string
  metadata: {
    duration?: number
    frameRate?: number
    resolution?: {
      width: number
      height: number
    }
    codec?: string
    bitRate?: number
    fileSize: number
    createdDate: Date
    modifiedDate: Date
    importedDate: Date
  }
  usage: {
    sequences: string[]
    count: number
    lastUsed?: Date
  }
  proxy?: {
    path: string
    resolution: string
    codec: string
    generated: Date
  }
  thumbnail?: {
    path: string
    timestamp: number
  }
  waveform?: {
    path: string
    peaks: Float32Array
  }
  tags: string[]
  colorLabel?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"
  rating?: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export interface MediaBin {
  id: string
  name: string
  parentId: string | null
  color?: string
  icon?: string
  sortOrder: number
  createdDate: Date
  isExpanded?: boolean
}

export interface SmartCollection {
  id: string
  name: string
  criteria: {
    type?: MediaItemType[]
    tags?: string[]
    rating?: { min: number; max: number }
    dateRange?: { start: Date; end: Date }
    unused?: boolean
    offline?: boolean
    hasProxy?: boolean
    custom?: string
  }
  color?: string
  icon?: string
}

export interface MediaPool {
  items: Map<string, MediaPoolItem>
  bins: Map<string, MediaBin>
  smartCollections: SmartCollection[]
  viewSettings: {
    sortBy: "name" | "date" | "type" | "duration" | "usage" | "rating"
    sortOrder: "asc" | "desc"
    viewMode: "list" | "thumbnails" | "filmstrip"
    thumbnailSize: "small" | "medium" | "large"
    showOfflineMedia: boolean
    showProxyBadge: boolean
  }
  stats: {
    totalItems: number
    totalSize: number
    onlineItems: number
    offlineItems: number
    proxyItems: number
    unusedItems: number
  }
}

export interface ProxySettings {
  resolution: "1/4" | "1/2" | "custom"
  customResolution?: { width: number; height: number }
  codec: "h264" | "prores" | "dnxhd"
  quality: "low" | "medium" | "high"
  location: "project" | "cache" | "custom"
  customPath?: string
}

export interface MediaPoolOperations {
  importMedia(files: File[], binId?: string): Promise<MediaPoolItem[]>
  createBin(name: string, parentId?: string): MediaBin
  moveItems(itemIds: string[], targetBinId: string): void
  deleteItems(itemIds: string[]): void
  generateProxy(itemId: string, settings: ProxySettings): Promise<void>
  relinkOfflineMedia(itemIds: string[]): Promise<MediaPoolItem[]>
  removeUnusedItems(): MediaPoolItem[]
  exportMediaList(format: "csv" | "xml" | "json"): string
}

export interface MediaImportResult {
  imported: MediaPoolItem[]
  failed: { file: File; reason: string }[]
  duplicates: MediaPoolItem[]
}

export interface MediaPoolEvents {
  onItemAdded: (item: MediaPoolItem) => void
  onItemRemoved: (itemId: string) => void
  onItemUpdated: (item: MediaPoolItem) => void
  onBinCreated: (bin: MediaBin) => void
  onBinDeleted: (binId: string) => void
  onProxyGenerated: (itemId: string) => void
  onMediaOffline: (itemId: string) => void
  onMediaOnline: (itemId: string) => void
}

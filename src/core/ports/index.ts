/**
 * Core Ports (Interfaces)
 *
 * Контракты для взаимодействия с внешними системами.
 * Домены и фичи используют только эти интерфейсы, не зная о конкретных реализациях.
 */

export type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  AnalysisOptions,
  AnalysisProgress,
  AudioCorrelationResult,
  AudioFormat,
  AudioFormatInfo,
  AudioPeakData,
  ComprehensiveAnalysisResult,
  ConfigValidationResult,
  FaceDetectionResult,
  Fragment,
  IAIService,
  MCPConfig,
  MomentScore,
  MontagePlan,
  PersonData,
  PlanGenerationOptions,
  PlanStatistics,
  PlanValidation,
  SaveAudioParams,
  SaveAudioResult,
  SpeechOnsetData,
  SubtitleSegment,
  SystemCapabilities,
  TranscriptionResult,
  TranslationResult,
  VideoRecognitionResult,
  YOLODetectionResult,
} from "./ai.port"
export type {
  AIProjectEditCommand,
  AIProjectEditCommandType,
  AIProjectEditDiagnostic,
  AIProjectEditDiagnosticLevel,
  AIProjectEditorRequest,
  AIProjectEditorResult,
  AIProjectEditRepairContext,
  AIProjectEditRevisionSummary,
  AIProjectEditValidationError,
  IAIProjectEditor,
} from "./ai-project-editor.port"
export type { IBackendService, Unsubscribe } from "./backend.port"
export type {
  BotFeedbackMediaKind,
  BotFeedbackTranscriptionProvider,
  BotFeedbackTranscriptionRequest,
  BotFeedbackTranscriptionResult,
  IBotFeedbackTranscriber,
} from "./bot-feedback-transcriber.port"
export type {
  BotFirstCutGeneratorRequest,
  BotFirstCutGeneratorResult,
  BotFirstCutPlannerResult,
  BotFirstCutProvider,
  IBotFirstCutGenerator,
  IBotFirstCutPlanner,
} from "./bot-first-cut-generator.port"
export type { IEnhancedSubtitleAutomationService } from "./enhanced-subtitle-automation.port"
export type { EventCallback, IEventService, UnlistenFn } from "./event.port"
export type { ILanguageService, LanguageResponse } from "./language.port"
export type {
  IMediaService,
  MediaImportOptions,
  MediaImportResult,
  MediaMetadata,
  MediaPreviewData,
  ProcessMediaOptions,
  ProcessMediaResult,
  ProxyGenerationOptions,
  ProxyGenerationResult,
  ScanFolderOptions,
  ScannedMediaFile,
  SceneDetectionResult,
  ThumbnailOptions,
  WaveformData,
  WaveformOptions,
} from "./media.port"
export type {
  INodeBackendService,
  NodeBackendCacheStats,
  NodeBackendClearCacheResult,
  NodeBackendHealth,
  NodeBackendThumbnailSize,
} from "./node-backend.port"
export type {
  FileStats,
  IPlatformService,
  NotificationOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from "./platform.port"
export type { IPublishService } from "./publish.port"
export type { IRenderJobService } from "./render-job.port"
export type { IStorageService } from "./storage.port"
export type { ITranscriptionService } from "./transcription.port"
export type { IUpdateService } from "./update-service.port"
export type {
  CacheConfig,
  CacheMemoryUsage,
  CacheStats,
  CompilerSettings,
  ExtractedFrame,
  FfmpegCapabilities,
  FrameExtractionRequest,
  GpuCapabilities,
  IVideoService,
  PrerenderCacheInfo,
  PrerenderRequest,
  PrerenderResult,
  RenderJob,
  RenderProgress,
  SystemInfo,
} from "./video.port"

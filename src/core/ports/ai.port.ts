/**
 * AI Port Interface
 *
 * Контракт для работы с AI-сервисами.
 * Реализации: TauriAIService, MockAIService
 */

import type { YoloVideoData } from "../types/yolo"

// ============================================================================
// Types - Chat & API Keys
// ============================================================================

export interface MCPConfig {
  enabled: boolean
  claude_api_key?: string | null
  model: string
  max_tokens: number
  temperature: number
}

// ============================================================================
// Types - Recognition
// ============================================================================

export interface YOLODetectionResult {
  objects: Array<{
    class: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
    timestamp?: number
  }>
  processingTime: number
  frameCount?: number
}

export interface RecognitionYoloProcessorOptions {
  modelType: string
  confidenceThreshold: number
}

export interface RecognitionYoloVideoRequest {
  video_path: string
  confidence_threshold: number
  skip_frames: number
}

export interface RecognitionYoloFrameResult {
  frame_number: number
  timestamp: number
  detections: Array<{
    class: string
    class_id?: number
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
    track_id?: number
  }>
}

export type PersonIdentificationPayload = Record<string, any>

export interface PersonDatabaseStats {
  totalPersons: number
  totalEmbeddings: number
  totalAppearances: number
  averageEmbeddingsPerPerson?: number
  storageSize?: number
  lastUpdated?: string
}

export interface FaceDetectionResult {
  faces: Array<{
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
    landmarks?: Array<{ x: number; y: number }>
    embedding?: number[]
    personId?: string
  }>
  processingTime: number
}

export interface PersonData {
  id: string
  name: string
  embeddings: number[][]
  appearances: Array<{
    videoPath: string
    timestamp: number
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
  }>
  thumbnailPath?: string
}

export interface VideoRecognitionResult {
  videoId: string
  videoName: string
  videoPath: string
  frames: Array<{
    timestamp: number
    detections: Array<{
      class: string
      confidence: number
      bbox: { x: number; y: number; width: number; height: number }
    }>
  }>
  metadata: {
    model: string
    version: string
    processedAt: string
  }
}

// ============================================================================
// Types - Audio & Transcription
// ============================================================================

export interface AudioPeakData {
  peaks: number[]
  timestamps: number[]
  maxPeak: number
  avgPeak: number
  duration: number
}

export interface SpeechOnsetData {
  onsets: Array<{
    timestamp: number
    confidence: number
    energy: number
  }>
  totalOnsets: number
  avgConfidence: number
}

export interface TranscriptionResult {
  text: string
  language: string
  segments: Array<{
    start: number
    end: number
    text: string
    confidence?: number
  }>
  processingTime: number
}

export interface TranslationResult {
  originalText: string
  translatedText: string
  originalLanguage: string
  targetLanguage: string
  segments: Array<{
    start: number
    end: number
    originalText: string
    translatedText: string
  }>
  processingTime: number
}

export interface SubtitleSegment {
  index: number
  start: number
  end: number
  text: string
}

export type AudioFormat = "webm" | "mp3" | "wav" | "ogg" | "m4a"

export interface AudioFormatInfo {
  format: AudioFormat
  name: string
  description: string
  supported: boolean
}

export interface SaveAudioParams {
  audioData: string
  fileName: string
  format: AudioFormat
  useSubdirectory?: boolean
}

export interface SaveAudioResult {
  filePath: string
  fileName: string
  fileSize: number
  format: AudioFormat
}

export interface AudioCorrelationResult {
  offsetSeconds: number
  confidence: number
  correlationPeak: number
}

// ============================================================================
// Types - AI Director
// ============================================================================

export interface AIDirectorConfig {
  // Performance
  performance_mode: "Fast" | "Balanced" | "Quality" | "Custom" // PascalCase для совместимости с Rust enum

  // Core analysis toggles
  enable_audio_analysis: boolean
  enable_scene_detection: boolean
  enable_video_analysis: boolean
  enable_vision_analysis: boolean

  // Detection features
  enable_face_detection: boolean
  enable_face_analysis: boolean
  enable_object_detection: boolean
  enable_object_analysis: boolean
  enable_emotion_analysis: boolean

  // Advanced analysis
  enable_moment_detection: boolean
  enable_content_classification: boolean
  enable_composition_analysis: boolean
  enable_mood_analysis: boolean
  enable_quality_analysis: boolean

  // Processing limits
  max_processing_time: number | null // Option<u32> в Rust
  quality_threshold: number
  max_key_moments: number | null // Option<u32> в Rust
  enable_caching: boolean

  // Recommendations
  generate_editing_recommendations: boolean
  enable_mcp_agents: boolean

  // AI Provider integration
  ai_provider: "ollama" | "openai" | "anthropic" | null // Option<AIProvider> - lowercase to match Rust serde
  ai_model: string | null // Option<String>
  ai_api_key: string | null // Option<String>
  enable_ai_enhanced_analysis: boolean
  enable_ai_descriptions: boolean
  enable_ai_mood_analysis: boolean

  // Vision Language Model
  enable_vision_language_model: boolean
  vlm_model: string | null // Option<String>
  vlm_num_frames: number
  vlm_temperature: number
  vlm_max_tokens: number

  // Parallel processing (Phase 3)
  enable_parallel_processing: boolean
  max_parallel_files: number | null // Option<u32>
}

export interface ComprehensiveAnalysisResult {
  analysis_id: string
  status: string
  audio_analysis?: {
    duration: number
    loudness: number
    tempo: number
    silence_percentage: number
    transcription?: string
  }
  scene_analysis?: {
    scenes: Array<{
      start_time: number
      end_time: number
      confidence: number
      description: string
    }>
    scene_count: number
  }
  video_analysis?: {
    width: number
    height: number
    fps: number
    duration: number
    bitrate: number
    codec: string
  }
  object_detection?: {
    objects: unknown[]
    total_objects: number
  }
  face_recognition?: {
    faces: unknown[]
    total_faces: number
  }
  started_at: string
  completed_at: string
  total_duration_ms: number
  errors: string[]
}

export interface SystemCapabilities {
  audio_analysis: boolean
  video_analysis: boolean
  object_detection: boolean
  face_recognition: boolean
  transcription: boolean
  gpu_acceleration: boolean
  mcp_agents: boolean
}

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface AIDirectorHealthCheckResult {
  overall_status: "healthy" | "degraded" | "unhealthy"
  services: {
    audio_engine: "healthy" | "degraded" | "unhealthy"
    video_analysis: "healthy" | "degraded" | "unhealthy"
    scene_detection: "healthy" | "degraded" | "unhealthy"
  }
  last_check: string
}

// ============================================================================
// Types - Montage Planner
// ============================================================================

export interface Fragment {
  id: string
  videoPath: string
  startTime: number
  endTime: number
  score?: number
}

export interface MomentScore {
  timestamp: number
  score: number
  type: string
  confidence: number
}

export interface MontagePlan {
  id: string
  fragments: Fragment[]
  totalDuration: number
  createdAt: string
}

export interface AnalysisOptions {
  enableAudioAnalysis?: boolean
  enableVideoAnalysis?: boolean
  enableSceneDetection?: boolean
  qualityThreshold?: number
}

export interface PlanGenerationOptions {
  targetDuration?: number
  style?: string
  rhythm?: string
}

export interface AnalysisProgress {
  progress: number
  stage: string
  currentFile?: string
}

export interface PlanValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface PlanStatistics {
  totalClips: number
  totalDuration: number
  averageClipLength: number
  uniqueSources: number
}

// ============================================================================
// Interface
// ============================================================================

export interface IAIService {
  // === API Key Management ===
  saveApiKey(provider: string, apiKey: string): Promise<void>
  getApiKey(provider: string): Promise<string | null>
  validateApiKey(provider: string, apiKey: string): Promise<boolean>
  listApiKeys(): Promise<string[]>
  deleteApiKey(provider: string): Promise<void>

  // === MCP ===
  mcpInitialize(config: MCPConfig): Promise<boolean>
  mcpCheckApi(): Promise<boolean>

  // === YOLO Detection ===
  initYOLOProcessor(modelPath?: string, useGPU?: boolean): Promise<string>
  detectObjectsInImage(
    processorId: string,
    imagePath: string,
    confidenceThreshold?: number,
  ): Promise<YOLODetectionResult>
  analyzeVideoWithYOLO(
    processorId: string,
    videoPath: string,
    options?: { frameInterval?: number; maxFrames?: number; confidenceThreshold?: number },
  ): Promise<YOLODetectionResult[]>
  initRecognitionYoloProcessor(options: RecognitionYoloProcessorOptions): Promise<void>
  loadYoloData(videoId: string): Promise<YoloVideoData | null>
  saveYoloData(videoId: string, data: YoloVideoData): Promise<void>
  analyzeVideoWithYoloData(request: RecognitionYoloVideoRequest): Promise<RecognitionYoloFrameResult[]>
  getYOLOClassNames(processorId: string): Promise<string[]>
  updateYOLOConfidenceThreshold(processorId: string, threshold: number): Promise<void>
  getAvailableYOLOModels(): Promise<string[]>
  checkGPUAvailability(): Promise<boolean>

  // === Face Detection ===
  initRetinaFaceProcessor(): Promise<string>
  detectFacesWithLandmarks(processorId: string, imagePath: string): Promise<FaceDetectionResult>
  initFaceNetProcessor(): Promise<string>
  generateFaceEmbedding(
    processorId: string,
    imagePath: string,
    faceBox?: { x: number; y: number; width: number; height: number },
  ): Promise<number[]>
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): Promise<number>

  // === MediaPipe ===
  initMediaPipeProcessor(): Promise<string>
  detectFacesBlazeFace(processorId: string, imagePath: string): Promise<FaceDetectionResult>
  extractFaceMeshLandmarks(processorId: string, imagePath: string): Promise<Array<{ x: number; y: number; z?: number }>>
  analyzeFacialExpressions(
    processorId: string,
    imagePath: string,
  ): Promise<{ expressions: Record<string, number>; confidence: number }>

  // === Person Identification ===
  createPerson(name: string): Promise<PersonData>
  getPerson(personId: string): Promise<PersonData | null>
  addFaceEmbedding(personId: string, embedding: number[], sourcePath: string): Promise<void>
  searchSimilarPersons(
    embedding: number[],
    threshold?: number,
    maxResults?: number,
  ): Promise<Array<{ personId: string; similarity: number; name: string }>>
  addPersonAppearance(
    personId: string,
    videoPath: string,
    timestamp: number,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
  ): Promise<void>
  deletePerson(personId: string): Promise<void>
  getPersonDatabaseStats(): Promise<PersonDatabaseStats>

  // === Person Identification Database ===
  initPersonDatabase(): Promise<void>
  createPersonProfile(options: PersonIdentificationPayload): Promise<any>
  getPersonProfile(personId: string): Promise<any | null>
  deletePersonProfile(personId: string): Promise<void>
  searchSimilarPersonProfiles(options: PersonIdentificationPayload): Promise<any[]>
  addPersonFaceEmbedding(options: PersonIdentificationPayload): Promise<void>
  addPersonAppearanceRecord(options: PersonIdentificationPayload): Promise<void>
  setPersonSimilarityThreshold(threshold: number): Promise<void>
  addPersonThumbnailRecord(options: PersonIdentificationPayload): Promise<void>

  // === Advanced Face Detection ===
  initPersonFacenetProcessor(options: PersonIdentificationPayload): Promise<void>
  detectFacesAdvanced(options: PersonIdentificationPayload): Promise<any[]>
  generateFaceEmbeddingFromBase64(imageData: string): Promise<{ vector: number[]; quality: number; dimension: number }>
  analyzeFaceQuality(faceImage: string): Promise<any>
  startRealtimeFaceDetection(options: PersonIdentificationPayload): Promise<void>
  stopRealtimeFaceDetection(): Promise<void>
  updateFaceDetectionConfig(config: PersonIdentificationPayload): Promise<void>
  blurFacesInImageAdvanced(options: PersonIdentificationPayload): Promise<string>
  cleanupFaceDetection(): Promise<void>

  // === Advanced Tracking ===
  initAdvancedTracking(config: PersonIdentificationPayload): Promise<void>
  startPersonTracking(options: PersonIdentificationPayload): Promise<void>
  processTrackingFrame(options: PersonIdentificationPayload): Promise<any>
  predictTrackPositions(trackIds: string[]): Promise<any[]>
  assignPersonToTrack(trackId: string, personId: string): Promise<void>
  mergeTracks(sourceTrackId: string, targetTrackId: string): Promise<void>
  interpolateTrackPositions(options: PersonIdentificationPayload): Promise<any[]>
  stopPersonTracking(): Promise<void>
  updateTrackingConfig(config: PersonIdentificationPayload): Promise<void>
  cleanupTracking(): Promise<void>

  // === Privacy ===
  initPrivacyProcessor(): Promise<string>
  blurFacesInImage(processorId: string, imagePath: string, outputPath: string, blurIntensity?: number): Promise<void>
  blurFacesInVideoFrames(
    processorId: string,
    videoPath: string,
    outputDir: string,
    options?: { frameInterval?: number; blurIntensity?: number; preserveAudioTimestamp?: boolean },
  ): Promise<string[]>

  // === Clustering ===
  initClusteringEngine(): Promise<string>
  clusterFaces(
    engineId: string,
    embeddings: number[][],
    options?: { eps?: number; minSamples?: number; algorithm?: string },
  ): Promise<number[]>
  autoClusterVideoFaces(
    engineId: string,
    videoPath: string,
    options?: {
      frameInterval?: number
      confidenceThreshold?: number
      clusteringParams?: { eps?: number; minSamples?: number }
    },
  ): Promise<{
    clusters: Array<{
      clusterId: number
      faces: Array<{
        frameNumber: number
        timestamp: number
        bbox: { x: number; y: number; width: number; height: number }
        confidence: number
      }>
    }>
    totalFaces: number
    processingTime: number
  }>

  // === Video Recognition ===
  processVideoRecognition(
    videoPath: string,
    modelPath?: string,
    targetClasses?: string[],
  ): Promise<VideoRecognitionResult>
  getPreviewDataWithRecognition(fileId: string): Promise<{ preview_with_boxes?: string } | null>
  clearRecognitionResults(fileId: string): Promise<void>

  // === Audio Analysis ===
  analyzeAudioPeaks(
    audioPath: string,
    options?: { windowSize?: number; hopSize?: number; threshold?: number },
  ): Promise<AudioPeakData>
  detectSpeechOnsets(
    audioPath: string,
    options?: { frameSize?: number; hopSize?: number; threshold?: number },
  ): Promise<SpeechOnsetData>

  // === Whisper Transcription ===
  whisperTranscribeOpenAI(
    audioPath: string,
    options?: { model?: string; language?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranscriptionResult>
  whisperTranslateOpenAI(
    audioPath: string,
    targetLanguage?: string,
    options?: { model?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranslationResult>
  whisperTranscribeLocal(
    audioPath: string,
    options?: { model?: string; language?: string; task?: "transcribe" | "translate"; outputFormat?: string },
  ): Promise<TranscriptionResult>
  getWhisperLocalModels(): Promise<string[]>
  downloadWhisperModel(modelName: string): Promise<void>
  checkWhisperLocalAvailability(): Promise<{
    available: boolean
    models: string[]
    pythonPath?: string
    version?: string
  }>

  // === Faster Whisper ===
  initWhisperPython(): Promise<{ success: boolean; version?: string; availableModels: string[] }>
  transcribeWithFasterWhisper(
    audioPath: string,
    options?: {
      modelSize?: string
      language?: string
      task?: "transcribe" | "translate"
      beam_size?: number
      best_of?: number
      temperature?: number
    },
  ): Promise<TranscriptionResult>
  getWhisperModels(): Promise<Array<{ name: string; size: string; downloaded: boolean; downloadUrl?: string }>>
  downloadWhisperModelFaster(modelName: string): Promise<void>

  // === Audio Preparation ===
  extractAudioForWhisper(
    videoPath: string,
    outputPath?: string,
    options?: { format?: string; sampleRate?: number; channels?: number; startTime?: number; duration?: number },
  ): Promise<string>
  prepareAudioForWhisper(
    audioPath: string,
    options?: { normalize?: boolean; removeNoise?: boolean; targetSampleRate?: number; targetChannels?: number },
  ): Promise<string>

  // === Subtitle Generation ===
  generateSubtitlesFromTranscription(
    transcriptionResult: TranscriptionResult,
    options?: { format?: "srt" | "vtt" | "ass"; maxLineLength?: number; maxDuration?: number; wordsPerMinute?: number },
  ): Promise<{ subtitles: SubtitleSegment[]; formattedText: string; format: string }>

  // === Voice Recording ===
  saveVoiceRecording(params: SaveAudioParams): Promise<SaveAudioResult>
  getSupportedAudioFormats(): Promise<AudioFormatInfo[]>

  // === Audio Correlation ===
  correlateAudioFiles(basePath: string, targetPath: string, maxOffsetSeconds?: number): Promise<AudioCorrelationResult>

  // === AI Director - Core ===
  aiDirectorAnalyzeComprehensive(videoPath: string, config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult>
  aiDirectorAnalyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult>
  aiDirectorAnalyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]>
  aiDirectorAnalyzeBatchParallel(
    filePaths: string[],
    config?: AIDirectorConfig & { enable_parallel_processing?: boolean; max_parallel_files?: number },
  ): Promise<ComprehensiveAnalysisResult[]>

  // === AI Director - Configuration ===
  aiDirectorGetCapabilities(): Promise<SystemCapabilities>
  aiDirectorGetDefaultConfig(mode: "Fast" | "Balanced" | "Quality" | "Custom"): Promise<AIDirectorConfig>
  aiDirectorValidateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult>
  aiDirectorHealthCheck(): Promise<AIDirectorHealthCheckResult>

  // === Unified Audio Analysis ===
  unifiedAudioAnalyzeComprehensive(
    videoPath: string,
    config?: {
      enable_ffmpeg_analysis?: boolean
      enable_montage_analysis?: boolean
      enable_transcription?: boolean
      performance_mode?: "Fast" | "Balanced" | "Quality"
    },
  ): Promise<unknown>
  unifiedAudioAnalyzeQuick(videoPath: string): Promise<unknown>
  unifiedAudioAnalyzeBatch(
    filePaths: string[],
    config?: { performance_mode?: "Fast" | "Balanced" | "Quality" },
  ): Promise<unknown[]>
  unifiedAudioGetCapabilities(): Promise<{
    ffmpegAvailable: boolean
    montageAvailable: boolean
    whisperAvailable: boolean
    gpuAvailable: boolean
  }>

  // === Comprehensive Video Analysis ===
  analyzeVideoComprehensive(
    videoPath: string,
    options?: {
      enable_object_detection?: boolean
      enable_face_detection?: boolean
      enable_emotion_analysis?: boolean
      enable_composition_analysis?: boolean
      enable_audio_analysis?: boolean
      quality_threshold?: number
      max_moments?: number
    },
  ): Promise<unknown>

  // === Montage Planner - Analysis ===
  analyzeMontagVideos(
    videoIds: string[],
    options: AnalysisOptions,
  ): Promise<{ fragments: Fragment[]; momentScores: MomentScore[]; videoAnalysis: unknown; audioAnalysis: unknown }>
  analyzeVideoComposition(videoPath: string, options?: Partial<AnalysisOptions>): Promise<unknown>
  detectKeyMoments(videoPath: string, analysisResults: unknown): Promise<MomentScore[]>
  getAnalysisProgress(): Promise<AnalysisProgress>

  // === Montage Planner - Plan Generation ===
  generateMontagePlan(fragments: Fragment[], options: PlanGenerationOptions): Promise<MontagePlan>
  optimizeMontagePlan(plan: MontagePlan, preferences?: unknown): Promise<MontagePlan>

  // === Montage Planner - Validation ===
  validateMontagePlan(plan: MontagePlan): Promise<PlanValidation>
  calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics>

  // === Montage Planner - Application ===
  applyMontagePlan(plan: MontagePlan): Promise<void>
  exportMontagePlan(plan: MontagePlan, format: string): Promise<void>
  updateCompositionWeights(weights: Record<string, number>): Promise<void>

  // === Additional Video Analysis ===
  analyzeVideoQuality(videoPath: string): Promise<unknown>
  analyzeFrameQuality(videoPath: string, timestamp: number): Promise<unknown>
  analyzeAudioContent(audioPath: string): Promise<unknown>
}

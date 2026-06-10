/**
 * Tauri AI Adapter
 *
 * Реализация IAIService для Tauri.
 * Использует invoke() для вызова Rust backend команд.
 */

import { invoke } from "@tauri-apps/api/core"

import type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  AnalysisOptions,
  AnalysisProgress,
  AudioCorrelationResult,
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
  RecognitionYoloFrameResult,
  RecognitionYoloProcessorOptions,
  RecognitionYoloVideoRequest,
  SaveAudioParams,
  SaveAudioResult,
  SpeechOnsetData,
  SubtitleSegment,
  SystemCapabilities,
  TranscriptionResult,
  TranslationResult,
  VideoRecognitionResult,
  YOLODetectionResult,
} from "@/core/ports"
import type { YoloVideoData } from "@/core/types/yolo"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("TauriAIService")

export class TauriAIService implements IAIService {
  // ============================================================================
  // API Key Management
  // ============================================================================

  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    logger.infoSync("Saving API key", { provider })
    return invoke("save_simple_api_key", { provider, apiKey })
  }

  async getApiKey(provider: string): Promise<string | null> {
    logger.debugSync("Getting API key", { provider })
    return invoke("get_decrypted_api_key", { provider })
  }

  async validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    logger.debugSync("Validating API key", { provider })
    return invoke("validate_api_key", { provider, apiKey })
  }

  async listApiKeys(): Promise<string[]> {
    logger.debugSync("Listing API keys")
    return invoke("list_api_keys")
  }

  async deleteApiKey(provider: string): Promise<void> {
    logger.infoSync("Deleting API key", { provider })
    return invoke("delete_api_key", { provider })
  }

  // ============================================================================
  // MCP
  // ============================================================================

  async mcpInitialize(config: MCPConfig): Promise<boolean> {
    logger.infoSync("Initializing MCP", { model: config.model })
    return invoke("mcp_initialize", { config })
  }

  async mcpCheckApi(): Promise<boolean> {
    logger.debugSync("Checking MCP API")
    return invoke("mcp_check_api")
  }

  // ============================================================================
  // YOLO Detection
  // ============================================================================

  async initYOLOProcessor(modelPath?: string, useGPU?: boolean): Promise<string> {
    logger.infoSync("Initializing YOLO processor", { modelPath, useGPU })
    return invoke("init_yolo_processor", { modelPath, useGPU: useGPU ?? true })
  }

  async detectObjectsInImage(
    processorId: string,
    imagePath: string,
    confidenceThreshold?: number,
  ): Promise<YOLODetectionResult> {
    logger.debugSync("Detecting objects in image", { processorId, imagePath })
    return invoke("detect_objects_in_image", {
      processorId,
      imagePath,
      confidenceThreshold: confidenceThreshold ?? 0.5,
    })
  }

  async analyzeVideoWithYOLO(
    processorId: string,
    videoPath: string,
    options?: { frameInterval?: number; maxFrames?: number; confidenceThreshold?: number },
  ): Promise<YOLODetectionResult[]> {
    logger.infoSync("Analyzing video with YOLO", { processorId, videoPath })
    return invoke("analyze_video_with_yolo", { processorId, videoPath, options: options || {} })
  }

  async initRecognitionYoloProcessor(options: RecognitionYoloProcessorOptions): Promise<void> {
    logger.infoSync("Initializing recognition YOLO processor", { options })
    return invoke("init_yolo_processor", {
      modelType: options.modelType,
      confidenceThreshold: options.confidenceThreshold,
    })
  }

  async loadYoloData(videoId: string): Promise<YoloVideoData | null> {
    logger.debugSync("Loading YOLO data", { videoId })
    return invoke("load_yolo_data", { videoId })
  }

  async saveYoloData(videoId: string, data: YoloVideoData): Promise<void> {
    logger.infoSync("Saving YOLO data", { videoId })
    return invoke("save_yolo_data", { videoId, data })
  }

  async analyzeVideoWithYoloData(request: RecognitionYoloVideoRequest): Promise<RecognitionYoloFrameResult[]> {
    logger.infoSync("Analyzing video with YOLO data service", {
      videoPath: request.video_path,
      skipFrames: request.skip_frames,
    })
    return invoke("analyze_video_with_yolo", { request })
  }

  async getYOLOClassNames(processorId: string): Promise<string[]> {
    return invoke("get_yolo_class_names_advanced", { processorId })
  }

  async updateYOLOConfidenceThreshold(processorId: string, threshold: number): Promise<void> {
    return invoke("update_yolo_confidence_threshold", { processorId, threshold })
  }

  async getAvailableYOLOModels(): Promise<string[]> {
    return invoke("get_available_yolo_models")
  }

  async checkGPUAvailability(): Promise<boolean> {
    return invoke("check_gpu_availability")
  }

  // ============================================================================
  // Face Detection
  // ============================================================================

  async initRetinaFaceProcessor(): Promise<string> {
    logger.infoSync("Initializing RetinaFace processor")
    return invoke("init_retinaface_processor")
  }

  async detectFacesWithLandmarks(processorId: string, imagePath: string): Promise<FaceDetectionResult> {
    logger.debugSync("Detecting faces with landmarks", { processorId, imagePath })
    return invoke("detect_faces_with_landmarks", { processorId, imagePath })
  }

  async initFaceNetProcessor(): Promise<string> {
    logger.infoSync("Initializing FaceNet processor")
    return invoke("init_facenet_processor")
  }

  async generateFaceEmbedding(
    processorId: string,
    imagePath: string,
    faceBox?: { x: number; y: number; width: number; height: number },
  ): Promise<number[]> {
    logger.debugSync("Generating face embedding", { processorId, imagePath })
    return invoke("generate_face_embedding", { processorId, imagePath, faceBox })
  }

  async calculateCosineSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    return invoke("calculate_cosine_similarity", { embedding1, embedding2 })
  }

  // ============================================================================
  // MediaPipe
  // ============================================================================

  async initMediaPipeProcessor(): Promise<string> {
    logger.infoSync("Initializing MediaPipe processor")
    return invoke("init_mediapipe_processor")
  }

  async detectFacesBlazeFace(processorId: string, imagePath: string): Promise<FaceDetectionResult> {
    logger.debugSync("Detecting faces with BlazeFace", { processorId, imagePath })
    return invoke("detect_faces_blazeface", { processorId, imagePath })
  }

  async extractFaceMeshLandmarks(
    processorId: string,
    imagePath: string,
  ): Promise<Array<{ x: number; y: number; z?: number }>> {
    logger.debugSync("Extracting face mesh landmarks", { processorId, imagePath })
    return invoke("extract_face_mesh_landmarks", { processorId, imagePath })
  }

  async analyzeFacialExpressions(
    processorId: string,
    imagePath: string,
  ): Promise<{ expressions: Record<string, number>; confidence: number }> {
    logger.debugSync("Analyzing facial expressions", { processorId, imagePath })
    return invoke("analyze_facial_expressions", { processorId, imagePath })
  }

  // ============================================================================
  // Person Identification
  // ============================================================================

  async createPerson(name: string): Promise<PersonData> {
    logger.infoSync("Creating person", { name })
    return invoke("create_person", { name })
  }

  async getPerson(personId: string): Promise<PersonData | null> {
    return invoke("get_person", { personId })
  }

  async addFaceEmbedding(personId: string, embedding: number[], sourcePath: string): Promise<void> {
    logger.debugSync("Adding face embedding", { personId, sourcePath })
    return invoke("add_face_embedding", { personId, embedding, sourcePath })
  }

  async searchSimilarPersons(
    embedding: number[],
    threshold?: number,
    maxResults?: number,
  ): Promise<Array<{ personId: string; similarity: number; name: string }>> {
    logger.debugSync("Searching similar persons")
    return invoke("search_similar_persons", {
      embedding,
      threshold: threshold ?? 0.7,
      maxResults: maxResults ?? 5,
    })
  }

  async addPersonAppearance(
    personId: string,
    videoPath: string,
    timestamp: number,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
  ): Promise<void> {
    logger.debugSync("Adding person appearance", { personId, videoPath, timestamp })
    return invoke("add_person_appearance", { personId, videoPath, timestamp, bbox, confidence })
  }

  async deletePerson(personId: string): Promise<void> {
    logger.infoSync("Deleting person", { personId })
    return invoke("delete_person", { personId })
  }

  async getPersonDatabaseStats(): Promise<{
    totalPersons: number
    totalEmbeddings: number
    totalAppearances: number
  }> {
    return invoke("get_person_database_stats")
  }

  // ============================================================================
  // Privacy
  // ============================================================================

  async initPrivacyProcessor(): Promise<string> {
    logger.infoSync("Initializing privacy processor")
    return invoke("init_privacy_processor")
  }

  async blurFacesInImage(
    processorId: string,
    imagePath: string,
    outputPath: string,
    blurIntensity?: number,
  ): Promise<void> {
    logger.infoSync("Blurring faces in image", { processorId, imagePath, outputPath })
    return invoke("blur_faces_in_image", {
      processorId,
      imagePath,
      outputPath,
      blurIntensity: blurIntensity ?? 15,
    })
  }

  async blurFacesInVideoFrames(
    processorId: string,
    videoPath: string,
    outputDir: string,
    options?: { frameInterval?: number; blurIntensity?: number; preserveAudioTimestamp?: boolean },
  ): Promise<string[]> {
    logger.infoSync("Blurring faces in video frames", { processorId, videoPath, outputDir })
    return invoke("blur_faces_in_video_frames", { processorId, videoPath, outputDir, options: options || {} })
  }

  // ============================================================================
  // Clustering
  // ============================================================================

  async initClusteringEngine(): Promise<string> {
    logger.infoSync("Initializing clustering engine")
    return invoke("init_clustering_engine")
  }

  async clusterFaces(
    engineId: string,
    embeddings: number[][],
    options?: { eps?: number; minSamples?: number; algorithm?: string },
  ): Promise<number[]> {
    logger.debugSync("Clustering faces", { engineId, embeddingCount: embeddings.length })
    return invoke("cluster_faces", { engineId, embeddings, options: options || {} })
  }

  async autoClusterVideoFaces(
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
  }> {
    logger.infoSync("Auto-clustering video faces", { engineId, videoPath })
    return invoke("auto_cluster_video_faces", { engineId, videoPath, options: options || {} })
  }

  // ============================================================================
  // Video Recognition
  // ============================================================================

  async processVideoRecognition(
    videoPath: string,
    modelPath?: string,
    targetClasses?: string[],
  ): Promise<VideoRecognitionResult> {
    logger.infoSync("Processing video recognition", { videoPath })
    return invoke("process_video_recognition", { videoPath, modelPath, targetClasses })
  }

  async getPreviewDataWithRecognition(fileId: string): Promise<{ preview_with_boxes?: string } | null> {
    logger.debugSync("Getting preview data with recognition", { fileId })
    return invoke("get_preview_data_with_recognition", { fileId })
  }

  async clearRecognitionResults(fileId: string): Promise<void> {
    logger.infoSync("Clearing recognition results", { fileId })
    return invoke("clear_recognition_results", { fileId })
  }

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  async analyzeAudioPeaks(
    audioPath: string,
    options?: { windowSize?: number; hopSize?: number; threshold?: number },
  ): Promise<AudioPeakData> {
    logger.infoSync("Analyzing audio peaks", { audioPath })
    return invoke("analyze_audio_peaks", { audioPath, options: options || {} })
  }

  async detectSpeechOnsets(
    audioPath: string,
    options?: { frameSize?: number; hopSize?: number; threshold?: number },
  ): Promise<SpeechOnsetData> {
    logger.infoSync("Detecting speech onsets", { audioPath })
    return invoke("detect_speech_onsets", { audioPath, options: options || {} })
  }

  // ============================================================================
  // Whisper Transcription
  // ============================================================================

  async whisperTranscribeOpenAI(
    audioPath: string,
    options?: { model?: string; language?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranscriptionResult> {
    logger.infoSync("Transcribing with OpenAI Whisper", { audioPath })
    return invoke("whisper_transcribe_openai", { audioPath, options: options || {} })
  }

  async whisperTranslateOpenAI(
    audioPath: string,
    targetLanguage?: string,
    options?: { model?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranslationResult> {
    logger.infoSync("Translating with OpenAI Whisper", { audioPath, targetLanguage })
    return invoke("whisper_translate_openai", {
      audioPath,
      targetLanguage: targetLanguage ?? "en",
      options: options || {},
    })
  }

  async whisperTranscribeLocal(
    audioPath: string,
    options?: { model?: string; language?: string; task?: "transcribe" | "translate"; outputFormat?: string },
  ): Promise<TranscriptionResult> {
    logger.infoSync("Transcribing with local Whisper", { audioPath })
    return invoke("whisper_transcribe_local", { audioPath, options: options || {} })
  }

  async getWhisperLocalModels(): Promise<string[]> {
    return invoke("whisper_get_local_models")
  }

  async downloadWhisperModel(modelName: string): Promise<void> {
    logger.infoSync("Downloading Whisper model", { modelName })
    return invoke("whisper_download_model", { modelName })
  }

  async checkWhisperLocalAvailability(): Promise<{
    available: boolean
    models: string[]
    pythonPath?: string
    version?: string
  }> {
    return invoke("whisper_check_local_availability")
  }

  // ============================================================================
  // Faster Whisper
  // ============================================================================

  async initWhisperPython(): Promise<{ success: boolean; version?: string; availableModels: string[] }> {
    logger.infoSync("Initializing Faster Whisper")
    return invoke("init_whisper_python")
  }

  async transcribeWithFasterWhisper(
    audioPath: string,
    options?: {
      modelSize?: string
      language?: string
      task?: "transcribe" | "translate"
      beam_size?: number
      best_of?: number
      temperature?: number
    },
  ): Promise<TranscriptionResult> {
    logger.infoSync("Transcribing with Faster Whisper", { audioPath })
    return invoke("transcribe_with_faster_whisper", { audioPath, options: options || {} })
  }

  async getWhisperModels(): Promise<Array<{ name: string; size: string; downloaded: boolean; downloadUrl?: string }>> {
    return invoke("get_whisper_models")
  }

  async downloadWhisperModelFaster(modelName: string): Promise<void> {
    logger.infoSync("Downloading Faster Whisper model", { modelName })
    return invoke("download_whisper_model", { modelName })
  }

  // ============================================================================
  // Audio Preparation
  // ============================================================================

  async extractAudioForWhisper(
    videoPath: string,
    outputPath?: string,
    options?: { format?: string; sampleRate?: number; channels?: number; startTime?: number; duration?: number },
  ): Promise<string> {
    logger.infoSync("Extracting audio for Whisper", { videoPath })
    return invoke("extract_audio_for_whisper", { videoPath, outputPath, options: options || {} })
  }

  async prepareAudioForWhisper(
    audioPath: string,
    options?: { normalize?: boolean; removeNoise?: boolean; targetSampleRate?: number; targetChannels?: number },
  ): Promise<string> {
    logger.infoSync("Preparing audio for Whisper", { audioPath })
    return invoke("prepare_audio_for_whisper", { audioPath, options: options || {} })
  }

  // ============================================================================
  // Subtitle Generation
  // ============================================================================

  async generateSubtitlesFromTranscription(
    transcriptionResult: TranscriptionResult,
    options?: { format?: "srt" | "vtt" | "ass"; maxLineLength?: number; maxDuration?: number; wordsPerMinute?: number },
  ): Promise<{ subtitles: SubtitleSegment[]; formattedText: string; format: string }> {
    logger.debugSync("Generating subtitles from transcription")
    return invoke("generate_subtitles_from_transcription", { transcriptionResult, options: options || {} })
  }

  // ============================================================================
  // Voice Recording
  // ============================================================================

  async saveVoiceRecording(params: SaveAudioParams): Promise<SaveAudioResult> {
    logger.infoSync("Saving voice recording", { fileName: params.fileName })
    return invoke("save_voice_recording", { params })
  }

  async getSupportedAudioFormats(): Promise<AudioFormatInfo[]> {
    logger.debugSync("Getting supported audio formats")
    return invoke("get_supported_audio_formats")
  }

  // ============================================================================
  // Audio Correlation
  // ============================================================================

  async correlateAudioFiles(
    basePath: string,
    targetPath: string,
    maxOffsetSeconds?: number,
  ): Promise<AudioCorrelationResult> {
    logger.infoSync("Correlating audio files", { basePath, targetPath })
    return invoke("correlate_audio_files", { basePath, targetPath, maxOffsetSeconds: maxOffsetSeconds ?? 30 })
  }

  // ============================================================================
  // AI Director - Core
  // ============================================================================

  async aiDirectorAnalyzeComprehensive(
    videoPath: string,
    config?: AIDirectorConfig,
  ): Promise<ComprehensiveAnalysisResult> {
    logger.infoSync("Running comprehensive analysis", { videoPath })
    return invoke("ai_director_v2_analyze_comprehensive", { videoPath, config })
  }

  async aiDirectorAnalyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
    logger.infoSync("Running quick analysis", { videoPath })
    return invoke("ai_director_v2_analyze_quick", { videoPath })
  }

  async aiDirectorAnalyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]> {
    logger.infoSync("Running batch analysis", { fileCount: filePaths.length })
    return invoke("ai_director_v2_analyze_batch", { filePaths, config })
  }

  async aiDirectorAnalyzeBatchParallel(
    filePaths: string[],
    config?: AIDirectorConfig & { enable_parallel_processing?: boolean; max_parallel_files?: number },
  ): Promise<ComprehensiveAnalysisResult[]> {
    const maxParallel = config?.max_parallel_files ?? 4
    logger.infoSync("Running parallel batch analysis", { fileCount: filePaths.length, maxParallel })
    return invoke("ai_director_v2_analyze_batch_parallel", {
      filePaths,
      config: { ...config, enable_parallel_processing: true, max_parallel_files: maxParallel },
    })
  }

  // ============================================================================
  // AI Director - Configuration
  // ============================================================================

  async aiDirectorGetCapabilities(): Promise<SystemCapabilities> {
    logger.debugSync("Getting AI Director capabilities")
    return invoke("ai_director_get_capabilities")
  }

  async aiDirectorGetDefaultConfig(mode: "Fast" | "Balanced" | "Quality" | "Custom"): Promise<AIDirectorConfig> {
    logger.debugSync("Getting default config", { mode })
    // Конвертируем в lowercase для Rust команды (если нужно)
    const rustMode = mode.toLowerCase() as "fast" | "balanced" | "quality" | "custom"
    return invoke("ai_director_get_default_config", { mode: rustMode })
  }

  async aiDirectorValidateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult> {
    logger.debugSync("Validating AI Director config")
    return invoke("ai_director_validate_config", { config })
  }

  async aiDirectorHealthCheck(): Promise<AIDirectorHealthCheckResult> {
    logger.debugSync("Running AI Director health check")
    return invoke("ai_director_health_check")
  }

  // ============================================================================
  // Unified Audio Analysis
  // ============================================================================

  async unifiedAudioAnalyzeComprehensive(
    videoPath: string,
    config?: {
      enable_ffmpeg_analysis?: boolean
      enable_montage_analysis?: boolean
      enable_transcription?: boolean
      performance_mode?: "Fast" | "Balanced" | "Quality"
    },
  ): Promise<unknown> {
    logger.infoSync("Running unified audio comprehensive analysis", { videoPath })
    return invoke("unified_audio_analyze_comprehensive", {
      videoPath,
      config: {
        enable_ffmpeg_analysis: config?.enable_ffmpeg_analysis ?? true,
        enable_montage_analysis: config?.enable_montage_analysis ?? true,
        enable_transcription: config?.enable_transcription ?? false,
        performance_mode: config?.performance_mode ?? "Balanced",
      },
    })
  }

  async unifiedAudioAnalyzeQuick(videoPath: string): Promise<unknown> {
    logger.infoSync("Running unified audio quick analysis", { videoPath })
    return invoke("unified_audio_analyze_quick", { videoPath })
  }

  async unifiedAudioAnalyzeBatch(
    filePaths: string[],
    config?: { performance_mode?: "Fast" | "Balanced" | "Quality" },
  ): Promise<unknown[]> {
    logger.infoSync("Running unified audio batch analysis", { fileCount: filePaths.length })
    return invoke("unified_audio_analyze_batch", {
      filePaths,
      config: { performance_mode: config?.performance_mode ?? "Fast" },
    })
  }

  async unifiedAudioGetCapabilities(): Promise<{
    ffmpegAvailable: boolean
    montageAvailable: boolean
    whisperAvailable: boolean
    gpuAvailable: boolean
  }> {
    logger.debugSync("Getting unified audio capabilities")
    return invoke("unified_audio_get_capabilities")
  }

  // ============================================================================
  // Comprehensive Video Analysis
  // ============================================================================

  async analyzeVideoComprehensive(
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
  ): Promise<unknown> {
    logger.infoSync("Running comprehensive video analysis", { videoPath })
    return invoke("analyze_video_comprehensive", {
      videoPath,
      options: {
        enable_object_detection: options?.enable_object_detection ?? true,
        enable_face_detection: options?.enable_face_detection ?? true,
        enable_emotion_analysis: options?.enable_emotion_analysis ?? true,
        enable_composition_analysis: options?.enable_composition_analysis ?? true,
        enable_audio_analysis: options?.enable_audio_analysis ?? true,
        quality_threshold: options?.quality_threshold ?? 50.0,
        max_moments: options?.max_moments ?? 50,
      },
    })
  }

  // ============================================================================
  // Montage Planner - Analysis
  // ============================================================================

  async analyzeMontagVideos(
    videoIds: string[],
    options: AnalysisOptions,
  ): Promise<{ fragments: Fragment[]; momentScores: MomentScore[]; videoAnalysis: unknown; audioAnalysis: unknown }> {
    logger.infoSync("Analyzing montage videos", { videoCount: videoIds.length })
    return invoke("analyze_montage_videos", { videoIds, options })
  }

  async analyzeVideoComposition(videoPath: string, options?: Partial<AnalysisOptions>): Promise<unknown> {
    logger.infoSync("Analyzing video composition", { videoPath })
    return invoke("analyze_video_composition", { videoPath, options: options || {} })
  }

  async detectKeyMoments(videoPath: string, analysisResults: unknown): Promise<MomentScore[]> {
    logger.infoSync("Detecting key moments", { videoPath })
    return invoke("detect_key_moments", { videoPath, analysisResults })
  }

  async getAnalysisProgress(): Promise<AnalysisProgress> {
    return invoke("get_analysis_progress")
  }

  // ============================================================================
  // Montage Planner - Plan Generation
  // ============================================================================

  async generateMontagePlan(fragments: Fragment[], options: PlanGenerationOptions): Promise<MontagePlan> {
    logger.infoSync("Generating montage plan", { fragmentCount: fragments.length })
    return invoke("generate_montage_plan", { fragments, options })
  }

  async optimizeMontagePlan(plan: MontagePlan, preferences?: unknown): Promise<MontagePlan> {
    logger.infoSync("Optimizing montage plan", { planId: plan.id })
    return invoke("optimize_montage_plan", { plan, preferences: preferences || {} })
  }

  // ============================================================================
  // Montage Planner - Validation
  // ============================================================================

  async validateMontagePlan(plan: MontagePlan): Promise<PlanValidation> {
    logger.debugSync("Validating montage plan", { planId: plan.id })
    return invoke("validate_montage_plan", { plan })
  }

  async calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics> {
    logger.debugSync("Calculating plan statistics", { planId: plan.id })
    return invoke("calculate_plan_statistics", { plan })
  }

  // ============================================================================
  // Montage Planner - Application
  // ============================================================================

  async applyMontagePlan(plan: MontagePlan): Promise<void> {
    logger.infoSync("Applying montage plan", { planId: plan.id })
    return invoke("apply_montage_plan", { plan })
  }

  async exportMontagePlan(plan: MontagePlan, format: string): Promise<void> {
    logger.infoSync("Exporting montage plan", { planId: plan.id, format })
    return invoke("export_montage_plan", { plan, format })
  }

  async updateCompositionWeights(weights: Record<string, number>): Promise<void> {
    logger.debugSync("Updating composition weights")
    return invoke("update_composition_weights", { weights })
  }

  // ============================================================================
  // Additional Video Analysis
  // ============================================================================

  async analyzeVideoQuality(videoPath: string): Promise<unknown> {
    logger.infoSync("Analyzing video quality", { videoPath })
    return invoke("analyze_video_quality", { videoPath })
  }

  async analyzeFrameQuality(videoPath: string, timestamp: number): Promise<unknown> {
    logger.debugSync("Analyzing frame quality", { videoPath, timestamp })
    return invoke("analyze_frame_quality", { videoPath, timestamp })
  }

  async analyzeAudioContent(audioPath: string): Promise<unknown> {
    logger.infoSync("Analyzing audio content", { audioPath })
    return invoke("analyze_audio_content", { audioPath })
  }
}

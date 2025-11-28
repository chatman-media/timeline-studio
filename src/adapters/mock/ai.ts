/**
 * Mock AI Adapter
 *
 * Реализация IAIService для тестов и браузера.
 * Возвращает заглушки для всех методов.
 */

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

export class MockAIService implements IAIService {
  private apiKeys: Map<string, string> = new Map()
  private persons: Map<string, PersonData> = new Map()

  // ============================================================================
  // API Key Management
  // ============================================================================

  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    this.apiKeys.set(provider, apiKey)
  }

  async getApiKey(provider: string): Promise<string | null> {
    return this.apiKeys.get(provider) || null
  }

  async validateApiKey(_provider: string, _apiKey: string): Promise<boolean> {
    return true
  }

  async listApiKeys(): Promise<string[]> {
    return Array.from(this.apiKeys.keys())
  }

  async deleteApiKey(provider: string): Promise<void> {
    this.apiKeys.delete(provider)
  }

  // ============================================================================
  // MCP
  // ============================================================================

  async mcpInitialize(_config: MCPConfig): Promise<boolean> {
    return true
  }

  async mcpCheckApi(): Promise<boolean> {
    return false
  }

  // ============================================================================
  // YOLO Detection
  // ============================================================================

  async initYOLOProcessor(_modelPath?: string, _useGPU?: boolean): Promise<string> {
    return `mock-yolo-${Date.now()}`
  }

  async detectObjectsInImage(
    _processorId: string,
    _imagePath: string,
    _confidenceThreshold?: number,
  ): Promise<YOLODetectionResult> {
    return { objects: [], processingTime: 0 }
  }

  async analyzeVideoWithYOLO(
    _processorId: string,
    _videoPath: string,
    _options?: { frameInterval?: number; maxFrames?: number; confidenceThreshold?: number },
  ): Promise<YOLODetectionResult[]> {
    return []
  }

  async getYOLOClassNames(_processorId: string): Promise<string[]> {
    return ["person", "car", "dog", "cat"]
  }

  async updateYOLOConfidenceThreshold(_processorId: string, _threshold: number): Promise<void> {}

  async getAvailableYOLOModels(): Promise<string[]> {
    return ["yolov8n", "yolov8s", "yolov8m"]
  }

  async checkGPUAvailability(): Promise<boolean> {
    return false
  }

  // ============================================================================
  // Face Detection
  // ============================================================================

  async initRetinaFaceProcessor(): Promise<string> {
    return `mock-retinaface-${Date.now()}`
  }

  async detectFacesWithLandmarks(_processorId: string, _imagePath: string): Promise<FaceDetectionResult> {
    return { faces: [], processingTime: 0 }
  }

  async initFaceNetProcessor(): Promise<string> {
    return `mock-facenet-${Date.now()}`
  }

  async generateFaceEmbedding(
    _processorId: string,
    _imagePath: string,
    _faceBox?: { x: number; y: number; width: number; height: number },
  ): Promise<number[]> {
    return new Array(128).fill(0)
  }

  async calculateCosineSimilarity(_embedding1: number[], _embedding2: number[]): Promise<number> {
    return 0.5
  }

  // ============================================================================
  // MediaPipe
  // ============================================================================

  async initMediaPipeProcessor(): Promise<string> {
    return `mock-mediapipe-${Date.now()}`
  }

  async detectFacesBlazeFace(_processorId: string, _imagePath: string): Promise<FaceDetectionResult> {
    return { faces: [], processingTime: 0 }
  }

  async extractFaceMeshLandmarks(
    _processorId: string,
    _imagePath: string,
  ): Promise<Array<{ x: number; y: number; z?: number }>> {
    return []
  }

  async analyzeFacialExpressions(
    _processorId: string,
    _imagePath: string,
  ): Promise<{ expressions: Record<string, number>; confidence: number }> {
    return { expressions: {}, confidence: 0 }
  }

  // ============================================================================
  // Person Identification
  // ============================================================================

  async createPerson(name: string): Promise<PersonData> {
    const person: PersonData = {
      id: `person-${Date.now()}`,
      name,
      embeddings: [],
      appearances: [],
    }
    this.persons.set(person.id, person)
    return person
  }

  async getPerson(personId: string): Promise<PersonData | null> {
    return this.persons.get(personId) || null
  }

  async addFaceEmbedding(personId: string, embedding: number[], _sourcePath: string): Promise<void> {
    const person = this.persons.get(personId)
    if (person) {
      person.embeddings.push(embedding)
    }
  }

  async searchSimilarPersons(
    _embedding: number[],
    _threshold?: number,
    _maxResults?: number,
  ): Promise<Array<{ personId: string; similarity: number; name: string }>> {
    return []
  }

  async addPersonAppearance(
    personId: string,
    videoPath: string,
    timestamp: number,
    bbox: { x: number; y: number; width: number; height: number },
    confidence: number,
  ): Promise<void> {
    const person = this.persons.get(personId)
    if (person) {
      person.appearances.push({ videoPath, timestamp, bbox, confidence })
    }
  }

  async deletePerson(personId: string): Promise<void> {
    this.persons.delete(personId)
  }

  async getPersonDatabaseStats(): Promise<{
    totalPersons: number
    totalEmbeddings: number
    totalAppearances: number
  }> {
    let totalEmbeddings = 0
    let totalAppearances = 0
    this.persons.forEach((person) => {
      totalEmbeddings += person.embeddings.length
      totalAppearances += person.appearances.length
    })
    return { totalPersons: this.persons.size, totalEmbeddings, totalAppearances }
  }

  // ============================================================================
  // Privacy
  // ============================================================================

  async initPrivacyProcessor(): Promise<string> {
    return `mock-privacy-${Date.now()}`
  }

  async blurFacesInImage(
    _processorId: string,
    _imagePath: string,
    _outputPath: string,
    _blurIntensity?: number,
  ): Promise<void> {}

  async blurFacesInVideoFrames(
    _processorId: string,
    _videoPath: string,
    _outputDir: string,
    _options?: { frameInterval?: number; blurIntensity?: number; preserveAudioTimestamp?: boolean },
  ): Promise<string[]> {
    return []
  }

  // ============================================================================
  // Clustering
  // ============================================================================

  async initClusteringEngine(): Promise<string> {
    return `mock-clustering-${Date.now()}`
  }

  async clusterFaces(
    _engineId: string,
    embeddings: number[][],
    _options?: { eps?: number; minSamples?: number; algorithm?: string },
  ): Promise<number[]> {
    return embeddings.map((_, i) => i % 3)
  }

  async autoClusterVideoFaces(
    _engineId: string,
    _videoPath: string,
    _options?: {
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
    return { clusters: [], totalFaces: 0, processingTime: 0 }
  }

  // ============================================================================
  // Video Recognition
  // ============================================================================

  async processVideoRecognition(
    videoPath: string,
    _modelPath?: string,
    _targetClasses?: string[],
  ): Promise<VideoRecognitionResult> {
    return {
      videoId: `mock-video-${Date.now()}`,
      videoName: videoPath.split("/").pop() || "video",
      videoPath,
      frames: [],
      metadata: { model: "mock", version: "1.0", processedAt: new Date().toISOString() },
    }
  }

  async getPreviewDataWithRecognition(_fileId: string): Promise<{ preview_with_boxes?: string } | null> {
    return null
  }

  async clearRecognitionResults(_fileId: string): Promise<void> {}

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  async analyzeAudioPeaks(
    _audioPath: string,
    _options?: { windowSize?: number; hopSize?: number; threshold?: number },
  ): Promise<AudioPeakData> {
    return { peaks: [], timestamps: [], maxPeak: 0, avgPeak: 0, duration: 0 }
  }

  async detectSpeechOnsets(
    _audioPath: string,
    _options?: { frameSize?: number; hopSize?: number; threshold?: number },
  ): Promise<SpeechOnsetData> {
    return { onsets: [], totalOnsets: 0, avgConfidence: 0 }
  }

  // ============================================================================
  // Whisper Transcription
  // ============================================================================

  async whisperTranscribeOpenAI(
    _audioPath: string,
    _options?: { model?: string; language?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranscriptionResult> {
    return { text: "", language: "en", segments: [], processingTime: 0 }
  }

  async whisperTranslateOpenAI(
    _audioPath: string,
    _targetLanguage?: string,
    _options?: { model?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranslationResult> {
    return {
      originalText: "",
      translatedText: "",
      originalLanguage: "unknown",
      targetLanguage: "en",
      segments: [],
      processingTime: 0,
    }
  }

  async whisperTranscribeLocal(
    _audioPath: string,
    _options?: { model?: string; language?: string; task?: "transcribe" | "translate"; outputFormat?: string },
  ): Promise<TranscriptionResult> {
    return { text: "", language: "en", segments: [], processingTime: 0 }
  }

  async getWhisperLocalModels(): Promise<string[]> {
    return ["tiny", "base", "small", "medium", "large"]
  }

  async downloadWhisperModel(_modelName: string): Promise<void> {}

  async checkWhisperLocalAvailability(): Promise<{
    available: boolean
    models: string[]
    pythonPath?: string
    version?: string
  }> {
    return { available: false, models: [] }
  }

  // ============================================================================
  // Faster Whisper
  // ============================================================================

  async initWhisperPython(): Promise<{ success: boolean; version?: string; availableModels: string[] }> {
    return { success: false, availableModels: [] }
  }

  async transcribeWithFasterWhisper(
    _audioPath: string,
    _options?: {
      modelSize?: string
      language?: string
      task?: "transcribe" | "translate"
      beam_size?: number
      best_of?: number
      temperature?: number
    },
  ): Promise<TranscriptionResult> {
    return { text: "", language: "en", segments: [], processingTime: 0 }
  }

  async getWhisperModels(): Promise<Array<{ name: string; size: string; downloaded: boolean; downloadUrl?: string }>> {
    return [
      { name: "tiny", size: "39MB", downloaded: false },
      { name: "base", size: "74MB", downloaded: false },
      { name: "small", size: "244MB", downloaded: false },
    ]
  }

  async downloadWhisperModelFaster(_modelName: string): Promise<void> {}

  // ============================================================================
  // Audio Preparation
  // ============================================================================

  async extractAudioForWhisper(
    videoPath: string,
    _outputPath?: string,
    _options?: { format?: string; sampleRate?: number; channels?: number; startTime?: number; duration?: number },
  ): Promise<string> {
    return videoPath.replace(/\.[^.]+$/, ".wav")
  }

  async prepareAudioForWhisper(
    audioPath: string,
    _options?: { normalize?: boolean; removeNoise?: boolean; targetSampleRate?: number; targetChannels?: number },
  ): Promise<string> {
    return audioPath
  }

  // ============================================================================
  // Subtitle Generation
  // ============================================================================

  async generateSubtitlesFromTranscription(
    _transcriptionResult: TranscriptionResult,
    options?: { format?: "srt" | "vtt" | "ass"; maxLineLength?: number; maxDuration?: number; wordsPerMinute?: number },
  ): Promise<{ subtitles: SubtitleSegment[]; formattedText: string; format: string }> {
    return { subtitles: [], formattedText: "", format: options?.format || "srt" }
  }

  // ============================================================================
  // Voice Recording
  // ============================================================================

  async saveVoiceRecording(params: SaveAudioParams): Promise<SaveAudioResult> {
    return {
      filePath: `/mock/recordings/${params.fileName}`,
      fileName: params.fileName,
      fileSize: 0,
      format: params.format,
    }
  }

  async getSupportedAudioFormats(): Promise<AudioFormatInfo[]> {
    return [
      { format: "webm", name: "WebM", description: "Web audio format", supported: true },
      { format: "mp3", name: "MP3", description: "MPEG Audio Layer III", supported: true },
      { format: "wav", name: "WAV", description: "Waveform Audio", supported: true },
    ]
  }

  // ============================================================================
  // Audio Correlation
  // ============================================================================

  async correlateAudioFiles(
    _basePath: string,
    _targetPath: string,
    _maxOffsetSeconds?: number,
  ): Promise<AudioCorrelationResult> {
    return { offsetSeconds: 0, confidence: 0, correlationPeak: 0 }
  }

  // ============================================================================
  // AI Director - Core
  // ============================================================================

  async aiDirectorAnalyzeComprehensive(
    _videoPath: string,
    _config?: AIDirectorConfig,
  ): Promise<ComprehensiveAnalysisResult> {
    return {
      analysis_id: `mock-analysis-${Date.now()}`,
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      total_duration_ms: 0,
      errors: [],
    }
  }

  async aiDirectorAnalyzeQuick(_videoPath: string): Promise<ComprehensiveAnalysisResult> {
    return this.aiDirectorAnalyzeComprehensive(_videoPath)
  }

  async aiDirectorAnalyzeBatch(
    filePaths: string[],
    _config?: AIDirectorConfig,
  ): Promise<ComprehensiveAnalysisResult[]> {
    return Promise.all(filePaths.map((path) => this.aiDirectorAnalyzeComprehensive(path)))
  }

  async aiDirectorAnalyzeBatchParallel(
    filePaths: string[],
    config?: AIDirectorConfig & { enable_parallel_processing?: boolean; max_parallel_files?: number },
  ): Promise<ComprehensiveAnalysisResult[]> {
    return this.aiDirectorAnalyzeBatch(filePaths, config)
  }

  // ============================================================================
  // AI Director - Configuration
  // ============================================================================

  async aiDirectorGetCapabilities(): Promise<SystemCapabilities> {
    return {
      audio_analysis: false,
      video_analysis: false,
      object_detection: false,
      face_recognition: false,
      transcription: false,
      gpu_acceleration: false,
      mcp_agents: false,
    }
  }

  async aiDirectorGetDefaultConfig(_mode: "fast" | "balanced" | "quality" | "custom"): Promise<AIDirectorConfig> {
    return {
      performance_mode: "balanced",
      enable_audio_analysis: true,
      enable_scene_detection: true,
      enable_video_analysis: true,
      enable_object_detection: false,
      enable_face_recognition: false,
      enable_transcription: false,
      timeout_seconds: 300,
      max_memory_mb: 4096,
    }
  }

  async aiDirectorValidateConfig(_config: AIDirectorConfig): Promise<ConfigValidationResult> {
    return { valid: true, errors: [], warnings: [] }
  }

  async aiDirectorHealthCheck(): Promise<AIDirectorHealthCheckResult> {
    return {
      overall_status: "healthy",
      services: { audio_engine: "healthy", video_analysis: "healthy", scene_detection: "healthy" },
      last_check: new Date().toISOString(),
    }
  }

  // ============================================================================
  // Unified Audio Analysis
  // ============================================================================

  async unifiedAudioAnalyzeComprehensive(
    _videoPath: string,
    _config?: {
      enable_ffmpeg_analysis?: boolean
      enable_montage_analysis?: boolean
      enable_transcription?: boolean
      performance_mode?: "fast" | "balanced" | "quality"
    },
  ): Promise<unknown> {
    return {}
  }

  async unifiedAudioAnalyzeQuick(_videoPath: string): Promise<unknown> {
    return {}
  }

  async unifiedAudioAnalyzeBatch(
    filePaths: string[],
    _config?: { performance_mode?: "fast" | "balanced" | "quality" },
  ): Promise<unknown[]> {
    return filePaths.map(() => ({}))
  }

  async unifiedAudioGetCapabilities(): Promise<{
    ffmpegAvailable: boolean
    montageAvailable: boolean
    whisperAvailable: boolean
    gpuAvailable: boolean
  }> {
    return { ffmpegAvailable: false, montageAvailable: false, whisperAvailable: false, gpuAvailable: false }
  }

  // ============================================================================
  // Comprehensive Video Analysis
  // ============================================================================

  async analyzeVideoComprehensive(
    _videoPath: string,
    _options?: {
      enable_object_detection?: boolean
      enable_face_detection?: boolean
      enable_emotion_analysis?: boolean
      enable_composition_analysis?: boolean
      enable_audio_analysis?: boolean
      quality_threshold?: number
      max_moments?: number
    },
  ): Promise<unknown> {
    return {}
  }

  // ============================================================================
  // Montage Planner - Analysis
  // ============================================================================

  async analyzeMontagVideos(
    _videoIds: string[],
    _options: AnalysisOptions,
  ): Promise<{ fragments: Fragment[]; momentScores: MomentScore[]; videoAnalysis: unknown; audioAnalysis: unknown }> {
    return { fragments: [], momentScores: [], videoAnalysis: {}, audioAnalysis: {} }
  }

  async analyzeVideoComposition(_videoPath: string, _options?: Partial<AnalysisOptions>): Promise<unknown> {
    return {}
  }

  async detectKeyMoments(_videoPath: string, _analysisResults: unknown): Promise<MomentScore[]> {
    return []
  }

  async getAnalysisProgress(): Promise<AnalysisProgress> {
    return { progress: 0, stage: "idle" }
  }

  // ============================================================================
  // Montage Planner - Plan Generation
  // ============================================================================

  async generateMontagePlan(fragments: Fragment[], _options: PlanGenerationOptions): Promise<MontagePlan> {
    return {
      id: `mock-plan-${Date.now()}`,
      fragments,
      totalDuration: fragments.reduce((sum, f) => sum + (f.endTime - f.startTime), 0),
      createdAt: new Date().toISOString(),
    }
  }

  async optimizeMontagePlan(plan: MontagePlan, _preferences?: unknown): Promise<MontagePlan> {
    return plan
  }

  // ============================================================================
  // Montage Planner - Validation
  // ============================================================================

  async validateMontagePlan(_plan: MontagePlan): Promise<PlanValidation> {
    return { valid: true, errors: [], warnings: [] }
  }

  async calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics> {
    const uniqueSources = new Set(plan.fragments.map((f) => f.videoPath)).size
    return {
      totalClips: plan.fragments.length,
      totalDuration: plan.totalDuration,
      averageClipLength: plan.fragments.length > 0 ? plan.totalDuration / plan.fragments.length : 0,
      uniqueSources,
    }
  }

  // ============================================================================
  // Montage Planner - Application
  // ============================================================================

  async applyMontagePlan(_plan: MontagePlan): Promise<void> {}

  async exportMontagePlan(_plan: MontagePlan, _format: string): Promise<void> {}

  async updateCompositionWeights(_weights: Record<string, number>): Promise<void> {}

  // ============================================================================
  // Additional Video Analysis
  // ============================================================================

  async analyzeVideoQuality(_videoPath: string): Promise<unknown> {
    return {}
  }

  async analyzeFrameQuality(_videoPath: string, _timestamp: number): Promise<unknown> {
    return {}
  }

  async analyzeAudioContent(_audioPath: string): Promise<unknown> {
    return {}
  }
}

/**
 * Node.js AI Adapter
 *
 * Реализация IAIService для Node.js.
 * Использует OpenAI SDK для Whisper и внешние CLI инструменты.
 *
 * Примечание: Полная реализация требует дополнительных зависимостей:
 * - openai (для OpenAI Whisper API)
 * - onnxruntime-node (для локальных моделей)
 */

import { exec } from "node:child_process"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

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

const execAsync = promisify(exec)

export interface NodeAIOptions {
  cacheDir?: string
  openaiApiKey?: string
  whisperPath?: string
}

export class NodeAIService implements IAIService {
  private cacheDir: string
  private openaiApiKey: string | null
  private whisperPath: string
  private apiKeys = new Map<string, string>()
  private persons = new Map<string, PersonData>()

  constructor(options: NodeAIOptions = {}) {
    this.cacheDir = options.cacheDir || path.join(os.tmpdir(), "timeline-studio-ai")
    this.openaiApiKey = options.openaiApiKey || null
    this.whisperPath = options.whisperPath || "whisper"

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  // ============================================================================
  // API Key Management
  // ============================================================================

  async saveApiKey(provider: string, apiKey: string): Promise<void> {
    this.apiKeys.set(provider, apiKey)
    if (provider === "openai") {
      this.openaiApiKey = apiKey
    }
  }

  async getApiKey(provider: string): Promise<string | null> {
    return this.apiKeys.get(provider) || null
  }

  async validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    // Basic validation - check if key format is valid
    if (provider === "openai") {
      return apiKey.startsWith("sk-") && apiKey.length > 20
    }
    return apiKey.length > 0
  }

  async listApiKeys(): Promise<string[]> {
    return Array.from(this.apiKeys.keys())
  }

  async deleteApiKey(provider: string): Promise<void> {
    this.apiKeys.delete(provider)
    if (provider === "openai") {
      this.openaiApiKey = null
    }
  }

  // ============================================================================
  // MCP
  // ============================================================================

  async mcpInitialize(_config: MCPConfig): Promise<boolean> {
    // MCP initialization for Node.js environment
    return true
  }

  async mcpCheckApi(): Promise<boolean> {
    return this.openaiApiKey !== null
  }

  // ============================================================================
  // YOLO Detection (Stub - requires onnxruntime-node)
  // ============================================================================

  async initYOLOProcessor(_modelPath?: string, _useGPU?: boolean): Promise<string> {
    console.warn("NodeAIService: YOLO requires onnxruntime-node")
    return "yolo-processor-stub"
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
    return []
  }

  async updateYOLOConfidenceThreshold(_processorId: string, _threshold: number): Promise<void> {}

  async getAvailableYOLOModels(): Promise<string[]> {
    return ["yolov8n.onnx", "yolov8s.onnx", "yolov8m.onnx"]
  }

  async checkGPUAvailability(): Promise<boolean> {
    return false
  }

  // ============================================================================
  // Face Detection (Stub)
  // ============================================================================

  async initRetinaFaceProcessor(): Promise<string> {
    return "retinaface-processor-stub"
  }

  async detectFacesWithLandmarks(_processorId: string, _imagePath: string): Promise<FaceDetectionResult> {
    return { faces: [], processingTime: 0 }
  }

  async initFaceNetProcessor(): Promise<string> {
    return "facenet-processor-stub"
  }

  async generateFaceEmbedding(
    _processorId: string,
    _imagePath: string,
    _faceBox?: { x: number; y: number; width: number; height: number },
  ): Promise<number[]> {
    return []
  }

  async calculateCosineSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    if (embedding1.length !== embedding2.length || embedding1.length === 0) return 0
    let dot = 0,
      norm1 = 0,
      norm2 = 0
    for (let i = 0; i < embedding1.length; i++) {
      dot += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }
    return dot / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  // ============================================================================
  // MediaPipe (Stub)
  // ============================================================================

  async initMediaPipeProcessor(): Promise<string> {
    return "mediapipe-processor-stub"
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

  async getPersonDatabaseStats(): Promise<{ totalPersons: number; totalEmbeddings: number; totalAppearances: number }> {
    let totalEmbeddings = 0
    let totalAppearances = 0
    for (const person of this.persons.values()) {
      totalEmbeddings += person.embeddings.length
      totalAppearances += person.appearances.length
    }
    return { totalPersons: this.persons.size, totalEmbeddings, totalAppearances }
  }

  // ============================================================================
  // Privacy (Stub)
  // ============================================================================

  async initPrivacyProcessor(): Promise<string> {
    return "privacy-processor-stub"
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
  // Clustering (Stub)
  // ============================================================================

  async initClusteringEngine(): Promise<string> {
    return "clustering-engine-stub"
  }

  async clusterFaces(
    _engineId: string,
    _embeddings: number[][],
    _options?: { eps?: number; minSamples?: number; algorithm?: string },
  ): Promise<number[]> {
    return []
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
  // Video Recognition (Stub)
  // ============================================================================

  async processVideoRecognition(
    videoPath: string,
    _modelPath?: string,
    _targetClasses?: string[],
  ): Promise<VideoRecognitionResult> {
    return {
      videoId: path.basename(videoPath),
      videoName: path.basename(videoPath),
      videoPath,
      frames: [],
      metadata: { model: "stub", version: "1.0.0", processedAt: new Date().toISOString() },
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
    audioPath: string,
    options?: { windowSize?: number; hopSize?: number; threshold?: number },
  ): Promise<AudioPeakData> {
    try {
      const { stdout } = await execAsync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`)
      const duration = Number.parseFloat(stdout.trim())

      return {
        peaks: [],
        timestamps: [],
        maxPeak: 0,
        avgPeak: 0,
        duration,
      }
    } catch {
      return { peaks: [], timestamps: [], maxPeak: 0, avgPeak: 0, duration: 0 }
    }
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
    audioPath: string,
    options?: { model?: string; language?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranscriptionResult> {
    if (!this.openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    // Using curl to call OpenAI API (alternative to SDK)
    try {
      const { stdout } = await execAsync(
        `curl -s https://api.openai.com/v1/audio/transcriptions \
          -H "Authorization: Bearer ${this.openaiApiKey}" \
          -H "Content-Type: multipart/form-data" \
          -F file="@${audioPath}" \
          -F model="${options?.model || "whisper-1"}" \
          ${options?.language ? `-F language="${options.language}"` : ""} \
          -F response_format="verbose_json"`,
      )

      const result = JSON.parse(stdout)
      return {
        text: result.text,
        language: result.language || options?.language || "auto",
        segments: result.segments || [],
        processingTime: result.duration || 0,
      }
    } catch (error) {
      throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async whisperTranslateOpenAI(
    audioPath: string,
    _targetLanguage?: string,
    options?: { model?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranslationResult> {
    if (!this.openaiApiKey) {
      throw new Error("OpenAI API key not configured")
    }

    try {
      const { stdout } = await execAsync(
        `curl -s https://api.openai.com/v1/audio/translations \
          -H "Authorization: Bearer ${this.openaiApiKey}" \
          -H "Content-Type: multipart/form-data" \
          -F file="@${audioPath}" \
          -F model="${options?.model || "whisper-1"}" \
          -F response_format="verbose_json"`,
      )

      const result = JSON.parse(stdout)
      return {
        originalText: "",
        translatedText: result.text,
        originalLanguage: "auto",
        targetLanguage: "en",
        segments: [],
        processingTime: result.duration || 0,
      }
    } catch (error) {
      throw new Error(`Whisper translation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async whisperTranscribeLocal(
    audioPath: string,
    options?: { model?: string; language?: string; task?: "transcribe" | "translate"; outputFormat?: string },
  ): Promise<TranscriptionResult> {
    try {
      const model = options?.model || "base"
      const language = options?.language ? `--language ${options.language}` : ""
      const task = options?.task || "transcribe"

      const outputDir = path.join(this.cacheDir, "whisper")
      if (!fs.existsSync(outputDir)) {
        await fsPromises.mkdir(outputDir, { recursive: true })
      }

      await execAsync(
        `${this.whisperPath} "${audioPath}" --model ${model} ${language} --task ${task} --output_dir "${outputDir}" --output_format json`,
      )

      const baseName = path.basename(audioPath, path.extname(audioPath))
      const jsonPath = path.join(outputDir, `${baseName}.json`)
      const content = await fsPromises.readFile(jsonPath, "utf-8")
      const result = JSON.parse(content)

      return {
        text: result.text,
        language: result.language || options?.language || "auto",
        segments: result.segments || [],
        processingTime: 0,
      }
    } catch (error) {
      throw new Error(`Local Whisper failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getWhisperLocalModels(): Promise<string[]> {
    return ["tiny", "base", "small", "medium", "large"]
  }

  async downloadWhisperModel(_modelName: string): Promise<void> {
    // Models are downloaded automatically by whisper CLI
  }

  async checkWhisperLocalAvailability(): Promise<{
    available: boolean
    models: string[]
    pythonPath?: string
    version?: string
  }> {
    try {
      const { stdout } = await execAsync(`${this.whisperPath} --help`)
      return {
        available: stdout.includes("whisper"),
        models: await this.getWhisperLocalModels(),
      }
    } catch {
      return { available: false, models: [] }
    }
  }

  // ============================================================================
  // Faster Whisper (Stub)
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
    throw new Error("Faster Whisper not available in Node.js adapter")
  }

  async getWhisperModels(): Promise<Array<{ name: string; size: string; downloaded: boolean; downloadUrl?: string }>> {
    return []
  }

  async downloadWhisperModelFaster(_modelName: string): Promise<void> {}

  // ============================================================================
  // Audio Preparation
  // ============================================================================

  async extractAudioForWhisper(
    videoPath: string,
    outputPath?: string,
    options?: { format?: string; sampleRate?: number; channels?: number; startTime?: number; duration?: number },
  ): Promise<string> {
    const output = outputPath || path.join(this.cacheDir, `audio_${Date.now()}.wav`)
    const sampleRate = options?.sampleRate || 16000
    const channels = options?.channels || 1

    let cmd = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar ${sampleRate} -ac ${channels}`
    if (options?.startTime) cmd += ` -ss ${options.startTime}`
    if (options?.duration) cmd += ` -t ${options.duration}`
    cmd += ` "${output}" -y`

    await execAsync(cmd)
    return output
  }

  async prepareAudioForWhisper(
    audioPath: string,
    options?: { normalize?: boolean; removeNoise?: boolean; targetSampleRate?: number; targetChannels?: number },
  ): Promise<string> {
    const output = path.join(this.cacheDir, `prepared_${Date.now()}.wav`)
    const sampleRate = options?.targetSampleRate || 16000
    const channels = options?.targetChannels || 1

    let filters = `aresample=${sampleRate}`
    if (options?.normalize) {
      filters += ",loudnorm"
    }

    await execAsync(`ffmpeg -i "${audioPath}" -af "${filters}" -ac ${channels} "${output}" -y`)
    return output
  }

  // ============================================================================
  // Subtitle Generation
  // ============================================================================

  async generateSubtitlesFromTranscription(
    transcriptionResult: TranscriptionResult,
    options?: { format?: "srt" | "vtt" | "ass"; maxLineLength?: number; maxDuration?: number; wordsPerMinute?: number },
  ): Promise<{ subtitles: SubtitleSegment[]; formattedText: string; format: string }> {
    const format = options?.format || "srt"
    const subtitles: SubtitleSegment[] = transcriptionResult.segments.map((seg, index) => ({
      index: index + 1,
      start: seg.start,
      end: seg.end,
      text: seg.text,
    }))

    let formattedText = ""
    if (format === "srt") {
      formattedText = subtitles
        .map((s) => `${s.index}\n${this.formatSrtTime(s.start)} --> ${this.formatSrtTime(s.end)}\n${s.text}\n`)
        .join("\n")
    } else if (format === "vtt") {
      formattedText =
        "WEBVTT\n\n" +
        subtitles.map((s) => `${this.formatVttTime(s.start)} --> ${this.formatVttTime(s.end)}\n${s.text}\n`).join("\n")
    }

    return { subtitles, formattedText, format }
  }

  private formatSrtTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
  }

  private formatVttTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
  }

  // ============================================================================
  // Voice Recording
  // ============================================================================

  async saveVoiceRecording(params: SaveAudioParams): Promise<SaveAudioResult> {
    const outputDir = path.join(this.cacheDir, "recordings")
    if (!fs.existsSync(outputDir)) {
      await fsPromises.mkdir(outputDir, { recursive: true })
    }

    const filePath = path.join(outputDir, params.fileName)
    const buffer = Buffer.from(params.audioData, "base64")
    await fsPromises.writeFile(filePath, buffer)

    return {
      filePath,
      fileName: params.fileName,
      fileSize: buffer.length,
      format: params.format,
    }
  }

  async getSupportedAudioFormats(): Promise<AudioFormatInfo[]> {
    return [
      { format: "wav", name: "WAV", description: "Lossless audio", supported: true },
      { format: "mp3", name: "MP3", description: "Compressed audio", supported: true },
      { format: "webm", name: "WebM", description: "Web audio format", supported: true },
      { format: "ogg", name: "OGG", description: "Open format", supported: true },
      { format: "m4a", name: "M4A", description: "AAC audio", supported: true },
    ]
  }

  // ============================================================================
  // Audio Correlation
  // ============================================================================

  async correlateAudioFiles(
    basePath: string,
    targetPath: string,
    maxOffsetSeconds?: number,
  ): Promise<AudioCorrelationResult> {
    // Simplified correlation using ffmpeg
    // In production, would use proper cross-correlation algorithm
    return {
      offsetSeconds: 0,
      confidence: 0.5,
      correlationPeak: 0.5,
    }
  }

  // ============================================================================
  // AI Director
  // ============================================================================

  async aiDirectorAnalyzeComprehensive(
    videoPath: string,
    config?: AIDirectorConfig,
  ): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now()

    // Basic analysis using ffprobe
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`)
    const probe = JSON.parse(stdout)
    const videoStream = probe.streams?.find((s: { codec_type: string }) => s.codec_type === "video")
    const audioStream = probe.streams?.find((s: { codec_type: string }) => s.codec_type === "audio")

    return {
      analysis_id: `analysis-${Date.now()}`,
      status: "completed",
      video_analysis: videoStream
        ? {
            width: videoStream.width,
            height: videoStream.height,
            fps: Number.parseFloat(videoStream.r_frame_rate?.split("/")[0] || "0"),
            duration: Number.parseFloat(probe.format?.duration || "0"),
            bitrate: Number.parseInt(probe.format?.bit_rate || "0", 10),
            codec: videoStream.codec_name,
          }
        : undefined,
      audio_analysis: audioStream
        ? {
            duration: Number.parseFloat(probe.format?.duration || "0"),
            loudness: 0,
            tempo: 0,
            silence_percentage: 0,
          }
        : undefined,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      total_duration_ms: Date.now() - startTime,
      errors: [],
    }
  }

  async aiDirectorAnalyzeQuick(videoPath: string): Promise<ComprehensiveAnalysisResult> {
    return this.aiDirectorAnalyzeComprehensive(videoPath, { performance_mode: "fast" } as AIDirectorConfig)
  }

  async aiDirectorAnalyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]> {
    const results: ComprehensiveAnalysisResult[] = []
    for (const filePath of filePaths) {
      results.push(await this.aiDirectorAnalyzeComprehensive(filePath, config))
    }
    return results
  }

  async aiDirectorAnalyzeBatchParallel(
    filePaths: string[],
    config?: AIDirectorConfig & { enable_parallel_processing?: boolean; max_parallel_files?: number },
  ): Promise<ComprehensiveAnalysisResult[]> {
    const maxParallel = config?.max_parallel_files || 4
    const results: ComprehensiveAnalysisResult[] = []

    for (let i = 0; i < filePaths.length; i += maxParallel) {
      const batch = filePaths.slice(i, i + maxParallel)
      const batchResults = await Promise.all(batch.map((fp) => this.aiDirectorAnalyzeComprehensive(fp, config)))
      results.push(...batchResults)
    }

    return results
  }

  async aiDirectorGetCapabilities(): Promise<SystemCapabilities> {
    return {
      audio_analysis: true,
      video_analysis: true,
      object_detection: false,
      face_recognition: false,
      transcription: true,
      gpu_acceleration: false,
      mcp_agents: false,
    }
  }

  async aiDirectorGetDefaultConfig(mode: "fast" | "balanced" | "quality" | "custom"): Promise<AIDirectorConfig> {
    return {
      performance_mode: mode === "custom" ? "balanced" : mode,
      enable_audio_analysis: true,
      enable_scene_detection: mode !== "fast",
      enable_video_analysis: true,
      enable_object_detection: mode === "quality",
      enable_face_recognition: mode === "quality",
      enable_transcription: mode !== "fast",
      timeout_seconds: mode === "fast" ? 30 : mode === "balanced" ? 60 : 120,
      max_memory_mb: 1024,
    }
  }

  async aiDirectorValidateConfig(config: AIDirectorConfig): Promise<ConfigValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    if (config.timeout_seconds < 10) {
      errors.push("Timeout too short")
    }
    if (config.max_memory_mb < 256) {
      warnings.push("Low memory limit may cause issues")
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  async aiDirectorHealthCheck(): Promise<AIDirectorHealthCheckResult> {
    return {
      overall_status: "healthy",
      services: {
        audio_engine: "healthy",
        video_analysis: "healthy",
        scene_detection: "healthy",
      },
      last_check: new Date().toISOString(),
    }
  }

  // ============================================================================
  // Unified Audio Analysis
  // ============================================================================

  async unifiedAudioAnalyzeComprehensive(
    videoPath: string,
    _config?: {
      enable_ffmpeg_analysis?: boolean
      enable_montage_analysis?: boolean
      enable_transcription?: boolean
      performance_mode?: "fast" | "balanced" | "quality"
    },
  ): Promise<unknown> {
    return this.aiDirectorAnalyzeComprehensive(videoPath)
  }

  async unifiedAudioAnalyzeQuick(videoPath: string): Promise<unknown> {
    return this.aiDirectorAnalyzeQuick(videoPath)
  }

  async unifiedAudioAnalyzeBatch(
    filePaths: string[],
    _config?: { performance_mode?: "fast" | "balanced" | "quality" },
  ): Promise<unknown[]> {
    return this.aiDirectorAnalyzeBatch(filePaths)
  }

  async unifiedAudioGetCapabilities(): Promise<{
    ffmpegAvailable: boolean
    montageAvailable: boolean
    whisperAvailable: boolean
    gpuAvailable: boolean
  }> {
    const whisperCheck = await this.checkWhisperLocalAvailability()
    return {
      ffmpegAvailable: true,
      montageAvailable: true,
      whisperAvailable: whisperCheck.available,
      gpuAvailable: false,
    }
  }

  // ============================================================================
  // Comprehensive Video Analysis
  // ============================================================================

  async analyzeVideoComprehensive(
    videoPath: string,
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
    return this.aiDirectorAnalyzeComprehensive(videoPath)
  }

  // ============================================================================
  // Montage Planner
  // ============================================================================

  async analyzeMontagVideos(
    _videoIds: string[],
    _options: AnalysisOptions,
  ): Promise<{ fragments: Fragment[]; momentScores: MomentScore[]; videoAnalysis: unknown; audioAnalysis: unknown }> {
    return { fragments: [], momentScores: [], videoAnalysis: null, audioAnalysis: null }
  }

  async analyzeVideoComposition(_videoPath: string, _options?: Partial<AnalysisOptions>): Promise<unknown> {
    return {}
  }

  async detectKeyMoments(_videoPath: string, _analysisResults: unknown): Promise<MomentScore[]> {
    return []
  }

  async getAnalysisProgress(): Promise<AnalysisProgress> {
    return { progress: 100, stage: "complete" }
  }

  async generateMontagePlan(fragments: Fragment[], _options: PlanGenerationOptions): Promise<MontagePlan> {
    return {
      id: `plan-${Date.now()}`,
      fragments,
      totalDuration: fragments.reduce((sum, f) => sum + (f.endTime - f.startTime), 0),
      createdAt: new Date().toISOString(),
    }
  }

  async optimizeMontagePlan(plan: MontagePlan, _preferences?: unknown): Promise<MontagePlan> {
    return plan
  }

  async validateMontagePlan(plan: MontagePlan): Promise<PlanValidation> {
    return {
      valid: plan.fragments.length > 0,
      errors: plan.fragments.length === 0 ? ["No fragments"] : [],
      warnings: [],
    }
  }

  async calculatePlanStatistics(plan: MontagePlan): Promise<PlanStatistics> {
    const uniqueSources = new Set(plan.fragments.map((f) => f.videoPath)).size
    return {
      totalClips: plan.fragments.length,
      totalDuration: plan.totalDuration,
      averageClipLength: plan.totalDuration / Math.max(plan.fragments.length, 1),
      uniqueSources,
    }
  }

  async applyMontagePlan(_plan: MontagePlan): Promise<void> {}

  async exportMontagePlan(plan: MontagePlan, format: string): Promise<void> {
    const outputPath = path.join(this.cacheDir, `plan.${format}`)
    await fsPromises.writeFile(outputPath, JSON.stringify(plan, null, 2))
  }

  async updateCompositionWeights(_weights: Record<string, number>): Promise<void> {}

  // ============================================================================
  // Additional Video Analysis
  // ============================================================================

  async analyzeVideoQuality(videoPath: string): Promise<unknown> {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_streams "${videoPath}"`)
    return JSON.parse(stdout)
  }

  async analyzeFrameQuality(_videoPath: string, _timestamp: number): Promise<unknown> {
    return { quality: 0.8 }
  }

  async analyzeAudioContent(audioPath: string): Promise<unknown> {
    return this.analyzeAudioPeaks(audioPath)
  }
}

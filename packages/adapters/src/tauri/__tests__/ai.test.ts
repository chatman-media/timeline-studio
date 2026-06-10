import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriAIService } from "../ai"

const mockInvoke = vi.fn()

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debugSync: vi.fn(),
    infoSync: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

describe("TauriAIService", () => {
  let aiService: TauriAIService

  beforeEach(() => {
    vi.clearAllMocks()
    aiService = new TauriAIService()
  })

  // ============================================================================
  // API Key Management (5 methods)
  // ============================================================================

  describe("API Key Management", () => {
    it("saves API key", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.saveApiKey("openai", "sk-test")
      expect(mockInvoke).toHaveBeenCalledWith("save_simple_api_key", { provider: "openai", apiKey: "sk-test" })
    })

    it("gets API key", async () => {
      mockInvoke.mockResolvedValueOnce("sk-test")
      const result = await aiService.getApiKey("openai")
      expect(result).toBe("sk-test")
    })

    it("validates API key", async () => {
      mockInvoke.mockResolvedValueOnce(true)
      const result = await aiService.validateApiKey("openai", "sk-valid")
      expect(result).toBe(true)
    })

    it("lists API keys", async () => {
      mockInvoke.mockResolvedValueOnce(["openai"])
      const result = await aiService.listApiKeys()
      expect(result).toEqual(["openai"])
    })

    it("deletes API key", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.deleteApiKey("openai")
      expect(mockInvoke).toHaveBeenCalledWith("delete_api_key", { provider: "openai" })
    })
  })

  // ============================================================================
  // MCP, YOLO, Face Detection, Audio (39 methods total - simplified tests)
  // ============================================================================

  describe("MCP", () => {
    it("initializes and checks MCP", async () => {
      mockInvoke.mockResolvedValueOnce(true)
      await aiService.mcpInitialize({ model: "gpt-4" } as any)
      expect(mockInvoke).toHaveBeenCalledWith("mcp_initialize", { config: { model: "gpt-4" } })
    })
  })

  describe("YOLO Detection", () => {
    it("initializes YOLO processor with defaults", async () => {
      mockInvoke.mockResolvedValueOnce("proc123")
      const result = await aiService.initYOLOProcessor()
      expect(mockInvoke).toHaveBeenCalledWith("init_yolo_processor", { modelPath: undefined, useGPU: true })
      expect(result).toBe("proc123")
    })

    it("detects objects with default confidence", async () => {
      mockInvoke.mockResolvedValueOnce({ detections: [] })
      await aiService.detectObjectsInImage("proc123", "/img.jpg")
      expect(mockInvoke).toHaveBeenCalledWith("detect_objects_in_image", {
        processorId: "proc123",
        imagePath: "/img.jpg",
        confidenceThreshold: 0.5,
      })
    })
  })

  describe("Face Detection", () => {
    it("initializes processors", async () => {
      mockInvoke.mockResolvedValueOnce("retinaface123")
      const result = await aiService.initRetinaFaceProcessor()
      expect(result).toBe("retinaface123")
    })

    it("generates face embedding", async () => {
      mockInvoke.mockResolvedValueOnce([0.1, 0.2])
      await aiService.generateFaceEmbedding("proc123", "/face.jpg")
      expect(mockInvoke).toHaveBeenCalledWith("generate_face_embedding", expect.any(Object))
    })
  })

  describe("Audio Analysis", () => {
    it("analyzes audio peaks", async () => {
      mockInvoke.mockResolvedValueOnce({ peaks: [] })
      await aiService.analyzeAudioPeaks("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("analyze_audio_peaks", { audioPath: "/audio.mp3", options: {} })
    })

    it("detects speech onsets", async () => {
      mockInvoke.mockResolvedValueOnce({ onsets: [] })
      await aiService.detectSpeechOnsets("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("detect_speech_onsets", expect.any(Object))
    })
  })

  // ============================================================================
  // Whisper & Faster Whisper (10 methods)
  // ============================================================================

  describe("Whisper Transcription", () => {
    it("transcribes with OpenAI Whisper", async () => {
      mockInvoke.mockResolvedValueOnce({ text: "Hello", segments: [], language: "en" })
      await aiService.whisperTranscribeOpenAI("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("whisper_transcribe_openai", { audioPath: "/audio.mp3", options: {} })
    })

    it("translates with default target language", async () => {
      mockInvoke.mockResolvedValueOnce({ text: "Hello" })
      await aiService.whisperTranslateOpenAI("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("whisper_translate_openai", {
        audioPath: "/audio.mp3",
        targetLanguage: "en",
        options: {},
      })
    })

    it("gets local models", async () => {
      mockInvoke.mockResolvedValueOnce(["tiny", "base"])
      const result = await aiService.getWhisperLocalModels()
      expect(result).toEqual(["tiny", "base"])
    })
  })

  describe("Faster Whisper", () => {
    it("initializes Faster Whisper", async () => {
      mockInvoke.mockResolvedValueOnce({ success: true, availableModels: [] })
      const result = await aiService.initWhisperPython()
      expect(result.success).toBe(true)
    })

    it("transcribes with Faster Whisper", async () => {
      mockInvoke.mockResolvedValueOnce({ text: "", segments: [], language: "en" })
      await aiService.transcribeWithFasterWhisper("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("transcribe_with_faster_whisper", {
        audioPath: "/audio.mp3",
        options: {},
      })
    })
  })

  // ============================================================================
  // AI Director & Montage Planner (19 methods)
  // ============================================================================

  describe("AI Director - Core", () => {
    it("runs comprehensive analysis", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.aiDirectorAnalyzeComprehensive("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_comprehensive", {
        videoPath: "/video.mp4",
        config: undefined,
      })
    })

    it("runs quick analysis", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.aiDirectorAnalyzeQuick("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_quick", { videoPath: "/video.mp4" })
    })

    it("analyzes batch in parallel with default max parallel", async () => {
      mockInvoke.mockResolvedValueOnce([])
      await aiService.aiDirectorAnalyzeBatchParallel(["/video.mp4"])
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_v2_analyze_batch_parallel", {
        filePaths: ["/video.mp4"],
        config: { enable_parallel_processing: true, max_parallel_files: 4 },
      })
    })
  })

  describe("AI Director - Configuration", () => {
    it("gets capabilities", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.aiDirectorGetCapabilities()
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_capabilities")
    })

    it("gets default config for mode", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.aiDirectorGetDefaultConfig("Fast")
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_get_default_config", { mode: "fast" })
    })

    it("validates config", async () => {
      mockInvoke.mockResolvedValueOnce({ valid: true, errors: [] })
      await aiService.aiDirectorValidateConfig({} as any)
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_validate_config", { config: {} })
    })

    it("performs health check", async () => {
      mockInvoke.mockResolvedValueOnce({ healthy: true })
      await aiService.aiDirectorHealthCheck()
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_health_check")
    })
  })

  describe("Unified Audio Analysis", () => {
    it("analyzes comprehensively with default config", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.unifiedAudioAnalyzeComprehensive("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_analyze_comprehensive", {
        videoPath: "/video.mp4",
        config: {
          enable_ffmpeg_analysis: true,
          enable_montage_analysis: true,
          enable_transcription: false,
          performance_mode: "Balanced",
        },
      })
    })

    it("gets capabilities", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.unifiedAudioGetCapabilities()
      expect(mockInvoke).toHaveBeenCalledWith("unified_audio_get_capabilities")
    })
  })

  describe("Montage Planner", () => {
    it("analyzes montage videos", async () => {
      mockInvoke.mockResolvedValueOnce({ fragments: [], momentScores: [], videoAnalysis: {}, audioAnalysis: {} })
      await aiService.analyzeMontagVideos([], {} as any)
      expect(mockInvoke).toHaveBeenCalledWith("analyze_montage_videos", { videoIds: [], options: {} })
    })

    it("generates montage plan", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.generateMontagePlan([], {} as any)
      expect(mockInvoke).toHaveBeenCalledWith("generate_montage_plan", { fragments: [], options: {} })
    })

    it("optimizes plan with defaults", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.optimizeMontagePlan({} as any)
      expect(mockInvoke).toHaveBeenCalledWith("optimize_montage_plan", { plan: {}, preferences: {} })
    })

    it("validates plan", async () => {
      mockInvoke.mockResolvedValueOnce({ valid: true, errors: [] })
      await aiService.validateMontagePlan({} as any)
      expect(mockInvoke).toHaveBeenCalledWith("validate_montage_plan", { plan: {} })
    })

    it("applies plan", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.applyMontagePlan({} as any)
      expect(mockInvoke).toHaveBeenCalledWith("apply_montage_plan", { plan: {} })
    })

    it("exports plan", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.exportMontagePlan({} as any, "json")
      expect(mockInvoke).toHaveBeenCalledWith("export_montage_plan", { plan: {}, format: "json" })
    })
  })

  // ============================================================================
  // Additional Methods (16 methods)
  // ============================================================================

  describe("Additional Methods", () => {
    it("extracts audio for Whisper", async () => {
      mockInvoke.mockResolvedValueOnce("/output.wav")
      await aiService.extractAudioForWhisper("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("extract_audio_for_whisper", {
        videoPath: "/video.mp4",
        outputPath: undefined,
        options: {},
      })
    })

    it("prepares audio for Whisper", async () => {
      mockInvoke.mockResolvedValueOnce("/prepared.wav")
      await aiService.prepareAudioForWhisper("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("prepare_audio_for_whisper", { audioPath: "/audio.mp3", options: {} })
    })

    it("generates subtitles from transcription", async () => {
      mockInvoke.mockResolvedValueOnce({ subtitles: [], formattedText: "", format: "srt" })
      await aiService.generateSubtitlesFromTranscription({} as any)
      expect(mockInvoke).toHaveBeenCalledWith("generate_subtitles_from_transcription", {
        transcriptionResult: {},
        options: {},
      })
    })

    it("saves voice recording", async () => {
      mockInvoke.mockResolvedValueOnce({ success: true, filePath: "/recording.wav" })
      await aiService.saveVoiceRecording({} as any)
      expect(mockInvoke).toHaveBeenCalledWith("save_voice_recording", { params: {} })
    })

    it("gets supported audio formats", async () => {
      mockInvoke.mockResolvedValueOnce([])
      await aiService.getSupportedAudioFormats()
      expect(mockInvoke).toHaveBeenCalledWith("get_supported_audio_formats")
    })

    it("correlates audio files with default max offset", async () => {
      mockInvoke.mockResolvedValueOnce({ correlation: 0.95, offset: 0, confidence: 0.9 })
      await aiService.correlateAudioFiles("/base.wav", "/target.wav")
      expect(mockInvoke).toHaveBeenCalledWith("correlate_audio_files", {
        basePath: "/base.wav",
        targetPath: "/target.wav",
        maxOffsetSeconds: 30,
      })
    })

    it("analyzes video comprehensively with defaults", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.analyzeVideoComprehensive("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_comprehensive", {
        videoPath: "/video.mp4",
        options: expect.objectContaining({
          enable_object_detection: true,
          enable_face_detection: true,
          quality_threshold: 50.0,
        }),
      })
    })

    it("analyzes video quality", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.analyzeVideoQuality("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("analyze_video_quality", { videoPath: "/video.mp4" })
    })

    it("analyzes frame quality at timestamp", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.analyzeFrameQuality("/video.mp4", 5.5)
      expect(mockInvoke).toHaveBeenCalledWith("analyze_frame_quality", { videoPath: "/video.mp4", timestamp: 5.5 })
    })

    it("analyzes audio content", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.analyzeAudioContent("/audio.mp3")
      expect(mockInvoke).toHaveBeenCalledWith("analyze_audio_content", { audioPath: "/audio.mp3" })
    })
  })

  // ============================================================================
  // Privacy (3 methods)
  // ============================================================================

  describe("Privacy", () => {
    it("initializes privacy processor", async () => {
      mockInvoke.mockResolvedValueOnce("privacy-123")
      const result = await aiService.initPrivacyProcessor()
      expect(mockInvoke).toHaveBeenCalledWith("init_privacy_processor")
      expect(result).toBe("privacy-123")
    })

    it("blurs faces in image with default intensity", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.blurFacesInImage("proc-123", "/input.jpg", "/output.jpg")
      expect(mockInvoke).toHaveBeenCalledWith("blur_faces_in_image", {
        processorId: "proc-123",
        imagePath: "/input.jpg",
        outputPath: "/output.jpg",
        blurIntensity: 15,
      })
    })

    it("blurs faces in image with custom intensity", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.blurFacesInImage("proc-123", "/input.jpg", "/output.jpg", 25)
      expect(mockInvoke).toHaveBeenCalledWith("blur_faces_in_image", expect.objectContaining({ blurIntensity: 25 }))
    })

    it("blurs faces in video frames with default options", async () => {
      mockInvoke.mockResolvedValueOnce(["/frame1.jpg", "/frame2.jpg"])
      const result = await aiService.blurFacesInVideoFrames("proc-123", "/video.mp4", "/output")
      expect(mockInvoke).toHaveBeenCalledWith("blur_faces_in_video_frames", {
        processorId: "proc-123",
        videoPath: "/video.mp4",
        outputDir: "/output",
        options: {},
      })
      expect(result).toEqual(["/frame1.jpg", "/frame2.jpg"])
    })

    it("blurs faces in video frames with custom options", async () => {
      mockInvoke.mockResolvedValueOnce([])
      await aiService.blurFacesInVideoFrames("proc-123", "/video.mp4", "/output", {
        frameInterval: 5,
        blurIntensity: 20,
      })
      expect(mockInvoke).toHaveBeenCalledWith("blur_faces_in_video_frames", {
        processorId: "proc-123",
        videoPath: "/video.mp4",
        outputDir: "/output",
        options: { frameInterval: 5, blurIntensity: 20 },
      })
    })
  })

  // ============================================================================
  // Clustering (3 methods)
  // ============================================================================

  describe("Clustering", () => {
    it("initializes clustering engine", async () => {
      mockInvoke.mockResolvedValueOnce("cluster-engine-123")
      const result = await aiService.initClusteringEngine()
      expect(mockInvoke).toHaveBeenCalledWith("init_clustering_engine")
      expect(result).toBe("cluster-engine-123")
    })

    it("clusters faces with default options", async () => {
      const embeddings = [
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6],
      ]
      mockInvoke.mockResolvedValueOnce([0, 0, 1])
      const result = await aiService.clusterFaces("engine-123", embeddings)
      expect(mockInvoke).toHaveBeenCalledWith("cluster_faces", {
        engineId: "engine-123",
        embeddings,
        options: {},
      })
      expect(result).toEqual([0, 0, 1])
    })

    it("clusters faces with custom options", async () => {
      const embeddings = [[0.1, 0.2]]
      mockInvoke.mockResolvedValueOnce([0])
      await aiService.clusterFaces("engine-123", embeddings, { eps: 0.5, minSamples: 3 })
      expect(mockInvoke).toHaveBeenCalledWith("cluster_faces", {
        engineId: "engine-123",
        embeddings,
        options: { eps: 0.5, minSamples: 3 },
      })
    })

    it("auto-clusters video faces with default options", async () => {
      const clusterResult = {
        clusters: [{ clusterId: 0, faces: [] }],
        totalFaces: 10,
        processingTime: 1500,
      }
      mockInvoke.mockResolvedValueOnce(clusterResult)
      const result = await aiService.autoClusterVideoFaces("engine-123", "/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("auto_cluster_video_faces", {
        engineId: "engine-123",
        videoPath: "/video.mp4",
        options: {},
      })
      expect(result).toEqual(clusterResult)
    })

    it("auto-clusters video faces with custom options", async () => {
      mockInvoke.mockResolvedValueOnce({ clusters: [], totalFaces: 0, processingTime: 0 })
      await aiService.autoClusterVideoFaces("engine-123", "/video.mp4", {
        frameInterval: 10,
        confidenceThreshold: 0.8,
        clusteringParams: { eps: 0.6 },
      })
      expect(mockInvoke).toHaveBeenCalledWith("auto_cluster_video_faces", {
        engineId: "engine-123",
        videoPath: "/video.mp4",
        options: { frameInterval: 10, confidenceThreshold: 0.8, clusteringParams: { eps: 0.6 } },
      })
    })
  })

  // ============================================================================
  // MediaPipe (4 methods)
  // ============================================================================

  describe("MediaPipe", () => {
    it("initializes MediaPipe processor", async () => {
      mockInvoke.mockResolvedValueOnce("mediapipe-123")
      const result = await aiService.initMediaPipeProcessor()
      expect(mockInvoke).toHaveBeenCalledWith("init_mediapipe_processor")
      expect(result).toBe("mediapipe-123")
    })

    it("detects faces with BlazeFace", async () => {
      const faceResult = { faces: [{ bbox: { x: 10, y: 20, width: 100, height: 120 } }], count: 1 }
      mockInvoke.mockResolvedValueOnce(faceResult)
      const result = await aiService.detectFacesBlazeFace("proc-123", "/image.jpg")
      expect(mockInvoke).toHaveBeenCalledWith("detect_faces_blazeface", {
        processorId: "proc-123",
        imagePath: "/image.jpg",
      })
      expect(result).toEqual(faceResult)
    })

    it("extracts face mesh landmarks", async () => {
      const landmarks = [
        { x: 0.1, y: 0.2, z: 0.3 },
        { x: 0.4, y: 0.5, z: 0.6 },
      ]
      mockInvoke.mockResolvedValueOnce(landmarks)
      const result = await aiService.extractFaceMeshLandmarks("proc-123", "/face.jpg")
      expect(mockInvoke).toHaveBeenCalledWith("extract_face_mesh_landmarks", {
        processorId: "proc-123",
        imagePath: "/face.jpg",
      })
      expect(result).toEqual(landmarks)
    })

    it("analyzes facial expressions", async () => {
      const expressionResult = { expressions: { happy: 0.8, neutral: 0.2 }, confidence: 0.9 }
      mockInvoke.mockResolvedValueOnce(expressionResult)
      const result = await aiService.analyzeFacialExpressions("proc-123", "/face.jpg")
      expect(mockInvoke).toHaveBeenCalledWith("analyze_facial_expressions", {
        processorId: "proc-123",
        imagePath: "/face.jpg",
      })
      expect(result).toEqual(expressionResult)
    })
  })

  // ============================================================================
  // Additional YOLO Methods (4 methods)
  // ============================================================================

  describe("Additional YOLO Methods", () => {
    it("gets YOLO class names", async () => {
      mockInvoke.mockResolvedValueOnce(["person", "car", "dog"])
      const result = await aiService.getYOLOClassNames("proc-123")
      expect(mockInvoke).toHaveBeenCalledWith("get_yolo_class_names_advanced", { processorId: "proc-123" })
      expect(result).toEqual(["person", "car", "dog"])
    })

    it("updates YOLO confidence threshold", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.updateYOLOConfidenceThreshold("proc-123", 0.7)
      expect(mockInvoke).toHaveBeenCalledWith("update_yolo_confidence_threshold", {
        processorId: "proc-123",
        threshold: 0.7,
      })
    })

    it("gets available YOLO models", async () => {
      mockInvoke.mockResolvedValueOnce(["yolov8n", "yolov8s", "yolov8m"])
      const result = await aiService.getAvailableYOLOModels()
      expect(mockInvoke).toHaveBeenCalledWith("get_available_yolo_models")
      expect(result).toEqual(["yolov8n", "yolov8s", "yolov8m"])
    })

    it("checks GPU availability", async () => {
      mockInvoke.mockResolvedValueOnce(true)
      const result = await aiService.checkGPUAvailability()
      expect(mockInvoke).toHaveBeenCalledWith("check_gpu_availability")
      expect(result).toBe(true)
    })
  })

  // ============================================================================
  // Additional Person Database Methods
  // ============================================================================

  describe("Additional Person Database Methods", () => {
    it("gets person by ID", async () => {
      const person = { id: "person-123", name: "John Doe", embeddings: [] }
      mockInvoke.mockResolvedValueOnce(person)
      const result = await aiService.getPerson("person-123")
      expect(mockInvoke).toHaveBeenCalledWith("get_person", { personId: "person-123" })
      expect(result).toEqual(person)
    })

    it("returns null when person not found", async () => {
      mockInvoke.mockResolvedValueOnce(null)
      const result = await aiService.getPerson("missing-person")
      expect(result).toBeNull()
    })

    it("searches similar persons with defaults", async () => {
      const embedding = [0.1, 0.2, 0.3]
      const results = [{ personId: "p1", similarity: 0.9, name: "John" }]
      mockInvoke.mockResolvedValueOnce(results)
      const result = await aiService.searchSimilarPersons(embedding)
      expect(mockInvoke).toHaveBeenCalledWith("search_similar_persons", {
        embedding,
        threshold: 0.7,
        maxResults: 5,
      })
      expect(result).toEqual(results)
    })

    it("searches similar persons with custom params", async () => {
      const embedding = [0.1, 0.2]
      mockInvoke.mockResolvedValueOnce([])
      await aiService.searchSimilarPersons(embedding, 0.85, 10)
      expect(mockInvoke).toHaveBeenCalledWith("search_similar_persons", {
        embedding,
        threshold: 0.85,
        maxResults: 10,
      })
    })

    it("adds person appearance", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.addPersonAppearance(
        "person-123",
        "/video.mp4",
        5.5,
        { x: 10, y: 20, width: 50, height: 60 },
        0.95,
      )
      expect(mockInvoke).toHaveBeenCalledWith("add_person_appearance", {
        personId: "person-123",
        videoPath: "/video.mp4",
        timestamp: 5.5,
        bbox: { x: 10, y: 20, width: 50, height: 60 },
        confidence: 0.95,
      })
    })

    it("gets person database stats", async () => {
      const stats = { totalPersons: 10, totalEmbeddings: 50, totalAppearances: 200 }
      mockInvoke.mockResolvedValueOnce(stats)
      const result = await aiService.getPersonDatabaseStats()
      expect(mockInvoke).toHaveBeenCalledWith("get_person_database_stats")
      expect(result).toEqual(stats)
    })
  })

  // ============================================================================
  // Video Recognition Methods
  // ============================================================================

  describe("Video Recognition", () => {
    it("processes video recognition", async () => {
      const recognitionResult = { objects: [], scenes: [], totalFrames: 100 }
      mockInvoke.mockResolvedValueOnce(recognitionResult)
      const result = await aiService.processVideoRecognition("/video.mp4")
      expect(mockInvoke).toHaveBeenCalledWith("process_video_recognition", {
        videoPath: "/video.mp4",
        modelPath: undefined,
        targetClasses: undefined,
      })
      expect(result).toEqual(recognitionResult)
    })

    it("processes video recognition with options", async () => {
      mockInvoke.mockResolvedValueOnce({})
      await aiService.processVideoRecognition("/video.mp4", "/model.onnx", ["person", "car"])
      expect(mockInvoke).toHaveBeenCalledWith("process_video_recognition", {
        videoPath: "/video.mp4",
        modelPath: "/model.onnx",
        targetClasses: ["person", "car"],
      })
    })

    it("gets preview data with recognition", async () => {
      const previewData = { preview_with_boxes: "data:image/jpeg;base64,..." }
      mockInvoke.mockResolvedValueOnce(previewData)
      const result = await aiService.getPreviewDataWithRecognition("file-123")
      expect(mockInvoke).toHaveBeenCalledWith("get_preview_data_with_recognition", { fileId: "file-123" })
      expect(result).toEqual(previewData)
    })

    it("clears recognition results", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)
      await aiService.clearRecognitionResults("file-123")
      expect(mockInvoke).toHaveBeenCalledWith("clear_recognition_results", { fileId: "file-123" })
    })
  })
})

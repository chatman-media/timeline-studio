import { describe, expect, it } from "vitest"
import { NodeAIService } from "../ai"

describe("NodeAIService", () => {
  const service = new NodeAIService()

  // ============================================================================
  // API Keys
  // ============================================================================

  describe("API Keys", () => {
    it("saves and gets API key", async () => {
      await service.saveApiKey("test-provider", "test-key")
      const key = await service.getApiKey("test-provider")
      expect(key).toBe("test-key")
    })

    it("returns null for non-existent provider", async () => {
      const key = await service.getApiKey("non-existent")
      expect(key).toBeNull()
    })
  })

  // ============================================================================
  // YOLO
  // ============================================================================

  describe("YOLO", () => {
    it("returns processor ID for initYOLOProcessor", async () => {
      const id = await service.initYOLOProcessor()
      expect(typeof id).toBe("string")
    })

    it("returns detections for detectObjectsInImage", async () => {
      const id = await service.initYOLOProcessor()
      const result = await service.detectObjectsInImage(id, "/image.jpg")
      expect(result).toHaveProperty("objects")
      expect(result).toHaveProperty("processingTime")
      expect(Array.isArray(result.objects)).toBe(true)
    })

    it("returns array for analyzeVideoWithYOLO", async () => {
      const id = await service.initYOLOProcessor()
      const result = await service.analyzeVideoWithYOLO(id, "/video.mp4")
      expect(Array.isArray(result)).toBe(true)
    })

    it("returns array for getYOLOClassNames", async () => {
      const id = await service.initYOLOProcessor()
      const names = await service.getYOLOClassNames(id)
      expect(Array.isArray(names)).toBe(true)
    })

    it("returns array for getAvailableYOLOModels", async () => {
      const models = await service.getAvailableYOLOModels()
      expect(Array.isArray(models)).toBe(true)
    })
  })

  // ============================================================================
  // Face Detection
  // ============================================================================

  describe("Face Detection", () => {
    it("returns processor ID for initRetinaFaceProcessor", async () => {
      const id = await service.initRetinaFaceProcessor()
      expect(typeof id).toBe("string")
    })

    it("returns face detections for detectFacesWithLandmarks", async () => {
      const id = await service.initRetinaFaceProcessor()
      const result = await service.detectFacesWithLandmarks(id, "/image.jpg")
      expect(result).toHaveProperty("faces")
      expect(Array.isArray(result.faces)).toBe(true)
    })

    it("returns processor ID for initFaceNetProcessor", async () => {
      const id = await service.initFaceNetProcessor()
      expect(typeof id).toBe("string")
    })

    it("returns embedding for generateFaceEmbedding", async () => {
      const id = await service.initFaceNetProcessor()
      const embedding = await service.generateFaceEmbedding(id, "/image.jpg")
      expect(Array.isArray(embedding)).toBe(true)
    })
  })

  // ============================================================================
  // MediaPipe
  // ============================================================================

  describe("MediaPipe", () => {
    it("returns processor ID for initMediaPipeProcessor", async () => {
      const id = await service.initMediaPipeProcessor()
      expect(typeof id).toBe("string")
    })

    it("returns face detections for detectFacesBlazeFace", async () => {
      const id = await service.initMediaPipeProcessor()
      const result = await service.detectFacesBlazeFace(id, "/image.jpg")
      expect(result).toHaveProperty("faces")
    })

    it("returns landmarks for extractFaceMeshLandmarks", async () => {
      const id = await service.initMediaPipeProcessor()
      const result = await service.extractFaceMeshLandmarks(id, "/image.jpg")
      expect(Array.isArray(result)).toBe(true)
    })

    it("returns expressions for analyzeFacialExpressions", async () => {
      const id = await service.initMediaPipeProcessor()
      const result = await service.analyzeFacialExpressions(id, "/image.jpg")
      expect(result).toHaveProperty("expressions")
    })
  })

  // ============================================================================
  // Person Database
  // ============================================================================

  describe("Person Database", () => {
    it("returns null for getPerson", async () => {
      const person = await service.getPerson("person-123")
      expect(person).toBeNull()
    })

    it("returns stats for getPersonDatabaseStats", async () => {
      const stats = await service.getPersonDatabaseStats()
      expect(stats).toHaveProperty("totalPersons")
      expect(stats).toHaveProperty("totalEmbeddings")
      expect(stats).toHaveProperty("totalAppearances")
    })
  })

  // ============================================================================
  // Privacy
  // ============================================================================

  describe("Privacy", () => {
    it("returns processor ID for initPrivacyProcessor", async () => {
      const id = await service.initPrivacyProcessor()
      expect(typeof id).toBe("string")
    })
  })

  // ============================================================================
  // Clustering
  // ============================================================================

  describe("Clustering", () => {
    it("returns engine ID for initClusteringEngine", async () => {
      const id = await service.initClusteringEngine()
      expect(typeof id).toBe("string")
    })

    it("returns result for clusterFaces", async () => {
      const id = await service.initClusteringEngine()
      const result = await service.clusterFaces(id, [[0.1, 0.2]])
      expect(Array.isArray(result)).toBe(true)
    })
  })

  // ============================================================================
  // Video Recognition
  // ============================================================================

  describe("Video Recognition", () => {
    it("returns recognition result for processVideoRecognition", async () => {
      const result = await service.processVideoRecognition("/video.mp4")
      expect(result).toHaveProperty("videoPath")
      expect(result).toHaveProperty("frames")
    })

    it("returns null for getPreviewDataWithRecognition", async () => {
      const result = await service.getPreviewDataWithRecognition("file-123")
      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  describe("Audio Analysis", () => {
    it("returns object for analyzeAudioPeaks", async () => {
      const result = await service.analyzeAudioPeaks("/audio.mp3")
      expect(result).toBeDefined()
    })

    it("returns object for detectSpeechOnsets", async () => {
      const result = await service.detectSpeechOnsets("/audio.mp3")
      expect(result).toBeDefined()
    })
  })

  // ============================================================================
  // Whisper
  // ============================================================================

  describe("Whisper", () => {
    it("returns transcription for whisperTranscribeOpenAI", async () => {
      const result = await service.whisperTranscribeOpenAI("/audio.mp3", "en")
      expect(result).toHaveProperty("text")
    })

    it("returns translation for whisperTranslateOpenAI", async () => {
      const result = await service.whisperTranslateOpenAI("/audio.mp3", "en")
      expect(result).toHaveProperty("translatedText")
      expect(result).toHaveProperty("originalText")
    })

    it("returns transcription for whisperTranscribeLocal", async () => {
      const result = await service.whisperTranscribeLocal("/audio.mp3")
      expect(result).toHaveProperty("text")
    })

    it("returns array for getWhisperLocalModels", async () => {
      const models = await service.getWhisperLocalModels()
      expect(Array.isArray(models)).toBe(true)
    })

    it("returns init result for initWhisperPython", async () => {
      const result = await service.initWhisperPython()
      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("availableModels")
    })

    it("returns array for getWhisperModels", async () => {
      const models = await service.getWhisperModels()
      expect(Array.isArray(models)).toBe(true)
    })

    it("returns path for extractAudioForWhisper", async () => {
      const path = await service.extractAudioForWhisper("/video.mp4")
      expect(typeof path).toBe("string")
    })

    it("returns subtitles for generateSubtitlesFromTranscription", async () => {
      const subs = await service.generateSubtitlesFromTranscription("/transcription.json")
      expect(Array.isArray(subs)).toBe(true)
    })
  })

  // ============================================================================
  // Voice Recording
  // ============================================================================

  describe("Voice Recording", () => {
    it("returns result for saveVoiceRecording", async () => {
      const result = await service.saveVoiceRecording({ audioData: new Uint8Array(), format: "wav" } as any)
      expect(result).toHaveProperty("filePath")
      expect(result).toHaveProperty("fileName")
    })

    it("returns array for getSupportedAudioFormats", async () => {
      const formats = await service.getSupportedAudioFormats()
      expect(Array.isArray(formats)).toBe(true)
    })
  })

  // ============================================================================
  // AI Director
  // ============================================================================

  describe("AI Director", () => {
    it("returns analysis for analyzeVideoComprehensive", async () => {
      const result = await service.analyzeVideoComprehensive("/video.mp4")
      expect(result).toHaveProperty("analysis_id")
    })

    it("returns fragments for analyzeMontagVideos", async () => {
      const result = await service.analyzeMontagVideos(["/video1.mp4"], {})
      expect(Array.isArray(result)).toBe(true)
    })

    it("returns composition analysis for analyzeVideoComposition", async () => {
      const result = await service.analyzeVideoComposition("/video.mp4")
      expect(result).toBeDefined()
    })

    it("returns moments for detectKeyMoments", async () => {
      const moments = await service.detectKeyMoments("/video.mp4", {})
      expect(Array.isArray(moments)).toBe(true)
    })

    it("returns progress for getAnalysisProgress", async () => {
      const progress = await service.getAnalysisProgress()
      expect(progress).toHaveProperty("status")
      expect(progress).toHaveProperty("progress")
    })

    it("returns plan for generateMontagePlan", async () => {
      const plan = await service.generateMontagePlan([], {} as any)
      expect(plan).toHaveProperty("plan_id")
      expect(plan).toHaveProperty("fragments")
    })

    it("returns quality analysis for analyzeVideoQuality", async () => {
      const result = await service.analyzeVideoQuality("/video.mp4")
      expect(result).toBeDefined()
    })

    it("returns frame quality for analyzeFrameQuality", async () => {
      const result = await service.analyzeFrameQuality("/video.mp4", 5.0)
      expect(result).toBeDefined()
    })

    it("returns audio analysis for analyzeAudioContent", async () => {
      const result = await service.analyzeAudioContent("/audio.mp3")
      expect(result).toBeDefined()
    })
  })
})

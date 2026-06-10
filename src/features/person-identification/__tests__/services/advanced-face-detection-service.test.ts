/**
 * Tests for Advanced Face Detection Service
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdvancedFaceDetectionService } from "@/domains/ai-services/services/person-identification"

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

vi.mock("@timeline-studio/core/container", () => ({
  getAI: () => ({
    initRecognitionYoloProcessor: (options: Record<string, unknown>) => mockInvoke("init_yolo_processor", options),
    initPersonFacenetProcessor: (options: Record<string, unknown>) => mockInvoke("init_facenet_processor", options),
    checkGPUAvailability: () => mockInvoke("check_gpu_availability"),
    detectFacesAdvanced: (options: Record<string, unknown>) => mockInvoke("detect_faces_advanced", options),
    generateFaceEmbeddingFromBase64: (imageData: string) =>
      mockInvoke("generate_face_embedding_from_base64", { imageData }),
    analyzeFaceQuality: (faceImage: string) => mockInvoke("analyze_face_quality", { faceImage }),
    startRealtimeFaceDetection: (options: Record<string, unknown>) =>
      mockInvoke("start_realtime_face_detection", options),
    stopRealtimeFaceDetection: () => mockInvoke("stop_realtime_face_detection"),
    updateFaceDetectionConfig: (config: Record<string, unknown>) =>
      mockInvoke("update_face_detection_config", { config }),
    blurFacesInImageAdvanced: (options: Record<string, unknown>) => mockInvoke("blur_faces_in_image", options),
    cleanupFaceDetection: () => mockInvoke("cleanup_face_detection"),
  }),
}))

describe("AdvancedFaceDetectionService", () => {
  let service: AdvancedFaceDetectionService

  const mockFaceDetection = {
    id: "face-1",
    bbox: { x: 100, y: 150, width: 200, height: 250 },
    confidence: 0.95,
    embedding: new Float32Array([0.1, 0.2, 0.3]),
    landmarks: {
      points: [
        { x: 120, y: 170 },
        { x: 180, y: 170 },
      ],
      quality: 0.9,
    },
    pose3D: {
      yaw: 0,
      pitch: 0,
      roll: 0,
      translationX: 0,
      translationY: 0,
      translationZ: 0,
      confidence: 0.85,
    },
    imageQuality: {
      overall: 0.88,
      sharpness: 0.9,
      brightness: 0.85,
      contrast: 0.87,
      isBlurry: false,
      isTooDark: false,
      isTooBright: false,
      isOccluded: false,
      suitableForRecognition: true,
      suitableForEnrollment: true,
    },
    timestamp: { seconds: 10 },
    blur: 0.1,
    occlusion: 0.05,
    pose: { yaw: 0, pitch: 0, roll: 0 },
  }

  beforeEach(() => {
    // Reset singleton instance before each test
    ;(AdvancedFaceDetectionService as any).instance = undefined
    service = AdvancedFaceDetectionService.getInstance({ useGPU: false })
    vi.clearAllMocks()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = AdvancedFaceDetectionService.getInstance()
      const instance2 = AdvancedFaceDetectionService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("initialize", () => {
    it("should initialize YOLO and FaceNet models", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)

      await service.initialize()

      expect(invoke).toHaveBeenCalledWith("init_yolo_processor", expect.any(Object))
      expect(invoke).toHaveBeenCalledWith("init_facenet_processor", expect.any(Object))
    })

    it("should check GPU availability when useGPU is enabled", async () => {
      // Reset singleton and create new instance with GPU enabled
      ;(AdvancedFaceDetectionService as any).instance = undefined
      service = AdvancedFaceDetectionService.getInstance({ useGPU: true })
      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined) // init_yolo_processor
        .mockResolvedValueOnce(undefined) // init_facenet_processor
        .mockResolvedValueOnce(true) // check_gpu_availability

      await service.initialize()

      expect(invoke).toHaveBeenCalledWith("check_gpu_availability")
    })

    it("should handle initialization errors", async () => {
      // Reset singleton to ensure clean state
      ;(AdvancedFaceDetectionService as any).instance = undefined
      service = AdvancedFaceDetectionService.getInstance()
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Failed to load model"))

      await expect(service.initialize()).rejects.toThrow("Failed to load model")
    })
  })

  describe("detectFacesAdvanced", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should detect faces in base64 image", async () => {
      vi.mocked(invoke).mockResolvedValueOnce([mockFaceDetection])

      const result = await service.detectFacesAdvanced("base64imagedata", {
        returnEmbeddings: true,
        minConfidence: 0.7,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: "face-1",
        confidence: 0.95,
      })
      expect(invoke).toHaveBeenCalledWith("detect_faces_advanced", {
        imageData: "base64imagedata",
        returnEmbeddings: true,
        returnCroppedFaces: false,
        minConfidence: 0.7,
      })
    })

    it("should convert ArrayBuffer to base64", async () => {
      vi.mocked(invoke).mockResolvedValueOnce([])

      const arrayBuffer = new ArrayBuffer(10)
      await service.detectFacesAdvanced(arrayBuffer)

      expect(invoke).toHaveBeenCalledWith(
        "detect_faces_advanced",
        expect.objectContaining({
          imageData: expect.any(String),
        }),
      )
    })

    it("should return empty array on error", async () => {
      // Reset singleton and create fresh instance
      ;(AdvancedFaceDetectionService as any).instance = undefined
      service = AdvancedFaceDetectionService.getInstance()

      // Service calls ensureInitialized first, which needs to succeed
      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined) // init_yolo_processor
        .mockResolvedValueOnce(undefined) // init_facenet_processor
        .mockRejectedValueOnce(new Error("Detection failed")) // detect_faces_advanced

      const result = await service.detectFacesAdvanced("imagedata")

      expect(result).toEqual([])
    })
  })

  describe("detectFacesBatch", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should process multiple images in batches", async () => {
      vi.mocked(invoke).mockResolvedValue([mockFaceDetection])

      const images = [
        { id: "img1", data: "data1" },
        { id: "img2", data: "data2" },
        { id: "img3", data: "data3" },
      ]

      const progressCallback = vi.fn()
      const results = await service.detectFacesBatch(images, {
        returnEmbeddings: true,
        progressCallback,
      })

      expect(results.size).toBe(3)
      expect(results.get("img1")).toBeDefined()
      expect(progressCallback).toHaveBeenCalled()
    })

    it("should handle batch processing errors gracefully", async () => {
      vi.mocked(invoke)
        .mockResolvedValueOnce([mockFaceDetection])
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce([])

      const images = [
        { id: "img1", data: "data1" },
        { id: "img2", data: "data2" },
        { id: "img3", data: "data3" },
      ]

      const results = await service.detectFacesBatch(images)

      expect(results.size).toBe(3)
      expect(results.get("img1")).toHaveLength(1)
      expect(results.get("img2")).toEqual([])
      expect(results.get("img3")).toEqual([])
    })
  })

  describe("generateFaceEmbedding", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should generate embedding from face image", async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        vector: [0.1, 0.2, 0.3, 0.4, 0.5],
        quality: 0.92,
        dimension: 512,
      })

      const result = await service.generateFaceEmbedding("faceimagedata")

      expect(result).toBeInstanceOf(Float32Array)
      expect(result).toHaveLength(5)
      expect(result![0]).toBeCloseTo(0.1, 5)
    })

    it("should return null on error", async () => {
      // Reset singleton and create fresh instance
      ;(AdvancedFaceDetectionService as any).instance = undefined
      service = AdvancedFaceDetectionService.getInstance()

      // Service calls ensureInitialized first, which needs to succeed
      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined) // init_yolo_processor
        .mockResolvedValueOnce(undefined) // init_facenet_processor
        .mockRejectedValueOnce(new Error("Embedding failed")) // generate_face_embedding_from_base64

      const result = await service.generateFaceEmbedding("faceimagedata")

      expect(result).toBeNull()
    })
  })

  describe("analyzeFaceQuality", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should analyze face image quality", async () => {
      const mockQuality = {
        overall: 0.85,
        sharpness: 0.9,
        brightness: 0.8,
        contrast: 0.85,
        isBlurry: false,
        isTooDark: false,
        isTooBright: false,
        isOccluded: false,
        suitableForRecognition: true,
        suitableForEnrollment: true,
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockQuality)

      const result = await service.analyzeFaceQuality("faceimagedata")

      expect(result).toEqual(mockQuality)
    })

    it("should return default quality values on error", async () => {
      // Reset singleton and create fresh instance
      ;(AdvancedFaceDetectionService as any).instance = undefined
      service = AdvancedFaceDetectionService.getInstance()

      // Service calls ensureInitialized first, which needs to succeed
      vi.mocked(invoke)
        .mockResolvedValueOnce(undefined) // init_yolo_processor
        .mockResolvedValueOnce(undefined) // init_facenet_processor
        .mockRejectedValueOnce(new Error("Analysis failed")) // analyze_face_quality

      const result = await service.analyzeFaceQuality("faceimagedata")

      expect(result).toMatchObject({
        overall: 0,
        suitableForRecognition: false,
        suitableForEnrollment: false,
      })
    })
  })

  describe("startRealtimeProcessing", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should start realtime face detection", async () => {
      const callbacks = {
        onFaceDetected: vi.fn(),
        onStatusUpdate: vi.fn(),
        onError: vi.fn(),
      }

      await service.startRealtimeProcessing("stream-1", callbacks)

      expect(invoke).toHaveBeenCalledWith("start_realtime_face_detection", {
        streamId: "stream-1",
        config: expect.any(Object),
      })
    })
  })

  describe("stopRealtimeProcessing", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should stop realtime processing", async () => {
      await service.startRealtimeProcessing("stream-1", {})
      await service.stopRealtimeProcessing()

      expect(invoke).toHaveBeenCalledWith("stop_realtime_face_detection")
    })

    it("should not call stop if not processing", async () => {
      await service.stopRealtimeProcessing()

      expect(invoke).not.toHaveBeenCalled()
    })
  })

  describe("blurFaces", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should blur faces in image", async () => {
      vi.mocked(invoke).mockResolvedValueOnce("blurred_image_data")

      const result = await service.blurFaces("imagedata", {
        blurIntensity: 10,
        blurType: "gaussian",
        faceIds: ["face-1", "face-2"],
      })

      expect(result).toBe("blurred_image_data")
      expect(invoke).toHaveBeenCalledWith("blur_faces_in_image", {
        imageData: "imagedata",
        blurIntensity: 10,
        blurType: "gaussian",
        faceIds: ["face-1", "face-2"],
      })
    })

    it("should return original image on error", async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Blur failed"))

      const result = await service.blurFaces("imagedata")

      expect(result).toBe("imagedata")
    })
  })

  describe("updateConfig", () => {
    it("should update configuration", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()

      await service.updateConfig({ minFaceSize: 50, qualityThreshold: 0.8 })

      expect(invoke).toHaveBeenCalledWith("update_face_detection_config", {
        config: expect.objectContaining({
          minFaceSize: 50,
          qualityThreshold: 0.8,
        }),
      })
    })
  })

  describe("cleanup", () => {
    it("should cleanup resources", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()

      await service.cleanup()

      expect(invoke).toHaveBeenCalledWith("cleanup_face_detection")
    })

    it("should stop realtime processing before cleanup", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startRealtimeProcessing("stream-1", {})
      vi.clearAllMocks()

      await service.cleanup()

      expect(invoke).toHaveBeenCalledWith("stop_realtime_face_detection")
      expect(invoke).toHaveBeenCalledWith("cleanup_face_detection")
    })
  })
})

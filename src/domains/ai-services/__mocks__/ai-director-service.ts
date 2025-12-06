/**
 * Mock AI Director Service
 *
 * Мок для aiDirectorService используемый в тестах
 */

import { vi } from "vitest"
import type {
  AIDirectorConfig,
  AIDirectorHealthCheckResult,
  ComprehensiveAnalysisResult,
  SystemCapabilities,
} from "../services/ai-director"

// Define types that match the mock data structure
type HealthStatus = AIDirectorHealthCheckResult
type SystemStatus = {
  health: AIDirectorHealthCheckResult
  capabilities: SystemCapabilities
  version: string
}

export const mockComprehensiveAnalysisResult: ComprehensiveAnalysisResult = {
  analysis_id: "test-analysis-123",
  status: "completed",
  audio_analysis: {
    duration: 60,
    loudness: -14.0,
    tempo: 120,
    silence_percentage: 5,
    transcription: "Test transcription",
  },
  scene_analysis: {
    scenes: [
      {
        start_time: 0,
        end_time: 10,
        confidence: 0.9,
        description: "Test scene",
      },
    ],
    scene_count: 1,
  },
  video_analysis: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 60,
    bitrate: 5000000,
    codec: "h264",
  },
  object_detection: {
    objects: [],
    total_objects: 0,
  },
  face_recognition: {
    faces: [],
    total_faces: 0,
  },
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  total_duration_ms: 1000,
  errors: [],
}

export const mockHealthStatus: HealthStatus = {
  overall_status: "healthy",
  services: {
    audio_engine: "healthy",
    video_analysis: "healthy",
    scene_detection: "healthy",
  },
  last_check: new Date().toISOString(),
}

export const mockSystemStatus: SystemStatus = {
  health: mockHealthStatus,
  capabilities: {
    audio_analysis: true,
    video_analysis: true,
    object_detection: true,
    face_recognition: true,
    transcription: true,
    gpu_acceleration: false,
    mcp_agents: false,
  },
  version: "1.0.0",
}

export const mockAIDirectorConfig: AIDirectorConfig = {
  performance_mode: "Balanced",
  enable_audio_analysis: true,
  enable_scene_detection: true,
  enable_video_analysis: true,
  enable_vision_analysis: true,
  enable_face_detection: false,
  enable_face_analysis: false,
  enable_object_detection: false,
  enable_object_analysis: false,
  enable_emotion_analysis: false,
  enable_moment_detection: true,
  enable_content_classification: true,
  enable_composition_analysis: false,
  enable_mood_analysis: false,
  enable_quality_analysis: true,
  max_processing_time: 60,
  quality_threshold: 50,
  max_key_moments: 50,
  enable_caching: true,
  generate_editing_recommendations: false,
  enable_mcp_agents: false,
  ai_provider: null,
  ai_model: null,
  ai_api_key: null,
  enable_ai_enhanced_analysis: false,
  enable_ai_descriptions: false,
  enable_ai_mood_analysis: false,
  enable_vision_language_model: false,
  vlm_model: null,
  vlm_num_frames: 5,
  vlm_temperature: 0.7,
  vlm_max_tokens: 500,
  enable_parallel_processing: false,
  max_parallel_files: null,
}

export const aiDirectorService = {
  analyzeComprehensive: vi.fn().mockResolvedValue(mockComprehensiveAnalysisResult),
  getSystemStatus: vi.fn().mockResolvedValue(mockSystemStatus),
  healthCheck: vi.fn().mockResolvedValue(mockHealthStatus),
  checkAvailability: vi.fn().mockResolvedValue(true),
}

export const mockUnifiedContentAnalysis = {
  analysisId: "test-unified-123",
  videoPath: "/test/video.mp4",
  status: "completed" as const,
  createdAt: new Date().toISOString(),
  processingTimeMs: 1000,
  videoInfo: {
    duration: 60,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    codec: "h264",
    fileSize: 1024 * 1024 * 10,
  },
  qualityMetrics: {
    overall: 0.85,
    video: 0.9,
    audio: 0.8,
    technical: 0.85,
  },
}

export const mockMontageAnalysisResult = {
  video_id: "/test/video.mp4",
  analysis_id: "test-montage-123",
  duration: 60,
  quality_score: 0.85,
  motion_score: 0.8,
  faces_detected: 0,
  objects_detected: [],
  audio_quality: 0.85,
  key_moments: [],
}

export const resetAIDirectorServiceMocks = () => {
  aiDirectorService.analyzeComprehensive.mockClear()
  aiDirectorService.getSystemStatus.mockClear()
  aiDirectorService.healthCheck.mockClear()
  aiDirectorService.checkAvailability.mockClear()
}

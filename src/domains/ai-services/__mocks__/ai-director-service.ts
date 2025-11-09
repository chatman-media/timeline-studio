/**
 * Mock AI Director Service
 *
 * Мок для aiDirectorService используемый в тестах
 */

import { vi } from "vitest"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  HealthStatus,
  SystemStatus,
} from "@/types/generated/tauri-bindings"

export const mockComprehensiveAnalysisResult: ComprehensiveAnalysisResult = {
  analysis_id: "test-analysis-123",
  status: "Completed",
  audio_analysis: {
    has_audio: true,
    duration: 60,
    channels: 2,
    sample_rate: 48000,
    bitrate: 320000,
    transcription: {
      text: "Test transcription",
      confidence: 0.95,
      language: "en",
      segments: [],
    },
    audio_quality: {
      overall_score: 0.85,
      noise_level: 0.1,
      clarity: 0.9,
      volume_consistency: 0.8,
    },
    speech_segments: [],
    music_segments: [],
    silence_segments: [],
  } as any,
  scene_analysis: {
    scenes: [
      {
        startTime: 0,
        endTime: 10,
        sceneType: "dialogue",
        confidence: 0.9,
        description: "Test scene",
      } as any,
    ],
    shot_types: [
      {
        timestamp: 0,
        shot_type: "medium",
        confidence: 0.9,
      },
    ],
    transitions: [
      {
        timestamp: 10,
        transition_type: "cut",
        confidence: 0.95,
      },
    ],
    scene_changes: [],
    camera_movements: [],
  },
  vision_analysis: {
    objects: [],
    faces: [],
    text_regions: [],
    dominant_colors: [],
  },
  moment_analysis: {
    key_moments: [
      {
        timestamp: 5.0,
        type: "peak",
        confidence: 0.95,
        description: "Emotional peak moment",
      },
    ],
    highlights: [],
    emotional_peaks: [],
  },
  content_analysis: {
    topics: [],
    sentiment: "positive",
    themes: [],
    key_phrases: [],
  },
  combined_insights: {
    key_moments: [],
    emotional_timeline: [],
    transitions: [],
    overall_quality: 0.85,
    main_subjects: [],
    content_mood: "positive",
  },
  performance_metrics: {
    total_processing_time: 1000,
    audio_analysis_time: 200,
    scene_analysis_time: 200,
    vision_analysis_time: 200,
    moment_analysis_time: 200,
    content_analysis_time: 100,
    integration_time: 100,
    memory_used: 1024 * 1024 * 100,
    success_rate: 1.0,
  },
  editing_recommendations: [],
  errors: [],
  metadata: {
    analysis_version: "1.0.0",
    processing_time_ms: 1000,
    config_used: "default",
    engines_used: ["audio", "vision", "scene"],
    total_engines_available: 5,
    analysis_timestamp: new Date().toISOString(),
    success_rate: 1.0,
  },
}

export const mockHealthStatus: HealthStatus = {
  overall_status: "healthy",
  components: {
    audio_engine: "healthy",
    vision_engine: "healthy",
    scene_engine: "healthy",
  },
  last_check: new Date().toISOString(),
}

export const mockSystemStatus: SystemStatus = {
  health: mockHealthStatus,
  capabilities: {
    audio_analysis: true,
    vision_analysis: true,
    scene_analysis: true,
    moment_detection: true,
    content_analysis: true,
  },
  version: "1.0.0",
}

export const mockAIDirectorConfig: AIDirectorConfig = {
  enable_audio_analysis: true,
  enable_scene_analysis: true,
  enable_vision_analysis: true,
  enable_moment_analysis: true,
  enable_content_analysis: true,
  quality_threshold: 0.5,
  max_processing_time: 60000,
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
  duration: 60,
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  quality_score: 0.85,
  moments: [],
  audio_peaks: [],
  visual_quality: {
    brightness: 0.5,
    contrast: 0.7,
    sharpness: 0.8,
    color_balance: 0.6,
  },
  faces_detected: [],
  emotions_detected: [],
  metadata: {
    processing_time_ms: 1000,
    frames_analyzed: 1800,
    analysis_timestamp: new Date().toISOString(),
  },
}

export const resetAIDirectorServiceMocks = () => {
  aiDirectorService.analyzeComprehensive.mockClear()
  aiDirectorService.getSystemStatus.mockClear()
  aiDirectorService.healthCheck.mockClear()
  aiDirectorService.checkAvailability.mockClear()
}

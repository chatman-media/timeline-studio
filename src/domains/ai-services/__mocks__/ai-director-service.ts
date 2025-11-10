/**
 * Mock AI Director Service
 *
 * Мок для aiDirectorService используемый в тестах
 */

import { vi } from "vitest"
import type {
  AIDirectorConfig,
  ComprehensiveAnalysisResult,
  HealthCheckResult,
  SystemCapabilities,
} from "@/types/generated/tauri-bindings"

// Define types that match the mock data structure
type HealthStatus = HealthCheckResult
type SystemStatus = {
  health: HealthCheckResult
  capabilities: SystemCapabilities
  version: string
}

export const mockComprehensiveAnalysisResult: ComprehensiveAnalysisResult = {
  analysis_id: "test-analysis-123",
  status: "Completed",
  audio_analysis: {
    basic_metrics: {
      duration: { seconds: 60 },
      has_audio: true,
      sample_rate: { hz: 48000 },
      channels: 2,
      overall_volume: { level: 0.7 },
      estimated_quality: 0.85,
      file_size_bytes: 1024 * 1024 * 10,
      codec: "aac",
      bitrate: 320000,
    },
    ffmpeg_analysis: {
      volume_analysis: {
        peak_volume: { level: 0.95 },
        average_volume: { level: 0.7 },
        rms_volume: { level: 0.75 },
        dynamic_range: 0.8,
        loudness_lufs: -14.0,
        volume_histogram: [],
      },
      frequency_analysis: {
        dominant_frequencies: [],
        frequency_distribution: {
          bass_energy: 0.3,
          mid_energy: 0.5,
          treble_energy: 0.2,
          total_energy: 1.0,
        },
        spectral_centroid: { hz: 2000 },
        spectral_rolloff: { hz: 8000 },
        zero_crossing_rate: 0.1,
      },
      dynamics_analysis: {
        crest_factor: 1.5,
        dynamic_range: 0.8,
        compression_ratio: 2.0,
        attack_time: { seconds: 0.01 },
        release_time: { seconds: 0.1 },
      },
      quality_metrics: {
        overall_score: 0.85,
        noise_level: 0.1,
        clipping_detected: false,
        distortion_level: 0.05,
        signal_to_noise_ratio: 40.0,
        issues: [],
      },
    },
    montage_analysis: {
      dynamic_range: 0.8,
      speech_probability: 0.9,
      music_probability: 0.1,
      overall_quality_score: 0.85,
      content_segments: [],
      silence_segments: [],
      beat_detection: null,
      tempo_analysis: null,
      key_detection: null,
      emotional_tone: null,
      energy_level: 0.7,
      valence: 0.6,
      sync_analysis: null,
    },
    transcription_analysis: {
      engine_name: "whisper",
      full_text: "Test transcription",
      detected_language: "en",
      total_duration: { seconds: 60 },
      segments: [],
      words: [],
      confidence_score: 0.95,
      processing_time: { seconds: 2.5 },
      transcription_text: "Test transcription",
      language_detected: "en",
      overall_confidence: 0.95,
      word_segments: [],
      sentence_segments: [],
      speaker_segments: [],
      speech_rate: 150.0,
      pause_analysis: null,
      pronunciation_quality: 0.9,
      model_used: "base",
      provider_used: "local",
    },
    analysis_metadata: {
      analysis_version: "2.0-unified",
      processing_time_ms: 1000,
      config_used: {
        enable_ffmpeg_analysis: true,
        enable_montage_analysis: true,
        enable_transcription: true,
        ffmpeg_config: null,
        montage_config: null,
        whisper_config: null,
        performance_mode: "Balanced",
        max_processing_time_seconds: 300,
        enable_caching: true,
      },
      engines_used: ["ffmpeg", "montage", "whisper"],
      total_engines_available: 3,
      analysis_timestamp: new Date().toISOString(),
      success_rate: 1.0,
    },
  },
  scene_analysis: {
    scenes: [
      {
        id: "scene-1",
        fileId: "file-1",
        startTime: 0,
        endTime: 10,
        duration: 10,
        sceneType: "dialog",
        confidence: 0.9,
        keyFrames: [0, 5, 10],
        description: "Test scene",
        visual: null,
        audio: null,
        objects: [],
        persons: [],
        transition: null,
      },
    ],
    total_scenes: 1,
    avg_scene_duration: 10,
    scene_types_distribution: { dialog: 1 },
  },
  vision_analysis: {
    objects_detected: [],
    faces_count: 0,
    avg_composition_score: 0.85,
    visual_quality_avg: 0.9,
  },
  moment_analysis: {
    key_moments: [
      {
        id: "moment-1",
        fileId: "file-1",
        timestamp: 5.0,
        duration: 2.0,
        momentType: "emotional_peak",
        importanceScore: 0.95,
        scoring: {
          emotionIntensity: 0.95,
          emotionVariety: 0.8,
          emotionalChange: 0.9,
          visualQuality: 0.9,
          compositionQuality: 0.85,
          motionInterest: 0.7,
          audioClarity: 0.85,
          audioDynamics: 0.8,
          musicSync: 0.75,
          personProminence: 0.6,
          sceneUniqueness: 0.8,
          confidence: 0.95,
        },
        description: "Emotional peak moment",
        thumbnailTimestamp: 5.0,
        persons: [],
        tags: ["emotional", "peak"],
        sceneId: null,
      },
    ],
    total_moments: 1,
    moment_types_distribution: { emotional_peak: 1 },
    avg_importance: 0.95,
  },
  content_analysis: {
    classification: {
      primaryCategory: "video",
      categories: ["entertainment"],
      genre: "general",
      themes: ["test"],
      tags: [],
      confidence: 0.9,
    },
    mood: {
      primary: "positive",
      secondary: [],
      valence: 0.7,
      arousal: 0.6,
      dominance: 0.5,
      confidence: 0.85,
    },
    quality: {
      overall: 0.85,
      visual: 0.9,
      audio: 0.8,
      composition: 0.85,
    },
    avg_composition: {
      overall: 0.85,
      ruleOfThirds: 0.8,
      balance: 0.9,
      focusClarity: 0.85,
      symmetry: 0.75,
    },
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
  overallStatus: "healthy",
  services: {
    audio_engine: "healthy",
    vision_engine: "healthy",
    scene_engine: "healthy",
  },
  lastCheck: new Date().toISOString(),
}

export const mockSystemStatus: SystemStatus = {
  health: mockHealthStatus,
  capabilities: {
    audio_analysis: true,
    video_analysis: true,
    scene_detection: true,
    vision_analysis: true,
    face_recognition: true,
    object_detection: true,
    moment_detection: true,
    content_classification: true,
    transcription: true,
    gpu_acceleration: false,
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
  max_processing_time: 60000,
  quality_threshold: 0.5,
  max_key_moments: null,
  enable_caching: true,
  generate_editing_recommendations: true,
  enable_mcp_agents: false,
  ai_provider: null,
  ai_model: null,
  ai_api_key: null,
  use_ai_enhanced_analysis: false,
  ai_analysis_depth: "Balanced",
  enable_ai_tagging: false,
  enable_ai_descriptions: false,
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

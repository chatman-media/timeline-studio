/**
 * Test Utilities for Analysis Dashboard
 * Mock data and helper functions for testing
 */

import type { FileAnalysisProgress } from "@/features/ai-director"
import type { PerformanceMetricsData } from "../components/performance-metrics"
import type { VisualAnalyticsData } from "../components/visual-analytics"

/**
 * Create mock performance metrics data
 */
export function createMockPerformanceMetrics(overrides?: Partial<PerformanceMetricsData>): PerformanceMetricsData {
  return {
    cpu: {
      usage: 45,
      cores: 8,
    },
    memory: {
      used: 4096,
      total: 16384,
    },
    gpu: {
      usage: 0,
      name: "Intel Iris Plus Graphics",
    },
    analysis: {
      filesProcessed: 2,
      totalFiles: 5,
      avgProcessingTime: 120,
      totalProcessingTime: 240,
      eta: 360,
    },
    ...overrides,
  }
}

/**
 * Create mock visual analytics data
 */
export function createMockVisualAnalytics(overrides?: Partial<VisualAnalyticsData>): VisualAnalyticsData {
  return {
    scenes: [
      {
        startTime: 0,
        endTime: 10,
        duration: 10,
        sceneType: "intro",
        confidence: 0.95,
      },
      {
        startTime: 10,
        endTime: 25,
        duration: 15,
        sceneType: "action",
        confidence: 0.88,
      },
      {
        startTime: 25,
        endTime: 40,
        duration: 15,
        sceneType: "dialogue",
        confidence: 0.92,
      },
      {
        startTime: 40,
        endTime: 50,
        duration: 10,
        sceneType: "outro",
        confidence: 0.9,
      },
    ],
    moments: [
      {
        timestamp: 5,
        moment_type: "peak_action",
        importance_score: 0.9,
        description: "High intensity moment",
      },
      {
        timestamp: 15,
        moment_type: "emotional",
        importance_score: 0.85,
        description: "Emotional peak",
      },
      {
        timestamp: 30,
        moment_type: "transition",
        importance_score: 0.6,
        description: "Scene transition",
      },
      {
        timestamp: 45,
        moment_type: "conclusion",
        importance_score: 0.75,
        description: "Concluding moment",
      },
    ],
    qualityScores: [
      { timestamp: 0, overall: 0.8, visual: 0.85, audio: 0.75 },
      { timestamp: 10, overall: 0.85, visual: 0.9, audio: 0.8 },
      { timestamp: 20, overall: 0.9, visual: 0.92, audio: 0.88 },
      { timestamp: 30, overall: 0.75, visual: 0.7, audio: 0.8 },
      { timestamp: 40, overall: 0.82, visual: 0.85, audio: 0.79 },
    ],
    duration: 50,
    ...overrides,
  }
}

/**
 * Create mock file analysis progress
 */
export function createMockFileProgress(overrides?: Partial<FileAnalysisProgress>): FileAnalysisProgress {
  return {
    fileId: "test-file-1",
    filePath: "/path/to/test-video.mp4",
    fileName: "test-video.mp4",
    status: "analyzing",
    progress: 50,
    analyzers: [
      {
        type: "scene_detection",
        status: "completed",
        progress: 100,
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date(Date.now() - 30000).toISOString(),
        duration: 30000,
      },
      {
        type: "audio_quality",
        status: "running",
        progress: 75,
        startTime: new Date(Date.now() - 30000).toISOString(),
        details: "Processing audio samples...",
      },
      {
        type: "moment_detection",
        status: "pending",
        progress: 0,
      },
    ],
    startTime: new Date(Date.now() - 60000).toISOString(),
    stats: {
      totalAnalyzers: 3,
      completedAnalyzers: 1,
      failedAnalyzers: 0,
      skippedAnalyzers: 0,
    },
    ...overrides,
  }
}

/**
 * Create multiple mock file progress objects
 */
export function createMockFilesProgress(count: number): FileAnalysisProgress[] {
  return Array.from({ length: count }, (_, i) =>
    createMockFileProgress({
      fileId: `test-file-${i + 1}`,
      fileName: `test-video-${i + 1}.mp4`,
      filePath: `/path/to/test-video-${i + 1}.mp4`,
      status: i === 0 ? "analyzing" : i === 1 ? "completed" : "pending",
      progress: i === 0 ? 50 : i === 1 ? 100 : 0,
    }),
  )
}

/**
 * Create mock media file
 */
export function createMockMediaFile(id: string) {
  return {
    id,
    name: `video-${id}.mp4`,
    path: `/path/to/video-${id}.mp4`,
    media_type: "Video" as const,
    duration: 120,
    format: "mp4",
    size: 1024 * 1024 * 50, // 50MB
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
  }
}

/**
 * Wait for async updates (for testing)
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock AI Director result
 */
export function createMockAnalysisResult() {
  return {
    analysis_status: "completed",
    success_rate: 0.95,
    scene_analysis: {
      total_scenes: 4,
      avg_scene_duration: 12.5,
      scenes: createMockVisualAnalytics().scenes,
    },
    moment_analysis: {
      total_moments: 4,
      avg_importance_score: 0.775,
      top_moments: createMockVisualAnalytics().moments?.slice(0, 2),
      moments: createMockVisualAnalytics().moments,
    },
    audio_analysis: {
      rms_level: 0.15,
      peak_level: 0.85,
      spectral_centroid: 2500,
      energy: 0.45,
      has_music: true,
      music_confidence: 0.9,
      has_speech: true,
      speech_confidence: 0.85,
      silence_ratio: 0.1,
    },
    content_analysis: {
      mood: "energetic",
      mood_confidence: 0.88,
      style: "action",
      style_confidence: 0.92,
      tags: ["fast-paced", "dynamic", "engaging"],
      overall_quality: 0.85,
      visual_quality: 0.88,
      audio_quality: 0.82,
    },
    vision_analysis: {
      faces_count: 2,
      objects_detected: ["person", "car", "building", "sky"],
      avg_composition_score: 0.78,
    },
  }
}

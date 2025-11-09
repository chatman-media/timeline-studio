/**
 * Mock Unified Orchestrator
 *
 * Мок для UnifiedOrchestrator используемый в тестах
 */

import { vi } from "vitest"
import type {
  AnalysisOptions,
  MontageAnalysisResult,
  MontagePlan,
  PlanStatistics,
  PlanValidation,
} from "@/types/montage-planner-rust"
import type { UnifiedContentAnalysis } from "../mappers/ai-director-mapper"
import type { AnalysisWorkflow, BatchAnalysisWorkflow } from "../services/unified-orchestrator"
import { mockComprehensiveAnalysisResult } from "./ai-director-service"

export const mockUnifiedContentAnalysis: UnifiedContentAnalysis = {
  analysisId: "test-unified-123",
  videoPath: "/test/video.mp4",
  status: "completed",
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
  audioAnalysis: {
    transcription: "Test transcription",
    sentiment: "positive",
    keyPhrases: ["test", "analysis"],
    speakers: 1,
  },
  sceneAnalysis: {
    scenes: [
      {
        startTime: 0,
        endTime: 10,
        type: "dialogue",
        confidence: 0.9,
      },
    ],
    totalScenes: 1,
  },
  keyMoments: [
    {
      timestamp: 5.0,
      type: "highlight",
      confidence: 0.95,
      description: "Key moment",
    },
  ],
}

export const mockMontageAnalysisResult: MontageAnalysisResult = {
  video_id: "/test/video.mp4",
  duration: 60,
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  quality_score: 0.85,
  moments: [
    {
      timestamp: 5.0,
      score: 0.95,
      moment_type: "highlight",
      description: "Peak moment",
      frame_number: 150,
      features: {
        has_faces: true,
        has_motion: true,
        has_audio_peak: true,
        composition_score: 0.9,
      },
    },
  ],
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

export const mockMontagePlan: MontagePlan = {
  id: "test-plan-123",
  style: "dynamic",
  total_duration: 30,
  target_duration: 30,
  segments: [
    {
      video_id: "/test/video.mp4",
      start_time: 0,
      end_time: 10,
      reason: "Best quality moment",
      score: 0.95,
    },
  ],
  transitions: [],
  metadata: {
    created_at: new Date().toISOString(),
    video_count: 1,
    total_source_duration: 60,
    compression_ratio: 0.5,
  },
}

export const mockAnalysisWorkflow: AnalysisWorkflow = {
  workflowId: "workflow-123",
  status: "completed",
  videoPath: "/test/video.mp4",
  startTime: new Date(),
  endTime: new Date(),
  stages: {
    aiDirector: "completed",
    montagePlanner: "completed",
    integration: "completed",
  },
  results: {
    comprehensive: mockComprehensiveAnalysisResult,
    montage: mockMontageAnalysisResult,
    unified: mockUnifiedContentAnalysis,
  },
  errors: [],
}

export const mockBatchAnalysisWorkflow: BatchAnalysisWorkflow = {
  batchId: "batch-123",
  status: "completed",
  videoPaths: ["/test/video1.mp4", "/test/video2.mp4"],
  startTime: new Date(),
  endTime: new Date(),
  completedCount: 2,
  failedCount: 0,
  workflows: new Map([["workflow-123", mockAnalysisWorkflow]]),
}

export class MockUnifiedOrchestrator {
  private activeWorkflows = new Map<string, AnalysisWorkflow>()
  private activeBatches = new Map<string, BatchAnalysisWorkflow>()

  analyzeComprehensive = vi.fn().mockResolvedValue({
    workflowId: "workflow-123",
    comprehensive: mockComprehensiveAnalysisResult,
    montage: mockMontageAnalysisResult,
    unified: mockUnifiedContentAnalysis,
  })

  analyzeBatch = vi.fn().mockResolvedValue({
    batchId: "batch-123",
    results: [
      {
        videoPath: "/test/video1.mp4",
        workflowId: "workflow-123",
        comprehensive: mockComprehensiveAnalysisResult,
        montage: mockMontageAnalysisResult,
        unified: mockUnifiedContentAnalysis,
        success: true,
      },
    ],
  })

  generateMontagePlan = vi.fn().mockResolvedValue({
    analysisResults: [mockMontageAnalysisResult],
    plan: mockMontagePlan,
  })

  optimizeMontagePlan = vi.fn().mockResolvedValue(mockMontagePlan)

  validateMontagePlan = vi.fn().mockResolvedValue({
    is_valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  } as PlanValidation)

  calculatePlanStatistics = vi.fn().mockResolvedValue({
    total_segments: 1,
    total_duration: 30,
    average_segment_duration: 30,
    quality_distribution: { high: 1, medium: 0, low: 0 },
    transition_count: 0,
  } as PlanStatistics)

  getWorkflow = vi.fn((workflowId: string) => {
    return this.activeWorkflows.get(workflowId)
  })

  getBatch = vi.fn((batchId: string) => {
    return this.activeBatches.get(batchId)
  })

  getActiveWorkflows = vi.fn(() => Array.from(this.activeWorkflows.values()))

  getActiveBatches = vi.fn(() => Array.from(this.activeBatches.values()))

  cancelWorkflow = vi.fn().mockReturnValue(true)

  cleanupCompletedWorkflows = vi.fn().mockReturnValue(0)

  getSystemStatus = vi.fn().mockResolvedValue({
    health: { overall_status: "healthy" },
    capabilities: {},
    version: "1.0.0",
  })

  healthCheck = vi.fn().mockResolvedValue({
    isHealthy: true,
    aiDirector: {
      health: { overall_status: "healthy" },
      available: true,
    },
    timestamp: new Date().toISOString(),
  })

  cleanup = vi.fn()

  static getInstance = vi.fn(() => new MockUnifiedOrchestrator())
  static resetInstance = vi.fn()
}

export const unifiedOrchestrator = new MockUnifiedOrchestrator()

export const resetUnifiedOrchestratorMocks = () => {
  Object.values(unifiedOrchestrator).forEach((fn) => {
    if (typeof fn === "function" && "mockClear" in fn) {
      fn.mockClear()
    }
  })
}

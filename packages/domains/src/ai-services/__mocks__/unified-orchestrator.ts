/**
 * Mock Unified Orchestrator
 *
 * Мок для UnifiedOrchestrator используемый в тестах
 */

import { vi } from "vitest"
import type { MontageAnalysisResult, MontagePlan } from "@/types/montage-planner-rust"
import { MomentCategory, MontageStyle } from "@/types/montage-planner-rust"
import type { UnifiedContentAnalysis } from "../mappers/ai-director-mapper"
import type { AnalysisWorkflow, BatchAnalysisWorkflow } from "../services/unified-orchestrator"
import { mockComprehensiveAnalysisResult as importedMockComprehensiveAnalysisResult } from "./ai-director-service"

// Re-export mockComprehensiveAnalysisResult for use in tests
export const mockComprehensiveAnalysisResult = importedMockComprehensiveAnalysisResult

// Define types that are used in the mock but don't exist in the montage-planner-rust types
interface PlanValidation {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  quality: number
}

interface PlanStatistics {
  fragment_count: number
  total_duration: number
  average_fragment_duration: number
  average_quality: number
  motion_intensity: number
  audio_quality: number
  scene_variety: number
  transition_smoothness: number
}

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
    hasAudio: true,
    duration: 60,
    channels: 2,
    sampleRate: 48000,
    bitrate: 320000,
    quality: 85,
    speechSegments: [],
    musicSegments: [],
    transcription: {
      fullText: "Test transcription",
      segments: [
        {
          start: 0,
          end: 10,
          text: "Test transcription",
          confidence: 0.95,
        },
      ],
      language: "en",
    },
    emotionalTone: "positive",
    energyLevel: 0.7,
  },
  visualAnalysis: {
    scenes: [
      {
        startTime: 0,
        endTime: 10,
        sceneType: "dialogue",
        confidence: 0.9,
        description: "Test scene",
      },
    ],
    objects: [],
    faces: [],
  },
  keyMoments: [
    {
      timestamp: 5.0,
      duration: 2.0,
      category: "highlight",
      score: 0.95,
      description: "Key moment",
      tags: [],
    },
  ],
}

export const mockMontageAnalysisResult: MontageAnalysisResult = {
  video_id: "/test/video.mp4",
  analysis_id: "test-montage-123",
  duration: 60,
  quality_score: 0.85,
  motion_score: 0.8,
  faces_detected: 2,
  objects_detected: ["person", "table"],
  audio_quality: 0.85,
  key_moments: [
    {
      timestamp: 5.0,
      duration: 2.0,
      category: MomentCategory.Highlight,
      scores: {
        visual: 95,
        technical: 90,
        emotional: 95,
        narrative: 85,
        action: 80,
        composition: 90,
      },
      total_score: 0.95,
      description: "Peak moment",
      tags: ["emotional", "peak"],
    },
  ],
}

export const mockMontagePlan: MontagePlan = {
  id: "test-plan-123",
  name: "Test Montage Plan",
  style: MontageStyle.DynamicAction,
  total_duration: 30,
  clips: [
    {
      id: "clip-1",
      source_file: "/test/video.mp4",
      start_time: 0,
      end_time: 10,
      duration: 10,
      moment: {
        timestamp: 5.0,
        duration: 2.0,
        category: MomentCategory.Highlight,
        scores: {
          visual: 95,
          technical: 90,
          emotional: 95,
          narrative: 85,
          action: 80,
          composition: 90,
        },
        total_score: 0.95,
        description: "Peak moment",
        tags: ["emotional", "peak"],
      },
      adjustments: {
        speed_multiplier: 1.0,
        color_correction: null,
        stabilization: false,
        crop: null,
        fade_in: null,
        fade_out: null,
      },
      order: 0,
    },
  ],
  transitions: [],
  quality_score: 0.95,
  engagement_score: 0.9,
  created_at: new Date().toISOString(),
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
    comprehensive: importedMockComprehensiveAnalysisResult,
    montage: mockMontageAnalysisResult,
    unified: mockUnifiedContentAnalysis,
  })

  analyzeBatch = vi.fn().mockResolvedValue({
    batchId: "batch-123",
    results: [
      {
        videoPath: "/test/video1.mp4",
        workflowId: "workflow-123",
        comprehensive: importedMockComprehensiveAnalysisResult,
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
    quality: 0.95,
  } as PlanValidation)

  calculatePlanStatistics = vi.fn().mockResolvedValue({
    fragment_count: 1,
    total_duration: 30,
    average_fragment_duration: 30,
    average_quality: 0.85,
    motion_intensity: 0.8,
    audio_quality: 0.85,
    scene_variety: 0.7,
    transition_smoothness: 0.9,
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

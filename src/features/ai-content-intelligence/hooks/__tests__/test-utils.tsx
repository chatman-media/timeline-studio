/**
 * Test utilities for AI Content Intelligence hooks
 */

import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { vi } from "vitest"
import type { AIConfig } from "@/domains/shared/types/ai-tools/ai-config"
import type { UnifiedContentAnalysis } from "@/domains/shared/types/ai-tools/content-analysis"
import type { IntelligentContent, PipelineProgress } from "@/domains/shared/types/ai-tools/pipeline"
import { ProcessingStatus } from "@/domains/shared/types/ai-tools/pipeline"
import type { AdaptedContent, PlatformId } from "@/domains/shared/types/ai-tools/platform-adaptation"
import type { GeneratedScript, ScriptGenerationParams } from "@/domains/shared/types/ai-tools/script-generation"
import { AIIntelligenceProvider } from "../../services/ai-intelligence-provider"

// Import ProcessingStatus enum

// Mock Blob if not available in test environment
if (typeof Blob === "undefined") {
  global.Blob = class Blob {
    constructor(
      public parts: any[],
      public options: any = {},
    ) {}
    get type() {
      return this.options.type || ""
    }
  } as any
}

// Mock AI Intelligence Actor
export const createMockActor = () => ({
  start: vi.fn(),
  stop: vi.fn(),
  send: vi.fn(),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  getSnapshot: vi.fn(() => ({
    context: {
      currentProject: null,
      analysisResults: null,
      generatedScripts: [],
      platformAdaptations: [],
      error: null,
    },
    value: "idle",
  })),
  system: {},
})

// Mock AIIntelligenceOrchestrator
export class MockAIIntelligenceOrchestrator {
  constructor(public actor: any) {}

  async analyzeContent(_mediaFiles: any[], _config?: Partial<AIConfig>): Promise<UnifiedContentAnalysis> {
    return createMockAnalysis()
  }

  async generateScript(_analysis: UnifiedContentAnalysis, _params: ScriptGenerationParams): Promise<GeneratedScript> {
    return createMockScript()
  }

  async adaptForPlatforms(_content: any, platforms: PlatformId[]): Promise<AdaptedContent[]> {
    return platforms.map((platform) => createMockAdaptedContent(platform))
  }

  async processProject(_mediaFiles: any[], _config: AIConfig): Promise<IntelligentContent> {
    return createMockIntelligentContent()
  }

  createPipelineControl() {
    return {
      pause: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
      getProgress: vi.fn(() => createMockProgress()),
      onProgress: vi.fn((_callback) => {
        // Return unsubscribe function without calling callback
        // This avoids timing issues in tests
        const unsubscribe = vi.fn()
        // Don't call callback immediately to avoid React state update issues
        return unsubscribe
      }),
      onEvent: vi.fn(() => vi.fn()), // unsubscribe
    }
  }

  // Engine management methods
  async initializeEngines() {
    return Promise.resolve()
  }

  async shutdownEngines() {
    return Promise.resolve()
  }

  getEngineStatus(_engineName: string) {
    return { initialized: true, ready: true }
  }
}

// Test wrapper with providers
interface TestWrapperProps {
  children: ReactNode
  mockActor?: any
}

// Mock provider component - moved outside to avoid nested component definitions
function MockProvider({ children, mockActor }: { children: ReactNode; mockActor?: any }) {
  const actor = mockActor || createMockActor()

  return (
    <div>
      {/* We'll mock the provider behavior in individual tests */}
      {children}
    </div>
  )
}

export function TestWrapper({ children, mockActor }: TestWrapperProps) {
  return <MockProvider mockActor={mockActor}>{children}</MockProvider>
}

// Render hook with providers
export function renderHookWithProviders<T>(
  hook: () => T,
  options?: {
    mockActor?: any
  },
) {
  const mockActor = options?.mockActor || createMockActor()

  return renderHook(hook, {
    wrapper: ({ children }) => <AIIntelligenceProvider>{children}</AIIntelligenceProvider>,
  })
}

// Fixed date for tests
const MOCK_DATE = new Date("2025-01-01T00:00:00.000Z")

// Mock data creators
export function createMockAnalysis(): UnifiedContentAnalysis {
  return {
    mediaFile: createMockMediaFile(),
    scenes: [
      {
        id: "scene-1",
        startTime: 0,
        endTime: 30,
        duration: 30,
        type: "action" as any,
        keyFrames: [],
        quality: {
          overall: 85,
          sharpness: 90,
          brightness: 80,
          contrast: 85,
          saturation: 75,
          stability: 88,
          noise: 10,
        },
        content: {
          objects: [],
          faces: [],
          text: [],
          activities: [],
        },
        transitions: [],
      },
      {
        id: "scene-2",
        startTime: 30,
        endTime: 60,
        duration: 30,
        type: "dialogue" as any,
        keyFrames: [],
        quality: {
          overall: 82,
          sharpness: 85,
          brightness: 83,
          contrast: 80,
          saturation: 78,
          stability: 85,
          noise: 12,
        },
        content: {
          objects: [],
          faces: [],
          text: [],
          activities: [],
        },
        transitions: [],
      },
    ],
    keyMoments: [
      {
        id: "moment-1",
        timestamp: 15,
        duration: 5,
        type: "action_peak" as any,
        score: 0.9,
        description: "High action sequence",
        sceneId: "scene-1",
      },
    ],
    contentType: "narrative" as any,
    genres: ["action" as any, "drama" as any],
    mood: {
      primary: "excited" as any,
      intensity: 0.8,
    },
    targetAudience: {
      ageRange: { min: 18, max: 35 },
      interests: ["action", "adventure"],
      demographics: {
        primary: "young_adults",
      },
    },
    technicalSpecs: {
      resolution: { width: 1920, height: 1080, aspectRatio: "16:9" },
      frameRate: 30,
      codec: "h264",
      bitrate: 5000000,
      audioChannels: 2,
      audioCodec: "aac",
      audioBitrate: 128000,
      duration: 120,
    },
    qualityMetrics: {
      overall: 85,
      sharpness: 90,
      brightness: 80,
      contrast: 85,
      saturation: 75,
      stability: 88,
      noise: 10,
    },
    detections: {
      objects: [],
      faces: [],
      text: [],
      audio: {
        speech: [],
        music: [],
        soundEffects: [],
        silence: [],
      },
      scenes: [],
    },
    insights: {
      summary: "High-quality action video with good pacing",
      highlights: ["Impressive action sequence at 15s", "Good visual quality"],
      suggestions: ["Consider color grading for consistency"],
      warnings: [],
      opportunities: [],
      strengths: ["High visual quality", "Good pacing"],
      weaknesses: ["Color grading inconsistency"],
      recommendations: ["Add color grading", "Enhance audio"],
      marketingAngles: ["Action-packed", "High quality"],
      targetDemographics: ["18-35 year olds", "Action enthusiasts"],
    },
  } as UnifiedContentAnalysis
}

export function createMockScript(): GeneratedScript {
  return {
    id: "script-1",
    title: "Epic Adventure",
    description: "An exciting journey",
    genre: ["action", "adventure"],
    duration: 120,
    structure: {
      type: "three-act",
      acts: [
        { name: "Setup", duration: 30 },
        { name: "Confrontation", duration: 60 },
        { name: "Resolution", duration: 30 },
      ],
    },
    scenes: [
      {
        id: "scene-1",
        title: "Opening",
        description: "Establishing shot",
        duration: 30,
        dialogue: [],
        actions: [],
      },
    ],
    metadata: {
      tone: "exciting",
      pacing: "fast",
      targetAudience: "general",
    },
  } as any
}

export function createMockGeneratedScript(): GeneratedScript {
  return {
    id: "generated-script-1",
    title: "Сгенерированный сценарий",
    genre: ["general" as any],
    duration: 120,
    structure: {
      type: "three_act" as any,
      acts: [
        {
          number: 1,
          title: "Завязка",
          description: "Представление персонажей и мира",
          scenes: ["scene-1"],
          duration: 30,
        },
        {
          number: 2,
          title: "Развитие",
          description: "Основные события и конфликты",
          scenes: ["scene-2"],
          duration: 60,
        },
        {
          number: 3,
          title: "Развязка",
          description: "Завершение истории",
          scenes: ["scene-3"],
          duration: 30,
        },
      ],
      turningPoints: [
        {
          timestamp: 30,
          type: "plot_point" as any,
          description: "Первый поворотный момент",
          impact: 0.8,
        },
      ],
      climax: {
        timestamp: 90,
        duration: 10,
        description: "Кульминация истории",
        emotionalPeak: 0.9,
      },
      resolution: {
        timestamp: 110,
        type: "happy" as any,
        description: "Счастливый финал",
      },
    },
    scenes: [
      {
        id: "scene-1",
        number: 1,
        title: "Открытие",
        description: "Устанавливающий кадр",
        duration: 30,
        visualElements: [
          {
            type: "establishing_shot" as any,
            description: "Общий план локации",
            timing: { start: 0, end: 30, duration: 30 },
            importance: "high" as any,
          },
        ],
        audioElements: [
          {
            type: "music" as any,
            description: "Фоновая музыка",
            timing: { start: 0, end: 30, duration: 30 },
            volume: "medium" as any,
          },
        ],
      },
    ],
    characters: [
      {
        id: "char-1",
        name: "Главный герой",
        role: "protagonist" as any,
        description: "Молодой и смелый герой",
        appearances: [
          {
            sceneId: "scene-1",
            timestamp: 5,
            duration: 25,
          },
        ],
      },
    ],
    dialogue: [
      {
        id: "dialogue-1",
        sceneId: "scene-1",
        character: "char-1",
        text: "Началось приключение!",
        timing: { start: 10, end: 15, duration: 5 },
        emotion: {
          primary: "excited" as any,
          intensity: 0.7,
        },
      },
    ],
    voiceover: [
      {
        id: "voiceover-1",
        sceneId: "scene-1",
        text: "Наша история начинается здесь...",
        timing: { start: 0, end: 5, duration: 5 },
        style: "narrative" as any,
      },
    ],
    metadata: {
      createdAt: MOCK_DATE,
      updatedAt: MOCK_DATE,
      version: 1,
      language: "ru",
      targetAudience: "Общая аудитория",
      tone: {
        primary: "excited" as any,
        intensity: 0.7,
      },
      pacing: {
        overall: "moderate" as any,
        variations: [],
      },
      style: {
        visual: "cinematic" as any,
        narrative: "linear" as any,
        editing: "continuity" as any,
      },
    },
  }
}

export function createMockAdaptedContent(platform: PlatformId): AdaptedContent {
  return {
    id: `adapted-${platform}`,
    platform,
    originalContent: {
      id: "original-1",
      duration: 120,
      resolution: { width: 1920, height: 1080 },
    },
    adaptations: {
      video: {
        resolution: { width: 1080, height: 1920 },
        aspectRatio: { ratio: "9:16", width: 9, height: 16 },
        duration: 60,
        codec: "h264",
        bitrate: 4000000,
      },
      text: {
        title: "Amazing Video",
        description: "Check out this amazing content!",
        hashtags: ["#amazing", "#video"],
        mentions: [],
      },
      audio: {
        format: "aac",
        bitrate: 128000,
        channels: 2,
        sampleRate: 44100,
      },
      thumbnail: {
        url: "thumbnail.jpg",
        width: 1080,
        height: 1920,
      },
    },
    metadata: {
      generatedAt: MOCK_DATE,
      language: "en",
      region: "US",
      tags: ["entertainment"],
    },
    platformSpecific: {},
  } as any
}

export function createMockIntelligentContent(): IntelligentContent {
  return {
    id: "content-1",
    projectId: "project-1",
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    analysis: createMockAnalysis(),
    script: createMockScript(),
    moments: [
      {
        id: "moment-1",
        timestamp: 15,
        duration: 5,
        type: "highlight",
        score: 0.9,
        description: "Key action moment",
        tags: ["action", "highlight"],
      },
    ],
    classification: {
      primary: {
        category: "entertainment",
        subcategory: "action",
        confidence: 0.9,
      },
      secondary: [],
      confidence: 0.9,
      tags: ["action", "adventure"],
    },
    platformContent: [createMockAdaptedContent("youtube" as PlatformId)],
    metadata: {
      startTime: MOCK_DATE,
      endTime: MOCK_DATE,
      duration: 5000,
      config: {} as AIConfig,
      steps: [],
      resources: {
        cpuUsage: 50,
        memoryUsage: 1024,
        apiCalls: [],
        cacheHits: 10,
        cacheMisses: 2,
      },
    },
  }
}

export function createMockProgress(percent = 25): PipelineProgress {
  return {
    overall: percent,
    currentStep: "Analyzing content",
    steps: [
      {
        name: "Analysis",
        progress: 100,
        status: ProcessingStatus.COMPLETED,
      },
      {
        name: "Script Generation",
        progress: 50,
        status: ProcessingStatus.RUNNING,
      },
      {
        name: "Platform Adaptation",
        progress: 0,
        status: ProcessingStatus.PENDING,
      },
    ],
    estimatedTimeRemaining: 60,
    messages: [],
  }
}

export function createMockMediaFile(name = "video.mp4") {
  return {
    path: `/path/to/${name}`,
    filename: name,
    name: name,
    size: 1024 * 1024 * 100, // 100MB
    format: name.split(".").pop() || "mp4",
    duration: 120, // 2 minutes
  }
}

export function createMockAIConfig(): AIConfig {
  return {
    analysis: {
      enableSceneDetection: true,
      enableObjectRecognition: true,
      enableAudioAnalysis: true,
      enableQualityAnalysis: true,
      sceneDetectionSensitivity: 0.7,
      minimumSceneDuration: 2,
    },
    generation: {
      enableScript: true,
      enableMoments: true,
      enableSuggestions: true,
      scriptStyle: "narrative",
      targetDuration: 120,
      language: "en",
    },
    adaptation: {
      platforms: ["youtube", "tiktok"] as PlatformId[],
      autoAdapt: true,
      preserveQuality: true,
      optimizeForPlatform: true,
    },
    pipeline: {
      parallel: true,
      maxRetries: 3,
      timeout: 300000,
      cacheResults: true,
    },
  } as any
}

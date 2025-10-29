/**
 * AI Intelligence State Machine - AI Services Domain
 * Управление состоянием AI Content Intelligence через XState
 *
 * Перенесено из src/features/ai-content-intelligence/shared/services/ai-intelligence-machine.ts
 */

import { assign, emit, fromPromise, setup } from "xstate"
// Service imports (will be replaced with domain services)
// Import services from domain
// import { getAIContainer } from "@/domains/ai-core"
import type { IContentAnalysisService, IFFmpegAnalysisService, IVisionService } from "../types/interfaces"

// Service getters for compatibility
let ffmpegService: IFFmpegAnalysisService | null = null
let visionService: IVisionService | null = null
let contentAnalysisService: IContentAnalysisService | null = null
let aiService: any = null

/**
 * Get FFmpeg analysis service
 */
async function getFFmpegService(): Promise<IFFmpegAnalysisService> {
  if (!ffmpegService) {
    // Создаём заглушку
    ffmpegService = {
      getVideoMetadata: async () => ({
        format: "mp4",
        duration: 0,
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: 5000,
        codec: "h264",
        audioChannels: 2,
        audioCodec: "aac",
        hasAudio: true,
      }),
      detectScenes: async () => [],
      analyzeQuality: async () => ({
        overall: 75,
        video: {
          sharpness: 80,
          brightness: 70,
          contrast: 75,
          saturation: 70,
          stability: 85,
          noise: 20,
        },
      }),
      detectSilence: async () => ({
        silentSegments: [],
        totalSilenceDuration: 0,
        speechRatio: 1,
      }),
      analyzeMotion: async () => ({
        motionIntensity: 50,
        stabilityScore: 85,
      }),
      analyzeVideo: async () => ({
        duration: 0,
        fps: 30,
        resolution: { width: 1920, height: 1080 },
        codec: "h264",
        bitrate: 5000,
        scenes: [],
        quality: { overall: 75, sharpness: 0.8, noise: 0.2, compression: 0.7, motionIntensity: 0.5 },
      }),
      analyzeAudio: async () => ({
        duration: 0,
        channels: 2,
        sampleRate: 44100,
        bitrate: 128000,
        codec: "aac",
        volume: { average: 0.7, peak: 0.9, min: 0.1, max: 0.95 },
        silentSegments: [],
      }),
      extractFrames: async () => [],
      extractAudioSegment: async () => "",
      extractKeyframes: async () => [],
      convertToFormat: async () => true,
    } as IFFmpegAnalysisService
  }
  return ffmpegService!
}

/**
 * Get Vision service for scene analysis
 */
async function getVisionService(): Promise<IVisionService> {
  if (!visionService) {
    // Создаём заглушку
    visionService = {
      analyzeFrame: async () => ({
        objects: [],
        faces: [],
        text: [],
        scene: { type: "unknown", confidence: 0.5, attributes: [] },
        nsfw: { safe: 0.9, suggestive: 0.05, explicit: 0.05 },
      }),
      analyzeVideo: async () => [],
      detectFaces: async () => [],
      recognizeText: async () => "",
      analyzeFrames: async () => [],
      detectObjects: async () => [],
      extractText: async () => [],
      analyzeComposition: async () => ({
        ruleOfThirds: { score: 0.5, points: [] },
        leadingLines: { score: 0.5, lines: [] },
        balance: { score: 0.5, centerOfMass: { x: 0.5, y: 0.5 } },
        symmetry: { score: 0.5 },
      }),
      analyzeColors: async () => ({
        dominantColors: [],
        palette: [],
        temperature: "neutral" as const,
        saturation: "medium" as const,
        brightness: "medium" as const,
      }),
    } as IVisionService
  }
  return visionService!
}

/**
 * Get Content Analysis service
 */
async function getContentAnalysisService(): Promise<IContentAnalysisService> {
  if (!contentAnalysisService) {
    // Создаём заглушку
    contentAnalysisService = {
      analyzeContent: async (file) => ({
        id: "test",
        mediaFile: file,
        video: {
          duration: 0,
          fps: 30,
          resolution: { width: 1920, height: 1080 },
          codec: "h264",
          bitrate: 5000,
          scenes: [],
          quality: { overall: 75, sharpness: 0.8, noise: 0.2, compression: 0.7, motionIntensity: 0.5 },
        },
        audio: {
          duration: 0,
          channels: 2,
          sampleRate: 44100,
          bitrate: 128000,
          codec: "aac",
          volume: { average: 0.7, peak: 0.9, min: 0.1, max: 0.95 },
          silentSegments: [],
        },
        scenes: [],
        transcript: { text: "", segments: [] },
        summary: "",
        tags: [],
        sentiment: { positive: 0, neutral: 1, negative: 0 },
      }),
      analyzeMultiple: async () => [],
      generateSummary: async () => "Summary",
      extractKeyMoments: async () => [],
      analyzeMedia: async (file) => ({
        id: "test",
        mediaFile: file,
        video: {
          duration: 0,
          fps: 30,
          resolution: { width: 1920, height: 1080 },
          codec: "h264",
          bitrate: 5000,
          scenes: [],
          quality: { overall: 75, sharpness: 0.8, noise: 0.2, compression: 0.7, motionIntensity: 0.5 },
        },
        audio: {
          duration: 0,
          channels: 2,
          sampleRate: 44100,
          bitrate: 128000,
          codec: "aac",
          volume: { average: 0.7, peak: 0.9, min: 0.1, max: 0.95 },
          silentSegments: [],
        },
        scenes: [],
        transcript: { text: "", segments: [] },
        summary: "",
        tags: [],
        sentiment: { positive: 0, neutral: 1, negative: 0 },
      }),
      batchAnalyzeMedia: async () => [],
    } as IContentAnalysisService
  }
  return contentAnalysisService!
}

/**
 * Get AI service for content generation
 */
async function getAIService(): Promise<any> {
  if (!aiService) {
    // For now, return a mock service
    aiService = {
      generateScript: async () => ({ text: "Generated script", scenes: [] }),
      adaptForPlatform: async () => ({ adaptedContent: [] }),
    }
  }
  return aiService
}

import { ContentType, Emotion } from "../../shared/types/ai-tools/content-analysis"
// Import enums and values (not types) - use shared ones
import { ProcessingStatus } from "../../shared/types/ai-tools/pipeline"
// Import types from domain
import type {
  AdaptedContent,
  AIConfig,
  AIIntelligenceContext,
  AIIntelligenceEvent,
  ContentInsights,
  GeneratedScript,
  MediaFile,
  PlatformId,
  ScriptGenerationParams,
  UnifiedContentAnalysis,
} from "../types/ai-intelligence"
// Import IntelligentContent from pipeline types
import type { IntelligentContent } from "../../shared/types/ai-tools/pipeline"

// Actors
const analyzeContentActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      mediaFiles: MediaFile[]
      config: AIConfig
      ffmpegService: any
      aiService: any
    }
  }) => {
    console.log("[AI Intelligence] Starting content analysis")
    const { mediaFiles, ffmpegService, aiService } = input

    // Базовый анализ через FFmpeg
    const ffmpegAnalysis = await performFFmpegAnalysis(mediaFiles[0], ffmpegService)

    // AI анализ
    const aiAnalysis = await performAIAnalysis(ffmpegAnalysis, mediaFiles[0], aiService)

    // Объединение результатов
    const unifiedAnalysis: UnifiedContentAnalysis = {
      mediaFile: {
        path: mediaFiles[0].path,
        name: mediaFiles[0].filename,
        filename: mediaFiles[0].filename,
        size: mediaFiles[0].size || 0,
        format: ffmpegAnalysis.metadata.format,
        duration: ffmpegAnalysis.metadata.duration,
      },
      scenes: aiAnalysis.scenes || [],
      keyMoments: aiAnalysis.keyMoments || [],
      contentType: aiAnalysis.contentType || ContentType.NARRATIVE,
      genres: aiAnalysis.genres || [],
      mood: aiAnalysis.mood || { primary: Emotion.CALM, intensity: 0.5 },
      targetAudience: aiAnalysis.targetAudience || {
        ageRange: { min: 18, max: 65 },
        interests: [],
        demographics: { primary: "general" },
      },
      technicalSpecs: {
        resolution: {
          width: ffmpegAnalysis.metadata.width,
          height: ffmpegAnalysis.metadata.height,
          aspectRatio: `${ffmpegAnalysis.metadata.width}:${ffmpegAnalysis.metadata.height}`,
        },
        frameRate: ffmpegAnalysis.metadata.fps,
        bitrate: ffmpegAnalysis.metadata.bitrate,
        codec: ffmpegAnalysis.metadata.codec,
        audioChannels: ffmpegAnalysis.metadata.audioChannels || 2,
        audioCodec: ffmpegAnalysis.metadata.audioCodec || "unknown",
        audioBitrate: 0,
        duration: ffmpegAnalysis.metadata.duration,
      },
      qualityMetrics: ffmpegAnalysis.quality || {
        overall: 75,
        sharpness: 80,
        brightness: 70,
        contrast: 75,
        saturation: 70,
        stability: 85,
        noise: 20,
      },
      detections: {
        objects: [],
        faces: [],
        text: [],
        audio: {
          speech: [],
          music: [],
          soundEffects: [],
          silence: ffmpegAnalysis.silence?.silences || [],
        },
        scenes: (ffmpegAnalysis.scenes?.scenes || []).map((s: any, idx: number) => ({
          ...s,
          sceneNumber: idx + 1,
          duration: s.endTime - s.startTime,
          changeScore: s.confidence || 0.5,
        })),
      },
      insights: {
        summary: "AI analysis completed",
        highlights: aiAnalysis.insights?.highlights || [],
        suggestions: aiAnalysis.insights?.suggestions || [],
        warnings: aiAnalysis.insights?.warnings || [],
        opportunities: aiAnalysis.insights?.opportunities || [],
        strengths: aiAnalysis.insights?.strengths || [],
        weaknesses: aiAnalysis.insights?.weaknesses || [],
        recommendations: aiAnalysis.insights?.recommendations || [],
        marketingAngles: aiAnalysis.insights?.marketingAngles || [],
        targetDemographics: aiAnalysis.insights?.targetDemographics || [],
      } as ContentInsights,
    }

    console.log("[AI Intelligence] Content analysis completed")
    return unifiedAnalysis
  },
)

const generateScriptActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      analysis: UnifiedContentAnalysis
      params: ScriptGenerationParams
      aiService: any
    }
  }) => {
    console.log("[AI Intelligence] Starting script generation")
    const { analysis, params } = input

    // Временная заглушка для генерации сценария
    const script: GeneratedScript = {
      id: `script-${Date.now()}`,
      title: "Generated Script",
      synopsis: "AI generated script summary",
      duration: analysis.technicalSpecs.duration,
      scenes: [],
      voiceover: undefined,
      visuals: [],
      music: [],
      metadata: {
        generatedAt: new Date(),
        model: "test",
        params: params,
      },
    }

    console.log("[AI Intelligence] Script generation completed")
    return script
  },
)

const adaptForPlatformsActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      analysis: UnifiedContentAnalysis
      script?: GeneratedScript
      platforms: PlatformId[]
      aiService: any
    }
  }) => {
    console.log("[AI Intelligence] Starting platform adaptation")
    const { platforms } = input

    // Временная заглушка для адаптации
    const adaptations: AdaptedContent[] = platforms.map((platform) => ({
      platformId: platform,
      title: `Adapted Content for ${platform}`,
      description: `Content optimized for ${platform} platform`,
      hashtags: [`#${platform}`, "#content", "#ai"],
      metadata: {
        duration: 60,
        fileSize: 25,
        format: {
          resolution: "1920x1080",
          fps: 30,
          bitrate: 5000000,
          codec: "h264",
        },
        aspectRatio: {
          ratio: "16:9",
          width: 1920,
          height: 1080,
        },
      },
      optimizations: {
        seo: true,
        accessibility: true,
        engagement: true,
      },
    }))

    console.log("[AI Intelligence] Platform adaptation completed")
    return adaptations
  },
)

// Guards
const hasScriptGenerationEnabled = ({ context }: { context: AIIntelligenceContext }) => {
  return context.config.features?.scriptGeneration || false
}

const hasPlatformAdaptationEnabled = ({ context }: { context: AIIntelligenceContext }) => {
  return context.config.features?.multiPlatform || false
}

// Машина состояний
export const aiIntelligenceMachine = setup({
  types: {} as {
    context: AIIntelligenceContext
    events: AIIntelligenceEvent
  },
  actors: {
    analyzeContentActor,
    generateScriptActor,
    adaptForPlatformsActor,
  },
  actions: {
    initializeContext: assign({
      mediaFiles: ({ event }) => (event.type === "START_ANALYSIS" ? event.mediaFiles : []),
      config: ({ event }) => (event.type === "START_ANALYSIS" ? event.config : ({} as AIConfig)),
      steps: () => [],
      errors: () => [],
      progress: () => 0,
      currentStep: () => "initializing",
    }),

    updateProgress: assign({
      progress: ({ context, event }) => {
        if (event.type === "UPDATE_PROGRESS") {
          return event.progress
        }
        return context.progress
      },
      currentStep: ({ context, event }) => {
        if (event.type === "UPDATE_PROGRESS") {
          return event.step
        }
        return context.currentStep
      },
    }),

    addProcessingStep: assign({
      steps: ({ context }, params: any) => [
        ...context.steps,
        {
          name: params.name,
          status: ProcessingStatus.RUNNING,
          startTime: new Date(),
        },
      ],
    }),

    completeProcessingStep: assign({
      steps: ({ context }, params: { name: string }) => {
        return context.steps.map((step) =>
          step.name === params.name
            ? {
                ...step,
                status: ProcessingStatus.COMPLETED,
                endTime: new Date(),
                duration: Date.now() - step.startTime.getTime(),
              }
            : step,
        )
      },
    }),

    addError: assign({
      errors: ({ context }, params: any) => [
        ...context.errors,
        {
          step: params.step,
          code: params.code || "UNKNOWN_ERROR",
          message: params.message,
          details: params.details,
          timestamp: new Date(),
        },
      ],
    }),

    saveAnalysis: assign({
      analysis: ({ event }) => (event.type === "ANALYSIS_COMPLETE" ? event.analysis : undefined),
    }),

    saveScript: assign({
      script: ({ event }) => (event.type === "SCRIPT_GENERATED" ? event.script : undefined),
    }),

    savePlatformContent: assign({
      platformContent: ({ event }) => (event.type === "PLATFORM_ADAPTATION_COMPLETE" ? event.content : undefined),
    }),

    prepareResult: assign({
      result: ({ context }) => {
        const result: IntelligentContent = {
          id: `intelligent-content-${Date.now()}`,
          projectId: `project-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          analysis: context.analysis!,
          script: context.script,
          moments: context.moments || [],
          classification: context.classification || {
            primary: { category: "unknown", confidence: 0 },
            secondary: [],
            confidence: 0,
            tags: [],
          },
          platformContent: context.platformContent,
          metadata: {
            startTime: context.steps[0]?.startTime || new Date(),
            endTime: new Date(),
            duration: Date.now() - (context.steps[0]?.startTime?.getTime() || Date.now()),
            config: context.config,
            steps: context.steps,
            resources: {
              cpuUsage: 0,
              memoryUsage: 0,
              apiCalls: [],
              cacheHits: 0,
              cacheMisses: 0,
            },
            errors: context.errors.length > 0 ? context.errors : undefined,
          },
        }
        return result
      },
    }),

    emitProgress: emit(({ context }) => ({
      type: "progress.update" as const,
      progress: calculatePipelineProgress(context),
    })),

    emitComplete: emit(({ context }) => ({
      type: "processing.complete" as const,
      result: context.result,
    })),

    emitError: emit(({ context }) => ({
      type: "processing.error" as const,
      errors: context.errors,
    })),

    // Reset action
    resetContext: assign({
      mediaFiles: () => [],
      analysis: () => undefined,
      script: () => undefined,
      platformContent: () => undefined,
      moments: () => undefined,
      classification: () => undefined,
      currentStep: () => "",
      steps: () => [],
      progress: () => 0,
      errors: () => [],
      result: () => undefined,
    }),
  },
  guards: {
    hasScriptGenerationEnabled,
    hasPlatformAdaptationEnabled,
  },
}).createMachine({
  id: "ai-services-intelligence",
  initial: "idle",
  context: {
    config: {} as AIConfig,
    mediaFiles: [],
    currentStep: "",
    steps: [],
    progress: 0,
    errors: [],
  },
  states: {
    idle: {
      on: {
        START_ANALYSIS: {
          target: "analyzing",
          actions: ["initializeContext"],
        },
      },
    },

    analyzing: {
      entry: [{ type: "addProcessingStep", params: { name: "content_analysis" } }, "emitProgress"],
      invoke: {
        id: "analyzeContent",
        src: "analyzeContentActor",
        input: ({ context }) => ({
          mediaFiles: context.mediaFiles,
          config: context.config,
          ffmpegService: getFFmpegService(),
          aiService: getAIService(),
        }),
        onDone: {
          target: "analysisComplete",
          actions: [
            {
              type: "completeProcessingStep",
              params: { name: "content_analysis" },
            },
            assign({
              analysis: ({ event }) => event.output,
            }),
            "emitProgress",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "addError",
              params: ({ event }: any) => ({
                step: "content_analysis",
                code: "ANALYSIS_FAILED",
                message: event.error.message,
                details: event.error,
              }),
            },
            "emitError",
          ],
        },
      },
      on: {
        PAUSE: "paused",
        CANCEL: "cancelled",
      },
    },

    analysisComplete: {
      always: [
        {
          target: "generatingScript",
          guard: "hasScriptGenerationEnabled",
        },
        {
          target: "adaptingForPlatforms",
          guard: "hasPlatformAdaptationEnabled",
        },
        {
          target: "complete",
        },
      ],
    },

    generatingScript: {
      entry: [{ type: "addProcessingStep", params: { name: "script_generation" } }, "emitProgress"],
      invoke: {
        id: "generateScript",
        src: "generateScriptActor",
        input: ({ context }) => ({
          analysis: context.analysis!,
          params:
            context.config.scriptParams ||
            ({
              topic: "Auto-generated content",
              style: {
                format: "video-essay" as const,
                pacing: "moderate" as const,
                structure: "linear" as const,
                narrativeStyle: "third-person" as const,
              },
              duration: 60,
              tone: "professional" as const,
              targetAudience: "General audience",
              language: "en",
              includeHooks: true,
              includeCTA: true,
            } as ScriptGenerationParams),
          aiService: getAIService(),
        }),
        onDone: {
          target: "scriptGenerated",
          actions: [
            {
              type: "completeProcessingStep",
              params: { name: "script_generation" },
            },
            assign({
              script: ({ event }) => event.output,
            }),
            "emitProgress",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "addError",
              params: ({ event }: any) => ({
                step: "script_generation",
                code: "SCRIPT_GENERATION_FAILED",
                message: event.error.message,
                details: event.error,
              }),
            },
            "emitError",
          ],
        },
      },
      on: {
        PAUSE: "paused",
        CANCEL: "cancelled",
      },
    },

    scriptGenerated: {
      always: [
        {
          target: "adaptingForPlatforms",
          guard: "hasPlatformAdaptationEnabled",
        },
        {
          target: "complete",
        },
      ],
    },

    adaptingForPlatforms: {
      entry: [{ type: "addProcessingStep", params: { name: "platform_adaptation" } }, "emitProgress"],
      invoke: {
        id: "adaptForPlatforms",
        src: "adaptForPlatformsActor",
        input: ({ context }) => ({
          analysis: context.analysis!,
          script: context.script,
          platforms: (context.config.platforms || []) as PlatformId[],
          aiService: getAIService(),
        }),
        onDone: {
          target: "complete",
          actions: [
            {
              type: "completeProcessingStep",
              params: { name: "platform_adaptation" },
            },
            assign({
              platformContent: ({ event }) => event.output,
            }),
            "emitProgress",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "addError",
              params: ({ event }: any) => ({
                step: "platform_adaptation",
                code: "PLATFORM_ADAPTATION_FAILED",
                message: event.error.message,
                details: event.error,
              }),
            },
            "emitError",
          ],
        },
      },
      on: {
        PAUSE: "paused",
        CANCEL: "cancelled",
      },
    },

    paused: {
      entry: "emitProgress",
      on: {
        RESUME: [
          {
            target: "analyzing",
            guard: ({ context }) => context.currentStep === "content_analysis",
          },
          {
            target: "generatingScript",
            guard: ({ context }) => context.currentStep === "script_generation",
          },
          {
            target: "adaptingForPlatforms",
            guard: ({ context }) => context.currentStep === "platform_adaptation",
          },
        ],
        CANCEL: "cancelled",
      },
    },

    complete: {
      entry: ["prepareResult", "emitComplete", "emitProgress"],
      type: "final",
    },

    cancelled: {
      entry: [
        {
          type: "addError",
          params: {
            step: "pipeline",
            code: "CANCELLED",
            message: "Processing was cancelled by user",
          },
        },
        "emitError",
      ],
      type: "final",
    },

    error: {
      entry: "emitError",
      type: "final",
    },
  },
  on: {
    RESET: {
      target: ".idle",
      actions: ["resetContext"],
    },
  },
})

/**
 * Тип машины состояний AI Intelligence
 */
export type AIIntelligenceMachine = typeof aiIntelligenceMachine

/**
 * Экспорты типов для обратной совместимости
 */
export type { AIIntelligenceContext, AIIntelligenceEvent } from "../types/ai-intelligence"

// Вспомогательные функции
async function performFFmpegAnalysis(mediaFile: MediaFile, ffmpegService: any) {
  const [metadata, scenes, quality, silence, motion] = await Promise.all([
    ffmpegService.getVideoMetadata(mediaFile.path),
    ffmpegService.detectScenes(mediaFile.path),
    ffmpegService.analyzeQuality(mediaFile.path),
    ffmpegService.detectSilence(mediaFile.path),
    ffmpegService.analyzeMotion(mediaFile.path),
  ])

  return { metadata, scenes, quality, silence, motion }
}

async function performAIAnalysis(_ffmpegResults: any, _mediaFile: MediaFile, _aiService: any) {
  // Временная заглушка - в реальности здесь будет вызов AI
  return {
    scenes: [],
    keyMoments: [],
    contentType: ContentType.NARRATIVE,
    genres: [],
    mood: { primary: Emotion.CALM, intensity: 0.5 },
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      interests: [],
      demographics: { primary: "general" },
    },
    insights: {
      summary: "Analysis completed",
      highlights: [],
      suggestions: [],
      warnings: [],
      opportunities: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      marketingAngles: [],
      targetDemographics: [],
    },
  }
}

function calculatePipelineProgress(context: AIIntelligenceContext) {
  const totalSteps = context.steps.length
  const completedSteps = context.steps.filter((s) => s.status === ProcessingStatus.COMPLETED).length
  const overall = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return {
    overall,
    currentStep: context.currentStep,
    steps: context.steps.map((step) => ({
      name: step.name,
      progress: step.status === ProcessingStatus.COMPLETED ? 100 : step.status === ProcessingStatus.RUNNING ? 50 : 0,
      status: step.status,
    })),
    messages: [],
  }
}

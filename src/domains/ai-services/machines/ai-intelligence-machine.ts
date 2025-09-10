/**
 * AI Intelligence State Machine - AI Services Domain
 * Управление состоянием AI Content Intelligence через XState
 *
 * Перенесено из src/features/ai-content-intelligence/shared/services/ai-intelligence-machine.ts
 */

import { assign, emit, fromPromise, setup } from "xstate"
// Service imports (will be replaced with domain services)
import {
  getAIService,
  getFFmpegService,
} from "@/features/ai-content-intelligence/shared/services/media-analysis-interface"
// Import types from domain
import type {
  AdaptedContent,
  AIConfig,
  AIIntelligenceContext,
  AIIntelligenceEvent,
  ContentInsights,
  GeneratedScript,
  IntelligentContent,
  MediaFile,
  PlatformId,
  ScriptGenerationParams,
  UnifiedContentAnalysis,
} from "../types/ai-intelligence"
import { ContentType, Emotion, NarrativeType, PaceType, ProcessingStatus } from "../types/ai-intelligence"

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
        name: mediaFiles[0].name,
        filename: mediaFiles[0].name,
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
      genre: params.genre || [],
      duration: analysis.technicalSpecs.duration,
      structure: {
        type: params.narrativeStructure || NarrativeType.THREE_ACT,
        acts: [],
        turningPoints: [],
      },
      scenes: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        language: "en",
        tone: params.tone || { primary: Emotion.CALM, intensity: 0.5 },
        pacing: { overall: PaceType.MODERATE, variations: [] },
        style: params.style,
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
      id: `adapted-${platform}-${Date.now()}`,
      platform,
      originalContent: {
        sceneIds: [],
        duration: 60,
      },
      adaptations: {
        video: {
          resolution: { width: 1920, height: 1080, preferred: true },
          aspectRatio: { ratio: "16:9", width: 16, height: 9, preferred: true },
          frameRate: 30,
          codec: "h264",
          bitrate: 5000000,
        },
        audio: {
          volume: [],
          compression: { threshold: -20, ratio: 4, attack: 5, release: 50 },
          normalization: true,
          enhancements: [],
        },
        text: {
          title: { text: "Title", language: "en", characterCount: 5 },
          description: {
            text: "Description",
            language: "en",
            characterCount: 11,
          },
          captions: {
            enabled: false,
            style: {} as any,
            language: "en",
            content: [],
          },
          hashtags: [],
          mentions: [],
        },
        graphics: {
          overlays: [],
        },
        timing: {
          cuts: [],
          speed: [],
        },
      },
      metadata: {
        createdAt: new Date(),
        language: "en",
        tags: [],
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
              style: {
                visual: "cinematic" as any,
                narrative: "standard" as any,
                editing: "continuous" as any,
              },
              genre: [],
              tone: { primary: Emotion.CALM, intensity: 0.5 },
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
          platforms: context.config.platforms || [],
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

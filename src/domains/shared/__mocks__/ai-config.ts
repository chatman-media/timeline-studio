/**
 * Mock AI Configuration for Testing
 */

import type {
  AIConfig,
  AIProviderConfig,
  AccuracyLevel,
  AIProvider,
  AnalysisDepth,
  SpeedPriority,
} from "../types/ai-tools/ai-config"
import { createDefaultAIConfig } from "../utils/config"

/**
 * Create mock AI provider config
 */
export function createMockProviderConfig(overrides?: Partial<AIProviderConfig>): AIProviderConfig {
  return {
    provider: AIProvider.LOCAL,
    model: "test-model",
    maxTokens: 1000,
    temperature: 0.7,
    stream: false,
    ...overrides,
  }
}

/**
 * Create mock AI config for testing
 */
export function createMockAIConfig(overrides?: Partial<AIConfig>): AIConfig {
  return createDefaultAIConfig(overrides)
}

/**
 * Preset AI configs for common test scenarios
 */

export const mockAIConfigs = {
  /**
   * Minimal config for fast tests
   */
  minimal: createMockAIConfig({
    providers: [
      createMockProviderConfig({
        provider: AIProvider.LOCAL,
        model: "test-model",
        maxTokens: 100,
      }),
    ],
    defaultProvider: AIProvider.LOCAL,
    features: {
      sceneAnalysis: true,
      scriptGeneration: false,
      multiPlatform: false,
      contentClassification: false,
      qualityEnhancement: false,
      autoSuggestions: false,
    },
    processing: {
      parallel: false,
      maxConcurrent: 1,
      batchSize: 1,
      cacheResults: false,
      cacheDuration: 0,
      retryAttempts: 0,
      timeout: 10,
    },
  }),

  /**
   * Config with all features enabled
   */
  fullFeatures: createMockAIConfig({
    features: {
      sceneAnalysis: true,
      scriptGeneration: true,
      multiPlatform: true,
      personIdentification: true,
      contentClassification: true,
      qualityEnhancement: true,
      autoSuggestions: true,
    },
  }),

  /**
   * High performance config
   */
  highPerformance: createMockAIConfig({
    processing: {
      parallel: true,
      maxConcurrent: 16,
      batchSize: 50,
      cacheResults: true,
      cacheDuration: 48,
      retryAttempts: 5,
      timeout: 600,
    },
    quality: {
      analysisDepth: "comprehensive" as AnalysisDepth,
      accuracy: "maximum" as AccuracyLevel,
      speed: "quality" as SpeedPriority,
      resourceUsage: {
        maxCPU: 100,
        maxRAM: 16384,
        maxGPU: 100,
        maxDiskSpace: 51200,
      },
    },
  }),

  /**
   * Low resource config
   */
  lowResource: createMockAIConfig({
    processing: {
      parallel: false,
      maxConcurrent: 1,
      batchSize: 5,
      cacheResults: true,
      cacheDuration: 12,
      retryAttempts: 1,
      timeout: 60,
    },
    quality: {
      analysisDepth: "basic" as AnalysisDepth,
      accuracy: "fast" as AccuracyLevel,
      speed: "realtime" as SpeedPriority,
      resourceUsage: {
        maxCPU: 30,
        maxRAM: 1024,
        maxDiskSpace: 2048,
      },
    },
  }),

  /**
   * OpenAI config
   */
  openai: createMockAIConfig({
    providers: [
      createMockProviderConfig({
        provider: AIProvider.OPENAI,
        apiKey: "test-openai-key",
        model: "gpt-4",
        maxTokens: 4096,
        temperature: 0.7,
      }),
    ],
    defaultProvider: AIProvider.OPENAI,
  }),

  /**
   * Anthropic (Claude) config
   */
  anthropic: createMockAIConfig({
    providers: [
      createMockProviderConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: "test-claude-key",
        model: "claude-3-opus",
        maxTokens: 8192,
        temperature: 0.5,
      }),
    ],
    defaultProvider: AIProvider.ANTHROPIC,
  }),

  /**
   * DeepSeek config
   */
  deepseek: createMockAIConfig({
    providers: [
      createMockProviderConfig({
        provider: AIProvider.DEEPSEEK,
        apiKey: "test-deepseek-key",
        model: "deepseek-coder",
        maxTokens: 2048,
        temperature: 0.3,
      }),
    ],
    defaultProvider: AIProvider.DEEPSEEK,
  }),

  /**
   * Ollama config
   */
  ollama: createMockAIConfig({
    providers: [
      createMockProviderConfig({
        provider: AIProvider.OLLAMA,
        model: "llama3.2",
        endpoint: "http://localhost:11434",
        maxTokens: 2048,
        temperature: 0.7,
      }),
    ],
    defaultProvider: AIProvider.OLLAMA,
  }),

  /**
   * Multi-provider config
   */
  multiProvider: createMockAIConfig({
    providers: [
      createMockProviderConfig({
        provider: AIProvider.OPENAI,
        apiKey: "test-openai-key",
        model: "gpt-4",
      }),
      createMockProviderConfig({
        provider: AIProvider.ANTHROPIC,
        apiKey: "test-claude-key",
        model: "claude-3-opus",
      }),
      createMockProviderConfig({
        provider: AIProvider.OLLAMA,
        model: "llama3.2",
      }),
    ],
    defaultProvider: AIProvider.OPENAI,
  }),

  /**
   * Multi-platform config
   */
  multiPlatform: createMockAIConfig({
    features: {
      sceneAnalysis: true,
      scriptGeneration: true,
      multiPlatform: true,
      contentClassification: true,
      qualityEnhancement: true,
      autoSuggestions: true,
    },
    platforms: ["youtube", "instagram", "tiktok", "facebook"],
  }),

  /**
   * Multilingual config
   */
  multilingual: createMockAIConfig({
    languages: {
      source: "en",
      targets: ["ru", "es", "fr", "de", "zh", "ja", "ko"],
      autoDetect: true,
      preserveOriginal: true,
    },
  }),
}

/**
 * Mock analysis results
 */
export const mockAnalysisResults = {
  sceneAnalysis: {
    scenes: [
      {
        id: "scene-1",
        startTime: 0,
        endTime: 5,
        description: "Opening scene",
        quality: 0.8,
        tags: ["intro", "establishing-shot"],
      },
      {
        id: "scene-2",
        startTime: 5,
        endTime: 15,
        description: "Main content",
        quality: 0.9,
        tags: ["action", "dialogue"],
      },
    ],
  },

  contentClassification: {
    category: "educational",
    topics: ["technology", "programming", "ai"],
    sentiment: "positive",
    ageRating: "general",
    confidence: 0.85,
  },

  qualityMetrics: {
    overall: 0.8,
    video: {
      resolution: 1080,
      fps: 30,
      bitrate: 5000,
      stability: 0.9,
      exposure: 0.85,
    },
    audio: {
      clarity: 0.9,
      volume: 0.8,
      noise: 0.1,
    },
  },
}

/**
 * Mock script generation results
 */
export const mockScriptResults = {
  simple: {
    title: "Test Video Script",
    description: "A test video about testing",
    scenes: [
      {
        id: 1,
        description: "Introduction",
        dialogue: "Welcome to our test video",
        duration: 5,
      },
      {
        id: 2,
        description: "Main content",
        dialogue: "Here's what we'll cover today",
        duration: 10,
      },
    ],
    metadata: {
      totalDuration: 15,
      sceneCount: 2,
      wordCount: 50,
    },
  },

  detailed: {
    title: "Comprehensive Test Script",
    description: "A detailed test script with all elements",
    hook: "Ever wondered how to create perfect videos?",
    intro: {
      description: "Opening hook and introduction",
      duration: 10,
      visualSuggestions: ["Logo animation", "Title card"],
    },
    mainContent: [
      {
        section: "Problem",
        description: "Identify the pain point",
        duration: 15,
        keyPoints: ["Point 1", "Point 2"],
      },
      {
        section: "Solution",
        description: "Present the solution",
        duration: 20,
        keyPoints: ["Feature 1", "Feature 2", "Feature 3"],
      },
    ],
    conclusion: {
      description: "Summary and call to action",
      duration: 10,
      cta: "Subscribe for more content!",
    },
    metadata: {
      totalDuration: 55,
      sectionCount: 4,
      wordCount: 500,
    },
  },
}

/**
 * Mock platform adaptation results
 */
export const mockPlatformAdaptations = {
  youtube: {
    platformId: "youtube" as const,
    title: "How to Create Amazing Videos | Complete Guide",
    description: "Learn everything about video creation in this comprehensive tutorial...",
    tags: ["video editing", "tutorial", "how to"],
    thumbnail: {
      recommended: true,
      dimensions: { width: 1280, height: 720 },
      elements: ["title", "face", "contrast"],
    },
    duration: {
      optimal: 600, // 10 minutes
      minimum: 480,
      maximum: 900,
    },
  },

  instagram: {
    platformId: "instagram" as const,
    title: "Video Creation Tips ✨",
    description: "Quick tips for amazing videos 🎥\n\n#videoediting #tutorial #tips",
    hashtags: ["videoediting", "tutorial", "tips", "creator", "content"],
    aspectRatio: "9:16",
    duration: {
      optimal: 60,
      minimum: 15,
      maximum: 90,
    },
  },

  tiktok: {
    platformId: "tiktok" as const,
    title: "Video Editing Hack! 🔥",
    description: "This will change your editing game forever! #videoediting #hack",
    hashtags: ["videoediting", "hack", "tutorial", "fyp", "viral"],
    sounds: ["trending-sound-1"],
    duration: {
      optimal: 30,
      minimum: 15,
      maximum: 60,
    },
  },
}

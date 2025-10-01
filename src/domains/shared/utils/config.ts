import { AIConfig } from "@/domains/ai-services/types"
import { AccuracyLevel, AIProvider, AnalysisDepth, SpeedPriority } from "../types/ai-tools/ai-config"

export function createDefaultAIConfig(overrides?: Partial<AIConfig>): AIConfig {
  const defaultConfig: AIConfig = {
    providers: [
      {
        provider: AIProvider.OLLAMA, // Используем Ollama по умолчанию для альфа-релиза
        model: "llama3.2", // Быстрая модель для альфы
        maxTokens: 2048, // Уменьшено для скорости
        temperature: 0.7,
        stream: false,
      },
      {
        provider: AIProvider.LOCAL,
        model: "default",
        maxTokens: 4096,
        temperature: 0.7,
        stream: false,
      },
    ],
    defaultProvider: AIProvider.OLLAMA, // Ollama по умолчанию
    features: {
      sceneAnalysis: true,
      scriptGeneration: false,
      multiPlatform: false,
      contentClassification: true,
      qualityEnhancement: true,
      autoSuggestions: true,
    },
    processing: {
      parallel: true,
      maxConcurrent: 4,
      batchSize: 10,
      cacheResults: true,
      cacheDuration: 24, // hours
      retryAttempts: 3,
      timeout: 300, // seconds
    },
    quality: {
      analysisDepth: AnalysisDepth.STANDARD,
      accuracy: AccuracyLevel.BALANCED,
      speed: SpeedPriority.NORMAL,
      resourceUsage: {
        maxCPU: 80,
        maxRAM: 4096,
        maxDiskSpace: 10240,
      },
    },
    platforms: [],
    languages: {
      source: "ru",
      targets: ["en"],
      autoDetect: true,
      preserveOriginal: true,
    },
  }

  if (overrides) {
    return {
      ...defaultConfig,
      ...overrides,
      providers: overrides.providers || defaultConfig.providers,
      features: { ...defaultConfig.features, ...overrides.features },
      processing: { ...defaultConfig.processing, ...overrides.processing },
      quality: { ...defaultConfig.quality, ...overrides.quality },
      languages: overrides.languages ? { ...defaultConfig.languages, ...overrides.languages } : defaultConfig.languages,
    }
  }

  return defaultConfig
}

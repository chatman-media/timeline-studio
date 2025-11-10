/**
 * AI Config Utility Tests
 */

import { describe, expect, it } from "vitest"
import { AccuracyLevel, AIProvider, AnalysisDepth, SpeedPriority } from "../../types/ai-tools/ai-config"
import { PlatformId } from "../../types/ai-tools/platform-adaptation"
import { createDefaultAIConfig } from "../config"

describe("createDefaultAIConfig", () => {
  describe("Default Configuration", () => {
    it("should create default AI config without overrides", () => {
      const config = createDefaultAIConfig()

      expect(config).toBeDefined()
      expect(config.providers).toBeDefined()
      expect(config.defaultProvider).toBe(AIProvider.OLLAMA)
    })

    it("should have correct default providers", () => {
      const config = createDefaultAIConfig()

      expect(config.providers).toHaveLength(2)

      // Ollama provider
      expect(config.providers[0]).toEqual({
        provider: AIProvider.OLLAMA,
        model: "llama3.2",
        maxTokens: 2048,
        temperature: 0.7,
        stream: false,
      })

      // Local provider
      expect(config.providers[1]).toEqual({
        provider: AIProvider.LOCAL,
        model: "default",
        maxTokens: 4096,
        temperature: 0.7,
        stream: false,
      })
    })

    it("should have correct default features", () => {
      const config = createDefaultAIConfig()

      expect(config.features).toEqual({
        sceneAnalysis: true,
        scriptGeneration: false,
        multiPlatform: false,
        contentClassification: true,
        qualityEnhancement: true,
        autoSuggestions: true,
      })
    })

    it("should have correct default processing config", () => {
      const config = createDefaultAIConfig()

      expect(config.processing).toEqual({
        parallel: true,
        maxConcurrent: 4,
        batchSize: 10,
        cacheResults: true,
        cacheDuration: 24,
        retryAttempts: 3,
        timeout: 300,
      })
    })

    it("should have correct default quality config", () => {
      const config = createDefaultAIConfig()

      expect(config.quality).toEqual({
        analysisDepth: AnalysisDepth.STANDARD,
        accuracy: AccuracyLevel.BALANCED,
        speed: SpeedPriority.NORMAL,
        resourceUsage: {
          maxCPU: 80,
          maxRAM: 4096,
          maxDiskSpace: 10240,
        },
      })
    })

    it("should have correct default language config", () => {
      const config = createDefaultAIConfig()

      expect(config.languages).toEqual({
        source: "ru",
        targets: ["en"],
        autoDetect: true,
        preserveOriginal: true,
      })
    })

    it("should have empty platforms array", () => {
      const config = createDefaultAIConfig()

      expect(config.platforms).toEqual([])
    })
  })

  describe("Override Configuration", () => {
    it("should override default provider", () => {
      const config = createDefaultAIConfig({
        defaultProvider: AIProvider.OPENAI,
      })

      expect(config.defaultProvider).toBe(AIProvider.OPENAI)
    })

    it("should override providers array", () => {
      const customProviders = [
        {
          provider: AIProvider.ANTHROPIC,
          model: "claude-3",
          maxTokens: 8192,
          temperature: 0.5,
          stream: true,
        },
      ]

      const config = createDefaultAIConfig({
        providers: customProviders,
      })

      expect(config.providers).toEqual(customProviders)
      expect(config.providers).toHaveLength(1)
    })

    it("should merge features with defaults", () => {
      const config = createDefaultAIConfig({
        features: {
          scriptGeneration: true,
          multiPlatform: true,
        } as any,
      })

      expect(config.features).toEqual({
        sceneAnalysis: true, // default
        scriptGeneration: true, // overridden
        multiPlatform: true, // overridden
        contentClassification: true, // default
        qualityEnhancement: true, // default
        autoSuggestions: true, // default
      })
    })

    it("should merge processing config with defaults", () => {
      const config = createDefaultAIConfig({
        processing: {
          maxConcurrent: 8,
          timeout: 600,
        } as any,
      })

      expect(config.processing).toEqual({
        parallel: true, // default
        maxConcurrent: 8, // overridden
        batchSize: 10, // default
        cacheResults: true, // default
        cacheDuration: 24, // default
        retryAttempts: 3, // default
        timeout: 600, // overridden
      })
    })

    it("should merge quality config with defaults", () => {
      const config = createDefaultAIConfig({
        quality: {
          analysisDepth: AnalysisDepth.DETAILED,
          accuracy: AccuracyLevel.ACCURATE,
        } as any,
      })

      expect(config.quality.analysisDepth).toBe(AnalysisDepth.DETAILED)
      expect(config.quality.accuracy).toBe(AccuracyLevel.ACCURATE)
      expect(config.quality.speed).toBe(SpeedPriority.NORMAL) // default
      expect(config.quality.resourceUsage).toEqual({
        maxCPU: 80,
        maxRAM: 4096,
        maxDiskSpace: 10240,
      })
    })

    it("should override languages config", () => {
      const customLanguages = {
        source: "en",
        targets: ["ru", "es", "fr"],
        autoDetect: false,
        preserveOriginal: false,
      }

      const config = createDefaultAIConfig({
        languages: customLanguages,
      })

      expect(config.languages).toEqual(customLanguages)
    })

    it("should preserve default languages when not overridden", () => {
      const config = createDefaultAIConfig({
        defaultProvider: AIProvider.OPENAI,
      })

      expect(config.languages).toEqual({
        source: "ru",
        targets: ["en"],
        autoDetect: true,
        preserveOriginal: true,
      })
    })

    it("should override platforms", () => {
      const config = createDefaultAIConfig({
        platforms: [PlatformId.YOUTUBE, PlatformId.INSTAGRAM_FEED, PlatformId.TIKTOK],
      })

      expect(config.platforms).toEqual([PlatformId.YOUTUBE, PlatformId.INSTAGRAM_FEED, PlatformId.TIKTOK])
    })
  })

  describe("Complex Override Scenarios", () => {
    it("should handle multiple overrides correctly", () => {
      const config = createDefaultAIConfig({
        defaultProvider: AIProvider.DEEPSEEK,
        features: {
          scriptGeneration: true,
          multiPlatform: true,
          personIdentification: true,
        } as any,
        processing: {
          maxConcurrent: 8,
          batchSize: 20,
        } as any,
        quality: {
          analysisDepth: AnalysisDepth.COMPREHENSIVE,
        } as any,
      })

      expect(config.defaultProvider).toBe(AIProvider.DEEPSEEK)
      expect(config.features.scriptGeneration).toBe(true)
      expect(config.features.multiPlatform).toBe(true)
      expect(config.features.personIdentification).toBe(true)
      expect(config.processing.maxConcurrent).toBe(8)
      expect(config.processing.batchSize).toBe(20)
      expect(config.quality.analysisDepth).toBe(AnalysisDepth.COMPREHENSIVE)
    })

    it("should preserve nested defaults when overriding parent", () => {
      const config = createDefaultAIConfig({
        quality: {
          analysisDepth: AnalysisDepth.BASIC,
        } as any,
      })

      // Resource usage should remain default
      expect(config.quality.resourceUsage).toEqual({
        maxCPU: 80,
        maxRAM: 4096,
        maxDiskSpace: 10240,
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty overrides object", () => {
      const config = createDefaultAIConfig({})

      expect(config.defaultProvider).toBe(AIProvider.OLLAMA)
      expect(config.features).toBeDefined()
      expect(config.processing).toBeDefined()
    })

    it("should handle partial provider override", () => {
      const config = createDefaultAIConfig({
        providers: [
          {
            provider: AIProvider.OPENAI,
            model: "gpt-4",
          } as any,
        ],
      })

      expect(config.providers).toHaveLength(1)
      expect(config.providers[0].provider).toBe(AIProvider.OPENAI)
      expect(config.providers[0].model).toBe("gpt-4")
    })

    it("should handle partial language override", () => {
      const config = createDefaultAIConfig({
        languages: {
          source: "en",
        } as any,
      })

      // Should still have the overridden value
      expect(config.languages?.source).toBe("en")
    })

    it("should handle null-like values in overrides", () => {
      const config = createDefaultAIConfig({
        platforms: undefined,
      })

      // When undefined is passed, it overrides to undefined (not default)
      // This is the actual behavior of the current implementation
      expect(config.platforms).toBeUndefined()
    })
  })

  describe("Type Safety Verification", () => {
    it("should accept all valid AI providers", () => {
      const providers = [
        AIProvider.OPENAI,
        AIProvider.ANTHROPIC,
        AIProvider.DEEPSEEK,
        AIProvider.OLLAMA,
        AIProvider.LOCAL,
      ]

      providers.forEach((provider) => {
        const config = createDefaultAIConfig({
          defaultProvider: provider,
        })

        expect(config.defaultProvider).toBe(provider)
      })
    })

    it("should accept all valid analysis depths", () => {
      const depths = [AnalysisDepth.BASIC, AnalysisDepth.STANDARD, AnalysisDepth.DETAILED, AnalysisDepth.COMPREHENSIVE]

      depths.forEach((depth) => {
        const config = createDefaultAIConfig({
          quality: {
            analysisDepth: depth,
          } as any,
        })

        expect(config.quality.analysisDepth).toBe(depth)
      })
    })

    it("should accept all valid accuracy levels", () => {
      const levels = [AccuracyLevel.FAST, AccuracyLevel.BALANCED, AccuracyLevel.ACCURATE, AccuracyLevel.MAXIMUM]

      levels.forEach((level) => {
        const config = createDefaultAIConfig({
          quality: {
            accuracy: level,
          } as any,
        })

        expect(config.quality.accuracy).toBe(level)
      })
    })

    it("should accept all valid speed priorities", () => {
      const priorities = [SpeedPriority.REALTIME, SpeedPriority.FAST, SpeedPriority.NORMAL, SpeedPriority.QUALITY]

      priorities.forEach((priority) => {
        const config = createDefaultAIConfig({
          quality: {
            speed: priority,
          } as any,
        })

        expect(config.quality.speed).toBe(priority)
      })
    })
  })

  describe("Alpha Release Configuration", () => {
    it("should use Ollama as default for alpha release", () => {
      const config = createDefaultAIConfig()

      expect(config.defaultProvider).toBe(AIProvider.OLLAMA)
      expect(config.providers[0].provider).toBe(AIProvider.OLLAMA)
    })

    it("should use fast model for alpha (llama3.2)", () => {
      const config = createDefaultAIConfig()

      expect(config.providers[0].model).toBe("llama3.2")
    })

    it("should have reduced max tokens for alpha (2048)", () => {
      const config = createDefaultAIConfig()

      expect(config.providers[0].maxTokens).toBe(2048)
    })

    it("should disable expensive features for alpha", () => {
      const config = createDefaultAIConfig()

      expect(config.features.scriptGeneration).toBe(false)
      expect(config.features.multiPlatform).toBe(false)
    })

    it("should use standard quality settings for alpha", () => {
      const config = createDefaultAIConfig()

      expect(config.quality.analysisDepth).toBe(AnalysisDepth.STANDARD)
      expect(config.quality.accuracy).toBe(AccuracyLevel.BALANCED)
      expect(config.quality.speed).toBe(SpeedPriority.NORMAL)
    })
  })

  describe("Resource Limits", () => {
    it("should have reasonable default resource limits", () => {
      const config = createDefaultAIConfig()

      expect(config.quality.resourceUsage.maxCPU).toBe(80) // 80%
      expect(config.quality.resourceUsage.maxRAM).toBe(4096) // 4GB
      expect(config.quality.resourceUsage.maxDiskSpace).toBe(10240) // 10GB
    })

    it("should allow overriding resource limits", () => {
      const config = createDefaultAIConfig({
        quality: {
          resourceUsage: {
            maxCPU: 50,
            maxRAM: 2048,
            maxGPU: 70,
            maxDiskSpace: 5120,
          },
        } as any,
      })

      expect(config.quality.resourceUsage.maxCPU).toBe(50)
      expect(config.quality.resourceUsage.maxRAM).toBe(2048)
      expect(config.quality.resourceUsage.maxGPU).toBe(70)
      expect(config.quality.resourceUsage.maxDiskSpace).toBe(5120)
    })
  })

  describe("Caching Configuration", () => {
    it("should enable caching by default", () => {
      const config = createDefaultAIConfig()

      expect(config.processing.cacheResults).toBe(true)
      expect(config.processing.cacheDuration).toBe(24) // 24 hours
    })

    it("should allow disabling cache", () => {
      const config = createDefaultAIConfig({
        processing: {
          cacheResults: false,
        } as any,
      })

      expect(config.processing.cacheResults).toBe(false)
    })

    it("should allow custom cache duration", () => {
      const config = createDefaultAIConfig({
        processing: {
          cacheDuration: 48,
        } as any,
      })

      expect(config.processing.cacheDuration).toBe(48)
    })
  })
})

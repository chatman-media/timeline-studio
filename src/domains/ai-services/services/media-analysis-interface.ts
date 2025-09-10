/**
 * Media Analysis Interface
 * Provides abstraction layer for AI and FFmpeg services
 * Migrated from features/ai-content-intelligence/shared/services/media-analysis-interface.ts
 */

import { getAIContainer } from "@/domains/ai-core"
import { IContentAnalysisService, IFFmpegAnalysisService, IVisionService } from "../types/interfaces"

let ffmpegService: IFFmpegAnalysisService | null = null
let visionService: IVisionService | null = null
let contentAnalysisService: IContentAnalysisService | null = null
let aiService: any = null

/**
 * Get FFmpeg analysis service
 */
export async function getFFmpegService(): Promise<IFFmpegAnalysisService> {
  if (!ffmpegService) {
    const aiContainer = getAIContainer()
    ffmpegService = await aiContainer.resolve<IFFmpegAnalysisService>("FFmpegService")
  }
  return ffmpegService
}

/**
 * Get Vision service for scene analysis
 */
export async function getVisionService(): Promise<IVisionService> {
  if (!visionService) {
    const aiContainer = getAIContainer()
    visionService = await aiContainer.resolve<IVisionService>("VisionService")
  }
  return visionService
}

/**
 * Get Content Analysis service
 */
export async function getContentAnalysisService(): Promise<IContentAnalysisService> {
  if (!contentAnalysisService) {
    const aiContainer = getAIContainer()
    contentAnalysisService = await aiContainer.resolve<IContentAnalysisService>("ContentAnalysisService")
  }
  return contentAnalysisService
}

/**
 * Get AI service for content generation
 */
export async function getAIService(): Promise<any> {
  if (!aiService) {
    const aiContainer = getAIContainer()
    try {
      aiService = await aiContainer.resolve("UnifiedAIService")
    } catch (error) {
      // Fallback to mock service for development
      aiService = {
        generateScript: async () => ({ text: "Generated script", scenes: [] }),
        adaptForPlatform: async () => ({ adaptedContent: [] }),
      }
    }
  }
  return aiService
}

/**
 * Reset all services (for testing)
 */
export function resetServices(): void {
  ffmpegService = null
  visionService = null
  contentAnalysisService = null
  aiService = null
}

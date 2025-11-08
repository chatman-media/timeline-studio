/**
 * Media Analysis Interface
 * Provides abstraction layer for AI and FFmpeg services
 * Migrated from features/ai-content-intelligence/shared/services/media-analysis-interface.ts
 */

// REMOVED: import { null as any /* getAIContainer from deleted ai-core */ } from "@/domains/ai-core" // ai-core module deleted - use backend AI proxy instead
import { IContentAnalysisService, IFFmpegAnalysisService, IVisionService } from "../types/interfaces"

let ffmpegService: IFFmpegAnalysisService | null = null
let visionService: IVisionService | null = null
let contentAnalysisService: IContentAnalysisService | null = null
let aiService: any = null

/**
 * Get FFmpeg analysis service
 * DEPRECATED: ai-core module deleted - use backend AI proxy instead
 */
export async function getFFmpegService(): Promise<IFFmpegAnalysisService> {
  throw new Error("getFFmpegService is deprecated - ai-core module deleted, use backend AI proxy instead")
}

/**
 * Get Vision service for scene analysis
 * DEPRECATED: ai-core module deleted - use backend AI proxy instead
 */
export async function getVisionService(): Promise<IVisionService> {
  throw new Error("getVisionService is deprecated - ai-core module deleted, use backend AI proxy instead")
}

/**
 * Get Content Analysis service
 * DEPRECATED: ai-core module deleted - use backend AI proxy instead
 */
export async function getContentAnalysisService(): Promise<IContentAnalysisService> {
  throw new Error("getContentAnalysisService is deprecated - ai-core module deleted, use backend AI proxy instead")
}

/**
 * Get AI service for content generation
 * DEPRECATED: ai-core module deleted - use backend AI proxy instead
 */
export async function getAIService(): Promise<any> {
  throw new Error("getAIService is deprecated - ai-core module deleted, use backend AI proxy instead")
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

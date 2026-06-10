import type { IEnhancedSubtitleAutomationService } from "@timeline-studio/core/ports"
import type {
  EnhancedSubtitleExecutionOptions,
  EnhancedSubtitleInput,
  EnhancedSubtitleResult,
  EnhancedSubtitleToolResult,
} from "@timeline-studio/core/types/enhanced-subtitle"
import {
  autoGenerateSubtitlesFromVideo,
  enhancedSubtitleAutomation,
  extractSubtitlesFromScreenText,
  generateMultilingualSubtitles,
} from "@/domains/ai-tools/tools/automation/enhanced-subtitle-automation"

export class TauriEnhancedSubtitleAutomationService implements IEnhancedSubtitleAutomationService {
  async processEnhancedSubtitles(
    input: EnhancedSubtitleInput,
    options?: EnhancedSubtitleExecutionOptions,
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return enhancedSubtitleAutomation.processEnhancedSubtitles(input, options)
  }

  async autoGenerateSubtitlesFromVideo(
    clipId: string,
    options?: { language?: string },
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return autoGenerateSubtitlesFromVideo(clipId, options)
  }

  async extractSubtitlesFromScreenText(
    clipId: string,
    language?: string,
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return extractSubtitlesFromScreenText(clipId, language)
  }

  async generateMultilingualSubtitles(
    clipId: string,
    languages: string[],
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return generateMultilingualSubtitles(clipId, languages)
  }
}

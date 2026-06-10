import type {
  EnhancedSubtitleExecutionOptions,
  EnhancedSubtitleInput,
  EnhancedSubtitleResult,
  EnhancedSubtitleToolResult,
} from "../types/enhanced-subtitle"

export interface IEnhancedSubtitleAutomationService {
  processEnhancedSubtitles(
    input: EnhancedSubtitleInput,
    options?: EnhancedSubtitleExecutionOptions,
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>>
  autoGenerateSubtitlesFromVideo(
    clipId: string,
    options?: { language?: string },
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>>
  extractSubtitlesFromScreenText(
    clipId: string,
    language?: string,
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>>
  generateMultilingualSubtitles(
    clipId: string,
    languages: string[],
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>>
}

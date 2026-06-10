import type { IEnhancedSubtitleAutomationService } from "@timeline-studio/core/ports"
import type {
  EnhancedSubtitleExecutionOptions,
  EnhancedSubtitleInput,
  EnhancedSubtitleResult,
  EnhancedSubtitleToolResult,
  SubtitleItem,
} from "@timeline-studio/core/types/enhanced-subtitle"

export class MockEnhancedSubtitleAutomationAdapter implements IEnhancedSubtitleAutomationService {
  async processEnhancedSubtitles(
    input: EnhancedSubtitleInput,
    _options?: EnhancedSubtitleExecutionOptions,
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return this.createResult(this.createEnhancedSubtitleResult(input), "enhanced-subtitle-automation")
  }

  async autoGenerateSubtitlesFromVideo(
    clipId: string,
    options?: { language?: string },
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return this.processEnhancedSubtitles(
      {
        operation: "auto_generate_from_video",
        clipId,
        language: options?.language,
        useSpeechRecognition: true,
        useOCR: true,
        useSceneAnalysis: true,
      },
      {},
    )
  }

  async extractSubtitlesFromScreenText(
    clipId: string,
    language?: string,
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return this.processEnhancedSubtitles(
      {
        operation: "extract_from_visual_text",
        clipId,
        language,
        useSpeechRecognition: false,
        useOCR: true,
        useSceneAnalysis: false,
      },
      {},
    )
  }

  async generateMultilingualSubtitles(
    clipId: string,
    languages: string[],
  ): Promise<EnhancedSubtitleToolResult<EnhancedSubtitleResult>> {
    return this.processEnhancedSubtitles(
      {
        operation: "multilingual_detection",
        clipId,
        outputLanguages: languages,
      },
      {},
    )
  }

  private createEnhancedSubtitleResult(input: EnhancedSubtitleInput): EnhancedSubtitleResult {
    const subtitle: SubtitleItem = {
      id: "mock-1",
      text: "Mock enhanced subtitle",
      startTime: 0,
      endTime: 3000,
      speaker: input.includeSpeakerLabels ? "Speaker 1" : undefined,
    }

    return {
      operation: input.operation,
      success: true,
      subtitles: [subtitle],
      sources: {
        fromSpeech: input.useSpeechRecognition === false ? [] : [subtitle],
        fromOCR: input.useOCR ? [subtitle] : [],
        fromSceneAnalysis: input.useSceneAnalysis ? [subtitle] : [],
        combined: [subtitle],
      },
      quality: {
        overallConfidence: 0.9,
        speechRecognitionAccuracy: input.useSpeechRecognition === false ? undefined : 0.92,
        ocrAccuracy: input.useOCR ? 0.85 : undefined,
        languageDetectionAccuracy: 0.95,
      },
      processing: {
        detectedLanguages: input.outputLanguages?.length ? input.outputLanguages : [input.language || "en"],
        identifiedSpeakers: input.includeSpeakerLabels ? 1 : 0,
        processedScenes: input.useSceneAnalysis ? 1 : 0,
        ocrTextBlocks: input.useOCR ? 1 : 0,
        totalProcessingTime: 0,
      },
      recommendations: [],
    }
  }

  private createResult(
    data: EnhancedSubtitleResult,
    toolName: string,
  ): EnhancedSubtitleToolResult<EnhancedSubtitleResult> {
    return {
      success: true,
      data,
      executionTime: data.processing.totalProcessingTime,
      toolName,
      executionId: `${toolName}_${Date.now()}_mock`,
    }
  }
}

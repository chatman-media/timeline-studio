import type { ITranscriptionService } from "@/core/ports"
import type {
  ModelInfo,
  SubtitleFormat,
  TranscriptionLanguage,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  WhisperIntegrationOptions,
} from "@/core/types/transcription"

export class MockTranscriptionAdapter implements ITranscriptionService {
  private readonly models: ModelInfo[] = [
    { name: "tiny", size: "39M", isDownloaded: false },
    { name: "base", size: "74M", isDownloaded: true },
    { name: "small", size: "244M", isDownloaded: false },
  ]

  async transcribeMedia(
    _mediaPath: string,
    _options: TranscriptionOptions,
    onProgress?: (progress: TranscriptionProgress) => void,
  ): Promise<TranscriptionResult> {
    onProgress?.({ status: "processing", progress: 50 })
    onProgress?.({ status: "completed", progress: 100 })
    return {
      segments: [{ id: 0, start: 0, end: 5, text: "Mock transcription", confidence: 0.9 }],
      language: "en",
      languageProbability: 0.95,
      duration: 5,
      text: "Mock transcription",
      processingTime: 0,
    }
  }

  async recognizeSpeech(_mediaPath: string, _options?: WhisperIntegrationOptions): Promise<unknown[]> {
    return []
  }

  async generateSubtitles(transcription: TranscriptionResult, format: SubtitleFormat): Promise<string> {
    if (format === "vtt") {
      return `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\n${transcription.text}\n`
    }
    return `1\n00:00:00,000 --> 00:00:05,000\n${transcription.text}\n`
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    return this.models
  }

  async downloadModel(_modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    onProgress?.(100)
    return true
  }

  getSupportedLanguages(): TranscriptionLanguage[] {
    return [
      { code: "auto", name: "Auto-detect" },
      { code: "en", name: "English" },
      { code: "ru", name: "Russian" },
    ]
  }

  recommendModel(): string {
    return "base"
  }
}

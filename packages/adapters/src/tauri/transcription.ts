import type { ITranscriptionService } from "@timeline-studio/core/ports"
import type {
  ModelInfo,
  SubtitleFormat,
  TranscriptionLanguage,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  WhisperIntegrationOptions,
} from "@timeline-studio/core/types/transcription"
import { TranscriptionService } from "@timeline-studio/domains/ai-services/services/transcription-service"

export class TauriTranscriptionService implements ITranscriptionService {
  private readonly service = TranscriptionService.getInstance()

  async transcribeMedia(
    mediaPath: string,
    options: TranscriptionOptions,
    onProgress?: (progress: TranscriptionProgress) => void,
  ): Promise<TranscriptionResult> {
    return this.service.transcribeMedia(mediaPath, options, onProgress)
  }

  async recognizeSpeech(mediaPath: string, options?: WhisperIntegrationOptions): Promise<unknown[]> {
    return this.service.recognizeSpeech(mediaPath, options)
  }

  async generateSubtitles(transcription: TranscriptionResult, format: SubtitleFormat): Promise<string> {
    return this.service.generateSubtitles(transcription, format)
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    return this.service.getAvailableModels()
  }

  async downloadModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    return this.service.downloadModel(modelName, onProgress)
  }

  getSupportedLanguages(): TranscriptionLanguage[] {
    return this.service.getSupportedLanguages()
  }

  recommendModel(durationSeconds: number, useLocal = true): string {
    return this.service.recommendModel(durationSeconds, useLocal)
  }
}

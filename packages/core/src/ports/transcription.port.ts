import type {
  ModelInfo,
  SubtitleFormat,
  TranscriptionLanguage,
  TranscriptionOptions,
  TranscriptionProgress,
  TranscriptionResult,
  WhisperIntegrationOptions,
} from "../types/transcription"

export interface ITranscriptionService {
  transcribeMedia(
    mediaPath: string,
    options: TranscriptionOptions,
    onProgress?: (progress: TranscriptionProgress) => void,
  ): Promise<TranscriptionResult>
  recognizeSpeech(mediaPath: string, options?: WhisperIntegrationOptions): Promise<unknown[]>
  generateSubtitles(transcription: TranscriptionResult, format: SubtitleFormat): Promise<string>
  getAvailableModels(): Promise<ModelInfo[]>
  downloadModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean>
  getSupportedLanguages(): TranscriptionLanguage[]
  recommendModel(durationSeconds: number, useLocal?: boolean): string
}

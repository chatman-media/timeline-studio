import type { BotRenderJobMediaInput, BotWorkflowRequest, TelegramLikeBotPayload } from "../types"
import type { TranscriptionResult } from "./ai.port"

export type BotFeedbackMediaKind = "voice" | "video_note"

export type BotFeedbackTranscriptionProvider = "openai" | "local" | "faster-whisper"

export interface BotFeedbackTranscriptionRequest {
  workflow: BotWorkflowRequest
  media: BotRenderJobMediaInput
  kind: BotFeedbackMediaKind
  payload?: TelegramLikeBotPayload
  provider?: BotFeedbackTranscriptionProvider
  model?: string
  language?: string
  metadata?: Record<string, unknown>
}

export interface BotFeedbackTranscriptionResult {
  text: string
  language: string
  provider: BotFeedbackTranscriptionProvider
  kind: BotFeedbackMediaKind
  media: BotRenderJobMediaInput
  segments: TranscriptionResult["segments"]
  processingTime: number
  metadata?: Record<string, unknown>
}

export interface IBotFeedbackTranscriber {
  transcribeFeedback(request: BotFeedbackTranscriptionRequest): Promise<BotFeedbackTranscriptionResult>
}

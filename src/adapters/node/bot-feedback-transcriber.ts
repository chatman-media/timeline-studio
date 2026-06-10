import type {
  BotFeedbackTranscriptionProvider,
  BotFeedbackTranscriptionRequest,
  BotFeedbackTranscriptionResult,
  BotMediaResolver,
  BotRenderJobMediaInput,
  IBotFeedbackTranscriber,
  TranscriptionResult,
} from "@timeline-studio/core"

export interface NodeBotFeedbackTranscriberAI {
  whisperTranscribeOpenAI(
    audioPath: string,
    options?: { model?: string; language?: string; responseFormat?: string; temperature?: number },
  ): Promise<TranscriptionResult>
  whisperTranscribeLocal(
    audioPath: string,
    options?: { model?: string; language?: string; task?: "transcribe" | "translate"; outputFormat?: string },
  ): Promise<TranscriptionResult>
  transcribeWithFasterWhisper?(
    audioPath: string,
    options?: {
      modelSize?: string
      language?: string
      task?: "transcribe" | "translate"
      beam_size?: number
      best_of?: number
      temperature?: number
    },
  ): Promise<TranscriptionResult>
}

export interface NodeBotFeedbackTranscriberOptions {
  ai: NodeBotFeedbackTranscriberAI
  mediaResolver?: BotMediaResolver
  provider?: BotFeedbackTranscriptionProvider
  model?: string
  language?: string
}

export class NodeBotFeedbackTranscriber implements IBotFeedbackTranscriber {
  private readonly provider: BotFeedbackTranscriptionProvider

  constructor(private readonly options: NodeBotFeedbackTranscriberOptions) {
    this.provider = options.provider ?? "openai"
  }

  async transcribeFeedback(request: BotFeedbackTranscriptionRequest): Promise<BotFeedbackTranscriptionResult> {
    const provider = request.provider ?? this.provider
    const media = await this.resolveMedia(request)
    const audioPath = this.requireLocalAudioPath(media)
    const transcription = await this.transcribe(audioPath, provider, request)
    const text = transcription.text.trim()

    if (!text) {
      throw new Error("Bot feedback transcription returned empty text")
    }

    return {
      text,
      language: transcription.language,
      provider,
      kind: request.kind,
      media,
      segments: transcription.segments,
      processingTime: transcription.processingTime,
      metadata: {
        ...request.metadata,
        ...(media.metadata ? { mediaMetadata: media.metadata } : {}),
      },
    }
  }

  private async resolveMedia(request: BotFeedbackTranscriptionRequest): Promise<BotRenderJobMediaInput> {
    if (!this.options.mediaResolver) return request.media

    return this.options.mediaResolver.resolve(request.media, {
      workflow: request.workflow,
      request: {
        source: "bot",
        media: [request.media],
        output: { format: "mp4" },
      },
      index: 0,
    })
  }

  private requireLocalAudioPath(media: BotRenderJobMediaInput): string {
    if (media.type !== "file" || isUrl(media.value)) {
      throw new Error("Bot feedback media must resolve to a local file before transcription")
    }

    const value = media.value.trim()
    if (!value) {
      throw new Error("Bot feedback media path is empty")
    }

    return value
  }

  private transcribe(
    audioPath: string,
    provider: BotFeedbackTranscriptionProvider,
    request: BotFeedbackTranscriptionRequest,
  ): Promise<TranscriptionResult> {
    const model = request.model ?? this.options.model
    const language = request.language ?? this.options.language

    switch (provider) {
      case "openai":
        return this.options.ai.whisperTranscribeOpenAI(audioPath, {
          ...(model ? { model } : {}),
          ...(language ? { language } : {}),
        })
      case "local":
        return this.options.ai.whisperTranscribeLocal(audioPath, {
          ...(model ? { model } : {}),
          ...(language ? { language } : {}),
          task: "transcribe",
          outputFormat: "json",
        })
      case "faster-whisper":
        if (!this.options.ai.transcribeWithFasterWhisper) {
          throw new Error("Faster Whisper transcription is not available in this AI adapter")
        }
        return this.options.ai.transcribeWithFasterWhisper(audioPath, {
          ...(model ? { modelSize: model } : {}),
          ...(language ? { language } : {}),
          task: "transcribe",
        })
      default:
        return assertNever(provider)
    }
  }
}

function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://")
}

function assertNever(value: never): never {
  throw new Error(`Unsupported bot feedback transcription provider: ${String(value)}`)
}

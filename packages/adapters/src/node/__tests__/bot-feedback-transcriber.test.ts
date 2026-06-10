import { describe, expect, it, vi } from "vitest"
import type { BotMediaResolver, BotRenderJobMediaInput, TranscriptionResult } from "@timeline-studio/core"
import { NodeBotFeedbackTranscriber, type NodeBotFeedbackTranscriberAI } from "../bot-feedback-transcriber"

const transcription: TranscriptionResult = {
  text: " Make the intro shorter ",
  language: "en",
  segments: [
    {
      start: 0,
      end: 1.5,
      text: "Make the intro shorter",
    },
  ],
  processingTime: 42,
}

function createAI(result: TranscriptionResult = transcription): NodeBotFeedbackTranscriberAI {
  return {
    whisperTranscribeOpenAI: vi.fn(async () => result),
    whisperTranscribeLocal: vi.fn(async () => result),
    transcribeWithFasterWhisper: vi.fn(async () => result),
  }
}

describe("NodeBotFeedbackTranscriber", () => {
  it("resolves Telegram voice media and transcribes it with OpenAI Whisper", async () => {
    const ai = createAI()
    const media: BotRenderJobMediaInput = {
      type: "file",
      value: "voice-file-id",
      name: "voice",
      metadata: {
        telegramFileId: "voice-file-id",
        telegramMediaKind: "voice",
      },
    }
    const resolvedMedia: BotRenderJobMediaInput = {
      ...media,
      value: "/tmp/voice.ogg",
      metadata: {
        ...media.metadata,
        resolvedPath: "/tmp/voice.ogg",
      },
    }
    const resolver: BotMediaResolver = {
      resolve: vi.fn(async () => resolvedMedia),
    }
    const transcriber = new NodeBotFeedbackTranscriber({
      ai,
      mediaResolver: resolver,
      provider: "openai",
      model: "whisper-1",
      language: "en",
    })

    const result = await transcriber.transcribeFeedback({
      workflow: { source: "telegram", chatId: "chat-1" },
      media,
      kind: "voice",
    })

    expect(resolver.resolve).toHaveBeenCalledWith(
      media,
      expect.objectContaining({
        workflow: { source: "telegram", chatId: "chat-1" },
        index: 0,
      }),
    )
    expect(ai.whisperTranscribeOpenAI).toHaveBeenCalledWith("/tmp/voice.ogg", {
      model: "whisper-1",
      language: "en",
    })
    expect(result).toMatchObject({
      text: "Make the intro shorter",
      language: "en",
      provider: "openai",
      kind: "voice",
      media: resolvedMedia,
      segments: transcription.segments,
      processingTime: 42,
    })
  })

  it("supports local Whisper for video-note feedback", async () => {
    const ai = createAI()
    const transcriber = new NodeBotFeedbackTranscriber({
      ai,
      provider: "local",
      model: "base",
    })

    const result = await transcriber.transcribeFeedback({
      workflow: { source: "telegram" },
      media: {
        type: "file",
        value: "/tmp/video-note.mp4",
        metadata: {
          telegramMediaKind: "video_note",
        },
      },
      kind: "video_note",
      language: "ru",
    })

    expect(ai.whisperTranscribeLocal).toHaveBeenCalledWith("/tmp/video-note.mp4", {
      model: "base",
      language: "ru",
      task: "transcribe",
      outputFormat: "json",
    })
    expect(result).toMatchObject({
      text: "Make the intro shorter",
      provider: "local",
      kind: "video_note",
    })
  })

  it("fails before transcription when feedback media is not resolved to a local file", async () => {
    const ai = createAI()
    const transcriber = new NodeBotFeedbackTranscriber({ ai })

    await expect(
      transcriber.transcribeFeedback({
        workflow: { source: "telegram" },
        media: {
          type: "url",
          value: "https://api.telegram.org/file/bottoken/voice.ogg",
        },
        kind: "voice",
      }),
    ).rejects.toThrow("must resolve to a local file")
    expect(ai.whisperTranscribeOpenAI).not.toHaveBeenCalled()
  })

  it("surfaces transcription failures to the caller", async () => {
    const ai = createAI()
    vi.mocked(ai.whisperTranscribeOpenAI).mockRejectedValueOnce(new Error("Whisper failed"))
    const transcriber = new NodeBotFeedbackTranscriber({ ai })

    await expect(
      transcriber.transcribeFeedback({
        workflow: { source: "telegram" },
        media: {
          type: "file",
          value: "/tmp/voice.ogg",
        },
        kind: "voice",
      }),
    ).rejects.toThrow("Whisper failed")
  })
})

import { describe, expect, it } from "vitest"
import {
  createBotRenderJobRequest,
  createBotWorkflowRequestFromTelegramLikePayload,
  parseBotWorkflowText,
} from "../bot-workflow-intake"

describe("bot workflow intake", () => {
  it("parses render hints from bot text", () => {
    const parsed = parseBotWorkflowText(
      '/render template=shorts project="./project.json" destination=telegram resolution=1080p tone=fast https://cdn.example.com/input.mov',
    )

    expect(parsed).toEqual({
      templateId: "shorts",
      projectPath: "./project.json",
      output: {
        destination: "telegram",
        resolution: "1080p",
      },
      params: {
        tone: "fast",
      },
    })
  })

  it("normalizes a telegram-like payload into a bot workflow request", () => {
    const workflow = createBotWorkflowRequestFromTelegramLikePayload({
      chat: { id: 42 },
      from: { id: "user-1" },
      message_id: 7,
      caption: "template=promo destination=telegram",
      video: {
        file_id: "telegram-file-1",
        file_unique_id: "unique-video-1",
        file_name: "clip.mp4",
        mime_type: "video/mp4",
      },
    })

    expect(workflow).toMatchObject({
      source: "telegram",
      chatId: "42",
      userId: "user-1",
      messageId: "7",
      text: "template=promo destination=telegram",
      media: [
        {
          id: "unique-video-1",
          type: "file",
          value: "telegram-file-1",
          name: "clip.mp4",
          mimeType: "video/mp4",
          metadata: {
            telegramFileId: "telegram-file-1",
            telegramFileUniqueId: "unique-video-1",
          },
        },
      ],
    })
  })

  it("creates a render job request from template, media, params, and output hints", () => {
    const workflow = createBotWorkflowRequestFromTelegramLikePayload({
      chat: { id: "chat-1" },
      message_id: "message-1",
      caption: "template=promo destination=telegram audience=founders",
      document: {
        url: "https://cdn.example.com/input.mov",
        file_name: "input.mov",
        mime_type: "video/quicktime",
      },
    })

    const result = createBotRenderJobRequest(workflow)

    expect(result).toEqual({
      ok: true,
      warnings: [],
      renderJob: {
        source: "bot",
        templateId: "promo",
        media: [
          {
            type: "url",
            value: "https://cdn.example.com/input.mov",
            name: "input.mov",
            mimeType: "video/quicktime",
          },
        ],
        params: {
          telegramChatId: "chat-1",
          telegramReplyToMessageId: "message-1",
          audience: "founders",
        },
        output: {
          format: "mp4",
          destination: "telegram",
        },
      },
    })
  })

  it("prefers structured workflow fields over text hints", () => {
    const result = createBotRenderJobRequest({
      source: "telegram",
      chatId: "chat-1",
      text: "template=text-template destination=file tone=calm",
      template: {
        id: "structured-template",
        params: {
          tone: "bold",
          ratio: "9:16",
        },
      },
      params: {
        telegramChatId: "override-chat",
        tone: "urgent",
      },
      output: {
        destination: "youtube",
        resolution: "4k",
      },
    })

    expect(result).toMatchObject({
      ok: true,
      renderJob: {
        source: "bot",
        templateId: "structured-template",
        params: {
          telegramChatId: "override-chat",
          tone: "urgent",
          ratio: "9:16",
        },
        output: {
          format: "mp4",
          destination: "youtube",
          resolution: "4k",
        },
      },
    })
  })

  it("returns chat-ready validation errors", () => {
    const result = createBotRenderJobRequest({
      source: "telegram",
      media: [{ type: "file", value: "" }],
      output: { format: "mp4" },
    })

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          code: "invalid_media",
          field: "media.0.value",
          message: "Media attachment value cannot be empty",
          userMessage: "One of the attached files is empty or unavailable. Send it again.",
        },
        {
          code: "missing_input",
          field: "workflow",
          message: "Workflow requires a template, project, or media attachment",
          userMessage: "Send a video file, link, project, or choose a template.",
        },
      ],
    })
  })

  it("validates unsupported output values from text hints", () => {
    const result = createBotRenderJobRequest({
      source: "telegram",
      text: "template=promo destination=instagram resolution=8k format=mov",
    })

    expect(result).toMatchObject({
      ok: false,
      errors: [
        { code: "invalid_output", field: "output.format" },
        { code: "unsupported_destination", field: "output.destination" },
        { code: "unsupported_resolution", field: "output.resolution" },
      ],
    })
  })
})

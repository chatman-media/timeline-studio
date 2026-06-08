import { describe, expect, it } from "vitest"
import type { BotRenderJobRequest } from "../../types"
import { createBotProjectSchemaFromRenderJob, withBotProjectSchema } from "../bot-project-assembler"

describe("bot project assembler", () => {
  it("creates a ProjectSchema from bot media and template hints", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      templateId: "shorts",
      media: [
        {
          type: "file",
          value: "/tmp/clip-a.mp4",
          name: "clip-a.mp4",
          mimeType: "video/mp4",
          metadata: { telegramFileId: "file-a" },
        },
        {
          type: "url",
          value: "https://cdn.example.com/clip-b.mp4",
          name: "clip-b.mp4",
        },
      ],
      params: {
        title: "Launch",
        caption: "Ready",
        clipDurationSeconds: "3",
      },
      output: {
        format: "mp4",
        destination: "telegram",
        resolution: "1080p",
      },
    }

    const schema = createBotProjectSchemaFromRenderJob(request, {
      now: () => "2026-06-08T00:00:00.000Z",
    })

    expect(schema).toMatchObject({
      version: "1.0.0",
      metadata: {
        name: "Launch",
        description: "Ready",
        created_at: "2026-06-08T00:00:00.000Z",
        modified_at: "2026-06-08T00:00:00.000Z",
        author: "bot",
      },
      timeline: {
        duration: 6,
        fps: 30,
        resolution: [1920, 1080],
        sample_rate: 48000,
        aspect_ratio: "Ratio16x9",
      },
      tracks: [
        {
          id: "bot-video-track",
          track_type: "Video",
          clips: [
            {
              source: { File: "/tmp/clip-a.mp4" },
              start_time: 0,
              end_time: 3,
              source_start: 0,
              source_end: 3,
              template_id: "shorts",
              template_position: 0,
              properties: {
                tags: ["bot"],
                custom_metadata: {
                  source: "bot",
                  name: "clip-a.mp4",
                  mimeType: "video/mp4",
                  media: { telegramFileId: "file-a" },
                },
              },
            },
            {
              source: { Stream: "https://cdn.example.com/clip-b.mp4" },
              start_time: 3,
              end_time: 6,
              template_id: "shorts",
              template_position: 1,
            },
          ],
        },
      ],
      settings: {
        export: { format: "Mp4" },
        preview: { resolution: [1280, 720], format: "Jpeg" },
        custom: {
          bot: {
            templateId: "shorts",
            params: request.params,
            destination: "telegram",
          },
        },
        output: { format: "Mp4", duration: 6 },
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        aspect_ratio: "Ratio16x9",
      },
    })
  })

  it("hydrates render jobs without an explicit project", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      media: [{ type: "file", value: "/tmp/clip.mp4" }],
      output: { format: "mp4" },
    }

    const hydrated = withBotProjectSchema(request, {
      now: () => "2026-06-08T00:00:00.000Z",
      resolution: [1080, 1920],
    })

    expect(hydrated.project).toMatchObject({
      type: "inline",
      schema: {
        timeline: {
          resolution: [1080, 1920],
          aspect_ratio: "Ratio9x16",
        },
      },
    })
  })

  it("preserves explicit project inputs and ignores empty media", () => {
    const explicit: BotRenderJobRequest = {
      source: "bot",
      project: { type: "file", path: "/tmp/project.json" },
      media: [{ type: "file", value: "/tmp/clip.mp4" }],
      output: { format: "mp4" },
    }
    const empty: BotRenderJobRequest = {
      source: "bot",
      output: { format: "mp4" },
    }

    expect(withBotProjectSchema(explicit)).toBe(explicit)
    expect(createBotProjectSchemaFromRenderJob(empty)).toBeNull()
    expect(withBotProjectSchema(empty)).toBe(empty)
  })
})

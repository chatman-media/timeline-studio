import { describe, expect, it } from "vitest"
import type { ScriptDraft } from "../../ports/script-generator.port"
import type { BotRenderJobRequest } from "../../types"
import { createBotProjectSchemaFromRenderJob, generateScriptSubtitles, withBotProjectSchema } from "../bot-project-assembler"

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

  it("splits audio media onto a dedicated Audio track and keeps the image on the Video track", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      media: [
        {
          type: "file",
          value: "/tmp/photo.jpg",
          name: "photo.jpg",
          mimeType: "image/jpeg",
        },
        {
          type: "file",
          value: "/tmp/music.mp3",
          name: "music.mp3",
          mimeType: "audio/mpeg",
          metadata: { duration: 30 },
        },
      ],
      params: { clipDurationSeconds: "5" },
      output: { format: "mp4" },
    }

    const schema = createBotProjectSchemaFromRenderJob(request, {
      now: () => "2026-06-08T00:00:00.000Z",
    })

    expect(schema?.tracks).toHaveLength(2)

    const videoTrack = schema?.tracks[0]
    expect(videoTrack).toMatchObject({ id: "bot-video-track", track_type: "Video" })
    expect(videoTrack?.clips).toHaveLength(1)
    expect(videoTrack?.clips[0]).toMatchObject({
      source: { File: "/tmp/photo.jpg" },
      start_time: 0,
      end_time: 5,
      source_start: 0,
      source_end: 5,
      properties: { custom_metadata: { mediaType: "image" } },
    })

    const audioTrack = schema?.tracks[1]
    expect(audioTrack).toMatchObject({ id: "bot-audio-track", track_type: "Audio" })
    expect(audioTrack?.clips).toHaveLength(1)
    expect(audioTrack?.clips[0]).toMatchObject({
      source: { File: "/tmp/music.mp3" },
      start_time: 0,
      source_start: 0,
      source_end: 30,
      end_time: 30,
      template_id: null,
      template_position: null,
      properties: { custom_metadata: { mediaType: "audio" } },
    })

    // Timeline spans the longer music clip so the looping image is fully scored.
    expect(schema?.timeline.duration).toBe(30)
  })

  it("detects audio media by file extension when no mimeType is provided", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      media: [
        { type: "file", value: "/tmp/slide.png" },
        { type: "url", value: "https://cdn.example.com/score.wav?token=abc" },
      ],
      output: { format: "mp4" },
    }

    const schema = createBotProjectSchemaFromRenderJob(request)

    expect(schema?.tracks).toHaveLength(2)
    expect(schema?.tracks[0].track_type).toBe("Video")
    expect(schema?.tracks[0].clips).toHaveLength(1)
    expect(schema?.tracks[1].track_type).toBe("Audio")
    expect(schema?.tracks[1].clips).toHaveLength(1)
    expect(schema?.tracks[1].clips[0]).toMatchObject({
      source: { Stream: "https://cdn.example.com/score.wav?token=abc" },
      start_time: 0,
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

  it("defaults to portrait 9:16 resolution when no resolution is specified", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      media: [{ type: "file", value: "/tmp/clip.mp4" }],
      output: { format: "mp4" },
    }

    const schema = createBotProjectSchemaFromRenderJob(request)

    expect(schema?.timeline.resolution).toEqual([1080, 1920])
    expect(schema?.timeline.aspect_ratio).toBe("Ratio9x16")
    expect(schema?.settings.resolution).toEqual({ width: 1080, height: 1920 })
  })

  it("respects explicit landscape resolution override", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      media: [{ type: "file", value: "/tmp/clip.mp4" }],
      output: { format: "mp4", resolution: "1080p" },
    }

    const schema = createBotProjectSchemaFromRenderJob(request)

    expect(schema?.timeline.resolution).toEqual([1920, 1080])
    expect(schema?.timeline.aspect_ratio).toBe("Ratio16x9")
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

describe("generateScriptSubtitles", () => {
  const SCRIPT: ScriptDraft = {
    hook: "Watch this!",
    scenes: [
      { index: 0, shot: "product close-up", voiceover: "Meet our product." },
      { index: 1, shot: "happy user", voiceover: "You will love it." },
    ],
  }

  it("returns empty array when no script provided", () => {
    expect(generateScriptSubtitles(undefined, 5, 10)).toEqual([])
  })

  it("generates a hook subtitle at top-center for first 3 seconds", () => {
    const subs = generateScriptSubtitles(SCRIPT, 5, 30)
    const hook = subs.find((s) => s.id === "sub-hook")
    expect(hook).toBeDefined()
    expect(hook?.text).toBe("Watch this!")
    expect(hook?.start_time).toBe(0)
    expect(hook?.end_time).toBe(3)
    expect(hook?.position.align_y).toBe("Top")
    expect(hook?.font_weight).toBe("Bold")
  })

  it("generates voiceover subtitles at bottom-center per scene", () => {
    const subs = generateScriptSubtitles(SCRIPT, 5, 30)
    const scene0 = subs.find((s) => s.id === "sub-scene-0")
    const scene1 = subs.find((s) => s.id === "sub-scene-1")
    expect(scene0?.text).toBe("Meet our product.")
    expect(scene0?.position.align_y).toBe("Bottom")
    expect(scene0?.start_time).toBe(0)
    expect(scene0?.end_time).toBe(5)
    expect(scene1?.start_time).toBe(5)
    expect(scene1?.end_time).toBe(10)
  })

  it("clamps hook end_time to totalDuration", () => {
    const subs = generateScriptSubtitles({ hook: "Quick!", scenes: [] }, 5, 1)
    const hook = subs.find((s) => s.id === "sub-hook")
    expect(hook?.end_time).toBe(1)
  })

  it("omits voiceover subtitle when voiceover is empty", () => {
    const script: ScriptDraft = {
      scenes: [{ index: 0, shot: "shot", voiceover: "  " }],
    }
    const subs = generateScriptSubtitles(script, 5, 10)
    expect(subs).toHaveLength(0)
  })

  it("respects scene-level durationSeconds when set", () => {
    const script: ScriptDraft = {
      scenes: [
        { index: 0, shot: "shot", voiceover: "Hello", durationSeconds: 8 },
        { index: 1, shot: "shot2", voiceover: "World", durationSeconds: 4 },
      ],
    }
    const subs = generateScriptSubtitles(script, 5, 30)
    expect(subs[0].end_time).toBe(8)
    expect(subs[1].start_time).toBe(8)
    expect(subs[1].end_time).toBe(12)
  })

  it("script passed to assembler produces subtitles in project schema", () => {
    const request: BotRenderJobRequest = {
      source: "bot",
      media: [
        { type: "file", value: "/tmp/a.mp4" },
        { type: "file", value: "/tmp/b.mp4" },
      ],
      params: { clipDurationSeconds: "5" },
      output: { format: "mp4" },
    }

    const schema = createBotProjectSchemaFromRenderJob(request, { script: SCRIPT })

    expect(schema?.subtitles).not.toHaveLength(0)
    const hookSub = (schema?.subtitles as { id: string }[]).find((s) => s.id === "sub-hook")
    const voiceSub = (schema?.subtitles as { id: string }[]).find((s) => s.id === "sub-scene-0")
    expect(hookSub).toBeDefined()
    expect(voiceSub).toBeDefined()
  })
})

import { describe, expect, it } from "vitest"

import { SubtitleTool } from "../index"

const executionOptions = {
  retries: 1,
  retryDelay: 0,
  enableLogging: false,
}

describe("SubtitleTool", () => {
  it("generates subtitle results from real transcription segments", async () => {
    const tool = new SubtitleTool()

    const result = await tool.execute(
      {
        operation: "generate_subtitles",
        clipId: "clip-1",
        language: "en",
        transcription: {
          segments: [
            {
              id: "whisper-1",
              start: 0.25,
              end: 2.5,
              text: "Real transcribed speech",
              speaker: "Speaker 1",
            },
          ],
        },
      },
      executionOptions,
    )

    expect(result.success).toBe(true)
    expect(result.data?.subtitles).toEqual([
      {
        id: "whisper-1",
        startTime: 250,
        endTime: 2500,
        text: "Real transcribed speech",
        speaker: "Speaker 1",
      },
    ])
    expect(result.data?.projectSubtitles?.[0]).toMatchObject({
      id: "whisper-1",
      text: "Real transcribed speech",
      start_time: 0.25,
      end_time: 2.5,
      enabled: true,
    })
  })

  it("fails instead of returning demo subtitles when transcription is missing", async () => {
    const tool = new SubtitleTool()

    const result = await tool.execute(
      {
        operation: "generate_subtitles",
        clipId: "clip-1",
        language: "en",
      },
      executionOptions,
    )

    expect(result.success).toBe(false)
    expect(result.errors?.join(" ")).toContain("demo subtitles")
  })
})

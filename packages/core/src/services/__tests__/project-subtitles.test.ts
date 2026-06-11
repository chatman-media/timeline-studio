import { describe, expect, it } from "vitest"

import { createProjectSubtitleFromSegment, createProjectSubtitlesFromSegments } from "../project-subtitles"

describe("project subtitle helpers", () => {
  it("creates canonical ProjectSchema subtitles from second-based segments", () => {
    const subtitle = createProjectSubtitleFromSegment(
      {
        id: "caption-1",
        text: "Hello world",
        start_time: 1,
        end_time: 3.5,
      },
      0,
    )

    expect(subtitle).toMatchObject({
      id: "caption-1",
      text: "Hello world",
      start_time: 1,
      end_time: 3.5,
      enabled: true,
      duration: 2.5,
      position: {
        type: "Relative",
        align_x: "Center",
        align_y: "Bottom",
      },
      style: {
        font_family: "Arial",
        font_size: 42,
        color: "#FFFFFF",
      },
    })
  })

  it("converts millisecond-based segments to ProjectSchema seconds", () => {
    const [subtitle] = createProjectSubtitlesFromSegments(
      [
        {
          text: "From UI subtitle segment",
          startTime: 500,
          endTime: 1750,
        },
      ],
      { timeUnit: "milliseconds" },
    )

    expect(subtitle.start_time).toBe(0.5)
    expect(subtitle.end_time).toBe(1.75)
    expect(subtitle.duration).toBe(1.25)
  })

  it("rejects empty text and invalid timing", () => {
    expect(() =>
      createProjectSubtitleFromSegment(
        {
          text: " ",
          start_time: 0,
          end_time: 1,
        },
        0,
      ),
    ).toThrow("text cannot be empty")

    expect(() =>
      createProjectSubtitleFromSegment(
        {
          text: "Invalid timing",
          start_time: 2,
          end_time: 1,
        },
        0,
      ),
    ).toThrow("end_time must be greater")
  })
})

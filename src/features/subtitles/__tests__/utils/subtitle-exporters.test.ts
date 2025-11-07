import { describe, expect, it } from "vitest"

import type { SubtitleClip } from "../../types/subtitles"
import {
  exportSubtitles,
  exportToASS,
  exportToSRT,
  exportToVTT,
  getSubtitleFileExtension,
  getSubtitleMimeType,
} from "../../utils/subtitle-exporters"

const mockSubtitles: SubtitleClip[] = [
  {
    id: "1",
    name: "Subtitle 1",
    trackId: "track-1",
    type: "subtitle",
    mediaId: "media-1",
    startTime: 0,
    duration: 2.5,
    mediaStartTime: 0,
    mediaEndTime: 2.5,
    offset: 0,
    volume: 1,
    speed: 1,
    isReversed: false,
    opacity: 1,
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    text: "Hello world",
    style: {
      color: "#FFFFFF",
      fontSize: 24,
    },
    position: {
      x: 0.5,
      y: 0.9,
      width: 0.8,
      height: 0.1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  },
  {
    id: "2",
    name: "Subtitle 2",
    trackId: "track-1",
    type: "subtitle",
    mediaId: "media-2",
    startTime: 3,
    duration: 2,
    mediaStartTime: 0,
    mediaEndTime: 2,
    offset: 0,
    volume: 1,
    speed: 1,
    isReversed: false,
    opacity: 1,
    effects: [],
    filters: [],
    transitions: [],
    isSelected: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    text: "This is a test\nwith multiple lines",
    style: {
      color: "#FFFF00",
      fontSize: 20,
    },
    position: {
      x: 0.5,
      y: 0.8,
      width: 0.8,
      height: 0.1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  },
]

describe("subtitle-exporters", () => {
  describe("exportToSRT", () => {
    it("should export subtitles to SRT format", () => {
      const result = exportToSRT(mockSubtitles)

      expect(result).toBe(
        `1
00:00:00,000 --> 00:00:02,500
Hello world

2
00:00:03,000 --> 00:00:05,000
This is a test
with multiple lines`,
      )
    })

    it("should handle empty array", () => {
      const result = exportToSRT([])
      expect(result).toBe("")
    })

    it("should sort subtitles by start time", () => {
      const unsortedSubtitles = [mockSubtitles[1], mockSubtitles[0]]
      const result = exportToSRT(unsortedSubtitles)

      expect(result).toContain("1\n00:00:00,000")
      expect(result).toContain("2\n00:00:03,000")
    })
  })

  describe("exportToVTT", () => {
    it("should export subtitles to VTT format", () => {
      const result = exportToVTT(mockSubtitles)

      expect(result).toBe(
        `WEBVTT

00:00:00.000 --> 00:00:02.500
Hello world

00:00:03.000 --> 00:00:05.000
This is a test
with multiple lines`,
      )
    })

    it("should include WEBVTT header", () => {
      const result = exportToVTT([mockSubtitles[0]])
      expect(result.startsWith("WEBVTT\n")).toBe(true)
    })
  })

  describe("exportToASS", () => {
    it("should export subtitles to ASS format", () => {
      const result = exportToASS(mockSubtitles)

      expect(result).toContain("[Script Info]")
      expect(result).toContain("[V4+ Styles]")
      expect(result).toContain("[Events]")
      expect(result).toContain("Dialogue: 0,0:00:00.00,0:00:02.50,Default,,0,0,0,,Hello world")
      expect(result).toContain(
        "Dialogue: 0,0:00:03.00,0:00:05.00,Default,,0,0,0,,{\\c&H00ffff&}This is a test\nwith multiple lines",
      )
    })

    it("should include video dimensions", () => {
      const result = exportToASS(mockSubtitles, 1280, 720)

      expect(result).toContain("PlayResX: 1280")
      expect(result).toContain("PlayResY: 720")
    })

    it("should apply color styling", () => {
      const subtitleWithColor: SubtitleClip = {
        ...mockSubtitles[0],
        text: "Colored text",
        style: {
          color: "#FF0000", // Red
        },
      }

      const result = exportToASS([subtitleWithColor])

      // ASS uses BGR format, so red (#FF0000) becomes &H0000FF&
      expect(result).toContain("{\\c&H0000ff&}Colored text")
    })
  })

  describe("exportSubtitles", () => {
    it("should export to SRT format", () => {
      const result = exportSubtitles(mockSubtitles, "srt")
      expect(result).toContain("00:00:00,000 --> 00:00:02,500")
    })

    it("should export to VTT format", () => {
      const result = exportSubtitles(mockSubtitles, "vtt")
      expect(result.startsWith("WEBVTT")).toBe(true)
    })

    it("should export to ASS format", () => {
      const result = exportSubtitles(mockSubtitles, "ass")
      expect(result).toContain("[Script Info]")
    })

    it("should throw error for unsupported format", () => {
      expect(() => exportSubtitles(mockSubtitles, "xyz" as any)).toThrow("Unsupported export format: xyz")
    })
  })

  describe("getSubtitleFileExtension", () => {
    it("should return correct extensions", () => {
      expect(getSubtitleFileExtension("srt")).toBe("srt")
      expect(getSubtitleFileExtension("vtt")).toBe("vtt")
      expect(getSubtitleFileExtension("ass")).toBe("ass")
    })
  })

  describe("getSubtitleMimeType", () => {
    it("should return correct MIME types", () => {
      expect(getSubtitleMimeType("srt")).toBe("application/x-subrip")
      expect(getSubtitleMimeType("vtt")).toBe("text/vtt")
      expect(getSubtitleMimeType("ass")).toBe("text/x-ssa")
    })

    it("should return text/plain for unknown format", () => {
      expect(getSubtitleMimeType("xyz" as any)).toBe("text/plain")
    })
  })
})

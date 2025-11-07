import { describe, expect, it } from "vitest"

import {
  createSubtitleClip,
  detectSubtitleFormat,
  importFromASS,
  importFromSRT,
  importFromVTT,
  validateSubtitles,
} from "../../utils/subtitle-importers"

describe("subtitle-importers", () => {
  describe("importFromSRT", () => {
    it("should import simple SRT subtitles", () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello, world!

2
00:00:05,000 --> 00:00:07,500
This is a test subtitle.`

      const subtitles = importFromSRT(srtContent)

      expect(subtitles).toHaveLength(2)
      expect(subtitles[0]).toMatchObject({
        startTime: 1,
        duration: 2,
        text: "Hello, world!",
        type: "subtitle",
      })
      expect(subtitles[1]).toMatchObject({
        startTime: 5,
        duration: 2.5,
        text: "This is a test subtitle.",
      })
    })

    it("should handle multi-line subtitles", () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Line 1
Line 2
Line 3`

      const subtitles = importFromSRT(srtContent)

      expect(subtitles[0].text).toBe("Line 1\nLine 2\nLine 3")
    })

    it("should handle subtitles with hours", () => {
      const srtContent = `1
01:30:15,000 --> 01:30:18,500
Long video subtitle`

      const subtitles = importFromSRT(srtContent)

      expect(subtitles[0].startTime).toBe(5415) // 1*3600 + 30*60 + 15
      expect(subtitles[0].duration).toBe(3.5)
    })

    it("should skip invalid blocks", () => {
      const srtContent = `1
Invalid time format
Hello

2
00:00:05,000 --> 00:00:07,000
Valid subtitle`

      const subtitles = importFromSRT(srtContent)

      expect(subtitles).toHaveLength(1)
      expect(subtitles[0].text).toBe("Valid subtitle")
    })
  })

  describe("importFromVTT", () => {
    it("should import simple VTT subtitles", () => {
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello, world!

00:00:05.000 --> 00:00:07.500
This is a test subtitle.`

      const subtitles = importFromVTT(vttContent)

      expect(subtitles).toHaveLength(2)
      expect(subtitles[0]).toMatchObject({
        startTime: 1,
        duration: 2,
        text: "Hello, world!",
      })
    })

    it("should handle VTT with cue identifiers", () => {
      const vttContent = `WEBVTT

cue-1
00:00:01.000 --> 00:00:03.000
First cue

cue-2
00:00:05.000 --> 00:00:07.000
Second cue`

      const subtitles = importFromVTT(vttContent)

      expect(subtitles).toHaveLength(2)
      expect(subtitles[0].text).toBe("First cue")
      expect(subtitles[1].text).toBe("Second cue")
    })

    it("should parse VTT positioning", () => {
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:03.000 position:25%
Left positioned

00:00:05.000 --> 00:00:07.000 position:75%
Right positioned`

      const subtitles = importFromVTT(vttContent)

      expect(subtitles[0].position).toEqual({ x: 0.25, y: 0.9 })
      expect(subtitles[1].position).toEqual({ x: 0.75, y: 0.9 })
    })

    it("should handle VTT header metadata", () => {
      const vttContent = `WEBVTT
Kind: subtitles
Language: en

00:00:01.000 --> 00:00:03.000
Test subtitle`

      const subtitles = importFromVTT(vttContent)

      expect(subtitles).toHaveLength(1)
      expect(subtitles[0].text).toBe("Test subtitle")
    })
  })

  describe("importFromASS", () => {
    it("should import simple ASS subtitles", () => {
      const assContent = `[Script Info]
Title: Test

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello, world!
Dialogue: 0,0:00:05.00,0:00:07.50,Default,,0,0,0,,This is a test subtitle.`

      const subtitles = importFromASS(assContent)

      expect(subtitles).toHaveLength(2)
      expect(subtitles[0]).toMatchObject({
        startTime: 1,
        duration: 2,
        text: "Hello, world!",
      })
    })

    it("should parse ASS styles", () => {
      const assContent = `[Script Info]
Title: Test

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1
Style: Bold,Arial,48,&H0000FFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Normal text
Dialogue: 0,0:00:05.00,0:00:07.00,Bold,,0,0,0,,Bold yellow text`

      const subtitles = importFromASS(assContent)

      expect(subtitles[0].style).toMatchObject({
        fontFamily: "Arial",
        fontSize: 48,
        color: "#FFFFFF",
      })
      expect(subtitles[1].style).toMatchObject({
        fontFamily: "Arial",
        fontSize: 48,
        color: "#FFFF00",
        fontWeight: "bold",
      })
    })

    it("should clean ASS formatting tags", () => {
      const assContent = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,{\\i1}Italic text{\\i0}\\NNew line\\nAnother line`

      const subtitles = importFromASS(assContent)

      expect(subtitles[0].text).toBe("Italic text\nNew line\nAnother line")
    })

    it("should handle text with commas", () => {
      const assContent = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello, world, how are you?`

      const subtitles = importFromASS(assContent)

      expect(subtitles[0].text).toBe("Hello, world, how are you?")
    })
  })

  describe("detectSubtitleFormat", () => {
    it("should detect SRT format", () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello`

      expect(detectSubtitleFormat(srtContent)).toBe("srt")
    })

    it("should detect VTT format", () => {
      const vttContent = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello`

      expect(detectSubtitleFormat(vttContent)).toBe("vtt")
    })

    it("should detect ASS format", () => {
      const assContent = `[Script Info]
Title: Test

[Events]
Dialogue: 0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Hello`

      expect(detectSubtitleFormat(assContent)).toBe("ass")
    })

    it("should return null for unknown format", () => {
      const unknownContent = "This is not a subtitle file"

      expect(detectSubtitleFormat(unknownContent)).toBe(null)
    })

    it("should detect SRT even without initial number", () => {
      const srtContent = `00:00:01,000 --> 00:00:03,000
Hello`

      expect(detectSubtitleFormat(srtContent)).toBe("srt")
    })
  })

  describe("validateSubtitles", () => {
    it("should validate correct subtitles", () => {
      const subtitles = [
        createSubtitleClip({
          id: "1",
          trackId: "",
          startTime: 0,
          duration: 2,
          text: "First",
        }),
        createSubtitleClip({
          id: "2",
          trackId: "",
          startTime: 3,
          duration: 2,
          text: "Second",
        }),
      ]

      const result = validateSubtitles(subtitles)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should detect empty subtitles array", () => {
      const result = validateSubtitles([])

      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Не найдено субтитров для импорта")
    })

    it("should detect empty text", () => {
      const subtitles = [
        createSubtitleClip({
          id: "1",
          trackId: "",
          startTime: 0,
          duration: 2,
          text: "",
        }),
      ]

      const result = validateSubtitles(subtitles)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain("пустой текст")
    })

    it("should detect negative start time", () => {
      const subtitles = [
        createSubtitleClip({
          id: "1",
          trackId: "",
          startTime: -1,
          duration: 2,
          text: "Test",
        }),
      ]

      const result = validateSubtitles(subtitles)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain("отрицательное время начала")
    })

    it("should detect overlapping subtitles", () => {
      const subtitles = [
        createSubtitleClip({
          id: "1",
          trackId: "",
          startTime: 0,
          duration: 3,
          text: "First",
        }),
        createSubtitleClip({
          id: "2",
          trackId: "",
          startTime: 2,
          duration: 2,
          text: "Second",
        }),
      ]

      const result = validateSubtitles(subtitles)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain("перекрывается")
    })

    it("should detect invalid duration", () => {
      const subtitles = [
        createSubtitleClip({
          id: "1",
          trackId: "",
          startTime: 0,
          duration: 0,
          text: "Test",
        }),
      ]

      const result = validateSubtitles(subtitles)

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain("недопустимая длительность")
    })
  })
})

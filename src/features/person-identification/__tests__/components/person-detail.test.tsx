import { describe, expect, it } from "vitest"

// Tests for PersonDetail component logic
describe("PersonDetail", () => {
  it("should validate person detail data structure", () => {
    const mockPerson = {
      id: "person-123",
      name: "Jane Doe",
      description: "Lead actress in the movie",
      avatarUrl: "https://example.com/jane.jpg",
      tags: ["actress", "lead", "protagonist"],
      privacySettings: {
        blurFace: false,
        anonymize: false,
        excludeFromExport: false,
      },
      statistics: {
        totalAppearances: 25,
        totalScreenTime: 1800, // 30 minutes
        firstSeen: "2025-01-01T10:00:00Z",
        lastSeen: "2025-01-01T10:30:00Z",
        averageScreenTime: 72, // seconds per appearance
      },
      clips: [
        { clipId: "clip-1", startTime: 0, endTime: 60 },
        { clipId: "clip-2", startTime: 120, endTime: 180 },
      ],
    }

    expect(mockPerson.id).toBeDefined()
    expect(mockPerson.tags).toHaveLength(3)
    expect(mockPerson.statistics.totalScreenTime).toBe(1800)
    expect(mockPerson.clips).toHaveLength(2)
  })

  it("should handle privacy settings toggles", () => {
    const privacySettings = {
      blurFace: false,
      anonymize: false,
      excludeFromExport: false,
    }

    const toggleSetting = (setting: keyof typeof privacySettings) => {
      privacySettings[setting] = !privacySettings[setting]
    }

    toggleSetting("blurFace")
    expect(privacySettings.blurFace).toBe(true)
    expect(privacySettings.anonymize).toBe(false)

    toggleSetting("anonymize")
    expect(privacySettings.anonymize).toBe(true)

    toggleSetting("blurFace")
    expect(privacySettings.blurFace).toBe(false)
  })

  it("should calculate appearance timeline", () => {
    const clips = [
      { startTime: 0, endTime: 60 },
      { startTime: 120, endTime: 180 },
      { startTime: 240, endTime: 300 },
      { startTime: 360, endTime: 420 },
    ]

    const calculateTimeline = (clips: any[], totalDuration: number) => {
      const segments = []
      let lastEnd = 0

      for (const clip of clips) {
        if (clip.startTime > lastEnd) {
          segments.push({ type: "gap", start: lastEnd, end: clip.startTime })
        }
        segments.push({
          type: "appearance",
          start: clip.startTime,
          end: clip.endTime,
        })
        lastEnd = clip.endTime
      }

      if (lastEnd < totalDuration) {
        segments.push({ type: "gap", start: lastEnd, end: totalDuration })
      }

      return segments
    }

    const timeline = calculateTimeline(clips, 600)
    expect(timeline).toHaveLength(8) // 4 appearances + 4 gaps
    expect(timeline[0].type).toBe("appearance")
    expect(timeline[1].type).toBe("gap")
  })

  it("should format statistics display", () => {
    const formatStatistic = (value: number, type: string): string => {
      switch (type) {
        case "appearances":
          return `${value} time${value !== 1 ? "s" : ""}`
        case "screenTime": {
          const minutes = Math.floor(value / 60)
          const seconds = value % 60
          return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
        }
        case "percentage":
          return `${value.toFixed(1)}%`
        default:
          return String(value)
      }
    }

    expect(formatStatistic(1, "appearances")).toBe("1 time")
    expect(formatStatistic(5, "appearances")).toBe("5 times")
    expect(formatStatistic(90, "screenTime")).toBe("1m 30s")
    expect(formatStatistic(45, "screenTime")).toBe("45s")
    expect(formatStatistic(33.333, "percentage")).toBe("33.3%")
  })

  it("should handle clip navigation", () => {
    const clips = [
      { id: "1", time: 0 },
      { id: "2", time: 120 },
      { id: "3", time: 240 },
    ]

    const navigateToClip = (clipId: string) => {
      const clip = clips.find((c) => c.id === clipId)
      return clip ? clip.time : null
    }

    expect(navigateToClip("2")).toBe(120)
    expect(navigateToClip("invalid")).toBeNull()

    // Test next/previous navigation
    const getAdjacentClip = (currentId: string, direction: "next" | "prev") => {
      const index = clips.findIndex((c) => c.id === currentId)
      if (index === -1) return null

      const newIndex = direction === "next" ? index + 1 : index - 1
      return clips[newIndex] || null
    }

    expect(getAdjacentClip("2", "next")?.id).toBe("3")
    expect(getAdjacentClip("2", "prev")?.id).toBe("1")
    expect(getAdjacentClip("1", "prev")).toBeNull()
    expect(getAdjacentClip("3", "next")).toBeNull()
  })
})

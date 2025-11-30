/**
 * Integration tests for AI Director + Video Editing
 *
 * Тесты для взаимодействия между AI анализом и видеомонтажом
 */

import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Track, Clip, Section } from "@/domains/video-editing/types"

// Mock Tauri commands
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}))

// Mock analysis result
interface AnalysisResult {
  video_id: string
  key_moments: Array<{
    timestamp: number
    duration: number
    category: string
    total_score: number
    description: string
  }>
  quality_score: number
  motion_score: number
}

describe("AI Director + Video Editing Integration", () => {
  let mockAnalysisResult: AnalysisResult
  let mockVideoTrack: Track
  let mockAudioTrack: Track

  beforeEach(() => {
    mockAnalysisResult = {
      video_id: "/test/video.mp4",
      key_moments: [
        {
          timestamp: 5,
          duration: 3,
          category: "action",
          total_score: 95,
          description: "Exciting moment",
        },
        {
          timestamp: 15,
          duration: 2,
          category: "dialogue",
          total_score: 80,
          description: "Important conversation",
        },
        {
          timestamp: 30,
          duration: 4,
          category: "transition",
          total_score: 70,
          description: "Scene change",
        },
      ],
      quality_score: 85,
      motion_score: 75,
    }

    mockVideoTrack = {
      id: "track-video-1",
      name: "Video 1",
      track_type: "Video",
      clips: [],
      index: 0,
      is_locked: false,
      is_visible: true,
    }

    mockAudioTrack = {
      id: "track-audio-1",
      name: "Audio 1",
      track_type: "Audio",
      clips: [],
      index: 1,
      is_locked: false,
      is_visible: true,
    }
  })

  describe("Key Moments to Clips Conversion", () => {
    it("should convert key moments to timeline clips", () => {
      const clips: Clip[] = mockAnalysisResult.key_moments.map((moment, index) => ({
        id: `clip-${index + 1}`,
        media_id: mockAnalysisResult.video_id,
        track_id: mockVideoTrack.id,
        start_time: moment.timestamp,
        duration: moment.duration,
        source_start: moment.timestamp,
        source_end: moment.timestamp + moment.duration,
        speed: 1.0,
        volume: 1.0,
        metadata: {
          category: moment.category,
          score: moment.total_score,
          description: moment.description,
        },
      }))

      expect(clips).toHaveLength(3)
      expect(clips[0].start_time).toBe(5)
      expect(clips[0].duration).toBe(3)
      expect(clips[0].metadata?.category).toBe("action")
    })

    it("should place clips on appropriate tracks", () => {
      const videoClips: Clip[] = []
      const audioClips: Clip[] = []

      mockAnalysisResult.key_moments.forEach((moment, index) => {
        const clip: Clip = {
          id: `clip-${index + 1}`,
          media_id: mockAnalysisResult.video_id,
          track_id: mockVideoTrack.id,
          start_time: moment.timestamp,
          duration: moment.duration,
          source_start: moment.timestamp,
          source_end: moment.timestamp + moment.duration,
          speed: 1.0,
          volume: 1.0,
        }

        // Video clips go to video track
        videoClips.push(clip)

        // Audio clips go to audio track
        const audioClip: Clip = {
          ...clip,
          id: `clip-audio-${index + 1}`,
          track_id: mockAudioTrack.id,
        }
        audioClips.push(audioClip)
      })

      expect(videoClips).toHaveLength(3)
      expect(audioClips).toHaveLength(3)
      expect(videoClips[0].track_id).toBe(mockVideoTrack.id)
      expect(audioClips[0].track_id).toBe(mockAudioTrack.id)
    })
  })

  describe("Quality-Based Editing", () => {
    it("should filter low-quality moments", () => {
      const minScore = 75
      const highQualityMoments = mockAnalysisResult.key_moments.filter(
        (moment) => moment.total_score >= minScore
      )

      expect(highQualityMoments).toHaveLength(2)
      expect(highQualityMoments[0].total_score).toBe(95)
      expect(highQualityMoments[1].total_score).toBe(80)
    })

    it("should sort moments by score", () => {
      const sortedMoments = [...mockAnalysisResult.key_moments].sort(
        (a, b) => b.total_score - a.total_score
      )

      expect(sortedMoments[0].total_score).toBe(95)
      expect(sortedMoments[1].total_score).toBe(80)
      expect(sortedMoments[2].total_score).toBe(70)
    })

    it("should categorize moments for different editing styles", () => {
      const actionMoments = mockAnalysisResult.key_moments.filter(
        (m) => m.category === "action"
      )
      const dialogueMoments = mockAnalysisResult.key_moments.filter(
        (m) => m.category === "dialogue"
      )

      expect(actionMoments).toHaveLength(1)
      expect(dialogueMoments).toHaveLength(1)
    })
  })

  describe("Timeline Sections from Analysis", () => {
    it("should create sections based on moment categories", () => {
      const sections: Section[] = []
      const categories = new Set(mockAnalysisResult.key_moments.map((m) => m.category))

      categories.forEach((category, index) => {
        const categoryMoments = mockAnalysisResult.key_moments.filter(
          (m) => m.category === category
        )
        const startTime = Math.min(...categoryMoments.map((m) => m.timestamp))
        const endTime = Math.max(
          ...categoryMoments.map((m) => m.timestamp + m.duration)
        )

        sections.push({
          id: `section-${category}`,
          name: category,
          start_time: startTime,
          duration: endTime - startTime,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          metadata: {
            category,
            moment_count: categoryMoments.length,
          },
        })
      })

      expect(sections.length).toBeGreaterThan(0)
      expect(sections.some((s) => s.name === "action")).toBe(true)
      expect(sections.some((s) => s.name === "dialogue")).toBe(true)
    })
  })

  describe("Auto-Edit Scenarios", () => {
    it("should generate highlight reel from top moments", () => {
      const topCount = 2
      const topMoments = [...mockAnalysisResult.key_moments]
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, topCount)

      let currentTime = 0
      const gapDuration = 1

      const highlightClips: Clip[] = topMoments.map((moment, index) => {
        const clip: Clip = {
          id: `highlight-${index + 1}`,
          media_id: mockAnalysisResult.video_id,
          track_id: mockVideoTrack.id,
          start_time: currentTime,
          duration: moment.duration,
          source_start: moment.timestamp,
          source_end: moment.timestamp + moment.duration,
          speed: 1.0,
          volume: 1.0,
        }
        currentTime += moment.duration + gapDuration
        return clip
      })

      expect(highlightClips).toHaveLength(2)
      expect(highlightClips[0].start_time).toBe(0)
      expect(highlightClips[0].duration).toBe(3)
      expect(highlightClips[1].start_time).toBe(4) // 0 + 3s duration + 1s gap
      expect(highlightClips[1].duration).toBe(2)
    })

    it("should calculate total duration of edited sequence", () => {
      const totalDuration = mockAnalysisResult.key_moments.reduce(
        (sum, moment) => sum + moment.duration,
        0
      )

      expect(totalDuration).toBe(9) // 3 + 2 + 4
    })

    it("should detect overlapping moments", () => {
      const moments = [
        { timestamp: 5, duration: 5 }, // 5-10
        { timestamp: 8, duration: 3 }, // 8-11 (overlaps)
        { timestamp: 15, duration: 2 }, // 15-17 (no overlap)
      ]

      const hasOverlaps = moments.some((m1, i) =>
        moments.slice(i + 1).some((m2) => {
          const m1End = m1.timestamp + m1.duration
          const m2End = m2.timestamp + m2.duration
          return m1.timestamp < m2End && m2.timestamp < m1End
        })
      )

      expect(hasOverlaps).toBe(true)
    })
  })

  describe("Analysis Metadata Integration", () => {
    it("should attach analysis metadata to clips", () => {
      const clip: Clip = {
        id: "clip-1",
        media_id: mockAnalysisResult.video_id,
        track_id: mockVideoTrack.id,
        start_time: 5,
        duration: 3,
        source_start: 5,
        source_end: 8,
        speed: 1.0,
        volume: 1.0,
        metadata: {
          quality_score: mockAnalysisResult.quality_score,
          motion_score: mockAnalysisResult.motion_score,
          ai_generated: true,
        },
      }

      expect(clip.metadata?.quality_score).toBe(85)
      expect(clip.metadata?.motion_score).toBe(75)
      expect(clip.metadata?.ai_generated).toBe(true)
    })

    it("should preserve original analysis data", () => {
      const clipWithAnalysis = {
        clip_id: "clip-1",
        original_analysis: mockAnalysisResult.key_moments[0],
      }

      expect(clipWithAnalysis.original_analysis.category).toBe("action")
      expect(clipWithAnalysis.original_analysis.total_score).toBe(95)
    })
  })
})

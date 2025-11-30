import { describe, expect, it } from "vitest"
import { createEmptySimpleVideoAnalysis, createEmptyVideoAnalysis } from "../../types/video-analysis"

describe("video-analysis types", () => {
  describe("createEmptyVideoAnalysis", () => {
    it("должен создать пустой анализ видео с заданными параметрами", () => {
      const videoId = "test-video-123"
      const duration = 120
      const frameRate = 30
      const width = 1920
      const height = 1080

      const analysis = createEmptyVideoAnalysis(videoId, duration, frameRate, width, height)

      expect(analysis).toEqual({
        videoId,
        duration,
        frameRate,
        resolution: {
          width,
          height,
        },
        frames: [],
        objects: [],
        subtitles: [],
        audio: [],
        scenes: [],
      })
    })

    it("должен создать объект с пустыми массивами", () => {
      const analysis = createEmptyVideoAnalysis("video-1", 60, 24, 1280, 720)

      expect(Array.isArray(analysis.frames)).toBe(true)
      expect(analysis.frames).toHaveLength(0)
      expect(Array.isArray(analysis.objects)).toBe(true)
      expect(analysis.objects).toHaveLength(0)
      expect(Array.isArray(analysis.subtitles)).toBe(true)
      expect(analysis.subtitles).toHaveLength(0)
      expect(Array.isArray(analysis.audio)).toBe(true)
      expect(analysis.audio).toHaveLength(0)
      expect(Array.isArray(analysis.scenes)).toBe(true)
      expect(analysis.scenes).toHaveLength(0)
    })

    it("должен работать с различными разрешениями", () => {
      const hdAnalysis = createEmptyVideoAnalysis("hd-video", 120, 30, 1920, 1080)
      expect(hdAnalysis.resolution).toEqual({ width: 1920, height: 1080 })

      const sdAnalysis = createEmptyVideoAnalysis("sd-video", 120, 30, 640, 480)
      expect(sdAnalysis.resolution).toEqual({ width: 640, height: 480 })

      const ultraHdAnalysis = createEmptyVideoAnalysis("4k-video", 120, 60, 3840, 2160)
      expect(ultraHdAnalysis.resolution).toEqual({ width: 3840, height: 2160 })
    })

    it("должен работать с различными frame rates", () => {
      const analysis24fps = createEmptyVideoAnalysis("video-24", 60, 24, 1920, 1080)
      expect(analysis24fps.frameRate).toBe(24)

      const analysis30fps = createEmptyVideoAnalysis("video-30", 60, 30, 1920, 1080)
      expect(analysis30fps.frameRate).toBe(30)

      const analysis60fps = createEmptyVideoAnalysis("video-60", 60, 60, 1920, 1080)
      expect(analysis60fps.frameRate).toBe(60)
    })
  })

  describe("createEmptySimpleVideoAnalysis", () => {
    it("должен создать пустой упрощенный анализ видео", () => {
      const videoId = "simple-video-123"
      const duration = 90

      const analysis = createEmptySimpleVideoAnalysis(videoId, duration)

      expect(analysis).toEqual({
        videoId,
        duration,
        keyFrames: [],
        subtitles: [],
        audioBeats: [],
        scenes: [],
      })
    })

    it("должен создать объект с пустыми массивами", () => {
      const analysis = createEmptySimpleVideoAnalysis("video-1", 60)

      expect(Array.isArray(analysis.keyFrames)).toBe(true)
      expect(analysis.keyFrames).toHaveLength(0)
      expect(Array.isArray(analysis.subtitles)).toBe(true)
      expect(analysis.subtitles).toHaveLength(0)
      expect(Array.isArray(analysis.audioBeats)).toBe(true)
      expect(analysis.audioBeats).toHaveLength(0)
      expect(Array.isArray(analysis.scenes)).toBe(true)
      expect(analysis.scenes).toHaveLength(0)
    })

    it("должен работать с различной длительностью", () => {
      const shortAnalysis = createEmptySimpleVideoAnalysis("short-video", 10)
      expect(shortAnalysis.duration).toBe(10)

      const mediumAnalysis = createEmptySimpleVideoAnalysis("medium-video", 300)
      expect(mediumAnalysis.duration).toBe(300)

      const longAnalysis = createEmptySimpleVideoAnalysis("long-video", 3600)
      expect(longAnalysis.duration).toBe(3600)
    })

    it("должен иметь меньше полей чем полный анализ", () => {
      const simpleAnalysis = createEmptySimpleVideoAnalysis("video", 60)
      const fullAnalysis = createEmptyVideoAnalysis("video", 60, 30, 1920, 1080)

      const simpleKeys = Object.keys(simpleAnalysis)
      const fullKeys = Object.keys(fullAnalysis)

      expect(simpleKeys.length).toBeLessThan(fullKeys.length)
      expect(simpleKeys).not.toContain("frameRate")
      expect(simpleKeys).not.toContain("resolution")
      expect(simpleKeys).not.toContain("objects")
    })
  })
})

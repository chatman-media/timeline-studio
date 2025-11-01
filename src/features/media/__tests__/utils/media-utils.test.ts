import { describe, expect, it } from "vitest"
import type { MediaFile } from "../../types/media"
import {
  doTimeRangesOverlap,
  getFileType,
  getRemainingMediaCounts,
  hasAudioStream,
  isHorizontalVideo,
} from "../../utils/media-utils"

describe("media-utils", () => {
  const createMockMediaFile = (overrides: Partial<MediaFile> = {}): MediaFile =>
    ({
      id: "test-file",
      path: "/path/to/file.mp4",
      name: "file.mp4",
      size: 1024 * 1024,
      duration: 60,
      isVideo: true,
      isAudio: false,
      isImage: false,
      ...overrides,
    }) as MediaFile

  describe("hasAudioStream", () => {
    it("should return true when file has audio stream", () => {
      const file = createMockMediaFile({
        probeData: {
          streams: [
            { index: 0, codec_type: "video", codec_name: "h264" } as any,
            { index: 1, codec_type: "audio", codec_name: "aac" } as any,
          ],
        } as any,
      })

      expect(hasAudioStream(file)).toBe(true)
    })

    it("should return false when file has no audio stream", () => {
      const file = createMockMediaFile({
        probeData: {
          streams: [{ index: 0, codec_type: "video", codec_name: "h264" } as any],
        } as any,
      })

      expect(hasAudioStream(file)).toBe(false)
    })

    it("should return false when probeData is undefined", () => {
      const file = createMockMediaFile({ probeData: undefined })
      expect(hasAudioStream(file)).toBe(false)
    })

    it("should return false when streams array is empty", () => {
      const file = createMockMediaFile({
        probeData: { streams: [], format: {} as any } as any,
      })
      expect(hasAudioStream(file)).toBe(false)
    })

    it("should handle multiple audio streams", () => {
      const file = createMockMediaFile({
        probeData: {
          streams: [
            { index: 0, codec_type: "video", codec_name: "h264" } as any,
            { index: 1, codec_type: "audio", codec_name: "aac" } as any,
            { index: 2, codec_type: "audio", codec_name: "mp3" } as any,
          ],
        } as any,
      })

      expect(hasAudioStream(file)).toBe(true)
    })
  })

  describe("getFileType", () => {
    it("should return 'image' when isImage is true", () => {
      const file = createMockMediaFile({
        isImage: true,
        probeData: {
          streams: [{ index: 0, codec_type: "video", codec_name: "mjpeg" } as any],
        } as any,
      })

      expect(getFileType(file)).toBe("image")
    })

    it("should return 'video' when file has video stream", () => {
      const file = createMockMediaFile({
        probeData: {
          streams: [
            { index: 0, codec_type: "video", codec_name: "h264" } as any,
            { index: 1, codec_type: "audio", codec_name: "aac" } as any,
          ],
        } as any,
      })

      expect(getFileType(file)).toBe("video")
    })

    it("should return 'audio' when file has only audio stream", () => {
      const file = createMockMediaFile({
        isAudio: true,
        probeData: {
          streams: [{ index: 2, codec_type: "audio", codec_name: "mp3" } as any],
        } as any,
      })

      expect(getFileType(file)).toBe("audio")
    })

    it("should return 'audio' when probeData is undefined", () => {
      const file = createMockMediaFile({ probeData: undefined })
      expect(getFileType(file)).toBe("audio")
    })

    it("should prioritize image over video", () => {
      const file = createMockMediaFile({
        isImage: true,
        probeData: {
          streams: [{ index: 0, codec_type: "video", codec_name: "h264" } as any],
        } as any,
      })

      expect(getFileType(file)).toBe("image")
    })
  })

  describe("getRemainingMediaCounts", () => {
    it("should count remaining video files with audio", () => {
      const media: MediaFile[] = [
        createMockMediaFile({
          id: "1",
          path: "/video1.mp4",
          probeData: {
            streams: [
              { index: 0, codec_type: "video", codec_name: "h264" } as any,
              { index: 1, codec_type: "audio", codec_name: "aac" } as any,
            ],
          } as any,
        }),
        createMockMediaFile({
          id: "2",
          path: "/video2.mp4",
          probeData: {
            streams: [
              { index: 0, codec_type: "video", codec_name: "h264" } as any,
              { index: 1, codec_type: "audio", codec_name: "aac" } as any,
            ],
          } as any,
        }),
        createMockMediaFile({
          id: "3",
          path: "/video3.mp4",
          probeData: {
            streams: [{ index: 0, codec_type: "video", codec_name: "h264" } as any], // No audio
          } as any,
        }),
      ]

      const addedFiles = new Set(["/video1.mp4"])
      const result = getRemainingMediaCounts(media, addedFiles)

      expect(result.remainingVideoCount).toBe(1) // Only video2.mp4 (video3 has no audio)
      expect(result.remainingAudioCount).toBe(0)
      expect(result.allFilesAdded).toBe(false)
    })

    it("should count remaining audio files", () => {
      const media: MediaFile[] = [
        createMockMediaFile({
          id: "1",
          path: "/audio1.mp3",
          isAudio: true,
          probeData: {
            streams: [{ index: 2, codec_type: "audio", codec_name: "mp3" } as any],
          } as any,
        }),
        createMockMediaFile({
          id: "2",
          path: "/audio2.mp3",
          isAudio: true,
          probeData: {
            streams: [{ index: 2, codec_type: "audio", codec_name: "mp3" } as any],
          } as any,
        }),
      ]

      const addedFiles = new Set<string>()
      const result = getRemainingMediaCounts(media, addedFiles)

      expect(result.remainingVideoCount).toBe(0)
      expect(result.remainingAudioCount).toBe(2)
      expect(result.allFilesAdded).toBe(false)
    })

    it("should report allFilesAdded when all files with audio are added", () => {
      const media: MediaFile[] = [
        createMockMediaFile({
          id: "1",
          path: "/video1.mp4",
          probeData: {
            streams: [
              { index: 0, codec_type: "video", codec_name: "h264" } as any,
              { index: 1, codec_type: "audio", codec_name: "aac" } as any,
            ],
          } as any,
        }),
        createMockMediaFile({
          id: "2",
          path: "/video2.mp4",
          probeData: {
            streams: [{ index: 0, codec_type: "video", codec_name: "h264" } as any], // No audio
          } as any,
        }),
      ]

      const addedFiles = new Set(["/video1.mp4"])
      const result = getRemainingMediaCounts(media, addedFiles)

      expect(result.allFilesAdded).toBe(true) // All files with audio are added
    })

    it("should handle empty media array", () => {
      const result = getRemainingMediaCounts([], new Set())

      expect(result.remainingVideoCount).toBe(0)
      expect(result.remainingAudioCount).toBe(0)
      expect(result.allFilesAdded).toBe(false)
    })

    it("should handle files without paths", () => {
      const media: MediaFile[] = [
        createMockMediaFile({
          id: "1",
          path: undefined,
          probeData: {
            streams: [
              { index: 0, codec_type: "video", codec_name: "h264" } as any,
              { index: 1, codec_type: "audio", codec_name: "aac" } as any,
            ],
          } as any,
        }),
      ]

      const result = getRemainingMediaCounts(media, new Set())

      expect(result.remainingVideoCount).toBe(0)
      expect(result.remainingAudioCount).toBe(0)
      expect(result.allFilesAdded).toBe(false)
    })
  })

  describe("isHorizontalVideo", () => {
    it("should return true for horizontal video (width > height)", () => {
      expect(isHorizontalVideo(1920, 1080)).toBe(true)
      expect(isHorizontalVideo(1280, 720)).toBe(true)
      expect(isHorizontalVideo(16, 9)).toBe(true)
    })

    it("should return false for vertical video (width < height)", () => {
      expect(isHorizontalVideo(1080, 1920)).toBe(false)
      expect(isHorizontalVideo(720, 1280)).toBe(false)
      expect(isHorizontalVideo(9, 16)).toBe(false)
    })

    it("should return false for square video (width = height)", () => {
      expect(isHorizontalVideo(1080, 1080)).toBe(false)
      expect(isHorizontalVideo(720, 720)).toBe(false)
    })

    it("should handle 90 degree rotation", () => {
      // Original horizontal becomes vertical after 90° rotation
      expect(isHorizontalVideo(1920, 1080, 90)).toBe(false)
      // Original vertical becomes horizontal after 90° rotation
      expect(isHorizontalVideo(1080, 1920, 90)).toBe(true)
    })

    it("should handle -90 degree rotation", () => {
      // Original horizontal becomes vertical after -90° rotation
      expect(isHorizontalVideo(1920, 1080, -90)).toBe(false)
      // Original vertical becomes horizontal after -90° rotation
      expect(isHorizontalVideo(1080, 1920, -90)).toBe(true)
    })

    it("should handle 270 degree rotation", () => {
      // Original horizontal becomes vertical after 270° rotation
      expect(isHorizontalVideo(1920, 1080, 270)).toBe(false)
      // Original vertical becomes horizontal after 270° rotation
      expect(isHorizontalVideo(1080, 1920, 270)).toBe(true)
    })

    it("should handle 0 degree rotation (no rotation)", () => {
      expect(isHorizontalVideo(1920, 1080, 0)).toBe(true)
      expect(isHorizontalVideo(1080, 1920, 0)).toBe(false)
    })

    it("should handle 180 degree rotation", () => {
      // 180° rotation doesn't change orientation
      expect(isHorizontalVideo(1920, 1080, 180)).toBe(true)
      expect(isHorizontalVideo(1080, 1920, 180)).toBe(false)
    })

    it("should handle undefined rotation", () => {
      expect(isHorizontalVideo(1920, 1080, undefined)).toBe(true)
      expect(isHorizontalVideo(1080, 1920, undefined)).toBe(false)
    })
  })

  describe("doTimeRangesOverlap", () => {
    it("should return true for overlapping ranges", () => {
      // Complete overlap
      expect(doTimeRangesOverlap(0, 10, 0, 10)).toBe(true)

      // Partial overlap
      expect(doTimeRangesOverlap(0, 10, 5, 15)).toBe(true)
      expect(doTimeRangesOverlap(5, 15, 0, 10)).toBe(true)

      // One range contains another
      expect(doTimeRangesOverlap(0, 20, 5, 15)).toBe(true)
      expect(doTimeRangesOverlap(5, 15, 0, 20)).toBe(true)
    })

    it("should return false for non-overlapping ranges", () => {
      // Ranges far apart
      expect(doTimeRangesOverlap(0, 10, 20, 30)).toBe(false)
      expect(doTimeRangesOverlap(20, 30, 0, 10)).toBe(false)
    })

    it("should consider 1-second gap between ranges", () => {
      // Adjacent ranges with exactly 1 second gap - should not overlap
      expect(doTimeRangesOverlap(0, 10, 11, 20)).toBe(false)
      expect(doTimeRangesOverlap(11, 20, 0, 10)).toBe(false)

      // Adjacent ranges without gap - should not overlap due to 1-second rule
      expect(doTimeRangesOverlap(0, 10, 10, 20)).toBe(false)
      expect(doTimeRangesOverlap(10, 20, 0, 10)).toBe(false)

      // Ranges with 0.5 second gap - should still not overlap due to 1-second rule
      expect(doTimeRangesOverlap(0, 10, 9.5, 20)).toBe(false)
      expect(doTimeRangesOverlap(9.5, 20, 0, 10)).toBe(false)

      // Ranges with actual overlap (more than 1 second) - should overlap
      expect(doTimeRangesOverlap(0, 10, 8.5, 20)).toBe(true)
      expect(doTimeRangesOverlap(8.5, 20, 0, 10)).toBe(true)
    })

    it("should handle edge cases", () => {
      // Zero-length ranges
      expect(doTimeRangesOverlap(5, 5, 5, 5)).toBe(false)
      expect(doTimeRangesOverlap(5, 5, 4, 6)).toBe(false)

      // Negative values
      expect(doTimeRangesOverlap(-10, -5, -8, -3)).toBe(true)
      expect(doTimeRangesOverlap(-10, -5, -20, -15)).toBe(false)

      // Very small overlaps
      expect(doTimeRangesOverlap(0, 10, 9.2, 20)).toBe(false) // Due to 1-second gap rule
      expect(doTimeRangesOverlap(0, 10, 8, 20)).toBe(true) // More than 1 second overlap
    })

    it("should be symmetric", () => {
      // The function should return the same result regardless of parameter order
      const testCases = [
        [0, 10, 5, 15],
        [0, 10, 10, 20],
        [0, 10, 20, 30],
        [-5, 5, -2, 8],
      ]

      for (const [s1, e1, s2, e2] of testCases) {
        expect(doTimeRangesOverlap(s1, e1, s2, e2)).toBe(doTimeRangesOverlap(s2, e2, s1, e1))
      }
    })
  })
})

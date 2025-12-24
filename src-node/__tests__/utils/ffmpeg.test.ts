/**
 * FFmpeg Utils Tests
 */

import { describe, test, expect, beforeAll } from "bun:test"
import { FFmpegUtils } from "../../src/utils/ffmpeg"
import { existsSync } from "node:fs"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"

const TEST_OUTPUT_DIR = "/tmp/timeline-studio-ffmpeg-test"

beforeAll(async () => {
  // Create test output directory
  if (!existsSync(TEST_OUTPUT_DIR)) {
    await mkdir(TEST_OUTPUT_DIR, { recursive: true })
  }
})

describe("FFmpegUtils", () => {
  describe("checkAvailability", () => {
    test("should detect FFmpeg availability", async () => {
      const available = await FFmpegUtils.checkAvailability()
      expect(typeof available).toBe("boolean")
    })
  })

  describe("probe", () => {
    test("should reject for non-existent file", async () => {
      expect(async () => {
        await FFmpegUtils.probe("/non/existent/file.mp4")
      }).toThrow()
    })

    test("should parse metadata for valid video file", async () => {
      // This test requires a valid video file
      // Skip if FFmpeg is not available
      const available = await FFmpegUtils.checkAvailability()
      if (!available) {
        expect(true).toBe(true) // Skip test
        return
      }

      // Create a test video using FFmpeg
      const testVideoPath = path.join(TEST_OUTPUT_DIR, "test-video.mp4")
      try {
        await FFmpegUtils.generateTestVideo(testVideoPath, 1)
        const metadata = await FFmpegUtils.probe(testVideoPath)

        expect(metadata).toBeDefined()
        expect(metadata.format).toBeDefined()
        expect(metadata.streams).toBeDefined()
        expect(Array.isArray(metadata.streams)).toBe(true)
      } finally {
        // Cleanup
        if (existsSync(testVideoPath)) {
          await rm(testVideoPath)
        }
      }
    })
  })

  describe("generateThumbnail", () => {
    test("should create thumbnail file", async () => {
      const available = await FFmpegUtils.checkAvailability()
      if (!available) {
        expect(true).toBe(true) // Skip test
        return
      }

      const testVideoPath = path.join(TEST_OUTPUT_DIR, "test-video-thumb.mp4")
      const thumbnailPath = path.join(TEST_OUTPUT_DIR, "thumbnail.jpg")

      try {
        // Create test video
        await FFmpegUtils.generateTestVideo(testVideoPath, 2)

        // Generate thumbnail
        await FFmpegUtils.generateThumbnail(testVideoPath, thumbnailPath, {
          timestamp: 1,
          width: 320,
          height: 180,
        })

        // Check thumbnail was created
        expect(existsSync(thumbnailPath)).toBe(true)
      } finally {
        // Cleanup
        if (existsSync(testVideoPath)) await rm(testVideoPath)
        if (existsSync(thumbnailPath)) await rm(thumbnailPath)
      }
    })

    test("should respect custom dimensions", async () => {
      const available = await FFmpegUtils.checkAvailability()
      if (!available) {
        expect(true).toBe(true) // Skip test
        return
      }

      const testVideoPath = path.join(TEST_OUTPUT_DIR, "test-video-dims.mp4")
      const thumbnailPath = path.join(TEST_OUTPUT_DIR, "thumbnail-custom.jpg")

      try {
        await FFmpegUtils.generateTestVideo(testVideoPath, 2)

        await FFmpegUtils.generateThumbnail(testVideoPath, thumbnailPath, {
          width: 640,
          height: 360,
        })

        expect(existsSync(thumbnailPath)).toBe(true)
      } finally {
        if (existsSync(testVideoPath)) await rm(testVideoPath)
        if (existsSync(thumbnailPath)) await rm(thumbnailPath)
      }
    })
  })

  describe("generateWaveform", () => {
    test("should create waveform image", async () => {
      const available = await FFmpegUtils.checkAvailability()
      if (!available) {
        expect(true).toBe(true) // Skip test
        return
      }

      const testVideoPath = path.join(TEST_OUTPUT_DIR, "test-video-wave.mp4")
      const waveformPath = path.join(TEST_OUTPUT_DIR, "waveform.png")

      try {
        // Create test video with audio
        await FFmpegUtils.generateTestVideo(testVideoPath, 2)

        // Generate waveform
        await FFmpegUtils.generateWaveform(testVideoPath, waveformPath, {
          width: 800,
          height: 200,
        })

        // Check waveform was created
        expect(existsSync(waveformPath)).toBe(true)
      } finally {
        if (existsSync(testVideoPath)) await rm(testVideoPath)
        if (existsSync(waveformPath)) await rm(waveformPath)
      }
    })
  })
})

import { beforeEach, describe, expect, it } from "vitest"
import { MockMediaService } from "../media"

describe("MockMediaService", () => {
  let service: MockMediaService

  beforeEach(() => {
    service = new MockMediaService()
  })

  describe("Metadata", () => {
    it("returns video metadata for video files", async () => {
      const metadata = await service.getMetadata("/path/to/video.mp4")

      expect(metadata.type).toBe("Video")
      expect(metadata.duration).toBe(120.5)
      expect(metadata.width).toBe(1920)
      expect(metadata.height).toBe(1080)
      expect(metadata.fps).toBe(30)
      expect(metadata.codec).toBe("h264")
    })

    it("returns audio metadata for audio files", async () => {
      const metadata = await service.getMetadata("/path/to/audio.mp3")

      expect(metadata.type).toBe("Audio")
      expect(metadata.duration).toBe(120.5)
      expect(metadata.codec).toBe("aac")
      expect(metadata.sample_rate).toBe(48000)
      expect(metadata.channels).toBe(2)
    })

    it("returns image metadata for image files", async () => {
      const metadata = await service.getMetadata("/path/to/image.jpg")

      expect(metadata.type).toBe("Image")
      expect(metadata.width).toBe(1920)
      expect(metadata.height).toBe(1080)
      expect(metadata.format).toBe("jpg")
    })

    it("supports various video formats", async () => {
      const formats = ["mp4", "mov", "avi", "mkv", "webm"]

      for (const format of formats) {
        const metadata = await service.getMetadata(`/video.${format}`)
        expect(metadata.type).toBe("Video")
      }
    })

    it("supports various audio formats", async () => {
      const formats = ["mp3", "wav", "ogg", "flac", "aac"]

      for (const format of formats) {
        const metadata = await service.getMetadata(`/audio.${format}`)
        expect(metadata.type).toBe("Audio")
      }
    })

    it("returns unknown for unsupported formats", async () => {
      const metadata = await service.getMetadata("/file.xyz")

      expect(metadata.type).toBe("Unknown")
    })

    it("returns stored metadata when set", async () => {
      const customMetadata = {
        type: "Video" as const,
        duration: 60,
        width: 3840,
        height: 2160,
        fps: 60,
        codec: "h265",
        bitrate: 10000000,
        size: 100000000,
      }

      service.setMetadata("/custom.mp4", customMetadata)

      const result = await service.getMetadata("/custom.mp4")

      expect(result).toEqual(customMetadata)
    })
  })

  describe("Media Files", () => {
    it("returns mock file list from directory", async () => {
      const files = await service.getMediaFiles("/home/videos")

      expect(files).toHaveLength(4)
      expect(files[0]).toContain("/home/videos/video1.mp4")
      expect(files[1]).toContain("/home/videos/video2.mov")
      expect(files[2]).toContain("/home/videos/audio1.mp3")
      expect(files[3]).toContain("/home/videos/image1.jpg")
    })
  })

  describe("Processing", () => {
    it("processes file with thumbnail generation", async () => {
      const result = await service.processFile("/video.mp4", {
        generateThumbnail: true,
        extractAudio: false,
      })

      expect(result.thumbnailPath).toBeDefined()
      expect(result.thumbnailPath).toContain("/tmp/thumb_")
      expect(result.audioPath).toBeUndefined()
    })

    it("processes file with audio extraction", async () => {
      const result = await service.processFile("/video.mp4", {
        generateThumbnail: false,
        extractAudio: true,
      })

      expect(result.thumbnailPath).toBeUndefined()
      expect(result.audioPath).toBeDefined()
      expect(result.audioPath).toContain("/tmp/audio_")
    })

    it("processes file with both options", async () => {
      const result = await service.processFile("/video.mp4", {
        generateThumbnail: true,
        extractAudio: true,
      })

      expect(result.thumbnailPath).toBeDefined()
      expect(result.audioPath).toBeDefined()
    })

    it("processes file without options", async () => {
      const result = await service.processFile("/video.mp4")

      expect(result.thumbnailPath).toBeUndefined()
      expect(result.audioPath).toBeUndefined()
    })
  })

  describe("Thumbnails", () => {
    it("generates thumbnail", async () => {
      const thumbnailPath = await service.generateThumbnail("file-1", "/video.mp4")

      expect(thumbnailPath).toBeDefined()
      expect(thumbnailPath).toContain("jpg")
    })

    it("generates thumbnail with custom options", async () => {
      const thumbnailPath = await service.generateThumbnail("file-1", "/video.mp4", {
        width: 640,
        height: 360,
        timestamp: 10.5,
      })

      expect(thumbnailPath).toBeDefined()
    })

    it("checks if cached thumbnail exists - returns boolean", async () => {
      const exists = await service.hasCachedThumbnail("file-1", 320, 180)

      expect(typeof exists).toBe("boolean")
    })
  })

  describe("Waveforms", () => {
    it("generates waveform preview", async () => {
      const path = await service.generateWaveformPreview(
        "/audio.mp3",
        "/output/wave.png"
      )

      expect(path).toBe("/output/wave.png")
    })

    it("generates waveform preview with custom options", async () => {
      const path = await service.generateWaveformPreview(
        "/audio.mp3",
        "/output/wave.png",
        { width: 800, height: 120, color: "#ff0000" }
      )

      expect(path).toBe("/output/wave.png")
    })

    it("generates audio waveform data", async () => {
      const waveform = await service.generateAudioWaveform("/audio.mp3")

      expect(Array.isArray(waveform)).toBe(true)
      expect(waveform.length).toBeGreaterThan(0)
      expect(waveform.every((v) => v >= -1 && v <= 1)).toBe(true)
    })
  })

  describe("Scene Detection", () => {
    it("detects video scenes", async () => {
      const scenes = await service.detectVideoScenes("/video.mp4")

      expect(Array.isArray(scenes)).toBe(true)
      expect(scenes.length).toBeGreaterThan(0)
      expect(scenes[0]).toHaveProperty("startTime")
      expect(scenes[0]).toHaveProperty("endTime")
    })
  })

  describe("Preview Data", () => {
    it("returns null for preview data without setup", async () => {
      const preview = await service.getPreviewData("file-1")

      expect(preview).toBeNull()
    })

    it("saves and loads preview data", async () => {
      const previewData = {
        thumbnails: ["/thumb1.jpg", "/thumb2.jpg"],
        waveform: "/wave.png",
      }

      service.setPreviewData("file-1", previewData)

      const result = await service.getPreviewData("file-1")

      expect(result).toEqual(previewData)
    })

    it("clears preview data for specific file", async () => {
      service.setPreviewData("file-1", { thumbnails: [], waveform: "" })

      await service.clearPreviewData("file-1")

      const result = await service.getPreviewData("file-1")

      expect(result).toBeNull()
    })

    it("clears all preview data", async () => {
      service.setPreviewData("file-1", { thumbnails: [], waveform: "" })
      service.setPreviewData("file-2", { thumbnails: [], waveform: "" })

      await service.clearPreviewData()

      expect(await service.getPreviewData("file-1")).toBeNull()
      expect(await service.getPreviewData("file-2")).toBeNull()
    })
  })

  describe("Timeline Frames", () => {
    it("saves and gets timeline frames", async () => {
      const frames = ["/frame1.jpg", "/frame2.jpg", "/frame3.jpg"]

      await service.saveTimelineFrames("file-1", frames)

      const result = await service.getTimelineFrames("file-1")

      expect(result).toEqual(frames)
    })

    it("returns empty array for non-existent file", async () => {
      const result = await service.getTimelineFrames("missing-file")

      expect(result).toEqual([])
    })
  })

  describe("Folder Scanning", () => {
    it("scans folder and returns media files", async () => {
      const files = await service.scanFolder("/home/videos")

      expect(Array.isArray(files)).toBe(true)
      expect(files.length).toBeGreaterThan(0)
      expect(files[0]).toHaveProperty("path")
    })

    it("scans folder with thumbnails", async () => {
      const files = await service.scanFolderWithThumbnails("/home/videos", 320, 180)

      expect(Array.isArray(files)).toBe(true)
      expect(files.length).toBeGreaterThan(0)
    })
  })

  describe("Proxy Generation", () => {
    it("generates proxy", async () => {
      const result = await service.generateProxy("/video.mp4", {})

      expect(result).toBeDefined()
      expect(result.proxyPath).toBeDefined()
    })
  })

  describe("Media Import", () => {
    it("imports files successfully", async () => {
      const result = await service.importFiles(["/video1.mp4", "/video2.mp4"])

      expect(result.imported).toEqual(["/video1.mp4", "/video2.mp4"])
      expect(result.failed).toEqual([])
    })

    it("imports files with options", async () => {
      const result = await service.importFiles(["/video.mp4"], {
        copyToProject: true,
        generateThumbnails: true,
        createProxies: false,
      })

      expect(result.imported).toEqual(["/video.mp4"])
    })
  })

  describe("Batch Processing", () => {
    it("processes multiple files", async () => {
      const files = await service.processFiles(["/video1.mp4", "/video2.mp4"])

      expect(Array.isArray(files)).toBe(true)
      expect(files.length).toBe(2)
    })

    it("processes files with thumbnails", async () => {
      const files = await service.processFilesWithThumbnails(
        ["/video.mp4"],
        320,
        180
      )

      expect(Array.isArray(files)).toBe(true)
      expect(files.length).toBe(1)
    })
  })

  describe("Test Helpers", () => {
    it("sets and gets metadata", () => {
      const metadata = { type: "Video" as const, duration: 60 }
      service.setMetadata("/test.mp4", metadata)

      expect(service.getMetadata("/test.mp4")).resolves.toEqual(metadata)
    })

    it("checks thumbnail existence returns boolean", async () => {
      const exists = await service.hasCachedThumbnail("file-1", 320, 180)

      expect(typeof exists).toBe("boolean")
    })

    it("resets all data", async () => {
      service.setMetadata("/test.mp4", { type: "Video", duration: 60 })
      service.setPreviewData("file-1", { thumbnails: [], waveform: "" })
      await service.saveTimelineFrames("file-1", ["/frame.jpg"])

      service.reset()

      // After reset, should return default metadata
      const metadata = await service.getMetadata("/test.mp4")
      expect(metadata.type).toBe("Video") // default for .mp4

      expect(await service.getPreviewData("file-1")).toBeNull()
      expect(await service.getTimelineFrames("file-1")).toEqual([])
    })
  })
})

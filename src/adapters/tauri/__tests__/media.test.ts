import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriMediaService } from "../media"

const mockInvoke = vi.fn()

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debugSync: vi.fn(),
    infoSync: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

describe("TauriMediaService", () => {
  let service: TauriMediaService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TauriMediaService()
  })

  describe("Metadata", () => {
    it("gets media metadata", async () => {
      const metadata = {
        duration: 120.5,
        width: 1920,
        height: 1080,
        fps: 30,
        hasAudio: true,
        hasVideo: true,
      }

      mockInvoke.mockResolvedValueOnce(metadata)

      const result = await service.getMetadata("/path/to/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("get_media_metadata", {
        filePath: "/path/to/video.mp4",
      })
      expect(result).toEqual(metadata)
    })

    it("propagates metadata errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("File not found"))

      await expect(service.getMetadata("/missing.mp4")).rejects.toThrow("File not found")
    })

    it("gets media files from directory", async () => {
      const files = ["/dir/video1.mp4", "/dir/video2.mov"]
      mockInvoke.mockResolvedValueOnce(files)

      const result = await service.getMediaFiles("/dir")

      expect(mockInvoke).toHaveBeenCalledWith("get_media_files", {
        directory: "/dir",
      })
      expect(result).toEqual(files)
    })
  })

  describe("Processing", () => {
    it("processes file with default options", async () => {
      const processResult = {
        success: true,
        thumbnailPath: "/cache/thumb.jpg",
      }

      mockInvoke.mockResolvedValueOnce(processResult)

      const result = await service.processFile("/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("process_media_file_simple", {
        filePath: "/video.mp4",
        generateThumbnail: true,
        extractAudio: false,
      })
      expect(result).toEqual(processResult)
    })

    it("processes file with custom options", async () => {
      mockInvoke.mockResolvedValueOnce({ success: true })

      await service.processFile("/video.mp4", {
        generateThumbnail: false,
        extractAudio: true,
      })

      expect(mockInvoke).toHaveBeenCalledWith("process_media_file_simple", {
        filePath: "/video.mp4",
        generateThumbnail: false,
        extractAudio: true,
      })
    })
  })

  describe("Thumbnails", () => {
    it("generates thumbnail with default options", async () => {
      mockInvoke.mockResolvedValueOnce("/cache/thumb.jpg")

      const result = await service.generateThumbnail("file-1", "/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId: "file-1",
        filePath: "/video.mp4",
        width: 320,
        height: 180,
        timestamp: 0,
      })
      expect(result).toBe("/cache/thumb.jpg")
    })

    it("generates thumbnail with custom options", async () => {
      mockInvoke.mockResolvedValueOnce("/cache/thumb.jpg")

      await service.generateThumbnail("file-1", "/video.mp4", {
        timestamp: 5.5,
        width: 640,
        height: 360,
      })

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId: "file-1",
        filePath: "/video.mp4",
        width: 640,
        height: 360,
        timestamp: 5.5,
      })
    })
  })

  describe("Waveforms", () => {
    it("generates waveform preview", async () => {
      mockInvoke.mockResolvedValueOnce("/cache/waveform.png")

      const result = await service.generateWaveformPreview(
        "/audio.mp3",
        "/output/wave.png"
      )

      expect(mockInvoke).toHaveBeenCalledWith("generate_waveform_preview", {
        audioPath: "/audio.mp3",
        outputPath: "/output/wave.png",
        width: 1000,
        height: 100,
        color: "#3b82f6",
      })
      expect(result).toBe("/cache/waveform.png")
    })
  })

  describe("Folder Scanning", () => {
    it("scans folder for media files", async () => {
      const files = [
        { path: "/folder/video1.mp4", size: 1024, duration: 120 },
        { path: "/folder/video2.mov", size: 2048, duration: 60 },
      ]

      mockInvoke.mockResolvedValueOnce(files)

      const result = await service.scanFolder("/folder")

      expect(mockInvoke).toHaveBeenCalledWith("scan_media_folder", {
        folderPath: "/folder",
      })
      expect(result).toEqual(files)
    })
  })

  describe("Proxy Generation", () => {
    it("generates proxy with empty options", async () => {
      const proxyResult = {
        success: true,
        proxyPath: "/cache/proxy.mp4",
        originalPath: "/video.mp4",
      }

      mockInvoke.mockResolvedValueOnce(proxyResult)

      const result = await service.generateProxy("/video.mp4", { width: 1280, height: 720 })

      expect(mockInvoke).toHaveBeenCalledWith("generate_proxy_command", {
        sourcePath: "/video.mp4",
        width: 1280,
        height: 720,
        codec: "h264",
        bitrate: "3M",
        preserveAudio: true,
        fps: undefined,
      })
      expect(result).toEqual(proxyResult)
    })
  })

  describe("Media Import", () => {
    it("imports media files", async () => {
      const importResult = {
        imported: ["/video1.mp4", "/video2.mp4"],
        failed: [],
      }

      mockInvoke.mockResolvedValueOnce(importResult)

      const result = await service.importFiles(["/video1.mp4", "/video2.mp4"])

      expect(mockInvoke).toHaveBeenCalledWith("import_media_files", {
        paths: ["/video1.mp4", "/video2.mp4"],
        options: expect.objectContaining({
          copy_to_project: true,
          generate_thumbnails: true,
        }),
      })
      expect(result).toEqual(importResult)
    })
  })

  describe("Timeline Frames", () => {
    it("saves timeline frames", async () => {
      const frames = ["/frame1.jpg", "/frame2.jpg"]
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.saveTimelineFrames("file-1", frames)

      expect(mockInvoke).toHaveBeenCalledWith("save_timeline_frames", {
        fileId: "file-1",
        frames,
      })
    })

    it("gets timeline frames", async () => {
      const frames = ["/frame1.jpg", "/frame2.jpg"]
      mockInvoke.mockResolvedValueOnce(frames)

      const result = await service.getTimelineFrames("file-1")

      expect(mockInvoke).toHaveBeenCalledWith("get_timeline_frames", {
        fileId: "file-1",
      })
      expect(result).toEqual(frames)
    })
  })

  describe("Preview Data", () => {
    it("gets preview data for media file", async () => {
      const previewData = {
        thumbnails: ["/thumb1.jpg", "/thumb2.jpg"],
        waveform: "/wave.png",
      }

      mockInvoke.mockResolvedValueOnce(previewData)

      const result = await service.getPreviewData("file-1")

      expect(mockInvoke).toHaveBeenCalledWith("get_media_preview_data", {
        fileId: "file-1",
      })
      expect(result).toEqual(previewData)
    })

    it("clears preview data for specific file", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.clearPreviewData("file-1")

      expect(mockInvoke).toHaveBeenCalledWith("clear_media_preview_data", {
        fileId: "file-1",
      })
    })
  })



  describe("Processing Cancellation", () => {
    it("cancels file processing", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.cancelProcessing("/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("cancel_media_processing", {
        filePath: "/video.mp4",
      })
    })
  })

  describe("Cached Thumbnails", () => {
    it("checks if cached thumbnail exists", async () => {
      mockInvoke.mockResolvedValueOnce(true)

      const result = await service.hasCachedThumbnail("file-1", 320, 180)

      expect(mockInvoke).toHaveBeenCalledWith("has_cached_thumbnail", {
        fileId: "file-1",
        width: 320,
        height: 180,
      })
      expect(result).toBe(true)
    })

    it("gets cached thumbnail path", async () => {
      mockInvoke.mockResolvedValueOnce("/cache/thumb.jpg")

      const result = await service.getCachedThumbnailPath("file-1", 640, 360)

      expect(mockInvoke).toHaveBeenCalledWith("get_cached_thumbnail_path", {
        fileId: "file-1",
        width: 640,
        height: 360,
      })
      expect(result).toBe("/cache/thumb.jpg")
    })
  })

  describe("Preview Data Operations", () => {
    it("saves preview data", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.savePreviewData("/path/to/preview")

      expect(mockInvoke).toHaveBeenCalledWith("save_preview_data", {
        path: "/path/to/preview",
      })
    })

    it("loads preview data", async () => {
      const previewData = { thumbnails: [], waveform: "/wave.png" }
      mockInvoke.mockResolvedValueOnce(previewData)

      const result = await service.loadPreviewData("/path/to/preview")

      expect(mockInvoke).toHaveBeenCalledWith("load_preview_data", {
        path: "/path/to/preview",
      })
      expect(result).toEqual(previewData)
    })

    it("clears all preview data when no fileId provided", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.clearPreviewData()

      expect(mockInvoke).toHaveBeenCalledWith("clear_media_preview_data")
    })
  })

  describe("Folder Scanning with Thumbnails", () => {
    it("scans folder with thumbnails", async () => {
      const files = [{ path: "/folder/video.mp4", size: 1024 }]
      mockInvoke.mockResolvedValueOnce(files)

      const result = await service.scanFolderWithThumbnails("/folder", 320, 180)

      expect(mockInvoke).toHaveBeenCalledWith("scan_media_folder_with_thumbnails", {
        folderPath: "/folder",
        width: 320,
        height: 180,
      })
      expect(result).toEqual(files)
    })
  })

  describe("Cache Management", () => {
    it("gets files with previews", async () => {
      const files = ["file-1", "file-2", "file-3"]
      mockInvoke.mockResolvedValueOnce(files)

      const result = await service.getFilesWithPreviews()

      expect(mockInvoke).toHaveBeenCalledWith("get_files_with_previews")
      expect(result).toEqual(files)
    })

    it("restores preview cache", async () => {
      mockInvoke.mockResolvedValueOnce(42)

      const result = await service.restorePreviewCache()

      expect(mockInvoke).toHaveBeenCalledWith("restore_preview_cache")
      expect(result).toBe(42)
    })
  })

  describe("Device Operations", () => {
    it("ejects device", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      await service.ejectDevice("device-123")

      expect(mockInvoke).toHaveBeenCalledWith("eject_device", {
        deviceId: "device-123",
      })
    })
  })

  describe("Batch Processing", () => {
    it("processes multiple files", async () => {
      const files = [
        { path: "/video1.mp4", duration: 120 },
        { path: "/video2.mp4", duration: 60 },
      ]
      mockInvoke.mockResolvedValueOnce(files)

      const result = await service.processFiles(["/video1.mp4", "/video2.mp4"])

      expect(mockInvoke).toHaveBeenCalledWith("process_media_files", {
        filePaths: ["/video1.mp4", "/video2.mp4"],
      })
      expect(result).toEqual(files)
    })

    it("processes files with thumbnails", async () => {
      const files = [{ path: "/video.mp4", thumbnail: "/thumb.jpg" }]
      mockInvoke.mockResolvedValueOnce(files)

      const result = await service.processFilesWithThumbnails(
        ["/video.mp4"],
        320,
        180
      )

      expect(mockInvoke).toHaveBeenCalledWith("process_media_files_with_thumbnails", {
        filePaths: ["/video.mp4"],
        width: 320,
        height: 180,
      })
      expect(result).toEqual(files)
    })
  })

  describe("Audio Analysis", () => {
    it("generates audio waveform", async () => {
      const waveform = [0.1, 0.2, 0.3, 0.4]
      mockInvoke.mockResolvedValueOnce(waveform)

      const result = await service.generateAudioWaveform("/audio.mp3")

      expect(mockInvoke).toHaveBeenCalledWith("generate_audio_waveform", {
        path: "/audio.mp3",
      })
      expect(result).toEqual(waveform)
    })
  })

  describe("Video Analysis", () => {
    it("detects video scenes", async () => {
      const scenes = [
        { startTime: 0, endTime: 10 },
        { startTime: 10, endTime: 20 },
      ]
      mockInvoke.mockResolvedValueOnce(scenes)

      const result = await service.detectVideoScenes("/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("detect_video_scenes", {
        path: "/video.mp4",
      })
      expect(result).toEqual(scenes)
    })

    it("generates video thumbnail at specific time", async () => {
      mockInvoke.mockResolvedValueOnce("/thumb.jpg")

      const result = await service.generateVideoThumbnail("/video.mp4", 5.5)

      expect(mockInvoke).toHaveBeenCalledWith("generate_video_thumbnail", {
        videoPath: "/video.mp4",
        time: 5.5,
      })
      expect(result).toBe("/thumb.jpg")
    })
  })

  describe("Metadata Extraction", () => {
    it("extracts media metadata", async () => {
      const metadata = { duration: 120, width: 1920, height: 1080 }
      mockInvoke.mockResolvedValueOnce(metadata)

      const result = await service.extractMediaMetadata("/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("extract_media_metadata", {
        path: "/video.mp4",
      })
      expect(result).toEqual(metadata)
    })

    it("gets media duration", async () => {
      mockInvoke.mockResolvedValueOnce({
        success: true,
        data: 120.5,
      })

      const result = await service.getMediaDuration("/video.mp4")

      expect(mockInvoke).toHaveBeenCalledWith("execute_command", {
        command: {
          type: "GetMediaDuration",
          params: {
            file_path: "/video.mp4",
          },
        },
      })
      expect(result).toBe(120.5)
    })

    it("throws error when get media duration fails", async () => {
      mockInvoke.mockResolvedValueOnce({
        success: false,
        error: "File not found",
      })

      await expect(service.getMediaDuration("/missing.mp4")).rejects.toThrow("File not found")
    })
  })

  describe("Error Handling", () => {
    it("propagates invoke errors with logging", async () => {
      const error = new Error("Backend error")
      mockInvoke.mockRejectedValueOnce(error)

      await expect(service.getMetadata("/video.mp4")).rejects.toThrow("Backend error")
    })
  })
})

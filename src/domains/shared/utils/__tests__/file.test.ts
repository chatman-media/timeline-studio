/**
 * File Utilities Tests
 */

import { describe, expect, it } from "vitest"
import {
  addFileNameSuffix,
  formatFileSize,
  getDirectory,
  getFileExtension,
  getFileName,
  isAudioFile,
  isImageFile,
  isMediaFile,
  isVideoFile,
  normalizePath,
  parseFileSize,
  sanitizeFileName,
} from "../file"

describe("file utils", () => {
  describe("getFileExtension", () => {
    it("should extract file extension", () => {
      expect(getFileExtension("/path/to/video.mp4")).toBe("mp4")
      expect(getFileExtension("document.txt")).toBe("txt")
      expect(getFileExtension("C:\\Users\\file.avi")).toBe("avi")
    })

    it("should handle multiple dots in filename", () => {
      expect(getFileExtension("archive.tar.gz")).toBe("gz")
      expect(getFileExtension("my.file.name.mp4")).toBe("mp4")
    })

    it("should return empty string for files without extension", () => {
      expect(getFileExtension("no-extension")).toBe("")
      expect(getFileExtension("/path/to/file")).toBe("")
    })

    it("should return lowercase extension", () => {
      expect(getFileExtension("VIDEO.MP4")).toBe("mp4")
      expect(getFileExtension("File.TXT")).toBe("txt")
    })

    it("should handle hidden files", () => {
      expect(getFileExtension(".gitignore")).toBe("")
      expect(getFileExtension(".env.local")).toBe("local")
    })

    it("should handle invalid inputs", () => {
      expect(getFileExtension("")).toBe("")
      // @ts-expect-error - testing invalid input
      expect(getFileExtension(null)).toBe("")
      // @ts-expect-error - testing invalid input
      expect(getFileExtension(undefined)).toBe("")
    })
  })

  describe("getFileName", () => {
    it("should extract filename with extension", () => {
      expect(getFileName("/path/to/video.mp4")).toBe("video.mp4")
      expect(getFileName("C:\\Users\\file.txt")).toBe("file.txt")
    })

    it("should extract filename without extension", () => {
      expect(getFileName("/path/to/video.mp4", false)).toBe("video")
      expect(getFileName("document.txt", false)).toBe("document")
    })

    it("should handle files without path", () => {
      expect(getFileName("simple.mp4")).toBe("simple.mp4")
      expect(getFileName("simple.mp4", false)).toBe("simple")
    })

    it("should handle multiple dots", () => {
      expect(getFileName("archive.tar.gz", false)).toBe("archive.tar")
      expect(getFileName("my.file.name.mp4", false)).toBe("my.file.name")
    })

    it("should handle invalid inputs", () => {
      expect(getFileName("")).toBe("")
      // @ts-expect-error - testing invalid input
      expect(getFileName(null)).toBe("")
    })
  })

  describe("formatFileSize", () => {
    it("should format bytes", () => {
      expect(formatFileSize(0)).toBe("0 Bytes")
      expect(formatFileSize(500)).toBe("500.00 Bytes")
    })

    it("should format kilobytes", () => {
      expect(formatFileSize(1024)).toBe("1.00 KB")
      expect(formatFileSize(2048)).toBe("2.00 KB")
    })

    it("should format megabytes", () => {
      expect(formatFileSize(1536000)).toBe("1.46 MB")
      expect(formatFileSize(1024 * 1024)).toBe("1.00 MB")
    })

    it("should format gigabytes", () => {
      expect(formatFileSize(1536000000)).toBe("1.43 GB")
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.00 GB")
    })

    it("should respect decimal precision", () => {
      expect(formatFileSize(1536000, 0)).toBe("1 MB")
      expect(formatFileSize(1536000, 3)).toBe("1.465 MB")
    })

    it("should handle large values", () => {
      const terabyte = 1024 * 1024 * 1024 * 1024
      expect(formatFileSize(terabyte)).toBe("1.00 TB")
    })
  })

  describe("getDirectory", () => {
    it("should extract directory from Unix path", () => {
      expect(getDirectory("/path/to/file.mp4")).toBe("/path/to")
      expect(getDirectory("/usr/local/bin/app")).toBe("/usr/local/bin")
    })

    it("should extract directory from Windows path", () => {
      expect(getDirectory("C:\\Users\\file.txt")).toBe("C:\\Users")
    })

    it("should return empty for file without directory", () => {
      expect(getDirectory("file.txt")).toBe("")
    })

    it("should handle invalid inputs", () => {
      expect(getDirectory("")).toBe("")
      // @ts-expect-error - testing invalid input
      expect(getDirectory(null)).toBe("")
    })
  })

  describe("isVideoFile", () => {
    it("should detect video files", () => {
      expect(isVideoFile("video.mp4")).toBe(true)
      expect(isVideoFile("movie.mov")).toBe(true)
      expect(isVideoFile("clip.avi")).toBe(true)
      expect(isVideoFile("film.mkv")).toBe(true)
    })

    it("should reject non-video files", () => {
      expect(isVideoFile("audio.mp3")).toBe(false)
      expect(isVideoFile("image.jpg")).toBe(false)
      expect(isVideoFile("document.txt")).toBe(false)
    })

    it("should be case insensitive", () => {
      expect(isVideoFile("VIDEO.MP4")).toBe(true)
      expect(isVideoFile("Movie.MOV")).toBe(true)
    })
  })

  describe("isAudioFile", () => {
    it("should detect audio files", () => {
      expect(isAudioFile("song.mp3")).toBe(true)
      expect(isAudioFile("track.wav")).toBe(true)
      expect(isAudioFile("audio.aac")).toBe(true)
      expect(isAudioFile("music.flac")).toBe(true)
    })

    it("should reject non-audio files", () => {
      expect(isAudioFile("video.mp4")).toBe(false)
      expect(isAudioFile("image.jpg")).toBe(false)
    })

    it("should be case insensitive", () => {
      expect(isAudioFile("SONG.MP3")).toBe(true)
    })
  })

  describe("isImageFile", () => {
    it("should detect image files", () => {
      expect(isImageFile("photo.jpg")).toBe(true)
      expect(isImageFile("picture.png")).toBe(true)
      expect(isImageFile("graphic.svg")).toBe(true)
      expect(isImageFile("image.webp")).toBe(true)
    })

    it("should reject non-image files", () => {
      expect(isImageFile("video.mp4")).toBe(false)
      expect(isImageFile("audio.mp3")).toBe(false)
    })

    it("should be case insensitive", () => {
      expect(isImageFile("PHOTO.JPG")).toBe(true)
    })
  })

  describe("isMediaFile", () => {
    it("should detect all media files", () => {
      expect(isMediaFile("video.mp4")).toBe(true)
      expect(isMediaFile("audio.mp3")).toBe(true)
      expect(isMediaFile("image.jpg")).toBe(true)
    })

    it("should reject non-media files", () => {
      expect(isMediaFile("document.txt")).toBe(false)
      expect(isMediaFile("script.js")).toBe(false)
    })
  })

  describe("normalizePath", () => {
    it("should normalize Windows paths to Unix style", () => {
      expect(normalizePath("C:\\Users\\file.txt")).toBe("C:/Users/file.txt")
      expect(normalizePath("path\\to\\file")).toBe("path/to/file")
    })

    it("should keep Unix paths unchanged", () => {
      expect(normalizePath("/path/to/file")).toBe("/path/to/file")
    })

    it("should handle mixed slashes", () => {
      expect(normalizePath("path/to\\file")).toBe("path/to/file")
    })

    it("should handle invalid inputs", () => {
      expect(normalizePath("")).toBe("")
      // @ts-expect-error - testing invalid input
      expect(normalizePath(null)).toBe("")
    })
  })

  describe("parseFileSize", () => {
    it("should parse bytes", () => {
      expect(parseFileSize("1024 B")).toBe(1024)
      expect(parseFileSize("500 Bytes")).toBe(500)
    })

    it("should parse kilobytes", () => {
      expect(parseFileSize("1 KB")).toBe(1024)
      expect(parseFileSize("2.5 KB")).toBe(2560)
    })

    it("should parse megabytes", () => {
      expect(parseFileSize("1.5 MB")).toBe(1572864)
      expect(parseFileSize("10 MB")).toBe(10485760)
    })

    it("should parse gigabytes", () => {
      expect(parseFileSize("2 GB")).toBe(2147483648)
    })

    it("should be case insensitive", () => {
      expect(parseFileSize("1 mb")).toBe(1048576)
      expect(parseFileSize("1 Mb")).toBe(1048576)
    })

    it("should handle whitespace", () => {
      expect(parseFileSize("  1.5 MB  ")).toBe(1572864)
    })

    it("should return null for invalid formats", () => {
      expect(parseFileSize("invalid")).toBeNull()
      expect(parseFileSize("")).toBeNull()
      expect(parseFileSize("abc MB")).toBeNull()
      expect(parseFileSize("-5 MB")).toBeNull()
    })
  })

  describe("sanitizeFileName", () => {
    it("should remove invalid characters", () => {
      expect(sanitizeFileName('file:name.txt')).toBe('file-name.txt')
      expect(sanitizeFileName('my<file>.txt')).toBe('my-file-.txt')
      expect(sanitizeFileName('file/with\\slashes.txt')).toBe('file-with-slashes.txt')
    })

    it("should normalize whitespace", () => {
      expect(sanitizeFileName("file   with   spaces.txt")).toBe("file with spaces.txt")
      expect(sanitizeFileName("  file.txt  ")).toBe("file.txt")
    })

    it("should keep valid characters", () => {
      expect(sanitizeFileName("valid-file_name.txt")).toBe("valid-file_name.txt")
      expect(sanitizeFileName("file (1).txt")).toBe("file (1).txt")
    })

    it("should handle invalid inputs", () => {
      expect(sanitizeFileName("")).toBe("")
      // @ts-expect-error - testing invalid input
      expect(sanitizeFileName(null)).toBe("")
    })
  })

  describe("addFileNameSuffix", () => {
    it("should add suffix before extension", () => {
      expect(addFileNameSuffix("/path/to/video.mp4", "_edited")).toBe("/path/to/video_edited.mp4")
      expect(addFileNameSuffix("file.txt", "_backup")).toBe("file_backup.txt")
    })

    it("should work without directory", () => {
      expect(addFileNameSuffix("video.mp4", "_final")).toBe("video_final.mp4")
    })

    it("should work with files without extension", () => {
      expect(addFileNameSuffix("file", "_new")).toBe("file_new")
    })

    it("should preserve directory structure", () => {
      expect(addFileNameSuffix("/very/long/path/to/file.mp4", "_copy")).toBe(
        "/very/long/path/to/file_copy.mp4"
      )
    })

    it("should work with Windows paths", () => {
      // Note: addFileNameSuffix uses / for path separator
      // To preserve Windows paths, use normalizePath result or handle separately
      const result = addFileNameSuffix("C:\\Users\\file.txt", "_backup")
      expect(result).toContain("file_backup.txt")
      expect(result).toContain("C:")
      expect(result).toContain("Users")
    })
  })

  describe("edge cases", () => {
    it("should handle empty strings gracefully", () => {
      expect(getFileExtension("")).toBe("")
      expect(getFileName("")).toBe("")
      expect(getDirectory("")).toBe("")
    })

    it("should handle paths with only slashes", () => {
      expect(getFileName("/")).toBe("")
      expect(getDirectory("/")).toBe("")
    })

    it("should handle relative paths", () => {
      expect(getFileName("./file.txt")).toBe("file.txt")
      expect(getFileName("../parent/file.txt")).toBe("file.txt")
    })

    it("should handle paths with spaces", () => {
      expect(getFileName("/path with spaces/file name.txt")).toBe("file name.txt")
      expect(getDirectory("/path with spaces/file.txt")).toBe("/path with spaces")
    })
  })
})

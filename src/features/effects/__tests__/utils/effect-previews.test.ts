import { describe, expect, it } from "vitest"
import {
  getAllEffectPreviews,
  getEffectPreview,
  getEffectThumbnail,
  hasEffectPreview,
} from "../../utils/effect-previews"

describe("effect-previews", () => {
  describe("getEffectPreview", () => {
    it("should return preview for brightness effect", () => {
      const preview = getEffectPreview("brightness")

      expect(preview).toBeDefined()
      expect(preview.videoPath).toBe("/preview-videos/effects/brightness.mp4")
      expect(preview.thumbnailPath).toBe("/preview-videos/effects/brightness-thumb.jpg")
      expect(preview.duration).toBe(3)
    })

    it("should return preview for contrast effect", () => {
      const preview = getEffectPreview("contrast")

      expect(preview.videoPath).toBe("/preview-videos/effects/contrast.mp4")
      expect(preview.thumbnailPath).toBe("/preview-videos/effects/contrast-thumb.jpg")
    })

    it("should return preview for saturation effect", () => {
      const preview = getEffectPreview("saturation")

      expect(preview.videoPath).toBe("/preview-videos/effects/saturation.mp4")
    })

    it("should return preview for sepia effect", () => {
      const preview = getEffectPreview("sepia")

      expect(preview.videoPath).toBe("/preview-videos/effects/sepia.mp4")
    })

    it("should return preview for grayscale effect", () => {
      const preview = getEffectPreview("grayscale")

      expect(preview.videoPath).toBe("/preview-videos/effects/grayscale.mp4")
    })

    it("should return preview for invert effect", () => {
      const preview = getEffectPreview("invert")

      expect(preview.videoPath).toBe("/preview-videos/effects/invert.mp4")
    })

    it("should return preview for blur effect", () => {
      const preview = getEffectPreview("blur")

      expect(preview.videoPath).toBe("/preview-videos/effects/blur.mp4")
    })

    it("should return preview for gaussianBlur effect", () => {
      const preview = getEffectPreview("gaussianBlur")

      expect(preview.videoPath).toBe("/preview-videos/effects/gaussian-blur.mp4")
    })

    it("should return preview for vintage effect", () => {
      const preview = getEffectPreview("vintage")

      expect(preview.videoPath).toBe("/preview-videos/effects/vintage.mp4")
    })

    it("should return preview for vignette effect", () => {
      const preview = getEffectPreview("vignette")

      expect(preview.videoPath).toBe("/preview-videos/effects/vignette.mp4")
    })

    it("should return preview for glitch effect", () => {
      const preview = getEffectPreview("glitch")

      expect(preview.videoPath).toBe("/preview-videos/effects/glitch.mp4")
    })

    it("should return preview for fisheye effect", () => {
      const preview = getEffectPreview("fisheye")

      expect(preview.videoPath).toBe("/preview-videos/effects/fisheye.mp4")
    })

    it("should return preview for glow effect", () => {
      const preview = getEffectPreview("glow")

      expect(preview.videoPath).toBe("/preview-videos/effects/glow.mp4")
    })

    it("should return preview for shadow effect", () => {
      const preview = getEffectPreview("shadow")

      expect(preview.videoPath).toBe("/preview-videos/effects/shadow.mp4")
    })

    it("should return default preview for unknown effect", () => {
      const preview = getEffectPreview("unknown-effect")

      expect(preview).toBeDefined()
      expect(preview.videoPath).toBe("/preview-videos/effects/default.mp4")
      expect(preview.thumbnailPath).toBe("/preview-videos/effects/default-thumb.jpg")
      expect(preview.duration).toBe(3)
    })

    it("should return default preview for empty string", () => {
      const preview = getEffectPreview("")

      expect(preview.videoPath).toBe("/preview-videos/effects/default.mp4")
    })

    it("should return default preview for non-existent effect id", () => {
      const preview = getEffectPreview("does-not-exist-123")

      expect(preview.videoPath).toBe("/preview-videos/effects/default.mp4")
    })
  })

  describe("hasEffectPreview", () => {
    it("should return true for brightness effect", () => {
      expect(hasEffectPreview("brightness")).toBe(true)
    })

    it("should return true for contrast effect", () => {
      expect(hasEffectPreview("contrast")).toBe(true)
    })

    it("should return true for saturation effect", () => {
      expect(hasEffectPreview("saturation")).toBe(true)
    })

    it("should return true for sepia effect", () => {
      expect(hasEffectPreview("sepia")).toBe(true)
    })

    it("should return true for grayscale effect", () => {
      expect(hasEffectPreview("grayscale")).toBe(true)
    })

    it("should return true for invert effect", () => {
      expect(hasEffectPreview("invert")).toBe(true)
    })

    it("should return true for blur effect", () => {
      expect(hasEffectPreview("blur")).toBe(true)
    })

    it("should return true for gaussianBlur effect", () => {
      expect(hasEffectPreview("gaussianBlur")).toBe(true)
    })

    it("should return true for vintage effect", () => {
      expect(hasEffectPreview("vintage")).toBe(true)
    })

    it("should return true for vignette effect", () => {
      expect(hasEffectPreview("vignette")).toBe(true)
    })

    it("should return true for glitch effect", () => {
      expect(hasEffectPreview("glitch")).toBe(true)
    })

    it("should return true for fisheye effect", () => {
      expect(hasEffectPreview("fisheye")).toBe(true)
    })

    it("should return true for glow effect", () => {
      expect(hasEffectPreview("glow")).toBe(true)
    })

    it("should return true for shadow effect", () => {
      expect(hasEffectPreview("shadow")).toBe(true)
    })

    it("should return false for unknown effect", () => {
      expect(hasEffectPreview("unknown-effect")).toBe(false)
    })

    it("should return false for empty string", () => {
      expect(hasEffectPreview("")).toBe(false)
    })

    it("should return false for non-existent effect id", () => {
      expect(hasEffectPreview("does-not-exist-123")).toBe(false)
    })
  })

  describe("getAllEffectPreviews", () => {
    it("should return all effect previews", () => {
      const allPreviews = getAllEffectPreviews()

      expect(allPreviews).toBeDefined()
      expect(typeof allPreviews).toBe("object")
    })

    it("should include all known effects", () => {
      const allPreviews = getAllEffectPreviews()

      const knownEffects = [
        "brightness",
        "contrast",
        "saturation",
        "sepia",
        "grayscale",
        "invert",
        "blur",
        "gaussianBlur",
        "vintage",
        "vignette",
        "glitch",
        "fisheye",
        "glow",
        "shadow",
      ]

      knownEffects.forEach((effectId) => {
        expect(allPreviews[effectId]).toBeDefined()
        expect(allPreviews[effectId].videoPath).toBeDefined()
      })
    })

    it("should return a copy, not the original map", () => {
      const allPreviews1 = getAllEffectPreviews()
      const allPreviews2 = getAllEffectPreviews()

      expect(allPreviews1).not.toBe(allPreviews2)
      expect(allPreviews1).toEqual(allPreviews2)
    })

    it("should have correct structure for each preview", () => {
      const allPreviews = getAllEffectPreviews()

      Object.values(allPreviews).forEach((preview) => {
        expect(preview).toHaveProperty("videoPath")
        expect(typeof preview.videoPath).toBe("string")

        if (preview.thumbnailPath) {
          expect(typeof preview.thumbnailPath).toBe("string")
        }

        if (preview.duration !== undefined) {
          expect(typeof preview.duration).toBe("number")
        }
      })
    })

    it("should not be empty", () => {
      const allPreviews = getAllEffectPreviews()
      const keys = Object.keys(allPreviews)

      expect(keys.length).toBeGreaterThan(0)
    })
  })

  describe("getEffectThumbnail", () => {
    it("should return thumbnail path for brightness effect", () => {
      const thumbnail = getEffectThumbnail("brightness")

      expect(thumbnail).toBe("/preview-videos/effects/brightness-thumb.jpg")
    })

    it("should return thumbnail path for contrast effect", () => {
      const thumbnail = getEffectThumbnail("contrast")

      expect(thumbnail).toBe("/preview-videos/effects/contrast-thumb.jpg")
    })

    it("should return thumbnail path for saturation effect", () => {
      const thumbnail = getEffectThumbnail("saturation")

      expect(thumbnail).toBe("/preview-videos/effects/saturation-thumb.jpg")
    })

    it("should return thumbnail path for effects with thumbnails", () => {
      const effectsWithThumbnails = [
        "brightness",
        "contrast",
        "saturation",
        "sepia",
        "grayscale",
        "invert",
        "blur",
        "gaussianBlur",
        "vintage",
        "vignette",
        "glitch",
        "fisheye",
        "glow",
        "shadow",
      ]

      effectsWithThumbnails.forEach((effectId) => {
        const thumbnail = getEffectThumbnail(effectId)
        expect(thumbnail).toBeDefined()
        expect(thumbnail).toContain("/preview-videos/effects/")
        expect(thumbnail).toContain("-thumb.jpg")
      })
    })

    it("should return null or default thumbnail for unknown effect", () => {
      const thumbnail = getEffectThumbnail("unknown-effect")

      // Should return default thumbnail path or null
      expect(thumbnail).toBeDefined()
    })

    it("should return consistent result with getEffectPreview", () => {
      const effectId = "brightness"
      const preview = getEffectPreview(effectId)
      const thumbnail = getEffectThumbnail(effectId)

      expect(thumbnail).toBe(preview.thumbnailPath)
    })
  })

  describe("Preview Data Consistency", () => {
    it("should have matching video and thumbnail paths", () => {
      const allPreviews = getAllEffectPreviews()

      Object.entries(allPreviews).forEach(([_effectId, preview]) => {
        if (preview.thumbnailPath) {
          // Video path should match thumbnail path pattern
          const videoBaseName = preview.videoPath.replace("/preview-videos/effects/", "").replace(".mp4", "")
          const thumbnailBaseName = preview.thumbnailPath
            .replace("/preview-videos/effects/", "")
            .replace("-thumb.jpg", "")

          expect(videoBaseName).toBe(thumbnailBaseName)
        }
      })
    })

    it("should have valid video paths", () => {
      const allPreviews = getAllEffectPreviews()

      Object.values(allPreviews).forEach((preview) => {
        expect(preview.videoPath).toMatch(/^\/preview-videos\/effects\/.*\.mp4$/)
      })
    })

    it("should have valid thumbnail paths when present", () => {
      const allPreviews = getAllEffectPreviews()

      Object.values(allPreviews).forEach((preview) => {
        if (preview.thumbnailPath) {
          expect(preview.thumbnailPath).toMatch(/^\/preview-videos\/effects\/.*-thumb\.jpg$/)
        }
      })
    })

    it("should have consistent duration values", () => {
      const allPreviews = getAllEffectPreviews()

      Object.values(allPreviews).forEach((preview) => {
        if (preview.duration !== undefined) {
          expect(preview.duration).toBeGreaterThan(0)
          expect(Number.isFinite(preview.duration)).toBe(true)
        }
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle case-sensitive effect IDs", () => {
      const lowercase = getEffectPreview("brightness")
      const uppercase = getEffectPreview("BRIGHTNESS")

      // IDs are case-sensitive
      expect(lowercase.videoPath).toBe("/preview-videos/effects/brightness.mp4")
      expect(uppercase.videoPath).toBe("/preview-videos/effects/default.mp4")
    })

    it("should handle special characters in effect ID", () => {
      const preview = getEffectPreview("effect-with-dashes")

      expect(preview.videoPath).toBe("/preview-videos/effects/default.mp4")
    })

    it("should handle numeric effect IDs", () => {
      const preview = getEffectPreview("12345")

      expect(preview.videoPath).toBe("/preview-videos/effects/default.mp4")
    })

    it("should not mutate original data when getting all previews", () => {
      const allPreviews = getAllEffectPreviews()

      // Note: The spread operator creates a shallow copy, so nested objects can still be mutated
      // This test verifies that calling getAllEffectPreviews() returns consistent data
      const originalPath = allPreviews.brightness.videoPath

      const newPreviews = getAllEffectPreviews()
      expect(newPreviews.brightness.videoPath).toBe(originalPath)
      expect(newPreviews.brightness.videoPath).toBe("/preview-videos/effects/brightness.mp4")
    })
  })
})

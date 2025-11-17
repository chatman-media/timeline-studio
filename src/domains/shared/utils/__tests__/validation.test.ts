/**
 * Validation Utilities Tests
 */

import { describe, expect, it } from "vitest"
import {
  isInRange,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveNumber,
  isValidColor,
  isValidEmail,
  isValidFileName,
  isValidFileSize,
  isValidJson,
  isValidPath,
  isValidUrl,
} from "../validation"

describe("validation utils", () => {
  describe("isValidPath", () => {
    it("should validate Unix paths", () => {
      expect(isValidPath("/path/to/file.mp4")).toBe(true)
      expect(isValidPath("/usr/local/bin")).toBe(true)
      expect(isValidPath("relative/path/file.txt")).toBe(true)
    })

    it("should validate Windows paths", () => {
      expect(isValidPath("C:\\Users\\file.txt")).toBe(true)
      expect(isValidPath("D:\\Projects\\video.mp4")).toBe(true)
    })

    it("should reject invalid paths", () => {
      expect(isValidPath("")).toBe(false)
      expect(isValidPath("file?.txt")).toBe(false)
      expect(isValidPath("file<name>.txt")).toBe(false)
      expect(isValidPath('file"name.txt')).toBe(false)
    })

    it("should reject paths that are too long", () => {
      const longPath = "a".repeat(5000)
      expect(isValidPath(longPath)).toBe(false)
    })

    it("should handle special cases", () => {
      expect(isValidPath(".")).toBe(true)
      expect(isValidPath("..")).toBe(true)
      expect(isValidPath("...")).toBe(false)
      expect(isValidPath("....")).toBe(false)
    })

    it("should reject non-string inputs", () => {
      // Testing invalid input - using as any to bypass type checking
      expect(isValidPath(null as any)).toBe(false)
      expect(isValidPath(undefined as any)).toBe(false)
      expect(isValidPath(123 as any)).toBe(false)
    })
  })

  describe("isValidUrl", () => {
    it("should validate HTTP URLs", () => {
      expect(isValidUrl("http://example.com")).toBe(true)
      expect(isValidUrl("http://localhost:3000")).toBe(true)
      expect(isValidUrl("http://192.168.1.1:8080/path")).toBe(true)
    })

    it("should validate HTTPS URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true)
      expect(isValidUrl("https://www.google.com/search?q=test")).toBe(true)
    })

    it("should reject non-HTTP(S) URLs", () => {
      expect(isValidUrl("ftp://example.com")).toBe(false)
      expect(isValidUrl("file:///path/to/file")).toBe(false)
    })

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not-a-url")).toBe(false)
      expect(isValidUrl("")).toBe(false)
      expect(isValidUrl("htp://example.com")).toBe(false)
    })

    it("should reject non-string inputs", () => {
      // Testing invalid input - using as any to bypass type checking
      expect(isValidUrl(null as any)).toBe(false)
      expect(isValidUrl(undefined as any)).toBe(false)
    })
  })

  describe("isValidEmail", () => {
    it("should validate correct email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true)
      expect(isValidEmail("test.user@example.co.uk")).toBe(true)
      expect(isValidEmail("user+tag@example.com")).toBe(true)
    })

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("invalid.email")).toBe(false)
      expect(isValidEmail("@example.com")).toBe(false)
      expect(isValidEmail("user@")).toBe(false)
      expect(isValidEmail("user @example.com")).toBe(false)
      expect(isValidEmail("")).toBe(false)
    })

    it("should reject non-string inputs", () => {
      // Testing invalid input - using as any to bypass type checking
      expect(isValidEmail(null as any)).toBe(false)
      expect(isValidEmail(undefined as any)).toBe(false)
    })
  })

  describe("isValidColor", () => {
    describe("hex colors", () => {
      it("should validate 3-digit hex colors", () => {
        expect(isValidColor("#F00")).toBe(true)
        expect(isValidColor("#ABC")).toBe(true)
      })

      it("should validate 6-digit hex colors", () => {
        expect(isValidColor("#FF0000")).toBe(true)
        expect(isValidColor("#ABCDEF")).toBe(true)
      })

      it("should validate 8-digit hex colors with alpha", () => {
        expect(isValidColor("#FF0000FF")).toBe(true)
        expect(isValidColor("#ABCDEF80")).toBe(true)
      })

      it("should be case insensitive", () => {
        expect(isValidColor("#ff0000")).toBe(true)
        expect(isValidColor("#FF0000")).toBe(true)
      })

      it("should reject invalid hex colors", () => {
        expect(isValidColor("#GG0000")).toBe(false)
        expect(isValidColor("#FF")).toBe(false)
        expect(isValidColor("FF0000")).toBe(false) // missing #
      })
    })

    describe("rgb/rgba colors", () => {
      it("should validate rgb colors", () => {
        expect(isValidColor("rgb(255, 0, 0)")).toBe(true)
        expect(isValidColor("rgb(0, 128, 255)")).toBe(true)
      })

      it("should validate rgba colors", () => {
        expect(isValidColor("rgba(255, 0, 0, 0.5)")).toBe(true)
        expect(isValidColor("rgba(0, 128, 255, 1)")).toBe(true)
      })

      it("should reject invalid rgb values", () => {
        expect(isValidColor("rgb(256, 0, 0)")).toBe(false)
        expect(isValidColor("rgb(-1, 0, 0)")).toBe(false)
      })

      it("should reject invalid alpha values", () => {
        expect(isValidColor("rgba(255, 0, 0, 1.5)")).toBe(false)
        expect(isValidColor("rgba(255, 0, 0, -0.1)")).toBe(false)
      })

      it("should handle whitespace", () => {
        expect(isValidColor("rgb( 255 , 0 , 0 )")).toBe(true)
      })
    })

    describe("hsl/hsla colors", () => {
      it("should validate hsl colors", () => {
        expect(isValidColor("hsl(0, 100%, 50%)")).toBe(true)
        expect(isValidColor("hsl(120, 50%, 25%)")).toBe(true)
      })

      it("should validate hsla colors", () => {
        expect(isValidColor("hsla(0, 100%, 50%, 0.5)")).toBe(true)
        expect(isValidColor("hsla(120, 50%, 25%, 1)")).toBe(true)
      })

      it("should reject invalid hsl values", () => {
        expect(isValidColor("hsl(361, 100%, 50%)")).toBe(false)
        expect(isValidColor("hsl(0, 101%, 50%)")).toBe(false)
        expect(isValidColor("hsl(0, 100%, 101%)")).toBe(false)
      })
    })

    describe("named colors", () => {
      it("should validate common named colors", () => {
        expect(isValidColor("red")).toBe(true)
        expect(isValidColor("blue")).toBe(true)
        expect(isValidColor("green")).toBe(true)
        expect(isValidColor("transparent")).toBe(true)
      })

      it("should be case insensitive", () => {
        expect(isValidColor("RED")).toBe(true)
        expect(isValidColor("Red")).toBe(true)
      })

      it("should reject invalid named colors", () => {
        expect(isValidColor("notacolor")).toBe(false)
      })
    })

    it("should reject invalid inputs", () => {
      expect(isValidColor("")).toBe(false)
      // @ts-expect-error - testing invalid input
      expect(isValidColor(null)).toBe(false)
      // @ts-expect-error - testing invalid input
      expect(isValidColor(undefined)).toBe(false)
    })
  })

  describe("isInRange", () => {
    it("should validate numbers in range", () => {
      expect(isInRange(5, 0, 10)).toBe(true)
      expect(isInRange(0, 0, 10)).toBe(true)
      expect(isInRange(10, 0, 10)).toBe(true)
    })

    it("should reject numbers out of range", () => {
      expect(isInRange(15, 0, 10)).toBe(false)
      expect(isInRange(-5, 0, 10)).toBe(false)
    })

    it("should handle negative ranges", () => {
      expect(isInRange(-5, -10, 0)).toBe(true)
      expect(isInRange(-15, -10, 0)).toBe(false)
    })

    it("should reject NaN", () => {
      expect(isInRange(Number.NaN, 0, 10)).toBe(false)
    })

    it("should reject non-numbers", () => {
      // Testing invalid input - using as any to bypass type checking
      expect(isInRange("5" as any, 0, 10)).toBe(false)
      expect(isInRange(null as any, 0, 10)).toBe(false)
    })
  })

  describe("isValidJson", () => {
    it("should validate correct JSON", () => {
      expect(isValidJson('{"key": "value"}')).toBe(true)
      expect(isValidJson("[]")).toBe(true)
      expect(isValidJson('{"nested": {"key": "value"}}')).toBe(true)
      expect(isValidJson("null")).toBe(true)
    })

    it("should reject invalid JSON", () => {
      expect(isValidJson("{key: value}")).toBe(false)
      expect(isValidJson("")).toBe(false)
      expect(isValidJson("not json")).toBe(false)
      expect(isValidJson("{")).toBe(false)
    })

    it("should reject non-string inputs", () => {
      // Testing invalid input - using as any to bypass type checking
      expect(isValidJson(null as any)).toBe(false)
      expect(isValidJson(undefined as any)).toBe(false)
    })
  })

  describe("isNonEmptyString", () => {
    it("should validate non-empty strings", () => {
      expect(isNonEmptyString("hello")).toBe(true)
      expect(isNonEmptyString("a")).toBe(true)
    })

    it("should reject empty or whitespace strings", () => {
      expect(isNonEmptyString("")).toBe(false)
      expect(isNonEmptyString("   ")).toBe(false)
      expect(isNonEmptyString("\t")).toBe(false)
    })

    it("should reject non-strings", () => {
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString({})).toBe(false)
    })
  })

  describe("isPositiveNumber", () => {
    it("should validate positive numbers", () => {
      expect(isPositiveNumber(1)).toBe(true)
      expect(isPositiveNumber(0.1)).toBe(true)
      expect(isPositiveNumber(1000)).toBe(true)
    })

    it("should reject zero and negative numbers", () => {
      expect(isPositiveNumber(0)).toBe(false)
      expect(isPositiveNumber(-1)).toBe(false)
      expect(isPositiveNumber(-0.1)).toBe(false)
    })

    it("should reject NaN", () => {
      expect(isPositiveNumber(Number.NaN)).toBe(false)
    })

    it("should reject non-numbers", () => {
      expect(isPositiveNumber("1")).toBe(false)
      expect(isPositiveNumber(null)).toBe(false)
      expect(isPositiveNumber(undefined)).toBe(false)
    })
  })

  describe("isNonNegativeNumber", () => {
    it("should validate non-negative numbers", () => {
      expect(isNonNegativeNumber(0)).toBe(true)
      expect(isNonNegativeNumber(1)).toBe(true)
      expect(isNonNegativeNumber(0.1)).toBe(true)
    })

    it("should reject negative numbers", () => {
      expect(isNonNegativeNumber(-1)).toBe(false)
      expect(isNonNegativeNumber(-0.1)).toBe(false)
    })

    it("should reject NaN", () => {
      expect(isNonNegativeNumber(Number.NaN)).toBe(false)
    })

    it("should reject non-numbers", () => {
      expect(isNonNegativeNumber("0")).toBe(false)
      expect(isNonNegativeNumber(null)).toBe(false)
    })
  })

  describe("isValidFileSize", () => {
    it("should validate file sizes within limit", () => {
      expect(isValidFileSize(1024, 1)).toBe(true) // 1KB < 1MB
      expect(isValidFileSize(1024 * 1024, 1)).toBe(true) // 1MB = 1MB
      expect(isValidFileSize(1024 * 1024 * 0.5, 1)).toBe(true) // 0.5MB < 1MB
    })

    it("should reject file sizes exceeding limit", () => {
      expect(isValidFileSize(1024 * 1024 * 2, 1)).toBe(false) // 2MB > 1MB
      expect(isValidFileSize(1024 * 1024 * 10, 5)).toBe(false) // 10MB > 5MB
    })

    it("should handle zero file size", () => {
      expect(isValidFileSize(0, 1)).toBe(true)
    })

    it("should reject invalid inputs", () => {
      expect(isValidFileSize(-1, 1)).toBe(false)
      expect(isValidFileSize(1024, -1)).toBe(false)
      expect(isValidFileSize(Number.NaN, 1)).toBe(false)
    })
  })

  describe("isValidFileName", () => {
    it("should validate correct file names", () => {
      expect(isValidFileName("file.txt")).toBe(true)
      expect(isValidFileName("my-file_name.mp4")).toBe(true)
      expect(isValidFileName("file (1).txt")).toBe(true)
    })

    it("should reject file names with invalid characters", () => {
      expect(isValidFileName("file<name>.txt")).toBe(false)
      expect(isValidFileName('file"name.txt')).toBe(false)
      expect(isValidFileName("file|name.txt")).toBe(false)
      expect(isValidFileName("file:name.txt")).toBe(false)
    })

    it("should reject empty or whitespace-only names", () => {
      expect(isValidFileName("")).toBe(false)
      expect(isValidFileName("   ")).toBe(false)
    })

    it("should reject file names that are too long", () => {
      const longName = "a".repeat(300)
      expect(isValidFileName(longName)).toBe(false)
    })

    it("should reject file names with only dots", () => {
      expect(isValidFileName(".")).toBe(false)
      expect(isValidFileName("..")).toBe(false)
      expect(isValidFileName("...")).toBe(false)
    })

    it("should allow hidden files with valid names", () => {
      expect(isValidFileName(".gitignore")).toBe(true)
      expect(isValidFileName(".env.local")).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("should handle Unicode characters in paths", () => {
      expect(isValidPath("/путь/к/файлу.mp4")).toBe(true)
      expect(isValidPath("/path/文件.txt")).toBe(true)
    })

    it("should handle Unicode in file names", () => {
      expect(isValidFileName("файл.txt")).toBe(true)
      expect(isValidFileName("文件.mp4")).toBe(true)
    })

    it("should handle very long URLs", () => {
      const longUrl = `https://example.com/${"a".repeat(2000)}`
      expect(isValidUrl(longUrl)).toBe(true)
    })

    it("should handle edge case colors", () => {
      expect(isValidColor("rgba(0, 0, 0, 0)")).toBe(true)
      expect(isValidColor("hsla(360, 100%, 100%, 1)")).toBe(true)
    })
  })
})

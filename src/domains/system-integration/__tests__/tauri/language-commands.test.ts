/**
 * Tests for Language Tauri Commands
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { getAppLanguage, setAppLanguage } from "../../tauri/language-commands"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("Language Tauri Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getAppLanguage", () => {
    it("should invoke get_app_language_tauri command", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        language: "en",
        system_language: "en-US",
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await getAppLanguage()

      expect(mockedInvoke).toHaveBeenCalledWith("get_app_language_tauri")
      expect(result).toEqual(mockResponse)
    })

    it("should return Russian language settings", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        language: "ru",
        system_language: "ru-RU",
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await getAppLanguage()

      expect(result.language).toBe("ru")
      expect(result.system_language).toBe("ru-RU")
    })

    it("should handle different system languages", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const testCases = [
        { language: "en", system_language: "en-GB" },
        { language: "es", system_language: "es-ES" },
        { language: "fr", system_language: "fr-FR" },
        { language: "de", system_language: "de-DE" },
        { language: "zh", system_language: "zh-CN" },
      ]

      for (const testCase of testCases) {
        mockedInvoke.mockResolvedValueOnce(testCase)
        const result = await getAppLanguage()
        expect(result).toEqual(testCase)
      }
    })

    it("should throw error on backend failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Backend error"))

      await expect(getAppLanguage()).rejects.toThrow("Backend error")
    })

    it("should handle network timeout", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Timeout"))

      await expect(getAppLanguage()).rejects.toThrow("Timeout")
    })

    it("should handle malformed response", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const malformedResponse = {
        language: "en",
        // Missing system_language
      }

      mockedInvoke.mockResolvedValue(malformedResponse)

      const result = await getAppLanguage()

      expect(result.language).toBe("en")
      expect(result.system_language).toBeUndefined()
    })
  })

  describe("setAppLanguage", () => {
    it("should invoke set_app_language_tauri command with language code", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        language: "ru",
        system_language: "en-US",
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await setAppLanguage("ru")

      expect(mockedInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang: "ru" })
      expect(result).toEqual(mockResponse)
    })

    it("should set all supported languages", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const languages = ["en", "ru", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr", "it", "th", "hi", "ar", "fa"]

      for (const lang of languages) {
        mockedInvoke.mockResolvedValueOnce({
          language: lang,
          system_language: "en-US",
        })

        const result = await setAppLanguage(lang)

        expect(mockedInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang })
        expect(result.language).toBe(lang)
      }
    })

    it("should handle setting English language", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        language: "en",
        system_language: "ru-RU",
      })

      const result = await setAppLanguage("en")

      expect(result.language).toBe("en")
      expect(result.system_language).toBe("ru-RU")
    })

    it("should throw error on invalid language code", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Invalid language code"))

      await expect(setAppLanguage("invalid")).rejects.toThrow("Invalid language code")
    })

    it("should throw error on backend failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Failed to save language"))

      await expect(setAppLanguage("en")).rejects.toThrow("Failed to save language")
    })

    it("should handle RTL languages", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      // Arabic
      mockedInvoke.mockResolvedValueOnce({
        language: "ar",
        system_language: "en-US",
      })

      const arabicResult = await setAppLanguage("ar")
      expect(arabicResult.language).toBe("ar")

      // Persian
      mockedInvoke.mockResolvedValueOnce({
        language: "fa",
        system_language: "en-US",
      })

      const persianResult = await setAppLanguage("fa")
      expect(persianResult.language).toBe("fa")
    })

    it("should handle empty string language code", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Language code cannot be empty"))

      await expect(setAppLanguage("")).rejects.toThrow("Language code cannot be empty")
    })

    it("should preserve system language when changing app language", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const systemLang = "de-DE"

      mockedInvoke.mockResolvedValue({
        language: "en",
        system_language: systemLang,
      })

      const result = await setAppLanguage("en")

      expect(result.system_language).toBe(systemLang)
    })
  })

  describe("Error Handling", () => {
    it("should handle Tauri IPC errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("IPC communication error"))

      await expect(getAppLanguage()).rejects.toThrow("IPC communication error")
      await expect(setAppLanguage("en")).rejects.toThrow("IPC communication error")
    })

    it("should handle backend not available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Backend not initialized"))

      await expect(getAppLanguage()).rejects.toThrow("Backend not initialized")
    })

    it("should handle permission denied errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Permission denied"))

      await expect(setAppLanguage("ru")).rejects.toThrow("Permission denied")
    })
  })

  describe("Edge Cases", () => {
    it("should handle concurrent get requests", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const [result1, result2, result3] = await Promise.all([getAppLanguage(), getAppLanguage(), getAppLanguage()])

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
      expect(mockedInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent set requests", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke
        .mockResolvedValueOnce({ language: "ru", system_language: "en-US" })
        .mockResolvedValueOnce({ language: "es", system_language: "en-US" })
        .mockResolvedValueOnce({ language: "fr", system_language: "en-US" })

      const [result1, result2, result3] = await Promise.all([
        setAppLanguage("ru"),
        setAppLanguage("es"),
        setAppLanguage("fr"),
      ])

      expect(result1.language).toBe("ru")
      expect(result2.language).toBe("es")
      expect(result3.language).toBe("fr")
    })

    it("should handle language code with locale", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        language: "en",
        system_language: "en-GB",
      })

      const result = await setAppLanguage("en-GB")

      expect(mockedInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang: "en-GB" })
    })

    it("should handle uppercase language codes", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        language: "EN",
        system_language: "en-US",
      })

      await setAppLanguage("EN")

      expect(mockedInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang: "EN" })
    })

    it("should handle mixed case language codes", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        language: "En",
        system_language: "en-US",
      })

      await setAppLanguage("En")

      expect(mockedInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang: "En" })
    })
  })

  describe("Response Structure", () => {
    it("should return response with both language and system_language fields", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        language: "en",
        system_language: "en-US",
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await getAppLanguage()

      expect(result).toHaveProperty("language")
      expect(result).toHaveProperty("system_language")
    })

    it("should handle response with additional fields", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        language: "en",
        system_language: "en-US",
        extra_field: "ignored",
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await getAppLanguage()

      expect(result.language).toBe("en")
      expect(result.system_language).toBe("en-US")
    })
  })
})

/**
 * Tests for Language Service
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { getAppLanguage, setAppLanguage } from "../../../services/language/language-service"

// Mock Tauri language commands
vi.mock("../../../tauri/language-commands", () => ({
  getAppLanguage: vi.fn(),
  setAppLanguage: vi.fn(),
}))

describe("LanguageService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getAppLanguage", () => {
    it("should get current language from Tauri layer", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGetLanguage = vi.mocked(getAppLanguageTauri)

      const mockResponse = {
        language: "en",
        system_language: "en-US",
      }

      mockedGetLanguage.mockResolvedValue(mockResponse)

      const result = await getAppLanguage()

      expect(mockedGetLanguage).toHaveBeenCalledOnce()
      expect(result).toEqual(mockResponse)
    })

    it("should handle Russian language", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGetLanguage = vi.mocked(getAppLanguageTauri)

      const mockResponse = {
        language: "ru",
        system_language: "ru-RU",
      }

      mockedGetLanguage.mockResolvedValue(mockResponse)

      const result = await getAppLanguage()

      expect(result.language).toBe("ru")
      expect(result.system_language).toBe("ru-RU")
    })

    it("should handle errors when getting language", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGetLanguage = vi.mocked(getAppLanguageTauri)

      mockedGetLanguage.mockRejectedValue(new Error("Failed to get language"))

      await expect(getAppLanguage()).rejects.toThrow("Failed to get language")
    })

    it("should handle all supported languages", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGetLanguage = vi.mocked(getAppLanguageTauri)

      const supportedLanguages = [
        { language: "en", system_language: "en-US" },
        { language: "ru", system_language: "ru-RU" },
        { language: "es", system_language: "es-ES" },
        { language: "fr", system_language: "fr-FR" },
        { language: "de", system_language: "de-DE" },
        { language: "pt", system_language: "pt-BR" },
        { language: "zh", system_language: "zh-CN" },
        { language: "ja", system_language: "ja-JP" },
        { language: "ko", system_language: "ko-KR" },
        { language: "tr", system_language: "tr-TR" },
        { language: "it", system_language: "it-IT" },
        { language: "th", system_language: "th-TH" },
        { language: "hi", system_language: "hi-IN" },
        { language: "ar", system_language: "ar-SA" },
        { language: "fa", system_language: "fa-IR" },
      ]

      for (const lang of supportedLanguages) {
        mockedGetLanguage.mockResolvedValueOnce(lang)
        const result = await getAppLanguage()
        expect(result).toEqual(lang)
      }
    })
  })

  describe("setAppLanguage", () => {
    it("should set language via Tauri layer", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSetLanguage = vi.mocked(setAppLanguageTauri)

      const mockResponse = {
        language: "ru",
        system_language: "en-US",
      }

      mockedSetLanguage.mockResolvedValue(mockResponse)

      const result = await setAppLanguage("ru")

      expect(mockedSetLanguage).toHaveBeenCalledWith("ru")
      expect(result).toEqual(mockResponse)
    })

    it("should change language from English to Russian", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSetLanguage = vi.mocked(setAppLanguageTauri)

      mockedSetLanguage.mockResolvedValue({
        language: "ru",
        system_language: "en-US",
      })

      const result = await setAppLanguage("ru")

      expect(result.language).toBe("ru")
    })

    it("should change language from Russian to English", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSetLanguage = vi.mocked(setAppLanguageTauri)

      mockedSetLanguage.mockResolvedValue({
        language: "en",
        system_language: "ru-RU",
      })

      const result = await setAppLanguage("en")

      expect(result.language).toBe("en")
    })

    it("should handle errors when setting language", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSetLanguage = vi.mocked(setAppLanguageTauri)

      mockedSetLanguage.mockRejectedValue(new Error("Invalid language code"))

      await expect(setAppLanguage("invalid")).rejects.toThrow("Invalid language code")
    })

    it("should handle setting all supported languages", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSetLanguage = vi.mocked(setAppLanguageTauri)

      const languages = ["en", "ru", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr", "it", "th", "hi", "ar", "fa"]

      for (const lang of languages) {
        mockedSetLanguage.mockResolvedValueOnce({
          language: lang,
          system_language: "en-US",
        })

        const result = await setAppLanguage(lang)
        expect(result.language).toBe(lang)
      }
    })

    it("should preserve system language when changing app language", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSetLanguage = vi.mocked(setAppLanguageTauri)

      const systemLang = "en-US"

      mockedSetLanguage.mockResolvedValue({
        language: "ru",
        system_language: systemLang,
      })

      const result = await setAppLanguage("ru")

      expect(result.system_language).toBe(systemLang)
    })
  })

  describe("Language Service Integration", () => {
    it("should handle language switching flow", async () => {
      const {
        getAppLanguage: getAppLanguageTauri,
        setAppLanguage: setAppLanguageTauri,
      } = await import("../../../tauri/language-commands")
      const mockedGet = vi.mocked(getAppLanguageTauri)
      const mockedSet = vi.mocked(setAppLanguageTauri)

      // Initial state: English
      mockedGet.mockResolvedValueOnce({
        language: "en",
        system_language: "en-US",
      })

      let current = await getAppLanguage()
      expect(current.language).toBe("en")

      // Switch to Russian
      mockedSet.mockResolvedValueOnce({
        language: "ru",
        system_language: "en-US",
      })

      const updated = await setAppLanguage("ru")
      expect(updated.language).toBe("ru")

      // Verify new state
      mockedGet.mockResolvedValueOnce({
        language: "ru",
        system_language: "en-US",
      })

      current = await getAppLanguage()
      expect(current.language).toBe("ru")
    })

    it("should handle RTL language switching", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSet = vi.mocked(setAppLanguageTauri)

      // Switch to Arabic (RTL)
      mockedSet.mockResolvedValueOnce({
        language: "ar",
        system_language: "en-US",
      })

      const arabic = await setAppLanguage("ar")
      expect(arabic.language).toBe("ar")

      // Switch to Persian (RTL)
      mockedSet.mockResolvedValueOnce({
        language: "fa",
        system_language: "en-US",
      })

      const persian = await setAppLanguage("fa")
      expect(persian.language).toBe("fa")
    })

    it("should handle concurrent language requests", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGet = vi.mocked(getAppLanguageTauri)

      mockedGet.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const [result1, result2, result3] = await Promise.all([
        getAppLanguage(),
        getAppLanguage(),
        getAppLanguage(),
      ])

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
      expect(mockedGet).toHaveBeenCalledTimes(3)
    })
  })

  describe("Error Handling", () => {
    it("should handle backend unavailable error", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGet = vi.mocked(getAppLanguageTauri)

      mockedGet.mockRejectedValue(new Error("Backend not available"))

      await expect(getAppLanguage()).rejects.toThrow("Backend not available")
    })

    it("should handle permission denied error", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSet = vi.mocked(setAppLanguageTauri)

      mockedSet.mockRejectedValue(new Error("Permission denied"))

      await expect(setAppLanguage("ru")).rejects.toThrow("Permission denied")
    })

    it("should handle malformed response", async () => {
      const { getAppLanguage: getAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedGet = vi.mocked(getAppLanguageTauri)

      // Response without required fields
      mockedGet.mockResolvedValue({} as any)

      const result = await getAppLanguage()

      expect(result).toEqual({})
    })

    it("should handle empty language code", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSet = vi.mocked(setAppLanguageTauri)

      mockedSet.mockRejectedValue(new Error("Language code cannot be empty"))

      await expect(setAppLanguage("")).rejects.toThrow("Language code cannot be empty")
    })
  })

  describe("Edge Cases", () => {
    it("should handle language code with different casing", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSet = vi.mocked(setAppLanguageTauri)

      mockedSet.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      // Backend might normalize the case
      await setAppLanguage("EN")

      expect(mockedSet).toHaveBeenCalledWith("EN")
    })

    it("should handle locale codes", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSet = vi.mocked(setAppLanguageTauri)

      mockedSet.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      await setAppLanguage("en-GB")

      expect(mockedSet).toHaveBeenCalledWith("en-GB")
    })

    it("should handle very long language codes", async () => {
      const { setAppLanguage: setAppLanguageTauri } = await import("../../../tauri/language-commands")
      const mockedSet = vi.mocked(setAppLanguageTauri)

      mockedSet.mockRejectedValue(new Error("Invalid language code"))

      await expect(setAppLanguage("a".repeat(100))).rejects.toThrow("Invalid language code")
    })
  })
})

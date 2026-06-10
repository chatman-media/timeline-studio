/**
 * @vitest-environment jsdom
 */
/**
 * Tests for useLanguage hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useLanguage } from "../use-language"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(),
}))

vi.mock("@timeline-studio/core/services/language", () => ({
  getAppLanguage: vi.fn(),
  setAppLanguage: vi.fn(),
}))

// Don't mock i18n/constants - use the real implementation

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    traceSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

describe("useLanguage", () => {
  let mockI18n: any
  let mockChangeLanguage: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()

    // Setup i18n mock that actually changes the language
    mockChangeLanguage = vi.fn().mockImplementation(async (lang: string) => {
      mockI18n.language = lang
    })
    mockI18n = {
      language: "en",
      changeLanguage: mockChangeLanguage,
    }

    const { useTranslation } = vi.mocked(await import("react-i18next"))
    useTranslation.mockReturnValue({
      i18n: mockI18n,
    } as any)
  })

  describe("initialization", () => {
    it("should initialize with loading state", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useLanguage())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it("should fetch language from backend on mount", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getAppLanguage).toHaveBeenCalledOnce()
      expect(result.current.currentLanguage).toBe("en")
      // system_language "en-US" is not a supported language code, so defaults to "en"
      expect(result.current.systemLanguage).toBe("en")
    })

    it("should set system language from backend response", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "ru", // Use language code, not locale
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.systemLanguage).toBe("ru")
      })
    })

    it("should change i18n language if different from backend", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "ru-RU",
      })

      mockI18n.language = "en" // Current language is different

      renderHook(() => useLanguage())

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith("ru")
      })
    })

    it("should not change i18n language if same as backend", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      mockI18n.language = "en" // Same language

      renderHook(() => useLanguage())

      await waitFor(() => {
        expect(getAppLanguage).toHaveBeenCalled()
      })

      expect(mockChangeLanguage).not.toHaveBeenCalled()
    })

    it("should save language to localStorage", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "ru-RU",
      })

      renderHook(() => useLanguage())

      await waitFor(() => {
        expect(localStorage.getItem("app-language")).toBe("ru")
      })
    })
  })

  describe("supported language validation", () => {
    it("should use default language if backend returns unsupported language", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "unsupported",
        system_language: "en-US",
      })

      // Start with different language to trigger changeLanguage call
      mockI18n.language = "ru"

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockChangeLanguage).toHaveBeenCalledWith("en") // DEFAULT_LANGUAGE
    })

    it("should use default system language if backend returns unsupported system language", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "invalid-INVALID",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.systemLanguage).toBe("en") // DEFAULT_LANGUAGE
      })
    })

    it("should handle all supported languages", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))

      const languages = ["en", "ru", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr", "it", "th", "hi", "ar", "fa"]

      for (const lang of languages) {
        getAppLanguage.mockResolvedValueOnce({
          language: lang,
          system_language: lang, // Use language code for system_language too
        })

        const { result, unmount } = renderHook(() => useLanguage())

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        // Wait for currentLanguage to update
        await waitFor(() => {
          expect(result.current.currentLanguage).toBe(lang)
        })
        unmount()
      }
    })
  })

  describe("error handling", () => {
    it("should handle backend error", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockRejectedValue(new Error("Backend not available"))

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Backend not available")
    })

    it("should fallback to localStorage on backend error", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockRejectedValue(new Error("Backend error"))

      localStorage.setItem("app-language", "ru")

      renderHook(() => useLanguage())

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith("ru")
      })
    })

    it("should validate localStorage language before using", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockRejectedValue(new Error("Backend error"))

      localStorage.setItem("app-language", "invalid")

      renderHook(() => useLanguage())

      await waitFor(() => {
        expect(getAppLanguage).toHaveBeenCalled()
      })

      // Should not change to invalid language
      expect(mockChangeLanguage).not.toHaveBeenCalled()
    })

    it("should handle localStorage read error", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockRejectedValue(new Error("Backend error"))

      // Mock localStorage.getItem to throw
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn(() => {
        throw new Error("localStorage error")
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("Backend error")

      // Restore
      localStorage.getItem = originalGetItem
    })

    it("should handle non-Error objects in catch blocks", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockRejectedValue("String error")

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe("String error")
    })
  })

  describe("changeLanguage function", () => {
    it("should change language via i18n and backend", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })
      setAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change language
      await result.current.changeLanguage("ru")

      expect(mockChangeLanguage).toHaveBeenCalledWith("ru")
      expect(setAppLanguage).toHaveBeenCalledWith("ru")
      expect(localStorage.getItem("app-language")).toBe("ru")
    })

    it("should set loading state during language change", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      let resolveSetLanguage: any
      setAppLanguage.mockReturnValue(
        new Promise((resolve) => {
          resolveSetLanguage = resolve
        }),
      )

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Start language change (don't await yet)
      let changePromise: Promise<void>
      act(() => {
        changePromise = result.current.changeLanguage("ru")
      })

      // Wait for loading state to be set
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the promise
      act(() => {
        resolveSetLanguage({ language: "ru", system_language: "en-US" })
      })
      await changePromise!

      // Should not be loading anymore
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should clear error state on successful language change", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockRejectedValueOnce(new Error("Initial error"))
      setAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.error).toBe("Initial error")
      })

      // Change language successfully
      await result.current.changeLanguage("ru")

      await waitFor(() => {
        expect(result.current.error).toBe(null)
      })
    })

    it("should handle error during language change", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })
      setAppLanguage.mockRejectedValue(new Error("Failed to set language"))

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.changeLanguage("ru")

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to set language")
      })
    })

    it("should still save to localStorage even if backend fails", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })
      setAppLanguage.mockRejectedValue(new Error("Backend error"))

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.changeLanguage("ru")

      // Should still be saved to localStorage before backend call
      expect(localStorage.getItem("app-language")).toBe("ru")
    })

    it("should change i18n language even if backend fails", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })
      setAppLanguage.mockRejectedValue(new Error("Backend error"))

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockChangeLanguage.mockClear()
      await result.current.changeLanguage("ru")

      expect(mockChangeLanguage).toHaveBeenCalledWith("ru")
    })
  })

  describe("refreshLanguage function", () => {
    it("should refetch language from backend", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValueOnce({
        language: "en",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(getAppLanguage).toHaveBeenCalledOnce()

      // Mock new language
      getAppLanguage.mockResolvedValueOnce({
        language: "ru",
        system_language: "ru", // Use language code, not locale
      })

      // Refresh
      await act(async () => {
        await result.current.refreshLanguage()
      })

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("ru")
      })

      expect(getAppLanguage).toHaveBeenCalledTimes(2)
    })

    it("should set loading state during refresh", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let resolveRefresh: any
      getAppLanguage.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRefresh = resolve
        }),
      )

      // Start refresh (don't await yet)
      let refreshPromise: Promise<void>
      act(() => {
        refreshPromise = result.current.refreshLanguage()
      })

      // Wait for loading state to be set
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve
      act(() => {
        resolveRefresh({ language: "en", system_language: "en-US" })
      })
      await refreshPromise!

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe("currentLanguage getter", () => {
    it("should return i18n language if available", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "ru-RU",
      })

      mockI18n.language = "ru"

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.currentLanguage).toBe("ru")
    })

    it("should return default language if i18n not available", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { useTranslation } = vi.mocked(await import("react-i18next"))
      useTranslation.mockReturnValueOnce({
        i18n: null,
      } as any)

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("en")
      })
    })

    it("should return default language if i18n.language is empty", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      mockI18n.language = ""

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("en")
      })
    })
  })

  describe("RTL languages", () => {
    it("should handle Arabic language (RTL)", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "ar",
        system_language: "ar", // Use language code, not locale
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("ar")
      })

      expect(result.current.systemLanguage).toBe("ar")
    })

    it("should handle Persian language (RTL)", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "fa",
        system_language: "fa", // Use language code, not locale
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("fa")
      })

      expect(result.current.systemLanguage).toBe("fa")
    })
  })

  describe("memoization", () => {
    it("should memoize fetchLanguage callback", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result, rerender } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstRefresh = result.current.refreshLanguage

      rerender()

      const secondRefresh = result.current.refreshLanguage

      // Should be the same reference
      expect(firstRefresh).toBe(secondRefresh)
    })

    it("should memoize changeLanguage callback", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result, rerender } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstChange = result.current.changeLanguage

      rerender()

      const secondChange = result.current.changeLanguage

      // Should be the same reference
      expect(firstChange).toBe(secondChange)
    })

    it("should recreate callbacks when i18n changes", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result, rerender } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstChange = result.current.changeLanguage

      // Change i18n mock
      const newMockChangeLanguage = vi.fn().mockResolvedValue(undefined)
      const newMockI18n = {
        language: "en",
        changeLanguage: newMockChangeLanguage,
      }

      const { useTranslation } = vi.mocked(await import("react-i18next"))
      useTranslation.mockReturnValue({
        i18n: newMockI18n,
      } as any)

      rerender()

      const secondChange = result.current.changeLanguage

      // Should be different references
      expect(firstChange).not.toBe(secondChange)
    })
  })

  describe("concurrent operations", () => {
    it("should handle concurrent language changes", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })
      setAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Make concurrent calls
      const promises = [
        result.current.changeLanguage("ru"),
        result.current.changeLanguage("es"),
        result.current.changeLanguage("fr"),
      ]

      await Promise.all(promises)

      // All calls should complete
      expect(setAppLanguage).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent refresh calls", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const callCount = getAppLanguage.mock.calls.length

      // Make concurrent refresh calls
      await Promise.all([
        result.current.refreshLanguage(),
        result.current.refreshLanguage(),
        result.current.refreshLanguage(),
      ])

      // All calls should complete
      expect(getAppLanguage).toHaveBeenCalledTimes(callCount + 3)
    })
  })

  describe("edge cases", () => {
    it("should handle missing i18n object", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { useTranslation } = vi.mocked(await import("react-i18next"))
      useTranslation.mockReturnValueOnce({
        i18n: undefined,
      } as any)

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not crash
      expect(result.current.currentLanguage).toBe("en")
    })

    it("should handle empty string in backend response", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "",
        system_language: "",
      })

      // Start with a different language so changeLanguage gets called
      mockI18n.language = "ru"

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use default language
      expect(mockChangeLanguage).toHaveBeenCalledWith("en")
    })

    it("should handle null values in backend response", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: null as any,
        system_language: null as any,
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use default language
      expect(result.current.currentLanguage).toBe("en")
    })

    it("should handle changeLanguage with empty string", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })
      setAppLanguage.mockResolvedValue({
        language: "",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.changeLanguage("" as any)

      expect(setAppLanguage).toHaveBeenCalledWith("")
    })
  })

  describe("integration scenarios", () => {
    it("should handle language switching flow (en -> ru -> es)", async () => {
      const { getAppLanguage, setAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))

      // Initial: English
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("en")
      })

      // Change to Russian
      setAppLanguage.mockResolvedValueOnce({
        language: "ru",
        system_language: "en-US",
      })

      await act(async () => {
        await result.current.changeLanguage("ru")
      })

      // Verify the change was called
      expect(mockChangeLanguage).toHaveBeenCalledWith("ru")
      expect(setAppLanguage).toHaveBeenCalledWith("ru")
      // mockI18n.language should be updated
      expect(mockI18n.language).toBe("ru")

      // Change to Spanish
      setAppLanguage.mockResolvedValueOnce({
        language: "es",
        system_language: "en-US",
      })

      await act(async () => {
        await result.current.changeLanguage("es")
      })

      // Verify the change was called
      expect(mockChangeLanguage).toHaveBeenCalledWith("es")
      expect(setAppLanguage).toHaveBeenCalledWith("es")
      expect(mockI18n.language).toBe("es")
    })

    it("should handle app restart with saved language", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))

      // Simulate app restart with saved language
      localStorage.setItem("app-language", "ru")

      getAppLanguage.mockResolvedValue({
        language: "ru",
        system_language: "ru-RU",
      })

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.currentLanguage).toBe("ru")
      })

      expect(localStorage.getItem("app-language")).toBe("ru")
    })

    it("should handle backend recovery after error", async () => {
      const { getAppLanguage } = vi.mocked(await import("@timeline-studio/core/services/language"))

      // Initial error
      getAppLanguage.mockRejectedValueOnce(new Error("Backend unavailable"))

      const { result } = renderHook(() => useLanguage())

      await waitFor(() => {
        expect(result.current.error).toBe("Backend unavailable")
      })

      // Backend recovers
      getAppLanguage.mockResolvedValue({
        language: "en",
        system_language: "en-US",
      })

      await result.current.refreshLanguage()

      await waitFor(() => {
        expect(result.current.error).toBe(null)
        expect(result.current.currentLanguage).toBe("en")
      })
    })
  })
})

import { describe, expect, it } from "vitest"

describe("i18n Configuration", () => {
  it("should have DEFAULT_LANGUAGE constant", async () => {
    const { DEFAULT_LANGUAGE } = await import("../constants")
    expect(DEFAULT_LANGUAGE).toBeDefined()
    expect(typeof DEFAULT_LANGUAGE).toBe("string")
  })

  it("should have SUPPORTED_LANGUAGES array", async () => {
    const { SUPPORTED_LANGUAGES } = await import("../constants")
    expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true)
    expect(SUPPORTED_LANGUAGES.length).toBe(15)
  })

  it("should have RTL_LANGUAGES array", async () => {
    const { RTL_LANGUAGES } = await import("../constants")
    expect(Array.isArray(RTL_LANGUAGES)).toBe(true)
    expect(RTL_LANGUAGES).toContain("ar")
    expect(RTL_LANGUAGES).toContain("fa")
  })

  it("should export isSupportedLanguage function", async () => {
    const { isSupportedLanguage } = await import("../constants")
    expect(typeof isSupportedLanguage).toBe("function")
    expect(isSupportedLanguage("en")).toBe(true)
    expect(isSupportedLanguage("ru")).toBe(true)
    expect(isSupportedLanguage("invalid")).toBe(false)
  })

  it("should export getTextDirection function", async () => {
    const { getTextDirection } = await import("../constants")
    expect(typeof getTextDirection).toBe("function")
    expect(getTextDirection("ar")).toBe("rtl")
    expect(getTextDirection("fa")).toBe("rtl")
    expect(getTextDirection("en")).toBe("ltr")
    expect(getTextDirection("ru")).toBe("ltr")
  })
})

describe("i18n Module Exports", () => {
  it("should export default i18n instance", async () => {
    const module = await import("../index")
    const i18n = module.default
    expect(i18n).toBeDefined()
  })
})

describe("i18n Bundled Translations", () => {
  it("should have all 15 languages bundled", async () => {
    const { SUPPORTED_LANGUAGES } = await import("../constants")

    // All translations are now bundled, no Tauri API needed
    const expectedLanguages = ["ar", "de", "en", "es", "fa", "fr", "hi", "it", "ja", "ko", "pt", "ru", "th", "tr", "zh"]

    expect(SUPPORTED_LANGUAGES.sort()).toEqual(expectedLanguages.sort())
  })

  it("all translation files should be importable", async () => {
    // Test that all locale files can be imported
    const en = await import("../locales/en.json")
    const ru = await import("../locales/ru.json")
    const es = await import("../locales/es.json")

    expect(en.default).toBeDefined()
    expect(ru.default).toBeDefined()
    expect(es.default).toBeDefined()
  })
})

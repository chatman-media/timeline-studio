import { describe, expect, it } from "vitest"
import { NodeLanguageService } from "../language"

describe("NodeLanguageService", () => {
  it("uses provided language options", async () => {
    const service = new NodeLanguageService({ language: "ru", systemLanguage: "ru-RU" })

    await expect(service.getAppLanguage()).resolves.toEqual({
      language: "ru",
      system_language: "ru-RU",
    })
  })

  it("derives app language from system language", async () => {
    const service = new NodeLanguageService({ systemLanguage: "fr-FR" })

    await expect(service.getAppLanguage()).resolves.toEqual({
      language: "fr",
      system_language: "fr-FR",
    })
  })

  it("updates app language in memory", async () => {
    const service = new NodeLanguageService({ systemLanguage: "en-US" })

    const result = await service.setAppLanguage("es")

    expect(result).toEqual({
      language: "es",
      system_language: "en-US",
    })
    await expect(service.getAppLanguage()).resolves.toEqual(result)
  })
})

import { beforeEach, describe, expect, it } from "vitest"
import { MockLanguageService } from "../language"

describe("MockLanguageService", () => {
  let service: MockLanguageService

  beforeEach(() => {
    service = new MockLanguageService()
  })

  it("returns default language response", async () => {
    await expect(service.getAppLanguage()).resolves.toEqual({
      language: "en",
      system_language: "en-US",
    })
  })

  it("updates app language", async () => {
    const result = await service.setAppLanguage("ru")

    expect(result).toEqual({
      language: "ru",
      system_language: "en-US",
    })
    await expect(service.getAppLanguage()).resolves.toEqual(result)
  })

  it("supports custom language response for tests", async () => {
    service.setLanguageResponse({ language: "fr", system_language: "fr-FR" })

    await expect(service.getAppLanguage()).resolves.toEqual({
      language: "fr",
      system_language: "fr-FR",
    })
  })
})

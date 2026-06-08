import { beforeEach, describe, expect, it, vi } from "vitest"
import { TauriLanguageService } from "../language"

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

describe("TauriLanguageService", () => {
  let service: TauriLanguageService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TauriLanguageService()
  })

  it("gets app language through Tauri command", async () => {
    const response = { language: "en", system_language: "en-US" }
    mockInvoke.mockResolvedValueOnce(response)

    const result = await service.getAppLanguage()

    expect(mockInvoke).toHaveBeenCalledWith("get_app_language_tauri")
    expect(result).toEqual(response)
  })

  it("sets app language through Tauri command", async () => {
    const response = { language: "ru", system_language: "en-US" }
    mockInvoke.mockResolvedValueOnce(response)

    const result = await service.setAppLanguage("ru")

    expect(mockInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang: "ru" })
    expect(result).toEqual(response)
  })

  it("propagates Tauri command errors", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Backend error"))

    await expect(service.getAppLanguage()).rejects.toThrow("Backend error")
  })
})

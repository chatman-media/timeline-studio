import type { ILanguageService, LanguageResponse } from "@/core/ports"

export class MockLanguageService implements ILanguageService {
  private languageResponse: LanguageResponse

  constructor(initialResponse: LanguageResponse = { language: "en", system_language: "en-US" }) {
    this.languageResponse = initialResponse
  }

  async getAppLanguage(): Promise<LanguageResponse> {
    return { ...this.languageResponse }
  }

  async setAppLanguage(lang: string): Promise<LanguageResponse> {
    this.languageResponse = {
      ...this.languageResponse,
      language: lang,
    }
    return { ...this.languageResponse }
  }

  setLanguageResponse(response: LanguageResponse): void {
    this.languageResponse = response
  }
}

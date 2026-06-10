import type { ILanguageService, LanguageResponse } from "@timeline-studio/core/ports"

export interface NodeLanguageOptions {
  language?: string
  systemLanguage?: string
}

function getSystemLanguage(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || "en"
  } catch {
    return "en"
  }
}

export class NodeLanguageService implements ILanguageService {
  private languageResponse: LanguageResponse

  constructor(options: NodeLanguageOptions = {}) {
    const systemLanguage = options.systemLanguage ?? getSystemLanguage()
    this.languageResponse = {
      language: options.language ?? systemLanguage.split("-")[0] ?? "en",
      system_language: systemLanguage,
    }
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
}

export interface LanguageResponse {
  language: string
  system_language: string
}

export interface ILanguageService {
  getAppLanguage(): Promise<LanguageResponse>
  setAppLanguage(lang: string): Promise<LanguageResponse>
}

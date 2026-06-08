import { container } from "../container"
import type { LanguageResponse } from "../ports"

export type { LanguageResponse } from "../ports"

export async function getAppLanguage(): Promise<LanguageResponse> {
  return container.getLanguage().getAppLanguage()
}

export async function setAppLanguage(lang: string): Promise<LanguageResponse> {
  return container.getLanguage().setAppLanguage(lang)
}

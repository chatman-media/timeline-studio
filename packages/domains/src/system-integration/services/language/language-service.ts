/**
 * Language Service for System Integration Domain
 *
 * Provides language management functionality through Tauri backend
 */

import { createLogger } from "@/lib/tauri-logger"
import {
  getAppLanguage as getAppLanguageTauri,
  setAppLanguage as setAppLanguageTauri,
} from "../../tauri/language-commands"

const logger = createLogger("LanguageService")

// Re-export types
export type { LanguageResponse } from "../../tauri/language-commands"

/**
 * Get the current application language from backend
 */
export async function getAppLanguage() {
  logger.debugSync("Delegating getAppLanguage to Tauri layer")
  return getAppLanguageTauri()
}

/**
 * Set the application language
 * @param lang - Language code (e.g., 'en', 'ru')
 */
export async function setAppLanguage(lang: string) {
  logger.infoSync("Delegating setAppLanguage to Tauri layer", { lang })
  return setAppLanguageTauri(lang)
}

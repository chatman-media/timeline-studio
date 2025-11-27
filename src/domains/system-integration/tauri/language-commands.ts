/**
 * Language Tauri Commands
 *
 * All language-related Tauri backend operations.
 * This is the only place where invoke() is called for language management.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("LanguageCommands")

export interface LanguageResponse {
  language: string
  system_language: string
}

/**
 * Get the current application language from backend
 *
 * @returns Current language and system language
 */
export async function getAppLanguage(): Promise<LanguageResponse> {
  logger.debugSync("Getting app language from backend")
  try {
    const result = await invoke<LanguageResponse>("get_app_language_tauri")
    logger.debugSync("App language retrieved", { language: result.language })
    return result
  } catch (error) {
    logger.errorSync("Failed to get app language", { error })
    throw error
  }
}

/**
 * Set the application language
 *
 * @param lang - Language code (e.g., 'en', 'ru')
 * @returns Updated language info
 */
export async function setAppLanguage(lang: string): Promise<LanguageResponse> {
  logger.infoSync("Setting app language", { lang })
  try {
    const result = await invoke<LanguageResponse>("set_app_language_tauri", { lang })
    logger.infoSync("App language set successfully", { lang })
    return result
  } catch (error) {
    logger.errorSync("Failed to set app language", { lang, error })
    throw error
  }
}

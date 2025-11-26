/**
 * Language Service for System Integration Domain
 *
 * Provides language management functionality through Tauri backend
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("LanguageService")

export interface LanguageResponse {
  language: string
  system_language: string
}

/**
 * Get the current application language from backend
 */
export async function getAppLanguage(): Promise<LanguageResponse> {
  logger.debugSync("Getting app language from backend")
  return invoke<LanguageResponse>("get_app_language_tauri")
}

/**
 * Set the application language
 * @param lang - Language code (e.g., 'en', 'ru')
 */
export async function setAppLanguage(lang: string): Promise<LanguageResponse> {
  logger.infoSync("Setting app language", { lang })
  return invoke<LanguageResponse>("set_app_language_tauri", { lang })
}

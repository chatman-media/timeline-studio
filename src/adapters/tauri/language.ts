import { invoke } from "@tauri-apps/api/core"
import type { ILanguageService, LanguageResponse } from "@/core/ports"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("TauriLanguageService")

export class TauriLanguageService implements ILanguageService {
  async getAppLanguage(): Promise<LanguageResponse> {
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

  async setAppLanguage(lang: string): Promise<LanguageResponse> {
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
}

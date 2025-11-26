// Объединяющий сервис для всех социальных сетей

import { getSystemIntegrationOrchestrator } from "@/domains/system-integration"
import { createLogger } from "@/lib/tauri-logger"
import type { SocialExportSettings } from "../types/export-types"
import { OAuthService } from "./oauth-service"
import * as TelegramService from "./telegram-service"
import * as TikTokService from "./tiktok-service"
import * as VimeoService from "./vimeo-service"
import * as YouTubeService from "./youtube-service"

const logger = createLogger({ module: "SocialNetworksService" })
const orchestrator = getSystemIntegrationOrchestrator()

export interface SocialUploadResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

export async function login(network: string): Promise<boolean> {
  try {
    orchestrator.showNotification({
      type: "info",
      notification_type: "info",
      title: "Connecting",
      message: `Connecting to ${network}...`,
    })

    const token = await OAuthService.loginToNetwork(network)
    if (!token) {
      throw new Error("Authentication failed")
    }

    // Сохраняем токен
    void OAuthService.storeToken(network, token)

    // Получаем информацию о пользователе
    const userInfo = await getUserInfo(network, token.accessToken)
    if (userInfo) {
      localStorage.setItem(`${network}_user_info`, JSON.stringify(userInfo))
    }

    orchestrator.showNotification({
      type: "success",
      notification_type: "success",
      title: "Connected",
      message: `Successfully connected to ${network}`,
      duration: 3000,
    })
    return true
  } catch (error) {
    logger.error(`Login failed for ${network}: ${String(error)}`)
    orchestrator.showNotification({
      type: "error",
      notification_type: "error",
      title: "Connection Failed",
      message: `Failed to connect to ${network}: ${error instanceof Error ? error.message : "Unknown error"}`,
    })
    return false
  }
}

export async function logout(network: string): Promise<void> {
  await OAuthService.logout(network)
  orchestrator.showNotification({
    type: "info",
    notification_type: "info",
    title: "Disconnected",
    message: `Disconnected from ${network}`,
    duration: 3000,
  })
}

export async function isLoggedIn(network: string): Promise<boolean> {
  const token = await OAuthService.getStoredToken(network)
  return !!token
}

export function getUserInfo(network: string, accessToken?: string): Promise<any> {
  switch (network) {
    case "youtube":
      return YouTubeService.getUserInfo(accessToken)
    case "tiktok":
      return TikTokService.getUserInfo(accessToken)
    case "vimeo":
      return VimeoService.getUserInfo(accessToken)
    case "telegram":
      return TelegramService.getUserInfo(accessToken)
    default:
      throw new Error(`User info not implemented for ${network}`)
  }
}

export function getStoredUserInfo(network: string): any {
  try {
    const stored = localStorage.getItem(`${network}_user_info`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export async function uploadVideo(
  network: string,
  videoFile: File | Blob,
  settings: SocialExportSettings,
  onProgress?: (progress: number) => void,
): Promise<SocialUploadResult> {
  try {
    // Проверяем авторизацию
    if (!(await isLoggedIn(network))) {
      throw new Error(`Not logged in to ${network}`)
    }

    // Валидируем настройки
    const validationErrors = validateSettings(network, settings)
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`)
    }

    let result: any

    switch (network) {
      case "youtube": {
        const metadata = await YouTubeService.exportSettings(settings)
        result = await YouTubeService.uploadVideo(videoFile, metadata, onProgress)
        break
      }
      case "tiktok": {
        const metadata = await TikTokService.exportSettings(settings)
        result = await TikTokService.uploadVideo(videoFile, metadata, onProgress)
        break
      }
      case "vimeo": {
        const metadata = await VimeoService.exportSettings(settings)
        result = await VimeoService.uploadVideo(videoFile, metadata, onProgress)
        break
      }
      case "telegram": {
        const metadata = await TelegramService.exportSettings(settings)
        result = await TelegramService.uploadVideo(videoFile, metadata, onProgress)
        break
      }
      default:
        throw new Error(`Upload not implemented for ${network}`)
    }

    return {
      success: true,
      url: result.url || result.share_url,
      id: result.id || result.publish_id,
    }
  } catch (error) {
    logger.error(`Upload failed for ${network}: ${String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export function validateSettings(network: string, settings: SocialExportSettings): string[] {
  switch (network) {
    case "youtube":
      return YouTubeService.validateSettings(settings)
    case "tiktok":
      return TikTokService.validateSettings(settings)
    case "vimeo":
      return VimeoService.validateSettings(settings)
    case "telegram":
      return TelegramService.validateSettings(settings)
    default:
      return []
  }
}

export function getOptimalSettings(network: string): Partial<SocialExportSettings> {
  switch (network) {
    case "youtube":
      return {
        resolution: "1080",
        frameRate: "30",
        format: "Mp4" as any,
        quality: "good",
      }
    case "tiktok":
      return TikTokService.getOptimalSettings()
    case "vimeo":
      return VimeoService.getOptimalSettings()
    case "telegram":
      return {
        resolution: "720",
        frameRate: "30",
        format: "Mp4" as any,
        quality: "normal",
      }
    default:
      return {}
  }
}

export async function refreshTokenIfNeeded(network: string): Promise<boolean> {
  const token = await OAuthService.getStoredToken(network)
  if (!token || !token.refreshToken) {
    return false
  }

  // Проверяем, нужно ли обновить токен (за 5 минут до истечения)
  const refreshThreshold = 5 * 60 * 1000 // 5 минут
  const expiresAt = (token as any).expiresAt

  if (!expiresAt || Date.now() < expiresAt - refreshThreshold) {
    return true // Токен еще действителен
  }

  try {
    const newToken = await OAuthService.refreshToken(network, token.refreshToken)
    if (newToken) {
      await OAuthService.storeToken(network, newToken)
      return true
    }
  } catch (error) {
    logger.error(`Token refresh failed: ${String(error)}`)
    // Логаут при неудачном обновлении токена
    await logout(network)
  }

  return false
}

export async function validateVideoFile(network: string, file: File): Promise<string[]> {
  const errors: string[] = []

  // Общие проверки
  if (!file) {
    errors.push("No video file selected")
    return errors
  }

  if (!file.type.startsWith("video/")) {
    errors.push("Selected file is not a video")
    return errors
  }

  // Специфичные для платформы проверки
  switch (network) {
    case "tiktok":
      errors.push(...TikTokService.validateVideoFile(file))
      break
    case "youtube": {
      // YouTube имеет лимит 256GB или 12 часов
      const maxYouTubeSize = 256 * 1024 * 1024 * 1024 // 256GB
      if (file.size > maxYouTubeSize) {
        errors.push("Video file size must be less than 256GB")
      }
      break
    }
    case "vimeo":
      errors.push(...VimeoService.validateVideoFile(file))
      break
    case "telegram": {
      // Telegram имеет лимит 2GB
      const maxTelegramSize = 2 * 1024 * 1024 * 1024 // 2GB
      if (file.size > maxTelegramSize) {
        errors.push("Video file size must be less than 2GB")
      }
      break
    }
    default:
      // Для других платформ дополнительные проверки не требуются
      break
  }

  return errors
}

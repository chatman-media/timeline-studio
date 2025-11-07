// Vimeo API service для загрузки видео

import { createLogger } from "@/lib/tauri-logger"
import type { SocialExportSettings } from "../types/export-types"
import { OAuthService } from "./oauth-service"

const logger = createLogger({ module: "VimeoService" })

export interface VimeoUploadResult {
  success: boolean
  url?: string
  id?: string
  error?: string
}

export interface VimeoVideoMetadata {
  name: string
  description?: string
  privacy?: {
    view: "anybody" | "nobody" | "contacts" | "password" | "users" | "disable"
    embed?: "public" | "private"
  }
  tags?: string[]
  license?: "by" | "by-sa" | "by-nd" | "by-nc" | "by-nc-sa" | "by-nc-nd" | "cc0"
}

const API_BASE = "https://api.vimeo.com"

export async function getUserInfo(accessToken?: string): Promise<any> {
  if (!accessToken) {
    throw new Error("Access token is required")
  }

  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Vimeo API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error("Failed to get Vimeo user info:", error)
    throw error
  }
}

export async function uploadVideo(
  videoFile: File | Blob,
  metadata: VimeoVideoMetadata,
  onProgress?: (progress: number) => void,
): Promise<VimeoUploadResult> {
  try {
    // Получаем токен через OAuth service
    const tokenData = await OAuthService.getStoredToken("vimeo")
    if (!tokenData) {
      throw new Error("Not authenticated with Vimeo")
    }
    const token = tokenData.accessToken

    // 1. Создаем upload URL
    const createResponse = await fetch(`${API_BASE}/me/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        upload: {
          approach: "tus",
          size: videoFile.size,
        },
        name: metadata.name,
        description: metadata.description,
        privacy: metadata.privacy,
      }),
    })

    if (!createResponse.ok) {
      throw new Error(`Failed to create upload URL: ${createResponse.status}`)
    }

    const createData = await createResponse.json()
    const uploadUrl = createData.upload.upload_link
    const videoUri = createData.uri

    // 2. Загружаем файл с помощью tus protocol
    const uploadResponse = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/offset+octet-stream",
        "Upload-Offset": "0",
      },
      body: videoFile,
    })

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`)
    }

    // Имитируем прогресс (в реальной реализации нужно использовать tus клиент)
    if (onProgress) {
      const intervals = [20, 40, 60, 80, 100]
      for (const progress of intervals) {
        setTimeout(() => onProgress(progress), progress * 50)
      }
    }

    // 3. Обновляем метаданные видео
    if (metadata.tags && metadata.tags.length > 0) {
      await fetch(`${API_BASE}${videoUri}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tags: metadata.tags.join(","),
        }),
      })
    }

    return {
      success: true,
      url: `https://vimeo.com${videoUri.replace("/videos/", "/")}`,
      id: videoUri.replace("/videos/", ""),
    }
  } catch (error) {
    logger.error("Vimeo upload failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function exportSettings(settings: SocialExportSettings): Promise<VimeoVideoMetadata> {
  return {
    name: settings.title || "Untitled Video",
    description: settings.description || "",
    privacy: {
      view: settings.privacy === "private" ? "nobody" : "anybody",
      embed: "public",
    },
    tags: settings.tags || [],
  }
}

export function validateSettings(settings: SocialExportSettings): string[] {
  const errors: string[] = []

  if (!settings.title || settings.title.trim().length === 0) {
    errors.push("Title is required for Vimeo")
  }

  if (settings.title && settings.title.length > 128) {
    errors.push("Title must be 128 characters or less")
  }

  if (settings.description && settings.description.length > 5000) {
    errors.push("Description must be 5000 characters or less")
  }

  return errors
}

export function validateVideoFile(file: File): string[] {
  const errors: string[] = []

  // Vimeo поддерживает множество форматов
  const supportedTypes = [
    "video/mp4",
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/x-ms-wmv", // .wmv
    "video/x-flv", // .flv
    "video/webm",
    "video/3gpp", // .3gp
  ]

  if (!supportedTypes.includes(file.type)) {
    errors.push("Unsupported video format for Vimeo")
  }

  // Лимиты зависят от плана пользователя, но общие ограничения:
  const maxFileSize = 5 * 1024 * 1024 * 1024 // 5GB для Basic плана
  if (file.size > maxFileSize) {
    errors.push("Video file size exceeds 5GB limit")
  }

  return errors
}

export function getOptimalSettings(): Partial<SocialExportSettings> {
  return {
    resolution: "1080",
    frameRate: "30",
    format: "Mp4" as any,
    quality: "best",
  }
}

// TikTok API сервис для загрузки видео

import { createLogger } from "@/lib/tauri-logger"
import type { SocialExportSettings } from "../types/export-types"
import { OAuthService } from "./oauth-service"

const logger = createLogger({ module: "TiktokService" })

interface TikTokVideoMetadata {
  title: string
  description?: string
  privacy_level?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY"
  disable_duet?: boolean
  disable_comment?: boolean
  disable_stitch?: boolean
  video_cover_timestamp_ms?: number
}

interface TikTokUploadResponse {
  publish_id: string
  share_url?: string
  embed_url?: string
  unique_id?: string
}

const API_BASE = "https://open.tiktokapis.com/v2"

export async function uploadVideo(
  videoFile: File | Blob,
  metadata: TikTokVideoMetadata,
  onProgress?: (progress: number) => void,
): Promise<TikTokUploadResponse> {
  const token = await OAuthService.getStoredToken("tiktok")
  if (!token) {
    throw new Error("Not authenticated with TikTok")
  }

  try {
    // Шаг 1: Инициализация загрузки
    const initResponse = await initializeUpload(metadata, videoFile, token.accessToken)

    // Шаг 2: Загрузка видео файла
    await uploadVideoFile(videoFile, initResponse.upload_url, onProgress)

    // Шаг 3: Публикация видео
    const publishResponse = await publishVideo(initResponse.publish_id, token.accessToken)

    return publishResponse
  } catch (error) {
    logger.error(`TikTok upload error: ${String(error)}`)
    throw error
  }
}

async function initializeUpload(
  metadata: TikTokVideoMetadata,
  videoFile: File | Blob,
  accessToken: string,
): Promise<any> {
  const response = await fetch(`${API_BASE}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: metadata.title,
        description: metadata.description || "",
        privacy_level: metadata.privacy_level || "PUBLIC_TO_EVERYONE",
        disable_duet: metadata.disable_duet || false,
        disable_comment: metadata.disable_comment || false,
        disable_stitch: metadata.disable_stitch || false,
        video_cover_timestamp_ms: metadata.video_cover_timestamp_ms || 1000,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: (videoFile as File).size || 0,
        chunk_size: 10485760, // 10MB chunks
        total_chunk_count: Math.ceil(((videoFile as File).size || 0) / 10485760),
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`TikTok init failed: ${errorData.error?.message || "Unknown error"}`)
  }

  const result = await response.json()
  return result.data
}

async function uploadVideoFile(
  videoFile: File | Blob,
  uploadUrl: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"))
    })

    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", "video/mp4")
    xhr.send(videoFile)
  })
}

async function publishVideo(publishId: string, accessToken: string): Promise<TikTokUploadResponse> {
  const response = await fetch(`${API_BASE}/post/publish/status/fetch/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`TikTok publish failed: ${errorData.error?.message || "Unknown error"}`)
  }

  const result = await response.json()
  return {
    publish_id: publishId,
    share_url: result.data?.share_url,
    embed_url: result.data?.embed_url,
    unique_id: result.data?.unique_id,
  }
}

export async function getUserInfo(accessToken?: string): Promise<any> {
  let token = accessToken
  if (!token) {
    const storedToken = await OAuthService.getStoredToken("tiktok")
    token = storedToken?.accessToken
  }
  if (!token) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`${API_BASE}/user/info/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get user info")
  }

  const data = await response.json()
  return data.data?.user
}

export function validateSettings(settings: SocialExportSettings): string[] {
  const errors: string[] = []

  if (!settings.title || settings.title.trim().length === 0) {
    errors.push("Title is required")
  }

  if (settings.title && settings.title.length > 150) {
    errors.push("Title must be 150 characters or less")
  }

  if (settings.description && settings.description.length > 2200) {
    errors.push("Description must be 2200 characters or less")
  }

  // TikTok обычно ограничивает видео 10 минутами для большинства пользователей
  // Проверка длительности видео должна быть реализована на уровне приложения

  return errors
}

export async function exportSettings(settings: SocialExportSettings): Promise<TikTokVideoMetadata> {
  const privacyMap: Record<string, any> = {
    public: "PUBLIC_TO_EVERYONE",
    private: "SELF_ONLY",
    unlisted: "FOLLOWER_OF_CREATOR",
  }

  return {
    title: settings.title || "Untitled Video",
    description: settings.description,
    privacy_level: privacyMap[settings.privacy || "public"] || "PUBLIC_TO_EVERYONE",
    disable_duet: false,
    disable_comment: false,
    disable_stitch: false,
    video_cover_timestamp_ms: 1000,
  }
}

export function getOptimalSettings(): Partial<SocialExportSettings> {
  return {
    resolution: "1080", // TikTok рекомендует 1080x1920 (9:16)
    frameRate: "30", // 30 fps
    format: "Mp4" as any,
    quality: "good",
    useVerticalResolution: true, // Включить вертикальное разрешение для TikTok
  }
}

export function validateVideoFile(file: File): string[] {
  const errors: string[] = []

  // Проверяем размер файла (максимум 287 MB для TikTok)
  const maxSize = 287 * 1024 * 1024 // 287MB в байтах
  if (file.size > maxSize) {
    errors.push("Video file size must be less than 287MB")
  }

  // Проверяем формат файла
  const allowedTypes = ["video/mp4", "video/mov", "video/mpeg", "video/webm"]
  if (!allowedTypes.includes(file.type)) {
    errors.push("Video format must be MP4, MOV, MPEG, or WebM")
  }

  return errors
}

// YouTube API сервис для загрузки видео

import { createLogger } from "@/lib/tauri-logger"
import type { SocialExportSettings } from "../types/export-types"
import { OAuthService } from "./oauth-service"

const logger = createLogger({ module: "YoutubeService" })

interface YouTubeVideoMetadata {
  title: string
  description?: string
  tags?: string[]
  categoryId?: string
  privacy?: "public" | "private" | "unlisted"
  language?: string
  thumbnail?: string
}

interface YouTubeUploadResponse {
  id: string
  url: string
  status: string
}

const API_BASE = "https://www.googleapis.com/youtube/v3"

export async function uploadVideo(
  videoFile: File | Blob,
  metadata: YouTubeVideoMetadata,
  onProgress?: (progress: number) => void,
): Promise<YouTubeUploadResponse> {
  const token = await OAuthService.getStoredToken("youtube")
  if (!token) {
    throw new Error("Not authenticated with YouTube")
  }

  try {
    // Шаг 1: Создание видео с метаданными
    const videoResource = {
      snippet: {
        title: metadata.title,
        description: metadata.description || "",
        tags: metadata.tags || [],
        categoryId: metadata.categoryId || "22", // People & Blogs by default
        defaultLanguage: metadata.language || "en",
      },
      status: {
        privacyStatus: metadata.privacy || "private",
        embeddable: true,
        license: "youtube",
      },
    }

    // Шаг 2: Загрузка видео
    const formData = new FormData()
    formData.append("video", videoFile)
    formData.append("metadata", JSON.stringify(videoResource))

    const uploadResponse = await uploadWithProgress(
      `${API_BASE}/videos?part=snippet,status&uploadType=multipart`,
      formData,
      token.accessToken,
      onProgress,
    )

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(`YouTube upload failed: ${errorData.error?.message || "Unknown error"}`)
    }

    const result = await uploadResponse.json()

    // Шаг 3: Загрузка thumbnail (если указан)
    if (metadata.thumbnail && result.id) {
      await uploadThumbnail(result.id, metadata.thumbnail, token.accessToken)
    }

    return {
      id: result.id,
      url: `https://www.youtube.com/watch?v=${result.id}`,
      status: result.status?.uploadStatus || "uploaded",
    }
  } catch (error) {
    logger.error("YouTube upload error:", error)
    throw error
  }
}

async function uploadWithProgress(
  url: string,
  formData: FormData,
  accessToken: string,
  onProgress?: (progress: number) => void,
): Promise<Response> {
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
        resolve(new Response(xhr.responseText, { status: xhr.status }))
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"))
    })

    xhr.open("POST", url)
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
    xhr.send(formData)
  })
}

async function uploadThumbnail(videoId: string, thumbnailPath: string, accessToken: string): Promise<void> {
  try {
    // Загружаем thumbnail файл
    const response = await fetch(thumbnailPath)
    const thumbnailBlob = await response.blob()

    const formData = new FormData()
    formData.append("thumbnail", thumbnailBlob)

    const uploadResponse = await fetch(`${API_BASE}/thumbnails/set?videoId=${videoId}&uploadType=media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      logger.warn("Failed to upload thumbnail:", await uploadResponse.text())
    }
  } catch (error) {
    logger.warn("Thumbnail upload failed:", error)
    // Не прерываем основной процесс из-за ошибки thumbnail
  }
}

export async function getUserInfo(accessToken?: string): Promise<any> {
  let token = accessToken
  if (!token) {
    const storedToken = await OAuthService.getStoredToken("youtube")
    token = storedToken?.accessToken
  }
  if (!token) {
    throw new Error("Not authenticated")
  }

  const response = await fetch(`${API_BASE}/channels?part=snippet&mine=true`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get user info")
  }

  const data = await response.json()
  return data.items?.[0]
}

export async function getVideoCategories(regionCode = "US"): Promise<any[]> {
  const storedToken = await OAuthService.getStoredToken("youtube")
  const token = storedToken?.accessToken
  if (!token) {
    return []
  }

  try {
    const response = await fetch(`${API_BASE}/videoCategories?part=snippet&regionCode=${regionCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.items || []
  } catch {
    return []
  }
}

export function validateSettings(settings: SocialExportSettings): string[] {
  const errors: string[] = []

  if (!settings.title || settings.title.trim().length === 0) {
    errors.push("Title is required")
  }

  if (settings.title && settings.title.length > 100) {
    errors.push("Title must be 100 characters or less")
  }

  if (settings.description && settings.description.length > 5000) {
    errors.push("Description must be 5000 characters or less")
  }

  if (settings.tags && settings.tags.length > 500) {
    errors.push("Too many tags (maximum 500)")
  }

  return errors
}

export async function exportSettings(settings: SocialExportSettings): Promise<YouTubeVideoMetadata> {
  return {
    title: settings.title || "Untitled Video",
    description: settings.description,
    tags: settings.tags,
    privacy: settings.privacy || "private",
    language: settings.language || "en",
    thumbnail: settings.thumbnail,
  }
}

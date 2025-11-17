/**
 * Publication Task Types
 *
 * Типы для работы с задачами публикации видео на различные платформы
 */

/**
 * Статус публикации
 */
export enum PublicationStatus {
  Preparing = "preparing",
  Uploading = "uploading",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
}

/**
 * Платформы для публикации
 */
export enum PublicationPlatform {
  YouTube = "youtube",
  TikTok = "tiktok",
  VK = "vk",
  Instagram = "instagram",
  Facebook = "facebook",
  Twitter = "twitter",
  Custom = "custom",
}

/**
 * Прогресс публикации
 */
export interface PublicationProgress {
  /** Процент выполнения (0-100) */
  percentage: number
  /** Текущая стадия */
  stage: string
  /** Загружено байт */
  uploaded_bytes: number
  /** Всего байт */
  total_bytes: number
  /** Сообщение о прогрессе */
  message?: string
}

/**
 * Задача публикации
 */
export interface PublicationTask {
  /** ID задачи */
  id: string
  /** Платформа */
  platform: PublicationPlatform
  /** Название проекта */
  project_name: string
  /** Путь к видео файлу */
  video_path: string
  /** Заголовок публикации */
  title: string
  /** Описание */
  description?: string
  /** Теги */
  tags?: string[]
  /** Статус */
  status: PublicationStatus
  /** Прогресс */
  progress?: PublicationProgress
  /** Время создания (ISO 8601) */
  created_at: string
  /** Время завершения (ISO 8601) */
  completed_at?: string
  /** Сообщение об ошибке */
  error_message?: string
  /** URL опубликованного видео */
  video_url?: string
}

/**
 * Настройки публикации на YouTube
 */
export interface YouTubePublicationSettings {
  title: string
  description: string
  tags: string[]
  category: "education" | "entertainment" | "gaming" | "music" | "other"
  privacy: "private" | "unlisted" | "public"
}

/**
 * Настройки публикации на TikTok
 */
export interface TikTokPublicationSettings {
  title: string
  description?: string
  hashtags: string[]
  privacy: "private" | "public" | "friends_only"
}

/**
 * Настройки публикации на VK
 */
export interface VKPublicationSettings {
  title: string
  description?: string
  group_id?: string
  privacy: "private" | "public" | "friends_only"
}

/**
 * Объединенный тип настроек публикации
 */
export type PublicationSettings = YouTubePublicationSettings | TikTokPublicationSettings | VKPublicationSettings

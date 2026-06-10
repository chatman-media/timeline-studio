/**
 * Platform-related types for AI Services
 */

import type { AspectRatio as SharedAspectRatio } from "@timeline-studio/domains/shared/types/ai-tools/platform-adaptation"

// Platform identifier type
export type PlatformId = "youtube" | "instagram" | "tiktok" | "facebook" | "twitter" | "linkedin" | "vimeo" | "twitch"

// Re-export AspectRatio from shared types
export type AspectRatio = SharedAspectRatio

// Platform configuration
export interface Platform {
  id: PlatformId
  name: string
  specifications: {
    videoFormats: VideoFormat[]
    aspectRatios: AspectRatio[]
    maxDuration: number // in seconds
    maxFileSize: number // in MB
    features: {
      shorts: boolean
      stories: boolean
      live: boolean
      reels: boolean
      posts: boolean
    }
  }
}

export interface VideoFormat {
  resolution: string
  fps: number
  bitrate: number
  codec: string
}

// Adapted content for specific platform
export interface AdaptedContent {
  platformId: PlatformId
  title: string
  description: string
  hashtags: string[]
  thumbnail?: string
  videoUrl?: string
  metadata: {
    duration: number
    fileSize: number
    format: VideoFormat
    aspectRatio: AspectRatio
  }
  optimizations: {
    seo: boolean
    accessibility: boolean
    engagement: boolean
  }
  publishSettings?: {
    scheduledTime?: Date
    visibility: "public" | "private" | "unlisted"
    category?: string
    tags?: string[]
  }
}

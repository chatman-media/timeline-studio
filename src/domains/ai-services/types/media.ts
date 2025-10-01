/**
 * Media Types for AI Services
 */

export interface MediaFile {
  path: string
  name: string
  filename: string
  type: "video" | "audio" | "image"
  duration: number
  size?: number
  metadata?: Record<string, any>
}

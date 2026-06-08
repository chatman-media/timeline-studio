/**
 * Core-facing media types used by UI slices.
 * Keep this file independent from domain packages so type-only UI props can
 * move off domain re-exports before media-management is extracted.
 */

export interface MediaFile {
  id: string
  name: string
  path: string
  type: string
  duration?: number
  size?: number
  createdAt?: Date
  updatedAt?: Date
  width?: number
  height?: number
  fps?: number
  bitrate?: number
  thumbnailPath?: string
  metadata?: {
    type?: string
    bitrate?: number
    codec?: string
    width?: number
    height?: number
    fps?: number
    duration?: number
    channels?: number
    sample_rate?: number
    [key: string]: unknown
  }
  isVideo?: boolean
  isImage?: boolean
  isAudio?: boolean
  isAddedToTimeline?: boolean
  isIncluded?: boolean
  isUnavailable?: boolean
  lastCheckedAt?: number
  isLoadingMetadata?: boolean
  source?: string
  [key: string]: unknown
}

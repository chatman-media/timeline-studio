/**
 * Professional Media Types for Video Editing
 *
 * Профессиональные типы медиафайлов по аналогии с DaVinci Resolve
 */

export type { MediaFile } from "@/domains/shared/types/media/media-file"
export {
  isAudioFile,
  isImageFile,
  isVideoFile,
  MediaCodec,
  MediaColorSpace,
} from "@/domains/shared/types/media/media-file"
// Re-export from canonical source in shared
export { MediaType } from "@/domains/shared/types/media/types"

// Video editing specific utilities

export const MediaFileUtils = {
  isVideo: (type: string) => type === "Video" || type === "video_with_audio",
  isAudio: (type: string) => ["Audio", "music", "voiceover", "sfx", "ambient"].includes(type),
  isImage: (type: string) => type === "Image" || type === "image_sequence",
}

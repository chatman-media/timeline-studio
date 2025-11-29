/**
 * Re-export commonly used types from video-editing domain
 * This allows features to import types from @/core/types instead of directly from domains
 */

export type { ProjectSchema, RenderJob } from "@/domains/video-editing/types"

// Export enums as both type and value
export { AspectRatio, OutputFormat, RenderStatus } from "@/domains/video-editing/types"

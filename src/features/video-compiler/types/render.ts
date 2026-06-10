/**
 * Типы для системы рендеринга видео
 *
 * Re-export from core-facing compiler contracts
 */

import { OutputFormat as CoreOutputFormat, RenderStatus as CoreRenderStatus } from "@timeline-studio/core/types/video-editing"

export type {
  RenderJob,
  RenderProgress,
  RenderSettings,
  RenderStatistics,
  VideoRenderJob,
} from "@timeline-studio/core/types/video-editing"

export type OutputFormat = import("@timeline-studio/core/types/video-editing").OutputFormat
export type RenderStatus = import("@timeline-studio/core/types/video-editing").RenderStatus

export const OutputFormat = CoreOutputFormat
export const RenderStatus = CoreRenderStatus

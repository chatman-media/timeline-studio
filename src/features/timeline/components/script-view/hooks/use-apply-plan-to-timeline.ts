/**
 * Hook для применения Script Plan к Timeline
 */

import { useCallback, useState } from "react"
import { useMediaFiles } from "@timeline-studio/core/hooks/use-media-files"
import { mediaItemToMediaFile } from "@/features/multicam/utils/media-mapper"
import { useClips } from "@/features/timeline/hooks/clips/use-clips"
import { useTracks } from "@/features/timeline/hooks/state/use-tracks"
import type { ScriptFragment, ScriptPlan } from "@/features/timeline/types/script"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseApplyPlanToTimeline")

export interface UseApplyPlanToTimelineReturn {
  applyPlanToTimeline: (plan: ScriptPlan, fragments: ScriptFragment[]) => Promise<void>
  isApplying: boolean
  error: string | null
}

export function useApplyPlanToTimeline(): UseApplyPlanToTimelineReturn {
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { addClip } = useClips()
  const { tracks } = useTracks()
  const { mediaFiles } = useMediaFiles()

  const applyPlanToTimeline = useCallback(
    async (plan: ScriptPlan, fragments: ScriptFragment[]) => {
      try {
        setIsApplying(true)
        setError(null)

        // Находим первый видео трек
        const videoTrack = tracks.find((t) => t.type === "video")
        if (!videoTrack) {
          throw new Error("Не найден видео трек")
        }

        // Добавляем клипы на Timeline согласно плану
        let currentTime = 0

        for (const scene of plan.scenes) {
          // Находим фрагмент для этой сцены
          const fragment = fragments.find((f) => f.id === scene.fragmentId)
          if (!fragment) continue

          // Находим медиа файл для этого фрагмента
          const mediaFile = mediaFiles.find((f) => f.id === fragment.fileId)
          if (!mediaFile) continue

          // Добавляем клип на Timeline
          await addClip(videoTrack.id, mediaItemToMediaFile(mediaFile), currentTime, scene.duration)

          // Переходим к следующей позиции
          currentTime += scene.duration
        }

        logger.info("Plan applied to timeline", { sceneCount: plan.scenes.length })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Ошибка применения плана"
        setError(errorMessage)
        logger.error("Failed to apply plan to timeline", { error: err })
      } finally {
        setIsApplying(false)
      }
    },
    [addClip, tracks, mediaFiles],
  )

  return {
    applyPlanToTimeline,
    isApplying,
    error,
  }
}

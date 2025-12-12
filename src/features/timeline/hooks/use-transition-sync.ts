/**
 * Hook для синхронизации переходов при операциях с клипами
 */

import { useCallback } from "react"
import type { TimelineClip, TimelineProject } from "@/features/timeline/types"
import {
  syncTransitionsOnClipDelete,
  syncTransitionsOnClipMove,
  syncTransitionsOnClipSplit,
  syncTransitionsOnClipTrim,
} from "../services/clip-transition-sync"

interface UseTransitionSyncProps {
  project: TimelineProject | null
  updateProject: (project: TimelineProject) => void
}

export function useTransitionSync({ project, updateProject }: UseTransitionSyncProps) {
  /**
   * Обёртка для moveClip с синхронизацией переходов
   */
  const syncMoveClip = useCallback(
    (
      clipId: string,
      oldTrackId: string,
      newTrackId: string,
      oldPosition: number,
      newPosition: number,
      duration: number,
    ) => {
      if (!project) return

      const updatedProject = syncTransitionsOnClipMove(
        project,
        clipId,
        oldTrackId,
        newTrackId,
        oldPosition,
        newPosition,
        duration,
      )

      updateProject(updatedProject)
    },
    [project, updateProject],
  )

  /**
   * Обёртка для trimClip с синхронизацией переходов
   */
  const syncTrimClip = useCallback(
    (
      clipId: string,
      trackId: string,
      oldStartTime: number,
      newStartTime: number,
      oldDuration: number,
      newDuration: number,
    ) => {
      if (!project) return

      const updatedProject = syncTransitionsOnClipTrim(
        project,
        clipId,
        trackId,
        oldStartTime,
        newStartTime,
        oldDuration,
        newDuration,
      )

      updateProject(updatedProject)
    },
    [project, updateProject],
  )

  /**
   * Обёртка для removeClip с синхронизацией переходов
   */
  const syncRemoveClip = useCallback(
    (clipId: string) => {
      if (!project) return

      const updatedProject = syncTransitionsOnClipDelete(project, clipId)
      updateProject(updatedProject)
    },
    [project, updateProject],
  )

  /**
   * Обёртка для splitClip с синхронизацией переходов
   */
  const syncSplitClip = useCallback(
    (originalClipId: string, leftClipId: string, rightClipId: string, splitTime: number) => {
      if (!project) return

      const updatedProject = syncTransitionsOnClipSplit(project, originalClipId, leftClipId, rightClipId, splitTime)
      updateProject(updatedProject)
    },
    [project, updateProject],
  )

  /**
   * Найти клип в проекте
   */
  const findClip = useCallback(
    (clipId: string): TimelineClip | null => {
      if (!project) return null

      // Ищем в секциях
      for (const section of project.sections) {
        for (const track of section.tracks) {
          const clip = track.clips.find((c) => c.id === clipId)
          if (clip) return clip
        }
      }

      // Ищем в глобальных треках
      for (const track of project.globalTracks) {
        const clip = track.clips.find((c) => c.id === clipId)
        if (clip) return clip
      }

      return null
    },
    [project],
  )

  return {
    syncMoveClip,
    syncTrimClip,
    syncRemoveClip,
    syncSplitClip,
    findClip,
  }
}

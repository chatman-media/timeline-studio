/**
 * Hook для работы с ресурсами (эффектами, фильтрами, переходами) на клипах
 */

import { useCallback } from "react"
import type { TimelineClip as DomainTimelineClip } from "@/domains/video-editing/types"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { Transition } from "@/features/transitions/types/transitions"
import type { TimelineClip } from "../types"
import { useTimeline } from "./use-timeline"

export interface UseClipResourcesReturn {
  // Применение ресурсов к клипу
  applyEffectToClip: (clipId: string, effect: VideoEffect) => void
  applyFilterToClip: (clipId: string, filter: VideoFilter) => void
  applyTransitionToClip: (clipId: string, transition: Transition, type: "in" | "out") => void

  // Удаление ресурсов с клипа
  removeEffectFromClip: (clipId: string, effectId: string) => void
  removeFilterFromClip: (clipId: string, filterId: string) => void
  removeTransitionFromClip: (clipId: string, transitionId: string) => void

  // Получение примененных ресурсов
  getClipEffects: (clipId: string) => TimelineClip["effects"]
  getClipFilters: (clipId: string) => TimelineClip["filters"]
  getClipTransitions: (clipId: string) => TimelineClip["transitions"]

  // Проверка совместимости
  canApplyEffectToClip: (clipId: string, effect: VideoEffect) => boolean
  canApplyFilterToClip: (clipId: string, filter: VideoFilter) => boolean
  canApplyTransitionToClip: (clipId: string, transition: Transition) => boolean
}

export function useClipResources(): UseClipResourcesReturn {
  const { project, send } = useTimeline()

  const applyEffectToClip = useCallback(
    (clipId: string, effect: VideoEffect) => {
      send({
        type: "APPLY_EFFECT_TO_CLIP",
        clipId,
        effect,
      })
    },
    [send],
  )

  const applyFilterToClip = useCallback(
    (clipId: string, filter: VideoFilter) => {
      send({
        type: "APPLY_FILTER_TO_CLIP",
        clipId,
        filter,
      })
    },
    [send],
  )

  const applyTransitionToClip = useCallback(
    (clipId: string, transition: Transition, type: "in" | "out") => {
      send({
        type: "APPLY_TRANSITION_TO_CLIP",
        clipId,
        transition,
        transitionType: type,
      })
    },
    [send],
  )

  const removeEffectFromClip = useCallback(
    (clipId: string, effectId: string) => {
      send({
        type: "REMOVE_EFFECT_FROM_CLIP",
        clipId,
        effectId,
      })
    },
    [send],
  )

  const removeFilterFromClip = useCallback(
    (clipId: string, filterId: string) => {
      send({
        type: "REMOVE_FILTER_FROM_CLIP",
        clipId,
        filterId,
      })
    },
    [send],
  )

  const removeTransitionFromClip = useCallback(
    (clipId: string, transitionId: string) => {
      send({
        type: "REMOVE_TRANSITION_FROM_CLIP",
        clipId,
        transitionId,
      })
    },
    [send],
  )

  const getClipEffects = useCallback(
    (clipId: string) => {
      if (!project) return []

      // Найти клип в проекте и вернуть его эффекты
      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      return (clip as DomainTimelineClip)?.effects || ([] as any)
    },
    [project],
  )

  const getClipFilters = useCallback(
    (clipId: string) => {
      if (!project) return []

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      return (clip as DomainTimelineClip)?.filters || ([] as any)
    },
    [project],
  )

  const getClipTransitions = useCallback(
    (clipId: string) => {
      if (!project) return []

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      return (clip as DomainTimelineClip)?.transitions || ([] as any)
    },
    [project],
  )

  const canApplyEffectToClip = useCallback(
    (clipId: string, _effect: VideoEffect) => {
      if (!project) return false

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      if (!clip) return false

      // По умолчанию эффекты можно применять к любым клипам
      // TODO: Добавить проверку типа клипа через track type
      return true
    },
    [project],
  )

  const canApplyFilterToClip = useCallback(
    (clipId: string, _filter: VideoFilter) => {
      if (!project) return false

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      if (!clip) return false

      // По умолчанию фильтры можно применять к любым клипам
      // TODO: Добавить проверку типа клипа через track type
      return true
    },
    [project],
  )

  const canApplyTransitionToClip = useCallback(
    (clipId: string, _transition: Transition) => {
      if (!project) return false

      const allClips = project.sections
        .flatMap((section) => section.tracks.flatMap((track) => track.clips))
        .concat(project.globalTracks.flatMap((track) => track.clips))

      const clip = allClips.find((c) => c.id === clipId)
      if (!clip) return false

      // По умолчанию переходы можно применять к любым клипам
      // TODO: Добавить проверку типа клипа через track type
      return true
    },
    [project],
  )

  return {
    applyEffectToClip,
    applyFilterToClip,
    applyTransitionToClip,
    removeEffectFromClip,
    removeFilterFromClip,
    removeTransitionFromClip,
    getClipEffects,
    getClipFilters,
    getClipTransitions,
    canApplyEffectToClip,
    canApplyFilterToClip,
    canApplyTransitionToClip,
  }
}

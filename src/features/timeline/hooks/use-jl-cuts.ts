import { useCallback } from "react"
import type { TimelineClip } from "@/domains/video-editing/types/timeline"
import type { CutType, JLCutPreview, LinkedClipPair } from "../types/jl-cuts"
import { getAudioOffsetForCut } from "../types/jl-cuts"
import { useTimeline } from "./use-timeline"

export interface UseJLCutsReturn {
  // Создание J/L cuts
  createJCut: (clipId: string, offset: number) => void
  createLCut: (clipId: string, offset: number) => void
  resetCut: (clipId: string) => void

  // Link/Unlink операции
  linkClips: (videoClipId: string, audioClipId: string) => void
  unlinkClips: (clipId: string) => void

  // Запросы
  getLinkedClip: (clipId: string) => TimelineClip | null
  getLinkedPair: (clipId: string) => LinkedClipPair | null
  getCutPreview: (clipId: string, cutType: CutType, offset: number) => JLCutPreview | null

  // Утилиты
  isVideoClip: (clip: TimelineClip) => boolean
  isAudioClip: (clip: TimelineClip) => boolean
  hasJLCut: (clipId: string) => boolean
}

export function useJLCuts(): UseJLCutsReturn {
  const { project, updateClip } = useTimeline()

  // Проверка типа клипа
  const isVideoClip = useCallback(
    (clip: TimelineClip): boolean => {
      if (!project) return false

      const track = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
        (t) => t.id === clip.trackId,
      )

      return track?.type === "video" || track?.type === "image"
    },
    [project],
  )

  const isAudioClip = useCallback(
    (clip: TimelineClip): boolean => {
      if (!project) return false

      const track = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
        (t) => t.id === clip.trackId,
      )

      return ["audio", "music", "voiceover", "sfx", "ambient"].includes(track?.type || "")
    },
    [project],
  )

  // Получение связанного клипа
  const getLinkedClip = useCallback(
    (clipId: string): TimelineClip | null => {
      if (!project) return null

      const allClips = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].flatMap(
        (track) => track.clips,
      )

      const clip = allClips.find((c) => c.id === clipId)
      if (!clip?.linkedClipId) return null

      return allClips.find((c) => c.id === clip.linkedClipId) || null
    },
    [project],
  )

  // Получение связанной пары
  const getLinkedPair = useCallback(
    (clipId: string): LinkedClipPair | null => {
      if (!project) return null

      const clip = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]
        .flatMap((track) => track.clips)
        .find((c) => c.id === clipId)

      if (!clip) return null

      const linkedClip = getLinkedClip(clipId)
      if (!linkedClip) return null

      const videoClip = isVideoClip(clip) ? clip : linkedClip
      const audioClip = isAudioClip(clip) ? clip : linkedClip

      if (!isVideoClip(videoClip) || !isAudioClip(audioClip)) return null

      return {
        videoClipId: videoClip.id,
        audioClipId: audioClip.id,
        isLinked: clip.isLinked || false,
        audioOffset: audioClip.audioOffset || 0,
      }
    },
    [project, getLinkedClip, isVideoClip, isAudioClip],
  )

  // Создание J-Cut
  const createJCut = useCallback(
    async (clipId: string, offset: number) => {
      const pair = getLinkedPair(clipId)
      if (!pair) return

      // Обновляем audioOffset для создания J-cut (аудио начинается раньше видео)
<<<<<<< HEAD
      await updateClip(pair.audioClipId, {
=======
      updateClip(pair.audioClipId, {
>>>>>>> e6f6b244bcf (fix(types): Массовое исправление TypeScript ошибок - 5 агентов (616 ошибок))
        audioOffset: -Math.abs(offset), // Отрицательное значение для J-cut
      })
    },
    [getLinkedPair, updateClip],
  )

  // Создание L-Cut
  const createLCut = useCallback(
    async (clipId: string, offset: number) => {
      const pair = getLinkedPair(clipId)
      if (!pair) return

      // Обновляем audioOffset для создания L-cut (аудио продолжается после видео)
<<<<<<< HEAD
      await updateClip(pair.audioClipId, {
=======
      updateClip(pair.audioClipId, {
>>>>>>> e6f6b244bcf (fix(types): Массовое исправление TypeScript ошибок - 5 агентов (616 ошибок))
        audioOffset: Math.abs(offset), // Положительное значение для L-cut
      })
    },
    [getLinkedPair, updateClip],
  )

  // Сброс cut
  const resetCut = useCallback(
    async (clipId: string) => {
      const pair = getLinkedPair(clipId)
      if (!pair) return

      // Сбрасываем audioOffset обратно в 0
<<<<<<< HEAD
      await updateClip(pair.audioClipId, {
=======
      updateClip(pair.audioClipId, {
>>>>>>> e6f6b244bcf (fix(types): Массовое исправление TypeScript ошибок - 5 агентов (616 ошибок))
        audioOffset: 0,
      })
    },
    [getLinkedPair, updateClip],
  )

  // Связывание клипов
  const linkClips = useCallback(
<<<<<<< HEAD
    async (videoClipId: string, audioClipId: string) => {
      // Обновляем оба клипа для создания связи
      await updateClip(videoClipId, {
        linkedClipId: audioClipId,
        isLinked: true,
      })
      await updateClip(audioClipId, {
=======
    (videoClipId: string, audioClipId: string) => {
      // Обновляем оба клипа для создания связи
      updateClip(videoClipId, {
        linkedClipId: audioClipId,
        isLinked: true,
      })
      updateClip(audioClipId, {
>>>>>>> e6f6b244bcf (fix(types): Массовое исправление TypeScript ошибок - 5 агентов (616 ошибок))
        linkedClipId: videoClipId,
        isLinked: true,
      })
    },
    [updateClip],
  )

  // Разрыв связи
  const unlinkClips = useCallback(
    async (clipId: string) => {
      const linkedClip = getLinkedClip(clipId)
      if (!linkedClip) return

      // Обновляем оба клипа для разрыва связи
<<<<<<< HEAD
      await updateClip(clipId, {
=======
      updateClip(clipId, {
>>>>>>> e6f6b244bcf (fix(types): Массовое исправление TypeScript ошибок - 5 агентов (616 ошибок))
        linkedClipId: undefined,
        isLinked: false,
        audioOffset: 0, // Сбрасываем offset при разрыве связи
      })
<<<<<<< HEAD
      await updateClip(linkedClip.id, {
=======
      updateClip(linkedClip.id, {
>>>>>>> e6f6b244bcf (fix(types): Массовое исправление TypeScript ошибок - 5 агентов (616 ошибок))
        linkedClipId: undefined,
        isLinked: false,
        audioOffset: 0,
      })
    },
    [getLinkedClip, updateClip],
  )

  // Предпросмотр cut
  const getCutPreview = useCallback(
    (clipId: string, cutType: CutType, offset: number): JLCutPreview | null => {
      const pair = getLinkedPair(clipId)
      if (!pair) return null

      const videoClip = [...project!.globalTracks, ...project!.sections.flatMap((s) => s.tracks)]
        .flatMap((track) => track.clips)
        .find((c) => c.id === pair.videoClipId)

      const audioClip = [...project!.globalTracks, ...project!.sections.flatMap((s) => s.tracks)]
        .flatMap((track) => track.clips)
        .find((c) => c.id === pair.audioClipId)

      if (!videoClip || !audioClip) return null

      const audioOffset = getAudioOffsetForCut(cutType, offset)

      return {
        videoStart: videoClip.startTime,
        videoEnd: videoClip.startTime + videoClip.duration,
        audioStart: videoClip.startTime + audioOffset,
        audioEnd: videoClip.startTime + audioClip.duration + audioOffset,
        cutType,
        offset: audioOffset,
      }
    },
    [project, getLinkedPair],
  )

  // Проверка наличия J/L cut
  const hasJLCut = useCallback(
    (clipId: string): boolean => {
      const pair = getLinkedPair(clipId)
      return pair ? pair.audioOffset !== 0 : false
    },
    [getLinkedPair],
  )

  return {
    createJCut,
    createLCut,
    resetCut,
    linkClips,
    unlinkClips,
    getLinkedClip,
    getLinkedPair,
    getCutPreview,
    isVideoClip,
    isAudioClip,
    hasJLCut,
  }
}

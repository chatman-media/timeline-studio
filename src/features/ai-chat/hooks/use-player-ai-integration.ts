import { useCallback, useEffect } from "react"

import { usePlayer } from "../../video-player"

// Временно определяем типы локально, пока не реализованы player tools
interface CurrentMedia {
  id: string
  path: string
  name: string
  type: "video" | "audio"
  duration?: number
  probeData?: any
}

interface PlayerStateAccess {
  getPlayerState: () => any
  getCurrentMedia: () => CurrentMedia | null
  getPlaybackStatus: () => any
  getAppliedEffects: () => any
  play: () => void
  pause: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  applyEffect: (effect: any) => void
  removeEffect: (effectId: string) => void
  applyFilter: (filter: any) => void
  removeFilter: (filterId: string) => void
  applyTemplate: (template: any, files: CurrentMedia[]) => void
  clearTemplate: () => void
  setMedia: (media: CurrentMedia) => void
  analyzeMediaQuality: () => any
  getPlayerStats: () => any
}

// Временная заглушка для setPlayerStateAccess
let playerStateAccess: PlayerStateAccess | null = null
const setPlayerStateAccess = (access: PlayerStateAccess | null) => {
  playerStateAccess = access
}

/**
 * Хук для интеграции Player с AI функциональностью
 * Предоставляет доступ к состоянию плеера для AI инструментов
 */
export function usePlayerAIIntegration() {
  const player = usePlayer() as any

  // Функция для получения текущего медиа
  const getCurrentMedia = useCallback((): CurrentMedia | null => {
    // Приоритет: previewMedia > currentVideo
    return player.previewMedia || player.currentVideo
  }, [player.previewMedia, player.currentVideo])

  // Функция для получения статуса воспроизведения
  const getPlaybackStatus = useCallback(() => {
    return {
      isPlaying: player.isPlaying,
      currentTime: player.currentTime,
      duration: player.duration,
      playbackRate: player.currentPlaybackRate,
      volume: player.volume,
      isSeeking: player.isSeeking,
      isLoading: player.isVideoLoading,
      isReady: player.isVideoReady,
    }
  }, [
    player.isPlaying,
    player.currentTime,
    player.duration,
    player.currentPlaybackRate,
    player.volume,
    player.isSeeking,
    player.isVideoLoading,
    player.isVideoReady,
  ])

  // Функция для получения примененных эффектов
  const getAppliedEffects = useCallback(() => {
    return {
      effects: player.appliedEffects || [],
      filters: player.appliedFilters || [],
      template: player.appliedTemplate,
    }
  }, [player.appliedEffects, player.appliedFilters, player.appliedTemplate])

  // Функция для анализа качества медиа
  const analyzeMediaQuality = useCallback((): {
    issues: Array<{
      type: string
      severity: "low" | "medium" | "high"
      message: string
    }>
    overall: number
  } | null => {
    const media = getCurrentMedia()
    if (!media) return null

    const issues: Array<{
      type: string
      severity: "low" | "medium" | "high"
      message: string
    }> = []
    const videoStream = media.probeData?.streams?.find((s: any) => s.codec_type === "video")
    const audioStream = media.probeData?.streams?.find((s: any) => s.codec_type === "audio")

    // Функция для безопасного парсинга frame rate
    const parseFrameRate = (frameRateStr: string): number => {
      if (!frameRateStr) return 0
      const parts = frameRateStr.split("/")
      if (parts.length === 2) {
        const numerator = Number.parseFloat(parts[0])
        const denominator = Number.parseFloat(parts[1])
        return denominator !== 0 ? numerator / denominator : 0
      }
      return Number.parseFloat(frameRateStr) || 0
    }

    // Проверка качества видео
    if (videoStream) {
      const width = videoStream.width || 0
      const height = videoStream.height || 0
      const bitrate = Number.parseInt(videoStream.bit_rate || "0", 10) || 0
      const fps = parseFrameRate(videoStream.r_frame_rate || "0")

      if (width < 1280 || height < 720) {
        issues.push({
          type: "low_resolution",
          severity: "medium",
          message: `Низкое разрешение: ${width}x${height}`,
        })
      }

      if (bitrate < 1000000 && bitrate > 0) {
        issues.push({
          type: "low_bitrate",
          severity: "medium",
          message: `Низкий битрейт: ${(bitrate / 1000000).toFixed(1)} Mbps`,
        })
      }

      if (fps < 24 && fps > 0) {
        issues.push({
          type: "low_fps",
          severity: "medium",
          message: `Низкая частота кадров: ${fps} fps`,
        })
      }
    }

    // Проверка качества аудио
    if (audioStream) {
      const sampleRate = Number.parseInt(audioStream.sample_rate || "0", 10) || 0
      const bitrate = Number.parseInt(audioStream.bit_rate || "0", 10) || 0

      if (sampleRate < 44100 && sampleRate > 0) {
        issues.push({
          type: "low_sample_rate",
          severity: "low",
          message: `Низкая частота дискретизации: ${sampleRate} Hz`,
        })
      }

      if (bitrate < 128000 && bitrate > 0) {
        issues.push({
          type: "low_audio_bitrate",
          severity: "low",
          message: `Низкий битрейт аудио: ${(bitrate / 1000).toFixed(0)} kbps`,
        })
      }
    }

    // Расчет общего качества (0-100)
    const overall = Math.max(0, 100 - issues.length * 15)

    return {
      issues,
      overall,
    }
  }, [getCurrentMedia])

  // Эффект для установки доступа к состоянию плеера
  useEffect(() => {
    const playerAccess: PlayerStateAccess = {
      getPlayerState: () => ({
        currentMedia: getCurrentMedia(),
        isPlaying: player.isPlaying,
        currentTime: player.currentTime,
        duration: player.duration,
        volume: player.volume,
        playbackRate: player.currentPlaybackRate,
        appliedEffects: player.appliedEffects || [],
        appliedFilters: player.appliedFilters || [],
        appliedTemplate: player.appliedTemplate,
        videoSource: player.videoSource,
      }),
      getCurrentMedia,
      getPlaybackStatus,
      getAppliedEffects,
      play: player.play,
      pause: player.pause,
      seek: player.seek,
      setVolume: player.setVolume,
      setPlaybackRate: player.setPlaybackRate,
      applyEffect: player.applyEffect,
      removeEffect: (effectId: string) => {
        // Удаляем эффект из списка
        const updatedEffects = (player.appliedEffects || []).filter((e: any) => e.id !== effectId)
        player.clearEffects()
        updatedEffects.forEach((e: any) => player.applyEffect(e))
      },
      applyFilter: player.applyFilter,
      removeFilter: (filterId: string) => {
        // Удаляем фильтр из списка
        const updatedFilters = (player.appliedFilters || []).filter((f: any) => f.id !== filterId)
        player.clearFilters()
        updatedFilters.forEach((f: any) => player.applyFilter(f))
      },
      applyTemplate: (template: any, files: CurrentMedia[]) => {
        player.applyTemplate(template, files)
      },
      clearTemplate: player.clearTemplate,
      setMedia: (media: CurrentMedia) => {
        player.setPreviewMedia(media)
        player.setVideoSource("browser")
      },
      analyzeMediaQuality,
      getPlayerStats: () => ({
        totalPlayTime: player.currentTime,
        mediaCount: player.currentVideo ? 1 : 0,
        effectsCount: (player.appliedEffects || []).length,
        filtersCount: (player.appliedFilters || []).length,
        hasTemplate: player.appliedTemplate !== null,
        speedRampingEnabled: player.speedRampingEnabled || false,
      }),
    }

    // Устанавливаем доступ для AI инструментов
    setPlayerStateAccess(playerAccess)

    // Очищаем при размонтировании
    return () => {
      setPlayerStateAccess(null)
    }
  }, [player, getCurrentMedia, getPlaybackStatus, getAppliedEffects, analyzeMediaQuality])

  return {
    isReady: player.isVideoReady && getCurrentMedia() !== null,
    hasMedia: getCurrentMedia() !== null,
    isPlaying: player.isPlaying,
    effectsCount: (player.appliedEffects || []).length,
    filtersCount: (player.appliedFilters || []).length,
  }
}

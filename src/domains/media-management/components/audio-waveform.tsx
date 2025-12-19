/**
 * AudioWaveform Component
 *
 * Интерактивная визуализация аудио waveform используя peaks.js
 * Поддерживает zoom, playback, markers и regions
 */

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { usePeaksWaveform } from "../hooks/use-peaks-waveform"
import type { PeaksInstance } from "../types/peaks-waveform"

export interface AudioWaveformProps {
  /** URL аудио файла */
  audioUrl: string

  /** URL waveform данных (опционально) */
  dataUri?: string

  /** Классы для контейнера */
  className?: string

  /** Высота overview */
  overviewHeight?: number

  /** Высота zoomview */
  zoomviewHeight?: number

  /** Цвет waveform */
  waveformColor?: string

  /** Цвет проигранной части */
  playedWaveformColor?: string

  /** Показать overview */
  showOverview?: boolean

  /** Показать zoomview */
  showZoomview?: boolean

  /** Показать контролы плеера */
  showControls?: boolean

  /** Callback когда peaks готов */
  onReady?: (peaks: PeaksInstance) => void

  /** Callback при ошибке */
  onError?: (error: Error) => void
}

export function AudioWaveform({
  audioUrl,
  dataUri,
  className,
  overviewHeight = 85,
  zoomviewHeight = 200,
  waveformColor = "#3b82f6",
  playedWaveformColor = "#1e40af",
  showOverview = true,
  showZoomview = true,
  showControls = false,
  onReady,
  onError,
}: AudioWaveformProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const { overviewRef, zoomviewRef, isLoading, error, isReady, play, pause } = usePeaksWaveform({
    audioUrl,
    dataUri,
    waveformColor,
    playedWaveformColor,
    onReady,
    onError,
  })

  // Создаем audio элемент
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current
    audio.src = audioUrl
    audio.preload = "auto"
  }, [audioUrl])

  if (error) {
    return (
      <div className={cn("flex items-center justify-center p-4 text-sm text-red-500", className)} data-oid="cc2yyvd">
        <div className="text-center" data-oid="wmziw2:">
          <p className="font-medium" data-oid="pj-ks74">
            Failed to load waveform
          </p>
          <p className="mt-1 text-xs opacity-75" data-oid="rcx-.tr">
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} data-oid="q1-0t2y">
        <div className="flex items-center space-x-2" data-oid="kkpnbcz">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
            data-oid="qauna5:"
          />

          <span className="text-sm text-muted-foreground" data-oid="qny4f8w">
            Loading waveform...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)} data-oid="sfx4b3u">
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: "none" }} data-oid="7d0.3jo" />

      {/* Overview waveform */}
      {showOverview && (
        <div className="relative mb-2" data-oid="21y2046">
          <div
            ref={overviewRef}
            style={{ height: `${overviewHeight}px` }}
            className="w-full rounded border bg-background"
            data-oid="oyiszw3"
          />

          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80" data-oid="sca:in-">
              <span className="text-xs text-muted-foreground" data-oid="rt6g6_x">
                Initializing overview...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Zoomview waveform */}
      {showZoomview && (
        <div className="relative" data-oid="6u1ia4c">
          <div
            ref={zoomviewRef}
            style={{ height: `${zoomviewHeight}px` }}
            className="w-full rounded border bg-background"
            data-oid="1zhzx3d"
          />

          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80" data-oid="f.5vq.v">
              <span className="text-xs text-muted-foreground" data-oid="569kqzl">
                Initializing waveform...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Playback controls */}
      {showControls && isReady && (
        <div className="mt-2 flex items-center space-x-2" data-oid="vu:0mf-">
          <button
            onClick={play}
            className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
            type="button"
            data-oid="5-dd69v"
          >
            Play
          </button>
          <button
            onClick={pause}
            className="rounded bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:bg-secondary/90"
            type="button"
            data-oid="fxiotjk"
          >
            Pause
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Компактная версия waveform для таймлайна
 */
export interface AudioWaveformCompactProps {
  audioUrl: string
  dataUri?: string
  className?: string
  height?: number
  waveformColor?: string
  onReady?: (peaks: PeaksInstance) => void
}

export function AudioWaveformCompact({
  audioUrl,
  dataUri,
  className,
  height = 60,
  waveformColor = "#3b82f6",
  onReady,
}: AudioWaveformCompactProps) {
  return (
    <AudioWaveform
      audioUrl={audioUrl}
      dataUri={dataUri}
      className={className}
      overviewHeight={height}
      waveformColor={waveformColor}
      showOverview={true}
      showZoomview={false}
      showControls={false}
      onReady={onReady}
      data-oid="orhptl."
    />
  )
}

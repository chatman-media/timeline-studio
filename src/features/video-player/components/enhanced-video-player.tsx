/**
 * Улучшенный видеоплеер с поддержкой пререндера
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MediaType } from "@/features/media/types/media"
import { useProjectSettings } from "@/features/project-settings"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { usePrerender, usePrerenderCache } from "@/features/video-compiler/hooks/use-prerender"
import { convertVideoSrc } from "@/lib/tauri-utils"
import { usePlayer } from "../services/player-provider"
import { PlayerControls } from "./player-controls"

interface PrerenderOptions {
  enabled: boolean
  quality: number
  segmentDuration: number // Длительность сегмента для пререндера в секундах
  applyEffects: boolean
}

export function EnhancedVideoPlayer() {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const { currentVideo: video, currentTime, duration } = usePlayer()
  const { project } = useTimeline()
  const { prerender, isRendering, currentResult } = usePrerender()
  const { hasInCache, getFromCache, addToCache } = usePrerenderCache()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [prerenderOptions, setPrerenderOptions] = useState<PrerenderOptions>({
    enabled: false,
    quality: 75,
    segmentDuration: 5,
    applyEffects: true,
  })

  // Текущий пререндеренный сегмент
  const [currentSegment, setCurrentSegment] = useState<{
    start: number
    end: number
    filePath: string
  } | null>(null)

  // Вычисляем соотношение сторон
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  /**
   * Проверить, нужен ли пререндер для текущего момента
   */
  const needsPrerender = useCallback(
    (_time: number): boolean => {
      if (!prerenderOptions.enabled || !video || !project) return false

      // Проверяем, есть ли эффекты или фильтры в проекте
      // В реальной реализации здесь должна быть логика поиска клипов в указанное время
      // Пока просто проверяем, есть ли вообще эффекты/фильтры в проекте
      const hasEffects = project.sections?.some((section) =>
        section.tracks.some((track) =>
          track.clips.some((clip) => (clip.effects?.length || 0) > 0 || (clip.filters?.length || 0) > 0),
        ),
      )

      return hasEffects || false
    },
    [prerenderOptions.enabled, video, project],
  )

  /**
   * Выполнить пререндер для текущего сегмента
   */
  const performPrerender = useCallback(
    async (startTime: number) => {
      if (!needsPrerender(startTime)) return

      const endTime = Math.min(startTime + prerenderOptions.segmentDuration, duration)

      // Проверяем кеш
      const cached = getFromCache(startTime, endTime, prerenderOptions.applyEffects)
      if (cached) {
        setCurrentSegment({
          start: startTime,
          end: endTime,
          filePath: cached.filePath,
        })
        return
      }

      // Выполняем пререндер
      const result = await prerender(startTime, endTime, prerenderOptions.applyEffects, prerenderOptions.quality)

      if (result) {
        // Добавляем в кеш
        void addToCache(startTime, endTime, prerenderOptions.applyEffects, result)

        // Устанавливаем текущий сегмент
        setCurrentSegment({
          start: startTime,
          end: endTime,
          filePath: result.filePath,
        })
      }
    },
    [needsPrerender, prerenderOptions, duration, getFromCache, addToCache, prerender],
  )

  /**
   * Обработчик изменения времени воспроизведения
   */
  useEffect(() => {
    if (!prerenderOptions.enabled || !video) return

    // Проверяем, находимся ли мы в пререндеренном сегменте
    if (currentSegment && currentTime >= currentSegment.start && currentTime < currentSegment.end) {
      return // Используем текущий пререндер
    }

    // Проверяем, нужен ли новый пререндер
    if (needsPrerender(currentTime)) {
      // Округляем время до начала сегмента
      const segmentStart = Math.floor(currentTime / prerenderOptions.segmentDuration) * prerenderOptions.segmentDuration
      void performPrerender(segmentStart)
    } else {
      // Очищаем пререндер, если он больше не нужен
      setCurrentSegment(null)
    }
  }, [currentTime, currentSegment, performPrerender, needsPrerender, prerenderOptions, video])

  /**
   * Переключить режим пререндера
   */
  const togglePrerender = useCallback(() => {
    setPrerenderOptions((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }))
    toast.info(prerenderOptions.enabled ? "Пререндер отключен" : "Пререндер включен")
  }, [prerenderOptions.enabled])

  // Определяем источник видео
  const videoSource = currentSegment?.filePath
    ? convertVideoSrc(currentSegment.filePath)
    : video?.path
      ? convertVideoSrc(video.path)
      : undefined

  if (!video?.path) {
    return (
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-muted-foreground">Нет видео</div>
          </div>
        </div>
        <PlayerControls
          currentTime={0}
          file={video || { id: "", path: "", name: "Нет видео", type: MediaType.Video, size: 0, isVideo: true }}
        />
      </div>
    )
  }

  return (
    <div className="media-player-container relative flex h-full flex-col">
      <div className="relative flex-1 bg-black">
        <div className="flex h-full w-full items-center justify-center">
          <div className="max-h-[calc(100%-85px)] w-full max-w-[100%]">
            <AspectRatio ratio={aspectRatioValue} className="bg-black">
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  key={videoSource}
                  src={videoSource}
                  controls={false}
                  autoPlay={false}
                  loop={false}
                  disablePictureInPicture
                  preload="auto"
                  tabIndex={0}
                  playsInline
                  muted={false}
                  className="absolute inset-0 h-full w-full focus:outline-none"
                  style={{
                    position: "absolute" as const,
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    display: "block",
                  }}
                />

                {/* Индикатор пререндера */}
                {isRendering && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded bg-black/50 px-3 py-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <span className="text-sm text-white">Рендеринг...</span>
                  </div>
                )}

                {/* Индикатор использования пререндера */}
                {currentSegment && !isRendering && (
                  <div className="absolute left-4 top-4 rounded bg-green-500/20 px-3 py-2">
                    <span className="text-sm text-green-500">Пререндер активен</span>
                  </div>
                )}

                {/* Кнопка переключения пререндера */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePrerender}
                  className="absolute right-4 top-4 bg-black/50 hover:bg-black/70"
                >
                  {prerenderOptions.enabled ? "Отключить" : "Включить"} пререндер
                </Button>
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      <PlayerControls currentTime={currentTime} file={video} />
    </div>
  )
}

EnhancedVideoPlayer.displayName = "EnhancedVideoPlayer"

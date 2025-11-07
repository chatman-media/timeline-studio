/**
 * Video Crossfade Component
 * Компонент для создания crossfade между перекрывающимися видео клипами
 */

import { Blend } from "lucide-react"
import { memo, useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useClips } from "../../hooks/use-clips"
import { useTimeline } from "../../hooks/use-timeline"
import type { VideoFadeOptions } from "../../services/video-fade-service"
import { VideoFadeService } from "../../services/video-fade-service"
import type { TimelineClip } from "../../types"

const logger = createLogger("VideoCrossfade")

interface VideoCrossfadeProps {
  clipA: TimelineClip
  clipB: TimelineClip
  className?: string
}

export const VideoCrossfade = memo(function VideoCrossfade({ clipA, clipB, className }: VideoCrossfadeProps) {
  const { updateClip } = useClips()
  const { project } = useTimeline()

  // Вычисляем перекрытие клипов
  const overlap = useMemo(() => {
    const overlapStart = clipB.startTime
    const overlapEnd = clipA.startTime + clipA.duration
    const overlapDuration = overlapEnd - overlapStart
    return {
      start: overlapStart,
      end: overlapEnd,
      duration: overlapDuration,
      isValid: overlapDuration > 0,
    }
  }, [clipA, clipB])

  const [duration, setDuration] = useState(Math.min(overlap.duration, 1))
  const [fadeType, setFadeType] = useState<VideoFadeOptions["type"]>("cosine")
  const [isOpen, setIsOpen] = useState(false)

  const handleApplyCrossfade = useCallback(() => {
    if (!overlap.isValid) return

    try {
      const { clipA: fadedClipA, clipB: fadedClipB } = VideoFadeService.createCrossfade(
        clipA,
        clipB,
        duration,
        fadeType,
      )

      // Обновляем оба клипа
      updateClip(clipA.id, {
        fadeOut: fadedClipA.fadeOut,
        opacityKeyframes: fadedClipA.opacityKeyframes,
      })

      updateClip(clipB.id, {
        fadeIn: fadedClipB.fadeIn,
        opacityKeyframes: fadedClipB.opacityKeyframes,
      })

      setIsOpen(false)
    } catch (error) {
      logger.error("Failed to create crossfade:", { error })
    }
  }, [clipA, clipB, duration, fadeType, overlap.isValid, updateClip])

  if (!overlap.isValid) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-6 px-2", className)} title="Создать crossfade">
          <Blend className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Настройки Crossfade</DialogTitle>
          <DialogDescription>
            Создание плавного перехода между клипами "{clipA.name}" и "{clipB.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Длительность crossfade: {duration.toFixed(1)} сек</Label>
            <Slider
              id="duration"
              min={0.1}
              max={overlap.duration}
              step={0.1}
              value={[duration]}
              onValueChange={([value]) => setDuration(value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">Максимальное перекрытие: {overlap.duration.toFixed(1)} сек</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fadeType">Тип перехода</Label>
            <Select value={fadeType} onValueChange={(value) => setFadeType(value as any)}>
              <SelectTrigger id="fadeType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
                <SelectItem value="logarithmic">Logarithmic</SelectItem>
                <SelectItem value="cosine">Cosine (рекомендуется)</SelectItem>
                <SelectItem value="ease-in">Ease In</SelectItem>
                <SelectItem value="ease-out">Ease Out</SelectItem>
                <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleApplyCrossfade}>Применить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

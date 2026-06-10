/**
 * Video Crossfade Component
 * Компонент для создания crossfade между перекрывающимися видео клипами
 */

import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@timeline-studio/ui/components/dialog"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Blend } from "lucide-react"
import { memo, useCallback, useMemo, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useClips } from "../../hooks/clips/use-clips"
import { useTimeline } from "../../hooks/state/use-timeline"
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
    <Dialog open={isOpen} onOpenChange={setIsOpen} data-oid="u:sv6ku">
      <DialogTrigger asChild data-oid="ewkn7yl">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 px-2", className)}
          title="Создать crossfade"
          data-oid="mqgz370"
        >
          <Blend className="h-3 w-3" data-oid="mvxb2-7" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-oid="4fw4dns">
        <DialogHeader data-oid="0ps1ag8">
          <DialogTitle data-oid="pyrpz6-">Настройки Crossfade</DialogTitle>
          <DialogDescription data-oid="sea2lf9">
            Создание плавного перехода между клипами "{clipA.name}" и "{clipB.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4" data-oid="yg4peed">
          <div className="space-y-2" data-oid="bt_7xh0">
            <Label htmlFor="duration" data-oid="tls9qzt">
              Длительность crossfade: {duration.toFixed(1)} сек
            </Label>
            <Slider
              id="duration"
              min={0.1}
              max={overlap.duration}
              step={0.1}
              value={[duration]}
              onValueChange={([value]) => setDuration(value)}
              className="w-full"
              data-oid="k9ht0-7"
            />

            <p className="text-sm text-muted-foreground" data-oid="u.kl:0z">
              Максимальное перекрытие: {overlap.duration.toFixed(1)} сек
            </p>
          </div>

          <div className="space-y-2" data-oid="i0x7q9n">
            <Label htmlFor="fadeType" data-oid="_ds2yf_">
              Тип перехода
            </Label>
            <Select value={fadeType} onValueChange={(value) => setFadeType(value as any)} data-oid="cjh.g-n">
              <SelectTrigger id="fadeType" data-oid=".i47cy4">
                <SelectValue data-oid="m6998k0" />
              </SelectTrigger>
              <SelectContent data-oid="5nw5gyj">
                <SelectItem value="linear" data-oid="3gsd186">
                  Linear
                </SelectItem>
                <SelectItem value="exponential" data-oid="nwr5r5_">
                  Exponential
                </SelectItem>
                <SelectItem value="logarithmic" data-oid="e02taek">
                  Logarithmic
                </SelectItem>
                <SelectItem value="cosine" data-oid="_3e_u9w">
                  Cosine (рекомендуется)
                </SelectItem>
                <SelectItem value="ease-in" data-oid=".rk4vtc">
                  Ease In
                </SelectItem>
                <SelectItem value="ease-out" data-oid="z-rg_3x">
                  Ease Out
                </SelectItem>
                <SelectItem value="ease-in-out" data-oid="dv7erdb">
                  Ease In-Out
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2" data-oid="17v-1zn">
            <Button variant="outline" onClick={() => setIsOpen(false)} data-oid="jgrr3ga">
              Отмена
            </Button>
            <Button onClick={handleApplyCrossfade} data-oid="imr:wkp">
              Применить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

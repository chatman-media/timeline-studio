/**
 * Video Fade Controls
 * Компонент для управления video fade in/out эффектами
 */

import { Sparkles as Fade } from "lucide-react"
import { memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useClips } from "../../hooks/clips/use-clips"
import { VideoFadeService } from "../../services/video-fade-service"
import type { TimelineClip } from "../../types"

interface VideoFadeControlsProps {
  clip: TimelineClip
  className?: string
}

export const VideoFadeControls = memo(function VideoFadeControls({ clip, className }: VideoFadeControlsProps) {
  const { updateClip } = useClips()

  const handleFadeInChange = useCallback(
    (duration: number, type?: string) => {
      const updatedClip = VideoFadeService.applyFadeIn(clip, {
        type:
          (type as "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out") ||
          "linear",
        duration,
      })

      updateClip(clip.id, {
        fadeIn: updatedClip.fadeIn,
        opacityKeyframes: updatedClip.opacityKeyframes,
      })
    },
    [clip, updateClip],
  )

  const handleFadeOutChange = useCallback(
    (duration: number, type?: string) => {
      const updatedClip = VideoFadeService.applyFadeOut(clip, {
        type:
          (type as "linear" | "exponential" | "logarithmic" | "cosine" | "ease-in" | "ease-out" | "ease-in-out") ||
          "linear",
        duration,
      })

      updateClip(clip.id, {
        fadeOut: updatedClip.fadeOut,
        opacityKeyframes: updatedClip.opacityKeyframes,
      })
    },
    [clip, updateClip],
  )

  const handleRemoveFadeIn = useCallback(() => {
    const updatedClip = VideoFadeService.removeFadeIn(clip)
    updateClip(clip.id, {
      fadeIn: undefined,
      opacityKeyframes: updatedClip.opacityKeyframes,
    })
  }, [clip, updateClip])

  const handleRemoveFadeOut = useCallback(() => {
    const updatedClip = VideoFadeService.removeFadeOut(clip)
    updateClip(clip.id, {
      fadeOut: undefined,
      opacityKeyframes: updatedClip.opacityKeyframes,
    })
  }, [clip, updateClip])

  const hasFades = VideoFadeService.hasFadeEffects(clip)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-6 px-2", hasFades && "text-primary", className)}>
          <Fade className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fade In</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={clip.duration}
                step="0.1"
                value={clip.fadeIn?.duration || 0}
                onChange={(e) => handleFadeInChange(Number.parseFloat(e.target.value) || 0, clip.fadeIn?.type)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">сек</span>
              <Select
                value={clip.fadeIn?.type || "linear"}
                onValueChange={(type) => handleFadeInChange(clip.fadeIn?.duration || 1, type)}
                disabled={!clip.fadeIn}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="logarithmic">Logarithmic</SelectItem>
                  <SelectItem value="cosine">Cosine</SelectItem>
                  <SelectItem value="ease-in">Ease In</SelectItem>
                  <SelectItem value="ease-out">Ease Out</SelectItem>
                  <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                </SelectContent>
              </Select>
              {clip.fadeIn && (
                <Button variant="ghost" size="sm" onClick={handleRemoveFadeIn} className="h-8 px-2">
                  ✕
                </Button>
              )}
            </div>
            {!clip.fadeIn && (
              <Button variant="outline" size="sm" onClick={() => handleFadeInChange(1, "linear")} className="w-full">
                Добавить Fade In
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Fade Out</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={clip.duration}
                step="0.1"
                value={clip.fadeOut?.duration || 0}
                onChange={(e) => handleFadeOutChange(Number.parseFloat(e.target.value) || 0, clip.fadeOut?.type)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">сек</span>
              <Select
                value={clip.fadeOut?.type || "linear"}
                onValueChange={(type) => handleFadeOutChange(clip.fadeOut?.duration || 1, type)}
                disabled={!clip.fadeOut}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="exponential">Exponential</SelectItem>
                  <SelectItem value="logarithmic">Logarithmic</SelectItem>
                  <SelectItem value="cosine">Cosine</SelectItem>
                  <SelectItem value="ease-in">Ease In</SelectItem>
                  <SelectItem value="ease-out">Ease Out</SelectItem>
                  <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                </SelectContent>
              </Select>
              {clip.fadeOut && (
                <Button variant="ghost" size="sm" onClick={handleRemoveFadeOut} className="h-8 px-2">
                  ✕
                </Button>
              )}
            </div>
            {!clip.fadeOut && (
              <Button variant="outline" size="sm" onClick={() => handleFadeOutChange(1, "linear")} className="w-full">
                Добавить Fade Out
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Общая прозрачность</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[clip.opacity]}
                onValueChange={([opacity]) => {
                  updateClip(clip.id, { opacity })
                }}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{Math.round(clip.opacity * 100)}%</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

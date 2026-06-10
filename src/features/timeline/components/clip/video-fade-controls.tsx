/**
 * Video Fade Controls
 * Компонент для управления video fade in/out эффектами
 */

import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Sparkles as Fade } from "lucide-react"
import { memo, useCallback } from "react"
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
    <Popover data-oid="p9q85.2">
      <PopoverTrigger asChild data-oid="whs3:je">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-6 px-2", hasFades && "text-primary", className)}
          data-oid=".a76xq2"
        >
          <Fade className="h-3 w-3" data-oid="2nd54:k" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" data-oid="yg7-wqu">
        <div className="space-y-4" data-oid=":egq3-e">
          <div className="space-y-2" data-oid="yplgfwd">
            <Label className="text-sm font-medium" data-oid=":ybpsqh">
              Fade In
            </Label>
            <div className="flex items-center gap-2" data-oid="gx8o7u:">
              <Input
                type="number"
                min="0"
                max={clip.duration}
                step="0.1"
                value={clip.fadeIn?.duration || 0}
                onChange={(e) => handleFadeInChange(Number.parseFloat(e.target.value) || 0, clip.fadeIn?.type)}
                className="w-20"
                data-oid="eqg28ar"
              />

              <span className="text-sm text-muted-foreground" data-oid="86l-t1j">
                сек
              </span>
              <Select
                value={clip.fadeIn?.type || "linear"}
                onValueChange={(type) => handleFadeInChange(clip.fadeIn?.duration || 1, type)}
                disabled={!clip.fadeIn}
                data-oid="fg5wv:m"
              >
                <SelectTrigger className="flex-1" data-oid="y_5z.i1">
                  <SelectValue data-oid="q5uvp07" />
                </SelectTrigger>
                <SelectContent data-oid="8kj5w3n">
                  <SelectItem value="linear" data-oid="zsbbxso">
                    Linear
                  </SelectItem>
                  <SelectItem value="exponential" data-oid="wl:w:b:">
                    Exponential
                  </SelectItem>
                  <SelectItem value="logarithmic" data-oid="c7:vwf2">
                    Logarithmic
                  </SelectItem>
                  <SelectItem value="cosine" data-oid="g4t-hsy">
                    Cosine
                  </SelectItem>
                  <SelectItem value="ease-in" data-oid="1ogtrfz">
                    Ease In
                  </SelectItem>
                  <SelectItem value="ease-out" data-oid="qbn5ain">
                    Ease Out
                  </SelectItem>
                  <SelectItem value="ease-in-out" data-oid="ay6q4dq">
                    Ease In-Out
                  </SelectItem>
                </SelectContent>
              </Select>
              {clip.fadeIn && (
                <Button variant="ghost" size="sm" onClick={handleRemoveFadeIn} className="h-8 px-2" data-oid="s8asply">
                  ✕
                </Button>
              )}
            </div>
            {!clip.fadeIn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFadeInChange(1, "linear")}
                className="w-full"
                data-oid="vh:xl1t"
              >
                Добавить Fade In
              </Button>
            )}
          </div>

          <div className="space-y-2" data-oid="tzek_v9">
            <Label className="text-sm font-medium" data-oid="f0e4qc2">
              Fade Out
            </Label>
            <div className="flex items-center gap-2" data-oid="quybzyy">
              <Input
                type="number"
                min="0"
                max={clip.duration}
                step="0.1"
                value={clip.fadeOut?.duration || 0}
                onChange={(e) => handleFadeOutChange(Number.parseFloat(e.target.value) || 0, clip.fadeOut?.type)}
                className="w-20"
                data-oid="yuorgqf"
              />

              <span className="text-sm text-muted-foreground" data-oid="fhdow2t">
                сек
              </span>
              <Select
                value={clip.fadeOut?.type || "linear"}
                onValueChange={(type) => handleFadeOutChange(clip.fadeOut?.duration || 1, type)}
                disabled={!clip.fadeOut}
                data-oid="32rc:s."
              >
                <SelectTrigger className="flex-1" data-oid="ysrd.36">
                  <SelectValue data-oid="j0:il5p" />
                </SelectTrigger>
                <SelectContent data-oid="pqu3la8">
                  <SelectItem value="linear" data-oid="_p2lfrf">
                    Linear
                  </SelectItem>
                  <SelectItem value="exponential" data-oid="8ghvkm5">
                    Exponential
                  </SelectItem>
                  <SelectItem value="logarithmic" data-oid="y-vvvo2">
                    Logarithmic
                  </SelectItem>
                  <SelectItem value="cosine" data-oid=":sn:fwi">
                    Cosine
                  </SelectItem>
                  <SelectItem value="ease-in" data-oid="rr2cd4m">
                    Ease In
                  </SelectItem>
                  <SelectItem value="ease-out" data-oid="gp_xb.2">
                    Ease Out
                  </SelectItem>
                  <SelectItem value="ease-in-out" data-oid="eenaj3a">
                    Ease In-Out
                  </SelectItem>
                </SelectContent>
              </Select>
              {clip.fadeOut && (
                <Button variant="ghost" size="sm" onClick={handleRemoveFadeOut} className="h-8 px-2" data-oid="2_.c:kl">
                  ✕
                </Button>
              )}
            </div>
            {!clip.fadeOut && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFadeOutChange(1, "linear")}
                className="w-full"
                data-oid="h57r.te"
              >
                Добавить Fade Out
              </Button>
            )}
          </div>

          <div className="space-y-2" data-oid="3_3lckv">
            <Label className="text-sm font-medium" data-oid="nojvyiw">
              Общая прозрачность
            </Label>
            <div className="flex items-center gap-3" data-oid="13m4svf">
              <Slider
                value={[clip.opacity]}
                onValueChange={([opacity]) => {
                  updateClip(clip.id, { opacity })
                }}
                min={0}
                max={1}
                step={0.01}
                className="flex-1"
                data-oid="cojc1rh"
              />

              <span className="text-sm font-medium w-12 text-right" data-oid="eel3mms">
                {Math.round(clip.opacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

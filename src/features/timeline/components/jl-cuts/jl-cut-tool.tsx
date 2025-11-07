import { Link2, RotateCcw, ScissorsLineDashed, Unlink2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useJLCuts } from "../../hooks/use-jl-cuts"
import { useTimeline } from "../../hooks/use-timeline"

import type { TimelineClip } from "../../types/timeline"

interface JLCutToolProps {
  clip: TimelineClip
  className?: string
}

export function JLCutTool({ clip, className }: JLCutToolProps) {
  // const { uiState } = useTimeline() // uiState currently not available in TimelineContextType
  const {
    createJCut,
    createLCut,
    resetCut,
    linkClips,
    unlinkClips,
    getLinkedClip,
    getLinkedPair,
    hasJLCut,
    isVideoClip,
    isAudioClip,
  } = useJLCuts()

  const [offset, setOffset] = useState(0.5) // Секунды
  const linkedClip = getLinkedClip(clip.id)
  const linkedPair = getLinkedPair(clip.id)
  const hasJL = hasJLCut(clip.id)

  const canCreateJLCut =
    linkedClip && ((isVideoClip(clip) && isAudioClip(linkedClip)) || (isAudioClip(clip) && isVideoClip(linkedClip)))

  const handleCreateJCut = () => {
    createJCut(clip.id, offset)
  }

  const handleCreateLCut = () => {
    createLCut(clip.id, offset)
  }

  const handleReset = () => {
    resetCut(clip.id)
  }

  const handleUnlink = () => {
    unlinkClips(clip.id)
  }

  // Найти потенциальный клип для связывания
  const findLinkableClip = (): TimelineClip | null => {
    // Логика поиска клипа на другом треке в том же временном диапазоне
    // Это упрощенная версия - в реальности нужна более сложная логика
    return null
  }

  const linkableClip = !linkedClip ? findLinkableClip() : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <ScissorsLineDashed className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">J-Cut / L-Cut Tools</h3>
            <p className="text-sm text-muted-foreground mt-1">Create audio/video offset transitions</p>
          </div>

          <Separator />

          {/* Link/Unlink controls */}
          <div className="space-y-2">
            <Label>Clip Linking</Label>

            {linkedClip ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Linked to: {linkedClip.name}</div>
                <Button variant="outline" size="sm" onClick={handleUnlink} className="w-full">
                  <Unlink2 className="h-4 w-4 mr-2" />
                  Unlink Clips
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {linkableClip ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => linkClips(clip.id, linkableClip.id)}
                    className="w-full"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link to {linkableClip.name}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No clips available to link</p>
                )}
              </div>
            )}
          </div>

          {canCreateJLCut && (
            <>
              <Separator />

              {/* Offset control */}
              <div className="space-y-2">
                <Label>Offset: {offset.toFixed(1)}s</Label>
                <Slider
                  value={[offset]}
                  onValueChange={([value]) => setOffset(value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* J/L Cut buttons */}
              <div className="grid grid-cols-2 gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleCreateJCut} className="w-full">
                        J-Cut
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Audio starts before video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleCreateLCut} className="w-full">
                        L-Cut
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Audio continues after video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {hasJL && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Straight Cut
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

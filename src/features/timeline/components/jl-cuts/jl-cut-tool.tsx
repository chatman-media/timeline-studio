import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { Link2, RotateCcw, ScissorsLineDashed, Unlink2 } from "lucide-react"
import { useState } from "react"

import { useJLCuts } from "../../hooks/editing/use-jl-cuts"

import type { TimelineClip } from "../../types"

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
    <Popover data-oid=":fe1xtf">
      <PopoverTrigger asChild data-oid="m865m48">
        <Button variant="ghost" size="sm" className={className} data-oid="yz3q_sl">
          <ScissorsLineDashed className="h-4 w-4" data-oid="8:ggzf7" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" data-oid="peiamtl">
        <div className="space-y-4" data-oid="aopw:i-">
          <div data-oid="bg.xsvp">
            <h3 className="font-medium" data-oid=".tlhgsv">
              J-Cut / L-Cut Tools
            </h3>
            <p className="text-sm text-muted-foreground mt-1" data-oid="ikq9dro">
              Create audio/video offset transitions
            </p>
          </div>

          <Separator data-oid="5l31kms" />

          {/* Link/Unlink controls */}
          <div className="space-y-2" data-oid="6q_xyuf">
            <Label data-oid=":5whfbo">Clip Linking</Label>

            {linkedClip ? (
              <div className="space-y-2" data-oid="byq1lqv">
                <div className="text-sm text-muted-foreground" data-oid="wiok3.7">
                  Linked to: {linkedClip.name}
                </div>
                <Button variant="outline" size="sm" onClick={handleUnlink} className="w-full" data-oid="7xe:wyn">
                  <Unlink2 className="h-4 w-4 mr-2" data-oid="qux9wzo" />
                  Unlink Clips
                </Button>
              </div>
            ) : (
              <div className="space-y-2" data-oid="ifvd-pw">
                {linkableClip ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => linkClips(clip.id, linkableClip.id)}
                    className="w-full"
                    data-oid="67wb.4l"
                  >
                    <Link2 className="h-4 w-4 mr-2" data-oid="z_:3e4y" />
                    Link to {linkableClip.name}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground" data-oid="dylhyq7">
                    No clips available to link
                  </p>
                )}
              </div>
            )}
          </div>

          {canCreateJLCut && (
            <>
              <Separator data-oid="1.akyx." />

              {/* Offset control */}
              <div className="space-y-2" data-oid="6-bgbx5">
                <Label data-oid="iox:p4k">Offset: {offset.toFixed(1)}s</Label>
                <Slider
                  value={[offset]}
                  onValueChange={([value]) => setOffset(value)}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="w-full"
                  data-oid="3emy.5m"
                />
              </div>

              {/* J/L Cut buttons */}
              <div className="grid grid-cols-2 gap-2" data-oid="itl:f13">
                <TooltipProvider data-oid="cq29atg">
                  <Tooltip data-oid="tdg.g0x">
                    <TooltipTrigger asChild data-oid="3vwq.yj">
                      <Button variant="outline" onClick={handleCreateJCut} className="w-full" data-oid="wlhzqzx">
                        J-Cut
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent data-oid="8_be.dq">
                      <p data-oid="r5m-7.l">Audio starts before video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider data-oid="cix75hs">
                  <Tooltip data-oid="__q3yfy">
                    <TooltipTrigger asChild data-oid="j6:rvjm">
                      <Button variant="outline" onClick={handleCreateLCut} className="w-full" data-oid=".s7to9_">
                        L-Cut
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent data-oid="zbfsi79">
                      <p data-oid="pxcwq_2">Audio continues after video</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {hasJL && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="w-full" data-oid="deun3ue">
                  <RotateCcw className="h-4 w-4 mr-2" data-oid="37x4ryv" />
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

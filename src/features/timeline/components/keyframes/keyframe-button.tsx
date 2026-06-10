/**
 * Кнопка для открытия keyframe редактора
 */

import { Zap } from "lucide-react"
import { useState } from "react"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Dialog, DialogContent } from "@timeline-studio/ui/components/dialog"
import type { TimelineClip } from "../../types"
import { KeyframeEditor } from "./keyframe-editor"

interface KeyframeButtonProps {
  clip: TimelineClip
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost" | "secondary"
  showBadge?: boolean
}

export function KeyframeButton({ clip, size = "sm", variant = "outline", showBadge = true }: KeyframeButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Подсчитываем количество keyframes
  const keyframeCount = clip.keyframes?.length || 0

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setIsOpen(true)} className="relative" data-oid="hyvkasq">
        <Zap className="h-4 w-4 mr-2" data-oid="01aknbx" />
        Keyframes
        {showBadge && keyframeCount > 0 && (
          <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs h-5 min-w-5" data-oid="uwj1oon">
            {keyframeCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen} data-oid="q.47z_r">
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0" data-oid="nm9hspl">
          <KeyframeEditor clipId={clip.id} onClose={() => setIsOpen(false)} data-oid="78pfkpz" />
        </DialogContent>
      </Dialog>
    </>
  )
}

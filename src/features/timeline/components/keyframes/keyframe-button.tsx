/**
 * Кнопка для открытия keyframe редактора
 */

import { Zap } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
      <Button variant={variant} size={size} onClick={() => setIsOpen(true)} className="relative">
        <Zap className="h-4 w-4 mr-2" />
        Keyframes
        {showBadge && keyframeCount > 0 && (
          <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs h-5 min-w-5">
            {keyframeCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <KeyframeEditor clipId={clip.id} onClose={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

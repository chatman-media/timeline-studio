import { Gauge } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { useSpeedRamping } from "../../hooks/speed-ramping/use-speed-ramping"

interface SpeedRampingToggleProps {
  clipId: string
  className?: string
}

export function SpeedRampingToggle({ clipId, className }: SpeedRampingToggleProps) {
  const { getConfig, enableSpeedRamping, disableSpeedRamping } = useSpeedRamping()
  const config = getConfig(clipId)
  const isEnabled = config?.enabled || false

  const handleToggle = () => {
    if (isEnabled) {
      disableSpeedRamping(clipId)
    } else {
      enableSpeedRamping(clipId)
    }
  }

  return (
    <TooltipProvider data-oid="81p88dw">
      <Tooltip data-oid="rh:xh3c">
        <TooltipTrigger asChild data-oid="z:3m3if">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className={cn("h-6 w-6 p-0", isEnabled && "bg-purple-500/20 hover:bg-purple-500/30", className)}
            data-oid="_ux44r0"
          >
            <Gauge
              className={cn("h-4 w-4", isEnabled ? "text-purple-500" : "text-muted-foreground")}
              data-oid="uhjt58j"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent data-oid="edcc9lq">
          <p data-oid="r1s:9yo">{isEnabled ? "Disable" : "Enable"} Speed Ramping</p>
          <p className="text-xs text-muted-foreground" data-oid="v4o0o32">
            Cmd/Ctrl+Shift+R
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

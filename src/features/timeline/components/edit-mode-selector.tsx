import {
  ArrowLeftRight,
  Gauge,
  type LucideIcon,
  Minimize2,
  MousePointer,
  Move,
  MoveHorizontal,
  Scissors,
  Split,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import { EDIT_MODE_CONFIGS } from "../types/edit-modes"

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  MousePointer,
  Scissors,
  ArrowLeftRight,
  Minimize2,
  Move,
  MoveHorizontal,
  Split,
  Gauge,
}

interface EditModeSelectorProps {
  className?: string
  size?: "sm" | "md" | "lg"
  orientation?: "horizontal" | "vertical"
}

export function EditModeSelector({ className, size = "md", orientation = "horizontal" }: EditModeSelectorProps) {
  const { editMode, setEditMode } = useEditModeContext()

  const buttonSize = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size]

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size]

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex gap-1 p-1 bg-background/95 backdrop-blur rounded-lg border",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className,
        )}
      >
        {Object.values(EDIT_MODE_CONFIGS).map((config) => {
          const Icon = ICON_MAP[config.icon]
          const isActive = editMode === config.mode

          return (
            <Tooltip key={config.mode} delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  className={cn(buttonSize, isActive && "shadow-sm", "transition-all duration-200")}
                  onClick={() => setEditMode(config.mode)}
                  aria-label={config.name}
                  aria-pressed={isActive}
                >
                  <Icon size={iconSize} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={orientation === "vertical" ? "right" : "bottom"}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{config.name}</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">{config.hotkey}</kbd>
                  </div>
                  <span className="text-xs text-muted-foreground">{config.description}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// Compact version for toolbar integration
interface EditModeButtonGroupProps {
  className?: string
}

export function EditModeButtonGroup({ className }: EditModeButtonGroupProps) {
  const { editMode, setEditMode } = useEditModeContext()

  return (
    <div className={cn("flex items-center", className)}>
      <section className="flex rounded-md shadow-sm" aria-label="Edit mode selection">
        {Object.values(EDIT_MODE_CONFIGS)
          .slice(0, 4)
          .map((config, index) => {
            const Icon = ICON_MAP[config.icon]
            const isActive = editMode === config.mode

            return (
              <Button
                key={config.mode}
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "rounded-none px-3",
                  index === 0 && "rounded-l-md",
                  index === 3 && "rounded-r-md",
                  !isActive && "border-r-0 last:border-r",
                )}
                onClick={() => setEditMode(config.mode)}
                title={`${config.name} (${config.hotkey})`}
              >
                <Icon size={16} className="mr-1" />
                <span className="hidden lg:inline">{config.name}</span>
              </Button>
            )
          })}
      </section>
    </div>
  )
}

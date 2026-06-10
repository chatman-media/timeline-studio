import { Button } from "@timeline-studio/ui/components/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
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
    <TooltipProvider data-oid="_tepz1f">
      <div
        className={cn(
          "flex gap-1 p-1 bg-background/95 backdrop-blur rounded-lg border",
          orientation === "vertical" ? "flex-col" : "flex-row",
          className,
        )}
        data-oid="l0vd5hj"
      >
        {Object.values(EDIT_MODE_CONFIGS).map((config) => {
          const Icon = ICON_MAP[config.icon]
          const isActive = editMode === config.mode

          return (
            <Tooltip key={config.mode} delayDuration={500} data-oid="e1r:p2j">
              <TooltipTrigger asChild data-oid="1o.e5xi">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  className={cn(buttonSize, isActive && "shadow-sm", "transition-all duration-200")}
                  onClick={() => setEditMode(config.mode)}
                  aria-label={config.name}
                  aria-pressed={isActive}
                  data-oid="ac8j0a."
                >
                  <Icon size={iconSize} data-oid="yw8mt7n" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={orientation === "vertical" ? "right" : "bottom"} data-oid="vd_2:u6">
                <div className="flex flex-col gap-1" data-oid="8fdo_mz">
                  <div className="flex items-center gap-2" data-oid="8kzvx0u">
                    <span className="font-semibold" data-oid="vxg9fk0">
                      {config.name}
                    </span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded" data-oid="x7x751a">
                      {config.hotkey}
                    </kbd>
                  </div>
                  <span className="text-xs text-muted-foreground" data-oid="4zhww0n">
                    {config.description}
                  </span>
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
    <div className={cn("flex items-center", className)} data-oid=":8d:_5h">
      <section className="flex rounded-md shadow-sm" aria-label="Edit mode selection" data-oid="mr9grwy">
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
                data-oid="rt:w6rn"
              >
                <Icon size={16} className="mr-1" data-oid="h_w9--k" />
                <span className="hidden lg:inline" data-oid="ow2_47g">
                  {config.name}
                </span>
              </Button>
            )
          })}
      </section>
    </div>
  )
}

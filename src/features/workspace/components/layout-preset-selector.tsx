/**
 * Layout Preset Selector Component
 *
 * UI for switching between layout presets
 */

"use client"

import { LayoutGrid, PanelLeft, PanelTop, FolderOpen } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { LAYOUT_PRESETS } from "../config/layout-presets"

interface LayoutPresetSelectorProps {
  currentPresetId: string
  onPresetChange: (presetId: string) => void
  className?: string
}

const PRESET_ICONS: Record<string, LucideIcon> = {
  default: LayoutGrid,
  vertical: PanelLeft,
  options: PanelTop,
  browser: FolderOpen,
}

export function LayoutPresetSelector({
  currentPresetId,
  onPresetChange,
  className,
}: LayoutPresetSelectorProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {LAYOUT_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id] || LayoutGrid
          const isActive = currentPresetId === preset.id

          return (
            <Tooltip key={preset.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-8 w-8 p-0", !isActive && "text-muted-foreground hover:text-foreground")}
                  onClick={() => onPresetChange(preset.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{preset.name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-center">
                  <div className="font-medium">{preset.name}</div>
                  {preset.description && (
                    <div className="mt-1 text-xs text-muted-foreground">{preset.description}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

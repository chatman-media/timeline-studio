/**
 * Layout Preset Selector Component
 *
 * UI for switching between layout presets
 */

"use client"

import type { LucideIcon } from "lucide-react"
import { LayoutGrid, MessageSquare, PanelLeft, PanelTop } from "lucide-react"

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
  chat: MessageSquare,
}

export function LayoutPresetSelector({ currentPresetId, onPresetChange, className }: LayoutPresetSelectorProps) {
  return (
    <TooltipProvider data-oid="_at6kca">
      <div className={cn("flex items-center gap-1", className)} data-oid="t9y8r16">
        {LAYOUT_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id] || LayoutGrid
          const isActive = currentPresetId === preset.id

          return (
            <Tooltip key={preset.id} data-oid="sv-7fcl">
              <TooltipTrigger asChild data-oid="ajktl_a">
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-8 w-8 p-0", !isActive && "text-muted-foreground hover:text-foreground")}
                  onClick={() => onPresetChange(preset.id)}
                  data-oid="qx29m2p"
                >
                  <Icon className="h-4 w-4" data-oid="0xhu1ew" />
                  <span className="sr-only" data-oid="4.gmr:x">
                    {preset.name}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" data-oid="r5a2n_l">
                <div className="text-center" data-oid="bozar9y">
                  <div className="font-medium" data-oid="d00x8c6">
                    {preset.name}
                  </div>
                  {preset.description && (
                    <div className="mt-1 text-xs text-muted-foreground" data-oid="lm6bvj4">
                      {preset.description}
                    </div>
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

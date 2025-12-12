/**
 * Панель инструментов Split Edit
 */

import {
  AlignCenter,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Magnet,
  MousePointer,
  Move,
  Scissors,
  Target,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { useSplitEdit } from "../hooks/editing/use-split-edit"

interface SplitEditToolbarProps {
  className?: string
  compact?: boolean
}

export function SplitEditToolbar({ className, compact = false }: SplitEditToolbarProps) {
  const {
    config,
    toolSettings,
    visualSettings,
    activeSplitEdits,
    isEnabled,
    toggleSplitEdit,
    setTool,
    updateToolSettings,
    clearAllSplitEdits,
  } = useSplitEdit()

  const tools = [
    {
      id: "razor" as const,
      name: "Razor Tool",
      icon: Scissors,
      description: "Split clips at specific positions",
      shortcut: "R",
    },
    {
      id: "select" as const,
      name: "Selection Tool",
      icon: MousePointer,
      description: "Select and modify split edits",
      shortcut: "V",
    },
    {
      id: "slip" as const,
      name: "Slip Tool",
      icon: Move,
      description: "Slip clip content without changing duration",
      shortcut: "S",
    },
    {
      id: "slide" as const,
      name: "Slide Tool",
      icon: ArrowLeftRight,
      description: "Slide clip position while maintaining sync",
      shortcut: "X",
    },
  ]

  const handleToolSelect = (toolId: typeof config.tool) => {
    setTool(toolId)
  }

  const handleToggleSetting = (setting: keyof typeof toolSettings) => {
    updateToolSettings({
      [setting]: !toolSettings[setting],
    })
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1 p-1", className)}>
        <Toggle pressed={isEnabled} onPressedChange={toggleSplitEdit} size="sm" aria-label="Toggle Split Edit">
          <Scissors className="h-4 w-4" />
        </Toggle>

        {isEnabled && (
          <>
            <Separator orientation="vertical" className="h-4" />
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={config.tool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolSelect(tool.id)}
                className="px-2"
              >
                <tool.icon className="h-3 w-3" />
              </Button>
            ))}
          </>
        )}

        {activeSplitEdits.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="secondary" className="text-xs">
              {activeSplitEdits.length}
            </Badge>
          </>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2 p-2 bg-background border rounded-lg", className)}>
        {/* Основное переключение */}
        <div className="flex items-center gap-2">
          <Toggle pressed={isEnabled} onPressedChange={toggleSplitEdit} size="sm" aria-label="Toggle Split Edit Mode">
            <Scissors className="h-4 w-4" />
          </Toggle>

          <span className="text-sm font-medium">Split Edit</span>

          {activeSplitEdits.length > 0 && <Badge variant="secondary">{activeSplitEdits.length} active</Badge>}
        </div>

        {isEnabled && (
          <>
            <Separator orientation="vertical" className="h-6" />

            {/* Инструменты */}
            <div className="flex items-center gap-1">
              {tools.map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={config.tool === tool.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleToolSelect(tool.id)}
                      className="px-3"
                    >
                      <tool.icon className="h-4 w-4" />
                      {!compact && <span className="ml-1 text-xs">{tool.shortcut}</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                      <div className="text-xs mt-1">
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs">{tool.shortcut}</kbd>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Настройки инструмента */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={toolSettings.magneticSnap ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("magneticSnap")}
                  >
                    <Magnet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>Magnetic Snap</div>
                  <div className="text-xs text-muted-foreground">Distance: {toolSettings.snapDistance}px</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={toolSettings.autoAlign ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("autoAlign")}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Auto Align</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={toolSettings.showGuides ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("showGuides")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show Guides</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={toolSettings.syncTracks ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("syncTracks")}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync Tracks</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Визуальные настройки */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={visualSettings.showPreview ? "default" : "ghost"} size="sm">
                    {visualSettings.showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{visualSettings.showPreview ? "Hide Preview" : "Show Preview"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllSplitEdits}
                    disabled={activeSplitEdits.length === 0}
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear All Split Edits</TooltipContent>
              </Tooltip>
            </div>

            {/* Режим редактирования */}
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Mode:</span>
              <Badge variant="outline" className="text-xs">
                {toolSettings.mode}
              </Badge>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

export default SplitEditToolbar

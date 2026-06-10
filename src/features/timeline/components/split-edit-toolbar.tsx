/**
 * Панель инструментов Split Edit
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Toggle } from "@timeline-studio/ui/components/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
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
      <div className={cn("flex items-center gap-1 p-1", className)} data-oid="d94_7yq">
        <Toggle
          pressed={isEnabled}
          onPressedChange={toggleSplitEdit}
          size="sm"
          aria-label="Toggle Split Edit"
          data-oid="9n9n7iy"
        >
          <Scissors className="h-4 w-4" data-oid="7wpbmps" />
        </Toggle>

        {isEnabled && (
          <>
            <Separator orientation="vertical" className="h-4" data-oid="hnwudmq" />
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={config.tool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolSelect(tool.id)}
                className="px-2"
                data-oid="3-xtoe9"
              >
                <tool.icon className="h-3 w-3" data-oid="ie9brkn" />
              </Button>
            ))}
          </>
        )}

        {activeSplitEdits.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" data-oid="fl3sa:s" />
            <Badge variant="secondary" className="text-xs" data-oid="u09pzbl">
              {activeSplitEdits.length}
            </Badge>
          </>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider data-oid="-bsm08j">
      <div className={cn("flex items-center gap-2 p-2 bg-background border rounded-lg", className)} data-oid="ib:025o">
        {/* Основное переключение */}
        <div className="flex items-center gap-2" data-oid="e07p7eg">
          <Toggle
            pressed={isEnabled}
            onPressedChange={toggleSplitEdit}
            size="sm"
            aria-label="Toggle Split Edit Mode"
            data-oid="0v1mhj-"
          >
            <Scissors className="h-4 w-4" data-oid="b1vmxqh" />
          </Toggle>

          <span className="text-sm font-medium" data-oid="63q1rdr">
            Split Edit
          </span>

          {activeSplitEdits.length > 0 && (
            <Badge variant="secondary" data-oid="52qm7lp">
              {activeSplitEdits.length} active
            </Badge>
          )}
        </div>

        {isEnabled && (
          <>
            <Separator orientation="vertical" className="h-6" data-oid="xt_n8gu" />

            {/* Инструменты */}
            <div className="flex items-center gap-1" data-oid="x9qe5h0">
              {tools.map((tool) => (
                <Tooltip key={tool.id} data-oid="5h6trs2">
                  <TooltipTrigger asChild data-oid="5p49zgs">
                    <Button
                      variant={config.tool === tool.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleToolSelect(tool.id)}
                      className="px-3"
                      data-oid="h3dnn7q"
                    >
                      <tool.icon className="h-4 w-4" data-oid="88llf6i" />
                      {!compact && (
                        <span className="ml-1 text-xs" data-oid="gg64d93">
                          {tool.shortcut}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent data-oid="ryv6xbh">
                    <div className="text-center" data-oid="8x70714">
                      <div className="font-medium" data-oid="vicugxs">
                        {tool.name}
                      </div>
                      <div className="text-xs text-muted-foreground" data-oid="co69z0-">
                        {tool.description}
                      </div>
                      <div className="text-xs mt-1" data-oid="wp:m1lj">
                        <kbd className="px-1 py-0.5 bg-muted rounded text-xs" data-oid="l4p.7yw">
                          {tool.shortcut}
                        </kbd>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" data-oid="9:.r_ie" />

            {/* Настройки инструмента */}
            <div className="flex items-center gap-1" data-oid="frup1dv">
              <Tooltip data-oid="k1hxd6p">
                <TooltipTrigger asChild data-oid="x-9176h">
                  <Button
                    variant={toolSettings.magneticSnap ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("magneticSnap")}
                    data-oid="2a03xw:"
                  >
                    <Magnet className="h-4 w-4" data-oid="6rw2hhd" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="gn35bxv">
                  <div data-oid="4fvz32c">Magnetic Snap</div>
                  <div className="text-xs text-muted-foreground" data-oid="s6yijd5">
                    Distance: {toolSettings.snapDistance}px
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip data-oid="bbz5_::">
                <TooltipTrigger asChild data-oid="0zxvac4">
                  <Button
                    variant={toolSettings.autoAlign ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("autoAlign")}
                    data-oid="mg3la1z"
                  >
                    <AlignCenter className="h-4 w-4" data-oid="njktbt0" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="7qf8l91">Auto Align</TooltipContent>
              </Tooltip>

              <Tooltip data-oid="ycc:2:c">
                <TooltipTrigger asChild data-oid="ofcc7qj">
                  <Button
                    variant={toolSettings.showGuides ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("showGuides")}
                    data-oid="dss45f2"
                  >
                    <Grid className="h-4 w-4" data-oid="48ilii5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="ecfh_1f">Show Guides</TooltipContent>
              </Tooltip>

              <Tooltip data-oid="za9w_6m">
                <TooltipTrigger asChild data-oid="9hw-vv9">
                  <Button
                    variant={toolSettings.syncTracks ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleToggleSetting("syncTracks")}
                    data-oid="gba6sq5"
                  >
                    <Layers className="h-4 w-4" data-oid="-6zf178" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="2.1z-rx">Sync Tracks</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" data-oid="u:m2100" />

            {/* Визуальные настройки */}
            <div className="flex items-center gap-1" data-oid="ms4wj4h">
              <Tooltip data-oid="q39jqoa">
                <TooltipTrigger asChild data-oid="2xe6o2:">
                  <Button variant={visualSettings.showPreview ? "default" : "ghost"} size="sm" data-oid="94a61gz">
                    {visualSettings.showPreview ? (
                      <Eye className="h-4 w-4" data-oid="zufy734" />
                    ) : (
                      <EyeOff className="h-4 w-4" data-oid="nt5:88:" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="m78tylq">
                  {visualSettings.showPreview ? "Hide Preview" : "Show Preview"}
                </TooltipContent>
              </Tooltip>

              <Tooltip data-oid="7szug3l">
                <TooltipTrigger asChild data-oid=":3205zx">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllSplitEdits}
                    disabled={activeSplitEdits.length === 0}
                    data-oid="us0ohft"
                  >
                    <Target className="h-4 w-4" data-oid="7x-2pxh" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="sov4t06">Clear All Split Edits</TooltipContent>
              </Tooltip>
            </div>

            {/* Режим редактирования */}
            <Separator orientation="vertical" className="h-6" data-oid="k7-ahy6" />
            <div className="flex items-center gap-1" data-oid="d:t7bu8">
              <span className="text-xs text-muted-foreground" data-oid="g5:lfa5">
                Mode:
              </span>
              <Badge variant="outline" className="text-xs" data-oid="qdtf5rn">
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

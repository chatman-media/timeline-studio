/**
 * Панель управления связанными клипами
 */

import { AlertTriangle, Eye, EyeOff, Info, Link2, RefreshCw, Search, Target, Unlink } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useLinkedClips } from "../hooks/use-linked-clips"

const logger = createLogger({ module: "LinkedClipsPanel" })

interface LinkedClipsPanelProps {
  className?: string
  compact?: boolean
}

export function LinkedClipsPanel({ className, compact = false }: LinkedClipsPanelProps) {
  const {
    linkedPairs,
    linkedCount,
    hasActiveLinks,
    unlinkClips,
    unlinkClip,
    findPotentialLinks,
    autoLinkClipsByMedia,
    validateLinkSync,
    syncLinkedClips,
    getLinkStats,
  } = useLinkedClips()

  const [showInactive, setShowInactive] = useState(false)
  const [potentialLinks, setPotentialLinks] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const stats = getLinkStats()

  const handleFindPotentialLinks = async () => {
    setIsSearching(true)
    // Имитируем асинхронную операцию
    await new Promise((resolve) => setTimeout(resolve, 500))
    const links = findPotentialLinks()
    setPotentialLinks(links)
    setIsSearching(false)
  }

  const handleAutoLink = (mediaFileId: string) => {
    const linkedCount = autoLinkClipsByMedia(mediaFileId)
    // Здесь можно добавить уведомление о результате
    logger.info(`Auto-linked ${linkedCount} clips`)
  }

  const visiblePairs = showInactive ? linkedPairs : linkedPairs.filter((pair) => pair.isActive)

  const getLinkTypeColor = (type: string) => {
    switch (type) {
      case "video-audio":
        return "bg-blue-500"
      case "audio-video":
        return "bg-green-500"
      case "multi-camera":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getLinkTypeLabel = (type: string) => {
    switch (type) {
      case "video-audio":
        return "Video → Audio"
      case "audio-video":
        return "Audio → Video"
      case "multi-camera":
        return "Multi-Camera"
      default:
        return type
    }
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-2 p-2", className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Link2 className="h-4 w-4" />
                <Badge variant="secondary" className="ml-1 text-xs">
                  {linkedCount}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <div className="font-medium">Linked Clips</div>
                <div className="text-xs text-muted-foreground">
                  {stats.totalLinks} total, {stats.brokenLinks} broken
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {hasActiveLinks && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Clips
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">{linkedCount} links</Badge>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Link Statistics</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalLinks}</div>
                      <div className="text-sm text-muted-foreground">Total Links</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{stats.brokenLinks}</div>
                      <div className="text-sm text-muted-foreground">Broken Links</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Video → Audio</span>
                      <Badge variant="outline">{stats.videoAudioLinks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Audio → Video</span>
                      <Badge variant="outline">{stats.audioVideoLinks}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Multi-Camera</span>
                      <Badge variant="outline">{stats.multiCameraLinks}</Badge>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={handleFindPotentialLinks} disabled={isSearching}>
            {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find Links
          </Button>

          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showInactive ? "Hide" : "Show"} Inactive
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {visiblePairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No linked clips found</div>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleFindPotentialLinks}>
                  Find Potential Links
                </Button>
              </div>
            ) : (
              visiblePairs.map((pair) => {
                const isValid = validateLinkSync(pair.clip1.id)

                return (
                  <div
                    key={pair.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      pair.isActive ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getLinkTypeColor(pair.type))} />
                        <span className="text-sm font-medium">{getLinkTypeLabel(pair.type)}</span>
                        {!isValid && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      </div>

                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => syncLinkedClips(pair.clip1.id, {})}>
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sync clips</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unlinkClips(pair.clip1.id, pair.clip2.id)}
                              >
                                <Unlink className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Unlink clips</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{pair.clip1.name}</span>
                        <span className="text-muted-foreground">{pair.clip1.startTime.toFixed(2)}s</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{pair.clip2.name}</span>
                        <span className="text-muted-foreground">{pair.clip2.startTime.toFixed(2)}s</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Потенциальные связи */}
        {potentialLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Potential Links
            </h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {potentialLinks.slice(0, 5).map((link, index) => (
                  <div key={index} className="p-2 rounded border border-dashed">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium">
                          {link.clip1.name} ↔ {link.clip2.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {link.reason} ({link.confidence}% confidence)
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // linkClips(link.clip1.id, link.clip2.id)
                          setPotentialLinks((prev) => prev.filter((_, i) => i !== index))
                        }}
                      >
                        <Link2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LinkedClipsPanel

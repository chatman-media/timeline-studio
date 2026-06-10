/**
 * Панель управления связанными клипами
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@timeline-studio/ui/components/dialog"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { AlertTriangle, Eye, EyeOff, Info, Link2, RefreshCw, Search, Target, Unlink } from "lucide-react"
import { useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useLinkedClips } from "../hooks/clips/use-linked-clips"

const logger = createLogger("LinkedClipsPanel")

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
      <TooltipProvider data-oid="5oevu1p">
        <div className={cn("flex items-center gap-2 p-2", className)} data-oid=":auljqc">
          <Tooltip data-oid="2owotb0">
            <TooltipTrigger asChild data-oid="nu385pt">
              <Button variant="ghost" size="sm" className="px-2" data-oid="1-kvx-6">
                <Link2 className="h-4 w-4" data-oid="g7rnm0b" />
                <Badge variant="secondary" className="ml-1 text-xs" data-oid="ak109v3">
                  {linkedCount}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="adr:w3q">
              <div className="text-center" data-oid="fq48fa5">
                <div className="font-medium" data-oid="v_20:2r">
                  Linked Clips
                </div>
                <div className="text-xs text-muted-foreground" data-oid="qgr0f:4">
                  {stats.totalLinks} total, {stats.brokenLinks} broken
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {hasActiveLinks && (
            <>
              <Separator orientation="vertical" className="h-4" data-oid="q589ly6" />
              <Badge variant="outline" className="text-xs" data-oid="smusmsg">
                Active
              </Badge>
            </>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <Card className={cn("w-full", className)} data-oid="elrh84g">
      <CardHeader className="pb-3" data-oid="ph1qgel">
        <div className="flex items-center justify-between" data-oid="hy.d.2t">
          <CardTitle className="text-lg flex items-center gap-2" data-oid="-n5p.po">
            <Link2 className="h-5 w-5" data-oid="i_dao66" />
            Linked Clips
          </CardTitle>

          <div className="flex items-center gap-2" data-oid="xjunk-d">
            <Badge variant="secondary" data-oid="60d-llq">
              {linkedCount} links
            </Badge>

            <Dialog data-oid="4ryb.di">
              <DialogTrigger asChild data-oid="r2a.tkf">
                <Button variant="outline" size="sm" data-oid="ub_r59f">
                  <Info className="h-4 w-4" data-oid="1ero8vz" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-oid="e252m79">
                <DialogHeader data-oid="qet3hff">
                  <DialogTitle data-oid="42i7ssn">Link Statistics</DialogTitle>
                </DialogHeader>
                <div className="space-y-3" data-oid="992jg9m">
                  <div className="grid grid-cols-2 gap-4" data-oid="90t:iap">
                    <div className="text-center" data-oid=":lr6xk-">
                      <div className="text-2xl font-bold" data-oid="vrja-0l">
                        {stats.totalLinks}
                      </div>
                      <div className="text-sm text-muted-foreground" data-oid="ui0nxhy">
                        Total Links
                      </div>
                    </div>
                    <div className="text-center" data-oid="_eqf0-x">
                      <div className="text-2xl font-bold text-red-500" data-oid="onjt19z">
                        {stats.brokenLinks}
                      </div>
                      <div className="text-sm text-muted-foreground" data-oid="pa4ksb:">
                        Broken Links
                      </div>
                    </div>
                  </div>

                  <Separator data-oid="i3-p_f." />

                  <div className="space-y-2" data-oid="61cxq9v">
                    <div className="flex items-center justify-between" data-oid="nx3scyt">
                      <span className="text-sm" data-oid=":r51fvi">
                        Video → Audio
                      </span>
                      <Badge variant="outline" data-oid="22g_-na">
                        {stats.videoAudioLinks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between" data-oid="382-j0r">
                      <span className="text-sm" data-oid="anc:7nu">
                        Audio → Video
                      </span>
                      <Badge variant="outline" data-oid="6k89-0c">
                        {stats.audioVideoLinks}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between" data-oid="jjozr9q">
                      <span className="text-sm" data-oid="n_usvbh">
                        Multi-Camera
                      </span>
                      <Badge variant="outline" data-oid="qx4r1no">
                        {stats.multiCameraLinks}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3" data-oid="bh4.691">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFindPotentialLinks}
            disabled={isSearching}
            data-oid="_43zk6g"
          >
            {isSearching ? (
              <RefreshCw className="h-4 w-4 animate-spin" data-oid="i0pl37x" />
            ) : (
              <Search className="h-4 w-4" data-oid="tuxujaq" />
            )}
            Find Links
          </Button>

          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            data-oid="6k5qh3w"
          >
            {showInactive ? (
              <EyeOff className="h-4 w-4" data-oid="31m2evd" />
            ) : (
              <Eye className="h-4 w-4" data-oid="t2qtt62" />
            )}
            {showInactive ? "Hide" : "Show"} Inactive
          </Button>
        </div>
      </CardHeader>

      <CardContent data-oid="c35ubpj">
        <ScrollArea className="h-[300px]" data-oid="9rqzzst">
          <div className="space-y-3" data-oid="ka4dt6h">
            {visiblePairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-oid="puzhq.j">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" data-oid="dom8cnf" />
                <div className="text-sm" data-oid="ae57kk3">
                  No linked clips found
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleFindPotentialLinks}
                  data-oid="tqq:x6p"
                >
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
                    data-oid="aa41b:a"
                  >
                    <div className="flex items-center justify-between mb-2" data-oid="vghpl7x">
                      <div className="flex items-center gap-2" data-oid="bhwb.hl">
                        <div className={cn("w-3 h-3 rounded-full", getLinkTypeColor(pair.type))} data-oid="kjxtnoa" />
                        <span className="text-sm font-medium" data-oid="161-.js">
                          {getLinkTypeLabel(pair.type)}
                        </span>
                        {!isValid && <AlertTriangle className="h-4 w-4 text-yellow-500" data-oid="6a.m_hc" />}
                      </div>

                      <div className="flex items-center gap-1" data-oid="05-i5es">
                        <TooltipProvider data-oid="j0.th62">
                          <Tooltip data-oid="6g-t7bu">
                            <TooltipTrigger asChild data-oid="3_9.dxp">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => syncLinkedClips(pair.clip1.id, {})}
                                data-oid="-c6n9ov"
                              >
                                <RefreshCw className="h-3 w-3" data-oid="1uzzeb3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent data-oid="1xewlze">Sync clips</TooltipContent>
                          </Tooltip>

                          <Tooltip data-oid="r66:0:o">
                            <TooltipTrigger asChild data-oid="o_ytzhr">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => unlinkClips(pair.clip1.id, pair.clip2.id)}
                                data-oid="61mm15w"
                              >
                                <Unlink className="h-3 w-3" data-oid="s:154:u" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent data-oid="v-ff9kp">Unlink clips</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="space-y-2" data-oid="g3ktkla">
                      <div className="flex items-center justify-between text-xs" data-oid="ihtsjtn">
                        <span className="font-medium" data-oid="tcg3xvb">
                          {pair.clip1.name}
                        </span>
                        <span className="text-muted-foreground" data-oid="lp5_e1r">
                          {pair.clip1.startTime.toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs" data-oid="5c2u-2s">
                        <span className="font-medium" data-oid="2_6vxac">
                          {pair.clip2.name}
                        </span>
                        <span className="text-muted-foreground" data-oid="px9z2.a">
                          {pair.clip2.startTime.toFixed(2)}s
                        </span>
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
          <div className="mt-4 pt-4 border-t" data-oid="_5sfyc6">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2" data-oid="6gic:8q">
              <Target className="h-4 w-4" data-oid="hto2iee" />
              Potential Links
            </h4>
            <ScrollArea className="h-[150px]" data-oid=":_pq.qw">
              <div className="space-y-2" data-oid=".uh-eo0">
                {potentialLinks.slice(0, 5).map((link, index) => (
                  <div key={index} className="p-2 rounded border border-dashed" data-oid="5.yf__w">
                    <div className="flex items-center justify-between" data-oid="hdp81-1">
                      <div className="flex-1" data-oid="11_5n0c">
                        <div className="text-xs font-medium" data-oid="6zv7y3w">
                          {link.clip1.name} ↔ {link.clip2.name}
                        </div>
                        <div className="text-xs text-muted-foreground" data-oid="jqhbl64">
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
                        data-oid="o7gg:36"
                      >
                        <Link2 className="h-3 w-3" data-oid="t1uak54" />
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

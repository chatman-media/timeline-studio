/**
 * Motion Graphics Panel
 * Main UI for managing motion graphics animations
 */

import {
  Download,
  Filter,
  Grid,
  Layers,
  List,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Square,
  Upload,
} from "lucide-react"
import { useCallback, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createLogger } from "@/lib/tauri-logger"
import { getAllPresets, getPresetCategories, getPresetsByCategory, searchPresets } from "../services/preset-manager"
import type { AnimationLayer, AnimationTrack, MotionPreset } from "../types/keyframe"
import { CurveEditor } from "./curve-editor"

const logger = createLogger({ module: "MotionGraphicsPanel" })

interface MotionGraphicsPanelProps {
  tracks: AnimationTrack[]
  currentTime: number
  duration: number
  playing: boolean
  onTimeChange: (time: number) => void
  onPlayPause: () => void
  onStop: () => void
  onReset: () => void
  onTrackAdd: (track: AnimationTrack) => void
  onTrackUpdate: (trackId: string, updates: Partial<AnimationTrack>) => void
  onLayerAdd: (trackId: string, layer: AnimationLayer) => void
  onLayerUpdate: (trackId: string, layerId: string, updates: Partial<AnimationLayer>) => void
  onPresetApply: (preset: MotionPreset, targetId: string) => void
}

export function MotionGraphicsPanel({
  tracks,
  currentTime,
  duration,
  playing,
  onTimeChange,
  onPlayPause,
  onStop,
  onReset,
  onPresetApply,
}: MotionGraphicsPanelProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string>()
  const [selectedLayerId, setSelectedLayerId] = useState<string>()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const categories = getPresetCategories()
  const allPresets = getAllPresets()

  const filteredPresets = searchQuery
    ? searchPresets(searchQuery)
    : selectedCategory === "all"
      ? allPresets
      : getPresetsByCategory(selectedCategory)

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId)
  const selectedLayer = selectedTrack?.layers.find((l) => l.id === selectedLayerId)

  const handlePresetApply = useCallback(
    (preset: MotionPreset) => {
      if (selectedTrackId) {
        onPresetApply(preset, selectedTrackId)
      }
    },
    [selectedTrackId, onPresetApply],
  )

  return (
    <div className="h-full flex flex-col bg-background" data-oid="b0-y_pm">
      {/* Header */}
      <div className="p-4 border-b" data-oid="iyhu2b-">
        <div className="flex items-center justify-between mb-4" data-oid="13-8ta-">
          <h2 className="text-lg font-semibold flex items-center gap-2" data-oid="1pil554">
            <Sparkles className="h-5 w-5" data-oid="crp4ie." />
            Motion Graphics
          </h2>

          <div className="flex items-center gap-2" data-oid="-j8.b2o">
            <Button size="sm" variant="ghost" data-oid="gtlbqjp">
              <Upload className="h-4 w-4" data-oid="v.s1iyk" />
            </Button>
            <Button size="sm" variant="ghost" data-oid="sa80iw7">
              <Download className="h-4 w-4" data-oid="uqibdzc" />
            </Button>
            <Button size="sm" variant="ghost" data-oid="mi36x9i">
              <Settings className="h-4 w-4" data-oid="zruh.ag" />
            </Button>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2" data-oid="td7ak:p">
          <Button size="sm" onClick={onPlayPause} data-oid="1_cfw.5">
            {playing ? (
              <Pause className="h-4 w-4" data-oid="mqdq3ks" />
            ) : (
              <Play className="h-4 w-4" data-oid="xpes4j4" />
            )}
          </Button>
          <Button size="sm" onClick={onStop} data-oid="m3mlcsy">
            <Square className="h-4 w-4" data-oid="3ukrfqh" />
          </Button>
          <Button size="sm" onClick={onReset} data-oid="oz9unv6">
            <RotateCcw className="h-4 w-4" data-oid="4ptvza-" />
          </Button>

          <Separator orientation="vertical" className="h-6" data-oid="r1z0rbi" />

          <div className="flex-1 px-2" data-oid="a5xtk96">
            <div className="relative" data-oid="t53_cg7">
              <input
                type="range"
                value={currentTime}
                onChange={(e) => onTimeChange(Number.parseFloat(e.target.value))}
                min={0}
                max={duration}
                step={0.01}
                className="w-full"
                data-oid="kxbjruu"
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground min-w-[80px]" data-oid="w-kfq4k">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
        </div>
      </div>

      <div className="flex-1 flex" data-oid="hk07qrp">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col" data-oid="xwyfw3k">
          <Tabs value="presets" className="flex-1 flex flex-col" data-oid="t6:pw_i">
            <TabsList className="grid w-full grid-cols-3" data-oid="w_855f9">
              <TabsTrigger value="presets" data-oid="w0gr_.4">
                Presets
              </TabsTrigger>
              <TabsTrigger value="layers" data-oid=":pw:c1w">
                Layers
              </TabsTrigger>
              <TabsTrigger value="properties" data-oid="q-b87_t">
                Properties
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="flex-1 flex flex-col" data-oid="gp9icz9">
              {/* Search and Filters */}
              <div className="p-4 space-y-3" data-oid="xiw.m2q">
                <div className="relative" data-oid="d_suzru">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" data-oid="xsuwqtx" />
                  <Input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-oid="_7c05ti"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="6q.y5cw">
                  <div className="flex items-center gap-2" data-oid="jkpxfc-">
                    <Filter className="h-4 w-4 text-muted-foreground" data-oid="lidd:w_" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm"
                      data-oid="1wsd64a"
                    >
                      <option value="all" data-oid="5njmb4h">
                        All Categories
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} data-oid=":5a9qtr">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex" data-oid="uoy2txv">
                    <Button
                      size="sm"
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      onClick={() => setViewMode("grid")}
                      data-oid="hkippgr"
                    >
                      <Grid className="h-4 w-4" data-oid="agxp9l2" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      onClick={() => setViewMode("list")}
                      data-oid="v2o9u2-"
                    >
                      <List className="h-4 w-4" data-oid="ue.wll6" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Presets Grid */}
              <ScrollArea className="flex-1" data-oid="k_b8x7f">
                <div
                  className={`p-4 ${viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-2"}`}
                  data-oid="o2bgobt"
                >
                  {filteredPresets.map((preset) => (
                    <Card
                      key={preset.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        viewMode === "list" ? "flex items-center gap-3" : ""
                      }`}
                      onClick={() => handlePresetApply(preset)}
                      data-oid="qj58f1x"
                    >
                      {viewMode === "grid" ? (
                        <div className="space-y-2" data-oid="ch9-evk">
                          <div className="h-16 bg-muted rounded flex items-center justify-center" data-oid="4-tnlrm">
                            <Sparkles className="h-6 w-6 text-muted-foreground" data-oid="wz1.qlm" />
                          </div>
                          <div data-oid="i.5gp8t">
                            <div className="font-medium text-sm" data-oid="j9rj47u">
                              {preset.name}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2" data-oid="pa3xqxn">
                              {preset.description}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1" data-oid="k7hvlff">
                            {preset.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs" data-oid="k1l.0y6">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className="w-12 h-12 bg-muted rounded flex items-center justify-center"
                            data-oid="w39ja8p"
                          >
                            <Sparkles className="h-5 w-5 text-muted-foreground" data-oid="u66ni1e" />
                          </div>
                          <div className="flex-1" data-oid="0a0ge7x">
                            <div className="font-medium" data-oid="ygt4v9n">
                              {preset.name}
                            </div>
                            <div className="text-sm text-muted-foreground" data-oid="agmz_ad">
                              {preset.description}
                            </div>
                            <div className="flex gap-1 mt-1" data-oid="909paqv">
                              {preset.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs" data-oid="kdkb8:i">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="layers" className="flex-1 flex flex-col" data-oid="-4v:8u5">
              <div className="p-4" data-oid="t8ibuyf">
                <div className="flex items-center justify-between mb-3" data-oid="gyjvmf5">
                  <h3 className="font-medium" data-oid="z1zcj7l">
                    Animation Layers
                  </h3>
                  <Button size="sm" variant="ghost" data-oid="_lvv:74">
                    <Plus className="h-4 w-4" data-oid="7qj2mq9" />
                  </Button>
                </div>

                <ScrollArea className="h-60" data-oid="e92:txq">
                  <div className="space-y-2" data-oid="7fskqr6">
                    {tracks.map((track) => (
                      <div key={track.id} className="space-y-1" data-oid="-v48aly">
                        <div
                          className={`p-2 rounded cursor-pointer hover:bg-muted/50 flex items-center gap-2 ${
                            selectedTrackId === track.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedTrackId(track.id)}
                          data-oid="py9kr03"
                        >
                          <Layers className="h-4 w-4 text-muted-foreground" data-oid="84hwbmd" />
                          <span className="text-sm font-medium" data-oid="7t6-_j6">
                            Track {track.targetType}
                          </span>
                          <Badge variant="secondary" className="ml-auto text-xs" data-oid="3p-s96b">
                            {track.layers.length}
                          </Badge>
                        </div>

                        {selectedTrackId === track.id && (
                          <div className="ml-6 space-y-1" data-oid="xayn2fs">
                            {track.layers.map((layer) => (
                              <div
                                key={layer.id}
                                className={`p-2 rounded cursor-pointer hover:bg-muted/50 text-sm ${
                                  selectedLayerId === layer.id ? "bg-muted" : ""
                                }`}
                                onClick={() => setSelectedLayerId(layer.id)}
                                data-oid="bz8_6sb"
                              >
                                {layer.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 flex flex-col" data-oid="5w8_qjd">
              <div className="p-4" data-oid="c61px__">
                <h3 className="font-medium mb-3" data-oid="_b9fz_n">
                  Properties
                </h3>

                {selectedLayer ? (
                  <ScrollArea className="h-60" data-oid="f:5n60v">
                    <div className="space-y-2" data-oid=".1c21ya">
                      {selectedLayer.properties.map((prop) => (
                        <div key={prop.id} className="p-2 rounded border" data-oid="enj5n2m">
                          <div className="flex items-center justify-between" data-oid="lzsgo-r">
                            <span className="text-sm font-medium" data-oid="5pae6go">
                              {prop.name}
                            </span>
                            <Badge variant="outline" className="text-xs" data-oid="p7lvx-l">
                              {prop.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1" data-oid="yqcu0_s">
                            {prop.keyframes.length} keyframes
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8" data-oid="izm:vpb">
                    Select a layer to view properties
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col" data-oid="bw2e0ei">
          {selectedLayer ? (
            <CurveEditor
              curves={selectedLayer.properties.map((prop) => ({
                propertyId: prop.id,
                keyframes: prop.keyframes,
                preInfinity: "constant",
                postInfinity: "constant",
                visible: true,
                color: "#3b82f6",
                selected: false,
              }))}
              currentTime={currentTime}
              duration={duration}
              onTimeChange={onTimeChange}
              onKeyframeAdd={(curveId, time, value) => {
                // Handle keyframe addition
                logger.info("Add keyframe", { curveId, time, value })
              }}
              onKeyframeUpdate={(curveId, keyframeId, updates) => {
                // Handle keyframe update
                logger.info("Update keyframe", {
                  curveId,
                  keyframeId,
                  updates,
                })
              }}
              onKeyframeDelete={(curveId, keyframeId) => {
                // Handle keyframe deletion
                logger.info("Delete keyframe", { curveId, keyframeId })
              }}
              onCurveSelect={(curveId) => {
                // Handle curve selection
                logger.info("Select curve", { curveId })
              }}
              height={400}
              data-oid="5432r38"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground" data-oid="ymekyym">
              <div className="text-center" data-oid="i88:rpx">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" data-oid="av1.p-3" />
                <p className="text-lg mb-2" data-oid="d96.612">
                  Motion Graphics
                </p>
                <p className="text-sm" data-oid="vs03yv9">
                  Select a layer to edit animation curves or choose a preset to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

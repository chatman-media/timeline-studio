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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Motion Graphics
          </h2>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              <Upload className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onPlayPause}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex-1 px-2">
            <div className="relative">
              <input
                type="range"
                value={currentTime}
                onChange={(e) => onTimeChange(Number.parseFloat(e.target.value))}
                min={0}
                max={duration}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>

          <div className="text-xs text-muted-foreground min-w-[80px]">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r flex flex-col">
          <Tabs value="presets" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="flex-1 flex flex-col">
              {/* Search and Filters */}
              <div className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex">
                    <Button
                      size="sm"
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "list" ? "default" : "ghost"}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Presets Grid */}
              <ScrollArea className="flex-1">
                <div className={`p-4 ${viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-2"}`}>
                  {filteredPresets.map((preset) => (
                    <Card
                      key={preset.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        viewMode === "list" ? "flex items-center gap-3" : ""
                      }`}
                      onClick={() => handlePresetApply(preset)}
                    >
                      {viewMode === "grid" ? (
                        <div className="space-y-2">
                          <div className="h-16 bg-muted rounded flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{preset.description}</div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {preset.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-sm text-muted-foreground">{preset.description}</div>
                            <div className="flex gap-1 mt-1">
                              {preset.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
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

            <TabsContent value="layers" className="flex-1 flex flex-col">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Animation Layers</h3>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <div key={track.id} className="space-y-1">
                        <div
                          className={`p-2 rounded cursor-pointer hover:bg-muted/50 flex items-center gap-2 ${
                            selectedTrackId === track.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setSelectedTrackId(track.id)}
                        >
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Track {track.targetType}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {track.layers.length}
                          </Badge>
                        </div>

                        {selectedTrackId === track.id && (
                          <div className="ml-6 space-y-1">
                            {track.layers.map((layer) => (
                              <div
                                key={layer.id}
                                className={`p-2 rounded cursor-pointer hover:bg-muted/50 text-sm ${
                                  selectedLayerId === layer.id ? "bg-muted" : ""
                                }`}
                                onClick={() => setSelectedLayerId(layer.id)}
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

            <TabsContent value="properties" className="flex-1 flex flex-col">
              <div className="p-4">
                <h3 className="font-medium mb-3">Properties</h3>

                {selectedLayer ? (
                  <ScrollArea className="h-60">
                    <div className="space-y-2">
                      {selectedLayer.properties.map((prop) => (
                        <div key={prop.id} className="p-2 rounded border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{prop.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {prop.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{prop.keyframes.length} keyframes</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Select a layer to view properties
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
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
                logger.info("Update keyframe", { curveId, keyframeId, updates })
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
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Motion Graphics</p>
                <p className="text-sm">Select a layer to edit animation curves or choose a preset to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

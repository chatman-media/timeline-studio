/**
 * Preset Gallery - Browse and apply effect presets
 */

import { Paintbrush, Palette, Plus, Search, Sparkles, Star, Wrench } from "lucide-react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { EffectPreset } from "../services/effect-pipeline-manager"
import { EffectPipelineManager } from "../services/effect-pipeline-manager"

interface PresetGalleryProps {
  onPresetApplied?: (presetId: string) => void
  className?: string
}

export function PresetGallery({ onPresetApplied, className }: PresetGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const pipelineManager = useRef(
    new EffectPipelineManager("medium", {
      resolution: 1.0,
      effects: "all",
      fps: 30,
      antialiasing: true,
    }),
  )

  const categories = [
    { id: "all", label: "All", icon: Sparkles },
    { id: "color", label: "Color", icon: Palette },
    { id: "style", label: "Style", icon: Paintbrush },
    { id: "correction", label: "Correction", icon: Wrench },
    { id: "artistic", label: "Artistic", icon: Star },
    { id: "custom", label: "Custom", icon: Plus },
  ]

  const getPresets = (): EffectPreset[] => {
    let presets = pipelineManager.current.getPresetsByCategory(
      selectedCategory === "all" ? undefined : selectedCategory,
    )

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      presets = presets.filter(
        (preset) => preset.name.toLowerCase().includes(query) || preset.description?.toLowerCase().includes(query),
      )
    }

    return presets
  }

  const applyPreset = (presetId: string) => {
    const chain = pipelineManager.current.createChainFromPreset(presetId)
    if (chain && onPresetApplied) {
      onPresetApplied(presetId)
    }
  }

  const getPresetThumbnail = (preset: EffectPreset): string => {
    // Generate CSS gradient based on preset effects
    if (preset.effects.length === 0) return "linear-gradient(45deg, #666, #999)"

    const effect = preset.effects[0]
    if (effect.type === "color_correction") {
      const params = effect.parameters || {}
      const temp = params.temperature || 0
      const tint = params.tint || 0

      if (temp > 10) return "linear-gradient(45deg, #ff8c42, #ff6b35)" // Warm
      if (temp < -10) return "linear-gradient(45deg, #4285f4, #34a853)" // Cool
      if (params.saturation === 0) return "linear-gradient(45deg, #333, #777)" // B&W
    }

    if (effect.type === "vignette") {
      return "radial-gradient(circle, transparent 30%, #000 100%)"
    }

    if (effect.type === "blur") {
      return "linear-gradient(45deg, rgba(255,255,255,0.3), rgba(0,0,0,0.3))"
    }

    // Default gradient
    const colors = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"]
    const color1 = colors[preset.id.charCodeAt(0) % colors.length]
    const color2 = colors[preset.id.charCodeAt(1) % colors.length]
    return `linear-gradient(135deg, ${color1}, ${color2})`
  }

  const presets = getPresets()

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-6 w-full">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex flex-col gap-1 p-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{category.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            {presets.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No presets found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? "Try a different search term" : "No presets in this category"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {presets.map((preset) => (
                  <Card
                    key={preset.id}
                    className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onClick={() => applyPreset(preset.id)}
                  >
                    {/* Thumbnail */}
                    <div
                      className="h-20 w-full"
                      style={{
                        background: getPresetThumbnail(preset),
                      }}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="font-medium text-sm truncate">{preset.name}</h5>
                          {preset.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preset.description}</p>
                          )}
                        </div>

                        <Badge variant="outline" className="text-xs">
                          {preset.effects.length}
                        </Badge>
                      </div>

                      {/* Effect types preview */}
                      <div className="flex gap-1 mt-2">
                        {preset.effects.slice(0, 3).map((effect, index) => {
                          const icons = {
                            color_correction: "🎨",
                            blur: "🌫️",
                            vignette: "⚫",
                            transform: "🔄",
                            grain: "📺",
                          }
                          const icon = icons[effect.type as keyof typeof icons] || "⚡"

                          return (
                            <span key={index} className="text-xs">
                              {icon}
                            </span>
                          )
                        })}
                        {preset.effects.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{preset.effects.length - 3}</span>
                        )}
                      </div>
                    </div>

                    {/* Apply button (appears on hover) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="shadow-lg">
                        Apply
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

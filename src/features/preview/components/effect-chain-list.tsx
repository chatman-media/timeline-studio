/**
 * Effect Chain List - Manage effect chains and their order
 */

import { ChevronDown, ChevronRight, Copy, GripVertical, MoreVertical, Plus, Trash2 } from "lucide-react"
import type React from "react"
import { useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import { EffectPipelineManager } from "../services/effect-pipeline-manager"

import type { EffectChain } from "../types"

interface EffectChainListProps {
  className?: string
}

export function EffectChainList({ className }: EffectChainListProps) {
  const [chains, setChains] = useState<EffectChain[]>([])
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set())
  const [draggedChain, setDraggedChain] = useState<string | null>(null)
  const pipelineManager = useRef(
    new EffectPipelineManager("medium", {
      resolution: 1.0,
      effects: "all",
      fps: 30,
      antialiasing: true,
    }),
  )

  const addNewChain = () => {
    const newChain: EffectChain = {
      id: `chain_${Date.now()}`,
      name: `Chain ${chains.length + 1}`,
      effects: [],
      enabled: true,
      order: chains.length,
    }

    setChains([...chains, newChain])
    pipelineManager.current.addChain(newChain)
    setExpandedChains((prev) => new Set([...prev, newChain.id]))
  }

  const toggleChainExpanded = (chainId: string) => {
    setExpandedChains((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(chainId)) {
        newSet.delete(chainId)
      } else {
        newSet.add(chainId)
      }
      return newSet
    })
  }

  const toggleChainEnabled = (chainId: string) => {
    setChains((prev) => prev.map((chain) => (chain.id === chainId ? { ...chain, enabled: !chain.enabled } : chain)))
  }

  const toggleEffectEnabled = (chainId: string, effectId: string) => {
    setChains((prev) =>
      prev.map((chain) =>
        chain.id === chainId
          ? {
              ...chain,
              effects: chain.effects.map((effect) =>
                effect.id === effectId ? { ...effect, enabled: !effect.enabled } : effect,
              ),
            }
          : chain,
      ),
    )
  }

  const updateEffectIntensity = (chainId: string, effectId: string, intensity: number) => {
    setChains((prev) =>
      prev.map((chain) =>
        chain.id === chainId
          ? {
              ...chain,
              effects: chain.effects.map((effect) => (effect.id === effectId ? { ...effect, intensity } : effect)),
            }
          : chain,
      ),
    )
  }

  const removeChain = (chainId: string) => {
    setChains((prev) => prev.filter((chain) => chain.id !== chainId))
    pipelineManager.current.removeChain(chainId)
    setExpandedChains((prev) => {
      const newSet = new Set(prev)
      newSet.delete(chainId)
      return newSet
    })
  }

  const duplicateChain = (chainId: string) => {
    const originalChain = chains.find((c) => c.id === chainId)
    if (!originalChain) return

    const newChain: EffectChain = {
      ...originalChain,
      id: `chain_${Date.now()}`,
      name: `${originalChain.name} Copy`,
      effects: originalChain.effects.map((effect) => ({
        ...effect,
        id: `${effect.id}_copy_${Date.now()}`,
      })),
    }

    setChains((prev) => [...prev, newChain])
    pipelineManager.current.addChain(newChain)
  }

  const handleDragStart = (chainId: string) => {
    setDraggedChain(chainId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetChainId: string) => {
    e.preventDefault()
    if (!draggedChain || draggedChain === targetChainId) return

    const draggedIndex = chains.findIndex((c) => c.id === draggedChain)
    const targetIndex = chains.findIndex((c) => c.id === targetChainId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newChains = [...chains]
    const [removed] = newChains.splice(draggedIndex, 1)
    newChains.splice(targetIndex, 0, removed)

    setChains(newChains)
    pipelineManager.current.setChainOrder(newChains.map((c) => c.id))
    setDraggedChain(null)
  }

  const getEffectIcon = (effectType: string) => {
    const icons = {
      color_correction: "🎨",
      blur: "🌫️",
      vignette: "⚫",
      transform: "🔄",
      grain: "📺",
      chromatic_aberration: "🌈",
      lens_distortion: "👁️",
    }
    return icons[effectType as keyof typeof icons] || "⚡"
  }

  const getEffectName = (effectType: string) => {
    const names = {
      color_correction: "Color Correction",
      blur: "Blur",
      vignette: "Vignette",
      transform: "Transform",
      grain: "Film Grain",
      chromatic_aberration: "Chromatic Aberration",
      lens_distortion: "Lens Distortion",
    }
    return names[effectType as keyof typeof names] || effectType
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Effect Chains</h4>
        <Button size="sm" onClick={addNewChain}>
          <Plus className="w-4 h-4 mr-1" />
          Add Chain
        </Button>
      </div>

      {chains.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No effect chains yet</p>
          <p className="text-sm mt-1">Add a chain to start applying effects</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {chains.map((chain) => (
            <Card
              key={chain.id}
              className={`transition-all ${draggedChain === chain.id ? "opacity-50 scale-95" : ""}`}
              draggable
              onDragStart={() => handleDragStart(chain.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, chain.id)}
            >
              <Collapsible open={expandedChains.has(chain.id)} onOpenChange={() => toggleChainExpanded(chain.id)}>
                <div className="flex items-center gap-2 p-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

                  <Switch checked={chain.enabled} onCheckedChange={() => toggleChainEnabled(chain.id)} />

                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                    {expandedChains.has(chain.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}

                    <span className="font-medium">{chain.name}</span>

                    <Badge variant="secondary" className="text-xs">
                      {chain.effects.length} effects
                    </Badge>
                  </CollapsibleTrigger>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => duplicateChain(chain.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => removeChain(chain.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    {chain.effects.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">No effects in this chain</div>
                    ) : (
                      <div className="space-y-2">
                        {chain.effects.map((effect) => (
                          <div key={effect.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
                            <Switch
                              checked={effect.enabled}
                              onCheckedChange={() => toggleEffectEnabled(chain.id, effect.id)}
                            />

                            <span className="text-lg">{getEffectIcon(effect.type)}</span>

                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{getEffectName(effect.type)}</div>
                            </div>

                            <div className="flex items-center gap-2 w-24">
                              <span className="text-xs text-muted-foreground">
                                {Math.round((effect.intensity || 1) * 100)}%
                              </span>
                              <Slider
                                value={[(effect.intensity || 1) * 100]}
                                onValueChange={([value]) => updateEffectIntensity(chain.id, effect.id, value / 100)}
                                max={100}
                                step={1}
                                className="w-16"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

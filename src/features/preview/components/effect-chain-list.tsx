/**
 * Effect Chain List - Manage effect chains and their order
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card } from "@timeline-studio/ui/components/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@timeline-studio/ui/components/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { ChevronDown, ChevronRight, Copy, GripVertical, MoreVertical, Plus, Trash2 } from "lucide-react"
import type React from "react"
import { useRef, useState } from "react"

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
    <div className={className} data-oid="309ivb6">
      <div className="flex items-center justify-between mb-4" data-oid="4ib39h1">
        <h4 className="font-medium" data-oid="otyc-3q">
          Effect Chains
        </h4>
        <Button size="sm" onClick={addNewChain} data-oid="bzol_e5">
          <Plus className="w-4 h-4 mr-1" data-oid="q0t0gcw" />
          Add Chain
        </Button>
      </div>

      {chains.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground" data-oid="f6wk8j4">
          <p data-oid="cqxkhwv">No effect chains yet</p>
          <p className="text-sm mt-1" data-oid="-csg-.h">
            Add a chain to start applying effects
          </p>
        </Card>
      ) : (
        <div className="space-y-2" data-oid="17f6_p_">
          {chains.map((chain) => (
            <Card
              key={chain.id}
              className={`transition-all ${draggedChain === chain.id ? "opacity-50 scale-95" : ""}`}
              draggable
              onDragStart={() => handleDragStart(chain.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, chain.id)}
              data-oid="qo7p._g"
            >
              <Collapsible
                open={expandedChains.has(chain.id)}
                onOpenChange={() => toggleChainExpanded(chain.id)}
                data-oid="ksrk7i."
              >
                <div className="flex items-center gap-2 p-3" data-oid="vrlj_0d">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" data-oid="7ud:2e_" />

                  <Switch
                    checked={chain.enabled}
                    onCheckedChange={() => toggleChainEnabled(chain.id)}
                    data-oid="53uln22"
                  />

                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left" data-oid="xu-1ide">
                    {expandedChains.has(chain.id) ? (
                      <ChevronDown className="w-4 h-4" data-oid="g20r07y" />
                    ) : (
                      <ChevronRight className="w-4 h-4" data-oid="m91gzzi" />
                    )}

                    <span className="font-medium" data-oid="64jnb45">
                      {chain.name}
                    </span>

                    <Badge variant="secondary" className="text-xs" data-oid="qod1we:">
                      {chain.effects.length} effects
                    </Badge>
                  </CollapsibleTrigger>

                  <DropdownMenu data-oid="tsg.6:5">
                    <DropdownMenuTrigger asChild data-oid="xr1h-0g">
                      <Button variant="ghost" size="sm" data-oid="pkdkmwp">
                        <MoreVertical className="w-4 h-4" data-oid="cc.jb9p" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-oid="a42aqwi">
                      <DropdownMenuItem onClick={() => duplicateChain(chain.id)} data-oid="p2z.a:d">
                        <Copy className="w-4 h-4 mr-2" data-oid="z41hiau" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator data-oid="oc3b-pt" />
                      <DropdownMenuItem
                        onClick={() => removeChain(chain.id)}
                        className="text-destructive"
                        data-oid="qy0_ful"
                      >
                        <Trash2 className="w-4 h-4 mr-2" data-oid="0bg_0b8" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CollapsibleContent data-oid="4qe7qep">
                  <div className="px-3 pb-3" data-oid="vdpw01:">
                    {chain.effects.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm" data-oid="gsm:.9s">
                        No effects in this chain
                      </div>
                    ) : (
                      <div className="space-y-2" data-oid="696uc7y">
                        {chain.effects.map((effect) => (
                          <div
                            key={effect.id}
                            className="flex items-center gap-3 p-2 bg-muted/30 rounded-md"
                            data-oid="ufqkql:"
                          >
                            <Switch
                              checked={effect.enabled}
                              onCheckedChange={() => toggleEffectEnabled(chain.id, effect.id)}
                              data-oid="yezm_-7"
                            />

                            <span className="text-lg" data-oid="..ibm-3">
                              {getEffectIcon(effect.type)}
                            </span>

                            <div className="flex-1 min-w-0" data-oid="12t5yz2">
                              <div className="font-medium text-sm" data-oid="uc2k6:5">
                                {getEffectName(effect.type)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-24" data-oid="2zed_w6">
                              <span className="text-xs text-muted-foreground" data-oid="c0p3e93">
                                {Math.round((effect.intensity || 1) * 100)}%
                              </span>
                              <Slider
                                value={[(effect.intensity || 1) * 100]}
                                onValueChange={([value]) => updateEffectIntensity(chain.id, effect.id, value / 100)}
                                max={100}
                                step={1}
                                className="w-16"
                                data-oid="tea5bt."
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

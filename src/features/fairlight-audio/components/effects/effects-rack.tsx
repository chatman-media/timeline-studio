import { ChevronDown, ChevronRight, GripVertical, Plus, Power, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

import { Compressor } from "./compressor"
import { Equalizer } from "./equalizer"
import { Reverb } from "./reverb"

export type EffectType = "equalizer" | "compressor" | "reverb"

export interface Effect {
  id: string
  type: EffectType
  enabled: boolean
  expanded: boolean
}

interface EffectsRackProps {
  channelId: string
  onEffectAdd?: (effect: Effect) => void
  onEffectRemove?: (effectId: string) => void
  onEffectToggle?: (effectId: string, enabled: boolean) => void
  onEffectParameterChange?: (effectId: string, param: string, value: number) => void
  getCompressorGainReduction?: (effectId: string) => number
  className?: string
}

export function EffectsRack({
  onEffectAdd,
  onEffectRemove,
  onEffectToggle,
  onEffectParameterChange,
  getCompressorGainReduction,
  className,
}: EffectsRackProps) {
  const { t } = useTranslation()
  const [effects, setEffects] = useState<Effect[]>([])
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [gainReductions, setGainReductions] = useState<Record<string, number>>({})
  const animationFrameRef = useRef<number | null>(null)

  const AVAILABLE_EFFECTS: { type: EffectType; label: string }[] = [
    { type: "equalizer", label: t("fairlightAudio.effectsRack.effects.eq") },
    {
      type: "compressor",
      label: t("fairlightAudio.effectsRack.effects.compressor"),
    },
    { type: "reverb", label: t("fairlightAudio.effectsRack.effects.reverb") },
  ]

  const addEffect = (type: EffectType) => {
    const newEffect: Effect = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      expanded: true,
    }

    setEffects([...effects, newEffect])
    onEffectAdd?.(newEffect)
    setShowAddMenu(false)
  }

  const removeEffect = (effectId: string) => {
    setEffects(effects.filter((e) => e.id !== effectId))
    onEffectRemove?.(effectId)
  }

  const toggleEffect = (effectId: string) => {
    setEffects(effects.map((e) => (e.id === effectId ? { ...e, enabled: !e.enabled } : e)))
    const effect = effects.find((e) => e.id === effectId)
    if (effect) {
      onEffectToggle?.(effectId, !effect.enabled)
    }
  }

  const toggleExpanded = (effectId: string) => {
    setEffects(effects.map((e) => (e.id === effectId ? { ...e, expanded: !e.expanded } : e)))
  }

  const renderEffect = (effect: Effect) => {
    const handleParameterChange = (param: string, value: number) => {
      onEffectParameterChange?.(effect.id, param, value)
    }

    const effectContent = () => {
      switch (effect.type) {
        case "equalizer":
          return (
            <Equalizer
              onBandChange={(index, band) => {
                handleParameterChange(`band-${index}`, band.gain)
              }}
              data-oid="xwf25o:"
            />
          )

        case "compressor":
          return (
            <Compressor
              onParameterChange={handleParameterChange}
              gainReduction={gainReductions[effect.id] || 0}
              data-oid="gmgv38s"
            />
          )

        case "reverb":
          return <Reverb onParameterChange={handleParameterChange} data-oid="65gejjc" />
        default:
          return null
      }
    }

    return (
      <div
        key={effect.id}
        className={cn("bg-zinc-800 rounded-lg overflow-hidden transition-opacity", !effect.enabled && "opacity-50")}
        data-oid="1yg6omd"
      >
        {/* Effect Header */}
        <div className="flex items-center gap-2 p-2 border-b border-zinc-700" data-oid="asjazl3">
          <button className="cursor-move text-zinc-500 hover:text-zinc-300" data-oid="qh-ooc9">
            <GripVertical className="w-4 h-4" data-oid="c-.zv5a" />
          </button>

          <button
            onClick={() => toggleExpanded(effect.id)}
            className="text-zinc-400 hover:text-zinc-200"
            data-oid="n2budxd"
          >
            {effect.expanded ? (
              <ChevronDown className="w-4 h-4" data-oid="bygg__i" />
            ) : (
              <ChevronRight className="w-4 h-4" data-oid="c.ixagk" />
            )}
          </button>

          <span className="text-sm font-medium text-zinc-300 flex-1" data-oid="dubjpx6">
            {AVAILABLE_EFFECTS.find((e) => e.type === effect.type)?.label}
          </span>

          <button
            onClick={() => toggleEffect(effect.id)}
            className={cn(
              "p-1 rounded transition-colors",
              effect.enabled ? "text-blue-400 hover:text-blue-300" : "text-zinc-600 hover:text-zinc-400",
            )}
            data-oid=":4xv_tf"
          >
            <Power className="w-4 h-4" data-oid="fxpdzy:" />
          </button>

          <button
            onClick={() => removeEffect(effect.id)}
            className="text-zinc-500 hover:text-red-400 transition-colors"
            data-oid="mg6hxs9"
          >
            <X className="w-4 h-4" data-oid="n9b1j57" />
          </button>
        </div>

        {/* Effect Content */}
        {effect.expanded && (
          <div className={cn("transition-all", !effect.enabled && "pointer-events-none")} data-oid="wk._b4g">
            {effectContent()}
          </div>
        )}
      </div>
    )
  }

  // Update gain reduction values for compressors
  useEffect(() => {
    if (!getCompressorGainReduction) return

    const updateGainReduction = () => {
      const newGainReductions: Record<string, number> = {}

      effects.forEach((effect) => {
        if (effect.type === "compressor" && effect.enabled) {
          newGainReductions[effect.id] = getCompressorGainReduction(effect.id)
        }
      })

      setGainReductions(newGainReductions)
      animationFrameRef.current = requestAnimationFrame(updateGainReduction)
    }

    updateGainReduction()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [effects, getCompressorGainReduction])

  return (
    <div className={cn("space-y-2", className)} data-oid="olq832-">
      <div className="flex items-center justify-between mb-2" data-oid="y5dqemb">
        <h3 className="text-sm font-medium text-zinc-400" data-oid="mt4ebrk">
          {t("fairlightAudio.effectsRack.title")}
        </h3>
        <div className="relative" data-oid="_u.0my9">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            data-oid=":4vv4sw"
          >
            <Plus className="w-3 h-3" data-oid="llg1ie8" />
            {t("fairlightAudio.effectsRack.addEffect")}
          </button>

          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} data-oid=".61ta-s" />
              <div
                className="absolute right-0 top-full mt-1 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-20 min-w-[120px]"
                data-oid="8.0k_ql"
              >
                {AVAILABLE_EFFECTS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => addEffect(type)}
                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                    data-oid="_lzdyq6"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Effects List */}
      {effects.length === 0 ? (
        <div className="text-center py-8 text-zinc-600 text-sm" data-oid="ml-w.x_">
          {t("fairlightAudio.effectsRack.noEffectsAdded")}
        </div>
      ) : (
        <div className="space-y-2" data-oid=":tqh8wc">
          {effects.map(renderEffect)}
        </div>
      )}
    </div>
  )
}

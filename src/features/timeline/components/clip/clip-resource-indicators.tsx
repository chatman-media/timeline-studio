/**
 * Индикаторы примененных ресурсов на клипах
 */

import { Filter, Sparkles, Zap } from "lucide-react"
import { memo } from "react"

import { cn } from "@/lib/utils"

import type { TimelineClip } from "../../types"

interface ClipResourceIndicatorsProps {
  clip: TimelineClip
  className?: string
  showLabels?: boolean
}

export const ClipResourceIndicators = memo(function ClipResourceIndicators({
  clip,
  className,
  showLabels = false,
}: ClipResourceIndicatorsProps) {
  const hasEffects = clip.effects && clip.effects.length > 0
  const hasFilters = clip.filters && clip.filters.length > 0
  const hasTransitions = clip.transitions && clip.transitions.length > 0

  // Если нет ни одного ресурса, не отображаем индикаторы
  if (!hasEffects && !hasFilters && !hasTransitions) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-1", className)} data-oid="jzc36vf">
      {/* Индикатор эффектов */}
      {hasEffects && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
            "bg-purple-500/20 text-purple-300 text-xs font-medium",
          )}
          title={`${clip.effects.length} эффект${clip.effects.length === 1 ? "" : clip.effects.length < 5 ? "а" : "ов"}`}
          data-oid="hnj9azb"
        >
          <Zap className="w-3 h-3" data-oid="i4.o6lm" />
          {showLabels && <span data-oid="raq6ig2">FX</span>}
          <span data-oid="te_34ya">{clip.effects.length}</span>
        </div>
      )}

      {/* Индикатор фильтров */}
      {hasFilters && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
            "bg-blue-500/20 text-blue-300 text-xs font-medium",
          )}
          title={`${clip.filters.length} фильтр${clip.filters.length === 1 ? "" : clip.filters.length < 5 ? "а" : "ов"}`}
          data-oid="b2--v61"
        >
          <Filter className="w-3 h-3" data-oid="7m297_d" />
          {showLabels && <span data-oid="6d1sox-">FL</span>}
          <span data-oid="c7hvlwf">{clip.filters.length}</span>
        </div>
      )}

      {/* Индикатор переходов */}
      {hasTransitions && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
            "bg-green-500/20 text-green-300 text-xs font-medium",
          )}
          title={`${clip.transitions.length} переход${clip.transitions.length === 1 ? "" : clip.transitions.length < 5 ? "а" : "ов"}`}
          data-oid="et3o.u2"
        >
          <Sparkles className="w-3 h-3" data-oid="0ex3_vq" />
          {showLabels && <span data-oid="9dces66">TR</span>}
          <span data-oid="s4r4u:l">{clip.transitions.length}</span>
        </div>
      )}
    </div>
  )
})

// Компонент для отображения детальной информации о ресурсах
interface ClipResourceTooltipProps {
  clip: TimelineClip
}

export const ClipResourceTooltip = memo(function ClipResourceTooltip({ clip }: ClipResourceTooltipProps) {
  const hasAnyResources =
    (clip.effects && clip.effects.length > 0) ||
    (clip.filters && clip.filters.length > 0) ||
    (clip.transitions && clip.transitions.length > 0)

  if (!hasAnyResources) return null

  return (
    <div className="space-y-2" data-oid="ozrq3lk">
      {/* Эффекты */}
      {clip.effects && clip.effects.length > 0 && (
        <div data-oid="q8yp1ge">
          <div className="flex items-center gap-1 text-purple-300 text-sm font-medium mb-1" data-oid="aqhy_ps">
            <Zap className="w-3 h-3" data-oid="kxz2-:a" />
            Эффекты ({clip.effects.length})
          </div>
          <div className="space-y-1 pl-4" data-oid="a40ws.g">
            {clip.effects.slice(0, 3).map((effect) => (
              <div key={effect.id} className="text-xs text-muted-foreground" data-oid="di53l8c">
                • {effect.effectId} {!effect.enabled && "(отключен)"}
              </div>
            ))}
            {clip.effects.length > 3 && (
              <div className="text-xs text-muted-foreground" data-oid="7uw:gah">
                ... и еще {clip.effects.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Фильтры */}
      {clip.filters && clip.filters.length > 0 && (
        <div data-oid="cs7mkkp">
          <div className="flex items-center gap-1 text-blue-300 text-sm font-medium mb-1" data-oid="r_0uag2">
            <Filter className="w-3 h-3" data-oid="suo3hj." />
            Фильтры ({clip.filters.length})
          </div>
          <div className="space-y-1 pl-4" data-oid="2e4b297">
            {clip.filters.slice(0, 3).map((filter) => (
              <div key={filter.id} className="text-xs text-muted-foreground" data-oid="y4pghfy">
                • {filter.filterId} {!filter.isEnabled && "(отключен)"}
              </div>
            ))}
            {clip.filters.length > 3 && (
              <div className="text-xs text-muted-foreground" data-oid="ohx6.25">
                ... и еще {clip.filters.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Переходы */}
      {clip.transitions && clip.transitions.length > 0 && (
        <div data-oid="i9o.i12">
          <div className="flex items-center gap-1 text-green-300 text-sm font-medium mb-1" data-oid="smvdfkf">
            <Sparkles className="w-3 h-3" data-oid="umdt-gw" />
            Переходы ({clip.transitions.length})
          </div>
          <div className="space-y-1 pl-4" data-oid="sc2zzle">
            {clip.transitions.slice(0, 3).map((transition) => (
              <div key={transition.id} className="text-xs text-muted-foreground" data-oid="6p9vo:_">
                • {transition.transitionId} ({transition.type}) {!transition.isEnabled && "(отключен)"}
              </div>
            ))}
            {clip.transitions.length > 3 && (
              <div className="text-xs text-muted-foreground" data-oid="a_l_5r7">
                ... и еще {clip.transitions.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

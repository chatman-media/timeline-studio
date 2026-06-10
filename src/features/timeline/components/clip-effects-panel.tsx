/**
 * ClipEffectsPanel - Панель управления эффектами клипа
 * Позволяет просматривать, добавлять и настраивать эффекты для выбранного клипа
 */

import { GripVertical, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@timeline-studio/ui/components/dialog"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Switch } from "@timeline-studio/ui/components/switch"
import type { AppliedEffect, BaseEffect } from "@timeline-studio/core/types"
import { EffectManagerPanel } from "@/features/effects/components/effect-manager-panel"
import { EffectParameterControls } from "@/features/effects/components/effect-parameter-controls"
import { useEffects } from "@/features/effects/hooks/use-effects"
import { createLogger } from "@/lib/tauri-logger"
import { useTimelineEffects } from "../hooks/effects/use-timeline-effects"
import { useTimeline } from "../hooks/state/use-timeline"
import type { TimelineClip } from "../types"

const logger = createLogger("ClipEffectsPanel")

interface ClipEffectsPanelProps {
  clip: TimelineClip | null
  onClose?: () => void
}

/**
 * Компонент панели эффектов для клипа
 */
export function ClipEffectsPanel({ clip, onClose }: ClipEffectsPanelProps) {
  const { t, i18n } = useTranslation()
  const { effects: availableEffects } = useEffects()
  const { applyEffect, removeEffect } = useTimelineEffects()
  const { send } = useTimeline()

  const [showEffectSelector, setShowEffectSelector] = useState(false)
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null)
  const [expandedEffects, setExpandedEffects] = useState<Set<string>>(new Set())

  // Получаем эффекты клипа с полной информацией
  const clipEffects = useMemo(() => {
    if (!clip) return []

    return clip.effects
      .map((appliedEffect) => {
        const baseEffect = availableEffects.find((e) => e.id === appliedEffect.effectId)
        return {
          applied: appliedEffect,
          base: baseEffect,
        }
      })
      .filter((e) => e.base) // Фильтруем эффекты, которые не найдены в библиотеке
  }, [clip, availableEffects])

  // Выбранный эффект для настройки параметров
  const selectedEffect = useMemo(() => {
    if (!selectedEffectId) return null
    return clipEffects.find((e) => e.applied.id === selectedEffectId)
  }, [selectedEffectId, clipEffects])

  // Обработчик добавления эффекта
  const handleAddEffect = useCallback(
    (effect: BaseEffect, _preset?: string, customParams?: Record<string, any>) => {
      if (!clip) return

      const appliedEffect: AppliedEffect = {
        id: `applied_${effect.id}_${Date.now()}`,
        effectId: effect.id,
        startTime: 0,
        parameters: customParams || {},
        enabled: true,
        order: clip.effects.length,
        keyframes: {},
        masks: [],
        blendMode: "normal" as const,
        opacity: 1,
        effectVersion: effect.version || "1.0",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }

      send({
        type: "ADD_EFFECT_TO_CLIP",
        clipId: clip.id,
        effect: appliedEffect,
      })

      setShowEffectSelector(false)
    },
    [clip, send],
  )

  // Обработчик удаления эффекта
  const handleRemoveEffect = useCallback(
    (appliedEffectId: string) => {
      if (!clip) return

      send({
        type: "REMOVE_EFFECT_FROM_CLIP",
        clipId: clip.id,
        effectId: appliedEffectId,
      })

      if (selectedEffectId === appliedEffectId) {
        setSelectedEffectId(null)
      }
    },
    [clip, send, selectedEffectId],
  )

  // Обработчик переключения состояния эффекта
  const handleToggleEffect = useCallback(
    (appliedEffectId: string, enabled: boolean) => {
      if (!clip) return

      send({
        type: "UPDATE_CLIP_EFFECT",
        clipId: clip.id,
        effectId: appliedEffectId,
        updates: { enabled },
      })
    },
    [clip, send],
  )

  // Обработчик изменения параметров эффекта
  const handleParametersChange = useCallback(
    (appliedEffectId: string, params: Record<string, any>) => {
      if (!clip) return

      send({
        type: "UPDATE_CLIP_EFFECT",
        clipId: clip.id,
        effectId: appliedEffectId,
        updates: { parameters: params, modifiedAt: new Date() },
      })
    },
    [clip, send],
  )

  // Обработчик изменения порядка эффектов
  const handleReorderEffects = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!clip) return

      // TODO: Add reorderEffects to useTimelineEffects hook
      logger.warn("Reordering effects not yet implemented", {
        fromIndex,
        toIndex,
      })
    },
    [clip],
  )

  // Разворачивание/сворачивание эффекта
  const toggleEffectExpanded = useCallback((effectId: string) => {
    setExpandedEffects((prev) => {
      const next = new Set(prev)
      if (next.has(effectId)) {
        next.delete(effectId)
      } else {
        next.add(effectId)
      }
      return next
    })
  }, [])

  // Автоматически выбираем первый эффект при смене клипа
  useEffect(() => {
    if (clipEffects.length > 0 && !selectedEffectId) {
      setSelectedEffectId(clipEffects[0].applied.id)
    }
  }, [clipEffects, selectedEffectId])

  if (!clip) {
    return (
      <Card className="h-full" data-oid=".35jrss">
        <CardHeader data-oid="f2yukjj">
          <CardTitle data-oid="64c3r-t">{t("timeline.effects.title", "Эффекты клипа")}</CardTitle>
        </CardHeader>
        <CardContent data-oid="7a1x0q1">
          <p className="text-muted-foreground text-center py-8" data-oid="a0zsxb5">
            {t("timeline.effects.noClipSelected", "Выберите клип для управления эффектами")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col" data-oid="np0alw_">
      <CardHeader className="flex-none" data-oid="up-zs82">
        <div className="flex items-center justify-between" data-oid="qm6odbl">
          <CardTitle data-oid="uobx.2d">{t("timeline.effects.title", "Эффекты клипа")}</CardTitle>
          <div className="flex items-center gap-2" data-oid="q9d:wnp">
            <Dialog open={showEffectSelector} onOpenChange={setShowEffectSelector} data-oid="094taxw">
              <DialogTrigger asChild data-oid="dj9:1ev">
                <Button size="sm" variant="outline" data-oid="ckwy4u-">
                  <Plus className="w-4 h-4 mr-2" data-oid="p8nh-6e" />
                  {t("timeline.effects.add", "Добавить")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]" data-oid="_s-6w3z">
                <DialogHeader data-oid="hop2y:b">
                  <DialogTitle data-oid="3110ta-">{t("timeline.effects.selectEffect", "Выберите эффект")}</DialogTitle>
                  <DialogDescription data-oid="nbk5amd">
                    {t("timeline.effects.selectEffectDescription", "Выберите эффект для добавления к клипу")}
                  </DialogDescription>
                </DialogHeader>
                <div className="h-[500px]" data-oid="m:mzqou">
                  <EffectManagerPanel onApplyEffect={handleAddEffect} previewSize={100} data-oid="lvi025t" />
                </div>
              </DialogContent>
            </Dialog>
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} data-oid="nqpwng7">
                ✕
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1" data-oid="i01f6yf">
          {clip.name}
        </p>
      </CardHeader>

      <Separator data-oid="mtykd-i" />

      <CardContent className="flex-1 p-0 flex" data-oid="f8m06h1">
        {/* Список эффектов */}
        <div className="w-1/3 border-r" data-oid="4akq02b">
          <ScrollArea className="h-full" data-oid="4n_lkev">
            <div className="p-4 space-y-2" data-oid="i5i3ash">
              {clipEffects.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4" data-oid="kywpy9p">
                  {t("timeline.effects.noEffects", "Нет эффектов")}
                </p>
              ) : (
                clipEffects.map((effect, _index) => (
                  <div
                    key={effect.applied.id}
                    className={`
                      flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
                      ${selectedEffectId === effect.applied.id ? "bg-primary/10" : "hover:bg-muted"}
                      ${!effect.applied.enabled ? "opacity-50" : ""}
                    `}
                    onClick={() => setSelectedEffectId(effect.applied.id)}
                    data-oid="lfxh14r"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" data-oid="9k.etcr" />

                    <Switch
                      checked={effect.applied.enabled}
                      onCheckedChange={(checked) => handleToggleEffect(effect.applied.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                      data-oid="dpepcyo"
                    />

                    <div className="flex-1 min-w-0" data-oid="wy5bd2p">
                      <p className="text-sm font-medium truncate" data-oid="3ml.zhx">
                        {effect.base?.name[i18n.language] || effect.base?.name.en}
                      </p>
                      {effect.base?.category && (
                        <p className="text-xs text-muted-foreground" data-oid="iw3k_ya">
                          {effect.base.category}
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveEffect(effect.applied.id)
                      }}
                      data-oid="2pvooc3"
                    >
                      <Trash2 className="w-4 h-4" data-oid="xq4my4v" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Параметры выбранного эффекта */}
        <div className="flex-1" data-oid="ujw9z2-">
          <ScrollArea className="h-full" data-oid="u6:6152">
            <div className="p-4" data-oid="i8oal40">
              {selectedEffect ? (
                <>
                  <h3 className="font-medium mb-4" data-oid="obq7-k.">
                    {selectedEffect.base?.name[i18n.language] || selectedEffect.base?.name.en}
                  </h3>

                  {selectedEffect.base?.description && (
                    <p className="text-sm text-muted-foreground mb-4" data-oid="8akdtbw">
                      {selectedEffect.base.description[i18n.language] || selectedEffect.base.description.en}
                    </p>
                  )}

                  {selectedEffect.base && (
                    <EffectParameterControls
                      effect={selectedEffect.base}
                      onParametersChange={(params) => handleParametersChange(selectedEffect.applied.id, params)}
                      data-oid="pgq4uqr"
                    />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8" data-oid="ebqse-y">
                  {t("timeline.effects.selectEffectToEdit", "Выберите эффект для редактирования")}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

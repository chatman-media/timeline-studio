/**
 * ClipEffectsPanel - Панель управления эффектами клипа
 * Позволяет просматривать, добавлять и настраивать эффекты для выбранного клипа
 */

import { GripVertical, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { EffectManagerPanel } from "@/features/effects/components/effect-manager-panel"
import { EffectParameterControls } from "@/features/effects/components/effect-parameter-controls"
import { useEffects } from "@/features/effects/hooks/use-effects"
import type { BaseEffect } from "@/features/effects/types"
import { createLogger } from "@/lib/tauri-logger"
import { useTimeline } from "../hooks/use-timeline"
import { useTimelineEffects } from "../hooks/use-timeline-effects"
import type { AppliedEffect, TimelineClip } from "../types"

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
  const { applyEffect, removeEffect, updateEffect } = useTimelineEffects()
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
        customParams: customParams || {},
        enabled: true,
        order: clip.effects.length,
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

      void updateEffect(clip.id, appliedEffectId, { customParams: params })
    },
    [clip, updateEffect],
  )

  // Обработчик изменения порядка эффектов
  const handleReorderEffects = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!clip) return

      // TODO: Add reorderEffects to useTimelineEffects hook
      logger.warn("Reordering effects not yet implemented", { fromIndex, toIndex })
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
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{t("timeline.effects.title", "Эффекты клипа")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t("timeline.effects.noClipSelected", "Выберите клип для управления эффектами")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <CardTitle>{t("timeline.effects.title", "Эффекты клипа")}</CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={showEffectSelector} onOpenChange={setShowEffectSelector}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("timeline.effects.add", "Добавить")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{t("timeline.effects.selectEffect", "Выберите эффект")}</DialogTitle>
                  <DialogDescription>
                    {t("timeline.effects.selectEffectDescription", "Выберите эффект для добавления к клипу")}
                  </DialogDescription>
                </DialogHeader>
                <div className="h-[500px]">
                  <EffectManagerPanel onApplyEffect={handleAddEffect} previewSize={100} />
                </div>
              </DialogContent>
            </Dialog>
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{clip.name}</p>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 flex">
        {/* Список эффектов */}
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {clipEffects.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
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
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />

                    <Switch
                      checked={effect.applied.enabled}
                      onCheckedChange={(checked) => handleToggleEffect(effect.applied.id, checked)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {effect.base?.name[i18n.language] || effect.base?.name.en}
                      </p>
                      {effect.base?.category && <p className="text-xs text-muted-foreground">{effect.base.category}</p>}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveEffect(effect.applied.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Параметры выбранного эффекта */}
        <div className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              {selectedEffect ? (
                <>
                  <h3 className="font-medium mb-4">
                    {selectedEffect.base?.name[i18n.language] || selectedEffect.base?.name.en}
                  </h3>

                  {selectedEffect.base?.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedEffect.base.description[i18n.language] || selectedEffect.base.description.en}
                    </p>
                  )}

                  {selectedEffect.base && (
                    <EffectParameterControls
                      effect={selectedEffect.base}
                      onParametersChange={(params) => handleParametersChange(selectedEffect.applied.id, params)}
                    />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">
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

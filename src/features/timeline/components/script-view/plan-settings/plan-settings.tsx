/**
 * Plan Settings - настройки плана монтажа
 */

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MontageStyle, PlanSettings as PlanSettingsType } from "@/features/timeline/types/script"

export interface PlanSettingsProps {
  /** Настройки плана */
  settings: PlanSettingsType
  /** Название плана */
  planName: string
  /** Целевая длительность */
  targetDuration: number
  /** Стиль монтажа */
  style: MontageStyle
  /** Callback при изменении настроек */
  onSettingsChange?: (settings: PlanSettingsType) => void
  /** Callback при изменении названия */
  onNameChange?: (name: string) => void
  /** Callback при изменении длительности */
  onDurationChange?: (duration: number) => void
  /** Callback при изменении стиля */
  onStyleChange?: (style: MontageStyle) => void
  /** Callback при генерации плана AI */
  onGeneratePlan?: () => void
  /** Callback при применении плана */
  onApplyPlan?: () => void
}

export function PlanSettings({
  settings,
  planName,
  targetDuration,
  style,
  onSettingsChange,
  onNameChange,
  onDurationChange,
  onStyleChange,
  onGeneratePlan,
  onApplyPlan,
}: PlanSettingsProps) {
  return (
    <div className="flex h-full flex-col" data-testid="plan-settings">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="text-sm font-semibold">Настройки плана</h3>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Plan name */}
        <div className="space-y-2">
          <Label htmlFor="plan-name" className="text-xs">
            Название плана
          </Label>
          <Input
            id="plan-name"
            value={planName}
            onChange={e => onNameChange?.(e.target.value)}
            placeholder="Мой план монтажа"
            className="h-8 text-xs"
            data-testid="plan-name-input"
          />
        </div>

        {/* Target duration */}
        <div className="space-y-2">
          <Label htmlFor="target-duration" className="text-xs">
            Целевая длительность (сек)
          </Label>
          <Input
            id="target-duration"
            type="number"
            value={targetDuration}
            onChange={e => onDurationChange?.(Number(e.target.value))}
            min={0}
            className="h-8 text-xs"
            data-testid="target-duration-input"
          />
        </div>

        {/* Style */}
        <div className="space-y-2">
          <Label className="text-xs">Стиль монтажа</Label>
          <div className="space-y-1">
            {(
              [
                "dynamic-action",
                "cinematic-drama",
                "music-video",
                "documentary",
                "social-media",
                "corporate",
              ] as MontageStyle[]
            ).map(s => (
              <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="style"
                  value={s}
                  checked={style === s}
                  onChange={() => onStyleChange?.(s)}
                  className="cursor-pointer"
                  data-testid={`style-${s}`}
                />
                <span className="capitalize">{s.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t p-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onGeneratePlan}
          className="w-full text-xs cursor-pointer"
          data-testid="generate-plan-button"
        >
          Создать план (AI)
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onApplyPlan}
          className="w-full text-xs cursor-pointer"
          data-testid="apply-plan-button"
        >
          Применить к Timeline
        </Button>
      </div>
    </div>
  )
}

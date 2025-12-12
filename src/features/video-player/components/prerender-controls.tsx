/**
 * Компонент управления пререндером
 */

import { Settings2, Sparkles } from "lucide-react"
import { useCallback, useId } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useNotifications } from "@/core/hooks"
import { usePlayer } from "@/domains/video-editing"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { usePrerender, usePrerenderCache } from "@/features/video-compiler/hooks/use-prerender"

export interface PrerenderSettings {
  enabled: boolean
  quality: number
  segmentDuration: number
  applyEffects: boolean
  autoPrerender: boolean
}

interface PrerenderControlsProps {
  currentTime: number
  duration: number
  onSettingsChange?: (settings: PrerenderSettings) => void
}

export function PrerenderControls({ currentTime, duration, onSettingsChange }: PrerenderControlsProps) {
  const { prerender, isRendering, currentResult } = usePrerender()
  const { clearCache, cacheSize, totalCacheSize } = usePrerenderCache()
  const { project } = useTimeline()
  const { showSuccess } = useNotifications()
  const {
    prerenderSettings: {
      prerenderEnabled,
      prerenderQuality,
      prerenderSegmentDuration,
      prerenderApplyEffects,
      prerenderAutoPrerender,
    },
    setPrerenderSettings,
  } = usePlayer()

  const settings: PrerenderSettings = {
    enabled: prerenderEnabled,
    quality: prerenderQuality,
    segmentDuration: prerenderSegmentDuration,
    applyEffects: prerenderApplyEffects,
    autoPrerender: prerenderAutoPrerender,
  }

  /**
   * Обновить настройку
   */
  const updateSetting = useCallback(
    <K extends keyof PrerenderSettings>(key: K, value: PrerenderSettings[K]) => {
      const newSettings = { ...settings, [key]: value }

      // Обновляем глобальные настройки в плеере
      setPrerenderSettings({
        prerenderEnabled: key === "enabled" ? (value as boolean) : undefined,
        prerenderQuality: key === "quality" ? (value as number) : undefined,
        prerenderSegmentDuration: key === "segmentDuration" ? (value as number) : undefined,
        prerenderApplyEffects: key === "applyEffects" ? (value as boolean) : undefined,
        prerenderAutoPrerender: key === "autoPrerender" ? (value as boolean) : undefined,
      })

      onSettingsChange?.(newSettings)
    },
    [settings, setPrerenderSettings, onSettingsChange],
  )

  /**
   * Выполнить пререндер текущего сегмента
   */
  const handlePrerenderCurrent = useCallback(async () => {
    const segmentStart = Math.floor(currentTime / settings.segmentDuration) * settings.segmentDuration
    const segmentEnd = Math.min(segmentStart + settings.segmentDuration, duration)

    const result = await prerender(segmentStart, segmentEnd, settings.applyEffects, settings.quality)

    if (result) {
      showSuccess(
        "Пререндер завершен",
        `Завершено за ${result.renderTimeMs}мс. Размер: ${(result.fileSize / 1024 / 1024).toFixed(2)} МБ`,
      )
    }
  }, [currentTime, duration, settings, prerender, showSuccess])

  /**
   * Проверить, есть ли эффекты в текущем моменте
   */
  const hasEffectsAtCurrentTime = useCallback(() => {
    if (!project) return false

    // Проверяем, есть ли эффекты или фильтры в проекте
    // В реальной реализации здесь должна быть логика поиска клипов в указанное время
    const hasEffects = project.sections?.some((section) =>
      section.tracks.some((track) =>
        track.clips.some((clip) => (clip.effects?.length || 0) > 0 || (clip.filters?.length || 0) > 0),
      ),
    )

    return hasEffects || false
  }, [currentTime, project])

  const id = useId()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${settings.enabled ? "text-primary" : ""}`}
          aria-label="Настройки пререндера"
        >
          <Sparkles className="h-4 w-4" />
          {isRendering && (
            <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          )}
          {settings.enabled && cacheSize > 0 && <span className="ml-1 text-xs">{cacheSize}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Настройки пререндера</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Включение/выключение */}
        <div className="flex items-center justify-between px-2 py-3">
          <Label htmlFor={`${id}-prerender-enabled`}>Включить пререндер</Label>
          <Switch
            id={`${id}-prerender-enabled`}
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting("enabled", checked)}
          />
        </div>

        {settings.enabled && (
          <>
            <DropdownMenuSeparator />

            {/* Качество */}
            <div className="px-2 py-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Качество</Label>
                <span className="text-sm text-muted-foreground">{settings.quality}%</span>
              </div>
              <Slider
                value={[settings.quality]}
                onValueChange={([value]) => updateSetting("quality", value)}
                min={10}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Длительность сегмента */}
            <div className="px-2 py-3">
              <div className="flex items-center justify-between mb-2">
                <Label>Длительность сегмента</Label>
                <span className="text-sm text-muted-foreground">{settings.segmentDuration}с</span>
              </div>
              <Slider
                value={[settings.segmentDuration]}
                onValueChange={([value]) => updateSetting("segmentDuration", value)}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            {/* Применять эффекты */}
            <div className="flex items-center justify-between px-2 py-3">
              <Label htmlFor={`${id}-apply-effects`}>Применять эффекты</Label>
              <Switch
                id={`${id}-apply-effects`}
                checked={settings.applyEffects}
                onCheckedChange={(checked) => updateSetting("applyEffects", checked)}
              />
            </div>

            {/* Автоматический пререндер */}
            <div className="flex items-center justify-between px-2 py-3">
              <Label htmlFor={`${id}-auto-prerender`}>Автоматический</Label>
              <Switch
                id={`${id}-auto-prerender`}
                checked={settings.autoPrerender}
                onCheckedChange={(checked) => updateSetting("autoPrerender", checked)}
              />
            </div>

            <DropdownMenuSeparator />

            {/* Действия */}
            <DropdownMenuItem onClick={handlePrerenderCurrent} disabled={isRendering || !hasEffectsAtCurrentTime()}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isRendering ? "Рендеринг..." : "Пререндер текущего сегмента"}
            </DropdownMenuItem>

            {cacheSize > 0 && (
              <DropdownMenuItem onClick={clearCache} className="text-destructive">
                <Settings2 className="mr-2 h-4 w-4" />
                Очистить кеш ({cacheSize} файлов, {(totalCacheSize / 1024 / 1024).toFixed(1)} МБ)
              </DropdownMenuItem>
            )}

            {/* Информация */}
            {currentResult && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 text-xs text-muted-foreground">
                  <div>Последний рендер: {currentResult.duration.toFixed(2)}с</div>
                  <div>Время: {currentResult.renderTimeMs}мс</div>
                  <div>Размер: {(currentResult.fileSize / 1024 / 1024).toFixed(2)} МБ</div>
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

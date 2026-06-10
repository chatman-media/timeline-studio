/**
 * Компонент управления пререндером
 */

import { Settings2, Sparkles } from "lucide-react"
import { useCallback, useId } from "react"

import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Label } from "@timeline-studio/ui/components/label"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { useNotifications } from "@timeline-studio/core/hooks"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { usePlayer } from "@/features/timeline/providers/player-provider"
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
    <DropdownMenu data-oid="gy_7yhu">
      <DropdownMenuTrigger asChild data-oid="hnft_x.">
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${settings.enabled ? "text-primary" : ""}`}
          aria-label="Настройки пререндера"
          data-oid="-nb_1h."
        >
          <Sparkles className="h-4 w-4" data-oid="_6btbcr" />
          {isRendering && (
            <span
              className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-orange-500"
              data-oid="t4mtqw-"
            />
          )}
          {settings.enabled && cacheSize > 0 && (
            <span className="ml-1 text-xs" data-oid="7fmbwxm">
              {cacheSize}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-oid="q9v-7up">
        <DropdownMenuLabel data-oid="adaj-fi">Настройки пререндера</DropdownMenuLabel>
        <DropdownMenuSeparator data-oid="yd::jbn" />

        {/* Включение/выключение */}
        <div className="flex items-center justify-between px-2 py-3" data-oid=":cupm3g">
          <Label htmlFor={`${id}-prerender-enabled`} data-oid="q6hwq6p">
            Включить пререндер
          </Label>
          <Switch
            id={`${id}-prerender-enabled`}
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting("enabled", checked)}
            data-oid=".zr8w24"
          />
        </div>

        {settings.enabled && (
          <>
            <DropdownMenuSeparator data-oid="fc1gb7v" />

            {/* Качество */}
            <div className="px-2 py-3" data-oid="n859e0a">
              <div className="flex items-center justify-between mb-2" data-oid="j8c3ps5">
                <Label data-oid="7lpu45:">Качество</Label>
                <span className="text-sm text-muted-foreground" data-oid="ub9_i7i">
                  {settings.quality}%
                </span>
              </div>
              <Slider
                value={[settings.quality]}
                onValueChange={([value]) => updateSetting("quality", value)}
                min={10}
                max={100}
                step={5}
                className="w-full"
                data-oid="bzs_hvh"
              />
            </div>

            {/* Длительность сегмента */}
            <div className="px-2 py-3" data-oid="sx67n0x">
              <div className="flex items-center justify-between mb-2" data-oid="f-v7xxx">
                <Label data-oid="_s-yv9:">Длительность сегмента</Label>
                <span className="text-sm text-muted-foreground" data-oid="ig8i0ge">
                  {settings.segmentDuration}с
                </span>
              </div>
              <Slider
                value={[settings.segmentDuration]}
                onValueChange={([value]) => updateSetting("segmentDuration", value)}
                min={1}
                max={30}
                step={1}
                className="w-full"
                data-oid="su7wtp5"
              />
            </div>

            {/* Применять эффекты */}
            <div className="flex items-center justify-between px-2 py-3" data-oid="er93x-r">
              <Label htmlFor={`${id}-apply-effects`} data-oid="9s3k:hz">
                Применять эффекты
              </Label>
              <Switch
                id={`${id}-apply-effects`}
                checked={settings.applyEffects}
                onCheckedChange={(checked) => updateSetting("applyEffects", checked)}
                data-oid="k9d58om"
              />
            </div>

            {/* Автоматический пререндер */}
            <div className="flex items-center justify-between px-2 py-3" data-oid="2k_sfgv">
              <Label htmlFor={`${id}-auto-prerender`} data-oid="x_1nsw2">
                Автоматический
              </Label>
              <Switch
                id={`${id}-auto-prerender`}
                checked={settings.autoPrerender}
                onCheckedChange={(checked) => updateSetting("autoPrerender", checked)}
                data-oid="it7fahy"
              />
            </div>

            <DropdownMenuSeparator data-oid="2m5oz.r" />

            {/* Действия */}
            <DropdownMenuItem
              onClick={handlePrerenderCurrent}
              disabled={isRendering || !hasEffectsAtCurrentTime()}
              data-oid="7nh-4y9"
            >
              <Sparkles className="mr-2 h-4 w-4" data-oid="8n652c7" />
              {isRendering ? "Рендеринг..." : "Пререндер текущего сегмента"}
            </DropdownMenuItem>

            {cacheSize > 0 && (
              <DropdownMenuItem onClick={clearCache} className="text-destructive" data-oid="36:jo_1">
                <Settings2 className="mr-2 h-4 w-4" data-oid="621-80b" />
                Очистить кеш ({cacheSize} файлов, {(totalCacheSize / 1024 / 1024).toFixed(1)} МБ)
              </DropdownMenuItem>
            )}

            {/* Информация */}
            {currentResult && (
              <>
                <DropdownMenuSeparator data-oid="h1dv4p-" />
                <div className="px-2 py-2 text-xs text-muted-foreground" data-oid="h.es57e">
                  <div data-oid="eh8c6yz">Последний рендер: {currentResult.duration.toFixed(2)}с</div>
                  <div data-oid="xd2_q5p">Время: {currentResult.renderTimeMs}мс</div>
                  <div data-oid="9d_jo73">Размер: {(currentResult.fileSize / 1024 / 1024).toFixed(2)} МБ</div>
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

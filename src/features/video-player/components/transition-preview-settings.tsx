/**
 * Настройки предпросмотра переходов в видеоплеере
 */

import { Eye, EyeOff, Settings } from "lucide-react"
import { useId } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TransitionPreviewSettingsProps {
  isEnabled: boolean
  onEnabledChange: (enabled: boolean) => void
  showOverlay: boolean
  onShowOverlayChange: (show: boolean) => void
  showMiniIndicator: boolean
  onShowMiniIndicatorChange: (show: boolean) => void
  quality: number
  onQualityChange: (quality: number) => void
  className?: string
}

/**
 * Панель настроек предпросмотра переходов
 */
export function TransitionPreviewSettings({
  isEnabled,
  onEnabledChange,
  showOverlay,
  onShowOverlayChange,
  showMiniIndicator,
  onShowMiniIndicatorChange,
  quality,
  onQualityChange,
  className,
}: TransitionPreviewSettingsProps) {
  const id = useId()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Быстрые переключатели */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => onEnabledChange(!isEnabled)}
              className="h-8"
            >
              {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEnabled ? "Отключить предпросмотр переходов" : "Включить предпросмотр переходов"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Подробные настройки */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Настройки предпросмотра</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Основные настройки */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-enable-preview`}>Включить предпросмотр</Label>
                  <Switch id={`${id}-enable-preview`} checked={isEnabled} onCheckedChange={onEnabledChange} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-show-overlay`}>Показывать информацию</Label>
                  <Switch
                    id={`${id}-show-overlay`}
                    checked={showOverlay}
                    onCheckedChange={onShowOverlayChange}
                    disabled={!isEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-show-indicator`}>Мини-индикатор</Label>
                  <Switch
                    id={`${id}-show-indicator`}
                    checked={showMiniIndicator}
                    onCheckedChange={onShowMiniIndicatorChange}
                    disabled={!isEnabled}
                  />
                </div>
              </div>

              <Separator />

              {/* Настройки качества */}
              <div className="space-y-3">
                <Label>Качество рендеринга: {quality}%</Label>
                <Slider
                  value={[quality]}
                  onValueChange={([value]) => onQualityChange(value)}
                  min={25}
                  max={100}
                  step={25}
                  disabled={!isEnabled}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Низкое</span>
                  <span>Среднее</span>
                  <span>Высокое</span>
                  <span>Максимальное</span>
                </div>
              </div>

              <Separator />

              {/* Дополнительная информация */}
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>WebGL2:</span>
                  <span className="text-green-600">Поддерживается</span>
                </div>
                <div className="flex justify-between">
                  <span>GPU ускорение:</span>
                  <span className="text-green-600">Активно</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Компактная версия настроек для интеграции в PlayerControls
 */
export function TransitionPreviewToggle({
  isEnabled,
  onToggle,
  hasActiveTransition,
  className,
}: {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
  hasActiveTransition: boolean
  className?: string
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(!isEnabled)}
            className={cn("h-8 w-8 p-0", hasActiveTransition && isEnabled && "ring-2 ring-primary/50", className)}
          >
            {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled ? "Отключить предпросмотр переходов" : "Включить предпросмотр переходов"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Индикатор статуса предпросмотра переходов
 */
export function TransitionPreviewStatus({
  isEnabled,
  hasActiveTransition,
  transitionName,
  className,
}: {
  isEnabled: boolean
  hasActiveTransition: boolean
  transitionName?: string
  className?: string
}) {
  if (!isEnabled || !hasActiveTransition) return null

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      <span className="text-muted-foreground">Переход:</span>
      <span className="font-medium">{transitionName || "Неизвестный"}</span>
    </div>
  )
}

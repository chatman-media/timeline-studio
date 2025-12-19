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
    <div className={cn("flex items-center gap-2", className)} data-oid="-_c:3_8">
      {/* Быстрые переключатели */}
      <TooltipProvider data-oid="h1lr2fy">
        <Tooltip data-oid="2toc728">
          <TooltipTrigger asChild data-oid="5l12cvc">
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => onEnabledChange(!isEnabled)}
              className="h-8"
              data-oid="r8m:9u9"
            >
              {isEnabled ? (
                <Eye className="h-4 w-4" data-oid="uo.fcxs" />
              ) : (
                <EyeOff className="h-4 w-4" data-oid="7j02caw" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent data-oid="tpt85ib">
            {isEnabled ? "Отключить предпросмотр переходов" : "Включить предпросмотр переходов"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Подробные настройки */}
      <Popover data-oid="f4cc.1c">
        <PopoverTrigger asChild data-oid="f19uyv1">
          <Button variant="outline" size="sm" className="h-8" data-oid="ivdq-q-">
            <Settings className="h-4 w-4" data-oid="06_7k26" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end" data-oid="m:fx0nu">
          <Card className="border-0 shadow-none" data-oid="kt.f2f5">
            <CardHeader className="pb-3" data-oid="nr46421">
              <CardTitle className="text-base" data-oid="uqzqhrt">
                Настройки предпросмотра
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="14:g:tz">
              {/* Основные настройки */}
              <div className="space-y-3" data-oid="lv-gsft">
                <div className="flex items-center justify-between" data-oid="abex7hn">
                  <Label htmlFor={`${id}-enable-preview`} data-oid="k-s4fx3">
                    Включить предпросмотр
                  </Label>
                  <Switch
                    id={`${id}-enable-preview`}
                    checked={isEnabled}
                    onCheckedChange={onEnabledChange}
                    data-oid="4m-5h2r"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="bi8cwyh">
                  <Label htmlFor={`${id}-show-overlay`} data-oid="s859v9y">
                    Показывать информацию
                  </Label>
                  <Switch
                    id={`${id}-show-overlay`}
                    checked={showOverlay}
                    onCheckedChange={onShowOverlayChange}
                    disabled={!isEnabled}
                    data-oid="z-6otuj"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="9pnyzmv">
                  <Label htmlFor={`${id}-show-indicator`} data-oid="-rladd8">
                    Мини-индикатор
                  </Label>
                  <Switch
                    id={`${id}-show-indicator`}
                    checked={showMiniIndicator}
                    onCheckedChange={onShowMiniIndicatorChange}
                    disabled={!isEnabled}
                    data-oid="73p43jb"
                  />
                </div>
              </div>

              <Separator data-oid="oy46j4n" />

              {/* Настройки качества */}
              <div className="space-y-3" data-oid="81zfupg">
                <Label data-oid="fnkkrqf">Качество рендеринга: {quality}%</Label>
                <Slider
                  value={[quality]}
                  onValueChange={([value]) => onQualityChange(value)}
                  min={25}
                  max={100}
                  step={25}
                  disabled={!isEnabled}
                  className="w-full"
                  data-oid="va11e3r"
                />

                <div className="flex justify-between text-xs text-muted-foreground" data-oid="b-:b4qe">
                  <span data-oid="ft70xwl">Низкое</span>
                  <span data-oid="n:oq9-0">Среднее</span>
                  <span data-oid="7n40ueb">Высокое</span>
                  <span data-oid="wpg7fsh">Максимальное</span>
                </div>
              </div>

              <Separator data-oid="wcd9m68" />

              {/* Дополнительная информация */}
              <div className="text-sm text-muted-foreground space-y-1" data-oid="zi2qt6.">
                <div className="flex justify-between" data-oid="m55xvlf">
                  <span data-oid="e3ihd9v">WebGL2:</span>
                  <span className="text-green-600" data-oid="1sf:646">
                    Поддерживается
                  </span>
                </div>
                <div className="flex justify-between" data-oid="aw9a9r_">
                  <span data-oid="1wx.sm9">GPU ускорение:</span>
                  <span className="text-green-600" data-oid="194_hq6">
                    Активно
                  </span>
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
    <TooltipProvider data-oid="zao0:0_">
      <Tooltip data-oid="n:q1.x9">
        <TooltipTrigger asChild data-oid="d:5ue.s">
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(!isEnabled)}
            className={cn("h-8 w-8 p-0", hasActiveTransition && isEnabled && "ring-2 ring-primary/50", className)}
            data-oid="9ut_0t2"
          >
            {isEnabled ? (
              <Eye className="h-4 w-4" data-oid="itbwg0p" />
            ) : (
              <EyeOff className="h-4 w-4" data-oid="qmeuz3h" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent data-oid=":wz0aum">
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
    <div className={cn("flex items-center gap-2 text-sm", className)} data-oid=":5ml4qr">
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" data-oid="ctrz5.j" />
      <span className="text-muted-foreground" data-oid="7wstq_-">
        Переход:
      </span>
      <span className="font-medium" data-oid="3__vlha">
        {transitionName || "Неизвестный"}
      </span>
    </div>
  )
}

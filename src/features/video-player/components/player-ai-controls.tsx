/**
 * Player AI Controls
 * Панель управления AI анализом в плеере
 */

import { Eye, EyeOff, Gauge, Loader2, Play, Settings, Sparkles } from "lucide-react"
import { useId, useState } from "react"

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAIDirectorEvents } from "@timeline-studio/core/hooks/use-ai-director-events"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { usePlayerAIAnalysis } from "../hooks/use-player-ai-analysis"

const logger = createLogger("video-player:player-ai-controls")

interface PlayerAIControlsProps {
  className?: string
}

export function PlayerAIControls({ className }: PlayerAIControlsProps) {
  const aiAnalysis = usePlayerAIAnalysis()
  const { isAnalyzing, frameAnalysisRate } = aiAnalysis.state

  // Подписываемся на события прогресса анализа
  const { lastProgress } = useAIDirectorEvents()
  const analysisProgress = lastProgress?.progress ? Math.round(lastProgress.progress) : 0

  const [showOverlay, setShowOverlay] = useState(true)
  const [showObjects, setShowObjects] = useState(true)
  const [showSceneInfo, setShowSceneInfo] = useState(true)
  const [showMoments, setShowMoments] = useState(true)

  const handleToggleAnalysis = () => {
    if (isAnalyzing) {
      aiAnalysis.stopRealtimeAnalysis()
    } else {
      aiAnalysis.startRealtimeAnalysis()
    }
  }

  const handleFrameRateChange = (value: number[]) => {
    aiAnalysis.setFrameAnalysisRate(value[0])
  }

  const id = useId()

  return (
    <div className={cn("flex items-center gap-2", className)} data-oid="v.31lmm">
      <TooltipProvider data-oid="moy.ui8">
        {/* Основная кнопка AI анализа */}
        <Tooltip data-oid="c6x:3zt">
          <TooltipTrigger asChild data-oid="7grclhd">
            <Button
              variant={isAnalyzing ? "default" : "outline"}
              size="sm"
              onClick={handleToggleAnalysis}
              className={cn("gap-2", isAnalyzing && "bg-blue-600 hover:bg-blue-700")}
              data-oid="u-ux37w"
            >
              <Sparkles className="h-4 w-4" data-oid="9bzc7pd" />
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" data-oid="sx_6r8." />
                  AI Active{analysisProgress > 0 && ` (${analysisProgress}%)`}
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" data-oid="csp3nc." />
                  AI Analysis
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent data-oid="acsrrxw">
            {isAnalyzing ? "Остановить AI анализ" : "Запустить AI анализ"}
          </TooltipContent>
        </Tooltip>

        {/* Настройки AI */}
        <DropdownMenu data-oid="jkexv76">
          <DropdownMenuTrigger asChild data-oid="zm-xyee">
            <Button variant="outline" size="sm" disabled={!isAnalyzing} data-oid="iriu4:k">
              <Settings className="h-4 w-4" data-oid="h7ph7ls" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72" data-oid="dywd3w7">
            <DropdownMenuLabel data-oid="9yceh_5">Настройки AI анализа</DropdownMenuLabel>
            <DropdownMenuSeparator data-oid="vm72nwg" />

            {/* Частота анализа */}
            <div className="p-3 space-y-3" data-oid=".nh4hgq">
              <div className="space-y-2" data-oid="l-:bl2h">
                <div className="flex items-center justify-between" data-oid="-tsbd:l">
                  <Label className="text-sm" data-oid="420z0ch">
                    Частота анализа
                  </Label>
                  <span className="text-sm text-muted-foreground" data-oid="ngxy663">
                    {frameAnalysisRate} FPS
                  </span>
                </div>
                <Slider
                  value={[frameAnalysisRate]}
                  onValueChange={handleFrameRateChange}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full"
                  data-oid="5rsay19"
                />

                <p className="text-xs text-muted-foreground" data-oid="f4bh.5y">
                  Больше FPS = точнее анализ, но выше нагрузка
                </p>
              </div>

              <DropdownMenuSeparator data-oid="t4:cvqm" />

              {/* Настройки отображения */}
              <div className="space-y-2" data-oid="znvzbcw">
                <Label className="text-sm font-medium" data-oid="-qs-0.1">
                  Отображение
                </Label>

                <div className="flex items-center justify-between" data-oid="evh.9nn">
                  <Label htmlFor={`${id}-show-overlay`} className="text-sm font-normal" data-oid="9-xw3w2">
                    Показывать оверлей
                  </Label>
                  <Switch
                    id={`${id}-show-overlay`}
                    checked={showOverlay}
                    onCheckedChange={setShowOverlay}
                    data-oid="zvcowe3"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="oqs1fzu">
                  <Label htmlFor={`${id}-show-objects`} className="text-sm font-normal" data-oid="5ju2mch">
                    Обнаруженные объекты
                  </Label>
                  <Switch
                    id={`${id}-show-objects`}
                    checked={showObjects}
                    onCheckedChange={setShowObjects}
                    disabled={!showOverlay}
                    data-oid="cw6krdt"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="3eq0xt-">
                  <Label htmlFor={`${id}-show-scene`} className="text-sm font-normal" data-oid="ahtdnyq">
                    Информация о сцене
                  </Label>
                  <Switch
                    id={`${id}-show-scene`}
                    checked={showSceneInfo}
                    onCheckedChange={setShowSceneInfo}
                    disabled={!showOverlay}
                    data-oid="3soq4fd"
                  />
                </div>

                <div className="flex items-center justify-between" data-oid="wt5pvzs">
                  <Label htmlFor={`${id}-show-moments`} className="text-sm font-normal" data-oid="yaeyrr.">
                    Ключевые моменты
                  </Label>
                  <Switch
                    id={`${id}-show-moments`}
                    checked={showMoments}
                    onCheckedChange={setShowMoments}
                    disabled={!showOverlay}
                    data-oid="s.w9:33"
                  />
                </div>
              </div>
            </div>

            <DropdownMenuSeparator data-oid="zghzeco" />

            {/* Быстрые действия */}
            <DropdownMenuItem onClick={() => logger.info("Export AI data")} data-oid="ss_nq5q">
              <Gauge className="h-4 w-4 mr-2" data-oid="x5.9wxm" />
              Экспортировать данные анализа
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowOverlay(!showOverlay)} className="md:hidden" data-oid="_3.5m2g">
              {showOverlay ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" data-oid="oxs2di." />
                  Скрыть оверлей
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" data-oid="p_a7rhg" />
                  Показать оверлей
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Быстрое переключение оверлея (для десктопа) */}
        <Tooltip data-oid="jdga6w-">
          <TooltipTrigger asChild data-oid="_0tgzig">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              disabled={!isAnalyzing}
              className="hidden md:flex"
              data-oid="jy7zgrl"
            >
              {showOverlay ? (
                <Eye className="h-4 w-4" data-oid="40yhhm4" />
              ) : (
                <EyeOff className="h-4 w-4" data-oid="o_36syp" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent data-oid="rc.9vah">
            {showOverlay ? "Скрыть AI оверлей" : "Показать AI оверлей"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

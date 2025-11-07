/**
 * Player AI Controls
 * Панель управления AI анализом в плеере
 */

import { Eye, EyeOff, Gauge, Pause, Play, Settings, Sparkles } from "lucide-react"
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
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        {/* Основная кнопка AI анализа */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAnalyzing ? "default" : "outline"}
              size="sm"
              onClick={handleToggleAnalysis}
              className={cn("gap-2", isAnalyzing && "bg-blue-600 hover:bg-blue-700")}
            >
              <Sparkles className="h-4 w-4" />
              {isAnalyzing ? (
                <>
                  <Pause className="h-3 w-3" />
                  AI Active
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  AI Analysis
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isAnalyzing ? "Остановить AI анализ" : "Запустить AI анализ"}</TooltipContent>
        </Tooltip>

        {/* Настройки AI */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!isAnalyzing}>
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Настройки AI анализа</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Частота анализа */}
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Частота анализа</Label>
                  <span className="text-sm text-muted-foreground">{frameAnalysisRate} FPS</span>
                </div>
                <Slider
                  value={[frameAnalysisRate]}
                  onValueChange={handleFrameRateChange}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Больше FPS = точнее анализ, но выше нагрузка</p>
              </div>

              <DropdownMenuSeparator />

              {/* Настройки отображения */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Отображение</Label>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-show-overlay`} className="text-sm font-normal">
                    Показывать оверлей
                  </Label>
                  <Switch id={`${id}-show-overlay`} checked={showOverlay} onCheckedChange={setShowOverlay} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-show-objects`} className="text-sm font-normal">
                    Обнаруженные объекты
                  </Label>
                  <Switch
                    id={`${id}-show-objects`}
                    checked={showObjects}
                    onCheckedChange={setShowObjects}
                    disabled={!showOverlay}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-show-scene`} className="text-sm font-normal">
                    Информация о сцене
                  </Label>
                  <Switch
                    id={`${id}-show-scene`}
                    checked={showSceneInfo}
                    onCheckedChange={setShowSceneInfo}
                    disabled={!showOverlay}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor={`${id}-show-moments`} className="text-sm font-normal">
                    Ключевые моменты
                  </Label>
                  <Switch
                    id={`${id}-show-moments`}
                    checked={showMoments}
                    onCheckedChange={setShowMoments}
                    disabled={!showOverlay}
                  />
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Быстрые действия */}
            <DropdownMenuItem onClick={() => logger.info("Export AI data")}>
              <Gauge className="h-4 w-4 mr-2" />
              Экспортировать данные анализа
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setShowOverlay(!showOverlay)} className="md:hidden">
              {showOverlay ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Скрыть оверлей
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Показать оверлей
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Быстрое переключение оверлея (для десктопа) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverlay(!showOverlay)}
              disabled={!isAnalyzing}
              className="hidden md:flex"
            >
              {showOverlay ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showOverlay ? "Скрыть AI оверлей" : "Показать AI оверлей"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

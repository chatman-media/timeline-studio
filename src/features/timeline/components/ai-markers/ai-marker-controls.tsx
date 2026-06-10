/**
 * AI Marker Controls
 * Компонент для управления созданием маркеров из AI анализа
 */

import { AlertCircle, Bookmark, CheckCircle, Settings, Sparkles, X } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useModals } from "@/core/hooks"
import { createLogger } from "@/lib/tauri-logger"
import { useTimelineAIAnalysis } from "../../hooks/integration/use-timeline-ai-analysis"
import { useTimeline } from "../../hooks/state/use-timeline"
import { type AIMarkerConfig, AIMarkerService } from "../../services/ai-marker-service"

const logger = createLogger("AiMarkerControls")

interface AIMarkerControlsProps {
  className?: string
}

export function AIMarkerControls({ className }: AIMarkerControlsProps) {
  const aiAnalysis = useTimelineAIAnalysis()
  const { send } = useTimeline()
  const { openModal } = useModals()

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    markerCount?: number
  } | null>(null)

  // Конфигурация маркеров
  const [markerConfig, setMarkerConfig] = useState<AIMarkerConfig>({
    createSceneMarkers: true,
    createKeyMomentMarkers: true,
    createQualityMarkers: false,
    createEmotionalMarkers: true,
    minConfidence: 0.7,
    minSceneDuration: 2,
    minQualityScore: 80,
    groupNearbyMarkers: true,
    groupingThreshold: 2,
  })

  const [markerService] = useState(() => new AIMarkerService(markerConfig))

  // Генерация маркеров из текущего анализа
  const generateMarkers = async () => {
    const { sceneAnalysis, keyMoments, insights } = aiAnalysis.state

    if (!sceneAnalysis && keyMoments.length === 0) {
      setLastResult({
        success: false,
        message: "Нет данных анализа. Сначала проанализируйте Timeline.",
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setLastResult(null)

    try {
      markerService.updateConfig(markerConfig)
      let allMarkers: any[] = []

      // Создаем маркеры из сцен
      if (sceneAnalysis && markerConfig.createSceneMarkers) {
        setGenerationProgress(20)
        const sceneMarkers = markerService.createMarkersFromScenes((sceneAnalysis as any).scenes || [])
        allMarkers = [...allMarkers, ...sceneMarkers]
      }

      // Создаем маркеры из ключевых моментов
      if (keyMoments.length > 0 && markerConfig.createKeyMomentMarkers) {
        setGenerationProgress(40)
        const momentMarkers = markerService.createMarkersFromKeyMoments(keyMoments)
        allMarkers = [...allMarkers, ...momentMarkers]
      }

      // Создаем маркеры качества
      if (insights && markerConfig.createQualityMarkers) {
        setGenerationProgress(60)
        const qualityMarkers = markerService.createQualityMarkers(
          insights,
          [0, 30, 60], // Временные метки для примера
        )
        allMarkers = [...allMarkers, ...qualityMarkers]
      }

      // Создаем эмоциональные маркеры
      if (insights && markerConfig.createEmotionalMarkers) {
        setGenerationProgress(80)
        const emotionalMarkers = markerService.createEmotionalMarkers(insights, 15)
        allMarkers = [...allMarkers, ...emotionalMarkers]
      }

      // Группируем близкие маркеры
      if (markerConfig.groupNearbyMarkers && allMarkers.length > 1) {
        setGenerationProgress(90)
        allMarkers = markerService.groupNearbyMarkers(allMarkers)
      }

      // Добавляем маркеры в Timeline
      setGenerationProgress(95)
      allMarkers.forEach((marker) => {
        send({ type: "ADD_MARKER", marker })
      })

      setGenerationProgress(100)
      setLastResult({
        success: true,
        message: `Создано ${allMarkers.length} маркеров`,
        markerCount: allMarkers.length,
      })

      // Скрываем прогресс через 2 секунды
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 2000)
    } catch (error) {
      logger.error("Failed to generate markers:", { error })
      setLastResult({
        success: false,
        message: "Ошибка при создании маркеров",
      })
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Обновление конфигурации
  const updateConfig = (key: keyof AIMarkerConfig, value: any) => {
    setMarkerConfig((prev) => ({ ...prev, [key]: value }))
  }

  const openSettings = () => {
    openModal("ai-marker-settings", {
      config: markerConfig,
      onSave: (updatedConfig: AIMarkerConfig) => {
        setMarkerConfig(updatedConfig)
        markerService.updateConfig(updatedConfig)
      },
    })
  }

  return (
    <TooltipProvider data-oid="tb.5oax">
      <div className={className} data-oid="jw08umo">
        <div className="flex items-center gap-2" data-oid="-bc-tab">
          {/* Основная кнопка генерации */}
          <Tooltip data-oid=":4_5:px">
            <TooltipTrigger asChild data-oid="fihwb9s">
              <Button
                variant="outline"
                size="sm"
                onClick={generateMarkers}
                disabled={isGenerating || aiAnalysis.state.isAnalyzing}
                className="gap-2"
                data-oid="nzr_y19"
              >
                {isGenerating ? (
                  <>
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      data-oid="9o6izee"
                    />
                    Создание...
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" data-oid="_war1qi" />
                    <Sparkles className="h-3 w-3" data-oid="o-nuty_" />
                    AI Маркеры
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="2r64wxc">Создать маркеры из AI анализа</TooltipContent>
          </Tooltip>

          {/* Кнопка настроек */}
          <Tooltip data-oid="hak4c58">
            <TooltipTrigger asChild data-oid="lgap5xi">
              <Button variant="ghost" size="sm" onClick={openSettings} data-oid="nkyylh0">
                <Settings className="h-4 w-4" data-oid="r_:72z_" />
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="ha:oin9">Настройки генерации маркеров</TooltipContent>
          </Tooltip>
        </div>

        {/* Индикатор прогресса */}
        {isGenerating && (
          <div className="mt-2" data-oid="1x5.t6t">
            <Progress value={generationProgress} className="h-1 w-32" data-oid="-i.s-a_" />
          </div>
        )}

        {/* Результат генерации */}
        {lastResult && !isGenerating && (
          <Alert className="mt-2" variant={lastResult.success ? "default" : "destructive"} data-oid="9pmkq:g">
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4" data-oid="auf5cem" />
            ) : (
              <AlertCircle className="h-4 w-4" data-oid="701hhfy" />
            )}
            <AlertDescription className="flex items-center justify-between" data-oid="2rteuhf">
              <span data-oid="_kqa_0.">{lastResult.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLastResult(null)}
                className="h-6 w-6 p-0"
                data-oid="6q-l57p"
              >
                <X className="h-3 w-3" data-oid="j:3wv.5" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </TooltipProvider>
  )
}

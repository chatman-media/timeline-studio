/**
 * Компонент для генерации превью видео для эффектов
 * Используется в Developer Tools для предварительного рендеринга превью всех эффектов
 */

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useEffectPreviewGenerator } from "../hooks/use-effect-preview-generator"
import type { BaseEffect } from "../types"

interface EffectPreviewGeneratorProps {
  effects: BaseEffect[]
}

/**
 * Компонент генератора превью для эффектов
 */
export function EffectPreviewGenerator({ effects }: EffectPreviewGeneratorProps) {
  const { t } = useTranslation()
  const { isGenerating, progress, total, currentEffectId, completed, failed, generatePreviews, cancelGeneration } =
    useEffectPreviewGenerator()

  // Настройки генерации
  const [sourceVideo, setSourceVideo] = useState("/t1.mp4")
  const [duration, setDuration] = useState(3)
  const [quality, setQuality] = useState(75)
  const [outputDir, setOutputDir] = useState("preview-videos/effects")

  /**
   * Запуск генерации превью
   */
  const handleGenerate = useCallback(() => {
    void generatePreviews(effects, {
      sourceVideoPath: sourceVideo,
      duration,
      quality,
      outputDir,
    })
  }, [effects, sourceVideo, duration, quality, outputDir, generatePreviews])

  /**
   * Отмена генерации
   */
  const handleCancel = useCallback(() => {
    cancelGeneration()
  }, [cancelGeneration])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("effects.preview.generator.title", "Effect Preview Generator")}</CardTitle>
        <CardDescription>
          {t(
            "effects.preview.generator.description",
            "Generate preview videos for all effects using the prerender system",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Статистика */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">{t("effects.preview.generator.totalEffects", "Total Effects")}</div>
            <div className="text-2xl font-bold">{effects.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t("effects.preview.generator.completed", "Completed")}</div>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t("effects.preview.generator.failed", "Failed")}</div>
            <div className="text-2xl font-bold text-red-600">{failed}</div>
          </div>
          <div>
            <div className="text-muted-foreground">{t("effects.preview.generator.progress", "Progress")}</div>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
          </div>
        </div>

        {/* Прогресс бар */}
        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {currentEffectId && (
                <>
                  {t("effects.preview.generator.current", "Current")}: {currentEffectId}
                </>
              )}
            </div>
          </div>
        )}

        {/* Настройки генерации */}
        {!isGenerating && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceVideo">{t("effects.preview.generator.sourceVideo", "Source Video")}</Label>
              <Input
                id="sourceVideo"
                type="text"
                value={sourceVideo}
                onChange={(e) => setSourceVideo(e.target.value)}
                placeholder="/t1.mp4"
              />
              <p className="text-xs text-muted-foreground">
                {t("effects.preview.generator.sourceVideoHelp", "Path to the video file to apply effects to")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">{t("effects.preview.generator.duration", "Duration (seconds)")}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={10}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">{t("effects.preview.generator.quality", "Quality (0-100)")}</Label>
                <Input
                  id="quality"
                  type="number"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputDir">{t("effects.preview.generator.outputDir", "Output Directory")}</Label>
                <Input
                  id="outputDir"
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="preview-videos/effects"
                />
              </div>
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-2">
          {!isGenerating ? (
            <Button onClick={handleGenerate} className="w-full">
              {t("effects.preview.generator.generate", "Generate Previews")}
            </Button>
          ) : (
            <Button onClick={handleCancel} variant="destructive" className="w-full">
              {t("effects.preview.generator.cancel", "Cancel Generation")}
            </Button>
          )}
        </div>

        {/* Информация */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            {t(
              "effects.preview.generator.info1",
              "This will generate preview videos for all effects using the Rust prerender backend.",
            )}
          </p>
          <p>
            {t(
              "effects.preview.generator.info2",
              "Generated videos will be saved to the output directory and used for effect previews.",
            )}
          </p>
          <p className="text-yellow-600">
            {t(
              "effects.preview.generator.warning",
              "Warning: This process may take several minutes depending on the number of effects.",
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

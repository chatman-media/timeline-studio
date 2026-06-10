/**
 * Компонент для генерации превью видео для эффектов
 * Используется в Developer Tools для предварительного рендеринга превью всех эффектов
 */

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
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
    <Card data-oid="uvrhjyz">
      <CardHeader data-oid="zqkrjy1">
        <CardTitle data-oid="2q.qtqw">{t("effects.preview.generator.title", "Effect Preview Generator")}</CardTitle>
        <CardDescription data-oid="9_lcx2g">
          {t(
            "effects.preview.generator.description",
            "Generate preview videos for all effects using the prerender system",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="-if_8x9">
        {/* Статистика */}
        <div className="grid grid-cols-4 gap-4 text-sm" data-oid="dee2ikb">
          <div data-oid="m-1244m">
            <div className="text-muted-foreground" data-oid="kx77_fu">
              {t("effects.preview.generator.totalEffects", "Total Effects")}
            </div>
            <div className="text-2xl font-bold" data-oid="8to10fq">
              {effects.length}
            </div>
          </div>
          <div data-oid="88314di">
            <div className="text-muted-foreground" data-oid="zv1bovt">
              {t("effects.preview.generator.completed", "Completed")}
            </div>
            <div className="text-2xl font-bold text-green-600" data-oid="lroejse">
              {completed}
            </div>
          </div>
          <div data-oid="91qj36_">
            <div className="text-muted-foreground" data-oid="h91tzvt">
              {t("effects.preview.generator.failed", "Failed")}
            </div>
            <div className="text-2xl font-bold text-red-600" data-oid="8el-.i5">
              {failed}
            </div>
          </div>
          <div data-oid="zbwbpcn">
            <div className="text-muted-foreground" data-oid="itf9qi9">
              {t("effects.preview.generator.progress", "Progress")}
            </div>
            <div className="text-2xl font-bold" data-oid="dql1e0l">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        {/* Прогресс бар */}
        {isGenerating && (
          <div className="space-y-2" data-oid="hf4jmx.">
            <Progress value={progress} className="w-full" data-oid="98o47:9" />
            <div className="text-sm text-muted-foreground" data-oid="s74p9:a">
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
          <div className="space-y-4" data-oid="mz:x9yp">
            <div className="space-y-2" data-oid="6fixxwr">
              <Label htmlFor="sourceVideo" data-oid="z-18auv">
                {t("effects.preview.generator.sourceVideo", "Source Video")}
              </Label>
              <Input
                id="sourceVideo"
                type="text"
                value={sourceVideo}
                onChange={(e) => setSourceVideo(e.target.value)}
                placeholder="/t1.mp4"
                data-oid="7:w4x7_"
              />

              <p className="text-xs text-muted-foreground" data-oid=":fjmb8q">
                {t("effects.preview.generator.sourceVideoHelp", "Path to the video file to apply effects to")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4" data-oid="h0nu4we">
              <div className="space-y-2" data-oid="j9w5fc:">
                <Label htmlFor="duration" data-oid="vw3nxnb">
                  {t("effects.preview.generator.duration", "Duration (seconds)")}
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={10}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  data-oid="p_uyrs2"
                />
              </div>

              <div className="space-y-2" data-oid="6xhh3.4">
                <Label htmlFor="quality" data-oid="brzqxvz">
                  {t("effects.preview.generator.quality", "Quality (0-100)")}
                </Label>
                <Input
                  id="quality"
                  type="number"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  data-oid="597589d"
                />
              </div>

              <div className="space-y-2" data-oid="etu4xwn">
                <Label htmlFor="outputDir" data-oid="35011rl">
                  {t("effects.preview.generator.outputDir", "Output Directory")}
                </Label>
                <Input
                  id="outputDir"
                  type="text"
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="preview-videos/effects"
                  data-oid="c3kjy5:"
                />
              </div>
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-2" data-oid="fxgie:3">
          {!isGenerating ? (
            <Button onClick={handleGenerate} className="w-full" data-oid=":dmazk7">
              {t("effects.preview.generator.generate", "Generate Previews")}
            </Button>
          ) : (
            <Button onClick={handleCancel} variant="destructive" className="w-full" data-oid="gi996-h">
              {t("effects.preview.generator.cancel", "Cancel Generation")}
            </Button>
          )}
        </div>

        {/* Информация */}
        <div className="text-xs text-muted-foreground space-y-1" data-oid="e.e7i6:">
          <p data-oid="rqk6hey">
            {t(
              "effects.preview.generator.info1",
              "This will generate preview videos for all effects using the Rust prerender backend.",
            )}
          </p>
          <p data-oid="i2ypl2t">
            {t(
              "effects.preview.generator.info2",
              "Generated videos will be saved to the output directory and used for effect previews.",
            )}
          </p>
          <p className="text-yellow-600" data-oid="xg69ap-">
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

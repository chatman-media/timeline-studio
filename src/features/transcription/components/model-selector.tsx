import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Progress } from "@timeline-studio/ui/components/progress"
import { CheckCircle, Download, HardDrive, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useWhisperModels } from "../hooks/use-transcription"

export function ModelSelector() {
  const { t } = useTranslation()
  const { models, isLoading, downloadProgress, loadModels, downloadModel } = useWhisperModels()

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const getModelDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      tiny: "Самая быстрая, базовое качество",
      "tiny.en": "Самая быстрая, только английский",
      base: "Хороший баланс скорости и качества",
      "base.en": "Хороший баланс, только английский",
      small: "Улучшенное качество",
      "small.en": "Улучшенное качество, только английский",
      medium: "Высокое качество",
      "medium.en": "Высокое качество, только английский",
      "large-v1": "Превосходное качество (v1)",
      "large-v2": "Превосходное качество (v2)",
      "large-v3": "Лучшее качество (последняя версия)",
    }
    return descriptions[name] || ""
  }

  const formatSize = (size: string): string => {
    // Размер уже отформатирован (например, "39M", "1.5G")
    return size
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-oid="l.-2z1i">
        <Loader2 className="h-6 w-6 animate-spin" data-oid="a_-ywy." />
      </div>
    )
  }

  return (
    <div className="space-y-4" data-oid="_.9aue:">
      <div className="text-sm text-muted-foreground" data-oid="bogt-4l">
        {t("transcription.modelsDescription", "Скачайте модели для локальной транскрипции")}
      </div>

      <div className="space-y-2" data-oid="8v47:e5">
        {models.map((model) => {
          const isDownloading = downloadProgress[model.name] !== undefined
          const progress = downloadProgress[model.name] || 0

          return (
            <div
              key={model.name}
              className="flex items-center justify-between p-3 rounded-lg border"
              data-oid="41_2dz1"
            >
              <div className="flex-1 space-y-1" data-oid="n09pdxm">
                <div className="flex items-center gap-2" data-oid="f03mfbd">
                  <h4 className="font-medium" data-oid="2ba61-5">
                    {model.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs" data-oid="ewmhigf">
                    {formatSize(model.size)}
                  </Badge>
                  {model.englishOnly && (
                    <Badge variant="outline" className="text-xs" data-oid="im-f:3e">
                      EN only
                    </Badge>
                  )}
                  {model.isDownloaded && <CheckCircle className="h-4 w-4 text-green-500" data-oid="t1if1lv" />}
                </div>
                <p className="text-sm text-muted-foreground" data-oid="xwubygh">
                  {getModelDescription(model.name)}
                </p>
                {isDownloading && <Progress value={progress} className="h-2" data-oid="sfzbwhc" />}
              </div>

              <div className="ml-4" data-oid="w9:h_3n">
                {model.isDownloaded ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground" data-oid="8h80dmv">
                    <HardDrive className="h-4 w-4" data-oid="3_aeh3-" />
                    {t("transcription.downloaded", "Скачано")}
                  </div>
                ) : isDownloading ? (
                  <div className="flex items-center gap-2" data-oid="-4v0a6:">
                    <Loader2 className="h-4 w-4 animate-spin" data-oid="d46._oa" />
                    <span className="text-sm" data-oid="gsbn56a">
                      {Math.round(progress)}%
                    </span>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => downloadModel(model.name)} data-oid="le0p6gd">
                    <Download className="mr-2 h-4 w-4" data-oid="mjdup4z" />
                    {t("transcription.download", "Скачать")}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg bg-muted p-3" data-oid="rrd2xk7">
        <p className="text-sm text-muted-foreground" data-oid="rfhhtm1">
          <strong data-oid="1vc17gi">{t("transcription.tip", "Совет")}:</strong>{" "}
          {t(
            "transcription.modelTip",
            "Для большинства задач модель 'base' обеспечивает хороший баланс между скоростью и качеством. Используйте 'large' модели для максимальной точности.",
          )}
        </p>
      </div>
    </div>
  )
}

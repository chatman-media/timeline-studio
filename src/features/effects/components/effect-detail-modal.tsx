import { Download, Pause, Play, RotateCcw, SplitSquareHorizontal, X } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/features/modals/services"
import { createLogger } from "@/lib/tauri-logger"
import type { BaseEffect } from "../types"
import { prepareEffectForExport, saveUserEffect } from "../utils/user-effects"
import { EffectComparison } from "./effect-comparison"
import { EffectIndicators } from "./effect-indicators"
import { EffectParameterControls } from "./effect-parameter-controls"
import { EffectPresets } from "./effect-presets"
import { EffectPreview } from "./effect-preview"

const logger = createLogger("EffectDetailModal")

/**
 * Компонент для детального просмотра эффекта с возможностью настройки параметров
 */
export function EffectDetailModal() {
  const { modalData, closeModal } = useModal()
  const { effect, onApplyEffect } = (modalData as { effect?: BaseEffect; onApplyEffect?: any }) || {}

  const { i18n, t } = useTranslation()
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentParameters, setCurrentParameters] = useState<Record<string, number>>({})
  const [previewKey, setPreviewKey] = useState(0) // Для обновления превью
  const currentLang = i18n.language as "ru" | "en"

  // Helper функция для получения FFmpeg команды
  const getEffectFFmpegCommand = (effect: BaseEffect, params: Record<string, number> = {}) => {
    if (!effect.processors?.ffmpeg) return "FFmpeg processor not available"

    // Преобразуем parameters массив в объект значений по умолчанию
    const defaultParams = effect.parameters.reduce<Record<string, any>>((acc, param) => {
      acc[param.id] = param.defaultValue
      return acc
    }, {})

    const mergedParams = { ...defaultParams, ...params }
    return effect.processors.ffmpeg.filter(mergedParams)
  }

  // Обработчик применения пресета
  const handleApplyPreset = useCallback((presetName: string, params: Record<string, number>) => {
    setSelectedPreset(presetName)
    setCurrentParameters(params)
    setPreviewKey((prev) => prev + 1) // Обновляем превью
  }, [])

  // Обработчик изменения параметров
  const handleParametersChange = useCallback(
    (params: Record<string, number>) => {
      setCurrentParameters(params)
      setPreviewKey((prev) => prev + 1) // Обновляем превью
      // Сбрасываем выбранный пресет при ручном изменении
      if (selectedPreset) {
        setSelectedPreset(undefined)
      }
    },
    [selectedPreset],
  )

  // Обработчик сохранения пользовательского пресета
  const handleSavePreset = useCallback(
    (name: string, params: Record<string, number>) => {
      try {
        // Получаем существующие пресеты для этого эффекта
        const storageKey = `effect_presets_${effect?.id}`
        const existingPresets = localStorage.getItem(storageKey)
        const presets = existingPresets ? JSON.parse(existingPresets) : {}

        // Добавляем новый пресет
        const presetId = `custom_${Date.now()}`
        presets[presetId] = {
          name: {
            [currentLang]: name,
            en: name, // fallback
          },
          params,
          description: {
            [currentLang]: t("effects.customPreset", "Пользовательский пресет"),
            en: "Custom preset",
          },
          createdAt: new Date().toISOString(),
        }

        // Сохраняем обратно в localStorage
        localStorage.setItem(storageKey, JSON.stringify(presets))

        // Уведомляем пользователя об успешном сохранении
        logger.info("Custom preset saved:", { name, params })

        // Обновляем состояние компонента, если нужно показать новый пресет
        // Можно добавить toast уведомление здесь
      } catch (error) {
        logger.error("Error saving custom preset:", error)
      }
    },
    [effect?.id, currentLang, t],
  )

  // Обработчик применения эффекта
  const handleApplyEffect = useCallback(() => {
    if (onApplyEffect) {
      onApplyEffect(effect!, selectedPreset, currentParameters)
    }
    closeModal()
  }, [effect, selectedPreset, currentParameters, onApplyEffect, closeModal])

  // Обработчик сброса параметров
  const handleReset = useCallback(() => {
    setSelectedPreset(undefined)
    setCurrentParameters({})
    setPreviewKey((prev) => prev + 1)
  }, [])

  // Обработчик экспорта эффекта
  const handleExportEffect = useCallback(async () => {
    try {
      const exportName = prompt(t("effects.enterExportName", "Введите название файла для экспорта:"))
      if (!exportName) return

      const effectToExport = prepareEffectForExport(
        effect!,
        Object.keys(currentParameters).length > 0 ? currentParameters : undefined,
        selectedPreset,
      )

      const filePath = await saveUserEffect(effectToExport, exportName)
      logger.info("Effect exported to:", { filePath })

      // Можем добавить toast уведомление об успешном экспорте
    } catch (error) {
      logger.error("Error exporting effect:", error)
    }
  }, [effect, currentParameters, selectedPreset, t])

  // Ранний возврат, если эффект не передан
  if (!effect) return null

  const typedEffect = effect

  return (
    <div className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span>{typedEffect?.name[currentLang] ?? typedEffect?.name?.en ?? "Unnamed effect"}</span>
          <EffectIndicators effect={typedEffect} size="md" />
        </div>
        <Button variant="ghost" size="sm" onClick={closeModal}>
          <X size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левая колонка - Превью */}
        <div className="space-y-4">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">{t("effects.preview", "Превью")}</TabsTrigger>
              <TabsTrigger value="comparison">
                <SplitSquareHorizontal size={16} className="mr-2" />
                {t("effects.comparison", "Сравнение")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <EffectPreview
                  key={previewKey} // Обновляем превью при изменении параметров
                  effect={typedEffect}
                  onClick={() => setIsPlaying(!isPlaying)}
                  size={400}
                  customParams={currentParameters} // Передаем текущие параметры
                />

                {/* Контролы воспроизведения */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <Button variant="secondary" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReset}
                    title={t("effects.detail.resetToDefault", "Сбросить к значениям по умолчанию")}
                  >
                    <RotateCcw size={16} />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-4">
              <EffectComparison effect={typedEffect} customParams={currentParameters} width={400} height={300} />
            </TabsContent>
          </Tabs>

          {/* Информация об эффекте */}
          <div className="space-y-2">
            <h3 className="font-medium">{t("effects.detail.description", "Описание")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {typedEffect?.description?.[currentLang] || typedEffect?.description?.en}
            </p>
          </div>

          {/* Категория и теги */}
          <div className="space-y-2">
            <h3 className="font-medium">{t("effects.detail.category", "Категория")}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                {typedEffect?.category}
              </span>
              {typedEffect?.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка - Настройки */}
        <div className="space-y-4">
          {/* Пресеты */}
          <EffectPresets effect={typedEffect} onApplyPreset={handleApplyPreset} selectedPreset={selectedPreset} />

          {/* Интерактивные контролы параметров */}
          <EffectParameterControls
            effect={typedEffect}
            onParametersChange={handleParametersChange}
            selectedPreset={selectedPreset}
            onSavePreset={handleSavePreset}
          />

          {/* FFmpeg команда */}
          <div className="space-y-2">
            <h3 className="font-medium">{t("effects.detail.ffmpegCommand", "FFmpeg команда")}</h3>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
              {typedEffect ? getEffectFFmpegCommand(typedEffect, currentParameters) : "No effect selected"}
            </div>
          </div>

          <Separator />

          {/* Кнопки действий */}
          <div className="flex gap-2">
            <Button onClick={handleApplyEffect} className="flex-1">
              {t("effects.detail.applyEffect", "Применить эффект")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleExportEffect}
              title={t("effects.detail.exportEffect", "Экспортировать эффект")}
            >
              <Download size={16} />
            </Button>
            <Button variant="outline" onClick={closeModal}>
              {t("common.cancel", "Отмена")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

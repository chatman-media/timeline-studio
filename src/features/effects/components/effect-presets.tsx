import { ChevronDown, ChevronRight, Settings, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { EffectPreset, VideoEffect } from "@/features/effects/types"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("EffectPresets")

interface EffectPresetsProps {
  effect: VideoEffect
  onApplyPreset: (presetName: string, parameters: Record<string, any>) => void
  selectedPreset?: string
}

interface CustomPreset extends Omit<EffectPreset, "createdAt"> {
  createdAt?: string | Date
}

/**
 * Компонент для отображения и выбора пресетов эффекта
 */
export function EffectPresets({ effect, onApplyPreset, selectedPreset }: EffectPresetsProps) {
  const { i18n, t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([])
  const currentLang = i18n.language as "ru" | "en"

  // Загружаем пользовательские пресеты из localStorage
  useEffect(() => {
    try {
      const storageKey = `effect_presets_${effect.id}`
      const savedPresets = localStorage.getItem(storageKey)
      if (savedPresets) {
        try {
          const parsed = JSON.parse(savedPresets)
          // Поддержка старого формата (объект) и нового (массив)
          if (Array.isArray(parsed)) {
            setCustomPresets(parsed)
          } else {
            // Конвертируем старый формат в новый
            const converted = Object.entries(parsed).map(([key, preset]: [string, any]) => ({
              ...preset,
              id: key,
            }))
            setCustomPresets(converted)
          }
        } catch (parseError) {
          void logger.error("Error parsing custom presets", { error: parseError })
        }
      }
    } catch (storageError) {
      void logger.error("Error accessing localStorage", { error: storageError })
    }
  }, [effect.id])

  // Объединяем встроенные и пользовательские пресеты
  const allPresets = useMemo(() => {
    const combined: CustomPreset[] = []

    // Сначала добавляем встроенные пресеты
    if (effect.presets && Array.isArray(effect.presets)) {
      combined.push(
        ...effect.presets.map((preset) => ({
          ...preset,
          createdAt: undefined, // Встроенные пресеты не имеют времени создания
        })),
      )
    }

    // Затем добавляем пользовательские пресеты
    combined.push(...customPresets)

    return combined
  }, [effect.presets, customPresets])

  // Обработчик удаления пользовательского пресета
  const handleDeleteCustomPreset = (presetId: string) => {
    const updatedPresets = customPresets.filter((preset) => preset.id !== presetId)
    setCustomPresets(updatedPresets)

    // Сохраняем обновленные пресеты в localStorage
    const storageKey = `effect_presets_${effect.id}`
    if (updatedPresets.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(updatedPresets))
    } else {
      localStorage.removeItem(storageKey)
    }
  }

  if (allPresets.length === 0) {
    return null
  }

  return (
    <div className="border rounded-lg">
      {/* Заголовок с кнопкой разворачивания */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Settings size={16} />
          <span className="text-sm font-medium">{t("effects.detail.presets", "Пресеты")}</span>
          <span className="text-xs text-gray-500">({allPresets.length})</span>
        </div>
      </button>

      {/* Список пресетов */}
      {isExpanded && (
        <div className="border-t p-2 space-y-2">
          {allPresets.map((preset) => {
            const isCustom = preset.isUserPreset || preset.createdAt !== undefined

            return (
              <div key={preset.id} className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          size="sm"
                          className="flex-1 justify-start text-left h-auto py-2"
                          onClick={() => onApplyPreset(preset.id, preset.parameters)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {preset.name[currentLang] || preset.name.en}
                              {isCustom && (
                                <span className="ml-2 text-xs text-blue-500">
                                  {t("effects.customPreset", "Пользовательский")}
                                </span>
                              )}
                            </span>
                            {preset.description && (
                              <span className="text-xs text-gray-500 font-normal">
                                {preset.description[currentLang] || preset.description.en}
                              </span>
                            )}
                          </div>
                        </Button>
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => handleDeleteCustomPreset(preset.id)}
                            title={t("effects.deletePreset", "Удалить пресет")}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-medium">{preset.name[currentLang] || preset.name.en}</div>
                        {preset.description && (
                          <div className="text-sm">{preset.description[currentLang] || preset.description.en}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {t("effects.detail.parameters", "Параметры")}:{" "}
                          {preset.parameters
                            ? Object.entries(preset.parameters)
                                .map(([key, value]) => `${key}: ${String(value)}`)
                                .join(", ")
                            : t("effects.noParameters", "Нет параметров")}
                        </div>
                        {isCustom && preset.createdAt && (
                          <div className="text-xs text-gray-400">
                            {t("effects.createdAt", "Создано")}:{" "}
                            {typeof preset.createdAt === "string"
                              ? new Date(preset.createdAt).toLocaleDateString()
                              : preset.createdAt.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

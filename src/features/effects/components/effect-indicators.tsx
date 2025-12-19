import { useTranslation } from "react-i18next"

import type { VideoEffect } from "@/features/effects/types"

interface EffectIndicatorsProps {
  effect: VideoEffect
  size?: "sm" | "md"
}

/**
 * Компонент для отображения индикаторов эффекта (сложность, теги)
 * Цветовой кружок сложности слева + текстовые индикаторы тегов
 */
export function EffectIndicators({ effect, size = "sm" }: EffectIndicatorsProps) {
  const { t } = useTranslation()
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]"
  const padding = size === "sm" ? "px-1 py-0.5" : "px-1.5 py-0.5"
  const gap = size === "sm" ? "gap-1" : "gap-1.5"

  // Проверяем наличие новых полей для обратной совместимости
  const tags = effect.tags || []

  // Получаем аббревиатуру для категории эффекта
  const getCategoryAbbreviation = (category: string) => {
    switch (category) {
      case "color-correction":
        return "CC"
      case "artistic":
        return "ART"
      case "vintage":
        return "VIN"
      case "cinematic":
        return "CIN"
      case "creative":
        return "CRE"
      case "technical":
        return "TEC"
      case "motion":
        return "MOT"
      case "distortion":
        return "DIS"
      default:
        return "EFF"
    }
  }

  return (
    <div className={`flex items-center ${gap}`} data-oid="i.kdal4">
      {/* Индикатор категории */}
      <div
        className={`bg-black/70 text-white font-medium ${textSize} ${padding} rounded-xs`}
        title={t(`effects.categories.${effect.category}`)}
        data-oid="8kqv90s"
      >
        {getCategoryAbbreviation(effect.category)}
      </div>

      {/* Индикаторы тегов - только самые важные */}
      {tags.includes("popular") && (
        <div className={`bg-black/70 text-white font-medium ${textSize} ${padding} rounded-xs`} data-oid="s:p3o0x">
          <span data-oid="j2-d142">POP</span>
        </div>
      )}
      {tags.includes("professional") && (
        <div className={`bg-black/70 text-white font-medium ${textSize} ${padding} rounded-xs`} data-oid="ehorv34">
          <span data-oid="d:vjkb:">PRO</span>
        </div>
      )}
      {tags.includes("experimental") && (
        <div className={`bg-black/70 text-white font-medium ${textSize} ${padding} rounded-xs`} data-oid="f:5e_i_">
          <span data-oid="t38yh5r">EXP</span>
        </div>
      )}
    </div>
  )
}

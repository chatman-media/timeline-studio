import type React from "react"

import { ContentGroup } from "@/features/browser/components/content-group"
import type { BaseEffect } from "@/features/effects/types"

import { EffectPreview } from "./effect-preview"

/**
 * Интерфейс свойств компонента EffectGroup
 */
interface EffectGroupProps {
  /** Заголовок группы */
  title: string
  /** Эффекты в группе */
  effects: BaseEffect[]
  /** Размер превью */
  previewSize: number
  /** Ширина превью */
  previewWidth: number
  /** Высота превью */
  previewHeight: number
  /** Функция для клика по эффекту */
  onEffectClick: (effect: BaseEffect, index: number) => void
  /** Функция для добавления всех эффектов группы */
  onAddAllEffects?: (effects: BaseEffect[]) => void
  /** Map для refs элементов */
  effectRefs?: React.RefObject<Map<string, HTMLElement>>
  /** Начальный индекс эффектов в общем списке */
  startIndex?: number
}

/**
 * Компонент для отображения группы эффектов
 *
 * @param {EffectGroupProps} props - Свойства компонента
 * @returns {JSX.Element | null} Компонент группы эффектов или null, если группа пуста
 */
export const EffectGroup: React.FC<EffectGroupProps> = ({
  title,
  effects,
  previewSize,
  previewWidth,
  previewHeight,
  onEffectClick,
  onAddAllEffects,
  effectRefs,
  startIndex = 0,
}) => {
  // Функция рендеринга эффекта
  const renderEffect = (effect: BaseEffect, index: number) => {
    const actualIndex = startIndex + index

    return (
      <button
        key={effect.id}
        ref={(el) => {
          if (el && effectRefs) {
            effectRefs.current.set(effect.id, el)
          }
        }}
        type="button"
        aria-label={`${effect.name.en || effect.name.ru} effect`}
        className="focus:outline-none focus:ring-2 focus:ring-primary rounded-sm p-0 border-0 bg-transparent"
        onClick={() => onEffectClick(effect, actualIndex)}
        data-oid=":9_3__u"
      >
        <EffectPreview
          effect={effect}
          onClick={() => onEffectClick(effect, actualIndex)}
          size={previewSize}
          width={previewWidth}
          height={previewHeight}
          data-oid="69pok:8"
        />
      </button>
    )
  }

  return (
    <ContentGroup
      title={title}
      items={effects}
      viewMode="thumbnails"
      renderItem={renderEffect}
      onAddAll={onAddAllEffects}
      addButtonText="effects.add"
      itemsContainerClassName="grid gap-2"
      itemsContainerStyle={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${previewWidth}px, 1fr))`,
      }}
      data-oid="kyzky0:"
    />
  )
}

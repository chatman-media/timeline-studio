import { useTranslation } from "react-i18next"

import type { MediaFile } from "@/domains/media-management"
import type { Transition } from "@/features/transitions/types/transitions"

import { TransitionPreview } from "./transition-preview"

interface TransitionGroupProps {
  title: string
  transitions: Transition[]
  previewSize: number
  previewWidth: number
  previewHeight: number
  demoVideos: {
    source: MediaFile
    target: MediaFile
  }
  onTransitionClick: (transition: Transition) => void
}

/**
 * Компонент для отображения группы переходов
 * Показывает заголовок группы и сетку переходов
 */
export function TransitionGroup({
  title,
  transitions,
  previewSize,
  previewWidth,
  previewHeight,
  demoVideos,
  onTransitionClick,
}: TransitionGroupProps) {
  const { t } = useTranslation()

  if (transitions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Заголовок группы (если есть) */}
      {title && <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>}

      {/* Сетка переходов */}
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
        style={{ "--preview-size": `${previewWidth}px` } as React.CSSProperties}
      >
        {transitions.map((transition) => (
          <TransitionPreview
            key={transition.id}
            transition={transition}
            sourceVideo={demoVideos.source}
            targetVideo={demoVideos.target}
            transitionType={transition.type}
            onClick={() => onTransitionClick(transition)}
            size={previewSize}
            previewWidth={previewWidth}
            previewHeight={previewHeight}
          />
        ))}
      </div>
    </div>
  )
}

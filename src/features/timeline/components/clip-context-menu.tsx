/**
 * ClipContextMenu - Контекстное меню для клипа на Timeline
 */

import { Copy, Film, Layers, Scissors, Settings2, Trash2, Volume2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { useTimeline } from "../hooks/state/use-timeline"
import type { TimelineClip } from "../types"

interface ClipContextMenuProps {
  clip: TimelineClip
  children: React.ReactNode
  onShowEffects?: () => void
  onShowTransitions?: () => void
  onShowFilters?: () => void
}

export function ClipContextMenu({
  clip,
  children,
  onShowEffects,
  onShowTransitions,
  onShowFilters,
}: ClipContextMenuProps) {
  const { t } = useTranslation()
  const { send, copySelection, cutSelection } = useTimeline()

  const handleCopy = () => {
    // Выделяем клип если он не выделен
    if (!clip.isSelected) {
      send({
        type: "SELECT_CLIPS",
        clipIds: [clip.id],
        addToSelection: false,
      })
    }
    copySelection()
  }

  const handleCut = () => {
    // Выделяем клип если он не выделен
    if (!clip.isSelected) {
      send({
        type: "SELECT_CLIPS",
        clipIds: [clip.id],
        addToSelection: false,
      })
    }
    cutSelection()
  }

  const handleSplit = () => {
    // Разделяем клип в середине
    const splitTime = clip.startTime + clip.duration / 2
    send({
      type: "SPLIT_CLIP",
      clipId: clip.id,
      splitTime: splitTime,
    })
  }

  const handleDelete = () => {
    send({
      type: "DELETE_CLIP",
      clipId: clip.id,
    })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          {t("timeline.clip.copy", "Копировать")}
          <span className="ml-auto text-xs">Ctrl+C</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleCut}>
          <Copy className="mr-2 h-4 w-4" />
          {t("timeline.clip.cut", "Вырезать")}
          <span className="ml-auto text-xs">Ctrl+X</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleSplit}>
          <Scissors className="mr-2 h-4 w-4" />
          {t("timeline.clip.split", "Разделить")}
          <span className="ml-auto text-xs">S</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Settings2 className="mr-2 h-4 w-4" />
            {t("timeline.clip.properties", "Свойства")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={onShowEffects}>
              <Layers className="mr-2 h-4 w-4" />
              {t("timeline.clip.effects", "Эффекты")}
              {clip.effects && clip.effects.length > 0 && (
                <span className="ml-auto text-xs">{clip.effects.length}</span>
              )}
            </ContextMenuItem>

            <ContextMenuItem onClick={onShowTransitions}>
              <Film className="mr-2 h-4 w-4" />
              {t("timeline.clip.transitions", "Переходы")}
              {clip.transitions && clip.transitions.length > 0 && (
                <span className="ml-auto text-xs">{clip.transitions.length}</span>
              )}
            </ContextMenuItem>

            <ContextMenuItem onClick={onShowFilters}>
              <Settings2 className="mr-2 h-4 w-4" />
              {t("timeline.clip.filters", "Фильтры")}
              {clip.filters && clip.filters.length > 0 && (
                <span className="ml-auto text-xs">{clip.filters.length}</span>
              )}
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem>
              <Volume2 className="mr-2 h-4 w-4" />
              {t("timeline.clip.volume", "Громкость")}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("timeline.clip.delete", "Удалить")}
          <span className="ml-auto text-xs">Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

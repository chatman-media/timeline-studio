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
    <ContextMenu data-oid=".r6dm3e">
      <ContextMenuTrigger asChild data-oid="vkx0rh8">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64" data-oid="r1u-q5m">
        <ContextMenuItem onClick={handleCopy} data-oid="i-0h_an">
          <Copy className="mr-2 h-4 w-4" data-oid="m7fl.-z" />
          {t("timeline.clip.copy", "Копировать")}
          <span className="ml-auto text-xs" data-oid="thjm-ph">
            Ctrl+C
          </span>
        </ContextMenuItem>

        <ContextMenuItem onClick={handleCut} data-oid="5cbbm2y">
          <Copy className="mr-2 h-4 w-4" data-oid="l6etwi9" />
          {t("timeline.clip.cut", "Вырезать")}
          <span className="ml-auto text-xs" data-oid="7_vraev">
            Ctrl+X
          </span>
        </ContextMenuItem>

        <ContextMenuSeparator data-oid="likl_xb" />

        <ContextMenuItem onClick={handleSplit} data-oid="ag--w3:">
          <Scissors className="mr-2 h-4 w-4" data-oid="rbjvwo1" />
          {t("timeline.clip.split", "Разделить")}
          <span className="ml-auto text-xs" data-oid="77ukdyy">
            S
          </span>
        </ContextMenuItem>

        <ContextMenuSeparator data-oid="w4z5773" />

        <ContextMenuSub data-oid="7q.07mp">
          <ContextMenuSubTrigger data-oid="dvdkbef">
            <Settings2 className="mr-2 h-4 w-4" data-oid="09e1_1i" />
            {t("timeline.clip.properties", "Свойства")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48" data-oid="_3szf64">
            <ContextMenuItem onClick={onShowEffects} data-oid="atyw6m4">
              <Layers className="mr-2 h-4 w-4" data-oid="caih7p:" />
              {t("timeline.clip.effects", "Эффекты")}
              {clip.effects && clip.effects.length > 0 && (
                <span className="ml-auto text-xs" data-oid=".vuz5vc">
                  {clip.effects.length}
                </span>
              )}
            </ContextMenuItem>

            <ContextMenuItem onClick={onShowTransitions} data-oid=".v-ixhe">
              <Film className="mr-2 h-4 w-4" data-oid="gsm7a7t" />
              {t("timeline.clip.transitions", "Переходы")}
              {clip.transitions && clip.transitions.length > 0 && (
                <span className="ml-auto text-xs" data-oid="43jahjc">
                  {clip.transitions.length}
                </span>
              )}
            </ContextMenuItem>

            <ContextMenuItem onClick={onShowFilters} data-oid="p1j3x:e">
              <Settings2 className="mr-2 h-4 w-4" data-oid=":._8-pu" />
              {t("timeline.clip.filters", "Фильтры")}
              {clip.filters && clip.filters.length > 0 && (
                <span className="ml-auto text-xs" data-oid="fw31-tv">
                  {clip.filters.length}
                </span>
              )}
            </ContextMenuItem>

            <ContextMenuSeparator data-oid="d_ge2d." />

            <ContextMenuItem data-oid="sj:rpfz">
              <Volume2 className="mr-2 h-4 w-4" data-oid="vgie81x" />
              {t("timeline.clip.volume", "Громкость")}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator data-oid="bfit7eb" />

        <ContextMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive" data-oid="wj-5sbe">
          <Trash2 className="mr-2 h-4 w-4" data-oid="s1gk4.p" />
          {t("timeline.clip.delete", "Удалить")}
          <span className="ml-auto text-xs" data-oid="fpfluc0">
            Delete
          </span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

import { memo, useCallback, useMemo } from "react"

import { usePlayer } from "@/domains/video-editing"
import { UniversalList } from "@/features/browser/components/universal-list"
import { useTimelineActions } from "@/features/timeline/hooks"

import { useMediaAdapter } from "../../adapters/use-media-adapter"

export const MediaAdapterContent = memo(() => {
  const adapter = useMediaAdapter()
  const { addSingleMediaToTimeline } = useTimelineActions()
  const { setPreviewMedia, setVideoSource } = usePlayer()

  // Обработчик клика - открывает видео в плеере для предпросмотра (заменяет старую кнопку Apply)
  const handleItemClick = useCallback(
    (item: any) => {
      console.log("[MediaAdapter] Clicked on media item:", { name: item?.name, path: item?.path, item })
      setVideoSource("browser")
      setPreviewMedia(item)
      console.log("[MediaAdapter] Set videoSource=browser and previewMedia")
    },
    [setPreviewMedia, setVideoSource],
  )

  const handleItemSelect = useMemo(() => (item: any) => addSingleMediaToTimeline(item), [addSingleMediaToTimeline])

  return (
    <UniversalList adapter={adapter} onItemClick={handleItemClick} onItemSelect={handleItemSelect} data-oid="83k_v2_" />
  )
})

MediaAdapterContent.displayName = "MediaAdapterContent"

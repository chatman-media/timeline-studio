import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"
import { useTimelineActions } from "@/features/timeline/hooks"

import { useMediaAdapter } from "../../adapters/use-media-adapter"

export const MediaAdapterContent = memo(() => {
  const adapter = useMediaAdapter()
  const { addSingleMediaToTimeline } = useTimelineActions()

  const handleItemSelect = useMemo(() => (item: any) => addSingleMediaToTimeline(item), [addSingleMediaToTimeline])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="83k_v2_" />
})

MediaAdapterContent.displayName = "MediaAdapterContent"

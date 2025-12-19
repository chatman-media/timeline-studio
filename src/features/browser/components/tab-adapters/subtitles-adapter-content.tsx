import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useSubtitlesAdapter } from "../../adapters/use-subtitles-adapter"

export const SubtitlesAdapterContent = memo(() => {
  const adapter = useSubtitlesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="mi3jvnx" />
})

SubtitlesAdapterContent.displayName = "SubtitlesAdapterContent"

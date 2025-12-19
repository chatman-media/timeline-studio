import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useMusicAdapter } from "../../adapters/use-music-adapter"

export const MusicAdapterContent = memo(() => {
  const adapter = useMusicAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="vbbd0wq" />
})

MusicAdapterContent.displayName = "MusicAdapterContent"

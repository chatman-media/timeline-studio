import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useEffectsAdapter } from "../../adapters/use-effects-adapter"

export const EffectsAdapterContent = memo(() => {
  // Component mounted

  const adapter = useEffectsAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="d_g42u7" />
})

EffectsAdapterContent.displayName = "EffectsAdapterContent"

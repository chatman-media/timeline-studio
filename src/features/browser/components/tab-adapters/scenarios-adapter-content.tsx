import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useScenariosAdapter } from "../../adapters/use-scenarios-adapter"

export const ScenariosAdapterContent = memo(() => {
  const adapter = useScenariosAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

ScenariosAdapterContent.displayName = "ScenariosAdapterContent"

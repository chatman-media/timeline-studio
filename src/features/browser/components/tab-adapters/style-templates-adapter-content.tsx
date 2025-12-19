import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useStyleTemplatesAdapter } from "../../adapters/use-style-templates-adapter"

export const StyleTemplatesAdapterContent = memo(() => {
  const adapter = useStyleTemplatesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="nbe2_yx" />
})

StyleTemplatesAdapterContent.displayName = "StyleTemplatesAdapterContent"

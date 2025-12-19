import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useTransitionsAdapter } from "../../adapters/use-transitions-adapter"

export const TransitionsAdapterContent = memo(() => {
  const adapter = useTransitionsAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="t5ntp2x" />
})

TransitionsAdapterContent.displayName = "TransitionsAdapterContent"

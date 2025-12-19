import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useFiltersAdapter } from "../../adapters/use-filters-adapter"

export const FiltersAdapterContent = memo(() => {
  const adapter = useFiltersAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} data-oid="5_uj64u" />
})

FiltersAdapterContent.displayName = "FiltersAdapterContent"

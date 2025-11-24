import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useProjectTemplatesAdapter } from "../../adapters/use-project-templates-adapter"

export const ProjectTemplatesAdapterContent = memo(() => {
  const adapter = useProjectTemplatesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])

  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

ProjectTemplatesAdapterContent.displayName = "ProjectTemplatesAdapterContent"

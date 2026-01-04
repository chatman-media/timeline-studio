/**
 * Provider для состояния Script Plan
 * Shared state между Fragment Library, Storyboard Editor и Plan Settings
 */

import type { ReactNode } from "react"
import { createContext, useContext } from "react"

import type { ScriptFragment } from "@/features/timeline/types/script"

import { useFragmentLibrary } from "./fragment-library/use-fragment-library"
import { usePlanGenerator } from "./plan-settings/use-plan-generator"
import { useScriptPlan } from "./storyboard-editor/use-script-plan"

interface ScriptPlanContextValue {
  // Fragment Library
  fragments: ScriptFragment[]
  allFragments: ScriptFragment[]
  filters: ReturnType<typeof useFragmentLibrary>["filters"]
  setFilters: ReturnType<typeof useFragmentLibrary>["setFilters"]
  hasFragments: boolean
  totalCount: number
  filteredCount: number

  // Script Plan
  plan: ReturnType<typeof useScriptPlan>["plan"]
  createPlan: ReturnType<typeof useScriptPlan>["createPlan"]
  updatePlan: ReturnType<typeof useScriptPlan>["updatePlan"]
  addScene: ReturnType<typeof useScriptPlan>["addScene"]
  removeScene: ReturnType<typeof useScriptPlan>["removeScene"]
  reorderScenes: ReturnType<typeof useScriptPlan>["reorderScenes"]
  updateSettings: ReturnType<typeof useScriptPlan>["updateSettings"]
  clearPlan: ReturnType<typeof useScriptPlan>["clearPlan"]

  // Plan Generator
  generatePlan: ReturnType<typeof usePlanGenerator>["generatePlan"]
  isGenerating: boolean
  generationError: string | null
}

const ScriptPlanContext = createContext<ScriptPlanContextValue | null>(null)

export function ScriptPlanProvider({ children }: { children: ReactNode }) {
  const fragmentLibrary = useFragmentLibrary()
  const scriptPlan = useScriptPlan()
  const planGenerator = usePlanGenerator()

  const value: ScriptPlanContextValue = {
    // Fragment Library
    fragments: fragmentLibrary.fragments,
    allFragments: fragmentLibrary.allFragments,
    filters: fragmentLibrary.filters,
    setFilters: fragmentLibrary.setFilters,
    hasFragments: fragmentLibrary.hasFragments,
    totalCount: fragmentLibrary.totalCount,
    filteredCount: fragmentLibrary.filteredCount,

    // Script Plan
    plan: scriptPlan.plan,
    createPlan: scriptPlan.createPlan,
    updatePlan: scriptPlan.updatePlan,
    addScene: scriptPlan.addScene,
    removeScene: scriptPlan.removeScene,
    reorderScenes: scriptPlan.reorderScenes,
    updateSettings: scriptPlan.updateSettings,
    clearPlan: scriptPlan.clearPlan,

    // Plan Generator
    generatePlan: planGenerator.generatePlan,
    isGenerating: planGenerator.isGenerating,
    generationError: planGenerator.error,
  }

  return <ScriptPlanContext.Provider value={value}>{children}</ScriptPlanContext.Provider>
}

export function useScriptPlanContext() {
  const context = useContext(ScriptPlanContext)
  if (!context) {
    throw new Error("useScriptPlanContext must be used within ScriptPlanProvider")
  }
  return context
}

/**
 * Script View - главный компонент панели сценария/раскадровки
 * 3-колоночный layout: Библиотека | Раскадровка | Настройки
 */

import { useState } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import type { ScriptFragment } from "@/features/timeline/types/script"
import { FragmentLibrary } from "./fragment-library/fragment-library"
import { useApplyPlanToTimeline } from "./hooks/use-apply-plan-to-timeline"
import { PlanSettings } from "./plan-settings/plan-settings"
import { ScriptPlanProvider, useScriptPlanContext } from "./script-plan-provider"
import { StoryboardEditor } from "./storyboard-editor/storyboard-editor"

function ScriptViewInner() {
  const {
    fragments,
    plan,
    addScene,
    removeScene,
    reorderScenes,
    updateSettings,
    generatePlan,
    isGenerating,
    updatePlan,
  } = useScriptPlanContext()

  // Локальное состояние для настроек
  const [planName, setPlanName] = useState("Мой план монтажа")
  const [targetDuration, setTargetDuration] = useState(120)
  const [style, setStyle] = useState<
    "dynamic-action" | "cinematic-drama" | "music-video" | "documentary" | "social-media" | "corporate"
  >("dynamic-action")

  const handleGeneratePlan = async () => {
    const newPlan = await generatePlan({
      style,
      targetDuration,
      fragments,
    })
    updatePlan(newPlan)
  }

  const { applyPlanToTimeline, isApplying } = useApplyPlanToTimeline()

  const handleApplyPlan = async () => {
    if (!plan) return
    await applyPlanToTimeline(plan, fragments)
  }

  const handleDropFragment = (fragment: ScriptFragment) => {
    addScene(fragment)
  }

  return (
    <div className="flex h-full w-full flex-col" data-testid="script-view">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Левая панель - Библиотека фрагментов */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full border-r bg-background" data-testid="fragment-library-panel">
            <FragmentLibrary
              fragments={fragments}
              onSelectFragment={(fragment) => console.log("Selected:", fragment)}
              onDragStart={(fragment) => console.log("Drag start:", fragment)}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Центральная панель - Раскадровка */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="h-full bg-background" data-testid="storyboard-editor-panel">
            <StoryboardEditor
              plan={plan}
              fragments={fragments}
              onAddScene={addScene}
              onRemoveScene={removeScene}
              onReorderScenes={reorderScenes}
              onDropFragment={handleDropFragment}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Правая панель - Настройки */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full border-l bg-background" data-testid="plan-settings-panel">
            <PlanSettings
              settings={
                plan?.settings || {
                  prioritizeQuality: true,
                  prioritizeEngagement: true,
                  syncWithMusic: false,
                  includeFaces: true,
                  includeDynamic: true,
                  paceLevel: 50,
                  transitionComplexity: 50,
                }
              }
              planName={planName}
              targetDuration={targetDuration}
              style={style}
              onSettingsChange={updateSettings}
              onNameChange={setPlanName}
              onDurationChange={setTargetDuration}
              onStyleChange={setStyle}
              onGeneratePlan={handleGeneratePlan}
              onApplyPlan={handleApplyPlan}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export function ScriptView() {
  return (
    <ScriptPlanProvider>
      <ScriptViewInner />
    </ScriptPlanProvider>
  )
}

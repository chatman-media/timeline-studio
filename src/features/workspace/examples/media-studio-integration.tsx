/**
 * Media Studio Integration Example
 *
 * Example showing how to integrate widget system into MediaStudio
 */

"use client"

import { useMemo } from "react"

import { Browser } from "@/features/browser/components"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { VideoPlayer } from "@/features/video-player/components/video-player"

import { LayoutPresetSelector } from "../components/layout-preset-selector"
import { WidgetWorkspace } from "../components/widget-workspace"
import { useWorkspaceLayout } from "../services/workspace-layout-provider"
import type { Widget, WidgetType } from "../types/widget"

/**
 * Example MediaStudio component with widget system
 */
export function MediaStudioWidgetExample() {
  const { currentPresetId, switchPreset, send } = useWorkspaceLayout()

  // Define widget renderers - map widget types to actual components
  const widgetRenderers = useMemo(
    () =>
      ({
        timeline: (widget: Widget) => (
          <div className="h-full w-full">
            <Timeline />
          </div>
        ),

        player: (widget: Widget) => (
          <div className="h-full w-full">
            <VideoPlayer />
          </div>
        ),

        browser: (widget: Widget) => (
          <div className="h-full w-full">
            <Browser />
          </div>
        ),

        options: (widget: Widget) => (
          <div className="h-full w-full">
            <Options />
          </div>
        ),
      }) as Record<WidgetType, (widget: Widget) => JSX.Element>,
    [],
  )

  return (
    <div className="flex h-screen flex-col">
      {/* Header with layout selector */}
      <header className="flex h-12 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Timeline Studio</h1>

        <div className="flex items-center gap-4">
          <LayoutPresetSelector currentPresetId={currentPresetId} onPresetChange={switchPreset} />
        </div>
      </header>

      {/* Widget Workspace */}
      <main className="flex-1">
        <WidgetWorkspace
          machine={null} // Machine will be provided by provider
          widgetRenderers={widgetRenderers}
        />
      </main>
    </div>
  )
}

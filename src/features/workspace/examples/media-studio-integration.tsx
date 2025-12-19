/**
 * Media Studio Integration Example
 *
 * Example showing how to integrate widget system into MediaStudio
 *
 * IMPORTANT: This component MUST be wrapped in WorkspaceLayoutProvider
 *
 * @example
 * ```tsx
 * import { WorkspaceLayoutProvider } from "@/features/workspace"
 *
 * function App() {
 *   return (
 *     <WorkspaceLayoutProvider>
 *       <MediaStudioWidgetExample />
 *     </WorkspaceLayoutProvider>
 *   )
 * }
 * ```
 */

"use client"

import { type ReactNode, useMemo } from "react"

import { AiChat } from "@/features/ai-chat"
import { Browser } from "@/features/browser/components"
import { Options } from "@/features/options"
import { AISuggestionsPanel } from "@/features/timeline"
import { TimelineScale } from "@/features/timeline/components/timeline-scale/timeline-scale"

// Timeline component is a placeholder - replace with actual timeline component
const Timeline = TimelineScale

import { VideoPlayer } from "@/features/video-player/components/video-player"

import { LayoutPresetSelector } from "../components/layout-preset-selector"
import { WidgetWorkspace } from "../components/widget-workspace"
import { useWorkspaceLayout } from "../services/workspace-layout-provider"
import type { Widget, WidgetType } from "../types/widget"

/**
 * Example MediaStudio component with widget system
 *
 * NOTE: useWorkspaceLayout hook provides access to the XState machine
 * through the WorkspaceLayoutProvider context. The machine is created
 * in the provider and should NOT be passed as a prop to WidgetWorkspace.
 */
export function MediaStudioWidgetExample() {
  // Get workspace state and actions from context
  // The hook internally accesses the XState machine actor
  const { currentPresetId, switchPreset } = useWorkspaceLayout()

  // Define widget renderers - map widget types to actual components
  const widgetRenderers = useMemo(
    () =>
      ({
        timeline: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="jv:zg_y">
            <Timeline data-oid="wh:fuji" />
          </div>
        ),

        player: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="5q0k0ga">
            <VideoPlayer data-oid="pcasgqk" />
          </div>
        ),

        browser: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="4juugxm">
            <Browser data-oid="pzyx6ju" />
          </div>
        ),

        options: (_widget: Widget) => (
          <div className="h-full w-full" data-oid="fbn1fzn">
            <Options data-oid="d0hwdpq" />
          </div>
        ),

        "ai-chat": (_widget: Widget) => (
          <div className="h-full w-full" data-oid="4k3z:-4">
            <AiChat data-oid="3gkid-v" />
          </div>
        ),

        "ai-suggestions": (_widget: Widget) => (
          <div className="h-full w-full" data-oid="wpgw2sw">
            <AISuggestionsPanel data-oid="5bcq95h" />
          </div>
        ),
      }) as Record<WidgetType, (widget: Widget) => ReactNode>,
    [],
  )

  return (
    <div className="flex h-screen flex-col" data-oid="f650dee">
      {/* Header with layout selector */}
      <header className="flex h-12 items-center justify-between border-b px-4" data-oid="zuqe_mz">
        <h1 className="text-lg font-semibold" data-oid="mexrdv5">
          Timeline Studio
        </h1>

        <div className="flex items-center gap-4" data-oid="8ui9cv0">
          <LayoutPresetSelector currentPresetId={currentPresetId} onPresetChange={switchPreset} data-oid="up8o7vs" />
        </div>
      </header>

      {/* Widget Workspace */}
      <main className="flex-1" data-oid="uahb6vq">
        {/*
             WidgetWorkspace gets the machine state through useWorkspaceLayout hook.
             No need to pass machine as prop - it's provided by WorkspaceLayoutProvider context.
            */}
        <WidgetWorkspace widgetRenderers={widgetRenderers} data-oid="aworuy:" />
      </main>
    </div>
  )
}

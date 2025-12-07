import type React from "react"
import { useState } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useUserSettings } from "@/domains/project-management/hooks"
import { ResourcesPanel } from "@/features/resources/components/resources-panel"
import { cn } from "@/lib/utils"

import { AudioMixerView } from "./audio-mixer-view"
import { TimelineContent } from "./timeline-content"
import { TimelineWorkspaceTabs, type WorkspaceView } from "./timeline-workspace-tabs"
import { VirtualizedTimelineContent } from "./virtualized-timeline-content"

interface TimelineProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * Timeline component that displays the main timeline interface with resources, content, and AI chat panels.
 *
 * @param className Optional additional class names for the root element.
 * @param style Optional inline styles for the root element.
 */
export function Timeline({ className, style }: TimelineProps = {}) {
  const [activeView, setActiveView] = useState<WorkspaceView>("timeline")
  const settings = useUserSettings()

  // Выбираем компонент Timeline в зависимости от настроек виртуализации
  const TimelineComponent = settings?.timelineVirtualizationEnabled ? VirtualizedTimelineContent : TimelineContent

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full timeline", className)}
      data-testid="timeline"
      style={style}
    >
      <ResizablePanel defaultSize={20} minSize={5} maxSize={30}>
        <ResourcesPanel />
      </ResizablePanel>
      <ResizableHandle />

      {/* Средняя панель (основная часть) */}
      <ResizablePanel defaultSize={80} minSize={40}>
        <div className="flex h-full w-full flex-col">
          {/* Вкладки для переключения видов */}
          <div className="shrink-0">
            <TimelineWorkspaceTabs activeView={activeView} onViewChange={setActiveView} />
          </div>

          {/* Основная часть - Timeline контент или Audio Mixer */}
          <div className="w-full grow overflow-hidden">
            {activeView === "timeline" ? <TimelineComponent /> : <AudioMixerView />}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

import type React from "react"
import { useState } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AiChat } from "@/features/ai-chat/components/ai-chat"
import { useUserSettings } from "@/features/app-state/hooks/use-user-settings"
import { ResourcesPanel } from "@/features/resources"
import { cn } from "@/lib/utils"

import { AISuggestionsPanel } from "./ai-suggestions/ai-suggestions-panel"
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
  const { userSettings } = useUserSettings()

  // Выбираем компонент Timeline в зависимости от настроек виртуализации
  const TimelineComponent = userSettings?.timelineVirtualizationEnabled ? VirtualizedTimelineContent : TimelineContent

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full timeline", className)}
      data-testid="timeline"
      style={style}
    >
      <ResizablePanel defaultSize={15} minSize={5} maxSize={30}>
        <ResourcesPanel />
      </ResizablePanel>
      <ResizableHandle />

      {/* Средняя панель (основная часть) */}
      <ResizablePanel defaultSize={activeView === "timeline" ? 65 : 80} minSize={40}>
        <div className="flex h-full w-full flex-col">
          {/* Вкладки для переключения видов */}
          <div className="flex-shrink-0">
            <TimelineWorkspaceTabs activeView={activeView} onViewChange={setActiveView} />
          </div>

          {/* Основная часть - Timeline контент или Audio Mixer */}
          <div className="w-full flex-grow overflow-hidden">
            {activeView === "timeline" ? <TimelineComponent /> : <AudioMixerView />}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={10} maxSize={50}>
        <div className="h-full flex-1">
          <AISuggestionsPanel />
        </div>
      </ResizablePanel>

      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={10} maxSize={50} className="flex-shrink-0">
        <AiChat />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

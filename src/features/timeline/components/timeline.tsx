import type React from "react"
import { useState } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@timeline-studio/ui/components/resizable"
import { useUserSettings } from "@timeline-studio/core/hooks/use-user-settings"
import { ResourcesPanel } from "@/features/resources/components/resources-panel"
import { cn } from "@/lib/utils"

import { AnalysisView } from "./analysis-view"
import { AudioMixerView } from "./audio-mixer-view"
import { ScriptView } from "./script-view"
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
  const [activeView, setActiveView] = useState<WorkspaceView>("analysis") // Анализ по умолчанию
  const settings = useUserSettings()

  // Выбираем компонент Timeline в зависимости от настроек виртуализации
  const TimelineComponent = settings?.timelineVirtualizationEnabled ? VirtualizedTimelineContent : TimelineContent

  // Функция для рендеринга активного вида
  const renderView = () => {
    switch (activeView) {
      case "timeline":
        return <TimelineComponent data-oid="nkw7y1s" />
      case "audio-mixer":
        return <AudioMixerView data-oid="dlq_xd2" />
      case "analysis":
        return <AnalysisView data-oid="a:eczro" />
      case "script":
        return <ScriptView data-oid="script-view" />
      default:
        return <TimelineComponent data-oid="_.n3vjo" />
    }
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full timeline", className)}
      data-testid="timeline"
      style={style}
      data-oid="yg1qgtj"
    >
      <ResizablePanel defaultSize={20} minSize={5} maxSize={30} data-oid="6x5wiak">
        <ResourcesPanel data-oid="lgu8bo4" />
      </ResizablePanel>
      <ResizableHandle data-oid="lnpd__7" />

      {/* Средняя панель (основная часть) */}
      <ResizablePanel defaultSize={80} minSize={40} data-oid="q4zgcab">
        <div className="flex h-full w-full flex-col" data-oid="1wahhsu">
          {/* Вкладки для переключения видов */}
          <div className="shrink-0" data-oid=":61d-.3">
            <TimelineWorkspaceTabs activeView={activeView} onViewChange={setActiveView} data-oid="sqgf-gl" />
          </div>

          {/* Основная часть - Timeline контент, Audio Mixer или Analysis */}
          <div className="w-full grow overflow-hidden" data-oid="amqilgc">
            {renderView()}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

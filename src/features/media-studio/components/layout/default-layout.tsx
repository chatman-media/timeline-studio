import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Options } from "@/features/options"
import { AISuggestionsPanel } from "@/features/timeline/components/ai-suggestions/ai-suggestions-panel"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

function TopDefaultLayout() {
  const { isOptionsVisible, isTimelineVisible } = useUserSettings()

  // Случай: только VideoPlayer (все панели скрыты)
  if (!isOptionsVisible && !isTimelineVisible) {
    return (
      <div className="h-full flex-1">
        <VideoPlayer />
      </div>
    )
  }

  // Случай: VideoPlayer + AI Assistant (Options скрыт)
  if (!isOptionsVisible && isTimelineVisible) {
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-ai">
        <ResizablePanel defaultSize={70} minSize={30} maxSize={90}>
          <div className="h-full flex-1">
            <VideoPlayer />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={30} minSize={10} maxSize={70}>
          <div className="h-full flex-1">
            <AISuggestionsPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: VideoPlayer + Options (AI может быть видим)
  if (!isTimelineVisible) {
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-2">
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <VideoPlayer />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Options />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }
  // VideoPlayer + Options + AI Assistant
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-options-ai">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={70}>
        <div className="relative h-full flex-1">
          <VideoPlayer />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={25} minSize={15} maxSize={70}>
        <div className="h-full flex-1">
          <Options />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function DefaultLayout() {
  const { isTimelineVisible } = useUserSettings()

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="default-layout-main">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <TopDefaultLayout />
      </ResizablePanel>
      {isTimelineVisible ? (
        <>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={20}
            minSize={20}
            maxSize={100}
            style={{
              transition: "width 0.3s ease-in-out",
            }}
          >
            <div className="h-full flex-1">
              <Timeline />
            </div>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  )
}

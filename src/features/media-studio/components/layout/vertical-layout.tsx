import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { Options } from "@/features/options/components/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

interface LeftLayoutProps {
  isTimelineVisible: boolean
  isBrowserVisible: boolean
  isOptionsVisible: boolean
}

function LeftLayout({ isTimelineVisible, isBrowserVisible, isOptionsVisible }: LeftLayoutProps) {
  // Случай: только Options (Timeline и Browser скрыты)
  if (!isTimelineVisible && !isBrowserVisible) {
    return (
      <div className="h-full flex-1">
        <Options />
      </div>
    )
  }

  // Случай: только Timeline (Browser и Options скрыты)
  if (!isBrowserVisible && !isOptionsVisible) {
    return (
      <div className="h-full flex-1">
        <Timeline />
      </div>
    )
  }

  // Случай: только Browser (Options и Timeline скрыты)
  if (!isOptionsVisible && !isTimelineVisible) {
    return (
      <div className="h-full flex-1">
        <Browser />
      </div>
    )
  }

  // Случай: Browser + Options (Timeline скрыт)
  if (!isTimelineVisible) {
    return (
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="vertical-layout-1">
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Browser />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <Options />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Options + Timeline (Browser скрыт)
  if (!isBrowserVisible) {
    return (
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="vertical-layout-2">
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <Options />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Timeline />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Browser + Timeline (Options скрыт)
  if (!isOptionsVisible) {
    return (
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="vertical-layout-3">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Browser />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <Timeline />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Browser + Options + Timeline (все видимы)
  return (
    <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="vertical-layout-4">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-layout-4">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
            <div className="h-full flex-1">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={20} maxSize={100}>
            <div className="relative h-full flex-1">
              <Options />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={20} maxSize={80}>
        <div className="h-full flex-1">
          <Timeline />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function VerticalLayout() {
  const { isTimelineVisible, isBrowserVisible, isOptionsVisible } = useUserSettings()

  if (!isOptionsVisible && !isTimelineVisible && !isBrowserVisible)
    return (
      <>
        {" "}
        <VideoPlayer />{" "}
      </>
    )

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="vertical-main-layout">
      <ResizablePanel defaultSize={67} minSize={50}>
        <LeftLayout
          isTimelineVisible={isTimelineVisible}
          isBrowserVisible={isBrowserVisible}
          isOptionsVisible={isOptionsVisible}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={33}>
        <div className="relative h-full flex-1">
          <VideoPlayer />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

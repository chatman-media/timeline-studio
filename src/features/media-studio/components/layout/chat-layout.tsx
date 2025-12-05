import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AiChat } from "@/features/ai-chat"
import { Browser } from "@/features/browser/components/browser"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

function LeftChatLayout() {
  const { isTimelineVisible, isBrowserVisible, isOptionsVisible } = useUserSettings()

  // Случай: только VideoPlayer (все остальные панели скрыты)
  if (!isTimelineVisible && !isBrowserVisible && !isOptionsVisible) {
    return (
      <div className="h-full flex-1">
        <VideoPlayer />
      </div>
    )
  }

  // Случай: Timeline скрыт
  if (!isTimelineVisible) {
    // Если Browser и Options скрыты
    if (!isBrowserVisible && !isOptionsVisible) {
      return (
        <div className="h-full flex-1">
          <VideoPlayer />
        </div>
      )
    }

    // Если только Options скрыт
    if (!isOptionsVisible) {
      return (
        <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="chat-layout-1">
          <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
            <div className="h-full flex-1">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
            <div className="relative h-full flex-1">
              <VideoPlayer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    }

    // Если только Browser скрыт
    if (!isBrowserVisible) {
      return (
        <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="chat-layout-2">
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

    // Browser + VideoPlayer + Options (Timeline скрыт)
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="chat-layout-3">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={60}>
          <div className="h-full flex-1">
            <Browser />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <div className="relative h-full flex-1">
            <VideoPlayer />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={25} minSize={20} maxSize={60}>
          <div className="h-full flex-1">
            <Options />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Timeline видим
  // Если Browser и Options скрыты
  if (!isBrowserVisible && !isOptionsVisible) {
    return (
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="chat-layout-4">
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <VideoPlayer />
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

  // Если только Options скрыт
  if (!isOptionsVisible) {
    return (
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="chat-layout-5">
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="chat-layout-6">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
              <div className="h-full flex-1">
                <Browser />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={70} minSize={20} maxSize={100}>
              <div className="relative h-full flex-1">
                <VideoPlayer />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Timeline />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Если только Browser скрыт
  if (!isBrowserVisible) {
    return (
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="chat-layout-7">
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="chat-layout-8">
            <ResizablePanel defaultSize={70} minSize={20} maxSize={100}>
              <div className="relative h-full flex-1">
                <VideoPlayer />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
              <div className="h-full flex-1">
                <Options />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Timeline />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Все панели видимы: Browser + VideoPlayer + Options + Timeline
  return (
    <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="chat-layout-9">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="chat-layout-10">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={60}>
            <div className="h-full flex-1">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="relative h-full flex-1">
              <VideoPlayer />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={60}>
            <div className="h-full flex-1">
              <Options />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <div className="h-full flex-1">
          <Timeline />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function ChatLayout() {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="chat-layout-main">
      <ResizablePanel defaultSize={70}>
        <LeftChatLayout />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={30}>
        <div className="h-full flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            <AiChat />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

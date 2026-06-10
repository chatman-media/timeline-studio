import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@timeline-studio/ui/components/resizable"
import { AiChat } from "@/features/ai-chat"
import { Browser } from "@/features/browser/components"
import { PANEL_GROUP_IDS } from "@/features/media-studio/config/panel-ids"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

interface TopDefaultLayoutProps {
  isOptionsVisible: boolean
  isTimelineVisible: boolean
  isBrowserVisible: boolean
}

function TopDefaultLayout({ isOptionsVisible, isTimelineVisible: _, isBrowserVisible }: TopDefaultLayoutProps) {
  // Случай: только VideoPlayer (все панели скрыты)
  if (!isOptionsVisible && !isBrowserVisible) {
    return (
      <div className="h-full flex-1" data-oid="ufj9:p6">
        <VideoPlayer data-oid="z3tpf:d" />
      </div>
    )
  }

  // Случай: Browser + VideoPlayer (Options скрыт)
  if (isBrowserVisible && !isOptionsVisible) {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER}
        data-oid="2s1lg2l"
      >
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80} data-oid="sm-vxtv">
          <div className="h-full flex-1" data-oid="54y3y_0">
            <Browser data-oid=":x15sr_" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="_4n493y" />
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80} data-oid="0.waoj4">
          <div className="h-full flex-1" data-oid="c-8s4xd">
            <VideoPlayer data-oid="vu7r9mn" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: VideoPlayer + Options (Browser скрыт)
  if (!isBrowserVisible && isOptionsVisible) {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.PLAYER_OPTIONS}
        data-oid="6rxp1jv"
      >
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80} data-oid="o0ub_ne">
          <div className="h-full flex-1" data-oid="n4g0xiq">
            <VideoPlayer data-oid="r2oxyfo" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="-mnr1i2" />
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80} data-oid="jdur-zx">
          <div className="h-full flex-1" data-oid="3arvofz">
            <Options data-oid="jf7kua-" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Browser + VideoPlayer + Options (все видимы)
  if (isBrowserVisible && isOptionsVisible) {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER_OPTIONS}
        data-oid="46yr-vo"
      >
        <ResizablePanel defaultSize={33} minSize={20} maxSize={70} data-oid="-4e5ff-">
          <div className="h-full flex-1" data-oid="ngrob2h">
            <Browser data-oid="p7zooxt" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="h--9cx_" />
        <ResizablePanel defaultSize={34} minSize={20} maxSize={70} data-oid="zj48tin">
          <div className="h-full flex-1" data-oid="z-02lmc">
            <VideoPlayer data-oid="_g2yva5" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid=".42p-ei" />
        <ResizablePanel defaultSize={33} minSize={20} maxSize={70} data-oid="jkuh629">
          <div className="h-full flex-1" data-oid="t5-mb2l">
            <Options data-oid="6l8d:er" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Fallback: только VideoPlayer
  return (
    <div className="h-full flex-1" data-oid="_l-xx0n">
      <VideoPlayer data-oid="8tp:ns:" />
    </div>
  )
}

export function DefaultLayout() {
  const { isTimelineVisible, isOptionsVisible, isBrowserVisible } = useUserSettings()

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId={PANEL_GROUP_IDS.MAIN_VERTICAL}
      data-oid="l_v7cm:"
    >
      <ResizablePanel defaultSize={60} minSize={20} maxSize={80} data-oid="_nlylxq">
        <TopDefaultLayout
          isTimelineVisible={isTimelineVisible}
          isOptionsVisible={isOptionsVisible}
          isBrowserVisible={isBrowserVisible}
          data-oid="elumatw"
        />
      </ResizablePanel>
      {isTimelineVisible ? (
        <>
          <ResizableHandle data-oid="zlz7gps" />
          <ResizablePanel
            defaultSize={40}
            minSize={20}
            maxSize={80}
            style={{
              transition: "width 0.3s ease-in-out",
            }}
            data-oid="sndbog3"
          >
            {/* Timeline и AI Chat рядом горизонтально */}
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-0 h-full"
              autoSaveId={PANEL_GROUP_IDS.TIMELINE_AI}
              data-oid="ynds320"
            >
              <ResizablePanel defaultSize={75} minSize={40} maxSize={85} data-oid="787y4hx">
                <div className="h-full flex-1" data-oid="83ycno6">
                  <Timeline data-oid="v3ekv2v" />
                </div>
              </ResizablePanel>
              <ResizableHandle data-oid="u1q7vru" />
              <ResizablePanel defaultSize={25} minSize={15} maxSize={60} data-oid="z0i.lmn">
                <div className="h-full flex-1 flex flex-col" data-oid="d_9ei69">
                  <div className="flex-1 min-h-0" data-oid="w:06cd5">
                    <AiChat data-oid="14bxqh:" />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  )
}

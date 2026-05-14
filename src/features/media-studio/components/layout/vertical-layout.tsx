import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { PANEL_GROUP_IDS } from "@/features/media-studio/config/panel-ids"
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
      <div className="h-full flex-1" data-oid="4iv4oor">
        <Options data-oid="8:vtwc3" />
      </div>
    )
  }

  // Случай: только Timeline (Browser и Options скрыты)
  if (!isBrowserVisible && !isOptionsVisible) {
    return (
      <div className="h-full flex-1" data-oid="_z5-ps_">
        <Timeline data-oid="n2vhz1w" />
      </div>
    )
  }

  // Случай: только Browser (Options и Timeline скрыты)
  if (!isOptionsVisible && !isTimelineVisible) {
    return (
      <div className="h-full flex-1" data-oid="n4op8kf">
        <Browser data-oid="gswi0e." />
      </div>
    )
  }

  // Случай: Browser + Options (Timeline скрыт)
  if (!isTimelineVisible) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.VERTICAL_LAYOUT_LEFT}
        data-oid="jzdr3n-"
      >
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="ok-e6g4">
          <div className="h-full flex-1" data-oid="m77-9p3">
            <Browser data-oid="dcl06p0" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="v887w3_" />
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="9zx5zu.">
          <div className="relative h-full flex-1" data-oid="su4vjpf">
            <Options data-oid="30bivu4" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Options + Timeline (Browser скрыт)
  if (!isBrowserVisible) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.LEFT_VERTICAL}
        data-oid="lr5--53"
      >
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="1_srr18">
          <div className="relative h-full flex-1" data-oid="osg.x6.">
            <Options data-oid="9.ltzgz" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="z-y1wuo" />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="oo-.9pp">
          <div className="h-full flex-1" data-oid=":g1wv9f">
            <Timeline data-oid=":2-h.-w" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Browser + Timeline (Options скрыт)
  if (!isOptionsVisible) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.LEFT_VERTICAL}
        data-oid="52r_tof"
      >
        <ResizablePanel defaultSize={30} minSize={20} maxSize={80} data-oid="3-4s.er">
          <div className="h-full flex-1" data-oid="xez1a4s">
            <Browser data-oid="fh0bclx" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="qwpx8pj" />
        <ResizablePanel defaultSize={70} minSize={20} maxSize={80} data-oid="-x8deg-">
          <div className="relative h-full flex-1" data-oid="7i9:nvl">
            <Timeline data-oid="-n9vim6" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Browser + Options + Timeline (все видимы)
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId={PANEL_GROUP_IDS.LEFT_VERTICAL}
      data-oid="zfjph3d"
    >
      <ResizablePanel defaultSize={60} minSize={20} maxSize={80} data-oid="q5097sa">
        <ResizablePanelGroup direction="horizontal" autoSaveId="group-browser-options" data-oid="_qxiglq">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={80} data-oid="y_kyfcg">
            <div className="h-full flex-1" data-oid="ao618q-">
              <Browser data-oid="19lg:wd" />
            </div>
          </ResizablePanel>
          <ResizableHandle data-oid="gykyzhe" />
          <ResizablePanel defaultSize={70} minSize={20} maxSize={100} data-oid="80f2jd5">
            <div className="relative h-full flex-1" data-oid="fqm0z1q">
              <Options data-oid="wld5nxt" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle data-oid="5-r5l6s" />
      <ResizablePanel defaultSize={40} minSize={20} maxSize={80} data-oid=":hx_wmg">
        <div className="h-full flex-1" data-oid="bp5_g:k">
          <Timeline data-oid="ckarhru" />
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
        <VideoPlayer data-oid="0gx79v-" />{" "}
      </>
    )

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-0 flex-grow"
      autoSaveId="group-vertical-main"
      data-oid="o28gc67"
    >
      <ResizablePanel defaultSize={67} minSize={50} data-oid="cnc4jx:">
        <LeftLayout
          isTimelineVisible={isTimelineVisible}
          isBrowserVisible={isBrowserVisible}
          isOptionsVisible={isOptionsVisible}
          data-oid="w_:n8hr"
        />
      </ResizablePanel>
      <ResizableHandle data-oid="mt7u4hz" />
      <ResizablePanel defaultSize={33} data-oid=":6azaaz">
        <div className="relative h-full flex-1" data-oid="xeykavg">
          <VideoPlayer data-oid="sxwg2oo" />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

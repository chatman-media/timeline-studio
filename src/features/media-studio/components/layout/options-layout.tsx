import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@timeline-studio/ui/components/resizable"
import { Browser } from "@/features/browser/components/browser"
import { PANEL_GROUP_IDS } from "@/features/media-studio/config/panel-ids"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

function LeftLayout() {
  const { isTimelineVisible, isBrowserVisible } = useUserSettings()

  // Случай: только VideoPlayer (Timeline и Browser скрыты)
  if (!isTimelineVisible && !isBrowserVisible) {
    return (
      <div className="h-full flex-1" data-oid="v2iqb3:">
        <VideoPlayer data-oid="gf_qk2g" />
      </div>
    )
  }

  // Случай: Browser + VideoPlayer (Timeline скрыт)
  if (!isTimelineVisible) {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER}
        data-oid="r_oszsc"
      >
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="9-hvyp7">
          <div className="h-full flex-1" data-oid="2fmpp5-">
            <Browser data-oid="j_axpp." />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="blgzedl" />
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="p2fyfkz">
          <div className="relative h-full flex-1" data-oid="zyblkce">
            <VideoPlayer data-oid="_lk-bjf" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: VideoPlayer + Timeline (Browser скрыт)
  if (!isBrowserVisible) {
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId="group-player-timeline"
        data-oid="b1vbxl8"
      >
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="zcmazig">
          <div className="relative h-full flex-1" data-oid="assgvzb">
            <VideoPlayer data-oid="0qi24x-" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="gcii5cv" />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="3ub.e09">
          <div className="h-full flex-1" data-oid="cxv94ft">
            <Timeline data-oid="kgb_-on" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Случай: Browser + VideoPlayer + Timeline (все видимы)
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId={PANEL_GROUP_IDS.OPTIONS_LAYOUT_LEFT_TOP}
      data-oid="cqxsfi8"
    >
      <ResizablePanel defaultSize={60} minSize={20} maxSize={80} data-oid="-qn6s1z">
        <ResizablePanelGroup direction="horizontal" autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER} data-oid="9wet:-d">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={80} data-oid="tn-v4ey">
            <div className="h-full flex-1" data-oid="3krfsr:">
              <Browser data-oid="3yxw8:w" />
            </div>
          </ResizablePanel>
          <ResizableHandle data-oid="pcxhm8p" />
          <ResizablePanel defaultSize={70} minSize={20} maxSize={100} data-oid="234abyf">
            <div className="relative h-full flex-1" data-oid="8ji29a5">
              <VideoPlayer data-oid="jhv095j" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle data-oid="91mi:as" />
      <ResizablePanel defaultSize={40} minSize={20} maxSize={80} data-oid=":.5h_7t">
        <div className="h-full flex-1" data-oid="z41yoad">
          <Timeline data-oid="1b9ynl." />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function OptionsLayout() {
  const { isOptionsVisible } = useUserSettings()

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-0 flex-grow"
      autoSaveId="group-options-main"
      data-oid="374v5bl"
    >
      <ResizablePanel defaultSize={70} data-oid="uk418-f">
        <LeftLayout data-oid="f4263d1" />
      </ResizablePanel>
      <ResizableHandle data-oid="0uc9re1" />

      {isOptionsVisible && (
        <ResizablePanel defaultSize={30} data-oid="ww3wmx:">
          <div className="h-full flex-1" data-oid="n2-_00i">
            <Options data-oid="mx9aaqc" />
          </div>
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  )
}

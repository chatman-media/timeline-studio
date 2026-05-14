import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AiChat } from "@/features/ai-chat"
import { Browser } from "@/features/browser/components/browser"
import { PANEL_GROUP_IDS } from "@/features/media-studio/config/panel-ids"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

function LeftChatLayout() {
  const { isTimelineVisible, isBrowserVisible, isOptionsVisible } = useUserSettings()

  // Случай: только VideoPlayer (все остальные панели скрыты)
  if (!isTimelineVisible && !isBrowserVisible && !isOptionsVisible) {
    return (
      <div className="h-full flex-1" data-oid="17tsbj8">
        <VideoPlayer data-oid="mfijf_h" />
      </div>
    )
  }

  // Случай: Timeline скрыт
  if (!isTimelineVisible) {
    // Если Browser и Options скрыты
    if (!isBrowserVisible && !isOptionsVisible) {
      return (
        <div className="h-full flex-1" data-oid="a7_8:-2">
          <VideoPlayer data-oid="4kt0kaa" />
        </div>
      )
    }

    // Если только Options скрыт
    if (!isOptionsVisible) {
      return (
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-0 flex-grow"
          autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER}
          data-oid="wpr..__"
        >
          <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="weona5z">
            <div className="h-full flex-1" data-oid="li4ss.5">
              <Browser data-oid="fooxdyt" />
            </div>
          </ResizablePanel>
          <ResizableHandle data-oid="b7wth:e" />
          <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="adg3uva">
            <div className="relative h-full flex-1" data-oid="rl4hypu">
              <VideoPlayer data-oid="nnk3uf9" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    }

    // Если только Browser скрыт
    if (!isBrowserVisible) {
      return (
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-0 flex-grow"
          autoSaveId={PANEL_GROUP_IDS.PLAYER_OPTIONS}
          data-oid="uyypaki"
        >
          <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="ry9bqzz">
            <div className="relative h-full flex-1" data-oid="m9z3jh9">
              <VideoPlayer data-oid="-7451vz" />
            </div>
          </ResizablePanel>
          <ResizableHandle data-oid="mm83-.t" />
          <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="bda8b_s">
            <div className="h-full flex-1" data-oid="a-_3dl3">
              <Options data-oid="ns:j2a5" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    }

    // Browser + VideoPlayer + Options (Timeline скрыт)
    return (
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER_OPTIONS}
        data-oid="co0:y:-"
      >
        <ResizablePanel defaultSize={30} minSize={20} maxSize={60} data-oid="vc3gyah">
          <div className="h-full flex-1" data-oid="b_.-2ic">
            <Browser data-oid="inromni" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="6en_cz1" />
        <ResizablePanel defaultSize={45} minSize={30} maxSize={70} data-oid="juxda2u">
          <div className="relative h-full flex-1" data-oid="q4d91my">
            <VideoPlayer data-oid="i-y_a.:" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="ge3nz2-" />
        <ResizablePanel defaultSize={25} minSize={20} maxSize={60} data-oid="smq2t:v">
          <div className="h-full flex-1" data-oid="-psdedk">
            <Options data-oid="mn1t9gq" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Timeline видим
  // Если Browser и Options скрыты
  if (!isBrowserVisible && !isOptionsVisible) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId="group-player-timeline"
        data-oid="_cxy91w"
      >
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80} data-oid="2ya019-">
          <div className="relative h-full flex-1" data-oid="hngwq9l">
            <VideoPlayer data-oid="9i4ck6j" />
          </div>
        </ResizablePanel>
        <ResizableHandle data-oid="x31bl8-" />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80} data-oid="rg2f_tm">
          <div className="h-full flex-1" data-oid="ylb0n-3">
            <Timeline data-oid="elob1_b" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Если только Options скрыт
  if (!isOptionsVisible) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.CHAT_LAYOUT_LEFT_TOP}
        data-oid="7kjdfm7"
      >
        <ResizablePanel defaultSize={60} minSize={20} maxSize={80} data-oid="qeosueq">
          <ResizablePanelGroup direction="horizontal" autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER} data-oid="4npy069">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={80} data-oid=".m9eu9n">
              <div className="h-full flex-1" data-oid="6px-obe">
                <Browser data-oid="k2s_:us" />
              </div>
            </ResizablePanel>
            <ResizableHandle data-oid="tcczz4r" />
            <ResizablePanel defaultSize={70} minSize={20} maxSize={100} data-oid="ho9sjhf">
              <div className="relative h-full flex-1" data-oid="kfn_fhn">
                <VideoPlayer data-oid="ygtnxs7" />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle data-oid="venlh4b" />
        <ResizablePanel defaultSize={40} minSize={20} maxSize={80} data-oid="d9cakoj">
          <div className="h-full flex-1" data-oid="woufm37">
            <Timeline data-oid="j3mtvk6" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Если только Browser скрыт
  if (!isBrowserVisible) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-0 flex-grow"
        autoSaveId={PANEL_GROUP_IDS.CHAT_LAYOUT_LEFT_TOP}
        data-oid="6cceq5m"
      >
        <ResizablePanel defaultSize={60} minSize={20} maxSize={80} data-oid="k:aqb6t">
          <ResizablePanelGroup direction="horizontal" autoSaveId={PANEL_GROUP_IDS.PLAYER_OPTIONS} data-oid="v18hmba">
            <ResizablePanel defaultSize={70} minSize={20} maxSize={100} data-oid="5:o:o:u">
              <div className="relative h-full flex-1" data-oid="ez9afh2">
                <VideoPlayer data-oid="e8p.m0d" />
              </div>
            </ResizablePanel>
            <ResizableHandle data-oid="3r6ftkg" />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={80} data-oid="_vc0-.8">
              <div className="h-full flex-1" data-oid="ixmw62l">
                <Options data-oid="v4xz4ja" />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle data-oid="9-24s9q" />
        <ResizablePanel defaultSize={40} minSize={20} maxSize={80} data-oid="74sbixz">
          <div className="h-full flex-1" data-oid="m4r:d2z">
            <Timeline data-oid="wut6_3y" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  // Все панели видимы: Browser + VideoPlayer + Options + Timeline
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId={PANEL_GROUP_IDS.CHAT_LAYOUT_LEFT_TOP}
      data-oid="prad_::"
    >
      <ResizablePanel defaultSize={60} minSize={20} maxSize={80} data-oid="mwb49ht">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId={PANEL_GROUP_IDS.BROWSER_PLAYER_OPTIONS}
          data-oid="0g8pwt4"
        >
          <ResizablePanel defaultSize={25} minSize={20} maxSize={60} data-oid="je1wooo">
            <div className="h-full flex-1" data-oid="wdfxid5">
              <Browser data-oid="gchyei_" />
            </div>
          </ResizablePanel>
          <ResizableHandle data-oid="m95-0z9" />
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70} data-oid="rucna.s">
            <div className="relative h-full flex-1" data-oid="e-dat7m">
              <VideoPlayer data-oid="86olgki" />
            </div>
          </ResizablePanel>
          <ResizableHandle data-oid="u.13z--" />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={60} data-oid="pex8ulg">
            <div className="h-full flex-1" data-oid="7pattiz">
              <Options data-oid="9q:5y9_" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle data-oid="i45.dz4" />
      <ResizablePanel defaultSize={40} minSize={20} maxSize={80} data-oid="e2.apjv">
        <div className="h-full flex-1" data-oid="pf5ye.a">
          <Timeline data-oid="fgtf9t3" />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function ChatLayout() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-0 flex-grow"
      autoSaveId="group-chat-main"
      data-oid="616cg7f"
    >
      <ResizablePanel defaultSize={70} data-oid="nm7_fff">
        <LeftChatLayout data-oid="7_-zkt6" />
      </ResizablePanel>
      <ResizableHandle data-oid="cki01.a" />
      <ResizablePanel defaultSize={30} data-oid="uz0i3o:">
        <div className="h-full flex-1 flex flex-col" data-oid="chhr1t-">
          <div className="flex-1 min-h-0" data-oid="sstjqta">
            <AiChat data-oid="1-1-8ip" />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

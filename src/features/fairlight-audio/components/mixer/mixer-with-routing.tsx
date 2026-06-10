import { Button } from "@timeline-studio/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { LayoutGrid, Radio, Settings, Users } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useBusRouting } from "../../hooks/use-bus-routing"
import { useMixerState } from "../../hooks/use-mixer-state"
import { GroupStrip } from "../routing/group-strip"
import { RoutingMatrix } from "../routing/routing-matrix"
import { SendPanel } from "../routing/send-panel"
import { MixerConsole } from "./mixer-console"

interface MixerWithRoutingProps {
  className?: string
}

export function MixerWithRouting({ className }: MixerWithRoutingProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("mixer")
  const [selectedChannelForSends, setSelectedChannelForSends] = useState<string | null>(null)

  const {
    buses,
    groups,
    sends,
    createBus,
    createGroup,
    createSend,
    deleteBus,
    deleteGroup,
    deleteSend,
    assignChannelToBus,
    updateSendLevel,
    setBusMute,
    setBusSolo,
    setGroupMute,
    setGroupSolo,
    setGroupGain,
    toggleSendEnabled,
    toggleSendPre,
    getChannelSends,
  } = useBusRouting()

  const { channels } = useMixerState()
  const channelIds = channels.map((ch) => ch.id)

  const handleGroupGainChange = (groupId: string, value: number) => {
    // Convert 0-100 to 0-2 gain range
    const gain = (value / 100) * 2
    setGroupGain(groupId, gain)
  }

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`} data-oid="rlht4ef">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col" data-oid="suh19p8">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border-b border-zinc-800" data-oid="f471fg-">
          <TabsTrigger value="mixer" className="flex items-center gap-2" data-oid="_dgz.pp">
            <LayoutGrid className="w-4 h-4" data-oid="hg371dr" />
            {t("fairlightAudio.mixerWithRouting.tabs.mixer")}
          </TabsTrigger>
          <TabsTrigger value="routing" className="flex items-center gap-2" data-oid="v21oaqq">
            <Radio className="w-4 h-4" data-oid="okmnv8p" />
            {t("fairlightAudio.mixerWithRouting.tabs.routing")}
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2" data-oid="5-ghjaz">
            <Users className="w-4 h-4" data-oid="blagmgk" />
            {t("fairlightAudio.mixerWithRouting.tabs.groups")}
          </TabsTrigger>
          <TabsTrigger value="sends" className="flex items-center gap-2" data-oid="006.pi5">
            <Settings className="w-4 h-4" data-oid="fp5:awa" />
            {t("fairlightAudio.mixerWithRouting.tabs.sends")}
          </TabsTrigger>
        </TabsList>

        {/* Mixer View */}
        <TabsContent value="mixer" className="flex-1 m-0" data-oid=":g93.78">
          <div className="flex h-full" data-oid="mwuympa">
            {/* Main Mixer */}
            <div className="flex-1" data-oid="isd7v63">
              <MixerConsole data-oid="3_6fm.." />
            </div>

            {/* Group Strips */}
            {groups.length > 0 && (
              <div className="w-auto bg-zinc-800 border-l border-zinc-700 p-2" data-oid="to7e0:0">
                <div className="text-xs text-zinc-400 mb-2 text-center" data-oid="f:0s1j4">
                  {t("fairlightAudio.mixerWithRouting.groups.title")}
                </div>
                <div className="flex gap-2" data-oid="vakh__j">
                  {groups.map((group) => (
                    <GroupStrip
                      key={group.id}
                      group={group}
                      value={(group.gain / 2) * 100} // Convert 0-2 to 0-100
                      onGainChange={(value) => handleGroupGainChange(group.id, value)}
                      onMute={() => setGroupMute(group.id, !group.isMuted)}
                      onSolo={() => setGroupSolo(group.id, !group.isSolo)}
                      onDelete={() => deleteGroup(group.id)}
                      onEditChannels={() => {
                        setActiveTab("routing")
                      }}
                      data-oid="q6zmqoe"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Routing Matrix View */}
        <TabsContent value="routing" className="flex-1 m-0" data-oid="1noo_37">
          <RoutingMatrix
            buses={buses}
            groups={groups}
            sends={sends}
            channelIds={channelIds}
            onCreateBus={createBus}
            onCreateGroup={createGroup}
            onCreateSend={createSend}
            onAssignChannelToBus={assignChannelToBus}
            onUpdateSendLevel={updateSendLevel}
            onSetBusMute={setBusMute}
            onSetBusSolo={setBusSolo}
            onSetGroupMute={setGroupMute}
            onSetGroupSolo={setGroupSolo}
            onDeleteBus={deleteBus}
            onDeleteGroup={deleteGroup}
            data-oid="_cj2v-g"
          />
        </TabsContent>

        {/* Groups Management View */}
        <TabsContent value="groups" className="flex-1 m-0 p-4" data-oid="q8xuvh7">
          <div className="space-y-4" data-oid="ank:f1j">
            <div className="flex items-center justify-between" data-oid="8r6xmy4">
              <h2 className="text-lg font-semibold text-zinc-200" data-oid="59c1kna">
                {t("fairlightAudio.mixerWithRouting.groups.channelGroups")}
              </h2>
              <Button onClick={() => setActiveTab("routing")} variant="secondary" data-oid="6rxb6hz">
                {t("fairlightAudio.mixerWithRouting.groups.manageGroups")}
              </Button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-8 text-zinc-500" data-oid="1kps:aa">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" data-oid="8opkowp" />
                <div className="text-lg mb-2" data-oid="j_utrgx">
                  {t("fairlightAudio.mixerWithRouting.groups.noGroupsCreated")}
                </div>
                <div className="text-sm" data-oid="t8io5g8">
                  {t("fairlightAudio.mixerWithRouting.groups.noGroupsDescription")}
                </div>
                <Button className="mt-4" onClick={() => setActiveTab("routing")} data-oid="n4k3a5_">
                  {t("fairlightAudio.mixerWithRouting.groups.createGroup")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-oid="af0353k">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 bg-zinc-800 rounded-lg border-l-4"
                    style={{ borderLeftColor: group.color }}
                    data-oid="d1vwh:3"
                  >
                    <div className="flex items-center justify-between mb-3" data-oid="tg60d_6">
                      <h3 className="font-semibold text-zinc-200" data-oid="moy0smz">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-1" data-oid="kwfl:mm">
                        <Button
                          size="sm"
                          variant={group.isSolo ? "default" : "secondary"}
                          onClick={() => setGroupSolo(group.id, !group.isSolo)}
                          className="h-6 w-6 p-0 bg-yellow-600 hover:bg-yellow-700"
                          data-oid="dt6jzvw"
                        >
                          S
                        </Button>
                        <Button
                          size="sm"
                          variant={group.isMuted ? "destructive" : "secondary"}
                          onClick={() => setGroupMute(group.id, !group.isMuted)}
                          className="h-6 w-6 p-0"
                          data-oid="8qbvae3"
                        >
                          M
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2" data-oid="bcv4qn7">
                      <div className="text-sm text-zinc-400" data-oid="lip0:gw">
                        {t("fairlightAudio.mixerWithRouting.groups.channels")} {group.channelIds.length}
                      </div>
                      <div className="text-xs text-zinc-500" data-oid="tdo.497">
                        {group.channelIds.join(", ")}
                      </div>
                      <div className="text-xs text-zinc-500" data-oid="-w_uswe">
                        {t("fairlightAudio.mixerWithRouting.groups.bus")} {group.busId.replace("_bus", "")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Sends Management View */}
        <TabsContent value="sends" className="flex-1 m-0 p-4" data-oid="y0v86qr">
          <div className="space-y-4" data-oid="h77t0.1">
            <div className="flex items-center justify-between" data-oid="56g2k2i">
              <h2 className="text-lg font-semibold text-zinc-200" data-oid="3x-9aaz">
                {t("fairlightAudio.mixerWithRouting.sends.title")}
              </h2>
              {selectedChannelForSends && (
                <Button variant="ghost" onClick={() => setSelectedChannelForSends(null)} data-oid="69bk9:y">
                  {t("fairlightAudio.mixerWithRouting.sends.closePanel")}
                </Button>
              )}
            </div>

            <div className="flex gap-4" data-oid="kd0u:-s">
              {/* Channel List */}
              <div className="w-48 space-y-2" data-oid="snq4ge_">
                <h3 className="text-sm font-semibold text-zinc-300" data-oid="ad94c3u">
                  {t("fairlightAudio.mixerWithRouting.sends.channels")}
                </h3>
                {channelIds.map((channelId) => {
                  const channelSends = getChannelSends(channelId)

                  return (
                    <Button
                      key={channelId}
                      variant={selectedChannelForSends === channelId ? "default" : "secondary"}
                      className="w-full justify-between h-auto p-3"
                      onClick={() => setSelectedChannelForSends(channelId)}
                      data-oid="9853r.7"
                    >
                      <div className="text-left" data-oid="id-ove_">
                        <div className="font-medium" data-oid=":pt.ce3">
                          {channelId}
                        </div>
                        <div className="text-xs opacity-70" data-oid="vep5:q3">
                          {channelSends.length} {t("fairlightAudio.mixerWithRouting.sends.sends")}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>

              {/* Send Panel */}
              <div className="flex-1" data-oid="51lo24d">
                {selectedChannelForSends ? (
                  <SendPanel
                    channelId={selectedChannelForSends}
                    sends={getChannelSends(selectedChannelForSends)}
                    availableBuses={buses}
                    onCreateSend={(busId, level, isPre) => createSend(selectedChannelForSends, busId, level, isPre)}
                    onUpdateSendLevel={updateSendLevel}
                    onToggleSendPre={toggleSendPre}
                    onToggleSendEnabled={toggleSendEnabled}
                    onDeleteSend={deleteSend}
                    data-oid="-zkv49y"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-zinc-500" data-oid="fl-9-kf">
                    <div className="text-center" data-oid="e8j22h_">
                      <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" data-oid="ed68cyf" />
                      <div data-oid="v-w7jc2">{t("fairlightAudio.mixerWithRouting.sends.selectChannel")}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

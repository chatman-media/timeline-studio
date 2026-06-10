import { Minus, Plus, Radio, Settings, Users, Volume2, VolumeX } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { cn } from "@/lib/utils"

import type { AudioBus, ChannelGroup, ChannelSend } from "../../services/bus-router"

interface RoutingMatrixProps {
  buses: AudioBus[]
  groups: ChannelGroup[]
  sends: ChannelSend[]
  channelIds: string[]
  onCreateBus: (name: string, type: AudioBus["type"]) => void
  onCreateGroup: (name: string, channelIds: string[], color: string) => void
  onCreateSend: (sourceChannelId: string, destinationBusId: string, level: number) => void
  onAssignChannelToBus: (channelId: string, busId: string) => void
  onUpdateSendLevel: (sendId: string, level: number) => void
  onSetBusMute: (busId: string, muted: boolean) => void
  onSetBusSolo: (busId: string, solo: boolean) => void
  onSetGroupMute: (groupId: string, muted: boolean) => void
  onSetGroupSolo: (groupId: string, solo: boolean) => void
  onDeleteBus: (busId: string) => void
  onDeleteGroup: (groupId: string) => void
}

export function RoutingMatrix({
  buses,
  groups,
  sends,
  channelIds,
  onCreateBus,
  onCreateGroup,
  onCreateSend,
  onAssignChannelToBus,
  onUpdateSendLevel,
  onSetBusMute,
  onSetBusSolo,
  onSetGroupMute,
  onSetGroupSolo,
  onDeleteBus,
  onDeleteGroup,
}: RoutingMatrixProps) {
  const { t } = useTranslation()
  const [newBusName, setNewBusName] = useState("")
  const [newBusType, setNewBusType] = useState<AudioBus["type"]>("stereo")
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [showSends, setShowSends] = useState(false)

  const handleCreateBus = () => {
    if (newBusName.trim()) {
      onCreateBus(newBusName.trim(), newBusType)
      setNewBusName("")
    }
  }

  const handleCreateGroup = () => {
    if (newGroupName.trim() && selectedChannels.length > 0) {
      onCreateGroup(newGroupName.trim(), selectedChannels, "#3b82f6")
      setNewGroupName("")
      setSelectedChannels([])
    }
  }

  const getChannelSends = (channelId: string) => {
    return sends.filter((send) => send.sourceChannelId === channelId)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950" data-oid="wv6tev6">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4" data-oid=":ard7::">
        <div className="flex items-center justify-between" data-oid="yfgh27q">
          <h2 className="text-lg font-semibold text-zinc-100" data-oid="tbxqusn">
            {t("fairlightAudio.routingMatrix.title")}
          </h2>
          <div className="flex items-center gap-2" data-oid="n21wdes">
            <Button
              size="sm"
              variant={showSends ? "default" : "secondary"}
              onClick={() => setShowSends(!showSends)}
              data-oid="2_dyk40"
            >
              <Radio className="w-4 h-4 mr-1" data-oid="plp_1gi" />
              {t("fairlightAudio.routingMatrix.sendsButton")}
            </Button>
            <Button size="sm" variant="secondary" data-oid="q4f38m2">
              <Settings className="w-4 h-4" data-oid="4jjepq9" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" data-oid="783m9w1">
        {/* Left Panel - Buses and Groups */}
        <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col" data-oid="8j6a4qj">
          {/* Buses Section */}
          <div className="p-4 border-b border-zinc-800" data-oid="yd4pdan">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3" data-oid="vdfyqgh">
              {t("fairlightAudio.routingMatrix.audioBuses")}
            </h3>

            {/* Create Bus */}
            <div className="space-y-2 mb-4" data-oid="u.7f7ko">
              <div className="flex gap-2" data-oid="745omn-">
                <Input
                  placeholder={t("fairlightAudio.routingMatrix.busName")}
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  className="h-8"
                  data-oid="mf6ii7i"
                />

                <Select
                  value={newBusType}
                  onValueChange={(v) => setNewBusType(v as AudioBus["type"])}
                  data-oid=".u.47dw"
                >
                  <SelectTrigger className="w-20 h-8" data-oid="fpl::z3">
                    <SelectValue data-oid="avj2m4c" />
                  </SelectTrigger>
                  <SelectContent data-oid="tjlj2em">
                    <SelectItem value="stereo" data-oid="7q_f5ms">
                      {t("fairlightAudio.routingMatrix.types.stereo")}
                    </SelectItem>
                    <SelectItem value="mono" data-oid="pfmple:">
                      {t("fairlightAudio.routingMatrix.types.mono")}
                    </SelectItem>
                    <SelectItem value="surround" data-oid="u43w7sb">
                      {t("fairlightAudio.routingMatrix.types.surround")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreateBus} className="h-8 px-2" data-oid="89s2ghn">
                  <Plus className="w-3 h-3" data-oid="hy:08ug" />
                </Button>
              </div>
            </div>

            {/* Bus List */}
            <div className="space-y-1" data-oid="t_nfa06">
              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded",
                    "bg-zinc-800 hover:bg-zinc-700 transition-colors",
                  )}
                  data-oid="v33us__"
                >
                  <div className="flex-1" data-oid="xc2090o">
                    <div className="text-sm text-zinc-200" data-oid="1apwp6f">
                      {bus.name}
                    </div>
                    <div className="text-xs text-zinc-500" data-oid="pkge1:9">
                      {bus.type}
                    </div>
                  </div>

                  <div className="flex items-center gap-1" data-oid="b9h9_yp">
                    <Button
                      size="sm"
                      variant={bus.isSolo ? "default" : "secondary"}
                      onClick={() => onSetBusSolo(bus.id, !bus.isSolo)}
                      className="h-6 w-6 p-0 bg-yellow-600 hover:bg-yellow-700"
                      data-oid="slunusx"
                    >
                      S
                    </Button>
                    <Button
                      size="sm"
                      variant={bus.isMuted ? "destructive" : "secondary"}
                      onClick={() => onSetBusMute(bus.id, !bus.isMuted)}
                      className="h-6 w-6 p-0"
                      data-oid="533ju2n"
                    >
                      {bus.isMuted ? (
                        <VolumeX className="w-3 h-3" data-oid="zeu3wy:" />
                      ) : (
                        <Volume2 className="w-3 h-3" data-oid="n.a9dk_" />
                      )}
                    </Button>
                    {bus.id !== "master" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteBus(bus.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        data-oid="iwndu71"
                      >
                        <Minus className="w-3 h-3" data-oid="pfhhv9f" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Groups Section */}
          <div className="p-4 flex-1 overflow-y-auto" data-oid="wwqttin">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3" data-oid="2p5uv4c">
              {t("fairlightAudio.routingMatrix.channelGroups")}
            </h3>

            {/* Create Group */}
            <div className="space-y-2 mb-4" data-oid="e6anjpw">
              <Input
                placeholder={t("fairlightAudio.routingMatrix.groupName")}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-8"
                data-oid=":ji1u6u"
              />

              <div className="space-y-1" data-oid="leneu4s">
                <div className="text-xs text-zinc-500" data-oid="69d0gs-">
                  {t("fairlightAudio.routingMatrix.selectChannels")}
                </div>
                <div className="max-h-20 overflow-y-auto space-y-1" data-oid="igl1xyb">
                  {channelIds.map((channelId) => (
                    <label key={channelId} className="flex items-center gap-2 text-sm" data-oid="ybl_:hb">
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(channelId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedChannels([...selectedChannels, channelId])
                          } else {
                            setSelectedChannels(selectedChannels.filter((id) => id !== channelId))
                          }
                        }}
                        className="rounded"
                        data-oid="746cy_7"
                      />

                      <span className="text-zinc-300" data-oid="44j-gqa">
                        {channelId}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedChannels.length === 0}
                className="w-full h-8"
                data-oid="tup26kk"
              >
                <Users className="w-3 h-3 mr-1" data-oid="_xu_m0e" />
                {t("fairlightAudio.routingMatrix.createGroup")}
              </Button>
            </div>

            {/* Group List */}
            <div className="space-y-2" data-oid="ys9q:cj">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-3 rounded bg-zinc-800 border-l-4"
                  style={{ borderLeftColor: group.color }}
                  data-oid="0.ie4ui"
                >
                  <div className="flex items-center justify-between mb-2" data-oid="vtc0tch">
                    <div className="text-sm font-medium text-zinc-200" data-oid="ytihh0w">
                      {group.name}
                    </div>
                    <div className="flex items-center gap-1" data-oid="6_2xv7n">
                      <Button
                        size="sm"
                        variant={group.isSolo ? "default" : "secondary"}
                        onClick={() => onSetGroupSolo(group.id, !group.isSolo)}
                        className="h-6 w-6 p-0 bg-yellow-600 hover:bg-yellow-700"
                        data-oid="9l7:0dv"
                      >
                        S
                      </Button>
                      <Button
                        size="sm"
                        variant={group.isMuted ? "destructive" : "secondary"}
                        onClick={() => onSetGroupMute(group.id, !group.isMuted)}
                        className="h-6 w-6 p-0"
                        data-oid="hsykj21"
                      >
                        {group.isMuted ? (
                          <VolumeX className="w-3 h-3" data-oid="gb-m6mi" />
                        ) : (
                          <Volume2 className="w-3 h-3" data-oid="gn.q0y-" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteGroup(group.id)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        data-oid="u.mkefo"
                      >
                        <Minus className="w-3 h-3" data-oid="y0jy_wt" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 mb-2" data-oid="7azu.x0">
                    Channels: {group.channelIds.join(", ")}
                  </div>

                  <div className="text-xs text-zinc-500" data-oid="_qm4269">
                    Bus: {group.busId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Routing Matrix */}
        <div className="flex-1 overflow-auto" data-oid="xu8p8uv">
          {showSends ? (
            /* Sends Matrix */
            <div className="p-4" data-oid="n_2bj4g">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4" data-oid="9ereafb">
                {t("fairlightAudio.routingMatrix.sendMatrix")}
              </h3>

              <div className="overflow-x-auto" data-oid="uwq4ncs">
                <table className="w-full border-collapse" data-oid="dhdqiq6">
                  <thead data-oid="_l0_1_:">
                    <tr data-oid="rl4ui99">
                      <th className="text-left p-2 text-zinc-400 border-b border-zinc-800" data-oid="1p0yz-y">
                        {t("fairlightAudio.routingMatrix.channel")}
                      </th>
                      {buses
                        .filter((bus) => bus.id !== "master")
                        .map((bus) => (
                          <th
                            key={bus.id}
                            className="text-center p-2 text-zinc-400 border-b border-zinc-800 min-w-24"
                            data-oid="_jggmft"
                          >
                            {bus.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody data-oid="4thzxoj">
                    {channelIds.map((channelId) => (
                      <tr key={channelId} className="border-b border-zinc-800/50" data-oid="pgd978b">
                        <td className="p-2 text-zinc-300 font-medium" data-oid="_8o2ehc">
                          {channelId}
                        </td>
                        {buses
                          .filter((bus) => bus.id !== "master")
                          .map((bus) => {
                            const existingSend = sends.find(
                              (send) => send.sourceChannelId === channelId && send.destinationBusId === bus.id,
                            )

                            return (
                              <td key={bus.id} className="p-2 text-center" data-oid="qj.4aux">
                                {existingSend ? (
                                  <div className="space-y-1" data-oid="l4ty-60">
                                    <Slider
                                      value={[existingSend.level * 100]}
                                      onValueChange={([value]) => onUpdateSendLevel(existingSend.id, value / 100)}
                                      min={0}
                                      max={100}
                                      step={1}
                                      className="w-16 mx-auto"
                                      data-oid="7jt8zd4"
                                    />

                                    <div className="text-xs text-zinc-500" data-oid="43zb57.">
                                      {Math.round(existingSend.level * 100)}%
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCreateSend(channelId, bus.id, 0.5)}
                                    className="h-6 w-6 p-0"
                                    data-oid="pw2v6:x"
                                  >
                                    <Plus className="w-3 h-3" data-oid="n_x7e6s" />
                                  </Button>
                                )}
                              </td>
                            )
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Channel Assignment Matrix */
            <div className="p-4" data-oid="skip1py">
              <h3 className="text-lg font-semibold text-zinc-200 mb-4" data-oid="js34sci">
                {t("fairlightAudio.routingMatrix.channelBusAssignment")}
              </h3>

              <div className="grid gap-3" data-oid="myn.fcx">
                {channelIds.map((channelId) => (
                  <div key={channelId} className="flex items-center gap-4 p-3 bg-zinc-800 rounded" data-oid="h9spd_6">
                    <div className="w-32 text-zinc-300 font-medium" data-oid="36b756n">
                      {channelId}
                    </div>
                    <div className="flex-1" data-oid="vukz7f1">
                      <Select onValueChange={(busId) => onAssignChannelToBus(channelId, busId)} data-oid="eqn.lgj">
                        <SelectTrigger className="w-48" data-oid="_flb4sb">
                          <SelectValue placeholder={t("fairlightAudio.routingMatrix.selectBus")} data-oid="elen0x4" />
                        </SelectTrigger>
                        <SelectContent data-oid="vb_uprf">
                          {buses.map((bus) => (
                            <SelectItem key={bus.id} value={bus.id} data-oid="8-v6o11">
                              {bus.name} ({bus.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-zinc-500" data-oid="gi-tws8">
                      {t("fairlightAudio.routingMatrix.sendsCount")} {getChannelSends(channelId).length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

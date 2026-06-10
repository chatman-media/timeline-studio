import { Plus, RotateCcw, RotateCw, Volume2, VolumeX, X } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { cn } from "@/lib/utils"

import type { AudioBus, ChannelSend } from "../../services/bus-router"

interface SendPanelProps {
  channelId: string
  sends: ChannelSend[]
  availableBuses: AudioBus[]
  onCreateSend: (destinationBusId: string, level: number, isPre: boolean) => void
  onUpdateSendLevel: (sendId: string, level: number) => void
  onToggleSendPre: (sendId: string, isPre: boolean) => void
  onToggleSendEnabled: (sendId: string, enabled: boolean) => void
  onDeleteSend: (sendId: string) => void
  className?: string
}

export function SendPanel({
  channelId,
  sends,
  availableBuses,
  onCreateSend,
  onUpdateSendLevel,
  onToggleSendPre,
  onToggleSendEnabled,
  onDeleteSend,
  className,
}: SendPanelProps) {
  const { t } = useTranslation()
  const [newSendBusId, setNewSendBusId] = useState("")
  const [newSendLevel, setNewSendLevel] = useState(50)
  const [newSendIsPre, setNewSendIsPre] = useState(false)

  // Получаем доступные шины (исключаем master и уже используемые)
  const usedBusIds = sends.map((send) => send.destinationBusId)
  const availableForSend = availableBuses.filter((bus) => bus.id !== "master" && !usedBusIds.includes(bus.id))

  const handleCreateSend = () => {
    if (newSendBusId) {
      onCreateSend(newSendBusId, newSendLevel / 100, newSendIsPre)
      setNewSendBusId("")
      setNewSendLevel(50)
      setNewSendIsPre(false)
    }
  }

  const convertToDb = (level: number): string => {
    if (level === 0) return "-∞"
    const db = 20 * Math.log10(level)
    return `${db.toFixed(1)} dB`
  }

  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 rounded p-3", className)} data-oid="wozdmk7">
      <div className="flex items-center justify-between mb-3" data-oid="whlg:4r">
        <h4 className="text-sm font-semibold text-zinc-200" data-oid="k::y22p">
          {t("fairlightAudio.sendPanel.title")} - {channelId}
        </h4>
        <span className="text-xs text-zinc-500" data-oid="t08ykpb">
          {sends.length} {t("fairlightAudio.sendPanel.active")}
        </span>
      </div>

      {/* Existing Sends */}
      <div className="space-y-3 mb-4" data-oid="_0up606">
        {sends.map((send) => {
          const bus = availableBuses.find((b) => b.id === send.destinationBusId)

          return (
            <div
              key={send.id}
              className={cn(
                "p-3 rounded bg-zinc-800 border-l-2",
                send.isEnabled ? "border-blue-500" : "border-zinc-600",
              )}
              data-oid="-xbgy.4"
            >
              {/* Send Header */}
              <div className="flex items-center justify-between mb-2" data-oid="ncutb7j">
                <div className="flex items-center gap-2" data-oid="f0_9jdh">
                  <span className="text-sm font-medium text-zinc-200" data-oid="qtpsyrg">
                    → {bus?.name || send.destinationBusId}
                  </span>
                  <span className="text-xs text-zinc-500" data-oid="dq0od4w">
                    ({bus?.type || t("fairlightAudio.sendPanel.unknown")})
                  </span>
                </div>

                <div className="flex items-center gap-1" data-oid="._ilroy">
                  {/* Pre/Post Toggle */}
                  <Button
                    size="sm"
                    variant={send.isPre ? "default" : "secondary"}
                    onClick={() => onToggleSendPre(send.id, !send.isPre)}
                    className="h-6 px-2"
                    title={
                      send.isPre
                        ? t("fairlightAudio.sendPanel.preFaderSend")
                        : t("fairlightAudio.sendPanel.postFaderSend")
                    }
                    data-oid="6ssxsst"
                  >
                    {send.isPre ? (
                      <RotateCcw className="w-3 h-3" data-oid="n:_v.i." />
                    ) : (
                      <RotateCw className="w-3 h-3" data-oid="h4warxy" />
                    )}
                  </Button>

                  {/* Enable/Disable Toggle */}
                  <Button
                    size="sm"
                    variant={send.isEnabled ? "default" : "secondary"}
                    onClick={() => onToggleSendEnabled(send.id, !send.isEnabled)}
                    className="h-6 w-6 p-0"
                    title={
                      send.isEnabled ? t("fairlightAudio.sendPanel.enabled") : t("fairlightAudio.sendPanel.disabled")
                    }
                    data-oid="upybc3s"
                  >
                    {send.isEnabled ? (
                      <Volume2 className="w-3 h-3" data-oid="0exx0h8" />
                    ) : (
                      <VolumeX className="w-3 h-3" data-oid="ev24cw4" />
                    )}
                  </Button>

                  {/* Delete Send */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteSend(send.id)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    title={t("fairlightAudio.sendPanel.deleteSend")}
                    data-oid="qj5ujpy"
                  >
                    <X className="w-3 h-3" data-oid="v4z.yu2" />
                  </Button>
                </div>
              </div>

              {/* Send Level Control */}
              <div className="space-y-2" data-oid="ecrty1b">
                <div className="flex items-center justify-between" data-oid="q4cbad1">
                  <span className="text-xs text-zinc-400" data-oid="i_hwt7z">
                    {t("fairlightAudio.sendPanel.level")}
                  </span>
                  <span className="text-xs text-zinc-300" data-oid="2ibsd0l">
                    {convertToDb(send.level)}
                  </span>
                </div>

                <Slider
                  value={[send.level * 100]}
                  onValueChange={([value]) => onUpdateSendLevel(send.id, value / 100)}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!send.isEnabled}
                  className={cn("w-full", !send.isEnabled && "opacity-50")}
                  data-oid="f2r3bxh"
                />

                <div className="flex justify-between text-xs text-zinc-500" data-oid="vpkqe0h">
                  <span data-oid="dr:1x9_">-∞</span>
                  <span data-oid=".:r26ws">0 dB</span>
                </div>
              </div>

              {/* Send Info */}
              <div className="mt-2 text-xs text-zinc-500" data-oid="6i81ys3">
                {send.isPre ? t("fairlightAudio.sendPanel.preFader") : t("fairlightAudio.sendPanel.postFader")} •
                {send.isEnabled
                  ? ` ${t("fairlightAudio.sendPanel.enabled")}`
                  : ` ${t("fairlightAudio.sendPanel.disabled")}`}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add New Send */}
      {availableForSend.length > 0 && (
        <div className="border-t border-zinc-800 pt-3" data-oid="oop0ykv">
          <div className="text-sm font-medium text-zinc-300 mb-2" data-oid="p31u4l:">
            {t("fairlightAudio.sendPanel.addSend")}
          </div>

          <div className="space-y-2" data-oid="gxw71c.">
            {/* Bus Selection */}
            <Select value={newSendBusId} onValueChange={setNewSendBusId} data-oid="sy11olh">
              <SelectTrigger className="h-8" data-oid="3pjria8">
                <SelectValue placeholder={t("fairlightAudio.sendPanel.selectDestinationBus")} data-oid="qhd4of0" />
              </SelectTrigger>
              <SelectContent data-oid="6gh--6n">
                {availableForSend.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id} data-oid="g7w2foi">
                    {bus.name} ({bus.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Level and Pre/Post */}
            <div className="flex items-center gap-2" data-oid="aji_p-6">
              <div className="flex-1" data-oid="w50ok2p">
                <div className="text-xs text-zinc-400 mb-1" data-oid="u7f1_iz">
                  {t("fairlightAudio.sendPanel.levelPercent")} {newSendLevel}%
                </div>
                <Slider
                  value={[newSendLevel]}
                  onValueChange={([value]) => setNewSendLevel(value)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                  data-oid="8.j2_hc"
                />
              </div>

              <Button
                size="sm"
                variant={newSendIsPre ? "default" : "secondary"}
                onClick={() => setNewSendIsPre(!newSendIsPre)}
                className="h-8 px-3"
                title={newSendIsPre ? t("fairlightAudio.sendPanel.preFader") : t("fairlightAudio.sendPanel.postFader")}
                data-oid="uq2aca."
              >
                {newSendIsPre ? t("fairlightAudio.sendPanel.pre") : t("fairlightAudio.sendPanel.post")}
              </Button>
            </div>

            {/* Create Button */}
            <Button
              size="sm"
              onClick={handleCreateSend}
              disabled={!newSendBusId}
              className="w-full h-8"
              data-oid="ks486ge"
            >
              <Plus className="w-3 h-3 mr-1" data-oid="lzrq-_k" />
              {t("fairlightAudio.sendPanel.addSend")}
            </Button>
          </div>
        </div>
      )}

      {/* No Available Buses */}
      {availableForSend.length === 0 && sends.length === 0 && (
        <div className="text-center py-4 text-zinc-500" data-oid="ag.:s0l">
          <div className="text-sm" data-oid="i6l:w9j">
            {t("fairlightAudio.sendPanel.noAvailableBuses")}
          </div>
          <div className="text-xs mt-1" data-oid="46d3nzt">
            {t("fairlightAudio.sendPanel.createBusesFirst")}
          </div>
        </div>
      )}
    </div>
  )
}

import { Button } from "@timeline-studio/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Circle, Hand, Lock, Play, Plus, Square } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

import type { AutomationLane, AutomationMode } from "../../services/automation-engine"

interface AutomationPanelProps {
  mode: AutomationMode
  isRecording: boolean
  lanes: AutomationLane[]
  onModeChange: (mode: AutomationMode) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onAddLane: (channelId: string, parameterId: string) => void
  onClearLane: (laneId: string) => void
  className?: string
}

export function AutomationPanel({
  mode,
  isRecording,
  lanes,
  onModeChange,
  onStartRecording,
  onStopRecording,
  onAddLane,
  className,
}: AutomationPanelProps) {
  const { t } = useTranslation()
  const [selectedChannel, setSelectedChannel] = useState("")
  const [selectedParameter, setSelectedParameter] = useState("")

  const availableParameters = [
    { id: "volume", name: t("fairlightAudio.automation.parameters.volume") },
    { id: "pan", name: t("fairlightAudio.automation.parameters.pan") },
    { id: "eq.lowGain", name: t("fairlightAudio.automation.parameters.eqLow") },
    { id: "eq.midGain", name: t("fairlightAudio.automation.parameters.eqMid") },
    {
      id: "eq.highGain",
      name: t("fairlightAudio.automation.parameters.eqHigh"),
    },
    {
      id: "compressor.threshold",
      name: t("fairlightAudio.automation.parameters.compThreshold"),
    },
    {
      id: "compressor.ratio",
      name: t("fairlightAudio.automation.parameters.compRatio"),
    },
    {
      id: "reverb.wetLevel",
      name: t("fairlightAudio.automation.parameters.reverbWet"),
    },
  ]

  const modeButtons = [
    {
      mode: "off" as const,
      icon: Square,
      label: t("fairlightAudio.automation.modes.off.name"),
      description: t("fairlightAudio.automation.modes.off.description"),
    },
    {
      mode: "read" as const,
      icon: Play,
      label: t("fairlightAudio.automation.modes.read.name"),
      description: t("fairlightAudio.automation.modes.read.description"),
    },
    {
      mode: "write" as const,
      icon: Circle,
      label: t("fairlightAudio.automation.modes.write.name"),
      description: t("fairlightAudio.automation.modes.write.description"),
    },
    {
      mode: "touch" as const,
      icon: Hand,
      label: t("fairlightAudio.automation.modes.touch.name"),
      description: t("fairlightAudio.automation.modes.touch.description"),
    },
    {
      mode: "latch" as const,
      icon: Lock,
      label: t("fairlightAudio.automation.modes.latch.name"),
      description: t("fairlightAudio.automation.modes.latch.description"),
    },
  ]

  const uniqueChannels = Array.from(new Set(lanes.map((lane) => lane.channelId)))

  const handleAddLane = () => {
    if (selectedChannel && selectedParameter) {
      onAddLane(selectedChannel, selectedParameter)
      setSelectedParameter("")
    }
  }

  return (
    <div className={cn("bg-zinc-900 border-b border-zinc-800 p-3", className)} data-oid="2l:x9qp">
      <div className="flex items-center gap-4" data-oid=":_4-wl9">
        {/* Automation Mode Buttons */}
        <div className="flex items-center gap-1" data-oid="ym3y:5p">
          <span className="text-xs text-zinc-400 mr-2" data-oid="pj-n9pk">
            {t("fairlightAudio.automation.controls.mode")}
          </span>
          {modeButtons.map(({ mode: buttonMode, icon: Icon, label }) => (
            <Button
              key={buttonMode}
              size="sm"
              variant={mode === buttonMode ? "default" : "secondary"}
              onClick={() => onModeChange(buttonMode)}
              className={cn("h-8 px-2", mode === buttonMode && "bg-blue-600 hover:bg-blue-700")}
              title={modeButtons.find((b) => b.mode === buttonMode)?.description}
              data-oid="8xs.1ij"
            >
              <Icon className="w-3 h-3 mr-1" data-oid="ktdx5yt" />
              {label}
            </Button>
          ))}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-2 ml-4" data-oid="mg2ul00">
          {isRecording ? (
            <Button size="sm" variant="destructive" onClick={onStopRecording} className="h-8" data-oid="e34l.g:">
              <Square className="w-3 h-3 mr-1 fill-current" data-oid="nrzurh9" />
              {t("fairlightAudio.automation.controls.stop")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={onStartRecording}
              disabled={mode === "off" || mode === "read"}
              className="h-8 bg-red-600 hover:bg-red-700"
              data-oid="fovu-3l"
            >
              <Circle className="w-3 h-3 mr-1 fill-current" data-oid="tbe:j.:" />
              {t("fairlightAudio.automation.controls.record")}
            </Button>
          )}
        </div>

        {/* Add Lane Controls */}
        <div className="flex items-center gap-2 ml-auto" data-oid="djdm1x:">
          <Select value={selectedChannel} onValueChange={setSelectedChannel} data-oid="hbk7szp">
            <SelectTrigger className="w-32 h-8" data-oid="hpzy7yn">
              <SelectValue placeholder={t("fairlightAudio.automation.controls.channel")} data-oid="6706_ce" />
            </SelectTrigger>
            <SelectContent data-oid="lnxc316">
              {uniqueChannels.map((channelId) => (
                <SelectItem key={channelId} value={channelId} data-oid="top_7ku">
                  {channelId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedParameter} onValueChange={setSelectedParameter} data-oid="9k3.7vo">
            <SelectTrigger className="w-32 h-8" data-oid="9-sw37:">
              <SelectValue placeholder={t("fairlightAudio.automation.controls.parameter")} data-oid="n4zreec" />
            </SelectTrigger>
            <SelectContent data-oid="wdm1y4e">
              {availableParameters.map((param) => (
                <SelectItem key={param.id} value={param.id} data-oid="-j3gk3f">
                  {param.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddLane}
            disabled={!selectedChannel || !selectedParameter}
            className="h-8 px-2"
            data-oid="2zqt4pb"
          >
            <Plus className="w-3 h-3" data-oid="dpxdvs0" />
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-500" data-oid="x-uqg.d">
        <span data-oid="t5ac:g0">
          {t("fairlightAudio.automation.status.lanes", { count: lanes.length })} •{" "}
          {t("fairlightAudio.automation.status.mode", { mode })}
          {isRecording && ` • ${t("fairlightAudio.automation.status.recording")}`}
        </span>

        {mode !== "off" && (
          <span data-oid="m_1j687">
            {mode === "read" && t("fairlightAudio.automation.status.reading")}
            {mode === "write" && t("fairlightAudio.automation.status.willOverwrite")}
            {mode === "touch" && t("fairlightAudio.automation.status.touchToStart")}
            {mode === "latch" && t("fairlightAudio.automation.status.touchToLatch")}
          </span>
        )}
      </div>
    </div>
  )
}

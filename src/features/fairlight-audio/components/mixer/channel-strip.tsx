import { Settings } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { LevelMeter } from "../meters/level-meter"
import { Fader } from "./fader"

export interface ChannelStripProps {
  channelId: string
  name: string
  type: "mono" | "stereo" | "surround"
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  armed: boolean
  onVolumeChange: (value: number) => void
  onPanChange: (value: number) => void
  onMute: () => void
  onSolo: () => void
  onArm: () => void
  onSettings?: () => void
  audioContext?: AudioContext
  analyser?: AnalyserNode
  className?: string
}

export function ChannelStrip({
  name,
  type,
  volume,
  pan,
  muted,
  solo,
  armed,
  onVolumeChange,
  onPanChange,
  onMute,
  onSolo,
  onArm,
  onSettings,
  audioContext,
  analyser,
  className,
}: ChannelStripProps) {
  const { t } = useTranslation()
  const [showEq, setShowEq] = useState(false)

  return (
    <div
      className={cn("flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg p-2 w-20", className)}
      data-oid="eb6lobz"
    >
      {/* Channel header */}
      <div className="flex items-center justify-between mb-2" data-oid="wxywc8b">
        <span className="text-xs font-medium text-zinc-300 truncate flex-1" data-oid="._ki-14">
          {name}
        </span>
        <button onClick={onSettings} className="p-1 hover:bg-zinc-800 rounded transition-colors" data-oid="tyjf0be">
          <Settings className="h-3 w-3 text-zinc-500" data-oid="kez.rea" />
        </button>
      </div>

      {/* Input type indicator */}
      <div className="flex items-center justify-center mb-2" data-oid="fm9ew93">
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded",
            type === "stereo" && "bg-blue-900 text-blue-300",
            type === "mono" && "bg-zinc-800 text-zinc-400",
            type === "surround" && "bg-purple-900 text-purple-300",
          )}
          data-oid="p6jqnj:"
        >
          {type.toUpperCase()}
        </span>
      </div>

      {/* EQ Section (placeholder) */}
      <div className="h-16 bg-zinc-800 rounded mb-2 p-1" data-oid="g0us2jb">
        <button
          onClick={() => setShowEq(!showEq)}
          className="w-full h-full flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300"
          data-oid="bl:uhc-"
        >
          {t("fairlightAudio.mixer.channelStrip.eq")}
        </button>
      </div>

      {/* Effects sends (placeholder) */}
      <div className="flex flex-col gap-1 mb-2" data-oid="skzr14o">
        <div
          className="h-6 bg-zinc-800 rounded text-[10px] text-zinc-500 flex items-center justify-center"
          data-oid="tlt5knq"
        >
          {t("fairlightAudio.mixer.channelStrip.send1")}
        </div>
        <div
          className="h-6 bg-zinc-800 rounded text-[10px] text-zinc-500 flex items-center justify-center"
          data-oid="uaiftir"
        >
          {t("fairlightAudio.mixer.channelStrip.send2")}
        </div>
      </div>

      {/* Pan control */}
      <div className="mb-2" data-oid="z9xksn2">
        <div className="text-[10px] text-zinc-500 text-center mb-1" data-oid="1_qoxv.">
          {t("fairlightAudio.mixer.channelStrip.pan")}
        </div>
        <div className="relative h-6 bg-zinc-800 rounded" data-oid="9umi:_4">
          <input
            type="range"
            min="-100"
            max="100"
            value={pan}
            onChange={(e) => onPanChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            data-oid="ywo4xzd"
          />

          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-400 rounded-full transition-all pointer-events-none"
            style={{
              left: `${(pan + 100) / 2}%`,
              transform: "translateX(-50%) translateY(-50%)",
            }}
            data-oid="xdp0sgt"
          />
        </div>
      </div>

      {/* Record arm button */}
      <button
        onClick={onArm}
        className={cn(
          "h-6 rounded mb-2 text-xs font-bold transition-colors",
          armed ? "bg-red-600 text-white hover:bg-red-700" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700",
        )}
        data-oid="6xs-p5v"
      >
        {t("fairlightAudio.mixer.channelStrip.right")}
      </button>

      {/* Fader section with level meter */}
      <div className="flex-1 flex justify-center gap-1" data-oid="uw-7uje">
        {audioContext && analyser && (
          <LevelMeter
            audioContext={audioContext}
            source={analyser}
            channels={type === "mono" ? 1 : 2}
            orientation="vertical"
            className="h-full"
            data-oid="hd-.589"
          />
        )}
        <Fader
          value={volume}
          onChange={onVolumeChange}
          muted={muted}
          solo={solo}
          onMute={onMute}
          onSolo={onSolo}
          dbScale
          data-oid="-i9ud48"
        />
      </div>

      {/* Output routing (placeholder) */}
      <div className="mt-2 pt-2 border-t border-zinc-800" data-oid="vcg2pr9">
        <select className="w-full text-[10px] bg-zinc-800 text-zinc-400 rounded px-1 py-0.5" data-oid="f7jwaag">
          <option data-oid=".4-9h4y">{t("fairlightAudio.mixer.channelStrip.outputs.main")}</option>
          <option data-oid="nln2t6f">{t("fairlightAudio.mixer.channelStrip.outputs.bus1")}</option>
          <option data-oid="kk54.q6">{t("fairlightAudio.mixer.channelStrip.outputs.bus2")}</option>
        </select>
      </div>
    </div>
  )
}

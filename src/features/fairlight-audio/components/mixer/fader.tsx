import { useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

import { useAutomation } from "../../hooks/use-automation"

interface FaderProps {
  value: number // 0-100
  onChange: (value: number) => void
  label?: string
  muted?: boolean
  solo?: boolean
  onMute?: () => void
  onSolo?: () => void
  dbScale?: boolean // Show dB scale instead of percentage
  className?: string
  channelId?: string // For automation
  parameterId?: string // For automation
}

export function Fader({
  value,
  onChange,
  label,
  muted = false,
  solo = false,
  onMute,
  onSolo,
  dbScale = true,
  className,
  channelId,
  parameterId = "volume",
}: FaderProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const faderRef = useRef<HTMLDivElement>(null)
  const { writeParameter, touchParameter, releaseParameter } = useAutomation()

  // Convert percentage to dB (0% = -∞ dB, 100% = 0 dB)
  const percentToDb = (percent: number): string => {
    if (percent === 0) return "-∞"
    const db = 20 * Math.log10(percent / 100)
    return db.toFixed(1)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateValue(e)

    // Touch parameter for automation
    if (channelId && parameterId) {
      touchParameter(channelId, parameterId)
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !faderRef.current) return

      const rect = faderRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height
      const newValue = Math.max(0, Math.min(100, (1 - y / height) * 100))
      onChange(newValue)

      // Write automation data
      if (channelId && parameterId) {
        writeParameter(channelId, parameterId, newValue / 100)
      }
    },
    [isDragging, onChange, channelId, parameterId, writeParameter],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)

    // Release parameter for automation
    if (channelId && parameterId) {
      releaseParameter(channelId, parameterId)
    }
  }, [channelId, parameterId, releaseParameter])

  const updateValue = (e: React.MouseEvent) => {
    if (!faderRef.current) return

    const rect = faderRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    const newValue = Math.max(0, Math.min(100, (1 - y / height) * 100))
    onChange(newValue)

    // Write automation data on initial touch
    if (channelId && parameterId) {
      writeParameter(channelId, parameterId, newValue / 100)
    }
  }

  // Add global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-oid=".d8:c5b">
      {/* Solo/Mute buttons */}
      <div className="flex gap-1" data-oid=":sowxxg">
        <button
          onClick={onSolo}
          className={cn(
            "h-6 w-6 rounded text-xs font-bold transition-colors",
            solo ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
          )}
          data-oid="yai1r0g"
        >
          {t("fairlightAudio.mixer.fader.solo")}
        </button>
        <button
          onClick={onMute}
          className={cn(
            "h-6 w-6 rounded text-xs font-bold transition-colors",
            muted ? "bg-red-500 text-white hover:bg-red-600" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
          )}
          data-oid="diou7c8"
        >
          {t("fairlightAudio.mixer.fader.mute")}
        </button>
      </div>

      {/* Fader track */}
      <div className="relative h-40 w-12" data-oid="u_58vbi">
        {/* Background track */}
        <div className="absolute inset-x-0 top-2 bottom-2 mx-auto w-1 bg-zinc-700 rounded-full" data-oid="rt-7bwj" />

        {/* Value track */}
        <div
          className="absolute inset-x-0 bottom-2 mx-auto w-1 bg-blue-500 rounded-full transition-all"
          style={{ height: `${(value / 100) * (100 - 8)}%`, top: "auto" }}
          data-oid="qoejoa4"
        />

        {/* Fader handle */}
        <div
          ref={faderRef}
          className="absolute inset-0 cursor-pointer"
          onMouseDown={handleMouseDown}
          data-oid="po2l2n2"
        >
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-8 h-3 bg-zinc-300 rounded-sm transition-all",
              "hover:bg-zinc-200 shadow-md",
              isDragging && "bg-zinc-200 scale-110",
            )}
            style={{ top: `${(1 - value / 100) * (100 - 8)}%` }}
            data-oid="lk:qr9d"
          />
        </div>

        {/* dB scale marks */}
        {dbScale && (
          <div className="absolute inset-y-2 -left-8 w-6 text-[10px] text-zinc-500" data-oid="oyly7mg">
            <div className="absolute top-0" data-oid="5ni0:f2">
              {t("fairlightAudio.mixer.fader.dbMarkers.zero")}
            </div>
            <div className="absolute top-1/4" data-oid="i1xd2t7">
              {t("fairlightAudio.mixer.fader.dbMarkers.minus6")}
            </div>
            <div className="absolute top-1/2" data-oid="r4lm_ko">
              {t("fairlightAudio.mixer.fader.dbMarkers.minus12")}
            </div>
            <div className="absolute top-3/4" data-oid=".rkhl0l">
              {t("fairlightAudio.mixer.fader.dbMarkers.minus24")}
            </div>
            <div className="absolute bottom-0" data-oid="daewlw5">
              {t("fairlightAudio.mixer.fader.dbMarkers.infinity")}
            </div>
          </div>
        )}
      </div>

      {/* Current value */}
      <div className="text-xs text-zinc-400" data-oid="y42nfd5">
        {dbScale ? `${percentToDb(value)} dB` : `${value}%`}
      </div>

      {/* Label */}
      {label && (
        <div className="text-xs text-zinc-300 text-center truncate max-w-[48px]" data-oid="vbpdhnf">
          {label}
        </div>
      )}
    </div>
  )
}

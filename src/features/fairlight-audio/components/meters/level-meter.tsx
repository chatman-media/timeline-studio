import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface LevelMeterProps {
  audioContext?: AudioContext
  source?: AudioNode
  channels?: 1 | 2 // Mono or stereo
  orientation?: "vertical" | "horizontal"
  className?: string
}

export function LevelMeter({
  audioContext,
  source,
  channels = 2,
  orientation = "vertical",
  className,
}: LevelMeterProps) {
  const [levels, setLevels] = useState<number[]>(Array(channels).fill(-60))
  const [peaks, setPeaks] = useState<number[]>(Array(channels).fill(-60))
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    if (!audioContext || !source) return

    // Create analyser node
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    // Connect source to analyser
    source.connect(analyser)
    analyserRef.current = analyser

    // Create data array
    const dataArray = new Float32Array(analyser.frequencyBinCount)

    // Animation loop
    const updateLevels = () => {
      if (!analyserRef.current) return

      analyserRef.current.getFloatTimeDomainData(dataArray)

      // Calculate RMS for each channel
      const newLevels: number[] = []
      const channelSize = dataArray.length / channels

      for (let ch = 0; ch < channels; ch++) {
        let sum = 0
        const start = ch * channelSize
        const end = start + channelSize

        for (let i = start; i < end; i++) {
          sum += dataArray[i] * dataArray[i]
        }

        const rms = Math.sqrt(sum / channelSize)
        const db = 20 * Math.log10(Math.max(0.00001, rms))
        newLevels.push(db)
      }

      setLevels(newLevels)

      // Update peaks
      setPeaks((prev) =>
        prev.map((peak, i) => {
          const newLevel = newLevels[i]
          if (newLevel > peak) return newLevel
          return peak - 0.5 // Peak hold decay
        }),
      )

      animationRef.current = requestAnimationFrame(updateLevels)
    }

    updateLevels()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (analyserRef.current && source) {
        try {
          source.disconnect(analyserRef.current)
        } catch {
          // Node may have already been disconnected
        }
      }
    }
  }, [audioContext, source, channels])

  const renderMeter = (level: number, peak: number, index: number) => {
    // Convert dB to percentage (0 dB = 100%, -60 dB = 0%)
    const levelPercent = Math.max(0, Math.min(100, ((level + 60) / 60) * 100))
    const peakPercent = Math.max(0, Math.min(100, ((peak + 60) / 60) * 100))

    // Color based on level
    const getColor = (percent: number) => {
      if (percent > 90) return "bg-red-500"
      if (percent > 70) return "bg-yellow-500"
      return "bg-green-500"
    }

    if (orientation === "vertical") {
      return (
        <div key={index} className="relative w-4 h-full bg-zinc-800 rounded" data-oid="uyc.nv9">
          {/* Level bar */}
          <div
            className={cn("absolute bottom-0 left-0 right-0 transition-all duration-75", getColor(levelPercent))}
            style={{ height: `${levelPercent}%` }}
            data-oid="cmw5abd"
          />

          {/* Peak indicator */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-white"
            style={{ bottom: `${peakPercent}%` }}
            data-oid="o:5lok2"
          />

          {/* Scale marks */}
          <div className="absolute inset-0 flex flex-col justify-between py-1" data-oid="apcpvlo">
            {[0, -6, -12, -24, -48].map((db, i) => (
              <div key={db} className="h-px bg-zinc-600" style={{ opacity: i === 0 ? 1 : 0.5 }} data-oid="325q-1u" />
            ))}
          </div>
        </div>
      )
    }

    // Horizontal orientation
    return (
      <div key={index} className="relative h-4 w-full bg-zinc-800 rounded" data-oid="qzf3yl4">
        {/* Level bar */}
        <div
          className={cn("absolute top-0 left-0 bottom-0 transition-all duration-75", getColor(levelPercent))}
          style={{ width: `${levelPercent}%` }}
          data-oid="ngt744p"
        />

        {/* Peak indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white"
          style={{ left: `${peakPercent}%` }}
          data-oid="vwk3zhs"
        />
      </div>
    )
  }

  return (
    <div
      className={cn("flex gap-1", orientation === "vertical" ? "flex-row h-full" : "flex-col w-full", className)}
      data-oid="cnu5kpa"
    >
      {levels.map((level, i) => renderMeter(level, peaks[i], i))}
    </div>
  )
}

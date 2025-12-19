import { useEffect, useRef, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

const logger = createLogger("SimpleWaveform")

interface SimpleWaveformProps {
  audioElement?: HTMLAudioElement | null
  height?: number
  className?: string
}

export function SimpleWaveform({ audioElement, height = 60, className }: SimpleWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null)

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Draw waveform (real or placeholder)
    const drawWaveform = (data?: Float32Array) => {
      ctx.clearRect(0, 0, rect.width, height)

      // Background
      ctx.fillStyle = "#27272a" // zinc-800
      ctx.fillRect(0, 0, rect.width, height)

      if (data && data.length > 0) {
        // Draw real waveform
        const barWidth = 2
        const barGap = 1
        const barCount = Math.floor(rect.width / (barWidth + barGap))
        const samplesPerBar = Math.floor(data.length / barCount)

        ctx.fillStyle = "#3b82f6" // blue-500

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + barGap)

          // Get peak value for this bar
          let peak = 0
          const startSample = i * samplesPerBar
          const endSample = Math.min(startSample + samplesPerBar, data.length)

          for (let j = startSample; j < endSample; j++) {
            const sample = Math.abs(data[j])
            if (sample > peak) peak = sample
          }

          const barHeight = peak * height * 0.8
          const y = (height - barHeight) / 2

          ctx.fillRect(x, y, barWidth, barHeight)
        }
      } else {
        // Draw placeholder waveform
        ctx.fillStyle = "#3b82f6" // blue-500
        const barWidth = 2
        const barGap = 1
        const barCount = Math.floor(rect.width / (barWidth + barGap))

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + barGap)
          const barHeight = Math.random() * height * 0.8 + height * 0.1
          const y = (height - barHeight) / 2

          ctx.fillRect(x, y, barWidth, barHeight)
        }
      }

      // Center line
      ctx.strokeStyle = "#71717a" // zinc-500
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(rect.width, height / 2)
      ctx.stroke()
    }

    // Analyze audio file
    const analyzeAudio = async () => {
      if (!audioElement.src) {
        drawWaveform()
        return
      }

      setIsAnalyzing(true)

      try {
        // Fetch audio data
        const response = await fetch(audioElement.src)
        const arrayBuffer = await response.arrayBuffer()

        // Create offline context for analysis
        const offlineContext = new OfflineAudioContext(1, 44100 * 10, 44100)

        // Decode audio data
        const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer)

        // Get channel data (use first channel for mono/stereo)
        const channelData = audioBuffer.getChannelData(0)

        // Downsample for visualization
        const targetSamples = 1000 // Number of samples for visualization
        const samplesPerPixel = Math.floor(channelData.length / targetSamples)
        const downsampled = new Float32Array(targetSamples)

        for (let i = 0; i < targetSamples; i++) {
          const start = i * samplesPerPixel
          const end = Math.min(start + samplesPerPixel, channelData.length)

          // Get peak value in this range
          let peak = 0
          for (let j = start; j < end; j++) {
            const sample = Math.abs(channelData[j])
            if (sample > peak) peak = sample
          }

          downsampled[i] = peak
        }

        setWaveformData(downsampled)
        drawWaveform(downsampled)
      } catch (error) {
        logger.error("Failed to analyze audio:", { error })
        drawWaveform() // Draw placeholder on error
      } finally {
        setIsAnalyzing(false)
      }
    }

    // Check if we already have waveform data
    if (waveformData) {
      drawWaveform(waveformData)
    } else {
      void analyzeAudio()
    }
  }, [audioElement, height, waveformData])

  return (
    <div className={cn("relative", className)} data-oid="oaoej8e">
      <canvas ref={canvasRef} className="w-full" style={{ height: `${height}px` }} data-oid="h.5f5:-" />
      {isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50" data-oid="d_-p9a0">
          <span className="text-xs text-white" data-oid="dm94.vy">
            Analyzing...
          </span>
        </div>
      )}
    </div>
  )
}

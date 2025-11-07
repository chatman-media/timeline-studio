// components/Waveform.tsx
import { memo, useEffect, useRef, useState } from "react"

import WaveSurfer from "wavesurfer.js"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("Waveform")

interface WaveformProps {
  audioUrl: string
  className?: string
}

function Waveform({ audioUrl, className }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!audioUrl) return

    async function fetchAudio(): Promise<void> {
      try {
        // Отменяем предыдущий запрос, если он существует
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        // Создаем новый контроллер для этого запроса
        abortControllerRef.current = new AbortController()
        const { signal } = abortControllerRef.current

        const response = await fetch(audioUrl, { signal })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()
        if (blob.size === 0) {
          throw new Error("Received empty audio blob")
        }

        // Проверяем тип аудиофайла
        if (!blob.type.startsWith("audio/")) {
          throw new Error(`Invalid audio type: ${blob.type}`)
        }

        // Проверяем поддерживаемые форматы
        const supportedFormats = [
          "audio/mpeg",
          "audio/wav",
          "audio/ogg",
          "audio/webm",
          "audio/aiff",
          "audio/x-aiff",
          "audio/mp4",
          "audio/aac",
        ]
        if (!supportedFormats.some((format) => blob.type.includes(format.split("/")[1]))) {
          logger.warn(`Potentially unsupported audio format: ${blob.type}`)
        }

        setAudioBlob(blob)
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          logger.info("Fetch aborted")
          return
        }
        logger.error("Error fetching audio:", error)
      }
    }

    void fetchAudio()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [audioUrl])

  useEffect(() => {
    if (!containerRef.current || !audioBlob || wavesurferRef.current) return

    const audioUrl = URL.createObjectURL(audioBlob)

    try {
      wavesurferRef.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "rgba(255, 255, 255, 0.7)",
        progressColor: "rgba(255, 255, 255, 0.9)",
        url: audioUrl,
        normalize: true,
        height: 64, // Высота волны в пикселях
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 0,
        hideScrollbar: true,
        backend: "WebAudio",
        audioRate: 1,
        interact: false,
        fetchParams: {
          cache: "default",
          mode: "cors",
          method: "GET",
          credentials: "same-origin",
          redirect: "follow",
          referrer: "client",
        },
      })

      wavesurferRef.current.on("ready", () => {
        logger.info("WaveSurfer is ready")
      })

      wavesurferRef.current.on("error", (err) => {
        logger.error("WaveSurfer error:", err)
      })

      wavesurferRef.current.on("loading", (percent) => {
        logger.info("Loading:", percent)
      })
    } catch (error: unknown) {
      logger.error("Error creating WaveSurfer:", error)
    }

    return () => {
      wavesurferRef.current?.destroy()
      wavesurferRef.current = null
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioBlob])

  return <div ref={containerRef} className={className || "w-full h-full"} />
}

Waveform.displayName = "Waveform"

export default memo(Waveform)

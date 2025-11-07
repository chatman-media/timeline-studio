import { Circle, Clock, Download, Play, Plus, Square, Trash2, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { createLogger } from "@/lib/tauri-logger"
import { useMidi } from "../../hooks/use-midi"
import type { MidiTrack } from "../../services/midi/midi-sequencer"

const logger = createLogger({ module: "MidiSequencerView" })

export function MidiSequencerView() {
  const { t } = useTranslation()
  const { devices } = useMidi()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tracks, setTracks] = useState<MidiTrack[]>([])
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [position, setPosition] = useState(0)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopStart, setLoopStart] = useState(0)
  const [loopEnd, setLoopEnd] = useState(16)
  const [syncMode, setSyncMode] = useState<"internal" | "external">("internal")

  const midi = useMidi()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Инициализация
  useEffect(() => {
    if (!midi.isInitialized) return

    const engine = (midi as any).engineRef?.current
    if (!engine) return

    // Подписка на события
    const handleTrackUpdate = () => {
      setTracks(engine.sequencer.getTracks())
    }

    const handlePositionChange = (pos: number) => {
      setPosition(pos)
    }

    const handleBpmChange = (newBpm: number) => {
      setBpm(newBpm)
    }

    const handlePlaybackStarted = () => setIsPlaying(true)
    const handlePlaybackStopped = () => setIsPlaying(false)
    const handleRecordingStarted = () => setIsRecording(true)
    const handleRecordingStopped = () => setIsRecording(false)

    engine.sequencer.on("trackCreated", handleTrackUpdate)
    engine.sequencer.on("trackDeleted", handleTrackUpdate)
    engine.sequencer.on("trackUpdated", handleTrackUpdate)
    engine.clock.on("positionChange", handlePositionChange)
    engine.clock.on("bpmChange", handleBpmChange)
    engine.sequencer.on("playbackStarted", handlePlaybackStarted)
    engine.sequencer.on("playbackStopped", handlePlaybackStopped)
    engine.sequencer.on("recordingStarted", handleRecordingStarted)
    engine.sequencer.on("recordingStopped", handleRecordingStopped)

    // Загружаем начальные данные
    setTracks(engine.sequencer.getTracks())
    setBpm(engine.clock.getBPM())
    setPosition(engine.clock.getPosition())

    return () => {
      engine.sequencer.off("trackCreated", handleTrackUpdate)
      engine.sequencer.off("trackDeleted", handleTrackUpdate)
      engine.sequencer.off("trackUpdated", handleTrackUpdate)
      engine.clock.off("positionChange", handlePositionChange)
      engine.clock.off("bpmChange", handleBpmChange)
      engine.sequencer.off("playbackStarted", handlePlaybackStarted)
      engine.sequencer.off("playbackStopped", handlePlaybackStopped)
      engine.sequencer.off("recordingStarted", handleRecordingStarted)
      engine.sequencer.off("recordingStopped", handleRecordingStopped)
    }
  }, [midi.isInitialized])

  // Визуализация piano roll
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Очистка
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Настройки
    const noteHeight = 4
    const noteRange = 128 // MIDI notes 0-127
    const beatWidth = 50
    const visibleBeats = 16

    // Сетка
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1

    // Вертикальные линии (beats)
    for (let beat = 0; beat <= visibleBeats; beat++) {
      const x = beat * beatWidth
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Горизонтальные линии (notes)
    for (let note = 0; note < noteRange; note += 12) {
      const y = canvas.height - (note + 1) * noteHeight
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Отрисовка событий выбранного трека
    if (selectedTrack) {
      const track = tracks.find((t) => t.id === selectedTrack)
      if (track) {
        ctx.fillStyle = "#3b82f6"

        for (const event of track.events) {
          if (event.message.type === "noteon" && event.message.data.note) {
            const x = event.timestamp * beatWidth
            const y = canvas.height - (event.message.data.note + 1) * noteHeight
            const width = (event.duration || 0.25) * beatWidth
            const height = noteHeight - 1

            ctx.fillRect(x, y, width, height)
          }
        }
      }
    }

    // Позиция воспроизведения
    const playheadX = position * beatWidth
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, canvas.height)
    ctx.stroke()

    // Область луп
    if (loopEnabled) {
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
      const loopStartX = loopStart * beatWidth
      const loopWidth = (loopEnd - loopStart) * beatWidth
      ctx.fillRect(loopStartX, 0, loopWidth, canvas.height)
    }
  }, [tracks, selectedTrack, position, loopEnabled, loopStart, loopEnd])

  // Управление транспортом
  const handlePlay = useCallback(() => {
    const engine = (midi as any).engineRef?.current
    if (!engine) return

    if (isPlaying) {
      engine.sequencer.stopPlayback()
    } else {
      engine.sequencer.startPlayback()
    }
  }, [isPlaying, midi])

  const handleStop = useCallback(() => {
    const engine = (midi as any).engineRef?.current
    if (!engine) return

    engine.sequencer.stopPlayback()
    engine.clock.stop()
    engine.clock.setPosition(0)
  }, [midi])

  const handleRecord = useCallback(() => {
    const engine = (midi as any).engineRef?.current
    if (!engine || !selectedTrack) return

    if (isRecording) {
      engine.sequencer.stopRecording()
    } else {
      engine.sequencer.startRecording(selectedTrack, 4) // 4 beat count-in
    }
  }, [isRecording, selectedTrack, midi])

  // Управление треками
  const handleAddTrack = useCallback(() => {
    const engine = (midi as any).engineRef?.current
    if (!engine) return

    const trackId = engine.sequencer.createTrack(
      `${t("fairlightAudio.midi.sequencer.track")} ${tracks.length + 1}`,
      tracks.length + 1,
    )
    setSelectedTrack(trackId)
  }, [tracks.length, midi, t])

  const handleDeleteTrack = useCallback(() => {
    const engine = (midi as any).engineRef?.current
    if (!engine || !selectedTrack) return

    engine.sequencer.deleteTrack(selectedTrack)
    setSelectedTrack(null)
  }, [selectedTrack, midi])

  const handleTrackMute = useCallback(
    (trackId: string, muted: boolean) => {
      const engine = (midi as any).engineRef?.current
      if (!engine) return

      engine.sequencer.updateTrack(trackId, { muted })
    },
    [midi],
  )

  const handleTrackSolo = useCallback(
    (trackId: string, solo: boolean) => {
      const engine = (midi as any).engineRef?.current
      if (!engine) return

      engine.sequencer.updateTrack(trackId, { solo })
    },
    [midi],
  )

  // BPM и синхронизация
  const handleBpmChange = useCallback(
    (newBpm: number[]) => {
      const engine = (midi as any).engineRef?.current
      if (!engine) return

      engine.clock.setBPM(newBpm[0])
    },
    [midi],
  )

  const handleSyncModeChange = useCallback(
    (mode: string) => {
      const engine = (midi as any).engineRef?.current
      if (!engine) return

      if (mode === "external") {
        // Выбираем первое MIDI входное устройство для синхронизации
        const firstInput = midi.inputDevices[0]
        if (firstInput) {
          engine.clock.setSyncMode({ type: "external", source: firstInput.id })
          setSyncMode("external")
        }
      } else {
        engine.clock.setSyncMode({ type: "internal" })
        setSyncMode("internal")
      }
    },
    [midi],
  )

  // Луп
  const handleLoopToggle = useCallback(
    (enabled: boolean) => {
      const engine = (midi as any).engineRef?.current
      if (!engine) return

      engine.sequencer.setLoop(loopStart, loopEnd, enabled)
      setLoopEnabled(enabled)
    },
    [loopStart, loopEnd, midi],
  )

  // Импорт/экспорт MIDI файлов
  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const engine = (midi as any).engineRef?.current
      if (!engine) return

      try {
        const buffer = await file.arrayBuffer()
        const trackIds = await engine.importMidiFile(buffer)

        if (trackIds.length > 0) {
          setSelectedTrack(trackIds[0])
        }
      } catch (error) {
        logger.error("Failed to import MIDI file:", error)
      }
    },
    [midi],
  )

  const handleExport = useCallback(() => {
    const engine = (midi as any).engineRef?.current
    if (!engine) return

    try {
      const buffer = engine.exportMidiFile()
      const blob = new Blob([buffer], { type: "audio/midi" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = t("fairlightAudio.midi.sequencer.defaultFileName")
      a.click()

      URL.revokeObjectURL(url)
    } catch (error) {
      logger.error("Failed to export MIDI file:", error)
    }
  }, [midi, t])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t("fairlightAudio.midi.sequencer.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transport controls */}
        <div className="flex items-center gap-4">
          <Button size="icon" variant={isPlaying ? "secondary" : "default"} onClick={handlePlay}>
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button size="icon" variant="outline" onClick={handleStop}>
            <Square className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={handleRecord}
            disabled={!selectedTrack}
          >
            <Circle className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 ml-4">
            <Label>{t("fairlightAudio.midi.sequencer.bpm")}</Label>
            <Slider
              value={[bpm]}
              onValueChange={handleBpmChange}
              min={40}
              max={300}
              step={1}
              className="w-32"
              disabled={syncMode === "external"}
            />
            <span className="text-sm w-12">{Math.round(bpm)}</span>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Label>{t("fairlightAudio.midi.sequencer.sync")}</Label>
            <Select value={syncMode} onValueChange={handleSyncModeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">{t("fairlightAudio.midi.sequencer.syncModes.internal")}</SelectItem>
                <SelectItem value="external">{t("fairlightAudio.midi.sequencer.syncModes.external")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Switch checked={loopEnabled} onCheckedChange={handleLoopToggle} />
            <Label>{t("fairlightAudio.midi.sequencer.loop")}</Label>
          </div>
        </div>

        {/* Track list */}
        <div className="flex gap-4">
          <div className="w-48 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">{t("fairlightAudio.midi.sequencer.tracks")}</h4>
              <Button size="icon" variant="ghost" onClick={handleAddTrack}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-1">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedTrack === track.id ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                    onClick={() => setSelectedTrack(track.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{track.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTrackMute(track.id, !track.muted)
                          }}
                        >
                          {track.muted ? t("fairlightAudio.midi.sequencer.mute") : ""}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTrackSolo(track.id, !track.solo)
                          }}
                        >
                          {track.solo ? t("fairlightAudio.midi.sequencer.solo") : ""}
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("fairlightAudio.midi.sequencer.channel")} {track.channel} • {track.events.length}{" "}
                      {t("fairlightAudio.midi.sequencer.events")}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedTrack && (
              <Button size="sm" variant="destructive" onClick={handleDeleteTrack} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                {t("fairlightAudio.midi.sequencer.deleteTrack")}
              </Button>
            )}
          </div>

          {/* Piano roll */}
          <div className="flex-1">
            <canvas ref={canvasRef} width={800} height={400} className="border rounded bg-background" />
          </div>
        </div>

        {/* File operations */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            {t("fairlightAudio.midi.sequencer.importMidi")}
          </Button>

          <Button size="sm" variant="outline" onClick={handleExport} disabled={tracks.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            {t("fairlightAudio.midi.sequencer.exportMidi")}
          </Button>

          <input ref={fileInputRef} type="file" accept=".mid,.midi" onChange={handleFileSelect} className="hidden" />
        </div>
      </CardContent>
    </Card>
  )
}

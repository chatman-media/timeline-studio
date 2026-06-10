import { Loader2, Music } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"

import { useMidi } from "../../hooks/use-midi"
import type { MidiDevice, MidiMessage } from "../../services/midi/midi-engine"

interface MidiLearnDialogProps {
  open: boolean
  onClose: () => void
  devices: MidiDevice[]
  onComplete: (deviceId: string, message: MidiMessage, targetParameter: string) => void
}

// Parameter options will be generated dynamically with translations

export function MidiLearnDialog({ open, onClose, devices, onComplete }: MidiLearnDialogProps) {
  const { t } = useTranslation()
  const { startLearning } = useMidi()
  const midiDeviceId = useId()
  const targetParameterId = useId()

  const PARAMETER_OPTIONS = [
    {
      value: "channel.1.volume",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel1Volume"),
    },
    {
      value: "channel.1.pan",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel1Pan"),
    },
    {
      value: "channel.2.volume",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel2Volume"),
    },
    {
      value: "channel.2.pan",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel2Pan"),
    },
    {
      value: "channel.3.volume",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel3Volume"),
    },
    {
      value: "channel.3.pan",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel3Pan"),
    },
    {
      value: "channel.4.volume",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel4Volume"),
    },
    {
      value: "channel.4.pan",
      label: t("fairlightAudio.midi.learnDialog.parameters.channel4Pan"),
    },
    {
      value: "master.volume",
      label: t("fairlightAudio.midi.learnDialog.parameters.masterVolume"),
    },
    {
      value: "master.limiter.threshold",
      label: t("fairlightAudio.midi.learnDialog.parameters.masterLimiterThreshold"),
    },
  ]

  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [targetParameter, setTargetParameter] = useState<string>("")
  const [isListening, setIsListening] = useState(false)
  const [receivedMessage, setReceivedMessage] = useState<MidiMessage | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedDevice("")
      setTargetParameter("")
      setIsListening(false)
      setReceivedMessage(null)
    }
  }, [open])

  useEffect(() => {
    if (isListening) {
      const stopLearning = startLearning((message) => {
        setReceivedMessage(message)
        setIsListening(false)
      })

      return stopLearning
    }
  }, [isListening, startLearning])

  const handleStartListening = () => {
    if (selectedDevice && targetParameter) {
      setIsListening(true)
      setReceivedMessage(null)
    }
  }

  const handleComplete = () => {
    if (selectedDevice && targetParameter && receivedMessage) {
      onComplete(selectedDevice, receivedMessage, targetParameter)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose} data-oid="jvb3852">
      <DialogContent className="sm:max-w-md" data-oid="._qmj3:">
        <DialogHeader data-oid="o:v7i1y">
          <DialogTitle data-oid=".97s1ib">{t("fairlightAudio.midi.learnDialog.title")}</DialogTitle>
          <DialogDescription data-oid="eahb3sn">{t("fairlightAudio.midi.learnDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" data-oid="rlknqsn">
          {/* Device Selection */}
          <div data-oid="hm.s_iq">
            <Label htmlFor={midiDeviceId} className="text-xs text-zinc-400" data-oid="yyzm2s4">
              {t("fairlightAudio.midi.learnDialog.midiDevice")}
            </Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice} data-oid="t6:o3f_">
              <SelectTrigger id={midiDeviceId} className="mt-1" data-oid="gs174b7">
                <SelectValue placeholder={t("fairlightAudio.midi.learnDialog.selectMidiDevice")} data-oid="qrv4cof" />
              </SelectTrigger>
              <SelectContent data-oid="vg9wk7c">
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id} data-oid="00q1njk">
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parameter Selection */}
          <div data-oid="mygxp.y">
            <Label htmlFor={targetParameterId} className="text-xs text-zinc-400" data-oid="9naipfk">
              {t("fairlightAudio.midi.learnDialog.targetParameter")}
            </Label>
            <Select value={targetParameter} onValueChange={setTargetParameter} data-oid="3.8d.9d">
              <SelectTrigger id={targetParameterId} className="mt-1" data-oid="1oruso6">
                <SelectValue placeholder={t("fairlightAudio.midi.learnDialog.selectParameter")} data-oid="gfoxwni" />
              </SelectTrigger>
              <SelectContent data-oid="ia8oq4a">
                {PARAMETER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} data-oid="-ze6-.6">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MIDI Learn Status */}
          <div className="p-8 border border-zinc-800 rounded-lg bg-zinc-900/50" data-oid="ji-4peo">
            <div className="text-center space-y-2" data-oid="qtl6-ls">
              {isListening ? (
                <>
                  <Loader2
                    className="w-8 h-8 animate-spin mx-auto text-blue-500"
                    data-testid="loader-icon"
                    data-oid="_b18cb7"
                  />

                  <p className="text-sm font-medium" data-oid="wi2.ca3">
                    {t("fairlightAudio.midi.learnDialog.status.listening")}
                  </p>
                  <p className="text-xs text-zinc-500" data-oid="tcvh15d">
                    {t("fairlightAudio.midi.learnDialog.status.listeningHint")}
                  </p>
                </>
              ) : receivedMessage ? (
                <>
                  <Music className="w-8 h-8 mx-auto text-green-500" data-testid="music-icon" data-oid="m56r__." />
                  <p className="text-sm font-medium text-green-400" data-oid="-8h5d.p">
                    {t("fairlightAudio.midi.learnDialog.status.received")}
                  </p>
                  <div className="text-xs text-zinc-400 space-y-1 mt-2" data-oid="uw.pi.7">
                    <p data-oid="usx09wt">
                      {t("fairlightAudio.midi.learnDialog.info.type")} {receivedMessage.type.toUpperCase()}
                    </p>
                    {receivedMessage.data.controller !== undefined && (
                      <p data-oid="gjoq0mf">
                        {t("fairlightAudio.midi.learnDialog.info.controller")}
                        {receivedMessage.data.controller}
                      </p>
                    )}
                    <p data-oid="a1vwggn">
                      {t("fairlightAudio.midi.learnDialog.info.channel")} {receivedMessage.channel}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Music className="w-8 h-8 mx-auto text-zinc-600" data-testid="music-icon" data-oid="aeyul3z" />
                  <p className="text-sm text-zinc-400" data-oid=".f43z3i">
                    {t("fairlightAudio.midi.learnDialog.status.ready")}
                  </p>
                  <p className="text-xs text-zinc-500" data-oid="txwigvc">
                    {t("fairlightAudio.midi.learnDialog.status.readyHint")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter data-oid="3klgszc">
          <Button variant="outline" onClick={onClose} data-oid="4-lxnlp">
            {t("fairlightAudio.midi.learnDialog.buttons.cancel")}
          </Button>
          {!receivedMessage ? (
            <Button
              onClick={handleStartListening}
              disabled={!selectedDevice || !targetParameter || isListening}
              data-oid="4n-hp62"
            >
              {isListening
                ? t("fairlightAudio.midi.learnDialog.buttons.listening")
                : t("fairlightAudio.midi.learnDialog.buttons.startListening")}
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700" data-oid="_lsjr8.">
              {t("fairlightAudio.midi.learnDialog.buttons.saveMapping")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

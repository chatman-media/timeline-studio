import { Button } from "@timeline-studio/ui/components/button"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Loader2, Music } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { useModals } from "@/features/modals/services"

import { useMidi } from "../../hooks/use-midi"
import type { MidiDevice, MidiMessage } from "../../services/midi/midi-engine"

export function MidiLearnModal() {
  const { t } = useTranslation()
  const { modalData, closeModal } = useModals()
  const { startLearning } = useMidi()
  const midiDeviceId = useId()
  const targetParameterId = useId()

  const { devices = [], onComplete } = (modalData || {}) as {
    devices?: MidiDevice[]
    onComplete?: (device: MidiDevice, message: MidiMessage, targetParameter: string) => void
  }

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
    // Reset state when modal opens
    setSelectedDevice("")
    setTargetParameter("")
    setIsListening(false)
    setReceivedMessage(null)
  }, [modalData])

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
    if (selectedDevice && targetParameter && receivedMessage && onComplete) {
      const device = devices.find((d: MidiDevice) => d.id === selectedDevice)
      if (device) {
        onComplete(device, receivedMessage, targetParameter)
        closeModal()
      }
    }
  }

  return (
    <div className="sm:max-w-md" data-oid=".b-0ri9">
      <div className="space-y-4 py-4" data-oid="jka6zd9">
        {/* Device Selection */}
        <div data-oid="brvlf9m">
          <Label htmlFor={midiDeviceId} className="text-xs text-zinc-400" data-oid="wwv2evk">
            {t("fairlightAudio.midi.learnDialog.midiDevice")}
          </Label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice} data-oid="3xlvjck">
            <SelectTrigger id={midiDeviceId} className="mt-1" data-oid="372lp8n">
              <SelectValue placeholder={t("fairlightAudio.midi.learnDialog.selectMidiDevice")} data-oid="-4ufb6_" />
            </SelectTrigger>
            <SelectContent data-oid="mmrqj62">
              {devices.map((device: MidiDevice) => (
                <SelectItem key={device.id} value={device.id} data-oid="o2nqbjr">
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parameter Selection */}
        <div data-oid="609dks5">
          <Label htmlFor={targetParameterId} className="text-xs text-zinc-400" data-oid="jeo.tr5">
            {t("fairlightAudio.midi.learnDialog.targetParameter")}
          </Label>
          <Select value={targetParameter} onValueChange={setTargetParameter} data-oid="g6y3yjl">
            <SelectTrigger id={targetParameterId} className="mt-1" data-oid="v6y84y5">
              <SelectValue placeholder={t("fairlightAudio.midi.learnDialog.selectParameter")} data-oid="ghzq64i" />
            </SelectTrigger>
            <SelectContent data-oid="t2-tv7g">
              {PARAMETER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} data-oid="025xpcc">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* MIDI Learn Status */}
        <div className="p-8 border border-zinc-800 rounded-lg bg-zinc-900/50" data-oid="y.jtrxd">
          <div className="text-center space-y-2" data-oid="4cvn:--">
            {isListening ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" data-oid="67v.jue" />
                <p className="text-sm font-medium" data-oid="3t2vv_a">
                  {t("fairlightAudio.midi.learnDialog.status.listening")}
                </p>
                <p className="text-xs text-zinc-500" data-oid="6yj3nb7">
                  {t("fairlightAudio.midi.learnDialog.status.listeningHint")}
                </p>
              </>
            ) : receivedMessage ? (
              <>
                <Music className="w-8 h-8 mx-auto text-green-500" data-oid="f7z208r" />
                <p className="text-sm font-medium text-green-400" data-oid="w187-zh">
                  {t("fairlightAudio.midi.learnDialog.status.received")}
                </p>
                <div className="text-xs text-zinc-400 space-y-1 mt-2" data-oid="urrq5ef">
                  <p data-oid="lj:9.vo">
                    {t("fairlightAudio.midi.learnDialog.info.type")} {receivedMessage.type.toUpperCase()}
                  </p>
                  {receivedMessage.data.controller !== undefined && (
                    <p data-oid="7nc5gdr">
                      {t("fairlightAudio.midi.learnDialog.info.controller")}
                      {receivedMessage.data.controller}
                    </p>
                  )}
                  <p data-oid="l6cusgs">
                    {t("fairlightAudio.midi.learnDialog.info.channel")} {receivedMessage.channel}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Music className="w-8 h-8 mx-auto text-zinc-600" data-oid="z0it_g2" />
                <p className="text-sm text-zinc-400" data-oid="xxo42c5">
                  {t("fairlightAudio.midi.learnDialog.status.ready")}
                </p>
                <p className="text-xs text-zinc-500" data-oid="5hp96nb">
                  {t("fairlightAudio.midi.learnDialog.status.readyHint")}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t" data-oid="ej71z:8">
        <Button variant="outline" onClick={closeModal} data-oid="m.z4q-j">
          {t("fairlightAudio.midi.learnDialog.buttons.cancel")}
        </Button>
        {!receivedMessage ? (
          <Button
            onClick={handleStartListening}
            disabled={!selectedDevice || !targetParameter || isListening}
            data-oid="8753-hp"
          >
            {isListening
              ? t("fairlightAudio.midi.learnDialog.buttons.listening")
              : t("fairlightAudio.midi.learnDialog.buttons.startListening")}
          </Button>
        ) : (
          <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700" data-oid="q954soa">
            {t("fairlightAudio.midi.learnDialog.buttons.saveMapping")}
          </Button>
        )}
      </div>
    </div>
  )
}

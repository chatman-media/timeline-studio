import { Info, Loader2, Music, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModals } from "@/domains/system-integration"
import { useMidi } from "../../hooks/use-midi"
import type { MidiDevice, MidiMessage } from "../../services/midi/midi-engine"
import { MidiMappingEditor } from "./midi-mapping-editor"
import { MidiRouterView } from "./midi-router-view"

export function MidiSetup() {
  const { t } = useTranslation()
  const { openModal } = useModals()
  const {
    devices,
    inputDevices,
    outputDevices,
    mappings,
    isInitialized,
    error,
    addMapping,
    removeMapping,
    updateMapping,
  } = useMidi()

  const [selectedInput, setSelectedInput] = useState<string>("")
  const [selectedOutput, setSelectedOutput] = useState<string>("")
  // Убираем локальное состояние диалогов, так как теперь они управляются через ModalContainer

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
          <p className="text-sm text-zinc-400">{t("fairlightAudio.midi.setup.initializing")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-red-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">{t("fairlightAudio.midi.setup.error")}</p>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">{t("fairlightAudio.midi.setup.tabs.devices")}</TabsTrigger>
          <TabsTrigger value="mappings">{t("fairlightAudio.midi.setup.tabs.mappings")}</TabsTrigger>
          <TabsTrigger value="router">{t("fairlightAudio.midi.setup.tabs.router")}</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          {/* Input Devices */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">
              {t("fairlightAudio.midi.setup.devices.inputDevices")}
            </h3>

            {inputDevices.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("fairlightAudio.midi.setup.devices.noInputDevices")}</p>
            ) : (
              <div className="space-y-2">
                {inputDevices.map((device) => (
                  <DeviceItem key={device.id} device={device} />
                ))}
              </div>
            )}
          </Card>

          {/* Output Devices */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">
              {t("fairlightAudio.midi.setup.devices.outputDevices")}
            </h3>

            {outputDevices.length === 0 ? (
              <p className="text-sm text-zinc-500">{t("fairlightAudio.midi.setup.devices.noOutputDevices")}</p>
            ) : (
              <div className="space-y-2">
                {outputDevices.map((device) => (
                  <DeviceItem key={device.id} device={device} />
                ))}
              </div>
            )}
          </Card>

          {/* Default Device Selection */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3">
              {t("fairlightAudio.midi.setup.devices.defaultDevices")}
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="default-input" className="text-xs text-zinc-400">
                  {t("fairlightAudio.midi.setup.devices.defaultInput")}
                </Label>
                <Select value={selectedInput} onValueChange={setSelectedInput}>
                  <SelectTrigger id="default-input" className="h-8 mt-1">
                    <SelectValue placeholder={t("fairlightAudio.midi.setup.devices.selectInputDevice")} />
                  </SelectTrigger>
                  <SelectContent>
                    {inputDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="default-output" className="text-xs text-zinc-400">
                  {t("fairlightAudio.midi.setup.devices.defaultOutput")}
                </Label>
                <Select value={selectedOutput} onValueChange={setSelectedOutput}>
                  <SelectTrigger id="default-output" className="h-8 mt-1">
                    <SelectValue placeholder={t("fairlightAudio.midi.setup.devices.selectOutputDevice")} />
                  </SelectTrigger>
                  <SelectContent>
                    {outputDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-zinc-100">{t("fairlightAudio.midi.setup.mappings.title")}</h3>
            <Button
              onClick={() =>
                openModal("midi-learn", {
                  devices: inputDevices,
                  onComplete: (device: MidiDevice, message: MidiMessage, targetParameter: string) => {
                    addMapping({
                      deviceId: device.id,
                      messageType: message.type,
                      channel: message.channel,
                      controller: message.data.controller,
                      targetParameter,
                      min: 0,
                      max: 1,
                      curve: "linear",
                    })
                  },
                })
              }
            >
              {t("fairlightAudio.midi.setup.mappings.addMapping")}
            </Button>
          </div>

          {mappings.length === 0 ? (
            <Card className="p-8">
              <div className="text-center space-y-2">
                <Music className="w-12 h-12 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400">{t("fairlightAudio.midi.setup.mappings.noMappings")}</p>
                <p className="text-xs text-zinc-500">{t("fairlightAudio.midi.setup.mappings.addFirstMapping")}</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <Card key={mapping.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-100">{mapping.targetParameter}</p>
                      <p className="text-xs text-zinc-500">
                        {devices.find((d) => d.id === mapping.deviceId)?.name ||
                          t("fairlightAudio.midi.setup.devices.unknownDevice")}{" "}
                        •{mapping.messageType.toUpperCase()}
                        {mapping.controller !== undefined && ` CC${mapping.controller}`}
                        {mapping.channel && ` CH${mapping.channel}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <MidiMappingEditor
                        mapping={mapping}
                        onSave={(updates) => updateMapping(mapping.id, updates)}
                        onClose={() => {}}
                      />
                      <Button size="sm" variant="ghost" onClick={() => removeMapping(mapping.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="router" className="p-0">
          <MidiRouterView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DeviceItem({ device }: { device: MidiDevice }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/50">
      <div>
        <p className="text-sm font-medium text-zinc-100">{device.name}</p>
        <p className="text-xs text-zinc-500">{device.manufacturer}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${device.state === "connected" ? "bg-green-500" : "bg-red-500"}`} />
    </div>
  )
}

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
      <div className="flex items-center justify-center p-8" data-oid="iv:-_rt">
        <div className="text-center space-y-2" data-oid=".9ttate">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" data-oid="3s5w5ry" />
          <p className="text-sm text-zinc-400" data-oid="yqd_mb8">
            {t("fairlightAudio.midi.setup.initializing")}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg" data-oid="xg9huly">
        <div className="flex items-start gap-2" data-oid="gq0m9sx">
          <Info className="w-4 h-4 text-red-400 mt-0.5" data-oid="wdbk3mb" />
          <div data-oid="cz2:de1">
            <p className="text-sm font-medium text-red-400" data-oid="4u_khlh">
              {t("fairlightAudio.midi.setup.error")}
            </p>
            <p className="text-xs text-zinc-400 mt-1" data-oid="l.eyqjs">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-oid="bhz_2ya">
      <Tabs defaultValue="devices" className="w-full" data-oid="6zjyg9x">
        <TabsList className="grid w-full grid-cols-3" data-oid="2otusfm">
          <TabsTrigger value="devices" data-oid=":701oqf">
            {t("fairlightAudio.midi.setup.tabs.devices")}
          </TabsTrigger>
          <TabsTrigger value="mappings" data-oid="_jdqxa6">
            {t("fairlightAudio.midi.setup.tabs.mappings")}
          </TabsTrigger>
          <TabsTrigger value="router" data-oid="39d9hjm">
            {t("fairlightAudio.midi.setup.tabs.router")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4" data-oid="crirg08">
          {/* Input Devices */}
          <Card className="p-4" data-oid="cgs45zz">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3" data-oid="ijqd5m1">
              {t("fairlightAudio.midi.setup.devices.inputDevices")}
            </h3>

            {inputDevices.length === 0 ? (
              <p className="text-sm text-zinc-500" data-oid="4zg_dfk">
                {t("fairlightAudio.midi.setup.devices.noInputDevices")}
              </p>
            ) : (
              <div className="space-y-2" data-oid="6jsj_81">
                {inputDevices.map((device) => (
                  <DeviceItem key={device.id} device={device} data-oid="nb015.." />
                ))}
              </div>
            )}
          </Card>

          {/* Output Devices */}
          <Card className="p-4" data-oid="mxzg0an">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3" data-oid="wwnabvz">
              {t("fairlightAudio.midi.setup.devices.outputDevices")}
            </h3>

            {outputDevices.length === 0 ? (
              <p className="text-sm text-zinc-500" data-oid="02dtl71">
                {t("fairlightAudio.midi.setup.devices.noOutputDevices")}
              </p>
            ) : (
              <div className="space-y-2" data-oid="806h6tz">
                {outputDevices.map((device) => (
                  <DeviceItem key={device.id} device={device} data-oid="eb1mu1h" />
                ))}
              </div>
            )}
          </Card>

          {/* Default Device Selection */}
          <Card className="p-4" data-oid="go84.qi">
            <h3 className="text-sm font-semibold text-zinc-100 mb-3" data-oid="9gpgv5x">
              {t("fairlightAudio.midi.setup.devices.defaultDevices")}
            </h3>

            <div className="space-y-3" data-oid="2cbuui-">
              <div data-oid="invfg6k">
                <Label htmlFor="default-input" className="text-xs text-zinc-400" data-oid="bal58m4">
                  {t("fairlightAudio.midi.setup.devices.defaultInput")}
                </Label>
                <Select value={selectedInput} onValueChange={setSelectedInput} data-oid="6i4kmr4">
                  <SelectTrigger id="default-input" className="h-8 mt-1" data-oid="j5kcp-z">
                    <SelectValue
                      placeholder={t("fairlightAudio.midi.setup.devices.selectInputDevice")}
                      data-oid="dnsn:ji"
                    />
                  </SelectTrigger>
                  <SelectContent data-oid="di0ur4p">
                    {inputDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id} data-oid="hyc-w99">
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div data-oid="5miufz3">
                <Label htmlFor="default-output" className="text-xs text-zinc-400" data-oid="awe73bg">
                  {t("fairlightAudio.midi.setup.devices.defaultOutput")}
                </Label>
                <Select value={selectedOutput} onValueChange={setSelectedOutput} data-oid="je3b5.n">
                  <SelectTrigger id="default-output" className="h-8 mt-1" data-oid="-ysey91">
                    <SelectValue
                      placeholder={t("fairlightAudio.midi.setup.devices.selectOutputDevice")}
                      data-oid="r3e.fi_"
                    />
                  </SelectTrigger>
                  <SelectContent data-oid="yp_1:ru">
                    {outputDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id} data-oid="55grc60">
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4" data-oid="i5gx8c0">
          <div className="flex justify-between items-center mb-4" data-oid="i3difhz">
            <h3 className="text-sm font-semibold text-zinc-100" data-oid="6n2rhvh">
              {t("fairlightAudio.midi.setup.mappings.title")}
            </h3>
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
              data-oid="l_p_z9k"
            >
              {t("fairlightAudio.midi.setup.mappings.addMapping")}
            </Button>
          </div>

          {mappings.length === 0 ? (
            <Card className="p-8" data-oid="4h7ki:6">
              <div className="text-center space-y-2" data-oid="w2-c6du">
                <Music className="w-12 h-12 text-zinc-600 mx-auto" data-oid="lwwuxfl" />
                <p className="text-sm text-zinc-400" data-oid="lk_0ls2">
                  {t("fairlightAudio.midi.setup.mappings.noMappings")}
                </p>
                <p className="text-xs text-zinc-500" data-oid="i:l31j9">
                  {t("fairlightAudio.midi.setup.mappings.addFirstMapping")}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2" data-oid="8_x_r-z">
              {mappings.map((mapping) => (
                <Card key={mapping.id} className="p-3" data-oid="r-ifruo">
                  <div className="flex items-center justify-between" data-oid="vfiz6it">
                    <div className="flex-1" data-oid="od_8ixc">
                      <p className="text-sm font-medium text-zinc-100" data-oid="oei8yon">
                        {mapping.targetParameter}
                      </p>
                      <p className="text-xs text-zinc-500" data-oid="sssjev3">
                        {devices.find((d) => d.id === mapping.deviceId)?.name ||
                          t("fairlightAudio.midi.setup.devices.unknownDevice")}{" "}
                        •{mapping.messageType.toUpperCase()}
                        {mapping.controller !== undefined && ` CC${mapping.controller}`}
                        {mapping.channel && ` CH${mapping.channel}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1" data-oid="nldh5ch">
                      <MidiMappingEditor
                        mapping={mapping}
                        onSave={(updates) => updateMapping(mapping.id, updates)}
                        onClose={() => {}}
                        data-oid="cm2prlr"
                      />

                      <Button size="sm" variant="ghost" onClick={() => removeMapping(mapping.id)} data-oid="_2:rgdq">
                        <Trash2 className="w-3 h-3" data-oid="aqhe6lu" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="router" className="p-0" data-oid="4s3l151">
          <MidiRouterView data-oid="kckrurq" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DeviceItem({ device }: { device: MidiDevice }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-zinc-900/50" data-oid="tul4xe-">
      <div data-oid="150o46d">
        <p className="text-sm font-medium text-zinc-100" data-oid="gzd2ea6">
          {device.name}
        </p>
        <p className="text-xs text-zinc-500" data-oid="-z70f85">
          {device.manufacturer}
        </p>
      </div>
      <div
        className={`w-2 h-2 rounded-full ${device.state === "connected" ? "bg-green-500" : "bg-red-500"}`}
        data-oid="8a8proe"
      />
    </div>
  )
}

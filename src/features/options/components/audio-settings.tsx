import {
  AudioLines,
  ChevronDown,
  Filter,
  Headphones,
  Music,
  Settings,
  Sliders,
  Speaker,
  Volume2,
  Waves,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { Checkbox } from "@timeline-studio/ui/components/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@timeline-studio/ui/components/collapsible"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { useTimeline } from "@/features/timeline"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "AudioSettings" })

interface AudioSettingsState {
  deviceSettings: boolean
  mixerControls: boolean
  effects: boolean
  advanced: boolean
}

export function AudioSettings() {
  const { t } = useTranslation()

  // Безопасно получаем timeline data
  let selectedClips: any[] = []
  try {
    const timeline = useTimeline()
    const selectedClipIds = timeline.selectedClipIds || []
    // Получаем клипы по их ID
    selectedClips = selectedClipIds
      .map((clipId: string) => timeline.clips?.find((clip: any) => clip.id === clipId))
      .filter(Boolean)
  } catch {
    // TimelineProvider не доступен (например, в тестах)
    selectedClips = []
  }

  // Получаем первый выбранный аудио клип
  const currentAudioClip =
    selectedClips?.find(
      (clip) => clip.mediaFile?.type === "audio" || clip.trackId?.includes("audio") || clip.trackId?.includes("music"),
    ) || null

  // Состояние открытых секций
  const [openSections, setOpenSections] = useState<AudioSettingsState>({
    deviceSettings: true, // Первая секция открыта по умолчанию
    mixerControls: false,
    effects: false,
    advanced: false,
  })

  // Локальное состояние настроек
  const [settings, setSettings] = useState({
    sampleRate: "48000",
    bitrate: "256",
    channels: "stereo",
    codec: "aac",
    defaultVolume: 75,
    bufferSize: 512,
    latency: 20,
    noiseReduction: false,
    autoGain: true,
    compressorEnabled: false,
    equalizerEnabled: false,
    reverbEnabled: false,
  })

  const toggleSection = (section: keyof AudioSettingsState) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const SAMPLE_RATE_OPTIONS = [
    {
      value: "44100",
      label: t("options.audio.sampleRates.44100", "44.1 kHz (CD quality)"),
    },
    {
      value: "48000",
      label: t("options.audio.sampleRates.48000", "48 kHz (Professional)"),
    },
    {
      value: "96000",
      label: t("options.audio.sampleRates.96000", "96 kHz (Hi-Res)"),
    },
    {
      value: "192000",
      label: t("options.audio.sampleRates.192000", "192 kHz (Studio)"),
    },
  ]

  const BITRATE_OPTIONS = [
    {
      value: "128",
      label: t("options.audio.bitrates.128", "128 kbps (Basic)"),
    },
    { value: "192", label: t("options.audio.bitrates.192", "192 kbps (Good)") },
    { value: "256", label: t("options.audio.bitrates.256", "256 kbps (High)") },
    {
      value: "320",
      label: t("options.audio.bitrates.320", "320 kbps (Maximum)"),
    },
  ]

  const CHANNELS_OPTIONS = [
    {
      value: "mono",
      label: t("options.audio.channelsOptions.mono", "Mono (1 channel)"),
    },
    {
      value: "stereo",
      label: t("options.audio.channelsOptions.stereo", "Stereo (2 channels)"),
    },
    {
      value: "5.1",
      label: t("options.audio.channelsOptions.5_1", "5.1 Surround"),
    },
    {
      value: "7.1",
      label: t("options.audio.channelsOptions.7_1", "7.1 Surround"),
    },
  ]

  const AUDIO_CODEC_OPTIONS = [
    { value: "aac", label: t("options.audio.codecs.aac", "AAC (Recommended)") },
    {
      value: "mp3",
      label: t("options.audio.codecs.mp3", "MP3 (Compatibility)"),
    },
    { value: "flac", label: t("options.audio.codecs.flac", "FLAC (Lossless)") },
    {
      value: "opus",
      label: t("options.audio.codecs.opus", "Opus (Efficiency)"),
    },
  ]

  const handleReset = () => {
    setSettings({
      sampleRate: "48000",
      bitrate: "256",
      channels: "stereo",
      codec: "aac",
      defaultVolume: 75,
      bufferSize: 512,
      latency: 20,
      noiseReduction: false,
      autoGain: true,
      compressorEnabled: false,
      equalizerEnabled: false,
      reverbEnabled: false,
    })
  }

  const handleApply = () => {
    // Применить настройки к выбранным аудио клипам
    logger.info("Applying audio settings:", settings)
  }

  return (
    <div className="flex flex-col h-full" data-testid="audio-settings" data-oid=".tsq1e4">
      {/* Основной контент с прокруткой */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground"
        data-oid="xif3imj"
      >
        <div className="p-4 space-y-4" data-oid="6yarc1.">
          {/* Настройки устройств */}
          <Collapsible
            open={openSections.deviceSettings}
            onOpenChange={() => toggleSection("deviceSettings")}
            data-oid="nf9.47u"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="srzkc49"
            >
              <div className="flex items-center gap-2" data-oid="hxtyt.-">
                <div className="w-2 h-2 rounded-full bg-blue-400" data-oid="vticsvv" />
                <Headphones className="h-4 w-4 text-blue-400" data-oid="ik5a_ks" />
                <h3 className="font-medium text-foreground" data-oid="xcv37eo">
                  {t("options.audio.deviceSettings", "Device Settings")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.deviceSettings ? "rotate-180" : ""}`}
                data-oid="xj14mat"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="olep_6a">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="vrhxwin">
                {/* Частота дискретизации */}
                <div className="space-y-2" data-oid="kh66zpb">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="mcqwm79">
                    {t("options.audio.sampleRate", "Sample Rate")}
                  </Label>
                  <Select
                    value={settings.sampleRate}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, sampleRate: value }))}
                    data-oid=".t_mf6_"
                  >
                    <SelectTrigger className="h-8" data-oid="45ehnps">
                      <SelectValue data-oid="rlxv2b3" />
                    </SelectTrigger>
                    <SelectContent data-oid="6t2z1zb">
                      {SAMPLE_RATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-oid="bzaj5jq">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Количество каналов */}
                <div className="space-y-2" data-oid=".vp:-b8">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="v4kiywg">
                    {t("options.audio.channels", "Channels")}
                  </Label>
                  <Select
                    value={settings.channels}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, channels: value }))}
                    data-oid="drpsg9k"
                  >
                    <SelectTrigger className="h-8" data-oid="4:a-t8-">
                      <SelectValue data-oid="hzr8qig" />
                    </SelectTrigger>
                    <SelectContent data-oid="d76lz2r">
                      {CHANNELS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-oid="cad20dq">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Аудиокодек */}
                <div className="space-y-2" data-oid="w68xhqe">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="0c96d9b">
                    {t("options.audio.codec", "Audio Codec")}
                  </Label>
                  <Select
                    value={settings.codec}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, codec: value }))}
                    data-oid="1iw:sd4"
                  >
                    <SelectTrigger className="h-8" data-oid="2_pp2rw">
                      <SelectValue data-oid="trkjjoi" />
                    </SelectTrigger>
                    <SelectContent data-oid="nft9dl3">
                      {AUDIO_CODEC_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-oid="86ew3gp">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Микшер и громкость */}
          <Collapsible
            open={openSections.mixerControls}
            onOpenChange={() => toggleSection("mixerControls")}
            data-oid="85yma6e"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="7okzl6p"
            >
              <div className="flex items-center gap-2" data-oid="i55eifh">
                <div className="w-2 h-2 rounded-full bg-green-400" data-oid="5e6w84o" />
                <Volume2 className="h-4 w-4 text-green-400" data-oid="zn4cnio" />
                <h3 className="font-medium text-foreground" data-oid="dkwkso:">
                  {t("options.audio.mixerControls", "Mixer Controls")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.mixerControls ? "rotate-180" : ""}`}
                data-oid="hfk7lm_"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="25y8mww">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="pgryn:i">
                {/* Громкость по умолчанию */}
                <div className="space-y-2" data-oid="g8zrp8f">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="5mnp1db">
                    {t("options.audio.defaultVolume", "Default Volume")}
                  </Label>
                  <div className="space-y-2" data-oid="6zootu7">
                    <Slider
                      value={[settings.defaultVolume]}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({
                          ...prev,
                          defaultVolume: value,
                        }))
                      }
                      max={100}
                      step={1}
                      className="w-full"
                      data-oid="qeh31g:"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground" data-oid="o4:ud-x">
                      <span data-oid="hk8_140">0%</span>
                      <span data-oid="r6oy1ds">{settings.defaultVolume}%</span>
                      <span data-oid="r8n_ial">100%</span>
                    </div>
                  </div>
                </div>

                {/* Битрейт */}
                <div className="space-y-2" data-oid="-k.rl:1">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="a-3:02_">
                    {t("options.audio.bitrate", "Bitrate")}
                  </Label>
                  <Select
                    value={settings.bitrate}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, bitrate: value }))}
                    data-oid="gpktx7u"
                  >
                    <SelectTrigger className="h-8" data-oid="eg47hkc">
                      <SelectValue data-oid="tawq2.i" />
                    </SelectTrigger>
                    <SelectContent data-oid="7xqmhzt">
                      {BITRATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} data-oid="m6:ferd">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Автоматическая регулировка усиления */}
                <div className="flex items-center space-x-2" data-oid="fqir0h7">
                  <Checkbox
                    id="auto-gain"
                    checked={settings.autoGain}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoGain: !!checked }))}
                    data-oid="nxb23t5"
                  />

                  <Label htmlFor="auto-gain" className="text-sm text-foreground/90" data-oid="2::hxg5">
                    {t("options.audio.autoGain", "Automatic gain control")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Аудио эффекты (Fairlight) */}
          <Collapsible open={openSections.effects} onOpenChange={() => toggleSection("effects")} data-oid="33p8ca3">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="y8tm061"
            >
              <div className="flex items-center gap-2" data-oid="zg9w:nx">
                <div className="w-2 h-2 rounded-full bg-yellow-400" data-oid="77e36t." />
                <Zap className="h-4 w-4 text-yellow-400" data-oid="r9rx0sg" />
                <h3 className="font-medium text-foreground" data-oid="_e4uwgl">
                  {t("options.audio.effects", "Audio Effects")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.effects ? "rotate-180" : ""}`}
                data-oid="rjd2ri6"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="hopfj8v">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="71fyb7r">
                {/* Эффекты в виде карточек */}
                <div className="grid grid-cols-2 gap-3" data-oid="d781pez">
                  {/* Шумоподавление */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.noiseReduction
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border bg-background hover:border-blue-400"
                    }`}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        noiseReduction: !prev.noiseReduction,
                      }))
                    }
                    data-oid="60tvshd"
                  >
                    <div className="flex items-center gap-2 mb-2" data-oid="im7-ujb">
                      <Filter
                        className={`h-4 w-4 ${settings.noiseReduction ? "text-blue-400" : "text-gray-400"}`}
                        data-oid="yurlp-l"
                      />

                      <span
                        className={`text-sm font-medium ${settings.noiseReduction ? "text-blue-400" : "text-foreground/90"}`}
                        data-oid="25vdya7"
                      >
                        {t("options.audio.noiseReduction", "Noise Reduction")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid="n8uc1ct">
                      {t("options.audio.noiseReductionDesc", "Remove background noise")}
                    </div>
                  </div>

                  {/* Компрессор */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.compressorEnabled
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-border bg-background hover:border-orange-400"
                    }`}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        compressorEnabled: !prev.compressorEnabled,
                      }))
                    }
                    data-oid="7wih-3m"
                  >
                    <div className="flex items-center gap-2 mb-2" data-oid="ky7ii5x">
                      <Waves
                        className={`h-4 w-4 ${settings.compressorEnabled ? "text-orange-400" : "text-gray-400"}`}
                        data-oid="1s_bh2n"
                      />

                      <span
                        className={`text-sm font-medium ${settings.compressorEnabled ? "text-orange-400" : "text-foreground/90"}`}
                        data-oid="z6ml8v9"
                      >
                        {t("options.audio.compressor", "Compressor")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid=".itp45w">
                      {t("options.audio.compressorDesc", "Dynamic range control")}
                    </div>
                  </div>

                  {/* Эквалайзер */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.equalizerEnabled
                        ? "border-green-500 bg-green-500/10"
                        : "border-border bg-background hover:border-green-400"
                    }`}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        equalizerEnabled: !prev.equalizerEnabled,
                      }))
                    }
                    data-oid="e7mdky2"
                  >
                    <div className="flex items-center gap-2 mb-2" data-oid="wny:2qf">
                      <Sliders
                        className={`h-4 w-4 ${settings.equalizerEnabled ? "text-green-400" : "text-gray-400"}`}
                        data-oid="cn72uxm"
                      />

                      <span
                        className={`text-sm font-medium ${settings.equalizerEnabled ? "text-green-400" : "text-foreground/90"}`}
                        data-oid="zbq:s8c"
                      >
                        {t("options.audio.equalizer", "Equalizer")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid="whfr_6m">
                      {t("options.audio.equalizerDesc", "Frequency adjustment")}
                    </div>
                  </div>

                  {/* Реверберация */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.reverbEnabled
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border bg-background hover:border-purple-400"
                    }`}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        reverbEnabled: !prev.reverbEnabled,
                      }))
                    }
                    data-oid="18dva8w"
                  >
                    <div className="flex items-center gap-2 mb-2" data-oid="7.kgmcg">
                      <Speaker
                        className={`h-4 w-4 ${settings.reverbEnabled ? "text-purple-400" : "text-gray-400"}`}
                        data-oid="cxsdpim"
                      />

                      <span
                        className={`text-sm font-medium ${settings.reverbEnabled ? "text-purple-400" : "text-foreground/90"}`}
                        data-oid="2_.x2ml"
                      >
                        {t("options.audio.reverb", "Reverb")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground" data-oid=":8czfg.">
                      {t("options.audio.reverbDesc", "Spatial audio effect")}
                    </div>
                  </div>
                </div>

                {/* Статус эффектов */}
                <div className="mt-4 p-3 bg-background rounded border border-border" data-oid="9m_.8jr">
                  <div className="flex items-center justify-between mb-2" data-oid="_00ba3l">
                    <div className="text-xs text-muted-foreground" data-oid="pic9bn.">
                      {t("options.audio.effectsStatus", "Effects Status")}
                    </div>
                    <div className="flex items-center gap-1" data-oid="gd1xzxk">
                      {[
                        settings.noiseReduction,
                        settings.compressorEnabled,
                        settings.equalizerEnabled,
                        settings.reverbEnabled,
                      ].filter(Boolean).length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-green-400" data-oid="r4-mfy3" />
                      )}
                      <span className="text-xs text-muted-foreground" data-oid="dynkblu">
                        {
                          [
                            settings.noiseReduction,
                            settings.compressorEnabled,
                            settings.equalizerEnabled,
                            settings.reverbEnabled,
                          ].filter(Boolean).length
                        }{" "}
                        active
                      </span>
                    </div>
                  </div>

                  {currentAudioClip ? (
                    <div className="space-y-1" data-oid="u9knz-x">
                      <div className="flex items-center gap-2" data-oid="u2vobld">
                        <Music className="h-3 w-3 text-blue-400" data-oid="36b7-nv" />
                        <span className="text-sm text-foreground" data-oid="15p1m6e">
                          {currentAudioClip.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground" data-oid="vz-.mpy">
                        {t("options.audio.duration", "Duration")}: {Math.round(currentAudioClip.duration || 0)}s
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground/70 text-sm" data-oid="f4uj8.8">
                      {t("options.audio.noClipSelected", "No audio clip selected")}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Дополнительные настройки */}
          <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection("advanced")} data-oid="q49jw0.">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="-jze3ar"
            >
              <div className="flex items-center gap-2" data-oid="0txuheb">
                <div className="w-2 h-2 rounded-full bg-purple-400" data-oid="llt3du6" />
                <Settings className="h-4 w-4 text-purple-400" data-oid="72wmkkh" />
                <h3 className="font-medium text-foreground" data-oid="90_:a7l">
                  {t("options.audio.advanced", "Advanced Settings")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.advanced ? "rotate-180" : ""}`}
                data-oid="cdb7vw4"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="3m6jqhk">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="pm_6dmk">
                {/* Размер буфера */}
                <div className="space-y-2" data-oid="1x9_-9.">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="sob935i">
                    {t("options.audio.bufferSize", "Buffer Size (samples)")}
                  </Label>
                  <Input
                    type="number"
                    value={settings.bufferSize}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bufferSize: Number.parseInt(e.target.value, 10) || 512,
                      }))
                    }
                    min="128"
                    max="2048"
                    step="128"
                    className="h-8"
                    data-oid="b:pukjo"
                  />
                </div>

                {/* Задержка */}
                <div className="space-y-2" data-oid="g_7rc.y">
                  <Label className="text-sm font-medium text-foreground/90" data-oid="-vwo5sp">
                    {t("options.audio.latency", "Latency (ms)")}
                  </Label>
                  <Input
                    type="number"
                    value={settings.latency}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        latency: Number.parseInt(e.target.value, 10) || 20,
                      }))
                    }
                    min="0"
                    max="100"
                    step="5"
                    className="h-8"
                    data-oid="wgupn2m"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Нижняя панель с кнопками */}
      <div className="shrink-0 bg-card border-t border-border p-3" data-oid="p:jmuuh">
        <div className="flex items-center justify-between" data-oid="4ga3m7v">
          <div className="flex items-center gap-2" data-oid="uimq2up">
            {/* Fairlight интеграция */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs flex items-center gap-2 hover:bg-blue-500/20 hover:text-blue-400"
              data-oid="szzx88p"
            >
              <AudioLines className="h-3 w-3" data-oid=":hsvr0w" />
              {t("options.audio.fairlight", "Fairlight Console")}
            </Button>

            {/* Индикатор MIDI */}
            <div
              className="flex items-center gap-1 px-2 py-1 bg-background rounded border border-border"
              data-oid="ahow:ds"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" data-oid="tp5eu:p" />
              <span className="text-xs text-muted-foreground" data-oid="1gp9.r_">
                MIDI
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2" data-oid="j:4evxq">
            {/* Статус активных эффектов */}
            {[
              settings.noiseReduction,
              settings.compressorEnabled,
              settings.equalizerEnabled,
              settings.reverbEnabled,
            ].filter(Boolean).length > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded border border-green-500/30"
                data-oid="i32_9v3"
              >
                <Zap className="h-3 w-3 text-green-400" data-oid="0p_1aji" />
                <span className="text-xs text-green-400" data-oid="ru2hbmp">
                  {
                    [
                      settings.noiseReduction,
                      settings.compressorEnabled,
                      settings.equalizerEnabled,
                      settings.reverbEnabled,
                    ].filter(Boolean).length
                  }{" "}
                  FX
                </span>
              </div>
            )}

            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleReset} data-oid="r1tqte5">
              {t("common.reset", "Reset")}
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleApply} data-oid="01zxfov">
              {t("common.apply", "Apply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

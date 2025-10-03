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

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"

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
    { value: "44100", label: t("options.audio.sampleRates.44100", "44.1 kHz (CD quality)") },
    { value: "48000", label: t("options.audio.sampleRates.48000", "48 kHz (Professional)") },
    { value: "96000", label: t("options.audio.sampleRates.96000", "96 kHz (Hi-Res)") },
    { value: "192000", label: t("options.audio.sampleRates.192000", "192 kHz (Studio)") },
  ]

  const BITRATE_OPTIONS = [
    { value: "128", label: t("options.audio.bitrates.128", "128 kbps (Basic)") },
    { value: "192", label: t("options.audio.bitrates.192", "192 kbps (Good)") },
    { value: "256", label: t("options.audio.bitrates.256", "256 kbps (High)") },
    { value: "320", label: t("options.audio.bitrates.320", "320 kbps (Maximum)") },
  ]

  const CHANNELS_OPTIONS = [
    { value: "mono", label: t("options.audio.channelsOptions.mono", "Mono (1 channel)") },
    { value: "stereo", label: t("options.audio.channelsOptions.stereo", "Stereo (2 channels)") },
    { value: "5.1", label: t("options.audio.channelsOptions.5_1", "5.1 Surround") },
    { value: "7.1", label: t("options.audio.channelsOptions.7_1", "7.1 Surround") },
  ]

  const AUDIO_CODEC_OPTIONS = [
    { value: "aac", label: t("options.audio.codecs.aac", "AAC (Recommended)") },
    { value: "mp3", label: t("options.audio.codecs.mp3", "MP3 (Compatibility)") },
    { value: "flac", label: t("options.audio.codecs.flac", "FLAC (Lossless)") },
    { value: "opus", label: t("options.audio.codecs.opus", "Opus (Efficiency)") },
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
    console.log("Applying audio settings:", settings)
  }

  return (
    <div className="flex flex-col h-full" data-testid="audio-settings">
      {/* Основной контент с прокруткой */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-[#2D2D30] scrollbar-thumb-[#464647] hover:scrollbar-thumb-[#5A5A5C]">
        <div className="p-4 space-y-4">
          {/* Настройки устройств */}
          <Collapsible open={openSections.deviceSettings} onOpenChange={() => toggleSection("deviceSettings")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <Headphones className="h-4 w-4 text-blue-400" />
                <h3 className="font-medium text-white">{t("options.audio.deviceSettings", "Device Settings")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${openSections.deviceSettings ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                {/* Частота дискретизации */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">
                    {t("options.audio.sampleRate", "Sample Rate")}
                  </Label>
                  <Select
                    value={settings.sampleRate}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, sampleRate: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_RATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Количество каналов */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">{t("options.audio.channels", "Channels")}</Label>
                  <Select
                    value={settings.channels}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, channels: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Аудиокодек */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">{t("options.audio.codec", "Audio Codec")}</Label>
                  <Select
                    value={settings.codec}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, codec: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIO_CODEC_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
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
          <Collapsible open={openSections.mixerControls} onOpenChange={() => toggleSection("mixerControls")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <Volume2 className="h-4 w-4 text-green-400" />
                <h3 className="font-medium text-white">{t("options.audio.mixerControls", "Mixer Controls")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${openSections.mixerControls ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                {/* Громкость по умолчанию */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">
                    {t("options.audio.defaultVolume", "Default Volume")}
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.defaultVolume]}
                      onValueChange={([value]) => setSettings((prev) => ({ ...prev, defaultVolume: value }))}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0%</span>
                      <span>{settings.defaultVolume}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Битрейт */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">{t("options.audio.bitrate", "Bitrate")}</Label>
                  <Select
                    value={settings.bitrate}
                    onValueChange={(value) => setSettings((prev) => ({ ...prev, bitrate: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BITRATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Автоматическая регулировка усиления */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-gain"
                    checked={settings.autoGain}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoGain: !!checked }))}
                  />
                  <Label htmlFor="auto-gain" className="text-sm text-gray-300">
                    {t("options.audio.autoGain", "Automatic gain control")}
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Аудио эффекты (Fairlight) */}
          <Collapsible open={openSections.effects} onOpenChange={() => toggleSection("effects")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <Zap className="h-4 w-4 text-yellow-400" />
                <h3 className="font-medium text-white">{t("options.audio.effects", "Audio Effects")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${openSections.effects ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                {/* Эффекты в виде карточек */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Шумоподавление */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.noiseReduction
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[#464647] bg-[#1E1E1E] hover:border-blue-400"
                    }`}
                    onClick={() => setSettings((prev) => ({ ...prev, noiseReduction: !prev.noiseReduction }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className={`h-4 w-4 ${settings.noiseReduction ? "text-blue-400" : "text-gray-400"}`} />
                      <span
                        className={`text-sm font-medium ${settings.noiseReduction ? "text-blue-400" : "text-gray-300"}`}
                      >
                        {t("options.audio.noiseReduction", "Noise Reduction")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {t("options.audio.noiseReductionDesc", "Remove background noise")}
                    </div>
                  </div>

                  {/* Компрессор */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.compressorEnabled
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-[#464647] bg-[#1E1E1E] hover:border-orange-400"
                    }`}
                    onClick={() => setSettings((prev) => ({ ...prev, compressorEnabled: !prev.compressorEnabled }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Waves
                        className={`h-4 w-4 ${settings.compressorEnabled ? "text-orange-400" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm font-medium ${settings.compressorEnabled ? "text-orange-400" : "text-gray-300"}`}
                      >
                        {t("options.audio.compressor", "Compressor")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {t("options.audio.compressorDesc", "Dynamic range control")}
                    </div>
                  </div>

                  {/* Эквалайзер */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.equalizerEnabled
                        ? "border-green-500 bg-green-500/10"
                        : "border-[#464647] bg-[#1E1E1E] hover:border-green-400"
                    }`}
                    onClick={() => setSettings((prev) => ({ ...prev, equalizerEnabled: !prev.equalizerEnabled }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sliders
                        className={`h-4 w-4 ${settings.equalizerEnabled ? "text-green-400" : "text-gray-400"}`}
                      />
                      <span
                        className={`text-sm font-medium ${settings.equalizerEnabled ? "text-green-400" : "text-gray-300"}`}
                      >
                        {t("options.audio.equalizer", "Equalizer")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {t("options.audio.equalizerDesc", "Frequency adjustment")}
                    </div>
                  </div>

                  {/* Реверберация */}
                  <div
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      settings.reverbEnabled
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-[#464647] bg-[#1E1E1E] hover:border-purple-400"
                    }`}
                    onClick={() => setSettings((prev) => ({ ...prev, reverbEnabled: !prev.reverbEnabled }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Speaker className={`h-4 w-4 ${settings.reverbEnabled ? "text-purple-400" : "text-gray-400"}`} />
                      <span
                        className={`text-sm font-medium ${settings.reverbEnabled ? "text-purple-400" : "text-gray-300"}`}
                      >
                        {t("options.audio.reverb", "Reverb")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{t("options.audio.reverbDesc", "Spatial audio effect")}</div>
                  </div>
                </div>

                {/* Статус эффектов */}
                <div className="mt-4 p-3 bg-[#1E1E1E] rounded border border-[#464647]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-400">{t("options.audio.effectsStatus", "Effects Status")}</div>
                    <div className="flex items-center gap-1">
                      {[
                        settings.noiseReduction,
                        settings.compressorEnabled,
                        settings.equalizerEnabled,
                        settings.reverbEnabled,
                      ].filter(Boolean).length > 0 && <div className="w-2 h-2 rounded-full bg-green-400" />}
                      <span className="text-xs text-gray-400">
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Music className="h-3 w-3 text-blue-400" />
                        <span className="text-sm text-white">{currentAudioClip.name}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {t("options.audio.duration", "Duration")}: {Math.round(currentAudioClip.duration || 0)}s
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm">
                      {t("options.audio.noClipSelected", "No audio clip selected")}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Дополнительные настройки */}
          <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection("advanced")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <Settings className="h-4 w-4 text-purple-400" />
                <h3 className="font-medium text-white">{t("options.audio.advanced", "Advanced Settings")}</h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${openSections.advanced ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                {/* Размер буфера */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">
                    {t("options.audio.bufferSize", "Buffer Size (samples)")}
                  </Label>
                  <Input
                    type="number"
                    value={settings.bufferSize}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, bufferSize: Number.parseInt(e.target.value, 10) || 512 }))
                    }
                    min="128"
                    max="2048"
                    step="128"
                    className="h-8"
                  />
                </div>

                {/* Задержка */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">
                    {t("options.audio.latency", "Latency (ms)")}
                  </Label>
                  <Input
                    type="number"
                    value={settings.latency}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, latency: Number.parseInt(e.target.value, 10) || 20 }))
                    }
                    min="0"
                    max="100"
                    step="5"
                    className="h-8"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Нижняя панель с кнопками */}
      <div className="flex-shrink-0 bg-[#2D2D30] border-t border-[#464647] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Fairlight интеграция */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs flex items-center gap-2 hover:bg-blue-500/20 hover:text-blue-400"
            >
              <AudioLines className="h-3 w-3" />
              {t("options.audio.fairlight", "Fairlight Console")}
            </Button>

            {/* Индикатор MIDI */}
            <div className="flex items-center gap-1 px-2 py-1 bg-[#1E1E1E] rounded border border-[#464647]">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">MIDI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Статус активных эффектов */}
            {[
              settings.noiseReduction,
              settings.compressorEnabled,
              settings.equalizerEnabled,
              settings.reverbEnabled,
            ].filter(Boolean).length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded border border-green-500/30">
                <Zap className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">
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

            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={handleReset}>
              {t("common.reset", "Reset")}
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleApply}>
              {t("common.apply", "Apply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

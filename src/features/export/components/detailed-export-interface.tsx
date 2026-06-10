import { OutputFormat } from "@timeline-studio/core/types"
import { Button } from "@timeline-studio/ui/components/button"
import { Checkbox } from "@timeline-studio/ui/components/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@timeline-studio/ui/components/collapsible"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
import { RadioGroup, RadioGroupItem } from "@timeline-studio/ui/components/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { ChevronDown, ChevronRight, Folder } from "lucide-react"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TimelineProject } from "@/features/timeline/types"
import { cn } from "@/lib/utils"
import { FORMAT_OPTIONS, FRAME_RATE_OPTIONS, RESOLUTION_PRESETS } from "../constants/export-constants"
import type { ExportProgress, ExportSettings } from "../types/export-types"
import type { TransitionExportSettings } from "../types/transition-export-types"
import { ExportPresets } from "./export-presets"
import { TransitionExportSettingsComponent } from "./transition-export-settings"

interface DetailedExportInterfaceProps {
  settings: TransitionExportSettings & {
    exportVideo?: boolean
    exportAudio?: boolean
    bitrateMode?: "auto" | "limit"
    bitrate?: number
    encodingProfile?: "main" | "main10" | "high"
    entropyMode?: "cabac" | "cavlc"
    keyframeMode?: "auto" | "every"
    keyframeInterval?: number
    optimizeForSpeed?: boolean
    optimizeForNetwork?: boolean
    multipassEncoding?: boolean
    frameReordering?: boolean
    useVerticalResolution?: boolean
    useProxyMedia?: boolean
    renderWithoutTimecode?: boolean
    interlacedRendering?: boolean
    normalizeAudio?: boolean
    audioTarget?: number
    audioCodec?: string
    audioChannels?: string
    embedInfoAsProject?: boolean
    chaptersByMarkers?: boolean
  }
  onSettingsChange: (updates: Partial<TransitionExportSettings>) => void
  onChooseFolder: () => void
  onExport: () => void
  onCancelExport: () => void
  onClose: () => void
  isRendering: boolean
  renderProgress: ExportProgress | null
  hasProject: boolean
  project?: TimelineProject
}

export function DetailedExportInterface({
  settings,
  onSettingsChange,
  onChooseFolder,
  onExport,
  onCancelExport,
  onClose,
  isRendering,
  renderProgress,
  hasProject,
  project,
}: DetailedExportInterfaceProps) {
  const { t } = useTranslation()
  const [selectedPresetId, setSelectedPresetId] = useState("custom")
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showSubtitlesSettings, setShowSubtitlesSettings] = useState(false)
  const [renderMode, setRenderMode] = useState<"single" | "individual">("single")
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "file" | "transitions">("video")

  const renderModeId = useId()

  // Обработчик выбора пресета
  const handlePresetSelect = (preset: any) => {
    setSelectedPresetId(preset.id)
    if (preset.id !== "custom") {
      // Применяем настройки пресета
      const updates: Partial<ExportSettings> = {}

      if (preset.settings.format) {
        updates.format = preset.settings.format
      }
      if (preset.settings.codec) {
        // Устанавливаем кодек в зависимости от формата
        if (preset.settings.format === OutputFormat.Mov && preset.settings.codec === "prores") {
          // ProRes настройки
          updates.encodingProfile = undefined
        } else if (preset.settings.codec === "h264") {
          updates.encodingProfile = preset.settings.codecProfile || "high"
        } else if (preset.settings.codec === "h265") {
          updates.encodingProfile = preset.settings.codecProfile || "main10"
        }
      }
      if (preset.settings.resolution && preset.settings.resolution !== "timeline") {
        updates.resolution = preset.settings.resolution
      }
      if (preset.settings.fps && preset.settings.fps !== "timeline") {
        updates.frameRate = preset.settings.fps
      }
      if (preset.settings.useHardwareAcceleration !== undefined) {
        updates.enableGPU = preset.settings.useHardwareAcceleration
      }
      if (preset.settings.useVerticalResolution !== undefined) {
        updates.useVerticalResolution = preset.settings.useVerticalResolution
      }
      if (preset.settings.normalizeAudio !== undefined) {
        updates.normalizeAudio = preset.settings.normalizeAudio
      }
      if (preset.settings.audioTarget !== undefined) {
        updates.audioTarget = preset.settings.audioTarget
      }
      if (preset.settings.bitrate !== undefined) {
        updates.bitrate = preset.settings.bitrate
        updates.bitrateMode = preset.settings.bitrateMode || "limit"
      }
      if (preset.settings.optimizeForSpeed !== undefined) {
        updates.optimizeForSpeed = preset.settings.optimizeForSpeed
      }

      onSettingsChange(updates)
    }
  }

  return (
    <div className="space-y-4" data-oid="f898wbq">
      {/* Пресеты */}
      <ExportPresets
        selectedPresetId={selectedPresetId}
        onSelectPreset={handlePresetSelect}
        className="-mx-6 px-6"
        data-oid="7v_5amw"
      />

      <div className="grid grid-cols-2 gap-6" data-oid="xcs5auu">
        <div className="space-y-4" data-oid="f4wsydq">
          {/* File Name */}
          <div className="space-y-2" data-oid="n5ou8ob">
            <Label data-oid="zx:ea6p">{t("dialogs.export.fileName")}</Label>
            <Input
              placeholder={t("dialogs.export.name")}
              value={settings.fileName}
              onChange={(e) => onSettingsChange({ fileName: e.target.value })}
              disabled={isRendering}
              data-oid="cq95mxf"
            />
          </div>

          {/* Save Location */}
          <div className="space-y-2" data-oid="6sa43-p">
            <Label data-oid="n2f5pbp">{t("dialogs.export.saveTo")}</Label>
            <div className="grid grid-cols-[1fr,auto] gap-2" data-oid="_0t0m_d">
              <Input
                value={settings.savePath || ""}
                placeholder={t("dialogs.export.selectPath")}
                readOnly
                disabled={isRendering}
                data-oid="s9qiwa2"
              />

              <Button variant="outline" size="icon" onClick={onChooseFolder} disabled={isRendering} data-oid="fj9ft-:">
                <Folder className="h-4 w-4" data-oid="..7soa." />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4" data-oid="sb6z831">
          {/* Режим рендеринга */}
          <div className="space-y-2" data-oid="cektznf">
            <Label data-oid="sr2-7ra">{t("dialogs.export.renderMode")}</Label>
            <RadioGroup value={renderMode} onValueChange={(v) => setRenderMode(v as any)} data-oid="hdj58ti">
              <div className="flex items-center space-x-2" data-oid="n_j11f7">
                <RadioGroupItem value="single" id={`${renderModeId}-single`} data-oid="v1qz12x" />

                <Label htmlFor={`${renderModeId}-single`} className="font-normal cursor-pointer" data-oid="q4z_ew-">
                  {t("dialogs.export.singleClip")}
                </Label>
              </div>
              <div className="flex items-center space-x-2" data-oid="ufjl-od">
                <RadioGroupItem value="individual" id={`${renderModeId}-individual`} data-oid="30flkda" />

                <Label htmlFor={`${renderModeId}-individual`} className="font-normal cursor-pointer" data-oid="16wu_gc">
                  {t("dialogs.export.individualClips")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Вкладки Видео/Аудио/Файл/Переходы */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full" data-oid="kvr9udr">
            <TabsList className="grid w-full grid-cols-4" data-oid="q2:x6a-">
              <TabsTrigger value="video" data-oid="tvyo_wl">
                {t("dialogs.export.video")}
              </TabsTrigger>
              <TabsTrigger value="audio" data-oid="c7_24c6">
                {t("dialogs.export.audio")}
              </TabsTrigger>
              <TabsTrigger value="file" data-oid="b.bqa9u">
                {t("dialogs.export.file")}
              </TabsTrigger>
              <TabsTrigger value="transitions" data-oid="80pujtd">
                {t("dialogs.export.transitions")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="space-y-4" data-oid="q-:3-nv">
              {/* Checkbox Экспорт видео */}
              <div className="flex items-center space-x-2" data-oid="3mp1pv2">
                <Checkbox
                  id={`${renderModeId}-export-video`}
                  checked={settings.exportVideo ?? true}
                  onCheckedChange={(checked) => onSettingsChange({ exportVideo: checked as boolean })}
                  data-oid="05_5qbt"
                />

                <Label htmlFor={`${renderModeId}-export-video`} data-oid="m2lwous">
                  {t("dialogs.export.exportVideo")}
                </Label>
              </div>

              {/* Формат */}
              <div className="space-y-2" data-oid="fhflxkn">
                <Label data-oid="ue8kz0m">{t("dialogs.export.format")}</Label>
                <Select
                  value={settings.format}
                  onValueChange={(value) => onSettingsChange({ format: value as any })}
                  disabled={isRendering}
                  data-oid="pa9mads"
                >
                  <SelectTrigger data-oid="nqgry6u">
                    <SelectValue data-oid="d3lsfg6" />
                  </SelectTrigger>
                  <SelectContent data-oid="5wu3vz0">
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} data-oid="jhrbfe5">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Кодек */}
              <div className="space-y-2" data-oid="fb8z6bl">
                <Label data-oid="2s8nv73">{t("dialogs.export.codec")}</Label>
                <Select
                  value={settings.format === OutputFormat.Mov ? "prores" : "h264"}
                  onValueChange={(_value) => {
                    // Кодек определяется форматом в наших пресетах
                  }}
                  disabled={isRendering}
                  data-oid="lm4sucz"
                >
                  <SelectTrigger data-oid="ta9ny51">
                    <SelectValue data-oid="wc.gx3h" />
                  </SelectTrigger>
                  <SelectContent data-oid="afu17x7">
                    {settings.format === OutputFormat.Mov ? (
                      <SelectItem value="prores" data-oid="os_-8d8">
                        Apple ProRes
                      </SelectItem>
                    ) : (
                      <>
                        <SelectItem value="h264" data-oid="t882hj_">
                          H.264
                        </SelectItem>
                        <SelectItem value="h265" data-oid="-s:37-q">
                          H.265
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Тип кодека (для ProRes) */}
              {settings.format === OutputFormat.Mov && (
                <div className="space-y-2" data-oid="_2otfkl">
                  <Label data-oid="s-8xp8x">{t("dialogs.export.codecType")}</Label>
                  <Select value="prores422hq" disabled={isRendering} data-oid="6-bxfwd">
                    <SelectTrigger data-oid="vjpriea">
                      <SelectValue data-oid="gc:94pe" />
                    </SelectTrigger>
                    <SelectContent data-oid="5urifv7">
                      <SelectItem value="prores422hq" data-oid="bl9nmvp">
                        Apple ProRes 422 HQ
                      </SelectItem>
                      <SelectItem value="prores422" data-oid="8w3q46a">
                        Apple ProRes 422
                      </SelectItem>
                      <SelectItem value="prores422lt" data-oid="lo6:p2k">
                        Apple ProRes 422 LT
                      </SelectItem>
                      <SelectItem value="prores422proxy" data-oid=".6w1j8l">
                        Apple ProRes 422 Proxy
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Чекбоксы для видео */}
              <div className="space-y-2" data-oid="j15qrlx">
                <div className="flex items-center space-x-2" data-oid="fl2o2m5">
                  <Checkbox
                    id={`${renderModeId}-interlaced-rendering`}
                    checked={settings.interlacedRendering ?? false}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        interlacedRendering: checked as boolean,
                      })
                    }
                    data-oid="icfuxdu"
                  />

                  <Label htmlFor={`${renderModeId}-interlaced-rendering`} className="text-sm" data-oid="nmm_vi8">
                    {t("dialogs.export.interlacedRendering")}
                  </Label>
                </div>

                <div className="flex items-center space-x-2" data-oid="8fi:ht_">
                  <Checkbox
                    id={`${renderModeId}-optimize-network`}
                    checked={settings.optimizeForNetwork ?? false}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        optimizeForNetwork: checked as boolean,
                      })
                    }
                    data-oid="koqg_-9"
                  />

                  <Label htmlFor={`${renderModeId}-optimize-network`} className="text-sm" data-oid="m.sz8.0">
                    {t("dialogs.export.optimizeForNetwork")}
                  </Label>
                </div>
              </div>

              {/* Разрешение */}
              <div className="space-y-2" data-oid="d2vpsft">
                <Label data-oid="8goq0dt">{t("dialogs.export.resolution")}</Label>
                <Select
                  value={settings.resolution}
                  onValueChange={(value) => onSettingsChange({ resolution: value as any })}
                  disabled={isRendering}
                  data-oid="luvo8g8"
                >
                  <SelectTrigger data-oid="_y4q4td">
                    <SelectValue data-oid="lb_9t:r" />
                  </SelectTrigger>
                  <SelectContent data-oid="jn90rb_">
                    {Object.entries(RESOLUTION_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key} data-oid=".z8wpj0">
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ручной ввод разрешения для Timeline Resolution */}
              {settings.resolution === "timeline" && (
                <div className="grid grid-cols-3 gap-2 items-center" data-oid="e9pb7we">
                  <Input placeholder="1920" disabled data-oid="ofydxod" />
                  <div className="text-center text-sm" data-oid="wd.x.79">
                    x
                  </div>
                  <Input placeholder="1080" disabled data-oid="f6as0xz" />
                </div>
              )}

              {/* Use vertical resolution */}
              <div className="flex items-center space-x-2" data-oid="0zik6ms">
                <Checkbox
                  id={`${renderModeId}-use-vertical-resolution`}
                  checked={settings.useVerticalResolution ?? false}
                  onCheckedChange={(checked) =>
                    onSettingsChange({
                      useVerticalResolution: checked as boolean,
                    })
                  }
                  data-oid="bxfj_-."
                />

                <Label htmlFor={`${renderModeId}-use-vertical-resolution`} className="text-sm" data-oid=".trapfi">
                  {t("dialogs.export.useVerticalResolution")}
                </Label>
              </div>

              {/* Частота кадров */}
              <div className="space-y-2" data-oid="tr2sxhq">
                <Label data-oid="ualj7vm">{t("dialogs.export.frameRate")}</Label>
                <Select
                  value={settings.frameRate}
                  onValueChange={(value) => onSettingsChange({ frameRate: value })}
                  disabled={isRendering}
                  data-oid="6c2mesp"
                >
                  <SelectTrigger data-oid="9s96r-t">
                    <SelectValue data-oid="x3icifu" />
                  </SelectTrigger>
                  <SelectContent data-oid="pxkjw8:">
                    {FRAME_RATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} data-oid="n:1n458">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Главы по маркерам */}
              <div className="flex items-center space-x-2" data-oid="q5c_jd3">
                <Checkbox
                  id={`${renderModeId}-chapters-by-markers`}
                  checked={settings.chaptersByMarkers ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ chaptersByMarkers: checked as boolean })}
                  data-oid="qtue0mw"
                />

                <Label htmlFor={`${renderModeId}-chapters-by-markers`} className="text-sm" data-oid="n7:012q">
                  {t("dialogs.export.chaptersByMarkers")}
                </Label>
                <ChevronDown className="h-4 w-4 text-muted-foreground" data-oid="59wt_x:" />
              </div>

              {/* Использовать постоянный битрейт (только для H.264/H.265) */}
              {settings.format !== OutputFormat.Mov && (
                <div className="flex items-center space-x-2" data-oid="ce1kncv">
                  <Checkbox
                    id={`${renderModeId}-constant-bitrate`}
                    checked={settings.bitrateMode === "limit"}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        bitrateMode: checked ? "limit" : "auto",
                      })
                    }
                    data-oid="v0co9.h"
                  />

                  <Label htmlFor={`${renderModeId}-constant-bitrate`} className="text-sm" data-oid="itkg8ji">
                    {t("dialogs.export.constantBitrate")}
                  </Label>
                </div>
              )}

              {/* Качество */}
              <div className="space-y-2" data-oid="px.jqnc">
                <Label data-oid="hao9pae">{t("dialogs.export.quality")}</Label>
                <RadioGroup
                  value={settings.bitrateMode || "auto"}
                  onValueChange={(v) => onSettingsChange({ bitrateMode: v as any })}
                  data-oid="6jfyjh3"
                >
                  <div className="flex items-center space-x-2" data-oid="nao6bb-">
                    <RadioGroupItem value="auto" id={`${renderModeId}-auto`} data-oid="8b5wmw." />

                    <Label htmlFor={`${renderModeId}-auto`} className="font-normal" data-oid="kbqyl5g">
                      {t("dialogs.export.auto")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2" data-oid="89kvj9:">
                    <RadioGroupItem value="limit" id={`${renderModeId}-limit`} data-oid="z64z8j_" />

                    <Label htmlFor={`${renderModeId}-limit`} className="font-normal" data-oid="ddcqre1">
                      {t("dialogs.export.limitTo")}
                    </Label>
                    <Input
                      type="number"
                      value={settings.bitrate || 8000}
                      onChange={(e) =>
                        onSettingsChange({
                          bitrate: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-24"
                      disabled={settings.bitrateMode === "auto"}
                      data-oid="dgpemyi"
                    />

                    <span className="text-sm" data-oid="fqcsgej">
                      Kbps
                    </span>
                  </div>
                  <div className="flex items-center space-x-2" data-oid="f0goqf_">
                    <span className="text-sm text-muted-foreground ml-6" data-oid="_h42c57">
                      {t("dialogs.export.limitSpeed")}
                    </span>
                    <Input
                      type="number"
                      placeholder="6"
                      className="w-16"
                      disabled={settings.bitrateMode === "auto"}
                      data-oid="yrw4oku"
                    />

                    <span className="text-sm" data-oid="us04g74">
                      {t("dialogs.export.seconds")}
                    </span>
                  </div>
                </RadioGroup>

                {/* Оптимизация для скорости */}
                <div className="flex items-center space-x-2" data-oid="oe1o.9q">
                  <Checkbox
                    id={`${renderModeId}-optimize-speed`}
                    checked={settings.optimizeForSpeed ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ optimizeForSpeed: checked as boolean })}
                    data-oid="lxqd4nd"
                  />

                  <Label htmlFor={`${renderModeId}-optimize-speed`} className="text-sm" data-oid="utgca..">
                    {t("dialogs.export.optimizeForSpeed")}
                  </Label>
                </div>
              </div>

              {/* Профиль кодирования (только для H.264/H.265) */}
              {settings.format !== OutputFormat.Mov && (
                <div className="space-y-2" data-oid="ecu-zo2">
                  <Label data-oid="_xrd-ts">{t("dialogs.export.encodingProfile")}</Label>
                  <Select
                    value={settings.encodingProfile || "main"}
                    onValueChange={(v) => onSettingsChange({ encodingProfile: v as any })}
                    data-oid="zvmqz9y"
                  >
                    <SelectTrigger data-oid="orqain3">
                      <SelectValue data-oid="jh1o0df" />
                    </SelectTrigger>
                    <SelectContent data-oid="j5kz-gl">
                      <SelectItem value="main" data-oid="19027rf">
                        Main
                      </SelectItem>
                      <SelectItem value="main10" data-oid="i_x22k2">
                        Main10
                      </SelectItem>
                      <SelectItem value="high" data-oid="-c1zlu7">
                        High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Режим энтропии (только для H.264) */}
              {settings.format === OutputFormat.Mp4 && settings.encodingProfile !== "main10" && (
                <div className="space-y-2" data-oid="1h8kxdq">
                  <Label data-oid="bo5mypx">{t("dialogs.export.entropyMode")}</Label>
                  <Select
                    value={settings.entropyMode || "cabac"}
                    onValueChange={(v) => onSettingsChange({ entropyMode: v as any })}
                    data-oid="3pxp7x3"
                  >
                    <SelectTrigger data-oid="mhsobd9">
                      <SelectValue data-oid="3c11a53" />
                    </SelectTrigger>
                    <SelectContent data-oid="76pc895">
                      <SelectItem value="cabac" data-oid="k.wbpey">
                        CABAC
                      </SelectItem>
                      <SelectItem value="cavlc" data-oid="fwz0qk0">
                        CAVLC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Чекбокс многократное кодирование */}
              <div className="flex items-center space-x-2" data-oid="i42usrs">
                <Checkbox
                  id={`${renderModeId}-multipass`}
                  checked={settings.multipassEncoding ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ multipassEncoding: checked as boolean })}
                  data-oid="adxzrlx"
                />

                <Label htmlFor={`${renderModeId}-multipass`} className="text-sm" data-oid="z0oqkss">
                  {t("dialogs.export.multipassEncoding")}
                </Label>
              </div>

              {/* Ключевые кадры */}
              <div className="space-y-2" data-oid="k7m2t3:">
                <Label data-oid="9e_kif2">{t("dialogs.export.keyframes")}</Label>
                <RadioGroup
                  value={settings.keyframeMode || "auto"}
                  onValueChange={(v) => onSettingsChange({ keyframeMode: v as "auto" | "every" })}
                  data-oid="gp0hkeo"
                >
                  <div className="flex items-center space-x-2" data-oid="svqrxiw">
                    <RadioGroupItem value="auto" id={`${renderModeId}-kf-auto`} data-oid="yemnu5d" />

                    <Label htmlFor={`${renderModeId}-kf-auto`} className="font-normal" data-oid="5ray7qm">
                      {t("dialogs.export.auto")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2" data-oid="c682.2s">
                    <RadioGroupItem value="every" id={`${renderModeId}-kf-every`} data-oid="-x7tib_" />

                    <Label htmlFor={`${renderModeId}-kf-every`} className="font-normal" data-oid="32c4jpa">
                      {t("dialogs.export.every")}
                    </Label>
                    <Input
                      type="number"
                      value={settings.keyframeInterval || 30}
                      onChange={(e) =>
                        onSettingsChange({
                          keyframeInterval: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="w-16"
                      disabled={settings.keyframeMode === "auto"}
                      data-oid="65.6arb"
                    />

                    <span className="text-sm" data-oid="s36bpim">
                      {t("dialogs.export.frames")}
                    </span>
                  </div>
                </RadioGroup>

                {/* Реорганизация кадров */}
                <div className="flex items-center space-x-2" data-oid="zytjoej">
                  <Checkbox
                    id={`${renderModeId}-frame-reordering`}
                    checked={settings.frameReordering ?? true}
                    onCheckedChange={(checked) => onSettingsChange({ frameReordering: checked as boolean })}
                    data-oid="k1l6g4l"
                  />

                  <Label htmlFor={`${renderModeId}-frame-reordering`} className="text-sm" data-oid="2w2wnzv">
                    {t("dialogs.export.frameReordering")}
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4" data-oid="zl1-40j">
              {/* Checkbox Экспорт аудио */}
              <div className="flex items-center space-x-2" data-oid="z09do1n">
                <Checkbox
                  id={`${renderModeId}-export-audio`}
                  checked={settings.exportAudio ?? true}
                  onCheckedChange={(checked) => onSettingsChange({ exportAudio: checked as boolean })}
                  data-oid="1_7yhu9"
                />

                <Label htmlFor={`${renderModeId}-export-audio`} data-oid="2iq-20l">
                  {t("dialogs.export.exportAudio")}
                </Label>
              </div>

              {/* Аудио настройки */}
              <div className="space-y-2" data-oid="7v1fbb6">
                <Label data-oid="_3e:aqy">{t("dialogs.export.audioCodec")}</Label>
                <Select
                  value={settings.audioCodec || "aac"}
                  onValueChange={(v) => onSettingsChange({ audioCodec: v })}
                  data-oid="ck6s-fl"
                >
                  <SelectTrigger data-oid="t8je.tw">
                    <SelectValue data-oid="7ugv75t" />
                  </SelectTrigger>
                  <SelectContent data-oid="x6qjw2x">
                    <SelectItem value="aac" data-oid="1at5gf9">
                      AAC
                    </SelectItem>
                    <SelectItem value="mp3" data-oid="43znbf4">
                      MP3
                    </SelectItem>
                    <SelectItem value="pcm" data-oid="io9y6as">
                      PCM
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid="8m7.z5y">
                <Label data-oid="g64q6es">{t("dialogs.export.audioChannels")}</Label>
                <Select
                  value={settings.audioChannels || "stereo"}
                  onValueChange={(v) => onSettingsChange({ audioChannels: v })}
                  data-oid="g._6whx"
                >
                  <SelectTrigger data-oid="1shz:l:">
                    <SelectValue data-oid="qd0tqlo" />
                  </SelectTrigger>
                  <SelectContent data-oid="t64s:rr">
                    <SelectItem value="mono" data-oid="x9ag346">
                      Mono
                    </SelectItem>
                    <SelectItem value="stereo" data-oid="2jolhcq">
                      Bus 1 (Stereo)
                    </SelectItem>
                    <SelectItem value="5.1" data-oid="d184wg7">
                      5.1 Surround
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Normalize Audio */}
              <div className="flex items-center space-x-2" data-oid="c.zdokf">
                <Checkbox
                  id={`${renderModeId}-normalize-audio`}
                  checked={settings.normalizeAudio ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ normalizeAudio: checked as boolean })}
                  data-oid="jjky66n"
                />

                <Label htmlFor={`${renderModeId}-normalize-audio`} className="text-sm" data-oid="ul40rvm">
                  {t("dialogs.export.normalizeAudio")}
                </Label>
              </div>

              {settings.normalizeAudio && (
                <div className="space-y-2 ml-6" data-oid="kouvqfb">
                  <RadioGroup value="standard" onValueChange={() => {}} data-oid="phivc.1">
                    <div className="flex items-center space-x-2" data-oid="x5ilhz2">
                      <RadioGroupItem value="standard" id={`${renderModeId}-normalize-standard`} data-oid="igco7zb" />

                      <Label htmlFor={`${renderModeId}-normalize-standard`} className="font-normal" data-oid="v_r:6.o">
                        {t("dialogs.export.normalizeToStandard")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2" data-oid="y_wqx8-">
                      <RadioGroupItem value="optimize" id={`${renderModeId}-optimize-standard`} data-oid="j-45qr8" />

                      <Label htmlFor={`${renderModeId}-optimize-standard`} className="font-normal" data-oid="veuimp6">
                        {t("dialogs.export.optimizeToStandard")}
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="space-y-2" data-oid="b4.ry0.">
                    <Label data-oid=".fibo50">{t("dialogs.export.standard")}</Label>
                    <Select value="youtube" onValueChange={() => {}} data-oid="m9uqup4">
                      <SelectTrigger data-oid="19.ua6k">
                        <SelectValue data-oid="3eyi8nq" />
                      </SelectTrigger>
                      <SelectContent data-oid="bg1yudl">
                        <SelectItem value="youtube" data-oid="whj46a4">
                          YouTube
                        </SelectItem>
                        <SelectItem value="broadcast" data-oid="8--hg_q">
                          Broadcast
                        </SelectItem>
                        <SelectItem value="streaming" data-oid="_hpzcg5">
                          Streaming
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-oid="inct:e0">
                    <div className="space-y-2" data-oid=":n-tet3">
                      <Label data-oid="8q6_1rl">{t("dialogs.export.targetLevel")}</Label>
                      <div className="flex items-center gap-2" data-oid="y99ts1o">
                        <Input
                          value={settings.audioTarget || -14}
                          onChange={(e) =>
                            onSettingsChange({
                              audioTarget: Number(e.target.value),
                            })
                          }
                          className="w-20"
                          data-oid="i1g0p:x"
                        />

                        <span className="text-sm" data-oid="kllkx1w">
                          dBTP
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2" data-oid="io--pkg">
                      <Label data-oid="vgqns3e">{t("dialogs.export.targetLoudness")}</Label>
                      <div className="flex items-center gap-2" data-oid="pwwuksm">
                        <Input
                          value={settings.audioTarget || -14}
                          onChange={(e) =>
                            onSettingsChange({
                              audioTarget: Number(e.target.value),
                            })
                          }
                          className="w-20"
                          data-oid="1u9s1ty"
                        />

                        <span className="text-sm" data-oid="1yv30cw">
                          LKFS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="file" className="space-y-4" data-oid="zmsrkh3">
              {/* Вставка информации */}
              <div className="space-y-2" data-oid="373btjn">
                <Label data-oid="mssqghi">{t("dialogs.export.embedInfo")}</Label>
                <Select
                  value={settings.embedInfoAsProject ? "project" : "none"}
                  onValueChange={(v) => onSettingsChange({ embedInfoAsProject: v === "project" })}
                  data-oid="qxgghv1"
                >
                  <SelectTrigger data-oid="0nf40ae">
                    <SelectValue data-oid="hz1b58s" />
                  </SelectTrigger>
                  <SelectContent data-oid="_aqu1j_">
                    <SelectItem value="none" data-oid="ud9z88c">
                      {t("dialogs.export.none")}
                    </SelectItem>
                    <SelectItem value="project" data-oid="ddym5dv">
                      {t("dialogs.export.asProject")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Чекбоксы для файла */}
              <div className="space-y-2" data-oid="w2h5ela">
                <div className="flex items-center space-x-2" data-oid="lbuieu0">
                  <Checkbox
                    id={`${renderModeId}-use-proxy-media`}
                    checked={settings.useProxyMedia ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ useProxyMedia: checked as boolean })}
                    data-oid="vtz8-s:"
                  />

                  <Label htmlFor={`${renderModeId}-use-proxy-media`} className="text-sm" data-oid="-l.xd.-">
                    {t("dialogs.export.useProxyMedia")}
                  </Label>
                </div>

                <div className="flex items-center space-x-2" data-oid="6j3q8bh">
                  <Checkbox
                    id={`${renderModeId}-render-without-timecode`}
                    checked={settings.renderWithoutTimecode ?? false}
                    onCheckedChange={(checked) =>
                      onSettingsChange({
                        renderWithoutTimecode: checked as boolean,
                      })
                    }
                    data-oid="xxz.5xn"
                  />

                  <Label htmlFor={`${renderModeId}-render-without-timecode`} className="text-sm" data-oid="y1jrzeh">
                    {t("dialogs.export.renderWithoutTimecode")}
                  </Label>
                </div>

                {/* Аппаратное ускорение */}
                <div className="flex items-center space-x-2" data-oid="6os-3i5">
                  <Checkbox
                    id={`${renderModeId}-enable-gpu`}
                    checked={settings.enableGPU ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ enableGPU: checked as boolean })}
                    data-oid="tzok3be"
                  />

                  <Label htmlFor="enable-gpu" className="text-sm" data-oid="15zd4zz">
                    {t("dialogs.export.enableGPUEncoding")}
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* Вкладка переходов */}
            <TabsContent value="transitions" className="space-y-4" data-oid="7bkdlx.">
              <TransitionExportSettingsComponent
                settings={settings}
                onSettingsChange={onSettingsChange}
                project={project}
                data-oid="eitc16d"
              />
            </TabsContent>
          </Tabs>

          {/* Расширенные настройки */}
          <Collapsible
            open={showAdvancedSettings}
            onOpenChange={setShowAdvancedSettings}
            className="space-y-2"
            data-oid="2e7kzve"
          >
            <CollapsibleTrigger asChild data-oid="3zpxffk">
              <Button variant="ghost" className="w-full justify-between p-2" data-oid="aypk.:l">
                <span data-oid="qd3wxk2">{t("dialogs.export.advancedSettings")}</span>
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", showAdvancedSettings && "rotate-90")}
                  data-oid="ufvs34n"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4" data-oid="rcx24l9">
              <div className="text-sm text-muted-foreground" data-oid="_7vj4hu">
                {t("dialogs.export.advancedDescription")}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Настройки субтитров */}
          <Collapsible
            open={showSubtitlesSettings}
            onOpenChange={setShowSubtitlesSettings}
            className="space-y-2"
            data-oid="ipee7mp"
          >
            <CollapsibleTrigger asChild data-oid="0s3iarc">
              <Button variant="ghost" className="w-full justify-between p-2" data-oid="ya3ys:o">
                <span data-oid="x14bs53">{t("dialogs.export.subtitlesSettings")}</span>
                <ChevronRight
                  className={cn("h-4 w-4 transition-transform", showSubtitlesSettings && "rotate-90")}
                  data-oid="qci_-5z"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4" data-oid="jq00-wo">
              <div className="text-sm text-muted-foreground" data-oid="fjsbfm:">
                {t("dialogs.export.subtitlesDescription")}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Progress and Export Button */}
          <div className="space-y-4 pt-6 border-t" data-oid="_f8r08u">
            {isRendering && renderProgress && (
              <div className="space-y-2" data-oid="w1de89-">
                <div className="flex items-center justify-between text-sm" data-oid="b3-eip_">
                  <span data-oid="xlnkfpq">{t("dialogs.export.progress")}</span>
                  <span data-oid="_z-08s2">{Math.round(renderProgress.percentage)}%</span>
                </div>
                <Progress value={renderProgress.percentage} className="h-2" data-oid="jiehmw1" />

                <div className="text-xs text-muted-foreground" data-oid="-3a96js">
                  {renderProgress.message || t("dialogs.export.rendering")}
                </div>
              </div>
            )}

            <div className="flex gap-2" data-oid=":l.ftg-">
              {isRendering ? (
                <>
                  <Button variant="outline" onClick={onCancelExport} className="flex-1" data-oid="u70326j">
                    {t("dialogs.export.cancel")}
                  </Button>
                  <Button disabled className="flex-1" data-oid="ge:bzi-">
                    {t("dialogs.export.rendering")}...
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} className="flex-1" data-oid="do0iotz">
                    {t("dialogs.export.close")}
                  </Button>
                  <Button
                    onClick={onExport}
                    disabled={!settings.savePath || !hasProject}
                    className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
                    data-oid="y3ozc86"
                  >
                    {t("dialogs.export.export")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

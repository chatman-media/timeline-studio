import { ChevronDown, ChevronRight, Folder } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OutputFormat } from "@/domains/video-editing/types"
import type { TimelineProject } from "@/features/timeline/types/timeline"
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
    <div className="space-y-4">
      {/* Пресеты */}
      <ExportPresets selectedPresetId={selectedPresetId} onSelectPreset={handlePresetSelect} className="-mx-6 px-6" />

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* File Name */}
          <div className="space-y-2">
            <Label>{t("dialogs.export.fileName")}</Label>
            <Input
              placeholder={t("dialogs.export.name")}
              value={settings.fileName}
              onChange={(e) => onSettingsChange({ fileName: e.target.value })}
              disabled={isRendering}
            />
          </div>

          {/* Save Location */}
          <div className="space-y-2">
            <Label>{t("dialogs.export.saveTo")}</Label>
            <div className="grid grid-cols-[1fr,auto] gap-2">
              <Input
                value={settings.savePath || ""}
                placeholder={t("dialogs.export.selectPath")}
                readOnly
                disabled={isRendering}
              />
              <Button variant="outline" size="icon" onClick={onChooseFolder} disabled={isRendering}>
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Режим рендеринга */}
          <div className="space-y-2">
            <Label>{t("dialogs.export.renderMode")}</Label>
            <RadioGroup value={renderMode} onValueChange={(v) => setRenderMode(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  {t("dialogs.export.singleClip")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="font-normal cursor-pointer">
                  {t("dialogs.export.individualClips")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Вкладки Видео/Аудио/Файл/Переходы */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="video">{t("dialogs.export.video")}</TabsTrigger>
              <TabsTrigger value="audio">{t("dialogs.export.audio")}</TabsTrigger>
              <TabsTrigger value="file">{t("dialogs.export.file")}</TabsTrigger>
              <TabsTrigger value="transitions">{t("dialogs.export.transitions")}</TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="space-y-4">
              {/* Checkbox Экспорт видео */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-video"
                  checked={settings.exportVideo ?? true}
                  onCheckedChange={(checked) => onSettingsChange({ exportVideo: checked as boolean })}
                />
                <Label htmlFor="export-video">{t("dialogs.export.exportVideo")}</Label>
              </div>

              {/* Формат */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.format")}</Label>
                <Select
                  value={settings.format}
                  onValueChange={(value) => onSettingsChange({ format: value as any })}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Кодек */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.codec")}</Label>
                <Select
                  value={settings.format === OutputFormat.Mov ? "prores" : "h264"}
                  onValueChange={(_value) => {
                    // Кодек определяется форматом в наших пресетах
                  }}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.format === OutputFormat.Mov ? (
                      <SelectItem value="prores">Apple ProRes</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="h264">H.264</SelectItem>
                        <SelectItem value="h265">H.265</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Тип кодека (для ProRes) */}
              {settings.format === OutputFormat.Mov && (
                <div className="space-y-2">
                  <Label>{t("dialogs.export.codecType")}</Label>
                  <Select value="prores422hq" disabled={isRendering}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prores422hq">Apple ProRes 422 HQ</SelectItem>
                      <SelectItem value="prores422">Apple ProRes 422</SelectItem>
                      <SelectItem value="prores422lt">Apple ProRes 422 LT</SelectItem>
                      <SelectItem value="prores422proxy">Apple ProRes 422 Proxy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Чекбоксы для видео */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interlaced-rendering"
                    checked={settings.interlacedRendering ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ interlacedRendering: checked as boolean })}
                  />
                  <Label htmlFor="interlaced-rendering" className="text-sm">
                    {t("dialogs.export.interlacedRendering")}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optimize-network"
                    checked={settings.optimizeForNetwork ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ optimizeForNetwork: checked as boolean })}
                  />
                  <Label htmlFor="optimize-network" className="text-sm">
                    {t("dialogs.export.optimizeForNetwork")}
                  </Label>
                </div>
              </div>

              {/* Разрешение */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.resolution")}</Label>
                <Select
                  value={settings.resolution}
                  onValueChange={(value) => onSettingsChange({ resolution: value as any })}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RESOLUTION_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ручной ввод разрешения для Timeline Resolution */}
              {settings.resolution === "timeline" && (
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Input placeholder="1920" disabled />
                  <div className="text-center text-sm">x</div>
                  <Input placeholder="1080" disabled />
                </div>
              )}

              {/* Use vertical resolution */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-vertical-resolution"
                  checked={settings.useVerticalResolution ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ useVerticalResolution: checked as boolean })}
                />
                <Label htmlFor="use-vertical-resolution" className="text-sm">
                  {t("dialogs.export.useVerticalResolution")}
                </Label>
              </div>

              {/* Частота кадров */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.frameRate")}</Label>
                <Select
                  value={settings.frameRate}
                  onValueChange={(value) => onSettingsChange({ frameRate: value })}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAME_RATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Главы по маркерам */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chapters-by-markers"
                  checked={settings.chaptersByMarkers ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ chaptersByMarkers: checked as boolean })}
                />
                <Label htmlFor="chapters-by-markers" className="text-sm">
                  {t("dialogs.export.chaptersByMarkers")}
                </Label>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Использовать постоянный битрейт (только для H.264/H.265) */}
              {settings.format !== OutputFormat.Mov && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="constant-bitrate"
                    checked={settings.bitrateMode === "limit"}
                    onCheckedChange={(checked) => onSettingsChange({ bitrateMode: checked ? "limit" : "auto" })}
                  />
                  <Label htmlFor="constant-bitrate" className="text-sm">
                    {t("dialogs.export.constantBitrate")}
                  </Label>
                </div>
              )}

              {/* Качество */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.quality")}</Label>
                <RadioGroup
                  value={settings.bitrateMode || "auto"}
                  onValueChange={(v) => onSettingsChange({ bitrateMode: v as any })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="font-normal">
                      {t("dialogs.export.auto")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limit" id="limit" />
                    <Label htmlFor="limit" className="font-normal">
                      {t("dialogs.export.limitTo")}
                    </Label>
                    <Input
                      type="number"
                      value={settings.bitrate || 8000}
                      onChange={(e) => onSettingsChange({ bitrate: Number.parseInt(e.target.value) })}
                      className="w-24"
                      disabled={settings.bitrateMode === "auto"}
                    />
                    <span className="text-sm">Kbps</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground ml-6">{t("dialogs.export.limitSpeed")}</span>
                    <Input type="number" placeholder="6" className="w-16" disabled={settings.bitrateMode === "auto"} />
                    <span className="text-sm">{t("dialogs.export.seconds")}</span>
                  </div>
                </RadioGroup>

                {/* Оптимизация для скорости */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optimize-speed"
                    checked={settings.optimizeForSpeed ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ optimizeForSpeed: checked as boolean })}
                  />
                  <Label htmlFor="optimize-speed" className="text-sm">
                    {t("dialogs.export.optimizeForSpeed")}
                  </Label>
                </div>
              </div>

              {/* Профиль кодирования (только для H.264/H.265) */}
              {settings.format !== OutputFormat.Mov && (
                <div className="space-y-2">
                  <Label>{t("dialogs.export.encodingProfile")}</Label>
                  <Select
                    value={settings.encodingProfile || "main"}
                    onValueChange={(v) => onSettingsChange({ encodingProfile: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="main10">Main10</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Режим энтропии (только для H.264) */}
              {settings.format === OutputFormat.Mp4 && settings.encodingProfile !== "main10" && (
                <div className="space-y-2">
                  <Label>{t("dialogs.export.entropyMode")}</Label>
                  <Select
                    value={settings.entropyMode || "cabac"}
                    onValueChange={(v) => onSettingsChange({ entropyMode: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabac">CABAC</SelectItem>
                      <SelectItem value="cavlc">CAVLC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Чекбокс многократное кодирование */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multipass"
                  checked={settings.multipassEncoding ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ multipassEncoding: checked as boolean })}
                />
                <Label htmlFor="multipass" className="text-sm">
                  {t("dialogs.export.multipassEncoding")}
                </Label>
              </div>

              {/* Ключевые кадры */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.keyframes")}</Label>
                <RadioGroup
                  value={settings.keyframeMode || "auto"}
                  onValueChange={(v) => onSettingsChange({ keyframeMode: v as "auto" | "every" })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="kf-auto" />
                    <Label htmlFor="kf-auto" className="font-normal">
                      {t("dialogs.export.auto")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="every" id="kf-every" />
                    <Label htmlFor="kf-every" className="font-normal">
                      {t("dialogs.export.every")}
                    </Label>
                    <Input
                      type="number"
                      value={settings.keyframeInterval || 30}
                      onChange={(e) => onSettingsChange({ keyframeInterval: Number.parseInt(e.target.value) })}
                      className="w-16"
                      disabled={settings.keyframeMode === "auto"}
                    />
                    <span className="text-sm">{t("dialogs.export.frames")}</span>
                  </div>
                </RadioGroup>

                {/* Реорганизация кадров */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="frame-reordering"
                    checked={settings.frameReordering ?? true}
                    onCheckedChange={(checked) => onSettingsChange({ frameReordering: checked as boolean })}
                  />
                  <Label htmlFor="frame-reordering" className="text-sm">
                    {t("dialogs.export.frameReordering")}
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              {/* Checkbox Экспорт аудио */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="export-audio"
                  checked={settings.exportAudio ?? true}
                  onCheckedChange={(checked) => onSettingsChange({ exportAudio: checked as boolean })}
                />
                <Label htmlFor="export-audio">{t("dialogs.export.exportAudio")}</Label>
              </div>

              {/* Аудио настройки */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.audioCodec")}</Label>
                <Select value={settings.audioCodec || "aac"} onValueChange={(v) => onSettingsChange({ audioCodec: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aac">AAC</SelectItem>
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="pcm">PCM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.audioChannels")}</Label>
                <Select
                  value={settings.audioChannels || "stereo"}
                  onValueChange={(v) => onSettingsChange({ audioChannels: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mono">Mono</SelectItem>
                    <SelectItem value="stereo">Bus 1 (Stereo)</SelectItem>
                    <SelectItem value="5.1">5.1 Surround</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Normalize Audio */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="normalize-audio"
                  checked={settings.normalizeAudio ?? false}
                  onCheckedChange={(checked) => onSettingsChange({ normalizeAudio: checked as boolean })}
                />
                <Label htmlFor="normalize-audio" className="text-sm">
                  {t("dialogs.export.normalizeAudio")}
                </Label>
              </div>

              {settings.normalizeAudio && (
                <div className="space-y-2 ml-6">
                  <RadioGroup value="standard" onValueChange={() => {}}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="normalize-standard" />
                      <Label htmlFor="normalize-standard" className="font-normal">
                        {t("dialogs.export.normalizeToStandard")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="optimize" id="optimize-standard" />
                      <Label htmlFor="optimize-standard" className="font-normal">
                        {t("dialogs.export.optimizeToStandard")}
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label>{t("dialogs.export.standard")}</Label>
                    <Select value="youtube" onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        <SelectItem value="streaming">Streaming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("dialogs.export.targetLevel")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={settings.audioTarget || -14}
                          onChange={(e) => onSettingsChange({ audioTarget: Number(e.target.value) })}
                          className="w-20"
                        />
                        <span className="text-sm">dBTP</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dialogs.export.targetLoudness")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={settings.audioTarget || -14}
                          onChange={(e) => onSettingsChange({ audioTarget: Number(e.target.value) })}
                          className="w-20"
                        />
                        <span className="text-sm">LKFS</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              {/* Вставка информации */}
              <div className="space-y-2">
                <Label>{t("dialogs.export.embedInfo")}</Label>
                <Select
                  value={settings.embedInfoAsProject ? "project" : "none"}
                  onValueChange={(v) => onSettingsChange({ embedInfoAsProject: v === "project" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("dialogs.export.none")}</SelectItem>
                    <SelectItem value="project">{t("dialogs.export.asProject")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Чекбоксы для файла */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-proxy-media"
                    checked={settings.useProxyMedia ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ useProxyMedia: checked as boolean })}
                  />
                  <Label htmlFor="use-proxy-media" className="text-sm">
                    {t("dialogs.export.useProxyMedia")}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="render-without-timecode"
                    checked={settings.renderWithoutTimecode ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ renderWithoutTimecode: checked as boolean })}
                  />
                  <Label htmlFor="render-without-timecode" className="text-sm">
                    {t("dialogs.export.renderWithoutTimecode")}
                  </Label>
                </div>

                {/* Аппаратное ускорение */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-gpu"
                    checked={settings.enableGPU ?? false}
                    onCheckedChange={(checked) => onSettingsChange({ enableGPU: checked as boolean })}
                  />
                  <Label htmlFor="enable-gpu" className="text-sm">
                    {t("dialogs.export.enableGPUEncoding")}
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* Вкладка переходов */}
            <TabsContent value="transitions" className="space-y-4">
              <TransitionExportSettingsComponent
                settings={settings}
                onSettingsChange={onSettingsChange}
                project={project}
              />
            </TabsContent>
          </Tabs>

          {/* Расширенные настройки */}
          <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings} className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <span>{t("dialogs.export.advancedSettings")}</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", showAdvancedSettings && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="text-sm text-muted-foreground">{t("dialogs.export.advancedDescription")}</div>
            </CollapsibleContent>
          </Collapsible>

          {/* Настройки субтитров */}
          <Collapsible open={showSubtitlesSettings} onOpenChange={setShowSubtitlesSettings} className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2">
                <span>{t("dialogs.export.subtitlesSettings")}</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", showSubtitlesSettings && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="text-sm text-muted-foreground">{t("dialogs.export.subtitlesDescription")}</div>
            </CollapsibleContent>
          </Collapsible>

          {/* Progress and Export Button */}
          <div className="space-y-4 pt-6 border-t">
            {isRendering && renderProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t("dialogs.export.progress")}</span>
                  <span>{Math.round(renderProgress.percentage)}%</span>
                </div>
                <Progress value={renderProgress.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {renderProgress.message || t("dialogs.export.rendering")}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {isRendering ? (
                <>
                  <Button variant="outline" onClick={onCancelExport} className="flex-1">
                    {t("dialogs.export.cancel")}
                  </Button>
                  <Button disabled className="flex-1">
                    {t("dialogs.export.rendering")}...
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    {t("dialogs.export.close")}
                  </Button>
                  <Button
                    onClick={onExport}
                    disabled={!settings.savePath || !hasProject}
                    className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
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

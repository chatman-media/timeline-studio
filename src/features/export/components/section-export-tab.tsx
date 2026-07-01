import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Checkbox } from "@timeline-studio/ui/components/checkbox"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { RadioGroup, RadioGroupItem } from "@timeline-studio/ui/components/radio-group"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Clock, Flag, Play, Scissors, Video } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"

import type { ExportSettings } from "../types/export-types"

interface SectionExportTabProps {
  defaultSettings: ExportSettings
  onExport: (settings: ExportSettings & { sections: ExportSection[] }) => void
  onPreviewSection?: (startTime: number) => void
}

interface ExportSection {
  id: string
  name: string
  startTime: number
  endTime: number
  includeInExport: boolean
  customFileName?: string
  customSettings?: Partial<ExportSettings>
}

interface TimeMarker {
  id: string
  name: string
  time: number
  type: "start" | "end" | "marker"
}

export function SectionExportTab({ defaultSettings, onExport, onPreviewSection }: SectionExportTabProps) {
  const { t } = useTranslation()
  const { project, seek } = useTimeline()
  const markersId = useId()
  const clipsId = useId()
  const manualId = useId()
  const [exportMode, setExportMode] = useState<"markers" | "manual" | "clips">("markers")
  const [sections, setSections] = useState<ExportSection[]>([])
  const [manualStart, setManualStart] = useState("00:00:00")
  const [manualEnd, setManualEnd] = useState("00:00:10")
  const [selectedQuality, setSelectedQuality] = useState<"preview" | "draft" | "final">("final")

  // Convert markers to sections
  useEffect(() => {
    if (exportMode === "markers" && project) {
      const markers = (project as any).markers
      if (markers && markers.length > 0) {
        // Используем маркеры для создания секций
        const markerSections: ExportSection[] = []
        const sortedMarkers = [...markers].sort((a: any, b: any) => a.time - b.time)

        for (let i = 0; i < sortedMarkers.length; i++) {
          const currentMarker = sortedMarkers[i]
          const nextMarker = sortedMarkers[i + 1]

          // Определяем конец секции как следующий маркер или конец проекта
          const endTime = nextMarker ? nextMarker.time : project.duration

          markerSections.push({
            id: currentMarker.id,
            name: currentMarker.name,
            startTime: currentMarker.time,
            endTime: endTime,
            includeInExport: true,
          })
        }

        setSections(markerSections)
      } else {
        // Fallback: используем секции проекта как маркеры
        const markerSections: ExportSection[] = project.sections.map((section) => ({
          id: section.id,
          name: section.name,
          startTime: section.startTime,
          endTime: section.endTime,
          includeInExport: true,
        }))
        setSections(markerSections)
      }
    }
  }, [exportMode, project])

  // Convert clips to sections
  useEffect(() => {
    if (exportMode === "clips" && project) {
      // Собираем все клипы из всех треков всех секций
      const clipSections: ExportSection[] = []

      project.sections.forEach((section) => {
        section.tracks.forEach((track) => {
          track.clips.forEach((clip) => {
            clipSections.push({
              id: clip.id,
              name: clip.name || `${track.name} - Clip`,
              startTime: section.startTime + clip.startTime,
              endTime: section.startTime + clip.startTime + clip.duration,
              includeInExport: true,
            })
          })
        })
      })

      // Сортируем по времени начала
      clipSections.sort((a, b) => a.startTime - b.startTime)
      setSections(clipSections)
    }
  }, [exportMode, project])

  const handleToggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, includeInExport: !section.includeInExport } : section,
      ),
    )
  }

  const handleSelectAll = () => {
    const allSelected = sections.every((s) => s.includeInExport)
    setSections((prev) => prev.map((section) => ({ ...section, includeInExport: !allSelected })))
  }

  const handleUpdateSectionName = (sectionId: string, name: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, customFileName: name } : section)),
    )
  }

  const formatTimeShort = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(":").map((p) => Number.parseInt(p, 10) || 0)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  const handleManualSection = () => {
    const startSeconds = parseTime(manualStart)
    const endSeconds = parseTime(manualEnd)

    if (startSeconds < endSeconds) {
      setSections([
        {
          id: "manual-1",
          name: "Manual Section",
          startTime: startSeconds,
          endTime: endSeconds,
          includeInExport: true,
        },
      ])
    }
  }

  const getQualitySettings = (): Partial<ExportSettings> => {
    switch (selectedQuality) {
      case "preview":
        return {
          resolution: "720",
          bitrate: 2000,
          bitrateMode: "vbr",
          quality: "normal",
        }
      case "draft":
        return {
          resolution: "1080",
          bitrate: 5000,
          bitrateMode: "vbr",
          quality: "good",
        }
      default:
        return defaultSettings
    }
  }

  const handleStartExport = () => {
    const selectedSections = sections.filter((s) => s.includeInExport)
    const qualitySettings = getQualitySettings()

    onExport({
      ...defaultSettings,
      ...qualitySettings,
      sections: selectedSections,
    })
  }

  const handlePreviewSection = useCallback(
    (section: ExportSection) => {
      // Переход к началу секции для предпросмотра
      if (onPreviewSection) {
        onPreviewSection(section.startTime)
      } else if (seek) {
        void seek(section.startTime)
      }
    },
    [onPreviewSection, seek],
  )

  const selectedCount = sections.filter((s) => s.includeInExport).length

  return (
    <div className="space-y-4" data-oid="o13mmnk">
      {/* Export Mode Selection */}
      <Card data-oid="38_t.dh">
        <CardHeader data-oid="fv6-s5s">
          <CardTitle data-oid="6zq6hqu">{t("export.sections.exportMode")}</CardTitle>
          <CardDescription data-oid="4lf1xhx">{t("export.sections.exportModeDescription")}</CardDescription>
        </CardHeader>
        <CardContent data-oid=".7nkoq-">
          <RadioGroup
            value={exportMode}
            onValueChange={(value) => setExportMode(value as "markers" | "manual" | "clips")}
            data-oid="wg1651y"
          >
            <div className="space-y-2" data-oid="bz9oqk.">
              <div className="flex items-center space-x-2" data-oid="sk7ys.8">
                <RadioGroupItem value="markers" id={markersId} data-oid="zw-em0_" />
                <Label htmlFor={markersId} className="flex items-center gap-2 cursor-pointer" data-oid="d3sr7qm">
                  <Flag className="h-4 w-4" data-oid="4z7xsz:" />
                  {t("export.sections.byMarkers")}
                </Label>
              </div>
              <div className="flex items-center space-x-2" data-oid="ik.rvx_">
                <RadioGroupItem value="clips" id={clipsId} data-oid="0axxhh:" />
                <Label htmlFor={clipsId} className="flex items-center gap-2 cursor-pointer" data-oid="rnq9voa">
                  <Video className="h-4 w-4" data-oid="ek_ydok" />
                  {t("export.sections.byClips")}
                </Label>
              </div>
              <div className="flex items-center space-x-2" data-oid="t19:vr6">
                <RadioGroupItem value="manual" id={manualId} data-oid="vtg8tir" />
                <Label htmlFor={manualId} className="flex items-center gap-2 cursor-pointer" data-oid="l297yf6">
                  <Scissors className="h-4 w-4" data-oid=".6ipqws" />
                  {t("export.sections.manual")}
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Manual Time Input */}
          {exportMode === "manual" && (
            <div className="mt-4 space-y-2" data-oid="qckfwew">
              <div className="grid grid-cols-2 gap-4" data-oid=":d40ste">
                <div className="space-y-2" data-oid="8s:ro4s">
                  <Label data-oid="y:pxq3w">{t("export.sections.startTime")}</Label>
                  <Input
                    value={manualStart}
                    onChange={(e) => setManualStart(e.target.value)}
                    placeholder="00:00:00"
                    data-oid="78h4iqz"
                  />
                </div>
                <div className="space-y-2" data-oid="wes8d9r">
                  <Label data-oid="u60o0g7">{t("export.sections.endTime")}</Label>
                  <Input
                    value={manualEnd}
                    onChange={(e) => setManualEnd(e.target.value)}
                    placeholder="00:00:10"
                    data-oid="46_70c."
                  />
                </div>
              </div>
              <Button onClick={handleManualSection} size="sm" className="w-full" data-oid="9266f:l">
                {t("export.sections.createSection")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Settings */}
      <Card data-oid="_z5g8ul">
        <CardHeader data-oid="zi8ji_9">
          <CardTitle data-oid="-hdagf4">{t("export.sections.qualityPreset")}</CardTitle>
          <CardDescription data-oid="vvp0jvh">{t("export.sections.qualityPresetDescription")}</CardDescription>
        </CardHeader>
        <CardContent data-oid="-xapb2w">
          <Select
            value={selectedQuality}
            onValueChange={(value) => setSelectedQuality(value as "preview" | "draft" | "final")}
            data-oid="1sxzq68"
          >
            <SelectTrigger data-oid="29xi8n7">
              <SelectValue data-oid="uz-ytcl" />
            </SelectTrigger>
            <SelectContent data-oid="yp8::.e">
              <SelectItem value="preview" data-oid="deacomi">
                <div data-oid="gglb95q">
                  <div className="font-medium" data-oid="cif9t.z">
                    {t("export.sections.preview")}
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="hr-hkhm">
                    {t("export.sections.previewDescription")}
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="draft" data-oid="bv.np_r">
                <div data-oid="2gggaae">
                  <div className="font-medium" data-oid="lpacesk">
                    {t("export.sections.draft")}
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="xolilsz">
                    {t("export.sections.draftDescription")}
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="final" data-oid="0vaffjm">
                <div data-oid="aixoud_">
                  <div className="font-medium" data-oid="yc5zjl9">
                    {t("export.sections.final")}
                  </div>
                  <div className="text-xs text-muted-foreground" data-oid="vslg4qy">
                    {t("export.sections.finalDescription")}
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sections List */}
      {sections.length > 0 && (
        <Card data-oid="d3qj3wz">
          <CardHeader data-oid="_o-ve2o">
            <div className="flex items-center justify-between" data-oid="-yrjd:5">
              <div data-oid="68bps56">
                <CardTitle data-oid="ag6tmws">{t("export.sections.sectionsTitle")}</CardTitle>
                <CardDescription data-oid="3ibe:kv">
                  {t("export.sections.selectedCount", {
                    selected: selectedCount,
                    total: sections.length,
                  })}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll} data-oid="9rnq_:r">
                {sections.every((s) => s.includeInExport)
                  ? t("export.sections.deselectAll")
                  : t("export.sections.selectAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent data-oid="txz1x3e">
            <ScrollArea className="h-[300px]" data-oid="9v0yt-y">
              <div className="space-y-2" data-oid="spq8_l9">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50"
                    data-oid="tvw81n8"
                  >
                    <Checkbox
                      checked={section.includeInExport}
                      onCheckedChange={() => handleToggleSection(section.id)}
                      data-oid="vrym3y0"
                    />

                    <div className="flex-1 space-y-1" data-oid="w5gsrg3">
                      <div className="flex items-center justify-between" data-oid="fvseo1f">
                        <Input
                          value={section.customFileName || section.name}
                          onChange={(e) => handleUpdateSectionName(section.id, e.target.value)}
                          className="h-7 text-sm"
                          placeholder={t("export.sections.fileName")}
                          data-oid="f056rei"
                        />

                        <div className="flex items-center gap-2 ml-2" data-oid="h6k230u">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewSection(section)}
                            className="h-7 px-2"
                            title={t("export.sections.preview")}
                            data-oid="ce8fcdk"
                          >
                            <Play className="h-3 w-3" data-oid="35othbi" />
                          </Button>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground" data-oid="0.3qp8f">
                            <Clock className="h-3 w-3" data-oid="f7d.3x-" />
                            <span data-oid="3qy-a44">
                              {formatTimeShort(section.startTime)} - {formatTimeShort(section.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground" data-oid="5z0n4r_">
                        {t("export.sections.duration", {
                          duration: formatTimeShort(section.endTime - section.startTime),
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex justify-end gap-2" data-oid="0r_329z">
        <Button onClick={handleStartExport} disabled={selectedCount === 0} data-oid=".19yp2h">
          {t("export.sections.exportSections", { count: selectedCount })}
        </Button>
      </div>
    </div>
  )
}

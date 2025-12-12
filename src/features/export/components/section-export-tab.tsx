import { Clock, Flag, Play, Scissors, Video } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    <div className="space-y-4">
      {/* Export Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t("export.sections.exportMode")}</CardTitle>
          <CardDescription>{t("export.sections.exportModeDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={exportMode}
            onValueChange={(value) => setExportMode(value as "markers" | "manual" | "clips")}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markers" id={markersId} />
                <Label htmlFor={markersId} className="flex items-center gap-2 cursor-pointer">
                  <Flag className="h-4 w-4" />
                  {t("export.sections.byMarkers")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clips" id={clipsId} />
                <Label htmlFor={clipsId} className="flex items-center gap-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  {t("export.sections.byClips")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id={manualId} />
                <Label htmlFor={manualId} className="flex items-center gap-2 cursor-pointer">
                  <Scissors className="h-4 w-4" />
                  {t("export.sections.manual")}
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Manual Time Input */}
          {exportMode === "manual" && (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("export.sections.startTime")}</Label>
                  <Input value={manualStart} onChange={(e) => setManualStart(e.target.value)} placeholder="00:00:00" />
                </div>
                <div className="space-y-2">
                  <Label>{t("export.sections.endTime")}</Label>
                  <Input value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} placeholder="00:00:10" />
                </div>
              </div>
              <Button onClick={handleManualSection} size="sm" className="w-full">
                {t("export.sections.createSection")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("export.sections.qualityPreset")}</CardTitle>
          <CardDescription>{t("export.sections.qualityPresetDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedQuality}
            onValueChange={(value) => setSelectedQuality(value as "preview" | "draft" | "final")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preview">
                <div>
                  <div className="font-medium">{t("export.sections.preview")}</div>
                  <div className="text-xs text-muted-foreground">720p, Low bitrate, Fast encoding</div>
                </div>
              </SelectItem>
              <SelectItem value="draft">
                <div>
                  <div className="font-medium">{t("export.sections.draft")}</div>
                  <div className="text-xs text-muted-foreground">1080p, Medium quality</div>
                </div>
              </SelectItem>
              <SelectItem value="final">
                <div>
                  <div className="font-medium">{t("export.sections.final")}</div>
                  <div className="text-xs text-muted-foreground">Full quality, project settings</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sections List */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("export.sections.sectionsTitle")}</CardTitle>
                <CardDescription>
                  {t("export.sections.selectedCount", { selected: selectedCount, total: sections.length })}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {sections.every((s) => s.includeInExport)
                  ? t("export.sections.deselectAll")
                  : t("export.sections.selectAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={section.includeInExport}
                      onCheckedChange={() => handleToggleSection(section.id)}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Input
                          value={section.customFileName || section.name}
                          onChange={(e) => handleUpdateSectionName(section.id, e.target.value)}
                          className="h-7 text-sm"
                          placeholder={t("export.sections.fileName")}
                        />
                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewSection(section)}
                            className="h-7 px-2"
                            title={t("export.sections.preview")}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatTimeShort(section.startTime)} - {formatTimeShort(section.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
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
      <div className="flex justify-end gap-2">
        <Button onClick={handleStartExport} disabled={selectedCount === 0}>
          {t("export.sections.exportSections", { count: selectedCount })}
        </Button>
      </div>
    </div>
  )
}

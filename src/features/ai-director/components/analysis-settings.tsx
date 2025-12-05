"use client"

/**
 * Analysis Settings Component for AI Director v3
 * Компактная панель настроек анализа
 */

import { HelpCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type AnalysisMode = "quick" | "balanced" | "comprehensive"

export type AnalyzerType =
  | "audio_quality"
  | "scene_detection"
  | "moment_detection"
  | "person_recognition"
  | "speech_detection"
  | "visual_quality"

export interface AnalysisSettings {
  mode: AnalysisMode
  analyzers: AnalyzerType[]
}

export interface AnalysisSettingsProps {
  settings: AnalysisSettings
  onSettingsChange: (settings: AnalysisSettings) => void
  disabled?: boolean
}

const MODES: Array<{ value: AnalysisMode; label: string; description: string }> = [
  { value: "quick", label: "Quick", description: "Fast analysis with essential features" },
  { value: "balanced", label: "Balanced", description: "Good balance of speed and depth" },
  { value: "comprehensive", label: "Comprehensive", description: "In-depth analysis (slower)" },
]

const ANALYZERS: Array<{ value: AnalyzerType; label: string; description: string; tooltip: string }> = [
  {
    value: "audio_quality",
    label: "Audio Quality",
    description: "Analyze audio levels and quality",
    tooltip:
      "Analyzes volume levels, noise floor, clipping, and overall audio clarity. Useful for detecting audio issues.",
  },
  {
    value: "scene_detection",
    label: "Scene Detection",
    description: "Detect scene changes",
    tooltip:
      "Identifies shot boundaries and scene transitions. Essential for automatic editing and content structuring.",
  },
  {
    value: "moment_detection",
    label: "Moment Detection",
    description: "Find interesting moments",
    tooltip: "Uses AI to detect key moments: action peaks, emotional highlights, and engaging content segments.",
  },
  {
    value: "person_recognition",
    label: "Person Recognition",
    description: "Identify people in video",
    tooltip: "Detects and tracks faces throughout the video. Can identify recurring persons across clips.",
  },
  {
    value: "speech_detection",
    label: "Speech Detection",
    description: "Detect speech segments",
    tooltip:
      "Identifies speech vs silence/music/noise. Useful for dialogue-based editing and transcription preparation.",
  },
  {
    value: "visual_quality",
    label: "Visual Quality",
    description: "Assess video quality",
    tooltip: "Evaluates sharpness, exposure, color balance, and stability. Helps identify footage quality issues.",
  },
]

export function AnalysisSettings({ settings, onSettingsChange, disabled = false }: AnalysisSettingsProps) {
  const handleModeChange = (mode: AnalysisMode) => {
    onSettingsChange({ ...settings, mode })
  }

  const handleAnalyzerToggle = (analyzer: AnalyzerType) => {
    const newAnalyzers = settings.analyzers.includes(analyzer)
      ? settings.analyzers.filter((a) => a !== analyzer)
      : [...settings.analyzers, analyzer]

    onSettingsChange({ ...settings, analyzers: newAnalyzers })
  }

  const handleSelectAll = () => {
    onSettingsChange({ ...settings, analyzers: ANALYZERS.map((a) => a.value) })
  }

  const handleDeselectAll = () => {
    onSettingsChange({ ...settings, analyzers: [] })
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Analysis Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Analysis Mode</Label>
            <RadioGroup
              value={settings.mode}
              onValueChange={(value) => handleModeChange(value as AnalysisMode)}
              disabled={disabled}
            >
              <div className="space-y-2">
                {MODES.map((mode) => (
                  <div key={mode.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={mode.value} id={mode.value} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={mode.value} className="font-normal cursor-pointer">
                        {mode.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Analyzer Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Analyzers</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={disabled} className="h-7 text-xs">
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={disabled}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {ANALYZERS.map((analyzer) => (
                <div key={analyzer.value} className="flex items-start space-x-2">
                  <Checkbox
                    id={analyzer.value}
                    checked={settings.analyzers.includes(analyzer.value)}
                    onCheckedChange={() => handleAnalyzerToggle(analyzer.value)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor={analyzer.value} className="font-normal cursor-pointer">
                        {analyzer.label}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">{analyzer.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-muted-foreground">{analyzer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            Selected: {settings.analyzers.length} analyzer{settings.analyzers.length !== 1 ? "s" : ""} in{" "}
            {settings.mode} mode
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

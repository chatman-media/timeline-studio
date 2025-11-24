"use client"

/**
 * AnalyzerPresetSelector - Компонент для выбора и управления preset'ами анализаторов
 */

import { Bookmark, Save, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { AnalyzerType } from "../types/analysis-progress"
import type { AnalyzerPreset } from "../types/analyzer-presets"
import { createCustomPreset, getDefaultPresets, validatePreset } from "../types/analyzer-presets"

interface AnalyzerPresetSelectorProps {
  selectedAnalyzers: Set<AnalyzerType>
  customPresets: AnalyzerPreset[]
  onApplyPreset: (preset: AnalyzerPreset) => void
  onSavePreset: (preset: AnalyzerPreset) => void
  onDeletePreset: (presetId: string) => void
  className?: string
}

export function AnalyzerPresetSelector({
  selectedAnalyzers,
  customPresets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  className,
}: AnalyzerPresetSelectorProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [presetDescription, setPresetDescription] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)

  const defaultPresets = getDefaultPresets()

  // Handle save preset
  const handleSavePreset = () => {
    const newPreset = createCustomPreset(presetName, presetDescription, selectedAnalyzers)

    const validation = validatePreset(newPreset)
    if (!validation.isValid) {
      setSaveError(validation.errors[0])
      return
    }

    onSavePreset(newPreset)
    setShowSaveDialog(false)
    setPresetName("")
    setPresetDescription("")
    setSaveError(null)
  }

  // Check if current selection matches a preset
  const matchingPreset = [...defaultPresets, ...customPresets].find((preset) => {
    if (preset.analyzers.size !== selectedAnalyzers.size) return false
    return Array.from(preset.analyzers).every((analyzer) => selectedAnalyzers.has(analyzer))
  })

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Preset'ы
          </CardTitle>
          <CardDescription>
            Быстрый выбор комбинаций анализаторов
            {matchingPreset && (
              <span className="block mt-1 text-primary font-medium">Активен: {matchingPreset.name}</span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Save current selection button */}
          <Button
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={selectedAnalyzers.size === 0}
          >
            <Save className="h-4 w-4" />
            Сохранить текущий выбор
          </Button>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {/* Default Presets */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Встроенные</h4>
                <div className="space-y-2">
                  {defaultPresets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isActive={matchingPreset?.id === preset.id}
                      onApply={() => onApplyPreset(preset)}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Presets */}
              {customPresets.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Пользовательские</h4>
                  <div className="space-y-2">
                    {customPresets.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        isActive={matchingPreset?.id === preset.id}
                        onApply={() => onApplyPreset(preset)}
                        onDelete={() => onDeletePreset(preset.id)}
                        canDelete
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить preset</DialogTitle>
            <DialogDescription>
              Сохраните текущий выбор анализаторов ({selectedAnalyzers.size}) для быстрого доступа
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Название</Label>
              <Input
                id="preset-name"
                placeholder="Мой preset"
                value={presetName}
                onChange={(e) => {
                  setPresetName(e.target.value)
                  setSaveError(null)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-description">Описание (опционально)</Label>
              <Textarea
                id="preset-description"
                placeholder="Краткое описание для чего используется этот preset"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                rows={3}
              />
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * PresetCard - Карточка одного preset'а
 */
interface PresetCardProps {
  preset: AnalyzerPreset
  isActive: boolean
  onApply: () => void
  onDelete?: () => void
  canDelete?: boolean
}

function PresetCard({ preset, isActive, onApply, onDelete, canDelete }: PresetCardProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `~${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `~${minutes}m`
  }

  return (
    <div
      className={cn(
        "p-3 rounded-md border transition-colors cursor-pointer",
        isActive ? "bg-primary/10 border-primary" : "bg-muted/50 hover:bg-muted",
      )}
      onClick={onApply}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className={cn("text-sm font-medium truncate", isActive && "text-primary")}>{preset.name}</h5>
            {isActive && (
              <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">Активен</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{preset.analyzers.size} анализаторов</span>
            <span>{preset.estimatedTime}</span>
          </div>
        </div>

        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

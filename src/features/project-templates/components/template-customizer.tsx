/**
 * Template Customizer Component
 * Кастомизация параметров шаблона перед применением
 */

import type React from "react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import type { ApplyTemplateOptions } from "../services"
import type { ProjectTemplate } from "../types/project-template"

export interface TemplateCustomizerProps {
  /** Шаблон для кастомизации */
  template: ProjectTemplate

  /** Начальные опции */
  initialOptions?: Partial<ApplyTemplateOptions>

  /** Callback при изменении опций */
  onChange?: (options: ApplyTemplateOptions) => void

  /** Callback при применении */
  onApply?: (options: ApplyTemplateOptions) => void

  /** Callback при отмене */
  onCancel?: () => void

  /** Высота компонента */
  height?: string | number
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  template,
  initialOptions,
  onChange,
  onApply,
  onCancel,
  height = "600px",
}) => {
  const [options, setOptions] = useState<ApplyTemplateOptions>({
    mode: initialOptions?.mode || "new",
    sequenceName: initialOptions?.sequenceName || template.name.ru || template.name.en,
    applyProjectSettings: initialOptions?.applyProjectSettings ?? true,
    createMarkers: initialOptions?.createMarkers ?? true,
    createTracks: initialOptions?.createTracks ?? true,
  })

  /**
   * Обновление опций
   */
  const updateOptions = useCallback(
    (updates: Partial<ApplyTemplateOptions>) => {
      const newOptions = { ...options, ...updates }
      setOptions(newOptions)
      onChange?.(newOptions)
    },
    [options, onChange],
  )

  /**
   * Применение шаблона
   */
  const handleApply = useCallback(() => {
    onApply?.(options)
  }, [options, onApply])

  return (
    <div className="flex h-full flex-col" style={{ height }}>
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="text-xl font-semibold">Настройка шаблона</h3>
        <p className="text-muted-foreground text-sm">Настройте параметры перед применением шаблона</p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Basic settings */}
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>Параметры создания проекта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sequence name */}
              <div className="space-y-2">
                <Label htmlFor="sequence-name">Название секвенции</Label>
                <Input
                  id="sequence-name"
                  value={options.sequenceName || ""}
                  onChange={(e) => updateOptions({ sequenceName: e.target.value })}
                  placeholder="Введите название..."
                />
                <p className="text-muted-foreground text-xs">Имя секвенции в проекте (можно изменить позже)</p>
              </div>

              {/* Mode */}
              <div className="space-y-2">
                <Label htmlFor="mode">Режим создания</Label>
                <Select value={options.mode} onValueChange={(v) => updateOptions({ mode: v as "new" | "replace" })}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Создать новую секвенцию</SelectItem>
                    <SelectItem value="replace">Заменить активную секвенцию</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {options.mode === "new" ? "Добавит новую секвенцию в проект" : "Заменит содержимое текущей секвенции"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Project settings */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки проекта</CardTitle>
              <CardDescription>Применить параметры видео и аудио</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Apply project settings */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="apply-settings">Применить настройки проекта</Label>
                  <p className="text-muted-foreground text-sm">
                    Использовать разрешение, FPS и аудио настройки из шаблона
                  </p>
                </div>
                <Switch
                  id="apply-settings"
                  checked={options.applyProjectSettings}
                  onCheckedChange={(checked) => updateOptions({ applyProjectSettings: checked })}
                />
              </div>

              {/* Settings preview */}
              {options.applyProjectSettings && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Разрешение</div>
                      <div className="font-medium">
                        {template.settings.resolution.width}x{template.settings.resolution.height}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">FPS</div>
                      <div className="font-medium">{template.settings.frameRate}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Соотношение</div>
                      <div className="font-medium">{template.settings.aspectRatio}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Аудио</div>
                      <div className="font-medium">{template.settings.audioSampleRate || 48000} Hz</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structure options */}
          <Card>
            <CardHeader>
              <CardTitle>Структура</CardTitle>
              <CardDescription>Что создать из шаблона</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create tracks */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="create-tracks">Создать треки</Label>
                  <p className="text-muted-foreground text-sm">
                    Создать пустые треки из структуры шаблона ({template.structure.tracks.length} шт.)
                  </p>
                </div>
                <Switch
                  id="create-tracks"
                  checked={options.createTracks}
                  onCheckedChange={(checked) => updateOptions({ createTracks: checked })}
                />
              </div>

              <Separator />

              {/* Create markers */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="create-markers">Создать маркеры</Label>
                  <p className="text-muted-foreground text-sm">
                    Создать маркеры для секций шаблона ({template.structure.sections.length} шт.)
                  </p>
                </div>
                <Switch
                  id="create-markers"
                  checked={options.createMarkers}
                  onCheckedChange={(checked) => updateOptions({ createMarkers: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Template info */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о шаблоне</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-muted-foreground">Категория</div>
                  <div className="font-medium">{template.category}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Длительность</div>
                  <div className="font-medium">
                    {Math.floor(template.estimatedDuration / 60)}:{" "}
                    {String(template.estimatedDuration % 60).padStart(2, "0")} мин
                  </div>
                </div>
                {template.targetPlatform && (
                  <div>
                    <div className="text-muted-foreground">Платформа</div>
                    <div className="font-medium">{template.targetPlatform}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Секций</div>
                  <div className="font-medium">{template.structure.sections.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={handleApply}>Применить шаблон</Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Template Customizer Component
 * Кастомизация параметров шаблона перед применением
 */

import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Switch } from "@timeline-studio/ui/components/switch"
import type React from "react"
import { useCallback, useState } from "react"

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
    <div className="flex h-full flex-col" style={{ height }} data-oid="h5z.fnz">
      {/* Header */}
      <div className="border-b p-4" data-oid="9:b0_5:">
        <h3 className="text-xl font-semibold" data-oid="dh3.luo">
          Настройка шаблона
        </h3>
        <p className="text-muted-foreground text-sm" data-oid="qqljd3x">
          Настройте параметры перед применением шаблона
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" data-oid="og-yyxk">
        <div className="space-y-4 p-4" data-oid="q.xu0p:">
          {/* Basic settings */}
          <Card data-oid=".w_3zo7">
            <CardHeader data-oid="zdhm772">
              <CardTitle data-oid="082d5fv">Основные настройки</CardTitle>
              <CardDescription data-oid="kpfs3_3">Параметры создания проекта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="_9diae1">
              {/* Sequence name */}
              <div className="space-y-2" data-oid="hxtf_30">
                <Label htmlFor="sequence-name" data-oid=":_.66wi">
                  Название секвенции
                </Label>
                <Input
                  id="sequence-name"
                  value={options.sequenceName || ""}
                  onChange={(e) => updateOptions({ sequenceName: e.target.value })}
                  placeholder="Введите название..."
                  data-oid="_hgyxta"
                />

                <p className="text-muted-foreground text-xs" data-oid="ig81l-4">
                  Имя секвенции в проекте (можно изменить позже)
                </p>
              </div>

              {/* Mode */}
              <div className="space-y-2" data-oid="vwqd0:d">
                <Label htmlFor="mode" data-oid="m-qj84z">
                  Режим создания
                </Label>
                <Select
                  value={options.mode}
                  onValueChange={(v) => updateOptions({ mode: v as "new" | "replace" })}
                  data-oid="wt4pune"
                >
                  <SelectTrigger id="mode" data-oid="t2t:z.0">
                    <SelectValue data-oid="bms5yfe" />
                  </SelectTrigger>
                  <SelectContent data-oid="ecum.2d">
                    <SelectItem value="new" data-oid="_30rahr">
                      Создать новую секвенцию
                    </SelectItem>
                    <SelectItem value="replace" data-oid="b85-oi.">
                      Заменить активную секвенцию
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs" data-oid="eb49ijg">
                  {options.mode === "new" ? "Добавит новую секвенцию в проект" : "Заменит содержимое текущей секвенции"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Project settings */}
          <Card data-oid="-em336.">
            <CardHeader data-oid="9xod7ai">
              <CardTitle data-oid="wqgbijc">Настройки проекта</CardTitle>
              <CardDescription data-oid="75k56nu">Применить параметры видео и аудио</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="_:8gxn9">
              {/* Apply project settings */}
              <div className="flex items-center justify-between" data-oid="g8ygfpb">
                <div className="space-y-0.5" data-oid="a29yu_u">
                  <Label htmlFor="apply-settings" data-oid="yx761pz">
                    Применить настройки проекта
                  </Label>
                  <p className="text-muted-foreground text-sm" data-oid="n3os74t">
                    Использовать разрешение, FPS и аудио настройки из шаблона
                  </p>
                </div>
                <Switch
                  id="apply-settings"
                  checked={options.applyProjectSettings}
                  onCheckedChange={(checked) => updateOptions({ applyProjectSettings: checked })}
                  data-oid="rbc_mo1"
                />
              </div>

              {/* Settings preview */}
              {options.applyProjectSettings && (
                <div className="bg-muted rounded-lg p-3" data-oid="l9vjwwd">
                  <div className="grid grid-cols-2 gap-3 text-sm" data-oid="732z_-u">
                    <div data-oid="ux6x25l">
                      <div className="text-muted-foreground" data-oid="tjxn5z1">
                        Разрешение
                      </div>
                      <div className="font-medium" data-oid="7g1mpxd">
                        {template.settings.resolution}
                      </div>
                    </div>
                    <div data-oid="0i357ej">
                      <div className="text-muted-foreground" data-oid="m-08hak">
                        FPS
                      </div>
                      <div className="font-medium" data-oid="ppt_-1a">
                        {template.settings.frameRate}
                      </div>
                    </div>
                    <div data-oid="fbiv7we">
                      <div className="text-muted-foreground" data-oid="omwnk3q">
                        Соотношение
                      </div>
                      <div className="font-medium" data-oid="xuxqcyq">
                        {template.settings.aspectRatio.label}
                      </div>
                    </div>
                    <div data-oid="9ljal2m">
                      <div className="text-muted-foreground" data-oid="24jmpo3">
                        Цветовое пространство
                      </div>
                      <div className="font-medium" data-oid="ozmie-8">
                        {template.settings.colorSpace}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structure options */}
          <Card data-oid="fbue8d2">
            <CardHeader data-oid="6ghj:is">
              <CardTitle data-oid="84_ghbm">Структура</CardTitle>
              <CardDescription data-oid="-kbj8ez">Что создать из шаблона</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="1j1-03b">
              {/* Create tracks */}
              <div className="flex items-center justify-between" data-oid="l6qtccx">
                <div className="space-y-0.5" data-oid="psf_pz0">
                  <Label htmlFor="create-tracks" data-oid="04_rxxl">
                    Создать треки
                  </Label>
                  <p className="text-muted-foreground text-sm" data-oid="uw0dbac">
                    Создать пустые треки из структуры шаблона ({template.structure.tracks.length} шт.)
                  </p>
                </div>
                <Switch
                  id="create-tracks"
                  checked={options.createTracks}
                  onCheckedChange={(checked) => updateOptions({ createTracks: checked })}
                  data-oid="fnfwxp1"
                />
              </div>

              <Separator data-oid="_6b4-of" />

              {/* Create markers */}
              <div className="flex items-center justify-between" data-oid="t4.mppc">
                <div className="space-y-0.5" data-oid="5j3z_5j">
                  <Label htmlFor="create-markers" data-oid="2en1q88">
                    Создать маркеры
                  </Label>
                  <p className="text-muted-foreground text-sm" data-oid="7w8.hkr">
                    Создать маркеры для секций шаблона ({template.structure.sections.length} шт.)
                  </p>
                </div>
                <Switch
                  id="create-markers"
                  checked={options.createMarkers}
                  onCheckedChange={(checked) => updateOptions({ createMarkers: checked })}
                  data-oid="djos.c_"
                />
              </div>
            </CardContent>
          </Card>

          {/* Template info */}
          <Card data-oid="qgo:2v8">
            <CardHeader data-oid="c2q2_37">
              <CardTitle data-oid="_6nd9::">Информация о шаблоне</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm" data-oid="7yvpwu3">
              <div className="grid grid-cols-2 gap-3" data-oid="rhsgxi8">
                <div data-oid="jgoi351">
                  <div className="text-muted-foreground" data-oid="2lp6d96">
                    Категория
                  </div>
                  <div className="font-medium" data-oid="ml0001v">
                    {template.category}
                  </div>
                </div>
                <div data-oid="7pxch9d">
                  <div className="text-muted-foreground" data-oid="_ztb29t">
                    Длительность
                  </div>
                  <div className="font-medium" data-oid="diaen4b">
                    {Math.floor(template.estimatedDuration / 60)}:{" "}
                    {String(template.estimatedDuration % 60).padStart(2, "0")} мин
                  </div>
                </div>
                {template.targetPlatform && (
                  <div data-oid="yesk9kh">
                    <div className="text-muted-foreground" data-oid="j-n_-mf">
                      Платформа
                    </div>
                    <div className="font-medium" data-oid="kfnkx8c">
                      {template.targetPlatform}
                    </div>
                  </div>
                )}
                <div data-oid="y-5yl82">
                  <div className="text-muted-foreground" data-oid="59mdw4b">
                    Секций
                  </div>
                  <div className="font-medium" data-oid="9o4b_3z">
                    {template.structure.sections.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4" data-oid="1tvhq6s">
        <div className="flex justify-end gap-2" data-oid="b6gv0j:">
          <Button variant="outline" onClick={onCancel} data-oid="_7._mur">
            Отмена
          </Button>
          <Button onClick={handleApply} data-oid="rcbav9c">
            Применить шаблон
          </Button>
        </div>
      </div>
    </div>
  )
}

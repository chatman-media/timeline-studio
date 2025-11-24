import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AnimationType, CellConfiguration, MediaTemplateConfig } from "../lib/template-config"

interface TemplateCustomizerProps {
  template: MediaTemplateConfig
  onUpdate: (updatedTemplate: MediaTemplateConfig) => void
  onSave?: (template: MediaTemplateConfig, name: string) => void
  className?: string
}

/**
 * Компонент для кастомизации шаблонов
 * Позволяет настраивать:
 * - Цвета границ и фона
 * - Размеры границ
 * - Позиции ячеек
 * - Анимации
 * - И сохранять кастомные шаблоны
 */
export function TemplateCustomizer({ template, onUpdate, onSave, className }: TemplateCustomizerProps) {
  const { t } = useTranslation()
  const [customName, setCustomName] = useState("")
  const [selectedCell, setSelectedCell] = useState(0)

  // Обновляем конфигурацию выбранной ячейки
  const updateCellConfig = (cellIndex: number, updates: Partial<CellConfiguration>) => {
    const newCells = [...(template.cells || [])]
    newCells[cellIndex] = { ...newCells[cellIndex], ...updates }

    onUpdate({
      ...template,
      cells: newCells,
    })
  }

  // Получаем текущую конфигурацию ячейки
  const currentCell = template.cells?.[selectedCell] || {}

  // Обработчики для различных настроек
  const handleBorderColorChange = (color: string) => {
    updateCellConfig(selectedCell, {
      border: { ...currentCell.border, color },
    })
  }

  const handleBorderWidthChange = (value: number[]) => {
    updateCellConfig(selectedCell, {
      border: { ...currentCell.border, width: `${value[0]}px` },
    })
  }

  const handleBorderRadiusChange = (value: number[]) => {
    updateCellConfig(selectedCell, {
      border: { ...currentCell.border, radius: `${value[0]}px` },
    })
  }

  const handleBackgroundColorChange = (color: string) => {
    updateCellConfig(selectedCell, {
      background: { ...currentCell.background, color },
    })
  }

  const handleAnimationTypeChange = (type: AnimationType, phase: "enter" | "exit" | "transition") => {
    const currentAnimation = currentCell.animation || {}
    updateCellConfig(selectedCell, {
      animation: {
        ...currentAnimation,
        [phase]: {
          ...currentAnimation[phase],
          type,
        },
      },
    })
  }

  const handleAnimationDurationChange = (value: number[], phase: "enter" | "exit" | "transition") => {
    const currentAnimation = currentCell.animation || {}
    updateCellConfig(selectedCell, {
      animation: {
        ...currentAnimation,
        [phase]: {
          ...currentAnimation[phase],
          duration: value[0],
        },
      },
    })
  }

  const handleSaveCustomTemplate = () => {
    if (onSave && customName.trim()) {
      onSave(template, customName.trim())
      setCustomName("")
    }
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Заголовок */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t("templates.customizer.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("templates.customizer.description")}</p>
      </div>

      {/* Селектор ячейки */}
      <div className="space-y-2">
        <Label>{t("templates.customizer.selectCell")}</Label>
        <Select value={String(selectedCell)} onValueChange={(val) => setSelectedCell(Number(val))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: template.screens }, (_, i) => (
              <SelectItem key={i} value={String(i)}>
                {t("templates.customizer.cell")} {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Табы для разных категорий настроек */}
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appearance">{t("templates.customizer.appearance")}</TabsTrigger>
          <TabsTrigger value="animation">{t("templates.customizer.animation")}</TabsTrigger>
          <TabsTrigger value="layout">{t("templates.customizer.layout")}</TabsTrigger>
        </TabsList>

        {/* Внешний вид */}
        <TabsContent value="appearance" className="space-y-4">
          {/* Цвет границы */}
          <div className="space-y-2">
            <Label htmlFor="border-color">{t("templates.customizer.borderColor")}</Label>
            <div className="flex gap-2">
              <Input
                id="border-color"
                type="color"
                value={currentCell.border?.color || "#9ca3af"}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={currentCell.border?.color || "#9ca3af"}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                placeholder="#RRGGBB"
              />
            </div>
          </div>

          {/* Толщина границы */}
          <div className="space-y-2">
            <Label>{t("templates.customizer.borderWidth")}</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[Number.parseInt(currentCell.border?.width || "1", 10)]}
                onValueChange={handleBorderWidthChange}
                min={0}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-sm">{currentCell.border?.width || "1px"}</span>
            </div>
          </div>

          {/* Радиус границы */}
          <div className="space-y-2">
            <Label>{t("templates.customizer.borderRadius")}</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[Number.parseInt(currentCell.border?.radius || "0", 10)]}
                onValueChange={handleBorderRadiusChange}
                min={0}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-sm">{currentCell.border?.radius || "0px"}</span>
            </div>
          </div>

          {/* Цвет фона */}
          <div className="space-y-2">
            <Label htmlFor="bg-color">{t("templates.customizer.backgroundColor")}</Label>
            <div className="flex gap-2">
              <Input
                id="bg-color"
                type="color"
                value={currentCell.background?.color || "#23262b"}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={currentCell.background?.color || "#23262b"}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                placeholder="#RRGGBB"
              />
            </div>
          </div>
        </TabsContent>

        {/* Анимации */}
        <TabsContent value="animation" className="space-y-4">
          {/* Анимация появления */}
          <div className="space-y-2">
            <Label>{t("templates.customizer.enterAnimation")}</Label>
            <Select
              value={currentCell.animation?.enter?.type || "fade"}
              onValueChange={(val) => handleAnimationTypeChange(val as AnimationType, "enter")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">{t("templates.customizer.animations.fade")}</SelectItem>
                <SelectItem value="slide-left">{t("templates.customizer.animations.slideLeft")}</SelectItem>
                <SelectItem value="slide-right">{t("templates.customizer.animations.slideRight")}</SelectItem>
                <SelectItem value="slide-up">{t("templates.customizer.animations.slideUp")}</SelectItem>
                <SelectItem value="slide-down">{t("templates.customizer.animations.slideDown")}</SelectItem>
                <SelectItem value="zoom-in">{t("templates.customizer.animations.zoomIn")}</SelectItem>
                <SelectItem value="zoom-out">{t("templates.customizer.animations.zoomOut")}</SelectItem>
                <SelectItem value="none">{t("templates.customizer.animations.none")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <Label className="w-20">{t("templates.customizer.duration")}</Label>
              <Slider
                value={[currentCell.animation?.enter?.duration || 300]}
                onValueChange={(val) => handleAnimationDurationChange(val, "enter")}
                min={0}
                max={1000}
                step={50}
                className="flex-1"
              />
              <span className="w-16 text-sm">{currentCell.animation?.enter?.duration || 300}ms</span>
            </div>
          </div>

          {/* Анимация исчезновения */}
          <div className="space-y-2">
            <Label>{t("templates.customizer.exitAnimation")}</Label>
            <Select
              value={currentCell.animation?.exit?.type || "fade"}
              onValueChange={(val) => handleAnimationTypeChange(val as AnimationType, "exit")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">{t("templates.customizer.animations.fade")}</SelectItem>
                <SelectItem value="slide-left">{t("templates.customizer.animations.slideLeft")}</SelectItem>
                <SelectItem value="slide-right">{t("templates.customizer.animations.slideRight")}</SelectItem>
                <SelectItem value="slide-up">{t("templates.customizer.animations.slideUp")}</SelectItem>
                <SelectItem value="slide-down">{t("templates.customizer.animations.slideDown")}</SelectItem>
                <SelectItem value="zoom-in">{t("templates.customizer.animations.zoomIn")}</SelectItem>
                <SelectItem value="zoom-out">{t("templates.customizer.animations.zoomOut")}</SelectItem>
                <SelectItem value="none">{t("templates.customizer.animations.none")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <Label className="w-20">{t("templates.customizer.duration")}</Label>
              <Slider
                value={[currentCell.animation?.exit?.duration || 200]}
                onValueChange={(val) => handleAnimationDurationChange(val, "exit")}
                min={0}
                max={1000}
                step={50}
                className="flex-1"
              />
              <span className="w-16 text-sm">{currentCell.animation?.exit?.duration || 200}ms</span>
            </div>
          </div>

          {/* Анимация переходов */}
          <div className="space-y-2">
            <Label>{t("templates.customizer.transitionAnimation")}</Label>
            <Select
              value={currentCell.animation?.transition?.type || "fade"}
              onValueChange={(val) => handleAnimationTypeChange(val as AnimationType, "transition")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">{t("templates.customizer.animations.fade")}</SelectItem>
                <SelectItem value="slide-left">{t("templates.customizer.animations.slideLeft")}</SelectItem>
                <SelectItem value="slide-right">{t("templates.customizer.animations.slideRight")}</SelectItem>
                <SelectItem value="slide-up">{t("templates.customizer.animations.slideUp")}</SelectItem>
                <SelectItem value="slide-down">{t("templates.customizer.animations.slideDown")}</SelectItem>
                <SelectItem value="zoom-in">{t("templates.customizer.animations.zoomIn")}</SelectItem>
                <SelectItem value="zoom-out">{t("templates.customizer.animations.zoomOut")}</SelectItem>
                <SelectItem value="none">{t("templates.customizer.animations.none")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4">
              <Label className="w-20">{t("templates.customizer.duration")}</Label>
              <Slider
                value={[currentCell.animation?.transition?.duration || 250]}
                onValueChange={(val) => handleAnimationDurationChange(val, "transition")}
                min={0}
                max={1000}
                step={50}
                className="flex-1"
              />
              <span className="w-16 text-sm">{currentCell.animation?.transition?.duration || 250}ms</span>
            </div>
          </div>
        </TabsContent>

        {/* Макет */}
        <TabsContent value="layout" className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("templates.customizer.layoutDescription")}</p>
          {/* Здесь можно добавить настройки для cellLayouts, если нужно */}
        </TabsContent>
      </Tabs>

      {/* Сохранение кастомного шаблона */}
      {onSave && (
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="template-name">{t("templates.customizer.saveName")}</Label>
          <div className="flex gap-2">
            <Input
              id="template-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("templates.customizer.saveNamePlaceholder")}
            />
            <Button onClick={handleSaveCustomTemplate} disabled={!customName.trim()}>
              {t("templates.customizer.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
    <div className={`space-y-6 ${className || ""}`} data-oid="5gg9ca1">
      {/* Заголовок */}
      <div className="space-y-2" data-oid="s-y4iao">
        <h3 className="text-lg font-semibold" data-oid="2-1ple.">
          {t("templates.customizer.title")}
        </h3>
        <p className="text-sm text-muted-foreground" data-oid="8kromx4">
          {t("templates.customizer.description")}
        </p>
      </div>

      {/* Селектор ячейки */}
      <div className="space-y-2" data-oid="fv0iyak">
        <Label data-oid=":zgmf-m">{t("templates.customizer.selectCell")}</Label>
        <Select value={String(selectedCell)} onValueChange={(val) => setSelectedCell(Number(val))} data-oid="3qoov--">
          <SelectTrigger data-oid="t_pv.iu">
            <SelectValue data-oid="0ppuj3z" />
          </SelectTrigger>
          <SelectContent data-oid="d58g0mi">
            {Array.from({ length: template.screens }, (_, i) => (
              <SelectItem key={i} value={String(i)} data-oid="wz.ogqy">
                {t("templates.customizer.cell")} {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Табы для разных категорий настроек */}
      <Tabs defaultValue="appearance" className="w-full" data-oid="e0sds03">
        <TabsList className="grid w-full grid-cols-3" data-oid="yrvzcsf">
          <TabsTrigger value="appearance" data-oid="c358011">
            {t("templates.customizer.appearance")}
          </TabsTrigger>
          <TabsTrigger value="animation" data-oid="taes.j0">
            {t("templates.customizer.animation")}
          </TabsTrigger>
          <TabsTrigger value="layout" data-oid="ub6o660">
            {t("templates.customizer.layout")}
          </TabsTrigger>
        </TabsList>

        {/* Внешний вид */}
        <TabsContent value="appearance" className="space-y-4" data-oid="-cbqv0p">
          {/* Цвет границы */}
          <div className="space-y-2" data-oid="advgbu4">
            <Label htmlFor="border-color" data-oid="j6t0wv6">
              {t("templates.customizer.borderColor")}
            </Label>
            <div className="flex gap-2" data-oid="gh508zh">
              <Input
                id="border-color"
                type="color"
                value={currentCell.border?.color || "#9ca3af"}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                className="h-10 w-20"
                data-oid="tusmo4_"
              />

              <Input
                type="text"
                value={currentCell.border?.color || "#9ca3af"}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                placeholder="#RRGGBB"
                data-oid="trqy-dp"
              />
            </div>
          </div>

          {/* Толщина границы */}
          <div className="space-y-2" data-oid="zzq4__i">
            <Label data-oid="j_c6yk3">{t("templates.customizer.borderWidth")}</Label>
            <div className="flex items-center gap-4" data-oid="opuf0c4">
              <Slider
                value={[Number.parseInt(currentCell.border?.width || "1", 10)]}
                onValueChange={handleBorderWidthChange}
                min={0}
                max={10}
                step={1}
                className="flex-1"
                data-oid="qmc712g"
              />

              <span className="w-12 text-sm" data-oid="aoldpro">
                {currentCell.border?.width || "1px"}
              </span>
            </div>
          </div>

          {/* Радиус границы */}
          <div className="space-y-2" data-oid="8z9yi10">
            <Label data-oid="nwdmw53">{t("templates.customizer.borderRadius")}</Label>
            <div className="flex items-center gap-4" data-oid="s92acif">
              <Slider
                value={[Number.parseInt(currentCell.border?.radius || "0", 10)]}
                onValueChange={handleBorderRadiusChange}
                min={0}
                max={50}
                step={1}
                className="flex-1"
                data-oid="guons58"
              />

              <span className="w-12 text-sm" data-oid="aalygl0">
                {currentCell.border?.radius || "0px"}
              </span>
            </div>
          </div>

          {/* Цвет фона */}
          <div className="space-y-2" data-oid="t:m8_y4">
            <Label htmlFor="bg-color" data-oid="5th83_-">
              {t("templates.customizer.backgroundColor")}
            </Label>
            <div className="flex gap-2" data-oid="iu18emu">
              <Input
                id="bg-color"
                type="color"
                value={currentCell.background?.color || "#23262b"}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="h-10 w-20"
                data-oid=".hoei.9"
              />

              <Input
                type="text"
                value={currentCell.background?.color || "#23262b"}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                placeholder="#RRGGBB"
                data-oid="_:2xkql"
              />
            </div>
          </div>
        </TabsContent>

        {/* Анимации */}
        <TabsContent value="animation" className="space-y-4" data-oid="w::om8l">
          {/* Анимация появления */}
          <div className="space-y-2" data-oid="ckx6:.a">
            <Label data-oid="tkcqgas">{t("templates.customizer.enterAnimation")}</Label>
            <Select
              value={currentCell.animation?.enter?.type || "fade"}
              onValueChange={(val) => handleAnimationTypeChange(val as AnimationType, "enter")}
              data-oid="jsvh2-s"
            >
              <SelectTrigger data-oid="432:mwm">
                <SelectValue data-oid="m1:cs3d" />
              </SelectTrigger>
              <SelectContent data-oid="tzfhudj">
                <SelectItem value="fade" data-oid="kvj4g6v">
                  {t("templates.customizer.animations.fade")}
                </SelectItem>
                <SelectItem value="slide-left" data-oid="enk069q">
                  {t("templates.customizer.animations.slideLeft")}
                </SelectItem>
                <SelectItem value="slide-right" data-oid="odl77g1">
                  {t("templates.customizer.animations.slideRight")}
                </SelectItem>
                <SelectItem value="slide-up" data-oid="hg_3-86">
                  {t("templates.customizer.animations.slideUp")}
                </SelectItem>
                <SelectItem value="slide-down" data-oid="v6ov:fa">
                  {t("templates.customizer.animations.slideDown")}
                </SelectItem>
                <SelectItem value="zoom-in" data-oid="-ze5ya:">
                  {t("templates.customizer.animations.zoomIn")}
                </SelectItem>
                <SelectItem value="zoom-out" data-oid="4rt1bvp">
                  {t("templates.customizer.animations.zoomOut")}
                </SelectItem>
                <SelectItem value="none" data-oid="cbx9cv-">
                  {t("templates.customizer.animations.none")}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4" data-oid="-tfjo8p">
              <Label className="w-20" data-oid="hdzl4ea">
                {t("templates.customizer.duration")}
              </Label>
              <Slider
                value={[currentCell.animation?.enter?.duration || 300]}
                onValueChange={(val) => handleAnimationDurationChange(val, "enter")}
                min={0}
                max={1000}
                step={50}
                className="flex-1"
                data-oid="2xv7_p2"
              />

              <span className="w-16 text-sm" data-oid="f.qobtp">
                {currentCell.animation?.enter?.duration || 300}ms
              </span>
            </div>
          </div>

          {/* Анимация исчезновения */}
          <div className="space-y-2" data-oid="xrw9nc1">
            <Label data-oid="2hlztij">{t("templates.customizer.exitAnimation")}</Label>
            <Select
              value={currentCell.animation?.exit?.type || "fade"}
              onValueChange={(val) => handleAnimationTypeChange(val as AnimationType, "exit")}
              data-oid=".xq5.ks"
            >
              <SelectTrigger data-oid="7.jr7_j">
                <SelectValue data-oid="0hkvx--" />
              </SelectTrigger>
              <SelectContent data-oid="t._f52s">
                <SelectItem value="fade" data-oid="pnqik2.">
                  {t("templates.customizer.animations.fade")}
                </SelectItem>
                <SelectItem value="slide-left" data-oid="-b9cb41">
                  {t("templates.customizer.animations.slideLeft")}
                </SelectItem>
                <SelectItem value="slide-right" data-oid="rbpuuui">
                  {t("templates.customizer.animations.slideRight")}
                </SelectItem>
                <SelectItem value="slide-up" data-oid="zfvw3qu">
                  {t("templates.customizer.animations.slideUp")}
                </SelectItem>
                <SelectItem value="slide-down" data-oid="4b8e7rp">
                  {t("templates.customizer.animations.slideDown")}
                </SelectItem>
                <SelectItem value="zoom-in" data-oid="jniqofp">
                  {t("templates.customizer.animations.zoomIn")}
                </SelectItem>
                <SelectItem value="zoom-out" data-oid="hvbmw93">
                  {t("templates.customizer.animations.zoomOut")}
                </SelectItem>
                <SelectItem value="none" data-oid="u-4l4i:">
                  {t("templates.customizer.animations.none")}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4" data-oid="1:f1mnw">
              <Label className="w-20" data-oid="h8sb15y">
                {t("templates.customizer.duration")}
              </Label>
              <Slider
                value={[currentCell.animation?.exit?.duration || 200]}
                onValueChange={(val) => handleAnimationDurationChange(val, "exit")}
                min={0}
                max={1000}
                step={50}
                className="flex-1"
                data-oid="4r7i9z9"
              />

              <span className="w-16 text-sm" data-oid="7.e17.v">
                {currentCell.animation?.exit?.duration || 200}ms
              </span>
            </div>
          </div>

          {/* Анимация переходов */}
          <div className="space-y-2" data-oid="jao406g">
            <Label data-oid="zlejp_j">{t("templates.customizer.transitionAnimation")}</Label>
            <Select
              value={currentCell.animation?.transition?.type || "fade"}
              onValueChange={(val) => handleAnimationTypeChange(val as AnimationType, "transition")}
              data-oid="g.uo6:4"
            >
              <SelectTrigger data-oid="s-ru68m">
                <SelectValue data-oid="ffoilt7" />
              </SelectTrigger>
              <SelectContent data-oid="p0xbyhc">
                <SelectItem value="fade" data-oid="omqx2gz">
                  {t("templates.customizer.animations.fade")}
                </SelectItem>
                <SelectItem value="slide-left" data-oid="j.mc-94">
                  {t("templates.customizer.animations.slideLeft")}
                </SelectItem>
                <SelectItem value="slide-right" data-oid="2e_8ov_">
                  {t("templates.customizer.animations.slideRight")}
                </SelectItem>
                <SelectItem value="slide-up" data-oid="4s:02zw">
                  {t("templates.customizer.animations.slideUp")}
                </SelectItem>
                <SelectItem value="slide-down" data-oid="5elsl-p">
                  {t("templates.customizer.animations.slideDown")}
                </SelectItem>
                <SelectItem value="zoom-in" data-oid="ffqvy_y">
                  {t("templates.customizer.animations.zoomIn")}
                </SelectItem>
                <SelectItem value="zoom-out" data-oid="dv8sn63">
                  {t("templates.customizer.animations.zoomOut")}
                </SelectItem>
                <SelectItem value="none" data-oid="u461r4g">
                  {t("templates.customizer.animations.none")}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-4" data-oid="pdz.-ki">
              <Label className="w-20" data-oid="w3gzbib">
                {t("templates.customizer.duration")}
              </Label>
              <Slider
                value={[currentCell.animation?.transition?.duration || 250]}
                onValueChange={(val) => handleAnimationDurationChange(val, "transition")}
                min={0}
                max={1000}
                step={50}
                className="flex-1"
                data-oid="gdagat-"
              />

              <span className="w-16 text-sm" data-oid="ozq7v_a">
                {currentCell.animation?.transition?.duration || 250}ms
              </span>
            </div>
          </div>
        </TabsContent>

        {/* Макет */}
        <TabsContent value="layout" className="space-y-4" data-oid="omd9z78">
          <p className="text-sm text-muted-foreground" data-oid="02vtdcg">
            {t("templates.customizer.layoutDescription")}
          </p>
          {/* Здесь можно добавить настройки для cellLayouts, если нужно */}
        </TabsContent>
      </Tabs>

      {/* Сохранение кастомного шаблона */}
      {onSave && (
        <div className="space-y-2 border-t pt-4" data-oid="a8it4:u">
          <Label htmlFor="template-name" data-oid="bz6j6rf">
            {t("templates.customizer.saveName")}
          </Label>
          <div className="flex gap-2" data-oid="i1_roks">
            <Input
              id="template-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("templates.customizer.saveNamePlaceholder")}
              data-oid="t9x1r.x"
            />

            <Button onClick={handleSaveCustomTemplate} disabled={!customName.trim()} data-oid="zmij0ut">
              {t("templates.customizer.save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

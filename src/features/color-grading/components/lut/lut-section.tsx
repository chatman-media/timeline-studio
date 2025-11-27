import { RefreshCw, Upload, X } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { container } from "@/core"
import { createLogger } from "@/lib/tauri-logger"
import { useColorGrading } from "../../services/color-grading-provider"
import { ParameterSlider } from "../controls/parameter-slider"

const logger = createLogger({ module: "LutSection" })

// Предустановленные LUT
const PRESET_LUTS = [
  { id: "none", name: "None", category: "default" },
  // Film Emulation
  { id: "film-kodak-2383", name: "Kodak 2383", category: "film" },
  { id: "film-fuji-3510", name: "Fuji 3510", category: "film" },
  { id: "film-kodak-5218", name: "Kodak 5218", category: "film" },
  // Creative Looks
  { id: "orange-teal", name: "Orange & Teal", category: "creative" },
  { id: "day-for-night", name: "Day for Night", category: "creative" },
  { id: "vintage-fade", name: "Vintage Fade", category: "creative" },
  { id: "moody-blue", name: "Moody Blue", category: "creative" },
  // Technical
  { id: "bw-contrast", name: "B&W High Contrast", category: "technical" },
  {
    id: "rec709-to-rec2020",
    name: "Rec.709 to Rec.2020",
    category: "technical",
  },
  { id: "log-to-rec709", name: "Log to Rec.709", category: "technical" },
]

// Миниатюры для превью
const PREVIEW_INTENSITIES = [0, 25, 50, 75, 100]

export function LUTSection() {
  const { t } = useTranslation()
  const { state, dispatch } = useColorGrading()
  const [selectedLUT, setSelectedLUT] = useState<string>(state.lut.file || "none")
  const [customLUTs, setCustomLUTs] = useState<Array<{ id: string; name: string; path: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  // Объединяем предустановленные и кастомные LUT
  const allLUTs = useMemo(() => {
    const grouped: Record<string, typeof PRESET_LUTS> = {
      film: [],
      creative: [],
      technical: [],
      custom: [],
    }

    PRESET_LUTS.forEach((lut) => {
      if (lut.category !== "default") {
        grouped[lut.category].push(lut)
      }
    })

    customLUTs.forEach((lut) => {
      grouped.custom.push({ ...lut, category: "custom" })
    })

    return grouped
  }, [customLUTs])

  // Обработчик выбора LUT
  const handleLUTChange = useCallback(
    (lutId: string) => {
      setSelectedLUT(lutId)

      if (lutId === "none") {
        dispatch({ type: "TOGGLE_LUT", enabled: false })
        dispatch({ type: "LOAD_LUT", file: null })
      } else {
        dispatch({ type: "LOAD_LUT", file: lutId })
        dispatch({ type: "TOGGLE_LUT", enabled: true })
      }
    },
    [dispatch],
  )

  // Обработчик изменения интенсивности
  const handleIntensityChange = useCallback(
    (value: number) => {
      dispatch({ type: "SET_LUT_INTENSITY", value })
    },
    [dispatch],
  )

  // Обработчик переключения LUT
  const handleToggleLUT = useCallback(
    (checked: boolean) => {
      dispatch({ type: "TOGGLE_LUT", enabled: checked })
    },
    [dispatch],
  )

  // Импорт .cube файла
  const handleImportLUT = useCallback(async () => {
    if (!platform) {
      logger.error("Platform service not available", {})
      return
    }

    try {
      setIsLoading(true)
      const selected = await platform.showOpenDialog({
        multiple: false,
        filters: [
          {
            name: "LUT Files",
            extensions: ["cube", "3dl", "dat", "look", "mga", "m3d"],
          },
        ],
      })

      if (selected && selected.length > 0) {
        const filePath = selected[0]
        // В реальном приложении здесь будет парсинг файла через Tauri команду
        const fileName = filePath.split("/").pop() || "Custom LUT"
        const newLUT = {
          id: `custom-${Date.now()}`,
          name: fileName.replace(/\.(cube|3dl|dat|look|mga|m3d)$/i, ""),
          path: filePath,
        }

        setCustomLUTs([...customLUTs, newLUT])
        handleLUTChange(newLUT.id)
      }
    } catch (error) {
      logger.error("Error importing LUT", { error })
    } finally {
      setIsLoading(false)
    }
  }, [customLUTs, handleLUTChange, platform])

  // Удаление кастомного LUT
  const handleRemoveCustomLUT = useCallback(
    (lutId: string) => {
      setCustomLUTs(customLUTs.filter((lut) => lut.id !== lutId))
      if (selectedLUT === lutId) {
        handleLUTChange("none")
      }
    },
    [customLUTs, selectedLUT, handleLUTChange],
  )

  // Обновление превью
  const handleRefreshPreviews = useCallback(() => {
    // В реальном приложении здесь будет обновление превью через WebGL
    logger.info("Refreshing LUT previews...")
  }, [])

  return (
    <div className="space-y-4" data-testid="lut-section">
      {/* Заголовок секции */}
      <div className="text-sm text-muted-foreground">
        {t("colorGrading.lut.description", "Apply professional color looks with LUT files")}
      </div>

      {/* Выбор LUT файла */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground/90">{t("colorGrading.lut.file", "LUT File")}</Label>
        <div className="flex items-center gap-2">
          <Select value={selectedLUT} onValueChange={handleLUTChange}>
            <SelectTrigger className="flex-1 h-8">
              <SelectValue placeholder={t("colorGrading.lut.selectFile", "Select LUT")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("colorGrading.lut.none", "None")}</SelectItem>

              {/* Film Emulation категория */}
              {allLUTs.film.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Film Emulation</div>
                  {allLUTs.film.map((lut) => (
                    <SelectItem key={lut.id} value={lut.id}>
                      {lut.name}
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Creative категория */}
              {allLUTs.creative.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Creative Looks</div>
                  {allLUTs.creative.map((lut) => (
                    <SelectItem key={lut.id} value={lut.id}>
                      {lut.name}
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Technical категория */}
              {allLUTs.technical.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Technical</div>
                  {allLUTs.technical.map((lut) => (
                    <SelectItem key={lut.id} value={lut.id}>
                      {lut.name}
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Custom LUTs */}
              {allLUTs.custom.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Custom LUTs</div>
                  {allLUTs.custom.map((lut) => (
                    <SelectItem key={lut.id} value={lut.id}>
                      {lut.name}
                      {lut.category === "custom" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-4 w-4 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveCustomLUT(lut.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-8 px-3" onClick={handleImportLUT} disabled={isLoading}>
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Enable/Disable переключатель */}
      {selectedLUT !== "none" && (
        <div className="flex items-center justify-between">
          <Label htmlFor="lut-enable" className="text-sm">
            {t("colorGrading.lut.enable", "Enable LUT")}
          </Label>
          <Switch checked={state.lut.isEnabled} onCheckedChange={handleToggleLUT} />
        </div>
      )}

      {/* Слайдер интенсивности */}
      {selectedLUT !== "none" && (
        <ParameterSlider
          label={t("colorGrading.lut.intensity", "Intensity")}
          value={state.lut.intensity}
          onChange={handleIntensityChange}
          min={0}
          max={100}
          defaultValue={100}
          formatValue={(v) => `${v}%`}
          disabled={!state.lut.isEnabled}
        />
      )}

      {/* Превью эффектов */}
      {selectedLUT !== "none" && state.lut.isEnabled && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{t("colorGrading.lut.preview", "Preview")}</span>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleRefreshPreviews}>
              <RefreshCw className="h-3 w-3 mr-1" />
              <span className="text-xs">{t("colorGrading.lut.refresh", "Refresh")}</span>
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {PREVIEW_INTENSITIES.map((intensity) => (
              <div key={intensity} className="relative group">
                <div className="aspect-video bg-muted rounded overflow-hidden">
                  {/* В реальном приложении здесь будет реальное превью с WebGL */}
                  <div
                    className="w-full h-full bg-linear-to-br from-blue-900 to-purple-900"
                    style={{ opacity: 0.3 + (intensity / 100) * 0.7 }}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 text-center py-0.5">
                  <span className="text-[10px] text-foreground">{intensity === 0 ? "Original" : `${intensity}%`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информация о поддерживаемых форматах */}
      <div className="text-xs text-muted-foreground/70 pt-2">
        {t("colorGrading.lut.supportedFormats", "Supported formats: .cube, .3dl, .dat, .look, .mga, .m3d")}
      </div>
    </div>
  )
}

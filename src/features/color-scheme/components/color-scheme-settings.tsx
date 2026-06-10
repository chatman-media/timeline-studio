"use client"

import { Check, Download, Plus, Star, Trash2, Upload } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { container } from "@timeline-studio/core"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useColorScheme } from "../hooks/use-color-scheme"
import { buildCustomScheme, isValidColorScheme, schemePreviewColor } from "../lib"
import type { ColorScheme, ThemeMode } from "../types"

const logger = createLogger({ module: "ColorSchemeSettings" })

const THEME_MODES: ThemeMode[] = ["light", "dark", "system"]

/**
 * Панель настроек внешнего вида: режим темы, выбор цветовой схемы,
 * создание/импорт/экспорт пользовательских схем и редактирование быстрого доступа.
 */
export function ColorSchemeSettings() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const {
    themeMode,
    setThemeMode,
    activeSchemeId,
    allSchemes,
    customSchemes,
    quickAccessIds,
    setColorScheme,
    addCustomScheme,
    removeCustomScheme,
    toggleQuickAccess,
  } = useColorScheme()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? resolvedTheme === "dark" : false

  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#14b8a6")
  const [error, setError] = useState<string | null>(null)

  const schemeLabel = (scheme: ColorScheme) => (scheme.isBuiltin ? t(scheme.name) : scheme.name)

  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  const handleCreate = () => {
    setError(null)
    const name = newName.trim()
    if (!name) {
      setError(t("colorScheme.errors.nameRequired", "Введите имя схемы"))
      return
    }
    const id = `custom-${crypto.randomUUID()}`
    const scheme = buildCustomScheme(id, name, newColor)
    if (!scheme) {
      setError(t("colorScheme.errors.invalidColor", "Некорректный цвет"))
      return
    }
    addCustomScheme(scheme)
    setColorScheme(id)
    setNewName("")
  }

  const handleImport = () => {
    setError(null)
    void (async () => {
      if (!platform) return
      try {
        const selected = await platform.showOpenDialog({
          multiple: false,
          title: t("colorScheme.import", "Импорт схемы"),
          filters: [{ name: "Color Scheme", extensions: ["json"] }],
        })
        if (!selected || selected.length === 0) return
        const content = await platform.readTextFile(selected[0])
        const parsed = JSON.parse(content)
        if (!isValidColorScheme(parsed)) {
          setError(t("colorScheme.errors.invalidFile", "Файл не является цветовой схемой"))
          return
        }
        // Гарантируем уникальный id и пометку пользовательской схемы
        const scheme: ColorScheme = {
          ...parsed,
          id: `custom-${crypto.randomUUID()}`,
          isBuiltin: false,
        }
        addCustomScheme(scheme)
        setColorScheme(scheme.id)
      } catch (e) {
        logger.errorSync("Failed to import color scheme", { error: e })
        setError(t("colorScheme.errors.importFailed", "Не удалось импортировать схему"))
      }
    })()
  }

  const handleExport = (scheme: ColorScheme) => {
    void (async () => {
      if (!platform) return
      try {
        const path = await platform.showSaveDialog({
          title: t("colorScheme.export", "Экспорт схемы"),
          defaultPath: `${scheme.id}.json`,
          filters: [{ name: "Color Scheme", extensions: ["json"] }],
        })
        if (!path) return
        await platform.writeTextFile(path, JSON.stringify(scheme, null, 2))
      } catch (e) {
        logger.errorSync("Failed to export color scheme", { error: e })
      }
    })()
  }

  return (
    <div className="space-y-6">
      {/* Режим темы */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("colorScheme.themeMode", "Режим темы")}</Label>
        <Select value={themeMode} onValueChange={(v) => setThemeMode(v as ThemeMode)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {t(`colorScheme.modes.${mode}`, mode)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Выбор цветовой схемы */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("colorScheme.schemes", "Цветовые схемы")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("colorScheme.quickAccessHint", "Отметьте звёздочкой схемы для быстрого доступа в верхней панели")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {allSchemes.map((scheme) => {
            const isActive = scheme.id === activeSchemeId
            const inQuick = quickAccessIds.includes(scheme.id)
            return (
              <div
                key={scheme.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border p-2 transition-colors",
                  isActive ? "border-teal ring-1 ring-teal" : "border-border hover:bg-accent",
                )}
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 cursor-pointer text-left"
                  onClick={() => setColorScheme(scheme.id)}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: schemePreviewColor(scheme, isDark) }}
                  />
                  <span className="flex-1 truncate text-sm">{schemeLabel(scheme)}</span>
                  {isActive && <Check className="h-4 w-4 shrink-0 text-teal" />}
                </button>
                <button
                  type="button"
                  className="cursor-pointer p-0.5"
                  title={t("colorScheme.toggleQuickAccess", "Быстрый доступ")}
                  onClick={() => toggleQuickAccess(scheme.id)}
                >
                  <Star className={cn("h-4 w-4", inQuick ? "fill-teal text-teal" : "text-muted-foreground")} />
                </button>
                {!scheme.isBuiltin && (
                  <>
                    <button
                      type="button"
                      className="cursor-pointer p-0.5 text-muted-foreground hover:text-foreground"
                      title={t("colorScheme.export", "Экспорт схемы")}
                      onClick={() => handleExport(scheme)}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer p-0.5 text-muted-foreground hover:text-destructive"
                      title={t("colorScheme.delete", "Удалить схему")}
                      onClick={() => removeCustomScheme(scheme.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Создание / импорт пользовательской схемы */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("colorScheme.createCustom", "Своя цветовая схема")}</Label>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="custom-scheme-name" className="text-xs text-muted-foreground">
              {t("colorScheme.name", "Название")}
            </Label>
            <Input
              id="custom-scheme-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("colorScheme.namePlaceholder", "Моя схема")}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="custom-scheme-color" className="text-xs text-muted-foreground">
              {t("colorScheme.accentColor", "Акцент")}
            </Label>
            <input
              id="custom-scheme-color"
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            {t("colorScheme.add", "Добавить")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1"
            onClick={handleImport}
            disabled={!platform}
            title={t("colorScheme.import", "Импорт схемы")}
          >
            <Upload className="h-4 w-4" />
            {t("colorScheme.import", "Импорт")}
          </Button>
        </div>
        {customSchemes.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("colorScheme.noCustom", "Пользовательских схем пока нет")}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

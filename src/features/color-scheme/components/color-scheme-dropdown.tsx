"use client"

import { Check, Palette, Settings2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModals } from "@/domains/system-integration"
import { useColorScheme } from "../hooks/use-color-scheme"
import { schemePreviewColor } from "../lib"
import type { ColorScheme } from "../types"

const TOP_BAR_BUTTON_CLASS = "hover:bg-[#D1D1D1] dark:hover:bg-[#464747] h-6 w-6 cursor-pointer m-0.5 p-0"

/**
 * Выпадающий список цветовых схем рядом с переключателем темы.
 * Показывает схемы быстрого доступа и ссылку на управление в настройках.
 */
export function ColorSchemeDropdown() {
  const { t } = useTranslation()
  const { openModal } = useModals()
  const { resolvedTheme } = useTheme()
  const { activeSchemeId, quickAccessSchemes, setColorScheme } = useColorScheme()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? resolvedTheme === "dark" : false

  const schemeLabel = (scheme: ColorScheme) => (scheme.isBuiltin ? t(scheme.name) : scheme.name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={TOP_BAR_BUTTON_CLASS}
          title={t("colorScheme.title", "Цветовая схема")}
          data-testid="color-scheme-button"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t("colorScheme.title", "Цветовая схема")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {quickAccessSchemes.length === 0 ? (
          <DropdownMenuItem disabled>{t("colorScheme.noQuickAccess", "Нет схем в быстром доступе")}</DropdownMenuItem>
        ) : (
          quickAccessSchemes.map((scheme) => (
            <DropdownMenuItem
              key={scheme.id}
              onClick={() => setColorScheme(scheme.id)}
              className="flex items-center gap-2"
            >
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: schemePreviewColor(scheme, isDark) }}
              />
              <span className="flex-1 truncate">{schemeLabel(scheme)}</span>
              {scheme.id === activeSchemeId && <Check className="h-4 w-4 text-teal" />}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openModal("user-settings")} className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          {t("colorScheme.manage", "Управление схемами…")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

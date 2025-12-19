import { Printer } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useShortcuts } from "../services/shortcuts-provider"
import { shortcutsRegistry } from "../services/shortcuts-registry"

/**
 * Компонент для отображения всех shortcuts в виде cheat sheet
 */
export function ShortcutsCheatSheet() {
  const { t } = useTranslation()
  const { shortcuts } = useShortcuts()

  // Группируем shortcuts по категориям
  const shortcutsByCategory = useMemo(() => {
    const categories = shortcutsRegistry.getCategories()
    return categories.map((category) => ({
      ...category,
      shortcuts: shortcuts.filter((s) => s.category === category.id && s.enabled),
    }))
  }, [shortcuts])

  // Обработчик печати
  const handlePrint = () => {
    window.print()
  }

  // Форматирование клавиш для отображения
  const formatKeys = (keys: string[]): string => {
    return keys[0] || ""
  }

  return (
    <div className="space-y-4 p-4" data-oid="g5qt9m6">
      <div className="flex items-center justify-between" data-oid="v-mu97v">
        <div data-oid="v8v8-fq">
          <h2 className="text-2xl font-bold" data-oid=".5mvj1k">
            {t("dialogs.keyboardShortcuts.cheatSheet", "Шпаргалка по горячим клавишам")}
          </h2>
          <p className="text-sm text-muted-foreground" data-oid="mheyw-i">
            {t("dialogs.keyboardShortcuts.cheatSheetDescription", "Все доступные клавиатурные сочетания")}
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" data-oid="t_e_ndo">
          <Printer className="mr-2 h-4 w-4" data-oid="8bfner_" />
          {t("dialogs.keyboardShortcuts.print", "Печать")}
        </Button>
      </div>

      <div className="grid gap-4 print:gap-2" data-oid="1gi618c">
        {shortcutsByCategory
          .filter((category) => category.shortcuts.length > 0)
          .map((category) => (
            <Card key={category.id} className="print:break-inside-avoid" data-oid="ig68cc0">
              <CardHeader className="pb-3" data-oid="mvo4kxx">
                <CardTitle className="text-lg" data-oid="r7dmqei">
                  {category.name}
                </CardTitle>
                <CardDescription data-oid=".1hyzqb">
                  {t(`dialogs.keyboardShortcuts.categories.${category.id}Description`, "")}
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="x1gjunj">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-oid=".48_:5z">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between rounded-lg border p-2 print:border-gray-300"
                      data-oid="xuh:roh"
                    >
                      <span className="text-sm font-medium" data-oid="qx2x_7t">
                        {shortcut.name}
                      </span>
                      <kbd
                        className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
                        data-oid="lz3kmz8"
                      >
                        {formatKeys(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Стили для печати */}
      <style jsx data-oid="59yh08_">{`
        @media print {
          @page {
            margin: 1cm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid;
          }

          .print\\:gap-2 {
            gap: 0.5rem;
          }

          .print\\:border-gray-300 {
            border-color: #d1d5db;
          }

          button {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

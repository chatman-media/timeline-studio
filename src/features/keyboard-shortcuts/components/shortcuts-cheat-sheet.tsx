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
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("dialogs.keyboardShortcuts.cheatSheet", "Шпаргалка по горячим клавишам")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("dialogs.keyboardShortcuts.cheatSheetDescription", "Все доступные клавиатурные сочетания")}
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          {t("dialogs.keyboardShortcuts.print", "Печать")}
        </Button>
      </div>

      <div className="grid gap-4 print:gap-2">
        {shortcutsByCategory
          .filter((category) => category.shortcuts.length > 0)
          .map((category) => (
            <Card key={category.id} className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <CardDescription>
                  {t(`dialogs.keyboardShortcuts.categories.${category.id}Description`, "")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between rounded-lg border p-2 print:border-gray-300"
                    >
                      <span className="text-sm font-medium">{shortcut.name}</span>
                      <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
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
      <style jsx>{`
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

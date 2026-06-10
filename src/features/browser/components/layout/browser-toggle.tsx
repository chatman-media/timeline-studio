import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { useUserSettings } from "@/features/user-settings"

/**
 * Компонент для переключения видимости браузера
 * Отображает кнопку со стрелкой влево/вправо в зависимости от текущего состояния
 */
export function BrowserToggle() {
  const { t } = useTranslation()
  const { isBrowserVisible, toggleBrowserVisibility } = useUserSettings()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={"transition-all duration-300 hover:bg-secondary h-7 w-7 cursor-pointer p-0"}
      onClick={toggleBrowserVisibility}
      title={isBrowserVisible ? t("browser.hide") : t("browser.show")}
      data-oid="a-dg5wn"
    >
      {isBrowserVisible ? (
        <PanelLeftClose size={16} data-oid="javakya" />
      ) : (
        <PanelLeftOpen size={16} data-oid="w8w88av" />
      )}
    </Button>
  )
}

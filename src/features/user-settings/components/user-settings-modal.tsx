import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { useModal } from "@/features/modals/services/modal-provider"
import { createLogger } from "@/lib/tauri-logger"
import { UserSettingsModalTabs } from "./user-settings-modal-tabs"

const logger = createLogger({ module: "UserSettingsModal" })

/**
 * Модальное окно пользовательских настроек с вкладками
 * Позволяет пользователю настраивать различные параметры приложения:
 * - Общие настройки (язык, пути, производительность)
 * - AI сервисы (OpenAI, Claude)
 * - Социальные сети (YouTube, TikTok, Vimeo, Telegram)
 * - Разработка (Codecov, Analytics)
 *
 * @returns {JSX.Element} Компонент модального окна настроек пользователя
 */
export function UserSettingsModal() {
  const { closeModal } = useModal()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      {/* Основное содержимое с вкладками */}
      <div className="flex-1 min-h-0">
        <UserSettingsModalTabs />
      </div>

      {/* Кнопки действий в нижней части модального окна */}
      <DialogFooter className="flex justify-between space-x-4 mt-4 pt-4 border-t">
        {/* Кнопка отмены */}
        <Button variant="default" className="flex-1 cursor-pointer" onClick={() => closeModal()}>
          {t("dialogs.userSettings.cancel")}
        </Button>

        {/* Кнопка сохранения */}
        <Button
          variant="default"
          className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
          onClick={() => {
            // Все изменения уже применены в реальном времени, просто закрываем модальное окно
            logger.info("Closing modal with save button, all changes already applied")
            closeModal()
          }}
        >
          {t("dialogs.userSettings.save")}
        </Button>
      </DialogFooter>
    </div>
  )
}

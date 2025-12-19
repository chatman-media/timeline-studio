import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

/**
 * Вкладка настроек социальных сетей
 * Управление OAuth ключами для различных платформ
 */
export function SocialNetworksTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6" data-oid="7624ln4">
      {/* Заголовок и описание */}
      <div className="space-y-2" data-oid="2eggs9d">
        <h3 className="text-lg font-semibold" data-oid="s.c_bfr">
          {t("dialogs.userSettings.tabs.socialNetworks", "Социальные сети")}
        </h3>
        <p className="text-sm text-muted-foreground" data-oid="eqz89t4">
          {t(
            "dialogs.userSettings.socialNetworksDescription",
            "Настройте OAuth подключения для автоматической публикации видео в социальных сетях.",
          )}
        </p>
      </div>

      <Separator data-oid="3zufmi9" />

      {/* YouTube, TikTok, Vimeo и Telegram подключения - временная заглушка */}
      <div className="flex flex-col items-center justify-center py-12 space-y-4" data-oid="y-pr7ta">
        <div className="text-center space-y-2" data-oid="7r3s53.">
          <h4 className="text-lg font-medium text-muted-foreground" data-oid="te:ol4g">
            {t("dialogs.userSettings.comingSoon", "Скоро")}
          </h4>
          <p className="text-sm text-muted-foreground max-w-md" data-oid="9d-h3r-">
            {t(
              "dialogs.userSettings.socialNetworksComingSoon",
              "OAuth интеграция с социальными сетями будет доступна в следующих обновлениях. Пока API ключи сохраняются в зашифрованном виде.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center" data-oid="q1upsc6">
          <Button variant="outline" size="sm" disabled data-oid="b4yenq4">
            YouTube
          </Button>
          <Button variant="outline" size="sm" disabled data-oid="q9bu.bu">
            TikTok
          </Button>
          <Button variant="outline" size="sm" disabled data-oid="a.gd2v0">
            Vimeo
          </Button>
          <Button variant="outline" size="sm" disabled data-oid="7:0ue_r">
            Telegram
          </Button>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-6 p-4 bg-muted/50 rounded-md" data-oid="19.55a2">
        <h4 className="text-sm font-medium mb-2" data-oid="lyekqap">
          {t("dialogs.userSettings.currentImplementation", "Текущая реализация")}
        </h4>
        <p className="text-xs text-muted-foreground" data-oid="g0:j0q2">
          {t(
            "dialogs.userSettings.currentImplementationText",
            "Система безопасного хранения API ключей готова. OAuth интеграция и UI для социальных сетей находятся в разработке.",
          )}
        </p>
      </div>
    </div>
  )
}
